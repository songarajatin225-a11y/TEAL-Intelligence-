import type { AnyRecord } from '../domain';
import { recordToSearchDoc } from './searchDocs';

/**
 * FIND SIMILAR (spec §82) and the scoring behind WHAT CAN WE REUSE (§43, §140).
 * Transparent similarity: weighted Jaccard over tokens plus structured feature overlap
 * (family, process, material, source, industry, modules). Every score lists its reasons.
 */
const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'per', 'demo', 'draft', 'generated', 'laser', 'teal']);

export function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9µ]+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

export function features(r: AnyRecord): Map<string, string> {
  const f = new Map<string, string>();
  const add = (k: string, v: unknown) => {
    if (typeof v === 'string' && v) f.set(`${k}:${v.replace(/^[a-z]{2,6}-/, '')}`, k);
  };
  const x = r as Record<string, unknown>;
  add('family', x.family_id);
  add('process', x.process);
  add('product', x.product_id);
  add('material', x.material_id);
  for (const m of (x.material_ids as string[] | undefined) ?? []) add('material', m);
  add('source', x.source_id ?? x.recommended_source_id ?? x.source_key);
  add('industry', x.industry);
  for (const i of (x.industries as string[] | undefined) ?? []) add('industry', i.replace(/^ind-/, '').toLowerCase());
  for (const m of (x.modules as string[] | undefined) ?? []) add('module', m);
  for (const m of (x.standard_content as string[] | undefined) ?? []) add('module', m);
  add('application', x.application_id);
  add('customer', x.customer_id);
  if (r.entity === 'product') for (const a of (x.applications as { material_key?: string }[]) ?? []) add('material', a.material_key);
  return f;
}

export interface SimilarHit {
  record: AnyRecord;
  score: number;
  reasons: string[];
}

export function similarity(a: AnyRecord, b: AnyRecord): SimilarHit {
  const ta = tokens(`${a.name} ${recordToSearchDoc(a as Record<string, unknown>).text}`);
  const tb = tokens(`${b.name} ${recordToSearchDoc(b as Record<string, unknown>).text}`);
  let inter = 0;
  const common: string[] = [];
  ta.forEach((t) => {
    if (tb.has(t)) {
      inter++;
      if (common.length < 6) common.push(t);
    }
  });
  const jac = inter / Math.max(1, ta.size + tb.size - inter);
  const fa = features(a);
  const fb = features(b);
  const shared: string[] = [];
  fa.forEach((_, k) => fb.has(k) && shared.push(k));
  const fscore = shared.length / Math.max(1, Math.min(fa.size, fb.size) || 1);
  const score = 0.55 * jac + 0.45 * Math.min(1, fscore);
  const reasons = [...shared.map((s) => s.replace(':', ' = ')), ...(common.length ? [`shared terms: ${common.join(', ')}`] : [])];
  return { record: b, score, reasons };
}

export function findSimilar(target: AnyRecord, pool: AnyRecord[], opts: { limit?: number; entities?: string[]; min?: number } = {}): SimilarHit[] {
  const { limit = 20, entities, min = 0.06 } = opts;
  return pool
    .filter((r) => r.id !== target.id && r.entity !== 'source' && r.entity !== 'evidence' && (!entities || entities.includes(r.entity)))
    .map((r) => similarity(target, r))
    .filter((h) => h.score >= min)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}

export type ReuseClass = 'Reusable' | 'Similar' | 'Potentially reusable' | 'Requires validation' | 'Not compatible';

export interface ReuseHit extends SimilarHit {
  class: ReuseClass;
  basis: string;
}

/**
 * WHAT CAN WE REUSE? Classify similar assets. Rules (documented, deterministic):
 *  - Catalogue products (maturity Product/Platform) with the same process and a shared material → Reusable
 *  - Modules that are standard content or fit the matched platform → Reusable / Potentially reusable
 *  - POCs: decision Feasible → Reusable; otherwise Requires validation
 *  - Lessons, BOMs, cost models, suppliers with overlap → Similar / Potentially reusable
 *  - DEMO / draft records never count as validated reuse
 */
export function classifyReuse(target: AnyRecord, hits: SimilarHit[]): ReuseHit[] {
  return hits.map((h) => {
    const r = h.record as Record<string, unknown>;
    const demo = h.record.data_type === 'DEMO' || h.record.data_type === 'INFERRED';
    let cls: ReuseClass = 'Similar';
    let basis = 'Textual/feature similarity';
    switch (h.record.entity) {
      case 'product': {
        const sharedProcess = h.reasons.some((x) => x.startsWith('process') || x.startsWith('family'));
        const sharedMat = h.reasons.some((x) => x.startsWith('material'));
        cls = sharedMat && (sharedProcess || h.score > 0.25) ? 'Reusable' : h.score > 0.15 ? 'Potentially reusable' : 'Similar';
        basis = `Catalogue platform (maturity ${String(r.maturity ?? 'UNKNOWN')})`;
        break;
      }
      case 'module':
        cls = h.score > 0.12 ? 'Potentially reusable' : 'Similar';
        basis = 'Module library; confirm fitment in the configurator';
        break;
      case 'poc':
        cls = r.decision === 'Feasible' && !demo ? 'Reusable' : 'Requires validation';
        basis = `POC decision: ${String(r.decision)}`;
        break;
      case 'bom':
      case 'cost_model':
      case 'configuration':
        cls = demo ? 'Requires validation' : 'Potentially reusable';
        basis = demo ? 'Draft/DEMO — structure only' : 'Existing structure';
        break;
      case 'supplier':
        cls = 'Potentially reusable';
        basis = `Supplier (${String(h.record.data_type)})`;
        break;
      case 'lesson':
        cls = 'Similar';
        basis = 'Lesson learned';
        break;
      default:
        cls = 'Similar';
    }
    if (demo && cls === 'Reusable') cls = 'Requires validation';
    void target;
    return { ...h, class: cls, basis };
  });
}
