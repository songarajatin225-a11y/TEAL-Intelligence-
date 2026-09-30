import { Canvas } from '@react-three/fiber';
import clsx from 'clsx';
import { AlertTriangle, BookOpen, Box, Bug, Camera, Captions, ChevronDown, ChevronLeft, ChevronRight, CircleStop, Expand, Eye, EyeOff, FileDown, Focus, Gauge, GraduationCap, Grid3x3, Info, Layers, LayoutGrid, Lightbulb, Link2, ListTree, Maximize2, Minimize2, Palette, PanelLeft, Pause, Play, RotateCcw, Ruler, Scan, ScanEye, Scissors, Search, SkipForward, Square, Video, X } from 'lucide-react';
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { toast } from '../../components/toast';
import { Badge, Button, Card, Loading, Notice, Popover, SegmentedControl, Tabs, Unknown } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { productTypeLabel, type Part, type Recipe } from '../../domain/engineering';
import { displaySpec, KEY_SPECS, readSpec } from '../../services/eng/specs';
import { sheetFor } from '../../services/eng/componentDetail';
import { alternativesFor, selectedParts } from '../../services/sim/supply';
import { resolveScenario } from '../../services/sim/model';
import { findingsByObject, type TwinCheck } from '../../services/twin/checks';
import { buildMachine, LAYERS, type Layer, type Machine3DObject } from '../../services/twin/machine';
import { livePower, utilities } from '../../services/twin/utilities';
import { PREVIEW_STATION_S } from '../../services/twin/preview';
import type { SimulationState } from '../../services/twin/timeline';
import { explainObject, machineTour, narrate, type ExplainCtx, type TourStep } from '../../services/twin/explain';
import { SheetBody } from '../engineering/ComponentSheet';
import { big, money, num, pct } from '../studio/shared';
import type { TabProps } from '../studio/ScenarioPage';
import { NumInput, SmallSelect } from '../studio/tabs/edit';
import { AlarmsHmiPanel, AssumptionsPanel, ChecksPanel, ComparePanel, FaultsPanel, fmtT, InputsPanel, IoPanel, MotionPanel, PartTracePanel, RunsPanel, SequencePanel, TimelinePanel, UtilitiesPanel } from './panels';
import { MachineScene, POV_FRACTION, type LiveView, type SceneApi, type SceneView, type ViewPreset } from './three/MachineScene';
import type { EnclosureMode } from './three/procedural';
import type { DesResult } from '../../services/sim/des';
import { BuilderPanel } from './BuilderPanel';
import { costColor, ORIGIN_COLOR, originColors, useTwinModel, useTwinRun, utilColor, type RunOptions } from './useTwin';

/*
 * 3D MACHINE SIMULATOR + DIGITAL TWIN WORKBENCH (3D master prompt §5–§7, §38–§46, §55–§61, §83–§90).
 * An extension of the Equipment Simulation Studio: the scene, timeline, KPIs, HMI and alarms all read
 * one central simulation state; the scenario record stays the source of truth.
 */

const TwoD = lazy(() => import('../studio/tabs/TwinTab'));

/** Cheap capability check. Creating a throwaway WebGL context only to test support costs as much as
 * the real one (seconds on software GL), so a context that then fails is caught by GLBoundary instead. */
function webglLikely(): boolean {
  return typeof window !== 'undefined' && ('WebGL2RenderingContext' in window || 'WebGLRenderingContext' in window);
}

const isGLError = (e: unknown) => /webgl|context/i.test(String((e as Error)?.message ?? e));

/** Falls back to the 2D simulator when the WebGL context cannot be created; any other error is rethrown. */
class GLBoundary extends Component<{ onFail: () => void; children: ReactNode }, { error: unknown }> {
  override state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  override componentDidCatch(error: unknown) {
    if (isGLError(error)) this.props.onFail();
  }
  override render() {
    if (this.state.error != null) {
      if (isGLError(this.state.error)) return null;
      throw this.state.error;
    }
    return this.props.children;
  }
}

export default function MachineTab(p: TabProps) {
  const [ok, setOk] = useState(webglLikely);
  if (!ok)
    return (
      <div className="space-y-3">
        <Notice tone="warn">3D view unavailable on this device (WebGL is disabled or unsupported). Showing the 2D engineering simulator instead — architecture, material flow, sequence, cycle time, BOM and simulation remain available in the other tabs.</Notice>
        <Suspense fallback={<Loading />}>
          <TwoD {...p} />
        </Suspense>
      </div>
    );
  return <Workbench {...p} onGLFail={() => setOk(false)} />;
}

const DARK_WARN = '!bg-[#f5c46b]/10 !text-[#f5c46b] !ring-[#f5c46b]/35';
const DARK_NEUTRAL = '!bg-white/5 !text-[#c9d3d3] !ring-white/15';
type Overlay = 'none' | 'state' | 'utilization' | 'localization' | 'cost' | 'requirement' | 'risk';
type CamMode = 'engineering' | 'customer' | 'exploded' | 'xray' | 'process' | 'laser' | 'inspection' | 'maintenance';
type Bottom = 'builder' | 'inputs' | 'timeline' | 'sequence' | 'checks' | 'io' | 'hmi' | 'motion' | 'utilities' | 'trace' | 'faults' | 'runs' | 'compare' | 'assumptions';

const reducedMotionQuery = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const allLayers = () => Object.fromEntries(LAYERS.map((l) => [l, true])) as Record<Layer, boolean>;
const narrowScreen = () => typeof window !== 'undefined' && window.innerWidth < 640;

function Workbench({ eng, sim, set, d, customer, onGLFail }: TabProps & { onGLFail: () => void }) {
  // mount the WebGL canvas after the page has painted: context creation and shader compilation are
  // synchronous, so the header, status, toolbar and panels appear first instead of waiting on the GPU
  const [glReady, setGlReady] = useState(false);
  useEffect(() => {
    let to = 0;
    const raf = requestAnimationFrame(() => (to = window.setTimeout(() => setGlReady(true), 0)));
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(to);
    };
  }, []);
  const [params, setParams] = useSearchParams();
  const twin = useTwinModel(eng, sim, d);
  const { model } = twin;
  const [run, setRunState] = useState<RunOptions>({ seed: 11, horizon_s: 3600, failures: false, scenarioFaults: false, injected: [] });
  const setRun = useCallback((f: (r: RunOptions) => RunOptions) => setRunState(f), []);
  const { des, player, baseline, error, preview } = useTwinRun(d, model, run);
  const util = useMemo(() => utilities(d.res, eng.byId, eng.defs), [d.res, eng.byId, eng.defs]);
  const findings = useMemo(() => findingsByObject(twin.checks), [twin.checks]);

  /* ---------------- central simulation clock (§127: render loop decoupled from the simulation) */
  const tRef = useRef(0);
  const stateRef = useRef<SimulationState | null>(null);
  const [t, setTState] = useState(0);
  const [snap, setSnap] = useState<SimulationState | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [collision, setCollision] = useState<{ text: string; t: number; a: string; b: string } | null>(null);
  const ack = useRef(new Set<string>());
  const planLabels = useMemo(() => new Set(model.plan.map((m) => m.label)), [model.plan]);
  const setT = useCallback(
    (x: number) => {
      const v = Math.max(0, Math.min(player?.end ?? 0, x));
      tRef.current = v;
      stateRef.current = player ? player.at(v) : null;
      setSnap(stateRef.current);
      setTState(v);
    },
    [player],
  );
  useEffect(() => {
    ack.current.clear();
    setT(tRef.current);
  }, [player, setT]);
  useEffect(() => {
    if (!playing || !player) return;
    let raf = 0;
    let last = performance.now();
    let lastUi = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      tRef.current = Math.min(player.end, tRef.current + dt * speed);
      const s = player.at(tRef.current);
      stateRef.current = s;
      // §21 never continue silently through a collision — axis moves and robot / gantry sweeps alike
      for (const st of s.stations)
        for (const sv of st.servers) {
          if (sv.state !== 'busy' || !sv.step) continue;
          const hit = twin.collisions.find((h) => h.stationKey === st.key && (sv.step!.kind === 'move' ? h.moveLabel === sv.step!.name : !planLabels.has(h.moveLabel)));
          const key = hit ? `${hit.a}|${hit.b}` : '';
          if (hit && !ack.current.has(key)) {
            ack.current.add(key);
            setPlaying(false);
            setCollision({ text: hit.text, t: tRef.current, a: hit.a, b: hit.b });
            setSnap(s);
            setTState(tRef.current);
            return;
          }
        }
      if (now - lastUi > 160) {
        lastUi = now;
        setSnap(s);
        setTState(tRef.current);
      }
      if (tRef.current >= player.end) {
        setPlaying(false);
        setSnap(s);
        setTState(tRef.current);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, player, speed, twin.collisions, planLabels]);

  /* ---------------- view state */
  const [view, setView] = useState<SceneView>(() => ({
    layers: allLayers(),
    // the conceptual operator figure is available from the tree (eye icon) but hidden by default
    hidden: new Set(['operator']),
    isolate: null,
    selected: null,
    hover: null,
    xray: false,
    explode: 0,
    section: { axis: null, pos: 0 },
    grid: true,
    axes: !narrowScreen(),
    dims: false,
    labels: !customer,
    zones: true,
    routes: false,
    enclosure: customer ? 'closed' : 'cutaway',
    callouts: true,
    labelMode: customer || narrowScreen() ? 'none' : 'step',
    findings: null,
    followPart: null,
    pov: null,
    highlight: null,
    fov: true,
    field: true,
    trail: false,
    beam: { on: true, intensity: 0.9, color: null, spot: 1.2 },
    overlay: null,
    collisionIds: new Set(),
    quality: typeof window !== 'undefined' && window.devicePixelRatio > 2 ? 'balanced' : 'high',
    ortho: false,
    measure: false,
    measurePts: [],
    customer,
    reducedMotion: reducedMotionQuery(),
    zonesAll: false,
    bottleneck: null,
  }));
  const patch = (p: Partial<SceneView>) => setView((v) => ({ ...v, ...p }));
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [reqSel, setReqSel] = useState('');
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [camMode, setCamMode] = useState<CamMode>(customer ? 'customer' : 'engineering');
  const [bottom, setBottom] = useState<Bottom>(sim.twin?.build?.mode === 'components' && !customer ? 'builder' : d.res.runnable ? 'timeline' : 'inputs');
  const [other, setOther] = useState('');
  const [ghostOn, setGhostOn] = useState(false);
  const [perfNotice, setPerfNotice] = useState(false);
  const [debug, setDebug] = useState(false);
  const [treeQ, setTreeQ] = useState('');
  const [open, setOpen] = useState<Set<string>>(new Set(['machine']));
  // workspace: full-bleed studio mode and the two drawers over the viewport
  const [studio, setStudio] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [propsOpen, setPropsOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1600);
  const [findingsOn, setFindingsOn] = useState(!customer);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const scene = useRef<SceneApi | null>(null);
  const box = useRef<HTMLDivElement | null>(null);
  const debugOut = useRef<HTMLDivElement | null>(null);
  useEffect(() => patch({ customer, labels: !customer, labelMode: customer ? 'none' : 'step', enclosure: customer ? 'closed' : 'cutaway' }), [customer]);

  // bring the machine into view when the tab opens on a short screen (the status, toolbar and viewport fit together)
  useEffect(() => {
    const el = box.current;
    if (!el || typeof window === 'undefined') return;
    if (el.getBoundingClientRect().top > window.innerHeight * 0.4) el.scrollIntoView({ block: 'start', behavior: reducedMotionQuery() ? 'auto' : 'smooth' });
  }, []);
  // entering / leaving studio mode re-mounts the canvas in its new place: keep the camera where it was
  const toggleStudio = (on: boolean) => {
    const cam = scene.current?.camera();
    setStudio(on);
    if (cam) setTimeout(() => scene.current?.setCamera(cam.position, cam.target), 700);
  };
  // studio mode: Esc returns to the page layout
  useEffect(() => {
    if (!studio) return;
    const onEsc = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && toggleStudio(false);
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [studio]);

  /* ---------------- explanation: per-component, guided tour, live narration (§139, §153, §164) */
  const xctx: ExplainCtx = useMemo(() => ({ model, res: d.res, cycle: d.cycle, byId: eng.byId, defs: eng.defs }), [model, d.res, d.cycle, eng.byId, eng.defs]);
  const tour = useMemo(() => machineTour(xctx), [xctx]);
  const [tourIdx, setTourIdx] = useState<number | null>(null);
  const [tourAuto, setTourAuto] = useState(false);
  const [narrOn, setNarrOn] = useState(true);
  const goTour = (i: number | null) => {
    setTourIdx(i);
    if (i == null || !tour[i]) {
      setTourIdx(null);
      setTourAuto(false);
      patch({ highlight: null });
      return;
    }
    const st: TourStep = tour[i];
    patch({ highlight: new Set(st.highlight), selected: st.focus });
    if (st.focus) setPropsOpen(true);
    setTimeout(() => {
      if (st.preset === 'laser' || st.preset === 'inspection' || st.preset === 'maintenance') scene.current?.view(st.preset);
      else if (st.focus) scene.current?.view('fit', st.focus);
      else scene.current?.view(st.preset ?? 'iso');
    }, 0);
  };
  useEffect(() => {
    if (!tourAuto || tourIdx == null) return;
    const id = setTimeout(() => goTour(tourIdx + 1 < tour.length ? tourIdx + 1 : null), 9000);
    return () => clearTimeout(id);
  }, [tourAuto, tourIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // §154 command-palette actions arrive as ?cmd=… on this tab
  const cmd = params.get('cmd');
  useEffect(() => {
    if (!cmd) return;
    const run: Record<string, () => void> = {
      run: () => player && setPlaying(true),
      pause: () => setPlaying(false),
      reset: () => (setPlaying(false), setT(0)),
      laser: () => applyMode('laser'),
      inspection: () => applyMode('inspection'),
      xray: () => applyMode('xray'),
      exploded: () => applyMode('exploded'),
      dims: () => patch({ dims: true }),
      motion: () => setBottom('motion'),
      checks: () => setBottom('checks'),
      compare: () => setBottom('compare'),
      png: () => setTimeout(png, 400),
      report: () => setBottom('assumptions'),
    };
    const id = setTimeout(() => run[cmd]?.(), 250);
    setParams((p) => (p.delete('cmd'), p), { replace: true });
    return () => clearTimeout(id);
  }, [cmd]); // eslint-disable-line react-hooks/exhaustive-deps

  // shared view link: ?cam=px,py,pz,tx,ty,tz&t=…&sel=…&pov=… restores the camera, time and selection
  const shared = useRef<{ cam?: number[]; t?: number; sel?: string; pov?: string } | null>(null);
  useEffect(() => {
    const cam = params.get('cam');
    const tt = params.get('t');
    const sel = params.get('sel');
    const pv = params.get('pov');
    if (!cam && !tt && !sel && !pv) return;
    const nums = cam?.split(',').map(Number);
    shared.current = { cam: nums?.length === 6 && nums.every(Number.isFinite) ? nums : undefined, t: tt != null && Number.isFinite(Number(tt)) ? Number(tt) : undefined, sel: sel ?? undefined, pov: pv ?? undefined };
    setParams(
      (p) => {
        ['cam', 't', 'sel', 'pov'].forEach((k) => p.delete(k));
        return p;
      },
      { replace: true },
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const s = shared.current;
    if (!s || !glReady || !player) return;
    shared.current = null;
    if (s.t != null) setT(s.t);
    if (s.sel && model.byId.has(s.sel)) select(s.sel);
    if (s.pov && model.vision.some((v) => v.stationKey === s.pov)) patch({ pov: s.pov });
    if (s.cam) setTimeout(() => scene.current?.setCamera(s.cam!.slice(0, 3), s.cam!.slice(3)), 600);
  }, [glReady, player]); // eslint-disable-line react-hooks/exhaustive-deps
  const copyLink = async () => {
    const cam = scene.current?.camera();
    const q = new URLSearchParams(params);
    q.set('tab', 'machine3d');
    if (cam) q.set('cam', [...cam.position, ...cam.target].map((v) => v.toFixed(3)).join(','));
    q.set('t', tRef.current.toFixed(2));
    if (view.selected) q.set('sel', view.selected);
    else q.delete('sel');
    if (view.pov) q.set('pov', view.pov);
    const base = window.location.href.split('#')[0];
    const path = window.location.hash.replace(/^#/, '').split('?')[0];
    const url = `${base}#${path}?${q.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('View link copied', { tone: 'success', detail: 'It opens this machine at the same camera, time and selection.' });
    } catch {
      toast('Copy the view link', { tone: 'draft', detail: url });
    }
  };

  /* ---------------- recording a cycle (WebM, in the browser — nothing is uploaded) */
  const record = () => {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    const c = scene.current?.canvas();
    if (!c || typeof MediaRecorder === 'undefined' || !('captureStream' in c)) {
      toast('Video recording is not supported in this browser', { tone: 'error' });
      return;
    }
    const stream = (c as HTMLCanvasElement & { captureStream(fps?: number): MediaStream }).captureStream(30);
    const type = ['video/webm;codecs=vp9', 'video/webm'].find((m) => MediaRecorder.isTypeSupported?.(m)) ?? '';
    const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      setRecording(false);
      recorder.current = null;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
      a.download = `${sim.id}-3d-${Math.round(tRef.current)}s.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    };
    recorder.current = rec;
    rec.start(500);
    setRecording(true);
    if (player && !playing) setPlaying(true);
    // one representative cycle at the current playback speed (at most one minute of video)
    const secs = Math.min(60, Math.max(3, (d.cycle?.cycle ?? 10) / speed));
    setTimeout(() => rec.state === 'recording' && rec.stop(), secs * 1000);
  };

  const bottleneckKey = d.cycle?.bottleneck.rs.station.key ?? null;
  useEffect(() => patch({ bottleneck: bottleneckKey }), [bottleneckKey]);

  /* ---------------- overlays (§142–§145): colours come from records, never from a score */
  const deps = d.deps;
  const related = useCallback(
    (reqId: string): Set<string> => {
      const r = eng.byId.get(reqId) as (AnyRecord & { unit?: string; part_id?: string }) | undefined;
      const ids = new Set<string>();
      if (!r) return ids;
      if (sim.twin?.process_area?.requirement_id === reqId) for (const l of model.lasers) [l.sourceId, l.expanderId, l.galvoId, l.fthetaId, 'fixture'].forEach((x) => x && ids.add(x));
      if (/uph|parts?\/h/i.test(String(r.unit ?? '')) || /throughput/i.test(r.name)) for (const o of model.objects) if (o.stationKey && o.stationKey === bottleneckKey) ids.add(o.id);
      if (r.part_id) for (const o of model.objects) if (o.partId === r.part_id) ids.add(o.id);
      if (/verif|inspect|code/i.test(r.name)) for (const o of model.objects) if (o.stationKey && sim.stations.find((s) => s.key === o.stationKey)?.kind === 'inspect') ids.add(o.id);
      return ids;
    },
    [eng.byId, sim, model, bottleneckKey],
  );
  const overlayMap = useMemo(() => {
    if (overlay === 'none') return null;
    const m = new Map<string, string>();
    if (overlay === 'localization') return originColors(model, eng.byId);
    if (overlay === 'cost') {
      const cost = new Map<string, number>();
      for (const b of d.bom.items) if (b.partId && b.extended != null) cost.set(b.partId, (cost.get(b.partId) ?? 0) + b.extended);
      const max = Math.max(1, ...cost.values());
      for (const o of model.objects) if (o.partId && cost.has(o.partId)) m.set(o.id, costColor(cost.get(o.partId)! / max));
      return m;
    }
    if (overlay === 'requirement') {
      for (const id of reqSel ? related(reqSel) : []) m.set(id, '#00e0cf');
      return m;
    }
    if (overlay === 'risk') {
      for (const o of model.objects) {
        const dep = deps.find((x) => x.sp.part.id === o.partId);
        if (dep && dep.risk.length) m.set(o.id, dep.singleSource ? '#e5484d' : '#f5a524');
      }
      return m;
    }
    if (overlay === 'utilization') {
      // heat map of the whole run: every object of a station takes that station's utilization
      if (!des || preview) return m;
      const u = new Map(des.stations.map((x) => [x.key, x.utilization]));
      for (const o of model.objects) if (o.stationKey && u.has(o.stationKey)) m.set(o.id, utilColor(u.get(o.stationKey)!));
      return m;
    }
    if (overlay === 'state' && snap) {
      for (const o of model.objects) {
        if (!o.stationKey) continue;
        const st = snap.stations.find((s) => s.key === o.stationKey);
        const sv = st?.servers.some((x) => x.state === 'down') ? 'down' : st?.servers.some((x) => x.state === 'busy') ? 'busy' : st?.servers.some((x) => x.state === 'blocked') ? 'blocked' : 'idle';
        if (sv !== 'idle') m.set(o.id, sv === 'down' ? '#e5484d' : sv === 'blocked' ? '#f5a524' : '#00a99d');
      }
      return m;
    }
    return m;
  }, [overlay, model, eng.byId, d.bom, reqSel, related, deps, snap, des, preview]);
  const sceneView = useMemo(() => ({ ...view, overlay: overlayMap, findings: findingsOn && !customer ? findings : null, collisionIds: collision ? new Set([collision.a, collision.b]) : view.collisionIds }), [view, overlayMap, collision, findingsOn, customer, findings]);

  const live: LiveView = useMemo(() => {
    const stationState: LiveView['stationState'] = {};
    for (const s of snap?.stations ?? []) stationState[s.key] = s.servers.some((x) => x.state === 'down') ? 'down' : s.servers.some((x) => x.state === 'busy') ? 'busy' : s.servers.some((x) => x.state === 'blocked') ? 'blocked' : 'idle';
    const doorOpen = model.carrier === 'axes' && snap ? (snap.stations.some((s) => ['load', 'unload'].includes(sim.stations.find((x) => x.key === s.key)?.kind ?? '') && s.servers.some((x) => x.state === 'busy' && x.step?.kind !== 'move')) ? 1 : 0) : 0;
    const tower = !snap ? 'off' : snap.alarms.length ? 'red' : Object.values(stationState).some((x) => x === 'busy') ? 'green' : 'amber';
    return { stationState, vision: snap?.visionActive ?? {}, laserOn: snap?.laserOn ?? [], doorOpen, tower };
  }, [snap, model.carrier, sim.stations]);

  /* ---------------- camera modes + shortcuts */
  const applyMode = (m: CamMode) => {
    setCamMode(m);
    const base: Partial<SceneView> = { xray: false, explode: 0, zonesAll: false, enclosure: 'cutaway' };
    if (m === 'engineering') patch({ ...base, labels: true, labelMode: 'step' });
    if (m === 'customer') patch({ ...base, labels: false, labelMode: 'none', dims: false, routes: false, zones: false, enclosure: 'closed' });
    if (m === 'exploded') patch({ ...base, explode: 1 });
    if (m === 'xray') patch({ ...base, xray: true, routes: true });
    if (m === 'maintenance') patch({ ...base, zones: true, zonesAll: true, xray: true, routes: true });
    if (m === 'laser' || m === 'inspection') patch({ ...base, fov: true, field: true });
    const preset: ViewPreset = m === 'laser' ? 'laser' : m === 'inspection' ? 'inspection' : m === 'maintenance' ? 'maintenance' : m === 'process' ? 'process' : 'iso';
    setTimeout(() => scene.current?.view(preset), 0);
  };
  const select = (id: string | null) => {
    patch({ selected: id });
    if (id) {
      setPropsOpen(true);
      const o = model.byId.get(id);
      let p = o?.parentId;
      const nx = new Set(open);
      while (p) {
        nx.add(p);
        p = model.byId.get(p)?.parentId ?? null;
      }
      setOpen(nx);
    }
  };
  // choosing from the tree, a finding or a chip frames the component; clicking in the viewport only selects
  const focusObj = (id: string) => {
    select(id);
    scene.current?.view('fit', id);
  };
  const followPart = (p: number | null) => {
    patch({ followPart: p });
    if (p != null) setBottom('trace');
  };
  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input,select,textarea,button')) return;
    const k = e.key.toLowerCase();
    const act: Record<string, () => void> = {
      f: () => scene.current?.view('fit', view.selected),
      '1': () => scene.current?.view('front'),
      '2': () => scene.current?.view('top'),
      '3': () => scene.current?.view('side'),
      '4': () => scene.current?.view('iso'),
      h: () => view.selected && patch({ hidden: new Set([...view.hidden, view.selected]) }),
      r: () => (patch({ hidden: new Set(), isolate: null, explode: 0, xray: false, section: { axis: null, pos: 0 } }), scene.current?.view('iso')),
      ' ': () => setPlaying((p) => !p),
      escape: () => (patch({ selected: null, measure: false, measurePts: [], followPart: null }), setCollision(null)),
    };
    if (act[k]) {
      e.preventDefault();
      act[k]();
    }
  };
  const glb = async () => {
    const root = scene.current?.root();
    if (!root) return;
    try {
      const { exportGlb } = await import('./three/exportGlb');
      const { blob, nodes } = await exportGlb(root, model, { title: `${sim.name} — conceptual 3D model`, scenarioId: sim.id, date: new Date().toISOString().slice(0, 10) });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${sim.id}-conceptual.glb`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast('3D model exported (glTF)', { tone: 'draft', detail: `${nodes} objects · CONCEPTUAL 3D MODEL — not manufacturing geometry` });
    } catch (e) {
      toast('Export failed', { tone: 'error', detail: String(e) });
    }
  };
  const png = () => {
    const c = scene.current?.canvas();
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `${sim.id}-3d-${Math.round(tRef.current)}s.png`;
    a.click();
  };
  const saveSnapshot = (name: string) => {
    const cam = scene.current?.camera();
    if (!cam) return;
    set((s) => ({ ...s, twin: { ...s.twin, snapshots: [...(s.twin?.snapshots ?? []), { id: `snap-${Date.now().toString(36)}`, name, at: new Date().toISOString(), view: camMode, camera: { position: cam.position, target: cam.target, ortho: view.ortho }, layers: LAYERS.filter((l) => view.layers[l]), selected: view.selected ?? undefined, t_s: tRef.current }] } }));
    toast('Snapshot added to the scenario', { tone: 'draft', detail: 'Save the scenario to keep it.' });
  };
  const restoreSnapshot = (id: string) => {
    const s = sim.twin?.snapshots?.find((x) => x.id === id);
    if (!s) return;
    patch({ layers: Object.fromEntries(LAYERS.map((l) => [l, s.layers.includes(l)])) as Record<Layer, boolean>, selected: s.selected ?? null, ortho: !!s.camera.ortho });
    setT(s.t_s);
    setTimeout(() => scene.current?.setCamera(s.camera.position, s.camera.target), 30);
  };
  const ghostModel = useGhost(eng, ghostOn && other && eng.byId.get(other) ? other : null);
  const factory = useMemo(() => (sim.twin?.factory ?? []).map((f, i) => ({ x: f.x_mm, z: f.z_mm, rot: f.rot_deg, label: `Machine ${i + 1}` })), [sim.twin?.factory]);

  const sel = view.selected ? model.byId.get(view.selected) : undefined;
  const hoverObj = hover ? model.byId.get(hover.id) : undefined;
  const measure = view.measurePts.length === 2 ? view.measurePts : null;
  const dist = measure ? { dx: (measure[1][0] - measure[0][0]) * 1000, dy: (measure[1][1] - measure[0][1]) * 1000, dz: (measure[1][2] - measure[0][2]) * 1000 } : null;
  const bounds = model.bounds;
  const secAxis = view.section.axis;
  const secRange = secAxis ? [bounds.min[secAxis === 'x' ? 0 : secAxis === 'y' ? 1 : 2], bounds.max[secAxis === 'x' ? 0 : secAxis === 'y' ? 1 : 2]] : [0, 1];
  const STEP_PRI: Record<string, number> = { laser: 0, laser_prep: 1, process: 2, inspect: 3, vision: 3, move: 4, clamp: 5, sort: 6, load: 7, unload: 8 };
  const busyNames = snap ? snap.stations.flatMap((s) => s.servers.filter((x) => x.state === 'busy').map((x) => ({ st: sim.stations.find((y) => y.key === s.key)?.name ?? s.key, step: x.step?.name, part: x.part, pri: STEP_PRI[x.step?.kind ?? ''] ?? 9 }))).sort((a, b) => a.pri - b.pri) : [];
  const current = busyNames[0];
  const narration = useMemo(() => {
    if (!snap) return '';
    // several stations work at once on a line: explain the most significant step
    const busy = snap.stations.flatMap((st) => st.servers.filter((sv) => sv.state === 'busy' && sv.step).map((sv) => ({ st, sv }))).sort((a, b) => (STEP_PRI[a.sv.step!.kind] ?? 9) - (STEP_PRI[b.sv.step!.kind] ?? 9));
    if (busy[0]) return narrate(busy[0].sv.step!, sim.stations.find((x) => x.key === busy[0].st.key)?.name ?? busy[0].st.key, busy[0].sv.stepProgress, xctx);
    if (snap.alarms.length) return `Fault: ${snap.alarms[0].text} — upstream stations block and downstream stations starve until it is cleared.`;
    return '';
  }, [snap, sim.stations, xctx]); // eslint-disable-line react-hooks/exhaustive-deps
  const machineStatus = !player ? 'NOT RUNNABLE' : playing ? (snap?.machineState ?? 'Idle').toUpperCase() : t > 0 ? 'PAUSED' : 'READY';
  const recipe = sim.recipe_id ? (eng.byId.get(sim.recipe_id) as (Recipe & AnyRecord) | undefined) : undefined;
  const downMin = des ? des.stations.reduce((n, s) => Math.max(n, s.down), 0) * (des.horizon_s / 60) : null;
  const desBott = des ? [...des.stations].sort((a, b) => b.utilization - a.utilization)[0] : null;
  const totalQueue = snap ? snap.stations.reduce((n, s) => n + s.queue, 0) : 0;
  const uphNow = snap?.uphSoFar != null ? snap.uphSoFar.toFixed(0) : (snap?.cycles ?? 0) > 0 ? 'warming up' : '—';
  const nextEvent = player ? player.events.find((e) => e.t > t + 1e-9) : undefined;
  const livePw = livePower(util, snap);

  const bottomTabs: { key: Bottom; label: ReactNode; count?: number }[] = [
    { key: 'builder', label: sim.twin?.build?.mode === 'components' ? 'Builder (live)' : 'Builder' },
    { key: 'inputs', label: 'Inputs', count: d.res.blocking.length || undefined },
    { key: 'timeline', label: 'Timeline' },
    { key: 'sequence', label: 'PLC steps' },
    { key: 'checks', label: 'Design check', count: twin.checks.filter((c) => c.severity === 'critical' || c.severity === 'major').length },
    { key: 'io', label: 'I/O' },
    { key: 'hmi', label: 'HMI & alarms' },
    { key: 'motion', label: 'Motion' },
    { key: 'utilities', label: 'Utilities' },
    ...(model.carrier === 'flow' ? [{ key: 'trace' as const, label: 'Part trace' }] : []),
    { key: 'faults', label: 'Fault injection' },
    { key: 'runs', label: 'Runs' },
    { key: 'compare', label: 'Compare' },
    { key: 'assumptions', label: 'Export' },
  ];
  const povStation = view.pov ? model.vision.find((v) => v.stationKey === view.pov) : undefined;

  const body = (
    <div className={clsx('scroll-mt-24', studio ? 'fixed inset-0 z-[70] space-y-2 overflow-auto bg-bg p-2 sm:p-3' : 'space-y-2')} ref={box}>
      {/* ---------------- status: machine / cycle / part / UPH / alarms / time / bottleneck (§6, §39) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-card border border-line bg-[#0b0f11] px-3 py-2 font-mono text-micro text-[#c9d3d3]" role="status" aria-label="Machine status">
        <span className="text-[#8d9a9a]">MACHINE STATUS</span>
        <span className={clsx('rounded px-1.5 py-0.5 font-semibold', machineStatus === 'FAULT' ? 'bg-bad/30 text-[#ff8a8a]' : playing ? 'bg-accent/25 text-[#35e0a1]' : 'bg-white/10')}>{machineStatus}</span>
        <span>CYCLE {snap?.cycles ?? 0}</span>
        <span>PART {current?.part != null && current.part >= 0 ? current.part : '—'}</span>
        <span title="Throughput so far in this run; shown after the first minute">UPH {uphNow}</span>
        <span className={clsx(snap?.alarms.length ? 'text-[#ff8a8a]' : '')}>ALARM {snap?.alarms.length ?? 0}</span>
        <span className="text-[#8d9a9a]">t {fmtT(t)}</span>
        {d.cycle && (
          <span className="hidden text-[#f5c46b] md:inline" title="Bottleneck from the cycle model and the run's utilization">
            BOTTLENECK {d.cycle.bottleneck.rs.station.name} · {d.cycle.bottleneck.mean.toFixed(2)} s
          </span>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-2 font-sans">
          {/* the status bar is dark in both themes, so its badges use dark-surface colours (WCAG contrast) */}
          <Badge tone="warn" className={DARK_WARN}>
            {model.label}
          </Badge>
          <Badge className={DARK_NEUTRAL}>3D: {sim.twin?.model_maturity ?? 'Procedural'}</Badge>
          <Badge className={DARK_NEUTRAL}>Simulation: {sim.twin?.sim_maturity ?? 'Conceptual'}</Badge>
          {sim.data_type === 'DEMO' && (
            <Badge tone="warn" className={DARK_WARN}>
              DEMO
            </Badge>
          )}
          {preview && (
            <Badge tone="warn" className={DARK_WARN}>
              SEQUENCE PREVIEW — not a result
            </Badge>
          )}
          {perfNotice && (
            <span className="text-[#f5c46b]" title="The device was slow, so the rendering switched to Performance quality (Display menu to change)">
              <Gauge className="inline size-3.5" aria-label="Performance mode on" />
            </span>
          )}
        </span>
      </div>
      {preview && (
        <p className="rounded-control border border-warn/40 bg-warn/10 px-3 py-1.5 text-meta">
          <strong>Sequence preview</strong> — {d.res.blocking.length} input{d.res.blocking.length === 1 ? '' : 's'} missing ({d.res.blocking.slice(0, 2).join('; ')}
          {d.res.blocking.length > 2 ? '; …' : ''}). Undefined stations use a {PREVIEW_STATION_S} s visual placeholder and no result is reported.{' '}
          <button type="button" className="text-accent-2 underline" onClick={() => setBottom('inputs')}>
            Enter the missing inputs
          </button>
        </p>
      )}
      {error && <Notice tone="warn">Simulation could not run: {error}</Notice>}

      {/* ---------------- toolbar in labelled groups (§87) */}
      <div className="glass flex flex-wrap items-center gap-1.5 rounded-card px-2 py-1.5" role="toolbar" aria-label="3D viewport tools">
        <Group label="Explain">
          <Button size="sm" onClick={() => goTour(tourIdx == null ? 0 : null)} aria-pressed={tourIdx != null} aria-label={tourIdx == null ? 'Explain the machine (guided tour)' : 'End the guided tour'}>
            <GraduationCap className="size-4" aria-hidden /> <span className="hidden sm:inline">{tourIdx == null ? 'Explain machine' : 'End tour'}</span>
          </Button>
          <Tool icon={Captions} label="Live explanation of each step" active={narrOn} onClick={() => setNarrOn((x) => !x)} />
        </Group>
        <Group label="View">
          <Tool icon={Scan} label="Fit (F)" onClick={() => scene.current?.view('fit', view.selected)} />
          <span className="hidden items-center gap-0.5 sm:flex">
            <Tool icon={Square} label="Front (1)" onClick={() => scene.current?.view('front')} />
            <Tool icon={LayoutGrid} label="Top (2)" onClick={() => scene.current?.view('top')} />
            <Tool icon={PanelLeft} label="Side (3)" onClick={() => scene.current?.view('side')} />
          </span>
          <Tool icon={Box} label="Isometric (4)" onClick={() => scene.current?.view('iso')} />
          <Tool icon={Grid3x3} label={view.ortho ? 'Orthographic (click for perspective)' : 'Perspective (click for orthographic)'} active={view.ortho} onClick={() => patch({ ortho: !view.ortho })} />
          <SmallSelect label="Camera mode" value={camMode} options={[{ value: 'engineering', label: 'Engineering' }, { value: 'customer', label: 'Customer demo' }, { value: 'exploded', label: 'Exploded' }, { value: 'xray', label: 'X-ray' }, { value: 'process', label: 'Process' }, ...(model.lasers.length ? [{ value: 'laser', label: 'Laser' }] : []), ...(model.vision.length ? [{ value: 'inspection', label: 'Inspection' }] : []), { value: 'maintenance', label: 'Maintenance' }]} onChange={(v) => applyMode(v as CamMode)} className="!w-auto max-w-[10rem]" />
        </Group>
        <Group label="Inspect" className="hidden sm:flex">
          <Popover label="Section view" width="w-72" trigger={({ open: o, toggle }) => <Tool icon={Scissors} label="Section" active={!!secAxis || o} onClick={toggle} />}>
            {() => (
              <div className="space-y-2 p-3 text-meta">
                <SegmentedControl label="Section plane" size="sm" value={secAxis ?? 'off'} onChange={(a) => patch({ section: { axis: a === 'off' ? null : (a as 'x' | 'y' | 'z'), pos: a === 'off' ? 0 : (bounds.min[a === 'x' ? 0 : a === 'y' ? 1 : 2] + bounds.max[a === 'x' ? 0 : a === 'y' ? 1 : 2]) / 2 } })} options={[{ value: 'off', label: 'Off' }, { value: 'x', label: 'X' }, { value: 'y', label: 'Y' }, { value: 'z', label: 'Z' }]} />
                {secAxis && <input type="range" aria-label="Section plane position" min={secRange[0]} max={secRange[1]} value={view.section.pos} onChange={(e) => patch({ section: { axis: secAxis, pos: Number(e.target.value) } })} className="w-full" />}
                {secAxis && <div className="font-mono text-micro text-ink-3">{secAxis.toUpperCase()} = {Math.round(view.section.pos)} mm</div>}
              </div>
            )}
          </Popover>
          <Popover label="Exploded view" width="w-64" trigger={({ open: o, toggle }) => <Tool icon={Expand} label="Explode" active={view.explode > 0 || o} onClick={toggle} />}>
            {() => (
              <div className="space-y-1 p-3 text-meta">
                <div>Machine → system → subsystem → component</div>
                <input type="range" aria-label="Explode amount" min={0} max={1} step={0.05} value={view.explode} onChange={(e) => patch({ explode: Number(e.target.value) })} className="w-full" />
              </div>
            )}
          </Popover>
          <Tool icon={ScanEye} label="Equipment X-ray" active={view.xray} onClick={() => patch({ xray: !view.xray, routes: !view.xray || view.routes })} />
          <Tool icon={Focus} label={view.isolate ? 'Exit isolate' : 'Isolate selected'} active={!!view.isolate} disabled={!view.selected && !view.isolate} onClick={() => patch({ isolate: view.isolate ? null : view.selected })} />
          <Tool icon={EyeOff} label="Hide selected (H)" disabled={!view.selected} onClick={() => view.selected && patch({ hidden: new Set([...view.hidden, view.selected]) })} />
          <Tool icon={Eye} label="Show all" disabled={!view.hidden.size && !view.isolate} onClick={() => patch({ hidden: new Set(), isolate: null })} />
          <Tool icon={Ruler} label="Measure" active={view.measure} onClick={() => patch({ measure: !view.measure, measurePts: [] })} />
        </Group>
        <Group label="Show">
          <SegmentedControl label="Name tags" size="sm" value={view.labelMode} onChange={(m) => patch({ labelMode: m })} options={[{ value: 'none', label: 'No tags' }, { value: 'step', label: 'Working' }, { value: 'all', label: 'All' }]} />
          {!customer && <Tool icon={AlertTriangle} label={`Design-check badges (${findings.size})`} active={findingsOn} onClick={() => setFindingsOn((x) => !x)} />}
          <span className="hidden items-center gap-0.5 sm:flex">
            <Popover label="Engineering layers" width="w-60" trigger={({ open: o, toggle }) => <Tool icon={Layers} label="Layers" active={o || LAYERS.some((l) => !view.layers[l])} onClick={toggle} />}>
              {() => (
                <div className="grid grid-cols-2 gap-1 p-3 text-meta">
                  {LAYERS.map((l) => (
                    <label key={l} className="inline-flex items-center gap-1.5">
                      <input type="checkbox" checked={view.layers[l]} onChange={(e) => patch({ layers: { ...view.layers, [l]: e.target.checked } })} /> {l}
                    </label>
                  ))}
                  <button type="button" className="col-span-2 mt-1 text-left text-micro text-accent-2 hover:underline" onClick={() => patch({ layers: allLayers() })}>
                    Show all layers
                  </button>
                </div>
              )}
            </Popover>
            <Popover label="Display" width="w-64" trigger={({ open: o, toggle }) => <Tool icon={Eye} label="Display" active={o} onClick={toggle} />}>
              {() => (
                <div className="space-y-1 p-3 text-meta">
                  {(
                    [
                      ['grid', 'Grid'],
                      ['axes', 'Axes gizmo'],
                      ['dims', 'Dimensions'],
                      ['labels', 'Measurement labels (FOV, field, zones)'],
                      ['zones', 'Safety zones'],
                      ['routes', 'Control cables (conceptual routing)'],
                      ['fov', 'Camera field of view'],
                      ['field', model.lasers.length ? 'Marking field / process area' : 'Process area'],
                      ['trail', 'Scan path preview'],
                    ] as const
                  )
                    // only offer overlays this machine actually has
                    .filter(([k]) => (k === 'fov' ? model.vision.length > 0 : k === 'trail' ? model.lasers.length > 0 : k === 'field' ? model.lasers.length > 0 || !!model.processArea : true))
                    .map(([k, l]) => (
                      <label key={k} className="flex items-center gap-1.5">
                        <input type="checkbox" checked={view[k]} onChange={(e) => patch({ [k]: e.target.checked } as Partial<SceneView>)} /> {l}
                      </label>
                    ))}
                  <div className="mt-2 border-t border-line pt-2">
                    <SmallSelect label="Rendering quality" value={view.quality} options={[{ value: 'high', label: 'High quality' }, { value: 'balanced', label: 'Balanced' }, { value: 'performance', label: 'Performance' }]} onChange={(v) => patch({ quality: v as SceneView['quality'] })} className="w-full" />
                  </div>
                  {model.lasers.length > 0 && (
                    <div className="mt-2 border-t border-line pt-2">
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={view.beam.on} onChange={(e) => patch({ beam: { ...view.beam, on: e.target.checked } })} /> Laser beam
                      </label>
                      <label className="mt-1 block text-micro text-ink-3">
                        Beam intensity (visual)
                        <input type="range" min={0.15} max={1} step={0.05} value={view.beam.intensity} onChange={(e) => patch({ beam: { ...view.beam, intensity: Number(e.target.value) } })} className="w-full" />
                      </label>
                      <label className="mt-1 block text-micro text-ink-3">
                        Spot marker (visual, mm)
                        <input type="range" min={0.5} max={6} step={0.1} value={view.beam.spot} onChange={(e) => patch({ beam: { ...view.beam, spot: Number(e.target.value) } })} className="w-full" />
                      </label>
                      <label className="mt-1 flex items-center gap-1.5 text-micro text-ink-3">
                        Beam colour <input type="color" value={view.beam.color ?? '#ff4d3d'} onChange={(e) => patch({ beam: { ...view.beam, color: e.target.value } })} aria-label="Beam colour" />
                        <button type="button" className="text-accent-2 hover:underline" onClick={() => patch({ beam: { ...view.beam, color: null } })}>
                          by wavelength
                        </button>
                      </label>
                      <p className="mt-1 text-micro text-ink-3">The rendered beam is symbolic (IR is invisible) — not an optical simulation.</p>
                    </div>
                  )}
                </div>
              )}
            </Popover>
            <Popover label="Overlay" width={overlay === 'utilization' ? 'w-[26rem]' : 'w-72'} trigger={({ open: o, toggle }) => <Tool icon={Palette} label="Overlay" active={overlay !== 'none' || o} onClick={toggle} />}>
              {() => (
                <div className="space-y-2 p-3 text-meta">
                  <SmallSelect label="Overlay" value={overlay} options={[{ value: 'none', label: 'No overlay' }, { value: 'state', label: 'Machine state (live)' }, { value: 'utilization', label: 'Utilization heat map (run)' }, { value: 'localization', label: 'Localization (origin)' }, ...(customer ? [] : [{ value: 'cost', label: 'Cost contribution' }, { value: 'risk', label: 'Supply risk' }]), { value: 'requirement', label: 'Requirement' }]} onChange={(v) => setOverlay(v as Overlay)} className="w-full" />
                  {overlay === 'requirement' && <SmallSelect label="Requirement" value={reqSel} options={[{ value: '', label: 'Select a requirement…' }, ...(sim.requirement_ids ?? []).map((id) => ({ value: id, label: `${String(eng.byId.get(id)?.code ?? id)} — ${eng.byId.get(id)?.name ?? ''}` }))]} onChange={setReqSel} className="w-full" />}
                  <OverlayLegend kind={overlay} des={preview ? null : des} />
                </div>
              )}
            </Popover>
            <SmallSelect label="Enclosure" value={view.enclosure} options={[{ value: 'closed', label: 'Enclosure: closed' }, { value: 'cutaway', label: 'Enclosure: cutaway' }, { value: 'hidden', label: 'Enclosure: frame only' }]} onChange={(v) => patch({ enclosure: v as EnclosureMode })} className="!w-auto max-w-[11rem]" />
            {model.vision.length > 0 && (
              <SmallSelect
                label="Camera view"
                value={view.pov ?? ''}
                options={[{ value: '', label: 'Camera view: off' }, ...model.vision.map((v) => ({ value: v.stationKey, label: `Camera view: ${sim.stations.find((s) => s.key === v.stationKey)?.name ?? v.stationKey}` }))]}
                onChange={(v) => {
                  patch({ pov: v || null });
                  if (v) setPropsOpen(false);
                }}
                className="!w-auto max-w-[12rem]"
              />
            )}
          </span>
        </Group>
        <span className="ml-auto flex items-center gap-1">
          <Group label="Export">
            <Tool icon={Camera} label="PNG snapshot" onClick={png} />
            {!customer && <Tool icon={FileDown} label="Export 3D model (glTF .glb)" onClick={() => void glb()} />}
            <Tool icon={recording ? CircleStop : Video} label={recording ? 'Stop recording' : 'Record a cycle (WebM video)'} active={recording} onClick={record} />
            <Tool icon={Link2} label="Copy view link" onClick={() => void copyLink()} />
          </Group>
          <Tool icon={studio ? Minimize2 : Maximize2} label={studio ? 'Exit studio mode (Esc)' : 'Studio mode (full window)'} active={studio} onClick={() => toggleStudio(!studio)} />
          {!customer && <Tool icon={Bug} label="Debug overlay" active={debug} onClick={() => setDebug((x) => !x)} />}
        </span>
      </div>

      {/* ---------------- viewport with component tree and properties as drawers (§6) */}
      <div className={clsx('twin-viewport flex flex-col overflow-hidden rounded-card border border-line bg-[#0b0f11]', studio ? 'h-[calc(100dvh-150px)]' : 'h-[clamp(420px,calc(100dvh-200px),880px)]')}>
        <div className="relative min-h-0 flex-1" tabIndex={0} onKeyDown={onKey} aria-label="3D machine viewport. Keys: F fit, 1 front, 2 top, 3 side, 4 isometric, H hide, R reset, Space play or pause, Esc cancel." role="application">
          {!glReady ? (
            <div className="grid h-full place-items-center text-meta text-ink-3" aria-live="polite">
              Preparing 3D view…
            </div>
          ) : (
            <GLBoundary onFail={onGLFail}>
              <Canvas shadows={view.quality === 'high'} dpr={view.quality === 'high' ? [1, 2] : view.quality === 'balanced' ? [1, 1.5] : 1} gl={{ antialias: view.quality !== 'performance', preserveDrawingBuffer: true, localClippingEnabled: true } as never} frameloop="always" onCreated={({ gl }) => (gl.debug.checkShaderErrors = import.meta.env.DEV)} onPointerMissed={() => !view.measure && select(null)}>
                <Suspense fallback={null}>
                  <MachineScene
                    ref={scene}
                    model={model}
                    view={sceneView}
                    live={live}
                    stateRef={stateRef}
                    paths={twin.paths}
                    onPick={(id) => select(id)}
                    onHover={(id, x, y) => (id ? setHover({ id, x: x ?? 0, y: y ?? 0 }) : setHover(null))}
                    onMeasure={(p) => patch({ measurePts: view.measurePts.length >= 2 ? [p] : [...view.measurePts, p] })}
                    onDecline={() => {
                      if (view.quality !== 'performance') {
                        patch({ quality: 'performance' });
                        setPerfNotice(true);
                      }
                    }}
                    onPartPick={(p) => followPart(p)}
                    ghost={ghostModel}
                    factory={factory}
                    debugRef={debug ? debugOut : undefined}
                  />
                </Suspense>
              </Canvas>
            </GLBoundary>
          )}
          {/* top-left: drawer toggle + what is happening now */}
          <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
            <button type="button" onClick={() => setTreeOpen((x) => !x)} aria-pressed={treeOpen} aria-label="Component tree" className={clsx('glass inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-micro font-medium', treeOpen && 'text-accent-2')}>
              <ListTree className="size-3.5" aria-hidden /> Components
            </button>
            <span className="glass pointer-events-none rounded-control px-2 py-0.5 font-mono text-micro text-ink">{model.label}</span>
            {current && (
              <span className="glass pointer-events-none max-w-[60vw] truncate rounded-control px-2 py-0.5 font-mono text-micro text-ink">
                {current.st}: {current.step ?? 'working'}
              </span>
            )}
            {view.followPart != null && (
              <span className="glass inline-flex items-center gap-1.5 rounded-control px-2 py-0.5 text-micro text-accent-2">
                Following part #{view.followPart}
                <button type="button" className="text-ink-3 hover:text-ink" onClick={() => patch({ followPart: null })} aria-label="Stop following the part">
                  <X className="size-3" />
                </button>
              </span>
            )}
          </div>
          {/* top-right: properties drawer toggle */}
          {!propsOpen && (
            <button type="button" onClick={() => setPropsOpen(true)} aria-label="Show component details" className="glass absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-control px-2 py-1 text-micro font-medium">
              <Info className="size-3.5" aria-hidden /> Details
            </button>
          )}
          {povStation && !propsOpen && (
            <span className="pointer-events-none absolute top-4 z-10 rounded bg-black/70 px-1.5 py-0.5 font-mono text-micro text-[#c9d3d3]" style={{ right: `calc(${POV_FRACTION * 100}% + 4px)`, transform: 'translateX(100%)' }}>
              CAMERA VIEW · {povStation.fovX?.toFixed(0)} × {povStation.fovY?.toFixed(0)} mm
            </span>
          )}
          {treeOpen && (
            <aside className="absolute top-2 bottom-2 left-2 z-20 flex w-[min(19rem,calc(100%-1rem))] flex-col rounded-card border border-line bg-solid/95 p-2 shadow-xl backdrop-blur" aria-label="Component tree panel">
              <div className="mb-1.5 flex items-center gap-1.5">
                <ListTree className="size-4 text-accent-2" aria-hidden />
                <strong className="flex-1 text-meta">Components</strong>
                <button type="button" onClick={() => setTreeOpen(false)} aria-label="Close component tree" className="grid size-6 place-items-center rounded-md text-ink-3 hover:bg-panel-2">
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-ink-3" aria-hidden />
                <input aria-label="Filter components" value={treeQ} onChange={(e) => setTreeQ(e.target.value)} placeholder="Filter…" className="h-8 w-full rounded-control border border-line bg-panel pl-7 text-meta" />
              </div>
              <div className="scroll-thin min-h-0 flex-1 overflow-auto" role="tree" aria-label="Machine hierarchy">
                <TreeNode id="machine" model={model} depth={0} open={open} setOpen={setOpen} q={treeQ.toLowerCase()} view={view} select={focusObj} toggleHide={(id) => patch({ hidden: view.hidden.has(id) ? new Set([...view.hidden].filter((x) => x !== id)) : new Set([...view.hidden, id]) })} customer={customer} findings={findingsOn && !customer ? findings : null} />
              </div>
            </aside>
          )}
          {propsOpen && (
            <aside className="scroll-thin absolute top-2 right-2 bottom-2 z-20 w-[min(24rem,calc(100%-1rem))] overflow-auto rounded-card shadow-xl" aria-label="Component details">
              <Properties o={sel} eng={eng} sim={sim} set={set} d={d} twin={twin} snap={snap} customer={customer} onClose={() => (sel ? select(null) : setPropsOpen(false))} onFocus={focusObj} related={related} recipe={recipe} xctx={xctx} onTour={() => goTour(0)} findings={findingsOn && !customer ? twin.checks.filter((c, i, all) => c.objectId === view.selected && c.severity !== 'ok' && all.findIndex((x) => x.objectId === c.objectId && x.text === c.text) === i) : []} />
            </aside>
          )}
          {tourIdx != null && tour[tourIdx] && (
            <div className="glass-strong absolute bottom-2 left-2 z-30 w-[min(28rem,calc(100%-1rem))] rounded-card p-3 text-meta" role="dialog" aria-label="Guided machine tour">
              <div className="mb-1 flex items-center gap-2">
                <BookOpen className="size-4 text-accent-2" aria-hidden />
                <strong className="flex-1">{tour[tourIdx].title}</strong>
                <span className="font-mono text-micro text-ink-3">
                  {tourIdx + 1} / {tour.length}
                </span>
              </div>
              <div className="scroll-thin max-h-44 space-y-1 overflow-auto text-ink-2">
                {tour[tourIdx].lines.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Button size="sm" onClick={() => goTour(tourIdx - 1)} disabled={tourIdx === 0} aria-label="Previous tour step">
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <Button size="sm" variant="primary" onClick={() => goTour(tourIdx + 1 < tour.length ? tourIdx + 1 : null)}>
                  {tourIdx + 1 < tour.length ? 'Next' : 'Finish'} <ChevronRight className="size-4" aria-hidden />
                </Button>
                <label className="ml-1 inline-flex items-center gap-1 text-micro">
                  <input type="checkbox" checked={tourAuto} onChange={(e) => setTourAuto(e.target.checked)} /> Auto-advance
                </label>
                <button type="button" className="ml-auto text-micro text-ink-3 hover:text-ink" onClick={() => goTour(null)}>
                  Close
                </button>
              </div>
            </div>
          )}
          {narrOn && tourIdx == null && narration && (
            <div className="glass pointer-events-none absolute bottom-2 left-1/2 z-10 w-[min(44rem,calc(100%-1rem))] -translate-x-1/2 rounded-control px-3 py-1.5 text-center text-meta text-ink" aria-hidden>
              {narration}
            </div>
          )}
          {collision && (
            <div className="absolute inset-x-2 top-2 z-30 mx-auto flex max-w-xl flex-wrap items-center gap-2 rounded-control border border-bad/60 bg-[#2a0f11]/95 px-3 py-2 text-meta text-[#ffd0d0]" role="alert">
              <AlertTriangle className="size-4 shrink-0 text-bad" aria-hidden />
              <span className="flex-1">
                {collision.text} · t = {fmtT(collision.t)}. Simulation paused.
              </span>
              <Button size="sm" onClick={() => (setCollision(null), setPlaying(true))}>
                Resume
              </Button>
              <Button size="sm" onClick={() => (setCollision(null), setT(0))}>
                Reset
              </Button>
              <Button size="sm" onClick={() => (focusObj(collision.a), setBottom('checks'))}>
                Inspect
              </Button>
            </div>
          )}
          {hover && hoverObj && !view.measure && (
            <div className="pointer-events-none absolute z-10 max-w-64 rounded-control border border-line bg-solid/95 px-2.5 py-1.5 text-micro shadow-lg" style={{ left: Math.min(hover.x + 14, 9999), top: hover.y + 14 }}>
              <HoverCard o={hoverObj} eng={eng} customer={customer} />
            </div>
          )}
          {(view.measure || dist) && (
            <div className="glass absolute right-2 bottom-14 z-10 rounded-control px-2.5 py-1.5 font-mono text-micro">
              {dist ? (
                <>
                  Distance {Math.hypot(dist.dx, dist.dy, dist.dz).toFixed(1)} mm · X {dist.dx.toFixed(1)} · Y {dist.dy.toFixed(1)} · Z {dist.dz.toFixed(1)}
                  <div className="font-sans text-ink-3">Geometry measurement on the conceptual model</div>
                </>
              ) : (
                'Measure: click two points'
              )}
            </div>
          )}
          {debug && <div ref={debugOut} className="glass absolute bottom-2 left-2 z-10 rounded-control px-2 py-1 font-mono text-micro" aria-label="Render statistics" />}
        </div>
        {/* ---------------- transport: the one play / step / scrub control for the central clock */}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#0e1417] px-2 py-1.5 text-[#c9d3d3]">
          <Button size="sm" variant="primary" onClick={() => setPlaying((x) => !x)} disabled={!player} aria-label={playing ? 'Pause simulation' : 'Run simulation'}>
            {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />} <span className="hidden sm:inline">{playing ? 'Pause' : 'Run cycle'}</span>
          </Button>
          <Tool icon={SkipForward} label="Step to next event" disabled={!nextEvent} onClick={() => nextEvent && (setPlaying(false), setT(nextEvent.t + 1e-6))} dark />
          <Tool icon={RotateCcw} label="Reset simulation" onClick={() => (setPlaying(false), setT(0))} dark />
          <input type="range" aria-label="Simulation time" min={0} max={player?.end ?? 0} step={0.05} value={t} disabled={!player} onChange={(e) => (setPlaying(false), setT(Number(e.target.value)))} className="min-w-24 flex-1 accent-[var(--c-accent)]" />
          <span className="font-mono text-micro whitespace-nowrap" aria-live="off">
            {fmtT(t)} / {fmtT(player?.end ?? 0)}
          </span>
          <SmallSelect label="Playback speed" value={String(speed)} options={['0.25', '0.5', '1', '2', '5', '10', '30', '120'].map((v) => ({ value: v, label: `${v}×` }))} onChange={(v) => setSpeed(Number(v))} className="!w-auto" />
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {snap ? `Machine ${snap.machineState}. ${current ? `Part ${current.part} at ${current.st}.` : ''} Good ${snap.ok}, not good ${snap.ng}.` : ''}
      </p>

      {/* ---------------- key figures (§70, §71) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-9" aria-label="Live key figures">
        <Kpi label="Cycle time" value={d.cycle ? `${d.cycle.cycle.toFixed(2)} s` : 'Not Available'} sub={d.cycle ? (d.cycle.layout === 'sequential' ? 'Σ station times' : 'slowest station') : 'input gaps'} />
        <Kpi label="Practical UPH" value={d.cycle ? num(d.cycle.practicalUph, 4) : 'Not Available'} sub={sim.targets?.uph ? `target ${sim.targets.uph}` : 'no target'} tone={d.cycle && sim.targets?.uph ? (d.cycle.practicalUph >= sim.targets.uph ? 'ok' : 'bad') : undefined} />
        <Kpi label="Parts processed" value={preview ? '—' : String((snap?.ok ?? 0) + (snap?.ng ?? 0))} sub={preview ? 'preview — not counted' : `good ${snap?.ok ?? 0} · rejects ${snap?.ng ?? 0}`} />
        <Kpi label="Run UPH" value={preview ? '—' : uphNow} sub={preview ? 'preview — not a result' : des ? `full run ${des.uph.toFixed(0)}` : '—'} />
        <Kpi label="Queue (WIP)" value={String(totalQueue)} sub={`${snap?.inSystem ?? 0} in system`} />
        <Kpi label="Bottleneck utilization" value={desBott && !preview ? pct(desBott.utilization) : 'Not Available'} sub={desBott && !preview ? desBott.name : preview ? 'preview' : '—'} />
        <Kpi label="OEE" value={d.cycle ? pct(d.cycle.oee) : 'Not Available'} sub={d.cycle ? `A ${pct(d.cycle.availability.value)} · P ${pct(d.cycle.performance.value)} · Q ${pct(d.cycle.quality.value)}` : 'factors not defined'} />
        <Kpi label="Downtime (run)" value={downMin != null && !preview ? `${downMin.toFixed(1)} min` : 'Not Available'} sub="longest station down time" tone={downMin ? 'warn' : undefined} />
        <Kpi label="Power now (stated)" value={livePw != null ? `${(livePw / 1000).toFixed(2)} kW` : 'Not Available'} sub={util.energyPerPart != null ? `${util.energyPerPart.toFixed(2)} Wh / part` : 'no power data'} />
      </div>
      {d.cycle && (
        <p className="text-micro text-ink-3">
          OEE factors: availability — {d.cycle.availability.basis}; performance — {d.cycle.performance.basis}; quality — {d.cycle.quality.basis}. {d.cap?.annualCapacity != null && `Annual capacity ${big(d.cap.annualCapacity)} parts.`} {!customer && d.bom.total != null && `Equipment cost ${money(d.bom.total, d.bom.currency)}.`}
        </p>
      )}

      {/* ---------------- panels (§40, §42–§44, §72, §76, §92, §97, §111–§116) */}
      <Card padded={false} bodyClassName="p-3">
        <Tabs<Bottom> label="Digital twin panels" value={bottom} onChange={setBottom} tabs={bottomTabs.filter((b) => !(customer && (b.key === 'io' || b.key === 'assumptions' || b.key === 'motion' || b.key === 'builder')))} />
        <div className="pt-3">
          {bottom === 'builder' && !customer && <BuilderPanel eng={eng} sim={sim} set={set} customer={customer} />}
          {bottom === 'inputs' && <InputsPanel sim={sim} set={set} d={d} preview={preview} />}
          {bottom === 'timeline' && <TimelinePanel player={player} t={t} setT={setT} playing={playing} setPlaying={setPlaying} speed={speed} setSpeed={setSpeed} d={d} twin={twin} transport={false} />}
          {bottom === 'sequence' && <SequencePanel sim={sim} snap={snap} />}
          {bottom === 'checks' && <ChecksPanel twin={twin} onObject={focusObj} onTab={(k) => setParams((p) => (p.set('tab', k), p), { replace: true })} />}
          {bottom === 'io' && <IoPanel model={model} snap={snap} faults={[...(run.scenarioFaults ? sim.faults ?? [] : []), ...run.injected]} onObject={focusObj} />}
          {bottom === 'hmi' && <AlarmsHmiPanel player={player} snap={snap} playing={playing} setPlaying={setPlaying} setT={setT} recipe={recipe} />}
          {bottom === 'motion' && <MotionPanel model={model} snap={snap} sim={sim} set={set} customer={customer} />}
          {bottom === 'utilities' && <UtilitiesPanel u={util} live={livePw} customer={customer} />}
          {bottom === 'trace' && <PartTracePanel player={player} snap={snap} part={view.followPart} setPart={followPart} t={t} setT={setT} />}
          {bottom === 'faults' && (preview ? <p className="text-meta text-ink-3">Fault injection needs a real simulation — enter the missing inputs first.</p> : <FaultsPanel sim={sim} run={run} setRun={setRun} t={t} des={des} baseline={baseline} customer={customer} />)}
          {bottom === 'runs' && <RunsPanel sim={sim} set={set} run={run} setRun={setRun} des={preview ? null : des} onSnapshot={saveSnapshot} onRestore={restoreSnapshot} onPng={png} />}
          {bottom === 'compare' && <ComparePanel eng={eng} sim={sim} d={d} twin={twin} other={other} setOther={setOther} ghost={ghostOn} setGhost={setGhostOn} set={set} customer={customer} />}
          {bottom === 'assumptions' && <AssumptionsPanel eng={eng} sim={sim} set={set} d={d} twin={twin} player={player} customer={customer} />}
        </div>
      </Card>
    </div>
  );
  // studio mode renders over the whole window (a portal escapes any transformed ancestor)
  return studio && typeof document !== 'undefined' ? createPortal(body, document.body) : body;
}

/** A labelled cluster of toolbar controls (the caption is visible on wide screens, always announced). */
function Group({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="group" aria-label={label} className={clsx('flex items-center gap-0.5 rounded-control border border-line/60 bg-panel/40 py-0.5 pr-0.5 pl-1', className)}>
      <span className="hidden pr-1 text-micro font-semibold tracking-wider text-ink-3 uppercase 2xl:inline" aria-hidden>
        {label}
      </span>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- small pieces */

function useGhost(eng: TabProps['eng'], id: string | null) {
  return useMemo(() => {
    if (!id) return null;
    const s = eng.byId.get(id);
    if (!s) return null;
    // same canonical generator as the main model (§178)
    return buildGhost(eng, s as never);
  }, [eng, id]);
}
function buildGhost(eng: TabProps['eng'], s: TabProps['sim']) {
  return buildMachine(resolveScenario(s, eng.byId, eng.defs), eng.byId, eng.defs);
}

function Tool({ icon: Icon, label, onClick, active, disabled, dark }: { icon: typeof Box; label: string; onClick: () => void; active?: boolean; disabled?: boolean; dark?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} aria-pressed={active} className={clsx('inline-flex size-8 items-center justify-center rounded-control transition-colors disabled:opacity-35', dark ? 'text-[#c9d3d3] hover:bg-white/10 hover:text-white' : 'text-ink-2 hover:bg-panel-2 hover:text-ink', active && 'bg-accent-soft text-accent-2')}>
      <Icon className="size-4" aria-hidden />
    </button>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'ok' | 'bad' | 'warn' }) {
  return (
    <div className="rounded-control border border-line bg-panel px-2.5 py-2">
      <div className="text-micro uppercase tracking-wider text-ink-3">{label}</div>
      <div className={clsx('font-mono text-body font-semibold', tone === 'ok' && 'text-ok', tone === 'bad' && 'text-bad', tone === 'warn' && 'text-warn')}>{value}</div>
      {sub && <div className="truncate text-micro text-ink-3">{sub}</div>}
    </div>
  );
}

function OverlayLegend({ kind, des }: { kind: Overlay; des: DesResult | null }) {
  if (kind === 'utilization') {
    if (!des) return <p className="text-micro text-ink-3">Not available — the scenario previews without station times, so there is no run to measure. Enter the missing inputs first.</p>;
    const p = (v: number) => `${Math.round(v * 100)} %`;
    return (
      <div className="text-micro">
        <div className="h-2 rounded" style={{ background: `linear-gradient(90deg, ${utilColor(0)}, ${utilColor(1)})` }} />
        <div className="flex justify-between text-ink-3">
          <span>idle</span>
          <span>100 % busy</span>
        </div>
        <table className="mt-1.5 w-full">
          <caption className="sr-only">Share of run time per station</caption>
          <thead className="text-ink-3">
            <tr>
              <th scope="col" className="text-left font-normal">Station</th>
              <th scope="col" className="pl-2 text-right font-normal">Busy</th>
              <th scope="col" className="pl-2 text-right font-normal">Blocked</th>
              <th scope="col" className="pl-2 text-right font-normal">Starved</th>
              <th scope="col" className="pl-2 text-right font-normal">Down</th>
            </tr>
          </thead>
          <tbody className="num">
            {des.stations.map((s) => (
              <tr key={s.key}>
                <th scope="row" className="max-w-40 truncate text-left font-normal">
                  <span className="mr-1 inline-block size-2 rounded-sm align-middle" style={{ background: utilColor(s.utilization) }} aria-hidden />
                  {s.name}
                </th>
                <td className="whitespace-nowrap pl-2 text-right">{p(s.utilization)}</td>
                <td className="whitespace-nowrap pl-2 text-right">{p(s.blocked)}</td>
                <td className="whitespace-nowrap pl-2 text-right">{p(s.starved)}</td>
                <td className="whitespace-nowrap pl-2 text-right">{p(s.down)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-ink-3">Over the whole run (seed {des.seed}, {Math.round(des.horizon_s / 60)} min). Blocked = waiting for space downstream; starved = waiting for parts.</p>
      </div>
    );
  }
  if (kind === 'localization')
    return (
      <ul className="space-y-0.5 text-micro">
        {(Object.keys(ORIGIN_COLOR) as (keyof typeof ORIGIN_COLOR)[]).map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: ORIGIN_COLOR[k] }} /> {k === 'Local' ? 'Local (manufacturer country India)' : k === 'Imported' ? 'Imported' : 'Unknown origin'}
          </li>
        ))}
        <li className="text-ink-3">From the manufacturer record — never implies local manufacturability.</li>
      </ul>
    );
  if (kind === 'cost')
    return (
      <div className="text-micro">
        <div className="h-2 rounded" style={{ background: `linear-gradient(90deg, ${costColor(0)}, ${costColor(1)})` }} />
        <div className="flex justify-between text-ink-3">
          <span>low share</span>
          <span>highest line cost</span>
        </div>
        <p className="text-ink-3">From BOM lines with a price; unpriced components are not coloured.</p>
      </div>
    );
  if (kind === 'risk') return <p className="text-micro text-ink-3">Red = single source; amber = other supply risk (lead time, imported, no alternative) from the supplier-dependency records.</p>;
  if (kind === 'state') return <p className="text-micro text-ink-3">Teal = processing · amber = blocked · red = down, from the live simulation.</p>;
  if (kind === 'requirement') return <p className="text-micro text-ink-3">Highlights components traced to the requirement: its process area (laser chain + fixture), throughput (bottleneck station), inspection or a linked part.</p>;
  return null;
}

function HoverCard({ o, eng, customer }: { o: Machine3DObject; eng: TabProps['eng']; customer: boolean }) {
  const part = o.partId ? (eng.byId.get(o.partId) as (Part & AnyRecord) | undefined) : undefined;
  const keys = part ? (KEY_SPECS[part.product_type] ?? []).slice(0, 2) : [];
  return (
    <>
      <div className="font-semibold">{customer && part ? productTypeLabel(part.product_type) : o.name}</div>
      {part && (
        <div className="text-ink-2">
          {keys
            .map((k) => readSpec(part, k, eng.defs))
            .filter(Boolean)
            .map((s) => displaySpec(s))
            .join(' · ') || productTypeLabel(part.product_type)}
        </div>
      )}
      <div className="text-ink-3">
        {o.layer}
        {o.stationKey ? ` · ${o.stationKey}` : ''}
      </div>
    </>
  );
}

function TreeNode({ id, model, depth, open, setOpen, q, view, select, toggleHide, customer, findings = null }: { id: string; model: TabModel; depth: number; open: Set<string>; setOpen: (s: Set<string>) => void; q: string; view: SceneView; select: (id: string) => void; toggleHide: (id: string) => void; customer: boolean; findings?: ReturnType<typeof findingsByObject> | null }) {
  const fd = findings?.get(id);
  const o = model.byId.get(id);
  const kids = model.objects.filter((x) => x.parentId === id);
  if (!o) return null;
  const match = (x: Machine3DObject): boolean => !q || x.name.toLowerCase().includes(q) || model.objects.some((c) => c.parentId === x.id && match(c));
  if (!match(o)) return null;
  const isOpen = open.has(id) || !!q;
  const label = customer && o.partId ? o.name.split(' — ')[0] : o.name;
  return (
    <div role="treeitem" aria-expanded={kids.length ? isOpen : undefined} aria-selected={view.selected === id}>
      <div className={clsx('group flex items-center gap-1 rounded-md pr-1 text-meta', view.selected === id ? 'bg-accent-soft text-ink' : 'hover:bg-panel-2', (view.hidden.has(id) || !view.layers[o.layer]) && 'opacity-45')} style={{ paddingLeft: depth * 12 }}>
        {kids.length ? (
          <button type="button" className="grid size-5 place-items-center text-ink-3" aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`} onClick={() => setOpen(new Set(isOpen ? [...open].filter((x) => x !== id) : [...open, id]))}>
            {isOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </button>
        ) : (
          <span className="size-5" />
        )}
        <button type="button" className="min-w-0 flex-1 truncate py-1 text-left" onClick={() => select(id)} title={fd ? `${label} — ${fd.first}` : label}>
          {label}
        </button>
        {fd && <AlertTriangle className={clsx('size-3.5 shrink-0', fd.severity === 'critical' ? 'text-bad' : fd.severity === 'major' ? 'text-warn' : 'text-ink-3')} aria-label={`${fd.count} design-check finding${fd.count > 1 ? 's' : ''}`} />}
        {o.level !== 'machine' && (
          <button type="button" className="invisible grid size-5 place-items-center text-ink-3 group-hover:visible" aria-label={view.hidden.has(id) ? `Show ${label}` : `Hide ${label}`} onClick={() => toggleHide(id)}>
            {view.hidden.has(id) ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        )}
      </div>
      {isOpen && kids.map((k) => <TreeNode key={k.id} id={k.id} model={model} depth={depth + 1} open={open} setOpen={setOpen} q={q} view={view} select={select} toggleHide={toggleHide} customer={customer} findings={findings} />)}
    </div>
  );
}
type TabModel = ReturnType<typeof buildMachine>;

/* ---------------------------------------------------------------- properties (§58–§61, §75, §83, §100, §140, §141, §146) */

function Properties({ o, eng, sim, set, d, twin, snap, customer, onClose, onFocus, related, recipe, xctx, onTour, findings = [] }: { o?: Machine3DObject; eng: TabProps['eng']; sim: TabProps['sim']; set: TabProps['set']; d: TabProps['d']; twin: ReturnType<typeof useTwinModel>; snap: SimulationState | null; customer: boolean; onClose: () => void; onFocus: (id: string) => void; related: (reqId: string) => Set<string>; recipe?: Recipe & AnyRecord; xctx: ExplainCtx; onTour: () => void; findings?: TwinCheck[] }) {
  const model = twin.model;
  if (!o)
    return (
      <Card
        title="Properties"
        icon={Info}
        actions={
          <button type="button" onClick={onClose} aria-label="Close properties" className="grid size-7 place-items-center rounded-md text-ink-3 hover:bg-panel-2">
            <X className="size-4" />
          </button>
        }
      >
        <p className="text-meta text-ink-2">Select a component in the viewport or the tree for its explanation (what it is, how it works, what it does in this machine) and its engineering data — part number, specifications, supplier, cost, requirements and BOM.</p>
        <Button size="sm" variant="primary" className="mt-2" onClick={onTour}>
          <GraduationCap className="size-4" aria-hidden /> Explain the machine step by step
        </Button>
        <div className="mt-3 text-micro font-semibold uppercase tracking-wider text-ink-3">Explain a component</div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {model.objects
            .filter((x) => ['enclosure', 'laser_source', 'beam_expander', 'galvo', 'f_theta', 'laser_head', 'camera', 'robot', 'gantry_pp', 'tool', 'test_head', 'pusher', 'magazine', 'conveyor', 'xy_stage', 'fixture', 'cabinet', 'hmi', 'fume', 'chain', 'estop'].includes(x.kind))
            .slice(0, 20)
            .map((x) => (
              <button key={x.id} type="button" onClick={() => onFocus(x.id)} className="rounded-full border border-line px-2 py-0.5 text-micro hover:border-accent hover:text-accent-2">
                {x.name.split(' — ')[0].replace(/ \(.*\)$/, '')}
              </button>
            ))}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-meta">
          <dt className="text-ink-3">Machine (W × D × H)</dt>
          <dd className="font-mono">
            {Math.round(model.dims.width)} × {Math.round(model.dims.depth)} × {Math.round(model.dims.height)} mm
          </dd>
          <dt className="text-ink-3">Components</dt>
          <dd>{model.objects.filter((x) => x.partId).length} linked · {model.objects.filter((x) => x.kind !== 'group' && x.kind !== 'station' && !x.partId).length} conceptual</dd>
          <dt className="text-ink-3">Workpiece</dt>
          <dd>
            {model.workpiece.template.replace('_', ' ')} {model.workpiece.length} × {model.workpiece.width} × {model.workpiece.thickness} mm <Badge>{model.workpiece.basis}</Badge>
          </dd>
          {model.lasers[0] && (
            <>
              <dt className="text-ink-3">Marking field</dt>
              <dd>{model.lasers[0].field != null ? `${model.lasers[0].field} × ${model.lasers[0].field} mm` : <Unknown label="Not stated" />}</dd>
            </>
          )}
        </dl>
        {model.notes.map((n) => (
          <p key={n} className="mt-2 text-micro text-warn">
            {n}
          </p>
        ))}
      </Card>
    );
  const part = o.partId ? (eng.byId.get(o.partId) as (Part & AnyRecord) | undefined) : undefined;
  const sheet = part ? sheetFor(part.id, eng.records, eng.byId) : undefined;
  const st = o.stationKey ? d.res.stations.find((s) => s.station.key === o.stationKey) : undefined;
  const load = st && d.cycle ? d.cycle.loads.find((l) => l.rs.station.key === st.station.key) : undefined;
  const live = st && snap ? snap.stations.find((s) => s.key === st.station.key) : undefined;
  const bomLines = part ? d.bom.items.filter((b) => b.partId === part.id) : [];
  const sp = part ? selectedParts(d.res).find((x) => x.part.id === part.id && (x.stationKey === o.stationKey || x.stationKey === '_machine' || !o.stationKey)) : undefined;
  const alts = sp ? alternativesFor(sp, eng.parts, d.res, eng.ctx, eng.byId) : [];
  const dep = part ? d.deps.find((x) => x.sp.part.id === part.id) : undefined;
  const reqs = (sim.requirement_ids ?? []).filter((id) => related(id).has(o.id));
  const vers = eng.records.filter((r) => r.entity === 'verification' && reqs.includes(String((r as AnyRecord & { requirement_id?: string }).requirement_id)));
  const vis = model.vision.find((v) => v.cameraId === o.id);
  const laser = model.lasers.find((l) => [l.sourceId, l.galvoId, l.fthetaId, l.expanderId].includes(o.id));
  const swap = (newId: string) => {
    if (!sp) return;
    set((s) => ({ ...s, selections: (s.selections ?? []).map((x) => (x.station_key === sp.stationKey && x.role === sp.role && x.part_id === sp.part.id ? { ...x, part_id: newId } : x)) }));
    toast(`Component changed — 3D model, BOM, cost, compatibility and simulation updated`, { tone: 'draft', detail: 'Save the scenario to keep the change.' });
  };
  const applyRecipe = () => {
    if (!recipe || !st) return;
    const n = (name: RegExp) => {
      const p = recipe.parameters.find((x) => name.test(x.name));
      const v = p ? Number(p.value) : NaN;
      return Number.isFinite(v) ? v : undefined;
    };
    const patchL = { power_w: n(/^power/i), speed_mm_s: n(/speed/i), frequency_khz: n(/freq/i), hatch_mm: n(/hatch/i), passes: n(/pass/i) };
    set((s) => ({ ...s, stations: s.stations.map((x) => (x.key === st.station.key ? { ...x, laser: { ...x.laser, ...Object.fromEntries(Object.entries(patchL).filter(([, v]) => v != null)) } } : x)) }));
    toast('Recipe applied to the laser station', { tone: 'draft', detail: 'Process time, simulation and 3D timeline recalculated.' });
  };
  const ov = sim.twin?.overrides?.[o.id];
  const setOv = (p: { x_mm?: number; z_mm?: number } | null) => set((s) => {
    const all = { ...(s.twin?.overrides ?? {}) };
    if (p) all[o.id] = { ...all[o.id], ...p };
    else delete all[o.id];
    return { ...s, twin: { ...s.twin, overrides: all } };
  });
  return (
    <Card
      title={customer && part ? productTypeLabel(part.product_type) : o.name}
      icon={Info}
      actions={
        <button type="button" onClick={onClose} aria-label="Close properties" className="grid size-7 place-items-center rounded-md text-ink-3 hover:bg-panel-2">
          <X className="size-4" />
        </button>
      }
    >
      <div className="scroll-thin max-h-[70vh] space-y-3 overflow-auto pr-1">
        <div className="flex flex-wrap gap-1.5">
          <Badge>{o.layer}</Badge>
          <Badge>{o.level}</Badge>
          {o.carriedBy?.length ? <Badge tone="info">moves with {o.carriedBy.join(' + ').toUpperCase()}</Badge> : null}
          {part ? <Badge tone="accent">engineering record</Badge> : <Badge tone="warn">conceptual object (no component record)</Badge>}
          {live && <Badge tone={live.servers.some((x) => x.state === 'down') ? 'bad' : live.servers.some((x) => x.state === 'busy') ? 'ok' : 'neutral'}>{live.servers.map((x) => x.state).join(' / ')}</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onFocus(o.id)}>
            <Focus className="size-3.5" aria-hidden /> Focus
          </Button>
          {part && !customer && (
            <Link to={recordPath(part.id)} className="inline-flex h-8 items-center rounded-control border border-line px-2.5 text-meta hover:bg-panel-2">
              Open record
            </Link>
          )}
          {part && (
            <Link to={`/graph?id=${encodeURIComponent(part.id)}`} className="inline-flex h-8 items-center rounded-control border border-line px-2.5 text-meta hover:bg-panel-2">
              Knowledge graph
            </Link>
          )}
        </div>
        {findings.length > 0 && (
          <section className="rounded-control border border-bad/40 bg-bad/5 p-2.5" aria-label="Design-check findings on this component">
            <h4 className="mb-1 flex items-center gap-1.5 text-meta font-semibold">
              <AlertTriangle className="size-4 text-bad" aria-hidden /> Design check
            </h4>
            <ul className="space-y-1 text-meta">
              {findings.map((f, i) => (
                <li key={i}>
                  <Badge tone={f.severity === 'critical' ? 'bad' : f.severity === 'major' ? 'warn' : 'neutral'}>{f.severity}</Badge> {f.text}
                </li>
              ))}
            </ul>
          </section>
        )}
        {o.kind !== 'group' && o.kind !== 'station' && <ExplainBlock o={o} xctx={xctx} customer={customer} />}
        {st && (
          <section>
            <h4 className="mb-1 text-micro font-semibold uppercase tracking-wider text-ink-3">Station · simulation</h4>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-meta">
              <dt className="text-ink-3">Station</dt>
              <dd>{st.station.name}</dd>
              <dt className="text-ink-3">Time per part</dt>
              <dd>
                {st.time != null ? `${st.time.toFixed(3)} s` : <Unknown label="Not defined" />} <Badge>{st.basis}</Badge>
              </dd>
              <dt className="text-ink-3">Utilization</dt>
              <dd>{load ? pct(load.utilization) : '—'}</dd>
              {live?.servers[0]?.step && (
                <>
                  <dt className="text-ink-3">Now</dt>
                  <dd>
                    {live.servers[0].step.name} ({Math.round(live.servers[0].stepProgress * 100)} %)
                  </dd>
                </>
              )}
              <dt className="text-ink-3">MTBF / MTTR</dt>
              <dd>{st.station.mtbf_min != null ? `${st.station.mtbf_min} / ${st.station.mttr_min ?? '—'} min` : <Unknown label="Not stated" />}</dd>
            </dl>
          </section>
        )}
        {laser && (
          <section>
            <h4 className="mb-1 text-micro font-semibold uppercase tracking-wider text-ink-3">Laser process (from configuration)</h4>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-micro">
              {(
                [
                  ['POWER', sim.stations.find((x) => x.key === laser.stationKey)?.laser?.power_w, 'W'],
                  ['SPEED', sim.stations.find((x) => x.key === laser.stationKey)?.laser?.speed_mm_s, 'mm/s'],
                  ['FREQUENCY', sim.stations.find((x) => x.key === laser.stationKey)?.laser?.frequency_khz, 'kHz'],
                  ['PULSE WIDTH', sim.stations.find((x) => x.key === laser.stationKey)?.laser?.pulse_width_ns, 'ns'],
                  ['HATCH', sim.stations.find((x) => x.key === laser.stationKey)?.laser?.hatch_mm, 'mm'],
                  ['PASSES', sim.stations.find((x) => x.key === laser.stationKey)?.laser?.passes, ''],
                  ['FIELD', laser.field, 'mm'],
                  ['WORKING DIST.', laser.wd, 'mm'],
                ] as const
              ).map(([k, v, u]) => (
                <div key={k} className="contents">
                  <dt className="text-ink-3">{k}</dt>
                  <dd>{v != null ? `${v} ${u}` : '—'}</dd>
                </div>
              ))}
            </dl>
            {recipe && !customer && (
              <Button size="sm" className="mt-2" onClick={applyRecipe}>
                Apply recipe {recipe.name.split(' — ')[0]} ({recipe.recipe_version})
              </Button>
            )}
          </section>
        )}
        {vis && (
          <section>
            <h4 className="mb-1 text-micro font-semibold uppercase tracking-wider text-ink-3">Camera field of view</h4>
            <p className="text-meta">{vis.fovX != null ? `${vis.fovX.toFixed(1)} × ${vis.fovY!.toFixed(1)} mm (${vis.basis})` : `Not computable — missing ${vis.missing.join(', ')}`}</p>
            {vis.target && <p className="text-micro text-ink-3">Target area {vis.target.x} × {vis.target.y} mm</p>}
            {!customer && (
              <label className="mt-1 flex items-center gap-2 text-meta">
                Working distance (mm)
                <NumInput label="Camera working distance" value={sim.twin?.vision?.[vis.stationKey]?.wd_mm ?? null} min={1} onChange={(v) => set((s) => ({ ...s, twin: { ...s.twin, vision: { ...s.twin?.vision, [vis.stationKey]: { ...s.twin?.vision?.[vis.stationKey], wd_mm: v } } } }))} />
              </label>
            )}
          </section>
        )}
        {sheet && <SheetBody sheet={sheet} compact />}
        {part && !customer && (
          <section>
            <h4 className="mb-1 text-micro font-semibold uppercase tracking-wider text-ink-3">BOM · cost</h4>
            {bomLines.length ? (
              <ul className="space-y-0.5 text-meta">
                {bomLines.map((b) => (
                  <li key={b.id}>
                    {b.quantity} × {b.name} · {b.unitCost != null ? `${b.currency} ${b.unitCost.toLocaleString('en-IN')}` : 'no price'} {b.basis ? <Badge>{b.basis}</Badge> : null} {b.leadTimeWeeks != null ? `· ${b.leadTimeWeeks} wk` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-meta text-ink-3">Not in the BOM.</p>
            )}
            {dep && dep.risk.length > 0 && <p className="mt-1 text-micro text-warn">Supply risk: {dep.risk.join('; ')}</p>}
          </section>
        )}
        {sp && !customer && (
          <section>
            <h4 className="mb-1 text-micro font-semibold uppercase tracking-wider text-ink-3">Change component (live)</h4>
            {alts.length ? (
              <SmallSelect label="Replace with" value="" options={[{ value: '', label: `Replace ${part!.model_number} with…` }, ...alts.map((a) => ({ value: a.part.id, label: `${a.part.model_number} — ${a.relationship} · ${a.origin}` }))]} onChange={(v) => v && swap(v)} className="w-full" />
            ) : (
              <p className="text-meta text-ink-3">No compatible alternative of the same type in the database.</p>
            )}
            <p className="mt-1 text-micro text-ink-3">Changing it updates the 3D model, specifications, BOM, cost, compatibility and simulation together — one connected record.</p>
          </section>
        )}
        <section>
          <h4 className="mb-1 text-micro font-semibold uppercase tracking-wider text-ink-3">Requirements · tests</h4>
          {reqs.length ? (
            <ul className="space-y-1 text-meta">
              {reqs.map((id) => {
                const r = eng.byId.get(id) as (AnyRecord & { code?: string; value?: string; unit?: string; verification_method?: string; status?: string }) | undefined;
                return (
                  <li key={id}>
                    <Link to={recordPath(id)} className="text-accent-2 hover:underline">
                      {r?.code ?? id}
                    </Link>{' '}
                    {r?.name}
                    <div className="text-micro text-ink-3">
                      Target {r?.value ? `${r.value} ${r.unit ?? ''}` : 'not stated'} · verification {r?.verification_method ?? '—'} · status {r?.status ?? '—'}
                    </div>
                  </li>
                );
              })}
              {vers.map((v) => (
                <li key={v.id} className="text-micro">
                  Test: {v.name} — <Badge tone={(v as AnyRecord & { result?: string }).result === 'PASS' ? 'ok' : (v as AnyRecord & { result?: string }).result === 'FAIL' ? 'bad' : 'neutral'}>{String((v as AnyRecord & { result?: string }).result)}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-meta text-ink-3">No requirement is traced to this component.</p>
          )}
        </section>
        {st && (
          <section>
            <h4 className="mb-1 text-micro font-semibold uppercase tracking-wider text-ink-3">Service</h4>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-meta">
              <dt className="text-ink-3">Maintenance interval</dt>
              <dd>{sim.maintenance?.pm_interval_h != null ? `${sim.maintenance.pm_interval_h} h (machine PM)` : <Unknown label="Not stated" />}</dd>
              <dt className="text-ink-3">Spares · service history</dt>
              <dd>
                <Unknown label="No installed-base record" />
              </dd>
            </dl>
          </section>
        )}
        {!customer && (
          <section>
            <h4 className="mb-1 text-micro font-semibold uppercase tracking-wider text-ink-3">Geometry (conceptual)</h4>
            <p className="font-mono text-micro">
              position {o.position.map((v) => Math.round(v)).join(', ')} mm · size {o.size.map((v) => Math.round(v)).join(' × ')} mm
              {o.params.sizeBasis === 'datasheet' ? ' (from the datasheet dimensions)' : o.params.sizeBasis === 'placeholder' ? ' (placeholder — datasheet dimensions not stated)' : ''}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-meta">
              Manual layout override
              <NumInput label="Override X" value={ov?.x_mm ?? null} placeholder="X mm" onChange={(v) => setOv(v == null ? { x_mm: undefined } : { x_mm: v })} />
              <NumInput label="Override Z" value={ov?.z_mm ?? null} placeholder="Z mm" onChange={(v) => setOv(v == null ? { z_mm: undefined } : { z_mm: v })} />
              {ov && (
                <Button size="sm" onClick={() => setOv(null)}>
                  Auto
                </Button>
              )}
            </div>
            <p className="mt-1 text-micro text-ink-3">Automatic placement is a layout aid, never manufacturing-ready design (§13).</p>
          </section>
        )}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- explanation block */

function ExplainBlock({ o, xctx, customer }: { o: Machine3DObject; xctx: ExplainCtx; customer: boolean }) {
  const ex = useMemo(() => explainObject(o, xctx), [o, xctx]);
  const lines = customer || !ex.identity ? ex.inThisMachine : [`${ex.identity}.`, ...ex.inThisMachine];
  return (
    <section className="rounded-control border border-accent/30 bg-accent-soft/30 p-2.5" aria-label={`Explanation: ${ex.title}`}>
      <h4 className="mb-1 flex items-center gap-1.5 text-meta font-semibold">
        <Lightbulb className="size-4 text-accent-2" aria-hidden /> {ex.title}
      </h4>
      <p className="text-meta">
        <span className="font-medium">What it is — </span>
        {ex.guide.what}
      </p>
      <p className="mt-1 text-meta">
        <span className="font-medium">How it works — </span>
        {ex.guide.how}
      </p>
      {lines.length > 0 && (
        <div className="mt-2">
          <div className="text-micro font-semibold uppercase tracking-wider text-ink-3">In this machine (from the records)</div>
          <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-meta">
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
      {ex.warnings.map((w) => (
        <p key={w} className="mt-1 flex items-start gap-1 text-meta text-warn">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {w}
        </p>
      ))}
      {ex.inCycle.length > 0 && (
        <div className="mt-2">
          <div className="text-micro font-semibold uppercase tracking-wider text-ink-3">In the cycle</div>
          <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-meta">
            {ex.inCycle.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
      {(ex.guide.checks.length > 0 || ex.guide.interfaces.length > 0) && (
        <details className="mt-2 text-meta">
          <summary className="cursor-pointer text-micro font-semibold uppercase tracking-wider text-ink-3">What to check · interfaces · care</summary>
          {ex.guide.checks.length > 0 && (
            <>
              <div className="mt-1 font-medium">Engineering checks</div>
              <ul className="list-disc pl-4">
                {ex.guide.checks.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </>
          )}
          {ex.guide.interfaces.length > 0 && (
            <>
              <div className="mt-1 font-medium">Interfaces</div>
              <ul className="list-disc pl-4">
                {ex.guide.interfaces.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </>
          )}
          {ex.guide.care.length > 0 && (
            <>
              <div className="mt-1 font-medium">Maintenance</div>
              <ul className="list-disc pl-4">
                {ex.guide.care.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </>
          )}
        </details>
      )}
      {ex.guide.safety && <p className="mt-1 text-micro text-ink-2">Safety: {ex.guide.safety}</p>}
      <p className="mt-1 text-micro text-ink-3">General description of this component type; every number above comes from this scenario’s records or is calculated from them.</p>
    </section>
  );
}
