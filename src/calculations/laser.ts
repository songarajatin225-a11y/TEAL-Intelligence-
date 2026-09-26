import { calc, input, part54, positive, type CalcResult, type CalcSource } from './types';

/*
 * Laser calculations. Formulas follow the Automation Equipment Building Handbook Part 54
 * (L1–L11) and the Laser Handbook Part IV. Results are diffraction-limited ESTIMATES — the
 * spot/DOF of a real system depends on aberrations, alignment and the actual beam.
 */

const LASER_HB_BEAM: CalcSource = {
  citation: 'The Complete Laser Handbook, §4.5 Spot size and depth of focus: design equations',
  ref: 'laser/05-part-iv-beam-engineering.md#4-5-spot-size-and-depth-of-focus-design-equations',
};
const withLaserHb = (s: CalcSource): CalcSource => ({ ...s, citation: `${s.citation}; ${LASER_HB_BEAM.citation}` });

/** L1 — focused spot diameter d₀ = 4·M²·λ·f / (π·D) → µm */
export function spotDiameter(p: { wavelength_nm?: number | null; focal_mm?: number | null; m2?: number | null; beam_mm?: number | null }): CalcResult {
  return calc(
    {
      id: 'spot_diameter',
      label: 'Focused spot diameter (1/e²)',
      formula: 'd₀ = 4·M²·λ·f / (π·D)',
      unit: 'µm',
      source: withLaserHb(part54('L1', 'laser')),
      assumptions: ['Collimated input beam of 1/e² diameter D fills the objective without clipping', 'Diffraction-limited focusing (no lens aberrations)', 'M² as quoted for the source class'],
    },
    [input('M2', 'Beam quality M²', p.m2, ''), input('λ', 'Wavelength', p.wavelength_nm, 'nm'), input('f', 'Focal length', p.focal_mm, 'mm'), input('D', 'Beam diameter at lens', p.beam_mm, 'mm')],
    (v) => ((4 * v.M2 * (v['λ'] * 1e-6) * v.f) / (Math.PI * v.D)) * 1000,
    positive('M2', 'λ', 'f', 'D'),
  );
}

/** L2 — Rayleigh range z_R = π·w₀² / (M²·λ) → mm */
export function rayleighRange(p: { spot_um?: number | null; wavelength_nm?: number | null; m2?: number | null }): CalcResult {
  return calc(
    {
      id: 'rayleigh_range',
      label: 'Rayleigh range',
      formula: 'z_R = π·w₀² / (M²·λ),  w₀ = d₀/2',
      unit: 'mm',
      source: withLaserHb(part54('L2', 'laser')),
      assumptions: ['Spot grows to √2 × waist at ±z_R'],
    },
    [input('d0', 'Spot diameter', p.spot_um, 'µm'), input('M2', 'Beam quality M²', p.m2, ''), input('λ', 'Wavelength', p.wavelength_nm, 'nm')],
    (v) => (Math.PI * Math.pow((v.d0 / 2) * 1e-3, 2)) / (v.M2 * v['λ'] * 1e-6),
    positive('d0', 'M2', 'λ'),
  );
}

/** Depth of focus = 2·z_R (full window where the spot stays within √2 of the waist) → mm */
export function depthOfFocus(p: { spot_um?: number | null; wavelength_nm?: number | null; m2?: number | null }): CalcResult {
  const zr = rayleighRange(p);
  return {
    ...zr,
    id: 'depth_of_focus',
    label: 'Depth of focus (±z_R, full width)',
    formula: 'DOF = 2·z_R = 2·π·w₀² / (M²·λ)',
    value: zr.value == null ? null : 2 * zr.value,
    assumptions: [...zr.assumptions, 'Tighter tolerance windows (e.g. ±5 % spot growth ≈ 0.32·z_R) are narrower'],
  };
}

/** L3 — scan field L ≈ f·θ_opt (θ in rad, full optical scan angle) → mm */
export function scanField(p: { focal_mm?: number | null; optical_angle_rad?: number | null }): CalcResult {
  return calc(
    { id: 'scan_field', label: 'Scan field (f-theta)', formula: 'L ≈ f·θ_opt', unit: 'mm', source: part54('L3', 'laser'), assumptions: ['Ideal f-theta mapping; vignetting and field distortion ignored'] },
    [input('f', 'Focal length', p.focal_mm, 'mm'), input('θ', 'Full optical scan angle', p.optical_angle_rad, 'rad')],
    (v) => v.f * v['θ'],
    positive('f', 'θ'),
  );
}

/** L4 — pulse energy E_p = P_avg / f_rep → mJ */
export function pulseEnergy(p: { power_w?: number | null; rep_khz?: number | null }): CalcResult {
  return calc(
    { id: 'pulse_energy', label: 'Pulse energy', formula: 'E_p = P_avg / f_rep', unit: 'mJ', source: part54('L4', 'laser'), assumptions: ['All average power is in the pulses (no CW background)'] },
    [input('P', 'Average power', p.power_w, 'W'), input('f', 'Repetition rate', p.rep_khz, 'kHz')],
    (v) => (v.P / (v.f * 1e3)) * 1e3,
    positive('P', 'f'),
  );
}

/** L5 — peak power P_peak ≈ E_p / τ → kW */
export function peakPower(p: { pulse_energy_mj?: number | null; pulse_ns?: number | null }): CalcResult {
  return calc(
    { id: 'peak_power', label: 'Peak power', formula: 'P_peak ≈ E_p / τ', unit: 'kW', source: part54('L5', 'laser'), assumptions: ['Rectangular pulse approximation; real pulse shapes give a different peak'] },
    [input('E', 'Pulse energy', p.pulse_energy_mj, 'mJ'), input('τ', 'Pulse duration', p.pulse_ns, 'ns')],
    (v) => (v.E * 1e-3) / (v['τ'] * 1e-9) / 1e3,
    positive('E', 'τ'),
  );
}

/** L6 — fluence F = E_p / (π·w₀²) → J/cm² */
export function fluence(p: { pulse_energy_mj?: number | null; spot_um?: number | null }): CalcResult {
  return calc(
    {
      id: 'fluence',
      label: 'Fluence (average over 1/e² spot)',
      formula: 'F = E_p / (π·w₀²)',
      unit: 'J/cm²',
      source: part54('L6', 'laser'),
      assumptions: ['Average over the 1/e² area; the on-axis peak fluence of a Gaussian beam is 2× this value'],
    },
    [input('E', 'Pulse energy', p.pulse_energy_mj, 'mJ'), input('d0', 'Spot diameter', p.spot_um, 'µm')],
    (v) => (v.E * 1e-3) / (Math.PI * Math.pow((v.d0 / 2) * 1e-4, 2)),
    positive('E', 'd0'),
  );
}

/** L7 — intensity I = P / (π·w₀²) → W/cm² */
export function intensity(p: { power_w?: number | null; spot_um?: number | null }): CalcResult {
  return calc(
    { id: 'intensity', label: 'Intensity (irradiance)', formula: 'I = P / (π·w₀²)', unit: 'W/cm²', source: part54('L7', 'laser'), assumptions: ['Average over the 1/e² area; use peak power for pulsed peak irradiance'] },
    [input('P', 'Power', p.power_w, 'W'), input('d0', 'Spot diameter', p.spot_um, 'µm')],
    (v) => v.P / (Math.PI * Math.pow((v.d0 / 2) * 1e-4, 2)),
    positive('P', 'd0'),
  );
}

/** Energy density delivered along a scanned line (areal): P / (v · hatch) → J/cm² */
export function energyDensity(p: { power_w?: number | null; speed_mm_s?: number | null; hatch_um?: number | null }): CalcResult {
  return calc(
    {
      id: 'energy_density',
      label: 'Areal energy density (scanned area)',
      formula: 'E_A = P / (v · h)',
      unit: 'J/cm²',
      source: { citation: 'Derived: power per swept area (v × hatch). Hatch guidance 0.5–0.8 × spot — Laser Handbook §7.3', ref: 'laser/08-part-vii-galvo-scanning-and-motion.md#7-3-scan-strategies' },
      assumptions: ['Uniform hatch fill; overlapping passes add linearly'],
    },
    [input('P', 'Average power', p.power_w, 'W'), input('v', 'Scan speed', p.speed_mm_s, 'mm/s'), input('h', 'Hatch pitch', p.hatch_um, 'µm')],
    (v) => v.P / ((v.v * 0.1) * (v.h * 1e-4)),
    positive('P', 'v', 'h'),
  );
}

/** L8 — pulse overlap O = 1 − v / (f_rep·d₀) → % */
export function pulseOverlap(p: { speed_mm_s?: number | null; rep_khz?: number | null; spot_um?: number | null }): CalcResult {
  const r = calc(
    {
      id: 'pulse_overlap',
      label: 'Pulse overlap',
      formula: 'O = 1 − v / (f_rep·d₀)',
      unit: '%',
      source: { ...part54('L8', 'laser'), citation: `${part54('L8', 'laser').citation}; Laser Handbook §2.9 worked example (1000 mm/s, 100 kHz, 30 µm → 67 %)` },
      assumptions: ['Spacing v/f compared with the 1/e² spot diameter'],
    },
    [input('v', 'Scan speed', p.speed_mm_s, 'mm/s'), input('f', 'Repetition rate', p.rep_khz, 'kHz'), input('d0', 'Spot diameter', p.spot_um, 'µm')],
    (v) => (1 - (v.v * 1e3) / (v.f * 1e3 * v.d0)) * 100,
    positive('v', 'f', 'd0'),
  );
  if (r.value != null && r.value < 0) r.warnings.push('Negative overlap: pulses are separated (gaps between spots)');
  return r;
}

/** L9 — line energy (heat input) HI = P / v → J/mm */
export function lineEnergy(p: { power_w?: number | null; speed_mm_s?: number | null }): CalcResult {
  return calc(
    { id: 'line_energy', label: 'Line energy / heat input', formula: 'HI = P / v', unit: 'J/mm', source: part54('L9', 'laser'), assumptions: ['Delivered power; absorbed heat input = HI × absorptance'] },
    [input('P', 'Power', p.power_w, 'W'), input('v', 'Travel speed', p.speed_mm_s, 'mm/s')],
    (v) => v.P / v.v,
    positive('P', 'v'),
  );
}

/** L11 — chiller capacity Q ≥ 1.2·(P_el − P_opt + P_optics) → kW */
export function chillerCapacity(p: { electrical_kw?: number | null; optical_kw?: number | null; optics_heat_kw?: number | null }): CalcResult {
  return calc(
    { id: 'chiller_capacity', label: 'Chiller capacity', formula: 'Q ≥ 1.2·(P_el − P_opt + P_optics)', unit: 'kW', source: part54('L11', 'laser'), assumptions: ['20 % margin per handbook'] },
    [input('Pel', 'Electrical input', p.electrical_kw, 'kW'), input('Popt', 'Optical output', p.optical_kw, 'kW'), input('Poptics', 'Heat in cooled optics', p.optics_heat_kw ?? 0, 'kW')],
    (v) => 1.2 * (v.Pel - v.Popt + v.Poptics),
  );
}

/** Wall-plug electrical input from optical power and efficiency → kW */
export function wallPlugPower(p: { power_w?: number | null; efficiency?: number | null }): CalcResult {
  return calc(
    { id: 'wall_plug', label: 'Electrical input (wall plug)', formula: 'P_el = P_opt / η_wp', unit: 'kW', source: { citation: 'Energy balance; η_wp per source class (legacy configurator value store)' }, assumptions: ['Wall-plug efficiency as stored for the source class (estimate)'] },
    [input('P', 'Optical power', p.power_w, 'W'), input('η', 'Wall-plug efficiency', p.efficiency, '')],
    (v) => v.P / v['η'] / 1000,
    positive('P', 'η'),
  );
}

/** Thermal diffusion length during a pulse: l = √(4·α·τ), α = k/(ρ·c_p) → µm */
export function thermalDiffusionLength(p: { k?: number | null; rho?: number | null; cp?: number | null; pulse_ns?: number | null }): CalcResult {
  return calc(
    {
      id: 'thermal_diffusion_length',
      label: 'Thermal diffusion length per pulse',
      formula: 'l = √(4·α·τ),  α = k / (ρ·c_p)',
      unit: 'µm',
      source: { citation: 'The Complete Laser Handbook, §9.4 The thermal regime', ref: 'laser/10-part-ix-laser-material-interaction.md#9-4-the-thermal-regime-conduction-melting-vaporisation-and-haz' },
      assumptions: ['Room-temperature material properties', 'Material property confidence LOW unless verified'],
    },
    [input('k', 'Thermal conductivity', p.k, 'W/(m·K)'), input('rho', 'Density', p.rho, 'kg/m³'), input('cp', 'Specific heat', p.cp, 'J/(kg·K)'), input('τ', 'Pulse duration', p.pulse_ns, 'ns')],
    (v) => Math.sqrt((4 * v.k) / (v.rho * v.cp) * v['τ'] * 1e-9) * 1e6,
    positive('k', 'rho', 'cp', 'τ'),
  );
}

/** Absorption band for a wavelength (legacy configurator `matBand`). */
export function absorptionBand(wavelength_nm: number): 'uv' | 'blue' | 'green' | 'ir' | 'co2' {
  const um = wavelength_nm / 1000;
  if (um < 0.4) return 'uv';
  if (um < 0.5) return 'blue';
  if (um < 0.6) return 'green';
  if (um < 3.0) return 'ir';
  return 'co2';
}

export interface ProcessRegime {
  name: string;
  description: string;
  basis: string;
}

/**
 * Process regime classification (ported from the legacy configurator `physics()`).
 * The ~10⁶ W/cm² keyhole threshold is a welding result and is applied only to welding.
 */
export function processRegime(p: {
  family: string;
  irradiance_w_cm2: number | null;
  fluence_j_cm2: number | null;
  pulse_ns: number | null;
}): ProcessRegime {
  const I = p.irradiance_w_cm2;
  const basis = 'Legacy configurator physics() rules; keyhole threshold ~10⁶ W/cm² (welding only)';
  switch (p.family) {
    case 'weld':
      return I != null && I >= 1e6
        ? { name: 'Keyhole welding', description: 'Above ~10⁶ W/cm² a vapour capillary forms — deep, narrow fusion zones at high aspect ratio.', basis }
        : { name: 'Conduction welding', description: 'Below the keyhole threshold — melting spreads by conduction, giving shallow, wide seams.', basis };
    case 'mark':
    case 'volt':
      return p.fluence_j_cm2 != null && p.fluence_j_cm2 < 10
        ? { name: 'Annealing / surface mark', description: 'Low fluence — oxide colour change or foaming, with no material removed.', basis }
        : { name: 'Ablative marking', description: 'Material removed pulse by pulse; contrast from depth and surface texture.', basis };
    case 'clean':
      return { name: 'Selective ablation', description: 'Contaminant removed below the substrate damage threshold.', basis };
    case 'cut':
      return p.pulse_ns != null && p.pulse_ns < 1
        ? { name: 'Cold ablation', description: 'Pulse shorter than electron–phonon coupling — material leaves before heat spreads.', basis }
        : { name: 'Fusion cutting', description: 'Material melted and ejected, typically with a coaxial assist-gas jet.', basis };
    case 'semi':
      return { name: 'Cold / short-wavelength ablation', description: 'Short wavelength or ultrashort pulse — removal with minimal HAZ on device layers.', basis };
    default:
      return I != null && I >= 1e6
        ? { name: 'Keyhole', description: 'Vapour capillary regime.', basis }
        : { name: 'Thermal processing', description: 'Conduction-limited melting or heating.', basis };
  }
}

/** L4 (rearranged) — average power P_avg = E_p · f_rep → W */
export function averagePower(p: { pulse_energy_mj?: number | null; rep_khz?: number | null }): CalcResult {
  return calc(
    { id: 'average_power', label: 'Average power', formula: 'P_avg = E_p · f_rep', unit: 'W', source: { ...part54('L4', 'laser'), citation: `${part54('L4', 'laser').citation} (rearranged)` }, assumptions: ['All average power is in the pulses (no CW background)'] },
    [input('E', 'Pulse energy', p.pulse_energy_mj, 'mJ'), input('f', 'Repetition rate', p.rep_khz, 'kHz')],
    (v) => v.E * 1e-3 * v.f * 1e3,
    positive('E', 'f'),
  );
}

/** L8 (rearranged) — scan / line speed for a target pulse overlap v = f_rep · d₀ · (1 − O) → mm/s */
export function lineSpeedForOverlap(p: { rep_khz?: number | null; spot_um?: number | null; overlap_pct?: number | null }): CalcResult {
  return calc(
    { id: 'line_speed', label: 'Line speed for target overlap', formula: 'v = f_rep · d₀ · (1 − O)', unit: 'mm/s', source: { ...part54('L8', 'laser'), citation: `${part54('L8', 'laser').citation} (rearranged)` }, assumptions: ['Spacing v/f compared with the 1/e² spot diameter', 'Galvo acceleration and jump delays not included'] },
    [input('f', 'Repetition rate', p.rep_khz, 'kHz'), input('d0', 'Spot diameter', p.spot_um, 'µm'), input('O', 'Target overlap', p.overlap_pct, '%')],
    (v) => v.f * 1e3 * v.d0 * 1e-3 * (1 - v.O / 100),
    (v) => (v.f > 0 && v.d0 > 0 ? (v.O < 100 ? null : 'Overlap must be < 100 %') : 'Must be > 0: f, d0'),
  );
}
