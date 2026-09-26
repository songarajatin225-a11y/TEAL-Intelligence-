import { Gauge, Layers, Network, Repeat2 } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, PageHeader, Stat } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { MATURITY_STAGES, type Configuration, type Domain, type Product } from '../../domain/entities';
import { useData } from '../../hooks/useData';
import { LIFECYCLE_STAGES, lifecycleFor } from '../../services/lifecycle';
import { isActive } from '../../services/nextAction';

function Bars({ rows, label }: { rows: { name: string; value: number; to?: string }[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-1.5" aria-label={label}>
      {rows.map((r) => (
        <li key={r.name} className="grid grid-cols-[10rem_1fr_2.5rem] items-center gap-2 text-meta">
          <span className="truncate">{r.to ? <Link to={r.to} className="hover:text-accent-2 hover:underline">{r.name}</Link> : r.name}</span>
          <span className="h-2 overflow-hidden rounded-full bg-ink/[0.06]" aria-hidden>
            <span className="block h-full rounded-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
          <span className="num text-right">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * BUSINESS VALUE (final master prompt §57): what the platform holds, how much is reused, how many
 * domains it covers and where products stand — counts of records, nothing estimated.
 */
export default function ValuePage() {
  const { records, graph } = useData();
  const v = useMemo(() => {
    const by = (e: string) => records.filter((r) => r.entity === e);
    const products = by('product') as unknown as (Product & AnyRecord)[];
    const configs = by('configuration') as unknown as Configuration[];
    const domains = by('domain') as unknown as Domain[];
    // reuse: a laser class / module / material used by two or more platforms or configurations
    const count = (keys: string[][]) => {
      const m = new Map<string, number>();
      for (const ks of keys) for (const k of new Set(ks)) m.set(k, (m.get(k) ?? 0) + 1);
      return m;
    };
    const srcUse = count(products.map((p) => p.source_keys ?? []));
    const modUse = count([...products.map((p) => p.standard_content ?? []), ...configs.map((c) => [...c.modules, ...c.extras])]);
    const matUse = count(products.map((p) => (p.applications ?? []).map((a) => a.material_key ?? '').filter(Boolean)));
    const dev = records.filter((r) => (r.entity === 'opportunity' || r.entity === 'project') && isActive(r)).map((r) => lifecycleFor(graph, r.id).current ?? 'Commercialization');
    return {
      metrics: [
        ['Technology records', by('technology').length, '/technology'],
        ['Supplier records', by('supplier').length, '/suppliers'],
        ['Product concepts', products.length + configs.length, '/products'],
        ['Applications', by('application').length, '/applications'],
        ['Active projects', by('project').filter(isActive).length, '/projects'],
        ['POCs', by('poc').length, '/poc'],
        ['BOMs', by('bom').length, '/bom'],
        ['Cost models', by('cost_model').length, '/cost'],
        ['Localization opportunities', by('localization').filter((l) => ['LOCALIZE', 'DEVELOP', 'PARTNER'].includes(String((l as { classification?: string }).classification))).length, '/localization'],
        ['Knowledge articles', by('article').length, '/articles'],
      ] as [string, number, string][],
      reuse: [
        { name: 'Laser source classes', reused: [...srcUse.values()].filter((n) => n >= 2).length, of: srcUse.size, detail: 'offered on 2+ platforms' },
        { name: 'Modules', reused: [...modUse.values()].filter((n) => n >= 2).length, of: modUse.size, detail: 'used by 2+ platforms or configurations' },
        { name: 'Materials', reused: [...matUse.values()].filter((n) => n >= 2).length, of: matUse.size, detail: 'served by 2+ platforms' },
      ],
      coverage: domains
        .sort((a, b) => a.order - b.order)
        .map((d) => ({ d, taxonomy: d.sections.reduce((s, x) => s + x.items.length, 0), platforms: products.filter((p) => (p.industries ?? []).some((i) => (d.industry_ids ?? []).includes(i))).length })),
      maturity: MATURITY_STAGES.map((s) => ({ name: s, value: products.filter((p) => (p.maturity ?? 'Product') === s).length })),
      lifecycle: LIFECYCLE_STAGES.map((s) => ({ name: s, value: dev.filter((x) => x === s).length, to: '/development' })).filter((x) => x.value > 0),
    };
  }, [records, graph]);

  return (
    <div className="space-y-5">
      <PageHeader title="Business Value" subtitle="What TEAL Intelligence holds today, how much is reused across products, how many domains it covers, and where products stand. Counts of records — nothing estimated." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {v.metrics.map(([l, n, to]) => (
          <Stat key={l} label={l} value={n} to={to} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Reuse" icon={Repeat2} description="Building blocks used by more than one platform or configuration">
          <ul className="space-y-3">
            {v.reuse.map((r) => (
              <li key={r.name}>
                <div className="flex items-baseline justify-between text-meta">
                  <span className="font-medium">{r.name}</span>
                  <span className="num">
                    {r.reused} of {r.of} reused
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/[0.06]" role="meter" aria-label={`${r.name} reused`} aria-valuenow={r.reused} aria-valuemin={0} aria-valuemax={r.of}>
                  <div className="h-full rounded-full bg-ok" style={{ width: `${r.of ? (r.reused / r.of) * 100 : 0}%` }} />
                </div>
                <p className="text-micro text-ink-3">{r.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Coverage" icon={Network} description={`${v.coverage.filter((c) => c.taxonomy > 0).length} of ${v.coverage.length} domains have a defined taxonomy`}>
          <ul className="space-y-1.5 text-meta">
            {v.coverage.map(({ d, taxonomy, platforms }) => (
              <li key={d.id} className="flex items-center justify-between gap-2">
                <Link to={`/domains/${d.id.replace(/^dom-/, '')}`} className="font-medium hover:text-accent-2 hover:underline">
                  {d.name}
                </Link>
                <span className="text-micro text-ink-3">
                  {taxonomy} taxonomy entries · {platforms} TEAL platforms
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Development visibility — products by maturity" icon={Layers}>
          <Bars rows={v.maturity} label="Products by maturity" />
        </Card>
        <Card title="Development visibility — work by lifecycle stage" icon={Gauge} description="Active opportunities and projects, placed by evidence">
          {v.lifecycle.length ? <Bars rows={v.lifecycle} label="Work by lifecycle stage" /> : <p className="text-meta text-ink-3">No active development.</p>}
        </Card>
      </div>
    </div>
  );
}
