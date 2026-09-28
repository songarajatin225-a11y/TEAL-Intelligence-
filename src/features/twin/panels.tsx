import clsx from 'clsx';
import { AlertOctagon, ArrowRight, CheckCircle2, ChevronDown, ChevronRight, CircleDot, Download, Pause, Play, RotateCcw, SkipForward, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { Badge, Button, Field, Select, Table, Unknown } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { TWIN_MODEL_MATURITY, TWIN_SIM_MATURITY, type FaultCase, type Recipe, type TwinRun } from '../../domain/engineering';
import { FAULT_LIBRARY, scenarioMetrics } from '../../services/sim/analysis';
import { defaultSequence } from '../../services/sim/build';
import { MODEL_VERSION, resolveScenario } from '../../services/sim/model';
import type { TwinCheck } from '../../services/twin/checks';
import type { UtilitySummary } from '../../services/twin/utilities';
import { buildMachine, TWIN_MODEL_VERSION, type MachineModel } from '../../services/twin/machine';
import { meanCycleTimeline, type SimulationState, type StepKind, type TwinPlayer } from '../../services/twin/timeline';
import { num, pct } from '../studio/shared';
import type { Sim, TabProps } from '../studio/ScenarioPage';
import { NumInput, SmallSelect } from '../studio/tabs/edit';
import type { RunOptions, TwinModel } from './useTwin';

export const STEP_COLOR: Record<StepKind, string> = { move: '#3b82f6', load: '#8d9a9a', clamp: '#a78bfa', vision: '#35e0a1', laser_prep: '#f5a524', laser: '#ff4d3d', inspect: '#4fc3f7', sort: '#c084fc', unload: '#6b7280', process: '#00a99d' };

export const fmtT = (t: number) => `${t < 60 ? t.toFixed(2) : `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`} s`;

export function download(name: string, body: string, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const csv = (rows: (string | number | null | undefined)[][]) => rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

/* ------------------------------------------------------------------ timeline + events (§40–§42) */

export function TimelinePanel({ player, t, setT, playing, setPlaying, speed, setSpeed, d, twin, transport = true }: { player: TwinPlayer | null; t: number; setT: (t: number) => void; playing: boolean; setPlaying: (b: boolean) => void; speed: number; setSpeed: (n: number) => void; d: TabProps['d']; twin: TwinModel; transport?: boolean }) {
  const [filter, setFilter] = useState<'all' | 'faults' | 'laser' | 'vision' | 'moves'>('all');
  const cyc = useMemo(() => meanCycleTimeline(d.res, twin.model), [d.res, twin.model]);
  const total = d.res.stations.reduce((n, s) => n + (s.time ?? 0), 0);
  if (!player) return <p className="text-meta text-ink-3">No simulation run — resolve the input gaps first.</p>;
  const ev = player.events.filter((e) => (filter === 'all' ? true : filter === 'faults' ? e.severity === 'fault' || e.type === 'RESET' || e.type === 'BLOCKED' : filter === 'laser' ? e.type.startsWith('LASER') : filter === 'vision' ? e.type.startsWith('VISION') || e.type === 'INSPECTION' : e.type.startsWith('MOVE')));
  const idx = ev.findIndex((e) => e.t > t);
  const upto = idx < 0 ? ev.length : idx;
  const shown = ev.slice(Math.max(0, upto - 40), upto + 8);
  const next = ev[upto];
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <div className="space-y-3 xl:col-span-3">
        {transport && (
        <>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause simulation' : 'Play simulation'}>
            {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />} {playing ? 'Pause' : 'Play'}
          </Button>
          <Button size="sm" onClick={() => next && setT(next.t + 1e-6)} disabled={!next} aria-label="Step to next event">
            <SkipForward className="size-4" aria-hidden /> Step
          </Button>
          <Button size="sm" onClick={() => (setPlaying(false), setT(0))} aria-label="Reset simulation">
            <RotateCcw className="size-4" aria-hidden /> Reset
          </Button>
          <SmallSelect label="Playback speed" value={String(speed)} options={['0.25', '0.5', '1', '2', '5', '10', '30', '120'].map((v) => ({ value: v, label: `${v}×` }))} onChange={(v) => setSpeed(Number(v))} className="!w-auto" />
          <span className="font-mono text-meta text-ink-2" aria-live="off">
            t = {fmtT(t)} / {fmtT(player.end)}
          </span>
        </div>
        <input type="range" aria-label="Simulation time" min={0} max={player.end} step={0.05} value={t} onChange={(e) => (setPlaying(false), setT(Number(e.target.value)))} className="w-full accent-[var(--c-accent)]" />
        </>
        )}
        <p className="text-micro text-ink-3">Playback speed changes only how fast you watch — the simulated cycle times do not change (§69).</p>
        <div>
          <div className="mb-1 text-meta font-medium text-ink-2">Representative cycle (mean times) — how the cycle time is built</div>
          <svg viewBox={`0 0 640 ${d.res.stations.length * 18 + 22}`} className="h-auto w-full" role="img" aria-label="Gantt of one representative cycle by station and sub-step">
            {d.res.stations.map((s, i) => (
              <text key={s.station.key} x={0} y={i * 18 + 13} className="fill-ink-3 text-[10px]">
                {s.station.name.slice(0, 24)}
              </text>
            ))}
            {cyc.map((c, i) => {
              const row = d.res.stations.findIndex((s) => s.station.name === c.station);
              const x = 160 + (c.t / (total || 1)) * 470;
              const w = Math.max(1, (c.step.dur / (total || 1)) * 470);
              return (
                <rect key={i} x={x} y={row * 18 + 3} width={w} height={12} rx={2} fill={STEP_COLOR[c.step.kind]} opacity={0.85}>
                  <title>{`${c.station} · ${c.step.name}: ${c.step.dur.toFixed(3)} s (${c.step.basis})`}</title>
                </rect>
              );
            })}
            <text x={160} y={d.res.stations.length * 18 + 18} className="fill-ink-3 text-[10px]">
              0 s
            </text>
            <text x={630} y={d.res.stations.length * 18 + 18} textAnchor="end" className="fill-ink-3 text-[10px]">
              {total.toFixed(2)} s
            </text>
          </svg>
          <div className="mt-1 flex flex-wrap gap-2 text-micro text-ink-3">
            {(Object.keys(STEP_COLOR) as StepKind[]).map((k) => (
              <span key={k} className="inline-flex items-center gap-1">
                <span className="inline-block size-2.5 rounded-sm" style={{ background: STEP_COLOR[k] }} /> {k.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="xl:col-span-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-meta font-medium text-ink-2">Event log</div>
          <SmallSelect label="Event filter" value={filter} options={[{ value: 'all', label: 'All events' }, { value: 'faults', label: 'Faults · blocking' }, { value: 'laser', label: 'Laser' }, { value: 'vision', label: 'Vision · inspection' }, { value: 'moves', label: 'Axis moves' }]} onChange={(v) => setFilter(v as typeof filter)} className="!w-auto" />
        </div>
        <div className="scroll-thin max-h-72 overflow-auto rounded-control border border-line" role="log" aria-label="Simulation events up to the current time">
          <table className="w-full text-micro">
            <tbody>
              {shown.map((e, i) => (
                <tr key={`${e.t}-${i}`} className={clsx('cursor-pointer border-b border-line/60 hover:bg-panel-2', e.t > t && 'opacity-40', e.severity === 'fault' && 'text-bad', e.severity === 'warn' && 'text-warn')} onClick={() => (setPlaying(false), setT(e.t))}>
                  <td className="w-20 px-2 py-1 font-mono">{e.t.toFixed(2)}</td>
                  <td className="px-2 py-1 font-mono text-ink-3">{e.type}</td>
                  <td className="px-2 py-1">{e.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-micro text-ink-3">{player.events.length.toLocaleString()} events in this run · click an event to jump to it.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ PLC / state machine (§43, §44) */

const SEQ_OF: Record<string, string[]> = { load: ['present'], clamp: ['clamp'], vision: ['vision'], move: ['position'], laser_prep: ['enable'], laser: ['process'], inspect: ['inspect'], sort: ['decide'], unload: ['unclamp', 'unload'], process: ['process'] };

export function SequencePanel({ sim, snap }: { sim: Sim; snap: SimulationState | null }) {
  const seq = sim.sequence?.length ? sim.sequence : defaultSequence(sim.stations);
  const active = new Set(snap ? snap.stations.flatMap((s) => s.servers.filter((x) => x.state === 'busy' && x.step).flatMap((x) => SEQ_OF[x.step!.kind] ?? [])) : []);
  if (snap?.alarms.length) active.add('safety');
  return (
    <div>
      <p className="mb-2 text-micro text-ink-3">Conceptual PLC state machine (not a PLC runtime). The active step follows the central simulation state; sensors, actuators, timers and interlocks come from the scenario sequence.</p>
      <ol className="grid grid-cols-1 gap-1.5 md:grid-cols-2 xl:grid-cols-3">
        {seq.map((s, i) => (
          <li key={s.key} className={clsx('flex items-start gap-2 rounded-control border px-2.5 py-1.5 text-meta', active.has(s.key) ? 'border-accent bg-accent-soft' : 'border-line')}>
            <span className="font-mono text-micro text-ink-3">{String(i + 1).padStart(2, '0')}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-medium">
                {active.has(s.key) && <CircleDot className="size-3.5 text-accent" aria-label="active" />}
                {s.name}
                <Badge>{s.kind}</Badge>
              </div>
              <div className="text-micro text-ink-3">{[s.sensor && `sensor: ${s.sensor}`, s.actuator && `actuator: ${s.actuator}`, s.timer_s != null && `timer ${s.timer_s} s`, s.interlock && `interlock: ${s.interlock}`, s.condition && `if ${s.condition}`, s.alarm && `alarm: ${s.alarm}`].filter(Boolean).join(' · ') || '—'}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ design check (§113, §114) */

export function ChecksPanel({ twin, onObject, onTab }: { twin: TwinModel; onObject: (id: string) => void; onTab: (tab: string) => void }) {
  const [showOk, setShowOk] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const visible = twin.checks.filter((c) => showOk || c.severity !== 'ok');
  // repeated findings of one kind collapse into a single row (the first occurrence keeps its place)
  const rows: (TwinCheck | { group: string; items: TwinCheck[] })[] = [];
  const groups = new Map<string, TwinCheck[]>();
  for (const c of visible) {
    if (!c.group) {
      rows.push(c);
      continue;
    }
    if (!groups.has(c.group)) {
      groups.set(c.group, []);
      rows.push({ group: c.group, items: groups.get(c.group)! });
    }
    groups.get(c.group)!.push(c);
  }
  const counts = { critical: twin.checks.filter((c) => c.severity === 'critical').length, major: twin.checks.filter((c) => c.severity === 'major').length, minor: twin.checks.filter((c) => c.severity === 'minor').length, ok: twin.checks.filter((c) => c.severity === 'ok').length };
  const icon = (c: TwinCheck) => (c.severity === 'ok' ? <CheckCircle2 className="size-4 text-ok" aria-label="passed" /> : <AlertOctagon className={clsx('size-4', c.severity === 'critical' ? 'text-bad' : c.severity === 'major' ? 'text-warn' : 'text-ink-3')} aria-label={c.severity} />);
  const fix = (c: TwinCheck) => (
    <>
      {c.objectId && (
        <Button size="sm" onClick={() => onObject(c.objectId!)}>
          Show in 3D
        </Button>
      )}
      {c.recordId && (
        <Link to={recordPath(c.recordId)} className="ml-1 text-micro text-accent-2 hover:underline">
          Record
        </Link>
      )}
      {c.tab && c.tab !== 'machine3d' && (
        <button type="button" className="ml-1 text-micro text-accent-2 hover:underline" onClick={() => onTab(c.tab!)}>
          Open {c.tab}
        </button>
      )}
    </>
  );
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone={counts.critical ? 'bad' : 'ok'}>{counts.critical} critical</Badge>
        <Badge tone={counts.major ? 'warn' : 'neutral'}>{counts.major} major</Badge>
        <Badge>{counts.minor} minor</Badge>
        <Badge tone="ok">{counts.ok} passed</Badge>
        <label className="ml-auto inline-flex items-center gap-1.5 text-meta">
          <input type="checkbox" checked={showOk} onChange={(e) => setShowOk(e.target.checked)} /> Show passed checks
        </label>
      </div>
      <Table head={['', 'Area', 'Finding', 'Rule', 'Fix']} dense>
        {rows.flatMap((r, i) => {
          if (!('items' in r))
            return [
              <tr key={i}>
                <td>{icon(r)}</td>
                <td className="text-micro">{r.area}</td>
                <td>{r.text}</td>
                <td className="text-micro text-ink-3">{r.rule}</td>
                <td className="whitespace-nowrap">{fix(r)}</td>
              </tr>,
            ];
          const isOpen = openGroups.has(r.group);
          return [
            <tr key={i}>
              <td>{icon(r.items[0])}</td>
              <td className="text-micro">{r.items[0].area}</td>
              <td>
                <button type="button" aria-expanded={isOpen} className="inline-flex items-center gap-1 text-left hover:text-accent-2" onClick={() => setOpenGroups((s) => new Set(isOpen ? [...s].filter((x) => x !== r.group) : [...s, r.group]))}>
                  {isOpen ? <ChevronDown className="size-3.5" aria-hidden /> : <ChevronRight className="size-3.5" aria-hidden />}
                  {r.group}: {r.items.length} component{r.items.length === 1 ? '' : 's'} with one known supplier
                </button>
              </td>
              <td className="text-micro text-ink-3">{r.items[0].rule}</td>
              <td />
            </tr>,
            ...(isOpen
              ? r.items.map((c, k) => (
                  <tr key={`${i}-${k}`} className="bg-panel-2/40">
                    <td />
                    <td />
                    <td className="pl-5 text-meta">{c.text}</td>
                    <td />
                    <td className="whitespace-nowrap">{fix(c)}</td>
                  </tr>
                ))
              : []),
          ];
        })}
      </Table>
    </div>
  );
}

/* ------------------------------------------------------------------ I/O and sensors (§92, §93) */

export function IoPanel({ model, snap, faults, onObject }: { model: MachineModel; snap: SimulationState | null; faults: FaultCase[]; onObject: (id: string) => void }) {
  const t = snap?.t ?? 0;
  const activeFault = (name: RegExp) => faults.some((f) => name.test(f.name) && t >= f.at_min * 60 && t < (f.at_min + f.duration_min) * 60);
  const busy = (kinds: string[]) => !!snap?.stations.some((s, i) => kinds.includes(model.objects.find((o) => o.id === `st-${s.key}`)?.stationKey ?? '') && s.servers.some((x) => x.state === 'busy') && i >= 0);
  const stState = (key: string) => snap?.stations.find((s) => s.key === key)?.servers[0]?.state;
  const val = (name: string, step: string): 'ON' | 'OFF' | 'FAULT' => {
    if (/door/i.test(name)) return activeFault(/door/i) ? 'OFF' : 'ON';
    if (/air pressure/i.test(name)) return activeFault(/air/i) ? 'FAULT' : 'ON';
    if (/e-stop/i.test(name)) return 'ON';
    if (/light curtain/i.test(name)) return 'ON';
    if (/part present/i.test(name)) return activeFault(/sensor|part missing/i) ? 'FAULT' : (snap?.inSystem ?? 0) > 0 ? 'ON' : 'OFF';
    if (/laser ready|laser enable/i.test(name)) return stState('laser') === 'down' ? 'FAULT' : /enable/i.test(name) ? (snap?.laserOn.some(Boolean) ? 'ON' : 'OFF') : 'ON';
    if (/camera trigger|result ok/i.test(name)) return Object.values(snap?.visionActive ?? {}).some(Boolean) ? 'ON' : 'OFF';
    if (/clamp/i.test(name)) return (snap?.inSystem ?? 0) > 0 && !busy(['load']) ? 'ON' : 'OFF';
    if (/in position/i.test(name)) return Object.values(snap?.axisVel ?? {}).every((v) => Math.abs(v) < 1e-6) ? 'ON' : 'OFF';
    if (/job|scanner/i.test(name)) return snap?.laserOn.some(Boolean) ? 'ON' : 'OFF';
    void step;
    return 'OFF';
  };
  return (
    <div>
      <p className="mb-2 text-micro text-ink-3">Conceptual I/O list generated from the architecture — tags are placeholders, not a PLC program. Sensor → PLC input → logic → PLC output → actuator.</p>
      <Table head={['Tag', 'Type', 'Signal', 'Device', 'Sequence step', 'State']} dense>
        {model.io.map((x) => {
          const v = val(x.name, x.step);
          return (
            <tr key={x.tag + x.name} className={clsx(x.objectId && 'cursor-pointer hover:bg-panel-2')} onClick={() => x.objectId && onObject(x.objectId)}>
              <td className="font-mono text-micro">{x.tag}</td>
              <td>{x.kind}</td>
              <td>{x.name}</td>
              <td className="text-micro">{x.device}</td>
              <td className="text-micro text-ink-3">{x.step}</td>
              <td>
                <Badge tone={v === 'ON' ? 'ok' : v === 'FAULT' ? 'bad' : 'neutral'}>{v}</Badge>
              </td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}

/* ------------------------------------------------------------------ alarms + HMI (§111, §112) */

export function AlarmsHmiPanel({ player, snap, playing, setPlaying, setT, recipe }: { player: TwinPlayer | null; snap: SimulationState | null; playing: boolean; setPlaying: (b: boolean) => void; setT: (t: number) => void; recipe?: Recipe & AnyRecord }) {
  const t = snap?.t ?? 0;
  const alarms = useMemo(() => {
    if (!player) return [];
    const out: { t: number; eq: string; text: string; until: number | null }[] = [];
    for (const e of player.events) {
      if (e.type === 'FAULT') out.push({ t: e.t, eq: e.station, text: e.text, until: null });
      if (e.type === 'RESET') {
        const open = [...out].reverse().find((a) => a.eq === e.station && a.until == null);
        if (open) open.until = e.t;
      }
    }
    return out;
  }, [player]);
  const visible = alarms.filter((a) => a.t <= t);
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <div className="rounded-card border border-line bg-[#0b0f11] p-3 text-[#e8eeee] xl:col-span-2" role="region" aria-label="Conceptual HMI">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-micro tracking-wider text-[#8d9a9a]">HMI · CONCEPT</span>
          <span className={clsx('rounded px-2 py-0.5 font-mono text-micro', snap?.machineState === 'Fault' ? 'bg-bad/30 text-bad' : playing ? 'bg-accent/25 text-[#35e0a1]' : 'bg-white/10')}>{(playing ? snap?.machineState ?? 'Idle' : 'STOPPED').toUpperCase()}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 font-mono text-meta">
          <div>
            <div className="text-micro text-[#8d9a9a]">GOOD</div>
            {snap?.ok ?? 0}
          </div>
          <div>
            <div className="text-micro text-[#8d9a9a]">NG</div>
            {snap?.ng ?? 0}
          </div>
          <div>
            <div className="text-micro text-[#8d9a9a]">UPH (run)</div>
            {snap?.uphSoFar != null ? snap.uphSoFar.toFixed(0) : '—'}
          </div>
        </div>
        <div className="mt-2 text-micro text-[#8d9a9a]">RECIPE {recipe ? `${recipe.name}` : '— none linked'}</div>
        {recipe && <div className="font-mono text-micro">{recipe.parameters.map((p) => `${p.name} ${p.value}${p.unit ? ` ${p.unit}` : ''}`).join(' · ')}</div>}
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="primary" onClick={() => setPlaying(true)}>
            Start
          </Button>
          <Button size="sm" onClick={() => setPlaying(false)}>
            Stop
          </Button>
          <Button size="sm" onClick={() => (setPlaying(false), setT(0))}>
            Reset
          </Button>
        </div>
      </div>
      <div className="xl:col-span-3">
        <Table head={['Alarm', 'Equipment', 'Time', 'Severity', 'State']} dense>
          {visible.length ? (
            visible.map((a, i) => (
              <tr key={i}>
                <td>{a.text}</td>
                <td className="text-micro">{a.eq}</td>
                <td className="font-mono text-micro">{fmtT(a.t)}</td>
                <td>
                  <Badge tone="bad">Fault</Badge>
                </td>
                <td>{a.until != null && a.until <= t ? <Badge tone="ok">Cleared {fmtT(a.until)}</Badge> : <Badge tone="bad">Active</Badge>}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-meta text-ink-3">
                No alarm up to t = {fmtT(t)}.
              </td>
            </tr>
          )}
        </Table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ motion (§17–§19) */

export function MotionPanel({ model, snap, sim, set, customer }: { model: MachineModel; snap: SimulationState | null; sim: Sim; set: TabProps['set']; customer: boolean }) {
  if (!model.axes.length) return <p className="text-meta text-ink-3">This scenario has no motion axes. Parts move between stations by material flow (conveyor / transfer). Axes can be added to the twin inputs of a sequential machine.</p>;
  const patchAxis = (k: string, p: Record<string, number | null>) => set((s) => ({ ...s, twin: { ...s.twin, axes: (s.twin?.axes ?? []).map((a) => (a.key === k ? { ...a, ...p } : a)) } }));
  const patchMove = (i: number, ax: string, v: number | null) => set((s) => ({ ...s, twin: { ...s.twin, moves: (s.twin?.moves ?? []).map((m, j) => (j === i ? { ...m, targets: { ...m.targets, ...(v == null ? {} : { [ax]: v }) } } : m)) } }));
  return (
    <div className="space-y-4">
      <Table head={['Axis', 'Position', 'Velocity', 'Travel', 'Speed', 'Acceleration', 'Jerk (S-curve)', 'Settling', 'Source']} dense>
        {model.axes.map((a) => (
          <tr key={a.key}>
            <td className="font-medium">{a.name}</td>
            <td className="num font-mono">{snap ? `${(snap.axes[a.key] ?? a.home).toFixed(1)} mm` : '—'}</td>
            <td className="num font-mono">{snap ? `${(snap.axisVel[a.key] ?? 0).toFixed(0)} mm/s` : '—'}</td>
            <td className="num">{a.stroke != null ? `0 – ${a.stroke} mm` : <Unknown label="Not defined" />}</td>
            <td>{customer ? num(a.speed) : <NumInput label={`${a.name} speed override`} value={sim.twin?.axes?.find((x) => x.key === a.key)?.speed_mm_s ?? null} placeholder={a.speed != null ? String(a.speed) : 'mm/s'} onChange={(v) => patchAxis(a.key, { speed_mm_s: v })} />}</td>
            <td>{customer ? num(a.accel) : <NumInput label={`${a.name} acceleration override`} value={sim.twin?.axes?.find((x) => x.key === a.key)?.accel_mm_s2 ?? null} placeholder={a.accel != null ? String(a.accel) : 'mm/s²'} onChange={(v) => patchAxis(a.key, { accel_mm_s2: v })} />}</td>
            <td>{customer ? (a.jerk != null ? `${num(a.jerk)} mm/s³` : 'trapezoidal') : <NumInput label={`${a.name} jerk limit`} value={sim.twin?.axes?.find((x) => x.key === a.key)?.jerk_mm_s3 ?? null} placeholder="mm/s³" min={0} onChange={(v) => patchAxis(a.key, { jerk_mm_s3: v })} />}</td>
            <td>{customer ? (a.settle != null ? `${Math.round(a.settle * 1000)} ms` : 'not included') : <NumInput label={`${a.name} settling time ms`} value={sim.twin?.axes?.find((x) => x.key === a.key)?.settle_ms ?? null} placeholder="ms" min={0} onChange={(v) => patchAxis(a.key, { settle_ms: v })} />}</td>
            <td className="text-micro text-ink-3">
              speed: {a.sources.speed}; accel: {a.sources.accel}; travel: {a.sources.stroke}
            </td>
          </tr>
        ))}
      </Table>
      <div>
        <div className="mb-1 text-meta font-medium text-ink-2">Per-part moves (absolute targets) — time CALCULATED (trapezoidal, or S-curve where a jerk limit is entered, plus settling where entered) and included in the station time</div>
        <Table head={['Station', 'Move', ...model.axes.map((a) => `${a.name} target (mm)`), 'Move time', 'Limits']} dense>
          {model.plan.map((m, i) => (
            <tr key={i}>
              <td className="text-micro">{sim.stations.find((s) => s.key === m.stationKey)?.name ?? m.stationKey}</td>
              <td>{m.label}</td>
              {model.axes.map((a) => (
                <td key={a.key}>{customer ? (m.to[a.key] ?? '—') : <NumInput label={`${m.label} ${a.name}`} value={sim.twin?.moves?.[i]?.targets[a.key] ?? null} onChange={(v) => patchMove(i, a.key, v)} />}</td>
              ))}
              <td className="num">{m.time != null ? `${m.time.toFixed(3)} s` : <Unknown label="Not defined" />}</td>
              <td>{m.limitViolations.length ? <Badge tone="bad">{m.limitViolations.join('; ')}</Badge> : <Badge tone="ok">within travel</Badge>}</td>
            </tr>
          ))}
        </Table>
        <p className="mt-1 text-micro text-ink-3">Conceptual kinematics: distance, speed, acceleration, deceleration and — only when entered — jerk limit and in-position settling time. An axis without a settling time does not include one (it is not assumed). No following error, load inertia or servo tuning (§18).</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ faults + propagation (§72, §73) */

export const TWIN_FAULTS = [...FAULT_LIBRARY, { key: 'sensor', name: 'Sensor failure', kinds: ['load', 'fixture'], minutes: 5 }, { key: 'air', name: 'Low air pressure', kinds: [], whole: true, minutes: 5 }, { key: 'camera', name: 'Camera failure', kinds: ['align', 'vision', 'inspect'], minutes: 10 }];

export function FaultsPanel({ sim, run, setRun, t, des, baseline, customer }: { sim: Sim; run: RunOptions; setRun: (f: (r: RunOptions) => RunOptions) => void; t: number; des: TwinPlayer['des'] | null; baseline: TwinPlayer['des'] | null; customer: boolean }) {
  const [key, setKey] = useState(TWIN_FAULTS[0].key);
  const def = TWIN_FAULTS.find((f) => f.key === key)!;
  const stations = sim.stations.filter((s) => def.whole || def.kinds.includes(s.kind));
  const [st, setSt] = useState<string>('');
  const [mins, setMins] = useState<number | null>(def.minutes);
  const target = def.whole ? sim.stations.map((s) => s.key) : [st || stations[0]?.key].filter(Boolean);
  const inject = () => {
    if (!mins || !target.length) return;
    const at = Math.round((t / 60) * 100) / 100;
    setRun((r) => ({ ...r, injected: [...r.injected, ...target.map((k, i) => ({ key: `inj-${r.injected.length + i}-${key}`, name: def.name, station_key: k, at_min: at, duration_min: mins }))] }));
  };
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Fault" htmlFor="tw-f">
            <Select id="tw-f" value={key} onChange={(e) => (setKey(e.target.value), setMins(TWIN_FAULTS.find((f) => f.key === e.target.value)!.minutes), setSt(''))}>
              {TWIN_FAULTS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
          {!def.whole && (
            <Field label="Station" htmlFor="tw-fs">
              <Select id="tw-fs" value={st || stations[0]?.key || ''} onChange={(e) => setSt(e.target.value)} disabled={!stations.length}>
                {stations.length ? stations.map((s) => <option key={s.key} value={s.key}>{s.name}</option>) : <option value="">No matching station</option>}
              </Select>
            </Field>
          )}
          <Field label="Duration (min) — your input" htmlFor="tw-fd">
            <NumInput label="Fault duration in minutes" value={mins} min={0.1} onChange={setMins} />
          </Field>
          <Button variant="primary" onClick={inject} disabled={!mins || !target.length}>
            Inject at t = {fmtT(t)}
          </Button>
        </div>
        <p className="text-micro text-ink-3">The duration is prefilled from the fault library as an ASSUMPTION — replace it with field data. {def.whole ? 'A whole-machine fault stops every station.' : ''} Injection re-runs the same seeded simulation, so the difference is the fault.</p>
        <div className="flex flex-wrap gap-3 text-meta">
          <label className="inline-flex items-center gap-1.5">
            <input type="checkbox" checked={run.scenarioFaults} onChange={(e) => setRun((r) => ({ ...r, scenarioFaults: e.target.checked }))} /> Scenario fault cases ({(sim.faults ?? []).length})
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input type="checkbox" checked={run.failures} onChange={(e) => setRun((r) => ({ ...r, failures: e.target.checked }))} /> Random failures from MTBF / MTTR
          </label>
        </div>
        {run.injected.length > 0 && (
          <Table head={['Injected fault', 'Station', 'At', 'Duration', '']} dense>
            {run.injected.map((f) => (
              <tr key={f.key}>
                <td>{f.name}</td>
                <td className="text-micro">{sim.stations.find((s) => s.key === f.station_key)?.name}</td>
                <td className="font-mono text-micro">{f.at_min.toFixed(2)} min</td>
                <td>{f.duration_min} min</td>
                <td>
                  <Button size="sm" onClick={() => setRun((r) => ({ ...r, injected: r.injected.filter((x) => x.key !== f.key) }))} aria-label={`Remove ${f.name}`}>
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
      <div>
        <div className="mb-1 text-meta font-medium text-ink-2">Fault propagation (this run)</div>
        {des ? (
          <>
            <ol className="mb-2 flex flex-wrap items-center gap-1.5 text-micro">
              {run.injected.length ? (
                <>
                  <li><Badge tone="bad">{run.injected[0].name}</Badge></li>
                  <ArrowRight className="size-3" aria-hidden />
                  <li><Badge>station down</Badge></li>
                  <ArrowRight className="size-3" aria-hidden />
                  <li><Badge tone="warn">upstream blocked · buffers fill</Badge></li>
                  <ArrowRight className="size-3" aria-hidden />
                  <li><Badge tone="warn">downstream starved</Badge></li>
                  <ArrowRight className="size-3" aria-hidden />
                  <li><Badge tone="bad">UPH {baseline ? `${baseline.uph.toFixed(0)} → ${des.uph.toFixed(0)}` : des.uph.toFixed(0)}</Badge></li>
                </>
              ) : (
                <li className="text-ink-3">Inject a fault to see how it propagates.</li>
              )}
            </ol>
            <Table head={['Station', 'Utilization', 'Blocked', 'Starved', 'Down', 'Max queue']} dense>
              {des.stations.map((s, i) => (
                <tr key={s.key}>
                  <td>{s.name}</td>
                  <td className="num">{pct(s.utilization)}</td>
                  <td className="num">{pct(s.blocked)}</td>
                  <td className="num">{pct(s.starved)}</td>
                  <td className={clsx('num', s.down > 0 && 'text-bad')}>{pct(s.down)}</td>
                  <td className="num">{s.maxQueue}{baseline && baseline.stations[i].maxQueue !== s.maxQueue ? ` (was ${baseline.stations[i].maxQueue})` : ''}</td>
                </tr>
              ))}
            </Table>
            {baseline && !customer && (
              <p className="mt-1 text-meta">
                Lost good parts over {Math.round(des.horizon_s / 60)} min: <strong>{baseline.ok - des.ok}</strong> ({baseline.ok} → {des.ok}), same seed {des.seed}.
              </p>
            )}
          </>
        ) : (
          <p className="text-meta text-ink-3">No run.</p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ runs + snapshots (§76, §77, §116, §165) */

export const encodeFault = (f: FaultCase) => `${f.station_key}|${f.at_min}|${f.duration_min}|${f.name}`;
export const decodeFault = (s: string, i: number): FaultCase => {
  const [station_key, at, dur, ...name] = s.split('|');
  return { key: `rp-${i}`, station_key, at_min: Number(at), duration_min: Number(dur), name: name.join('|') };
};

export function RunsPanel({ sim, set, run, setRun, des, onSnapshot, onRestore, onPng }: { sim: Sim; set: TabProps['set']; run: RunOptions; setRun: (f: (r: RunOptions) => RunOptions) => void; des: TwinPlayer['des'] | null; onSnapshot: (name: string) => void; onRestore: (id: string) => void; onPng: () => void }) {
  const [name, setName] = useState('');
  const record = () => {
    if (!des) return;
    const r: TwinRun = {
      id: `run-${Date.now().toString(36)}`,
      at: new Date().toISOString(),
      seed: run.seed,
      horizon_s: run.horizon_s,
      model_version: MODEL_VERSION,
      twin_version: TWIN_MODEL_VERSION,
      equipment_version: sim.version,
      faults: [...(run.scenarioFaults ? sim.faults ?? [] : []), ...run.injected].map(encodeFault),
      results: { ok: des.ok, ng: des.ng, uph: Math.round(des.uph * 10) / 10, collisions: 0, alarms: des.stations.filter((s) => s.down > 0).length },
      assumptions: sim.stations.map((s) => ({ name: `${s.name} time`, value: s.time_s != null ? String(s.time_s) : s.laser ? 'calculated' : 'not defined', unit: 's', basis: s.time_basis ?? 'USER_INPUT' })),
      note: run.failures ? 'random failures on' : undefined,
    };
    set((s) => ({ ...s, twin: { ...s.twin, runs: [...(s.twin?.runs ?? []), r] } }));
  };
  const replay = (r: TwinRun) => setRun(() => ({ seed: r.seed, horizon_s: r.horizon_s, failures: r.note === 'random failures on', scenarioFaults: false, injected: r.faults.map(decodeFault) }));
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div>
        <div className="mb-2 flex flex-wrap items-end gap-2">
          <Field label="Random seed" htmlFor="tw-seed">
            <NumInput label="Random seed" value={run.seed} min={1} onChange={(v) => v && setRun((r) => ({ ...r, seed: Math.round(v) }))} />
          </Field>
          <Field label="Horizon (min)" htmlFor="tw-h">
            <NumInput label="Run horizon in minutes" value={run.horizon_s / 60} min={1} max={480} onChange={(v) => v && setRun((r) => ({ ...r, horizon_s: v * 60 }))} />
          </Field>
          <Button variant="primary" onClick={record} disabled={!des}>
            <CircleDot className="size-4" aria-hidden /> Record run
          </Button>
        </div>
        <p className="mb-2 text-micro text-ink-3">A recorded run stores its inputs, versions, seed and results; events are regenerated deterministically on replay (§129). Save the scenario to keep runs.</p>
        <Table head={['Run', 'Seed', 'Horizon', 'Faults', 'Good / NG', 'UPH', 'Versions', '']} dense>
          {(sim.twin?.runs ?? []).length ? (
            (sim.twin?.runs ?? []).map((r, i) => (
              <tr key={r.id}>
                <td className="font-mono text-micro">Run {String(i + 1).padStart(3, '0')}</td>
                <td className="num">{r.seed}</td>
                <td className="num">{Math.round(r.horizon_s / 60)} min</td>
                <td className="text-micro">{r.faults.length}</td>
                <td className="num">
                  {r.results.ok} / {r.results.ng}
                </td>
                <td className="num">{r.results.uph}</td>
                <td className="text-micro text-ink-3">
                  {r.model_version} · {r.twin_version} · v{r.equipment_version ?? 1}
                </td>
                <td>
                  <Button size="sm" onClick={() => replay(r)}>
                    Replay
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="text-meta text-ink-3">
                No recorded runs.
              </td>
            </tr>
          )}
        </Table>
      </div>
      <div>
        <div className="mb-2 flex flex-wrap items-end gap-2">
          <Field label="Snapshot name" htmlFor="tw-sn">
            <input id="tw-sn" className="h-9 rounded-control border border-line bg-panel px-2 text-body" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Laser close-up for review" />
          </Field>
          <Button onClick={() => (onSnapshot(name.trim() || `Snapshot ${(sim.twin?.snapshots ?? []).length + 1}`), setName(''))}>Save view</Button>
          <Button onClick={onPng}>
            <Download className="size-4" aria-hidden /> PNG
          </Button>
        </div>
        <p className="mb-2 text-micro text-ink-3">An engineering snapshot stores camera, visible layers, selection and simulation time (§116).</p>
        <ul className="space-y-1">
          {(sim.twin?.snapshots ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 rounded-control border border-line px-2 py-1 text-meta">
              <span>
                {s.name} <span className="text-micro text-ink-3">· {s.view} · t {fmtT(s.t_s)}</span>
              </span>
              <span className="flex gap-1">
                <Button size="sm" onClick={() => onRestore(s.id)}>
                  Restore
                </Button>
                <Button size="sm" onClick={() => set((x) => ({ ...x, twin: { ...x.twin, snapshots: (x.twin?.snapshots ?? []).filter((y) => y.id !== s.id) } }))} aria-label={`Delete ${s.name}`}>
                  <Trash2 className="size-3.5" aria-hidden />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ scenario compare + factory (§64, §105, §107) */

export function ComparePanel({ eng, sim, d, twin, other, setOther, ghost, setGhost, set, customer }: { eng: TabProps['eng']; sim: Sim; d: TabProps['d']; twin: TwinModel; other: string; setOther: (id: string) => void; ghost: boolean; setGhost: (b: boolean) => void; set: TabProps['set']; customer: boolean }) {
  const o = eng.byId.get(other) as Sim | undefined;
  const rows = useMemo(() => {
    const a = scenarioMetrics(sim, eng.byId, eng.defs, eng.fx);
    const b = o ? scenarioMetrics(o, eng.byId, eng.defs, eng.fx) : null;
    const mb = o ? buildMachine(resolveScenario(o, eng.byId, eng.defs), eng.byId, eng.defs) : null;
    const comp = (m: MachineModel) => m.objects.filter((x) => x.partId).length;
    const r: [string, string, string][] = [
      ['Practical UPH', num(a.practicalUph, 4), b ? num(b.practicalUph, 4) : '—'],
      ['Cycle time', `${num(a.cycle)} s`, b ? `${num(b.cycle)} s` : '—'],
      ['Bottleneck', a.bottleneck ?? '—', b?.bottleneck ?? '—'],
      ['Stations', String(sim.stations.length), o ? String(o.stations.length) : '—'],
      ['Components in the 3D model', String(comp(twin.model)), mb ? String(comp(mb)) : '—'],
      ['Machine W × D × H', `${Math.round(twin.model.dims.width)} × ${Math.round(twin.model.dims.depth)} × ${Math.round(twin.model.dims.height)} mm`, mb ? `${Math.round(mb.dims.width)} × ${Math.round(mb.dims.depth)} × ${Math.round(mb.dims.height)} mm` : '—'],
      ['Conceptual footprint', `${((twin.model.dims.width * twin.model.dims.depth) / 1e6).toFixed(2)} m²`, mb ? `${((mb.dims.width * mb.dims.depth) / 1e6).toFixed(2)} m²` : '—'],
    ];
    if (!customer) r.push(['Equipment cost', a.capex != null ? `₹${Math.round(a.capex).toLocaleString('en-IN')}` : 'Not Available', b ? (b.capex != null ? `₹${Math.round(b.capex).toLocaleString('en-IN')}` : 'Not Available') : '—']);
    return r;
  }, [sim, o, eng, twin, customer]);
  const machines = d.cap?.machinesRequired ?? null;
  const placements = sim.twin?.factory ?? [];
  const place = (n: number) =>
    set((s) => ({
      ...s,
      twin: { ...s.twin, factory: Array.from({ length: n }, (_, i) => ({ id: `m${i + 1}`, sim_id: s.id, x_mm: (i % 3) * (twin.model.dims.width + 1500), z_mm: Math.floor(i / 3) * (twin.model.dims.depth + 2500) + twin.model.dims.depth + 2500, rot_deg: 0 })) },
    }));
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div>
        <div className="mb-2 flex flex-wrap items-end gap-2">
          <Field label="Compare with" htmlFor="tw-cmp">
            <Select id="tw-cmp" value={other} onChange={(e) => setOther(e.target.value)}>
              <option value="">Select a scenario…</option>
              {eng.sims
                .filter((s) => s.id !== sim.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </Select>
          </Field>
          <label className="inline-flex items-center gap-1.5 text-meta">
            <input type="checkbox" checked={ghost} disabled={!o} onChange={(e) => setGhost(e.target.checked)} /> Show its outline in 3D
          </label>
        </div>
        <Table head={['', sim.scenario_label ? `This (${sim.scenario_label})` : 'This scenario', o ? (o.scenario_label ? `Other (${o.scenario_label})` : 'Other') : 'Other']} dense>
          {rows.map(([k, a, b]) => (
            <tr key={k}>
              <td className="font-medium">{k}</td>
              <td className="num">{a}</td>
              <td className={clsx('num', b !== a && b !== '—' && 'text-accent-2')}>{b}</td>
            </tr>
          ))}
        </Table>
      </div>
      <div>
        <div className="mb-1 text-meta font-medium text-ink-2">Factory view (conceptual boxes, §67, §107)</div>
        <p className="mb-2 text-micro text-ink-3">
          Machines required for the annual target: <strong>{machines ?? 'Not Available (annual units or shift not set)'}</strong>. Placements are layout aids, not a factory CAD.
        </p>
        <div className="mb-2 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => place(Math.max(1, machines ?? 2))}>
            Place {Math.max(1, machines ?? 2)} machine(s)
          </Button>
          <Button size="sm" onClick={() => place(placements.length + 1)}>
            Duplicate
          </Button>
          <Button size="sm" disabled={!placements.length} onClick={() => set((s) => ({ ...s, twin: { ...s.twin, factory: [] } }))}>
            Clear
          </Button>
        </div>
        {placements.length > 0 && (
          <Table head={['Machine', 'X (mm)', 'Z (mm)', 'Rotation', '']} dense>
            {placements.map((p, i) => (
              <tr key={p.id}>
                <td>Machine {i + 1}</td>
                <td>
                  <NumInput label={`Machine ${i + 1} X`} value={p.x_mm} onChange={(v) => v != null && set((s) => ({ ...s, twin: { ...s.twin, factory: (s.twin?.factory ?? []).map((q) => (q.id === p.id ? { ...q, x_mm: v } : q)) } }))} />
                </td>
                <td>
                  <NumInput label={`Machine ${i + 1} Z`} value={p.z_mm} onChange={(v) => v != null && set((s) => ({ ...s, twin: { ...s.twin, factory: (s.twin?.factory ?? []).map((q) => (q.id === p.id ? { ...q, z_mm: v } : q)) } }))} />
                </td>
                <td>
                  <Button size="sm" onClick={() => set((s) => ({ ...s, twin: { ...s.twin, factory: (s.twin?.factory ?? []).map((q) => (q.id === p.id ? { ...q, rot_deg: (q.rot_deg + 90) % 360 } : q)) } }))}>
                    {p.rot_deg}° ↻
                  </Button>
                </td>
                <td>
                  <Button size="sm" onClick={() => set((s) => ({ ...s, twin: { ...s.twin, factory: (s.twin?.factory ?? []).filter((q) => q.id !== p.id) } }))} aria-label={`Remove machine ${i + 1}`}>
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ assumptions, maturity, export (§78, §131–§134, §151) */

export function AssumptionsPanel({ eng, sim, set, d, twin, player, customer }: { eng: TabProps['eng']; sim: Sim; set: TabProps['set']; d: TabProps['d']; twin: TwinModel; player: TwinPlayer | null; customer: boolean }) {
  const verified = eng.records.filter((r) => r.entity === 'verification' && (r as AnyRecord & { simulation_id?: string; result?: string }).simulation_id === sim.id && (r as AnyRecord & { result?: string }).result === 'PASS').length;
  const rows: [string, string, string, string][] = [
    ...d.res.stations.map((s) => [`${s.station.name} time`, s.time != null ? `${s.time.toFixed(3)}` : 'Not defined', 's', s.basis] as [string, string, string, string]),
    ...twin.model.axes.flatMap((a) => [[`${a.name} speed`, a.speed != null ? String(a.speed) : 'Not defined', 'mm/s', a.sources.speed], [`${a.name} acceleration`, a.accel != null ? String(a.accel) : 'Not defined', 'mm/s²', a.sources.accel]] as [string, string, string, string][]),
    ...twin.model.vision.map((v) => [`${v.stationKey} camera working distance`, v.wd != null ? String(v.wd) : 'Not defined', 'mm', v.wd != null ? 'Twin input' : 'missing'] as [string, string, string, string]),
    ['Workpiece', `${twin.model.workpiece.length} × ${twin.model.workpiece.width} × ${twin.model.workpiece.thickness}`, 'mm', twin.model.workpiece.basis],
    ['Scan path', twin.symbolicArea ? 'symbolic, in a placeholder area' : 'symbolic, inside the required process area', '', 'Visual only — not used for cycle time'],
    ['Geometry', 'procedural conceptual model', '', twin.model.label],
  ];
  const exp = {
    config: () => download(`${sim.id}-configuration.json`, JSON.stringify(sim, null, 2), 'application/json'),
    twin: () => download(`${sim.id}-digital-twin.json`, JSON.stringify({ schemaVersion: 1, twinModelVersion: twin.model.version, simulationEngineVersion: MODEL_VERSION, equipmentVersion: sim.version ?? 1, label: twin.model.label, dims: twin.model.dims, objects: twin.model.objects, axes: twin.model.axes, plan: twin.model.plan, zones: twin.model.zones, io: twin.model.io, checks: twin.checks }, null, 2), 'application/json'),
    events: () => player && download(`${sim.id}-events.csv`, csv([['t_s', 'type', 'station', 'part', 'text'], ...player.events.map((e) => [e.t.toFixed(3), e.type, e.station, e.part, e.text])]), 'text/csv'),
    bom: () => download(`${sim.id}-bom.csv`, csv([['level', 'name', 'part', 'qty', 'supplier', 'unit_cost', 'currency', 'basis', 'lead_time_weeks'], ...d.bom.items.map((b) => [b.level, b.name, b.partId, b.quantity, customer ? '' : b.supplier, customer ? '' : b.unitCost, customer ? '' : b.currency, b.basis, b.leadTimeWeeks])]), 'text/csv'),
    results: () => player && download(`${sim.id}-results.csv`, csv([['station', 'utilization', 'blocked', 'starved', 'down', 'avg_queue', 'processed'], ...player.des.stations.map((s) => [s.name, s.utilization, s.blocked, s.starved, s.down, s.avgQueue, s.processed]), [], ['good', player.des.ok], ['ng', player.des.ng], ['uph', player.des.uph], ['seed', player.des.seed]]), 'text/csv'),
    report: () => download(`${sim.id}-3d-machine-report.md`, machineReport(sim, d, twin, player, customer), 'text/markdown'),
  };
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <div className="xl:col-span-3">
        <Table head={['Assumption / input', 'Value', 'Unit', 'Source · basis']} dense>
          {rows.map(([a, v, u, s]) => (
            <tr key={a}>
              <td>{a}</td>
              <td className="num">{v}</td>
              <td className="text-micro">{u}</td>
              <td className="text-micro text-ink-3">{s}</td>
            </tr>
          ))}
        </Table>
      </div>
      <div className="space-y-3 xl:col-span-2">
        <div className="grid grid-cols-2 gap-2">
          <Field label="3D model maturity">
            <SmallSelect label="3D model maturity" value={sim.twin?.model_maturity ?? 'Procedural'} options={TWIN_MODEL_MATURITY.map((m) => ({ value: m, label: m }))} onChange={(v) => set((s) => ({ ...s, twin: { ...s.twin, model_maturity: v as never } }))} className="w-full" />
          </Field>
          <Field label="Simulation maturity">
            <SmallSelect label="Simulation maturity" value={sim.twin?.sim_maturity ?? 'Conceptual'} options={TWIN_SIM_MATURITY.filter((m) => m !== 'Validated' || verified > 0).map((m) => ({ value: m, label: m }))} onChange={(v) => set((s) => ({ ...s, twin: { ...s.twin, sim_maturity: v as never } }))} className="w-full" />
          </Field>
        </div>
        <p className="text-micro text-ink-3">“Validated” is offered only when a PASS verification record is linked to this scenario ({verified} found).</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={exp.report}>
            <Download className="size-3.5" aria-hidden /> 3D machine report
          </Button>
          <Button size="sm" onClick={exp.config}>
            Configuration JSON
          </Button>
          <Button size="sm" onClick={exp.twin}>
            Digital twin JSON
          </Button>
          <Button size="sm" onClick={exp.events} disabled={!player}>
            Events CSV
          </Button>
          <Button size="sm" onClick={exp.bom}>
            BOM CSV
          </Button>
          <Button size="sm" onClick={exp.results} disabled={!player}>
            Results CSV
          </Button>
        </div>
        {customer && <p className="text-micro text-ink-3">Customer mode: exports omit supplier identities and prices.</p>}
      </div>
    </div>
  );
}

function machineReport(sim: Sim, d: TabProps['d'], twin: TwinModel, player: TwinPlayer | null, customer: boolean) {
  const m = twin.model;
  const c = d.cycle;
  const L: string[] = [];
  L.push(`# 3D Machine Report — ${sim.name}`, '', `> ${m.label} — engineering simulation model, not a CAD manufacturing release. Model ${m.version}, simulation ${MODEL_VERSION}, equipment v${sim.version ?? 1}.${sim.data_type === 'DEMO' ? ' **DEMO DATA.**' : ''}`, '');
  L.push('## Machine overview', `- Layout: ${d.res.layout}`, `- Size (conceptual): ${Math.round(m.dims.width)} × ${Math.round(m.dims.depth)} × ${Math.round(m.dims.height)} mm`, `- Workpiece: ${m.workpiece.template} ${m.workpiece.length} × ${m.workpiece.width} × ${m.workpiece.thickness} mm (${m.workpiece.basis})`, '');
  L.push('## Architecture', ...d.res.stations.map((s, i) => `${i + 1}. ${s.station.name} (${s.station.kind}) — ${s.time != null ? `${s.time.toFixed(3)} s` : 'time not defined'} [${s.basis}]`), '');
  L.push('## Components', ...m.objects.filter((o) => o.partId).map((o) => `- ${o.name}${o.stationKey ? ` · ${o.stationKey}` : ''}`), '');
  if (m.axes.length) L.push('## Motion', ...m.axes.map((a) => `- ${a.name}: travel ${a.stroke ?? '—'} mm, ${a.speed ?? '—'} mm/s, ${a.accel ?? '—'} mm/s² (${a.sources.speed})`), ...m.plan.map((p) => `- ${p.label}: ${p.time != null ? `${p.time.toFixed(3)} s` : 'not defined'}`), '');
  if (c) L.push('## Simulation', `- Cycle time ${c.cycle.toFixed(3)} s · theoretical ${c.theoreticalUph.toFixed(0)} UPH · practical ${c.practicalUph.toFixed(0)} UPH (OEE ${(c.oee * 100).toFixed(1)} %)`, `- Bottleneck: ${c.bottleneck.rs.station.name} (${c.bottleneck.mean.toFixed(3)} s)`, ...(player ? [`- DES run: seed ${player.des.seed}, ${Math.round(player.des.horizon_s / 60)} min → ${player.des.ok} good, ${player.des.ng} NG, ${player.des.uph.toFixed(1)} UPH`] : []), '');
  if (!customer) L.push('## BOM & cost', `- ${d.bom.items.filter((i) => i.level === 'Component').length} component lines · total ${d.bom.total != null ? `${d.bom.currency} ${Math.round(d.bom.total).toLocaleString('en-IN')}` : 'not available (missing prices or FX)'}`, '');
  L.push('## Requirements', ...(sim.requirement_ids ?? []).map((id) => `- ${id}`), '');
  L.push('## Design check', ...twin.checks.filter((x) => x.severity !== 'ok').map((x) => `- [${x.severity}] ${x.area}: ${x.text}`), ...(twin.checks.some((x) => x.severity !== 'ok') ? [] : ['- No open findings']), '');
  L.push('## Assumptions', '- Station times carry their basis (DEMO / user input / calculated).', '- Scan path is symbolic; cycle time uses the station process inputs.', '- Collision is bounding-box only; safety zones are visual aids, not certified safety validation.', '');
  return L.join('\n');
}

/* ------------------------------------------------------------------ simulation inputs (§161–§163) */

const BASIS_OPTS = [
  { value: 'USER_INPUT', label: 'User input' },
  { value: 'EMPIRICAL', label: 'Measured / empirical' },
  { value: 'MANUFACTURER_DATA', label: 'Manufacturer data' },
  { value: 'ASSUMPTION', label: 'Assumption' },
] as const;

/**
 * Every input the simulation needs, grouped by station, editable in place. Empty = not defined:
 * the station is shown in the sequence preview with a visual placeholder and reported as a gap.
 */
export function InputsPanel({ sim, set, d, preview }: { sim: Sim; set: TabProps['set']; d: TabProps['d']; preview: boolean }) {
  const patch = (key: string, p: Partial<Sim['stations'][number]>) => set((s) => ({ ...s, stations: s.stations.map((x) => (x.key === key ? { ...x, ...p } : x)) }));
  const patchLaser = (key: string, p: Record<string, number | null>) => set((s) => ({ ...s, stations: s.stations.map((x) => (x.key === key ? { ...x, laser: { ...x.laser, ...p } } : x)) }));
  return (
    <div className="space-y-3">
      {preview ? (
        <p className="rounded-control border border-warn/40 bg-warn/10 px-3 py-2 text-meta">
          <strong>Sequence preview.</strong> {d.res.blocking.length} input{d.res.blocking.length === 1 ? ' is' : 's are'} not defined, so the 3D machine walks through its sequence with a visual placeholder for those stations and shows <em>no</em> results. Enter the values below (with their basis) to run the real simulation.
        </p>
      ) : (
        <p className="text-meta text-ink-3">All simulation inputs are defined. Changing a value re-runs the simulation, the 3D timeline, cycle time and capacity together.</p>
      )}
      <Table head={['Station', 'Kind', 'Time per part (s)', 'Basis', 'Laser process inputs', 'Status']} dense>
        {sim.stations.map((st) => {
          const rs = d.res.stations.find((r) => r.station.key === st.key);
          const gaps = rs?.missing ?? [];
          const lz = st.laser ?? {};
          const byPath = lz.path_mm != null || /weld|cut|scrib/i.test(`${st.name} ${sim.name}`);
          return (
            <tr key={st.key}>
              <td className="font-medium">{st.name}</td>
              <td className="text-micro">{st.kind}</td>
              <td>
                {st.kind === 'laser' && rs?.basis === 'CALCULATED' ? (
                  <span className="text-micro text-ink-3">calculated: {rs.time?.toFixed(3)} s</span>
                ) : (
                  <NumInput label={`${st.name} time per part`} value={st.time_s} min={0} onChange={(v) => patch(st.key, { time_s: v, time_basis: v == null ? st.time_basis : st.time_basis ?? 'USER_INPUT' })} />
                )}
              </td>
              <td>
                <SmallSelect label={`${st.name} basis`} value={(st.time_basis ?? 'USER_INPUT') as (typeof BASIS_OPTS)[number]['value']} options={BASIS_OPTS} onChange={(v) => patch(st.key, { time_basis: v })} className="!w-auto" />
              </td>
              <td>
                {st.kind === 'laser' ? (
                  <div className="flex flex-wrap items-center gap-1 text-micro">
                    {byPath ? (
                      <>
                        path <NumInput label={`${st.name} path length mm`} value={lz.path_mm ?? null} min={0} width="w-16" onChange={(v) => patchLaser(st.key, { path_mm: v })} /> mm
                      </>
                    ) : (
                      <>
                        area <NumInput label={`${st.name} area mm2`} value={lz.area_mm2 ?? null} min={0} width="w-16" onChange={(v) => patchLaser(st.key, { area_mm2: v })} /> mm² · hatch <NumInput label={`${st.name} hatch mm`} value={lz.hatch_mm ?? null} min={0} width="w-14" onChange={(v) => patchLaser(st.key, { hatch_mm: v })} />
                      </>
                    )}
                    · speed <NumInput label={`${st.name} speed mm/s`} value={lz.speed_mm_s ?? null} min={0} width="w-16" onChange={(v) => patchLaser(st.key, { speed_mm_s: v })} /> · passes <NumInput label={`${st.name} passes`} value={lz.passes ?? null} min={1} width="w-12" onChange={(v) => patchLaser(st.key, { passes: v })} /> · overhead <NumInput label={`${st.name} overhead s`} value={lz.jump_overhead_s ?? null} min={0} width="w-12" onChange={(v) => patchLaser(st.key, { jump_overhead_s: v })} /> s
                  </div>
                ) : (
                  <span className="text-micro text-ink-3">—</span>
                )}
              </td>
              <td>{gaps.length ? <Badge tone="warn">{gaps.map((g) => g.replace(`${st.name}: `, '')).join('; ')}</Badge> : <Badge tone="ok">defined</Badge>}</td>
            </tr>
          );
        })}
      </Table>
      <p className="text-micro text-ink-3">Nothing is estimated for you: a laser station is calculated from area ÷ (hatch × speed) × passes + overhead (or path ÷ speed × passes + overhead) once those inputs exist; otherwise enter its measured time. Axis speeds come from the stage records (Motion panel).</p>
      {d.res.transfer && <TransferInputs sim={sim} set={set} tm={d.res.transfer} />}
    </div>
  );
}

/** Inline part transfer between stations: distance (entered) ÷ speed (entered or the conveyor's stated max speed). */
function TransferInputs({ sim, set, tm }: { sim: Sim; set: TabProps['set']; tm: NonNullable<TabProps['d']['res']['transfer']> }) {
  const patch = (p: Record<string, number | null>) => set((s) => ({ ...s, twin: { ...s.twin, transfer: { ...s.twin?.transfer, ...p } } }));
  return (
    <section className="rounded-control border border-line p-3" aria-label="Part transfer between stations">
      <h4 className="text-meta font-semibold">Part transfer between stations (inline line)</h4>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-meta">
        distance <NumInput label="Transfer distance mm" value={sim.twin?.transfer?.distance_mm ?? null} min={0} width="w-20" onChange={(v) => patch({ distance_mm: v })} /> mm · speed <NumInput label="Transfer speed mm/s" value={sim.twin?.transfer?.speed_mm_s ?? null} placeholder={tm.speed != null ? String(tm.speed) : 'mm/s'} min={0} width="w-20" onChange={(v) => patch({ speed_mm_s: v })} /> mm/s · acceleration <NumInput label="Transfer acceleration mm/s2" value={sim.twin?.transfer?.accel_mm_s2 ?? null} placeholder="optional" min={0} width="w-20" onChange={(v) => patch({ accel_mm_s2: v })} /> mm/s²
        <span className="ml-auto">{tm.time != null ? <Badge tone="ok">{tm.time.toFixed(3)} s per transfer — included</Badge> : <Badge tone="warn">not included</Badge>}</span>
      </div>
      <p className="mt-1 text-micro text-ink-3">
        Speed: {tm.sources.speed}. A station stays occupied until its part has moved on, so the transfer time is added to every station except the last. The distance is never taken from the conceptual 3D layout — enter the real pitch.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ utilities (§97) */

export function UtilitiesPanel({ u, live, customer }: { u: UtilitySummary; live: number | null; customer: boolean }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Stated power (Σ components)" value={u.statedPower > 0 ? `${(u.statedPower / 1000).toFixed(2)} kW` : 'Not Available'} />
        <Stat label="Live power (working stations)" value={live != null ? `${(live / 1000).toFixed(2)} kW` : '—'} />
        <Stat label="Energy per part" value={u.energyPerPart != null ? `${u.energyPerPart.toFixed(2)} Wh` : 'Not Available'} />
        <Stat label="Extraction airflow" value={u.airflow != null ? `${u.airflow.toFixed(0)} m³/h` : 'Not Available'} />
      </div>
      <p className="text-micro text-ink-3">
        From the selected components’ records only (typical consumption, else rated input power) — not a metered value. Energy per part = stated power × working time per part; components without a value are left out, so it is a lower bound. Compressed air is not stated in any selected record.
      </p>
      {!customer && (
        <Table head={['Component', 'Station', 'Power', 'Basis', 'Airflow']} dense>
          {u.items.map((i) => (
            <tr key={`${i.partId}-${i.stationKey}`}>
              <td>
                <Link to={recordPath(i.partId)} className="text-accent-2 hover:underline">
                  {i.name}
                </Link>
                {i.qty > 1 ? ` × ${i.qty}` : ''}
              </td>
              <td className="text-micro">{i.stationKey === '_machine' ? 'machine' : i.stationKey}</td>
              <td className="num">{i.power != null ? `${i.power} W` : <Unknown label="Not stated" />}</td>
              <td className="text-micro text-ink-3">{i.powerBasis ?? '—'}</td>
              <td className="num">{i.airflow != null ? `${i.airflow} m³/h` : '—'}</td>
            </tr>
          ))}
        </Table>
      )}
      {u.missingPower.length > 0 && <p className="text-micro text-warn">No power value in the record: {u.missingPower.map((i) => i.name).join(', ')}.</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-line bg-panel px-2.5 py-2">
      <div className="text-micro uppercase tracking-wider text-ink-3">{label}</div>
      <div className="font-mono text-body font-semibold">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ part trace (§35, §37) */

export function PartTracePanel({ player, snap, part, setPart, t, setT }: { player: TwinPlayer | null; snap: SimulationState | null; part: number | null; setPart: (p: number | null) => void; t: number; setT: (t: number) => void }) {
  if (!player) return <p className="text-meta text-ink-3">No simulation run.</p>;
  const inSystem = [...new Set((snap?.stations ?? []).flatMap((s) => s.servers.filter((x) => x.part >= 0).map((x) => x.part)))].sort((a, b) => a - b);
  const ev = part != null ? player.events.filter((e) => e.part === part) : [];
  const rejectedAt = part != null ? player.rejectAt.get(part) : undefined;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-meta">
        <span className="text-ink-2">Follow a part:</span>
        {inSystem.length ? (
          inSystem.map((p) => (
            <button key={p} type="button" onClick={() => setPart(p === part ? null : p)} aria-pressed={p === part} className={clsx('rounded-full border px-2 py-0.5 font-mono text-micro', p === part ? 'border-accent bg-accent-soft text-accent-2' : 'border-line hover:border-accent')}>
              #{p}
            </button>
          ))
        ) : (
          <span className="text-ink-3">no part in the machine at t = {fmtT(t)}</span>
        )}
        {part != null && (
          <Button size="sm" onClick={() => setPart(null)}>
            Stop following
          </Button>
        )}
      </div>
      <p className="text-micro text-ink-3">Click a part in the 3D view (inline lines) or pick it here: the camera follows it and its history comes from the same simulation run. A part that the run rejects is ringed red at the station that rejects it.</p>
      {part != null && (
        <>
          <p className="text-meta">
            Part <strong>#{part}</strong> — {ev.length} events in this run · outcome in this run: {rejectedAt != null ? <Badge tone="bad">rejected at {player.res.stations[rejectedAt]?.station.name}</Badge> : ev.some((e) => e.type === 'UNLOAD') ? <Badge tone="ok">PASS</Badge> : <Badge>still in the machine at the end of the run</Badge>}
          </p>
          <Table head={['t', 'Event', 'Station', '']} dense>
            {ev.map((e, i) => (
              <tr key={i} className={clsx(e.t <= t && 'text-ink', e.t > t && 'text-ink-3')}>
                <td className="num font-mono">{fmtT(e.t)}</td>
                <td className="text-micro">{e.type}</td>
                <td>{player.res.stations.find((s) => s.station.key === e.station)?.station.name ?? e.station}</td>
                <td>
                  <button type="button" className="text-micro text-accent-2 hover:underline" onClick={() => setT(e.t + 1e-6)}>
                    Go to
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </>
      )}
    </div>
  );
}
