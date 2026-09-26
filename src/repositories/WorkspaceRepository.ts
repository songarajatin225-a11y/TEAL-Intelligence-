import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { workspaceBus, workspaceDb, type DraftRow } from './workspaceDb';

export class ValidationFailure extends Error {
  constructor(
    message: string,
    readonly issues: { path: string; message: string }[],
  ) {
    super(message);
  }
}

const nowIso = () => new Date().toISOString();

/** Validate a record against its entity schema. Returns the parsed record or throws ValidationFailure. */
export function validateRecord(record: Record<string, unknown>): AnyRecord {
  const def = ENTITY_BY_TYPE[String(record.entity)];
  if (!def) throw new ValidationFailure(`Unknown entity type "${String(record.entity)}"`, []);
  if (!String(record.id ?? '').startsWith(`${def.prefix}-`)) {
    throw new ValidationFailure(`Record id must start with "${def.prefix}-"`, [{ path: 'id', message: `Must start with ${def.prefix}-` }]);
  }
  const res = def.schema.safeParse(record);
  if (!res.success) {
    const issues = res.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    throw new ValidationFailure(`${def.label} is not valid: ${issues.map((i) => `${i.path || 'record'} — ${i.message}`).join('; ')}`, issues);
  }
  return res.data as AnyRecord;
}

/** Generate a local id: prefix-L<time36><rand> */
export function newLocalId(entity: string): string {
  const def = ENTITY_BY_TYPE[entity];
  if (!def) throw new Error(`Unknown entity "${entity}"`);
  return `${def.prefix}-L${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Local drafts in IndexedDB. `masterIds` tells the repository which ids exist in GitHub master
 * data, so an edit of master is stored as an override and a delete as a tombstone.
 */
export class WorkspaceRepository {
  constructor(private readonly masterIds: () => Promise<Set<string>>) {}

  async drafts(): Promise<DraftRow[]> {
    return workspaceDb().drafts.toArray();
  }

  async draft(id: string): Promise<DraftRow | undefined> {
    return workspaceDb().drafts.get(id);
  }

  async save(input: Record<string, unknown>, summary?: string): Promise<AnyRecord> {
    const record = validateRecord({ ...input, updated_at: nowIso().slice(0, 10) });
    const db = workspaceDb();
    const existing = await db.drafts.get(record.id);
    const isMaster = (await this.masterIds()).has(record.id);
    const row: DraftRow = {
      id: record.id,
      entity: record.entity,
      record: record as Record<string, unknown>,
      overrides_master: isMaster,
      deleted: false,
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    await db.transaction('rw', db.drafts, db.changelog, async () => {
      await db.drafts.put(row);
      await db.changelog.add({ record_id: record.id, entity: record.entity, action: existing || isMaster ? 'update' : 'create', at: nowIso(), summary: summary ?? String(record.name) });
    });
    workspaceBus.emit({ action: existing || isMaster ? 'update' : 'create', summary: summary ?? String(record.name) });
    return record;
  }

  async saveMany(inputs: Record<string, unknown>[], summary: string): Promise<AnyRecord[]> {
    // Validate everything first so a batch is all-or-nothing.
    const records = inputs.map((r) => validateRecord({ ...r, updated_at: nowIso().slice(0, 10) }));
    const master = await this.masterIds();
    const db = workspaceDb();
    await db.transaction('rw', db.drafts, db.changelog, async () => {
      for (const r of records) {
        const existing = await db.drafts.get(r.id);
        await db.drafts.put({
          id: r.id,
          entity: r.entity,
          record: r as Record<string, unknown>,
          overrides_master: master.has(r.id),
          deleted: false,
          created_at: existing?.created_at ?? nowIso(),
          updated_at: nowIso(),
        });
        await db.changelog.add({ record_id: r.id, entity: r.entity, action: existing || master.has(r.id) ? 'update' : 'create', at: nowIso(), summary: `${summary}: ${r.name}` });
      }
    });
    workspaceBus.emit({ action: 'batch', summary: `${summary} (${records.length})` });
    return records;
  }

  async remove(id: string, entity: string, name: string): Promise<void> {
    const db = workspaceDb();
    const isMaster = (await this.masterIds()).has(id);
    await db.transaction('rw', db.drafts, db.changelog, async () => {
      if (isMaster) {
        await db.drafts.put({ id, entity, record: { id, entity, name }, overrides_master: true, deleted: true, created_at: nowIso(), updated_at: nowIso() });
      } else {
        await db.drafts.delete(id);
      }
      await db.changelog.add({ record_id: id, entity, action: 'delete', at: nowIso(), summary: name });
    });
    workspaceBus.emit({ action: 'delete', summary: name });
  }

  /** Discard a local draft/tombstone and fall back to master data (if any). */
  async discard(id: string): Promise<void> {
    const db = workspaceDb();
    const row = await db.drafts.get(id);
    if (!row) return;
    await db.transaction('rw', db.drafts, db.changelog, async () => {
      await db.drafts.delete(id);
      await db.changelog.add({ record_id: id, entity: row.entity, action: 'restore', at: nowIso(), summary: `Discarded local draft of ${String(row.record.name ?? id)}` });
    });
    workspaceBus.emit({ action: 'restore', summary: String(row.record.name ?? id) });
  }
}
