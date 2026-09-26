import { AlertTriangle, ArrowUpRight, Boxes, Cpu, Gauge, IndianRupee, MapPin, Plus, Sparkles, Workflow } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EntityForm } from '../../components/EntityForm';
import { recordPath } from '../../components/RecordLink';
import { TrustBadge } from '../../components/TrustBadge';
import { Badge, Button, buttonClass, Card, Chain, Drawer, EmptyState, Field, Input, Loading, Notice, PageHeader, Select, Table } from '../../components/ui';
import { useData, useEngine } from '../../hooks/useData';
import { AUTOMATION_LEVELS, AUTOMATION_RULE, solutionOptions, solve, type AutomationLevel, type SolutionInput } from '../../services/solution';

const P = ['domain', 'industry', 'part', 'material', 'process', 'app', 'source', 'product', 'auto', 'uph', 'acc'] as const;
type Key = (typeof P)[number];
const money = (v: number | null | undefined) => (v == null ? 'UNKNOWN' : `₹ ${Math.round(v).toLocaleString('en-IN')}`);

/**
 * APPLICATION ENGINE (final master prompt §14 + §23): Industry → Product → Material → Process →
 * Application → Technology → Machine → Subsystem, then technology, requirements, architecture,
 * suppliers, indicative BOM, cost drivers, risks, localization and complexity — all from records and
 * the existing engines, each with its basis.
 */
export default function SolutionPage() {
  const { records, byId, status } = useData();
  const e = useEngine();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const v = (k: Key) => params.get(k) ?? '';
  const set = (k: Key, val: string) =>
    setParams(
      (p) => {
        if (val) p.set(k, val);
        else p.delete(k);
        // changing an upstream choice clears the downstream ones
        for (const d of P.slice(P.indexOf(k) + 1, P.indexOf('product') + 1)) if (d !== 'part') p.delete(d);
        return p;
      },
      { replace: true },
    );

  const input: SolutionInput = {
    domainId: v('domain') ? `dom-${v('domain')}` : undefined,
    industryId: v('industry') || undefined,
    customerProduct: v('part') || undefined,
    materialId: v('material') || undefined,
    process: v('process') || undefined,
    applicationId: v('app') || undefined,
    sourceKey: v('source') || undefined,
    productKey: v('product') || undefined,
    automation: (v('auto') as AutomationLevel) || 'Manual',
    throughputUph: v('uph') ? Number(v('uph')) : null,
    accuracyUm: v('acc') ? Number(v('acc')) : null,
  };
  const opts = useMemo(() => solutionOptions(input, records), [records, params]); // eslint-disable-line react-hooks/exhaustive-deps
  const result = useMemo(() => solve(input, records, e), [records, e, params]); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') return <Loading />;
  const industry = byId.get(input.industryId ?? '');
  const material = byId.get(input.materialId ?? '');
  const source = result?.state?.sourceKey ? byId.get(`las-${result.state.sourceKey}`) : undefined;
  const path = [
    { label: industry?.name ?? 'Industry', sub: 'Industry', state: industry ? 'done' : 'todo' },
    { label: input.customerProduct ?? 'Product', sub: 'Customer product', state: input.customerProduct ? 'done' : 'todo' },
    { label: material?.name ?? 'Material', sub: 'Material', state: material ? 'done' : 'todo' },
    { label: input.process ?? 'Process', sub: 'Process', state: input.process ? 'done' : 'todo' },
    { label: result?.application?.name ?? 'Application', sub: 'Application', state: result?.application ? 'done' : 'todo' },
    { label: source?.name ?? 'Technology', sub: 'Technology', state: source ? 'done' : 'todo' },
    { label: result?.product?.name ?? 'Machine', sub: 'Machine', state: result?.product ? 'done' : 'todo' },
    { label: result ? `${result.subsystems.length} subsystems` : 'Subsystem', sub: 'Architecture', state: result ? 'current' : 'todo' },
  ] as const;

  const sel = (k: Key, label: string, options: { value: string; label: string }[], hint?: string) => (
    <Field label={label} htmlFor={`se-${k}`} hint={hint}>
      <Select id={`se-${k}`} value={v(k)} onChange={(ev) => set(k, ev.target.value)}>
        <option value="">{options.length ? 'Any' : 'None available'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </Field>
  );

  const summary = [
    industry && `Industry: ${industry.name}`,
    input.customerProduct && `Part: ${input.customerProduct}`,
    material && `Material: ${material.name}`,
    input.process && `Process: ${input.process}`,
    result?.application && `Application: ${result.application.name}`,
    input.throughputUph && `Throughput: ${input.throughputUph} parts/h`,
    input.accuracyUm && `Accuracy: ± ${input.accuracyUm} µm`,
    `Automation: ${input.automation}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Application Engine"
        subtitle="Choose industry, part, material and process. The engine proposes technology, machine, architecture, suppliers, an indicative BOM and cost, risks and localization — from TEAL’s own records and engines, each with its basis."
        actions={
          result?.product && (
            <>
              <Link to={`/configurator?product=${result.product.key}${result.state?.sourceKey ? `&source=${result.state.sourceKey}` : ''}`} className={buttonClass('secondary')}>
                <ArrowUpRight className="size-4" aria-hidden /> Open in configurator
              </Link>
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Plus className="size-4" aria-hidden /> Create opportunity
              </Button>
            </>
          )
        }
      />

      <Card title="Requirement" icon={Workflow} edge>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {sel('domain', 'Domain', opts.domains.map((d) => ({ value: d.id.replace(/^dom-/, ''), label: d.name })))}
          {sel('industry', 'Industry', opts.industries.map((i) => ({ value: i.id, label: i.name })))}
          {sel('part', 'Customer product / part', opts.customerProducts.map((x) => ({ value: x, label: x })))}
          {sel('material', 'Material', opts.materials.map((m) => ({ value: m.id, label: m.name })))}
          {sel('process', 'Process', opts.processes.map((x) => ({ value: x, label: x })))}
          {sel('app', 'Application', opts.applications.map((a) => ({ value: a.id, label: a.name })), `${opts.applications.length} TEAL application records match`)}
          {sel('source', 'Technology (laser)', opts.sources.map((s) => ({ value: s.id.replace(/^las-/, ''), label: s.name })))}
          {sel('product', 'Machine (TEAL platform)', opts.products.map((p) => ({ value: p.key, label: p.name })))}
          <Field label="Automation level" htmlFor="se-auto" hint={`Adds: ${AUTOMATION_RULE[input.automation ?? 'Manual'].map((f) => f[0]).join(', ') || 'nothing'}`}>
            <Select id="se-auto" value={input.automation} onChange={(ev) => setParams((p) => (p.set('auto', ev.target.value), p), { replace: true })}>
              {AUTOMATION_LEVELS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          </Field>
          <Field label="Throughput (parts / hour)" htmlFor="se-uph">
            <Input id="se-uph" inputMode="decimal" value={v('uph')} onChange={(ev) => setParams((p) => (ev.target.value ? p.set('uph', ev.target.value) : p.delete('uph'), p), { replace: true })} />
          </Field>
          <Field label="Accuracy (± µm)" htmlFor="se-acc">
            <Input id="se-acc" inputMode="decimal" value={v('acc')} onChange={(ev) => setParams((p) => (ev.target.value ? p.set('acc', ev.target.value) : p.delete('acc'), p), { replace: true })} />
          </Field>
        </div>
        <div className="mt-4">
          <Chain label="Selection path" steps={path.map((x) => ({ ...x }))} />
        </div>
      </Card>

      {!result ? (
        <EmptyState
          icon={Sparkles}
          title={opts.applications.length ? 'Pick an application or a machine' : 'No TEAL application matches yet'}
          explain={opts.applications.length ? 'Choose an application (or a TEAL platform) to see the architecture, BOM, cost, risks and localization.' : 'No TEAL application record matches this combination. That itself is a finding: it needs a POC before a machine can be proposed. Widen the selection or start from the inquiry workflow.'}
          actions={
            <Link to="/inquiry" className={buttonClass('secondary')}>
              Product from Inquiry
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card title="Recommended technology" icon={Sparkles}>
              {result.recommended ? (
                <>
                  <div className="text-lead font-semibold">
                    {result.recommended.source}
                    {result.recommended.power != null && `, ${result.recommended.power} W`}
                  </div>
                  <p className="mt-1 text-meta text-ink-2">{result.recommended.rationale}</p>
                  <p className="mt-2 text-micro text-ink-3">Basis: {result.recommended.basis}</p>
                </>
              ) : (
                <p className="text-meta text-ink-3">No application record — technology choice needs a POC.</p>
              )}
              <div className="mt-3 flex items-center gap-2 text-meta">
                Machine:{' '}
                <Link to={recordPath(result.product!.id)} className="font-medium text-accent-2 hover:underline">
                  {result.product!.name}
                </Link>
              </div>
            </Card>
            <Card title="Process requirements" icon={Gauge}>
              <dl className="space-y-1.5 text-meta">
                {result.requirements.map((r) => (
                  <div key={r.label} className="grid grid-cols-[7.5rem_1fr] gap-2">
                    <dt className="text-ink-3">{r.label}</dt>
                    <dd>
                      <span className={r.value.startsWith('UNKNOWN') ? 'text-warn' : ''}>{r.value}</span>
                      <span className="block text-micro text-ink-3">{r.basis}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card title="Development complexity" icon={Cpu} actions={<Badge tone={result.complexity.level === 'High' ? 'bad' : result.complexity.level === 'Medium' ? 'warn' : 'ok'}>{result.complexity.level}</Badge>}>
              <ul className="list-disc space-y-0.5 pl-5 text-meta text-ink-2">
                {result.complexity.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="mt-2 text-micro text-ink-3">Rule: High = no catalogued application or a failed compatibility check; Medium = modules added, warnings, or inline / fully automatic handling; Low otherwise.</p>
            </Card>
          </div>

          <Card title="Subsystem architecture & potential suppliers" icon={Boxes} description="Derived by the architecture builder; suppliers only where a record’s category or the component master names them">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {result.subsystems.map((s) => (
                <section key={s.lane} className="rounded-control border border-line p-3" aria-label={`${s.lane} subsystem`}>
                  <h3 className="text-meta font-semibold">{s.lane}</h3>
                  <ul className="mt-1 space-y-0.5 text-meta">
                    {s.nodes.map((n) => (
                      <li key={n.id}>
                        {n.label} <span className="text-micro text-ink-3">· {n.type}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 border-t border-line/60 pt-2 text-micro">
                    {s.suppliers.length ? (
                      <ul className="space-y-1">
                        {s.suppliers.map((sp) => (
                          <li key={sp.id} className="flex flex-wrap items-center gap-1.5">
                            <Link to={recordPath(sp.id)} className="text-accent-2 hover:underline">
                              {sp.name}
                            </Link>
                            <TrustBadge record={byId.get(sp.id)} />
                            <span className="text-ink-3">{sp.basis}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-ink-3">No supplier recorded — raise an RFQ.</span>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Card title="Indicative BOM" icon={Boxes} description="Configurator rules — list-price ESTIMATES and UNKNOWN costs, not quotations">
              <div className="scroll-thin overflow-x-auto">
                <Table head={['Line', 'Description', 'Make/Buy', 'Basis', 'Unit cost']} dense>
                  {result.bom.map((l) => (
                    <tr key={l.line_id} className="border-t border-line/60">
                      <td className="num">{l.line_id}</td>
                      <td>
                        {l.description}
                        {l.import_item && <Badge className="ml-1">import</Badge>}
                      </td>
                      <td>{l.make_buy}</td>
                      <td>
                        <Badge tone={l.cost_basis === 'UNKNOWN' ? 'neutral' : 'warn'}>{l.cost_basis}</Badge>
                      </td>
                      <td className="num">{money(l.unit_cost)}</td>
                    </tr>
                  ))}
                </Table>
              </div>
            </Card>
            <div className="space-y-4">
              <Card title="Cost" icon={IndianRupee}>
                <div className="text-meta text-ink-3">Indicative price band (configurator, ESTIMATE)</div>
                <div className="num text-section font-semibold">{result.priceBand?.band ? `${money(result.priceBand.band[0])} – ${money(result.priceBand.band[1])}` : 'UNKNOWN'}</div>
                <div className="mt-3 text-meta font-medium">Cost drivers (priced lines)</div>
                <ul className="mt-1 space-y-0.5 text-meta">
                  {result.costDrivers.map((d) => (
                    <li key={d.line.line_id} className="flex justify-between gap-2">
                      <span className="truncate">{d.line.description}</span>
                      <span className="num text-ink-3">{d.share != null ? `${Math.round(d.share * 100)} %` : '—'}</span>
                    </li>
                  ))}
                  {!result.costDrivers.length && <li className="text-ink-3">No priced lines beyond the platform estimate.</li>}
                </ul>
                {result.unknownCostLines > 0 && <p className="mt-2 text-micro text-warn">{result.unknownCostLines} line(s) have UNKNOWN cost.</p>}
              </Card>
              <Card title="Localization" icon={MapPin}>
                <p className="text-meta">{result.localization.statement}</p>
                {result.localization.records.map((l) => (
                  <Link key={l.id} to={recordPath(l.id)} className="block text-meta text-accent-2 hover:underline">
                    {l.name}
                  </Link>
                ))}
              </Card>
            </div>
          </div>

          <Card title="Risks" icon={AlertTriangle}>
            <ul className="list-disc space-y-0.5 pl-5 text-meta text-ink-2">
              {result.risks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Card>
          {result.addedModules.length > 0 && <Notice tone="info">Automation level “{input.automation}” added: {result.addedModules.join(', ')} — only modules that fit {result.product?.name} and do not conflict.</Notice>}
        </>
      )}

      <Drawer open={creating} onClose={() => setCreating(false)} title="New opportunity from this selection" subtitle="Saved as a local draft; the selection is recorded as the inquiry." wide>
        {creating && result?.product && (
          <EntityForm
            entity="opportunity"
            preset={{
              name: `${result.application?.name ?? result.product.name} — ${industry?.name ?? 'customer'}`,
              stage: 'Lead',
              product_id: result.product.id,
              application_id: result.application?.id,
              domain_id: input.domainId,
              industry: industry?.name,
              inquiry_text: summary,
            }}
            onCancel={() => setCreating(false)}
            onSaved={() => setCreating(false)}
          />
        )}
      </Drawer>
    </div>
  );
}
