import { calc, input, part54, positive, type CalcResult } from './types';

/**
 * Quality calculations (spec §37). Capability indices are refused below MIN_SAMPLES — the spec
 * forbids calculating capability from insufficient data. 30 is an ASSUMED minimum (common
 * practice); the handbook's confidence bound (Q2) shows why small n is misleading.
 */
export const MIN_SAMPLES = 30;

export interface CapabilityReport {
  n: number;
  mean: number | null;
  sigma_overall: number | null;
  sigma_within: number | null;
  min: number | null;
  max: number | null;
  lsl: number | null;
  usl: number | null;
  cp: CalcResult;
  cpk: CalcResult;
  pp: CalcResult;
  ppk: CalcResult;
  cpk_lower_bound: CalcResult;
  status: 'CALCULATED' | 'INSUFFICIENT_DATA';
  message: string;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stdev = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1));
};
/** Short-term σ for individuals: MR̄ / d₂ (d₂ = 1.128 for n = 2 moving ranges) */
const sigmaMovingRange = (xs: number[]) => {
  const mr = xs.slice(1).map((x, i) => Math.abs(x - xs[i]));
  return mean(mr) / 1.128;
};

function capIndex(id: string, label: string, formula: string, code: string, sig: number | null, m: number | null, lsl: number | null, usl: number | null, kind: 'cp' | 'cpk', sigmaLabel: string, n: number): CalcResult {
  const needBoth = kind === 'cp';
  const r = calc(
    {
      id,
      label,
      formula,
      unit: '',
      source: part54(code, 'performance'),
      assumptions: [
        `σ = ${sigmaLabel}`,
        'Process assumed stable and approximately normal — check a control chart first',
        `Minimum sample size ${MIN_SAMPLES} (assumption)`,
      ],
    },
    [
      input('σ', sigmaLabel, sig, ''),
      input('μ', 'Mean', m, ''),
      // Cp needs both limits; Cpk works one-sided, so only present limits are inputs.
      ...(needBoth || lsl != null ? [input('LSL', 'Lower spec limit', lsl, '')] : []),
      ...(needBoth || usl != null ? [input('USL', 'Upper spec limit', usl, '')] : []),
      ...(!needBoth && lsl == null && usl == null ? [input('USL', 'Upper or lower spec limit', null, '')] : []),
      input('n', 'Sample size', n, ''),
    ],
    (v) => {
      if (kind === 'cp') return (v.USL - v.LSL) / (6 * v['σ']);
      const up = 'USL' in v ? (v.USL - v['μ']) / (3 * v['σ']) : Infinity;
      const lo = 'LSL' in v ? (v['μ'] - v.LSL) / (3 * v['σ']) : Infinity;
      return Math.min(up, lo);
    },
    (v) => (v.n < MIN_SAMPLES ? `Insufficient data: n = ${v.n} < ${MIN_SAMPLES}` : v['σ'] > 0 ? null : 'σ must be > 0'),
  );
  return r;
}

export function capability(values: number[], limits: { lsl?: number | null; usl?: number | null }): CapabilityReport {
  const xs = values.filter((x) => Number.isFinite(x));
  const n = xs.length;
  const lsl = limits.lsl ?? null;
  const usl = limits.usl ?? null;
  const enough = n >= MIN_SAMPLES;
  const m = n ? mean(xs) : null;
  const so = n > 1 ? stdev(xs) : null;
  const sw = n > 2 ? sigmaMovingRange(xs) : null;
  const cp = capIndex('cp', 'Cp (short-term)', 'Cp = (USL − LSL) / (6σ_within)', 'Q1', sw, m, lsl, usl, 'cp', 'σ_within = MR̄ / 1.128 (individuals)', n);
  const cpk = capIndex('cpk', 'Cpk (short-term)', 'Cpk = min(USL − μ, μ − LSL) / (3σ_within)', 'Q1', sw, m, lsl, usl, 'cpk', 'σ_within = MR̄ / 1.128 (individuals)', n);
  const pp = capIndex('pp', 'Pp (overall)', 'Pp = (USL − LSL) / (6σ_overall)', 'Q1', so, m, lsl, usl, 'cp', 'σ_overall = sample standard deviation', n);
  const ppk = capIndex('ppk', 'Ppk (overall)', 'Ppk = min(USL − μ, μ − LSL) / (3σ_overall)', 'Q1', so, m, lsl, usl, 'cpk', 'σ_overall = sample standard deviation', n);
  const lb = cpkLowerBound({ cpk: cpk.value, n });
  const noLimits = lsl == null && usl == null;
  return {
    n,
    mean: m,
    sigma_overall: so,
    sigma_within: sw,
    min: n ? Math.min(...xs) : null,
    max: n ? Math.max(...xs) : null,
    lsl,
    usl,
    cp,
    cpk,
    pp,
    ppk,
    cpk_lower_bound: lb,
    status: enough && !noLimits ? 'CALCULATED' : 'INSUFFICIENT_DATA',
    message: noLimits ? 'No specification limits — capability cannot be calculated.' : enough ? `Calculated from n = ${n}.` : `Insufficient data: n = ${n}; at least ${MIN_SAMPLES} measurements required.`,
  };
}

/** Q1 from summary statistics (e.g. a supplier report) */
export function capabilityFromStats(p: { mean?: number | null; sigma?: number | null; lsl?: number | null; usl?: number | null }): { cp: CalcResult; cpk: CalcResult } {
  const cp = calc(
    { id: 'cp', label: 'Cp', formula: 'Cp = (USL − LSL) / (6σ)', unit: '', source: part54('Q1', 'performance') },
    [input('USL', 'USL', p.usl, ''), input('LSL', 'LSL', p.lsl, ''), input('σ', 'σ', p.sigma, '')],
    (v) => (v.USL - v.LSL) / (6 * v['σ']),
    positive('σ'),
  );
  const cpk = calc(
    { id: 'cpk', label: 'Cpk', formula: 'Cpk = min(USL − μ, μ − LSL) / (3σ)', unit: '', source: part54('Q1', 'performance') },
    [input('USL', 'USL', p.usl, ''), input('LSL', 'LSL', p.lsl, ''), input('μ', 'Mean', p.mean, ''), input('σ', 'σ', p.sigma, '')],
    (v) => Math.min(v.USL - v['μ'], v['μ'] - v.LSL) / (3 * v['σ']),
    positive('σ'),
  );
  return { cp, cpk };
}

/** Q2 — Cpk lower confidence bound Cpk_L ≈ Cpk − z·√(1/(9n) + Cpk²/(2(n−1))) */
export function cpkLowerBound(p: { cpk?: number | null; n?: number | null; z?: number }): CalcResult {
  return calc(
    { id: 'cpk_lb', label: 'Cpk lower confidence bound', formula: 'Cpk_L ≈ Cpk − z·√(1/(9n) + Cpk²/(2(n−1)))', unit: '', source: part54('Q2', 'performance'), assumptions: ['z = 1.645 (one-sided 95 %) unless stated'] },
    [input('Cpk', 'Cpk', p.cpk, ''), input('n', 'Sample size', p.n, ''), input('z', 'z', p.z ?? 1.645, '')],
    (v) => v.Cpk - v.z * Math.sqrt(1 / (9 * v.n) + (v.Cpk * v.Cpk) / (2 * (v.n - 1))),
    (v) => (v.n < 2 ? 'n must be ≥ 2' : null),
  );
}

/** Yield and defect rate from counts */
export function yieldFromCounts(p: { good?: number | null; total?: number | null }): { yield: CalcResult; defect_ppm: CalcResult } {
  const src = part54('K13', 'performance');
  const y = calc(
    { id: 'yield', label: 'Yield (first pass)', formula: 'Y = N_good / N_total', unit: '', source: src },
    [input('good', 'Good units', p.good, 'units'), input('total', 'Total units', p.total, 'units')],
    (v) => v.good / v.total,
    (v) => (v.total > 0 && v.good <= v.total && v.good >= 0 ? null : 'Require 0 ≤ good ≤ total, total > 0'),
  );
  const d = calc(
    { id: 'defect_ppm', label: 'Defect rate', formula: 'DPPM = (1 − Y)·10⁶', unit: 'ppm', source: src },
    [input('good', 'Good units', p.good, 'units'), input('total', 'Total units', p.total, 'units')],
    (v) => (1 - v.good / v.total) * 1e6,
    (v) => (v.total > 0 && v.good <= v.total && v.good >= 0 ? null : 'Require 0 ≤ good ≤ total, total > 0'),
  );
  return { yield: y, defect_ppm: d };
}

/** K13 — rolled throughput yield RTY = Π FPY_i */
export function rolledThroughputYield(p: { fpy?: number[] | null }): CalcResult {
  const prod = p.fpy?.length ? p.fpy.reduce((a, b) => a * b, 1) : null;
  return calc({ id: 'rty', label: 'Rolled throughput yield', formula: 'RTY = Π FPY_i', unit: '', source: part54('K13', 'performance') }, [input('RTY', 'Π FPY_i', prod, '')], (v) => v.RTY);
}

/** K14 — required starts Q_start = Q_good / RTY */
export function requiredStarts(p: { good?: number | null; rty?: number | null }): CalcResult {
  return calc(
    { id: 'required_starts', label: 'Required starts', formula: 'Q_start = Q_good / RTY', unit: 'units', source: part54('K14', 'performance') },
    [input('Qg', 'Good units required', p.good, 'units'), input('RTY', 'RTY', p.rty, '')],
    (v) => v.Qg / v.RTY,
    positive('RTY'),
  );
}

/** Q6 — DOE runs N = 2^(k−p)·r + n_c (two-level designs) */
export function doeRuns(p: { factors?: number | null; fraction?: number | null; replicates?: number | null; centre_points?: number | null }): CalcResult {
  return calc(
    { id: 'doe_runs', label: 'DOE runs (two-level)', formula: 'N = 2^(k−p)·r + n_c', unit: 'runs', source: part54('Q6', 'performance') },
    [input('k', 'Factors', p.factors, ''), input('p', 'Fraction', p.fraction ?? 0, ''), input('r', 'Replicates', p.replicates ?? 1, ''), input('nc', 'Centre points', p.centre_points ?? 0, '')],
    (v) => Math.pow(2, v.k - v.p) * v.r + v.nc,
  );
}

/** Full-factorial run count for arbitrary levels: Π levels × replicates */
export function fullFactorialRuns(levels: number[], replicates = 1): number {
  return levels.reduce((a, b) => a * b, 1) * replicates;
}

/** Q7 — process-window margin M_w = min(x_max − x, x − x_min) / (3σ_x) */
export function windowMargin(p: { x?: number | null; x_min?: number | null; x_max?: number | null; sigma?: number | null }): CalcResult {
  return calc(
    { id: 'window_margin', label: 'Process-window margin', formula: 'M_w = min(x_max − x, x − x_min) / (3σ_x)', unit: '', source: part54('Q7', 'performance'), assumptions: ['Handbook target M_w ≥ 2'] },
    [input('x', 'Set point', p.x, ''), input('xmin', 'Window minimum', p.x_min, ''), input('xmax', 'Window maximum', p.x_max, ''), input('σ', 'σ of the set point', p.sigma, '')],
    (v) => Math.min(v.xmax - v.x, v.x - v.xmin) / (3 * v['σ']),
    positive('σ'),
  );
}

/** Q10 — FMEA risk priority number RPN = S·O·D */
export function rpn(p: { severity?: number | null; occurrence?: number | null; detection?: number | null }): CalcResult {
  return calc(
    { id: 'rpn', label: 'Risk priority number', formula: 'RPN = S·O·D', unit: '', source: part54('Q10', 'performance'), assumptions: ['Rank severity first: a high S needs action regardless of RPN'] },
    [input('S', 'Severity', p.severity, ''), input('O', 'Occurrence', p.occurrence, ''), input('D', 'Detection', p.detection, '')],
    (v) => v.S * v.O * v.D,
    (v) => (['S', 'O', 'D'].some((k) => v[k] < 1 || v[k] > 10) ? 'S, O, D must be 1–10' : null),
  );
}
