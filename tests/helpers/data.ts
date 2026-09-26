import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');

export function dataset<T = Record<string, unknown>>(rel: string): T[] {
  return (JSON.parse(readFileSync(join(ROOT, 'data', rel), 'utf-8')) as { records: T[] }).records;
}
export function config<T = Record<string, unknown>>(rel: string): T {
  return (JSON.parse(readFileSync(join(ROOT, 'data', rel), 'utf-8')) as { config: T }).config;
}
export function fixture<T = unknown>(rel: string): T {
  return JSON.parse(readFileSync(join(ROOT, 'tests', 'fixtures', rel), 'utf-8')) as T;
}
