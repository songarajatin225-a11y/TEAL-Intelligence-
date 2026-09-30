import { describe, expect, it } from 'vitest';
import type { AnyRecord } from '../../src/domain';
import type { EquipmentTemplate, Selection, Simulation } from '../../src/domain/engineering';
import { specDefs } from '../../src/services/eng/specs';
import { scenarioFromTemplate } from '../../src/services/sim/build';
import { resolveScenario } from '../../src/services/sim/model';
import { architect, architectScenario, buildProcess, poolOf, rebuildIfNeeded, scenarioFromComponents, stationDiff } from '../../src/services/twin/architect';
import { checkCollisions } from '../../src/services/twin/collision';
import { buildMachine } from '../../src/services/twin/machine';
import { masterRecords } from '../helpers/repo';

type Sim = Simulation & AnyRecord;

/* The builder decides the machine from its components: change a component and the machine changes. */
describe('machine architect — stations from components', async () => {
  const records = await masterRecords();
  const byId = new Map(records.map((r) => [r.id, r as AnyRecord]));
  const defs = specDefs(records as AnyRecord[]);
  const tpl = byId.get('eqt-laser-marking') as unknown as EquipmentTemplate & AnyRecord;
  let n = 0;
  const base = (): Sim => scenarioFromTemplate(tpl, { newId: (p: string) => `${p}-a${n++}`, today: '2026-09-29' }) as Sim;
  const pool = (ids: string[]) => ids.map((id) => ({ part: byId.get(id) as never, qty: 1 }));
  const sels = (ids: (string | [string, number])[]): Selection[] => ids.map((x) => (Array.isArray(x) ? { station_key: '_machine', role: 'x', part_id: x[0], quantity: x[1] } : { station_key: '_machine', role: 'x', part_id: x }));
  const components = (sim: Sim, ids: (string | [string, number])[], build: NonNullable<Sim['twin']>['build'] = { mode: 'components' }): Sim => architectScenario({ ...sim, selections: sels(ids), twin: { ...sim.twin, build } } as Sim, byId).sim;
  const keys = (s: Sim) => s.stations.map((x) => x.key);
  const MARKER = ['prt-demo-mopa-20', 'prt-demo-galvo-10', 'prt-demo-ft-160', 'prt-demo-cam-5mp', 'prt-demo-lens-16', 'prt-demo-fixture-pcb', 'prt-demo-fume-200'];

  it('a galvo marker: operator load, fixture, scanned laser, mark verification, NG sorting — each with a reason', () => {
    const a = architect({ pool: pool(MARKER), process: 'Marking' });
    expect(a.stations.map((s) => s.key)).toEqual(['load', 'fixture', 'laser', 'inspect', 'sort', 'unload']);
    expect(a.stations.find((s) => s.key === 'laser')?.name).toBe('Laser marking');
    expect(a.stations.find((s) => s.key === 'inspect')?.name).toBe('Mark verification');
    expect(a.stations.find((s) => s.key === 'load')?.operator).toBe(true);
    expect(a.automation).toBe('Semi-automatic');
    expect(a.automationBasis).toBe('inferred');
    for (const d of a.decisions) expect(d.because.length, d.key).toBeGreaterThan(10);
    expect(a.decisions.find((d) => d.key === 'laser')?.evidence).toEqual(expect.arrayContaining(['prt-demo-mopa-20', 'prt-demo-galvo-10', 'prt-demo-ft-160']));
    // every part is placed exactly once
    expect(a.selections.map((s) => s.part_id).sort()).toEqual([...MARKER].sort());
    // an operator next to a laser without a guard is a stated gap
    expect(a.notes.some((x) => x.kind === 'gap' && /light curtain/.test(x.text))).toBe(true);
  });

  it('swapping the galvo for a welding head and an axis turns the station into a head-and-gantry welder with alignment', () => {
    const a = architect({ pool: pool(['prt-demo-cw-1500', 'prt-demo-weld-head', 'prt-demo-stage-500', 'prt-demo-cam-5mp', 'prt-demo-fixture-pcb', 'prt-demo-chiller-4k']), process: 'Welding' });
    expect(a.stations.map((s) => s.key)).toEqual(['load', 'fixture', 'align', 'laser', 'unload']);
    expect(a.stations.find((s) => s.key === 'laser')?.name).toBe('Laser welding (head)');
    expect(a.selections.find((s) => s.part_id === 'prt-demo-stage-500')?.role).toBe('Motion axis');
    expect(a.selections.find((s) => s.part_id === 'prt-demo-chiller-4k')?.station_key).toBe('laser');
    // one camera: alignment wins for welding and the missing inspection camera is explained
    expect(a.notes.some((x) => /second camera/.test(x.text))).toBe(true);
  });

  it('two laser sources and two scanners give two parallel heads; a second camera adds alignment', () => {
    const a = architect({ pool: [...pool(['prt-demo-ft-160', 'prt-demo-fixture-pcb', 'prt-demo-cam-5mp', 'prt-demo-cam-12mp']), { part: byId.get('prt-demo-mopa-20') as never, qty: 2 }, { part: byId.get('prt-demo-galvo-10') as never, qty: 2 }], process: 'Marking' });
    const laser = a.stations.find((s) => s.key === 'laser')!;
    expect(laser.parallel).toBe(2);
    expect(a.selections.find((s) => s.part_id === 'prt-demo-mopa-20')?.quantity).toBe(2);
    expect(a.stations.map((s) => s.key)).toEqual(['load', 'fixture', 'align', 'laser', 'inspect', 'sort', 'unload']);
    // one f-theta for two scanners is stated, not silently accepted
    expect(a.notes.some((x) => x.kind === 'gap' && /2 scanners but 1 f-theta/.test(x.text))).toBe(true);
  });

  it('a conveyor makes it inline; a robot makes the robot load; manual automation removes the NG sorter', () => {
    const inline = architect({ pool: pool([...MARKER, 'prt-demo-conveyor-pcb']), process: 'Marking' });
    expect(inline.automation).toBe('Inline');
    expect(inline.inline).toBe(true);
    expect(inline.stations[0].name).toBe('Infeed (conveyor)');
    const robot = architect({ pool: pool([...MARKER, 'prt-demo-scara-6', 'prt-demo-gripper']), process: 'Marking' });
    expect(robot.stations[0].name).toBe('Robot loading');
    expect(robot.automation).toBe('Fully automatic');
    expect(robot.stations.at(-1)?.name).toMatch(/robot/i);
    const inlineNoConveyor = architect({ pool: pool(MARKER), process: 'Marking', automation: 'Inline' });
    expect(inlineNoConveyor.stations[0].name).toBe('Infeed (conveyor not selected)');
    expect(inlineNoConveyor.notes.some((x) => x.kind === 'gap' && /Inline automation needs a conveyor/.test(x.text))).toBe(true);
    const manual = architect({ pool: pool(MARKER), process: 'Marking', automation: 'Manual' });
    expect(manual.stations.some((s) => s.key === 'sort')).toBe(false);
  });

  it('a robot with no laser and process Assembly becomes the assembly station; controls go to machine level', () => {
    const a = architect({ pool: pool(['prt-demo-robot-6ax', 'prt-demo-gripper', 'prt-demo-plc-ecat', 'prt-demo-safety-plc', 'prt-demo-fixture-pcb']), process: 'Assembly' });
    expect(a.stations.map((s) => s.key)).toEqual(['load', 'fixture', 'assembly', 'unload']);
    expect(a.machineLevel.sort()).toEqual(['prt-demo-plc-ecat', 'prt-demo-safety-plc']);
  });

  it('gaps are stated, never filled with assumptions', () => {
    const a = architect({ pool: pool(['prt-demo-mopa-20']), process: null });
    const gaps = a.notes.filter((x) => x.kind === 'gap').map((x) => x.text);
    expect(gaps.some((g) => /Process not stated/.test(g))).toBe(true);
    expect(gaps.some((g) => /no beam delivery/.test(g))).toBe(true);
    expect(gaps.some((g) => /no fixture/.test(g))).toBe(true);
    expect(a.stations.every((s) => s.time_s === null)).toBe(true);
  });

  it('in component mode any component change rebuilds the scenario, keeps entered times, and the 3D machine follows', () => {
    const galvo = components(base(), MARKER, { mode: 'components', process: 'Marking' });
    expect(keys(galvo)).toEqual(['load', 'fixture', 'laser', 'inspect', 'sort', 'unload']);
    // an engineer enters a time on the laser station
    const timed: Sim = { ...galvo, stations: galvo.stations.map((s) => (s.key === 'laser' ? { ...s, time_s: 4.2, time_basis: 'USER_INPUT' as const } : s)) };
    const m1 = buildMachine(resolveScenario(timed, byId, defs), byId, defs);
    expect(m1.objects.some((o) => o.kind === 'galvo' && o.partId === 'prt-demo-galvo-10')).toBe(true);
    expect(m1.lasers[0].mode).toBe('galvo');
    // swap the scanner for a welding head + axis anywhere (here: directly in the selections, as the Components tab does)
    const edited: Sim = { ...timed, selections: [...(timed.selections ?? []).filter((s) => !['prt-demo-galvo-10', 'prt-demo-ft-160'].includes(s.part_id)), { station_key: 'laser', role: 'Processing head', part_id: 'prt-demo-weld-head' }, { station_key: 'laser', role: 'Motion axis', part_id: 'prt-demo-stage-500' }] };
    const rebuilt = rebuildIfNeeded(timed, edited, byId);
    expect(rebuilt.stations.find((s) => s.key === 'laser')?.name).toBe('Laser marking (head)');
    expect(rebuilt.stations.find((s) => s.key === 'laser')?.time_s).toBe(4.2);
    const m2 = buildMachine(resolveScenario(rebuilt, byId, defs), byId, defs);
    expect(m2.lasers[0].mode).toBe('head');
    expect(m2.objects.some((o) => o.kind === 'galvo')).toBe(false);
    expect(m2.objects.some((o) => o.kind === 'laser_head' && o.partId === 'prt-demo-weld-head')).toBe(true);
    expect(checkCollisions(m2)).toEqual([]);
    // removing the camera removes inspection and sorting
    const noCam = rebuildIfNeeded(rebuilt, { ...rebuilt, selections: (rebuilt.selections ?? []).filter((s) => s.part_id !== 'prt-demo-cam-5mp') }, byId);
    expect(keys(noCam)).toEqual(['load', 'fixture', 'laser', 'unload']);
    expect(stationDiff(rebuilt.stations, noCam.stations).removed.map((s) => s.key)).toEqual(['inspect', 'sort']);
  });

  it('reads the process from the scenario when nothing else states it, and names unused parts', () => {
    const demo = byId.get('sim-demo-laser-marker') as Sim;
    expect(buildProcess(demo, byId)).toEqual({ process: 'Marking', basis: 'scenario' });
    const a = architect({ pool: pool(['prt-demo-mopa-20', 'prt-demo-weld-head', 'prt-demo-stage-500', 'prt-demo-ft-160', 'prt-demo-lens-16', 'prt-demo-gripper']), process: 'Welding' });
    const unused = a.notes.filter((x) => x.text.startsWith('Not used')).map((x) => x.text);
    expect(unused.some((t) => /scanner optics not used by the head delivery: FT-1064-160/.test(t))).toBe(true);
    expect(unused.some((t) => /vision optics without a camera: VL-16-23/.test(t))).toBe(true);
    expect(unused.some((t) => /robot tooling without a robot: GR-2E/.test(t))).toBe(true);
  });

  it('template mode is never rebuilt, and an unchanged pool does not rebuild', () => {
    const t = base();
    const edited = { ...t, selections: sels(MARKER) };
    expect(rebuildIfNeeded(t, edited, byId)).toBe(edited);
    const c = components(base(), MARKER, { mode: 'components', process: 'Marking' });
    const renamed = { ...c, name: 'renamed' };
    expect(rebuildIfNeeded(c, renamed, byId)).toBe(renamed);
    expect(poolOf(c, byId).length).toBe(MARKER.length);
  });

  it('a new scenario from the Copilot picks is built from components, with no invented times', () => {
    const s = scenarioFromComponents(MARKER, byId, { newId: (p: string) => `${p}-c${n++}`, today: '2026-09-29', process: 'Marking', uph: 600 });
    expect(s.twin?.build).toEqual({ mode: 'components', process: 'Marking' });
    expect(keys(s)).toEqual(['load', 'fixture', 'laser', 'inspect', 'sort', 'unload']);
    expect(s.stations.every((x) => x.time_s === null)).toBe(true);
    expect(s.targets?.uph).toBe(600);
    expect(resolveScenario(s, byId, defs).runnable).toBe(false);
  });

  it('every derived machine builds in 3D without collisions', () => {
    const sets: [string[], string][] = [
      [MARKER, 'Marking'],
      [[...MARKER, 'prt-demo-conveyor-pcb'], 'Marking'],
      [[...MARKER, 'prt-demo-scara-6', 'prt-demo-gripper'], 'Marking'],
      [['prt-demo-cw-1500', 'prt-demo-weld-head', 'prt-demo-stage-500', 'prt-demo-cam-5mp', 'prt-demo-cam-12mp', 'prt-demo-fixture-pcb'], 'Welding'],
      [['prt-demo-robot-6ax', 'prt-demo-gripper', 'prt-demo-fixture-pcb', 'prt-demo-cam-12mp'], 'Assembly'],
      [['prt-demo-uv-5', 'prt-demo-galvo-10-uv', 'prt-demo-ft-uv-160', 'prt-demo-bex-uv-3x', 'prt-demo-tele-05x', 'prt-demo-cam-20mp-rs', 'prt-demo-ring-red'], 'Drilling'],
    ];
    for (const [ids, process] of sets) {
      const s = components(base(), ids, { mode: 'components', process: process as never });
      const m = buildMachine(resolveScenario(s, byId, defs), byId, defs);
      for (const st of s.stations) expect(m.anchors[st.key], `${process}/${st.key}`).toBeDefined();
      expect(checkCollisions(m), `${process} ${ids.join(',')}`).toEqual([]);
    }
  });
});
