import { Boxes, Columns2, FlaskConical, GitBranch, Layers, Plus, Sparkles, Truck, Workflow } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { toast } from '../../components/toast';
import { TrustBadge } from '../../components/TrustBadge';
import { Badge, Button, buttonClass, Card, Chain, Drawer, EmptyState, Field, Input, Loading, Notice, PageHeader, Select, Table, Tabs, Textarea } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import type { EquipmentTemplate, Simulation } from '../../domain/engineering';
import { TEMPLATE_GROUPS } from '../../domain/engineering';
import { newLocalId, repo, ValidationFailure } from '../../repositories';
import { scenarioMetrics } from '../../services/sim/analysis';
import { scenarioFromTemplate } from '../../services/sim/build';
import { planDraft } from '../../services/sim/report';
import { supplierDisruption } from '../../services/sim/supply';
import { todayIso } from '../../utils/dates';
import { ModeToggle, money, num, pct, useCustomerMode, useEngineering, type Eng } from './shared';

type Tab = 'scenarios' | 'library' | 'compare' | 'disruption';
const WORKFLOW = ['Understand', 'Configure', 'Engineer', 'Simulate', 'Optimize', 'Validate', 'Build', 'Scale'];

export const studioPath = (id: string) => `/studio/${encodeURIComponent(id)}`;

/**
 * EQUIPMENT SIMULATION STUDIO (industrial intelligence master prompt §59–§84, §170): the flagship.
 * Scenarios, the equipment library, scenario comparison and supplier disruption live here; each
 * scenario opens in its own workspace (/studio/:id).
 */
export default function StudioPage() {
  const eng = useEngineering();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) ?? 'scenarios';
  const setTab = (t: Tab) => setParams((p) => (p.set('tab', t), p), { replace: true });
  const [create, setCreate] = useState<{ template?: string } | null>(params.get('new') ? { template: params.get('template') ?? undefined } : null);
  const [draft, setDraft] = useState(params.get('draft') === '1');

  if (eng.status === 'loading') return <Loading />;
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Flagship module"
        title="Equipment Simulation Studio"
        subtitle="Engineering decision-support simulation: architecture, components, cycle time, capacity, bottleneck, variability, cost, risk and validation — every number with its basis."
        actions={
          <>
            <ModeToggle />
            <Button onClick={() => setDraft(true)}>
              <Sparkles className="size-4" aria-hidden /> Draft from text
            </Button>
            <Button variant="primary" onClick={() => setCreate({})}>
              <Plus className="size-4" aria-hidden /> New scenario
            </Button>
          </>
        }
      />
      <Card edge padded={false} bodyClassName="px-4 py-3">
        <Chain label="Studio workflow" steps={WORKFLOW.map((w, i) => ({ label: w.toUpperCase(), state: i < 4 ? 'done' : 'todo' }))} />
        <p className="mt-2 text-micro text-ink-3">
          The simulator models cycle time, queues, blocking, variability, failures, cost and energy. It is not FEA, CFD, optical ray-tracing or servo-dynamics simulation, and results are not factory-validated until measured data is entered under Validation.
        </p>
      </Card>
      <Tabs<Tab>
        label="Studio"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'scenarios', label: 'Scenarios', count: eng.sims.length },
          { key: 'library', label: 'Equipment library', count: eng.templates.length },
          { key: 'compare', label: 'Compare scenarios' },
          { key: 'disruption', label: 'Supplier disruption' },
        ]}
      />
      {tab === 'scenarios' && <Scenarios eng={eng} onNew={() => setCreate({})} onLibrary={() => setTab('library')} />}
      {tab === 'library' && <Library eng={eng} onUse={(t) => setCreate({ template: t })} />}
      {tab === 'compare' && <Compare eng={eng} />}
      {tab === 'disruption' && <Disruption eng={eng} />}
      <CreateDrawer eng={eng} state={create} onClose={() => setCreate(null)} />
      <DraftDrawer eng={eng} open={draft} onClose={() => setDraft(false)} />
    </div>
  );
}

const FOCUS_LABEL: Record<string, string> = { twin: 'digital twin', capacity: 'cycle time, capacity and bottleneck', variability: 'Monte Carlo', whatif: 'what-if analysis', optimize: 'optimization', review: 'design review and DFM/DFA', cost: 'BOM and equipment cost', simulate: 'material-flow simulation', sequence: 'automation sequence', reliability: 'faults, maintenance and energy', validation: 'validation', architecture: 'architecture builder', components: 'component selection', laser: 'laser and optics' };

function Scenarios({ eng, onNew, onLibrary }: { eng: Eng; onNew: () => void; onLibrary: () => void }) {
  const customer = useCustomerMode();
  const [params] = useSearchParams();
  const focus = params.get('focus') ?? '';
  const href = (id: string) => `${studioPath(id)}${FOCUS_LABEL[focus] ? `?tab=${focus}` : ''}`;
  const rows = useMemo(() => eng.sims.map((s) => ({ s, m: scenarioMetrics(s, eng.byId, eng.defs, eng.fx) })), [eng]);
  if (!rows.length)
    return (
      <EmptyState
        icon={FlaskConical}
        title="No simulation scenarios created."
        explain="A scenario is an equipment configuration with its simulation inputs. Start from an equipment template or describe the machine in a sentence."
        actions={
          <>
            <Button variant="primary" onClick={onNew}>
              Create scenario
            </Button>
            <Button onClick={onLibrary}>Use template</Button>
          </>
        }
      />
    );
  return (
    <Card title="Scenarios" icon={FlaskConical} description={FOCUS_LABEL[focus] ? `Choose a scenario to open its ${FOCUS_LABEL[focus]}` : 'Open a scenario to configure, simulate, optimize and validate it'}>
      <Table head={['Scenario', 'Template', 'Customer', 'Status', 'Cycle', 'Practical UPH', 'Target', ...(customer ? [] : ['Equipment cost']), 'Trust']} dense>
        {rows.map(({ s, m }) => (
          <tr key={s.id}>
            <td>
              <Link to={href(s.id)} className="font-medium text-accent-2 hover:underline">
                {s.name}
              </Link>
              <div className="text-micro text-ink-3">
                {s.scenario_label ? `Scenario ${s.scenario_label} · ` : ''}v{s.version ?? 1}
                {s.parent_id ? ` · derived from ${eng.byId.get(s.parent_id)?.name ?? s.parent_id}` : ''}
              </div>
            </td>
            <td>{eng.byId.get(s.template_id ?? '')?.name ?? '—'}</td>
            <td>{eng.byId.get(s.customer_id ?? '')?.name ?? '—'}</td>
            <td>
              <Badge>{s.sim_status}</Badge>
            </td>
            <td className="num">{m.runnable ? `${num(m.cycle)} s` : <Badge tone="warn">Inputs missing</Badge>}</td>
            <td className="num">{m.runnable ? num(m.practicalUph, 4) : '—'}</td>
            <td className="num">
              {s.targets?.uph ?? '—'}
              {m.meetsTarget != null && (
                <Badge tone={m.meetsTarget ? 'ok' : 'bad'} className="ml-1.5">
                  {m.meetsTarget ? 'meets' : 'short'}
                </Badge>
              )}
            </td>
            {!customer && <td className="num">{money(m.capex, m.currency)}</td>}
            <td>
              <TrustBadge record={s} />
            </td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function Library({ eng, onUse }: { eng: Eng; onUse: (templateId: string) => void }) {
  return (
    <div className="space-y-4">
      <Notice tone="info">Templates are equipment structures (stations and component slots). Their station times are empty on purpose — a new scenario asks for measured, calculated or assumed values with their basis.</Notice>
      {TEMPLATE_GROUPS.map((g) => {
        const ts = eng.templates.filter((t) => t.group === g);
        if (!ts.length) return null;
        return (
          <Card key={g} title={g} icon={Boxes} description={`${ts.length} templates`}>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ts.map((t) => (
                <li key={t.id} className="flex flex-col rounded-control border border-line p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link to={recordPath(t.id)} className="font-semibold text-ink hover:text-accent-2">
                        {t.name}
                      </Link>
                      <div className="text-micro text-ink-3">{t.application}</div>
                    </div>
                    {t.has_laser_chain && <Badge tone="accent">Laser chain</Badge>}
                  </div>
                  <p className="mt-2 flex-1 text-micro text-ink-2">{t.stations.map((s) => s.name).join(' → ')}</p>
                  <Button size="sm" className="mt-2 self-start" onClick={() => onUse(t.id)}>
                    <Plus className="size-3.5" aria-hidden /> Use template
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}

function Compare({ eng }: { eng: Eng }) {
  const customer = useCustomerMode();
  const [params, setParams] = useSearchParams();
  const ids = (params.get('ids') ?? 'sim-demo-pcb-a,sim-demo-pcb-b,sim-demo-pcb-c').split(',').filter((id) => eng.byId.has(id));
  const toggle = (id: string) =>
    setParams(
      (p) => {
        const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
        p.set('ids', next.join(','));
        return p;
      },
      { replace: true },
    );
  const ms = useMemo(() => ids.map((id) => scenarioMetrics(eng.byId.get(id) as Simulation & AnyRecord, eng.byId, eng.defs, eng.fx)), [ids, eng]);
  const rows: [string, (m: (typeof ms)[number]) => string, boolean?][] = [
    ['Cycle time', (m) => (m.cycle != null ? `${num(m.cycle)} s` : 'Not runnable')],
    ['Practical UPH', (m) => num(m.practicalUph, 4)],
    ['Meets target', (m) => (m.meetsTarget == null ? 'No target' : m.meetsTarget ? 'Yes' : 'No')],
    ['Bottleneck', (m) => m.bottleneck ?? '—'],
    ['Utilization at target', (m) => pct(m.bottleneckUtilization)],
    ['Equipment cost (CAPEX)', (m) => money(m.capex, m.currency), true],
    ['BOM lines', (m) => String(m.bomLines), true],
    ['Footprint', (m) => (m.footprint != null ? `${num(m.footprint)} m²` : 'Not Available')],
    ['Warnings (risk)', (m) => String(m.risks), true],
    ['Manufacturers (supplier dependency)', (m) => String(m.manufacturers), true],
    ['Local cost share', (m) => pct(m.localization), true],
    ['Energy per part', (m) => (m.energyKwhPerPart != null ? `${num(m.energyKwhPerPart)} kWh (estimate)` : 'Not Available')],
    ['Longest lead time', (m) => (m.maxLeadTimeWeeks != null ? `${m.maxLeadTimeWeeks} wk` : 'Not Available'), true],
  ];
  return (
    <div className="space-y-4">
      <Card title="Choose scenarios" icon={Columns2}>
        <ul className="flex flex-wrap gap-2">
          {eng.sims.map((s) => (
            <li key={s.id}>
              <label className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-control border border-line px-2.5 py-1 text-meta">
                <input type="checkbox" checked={ids.includes(s.id)} onChange={() => toggle(s.id)} />
                {s.name}
              </label>
            </li>
          ))}
        </ul>
      </Card>
      {ms.length ? (
        <Card title="Scenario comparison" icon={GitBranch} description="Metrics side by side. No overall winner is declared — the trade-off is an engineering and commercial decision.">
          <Table head={['Metric', ...ms.map((m) => m.label + (m.label.length < 3 ? ` — ${m.name.split('—').pop()?.trim() ?? ''}` : ''))]} dense>
            {rows
              .filter(([, , internal]) => !(customer && internal))
              .map(([label, f]) => (
                <tr key={label}>
                  <th scope="row" className="px-2.5 py-1.5 text-left font-medium text-ink-2">
                    {label}
                  </th>
                  {ms.map((m) => (
                    <td key={m.id} className="num">
                      {f(m)}
                    </td>
                  ))}
                </tr>
              ))}
          </Table>
        </Card>
      ) : (
        <EmptyState title="No scenarios selected" explain="Tick two or more scenarios above." />
      )}
    </div>
  );
}

function Disruption({ eng }: { eng: Eng }) {
  const manufacturers = useMemo(() => [...new Set(eng.parts.map((p) => p.manufacturer_id).filter((x): x is string => !!x))].map((id) => eng.byId.get(id)).filter((x): x is AnyRecord => !!x), [eng]);
  const [mfr, setMfr] = useState(manufacturers[0]?.id ?? '');
  const [days, setDays] = useState(60);
  const r = useMemo(() => (mfr ? supplierDisruption(mfr, days, eng.records) : null), [mfr, days, eng.records]);
  return (
    <Card title="Supplier disruption simulation" icon={Truck} description="What if a manufacturer cannot deliver? Affected components, equipment, projects and alternatives — with assumptions stated.">
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Manufacturer unavailable" htmlFor="dis-mfr">
          <Select id="dis-mfr" value={mfr} onChange={(e) => setMfr(e.target.value)}>
            {manufacturers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Outage (days)" htmlFor="dis-days">
          <Input id="dis-days" type="number" min={1} value={days} onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))} />
        </Field>
      </div>
      {r && (
        <>
          <div className="mb-3 flex flex-wrap gap-2 text-meta">
            <Badge tone={r.affectedParts.length ? 'warn' : 'ok'}>{r.affectedParts.length} components</Badge>
            <Badge tone={r.affectedScenarios.length ? 'warn' : 'ok'}>{r.affectedScenarios.length} equipment scenarios</Badge>
            <Badge tone={r.affectedProjects.length ? 'warn' : 'ok'}>{r.affectedProjects.length} projects</Badge>
          </div>
          {r.rows.length ? (
            <Table head={['Component', 'Used in', 'Alternatives', 'Lead-time impact', 'Note']} dense>
              {r.rows.map((x) => (
                <tr key={x.part.id}>
                  <td>
                    <Link to={recordPath(x.part.id)} className="text-accent-2 hover:underline">
                      {x.part.model_number}
                    </Link>
                  </td>
                  <td>{x.scenarios.length ? x.scenarios.join('; ') : 'No scenario'}</td>
                  <td>{x.alternatives.length ? x.alternatives.map((a) => a.model_number).join(', ') : 'None'}</td>
                  <td className="num">{num(x.leadImpactWeeks)} wk</td>
                  <td className="text-micro">{x.note}</td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="text-meta text-ink-3">This manufacturer supplies no recorded component.</p>
          )}
          {r.affectedProjects.length > 0 && (
            <p className="mt-2 text-meta">
              Projects:{' '}
              {r.affectedProjects.map((p) => (
                <Link key={p.id} to={recordPath(p.id)} className="mr-2 text-accent-2 hover:underline">
                  {p.name}
                </Link>
              ))}
            </p>
          )}
          <ul className="mt-3 list-disc space-y-0.5 pl-5 text-micro text-ink-3">
            {r.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

function CreateDrawer({ eng, state, onClose }: { eng: Eng; state: { template?: string } | null; onClose: () => void }) {
  const nav = useNavigate();
  const [template, setTemplate] = useState('');
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState('');
  const [uph, setUph] = useState('');
  const [reqs, setReqs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const tId = template || state?.template || eng.templates[0]?.id || '';
  const customers = eng.records.filter((r) => r.entity === 'customer');
  const requirements = eng.records.filter((r) => r.entity === 'requirement');
  const save = async () => {
    const t = eng.byId.get(tId) as (EquipmentTemplate & AnyRecord) | undefined;
    if (!t) return setError('Choose an equipment template');
    const sim = scenarioFromTemplate(t, { newId: newLocalId, today: todayIso(), name: name.trim() || undefined, customer_id: customer || undefined, requirement_ids: reqs, uph: uph ? Number(uph) : null });
    try {
      await repo().workspace.save(sim as unknown as Record<string, unknown>, `New scenario: ${sim.name}`);
      toast('Scenario created as a local draft', { tone: 'draft', detail: 'Enter station times, select components, then run the simulation.' });
      onClose();
      nav(studioPath(sim.id));
    } catch (e) {
      setError(e instanceof ValidationFailure ? e.message : String(e));
    }
  };
  return (
    <Drawer open={!!state} onClose={onClose} title="New simulation scenario" subtitle="Saved as a local draft in this browser">
      <div className="space-y-3">
        <Field label="Equipment template" htmlFor="ns-t">
          <Select id="ns-t" value={tId} onChange={(e) => setTemplate(e.target.value)}>
            {TEMPLATE_GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {eng.templates
                  .filter((t) => t.group === g)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Field label="Scenario name" htmlFor="ns-n" hint="Defaults to the template name">
          <Input id="ns-n" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Customer" htmlFor="ns-c">
          <Select id="ns-c" value={customer} onChange={(e) => setCustomer(e.target.value)}>
            <option value="">None</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Target throughput (UPH)" htmlFor="ns-u" hint="Leave empty if the customer has not stated it">
          <Input id="ns-u" type="number" min={1} value={uph} onChange={(e) => setUph(e.target.value)} />
        </Field>
        <Field label="Requirements this equipment must meet" htmlFor="ns-r">
          <select id="ns-r" multiple value={reqs} onChange={(e) => setReqs([...e.target.selectedOptions].map((o) => o.value))} className="min-h-28 w-full rounded-control border border-line-strong bg-solid px-2 py-1 text-body">
            {requirements.map((r) => (
              <option key={r.id} value={r.id}>
                {String(r.code ?? r.id)} — {r.name}
              </option>
            ))}
          </select>
        </Field>
        {error && <Notice tone="warn">{error}</Notice>}
        <div className="flex gap-2">
          <Button variant="primary" onClick={save}>
            <Workflow className="size-4" aria-hidden /> Create scenario
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Drawer>
  );
}

function DraftDrawer({ eng, open, onClose }: { eng: Eng; open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const [text, setText] = useState('Build a preliminary 500 UPH PCB laser marking machine.');
  const plan = useMemo(() => (text.trim() ? planDraft(text, eng.templates, eng.defs) : null), [text, eng]);
  const create = async () => {
    if (!plan?.template) return;
    const sim = scenarioFromTemplate(plan.template, { newId: newLocalId, today: todayIso(), name: `Draft — ${text.trim().replace(/\.$/, '').slice(0, 80)}`, uph: plan.uph });
    const rec = { ...sim, tags: ['rule-generated-draft'], provenance: { verification_status: 'DRAFT', note: `RULE-GENERATED DRAFT from the text “${text.trim()}” by keyword rules — no AI model is connected. Engineering review required. Missing: ${plan.missing.join('; ')}` } };
    await repo().workspace.save(rec as unknown as Record<string, unknown>, `Draft scenario: ${rec.name}`);
    toast('Draft scenario created', { tone: 'draft', detail: 'Engineering review required — nothing was assumed.' });
    onClose();
    nav(studioPath(rec.id));
  };
  return (
    <Drawer open={open} onClose={onClose} title="Draft an equipment architecture from text" subtitle="Keyword rules, not an AI model — what it cannot read is listed as missing" wide>
      <div className="space-y-3">
        <Field label="Describe the machine" htmlFor="dd-t">
          <Textarea id="dd-t" value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        {plan && (
          <div className="space-y-2 text-body">
            <Notice tone="draft">RULE-GENERATED DRAFT — engineering review required.</Notice>
            <p>
              <strong>Template:</strong> {plan.template ? plan.template.name : 'No template matched — pick one from the library'}
            </p>
            <p>
              <strong>Read from the text:</strong> {[plan.uph && `${plan.uph} UPH`, plan.industry, plan.process, plan.material].filter(Boolean).join(' · ') || 'nothing'}
            </p>
            {plan.template && <p className="text-meta text-ink-2">{plan.template.stations.map((s) => s.name).join(' → ')}</p>}
            <div>
              <strong>Missing — not assumed:</strong>
              <ul className="mt-1 list-disc pl-5 text-meta">
                {plan.missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="primary" onClick={create} disabled={!plan?.template}>
            <Layers className="size-4" aria-hidden /> Create draft scenario
          </Button>
          <Link to="/studio?tab=library" onClick={onClose} className={buttonClass('secondary')}>
            Browse templates
          </Link>
        </div>
      </div>
    </Drawer>
  );
}
