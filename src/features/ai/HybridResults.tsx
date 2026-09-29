import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Card, Loading } from '../../components/ui';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { classifyIntent } from '../../services/ai/intent';
import { hybridSearch } from '../../services/ai/retrieval/hybrid';
import { rerank, type RankedHit } from '../../services/ai/retrieval/rerank';
import { parsePartQuery } from '../../services/eng/partSearch';
import { parseParams } from '../../services/parametric';
import { BOOK_TITLES } from '../../services/knowledgeChunks';
import { isOnline } from '../../services/ai/registry';
import { useCopilotDeps } from './useCopilotDeps';

/**
 * Hybrid retrieval on the search page (AI master prompt §12, §83): keyword + lexical vectors + graph,
 * fused and reranked, each result with the reasons for its position. Lazy-loaded; the keyword search
 * below it is unchanged.
 */
export default function HybridResults({ q }: { q: string }) {
  const deps = useCopilotDeps();
  const [hits, setHits] = useState<RankedHit[] | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  useEffect(() => {
    if (!deps) return;
    let live = true;
    setHits(null);
    const intent = classifyIntent(q).intent;
    void hybridSearch(q, { bm25: isOnline(deps.states, 'local-bm25') ? deps.bm25 : null, vec: isOnline(deps.states, 'local-lexvec') ? deps.vec : null, graph: deps.graph, useGraph: isOnline(deps.states, 'local-graph') }, {}, 40).then((h) => {
      if (!live) return;
      setAdded(h.expansion.added);
      setHits(isOnline(deps.states, 'local-reranker') ? rerank(q, h.hits, { intent, graph: deps.graph, defs: deps.defs, parsed: parsePartQuery(q, deps.defs), params: parseParams(q) }) : h.hits.map((x) => ({ ...x, score: x.rrf * 100, why: ['fused retrieval (reranker disabled)'] })));
    });
    return () => {
      live = false;
    };
  }, [q, deps]);
  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          Hybrid results <Badge tone="accent">BETA</Badge>
        </span>
      }
      description={`Keyword (BM25) + lexical vectors + knowledge graph, reranked by technical relevance${added.length ? ` · also searched: ${added.slice(0, 6).join(', ')}` : ''}`}
      actions={
        <Link to={`/copilot?q=${encodeURIComponent(q)}`} className="text-meta font-medium text-accent-2 hover:underline">
          Ask the Copilot →
        </Link>
      }
    >
      {!hits ? (
        <Loading label="Ranking…" />
      ) : !hits.length ? (
        <p className="text-meta text-ink-3">Data not available in the TEAL Intelligence knowledge base.</p>
      ) : (
        <ol className="space-y-1.5" aria-label="Hybrid results">
          {hits.slice(0, 15).map((h, i) => (
            <li key={h.id} className="border-b border-line/60 pb-1.5 last:border-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="num w-5 text-micro text-ink-3">{i + 1}</span>
                <Badge>{h.kind === 'knowledge' ? (BOOK_TITLES[h.book ?? ''] ?? 'Handbook') : (ENTITY_BY_TYPE[h.entity]?.label ?? h.entity)}</Badge>
                <Link to={h.kind === 'knowledge' && h.ref ? `/knowledge/${h.ref.split('#')[0]}?a=${h.ref.split('#')[1]}&q=${encodeURIComponent(q)}` : `/record/${encodeURIComponent(h.id)}`} className="font-medium text-accent-2 hover:underline">
                  {h.name}
                </Link>
                {h.data_type === 'DEMO' && <Badge tone="demo">DEMO</Badge>}
              </div>
              <div className="pl-7 text-micro text-ink-3">{h.why.slice(1, 5).join(' · ') || h.reasons.join(' · ')}</div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
