import { fmtNum } from '../../calculations/units';
import type { AnyRecord } from '../../domain';
import type { Basis, Distribution, Part, Selection, Simulation, Station } from '../../domain/engineering';
import { scenarioMotion, type AxisModel, type PlannedMove } from '../twin/motion';
import { readSpec, type SpecDefs } from '../eng/specs';

/*
 * EQUIPMENT SIMULATION MODEL (master prompt §59–§65, §140, §141). Resolves a scenario into stations
 * with an effective time per part, its basis and its derivation (lineage). A station whose time
 * cannot be resolved is reported — the simulation never runs on a guessed number (§163).
 *
 * This is an ENGINEERING DECISION-SUPPORT SIMULATOR (§172): cycle time, capacity, queues and
 * variability. It is not FEA, CFD, optical ray-tracing, servo dynamics or a validated factory twin.
 */

export const MODEL_VERSION = 'sim-1.0';

export interface Lineage {
  label: string;
  value: number | null;
  unit: string;
  formula?: string;
  basis: Basis | 'MIXED';
  source?: string;
  children?: Lineage[];
}

export interface ResolvedStation {
  station: Station;
  index: number;
  /** mean seconds per part at ONE server */
  time: number | null;
  basis: Basis;
  lineage: Lineage;
  parts: { role: string; part: Part & AnyRecord; qty: number }[];
  missing: string[];
  warnings: string[];
}

export interface Resolved {
  sim: Simulation & AnyRecord;
  layout: 'inline' | 'sequential';
  stations: ResolvedStation[];
  machineParts: { role: string; part: Part & AnyRecord; qty: number }[];
  /** blocking: the simulation cannot run until these are entered */
  blocking: string[];
  warnings: string[];
  runnable: boolean;
}

const BASIS_LABEL: Record<Basis, string> = { CALCULATED: 'Calculated', EMPIRICAL: 'Empirical', USER_INPUT: 'User input', MANUFACTURER_DATA: 'Manufacturer data', VALIDATED: 'Validated data', ASSUMPTION: 'Assumption', DEMO: 'DEMO DATA' };
export const basisLabel = (b: Basis | 'MIXED') => (b === 'MIXED' ? 'Mixed' : BASIS_LABEL[b]);

/** Laser process time (§65 "Laser Process"): area ÷ (hatch × speed) × passes + overhead, or path ÷ speed × passes + overhead. */
export function laserTime(st: Station): { time: number | null; lineage: Lineage; missing: string[] } {
  const l = st.laser ?? {};
  const passes = l.passes ?? 1;
  const over = l.jump_overhead_s ?? 0;
  const inputs: Lineage[] = [];
  const add = (label: string, v: number | null | undefined, unit: string) => inputs.push({ label, value: v ?? null, unit, basis: v == null ? 'ASSUMPTION' : 'USER_INPUT' });
  const missing: string[] = [];
  if (l.path_mm != null) {
    add('Weld / cut path length', l.path_mm, 'mm');
    add('Process speed', l.speed_mm_s, 'mm/s');
    add('Passes', passes, '');
    add('Jump / positioning overhead', over, 's');
    if (l.speed_mm_s == null) missing.push(`${st.name}: process speed`);
    const t = l.speed_mm_s ? (l.path_mm / l.speed_mm_s) * passes + over : null;
    return { time: t, missing, lineage: { label: `${st.name} — laser time`, value: t, unit: 's', formula: 'path ÷ speed × passes + overhead', basis: 'CALCULATED', children: inputs } };
  }
  add('Processed area', l.area_mm2, 'mm²');
  add('Hatch (line spacing)', l.hatch_mm, 'mm');
  add('Marking speed', l.speed_mm_s, 'mm/s');
  add('Passes', passes, '');
  add('Jump / positioning overhead', over, 's');
  if (l.area_mm2 == null) missing.push(`${st.name}: processed area (mm²)`);
  if (l.hatch_mm == null) missing.push(`${st.name}: hatch spacing (mm)`);
  if (l.speed_mm_s == null) missing.push(`${st.name}: marking speed (mm/s)`);
  const t = l.area_mm2 != null && l.hatch_mm && l.speed_mm_s ? (l.area_mm2 / (l.hatch_mm * l.speed_mm_s)) * passes + over : null;
  return { time: t, missing, lineage: { label: `${st.name} — laser time`, value: t, unit: 's', formula: 'area ÷ (hatch × speed) × passes + overhead', basis: 'CALCULATED', children: inputs } };
}

const hasLaserInputs = (st: Station) => !!st.laser && Object.values(st.laser).some((v) => v != null);

export function resolveStation(st: Station, index: number, sim: Simulation, byId: Map<string, AnyRecord>, defs: SpecDefs): ResolvedStation {
  const sel = (sim.selections ?? []).filter((s) => s.station_key === st.key);
  const parts = sel.map((s) => ({ role: s.role, part: byId.get(s.part_id) as Part & AnyRecord, qty: s.quantity ?? 1 })).filter((x) => !!x.part);
  const warnings: string[] = [];
  const missing: string[] = [];
  let time: number | null = null;
  let basis: Basis = st.time_basis ?? 'USER_INPUT';
  let lineage: Lineage;
  if (st.kind === 'laser' && hasLaserInputs(st)) {
    const lt = laserTime(st);
    if (lt.time != null) {
      time = lt.time;
      basis = 'CALCULATED';
      lineage = lt.lineage;
    } else if (st.time_s != null) {
      time = st.time_s;
      lineage = { label: st.name, value: st.time_s, unit: 's', basis, children: [lt.lineage] };
      warnings.push(`${st.name}: laser inputs incomplete (${lt.missing.join(', ')}) — using the entered station time`);
    } else {
      missing.push(...lt.missing);
      lineage = lt.lineage;
    }
    // engineering sanity checks against the selected components (evidence, not assumptions)
    const galvo = parts.find((p) => p.part.product_type === 'galvo')?.part;
    const src = parts.find((p) => p.part.product_type === 'laser_source')?.part;
    const gs = galvo ? readSpec(galvo, 'marking_speed', defs) : undefined;
    if (gs?.value != null && st.laser?.speed_mm_s != null && st.laser.speed_mm_s > gs.value) warnings.push(`${st.name}: marking speed ${fmtNum(st.laser.speed_mm_s, 6)} mm/s exceeds ${galvo!.model_number}'s stated marking speed ${fmtNum(gs.value, 6)} mm/s${gs.entry.condition ? ` (${gs.entry.condition})` : ''}`);
    const sp = src ? readSpec(src, 'average_power', defs) : undefined;
    if (sp?.value != null && st.laser?.power_w != null && st.laser.power_w > sp.value) warnings.push(`${st.name}: process power ${st.laser.power_w} W exceeds ${src!.model_number}'s average power ${fmtNum(sp.value, 6)} W`);
    const rr = src ? readSpec(src, 'repetition_rate_range', defs) : undefined;
    if (rr?.min != null && rr.max != null && st.laser?.frequency_khz != null && (st.laser.frequency_khz < rr.min || st.laser.frequency_khz > rr.max)) warnings.push(`${st.name}: ${st.laser.frequency_khz} kHz is outside ${src!.model_number}'s ${fmtNum(rr.min, 6)}–${fmtNum(rr.max, 6)} kHz`);
  } else if (st.time_s != null) {
    time = st.time_s;
    lineage = { label: st.name, value: st.time_s, unit: 's', basis, source: basisLabel(basis) };
  } else {
    missing.push(`${st.name}: time per part`);
    lineage = { label: st.name, value: null, unit: 's', basis: 'ASSUMPTION', source: 'Not entered' };
  }
  if (st.intervention && time != null) {
    const add = st.intervention.probability * st.intervention.time_s;
    time += add;
    lineage = { label: `${st.name} incl. operator intervention`, value: time, unit: 's', formula: 'station time + p(intervention) × intervention time', basis: 'MIXED', children: [lineage, { label: 'Intervention', value: add, unit: 's', basis: 'ASSUMPTION', formula: `${st.intervention.probability} × ${st.intervention.time_s} s` }] };
  }
  for (const slot of st.slots ?? []) {
    if (slot.required && !parts.some((p) => p.role === slot.role)) warnings.push(`${st.name}: required component “${slot.role}” not selected`);
  }
  return { station: st, index, time, basis, lineage, parts, missing, warnings };
}

/**
 * Axis moves defined for the 3D twin are part of the station time (§69: the 3D cycle IS the simulated
 * cycle). Station `time_s` is then the non-motion time; motion time is CALCULATED from the axis model.
 */
function addMotion(rs: ResolvedStation, moves: PlannedMove[], axes: AxisModel[]): ResolvedStation {
  if (!moves.length) return rs;
  const missing = [...new Set(moves.flatMap((m) => m.perAxis.filter((p) => p.time == null).map((p) => axes.find((a) => a.key === p.axis)?.missing.join(', ') || `axis ${p.axis}: speed / acceleration`)))];
  const warnings = [...rs.warnings, ...moves.flatMap((m) => m.limitViolations)];
  if (missing.length) return { ...rs, missing: [...rs.missing, ...missing], warnings };
  if (rs.time == null) return { ...rs, warnings };
  const motion = moves.reduce((n, m) => n + (m.time ?? 0), 0);
  const children: Lineage[] = moves.map((m) => ({ label: m.label, value: m.time, unit: 's', basis: 'CALCULATED', formula: 'slowest axis of the move · trapezoidal profile (distance, speed, acceleration)', children: m.perAxis.map((p) => { const ax = axes.find((a) => a.key === p.axis); return { label: `${ax?.name ?? p.axis}: ${fmtNum(Math.abs(p.dist), 6)} mm`, value: p.time, unit: 's', basis: ax?.basis ?? 'ASSUMPTION', source: ax ? `${ax.sources.speed}; ${ax.sources.accel}` : undefined }; }) }));
  return {
    ...rs,
    time: rs.time + motion,
    warnings,
    lineage: { label: `${rs.station.name} incl. axis motion`, value: rs.time + motion, unit: 's', formula: 'station time + Σ axis moves', basis: 'MIXED', children: [rs.lineage, { label: 'Axis motion', value: motion, unit: 's', basis: 'CALCULATED', children }] },
  };
}

export function resolveScenario(sim: Simulation & AnyRecord, byId: Map<string, AnyRecord>, defs: SpecDefs): Resolved {
  const motion = scenarioMotion(sim, byId, defs);
  const stations = sim.stations.map((s, i) => addMotion(resolveStation(s, i, sim, byId, defs), motion.plan.filter((m) => m.stationKey === s.key), motion.axes));
  const machineParts = (sim.selections ?? [])
    .filter((s: Selection) => s.station_key === '_machine')
    .map((s) => ({ role: s.role, part: byId.get(s.part_id) as Part & AnyRecord, qty: s.quantity ?? 1 }))
    .filter((x) => !!x.part);
  const blocking = stations.flatMap((s) => s.missing);
  const warnings = stations.flatMap((s) => s.warnings);
  for (const s of sim.selections ?? []) if (!byId.has(s.part_id)) warnings.push(`Selected component ${s.part_id} (${s.role}) is not in the database`);
  return { sim, layout: sim.layout ?? 'inline', stations, machineParts, blocking, warnings, runnable: blocking.length === 0 };
}

/** One sentence the Studio shows when a run is impossible (§163: "Simulation cannot run because …"). */
export function cannotRun(r: Resolved): string | null {
  if (r.runnable) return null;
  const first = r.blocking[0];
  return `Simulation cannot run because ${first.replace(/: /, ' — ')} is missing${r.blocking.length > 1 ? ` (and ${r.blocking.length - 1} more input${r.blocking.length > 2 ? 's' : ''})` : ''}.`;
}

/* ---------------------------------------------------------------- random numbers (seeded, reproducible) */

export function rng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sample a station time around its mean. A fixed or missing distribution returns the mean. */
export function sampler(mean: number, dist: Distribution | undefined, r: () => number): () => number {
  if (!dist || dist.type === 'fixed') return () => mean;
  if (dist.type === 'uniform') {
    const lo = dist.min ?? mean * 0.9;
    const hi = dist.max ?? mean * 1.1;
    return () => lo + (hi - lo) * r();
  }
  if (dist.type === 'triangular') {
    const a = dist.min ?? mean * 0.9;
    const b = dist.max ?? mean * 1.2;
    const c = Math.min(b, Math.max(a, dist.mode ?? mean));
    const fc = (c - a) / (b - a || 1);
    return () => {
      const u = r();
      return u < fc ? a + Math.sqrt(u * (b - a) * (c - a)) : b - Math.sqrt((1 - u) * (b - a) * (b - c));
    };
  }
  const sd = dist.sd ?? mean * 0.05;
  return () => {
    // Box–Muller, truncated at 0
    const u = Math.max(1e-12, r());
    const v = r();
    return Math.max(0, mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v));
  };
}

/** Mean of a distribution given the station's nominal time (triangular mean differs from its mode). */
export function distMean(mean: number, dist?: Distribution): number {
  if (!dist || dist.type === 'fixed' || dist.type === 'normal') return mean;
  if (dist.type === 'uniform') return ((dist.min ?? mean * 0.9) + (dist.max ?? mean * 1.1)) / 2;
  return ((dist.min ?? mean * 0.9) + (dist.max ?? mean * 1.2) + (dist.mode ?? mean)) / 3;
}

/** Coefficient of variation of a station's time (for the bottleneck "highest variability" evidence). */
export function distCv(mean: number, dist?: Distribution): number {
  if (!dist || dist.type === 'fixed' || mean <= 0) return 0;
  if (dist.type === 'normal') return (dist.sd ?? mean * 0.05) / mean;
  if (dist.type === 'uniform') {
    const lo = dist.min ?? mean * 0.9;
    const hi = dist.max ?? mean * 1.1;
    return (hi - lo) / Math.sqrt(12) / distMean(mean, dist);
  }
  const a = dist.min ?? mean * 0.9;
  const b = dist.max ?? mean * 1.2;
  const c = dist.mode ?? mean;
  return Math.sqrt((a * a + b * b + c * c - a * b - a * c - b * c) / 18) / distMean(mean, dist);
}
