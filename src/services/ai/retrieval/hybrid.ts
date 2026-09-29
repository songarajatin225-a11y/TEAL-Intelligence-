import MiniSearch from 'minisearch';
import type { AnyRecord } from '../../../domain';
import { neighbours, type Graph } from '../../graph';
import type { Hit } from '../../search';
import { MINISEARCH_OPTIONS, recordToSearchDoc, type SearchDoc } from '../../searchDocs';
import { expandQuery, type Expansion } from './expand';
import { buildVectorIndex, vectorSearch, type VectorIndex } from './lexvec';

/*
 * HYBRID RETRIEVAL (AI master prompt §11–§12). Never vector-only:
 *   query expansion → BM25 (platform index) + lexical vectors (records) + knowledge-graph expansion
 *   → metadata filters → Reciprocal Rank Fusion. Every hit keeps the ranks it had in each leg, so
 *   the reranker and the UI can say *why* it was retrieved.
 */

export type Bm25Fn = (text: string, limit: number) => Promise<Hit[]>;

export interface RetrievalFilters {
  entities?: string[];
  dataTypes?: string[];
  excludeDemo?: boolean;
  /** include handbook sections */
  knowledge?: boolean;
}

export interface HybridHit {
  id: string;
  entity: string;
  name: string;
  kind: 'record' | 'knowledge';
  ref?: string;
  book?: string;
  data_type: string;
  verification: string;
  rrf: number;
  bm25Rank?: number;
  vecRank?: number;
  vecScore?: number;
  graphFrom?: { id: string; rel: string };
  reasons: string[];
}

export interface HybridResult {
  expansion: Expansion;
  hits: HybridHit[];
  legs: { bm25: number; vector: number; graph: number };
  /** overlap of the top-10 of both legs — a retrieval-agreement signal for the confidence engine */
  agreement: number;
}

const RRF_K = 60;
const EXCLUDE_FROM_VEC = new Set(['source', 'vocabulary', 'spec_definition', 'formula', 'gate_definition', 'module_conflict', 'reference']);

/** Build the lexical vector index over the record set (in-browser, ~ms per 100 records). */
export function recordVectorIndex(records: AnyRecord[]): VectorIndex {
  return buildVectorIndex(
    records
      .filter((r) => !EXCLUDE_FROM_VEC.has(r.entity))
      .map((r) => {
        const d = recordToSearchDoc(r as unknown as Record<string, unknown>);
        return { id: r.id, text: `${d.name} ${d.name} ${d.text} ${d.tags}`, meta: { entity: r.entity, data_type: String(r.data_type ?? ''), source: String(r.provenance?.source_id ?? '') } };
      }),
  );
}

/** In-memory BM25 over records — the fallback when the build-time index cannot be loaded (and in tests). */
export function bm25FromRecords(records: AnyRecord[]): Bm25Fn {
  const ms = new MiniSearch<SearchDoc>(MINISEARCH_OPTIONS);
  ms.addAll(records.map((r) => recordToSearchDoc(r as unknown as Record<string, unknown>)));
  return async (text, limit) =>
    ms
      .search(text)
      .slice(0, limit)
      .map((r) => ({ id: r.id, entity: r.entity, name: r.name, score: r.score, data_type: r.data_type, verification: r.verification, partition: r.partition, terms: r.terms }));
}

const passes = (f: RetrievalFilters, entity: string, dataType: string) =>
  (!f.entities?.length || f.entities.includes(entity) || (entity === 'knowledge' && f.knowledge !== false)) && (!f.dataTypes?.length || f.dataTypes.includes(dataType)) && !(f.excludeDemo && dataType === 'DEMO') && !(entity === 'knowledge' && f.knowledge === false);

export async function hybridSearch(
  query: string,
  deps: { bm25: Bm25Fn | null; vec: VectorIndex | null; graph: Graph; useGraph?: boolean; expand?: boolean },
  filters: RetrievalFilters = {},
  limit = 30,
): Promise<HybridResult> {
  const expansion = deps.expand === false ? { query, added: [], text: query } : expandQuery(query);
  const acc = new Map<string, HybridHit>();
  const add = (h: Omit<HybridHit, 'rrf' | 'reasons'>, rank: number, why: string) => {
    const cur = acc.get(h.id) ?? { ...h, rrf: 0, reasons: [] };
    cur.rrf += 1 / (RRF_K + rank);
    cur.reasons.push(why);
    if (h.bm25Rank != null) cur.bm25Rank = h.bm25Rank;
    if (h.vecRank != null) {
      cur.vecRank = h.vecRank;
      cur.vecScore = h.vecScore;
    }
    if (h.graphFrom && !cur.graphFrom) cur.graphFrom = h.graphFrom;
    acc.set(h.id, cur);
  };

  // leg 1 — BM25 keyword search (existing platform index)
  let bm25Hits: Hit[] = [];
  if (deps.bm25) {
    try {
      bm25Hits = (await deps.bm25(expansion.text, 80)).filter((h) => passes(filters, h.entity, h.data_type));
    } catch {
      bm25Hits = [];
    }
  }
  bm25Hits.slice(0, 40).forEach((h, i) =>
    add({ id: h.id, entity: h.entity, name: h.name, kind: h.entity === 'knowledge' ? 'knowledge' : 'record', ref: h.ref, book: h.book, data_type: h.data_type, verification: h.verification, bm25Rank: i + 1 }, i + 1, `keyword rank ${i + 1}${h.terms?.length ? ` (${[...new Set(h.terms)].slice(0, 3).join(', ')})` : ''}`),
  );

  // leg 2 — lexical vectors over records
  let vecHits: ReturnType<typeof vectorSearch> = [];
  if (deps.vec) vecHits = vectorSearch(deps.vec, expansion.text, 40, (m) => passes(filters, m?.entity ?? '', m?.data_type ?? ''));
  vecHits.forEach((v, i) => {
    const r = deps.graph.byId.get(v.id);
    if (!r) return;
    add({ id: r.id, entity: r.entity, name: r.name, kind: 'record', data_type: String(r.data_type ?? ''), verification: String(r.provenance?.verification_status ?? ''), vecRank: i + 1, vecScore: v.score }, i + 1, `vector rank ${i + 1} (cosine ${v.score.toFixed(2)})`);
  });

  // leg 3 — graph expansion from the strongest record hits
  let graphAdded = 0;
  if (deps.useGraph !== false) {
    const seeds = [...acc.values()].filter((h) => h.kind === 'record').sort((a, b) => b.rrf - a.rrf).slice(0, 5);
    seeds.forEach((s, si) => {
      for (const n of neighbours(deps.graph, s.id)) {
        const r = n.record;
        if (r.entity === 'source' || r.entity === 'evidence' || acc.has(r.id) || !passes(filters, r.entity, String(r.data_type ?? ''))) continue;
        add({ id: r.id, entity: r.entity, name: r.name, kind: 'record', data_type: String(r.data_type ?? ''), verification: String(r.provenance?.verification_status ?? ''), graphFrom: { id: s.id, rel: n.rel } }, si + 12, `graph: ${n.rel.replace(/_/g, ' ')} ${s.name}`);
        graphAdded++;
      }
    });
  }

  const topB = new Set(bm25Hits.filter((h) => h.entity !== 'knowledge').slice(0, 10).map((h) => h.id));
  const topV = vecHits.slice(0, 10).map((v) => v.id);
  const agreement = topV.length && topB.size ? topV.filter((id) => topB.has(id)).length / Math.min(10, Math.max(topV.length, topB.size)) : 0;

  return {
    expansion,
    hits: [...acc.values()].sort((a, b) => b.rrf - a.rrf).slice(0, limit),
    legs: { bm25: bm25Hits.length, vector: vecHits.length, graph: graphAdded },
    agreement,
  };
}
