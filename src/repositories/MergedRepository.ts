import type { AnyRecord } from '../domain';
import type { StaticRepository } from './StaticRepository';
import type { DataRepository, WithOrigin } from './types';
import { WorkspaceRepository } from './WorkspaceRepository';

/**
 * Master data ∪ local drafts. A draft with a master id overrides it (LOCAL_DRAFT); a draft
 * with a new id is LOCAL_NEW; a tombstone hides the master record in this browser only.
 */
export class MergedRepository implements DataRepository {
  readonly workspace: WorkspaceRepository;
  private masterIdsP?: Promise<Set<string>>;

  constructor(readonly master: StaticRepository) {
    this.workspace = new WorkspaceRepository(() => this.masterIds());
  }

  masterIds(): Promise<Set<string>> {
    this.masterIdsP ??= this.master.all().then((all) => new Set(all.map((r) => r.id)));
    return this.masterIdsP;
  }

  private merge(master: WithOrigin<AnyRecord>[], drafts: Awaited<ReturnType<WorkspaceRepository['drafts']>>, entity?: string): WithOrigin<AnyRecord>[] {
    const byId = new Map(master.map((r) => [r.id, r]));
    for (const d of drafts) {
      if (entity && d.entity !== entity) continue;
      if (d.deleted) {
        byId.delete(d.id);
        continue;
      }
      byId.set(d.id, { ...(d.record as AnyRecord), __origin: d.overrides_master ? 'LOCAL_DRAFT' : 'LOCAL_NEW', __dataset: byId.get(d.id)?.__dataset });
    }
    return [...byId.values()];
  }

  async list(entity: string): Promise<WithOrigin<AnyRecord>[]> {
    const [m, d] = await Promise.all([this.master.list(entity), this.workspace.drafts()]);
    return this.merge(m, d, entity);
  }

  async all(): Promise<WithOrigin<AnyRecord>[]> {
    const [m, d] = await Promise.all([this.master.all(), this.workspace.drafts()]);
    return this.merge(m, d);
  }

  async get(id: string): Promise<WithOrigin<AnyRecord> | undefined> {
    const d = await this.workspace.draft(id);
    if (d?.deleted) return undefined;
    if (d) return { ...(d.record as AnyRecord), __origin: d.overrides_master ? 'LOCAL_DRAFT' : 'LOCAL_NEW' };
    return this.master.get(id);
  }
}
