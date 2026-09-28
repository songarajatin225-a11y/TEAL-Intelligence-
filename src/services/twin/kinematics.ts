/*
 * CONCEPTUAL KINEMATICS for handling and tooling (3D master prompt §16, §33, §34). Poses are a
 * function of the station's progress through its sub-step, so the same central simulation state
 * drives robots, gantries and tool heads. Geometry only — no dynamics, payload effects, cable
 * limits or controller path planning (§16: "Do not claim full industrial robot dynamics").
 */

export type V3 = [number, number, number];

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** smooth 0→1 easing (accelerate / decelerate) */
export const ease = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/**
 * Two-link planar inverse kinematics (SCARA shoulder + elbow) in the horizontal plane.
 * Returns joint angles (rad) for a target (dx, dz) from the base axis; unreachable targets are
 * clamped to the reach and flagged.
 */
export function scaraIK(dx: number, dz: number, L1: number, L2: number, elbow: 1 | -1 = 1): { t1: number; t2: number; reachable: boolean } {
  let d = Math.hypot(dx, dz);
  const max = L1 + L2 - 1e-6;
  const min = Math.abs(L1 - L2) + 1e-6;
  const reachable = d <= max && d >= min;
  d = Math.max(min, Math.min(max, d));
  const c2 = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  const t2 = elbow * Math.acos(Math.max(-1, Math.min(1, c2)));
  const t1 = Math.atan2(dz, dx) - Math.atan2(L2 * Math.sin(t2), L1 + L2 * Math.cos(t2));
  return { t1, t2, reachable };
}

/** Forward kinematics of the planar arm (for tests and for placing the tool centre point). */
export function scaraFK(t1: number, t2: number, L1: number, L2: number): [number, number] {
  return [L1 * Math.cos(t1) + L2 * Math.cos(t1 + t2), L1 * Math.sin(t1) + L2 * Math.sin(t1 + t2)];
}

export interface PickPlace {
  home: V3;
  pick: V3;
  place: V3;
  /** vertical clearance above pick / place, mm */
  clearance: number;
}

export type PickPhase = 'to pick' | 'descend' | 'grip' | 'lift' | 'to place' | 'lower' | 'release' | 'retract';

const PHASES: [PickPhase, number][] = [
  ['to pick', 0.2],
  ['descend', 0.3],
  ['grip', 0.35],
  ['lift', 0.45],
  ['to place', 0.7],
  ['lower', 0.8],
  ['release', 0.85],
  ['retract', 1],
];

/** Tool-centre-point pose for a pick-and-place cycle at progress u (0–1). */
export function pickPlacePose(pp: PickPlace, u: number): { tcp: V3; holding: boolean; phase: PickPhase } {
  const t = clamp01(u);
  const up = (p: V3): V3 => [p[0], p[1] + pp.clearance, p[2]];
  let start = 0;
  for (const [phase, end] of PHASES) {
    if (t <= end) {
      const k = ease((t - start) / (end - start));
      const tcp =
        phase === 'to pick'
          ? lerp3(pp.home, up(pp.pick), k)
          : phase === 'descend'
            ? lerp3(up(pp.pick), pp.pick, k)
            : phase === 'grip'
              ? pp.pick
              : phase === 'lift'
                ? lerp3(pp.pick, up(pp.pick), k)
                : phase === 'to place'
                  ? lerp3(up(pp.pick), up(pp.place), k)
                  : phase === 'lower'
                    ? lerp3(up(pp.place), pp.place, k)
                    : phase === 'release'
                      ? pp.place
                      : lerp3(pp.place, pp.home, k);
      const holding = phase === 'lift' || phase === 'to place' || phase === 'lower' || (phase === 'grip' && k > 0.5);
      return { tcp, holding, phase };
    }
    start = end;
  }
  return { tcp: pp.home, holding: false, phase: 'retract' };
}

/** Tool-head stroke for a press / screw / dispense / test step: 0 = up, 1 = at the work. */
export function toolStroke(u: number): number {
  const t = clamp01(u);
  if (t < 0.2) return ease(t / 0.2);
  if (t > 0.8) return 1 - ease((t - 0.8) / 0.2);
  return 1;
}
