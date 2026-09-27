import { Edges } from '@react-three/drei';
import { forwardRef, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import type { GenKind, Machine3DObject } from '../../../services/twin/machine';

/*
 * PROCEDURAL COMPONENT LIBRARY (3D master prompt §10, §119–§123). Parametric, low-poly conceptual
 * geometry: every generator takes the engineering object's size and params. Restrained industrial
 * materials — no glass machines, no bloom, no neon (§86).
 */

export const MM = 0.001;

export type Visual = 'normal' | 'selected' | 'hover' | 'active' | 'fault' | 'warning' | 'collision' | 'dim';

/** §121 material system. */
export const MAT = {
  frame: { color: '#2b3338', metalness: 0.55, roughness: 0.5 },
  table: { color: '#1c2125', metalness: 0.1, roughness: 0.85 },
  aluminium: { color: '#aeb7bb', metalness: 0.7, roughness: 0.38 },
  steel: { color: '#8a959a', metalness: 0.75, roughness: 0.42 },
  stainless: { color: '#c3c9cc', metalness: 0.8, roughness: 0.3 },
  black: { color: '#1a1e21', metalness: 0.4, roughness: 0.5 },
  polymer: { color: '#3a4449', metalness: 0.05, roughness: 0.75 },
  cabinet: { color: '#c9ccc6', metalness: 0.15, roughness: 0.65 },
  laser: { color: '#e4e7e7', metalness: 0.25, roughness: 0.45 },
  accent: { color: '#00a99d', metalness: 0.2, roughness: 0.4 },
  copper: { color: '#b87333', metalness: 0.8, roughness: 0.35 },
  lens: { color: '#86b8d8', metalness: 0.1, roughness: 0.05 },
  granite: { color: '#23282b', metalness: 0.05, roughness: 0.9 },
} as const;
type MatKey = keyof typeof MAT;

const TINT: Partial<Record<Visual, string>> = { selected: '#00a99d', hover: '#4fd1c5', active: '#00a99d', fault: '#e5484d', warning: '#f5a524', collision: '#e5484d' };

export function Mat({ m, visual = 'normal', xray, opacity, emissive }: { m: MatKey; visual?: Visual; xray?: boolean; opacity?: number; emissive?: string }) {
  const base = MAT[m];
  const tint = TINT[visual];
  const op = xray ? 0.12 : visual === 'dim' ? 0.18 : (opacity ?? 1);
  return (
    <meshStandardMaterial
      color={base.color}
      metalness={base.metalness}
      roughness={base.roughness}
      emissive={emissive ?? tint ?? '#000000'}
      emissiveIntensity={emissive ? 0.9 : tint ? (visual === 'hover' || visual === 'warning' ? 0.16 : 0.35) : 0}
      transparent={op < 1}
      opacity={op}
      depthWrite={op >= 1}
    />
  );
}

/** Thin engineering outline, accent when selected (§86). */
export function Outline({ visual, xray }: { visual: Visual; xray?: boolean }) {
  if (visual === 'dim') return null;
  const c = visual === 'selected' ? '#00e0cf' : visual === 'fault' || visual === 'collision' ? '#ff6b6b' : xray ? '#6f8a90' : '#0b0f11';
  return <Edges threshold={20} color={c} lineWidth={visual === 'selected' ? 2 : 1} />;
}

interface GenProps {
  o: Machine3DObject;
  visual: Visual;
  xray: boolean;
  /** 0–1 live values from the simulation state (door opening, active lights …) */
  live?: { active?: boolean; open?: number; tower?: 'green' | 'amber' | 'red' | 'off' };
  children?: ReactNode;
}

const box = (w: number, h: number, d: number) => [w * MM, h * MM, d * MM] as [number, number, number];

function Frame({ o, visual, xray }: GenProps) {
  const [w, h, d] = o.size;
  const p = Number(o.params.profile ?? 45);
  const legs = [
    [-w / 2 + p / 2, -d / 2 + p / 2],
    [w / 2 - p / 2, -d / 2 + p / 2],
    [-w / 2 + p / 2, d / 2 - p / 2],
    [w / 2 - p / 2, d / 2 - p / 2],
  ];
  return (
    <group>
      {legs.map(([x, z], i) => (
        <mesh key={i} position={[x * MM, (h / 2) * MM, z * MM]} castShadow>
          <boxGeometry args={box(p, h, p)} />
          <Mat m="frame" visual={visual} xray={xray} />
        </mesh>
      ))}
      {[80, h - 40].map((y) => (
        <group key={y}>
          <mesh position={[0, y * MM, (-d / 2 + p / 2) * MM]}>
            <boxGeometry args={box(w, p, p)} />
            <Mat m="frame" visual={visual} xray={xray} />
          </mesh>
          <mesh position={[0, y * MM, (d / 2 - p / 2) * MM]}>
            <boxGeometry args={box(w, p, p)} />
            <Mat m="frame" visual={visual} xray={xray} />
          </mesh>
        </group>
      ))}
      {/* lower bay: closed side panels */}
      <mesh position={[0, ((h - 60) / 2 + 40) * MM, 0]}>
        <boxGeometry args={box(w - 2 * p, h - 140, d - 2 * p)} />
        <Mat m="polymer" visual={visual} xray={xray} opacity={0.55} />
      </mesh>
    </group>
  );
}

function Enclosure({ o, visual, xray }: GenProps) {
  const [w, h, d] = o.size;
  const t = 30;
  const posts = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
  ];
  return (
    <group>
      {posts.map(([x, z], i) => (
        <mesh key={i} position={[x * MM, (h / 2) * MM, z * MM]}>
          <boxGeometry args={box(t, h, t)} />
          <Mat m="frame" visual={visual} />
        </mesh>
      ))}
      {/* roof: opaque */}
      <mesh position={[0, h * MM, 0]} castShadow>
        <boxGeometry args={box(w + t, 16, d + t)} />
        <Mat m="polymer" visual={visual} xray={xray} />
      </mesh>
      {/* back + side panels: opaque sheet metal */}
      <mesh position={[0, (h / 2) * MM, (-d / 2) * MM]}>
        <boxGeometry args={box(w, h, 4)} />
        <Mat m="cabinet" visual={visual} xray={xray} opacity={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[((s * w) / 2) * MM, (h / 2) * MM, 0]}>
          <boxGeometry args={box(4, h, d)} />
          <Mat m="cabinet" visual={visual} xray={xray} opacity={0.9} />
        </mesh>
      ))}
      {/* front laser-safety viewing window (tinted, symbolic) */}
      <mesh position={[0, (h * 0.62) * MM, (d / 2) * MM]}>
        <boxGeometry args={box(w, h * 0.72, 3)} />
        <meshStandardMaterial color="#8a5a00" transparent opacity={xray ? 0.05 : 0.18} roughness={0.1} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Door({ o, visual, xray, live }: GenProps) {
  const [w, h] = o.size;
  const open = live?.open ?? 0;
  return (
    <group position={[0, open * h * 0.85 * MM, 0]}>
      <mesh position={[0, (h / 2) * MM, 0]}>
        <boxGeometry args={box(w, h, 10)} />
        <meshStandardMaterial color="#9a6a10" transparent opacity={xray ? 0.06 : 0.28} roughness={0.15} depthWrite={false} />
        <Outline visual={visual} xray />
      </mesh>
      <mesh position={[0, (h - 30) * MM, 12 * MM]}>
        <boxGeometry args={box(w * 0.4, 18, 18)} />
        <Mat m="steel" visual={visual} xray={xray} />
      </mesh>
    </group>
  );
}

function Conveyor({ o, visual, xray }: GenProps) {
  const [w, h, d] = o.size;
  const slots = Number(o.params.slots ?? 0);
  return (
    <group>
      <mesh position={[0, (h - 8) * MM, 0]} receiveShadow>
        <boxGeometry args={box(w, 10, d - 20)} />
        <Mat m="black" visual={visual} xray={xray} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, (h / 2) * MM, ((s * d) / 2) * MM]}>
          <boxGeometry args={box(w, h, 14)} />
          <Mat m="aluminium" visual={visual} xray={xray} />
        </mesh>
      ))}
      {slots > 0 &&
        Array.from({ length: slots }, (_, i) => (
          <mesh key={i} position={[(-w / 2 + ((i + 0.5) * w) / slots) * MM, (h - 2) * MM, 0]}>
            <boxGeometry args={box(4, 4, d - 30)} />
            <Mat m="accent" visual={visual} xray={xray} opacity={0.6} />
          </mesh>
        ))}
    </group>
  );
}

function Fixture({ o, visual, xray }: GenProps) {
  const [w, , d] = o.size;
  const plate = Number(o.params.plateH ?? 30);
  const clampH = Number(o.params.clampH ?? 0);
  return (
    <group>
      <mesh position={[0, (plate / 2) * MM, 0]} castShadow receiveShadow>
        <boxGeometry args={box(w, plate, d)} />
        <Mat m="aluminium" visual={visual} xray={xray} />
        <Outline visual={visual} xray={xray} />
      </mesh>
      {clampH > 0 &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[((s * w) / 2 - s * 14) * MM, (plate + clampH / 2) * MM, 0]}>
            <boxGeometry args={box(20, clampH, d * 0.5)} />
            <Mat m="black" visual={visual} xray={xray} />
          </mesh>
        ))}
    </group>
  );
}

function Stage({ o, visual, xray }: GenProps) {
  const [w, h, d] = o.size;
  const along = w >= d ? 'x' : 'z';
  return (
    <group>
      <mesh position={[0, (h * 0.35) * MM, 0]} castShadow>
        <boxGeometry args={box(w, h * 0.7, d)} />
        <Mat m="aluminium" visual={visual} xray={xray} />
        <Outline visual={visual} xray={xray} />
      </mesh>
      {/* rails */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={along === 'x' ? [0, (h * 0.7 + 6) * MM, ((s * d) / 3) * MM] : [((s * w) / 3) * MM, (h * 0.7 + 6) * MM, 0]}>
          <boxGeometry args={along === 'x' ? box(w - 20, 12, 16) : box(16, 12, d - 20)} />
          <Mat m="stainless" visual={visual} xray={xray} />
        </mesh>
      ))}
    </group>
  );
}

function Column({ o, visual, xray }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <mesh position={[0, (h / 2) * MM, 0]} castShadow>
      <boxGeometry args={box(w, h, d)} />
      <Mat m="frame" visual={visual} xray={xray} />
      <Outline visual={visual} xray={xray} />
    </mesh>
  );
}

function LaserSource({ o, visual, xray }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <group>
      <mesh position={[0, (h / 2) * MM, 0]} castShadow>
        <boxGeometry args={box(w, h, d)} />
        <Mat m="laser" visual={visual} xray={xray} />
        <Outline visual={visual} xray={xray} />
      </mesh>
      <mesh position={[0, (h - 18) * MM, (d / 2 + 1) * MM]}>
        <boxGeometry args={box(w * 0.92, 8, 2)} />
        <Mat m="accent" visual={visual} xray={xray} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[(-w / 2 + 30 + i * 14) * MM, (h * 0.45) * MM, (d / 2 + 1) * MM]}>
          <boxGeometry args={box(6, h * 0.5, 2)} />
          <Mat m="black" visual={visual} xray={xray} />
        </mesh>
      ))}
    </group>
  );
}

function BeamExpander({ o, visual, xray }: GenProps) {
  const [w, h, d] = o.size;
  const len = Math.max(w, d);
  const alongZ = d > w;
  return (
    <mesh position={[0, (h / 2) * MM, 0]} rotation={alongZ ? [Math.PI / 2, 0, 0] : [0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[(h / 2) * MM, (h / 2.6) * MM, len * MM, 24]} />
      <Mat m="black" visual={visual} xray={xray} />
      <Outline visual={visual} xray={xray} />
    </mesh>
  );
}

function Galvo({ o, visual, xray, live }: GenProps & { mirror?: number }) {
  const [w, h, d] = o.size;
  return (
    <group>
      <mesh position={[0, (h / 2) * MM, 0]} castShadow>
        <boxGeometry args={box(w, h, d)} />
        <Mat m="black" visual={visual} xray={xray} emissive={live?.active ? '#0b3f3b' : undefined} />
        <Outline visual={visual} xray={xray} />
      </mesh>
      <mesh position={[(-w / 2 + 16) * MM, (h - 14) * MM, (d / 2 + 1) * MM]}>
        <circleGeometry args={[5 * MM, 16]} />
        <meshBasicMaterial color={live?.active ? '#35e0a1' : '#3a4449'} />
      </mesh>
    </group>
  );
}

function FTheta({ o, visual, xray }: GenProps) {
  const [w, h] = o.size;
  return (
    <group>
      <mesh position={[0, (h / 2) * MM, 0]} castShadow>
        <cylinderGeometry args={[(w / 2) * MM, (w / 2.3) * MM, h * MM, 32]} />
        <Mat m="black" visual={visual} xray={xray} />
        <Outline visual={visual} xray={xray} />
      </mesh>
      <mesh position={[0, 1 * MM, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[(w / 2.5) * MM, 32]} />
        <meshStandardMaterial color={MAT.lens.color} transparent opacity={0.6} roughness={0.05} metalness={0.1} />
      </mesh>
    </group>
  );
}

function Camera({ o, visual, xray, live }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <group>
      <mesh position={[0, (h / 2) * MM, 0]} castShadow>
        <boxGeometry args={box(w, h, d)} />
        <Mat m="polymer" visual={visual} xray={xray} emissive={live?.active ? '#0e4d48' : undefined} />
        <Outline visual={visual} xray={xray} />
      </mesh>
      <mesh position={[(w / 2 - 10) * MM, (h - 10) * MM, (d / 2 + 1) * MM]}>
        <circleGeometry args={[4 * MM, 12]} />
        <meshBasicMaterial color={live?.active ? '#35e0a1' : '#3a4449'} />
      </mesh>
    </group>
  );
}

function RingLight({ o, visual, xray, live }: GenProps) {
  const [w, h] = o.size;
  return (
    <mesh position={[0, (h / 2) * MM, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[(w / 2 - 12) * MM, 10 * MM, 10, 32]} />
      <Mat m="black" visual={visual} xray={xray} emissive={live?.active ? '#ff3b30' : undefined} />
    </mesh>
  );
}

function Cabinet({ o, visual, xray }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <group>
      <mesh position={[0, (h / 2) * MM, 0]} castShadow receiveShadow>
        <boxGeometry args={box(w, h, d)} />
        <Mat m="cabinet" visual={visual} xray={xray} />
        <Outline visual={visual} xray={xray} />
      </mesh>
      <mesh position={[0, (h / 2) * MM, (d / 2 + 1) * MM]}>
        <boxGeometry args={box(4, h - 60, 2)} />
        <Mat m="steel" visual={visual} xray={xray} />
      </mesh>
      <mesh position={[(w / 4) * MM, (h * 0.8) * MM, (d / 2 + 2) * MM]}>
        <boxGeometry args={box(120, 90, 4)} />
        <Mat m="black" visual={visual} xray={xray} />
      </mesh>
    </group>
  );
}

function Hmi({ o, visual, xray, live }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <group rotation={[-0.25, 0, 0]}>
      <mesh position={[0, (h / 2) * MM, 0]} castShadow>
        <boxGeometry args={box(w, h, d)} />
        <Mat m="black" visual={visual} xray={xray} />
        <Outline visual={visual} xray={xray} />
      </mesh>
      <mesh position={[0, (h / 2) * MM, (d / 2 + 1) * MM]}>
        <planeGeometry args={[(w - 30) * MM, (h - 30) * MM]} />
        <meshBasicMaterial color={live?.tower === 'red' ? '#4a1416' : live?.tower === 'amber' ? '#3d2b08' : '#0b3a37'} />
      </mesh>
    </group>
  );
}

function EStop({ o, visual, xray }: GenProps) {
  const [w, h] = o.size;
  return (
    <group>
      <mesh position={[0, (h * 0.3) * MM, 0]}>
        <boxGeometry args={box(w, h * 0.6, w)} />
        <meshStandardMaterial color="#f2c200" roughness={0.5} transparent={xray} opacity={xray ? 0.2 : 1} />
      </mesh>
      <mesh position={[0, (h * 0.75) * MM, 0]}>
        <cylinderGeometry args={[(w * 0.42) * MM, (w * 0.42) * MM, h * 0.3 * MM, 24]} />
        <meshStandardMaterial color="#d32f2f" roughness={0.4} emissive={visual === 'selected' ? '#00a99d' : '#000'} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function Tower({ o, live }: GenProps) {
  const [w, h] = o.size;
  const seg = h / 4;
  const on = live?.tower ?? 'off';
  const colors: ['red' | 'amber' | 'green', string][] = [
    ['green', '#2fbf71'],
    ['amber', '#f5a524'],
    ['red', '#e5484d'],
  ];
  return (
    <group>
      <mesh position={[0, (seg / 2) * MM, 0]}>
        <cylinderGeometry args={[(w / 3) * MM, (w / 3) * MM, seg * MM, 12]} />
        <Mat m="black" />
      </mesh>
      {colors.map(([k, c], i) => (
        <mesh key={k} position={[0, (seg * (i + 1.5)) * MM, 0]}>
          <cylinderGeometry args={[(w / 2) * MM, (w / 2) * MM, (seg - 6) * MM, 16]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={on === k ? 1.2 : 0.02} transparent opacity={on === k ? 1 : 0.55} />
        </mesh>
      ))}
    </group>
  );
}

function Sensor({ o, visual, xray, live }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <mesh position={[0, (h / 2) * MM, 0]}>
      <boxGeometry args={box(w, h, d)} />
      <Mat m="polymer" visual={visual} xray={xray} emissive={live?.active ? '#f5a524' : undefined} />
      <Outline visual={visual} xray={xray} />
    </mesh>
  );
}

function Bin({ o, visual, xray }: GenProps) {
  const [w, h, d] = o.size;
  const ok = !!o.params.ok;
  return (
    <group>
      <mesh position={[0, (h / 2) * MM, 0]}>
        <boxGeometry args={box(w, h, d)} />
        <meshStandardMaterial color={ok ? '#2e6b4f' : '#7a2a2d'} roughness={0.7} transparent opacity={xray ? 0.15 : 0.85} />
        <Outline visual={visual} xray={xray} />
      </mesh>
    </group>
  );
}

function Robot({ o, visual, xray, live }: GenProps) {
  const [w, h] = o.size;
  const swing = live?.active ? 0.6 : 0;
  return (
    <group>
      <mesh position={[0, 40 * MM, 0]}>
        <cylinderGeometry args={[(w / 2) * MM, (w / 2) * MM, 80 * MM, 24]} />
        <Mat m="laser" visual={visual} xray={xray} />
      </mesh>
      <group position={[0, 80 * MM, 0]} rotation={[0, swing, 0]}>
        <mesh position={[0, (h * 0.35) * MM, 0]}>
          <boxGeometry args={box(80, h * 0.7, 80)} />
          <Mat m="laser" visual={visual} xray={xray} />
          <Outline visual={visual} xray={xray} />
        </mesh>
        <mesh position={[140 * MM, (h * 0.7) * MM, 0]}>
          <boxGeometry args={box(320, 60, 60)} />
          <Mat m="laser" visual={visual} xray={xray} />
        </mesh>
        <mesh position={[290 * MM, (h * 0.55) * MM, 0]}>
          <cylinderGeometry args={[18 * MM, 18 * MM, 180 * MM, 12]} />
          <Mat m="steel" visual={visual} xray={xray} />
        </mesh>
      </group>
    </group>
  );
}

function Chiller({ o, visual, xray }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <group>
      <mesh position={[0, (h / 2) * MM, 0]} castShadow>
        <boxGeometry args={box(w, h, d)} />
        <Mat m="cabinet" visual={visual} xray={xray} />
        <Outline visual={visual} xray={xray} />
      </mesh>
      <mesh position={[0, (h * 0.7) * MM, (d / 2 + 1) * MM]}>
        <circleGeometry args={[(w * 0.3) * MM, 24]} />
        <Mat m="black" visual={visual} xray={xray} />
      </mesh>
    </group>
  );
}

function Generic({ o, visual, xray, live }: GenProps) {
  const [w, h, d] = o.size;
  if (o.params.marker)
    return (
      <mesh position={[0, 1 * MM, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * MM, d * MM]} />
        <meshBasicMaterial color="#00a99d" transparent opacity={0.12} depthWrite={false} />
        <Edges color="#00a99d" />
      </mesh>
    );
  if (o.params.shape === 'cylinder')
    return (
      <mesh position={[0, (h / 2) * MM, 0]} rotation={w > h * 1.4 ? [0, 0, Math.PI / 2] : [0, 0, 0]}>
        <cylinderGeometry args={[(Math.min(w, d) / 2) * MM, (Math.min(w, d) / 2) * MM, Math.max(h, w > h * 1.4 ? w : h) * MM, 20]} />
        <Mat m="black" visual={visual} xray={xray} emissive={live?.active ? '#0e4d48' : undefined} />
        <Outline visual={visual} xray={xray} />
      </mesh>
    );
  return (
    <mesh position={[0, (h / 2) * MM, 0]} castShadow>
      <boxGeometry args={box(w, h, d)} />
      <Mat m={o.layer === 'Electrical' || o.layer === 'Controls' ? 'polymer' : o.layer === 'Laser' ? 'laser' : 'steel'} visual={visual} xray={xray} />
      <Outline visual={visual} xray={xray} />
    </mesh>
  );
}

function Table({ o, visual, xray }: GenProps) {
  const [w, h, d] = o.size;
  return (
    <mesh position={[0, (h / 2) * MM, 0]} receiveShadow>
      <boxGeometry args={box(w, h, d)} />
      <Mat m="granite" visual={visual} xray={xray} />
    </mesh>
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
  fixture: Fixture,
  xy_stage: Stage,
  z_column: Column,
  laser_source: LaserSource,
  fiber: null,
  beam_expander: BeamExpander,
  galvo: Galvo,
  f_theta: FTheta,
  laser_head: FTheta,
  camera: Camera,
  light: RingLight,
  cabinet: Cabinet,
  hmi: Hmi,
  estop: EStop,
  tower: Tower,
  sensor: Sensor,
  robot: Robot,
  bin: Bin,
  chiller: Chiller,
  fume: Chiller,
  generic: Generic,
  station: null,
  group: null,
};

export const ObjectBody = forwardRef<THREE.Group, GenProps>(function ObjectBody(p, ref) {
  const C = REGISTRY[p.o.kind];
  const pos = useMemo(() => [p.o.position[0] * MM, p.o.position[1] * MM, p.o.position[2] * MM] as [number, number, number], [p.o.position]);
  if (!C) return null;
  return (
    <group ref={ref} position={pos} rotation={[0, ((p.o.rotationY ?? 0) * Math.PI) / 180, 0]} userData={{ id: p.o.id }}>
      {C(p)}
    </group>
  );
});

/** Workpiece templates (§25) — conceptual geometry per template. */
export function WorkpieceMesh({ template, l, w, t, state }: { template: string; l: number; w: number; t: number; state?: 'raw' | 'processing' | 'ok' | 'ng' }) {
  const color = template === 'pcb' ? '#1f6b3a' : template === 'wafer' ? '#5b6770' : template === 'battery_tab' ? '#b87333' : template === 'battery_can' ? '#9aa4aa' : '#b9c2c6';
  const edge = state === 'ok' ? '#2fbf71' : state === 'ng' ? '#e5484d' : state === 'processing' ? '#00e0cf' : '#0b0f11';
  if (template === 'wafer')
    return (
      <mesh position={[0, (t / 2) * MM, 0]}>
        <cylinderGeometry args={[(Math.min(l, w) / 2) * MM, (Math.min(l, w) / 2) * MM, Math.max(t, 0.8) * MM, 48]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
        <Edges color={edge} />
      </mesh>
    );
  if (template === 'battery_can')
    return (
      <mesh position={[0, (t / 2) * MM, 0]}>
        <cylinderGeometry args={[(w / 2) * MM, (w / 2) * MM, t * MM, 32]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
        <Edges color={edge} />
      </mesh>
    );
  return (
    <mesh position={[0, (Math.max(t, 0.6) / 2) * MM, 0]} castShadow>
      <boxGeometry args={box(l, Math.max(t, 0.6), w)} />
      <meshStandardMaterial color={color} metalness={template === 'pcb' ? 0.1 : 0.7} roughness={template === 'pcb' ? 0.6 : 0.3} />
      <Edges color={edge} />
    </mesh>
  );
}
