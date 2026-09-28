import { ArrowUpRight, Boxes, BookOpen, Factory, Layers, Network, Plus, Workflow } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StatusBadge } from '../../components/badges';
import { EntityForm } from '../../components/EntityForm';
import { recordPath } from '../../components/RecordLink';
import { TrustBadge } from '../../components/TrustBadge';
import { Badge, Button, buttonClass, Card, Chain, Drawer, EmptyState, Notice, PageHeader, Table } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import type { Application, Domain, Equipment, Product } from '../../domain/entities';
import { useData } from '../../hooks/useData';

const slug = (id: string) => id.replace(/^dom-/, '');
export const domainPath = (d: Pick<Domain, 'id'>) => `/domains/${slug(d.id)}`;

function Chips({ items, hrefFor }: { items: string[]; hrefFor?: (x: string) => string | undefined }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((x) => {
        const to = hrefFor?.(x);
        return (
          <li key={x}>
            {to ? (
              <Link to={to} className="inline-block rounded-full border border-line-strong bg-solid/60 px-2.5 py-0.5 text-meta hover:border-accent hover:text-accent-2">
                {x}
              </Link>
            ) : (
              <span className="inline-block rounded-full border border-line bg-ink/[0.03] px-2.5 py-0.5 text-meta">{x}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * DOMAIN HUB (final master prompt §04–§13): one generic page renders every domain from its record —
 * lifecycle, taxonomies, laser applications (linked to TEAL application records where they exist),
 * TEAL platforms, work in the domain, technologies and the equipment database.
 */
export default function DomainPage() {
  const { id = '' } = useParams();
  const { records, byId } = useData();
  const d = (byId.get(`dom-${id}`) ?? byId.get(id)) as (Domain & AnyRecord) | undefined;
  const [adding, setAdding] = useState(false);

  const view = useMemo(() => {
    if (!d) return null;
    const ind = new Set(d.industry_ids ?? []);
    const industryNames = records.filter((r) => r.entity === 'industry' && ind.has(r.id)).map((r) => ((r as { code?: string }).code ?? r.name).toLowerCase());
    const apps = (records.filter((r) => r.entity === 'application') as unknown as Application[]).filter((a) => (a.industries ?? []).some((i) => industryNames.some((n) => i.toLowerCase().startsWith(n.split(' ')[0]))));
    const products = (records.filter((r) => r.entity === 'product') as unknown as (Product & AnyRecord)[]).filter((p) => (p.industries ?? []).some((i) => ind.has(i)));
    // an explicit domain_id wins; otherwise whole-word keyword match on name and industry
    const work = records.filter((r) => {
      if (!['opportunity', 'project', 'poc'].includes(r.entity)) return false;
      const dom = (r as { domain_id?: string }).domain_id;
      if (dom) return dom === d.id;
      return d.keywords.some((k) => new RegExp(`\\b${k}\\b`, 'i').test(`${r.name} ${(r as { industry?: string }).industry ?? ''}`));
    });
    const equipment = records.filter((r) => r.entity === 'equipment' && (r as unknown as Equipment).domain_id === d.id) as unknown as (Equipment & AnyRecord)[];
    const articles = records.filter((r) => r.entity === 'article' && (r as { domain_id?: string }).domain_id === d.id);
    const techs = (d.technology_ids ?? []).map((t) => byId.get(t)).filter((x): x is NonNullable<typeof x> => !!x);
    return { apps, products, work, equipment, articles, techs };
  }, [d, records, byId]);

  if (!d || !view)
    return (
      <EmptyState
        title="Domain not found"
        explain={`No domain “${id}”. Domains are records in /data/domains.`}
        actions={
          <Link to="/domains" className={buttonClass('primary')}>
            All domains
          </Link>
        }
      />
    );

  const appFor = (name: string) => {
    const n = name.toLowerCase().replace(/^laser /, '');
    const key = n.split(' ').find((w) => w.length > 4) ?? n;
    return view.apps.some((a) => `${a.process} ${a.name}`.toLowerCase().includes(key)) ? `/search?q=${encodeURIComponent(`${name} entity:application`)}` : undefined;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={d.name}
        subtitle={d.summary}
        actions={
          <>
            <TrustBadge record={d} />
            {d.hub_route && (
              <Link to={d.hub_route} className={buttonClass('secondary')}>
                <ArrowUpRight className="size-4" aria-hidden /> Open {d.hub_route === '/architecture' ? 'Architecture builder' : `${d.name} workspace`}
              </Link>
            )}
            <Link to={`/solution?domain=${slug(d.id)}`} className={buttonClass('primary')}>
              <Workflow className="size-4" aria-hidden /> Application engine
            </Link>
          </>
        }
      />
      {!d.lifecycle.length && !d.sections.length && <Notice tone="info">This domain’s taxonomy is not defined yet. Add sections to its record in /data/domains — the page renders them without a code change.</Notice>}

      {d.lifecycle.length > 0 && (
        <Card title="Manufacturing lifecycle" icon={Workflow} edge>
          <Chain label={`${d.name} lifecycle`} steps={d.lifecycle.map((s) => ({ label: s }))} />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {d.sections.map((s) => (
          <Card key={s.title} title={s.title} description={`${s.items.length} ${s.kind === 'flow' ? 'steps' : 'entries'}`}>
            {s.kind === 'flow' ? <Chain label={s.title} steps={s.items.map((x) => ({ label: x }))} /> : <Chips items={s.items} hrefFor={/laser applications/i.test(s.title) ? appFor : undefined} />}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="TEAL platforms for this domain" icon={Boxes} description="Catalogue platforms whose industries include this domain">
          {view.products.length ? (
            <ul className="space-y-1">
              {view.products.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <Link to={recordPath(p.id)} className="font-medium text-accent-2 hover:underline">
                    {p.name}
                  </Link>
                  <span className="truncate text-micro text-ink-3">{p.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-meta text-ink-3">No catalogue platform is tagged with this domain’s industries.</p>
          )}
          {view.apps.length > 0 && <p className="mt-3 text-micro text-ink-3">{view.apps.length} TEAL application records apply to this domain’s industries.</p>}
        </Card>
        <Card title="Technologies" icon={Network}>
          {view.techs.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {view.techs.map((t) => (
                <li key={t.id}>
                  <Link to={recordPath(t.id)} className="inline-block rounded-full border border-line-strong px-2.5 py-0.5 text-meta hover:border-accent hover:text-accent-2">
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-meta text-ink-3">No technologies linked yet.</p>
          )}
          <Link to="/cross-domain" className="mt-3 inline-block text-meta text-accent-2 hover:underline">
            Cross-domain map →
          </Link>
        </Card>
        <Card title="Work in this domain" icon={Layers} description="Opportunities, projects and POCs">
          {view.work.length ? (
            <ul className="space-y-1">
              {view.work.slice(0, 10).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <Link to={recordPath(r.id)} className="truncate text-accent-2 hover:underline">
                    {r.name}
                  </Link>
                  <StatusBadge s={((r as { stage?: string; poc_status?: string; status?: string }).stage ?? (r as { poc_status?: string }).poc_status) as string | undefined} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-meta text-ink-3">No opportunities, projects or POCs in this domain yet.</p>
          )}
        </Card>
      </div>

      {d.equipment_fields.length > 0 && (
        <Card
          title="Equipment database"
          icon={Factory}
          description={`Tracks: ${d.equipment_fields.join(', ')}`}
          actions={
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="size-3.5" aria-hidden /> Add equipment
            </Button>
          }
        >
          {view.equipment.length ? (
            <div className="scroll-thin overflow-x-auto" tabIndex={0}>
              <Table head={['Equipment', 'Process', 'Throughput', 'Accuracy', 'Supplier', 'CAPEX', 'Trust']} dense>
                {view.equipment.map((e) => (
                  <tr key={e.id} className="border-t border-line/60">
                    <td>
                      <Link to={recordPath(e.id)} className="text-accent-2 hover:underline">
                        {e.name}
                      </Link>
                    </td>
                    <td>{e.process ?? '—'}</td>
                    <td>{e.throughput ?? 'UNKNOWN'}</td>
                    <td>{e.accuracy ?? 'UNKNOWN'}</td>
                    <td>{e.supplier_id ? byId.get(e.supplier_id)?.name ?? e.supplier_id : '—'}</td>
                    <td className="num">{e.capex != null ? `${e.currency ?? ''} ${e.capex.toLocaleString('en-IN')}` : 'UNKNOWN'}</td>
                    <td>
                      <TrustBadge record={e} />
                    </td>
                  </tr>
                ))}
              </Table>
            </div>
          ) : (
            <p className="text-meta text-ink-3">No equipment recorded for this domain. Add entries from official datasheets — values you don’t have stay UNKNOWN.</p>
          )}
        </Card>
      )}

      <Card title="Knowledge" icon={BookOpen}>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/search?q=${encodeURIComponent(d.keywords.slice(0, 3).join(' '))}`} className={buttonClass('secondary', 'sm')}>
            Search handbooks for {d.keywords.slice(0, 3).join(', ')}
          </Link>
          <Link to={`/ask?q=${encodeURIComponent(d.name)}`} className={buttonClass('secondary', 'sm')}>
            Ask about {d.name}
          </Link>
          {view.articles.map((a) => (
            <Link key={a.id} to={recordPath(a.id)} className="text-meta text-accent-2 hover:underline">
              {a.name}
            </Link>
          ))}
          <Badge>{view.articles.length} articles</Badge>
        </div>
      </Card>

      <Drawer open={adding} onClose={() => setAdding(false)} title={`Add equipment — ${d.name}`} subtitle="Saved as a local draft. Enter only sourced values." wide>
        {adding && <EntityForm entity="equipment" preset={{ domain_id: d.id }} onCancel={() => setAdding(false)} onSaved={() => setAdding(false)} />}
      </Drawer>
    </div>
  );
}
