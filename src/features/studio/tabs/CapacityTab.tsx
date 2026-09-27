import clsx from 'clsx';
import { Clock, Factory, GitBranch } from 'lucide-react';
import { Card, EmptyState, Field, KV, Notice } from '../../../components/ui';
import type { TabProps } from '../ScenarioPage';
import { LineageTree, num, pct } from '../shared';
import { NumInput } from './edit';

export default function CapacityTab({ sim, set, d }: TabProps) {
  const c = d.cycle;
  const cap = d.cap;
  const shift = sim.shift ?? { hours_per_shift: 8, shifts_per_day: 2, days_per_year: 300 };
  const setShift = (p: Partial<typeof shift>) => set((s) => ({ ...s, shift: { ...shift, ...p } }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Shift pattern" icon={Clock}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hours per shift">
              <NumInput label="Hours per shift" min={0.5} max={24} value={sim.shift?.hours_per_shift ?? null} onChange={(v) => v != null && setShift({ hours_per_shift: v })} width="w-full" />
            </Field>
            <Field label="Shifts per day">
              <NumInput label="Shifts per day" min={1} max={4} value={sim.shift?.shifts_per_day ?? null} onChange={(v) => v != null && setShift({ shifts_per_day: Math.round(v) })} width="w-full" />
            </Field>
            <Field label="Operating days / year">
              <NumInput label="Operating days" min={1} max={366} value={sim.shift?.days_per_year ?? null} onChange={(v) => v != null && setShift({ days_per_year: Math.round(v) })} width="w-full" />
            </Field>
            <Field label="Planned downtime (min / shift)">
              <NumInput label="Planned downtime" min={0} value={sim.shift?.planned_downtime_min_per_shift ?? null} onChange={(v) => setShift({ planned_downtime_min_per_shift: v ?? undefined })} width="w-full" />
            </Field>
          </div>
        </Card>
        <Card title="OEE factors (assumptions)" description="Empty = derived (availability from MTBF/MTTR, quality from reject rates) or 100 %">
          <div className="grid grid-cols-3 gap-3">
            {(['availability', 'performance', 'quality'] as const).map((k) => (
              <Field key={k} label={`${k[0].toUpperCase()}${k.slice(1)} (0–1)`}>
                <NumInput label={k} min={0} max={1} value={sim.oee?.[k] ?? null} onChange={(v) => set((s) => ({ ...s, oee: { ...s.oee, [k]: v } }))} width="w-full" />
              </Field>
            ))}
          </div>
        </Card>
        <Card title="Maintenance" description="Feeds availability and the maintenance model">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['pm_interval_h', 'PM interval (h)'],
                ['pm_duration_min', 'PM duration (min)'],
                ['calibration_interval_h', 'Calibration interval (h)'],
                ['calibration_duration_min', 'Calibration (min)'],
              ] as const
            ).map(([k, l]) => (
              <Field key={k} label={l}>
                <NumInput label={l} min={0} value={sim.maintenance?.[k] ?? null} onChange={(v) => set((s) => ({ ...s, maintenance: { ...s.maintenance, [k]: v } }))} width="w-full" />
              </Field>
            ))}
          </div>
        </Card>
      </div>
      {!c ? (
        <EmptyState title="Cycle time cannot be calculated yet" explain={`Missing: ${d.res.blocking.join('; ')}.`} />
      ) : (
        <>
          <Card title="Cycle time engine" icon={Clock} description={c.layout === 'inline' ? 'Inline line: the slowest effective station sets the cycle; each station’s time is divided by its parallel servers.' : 'Sequential machine: one part at a time, cycle = Σ station times.'}>
            <div className="space-y-1.5" role="list" aria-label="Station load against the cycle">
              {c.loads.map((l) => (
                <div key={l.rs.station.key} role="listitem" className="grid grid-cols-[minmax(8rem,14rem)_1fr_auto] items-center gap-3 text-meta">
                  <span className={clsx('truncate', l === c.bottleneck && 'font-semibold text-bad')}>{l.rs.station.name}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-ink/10">
                    <div className={clsx('h-full rounded-full', l === c.bottleneck ? 'bg-bad' : 'bg-accent')} style={{ width: `${Math.min(100, l.utilization * 100)}%` }} />
                  </div>
                  <span className="num w-40 text-right">
                    {num(c.layout === 'inline' ? l.effective : l.mean)} s · {pct(l.utilization)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <KV
                items={[
                  ['Cycle time', `${num(c.cycle)} s`],
                  ['Throughput time (one part through all stations)', `${num(c.throughputTime)} s`],
                  ['Theoretical UPH', num(c.theoreticalUph, 4)],
                  ['Availability', `${pct(c.availability.value)} — ${c.availability.basis}`],
                  ['Performance', `${pct(c.performance.value)} — ${c.performance.basis}`],
                  ['Quality', `${pct(c.quality.value)} — ${c.quality.basis}`],
                  ['OEE', pct(c.oee)],
                  ['Practical UPH', num(c.practicalUph, 4)],
                ]}
              />
            </div>
          </Card>
          {cap && (
            <Card title="Capacity engine" icon={Factory}>
              <KV
                items={[
                  ['Scheduled hours / year', num(cap.scheduledHoursPerYear, 5)],
                  ['Productive hours / year', num(cap.productiveHoursPerYear, 5)],
                  ['Theoretical capacity / hour', num(cap.theoreticalPerHour, 4)],
                  ['Practical capacity / hour', num(cap.practicalPerHour, 4)],
                  ['Annual capacity', cap.annualCapacity != null ? `${num(cap.annualCapacity, 6)} parts` : 'Not Available'],
                  ['Target', cap.targetUph != null ? `${num(cap.targetUph, 4)} UPH${cap.targetAnnual != null ? ` · ${num(cap.targetAnnual, 6)} / year` : ''}` : 'Not set'],
                  ['Capacity gap', cap.capacityGapUph != null ? `${cap.capacityGapUph >= 0 ? '+' : ''}${num(cap.capacityGapUph, 4)} UPH` : 'Not Available'],
                  ['Machines (stations) required for the target', cap.machinesRequired != null ? String(cap.machinesRequired) : 'Not Available'],
                ]}
              />
              {cap.notes.map((n) => (
                <p key={n} className="mt-1 text-micro text-ink-3">
                  {n}
                </p>
              ))}
            </Card>
          )}
          <Card title="Data lineage" icon={GitBranch} description="Open any number to see what it is made of — down to the inputs and their basis (§141)">
            <ul className="text-meta">
              <LineageTree node={cap?.lineage ?? c.lineage} open />
            </ul>
          </Card>
          <Notice tone="info">Static capacity assumes steady flow. Queues, blocking and variability are measured under Material flow and Monte Carlo.</Notice>
        </>
      )}
    </div>
  );
}
