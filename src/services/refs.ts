import type { EdgeType } from '../domain/common';

/**
 * Reference extraction — the heart of the digital thread. Every typed reference field
 * (`*_id`, `*_ids`, `links[]`, module keys on products/configurations) becomes an edge.
 * Used by the build-time graph generator, the data-quality checker and the in-browser graph.
 */
export interface RefEdge {
  from: string;
  to: string;
  rel: EdgeType;
  field: string;
}

const REL_BY_FIELD: Record<string, EdgeType> = {
  customer_id: 'belongs_to',
  company_id: 'belongs_to',
  opportunity_id: 'belongs_to',
  project_id: 'belongs_to',
  family_id: 'belongs_to',
  product_id: 'uses',
  configuration_id: 'uses',
  recommended_source_id: 'uses',
  optic_id: 'uses',
  material_id: 'uses',
  material_ids: 'applies_to',
  application_id: 'applies_to',
  application_ids: 'applies_to',
  industries: 'applies_to',
  supplier_id: 'supplied_by',
  supplier_ids: 'supplied_by',
  alternate_supplier_ids: 'supplied_by',
  module_id: 'built_from',
  module_ids: 'built_from',
  bom_id: 'built_from',
  poc_id: 'tested_by',
  doe_id: 'tested_by',
  requirement_id: 'requires',
  dependencies: 'requires',
  evidence_ids: 'validated_by',
  entity_id: 'evidence_for',
  parent_id: 'derived_from',
  variant_of: 'derived_from',
  alternate_ids: 'similar_to',
  compatible_optic_ids: 'compatible_with',
  compatible_source_ids: 'compatible_with',
  manufacturer_id: 'manufactures',
  machine_id: 'references',
  cost_model_id: 'references',
  affected_ids: 'references',
  product_ids: 'manufactures',
};

const ID_RE = /^[a-z]{2,6}-[A-Za-z0-9][A-Za-z0-9._-]*$/;

function relFor(field: string, target: string): EdgeType {
  if (field === 'source_id' && target.startsWith('las-')) return 'uses';
  if (field === 'source_id') return 'derived_from';
  return REL_BY_FIELD[field] ?? 'references';
}

/** Extract all outgoing references of a record (excluding provenance, which is `derived_from` a source). */
export function extractRefs(record: Record<string, unknown>): RefEdge[] {
  const from = String(record.id);
  const out: RefEdge[] = [];
  const push = (field: string, v: unknown) => {
    if (typeof v === 'string' && ID_RE.test(v) && v !== from) out.push({ from, to: v, rel: relFor(field, v), field });
  };
  const walk = (obj: Record<string, unknown>, path: string, depth: number) => {
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'provenance' || k === 'id') continue;
      const fp = path ? `${path}.${k}` : k;
      if (k.endsWith('_id') || k === 'variant_of' || k === 'entity_id') push(k, v);
      else if ((k.endsWith('_ids') || k === 'dependencies') && Array.isArray(v)) v.forEach((x) => push(k, x));
      else if (k === 'industries' && Array.isArray(v)) v.forEach((x) => typeof x === 'string' && x.startsWith('ind-') && push(k, x));
      else if (k === 'links' && Array.isArray(v)) {
        for (const l of v as { rel?: EdgeType; target?: string }[]) {
          if (l?.target && ID_RE.test(l.target)) out.push({ from, to: l.target, rel: l.rel ?? 'references', field: 'links' });
        }
      } else if (depth < 2 && v && typeof v === 'object') {
        if (Array.isArray(v)) v.forEach((x) => x && typeof x === 'object' && walk(x as Record<string, unknown>, fp, depth + 1));
        else walk(v as Record<string, unknown>, fp, depth + 1);
      }
    }
  };
  walk(record, '', 0);

  // Module keys on products and configurations → module records
  const entity = record.entity;
  if (entity === 'product') {
    for (const k of (record.standard_content as string[] | undefined) ?? []) out.push({ from, to: `mod-${k}`, rel: 'built_from', field: 'standard_content' });
    for (const k of (record.source_keys as string[] | undefined) ?? []) out.push({ from, to: `las-${k}`, rel: 'compatible_with', field: 'source_keys' });
    for (const k of (record.lens_keys as string[] | undefined) ?? []) out.push({ from, to: `opt-${k}`, rel: 'compatible_with', field: 'lens_keys' });
  }
  if (entity === 'configuration') {
    for (const k of (record.modules as string[] | undefined) ?? []) out.push({ from, to: `mod-${k}`, rel: 'built_from', field: 'modules' });
    for (const k of (record.extras as string[] | undefined) ?? []) out.push({ from, to: `mod-${k}`, rel: 'built_from', field: 'extras' });
    if (typeof record.software === 'string') out.push({ from, to: `mod-${record.software}`, rel: 'built_from', field: 'software' });
    if (typeof record.source_key === 'string') out.push({ from, to: `las-${record.source_key}`, rel: 'uses', field: 'source_key' });
    if (typeof record.lens_key === 'string') out.push({ from, to: `opt-${record.lens_key}`, rel: 'uses', field: 'lens_key' });
  }
  if (entity === 'module_conflict') {
    push('a', record.a);
    push('b', record.b);
  }
  if (entity === 'bom') {
    for (const l of (record.lines as { module_id?: string }[] | undefined) ?? []) if (l.module_id) push('module_id', l.module_id);
  }
  // de-duplicate
  const seen = new Set<string>();
  return out.filter((e) => {
    const k = `${e.to}|${e.rel}|${e.field}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function provenanceSource(record: Record<string, unknown>): string | undefined {
  const p = record.provenance as { source_id?: string } | undefined;
  return p?.source_id;
}
