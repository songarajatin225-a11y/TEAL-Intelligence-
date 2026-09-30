import clsx from 'clsx';
import { BarChart3, Building2, Columns2, Database, FileSearch, GitCompare, Layers, ListTree, Plug, Plus, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { EntityForm } from '../../components/EntityForm';
import { recordPath } from '../../components/RecordLink';
import { TrustBadge } from '../../components/TrustBadge';
import { Badge, Button, Card, Chain, Drawer, EmptyState, Field, Input, Loading, Notice, PageHeader, Select, Stat, Table, Tabs } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { DISCIPLINES, disciplineOf, LIFECYCLE_STATUSES, PRODUCT_TYPES, productTypeLabel, type Part } from '../../domain/engineering';
import { checkPair } from '../../services/eng/compatibility';
import { databaseAnalytics } from '../../services/eng/dataReview';
import { describeQuery, searchParts, type Candidate } from '../../services/eng/partSearch';
import { displaySpec, freshness, KEY_SPECS, partConfidence, PRIORITY_LABEL, readSpec, sourcePriority } from '../../services/eng/specs';
import { latestPrice, originOf } from '../../services/sim/supply';
import { todayIso } from '../../utils/dates';
import { CompatBadge, ModeToggle, useCustomerMode, useEngineering, type Eng } from '../studio/shared';

type Tab = 'products' | 'manufacturers' | 'specs' | 'compatibility' | 'compare' | 'analytics' | 'sources' | 'overlay';
type P = Part & AnyRecord;
const EXAMPLES = ['1064 nm 50 W MOPA', 'Galvo above 30 mm aperture', 'F-theta for 100 mm field', '12 MP global shutter camera', 'Linear stage above 500 mm/s', 'Find a 1064 nm laser above 30 W suitable for aluminum marking'];

/**
 * GLOBAL ENGINEERING DATABASE (industrial intelligence master prompt §9–§58, §114–§116): manufacturers,
 * products with dynamic specifications and field-level evidence, technical search and filters,
 * compatibility, comparison without ranking, sources and the TEAL overlay.
 */
export default function EngineeringDbPage() {
  const eng = useEngineering();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) ?? 'products';
  const setTab = (t: Tab) => setParams((p) => (p.set('tab', t), p), { replace: true });
  const [create, setCreate] = useState<null | { entity: string; preset?: Record<string, unknown>; title: string }>(null);
  if (eng.status === 'loading') return <Loading />;
  const a = databaseAnalytics(eng.records, eng.defs, todayIso());
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Intelligence"
        title="Global Engineering Database"
        subtitle="Manufacturers, products and their specifications — every value with its source. Structured for tens of thousands of products; today it holds the DEMO catalogue plus anything you add."
        actions={
          <>
            <ModeToggle />
            <Button variant="primary" onClick={() => setCreate({ entity: 'part', title: 'New engineering product', preset: { scope: 'GLOBAL', record_status: 'Draft', lifecycle_status: 'Unknown', specs: [] } })}>
              <Plus className="size-4" aria-hidden /> Add product
            </Button>
          </>
        }
      />
      {a.demo > 0 && a.demo === a.products && <Notice tone="info">Every product in the database today is DEMO DATA with fictional manufacturers — for demonstrating search, compatibility and simulation. Real products enter through the reviewed ingestion pipeline with a source for every value.</Notice>}
      <Tabs<Tab>
        label="Engineering database"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'products', label: 'Products', count: a.products },
          { key: 'manufacturers', label: 'Manufacturers', count: a.manufacturers },
          { key: 'specs', label: 'Specifications', count: a.specDefinitions },
          { key: 'compatibility', label: 'Compatibility', count: a.rules + a.relationships },
          { key: 'compare', label: 'Compare' },
          { key: 'analytics', label: 'Analytics' },
          { key: 'sources', label: 'Sources & ingestion' },
          { key: 'overlay', label: 'TEAL overlay', count: a.teal },
        ]}
      />
      {tab === 'products' && <Products eng={eng} />}
      {tab === 'manufacturers' && <Manufacturers eng={eng} onAdd={() => setCreate({ entity: 'company', title: 'New manufacturer', preset: { roles: ['manufacturer'] } })} />}
      {tab === 'specs' && <Specs eng={eng} onAdd={() => setCreate({ entity: 'spec_definition', title: 'New specification definition' })} />}
      {tab === 'compatibility' && <Compatibility eng={eng} onAdd={(entity, title) => setCreate({ entity, title })} />}
      {tab === 'compare' && <Compare eng={eng} />}
      {tab === 'analytics' && <Analytics eng={eng} a={a} />}
      {tab === 'sources' && <Sources eng={eng} />}
      {tab === 'overlay' && <Overlay eng={eng} />}
      <Drawer open={!!create} onClose={() => setCreate(null)} title={create?.title ?? ''} subtitle="Saved as a local draft. Enter only sourced values — unknown stays empty." wide>
        {create && <EntityForm entity={create.entity} preset={create.preset} onCancel={() => setCreate(null)} onSaved={() => setCreate(null)} />}
      </Drawer>
    </div>
  );
}

function CheckBadges({ c }: { c: Candidate }) {
  return (
    <div className="flex flex-wrap gap-1">
      {c.checks.map((x) => (
        <Badge key={x.label} tone={x.state === 'match' ? 'ok' : x.state === 'fail' ? 'bad' : 'neutral'} title={x.detail}>
          {x.state === 'match' ? '✓' : x.state === 'fail' ? '✕' : '?'} {x.label}: {x.detail}
        </Badge>
      ))}
    </div>
  );
}

function Products({ eng }: { eng: Eng }) {
  const customer = useCustomerMode();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const discipline = params.get('discipline') ?? '';
  const type = params.get('type') ?? '';
  const mfr = params.get('mfr') ?? '';
  const life = params.get('life') ?? '';
  const scope = params.get('scope') ?? '';
  const setP = (k: string, v: string) => setParams((p) => (v ? p.set(k, v) : p.delete(k), k === 'discipline' && p.delete('type'), p), { replace: true });
  const [text, setText] = useState(q);
  const [range, setRange] = useState<Record<string, { min?: number; max?: number }>>({});
  const res = useMemo(() => (q.trim() ? searchParts(q, eng.parts, eng.defs) : null), [q, eng]);
  const typeKeys = Object.keys(PRODUCT_TYPES).filter((t) => !discipline || PRODUCT_TYPES[t].discipline === discipline);
  const filterSpecs = type ? (KEY_SPECS[type] ?? [...eng.defs.values()].filter((d) => d.applies_to.includes(type) && d.filterable && (d.spec_type === 'number' || d.spec_type === 'range')).map((d) => d.key)).filter((k) => ['number', 'range'].includes(eng.defs.get(k)?.spec_type ?? '')).slice(0, 6) : [];
  const listed = useMemo(
    () =>
      eng.parts.filter((p) => {
        if (discipline && disciplineOf(p.product_type) !== discipline) return false;
        if (type && p.product_type !== type) return false;
        if (mfr && p.manufacturer_id !== mfr) return false;
        if (life && p.lifecycle_status !== life) return false;
        if (scope && p.scope !== scope) return false;
        for (const [k, r] of Object.entries(range)) {
          if (r.min == null && r.max == null) continue;
          const s = readSpec(p, k, eng.defs);
          const lo = s?.min ?? s?.value;
          const hi = s?.max ?? s?.value;
          if (lo == null || hi == null) return false;
          if (r.min != null && hi < r.min) return false;
          if (r.max != null && lo > r.max) return false;
        }
        return true;
      }),
    [eng, discipline, type, mfr, life, scope, range],
  );
  const mfrs = [...new Set(eng.parts.map((p) => p.manufacturer_id).filter((x): x is string => !!x))].map((id) => eng.byId.get(id)).filter((x): x is AnyRecord => !!x);
  const cmpLink = (ids: string[]) => `/engineering-db?tab=compare&ids=${ids.slice(0, 5).join(',')}`;
  return (
    <div className="space-y-4">
      <Card title="Technical search" icon={Search} description="Type a requirement in words — it becomes explicit filters you can see. Results are candidates, never ranked into a single “best”.">
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setP('q', text.trim());
          }}
        >
          <Input aria-label="Technical search" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. 1064 nm 50 W MOPA" className="min-w-64 flex-1" />
          <Button type="submit" variant="primary">
            <Search className="size-4" aria-hidden /> Search
          </Button>
          {q && (
            <Button type="button" onClick={() => (setText(''), setP('q', ''))}>
              Clear
            </Button>
          )}
        </form>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((x) => (
            <button key={x} type="button" onClick={() => (setText(x), setP('q', x))} className="inline-flex min-h-7 items-center rounded-full border border-line-strong px-2.5 text-micro hover:border-accent hover:text-accent-2">
              {x}
            </button>
          ))}
        </div>
      </Card>
      {res && (
        <Card title={`Results for “${q}”`} description={res.understood ? `Read as: ${describeQuery(res.parsed).join(' · ')}` : 'No technical parameter recognised — matched on names and model numbers only'}>
          {res.parsed.uph != null && (
            <Notice tone="info">
              {res.parsed.uph} UPH is an equipment requirement — open the <Link to="/studio?tab=library" className="underline">Equipment Simulation Studio</Link> to build and simulate a machine for it.
            </Notice>
          )}
          {res.candidates.length ? (
            <Table head={['Candidate', 'Manufacturer', 'Checks (✓ match · ? not recorded)', 'Application evidence', 'Trust']} dense>
              {res.candidates.map((c) => (
                <tr key={c.part.id}>
                  <td>
                    <Link to={recordPath(c.part.id)} className="font-medium text-accent-2 hover:underline">
                      {c.part.model_number}
                    </Link>
                    <div className="text-micro text-ink-3">{productTypeLabel(c.part.product_type)}</div>
                  </td>
                  <td>{customer ? '—' : eng.byId.get(c.part.manufacturer_id ?? '')?.name ?? c.part.brand ?? '—'}</td>
                  <td>
                    <CheckBadges c={c} />
                  </td>
                  <td className="text-micro">{c.applicationEvidence.join('; ') || '—'}</td>
                  <td>
                    <TrustBadge record={c.part} />
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <p className="text-meta text-ink-3">No product satisfies every filter.</p>
          )}
          {res.near.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-1 text-body font-semibold">Near matches — one filter not met</h3>
              <Table head={['Product', 'Checks']} dense>
                {res.near.map((c) => (
                  <tr key={c.part.id}>
                    <td>
                      <Link to={recordPath(c.part.id)} className="text-accent-2 hover:underline">
                        {c.part.model_number}
                      </Link>
                    </td>
                    <td>
                      <CheckBadges c={c} />
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
          {res.candidates.length > 1 && (
            <Link to={cmpLink(res.candidates.map((c) => c.part.id))} className="mt-3 inline-flex min-h-8 items-center gap-1 text-meta text-accent-2 hover:underline">
              <Columns2 className="size-4" aria-hidden /> Compare the candidates side by side
            </Link>
          )}
        </Card>
      )}
      <Card title="Browse and filter" icon={ListTree} description="Technical filters appear when you choose a product type (§57)">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Field label="Discipline" htmlFor="f-d">
            <Select id="f-d" value={discipline} onChange={(e) => setP('discipline', e.target.value)}>
              <option value="">All</option>
              {DISCIPLINES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </Field>
          <Field label="Product type" htmlFor="f-t">
            <Select id="f-t" value={type} onChange={(e) => (setP('type', e.target.value), setRange({}))}>
              <option value="">All</option>
              {typeKeys.map((t) => (
                <option key={t} value={t}>
                  {productTypeLabel(t)} ({eng.parts.filter((p) => p.product_type === t).length})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Manufacturer" htmlFor="f-m">
            <Select id="f-m" value={mfr} onChange={(e) => setP('mfr', e.target.value)}>
              <option value="">All</option>
              {mfrs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lifecycle" htmlFor="f-l">
            <Select id="f-l" value={life} onChange={(e) => setP('life', e.target.value)}>
              <option value="">All</option>
              {LIFECYCLE_STATUSES.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Data" htmlFor="f-s">
            <Select id="f-s" value={scope} onChange={(e) => setP('scope', e.target.value)}>
              <option value="">Global + TEAL</option>
              <option value="GLOBAL">Global engineering data</option>
              <option value="TEAL">TEAL data</option>
            </Select>
          </Field>
        </div>
        {filterSpecs.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {filterSpecs.map((k) => {
              const d = eng.defs.get(k)!;
              return (
                <Field key={k} label={`${d.name} (${d.canonical_unit ?? ''})`}>
                  <div className="flex gap-1">
                    <Input aria-label={`${d.name} minimum`} inputMode="decimal" placeholder="min" value={range[k]?.min ?? ''} onChange={(e) => setRange((r) => ({ ...r, [k]: { ...r[k], min: e.target.value === '' ? undefined : Number(e.target.value) } }))} />
                    <Input aria-label={`${d.name} maximum`} inputMode="decimal" placeholder="max" value={range[k]?.max ?? ''} onChange={(e) => setRange((r) => ({ ...r, [k]: { ...r[k], max: e.target.value === '' ? undefined : Number(e.target.value) } }))} />
                  </div>
                </Field>
              );
            })}
          </div>
        )}
      </Card>
      <Card title={`${listed.length} products`} icon={Database} actions={listed.length > 1 && <Link to={cmpLink(listed.map((p) => p.id))} className="text-meta text-accent-2 hover:underline">Compare first {Math.min(5, listed.length)}</Link>}>
        {listed.length ? (
          <Table head={['Product', 'Type', ...(customer ? [] : ['Manufacturer']), ...(filterSpecs.length ? filterSpecs.map((k) => eng.defs.get(k)!.name) : ['Key specifications']), 'Lifecycle', 'Record', 'Trust']} dense>
            {listed.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link to={recordPath(p.id)} className="font-medium text-accent-2 hover:underline">
                    {p.model_number}
                  </Link>
                  <div className="text-micro text-ink-3">{p.name}</div>
                </td>
                <td className="text-micro">{productTypeLabel(p.product_type)}</td>
                {!customer && <td className="text-micro">{eng.byId.get(p.manufacturer_id ?? '')?.name ?? p.brand ?? '—'}</td>}
                {filterSpecs.length ? (
                  filterSpecs.map((k) => (
                    <td key={k} className="num text-micro">
                      {displaySpec(readSpec(p, k, eng.defs))}
                    </td>
                  ))
                ) : (
                  <td className="text-micro">
                    {(KEY_SPECS[p.product_type] ?? p.specs.map((s) => s.spec))
                      .slice(0, 3)
                      .map((k) => readSpec(p, k, eng.defs))
                      .filter(Boolean)
                      .map((s) => `${s!.def?.name ?? s!.key} ${displaySpec(s!)}`)
                      .join(' · ') || 'No specifications'}
                  </td>
                )}
                <td>
                  <Badge tone={p.lifecycle_status === 'Active' ? 'ok' : p.lifecycle_status === 'Discontinued' ? 'bad' : 'neutral'}>{p.lifecycle_status}</Badge>
                </td>
                <td>
                  <Badge>{p.record_status}</Badge>
                </td>
                <td>
                  <TrustBadge record={p} />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState compact title="No product matches these filters" explain="Clear a filter, or add the product with its datasheet values." />
        )}
      </Card>
    </div>
  );
}

function Manufacturers({ eng, onAdd }: { eng: Eng; onAdd: () => void }) {
  const ms = eng.records.filter((r) => r.entity === 'company' && Array.isArray(r.roles) && (r.roles as string[]).includes('manufacturer'));
  const count = (id: string) => eng.parts.filter((p) => p.manufacturer_id === id).length;
  const cats = [...new Set(ms.flatMap((m) => ((m.registry_categories as string[] | undefined)?.length ? (m.registry_categories as string[]) : ['Uncategorised'])))].sort((a, b) => (a === 'Uncategorised' ? 1 : b === 'Uncategorised' ? -1 : a.localeCompare(b)));
  return (
    <div className="space-y-4">
      <Card title="Manufacturer registry" icon={Building2} description="Data-driven: categories come from each manufacturer’s record — add a manufacturer and it appears here (§55). Handbook-named companies stay Uncategorised until curated." actions={<Button size="sm" onClick={onAdd}><Plus className="size-3.5" aria-hidden /> Add manufacturer</Button>}>
        {cats.map((c) => {
          const xs = ms.filter((m) => ((m.registry_categories as string[] | undefined)?.length ? (m.registry_categories as string[]).includes(c) : c === 'Uncategorised'));
          return (
            <section key={c} className="border-t border-line py-2 first:border-0">
              <h3 className="mb-1 text-body font-semibold">
                {c} <Badge>{xs.length}</Badge>
              </h3>
              <ul className="grid grid-cols-1 gap-x-4 gap-y-1 text-meta sm:grid-cols-2 xl:grid-cols-3">
                {xs.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-2">
                    <Link to={recordPath(m.id)} className="block min-h-6 truncate leading-6 text-accent-2 hover:underline">
                      {m.name}
                    </Link>
                    <span className="shrink-0 text-micro text-ink-3">
                      {(m.country as string | undefined) ?? 'country not recorded'} · {count(m.id)} products
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </Card>
    </div>
  );
}

function Specs({ eng, onAdd }: { eng: Eng; onAdd: () => void }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const defs = [...eng.defs.values()];
  const cats = [...new Set(defs.map((d) => d.category))].sort();
  const shown = defs.filter((d) => (!cat || d.category === cat) && (!q || `${d.key} ${d.name} ${(d.aliases ?? []).join(' ')} ${d.applies_to.join(' ')}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <Card title="Dynamic specification engine" icon={ListTree} description="Specifications are rows, not columns: a new parameter is a new definition — no code change (§12). Values are normalised to the canonical unit; originals are kept (§13)." actions={<Button size="sm" onClick={onAdd}><Plus className="size-3.5" aria-hidden /> Add definition</Button>}>
      <div className="mb-3 flex flex-wrap gap-2">
        <Input aria-label="Filter specifications" placeholder="Filter by name, key, alias or product type" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-60 flex-1" />
        <Select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)} className="w-48">
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </div>
      <Table head={['Parameter', 'Key', 'Category', 'Type', 'Canonical unit', 'Applies to', 'Values recorded']} dense>
        {shown.map((d) => (
          <tr key={d.key}>
            <td>
              <Link to={recordPath(`spd-${d.key.replace(/_/g, '-')}`)} className="text-accent-2 hover:underline">
                {d.name}
              </Link>
            </td>
            <td className="font-mono text-micro">{d.key}</td>
            <td>{d.category}</td>
            <td>{d.spec_type}</td>
            <td>{d.canonical_unit ?? '—'}</td>
            <td className="text-micro">{d.applies_to.includes('*') ? 'all types' : d.applies_to.map(productTypeLabel).join(', ')}</td>
            <td className="num">{eng.parts.reduce((n, p) => n + p.specs.filter((s) => s.spec === d.key).length, 0)}</td>
          </tr>
        ))}
      </Table>
    </Card>
  );
}

function Compatibility({ eng, onAdd }: { eng: Eng; onAdd: (entity: string, title: string) => void }) {
  const [a, setA] = useState(eng.parts[0]?.id ?? '');
  const [b, setB] = useState(eng.parts.find((p) => p.product_type === 'f_theta')?.id ?? '');
  const pa = eng.byId.get(a) as P | undefined;
  const pb = eng.byId.get(b) as P | undefined;
  const r = pa && pb && pa.id !== pb.id ? checkPair(pa, pb, eng.ctx) : null;
  const rules = eng.records.filter((x) => x.entity === 'compatibility_rule');
  const rels = eng.records.filter((x) => x.entity === 'compatibility');
  const opt = (p: P) => (
    <option key={p.id} value={p.id}>
      {p.model_number} — {productTypeLabel(p.product_type)}
    </option>
  );
  return (
    <div className="space-y-4">
      <Card title="Compatibility checker" icon={Plug} description="Laser ↔ galvo, laser ↔ f-theta, galvo ↔ f-theta, camera ↔ lens, PLC ↔ servo drive, drive ↔ motor, robot ↔ gripper …">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Component A" htmlFor="ca">
            <Select id="ca" value={a} onChange={(e) => setA(e.target.value)}>
              {eng.parts.map(opt)}
            </Select>
          </Field>
          <Field label="Component B" htmlFor="cb">
            <Select id="cb" value={b} onChange={(e) => setB(e.target.value)}>
              {eng.parts.map(opt)}
            </Select>
          </Field>
        </div>
        {r && (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CompatBadge t={r.relationship} /> <span className="text-meta text-ink-2">{r.basis} · {r.summary}</span>
            </div>
            <ul className="space-y-1 text-meta">
              {r.recorded.map((x) => (
                <li key={x.id}>
                  <Badge tone="ok">Recorded</Badge> {x.relationship}
                  {x.conditions ? ` — ${x.conditions}` : ''} {x.evidence && <span className="text-ink-3">({x.evidence})</span>} · <TrustBadge record={x} />
                </li>
              ))}
              {r.checks.map((c) => (
                <li key={c.rule.id} className={clsx(c.status === 'fail' && 'text-bad', c.status === 'missing' && 'text-ink-3')}>
                  <Badge tone={c.status === 'pass' ? 'ok' : c.status === 'fail' ? 'bad' : 'neutral'}>{c.status === 'pass' ? 'rule ✓' : c.status === 'fail' ? 'rule ✕' : 'rule ?'}</Badge>{' '}
                  <Link to={recordPath(c.rule.id)} className="underline">
                    {c.rule.name}
                  </Link>
                  : {c.detail}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      <Card title="Engineering rules" icon={ShieldCheck} description="Editable, source-tagged, versioned, reviewable (§44). DRAFT until TEAL reviews them." actions={<Button size="sm" onClick={() => onAdd('compatibility_rule', 'New compatibility rule')}><Plus className="size-3.5" aria-hidden /> Add rule</Button>}>
        <Table head={['Rule', 'A', 'Check', 'B', 'On violation', 'Version', 'Status', 'Trust']} dense>
          {rules.map((x) => (
            <tr key={x.id}>
              <td>
                <Link to={recordPath(x.id)} className="text-accent-2 hover:underline">
                  {x.name}
                </Link>
              </td>
              <td className="text-micro">
                {(x.a_types as string[]).map(productTypeLabel).join(', ')} · {String(x.a_spec)}
              </td>
              <td className="font-mono text-micro">
                {String(x.check)}
                {x.factor ? ` ×${String(x.factor)}` : ''}
              </td>
              <td className="text-micro">
                {(x.b_types as string[]).map(productTypeLabel).join(', ')} · {String(x.b_spec)}
              </td>
              <td>
                <Badge tone={x.on_fail === 'Incompatible' ? 'bad' : 'warn'}>{String(x.on_fail)}</Badge>
              </td>
              <td className="num">v{String(x.rule_version)}</td>
              <td>
                <Badge>{String(x.rule_status)}</Badge>
              </td>
              <td>
                <TrustBadge record={x} />
              </td>
            </tr>
          ))}
        </Table>
      </Card>
      <Card title="Recorded relationships" icon={GitCompare} description="Only a relationship with a manufacturer source can say “manufacturer recommended”" actions={<Button size="sm" onClick={() => onAdd('compatibility', 'New compatibility relationship')}><Plus className="size-3.5" aria-hidden /> Record relationship</Button>}>
        {rels.length ? (
          <Table head={['A', 'B', 'Relationship', 'Conditions', 'Evidence', 'Trust']} dense>
            {rels.map((x) => (
              <tr key={x.id}>
                <td>{eng.byId.get(String(x.a_id))?.name ?? String(x.a_id)}</td>
                <td>{eng.byId.get(String(x.b_id))?.name ?? String(x.b_id)}</td>
                <td>
                  <CompatBadge t={x.relationship as never} />
                </td>
                <td className="text-micro">{String(x.conditions ?? '—')}</td>
                <td className="text-micro">{String(x.evidence ?? '—')}</td>
                <td>
                  <TrustBadge record={x} />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-meta text-ink-3">No relationships recorded.</p>
        )}
      </Card>
    </div>
  );
}

function Compare({ eng }: { eng: Eng }) {
  const customer = useCustomerMode();
  const [params, setParams] = useSearchParams();
  const ids = (params.get('ids') ?? '').split(',').filter((id) => eng.byId.get(id)?.entity === 'part').slice(0, 5);
  const parts = ids.map((id) => eng.byId.get(id) as P);
  const setIds = (next: string[]) => setParams((p) => (p.set('ids', next.join(',')), p), { replace: true });
  const [add, setAdd] = useState('');
  const keys = [...new Set(parts.flatMap((p) => p.specs.map((s) => s.spec)))];
  const today = todayIso();
  return (
    <div className="space-y-4">
      <Card title="Product comparison" icon={Columns2} description="Any products side by side: specification, source, availability, lifecycle, compatibility, application, cost, supplier and risk. No “best product” ranking (§58).">
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Add a product" htmlFor="cmp-add">
            <Select id="cmp-add" value={add} onChange={(e) => setAdd(e.target.value)} className="min-w-72">
              <option value="">Choose…</option>
              {eng.parts
                .filter((p) => !ids.includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.model_number} — {productTypeLabel(p.product_type)}
                  </option>
                ))}
            </Select>
          </Field>
          <Button disabled={!add || ids.length >= 5} onClick={() => (setIds([...ids, add]), setAdd(''))}>
            <Plus className="size-4" aria-hidden /> Add
          </Button>
          {ids.length > 0 && <Button onClick={() => setIds([])}>Clear</Button>}
        </div>
      </Card>
      {parts.length ? (
        <Card title={`${parts.length} products`}>
          <Table head={['', ...parts.map((p) => p.model_number)]} dense>
            {[
              ['Type', (p: P) => productTypeLabel(p.product_type)],
              ...(customer ? [] : ([['Manufacturer', (p: P) => originOf(p, eng.byId).manufacturer]] as [string, (p: P) => string][])),
              ['Origin', (p: P) => { const o = originOf(p, eng.byId); return `${o.origin}${o.country ? ` (${o.country})` : ''}`; }],
              ['Lifecycle', (p: P) => p.lifecycle_status],
              ['Record status', (p: P) => p.record_status],
              ['Confidence (derived)', (p: P) => partConfidence(p, eng.defs, eng.byId, today).level],
              ['Technologies', (p: P) => (p.technologies ?? []).join(', ') || 'Not recorded'],
              ['Processes / applications', (p: P) => (p.processes ?? []).join(', ') || 'Not recorded'],
              ...(customer ? [] : ([['Price (latest)', (p: P) => { const x = latestPrice(p); return x ? `${x.currency} ${x.price.toLocaleString('en-IN')} (${x.basis})` : 'Not recorded'; }], ['Lead time', (p: P) => { const x = latestPrice(p)?.lead_time_weeks; return x != null ? `${x} wk` : 'Not recorded'; }]] as [string, (p: P) => string][])),
              ['Communication', (p: P) => (p.interfaces?.communication ?? []).join(', ') || 'Not recorded'],
            ].map(([label, f]) => (
              <tr key={label as string}>
                <th scope="row" className="px-2.5 py-1.5 text-left font-medium text-ink-2">
                  {label as string}
                </th>
                {parts.map((p) => (
                  <td key={p.id} className="text-micro">
                    {(f as (p: P) => string)(p)}
                  </td>
                ))}
              </tr>
            ))}
            {keys.map((k) => (
              <tr key={k}>
                <th scope="row" className="px-2.5 py-1.5 text-left font-medium text-ink-2">
                  {eng.defs.get(k)?.name ?? k}
                </th>
                {parts.map((p) => {
                  const s = readSpec(p, k, eng.defs, eng.byId);
                  return (
                    <td key={p.id} className="text-micro">
                      {s ? (
                        <>
                          <span className="num">{displaySpec(s)}</span>
                          {s.conflict && <Badge tone="bad" className="ml-1">conflict</Badge>}
                          <div className="text-ink-3">{eng.byId.get(s.entry.source_id ?? '')?.name ?? 'no source'}</div>
                        </>
                      ) : (
                        <span className="text-ink-3">Not Available</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </Table>
          {parts.length > 1 && (
            <div className="mt-3">
              <h3 className="mb-1 text-body font-semibold">Compatibility between them</h3>
              <ul className="space-y-1 text-meta">
                {parts.flatMap((p, i) =>
                  parts.slice(i + 1).map((q) => {
                    const r = checkPair(p, q, eng.ctx);
                    return (
                      <li key={`${p.id}${q.id}`} className="flex flex-wrap items-center gap-2">
                        {p.model_number} ↔ {q.model_number}: <CompatBadge t={r.relationship} /> <span className="text-micro text-ink-3">{r.summary}</span>
                      </li>
                    );
                  }),
                )}
              </ul>
            </div>
          )}
        </Card>
      ) : (
        <EmptyState icon={Columns2} title="Nothing to compare yet" explain="Add products above, or use “Compare” from search results." />
      )}
    </div>
  );
}

function Analytics({ eng, a }: { eng: Eng; a: ReturnType<typeof databaseAnalytics> }) {
  const byType = Object.entries(eng.parts.reduce<Record<string, number>>((m, p) => ((m[p.product_type] = (m[p.product_type] ?? 0) + 1), m), {})).sort((x, y) => y[1] - x[1]);
  const max = Math.max(1, ...byType.map(([, n]) => n));
  return (
    <div className="space-y-4">
      <p className="text-meta text-ink-3">Every number is counted from records in the database — nothing is typed in (§114).</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="Manufacturers" value={a.manufacturers} to="/engineering-db?tab=manufacturers" icon={Building2} />
        <Stat label="Products" value={a.products} sub={`${a.global} global · ${a.teal} TEAL · ${a.demo} DEMO`} to="/engineering-db" icon={Database} />
        <Stat label="Product families" value={a.families} />
        <Stat label="Specification values" value={a.specifications} sub={`${a.specDefinitions} definitions`} to="/engineering-db?tab=specs" icon={ListTree} />
        <Stat label="Product types" value={a.productTypes} />
        <Stat label="Technologies" value={a.technologies} to="/technology" />
        <Stat label="Applications" value={a.applications} to="/applications" />
        <Stat label="Documents referenced" value={a.documents} />
        <Stat label="Sources" value={a.sources} to="/engineering-db?tab=sources" icon={FileSearch} />
        <Stat label="Conflicts" value={a.conflicts} tone={a.conflicts ? 'warn' : 'ok'} to="/data-review?queue=Conflicting" />
        <Stat label="Stale records" value={a.stale} tone={a.stale ? 'warn' : 'ok'} to="/data-review?queue=Stale" />
        <Stat label="Incomplete records" value={a.incomplete} tone={a.incomplete ? 'warn' : 'ok'} to="/data-review?queue=Missing" />
      </div>
      <Card title="Products by type" icon={BarChart3}>
        <ul className="space-y-1.5">
          {byType.map(([t, n]) => (
            <li key={t} className="grid grid-cols-[minmax(8rem,12rem)_1fr_2.5rem] items-center gap-3 text-meta">
              <Link to={`/engineering-db?type=${t}`} className="block min-h-6 truncate leading-6 text-accent-2 hover:underline">
                {productTypeLabel(t)}
              </Link>
              <div className="h-2.5 rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(n / max) * 100}%` }} />
              </div>
              <span className="num text-right">{n}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Sources({ eng }: { eng: Eng }) {
  const sources = eng.records.filter((r) => r.entity === 'source');
  const today = todayIso();
  return (
    <div className="space-y-4">
      <Card title="Controlled ingestion pipeline" icon={Layers} description="Only approved sources are retrieved. robots.txt, terms of use, rate limits, copyright, logins and CAPTCHAs are respected — never bypassed (§51, §52, §107, §108).">
        <Chain label="Ingestion pipeline" steps={['Source discovery', 'Retrieval', 'Extraction', 'Model detection', 'Specification extraction', 'Normalisation', 'Entity resolution', 'Deduplication', 'Conflict detection', 'Validation', 'Confidence', 'Human review', 'Database'].map((s, i) => ({ label: s, state: i >= 11 ? 'current' : 'todo' }))} />
        <p className="mt-2 text-meta text-ink-2">
          The pipeline runs as reviewed scripts (<span className="font-mono">npm run ingest</span>, see docs/INGESTION.md); its output lands in the <Link to="/data-review" className="text-accent-2 underline">Data Review Center</Link> and reaches GitHub only through a reviewed pull request. No crawler runs from this browser. Extracted fields keep their source, evidence and extraction status; a field that cannot be found is recorded as NOT FOUND, never guessed (§54).
        </p>
      </Card>
      <Card title="Source registry" icon={FileSearch} description="Source priority (§109): manufacturer › official datasheet › manual › application note › authorised distributor › technical publication › research › industry › third party">
        <Table head={['Source', 'Type', 'Priority', 'Freshness', 'Last verified', 'Next review', 'Crawl policy', 'Trust']} dense>
          {sources.map((s) => {
            const f = freshness(s as never, today);
            const crawl = s.crawl as { approved?: boolean; crawl_status?: string; domain?: string } | undefined;
            return (
              <tr key={s.id}>
                <td>
                  <Link to={recordPath(s.id)} className="text-accent-2 hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="text-micro">{String(s.source_type ?? s.kind)}</td>
                <td className="text-micro">{PRIORITY_LABEL[sourcePriority(s)]}</td>
                <td>
                  <Badge tone={f === 'stale' ? 'warn' : f === 'fresh' ? 'ok' : 'neutral'}>{f}</Badge>
                </td>
                <td className="num text-micro">{String(s.last_verified ?? s.retrieved_at ?? '—')}</td>
                <td className="num text-micro">{String(s.next_review ?? '—')}</td>
                <td className="text-micro">{crawl ? `${crawl.domain} — ${crawl.approved ? 'approved' : 'not approved'}${crawl.crawl_status ? `, ${crawl.crawl_status}` : ''}` : 'Not a crawl source'}</td>
                <td>
                  <TrustBadge record={s} />
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}

function Overlay({ eng }: { eng: Eng }) {
  const customer = useCustomerMode();
  const teal = eng.parts.filter((p) => p.scope === 'TEAL');
  if (!teal.length) return <EmptyState title="No TEAL products recorded" explain="Add a product with scope TEAL to compare TEAL’s own components with global ones (§116)." />;
  return (
    <div className="space-y-4">
      <Notice tone="info">TEAL data and global engineering data stay separate records. The overlay puts them side by side — it does not rank them (§115, §116).</Notice>
      {teal.map((t) => {
        const others = (t.compare_to_ids ?? []).map((id) => eng.byId.get(id) as P | undefined).filter((x): x is P => !!x);
        const all = [t, ...others];
        const keys = [...new Set(all.flatMap((p) => p.specs.map((s) => s.spec)))];
        return (
          <Card key={t.id} title={t.name} icon={GitCompare}>
            <Table head={['', ...all.map((p) => `${p.model_number} (${p.scope})`)]} dense>
              {[
                ['Maturity (record status)', (p: P) => p.record_status],
                ['Lifecycle', (p: P) => p.lifecycle_status],
                ['Localization', (p: P) => originOf(p, eng.byId).origin],
                ...(customer ? [] : ([['Cost (latest)', (p: P) => { const x = latestPrice(p); return x ? `${x.currency} ${x.price.toLocaleString('en-IN')} (${x.basis})` : 'Not recorded'; }]] as [string, (p: P) => string][])),
                ['Validation', (p: P) => (p.specs.some((s) => s.verified) ? 'Some values verified' : 'Not validated')],
                ['Communication', (p: P) => (p.interfaces?.communication ?? []).join(', ') || 'Not recorded'],
              ].map(([label, f]) => (
                <tr key={label as string}>
                  <th scope="row" className="px-2.5 py-1.5 text-left font-medium text-ink-2">
                    {label as string}
                  </th>
                  {all.map((p) => (
                    <td key={p.id} className="text-micro">
                      {(f as (p: P) => string)(p)}
                    </td>
                  ))}
                </tr>
              ))}
              {keys.map((k) => (
                <tr key={k}>
                  <th scope="row" className="px-2.5 py-1.5 text-left font-medium text-ink-2">
                    {eng.defs.get(k)?.name ?? k}
                  </th>
                  {all.map((p) => (
                    <td key={p.id} className="num text-micro">
                      {displaySpec(readSpec(p, k, eng.defs))}
                    </td>
                  ))}
                </tr>
              ))}
            </Table>
          </Card>
        );
      })}
    </div>
  );
}
