import Dexie, { type Table } from 'dexie';

/**
 * LOCAL WORKSPACE (spec §91) — IndexedDB via Dexie. Everything here lives only in this
 * browser. It never claims to change GitHub master data; permanent updates go through a
 * TEAL Change Package → Git commit / PR.
 */
export interface DraftRow {
  id: string;
  entity: string;
  record: Record<string, unknown>;
  /** true when a record with this id exists in master data (i.e. this is a local edit of master) */
  overrides_master: boolean;
  /** tombstone: hide the master record locally */
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChangeLogRow {
  seq?: number;
  record_id: string;
  entity: string;
  action: 'create' | 'update' | 'delete' | 'restore';
  at: string;
  summary: string;
}

export interface RecentRow {
  id: string;
  entity: string;
  name: string;
  visited_at: string;
}

export interface SavedSearchRow {
  id?: number;
  query: string;
  partitions: string[];
  created_at: string;
}

export interface PrefRow {
  key: string;
  value: unknown;
}

export interface NotificationRow {
  id?: number;
  text: string;
  level: 'info' | 'warning' | 'error';
  created_at: string;
  read: boolean;
  link?: string;
}

/** AI interaction / feedback log (AI master prompt §94, §95) — local to this browser, exportable. */
export interface AiLogRow {
  id?: number;
  kind: 'interaction' | 'feedback';
  at: string;
  query: string;
  intent: string;
  title: string;
  confidence: string;
  mode: string;
  sources: string[];
  engines: string[];
  feedback?: 'correct' | 'incorrect' | 'needs_review';
  correction?: string;
}

export class WorkspaceDb extends Dexie {
  drafts!: Table<DraftRow, string>;
  changelog!: Table<ChangeLogRow, number>;
  recent!: Table<RecentRow, string>;
  saved!: Table<SavedSearchRow, number>;
  prefs!: Table<PrefRow, string>;
  notifications!: Table<NotificationRow, number>;
  ai_log!: Table<AiLogRow, number>;

  constructor(name = 'teal-os-workspace') {
    super(name);
    this.version(1).stores({
      drafts: 'id, entity, updated_at, deleted',
      changelog: '++seq, record_id, entity, at',
      recent: 'id, visited_at',
      saved: '++id, created_at',
      prefs: 'key',
      notifications: '++id, created_at, read',
    });
    // v2 adds the AI log; existing tables are unchanged (Dexie carries them over)
    this.version(2).stores({ ai_log: '++id, kind, at, intent' });
  }
}

let _db: WorkspaceDb | null = null;
export function workspaceDb(): WorkspaceDb {
  _db ??= new WorkspaceDb();
  return _db;
}
/** Tests only: swap the database (fake-indexeddb). */
export function setWorkspaceDb(db: WorkspaceDb): void {
  _db = db;
}

/* A tiny change bus so views re-query after local writes (and the shell can confirm them). */
export interface WorkspaceEvent {
  action: 'create' | 'update' | 'delete' | 'restore' | 'import' | 'batch';
  summary: string;
}
type Listener = (e?: WorkspaceEvent) => void;
const listeners = new Set<Listener>();
let version = 0;
export const workspaceBus = {
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  emit(e?: WorkspaceEvent): void {
    version++;
    listeners.forEach((l) => l(e));
  },
  version(): number {
    return version;
  },
};
