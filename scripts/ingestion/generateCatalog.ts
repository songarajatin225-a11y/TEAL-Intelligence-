/**
 * Generate /data/catalog.json — the index of every dataset (spec §16, §105).
 *   npm run data:catalog
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR, isConfig, listDatasetFiles, loadDataset, relPath, writeJson } from '../lib/dataset';

export interface CatalogEntry {
  id: string;
  title: string;
  path: string;
  description: string;
  entity: string;
  kind: 'records' | 'config';
  version: string;
  record_count: number;
  last_updated: string;
  schema: string | null;
  source_ids: string[];
  source_version?: string;
  data_type: string;
  partition?: string;
  relative_dates?: boolean;
  sha256: string;
}

export function buildCatalog(): { generated_at: string; datasets: CatalogEntry[] } {
  const datasets: CatalogEntry[] = listDatasetFiles().map((p) => {
    const d = loadDataset(p);
    const h = d.dataset as unknown as Record<string, unknown>;
    const config = isConfig(d);
    return {
      id: String(h.id),
      title: String(h.title),
      path: relPath(p).replace(/^data\//, ''),
      description: String(h.description),
      entity: String(h.entity),
      kind: config ? 'config' : 'records',
      version: String(h.version),
      record_count: config ? 0 : (d as { records: unknown[] }).records.length,
      last_updated: String(h.last_updated),
      schema: config ? null : `schemas/${String(h.entity)}.schema.json`,
      source_ids: (h.source_ids as string[]) ?? [],
      ...(h.source_version ? { source_version: String(h.source_version) } : {}),
      data_type: String(h.data_type),
      ...(h.partition ? { partition: String(h.partition) } : {}),
      ...(h.relative_dates ? { relative_dates: true } : {}),
      sha256: createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 16),
    };
  });
  // deterministic: the catalog date is the newest dataset date, so CI can detect a stale catalog
  return { generated_at: datasets.map((d) => d.last_updated).sort().at(-1) ?? '1970-01-01', datasets };
}

const isMain = process.argv[1]?.endsWith('generateCatalog.ts');
if (isMain) {
  const cat = buildCatalog();
  writeJson(join(DATA_DIR, 'catalog.json'), cat);
  console.log(`✔ Catalog: ${cat.datasets.length} datasets, ${cat.datasets.reduce((s, d) => s + d.record_count, 0)} records`);
}
