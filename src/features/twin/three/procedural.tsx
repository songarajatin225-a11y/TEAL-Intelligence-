import { useFrame } from '@react-three/fiber';
import { createContext, forwardRef, useContext, useLayoutEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LANE_PITCH, PUSH_SHARE, type GenKind, type Machine3DObject, type MachineModel } from '../../../services/twin/machine';
import { ARM_SHOULDER, ARM_TOOL, articulatedIK, pickPlacePose, scaraIK, toolStroke } from '../../../services/twin/kinematics';
import { pointAt, type ScanPath } from '../../../services/twin/process';
import type { SimulationState } from '../../../services/twin/timeline';

/*
 * PROCEDURAL COMPONENT LIBRARY (3D master prompt §10, §119–§123). Parametric, conceptual geometry
 * with engineering detail: profiles, panels, rails, ball screws, clamps, galvo mirrors, lens barrels,
 * DIN modules, cable carriers. Every generator takes the engineering object's size + params; live
 * mechanisms (door, clamps, mirrors, cable carrier, HMI screen) read the central simulation state
 * each frame. Restrained industrial materials — no glass machines, no bloom, no neon (§86).
 */

export const MM = 0.001;

export type Visual = 'normal' | 'selected' | 'hover' | 'active' | 'fault' | 'warning' | 'collision' | 'dim';
export type Detail = 'high' | 'low';
export type EnclosureMode = 'closed' | 'cutaway' | 'hidden';

/** Runtime shared by live mechanisms (§45: one central state). */
export interface TwinRuntime {
  stateRef: MutableRefObject<SimulationState | null>;
  model: MachineModel;
  paths: ScanPath[];
  detail: Detail;
  enclosure: EnclosureMode;
  hmi: { title: string; recipe: string };
  reduced: boolean;
}
export const RuntimeCtx = createContext<TwinRuntime | null>(null);
const useRt = () => useContext(RuntimeCtx);

/* ------------------------------------------------------------------ materials (§121) */

export const MAT = {
  frame: { color: '#262d31', metalness: 0.55, roughness: 0.45 },
  profile: { color: '#1d2327', metalness: 0.6, roughness: 0.4 },
  table: { color: '#1c2125', metalness: 0.1, roughness: 0.85 },
  granite: { color: '#23282b', metalness: 0.05, roughness: 0.9 },
  aluminium: { color: '#aeb7bb', metalness: 0.7, roughness: 0.36 },
  anodised: { color: '#3b4448', metalness: 0.55, roughness: 0.4 },
  steel: { color: '#8a959a', metalness: 0.78, roughness: 0.38 },
  stainless: { color: '#c7cdd0', metalness: 0.85, roughness: 0.25 },
  black: { color: '#15191b', metalness: 0.35, roughness: 0.5 },
  polymer: { color: '#353f44', metalness: 0.05, roughness: 0.75 },
  rubber: { color: '#101214', metalness: 0, roughness: 0.95 },
  cabinet: { color: '#c9ccc6', metalness: 0.15, roughness: 0.62 },
  panel: { color: '#b8bdb8', metalness: 0.2, roughness: 0.6 },
  laser: { color: '#e4e7e7', metalness: 0.25, roughness: 0.45 },
  accent: { color: '#00a99d', metalness: 0.2, roughness: 0.4 },
  yellow: { color: '#f2c200', metalness: 0.1, roughness: 0.5 },
  red: { color: '#c62828', metalness: 0.1, roughness: 0.4 },
  green: { color: '#2e7d4f', metalness: 0.1, roughness: 0.5 },
  blue: { color: '#2f6fd6', metalness: 0.1, roughness: 0.5 },
  copper: { color: '#b87333', metalness: 0.8, roughness: 0.35 },
  lens: { color: '#86b8d8', metalness: 0.1, roughness: 0.05 },
  window: { color: '#8a7a4a', metalness: 0.1, roughness: 0.1 },
  duct: { color: '#8f989c', metalness: 0.2, roughness: 0.7 },
  person: { color: '#5f7680', metalness: 0.05, roughness: 0.85 },
} as const;
type MatKey = keyof typeof MAT;

const TINT: Partial<Record<Visual, [string, number]>> = { selected: ['#00a99d', 0.35], hover: ['#4fd1c5', 0.16], active: ['#00a99d', 0.3], fault: ['#e5484d', 0.4], warning: ['#f5a524', 0.14], collision: ['#e5484d', 0.5] };
const cache = new Map<string, THREE.MeshStandardMaterial>();

/** Shared material instances — one per (material, visual, x-ray, opacity, emissive). */
export function mat(m: MatKey, visual: Visual = 'normal', xray = false, opacity = 1, emissive?: string): THREE.MeshStandardMaterial {
  const op = xray ? 0.1 : visual === 'dim' ? 0.16 : opacity;
  const key = `${m}|${visual}|${op}|${emissive ?? ''}`;
  let x = cache.get(key);
  if (!x) {
    const b = MAT[m];
    const t = TINT[visual];
    x = new THREE.MeshStandardMaterial({ color: b.color, metalness: b.metalness, roughness: b.roughness, emissive: emissive ?? t?.[0] ?? '#000000', emissiveIntensity: emissive ? 0.9 : (t?.[1] ?? 0), transparent: op < 1, opacity: op, depthWrite: op >= 1 });
    cache.set(key, x);
  }
  return x;
}

type V3 = [number, number, number];
const s3 = (v: V3): V3 => [v[0] * MM, v[1] * MM, v[2] * MM];

interface P {
  p: V3;
  s: V3;
  m: MatKey;
  v?: Visual;
  x?: boolean;
  op?: number;
  em?: string;
  r?: V3;
  cast?: boolean;
}
/** Box by centre + size (mm). */
function Bx({ p, s, m, v = 'normal', x = false, op = 1, em, r, cast }: P) {
  return (
    <mesh position={s3(p)} rotation={r} material={mat(m, v, x, op, em)} castShadow={cast} receiveShadow={cast}>
      <boxGeometry args={s3(s)} />
    </mesh>
  );
}
/** Cylinder by centre, radius, length and axis (mm). */
function Cy({ p, rad, len, m, v = 'normal', x = false, op = 1, em, axis = 'y', seg = 24, rad2 }: { p: V3; rad: number; len: number; m: MatKey; v?: Visual; x?: boolean; op?: number; em?: string; axis?: 'x' | 'y' | 'z'; seg?: number; rad2?: number }) {
  const rot: V3 = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return (
    <mesh position={s3(p)} rotation={rot} material={mat(m, v, x, op, em)} castShadow>
      <cylinderGeometry args={[rad * MM, (rad2 ?? rad) * MM, len * MM, seg]} />
    </mesh>
  );
}

interface GenProps {
  o: Machine3DObject;
  visual: Visual;
  xray: boolean;
  live?: { active?: boolean; tower?: 'green' | 'amber' | 'red' | 'off' };
  children?: ReactNode;
}

/* ------------------------------------------------------------------ structure */

/** Base cabinet: black aluminium profiles, RAL 7035 panels with lockable doors, louvres, levelling feet. */
function Frame({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const pr = Number(o.params.profile ?? 45);
  const hi = rt?.detail !== 'low';
  const cut = rt?.enclosure === 'cutaway';
  const hide = rt?.enclosure === 'hidden';
  const foot = 70;
  const posts = [-w / 2 + pr / 2, ...(w > 900 ? [-w / 6, w / 6] : []), w / 2 - pr / 2];
  const doors = Math.max(2, Math.round(w / 520));
  const dw = (w - 2 * pr) / doors;
  return (
    <group>
      {/* profile skeleton */}
      {posts.flatMap((x) => [-d / 2 + pr / 2, d / 2 - pr / 2].map((z) => <Bx key={`${x}${z}`} p={[x, foot + (h - foot) / 2, z]} s={[pr, h - foot, pr]} m="profile" v={v} cast />))}
      {[foot + pr / 2, h - pr / 2].map((y) => (
        <group key={y}>
          {[-d / 2 + pr / 2, d / 2 - pr / 2].map((z) => <Bx key={z} p={[0, y, z]} s={[w, pr, pr]} m="profile" v={v} />)}
          {[-w / 2 + pr / 2, w / 2 - pr / 2].map((x) => <Bx key={x} p={[x, y, 0]} s={[pr, pr, d - 2 * pr]} m="profile" v={v} />)}
        </group>
      ))}
      {/* levelling feet */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`}>
            <Cy p={[sx * (w / 2 - pr / 2), foot / 2 + 10, sz * (d / 2 - pr / 2)]} rad={9} len={foot - 10} m="steel" v={v} />
            <Cy p={[sx * (w / 2 - pr / 2), 6, sz * (d / 2 - pr / 2)]} rad={34} len={12} m="rubber" v={v} />
          </group>
        )),
      )}
      {!hide && (
        <>
          {/* front doors with handles, hinges and louvres */}
          {Array.from({ length: doors }, (_, i) => {
            const cx = -w / 2 + pr + dw * (i + 0.5);
            return (
              <group key={i}>
                <Bx p={[cx, foot + (h - foot - pr) / 2, d / 2 - 2]} s={[dw - 6, h - foot - pr - 20, 3]} m="panel" v={v} x={xray} />
                {hi && <Bx p={[cx + (i % 2 ? -1 : 1) * (dw / 2 - 40), foot + (h - foot) * 0.55, d / 2 + 8]} s={[16, 110, 18]} m="black" v={v} x={xray} />}
                {hi && [0.2, 0.8].map((k) => <Bx key={k} p={[cx + (i % 2 ? 1 : -1) * (dw / 2 - 8), foot + (h - foot) * k, d / 2 + 2]} s={[10, 50, 8]} m="steel" v={v} x={xray} />)}
                {hi && i === 0 && Array.from({ length: 6 }, (_, k) => <Bx key={k} p={[cx, foot + 90 + k * 22, d / 2 + 1]} s={[dw * 0.55, 6, 4]} m="black" v={v} x={xray} />)}
              </group>
            );
          })}
          {/* sides + back */}
          <Bx p={[-w / 2 + 1, foot + (h - foot) / 2, 0]} s={[3, h - foot - 10, d - 2 * pr]} m="panel" v={v} x={xray} />
          {!cut && <Bx p={[w / 2 - 1, foot + (h - foot) / 2, 0]} s={[3, h - foot - 10, d - 2 * pr]} m="panel" v={v} x={xray} />}
          <Bx p={[0, foot + (h - foot) / 2, -d / 2 + 2]} s={[w - 2 * pr, h - foot - 10, 3]} m="panel" v={v} x={xray} />
          {hi && <Bx p={[w * 0.3, foot + 60, -d / 2 - 2]} s={[220, 60, 8]} m="black" v={v} x={xray} />}
          {/* brand accent line */}
          <Bx p={[0, h - pr - 6, d / 2 + 1]} s={[w - 2 * pr, 4, 2]} m="accent" v={v} x={xray} />
        </>
      )}
    </group>
  );
}

function Table({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  return (
    <group>
      <Bx p={[0, h / 2, 0]} s={[w, h, d]} m="granite" v={v} x={xray} cast />
      <Bx p={[0, h + 2, 0]} s={[w - 40, 4, d - 40]} m="anodised" v={v} x={xray} cast />
      {rt?.detail !== 'low' && Array.from({ length: 7 }, (_, i) => <Bx key={i} p={[0, h + 4.2, -d / 2 + 60 + (i * (d - 120)) / 6]} s={[w - 60, 0.6, 8]} m="black" v={v} x={xray} />)}
    </group>
  );
}

/** Upper Class-1 enclosure: profile frame, sheet walls, laser-safe windows, roof with extraction flange and LED strip, warning label. */
function Enclosure({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const t = 40;
  const hi = rt?.detail !== 'low';
  const mode = rt?.enclosure ?? 'cutaway';
  const led = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (led.current) led.current.emissiveIntensity = (rt?.stateRef.current?.inSystem ?? 0) > 0 ? 1.1 : 0.35;
  });
  const posts: V3[] = [
    [-w / 2 + t / 2, 0, -d / 2 + t / 2],
    [w / 2 - t / 2, 0, -d / 2 + t / 2],
    [-w / 2 + t / 2, 0, d / 2 - t / 2],
    [w / 2 - t / 2, 0, d / 2 - t / 2],
    [0, 0, d / 2 - t / 2],
  ];
  const winOp = xray ? 0.04 : 0.13;
  const sheet = (p: V3, s: V3, key: string) => <Bx key={key} p={p} s={s} m="cabinet" v={v} x={xray} op={0.96} />;
  const glass = (p: V3, s: V3, key: string) => (
    <mesh key={key} position={s3(p)} material={mat('window', 'normal', false, winOp)}>
      <boxGeometry args={s3(s)} />
    </mesh>
  );
  return (
    <group>
      {posts.map((q, i) => (
        <Bx key={i} p={[q[0], h / 2, q[2]]} s={[t, h, t]} m="profile" v={v} cast />
      ))}
      {[h - t / 2].map((y) => (
        <group key={y}>
          <Bx p={[0, y, -d / 2 + t / 2]} s={[w, t, t]} m="profile" v={v} />
          <Bx p={[0, y, d / 2 - t / 2]} s={[w, t, t]} m="profile" v={v} />
          <Bx p={[-w / 2 + t / 2, y, 0]} s={[t, t, d]} m="profile" v={v} />
          <Bx p={[w / 2 - t / 2, y, 0]} s={[t, t, d]} m="profile" v={v} />
        </group>
      ))}
      {mode !== 'hidden' && (
        <>
          {/* back wall (sheet) with service hatch outline */}
          {sheet([0, h / 2, -d / 2 + 2], [w - 2 * t, h - t, 3], 'back')}
          {hi && <Bx p={[w * 0.22, h * 0.45, -d / 2 - 1]} s={[w * 0.3, h * 0.5, 2]} m="panel" v={v} x={xray} />}
          {/* left side: lower sheet + upper laser window */}
          {sheet([-w / 2 + 2, h * 0.22, 0], [3, h * 0.44, d - 2 * t], 'l1')}
          {glass([-w / 2 + 2, h * 0.7, 0], [3, h * 0.5, d - 2 * t], 'l2')}
          {/* right side (removed in cutaway) */}
          {mode === 'closed' && sheet([w / 2 - 2, h * 0.22, 0], [3, h * 0.44, d - 2 * t], 'r1')}
          {mode === 'closed' && glass([w / 2 - 2, h * 0.7, 0], [3, h * 0.5, d - 2 * t], 'r2')}
          {/* front: fixed window right of the door */}
          {glass([w / 4, h * 0.55, d / 2 - 2], [w / 2 - 2 * t, h * 0.8, 3], 'f')}
          {sheet([w / 4, h * 0.07, d / 2 - 2], [w / 2 - 2 * t, h * 0.14, 3], 'fk')}
          {/* roof: sheet, extraction flange, LED strip (roof half removed in cutaway) */}
          {mode === 'closed' ? sheet([0, h + 2, 0], [w, 4, d], 'roof') : sheet([-w / 4, h + 2, 0], [w / 2, 4, d], 'roofh')}
          <Cy p={[-w / 3, h + 40, -d / 4]} rad={55} len={80} m="duct" v={v} x={xray} />
          {hi && <Cy p={[-w / 3, h + 82, -d / 4]} rad={62} len={6} m="steel" v={v} x={xray} />}
          <mesh position={s3([0, h - t - 8, 0])}>
            <boxGeometry args={s3([w * 0.7, 6, 24])} />
            <meshStandardMaterial ref={led} color="#e9f3f2" emissive="#dff7f4" emissiveIntensity={0.35} />
          </mesh>
          {/* laser warning label (symbolic) on the centre post */}
          {hi && (
            <mesh position={s3([0, h * 0.78, d / 2 + 2])} rotation={[0, 0, 0]}>
              <circleGeometry args={[34 * MM, 3]} />
              <meshBasicMaterial color="#f2c200" />
            </mesh>
          )}
          {hi && (
            <mesh position={s3([0, h * 0.775, d / 2 + 3])}>
              <circleGeometry args={[9 * MM, 16]} />
              <meshBasicMaterial color="#111" />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}

/** Vertical-lift loading door with laser-protective window; opens from the central state (load / unload). */
function Door({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h] = o.size;
  const g = useRef<THREE.Group>(null);
  const cur = useRef(0);
  useFrame((_, dt) => {
    const s = rt?.stateRef.current;
    let target = 0;
    // the loading door belongs to the sequential machine; on a line the enclosure stays closed
    if (s && rt && rt.model.carrier === 'axes')
      for (const st of s.stations) {
        const k = rt.model.stationKinds[st.key];
        if ((k === 'load' || k === 'unload') && st.servers.some((x) => x.state === 'busy' && x.step && x.step.kind !== 'move')) target = 1;
      }
    cur.current = rt?.reduced ? target : cur.current + (target - cur.current) * Math.min(1, dt * 5);
    if (g.current) g.current.position.y = cur.current * h * 0.85 * MM;
  });
  if (rt?.enclosure === 'hidden') return null;
  return (
    <group>
      {/* guide rails */}
      {[-1, 1].map((sx) => (
        <Bx key={sx} p={[sx * (w / 2 + 12), h, -6]} s={[14, h * 2, 20]} m="steel" v={v} x={xray} />
      ))}
      <group ref={g}>
        {/* door frame: four profile bars around the window */}
        <Bx p={[0, h - 12, 0]} s={[w, 24, 18]} m="profile" v={v} x={xray} />
        <Bx p={[0, 12, 0]} s={[w, 24, 18]} m="profile" v={v} x={xray} />
        {[-1, 1].map((sx) => (
          <Bx key={`fr${sx}`} p={[sx * (w / 2 - 12), h / 2, 0]} s={[24, h, 18]} m="profile" v={v} x={xray} />
        ))}
        <mesh position={s3([0, h / 2, 10])} material={mat('window', 'normal', false, xray ? 0.04 : 0.15)}>
          <boxGeometry args={s3([w - 50, h - 50, 6])} />
        </mesh>
        <Bx p={[0, h - 70, 30]} s={[w * 0.45, 16, 16]} m="stainless" v={v} x={xray} />
        {[-1, 1].map((sx) => (
          <Bx key={sx} p={[sx * w * 0.2, h - 70, 20]} s={[14, 14, 24]} m="stainless" v={v} x={xray} />
        ))}
        <Bx p={[0, 4, 4]} s={[w, 8, 24]} m="rubber" v={v} x={xray} />
      </group>
    </group>
  );
}

/** Fixture: plate, nest, locating pins, two pneumatic toggle clamps (animated from the sequence). */
function Fixture({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, , d] = o.size;
  const plate = Number(o.params.plateH ?? 30);
  const ch = Number(o.params.clampH ?? 0);
  const arms = useRef<(THREE.Group | null)[]>([]);
  const cur = useRef(0);
  useFrame((_, dt) => {
    const s = rt?.stateRef.current;
    let target = 0;
    if (s && rt && s.inSystem > 0) {
      target = 1;
      for (const st of s.stations) {
        const k = rt.model.stationKinds[st.key];
        const sv = st.servers.find((x) => x.state === 'busy');
        if (!sv) continue;
        if (k === 'load') target = 0;
        if (k === 'fixture') target = sv.stepProgress;
        if (k === 'unload' && sv.step?.kind !== 'move') target = 0;
      }
    }
    cur.current = rt?.reduced ? target : cur.current + (target - cur.current) * Math.min(1, dt * 8);
    arms.current.forEach((a, i) => {
      if (a) a.rotation.z = (i ? -1 : 1) * (1 - cur.current) * 1.1;
    });
  });
  const hi = rt?.detail !== 'low';
  return (
    <group>
      <Bx p={[0, plate / 2, 0]} s={[w, plate, d]} m="aluminium" v={v} x={xray} cast />
      {hi && <Bx p={[0, plate + 0.5, 0]} s={[w - 50, 1, d - 30]} m="anodised" v={v} x={xray} />}
      {hi &&
        [
          [-w / 2 + 22, -d / 2 + 18],
          [w / 2 - 22, d / 2 - 18],
        ].map(([x, z], i) => <Cy key={i} p={[x, plate + 6, z]} rad={4} len={12} m="stainless" v={v} x={xray} />)}
      {ch > 0 &&
        [-1, 1].map((sx, i) => (
          <group key={sx} position={s3([sx * (w / 2 - 10), plate, 0])}>
            <Bx p={[0, 10, 0]} s={[22, 20, 30]} m="black" v={v} x={xray} />
            <group ref={(g) => (arms.current[i] = g)} position={s3([0, ch, 0])}>
              <Bx p={[-sx * 16, 0, 0]} s={[38, 7, 14]} m="steel" v={v} x={xray} />
              <Bx p={[-sx * 32, -6, 0]} s={[10, 8, 16]} m="rubber" v={v} x={xray} />
            </group>
            {hi && <Cy p={[sx * 18, 10, 0]} rad={3} len={30} m="blue" v={v} x={xray} axis="x" />}
          </group>
        ))}
      {hi && <Bx p={[w / 2 - 30, plate + 8, d / 2 - 12]} s={[16, 14, 10]} m="polymer" v={v} x={xray} em="#f5a524" />}
    </group>
  );
}

/** Linear stage: base, profile rails, ball screw, end blocks, carriage slot cover. */
function Stage({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const along = w >= d ? 'x' : 'z';
  const L = along === 'x' ? w : d;
  const Wd = along === 'x' ? d : w;
  const hi = rt?.detail !== 'low';
  const xy = (a: number, b: number): [number, number] => (along === 'x' ? [a, b] : [b, a]);
  return (
    <group>
      <Bx p={[0, h * 0.25, 0]} s={along === 'x' ? [L, h * 0.5, Wd] : [Wd, h * 0.5, L]} m="anodised" v={v} x={xray} cast />
      {[-1, 1].map((s) => {
        const [x, z] = xy(0, (s * Wd) / 3);
        return <Bx key={s} p={[x, h * 0.5 + 7, z]} s={along === 'x' ? [L - 40, 14, 20] : [20, 14, L - 40]} m="stainless" v={v} x={xray} />;
      })}
      {hi && <Cy p={[0, h * 0.5 + 12, 0]} rad={8} len={L - 60} m="steel" v={v} x={xray} axis={along} seg={16} />}
      {[-1, 1].map((s) => {
        const [x, z] = xy((s * (L - 30)) / 2, 0);
        return <Bx key={`e${s}`} p={[x, h * 0.5 + 18, z]} s={along === 'x' ? [30, 36, Wd * 0.8] : [Wd * 0.8, 36, 30]} m="black" v={v} x={xray} />;
      })}
      {hi && <Bx p={[0, h * 0.5 + 1, 0]} s={along === 'x' ? [L - 80, 2, 12] : [12, 2, L - 80]} m="black" v={v} x={xray} />}
      {/* scale strip */}
      {hi && (() => {
        const [x, z] = xy(0, Wd / 2 - 4);
        return <Bx p={[x, h * 0.5 - 4, z]} s={along === 'x' ? [L - 80, 6, 1] : [1, 6, L - 80]} m="stainless" v={v} x={xray} />;
      })()}
    </group>
  );
}

/** AC servo motor: square flange, body, encoder cap, connector. */
function Servo({ o, visual: v, xray }: GenProps) {
  const [w, h, d] = o.size;
  const ax = (o.params.along as 'x' | 'z') ?? 'x';
  const L = ax === 'x' ? w : d;
  const f = h;
  const off = (k: number): V3 => (ax === 'x' ? [k, h / 2, 0] : [0, h / 2, k]);
  return (
    <group>
      <Bx p={off(L / 2 - 10)} s={ax === 'x' ? [20, f, f] : [f, f, 20]} m="steel" v={v} x={xray} />
      <Bx p={off(L / 2 - 20 - (L - 50) / 2)} s={ax === 'x' ? [L - 50, f * 0.82, f * 0.82] : [f * 0.82, f * 0.82, L - 50]} m="black" v={v} x={xray} cast />
      <Cy p={off(-L / 2 + 14)} rad={f * 0.36} len={28} m="polymer" v={v} x={xray} axis={ax} />
      <Bx p={[ax === 'x' ? 0 : f * 0.45, h + 4, ax === 'x' ? f * 0.3 : 0]} s={[22, 14, 22]} m="polymer" v={v} x={xray} />
    </group>
  );
}

/** Animated cable carrier: links follow the X carriage each frame. */
function Chain({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const N = 40;
  const R = 32;
  const inst = useRef<THREE.InstancedMesh>(null);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  const stroke = Number(o.params.stroke ?? o.size[0] - 200);
  const x0 = Number(o.params.x0 ?? -o.size[0] / 2) - o.position[0];
  const Lc = stroke + Math.PI * R + 80;
  useFrame(() => {
    const mesh = inst.current;
    if (!mesh) return;
    const pos = rt?.stateRef.current?.axes[String(o.params.axis)] ?? Number(o.params.home ?? 0);
    const F = x0;
    const M = x0 + 40 + (pos - Number(o.params.home ?? 0));
    const xb = (Lc - Math.PI * R + F + M) / 2;
    const bottom = xb - F;
    for (let i = 0; i < N; i++) {
      const sLen = (i + 0.5) * (Lc / N);
      let x: number;
      let y: number;
      let ang: number;
      if (sLen <= bottom) {
        x = F + sLen;
        y = 18;
        ang = 0;
      } else if (sLen <= bottom + Math.PI * R) {
        const a = (sLen - bottom) / R;
        x = xb + Math.sin(a) * R;
        y = 18 + R - Math.cos(a) * R;
        ang = a;
      } else {
        x = xb - (sLen - bottom - Math.PI * R);
        y = 18 + 2 * R;
        ang = Math.PI;
      }
      e.set(0, 0, ang);
      q.setFromEuler(e);
      m4.compose(new THREE.Vector3(x * MM, y * MM, 0), q, new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={inst} args={[undefined, undefined, N]} material={mat('black', v, xray)}>
      <boxGeometry args={[(Lc / N - 3) * MM, 16 * MM, 30 * MM]} />
    </instancedMesh>
  );
}

function Column({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const hi = rt?.detail !== 'low';
  return (
    <group>
      <Bx p={[0, 8, 0]} s={[w + 60, 16, d + 60]} m="anodised" v={v} x={xray} />
      <Bx p={[0, h / 2, 0]} s={[w, h, d]} m="profile" v={v} x={xray} cast />
      {hi && [-1, 1].map((s) => <Bx key={s} p={[(s * w) / 2, h / 2, 0]} s={[1, h - 20, 8]} m="black" v={v} x={xray} />)}
      <Bx p={[0, h + 4, 0]} s={[w + 6, 8, d + 6]} m="black" v={v} x={xray} />
    </group>
  );
}

/** Focus slide: rail plate, carriage, handwheel, clamp lever, scale. */
function ZSlide({ o, visual: v, xray }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <group>
      <Bx p={[0, h / 2, 0]} s={[w * 0.5, h, d]} m="anodised" v={v} x={xray} />
      <Bx p={[0, h * 0.7, d / 2 + 10]} s={[w, h * 0.35, 20]} m="aluminium" v={v} x={xray} />
      <Bx p={[-w * 0.3, h / 2, d / 2 + 1]} s={[8, h - 20, 1]} m="stainless" v={v} x={xray} />
      <mesh position={s3([w / 2 + 24, h - 20, 0])} rotation={[0, Math.PI / 2, 0]} material={mat('black', v, xray)}>
        <torusGeometry args={[26 * MM, 4 * MM, 8, 20]} />
      </mesh>
      <Cy p={[w / 2 + 12, h - 20, 0]} rad={4} len={24} m="steel" v={v} x={xray} axis="x" />
      <Bx p={[w / 2 + 4, h * 0.55, d / 2 + 10]} s={[10, 34, 10]} m="red" v={v} x={xray} />
    </group>
  );
}

/* ------------------------------------------------------------------ laser chain */

/** Fibre laser module: front panel, handles, LEDs, key switch, vent grilles, fibre outlet. */
function LaserSource({ o, visual: v, xray, live }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const hi = rt?.detail !== 'low';
  const emit = useRef<THREE.MeshStandardMaterial>(null);
  const li = rt?.model.lasers.findIndex((l) => l.sourceId === o.id) ?? -1;
  useFrame(() => {
    if (emit.current) emit.current.emissiveIntensity = li >= 0 && rt?.stateRef.current?.laserOn[li] ? 1.4 : 0.05;
  });
  return (
    <group>
      <Bx p={[0, h / 2, 0]} s={[w, h, d]} m="laser" v={v} x={xray} cast />
      <Bx p={[0, h / 2, d / 2 + 3]} s={[w, h, 6]} m="black" v={v} x={xray} />
      <Bx p={[0, h - 10, d / 2 + 6.5]} s={[w * 0.96, 4, 1]} m="accent" v={v} x={xray} />
      {hi &&
        [-1, 1].map((s) => (
          <group key={s}>
            <Bx p={[s * (w / 2 - 14), h / 2, d / 2 + 22]} s={[8, h * 0.62, 8]} m="stainless" v={v} x={xray} />
            <Bx p={[s * (w / 2 - 14), h * 0.19 + 2, d / 2 + 13]} s={[8, 8, 18]} m="stainless" v={v} x={xray} />
            <Bx p={[s * (w / 2 - 14), h * 0.81 - 2, d / 2 + 13]} s={[8, 8, 18]} m="stainless" v={v} x={xray} />
          </group>
        ))}
      {hi && <Cy p={[-w * 0.25, h * 0.55, d / 2 + 8]} rad={4} len={4} m="green" v="normal" em="#2fbf71" axis="z" seg={10} />}
      <mesh position={s3([-w * 0.18, h * 0.55, d / 2 + 8])} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[4 * MM, 4 * MM, 4 * MM, 10]} />
        <meshStandardMaterial ref={emit} color="#ff5a36" emissive="#ff3b1f" emissiveIntensity={0.05} />
      </mesh>
      {hi && <Cy p={[-w * 0.05, h * 0.55, d / 2 + 9]} rad={9} len={6} m="steel" v={v} x={xray} axis="z" />}
      {hi && <Cy p={[w * 0.28, h * 0.45, d / 2 + 16]} rad={14} len={26} m="black" v={v} x={xray} axis="z" />}
      {hi && Array.from({ length: 8 }, (_, i) => <Bx key={i} p={[w / 2 + 1, h * 0.25 + i * (h * 0.07), 0]} s={[2, 5, d * 0.7]} m="black" v={v} x={xray} />)}
      {live?.active && null}
    </group>
  );
}

function Collimator({ o, visual: v, xray }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <group>
      <Cy p={[0, h / 2, 0]} rad={w / 2 - 4} len={d * 0.6} m="black" v={v} x={xray} axis="z" />
      <Bx p={[0, h / 2, -d * 0.35]} s={[w, h, d * 0.3]} m="anodised" v={v} x={xray} />
      <Cy p={[0, h / 2, -d / 2 - 6]} rad={10} len={14} m="stainless" v={v} x={xray} axis="z" />
      {[-0.15, 0.2].map((k) => (
        <Cy key={k} p={[0, h / 2, d * k]} rad={w / 2} len={6} m="steel" v={v} x={xray} axis="z" />
      ))}
      <Bx p={[0, 4, 0]} s={[w + 10, 8, d * 0.5]} m="aluminium" v={v} x={xray} />
    </group>
  );
}

function BeamExpander({ o, visual: v, xray }: GenProps) {
  const [w, h, d] = o.size;
  const alongZ = d > w;
  const L = Math.max(w, d);
  return (
    <group>
      <Cy p={[0, h / 2, 0]} rad={h / 2.4} len={L * 0.8} m="black" v={v} x={xray} axis={alongZ ? 'z' : 'x'} rad2={h / 2.1} />
      {[-0.42, 0.42].map((k) => (
        <Cy key={k} p={alongZ ? [0, h / 2, L * k] : [L * k, h / 2, 0]} rad={h / 2} len={12} m="steel" v={v} x={xray} axis={alongZ ? 'z' : 'x'} />
      ))}
      <Bx p={[0, 5, 0]} s={alongZ ? [h * 0.9, 10, L * 0.4] : [L * 0.4, 10, h * 0.9]} m="aluminium" v={v} x={xray} />
    </group>
  );
}

/** Galvo scan head: housing, input aperture, connectors, status LED, two mirrors driven by the scan state. */
function Galvo({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const li = rt?.model.lasers.findIndex((l) => l.galvoId === o.id) ?? -1;
  const mx = useRef<THREE.Group>(null);
  const my = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const s = rt?.stateRef.current;
    const on = li >= 0 && !!s?.laserOn[li];
    const path = li >= 0 ? rt?.paths[li] : undefined;
    const wd = (li >= 0 ? rt?.model.lasers[li].wd : null) ?? 180;
    let ax = 0;
    let ay = 0;
    if (on && path) {
      const pt = pointAt(path, s!.scan[li]).p;
      ax = Math.atan(pt[0] / wd) / 2;
      ay = Math.atan(pt[1] / wd) / 2;
    }
    if (mx.current) mx.current.rotation.y = Math.PI / 4 + ax * 6;
    if (my.current) my.current.rotation.x = -Math.PI / 4 + ay * 6;
    if (led.current) led.current.emissiveIntensity = on ? 1.2 : 0.15;
  });
  const see = xray || rt?.enclosure === 'cutaway';
  return (
    <group>
      <Bx p={[0, h / 2, 0]} s={[w, h, d]} m="black" v={v} x={see} op={see ? 0.35 : 1} cast />
      <Bx p={[0, h + 3, 0]} s={[w + 10, 6, d + 10]} m="anodised" v={v} x={xray} />
      <Cy p={[0, h * 0.6, -d / 2 - 8]} rad={16} len={16} m="steel" v={v} x={xray} axis="z" />
      {[-1, 1].map((s) => (
        <Cy key={s} p={[w / 2 + 8, h * (0.4 + s * 0.15), 0]} rad={9} len={16} m="steel" v={v} x={xray} axis="x" />
      ))}
      <mesh position={s3([-w / 2 + 16, h - 14, d / 2 + 1])}>
        <circleGeometry args={[5 * MM, 16]} />
        <meshStandardMaterial ref={led} color="#35e0a1" emissive="#35e0a1" emissiveIntensity={0.15} />
      </mesh>
      {/* galvo motors + mirrors (seen through the housing in cutaway / x-ray) */}
      <group position={s3([0, h * 0.6, -d * 0.12])}>
        <Cy p={[0, 0, 0]} rad={9} len={40} m="steel" v={v} axis="y" />
        <group ref={mx} position={s3([0, -26, 0])}>
          <mesh material={mat('stainless', 'normal', false, 1, '#556')}>
            <boxGeometry args={s3([2, 16, 22])} />
          </mesh>
        </group>
      </group>
      <group position={s3([0, h * 0.35, d * 0.15])}>
        <Cy p={[w * 0.22, 0, 0]} rad={9} len={40} m="steel" v={v} axis="x" />
        <group ref={my}>
          <mesh material={mat('stainless', 'normal', false, 1, '#556')}>
            <boxGeometry args={s3([22, 2, 16])} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function FTheta({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h] = o.size;
  const hi = rt?.detail !== 'low';
  return (
    <group>
      <Cy p={[0, h * 0.55, 0]} rad={w / 2} len={h * 0.9} m="black" v={v} x={xray} rad2={w / 2.25} />
      {hi && [0.35, 0.7].map((k) => <Cy key={k} p={[0, h * k, 0]} rad={w / 2 + 2} len={8} m="anodised" v={v} x={xray} seg={32} />)}
      <Cy p={[0, h + 2, 0]} rad={w / 2.6} len={6} m="steel" v={v} x={xray} />
      <mesh position={s3([0, 2, 0])} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[(w / 2.6) * MM, 32]} />
        <meshStandardMaterial color={MAT.lens.color} transparent opacity={0.6} roughness={0.05} metalness={0.1} />
      </mesh>
    </group>
  );
}

function Nozzle({ o, visual: v, xray }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <group>
      <mesh position={s3([0, h / 2, 0])} rotation={[0, Math.PI / 4, 0]} material={mat('duct', v, xray)}>
        <cylinderGeometry args={[(w * 0.45) * MM, (w * 0.8) * MM, h * MM, 4]} />
      </mesh>
      <Cy p={[0, h + 10, 0]} rad={w * 0.4} len={20} m="duct" v={v} x={xray} />
      <Bx p={[0, h / 2, -d / 2]} s={[8, h, 8]} m="steel" v={v} x={xray} />
    </group>
  );
}

/* ------------------------------------------------------------------ vision */

function Camera({ o, visual: v, xray, live }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const hi = rt?.detail !== 'low';
  return (
    <group>
      <Bx p={[0, h / 2, 0]} s={[w, h, d]} m="anodised" v={v} x={xray} cast />
      {hi && Array.from({ length: 5 }, (_, i) => <Bx key={i} p={[-w / 2 - 3, h * 0.2 + i * (h * 0.15), 0]} s={[6, 4, d * 0.8]} m="black" v={v} x={xray} />)}
      <Bx p={[0, h + 5, 0]} s={[w * 0.8, 10, d * 0.8]} m="black" v={v} x={xray} />
      {hi && <Cy p={[w * 0.2, h + 18, 0]} rad={7} len={18} m="steel" v={v} x={xray} />}
      {hi && <Cy p={[-w * 0.2, h + 18, 0]} rad={6} len={18} m="polymer" v={v} x={xray} />}
      <mesh position={s3([w / 2 - 10, h - 10, d / 2 + 1])}>
        <circleGeometry args={[4 * MM, 12]} />
        <meshBasicMaterial color={live?.active ? '#35e0a1' : '#3a4449'} />
      </mesh>
    </group>
  );
}

function Lens({ o, visual: v, xray }: GenProps) {
  const [w, h] = o.size;
  const tele = !!o.params.telecentric;
  return (
    <group>
      <Cy p={[0, h / 2, 0]} rad={w / 2 - 2} len={h} m="black" v={v} x={xray} rad2={tele ? w / 1.3 : w / 2 - 2} />
      {[0.3, 0.65].map((k) => (
        <Cy key={k} p={[0, h * k, 0]} rad={w / 2 + 1} len={8} m="anodised" v={v} x={xray} seg={28} />
      ))}
      <mesh position={s3([0, 0.5, 0])} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[((tele ? w / 1.3 : w / 2) - 4) * MM, 24]} />
        <meshStandardMaterial color={MAT.lens.color} transparent opacity={0.55} roughness={0.05} />
      </mesh>
    </group>
  );
}

function RingLight({ o, visual: v, xray, live }: GenProps) {
  const rt = useRt();
  const [w, h] = o.size;
  const hi = rt?.detail !== 'low';
  const n = 16;
  const r = w / 2 - 14;
  return (
    <group position={s3([0, h / 2, 0])}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={mat('black', v, xray)}>
        <torusGeometry args={[r * MM, 12 * MM, 10, 36]} />
      </mesh>
      {hi &&
        Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * r * MM, -8 * MM, Math.sin(a) * r * MM]}>
              <sphereGeometry args={[3 * MM, 8, 8]} />
              <meshStandardMaterial color="#ff5a4a" emissive="#ff2a1a" emissiveIntensity={live?.active ? 1.6 : 0.08} />
            </mesh>
          );
        })}
    </group>
  );
}

/* ------------------------------------------------------------------ controls + electrical */

/** Electrical cabinet: plinth, door (transparent in x-ray), main switch, filter fans, warning label, rain roof. */
function Cabinet({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const hi = rt?.detail !== 'low';
  return (
    <group>
      <Bx p={[0, 50, 0]} s={[w, 100, d]} m="black" v={v} x={xray} />
      <Bx p={[0, 100 + (h - 100) / 2, -d / 2 + 20]} s={[w, h - 100, 40]} m="cabinet" v={v} x={xray} />
      {[-1, 1].map((s) => (
        <Bx key={s} p={[(s * w) / 2 - s * 1.5, 100 + (h - 100) / 2, 0]} s={[3, h - 100, d]} m="cabinet" v={v} x={xray} />
      ))}
      <Bx p={[0, h + 1.5, 0]} s={[w + 20, 3, d + 20]} m="cabinet" v={v} x={xray} />
      {/* mounting plate + DIN rails + ducts (visible through the door in x-ray) */}
      <Bx p={[0, 100 + (h - 100) / 2, -d / 2 + 45]} s={[w - 40, h - 160, 3]} m="stainless" v={v} x={xray} op={xray ? 0.6 : 1} />
      {hi && [0.3, 0.55, 0.8].map((k) => <Bx key={k} p={[0, h * k, -d / 2 + 52]} s={[w - 80, 8, 8]} m="steel" v={v} />)}
      {hi && [0.42, 0.67, 0.92].map((k) => <Bx key={k} p={[0, h * k, -d / 2 + 60]} s={[w - 80, 30, 30]} m="panel" v={v} op={xray ? 0.7 : 1} />)}
      {/* door (front, +z of the local frame; the cabinet is turned to face the service side) */}
      <Bx p={[0, 100 + (h - 100) / 2, d / 2 - 1.5]} s={[w - 6, h - 106, 3]} m="cabinet" v={v} x={xray} op={xray ? 0.12 : 1} />
      {hi && <Bx p={[w / 2 - 40, h * 0.5, d / 2 + 10]} s={[18, 140, 20]} m="black" v={v} x={xray} />}
      {hi && <Bx p={[-w / 2 + 90, h * 0.8, d / 2 + 2]} s={[90, 90, 4]} m="yellow" v={v} x={xray} />}
      {hi && <Cy p={[-w / 2 + 90, h * 0.8, d / 2 + 12]} rad={22} len={16} m="red" v={v} x={xray} axis="z" />}
      {hi && [0.25, 0.7].map((k) => <Bx key={k} p={[w * 0.1, h * k, d / 2 + 2]} s={[150, 150, 5]} m="polymer" v={v} x={xray} />)}
      {hi &&
        [0.25, 0.7].flatMap((k) =>
          Array.from({ length: 5 }, (_, i) => <Bx key={`${k}${i}`} p={[w * 0.1, h * k - 50 + i * 25, d / 2 + 5]} s={[130, 6, 2]} m="black" v={v} x={xray} />),
        )}
      {hi && (
        <mesh position={s3([w * 0.3, h * 0.88, d / 2 + 3])}>
          <circleGeometry args={[28 * MM, 3]} />
          <meshBasicMaterial color="#f2c200" />
        </mesh>
      )}
    </group>
  );
}

/** DIN-rail modules by type: PLC with I/O, drive with heatsink, PSU, controller, IPC. */
function Module({ o, visual: v, xray }: GenProps) {
  const [w, h, d] = o.size;
  const t = String(o.params.module ?? '');
  if (t === 'plc' || t === 'safety_plc')
    return (
      <group>
        {Array.from({ length: 5 }, (_, i) => (
          <Bx key={i} p={[-w / 2 + 15 + i * 30, h / 2, 0]} s={[26, h * 0.7, d]} m={t === 'safety_plc' ? 'yellow' : 'panel'} v={v} x={xray} />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <Bx key={`l${i}`} p={[-w / 2 + 15 + i * 30, h * 0.7, d / 2 + 1]} s={[18, 4, 2]} m="green" v={v} em="#2fbf71" />
        ))}
      </group>
    );
  if (t === 'servo_drive')
    return (
      <group>
        <Bx p={[0, h / 2, 0]} s={[w * 0.6, h, d]} m="black" v={v} x={xray} />
        {Array.from({ length: 6 }, (_, i) => (
          <Bx key={i} p={[-w * 0.3 + i * (w * 0.12), h / 2, -d / 2 - 8]} s={[4, h * 0.8, 16]} m="aluminium" v={v} x={xray} />
        ))}
        <Bx p={[0, h * 0.8, d / 2 + 1]} s={[w * 0.35, 20, 2]} m="black" v="normal" em="#0e4d48" />
      </group>
    );
  if (t === 'smps') return <Bx p={[0, h * 0.4, 0]} s={[w * 0.7, h * 0.8, d * 0.8]} m="stainless" v={v} x={xray} />;
  return (
    <group>
      <Bx p={[0, h / 2, 0]} s={[w, h, d]} m={t === 'ipc' ? 'black' : 'polymer'} v={v} x={xray} />
      {t === 'ipc' && Array.from({ length: 8 }, (_, i) => <Bx key={i} p={[-w / 2 + 10 + i * (w / 8), h / 2, d / 2 + 3]} s={[4, h * 0.8, 6]} m="anodised" v={v} x={xray} />)}
      <Bx p={[w * 0.3, h * 0.85, d / 2 + 1]} s={[10, 6, 2]} m="green" v="normal" em="#2fbf71" />
    </group>
  );
}

/** Operator panel on a swing arm; the screen is a live canvas texture from the central state (§111). */
function Hmi({ o, visual: v, xray, live }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 360;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (!tex || clock.elapsedTime - last.current < 0.25) return;
    last.current = clock.elapsedTime;
    const c = tex.image as HTMLCanvasElement;
    const g = c.getContext('2d');
    if (!g) return;
    const s = rt?.stateRef.current;
    g.fillStyle = '#0b1214';
    g.fillRect(0, 0, 512, 360);
    g.fillStyle = '#00a99d';
    g.fillRect(0, 0, 512, 44);
    g.fillStyle = '#031f1d';
    g.font = '600 22px sans-serif';
    g.fillText('TEAL · HMI (concept)', 14, 30);
    const state = s ? s.machineState.toUpperCase() : 'READY';
    g.fillStyle = state === 'FAULT' ? '#ff6b6b' : '#35e0a1';
    g.font = '700 34px monospace';
    g.fillText(state, 14, 96);
    g.fillStyle = '#c9d3d3';
    g.font = '22px monospace';
    g.fillText(`GOOD ${s?.ok ?? 0}   NG ${s?.ng ?? 0}`, 14, 140);
    g.fillText(`UPH  ${s?.uphSoFar != null ? s.uphSoFar.toFixed(0) : '—'}`, 14, 172);
    g.fillText(`t    ${(s?.t ?? 0).toFixed(1)} s`, 14, 204);
    const busy = s?.stations.flatMap((st) => st.servers.filter((x) => x.state === 'busy' && x.step).map((x) => x.step!.name)) ?? [];
    g.fillStyle = '#8d9a9a';
    g.font = '18px sans-serif';
    g.fillText((busy[0] ?? 'Waiting').slice(0, 42), 14, 244);
    g.fillText(`Recipe: ${(rt?.hmi.recipe ?? '—').slice(0, 36)}`, 14, 276);
    if (s?.alarms.length) {
      g.fillStyle = '#e5484d';
      g.fillRect(0, 300, 512, 60);
      g.fillStyle = '#fff';
      g.fillText(`ALARM: ${s.alarms[0].text}`.slice(0, 46), 14, 338);
    }
    tex.needsUpdate = true;
  });
  const hi = rt?.detail !== 'low';
  return (
    <group>
      {/* swing arm down to the enclosure */}
      {hi && <Cy p={[w / 2 + 30, -140, -d / 2 - 30]} rad={14} len={300} m="stainless" v={v} x={xray} />}
      {hi && <Bx p={[w / 2 + 15, h * 0.3, -d / 2 - 20]} s={[50, 30, 40]} m="stainless" v={v} x={xray} />}
      <group rotation={[-0.2, 0, 0]}>
        <Bx p={[0, h / 2, 0]} s={[w, h, d]} m="black" v={v} x={xray} cast />
        <mesh position={s3([0, h / 2 + 12, d / 2 + 1])}>
          <planeGeometry args={[(w - 30) * MM, (h - 70) * MM]} />
          {tex ? <meshBasicMaterial map={tex} toneMapped={false} /> : <meshBasicMaterial color={live?.tower === 'red' ? '#4a1416' : '#0b3a37'} />}
        </mesh>
        {[
          ['#2fbf71', -60],
          ['#e5484d', 0],
          ['#3b82f6', 60],
        ].map(([c, x]) => (
          <mesh key={String(c)} position={s3([Number(x), 20, d / 2 + 4])} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[11 * MM, 11 * MM, 8 * MM, 16]} />
            <meshStandardMaterial color={String(c)} roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function EStop({ o, visual: v, xray }: GenProps) {
  const [w, h] = o.size;
  return (
    <group>
      <Bx p={[0, h * 0.3, 0]} s={[w, h * 0.6, w]} m="yellow" v={v} x={xray} />
      <Cy p={[0, h * 0.62, 0]} rad={w * 0.3} len={h * 0.08} m="black" v={v} x={xray} />
      <Cy p={[0, h * 0.78, 0]} rad={w * 0.42} len={h * 0.22} m="red" v={v} x={xray} rad2={w * 0.36} />
    </group>
  );
}

function Tower({ o, live }: GenProps) {
  const [w, h] = o.size;
  const seg = h / 5;
  const on = live?.tower ?? 'off';
  const colors: ['red' | 'amber' | 'green', string][] = [
    ['green', '#2fbf71'],
    ['amber', '#f5a524'],
    ['red', '#e5484d'],
  ];
  return (
    <group>
      <Bx p={[0, 6, 0]} s={[w + 20, 12, w + 20]} m="black" />
      <Cy p={[0, seg / 2 + 12, 0]} rad={w / 5} len={seg} m="stainless" />
      {colors.map(([k, c], i) => (
        <mesh key={k} position={s3([0, seg * (i + 1.5) + 12, 0])}>
          <cylinderGeometry args={[(w / 2) * MM, (w / 2) * MM, (seg - 6) * MM, 20]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={on === k ? 1.2 : 0.02} transparent opacity={on === k ? 1 : 0.5} />
        </mesh>
      ))}
      <Cy p={[0, seg * 4.2 + 12, 0]} rad={w / 2} len={seg * 0.4} m="black" />
    </group>
  );
}

function Sensor({ o, visual: v, xray, live }: GenProps) {
  const [w, h, d] = o.size;
  if (h > 250)
    return (
      <group>
        <Bx p={[0, h / 2, 0]} s={[w, h, d]} m="yellow" v={v} x={xray} />
        <Bx p={[w / 2 + 1, h / 2, 0]} s={[2, h - 60, d * 0.5]} m="black" v={v} x={xray} em="#3a0c0c" />
      </group>
    );
  return (
    <group>
      <Bx p={[0, h / 2, 0]} s={[w, h, d]} m="polymer" v={v} x={xray} em={live?.active ? '#f5a524' : undefined} />
      <Cy p={[0, h * 0.7, d / 2 + 2]} rad={Math.min(w, h) * 0.2} len={4} m="black" v={v} x={xray} axis="z" />
      <Bx p={[w * 0.3, h - 4, d / 2 + 1]} s={[5, 3, 2]} m="yellow" v="normal" em="#f5a524" />
    </group>
  );
}

function Bin({ o, visual: v, xray }: GenProps) {
  const [w, h, d] = o.size;
  const ok = !!o.params.ok;
  return (
    <group>
      <Bx p={[0, 4, 0]} s={[w, 8, d]} m="polymer" v={v} x={xray} />
      {[-1, 1].map((s) => (
        <Bx key={`x${s}`} p={[(s * w) / 2, h / 2, 0]} s={[6, h, d]} m="polymer" v={v} x={xray} />
      ))}
      {[-1, 1].map((s) => (
        <Bx key={`z${s}`} p={[0, h / 2, (s * d) / 2]} s={[w, h, 6]} m="polymer" v={v} x={xray} />
      ))}
      <Bx p={[0, h - 30, d / 2 + 4]} s={[w * 0.8, 28, 2]} m={ok ? 'green' : 'red'} v={v} x={xray} />
      {!ok && <Bx p={[w * 0.3, h + 10, d / 2 - 10]} s={[20, 24, 10]} m="steel" v={v} x={xray} />}
    </group>
  );
}

function Chiller({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const hi = rt?.detail !== 'low';
  const fume = o.kind === 'fume';
  return (
    <group>
      <Bx p={[0, h / 2 + 30, 0]} s={[w, h - 60, d]} m="cabinet" v={v} x={xray} cast />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Cy key={`${sx}${sz}`} p={[sx * (w / 2 - 30), 18, sz * (d / 2 - 30)]} rad={18} len={20} m="rubber" v={v} x={xray} axis="x" />))}
      <Bx p={[0, h * 0.45, d / 2 + 2]} s={[w * 0.8, h * 0.5, 4]} m="panel" v={v} x={xray} />
      {hi && [-1, 1].map((s) => <Bx key={s} p={[s * w * 0.3, h * 0.45, d / 2 + 10]} s={[14, 70, 14]} m="black" v={v} x={xray} />)}
      <Bx p={[0, h * 0.82, d / 2 + 3]} s={[w * 0.5, 60, 4]} m="black" v={v} x={xray} em="#0e4d48" />
      {fume ? <Cy p={[0, h + 30, 0]} rad={45} len={60} m="duct" v={v} x={xray} /> : hi && [-1, 1].map((s) => <Cy key={s} p={[s * 40, h * 0.3, -d / 2 - 12]} rad={10} len={24} m={s < 0 ? 'blue' : 'red'} v={v} x={xray} axis="z" />)}
      {hi && Array.from({ length: 6 }, (_, i) => <Bx key={i} p={[w / 2 + 1, h * 0.3 + i * 40, 0]} s={[2, 10, d * 0.7]} m="black" v={v} x={xray} />)}
    </group>
  );
}

function Frl({ o, visual: v, xray }: GenProps) {
  const [w, h] = o.size;
  return (
    <group>
      <Bx p={[0, h / 2, -20]} s={[w, h, 10]} m="steel" v={v} x={xray} />
      <Bx p={[0, h * 0.7, 10]} s={[w * 0.7, 50, 50]} m="polymer" v={v} x={xray} />
      <mesh position={s3([0, h * 0.35, 10])} material={mat('lens', 'normal', false, 0.5)}>
        <cylinderGeometry args={[20 * MM, 16 * MM, 80 * MM, 16]} />
      </mesh>
      <Cy p={[0, h * 0.7, 40]} rad={20} len={8} m="stainless" v={v} x={xray} axis="z" />
      <Bx p={[0, h * 0.9, 10]} s={[30, 26, 30]} m="blue" v={v} x={xray} />
    </group>
  );
}

function Valve({ o, visual: v, xray }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <group>
      <Bx p={[0, 15, 0]} s={[w, 30, d]} m="aluminium" v={v} x={xray} />
      {Array.from({ length: 4 }, (_, i) => (
        <group key={i}>
          <Bx p={[-w / 2 + 30 + i * 50, 30 + (h - 30) / 2, 0]} s={[40, h - 30, d * 0.7]} m="blue" v={v} x={xray} />
          <Bx p={[-w / 2 + 30 + i * 50, h + 4, 0]} s={[30, 8, 30]} m="black" v={v} x={xray} />
        </group>
      ))}
    </group>
  );
}

/** Conceptual operator figure — position only, not an ergonomic model (§109). */
function Operator({ o, visual: v }: GenProps) {
  const [, h] = o.size;
  const m: MatKey = 'person';
  return (
    <group>
      {[-1, 1].map((s) => (
        <Cy key={s} p={[s * 55, h * 0.24, 0]} rad={46} len={h * 0.48} m={m} v={v} op={0.85} seg={12} />
      ))}
      <Cy p={[0, h * 0.62, 0]} rad={130} len={h * 0.34} m={m} v={v} op={0.85} seg={16} rad2={110} />
      <mesh position={s3([0, h * 0.9, 0])} material={mat(m, v, false, 0.85)}>
        <sphereGeometry args={[95 * MM, 16, 12]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={s3([s * 150, h * 0.62, -120])} rotation={[-1.1, 0, 0]} material={mat(m, v, false, 0.85)}>
          <cylinderGeometry args={[34 * MM, 30 * MM, h * 0.36 * MM, 10]} />
        </mesh>
      ))}
    </group>
  );
}

function Generic({ o, visual: v, xray, live }: GenProps) {
  const [w, h, d] = o.size;
  if (o.params.shape === 'servo') return <Servo o={o} visual={v} xray={xray} />;
  if (o.params.shape === 'lens') return <Lens o={o} visual={v} xray={xray} />;
  if (o.params.module) return <Module o={o} visual={v} xray={xray} />;
  if (o.params.marker)
    return (
      <mesh position={s3([0, 1, 0])} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * MM, d * MM]} />
        <meshBasicMaterial color="#00a99d" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    );
  return <Bx p={[0, h / 2, 0]} s={[w, h, d]} m={o.layer === 'Electrical' || o.layer === 'Controls' ? 'polymer' : o.layer === 'Laser' ? 'anodised' : 'aluminium'} v={v} x={xray} em={live?.active ? '#0e4d48' : undefined} cast />;
}

/* ------------------------------------------------------------------ handling, tooling, test (every station kind) */

/** Live server of the object's station (first busy one, or the server index in params). */
function liveServer(rt: TwinRuntime | null, o: Machine3DObject) {
  const s = rt?.stateRef.current;
  const st = s?.stations.find((x) => x.key === o.stationKey);
  if (!st) return null;
  const idx = o.params.server != null ? Number(o.params.server) : -1;
  return (idx >= 0 ? st.servers[idx] : st.servers.find((x) => x.state === 'busy')) ?? st.servers[0] ?? null;
}
/** Progress through the station's working step (0 while moving in / idle). */
function workProgress(rt: TwinRuntime | null, o: Machine3DObject): number {
  const sv = liveServer(rt, o);
  if (!sv || sv.state !== 'busy' || !sv.step || sv.step.kind === 'move') return 0;
  return sv.stepProgress;
}

/** Conveyor with side rails, end rollers, drive motor and a belt that runs while parts are on it. */
function Conveyor({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const slots = Number(o.params.slots ?? 0);
  const lanes = Math.max(1, Number(o.params.lanes ?? 1));
  const N = rt?.detail === 'low' ? 0 : Math.max(6, Math.round(w / 45));
  const stripes = useRef<THREE.Group>(null);
  const off = useRef(0);
  const roll = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((_, dt) => {
    const s = rt?.stateRef.current;
    const st = s?.stations.find((x) => x.key === o.stationKey);
    const running = !!st && (st.queue > 0 || st.servers.some((x) => x.state === 'busy' && x.step?.kind !== 'laser' && x.step?.kind !== 'vision' && x.step?.kind !== 'inspect'));
    if (running && !rt?.reduced) off.current = (off.current + dt * 120) % (w / Math.max(1, N));
    if (stripes.current) stripes.current.position.x = off.current * MM;
    roll.current.forEach((r) => r && running && !rt?.reduced && (r.rotation.x -= dt * 6));
  });
  return (
    <group>
      <Bx p={[0, h - 6, 0]} s={[w, 6, d - 30]} m="rubber" v={v} x={xray} />
      <group ref={stripes}>
        {Array.from({ length: N }, (_, i) => (
          <Bx key={i} p={[-w / 2 + (i + 0.5) * (w / N) - w / N / 2, h - 2.5, 0]} s={[4, 1, d - 36]} m="black" v={v} x={xray} />
        ))}
      </group>
      {[-1, 1].map((sz) => (
        <group key={sz}>
          <Bx p={[0, h / 2, (sz * d) / 2]} s={[w, h, 14]} m="aluminium" v={v} x={xray} />
          <Bx p={[0, h + 12, (sz * d) / 2]} s={[w, 20, 6]} m="polymer" v={v} x={xray} />
        </group>
      ))}
      {[-1, 1].map((sx, i) => (
        <mesh key={sx} ref={(m) => (roll.current[i] = m)} position={s3([(sx * (w - 30)) / 2, h - 14, 0])} rotation={[Math.PI / 2, 0, 0]} material={mat('steel', v, xray)}>
          <cylinderGeometry args={[14 * MM, 14 * MM, (d - 30) * MM, 16]} />
        </mesh>
      ))}
      <Cy p={[w / 2 - 40, h / 2 - 20, d / 2 + 50]} rad={30} len={90} m="polymer" v={v} x={xray} axis="z" />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Bx key={`${sx}${sz}`} p={[sx * (w / 2 - 30), 0, sz * (d / 2 - 10)]} s={[30, 1, 30]} m="steel" v={v} x={xray} />))}
      {slots > 0 &&
        Array.from({ length: slots }, (_, i) => (
          <Bx key={`s${i}`} p={[-w / 2 + ((i + 0.5) * w) / slots, h + 14, -d / 2 + 10]} s={[10, 26, 10]} m="accent" v={v} x={xray} />
        ))}
      {/* lane guides between parallel nests */}
      {Array.from({ length: lanes - 1 }, (_, i) => (
        <Bx key={`l${i}`} p={[0, h + 10, (i + 1 - lanes / 2) * LANE_PITCH]} s={[w - 40, 16, 6]} m="polymer" v={v} x={xray} />
      ))}
    </group>
  );
}

/** Portal / bridge frame over the conveyor (tool stations, head gantry). */
function Bridge({ o, visual: v, xray }: GenProps) {
  const [w, h, d] = o.size;
  const alongX = o.params.beam === 'x';
  const t = 50;
  return (
    <group>
      {alongX
        ? [-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Bx key={`${sx}${sz}`} p={[sx * (w / 2 - t / 2), h / 2, sz * (d / 2 - t / 2)]} s={[t, h, t]} m="profile" v={v} x={xray} cast />))
        : [-1, 1].map((sz) => <Bx key={sz} p={[0, h / 2, sz * (d / 2 - t / 2)]} s={[t * 1.4, h, t]} m="profile" v={v} x={xray} cast />)}
      {alongX ? (
        [-1, 1].map((sz) => <Bx key={sz} p={[0, h - t / 2, sz * (d / 2 - t / 2)]} s={[w, t, t]} m="profile" v={v} x={xray} />)
      ) : (
        <Bx p={[0, h - t / 2, 0]} s={[t * 1.4, t, d]} m="profile" v={v} x={xray} />
      )}
      {alongX && <Bx p={[0, h - t - 8, -d / 2 + t / 2]} s={[w - 2 * t, 16, 20]} m="stainless" v={v} x={xray} />}
      {!!o.params.rods &&
        [-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Cy key={`${sx}${sz}`} p={[sx * 60, h * 0.6, sz * 40]} rad={8} len={h * 0.8} m="stainless" v={v} x={xray} />))}
    </group>
  );
}

/** Tool head on a Z slide: press ram, screwdriver, dispense valve, saw, print, bond or pack head. */
function Tool({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h] = o.size;
  const tool = String(o.params.tool ?? 'generic');
  const stroke = Number(o.params.stroke ?? 40);
  const trav = Number(o.params.traverse ?? 0);
  const g = useRef<THREE.Group>(null);
  const blade = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    const u = workProgress(rt, o);
    const z = toolStroke(u);
    if (g.current) {
      g.current.position.y = -stroke * z * MM;
      g.current.position.x = trav && z > 0.99 ? (u - 0.5) * trav * MM : g.current.position.x * 0.9;
    }
    if (blade.current && u > 0 && !rt?.reduced) blade.current.rotation.z += dt * 30;
  });
  return (
    <group>
      {/* fixed Z slide up to the bridge beam */}
      <Bx p={[0, h + 60, -30]} s={[w * 0.7, 200, 16]} m="anodised" v={v} x={xray} />
      <group ref={g}>
        {tool === 'dispense' ? (
          <>
            <mesh position={s3([0, h * 0.6, 0])} material={mat('lens', 'normal', false, 0.55)}>
              <cylinderGeometry args={[16 * MM, 16 * MM, 110 * MM, 20]} />
            </mesh>
            <Cy p={[0, h * 0.6 + 62, 0]} rad={18} len={16} m="blue" v={v} x={xray} />
            <Cy p={[0, h * 0.25, 0]} rad={5} len={60} m="stainless" v={v} x={xray} rad2={1.5} />
          </>
        ) : tool === 'screw' ? (
          <>
            <Cy p={[0, h * 0.7, 0]} rad={26} len={110} m="black" v={v} x={xray} />
            <Cy p={[0, h * 0.35, 0]} rad={10} len={60} m="steel" v={v} x={xray} />
            <Cy p={[0, h * 0.12, 0]} rad={3} len={40} m="stainless" v={v} x={xray} />
          </>
        ) : tool === 'saw' ? (
          <>
            <Cy p={[0, h * 0.7, 0]} rad={30} len={100} m="laser" v={v} x={xray} axis="x" />
            <mesh ref={blade} position={s3([30, h * 0.35, 0])} rotation={[0, Math.PI / 2, 0]} material={mat('stainless', v, xray)}>
              <cylinderGeometry args={[45 * MM, 45 * MM, 1.5 * MM, 32]} />
            </mesh>
          </>
        ) : (
          <>
            <Bx p={[0, h * 0.62, 0]} s={[w, h * 0.5, w]} m={tool === 'print' ? 'polymer' : tool === 'bond' ? 'laser' : 'steel'} v={v} x={xray} cast />
            <Bx p={[0, h * 0.28, 0]} s={tool === 'press' ? [w * 0.9, 24, w * 0.9] : tool === 'pack' ? [w * 1.2, 10, w * 1.2] : [w * 0.4, 30, w * 0.4]} m={tool === 'pack' ? 'rubber' : 'stainless'} v={v} x={xray} />
            {tool === 'pack' && [-1, 1].map((sx) => <Cy key={sx} p={[sx * 25, h * 0.24, 0]} rad={9} len={8} m="rubber" v={v} x={xray} />)}
          </>
        )}
      </group>
    </group>
  );
}

/** Test head: platen with spring probes, descends onto the part during the test step. */
function TestHead({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const stroke = Number(o.params.stroke ?? 60);
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.position.y = -stroke * toolStroke(workProgress(rt, o)) * MM;
  });
  const pins = rt?.detail === 'low' ? [] : Array.from({ length: 12 }, (_, i) => [((i % 4) - 1.5) * (w / 5), (Math.floor(i / 4) - 1) * (d / 4)]);
  return (
    <group ref={g}>
      <Bx p={[0, h / 2 + 10, 0]} s={[w, h - 20, d]} m="polymer" v={v} x={xray} cast />
      <Bx p={[0, h + 4, 0]} s={[w * 0.5, 12, d * 0.5]} m="steel" v={v} x={xray} />
      {pins.map(([px, pz], i) => (
        <Cy key={i} p={[px, 2, pz]} rad={1.6} len={24} m="copper" v={v} x={xray} seg={8} />
      ))}
    </group>
  );
}

/** Pneumatic pusher / diverter: the rod extends across the conveyor only for a rejected (NG) part. */
function Pusher({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const stroke = Number(o.params.stroke ?? 150);
  const rod = useRef<THREE.Group>(null);
  useFrame(() => {
    // fires only for a part the run rejects at this station — a PASS part rides straight through
    const sv = liveServer(rt, o);
    const u = sv?.ng ? workProgress(rt, o) : 0;
    if (rod.current) rod.current.position.z = stroke * PUSH_SHARE * toolStroke(u) * MM;
  });
  return (
    <group>
      <Cy p={[0, h / 2, 0]} rad={w / 2 - 6} len={d} m="aluminium" v={v} x={xray} axis="z" />
      <group ref={rod}>
        <Cy p={[0, h / 2, d / 2 + 30]} rad={6} len={60} m="stainless" v={v} x={xray} axis="z" />
        <Bx p={[0, h / 2, d / 2 + 64]} s={[w * 1.4, h * 0.9, 8]} m="polymer" v={v} x={xray} />
      </group>
    </group>
  );
}

/** Magazine / stacker at the infeed or outfeed; the outfeed stack grows with completed parts. */
function Magazine({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const role = o.params.role;
  const stack = useRef<(THREE.Mesh | null)[]>([]);
  const N = 12;
  useFrame(() => {
    const s = rt?.stateRef.current;
    const n = role === 'out' ? Math.min(N, (s?.ok ?? 0) % (N + 1)) : N - Math.min(N - 2, Math.floor(workProgress(rt, o) * 2));
    stack.current.forEach((m, i) => m && (m.visible = i < n));
  });
  return (
    <group>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Cy key={`${sx}${sz}`} p={[sx * (w / 2), h / 2, sz * (d / 2)]} rad={5} len={h} m="stainless" v={v} x={xray} seg={8} />))}
      <Bx p={[0, 4, 0]} s={[w + 20, 8, d + 20]} m="anodised" v={v} x={xray} />
      {Array.from({ length: N }, (_, i) => (
        <mesh key={i} ref={(m) => (stack.current[i] = m)} position={s3([0, 14 + i * 16, 0])} material={mat('panel', v, xray)}>
          <boxGeometry args={s3([w - 16, 10, d - 16])} />
        </mesh>
      ))}
    </group>
  );
}

function Tray({ o, visual: v, xray }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <group>
      <Bx p={[0, h * 0.3, 0]} s={[w, h * 0.6, d]} m="polymer" v={v} x={xray} />
      {Array.from({ length: 6 }, (_, i) => (
        <Bx key={i} p={[((i % 3) - 1) * (w / 3.3), h * 0.6 + 6, (Math.floor(i / 3) - 0.5) * (d / 2.2)]} s={[w / 5, 12, d / 4]} m="copper" v={v} x={xray} />
      ))}
    </group>
  );
}

function Bench({ o, visual: v, xray }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <group>
      <Bx p={[0, h - 15, 0]} s={[w, 30, d]} m="panel" v={v} x={xray} cast />
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Bx key={`${sx}${sz}`} p={[sx * (w / 2 - 25), (h - 30) / 2, sz * (d / 2 - 25)]} s={[40, h - 30, 40]} m="profile" v={v} x={xray} />))}
      <Bx p={[0, h + 520, -d / 2 + 20]} s={[w * 0.8, 20, 60]} m="black" v="normal" em="#f4f9f8" />
      {[-1, 1].map((sx) => <Bx key={sx} p={[sx * (w / 2 - 25), h + 260, -d / 2 + 20]} s={[30, 520, 30]} m="profile" v={v} x={xray} />)}
    </group>
  );
}

/** SCARA robot: base, column, shoulder + elbow links (planar IK), quill and gripper; follows the pick-and-place cycle. */
function Robot({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h] = o.size;
  const L1 = Number(o.params.L1 ?? 250);
  const L2 = Number(o.params.L2 ?? 250);
  const armY = h * 0.92;
  const a1 = useRef<THREE.Group>(null);
  const a2 = useRef<THREE.Group>(null);
  const quill = useRef<THREE.Group>(null);
  const fingers = useRef<(THREE.Mesh | null)[]>([]);
  const comp = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const hd = rt?.model.handlers[o.stationKey ?? ''];
    let t1 = Math.PI / 2;
    let t2 = -Math.PI / 2;
    let drop = 60;
    let holding = false;
    if (hd && hd.objectId === o.id) {
      const pose = pickPlacePose(hd.pp, workProgress(rt, o));
      const ik = scaraIK(pose.tcp[0] - o.position[0], pose.tcp[2] - o.position[2], L1, L2, 1);
      t1 = ik.t1;
      t2 = ik.t2;
      drop = o.position[1] + armY - pose.tcp[1];
      holding = pose.holding;
    }
    if (a1.current) a1.current.rotation.y = -t1;
    if (a2.current) a2.current.rotation.y = -t2;
    if (quill.current) quill.current.position.y = -Math.max(40, drop) * MM;
    fingers.current.forEach((f, i) => f && (f.position.x = (i ? 1 : -1) * (holding ? 9 : 16) * MM));
    if (comp.current) comp.current.visible = holding && hd?.carries === 'component';
  });
  return (
    <group>
      <Cy p={[0, 30, 0]} rad={w / 2} len={60} m="laser" v={v} x={xray} />
      <Cy p={[0, 60 + (armY - 60) / 2, 0]} rad={w / 3} len={armY - 60} m="laser" v={v} x={xray} />
      <group ref={a1} position={s3([0, armY, 0])}>
        <Bx p={[L1 / 2, 0, 0]} s={[L1 + 70, 60, 90]} m="laser" v={v} x={xray} cast />
        <Cy p={[0, 0, 0]} rad={48} len={70} m="black" v={v} x={xray} />
        <group ref={a2} position={s3([L1, 36, 0])}>
          <Bx p={[L2 / 2, 0, 0]} s={[L2 + 60, 44, 70]} m="laser" v={v} x={xray} cast />
          <Cy p={[0, 0, 0]} rad={38} len={52} m="black" v={v} x={xray} />
          <Cy p={[L2, 20, 0]} rad={20} len={60} m="black" v={v} x={xray} />
          <group ref={quill} position={s3([L2, -60, 0])}>
            <Cy p={[0, 100, 0]} rad={9} len={220} m="stainless" v={v} x={xray} />
            <Bx p={[0, -6, 0]} s={[46, 16, 30]} m="black" v={v} x={xray} />
            {[0, 1].map((i) => (
              <mesh key={i} ref={(m) => (fingers.current[i] = m)} position={s3([i ? 16 : -16, -26, 0])} material={mat('steel', v, xray)}>
                <boxGeometry args={s3([6, 30, 18])} />
              </mesh>
            ))}
            <mesh ref={comp} position={s3([0, -44, 0])} material={mat('copper', 'normal')} visible={false}>
              <boxGeometry args={s3([22, 10, 16])} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/**
 * Six-axis articulated robot (conceptual): base, turret (J1), upper arm (J2), forearm (J3), wrist (J4–J6
 * drawn as one pitch joint keeping the tool vertical), flange and gripper. Follows the pick-and-place
 * cycle with articulated IK. Chosen when the robot record states 5 or more axes.
 */
function ArticulatedRobot({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w] = o.size;
  const L1 = Number(o.params.L1 ?? 300);
  const L2 = Number(o.params.L2 ?? 300);
  const turret = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Group>(null);
  const fore = useRef<THREE.Group>(null);
  const wrist = useRef<THREE.Group>(null);
  const fingers = useRef<(THREE.Mesh | null)[]>([]);
  const comp = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const hd = rt?.model.handlers[o.stationKey ?? ''];
    let j = { yaw: Math.PI / 2, shoulder: 1.1, elbow: -1.9, wrist: -(1.1 - 1.9) - Math.PI / 2 };
    let holding = false;
    if (hd && hd.objectId === o.id) {
      const pose = pickPlacePose(hd.pp, workProgress(rt, o));
      const ik = articulatedIK(pose.tcp[0] - o.position[0], pose.tcp[1] - (o.position[1] + ARM_SHOULDER), pose.tcp[2] - o.position[2], L1, L2, ARM_TOOL);
      j = ik;
      holding = pose.holding;
    }
    if (turret.current) turret.current.rotation.y = -j.yaw;
    if (upper.current) upper.current.rotation.z = j.shoulder;
    if (fore.current) fore.current.rotation.z = j.elbow;
    if (wrist.current) wrist.current.rotation.z = j.wrist;
    fingers.current.forEach((f, i) => f && (f.position.z = (i ? 1 : -1) * (holding ? 9 : 16) * MM));
    if (comp.current) comp.current.visible = holding && hd?.carries === 'component';
  });
  return (
    <group>
      <Cy p={[0, 25, 0]} rad={w / 2} len={50} m="laser" v={v} x={xray} />
      <group ref={turret} position={s3([0, 50, 0])}>
        <Cy p={[0, 60, 0]} rad={w / 2.6} len={120} m="laser" v={v} x={xray} />
        <Bx p={[0, 170, 0]} s={[110, 140, 120]} m="laser" v={v} x={xray} cast />
        <group ref={upper} position={s3([0, ARM_SHOULDER - 50, 0])}>
          <Cy p={[0, 0, 0]} rad={52} len={140} m="black" v={v} x={xray} axis="z" />
          <Bx p={[L1 / 2, 0, 0]} s={[L1 + 40, 70, 90]} m="laser" v={v} x={xray} cast />
          <group ref={fore} position={s3([L1, 0, 0])}>
            <Cy p={[0, 0, 0]} rad={42} len={120} m="black" v={v} x={xray} axis="z" />
            <Bx p={[L2 / 2, 0, 0]} s={[L2 + 30, 54, 70]} m="laser" v={v} x={xray} cast />
            <group ref={wrist} position={s3([L2, 0, 0])}>
              <Cy p={[0, 0, 0]} rad={30} len={90} m="black" v={v} x={xray} axis="z" />
              <Bx p={[ARM_TOOL * 0.35, 0, 0]} s={[ARM_TOOL * 0.5, 40, 40]} m="aluminium" v={v} x={xray} />
              <Bx p={[ARM_TOOL * 0.72, 0, 0]} s={[16, 50, 36]} m="black" v={v} x={xray} />
              {[0, 1].map((i) => (
                <mesh key={i} ref={(m) => (fingers.current[i] = m)} position={s3([ARM_TOOL * 0.9, 0, i ? 16 : -16])} material={mat('steel', v, xray)}>
                  <boxGeometry args={s3([30, 18, 6])} />
                </mesh>
              ))}
              <mesh ref={comp} position={s3([ARM_TOOL + 4, 0, 0])} material={mat('copper', 'normal')} visible={false}>
                <boxGeometry args={s3([10, 22, 16])} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

/** Robot generator: articulated arm when the record states ≥ 5 axes, SCARA otherwise. */
function RobotAny(p: GenProps) {
  return Number(p.o.params.axes ?? 0) >= 5 ? <ArticulatedRobot {...p} /> : <Robot {...p} />;
}

/** Pick-and-place gantry: portal, X carriage, Z quill and gripper; the part it carries is drawn by the material flow. */
function GantryPP({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h, d] = o.size;
  const car = useRef<THREE.Group>(null);
  const quill = useRef<THREE.Group>(null);
  const fingers = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const hd = rt?.model.handlers[o.stationKey ?? ''];
    if (!hd) return;
    const pose = pickPlacePose(hd.pp, workProgress(rt, o));
    if (car.current) car.current.position.x = (pose.tcp[0] - o.position[0]) * MM;
    if (quill.current) quill.current.position.y = (pose.tcp[1] - o.position[1]) * MM;
    fingers.current.forEach((f, i) => f && (f.position.x = (i ? 1 : -1) * (pose.holding ? 12 : 22) * MM));
  });
  return (
    <group>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Bx key={`${sx}${sz}`} p={[sx * (w / 2 - 25), h / 2, sz * (d / 2 - 25)]} s={[50, h, 50]} m="profile" v={v} x={xray} cast />))}
      {[-1, 1].map((sz) => <Bx key={sz} p={[0, h - 25, sz * (d / 2 - 25)]} s={[w, 50, 50]} m="profile" v={v} x={xray} />)}
      <group ref={car}>
        <Bx p={[0, h - 25, 0]} s={[90, 60, d - 40]} m="anodised" v={v} x={xray} />
        <group ref={quill}>
          <Bx p={[0, 150, 0]} s={[40, 260, 40]} m="aluminium" v={v} x={xray} />
          <Bx p={[0, 14, 0]} s={[60, 16, 40]} m="black" v={v} x={xray} />
          {[0, 1].map((i) => (
            <mesh key={i} ref={(m) => (fingers.current[i] = m)} position={s3([i ? 22 : -22, -6, 0])} material={mat('steel', v, xray)}>
              <boxGeometry args={s3([6, 26, 20])} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/** Processing head (welding / cutting / scribing): collimator, focusing optics, coaxial camera, nozzle — moved over the seam by the gantry. */
function LaserHead({ o, visual: v, xray }: GenProps) {
  const rt = useRt();
  const [w, h] = o.size;
  const g = useRef<THREE.Group>(null);
  const li = rt?.model.lasers.findIndex((l) => l.headId === o.id) ?? -1;
  useFrame(() => {
    const s = rt?.stateRef.current;
    const path = li >= 0 ? rt?.paths[li] : undefined;
    if (!g.current) return;
    if (s && li >= 0 && s.laserOn[li] && path) {
      const p = pointAt(path, s.scan[li]).p;
      g.current.position.set(p[0] * MM, 0, p[1] * MM);
    } else g.current.position.multiplyScalar(0.9);
  });
  return (
    <group ref={g}>
      <Bx p={[0, h + 110, -30]} s={[w * 0.9, 220, 20]} m="anodised" v={v} x={xray} />
      <Cy p={[0, h * 0.72, 0]} rad={w / 2.4} len={h * 0.5} m="laser" v={v} x={xray} />
      <Cy p={[0, h * 0.35, 0]} rad={w / 3} len={h * 0.3} m="black" v={v} x={xray} />
      <Cy p={[0, h * 0.1, 0]} rad={w / 6} len={h * 0.2} m="copper" v={v} x={xray} rad2={w / 12} />
      <Bx p={[w / 2 + 14, h * 0.75, 0]} s={[36, 50, 36]} m="anodised" v={v} x={xray} />
      <Cy p={[w / 2 + 14, h * 0.75 + 36, 0]} rad={10} len={22} m="black" v={v} x={xray} />
      {[-1, 1].map((sz) => <Cy key={sz} p={[-w / 2 - 6, h * 0.6, sz * 18]} rad={6} len={20} m={sz < 0 ? 'blue' : 'red'} v={v} x={xray} axis="x" />)}
    </group>
  );
}

/** §119 MachineComponent3DRegistry: generator key → procedural component. */
export const REGISTRY: Record<GenKind, ((p: GenProps) => ReactNode) | null> = {
  frame: Frame,
  table: Table,
  enclosure: Enclosure,
  door: Door,
  conveyor: Conveyor,
  buffer: Conveyor,
  bridge: Bridge,
  tool: Tool,
  test_head: TestHead,
  pusher: Pusher,
  magazine: Magazine,
  gantry_pp: GantryPP,
  tray: Tray,
  bench: Bench,
  fixture: Fixture,
  xy_stage: Stage,
  z_column: Column,
  z_slide: ZSlide,
  laser_source: LaserSource,
  collimator: Collimator,
  fiber: null,
  beam_expander: BeamExpander,
  galvo: Galvo,
  f_theta: FTheta,
  laser_head: LaserHead,
  nozzle: Nozzle,
  camera: Camera,
  light: RingLight,
  cabinet: Cabinet,
  hmi: Hmi,
  estop: EStop,
  tower: Tower,
  sensor: Sensor,
  robot: RobotAny,
  bin: Bin,
  chiller: Chiller,
  fume: Chiller,
  chain: Chain,
  operator: Operator,
  frl: Frl,
  valve: Valve,
  generic: Generic,
  station: null,
  group: null,
};

/** Generators with no animated parts: their meshes are merged per material (one draw call per material). */
const STATIC_KINDS = new Set<GenKind>(['frame', 'table', 'bench', 'bin', 'cabinet', 'chiller', 'fume', 'bridge', 'frl', 'valve', 'z_column']);

/**
 * Merges the static meshes of one component into one mesh per shared material after they mount (the
 * originals are hidden, not removed, so picking and React updates keep working). Re-merged whenever the
 * visual state, x-ray or detail level changes.
 */
function MergeStatic({ deps, children }: { deps: unknown[]; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const root = g.current;
    if (!root) return;
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const hidden: THREE.Mesh[] = [];
    root.traverse((node) => {
      const m = node as THREE.Mesh;
      if (!m.isMesh || m.userData.merged || Array.isArray(m.material) || !m.visible) return;
      const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      const list = byMat.get(m.material) ?? [];
      list.push(geo);
      byMat.set(m.material, list);
      hidden.push(m);
    });
    if (hidden.length < 4) {
      byMat.forEach((l) => l.forEach((x) => x.dispose()));
      return;
    }
    const merged: THREE.Mesh[] = [];
    for (const [material, geos] of byMat) {
      const mg = mergeGeometries(geos, false);
      geos.forEach((x) => x.dispose());
      if (!mg) continue;
      const mesh = new THREE.Mesh(mg, material);
      mesh.userData.merged = true;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      root.add(mesh);
      merged.push(mesh);
    }
    hidden.forEach((m) => (m.visible = false));
    return () => {
      merged.forEach((m) => {
        root.remove(m);
        m.geometry.dispose();
      });
      hidden.forEach((m) => (m.visible = true));
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return <group ref={g}>{children}</group>;
}

export const ObjectBody = forwardRef<THREE.Group, GenProps>(function ObjectBody(p, ref) {
  const rt = useRt();
  const C = REGISTRY[p.o.kind];
  const pos = useMemo(() => [p.o.position[0] * MM, p.o.position[1] * MM, p.o.position[2] * MM] as [number, number, number], [p.o.position]);
  if (!C) return null;
  return (
    <group ref={ref} position={pos} rotation={[0, ((p.o.rotationY ?? 0) * Math.PI) / 180, 0]} userData={{ id: p.o.id }}>
      {STATIC_KINDS.has(p.o.kind) ? (
        <MergeStatic deps={[p.visual, p.xray, p.o, rt?.detail, rt?.enclosure]}>
          <C {...p} />
        </MergeStatic>
      ) : (
        <C {...p} />
      )}
    </group>
  );
});

/** Workpiece templates (§25) — conceptual geometry per template. */
export function WorkpieceMesh({ template, l, w, t, state }: { template: string; l: number; w: number; t: number; state?: 'raw' | 'processing' | 'ok' | 'ng' }) {
  const color = template === 'pcb' ? '#1f6b3a' : template === 'wafer' ? '#5b6770' : template === 'battery_tab' ? '#b87333' : template === 'battery_can' ? '#9aa4aa' : template === 'foil_web' ? '#3a3f44' : template === 'glass' ? '#a9d6e5' : '#b9c2c6';
  void state;
  if (template === 'tube') {
    // round tube along the machine's X axis; width = outer diameter, thickness = height on the fixture
    const r = (Math.min(w, t) / 2) * MM;
    return (
      <group position={[0, r, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[r, r, l * MM, 32, 1, true]} />
          <meshStandardMaterial color={color} metalness={0.75} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[r * 0.86, r * 0.86, l * MM * 1.001, 32, 1, true]} />
          <meshStandardMaterial color="#6d757a" metalness={0.6} roughness={0.5} side={THREE.BackSide} />
        </mesh>
      </group>
    );
  }
  if (template === 'glass')
    return (
      <mesh position={[0, (Math.max(t, 0.6) / 2) * MM, 0]}>
        <boxGeometry args={[l * MM, Math.max(t, 0.6) * MM, w * MM]} />
        <meshPhysicalMaterial color={color} transparent opacity={0.45} roughness={0.05} metalness={0} />
      </mesh>
    );
  if (template === 'foil_web')
    // electrode on a web: dark coating with a bare current-collector edge where tabs are notched
    return (
      <group>
        <mesh position={[0, (0.6 / 2) * MM, -(w * 0.1) * MM]}>
          <boxGeometry args={[l * MM, 0.6 * MM, w * 0.8 * MM]} />
          <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
        </mesh>
        <mesh position={[0, (0.6 / 2) * MM, (w * 0.4) * MM]}>
          <boxGeometry args={[l * MM, 0.5 * MM, w * 0.2 * MM]} />
          <meshStandardMaterial color="#c9ccce" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
    );
  if (template === 'wafer')
    return (
      <mesh position={[0, (Math.max(t, 0.8) / 2) * MM, 0]}>
        <cylinderGeometry args={[(Math.min(l, w) / 2) * MM, (Math.min(l, w) / 2) * MM, Math.max(t, 0.8) * MM, 48]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
      </mesh>
    );
  if (template === 'battery_can')
    return (
      <mesh position={[0, (t / 2) * MM, 0]}>
        <cylinderGeometry args={[(w / 2) * MM, (w / 2) * MM, t * MM, 32]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
      </mesh>
    );
  const tt = Math.max(t, 0.6);
  return (
    <group>
      <mesh position={[0, (tt / 2) * MM, 0]} castShadow>
        <boxGeometry args={[l * MM, tt * MM, w * MM]} />
        <meshStandardMaterial color={color} metalness={template === 'pcb' ? 0.1 : 0.7} roughness={template === 'pcb' ? 0.6 : 0.3} />
      </mesh>
      {template === 'plate' &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * (l / 2 - 7) * MM, (tt + 0.1) * MM, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.5 * MM, 16]} />
            <meshBasicMaterial color="#1b1f22" />
          </mesh>
        ))}
    </group>
  );
}
