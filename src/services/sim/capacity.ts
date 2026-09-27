import { fmtNum } from '../../calculations/units';
import type { Simulation } from '../../domain/engineering';
import { distCv, distMean, type Lineage, type Resolved, type ResolvedStation } from './model';

/*
 * CYCLE TIME, CAPACITY, OEE AND STATIC BOTTLENECK (master prompt §65–§67, §141).
 * Deterministic, explainable steady-state formulas. Queues, blocking and variability are measured by
 * the discrete-event simulation (des.ts); this module is what a spreadsheet would say — shown
 * side by side so the difference is visible.
 */

export interface StationLoad {
  rs: ResolvedStation;
  /** mean seconds per part at one server (distribution mean) */
  mean: number;
  /** effective seconds per part for the station (mean ÷ parallel servers) */
  effective: number;
  utilization: number;
  cv: number;
  availability: number | null;
}

export interface CycleResult {
  layout: 'inline' | 'sequential';
  loads: StationLoad[];
  /** seconds per good-or-bad part leaving the line at full speed */
  cycle: number;
  /** time one part spends being processed (sum of station means) */
  throughputTime: number;
  bottleneck: StationLoad;
  theoreticalUph: number;
  availability: { value: number; basis: string };
  performance: { value: number; basis: string };
  quality: { value: number; basis: string };
  oee: number;
  practicalUph: number;
  lineage: Lineage;
}

const pct = (x: number) => `${fmtNum(x * 100, 3)} %`;

/** Station availability from MTBF / MTTR (minutes). */
export const stationAvailability = (mtbf?: number | null, mttr?: number | null) => (mtbf && mttr != null ? mtbf / (mtbf + mttr) : null);

/** Fraction of scheduled time lost to preventive maintenance and calibration. */
export function plannedMaintenanceLoss(sim: Simulation): { value: number; parts: string[] } {
  const m = sim.maintenance ?? {};
  const parts: string[] = [];
  let loss = 0;
  if (m.pm_interval_h && m.pm_duration_min) {
    const l = m.pm_duration_min / (m.pm_interval_h * 60);
    loss += l;
    parts.push(`PM ${m.pm_duration_min} min every ${m.pm_interval_h} h (${pct(l)})`);
  }
  if (m.calibration_interval_h && m.calibration_duration_min) {
    const l = m.calibration_duration_min / (m.calibration_interval_h * 60);
    loss += l;
    parts.push(`Calibration ${m.calibration_duration_min} min every ${m.calibration_interval_h} h (${pct(l)})`);
  }
  return { value: loss, parts };
}

export function cycleTime(r: Resolved): CycleResult | null {
  if (!r.runnable) return null;
  const sim = r.sim;
  const loads: StationLoad[] = r.stations.map((rs) => {
    const mean = distMean(rs.time!, rs.station.dist);
    const par = r.layout === 'sequential' ? 1 : rs.station.parallel ?? 1;
    return { rs, mean, effective: mean / par, utilization: 0, cv: distCv(rs.time!, rs.station.dist), availability: stationAvailability(rs.station.mtbf_min, rs.station.mttr_min) };
  });
  const throughputTime = loads.reduce((s, l) => s + l.mean, 0);
  const cycle = r.layout === 'sequential' ? throughputTime : Math.max(...loads.map((l) => l.effective));
  for (const l of loads) l.utilization = r.layout === 'sequential' ? l.mean / throughputTime : l.effective / cycle;
  const bottleneck = r.layout === 'sequential' ? [...loads].sort((a, b) => b.mean - a.mean)[0] : [...loads].sort((a, b) => b.effective - a.effective)[0];
  const theoreticalUph = 3600 / cycle;

  // Availability: entered assumption wins; otherwise stations' MTBF/MTTR (serial, no buffers: product — pessimistic) × planned-maintenance loss
  const pm = plannedMaintenanceLoss(sim);
  const stationA = loads.filter((l) => l.availability != null);
  const availability = sim.oee?.availability != null
    ? { value: sim.oee.availability, basis: 'Entered assumption' }
    : stationA.length
      ? { value: stationA.reduce((p, l) => p * l.availability!, 1) * (1 - pm.value), basis: `Π station MTBF/(MTBF+MTTR) (${stationA.length} stations with data; serial approximation — buffers improve it)${pm.parts.length ? ` × (1 − ${pm.parts.join(' + ')})` : ''}` }
      : pm.value
        ? { value: 1 - pm.value, basis: `No failure data — planned maintenance only (${pm.parts.join(' + ')})` }
        : { value: 1, basis: 'No availability data entered — 100 % assumed; enter MTBF/MTTR or an availability assumption' };
  const performance = sim.oee?.performance != null ? { value: sim.oee.performance, basis: 'Entered assumption' } : { value: 1, basis: 'Not entered — 100 % (ideal speed) assumed' };
  const rejectYield = loads.reduce((p, l) => p * (1 - (l.rs.station.reject_rate ?? 0) * (1 - (l.rs.station.rework_rate ?? 0))), 1);
  const quality = sim.oee?.quality != null ? { value: sim.oee.quality, basis: 'Entered assumption' } : { value: rejectYield, basis: loads.some((l) => l.rs.station.reject_rate) ? 'Π (1 − reject rate × (1 − rework share)) over stations' : 'No reject rates entered — 100 % assumed' };
  const oee = availability.value * performance.value * quality.value;
  const practicalUph = theoreticalUph * oee;

  const stationLineage = (l: StationLoad): Lineage => ({
    label: `${l.rs.station.name}${(l.rs.station.parallel ?? 1) > 1 && r.layout === 'inline' ? ` (÷ ${l.rs.station.parallel} parallel)` : ''}`,
    value: r.layout === 'inline' ? l.effective : l.mean,
    unit: 's',
    formula: l.rs.station.dist && l.rs.station.dist.type !== 'fixed' && l.rs.station.dist.type !== 'normal' ? `mean of ${l.rs.station.dist.type} distribution${r.layout === 'inline' && (l.rs.station.parallel ?? 1) > 1 ? ' ÷ parallel servers' : ''}` : r.layout === 'inline' && (l.rs.station.parallel ?? 1) > 1 ? 'time ÷ parallel servers' : undefined,
    basis: l.rs.basis,
    children: [l.rs.lineage],
  });
  const cycleLineage: Lineage =
    r.layout === 'sequential'
      ? { label: 'Cycle time (sequential machine)', value: cycle, unit: 's', formula: 'Σ station times (one part in the machine at a time)', basis: 'CALCULATED', children: loads.map(stationLineage) }
      : { label: 'Cycle time (inline line)', value: cycle, unit: 's', formula: `max(station time ÷ parallel) — bottleneck: ${bottleneck.rs.station.name}`, basis: 'CALCULATED', children: loads.map(stationLineage) };
  const lineage: Lineage = {
    label: 'Practical UPH',
    value: practicalUph,
    unit: 'parts/h',
    formula: 'Theoretical UPH × Availability × Performance × Quality',
    basis: 'CALCULATED',
    children: [
      { label: 'Theoretical UPH', value: theoreticalUph, unit: 'parts/h', formula: '3600 ÷ cycle time', basis: 'CALCULATED', children: [cycleLineage] },
      { label: 'Availability', value: availability.value, unit: '', basis: sim.oee?.availability != null ? 'ASSUMPTION' : 'CALCULATED', source: availability.basis },
      { label: 'Performance', value: performance.value, unit: '', basis: 'ASSUMPTION', source: performance.basis },
      { label: 'Quality', value: quality.value, unit: '', basis: sim.oee?.quality != null ? 'ASSUMPTION' : 'CALCULATED', source: quality.basis },
    ],
  };
  return { layout: r.layout, loads, cycle, throughputTime, bottleneck, theoreticalUph, availability, performance, quality, oee, practicalUph, lineage };
}

/* ---------------------------------------------------------------- capacity (§67) */

export interface CapacityResult {
  scheduledHoursPerYear: number | null;
  productiveHoursPerYear: number | null;
  theoreticalPerHour: number;
  practicalPerHour: number;
  annualCapacity: number | null;
  targetUph: number | null;
  targetAnnual: number | null;
  capacityGapUph: number | null;
  capacityGapAnnual: number | null;
  machinesRequired: number | null;
  notes: string[];
  lineage: Lineage;
}

export function capacity(sim: Simulation, c: CycleResult): CapacityResult {
  const s = sim.shift;
  const notes: string[] = [];
  const scheduled = s ? s.hours_per_shift * s.shifts_per_day * s.days_per_year : null;
  const plannedDown = s?.planned_downtime_min_per_shift ? (s.planned_downtime_min_per_shift / 60) * s.shifts_per_day * s.days_per_year : 0;
  if (!s) notes.push('No shift pattern entered — annual capacity is Not Available');
  if (plannedDown) notes.push(`Planned downtime ${s!.planned_downtime_min_per_shift} min per shift removed from scheduled time`);
  const productive = scheduled != null ? scheduled - plannedDown : null;
  const annual = productive != null ? c.practicalUph * productive : null;
  const targetUph = sim.targets?.uph ?? (sim.targets?.annual_units && productive ? sim.targets.annual_units / productive : null);
  const targetAnnual = sim.targets?.annual_units ?? (sim.targets?.uph && productive ? sim.targets.uph * productive : null);
  const gapUph = targetUph != null ? c.practicalUph - targetUph : null;
  const machines = targetUph != null ? Math.ceil(targetUph / c.practicalUph - 1e-9) : null;
  if (targetUph == null) notes.push('No target UPH or annual volume — capacity gap and machine count are Not Available');
  return {
    scheduledHoursPerYear: scheduled,
    productiveHoursPerYear: productive,
    theoreticalPerHour: c.theoreticalUph,
    practicalPerHour: c.practicalUph,
    annualCapacity: annual,
    targetUph,
    targetAnnual,
    capacityGapUph: gapUph,
    capacityGapAnnual: annual != null && targetAnnual != null ? annual - targetAnnual : null,
    machinesRequired: machines,
    notes,
    lineage: {
      label: 'Annual capacity',
      value: annual,
      unit: 'parts/year',
      formula: 'Practical UPH × (hours/shift × shifts/day × days/year − planned downtime)',
      basis: 'CALCULATED',
      children: [c.lineage, { label: 'Productive hours per year', value: productive, unit: 'h', basis: s ? 'USER_INPUT' : 'ASSUMPTION', source: s ? `${s.hours_per_shift} h × ${s.shifts_per_day} × ${s.days_per_year} d − ${fmtNum(plannedDown)} h` : 'Not entered' }],
    },
  };
}

/* ---------------------------------------------------------------- bottleneck evidence (§66) */

export interface BottleneckEvidence {
  station: string;
  key: string;
  reasons: string[];
  rank: number;
}
export interface DesStationStats {
  key: string;
  utilization: number;
  blocked: number;
  starved: number;
  down: number;
  avgQueue: number;
}

/** Combines the static load with DES measurements (when given). Every claim cites its number. */
export function bottleneckEvidence(c: CycleResult, des?: DesStationStats[]): BottleneckEvidence[] {
  const byKey = new Map(des?.map((d) => [d.key, d]));
  const maxEff = Math.max(...c.loads.map((l) => l.effective));
  const maxCv = Math.max(...c.loads.map((l) => l.cv));
  const maxQ = des ? Math.max(...des.map((d) => d.avgQueue)) : 0;
  const maxU = des ? Math.max(...des.map((d) => d.utilization + d.down)) : 0;
  const out = c.loads.map((l, i) => {
    const d = byKey.get(l.rs.station.key);
    const reasons: string[] = [];
    if (l.effective === maxEff) reasons.push(`Lowest capacity: ${fmtNum(l.effective)} s per part effective (${fmtNum(3600 / l.effective)} UPH)`);
    if (l.cv > 0 && l.cv === maxCv) reasons.push(`Highest variability: CV ${fmtNum(l.cv * 100, 3)} %`);
    if (d && maxU > 0 && d.utilization + d.down === maxU) reasons.push(`Busiest in simulation: ${pct(d.utilization)} busy${d.down > 0.001 ? ` + ${pct(d.down)} down` : ''}`);
    if (d && d.avgQueue > 0.05 && d.avgQueue === maxQ) reasons.push(`Largest queue in front: ${fmtNum(d.avgQueue, 3)} parts on average`);
    const prev = des && i > 0 ? byKey.get(c.loads[i - 1].rs.station.key) : undefined;
    if (prev && prev.blocked > 0.05) reasons.push(`Blocks the station before it (${c.loads[i - 1].rs.station.name} blocked ${pct(prev.blocked)} of the time)`);
    const next = des && i < c.loads.length - 1 ? byKey.get(c.loads[i + 1].rs.station.key) : undefined;
    if (next && next.starved > 0.2 && l.effective === maxEff) reasons.push(`Starves the station after it (${c.loads[i + 1].rs.station.name} starved ${pct(next.starved)})`);
    return { station: l.rs.station.name, key: l.rs.station.key, reasons, rank: 0 };
  });
  return out
    .filter((o) => o.reasons.length)
    .sort((a, b) => b.reasons.length - a.reasons.length)
    .map((o, i) => ({ ...o, rank: i + 1 }));
}
