import { Edges, GizmoHelper, GizmoViewport, Grid, Line, OrbitControls, OrthographicCamera, PerformanceMonitor, PerspectiveCamera } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { workpieceObject } from '../../../services/twin/collision';
import { carriedOffset, type Layer, type Machine3DObject, type MachineModel } from '../../../services/twin/machine';
import { pointAt, type ScanPath } from '../../../services/twin/process';
import type { SimulationState } from '../../../services/twin/timeline';
import { MM, ObjectBody, RuntimeCtx, WorkpieceMesh, type EnclosureMode, type TwinRuntime, type Visual } from './procedural';

export type ViewPreset = 'fit' | 'front' | 'top' | 'side' | 'iso' | 'laser' | 'inspection' | 'maintenance' | 'process';

export interface SceneView {
  layers: Record<Layer, boolean>;
  hidden: Set<string>;
  isolate: string | null;
  selected: string | null;
  hover: string | null;
  xray: boolean;
  explode: number;
  section: { axis: 'x' | 'y' | 'z' | null; pos: number };
  grid: boolean;
  axes: boolean;
  dims: boolean;
  labels: boolean;
  zones: boolean;
  routes: boolean;
  fov: boolean;
  field: boolean;
  trail: boolean;
  beam: { on: boolean; intensity: number; color: string | null; spot: number };
  overlay: Map<string, string> | null;
  collisionIds: Set<string>;
  quality: 'high' | 'balanced' | 'performance';
  ortho: boolean;
  measure: boolean;
  measurePts: [number, number, number][];
  customer: boolean;
  reducedMotion: boolean;
  /** show every zone (maintenance camera mode), not only the enabled ones */
  zonesAll: boolean;
  /** station key of the evidenced bottleneck (subtle emphasis, §71) */
  bottleneck: string | null;
  /** closed / cutaway (right side + half roof removed) / hidden panels */
  enclosure: EnclosureMode;
  /** component name call-outs in the viewport */
  callouts: boolean;
  /** objects highlighted by the guided tour / explanation */
  highlight: Set<string> | null;
}

/** Live values refreshed a few times per second (smooth motion itself runs in useFrame). */
export interface LiveView {
  stationState: Record<string, 'idle' | 'busy' | 'blocked' | 'down'>;
  vision: Record<string, boolean>;
  laserOn: boolean[];
  doorOpen: number;
  tower: 'green' | 'amber' | 'red' | 'off';
}

export interface SceneApi {
  view(p: ViewPreset, focusId?: string | null): void;
  canvas(): HTMLCanvasElement | null;
  camera(): { position: number[]; target: number[] };
  setCamera(position: number[], target: number[]): void;
}

const W = (v: [number, number, number]) => [v[0] * MM, v[1] * MM, v[2] * MM] as [number, number, number];

function beamColor(wl: number | null, override: string | null) {
  if (override) return override;
  if (wl == null) return '#ff4d3d';
  if (wl < 400) return '#9b6bff';
  if (wl < 560) return '#35e07a';
  if (wl > 5000) return '#ff9f1c';
  return '#ff4d3d';
}

/** Objects carried by motion axes follow the central simulation state every frame. */
function Carried({ o, model, stateRef, children }: { o: Machine3DObject; model: MachineModel; stateRef: MutableRefObject<SimulationState | null>; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const s = stateRef.current;
    const off = carriedOffset(o, s?.axes ?? {}, model.axes);
    g.current.position.set(off[0] * MM, off[1] * MM, off[2] * MM);
  });
  return <group ref={g}>{children}</group>;
}

function CameraRig({ model, api, ortho, reduced }: { model: MachineModel; api: MutableRefObject<SceneApi | null>; ortho: boolean; reduced: boolean }) {
  const { camera, gl, size } = useThree();
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; tf: THREE.Vector3; tt: THREE.Vector3; t: number } | null>(null);
  const b = model.bounds;
  const c = new THREE.Vector3(((b.min[0] + b.max[0]) / 2) * MM, ((b.min[1] + b.max[1]) / 2) * MM, ((b.min[2] + b.max[2]) / 2) * MM);
  const r = (Math.hypot(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]) / 2) * MM;
  const go = (pos: THREE.Vector3, target: THREE.Vector3) => {
    if (!controls) return;
    if (reduced) {
      camera.position.copy(pos);
      controls.target.copy(target);
      controls.update();
      return;
    }
    anim.current = { from: camera.position.clone(), to: pos, tf: controls.target.clone(), tt: target, t: 0 };
  };
  useFrame((_, dt) => {
    const a = anim.current;
    if (!a || !controls) return;
    a.t = Math.min(1, a.t + dt / 0.55);
    const k = 1 - (1 - a.t) ** 3;
    camera.position.lerpVectors(a.from, a.to, k);
    controls.target.lerpVectors(a.tf, a.tt, k);
    controls.update();
    if (a.t >= 1) anim.current = null;
  });
  // frame the whole machine once the controls exist (isometric engineering view)
  const framed = useRef(false);
  useEffect(() => {
    if (!controls || framed.current) return;
    framed.current = true;
    const d = r * 1.9;
    camera.position.copy(c.clone().add(new THREE.Vector3(d * 0.75, d * 0.55, d * 0.9)));
    controls.target.copy(c);
    controls.update();
  }, [controls]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (ortho && camera instanceof THREE.OrthographicCamera) {
      camera.zoom = Math.min(size.width, size.height) / (r * 2.6);
      camera.updateProjectionMatrix();
    }
  }, [ortho, camera, size, r]);
  useImperativeHandle(
    api,
    () => ({
      view(p, focusId) {
        const d = r * 2.4;
        const obj = focusId ? model.byId.get(focusId) : undefined;
        if (obj) {
          const t = new THREE.Vector3(obj.position[0] * MM, (obj.position[1] + obj.size[1] / 2) * MM, obj.position[2] * MM);
          const rr = Math.max(0.25, (Math.max(...obj.size) * MM) * 3);
          go(t.clone().add(new THREE.Vector3(rr * 0.8, rr * 0.6, rr)), t);
          return;
        }
        const laser = model.lasers[0];
        const cam = model.vision[0] ? model.byId.get(model.vision[0].cameraId) : undefined;
        switch (p) {
          case 'front':
            return go(c.clone().add(new THREE.Vector3(0, 0, d)), c);
          case 'top':
            return go(c.clone().add(new THREE.Vector3(0, d, 0.001)), c);
          case 'side':
            return go(c.clone().add(new THREE.Vector3(d, 0, 0)), c);
          case 'laser':
            if (laser) {
              const f = new THREE.Vector3(...W(laser.focus));
              return go(f.clone().add(new THREE.Vector3(0.35, 0.3, 0.45)), f.clone().add(new THREE.Vector3(0, 0.12, 0)));
            }
            break;
          case 'inspection':
            if (cam) {
              const t = new THREE.Vector3(cam.position[0] * MM, cam.position[1] * MM - 0.08, 0);
              return go(t.clone().add(new THREE.Vector3(0.3, 0.2, 0.4)), t);
            }
            break;
          case 'maintenance':
            return go(c.clone().add(new THREE.Vector3(d * 0.4, d * 0.35, -d * 0.9)), c);
          case 'process': {
            const a = Object.values(model.anchors)[0];
            if (a) {
              const t = new THREE.Vector3(...W(a));
              return go(t.clone().add(new THREE.Vector3(0.5, 0.45, 0.8)), t);
            }
            break;
          }
        }
        go(c.clone().add(new THREE.Vector3(d * 0.75, d * 0.55, d * 0.9)), c);
      },
      canvas: () => gl.domElement,
      camera: () => ({ position: camera.position.toArray(), target: controls ? controls.target.toArray() : c.toArray() }),
      setCamera(position, target) {
        go(new THREE.Vector3(...(position as [number, number, number])), new THREE.Vector3(...(target as [number, number, number])));
      },
    }),
    [camera, controls, gl, model, r], // eslint-disable-line react-hooks/exhaustive-deps
  );
  return null;
}

function Section({ view }: { view: SceneView }) {
  const { gl } = useThree();
  useEffect(() => {
    const a = view.section.axis;
    if (!a) {
      gl.clippingPlanes = [];
      return;
    }
    const n = a === 'x' ? new THREE.Vector3(-1, 0, 0) : a === 'y' ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 0, -1);
    gl.clippingPlanes = [new THREE.Plane(n, view.section.pos * MM)];
    return () => {
      gl.clippingPlanes = [];
    };
  }, [gl, view.section.axis, view.section.pos]);
  return null;
}

/** Parts moving through an inline line: a small pool positioned from the DES state each frame (§35–§37). */
function FlowParts({ model, stateRef }: { model: MachineModel; stateRef: MutableRefObject<SimulationState | null> }) {
  const pool = 28;
  const refs = useRef<(THREE.Group | null)[]>([]);
  const keys = Object.keys(model.anchors);
  useFrame(() => {
    const s = stateRef.current;
    let n = 0;
    const place = (x: number, y: number, z: number, state: 'raw' | 'processing') => {
      const g = refs.current[n++];
      if (!g) return;
      g.visible = true;
      g.position.set(x * MM, y * MM, z * MM);
      g.userData.state = state;
    };
    if (s)
      s.stations.forEach((st, i) => {
        const a = model.anchors[keys[i]];
        if (!a) return;
        st.servers.forEach((sv, j) => {
          if (sv.state === 'busy' || sv.state === 'blocked') place(a[0], a[1] - model.workpiece.thickness, a[2] + (st.servers.length > 1 ? (j - (st.servers.length - 1) / 2) * 220 : 0), sv.state === 'busy' ? 'processing' : 'raw');
        });
        const next = model.anchors[keys[i + 1]];
        for (let q = 0; q < Math.min(st.queue, 6) && n < pool; q++) {
          const x = next ? a[0] + ((q + 1) * (next[0] - a[0])) / (Math.min(st.queue, 6) + 1) : a[0] + (q + 1) * (model.workpiece.length + 20);
          place(x, model.tableTop + 60, 0, 'raw');
        }
      });
    for (; n < pool; n++) if (refs.current[n]) refs.current[n]!.visible = false;
  });
  return (
    <group>
      {Array.from({ length: pool }, (_, i) => (
        <group key={i} ref={(g) => (refs.current[i] = g)} visible={false}>
          <WorkpieceMesh template={model.workpiece.template} l={model.workpiece.length} w={model.workpiece.width} t={model.workpiece.thickness} />
        </group>
      ))}
    </group>
  );
}

/** Beam path + symbolic scan path + hot spot, driven by the laser state each frame (§23–§29). */
function LaserFx({ model, stateRef, view, paths, partOffset }: { model: MachineModel; stateRef: MutableRefObject<SimulationState | null>; view: SceneView; paths: ScanPath[]; partOffset: [number, number][] }) {
  return (
    <>
      {model.lasers.map((_, i) => (
        <OneBeam key={i} i={i} model={model} stateRef={stateRef} view={view} path={paths[i]} offset={partOffset[i] ?? [0, 0]} />
      ))}
    </>
  );
}

function OneBeam({ i, model, stateRef, view, path, offset }: { i: number; model: MachineModel; stateRef: MutableRefObject<SimulationState | null>; view: SceneView; path?: ScanPath; offset: [number, number] }) {
  const l = model.lasers[i];
  const color = beamColor(l.wavelength, view.beam.color);
  const beamRef = useRef<THREE.Group>(null);
  const tip = useRef<THREE.Mesh>(null);
  const last = useRef<THREE.BufferGeometry>(null);
  const marks = useRef<THREE.BufferGeometry>(null);
  const segs = useMemo(() => {
    if (!path) return new Float32Array(0);
    const out: number[] = [];
    for (const s of path.strokes) for (let k = 1; k < s.length; k++) out.push(s[k - 1][0], 0, s[k - 1][1], s[k][0], 0, s[k][1]);
    return new Float32Array(out);
  }, [path]);
  const segLen = useMemo(() => {
    const L: number[] = [];
    let acc = 0;
    for (let k = 0; k < segs.length; k += 6) {
      acc += Math.hypot(segs[k + 3] - segs[k], segs[k + 5] - segs[k + 2]);
      L.push(acc);
    }
    return L;
  }, [segs]);
  const f = l.focus;
  useFrame(() => {
    const s = stateRef.current;
    const on = !!s?.laserOn[i] && view.beam.on;
    const u = s?.scan[i] ?? 0;
    if (beamRef.current) beamRef.current.visible = on;
    const p = path ? pointAt(path, u) : { p: [0, 0] as [number, number], on: true };
    const x = f[0] + p.p[0] + offset[0];
    const z = f[2] + p.p[1] + offset[1];
    if (tip.current) {
      tip.current.visible = on;
      tip.current.position.set(x * MM, (f[1] + 0.6) * MM, z * MM);
    }
    if (last.current) {
      const arr = last.current.attributes.position as THREE.BufferAttribute;
      const ft = l.points[l.points.length - 2];
      arr.setXYZ(0, ft[0] * MM, ft[1] * MM, ft[2] * MM);
      arr.setXYZ(1, x * MM, f[1] * MM, z * MM);
      arr.needsUpdate = true;
    }
    if (marks.current && path) {
      // marks accumulate while the laser works on the current part; reset when a new part starts
      const done = on || (s?.scan[i] ?? 0) > 0 ? u * path.length : 0;
      let n = 0;
      while (n < segLen.length && segLen[n] <= done) n++;
      marks.current.setDrawRange(0, n * 2);
    }
  });
  const pts = l.points.slice(0, -1).map((q) => W(q));
  const op = Math.max(0.15, Math.min(1, view.beam.intensity));
  return (
    <group>
      <group ref={beamRef} visible={false}>
        <Line points={pts} color={color} lineWidth={2} transparent opacity={op} />
        <lineSegments>
          <bufferGeometry ref={last}>
            <bufferAttribute attach="attributes-position" args={[new Float32Array(6), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={color} transparent opacity={op} />
        </lineSegments>
      </group>
      <mesh ref={tip} visible={false}>
        <sphereGeometry args={[Math.max(0.6, view.beam.spot / 2) * MM * 2, 12, 12]} />
        <meshBasicMaterial color="#fff4e0" />
      </mesh>
      {path && (
        <group position={[(f[0] + offset[0]) * MM, (f[1] + 0.3) * MM, (f[2] + offset[1]) * MM]} scale={MM}>
          <lineSegments>
            <bufferGeometry ref={marks}>
              <bufferAttribute attach="attributes-position" args={[segs, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#101418" />
          </lineSegments>
          {view.trail && (
            <lineSegments>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[segs, 3]} />
              </bufferGeometry>
              <lineBasicMaterial color={color} transparent opacity={0.18} />
            </lineSegments>
          )}
        </group>
      )}
    </group>
  );
}

function Fov({ model, live }: { model: MachineModel; live: LiveView }) {
  return (
    <>
      {model.vision.map((v) => {
        const cam = model.byId.get(v.cameraId);
        if (!cam || v.fovX == null || v.fovY == null || v.wd == null) return null;
        const a = model.anchors[v.stationKey];
        const y0 = a[1];
        const lensY = y0 + v.wd;
        const cx = cam.position[0];
        const active = live.vision[v.stationKey];
        const corners: [number, number, number][] = [
          [cx - v.fovX / 2, y0, -v.fovY / 2],
          [cx + v.fovX / 2, y0, -v.fovY / 2],
          [cx + v.fovX / 2, y0, v.fovY / 2],
          [cx - v.fovX / 2, y0, v.fovY / 2],
        ];
        const apex: [number, number, number] = [cx, lensY, 0];
        const col = active ? '#35e0a1' : '#4fa3b0';
        return (
          <group key={v.stationKey}>
            {corners.map((q, i) => (
              <Line key={i} points={[W(apex), W(q)]} color={col} lineWidth={1} transparent opacity={active ? 0.9 : 0.45} />
            ))}
            <Line points={[...corners, corners[0]].map(W)} color={col} lineWidth={active ? 2 : 1} />
            <mesh position={[cx * MM, (y0 + 0.4) * MM, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[v.fovX * MM, v.fovY * MM]} />
              <meshBasicMaterial color={col} transparent opacity={active ? 0.16 : 0.06} depthWrite={false} />
            </mesh>
            {v.target && (
              <Line
                points={(
                  [
                    [cx - v.target.x / 2, y0 + 0.5, -v.target.y / 2],
                    [cx + v.target.x / 2, y0 + 0.5, -v.target.y / 2],
                    [cx + v.target.x / 2, y0 + 0.5, v.target.y / 2],
                    [cx - v.target.x / 2, y0 + 0.5, v.target.y / 2],
                    [cx - v.target.x / 2, y0 + 0.5, -v.target.y / 2],
                  ] as [number, number, number][]
                ).map(W)}
                color="#f5a524"
                lineWidth={1}
                dashed
                dashSize={0.004}
                gapSize={0.003}
              />
            )}
          </group>
        );
      })}
    </>
  );
}

function Field({ model }: { model: MachineModel }) {
  return (
    <>
      {model.lasers.map((l, i) => {
        if (l.field == null) return null;
        const f = l.focus;
        const h = l.field / 2;
        const pa = model.processArea;
        return (
          <group key={i}>
            <Line points={([[f[0] - h, f[1] + 0.2, f[2] - h], [f[0] + h, f[1] + 0.2, f[2] - h], [f[0] + h, f[1] + 0.2, f[2] + h], [f[0] - h, f[1] + 0.2, f[2] + h], [f[0] - h, f[1] + 0.2, f[2] - h]] as [number, number, number][]).map(W)} color="#00a99d" lineWidth={1} dashed dashSize={0.006} gapSize={0.004} />
            {pa && <Line points={([[f[0] - pa.x / 2, f[1] + 0.3, f[2] - pa.y / 2], [f[0] + pa.x / 2, f[1] + 0.3, f[2] - pa.y / 2], [f[0] + pa.x / 2, f[1] + 0.3, f[2] + pa.y / 2], [f[0] - pa.x / 2, f[1] + 0.3, f[2] + pa.y / 2], [f[0] - pa.x / 2, f[1] + 0.3, f[2] - pa.y / 2]] as [number, number, number][]).map(W)} color={pa.x > l.field || pa.y > l.field ? '#e5484d' : '#f5a524'} lineWidth={1.5} />}
          </group>
        );
      })}
    </>
  );
}

function Dims({ model }: { model: MachineModel }) {
  const b = model.bounds;
  const y = 2;
  const [x0, , z0] = b.min;
  const [x1, y1, z1] = b.max;
  return (
    <group>
      <Line points={([[x0, y, z1 + 120], [x1, y, z1 + 120]] as [number, number, number][]).map(W)} color="#8d9a9a" lineWidth={1} />
      <Line points={([[x1 + 120, y, z0], [x1 + 120, y, z1]] as [number, number, number][]).map(W)} color="#8d9a9a" lineWidth={1} />
      <Line points={([[x0 - 120, 0, z1], [x0 - 120, y1, z1]] as [number, number, number][]).map(W)} color="#8d9a9a" lineWidth={1} />
    </group>
  );
}


export interface ScreenLabel {
  key: string;
  /** world position, metres */
  pos: [number, number, number];
  text: string;
  color?: string;
  center?: boolean;
  dim?: boolean;
}

/**
 * Screen-space labels projected every frame. The DOM nodes are managed imperatively outside React's
 * reconciler (cheaper than one React root per label and safe to add / remove at any time).
 */
function ScreenLabels({ items }: { items: ScreenLabel[] }) {
  const { gl, camera, size } = useThree();
  const host = useMemo(() => {
    const d = document.createElement('div');
    d.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1';
    d.setAttribute('aria-hidden', 'true');
    return d;
  }, []);
  const els = useRef(new Map<string, HTMLDivElement>());
  useEffect(() => {
    const parent = gl.domElement.parentElement;
    parent?.appendChild(host);
    return () => host.remove();
  }, [gl, host]);
  useEffect(() => {
    const keep = new Set(items.map((i) => i.key));
    for (const [k, el] of els.current)
      if (!keep.has(k)) {
        el.remove();
        els.current.delete(k);
      }
    for (const it of items) {
      let el = els.current.get(it.key);
      if (!el) {
        el = document.createElement('div');
        host.appendChild(el);
        els.current.set(it.key, el);
      }
      el.className = `twin-label twin-abs${it.dim ? ' twin-dim' : ''}${it.center ? ' twin-center' : ''}`;
      el.textContent = it.text;
      el.style.borderColor = it.color ?? '';
    }
  }, [items, host]);
  const v = useMemo(() => new THREE.Vector3(), []);
  // de-clutter: labels are placed in priority order; one that would overlap a placed label is
  // nudged up / down, or hidden (it reappears when the view changes)
  const placed = useMemo<[number, number, number, number][]>(() => [], []);
  useFrame(() => {
    placed.length = 0;
    for (const it of items) {
      const el = els.current.get(it.key);
      if (!el) continue;
      v.set(it.pos[0], it.pos[1], it.pos[2]).project(camera);
      let visible = v.z > -1 && v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
      const wpx = it.text.length * 6.6 + 14;
      const hpx = 19;
      const x = (v.x * 0.5 + 0.5) * size.width;
      let y = (-v.y * 0.5 + 0.5) * size.height;
      if (visible) {
        const left = it.center ? x - wpx / 2 : x + 6;
        const hit = (yy: number) => placed.some(([a, b, c, d]) => left < c && left + wpx > a && yy - hpx / 2 < d && yy + hpx / 2 > b);
        const tries = [0, -21, 21, -42, 42];
        const dy = tries.find((t) => !hit(y + t));
        if (dy == null) visible = false;
        else {
          y += dy;
          placed.push([left, y - hpx / 2, left + wpx, y + hpx / 2]);
        }
      }
      el.style.display = visible ? '' : 'none';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
  });
  return null;
}

const CALLOUT_KINDS = new Set(['laser_source', 'collimator', 'beam_expander', 'galvo', 'f_theta', 'laser_head', 'camera', 'xy_stage', 'fixture', 'cabinet', 'hmi', 'fume', 'chiller', 'estop', 'tower', 'door', 'nozzle', 'z_slide', 'frl', 'valve', 'robot', 'conveyor', 'bin']);

const ROUTE_STYLE: Record<string, { color: string; r: number; rough: number }> = {
  fiber: { color: '#e8b500', r: 5, rough: 0.5 },
  fume: { color: '#8f989c', r: 24, rough: 0.85 },
  pneumatic: { color: '#2f6fd6', r: 3.5, rough: 0.5 },
  cooling: { color: '#3b82f6', r: 6, rough: 0.5 },
  cable: { color: '#262c30', r: 5, rough: 0.8 },
};

/** Physical hoses / fibre / cables as tubes along a conceptual spline (§91). */
function Tube({ points, kind }: { points: [number, number, number][]; kind: string }) {
  const st = ROUTE_STYLE[kind] ?? ROUTE_STYLE.cable;
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0] * MM, p[1] * MM, p[2] * MM)), false, 'centripetal'), 80, st.r * MM, kind === 'fume' ? 14 : 8, false), [points, st.r, kind]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={st.color} roughness={st.rough} metalness={kind === 'fume' ? 0.3 : 0.1} />
    </mesh>
  );
}

/** Thin accent box around the selected / highlighted object (cheaper than per-mesh outlines). */
function SelBox({ o, color }: { o: Machine3DObject; color: string }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry((o.size[0] + 16) * MM, (o.size[1] + 16) * MM, (o.size[2] + 16) * MM)), [o.size]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} position={[o.position[0] * MM, (o.position[1] + o.size[1] / 2) * MM, o.position[2] * MM]}>
      <lineBasicMaterial color={color} />
    </lineSegments>
  );
}

const ZONE_COLOR = { operator: '#3b82f6', robot: '#f5a524', laser: '#e5484d', maintenance: '#a78bfa', restricted: '#f97316' } as const;

export const MachineScene = forwardRef<
  SceneApi,
  {
    model: MachineModel;
    view: SceneView;
    live: LiveView;
    stateRef: MutableRefObject<SimulationState | null>;
    paths: ScanPath[];
    onPick: (id: string | null) => void;
    onHover: (id: string | null, x?: number, y?: number) => void;
    onMeasure: (p: [number, number, number]) => void;
    onDecline?: () => void;
    ghost?: MachineModel | null;
    factory?: { x: number; z: number; rot: number; label: string }[];
    debugRef?: MutableRefObject<HTMLDivElement | null>;
    hmi?: { title: string; recipe: string };
  }
>(function MachineScene({ model, view, live, stateRef, paths, onPick, onHover, onMeasure, onDecline, ghost, factory, debugRef, hmi }, ref) {
  const api = useRef<SceneApi | null>(null);
  useImperativeHandle(ref, () => ({
    view: (p, id) => api.current?.view(p, id),
    canvas: () => api.current?.canvas() ?? null,
    camera: () => api.current?.camera() ?? { position: [0, 0, 0], target: [0, 0, 0] },
    setCamera: (p, t) => api.current?.setCamera(p, t),
  }));
  const kids = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const o of model.objects) if (o.parentId) m.set(o.parentId, [...(m.get(o.parentId) ?? []), o.id]);
    return m;
  }, [model]);
  const isolated = useMemo(() => {
    if (!view.isolate) return null;
    const s = new Set<string>();
    const walk = (id: string) => {
      s.add(id);
      for (const k of kids.get(id) ?? []) walk(k);
    };
    walk(view.isolate);
    return s;
  }, [view.isolate, kids]);
  const wp = useMemo(() => (model.carrier === 'axes' ? workpieceObject(model) : null), [model]);
  // offset between the lens axis and the part centre at the marking pose (marks stay on the part)
  const partOffset = useMemo(
    () =>
      model.lasers.map((l) => {
        if (!wp) return [0, 0] as [number, number];
        const mv = [...model.plan].reverse().find((m) => m.stationKey === l.stationKey);
        const off = mv ? carriedOffset(wp, mv.to, model.axes) : [0, 0, 0];
        return [wp.position[0] + off[0] - l.focus[0], wp.position[2] + off[2] - l.focus[2]] as [number, number];
      }),
    [model, wp],
  );
  const stateOf = (o: Machine3DObject) => (o.stationKey ? live.stationState[o.stationKey] : undefined);
  const visual = (o: Machine3DObject): Visual => {
    if (isolated && !isolated.has(o.id)) return 'dim';
    if (view.collisionIds.has(o.id)) return 'collision';
    if (view.selected === o.id) return 'selected';
    if (view.hover === o.id) return 'hover';
    if (stateOf(o) === 'down') return 'fault';
    if (view.highlight?.has(o.id)) return 'active';
    if (view.bottleneck && o.stationKey === view.bottleneck && o.kind !== 'generic') return 'warning';
    return 'normal';
  };
  const render = (o: Machine3DObject) => {
    if (o.kind === 'group' || o.kind === 'station') return null;
    if (!view.layers[o.layer] || view.hidden.has(o.id)) return null;
    const v = visual(o);
    const xr = view.xray && ['enclosure', 'door', 'frame', 'cabinet', 'table', 'chiller', 'fume'].includes(o.kind);
    const ov = view.overlay?.get(o.id);
    const ex = view.explode * 520;
    const exOff: [number, number, number] = [o.explode[0] * ex * MM, o.explode[1] * ex * MM, o.explode[2] * ex * MM];
    const act = (o.kind === 'camera' || o.kind === 'light') && o.stationKey ? live.vision[o.stationKey] : o.kind === 'galvo' ? live.laserOn.some(Boolean) : o.kind === 'robot' ? stateOf(o) === 'busy' : o.kind === 'sensor' ? stateOf(o) === 'busy' : false;
    const body = (
      <group
        key={o.id}
        position={exOff}
        onClick={(e) => {
          e.stopPropagation();
          if (view.measure) onMeasure([e.point.x, e.point.y, e.point.z]);
          else onPick(o.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(o.id, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        }}
        onPointerOut={() => onHover(null)}
      >
        <ObjectBody o={o} visual={v} xray={xr} live={{ active: act, tower: live.tower }} />
        {(view.selected === o.id || view.highlight?.has(o.id)) && <SelBox o={o} color={view.selected === o.id ? '#00e0cf' : '#4fd1c5'} />}
        {ov && (
          <mesh position={[o.position[0] * MM, (o.position[1] + o.size[1] / 2) * MM, o.position[2] * MM]}>
            <boxGeometry args={[(o.size[0] + 12) * MM, (o.size[1] + 12) * MM, (o.size[2] + 12) * MM]} />
            <meshBasicMaterial color={ov} transparent opacity={0.28} depthWrite={false} />
            <Edges color={ov} />
          </mesh>
        )}
      </group>
    );
    return o.carriedBy?.length ? (
      <Carried key={o.id} o={o} model={model} stateRef={stateRef}>
        {body}
      </Carried>
    ) : (
      body
    );
  };
  const labels = useMemo(() => {
    const out: ScreenLabel[] = [];
    if (!view.labels) return out;
    if (view.fov && view.layers.Vision && !view.customer)
      for (const v of model.vision) {
        const cam = model.byId.get(v.cameraId);
        if (!cam || v.fovX == null || v.fovY == null || v.wd == null) continue;
        const a = model.anchors[v.stationKey];
        out.push({ key: `fov-${v.stationKey}`, pos: W([cam.position[0] + v.fovX / 2, a[1], v.fovY / 2]), text: `FOV ${v.fovX.toFixed(0)} × ${v.fovY.toFixed(0)} mm · WD ${v.wd} mm` });
      }
    if (view.field && view.layers.Laser)
      model.lasers.forEach((l, i) => {
        if (l.field == null) return;
        const pa = model.processArea;
        out.push({ key: `field-${i}`, pos: W([l.focus[0] + l.field / 2, l.focus[1], l.focus[2] + l.field / 2]), text: `Marking field: ${l.field} × ${l.field} mm${pa ? ` · required ${pa.x} × ${pa.y} mm` : ''}` });
      });
    if (view.zones)
      for (const z of model.zones.filter((z) => z.enabled || view.zonesAll)) out.push({ key: `zone-${z.key}`, pos: W([z.position[0], z.position[1] + z.size[1] + 20, z.position[2] + z.size[2] / 2]), text: z.name, color: ZONE_COLOR[z.type], center: true });
    if (view.dims) {
      const b = model.bounds;
      out.push({ key: 'dim-w', pos: W([(b.min[0] + b.max[0]) / 2, 2, b.max[2] + 120]), text: `W ${Math.round(model.dims.width)} mm`, dim: true, center: true });
      out.push({ key: 'dim-d', pos: W([b.max[0] + 120, 2, (b.min[2] + b.max[2]) / 2]), text: `D ${Math.round(model.dims.depth)} mm`, dim: true, center: true });
      out.push({ key: 'dim-h', pos: W([b.min[0] - 120, b.max[1] / 2, b.max[2]]), text: `H ${Math.round(model.dims.height)} mm`, dim: true, center: true });
    }
    if (view.callouts)
      for (const o of model.objects) {
        if (!CALLOUT_KINDS.has(o.kind) || !view.layers[o.layer] || view.hidden.has(o.id)) continue;
        if (o.carriedBy?.length && o.kind !== 'fixture') continue;
        const name = view.customer ? (o.name.split(' — ')[0] ?? o.name) : o.name.replace(/ \(part of the laser source\)/, '');
        out.push({ key: `co-${o.id}`, pos: W([o.position[0], o.position[1] + o.size[1] + 25, o.position[2]]), text: name.length > 38 ? `${name.slice(0, 36)}…` : name, center: true });
      }
    if (ghost) out.push({ key: 'ghost', pos: [ghost.bounds.min[0] * MM, (ghost.bounds.max[1] + 80) * MM, -(model.dims.depth + ghost.dims.depth / 2 + 900) * MM], text: 'Comparison scenario (outline)', color: '#a78bfa' });
    factory?.forEach((f, i) => out.push({ key: `fac-${i}`, pos: [f.x * MM + ((model.bounds.min[0] + model.bounds.max[0]) / 2) * MM, (model.dims.height + 120) * MM, f.z * MM], text: f.label, center: true }));
    return out;
  }, [view.labels, view.fov, view.field, view.zones, view.zonesAll, view.dims, view.layers, view.customer, view.callouts, view.hidden, model, ghost, factory]);
  const rt: TwinRuntime = useMemo(() => ({ stateRef, model, paths, detail: view.quality === 'performance' ? 'low' : 'high', enclosure: view.enclosure, hmi: hmi ?? { title: model.label, recipe: '—' }, reduced: view.reducedMotion }), [stateRef, model, paths, view.quality, view.enclosure, hmi, view.reducedMotion]);
  const shadows = view.quality === 'high';
  const b = model.bounds;
  const cx = ((b.min[0] + b.max[0]) / 2) * MM;
  const cz = ((b.min[2] + b.max[2]) / 2) * MM;
  const span = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]) * MM;
  return (
    <RuntimeCtx.Provider value={rt}>
      {view.ortho ? <OrthographicCamera makeDefault position={[cx + 2.2, 2.2, cz + 2.6]} near={-50} far={100} /> : <PerspectiveCamera makeDefault fov={35} position={[cx + 2.4, 2.1, cz + 2.9]} near={0.01} far={200} />}
      <OrbitControls makeDefault target={[cx, 0.9, cz]} enableDamping={!view.reducedMotion} dampingFactor={0.12} maxPolarAngle={Math.PI * 0.495} />
      <CameraRig model={model} api={api} ortho={view.ortho} reduced={view.reducedMotion} />
      <Section view={view} />
      {onDecline && <PerformanceMonitor onDecline={onDecline} />}
      {debugRef && <Debug out={debugRef} />}
      <ScreenLabels items={labels} />
      <color attach="background" args={['#0b0f11']} />
      <hemisphereLight args={['#dfe9ec', '#1a1f22', 0.55]} />
      <directionalLight position={[cx + 3, 5, cz + 3]} intensity={1.6} castShadow={shadows} shadow-mapSize={[2048, 2048]} shadow-camera-left={-span} shadow-camera-right={span} shadow-camera-top={span} shadow-camera-bottom={-span} />
      <directionalLight position={[cx - 4, 3, cz - 2]} intensity={0.35} />
      {view.grid && <Grid position={[cx, 0, cz]} args={[20, 20]} cellSize={0.1} cellColor="#1c2a2e" sectionSize={1} sectionColor="#24444a" fadeDistance={14} infiniteGrid />}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.001, cz]} receiveShadow onClick={(e) => (view.measure ? onMeasure([e.point.x, e.point.y, e.point.z]) : onPick(null))}>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.35} />
      </mesh>
      {model.objects.map(render)}
      {wp && view.layers.Material && (
        <Carried o={wp} model={model} stateRef={stateRef}>
          <CarriedPart wp={wp} model={model} stateRef={stateRef} />
        </Carried>
      )}
      {model.carrier === 'flow' && view.layers.Material && <FlowParts model={model} stateRef={stateRef} />}
      {view.layers.Laser && <LaserFx model={model} stateRef={stateRef} view={view} paths={paths} partOffset={partOffset} />}
      {view.fov && view.layers.Vision && <Fov model={model} live={live} />}
      {view.field && view.layers.Laser && <Field model={model} />}
      {view.dims && <Dims model={model} />}
      {view.zones &&
        model.zones
          .filter((z) => z.enabled || view.zonesAll)
          .map((z) => (
            <group key={z.key} position={W([z.position[0], z.position[1], z.position[2]])}>
              <mesh position={[0, (z.size[1] / 2) * MM, 0]}>
                <boxGeometry args={[z.size[0] * MM, z.size[1] * MM, z.size[2] * MM]} />
                <meshBasicMaterial color={ZONE_COLOR[z.type]} transparent opacity={z.type === 'laser' ? 0.05 : 0.1} depthWrite={false} />
                <Edges color={ZONE_COLOR[z.type]} />
              </mesh>
            </group>
          ))}
      {model.routes
        .filter((r) => r.points.length > 1 && (r.kind === 'cable' ? view.routes && view.layers.Electrical : r.kind === 'pneumatic' ? view.layers.Pneumatic : r.kind === 'fume' ? view.layers.Safety : view.layers.Laser))
        .map((r) => (
          <Tube key={r.id} points={r.points} kind={r.kind} />
        ))}
      {view.measurePts.length > 0 && (
        <group>
          {view.measurePts.map((p, i) => (
            <mesh key={i} position={p}>
              <sphereGeometry args={[0.006, 12, 12]} />
              <meshBasicMaterial color="#f5a524" />
            </mesh>
          ))}
          {view.measurePts.length === 2 && <Line points={view.measurePts} color="#f5a524" lineWidth={2} />}
        </group>
      )}
      {ghost && (
        <group position={[0, 0, -(model.dims.depth + ghost.dims.depth / 2 + 900) * MM]}>
          {ghost.objects
            .filter((o) => o.kind !== 'group' && o.kind !== 'station' && o.size[0] > 0)
            .map((o) => (
              <mesh key={o.id} position={[o.position[0] * MM, (o.position[1] + o.size[1] / 2) * MM, o.position[2] * MM]}>
                <boxGeometry args={[o.size[0] * MM, o.size[1] * MM, o.size[2] * MM]} />
                <meshBasicMaterial color="#a78bfa" transparent opacity={0.05} depthWrite={false} />
                <Edges color="#a78bfa" />
              </mesh>
            ))}
        </group>
      )}
      {factory?.map((f, i) => (
        <group key={i} position={[f.x * MM, 0, f.z * MM]} rotation={[0, (f.rot * Math.PI) / 180, 0]}>
          <mesh position={[cx, (model.dims.height / 2) * MM, cz]}>
            <boxGeometry args={[model.dims.width * MM, model.dims.height * MM, model.dims.depth * MM]} />
            <meshStandardMaterial color="#2b3338" transparent opacity={0.55} />
            <Edges color="#00a99d" />
          </mesh>
        </group>
      ))}
      {view.axes && (
        <GizmoHelper alignment="bottom-right" margin={[64, 64]}>
          <GizmoViewport axisColors={['#e5484d', '#2fbf71', '#3b82f6']} labelColor="#0b0f11" />
        </GizmoHelper>
      )}
    </RuntimeCtx.Provider>
  );
});

function CarriedPart({ wp, model, stateRef }: { wp: Machine3DObject; model: MachineModel; stateRef: MutableRefObject<SimulationState | null> }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = (stateRef.current?.inSystem ?? 0) > 0;
  });
  return (
    <group ref={g} position={W(wp.position)}>
      <WorkpieceMesh template={model.workpiece.template} l={model.workpiece.length} w={model.workpiece.width} t={model.workpiece.thickness} />
    </group>
  );
}

function Debug({ out }: { out: MutableRefObject<HTMLDivElement | null> }) {
  const { gl, scene } = useThree();
  const acc = useRef({ t: 0, frames: 0 });
  useFrame((_, dt) => {
    acc.current.t += dt;
    acc.current.frames++;
    if (acc.current.t < 0.5 || !out.current) return;
    let objects = 0;
    scene.traverse(() => objects++);
    const i = gl.info;
    out.current.textContent = `FPS ${Math.round(acc.current.frames / acc.current.t)} · draw calls ${i.render.calls} · triangles ${i.render.triangles.toLocaleString()} · objects ${objects} · geometries ${i.memory.geometries} · textures ${i.memory.textures}`;
    acc.current = { t: 0, frames: 0 };
  });
  return null;
}
