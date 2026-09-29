import { describe, expect, it } from 'vitest';
import type { AnyRecord } from '../../src/domain';
import * as C from '../../src/calculations/cost';
import * as L from '../../src/calculations/laser';
import { progressFromTasks, projectProgress, scheduleVariance } from '../../src/calculations/project';
import { validateRecord } from '../../src/repositories';
import { crossDomainMatrix } from '../../src/services/crossDomain';
import { TEMPLATES } from '../../src/services/documents';
import { buildGraph } from '../../src/services/graph';
import { LIFECYCLE_STAGES, lifecycleFor } from '../../src/services/lifecycle';
import { maturityLane } from '../../src/services/maturity';
import { parametricSearch, parseParams } from '../../src/services/parametric';
import { buildCaptureRecords } from '../../src/services/requirementCapture';
import { solve, solutionOptions } from '../../src/services/solution';
import { trustLabel } from '../../src/services/trust';
import { inquiryContext, masterRecords } from '../helpers/repo';

/** Final master prompt: domains, engines, documents and trust — against the real committed data. */
describe('TEAL Intelligence OS engines on master data', async () => {
  const records = await masterRecords();
  const ctx = await inquiryContext(records);
  const g = buildGraph(records);

  it('trust labels: six words, derived only from data type, verification and origin', () => {
    const r = (data_type: string, v: string, o?: string) => trustLabel({ data_type, provenance: { verification_status: v }, __origin: o } as never);
    expect(r('DEMO', 'VERIFIED')).toBe('DEMO DATA');
    expect(r('TEAL_INTERNAL', 'VERIFIED')).toBe('VERIFIED');
    expect(r('TEAL_INTERNAL', 'SOURCE_DOCUMENTED')).toBe('REFERENCE');
    expect(r('CALCULATED', 'CALCULATED')).toBe('ESTIMATED');
    expect(r('USER_CREATED', 'DRAFT')).toBe('USER ADDED');
    expect(r('TEAL_INTERNAL', 'STALE')).toBe('TO BE VALIDATED');
    expect(new Set(records.map((x) => trustLabel(x))).size).toBeGreaterThan(2);
  });

  it('technology maturity follows only from TRL (transparent rule)', () => {
    expect(maturityLane({ trl: null })).toBe('Not assessed');
    expect(maturityLane({ trl: 2 })).toBe('Emerging');
    expect(maturityLane({ trl: 5 })).toBe('Experimental');
    expect(maturityLane({ trl: 7 })).toBe('Developing');
    expect(maturityLane({ trl: 9, supplier_ids: ['a', 'b'] })).toBe('Mature');
    expect(maturityLane({ trl: 9, supplier_ids: ['a', 'b', 'c'] })).toBe('Commodity');
    // nothing seeded is assessed — no TRL is invented
    expect(records.filter((r) => r.entity === 'technology' && (r as { trl?: number | null }).trl != null)).toEqual([]);
  });

  it('six domains are data, and every domain the data references exists', () => {
    const domains = records.filter((r) => r.entity === 'domain');
    expect(domains.map((d) => d.name)).toEqual(expect.arrayContaining(['Laser & Photonics', 'Electronics & EMS', 'Semiconductor', 'Battery & New Energy', 'Industrial Automation', 'Advanced Manufacturing']));
    expect(records.filter((r) => r.entity === 'article' || r.entity === 'roadmap_item')).toEqual([]);
    // equipment exists only as AI-drafted CATEGORIES: no supplier, price, throughput or accuracy is invented
    const eq = records.filter((r) => r.entity === 'equipment') as (AnyRecord & Record<string, unknown>)[];
    const domainIds = new Set(domains.map((d) => d.id));
    for (const e of eq) {
      expect(e.data_type, e.id).toBe('AI_GENERATED');
      expect(e.provenance.verification_status, e.id).toBe('DRAFT');
      expect(domainIds.has(String(e.domain_id)), e.id).toBe(true);
      for (const k of ['supplier_id', 'throughput', 'accuracy', 'wafer_size']) expect(e[k], `${e.id}.${k}`).toBeUndefined();
      expect(e.capex ?? null, e.id).toBeNull();
    }
  });

  it('parametric search reads the example query and answers honestly (no UV platform at 20–50 W)', () => {
    const q = 'Find 20–50W UV lasers suitable for semiconductor marking.';
    const p = parseParams(q);
    expect(p).toMatchObject({ powerMin: 20, powerMax: 50, process: 'Marking', industry: { id: 'ind-semi' } });
    expect(p.band?.label).toMatch(/UV/);
    const r = parametricSearch(q, records);
    expect(r.sources.map((s) => s.id)).toEqual(['las-uv']);
    expect(r.offers).toEqual([]);
    expect(r.nearOffers.length).toBeGreaterThan(0);
    for (const o of r.nearOffers) {
      expect(o.source.id).toBe('las-uv');
      expect(o.product.industries).toContain('ind-semi');
    }
    const b = parametricSearch('fiber laser welding battery 1-3 kW', records);
    expect(b.offers.some((o) => o.product.id === 'prd-weldb' && o.powers.every((w) => w >= 1000 && w <= 3000))).toBe(true);
  });

  it('cross-domain map: UV serves several domains, backed by TEAL application records', () => {
    const { rows } = crossDomainMatrix(records);
    const uv = rows.find((r) => r.technology.id === 'tec-uv')!;
    expect(uv.cells.size).toBeGreaterThanOrEqual(3);
    expect(uv.cells.get('dom-semiconductor')!.applications.length).toBeGreaterThan(0);
  });

  it('application engine: semiconductor · mould compound · marking → Semi SPM with architecture, BOM, risks, complexity', () => {
    const input = { domainId: 'dom-semiconductor', industryId: 'ind-semi', materialId: 'mat-emc', process: 'Marking', automation: 'Inline' as const };
    const opts = solutionOptions(input, records);
    expect(opts.applications.map((a) => a.id)).toContain('app-semispm.mould');
    const r = solve({ ...input, applicationId: 'app-semispm.mould' }, records, ctx.engine)!;
    expect(r.product?.id).toBe('prd-semispm');
    expect(r.recommended?.basis).toMatch(/application record/);
    expect(r.subsystems.map((s) => s.lane)).toEqual(expect.arrayContaining(['Process', 'Controls', 'Safety']));
    expect(r.bom.length).toBeGreaterThan(1);
    expect(r.requirements.find((q) => q.label === 'Throughput')?.value).toMatch(/UNKNOWN/);
    expect(r.complexity.level).toBe('Medium');
    expect(r.addedModules.length).toBeGreaterThan(0);
    // no application for the combination → no machine is invented
    expect(solve({ industryId: 'ind-semi', materialId: 'mat-si', process: 'Cutting' }, records, ctx.engine)).toBeNull();
  });

  it('documents render every template from records, UNKNOWN where nothing is recorded', () => {
    const pick = (e: string) => records.filter((r) => r.entity === e).slice(0, e === 'supplier' ? 3 : 1);
    for (const t of TEMPLATES) {
      const subjects = t.entities.map(pick).find((x) => x.length) ?? [];
      if (!subjects.length) continue;
      const md = t.render(subjects, { records, byId: new Map(records.map((r) => [r.id, r])), graph: g, engine: ctx.engine, today: '2026-09-26' });
      expect(md, t.id).toMatch(/^# /);
      // a value slot rendering undefined / NaN / an object would be a template bug (prose may say “undefined”)
      expect(md, t.id).not.toMatch(/(\|\s*undefined\s*\|)|(:\s*undefined\s*$)|\bNaN\b|\[object Object\]/m);
    }
    const poc = records.find((r) => r.entity === 'poc')!;
    expect(TEMPLATES.find((t) => t.id === 'poc')!.render([poc], { records, byId: new Map(records.map((r) => [r.id, r])), graph: g, engine: ctx.engine, today: '2026-09-26' })).toMatch(/Nothing is pre-filled/);
  });

  it('requirement capture: one URS per filled field, schema-valid, no invented acceptance criteria', () => {
    let i = 0;
    const recs = buildCaptureRecords({ newCustomer: 'Fictional Test Co', values: { throughput: '1200', accuracy: '25', process: 'marking', timeline: '' } }, { customer: 'cus-Ltest', opportunity: 'opp-Ltest', requirement: () => `req-Ltest${i++}` }, '2026-09-26');
    expect(recs.map((r) => r.entity)).toEqual(['customer', 'opportunity', 'requirement', 'requirement', 'requirement']);
    for (const r of recs) expect(() => validateRecord(r)).not.toThrow();
    expect(recs.filter((r) => r.entity === 'requirement').every((r) => r.acceptance_criterion === undefined && r.verification_method === undefined)).toBe(true);
    expect(() => buildCaptureRecords({ newCustomer: 'X', values: {} }, { customer: 'c', opportunity: 'o', requirement: () => 'r' }, '2026-09-26')).toThrow(/at least one/);
  });

  it('lifecycle: 17 stages, each explained; the demo project is placed by its evidence', () => {
    const lc = lifecycleFor(g, 'prj-demo-c2i');
    expect(lc.stages.map((s) => s.stage)).toEqual([...LIFECYCLE_STAGES]);
    expect(lc.stages.every((s) => s.rule.length > 10)).toBe(true);
    expect(lc.stages.find((s) => s.stage === 'Opportunity')!.done).toBe(true);
    expect(lc.stages.find((s) => s.stage === 'Commercialization')!.done).toBe(false);
    expect(lc.current).not.toBeNull();
  });

  it('new calculators: formula-backed, insufficient data never guessed', () => {
    expect(L.averagePower({ pulse_energy_mj: 0.5, rep_khz: 100 }).value).toBeCloseTo(50, 6);
    expect(L.lineSpeedForOverlap({ rep_khz: 100, spot_um: 30, overlap_pct: 50 }).value).toBeCloseTo(1500, 6);
    expect(L.pulseOverlap({ speed_mm_s: 1500, rep_khz: 100, spot_um: 30 }).value).toBeCloseTo(50, 6);
    expect(C.grossMargin({ price: 100, cost: 70 }).value).toBeCloseTo(30, 6);
    expect(C.localContent({ local_cost: 25, imported_cost: 75 }).value).toBeCloseTo(25, 6);
    expect(projectProgress({ completed_days: 45, total_days: 180 }).value).toBeCloseTo(25, 6);
    expect(scheduleVariance({ planned_finish_day: 179, forecast_finish_day: 193 }).value).toBe(-14);
    expect(C.grossMargin({ price: null, cost: 70 }).status).toBe('INSUFFICIENT_DATA');
    const t = progressFromTasks([{ start: '2026-01-01', end: '2026-01-11', status: 'Completed' }, { start: '2026-01-11', end: '2026-01-31', status: 'In Progress' }]);
    expect(t).toEqual({ completed: 10, total: 30 });
  });
});

