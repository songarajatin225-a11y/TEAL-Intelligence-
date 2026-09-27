import type { AnyRecord } from '../../domain';
import type { Requirement } from '../../domain/entities';
import type { Verification } from '../../domain/engineering';

/*
 * REQUIREMENT QUALITY + TRACEABILITY COVERAGE (master prompt §85–§89).
 * Checks are wording and completeness rules — each issue names the rule it broke.
 */

export const VAGUE_TERMS = [
  'fast',
  'quick',
  'quickly',
  'high',
  'low',
  'good',
  'best',
  'adequate',
  'sufficient',
  'appropriate',
  'robust',
  'reliable',
  'user-friendly',
  'user friendly',
  'easy',
  'flexible',
  'efficient',
  'optimal',
  'maximize',
  'minimise',
  'minimize',
  'maximise',
  'state-of-the-art',
  'state of the art',
  'as required',
  'as needed',
  'if possible',
  'etc',
  'and/or',
  'approximately',
  'about',
  'normal',
  'typical',
  'suitable',
  'seamless',
  'high throughput',
  'high speed',
  'high accuracy',
];

export interface ReqIssue {
  rule: 'vague' | 'ambiguous' | 'missing-unit' | 'missing-acceptance' | 'missing-owner' | 'missing-source' | 'missing-verification' | 'missing-validation' | 'duplicate' | 'conflict';
  severity: 'error' | 'warning';
  message: string;
  other?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function requirementIssues(req: Requirement & AnyRecord, all: (Requirement & AnyRecord)[] = []): ReqIssue[] {
  const text = `${req.name} ${req.description ?? ''} ${req.value ?? ''}`;
  const lower = ` ${text.toLowerCase()} `;
  const out: ReqIssue[] = [];
  const vague = VAGUE_TERMS.filter((t) => new RegExp(`[^a-z]${t.replace(/[-/]/g, (c) => `\\${c}`)}[^a-z]`).test(lower));
  if (vague.length) out.push({ rule: 'vague', severity: 'warning', message: `Vague wording: ${vague.map((v) => `“${v}”`).join(', ')} — state a measurable value, unit and condition` });
  if (/\b(should|may|might|could|possibly)\b/i.test(req.name) && req.priority === 'Must') out.push({ rule: 'ambiguous', severity: 'warning', message: 'Priority is Must but the wording says should / may — make them agree' });
  if (/\b(it|they|this|that)\b/i.test(req.name.split(/\s+/).slice(0, 2).join(' '))) out.push({ rule: 'ambiguous', severity: 'warning', message: 'Starts with a pronoun — name the subject explicitly' });
  const hasNumber = /\d/.test(String(req.value ?? ''));
  if (hasNumber && !req.unit && !/[a-zµ°%]/i.test(String(req.value).replace(/[\d.,\s–-]/g, ''))) out.push({ rule: 'missing-unit', severity: 'error', message: `Value “${req.value}” has no unit` });
  if (!req.acceptance_criterion) out.push({ rule: 'missing-acceptance', severity: 'error', message: 'No acceptance criterion' });
  if (!req.owner) out.push({ rule: 'missing-owner', severity: 'warning', message: 'No owner' });
  if (!req.source && !req.parent_id) out.push({ rule: 'missing-source', severity: 'warning', message: 'No source (customer statement or parent requirement)' });
  if (!req.verification_method) out.push({ rule: 'missing-verification', severity: 'error', message: 'No verification method (inspection, analysis, demonstration or test)' });
  if ((req.level === 'Customer Statement' || req.level === 'URS' || req.req_type === 'Customer' || req.req_type === 'Market') && !req.validation_method) out.push({ rule: 'missing-validation', severity: 'warning', message: 'Customer-level requirement without a validation method' });
  const me = norm(req.name);
  for (const o of all) {
    if (o.id === req.id) continue;
    if (norm(o.name) === me) out.push({ rule: 'duplicate', severity: 'warning', message: `Same wording as ${o.code ?? o.id}`, other: o.id });
    // same subject, same unit, different numbers, same scope → possible conflict
    const scope = (r: Requirement) => r.project_id ?? r.opportunity_id ?? r.product_id ?? r.simulation_id;
    if (scope(o) && scope(o) === scope(req) && o.unit && o.unit === req.unit && o.category === req.category && o.value && req.value && o.value !== req.value && norm(o.name).split(' ').filter((w) => w.length > 3 && me.includes(w)).length >= 2) out.push({ rule: 'conflict', severity: 'warning', message: `Possible conflict with ${o.code ?? o.id}: ${o.value} ${o.unit} vs ${req.value} ${req.unit}`, other: o.id });
  }
  return out;
}

/* ---------------------------------------------------------------- traceability chain (§87) */

export const TRACE_STEPS = ['Customer requirement', 'Product / system requirement', 'Subsystem / component', 'Design / equipment', 'BOM', 'Test', 'Verification', 'Validation', 'Customer acceptance'] as const;
export type TraceStep = (typeof TRACE_STEPS)[number];

export interface TraceChain {
  req: Requirement & AnyRecord;
  steps: { step: TraceStep; ok: boolean; evidence: string[] }[];
  coverage: number;
}

/** Which links of the §87 chain exist for one requirement — from records, not claims. */
export function traceChain(req: Requirement & AnyRecord, records: AnyRecord[]): TraceChain {
  const children = records.filter((r) => r.entity === 'requirement' && (r as { parent_id?: string }).parent_id === req.id);
  const vers = records.filter((r) => r.entity === 'verification' && (r as unknown as Verification).requirement_id === req.id) as (Verification & AnyRecord)[];
  const sims = records.filter((r) => r.entity === 'simulation' && (((r as { requirement_ids?: string[] }).requirement_ids ?? []).includes(req.id) || req.simulation_id === r.id));
  const t = req.trace ?? {};
  const acc = records.filter((r) => r.entity === 'acceptance' && ((r as { tests?: { requirement_id?: string; result?: string }[] }).tests ?? []).some((x) => x.requirement_id === req.id));
  const accPassed = records.filter((r) => r.entity === 'acceptance' && (r as { phase?: string }).phase === 'SAT' && ((r as { tests?: { requirement_id?: string; result?: string }[] }).tests ?? []).some((x) => x.requirement_id === req.id && x.result === 'PASS'));
  const steps: TraceChain['steps'] = [
    { step: 'Customer requirement', ok: !!(req.source || req.level === 'Customer Statement' || req.customer_id || req.opportunity_id), evidence: [req.source ? `Source: ${req.source.slice(0, 60)}` : '', req.customer_id ?? '', req.opportunity_id ?? ''].filter(Boolean) },
    { step: 'Product / system requirement', ok: !!(req.product_id || req.system || children.length || req.level === 'SRS' || req.level === 'FRS'), evidence: [req.product_id ?? '', req.system ?? '', ...children.map((c) => c.id)].filter(Boolean) },
    { step: 'Subsystem / component', ok: !!(req.subsystem || req.part_id || (t.module_ids ?? []).length), evidence: [req.subsystem ?? '', req.part_id ?? '', ...(t.module_ids ?? [])].filter(Boolean) },
    { step: 'Design / equipment', ok: !!((t.design_features ?? []).length || sims.length), evidence: [...(t.design_features ?? []), ...sims.map((s) => s.id)] },
    { step: 'BOM', ok: !!(t.bom_line_ids ?? []).length, evidence: t.bom_line_ids ?? [] },
    { step: 'Test', ok: !!((t.test_ids ?? []).length || acc.length || vers.some((v) => v.method === 'Test')), evidence: [...(t.test_ids ?? []), ...acc.map((a) => a.id), ...vers.filter((v) => v.method === 'Test').map((v) => v.id)] },
    { step: 'Verification', ok: vers.some((v) => v.kind === 'Verification' && v.result !== 'NOT RUN'), evidence: vers.filter((v) => v.kind === 'Verification').map((v) => `${v.id}: ${v.result}`) },
    { step: 'Validation', ok: vers.some((v) => v.kind === 'Validation' && v.result !== 'NOT RUN'), evidence: vers.filter((v) => v.kind === 'Validation').map((v) => `${v.id}: ${v.result}`) },
    { step: 'Customer acceptance', ok: accPassed.length > 0, evidence: accPassed.map((a) => a.id) },
  ];
  return { req, steps, coverage: Math.round((steps.filter((s) => s.ok).length / steps.length) * 100) };
}

export function traceCoverage(chains: TraceChain[]): { step: TraceStep; covered: number; total: number }[] {
  return TRACE_STEPS.map((step) => ({ step, covered: chains.filter((c) => c.steps.find((s) => s.step === step)!.ok).length, total: chains.length }));
}
