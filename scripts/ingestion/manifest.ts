/**
 * SOURCE MANIFESTS (spec §21, §100–§101). Every external source the ingestion pipeline may read
 * is declared in ingestion/sources/<id>.json and reviewed in a pull request BEFORE it is enabled:
 * who checked the terms of use / licence, when, and on what basis the data may be used.
 * No manifest → no ingestion. `enabled: false` → no ingestion.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { ROOT, readJson } from '../lib/dataset';

export const SOURCES_DIR = join(ROOT, 'ingestion', 'sources');
export const USER_AGENT = 'TEAL-Intelligence-Ingestion/1.0 (+https://github.com/songarajatin225-a11y/TEAL-Intelligence-)';

const FieldMap = z.union([
  z.string(), // column name, string value
  z.object({
    column: z.string().optional(),
    /** a constant set by the reviewer for every row (recorded in provenance) */
    constant: z.unknown().optional(),
    type: z.enum(['string', 'number', 'quantity', 'list', 'boolean']).default('string'),
    unit: z.string().optional(),
    separator: z.string().optional(),
    /** list only: item type */
    items: z.enum(['string', 'number']).optional(),
  }),
]);
export type FieldMap = z.infer<typeof FieldMap>;

export const SourceManifest = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string(),
  publisher: z.string(),
  kind: z.enum(['file', 'http']),
  /** repo-relative path (file) or https URL (http) */
  location: z.string(),
  format: z.enum(['csv', 'json']),
  /** JSON only: dot path to the array of rows */
  json_path: z.string().optional(),
  target_entity: z.enum(['laser_source', 'optic', 'galvo', 'company', 'component']),
  data_type: z.enum(['PUBLIC', 'EXTERNAL']),
  license: z.string(),
  terms_url: z.string().optional(),
  permission: z.object({
    basis: z.enum(['open-data-licence', 'public-download-permitted', 'licensed-api', 'manufacturer-provided', 'written-permission']),
    reviewed_by: z.string().min(2),
    reviewed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: z.string().optional(),
  }),
  enabled: z.boolean(),
  /** minimum delay between HTTP requests to this host */
  rate_limit_ms: z.number().int().min(1000).default(5000),
  /** target field → source column / typed mapping */
  mapping: z.record(z.string(), FieldMap),
  /** columns that make a row unique at the source (for dedupe and evidence) */
  key_columns: z.array(z.string()).min(1),
});
export type SourceManifest = z.infer<typeof SourceManifest>;

export interface LoadedManifest {
  file: string;
  manifest?: SourceManifest;
  error?: string;
}

export function loadManifests(dir = SOURCES_DIR): LoadedManifest[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .sort()
    .map((f) => {
      const res = SourceManifest.safeParse(readJson(join(dir, f)));
      return res.success ? { file: f, manifest: res.data } : { file: f, error: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
    });
}
