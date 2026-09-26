import type { AnyRecord } from '../domain';
import type { Graph } from './graph';

/**
 * PRODUCT DEVELOPMENT LIFECYCLE (final master prompt §16). Seventeen stages from opportunity to
 * commercialization. A stage is "done" only when the thread holds the evidence named in its rule —
 * the rule is shown next to every stage, so the position is explainable and never asserted.
 */
export const LIFECYCLE_STAGES = [
  'Opportunity',
  'Requirement',
  'Market Assessment',
  'Technology Assessment',
  'Concept',
  'Architecture',
  'Feasibility',
  'Supplier Identification',
  'BOM',
  'Costing',
  'Prototype',
  'POC',
  'DFM',
  'Engineering Build',
  'Validation',
  'Pilot',
  'Commercialization',
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export interface StageStatus {
  stage: LifecycleStage;
  done: boolean;
  rule: string;
  evidence: string[];
}
export interface Lifecycle {
  stages: StageStatus[];
  /** first stage not done (the one to work on), or null when all are done */
  current: LifecycleStage | null;
  doneCount: number;
}

type R = AnyRecord & Record<string, unknown>;
const GO = new Set(['GO', 'GO WITH CONDITIONS']);

/** Collect the development context around a subject (opportunity, project or product). */
function context(g: Graph, id: string) {
  const all = [...g.byId.values()] as R[];
  const subject = g.byId.get(id) as R | undefined;
  const ids = new Set<string>([id]);
  const oppId = subject?.entity === 'opportunity' ? id : (subject?.opportunity_id as string | undefined);
  const productId = subject?.entity === 'product' ? id : (subject?.product_id as string | undefined);
  if (oppId) ids.add(oppId);
  const projects = all.filter((r) => r.entity === 'project' && (r.id === id || (oppId && r.opportunity_id === oppId) || (subject?.entity === 'product' && r.product_id === id)));
  projects.forEach((p) => ids.add(p.id));
  const opp = oppId ? (g.byId.get(oppId) as R | undefined) : undefined;
  const linkedTo = (r: R) => [...ids].some((x) => r.opportunity_id === x || r.project_id === x) || (productId != null && r.product_id === productId && subject?.entity === 'product');
  const configs = all.filter((r) => r.entity === 'configuration' && (linkedTo(r) || projects.some((p) => p.configuration_id === r.id)));
  const boms = all.filter((r) => r.entity === 'bom' && (linkedTo(r) || projects.some((p) => p.bom_id === r.id) || configs.some((c) => r.configuration_id === c.id)));
  const costs = all.filter((r) => r.entity === 'cost_model' && (linkedTo(r) || projects.some((p) => p.cost_model_id === r.id)));
  return {
    subject,
    opp,
    product: productId ? (g.byId.get(productId) as R | undefined) : undefined,
    projects,
    requirements: all.filter((r) => r.entity === 'requirement' && linkedTo(r)),
    pocs: all.filter((r) => r.entity === 'poc' && linkedTo(r)),
    configs,
    boms,
    costs,
    rfqs: all.filter((r) => r.entity === 'rfq' && (linkedTo(r) || boms.some((b) => r.bom_id === b.id))),
    acceptance: all.filter((r) => r.entity === 'acceptance' && linkedTo(r)),
    technologies: ((opp?.technology_ids as string[] | undefined) ?? []).map((t) => g.byId.get(t) as R | undefined).filter((x): x is R => !!x),
  };
}

export function lifecycleFor(g: Graph, id: string): Lifecycle {
  const c = context(g, id);
  const gate = (code: string) => c.projects.flatMap((p) => ((p.gates as { gate_code: string; decision: string }[] | undefined) ?? []).filter((x) => x.gate_code === code && GO.has(x.decision)).map(() => `${p.name}: ${code} passed`));
  const names = (rs: R[]) => rs.map((r) => r.name);
  const maturity = String(c.product?.maturity ?? '');
  const passed = (a: R) => ((a.tests as { result?: string }[] | undefined) ?? []).length > 0 && ((a.tests as { result?: string }[]).every((t) => t.result === 'PASS' || t.result === 'PASS WITH DEVIATION'));
  const rows: [LifecycleStage, string, string[]][] = [
    ['Opportunity', 'An opportunity record exists', c.opp ? [c.opp.name] : []],
    ['Requirement', 'At least one requirement is linked', names(c.requirements)],
    ['Market Assessment', 'Opportunity has a market size with its source', c.opp?.market_size != null && c.opp?.market_size_source ? [`${c.opp.market_size} (${String(c.opp.market_size_source)})`] : []],
    ['Technology Assessment', 'A linked technology has a TRL with its basis', c.technologies.filter((t) => t.trl != null && t.trl_basis).map((t) => `${t.name}: TRL ${String(t.trl)}`)],
    ['Concept', 'A product concept (platform) is chosen', c.product ? [c.product.name] : c.opp?.product_id ? [String(c.opp.product_id)] : []],
    ['Architecture', 'A machine configuration exists (architecture derives from it)', names(c.configs)],
    ['Feasibility', 'Gate G1 passed, or the opportunity is past Feasibility', [...gate('G1'), ...(['POC', 'Proposal', 'Negotiation', 'Won'].includes(String(c.opp?.stage)) ? [`Opportunity stage ${String(c.opp?.stage)}`] : [])]],
    ['Supplier Identification', 'An RFQ exists for the BOM', names(c.rfqs)],
    ['BOM', 'A BOM exists', names(c.boms)],
    ['Costing', 'A cost model exists', names(c.costs)],
    ['Prototype', 'Gate G3 (detailed design) passed', gate('G3')],
    ['POC', 'A POC concluded “Feasible”', c.pocs.filter((p) => p.decision === 'Feasible').map((p) => p.name)],
    ['DFM', 'Gate G5 (manufacturing readiness) passed', gate('G5')],
    ['Engineering Build', 'Gate G7 (integration readiness) passed', gate('G7')],
    ['Validation', 'A FAT/SAT protocol has every test passed', c.acceptance.filter(passed).map((a) => a.name)],
    ['Pilot', 'Gate G9 (SAT readiness) passed', gate('G9')],
    ['Commercialization', 'Gate G10 passed, or the product’s maturity is Product / Platform / Scale', [...gate('G10'), ...(['Product', 'Platform', 'Scale'].includes(maturity) && c.subject?.entity === 'product' ? [`${c.product?.name} maturity ${maturity}`] : [])]],
  ];
  const stages = rows.map(([stage, rule, evidence]) => ({ stage, rule, evidence, done: evidence.length > 0 }));
  return { stages, current: stages.find((s) => !s.done)?.stage ?? null, doneCount: stages.filter((s) => s.done).length };
}
