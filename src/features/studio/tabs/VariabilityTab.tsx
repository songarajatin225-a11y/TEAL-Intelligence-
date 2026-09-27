import { Dices, Play, Square } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge, Button, Card, EmptyState, Field, SegmentedControl, Table } from '../../../components/ui';
import { monteCarloChunk, summarizeMc, type McSummary } from '../../../services/sim/analysis';
import type { TabProps } from '../ScenarioPage';
import { num, pct } from '../shared';
import { NumInput } from './edit';

const N = ['100', '1000', '10000'] as const;

/** Single-series histogram: one hue, thin gaps, rounded data-ends, native hover titles, table alongside. */
export function Histogram({ bins, target, unit, label }: { bins: { from: number; to: number; count: number }[]; target?: number | null; unit: string; label: string }) {
  const W = 640;
  const H = 180;
  const pad = { l: 36, r: 8, t: 10, b: 26 };
  const max = Math.max(1, ...bins.map((b) => b.count));
  const lo = bins[0]?.from ?? 0;
  const hi = bins[bins.length - 1]?.to ?? 1;
  const x = (v: number) => pad.l + ((v - lo) / (hi - lo || 1)) * (W - pad.l - pad.r);
  const y = (c: number) => H - pad.b - (c / max) * (H - pad.t - pad.b);
  const bw = (W - pad.l - pad.r) / bins.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-3xl" role="img" aria-label={label}>
      {[0.5, 1].map((f) => (
        <line key={f} x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} className="stroke-line" strokeDasharray="2 3" />
      ))}
      <text x={pad.l - 4} y={y(max) + 4} textAnchor="end" className="fill-ink-3 text-[10px]">
        {max}
      </text>
      <text x={pad.l - 4} y={H - pad.b + 4} textAnchor="end" className="fill-ink-3 text-[10px]">
        0
      </text>
      {bins.map((b, i) => {
        const h = H - pad.b - y(b.count);
        return (
          <g key={i}>
            <path
              d={h > 0 ? `M${pad.l + i * bw + 1},${H - pad.b} v${-Math.max(0, h - 3)} q0,-3 3,-3 h${bw - 8} q3,0 3,3 v${Math.max(0, h - 3)} z` : ''}
              className="fill-accent hover:fill-accent-2"
            >
              <title>{`${num(b.from, 4)}–${num(b.to, 4)} ${unit}: ${b.count} runs`}</title>
            </path>
          </g>
        );
      })}
      <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} className="stroke-line-strong" />
      <text x={pad.l} y={H - 8} className="fill-ink-3 text-[10px]">
        {num(lo, 4)} {unit}
      </text>
      <text x={W - pad.r} y={H - 8} textAnchor="end" className="fill-ink-3 text-[10px]">
        {num(hi, 4)} {unit}
      </text>
      {target != null && target >= lo && target <= hi && (
        <g>
          <line x1={x(target)} x2={x(target)} y1={pad.t} y2={H - pad.b} className="stroke-ink" strokeWidth={1.5} strokeDasharray="4 3" />
          <text x={x(target) + 4} y={pad.t + 10} className="fill-ink text-[10px] font-semibold">
            target {num(target, 4)}
          </text>
        </g>
      )}
    </svg>
  );
}

export default function VariabilityTab({ sim, d }: TabProps) {
  const [n, setN] = useState<(typeof N)[number]>('1000');
  const [hours, setHours] = useState<number | null>(1);
  const [failures, setFailures] = useState(true);
  const [progress, setProgress] = useState<number | null>(null);
  const [res, setRes] = useState<McSummary | null>(null);
  const cancel = useRef(false);
  if (!d.res.runnable) return <EmptyState icon={Dices} title="Monte Carlo cannot run yet" explain={`Missing: ${d.res.blocking.join('; ')}.`} />;
  const target = sim.targets?.uph ?? null;
  const run = async () => {
    const it = Number(n);
    const o = { iterations: it, horizon_s: (hours ?? 1) * 3600, failures };
    cancel.current = false;
    setRes(null);
    const out: number[] = [];
    const chunk = Math.max(10, Math.round(it / 50));
    for (let k = 0; k < it; k += chunk) {
      if (cancel.current) break;
      out.push(...monteCarloChunk(d.res, o, k, Math.min(it, k + chunk)));
      setProgress(out.length / it);
      await new Promise((r) => setTimeout(r, 0));
    }
    setProgress(null);
    if (out.length) setRes(summarizeMc(out, target, o));
  };
  const cycleBins = res ? summarizeMc(res.cycle.filter(Number.isFinite), null, { iterations: 0, horizon_s: 0, failures }).histogram : [];
  return (
    <div className="space-y-4">
      <Card title="Monte Carlo simulation" icon={Dices} description="Many discrete-event runs, each with its own random seed, drawing station times from their distributions and failures from MTBF/MTTR">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Iterations">
            <SegmentedControl label="Iterations" value={n} onChange={setN} options={N.map((x) => ({ value: x, label: Number(x).toLocaleString('en-IN') }))} />
          </Field>
          <Field label="Hours per iteration">
            <NumInput label="Hours per iteration" min={0.1} max={24} value={hours} onChange={setHours} />
          </Field>
          <label className="inline-flex min-h-9 items-center gap-2 text-meta">
            <input type="checkbox" checked={failures} onChange={(e) => setFailures(e.target.checked)} /> Random failures
          </label>
          {progress == null ? (
            <Button variant="primary" onClick={run}>
              <Play className="size-4" aria-hidden /> Run {Number(n).toLocaleString('en-IN')} iterations
            </Button>
          ) : (
            <Button onClick={() => (cancel.current = true)}>
              <Square className="size-4" aria-hidden /> Stop at {Math.round(progress * 100)} %
            </Button>
          )}
        </div>
        {progress != null && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Monte Carlo progress">
            <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </Card>
      {res && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="surface rounded-card px-4 py-3">
              <div className="text-meta text-ink-3">Mean UPH</div>
              <div className="num text-metric font-semibold">{num(res.mean, 4)}</div>
              <div className="text-micro text-ink-3">{res.n} runs</div>
            </div>
            <div className="surface rounded-card px-4 py-3">
              <div className="text-meta text-ink-3">Probability of meeting target</div>
              <div className="num text-metric font-semibold">{res.probMeetTarget != null ? pct(res.probMeetTarget) : 'No target'}</div>
              <div className="text-micro text-ink-3">{target != null ? `runs ≥ ${target} UPH` : 'set a target UPH'}</div>
            </div>
            {res.percentiles
              .filter((p) => p.p === 'P90' || p.p === 'P50')
              .map((p) => (
                <div key={p.p} className="surface rounded-card px-4 py-3">
                  <div className="text-meta text-ink-3">{p.p} throughput</div>
                  <div className="num text-metric font-semibold">{num(p.uph, 4)}</div>
                  <div className="text-micro text-ink-3">reached in {p.p.slice(1)} % of runs</div>
                </div>
              ))}
          </div>
          <Card title="Throughput distribution (UPH per run)" description="Hover a bar for its range and count">
            <Histogram bins={res.histogram} target={target} unit="UPH" label={`Histogram of simulated UPH over ${res.n} runs`} />
          </Card>
          <Card title="Effective cycle-time distribution (s per good part)">
            <Histogram bins={cycleBins} target={sim.targets?.cycle_s ?? null} unit="s" label="Histogram of effective cycle time per run" />
          </Card>
          <Card title="Percentiles">
            <Table head={['Percentile', 'UPH (reached or exceeded)', 'Cycle (not exceeded)']} dense>
              {res.percentiles.map((p) => (
                <tr key={p.p}>
                  <td>
                    <Badge>{p.p}</Badge>
                  </td>
                  <td className="num">{num(p.uph, 4)}</td>
                  <td className="num">{num(p.cycle)} s</td>
                </tr>
              ))}
            </Table>
            <ul className="mt-3 list-disc space-y-0.5 pl-5 text-micro text-ink-3">
              {res.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
