import { describe, expect, it } from 'vitest';
import * as C from '../../src/calculations/cost';
import { dataset, fixture } from '../helpers/data';

interface Golden {
  fx: { code: string; rate: number }[];
  cost: { template_id: string; qty: number; compute: Record<string, number>; buckets: Record<string, number>; teal: Record<string, number> }[];
}
const golden = fixture<Golden>('legacy-golden.json');
const fx = C.fxTable(golden.fx.map((c) => ({ code: c.code, rate_to_inr: c.rate, as_of: null, source: 'legacy seed' })));
const templates = dataset<{ id: string; lines: C.CostInputs['lines']; landed: C.CostInputs['landed']; markup: C.CostInputs['markup'] }>('cost/cost-templates.json');

describe('cost engine reproduces the legacy TEAL Cost Platform exactly', () => {
  for (const g of golden.cost) {
    const t = templates.find((x) => x.id === `cst-tpl-${g.template_id.toLowerCase()}`)!;
    it(`computeProject() — template ${g.template_id}`, () => {
      expect(t).toBeDefined();
      const r = C.computeCost({ qty: g.qty, lines: t.lines, landed: t.landed, markup: t.markup }, fx);
      for (const [k, v] of Object.entries(g.compute)) expect(r[k as keyof C.CostResult] as number).toBeCloseTo(v, 4);
      for (const [k, v] of Object.entries(g.buckets)) expect(r.buckets[k as C.CostModuleKey]).toBeCloseTo(v, 4);
    });
    it(`tealSheet() A/B/C/D — template ${g.template_id}`, () => {
      const r = C.computeCost({ qty: g.qty, lines: t.lines, landed: t.landed, markup: t.markup }, fx);
      const s = C.tealSheet(r);
      for (const [k, v] of Object.entries(g.teal)) expect(s[k as keyof C.TealSheet] as number).toBeCloseTo(v, 4);
    });
  }
});

describe('cost formulas', () => {
  it('C1 price from margin — Handbook §59.6: ₹62.1 L at 30 % → ₹88.7 L; with 3 % warranty ≈ ₹92.7 L', () => {
    expect(C.priceFromMargin({ cost: 62.1, gross_margin: 0.3 }).value).toBeCloseTo(88.71, 2);
    expect(C.priceFromMargin({ cost: 62.1, gross_margin: 0.3, warranty: 0.03 }).value).toBeCloseTo(92.69, 2);
  });
  it('TEAL D = C/(1−p−w): 12 % profit + 2.5 % warranty → divisor 0.855', () => {
    const r = C.computeCost({ qty: 1, lines: { material: [{ item: 'x', cls: 'Standard Component', qty: 1, price: 855, cur: 'INR' }] }, landed: { freightPct: 0, dutyPct: 0, landingPct: 0, gstPct: 18, siteContPct: 0 }, markup: { overheadPct: 0, contingencyPct: 0, profitPct: 0 } }, fx);
    const s = C.tealSheet(r, { insurancePct: 0, sgaPct: 0, ossMonthly: 0 });
    expect(s.divisor).toBeCloseTo(0.855, 6);
    expect(s.D).toBeCloseTo(1000, 6);
  });
  it('crate area 2(LW+LH+WH): 2400×1500×2100 mm → 24.3 m²', () => {
    expect(C.crateSqm({ len: 2400, wid: 1500, hgt: 2100, boxes: 1 })).toBeCloseTo(2 * (2.4 * 1.5 + 2.4 * 2.1 + 1.5 * 2.1), 6);
  });
  it('AMC escalation compounds per year', () => {
    expect(C.lineAmount('amc', { visits: 4, rate: 10000, esc: 10, yrs: 3 }, fx)).toBeCloseTo(40000 + 44000 + 48400, 6);
  });
  it('landed cost preserves original currency, FX and date; warns on undated FX', () => {
    const r = C.landedCost({ base_cost: 10000, currency: 'USD', fx: { code: 'USD', rate_to_inr: 87.4, as_of: null, source: 'seed' }, freight_pct: 2, duty_pct: 7.5, insurance_pct: 0.5 });
    expect(r.value).toBeCloseTo(10000 * 87.4 * 1.1, 4);
    expect(r.original).toEqual({ value: 10000, currency: 'USD' });
    expect(r.fx_used?.rate_to_inr).toBe(87.4);
    expect(r.warnings.join(' ')).toMatch(/no date/);
  });
  it('landed cost refuses a missing FX rate', () => {
    expect(C.landedCost({ base_cost: 100, currency: 'EUR', fx: null }).status).toBe('INSUFFICIENT_DATA');
  });
  it('missing FX on a material line is excluded with a warning, not silently converted', () => {
    const r = C.computeCost({ qty: 1, lines: { material: [{ item: 'CHF item', qty: 1, price: 100, cur: 'CHF' }] }, landed: { freightPct: 0, dutyPct: 0, landingPct: 0, gstPct: 0, siteContPct: 0 }, markup: { overheadPct: 0, contingencyPct: 0, profitPct: 0 } }, fx);
    expect(r.basic).toBe(0);
    expect(r.warnings[0]).toMatch(/no FX rate/);
  });
  it('C6 payback, ROI, LCC and cost per part', () => {
    expect(C.payback({ capex: 9270000, annual_saving: 5460000 }).value).toBeCloseTo(1.698, 3);
    expect(C.payback({ capex: 1, annual_saving: 1, annual_operating_cost: 2 }).status).toBe('INSUFFICIENT_DATA');
    expect(C.roi({ capex: 100, annual_saving: 60, life_years: 5 }).value).toBeCloseTo(2, 6);
    const lcc = C.lifecycleCost({ capex: 100, annual_operating_cost: 10, life_years: 5, amc_total: 20 });
    expect(lcc.value).toBe(170);
    expect(C.costPerPart({ lifecycle_cost: 170, annual_parts: 1000, life_years: 5 }).value).toBeCloseTo(0.034, 6);
  });
  it('C9 localization payback and C8 platform break-even', () => {
    expect(C.localizationPayback({ qualification_cost: 110000, import_cost: 20000, local_cost: 10000, annual_volume: 100 }).value).toBeCloseTo(0.11, 6);
    expect(C.platformBreakEven({ investment: 90, saving_per_machine: 10 }).value).toBe(9);
  });
  it('price-to-win back-solves mark-up and margin', () => {
    const r = C.computeCost({ qty: 1, lines: { material: [{ qty: 1, price: 1000, cur: 'INR' }] }, landed: { freightPct: 0, dutyPct: 0, landingPct: 0, gstPct: 0, siteContPct: 0 }, markup: { overheadPct: 0, contingencyPct: 0, profitPct: 20 } }, fx);
    const p = C.priceToWin(1100, r);
    expect(p.markupPct).toBeCloseTo(10, 6);
    expect(p.gap).toBeCloseTo(-100, 6);
  });
  it('approval floor by order value band', () => {
    const bands = [
      { band: 'a', approver: 'PM', minMargin: 18 },
      { band: 'b', approver: 'Fin', minMargin: 22 },
      { band: 'c', approver: 'VH', minMargin: 25 },
      { band: 'd', approver: 'BH', minMargin: 28 },
    ];
    expect(C.approvalFloor(2_000_000, bands).approver).toBe('PM');
    expect(C.approvalFloor(60_000_000, bands).approver).toBe('BH');
  });
  it('scenarios change cost in the expected direction', () => {
    const t = templates[0];
    const base = C.computeCost({ qty: 1, lines: t.lines, landed: t.landed, markup: t.markup }, fx);
    const cons = C.computeCost(C.applyScenario({ qty: 1, lines: t.lines, landed: t.landed, markup: t.markup }, C.SCENARIO_PRESETS.find((s) => s.key === 'conservative')!), fx);
    const opt = C.computeCost(C.applyScenario({ qty: 1, lines: t.lines, landed: t.landed, markup: t.markup }, C.SCENARIO_PRESETS.find((s) => s.key === 'optimistic')!), fx);
    expect(cons.totalCost).toBeGreaterThan(base.totalCost);
    expect(opt.totalCost).toBeLessThan(base.totalCost);
  });
});
