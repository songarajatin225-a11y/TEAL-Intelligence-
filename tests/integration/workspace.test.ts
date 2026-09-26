import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateRecord } from '../../src/repositories';
import { workspaceDb } from '../../src/repositories/workspaceDb';
import { exportWorkspace, importWorkspace } from '../../src/services/backup';
import { buildChangePackage, parseChangePackage } from '../../src/services/changePackage';
import { mapCostPlatform, mapTrackerBackup } from '../../src/services/legacyImport';
import { freshRepo } from '../helpers/repo';

const ROOT = join(__dirname, '..', '..');
const customer = (id: string, name = 'Test customer') => ({ id, entity: 'customer', name, data_type: 'USER_CREATED', provenance: { verification_status: 'DRAFT' } });

describe('local workspace (draft principle)', () => {
  it('new records are LOCAL_NEW; edits of master are LOCAL_DRAFT overrides; deletes are local tombstones', async () => {
    const repo = freshRepo();
    await repo.workspace.save(customer('cus-Ltest1'));
    expect((await repo.get('cus-Ltest1'))?.__origin).toBe('LOCAL_NEW');

    const master = (await repo.master.get('prd-semispm'))!;
    await repo.workspace.save({ ...master, __origin: undefined, __dataset: undefined, notes: 'local edit' } as unknown as Record<string, unknown>);
    const edited = await repo.get('prd-semispm');
    expect(edited?.__origin).toBe('LOCAL_DRAFT');
    expect(edited?.notes).toBe('local edit');
    expect((await repo.master.get('prd-semispm'))?.notes).not.toBe('local edit');

    await repo.workspace.remove('prd-markc2i', 'product', 'C2i marker');
    expect(await repo.get('prd-markc2i')).toBeUndefined();
    expect(await repo.master.get('prd-markc2i')).toBeDefined();
    await repo.workspace.discard('prd-markc2i');
    expect((await repo.get('prd-markc2i'))?.__origin).toBe('MASTER');
  });

  it('refuses invalid records with a readable message', async () => {
    const repo = freshRepo();
    await expect(repo.workspace.save({ ...customer('cus-Lbad'), name: '' })).rejects.toThrow(/Customer is not valid: name/);
    await expect(repo.workspace.save({ ...customer('prd-wrongprefix') })).rejects.toThrow(/must start with "cus-"/);
  });
});

describe('TEAL change package', () => {
  it('round-trips drafts, overrides and deletions through the ZIP', async () => {
    const repo = freshRepo();
    await repo.workspace.save(customer('cus-Lpkg1', 'Package customer'));
    const m = (await repo.master.get('prd-semispm'))!;
    await repo.workspace.save({ ...m, __origin: undefined, __dataset: undefined, notes: 'x' } as unknown as Record<string, unknown>);
    await repo.workspace.remove('prd-markc2i', 'product', 'C2i marker');
    const drafts = await repo.workspace.drafts();
    const log = await workspaceDb().changelog.toArray();
    const { manifest, zip } = buildChangePackage(drafts, log, 'tester', 'test note');
    expect(manifest.records.map((r) => r.action).sort()).toEqual(['create', 'delete', 'update']);

    const parsed = parseChangePackage(zip);
    expect(parsed.manifest.created_by).toBe('tester');
    const created = parsed.records.find((r) => r.id === 'cus-Lpkg1')!;
    expect(() => validateRecord(created as Record<string, unknown>)).not.toThrow();
    expect(parsed.records.find((r) => r.id === 'prd-markc2i')).toMatchObject({ __delete: true });
  });

  it('rejects files that are not change packages', () => {
    expect(() => parseChangePackage(new TextEncoder().encode('not a zip'))).toThrow();
  });
});

describe('workspace backup', () => {
  it('exports and re-imports, validating every record', async () => {
    const repo = freshRepo();
    await repo.workspace.save(customer('cus-Lbk1'));
    const backup = await exportWorkspace();
    expect(backup.drafts).toHaveLength(1);

    freshRepo();
    const tampered = { ...backup, drafts: [...backup.drafts, { ...backup.drafts[0], id: 'cus-Lbk2', record: { ...backup.drafts[0].record, id: 'cus-Lbk2', data_type: 'NOT_A_TYPE' } }] };
    const rep = await importWorkspace(tampered);
    expect(rep.ok).toBe(true);
    expect(rep.imported).toBe(1);
    expect(rep.rejected.map((r) => r.id)).toEqual(['cus-Lbk2']);
  });

  it('refuses a file without the backup format marker', async () => {
    freshRepo();
    const rep = await importWorkspace({ drafts: [] });
    expect(rep.ok).toBe(false);
    expect(await workspaceDb().drafts.count()).toBe(0);
  });

  it('never exports the local workspace lock', async () => {
    freshRepo();
    await workspaceDb().prefs.put({ key: 'lock', value: { hash: 'h', salt: 's', iterations: 1 } });
    expect((await exportWorkspace()).prefs).toEqual([]);
  });
});

describe('legacy import mapping', () => {
  it('maps the PM tracker backup format into valid OS records', () => {
    const sample = JSON.parse(readFileSync(join(ROOT, 'public/legacy/pm-tracker/data/sample-data.json'), 'utf-8'));
    const res = mapTrackerBackup(sample);
    expect(res.counts.customer).toBe(4);
    expect(res.counts.opportunity ?? 0).toBeGreaterThan(0);
    const invalid = res.records.flatMap((r) => {
      try {
        validateRecord(r as Record<string, unknown>);
        return [];
      } catch (e) {
        return [`${r.id}: ${(e as Error).message}`];
      }
    });
    expect(invalid).toEqual([]);
    expect(res.records.every((r) => r.provenance.verification_status === 'DRAFT')).toBe(true);
  });

  it('maps cost-platform projects (legacy template structure) into valid cost models', () => {
    const seed = JSON.parse(readFileSync(join(ROOT, 'public/legacy/cost-platform/data/projects.json'), 'utf-8'));
    const projects = seed.templates.map((t: Record<string, unknown>, i: number) => ({ ...t, code: `T-${i}`, customer: 'Example Customer', qty: 1, currency: 'INR' }));
    const res = mapCostPlatform({ projects });
    expect(res.counts.cost_model).toBe(projects.length);
    expect(res.counts.customer).toBe(1);
    for (const r of res.records) expect(() => validateRecord(r as Record<string, unknown>)).not.toThrow();
  });

  it('explains instead of importing when the legacy cost data is an encrypted vault', () => {
    const res = mapCostPlatform({ iv: 'x', ct: 'y' });
    expect(res.records).toEqual([]);
    expect(res.warnings[0]).toMatch(/encrypted/);
  });
});
