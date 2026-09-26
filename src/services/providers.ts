import { repo } from '../repositories';
import type { AnyRecord } from '../domain';
import { DatabaseService } from './database';
import { search, type Hit, type SearchQuery } from './search';

/**
 * PROVIDER INTERFACES (final master prompt §38). GitHub Pages is not a backend, and the app does
 * not pretend it is. These four interfaces are the seams where a real backend can be attached
 * later without rebuilding the frontend; today each has an honest static / local implementation.
 */

/** DataRepository — records (master data + local drafts). Implemented by MergedRepository. */
export type { DataRepository } from '../repositories/types';

/** AuthProvider — who is using the app. V1 has NO authentication: only a local workspace lock. */
export interface AuthProvider {
  readonly kind: 'none' | 'local-lock';
  /** always false in V1 — a client-side lock is not security */
  readonly secure: false;
  describe(): string;
  isLocked(): Promise<boolean>;
}

/** SearchProvider — full-text + field search over records and knowledge. */
export interface SearchProvider {
  readonly kind: 'static-index' | 'api';
  search(q: SearchQuery, localDrafts?: AnyRecord[], hidden?: Set<string>): Promise<Hit[]>;
}

export type SyncState = 'LOCAL DATA ONLY' | 'SYNC PENDING' | 'SYNCED';
export interface SyncStatus {
  state: SyncState;
  drafts: number;
  /** local changes recorded after the last change-package export */
  pending: number;
  lastExportAt: string | null;
}
/** SyncProvider — how local work reaches the shared master data. */
export interface SyncProvider {
  readonly kind: 'change-package' | 'api';
  describe(): string;
  status(): Promise<SyncStatus>;
  markExported(): Promise<void>;
}

const LAST_EXPORT = 'sync:lastExportAt';

export const LocalLockAuthProvider: AuthProvider = {
  kind: 'local-lock',
  secure: false,
  describe: () => 'No sign-in. An optional LOCAL WORKSPACE LOCK hides this browser’s drafts behind a passphrase; it is not authentication and does not protect data from someone with access to this device.',
  isLocked: async () => !!(await DatabaseService.getSetting('lock')),
};

export const StaticIndexSearchProvider: SearchProvider = {
  kind: 'static-index',
  search: (q, drafts = [], hidden = new Set()) => search(q, drafts, hidden),
};

export const ChangePackageSyncProvider: SyncProvider = {
  kind: 'change-package',
  describe: () => 'Local drafts reach GitHub as a change package (ZIP) → scripts/data/applyChangePackage.ts → pull request → review → merge. Nothing syncs automatically.',
  async status() {
    const [drafts, log, lastExportAt] = await Promise.all([DatabaseService.drafts(), DatabaseService.changelog(), DatabaseService.getSetting<string>(LAST_EXPORT)]);
    const pending = log.filter((c) => !lastExportAt || c.at > lastExportAt).length;
    const state: SyncState = !drafts.length ? 'SYNCED' : lastExportAt && !pending ? 'SYNCED' : lastExportAt ? 'SYNC PENDING' : 'LOCAL DATA ONLY';
    return { state, drafts: drafts.length, pending, lastExportAt: lastExportAt ?? null };
  },
  markExported: () => DatabaseService.setSetting(LAST_EXPORT, new Date().toISOString()),
};

/** The providers the app runs with today. */
export const providers = {
  data: () => repo(),
  auth: LocalLockAuthProvider,
  search: StaticIndexSearchProvider,
  sync: ChangePackageSyncProvider,
};
