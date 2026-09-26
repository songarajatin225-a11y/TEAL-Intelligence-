import type { ProjectTask } from '../domain/entities';
import { daysBetween } from '../utils/dates';

/**
 * Critical path (spec §72). Durations come from task dates; dependencies are finish-to-start.
 * Forward/backward pass over the dependency DAG; slack 0 ⇒ critical. Cycles are reported.
 */
export interface CpmTask {
  id: string;
  duration: number;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  slack: number;
  critical: boolean;
}

export function criticalPath(tasks: ProjectTask[]): { tasks: Map<string, CpmTask>; path: string[]; length: number; cycle: boolean } {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const dur = (t: ProjectTask) => Math.max(0, daysBetween(t.start, t.end));
  // topological order (Kahn)
  const indeg = new Map(tasks.map((t) => [t.id, (t.depends_on ?? []).filter((d) => byId.has(d)).length]));
  const q = tasks.filter((t) => indeg.get(t.id) === 0).map((t) => t.id);
  const order: string[] = [];
  while (q.length) {
    const id = q.shift()!;
    order.push(id);
    for (const t of tasks) {
      if ((t.depends_on ?? []).includes(id)) {
        indeg.set(t.id, (indeg.get(t.id) ?? 0) - 1);
        if (indeg.get(t.id) === 0) q.push(t.id);
      }
    }
  }
  const cycle = order.length !== tasks.length;
  const res = new Map<string, CpmTask>();
  for (const id of order) {
    const t = byId.get(id)!;
    const es = Math.max(0, ...(t.depends_on ?? []).filter((d) => res.has(d)).map((d) => res.get(d)!.ef));
    res.set(id, { id, duration: dur(t), es, ef: es + dur(t), ls: 0, lf: 0, slack: 0, critical: false });
  }
  const length = Math.max(0, ...[...res.values()].map((r) => r.ef));
  for (const id of [...order].reverse()) {
    const r = res.get(id)!;
    const succ = tasks.filter((t) => (t.depends_on ?? []).includes(id)).map((t) => res.get(t.id)).filter(Boolean) as CpmTask[];
    r.lf = succ.length ? Math.min(...succ.map((s) => s.ls)) : length;
    r.ls = r.lf - r.duration;
    r.slack = r.ls - r.es;
    r.critical = r.slack === 0;
  }
  const path = order.filter((id) => res.get(id)!.critical);
  return { tasks: res, path, length, cycle };
}
