/**
 * BUSINESS CASE (ultimate spec §74–76). Deterministic cash-flow model over the user's own inputs:
 * nothing is looked up or assumed — every number in the output traces to an input. Results are
 * ESTIMATES until the inputs themselves are sourced.
 *
 *   units_y      = units_1 × (1 + growth)^(y−1)
 *   revenue_y    = units_y × price
 *   gross_y      = units_y × (price − unit_cost)
 *   cash_y       = gross_y − fixed_annual            (year 0: −investment)
 *   NPV          = Σ cash_y / (1 + r)^y ,  y = 0…N
 *   payback      = first year the cumulative cash ≥ 0 (linear within the year)
 */
export interface BusinessCaseInput {
  price: number;
  unitCost: number;
  unitsYear1: number;
  growthPct: number;
  investment: number;
  fixedAnnual: number;
  years: number;
  discountPct: number;
}

export interface YearRow {
  year: number;
  units: number;
  revenue: number;
  gross: number;
  cash: number;
  cumulative: number;
}

export interface BusinessCaseResult {
  rows: YearRow[];
  npv: number;
  totalRevenue: number;
  grossMarginPct: number | null;
  paybackYears: number | null;
  roiPct: number | null;
}

export function businessCase(p: BusinessCaseInput): BusinessCaseResult {
  const years = Math.max(1, Math.min(15, Math.round(p.years)));
  const r = p.discountPct / 100;
  const rows: YearRow[] = [{ year: 0, units: 0, revenue: 0, gross: 0, cash: -p.investment, cumulative: -p.investment }];
  let npv = -p.investment;
  let cum = -p.investment;
  let payback: number | null = p.investment <= 0 ? 0 : null;
  for (let y = 1; y <= years; y++) {
    const units = p.unitsYear1 * Math.pow(1 + p.growthPct / 100, y - 1);
    const revenue = units * p.price;
    const gross = units * (p.price - p.unitCost);
    const cash = gross - p.fixedAnnual;
    const prev = cum;
    cum += cash;
    npv += cash / Math.pow(1 + r, y);
    if (payback == null && cum >= 0 && cash > 0) payback = y - 1 + -prev / cash;
    rows.push({ year: y, units, revenue, gross, cash, cumulative: cum });
  }
  const totalRevenue = rows.reduce((s, x) => s + x.revenue, 0);
  const totalGross = rows.reduce((s, x) => s + x.gross, 0);
  return {
    rows,
    npv,
    totalRevenue,
    grossMarginPct: totalRevenue ? (totalGross / totalRevenue) * 100 : null,
    paybackYears: payback,
    /** net cumulative cash over the horizon ÷ investment */
    roiPct: p.investment > 0 ? (cum / p.investment) * 100 : null,
  };
}

export type SensitivityKey = 'price' | 'unitCost' | 'unitsYear1' | 'investment' | 'fixedAnnual';
export const SENSITIVITY_LABEL: Record<SensitivityKey, string> = { price: 'Selling price', unitCost: 'Unit cost', unitsYear1: 'Volume', investment: 'Investment', fixedAnnual: 'Fixed annual cost' };

/** One-at-a-time sensitivity: NPV when each input moves by ±pct, sorted by swing (tornado order). */
export function sensitivity(p: BusinessCaseInput, pct = 10): { key: SensitivityKey; low: number; high: number; swing: number }[] {
  const keys: SensitivityKey[] = ['price', 'unitCost', 'unitsYear1', 'investment', 'fixedAnnual'];
  return keys
    .map((key) => {
      const low = businessCase({ ...p, [key]: p[key] * (1 - pct / 100) }).npv;
      const high = businessCase({ ...p, [key]: p[key] * (1 + pct / 100) }).npv;
      return { key, low, high, swing: Math.abs(high - low) };
    })
    .sort((a, b) => b.swing - a.swing);
}

export interface MarketFigure {
  value: number | null;
  source: string;
  year: string;
}

/** TAM ⊇ SAM ⊇ SOM checks. A figure without a source is flagged, never silently used. */
export function marketChecks(tam: MarketFigure, sam: MarketFigure, som: MarketFigure): string[] {
  const issues: string[] = [];
  for (const [n, f] of [['TAM', tam], ['SAM', sam], ['SOM', som]] as const) if (f.value != null && !f.source.trim()) issues.push(`${n} has no source — treat it as UNSOURCED, not as a market number.`);
  if (tam.value != null && sam.value != null && sam.value > tam.value) issues.push('SAM is larger than TAM — the serviceable market must be a subset of the total market.');
  if (sam.value != null && som.value != null && som.value > sam.value) issues.push('SOM is larger than SAM — the obtainable share must be a subset of the serviceable market.');
  return issues;
}
