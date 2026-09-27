import { describe, expect, it } from 'vitest';
import { convert, normalize } from '../../src/calculations/units';
import type { AnyRecord } from '../../src/domain';
import type { Part } from '../../src/domain/engineering';
import type { Requirement } from '../../src/domain/entities';
import { checkPair, compatCtx, compatibleWith, protocolRequirement } from '../../src/services/eng/compatibility';
import { detectConflicts, diffRecords, diffSpecs, normModel, partDuplicates, reviewQueues } from '../../src/services/eng/dataReview';
import { parsePartQuery, searchParts } from '../../src/services/eng/partSearch';
import { requirementIssues, traceChain } from '../../src/services/eng/requirementQuality';
import { completeness, freshness, partConfidence, readSpec, sourcePriority, specDefs, validateSpecs } from '../../src/services/eng/specs';
import { masterRecords } from '../helpers/repo';

type P = Part & AnyRecord;

describe('global engineering database engines on committed data', async () => {
  const records = await masterRecords();
  const byId = new Map(records.map((r) => [r.id, r]));
  const defs = specDefs(records);
  const parts = records.filter((r) => r.entity === 'part') as P[];
  const part = (id: string) => byId.get(id) as P;
  const ctx = compatCtx(records, defs);

  it('unit normalisation keeps the original (§13)', () => {
    expect(normalize(50, 'W', 'kW')).toEqual({ original: { value: 50, unit: 'W' }, normalized: { value: 0.05, unit: 'kW' } });
    expect(normalize(1064, 'nm', 'µm').normalized!.value).toBeCloseTo(1.064, 9);
    expect(normalize(100, 'mm', 'm').normalized!.value).toBeCloseTo(0.1, 9);
    expect(normalize(5, 'W', 'nm').normalized).toBeNull();
    expect(convert(3000, 'rpm', 'Hz')).toBe(50);
    expect(convert(1, '°', 'mrad')).toBeCloseTo(17.453, 2);
  });

  it('specifications are rows with per-field evidence, normalised on read (§12, §46)', () => {
    expect(defs.size).toBeGreaterThan(150);
    const co2 = readSpec(part('prt-demo-co2-30'), 'wavelength', defs, byId)!;
    expect(co2.original).toBe('10.6 µm');
    expect(co2.value).toBeCloseTo(10600, 6);
    expect(co2.unit).toBe('nm');
    const p = readSpec(part('prt-demo-mopa-50'), 'average_power', defs, byId)!;
    expect(p.all).toHaveLength(2);
    expect(p.conflict).toBe(true);
    expect(p.value).toBe(50); // the manufacturer datasheet outranks the distributor (§109)
    expect(p.entry.source_id).toBe('src-demo-datasheets');
    expect(sourcePriority(byId.get('src-demo-datasheets'))).toBeLessThan(sourcePriority(byId.get('src-demo-distributor')));
    for (const x of parts) expect(validateSpecs(x, defs).filter((i) => i.severity === 'error'), x.id).toEqual([]);
    expect(validateSpecs({ product_type: 'laser_source', specs: [{ spec: 'average_power', value: 5, unit: 'furlong' }] } as never, defs).some((i) => /unknown unit/.test(i.message))).toBe(true);
  });

  it('confidence is derived and DEMO is Unverified (§50); freshness flags stale sources (§110)', () => {
    const c = partConfidence(part('prt-demo-mopa-50'), defs, byId, '2026-09-27');
    expect(c.level).toBe('Unverified');
    expect(c.factors.find((f) => f.factor === 'consistency')!.ok).toBe(false);
    expect(freshness({ last_verified: '2025-01-15' }, '2026-09-27')).toBe('stale');
    expect(freshness({ last_verified: '2026-09-01' }, '2026-09-27')).toBe('fresh');
    expect(completeness(part('prt-demo-mopa-20')).pct).toBe(100);
  });

  it('natural-language technical search → structured filters (§119)', () => {
    const q1 = parsePartQuery('1064 nm 50 W MOPA', defs);
    expect(q1.constraints.map((c) => c.spec)).toEqual(['wavelength', 'average_power']);
    expect(q1.technologies).toEqual(['MOPA']);
    expect(searchParts('1064 nm 50 W MOPA', parts, defs).candidates.map((c) => c.part.id)).toEqual(expect.arrayContaining(['prt-demo-mopa-50']));
    expect(searchParts('1064 nm 50 W MOPA', parts, defs).candidates.some((c) => c.part.id === 'prt-demo-mopa-20')).toBe(false);
    const galvo = searchParts('Galvo above 30 mm aperture', parts, defs);
    expect(galvo.parsed.constraints[0]).toMatchObject({ spec: 'aperture', op: 'gte', value: 30 });
    expect(galvo.candidates.map((c) => c.part.id)).toEqual(['prt-demo-galvo-30']);
    const ft = searchParts('F-theta for 100 mm field', parts, defs);
    expect(ft.parsed.constraints[0]).toMatchObject({ spec: 'scan_field_x', op: 'gte' });
    expect(ft.candidates.map((c) => c.part.id)).not.toContain('prt-demo-ft-100');
    expect(ft.candidates.length).toBeGreaterThanOrEqual(3);
    const cam = searchParts('12 MP global shutter camera', parts, defs);
    expect(cam.candidates.map((c) => c.part.id)).toEqual(['prt-demo-cam-12mp']);
    expect(searchParts('Linear stage above 500 mm/s', parts, defs).candidates.map((c) => c.part.id)).toEqual(['prt-demo-stage-500']);
    const al = searchParts('Find a 1064 nm laser above 30 W suitable for aluminum marking.', parts, defs);
    expect(al.parsed.process).toBe('Marking');
    expect(al.candidates.every((c) => readSpec(c.part, 'average_power', defs)!.value! >= 30)).toBe(true);
    expect(al.candidates[0].applicationEvidence.join(' ')).toMatch(/No material-specific evidence/);
    expect(parsePartQuery('0.5 mJ pulse energy laser', defs).constraints[0].spec).toBe('pulse_energy');
  });

  it('compatibility: rule results are engineering inferences; records need a source (§42–§44)', () => {
    const uvOnIr = checkPair(part('prt-demo-uv-5'), part('prt-demo-ft-160'), ctx);
    expect(uvOnIr.relationship).toBe('Incompatible');
    expect(uvOnIr.checks.find((c) => c.rule.id === 'cpr-laser-ftheta-wavelength')!.detail).toMatch(/355 nm outside/);
    const ok = checkPair(part('prt-demo-mopa-20'), part('prt-demo-ft-160'), ctx);
    expect(ok.relationship).toBe('EngineeringCompatible');
    expect(ok.basis).toBe('Engineering rules');
    const rec = checkPair(part('prt-demo-mopa-50'), part('prt-demo-galvo-14'), ctx);
    expect(rec.relationship).toBe('ManufacturerRecommended');
    expect(rec.basis).toBe('Recorded relationship');
    // a recorded relationship can never hide a rule violation
    expect(checkPair(part('prt-demo-cw-1500'), part('prt-demo-chiller-1k'), ctx).relationship).toBe('Incompatible');
    expect(checkPair(part('prt-demo-cam-12mp'), part('prt-demo-lens-16'), ctx).relationship).toBe('Incompatible');
    expect(checkPair(part('prt-demo-drive-200'), part('prt-demo-servo-400'), ctx).relationship).toBe('Incompatible');
    const unknown = checkPair(part('prt-demo-mopa-50-dist'), part('prt-demo-galvo-10'), ctx);
    expect(unknown.checks.some((c) => c.status === 'missing')).toBe(true);
    expect(compatibleWith(part('prt-demo-mopa-20'), parts, ctx).some((r) => r.b.product_type === 'galvo')).toBe(true);
    expect(protocolRequirement(['EtherCAT'], [part('prt-demo-plc-pn')])[0].ok).toBe(false);
    expect(protocolRequirement(['EtherCAT'], [part('prt-demo-plc-ecat')])[0].ok).toBe(true);
  });

  it('conflicts are detected, duplicates suggested, changes diffed (§47, §111–§113)', () => {
    const cf = detectConflicts(records, defs);
    expect(cf.find((c) => c.part.id === 'prt-demo-mopa-50' && c.parameter === 'average_power')?.record?.id).toBe('dcf-demo-mopa50-power');
    expect(normModel('DL MOPA 50')).toBe(normModel('DL-MOPA-50'));
    const dups = partDuplicates(parts);
    expect(dups.some((d) => [d.a.id, d.b.id].sort().join() === 'prt-demo-mopa-50,prt-demo-mopa-50-dist')).toBe(true);
    const q = reviewQueues(records, defs, '2026-09-27');
    expect(q.Conflicting.length).toBeGreaterThan(0);
    expect(q.Duplicate.length).toBeGreaterThan(0);
    expect(q.Stale.some((i) => i.record.id === 'prt-demo-mopa-50-dist')).toBe(true);
    expect(q.New.some((i) => i.record.id === 'prt-demo-mopa-50-dist')).toBe(true);
    const a = part('prt-demo-mopa-20');
    const b = { ...a, specs: a.specs.map((s) => (s.spec === 'average_power' ? { ...s, value: 25 } : s)) };
    expect(diffSpecs(a, b, defs)).toEqual([{ spec: 'Average power', before: '20 W', after: '25 W' }]);
    expect(diffRecords(a, { ...a, model_number: 'X' }).map((c) => c.field)).toEqual(['model_number']);
  });

  it('requirement quality and traceability (§86, §87)', () => {
    const reqs = records.filter((r) => r.entity === 'requirement') as (Requirement & AnyRecord)[];
    const r2 = reqs.find((r) => r.id === 'req-demo-s1-02')!;
    const issues = requirementIssues(r2, reqs);
    expect(issues.some((i) => i.rule === 'vague')).toBe(true);
    expect(issues.some((i) => i.rule === 'missing-owner')).toBe(true);
    expect(requirementIssues({ ...r2, acceptance_criterion: undefined }, reqs).some((i) => i.rule === 'missing-acceptance')).toBe(true);
    const good = { ...r2, name: 'Mark 2D code in 1.2 s per package', value: '1.2', unit: 's', acceptance_criterion: '≤ 1.2 s over 100 packages', verification_method: 'Test', owner: 'PM', source: 'Customer', validation_method: 'Customer trial' } as Requirement & AnyRecord;
    expect(requirementIssues(good, [])).toEqual([]);
    expect(requirementIssues({ ...good, unit: undefined }, []).some((i) => i.rule === 'missing-unit')).toBe(true);
    const ch = traceChain(reqs.find((r) => r.id === 'req-demo-s1-01')!, records);
    expect(ch.steps.find((s) => s.step === 'Design / equipment')!.ok).toBe(true); // linked from the DEMO simulation
    expect(ch.steps.find((s) => s.step === 'Verification')!.ok).toBe(false); // planned, NOT RUN
  });
});
