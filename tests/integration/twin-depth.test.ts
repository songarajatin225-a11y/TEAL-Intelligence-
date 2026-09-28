import { describe, expect, it } from 'vitest';
import type { AnyRecord } from '../../src/domain';
import type { Simulation } from '../../src/domain/engineering';
import { specDefs } from '../../src/services/eng/specs';
import { resolveScenario, transferModel } from '../../src/services/sim/model';
import { findingsByObject, type TwinCheck } from '../../src/services/twin/checks';
import { checkHandlerSweeps } from '../../src/services/twin/collision';
import { ARM_TOOL, articulatedFK, articulatedIK } from '../../src/services/twin/kinematics';
import { buildMachine } from '../../src/services/twin/machine';
import { axisMoveTime, axisPositionAt, moveTime, sCurveTime } from '../../src/services/twin/motion';
import { livePower, utilities } from '../../src/services/twin/utilities';
import { masterRecords } from '../helpers/repo';

type S = Simulation & AnyRecord;

/* Deeper simulation: S-curve + settling, inline transfer, 6-axis robots, gripper sweeps, findings, utilities. */
describe('3D simulation depth', async () => {
  const records = await masterRecords();
  const byId = new Map(records.map((r) => [r.id, r as AnyRecord]));
  const defs = specDefs(records as AnyRecord[]);
  const sim = (id: string) => byId.get(id) as S;

  it('S-curve time: full profile adds a/j to the trapezoid, and short moves still fit', () => {
    // 200 mm, 1000 mm/s, 10 000 mm/s², jerk 100 000 mm/s³: s/v + v/a + a/j
    expect(sCurveTime(200, 1000, 10000, 100000)).toBeCloseTo(0.2 + 0.1 + 0.1, 6);
    // always slower than the trapezoid, and converges to it for a very high jerk
    for (const s of [1, 10, 50, 140, 600]) {
      expect(sCurveTime(s, 1000, 10000, 50000)).toBeGreaterThan(moveTime(s, 1000, 10000));
      expect(sCurveTime(s, 1000, 10000, 1e12)).toBeCloseTo(moveTime(s, 1000, 10000), 3);
    }
  });

  it('settling time is added only when entered; positions hold at the target while settling', () => {
    const ax = { speed: 1000, accel: 10000, decel: 10000, jerk: null, settle: null };
    expect(axisMoveTime(140, ax)).toBeCloseTo(0.24, 9);
    expect(axisMoveTime(140, { ...ax, settle: 0.08 })).toBeCloseTo(0.32, 9);
    expect(axisMoveTime(0, { ...ax, settle: 0.08 })).toBe(0);
    expect(axisPositionAt(0, 140, { ...ax, settle: 0.08 }, 0.28).pos).toBe(140);
    const s = { ...ax, jerk: 100000 };
    const T = axisMoveTime(140, s)!;
    expect(axisPositionAt(0, 140, s, T / 2).pos).toBeCloseTo(70, 6);
  });

  it('the flagship states that settling time is not included (never assumed)', () => {
    const res = resolveScenario(sim('sim-demo-laser-marker'), byId, defs);
    expect(res.warnings.some((w) => /settling time not defined/.test(w))).toBe(true);
    expect(res.transfer).toBeNull(); // sequential machine: no inline transfer
  });

  it('inline transfer: entered distance ÷ the conveyor record speed, added to every station but the last', () => {
    const s = sim('sim-demo-assembly-cell');
    const tm = transferModel(s, byId, defs)!;
    expect(tm.distance).toBe(200);
    expect(tm.speed).toBe(150); // CNV-PCB-450 stated max speed
    expect(tm.sources.speed).toMatch(/CNV-PCB-450/);
    // 200 mm at 150 mm/s with 500 mm/s² ramps: v/a + s/v
    expect(tm.time).toBeCloseTo(150 / 500 + 200 / 150, 9);
    const res = resolveScenario(s, byId, defs);
    const base = resolveScenario({ ...s, twin: { ...s.twin, transfer: undefined } }, byId, defs);
    res.stations.forEach((rs, i) => expect(rs.time! - base.stations[i].time!).toBeCloseTo(i === res.stations.length - 1 ? 0 : tm.time!, 9));
    // without a distance it is not included — and says so
    expect(base.warnings.some((w) => /transfer not included — transfer distance not entered/.test(w))).toBe(true);
    expect(base.runnable).toBe(true);
  });

  it('articulated IK reaches the target with the tool vertical', () => {
    for (const [x, y, z] of [
      [350, -250, 120],
      [-200, -320, 380],
      [420, 60, -150],
    ]) {
      const ik = articulatedIK(x, y, z, 350, 350, ARM_TOOL);
      expect(ik.reachable).toBe(true);
      const p = articulatedFK(ik, 350, 350, ARM_TOOL);
      expect(p[0]).toBeCloseTo(x, 6);
      expect(p[1]).toBeCloseTo(y, 6);
      expect(p[2]).toBeCloseTo(z, 6);
      expect(ik.shoulder + ik.elbow + ik.wrist).toBeCloseTo(-Math.PI / 2, 9);
    }
  });

  it('a 6-axis robot record gives an articulated robot in 3D; a SCARA record stays SCARA', () => {
    const m6 = buildMachine(resolveScenario(sim('sim-demo-robot-transfer'), byId, defs), byId, defs);
    expect(Number(m6.byId.get(m6.handlers.pick.objectId)?.params.axes)).toBe(6);
    const m4 = buildMachine(resolveScenario(sim('sim-demo-assembly-cell'), byId, defs), byId, defs);
    expect(Number(m4.byId.get(m4.handlers.assembly.objectId)?.params.axes)).toBe(4);
  });

  it('gripper sweeps: clear on the demos, detected when fixed tooling is in the path', () => {
    const m = buildMachine(resolveScenario(sim('sim-demo-robot-transfer'), byId, defs), byId, defs);
    expect(checkHandlerSweeps(m)).toEqual([]);
    const hd = m.handlers.pick;
    const mid: [number, number, number] = [(hd.pp.pick[0] + hd.pp.place[0]) / 2, hd.pp.pick[1] + hd.pp.clearance, (hd.pp.pick[2] + hd.pp.place[2]) / 2];
    const post = { ...m.objects[0], id: 'test-post', name: 'Test post', kind: 'generic' as const, parentId: 'machine', stationKey: undefined, carriedBy: undefined, collision: true, position: [mid[0], m.tableTop, mid[2]] as [number, number, number], size: [60, mid[1] - m.tableTop + 100, 60] as [number, number, number] };
    const blocked = { ...m, objects: [...m.objects, post], byId: new Map([...m.byId, [post.id, post]]) };
    const hits = checkHandlerSweeps(blocked);
    expect(hits.some((h) => h.b === 'test-post' && /robot gripper/.test(h.text))).toBe(true);
  });

  it('design-review findings link to their component in 3D; single-source findings form one group', () => {
    const checks: TwinCheck[] = [
      { area: 'Compatibility', severity: 'critical', text: 'Lens image circle too small', objectId: 'cam', rule: 'r' },
      { area: 'Supplier', severity: 'major', text: 'A: single source', objectId: 'cam', rule: 'r', group: 'Single-source components' },
      { area: 'Geometry', severity: 'minor', text: 'FOV not computable', objectId: 'cam', rule: 'r' },
      { area: 'Geometry', severity: 'ok', text: 'fine', objectId: 'lens', rule: 'r' },
    ];
    const f = findingsByObject(checks);
    expect(f.get('cam')).toEqual({ severity: 'critical', count: 2, first: 'Lens image circle too small' });
    expect(f.has('lens')).toBe(false);
  });

  it('utilities: only stated values, live power follows the working stations', () => {
    const res = resolveScenario(sim('sim-demo-robot-transfer'), byId, defs);
    const u = utilities(res, byId, defs);
    const robot = u.items.find((i) => i.partId === 'prt-demo-robot-6ax')!;
    expect(robot).toMatchObject({ power: 900, powerBasis: 'typical', stationKey: 'pick' });
    expect(u.statedPower).toBeGreaterThanOrEqual(900);
    expect(u.missingPower.every((i) => i.power == null)).toBe(true);
    const idle = livePower(u, { stations: res.stations.map((r) => ({ key: r.station.key, servers: [{ state: 'idle' }], queue: 0 })) } as never);
    const busy = livePower(u, { stations: res.stations.map((r) => ({ key: r.station.key, servers: [{ state: r.station.key === 'pick' ? 'busy' : 'idle' }], queue: 0 })) } as never);
    expect(busy! - idle!).toBe(900);
  });
});
