import { rng } from '../sim/model';
import type { DoeFactor } from './doe';

/*
 * BAYESIAN OPTIMISATION (AI master prompt §23, §25). Gaussian-process surrogate (RBF kernel on
 * normalised inputs, standardised outputs, length-scale chosen by marginal likelihood) + expected
 * improvement over a seeded candidate set. It fits ONLY on measured results — below MIN_RUNS it
 * refuses (DATA REQUIRED). Every suggestion carries the posterior mean ± σ and the sample count;
 * a suggestion is the next experiment to run, not a predicted outcome to rely on.
 */

export const MIN_RUNS = 5;

export interface Observation {
  x: Record<string, number>;
  y: number;
}

export type BoResult =
  | { status: 'DATA REQUIRED'; have: number; need: number; message: string }
  | {
      status: 'OK';
      next: Record<string, number>;
      mean: number;
      sd: number;
      ei: number;
      best: Observation;
      n: number;
      lengthScale: number;
      /** σ relative to the observed y range — the confidence engine's model-uncertainty signal */
      relSd: number;
      notes: string[];
    };

function cholesky(A: number[][]): number[][] | null {
  const n = A.length;
  const L = A.map(() => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      if (i === j) {
        if (s <= 0) return null;
        L[i][i] = Math.sqrt(s);
      } else L[i][j] = s / L[j][j];
    }
  }
  return L;
}
const solveL = (L: number[][], b: number[]) => {
  const y = new Array<number>(b.length).fill(0);
  for (let i = 0; i < b.length; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * y[k];
    y[i] = s / L[i][i];
  }
  return y;
};
const solveLt = (L: number[][], y: number[]) => {
  const n = y.length;
  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i];
    for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k];
    x[i] = s / L[i][i];
  }
  return x;
};
const rbf = (a: number[], b: number[], l: number) => Math.exp(-a.reduce((s, ai, i) => s + (ai - b[i]) ** 2, 0) / (2 * l * l));

function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
const Phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));
const phi = (z: number) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

export interface GpModel {
  predict: (x: number[]) => { mean: number; sd: number };
  lengthScale: number;
  logLik: number;
}

/** Fit a GP to normalised inputs X (0–1) and raw y. */
export function fitGp(X: number[][], y: number[], noise = 1e-4): GpModel | null {
  const n = y.length;
  const mu = y.reduce((a, b) => a + b, 0) / n;
  const sdY = Math.sqrt(y.reduce((a, b) => a + (b - mu) ** 2, 0) / Math.max(1, n - 1)) || 1;
  const ys = y.map((v) => (v - mu) / sdY);
  let best: (GpModel & { L: number[][]; alpha: number[] }) | null = null;
  for (const l of [0.08, 0.12, 0.18, 0.25, 0.35, 0.5, 0.7, 1, 1.5]) {
    const K = X.map((a, i) => X.map((b, j) => rbf(a, b, l) + (i === j ? noise + 1e-8 : 0)));
    const L = cholesky(K);
    if (!L) continue;
    const alpha = solveLt(L, solveL(L, ys));
    const logLik = -0.5 * ys.reduce((s, v, i) => s + v * alpha[i], 0) - L.reduce((s, row, i) => s + Math.log(row[i]), 0) - (n / 2) * Math.log(2 * Math.PI);
    if (!best || logLik > best.logLik) {
      const LL = L;
      const al = alpha;
      const ll = l;
      best = {
        L: LL,
        alpha: al,
        lengthScale: ll,
        logLik,
        predict: (x) => {
          const k = X.map((a) => rbf(a, x, ll));
          const m = k.reduce((s, v, i) => s + v * al[i], 0);
          const v = solveL(LL, k);
          const varS = Math.max(1e-12, 1 - v.reduce((s, q) => s + q * q, 0));
          return { mean: mu + m * sdY, sd: Math.sqrt(varS) * sdY };
        },
      };
    }
  }
  return best;
}

export function suggestNext(factors: DoeFactor[], obs: Observation[], goal: 'max' | 'min', seed = 7): BoResult {
  const valid = obs.filter((o) => Number.isFinite(o.y) && factors.every((f) => Number.isFinite(o.x[f.name])));
  if (valid.length < MIN_RUNS) return { status: 'DATA REQUIRED', have: valid.length, need: MIN_RUNS, message: `Bayesian optimisation needs at least ${MIN_RUNS} measured runs; ${valid.length} recorded. Run a DOE first — no suggestion is made from fewer points.` };
  const norm = (x: Record<string, number>) => factors.map((f) => (f.high === f.low ? 0.5 : (x[f.name] - f.low) / (f.high - f.low)));
  const sign = goal === 'max' ? 1 : -1;
  const X = valid.map((o) => norm(o.x));
  const y = valid.map((o) => sign * o.y);
  const gp = fitGp(X, y);
  if (!gp) return { status: 'DATA REQUIRED', have: valid.length, need: MIN_RUNS, message: 'The surrogate could not be fitted (duplicate or degenerate points) — add distinct runs.' };
  const fBest = Math.max(...y);
  const r = rng(seed);
  let top: { x: number[]; ei: number; mean: number; sd: number } | null = null;
  for (let c = 0; c < 1024; c++) {
    const x = factors.map(() => r());
    const { mean, sd } = gp.predict(x);
    const z = (mean - fBest - 0.01) / sd;
    const ei = (mean - fBest - 0.01) * Phi(z) + sd * phi(z);
    if (!top || ei > top.ei) top = { x, ei, mean, sd };
  }
  const next = Object.fromEntries(factors.map((f, i) => [f.name, Math.round((f.low + top!.x[i] * (f.high - f.low)) * 1000) / 1000]));
  const bestObs = valid[y.indexOf(fBest)];
  const range = Math.max(...valid.map((o) => o.y)) - Math.min(...valid.map((o) => o.y)) || 1;
  return {
    status: 'OK',
    next,
    mean: sign * top!.mean,
    sd: top!.sd,
    ei: top!.ei,
    best: bestObs,
    n: valid.length,
    lengthScale: gp.lengthScale,
    relSd: top!.sd / range,
    notes: [`GP fitted on ${valid.length} measured runs (length-scale ${gp.lengthScale} of the normalised range)`, 'Expected improvement over 1 024 seeded candidates within the factor bounds', 'The suggestion is the next experiment to run — measure it and add the result'],
  };
}
