import { describe, expect, it } from 'vitest';
import { computeCost, fxTable } from '../../src/calculations/cost';
import type { AcceptanceProtocol, Bom, GateDefinition, Project, Requirement } from '../../src/domain/entities';
import { newLocalId, validateRecord } from '../../src/repositories';
import { bomLinesFromConfig, costMaterialLinesFromBom } from '../../src/services/bomGen';
import { generateProtocol, protocolSummary, type AcceptanceChecklists } from '../../src/services/fatSat';
import { canDecide, newReview } from '../../src/services/gates';
import { traceMatrix } from '../../src/services/traceability';
import { config } from '../helpers/data';
import { inquiryContext, masterRecords } from '../helpers/repo';

describe('digital thread integration', async () => {
  const master = await masterRecords();
  const ctx = await inquiryContext(master);
  const e = ctx.engine;
  const checklists = config<AcceptanceChecklists>('config/acceptance-checklists.json');
  const gates = master.filter((r) => r.entity === 'gate_definition') as unknown as GateDefinition[];
  const gate = (c: string) => gates.find((g) => g.code === c)!;

  it('Product → Configuration → BOM → Cost: estimates flow through, unknowns are excluded not invented', () => {
    const s = e.initialState('markc2i');
    const lines = bomLinesFromConfig(e, s);
    expect(lines[0].level).toBe('Product');
    expect(lines[0].cost_basis).toBe('ESTIMATE');
    const mat = costMaterialLinesFromBom(lines);
    // the product header and UNKNOWN-cost lines never become cost lines
    expect(mat.every((m) => m.price != null)).toBe(true);
    expect(mat.length).toBe(lines.filter((l) => l.unit_cost != null && l.level !== 'Product').length);
    const c = computeCost({ qty: 1, lines: { material: mat }, landed: { freightPct: 0, dutyPct: 0, landingPct: 0, gstPct: 0, siteContPct: 0 }, markup: { overheadPct: 0, contingencyPct: 0, profitPct: 0 } }, fxTable([]));
    const expected = mat.reduce((sum, m) => sum + Number(m.qty) * Number(m.price), 0);
    expect(c.buckets.material).toBeCloseTo(expected, 6);
    expect(c.warnings).toEqual([]);
  });

  it('Requirement → FAT/SAT → Traceability: generated protocols close the FAT/SAT links', () => {
    const reqs = master.filter((r) => r.entity === 'requirement') as unknown as Requirement[];
    const project = { id: 'prj-Ltest', name: 'Package marking (test)', opportunity_id: 'opp-demo-pkg-marking' } as Project;
    const scoped = reqs.filter((r) => r.opportunity_id === project.opportunity_id);
    expect(scoped.length).toBeGreaterThan(0);
    const before = traceMatrix(scoped, [], []);
    expect(before.every((r) => r.missing.includes('FAT test') && r.missing.includes('SAT test'))).toBe(true);

    const fat = generateProtocol('FAT', project, scoped, checklists, newLocalId);
    const sat = generateProtocol('SAT', project, scoped, checklists, newLocalId);
    expect(() => validateRecord(fat as unknown as Record<string, unknown>)).not.toThrow();
    expect(() => validateRecord(sat as unknown as Record<string, unknown>)).not.toThrow();
    // FAT = one test per requirement + the handbook §38.8 checklist; nothing is pre-passed
    expect(fat.tests.length).toBe(scoped.length + checklists.fat.items.length);
    expect(protocolSummary(fat).notRun).toBe(fat.tests.length);

    const after = traceMatrix(scoped, [], [fat, sat] as AcceptanceProtocol[]);
    expect(after.every((r) => r.fat.length === 1 && r.sat.length === 1)).toBe(true);
    expect(after.some((r) => r.missing.includes('FAT test'))).toBe(false);
  });

  it('Requirement → Module → BOM: a module trace finds the BOM line built from it', () => {
    const s = e.initialState('semispm');
    const lines = bomLinesFromConfig(e, s);
    const withModule = lines.find((l) => l.module_id)!;
    const bom = { id: 'bom-test', entity: 'bom', name: 'test', bom_type: 'EBOM', lines, data_type: 'DEMO', provenance: { verification_status: 'DRAFT' } } as unknown as Bom;
    const req = { id: 'req-test', entity: 'requirement', name: 'Handling', code: 'R1', trace: { module_ids: [withModule.module_id!] }, acceptance_criterion: 'x', verification_method: 'Test' } as unknown as Requirement;
    const [row] = traceMatrix([req], [bom], []);
    expect(row.bomLines.map((l) => l.line)).toContain(withModule.line_id);
    expect(row.missing).not.toContain('BOM line');
  });

  it('Project → Gate: G1 cannot pass before G0; customer-facing gates need the customer', () => {
    const g1 = { ...newReview(gate('G1')), evidence: newReview(gate('G1')).evidence.map((x) => ({ ...x, status: 'provided' as const })) };
    const r1 = canDecide({ gates: [] }, g1, gate('G1'), 'GO');
    expect(r1.allowed).toBe(false);
    expect(r1.checks.find((c) => c.rule === 'R2')?.ok).toBe(false);
    const g0 = { ...newReview(gate('G0')), decision: 'GO' as const, evidence: newReview(gate('G0')).evidence.map((x) => ({ ...x, status: 'provided' as const })), approvers: ['PM'] };
    expect(canDecide({ gates: [] }, g0, gate('G0'), 'GO').checks.find((c) => c.rule === 'R5')?.ok).toBe(false);
    expect(canDecide({ gates: [g0] }, g1, gate('G1'), 'GO').allowed).toBe(true);
  });
});
