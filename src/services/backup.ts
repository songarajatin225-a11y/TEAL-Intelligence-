import { validateRecord } from '../repositories/WorkspaceRepository';
import { workspaceBus, workspaceDb, type DraftRow } from '../repositories/workspaceDb';

/** WORKSPACE BACKUP (spec §95): export everything in IndexedDB; validate before import. */
export const BACKUP_FORMAT = 'teal-workspace-backup';

export interface WorkspaceBackup {
  format: typeof BACKUP_FORMAT;
  version: 1;
  exported_at: string;
  drafts: DraftRow[];
  changelog: unknown[];
  saved: unknown[];
  prefs: unknown[];
  recent: unknown[];
}

export async function exportWorkspace(): Promise<WorkspaceBackup> {
  const db = workspaceDb();
  const [drafts, changelog, saved, prefs, recent] = await Promise.all([db.drafts.toArray(), db.changelog.toArray(), db.saved.toArray(), db.prefs.toArray(), db.recent.toArray()]);
  return { format: BACKUP_FORMAT, version: 1, exported_at: new Date().toISOString(), drafts, changelog, saved, prefs: prefs.filter((p) => p.key !== 'lock'), recent };
}

export interface ImportReport {
  ok: boolean;
  imported: number;
  rejected: { id: string; reason: string }[];
  message: string;
}

/** Validate every draft; import only if the file is a TEAL backup. Invalid records are reported, not imported. */
export async function importWorkspace(json: unknown, mode: 'merge' | 'replace' = 'merge'): Promise<ImportReport> {
  const b = json as Partial<WorkspaceBackup>;
  if (!b || b.format !== BACKUP_FORMAT || !Array.isArray(b.drafts)) {
    return { ok: false, imported: 0, rejected: [], message: 'This file is not a TEAL workspace backup (missing format marker). Nothing was imported.' };
  }
  const rejected: ImportReport['rejected'] = [];
  const good: DraftRow[] = [];
  for (const d of b.drafts) {
    try {
      if (!d.deleted) validateRecord(d.record);
      good.push(d);
    } catch (e) {
      rejected.push({ id: String(d?.id), reason: (e as Error).message });
    }
  }
  const db = workspaceDb();
  await db.transaction('rw', [db.drafts, db.changelog, db.saved], async () => {
    if (mode === 'replace') {
      await db.drafts.clear();
      await db.changelog.clear();
    }
    await db.drafts.bulkPut(good);
    await db.changelog.add({ record_id: '*', entity: '*', action: 'update', at: new Date().toISOString(), summary: `Imported workspace backup (${good.length} records)` });
  });
  workspaceBus.emit({ action: 'import', summary: `Workspace backup (${good.length} records)` });
  return { ok: true, imported: good.length, rejected, message: `Imported ${good.length} record(s)${rejected.length ? `; ${rejected.length} rejected (invalid)` : ''}.` };
}
