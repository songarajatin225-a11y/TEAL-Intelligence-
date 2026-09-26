import { describe, expect, it } from 'vitest';
import { spotDiameter } from '../../src/calculations/laser';
import type { AnyRecord } from '../../src/domain';
import { whatIsMissing } from '../../src/services/gaps';
import { buildGraph, linked, neighbours } from '../../src/services/graph';
import { isActive, nextActionFor, nextActions } from '../../src/services/nextAction';
import { parseQuery } from '../../src/services/search';
import { classifyReuse, findSimilar } from '../../src/services/similarity';
import { whyForCalc, whyForRecord } from '../../src/services/why';
import { masterRecords } from '../helpers/repo';

describe('digital-thread services on master data', async () => {
  const all = await masterRecords();
  const g = buildGraph(all);
  const byId = (id: string) => all.find((r) => r.id === id)!;

  it('next action: a recorded action wins; otherwise a stage rule suggests one; overdue is computed', () => {
    const opp = byId('opp-demo-pkg-marking');
    const rec = nextActionFor({ ...opp, next_action: { action: 'Call', due: '2026-01-01' } }, '2026-01-05');
    expect(rec).toMatchObject({ source: 'RECORD', overdue: true, dueInDays: -4 });
    const sug = nextActionFor({ ...opp, next_action: undefined, stage: 'Proposal' } as AnyRecord, '2026-01-05');
    expect(sug.source).toBe('SUGGESTED');
    expect(sug.action).toMatch(/cost model/i);
    expect(isActive({ ...opp, stage: 'Won' } as AnyRecord)).toBe(false);
    expect(nextActions(all).every((v) => isActive(v.record))).toBe(true);
  });

  it('what is missing: an opportunity lists present and missing thread items with actions', () => {
    const gaps = whatIsMissing(g, 'opp-demo-pkg-marking');
    const cats = new Set(gaps.map((x) => x.category));
    expect(cats.has('Requirements')).toBe(true);
    expect(gaps.find((x) => x.item === 'Requirements (URS)')?.status).toBe('present');
    // demo requirements are not customer-signed → flagged, never assumed
    expect(gaps.find((x) => x.item === 'Customer-signed URS values')?.status).toBe('missing');
    expect(gaps.filter((x) => x.status !== 'present').every((x) => !!x.action)).toBe(true);
  });

  it('what can we reuse: similar platforms are found with reasons and classified', () => {
    const target = byId('prd-markf');
    const hits = findSimilar(target, all, { entities: ['product'], limit: 5 });
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.record.id !== target.id && h.reasons.length > 0)).toBe(true);
    const cls = classifyReuse(target, hits);
    expect(cls.every((h) => ['Reusable', 'Similar', 'Potentially reusable', 'Requires validation', 'Not compatible'].includes(h.class))).toBe(true);
  });

  it('WHY? explains a record (provenance, source, evidence) and a calculation (formula, inputs, citation)', () => {
    const gate = byId('gate-g3');
    const why = whyForRecord(gate, g);
    expect(why[0].kind).toBe('Provenance');
    expect(why.some((w) => w.kind === 'Source' && w.ref === gate.provenance.source_id)).toBe(true);
    const c = spotDiameter({ wavelength_nm: 1064, focal_mm: 254, m2: 1.3, beam_mm: 7 });
    expect(c.status).toBe('CALCULATED');
    const wc = whyForCalc(c);
    expect(wc[0].kind).toBe('Calculation');
    expect(wc[0].detail).toContain(c.formula);
    expect(wc[1].title).toMatch(/Automation Equipment Building Handbook, Part 54/);
  });

  it('graph: neighbours and typed links connect the thread both ways', () => {
    const prj = byId('prj-demo-c2i');
    const n = neighbours(g, prj.id);
    expect(n.length).toBeGreaterThan(0);
    const opp = (prj as { opportunity_id?: string }).opportunity_id!;
    expect(linked(g, opp, 'project').map((r) => r.id)).toContain(prj.id);
  });

  it('search query syntax: field filters and quoted phrases', () => {
    expect(parseQuery('entity:product "fiber laser" marking book:laser')).toEqual({ free: 'marking', fields: { entity: 'product', book: 'laser' }, phrases: ['fiber laser'] });
  });
});
