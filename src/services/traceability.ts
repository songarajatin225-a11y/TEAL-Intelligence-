import type { AcceptanceProtocol, Bom, Requirement } from '../domain/entities';

/**
 * TRACEABILITY (spec §39): Requirement → design feature → module → BOM → test → FAT → SAT.
 * Missing links are reported per requirement.
 */
export interface TraceRow {
  req: Requirement;
  design: string[];
  modules: string[];
  bomLines: { bom: string; line: string; description: string }[];
  fat: string[];
  sat: string[];
  missing: string[];
}

export function traceMatrix(reqs: Requirement[], boms: Bom[], protocols: AcceptanceProtocol[]): TraceRow[] {
  return reqs.map((req) => {
    const t = req.trace ?? {};
    const modules = t.module_ids ?? [];
    const bomLines = boms.flatMap((b) => b.lines.filter((l) => (l.module_id && modules.includes(l.module_id)) || (t.bom_line_ids ?? []).includes(`${b.id}:${l.line_id}`)).map((l) => ({ bom: b.id, line: l.line_id, description: l.description })));
    const tests = (phase: 'FAT' | 'SAT') => [...(phase === 'FAT' ? (t.fat_test_ids ?? []) : (t.sat_test_ids ?? [])), ...protocols.filter((p) => p.phase === phase).flatMap((p) => p.tests.filter((x) => x.requirement_id === req.id).map((x) => `${p.id}:${x.test_id}`))];
    const fat = tests('FAT');
    const sat = tests('SAT');
    const design = t.design_features ?? [];
    const missing: string[] = [];
    if (!req.acceptance_criterion) missing.push('acceptance criterion');
    if (!req.verification_method) missing.push('verification method');
    if (!design.length && !modules.length) missing.push('design feature / module');
    if (modules.length && !bomLines.length) missing.push('BOM line');
    if (!fat.length) missing.push('FAT test');
    if (!sat.length) missing.push('SAT test');
    return { req, design, modules, bomLines, fat, sat, missing };
  });
}
