import type { AnyRecord } from '../domain';
import type { Application, LaserSource, Product } from '../domain/entities';

/**
 * PARAMETRIC SEARCH (final master prompt §26): read technical parameters out of a plain query —
 * "Find 20–50W UV lasers suitable for semiconductor marking" — and filter the structured records
 * (laser source classes, TEAL platforms and their power options, application records).
 * Every filter that was read is reported back, so the user sees exactly what was matched.
 */
export interface ParsedParams {
  powerMin: number | null;
  powerMax: number | null;
  band: { label: string; min: number; max: number } | null;
  regime: 'Nanosecond' | 'Picosecond' | 'Femtosecond' | 'CW' | null;
  process: string | null;
  industry: { id: string; label: string } | null;
}

const BANDS: [RegExp, string, number, number][] = [
  [/\b(uv|ultra ?violet|355 ?nm)\b/i, 'UV (200–400 nm)', 200, 400],
  [/\bblue\b/i, 'Blue (400–500 nm)', 400, 500],
  [/\b(green|532 ?nm)\b/i, 'Green (500–560 nm)', 500, 560],
  [/\b(co2|co₂|10\.6 ?(µm|um)|9\.3 ?(µm|um))\b/i, 'CO₂ (9–11 µm)', 9000, 11000],
  [/\b(ir|infra ?red|near ?ir|1064 ?nm|1 ?(µm|um)|fiber|fibre)\b/i, 'Near-IR (900–1100 nm)', 900, 1100],
];
const REGIMES: [RegExp, ParsedParams['regime']][] = [
  [/\b(femto ?second|fs)\b/i, 'Femtosecond'],
  [/\b(pico ?second|ps)\b/i, 'Picosecond'],
  [/\b(nano ?second|ns|q-?switched)\b/i, 'Nanosecond'],
  [/\b(cw|continuous ?wave)\b/i, 'CW'],
];
const PROCESSES = ['marking', 'engraving', 'etching', 'welding', 'cutting', 'drilling', 'cleaning', 'ablation', 'scribing', 'depaneling', 'texturing', 'micromachining', 'soldering', 'dicing', 'trimming', 'stripping'];
const INDUSTRIES: [RegExp, string, string][] = [
  [/\b(semiconductor|wafer|package|packages|atmp|osat|die)\b/i, 'ind-semi', 'Semiconductor'],
  [/\b(pcb|ems|electronics?|smt)\b/i, 'ind-ems', 'Electronics / EMS'],
  [/\b(battery|batteries|cell|tab|busbar|ev)\b/i, 'ind-battery', 'Battery'],
  [/\b(automotive|car)\b/i, 'ind-auto', 'Automotive'],
  [/\b(medical|implant)\b/i, 'ind-medical', 'Medical'],
  [/\b(aerospace|defen[cs]e)\b/i, 'ind-aero', 'Aerospace'],
];

export function parseParams(q: string): ParsedParams {
  const t = q.replace(/[–—]/g, '-');
  let powerMin: number | null = null;
  let powerMax: number | null = null;
  const kw = (v: string, u: string) => Number(v) * (/k/i.test(u) ? 1000 : 1);
  const range = /(\d+(?:\.\d+)?)\s*(k?w)?\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(k?w)\b/i.exec(t);
  const atLeast = /(?:>=?|≥|at least|over|above|min(?:imum)?)\s*(\d+(?:\.\d+)?)\s*(k?w)\b/i.exec(t);
  const atMost = /(?:<=?|≤|up to|under|below|max(?:imum)?)\s*(\d+(?:\.\d+)?)\s*(k?w)\b/i.exec(t);
  const single = /(\d+(?:\.\d+)?)\s*(k?w)\b/i.exec(t);
  if (range) {
    powerMin = kw(range[1], range[2] ?? range[4]);
    powerMax = kw(range[3], range[4]);
  } else if (atLeast || atMost) {
    if (atLeast) powerMin = kw(atLeast[1], atLeast[2]);
    if (atMost) powerMax = kw(atMost[1], atMost[2]);
  } else if (single) {
    powerMin = powerMax = kw(single[1], single[2]);
  }
  const b = BANDS.find(([re]) => re.test(t));
  const r = REGIMES.find(([re]) => re.test(t));
  const proc = PROCESSES.find((p) => new RegExp(`\\b${p.replace(/ing$/, '')}\\w*`, 'i').test(t)) ?? null;
  const ind = INDUSTRIES.find(([re]) => re.test(t));
  return {
    powerMin,
    powerMax,
    band: b ? { label: b[1], min: b[2], max: b[3] } : null,
    regime: r ? r[1] : null,
    process: proc ? proc[0].toUpperCase() + proc.slice(1) : null,
    industry: ind ? { id: ind[1], label: ind[2] } : null,
  };
}

export const hasParams = (p: ParsedParams) => p.powerMin != null || p.powerMax != null || !!p.band || !!p.regime;

export interface PlatformOffer {
  product: Product;
  source: LaserSource;
  powers: number[];
}
export interface ParametricResult {
  params: ParsedParams;
  filters: string[];
  sources: LaserSource[];
  offers: PlatformOffer[];
  applications: Application[];
  /** when the power filter removed every platform: the same query without it, with all power options */
  nearOffers: PlatformOffer[];
}

const inPower = (w: number, p: ParsedParams) => (p.powerMin == null || w >= p.powerMin) && (p.powerMax == null || w <= p.powerMax);

export function parametricSearch(q: string, records: AnyRecord[]): ParametricResult {
  const params = parseParams(q);
  const res = search(params, records);
  const nearOffers = !res.offers.length && (params.powerMin != null || params.powerMax != null) ? search({ ...params, powerMin: null, powerMax: null }, records).offers : [];
  return { ...res, nearOffers };
}

function search(params: ParsedParams, records: AnyRecord[]): Omit<ParametricResult, 'nearOffers'> {
  const filters: string[] = [];
  if (params.powerMin != null || params.powerMax != null) filters.push(`power ${params.powerMin ?? '…'}–${params.powerMax ?? '…'} W`);
  if (params.band) filters.push(`wavelength ${params.band.label}`);
  if (params.regime) filters.push(`pulse regime ${params.regime}`);
  if (params.process) filters.push(`process ${params.process}`);
  if (params.industry) filters.push(`industry ${params.industry.label}`);

  const sources = (records.filter((r) => r.entity === 'laser_source') as unknown as LaserSource[]).filter((s) => {
    const wl = s.wavelength?.value;
    if (params.band && (wl == null || wl < params.band.min || wl > params.band.max)) return false;
    if (params.regime === 'CW' && s.mode !== 'cw') return false;
    if (params.regime && params.regime !== 'CW' && !s.categories.includes(params.regime as never)) return false;
    return !!(params.band || params.regime);
  });
  const srcKeys = new Set(sources.map((s) => s.id.replace(/^las-/, '')));
  const industryName = params.industry?.label.split(' ')[0].toLowerCase();

  const offers: PlatformOffer[] = [];
  for (const p of records.filter((r) => r.entity === 'product') as unknown as Product[]) {
    if (params.industry && !(p.industries ?? []).includes(params.industry.id)) continue;
    for (const k of p.source_keys ?? []) {
      if ((params.band || params.regime) && !srcKeys.has(k)) continue;
      const list = (p.powers_by_source?.[k]?.length ? p.powers_by_source[k] : p.powers_w) ?? [];
      const powers = list.filter((w) => inPower(w, params));
      if (!powers.length) continue;
      if (params.process && !(p.applications ?? []).some((a) => new RegExp(params.process!.slice(0, 5), 'i').test(`${a.name} ${a.description ?? ''} ${p.title ?? ''}`))) continue;
      const source = sources.find((s) => s.id === `las-${k}`) ?? (records.find((r) => r.id === `las-${k}`) as unknown as LaserSource | undefined);
      if (source) offers.push({ product: p, source, powers });
    }
  }

  const applications = (records.filter((r) => r.entity === 'application') as unknown as Application[]).filter((a) => {
    if (params.process && a.process?.toLowerCase() !== params.process.toLowerCase()) return false;
    if ((params.band || params.regime) && !(a.recommended_source_id && srcKeys.has(a.recommended_source_id.replace(/^las-/, '')))) return false;
    if ((params.powerMin != null || params.powerMax != null) && !(a.recommended_power_w != null && inPower(a.recommended_power_w, params))) return false;
    if (industryName && !(a.industries ?? []).some((i) => i.toLowerCase().startsWith(industryName) || (industryName === 'electronics' && /ems/i.test(i)))) return false;
    return !!(params.process || params.band || params.regime || params.powerMin != null || params.powerMax != null);
  });

  return { params, filters, sources, offers, applications };
}
