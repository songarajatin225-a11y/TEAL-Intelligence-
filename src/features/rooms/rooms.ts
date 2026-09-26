import type { AnyRecord } from '../../domain';
import type { Graph } from '../../services/graph';
import { thread } from '../../services/graph';

/**
 * ROOMS (ultimate spec §15–19): a focused workspace around one program (project), product, POC,
 * supplier, opportunity or customer. A room is a *view* over the existing digital thread — it adds
 * no record type. New work created in a room is pre-linked to it.
 */
export const ROOM_ENTITIES = ['project', 'product', 'poc', 'supplier', 'opportunity', 'customer'] as const;
export type RoomEntity = (typeof ROOM_ENTITIES)[number];
export const isRoomEntity = (e: string): e is RoomEntity => (ROOM_ENTITIES as readonly string[]).includes(e);
export const ROOM_LABEL: Record<RoomEntity, string> = { project: 'Program', product: 'Product', poc: 'POC', supplier: 'Supplier', opportunity: 'Opportunity', customer: 'Customer' };
export const roomPath = (id: string) => `/room/${encodeURIComponent(id)}`;

/** The field a new record uses to point at the room's subject, per created entity. */
const LINK_FIELD: Record<RoomEntity, Partial<Record<string, string>>> = {
  project: { activity: 'project_id', risk: 'project_id', lesson: 'project_id' },
  product: { activity: 'product_id', risk: 'product_id', lesson: 'product_id' },
  poc: { activity: 'poc_id' },
  supplier: { activity: 'supplier_id', lesson: 'supplier_id' },
  opportunity: { activity: 'opportunity_id', risk: 'opportunity_id' },
  customer: { activity: 'customer_id', lesson: 'customer_id' },
};

/** Preset values so a record created in the room is linked to it (typed field, else a `links` entry). */
export function presetFor(subject: AnyRecord, create: string): Record<string, unknown> {
  const e = subject.entity as RoomEntity;
  const field = LINK_FIELD[e]?.[create];
  const x = subject as Record<string, unknown>;
  const inherit: Record<string, unknown> = {};
  // carry the subject's own context along (a POC's opportunity/customer, a project's customer…)
  for (const k of ['customer_id', 'opportunity_id', 'product_id', 'project_id']) if (typeof x[k] === 'string' && create !== 'change_request') inherit[k] = x[k];
  if (field) return { ...inherit, [field]: subject.id };
  if (create === 'change_request') return { affected_ids: [subject.id] };
  return { ...inherit, links: [{ rel: 'references', target: subject.id }] };
}

export interface RoomContents {
  all: AnyRecord[];
  byEntity: (entity: string) => AnyRecord[];
}

/** Records in the room: one hop in the thread, plus (for programs and products) two hops of work items. */
export function roomContents(g: Graph, id: string): RoomContents {
  const subject = g.byId.get(id);
  const near = thread(g, id, 1);
  const far = subject && (subject.entity === 'project' || subject.entity === 'product' || subject.entity === 'opportunity') ? thread(g, id, 2).filter((r) => ['activity', 'risk', 'decision', 'lesson', 'poc', 'doe', 'acceptance', 'change_request'].includes(r.entity)) : [];
  const all = [...new Map([...near, ...far].map((r) => [r.id, r])).values()];
  return { all, byEntity: (entity) => all.filter((r) => r.entity === entity) };
}

export interface TimelineEvent {
  date: string;
  label: string;
  recordId: string;
  kind: 'created' | 'updated' | 'due' | 'gate' | 'decided';
}

export function roomTimeline(subject: AnyRecord, records: AnyRecord[]): TimelineEvent[] {
  const ev: TimelineEvent[] = [];
  for (const r of [subject, ...records]) {
    const x = r as Record<string, unknown>;
    if (r.created_at) ev.push({ date: r.created_at.slice(0, 10), label: `${r.name} created`, recordId: r.id, kind: 'created' });
    if (r.updated_at && r.updated_at.slice(0, 10) !== r.created_at?.slice(0, 10)) ev.push({ date: r.updated_at.slice(0, 10), label: `${r.name} updated`, recordId: r.id, kind: 'updated' });
    if (typeof x.due_date === 'string') ev.push({ date: x.due_date, label: `${r.name} due`, recordId: r.id, kind: 'due' });
    if (typeof x.decided_on === 'string') ev.push({ date: x.decided_on, label: `Decided: ${r.name}`, recordId: r.id, kind: 'decided' });
    if (r.entity === 'project') for (const gr of (x.gates as { gate_code: string; decision: string; date?: string }[] | undefined) ?? []) if (gr.date) ev.push({ date: gr.date, label: `${gr.gate_code} — ${gr.decision}`, recordId: r.id, kind: 'gate' });
  }
  return ev.sort((a, b) => b.date.localeCompare(a.date));
}
