import { Stat } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import type { Simulation } from '../../domain/engineering';
import { useData } from '../../hooks/useData';

/**
 * HOME KPIs (industrial intelligence master prompt §160): every tile is a count of real records and
 * opens the records behind it. Nothing is typed in.
 */
export function EngineeringKpis() {
  const { records } = useData();
  const by = (e: string) => records.filter((r) => r.entity === e) as (AnyRecord & Record<string, unknown>)[];
  const products = by('product');
  const sims = by('simulation') as unknown as (Simulation & AnyRecord)[];
  const openStage = (o: Record<string, unknown>) => !['Won', 'Lost', 'Closed Won', 'Closed Lost', 'On Hold'].includes(String(o.stage));
  const locs = by('localization');
  const tiles: { label: string; value: number | string; sub?: string; to: string; tone?: 'warn' | 'bad' | 'ok' }[] = [
    { label: 'Active products', value: products.filter((p) => ['Product', 'Platform', 'Scale'].includes(String(p.maturity))).length, sub: `of ${products.length} platforms`, to: '/products' },
    { label: 'Products under development', value: products.filter((p) => ['Idea', 'Concept', 'POC', 'Prototype', 'Pilot'].includes(String(p.maturity))).length, to: '/development' },
    { label: 'Customer POCs', value: by('poc').filter((p) => !['Complete', 'Cancelled'].includes(String(p.poc_status))).length, sub: 'open', to: '/poc' },
    { label: 'Active projects', value: by('project').filter((p) => p.status !== 'Closed' && p.status !== 'Cancelled').length, to: '/projects' },
    { label: 'Open requirements', value: by('requirement').filter((r) => !['Closed', 'Verified', 'Cancelled'].includes(String(r.status ?? ''))).length, to: '/requirements-quality' },
    { label: 'Simulation scenarios', value: sims.length, sub: `${sims.filter((s) => (s.actuals ?? []).length).length} calibrated`, to: '/studio' },
    { label: 'Equipment readiness', value: sims.filter((s) => Object.keys(s.readiness ?? {}).length).length, sub: 'scenarios assessed', to: '/studio?focus=review' },
    { label: 'Critical risks', value: by('risk').filter((r) => r.risk_status !== 'Closed' && Number(r.severity ?? 0) >= 8).length, to: '/execution?view=risks', tone: 'warn' },
    { label: 'Supplier risks', value: by('supplier').filter((s) => s.supplier_risk === 'High').length, sub: 'high', to: '/supplier-risk' },
    { label: 'Technology gaps', value: by('technology').filter((t) => (t as { trl?: number | null }).trl == null).length, sub: 'TRL not assessed', to: '/technology' },
    { label: 'Localization items', value: locs.length, to: '/localization' },
    { label: 'Pipeline', value: by('opportunity').filter(openStage).length, sub: 'open opportunities', to: '/opportunities' },
  ];
  return (
    <section aria-label="Engineering operating system at a glance" className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
      {tiles.map((t) => (
        <Stat key={t.label} label={t.label} value={t.value} sub={t.sub} to={t.to} tone={t.tone && Number(t.value) > 0 ? t.tone : undefined} />
      ))}
    </section>
  );
}
