import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DataTypeBadge } from '../../components/badges';
import { EntityForm } from '../../components/EntityForm';
import { TrustBadge } from '../../components/TrustBadge';
import { Badge, Button, Card, Drawer, PageHeader, Tabs } from '../../components/ui';
import { MATURITY_STAGES, ROADMAP_YEARS, type Opportunity, type Product, type Project, type RoadmapItem } from '../../domain/entities';
import { useData, useRecords } from '../../hooks/useData';

/** TECHNOLOGY ROADMAP 2026 → 2030+ (final master prompt §29): roadmap items plus project end dates. */
function YearRoadmap() {
  const items = useRecords<RoadmapItem>('roadmap_item');
  const projects = useRecords<Project>('project');
  const { byId } = useData();
  const [adding, setAdding] = useState(false);
  const yearOf = (d?: string) => (!d ? null : Number(d.slice(0, 4)) >= 2030 ? '2030+' : d.slice(0, 4));
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-3xl text-meta text-ink-2">Technology, product and capability milestones by year, with TRL target, suppliers, localization, investment and target market. Items are TEAL’s own plan (added here as local drafts); project end dates are placed automatically.</p>
        <Button variant="primary" onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden /> Add roadmap item
        </Button>
      </div>
      <div className="scroll-thin flex gap-3 overflow-x-auto pb-2" role="list" aria-label="Roadmap by year">
        {ROADMAP_YEARS.map((y) => {
          const here = items.filter((i) => i.year === y);
          const proj = projects.filter((p) => yearOf(p.end) === y);
          return (
            <section key={y} role="listitem" aria-label={`${y}: ${here.length + proj.length}`} className="surface w-72 shrink-0 rounded-card p-3">
              <h2 className="mb-2 text-section font-semibold">{y}</h2>
              <ul className="space-y-2">
                {here.map((i) => (
                  <li key={i.id} className="rounded-control border border-line p-2 text-meta">
                    <Link to={`/record/${encodeURIComponent(i.id)}`} className="font-medium text-accent-2 hover:underline">
                      {i.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge>{i.kind}</Badge>
                      {i.trl_target != null && <Badge tone="accent">TRL → {i.trl_target}</Badge>}
                      <TrustBadge record={i} />
                    </div>
                    <dl className="mt-1 grid grid-cols-[6rem_1fr] gap-x-2 text-micro text-ink-3">
                      {i.technology_id && (<><dt>Technology</dt><dd>{byId.get(i.technology_id)?.name ?? i.technology_id}</dd></>)}
                      {i.product_id && (<><dt>Product</dt><dd>{byId.get(i.product_id)?.name ?? i.product_id}</dd></>)}
                      {i.capability && (<><dt>Capability</dt><dd>{i.capability}</dd></>)}
                      <dt>Investment</dt><dd>{i.investment != null ? `${i.currency ?? ''} ${i.investment.toLocaleString('en-IN')}` : 'UNKNOWN'}</dd>
                      {i.target_market && (<><dt>Market</dt><dd>{i.target_market}</dd></>)}
                      {i.milestone && (<><dt>Milestone</dt><dd>{i.milestone}</dd></>)}
                      {i.localization && (<><dt>Localization</dt><dd>{i.localization}</dd></>)}
                    </dl>
                  </li>
                ))}
                {proj.map((p) => (
                  <li key={p.id} className="rounded-control border border-dashed border-line p-2 text-meta">
                    <Link to={`/record/${encodeURIComponent(p.id)}`} className="text-accent-2 hover:underline">
                      {p.name}
                    </Link>
                    <div className="text-micro text-ink-3">project ends {p.end}</div>
                  </li>
                ))}
                {!here.length && !proj.length && <li className="text-micro text-ink-3">Nothing planned.</li>}
              </ul>
            </section>
          );
        })}
      </div>
      <Drawer open={adding} onClose={() => setAdding(false)} title="New roadmap item" subtitle="Saved as a local draft." wide>
        {adding && <EntityForm entity="roadmap_item" onCancel={() => setAdding(false)} onSaved={() => setAdding(false)} />}
      </Drawer>
    </>
  );
}

const ROADMAP_STAGES = ['Idea', 'Opportunity', 'Research', 'Feasibility', 'POC', 'Concept', 'Prototype', 'Pilot', 'Product', 'Platform', 'Scale'] as const;

/** PRODUCT ROADMAP (spec §59, §108): idea → scale, with the handbook's roadmap stages. */
export default function RoadmapPage() {
  const products = useRecords<Product>('product');
  const opps = useRecords<Opportunity>('opportunity');
  const pocs = useRecords('poc');
  const place = (stage: string) => {
    const items: { id: string; name: string; type: string; data_type: string }[] = [];
    for (const p of products) if ((p.maturity ?? 'Product') === stage) items.push({ id: p.id, name: p.name, type: 'product', data_type: p.data_type });
    if (stage === 'Opportunity') for (const o of opps.filter((x) => ['Lead', 'Discovery', 'Requirement'].includes(x.stage))) items.push({ id: o.id, name: o.name, type: 'opportunity', data_type: o.data_type });
    if (stage === 'Feasibility') for (const o of opps.filter((x) => x.stage === 'Feasibility')) items.push({ id: o.id, name: o.name, type: 'opportunity', data_type: o.data_type });
    if (stage === 'POC') for (const p of pocs) items.push({ id: p.id, name: p.name, type: 'poc', data_type: p.data_type });
    return items;
  };
  const [params, setParams] = useSearchParams();
  const tab = params.get('view') === 'stages' ? 'stages' : 'years';
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Roadmap" title="Roadmap" subtitle="Idea → opportunity → research → feasibility → POC → concept → prototype → pilot → product → platform → scale. “Most equipment companies stall between pilot and productization.” (Automation Handbook §59.3). Track owner, investment, revenue signal, technology gap, customer signal, dependencies, risk and milestones on each item." />
      <Tabs<'years' | 'stages'> label="Roadmap views" value={tab} onChange={(t) => setParams(t === 'years' ? {} : { view: t })} tabs={[{ key: 'years', label: '2026 → 2030+' }, { key: 'stages', label: 'Idea → Scale' }]} />
      {tab === 'years' ? <YearRoadmap /> : (<>
      <div className="flex gap-2 overflow-x-auto pb-2" tabIndex={0}>
        {ROADMAP_STAGES.map((s) => {
          const items = place(s);
          return (
            <section key={s} aria-label={s} className="w-52 shrink-0 rounded-lg border border-line bg-panel-2">
              <header className="flex justify-between border-b border-line px-2 py-1.5 text-meta font-semibold uppercase text-ink-2">
                {s} <span className="num">{items.length}</span>
              </header>
              <ul className="space-y-1 p-1.5">
                {items.map((i) => (
                  <li key={i.id} className="rounded border border-line bg-panel p-1.5 text-meta">
                    <Link className="text-accent-2 hover:underline" to={`/record/${encodeURIComponent(i.id)}`}>
                      {i.name}
                    </Link>
                    <div className="mt-0.5 flex gap-1 text-micro text-ink-3">
                      {i.type} <DataTypeBadge t={i.data_type} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      </>)}
      <Card title="Maturity scale used for products (spec §108)">
        <p className="text-ink-2">{MATURITY_STAGES.join(' → ')}. Catalogue platforms are “Product” (listed in the 2026 catalogue); change maturity by editing the product record through a reviewed data commit.</p>
      </Card>
    </div>
  );
}
