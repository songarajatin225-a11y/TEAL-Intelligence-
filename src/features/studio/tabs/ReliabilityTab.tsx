import { Play, Plus, Trash2, Wrench, Zap } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, EmptyState, Field, IconButton, Table } from '../../../components/ui';
import { energyModel, FAULT_LIBRARY, faultImpact, maintenanceModel } from '../../../services/sim/analysis';
import type { TabProps } from '../ScenarioPage';
import { money, num, pct } from '../shared';
import { NumInput, SmallSelect, TextInput } from './edit';

export default function ReliabilityTab({ eng, sim, set, d, customer }: TabProps) {
  const [lib, setLib] = useState(FAULT_LIBRARY[0].key);
  const [hours, setHours] = useState<number | null>(8);
  const [impact, setImpact] = useState<ReturnType<typeof faultImpact> | null>(null);
  const c = d.cycle;
  if (!c) return <EmptyState icon={Zap} title="Needs a runnable scenario" explain={`Missing: ${d.res.blocking.join('; ')}.`} />;
  const faults = sim.faults ?? [];
  const addFault = () => {
    const f = FAULT_LIBRARY.find((x) => x.key === lib)!;
    const st = f.whole ? '*' : (sim.stations.find((s) => f.kinds.includes(s.kind))?.key ?? sim.stations[0].key);
    set((s) => ({ ...s, faults: [...(s.faults ?? []), { key: `${f.key}-${(s.faults ?? []).length + 1}`, name: f.name, station_key: st, at_min: 60, duration_min: f.minutes }] }));
  };
  const m = maintenanceModel(d.res, c);
  const e = energyModel(d.res, c, eng.defs, d.cap?.annualCapacity);
  return (
    <div className="space-y-4">
      <Card title="Fault simulation" icon={Zap} description="Inject faults and measure the production impact with the same random seed">
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <Field label="Fault">
            <SmallSelect label="Fault type" value={lib} options={FAULT_LIBRARY.map((f) => ({ value: f.key, label: f.name }))} onChange={setLib} />
          </Field>
          <Button size="sm" onClick={addFault}>
            <Plus className="size-3.5" aria-hidden /> Add fault
          </Button>
          <Field label="Run length (h)">
            <NumInput label="Fault run hours" min={0.5} max={168} value={hours} onChange={setHours} />
          </Field>
          <Button size="sm" variant="primary" disabled={!faults.length} onClick={() => setImpact(faultImpact(d.res, faults, (hours ?? 8) * 3600))}>
            <Play className="size-3.5" aria-hidden /> Measure impact
          </Button>
        </div>
        {faults.length ? (
          <Table head={['Fault', 'Station', 'Starts at (min)', 'Duration (min)', '']} dense>
            {faults.map((f, i) => (
              <tr key={f.key}>
                <td>
                  <TextInput label={`Fault ${i + 1} name`} value={f.name} onChange={(v) => set((s) => ({ ...s, faults: (s.faults ?? []).map((x, j) => (j === i ? { ...x, name: v || x.name } : x)) }))} className="w-44" />
                </td>
                <td>
                  <SmallSelect label={`Fault ${i + 1} station`} value={f.station_key} options={[{ value: '*', label: 'Whole machine' }, ...sim.stations.map((s) => ({ value: s.key, label: s.name }))]} onChange={(v) => set((s) => ({ ...s, faults: (s.faults ?? []).map((x, j) => (j === i ? { ...x, station_key: v } : x)) }))} />
                </td>
                <td>
                  <NumInput label={`Fault ${i + 1} start`} min={0} value={f.at_min} onChange={(v) => v != null && set((s) => ({ ...s, faults: (s.faults ?? []).map((x, j) => (j === i ? { ...x, at_min: v } : x)) }))} />
                </td>
                <td>
                  <NumInput label={`Fault ${i + 1} duration`} min={0.1} value={f.duration_min} onChange={(v) => v != null && set((s) => ({ ...s, faults: (s.faults ?? []).map((x, j) => (j === i ? { ...x, duration_min: v } : x)) }))} />
                </td>
                <td>
                  <IconButton size="sm" label={`Remove ${f.name}`} icon={Trash2} onClick={() => set((s) => ({ ...s, faults: (s.faults ?? []).filter((_, j) => j !== i) }))} />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-meta text-ink-3">No faults defined. Default durations from the library are ASSUMPTIONS — replace them with field data.</p>
        )}
        {impact && (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Good parts — no faults', String(impact.baseline.ok)],
              ['Good parts — with faults', String(impact.withFaults.ok)],
              ['Lost production', `${impact.lostParts} parts`],
              ['Fault minutes', num(impact.lostMinutes)],
            ].map(([l, v]) => (
              <div key={l} className="surface rounded-card px-4 py-3">
                <div className="text-meta text-ink-3">{l}</div>
                <div className="num text-metric font-semibold">{v}</div>
              </div>
            ))}
            <ul className="col-span-full list-disc pl-5 text-micro text-ink-3">
              {impact.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      <Card title="Maintenance" icon={Wrench} description="Approximate availability, downtime impact and maintenance burden">
        <Table head={['Station', 'MTBF (min)', 'MTTR (min)', 'Availability', 'Failures / year', 'Repair h / year']} dense>
          {m.rows.map((r) => (
            <tr key={r.station}>
              <td>{r.station}</td>
              <td className="num">{r.mtbf_min ?? 'Not entered'}</td>
              <td className="num">{r.mttr_min ?? 'Not entered'}</td>
              <td className="num">{pct(r.availability)}</td>
              <td className="num">{num(r.failuresPerYear)}</td>
              <td className="num">{num(r.repairHoursPerYear)}</td>
            </tr>
          ))}
        </Table>
        <div className="mt-3 flex flex-wrap gap-2 text-meta">
          <Badge>PM events / year: {num(m.pmPerYear)}</Badge>
          <Badge>PM hours / year: {num(m.pmHours)}</Badge>
          <Badge>Calibration hours / year: {num(m.calHours)}</Badge>
          <Badge tone="warn">Maintenance burden: {num(m.burdenHours)} h / year</Badge>
          <Badge>Output lost to downtime: {num(m.downtimeImpactUnits)} parts / year</Badge>
          <Badge>Line availability: {pct(m.availability.value)}</Badge>
        </div>
        {m.notes.map((n) => (
          <p key={n} className="mt-1 text-micro text-ink-3">
            {n}
          </p>
        ))}
      </Card>
      <Card title="Energy model (estimate)" icon={Zap}>
        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label={`Tariff (${sim.currency ?? 'INR'} / kWh)`}>
            <NumInput label="Tariff" min={0} value={sim.energy?.tariff_per_kwh ?? null} onChange={(v) => set((s) => ({ ...s, energy: { ...s.energy, tariff_per_kwh: v } }))} width="w-full" />
          </Field>
          <Field label="Idle power fraction (0–1)">
            <NumInput label="Idle fraction" min={0} max={1} value={sim.energy?.idle_fraction ?? null} onChange={(v) => set((s) => ({ ...s, energy: { ...s.energy, idle_fraction: v } }))} width="w-full" />
          </Field>
          <Field label="Compressed air (kW equivalent)">
            <NumInput label="Compressed air" min={0} value={sim.energy?.compressed_air_kw ?? null} onChange={(v) => set((s) => ({ ...s, energy: { ...s.energy, compressed_air_kw: v } }))} width="w-full" />
          </Field>
        </div>
        <Table head={['Consumer', 'kW', 'Mode', 'kWh per cycle', 'Basis']} dense>
          {e.rows.map((r) => (
            <tr key={r.consumer}>
              <td>{customer ? r.consumer.replace(/ — .*$/, '') : r.consumer}</td>
              <td className="num">{num(r.kw)}</td>
              <td className="text-micro">{r.mode}</td>
              <td className="num">{num(r.kwh, 4)}</td>
              <td className="text-micro">{r.basis}</td>
            </tr>
          ))}
        </Table>
        <div className="mt-3 flex flex-wrap gap-2 text-meta">
          <Badge tone="accent">{num(e.kwhPerCycle, 4)} kWh / cycle</Badge>
          <Badge tone="accent">{num(e.kwhPerPart, 4)} kWh / good part</Badge>
          <Badge>{e.annualKwh != null ? `${num(e.annualKwh, 5)} kWh / year` : 'Annual: needs a shift pattern'}</Badge>
          {!customer && <Badge>{e.annualCost != null ? `${money(e.annualCost, sim.currency)} / year` : 'Annual cost: enter a tariff'}</Badge>}
        </div>
        {e.missing.length > 0 && <p className="mt-2 text-micro text-warn">Not included (no power data): {e.missing.join('; ')}</p>}
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-micro text-ink-3">
          {e.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
