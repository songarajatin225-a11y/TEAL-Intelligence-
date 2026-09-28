import { carriedOffset, type Machine3DObject, type MachineModel } from './machine';
import { pickPlacePose } from './kinematics';
import { axisPositionAt } from './motion';

/*
 * COLLISION ENGINE (3D master prompt §20, §21, §47). Conceptual axis-aligned bounding boxes, sampled
 * along every planned axis move. Only objects flagged `collision` take part; containers (frame,
 * enclosure, groups) do not. Bounding boxes over-approximate real geometry — a hit means "review
 * this", a clear result is not a clearance proof.
 */

export interface Aabb {
  min: [number, number, number];
  max: [number, number, number];
}

export const aabbOf = (o: Pick<Machine3DObject, 'position' | 'size'>, off: [number, number, number] = [0, 0, 0]): Aabb => ({
  min: [o.position[0] - o.size[0] / 2 + off[0], o.position[1] + off[1], o.position[2] - o.size[2] / 2 + off[2]],
  max: [o.position[0] + o.size[0] / 2 + off[0], o.position[1] + o.size[1] + off[1], o.position[2] + o.size[2] / 2 + off[2]],
});

/** Overlap with a small tolerance so touching faces (a part resting on a fixture) do not count. */
export function intersects(a: Aabb, b: Aabb, tol = 0.5): boolean {
  for (let i = 0; i < 3; i++) if (a.max[i] - tol <= b.min[i] || b.max[i] - tol <= a.min[i]) return false;
  return true;
}

export interface CollisionHit {
  /** seconds into the representative cycle (move start + sample) */
  cycleT: number;
  moveLabel: string;
  stationKey: string;
  a: string;
  b: string;
  text: string;
}

/** §104 physics abstraction — the first provider is bounding-box collision; others plug in later. */
export interface PhysicsProvider {
  name: string;
  capabilities: string[];
  check(model: MachineModel, workpiece?: Machine3DObject): CollisionHit[];
}

function ancestors(o: Machine3DObject, byId: Map<string, Machine3DObject>): Set<string> {
  const s = new Set<string>();
  let p = o.parentId;
  while (p) {
    s.add(p);
    p = byId.get(p)?.parentId ?? null;
  }
  return s;
}

/** The workpiece as a scene object at a given axis state (it rides on the fixture). */
export function workpieceObject(model: MachineModel): Machine3DObject {
  const fx = model.objects.find((o) => o.id === 'fixture');
  const y = fx ? fx.position[1] + Number(fx.params.plateH ?? fx.size[1]) : model.tableTop + 60;
  return {
    id: 'workpiece',
    name: `Workpiece (${model.workpiece.template.replace('_', ' ')})`,
    kind: 'generic',
    layer: 'Material',
    level: 'component',
    parentId: 'machine',
    position: [fx?.position[0] ?? 0, y, fx?.position[2] ?? 0],
    size: [model.workpiece.length, model.workpiece.thickness, model.workpiece.width],
    carriedBy: fx?.carriedBy,
    collision: true,
    params: {},
    explode: [0, 1, 0],
  };
}

export function checkCollisions(model: MachineModel, samplesPerMove = 12): CollisionHit[] {
  const hits: CollisionHit[] = [];
  const wp = model.carrier === 'axes' ? workpieceObject(model) : null;
  const all = wp ? [...model.objects, wp] : model.objects;
  const byId = new Map(all.map((o) => [o.id, o]));
  const moving = all.filter((o) => o.collision && o.carriedBy?.length);
  const fixed = all.filter((o) => o.collision && !o.carriedBy?.length && o.kind !== 'group' && o.kind !== 'station');
  const seen = new Set<string>();
  // static pose (home) plus samples along each move
  const poses: { t: number; label: string; station: string; axes: Record<string, number> }[] = [{ t: 0, label: 'Home position', station: '', axes: Object.fromEntries(model.axes.map((a) => [a.key, a.home])) }];
  let tc = 0;
  for (const m of model.plan) {
    const T = m.time ?? 0;
    for (let k = 0; k <= samplesPerMove; k++) {
      const el = (T * k) / samplesPerMove;
      const axes: Record<string, number> = { ...m.from };
      for (const [ax, to] of Object.entries(m.to)) {
        const am = model.axes.find((a) => a.key === ax);
        axes[ax] = am ? axisPositionAt(m.from[ax] ?? am.home, to, am, el).pos : to;
      }
      poses.push({ t: tc + el, label: m.label, station: m.stationKey, axes });
    }
    tc += T;
  }
  for (const pose of poses) {
    for (const a of moving) {
      const boxA = aabbOf(a, carriedOffset(a, pose.axes, model.axes));
      const ancA = ancestors(a, byId);
      for (const b of fixed) {
        if (ancA.has(b.id) || ancestors(b, byId).has(a.id)) continue;
        if (!intersects(boxA, aabbOf(b))) continue;
        const key = `${a.id}|${b.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push({ cycleT: pose.t, moveLabel: pose.label, stationKey: pose.station, a: a.id, b: b.id, text: `Collision detected: ${a.name} vs ${b.name} (${pose.label})` });
      }
    }
  }
  // static interference between fixed tooling and the part position under each station
  if (wp) {
    for (const m of model.plan) {
      const box = aabbOf(wp, carriedOffset(wp, m.to, model.axes));
      for (const b of fixed) {
        if (b.id === wp.id || ['table', 'frame'].includes(b.id)) continue;
        if (!intersects(box, aabbOf(b))) continue;
        const key = `${wp.id}|${b.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push({ cycleT: 0, moveLabel: m.label, stationKey: m.stationKey, a: wp.id, b: b.id, text: `Collision detected: workpiece vs ${b.name} at ${m.label}` });
      }
    }
  }
  hits.push(...checkHandlerSweeps(model, samplesPerMove * 2));
  return hits;
}

/** Gripper envelope around the tool-centre point (mm): the gripper body sits above the TCP. */
const GRIP: [number, number, number] = [70, 70, 70];
/** Things a handler is meant to touch at its own station (pick / place positions). */
const HANDLER_CONTACT = new Set(['tray', 'fixture', 'conveyor', 'buffer', 'magazine', 'bin', 'table', 'frame', 'bench']);

/**
 * Robot and gantry sweeps (§20): the gripper — and the part when the handler carries it — sampled along
 * the whole pick-and-place path, against every fixed collision object except what it is meant to touch
 * at its own station. The arm links are not included (conceptual TCP envelope, not a robot-reach study).
 */
export function checkHandlerSweeps(model: MachineModel, samples = 24): CollisionHit[] {
  const hits: CollisionHit[] = [];
  const seen = new Set<string>();
  const fixed = model.objects.filter((o) => o.collision && !o.carriedBy?.length && o.kind !== 'group' && o.kind !== 'station');
  for (const hd of Object.values(model.handlers)) {
    const self = model.byId.get(hd.objectId);
    for (let k = 0; k <= samples; k++) {
      const pose = pickPlacePose(hd.pp, k / samples);
      const boxes: Aabb[] = [{ min: [pose.tcp[0] - GRIP[0] / 2, pose.tcp[1] + 2, pose.tcp[2] - GRIP[2] / 2], max: [pose.tcp[0] + GRIP[0] / 2, pose.tcp[1] + GRIP[1], pose.tcp[2] + GRIP[2] / 2] }];
      if (pose.holding && hd.carries === 'part') {
        const { length: l, width: w, thickness: t } = model.workpiece;
        boxes.push({ min: [pose.tcp[0] - l / 2, pose.tcp[1] - t + 1, pose.tcp[2] - w / 2], max: [pose.tcp[0] + l / 2, pose.tcp[1], pose.tcp[2] + w / 2] });
      }
      for (const b of fixed) {
        if (b.id === hd.objectId || b.parentId === hd.objectId) continue;
        if (b.stationKey === hd.stationKey && HANDLER_CONTACT.has(b.kind)) continue;
        if (['table', 'frame'].includes(b.id)) continue;
        if (!boxes.some((bx) => intersects(bx, aabbOf(b)))) continue;
        const key = `${hd.objectId}|${b.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hits.push({ cycleT: 0, moveLabel: `${self?.name ?? 'Handler'} — ${pose.phase}`, stationKey: hd.stationKey, a: hd.objectId, b: b.id, text: `Collision detected: ${hd.kind === 'robot' ? 'robot gripper' : 'gantry gripper'}${pose.holding && hd.carries === 'part' ? ' with part' : ''} vs ${b.name} (${pose.phase})` });
      }
    }
  }
  return hits;
}

export const BoundingBoxPhysics: PhysicsProvider = {
  name: 'Bounding-box collision (conceptual)',
  capabilities: ['object-object AABB', 'moving stage vs fixed tooling', 'tool vs workpiece', 'robot / gantry gripper sweep'],
  check: (model) => checkCollisions(model),
};

/** Registered physics providers. Rigid-body, robotics, optical, thermal and FEA engines are future extension points (§148). */
export const PHYSICS_PROVIDERS: { provider: PhysicsProvider | null; name: string; status: 'Active' | 'Future' }[] = [
  { provider: BoundingBoxPhysics, name: BoundingBoxPhysics.name, status: 'Active' },
  { provider: null, name: 'Rigid-body dynamics', status: 'Future' },
  { provider: null, name: 'Robot kinematics / dynamics', status: 'Future' },
  { provider: null, name: 'Optical ray tracing', status: 'Future' },
  { provider: null, name: 'Thermal / FEA / CFD', status: 'Future' },
];
