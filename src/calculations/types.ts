/**
 * Every calculation in the OS returns a CalcResult (spec §36, §86): the formula, the inputs
 * with units, the result with its unit, the assumptions and the source. The UI renders this
 * in the WHY? drawer, so no number appears without its derivation.
 */
export interface CalcInput {
  symbol: string;
  label: string;
  value: number | null;
  unit: string;
}

export interface CalcSource {
  /** Human-readable citation, e.g. "Automation Handbook Part 54, L1" */
  citation: string;
  /** Knowledge-base ref `book/file.md#anchor`, when the source is a handbook section */
  ref?: string;
  /** Formula catalogue id (fml-…), when applicable */
  formula_id?: string;
}

export interface CalcResult {
  id: string;
  label: string;
  formula: string;
  inputs: CalcInput[];
  value: number | null;
  unit: string;
  assumptions: string[];
  source: CalcSource;
  /** CALCULATED when every input was present; INSUFFICIENT_DATA otherwise (value = null) */
  status: 'CALCULATED' | 'INSUFFICIENT_DATA';
  warnings: string[];
}

const HB54 = 'automation/76-part-54-engineering-calculation-handbook.md';
export const PART54_REFS = {
  mechanical: `${HB54}#54-1-mechanical`,
  motion: `${HB54}#54-3-motion`,
  pneumatics: `${HB54}#54-4-pneumatics-and-vacuum`,
  electrical: `${HB54}#54-5-electrical-controls-and-networks`,
  performance: `${HB54}#54-6-machine-performance-reliability-and-quality`,
  laser: `${HB54}#54-7-laser-optics-and-vision`,
  cost: `${HB54}#54-8-safety-cost-and-project`,
} as const;

export function part54(code: string, group: keyof typeof PART54_REFS): CalcSource {
  return { citation: `Automation Equipment Building Handbook, Part 54 — formula ${code}`, ref: PART54_REFS[group], formula_id: `fml-${code.toLowerCase()}` };
}

const isNum = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Build a CalcResult. `compute` runs only when every input is a finite number; otherwise the
 * result is INSUFFICIENT_DATA with value null — never a guessed number.
 */
export function calc(
  meta: { id: string; label: string; formula: string; unit: string; source: CalcSource; assumptions?: string[] },
  inputs: CalcInput[],
  compute: (v: Record<string, number>) => number,
  validate?: (v: Record<string, number>) => string | null,
): CalcResult {
  const missing = inputs.filter((i) => !isNum(i.value));
  const base = { ...meta, inputs, assumptions: meta.assumptions ?? [], warnings: [] as string[] };
  if (missing.length) {
    return { ...base, value: null, status: 'INSUFFICIENT_DATA', warnings: [`Missing input: ${missing.map((m) => m.label).join(', ')}`] };
  }
  const v = Object.fromEntries(inputs.map((i) => [i.symbol, i.value as number]));
  const err = validate?.(v);
  if (err) return { ...base, value: null, status: 'INSUFFICIENT_DATA', warnings: [err] };
  const value = compute(v);
  if (!Number.isFinite(value)) return { ...base, value: null, status: 'INSUFFICIENT_DATA', warnings: ['Result is not a finite number for these inputs'] };
  return { ...base, value, status: 'CALCULATED' };
}

export const input = (symbol: string, label: string, value: number | null | undefined, unit: string): CalcInput => ({
  symbol,
  label,
  value: isNum(value) ? value : null,
  unit,
});

export const positive = (...keys: string[]) => (v: Record<string, number>) => {
  const bad = keys.filter((k) => !(v[k] > 0));
  return bad.length ? `Must be > 0: ${bad.join(', ')}` : null;
};
