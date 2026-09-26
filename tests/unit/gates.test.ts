import { describe, expect, it } from 'vitest';
import type { GateDefinition, GateReview, ProjectTask } from '../../src/domain/entities';
import { canDecide, gateHealth, newReview, nextGate } from '../../src/services/gates';
import { criticalPath } from '../../src/services/schedule';
import { dataset } from '../helpers/data';

const defs = dataset<GateDefinition>('gates/gate-definitions.json');
const g = (code: string) => defs.find((d) => d.code === code)!;

describe('G0–G10 gate definitions (from the Automation Handbook)', () => {
  it('has 11 gates in order with mandatory evidence', () => {
    expect(defs.map((d) => d.code)).toEqual(['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10']);
    expect(g('G0').mandatory_evidence).toContain('URS (signed values)');
    expect(g('G8').customer_facing).toBe(true);
    expect(g('G3').customer_facing).toBe(false);
  });
});

describe('gate rules', () => {
  it('R1: cannot pass with mandatory evidence missing', () => {
    const review = newReview(g('G0'));
    const r = canDecide({ gates: [] }, review, g('G0'), 'GO');
    expect(r.allowed).toBe(false);
    expect(r.checks.find((c) => c.rule === 'R1')?.ok).toBe(false);
  });

  it('G0 passes with all evidence provided and the customer signature', () => {
    const review: GateReview = { ...newReview(g('G0')), approvers: ['Head of engineering', 'Customer'] };
    review.evidence = review.evidence.map((e) => ({ ...e, status: 'provided' }));
    expect(canDecide({ gates: [] }, review, g('G0'), 'GO').allowed).toBe(true);
  });

  it('R5: customer-facing gate requires the customer approver', () => {
    const review: GateReview = { ...newReview(g('G0')), approvers: ['Head of engineering'] };
    review.evidence = review.evidence.map((e) => ({ ...e, status: 'provided' }));
    const r = canDecide({ gates: [] }, review, g('G0'), 'GO');
    expect(r.allowed).toBe(false);
    expect(r.checks.find((c) => c.rule === 'R5')?.ok).toBe(false);
  });

  it('R2: G1 requires G0 passed; R3: open G0 conditions block G1', () => {
    const g1: GateReview = { ...newReview(g('G1')), evidence: newReview(g('G1')).evidence.map((e) => ({ ...e, status: 'provided' })) };
    expect(canDecide({ gates: [] }, g1, g('G1'), 'GO').allowed).toBe(false);
    const g0Cond: GateReview = { ...newReview(g('G0')), decision: 'GO WITH CONDITIONS', conditions: [{ text: 'UPH to be confirmed', owner: 'PM', due: '2026-10-10' }] };
    expect(canDecide({ gates: [g0Cond] }, g1, g('G1'), 'GO').checks.find((c) => c.rule === 'R3')?.ok).toBe(false);
    const g0Closed: GateReview = { ...g0Cond, conditions: [{ text: 'UPH to be confirmed', owner: 'PM', due: '2026-10-10', closed: true }] };
    expect(canDecide({ gates: [g0Closed] }, g1, g('G1'), 'GO').allowed).toBe(true);
  });

  it('R4: GO WITH CONDITIONS needs named conditions with owner and date', () => {
    const review: GateReview = { ...newReview(g('G3')), evidence: newReview(g('G3')).evidence.map((e) => ({ ...e, status: 'provided' })), conditions: [{ text: 'close DFMEA action', owner: '', due: '2026-10-01' }] };
    const prev: GateReview = { ...newReview(g('G2')), decision: 'GO' };
    expect(canDecide({ gates: [prev] }, review, g('G3'), 'GO WITH CONDITIONS').allowed).toBe(false);
    review.conditions = [{ text: 'close DFMEA action', owner: 'Mech lead', due: '2026-10-01' }];
    expect(canDecide({ gates: [prev] }, review, g('G3'), 'GO WITH CONDITIONS').allowed).toBe(true);
  });

  it('NO-GO can always be recorded', () => {
    expect(canDecide({ gates: [] }, newReview(g('G5')), g('G5'), 'NO-GO').allowed).toBe(true);
  });

  it('gate health and next gate', () => {
    const p = { gates: [{ ...newReview(g('G0')), decision: 'GO' as const }] };
    expect(gateHealth(p, 'G0')).toBe('passed');
    expect(gateHealth(p, 'G1')).toBe('not_started');
    expect(nextGate(p, defs)?.code).toBe('G1');
  });
});

describe('critical path', () => {
  const t = (id: string, start: string, end: string, deps: string[] = []): ProjectTask => ({ id, name: id, start, end, depends_on: deps, status: 'Not Started' });
  it('finds the longest dependency chain', () => {
    const r = criticalPath([t('a', '2026-01-01', '2026-01-11'), t('b', '2026-01-11', '2026-01-16', ['a']), t('c', '2026-01-11', '2026-01-31', ['a']), t('d', '2026-01-31', '2026-02-05', ['b', 'c'])]);
    expect(r.length).toBe(35);
    expect(r.path).toEqual(['a', 'c', 'd']);
    expect(r.tasks.get('b')!.slack).toBe(15);
    expect(r.cycle).toBe(false);
  });
  it('reports dependency cycles', () => {
    expect(criticalPath([t('a', '2026-01-01', '2026-01-02', ['b']), t('b', '2026-01-01', '2026-01-02', ['a'])]).cycle).toBe(true);
  });
});
