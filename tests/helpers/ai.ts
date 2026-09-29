import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import MiniSearch from 'minisearch';
import type { AnyRecord } from '../../src/domain';
import { newLocalId } from '../../src/repositories';
import { compatCtx } from '../../src/services/eng/compatibility';
import { specDefs } from '../../src/services/eng/specs';
import { buildGraph } from '../../src/services/graph';
import type { CopilotDeps } from '../../src/services/ai/orchestrator';
import { dataReadiness, engineStates } from '../../src/services/ai/registry';
import { bm25FromRecords, recordVectorIndex, type Bm25Fn } from '../../src/services/ai/retrieval/hybrid';
import { MINISEARCH_OPTIONS, type SearchDoc } from '../../src/services/searchDocs';
import { inquiryContext, masterRecords } from './repo';

const ROOT = join(__dirname, '..', '..');

/** BM25 over the built partition indexes when present (production path), else over the records. */
function bm25(records: AnyRecord[]): Bm25Fn {
  const dir = join(ROOT, 'public', 'search-index');
  if (!existsSync(join(dir, 'manifest.json'))) return bm25FromRecords(records);
  const idx = readdirSync(dir)
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
    .map((f) => MiniSearch.loadJSON<SearchDoc>(JSON.stringify((JSON.parse(readFileSync(join(dir, f), 'utf-8')) as { index: unknown }).index), MINISEARCH_OPTIONS));
  return async (text, limit) =>
    idx
      .flatMap((m) => m.search(text))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => ({ id: r.id, entity: r.entity, name: r.name, score: r.score, data_type: r.data_type, verification: r.verification, partition: r.partition, ref: r.ref, book: r.book, terms: r.terms }));
}

export async function aiDeps(overrides: Record<string, boolean> = {}): Promise<CopilotDeps> {
  const records = await masterRecords();
  const ctx = await inquiryContext(records);
  const defs = specDefs(records);
  const readiness = dataReadiness(records);
  return {
    records,
    byId: new Map(records.map((r) => [r.id, r])),
    graph: buildGraph(records),
    defs,
    compat: compatCtx(records, defs),
    engine: ctx.engine,
    lexicon: ctx.lexicon,
    bm25: bm25(records),
    vec: recordVectorIndex(records),
    fetchText: async (p) => readFileSync(join(ROOT, p), 'utf-8'),
    states: engineStates(readiness, overrides),
    readiness,
    newId: newLocalId,
    today: '2026-09-29',
  };
}
