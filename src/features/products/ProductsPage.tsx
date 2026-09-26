import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/badges';
import { Button, Card, PageHeader } from '../../components/ui';
import type { Product, ProductFamily } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';

const inr = (v: number | null) => (v == null ? 'UNKNOWN' : `₹ ${(v / 1e5).toLocaleString('en-IN', { maximumFractionDigits: 1 })} L`);

/** Product family → product (platform) → variant → customer configuration (spec §107). */
export default function ProductsPage() {
  const fams = useRecords<ProductFamily>('product_family');
  const prods = useRecords<Product>('product');
  const configs = useRecords('configuration');
  return (
    <div>
      <PageHeader
        eyebrow="Products"
        title="TEAL product portfolio"
        subtitle="Family → platform → variant → customer configuration. Specifications from the TEAL Laser Automation Solutions catalogue (2026) via the legacy configurator; base prices are parametric ESTIMATES."
        actions={
          <>
            <Link to="/configurator">
              <Button variant="primary">Configure</Button>
            </Link>
            <Link to="/inquiry">
              <Button>Product from inquiry</Button>
            </Link>
          </>
        }
      />
      <div className="space-y-3">
        {fams.map((f) => (
          <Card key={f.id} title={`${f.name} — ${f.segment}`} actions={<span className="text-[11px] text-ink-3">Catalogue ch. {f.chapter}</span>}>
            <p className="mb-2 text-ink-2">{f.description}</p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {prods
                .filter((p) => p.family_id === f.id)
                .map((p) => (
                  <Link key={p.id} to={`/record/${p.id}`} className="rounded-md border border-line p-2 hover:border-accent">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold">{p.name}</span>
                      <StatusBadge s={p.maturity} />
                    </div>
                    <div className="text-[12px] text-ink-2">{p.title}</div>
                    <div className="mt-1 text-[11px] text-ink-3">
                      {p.delivery} · {p.source_keys.join('/')} · {p.applications.length} applications · from {inr(p.base_price_inr)} est. · {configs.filter((c) => (c as { product_id?: string }).product_id === p.id).length} configurations
                    </div>
                  </Link>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
