import type { FaultCase } from '../../domain/engineering';
import { rng, sampler, type Resolved } from './model';

/*
 * DISCRETE-EVENT SIMULATION (master prompt §63, §64, §73, §75). Stations with parallel servers and
 * finite buffers; blocking-after-service, starvation, rejects, rework, random failures (MTBF/MTTR),
 * scheduled faults and preventive maintenance. Seeded — the same inputs and seed give the same run.
 * Results are model outputs, not factory-validated measurements (§64).
 */

export type ServerState = 'idle' | 'busy' | 'blocked' | 'down';
export interface TraceEvent {
  t: number;
  type: 'state' | 'queue' | 'enter' | 'exit';
  st: number;
  sv?: number;
  state?: ServerState;
  part?: number;
  q?: number;
  ok?: boolean;
}

export interface DesOptions {
  horizon_s: number;
  warmup_s?: number;
  seed?: number;
  /** record a replay trace up to this simulated time */
  traceUntil_s?: number;
  /** random failures from station MTBF/MTTR */
  failures?: boolean;
  /** preventive maintenance from the scenario */
  maintenance?: boolean;
  faults?: FaultCase[];
  /** use each station's variability distribution (false = mean times only) */
  variability?: boolean;
}

export interface DesStation {
  key: string;
  name: string;
  servers: number;
  utilization: number;
  blocked: number;
  starved: number;
  down: number;
  avgQueue: number;
  maxQueue: number;
  processed: number;
}
export interface DesResult {
  seed: number;
  horizon_s: number;
  warmup_s: number;
  ok: number;
  ng: number;
  reworked: number;
  uph: number;
  grossUph: number;
  leadTimeAvg: number | null;
  wipAvg: number;
  stations: DesStation[];
  trace: TraceEvent[];
  events: number;
}

interface Ev {
  t: number;
  seq: number;
  kind: 'finish' | 'fail' | 'repair' | 'faultStart' | 'faultEnd' | 'pmStart' | 'pmEnd' | 'end';
  st: number;
  sv: number;
  ver: number;
  dur?: number;
}

class Heap {
  private a: Ev[] = [];
  push(e: Ev) {
    const a = this.a;
    a.push(e);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].t < e.t || (a[p].t === e.t && a[p].seq < e.seq)) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = e;
  }
  pop(): Ev | undefined {
    const a = this.a;
    if (!a.length) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        const lt = (x: Ev, y: Ev) => x.t < y.t || (x.t === y.t && x.seq < y.seq);
        if (l < a.length && lt(a[l], m === i ? last : a[m])) m = l;
        if (r < a.length && lt(a[r], m === i ? last : a[m])) m = r;
        if (m === i) break;
        a[i] = a[m];
        i = m;
      }
      a[i] = last;
    }
    return top;
  }
  get size() {
    return this.a.length;
  }
}

interface Server {
  state: ServerState;
  part: number;
  since: number;
  finishAt: number;
  remaining: number;
  ver: number;
  blockedSince: number;
  /** state to return to after a repair */
  resume: 'busy' | 'blocked' | 'idle';
  downCount: number;
}

const expSample = (mean: number, r: () => number) => -mean * Math.log(Math.max(1e-12, 1 - r()));

export function runDes(res: Resolved, o: DesOptions): DesResult {
  if (!res.runnable) throw new Error('Scenario is not runnable — resolve the missing inputs first');
  const seed = o.seed ?? 1;
  const R = rng(seed);
  const warm = o.warmup_s ?? 0;
  const traceUntil = o.traceUntil_s ?? -1;
  const n = res.stations.length;
  const seq = res.layout === 'sequential';
  const wipCap = seq ? 1 : Infinity;
  const st = res.stations.map((rs) => ({
    rs,
    k: seq ? 1 : Math.max(1, rs.station.parallel ?? 1),
    cap: seq ? 0 : rs.station.buffer_after ?? 0,
    draw: o.variability === false ? () => rs.time! : sampler(rs.time!, rs.station.dist, R),
    reject: rs.station.reject_rate ?? 0,
    rework: rs.station.rework_rate ?? 0,
    interv: rs.station.intervention,
  }));
  const servers: Server[][] = st.map((s) => Array.from({ length: s.k }, () => ({ state: 'idle' as ServerState, part: -1, since: 0, finishAt: 0, remaining: 0, ver: 0, blockedSince: 0, resume: 'idle' as const, downCount: 0 })));
  const queues: number[][] = st.map(() => []);
  const acc = st.map(() => ({ busy: 0, blocked: 0, idle: 0, down: 0 }));
  const qArea = st.map(() => 0);
  const qSince = st.map(() => 0);
  const qMax = st.map(() => 0);
  const processed = st.map(() => 0);
  const reworkedAt = new Set<string>();
  const startTime = new Map<number, number>();
  const trace: TraceEvent[] = [];
  const heap = new Heap();
  let now = 0;
  let evSeq = 0;
  let nextPart = 1;
  let wip = 0;
  let wipArea = 0;
  let wipSince = 0;
  let ok = 0;
  let ng = 0;
  let reworked = 0;
  let leadSum = 0;
  let leadN = 0;
  let events = 0;

  const span = (a: number, b: number) => Math.max(0, b - Math.max(a, warm));
  const tr = (e: TraceEvent) => {
    if (now <= traceUntil) trace.push(e);
  };
  const push = (e: Omit<Ev, 'seq'>) => heap.push({ ...e, seq: evSeq++ });
  const setState = (i: number, j: number, s: ServerState) => {
    const sv = servers[i][j];
    acc[i][sv.state] += span(sv.since, now);
    sv.state = s;
    sv.since = now;
    tr({ t: now, type: 'state', st: i, sv: j, state: s, part: sv.part });
  };
  const qChange = (i: number) => {
    qArea[i] += span(qSince[i], now) * queues[i].length;
    qSince[i] = now;
  };
  const setWip = (d: number) => {
    wipArea += span(wipSince, now) * wip;
    wipSince = now;
    wip += d;
  };
  const idleUp = (i: number) => servers[i].filter((s) => s.state === 'idle').length;
  const accepts = (i: number) => i >= n || queues[i].length < st[i].cap + idleUp(i);

  const serviceTime = (i: number) => {
    let t = st[i].draw();
    const iv = st[i].interv;
    if (iv && o.variability !== false && R() < iv.probability) t += iv.time_s;
    else if (iv && o.variability === false) t += iv.probability * iv.time_s;
    return t;
  };
  const startService = (i: number, j: number, part: number) => {
    const sv = servers[i][j];
    sv.part = part;
    setState(i, j, 'busy');
    sv.finishAt = now + serviceTime(i);
    sv.ver++;
    push({ t: sv.finishAt, kind: 'finish', st: i, sv: j, ver: sv.ver });
  };
  const tryStart = (i: number) => {
    for (let j = 0; j < servers[i].length; j++) {
      if (servers[i][j].state !== 'idle') continue;
      let part: number;
      if (i === 0 && queues[0].length === 0) {
        if (wip >= wipCap) return;
        part = nextPart++;
        setWip(1);
        startTime.set(part, now);
        tr({ t: now, type: 'enter', st: 0, part });
      } else if (queues[i].length) {
        qChange(i);
        part = queues[i].shift()!;
        tr({ t: now, type: 'queue', st: i, q: queues[i].length });
      } else return;
      startService(i, j, part);
      if (i > 0) unblock(i - 1);
    }
  };
  const enqueue = (i: number, part: number) => {
    qChange(i);
    queues[i].push(part);
    qMax[i] = Math.max(qMax[i], queues[i].length);
    tr({ t: now, type: 'queue', st: i, q: queues[i].length });
    tryStart(i);
  };
  const exit = (part: number, good: boolean) => {
    setWip(-1);
    if (now >= warm) {
      if (good) ok++;
      else ng++;
      const s = startTime.get(part);
      if (good && s != null && s >= warm) {
        leadSum += now - s;
        leadN++;
      }
    }
    startTime.delete(part);
    tr({ t: now, type: 'exit', st: n - 1, part, ok: good });
    if (wipCap !== Infinity) tryStart(0);
  };
  /** a server at station i became free: pull work from the queue, then let blocked upstream servers push */
  const freed = (i: number) => {
    tryStart(i);
    if (i > 0) unblock(i - 1);
  };
  /** move a finished part out of station i (true when it left) */
  const moveOut = (i: number, j: number): boolean => {
    const sv = servers[i][j];
    if (i === n - 1) {
      exit(sv.part, true);
    } else if (accepts(i + 1)) {
      const p = sv.part;
      sv.part = -1;
      setState(i, j, 'idle');
      enqueue(i + 1, p);
      freed(i);
      return true;
    } else return false;
    sv.part = -1;
    setState(i, j, 'idle');
    freed(i);
    return true;
  };
  function unblock(k: number) {
    if (k < 0) return;
    const blocked = servers[k].map((s, j) => ({ s, j })).filter((x) => x.s.state === 'blocked').sort((a, b) => a.s.blockedSince - b.s.blockedSince);
    for (const { s, j } of blocked) {
      if (s.state !== 'blocked') continue;
      if (!moveOut(k, j)) break;
    }
  }
  const onFinish = (i: number, j: number) => {
    const sv = servers[i][j];
    if (now >= warm) processed[i]++;
    const s = st[i];
    if (s.reject && R() < s.reject) {
      const key = `${sv.part}@${i}`;
      if (s.rework && !reworkedAt.has(key) && R() < s.rework) {
        reworkedAt.add(key);
        if (now >= warm) reworked++;
        sv.finishAt = now + serviceTime(i);
        sv.ver++;
        push({ t: sv.finishAt, kind: 'finish', st: i, sv: j, ver: sv.ver });
        return;
      }
      const p = sv.part;
      sv.part = -1;
      setState(i, j, 'idle');
      exit(p, false);
      freed(i);
      return;
    }
    if (!moveOut(i, j)) {
      sv.blockedSince = now;
      setState(i, j, 'blocked');
    }
  };
  /** every down has exactly one matching repair; overlapping downs stack */
  const goDown = (i: number, j: number, dur: number) => {
    const sv = servers[i][j];
    if (sv.downCount === 0) {
      sv.resume = sv.state === 'busy' ? 'busy' : sv.state === 'blocked' ? 'blocked' : 'idle';
      if (sv.state === 'busy') {
        sv.remaining = sv.finishAt - now;
        sv.ver++;
      }
      setState(i, j, 'down');
    }
    sv.downCount++;
    push({ t: now + dur, kind: 'repair', st: i, sv: j, ver: 0 });
  };
  const comeUp = (i: number, j: number) => {
    const sv = servers[i][j];
    sv.downCount = Math.max(0, sv.downCount - 1);
    if (sv.downCount > 0) return;
    if (sv.resume === 'busy') {
      setState(i, j, 'busy');
      sv.finishAt = now + sv.remaining;
      sv.ver++;
      push({ t: sv.finishAt, kind: 'finish', st: i, sv: j, ver: sv.ver });
    } else if (sv.resume === 'blocked') {
      sv.blockedSince = now;
      setState(i, j, 'blocked');
      if (moveOut(i, j) === false) return;
    } else {
      setState(i, j, 'idle');
      freed(i);
    }
  };

  // schedule failures, faults, maintenance, end
  if (o.failures) {
    st.forEach((s, i) => {
      const { mtbf_min, mttr_min } = s.rs.station;
      if (mtbf_min && mttr_min) servers[i].forEach((_, j) => push({ t: expSample(mtbf_min * 60, R), kind: 'fail', st: i, sv: j, ver: 0 }));
    });
  }
  for (const f of o.faults ?? []) {
    const idx = f.station_key === '*' ? -1 : res.stations.findIndex((x) => x.station.key === f.station_key);
    if (f.station_key !== '*' && idx < 0) continue;
    push({ t: f.at_min * 60, kind: 'faultStart', st: idx, sv: 0, ver: 0, dur: f.duration_min * 60 });
  }
  const m = res.sim.maintenance;
  if (o.maintenance && m?.pm_interval_h && m.pm_duration_min) {
    for (let t = m.pm_interval_h * 3600; t < o.horizon_s; t += m.pm_interval_h * 3600) push({ t, kind: 'pmStart', st: -1, sv: 0, ver: 0, dur: m.pm_duration_min * 60 });
  }
  push({ t: o.horizon_s, kind: 'end', st: -1, sv: 0, ver: 0 });

  tryStart(0);
  for (;;) {
    const e = heap.pop();
    if (!e) break;
    now = e.t;
    events++;
    if (e.kind === 'end') break;
    if (e.kind === 'finish') {
      const sv = servers[e.st][e.sv];
      if (sv.ver !== e.ver || sv.state !== 'busy') continue;
      onFinish(e.st, e.sv);
    } else if (e.kind === 'fail') {
      const { mtbf_min, mttr_min } = st[e.st].rs.station;
      const repair = expSample((mttr_min ?? 0) * 60, R);
      goDown(e.st, e.sv, repair);
      // next failure: operating time to failure after this repair
      push({ t: now + repair + expSample((mtbf_min ?? 1) * 60, R), kind: 'fail', st: e.st, sv: e.sv, ver: 0 });
    } else if (e.kind === 'repair') {
      comeUp(e.st, e.sv);
    } else if (e.kind === 'faultStart' || e.kind === 'pmStart') {
      const targets = e.st === -1 ? st.map((_, i) => i) : [e.st];
      for (const i of targets) servers[i].forEach((_, j) => goDown(i, j, e.dur!));
    }
  }
  // flush
  now = o.horizon_s;
  st.forEach((_, i) => {
    servers[i].forEach((sv) => {
      acc[i][sv.state] += span(sv.since, now);
      sv.since = now;
    });
    qArea[i] += span(qSince[i], now) * queues[i].length;
  });
  wipArea += span(wipSince, now) * wip;
  const T = Math.max(1e-9, o.horizon_s - warm);
  return {
    seed,
    horizon_s: o.horizon_s,
    warmup_s: warm,
    ok,
    ng,
    reworked,
    uph: (ok / T) * 3600,
    grossUph: ((ok + ng) / T) * 3600,
    leadTimeAvg: leadN ? leadSum / leadN : null,
    wipAvg: wipArea / T,
    stations: st.map((s, i) => {
      const tot = T * s.k;
      return { key: s.rs.station.key, name: s.rs.station.name, servers: s.k, utilization: acc[i].busy / tot, blocked: acc[i].blocked / tot, starved: acc[i].idle / tot, down: acc[i].down / tot, avgQueue: qArea[i] / T, maxQueue: qMax[i], processed: processed[i] };
    }),
    trace,
    events,
  };
}

/* ---------------------------------------------------------------- replay (§63 controls) */

export interface ReplayState {
  t: number;
  servers: ServerState[][];
  parts: number[][];
  queues: number[];
  ok: number;
  ng: number;
  inSystem: number;
}

/** Machine state at time t, rebuilt from the trace (used by the animated material-flow view). */
export function replayAt(trace: TraceEvent[], shape: number[], t: number): ReplayState {
  const servers = shape.map((k) => Array.from({ length: k }, () => 'idle' as ServerState));
  const parts = shape.map((k) => Array.from({ length: k }, () => -1));
  const queues = shape.map(() => 0);
  let ok = 0;
  let ng = 0;
  let inSystem = 0;
  for (const e of trace) {
    if (e.t > t) break;
    if (e.type === 'state' && e.sv != null && e.state) {
      servers[e.st][e.sv] = e.state;
      parts[e.st][e.sv] = e.state === 'idle' ? -1 : (e.part ?? -1);
    } else if (e.type === 'queue') queues[e.st] = e.q ?? 0;
    else if (e.type === 'enter') inSystem++;
    else if (e.type === 'exit') {
      inSystem--;
      if (e.ok) ok++;
      else ng++;
    }
  }
  return { t, servers, parts, queues, ok, ng, inSystem };
}
