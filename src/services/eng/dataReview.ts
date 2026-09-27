import type { AnyRecord } from '../../domain';
import type { DataConflict, Part } from '../../domain/engineering';
import { completeness, freshness, readSpec, displaySpec, type SpecDefs } from './specs';

/*
 * DATA GOVERNANCE (master prompt §47, §48, §110–§113, §134). Conflicts are detected, not resolved by
 * overwriting; duplicates are suggested, never merged automatically; stale data is flagged; every
 * change is a diff someone reviews.
 */

export interface DetectedConflict {
  part: Part & AnyRecord;
  parameter: string;
  values: { source_id?: string; value: string }[];
  /** the recorded DataConflict, when someone has already opened one */
  record?: DataConflict & AnyRecord;
}

/** §47 — every specification where two sources disagree, plus recorded conflict records. */
export function detectConflicts(records: AnyRecord[], defs: SpecDefs): DetectedConflict[] {
  const byId = new Map(records.map((r) => [r.id, r]));
  const recorded = records.filter((r) => r.entity === 'data_conflict') as (DataConflict & AnyRecord)[];
  const out: DetectedConflict[] = [];
  for (const p of records.filter((r) => r.entity === 'part') as (Part & AnyRecord)[]) {
    for (const key of new Set((p.specs ?? []).map((s) => s.spec))) {
      const s = readSpec(p, key, defs, byId);
      if (!s?.conflict) continue;
      out.push({
        part: p,
        parameter: key,
        values: s.all.map((x) => ({ source_id: x.entry.source_id, value: displaySpec(x) })),
        record: recorded.find((c) => c.part_id === p.id && c.parameter === key),
      });
    }
  }
  for (const c of recorded) {
    if (out.some((o) => o.record?.id === c.id)) continue;
    const part = byId.get(c.part_id) as (Part & AnyRecord) | undefined;
    if (part) out.push({ part, parameter: c.parameter, values: [{ source_id: c.source_a_id, value: c.value_a }, { source_id: c.source_b_id, value: c.value_b }], record: c });
  }
  return out;
}

/* ---------------------------------------------------------------- duplicates (§112) */

/** Model numbers compared without case, spaces, hyphens, dots, slashes or underscores. */
export const normModel = (m: string) => m.toUpperCase().replace(/[\s\-._/]+/g, '');

function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export interface PartDuplicate {
  a: Part & AnyRecord;
  b: Part & AnyRecord;
  kind: 'Possible duplicate';
  reasons: string[];
}
export function partDuplicates(parts: (Part & AnyRecord)[]): PartDuplicate[] {
  const out: PartDuplicate[] = [];
  const live = parts.filter((p) => p.record_status !== 'Archived');
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i];
      const b = live[j];
      if (a.product_type !== b.product_type) continue;
      const na = normModel(a.model_number);
      const nb = normModel(b.model_number);
      const reasons: string[] = [];
      const sameMfr = !!a.manufacturer_id && a.manufacturer_id === b.manufacturer_id;
      if (na === nb) reasons.push(sameMfr ? 'same manufacturer and model number (ignoring spaces, hyphens and case)' : 'same model number, different or unknown manufacturer — distributor alias or regional version?');
      else if (sameMfr && na.length >= 5 && lev(na, nb) === 1) reasons.push('same manufacturer, model numbers differ by one character — spelling variant or a different variant?');
      else if (sameMfr && (na.startsWith(nb) || nb.startsWith(na)) && Math.min(na.length, nb.length) >= 5) reasons.push('same manufacturer, one model number extends the other — family vs model confusion?');
      if (reasons.length) out.push({ a, b, kind: 'Possible duplicate', reasons });
    }
  }
  return out;
}

/* ---------------------------------------------------------------- change detection (§111, §134, §144) */

export interface FieldChange {
  field: string;
  before: unknown;
  after: unknown;
}
const IGNORE = new Set(['updated_at', 'created_at', '__origin', '__dataset', 'version']);
const stable = (v: unknown) => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x));

/** Field-level diff of two versions of a record. */
export function diffRecords(before: Record<string, unknown> | undefined, after: Record<string, unknown>): FieldChange[] {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after)]);
  const out: FieldChange[] = [];
  for (const k of keys) {
    if (IGNORE.has(k)) continue;
    const a = before?.[k];
    const b = after[k];
    if (stable(a) !== stable(b)) out.push({ field: k, before: a, after: b });
  }
  return out;
}

/** Specification-level diff between two versions of a part (old value → new value per parameter). */
export function diffSpecs(before: Pick<Part, 'specs'>, after: Pick<Part, 'specs'>, defs: SpecDefs): { spec: string; before: string; after: string }[] {
  const keys = new Set([...(before.specs ?? []).map((s) => s.spec), ...(after.specs ?? []).map((s) => s.spec)]);
  const out: { spec: string; before: string; after: string }[] = [];
  for (const k of keys) {
    const a = displaySpec(readSpec(before, k, defs));
    const b = displaySpec(readSpec(after, k, defs));
    if (a !== b) out.push({ spec: defs.get(k)?.name ?? k, before: a, after: b });
  }
  return out;
}

/* ---------------------------------------------------------------- review queues (§113) */

export const REVIEW_QUEUES = ['New', 'Changed', 'Conflicting', 'Duplicate', 'Missing', 'Stale', 'Unverified'] as const;
export type ReviewQueue = (typeof REVIEW_QUEUES)[number];
export interface ReviewItem {
  queue: ReviewQueue;
  record: AnyRecord;
  reason: string;
  related?: AnyRecord;
}

export function reviewQueues(records: AnyRecord[], defs: SpecDefs, today: string): Record<ReviewQueue, ReviewItem[]> {
  const q = Object.fromEntries(REVIEW_QUEUES.map((k) => [k, [] as ReviewItem[]])) as Record<ReviewQueue, ReviewItem[]>;
  const byId = new Map(records.map((r) => [r.id, r]));
  const parts = records.filter((r) => r.entity === 'part') as (Part & AnyRecord)[];
  for (const p of parts) {
    if (p.record_status === 'Archived') continue;
    const origin = (p as { __origin?: string }).__origin;
    if (origin === 'LOCAL_NEW' || ['Draft', 'Imported', 'Extracted'].includes(p.record_status)) q.New.push({ queue: 'New', record: p, reason: origin === 'LOCAL_NEW' ? 'Created in this browser — not yet in GitHub' : `Record status ${p.record_status}` });
    if (origin === 'LOCAL_DRAFT') q.Changed.push({ queue: 'Changed', record: p, reason: 'Local edit of a GitHub record — review the diff before export' });
    const comp = completeness(p);
    if (comp.pct != null && comp.pct < 50) q.Missing.push({ queue: 'Missing', record: p, reason: `${comp.pct}% of key specifications — missing ${comp.missing.join(', ')}` });
    const srcIds = [...new Set([p.provenance?.source_id, ...(p.specs ?? []).map((s) => s.source_id)].filter((x): x is string => !!x))];
    const stale = srcIds.map((id) => byId.get(id)).filter((s) => s && freshness(s as never, today) === 'stale');
    const staleSpecs = (p.specs ?? []).filter((s) => freshness(s, today) === 'stale');
    if (stale.length || staleSpecs.length || (p.next_review && p.next_review < today)) q.Stale.push({ queue: 'Stale', record: p, reason: stale.length ? `Source not verified within 12 months: ${stale.map((s) => s!.name).join(', ')}` : staleSpecs.length ? `${staleSpecs.length} specification value(s) older than 12 months` : `Review was due ${p.next_review}` });
    const verified = p.record_status === 'Approved' || p.record_status === 'Validated' || (p.specs ?? []).some((s) => s.verified);
    if (!verified) q.Unverified.push({ queue: 'Unverified', record: p, reason: p.data_type === 'DEMO' ? 'DEMO data — illustrative, never verified' : 'No verified specification and not approved' });
  }
  for (const c of detectConflicts(records, defs)) {
    if (c.record && c.record.conflict_status !== 'Open') continue;
    q.Conflicting.push({ queue: 'Conflicting', record: c.record ?? c.part, related: c.part, reason: `${defs.get(c.parameter)?.name ?? c.parameter}: ${c.values.map((v) => `${v.value} (${byId.get(v.source_id ?? '')?.name ?? v.source_id ?? 'no source'})`).join(' vs ')}` });
  }
  for (const d of partDuplicates(parts)) q.Duplicate.push({ queue: 'Duplicate', record: d.a, related: d.b, reason: d.reasons.join('; ') });
  return q;
}

/** §114 database analytics — every number counted from records, nothing typed in. */
export function databaseAnalytics(records: AnyRecord[], defs: SpecDefs, today: string) {
  const parts = records.filter((r) => r.entity === 'part') as (Part & AnyRecord)[];
  const q = reviewQueues(records, defs, today);
  const manufacturers = records.filter((r) => r.entity === 'company' && Array.isArray(r.roles) && (r.roles as string[]).includes('manufacturer'));
  return {
    manufacturers: manufacturers.length,
    products: parts.length,
    families: new Set(parts.map((p) => `${p.manufacturer_id ?? ''}|${p.family ?? p.series ?? ''}`).filter((k) => !k.endsWith('|'))).size,
    specifications: parts.reduce((n, p) => n + (p.specs?.length ?? 0), 0),
    productTypes: new Set(parts.map((p) => p.product_type)).size,
    technologies: records.filter((r) => r.entity === 'technology').length,
    applications: records.filter((r) => r.entity === 'application').length,
    documents: parts.reduce((n, p) => n + (p.documents?.length ?? 0), 0),
    sources: records.filter((r) => r.entity === 'source').length,
    specDefinitions: defs.size,
    rules: records.filter((r) => r.entity === 'compatibility_rule').length,
    relationships: records.filter((r) => r.entity === 'compatibility').length,
    conflicts: q.Conflicting.length,
    stale: q.Stale.length,
    incomplete: q.Missing.length,
    duplicates: q.Duplicate.length,
    global: parts.filter((p) => p.scope === 'GLOBAL').length,
    teal: parts.filter((p) => p.scope === 'TEAL').length,
    demo: parts.filter((p) => p.data_type === 'DEMO').length,
  };
}
