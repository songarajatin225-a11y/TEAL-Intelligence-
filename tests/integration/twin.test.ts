import { describe, expect, it } from 'vitest';
import type { AnyRecord } from '../../src/domain';
import type { Simulation } from '../../src/domain/engineering';
import { compatCtx } from '../../src/services/eng/compatibility';
import { specDefs } from '../../src/services/eng/specs';
import { buildBom, fxFromRecords } from '../../src/services/sim/bom';
import { cycleTime } from '../../src/services/sim/capacity';
import { runDes } from '../../src/services/sim/des';
import { resolveScenario } from '../../src/services/sim/model';
import { designReview } from '../../src/services/sim/review';
import { supplierDependency } from '../../src/services/sim/supply';
import { twinChecks } from '../../src/services/twin/checks';
import { aabbOf, checkCollisions, intersects } from '../../src/services/twin/collision';
import { buildMachine, carriedOffset, TWIN_MODEL_VERSION } from '../../src/services/twin/machine';
import { moveTime, planMoves, positionAt, resolveAxis } from '../../src/services/twin/motion';
import { meanCycleTimeline, stationSteps, TwinPlayer } from '../../src/services/twin/timeline';
import { masterRecords } from '../helpers/repo';

type S = Simulation & AnyRecord;

describe('3D machine digital twin engines', async () => {
  const records = await masterRecords();
  const byId = new Map(records.map((r) => [r.id, r]));
  const defs = specDefs(records);
  const fx = fxFromRecords(records);
  const ctx = compatCtx(records, defs);
  const parts = records.filter((r) => r.entity === 'part') as never[];
  const sim = (id: string) => byId.get(id) as S;
  const flagship = sim('sim-demo-laser-marker');
  const res = resolveScenario(flagship, byId, defs);
  const bom = buildBom(res, byId, fx);
  const model = buildMachine(res, byId, defs, bom);

  it('trapezoidal / triangular motion profile (§18)', () => {
    // 140 mm at 1000 mm/s, 10 m/s²: ramps cover 50 mm each → 0.1 + 0.04 + 0.1 s
    expect(moveTime(140, 1000, 10000)).toBeCloseTo(0.24, 9);
    // too short to reach speed → triangular: 2·sqrt(s/a)
    expect(moveTime(20, 1000, 10000)).toBeCloseTo(2 * Math.sqrt(20 / 10000), 9);
    expect(positionAt(0, 140, 1000, 10000, 10000, 0.24).pos).toBeCloseTo(140, 6);
    expect(positionAt(0, 140, 1000, 10000, 10000, 0.12).pos).toBeCloseTo(70, 6);
    expect(positionAt(140, 0, 1000, 10000, 10000, 0.05).vel).toBeLessThan(0);
  });

  it('axis model reads travel, speed and acceleration from the linked stage record (§17)', () => {
    const ax = resolveAxis({ key: 'x', name: 'X', type: 'linear', station_key: '_machine', part_id: 'prt-demo-stage-500' }, byId, defs);
    expect(ax).toMatchObject({ stroke: 500, speed: 1000, accel: 10000, missing: [] });
    expect(ax.sources.speed).toMatch(/LS-500/);
    const none = resolveAxis({ key: 'z', name: 'Z', type: 'linear', station_key: '_machine' }, byId, defs);
    expect(none.missing).toEqual(['Z: speed', 'Z: acceleration']);
  });

  it('axis motion is part of the canonical station time and cycle (§69)', () => {
    const laser = res.stations.find((s) => s.station.key === 'laser')!;
    // laser process 150 / (0.03 × 2000) + 0.4 = 2.9 s, plus the move 140→300 (x) & 0→20 (y)
    const mv = Math.max(moveTime(160, 1000, 10000), moveTime(20, 1000, 10000));
    expect(laser.time).toBeCloseTo(2.9 + mv, 9);
    expect(laser.lineage.formula).toMatch(/axis moves/);
    const c = cycleTime(res)!;
    expect(c.layout).toBe('sequential');
    expect(c.cycle).toBeCloseTo(c.loads.reduce((n, l) => n + l.mean, 0), 9);
    expect(c.loads.find((l) => l.rs.station.key === 'laser')!.mean).toBeGreaterThan(2.9);
    // no axis speed → the simulation reports an input gap instead of assuming
    const gap = resolveScenario({ ...flagship, twin: { ...flagship.twin, axes: flagship.twin!.axes!.map((a) => ({ ...a, part_id: undefined })) } }, byId, defs);
    expect(gap.runnable).toBe(false);
    expect(gap.blocking.join(' ')).toMatch(/X axis: speed/);
  });

  it('generates a conceptual scene graph linked to engineering records (§8, §9, §12)', () => {
    expect(model.version).toBe(TWIN_MODEL_VERSION);
    expect(model.label).toBe('CONCEPTUAL 3D MODEL');
    expect(model.carrier).toBe('axes');
    for (const id of ['frame', 'enclosure', 'door', 'fixture', 'axis-x', 'axis-y', 'cabinet', 'hmi', 'estop', 'st-laser-galvo', 'st-laser-ftheta', 'st-laser-source', 'st-align-camera', 'st-inspect-camera']) expect(model.byId.has(id), id).toBe(true);
    expect(model.byId.get('st-laser-galvo')!.partId).toBe('prt-demo-galvo-10');
    expect(model.byId.get('st-laser-galvo')!.params.bomItemId).toBeTruthy();
    expect(model.objects.every((o) => o.parentId === null || model.byId.has(o.parentId))).toBe(true);
    // f-theta working distance from its specification sets the head height above the part
    const l = model.lasers[0];
    expect(l.field).toBe(110);
    expect(l.wd).toBe(180);
    expect(model.byId.get('st-laser-ftheta')!.position[1] - l.focus[1]).toBeCloseTo(180, 6);
    // camera FOV from pixel size × resolution × WD ÷ f
    const v = model.vision.find((x) => x.stationKey === 'align')!;
    expect(v.fovX).toBeCloseTo(2448 * 0.00345 * (150 / 16), 3);
    expect(model.io.some((i) => i.name === 'Door closed' && i.kind === 'DI')).toBe(true);
    expect(model.zones.map((z) => z.key)).toEqual(expect.arrayContaining(['operator', 'laser', 'restricted']));
  });

  it('bounding-box collisions: clear for the demo, detected when the camera is lowered (§20)', () => {
    expect(checkCollisions(model)).toEqual([]);
    const low = { ...flagship, twin: { ...flagship.twin, vision: { ...flagship.twin!.vision, align: { wd_mm: 15, target_x_mm: 60, target_y_mm: 40 } } } } as S;
    const m2 = buildMachine(resolveScenario(low, byId, defs), byId, defs);
    const hits = checkCollisions(m2);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].text).toMatch(/^Collision detected: /);
    const fx0 = model.byId.get('fixture')!;
    expect(carriedOffset(fx0, { x: 140, y: 20 }, model.axes)).toEqual([140, 0, 20]);
    expect(intersects(aabbOf({ position: [0, 0, 0], size: [10, 10, 10] }), aabbOf({ position: [0, 10, 0], size: [10, 10, 10] }))).toBe(false);
  });

  it('axis limits are enforced (§15)', () => {
    const axes = model.axes;
    const p = planMoves([{ station_key: 'laser', targets: { x: 620 } }], axes, ['laser']);
    expect(p[0].limitViolations[0]).toMatch(/outside the travel 0–500 mm/);
  });

  it('station sub-steps only split where data allows (§162)', () => {
    const li = res.stations.findIndex((s) => s.station.key === 'laser');
    const steps = stationSteps(res, li, model);
    expect(steps.map((s) => s.kind)).toEqual(['move', 'laser_prep', 'laser']);
    expect(steps.reduce((n, s) => n + s.dur, 0)).toBeCloseTo(res.stations[li].time!, 9);
    expect(meanCycleTimeline(res, model).length).toBeGreaterThan(res.stations.length);
  });

  it('one deterministic run drives state, events and KPIs (§45, §46, §129)', () => {
    const run = (seed: number) => runDes(res, { horizon_s: 1800, seed, traceUntil_s: 1800, failures: false, variability: true });
    const des = run(7);
    const p = new TwinPlayer(res, des, model);
    const s1 = p.at(600);
    const s2 = new TwinPlayer(res, run(7), model).at(600);
    expect(s2).toEqual(s1);
    expect(s1.ok + s1.ng).toBeGreaterThan(20);
    expect(p.events.some((e) => e.type === 'LASER_START')).toBe(true);
    expect(p.events.some((e) => e.type === 'VISION_COMPLETE')).toBe(true);
    // at most one part inside a sequential machine
    expect(s1.inSystem).toBeLessThanOrEqual(1);
    // somewhere in the run the laser is on and the stage is away from home
    const laserSpan = p.spans.find((x) => res.stations[x.st].station.key === 'laser')!;
    const mid = p.at(laserSpan.t1 - 0.3);
    expect(mid.laserOn[0]).toBe(true);
    expect(mid.axes.x).toBeCloseTo(300, 6);
    expect(['Processing']).toContain(mid.machineState);
  });

  it('design check links every issue to a rule and reuses the design review (§114)', () => {
    const c = cycleTime(res);
    const deps = supplierDependency(res, parts, ctx, byId);
    const review = designReview({ res, records, byId, defs, ctx, bom, deps });
    const checks = twinChecks(res, model, c, checkCollisions(model), review);
    expect(checks.every((x) => x.rule)).toBe(true);
    expect(checks.some((x) => x.area === 'Geometry' && x.severity === 'ok' && /Marking field 110/.test(x.text))).toBe(true);
    // shrink the f-theta: the marking-area rule fires
    const small = { ...flagship, twin: { ...flagship.twin, process_area: { x_mm: 150, y_mm: 20 } } } as S;
    const r2 = resolveScenario(small, byId, defs);
    const ch2 = twinChecks(r2, buildMachine(r2, byId, defs), cycleTime(r2), [], []);
    expect(ch2.find((x) => /smaller than the required marking area/.test(x.text))?.severity).toBe('critical');
  });

  it('other DEMO scenarios generate models too (inline line, welding)', () => {
    for (const id of ['sim-demo-pcb-a', 'sim-demo-pcb-b', 'sim-demo-battery-tab', 'sim-demo-semi-marking']) {
      const r = resolveScenario(sim(id), byId, defs);
      const m = buildMachine(r, byId, defs);
      expect(m.carrier).toBe('flow');
      expect(m.objects.length).toBeGreaterThan(10);
    }
    const b = buildMachine(resolveScenario(sim('sim-demo-pcb-b'), byId, defs), byId, defs);
    expect(b.lasers.length).toBe(2);
    expect(buildMachine(resolveScenario(sim('sim-demo-battery-tab'), byId, defs), byId, defs).lasers[0].process).toBe('welding');
  });
});
