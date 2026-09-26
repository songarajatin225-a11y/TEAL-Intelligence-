import { ChevronRight, Layers } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { TrustBadge } from '../../components/TrustBadge';
import { Badge, buttonClass, Card, EmptyState, Loading, Notice, PageHeader, Select } from '../../components/ui';
import type { Configuration, Product } from '../../domain/entities';
import { useData, useEngine, useRecords } from '../../hooks/useData';
import { productArchitecture } from '../../services/architecture';
import { stateFromConfiguration } from '../configurator/ConfiguratorPage';

const money = (v: number | null, cur: string) => (v == null ? 'UNKNOWN' : `${cur} ${Math.round(v).toLocaleString('en-IN')}`);

/**
 * ENGINEERING DRILL-DOWN (final master prompt §15, §59): Product → System → Subsystem → Module →
 * Component → Specification → Supplier → Cost, for a platform’s standard configuration or a saved one.
 */
export default function ProductArchitecturePage() {
  const { records, status } = useData();
  const e = useEngine();
  const products = useRecords<Product>('product');
  const configs = useRecords<Configuration>('configuration');
  const [params, setParams] = useSearchParams();
  const cfg = configs.find((c) => c.id === params.get('cfg'));
  const productKey = cfg ? cfg.product_id.replace(/^prd-/, '') : (params.get('product') ?? products[0]?.key ?? '');
  const product = products.find((p) => p.key === productKey);
  const tree = useMemo(() => {
    if (!e || !product || !e.products.has(product.key)) return null;
    const s = cfg ? stateFromConfiguration(cfg) : e.initialState(product.key);
    return productArchitecture(e, s, records);
  }, [e, product, cfg, records]);

  if (status === 'loading' || !e) return <Loading />;
  const counts = tree ? { sys: tree.length, sub: tree.reduce((a, s) => a + s.subsystems.length, 0), mod: tree.reduce((a, s) => a + s.subsystems.reduce((b, x) => b + x.modules.length, 0), 0) } : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Product Architecture"
        subtitle="Every product decomposes into systems, subsystems, modules and components — with specification, supplier and cost at the leaves. The same hierarchy powers BOM, costing, supplier selection, localization and projects."
        actions={
          <Link to={cfg ? `/architecture?cfg=${cfg.id}` : '/architecture'} className={buttonClass('secondary')}>
            Architecture canvas
          </Link>
        }
      />
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-meta font-medium text-ink-2">
          Product (standard configuration)
          <Select value={cfg ? '' : productKey} onChange={(ev) => setParams({ product: ev.target.value })} className="w-64">
            {cfg && <option value="">—</option>}
            {products.map((p) => (
              <option key={p.id} value={p.key}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-meta font-medium text-ink-2">
          …or a saved configuration
          <Select value={cfg?.id ?? ''} onChange={(ev) => setParams(ev.target.value ? { cfg: ev.target.value } : { product: productKey })} className="w-72">
            <option value="">—</option>
            {configs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>
      </div>
      {!tree ? (
        <EmptyState title="No architecture" explain="This product has no configurator definition." />
      ) : (
        <>
          <Notice tone="info">
            {product?.name}: {counts!.sys} systems · {counts!.sub} subsystems · {counts!.mod} modules. Component-master prices and vendors are shown with their trust label — most are DEMO seed values from the legacy cost platform, not quotations.
          </Notice>
          <Card title={product?.name ?? 'Product'} icon={Layers} edge>
            <ul className="space-y-2" aria-label="Architecture tree">
              {tree.map((sys) => (
                <li key={sys.name}>
                  <details open className="group rounded-control border border-line">
                    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 font-semibold">
                      <ChevronRight className="size-4 transition-transform group-open:rotate-90" aria-hidden />
                      {sys.name}
                      <Badge className="ml-auto">System</Badge>
                    </summary>
                    <ul className="space-y-1.5 px-3 pb-3 pl-8">
                      {sys.subsystems.map((sub) => (
                        <li key={sub.type}>
                          <details className="group/sub">
                            <summary className="flex cursor-pointer items-center gap-2 py-1 text-body font-medium">
                              <ChevronRight className="size-3.5 transition-transform group-open/sub:rotate-90" aria-hidden />
                              {sub.type}
                              <span className="text-micro text-ink-3">subsystem · {sub.modules.length} module(s)</span>
                            </summary>
                            <ul className="space-y-2 pl-6">
                              {sub.modules.map((m) => (
                                <li key={m.id} className="rounded-control bg-ink/[0.03] p-2">
                                  <div className="flex items-center gap-2 text-meta font-medium">
                                    {m.moduleId ? (
                                      <Link to={recordPath(m.moduleId)} className="text-accent-2 hover:underline">
                                        {m.name}
                                      </Link>
                                    ) : (
                                      m.name
                                    )}
                                    <span className="text-micro text-ink-3">module</span>
                                  </div>
                                  {m.components.length ? (
                                    <table className="mt-1 w-full text-micro">
                                      <thead>
                                        <tr className="text-left text-ink-3">
                                          <th className="font-medium">Component</th>
                                          <th className="font-medium">Specification</th>
                                          <th className="font-medium">Supplier</th>
                                          <th className="font-medium">Cost</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {m.components.map((c) => (
                                          <tr key={c.id} className="border-t border-line/50 align-top">
                                            <td className="py-0.5 pr-2">{c.record ? <Link to={recordPath(c.id)} className="text-accent-2 hover:underline">{c.name}</Link> : c.name}</td>
                                            <td className="pr-2 text-ink-2">{c.spec ?? '—'}</td>
                                            <td className="pr-2">{c.supplier ? c.supplier.id ? <Link to={recordPath(c.supplier.id)} className="hover:underline">{c.supplier.name}</Link> : c.supplier.name : 'UNKNOWN'}</td>
                                            <td className="num whitespace-nowrap">
                                              {money(c.cost, c.currency)} <Badge>{c.basis}</Badge> {c.record && <TrustBadge record={c.record} />}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <p className="mt-1 text-micro text-ink-3">No components recorded for this module.</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </details>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
