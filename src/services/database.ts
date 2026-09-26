import { workspaceBus, workspaceDb, type ChangeLogRow, type DraftRow, type RecentRow } from '../repositories/workspaceDb';

/**
 * DATABASE SERVICE (final master prompt §35). The only way UI code reaches the browser's IndexedDB
 * for operational data (drafts, change log, recents, saved searches, local settings). Records go
 * through the repositories (repo()); everything else goes through here — no component opens a
 * Dexie table itself, so a future backend can replace this module without touching the UI.
 */
const safe = async <T,>(f: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await f();
  } catch {
    return fallback;
  }
};

export const DatabaseService = {
  drafts: (): Promise<DraftRow[]> => safe(() => workspaceDb().drafts.orderBy('updated_at').reverse().toArray(), []),
  changelog: (opts: { recordId?: string; limit?: number } = {}): Promise<ChangeLogRow[]> =>
    safe(async () => {
      const db = workspaceDb();
      if (opts.recordId) return (await db.changelog.where('record_id').equals(opts.recordId).reverse().sortBy('seq')).slice(0, opts.limit ?? Infinity);
      const q = db.changelog.orderBy('seq').reverse();
      return opts.limit ? q.limit(opts.limit).toArray() : q.toArray();
    }, []),
  async discardAllDrafts(): Promise<number> {
    const db = workspaceDb();
    const n = await db.drafts.count();
    await db.transaction('rw', db.drafts, db.changelog, async () => {
      await db.drafts.clear();
      await db.changelog.add({ record_id: '*', entity: '*', action: 'restore', at: new Date().toISOString(), summary: `Discarded all local drafts (${n})` });
    });
    workspaceBus.emit({ action: 'delete', summary: `All local drafts (${n})` });
    return n;
  },
  getSetting: <T,>(key: string): Promise<T | undefined> => safe(async () => (await workspaceDb().prefs.get(key))?.value as T | undefined, undefined),
  setSetting: (key: string, value: unknown): Promise<void> => safe(async () => void (await workspaceDb().prefs.put({ key, value })), undefined),
  deleteSetting: (key: string): Promise<void> => safe(() => workspaceDb().prefs.delete(key), undefined),
  addSavedSearch: (row: { query: string; partitions: string[]; created_at: string }): Promise<void> => safe(async () => void (await workspaceDb().saved.add(row as never)), undefined),
  async putRecent(r: Omit<RecentRow, 'visited_at'>, keep = 60): Promise<void> {
    await safe(async () => {
      const db = workspaceDb();
      await db.recent.put({ ...r, visited_at: new Date().toISOString() });
      const n = await db.recent.count();
      if (n > keep) await db.recent.bulkDelete(await db.recent.orderBy('visited_at').limit(n - keep).primaryKeys());
    }, undefined);
  },
  recents: (limit: number): Promise<RecentRow[]> => safe(() => workspaceDb().recent.orderBy('visited_at').reverse().limit(limit).toArray(), []),
};
