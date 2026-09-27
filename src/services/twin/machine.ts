import type { AnyRecord } from '../../domain';
import type { Part, Simulation, StationKind } from '../../domain/engineering';
import type { SpecDefs } from '../eng/specs';
import type { CostResult } from '../sim/bom';
import type { Resolved, ResolvedStation } from '../sim/model';
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
  kind: 'cable' | 'pneumatic' | 'cooling' | 'fiber';
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
  /** part carried on axes (sequential machine) or moved between anchors (inline) */
  carrier: 'axes' | 'flow';
  workpiece: { template: string; length: number; width: number; thickness: number; material: string | null; basis: string };
  processArea: { x: number; y: number } | null;
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
const WORKPIECE_DEFAULTS: Record<string, [number, number, number]> = { pcb: [160, 100, 1.6], plate: [100, 60, 2], battery_tab: [120, 40, 0.3], battery_can: [70, 70, 21], wafer: [300, 300, 0.775], metal_part: [80, 50, 5] };

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
function readNum(p: Pick<Part, 'specs'>, key: string) {
  const s = (p.specs ?? []).find((x) => x.spec === key);
  return s?.value ?? null;
}

export function buildMachine(res: Resolved, byId: Map<string, AnyRecord>, defs: SpecDefs, bom?: CostResult): MachineModel {
  const sim = res.sim;
  const c: Ctx = { sim, byId, defs, objs: [] };
  const { axes, plan } = scenarioMotion(sim, byId, defs);
  const notes: string[] = [];
  const wpIn = sim.twin?.workpiece;
  const tmpl = wpIn?.template ?? (/pcb/i.test(sim.name) ? 'pcb' : /wafer|semi/i.test(sim.name) ? 'wafer' : /battery|tab/i.test(sim.name) ? 'battery_tab' : 'metal_part');
  const [wl, ww, wt] = wpIn ? [wpIn.length_mm, wpIn.width_mm, wpIn.thickness_mm] : WORKPIECE_DEFAULTS[tmpl];
  if (!wpIn) notes.push(`Workpiece dimensions are a visual placeholder for “${tmpl.replace('_', ' ')}” — not entered for this scenario.`);
  const carrier: MachineModel['carrier'] = res.layout === 'sequential' && axes.length ? 'axes' : 'flow';
  const TABLE = 900;
  const fixH = 30;
  const hasY = axes.some((a) => /y/i.test(a.key));
  // the part rides on fixture → (Y carriage) → X carriage in the sequential machine
  const partTop = carrier === 'axes' ? TABLE + (hasY ? 110 : 60) + fixH + wt : TABLE + 60 + wt;
  const anchors: Record<string, [number, number, number]> = {};
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
      return add(c, { id, name: p ? `${name} — ${partName(p)}` : `${name} (not selected)`, kind, layer: LAYER_OF[type] ?? 'Mechanical', parentId: sid, stationKey: st.key, partId: p?.part.id, role: p?.role, position: pos, size, ...extra });
    };
    // flow hardware (inline) — conveyor segment per station
    if (carrier === 'flow') {
      const cv = selected('conveyor');
      add(c, { id: `${sid}-conveyor`, name: cv ? `Conveyor — ${partName(cv)}` : st.kind === 'buffer' || st.buffer_after ? 'Conveyor / buffer segment' : 'Transfer conveyor', kind: st.buffer_after ? 'buffer' : 'conveyor', layer: 'Mechanical', parentId: sid, stationKey: st.key, partId: cv?.part.id, role: cv?.role, position: [x, TABLE, 0], size: [CELL[st.kind] - 10, 60, Math.max(ww + 60, 200)], params: { slots: st.buffer_after ?? 0 }, collision: false, explode: [0, -0.3, 0] });
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
      partIn(selected('telecentric_lens') ? 'telecentric_lens' : 'vision_lens', `${sid}-lens`, 'Lens', 'generic', [x, baseY + wd, 0], [40, lensLen, 40], { params: { shape: 'cylinder' } });
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
      const field = specIn(ft?.part, 'scan_field_x', 'mm', defs);
      const wdLens = specIn(ft?.part, 'working_distance', 'mm', defs) ?? specIn(head?.part, 'focal_length', 'mm', defs);
      const wl0 = specIn(src?.part, 'wavelength', 'nm', defs);
      const wd = wdLens ?? 250;
      if (wdLens == null) notes.push(`${st.name}: f-theta working distance not stated — the head height is drawn with a placeholder.`);
      const surf = partTop;
      const headY = surf + wd;
      for (let k = 0; k < par; k++) {
        const dz = par > 1 ? (k - (par - 1) / 2) * 220 : 0;
        const kk = par > 1 ? `-${k + 1}` : '';
        const ftId = `${sid}-ftheta${kk}`;
        partIn('f_theta', ftId, 'F-theta lens', 'f_theta', [x, headY, dz], [90, 70, 90], { params: { field: field ?? null } });
        const gId = `${sid}-galvo${kk}`;
        partIn('galvo', gId, 'Galvo scanner', 'galvo', [x, headY + 70, dz], [130, 110, 120]);
        const bId = `${sid}-bex${kk}`;
        const colZ = backZ + (par > 1 ? k * 90 : 0);
        if (selected('beam_expander')) partIn('beam_expander', bId, 'Beam expander', 'beam_expander', [x, headY + 105, (colZ + dz) / 2], [45, 45, 160], { collision: false });
        const sId = `${sid}-source${kk}`;
        const srcY = carrier === 'axes' ? 120 : 120;
        partIn('laser_source', sId, 'Laser source', 'laser_source', [x - 60, srcY, -D / 2 + 180 + (par > 1 ? k * 20 : 0)], [300, 150, 260], { params: { wavelength: wl0 ?? null }, explode: [0, -1, -1] });
        if (head) partIn('laser_head', `${sid}-head${kk}`, 'Laser head', 'laser_head', [x, headY, dz], [100, 160, 100]);
        add(c, { id: `${sid}-column${kk}`, name: 'Z column (scan head mount)', kind: 'z_column', layer: 'Mechanical', parentId: sid, stationKey: st.key, position: [x, TABLE, colZ], size: [80, headY + 180 - TABLE, 80], collision: true, explode: [0, 0, -1] });
        add(c, { id: `${sid}-rail${kk}`, name: 'Optical rail', kind: 'generic', layer: 'Laser', parentId: sid, stationKey: st.key, position: [x, headY + 150, (colZ + dz) / 2], size: [60, 20, Math.abs(dz - colZ) + 60], collision: false, explode: [0, 0.5, 0] });
        const focus: [number, number, number] = [x, surf, dz];
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
          process: /weld/i.test(sim.name) ? 'welding' : /clean/i.test(sim.name) ? 'cleaning' : /cut/i.test(sim.name) ? 'cutting' : /scrib/i.test(sim.name) ? 'scribing' : /drill/i.test(sim.name) ? 'drilling' : 'marking',
        });
        routes.push({ id: `fiber-${sId}`, kind: 'fiber', from: sId, to: gId, points: [] });
      }
      const fx = selected('fume_extraction');
      if (fx) partIn('fume_extraction', `${sid}-fume`, 'Fume extraction', 'fume', [minX - 280, 0, -D / 2 + 220], [360, 700, 360], { explode: [-1, 0, 0] });
      const ch = selected('chiller') ?? res.machineParts.find((p) => p.part.product_type === 'chiller');
      if (ch) {
        add(c, { id: `${sid}-chiller`, name: `Chiller — ${ch.part.model_number}`, kind: 'chiller', layer: 'Laser', parentId: sid, stationKey: st.key, partId: ch.part.id, role: ch.role, position: [minX - 300, 0, D / 2 - 260], size: [420, 800, 420], explode: [-1, 0, 0] });
        routes.push({ id: `cool-${sid}`, kind: 'cooling', from: `${sid}-chiller`, to: `${sid}-source`, points: [] });
      }
      DI('Laser ready', src ? `${src.part.model_number}` : 'Laser source', 'enable', `${sid}-source`);
      DO('Laser enable', src ? `${src.part.model_number}` : 'Laser source', 'enable', `${sid}-source`);
      DO('Scanner job start', 'Galvo controller', 'process', `${sid}-galvo`);
      DI('Job complete', 'Galvo controller', 'process', `${sid}-galvo`);
      if (fx) DI('Extraction running', fx.part.model_number, 'enable', `${sid}-fume`);
      anchors[st.key] = [x, surf, 0];
    }
    if (st.kind === 'sort') {
      add(c, { id: `${sid}-ok`, name: 'OK lane / bin', kind: 'bin', layer: 'Material', parentId: sid, stationKey: st.key, position: [x - 90, TABLE - 300, D / 2 + 160], size: [160, 280, 220], params: { ok: true }, explode: [0, 0, 1] });
      add(c, { id: `${sid}-ng`, name: 'NG (reject) bin', kind: 'bin', layer: 'Material', parentId: sid, stationKey: st.key, position: [x + 90, TABLE - 300, D / 2 + 160], size: [160, 280, 220], params: { ok: false }, explode: [0, 0, 1] });
      DO('Divert to NG', 'Sort diverter', 'decide', `${sid}-ng`);
    }
    const rb = selected('robot');
    if (rb) {
      const reach = specIn(rb.part, 'reach', 'mm', defs);
      partIn('robot', `${sid}-robot`, 'Robot', 'robot', [x, TABLE, -D / 2 + 150], [200, 500, 200], { params: { reach: reach ?? null, axes: specIn(rb.part, 'axes', '', defs) ?? readNum(rb.part, 'axes') } });
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
      add(c, { id: `motor-${a.key}`, name: `${a.name} servo motor${motor ? ` — ${motor.part.model_number}` : ''}`, kind: 'generic', layer: 'Motion', parentId: 'sys-motion', partId: motor?.part.id, role: motor?.role, carriedBy: a.key === ya?.key && xa ? [xa.key] : undefined, position: a.key === ya?.key ? [xa?.home ?? 0, TABLE + 60, -((ya?.stroke ?? 300) + 120) / 2 - 40] : [(xa?.home ?? 0) - 160 - 0, TABLE, 0], size: [80, 80, 80], params: { shape: 'cylinder' }, explode: [-1, 0, 0] });
      DI(`${a.name} in position`, `${a.name} drive`, 'position', `motor-${a.key}`);
      routes.push({ id: `cable-motor-${a.key}`, kind: 'cable', from: 'cabinet', to: `motor-${a.key}`, points: [] });
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
    add(c, { id: `cab-${p.part.id}`, name: `${p.role} — ${p.part.model_number}`, kind: 'generic', layer: LAYER_OF[p.part.product_type] ?? 'Controls', parentId: 'cabinet', partId: p.part.id, role: p.role, position: [cabX - 200 + ((seen.size - 1) % 3) * 200, 1250 - Math.floor((seen.size - 1) / 3) * 300, cabZ], size: [150, 220, 120], explode: [0, 0, -1.8], collision: false });
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
  const robot = c.objs.find((o) => o.kind === 'robot');
  if (robot) {
    const r = (robot.params.reach as number | null) ?? 600;
    zones.push({ key: 'robot', name: 'Robot reach (conceptual)', type: 'robot', enabled: en('robot'), position: [robot.position[0], TABLE, robot.position[2]], size: [r * 2, 20, r * 2], rule: `Reach ${robot.params.reach ?? 'not stated'} mm — conceptual workspace, not a validated envelope` });
  }

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
    carrier,
    workpiece: { template: tmpl, length: wl, width: ww, thickness: wt, material: wpIn?.material ?? (byId.get(sim.material_id ?? '')?.name as string | undefined) ?? null, basis: wpIn ? wpIn.basis ?? 'USER_INPUT' : 'ASSUMPTION' },
    processArea: sim.twin?.process_area ? { x: sim.twin.process_area.x_mm, y: sim.twin.process_area.y_mm } : null,
    notes,
  };
}

/** Conceptual routing: up from the source, along a cable duct above the frame, down to the target (§91). */
function routePoints(objs: Machine3DObject[], r: Route): [number, number, number][] {
  const a = objs.find((o) => o.id === r.from);
  const b = objs.find((o) => o.id === r.to);
  if (!a || !b) return [];
  const top = (o: Machine3DObject) => o.position[1] + o.size[1] / 2;
  const duct = r.kind === 'cooling' ? 150 : r.kind === 'fiber' ? 700 : 860;
  const zBack = Math.min(a.position[2], b.position[2]) - 40;
  return [
    [a.position[0], top(a), a.position[2]],
    [a.position[0], duct, zBack],
    [b.position[0], duct, zBack],
    [b.position[0], top(b), b.position[2]],
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
