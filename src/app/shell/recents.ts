import { useEffect, useState } from 'react';
import { workspaceDb, type RecentRow } from '../../repositories/workspaceDb';

/** RECENTLY OPENED (spec §42): record visits kept in this browser's IndexedDB. */
const listeners = new Set<() => void>();

export async function trackRecent(r: { id: string; entity: string; name: string }): Promise<void> {
  try {
    const db = workspaceDb();
    await db.recent.put({ id: r.id, entity: r.entity, name: r.name, visited_at: new Date().toISOString() });
    const n = await db.recent.count();
    if (n > 60) {
      const old = await db.recent.orderBy('visited_at').limit(n - 60).primaryKeys();
      await db.recent.bulkDelete(old);
    }
    listeners.forEach((l) => l());
  } catch {
    /* IndexedDB unavailable — recents are a convenience */
  }
}

export function useRecents(limit = 8): RecentRow[] {
  const [rows, setRows] = useState<RecentRow[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      workspaceDb()
        .recent.orderBy('visited_at')
        .reverse()
        .limit(limit)
        .toArray()
        .then((r) => alive && setRows(r))
        .catch(() => alive && setRows([]));
    void load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
    };
  }, [limit]);
  return rows;
}
