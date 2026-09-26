import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyChangePackage } from '../../scripts/data/applyChangePackage';
import type { DraftRow } from '../../src/repositories/workspaceDb';
import { buildChangePackage } from '../../src/services/changePackage';

const ROOT = join(__dirname, '..', '..');
const now = '2026-09-01T00:00:00Z';
const draft = (record: Record<string, unknown>, extra: Partial<DraftRow> = {}): DraftRow => ({ id: String(record.id), entity: String(record.entity), record, overrides_master: false, deleted: false, created_at: now, updated_at: now, ...extra });
const readDs = (dir: string, rel: string) => JSON.parse(readFileSync(join(dir, rel), 'utf-8')) as { dataset: { version: string; last_updated: string }; records: { id: string; notes?: string }[] };

let dir = '';
const fresh = () => {
  dir = mkdtempSync(join(tmpdir(), 'teal-data-'));
  cpSync(join(ROOT, 'data'), dir, { recursive: true });
  return dir;
};
afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

describe('applyChangePackage (local drafts → /data for a pull request)', () => {
  const material = { id: 'mat-Lnewalloy', entity: 'material', name: 'New alloy (from workspace)', category: 'Metal', thermal_conductivity: null, melting_point: null, density: null, specific_heat: null, absorption: null, data_type: 'USER_CREATED', provenance: { verification_status: 'DRAFT' } };

  it('creates, updates in place and deletes; bumps touched dataset versions', () => {
    const d = fresh();
    const before = readDs(d, 'products/platforms.json');
    const prd = before.records.find((r) => r.id === 'prd-markf')!;
    const { zip } = buildChangePackage(
      [draft(material), draft({ ...prd, notes: 'reviewed change' }, { overrides_master: true }), draft({ id: 'prd-robo', entity: 'product', name: 'x' }, { overrides_master: true, deleted: true })],
      [],
      'tester',
    );
    const res = applyChangePackage(zip, { dataDir: d, today: '2026-09-02' });
    expect(res.refusedConfidential).toEqual([]);
    expect(res.skipped).toEqual([]);
    expect(res.created).toEqual(['mat-Lnewalloy']);
    expect(res.updated).toEqual(['prd-markf']);
    expect(res.deleted).toEqual(['prd-robo']);
    const after = readDs(d, 'products/platforms.json');
    expect(after.records.find((r) => r.id === 'prd-markf')?.notes).toBe('reviewed change');
    expect(after.records.some((r) => r.id === 'prd-robo')).toBe(false);
    expect(after.dataset.last_updated).toBe('2026-09-02');
    expect(after.dataset.version).not.toBe(before.dataset.version);
    expect(readDs(d, 'materials/materials.json').records.some((r) => r.id === 'mat-Lnewalloy')).toBe(true);
  });

  it('refuses customer-confidential entities for this public repository unless confirmed', () => {
    const d = fresh();
    const cust = { id: 'cus-Lsecret', entity: 'customer', name: 'Some customer', data_type: 'USER_CREATED', provenance: { verification_status: 'DRAFT' } };
    const { zip } = buildChangePackage([draft(cust)], [], 'tester');
    const refused = applyChangePackage(zip, { dataDir: d });
    expect(refused.refusedConfidential).toHaveLength(1);
    expect(refused.created).toEqual([]);
    const ok = applyChangePackage(zip, { dataDir: d, allowConfidential: true });
    expect(ok.created).toEqual(['cus-Lsecret']);
    expect(readDs(d, 'workspace/customer.json').records.map((r) => r.id)).toEqual(['cus-Lsecret']);
  });

  it('skips invalid records instead of writing them', () => {
    const d = fresh();
    const { zip } = buildChangePackage([draft({ ...material, name: '' })], [], 'tester');
    const res = applyChangePackage(zip, { dataDir: d, dryRun: true });
    expect(res.created).toEqual([]);
    expect(res.skipped[0].reason).toMatch(/name/);
  });
});
