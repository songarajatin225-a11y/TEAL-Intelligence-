import { describe, expect, it } from 'vitest';
import type { AnyRecord } from '../../src/domain';
import type { EquipmentTemplate, Part, Simulation } from '../../src/domain/engineering';
import { compatCtx } from '../../src/services/eng/compatibility';
import { specDefs } from '../../src/services/eng/specs';
import { applyWhatIf, calibration, energyModel, faultImpact, maintenanceModel, monteCarloChunk, optimize, scenarioMetrics, summarizeMc } from '../../src/services/sim/analysis';
import { buildBom, fxFromRecords } from '../../src/services/sim/bom';
import { defaultSequence, deriveScenario, scenarioFromTemplate, twinLayout, validateSequence, versionDiff } from '../../src/services/sim/build';
import { bottleneckEvidence, capacity, cycleTime } from '../../src/services/sim/capacity';
import { replayAt, runDes } from '../../src/services/sim/des';
import { cannotRun, laserTime, resolveScenario } from '../../src/services/sim/model';
import { planDraft, simulationReport } from '../../src/services/sim/report';
import { buildReadiness, designReview, engineeringCompleteness, pocReadiness } from '../../src/services/sim/review';
import { localizationLayers, supplierDependency, supplierDisruption } from '../../src/services/sim/supply';
import { masterRecords } from '../helpers/repo';

type S = Simulation & AnyRecord;

describe('Equipment Simulation Studio engines on the DEMO scenarios', async () => {
  const records = await masterRecords();
  const byId = new Map(records.map((r) => [r.id, r]));
  const defs = specDefs(records);
  const fx = fxFromRecords(records);
  const ctx = compatCtx(records, defs);
  const parts = records.filter((r) => r.entity === 'part') as (Part & AnyRecord)[];
  const sim = (id: string) => byId.get(id) as S;
  const A = resolveScenario(sim('sim-demo-pcb-a'), byId, defs);
  const cA = cycleTime(A)!;

  it('laser process time is calculated from area, hatch, speed, passes and overhead (§65, §141)', () => {
    const l = laserTime({ key: 'l', name: 'L', kind: 'laser', time_s: null, parallel: 1, buffer_after: 0, laser: { area_mm2: 300, hatch_mm: 0.03, speed_mm_s: 1500, passes: 1, jump_overhead_s: 0.8 } });
    expect(l.time).toBeCloseTo(300 / 45 + 0.8, 9);
    expect(l.lineage.formula).toMatch(/area ÷ \(hatch × speed\)/);
    expect(laserTime({ key: 'w', name: 'W', kind: 'laser', time_s: null, parallel: 1, buffer_after: 0, laser: { path_mm: 240, speed_mm_s: 100, passes: 2, jump_overhead_s: 1 } }).time).toBeCloseTo(5.8, 9);
    expect(laserTime({ key: 'x', name: 'X', kind: 'laser', time_s: null, parallel: 1, buffer_after: 0, laser: { hatch_mm: 0.03 } }).missing.length).toBeGreaterThan(0);
  });

  it('a scenario with missing inputs does not run and says why (§163)', () => {
    const semi = resolveScenario(sim('sim-demo-semi-marking'), byId, defs);
    expect(semi.runnable).toBe(false);
    expect(cannotRun(semi)).toMatch(/^Simulation cannot run because Strip clamp — time per part is missing/);
    expect(cycleTime(semi)).toBeNull();
  });

  it('cycle time, UPH, OEE and capacity (§65, §67)', () => {
    expect(cA.layout).toBe('inline');
    expect(cA.bottleneck.rs.station.key).toBe('laser');
    expect(cA.cycle).toBeCloseTo(300 / 45 + 0.8, 6);
    expect(cA.theoreticalUph).toBeCloseTo(3600 / cA.cycle, 6);
    expect(cA.practicalUph).toBeCloseTo(cA.theoreticalUph * cA.availability.value * cA.performance.value * cA.quality.value, 6);
    // distribution means are used, not modes (triangular 2 / 2.5 / 3.5 → 2.667)
    expect(cA.loads[0].mean).toBeCloseTo(8 / 3, 6);
    const cap = capacity(A.sim, cA);
    expect(cap.productiveHoursPerYear).toBeCloseTo(8 * 3 * 300 - 0.5 * 3 * 300, 6);
    expect(cap.capacityGapUph!).toBeLessThan(0); // Scenario A misses 500 UPH
    expect(cap.machinesRequired).toBe(2);
    const B = cycleTime(resolveScenario(sim('sim-demo-pcb-b'), byId, defs))!;
    expect(B.cycle).toBeCloseTo(cA.cycle / 2, 6);
    expect(capacity(sim('sim-demo-pcb-b'), B).capacityGapUph!).toBeGreaterThan(0);
    // sequential layout: one part at a time → Σ of station means
    const seq = cycleTime(resolveScenario({ ...sim('sim-demo-pcb-a'), layout: 'sequential' }, byId, defs))!;
    expect(seq.cycle).toBeCloseTo(cA.throughputTime, 6);
    // lineage: UPH → cycle → stations → laser inputs
    const cycleNode = cA.lineage.children![0].children![0];
    expect(cycleNode.label).toMatch(/Cycle time/);
    expect(cycleNode.children!.find((c) => c.label.startsWith('Laser marking'))!.children![0].children!.some((x) => x.label === 'Marking speed' && x.value === 1500)).toBe(true);
  });

  it('discrete-event simulation: deterministic mode agrees with the capacity engine; seeded runs repeat (§64)', () => {
    const d0 = runDes(A, { horizon_s: 4 * 3600, warmup_s: 1800, seed: 3, variability: false });
    const noReject = cA.theoreticalUph * 0.99; // 1 % reject at inspection
    expect(Math.abs(d0.uph - noReject) / noReject).toBeLessThan(0.02);
    const d1 = runDes(A, { horizon_s: 3600, seed: 9, failures: true });
    const d2 = runDes(A, { horizon_s: 3600, seed: 9, failures: true });
    expect(d1.ok).toBe(d2.ok);
    expect(d1.stations.find((s) => s.key === 'laser')!.utilization).toBeGreaterThan(0.7);
    // upstream of the bottleneck is blocked, downstream starved
    expect(d1.stations.find((s) => s.key === 'fixture')!.blocked).toBeGreaterThan(0.3);
    expect(d1.stations.find((s) => s.key === 'sort')!.starved).toBeGreaterThan(0.5);
    for (const s of d1.stations) expect(s.utilization + s.blocked + s.starved + s.down).toBeCloseTo(1, 6);
    // faults reduce output
    const f = runDes(A, { horizon_s: 4 * 3600, seed: 9, faults: [{ key: 'x', name: 'Laser unavailable', station_key: 'laser', at_min: 30, duration_min: 30 }] });
    const b = runDes(A, { horizon_s: 4 * 3600, seed: 9 });
    expect(f.ok).toBeLessThan(b.ok);
    const ev = bottleneckEvidence(cA, d1.stations);
    expect(ev[0].key).toBe('laser');
    expect(ev[0].reasons.join(' ')).toMatch(/Lowest capacity/);
    // replay rebuilds a consistent state
    const tr = runDes(A, { horizon_s: 600, seed: 1, traceUntil_s: 600 });
    const st = replayAt(tr.trace, A.stations.map((s) => s.station.parallel ?? 1), 300);
    expect(st.servers.flat().filter((x) => x === 'busy').length).toBeGreaterThan(0);
    expect(st.ok + st.ng + st.inSystem).toBeGreaterThan(0);
  });

  it('Monte Carlo: percentiles, probability of meeting target, stated assumptions (§68)', () => {
    const o = { iterations: 100, horizon_s: 1800, failures: true };
    const uph = monteCarloChunk(A, o, 0, 100);
    const mc = summarizeMc(uph, 400, o);
    expect(mc.n).toBe(100);
    const p = Object.fromEntries(mc.percentiles.map((x) => [x.p, x]));
    expect(p.P50.uph).toBeGreaterThanOrEqual(p.P90.uph);
    expect(p.P90.uph).toBeGreaterThanOrEqual(p.P99.uph);
    expect(p.P99.cycle).toBeGreaterThanOrEqual(p.P50.cycle);
    expect(mc.probMeetTarget).toBeGreaterThanOrEqual(0);
    expect(mc.histogram.reduce((s, b) => s + b.count, 0)).toBe(100);
    expect(mc.assumptions.join(' ')).toMatch(/not a factory measurement/);
  });

  it('what-if recalculates without touching the original (§69)', () => {
    const w = applyWhatIf(sim('sim-demo-pcb-a'), { laser: { speed_mm_s: 3000 } });
    expect(sim('sim-demo-pcb-a').stations.find((s) => s.key === 'laser')!.laser!.speed_mm_s).toBe(1500);
    const c = cycleTime(resolveScenario(w, byId, defs))!;
    expect(c.cycle).toBeLessThan(cA.cycle);
    const par = cycleTime(resolveScenario(applyWhatIf(sim('sim-demo-pcb-a'), { parallel: { laser: 3 } }), byId, defs))!;
    expect(par.bottleneck.rs.station.key).not.toBe('laser');
    const warn = resolveScenario(applyWhatIf(sim('sim-demo-pcb-a'), { laser: { speed_mm_s: 5000 } }), byId, defs);
    expect(warn.warnings.join(' ')).toMatch(/exceeds SC-10's stated marking speed/);
  });

  it('BOM is multi-level from canonical parts; currencies never mixed silently (§93, §94, §142)', () => {
    const bom = buildBom(A, byId, fx);
    expect(bom.items.filter((i) => i.level === 'Equipment')).toHaveLength(1);
    expect(bom.items.some((i) => i.level === 'System')).toBe(true);
    expect(bom.items.some((i) => i.level === 'Subsystem' && i.name === 'Laser')).toBe(true);
    const laserLine = bom.items.find((i) => i.partId === 'prt-demo-mopa-20')!;
    expect(laserLine.currency).toBe('USD');
    expect(laserLine.extended).toBeCloseTo(3200 * 87.4, 6);
    expect(bom.byCurrency.USD).toBeGreaterThan(0);
    expect(bom.byCurrency.INR).toBeGreaterThan(0);
    expect(bom.total).not.toBeNull();
    expect(bom.elements.find((e) => e.key === 'integration')!.included).toBe(false);
    expect(bom.notes.join(' ')).toMatch(/no as-of date/);
    const noFx = buildBom(A, byId, {});
    expect(noFx.total).toBeNull();
    expect(noFx.missingFx).toEqual(['USD']);
    const withPct = buildBom(resolveScenario({ ...sim('sim-demo-pcb-a'), cost: { integration_pct: 10 } }, byId, defs), byId, fx);
    expect(withPct.total! - bom.total!).toBeCloseTo((bom.elements[0].value! + bom.elements[1].value!) * 0.1, 3);
  });

  it('scenario comparison lists metrics and declares no winner; optimization marks the Pareto frontier (§70, §71)', () => {
    const ms = ['sim-demo-pcb-a', 'sim-demo-pcb-b', 'sim-demo-pcb-c'].map((id) => scenarioMetrics(sim(id), byId, defs, fx));
    expect(ms.map((m) => m.meetsTarget)).toEqual([false, true, true]);
    expect(ms[1].capex!).toBeGreaterThan(ms[0].capex!);
    const opt = optimize(sim('sim-demo-pcb-a'), byId, defs, fx, { minUph: 500, maxCapex: 4500000 }, { laserAlternatives: ['prt-demo-mopa-30', 'prt-demo-qs-20-in'] });
    expect(opt.candidates.length).toBe(27 * 3);
    expect(opt.feasible.every((c) => c.uph >= 500 && c.capex! <= 4500000)).toBe(true);
    expect(opt.frontier.length).toBeGreaterThan(0);
    for (const f of opt.frontier) expect(opt.feasible.some((o) => o.uph > f.uph && o.capex! < f.capex!)).toBe(false);
    expect(opt.assumptions.join(' ')).toMatch(/engineering decision/);
  });

  it('energy, maintenance, faults and calibration are explicit about their basis (§75–§77, §84)', () => {
    const e = energyModel(A, cA, defs, 1000);
    expect(e.kwhPerPart).toBeGreaterThan(0);
    expect(e.rows.some((r) => r.consumer.includes('DL-MOPA-20'))).toBe(true);
    expect(e.assumptions[0]).toMatch(/ESTIMATE/);
    const m = maintenanceModel(A, cA);
    expect(m.pmPerYear).toBeCloseTo((8 * 3 * 300) / 160, 6);
    const f = faultImpact(A, [{ station_key: 'laser', name: 'Laser unavailable', at_min: 20, duration_min: 30 }], 2 * 3600);
    expect(f.lostParts).toBeGreaterThan(0);
    const cal = calibration({ ...sim('sim-demo-pcb-a'), actuals: [{ metric: 'UPH', predicted: 444, actual: 380, unit: 'parts/h', date: '2026-09-27' }] });
    expect(cal[0].pctError).toBeCloseTo(((380 - 444) / 444) * 100, 6);
    expect(cal[0].candidate).toBe(true);
    expect(cal[0].suggestion).toMatch(/does not change the model automatically/);
  });

  it('supplier dependency, localization layers and disruption (§95, §96, §145)', () => {
    const deps = supplierDependency(A, parts, ctx, byId);
    const laser = deps.find((d) => d.sp.part.id === 'prt-demo-mopa-20')!;
    expect(laser.origin).toBe('Imported');
    expect(laser.alternatives.map((a) => a.part.id)).toContain('prt-demo-qs-20-in');
    expect(laser.alternatives.some((a) => a.part.id === 'prt-demo-uv-5')).toBe(false); // wavelength rule
    const layers = localizationLayers(deps, true);
    expect(layers.find((l) => l.layer === 'Laser Source')!.gap).toMatch(/LI-QS-20/);
    expect(layers.find((l) => l.layer === 'Optics')!.status).toBe('Localized');
    const dis = supplierDisruption('co-demo-photonics', 60, records);
    expect(dis.affectedScenarios.map((s) => s.id)).toEqual(expect.arrayContaining(['sim-demo-pcb-a', 'sim-demo-battery-tab']));
    expect(dis.affectedProjects.map((p) => p.id)).toContain('prj-demo-c2i');
    expect(dis.assumptions.length).toBeGreaterThan(0);
  });

  it('design review finds the planted issues and links them; readiness is per dimension (§101–§105)', () => {
    const T = resolveScenario(sim('sim-demo-battery-tab'), byId, defs);
    const inp = { res: T, records, byId, defs, ctx, bom: buildBom(T, byId, fx), deps: supplierDependency(T, parts, ctx, byId) };
    const issues = designReview(inp);
    const text = issues.map((i) => `${i.section}: ${i.message}`).join('\n');
    expect(text).toMatch(/Components: DL-CW-1500 ↔ CH-1000: incompatible/);
    expect(text).toMatch(/Components: SD-200E ↔ SM-400: incompatible/);
    expect(text).toMatch(/Interfaces: Required protocol EtherCAT/);
    expect(text).toMatch(/Architecture: Clamp & tab pressing: required component/);
    expect(text).toMatch(/Safety: Missing safety chain|Safety: Laser station without/);
    expect(issues.find((i) => /CH-1000/.test(i.message))!.recordId).toBeDefined();
    const comp = engineeringCompleteness(inp, issues);
    expect(comp.map((c) => c.dimension)).toEqual(['Requirements', 'Architecture', 'BOM', 'Simulation', 'Supplier', 'Testing', 'Quality', 'Safety', 'Service']);
    expect(buildReadiness(inp).find((x) => x.item === 'Manufacturing process')!.ok).toBe(false);
    const pocA = pocReadiness({ ...inp, res: A, bom: buildBom(A, byId, fx), deps: supplierDependency(A, parts, ctx, byId) });
    expect(pocA.find((x) => x.item === 'Recipe')!.ok).toBe(true);
    expect(pocA.find((x) => x.item === 'Requirement')!.ok).toBe(false);
  });

  it('templates → scenarios, versions never overwrite, sequences validate, twin lays out, diffs are explicit (§60, §74, §134, §144)', () => {
    const t = byId.get('eqt-pcb-laser-marking') as EquipmentTemplate & AnyRecord;
    let n = 0;
    const s = scenarioFromTemplate(t, { newId: () => `sim-Ltest${n++}`, today: '2026-09-27', uph: 500 });
    expect(s.stations.every((x) => x.time_s == null)).toBe(true);
    expect(resolveScenario(s, byId, defs).runnable).toBe(false);
    const d = deriveScenario(sim('sim-demo-pcb-a'), { newId: () => 'sim-Ltestv2', today: '2026-09-27', reason: 'faster galvo' });
    expect(d.parent_id).toBe('sim-demo-pcb-a');
    expect(d.version).toBe(2);
    expect(d.data_type).toBe('USER_CREATED');
    expect(sim('sim-demo-pcb-a').version).toBe(1);
    expect(validateSequence(defaultSequence(t.stations))).toEqual([]);
    expect(validateSequence([{ key: 's', name: 'START', kind: 'start' }, { key: 'e', name: 'Laser enable', kind: 'action' }, { key: 'x', name: 'Complete', kind: 'end' }]).join(' ')).toMatch(/interlock/);
    const tw = twinLayout(sim('sim-demo-pcb-a').stations);
    expect(tw.objects.filter((o) => o.kind === 'station')).toHaveLength(7);
    expect(tw.objects.some((o) => o.kind === 'enclosure')).toBe(true);
    const diff = versionDiff(sim('sim-demo-pcb-a'), sim('sim-demo-pcb-c'), byId, defs, fx);
    expect(diff.components.some((c) => c.role === 'Laser source' && c.before === 'DL-MOPA-20' && c.after === 'DL-MOPA-30')).toBe(true);
    expect(diff.laser.some((l) => l.field === 'speed_mm_s' && l.before === '1500' && l.after === '2500')).toBe(true);
  });

  it('reports hide internal data in customer mode; drafts list what is missing (§121, §139, §156, §158)', () => {
    const inp = { res: A, byId, cycle: cA, cap: capacity(A.sim, cA), bom: buildBom(A, byId, fx), deps: supplierDependency(A, parts, ctx, byId), issues: [], today: '2026-09-27' };
    const eng = simulationReport({ ...inp, mode: 'engineering' });
    const cust = simulationReport({ ...inp, mode: 'customer' });
    for (const h of ['Executive summary', 'Equipment architecture', 'Configuration', 'Requirements', 'Cycle time, capacity and bottleneck', 'BOM and cost', 'Validation']) expect(eng).toContain(`## ${h}`);
    expect(eng).toMatch(/DEMO DATA/);
    expect(cust).not.toMatch(/BOM and cost|DEMO Photonics|DL-MOPA-20|INR \d/);
    expect(cust).toContain('## Assumptions and exclusions');
    expect(eng).not.toMatch(/\bNaN\b|undefined|Infinity/);
    const templates = records.filter((r) => r.entity === 'equipment_template') as (EquipmentTemplate & AnyRecord)[];
    const plan = planDraft('Build a preliminary 500 UPH PCB laser marking machine.', templates, defs);
    expect(plan.template?.id).toMatch(/pcb/);
    expect(plan.uph).toBe(500);
    expect(plan.material).toBe('PCB / solder mask');
    expect(plan.missing.join(' ')).toMatch(/Station times/);
    const al = planDraft('Create a preliminary 500 UPH aluminum marking machine', templates, defs);
    expect(al.material).toBe('Aluminium');
    expect(al.template?.process).toBe('Marking');
  });
});
