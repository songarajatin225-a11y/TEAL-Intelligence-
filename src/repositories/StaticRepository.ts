import type { AnyRecord } from '../domain';
import { resolveRelativeDates } from '../utils/dates';
import { fetchJson } from '../utils/paths';
import type { Catalog, CatalogEntry, DataRepository, WithOrigin } from './types';

interface RecordsFile {
  dataset: { id: string; relative_dates?: boolean };
  records: AnyRecord[];
}
interface ConfigFile<T> {
  config: T;
}

/**
 * Read-only access to the GitHub master data published under /data (spec §14).
 * Datasets load lazily per entity and are cached for the session.
 */
export class StaticRepository implements DataRepository {
  private catalogP?: Promise<Catalog>;
  private files = new Map<string, Promise<WithOrigin<AnyRecord>[]>>();
  private configs = new Map<string, Promise<unknown>>();

  constructor(private readonly loader: <T>(path: string) => Promise<T> = fetchJson) {}

  catalog(): Promise<Catalog> {
    this.catalogP ??= this.loader<Catalog>('data/catalog.json');
    return this.catalogP;
  }

  private loadFile(entry: CatalogEntry): Promise<WithOrigin<AnyRecord>[]> {
    let p = this.files.get(entry.path);
    if (!p) {
      p = this.loader<RecordsFile>(`data/${entry.path}`).then((f) => {
        const rows = f.dataset.relative_dates ? resolveRelativeDates(f.records) : f.records;
        return rows.map((r) => ({ ...r, __origin: 'MASTER' as const, __dataset: entry.id }));
      });
      this.files.set(entry.path, p);
      p.catch(() => this.files.delete(entry.path));
    }
    return p;
  }

  async list(entity: string): Promise<WithOrigin<AnyRecord>[]> {
    const cat = await this.catalog();
    const files = cat.datasets.filter((d) => d.kind === 'records' && d.entity === entity);
    return (await Promise.all(files.map((f) => this.loadFile(f)))).flat();
  }

  async all(): Promise<WithOrigin<AnyRecord>[]> {
    const cat = await this.catalog();
    const files = cat.datasets.filter((d) => d.kind === 'records');
    return (await Promise.all(files.map((f) => this.loadFile(f)))).flat();
  }

  async get(id: string): Promise<WithOrigin<AnyRecord> | undefined> {
    return (await this.all()).find((r) => r.id === id);
  }

  async config<T>(datasetId: string): Promise<T> {
    let p = this.configs.get(datasetId);
    if (!p) {
      p = this.catalog().then((cat) => {
        const e = cat.datasets.find((d) => d.id === datasetId && d.kind === 'config');
        if (!e) throw new Error(`Config dataset "${datasetId}" not found in catalog`);
        return this.loader<ConfigFile<T>>(`data/${e.path}`).then((f) => f.config);
      });
      this.configs.set(datasetId, p);
    }
    return p as Promise<T>;
  }
}
