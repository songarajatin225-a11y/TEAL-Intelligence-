import type { AnyRecord } from '../domain';

/**
 * Repository pattern (spec §127). UI and services depend on these interfaces only.
 * V1 implementations: StaticRepository (GitHub master data served by Pages) and
 * WorkspaceRepository (IndexedDB local drafts), combined by MergedRepository.
 * A future ApiRepository implements the same interface — not built in V1.
 */
export type RecordOrigin = 'MASTER' | 'LOCAL_DRAFT' | 'LOCAL_NEW';

export type WithOrigin<T> = T & { __origin: RecordOrigin; __dataset?: string };

export interface DataRepository<T extends AnyRecord = AnyRecord> {
  list(entity: string): Promise<WithOrigin<T>[]>;
  get(id: string): Promise<WithOrigin<T> | undefined>;
  all(): Promise<WithOrigin<T>[]>;
}

export interface WritableRepository<T extends AnyRecord = AnyRecord> extends DataRepository<T> {
  save(record: T): Promise<WithOrigin<T>>;
  remove(id: string): Promise<void>;
}

export interface CatalogEntry {
  id: string;
  title: string;
  path: string;
  description: string;
  entity: string;
  kind: 'records' | 'config';
  version: string;
  record_count: number;
  last_updated: string;
  schema: string | null;
  source_ids: string[];
  data_type: string;
  partition?: string;
  relative_dates?: boolean;
  sha256: string;
}

export interface Catalog {
  generated_at: string;
  datasets: CatalogEntry[];
}
