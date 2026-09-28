import type { StationKind } from '../../domain/engineering';
import type { DesResult, ServerState, TraceEvent } from '../sim/des';
import type { Resolved } from '../sim/model';
import type { MachineModel } from './machine';
import { axisPositionAt, type PlannedMove } from './motion';

/*
 * SEQUENCE + CENTRAL SIMULATION STATE (3D master prompt §40–§46, §69, §127–§129).
 *
 * One canonical run — the seeded discrete-event simulation (services/sim/des) — drives everything:
 * the 3D scene, event log, KPIs, HMI and alarms all read `TwinPlayer.at(t)`. Inside a station, the
 * time is split into sub-steps only where the data allows it: axis moves (calculated from the axis
 * model), the laser jump overhead (entered), and the remainder labelled with the station's own basis.
 * Nothing is subdivided by an invented ratio.
 */

export type EventType = 'PART_ARRIVAL' | 'PART_LOAD' | 'CLAMP' | 'VISION_TRIGGER' | 'VISION_COMPLETE' | 'MOVE_START' | 'MOVE_COMPLETE' | 'LASER_START' | 'LASER_COMPLETE' | 'INSPECTION' | 'UNLOAD' | 'SORT' | 'PROCESS' | 'FAULT' | 'RESET' | 'BLOCKED' | 'STARVED';

export type StepKind = 'move' | 'load' | 'clamp' | 'vision' | 'laser_prep' | 'laser' | 'inspect' | 'sort' | 'unload' | 'process';

export interface SubStep {
  name: string;
  kind: StepKind;
  start: number;
  dur: number;
  startEvent: EventType;
  endEvent?: EventType;
  basis: string;
  move?: PlannedMove;
}

const KIND_STEP: Record<StationKind, { kind: StepKind; name: string; start: EventType; end?: EventType }> = {
  load: { kind: 'load', name: 'Load part', start: 'PART_LOAD' },
  buffer: { kind: 'process', name: 'Buffer transfer', start: 'PROCESS' },
  fixture: { kind: 'clamp', name: 'Clamp', start: 'CLAMP' },
  align: { kind: 'vision', name: 'Vision alignment (capture + processing)', start: 'VISION_TRIGGER', end: 'VISION_COMPLETE' },
  vision: { kind: 'vision', name: 'Vision (capture + processing)', start: 'VISION_TRIGGER', end: 'VISION_COMPLETE' },
  motion: { kind: 'process', name: 'Motion', start: 'PROCESS' },
  process: { kind: 'process', name: 'Process', start: 'PROCESS' },
  laser: { kind: 'laser', name: 'Laser process', start: 'LASER_START', end: 'LASER_COMPLETE' },
  inspect: { kind: 'inspect', name: 'Inspection', start: 'INSPECTION' },
  sort: { kind: 'sort', name: 'OK / NG decision', start: 'SORT' },
  unload: { kind: 'unload', name: 'Unload part', start: 'UNLOAD' },
  transfer: { kind: 'process', name: 'Transfer', start: 'PROCESS' },
  assembly: { kind: 'process', name: 'Assembly', start: 'PROCESS' },
  test: { kind: 'inspect', name: 'Test', start: 'INSPECTION' },
  manual: { kind: 'process', name: 'Manual operation', start: 'PROCESS' },
};

/** Sub-steps of one station for its MEAN time (scaled to the sampled time during playback). */
export function stationSteps(res: Resolved, i: number, model: MachineModel): SubStep[] {
  const rs = res.stations[i];
  if (rs.time == null) return [];
  const st = rs.station;
  const moves = model.plan.filter((m) => m.stationKey === st.key);
  const steps: SubStep[] = [];
  let t = 0;
  for (const m of moves) {
    const d = m.time ?? 0;
    steps.push({ name: m.label, kind: 'move', start: t, dur: d, startEvent: 'MOVE_START', endEvent: 'MOVE_COMPLETE', basis: 'Calculated (axis model)', move: m });
    t += d;
  }
  let rest = Math.max(0, rs.time - t);
  const k = KIND_STEP[st.kind];
  if (st.kind === 'laser' && st.laser?.jump_overhead_s != null && st.laser.jump_overhead_s < rest) {
    steps.push({ name: 'Laser enable · jumps / overhead', kind: 'laser_prep', start: t, dur: st.laser.jump_overhead_s, startEvent: 'PROCESS', basis: 'Entered (jump overhead)' });
    t += st.laser.jump_overhead_s;
    rest -= st.laser.jump_overhead_s;
  }
  steps.push({ name: k.name, kind: k.kind, start: t, dur: rest, startEvent: k.start, endEvent: k.end, basis: rs.basis === 'CALCULATED' ? 'Calculated (laser process)' : rs.basis === 'DEMO' ? 'DEMO station time' : `${rs.basis.toLowerCase().replace('_', ' ')} station time` });
  return steps;
}

export type MachineState = 'Idle' | 'Loading' | 'Ready' | 'Aligning' | 'Processing' | 'Inspection' | 'Unloading' | 'Blocked' | 'Starved' | 'Fault' | 'Maintenance' | 'Emergency' | 'Moving';

export interface StationNow {
  key: string;
  /** ng = the part on this server is rejected at this station in this run (drives the NG diverter) */
  servers: { state: ServerState; part: number; progress: number; step: SubStep | null; stepProgress: number; since: number; end: number; ng: boolean }[];
  queue: number;
}

export interface TwinEvent {
  t: number;
  type: EventType;
  station: string;
  part?: number;
  text: string;
  severity?: 'info' | 'warn' | 'fault';
}

export interface SimulationState {
  t: number;
  machineState: MachineState;
  stations: StationNow[];
  axes: Record<string, number>;
  axisVel: Record<string, number>;
  laserOn: boolean[];
  /** 0–1 progress of the current laser process step per laser station index */
  scan: number[];
  visionActive: Record<string, boolean>;
  ok: number;
  ng: number;
  inSystem: number;
  cycles: number;
  alarms: { t: number; station: string; text: string }[];
  uphSoFar: number | null;
}

interface BusySpan {
  st: number;
  sv: number;
  part: number;
  t0: number;
  t1: number;
}

/** Deterministic player over one DES run: same run + same t → same state (§129). */
export class TwinPlayer {
  readonly spans: BusySpan[];
  readonly steps: SubStep[][];
  readonly events: TwinEvent[];
  readonly end: number;
  /** part id → index of the station that rejected it (from the run's trace, never invented) */
  readonly rejectAt = new Map<number, number>();
  private shape: number[];
  constructor(
    readonly res: Resolved,
    readonly des: DesResult,
    readonly model: MachineModel,
    faultNames: Record<string, string> = {},
  ) {
    this.shape = des.stations.map((s) => s.servers);
    this.steps = res.stations.map((_, i) => stationSteps(res, i, model));
    const tr = des.trace;
    this.end = tr.length ? tr[tr.length - 1].t : 0;
    // busy spans: a 'busy' state until the next state change of that server
    const open = new Map<string, BusySpan>();
    const spans: BusySpan[] = [];
    const events: TwinEvent[] = [];
    const downOpen = new Map<string, number>();
    for (const e of tr) {
      if (e.type === 'enter') events.push({ t: e.t, type: 'PART_ARRIVAL', station: res.stations[0]?.station.key ?? '', part: e.part, text: `Part ${e.part ?? ''} arrives` });
      if (e.type !== 'state' || e.sv == null) continue;
      const k = `${e.st}:${e.sv}`;
      const prev = open.get(k);
      if (prev) {
        prev.t1 = e.t;
        spans.push(prev);
        open.delete(k);
      }
      if (e.state === 'busy') open.set(k, { st: e.st, sv: e.sv, part: e.part ?? -1, t0: e.t, t1: Infinity });
      const stKey = res.stations[e.st]?.station.key ?? String(e.st);
      if (e.state === 'down' && !downOpen.has(k)) {
        downOpen.set(k, e.t);
        events.push({ t: e.t, type: 'FAULT', station: stKey, text: `${faultNames[stKey] ?? 'Station down'} — ${res.stations[e.st]?.station.name}`, severity: 'fault' });
      } else if (e.state !== 'down' && downOpen.has(k)) {
        downOpen.delete(k);
        events.push({ t: e.t, type: 'RESET', station: stKey, text: `${res.stations[e.st]?.station.name} restored`, severity: 'info' });
      }
      if (e.state === 'blocked') events.push({ t: e.t, type: 'BLOCKED', station: stKey, part: e.part, text: `${res.stations[e.st]?.station.name} blocked (downstream full)`, severity: 'warn' });
    }
    for (const s of open.values()) spans.push({ ...s, t1: Math.max(s.t0, this.end) });
    spans.sort((a, b) => a.t0 - b.t0);
    this.spans = spans;
    // sub-step events for every busy span, scaled to the sampled duration
    for (const s of spans) {
      const steps = this.steps[s.st];
      const mean = steps.reduce((n, x) => n + x.dur, 0) || 1;
      const k = (s.t1 - s.t0) / mean;
      const stKey = res.stations[s.st].station.key;
      for (const x of steps) {
        const t = s.t0 + x.start * k;
        events.push({ t, type: x.startEvent, station: stKey, part: s.part, text: `${x.name} — part ${s.part}` });
        if (x.endEvent) events.push({ t: t + x.dur * k, type: x.endEvent, station: stKey, part: s.part, text: `${x.endEvent === 'MOVE_COMPLETE' ? 'Move complete' : x.endEvent === 'VISION_COMPLETE' ? 'Vision complete' : 'Laser process complete'} — part ${s.part}` });
      }
    }
    for (const e of tr)
      if (e.type === 'exit') {
        const at = res.stations[e.st] ?? res.stations[res.stations.length - 1];
        if (!e.ok && e.part != null) this.rejectAt.set(e.part, e.st);
        events.push({ t: e.t, type: e.ok ? 'UNLOAD' : 'SORT', station: at.station.key, part: e.part, text: e.ok ? `Part ${e.part ?? ''} out — PASS` : `Part ${e.part ?? ''} rejected at ${at.station.name} — FAIL (NG)`, severity: e.ok ? 'info' : 'warn' });
      }
    events.sort((a, b) => a.t - b.t);
    this.events = events;
  }

  /** Central simulation state at time t (§46). */
  at(t: number): SimulationState {
    const res = this.res;
    const stations: StationNow[] = res.stations.map((rs, i) => ({ key: rs.station.key, servers: Array.from({ length: this.shape[i] }, () => ({ state: 'idle' as ServerState, part: -1, progress: 0, step: null, stepProgress: 0, since: 0, end: 0, ng: false })), queue: 0 }));
    let ok = 0;
    let ng = 0;
    let inSystem = 0;
    const alarms: SimulationState['alarms'] = [];
    for (const e of this.des.trace) {
      if (e.t > t) break;
      applyTrace(e, stations, res);
      if (e.type === 'enter') inSystem++;
      if (e.type === 'exit') {
        inSystem--;
        if (e.ok) ok++;
        else ng++;
      }
    }
    stations.forEach((s, i) => s.servers.forEach((sv) => (sv.ng = sv.part >= 0 && this.rejectAt.get(sv.part) === i)));
    for (const s of stations) for (const [j, sv] of s.servers.entries()) if (sv.state === 'down') alarms.push({ t: sv.since, station: s.key, text: `${res.stations.find((r) => r.station.key === s.key)?.station.name} down (server ${j + 1})` });
    // busy progress + sub-step from the spans
    const axes: Record<string, number> = Object.fromEntries(this.model.axes.map((a) => [a.key, a.home]));
    const axisVel: Record<string, number> = Object.fromEntries(this.model.axes.map((a) => [a.key, 0]));
    const laserSt = res.stations.map((r, i) => (r.station.kind === 'laser' ? i : -1)).filter((i) => i >= 0);
    const laserOn = laserSt.map(() => false);
    const scan = laserSt.map(() => 0);
    const visionActive: Record<string, boolean> = {};
    let lastMoveEnd: Record<string, number> | null = null;
    let lastMoveT = -1;
    for (const s of this.spans) {
      if (s.t0 > t) break;
      const steps = this.steps[s.st];
      const mean = steps.reduce((n, x) => n + x.dur, 0) || 1;
      const k = (s.t1 - s.t0) / mean;
      // axis position carried by the last move that started before t
      for (const x of steps)
        if (x.move && s.t0 + x.start * k <= t && s.t0 + x.start * k > lastMoveT) {
          lastMoveT = s.t0 + x.start * k;
          lastMoveEnd = x.move.to;
          const el = (t - (s.t0 + x.start * k)) / k;
          for (const [ax, to] of Object.entries(x.move.to)) {
            const am = this.model.axes.find((a) => a.key === ax);
            if (!am || am.speed == null || am.accel == null) continue;
            const p = axisPositionAt(x.move.from[ax] ?? am.home, to, am, el);
            axes[ax] = p.pos;
            axisVel[ax] = el < x.dur ? p.vel : 0;
          }
        }
      if (t >= s.t1) continue;
      const sv = stations[s.st].servers[s.sv];
      if (!sv || sv.state !== 'busy') continue;
      const el = (t - s.t0) / k;
      sv.progress = Math.min(1, (t - s.t0) / Math.max(1e-9, s.t1 - s.t0));
      sv.since = s.t0;
      sv.end = s.t1;
      const step = [...steps].reverse().find((x) => el >= x.start) ?? steps[0] ?? null;
      sv.step = step;
      sv.stepProgress = step && step.dur > 0 ? Math.min(1, (el - step.start) / step.dur) : 1;
      const li = laserSt.indexOf(s.st);
      if (li >= 0 && step?.kind === 'laser') {
        laserOn[li] = true;
        scan[li] = sv.stepProgress;
      }
      if (step?.kind === 'vision' || step?.kind === 'inspect') visionActive[res.stations[s.st].station.key] = true;
    }
    void lastMoveEnd;
    const busy = stations.flatMap((s, i) => s.servers.map((sv) => ({ i, sv }))).filter((x) => x.sv.state === 'busy');
    let machineState: MachineState = 'Idle';
    if (alarms.length) machineState = 'Fault';
    else if (busy.some((b) => b.sv.step?.kind === 'laser' || b.sv.step?.kind === 'laser_prep' || b.sv.step?.kind === 'process')) machineState = 'Processing';
    else if (busy.some((b) => b.sv.step?.kind === 'move')) machineState = 'Moving';
    else if (busy.some((b) => res.stations[b.i].station.kind === 'align')) machineState = 'Aligning';
    else if (busy.some((b) => b.sv.step?.kind === 'inspect' || b.sv.step?.kind === 'vision')) machineState = 'Inspection';
    else if (busy.some((b) => b.sv.step?.kind === 'load' || b.sv.step?.kind === 'clamp')) machineState = 'Loading';
    else if (busy.some((b) => b.sv.step?.kind === 'unload' || b.sv.step?.kind === 'sort')) machineState = 'Unloading';
    else if (stations.some((s) => s.servers.some((x) => x.state === 'blocked'))) machineState = 'Blocked';
    else if (t > 0) machineState = 'Starved';
    const warm = this.des.warmup_s;
    return { t, machineState, stations, axes, axisVel, laserOn, scan, visionActive, ok, ng, inSystem, cycles: ok + ng, alarms, uphSoFar: t > Math.max(60, warm) ? ((ok + ng) / t) * 3600 : null };
  }
}

function applyTrace(e: TraceEvent, stations: StationNow[], res: Resolved) {
  void res;
  if (e.type === 'state' && e.sv != null && e.state) {
    const sv = stations[e.st]?.servers[e.sv];
    if (!sv) return;
    sv.state = e.state;
    sv.part = e.state === 'idle' ? -1 : (e.part ?? -1);
    sv.since = e.t;
  } else if (e.type === 'queue') {
    const s = stations[e.st];
    if (s) s.queue = e.q ?? 0;
  }
}

/** Representative single-cycle timeline (§42) for the mean times: station by station, sub-step by sub-step. */
export function meanCycleTimeline(res: Resolved, model: MachineModel): { t: number; station: string; step: SubStep }[] {
  const out: { t: number; station: string; step: SubStep }[] = [];
  let t = 0;
  res.stations.forEach((rs, i) => {
    const steps = stationSteps(res, i, model);
    for (const s of steps) out.push({ t: t + s.start, station: rs.station.name, step: s });
    t += rs.time ?? 0;
  });
  return out;
}
