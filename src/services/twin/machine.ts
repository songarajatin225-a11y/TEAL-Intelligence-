import type { AnyRecord } from '../../domain';
import type { Part, Simulation, StationKind } from '../../domain/engineering';
import type { SpecDefs } from '../eng/specs';
import type { CostResult } from '../sim/bom';
import type { Resolved, ResolvedStation } from '../sim/model';
import type { PickPlace } from './kinematics';
import { type AxisModel, type PlannedMove, scenarioMotion, specIn } from './motion';

/*
 * MACHINE GENERATOR (3D master prompt §8–§13, §118–§120). Turns a scenario (stations + selected
 * components + twin inputs) into a conceptual engineering scene graph. Units are millimetres,
 * Y up, X = material-flow direction, +Z = operator side.
 *
 * The model is a REPRESENTATION of the scenario (§176). Every object carries the engineering entity it
 * stands for; nothing here is manufacturing geometry — it is a CONCEPTUAL 3D MODEL (§12, §132).
 */

export const TWIN_MODEL_VERSION = '3d-1.0';

export const LAYERS = ['Mechanical', 'Electrical', 'Laser', 'Vision', 'Motion', 'Pneumatic', 'Controls', 'Safety', 'Software', 'Material'] as const;
export type Layer = (typeof LAYERS)[number];

/** §119 component registry keys — each maps to a procedural generator in the 3D layer. */
export type GenKind =
  | 'frame'
  | 'table'
  | 'enclosure'
  | 'door'
  | 'conveyor'
  | 'buffer'
  | 'fixture'
  | 'xy_stage'
  | 'z_column'
  | 'laser_source'
  | 'fiber'
  | 'beam_expander'
  | 'galvo'
  | 'f_theta'
  | 'laser_head'
  | 'camera'
  | 'light'
  | 'cabinet'
  | 'hmi'
  | 'estop'
  | 'tower'
  | 'sensor'
  | 'robot'
  | 'bin'
  | 'chiller'
  | 'fume'
  | 'collimator'
  | 'z_slide'
  | 'nozzle'
  | 'chain'
  | 'operator'
  | 'frl'
  | 'valve'
  | 'bridge'
  | 'tool'
  | 'test_head'
  | 'pusher'
  | 'magazine'
  | 'gantry_pp'
  | 'tray'
  | 'bench'
  | 'generic'
  | 'station'
  | 'group';

export interface Machine3DObject {
  id: string;
  name: string;
  kind: GenKind;
  layer: Layer;
  /** 'machine' | 'system' | 'subsystem' | 'component' — the BOM level it stands for (§50) */
  level: 'machine' | 'system' | 'subsystem' | 'component';
  parentId: string | null;
  stationKey?: string;
  role?: string;
  partId?: string;
  /** centre of the bottom face, mm */
  position: [number, number, number];
  /** width (X) × height (Y) × depth (Z), mm */
  size: [number, number, number];
  rotationY?: number;
  /** axis keys that carry this object (the object moves with them) */
  carriedBy?: string[];
  collision: boolean;
  params: Record<string, number | string | boolean | null>;
  /** exploded-view offset direction (unit-less, scaled by the explode factor) */
  explode: [number, number, number];
}

export interface VisionFov {
  stationKey: string;
  cameraId: string;
  /** field of view at the working distance, mm (null when an input is missing) */
  fovX: number | null;
  fovY: number | null;
  wd: number | null;
  target: { x: number; y: number } | null;
  basis: string;
  missing: string[];
}

export interface LaserPath {
  stationKey: string;
  sourceId?: string;
  expanderId?: string;
  galvoId?: string;
  fthetaId?: string;
  /** scan field side, mm (from the f-theta specification) */
  field: number | null;
  wd: number | null;
  wavelength: number | null;
  /** beam path polyline, mm */
  points: [number, number, number][];
  /** processing point on the part surface (field centre), mm */
  focus: [number, number, number];
  process: string;
  /** galvo scanner (beam steered by mirrors) or a processing head moved over the seam by a gantry */
  mode: 'galvo' | 'head';
  headId?: string;
}

/** A robot or gantry that moves parts / components during its station's time (§33, §65). */
export interface Handler {
  objectId: string;
  stationKey: string;
  kind: 'robot' | 'gantry';
  pp: PickPlace;
  /** 'part' = the workpiece travels with the gripper; 'component' = a component is placed onto the part */
  carries: 'part' | 'component';
  /** SCARA link lengths (robot) */
  L1?: number;
  L2?: number;
  reachable: boolean;
}

export interface SafetyZone {
  key: string;
  name: string;
  type: 'operator' | 'robot' | 'laser' | 'maintenance' | 'restricted';
  enabled: boolean;
  /** box: centre-bottom + size, mm */
  position: [number, number, number];
  size: [number, number, number];
  rule: string;
}

export interface Route {
  id: string;
  kind: 'cable' | 'pneumatic' | 'cooling' | 'fiber' | 'fume';
  from: string;
  to: string;
  points: [number, number, number][];
}

export interface IoPoint {
  tag: string;
  kind: 'DI' | 'DO';
  name: string;
  device: string;
  objectId?: string;
  step: string;
}

export interface MachineModel {
  version: string;
  label: 'CONCEPTUAL 3D MODEL';
  objects: Machine3DObject[];
  byId: Map<string, Machine3DObject>;
  axes: AxisModel[];
  plan: PlannedMove[];
  lasers: LaserPath[];
  vision: VisionFov[];
  zones: SafetyZone[];
  routes: Route[];
  io: IoPoint[];
  /** overall bounding box, mm */
  bounds: { min: [number, number, number]; max: [number, number, number] };
  dims: { width: number; depth: number; height: number };
  tableTop: number;
  /** per-station anchor (where the part sits while that station works on it), mm */
  anchors: Record<string, [number, number, number]>;
  /** robots / gantries per station */
  handlers: Record<string, Handler>;
  /** part carried on axes (sequential machine) or moved between anchors (inline) */
  carrier: 'axes' | 'flow';
  workpiece: { template: string; length: number; width: number; thickness: number; material: string | null; basis: string };
  processArea: { x: number; y: number } | null;
  /** station key → kind (drives mechanism animation: clamps, door) */
  stationKinds: Record<string, StationKind>;
  notes: string[];
}

const LAYER_OF: Partial<Record<string, Layer>> = {
  laser_source: 'Laser',
  beam_expander: 'Laser',
  galvo: 'Laser',
  galvo_controller: 'Laser',
  f_theta: 'Laser',
  laser_head: 'Laser',
  chiller: 'Laser',
  fume_extraction: 'Safety',
  camera: 'Vision',
  vision_lens: 'Vision',
  telecentric_lens: 'Vision',
  lighting: 'Vision',
  vision_controller: 'Vision',
  linear_stage: 'Motion',
  servo_motor: 'Motion',
  servo_drive: 'Electrical',
  plc: 'Controls',
  safety_plc: 'Safety',
  hmi: 'Controls',
  ipc: 'Controls',
  light_curtain: 'Safety',
  door_switch: 'Safety',
  robot: 'Motion',
  gripper: 'Motion',
  conveyor: 'Mechanical',
  fixture: 'Mechanical',
  enclosure: 'Safety',
  smps: 'Electrical',
};

const GEN_OF: Partial<Record<string, GenKind>> = {
  laser_source: 'laser_source',
  beam_expander: 'beam_expander',
  galvo: 'galvo',
  f_theta: 'f_theta',
  laser_head: 'laser_head',
  camera: 'camera',
  lighting: 'light',
  vision_lens: 'generic',
  telecentric_lens: 'generic',
  chiller: 'chiller',
  fume_extraction: 'fume',
  robot: 'robot',
  hmi: 'hmi',
  conveyor: 'conveyor',
  fixture: 'fixture',
  light_curtain: 'sensor',
  door_switch: 'sensor',
};

/** default workpiece per template when a scenario gives none (dimensions shown as ASSUMPTION) */
const WORKPIECE_DEFAULTS: Record<string, [number, number, number]> = { pcb: [160, 100, 1.6], plate: [100, 60, 2], battery_tab: [120, 40, 0.3], battery_can: [70, 70, 21], wafer: [300, 300, 0.775], metal_part: [80, 50, 5], sheet: [300, 200, 2], tube: [300, 40, 40], foil_web: [300, 120, 0.2], glass: [150, 80, 0.7] };

/** Visual placeholder part from the scenario name when no workpiece is entered (first match wins). */
const WORKPIECE_BY_NAME: [RegExp, string][] = [
  [/pcb|board|depanel/i, 'pcb'],
  [/wafer|semi/i, 'wafer'],
  [/tube|profile|stent|hypotube/i, 'tube'],
  [/sheet|flatbed/i, 'sheet'],
  [/electrode|notch|foil|web\b/i, 'foil_web'],
  [/glass|sapphire|display/i, 'glass'],
  [/battery|tab/i, 'battery_tab'],
];

/** clamp jaws stand above the fixture plate (conceptual) */
const CLAMP_H = 25;

const CELL: Record<StationKind, number> = { load: 700, buffer: 600, fixture: 500, align: 450, vision: 450, motion: 500, process: 700, laser: 900, inspect: 450, sort: 500, unload: 700, transfer: 500, assembly: 700, test: 600, manual: 800 };

interface Ctx {
  sim: Simulation;
  byId: Map<string, AnyRecord>;
  defs: SpecDefs;
  objs: Machine3DObject[];
}

function add(c: Ctx, o: Omit<Machine3DObject, 'collision' | 'params' | 'explode' | 'level'> & Partial<Pick<Machine3DObject, 'collision' | 'params' | 'explode' | 'level'>>) {
  const ov = c.sim.twin?.overrides?.[o.id];
  const pos: [number, number, number] = [ov?.x_mm ?? o.position[0], o.position[1], ov?.z_mm ?? o.position[2]];
  const obj: Machine3DObject = { collision: true, params: {}, explode: [0, 0, 0], level: 'component', ...o, position: pos };
  c.objs.push(obj);
  return obj;
}

const partOf = (rs: ResolvedStation, type: string) => rs.parts.find((p) => p.part.product_type === type);
const partName = (p?: { part: Part & AnyRecord }) => (p ? `${p.part.model_number}` : undefined);

/** §31 camera field of view: sensor size from pixel size × resolution (or diagonal), lens focal length / telecentric magnification, working distance. */
export function cameraFov(rs: ResolvedStation, sim: Simulation, defs: SpecDefs): Omit<VisionFov, 'stationKey' | 'cameraId'> {
  const cam = partOf(rs, 'camera')?.part;
  const lens = partOf(rs, 'vision_lens')?.part;
  const tele = partOf(rs, 'telecentric_lens')?.part;
  const v = sim.twin?.vision?.[rs.station.key];
  const missing: string[] = [];
  const px = specIn(cam, 'pixel_size', 'mm', defs);
  const rx = specIn(cam, 'resolution_x', 'px', defs);
  const ry = specIn(cam, 'resolution_y', 'px', defs);
  let sw: number | null = px != null && rx != null ? px * rx : null;
  let sh: number | null = px != null && ry != null ? px * ry : null;
  if (sw == null) {
    const diag = specIn(cam, 'sensor_diagonal', 'mm', defs);
    if (diag != null) {
      sw = diag * 0.8;
      sh = diag * 0.6;
    }
  }
  if (!cam) missing.push('camera not selected');
  else if (sw == null) missing.push(`${cam.model_number}: pixel size × resolution (or sensor diagonal)`);
  const target = v?.target_x_mm && v?.target_y_mm ? { x: v.target_x_mm, y: v.target_y_mm } : null;
  if (tele) {
    const mag = specIn(tele, 'magnification', '', defs) ?? readNum(tele, 'magnification');
    const wd = specIn(tele, 'working_distance', 'mm', defs);
    if (mag == null) missing.push(`${tele.model_number}: magnification`);
    return { fovX: sw != null && mag ? sw / mag : null, fovY: sh != null && mag ? sh / mag : null, wd: v?.wd_mm ?? wd, target, basis: 'sensor ÷ magnification (telecentric)', missing };
  }
  const f = specIn(lens, 'focal_length', 'mm', defs);
  const wd = v?.wd_mm ?? null;
  if (!lens) missing.push('lens not selected');
  else if (f == null) missing.push(`${lens.model_number}: focal length`);
  if (wd == null) missing.push(`${rs.station.name}: camera working distance`);
  const k = f != null && wd != null ? wd / f : null;
  return { fovX: sw != null && k != null ? sw * k : null, fovY: sh != null && k != null ? sh * k : null, wd, target, basis: 'thin-lens estimate: sensor × WD ÷ f', missing };
}
/**
 * Outer size from the component's datasheet "dimensions" (L × W × H mm), as [x, y, z] = [L, H, W].
 * null when the datasheet does not state it — the drawing then uses a placeholder size.
 */
export function datasheetSize(p: Pick<Part, 'specs'> | undefined): [number, number, number] | null {
  const s = (p?.specs ?? []).find((x) => x.spec === 'dimensions');
  const t = String((s as { text?: string } | undefined)?.text ?? s?.original ?? '');
  const m = /(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)\s*(mm|cm|m)?\b/i.exec(t);
  if (!m) return null;
  const k = m[4]?.toLowerCase() === 'cm' ? 10 : m[4]?.toLowerCase() === 'm' ? 1000 : 1;
  const [l, w, h] = [Number(m[1]) * k, Number(m[2]) * k, Number(m[3]) * k];
  if (![l, w, h].every((v) => v >= 5 && v <= 5000)) return null;
  return [l, h, w];
}
/** Component kinds drawn at their datasheet size when it is known. */
const SIZED_BY_DATASHEET = new Set<GenKind>(['laser_source', 'chiller', 'fume', 'camera', 'laser_head']);

function readNum(p: Pick<Part, 'specs'>, key: string) {
  const s = (p.specs ?? []).find((x) => x.spec === key);
  return s?.value ?? null;
}

/** Lateral pitch between parallel lanes / nests of one station (inline lines), mm. */
export const LANE_PITCH = 220;
/** Share of the conveyor depth the NG diverter rod travels (the part motion uses the same value). */
export const PUSH_SHARE = 0.6;
/** Z offset of lane k of n (0 when the station has a single server). */
export const laneZ = (k: number, n: number) => (n > 1 ? (k - (n - 1) / 2) * LANE_PITCH : 0);

export function buildMachine(res: Resolved, byId: Map<string, AnyRecord>, defs: SpecDefs, bom?: CostResult): MachineModel {
  const sim = res.sim;
  const c: Ctx = { sim, byId, defs, objs: [] };
  const { axes, plan } = scenarioMotion(sim, byId, defs);
  const notes: string[] = [];
  const wpIn = sim.twin?.workpiece;
  const tmpl = wpIn?.template ?? WORKPIECE_BY_NAME.find(([re]) => re.test(sim.name))?.[1] ?? 'metal_part';
  const [wl, ww, wt] = wpIn ? [wpIn.length_mm, wpIn.width_mm, wpIn.thickness_mm] : WORKPIECE_DEFAULTS[tmpl];
  if (!wpIn) notes.push(`Workpiece dimensions are a visual placeholder for “${tmpl.replace('_', ' ')}” — not entered for this scenario.`);
  const carrier: MachineModel['carrier'] = res.layout === 'sequential' && axes.length ? 'axes' : 'flow';
  const TABLE = 900;
  const fixH = 30;
  const hasY = axes.some((a) => /y/i.test(a.key));
  // the part rides on fixture → (Y carriage) → X carriage in the sequential machine
  const partTop = carrier === 'axes' ? TABLE + (hasY ? 110 : 60) + fixH + wt : TABLE + 60 + wt;
  const anchors: Record<string, [number, number, number]> = {};
  const handlers: Record<string, Handler> = {};
  const extraZones: SafetyZone[] = [];
  const lasers: LaserPath[] = [];
  const vision: VisionFov[] = [];
  const io: IoPoint[] = [];
  const routes: Route[] = [];
  let di = 0;
  let dq = 0;
  const DI = (name: string, device: string, step: string, objectId?: string) => io.push({ tag: `%I${Math.floor(di / 8)}.${di++ % 8}`, kind: 'DI', name, device, step, objectId });
  const DO = (name: string, device: string, step: string, objectId?: string) => io.push({ tag: `%Q${Math.floor(dq / 8)}.${dq++ % 8}`, kind: 'DO', name, device, step, objectId });

  add(c, { id: 'machine', name: sim.name, kind: 'group', layer: 'Mechanical', level: 'machine', parentId: null, position: [0, 0, 0], size: [0, 0, 0], collision: false });

  /* ---------- station x positions ---------- */
  const xs: number[] = [];
  if (carrier === 'axes') {
    const xAxis = axes.find((a) => /x/i.test(a.key)) ?? axes[0];
    const home = xAxis?.home ?? 0;
    for (const st of sim.stations) {
      const mv = [...plan].reverse().find((m) => m.stationKey === st.key);
      const x = mv && xAxis ? mv.to[xAxis.key] ?? home : home;
      xs.push(x);
    }
  } else {
    let x = 0;
    for (const st of sim.stations) {
      const w = CELL[st.kind] * Math.max(1, res.layout === 'sequential' ? 1 : st.parallel ?? 1) ** 0.5;
      xs.push(x + w / 2);
      x += w;
    }
  }
  const minX = Math.min(...xs) - (carrier === 'axes' ? 250 : CELL[sim.stations[0].kind] / 2);
  const maxX = Math.max(...xs) + (carrier === 'axes' ? 250 : CELL[sim.stations[sim.stations.length - 1].kind] / 2);
  const W = maxX - minX;
  const cx = (minX + maxX) / 2;
  const D = carrier === 'axes' ? 1100 : 800;
  const backZ = -D / 2 + 50;

  /* ---------- frame + table ---------- */
  add(c, { id: 'sys-frame', name: 'Frame & enclosure', kind: 'group', layer: 'Mechanical', level: 'system', parentId: 'machine', position: [cx, 0, 0], size: [0, 0, 0], collision: false });
  add(c, { id: 'frame', name: 'Base frame', kind: 'frame', layer: 'Mechanical', level: 'subsystem', parentId: 'sys-frame', position: [cx, 0, 0], size: [W, TABLE - 20, D], params: { profile: 45 }, explode: [0, -1, 0], collision: false });
  add(c, { id: 'table', name: carrier === 'axes' ? 'Granite / machine table' : 'Line table', kind: 'table', layer: 'Mechanical', level: 'subsystem', parentId: 'sys-frame', position: [cx, TABLE - 20, 0], size: [W, 20, D], explode: [0, -0.5, 0] });

  const hasLaser = sim.stations.some((s) => s.kind === 'laser');
  const encPart = res.machineParts.find((p) => p.part.product_type === 'enclosure');
  if (hasLaser) {
    const encW = carrier === 'axes' ? W : Math.max(...sim.stations.filter((s) => s.kind === 'laser').map(() => CELL.laser)) * 1.0;
    const lx = carrier === 'axes' ? cx : xs[sim.stations.findIndex((s) => s.kind === 'laser')];
    add(c, { id: 'enclosure', name: 'Class-1 laser enclosure', kind: 'enclosure', layer: 'Safety', level: 'subsystem', parentId: 'sys-frame', partId: encPart?.part.id, role: encPart?.role, position: [lx, TABLE, 0], size: [encW, 850, D], explode: [0, 1.2, 0], collision: false, params: { window: true } });
    add(c, { id: 'door', name: 'Safety door (interlocked)', kind: 'door', layer: 'Safety', level: 'component', parentId: 'enclosure', position: [lx - (carrier === 'axes' ? W / 4 : 0), TABLE, D / 2], size: [carrier === 'axes' ? W / 2 - 40 : encW * 0.7, 520, 12], explode: [0, 0, 1.5], collision: false, params: { open: 0 } });
    const ds = res.machineParts.find((p) => p.part.product_type === 'door_switch');
    add(c, { id: 'door-switch', name: 'Door interlock switch', kind: 'sensor', layer: 'Safety', level: 'component', parentId: 'enclosure', partId: ds?.part.id, role: ds?.role, position: [lx - (carrier === 'axes' ? W / 4 : 0) + (carrier === 'axes' ? W / 4 : encW * 0.35) - 30, TABLE + 480, D / 2 + 10], size: [40, 30, 20], explode: [0, 0, 2] });
    DI('Door closed', ds ? `${ds.part.model_number} (door interlock)` : 'Door interlock', 'safety', 'door-switch');
  }

  /* ---------- stations ---------- */
  sim.stations.forEach((st, i) => {
    const rs = res.stations[i];
    const x = xs[i];
    const sid = `st-${st.key}`;
    const par = res.layout === 'sequential' ? 1 : st.parallel ?? 1;
    add(c, { id: sid, name: st.name, kind: 'station', layer: 'Mechanical', level: 'system', parentId: 'machine', stationKey: st.key, position: [x, TABLE, 0], size: [carrier === 'axes' ? 200 : CELL[st.kind], 0, D], collision: false, explode: [0, 0.2, 0] });
    anchors[st.key] = [x, partTop, carrier === 'axes' ? 0 : 0];
    const selected = (type: string) => partOf(rs, type);
    const partIn = (type: string, id: string, name: string, kind: GenKind, pos: [number, number, number], size: [number, number, number], extra: Partial<Machine3DObject> = {}) => {
      const p = selected(type);
      const ds = SIZED_BY_DATASHEET.has(kind) ? datasheetSize(p?.part) : null;
      return add(c, { id, name: p ? `${name} — ${partName(p)}` : `${name} (not selected)`, kind, layer: LAYER_OF[type] ?? 'Mechanical', parentId: sid, stationKey: st.key, partId: p?.part.id, role: p?.role, position: pos, size: ds ?? size, ...extra, params: { ...(extra.params ?? {}), sizeBasis: ds ? 'datasheet' : 'placeholder' } });
    };
    // flow hardware (inline) — conveyor segment per station
    if (carrier === 'flow') {
      const cv = selected('conveyor');
      add(c, { id: `${sid}-conveyor`, name: cv ? `Conveyor — ${partName(cv)}` : st.kind === 'buffer' || st.buffer_after ? 'Conveyor / buffer segment' : 'Transfer conveyor', kind: st.buffer_after ? 'buffer' : 'conveyor', layer: 'Mechanical', parentId: sid, stationKey: st.key, partId: cv?.part.id, role: cv?.role, position: [x, TABLE, 0], size: [CELL[st.kind] - 10, 60, Math.max(ww + 60, 200) + (par - 1) * LANE_PITCH], params: { slots: st.buffer_after ?? 0, lanes: par }, collision: false, explode: [0, -0.3, 0] });
    }
    if (st.kind === 'load' || st.kind === 'unload') {
      if (carrier === 'axes') add(c, { id: `${sid}-zone`, name: `${st.name} position`, kind: 'generic', layer: 'Material', parentId: sid, stationKey: st.key, position: [x, TABLE, 250], size: [Math.max(wl + 40, 120), 4, Math.max(ww + 40, 80)], collision: false, params: { marker: true } });
      DI(st.kind === 'load' ? 'Part present' : 'Part removed', 'Part-present sensor', st.kind === 'load' ? 'present' : 'unload', `${sid}-sensor`);
      add(c, { id: `${sid}-sensor`, name: 'Part-present sensor', kind: 'sensor', layer: 'Controls', parentId: sid, stationKey: st.key, position: [x + Math.max(wl, 80) / 2 + 30, TABLE, carrier === 'axes' ? 250 : Math.max(ww + 60, 200) / 2 + 20], size: [30, 60, 30] });
    }
    if (st.kind === 'fixture' || (carrier === 'axes' && st.kind === 'load')) {
      /* fixture rides on the XY stage in the sequential machine; built once below */
    }
    if (st.kind === 'fixture' && carrier === 'flow') {
      partIn('fixture', `${sid}-fixture`, 'Fixture', 'fixture', [x, TABLE + 60, 0], [Math.max(wl + 40, 140), fixH + CLAMP_H, Math.max(ww + 40, 100)], { params: { clamps: 2, plateH: fixH, clampH: CLAMP_H } });
      DO('Clamp close', 'Clamp valve', 'clamp', `${sid}-fixture`);
      DI('Clamp closed', 'Clamp reed switch', 'clamp', `${sid}-fixture`);
      anchors[st.key] = [x, TABLE + 60 + fixH + wt, 0];
    }
    if (st.kind === 'align' || st.kind === 'vision' || st.kind === 'inspect') {
      const fov = cameraFov(rs, sim, defs);
      const wd = fov.wd ?? 200;
      const baseY = partTop;
      // working distance is lens front → part surface: lens just above WD, camera body above the lens
      const lensLen = selected('telecentric_lens') ? 140 : 60;
      const cam = partIn('camera', `${sid}-camera`, st.kind === 'inspect' ? 'Inspection camera' : 'Alignment camera', 'camera', [x, baseY + wd + lensLen, 0], [60, 80, 60], { params: { wd, placeholderWd: fov.wd == null } });
      partIn(selected('telecentric_lens') ? 'telecentric_lens' : 'vision_lens', `${sid}-lens`, 'Lens', 'generic', [x, baseY + wd, 0], [40, lensLen, 40], { params: { shape: 'lens', telecentric: !!selected('telecentric_lens') } });
      if (selected('lighting') && wd > 60) partIn('lighting', `${sid}-light`, 'Lighting', 'light', [x, baseY + Math.min(wd * 0.5, 90), 0], [110, 16, 110], { collision: wd * 0.5 > 40 });
      add(c, { id: `${sid}-bracket`, name: 'Camera bracket', kind: 'z_column', layer: 'Mechanical', parentId: sid, stationKey: st.key, position: [x, TABLE, backZ], size: [50, baseY + wd + lensLen + 90 - TABLE, 50], collision: true, explode: [0, 0, -1] });
      add(c, { id: `${sid}-arm`, name: 'Camera arm', kind: 'generic', layer: 'Mechanical', parentId: sid, stationKey: st.key, position: [x, baseY + wd + lensLen + 40, (backZ + 0) / 2], size: [30, 30, Math.abs(backZ)], collision: false, explode: [0, 0, -1] });
      vision.push({ stationKey: st.key, cameraId: cam.id, ...fov });
      DO('Camera trigger', cam.name, st.kind === 'inspect' ? 'inspect' : 'vision', cam.id);
      DI('Result OK', cam.name, st.kind === 'inspect' ? 'inspect' : 'vision', cam.id);
      routes.push({ id: `cable-${cam.id}`, kind: 'cable', from: 'cabinet', to: cam.id, points: [] });
    }
    if (st.kind === 'laser') {
      const src = selected('laser_source');
      const ft = selected('f_theta');
      const head = selected('laser_head');
      // a processing head without a galvo is moved over the seam by a gantry (welding / cutting / scribing)
      const slotTypes = new Set((st.slots ?? []).map((q) => q.product_type));
      const headMode = (!!head && !selected('galvo')) || (!selected('galvo') && !selected('f_theta') && slotTypes.has('laser_head') && !slotTypes.has('galvo'));
      const field = headMode ? null : specIn(ft?.part, 'scan_field_x', 'mm', defs);
      const wdLens = headMode ? specIn(head?.part, 'focal_length', 'mm', defs) : specIn(ft?.part, 'working_distance', 'mm', defs) ?? specIn(head?.part, 'focal_length', 'mm', defs);
      const wl0 = specIn(src?.part, 'wavelength', 'nm', defs);
      const wd = wdLens ?? 250;
      if (wdLens == null) notes.push(`${st.name}: ${headMode ? 'processing-head focal length' : 'f-theta working distance'} not stated — the head height is drawn with a placeholder.`);
      const surf = partTop;
      const headY = surf + wd;
      const process = /weld/i.test(`${st.name} ${sim.name}`) ? 'welding' : /clean/i.test(`${st.name} ${sim.name}`) ? 'cleaning' : /cut|dic/i.test(`${st.name} ${sim.name}`) ? 'cutting' : /scrib/i.test(`${st.name} ${sim.name}`) ? 'scribing' : /drill/i.test(`${st.name} ${sim.name}`) ? 'drilling' : 'marking';
      for (let k = 0; k < par; k++) {
        const dz = laneZ(k, par);
        const kk = par > 1 ? `-${k + 1}` : '';
        const sId = `${sid}-source${kk}`;
        const colZ = backZ + (par > 1 ? k * 90 : 0);
        partIn('laser_source', sId, 'Laser source', 'laser_source', [x - 60, 120, -D / 2 + 180 + (par > 1 ? k * 20 : 0)], [300, 150, 260], { params: { wavelength: wl0 ?? null }, explode: [0, -1, -1] });
        const focus: [number, number, number] = [x, surf, dz];
        if (headMode) {
          const hId = `${sid}-head${kk}`;
          add(c, { id: `${sid}-gantry${kk}`, name: 'Head gantry (X / Z bridge)', kind: 'bridge', layer: 'Motion', parentId: sid, stationKey: st.key, position: [x, TABLE, dz], size: [Math.max(wl + 200, 360), headY + 260 - TABLE, Math.max(ww + 240, 360)], params: { beam: 'x' }, collision: false, explode: [0, 0.4, 0] });
          partIn('laser_head', hId, 'Processing head', 'laser_head', [x, headY, dz], [110, 180, 110], { params: { stroke: 0 }, collision: false });
          const stage = selected('linear_stage');
          if (stage) add(c, { id: `${sid}-headaxis${kk}`, name: `Head axis — ${stage.part.model_number}`, kind: 'xy_stage', layer: 'Motion', parentId: sid, stationKey: st.key, partId: stage.part.id, role: stage.role, position: [x, headY + 200, dz - Math.max(ww + 240, 360) / 2 + 40], size: [Math.max(wl + 160, 320), 50, 90], params: { axis: 'head' }, collision: false, explode: [0, 0.6, 0] });
          lasers.push({ stationKey: st.key, sourceId: sId, headId: hId, field: null, wd: wdLens, wavelength: wl0, points: [[x, headY + 180, dz], [x, headY, dz], focus], focus, process, mode: 'head' });
          routes.push({ id: `fiber-${sId}`, kind: 'fiber', from: sId, to: hId, points: [] });
          continue;
        }
        const ftId = `${sid}-ftheta${kk}`;
        partIn('f_theta', ftId, 'F-theta lens', 'f_theta', [x, headY, dz], [90, 70, 90], { params: { field: field ?? null } });
        const gId = `${sid}-galvo${kk}`;
        partIn('galvo', gId, 'Galvo scanner', 'galvo', [x, headY + 70, dz], [130, 110, 120]);
        const bId = `${sid}-bex${kk}`;
        if (selected('beam_expander')) partIn('beam_expander', bId, 'Beam expander', 'beam_expander', [x, headY + 105, (colZ + dz) / 2], [45, 45, 160], { collision: false });
        add(c, { id: `${sid}-column${kk}`, name: 'Z column (scan head mount)', kind: 'z_column', layer: 'Mechanical', parentId: sid, stationKey: st.key, position: [x, TABLE, colZ], size: [80, headY + 180 - TABLE, 80], collision: true, explode: [0, 0, -1] });
        add(c, { id: `${sid}-rail${kk}`, name: 'Optical rail', kind: 'generic', layer: 'Laser', parentId: sid, stationKey: st.key, position: [x, headY + 150, (colZ + dz) / 2], size: [60, 20, Math.abs(dz - colZ) + 60], collision: false, explode: [0, 0.5, 0] });
        add(c, { id: `${sid}-collimator${kk}`, name: 'Fibre collimator / isolator (part of the laser source)', kind: 'collimator', layer: 'Laser', parentId: sid, stationKey: st.key, partId: src?.part.id, role: src ? `${src.role} — output optics` : undefined, position: [x, headY + 104, colZ + 70], size: [48, 48, 110], collision: false, explode: [0, 0.6, -0.4] });
        add(c, { id: `${sid}-zslide${kk}`, name: 'Focus (Z) slide', kind: 'z_slide', layer: 'Motion', parentId: sid, stationKey: st.key, position: [x, headY - 60, colZ + 52], size: [100, 300, 26], collision: false, explode: [0, 0, -0.6] });
        lasers.push({
          stationKey: st.key,
          sourceId: sId,
          expanderId: selected('beam_expander') ? bId : undefined,
          galvoId: gId,
          fthetaId: ftId,
          field,
          wd: wdLens,
          wavelength: wl0,
          // collimated beam from the fiber collimator on the column → expander → galvo mirrors → f-theta → part
          points: [
            [x, headY + 128, colZ],
            [x, headY + 128, dz],
            [x, headY, dz],
            focus,
          ],
          focus,
          process,
          mode: 'galvo',
        });
        routes.push({ id: `fiber-${sId}`, kind: 'fiber', from: sId, to: `${sid}-collimator${kk}`, points: [] });
      }
      const fx = selected('fume_extraction');
      if (fx) {
        partIn('fume_extraction', `${sid}-fume`, 'Fume extraction', 'fume', [minX - 280, 0, -D / 2 + 220], [360, 700, 360], { explode: [-1, 0, 0] });
        add(c, { id: `${sid}-nozzle`, name: 'Extraction nozzle', kind: 'nozzle', layer: 'Safety', parentId: sid, stationKey: st.key, position: [x + (headMode ? 180 : 95), surf + 55, -70], size: [44, 34, 70], collision: true, explode: [0.4, 0.3, 0] });
        routes.push({ id: `fume-${sid}`, kind: 'fume', from: `${sid}-nozzle`, to: `${sid}-fume`, points: [] });
      }
      const ch = selected('chiller') ?? res.machineParts.find((p) => p.part.product_type === 'chiller');
      if (ch) {
        const chs = datasheetSize(ch.part);
        add(c, { id: `${sid}-chiller`, name: `Chiller — ${ch.part.model_number}`, kind: 'chiller', layer: 'Laser', parentId: sid, stationKey: st.key, partId: ch.part.id, role: ch.role, position: [minX - 300, 0, D / 2 - 260], size: chs ?? [420, 800, 420], params: { sizeBasis: chs ? 'datasheet' : 'placeholder' }, explode: [-1, 0, 0] });
        routes.push({ id: `cool-${sid}`, kind: 'cooling', from: `${sid}-chiller`, to: `${sid}-source`, points: [] });
      }
      DI('Laser ready', src ? `${src.part.model_number}` : 'Laser source', 'enable', `${sid}-source`);
      DO('Laser enable', src ? `${src.part.model_number}` : 'Laser source', 'enable', `${sid}-source`);
      DO(headMode ? 'Head path start' : 'Scanner job start', headMode ? 'Motion controller' : 'Galvo controller', 'process', headMode ? `${sid}-head` : `${sid}-galvo`);
      DI('Job complete', headMode ? 'Motion controller' : 'Galvo controller', 'process', headMode ? `${sid}-head` : `${sid}-galvo`);
      if (fx) DI('Extraction running', fx.part.model_number, 'enable', `${sid}-fume`);
      anchors[st.key] = [x, surf, 0];
    }
    /* ---------- tooling for handling, assembly, process and test stations (every template kind) ---------- */
    const convD = Math.max(ww + 60, 200) + (par - 1) * LANE_PITCH;
    const cellW = carrier === 'flow' ? CELL[st.kind] : 400;
    const toolKind = (() => {
      const t = `${st.name} ${sim.name}`.toLowerCase();
      if (/dispens|glue|adhesive|pott|seal/.test(t)) return 'dispense';
      if (/screw/.test(t)) return 'screw';
      if (/press|crimp|rivet|insert/.test(t)) return 'press';
      if (/dic|saw/.test(t)) return 'saw';
      if (/pack|box|carton|tape|wrap/.test(t)) return 'pack';
      if (/bond|attach|solder/.test(t)) return 'bond';
      if (/label|print|trace|code/.test(t)) return 'print';
      return 'generic';
    })();
    // parallel servers (inline lines) get one nest + head per lane, each driven by its own server state
    const lanes: [number, string][] = Array.from({ length: par }, (_, k) => [k, par > 1 ? `-${k + 1}` : '']);
    const laneName = (k: number) => (par > 1 ? ` · lane ${k + 1}` : '');
    const laneParam = (k: number): Record<string, number> => (par > 1 ? { server: k } : {});
    const robot = selected('robot');
    const robotSlot = !robot && (st.slots ?? []).some((q) => q.product_type === 'robot');
    const gripper = selected('gripper');
    const makeHandler = (carries: 'part' | 'component', pick: [number, number, number], place: [number, number, number], label: string) => {
      const home: [number, number, number] = [x, partTop + 180, carries === 'part' ? -convD / 2 - 40 : -convD / 2 - 60];
      if (robot || robotSlot) {
        const reach = robot ? specIn(robot.part, 'reach', 'mm', defs) : null;
        const L = (reach ?? 500) / 2;
        const base: [number, number, number] = [x, TABLE, -convD / 2 - Math.min(170, L * 0.55)];
        const oid = `${sid}-robot`;
        add(c, { id: oid, name: robot ? `${label} robot — ${robot.part.model_number}` : `${label} robot (not selected)`, kind: 'robot', layer: 'Motion', parentId: sid, stationKey: st.key, partId: robot?.part.id, role: robot?.role ?? 'Robot', position: base, size: [180, 420, 180], params: { reach: reach ?? null, axes: robot ? specIn(robot.part, 'axes', '', defs) ?? readNum(robot.part, 'axes') : null, L1: L, L2: L, placeholderReach: reach == null }, collision: false, explode: [0, 0, -1] });
        if (reach == null) notes.push(`${st.name}: robot ${robot ? 'reach not stated' : 'not selected'} — arm lengths are a visual placeholder.`);
        const far = (p: [number, number, number]) => Math.hypot(p[0] - base[0], p[2] - base[2]);
        const reachable = far(pick) <= 2 * L && far(place) <= 2 * L;
        handlers[st.key] = { objectId: oid, stationKey: st.key, kind: 'robot', pp: { home, pick, place, clearance: 60 }, carries, L1: L, L2: L, reachable };
        if (gripper && robot) add(c, { id: `${sid}-gripper`, name: `Gripper — ${gripper.part.model_number}`, kind: 'generic', layer: 'Motion', parentId: oid, stationKey: st.key, partId: gripper.part.id, role: gripper.role, position: [base[0], partTop + 400, base[2]], size: [0.1, 0.1, 0.1], collision: false });
        extraZones.push({ key: `robot-${st.key}`, name: `${st.name}: robot reach (conceptual)`, type: 'robot', enabled: true, position: [base[0], TABLE, base[2]], size: [4 * L, 20, 4 * L], rule: `Reach ${reach ?? 'not stated'} mm — conceptual workspace, not a validated envelope` });
      } else {
        const oid = `${sid}-gantry`;
        add(c, { id: oid, name: `${label} gantry (pick & place, conceptual)`, kind: 'gantry_pp', layer: 'Motion', parentId: sid, stationKey: st.key, position: [x, TABLE, 0], size: [Math.max(cellW - 40, 360), partTop + 330 - TABLE, convD + 120], collision: false, explode: [0, 0.5, 0] });
        handlers[st.key] = { objectId: oid, stationKey: st.key, kind: 'gantry', pp: { home: [x, partTop + 200, 0], pick: [pick[0], pick[1], 0], place: [place[0], place[1], 0], clearance: 80 }, carries, reachable: true };
      }
      DO(`${label}: grip`, robot ? `${robot.part.model_number} gripper` : robotSlot ? 'Robot gripper' : 'Gantry gripper', 'process', handlers[st.key].objectId);
      DI(`${label}: gripped`, 'Gripper sensor', 'process', handlers[st.key].objectId);
    };
    if (st.kind === 'transfer') makeHandler('part', [x - cellW / 2 + 70, partTop, 0], [x + cellW / 2 - 70, partTop, 0], 'Transfer');
    if (st.kind === 'assembly' || (st.kind === 'load' && (robot || robotSlot))) {
      if (robot || robotSlot || st.kind === 'load') {
        const trayZ = -convD / 2 - 90;
        add(c, { id: `${sid}-tray`, name: st.kind === 'load' ? 'Part supply tray' : 'Component feeder / tray', kind: 'tray', layer: 'Material', parentId: sid, stationKey: st.key, position: [x + 160, TABLE, trayZ - (robot ? 0 : 0)], size: [180, 40, 140], collision: false });
        makeHandler(st.kind === 'load' ? 'part' : 'component', [x + 160, TABLE + 40, trayZ], [x, partTop, 0], st.kind === 'load' ? 'Load' : 'Assembly');
      } else {
        add(c, { id: `${sid}-bridge`, name: 'Tool bridge', kind: 'bridge', layer: 'Mechanical', parentId: sid, stationKey: st.key, position: [x, TABLE, 0], size: [Math.max(cellW - 120, 260), partTop + 330 - TABLE, convD + 120], collision: false, explode: [0, 0.3, 0] });
        const tk = toolKind === 'generic' ? 'press' : toolKind;
        for (const [k, kk] of lanes) {
          add(c, { id: `${sid}-tool${kk}`, name: `${tk === 'screw' ? 'Screwdriver spindle' : tk === 'press' ? 'Press ram' : tk === 'dispense' ? 'Dispense valve' : 'Assembly tool'}${laneName(k)} (conceptual)`, kind: 'tool', layer: 'Motion', parentId: sid, stationKey: st.key, position: [x, partTop + 50, laneZ(k, par)], size: [80, 230, 80], params: { tool: tk, stroke: 45, ...laneParam(k) }, collision: false, explode: [0, 0.6, 0] });
          DO(`${st.name}${laneName(k)}: tool down`, 'Tool valve / drive', 'process', `${sid}-tool${kk}`);
          DI(`${st.name}${laneName(k)}: tool at work`, 'Tool position sensor', 'process', `${sid}-tool${kk}`);
        }
      }
    }
    if (st.kind === 'process') {
      add(c, { id: `${sid}-bridge`, name: 'Process bridge', kind: 'bridge', layer: 'Mechanical', parentId: sid, stationKey: st.key, position: [x, TABLE, 0], size: [Math.max(cellW - 120, 260), partTop + 330 - TABLE, convD + 120], collision: false, explode: [0, 0.3, 0] });
      for (const [k, kk] of lanes) {
        add(c, { id: `${sid}-tool${kk}`, name: `${toolKind === 'dispense' ? 'Dispense valve' : toolKind === 'saw' ? 'Dicing spindle' : toolKind === 'print' ? 'Print / code head' : toolKind === 'bond' ? 'Bond head' : toolKind === 'pack' ? 'Packing head' : 'Process head'}${laneName(k)} (conceptual)`, kind: 'tool', layer: 'Motion', parentId: sid, stationKey: st.key, position: [x, partTop + 40, laneZ(k, par)], size: [80, 230, 80], params: { tool: toolKind, stroke: toolKind === 'dispense' || toolKind === 'print' ? 25 : 40, traverse: toolKind === 'dispense' || toolKind === 'saw' || toolKind === 'print' ? Math.min(wl, 120) : 0, ...laneParam(k) }, collision: false, explode: [0, 0.6, 0] });
        DO(`${st.name}${laneName(k)}: start`, 'Process controller', 'process', `${sid}-tool${kk}`);
      }
    }
    if (st.kind === 'test') {
      add(c, { id: `${sid}-bridge`, name: 'Test press frame', kind: 'bridge', layer: 'Mechanical', parentId: sid, stationKey: st.key, position: [x, TABLE, 0], size: [Math.max(cellW - 120, 260), partTop + 300 - TABLE, convD + 120], params: { rods: true }, collision: false, explode: [0, 0.3, 0] });
      for (const [k, kk] of lanes) {
        add(c, { id: `${sid}-testhead${kk}`, name: `Test head${laneName(k)} (contact probes, conceptual)`, kind: 'test_head', layer: 'Electrical', parentId: sid, stationKey: st.key, position: [x, partTop + 70, laneZ(k, par)], size: [Math.max(wl + 40, 150), 60, Math.min(Math.max(ww + 40, 110), LANE_PITCH - 20)], params: { stroke: 60, ...laneParam(k) }, collision: false, explode: [0, 0.8, 0] });
        DO(`${st.name}${laneName(k)}: contact`, 'Test press valve', 'process', `${sid}-testhead${kk}`);
        DI(`${st.name}${laneName(k)}: result PASS`, 'Tester', 'process', `${sid}-testhead${kk}`);
      }
    }
    if (st.kind === 'manual' || (carrier === 'flow' && (st.kind === 'load' || st.kind === 'unload') && st.operator && !robot)) {
      add(c, { id: `${sid}-bench`, name: 'Operator bench', kind: 'bench', layer: 'Mechanical', parentId: sid, stationKey: st.key, position: [x, 0, convD / 2 + 330], size: [Math.max(cellW - 80, 400), 850, 500], collision: false, explode: [0, 0, 1] });
      if (st.kind === 'manual') add(c, { id: `${sid}-operator`, name: 'Operator (conceptual)', kind: 'operator', layer: 'Safety', parentId: sid, stationKey: st.key, position: [x, 0, convD / 2 + 780], size: [460, 1700, 280], collision: false });
    }
    if (carrier === 'flow' && (st.kind === 'load' || st.kind === 'unload') && !st.operator && !robot)
      add(c, { id: `${sid}-magazine`, name: st.kind === 'load' ? 'Infeed magazine / stack' : 'Outfeed magazine / stack', kind: 'magazine', layer: 'Material', parentId: sid, stationKey: st.key, position: [st.kind === 'load' ? x - cellW / 2 + 90 : x + cellW / 2 - 90, TABLE + 60, 0], size: [Math.max(wl + 30, 120), 260, Math.max(ww + 30, 90)], params: { role: st.kind === 'load' ? 'in' : 'out' }, collision: false, explode: [0, 0.4, 0] });
    if (st.kind === 'motion') add(c, { id: `${sid}-axis`, name: 'Linear axis module', kind: 'xy_stage', layer: 'Motion', parentId: sid, stationKey: st.key, position: [x, TABLE, -convD / 2 - 60], size: [Math.max(cellW - 80, 300), 60, 120], params: { axis: 'module' }, collision: false });
    if (st.kind === 'sort' && carrier === 'flow') {
      add(c, { id: `${sid}-pusher`, name: 'NG diverter (pneumatic pusher)', kind: 'pusher', layer: 'Pneumatic', parentId: sid, stationKey: st.key, position: [x, TABLE + 60, -convD / 2 - 70], size: [70, 60, 140], params: { stroke: convD }, collision: false, explode: [0, 0, -0.6] });
    }
    if (st.kind === 'sort') {
      add(c, { id: `${sid}-ok`, name: 'OK lane / bin', kind: 'bin', layer: 'Material', parentId: sid, stationKey: st.key, position: [x - 90, TABLE - 300, D / 2 + 160], size: [160, 280, 220], params: { ok: true }, explode: [0, 0, 1] });
      add(c, { id: `${sid}-ng`, name: 'NG (reject) bin', kind: 'bin', layer: 'Material', parentId: sid, stationKey: st.key, position: [x + 90, TABLE - 300, D / 2 + 160], size: [160, 280, 220], params: { ok: false }, explode: [0, 0, 1] });
      DO('Divert to NG', 'Sort diverter', 'decide', `${sid}-ng`);
    }
    // a robot selected on a station without a handling role is shown idle next to it
    if (robot && !handlers[st.key] && !c.objs.some((o) => o.id === `${sid}-robot`)) {
      const reach = specIn(robot.part, 'reach', 'mm', defs);
      partIn('robot', `${sid}-robot`, 'Robot', 'robot', [x, TABLE, -convD / 2 - 170], [180, 420, 180], { params: { reach: reach ?? null, axes: specIn(robot.part, 'axes', '', defs) ?? readNum(robot.part, 'axes'), L1: (reach ?? 500) / 2, L2: (reach ?? 500) / 2 } });
    }
    for (const p of rs.parts) {
      if (c.objs.some((o) => o.partId === p.part.id && o.stationKey === st.key)) continue;
      if (['conveyor', 'fixture', 'linear_stage', 'servo_motor'].includes(p.part.product_type)) continue;
      // other selected components (controllers, drives …) are shown in the cabinet or as a generic block
      if (['galvo_controller', 'vision_controller', 'servo_drive', 'smps', 'plc', 'ipc', 'safety_plc'].includes(p.part.product_type)) continue;
      add(c, { id: `${sid}-${p.part.product_type}`, name: `${p.role} — ${p.part.model_number}`, kind: GEN_OF[p.part.product_type] ?? 'generic', layer: LAYER_OF[p.part.product_type] ?? 'Mechanical', parentId: sid, stationKey: st.key, partId: p.part.id, role: p.role, position: [x + 120, TABLE, -D / 2 + 100], size: [80, 80, 80] });
    }
  });

  /* ---------- XY stage + fixture (sequential machine) ---------- */
  if (carrier === 'axes') {
    const stage = axes.map((a) => byId.get(a.partId ?? '')).find(Boolean) as (Part & AnyRecord) | undefined;
    add(c, { id: 'sys-motion', name: 'Motion system', kind: 'group', layer: 'Motion', level: 'system', parentId: 'machine', position: [cx, TABLE, 0], size: [0, 0, 0], collision: false });
    const xa = axes.find((a) => /x/i.test(a.key));
    const ya = axes.find((a) => /y/i.test(a.key));
    add(c, { id: 'axis-x', name: `X axis${xa?.partId ? ` — ${byId.get(xa.partId)?.name ?? ''}` : ''}`, kind: 'xy_stage', layer: 'Motion', level: 'subsystem', parentId: 'sys-motion', partId: xa?.partId, position: [(xa?.home ?? 0) + (xa?.stroke ?? W) / 2 - 0, TABLE, 0], size: [(xa?.stroke ?? W - 300) + 200, 60, 180], params: { axis: 'x', stroke: xa?.stroke ?? null }, explode: [0, -0.4, 0] });
    if (ya) add(c, { id: 'axis-y', name: `Y axis${ya.partId ? ` — ${byId.get(ya.partId)?.name ?? ''}` : ''}`, kind: 'xy_stage', layer: 'Motion', level: 'subsystem', parentId: 'sys-motion', partId: ya.partId, carriedBy: xa ? [xa.key] : undefined, position: [xa?.home ?? 0, TABLE + 60, 0], size: [180, 50, (ya.stroke ?? 300) + 120], params: { axis: 'y', stroke: ya.stroke ?? null }, explode: [0, -0.2, 0] });
    const fxp = res.stations.flatMap((s) => s.parts).find((p) => p.part.product_type === 'fixture');
    add(c, { id: 'fixture', name: fxp ? `Fixture — ${fxp.part.model_number}` : 'Fixture (not selected)', kind: 'fixture', layer: 'Mechanical', level: 'component', parentId: 'sys-motion', partId: fxp?.part.id, role: fxp?.role, carriedBy: axes.map((a) => a.key), position: [xa?.home ?? 0, TABLE + (ya ? 110 : 60), 0], size: [Math.max(wl + 60, 140), fixH + CLAMP_H, Math.max(ww + 60, 100)], params: { clamps: 2, plateH: fixH, clampH: CLAMP_H }, explode: [0, 0.6, 0] });
    DO('Clamp close', 'Clamp valve', 'clamp', 'fixture');
    DI('Clamp closed', 'Clamp reed switch', 'clamp', 'fixture');
    for (const a of axes) {
      const motor = res.stations.flatMap((s) => s.parts).find((p) => p.part.product_type === 'servo_motor');
      add(c, { id: `motor-${a.key}`, name: `${a.name} servo motor${motor ? ` — ${motor.part.model_number}` : ''}`, kind: 'generic', layer: 'Motion', parentId: 'sys-motion', partId: motor?.part.id, role: motor?.role, carriedBy: a.key === ya?.key && xa ? [xa.key] : undefined, position: a.key === ya?.key ? [xa?.home ?? 0, TABLE + 60, -((ya?.stroke ?? 300) + 120) / 2 - 40] : [(xa?.home ?? 0) - 240, TABLE, 0], size: a.key === ya?.key ? [80, 80, 150] : [150, 80, 80], params: { shape: 'servo', along: a.key === ya?.key ? 'z' : 'x' }, explode: [-1, 0, 0] });
      DI(`${a.name} in position`, `${a.name} drive`, 'position', `motor-${a.key}`);
      routes.push({ id: `cable-motor-${a.key}`, kind: 'cable', from: 'cabinet', to: `motor-${a.key}`, points: [] });
    }
    if (xa) {
      const ax = c.objs.find((o) => o.id === 'axis-x')!;
      add(c, { id: 'chain-x', name: 'Cable carrier (X axis)', kind: 'chain', layer: 'Motion', parentId: 'sys-motion', position: [ax.position[0], TABLE, 125], size: [ax.size[0], 90, 36], params: { axis: xa.key, home: xa.home, stroke: xa.stroke ?? null, x0: ax.position[0] - ax.size[0] / 2 + 60 }, collision: false, explode: [0, 0, 0.8] });
    }
    if (!stage) notes.push('The motion axes are not linked to a stage record — speed and acceleration must be entered.');
    const partY = TABLE + (ya ? 110 : 60) + fixH + wt;
    for (const k of Object.keys(anchors)) anchors[k] = [anchors[k][0], partY, anchors[k][2]];
    for (const l of lasers) {
      l.focus = [l.focus[0], partY, l.focus[2]];
      l.points[l.points.length - 1] = l.focus;
    }
  }

  /* ---------- controls, electrical, safety ---------- */
  add(c, { id: 'sys-controls', name: 'Controls & electrical', kind: 'group', layer: 'Electrical', level: 'system', parentId: 'machine', position: [maxX - 300, 0, -D / 2 - 290], size: [0, 0, 0], collision: false });
  // electrical cabinet stands behind the machine (rear service access), right-hand side
  const cabX = maxX - 300;
  const cabZ = -D / 2 - 290;
  add(c, { id: 'cabinet', name: 'Electrical cabinet', kind: 'cabinet', layer: 'Electrical', level: 'subsystem', parentId: 'sys-controls', position: [cabX, 0, cabZ], size: [600, 1800, 500], rotationY: 180, explode: [0, 0, -1.2], params: {} });
  const inCab = [...res.machineParts, ...res.stations.flatMap((s) => s.parts)].filter((p) => ['plc', 'safety_plc', 'smps', 'servo_drive', 'galvo_controller', 'vision_controller', 'ipc'].includes(p.part.product_type));
  const seen = new Set<string>();
  inCab.forEach((p) => {
    if (seen.has(p.part.id)) return;
    seen.add(p.part.id);
    add(c, { id: `cab-${p.part.id}`, name: `${p.role} — ${p.part.model_number}`, kind: 'generic', layer: LAYER_OF[p.part.product_type] ?? 'Controls', parentId: 'cabinet', partId: p.part.id, role: p.role, position: [cabX - 200 + ((seen.size - 1) % 3) * 200, 1250 - Math.floor((seen.size - 1) / 3) * 300, cabZ], size: [150, 220, 120], params: { module: p.part.product_type }, explode: [0, 0, -1.8], collision: false });
  });
  const hmi = res.machineParts.find((p) => p.part.product_type === 'hmi');
  add(c, { id: 'hmi', name: hmi ? `HMI — ${hmi.part.model_number}` : 'HMI (not selected)', kind: 'hmi', layer: 'Controls', parentId: 'sys-controls', partId: hmi?.part.id, role: hmi?.role, position: [maxX - 120, TABLE + 380, D / 2 + 60], size: [300, 220, 40], explode: [0.5, 0, 1] });
  add(c, { id: 'estop', name: 'Emergency stop', kind: 'estop', layer: 'Safety', parentId: 'sys-controls', position: [minX + 120, TABLE + 30, D / 2 + 30], size: [60, 60, 60], explode: [0, 0, 1] });
  add(c, { id: 'tower', name: 'Signal tower', kind: 'tower', layer: 'Controls', parentId: 'sys-controls', position: [maxX - 60, hasLaser ? TABLE + 850 : TABLE + 400, -D / 2 + 60], size: [50, 300, 50], explode: [0, 1, 0], collision: false });
  DI('E-stop healthy', 'Emergency stop', 'safety', 'estop');
  DI('Air pressure OK', 'Pressure switch', 'safety');
  const lc = res.machineParts.find((p) => p.part.product_type === 'light_curtain');
  if (lc) {
    add(c, { id: 'curtain', name: `Light curtain — ${lc.part.model_number}`, kind: 'sensor', layer: 'Safety', parentId: 'sys-controls', partId: lc.part.id, role: lc.role, position: [minX + 20, TABLE, D / 2 + 20], size: [30, specIn(lc.part, 'protective_range', 'mm', defs) ?? 600, 30], explode: [-1, 0, 1] });
    DI('Light curtain clear', lc.part.model_number, 'safety', 'curtain');
  }
  // pneumatics (conceptual: the scenario has clamps, so it needs air preparation and a valve)
  if (c.objs.some((o) => o.kind === 'fixture')) {
    add(c, { id: 'frl', name: 'Pneumatic service unit (filter-regulator, pressure switch)', kind: 'frl', layer: 'Pneumatic', parentId: 'sys-frame', position: [minX - 45, 380, D / 2 - 160], size: [70, 240, 90], collision: false, explode: [-1, 0, 0] });
    add(c, { id: 'valves', name: 'Valve terminal (clamp valves)', kind: 'valve', layer: 'Pneumatic', parentId: 'sys-frame', position: [minX + 220, 260, 60], size: [240, 70, 90], collision: false, explode: [0, -0.5, 0] });
    const fxo = c.objs.find((o) => o.kind === 'fixture');
    if (fxo) routes.push({ id: 'pneu-clamp', kind: 'pneumatic', from: 'valves', to: fxo.id, points: [] });
    const air = io.find((i) => i.name === 'Air pressure OK');
    if (air) air.objectId = 'frl';
  }
  if (sim.stations.some((s) => s.kind === 'load' && s.operator)) add(c, { id: 'operator', name: 'Operator (conceptual)', kind: 'operator', layer: 'Safety', parentId: 'machine', position: [minX + 330, 0, D / 2 + 420], size: [460, 1700, 280], collision: false, explode: [0, 0, 1] });
  for (const r of routes) r.points = routePoints(c.objs, r);

  /* ---------- zones ---------- */
  const zIn = sim.twin?.zones ?? [];
  const en = (key: string, def = true) => zIn.find((z) => z.key === key)?.enabled ?? def;
  const zones: SafetyZone[] = [
    { key: 'operator', name: 'Operator zone', type: 'operator', enabled: en('operator'), position: [minX + 250, 0, D / 2 + 450], size: [600, 20, 700], rule: 'Loading / unloading position in front of the machine' },
    { key: 'maintenance', name: 'Maintenance access', type: 'maintenance', enabled: en('maintenance', false), position: [cx, 0, -D / 2 - 500], size: [W, 20, 700], rule: 'Rear access to the laser source, chiller and extraction' },
  ];
  if (hasLaser) {
    const enc = c.objs.find((o) => o.id === 'enclosure')!;
    zones.push({ key: 'laser', name: 'Laser hazard zone (inside enclosure)', type: 'laser', enabled: en('laser'), position: [enc.position[0], TABLE, 0], size: [enc.size[0] - 20, enc.size[1] - 10, D - 20], rule: 'Beam permitted only with doors closed and interlocks healthy' });
  }
  if (carrier === 'axes') zones.push({ key: 'restricted', name: 'Axis travel envelope', type: 'restricted', enabled: en('restricted', false), position: [c.objs.find((o) => o.id === 'axis-x')!.position[0], TABLE + 60, 0], size: [c.objs.find((o) => o.id === 'axis-x')!.size[0], 150, 260], rule: 'Moving stage — no hands during motion' });
  zones.push(...extraZones);


  /* ---------- bounds ---------- */
  const mn: [number, number, number] = [Infinity, Infinity, Infinity];
  const mx: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const o of c.objs) {
    if (o.kind === 'group' || o.kind === 'station') continue;
    const [px, py, pz] = o.position;
    const [sx, sy, sz] = o.size;
    mn[0] = Math.min(mn[0], px - sx / 2);
    mn[1] = Math.min(mn[1], py);
    mn[2] = Math.min(mn[2], pz - sz / 2);
    mx[0] = Math.max(mx[0], px + sx / 2);
    mx[1] = Math.max(mx[1], py + sy);
    mx[2] = Math.max(mx[2], pz + sz / 2);
  }
  const objects = c.objs.filter((o) => !sim.twin?.overrides?.[o.id]?.hidden);
  // BOM linkage is by part id — the BOM engine is canonical (§178)
  if (bom) for (const o of objects) if (o.partId) o.params.bomItemId = bom.items.find((b) => b.partId === o.partId)?.id ?? null;
  return {
    version: TWIN_MODEL_VERSION,
    label: 'CONCEPTUAL 3D MODEL',
    objects,
    byId: new Map(objects.map((o) => [o.id, o])),
    axes,
    plan,
    lasers,
    vision,
    zones,
    routes,
    io,
    bounds: { min: mn, max: mx },
    dims: { width: mx[0] - mn[0], depth: mx[2] - mn[2], height: mx[1] - mn[1] },
    tableTop: TABLE,
    anchors,
    handlers,
    carrier,
    workpiece: { template: tmpl, length: wl, width: ww, thickness: wt, material: wpIn?.material ?? (byId.get(sim.material_id ?? '')?.name as string | undefined) ?? null, basis: wpIn ? wpIn.basis ?? 'USER_INPUT' : 'ASSUMPTION' },
    processArea: sim.twin?.process_area ? { x: sim.twin.process_area.x_mm, y: sim.twin.process_area.y_mm } : null,
    stationKinds: Object.fromEntries(sim.stations.map((s) => [s.key, s.kind])) as Record<string, StationKind>,
    notes,
  };
}

/** Conceptual routing (§91): spline control points per medium. Not a harness / hose design. */
function routePoints(objs: Machine3DObject[], r: Route): [number, number, number][] {
  const a = objs.find((o) => o.id === r.from);
  const b = objs.find((o) => o.id === r.to);
  if (!a || !b) return [];
  const top = (o: Machine3DObject) => o.position[1] + o.size[1];
  const mid = (o: Machine3DObject) => o.position[1] + o.size[1] / 2;
  if (r.kind === 'fiber') {
    // armoured delivery fibre: out of the source front, up the back of the enclosure, into the collimator
    const back = b.position[2] - b.size[2] / 2;
    return [
      [a.position[0] + a.size[0] / 2 - 40, mid(a), a.position[2] + a.size[2] / 2],
      [a.position[0] + a.size[0] / 2 + 20, top(a) + 60, a.position[2] + a.size[2] / 2 - 40],
      [b.position[0] + 60, top(a) + 260, back - 60],
      [b.position[0] + 40, mid(b), back - 50],
      [b.position[0], mid(b), back],
    ];
  }
  if (r.kind === 'fume') {
    const roof = 1720;
    return [
      [a.position[0], top(a), a.position[2]],
      [a.position[0], roof - 120, a.position[2] - 60],
      [a.position[0] - 120, roof, a.position[2] - 260],
      [b.position[0] + 60, roof - 60, b.position[2]],
      [b.position[0], top(b) + 80, b.position[2]],
      [b.position[0], top(b), b.position[2]],
    ];
  }
  if (r.kind === 'pneumatic') {
    return [
      [a.position[0], top(a), a.position[2]],
      [a.position[0] + 60, b.position[1] - 60, a.position[2] + 60],
      [b.position[0] - b.size[0] / 2 - 40, b.position[1] + 10, b.position[2] + b.size[2] / 2],
      [b.position[0] - b.size[0] / 2, b.position[1] + 15, b.position[2]],
    ];
  }
  const duct = r.kind === 'cooling' ? 150 : 860;
  const zBack = Math.min(a.position[2], b.position[2]) - 40;
  return [
    [a.position[0], mid(a), a.position[2]],
    [a.position[0], duct, zBack],
    [b.position[0], duct, zBack],
    [b.position[0], mid(b), b.position[2]],
  ];
}

/** Axis position of the object's carrier at a given axis state (the X/Y stage moves objects it carries). */
export function carriedOffset(o: Machine3DObject, axisPos: Record<string, number>, axes: AxisModel[]): [number, number, number] {
  if (!o.carriedBy?.length) return [0, 0, 0];
  let dx = 0;
  let dz = 0;
  for (const k of o.carriedBy) {
    const a = axes.find((x) => x.key === k);
    if (!a) continue;
    const d = (axisPos[k] ?? a.home) - a.home;
    if (/y/i.test(k)) dz += d;
    else dx += d;
  }
  return [dx, 0, dz];
}
