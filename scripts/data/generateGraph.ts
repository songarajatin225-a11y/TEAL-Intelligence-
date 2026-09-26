/**
 * Build the static knowledge graph (spec §80) → public/graph/graph.json
 *   npm run data:graph
 */
import { join } from 'node:path';
import { extractRefs, provenanceSource } from '../../src/services/refs';
import { PUBLIC_DIR, writeJson } from '../lib/dataset';
import { loadAllRecords } from '../lib/loadAll';

const { records } = loadAllRecords();
const ids = new Set(records.map((r) => r.id));
const nodes = records.map((r) => ({ id: r.id, entity: r.entity, name: String(r.name ?? r.id), data_type: String(r.data_type ?? '') }));
const edges: { from: string; to: string; rel: string }[] = [];
for (const r of records) {
  for (const e of extractRefs(r)) if (ids.has(e.to)) edges.push({ from: e.from, to: e.to, rel: e.rel });
  const s = provenanceSource(r);
  if (s && ids.has(s) && r.entity !== 'source') edges.push({ from: r.id, to: s, rel: 'derived_from' });
}
writeJson(join(PUBLIC_DIR, 'graph', 'graph.json'), { generated_at: new Date().toISOString().slice(0, 10), nodes, edges });
console.log(`✔ Graph: ${nodes.length} nodes, ${edges.length} edges`);
