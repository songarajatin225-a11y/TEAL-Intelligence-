import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DataTypeBadge, OriginBadge, VerificationBadge } from '../../components/badges';
import { Badge, Button, Card, EmptyState, ErrorState, Input, Loading, PageHeader } from '../../components/ui';
import { ENTITY_BY_TYPE, SEARCH_PARTITIONS, type SearchPartition } from '../../domain/registry';
import { useData } from '../../hooks/useData';
import { DatabaseService } from '../../services/database';
import { facets, hitLink, search, type Hit } from '../../services/search';
import { BOOK_TITLES } from '../../services/knowledgeChunks';
import { ParametricPanel } from '../../components/ParametricPanel';
export { hitLink };

// the hybrid (AI) ranking loads only when switched on
const HybridResults = lazy(() => import('../ai/HybridResults'));

export function HitRow({ h, q }: { h: Hit; q: string }) {
  return (
    <li className="border-b border-line/60 py-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>{h.entity === 'knowledge' ? (BOOK_TITLES[h.book ?? ''] ?? 'Handbook') : (ENTITY_BY_TYPE[h.entity]?.label ?? h.entity)}</Badge>
        <Link to={hitLink(h, q)} className="font-medium text-accent-2 hover:underline">
          {h.name}
        </Link>
        <DataTypeBadge t={h.data_type} />
        <VerificationBadge v={h.verification} />
        {h.local && <OriginBadge o="LOCAL_NEW" />}
        <span className="num ml-auto text-micro text-ink-3">{h.score.toFixed(1)}</span>
      </div>
      <div className="pl-1 text-meta text-ink-3">matched: {h.terms.slice(0, 8).join(', ')}</div>
    </li>
  );
}

/** ENGINEERING SEARCH (spec §81): fuzzy, prefix, filters, facets, field search, exact phrases. */
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const hybrid = params.get('mode') === 'hybrid';
  const [text, setText] = useState(q);
  const [parts, setParts] = useState<SearchPartition[]>([]);
  const [entityF, setEntityF] = useState<string | null>(null);
  const [typeF, setTypeF] = useState<string | null>(null);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [err, setErr] = useState(false);
  const { records } = useData();
  const locals = useMemo(() => records.filter((r) => r.__origin !== 'MASTER'), [records]);

  useEffect(() => setText(q), [q]);
  useEffect(() => {
    if (!q) {
      setHits(null);
      return;
    }
    setHits(null);
    setErr(false);
    const hidden = new Set<string>();
    search({ text: q, partitions: parts.length ? parts : undefined, limit: 300 }, locals, hidden)
      .then(setHits)
      .catch(() => setErr(true));
  }, [q, parts, locals]);
  const shown = useMemo(() => (hits ?? []).filter((h) => (!entityF || h.entity === entityF) && (!typeF || h.data_type === typeF)), [hits, entityF, typeF]);
  const f = useMemo(() => facets(hits ?? []), [hits]);

  return (
    <div>
      <PageHeader eyebrow="Knowledge" title="Search" subtitle={'Products, companies, suppliers, lasers, optics, modules, applications, processes, materials, POCs, projects, requirements and the three handbooks. Try: 20–50W UV laser semiconductor marking · 50W 1064nm nanosecond laser marking source · entity:module vision · "process window" · book:automation takt'} />
      <form
        className="mb-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(text.trim() ? { q: text.trim(), ...(hybrid ? { mode: 'hybrid' } : {}) } : {});
        }}
      >
        <Input aria-label="Search query" value={text} onChange={(e) => setText(e.target.value)} className="max-w-2xl flex-1" placeholder="Search…" />
        <Button type="submit" variant="primary">
          Search
        </Button>
        <Button
          onClick={async () => {
            if (q) await DatabaseService.addSavedSearch({ query: q, partitions: parts, created_at: new Date().toISOString() });
          }}
        >
          Save search
        </Button>
        <Button aria-pressed={hybrid} variant={hybrid ? 'primary' : 'default'} onClick={() => setParams({ ...(q ? { q } : {}), ...(hybrid ? {} : { mode: 'hybrid' }) })} title="Add hybrid (keyword + lexical vector + graph) results, reranked by technical relevance">
          Hybrid ranking (BETA)
        </Button>
      </form>
      <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Partitions">
        {SEARCH_PARTITIONS.map((p) => (
          <Button key={p} size="sm" variant={parts.includes(p) ? 'primary' : 'default'} onClick={() => setParts(parts.includes(p) ? parts.filter((x) => x !== p) : [...parts, p])}>
            {p}
          </Button>
        ))}
      </div>
      {q && (
        <div className="mb-3">
          <ParametricPanel q={q} />
        </div>
      )}
      {q && hybrid && (
        <div className="mb-3">
          <Suspense fallback={<Loading label="Loading hybrid ranking…" />}>
            <HybridResults q={q} />
          </Suspense>
        </div>
      )}
      {!q ? (
        <EmptyState title="Search the engineering system" explain="Everything in the master data, your local drafts and 1,000+ handbook sections is indexed. Filters and facets appear with results." />
      ) : err ? (
        <ErrorState what="Search indexes could not be loaded." why="The search-index files are missing or you are offline without a cached copy." todo="Reconnect, or rebuild (npm run build generates /search-index)." />
      ) : !hits ? (
        <Loading label="Searching…" />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-3">
            <Card title="Entity">
              <ul className="space-y-0.5 text-body">
                {Object.entries(f.entity)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, n]) => (
                    <li key={k}>
                      <button type="button" className={`flex w-full justify-between ${entityF === k ? 'font-semibold text-accent-2' : ''}`} onClick={() => setEntityF(entityF === k ? null : k)}>
                        <span>{k === 'knowledge' ? 'Handbook section' : (ENTITY_BY_TYPE[k]?.label ?? k)}</span>
                        <span className="num text-ink-3">{n}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            </Card>
            <Card title="Data type">
              <ul className="space-y-0.5 text-body">
                {Object.entries(f.data_type).map(([k, n]) => (
                  <li key={k}>
                    <button type="button" className={`flex w-full justify-between ${typeF === k ? 'font-semibold text-accent-2' : ''}`} onClick={() => setTypeF(typeF === k ? null : k)}>
                      <span>{k}</span>
                      <span className="num text-ink-3">{n}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
          <div>
            <p className="mb-1 text-ink-3">
              {shown.length} result(s) for “{q}”
            </p>
            {shown.length ? (
              <ul>
                {shown.slice(0, 150).map((h) => (
                  <HitRow key={`${h.entity}-${h.id}`} h={h} q={q} />
                ))}
              </ul>
            ) : (
              <EmptyState title="No results" explain="Nothing matched. Remove filters, check spelling (fuzzy matching is on), or ask “What is missing?” — the data may not exist yet." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
