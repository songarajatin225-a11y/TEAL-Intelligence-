import { describe, expect, it } from 'vitest';
import { validateRecord } from '../../src/repositories';
import { buildDraftPackage } from '../../src/services/inquiry';
import { extractRefs } from '../../src/services/refs';
import { freshRepo, inquiryContext, masterRecords } from '../helpers/repo';

const SCENARIO_1 = 'Need inline laser marking of semiconductor packages, 2D code, high throughput, automatic handling, vision inspection and MES communication. Customer supplies laser.';

describe('flagship: create product from customer inquiry (final demo scenario 1)', async () => {
  const master = await masterRecords();
  const ctx = await inquiryContext(master);
  const pkg = buildDraftPackage(SCENARIO_1, ctx);

  it('selects the semiconductor package marking platform', () => {
    expect(pkg.matches[0].product.id).toBe('prd-semispm');
    expect(pkg.facts.customerSuppliesLaser).toBe(true);
    expect(pkg.requirements.some((r) => /supplied by customer/i.test(r.name))).toBe(true);
  });

  it('drafts the whole thread: opportunity, requirements, configuration, BOM, cost, POC, DOE, risks, project', () => {
    expect(pkg.opportunity.inquiry_text).toBe(SCENARIO_1);
    expect(pkg.requirements.length).toBeGreaterThanOrEqual(4);
    expect(pkg.configuration?.product_id).toBe('prd-semispm');
    expect(pkg.bom?.lines.length).toBeGreaterThan(2);
    expect(pkg.costModel?.bom_id).toBe(pkg.bom?.id);
    expect(pkg.poc).not.toBeNull();
    expect(pkg.doe).not.toBeNull();
    expect(pkg.risks.length).toBeGreaterThan(0);
    expect(pkg.project?.opportunity_id).toBe(pkg.opportunity.id);
    expect(pkg.g0Checklist.length).toBeGreaterThan(0);
    expect(pkg.openQuestions.length).toBeGreaterThan(0);
  });

  it('every drafted record validates against its schema and every reference resolves', () => {
    for (const r of pkg.records) expect(() => validateRecord(r as Record<string, unknown>)).not.toThrow();
    const ids = new Set([...master.map((r) => r.id), ...pkg.records.map((r) => r.id)]);
    const broken = pkg.records.flatMap((r) => extractRefs(r as Record<string, unknown>).filter((e) => !ids.has(e.to)).map((e) => `${r.id}.${e.field} → ${e.to}`));
    expect(broken).toEqual([]);
  });

  it('never fabricates: drafts are DRAFT/INFERRED, the customer-supplied laser costs 0, unknown costs stay UNKNOWN, no results', () => {
    expect(pkg.records.every((r) => r.provenance.verification_status === 'DRAFT')).toBe(true);
    expect(pkg.records.every((r) => r.data_type !== 'PUBLIC' && r.data_type !== 'EXTERNAL')).toBe(true);
    const laser = pkg.bom!.lines.find((l) => /laser source/i.test(l.description))!;
    expect(laser.description).toMatch(/CUSTOMER SUPPLIED/);
    expect(laser.unit_cost).toBe(0);
    expect(pkg.bom!.lines.filter((l) => l.unit_cost == null).every((l) => l.cost_basis === 'UNKNOWN')).toBe(true);
    expect(pkg.bom!.lines.every((l) => l.cost_basis !== 'QUOTED')).toBe(true);
    expect(pkg.doe!.runs.every((run) => Object.values(run.results ?? {}).every((v) => v == null))).toBe(true);
    expect(pkg.opportunity.value).toBeNull();
  });

  it('saves the package atomically as local drafts and the merged view shows LOCAL_NEW records', async () => {
    const repo = freshRepo();
    await repo.workspace.saveMany(pkg.records as unknown as Record<string, unknown>[], 'Created from customer inquiry');
    const opp = await repo.get(pkg.opportunity.id);
    expect(opp?.__origin).toBe('LOCAL_NEW');
    const all = await repo.all();
    expect(all.length).toBe(master.length + pkg.records.length);
    // master is untouched — the draft principle
    expect((await masterRecords()).some((r) => r.id === pkg.opportunity.id)).toBe(false);
  });

  it('rejects the whole package if one record is invalid (all-or-nothing)', async () => {
    const repo = freshRepo();
    const broken = pkg.records.map((r, i) => (i === 1 ? { ...r, name: '' } : r));
    await expect(repo.workspace.saveMany(broken as unknown as Record<string, unknown>[], 'x')).rejects.toThrow();
    expect(await repo.workspace.drafts()).toEqual([]);
  });
});
