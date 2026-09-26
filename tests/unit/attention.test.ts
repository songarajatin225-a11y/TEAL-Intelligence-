import { describe, expect, it } from 'vitest';
import type { AnyRecord } from '../../src/domain';
import { attentionCounts, attentionItems } from '../../src/services/attention';

const base = { data_type: 'DEMO', provenance: { verification_status: 'DRAFT' } } as const;
const rec = (x: Record<string, unknown>) => ({ ...base, ...x }) as unknown as AnyRecord;

describe('attention (Mission Control / attention centre)', () => {
  const today = '2026-09-10';
  const items = attentionItems(
    [
      rec({ id: 'opp-a', entity: 'opportunity', name: 'Overdue opp', stage: 'Discovery', next_action: { action: 'Call', due: '2026-09-01' } }),
      rec({ id: 'opp-b', entity: 'opportunity', name: 'Due soon', stage: 'Discovery', next_action: { action: 'Send quote', due: '2026-09-12' } }),
      rec({ id: 'opp-c', entity: 'opportunity', name: 'Won deal', stage: 'Won', next_action: { action: 'x', due: '2026-01-01' } }),
      rec({ id: 'act-x', entity: 'activity', name: 'Stuck task', status: 'Blocked', blocker: 'No samples', kind: 'task', priority: 'High' }),
      rec({ id: 'rsk-1', entity: 'risk', name: 'Severe', kind: 'Risk', risk_status: 'Open', severity: 9, occurrence: 2, detection: 2 }),
      rec({ id: 'rsk-2', entity: 'risk', name: 'Mild', kind: 'Risk', risk_status: 'Open', severity: 3, occurrence: 2, detection: 2, next_action: { action: 'Mitigate', due: '2026-09-11' } }),
      rec({ id: 'req-1', entity: 'requirement', name: 'No criterion', category: 'Performance', next_action: { action: 'x', due: '2026-12-01' } }),
    ],
    today,
  );
  const by = (id: string) => items.find((i) => i.recordId === id);

  it('ranks overdue, blocked and severe risks as critical', () => {
    expect(by('opp-a')?.level).toBe('critical');
    expect(by('act-x')?.level).toBe('critical');
    expect(by('rsk-1')?.level).toBe('critical');
    expect(items[0].level).toBe('critical');
  });
  it('never raises closed work', () => {
    expect(by('opp-c')).toBeUndefined();
  });
  it('shows each record once, folding extra signals into its context', () => {
    expect(items.filter((i) => i.recordId === 'rsk-2')).toHaveLength(1);
    expect(by('rsk-2')?.context).toMatch(/due soon/);
    expect(by('rsk-2')?.context).toMatch(/RPN 12/);
  });
  it('flags requirements that cannot be verified', () => {
    expect(by('req-1')?.kind).toBe('verification');
  });
  it('counts by level', () => {
    const c = attentionCounts(items);
    expect(c.critical).toBe(3);
    expect(c.critical + c.attention + c.info).toBe(items.length);
  });
});
