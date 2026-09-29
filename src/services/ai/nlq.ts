import type { AnyRecord } from '../../domain';
import type { Part } from '../../domain/engineering';
import { productTypeLabel } from '../../domain/engineering';
import type { SpecDefs } from '../eng/specs';
import { parsePartQuery } from '../eng/partSearch';

/*
 * NATURAL LANGUAGE → CONTROLLED QUERY (AI master prompt §84). A question is compiled into a small,
 * whitelisted filter object that is shown to the user and executed in memory. There is no SQL, no
 * eval and no field outside the whitelist — a language model (when connected) may only propose this
 * object, which is validated against the same whitelist before it runs.
 */

export type QueryEntity = 'supplier' | 'company' | 'part';
export interface ControlledFilter {
  field: 'country' | 'category' | 'product_type' | 'capability' | 'name';
  op: 'contains' | 'in';
  value: string | string[];
  label: string;
}
export interface ControlledQuery {
  entities: QueryEntity[];
  filters: ControlledFilter[];
  limit: number;
}

const FIELDS: Record<QueryEntity, ControlledFilter['field'][]> = {
  supplier: ['country', 'category', 'capability', 'name'],
  company: ['country', 'capability', 'name'],
  part: ['country', 'product_type', 'name'],
};

const COUNTRIES: [RegExp, string][] = [
  [/\b(india|indian)\b/i, 'India'],
  [/\b(germany|german)\b/i, 'Germany'],
  [/\b(japan|japanese)\b/i, 'Japan'],
  [/\b(china|chinese)\b/i, 'China'],
  [/\b(usa|u\.s\.|united states|american)\b/i, 'USA'],
  [/\b(korea|korean)\b/i, 'Korea'],
  [/\b(taiwan|taiwanese)\b/i, 'Taiwan'],
  [/\b(switzerland|swiss)\b/i, 'Switzerland'],
  [/\b(italy|italian)\b/i, 'Italy'],
];

/** Compile a question. Returns null when it is not a supplier / manufacturer / part lookup. */
export function compileQuery(q: string, defs: SpecDefs): ControlledQuery | null {
  const wantsSupplier = /\b(suppliers?|vendors?|manufacturers?|makers?|who (makes|supplies|sells))\b/i.test(q);
  const parsed = parsePartQuery(q, defs);
  if (!wantsSupplier && !parsed.types.length) return null;
  const entities: QueryEntity[] = wantsSupplier ? ['supplier', 'company'] : ['part'];
  const filters: ControlledFilter[] = [];
  const c = COUNTRIES.find(([re]) => re.test(q));
  if (c) filters.push({ field: 'country', op: 'contains', value: c[1], label: `country contains “${c[1]}”` });
  if (parsed.types.length) {
    if (wantsSupplier) filters.push({ field: 'capability', op: 'in', value: parsed.types, label: `makes or supplies ${parsed.types.map(productTypeLabel).join(' / ')}` });
    else filters.push({ field: 'product_type', op: 'in', value: parsed.types, label: `type ${parsed.types.map(productTypeLabel).join(' / ')}` });
  }
  return validate({ entities, filters, limit: 50 });
}

/** Whitelist check — the only gate any query (rule-built or model-proposed) passes through. */
export function validate(cq: ControlledQuery): ControlledQuery {
  const entities = cq.entities.filter((e): e is QueryEntity => e in FIELDS);
  const filters = cq.filters.filter((f) => entities.some((e) => FIELDS[e].includes(f.field)) && ['contains', 'in'].includes(f.op) && (typeof f.value === 'string' ? f.value.length <= 80 : Array.isArray(f.value) && f.value.length <= 20));
  return { entities, filters, limit: Math.min(200, Math.max(1, cq.limit | 0)) };
}

export interface ControlledRow {
  record: AnyRecord;
  reasons: string[];
}

const TYPE_WORDS: Record<string, RegExp> = {
  galvo: /galvo|scan/i,
  f_theta: /optic|lens|f-theta/i,
  laser_source: /laser|photonic/i,
  camera: /vision|camera/i,
  servo_motor: /motion|servo|drive/i,
  servo_drive: /motion|servo|drive/i,
  linear_stage: /motion|linear/i,
  plc: /control|plc|automation/i,
  robot: /robot/i,
  chiller: /chill|thermal|cool/i,
  light_curtain: /safety/i,
};

export function runQuery(cq: ControlledQuery, records: AnyRecord[]): ControlledRow[] {
  const parts = records.filter((r) => r.entity === 'part') as (AnyRecord & Part)[];
  const byId = new Map(records.map((r) => [r.id, r]));
  const rows: ControlledRow[] = [];
  const country = cq.filters.find((f) => f.field === 'country')?.value as string | undefined;
  const types = (cq.filters.find((f) => f.field === 'capability' || f.field === 'product_type')?.value as string[] | undefined) ?? [];
  for (const r of records) {
    if (!cq.entities.includes(r.entity as QueryEntity)) continue;
    const x = r as AnyRecord & Record<string, unknown>;
    const reasons: string[] = [];
    if (r.entity === 'part') {
      const p = r as AnyRecord & Part;
      if (types.length && !types.includes(p.product_type)) continue;
      if (types.length) reasons.push(productTypeLabel(p.product_type));
      if (country) {
        const m = p.manufacturer_id ? byId.get(p.manufacturer_id) : undefined;
        const ct = String((m as Record<string, unknown> | undefined)?.country ?? p.country_of_origin ?? '');
        if (!ct.toLowerCase().includes(country.toLowerCase())) continue;
        reasons.push(`manufacturer country ${ct}`);
      }
    } else {
      if (country) {
        const ct = String(x.country ?? '');
        if (!ct.toLowerCase().includes(country.toLowerCase())) continue;
        reasons.push(`country ${ct}`);
      }
      if (types.length) {
        const made = parts.filter((p) => p.manufacturer_id === r.id && types.includes(p.product_type));
        const hay = `${x.category ?? ''} ${((x.capabilities as string[] | undefined) ?? []).join(' ')} ${((x.products as string[] | undefined) ?? []).join(' ')} ${((x.technologies as string[] | undefined) ?? []).join(' ')}`;
        const byWord = types.some((t) => TYPE_WORDS[t]?.test(hay));
        if (!made.length && !byWord) continue;
        if (made.length) reasons.push(`manufactures ${made.map((p) => p.model_number).join(', ')}`);
        else reasons.push(`category / capabilities “${hay.trim().slice(0, 60)}”`);
      }
    }
    rows.push({ record: r, reasons });
    if (rows.length >= cq.limit) break;
  }
  return rows;
}
