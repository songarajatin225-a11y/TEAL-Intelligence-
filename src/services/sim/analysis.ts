import type { FxRate } from '../../calculations/cost';
import type { AnyRecord } from '../../domain';
import type { LaserProcess, Part, Simulation } from '../../domain/engineering';
import type { SpecDefs } from '../eng/specs';
import { readSpec } from '../eng/specs';
import { buildBom } from './bom';
import { capacity, cycleTime, type CycleResult } from './capacity';
import { runDes } from './des';
import { resolveScenario, type Resolved } from './model';
import { originOf, selectedParts } from './supply';

/*
 * MONTE CARLO, WHAT-IF, SCENARIO COMPARISON, OPTIMIZATION, ENERGY, MAINTENANCE, FAULTS, CALIBRATION
 * (master prompt §68–§71, §75–§77, §84, §146, §174). Every output lists its assumptions; nothing
 * declares an overall winner.
 */

/* ---------------------------------------------------------------- Monte Carlo (§68) */

export interface McOptions {
  iterations: number;
  horizon_s: number;
  failures: boolean;
  seed0?: number;
}
export interface McSummary {
  n: number;
  uph: number[];
  /** effective seconds per good part in each run (3600 ÷ UPH) */
  cycle: number[];
  percentiles: { p: 'P50' | 'P90' | 'P95' | 'P99'; uph: number; cycle: number }[];
  mean: number;
  probMeetTarget: number | null;
  target: number | null;
  histogram: { from: number; to: number; count: number }[];
  assumptions: string[];
}

/** Run iterations [from, to) — call repeatedly for progress. Each iteration is one DES run with its own seed. */
export function monteCarloChunk(res: Resolved, o: McOptions, from: number, to: number): number[] {
  const out: number[] = [];
  for (let k = from; k < to; k++) out.push(runDes(res, { horizon_s: o.horizon_s, warmup_s: Math.min(600, o.horizon_s * 0.1), seed: (o.seed0 ?? 1000) + k, failures: o.failures }).uph);
  return out;
}

const quant = (sorted: number[], q: number) => {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
};

export function summarizeMc(uph: number[], target: number | null, o: McOptions): McSummary {
  const s = [...uph].sort((a, b) => a - b);
  const cycle = uph.map((u) => (u > 0 ? 3600 / u : Infinity));
  const cs = [...cycle].sort((a, b) => a - b);
  const ps = [0.5, 0.9, 0.95, 0.99] as const;
  const bins = 20;
  const lo = s[0] ?? 0;
  const hi = s[s.length - 1] ?? 0;
  const w = (hi - lo) / bins || 1;
  const histogram = Array.from({ length: bins }, (_, i) => ({ from: lo + i * w, to: lo + (i + 1) * w, count: 0 }));
  for (const u of s) histogram[Math.min(bins - 1, Math.floor((u - lo) / w))].count++;
  return {
    n: uph.length,
    uph,
    cycle,
    // UPH Px = level met or exceeded in x % of runs (lower tail); cycle Px = level not exceeded in x % of runs
    percentiles: ps.map((q) => ({ p: `P${Math.round(q * 100)}` as McSummary['percentiles'][number]['p'], uph: quant(s, 1 - q), cycle: quant(cs, q) })),
    mean: uph.reduce((a, b) => a + b, 0) / (uph.length || 1),
    probMeetTarget: target != null ? uph.filter((u) => u >= target).length / (uph.length || 1) : null,
    target,
    histogram,
    assumptions: [
      `Each iteration is one discrete-event run of ${(o.horizon_s / 3600).toFixed(2)} h with its own random seed (warm-up excluded)`,
      'Station times are drawn from each station’s entered distribution; stations without a distribution use their mean every time',
      o.failures ? 'Random failures use each station’s MTBF/MTTR (exponential); stations without MTBF/MTTR never fail' : 'Random failures are OFF',
      'UPH Px = throughput reached or exceeded in x % of runs; cycle Px = effective seconds per good part not exceeded in x % of runs',
      'Model output, not a factory measurement — compare with POC data (Calibration) before relying on it',
    ],
  };
}

/* ---------------------------------------------------------------- what-if (§69) */

export interface WhatIf {
  stationTimes?: Record<string, number>;
  parallel?: Record<string, number>;
  buffers?: Record<string, number>;
  laser?: Partial<LaserProcess>;
  availability?: number | null;
  performance?: number | null;
  quality?: number | null;
  swaps?: { station_key: string; role: string; part_id: string }[];
  operators?: Record<string, number>;
}

/** A copy of the scenario with the what-if applied — the original is never changed. */
export function applyWhatIf(sim: Simulation & AnyRecord, w: WhatIf): Simulation & AnyRecord {
  const stations = sim.stations.map((s) => {
    let st = { ...s };
    if (w.stationTimes?.[s.key] != null) st = { ...st, time_s: w.stationTimes[s.key], time_basis: 'USER_INPUT', laser: s.kind === 'laser' ? undefined : st.laser };
    if (w.parallel?.[s.key] != null) st = { ...st, parallel: w.parallel[s.key] };
    if (w.operators?.[s.key] != null && s.operator) st = { ...st, parallel: w.operators[s.key] };
    if (w.buffers?.[s.key] != null) st = { ...st, buffer_after: w.buffers[s.key] };
    if (w.laser && s.kind === 'laser' && st.laser) st = { ...st, laser: { ...st.laser, ...Object.fromEntries(Object.entries(w.laser).filter(([, v]) => v != null)) } };
    return st;
  });
  let selections = sim.selections ?? [];
  for (const sw of w.swaps ?? []) selections = selections.map((x) => (x.station_key === sw.station_key && x.role === sw.role ? { ...x, part_id: sw.part_id } : x));
  const oee = { ...(sim.oee ?? {}) };
  if (w.availability !== undefined) oee.availability = w.availability;
  if (w.performance !== undefined) oee.performance = w.performance;
  if (w.quality !== undefined) oee.quality = w.quality;
  return { ...sim, stations, selections, oee };
}

/* ---------------------------------------------------------------- scenario metrics + comparison (§70, §146) */

export interface ScenarioMetrics {
  id: string;
  name: string;
  label: string;
  runnable: boolean;
  blocking: string[];
  cycle: number | null;
  theoreticalUph: number | null;
  practicalUph: number | null;
  bottleneck: string | null;
  bottleneckUtilization: number | null;
  capex: number | null;
  currency: string;
  bomLines: number;
  footprint: number | null;
  risks: number;
  singleSource: number;
  manufacturers: number;
  localization: number | null;
  energyKwhPerPart: number | null;
  maxLeadTimeWeeks: number | null;
  meetsTarget: boolean | null;
}

export function scenarioMetrics(sim: Simulation & AnyRecord, byId: Map<string, AnyRecord>, defs: SpecDefs, fx: Record<string, FxRate>, extra?: { risks?: number; singleSource?: number }): ScenarioMetrics {
  const res = resolveScenario(sim, byId, defs);
  const c = cycleTime(res);
  const bom = buildBom(res, byId, fx);
  const sp = selectedParts(res);
  const foot = sim.stations.every((s) => s.footprint_m2 != null) ? sim.stations.reduce((a, s) => a + (s.footprint_m2 ?? 0), 0) : null;
  const e = c ? energyModel(res, c, defs) : null;
  const leads = bom.items.map((i) => i.leadTimeWeeks).filter((x): x is number => x != null);
  return {
    id: sim.id,
    name: sim.name,
    label: sim.scenario_label ?? sim.name,
    runnable: res.runnable,
    blocking: res.blocking,
    cycle: c?.cycle ?? null,
    theoreticalUph: c?.theoreticalUph ?? null,
    practicalUph: c?.practicalUph ?? null,
    bottleneck: c?.bottleneck.rs.station.name ?? null,
    bottleneckUtilization: c && sim.targets?.uph ? sim.targets.uph / c.practicalUph : null,
    capex: bom.total,
    currency: bom.currency,
    bomLines: bom.items.filter((i) => i.level === 'Component').length,
    footprint: foot,
    risks: extra?.risks ?? res.warnings.length,
    singleSource: extra?.singleSource ?? 0,
    manufacturers: new Set(sp.map((x) => x.part.manufacturer_id ?? x.part.brand ?? '?')).size,
    localization: bom.localShare,
    energyKwhPerPart: e?.kwhPerPart ?? null,
    maxLeadTimeWeeks: leads.length ? Math.max(...leads) : null,
    meetsTarget: c && sim.targets?.uph ? c.practicalUph >= sim.targets.uph : null,
  };
}

/* ---------------------------------------------------------------- optimization / Pareto (§71) */

export interface Constraints {
  minUph?: number | null;
  maxCapex?: number | null;
  maxFootprint?: number | null;
  maxCycle?: number | null;
  minLocalization?: number | null;
  maxUtilization?: number | null;
}
export interface Candidate {
  key: string;
  parallel: Record<string, number>;
  laserPartId?: string;
  uph: number;
  cycle: number;
  capex: number | null;
  localization: number | null;
  utilization: number | null;
  feasible: boolean;
  violations: string[];
  pareto: boolean;
}
export interface OptimizeResult {
  candidates: Candidate[];
  feasible: Candidate[];
  frontier: Candidate[];
  variables: string[];
  assumptions: string[];
}

/**
 * Enumerate configurations (parallel stations for the slowest stations × alternative laser sources),
 * evaluate each with the capacity and cost engines, keep the constraint-feasible ones and mark the
 * Pareto frontier on (UPH ↑, CAPEX ↓). No configuration is selected automatically.
 */
export function optimize(sim: Simulation & AnyRecord, byId: Map<string, AnyRecord>, defs: SpecDefs, fx: Record<string, FxRate>, cons: Constraints, opts: { maxParallel?: number; laserAlternatives?: string[] } = {}): OptimizeResult {
  const base = resolveScenario(sim, byId, defs);
  const bc = cycleTime(base);
  if (!bc) return { candidates: [], feasible: [], frontier: [], variables: [], assumptions: ['Scenario is not runnable — resolve missing inputs first'] };
  const maxP = opts.maxParallel ?? 3;
  const slow = [...bc.loads].sort((a, b) => b.effective - a.effective).slice(0, 3).map((l) => l.rs.station.key);
  const laserSel = (sim.selections ?? []).find((s) => s.role === 'Laser source');
  const lasers = laserSel ? [laserSel.part_id, ...(opts.laserAlternatives ?? []).filter((x) => x !== laserSel.part_id)] : [undefined];
  const combos: Record<string, number>[] = [{}];
  for (const k of slow) {
    const next: Record<string, number>[] = [];
    for (const c of combos) for (let p = 1; p <= maxP; p++) next.push({ ...c, [k]: p });
    combos.splice(0, combos.length, ...next);
  }
  const candidates: Candidate[] = [];
  for (const par of combos) {
    for (const laser of lasers) {
      let s = applyWhatIf(sim, { parallel: par, swaps: laser && laserSel ? [{ station_key: laserSel.station_key, role: 'Laser source', part_id: laser }] : [] });
      // a parallel station needs one set of its components per server
      s = { ...s, selections: (s.selections ?? []).map((x) => (par[x.station_key] != null && x.station_key !== '_machine' && x.role !== 'Fume extraction' ? { ...x, quantity: par[x.station_key] } : x)) };
      // parallel stations add their fabrication cost too
      s = { ...s, stations: s.stations.map((st) => (par[st.key] && st.capex != null ? { ...st, capex: st.capex * par[st.key] } : st)) };
      const res = resolveScenario(s, byId, defs);
      const c = cycleTime(res)!;
      const bom = buildBom(res, byId, fx);
      const util = cons.minUph ? cons.minUph / c.practicalUph : null;
      const violations: string[] = [];
      if (cons.minUph != null && c.practicalUph < cons.minUph) violations.push(`UPH ${c.practicalUph.toFixed(0)} < ${cons.minUph}`);
      if (cons.maxCapex != null && (bom.total == null || bom.total > cons.maxCapex)) violations.push(bom.total == null ? 'CAPEX unknown' : `CAPEX ${Math.round(bom.total).toLocaleString('en-IN')} > ${cons.maxCapex.toLocaleString('en-IN')}`);
      if (cons.maxCycle != null && c.cycle > cons.maxCycle) violations.push(`Cycle ${c.cycle.toFixed(2)} s > ${cons.maxCycle} s`);
      if (cons.minLocalization != null && (bom.localShare == null || bom.localShare * 100 < cons.minLocalization)) violations.push(bom.localShare == null ? 'Localization unknown' : `Localization ${(bom.localShare * 100).toFixed(0)} % < ${cons.minLocalization} %`);
      if (cons.maxUtilization != null && util != null && util * 100 > cons.maxUtilization) violations.push(`Utilization at target ${(util * 100).toFixed(0)} % > ${cons.maxUtilization} %`);
      if (cons.maxFootprint != null) {
        const f = s.stations.every((x) => x.footprint_m2 != null) ? s.stations.reduce((a, x) => a + (x.footprint_m2 ?? 0) * (par[x.key] ?? 1), 0) : null;
        if (f == null || f > cons.maxFootprint) violations.push(f == null ? 'Footprint unknown (enter station footprints)' : `Footprint ${f} m² > ${cons.maxFootprint} m²`);
      }
      candidates.push({ key: `${Object.entries(par).map(([k, v]) => `${k}×${v}`).join(' ')}${laser ? ` · ${(byId.get(laser) as Part | undefined)?.model_number ?? laser}` : ''}`, parallel: par, laserPartId: laser, uph: c.practicalUph, cycle: c.cycle, capex: bom.total, localization: bom.localShare, utilization: util, feasible: violations.length === 0, violations, pareto: false });
    }
  }
  const feasible = candidates.filter((c) => c.feasible && c.capex != null);
  for (const c of feasible) c.pareto = !feasible.some((o) => o !== c && o.uph >= c.uph && o.capex! <= c.capex! && (o.uph > c.uph || o.capex! < c.capex!));
  return {
    candidates,
    feasible,
    frontier: feasible.filter((c) => c.pareto).sort((a, b) => a.capex! - b.capex!),
    variables: [...slow.map((k) => `${sim.stations.find((s) => s.key === k)!.name}: 1–${maxP} parallel`), ...(lasers.length > 1 ? [`Laser source: ${lasers.length} options`] : [])],
    assumptions: [
      'Parallel stations multiply that station’s components and fabrication cost; other stations are unchanged',
      'Alternative laser sources change cost, localization and energy — not process speed (enter the speed your process window supports)',
      'UPH is the steady-state practical UPH (capacity engine); confirm the chosen point with a discrete-event and Monte Carlo run',
      'Pareto frontier: no other feasible option has both higher UPH and lower CAPEX. The choice between frontier points is an engineering decision',
    ],
  };
}

/* ---------------------------------------------------------------- energy (§77) */

export interface EnergyRow {
  consumer: string;
  kw: number;
  mode: 'per process time' | 'continuous';
  seconds: number;
  kwh: number;
  basis: string;
}
export interface EnergyResult {
  rows: EnergyRow[];
  missing: string[];
  kwhPerCycle: number;
  kwhPerPart: number;
  annualKwh: number | null;
  annualCost: number | null;
  assumptions: string[];
}
const CONTINUOUS = new Set(['chiller', 'fume_extraction', 'plc', 'hmi', 'ipc', 'safety_plc', 'vision_controller', 'smps', 'conveyor', 'galvo_controller']);

export function energyModel(res: Resolved, c: CycleResult, defs: SpecDefs, annualUnits?: number | null): EnergyResult {
  const rows: EnergyRow[] = [];
  const missing: string[] = [];
  const idle = res.sim.energy?.idle_fraction ?? 0;
  for (const l of c.loads) {
    const st = l.rs.station;
    const par = res.layout === 'inline' ? st.parallel ?? 1 : 1;
    if (st.power_kw != null) {
      rows.push({ consumer: `${st.name} (station)`, kw: st.power_kw * par, mode: 'per process time', seconds: l.mean, kwh: (st.power_kw * par * (l.mean + idle * Math.max(0, c.cycle * par - l.mean))) / 3600 / par, basis: `Station input ${st.power_kw} kW` });
    }
    for (const p of l.rs.parts) {
      const w = readSpec(p.part, 'power_consumption', defs)?.value ?? readSpec(p.part, 'input_power', defs)?.value ?? null;
      if (w == null) {
        missing.push(`${p.role} (${p.part.model_number}) — no power specification`);
        continue;
      }
      const kw = (w / 1000) * p.qty;
      const cont = CONTINUOUS.has(p.part.product_type);
      const secs = cont ? c.cycle : l.mean;
      const kwh = cont ? (kw * c.cycle) / 3600 : (kw * (l.mean + idle * Math.max(0, c.cycle * par - l.mean))) / 3600 / par;
      rows.push({ consumer: `${p.role} — ${p.part.model_number}`, kw, mode: cont ? 'continuous' : 'per process time', seconds: secs, kwh, basis: `power consumption ${w} W (${p.part.data_type === 'DEMO' ? 'DEMO datasheet' : 'datasheet'})` });
    }
  }
  for (const p of res.machineParts) {
    const w = readSpec(p.part, 'power_consumption', defs)?.value ?? null;
    if (w == null) {
      if (['plc', 'hmi', 'ipc', 'safety_plc', 'smps'].includes(p.part.product_type)) missing.push(`${p.role} (${p.part.model_number}) — no power specification`);
      continue;
    }
    const kw = (w / 1000) * p.qty;
    rows.push({ consumer: `${p.role} — ${p.part.model_number}`, kw, mode: 'continuous', seconds: c.cycle, kwh: (kw * c.cycle) / 3600, basis: `power consumption ${w} W` });
  }
  const air = res.sim.energy?.compressed_air_kw;
  if (air != null) rows.push({ consumer: 'Compressed air (equivalent electrical)', kw: air, mode: 'continuous', seconds: c.cycle, kwh: (air * c.cycle) / 3600, basis: 'Scenario input' });
  const perCycle = rows.reduce((s, r) => s + r.kwh, 0);
  const good = c.quality.value || 1;
  const perPart = perCycle / good;
  const annual = annualUnits != null ? perPart * annualUnits : null;
  const tariff = res.sim.energy?.tariff_per_kwh;
  return {
    rows,
    missing,
    kwhPerCycle: perCycle,
    kwhPerPart: perPart,
    annualKwh: annual,
    annualCost: annual != null && tariff != null ? annual * tariff : null,
    assumptions: [
      'ESTIMATE from rated / typical power consumption — not a measurement',
      'Process consumers draw full power while processing and the idle fraction of power while waiting',
      'Continuous consumers (chiller, extraction, controls, conveyor) run for the whole cycle',
      `Idle fraction ${idle} (scenario input); kWh per good part = kWh per cycle ÷ quality`,
      ...(missing.length ? [`${missing.length} consumer(s) without power data are NOT included`] : []),
    ],
  };
}

/* ---------------------------------------------------------------- maintenance (§76) */

export function maintenanceModel(res: Resolved, c: CycleResult) {
  const s = res.sim.shift;
  const hoursPerYear = s ? s.hours_per_shift * s.shifts_per_day * s.days_per_year : null;
  const m = res.sim.maintenance ?? {};
  const rows = c.loads.map((l) => {
    const { mtbf_min, mttr_min } = l.rs.station;
    const failuresPerYear = hoursPerYear && mtbf_min ? (hoursPerYear * 60) / mtbf_min : null;
    return { station: l.rs.station.name, mtbf_min: mtbf_min ?? null, mttr_min: mttr_min ?? null, availability: l.availability, failuresPerYear, repairHoursPerYear: failuresPerYear != null && mttr_min != null ? (failuresPerYear * mttr_min) / 60 : null };
  });
  const pmPerYear = hoursPerYear && m.pm_interval_h ? hoursPerYear / m.pm_interval_h : null;
  const calPerYear = hoursPerYear && m.calibration_interval_h ? hoursPerYear / m.calibration_interval_h : null;
  const pmHours = pmPerYear != null && m.pm_duration_min != null ? (pmPerYear * m.pm_duration_min) / 60 : null;
  const calHours = calPerYear != null && m.calibration_duration_min != null ? (calPerYear * m.calibration_duration_min) / 60 : null;
  const repairHours = rows.reduce((a, r) => a + (r.repairHoursPerYear ?? 0), 0);
  return {
    rows,
    pmPerYear,
    pmHours,
    calPerYear,
    calHours,
    repairHours,
    burdenHours: (pmHours ?? 0) + (calHours ?? 0) + repairHours,
    availability: c.availability,
    downtimeImpactUnits: hoursPerYear != null ? ((pmHours ?? 0) + (calHours ?? 0) + repairHours) * c.theoreticalUph : null,
    notes: [
      rows.some((r) => r.mtbf_min == null) ? 'Stations without MTBF/MTTR are treated as never failing — enter field or supplier data' : 'All stations have MTBF/MTTR',
      'Approximate: failures scale with scheduled hours; spares strategy needs failure-mode data (FMEA) — not modelled',
    ],
  };
}

/* ---------------------------------------------------------------- faults (§75) */

export const FAULT_LIBRARY: { key: string; name: string; kinds: string[]; whole?: boolean; minutes: number }[] = [
  { key: 'laser', name: 'Laser unavailable', kinds: ['laser'], minutes: 30 },
  { key: 'vision', name: 'Vision failure', kinds: ['align', 'vision', 'inspect'], minutes: 10 },
  { key: 'servo', name: 'Servo alarm', kinds: ['motion', 'transfer', 'laser'], minutes: 15 },
  { key: 'part', name: 'Part missing', kinds: ['load'], minutes: 5 },
  { key: 'fixture', name: 'Fixture failure', kinds: ['fixture'], minutes: 20 },
  { key: 'chiller', name: 'Chiller alarm', kinds: ['laser'], minutes: 20 },
  { key: 'comm', name: 'Communication timeout', kinds: [], whole: true, minutes: 5 },
  { key: 'door', name: 'Safety door open', kinds: [], whole: true, minutes: 3 },
];

export function faultImpact(res: Resolved, faults: { station_key: string; name: string; at_min: number; duration_min: number }[], horizon_s: number, seed = 11) {
  const faultCases = faults.map((f, i) => ({ key: `f${i}`, ...f }));
  const base = runDes(res, { horizon_s, seed, variability: true });
  const hit = runDes(res, { horizon_s, seed, variability: true, faults: faultCases });
  return {
    baseline: base,
    withFaults: hit,
    lostParts: base.ok - hit.ok,
    lostMinutes: faultCases.reduce((a, f) => a + f.duration_min, 0),
    assumptions: ['Same random seed for both runs, so the difference is the fault', 'Fault durations are scenario inputs (defaults are ASSUMPTIONS) — replace with field data', 'A whole-machine fault stops every station'],
  };
}

/* ---------------------------------------------------------------- calibration (§84, §174) */

export interface CalibrationRow {
  metric: string;
  predicted: number | null;
  actual: number;
  unit: string;
  error: number | null;
  pctError: number | null;
  date: string;
  candidate: boolean;
  suggestion: string | null;
}
export function calibration(sim: Simulation): CalibrationRow[] {
  return (sim.actuals ?? []).map((a) => {
    const err = a.predicted != null ? a.actual - a.predicted : null;
    const pct = a.predicted ? (err! / a.predicted) * 100 : null;
    const candidate = pct != null && Math.abs(pct) > 10;
    return {
      metric: a.metric,
      predicted: a.predicted,
      actual: a.actual,
      unit: a.unit,
      error: err,
      pctError: pct,
      date: a.date,
      candidate,
      suggestion: candidate ? `Model calibration candidate: ${a.metric} differs by ${pct!.toFixed(1)} %. Review the station times and distributions behind it; one measurement does not change the model automatically.` : null,
    };
  });
}

/* ---------------------------------------------------------------- equipment readiness summary */

export function capacitySummary(res: Resolved) {
  const c = cycleTime(res);
  return c ? { c, cap: capacity(res.sim, c) } : null;
}

export function originShare(res: Resolved, byId: Map<string, AnyRecord>) {
  const sp = selectedParts(res);
  const counts = { Local: 0, Imported: 0, Unknown: 0 };
  for (const x of sp) counts[originOf(x.part, byId).origin]++;
  return counts;
}
