/**
 * Apply a TEAL Change Package (exported from Admin → Data management) to /data, for review in a
 * pull request (spec §92–§93). The OS never writes master data itself: this script runs on a
 * contributor's machine or in a GitHub Action, and the result is merged only after human review.
 *
 *   npx tsx scripts/data/applyChangePackage.ts <package.zip> [--dry-run] [--i-confirm-not-confidential]
 *
 * Rules
 *  - create/update: record is validated against its entity schema; an existing id is replaced in
 *    its own dataset file, a new id goes to the entity's primary dataset (or data/workspace/<entity>.json)
 *  - delete: the record is removed from whichever dataset holds it
 *  - touched dataset headers get last_updated = today and a patch version bump
 *  - THIS REPOSITORY IS PUBLIC. Entities that usually hold customer-confidential content
 *    (customers, opportunities, requirements, cost models, RFQs, …) are refused unless
 *    --i-confirm-not-confidential is given.
 *  - after writing, the full data validation runs; a failure exits 1
 */
import { readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { AnyRecord } from '../../src/domain';
import { validateRecord } from '../../src/repositories/WorkspaceRepository';
import { parseChangePackage } from '../../src/services/changePackage';
import { DATA_DIR, type AnyDataset, type RecordsDataset, isConfig, listDatasetFiles, readJson, writeJson } from '../lib/dataset';
import { validateAll } from './validateData';

export const CONFIDENTIAL_ENTITIES = new Set(['customer', 'opportunity', 'activity', 'requirement', 'cost_model', 'bom', 'rfq', 'configuration', 'project', 'poc', 'doe', 'acceptance', 'machine', 'service_ticket']);

export interface ApplyOptions {
  dataDir?: string;
  dryRun?: boolean;
  allowConfidential?: boolean;
  today?: string;
}

export interface ApplyResult {
  created: string[];
  updated: string[];
  deleted: string[];
  skipped: { id: string; reason: string }[];
  touchedFiles: string[];
  refusedConfidential: string[];
}

const bump = (v: string) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v);
  return m ? `${m[1]}.${m[2]}.${Number(m[3]) + 1}` : v;
};

export function applyChangePackage(bytes: Uint8Array, opts: ApplyOptions = {}): ApplyResult {
  const dataDir = opts.dataDir ?? DATA_DIR;
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const pkg = parseChangePackage(bytes);
  const res: ApplyResult = { created: [], updated: [], deleted: [], skipped: [], touchedFiles: [], refusedConfidential: [] };

  const confidential = pkg.manifest.records.filter((r) => CONFIDENTIAL_ENTITIES.has(r.entity) && r.action !== 'delete');
  if (confidential.length && !opts.allowConfidential) {
    res.refusedConfidential = confidential.map((r) => `${r.entity} ${r.id} (${r.name})`);
    return res;
  }

  // Load every records dataset once.
  const files = new Map<string, RecordsDataset>();
  const where = new Map<string, string>();
  for (const path of listDatasetFiles(dataDir)) {
    const ds = readJson<AnyDataset>(path);
    if (isConfig(ds)) continue;
    files.set(path, ds);
    for (const r of ds.records) where.set(String(r.id), path);
  }
  const touched = new Set<string>();
  const primaryFor = (entity: string, dataType: string): string => {
    const candidates = [...files.entries()].filter(([, ds]) => ds.dataset.entity === entity);
    const pick = candidates.find(([p, ds]) => (dataType === 'DEMO') === (ds.dataset.data_type === 'DEMO' || p.includes(`${sep}demo${sep}`)));
    if (pick) return pick[0];
    const path = join(dataDir, 'workspace', `${entity}.json`);
    if (!files.has(path)) {
      files.set(path, {
        dataset: { id: `workspace-${entity.replace(/_/g, '-')}`, title: `${entity} records added through change packages`, description: 'Records created in the OS local workspace and applied via a reviewed change package.', entity, version: '1.0.0', last_updated: today, data_type: 'USER_CREATED', source_ids: [] },
        records: [],
      });
    }
    return path;
  };

  for (const raw of pkg.records) {
    const id = String((raw as { id: string }).id);
    if ((raw as { __delete?: boolean }).__delete) {
      const path = where.get(id);
      if (!path) {
        res.skipped.push({ id, reason: 'delete: not in master data (already removed?)' });
        continue;
      }
      const ds = files.get(path)!;
      ds.records = ds.records.filter((r) => r.id !== id);
      touched.add(path);
      res.deleted.push(id);
      continue;
    }
    const clean = Object.fromEntries(Object.entries(raw as Record<string, unknown>).filter(([k]) => !k.startsWith('__')));
    let rec: AnyRecord;
    try {
      rec = validateRecord(clean);
    } catch (e) {
      res.skipped.push({ id, reason: (e as Error).message });
      continue;
    }
    const existing = where.get(id);
    const path = existing ?? primaryFor(rec.entity, rec.data_type);
    const ds = files.get(path)!;
    if (ds.dataset.entity !== rec.entity) {
      res.skipped.push({ id, reason: `id exists in ${relative(dataDir, path)} with entity ${ds.dataset.entity}` });
      continue;
    }
    const i = ds.records.findIndex((r) => r.id === id);
    if (i >= 0) {
      ds.records[i] = clean;
      res.updated.push(id);
    } else {
      ds.records.push(clean);
      where.set(id, path);
      res.created.push(id);
    }
    touched.add(path);
  }

  for (const path of touched) {
    const ds = files.get(path)!;
    ds.dataset.last_updated = today;
    ds.dataset.version = bump(ds.dataset.version);
    if (!opts.dryRun) writeJson(path, ds);
  }
  res.touchedFiles = [...touched].map((p) => relative(dataDir, p).split(sep).join('/'));
  return res;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop() ?? '');
if (isMain) {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('Usage: npx tsx scripts/data/applyChangePackage.ts <package.zip> [--dry-run] [--i-confirm-not-confidential]');
    process.exit(2);
  }
  const res = applyChangePackage(new Uint8Array(readFileSync(file)), { dryRun: args.includes('--dry-run'), allowConfidential: args.includes('--i-confirm-not-confidential') });
  if (res.refusedConfidential.length) {
    console.error('✖ Refused: this repository is PUBLIC and the package contains records that usually hold customer-confidential content:');
    for (const r of res.refusedConfidential) console.error(`   ${r}`);
    console.error('  Keep them in the local workspace (or a private repository). If you have checked that none of them is');
    console.error('  confidential (customer names, drawings, quotations, BOM prices, personal data), re-run with --i-confirm-not-confidential.');
    process.exit(1);
  }
  console.log(`Created ${res.created.length} · updated ${res.updated.length} · deleted ${res.deleted.length} · skipped ${res.skipped.length}`);
  for (const s of res.skipped) console.log(`  skipped ${s.id}: ${s.reason}`);
  for (const f of res.touchedFiles) console.log(`  ${args.includes('--dry-run') ? 'would write' : 'wrote'} data/${f}`);
  if (!args.includes('--dry-run')) {
    const v = validateAll();
    if (v.errors.length) {
      console.error(`✖ Data validation failed after applying (${v.errors.length} errors) — fix before committing:`);
      for (const e of v.errors.slice(0, 50)) console.error(`  ${e.file}${e.id ? ` [${e.id}]` : ''}: ${e.message}`);
      process.exit(1);
    }
    console.log('✔ Data valid. Next: npm run data:catalog && npm run data:quality, then open a pull request for review.');
  }
}
