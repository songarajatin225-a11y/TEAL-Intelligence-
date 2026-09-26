import { useEffect, useState } from 'react';
import type { RecentRow } from '../../repositories/workspaceDb';
import { DatabaseService } from '../../services/database';

/** RECENTLY OPENED (spec §42): record visits kept in this browser's IndexedDB. */
const listeners = new Set<() => void>();

export async function trackRecent(r: { id: string; entity: string; name: string }): Promise<void> {
  await DatabaseService.putRecent({ id: r.id, entity: r.entity, name: r.name });
  listeners.forEach((l) => l());
}

export function useRecents(limit = 8): RecentRow[] {
  const [rows, setRows] = useState<RecentRow[]>([]);
  useEffect(() => {
    let alive = true;
    const load = () =>
      DatabaseService.recents(limit).then((r) => alive && setRows(r));
    void load();
    listeners.add(load);
    return () => {
      alive = false;
      listeners.delete(load);
    };
  }, [limit]);
  return rows;
}
