import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DatasetHeader } from '../../src/domain/common';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DATA_DIR = join(ROOT, 'data');
export const PUBLIC_DIR = join(ROOT, 'public');
export const REPORTS_DIR = join(ROOT, 'reports');

export interface RecordsDataset {
  dataset: DatasetHeader & { kind?: 'records'; relative_dates?: boolean };
  records: Record<string, unknown>[];
}
export interface ConfigDataset {
  dataset: DatasetHeader & { kind: 'config' };
  config: Record<string, unknown>;
}
export type AnyDataset = RecordsDataset | ConfigDataset;

export function isConfig(d: AnyDataset): d is ConfigDataset {
  return (d.dataset as { kind?: string }).kind === 'config';
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', 'utf-8');
}

export function readJson<T = unknown>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

/** All dataset files under /data (JSON with a `dataset` header), excluding catalog.json. */
export function listDatasetFiles(dir = DATA_DIR): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d).sort()) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith('.json') && name !== 'catalog.json') out.push(p);
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
}

export function relPath(p: string): string {
  return relative(ROOT, p).split(sep).join('/');
}

/** Resolve "@today", "@today+N", "@today-N" into ISO dates (demo datasets only). */
export function resolveRelativeDates<T>(value: T, today = new Date()): T {
  const iso = (offset: number) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const walk = (v: unknown): unknown => {
    if (typeof v === 'string') {
      const m = /^@today([+-]\d+)?$/.exec(v);
      return m ? iso(m[1] ? parseInt(m[1], 10) : 0) : v;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(value) as T;
}

export function loadDataset(path: string): AnyDataset {
  return readJson<AnyDataset>(path);
}
