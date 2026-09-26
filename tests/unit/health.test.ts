import { describe, expect, it } from 'vitest';
import type { AnyRecord } from '../../src/domain';
import { composeAnswer } from '../../src/services/ask';
import { findDuplicates, normaliseName } from '../../src/services/duplicates';
import { buildGraph } from '../../src/services/graph';
import { entityHealth, isUnknownValue } from '../../src/services/health';
import type { Hit } from '../../src/services/search';

const rec = (x: Record<string, unknown>) => ({ data_type: 'TEAL_INTERNAL', provenance: { verification_status: 'VERIFIED' }, ...x }) as unknown as AnyRecord;
const today = '2026-09-10';

describe('entity health', () => {
  it('treats UNKNOWN, empty and null quantities as unknown', () => {
    expect(isUnknownValue(null)).toBe(true);
    expect(isUnknownValue('UNKNOWN')).toBe(true);
    expect(isUnknownValue({ value: null, unit: 'W' })).toBe(true);
    expect(isUnknownValue([])).toBe(true);
    expect(isUnknownValue(0)).toBe(false);
    expect(isUnknownValue({ value: 20, unit: 'W' })).toBe(false);
  });

  it('marks overdue active work At Risk and explains why', () => {
    const r = rec({ id: 'opp-a', entity: 'opportunity', name: 'A', stage: 'Discovery', value: 100, next_action: { action: 'Call', due: '2026-09-01' } });
    const h = entityHealth(r, buildGraph([r]), today);
    expect(h.status).toBe('At Risk');
    expect(h.dimensions.find((d) => d.key === 'timeliness')?.reason).toMatch(/Overdue by 9/);
  });

  it('marks a record linked to a critical open risk At Risk', () => {
    const p = rec({ id: 'prd-x', entity: 'product', name: 'X', code: 'X1', family_id: 'fam-1' });
    const k = rec({ id: 'rsk-1', entity: 'risk', name: 'Burn', risk_status: 'Open', severity: 9, occurrence: 2, detection: 2, product_id: 'prd-x' });
    const h = entityHealth(p, buildGraph([p, k]), today);
    expect(h.dimensions.find((d) => d.key === 'risk')?.score).toBe(0);
    expect(h.status).toBe('At Risk');
  });

  it('marks mostly-unknown records Incomplete', () => {
    const s = rec({ id: 'sup-1', entity: 'supplier', name: 'S', country: 'UNKNOWN', category: '', typical_lead_time: null, moq: 'TBD' });
    expect(entityHealth(s, buildGraph([s]), today).status).toBe('Incomplete');
  });

  it('closed work has no timeliness dimension; DEMO lowers evidence', () => {
    const r = rec({ id: 'opp-w', entity: 'opportunity', name: 'W', stage: 'Won', data_type: 'DEMO', provenance: { verification_status: 'DRAFT' } });
    const h = entityHealth(r, buildGraph([r]), today);
    expect(h.dimensions.some((d) => d.key === 'timeliness')).toBe(false);
    expect(h.dimensions.find((d) => d.key === 'evidence')!.score).toBeLessThan(0.5);
    expect(h.dimensions.find((d) => d.key === 'evidence')!.reason).toMatch(/DEMO/);
  });
});

describe('duplicate detection', () => {
  it('normalises legal suffixes and punctuation', () => {
    expect(normaliseName('Siemens India Pvt. Ltd.')).toBe('siemens india');
  });
  it('finds same-name and same-code pairs within a type only, never across types', () => {
    const pairs = findDuplicates([
      rec({ id: 'sup-a', entity: 'supplier', name: 'Keyence India Pvt Ltd' }),
      rec({ id: 'sup-b', entity: 'supplier', name: 'Keyence India' }),
      rec({ id: 'co-a', entity: 'company', name: 'Keyence India' }),
      rec({ id: 'itm-1', entity: 'component', name: 'Sensor A', code: 'TL-1' }),
      rec({ id: 'itm-2', entity: 'component', name: 'Proximity switch', code: 'tl-1' }),
      rec({ id: 'itm-3', entity: 'component', name: 'Servo motor 400W' }),
    ]);
    expect(pairs.map((p) => [p.a.id, p.b.id].sort().join('|')).sort()).toEqual(['itm-1|itm-2', 'sup-a|sup-b']);
    expect(pairs.find((p) => p.a.entity === 'component')!.reasons[0]).toMatch(/same code/);
  });
});

describe('ask intelligence (retrieval answer)', () => {
  const p = rec({ id: 'prd-m', entity: 'product', name: 'Marker', next_action: { action: 'Validate on steel' } });
  const e = rec({ id: 'evd-1', entity: 'evidence', name: 'Datasheet claim', entity_id: 'prd-m' });
  const d = rec({ id: 'opp-d', entity: 'opportunity', name: 'Demo opp', data_type: 'DEMO', provenance: { verification_status: 'DRAFT' }, product_id: 'prd-m' });
  const g = buildGraph([p, e, d]);
  const hit = (id: string, entity: string, name: string, verification: string, data_type = 'TEAL_INTERNAL'): Hit => ({ id, entity, name, score: 1, data_type, verification, partition: 'records', terms: ['marker'] });

  it('answers only from matches, with evidence, unknowns and next steps', () => {
    const a = composeAnswer('marker', [hit('prd-m', 'product', 'Marker', 'VERIFIED'), hit('opp-d', 'opportunity', 'Demo opp', 'DRAFT', 'DEMO')], g);
    expect(a.direct).toMatch(/Marker/);
    expect(a.findings.map((f) => f.id)).toEqual(['prd-m', 'opp-d']);
    expect(a.evidence.map((x) => x.id)).toContain('evd-1');
    expect(a.unknowns.join(' ')).toMatch(/DEMO record/);
    expect(a.actions[0]).toMatch(/Validate on steel/);
    expect(a.confidence).toBe('Medium');
  });
  it('says UNKNOWN when nothing matches — never invents', () => {
    const a = composeAnswer('quantum widget', [], g);
    expect(a.confidence).toBe('None');
    expect(a.direct).toMatch(/UNKNOWN/);
    expect(a.findings).toHaveLength(0);
  });
});
