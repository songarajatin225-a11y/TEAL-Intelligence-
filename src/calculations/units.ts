/**
 * Unit engine (spec §87). Normalises values for calculation while the original source text is
 * kept alongside (Quantity.original) — original units are never destroyed.
 * Currency is NOT converted here: currency conversion needs a dated FX rate (see cost.ts).
 */
export type Dimension =
  | 'power'
  | 'length'
  | 'frequency'
  | 'time'
  | 'energy'
  | 'speed'
  | 'temperature'
  | 'mass'
  | 'pressure'
  | 'area'
  | 'fluence'
  | 'currency'
  | 'dimensionless'
  | 'thermal_conductivity'
  | 'density'
  | 'specific_heat'
  | 'flow';

interface UnitDef {
  dim: Dimension;
  /** factor to the SI base unit of the dimension (value_SI = value × factor + offset) */
  factor: number;
  offset?: number;
  symbol: string;
}

const U: Record<string, UnitDef> = {
  // power (W)
  W: { dim: 'power', factor: 1, symbol: 'W' },
  kW: { dim: 'power', factor: 1e3, symbol: 'kW' },
  mW: { dim: 'power', factor: 1e-3, symbol: 'mW' },
  MW: { dim: 'power', factor: 1e6, symbol: 'MW' },
  // length (m)
  nm: { dim: 'length', factor: 1e-9, symbol: 'nm' },
  'µm': { dim: 'length', factor: 1e-6, symbol: 'µm' },
  um: { dim: 'length', factor: 1e-6, symbol: 'µm' },
  mm: { dim: 'length', factor: 1e-3, symbol: 'mm' },
  cm: { dim: 'length', factor: 1e-2, symbol: 'cm' },
  m: { dim: 'length', factor: 1, symbol: 'm' },
  // frequency (Hz)
  Hz: { dim: 'frequency', factor: 1, symbol: 'Hz' },
  kHz: { dim: 'frequency', factor: 1e3, symbol: 'kHz' },
  MHz: { dim: 'frequency', factor: 1e6, symbol: 'MHz' },
  // time (s)
  fs: { dim: 'time', factor: 1e-15, symbol: 'fs' },
  ps: { dim: 'time', factor: 1e-12, symbol: 'ps' },
  ns: { dim: 'time', factor: 1e-9, symbol: 'ns' },
  'µs': { dim: 'time', factor: 1e-6, symbol: 'µs' },
  us: { dim: 'time', factor: 1e-6, symbol: 'µs' },
  ms: { dim: 'time', factor: 1e-3, symbol: 'ms' },
  s: { dim: 'time', factor: 1, symbol: 's' },
  min: { dim: 'time', factor: 60, symbol: 'min' },
  h: { dim: 'time', factor: 3600, symbol: 'h' },
  // energy (J)
  J: { dim: 'energy', factor: 1, symbol: 'J' },
  kJ: { dim: 'energy', factor: 1e3, symbol: 'kJ' },
  mJ: { dim: 'energy', factor: 1e-3, symbol: 'mJ' },
  'µJ': { dim: 'energy', factor: 1e-6, symbol: 'µJ' },
  uJ: { dim: 'energy', factor: 1e-6, symbol: 'µJ' },
  // speed (m/s)
  'mm/s': { dim: 'speed', factor: 1e-3, symbol: 'mm/s' },
  'm/s': { dim: 'speed', factor: 1, symbol: 'm/s' },
  'm/min': { dim: 'speed', factor: 1 / 60, symbol: 'm/min' },
  // temperature (K)
  K: { dim: 'temperature', factor: 1, symbol: 'K' },
  '°C': { dim: 'temperature', factor: 1, offset: 273.15, symbol: '°C' },
  // mass (kg)
  g: { dim: 'mass', factor: 1e-3, symbol: 'g' },
  kg: { dim: 'mass', factor: 1, symbol: 'kg' },
  t: { dim: 'mass', factor: 1e3, symbol: 't' },
  // pressure (Pa)
  Pa: { dim: 'pressure', factor: 1, symbol: 'Pa' },
  kPa: { dim: 'pressure', factor: 1e3, symbol: 'kPa' },
  MPa: { dim: 'pressure', factor: 1e6, symbol: 'MPa' },
  bar: { dim: 'pressure', factor: 1e5, symbol: 'bar' },
  mbar: { dim: 'pressure', factor: 1e2, symbol: 'mbar' },
  // area (m²)
  'mm²': { dim: 'area', factor: 1e-6, symbol: 'mm²' },
  'cm²': { dim: 'area', factor: 1e-4, symbol: 'cm²' },
  'm²': { dim: 'area', factor: 1, symbol: 'm²' },
  // fluence (J/m²)
  'J/cm²': { dim: 'fluence', factor: 1e4, symbol: 'J/cm²' },
  'J/m²': { dim: 'fluence', factor: 1, symbol: 'J/m²' },
  // material properties
  'W/(m·K)': { dim: 'thermal_conductivity', factor: 1, symbol: 'W/(m·K)' },
  'kg/m³': { dim: 'density', factor: 1, symbol: 'kg/m³' },
  'J/(kg·K)': { dim: 'specific_heat', factor: 1, symbol: 'J/(kg·K)' },
  // flow (m³/s)
  'L/min': { dim: 'flow', factor: 1e-3 / 60, symbol: 'L/min' },
  'm³/h': { dim: 'flow', factor: 1 / 3600, symbol: 'm³/h' },
  // dimensionless
  '%': { dim: 'dimensionless', factor: 0.01, symbol: '%' },
  '': { dim: 'dimensionless', factor: 1, symbol: '' },
  // currency (no fixed factor — FX is dated data)
  INR: { dim: 'currency', factor: NaN, symbol: '₹' },
  '₹': { dim: 'currency', factor: NaN, symbol: '₹' },
  USD: { dim: 'currency', factor: NaN, symbol: '$' },
  $: { dim: 'currency', factor: NaN, symbol: '$' },
  EUR: { dim: 'currency', factor: NaN, symbol: '€' },
  '€': { dim: 'currency', factor: NaN, symbol: '€' },
  JPY: { dim: 'currency', factor: NaN, symbol: '¥' },
  '¥': { dim: 'currency', factor: NaN, symbol: '¥' },
};

export class UnitError extends Error {}

export function isKnownUnit(unit: string): boolean {
  return unit in U;
}

export function dimensionOf(unit: string): Dimension | undefined {
  return U[unit]?.dim;
}

export function knownUnits(): string[] {
  return Object.keys(U).filter(Boolean);
}

/** Convert between two units of the same (non-currency) dimension. */
export function convert(value: number, from: string, to: string): number {
  const a = U[from];
  const b = U[to];
  if (!a) throw new UnitError(`Unknown unit "${from}"`);
  if (!b) throw new UnitError(`Unknown unit "${to}"`);
  if (a.dim !== b.dim) throw new UnitError(`Cannot convert ${a.dim} (${from}) to ${b.dim} (${to})`);
  if (a.dim === 'currency') throw new UnitError('Currency conversion requires a dated FX rate — use cost.convertCurrency');
  const si = value * a.factor + (a.offset ?? 0);
  return (si - (b.offset ?? 0)) / b.factor;
}

export interface ParsedQuantity {
  value: number;
  unit: string;
  original: string;
}

/**
 * Parse text such as "50 W", "1064nm", "10.6 µm", "100 ns", "₹ 1,40,000", "20–100 kHz" (range → first value).
 * Returns null when no number/unit can be read. The original text is preserved.
 */
export function parseQuantity(text: string): ParsedQuantity | null {
  const t = text.trim().replace(/\u00a0/g, ' ');
  const cur = /^(₹|\$|€|¥)\s*([\d,]+(?:\.\d+)?)/.exec(t);
  if (cur) return { value: parseFloat(cur[2].replace(/,/g, '')), unit: cur[1], original: text };
  const m = /(-?[\d,]*\.?\d+(?:[eE][-+]?\d+)?)\s*(?:[–-]\s*[\d.]+\s*)?([a-zA-Zµ°²³/%·()]+)?/.exec(t);
  if (!m) return null;
  const value = parseFloat(m[1].replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;
  const unit = (m[2] ?? '').replace(/^u(?=[mJs])/, 'µ');
  if (unit && !isKnownUnit(unit)) return null;
  return { value, unit, original: text };
}

/** Format a number with sensible precision for engineering display. */
export function fmtNum(v: number | null | undefined, digits = 3): string {
  if (v == null || !Number.isFinite(v)) return 'UNKNOWN';
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e6 || a < 1e-3)) return v.toExponential(2).replace('e', ' × 10^');
  return Number(v.toPrecision(Math.min(21, Math.max(1, Math.round(digits))))).toLocaleString('en-IN', { maximumFractionDigits: 6 });
}
