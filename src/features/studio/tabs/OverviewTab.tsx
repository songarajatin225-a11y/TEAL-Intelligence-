import { Gauge, Info, Settings2, Target } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../../components/RecordLink';
import { Badge, Button, Card, Drawer, Field, Stat } from '../../../components/ui';
import { COMM_PROTOCOLS } from '../../../domain/engineering';
import type { Lineage } from '../../../services/sim/model';
import { energyModel } from '../../../services/sim/analysis';
import type { TabProps } from '../ScenarioPage';
import { big, LineageTree, moneyShort, num, pct } from '../shared';
import { NumInput, SmallSelect, TextInput } from './edit';

export default function OverviewTab({ eng, sim, set, d, customer }: TabProps) {
  const [why, setWhy] = useState<Lineage | null>(null);
  const c = d.cycle;
  const cap = d.cap;
  const energy = c ? energyModel(d.res, c, eng.defs, cap?.annualCapacity) : null;
  const refOpts = (entity: string) => [{ value: '', label: 'None' }, ...eng.records.filter((r) => r.entity === entity).map((r) => ({ value: r.id, label: r.name }))];
  const WhyStat = ({ label, value, sub, node, tone }: { label: string; value: string; sub?: string; node?: Lineage | null; tone?: 'ok' | 'bad' | 'warn' }) => (
    <div className="relative">
      <Stat label={label} value={value} sub={sub} tone={tone} />
      {node && (
        <button type="button" onClick={() => setWhy(node)} className="absolute right-2 bottom-2 inline-flex min-h-6 items-center gap-1 rounded-md px-1.5 text-micro text-accent-2 hover:bg-accent-soft" aria-label={`How ${label} is derived`}>
          <Info className="size-3.5" aria-hidden /> How?
        </button>
      )}
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <WhyStat label="Cycle time" value={c ? `${num(c.cycle)} s` : 'Not Available'} sub={c ? (c.layout === 'inline' ? `bottleneck ${c.bottleneck.rs.station.name}` : 'sequential machine') : 'inputs missing'} node={c?.lineage.children?.[0]?.children?.[0]} />
        <WhyStat label="Theoretical UPH" value={c ? num(c.theoreticalUph, 4) : 'Not Available'} sub="3600 ÷ cycle" node={c?.lineage.children?.[0]} />
        <WhyStat label="Practical UPH" value={c ? num(c.practicalUph, 4) : 'Not Available'} sub={c ? `OEE ${pct(c.oee)}` : undefined} node={c?.lineage} tone={c && sim.targets?.uph ? (c.practicalUph >= sim.targets.uph ? 'ok' : 'bad') : undefined} />
        <WhyStat label="Target" value={sim.targets?.uph != null ? `${sim.targets.uph} UPH` : 'Not set'} sub={cap?.capacityGapUph != null ? `${cap.capacityGapUph >= 0 ? '+' : ''}${num(cap.capacityGapUph, 3)} UPH gap` : undefined} tone={cap?.capacityGapUph != null ? (cap.capacityGapUph >= 0 ? 'ok' : 'bad') : undefined} />
        <WhyStat label="Annual capacity" value={cap?.annualCapacity != null ? big(cap.annualCapacity) : 'Not Available'} sub={cap?.machinesRequired != null ? `${cap.machinesRequired} machine(s) for target` : 'parts / year'} node={cap?.lineage} />
        {!customer ? <WhyStat label="Equipment cost" value={moneyShort(d.bom.total, d.bom.currency)} sub={d.bom.notes[0] ? 'see notes' : 'included elements'} /> : <WhyStat label="Energy per part" value={energy ? `${num(energy.kwhPerPart)} kWh` : 'Not Available'} sub="estimate" />}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Scenario" icon={Settings2} description="Links and targets that the simulation, review and report read">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name">
              <TextInput label="Scenario name" value={sim.name} onChange={(v) => v.trim() && set((s) => ({ ...s, name: v.trim() }))} className="w-full" />
            </Field>
            <Field label="Scenario label">
              <TextInput label="Scenario label" value={sim.scenario_label} onChange={(v) => set((s) => ({ ...s, scenario_label: v || undefined }))} className="w-full" />
            </Field>
            <Field label="Status">
              <SmallSelect label="Status" value={sim.sim_status} options={['Draft', 'In Review', 'Baselined', 'Archived'] as const} onChange={(v) => set((s) => ({ ...s, sim_status: v }))} className="w-full" />
            </Field>
            <Field label="Layout">
              <SmallSelect label="Layout" value={sim.layout ?? 'inline'} options={[{ value: 'inline', label: 'Inline — stations work concurrently' }, { value: 'sequential', label: 'Sequential — one part at a time' }] as const} onChange={(v) => set((s) => ({ ...s, layout: v }))} className="w-full" />
            </Field>
            {(['customer_id', 'application_id', 'material_id', 'product_id', 'opportunity_id', 'project_id', 'recipe_id'] as const).map((k) => (
              <Field key={k} label={k.replace('_id', '').replace(/^./, (x) => x.toUpperCase())}>
                <SmallSelect label={k} value={sim[k] ?? ''} options={refOpts(k.replace('_id', '')).map((o) => ({ value: o.value, label: o.label }))} onChange={(v) => set((s) => ({ ...s, [k]: v || undefined }))} className="w-full" />
              </Field>
            ))}
          </div>
        </Card>
        <Card title="Targets and constraints" icon={Target} description="Empty = not stated. Nothing is assumed.">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target UPH">
              <NumInput label="Target UPH" min={0} value={sim.targets?.uph} onChange={(v) => set((s) => ({ ...s, targets: { ...s.targets, uph: v } }))} width="w-full" />
            </Field>
            <Field label="Annual units">
              <NumInput label="Annual units" min={0} value={sim.targets?.annual_units} onChange={(v) => set((s) => ({ ...s, targets: { ...s.targets, annual_units: v } }))} width="w-full" />
            </Field>
            <Field label="Target cycle (s)">
              <NumInput label="Target cycle" min={0} value={sim.targets?.cycle_s} onChange={(v) => set((s) => ({ ...s, targets: { ...s.targets, cycle_s: v } }))} width="w-full" />
            </Field>
            {!customer && (
              <Field label={`CAPEX budget (${sim.currency ?? 'INR'})`}>
                <NumInput label="CAPEX budget" min={0} value={sim.targets?.capex_budget} onChange={(v) => set((s) => ({ ...s, targets: { ...s.targets, capex_budget: v } }))} width="w-full" />
              </Field>
            )}
            <Field label="Footprint limit (m²)">
              <NumInput label="Footprint limit" min={0} value={sim.targets?.footprint_m2} onChange={(v) => set((s) => ({ ...s, targets: { ...s.targets, footprint_m2: v } }))} width="w-full" />
            </Field>
            <Field label="Localization target (%)">
              <NumInput label="Localization target" min={0} max={100} value={sim.targets?.localization_pct} onChange={(v) => set((s) => ({ ...s, targets: { ...s.targets, localization_pct: v } }))} width="w-full" />
            </Field>
          </div>
          <div className="mt-3">
            <div className="mb-1 text-meta font-medium text-ink-2">Required communication (§44 — the controller must support it)</div>
            <div className="flex flex-wrap gap-1.5">
              {COMM_PROTOCOLS.filter((p) => ['EtherCAT', 'PROFINET', 'EtherNet/IP', 'Modbus TCP', 'OPC UA', 'SECS/GEM'].includes(p)).map((p) => {
                const on = (sim.required_protocols ?? []).includes(p);
                return (
                  <Button key={p} size="sm" variant={on ? 'primary' : 'secondary'} aria-pressed={on} onClick={() => set((s) => ({ ...s, required_protocols: on ? (s.required_protocols ?? []).filter((x) => x !== p) : [...(s.required_protocols ?? []), p] }))}>
                    {p}
                  </Button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
      <Card title="Requirements this equipment answers" icon={Gauge}>
        {(sim.requirement_ids ?? []).length ? (
          <ul className="space-y-1">
            {(sim.requirement_ids ?? []).map((id) => {
              const r = eng.byId.get(id);
              return (
                <li key={id} className="flex flex-wrap items-center gap-2">
                  <Link to={recordPath(id)} className="text-accent-2 hover:underline">
                    {String(r?.code ?? id)} — {r?.name ?? 'missing record'}
                  </Link>
                  {r && <Badge>{String(r.value ? `${r.value} ${r.unit ?? ''}` : 'value not stated')}</Badge>}
                  <Button size="sm" onClick={() => set((s) => ({ ...s, requirement_ids: (s.requirement_ids ?? []).filter((x) => x !== id) }))}>
                    Unlink
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-meta text-ink-3">No requirement is traced to this equipment.</p>
        )}
        <div className="mt-2 max-w-md">
          <SmallSelect label="Link a requirement" value="" options={[{ value: '', label: 'Link a requirement…' }, ...eng.records.filter((r) => r.entity === 'requirement' && !(sim.requirement_ids ?? []).includes(r.id)).map((r) => ({ value: r.id, label: `${String(r.code ?? r.id)} — ${r.name}` }))]} onChange={(v) => v && set((s) => ({ ...s, requirement_ids: [...(s.requirement_ids ?? []), v] }))} className="w-full" />
        </div>
      </Card>
      <Drawer open={!!why} onClose={() => setWhy(null)} title={`How it is derived — ${why?.label ?? ''}`} subtitle="Engineering data lineage: each number opens into its inputs, basis and formula" wide>
        {why && (
          <ul className="text-body">
            <LineageTree node={why} open />
          </ul>
        )}
      </Drawer>
    </div>
  );
}
