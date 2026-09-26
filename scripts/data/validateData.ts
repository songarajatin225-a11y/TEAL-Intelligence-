/**
 * Validate every dataset in /data against the domain schemas.
 * Fails (exit 1) on: invalid JSON, invalid header, schema errors, duplicate ids, id prefix
 * that does not match the entity, entity mismatch with the dataset header.
 *
 *   npm run data:validate
 */
import { DatasetHeader } from '../../src/domain/common';
import { ENTITY_BY_TYPE } from '../../src/domain/registry';
import { type AnyDataset, isConfig, listDatasetFiles, readJson, relPath, resolveRelativeDates } from '../lib/dataset';

export interface ValidationIssue {
  file: string;
  id?: string;
  path?: string;
  message: string;
}

export function validateAll(): { errors: ValidationIssue[]; files: number; records: number } {
  const errors: ValidationIssue[] = [];
  const ids = new Map<string, string>();
  let records = 0;
  const files = listDatasetFiles();
  for (const path of files) {
    const file = relPath(path);
    let ds: AnyDataset;
    try {
      ds = readJson<AnyDataset>(path);
    } catch (e) {
      errors.push({ file, message: `Invalid JSON: ${(e as Error).message}` });
      continue;
    }
    const kind = (ds as { dataset?: { kind?: string } }).dataset?.kind;
    const hdr = DatasetHeader.safeParse(ds.dataset);
    if (!hdr.success) {
      errors.push({ file, message: `Invalid dataset header: ${hdr.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}` });
      continue;
    }
    if (isConfig(ds) || kind === 'config') {
      if (!ds || typeof (ds as { config?: unknown }).config !== 'object') errors.push({ file, message: 'Config dataset without `config` object' });
      continue;
    }
    if (!Array.isArray(ds.records)) {
      errors.push({ file, message: 'Records dataset without `records` array' });
      continue;
    }
    const def = ENTITY_BY_TYPE[ds.dataset.entity];
    if (!def) {
      errors.push({ file, message: `Unknown entity "${ds.dataset.entity}" in header` });
      continue;
    }
    const rows = ds.dataset.relative_dates ? resolveRelativeDates(ds.records) : ds.records;
    for (const [i, raw] of rows.entries()) {
      records++;
      const id = String((raw as { id?: unknown }).id ?? `#${i}`);
      if ((raw as { entity?: string }).entity !== ds.dataset.entity) {
        errors.push({ file, id, message: `entity "${(raw as { entity?: string }).entity}" does not match dataset entity "${ds.dataset.entity}"` });
      }
      if (!id.startsWith(`${def.prefix}-`)) errors.push({ file, id, message: `id must start with "${def.prefix}-"` });
      if (ids.has(id)) errors.push({ file, id, message: `duplicate id (also in ${ids.get(id)})` });
      ids.set(id, file);
      const res = def.schema.safeParse(raw);
      if (!res.success) {
        for (const iss of res.error.issues.slice(0, 5)) errors.push({ file, id, path: iss.path.join('.'), message: iss.message });
      }
    }
  }
  return { errors, files: files.length, records };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop() ?? '');
if (isMain) {
  const { errors, files, records } = validateAll();
  if (errors.length) {
    console.error(`✖ Data validation failed: ${errors.length} error(s) in ${files} files`);
    for (const e of errors.slice(0, 200)) console.error(`  ${e.file}${e.id ? ` [${e.id}]` : ''}${e.path ? ` ${e.path}` : ''}: ${e.message}`);
    process.exit(1);
  }
  console.log(`✔ Data valid: ${files} datasets, ${records} records`);
}
