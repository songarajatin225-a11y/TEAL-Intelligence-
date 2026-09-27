import { Play, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge, Button, Card, EmptyState, Field, Table } from '../../../components/ui';
import type { AnyRecord } from '../../../domain';
import type { Part } from '../../../domain/engineering';
import { applyWhatIf, optimize, type Candidate, type Constraints, type OptimizeResult } from '../../../services/sim/analysis';
import { checkPair } from '../../../services/eng/compatibility';
import type { TabProps } from '../ScenarioPage';
import { money, moneyShort, num, pct } from '../shared';
import { NumInput } from './edit';

/** Trade-off scatter: UPH (x) vs CAPEX (y). Frontier points carry a ring and a label; infeasible points are hollow (not colour alone). */
function Scatter({ r, target, budget }: { r: OptimizeResult; target?: number | null; budget?: number | null }) {
  const [hover, setHover] = useState<Candidate | null>(null);
  const pts = r.candidates.filter((c) => c.capex != null);
  if (!pts.length) return null;
  const W = 640;
  const H = 280;
  const pad = { l: 86, r: 16, t: 28, b: 36 };
  const xs = pts.map((p) => p.uph);
  const ys = pts.map((p) => p.capex!);
  const [x0, x1] = [Math.min(...xs) * 0.95, Math.max(...xs) * 1.05];
  const [y0, y1] = [Math.min(...ys) * 0.95, Math.max(...ys) * 1.05];
  const X = (v: number) => pad.l + ((v - x0) / (x1 - x0 || 1)) * (W - pad.l - pad.r);
  const Y = (v: number) => H - pad.b - ((v - y0) / (y1 - y0 || 1)) * (H - pad.t - pad.b);
  const fr = [...r.frontier].sort((a, b) => a.uph - b.uph);
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-3xl" role="img" aria-label="Trade-off: practical UPH against equipment cost for every configuration; the Pareto frontier is marked">
        {target != null && target >= x0 && target <= x1 && <line x1={X(target)} x2={X(target)} y1={pad.t} y2={H - pad.b} className="stroke-ink-3" strokeDasharray="4 3" />}
        {budget != null && budget >= y0 && budget <= y1 && <line x1={pad.l} x2={W - pad.r} y1={Y(budget)} y2={Y(budget)} className="stroke-ink-3" strokeDasharray="4 3" />}
        <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} className="stroke-line-strong" />
        <line x1={pad.l} x2={pad.l} y1={pad.t} y2={H - pad.b} className="stroke-line-strong" />
        <text x={(W + pad.l) / 2} y={H - 6} textAnchor="middle" className="fill-ink-3 text-[11px]">
          Practical UPH →
        </text>
        <text x={pad.l} y={14} className="fill-ink-3 text-[11px]">
          ↑ Equipment cost (CAPEX)
        </text>
        <text x={pad.l - 6} y={Y(y0)} textAnchor="end" className="fill-ink-3 text-[10px]">
          {moneyShort(y0)}
        </text>
        <text x={pad.l - 6} y={Y(y1) + 4} textAnchor="end" className="fill-ink-3 text-[10px]">
          {moneyShort(y1)}
        </text>
        <text x={X(x0)} y={H - pad.b + 14} className="fill-ink-3 text-[10px]">
          {num(x0, 3)}
        </text>
        <text x={X(x1)} y={H - pad.b + 14} textAnchor="end" className="fill-ink-3 text-[10px]">
          {num(x1, 3)}
        </text>
        {fr.length > 1 && <polyline points={fr.map((c) => `${X(c.uph)},${Y(c.capex!)}`).join(' ')} className="fill-none stroke-accent" strokeWidth={2} />}
        {pts.map((c) => (
          <circle
            key={c.key}
            cx={X(c.uph)}
            cy={Y(c.capex!)}
            r={c.pareto ? 6 : 4.5}
            className={c.feasible ? (c.pareto ? 'fill-accent stroke-solid' : 'fill-accent/60 stroke-solid') : 'fill-none stroke-ink-3'}
            strokeWidth={c.pareto ? 2 : 1.5}
            onMouseEnter={() => setHover(c)}
            onMouseLeave={() => setHover(null)}
          >
            <title>{`${c.key}: ${num(c.uph, 4)} UPH, ${money(c.capex)}${c.feasible ? (c.pareto ? ' — Pareto frontier' : ' — feasible') : ` — ${c.violations.join('; ')}`}`}</title>
          </circle>
        ))}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute top-2 right-2 max-w-xs rounded-control border border-line bg-solid px-3 py-2 text-micro shadow-lg">
          <div className="font-semibold">{hover.key}</div>
          <div>
            {num(hover.uph, 4)} UPH · {money(hover.capex)}
          </div>
          <div className="text-ink-3">{hover.feasible ? (hover.pareto ? 'Pareto frontier' : 'Feasible') : hover.violations.join('; ')}</div>
        </div>
      )}
      <p className="mt-1 flex flex-wrap gap-3 text-micro text-ink-3">
        <span>● filled = feasible</span>
        <span>◉ ringed + line = Pareto frontier</span>
        <span>○ hollow = violates a constraint</span>
        <span>dashed = target UPH / budget</span>
      </p>
    </div>
  );
}

export default function OptimizeTab({ eng, sim, d, saveAsNew }: TabProps) {
  const [cons, setCons] = useState<Constraints>({ minUph: sim.targets?.uph ?? null, maxCapex: sim.targets?.capex_budget ?? null, maxFootprint: sim.targets?.footprint_m2 ?? null, maxCycle: sim.targets?.cycle_s ?? null, minLocalization: sim.targets?.localization_pct ?? null, maxUtilization: null });
  const [maxP, setMaxP] = useState<number | null>(3);
  const laserSel = (sim.selections ?? []).find((s) => s.role === 'Laser source');
  const others = (sim.selections ?? []).filter((s) => s.station_key === laserSel?.station_key && s !== laserSel).map((s) => eng.byId.get(s.part_id) as Part & AnyRecord).filter(Boolean);
  const laserOpts = useMemo(() => eng.parts.filter((p) => p.product_type === 'laser_source' && p.id !== laserSel?.part_id && p.record_status !== 'Archived' && !others.some((o) => checkPair(p, o, eng.ctx).relationship === 'Incompatible')), [eng, laserSel, others]);
  const [alts, setAlts] = useState<string[]>([]);
  const [r, setR] = useState<OptimizeResult | null>(null);
  if (!d.res.runnable) return <EmptyState icon={Target} title="Optimization needs a runnable scenario" explain={`Missing: ${d.res.blocking.join('; ')}.`} />;
  const create = (c: Candidate) => {
    let s = applyWhatIf(sim, { parallel: c.parallel, swaps: c.laserPartId && laserSel ? [{ station_key: laserSel.station_key, role: 'Laser source', part_id: c.laserPartId }] : [] });
    s = { ...s, selections: (s.selections ?? []).map((x) => (c.parallel[x.station_key] != null && x.station_key !== '_machine' && x.role !== 'Fume extraction' ? { ...x, quantity: c.parallel[x.station_key] } : x)), stations: s.stations.map((st) => (c.parallel[st.key] && st.capex != null ? { ...st, capex: (st.capex / (st.parallel ?? 1)) * c.parallel[st.key] } : st)) };
    void saveAsNew(s, `Optimization point: ${c.key}`, String.fromCharCode(((sim.scenario_label ?? 'A').charCodeAt(0) || 64) + 1));
  };
  return (
    <div className="space-y-4">
      <Card title="Constraints" icon={Target} description="Only the constraints you enter are applied. The optimizer lists feasible configurations and the trade-off — it never picks one for you.">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
          {(
            [
              ['minUph', 'UPH ≥'],
              ['maxCapex', `CAPEX ≤ (${sim.currency ?? 'INR'})`],
              ['maxFootprint', 'Footprint ≤ (m²)'],
              ['maxCycle', 'Cycle ≤ (s)'],
              ['minLocalization', 'Localization ≥ (%)'],
              ['maxUtilization', 'Utilization at target ≤ (%)'],
            ] as const
          ).map(([k, l]) => (
            <Field key={k} label={l}>
              <NumInput label={l} min={0} value={cons[k] ?? null} onChange={(v) => setCons((c) => ({ ...c, [k]: v }))} width="w-full" />
            </Field>
          ))}
          <Field label="Max parallel stations">
            <NumInput label="Max parallel" min={1} max={4} value={maxP} onChange={(v) => setMaxP(v == null ? 3 : Math.min(4, Math.max(1, Math.round(v))))} width="w-full" />
          </Field>
        </div>
        {laserOpts.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-meta font-medium text-ink-2">Also try these laser sources (compatible with the rest of the laser station)</div>
            <div className="flex flex-wrap gap-2">
              {laserOpts.map((p) => (
                <label key={p.id} className="inline-flex min-h-8 items-center gap-2 rounded-control border border-line px-2 text-meta">
                  <input type="checkbox" checked={alts.includes(p.id)} onChange={(e) => setAlts(e.target.checked ? [...alts, p.id] : alts.filter((x) => x !== p.id))} /> {p.model_number}
                </label>
              ))}
            </div>
          </div>
        )}
        <Button variant="primary" className="mt-3" onClick={() => setR(optimize(sim, eng.byId, eng.defs, eng.fx, cons, { maxParallel: maxP ?? 3, laserAlternatives: alts }))}>
          <Play className="size-4" aria-hidden /> Explore configurations
        </Button>
      </Card>
      {r && (
        <>
          <Card title="Trade-off" description={`${r.candidates.length} configurations · ${r.feasible.length} feasible · ${r.frontier.length} on the Pareto frontier. Variables: ${r.variables.join('; ')}`}>
            <Scatter r={r} target={cons.minUph} budget={cons.maxCapex} />
          </Card>
          <Card title="Pareto frontier (feasible, not dominated)" description="No option here is better on both UPH and CAPEX than another — the choice is an engineering decision">
            {r.frontier.length ? (
              <Table head={['Configuration', 'Practical UPH', 'Cycle', 'CAPEX', 'Local share', 'Utilization at target', '']} dense>
                {r.frontier.map((c) => (
                  <tr key={c.key}>
                    <td>{c.key}</td>
                    <td className="num">{num(c.uph, 4)}</td>
                    <td className="num">{num(c.cycle)} s</td>
                    <td className="num">{money(c.capex)}</td>
                    <td className="num">{pct(c.localization)}</td>
                    <td className="num">{pct(c.utilization)}</td>
                    <td>
                      <Button size="sm" onClick={() => create(c)}>
                        Create scenario
                      </Button>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <p className="text-meta text-ink-3">No configuration satisfies every constraint. Relax a constraint or change the architecture.</p>
            )}
          </Card>
          <Card title="All configurations">
            <Table head={['Configuration', 'UPH', 'CAPEX', 'Status']} dense>
              {r.candidates.map((c) => (
                <tr key={c.key}>
                  <td>{c.key}</td>
                  <td className="num">{num(c.uph, 4)}</td>
                  <td className="num">{money(c.capex)}</td>
                  <td>{c.feasible ? <Badge tone={c.pareto ? 'accent' : 'ok'}>{c.pareto ? 'Frontier' : 'Feasible'}</Badge> : <span className="text-micro text-ink-3">{c.violations.join('; ')}</span>}</td>
                </tr>
              ))}
            </Table>
            <ul className="mt-3 list-disc space-y-0.5 pl-5 text-micro text-ink-3">
              {r.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
