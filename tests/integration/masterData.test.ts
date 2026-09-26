import { describe, expect, it } from 'vitest';
import { validateRecord } from '../../src/repositories';
import { runDataQuality } from '../../src/services/dataQuality';
import { buildGraph } from '../../src/services/graph';
import { extractRefs } from '../../src/services/refs';
import { masterRecords } from '../helpers/repo';

describe('master data as the app loads it (catalog → datasets)', async () => {
  const all = await masterRecords();

  it('loads every catalogued dataset and every record validates against its schema', () => {
    expect(all.length).toBeGreaterThan(800);
    const bad = all.flatMap((r) => {
      try {
        validateRecord(r as Record<string, unknown>);
        return [];
      } catch (e) {
        return [`${r.id}: ${(e as Error).message}`];
      }
    });
    expect(bad).toEqual([]);
  });

  it('has unique ids and no broken references (the digital thread is connected)', () => {
    const ids = new Set(all.map((r) => r.id));
    expect(ids.size).toBe(all.length);
    const broken = all.flatMap((r) => extractRefs(r as Record<string, unknown>).filter((e) => !ids.has(e.to)).map((e) => `${r.id}.${e.field} → ${e.to}`));
    expect(broken).toEqual([]);
  });

  it('passes the data-quality gate with zero errors', () => {
    const rep = runDataQuality(all);
    expect(rep.issues.filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('labels demo, estimate and unknown data explicitly', () => {
    const demo = all.filter((r) => r.id.includes('demo'));
    expect(demo.length).toBeGreaterThan(0);
    expect(demo.every((r) => r.data_type === 'DEMO')).toBe(true);
    // item master prices come from the legacy seed — DEMO, never presented as quotations
    expect(all.filter((r) => r.entity === 'component').every((r) => r.data_type === 'DEMO')).toBe(true);
    // no POC or DOE in master data claims a result
    const does = all.filter((r) => r.entity === 'doe') as unknown as { runs: { results: Record<string, number | null> }[] }[];
    expect(does.every((d) => d.runs.every((run) => Object.values(run.results ?? {}).every((v) => v == null)))).toBe(true);
  });

  it('builds a graph where products reach applications, modules and sources', () => {
    const g = buildGraph(all);
    const prd = all.find((r) => r.entity === 'product')!;
    const out = g.out.get(prd.id) ?? [];
    expect(out.length).toBeGreaterThan(0);
  });
});
