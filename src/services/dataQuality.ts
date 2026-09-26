import { isKnownUnit } from '../calculations/units';
import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { extractRefs } from './refs';

/**
 * DATA QUALITY (spec §104). Shared by CI (scripts/data/dataQuality.ts → /reports) and the
 * in-app Data Quality page (which also covers local drafts).
 * Severity: error fails CI; warning and info are reported.
 */
export interface DQIssue {
  severity: 'error' | 'warning' | 'info';
  check: string;
  id?: string;
  entity?: string;
  message: string;
}

export interface DQReport {
  generated_at: string;
  records: number;
  by_entity: Record<string, number>;
  by_data_type: Record<string, number>;
  by_verification: Record<string, number>;
  checks: Record<string, { errors: number; warnings: number; info: number }>;
  issues: DQIssue[];
  errors: number;
  warnings: number;
}

const STALE_PRICE_DAYS = 180; // legacy cost platform catalogue-discipline rule
const STALE_VERIFY_DAYS = 365;

function walkQuantities(v: unknown, cb: (q: { unit: string }) => void, depth = 0): void {
  if (!v || typeof v !== 'object' || depth > 3) return;
  if (!Array.isArray(v) && 'unit' in (v as object) && 'value' in (v as object)) cb(v as { unit: string });
  for (const x of Array.isArray(v) ? v : Object.values(v as object)) walkQuantities(x, cb, depth + 1);
}

export function runDataQuality(records: AnyRecord[], today = new Date()): DQReport {
  const issues: DQIssue[] = [];
  const ids = new Map<string, number>();
  const by_entity: Record<string, number> = {};
  const by_data_type: Record<string, number> = {};
  const by_verification: Record<string, number> = {};
  const sources = new Set(records.filter((r) => r.entity === 'source').map((r) => r.id));
  const all = new Set(records.map((r) => r.id));
  const names = new Map<string, string>();
  const day = (iso: string) => (today.getTime() - new Date(iso).getTime()) / 864e5;

  for (const r of records) {
    ids.set(r.id, (ids.get(r.id) ?? 0) + 1);
    by_entity[r.entity] = (by_entity[r.entity] ?? 0) + 1;
    by_data_type[r.data_type] = (by_data_type[r.data_type] ?? 0) + 1;
    const vs = r.provenance?.verification_status ?? 'MISSING';
    by_verification[vs] = (by_verification[vs] ?? 0) + 1;

    if (!r.id) issues.push({ severity: 'error', check: 'missing_id', entity: r.entity, message: `Record without id: ${r.name}` });
    if (!ENTITY_BY_TYPE[r.entity]) issues.push({ severity: 'error', check: 'invalid_enum', id: r.id, message: `Unknown entity "${r.entity}"` });

    // broken references
    for (const e of extractRefs(r as Record<string, unknown>)) {
      if (!all.has(e.to)) issues.push({ severity: 'error', check: 'broken_reference', id: r.id, entity: r.entity, message: `${e.field} → ${e.to} does not exist` });
    }
    // sources
    const sid = r.provenance?.source_id;
    if (sid && !sources.has(sid)) issues.push({ severity: 'error', check: 'missing_source', id: r.id, entity: r.entity, message: `provenance.source_id "${sid}" is not a registered source` });
    if (!sid && ['PUBLIC', 'EXTERNAL'].includes(r.data_type) && !r.provenance?.source_url) {
      issues.push({ severity: 'warning', check: 'missing_source', id: r.id, entity: r.entity, message: `${r.data_type} record without source_id or source_url` });
    }
    // units
    walkQuantities(r, (q) => {
      if (!isKnownUnit(q.unit)) issues.push({ severity: 'warning', check: 'invalid_unit', id: r.id, entity: r.entity, message: `Unknown unit "${q.unit}"` });
    });
    // conflicts & unknowns
    if (vs === 'CONFLICTED') issues.push({ severity: 'warning', check: 'conflict', id: r.id, entity: r.entity, message: 'Record marked CONFLICTED' });
    if (vs === 'UNKNOWN') issues.push({ severity: 'info', check: 'unverified', id: r.id, entity: r.entity, message: 'Verification status UNKNOWN' });
    if (r.provenance?.confidence === 'LOW') issues.push({ severity: 'info', check: 'low_confidence', id: r.id, entity: r.entity, message: 'Confidence LOW' });
    // staleness
    const pd = (r as { price_date?: string }).price_date;
    if (pd && day(pd) > STALE_PRICE_DAYS) issues.push({ severity: 'warning', check: 'stale', id: r.id, entity: r.entity, message: `Price dated ${pd} is older than ${STALE_PRICE_DAYS} days` });
    const lv = r.provenance?.last_verified;
    if (lv && day(lv) > STALE_VERIFY_DAYS) issues.push({ severity: 'warning', check: 'stale', id: r.id, entity: r.entity, message: `Last verified ${lv} (> ${STALE_VERIFY_DAYS} days)` });
    // duplicates by name within entity (possible duplicate records)
    const nk = `${r.entity}|${String(r.name).toLowerCase().trim()}`;
    if (names.has(nk) && names.get(nk) !== r.id) issues.push({ severity: 'warning', check: 'duplicate', id: r.id, entity: r.entity, message: `Same name as ${names.get(nk)}` });
    else names.set(nk, r.id);
    // FX without a date
    if (r.entity === 'reference' && (r as { table?: string }).table === 'fx' && !(r as { values?: { as_of?: string | null } }).values?.as_of) {
      issues.push({ severity: 'warning', check: 'missing_date', id: r.id, entity: r.entity, message: 'FX rate has no as-of date' });
    }
  }
  for (const [id, n] of ids) if (n > 1) issues.push({ severity: 'error', check: 'duplicate', id, message: `id appears ${n} times` });

  const checks: DQReport['checks'] = {};
  for (const i of issues) {
    checks[i.check] ??= { errors: 0, warnings: 0, info: 0 };
    checks[i.check][i.severity === 'error' ? 'errors' : i.severity === 'warning' ? 'warnings' : 'info']++;
  }
  return {
    generated_at: today.toISOString(),
    records: records.length,
    by_entity,
    by_data_type,
    by_verification,
    checks,
    issues,
    errors: issues.filter((i) => i.severity === 'error').length,
    warnings: issues.filter((i) => i.severity === 'warning').length,
  };
}

export function reportMarkdown(r: DQReport): string {
  const row = (o: Record<string, number>) =>
    Object.entries(o)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `| ${k} | ${v} |`)
      .join('\n');
  return [
    '# Data quality report',
    '',
    `Generated ${r.generated_at} · ${r.records} records · **${r.errors} errors** · ${r.warnings} warnings`,
    '',
    '## Checks',
    '',
    '| Check | Errors | Warnings | Info |',
    '|---|---|---|---|',
    ...Object.entries(r.checks).map(([k, v]) => `| ${k} | ${v.errors} | ${v.warnings} | ${v.info} |`),
    '',
    '## Records by data type',
    '',
    '| Data type | Records |',
    '|---|---|',
    row(r.by_data_type),
    '',
    '## Records by verification status',
    '',
    '| Verification | Records |',
    '|---|---|',
    row(r.by_verification),
    '',
    '## Errors and warnings',
    '',
    ...(r.issues.filter((i) => i.severity !== 'info').length
      ? r.issues.filter((i) => i.severity !== 'info').slice(0, 300).map((i) => `- **${i.severity}** \`${i.check}\` ${i.id ?? ''}: ${i.message}`)
      : ['None.']),
    '',
  ].join('\n');
}
