import { FlaskConical, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Card, EmptyState, Field, Table } from '../../../components/ui';
import type { AnyRecord } from '../../../domain';
import type { Part } from '../../../domain/engineering';
import { applyWhatIf, scenarioMetrics, type WhatIf } from '../../../services/sim/analysis';
import type { TabProps } from '../ScenarioPage';
import { money, num, pct } from '../shared';
import { NumInput, SmallSelect } from './edit';

export default function WhatIfTab({ eng, sim, set, d, customer, saveAsNew }: TabProps) {
  const [w, setW] = useState<WhatIf>({});
  const laser = sim.stations.find((s) => s.kind === 'laser');
  const applied = useMemo(() => applyWhatIf(sim, w), [sim, w]);
  const base = useMemo(() => scenarioMetrics(sim, eng.byId, eng.defs, eng.fx), [sim, eng]);
  const next = useMemo(() => scenarioMetrics(applied, eng.byId, eng.defs, eng.fx), [applied, eng]);
  const empty = !Object.values(w).some((v) => v != null && (typeof v !== 'object' || Object.keys(v).length));
  if (!d.res.runnable && !laser) return <EmptyState icon={FlaskConical} title="What-if needs a runnable scenario" explain={`Missing: ${d.res.blocking.join('; ')}.`} />;
  const rows: [string, (m: typeof base) => string, (m: typeof base) => number | null, boolean?][] = [
    ['Cycle time (s)', (m) => num(m.cycle), (m) => m.cycle],
    ['Practical UPH', (m) => num(m.practicalUph, 4), (m) => m.practicalUph],
    ['Bottleneck', (m) => m.bottleneck ?? '—', () => null],
    ['Meets target', (m) => (m.meetsTarget == null ? 'No target' : m.meetsTarget ? 'Yes' : 'No'), () => null],
    ['Equipment cost', (m) => money(m.capex, m.currency), (m) => m.capex, true],
    ['Local cost share', (m) => pct(m.localization), (m) => m.localization, true],
    ['Energy per part (kWh, estimate)', (m) => num(m.energyKwhPerPart), (m) => m.energyKwhPerPart],
  ];
  const swapRoles = (sim.selections ?? []).filter((x) => ['laser_source', 'galvo', 'f_theta', 'camera', 'servo_drive', 'plc', 'chiller'].includes((eng.byId.get(x.part_id) as Part | undefined)?.product_type ?? ''));
  return (
    <div className="space-y-4">
      <Card
        title="What-if"
        icon={FlaskConical}
        description="Change inputs and see the dependent results recalculated. The scenario is not changed until you apply or save."
        actions={
          <Button size="sm" onClick={() => setW({})} disabled={empty}>
            <RotateCcw className="size-3.5" aria-hidden /> Reset
          </Button>
        }
      >
        {laser && (
          <div className="mb-4">
            <h3 className="mb-2 text-body font-semibold">Laser process ({laser.name})</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {(
                [
                  ['speed_mm_s', 'Speed (mm/s)'],
                  ['passes', 'Passes'],
                  ['frequency_khz', 'Frequency (kHz)'],
                  ['power_w', 'Power (W)'],
                  ['jump_overhead_s', 'Overhead (s)'],
                ] as const
              ).map(([k, l]) => (
                <Field key={k} label={`${l} — now ${laser.laser?.[k] ?? '—'}`}>
                  <NumInput label={l} min={0} value={w.laser?.[k] ?? null} onChange={(v) => setW((x) => ({ ...x, laser: { ...x.laser, [k]: v ?? undefined } }))} width="w-full" />
                </Field>
              ))}
            </div>
          </div>
        )}
        <h3 className="mb-2 text-body font-semibold">Stations</h3>
        <Table head={['Station', 'Time now (s)', 'What-if time (s)', 'Parallel now', 'What-if parallel', 'Buffer now', 'What-if buffer']} dense>
          {sim.stations.map((s, i) => (
            <tr key={s.key}>
              <td>{s.name}</td>
              <td className="num">{num(d.res.stations[i]?.time)}</td>
              <td>
                <NumInput label={`${s.name} what-if time`} min={0} value={w.stationTimes?.[s.key] ?? null} onChange={(v) => setW((x) => ({ ...x, stationTimes: Object.fromEntries(Object.entries({ ...x.stationTimes, [s.key]: v }).filter(([, y]) => y != null)) as Record<string, number> }))} />
              </td>
              <td className="num">{s.parallel ?? 1}</td>
              <td>
                <NumInput label={`${s.name} what-if parallel`} min={1} value={w.parallel?.[s.key] ?? null} onChange={(v) => setW((x) => ({ ...x, parallel: Object.fromEntries(Object.entries({ ...x.parallel, [s.key]: v == null ? v : Math.max(1, Math.round(v)) }).filter(([, y]) => y != null)) as Record<string, number> }))} width="w-16" />
              </td>
              <td className="num">{s.buffer_after ?? 0}</td>
              <td>
                <NumInput label={`${s.name} what-if buffer`} min={0} value={w.buffers?.[s.key] ?? null} onChange={(v) => setW((x) => ({ ...x, buffers: Object.fromEntries(Object.entries({ ...x.buffers, [s.key]: v == null ? v : Math.max(0, Math.round(v)) }).filter(([, y]) => y != null)) as Record<string, number> }))} width="w-16" />
              </td>
            </tr>
          ))}
        </Table>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {(['availability', 'performance', 'quality'] as const).map((k) => (
            <Field key={k} label={`${k[0].toUpperCase()}${k.slice(1)} (0–1)`}>
              <NumInput label={`What-if ${k}`} min={0} max={1} value={w[k] ?? null} onChange={(v) => setW((x) => ({ ...x, [k]: v ?? undefined }))} width="w-full" />
            </Field>
          ))}
        </div>
        {swapRoles.length > 0 && !customer && (
          <div className="mt-4">
            <h3 className="mb-2 text-body font-semibold">Component / supplier swap</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {swapRoles.map((s) => {
                const cur = eng.byId.get(s.part_id) as (Part & AnyRecord) | undefined;
                const alts = eng.parts.filter((p) => p.product_type === cur?.product_type);
                const chosen = w.swaps?.find((x) => x.station_key === s.station_key && x.role === s.role)?.part_id ?? s.part_id;
                return (
                  <Field key={`${s.station_key}|${s.role}`} label={`${s.role} (${s.station_key === '_machine' ? 'machine' : sim.stations.find((x) => x.key === s.station_key)?.name})`}>
                    <SmallSelect
                      label={`Swap ${s.role}`}
                      value={chosen}
                      className="w-full"
                      options={alts.map((p) => ({ value: p.id, label: `${p.model_number} — ${p.name}` }))}
                      onChange={(v) => setW((x) => ({ ...x, swaps: [...(x.swaps ?? []).filter((y) => !(y.station_key === s.station_key && y.role === s.role)), ...(v !== s.part_id ? [{ station_key: s.station_key, role: s.role, part_id: v }] : [])] }))}
                    />
                  </Field>
                );
              })}
            </div>
          </div>
        )}
      </Card>
      <Card title="Result" description="Recalculated with the capacity, cost and energy engines">
        <Table head={['Metric', 'Scenario', 'What-if', 'Change']} dense>
          {rows
            .filter(([, , , internal]) => !(customer && internal))
            .map(([label, f, v]) => {
              const a = v(base);
              const b = v(next);
              return (
                <tr key={label}>
                  <td className="font-medium">{label}</td>
                  <td className="num">{f(base)}</td>
                  <td className="num font-semibold">{f(next)}</td>
                  <td className="num">{a != null && b != null && a !== b ? `${b > a ? '+' : ''}${num(b - a, 3)}${a ? ` (${b > a ? '+' : ''}${num(((b - a) / a) * 100, 3)} %)` : ''}` : '—'}</td>
                </tr>
              );
            })}
        </Table>
        {next.blocking.length > 0 && <p className="mt-2 text-meta text-warn">Still missing: {next.blocking.join('; ')}</p>}
        {!customer && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={empty} onClick={() => (set(() => applied), setW({}))}>
              Apply to this scenario
            </Button>
            <Button variant="primary" disabled={empty} onClick={() => saveAsNew(applied, `What-if: ${describe(w, sim)}`, String.fromCharCode(((sim.scenario_label ?? 'A').charCodeAt(0) || 64) + 1))}>
              Save as a new scenario
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function describe(w: WhatIf, sim: TabProps['sim']): string {
  const p: string[] = [];
  for (const [k, v] of Object.entries(w.laser ?? {})) if (v != null) p.push(`${k.replace(/_/g, ' ')} ${v}`);
  for (const [k, v] of Object.entries(w.stationTimes ?? {})) p.push(`${sim.stations.find((s) => s.key === k)?.name} time ${v} s`);
  for (const [k, v] of Object.entries(w.parallel ?? {})) p.push(`${sim.stations.find((s) => s.key === k)?.name} ×${v}`);
  for (const [k, v] of Object.entries(w.buffers ?? {})) p.push(`${sim.stations.find((s) => s.key === k)?.name} buffer ${v}`);
  for (const k of ['availability', 'performance', 'quality'] as const) if (w[k] != null) p.push(`${k} ${w[k]}`);
  if (w.swaps?.length) p.push(`${w.swaps.length} component swap(s)`);
  return p.join(', ') || 'no change';
}
