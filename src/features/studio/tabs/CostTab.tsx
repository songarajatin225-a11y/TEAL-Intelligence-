import clsx from 'clsx';
import { Download, IndianRupee, Layers, MapPin, Truck } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../../components/RecordLink';
import { Badge, Button, Card, Field, Notice, Table } from '../../../components/ui';
import { applyWhatIf, scenarioMetrics } from '../../../services/sim/analysis';
import { localizationLayers } from '../../../services/sim/supply';
import { download, stamp, toCsv } from '../../../utils/export';
import type { TabProps } from '../ScenarioPage';
import { money, num, pct } from '../shared';
import { NumInput } from './edit';

export default function CostTab({ eng, sim, set, d }: TabProps) {
  const b = d.bom;
  const depth = { Equipment: 0, System: 1, Subsystem: 2, Component: 3 } as const;
  const layers = localizationLayers(d.deps, !!sim.recipe_id);
  // §146 localization scenarios: imported (as configured) · partially localized (swap to a compatible local alternative where one exists) · dual source
  const scen = useMemo(() => {
    const swaps = d.deps.filter((x) => x.origin === 'Imported').flatMap((x) => {
      const alt = x.alternatives.find((a) => a.origin === 'Local');
      return alt ? [{ station_key: x.sp.stationKey, role: x.sp.role, part_id: alt.part.id }] : [];
    });
    const A = scenarioMetrics(sim, eng.byId, eng.defs, eng.fx, { singleSource: d.deps.filter((x) => x.singleSource).length });
    const B = scenarioMetrics(applyWhatIf(sim, { swaps }), eng.byId, eng.defs, eng.fx);
    const dualLeft = d.deps.filter((x) => x.singleSource).length;
    return { A, B, swaps, dualCovered: d.deps.filter((x) => !x.singleSource).length, dualLeft };
  }, [sim, eng, d.deps]);
  const exportCsv = () =>
    download(
      `bom-${sim.id}-${stamp()}.csv`,
      toCsv(b.items.map((i) => ({ level: i.level, name: i.name, part: i.reference ?? '', quantity: i.quantity, unit_cost: i.unitCost ?? '', currency: i.currency ?? '', basis: i.basis ?? '', extended_in_scenario_currency: i.extended ?? '', supplier: i.supplier ?? '', origin: i.origin ?? '', lead_time_weeks: i.leadTimeWeeks ?? '' }))),
      'text/csv',
    );
  return (
    <div className="space-y-4">
      <Card
        title="Bill of materials"
        icon={Layers}
        description="Equipment → system (station) → subsystem (discipline) → component. Each line references the canonical component record."
        actions={
          <Button size="sm" onClick={exportCsv}>
            <Download className="size-3.5" aria-hidden /> Export CSV
          </Button>
        }
      >
        <Table head={['Item', 'Part number', 'Qty', 'Unit cost', 'Basis', `Extended (${b.currency})`, 'Supplier', 'Origin', 'Lead (wk)']} dense>
          {b.items.map((i) => (
            <tr key={i.id} className={clsx(i.level !== 'Component' && 'bg-panel-2/60')}>
              <td style={{ paddingLeft: `${0.6 + depth[i.level] * 1.1}rem` }} className={clsx(i.level !== 'Component' && 'font-semibold')}>
                {i.name}
                <span className="ml-1.5 text-micro font-normal text-ink-3">{i.level}</span>
              </td>
              <td>{i.partId ? <Link to={recordPath(i.partId)} className="text-accent-2 hover:underline">{i.reference}</Link> : '—'}</td>
              <td className="num">{i.level === 'Component' ? i.quantity : ''}</td>
              <td className="num">{i.level === 'Component' ? (i.unitCost != null ? `${i.currency} ${i.unitCost.toLocaleString('en-IN')}` : <Badge tone="warn">No price</Badge>) : ''}</td>
              <td>{i.basis && <Badge tone={i.basis === 'DEMO' ? 'demo' : i.basis === 'QUOTED' ? 'ok' : 'neutral'}>{i.basis}</Badge>}</td>
              <td className="num">{i.level === 'Component' ? money(i.extended, b.currency) : ''}</td>
              <td className="text-micro">{i.supplier ?? ''}</td>
              <td>{i.origin && <Badge tone={i.origin === 'Imported' ? 'warn' : i.origin === 'Local' ? 'ok' : 'neutral'}>{i.origin}</Badge>}</td>
              <td className="num">{i.leadTimeWeeks ?? ''}</td>
            </tr>
          ))}
        </Table>
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Equipment cost" icon={IndianRupee} description="Elements you have not entered are listed as not included — nothing is guessed">
          <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {(
              [
                ['integration_pct', 'Integration (%)'],
                ['testing_pct', 'Testing / FAT (%)'],
                ['shipping_pct', 'Shipping on imports (%)'],
                ['duty_pct', 'Duty on imports (%)'],
                ['installation', `Installation (${b.currency})`],
              ] as const
            ).map(([k, l]) => (
              <Field key={k} label={l}>
                <NumInput label={l} min={0} value={sim.cost?.[k] ?? null} onChange={(v) => set((s) => ({ ...s, cost: { ...s.cost, [k]: v } }))} width="w-full" />
              </Field>
            ))}
          </div>
          <Table head={['Element', 'Value', 'Basis']} dense>
            {b.elements.map((e) => (
              <tr key={e.key}>
                <td>{e.label}</td>
                <td className="num">{e.included ? money(e.value, b.currency) : <Badge>Not included</Badge>}</td>
                <td className="text-micro">{e.basis}</td>
              </tr>
            ))}
            <tr>
              <td className="font-semibold">Manufacturing cost</td>
              <td className="num font-semibold">{money(b.manufacturing, b.currency)}</td>
              <td className="text-micro">fabrication + integration + testing</td>
            </tr>
            <tr>
              <td className="font-semibold">Total equipment cost</td>
              <td className="num text-lead font-semibold">{money(b.total, b.currency)}</td>
              <td className="text-micro">included elements only</td>
            </tr>
          </Table>
          <div className="mt-3 flex flex-wrap gap-2 text-meta">
            {Object.entries(b.byCurrency).map(([cur, v]) => (
              <Badge key={cur}>
                Bought-out in {cur}: {v.toLocaleString('en-IN')}
              </Badge>
            ))}
            {b.fxUsed.map((f) => (
              <Badge key={f.code} tone="warn">
                FX {f.code} → INR {f.rate_to_inr} ({f.as_of ?? 'no date'}, {f.source})
              </Badge>
            ))}
          </div>
          {b.notes.map((n) => (
            <Notice key={n} tone="warn">
              {n}
            </Notice>
          ))}
        </Card>
        <Card title="Localization scenarios" icon={MapPin} description="Imported vs partially localized vs dual source (§146)">
          <Table head={['Metric', 'A — as configured', 'B — partially localized', 'C — dual source']} dense>
            <tr>
              <td>Local cost share</td>
              <td className="num">{pct(scen.A.localization)}</td>
              <td className="num">{pct(scen.B.localization)}</td>
              <td className="num">{pct(scen.A.localization)}</td>
            </tr>
            <tr>
              <td>Equipment cost</td>
              <td className="num">{money(scen.A.capex, scen.A.currency)}</td>
              <td className="num">{money(scen.B.capex, scen.B.currency)}</td>
              <td className="num">{money(scen.A.capex, scen.A.currency)} + qualification</td>
            </tr>
            <tr>
              <td>Longest lead time</td>
              <td className="num">{scen.A.maxLeadTimeWeeks ?? '—'} wk</td>
              <td className="num">{scen.B.maxLeadTimeWeeks ?? '—'} wk</td>
              <td className="num">{scen.A.maxLeadTimeWeeks ?? '—'} wk (fallback exists)</td>
            </tr>
            <tr>
              <td>Single-source components</td>
              <td className="num">{scen.dualLeft}</td>
              <td className="num">—</td>
              <td className="num">{scen.dualLeft} (no alternative recorded)</td>
            </tr>
            <tr>
              <td>Changes</td>
              <td>—</td>
              <td className="text-micro">{scen.swaps.length ? `${scen.swaps.length} imported component(s) → local alternative` : 'No compatible local alternative recorded'}</td>
              <td className="text-micro">Second source qualified for {scen.dualCovered} component(s) with an alternative</td>
            </tr>
          </Table>
          <p className="mt-2 text-micro text-ink-3">Alternatives must be qualified before use; maturity of a local alternative is its record status. Cost for C excludes the unrecorded qualification cost.</p>
        </Card>
      </div>
      <Card title="Supplier dependency" icon={Truck}>
        <Table head={['Component', 'Role', 'Manufacturer', 'Country', 'Origin', 'Lead (wk)', 'Alternatives', 'Risk']} dense>
          {d.deps.map((x) => (
            <tr key={`${x.sp.stationKey}|${x.sp.role}`}>
              <td>
                <Link to={recordPath(x.sp.part.id)} className="text-accent-2 hover:underline">
                  {x.sp.part.model_number}
                </Link>
              </td>
              <td className="text-micro">{x.sp.role}</td>
              <td>{x.manufacturer}</td>
              <td>{x.country ?? 'Not recorded'}</td>
              <td>
                <Badge tone={x.origin === 'Imported' ? 'warn' : x.origin === 'Local' ? 'ok' : 'neutral'}>{x.origin}</Badge>
              </td>
              <td className="num">{x.leadTimeWeeks ?? '—'}</td>
              <td className="text-micro">{x.alternatives.length ? x.alternatives.map((a) => `${a.part.model_number} (${a.origin})`).join(', ') : <Badge tone="bad">Single source</Badge>}</td>
              <td className="text-micro">{x.risk.join('; ') || '—'}</td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card title="Localization map" icon={MapPin} description="Laser source → beam delivery → galvo → optics → motion → controls → vision → machine → software → application (§96)">
        <Table head={['Layer', 'Status', 'Supplier(s)', 'Capability / engineering gap', 'Risk']} dense>
          {layers.map((l) => (
            <tr key={l.layer}>
              <td className="font-medium">{l.layer}</td>
              <td>
                <Badge tone={l.status === 'Localized' ? 'ok' : l.status === 'Imported' ? 'warn' : l.status === 'Partially localized' ? 'info' : 'neutral'}>{l.status}</Badge>
              </td>
              <td className="text-micro">{l.suppliers.join('; ') || '—'}</td>
              <td className="text-micro">{l.gap}</td>
              <td className="text-micro">{l.risk.join('; ') || '—'}</td>
            </tr>
          ))}
        </Table>
        <p className="mt-2 text-micro text-ink-3">Target localization: {sim.targets?.localization_pct != null ? `${sim.targets.localization_pct} %` : 'not set'} · current local cost share {pct(b.localShare)} (fabrication counts as local).</p>
      </Card>
      <p className="text-micro text-ink-3">{num(b.items.filter((i) => i.level === 'Component').length)} BOM lines.</p>
    </div>
  );
}
