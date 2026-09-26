import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { daysBetween } from '../utils/dates';
import { whatIsMissing } from './gaps';
import { neighbours, type Graph } from './graph';
import { isActive } from './nextAction';

/**
 * ENTITY HEALTH (ultimate spec §13, §82). A health status computed only from what the record
 * and its digital thread actually contain — never a model guess. Each dimension carries its
 * score (0–1), a plain-language reason and whether it applies to this record type.
 *
 *   Completeness  — stored fields that hold a value (UNKNOWN / empty counts against)
 *   Evidence      — verification status + evidence records pointing at the record
 *   Thread        — "What is missing?" checks present vs expected
 *   Timeliness    — next action present, due or overdue (active work only)
 *   Risk          — open linked risks, critical when severity ≥ 9 or RPN ≥ 200
 *
 * Status: At Risk (overdue or critical risk) › Incomplete (completeness or thread < 50 %)
 *         › Attention (any dimension < 70 %) › Healthy.
 */
export type HealthStatus = 'Healthy' | 'Attention' | 'At Risk' | 'Incomplete';
export interface HealthDimension {
  key: 'completeness' | 'evidence' | 'thread' | 'timeliness' | 'risk';
  label: string;
  score: number;
  reason: string;
}
export interface Health {
  status: HealthStatus;
  score: number;
  dimensions: HealthDimension[];
  /** the dimensions that decided the status, weakest first */
  drivers: HealthDimension[];
}

const BASE = new Set(['id', 'entity', 'name', 'data_type', 'provenance', 'tags', 'links', 'created_at', 'updated_at', 'version', 'notes', '__origin', '__dataset', 'next_action']);
const EVIDENCE_SCORE: Record<string, number> = { VERIFIED: 1, SOURCE_DOCUMENTED: 0.85, CALCULATED: 0.75, INFERRED: 0.5, DRAFT: 0.35, ASSUMPTION: 0.3, UNKNOWN: 0.2, CONFLICTED: 0, STALE: 0.15 };
const RISK_BEARING = new Set(['opportunity', 'project', 'product', 'poc', 'configuration', 'module', 'supplier', 'bom', 'machine', 'requirement']);
/**
 * Checks the gap engine raises for *every* record of a type because V1 has no register for them
 * (documents, certifications, optic datasheets). They stay visible on "What Is Missing?" but do not
 * lower an individual record's health — they say nothing about that record.
 */
const PLATFORM_GAPS = new Set(['Controlled documents', 'Certification records', 'Optics compatibility data']);

export function isUnknownValue(v: unknown): boolean {
  if (v == null || v === '') return true;
  if (typeof v === 'string') return /^(unknown|not specified|tbd|n\/a)$/i.test(v.trim());
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'value' in (v as object)) return (v as { value: unknown }).value == null;
  return false;
}

function completeness(r: AnyRecord): HealthDimension {
  const entries = Object.entries(r).filter(([k]) => !BASE.has(k));
  const unknown = entries.filter(([, v]) => isUnknownValue(v)).map(([k]) => k.replace(/_/g, ' '));
  const known = entries.length - unknown.length;
  const score = entries.length ? known / entries.length : 0;
  return { key: 'completeness', label: 'Completeness', score, reason: entries.length ? (unknown.length ? `${known}/${entries.length} fields known · unknown: ${unknown.slice(0, 4).join(', ')}${unknown.length > 4 ? '…' : ''}` : `All ${entries.length} stored fields hold a value`) : 'Only a name is stored' };
}

function evidence(r: AnyRecord, g: Graph): HealthDimension {
  const v = r.provenance?.verification_status ?? 'UNKNOWN';
  const ev = (g.in.get(r.id) ?? []).filter((e) => g.byId.get(e.from)?.entity === 'evidence').length;
  const score = Math.min(1, (EVIDENCE_SCORE[v] ?? 0.2) + (ev ? 0.15 : 0));
  const demo = r.data_type === 'DEMO' ? ' · DEMO record' : '';
  return { key: 'evidence', label: 'Evidence', score, reason: `${v.replace(/_/g, ' ').toLowerCase()}${ev ? ` · ${ev} evidence record(s)` : ' · no evidence records'}${demo}` };
}

function threadDim(r: AnyRecord, g: Graph): HealthDimension | null {
  const gaps = whatIsMissing(g, r.id).filter((x) => !PLATFORM_GAPS.has(x.item));
  if (!gaps.length) {
    const n = neighbours(g, r.id).length;
    return n ? null : { key: 'thread', label: 'Thread', score: 0.5, reason: 'Not linked to any other record' };
  }
  const val = { present: 1, partial: 0.5, missing: 0 } as const;
  const score = gaps.reduce((s, x) => s + val[x.status], 0) / gaps.length;
  const miss = gaps.filter((x) => x.status === 'missing').map((x) => x.item);
  return { key: 'thread', label: 'Thread', score, reason: miss.length ? `${miss.length} of ${gaps.length} checks missing: ${miss.slice(0, 3).join(', ')}${miss.length > 3 ? '…' : ''}` : `${gaps.length} thread checks present or partial` };
}

function timeliness(r: AnyRecord, today: string): HealthDimension | null {
  if (!isActive(r)) return null;
  const na = r.next_action;
  const x = r as Record<string, unknown>;
  const due = na?.due ?? (r.entity === 'activity' ? ((x.due_date as string | undefined) ?? (x.follow_up_date as string | undefined)) : undefined);
  if (!na?.action && !due) return ENTITY_BY_TYPE[r.entity]?.requiresNextAction ? { key: 'timeliness', label: 'Timeliness', score: 0.4, reason: 'Active, but no next action recorded' } : null;
  if (!due) return { key: 'timeliness', label: 'Timeliness', score: 0.8, reason: 'Next action has no due date' };
  const d = daysBetween(today, due);
  if (d < 0) return { key: 'timeliness', label: 'Timeliness', score: 0, reason: `Overdue by ${-d} day(s)` };
  if (d <= 3) return { key: 'timeliness', label: 'Timeliness', score: 0.6, reason: d === 0 ? 'Due today' : `Due in ${d} day(s)` };
  return { key: 'timeliness', label: 'Timeliness', score: 1, reason: `Next action due in ${d} days` };
}

function risk(r: AnyRecord, g: Graph): HealthDimension | null {
  if (!RISK_BEARING.has(r.entity)) return null;
  const risks = neighbours(g, r.id)
    .map((n) => n.record as AnyRecord & Record<string, unknown>)
    .filter((x) => x.entity === 'risk' && x.risk_status === 'Open');
  const uniq = [...new Map(risks.map((x) => [x.id, x])).values()];
  if (!uniq.length) return { key: 'risk', label: 'Risk', score: 1, reason: 'No open linked risks' };
  const critical = uniq.filter((x) => {
    const s = x.severity as number | null | undefined;
    const rpn = s != null && x.occurrence != null && x.detection != null ? s * (x.occurrence as number) * (x.detection as number) : null;
    return (s != null && s >= 9) || (rpn != null && rpn >= 200);
  });
  return { key: 'risk', label: 'Risk', score: critical.length ? 0 : 0.5, reason: critical.length ? `${critical.length} critical open risk(s)` : `${uniq.length} open risk(s)` };
}

export function entityHealth(r: AnyRecord, g: Graph, today: string): Health {
  const dims = [completeness(r), evidence(r, g), threadDim(r, g), timeliness(r, today), risk(r, g)].filter((d): d is HealthDimension => !!d);
  const score = dims.reduce((s, d) => s + d.score, 0) / dims.length;
  const get = (k: HealthDimension['key']) => dims.find((d) => d.key === k);
  const drivers = [...dims].sort((a, b) => a.score - b.score).filter((d) => d.score < 0.7);
  let status: HealthStatus = 'Healthy';
  if (get('timeliness')?.score === 0 || get('risk')?.score === 0) status = 'At Risk';
  else if ((get('completeness')?.score ?? 1) < 0.5 || (get('thread')?.score ?? 1) < 0.5) status = 'Incomplete';
  else if (drivers.length) status = 'Attention';
  return { status, score, dimensions: dims, drivers };
}

export const HEALTH_TONE: Record<HealthStatus, 'ok' | 'warn' | 'bad' | 'neutral'> = { Healthy: 'ok', Attention: 'warn', 'At Risk': 'bad', Incomplete: 'neutral' };
