import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { isActive, nextActions } from './nextAction';

/**
 * ATTENTION (spec §19, §40): the few things that need a person now, derived only from records —
 * overdue / due-soon next actions, blocked work, high risks, awaited samples, requirements that
 * cannot be verified. No invented alerts; every item links to its record.
 */
export type AttentionLevel = 'critical' | 'attention' | 'info';
export interface AttentionItem {
  id: string;
  level: AttentionLevel;
  kind: 'overdue' | 'due' | 'blocked' | 'risk' | 'samples' | 'verification' | 'missing_action';
  title: string;
  context: string;
  action?: string;
  due?: string;
  dueInDays?: number | null;
  owner?: string;
  recordId: string;
}

const RANK: Record<AttentionLevel, number> = { critical: 0, attention: 1, info: 2 };

export function attentionItems(records: AnyRecord[], today: string): AttentionItem[] {
  const out: AttentionItem[] = [];
  const label = (r: AnyRecord) => ENTITY_BY_TYPE[r.entity]?.label ?? 'Record';

  for (const v of nextActions(records, today)) {
    const r = v.record;
    if (v.source === 'RECORD' && v.overdue) out.push({ id: `od:${r.id}`, level: 'critical', kind: 'overdue', title: r.name, context: `${label(r)} · next action overdue`, action: v.action ?? undefined, due: v.due, dueInDays: v.dueInDays, owner: v.owner ?? r.owner, recordId: r.id });
    else if (v.source === 'RECORD' && v.dueInDays != null && v.dueInDays <= 3) out.push({ id: `du:${r.id}`, level: 'attention', kind: 'due', title: r.name, context: `${label(r)} · due soon`, action: v.action ?? undefined, due: v.due, dueInDays: v.dueInDays, owner: v.owner ?? r.owner, recordId: r.id });
    else if (!v.action) out.push({ id: `na:${r.id}`, level: 'info', kind: 'missing_action', title: r.name, context: `${label(r)} · no next action defined`, recordId: r.id });
  }

  for (const r of records) {
    if (!isActive(r)) continue;
    const x = r as AnyRecord & Record<string, unknown>;
    if (r.entity === 'activity' && (x.status === 'Blocked' || x.blocker)) {
      out.push({ id: `bl:${r.id}`, level: 'critical', kind: 'blocked', title: r.name, context: `Blocked${x.blocker ? ` — ${String(x.blocker)}` : ''}`, due: x.due_date as string | undefined, owner: r.owner, recordId: r.id });
    }
    if (r.entity === 'poc' && x.poc_status === 'Samples Awaited') {
      out.push({ id: `sa:${r.id}`, level: 'attention', kind: 'samples', title: r.name, context: 'POC · customer samples awaited', owner: r.owner, recordId: r.id });
    }
    if (r.entity === 'risk' && x.risk_status === 'Open') {
      const s = x.severity as number | null | undefined;
      const rpn = s != null && x.occurrence != null && x.detection != null ? s * (x.occurrence as number) * (x.detection as number) : null;
      const critical = (s != null && s >= 9) || (rpn != null && rpn >= 200);
      out.push({ id: `rk:${r.id}`, level: critical ? 'critical' : 'attention', kind: 'risk', title: r.name, context: rpn != null ? `Open risk · RPN ${rpn}` : 'Open risk · not yet scored', action: (x.action as string | undefined) ?? undefined, owner: r.owner, recordId: r.id });
    }
  }

  const noCriterion = records.filter((r) => r.entity === 'requirement' && isActive(r) && !(r as { acceptance_criterion?: string }).acceptance_criterion);
  for (const r of noCriterion.slice(0, 5)) out.push({ id: `vr:${r.id}`, level: 'info', kind: 'verification', title: r.name, context: 'Requirement · no acceptance criterion — cannot be verified at FAT', recordId: r.id });

  // one row per record: keep the most urgent signal, fold the others into its context
  const sorted = out.sort((a, b) => RANK[a.level] - RANK[b.level] || (a.dueInDays ?? 999) - (b.dueInDays ?? 999));
  const byRecord = new Map<string, AttentionItem>();
  for (const it of sorted) {
    const prev = byRecord.get(it.recordId);
    if (!prev) byRecord.set(it.recordId, { ...it });
    else if (!prev.context.includes(it.context.split(' · ').pop()!)) prev.context += ` · ${it.context.split(' · ').pop()}`;
  }
  return [...byRecord.values()];
}

export function attentionCounts(items: AttentionItem[]) {
  return {
    critical: items.filter((i) => i.level === 'critical').length,
    attention: items.filter((i) => i.level === 'attention').length,
    info: items.filter((i) => i.level === 'info').length,
    dueSoon: items.filter((i) => i.kind === 'due').length,
  };
}
