import { rng } from '../sim/model';

/*
 * DESIGN OF EXPERIMENTS (AI master prompt §24). Plans, never results: every plan is labelled
 * "GENERATED EXPERIMENT PLAN" and holds no response values. Designs: full factorial, 2-level
 * fractional factorial (half fraction, highest-order generator), Latin hypercube (seeded — the same
 * seed gives the same plan) and face-centred central composite for response surfaces.
 */

export interface DoeFactor {
  name: string;
  unit?: string;
  low: number;
  high: number;
  /** explicit levels (full factorial); defaults to [low, high] */
  levels?: number[];
}

export type DesignKind = 'full_factorial' | 'fractional_factorial' | 'latin_hypercube' | 'central_composite';

export interface DoeRun {
  run: number;
  settings: Record<string, number>;
  /** axial / centre point marker for composite designs */
  kind?: 'factorial' | 'axial' | 'center';
}

export interface DoePlan {
  kind: DesignKind;
  label: 'GENERATED EXPERIMENT PLAN — not a result';
  factors: DoeFactor[];
  runs: DoeRun[];
  notes: string[];
}

const LABEL = 'GENERATED EXPERIMENT PLAN — not a result' as const;
const round = (v: number) => Math.round(v * 1e6) / 1e6;

export function fullFactorial(factors: DoeFactor[]): DoePlan {
  const lv = factors.map((f) => f.levels?.length ? f.levels : [f.low, f.high]);
  const runs: DoeRun[] = [];
  const rec = (i: number, acc: Record<string, number>) => {
    if (i === factors.length) {
      runs.push({ run: runs.length + 1, settings: acc, kind: 'factorial' });
      return;
    }
    for (const l of lv[i]) rec(i + 1, { ...acc, [factors[i].name]: l });
  };
  rec(0, {});
  return { kind: 'full_factorial', label: LABEL, factors, runs, notes: [`${runs.length} runs = ${lv.map((l) => l.length).join(' × ')} levels`, 'Randomise the run order on the machine; replicate the centre if the response is noisy'] };
}

/** 2^(k−1) half fraction: the last factor is aliased with the product of the others (resolution k). */
export function fractionalFactorial(factors: DoeFactor[]): DoePlan {
  const k = factors.length;
  if (k < 3) return { ...fullFactorial(factors), notes: ['Fewer than 3 factors — a fraction saves nothing; full factorial used'] };
  const runs: DoeRun[] = [];
  for (let i = 0; i < 1 << (k - 1); i++) {
    const signs: number[] = Array.from({ length: k - 1 }, (_, j) => ((i >> j) & 1 ? 1 : -1));
    signs.push(signs.reduce((a, b) => a * b, 1));
    runs.push({ run: runs.length + 1, settings: Object.fromEntries(factors.map((f, j) => [f.name, signs[j] > 0 ? f.high : f.low])), kind: 'factorial' });
  }
  const res = ['', '', '', 'III', 'IV', 'V', 'VI', 'VII'][k] ?? `${k}`;
  return { kind: 'fractional_factorial', label: LABEL, factors, runs, notes: [`2^(${k}−1) = ${runs.length} runs, resolution ${res}: ${factors[k - 1].name} = ${factors.slice(0, -1).map((f) => f.name).join(' × ')}`, 'Main effects are aliased with the highest-order interaction only'] };
}

export function latinHypercube(factors: DoeFactor[], n: number, seed = 1): DoePlan {
  const r = rng(seed);
  const cols = factors.map(() => {
    const perm = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    return perm.map((p) => (p + r()) / n);
  });
  const runs = Array.from({ length: n }, (_, i) => ({ run: i + 1, settings: Object.fromEntries(factors.map((f, j) => [f.name, round(f.low + cols[j][i] * (f.high - f.low))])) }));
  return { kind: 'latin_hypercube', label: LABEL, factors, runs, notes: [`${n} space-filling runs, seed ${seed} (same seed → same plan)`, 'Good for building a surrogate model; not for estimating interactions by ANOVA'] };
}

export function centralComposite(factors: DoeFactor[], centers = 3): DoePlan {
  const ff = fullFactorial(factors.map((f) => ({ ...f, levels: [f.low, f.high] })));
  const mid = (f: DoeFactor) => round((f.low + f.high) / 2);
  const runs: DoeRun[] = ff.runs.map((r) => ({ ...r, kind: 'factorial' as const }));
  for (const f of factors) {
    for (const v of [f.low, f.high]) runs.push({ run: 0, settings: Object.fromEntries(factors.map((g) => [g.name, g === f ? v : mid(g)])), kind: 'axial' });
  }
  for (let c = 0; c < centers; c++) runs.push({ run: 0, settings: Object.fromEntries(factors.map((g) => [g.name, mid(g)])), kind: 'center' });
  runs.forEach((r, i) => (r.run = i + 1));
  return { kind: 'central_composite', label: LABEL, factors, runs, notes: [`Face-centred CCD: ${ff.runs.length} factorial + ${2 * factors.length} axial + ${centers} centre = ${runs.length} runs`, 'Supports a quadratic response-surface model'] };
}

export function design(kind: DesignKind, factors: DoeFactor[], opts: { n?: number; seed?: number } = {}): DoePlan {
  if (kind === 'fractional_factorial') return fractionalFactorial(factors);
  if (kind === 'latin_hypercube') return latinHypercube(factors, opts.n ?? Math.max(8, factors.length * 4), opts.seed ?? 1);
  if (kind === 'central_composite') return centralComposite(factors);
  return fullFactorial(factors);
}
