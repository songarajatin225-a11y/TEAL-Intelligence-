import { convert, fmtNum, isKnownUnit } from '../../calculations/units';
import type { AnyRecord } from '../../domain';
import type { Part, SpecDefinition, SpecValue } from '../../domain/engineering';

/*
 * SPECIFICATION ENGINE (master prompt §12, §13, §46, §48–§50, §109, §110).
 * Specifications are rows (SpecValue) named by a data-driven definition (SpecDefinition). Values are
 * normalised to the definition's canonical unit at read time — the original value, unit and text are
 * never overwritten. Every read carries its evidence.
 */

export type SpecDefs = Map<string, SpecDefinition>;
export const specDefs = (records: AnyRecord[]): SpecDefs => new Map(records.filter((r) => r.entity === 'spec_definition').map((r) => [(r as unknown as SpecDefinition).key, r as unknown as SpecDefinition]));

export interface NormalizedSpec {
  key: string;
  def?: SpecDefinition;
  entry: SpecValue;
  /** canonical value (nominal) and range, in def.canonical_unit */
  value: number | null;
  min: number | null;
  max: number | null;
  unit: string;
  text: string | null;
  /** original as published */
  original: string;
  error?: string;
}

const toCanon = (n: number | null | undefined, from: string | undefined, def?: SpecDefinition): { v: number | null; error?: string } => {
  if (n == null || !Number.isFinite(n)) return { v: null };
  const canon = def?.canonical_unit;
  if (!canon || !from || from === canon) return { v: n };
  try {
    return { v: convert(n, from, canon) };
  } catch (e) {
    return { v: null, error: (e as Error).message };
  }
};

export function normalizeEntry(entry: SpecValue, def?: SpecDefinition): NormalizedSpec {
  const a = toCanon(entry.value, entry.unit, def);
  const lo = toCanon(entry.min, entry.unit, def);
  const hi = toCanon(entry.max, entry.unit, def);
  const unit = def?.canonical_unit ?? entry.unit ?? '';
  const original = entry.original ?? (entry.text != null ? entry.text : entry.value != null ? `${entry.value} ${entry.unit ?? ''}`.trim() : entry.min != null || entry.max != null ? `${entry.min ?? '?'}–${entry.max ?? '?'} ${entry.unit ?? ''}`.trim() : 'Not Available');
  return { key: entry.spec, def, entry, value: a.v, min: lo.v, max: hi.v, unit, text: entry.text ?? null, original, error: a.error ?? lo.error ?? hi.error };
}

/* ---------------------------------------------------------------- sources, confidence */

/** §109 source priority (1 = most authoritative). Derived from the source type and kind. */
export function sourcePriority(src?: AnyRecord): number {
  if (!src) return 10;
  const type = String(src.source_type ?? '');
  const kind = String(src.kind ?? '');
  const name = String(src.name ?? '').toLowerCase();
  if (type === 'Manufacturer') return kind === 'datasheet' ? (/manual/.test(name) ? 3 : /application note|app note/.test(name) ? 4 : 2) : 1;
  if (type === 'Distributor') return 5;
  if (type === 'Technical Paper' || kind === 'paper') return 6;
  if (type === 'Research') return 7;
  if (type === 'Industry Report' || type === 'Standard' || type === 'Government') return 8;
  if (type === 'TEAL Internal' || kind === 'handbook' || kind === 'internal') return 6;
  return 9;
}
export const PRIORITY_LABEL: Record<number, string> = { 1: 'Manufacturer', 2: 'Official datasheet', 3: 'Official manual', 4: 'Official application note', 5: 'Authorized distributor', 6: 'Technical publication', 7: 'Research paper', 8: 'Industry source', 9: 'Third-party source', 10: 'No source' };

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export type Freshness = 'fresh' | 'due' | 'stale' | 'unknown';
/** §110 — stale after 365 days without verification, or once next_review has passed. */
export function freshness(p: { last_verified?: string; retrieved_at?: string; next_review?: string }, today: string): Freshness {
  if (p.next_review && p.next_review < today) return 'stale';
  const d = p.last_verified ?? p.retrieved_at;
  if (!d) return 'unknown';
  const age = daysBetween(d.slice(0, 10), today);
  return age > 365 ? 'stale' : age > 300 ? 'due' : 'fresh';
}

/** Pick the entry the UI shows first: lowest source priority number, then verified, then newest. */
export function primaryEntry(entries: SpecValue[], byId: Map<string, AnyRecord>): SpecValue | undefined {
  return [...entries].sort((x, y) => sourcePriority(byId.get(x.source_id ?? '')) - sourcePriority(byId.get(y.source_id ?? '')) || Number(!!y.verified) - Number(!!x.verified) || String(y.last_verified ?? y.retrieved_at ?? '').localeCompare(String(x.last_verified ?? x.retrieved_at ?? '')))[0];
}

export interface SpecRead extends NormalizedSpec {
  all: NormalizedSpec[];
  /** true when two entries from different sources disagree (§47) */
  conflict: boolean;
}

/** Read one specification of a part. Undefined = Not Available. */
export function readSpec(part: Pick<Part, 'specs'>, key: string, defs: SpecDefs, byId: Map<string, AnyRecord> = new Map()): SpecRead | undefined {
  const entries = (part.specs ?? []).filter((s) => s.spec === key);
  if (!entries.length) return undefined;
  const def = defs.get(key);
  const all = entries.map((e) => normalizeEntry(e, def));
  const primary = primaryEntry(entries, byId)!;
  const p = all[entries.indexOf(primary)];
  return { ...p, all, conflict: valuesDisagree(all) };
}

/** Numbers agree within 1 % (relative); texts agree ignoring case. */
export function valuesDisagree(xs: NormalizedSpec[]): boolean {
  const sources = new Set(xs.map((x) => x.entry.source_id ?? '—'));
  if (xs.length < 2 || sources.size < 2) return false;
  const key = (x: NormalizedSpec) => (x.text != null ? x.text.trim().toLowerCase() : `${x.value ?? ''}|${x.min ?? ''}|${x.max ?? ''}`);
  const nums = xs.map((x) => x.value).filter((n): n is number => n != null);
  if (nums.length === xs.length) {
    const lo = Math.min(...nums);
    const hi = Math.max(...nums);
    return hi - lo > Math.max(Math.abs(hi), Math.abs(lo)) * 0.01;
  }
  return new Set(xs.map(key)).size > 1;
}

/** Canonical nominal number (or null). */
export function specNum(part: Pick<Part, 'specs'>, key: string, defs: SpecDefs): number | null {
  return readSpec(part, key, defs)?.value ?? null;
}
/** Canonical range; a single value is a zero-width range. */
export function specRange(part: Pick<Part, 'specs'>, key: string, defs: SpecDefs): { min: number; max: number } | null {
  const s = readSpec(part, key, defs);
  if (!s) return null;
  if (s.min != null && s.max != null) return { min: s.min, max: s.max };
  if (s.value != null) return { min: s.value, max: s.value };
  return null;
}
export function specText(part: Pick<Part, 'specs'>, key: string): string | null {
  const e = (part.specs ?? []).find((s) => s.spec === key);
  if (!e) return null;
  return e.text ?? (e.value != null ? String(e.value) : null);
}

/** Human display: "1064 nm" or "1030–1090 nm" (canonical), falling back to the original text. */
export function displaySpec(s: NormalizedSpec | undefined): string {
  if (!s) return 'Not Available';
  if (s.text != null) return s.text;
  if (s.min != null && s.max != null) return `${fmtNum(s.min)}–${fmtNum(s.max)} ${s.unit}`.trim();
  if (s.value != null) return `${fmtNum(s.value)} ${s.unit}`.trim();
  return s.original;
}

/* ---------------------------------------------------------------- validation, completeness */

export interface SpecIssue {
  key: string;
  severity: 'error' | 'warning';
  message: string;
}

/** §48 / §136 — invalid units, out-of-range values, unknown parameters, suspicious values. */
export function validateSpecs(part: Pick<Part, 'specs' | 'product_type'>, defs: SpecDefs): SpecIssue[] {
  const out: SpecIssue[] = [];
  for (const e of part.specs ?? []) {
    const def = defs.get(e.spec);
    if (!def) {
      out.push({ key: e.spec, severity: 'warning', message: `“${e.spec}” is not a defined specification — add a definition or rename it` });
      continue;
    }
    const numeric = def.spec_type === 'number' || def.spec_type === 'range';
    const hasNum = e.value != null || e.min != null || e.max != null;
    if (numeric && !hasNum && !e.text) out.push({ key: e.spec, severity: 'error', message: `${def.name}: no value` });
    if (numeric && hasNum && def.canonical_unit && e.unit != null && e.unit !== def.canonical_unit) {
      if (!isKnownUnit(e.unit)) out.push({ key: e.spec, severity: 'error', message: `${def.name}: unknown unit “${e.unit}”` });
      else {
        const n = normalizeEntry(e, def);
        if (n.error) out.push({ key: e.spec, severity: 'error', message: `${def.name}: ${n.error}` });
      }
    }
    if (numeric && hasNum && def.canonical_unit && !e.unit && def.unit_type !== 'none' && def.unit_type !== 'count') out.push({ key: e.spec, severity: 'error', message: `${def.name}: value without a unit` });
    const n = normalizeEntry(e, def);
    for (const x of [n.value, n.min, n.max]) {
      if (x == null) continue;
      if (def.validation?.min != null && x < def.validation.min) out.push({ key: e.spec, severity: 'warning', message: `${def.name}: ${fmtNum(x)} ${n.unit} is below the plausible minimum ${def.validation.min} — check the source` });
      if (def.validation?.max != null && x > def.validation.max) out.push({ key: e.spec, severity: 'warning', message: `${def.name}: ${fmtNum(x)} ${n.unit} is above the plausible maximum ${def.validation.max} — check the source` });
    }
    if (n.min != null && n.max != null && n.min > n.max) out.push({ key: e.spec, severity: 'error', message: `${def.name}: range minimum exceeds maximum` });
    if (def.spec_type === 'enum' && def.enum_values?.length && e.text && !def.enum_values.map((x) => x.toLowerCase()).includes(e.text.toLowerCase())) out.push({ key: e.spec, severity: 'warning', message: `${def.name}: “${e.text}” is not one of ${def.enum_values.join(', ')}` });
    if (!e.source_id) out.push({ key: e.spec, severity: 'warning', message: `${def.name}: no source — field-level evidence is required for external data` });
  }
  return out;
}

/** Key specifications per product type — what a record needs before it is useful for engineering. */
export const KEY_SPECS: Record<string, string[]> = {
  laser_source: ['wavelength', 'average_power', 'm2', 'beam_diameter', 'cooling_method', 'heat_load'],
  galvo: ['aperture', 'wavelength_range', 'max_power', 'marking_speed'],
  f_theta: ['focal_length', 'scan_field_x', 'wavelength_range', 'entrance_beam_diameter', 'working_distance', 'max_power'],
  beam_expander: ['magnification', 'output_beam_diameter', 'wavelength_range'],
  camera: ['megapixel', 'pixel_size', 'sensor_diagonal', 'frame_rate', 'shutter', 'lens_mount'],
  vision_lens: ['focal_length', 'max_sensor_diagonal', 'lens_mount'],
  telecentric_lens: ['magnification', 'max_sensor_diagonal', 'working_distance', 'lens_mount'],
  linear_stage: ['travel', 'payload', 'max_speed', 'positioning_repeatability'],
  servo_motor: ['rated_power', 'rated_torque', 'rated_speed'],
  servo_drive: ['rated_power'],
  robot: ['payload', 'reach', 'positioning_repeatability'],
  chiller: ['cooling_capacity', 'temperature_stability'],
  fume_extraction: ['airflow', 'filter_efficiency'],
  laser_head: ['max_power', 'wavelength_range', 'focal_length'],
};

export interface Completeness {
  present: string[];
  missing: string[];
  pct: number | null;
}
export function completeness(part: Pick<Part, 'specs' | 'product_type'>): Completeness {
  const keys = KEY_SPECS[part.product_type] ?? [];
  if (!keys.length) return { present: [...new Set((part.specs ?? []).map((s) => s.spec))], missing: [], pct: null };
  const have = new Set((part.specs ?? []).map((s) => s.spec));
  const present = keys.filter((k) => have.has(k));
  return { present, missing: keys.filter((k) => !have.has(k)), pct: Math.round((present.length / keys.length) * 100) };
}

/* ---------------------------------------------------------------- confidence (§50) */

export type ConfidenceLevel = 'High' | 'Medium' | 'Low' | 'Unverified';
export interface ConfidenceResult {
  level: ConfidenceLevel;
  factors: { factor: 'source' | 'recency' | 'completeness' | 'verification' | 'consistency'; ok: boolean; detail: string }[];
}

/**
 * Confidence is derived, never typed in: source quality, recency, completeness, verification and
 * consistency. DEMO data and records without any source are Unverified by definition.
 */
export function partConfidence(part: Part & AnyRecord, defs: SpecDefs, byId: Map<string, AnyRecord>, today: string): ConfidenceResult {
  const srcIds = [...new Set([part.provenance?.source_id, ...(part.specs ?? []).map((s) => s.source_id)].filter((x): x is string => !!x))];
  const best = Math.min(10, ...srcIds.map((id) => sourcePriority(byId.get(id))));
  const sources = srcIds.map((id) => byId.get(id)).filter((x): x is AnyRecord => !!x);
  const fr = sources.map((s) => freshness(s as never, today));
  const recent = fr.length > 0 && fr.every((f) => f === 'fresh' || f === 'due');
  const comp = completeness(part);
  const verified = part.record_status === 'Approved' || part.record_status === 'Validated' || part.provenance?.verification_status === 'VERIFIED' || (part.specs ?? []).some((s) => s.verified);
  const conflicts = [...new Set((part.specs ?? []).map((s) => s.spec))].filter((k) => readSpec(part, k, defs, byId)?.conflict);
  const factors: ConfidenceResult['factors'] = [
    { factor: 'source', ok: best <= 2, detail: srcIds.length ? `Best source: ${PRIORITY_LABEL[best] ?? 'Unrated'} (priority ${best})` : 'No source recorded' },
    { factor: 'recency', ok: recent, detail: fr.length ? `Source freshness: ${[...new Set(fr)].join(', ')}` : 'No verification date' },
    { factor: 'completeness', ok: comp.pct == null ? true : comp.pct >= 80, detail: comp.pct == null ? 'No key-specification list for this type' : `${comp.pct}% of key specifications (${comp.missing.length ? `missing ${comp.missing.join(', ')}` : 'none missing'})` },
    { factor: 'verification', ok: verified, detail: verified ? 'Verified or approved' : `Record status ${part.record_status}; no verified specification` },
    { factor: 'consistency', ok: conflicts.length === 0, detail: conflicts.length ? `Sources disagree on ${conflicts.join(', ')}` : 'No source disagreement' },
  ];
  if (!srcIds.length || part.data_type === 'DEMO') return { level: 'Unverified', factors };
  const ok = (f: string) => factors.find((x) => x.factor === f)!.ok;
  if (ok('source') && ok('recency') && ok('verification') && ok('consistency') && ok('completeness')) return { level: 'High', factors };
  if (best <= 6 && ok('consistency') && (ok('recency') || ok('verification'))) return { level: 'Medium', factors };
  return { level: 'Low', factors };
}
