/**
 * DEDUPLICATE (spec §89, §100): candidates vs. each other and vs. master data.
 *  - same id twice in one batch → first kept, differing values flagged
 *  - id already in master, same values → unchanged (dropped)
 *  - id already in master, different values → CONFLICTED candidate with a field-by-field diff;
 *    master is never overwritten silently — the reviewer decides in the pull request
 */
import type { AnyRecord } from '../../src/domain';
import type { Candidate } from './normalizeProduct';

export interface FieldDiff {
  field: string;
  master: unknown;
  source: unknown;
}
export interface DedupeResult {
  created: Candidate[];
  changed: (Candidate & { diffs: FieldDiff[] })[];
  unchanged: Candidate[];
  duplicatesInBatch: { id: string; rows: number[]; diffs: FieldDiff[] }[];
}

// display text (name, manufacturer spelling) is not a data conflict when the ids already match
const IGNORE = new Set(['provenance', 'tags', 'updated_at', 'created_at', 'data_type', 'name']);
/** Compare meaning, not formatting: quantities by value+unit (original text may differ), strings case-insensitively. */
const norm = (v: unknown): unknown => {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'value' in (v as object) && 'unit' in (v as object)) return { value: (v as { value: unknown }).value, unit: (v as { unit: unknown }).unit };
  if (typeof v === 'string') return v.replace(/\s+/g, ' ').trim().toLowerCase();
  return v ?? null;
};
const same = (a: unknown, b: unknown) => JSON.stringify(norm(a)) === JSON.stringify(norm(b));

export function diffRecords(master: Record<string, unknown>, cand: Record<string, unknown>): FieldDiff[] {
  const out: FieldDiff[] = [];
  const sameMaker = master.manufacturer_id != null && master.manufacturer_id === cand.manufacturer_id;
  for (const [k, v] of Object.entries(cand)) {
    if (IGNORE.has(k) || v === undefined || v === null) continue;
    if (k === 'manufacturer' && sameMaker) continue;
    if (!same(master[k], v)) out.push({ field: k, master: master[k], source: v });
  }
  return out;
}

export function deduplicate(cands: Candidate[], master: AnyRecord[]): DedupeResult {
  const byId = new Map(master.map((r) => [r.id, r]));
  const seen = new Map<string, Candidate>();
  const res: DedupeResult = { created: [], changed: [], unchanged: [], duplicatesInBatch: [] };
  for (const c of cands) {
    const prev = seen.get(c.record.id);
    if (prev) {
      const diffs = diffRecords(prev.record as Record<string, unknown>, c.record as Record<string, unknown>);
      const d = res.duplicatesInBatch.find((x) => x.id === c.record.id);
      if (d) d.rows.push(c.row.index);
      else res.duplicatesInBatch.push({ id: c.record.id, rows: [prev.row.index, c.row.index], diffs });
      if (diffs.length) prev.problems.push(`duplicate rows disagree on ${diffs.map((x) => x.field).join(', ')}`);
      continue;
    }
    seen.set(c.record.id, c);
    const m = byId.get(c.record.id);
    if (!m) {
      res.created.push(c);
      continue;
    }
    const diffs = diffRecords(m as Record<string, unknown>, c.record as Record<string, unknown>);
    if (!diffs.length) res.unchanged.push(c);
    else {
      const merged = { ...m, ...c.record, provenance: { ...c.record.provenance, verification_status: 'CONFLICTED' as const, note: `Source differs from master on: ${diffs.map((x) => x.field).join(', ')}. Review before merge.` } };
      res.changed.push({ ...c, record: merged as AnyRecord, diffs });
    }
  }
  return res;
}
