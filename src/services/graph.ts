import type { AnyRecord } from '../domain';
import type { EdgeType } from '../domain/common';
import { extractRefs, provenanceSource } from './refs';

export interface GraphEdge {
  from: string;
  to: string;
  rel: EdgeType;
  field: string;
}

export interface Graph {
  byId: Map<string, AnyRecord>;
  out: Map<string, GraphEdge[]>;
  in: Map<string, GraphEdge[]>;
  broken: GraphEdge[];
}

/** Build the digital-thread graph from a record set (master + local drafts). */
export function buildGraph(records: AnyRecord[]): Graph {
  const byId = new Map(records.map((r) => [r.id, r]));
  const out = new Map<string, GraphEdge[]>();
  const inn = new Map<string, GraphEdge[]>();
  const broken: GraphEdge[] = [];
  const add = (e: GraphEdge) => {
    if (!byId.has(e.to)) {
      broken.push(e);
      return;
    }
    (out.get(e.from) ?? out.set(e.from, []).get(e.from)!).push(e);
    (inn.get(e.to) ?? inn.set(e.to, []).get(e.to)!).push(e);
  };
  for (const r of records) {
    for (const e of extractRefs(r as Record<string, unknown>)) add(e);
    const s = provenanceSource(r as Record<string, unknown>);
    if (s && r.entity !== 'source') add({ from: r.id, to: s, rel: 'derived_from', field: 'provenance.source_id' });
  }
  return { byId, out, in: inn, broken };
}

export interface Neighbour {
  record: AnyRecord;
  rel: EdgeType;
  direction: 'out' | 'in';
  field: string;
}

export function neighbours(g: Graph, id: string): Neighbour[] {
  const res: Neighbour[] = [];
  for (const e of g.out.get(id) ?? []) {
    const r = g.byId.get(e.to);
    if (r) res.push({ record: r, rel: e.rel, direction: 'out', field: e.field });
  }
  for (const e of g.in.get(id) ?? []) {
    const r = g.byId.get(e.from);
    if (r) res.push({ record: r, rel: e.rel, direction: 'in', field: e.field });
  }
  return res;
}

/** Records reachable within `depth` hops (both directions), excluding sources unless asked. */
export function thread(g: Graph, id: string, depth = 2, includeSources = false): AnyRecord[] {
  const seen = new Set([id]);
  let frontier = [id];
  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const x of frontier) {
      for (const n of neighbours(g, x)) {
        if (!includeSources && n.record.entity === 'source') continue;
        if (!seen.has(n.record.id)) {
          seen.add(n.record.id);
          next.push(n.record.id);
        }
      }
    }
    frontier = next;
  }
  seen.delete(id);
  return [...seen].map((i) => g.byId.get(i)!).filter(Boolean);
}

/** Linked records of a given entity, in either direction. */
export function linked(g: Graph, id: string, entity: string): AnyRecord[] {
  const seen = new Set<string>();
  return neighbours(g, id)
    .filter((n) => n.record.entity === entity && !seen.has(n.record.id) && seen.add(n.record.id))
    .map((n) => n.record);
}
