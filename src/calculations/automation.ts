import { calc, input, part54, positive, type CalcResult } from './types';

/*
 * Automation / capacity calculations — Automation Equipment Building Handbook Part 4 and
 * Part 54 (K-, N-, P-, E-, M- formulas). Worked-value checks live in tests/unit/automation.test.ts.
 */

/** K1 — planned production time T_plan = T_cal − T_breaks − T_PM − T_changeover → s */
export function plannedTime(p: { calendar_s?: number | null; breaks_s?: number | null; pm_s?: number | null; changeover_s?: number | null }): CalcResult {
  return calc(
    { id: 'planned_time', label: 'Planned production time', formula: 'T_plan = T_cal − T_breaks − T_PM − T_changeover', unit: 's', source: part54('K1', 'performance') },
    [input('Tcal', 'Calendar time', p.calendar_s, 's'), input('Tb', 'Breaks', p.breaks_s ?? 0, 's'), input('Tpm', 'Planned maintenance', p.pm_s ?? 0, 's'), input('Tco', 'Planned changeover', p.changeover_s ?? 0, 's')],
    (v) => v.Tcal - v.Tb - v.Tpm - v.Tco,
  );
}

/** K2 — takt T_takt = t_available / Q_demand → s */
export function takt(p: { available_s?: number | null; demand?: number | null }): CalcResult {
  return calc(
    { id: 'takt', label: 'Takt time', formula: 'T_takt = t_available / Q_demand', unit: 's', source: part54('K2', 'performance'), assumptions: ['Demand in good units'] },
    [input('t', 'Available time', p.available_s, 's'), input('Q', 'Demand (good units)', p.demand, 'units')],
    (v) => v.t / v.Q,
    positive('t', 'Q'),
  );
}

/** K5 — OEE = A·P·Q → fraction */
export function oee(p: { availability?: number | null; performance?: number | null; quality?: number | null }): CalcResult {
  return calc(
    { id: 'oee', label: 'OEE', formula: 'OEE = A·P·Q', unit: '', source: part54('K5', 'performance') },
    [input('A', 'Availability', p.availability, ''), input('P', 'Performance', p.performance, ''), input('Q', 'Quality', p.quality, '')],
    (v) => v.A * v.P * v.Q,
    (v) => (['A', 'P', 'Q'].some((k) => v[k] < 0 || v[k] > 1) ? 'A, P, Q must be fractions between 0 and 1' : null),
  );
}

/** K3 — ideal cycle time CT = T_plan·A·P·Q / N_good → s */
export function idealCycleTime(p: { planned_s?: number | null; oee?: number | null; good_units?: number | null }): CalcResult {
  return calc(
    { id: 'ct_ideal', label: 'Ideal cycle time', formula: 'CT_ideal = T_plan·OEE / N_good', unit: 's', source: part54('K3', 'performance'), assumptions: ['Apply a 10–15 % design margin before sizing motions (Handbook Part 4.5)'] },
    [input('Tplan', 'Planned time', p.planned_s, 's'), input('OEE', 'OEE target', p.oee, ''), input('N', 'Good units required', p.good_units, 'units')],
    (v) => (v.Tplan * v.OEE) / v.N,
    positive('Tplan', 'OEE', 'N'),
  );
}

/** K4 — UPH = 3600 / CT */
export function uph(p: { cycle_s?: number | null }): CalcResult {
  return calc({ id: 'uph', label: 'Units per hour', formula: 'UPH = 3 600 / CT', unit: 'units/h', source: part54('K4', 'performance') }, [input('CT', 'Cycle time', p.cycle_s, 's')], (v) => 3600 / v.CT, positive('CT'));
}

/** Daily good output at a cycle time and OEE → units/day */
export function throughput(p: { cycle_s?: number | null; planned_s?: number | null; oee?: number | null }): CalcResult {
  return calc(
    { id: 'throughput', label: 'Throughput (good units per planned period)', formula: 'TH = T_plan·OEE / CT', unit: 'units', source: part54('K3', 'performance'), assumptions: ['Inverse of K3 for a given cycle time'] },
    [input('CT', 'Cycle time', p.cycle_s, 's'), input('Tplan', 'Planned time', p.planned_s, 's'), input('OEE', 'OEE', p.oee, '')],
    (v) => (v.Tplan * v.OEE) / v.CT,
    positive('CT', 'Tplan', 'OEE'),
  );
}

/** K6 — availability A = MTBF / (MTBF + MTTR) */
export function availabilityFromMtbf(p: { mtbf_h?: number | null; mttr_h?: number | null }): CalcResult {
  return calc(
    { id: 'availability', label: 'Availability', formula: 'A = MTBF / (MTBF + MTTR)', unit: '', source: part54('K6', 'performance') },
    [input('MTBF', 'MTBF', p.mtbf_h, 'h'), input('MTTR', 'MTTR', p.mttr_h, 'h')],
    (v) => v.MTBF / (v.MTBF + v.MTTR),
    positive('MTBF'),
  );
}

/** K7 — minimum stations N = ⌈Σt_i / CT⌉ */
export function minimumStations(p: { operation_times_s?: number[] | null; cycle_s?: number | null }): CalcResult {
  const sum = p.operation_times_s?.length ? p.operation_times_s.reduce((a, b) => a + b, 0) : null;
  return calc(
    { id: 'min_stations', label: 'Minimum stations', formula: 'N = ⌈Σt_i / CT⌉', unit: 'stations', source: part54('K7', 'performance') },
    [input('Σt', 'Sum of operation times', sum, 's'), input('CT', 'Target cycle time', p.cycle_s, 's')],
    (v) => Math.ceil(v['Σt'] / v.CT - 1e-9),
    positive('CT'),
  );
}

/** K8 — balance efficiency η = Σt_i / (N·CT) */
export function balanceEfficiency(p: { operation_times_s?: number[] | null; stations?: number | null; cycle_s?: number | null }): CalcResult {
  const sum = p.operation_times_s?.length ? p.operation_times_s.reduce((a, b) => a + b, 0) : null;
  return calc(
    { id: 'balance_efficiency', label: 'Line balance efficiency', formula: 'η = Σt_i / (N·CT)', unit: '', source: part54('K8', 'performance') },
    [input('Σt', 'Sum of operation times', sum, 's'), input('N', 'Stations', p.stations, ''), input('CT', 'Cycle time', p.cycle_s, 's')],
    (v) => v['Σt'] / (v.N * v.CT),
    positive('N', 'CT'),
  );
}

/** K9 — machines N = ⌈UPH_req / UPH_machine⌉ */
export function machinesRequired(p: { uph_required?: number | null; uph_machine?: number | null }): CalcResult {
  return calc(
    { id: 'machines', label: 'Machines required', formula: 'N = ⌈UPH_req / UPH_machine⌉', unit: 'machines', source: part54('K9', 'performance') },
    [input('Ureq', 'Required UPH', p.uph_required, 'units/h'), input('Um', 'UPH per machine', p.uph_machine, 'units/h')],
    (v) => Math.ceil(v.Ureq / v.Um - 1e-9),
    positive('Ureq', 'Um'),
  );
}

/** K10 — utilization U = demand / capacity */
export function utilization(p: { demand?: number | null; capacity?: number | null }): CalcResult {
  return calc(
    { id: 'utilization', label: 'Utilization', formula: 'U = demand / capacity', unit: '', source: part54('K10', 'performance') },
    [input('D', 'Demand', p.demand, 'units'), input('C', 'Capacity', p.capacity, 'units')],
    (v) => v.D / v.C,
    positive('C'),
  );
}

/** K11 — buffer B = t_stop,max / T_takt */
export function bufferSize(p: { stop_s?: number | null; takt_s?: number | null }): CalcResult {
  return calc(
    { id: 'buffer', label: 'Buffer size', formula: 'B = t_stop,max / T_takt', unit: 'parts', source: part54('K11', 'performance') },
    [input('ts', 'Longest upstream stop to ride through', p.stop_s, 's'), input('Tt', 'Takt', p.takt_s, 's')],
    (v) => Math.ceil(v.ts / v.Tt - 1e-9),
    positive('Tt'),
  );
}

/** N22 — parallel-station cycle CT = max(t_station) + t_transfer */
export function parallelStationCycle(p: { station_times_s?: number[] | null; transfer_s?: number | null }): CalcResult {
  const max = p.station_times_s?.length ? Math.max(...p.station_times_s) : null;
  return calc(
    { id: 'parallel_cycle', label: 'Cycle time — parallel stations / indexing', formula: 'CT = max(t_station) + t_transfer', unit: 's', source: part54('N22', 'motion') },
    [input('tmax', 'Longest station time', max, 's'), input('tt', 'Transfer / index time', p.transfer_s, 's')],
    (v) => v.tmax + v.tt,
  );
}

/** Load-while-process (shuttle, 2 nests) CT = max(t_handling, t_process) + t_shuttle — Handbook §4.3 */
export function loadWhileProcessCycle(p: { handling_s?: number | null; process_s?: number | null; shuttle_s?: number | null }): CalcResult {
  return calc(
    {
      id: 'lwp_cycle',
      label: 'Cycle time — load-while-process (shuttle, 2 nests)',
      formula: 'CT = max(t_handling, t_process) + t_shuttle',
      unit: 's',
      source: { citation: 'Automation Equipment Building Handbook §4.3 Ways to create parallelism', ref: 'automation/07-part-4-cycle-time-and-capacity-engineering.md#4-3-architecture-ways-to-create-parallelism' },
    },
    [input('th', 'Handling time (load/unload/align)', p.handling_s, 's'), input('tp', 'Process time', p.process_s, 's'), input('ts', 'Shuttle time', p.shuttle_s, 's')],
    (v) => Math.max(v.th, v.tp) + v.ts,
  );
}

/** Sequential single station CT = Σt_i — Handbook §4.3 */
export function sequentialCycle(p: { operation_times_s?: number[] | null }): CalcResult {
  const sum = p.operation_times_s?.length ? p.operation_times_s.reduce((a, b) => a + b, 0) : null;
  return calc(
    { id: 'seq_cycle', label: 'Cycle time — sequential single station', formula: 'CT = Σ t_i', unit: 's', source: { citation: 'Automation Equipment Building Handbook §4.3', ref: 'automation/07-part-4-cycle-time-and-capacity-engineering.md#4-3-architecture-ways-to-create-parallelism' } },
    [input('Σt', 'Sum of operation times', sum, 's')],
    (v) => v['Σt'],
  );
}

/** Capacity per year = UPH·OEE·hours per year → units */
export function annualCapacity(p: { uph?: number | null; oee?: number | null; hours_per_year?: number | null }): CalcResult {
  return calc(
    { id: 'capacity', label: 'Annual capacity (good units)', formula: 'Cap = UPH·OEE·H_year', unit: 'units/yr', source: part54('K4', 'performance'), assumptions: ['H_year = planned production hours per year'] },
    [input('UPH', 'UPH (ideal)', p.uph, 'units/h'), input('OEE', 'OEE', p.oee, ''), input('H', 'Planned hours per year', p.hours_per_year, 'h')],
    (v) => v.UPH * v.OEE * v.H,
  );
}

/** M1 — F = m·a → N */
export function force(p: { mass_kg?: number | null; accel_m_s2?: number | null }): CalcResult {
  return calc({ id: 'force', label: 'Force', formula: 'F = m·a', unit: 'N', source: part54('M1', 'mechanical') }, [input('m', 'Mass', p.mass_kg, 'kg'), input('a', 'Acceleration', p.accel_m_s2, 'm/s²')], (v) => v.m * v.a);
}

/** N5 — motor speed (screw) n = 60·v / p → min⁻¹ */
export function motorSpeedScrew(p: { speed_m_s?: number | null; lead_mm?: number | null }): CalcResult {
  return calc(
    { id: 'motor_speed', label: 'Motor speed (ball screw)', formula: 'n = 60·v / p', unit: 'min⁻¹', source: part54('N5', 'motion') },
    [input('v', 'Linear speed', p.speed_m_s, 'm/s'), input('p', 'Screw lead', p.lead_mm, 'mm')],
    (v) => (60 * v.v) / (v.p * 1e-3),
    positive('p'),
  );
}

/** Servo sizing (simplified): RMS torque from acceleration + friction segments — N11/N12/N13 */
export function servoRmsTorque(p: { segments?: { torque_nm: number; time_s: number }[] | null; cycle_s?: number | null }): CalcResult {
  const sumSq = p.segments?.length ? p.segments.reduce((s, x) => s + x.torque_nm * x.torque_nm * x.time_s, 0) : null;
  return calc(
    { id: 'servo_rms', label: 'RMS torque (servo sizing)', formula: 'T_RMS = √(Σ T_k²·t_k / t_cycle)', unit: 'N·m', source: part54('N13', 'motion'), assumptions: ['Compare with the motor’s continuous (rated) torque; peak torque checked separately'] },
    [input('ΣT²t', 'Σ T_k²·t_k', sumSq, 'N²·m²·s'), input('tc', 'Cycle time', p.cycle_s, 's')],
    (v) => Math.sqrt(v['ΣT²t'] / v.tc),
    positive('tc'),
  );
}

/** P1 — cylinder extend force F = p·A·η → N */
export function cylinderExtendForce(p: { pressure_bar?: number | null; bore_mm?: number | null; efficiency?: number | null }): CalcResult {
  return calc(
    { id: 'cyl_force', label: 'Pneumatic cylinder extend force', formula: 'F = p·A·η', unit: 'N', source: part54('P1', 'pneumatics'), assumptions: ['Gauge pressure; η ≈ 0.9 unless stated'] },
    [input('p', 'Supply pressure (gauge)', p.pressure_bar, 'bar'), input('d', 'Bore', p.bore_mm, 'mm'), input('η', 'Efficiency', p.efficiency ?? 0.9, '')],
    (v) => v.p * 1e5 * Math.PI * Math.pow((v.d / 2) * 1e-3, 2) * v['η'],
    positive('p', 'd', 'η'),
  );
}

/** P6 — air flow for speed Q = A·v·(p + p_atm)/p_atm → NL/min */
export function airFlowForSpeed(p: { bore_mm?: number | null; speed_m_s?: number | null; pressure_bar?: number | null }): CalcResult {
  return calc(
    { id: 'air_flow', label: 'Air flow for cylinder speed', formula: 'Q = A·v·(p + p_atm)/p_atm', unit: 'NL/min', source: part54('P6', 'pneumatics'), assumptions: ['p_atm = 1.013 bar'] },
    [input('d', 'Bore', p.bore_mm, 'mm'), input('v', 'Piston speed', p.speed_m_s, 'm/s'), input('p', 'Pressure (gauge)', p.pressure_bar, 'bar')],
    (v) => Math.PI * Math.pow((v.d / 2) * 1e-3, 2) * v.v * ((v.p + 1.013) / 1.013) * 1000 * 60,
    positive('d', 'v'),
  );
}

/** P12 — vacuum cup diameter d = √(4·F / (π·Δp·n)) → mm */
export function vacuumCupDiameter(p: { force_n?: number | null; vacuum_kpa?: number | null; cups?: number | null }): CalcResult {
  return calc(
    { id: 'cup_diameter', label: 'Vacuum cup diameter', formula: 'd = √(4·F / (π·Δp·n))', unit: 'mm', source: part54('P12', 'pneumatics'), assumptions: ['F already includes the safety factor (P9–P11)'] },
    [input('F', 'Required holding force', p.force_n, 'N'), input('Δp', 'Vacuum level', p.vacuum_kpa, 'kPa'), input('n', 'Number of cups', p.cups, '')],
    (v) => Math.sqrt((4 * v.F) / (Math.PI * v['Δp'] * 1e3 * v.n)) * 1000,
    positive('F', 'Δp', 'n'),
  );
}

/** P13 — evacuation time t = (V/Q)·ln(p₀/p₁) → s */
export function evacuationTime(p: { volume_l?: number | null; flow_l_min?: number | null; p0_kpa?: number | null; p1_kpa?: number | null }): CalcResult {
  return calc(
    { id: 'evacuation', label: 'Vacuum evacuation time', formula: 't = (V/Q)·ln(p₀/p₁)', unit: 's', source: part54('P13', 'pneumatics'), assumptions: ['Absolute pressures; constant suction flow'] },
    [input('V', 'Volume', p.volume_l, 'L'), input('Q', 'Suction flow', p.flow_l_min, 'L/min'), input('p0', 'Start pressure (abs)', p.p0_kpa, 'kPa'), input('p1', 'End pressure (abs)', p.p1_kpa, 'kPa')],
    (v) => (v.V / (v.Q / 60)) * Math.log(v.p0 / v.p1),
    positive('V', 'Q', 'p0', 'p1'),
  );
}

/** E1 — three-phase current I = S / (√3·V) → A */
export function threePhaseCurrent(p: { apparent_kva?: number | null; voltage_v?: number | null }): CalcResult {
  return calc(
    { id: 'three_phase_current', label: 'Three-phase current', formula: 'I = S / (√3·V)', unit: 'A', source: part54('E1', 'electrical') },
    [input('S', 'Apparent power', p.apparent_kva, 'kVA'), input('V', 'Line-to-line voltage', p.voltage_v, 'V')],
    (v) => (v.S * 1e3) / (Math.sqrt(3) * v.V),
    positive('V'),
  );
}

/** Electrical load: demand kVA from connected loads and diversity (E3) */
export function demandLoad(p: { loads?: { kva: number; diversity: number }[] | null }): CalcResult {
  const sum = p.loads?.length ? p.loads.reduce((s, l) => s + l.kva * l.diversity, 0) : null;
  return calc({ id: 'demand_load', label: 'Demand load', formula: 'S_d = Σ S_i·k_d,i', unit: 'kVA', source: part54('E3', 'electrical') }, [input('Sd', 'Σ S_i·k_d,i', sum, 'kVA')], (v) => v.Sd);
}
