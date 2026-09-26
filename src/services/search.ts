import MiniSearch, { type SearchResult } from 'minisearch';
import type { AnyRecord } from '../domain';
import { SEARCH_PARTITIONS, type SearchPartition } from '../domain/registry';
import { fetchJson } from '../utils/paths';
import { MINISEARCH_OPTIONS, recordToSearchDoc, type SearchDoc } from './searchDocs';

/**
 * ENGINEERING SEARCH (spec §81, §102). Build-time partitioned indexes are loaded lazily per
 * partition; local drafts are indexed in the browser so they are searchable immediately.
 * Supports fuzzy/prefix search, filters (entity, data type, partition) and field search
 * (`name:galvo`, `entity:product`, `type:DEMO`, "exact phrase").
 */
const cache = new Map<SearchPartition, Promise<MiniSearch<SearchDoc>>>();

export function loadPartition(p: SearchPartition): Promise<MiniSearch<SearchDoc>> {
  let m = cache.get(p);
  if (!m) {
    m = fetchJson<{ index: unknown }>(`search-index/${p}.json`).then((j) => MiniSearch.loadJSON<SearchDoc>(JSON.stringify(j.index), MINISEARCH_OPTIONS));
    cache.set(p, m);
    m.catch(() => cache.delete(p));
  }
  return m;
}

export interface SearchQuery {
  text: string;
  partitions?: SearchPartition[];
  entities?: string[];
  dataTypes?: string[];
  limit?: number;
}

export interface Hit {
  id: string;
  entity: string;
  name: string;
  score: number;
  data_type: string;
  verification: string;
  partition: string;
  ref?: string;
  book?: string;
  terms: string[];
  local?: boolean;
}

export interface ParsedQuery {
  free: string;
  fields: Record<string, string>;
  phrases: string[];
}

export function parseQuery(q: string): ParsedQuery {
  const fields: Record<string, string> = {};
  const phrases: string[] = [];
  let free = q.replace(/"([^"]+)"/g, (_, p: string) => {
    phrases.push(p.toLowerCase());
    return ' ';
  });
  free = free.replace(/\b(name|entity|type|tag|book):(\S+)/gi, (_, k: string, v: string) => {
    fields[k.toLowerCase()] = v;
    return ' ';
  });
  return { free: free.replace(/\s+/g, ' ').trim(), fields, phrases };
}

function localIndex(drafts: AnyRecord[]): MiniSearch<SearchDoc> {
  const ms = new MiniSearch<SearchDoc>(MINISEARCH_OPTIONS);
  ms.addAll(drafts.map((d) => recordToSearchDoc(d as Record<string, unknown>)));
  return ms;
}

export async function search(q: SearchQuery, localDrafts: AnyRecord[] = [], hiddenIds: Set<string> = new Set()): Promise<Hit[]> {
  const pq = parseQuery(q.text);
  const text = [pq.free, ...pq.phrases, pq.fields.name ?? ''].join(' ').trim();
  if (!text && !pq.fields.entity && !pq.fields.type) return [];
  const parts = q.partitions?.length ? q.partitions : [...SEARCH_PARTITIONS];
  const indexes = await Promise.all(parts.map((p) => loadPartition(p).catch(() => null)));
  const localIds = new Set(localDrafts.map((d) => d.id));
  const results: Hit[] = [];
  const push = (r: SearchResult, local: boolean) => {
    if (!local && (localIds.has(r.id) || hiddenIds.has(r.id))) return; // local draft supersedes master
    results.push({ id: r.id, entity: r.entity, name: r.name, score: r.score, data_type: r.data_type, verification: r.verification, partition: r.partition, ref: r.ref, book: r.book, terms: r.terms, local });
  };
  const opts = text ? undefined : { filter: () => true };
  for (const idx of indexes) if (idx) for (const r of text ? idx.search(text) : idx.search(MiniSearch.wildcard, opts)) push(r, false);
  if (localDrafts.length) for (const r of text ? localIndex(localDrafts).search(text) : []) push(r, true);

  const entityF = pq.fields.entity?.toLowerCase();
  const typeF = pq.fields.type?.toUpperCase();
  const bookF = pq.fields.book?.toLowerCase();
  const nameF = pq.fields.name?.toLowerCase();
  return results
    .filter((h) => (!q.entities?.length || q.entities.includes(h.entity)) && (!q.dataTypes?.length || q.dataTypes.includes(h.data_type)))
    .filter((h) => (!entityF || h.entity === entityF) && (!typeF || h.data_type === typeF) && (!bookF || h.book === bookF) && (!nameF || h.name.toLowerCase().includes(nameF)))
    .filter((h) => !pq.phrases.length || pq.phrases.every((ph) => h.name.toLowerCase().includes(ph) || h.terms.join(' ').includes(ph.split(' ')[0])))
    .sort((a, b) => b.score - a.score)
    .slice(0, q.limit ?? 100);
}

/** Facet counts for a result list. */
export function facets(hits: Hit[]): { entity: Record<string, number>; data_type: Record<string, number>; partition: Record<string, number> } {
  const f = { entity: {} as Record<string, number>, data_type: {} as Record<string, number>, partition: {} as Record<string, number> };
  for (const h of hits) {
    f.entity[h.entity] = (f.entity[h.entity] ?? 0) + 1;
    f.data_type[h.data_type] = (f.data_type[h.data_type] ?? 0) + 1;
    f.partition[h.partition] = (f.partition[h.partition] ?? 0) + 1;
  }
  return f;
}
