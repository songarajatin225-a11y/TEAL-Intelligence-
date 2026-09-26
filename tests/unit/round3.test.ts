import { describe, expect, it } from 'vitest';
import { businessCase, marketChecks, sensitivity } from '../../src/calculations/businessCase';
import type { AnyRecord } from '../../src/domain';
import { validateRecord } from '../../src/repositories/WorkspaceRepository';
import { buildLeadRecords, eventTag, leadGroups } from '../../src/services/leads';
import { presetFor } from '../../src/features/rooms/rooms';

describe('business case', () => {
  const base = { price: 100, unitCost: 60, unitsYear1: 100, growthPct: 0, investment: 6000, fixedAnnual: 1000, years: 3, discountPct: 0 };
  it('computes cash flow, payback and NPV from inputs only', () => {
    const r = businessCase(base);
    expect(r.rows.map((x) => x.cash)).toEqual([-6000, 3000, 3000, 3000]);
    expect(r.paybackYears).toBeCloseTo(2, 6);
    expect(r.npv).toBe(3000);
    expect(r.grossMarginPct).toBeCloseTo(40, 6);
    expect(r.roiPct).toBeCloseTo(50, 6);
  });
  it('discounts and reports no payback beyond the horizon', () => {
    const r = businessCase({ ...base, discountPct: 10, investment: 100000 });
    expect(r.paybackYears).toBeNull();
    expect(r.npv).toBeCloseTo(-100000 + 3000 / 1.1 + 3000 / 1.21 + 3000 / 1.331, 6);
  });
  it('sensitivity ranks the input with the largest NPV swing first', () => {
    const s = sensitivity(base, 10);
    expect(s[0].key).toBe('price');
    expect(s.find((x) => x.key === 'unitCost')!.high).toBeLessThan(s.find((x) => x.key === 'unitCost')!.low);
  });
  it('flags unsourced and inconsistent market figures', () => {
    const issues = marketChecks({ value: 100, source: 'Report X', year: '2025' }, { value: 200, source: '', year: '' }, { value: null, source: '', year: '' });
    expect(issues.join(' ')).toMatch(/SAM has no source/);
    expect(issues.join(' ')).toMatch(/SAM is larger than TAM/);
  });
});

describe('LeadConnect', () => {
  const ids = { customer: 'cus-Lx1', opportunity: 'opp-Lx1', activity: 'act-Lx1' };
  const input = { event: 'Expo 2026', newCompany: 'Acme Test Co', contactName: 'A. Person', productId: 'prd-markf', notes: 'Marks on steel', priority: 'High' as const, followUp: '2026-10-01' };
  it('creates a schema-valid customer, Lead opportunity and follow-up, all linked', () => {
    const recs = buildLeadRecords(input, ids, 'Acme Test Co', '2026-09-26');
    expect(recs.map((r) => r.entity)).toEqual(['customer', 'opportunity', 'activity']);
    for (const r of recs) expect(() => validateRecord(r)).not.toThrow();
    const [c, o, a] = recs;
    expect(o.customer_id).toBe(c.id);
    expect(o.stage).toBe('Lead');
    expect(o.value).toBeNull();
    expect(a.opportunity_id).toBe(o.id);
    expect(a.follow_up_date).toBe('2026-10-01');
    expect(o.tags).toContain(eventTag('Expo 2026'));
  });
  it('reuses an existing customer instead of creating a duplicate', () => {
    const recs = buildLeadRecords({ ...input, customerId: 'cus-existing', newCompany: '' }, ids, 'Existing', '2026-09-26');
    expect(recs.map((r) => r.entity)).toEqual(['opportunity', 'activity']);
    expect(recs[0].customer_id).toBe('cus-existing');
  });
  it('refuses a lead without an event or company', () => {
    expect(() => buildLeadRecords({ ...input, event: ' ' }, ids, 'x', '2026-09-26')).toThrow(/event/);
    expect(() => buildLeadRecords({ ...input, newCompany: '' }, ids, 'x', '2026-09-26')).toThrow(/company/);
  });
  it('groups leads by event with their follow-up', () => {
    const recs = buildLeadRecords(input, ids, 'Acme Test Co', '2026-09-26') as unknown as AnyRecord[];
    const g = leadGroups(recs);
    expect(g).toHaveLength(1);
    expect(g[0].event).toBe('Expo 2026');
    expect(g[0].leads[0].followUp?.id).toBe('act-Lx1');
  });
});

describe('rooms', () => {
  it('pre-links new records to the room subject', () => {
    const project = { id: 'prj-1', entity: 'project', name: 'P', customer_id: 'cus-1' } as unknown as AnyRecord;
    expect(presetFor(project, 'activity')).toMatchObject({ project_id: 'prj-1', customer_id: 'cus-1' });
    expect(presetFor(project, 'change_request')).toEqual({ affected_ids: ['prj-1'] });
    expect(presetFor(project, 'decision')).toMatchObject({ links: [{ rel: 'references', target: 'prj-1' }] });
  });
});
