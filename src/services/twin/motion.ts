import { convert } from '../../calculations/units';
import type { AnyRecord } from '../../domain';
import type { Basis, Part, Simulation, TwinAxis, TwinMove } from '../../domain/engineering';
import { readSpec, type SpecDefs } from '../eng/specs';

/*
 * MOTION ENGINE (3D master prompt §15–§19). Conceptual kinematics: trapezoidal (or triangular)
 * velocity profiles from stroke, speed, acceleration and deceleration. Not a servo-level model —
 * no jerk, following error, load inertia or controller tuning (§18).
 */

/** Read a part specification converted to `unit` (null when absent or not convertible). */
export function specIn(part: Pick<Part, 'specs'> | undefined, key: string, unit: string, defs: SpecDefs): number | null {
  if (!part) return null;
  const s = readSpec(part, key, defs);
  if (s?.value == null) return null;
  try {
    return convert(s.value, s.unit, unit);
  } catch {
    return null;
  }
}

export interface AxisModel {
  key: string;
  name: string;
  type: 'linear' | 'rotary';
  stationKey: string;
  partId?: string;
  stroke: number | null;
  min: number;
  max: number;
  home: number;
  speed: number | null;
  accel: number | null;
  decel: number | null;
  /** where each value came from */
  sources: { stroke: string; speed: string; accel: string };
  basis: Basis;
  missing: string[];
}

/** §17 axis model: entered values win; otherwise the linked stage's stated specification; otherwise missing. */
export function resolveAxis(a: TwinAxis, byId: Map<string, AnyRecord>, defs: SpecDefs): AxisModel {
  const part = a.part_id ? (byId.get(a.part_id) as (Part & AnyRecord) | undefined) : undefined;
  const pick = (entered: number | null | undefined, key: string, unit: string): [number | null, string] => {
    if (entered != null) return [entered, 'Entered'];
    const v = specIn(part, key, unit, defs);
    return v != null ? [v, `${part!.model_number} · ${key.replace(/_/g, ' ')}`] : [null, 'Not defined'];
  };
  const [stroke, s1] = pick(a.stroke_mm, 'travel', 'mm');
  const [speed, s2] = pick(a.speed_mm_s, 'max_speed', 'mm/s');
  const [accel, s3] = pick(a.accel_mm_s2, 'acceleration', 'mm/s²');
  const missing = [speed == null ? `${a.name}: speed` : null, accel == null ? `${a.name}: acceleration` : null].filter((x): x is string => !!x);
  const home = a.home_mm ?? 0;
  const partBasis: Basis = part?.data_type === 'DEMO' ? 'DEMO' : 'MANUFACTURER_DATA';
  return {
    key: a.key,
    name: a.name,
    type: a.type,
    stationKey: a.station_key,
    partId: a.part_id,
    stroke,
    min: 0,
    max: stroke ?? Infinity,
    home,
    speed,
    accel,
    decel: a.decel_mm_s2 ?? accel,
    sources: { stroke: s1, speed: s2, accel: s3 },
    basis: a.basis ?? (a.speed_mm_s != null ? 'USER_INPUT' : partBasis),
    missing,
  };
}

/** Time for a point-to-point move (trapezoidal; triangular when the distance is too short to reach speed). */
export function moveTime(dist: number, v: number, a: number, d = a): number {
  const s = Math.abs(dist);
  if (s === 0) return 0;
  const sa = (v * v) / (2 * a);
  const sd = (v * v) / (2 * d);
  if (sa + sd >= s) {
    // triangular: peak speed vp with vp²/2a + vp²/2d = s
    const vp = Math.sqrt((2 * s * a * d) / (a + d));
    return vp / a + vp / d;
  }
  return v / a + (s - sa - sd) / v + v / d;
}

/** Position along a move at time t since the move started (same profile as moveTime). */
export function positionAt(from: number, to: number, v: number, a: number, d: number, t: number): { pos: number; vel: number } {
  const s = Math.abs(to - from);
  const dir = Math.sign(to - from) || 1;
  if (s === 0) return { pos: to, vel: 0 };
  const T = moveTime(s, v, a, d);
  if (t <= 0) return { pos: from, vel: 0 };
  if (t >= T) return { pos: to, vel: 0 };
  let vp = v;
  let ta = v / a;
  let td = v / d;
  if ((v * v) / (2 * a) + (v * v) / (2 * d) >= s) {
    vp = Math.sqrt((2 * s * a * d) / (a + d));
    ta = vp / a;
    td = vp / d;
  }
  const tc = T - ta - td;
  let x: number;
  let vel: number;
  if (t < ta) {
    x = 0.5 * a * t * t;
    vel = a * t;
  } else if (t < ta + tc) {
    x = 0.5 * a * ta * ta + vp * (t - ta);
    vel = vp;
  } else {
    const u = t - ta - tc;
    x = 0.5 * a * ta * ta + vp * tc + vp * u - 0.5 * d * u * u;
    vel = vp - d * u;
  }
  return { pos: from + dir * x, vel: dir * vel };
}

export interface PlannedMove {
  stationKey: string;
  label: string;
  from: Record<string, number>;
  to: Record<string, number>;
  /** seconds; null when an axis lacks speed or acceleration */
  time: number | null;
  perAxis: { axis: string; dist: number; time: number | null }[];
  limitViolations: string[];
}

/**
 * Plan the per-part moves in station order (positions carry over from one move to the next; the cycle
 * starts at the axes' home positions). A move's time is the slowest axis — axes move simultaneously.
 */
export function planMoves(moves: TwinMove[], axes: AxisModel[], stationOrder: string[]): PlannedMove[] {
  const byKey = new Map(axes.map((a) => [a.key, a]));
  const pos: Record<string, number> = Object.fromEntries(axes.map((a) => [a.key, a.home]));
  const ordered = [...moves].sort((a, b) => stationOrder.indexOf(a.station_key) - stationOrder.indexOf(b.station_key));
  return ordered.map((m) => {
    const from = { ...pos };
    const perAxis = Object.entries(m.targets).map(([k, to]) => {
      const ax = byKey.get(k);
      const dist = to - (pos[k] ?? 0);
      const time = ax && ax.speed != null && ax.accel != null ? moveTime(dist, ax.speed, ax.accel, ax.decel ?? ax.accel) : null;
      return { axis: k, dist, time };
    });
    const limitViolations = Object.entries(m.targets)
      .map(([k, to]) => {
        const ax = byKey.get(k);
        if (!ax) return `${m.label ?? m.station_key}: axis “${k}” is not defined`;
        if (ax.stroke != null && (to < ax.min || to > ax.max)) return `${ax.name}: target ${to} mm is outside the travel 0–${ax.stroke} mm`;
        return null;
      })
      .filter((x): x is string => !!x);
    for (const [k, to] of Object.entries(m.targets)) pos[k] = to;
    const time = perAxis.some((p) => p.time == null) ? null : Math.max(0, ...perAxis.map((p) => p.time!));
    return { stationKey: m.station_key, label: m.label ?? `Move for ${m.station_key}`, from, to: { ...pos }, time, perAxis, limitViolations };
  });
}

/** Axis resolution + move plan for a scenario (used by the canonical cycle-time model and by the 3D view). */
export function scenarioMotion(sim: Simulation, byId: Map<string, AnyRecord>, defs: SpecDefs) {
  const axes = (sim.twin?.axes ?? []).map((a) => resolveAxis(a, byId, defs));
  const plan = planMoves(sim.twin?.moves ?? [], axes, sim.stations.map((s) => s.key));
  return { axes, plan };
}
