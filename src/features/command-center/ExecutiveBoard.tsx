import { ArrowRight } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { Card } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { useData } from '../../hooks/useData';
import { maturityLane } from '../../services/maturity';
import { isActive } from '../../services/nextAction';

type R = AnyRecord & Record<string, unknown>;

function Panel({ title, to, items, empty, count }: { title: string; to: string; items: { id: string; name: string; note?: ReactNode }[]; empty: string; count?: number }) {
  return (
    <Card
      title={title}
      actions={
        <Link to={to} className="inline-flex items-center gap-1 text-meta text-accent-2 hover:underline" aria-label={`${title}: drill down`}>
          {count ?? items.length} <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      }
    >
      {items.length ? (
        <ul className="space-y-1">
          {items.slice(0, 4).map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-2 text-meta">
              <Link to={recordPath(i.id)} className="truncate hover:text-accent-2 hover:underline">
                {i.name}
              </Link>
              {i.note && <span className="shrink-0 text-micro text-ink-3">{i.note}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-meta text-ink-3">{empty}</p>
      )}
    </Card>
  );
}

/**
 * EXECUTIVE VIEW (final master prompt §58): the nine things a Business Head asks about, without
 * engineering detail; every panel drills down (Executive → Product → Engineering → Component).
 */
export function ExecutiveBoard() {
  const { records } = useData();
  const v = useMemo(() => {
    const by = (e: string) => records.filter((r) => r.entity === e) as R[];
    const opps = by('opportunity').filter(isActive);
    const money = (x: unknown) => (typeof x === 'number' ? x.toLocaleString('en-IN') : null);
    return {
      strategic: opps.filter((o) => o.strategic_relevance || o.market_size != null).map((o) => ({ id: o.id, name: o.name, note: String(o.strategic_relevance ?? '') || (money(o.market_size) ? `market ${money(o.market_size)}` : '') })),
      tech: by('technology').filter((t) => t.adoption === 'Adopt' || t.adoption === 'Evaluate' || t.trl != null).map((t) => ({ id: t.id, name: t.name, note: [t.adoption, t.trl != null ? `TRL ${String(t.trl)} · ${maturityLane(t as never)}` : ''].filter(Boolean).join(' · ') })),
      pipeline: by('product').filter((p) => !['Product', 'Platform', 'Scale'].includes(String(p.maturity ?? 'Product'))).map((p) => ({ id: p.id, name: p.name, note: String(p.maturity) })),
      customer: opps.map((o) => ({ id: o.id, name: o.name, note: String(o.stage) })),
      pocs: by('poc').filter(isActive).map((p) => ({ id: p.id, name: p.name, note: String(p.poc_status) })),
      invest: [...opps.filter((o) => o.investment != null).map((o) => ({ id: o.id, name: o.name, note: money(o.investment) })), ...by('roadmap_item').filter((r) => r.investment != null).map((r) => ({ id: r.id, name: r.name, note: `${String(r.year)} · ${money(r.investment)}` }))],
      local: by('localization').filter((l) => ['LOCALIZE', 'DEVELOP', 'PARTNER'].includes(String(l.classification))).map((l) => ({ id: l.id, name: l.name, note: String(l.classification) })),
      risks: by('risk').filter((r) => r.risk_status === 'Open' && ((Number(r.severity) >= 9) || (r.severity != null && r.occurrence != null && r.detection != null && Number(r.severity) * Number(r.occurrence) * Number(r.detection) >= 200))).map((r) => ({ id: r.id, name: r.name, note: `S${String(r.severity)}` })),
      decisions: by('decision').filter((d) => !d.decided_on).map((d) => ({ id: d.id, name: d.name, note: 'open' })),
    };
  }, [records]);
  return (
    <section aria-label="Executive overview" className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Panel title="Strategic opportunities" to="/opportunity-matrix" items={v.strategic} empty="No opportunity has a market size or strategic relevance recorded." />
      <Panel title="Technology priorities" to="/technology" items={v.tech} empty="No technology has a radar ring or TRL yet." />
      <Panel title="Product pipeline" to="/development" items={v.pipeline} empty="All catalogue products are released; new concepts appear here." />
      <Panel title="Customer opportunities" to="/opportunities" items={v.customer} empty="No active opportunities." />
      <Panel title="Major POCs" to="/poc" items={v.pocs} empty="No active POCs." />
      <Panel title="Investment areas" to="/roadmap" items={v.invest} empty="No investment recorded on opportunities or roadmap items." />
      <Panel title="Localization opportunities" to="/localization" items={v.local} empty="No localization item is classified Localize / Develop / Partner." />
      <Panel title="Critical risks" to="/execution?view=risks" items={v.risks} empty="No open critical risk (severity ≥ 9 or RPN ≥ 200)." />
      <Panel title="Upcoming decisions" to="/decisions" items={v.decisions} empty="No open engineering decisions." />
    </section>
  );
}
