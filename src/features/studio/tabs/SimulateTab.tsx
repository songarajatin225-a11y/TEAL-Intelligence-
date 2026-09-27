import clsx from 'clsx';
import { Activity, Pause, Play, RotateCcw, SkipForward, Square } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, EmptyState, Field, Notice, SegmentedControl, Table } from '../../../components/ui';
import type { StationKind } from '../../../domain/engineering';
import { bottleneckEvidence } from '../../../services/sim/capacity';
import { replayAt, runDes, type DesResult, type ServerState } from '../../../services/sim/des';
import type { TabProps } from '../ScenarioPage';
import { num, pct } from '../shared';
import { NumInput } from './edit';

/** §73 machine states from a server state and the station's kind. */
export function machineState(state: ServerState, kind: StationKind, started: boolean): string {
  if (state === 'down') return 'Fault / maintenance';
  if (state === 'blocked') return 'Waiting (blocked)';
  if (state === 'idle') return started ? 'Waiting (starved)' : 'Idle';
  return { load: 'Loading', unload: 'Unloading', align: 'Aligning', vision: 'Aligning', inspect: 'Inspection', sort: 'Inspection', fixture: 'Loading' }[kind as string] ?? 'Processing';
}
export const STATE_FILL: Record<ServerState, string> = { busy: 'fill-ok', blocked: 'fill-warn', idle: 'fill-ink/15', down: 'fill-bad' };

const SPEEDS = ['0.5', '1', '2', '5', '10'] as const;

export default function SimulateTab({ sim, d }: TabProps) {
  const [hours, setHours] = useState<number | null>(8);
  const [seed, setSeed] = useState<number | null>(1);
  const [failures, setFailures] = useState(true);
  const [faults, setFaults] = useState(true);
  const [pm, setPm] = useState(true);
  const [run, setRun] = useState<DesResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const REPLAY = 1800;

  const go = () => {
    setError(null);
    try {
      setRun(runDes(d.res, { horizon_s: (hours ?? 8) * 3600, warmup_s: Math.min(1800, (hours ?? 8) * 360), seed: seed ?? 1, failures, maintenance: pm, faults: faults ? sim.faults : undefined, traceUntil_s: REPLAY }));
    } catch (e) {
      setError((e as Error).message);
    }
  };
  if (!d.res.runnable) return <EmptyState icon={Activity} title="The material-flow simulation cannot run yet" explain={`Missing: ${d.res.blocking.join('; ')}.`} />;
  const ev = run && d.cycle ? bottleneckEvidence(d.cycle, run.stations) : [];
  return (
    <div className="space-y-4">
      <Card title="Discrete-event simulation" icon={Activity} description="Queues, buffers, parallel stations, blocking, starvation, rejects, rework, failures, scheduled faults and maintenance. Seeded — the same inputs and seed give the same run.">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Run length (h)">
            <NumInput label="Run length hours" min={0.25} max={720} value={hours} onChange={setHours} />
          </Field>
          <Field label="Random seed">
            <NumInput label="Random seed" min={1} value={seed} onChange={(v) => setSeed(v == null ? 1 : Math.round(v))} />
          </Field>
          {[
            ['Random failures (MTBF/MTTR)', failures, setFailures],
            [`Scenario faults (${(sim.faults ?? []).length})`, faults, setFaults],
            ['Preventive maintenance', pm, setPm],
          ].map(([label, v, f]) => (
            <label key={label as string} className="inline-flex min-h-9 items-center gap-2 text-meta">
              <input type="checkbox" checked={v as boolean} onChange={(e) => (f as (b: boolean) => void)(e.target.checked)} /> {label as string}
            </label>
          ))}
          <Button variant="primary" onClick={go}>
            <Play className="size-4" aria-hidden /> Run simulation
          </Button>
        </div>
        {error && <Notice tone="warn">{error}</Notice>}
      </Card>
      {run && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ['Simulated UPH (good)', num(run.uph, 4), `capacity engine: ${num(d.cycle?.practicalUph, 4)}`],
              ['Good parts', String(run.ok), `after ${num(run.warmup_s / 60)} min warm-up`],
              ['Rejects', String(run.ng), `${run.reworked} reworked`],
              ['Average lead time', run.leadTimeAvg != null ? `${num(run.leadTimeAvg)} s` : 'Not Available', 'part in → part out'],
              ['Average WIP', num(run.wipAvg), 'parts in the machine'],
            ].map(([l, v, s]) => (
              <div key={l} className="surface rounded-card px-4 py-3">
                <div className="text-meta text-ink-3">{l}</div>
                <div className="num text-metric font-semibold">{v}</div>
                <div className="text-micro text-ink-3">{s}</div>
              </div>
            ))}
          </div>
          <Replay key={`${run.seed}-${run.horizon_s}-${run.events}`} run={run} d={d} until={REPLAY} />
          <Card title="Station statistics" description="Share of server time in each state (after warm-up)">
            <Table head={['Station', 'Servers', 'Busy', 'Blocked', 'Starved', 'Down', 'Avg queue', 'Max queue', 'State split']} dense>
              {run.stations.map((s) => (
                <tr key={s.key}>
                  <td className="font-medium">{s.name}</td>
                  <td className="num">{s.servers}</td>
                  <td className="num">{pct(s.utilization)}</td>
                  <td className="num">{pct(s.blocked)}</td>
                  <td className="num">{pct(s.starved)}</td>
                  <td className="num">{pct(s.down)}</td>
                  <td className="num">{num(s.avgQueue)}</td>
                  <td className="num">{s.maxQueue}</td>
                  <td className="w-48">
                    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`${s.name}: busy ${pct(s.utilization)}, blocked ${pct(s.blocked)}, starved ${pct(s.starved)}, down ${pct(s.down)}`}>
                      <span className="bg-ok" style={{ width: `${s.utilization * 100}%` }} />
                      <span className="bg-warn" style={{ width: `${s.blocked * 100}%` }} />
                      <span className="bg-ink/25" style={{ width: `${s.starved * 100}%` }} />
                      <span className="bg-bad" style={{ width: `${s.down * 100}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            <p className="mt-2 flex flex-wrap gap-3 text-micro text-ink-3">
              <span><span className="mr-1 inline-block size-2 rounded-full bg-ok" />busy</span>
              <span><span className="mr-1 inline-block size-2 rounded-full bg-warn" />blocked (downstream full)</span>
              <span><span className="mr-1 inline-block size-2 rounded-full bg-ink/25" />starved (no part)</span>
              <span><span className="mr-1 inline-block size-2 rounded-full bg-bad" />down</span>
            </p>
          </Card>
          <Card title="Bottleneck — evidence" description="Every claim cites the number behind it">
            <ol className="space-y-2">
              {ev.map((e) => (
                <li key={e.key} className="rounded-control border border-line p-2.5">
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <Badge tone={e.rank === 1 ? 'bad' : 'warn'}>#{e.rank}</Badge> {e.station}
                  </div>
                  <ul className="list-disc pl-5 text-meta">
                    {e.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </Card>
          <p className="text-micro text-ink-3">Model output — not factory-validated. {run.events.toLocaleString('en-IN')} events simulated.</p>
        </>
      )}
    </div>
  );
}

/** Animated material flow — replay of the first 30 simulated minutes (§63 controls). */
function Replay({ run, d, until }: { run: DesResult; d: TabProps['d']; until: number }) {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>('5');
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);
  const shape = d.res.stations.map((s) => (d.res.layout === 'sequential' ? 1 : s.station.parallel ?? 1));
  const state = useMemo(() => replayAt(run.trace, shape, t), [run.trace, t]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!playing) return;
    const tick = (now: number) => {
      const dt = last.current == null ? 0 : (now - last.current) / 1000;
      last.current = now;
      setT((x) => {
        const n = Math.min(until, x + dt * Number(speed));
        if (n >= until) setPlaying(false);
        return n;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = null;
    };
  }, [playing, speed, until]);
  const step = () => {
    const next = run.trace.find((e) => e.t > t + 1e-9);
    setT(next ? next.t : until);
  };
  const W = 118;
  const G = 30;
  const width = 20 + shape.length * (W + G);
  const mm = Math.floor(t / 60);
  const ss = Math.floor(t % 60);
  return (
    <Card
      title="Material flow"
      description="Replay of the first 30 simulated minutes. Squares are servers; dots are parts waiting in the buffer in front of a station."
      actions={
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant={playing ? 'secondary' : 'primary'} onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />} {playing ? 'Pause' : 'Play'}
          </Button>
          <Button size="sm" onClick={() => (setPlaying(false), setT(until))} aria-label="Stop">
            <Square className="size-3.5" aria-hidden /> Stop
          </Button>
          <Button size="sm" onClick={() => (setPlaying(false), setT(0))} aria-label="Reset">
            <RotateCcw className="size-3.5" aria-hidden /> Reset
          </Button>
          <Button size="sm" onClick={() => (setPlaying(false), step())} aria-label="Step to the next event">
            <SkipForward className="size-3.5" aria-hidden /> Step
          </Button>
          <SegmentedControl label="Playback speed" size="sm" value={speed} onChange={setSpeed} options={SPEEDS.map((s) => ({ value: s, label: `${s}×` }))} />
        </div>
      }
    >
      <div className="mb-2 flex flex-wrap items-center gap-3 text-meta">
        <span className="num font-semibold">
          t = {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </span>
        <Badge tone="ok">OK out {state.ok}</Badge>
        <Badge tone="bad">NG out {state.ng}</Badge>
        <Badge>In machine {state.inSystem}</Badge>
        <input type="range" aria-label="Replay time" min={0} max={until} step={1} value={Math.round(t)} onChange={(e) => (setPlaying(false), setT(Number(e.target.value)))} className="min-w-40 flex-1 accent-[var(--c-accent)]" />
      </div>
      <div className="scroll-thin overflow-x-auto">
        <svg viewBox={`0 0 ${width} 150`} width={width} height={150} role="img" aria-label={`Material flow at ${mm} min ${ss} s: ${state.ok} good parts out`}>
          <line x1={0} y1={112} x2={width} y2={112} className="stroke-line-strong" strokeWidth={6} strokeLinecap="round" />
          {d.res.stations.map((rs, i) => {
            const x = 10 + i * (W + G);
            const k = shape[i];
            const size = Math.min(26, (W - 16 - (k - 1) * 4) / k);
            return (
              <g key={rs.station.key}>
                <rect x={x} y={10} width={W} height={84} rx={10} className="fill-solid stroke-line-strong" />
                <text x={x + 8} y={26} className="fill-ink text-[10.5px] font-semibold">
                  {rs.station.name.length > 18 ? `${rs.station.name.slice(0, 17)}…` : rs.station.name}
                </text>
                {state.servers[i].map((s, j) => (
                  <g key={j}>
                    <rect x={x + 8 + j * (size + 4)} y={36} width={size} height={size} rx={4} className={clsx(STATE_FILL[s], 'transition-[fill] duration-200 motion-reduce:transition-none')}>
                      <title>{machineState(s, rs.station.kind, t > 0)}</title>
                    </rect>
                  </g>
                ))}
                <text x={x + 8} y={84} className="fill-ink-3 text-[9.5px]">
                  {machineState(state.servers[i][0], rs.station.kind, t > 0)}
                </text>
                {i > 0 &&
                  Array.from({ length: Math.min(state.queues[i], 8) }, (_, q) => (
                    <circle key={q} cx={x - 6 - (q % 4) * 7} cy={104 - Math.floor(q / 4) * 8} r={3} className="fill-accent" />
                  ))}
                {i > 0 && state.queues[i] > 8 && (
                  <text x={x - 8} y={128} textAnchor="end" className="fill-accent-2 text-[9px]">
                    +{state.queues[i] - 8}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </Card>
  );
}
