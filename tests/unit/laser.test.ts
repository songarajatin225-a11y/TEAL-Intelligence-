import { describe, expect, it } from 'vitest';
import * as L from '../../src/calculations/laser';

describe('laser calculations (handbook worked values)', () => {
  it('L1 spot diameter — Laser Handbook §4.6: fiber marker λ 1.064 µm, M² 1.3, D 7 mm, f 160 mm → 40 µm', () => {
    const r = L.spotDiameter({ wavelength_nm: 1064, m2: 1.3, beam_mm: 7, focal_mm: 160 });
    expect(r.status).toBe('CALCULATED');
    expect(Math.round(r.value!)).toBe(40); // handbook quotes 40 µm
    expect(r.unit).toBe('µm');
    expect(r.formula).toContain('4·M²·λ·f');
    expect(r.source.formula_id).toBe('fml-l1');
    expect(r.assumptions.length).toBeGreaterThan(0);
  });

  it('DOF = 2·z_R — Laser Handbook §4.6 same example → 1.8 mm', () => {
    const spot = L.spotDiameter({ wavelength_nm: 1064, m2: 1.3, beam_mm: 7, focal_mm: 160 });
    const dof = L.depthOfFocus({ spot_um: spot.value, wavelength_nm: 1064, m2: 1.3 });
    expect(dof.value).toBeCloseTo(1.84, 1);
  });

  it('L4/L5/L6 are mutually consistent with Part 54 worked values (0.5 mJ, 5 kW, 32 J/cm² at 45 µm)', () => {
    const e = L.pulseEnergy({ power_w: 50, rep_khz: 100 });
    expect(e.value).toBeCloseTo(0.5, 6);
    expect(L.peakPower({ pulse_energy_mj: 0.5, pulse_ns: 100 }).value).toBeCloseTo(5, 6);
    expect(L.fluence({ pulse_energy_mj: 0.5, spot_um: 45 }).value).toBeCloseTo(31.4, 0);
  });

  it('L8 pulse overlap — Laser Handbook §2.9: 1000 mm/s, 100 kHz, 30 µm → 67 %', () => {
    expect(L.pulseOverlap({ speed_mm_s: 1000, rep_khz: 100, spot_um: 30 }).value).toBeCloseTo(66.7, 1);
  });

  it('flags separated pulses (negative overlap)', () => {
    const r = L.pulseOverlap({ speed_mm_s: 7000, rep_khz: 20, spot_um: 40 });
    expect(r.value).toBeLessThan(0);
    expect(r.warnings.join(' ')).toMatch(/separated/);
  });

  it('L9 line energy P/v', () => {
    expect(L.lineEnergy({ power_w: 3000, speed_mm_s: 100 }).value).toBe(30);
  });

  it('refuses to guess with missing inputs', () => {
    const r = L.spotDiameter({ wavelength_nm: 1064, m2: null, beam_mm: 7, focal_mm: 160 });
    expect(r.status).toBe('INSUFFICIENT_DATA');
    expect(r.value).toBeNull();
    expect(r.warnings[0]).toMatch(/Beam quality/);
  });

  it('rejects non-physical inputs', () => {
    expect(L.spotDiameter({ wavelength_nm: 1064, m2: 1.3, beam_mm: 0, focal_mm: 160 }).status).toBe('INSUFFICIENT_DATA');
  });

  it('absorption band mapping (legacy matBand)', () => {
    expect(L.absorptionBand(355)).toBe('uv');
    expect(L.absorptionBand(450)).toBe('blue');
    expect(L.absorptionBand(532)).toBe('green');
    expect(L.absorptionBand(1064)).toBe('ir');
    expect(L.absorptionBand(10600)).toBe('co2');
  });

  it('process regime applies the keyhole threshold only to welding', () => {
    expect(L.processRegime({ family: 'weld', irradiance_w_cm2: 2e6, fluence_j_cm2: null, pulse_ns: null }).name).toBe('Keyhole welding');
    expect(L.processRegime({ family: 'weld', irradiance_w_cm2: 5e5, fluence_j_cm2: null, pulse_ns: null }).name).toBe('Conduction welding');
    expect(L.processRegime({ family: 'mark', irradiance_w_cm2: 5e9, fluence_j_cm2: 50, pulse_ns: 100 }).name).toBe('Ablative marking');
    expect(L.processRegime({ family: 'cut', irradiance_w_cm2: 1e12, fluence_j_cm2: 1, pulse_ns: 0.01 }).name).toBe('Cold ablation');
  });

  it('thermal diffusion length √(4ατ) for copper at 100 ns ≈ 6.8 µm', () => {
    const r = L.thermalDiffusionLength({ k: 401, rho: 8960, cp: 385, pulse_ns: 100 });
    expect(r.value).toBeCloseTo(6.8, 0);
  });
});
