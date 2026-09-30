import type { AnyRecord } from '../../domain';
import { BUILD_PROCESSES, productTypeLabel, type Part, type Selection, type Simulation, type Slot, type Station, type StationKind, type TwinBuild } from '../../domain/engineering';
import { defaultSequence } from '../sim/build';

/*
 * MACHINE ARCHITECT — the builder that decides the machine from its components (3D master prompt §8–§13).
 *
 * A template fixes the stations up front. In "build from components" mode the stations are DERIVED:
 * every rule below reads the chosen components, the process and the automation level, and states why a
 * station exists (or why it does not). Change a component and the stations, the 3D machine, the
 * simulation and the BOM all follow, because they all read the same scenario.
 *
 * The rules are deterministic engineering heuristics, not a language model: the same inputs always give
 * the same machine, and every decision names the rule and the components that triggered it. Station
 * times are never invented — times already entered for a station that survives the rebuild are kept.
 */

export type Automation = NonNullable<TwinBuild['automation']>;
type P = Part & AnyRecord;

export interface StationDecision {
  key: string;
  name: string;
  kind: StationKind;
  rule: string;
  because: string;
  /** part ids that triggered the decision */
  evidence: string[];
}
export interface ArchitectNote {
  kind: 'gap' | 'info';
  text: string;
}
export interface Architecture {
  stations: Station[];
  selections: Selection[];
  decisions: StationDecision[];
  notes: ArchitectNote[];
  process: string | null;
  processBasis: 'stated' | 'application' | 'template' | 'scenario' | 'unknown';
  automation: Automation;
  automationBasis: 'stated' | 'inferred';
  inline: boolean;
  /** components placed at machine level (controls, safety, electrical, …) */
  machineLevel: string[];
}
export interface ArchitectInput {
  pool: { part: P; qty: number }[];
  process: string | null;
  processBasis?: Architecture['processBasis'];
  automation?: Automation | null;
  inspect?: TwinBuild['inspect'];
}

const LASER_TYPES = new Set(['laser_source', 'laser_module', 'laser_engine']);
const LASER_STATION_EXTRAS = new Set(['laser_controller', 'laser_driver', 'beam_delivery', 'fiber', 'collimator', 'mirror', 'lens', 'window', 'isolator', 'aom', 'eom', 'polarizer', 'waveplate', 'filter', 'dichroic']);
const HEAD_MOTION = new Set(['linear_stage', 'linear_motor', 'ball_screw_stage', 'servo_motor', 'servo_drive', 'motion_controller', 'encoder', 'gearbox', 'coupling']);
const FIXTURE_TYPES = new Set(['fixture', 'cylinder', 'vacuum_generator', 'rotary_stage', 'valve']);
/** processes where the part position must be measured before the laser acts */
const ALIGN_PROCESSES = new Set(['Welding', 'Soldering', 'Drilling', 'Dicing', 'Scribing', 'Micromachining', 'Trimming']);
/** processes whose result is normally verified inline when a camera is available */
const INSPECT_PROCESSES = new Set(['Marking', 'Engraving', 'Welding', 'Soldering', 'Dicing', 'Drilling', 'Cutting', 'Inspection', 'Assembly', 'Dispensing']);
/** processes whose head is moved over a seam or contour rather than scanned */
const HEAD_PROCESSES = new Set(['Welding', 'Cutting', 'Cladding', 'Hardening', 'Soldering', 'Scribing', 'Dicing']);
const ROBOT_PROCESSES = new Set(['Assembly', 'Handling', 'Packaging']);
/** machine-level roles, matching the Studio's machine slots */
const MACHINE_ROLE: Record<string, string> = { plc: 'PLC', hmi: 'HMI', ipc: 'Industrial PC', safety_plc: 'Safety controller', door_switch: 'Door interlock', light_curtain: 'Light curtain', servo_drive: 'Servo drive', servo_motor: 'Servo motor', smps: 'Power supply', enclosure: 'Enclosure' };
const machineRole = (t: string) => MACHINE_ROLE[t] ?? productTypeLabel(t);
const LASER_WORD: Record<string, string> = { Marking: 'marking', Engraving: 'engraving', Welding: 'welding', Cutting: 'cutting', Cleaning: 'cleaning', Drilling: 'drilling', Soldering: 'soldering', Scribing: 'scribing', Dicing: 'dicing', Micromachining: 'micromachining', Trimming: 'trimming', Texturing: 'texturing', Cladding: 'cladding', Hardening: 'hardening' };

/** The component pool of a scenario = every selected part with its total quantity. */
export function poolOf(sim: Simulation, byId: Map<string, AnyRecord>): { part: P; qty: number }[] {
  const m = new Map<string, number>();
  for (const s of sim.selections ?? []) m.set(s.part_id, (m.get(s.part_id) ?? 0) + (s.quantity ?? 1));
  return [...m.entries()].map(([id, qty]) => ({ part: byId.get(id) as P, qty })).filter((x) => !!x.part);
}

export function architect(input: ArchitectInput): Architecture {
  // one unit per physical item so two cameras of the same model can go to two stations
  const units: { part: P; used: boolean }[] = [];
  for (const { part, qty } of [...input.pool].sort((a, b) => a.part.id.localeCompare(b.part.id))) for (let i = 0; i < Math.max(1, Math.round(qty)); i++) units.push({ part, used: false });
  const has = (t: string | Set<string>) => units.some((u) => !u.used && (typeof t === 'string' ? u.part.product_type === t : t.has(u.part.product_type)));
  const count = (t: string | Set<string>) => units.filter((u) => typeof t === 'string' ? u.part.product_type === t : t.has(u.part.product_type)).length;
  const take = (t: string | Set<string>, n = 1) => {
    const out: P[] = [];
    for (const u of units) {
      if (out.length >= n) break;
      if (!u.used && (typeof t === 'string' ? u.part.product_type === t : t.has(u.part.product_type))) {
        u.used = true;
        out.push(u.part);
      }
    }
    return out;
  };
  const takeAll = (t: string | Set<string>) => take(t, Number.MAX_SAFE_INTEGER);

  const stations: Station[] = [];
  const sel = new Map<string, Selection>();
  const decisions: StationDecision[] = [];
  const notes: ArchitectNote[] = [];
  const place = (stationKey: string, role: string, parts: P[]) => {
    for (const p of parts) {
      const k = `${stationKey}|${role}|${p.id}`;
      const cur = sel.get(k);
      sel.set(k, cur ? { ...cur, quantity: (cur.quantity ?? 1) + 1 } : { station_key: stationKey, role, part_id: p.id });
    }
  };
  const station = (key: string, name: string, kind: StationKind, slots: Slot[], rule: string, because: string, evidence: P[], o: Partial<Station> = {}) => {
    stations.push({ key, name, kind, time_s: null, parallel: 1, buffer_after: 0, function: because, slots, ...o });
    decisions.push({ key, name, kind, rule, because, evidence: [...new Set(evidence.map((p) => p.id))] });
  };
  const models = (ps: P[]) => [...new Set(ps.map((p) => p.model_number || p.name))].join(', ');
  const slot = (role: string, product_type: string, required = true): Slot => ({ role, product_type, required });

  const process = input.process;
  const conveyorN = count('conveyor');
  const robotN = count('robot');
  const automation: Automation = input.automation ?? (conveyorN ? 'Inline' : robotN ? 'Fully automatic' : 'Semi-automatic');
  const automationBasis = input.automation ? 'stated' : 'inferred';
  if (!input.automation) notes.push({ kind: 'info', text: conveyorN ? 'Automation inferred as Inline because a conveyor is selected.' : robotN ? 'Automation inferred as Fully automatic because a robot is selected.' : 'Automation assumed Semi-automatic (operator loads, the machine processes) — no robot or conveyor is selected. State it in the builder.' });
  if (!process) notes.push({ kind: 'gap', text: 'Process not stated and not found on the application or template — choose it so the builder can decide alignment, inspection and beam delivery.' });

  /* ---- 1. process station(s): the laser chain, or a robotic / generic process ---- */
  const laserN = count(LASER_TYPES);
  const robotForProcess = !laserN && robotN > 0 && !!process && ROBOT_PROCESSES.has(process);
  let processStation: (() => void) | null = null;
  if (laserN) {
    const sources = takeAll(LASER_TYPES);
    const galvos = count('galvo');
    const heads = count('laser_head');
    const headMode = heads > 0 && (galvos === 0 || (!!process && HEAD_PROCESSES.has(process) && count('f_theta') === 0));
    const word = process && LASER_WORD[process] ? LASER_WORD[process] : 'process';
    if (heads && !headMode) notes.push({ kind: 'info', text: 'A processing head is also selected, but the galvo scanner + f-theta lens decide the delivery for this process — the head is listed at machine level.' });
    processStation = () => {
      const par = Math.min(sources.length, 4);
      if (sources.length > 4) notes.push({ kind: 'info', text: `${sources.length} laser sources selected — drawn as 4 parallel heads; the rest are listed on the machine.` });
      const ev = [...sources];
      if (headMode) {
        const hs = take('laser_head', par);
        const motion = takeAll(HEAD_MOTION);
        ev.push(...hs, ...motion);
        place('laser', 'Laser source', sources);
        place('laser', 'Processing head', hs);
        place('laser', 'Motion axis', motion.filter((p) => /stage|linear/.test(p.product_type)));
        for (const p of motion.filter((q) => !/stage|linear/.test(q.product_type))) place('laser', productTypeLabel(p.product_type), [p]);
        if (hs.length < par) notes.push({ kind: 'gap', text: `${par} laser sources but ${hs.length} processing head(s) — each parallel head needs its own delivery.` });
        if (!motion.some((p) => /stage|linear/.test(p.product_type))) notes.push({ kind: 'gap', text: 'A processing head moves over the seam or contour — no linear stage / axis is selected, so the gantry is drawn as a placeholder.' });
        station('laser', `Laser ${word} (head)`, 'laser', [slot('Laser source', 'laser_source'), slot('Processing head', 'laser_head'), slot('Motion axis', 'linear_stage'), slot('Chiller', 'chiller', false), slot('Fume extraction', 'fume_extraction', false)], 'Laser source + processing head → head-and-axis laser station', `${models(sources)} delivers the beam through ${models(hs)}${galvos ? '' : ' (no galvo scanner selected)'}; the head is moved over the ${process ? `${word} path` : 'part'} by an axis.`, ev, { parallel: par, laser: { passes: 1 } });
      } else {
        const gs = take('galvo', par);
        const fts = take('f_theta', par);
        const bex = take('beam_expander', par);
        const gc = take('galvo_controller', par);
        ev.push(...gs, ...fts, ...bex, ...gc);
        place('laser', 'Laser source', sources);
        place('laser', 'Galvo scanner', gs);
        place('laser', 'F-theta lens', fts);
        place('laser', 'Beam expander', bex);
        place('laser', 'Galvo controller', gc);
        if (!gs.length) notes.push({ kind: 'gap', text: `Laser source selected but no beam delivery — add a galvo scanner + f-theta lens (scanned processes) or a processing head${process && HEAD_PROCESSES.has(process) ? ` (usual for ${word})` : ''}.` });
        else if (!fts.length) notes.push({ kind: 'gap', text: 'Galvo scanner without an f-theta lens — the focus plane and field size are undefined.' });
        if (fts.length && fts.length < gs.length) notes.push({ kind: 'gap', text: `${gs.length} scanners but ${fts.length} f-theta lens — each scanner needs its own lens.` });
        if (gs.length && gs.length < par) notes.push({ kind: 'gap', text: `${par} laser sources but ${gs.length} scanner(s) — each parallel head needs its own scanner.` });
        station('laser', `Laser ${word}`, 'laser', [slot('Laser source', 'laser_source'), slot('Beam expander', 'beam_expander', false), slot('Galvo scanner', 'galvo'), slot('F-theta lens', 'f_theta'), slot('Galvo controller', 'galvo_controller', false), slot('Chiller', 'chiller', false), slot('Fume extraction', 'fume_extraction', false)], gs.length ? 'Laser source + galvo scanner → scanned laser station' : 'Laser source without beam delivery → laser station with open slots', gs.length ? `${models(sources)} is steered by ${models(gs)}${fts.length ? ` through ${models(fts)}` : ''}${par > 1 ? `; ${par} sources give ${par} parallel heads` : ''}.` : `${models(sources)} is selected; the scanner and lens slots are open.`, ev, { parallel: par, laser: { passes: 1 } });
      }
      const ch = takeAll('chiller');
      const fx = takeAll('fume_extraction');
      const extra = takeAll(LASER_STATION_EXTRAS);
      place('laser', 'Chiller', ch);
      place('laser', 'Fume extraction', fx);
      for (const p of extra) place('laser', productTypeLabel(p.product_type), [p]);
      if (!fx.length && process && ['Marking', 'Engraving', 'Cleaning', 'Cutting', 'Drilling', 'Micromachining', 'Texturing'].includes(process)) notes.push({ kind: 'gap', text: `${process} removes material as fume or particles — no fume extraction is selected.` });
    };
  } else if (count(new Set(['galvo', 'laser_head', 'f_theta'])) > 0) {
    notes.push({ kind: 'gap', text: 'Beam delivery (scanner / head / f-theta) is selected but no laser source — add a laser source to get a laser station.' });
  }
  if (!laserN) {
    if (robotForProcess) {
      processStation = () => {
        const r = take('robot');
        const g = takeAll(new Set(['gripper', 'end_effector']));
        const rc = takeAll('robot_controller');
        place(process === 'Assembly' ? 'assembly' : 'transfer', 'Robot', r);
        place(process === 'Assembly' ? 'assembly' : 'transfer', 'Gripper', g);
        for (const p of rc) place(process === 'Assembly' ? 'assembly' : 'transfer', 'Robot controller', [p]);
        if (!g.length) notes.push({ kind: 'gap', text: 'A robot is selected without a gripper or end effector.' });
        if (process === 'Assembly') station('assembly', 'Robot assembly', 'assembly', [slot('Robot', 'robot'), slot('Gripper', 'gripper')], `Process ${process} + robot → robot assembly station`, `${models(r)} joins the components${g.length ? ` with ${models(g)}` : ''}.`, [...r, ...g, ...rc]);
        else station('transfer', 'Robot pick & place', 'transfer', [slot('Robot', 'robot'), slot('Gripper', 'gripper')], `Process ${process} + robot → robot handling station`, `${models(r)} moves the parts${g.length ? ` with ${models(g)}` : ''}.`, [...r, ...g, ...rc]);
      };
    } else if (process === 'Testing') {
      processStation = () => station('test', 'Test', 'test', [], 'Process Testing → test station', 'The part is contacted and tested; the tester is not a component in the database yet.', []);
    } else if (process === 'Dispensing') {
      processStation = () => station('dispense', 'Dispensing', 'process', [], 'Process Dispensing → dispensing station', 'A valve applies adhesive or sealant; select the dispensing hardware as components when it is in the database.', []);
    } else if (process && process !== 'Inspection' && process !== 'Handling') {
      processStation = () => station('process', `${process} (process)`, 'process', [], `Process ${process} without process hardware → generic process station`, `No component that performs ${process.toLowerCase()} is selected — the station is a placeholder.`, []);
      notes.push({ kind: 'gap', text: `No component that performs ${process.toLowerCase()} is selected (e.g. a laser source, robot or tool).` });
    }
  }

  /* ---- 2. material handling in / out ---- */
  const inline = conveyorN > 0 || automation === 'Inline';
  const loadStation = () => {
    if (conveyorN) {
      const cv = takeAll('conveyor');
      place('load', 'Conveyor', cv);
      station('load', 'Infeed (conveyor)', 'load', [slot('Conveyor', 'conveyor')], 'Conveyor selected → inline infeed and outfeed', `${models(cv)} brings parts in and takes them out; stations work concurrently along the line.`, cv);
    } else if (!robotForProcess && has('robot')) {
      const r = take('robot');
      const g = takeAll(new Set(['gripper', 'end_effector']));
      const rc = takeAll('robot_controller');
      place('load', 'Robot', r);
      place('load', 'Gripper', g);
      for (const p of rc) place('load', 'Robot controller', [p]);
      if (!g.length) notes.push({ kind: 'gap', text: 'The loading robot has no gripper or end effector selected.' });
      station('load', 'Robot loading', 'load', [slot('Robot', 'robot'), slot('Gripper', 'gripper')], 'Robot selected (no conveyor) → robot loads the machine from a tray', `${models(r)} picks parts from the supply tray${g.length ? ` with ${models(g)}` : ''}.`, [...r, ...g, ...rc]);
    } else if (automation === 'Inline') {
      station('load', 'Infeed (conveyor not selected)', 'load', [slot('Conveyor', 'conveyor')], 'Inline automation → conveyor infeed (slot open)', 'Inline means parts arrive on a conveyor; no conveyor is selected, so the slot is open.', []);
      notes.push({ kind: 'gap', text: 'Inline automation needs a conveyor — none is selected.' });
    } else if (automation === 'Fully automatic') {
      station('load', 'Automatic infeed (magazine)', 'load', [], 'Fully automatic without robot or conveyor → magazine infeed placeholder', 'Fully automatic loading needs a feeder, robot or conveyor — none is selected, so a magazine is drawn as a placeholder.', []);
      notes.push({ kind: 'gap', text: 'Fully automatic loading needs a robot, conveyor or feeder — none is selected.' });
    } else {
      station('load', automation === 'Manual' ? 'Manual load (operator)' : 'Operator load', 'load', [], `${automation} without robot or conveyor → operator loads`, 'An operator places the part; the machine takes over once the guard is closed.', [], { operator: true });
    }
  };
  const unloadStation = () => {
    if (conveyorN || automation === 'Inline') station('unload', 'Outfeed (conveyor)', 'unload', [], conveyorN ? 'Conveyor selected → inline outfeed' : 'Inline automation → conveyor outfeed', 'Finished parts leave on the line.', []);
    else if (stations.some((s) => s.key === 'load' && /robot/i.test(s.name))) station('unload', 'Unloading (robot, same cycle)', 'unload', [], 'Loading robot → the same robot unloads', 'The loading robot also removes finished parts (one robot, counted once in the BOM).', []);
    else if (automation === 'Fully automatic') station('unload', 'Automatic outfeed (magazine)', 'unload', [], 'Fully automatic without robot or conveyor → magazine outfeed placeholder', 'Outfeed placeholder until handling hardware is selected.', []);
    else station('unload', automation === 'Manual' ? 'Manual unload (operator)' : 'Operator unload', 'unload', [], `${automation} → operator unloads`, 'The operator removes the finished part.', [], { operator: true });
  };

  /* ---- 3. fixture ---- */
  const fixtureStation = () => {
    const needs = !!laserN || (!!process && ['Assembly', 'Dispensing', 'Testing'].includes(process));
    if (!has(FIXTURE_TYPES) && !needs) return;
    const fx = takeAll('fixture');
    const cyl = takeAll(new Set(['cylinder', 'valve']));
    const vac = takeAll('vacuum_generator');
    const rot = takeAll('rotary_stage');
    place('fixture', 'Fixture', fx);
    place('fixture', 'Clamp cylinder', cyl);
    place('fixture', 'Vacuum generator', vac);
    place('fixture', 'Rotary stage', rot);
    if (!fx.length) notes.push({ kind: 'gap', text: 'The part must be located and held for the process — no fixture is selected.' });
    const ev = [...fx, ...cyl, ...vac, ...rot];
    station('fixture', rot.length ? 'Fixture (rotary)' : vac.length ? 'Fixture (vacuum)' : 'Fixture / clamp', 'fixture', [slot('Fixture', 'fixture'), slot('Clamp cylinder', 'cylinder', false)], fx.length ? 'Fixture components selected → locate-and-clamp station' : 'Laser / joining process → a fixture station is required', fx.length ? `${models(ev)} locate${ev.length === 1 ? 's' : ''} and hold${ev.length === 1 ? 's' : ''} the part.` : 'Repeatable part position is a precondition for the process; the fixture slot is open.', ev);
  };

  /* ---- 4. vision: alignment and inspection from the cameras available ---- */
  let alignP: P[] = [];
  let inspP: P[] = [];
  const camsN = count('camera');
  const wantInspect = input.inspect === 'yes' || (input.inspect !== 'no' && !!process && INSPECT_PROCESSES.has(process));
  const wantAlign = !!process && ALIGN_PROCESSES.has(process);
  if (camsN >= 2) {
    const cams = takeAll('camera');
    if (input.inspect === 'no') alignP = cams;
    else if (!wantAlign && process === 'Inspection') inspP = cams;
    else [alignP, inspP] = [cams.slice(0, 1), cams.slice(1)];
  } else if (camsN === 1) {
    const cam = take('camera');
    if (wantAlign && input.inspect !== 'yes') {
      alignP = cam;
      if (wantInspect) notes.push({ kind: 'info', text: `One camera: used for alignment because ${process?.toLowerCase()} needs the part position — add a second camera for inline inspection.` });
    } else if (input.inspect !== 'no') {
      inspP = cam;
      if (wantAlign) notes.push({ kind: 'info', text: 'One camera: used for inspection as requested — add a second camera for alignment.' });
    } else alignP = cam;
  } else if (wantAlign || wantInspect) {
    notes.push({ kind: 'gap', text: `No camera selected — ${[wantAlign ? 'alignment' : '', wantInspect ? 'inline inspection' : ''].filter(Boolean).join(' and ')} ${wantAlign && wantInspect ? 'are' : 'is'} not possible; add a camera to get ${wantAlign && wantInspect ? 'those stations' : 'that station'}.` });
  }
  const lenses = takeAll(new Set(['vision_lens', 'telecentric_lens']));
  const lights = takeAll('lighting');
  // measurement optics and controlled light go to inspection first, then alignment
  const tele = lenses.filter((p) => p.product_type === 'telecentric_lens');
  const plain = lenses.filter((p) => p.product_type !== 'telecentric_lens');
  const inspLens = inspP.length ? [...tele, ...plain].slice(0, inspP.length) : [];
  const alignLens = alignP.length ? lenses.filter((p) => !inspLens.includes(p)).slice(0, alignP.length) : [];
  const inspLight = inspP.length ? lights.slice(0, inspP.length) : [];
  const alignLight = alignP.length ? lights.filter((p) => !inspLight.includes(p)).slice(0, alignP.length) : [];
  const spareVision = [...lenses.filter((p) => !inspLens.includes(p) && !alignLens.includes(p)), ...lights.filter((p) => !inspLight.includes(p) && !alignLight.includes(p))];
  const visionSlots = [slot('Camera', 'camera'), slot('Lens', 'vision_lens'), slot('Lighting', 'lighting', false)];
  const alignStation = () => {
    if (!alignP.length) return;
    place('align', 'Camera', alignP);
    place('align', 'Lens', alignLens);
    place('align', 'Lighting', alignLight);
    station('align', 'Vision alignment', 'align', visionSlots, wantAlign ? `${process} needs the part position → alignment station` : 'Camera without an inspection task → part location', `${models(alignP)} finds the part / fiducials so the process is placed on the part, not on the nominal position.`, [...alignP, ...alignLens, ...alignLight]);
  };
  const inspectStation = () => {
    if (!inspP.length) return;
    place('inspect', 'Camera', inspP);
    place('inspect', 'Lens', inspLens);
    place('inspect', 'Lighting', inspLight);
    station('inspect', process === 'Marking' || process === 'Engraving' ? 'Mark verification' : 'Inspection', 'inspect', visionSlots, input.inspect === 'yes' ? 'Inspection requested + camera → inspection station' : `${process ?? 'Process'} result is verified inline when a camera is available`, `${models(inspP)} checks the result${tele.length && inspLens.some((p) => p.product_type === 'telecentric_lens') ? ' through a telecentric lens (measurement)' : ''} before the part leaves.`, [...inspP, ...inspLens, ...inspLight]);
  };
  const sortStation = () => {
    if (!inspP.length || automation === 'Manual') return;
    station('sort', 'OK / NG sorting', 'sort', [], 'Inspection on an automatic machine → reject path', 'Parts that fail inspection must be separated automatically, so an NG diverter follows the inspection.', inspP);
  };

  /* ---- order of the flow ---- */
  loadStation();
  fixtureStation();
  alignStation();
  if (processStation) processStation();
  inspectStation();
  sortStation();
  unloadStation();

  /* ---- 5. everything else is machine-level (controls, safety, electrical, spare items) ---- */
  const machineLevel: string[] = [];
  const orphans = new Map<string, P[]>();
  const hasStation = (k: string) => stations.some((x) => x.key === k);
  const laserHead = stations.find((x) => x.key === 'laser')?.name.includes('(head)') ?? false;
  for (const u of units) {
    if (u.used) continue;
    u.used = true;
    place('_machine', machineRole(u.part.product_type), [u.part]);
    machineLevel.push(u.part.id);
    const t = u.part.product_type;
    const why = ['galvo', 'f_theta', 'beam_expander', 'galvo_controller'].includes(t) ? (!hasStation('laser') ? 'scanner optics without a laser source' : laserHead ? 'scanner optics not used by the head delivery' : 'more scanner optics than parallel heads') : ['gripper', 'end_effector', 'robot_controller'].includes(t) ? 'robot tooling without a robot' : t === 'robot' ? 'a second robot with no task' : null;
    if (why) (orphans.get(why) ?? orphans.set(why, []).get(why)!).push(u.part);
  }
  if (spareVision.length) orphans.set(camsN ? 'vision optics beyond the cameras available' : 'vision optics without a camera', spareVision);
  for (const [why, ps] of orphans) notes.push({ kind: 'info', text: `Not used — ${why}: ${models(ps)}. Remove ${ps.length > 1 ? 'them' : 'it'} or add what ${ps.length > 1 ? 'they need' : 'it needs'}.` });
  for (const p of spareVision) if (!machineLevel.includes(p.id)) {
    place('_machine', machineRole(p.product_type), [p]);
    machineLevel.push(p.id);
  }
  const ops = stations.filter((s) => s.operator);
  const guard = input.pool.find((x) => ['light_curtain', 'safety_scanner'].includes(x.part.product_type));
  if (ops.length && guard) notes.push({ kind: 'info', text: `${guard.part.model_number} guards the operator ${ops.map((s) => s.name.toLowerCase()).join(' / ')} opening.` });
  else if (ops.length && laserN) notes.push({ kind: 'gap', text: 'Operator loading next to a laser: the loading opening needs an interlocked door or light curtain — none is selected.' });
  if (!input.pool.length) notes.push({ kind: 'gap', text: 'No components selected — add components and the machine is built from them.' });

  return { stations, selections: [...sel.values()], decisions, notes, process, processBasis: input.processBasis ?? (process ? 'stated' : 'unknown'), automation, automationBasis, inline, machineLevel: [...new Set(machineLevel)] };
}

/** Station fields a person enters — kept when the architecture is rebuilt. */
const USER_FIELDS = ['time_s', 'time_basis', 'dist', 'laser', 'reject_rate', 'rework_rate', 'mtbf_min', 'mttr_min', 'changeover_min', 'power_kw', 'footprint_m2', 'capex', 'intervention', 'buffer_after'] as const;

/** Process for the builder: stated → application record → template → unknown. */
export function buildProcess(sim: Simulation, byId: Map<string, AnyRecord>): { process: string | null; basis: Architecture['processBasis'] } {
  if (sim.twin?.build?.process) return { process: sim.twin.build.process, basis: 'stated' };
  const app = sim.application_id ? (byId.get(sim.application_id) as (AnyRecord & { process?: string }) | undefined) : undefined;
  if (app?.process && app.process !== 'Other') return { process: app.process, basis: 'application' };
  const tpl = sim.template_id ? (byId.get(sim.template_id) as (AnyRecord & { process?: string }) | undefined) : undefined;
  if (tpl?.process) return { process: tpl.process, basis: 'template' };
  // the scenario's own process station names it ("Laser marking", "Laser welding (head)")
  for (const st of sim.stations) {
    if (st.kind !== 'laser' && st.kind !== 'process' && st.kind !== 'assembly') continue;
    const hit = Object.entries(LASER_WORD).find(([, w]) => new RegExp(`\\b${w}\\b`, 'i').test(st.name));
    if (hit) return { process: hit[0], basis: 'scenario' };
  }
  return { process: null, basis: 'unknown' };
}

/** Apply the architecture to a scenario: derived stations and selections, entered station data kept. */
export function architectScenario(sim: Simulation & AnyRecord, byId: Map<string, AnyRecord>): { sim: Simulation & AnyRecord; arch: Architecture } {
  const { process, basis } = buildProcess(sim, byId);
  const arch = architect({ pool: poolOf(sim, byId), process, processBasis: basis, automation: sim.twin?.build?.automation ?? null, inspect: sim.twin?.build?.inspect ?? 'auto' });
  const prev = new Map(sim.stations.map((s) => [s.key, s]));
  const stations = arch.stations.map((s) => {
    const old = prev.get(s.key);
    if (!old || old.kind !== s.kind) return s;
    const keep: Partial<Station> = {};
    for (const f of USER_FIELDS) if (old[f] !== undefined) (keep as Record<string, unknown>)[f] = old[f];
    return { ...s, ...keep };
  });
  const sameShape = stations.length === sim.stations.length && stations.every((s, i) => s.key === sim.stations[i].key && s.kind === sim.stations[i].kind);
  const next = {
    ...sim,
    stations,
    selections: arch.selections,
    layout: arch.inline ? ('inline' as const) : sim.layout,
    sequence: sameShape && sim.sequence?.length ? sim.sequence : defaultSequence(stations),
  };
  return { sim: next, arch };
}

/** What makes the architecture change: the component pool and the builder settings. */
export function buildSignature(sim: Simulation): string {
  const b = sim.twin?.build;
  if (b?.mode !== 'components') return '';
  const m = new Map<string, number>();
  for (const s of sim.selections ?? []) m.set(s.part_id, (m.get(s.part_id) ?? 0) + (s.quantity ?? 1));
  return [[...m.entries()].map(([k, v]) => `${k}×${v}`).sort().join(','), b.process ?? '', b.automation ?? '', b.inspect ?? ''].join('|');
}

/**
 * The single place a scenario edit is re-architected: in component mode, any change to the component
 * pool (from the builder, the Components tab or anywhere else) or to the builder settings rebuilds the
 * stations. Template mode is untouched.
 */
export function rebuildIfNeeded(prev: Simulation & AnyRecord, next: Simulation & AnyRecord, byId: Map<string, AnyRecord>): Simulation & AnyRecord {
  if (next.twin?.build?.mode !== 'components') return next;
  if (prev.twin?.build?.mode === 'components' && buildSignature(prev) === buildSignature(next)) return next;
  return architectScenario(next, byId).sim;
}

/** Station-level differences between two scenarios, for the builder's preview. */
export function stationDiff(a: Station[], b: Station[]): { added: Station[]; removed: Station[]; changed: { key: string; from: string; to: string }[] } {
  const ak = new Map(a.map((s) => [s.key, s]));
  const bk = new Map(b.map((s) => [s.key, s]));
  return {
    added: b.filter((s) => !ak.has(s.key)),
    removed: a.filter((s) => !bk.has(s.key)),
    changed: b.filter((s) => ak.has(s.key) && (ak.get(s.key)!.name !== s.name || ak.get(s.key)!.kind !== s.kind || (ak.get(s.key)!.parallel ?? 1) !== (s.parallel ?? 1))).map((s) => ({ key: s.key, from: `${ak.get(s.key)!.name}${(ak.get(s.key)!.parallel ?? 1) > 1 ? ` ×${ak.get(s.key)!.parallel}` : ''}`, to: `${s.name}${(s.parallel ?? 1) > 1 ? ` ×${s.parallel}` : ''}` })),
  };
}

/** A new scenario whose stations the builder decides from a component list (the Copilot's picks, or none yet). */
export function scenarioFromComponents(
  partIds: string[],
  byId: Map<string, AnyRecord>,
  o: { newId: (entity: string) => string; today: string; name?: string; process?: string | null; automation?: Automation; uph?: number | null; templateId?: string; note?: string },
): Simulation & AnyRecord {
  const process = o.process && (BUILD_PROCESSES as readonly string[]).includes(o.process) ? (o.process as TwinBuild['process']) : undefined;
  const seed = {
    id: o.newId('simulation'),
    entity: 'simulation',
    name: o.name ?? 'New machine — built from components',
    scenario_label: 'A',
    config_level: 'Equipment Variant',
    sim_status: 'Draft',
    layout: 'inline',
    stations: [{ key: 'load', name: 'Loading', kind: 'load', time_s: null, parallel: 1, buffer_after: 0 }],
    selections: partIds.filter((id) => byId.has(id)).map((id) => ({ station_key: '_machine', role: productTypeLabel(String((byId.get(id) as AnyRecord & { product_type?: string }).product_type ?? 'component')), part_id: id })),
    targets: { uph: o.uph ?? null },
    shift: { hours_per_shift: 8, shifts_per_day: 2, days_per_year: 300 },
    currency: 'INR',
    twin: { build: { mode: 'components', ...(process ? { process } : {}), ...(o.automation ? { automation: o.automation } : {}) } },
    ...(o.templateId ? { template_id: o.templateId } : {}),
    version: 1,
    data_type: 'USER_CREATED',
    provenance: { verification_status: 'DRAFT', note: o.note ?? `Built from components on ${o.today}: the stations are derived by the machine architect's rules. Shift pattern 8 h × 2 × 300 d is a starting assumption — edit it.` },
    created_at: o.today,
  } as unknown as Simulation & AnyRecord;
  return architectScenario(seed, byId).sim;
}
