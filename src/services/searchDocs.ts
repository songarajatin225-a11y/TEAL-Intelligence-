import { ENTITY_BY_TYPE, type SearchPartition } from '../domain/registry';

/** A flattened, searchable projection of any record or knowledge section. */
export interface SearchDoc {
  id: string;
  entity: string;
  name: string;
  text: string;
  tags: string;
  data_type: string;
  verification: string;
  partition: SearchPartition;
  /** knowledge sections: `book/file.md#anchor` */
  ref?: string;
  book?: string;
}

function flatten(v: unknown, depth = 0): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (depth > 3) return '';
  if (Array.isArray(v)) return v.map((x) => flatten(x, depth + 1)).join(' ');
  if (typeof v === 'object') return Object.values(v as Record<string, unknown>).map((x) => flatten(x, depth + 1)).join(' ');
  return '';
}

export const SEARCH_FIELDS = ['name', 'text', 'tags'] as const;
export const STORE_FIELDS = ['id', 'entity', 'name', 'data_type', 'verification', 'partition', 'ref', 'book'] as const;

export function recordToSearchDoc(r: Record<string, unknown>): SearchDoc {
  const entity = String(r.entity);
  const def = ENTITY_BY_TYPE[entity];
  const parts: string[] = [String(r.description ?? '')];
  for (const f of def?.searchFields ?? []) parts.push(flatten(r[f]));
  // Entity-specific enrichment so engineering queries ("1064 nm", "50 W", "nanosecond") hit.
  if (entity === 'laser_source') {
    const w = r.wavelength as { value?: number; original?: string } | undefined;
    parts.push(`${w?.value ?? ''} nm ${w?.original ?? ''}`);
    const pd = r.pulse_duration as { value?: number; unit?: string } | null | undefined;
    if (pd?.unit === 'ns' && (pd.value ?? 0) >= 1) parts.push('nanosecond ns pulsed');
    if (pd?.unit === 'ns' && (pd.value ?? 1) < 1 && (pd.value ?? 1) >= 0.001) parts.push('picosecond ps ultrafast');
    if (pd?.unit === 'ns' && (pd.value ?? 1) < 0.001) parts.push('femtosecond fs ultrafast');
    if (Array.isArray(r.average_power_w)) parts.push((r.average_power_w as number[]).map((p) => `${p}W ${p} W`).join(' '));
  }
  if (entity === 'product') {
    parts.push(flatten(r.specs), flatten(r.applications), flatten(r.powers_w).split(' ').map((p) => `${p}W`).join(' '));
    parts.push(flatten(r.source_keys));
  }
  if (entity === 'component') parts.push(String(r.name ?? ''), String(r.spec ?? ''));
  if (entity === 'application') parts.push(String(r.rationale ?? ''));
  return {
    id: String(r.id),
    entity,
    name: String(r.name ?? r.id),
    text: parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').slice(0, 4000),
    tags: flatten(r.tags),
    data_type: String(r.data_type ?? ''),
    verification: String((r.provenance as { verification_status?: string } | undefined)?.verification_status ?? ''),
    partition: def?.partition ?? 'records',
  };
}

/** MiniSearch options shared by build-time indexing and runtime loading (must match). */
export const MINISEARCH_OPTIONS = {
  fields: [...SEARCH_FIELDS],
  storeFields: [...STORE_FIELDS],
  searchOptions: { boost: { name: 3, tags: 1.5 }, prefix: true, fuzzy: 0.2 },
  // Keep engineering tokens like "1064nm", "50w", "co2", "ns" intact; split units from numbers too.
  tokenize: (text: string) => {
    const base = text.toLowerCase().split(/[^a-z0-9µ²₂.+-]+/u).filter(Boolean);
    const extra: string[] = [];
    for (const t of base) {
      const m = /^(\d+(?:\.\d+)?)([a-zµ]+)$/u.exec(t);
      if (m) extra.push(m[1], m[2]);
      if (t.includes('₂')) extra.push(t.replace('₂', '2'));
    }
    return [...base, ...extra].map((t) => t.replace(/^[.+-]+|[.+-]+$/g, '')).filter(Boolean);
  },
};
