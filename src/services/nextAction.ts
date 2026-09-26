import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { daysBetween, todayIso } from '../utils/dates';

/**
 * NEXT ACTION engine (spec §66, §144). Every active opportunity, POC, product, project, gate,
 * supplier, risk and requirement must show its next required action. If the record has none,
 * the engine says so and offers a rule-based suggestion — clearly labelled as a suggestion.
 */
export interface NextActionView {
  record: AnyRecord;
  action: string | null;
  due?: string;
  owner?: string;
  source: 'RECORD' | 'SUGGESTED';
  rule?: string;
  overdue: boolean;
  dueInDays: number | null;
}

const CLOSED = new Set(['Won', 'Lost', 'Completed', 'Cancelled', 'Closed', 'Complete', 'Accepted', 'Resolved', 'Verified', 'Rejected', 'Obsolete', 'Awarded']);

export function isActive(r: AnyRecord): boolean {
  const s = [r.status, (r as { stage?: string }).stage, (r as { poc_status?: string }).poc_status, (r as { risk_status?: string }).risk_status, (r as { rfq_status?: string }).rfq_status, (r as { ticket_status?: string }).ticket_status]
    .filter(Boolean)
    .map(String);
  return !s.some((x) => CLOSED.has(x));
}

/** Stage-based suggestions. Sources: Automation Handbook Part 2 (requirements), Part 4, gates G0–G10, Part 59. */
const SUGGEST: Record<string, (r: AnyRecord) => { action: string; rule: string } | null> = {
  opportunity: (r) => {
    const stage = String((r as { stage?: string }).stage ?? '');
    const m: Record<string, string> = {
      Lead: 'Qualify: who buys, who uses, who approves; what is the pain in money? (Handbook §59.2)',
      Discovery: 'Capture customer inputs: part, material, CTQs, rate, variants, site (Handbook Part 2.3)',
      Requirement: 'Turn statements into URS lines with value, condition, verification and acceptance (G0)',
      Feasibility: 'Plan a POC on real samples to establish the process window (G1 input)',
      POC: 'Complete POC and record the decision with evidence',
      Proposal: 'Build cost model; price on customer value with a cost floor (Handbook §59.5)',
      Negotiation: 'Confirm margin against approval floor; record commercial deviations',
    };
    return m[stage] ? { action: m[stage], rule: `Stage "${stage}"` } : null;
  },
  poc: (r) => {
    const s = String((r as { poc_status?: string }).poc_status ?? '');
    const m: Record<string, string> = {
      Planned: 'Request representative samples and define measurement methods',
      'Samples Awaited': 'Chase samples; prepare DOE run sheet',
      'In Progress': 'Run DOE and record measurements',
      Analysis: 'Derive the process window and record the decision',
    };
    return m[s] ? { action: m[s], rule: `POC status "${s}"` } : null;
  },
  requirement: (r) =>
    !(r as { acceptance_criterion?: string }).acceptance_criterion
      ? { action: 'Add a measurable acceptance criterion and verification method (Handbook §2.4)', rule: 'Requirement without acceptance criterion' }
      : !(r as { value?: string }).value
        ? { action: 'Obtain the value and condition from the customer', rule: 'Requirement without a value' }
        : null,
  risk: (r) =>
    (r as { severity?: number | null }).severity == null
      ? { action: 'Score severity, occurrence and detection; assign an owner and due date', rule: 'Risk not scored' }
      : !(r as { action?: string }).action
        ? { action: 'Define the mitigating action', rule: 'Risk without action' }
        : null,
  project: (r) => {
    const gates = ((r as { gates?: { gate_code: string; decision: string }[] }).gates ?? []).filter((g) => g.decision === 'GO' || g.decision === 'GO WITH CONDITIONS');
    const next = `G${gates.length}`;
    return { action: `Prepare ${next} gate evidence`, rule: `${gates.length} gate(s) passed` };
  },
};

export function nextActionFor(r: AnyRecord, today = todayIso()): NextActionView {
  const na = r.next_action;
  if (na?.action) {
    const dueInDays = na.due ? daysBetween(today, na.due) : null;
    return { record: r, action: na.action, due: na.due, owner: na.owner, source: 'RECORD', overdue: dueInDays != null && dueInDays < 0, dueInDays };
  }
  const s = SUGGEST[r.entity]?.(r);
  return { record: r, action: s?.action ?? null, source: 'SUGGESTED', rule: s?.rule, overdue: false, dueInDays: null };
}

/** All active records that the spec requires to carry a next action. */
export function nextActions(records: AnyRecord[], today = todayIso()): NextActionView[] {
  return records
    .filter((r) => ENTITY_BY_TYPE[r.entity]?.requiresNextAction && isActive(r) && r.data_type !== 'PUBLIC')
    .map((r) => nextActionFor(r, today))
    .sort((a, b) => (a.dueInDays ?? 9999) - (b.dueInDays ?? 9999));
}
