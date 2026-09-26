import type { GateDefinition, GateReview, Project } from '../domain/entities';

/**
 * G0–G10 GATE RULES (spec §45; Automation Handbook "Design review gates G0–G10" + gate rules).
 *  R1  A gate cannot pass (GO / GO WITH CONDITIONS) while any mandatory evidence item is missing.
 *  R2  The previous gate must have passed.
 *  R3  Conditions carried forward from the previous gate must be closed before the next gate.
 *  R4  GO WITH CONDITIONS requires every condition to name an owner and a date.
 *  R5  Customer-facing gates (G0, G2, G8 FAT, G9 SAT, G10) include the customer's signature.
 */
export type GateDecision = GateReview['decision'];

export interface GateCheck {
  rule: string;
  ok: boolean;
  message: string;
}

export const gateOrder = (code: string) => parseInt(code.replace(/^G/, ''), 10);

export function newReview(def: GateDefinition): GateReview {
  return {
    gate_code: def.code,
    decision: 'PENDING',
    approvers: [],
    evidence: def.mandatory_evidence.map((item) => ({ item, mandatory: true, status: 'missing' })),
    conditions: [],
    risks: [],
  };
}

const passed = (r?: GateReview) => r?.decision === 'GO' || r?.decision === 'GO WITH CONDITIONS';

export function checkGate(project: Pick<Project, 'gates'>, review: GateReview, def: GateDefinition, decision: GateDecision): GateCheck[] {
  const checks: GateCheck[] = [];
  if (decision === 'NO-GO' || decision === 'PENDING') return [{ rule: 'R0', ok: true, message: `${decision} can always be recorded` }];
  const missing = review.evidence.filter((e) => e.mandatory && e.status === 'missing');
  checks.push({ rule: 'R1', ok: missing.length === 0, message: missing.length ? `Mandatory evidence missing: ${missing.map((m) => m.item).join('; ')}` : 'All mandatory evidence provided or not applicable' });
  const n = gateOrder(def.code);
  if (n > 0) {
    const prev = project.gates.find((g) => gateOrder(g.gate_code) === n - 1);
    checks.push({ rule: 'R2', ok: passed(prev), message: passed(prev) ? `G${n - 1} passed (${prev?.decision})` : `G${n - 1} has not passed` });
    const open = (prev?.conditions ?? []).filter((c) => !c.closed);
    checks.push({ rule: 'R3', ok: open.length === 0, message: open.length ? `${open.length} condition(s) from G${n - 1} still open` : `No open conditions from G${n - 1}` });
  }
  if (decision === 'GO WITH CONDITIONS') {
    const conds = review.conditions ?? [];
    const bad = conds.filter((c) => !c.owner?.trim() || !c.due);
    checks.push({ rule: 'R4', ok: conds.length > 0 && bad.length === 0, message: !conds.length ? 'GO WITH CONDITIONS needs at least one named condition' : bad.length ? `${bad.length} condition(s) without owner and date` : 'Every condition has an owner and a date' });
  }
  if (def.customer_facing) {
    const hasCustomer = (review.approvers ?? []).some((a) => /customer/i.test(a));
    checks.push({ rule: 'R5', ok: hasCustomer, message: hasCustomer ? 'Customer signature recorded' : `${def.code} is customer-facing: add the customer as an approver` });
  }
  return checks;
}

export function canDecide(project: Pick<Project, 'gates'>, review: GateReview, def: GateDefinition, decision: GateDecision): { allowed: boolean; checks: GateCheck[] } {
  const checks = checkGate(project, review, def, decision);
  return { allowed: checks.every((c) => c.ok), checks };
}

export type GateHealth = 'passed' | 'conditional' | 'failed' | 'in_review' | 'not_started';

export function gateHealth(project: Pick<Project, 'gates'>, code: string): GateHealth {
  const r = project.gates.find((g) => g.gate_code === code);
  if (!r) return 'not_started';
  if (r.decision === 'GO') return 'passed';
  if (r.decision === 'GO WITH CONDITIONS') return 'conditional';
  if (r.decision === 'NO-GO') return 'failed';
  return 'in_review';
}

/** The next gate to work on: the lowest-numbered gate that has not passed. */
export function nextGate(project: Pick<Project, 'gates'>, defs: GateDefinition[]): GateDefinition | undefined {
  return [...defs].sort((a, b) => a.order - b.order).find((d) => !passed(project.gates.find((g) => g.gate_code === d.code)));
}
