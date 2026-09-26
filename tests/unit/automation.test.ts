import { describe, expect, it } from 'vitest';
import * as A from '../../src/calculations/automation';

/* Automation Equipment Building Handbook §4.7 "10,000 units per day" and Part 54 worked values. */
describe('cycle time & capacity — Handbook §4.7 worked example', () => {
  const Tplan = A.plannedTime({ calendar_s: 1440 * 60, breaks_s: 90 * 60, pm_s: 30 * 60, changeover_s: 0 });

  it('K1 planned time = 79,200 s', () => {
    expect(Tplan.value).toBe(79200);
  });
  it('K2 takt = 7.92 s', () => {
    expect(A.takt({ available_s: Tplan.value, demand: 10000 }).value).toBeCloseTo(7.92, 2);
  });
  it('K5 OEE = 86.1 %', () => {
    expect(A.oee({ availability: 0.92, performance: 0.95, quality: 0.985 }).value).toBeCloseTo(0.861, 3);
  });
  it('K3 CT_ideal = 6.82 s and K4 UPH = 528', () => {
    const ct = A.idealCycleTime({ planned_s: 79200, oee: 0.92 * 0.95 * 0.985, good_units: 10000 });
    expect(ct.value).toBeCloseTo(6.82, 2);
    expect(A.uph({ cycle_s: ct.value }).value).toBeCloseTo(528, 0);
  });
  it('sequential sum of the §4.7 operations = 8.4 s (exceeds target → needs parallelism)', () => {
    expect(A.sequentialCycle({ operation_times_s: [1.5, 1.4, 3.5, 0.8, 1.2] }).value).toBeCloseTo(8.4, 6);
  });
  it('K7 minimum stations for 8.4 s at 6.2 s target = 2', () => {
    expect(A.minimumStations({ operation_times_s: [1.5, 1.4, 3.5, 0.8, 1.2], cycle_s: 6.2 }).value).toBe(2);
  });
  it('load-while-process shuttle: max(handling, process) + shuttle', () => {
    expect(A.loadWhileProcessCycle({ handling_s: 4.9, process_s: 3.5, shuttle_s: 0.4 }).value).toBeCloseTo(5.3, 6);
  });
  it('N22 parallel station cycle', () => {
    expect(A.parallelStationCycle({ station_times_s: [3.5, 4.9], transfer_s: 0.4 }).value).toBeCloseTo(5.3, 6);
  });
  it('OEE rejects values outside 0–1', () => {
    expect(A.oee({ availability: 92, performance: 0.95, quality: 0.985 }).status).toBe('INSUFFICIENT_DATA');
  });
});

describe('Part 54 worked values', () => {
  it('P1 cylinder force Ø20 at 4 bar ≈ 113 N', () => {
    expect(A.cylinderExtendForce({ pressure_bar: 4, bore_mm: 20, efficiency: 0.9 }).value).toBeCloseTo(113, 0);
  });
  it('E1 three-phase current 4.32 kVA at 415 V ≈ 6.0 A', () => {
    expect(A.threePhaseCurrent({ apparent_kva: 4.32, voltage_v: 415 }).value).toBeCloseTo(6.0, 1);
  });
  it('N5 motor speed 0.75 m/s, 20 mm lead = 2,250 min⁻¹', () => {
    expect(A.motorSpeedScrew({ speed_m_s: 0.75, lead_mm: 20 }).value).toBeCloseTo(2250, 6);
  });
  it('M1 F = m·a: 35 kg × 2.81 m/s² ≈ 98 N', () => {
    expect(A.force({ mass_kg: 35, accel_m_s2: 2.81 }).value).toBeCloseTo(98.35, 2);
  });
  it('K6 availability from MTBF/MTTR', () => {
    expect(A.availabilityFromMtbf({ mtbf_h: 46, mttr_h: 4 }).value).toBeCloseTo(0.92, 6);
  });
  it('K9 machines and K10 utilization', () => {
    expect(A.machinesRequired({ uph_required: 1100, uph_machine: 528 }).value).toBe(3);
    expect(A.utilization({ demand: 78, capacity: 100 }).value).toBeCloseTo(0.78, 6);
  });
  it('servo RMS torque', () => {
    const r = A.servoRmsTorque({ segments: [{ torque_nm: 0.62, time_s: 0.2 }, { torque_nm: 0.09, time_s: 0.4 }, { torque_nm: -0.44, time_s: 0.2 }], cycle_s: 1.2 });
    expect(r.value).toBeGreaterThan(0.2);
    expect(r.source.formula_id).toBe('fml-n13');
  });
});
