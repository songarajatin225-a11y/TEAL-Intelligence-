/**
 * NORMALIZE PRODUCT (spec §24, §87, §100): parsed fields → a candidate record of the manifest's
 * target entity, with id, provenance and data type. Required fields the source does not provide
 * are left null/UNKNOWN where the schema allows it, otherwise the row is reported — never guessed.
 */
import type { AnyRecord } from '../../src/domain';
import type { SourceManifest } from './manifest';
import { companyDisplayName, companyId, companyKey } from './normalizeCompany';
import type { ParsedRow } from './parseProduct';

export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'x';

export const sourceIdFor = (m: Pick<SourceManifest, 'id'>) => `src-ing-${m.id}`;

export interface Candidate {
  record: AnyRecord;
  row: ParsedRow;
  problems: string[];
}

export function sourceRecord(m: SourceManifest, retrievedAt: string): AnyRecord {
  return {
    id: sourceIdFor(m),
    entity: 'source',
    name: m.name,
    kind: m.kind === 'http' ? 'web' : 'dataset',
    url: m.kind === 'http' ? m.location : undefined,
    publisher: m.publisher,
    retrieved_at: retrievedAt.slice(0, 10),
    terms_note: `${m.license} · basis: ${m.permission.basis} · reviewed ${m.permission.reviewed_at} by ${m.permission.reviewed_by}${m.terms_url ? ` · terms: ${m.terms_url}` : ''}`,
    data_type: m.data_type,
    provenance: { verification_status: 'SOURCE_DOCUMENTED', retrieved_at: retrievedAt.slice(0, 10), note: 'Source registered by the ingestion pipeline from a reviewed manifest.' },
    tags: ['ingested'],
  } as AnyRecord;
}

export function normalizeProduct(row: ParsedRow, m: SourceManifest, retrievedAt: string): Candidate {
  const f = { ...row.fields } as Record<string, unknown>;
  const problems = [...row.problems];
  const s = (k: string) => (typeof f[k] === 'string' ? (f[k] as string) : undefined);
  const provenance = {
    source_id: sourceIdFor(m),
    ...(m.kind === 'http' ? { source_url: m.location } : {}),
    document: m.name,
    section: `row ${row.index + 1}: ${row.key}`,
    retrieved_at: retrievedAt.slice(0, 10),
    verification_status: 'SOURCE_DOCUMENTED' as const,
    confidence: 'MEDIUM' as const,
    note: `Ingested from ${m.publisher}; not yet reviewed by TEAL engineering.`,
  };
  const base = { data_type: m.data_type, provenance, tags: ['ingested', m.id] };
  let record: Record<string, unknown>;

  switch (m.target_entity) {
    case 'company': {
      const name = companyDisplayName(s('name') ?? row.key);
      record = { ...f, id: companyId(name), entity: 'company', name, roles: Array.isArray(f.roles) ? f.roles : ['manufacturer'], ...base };
      break;
    }
    case 'laser_source': {
      const manufacturer = s('manufacturer') ? companyDisplayName(s('manufacturer')!) : null;
      const model = s('model') ?? null;
      if (!model) problems.push('model missing');
      if (!f.mode) problems.push('mode (cw / pulsed) missing — map a column or set a reviewed constant');
      record = {
        categories: [],
        wavelength: { value: null, unit: 'nm', status: 'UNKNOWN' },
        m2: null,
        beam_diameter_mm: null,
        ...f,
        id: `las-${manufacturer ? companyKey(manufacturer) : 'unknown'}-${slug(model ?? row.key)}`,
        entity: 'laser_source',
        kind: 'product',
        name: [manufacturer, model].filter(Boolean).join(' ') || row.key,
        manufacturer,
        ...(manufacturer ? { manufacturer_id: companyId(manufacturer) } : {}),
        model,
        ...base,
      };
      break;
    }
    case 'optic': {
      const manufacturer = s('manufacturer') ? companyDisplayName(s('manufacturer')!) : null;
      if (!f.optic_type) problems.push('optic_type missing');
      record = { focal_length_mm: null, ...f, id: `opt-${manufacturer ? companyKey(manufacturer) : 'unknown'}-${slug(s('model') ?? row.key)}`, entity: 'optic', name: [manufacturer, s('model')].filter(Boolean).join(' ') || row.key, manufacturer, ...base };
      break;
    }
    case 'galvo': {
      const manufacturer = s('manufacturer') ? companyDisplayName(s('manufacturer')!) : null;
      record = { ...f, id: `gal-${manufacturer ? companyKey(manufacturer) : 'unknown'}-${slug(s('model') ?? row.key)}`, entity: 'galvo', name: [manufacturer, s('model')].filter(Boolean).join(' ') || row.key, manufacturer, ...base };
      break;
    }
    case 'component': {
      for (const k of ['code', 'category', 'item_class', 'uom', 'currency']) if (!f[k]) problems.push(`${k} missing`);
      record = { price: null, ...f, id: `itm-${slug(s('code') ?? row.key)}`, entity: 'component', name: s('name') ?? s('code') ?? row.key, price_basis: f.price != null ? 'CATALOGUE' : 'UNKNOWN', ...base };
      break;
    }
  }
  return { record: record as AnyRecord, row, problems };
}
