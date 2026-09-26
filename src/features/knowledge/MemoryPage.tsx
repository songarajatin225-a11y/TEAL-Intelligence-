import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, Input, Loading, PageHeader } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { useData } from '../../hooks/useData';
import { search, type Hit } from '../../services/search';
import { findSimilar } from '../../services/similarity';
import { RecordLink } from '../../components/RecordLink';
import { DataTypeBadge } from '../../components/badges';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { HitRow } from './SearchPage';

const MEMORY_ENTITIES = ['poc', 'product', 'machine', 'module', 'application', 'supplier', 'lesson', 'configuration', 'project', 'service_ticket', 'doe'];

/** ENGINEERING MEMORY (spec §79, §145): “Have we solved this before?” */
export default function MemoryPage() {
  const { records } = useData();
  const [q, setQ] = useState('');
  const [asked, setAsked] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const locals = useMemo(() => records.filter((r) => r.__origin !== 'MASTER'), [records]);
  useEffect(() => {
    if (!asked) return;
    setHits(null);
    search({ text: asked, limit: 200 }, locals)
      .then(setHits)
      .catch(() => setHits([]));
  }, [asked, locals]);
  const similar = useMemo(() => {
    if (!asked) return [];
    const probe = { id: 'x-probe', entity: 'probe', name: asked, description: asked, data_type: 'USER_CREATED', provenance: { verification_status: 'DRAFT' } } as unknown as AnyRecord;
    return findSimilar(probe, records.filter((r) => MEMORY_ENTITIES.includes(r.entity)), { limit: 25, min: 0.03 });
  }, [asked, records]);
  const group = (list: Hit[]) => {
    const m = new Map<string, Hit[]>();
    for (const h of list) {
      const k = h.entity === 'knowledge' ? 'Handbook knowledge' : (ENTITY_BY_TYPE[h.entity]?.plural ?? h.entity);
      m.set(k, [...(m.get(k) ?? []), h]);
    }
    return [...m.entries()];
  };
  return (
    <div>
      <PageHeader eyebrow="Knowledge" title="Engineering Memory" subtitle="Have we solved this before? Searches POCs, products, machines, modules, applications, suppliers, lessons, projects and the handbooks — then ranks structurally similar TEAL assets." />
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setAsked(q.trim());
        }}
      >
        <Input aria-label="Describe the problem" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. copper busbar welding spatter, 2D code on mould compound, UV cutting of polyimide…" className="max-w-2xl flex-1" />
        <Button type="submit" variant="primary">
          Ask
        </Button>
      </form>
      {!asked ? (
        <EmptyState title="Describe the engineering problem" explain="The answer is only as good as the memory: lessons, POC results and field records must be captured for this to grow. Nothing is invented." />
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <Card title="Similar TEAL assets (structural + terms)">
            {similar.length ? (
              <ul>
                {similar.map((h) => (
                  <li key={h.record.id} className="border-b border-line/60 py-1">
                    <span className="num mr-2 text-micro text-ink-3">{(h.score * 100).toFixed(0)}%</span>
                    <span className="mr-1 text-micro text-ink-3">{ENTITY_BY_TYPE[h.record.entity]?.label}</span>
                    <RecordLink id={h.record.id} /> <DataTypeBadge t={h.record.data_type} />
                    <div className="pl-8 text-meta text-ink-3">{h.reasons.join(' · ')}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-3">No similar TEAL asset on record.</p>
            )}
          </Card>
          <Card title="Search results by kind">
            {!hits ? (
              <Loading />
            ) : hits.length ? (
              group(hits).map(([k, list]) => (
                <div key={k} className="mb-2">
                  <div className="text-micro font-semibold uppercase text-ink-3">
                    {k} ({list.length})
                  </div>
                  <ul>
                    {list.slice(0, 8).map((h) => (
                      <HitRow key={h.id} h={h} q={asked} />
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-ink-3">Nothing found.</p>
            )}
            <Link className="text-meta text-accent-2" to={`/search?q=${encodeURIComponent(asked)}`}>
              Open full search →
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
