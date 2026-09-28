import { describe, expect, it } from 'vitest';
import type { AnyRecord } from '../../src/domain';
import type { EquipmentTemplate, Simulation } from '../../src/domain/engineering';
import { specDefs } from '../../src/services/eng/specs';
import { scenarioFromTemplate } from '../../src/services/sim/build';
import { runDes } from '../../src/services/sim/des';
import { resolveScenario } from '../../src/services/sim/model';
import { checkCollisions } from '../../src/services/twin/collision';
import { explainObject, machineTour, narrate } from '../../src/services/twin/explain';
import { pickPlacePose, scaraFK, scaraIK, toolStroke } from '../../src/services/twin/kinematics';
import { buildMachine } from '../../src/services/twin/machine';
import { stationSteps, TwinPlayer } from '../../src/services/twin/timeline';
import { previewResolved } from '../../src/services/twin/preview';
import { masterRecords } from '../helpers/repo';

/* The 3D machine must work for EVERY equipment template and demo scenario — not only the flagship. */
describe('3D machine for every template and scenario', async () => {
  const records = await masterRecords();
  const byId = new Map(records.map((r) => [r.id, r as AnyRecord]));
  const defs = specDefs(records as AnyRecord[]);
  const templates = records.filter((r) => r.entity === 'equipment_template') as unknown as (EquipmentTemplate & AnyRecord)[];
  let n = 0;
  const fromTemplate = (t: EquipmentTemplate & AnyRecord) => scenarioFromTemplate(t, { newId: (p: string) => `${p}-t${n++}`, today: '2026-09-28' }) as Simulation & AnyRecord;

  it('SCARA inverse kinematics round-trips and flags unreachable targets', () => {
    for (const [x, z] of [
      [300, 100],
      [-200, 250],
      [50, -380],
    ]) {
      const ik = scaraIK(x, z, 250, 250);
      const [fx, fz] = scaraFK(ik.t1, ik.t2, 250, 250);
      expect(ik.reachable).toBe(true);
      expect(fx).toBeCloseTo(x, 6);
      expect(fz).toBeCloseTo(z, 6);
    }
    expect(scaraIK(900, 0, 250, 250).reachable).toBe(false);
  });

  it('pick-and-place poses and tool strokes follow the step progress', () => {
    const pp = { home: [0, 300, 0] as [number, number, number], pick: [-200, 100, 0] as [number, number, number], place: [200, 100, 0] as [number, number, number], clearance: 60 };
    expect(pickPlacePose(pp, 0).tcp).toEqual(pp.home);
    expect(pickPlacePose(pp, 0.3).tcp).toEqual(pp.pick);
    expect(pickPlacePose(pp, 0.4).holding).toBe(true);
    expect(pickPlacePose(pp, 0.8).tcp).toEqual(pp.place);
    expect(pickPlacePose(pp, 0.9).holding).toBe(false);
    expect(toolStroke(0)).toBe(0);
    expect(toolStroke(0.5)).toBe(1);
    expect(toolStroke(1)).toBe(0);
  });

  it(`builds, previews and explains all ${templates.length} equipment templates`, () => {
    expect(templates.length).toBeGreaterThanOrEqual(35);
    for (const t of templates) {
      const sim = fromTemplate(t);
      const res = resolveScenario(sim, byId, defs);
      const m = buildMachine(res, byId, defs);
      // every station has at least one physical object and an anchor for the part
      for (const st of sim.stations) {
        expect(m.anchors[st.key], `${t.id}/${st.key} anchor`).toBeDefined();
        expect(m.objects.some((o) => o.stationKey === st.key && o.kind !== 'station'), `${t.id}/${st.key} objects`).toBe(true);
      }
      expect(checkCollisions(m), t.id).toEqual([]);
      // template scenarios have no times yet → a sequence preview runs (visual only)
      expect(res.runnable, t.id).toBe(false);
      const pr = previewResolved(res);
      const des = runDes(pr, { horizon_s: 300, seed: 3, traceUntil_s: 300, variability: false });
      const p = new TwinPlayer(pr, des, m);
      expect(p.events.length, t.id).toBeGreaterThan(10);
      expect(p.at(60).cycles, t.id).toBeGreaterThan(0);
      const tour = machineTour({ model: m, res, cycle: null, byId, defs });
      expect(tour.length, t.id).toBeGreaterThanOrEqual(3);
      for (const o of m.objects) if (o.kind !== 'group' && o.kind !== 'station') expect(explainObject(o, { model: m, res, cycle: null, byId, defs }).guide.what.length, `${t.id}/${o.id}`).toBeGreaterThan(10);
    }
  });

  it('handling, tooling and test stations get working mechanisms', () => {
    const pick = fromTemplate(templates.find((t) => t.id === 'eqt-pick-place')!);
    const mp = buildMachine(resolveScenario(pick, byId, defs), byId, defs);
    const hd = Object.values(mp.handlers)[0];
    expect(hd).toBeDefined();
    expect(hd.carries).toBe('part');
    expect(['robot', 'gantry']).toContain(hd.kind);
    const kinds = (id: string) => new Set(buildMachine(resolveScenario(fromTemplate(templates.find((t) => t.id === id)!), byId, defs), byId, defs).objects.map((o) => o.kind));
    expect(kinds('eqt-screwdriving').has('tool')).toBe(true);
    expect(kinds('eqt-testing').has('test_head')).toBe(true);
    expect(kinds('eqt-testing').has('pusher')).toBe(true);
    expect(kinds('eqt-dispensing').has('tool')).toBe(true);
    expect(kinds('eqt-pcb-inspection').has('camera')).toBe(true);
    const weld = buildMachine(resolveScenario(fromTemplate(templates.find((t) => t.id === 'eqt-laser-welding')!), byId, defs), byId, defs);
    expect(weld.lasers[0].mode).toBe('head');
  });

  it('the battery tab welder demo runs with a head gantry following the seam', () => {
    const sim = byId.get('sim-demo-battery-tab') as Simulation & AnyRecord;
    const res = resolveScenario(sim, byId, defs);
    const m = buildMachine(res, byId, defs);
    expect(res.runnable).toBe(true);
    expect(m.lasers[0]).toMatchObject({ mode: 'head', process: 'welding' });
    expect(m.byId.get(m.lasers[0].headId!)?.partId).toBe('prt-demo-weld-head');
    expect(m.objects.some((o) => o.kind === 'bridge')).toBe(true);
    expect(checkCollisions(m)).toEqual([]);
  });
});

describe('every DEMO scenario is a working 3D simulation', async () => {
  const records = await masterRecords();
  const byId = new Map(records.map((r) => [r.id, r as AnyRecord]));
  const defs = specDefs(records as AnyRecord[]);
  const sims = records.filter((r) => r.entity === 'simulation' && String(r.id).startsWith('sim-demo-')) as unknown as (Simulation & AnyRecord)[];
  const build = (id: string) => {
    const sim = byId.get(id) as Simulation & AnyRecord;
    const res = resolveScenario(sim, byId, defs);
    return { res, m: buildMachine(res, byId, defs) };
  };

  // sim-demo-semi-marking is incomplete on purpose (clamp time and marked area UNKNOWN) — it must preview, not report
  const INCOMPLETE = new Set(['sim-demo-semi-marking']);

  it(`runs all ${sims.length} demo scenarios without collisions`, () => {
    expect(sims.length).toBeGreaterThanOrEqual(9);
    for (const sim of sims) {
      const res = resolveScenario(sim, byId, defs);
      const m = buildMachine(res, byId, defs);
      expect(checkCollisions(m), sim.id).toEqual([]);
      expect(res.runnable, `${sim.id}: ${res.blocking.join('; ')}`).toBe(!INCOMPLETE.has(sim.id));
      const r = res.runnable ? res : previewResolved(res);
      const des = runDes(r, { horizon_s: 600, seed: 1, traceUntil_s: 600, variability: res.runnable });
      const p = new TwinPlayer(r, des, m);
      expect(p.at(590).cycles, sim.id).toBeGreaterThan(0);
    }
  });

  it('the assembly cell picks components with a SCARA robot', () => {
    const { m } = build('sim-demo-assembly-cell');
    const hd = m.handlers.assembly;
    expect(hd).toMatchObject({ kind: 'robot', carries: 'component' });
    expect(m.byId.get(hd.objectId)?.partId).toBe('prt-demo-scara-6');
    expect(m.objects.some((o) => o.kind === 'tray')).toBe(true);
  });

  it('the test line has parallel test heads and a reject pusher', () => {
    const { m } = build('sim-demo-test-line');
    const heads = m.objects.filter((o) => o.kind === 'test_head');
    expect(heads.map((o) => o.params.server)).toEqual([0, 1]);
    expect(new Set(heads.map((o) => o.position[2])).size).toBe(2);
    expect(m.objects.some((o) => o.kind === 'pusher')).toBe(true);
    expect(m.io.filter((q) => q.name.startsWith('Functional test · lane')).length).toBeGreaterThanOrEqual(2);
    // narration describes a contact test, not a camera
    const { res } = build('sim-demo-test-line');
    const i = res.stations.findIndex((r) => r.station.kind === 'test');
    const step = stationSteps(res, i, m).at(-1)!;
    const txt = narrate(step, res.stations[i].station.name, 0.5, { model: m, res, cycle: null, byId, defs });
    expect(txt).toMatch(/tester runs/);
    expect(txt).toMatch(/2 parallel nests/);
    expect(txt).not.toMatch(/camera/);
  });

  it('the NG diverter fires only for parts the run actually rejects', () => {
    const { res, m } = build('sim-demo-test-line');
    const des = runDes(res, { horizon_s: 3600, seed: 7, traceUntil_s: 3600, variability: true });
    const p = new TwinPlayer(res, des, m);
    const sortI = res.stations.findIndex((r) => r.station.kind === 'sort');
    const rejected = [...p.rejectAt.entries()].filter(([, i]) => i === sortI).map(([id]) => id);
    expect(rejected.length).toBeGreaterThan(0);
    expect(p.events.some((e) => e.type === 'SORT' && e.station === 'sort' && /rejected at/.test(e.text))).toBe(true);
    // sample the run: whenever the sort server holds a part, ng is true exactly for the rejected ones
    let seenNg = 0;
    let seenOk = 0;
    for (let t = 0; t < 3600; t += 0.5) {
      const sv = p.at(t).stations[sortI].servers[0];
      if (sv.state !== 'busy') continue;
      expect(sv.ng).toBe(rejected.includes(sv.part));
      if (sv.ng) seenNg++;
      else seenOk++;
    }
    expect(seenNg).toBeGreaterThan(0);
    expect(seenOk).toBeGreaterThan(seenNg);
  });

  it('the robot transfer moves the part itself', () => {
    const { m } = build('sim-demo-robot-transfer');
    expect(m.handlers.pick).toMatchObject({ kind: 'robot', carries: 'part' });
  });
});
