/**
 * PARSE (spec §100): raw snapshot → rows → typed candidate fields, using only the manifest mapping.
 * Nothing is inferred: an unmapped or unreadable value stays absent/null and is reported.
 * Every value keeps the original cell text for the evidence ledger.
 */
import { convert, isKnownUnit, parseQuantity } from '../../src/calculations/units';
import { parseCsv } from '../../src/utils/export';
import type { FieldMap, SourceManifest } from './manifest';

export interface ParsedRow {
  index: number;
  key: string;
  fields: Record<string, unknown>;
  /** field → original source text (or "manifest constant") */
  excerpts: Record<string, string>;
  problems: string[];
}

export function parseRows(text: string, m: Pick<SourceManifest, 'format' | 'json_path'>): Record<string, unknown>[] {
  if (m.format === 'csv') return parseCsv(text);
  let v: unknown = JSON.parse(text);
  for (const k of (m.json_path ?? '').split('.').filter(Boolean)) v = (v as Record<string, unknown>)?.[k];
  if (!Array.isArray(v)) throw new Error(`json_path "${m.json_path ?? ''}" does not point to an array`);
  return v as Record<string, unknown>[];
}

const str = (v: unknown) => (v == null ? '' : String(v)).trim();

function convertField(spec: FieldMap, row: Record<string, unknown>): { value: unknown; excerpt: string; problem?: string } {
  const s = typeof spec === 'string' ? { column: spec, type: 'string' as const } : spec;
  if (s.constant !== undefined) return { value: s.constant, excerpt: 'manifest constant (set by the reviewer)' };
  const cell = str(row[s.column ?? '']);
  if (!cell || /^(n\/?a|-|—|tbd|unknown)$/i.test(cell)) return { value: undefined, excerpt: cell };
  switch (s.type) {
    case 'number': {
      const n = parseFloat(cell.replace(/,/g, ''));
      return Number.isFinite(n) ? { value: n, excerpt: cell } : { value: null, excerpt: cell, problem: `"${cell}" is not a number` };
    }
    case 'quantity': {
      const q = parseQuantity(cell) ?? (Number.isFinite(parseFloat(cell)) && s.unit ? { value: parseFloat(cell), unit: s.unit, original: cell } : null);
      if (!q) return { value: { value: null, unit: s.unit ?? '', original: cell, status: 'UNKNOWN' }, excerpt: cell, problem: `"${cell}" could not be read as a quantity` };
      let value = q.value;
      let unit = q.unit || s.unit || '';
      if (s.unit && q.unit && q.unit !== s.unit && isKnownUnit(q.unit) && isKnownUnit(s.unit)) {
        try {
          value = convert(q.value, q.unit, s.unit);
          unit = s.unit;
        } catch {
          return { value: { value: null, unit: s.unit, original: cell, status: 'CONFLICTED' }, excerpt: cell, problem: `unit ${q.unit} is not convertible to ${s.unit}` };
        }
      }
      return { value: { value, unit, original: cell, status: 'SOURCE_DOCUMENTED' }, excerpt: cell };
    }
    case 'list': {
      const parts = cell.split(s.separator ?? /[;|]/).map((x) => x.trim()).filter(Boolean);
      if (s.items !== 'number') return { value: parts, excerpt: cell };
      const nums = parts.map((x) => parseFloat(x.replace(/,/g, '')));
      return nums.every(Number.isFinite) ? { value: nums, excerpt: cell } : { value: undefined, excerpt: cell, problem: `"${cell}" is not a list of numbers` };
    }
    case 'boolean':
      return { value: /^(y|yes|true|1)$/i.test(cell), excerpt: cell };
    default:
      return { value: cell, excerpt: cell };
  }
}

export function parseProduct(rows: Record<string, unknown>[], m: SourceManifest): ParsedRow[] {
  return rows.map((row, index) => {
    const fields: Record<string, unknown> = {};
    const excerpts: Record<string, string> = {};
    const problems: string[] = [];
    for (const [field, spec] of Object.entries(m.mapping)) {
      const r = convertField(spec, row);
      if (r.value !== undefined) {
        fields[field] = r.value;
        excerpts[field] = r.excerpt;
      }
      if (r.problem) problems.push(`${field}: ${r.problem}`);
    }
    const key = m.key_columns.map((c) => str(row[c])).join(' | ');
    if (!key.replace(/[\s|]/g, '')) problems.push(`row has no value in key columns ${m.key_columns.join(', ')}`);
    return { index, key, fields, excerpts, problems };
  });
}
