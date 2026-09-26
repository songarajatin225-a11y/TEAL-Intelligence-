/**
 * VALIDATE DATASET (spec §100–§101): every candidate and evidence record is schema-validated;
 * the reviewable output goes to ingestion/candidates/<source>/ — NEVER straight into /data.
 * A human moves accepted records into /data in a pull request (Review → PR → approval → merge).
 */
import { join } from 'node:path';
import type { AnyRecord } from '../../src/domain';
import { validateRecord } from '../../src/repositories/WorkspaceRepository';
import { ROOT, writeJson } from '../lib/dataset';
import { writeFileSync } from 'node:fs';
import type { DedupeResult } from './deduplicate';
import type { SourceManifest } from './manifest';
import type { Candidate } from './normalizeProduct';

export const CANDIDATES_DIR = join(ROOT, 'ingestion', 'candidates');

export function validateCandidates(records: AnyRecord[]): { valid: AnyRecord[]; invalid: { id: string; reason: string }[] } {
  const valid: AnyRecord[] = [];
  const invalid: { id: string; reason: string }[] = [];
  for (const r of records) {
    try {
      valid.push(validateRecord(r as Record<string, unknown>));
    } catch (e) {
      invalid.push({ id: String(r.id), reason: (e as Error).message });
    }
  }
  return { valid, invalid };
}

export interface CandidateOutput {
  dir: string;
  report: string;
  counts: { created: number; changed: number; unchanged: number; invalid: number; evidence: number; rowProblems: number };
}

export function writeCandidates(m: SourceManifest, retrievedAt: string, sha256: string, source: AnyRecord, dd: DedupeResult, evidence: AnyRecord[], opts: { dir?: string; write?: boolean } = {}): CandidateOutput {
  const dir = join(opts.dir ?? CANDIDATES_DIR, m.id);
  const toReview = [...dd.created, ...dd.changed] as Candidate[];
  const blocked = toReview.filter((c) => c.problems.length);
  const clean = toReview.filter((c) => !c.problems.length);
  const v = validateCandidates(clean.map((c) => c.record));
  const ev = validateCandidates(evidence.filter((e) => v.valid.some((r) => r.id === (e as { entity_id?: string }).entity_id)));
  const date = retrievedAt.slice(0, 10);
  const header = (entity: string, title: string) => ({ id: `ing-${m.id}-${entity.replace(/_/g, '-')}`, title, description: `Candidates from ${m.name} (${m.publisher}), retrieved ${date}. NOT master data until reviewed and merged.`, entity, version: '0.0.1', last_updated: date, data_type: m.data_type, source_ids: [source.id] });

  const report = [
    `# Ingestion review — ${m.name}`,
    '',
    `Source \`${m.id}\` · ${m.kind} ${m.location} · retrieved ${retrievedAt} · sha256 \`${sha256.slice(0, 16)}…\``,
    `Licence: ${m.license} · permission basis: ${m.permission.basis} (reviewed ${m.permission.reviewed_at} by ${m.permission.reviewed_by})`,
    '',
    `| New | Changed (CONFLICTED vs master) | Unchanged | Rows with problems | Schema-invalid | Evidence |`,
    `|---|---|---|---|---|---|`,
    `| ${dd.created.length} | ${dd.changed.length} | ${dd.unchanged.length} | ${blocked.length} | ${v.invalid.length} | ${ev.valid.length} |`,
    '',
    '## Reviewer checklist',
    '',
    '- [ ] Values match the source document (spot-check the evidence excerpts)',
    '- [ ] Units and original text preserved; conversions correct',
    '- [ ] Conflicts with master resolved field by field (keep master, take source, or mark CONFLICTED)',
    '- [ ] Licence permits storing these facts in a public repository',
    '- [ ] No confidential or personal data',
    '',
    ...(dd.changed.length ? ['## Differences from master', '', ...dd.changed.flatMap((c) => [`### ${c.record.id}`, ...c.diffs.map((d) => `- **${d.field}**: master \`${JSON.stringify(d.master)}\` → source \`${JSON.stringify(d.source)}\``), ''])] : []),
    ...(blocked.length ? ['## Rows held back (problems)', '', ...blocked.map((c) => `- row ${c.row.index + 1} (${c.row.key}): ${c.problems.join('; ')}`), ''] : []),
    ...(v.invalid.length ? ['## Schema-invalid candidates', '', ...v.invalid.map((i) => `- ${i.id}: ${i.reason}`), ''] : []),
    ...(dd.duplicatesInBatch.length ? ['## Duplicate rows in the source', '', ...dd.duplicatesInBatch.map((d) => `- ${d.id}: rows ${d.rows.map((r) => r + 1).join(', ')}${d.diffs.length ? ` (disagree on ${d.diffs.map((x) => x.field).join(', ')})` : ''}`), ''] : []),
  ].join('\n');

  if (opts.write !== false) {
    writeJson(join(dir, `${m.target_entity}.json`), { dataset: header(m.target_entity, `${m.name} — ${m.target_entity} candidates`), records: v.valid });
    writeJson(join(dir, 'evidence.json'), { dataset: header('evidence', `${m.name} — evidence`), records: ev.valid });
    writeJson(join(dir, 'source.json'), { dataset: header('source', `${m.name} — source`), records: [source] });
    writeFileSync(join(dir, 'REVIEW.md'), report + '\n');
  }
  return { dir, report, counts: { created: dd.created.length, changed: dd.changed.length, unchanged: dd.unchanged.length, invalid: v.invalid.length, evidence: ev.valid.length, rowProblems: blocked.length } };
}
