import { describe, expect, it } from 'vitest';
import * as Q from '../../src/calculations/quality';

describe('process capability', () => {
  it('Q1 from statistics: tolerance 10σ centred → Cp 1.67, Cpk 1.67; shifted 0.5σ → Cpk 1.5', () => {
    const c = Q.capabilityFromStats({ mean: 0, sigma: 1, lsl: -5, usl: 5 });
    expect(c.cp.value).toBeCloseTo(1.667, 3);
    expect(Q.capabilityFromStats({ mean: 0.5, sigma: 1, lsl: -5, usl: 5 }).cpk.value).toBeCloseTo(1.5, 6);
  });

  it('Q2 lower confidence bound: Cpk 1.50 at n = 50 → 1.24', () => {
    expect(Q.cpkLowerBound({ cpk: 1.5, n: 50 }).value).toBeCloseTo(1.24, 2);
  });

  it('refuses capability from insufficient data (n < 30)', () => {
    const r = Q.capability([1, 2, 3, 2, 1, 2], { lsl: 0, usl: 4 });
    expect(r.status).toBe('INSUFFICIENT_DATA');
    expect(r.cpk.value).toBeNull();
    expect(r.message).toMatch(/Insufficient data/);
  });

  it('refuses capability without specification limits', () => {
    const xs = Array.from({ length: 40 }, (_, i) => 10 + Math.sin(i));
    expect(Q.capability(xs, {}).status).toBe('INSUFFICIENT_DATA');
  });

  it('computes Cp/Cpk/Pp/Ppk and summary stats with enough data', () => {
    const xs = Array.from({ length: 50 }, (_, i) => 10 + 0.1 * Math.sin(i * 1.7) + 0.05 * Math.cos(i * 0.9));
    const r = Q.capability(xs, { lsl: 9, usl: 11 });
    expect(r.status).toBe('CALCULATED');
    expect(r.n).toBe(50);
    expect(r.pp.value).toBeGreaterThan(1);
    expect(r.ppk.value).toBeLessThanOrEqual(r.pp.value!);
    expect(r.cpk.value).toBeLessThanOrEqual(r.cp.value!);
    expect(r.min).toBeLessThan(r.max!);
  });

  it('one-sided Cpk works with only USL', () => {
    const xs = Array.from({ length: 40 }, (_, i) => 5 + (i % 5) * 0.1);
    const r = Q.capability(xs, { usl: 7 });
    expect(r.cpk.status).toBe('CALCULATED');
    expect(r.cp.status).toBe('INSUFFICIENT_DATA');
  });

  it('yield and DPPM', () => {
    const y = Q.yieldFromCounts({ good: 9850, total: 10000 });
    expect(y.yield.value).toBeCloseTo(0.985, 6);
    expect(y.defect_ppm.value).toBeCloseTo(15000, 6);
  });

  it('K13/K14 rolled throughput yield and required starts', () => {
    const rty = Q.rolledThroughputYield({ fpy: [0.995, 0.99, 0.994] });
    expect(rty.value).toBeCloseTo(0.979, 3);
    // handbook K14 quotes 10,215 using RTY rounded to 97.9 %; unrounded RTY gives 10,213
    expect(Q.requiredStarts({ good: 10000, rty: rty.value }).value).toBeCloseTo(10213, 0);
    expect(Q.requiredStarts({ good: 10000, rty: 0.979 }).value).toBeCloseTo(10214.5, 0);
  });

  it('Q6 DOE runs and full factorial', () => {
    expect(Q.doeRuns({ factors: 5, fraction: 1, replicates: 2, centre_points: 3 }).value).toBe(35);
    expect(Q.fullFactorialRuns([3, 3, 2])).toBe(18);
  });

  it('Q10 RPN and bounds', () => {
    expect(Q.rpn({ severity: 8, occurrence: 3, detection: 9 }).value).toBe(216);
    expect(Q.rpn({ severity: 11, occurrence: 3, detection: 9 }).status).toBe('INSUFFICIENT_DATA');
  });

  it('Q7 window margin', () => {
    expect(Q.windowMargin({ x: 50, x_min: 40, x_max: 60, sigma: 1 }).value).toBeCloseTo(3.333, 3);
  });
});
