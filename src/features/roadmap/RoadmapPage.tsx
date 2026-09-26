import { Link } from 'react-router-dom';
import { DataTypeBadge } from '../../components/badges';
import { Card, PageHeader } from '../../components/ui';
import { MATURITY_STAGES, type Opportunity, type Product } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';

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
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Roadmap" title="Product roadmap" subtitle="Idea → opportunity → research → feasibility → POC → concept → prototype → pilot → product → platform → scale. “Most equipment companies stall between pilot and productization.” (Automation Handbook §59.3). Track owner, investment, revenue signal, technology gap, customer signal, dependencies, risk and milestones on each item." />
      <div className="flex gap-2 overflow-x-auto pb-2">
        {ROADMAP_STAGES.map((s) => {
          const items = place(s);
          return (
            <section key={s} aria-label={s} className="w-52 shrink-0 rounded-lg border border-line bg-panel-2">
              <header className="flex justify-between border-b border-line px-2 py-1.5 text-[11.5px] font-semibold uppercase text-ink-2">
                {s} <span className="num">{items.length}</span>
              </header>
              <ul className="space-y-1 p-1.5">
                {items.map((i) => (
                  <li key={i.id} className="rounded border border-line bg-panel p-1.5 text-[12px]">
                    <Link className="text-accent-2 hover:underline" to={`/record/${encodeURIComponent(i.id)}`}>
                      {i.name}
                    </Link>
                    <div className="mt-0.5 flex gap-1 text-[10.5px] text-ink-3">
                      {i.type} <DataTypeBadge t={i.data_type} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <Card title="Maturity scale used for products (spec §108)">
        <p className="text-ink-2">{MATURITY_STAGES.join(' → ')}. Catalogue platforms are “Product” (listed in the 2026 catalogue); change maturity by editing the product record through a reviewed data commit.</p>
      </Card>
    </div>
  );
}
