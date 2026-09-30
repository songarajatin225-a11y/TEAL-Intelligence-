import type { Claim, ConfidenceResult, ConfidenceSignal, SourceRef } from './types';

/*
 * CONFIDENCE ENGINE (AI master prompt §61). A label from measurable signals — never a percentage an
 * answer "feels" like. Each signal says how it was measured; signals that do not apply say n/a.
 */

export interface ConfidenceInputs {
  claims: Claim[];
  /** fraction of top-10 overlap between keyword and vector retrieval (null: no retrieval) */
  agreement: number | null;
  /** required fields known / total (null: not applicable) */
  coverage: { known: number; total: number } | null;
  constraints: { pass: number; fail: number; unknown: number } | null;
  /** posterior σ relative to the observed range (null: no model) */
  modelUncertainty: number | null;
  /** validated outcomes (verifications with results) linked to the subject; null: not applicable */
  historical: number | null;
  /** the answer is the exact output of a deterministic engine for the stated inputs (unit conversion, DOE plan) */
  deterministic?: string | null;
}

const TRUSTED = new Set(['VERIFIED', 'SOURCE_DOCUMENTED']);
const lv = { high: 2, medium: 1, low: 0 } as const;

export function confidence(i: ConfidenceInputs): ConfidenceResult {
  const signals: ConfidenceSignal[] = [];
  const asserted = i.claims.filter((c) => c.cls !== 'UNKNOWN');
  const sources = new Map<string, SourceRef>();
  for (const c of asserted) for (const s of c.sources) if (s.kind === 'record' || s.kind === 'handbook') sources.set(s.id, s);
  const src = [...sources.values()];

  if (!src.length) signals.push({ signal: 'Source quality', level: 'n/a', detail: 'No record or handbook source — the answer rests on engine calculations only' });
  else {
    const trusted = src.filter((s) => s.kind === 'handbook' || (TRUSTED.has(s.verification ?? '') && s.data_type !== 'DEMO' && s.data_type !== 'AI_GENERATED')).length;
    const demo = src.filter((s) => s.data_type === 'DEMO').length;
    const aiGen = src.filter((s) => s.data_type === 'AI_GENERATED').length;
    const share = trusted / src.length;
    signals.push({ signal: 'Source quality', level: share >= 0.6 ? 'high' : share >= 0.3 ? 'medium' : 'low', detail: `${trusted} of ${src.length} sources are verified, source-documented or handbook${demo ? `; ${demo} are DEMO (fictional)` : ''}${aiGen ? `; ${aiGen} are AI-generated drafts (unreviewed)` : ''}` });
  }
  if (i.coverage && i.coverage.total) {
    const f = i.coverage.known / i.coverage.total;
    signals.push({ signal: 'Data coverage', level: f >= 0.8 ? 'high' : f >= 0.5 ? 'medium' : 'low', detail: `${i.coverage.known} of ${i.coverage.total} required values are known` });
  } else signals.push({ signal: 'Data coverage', level: 'n/a', detail: 'No required-value list for this question' });
  if (i.agreement != null) signals.push({ signal: 'Retrieval agreement', level: i.agreement >= 0.4 ? 'high' : i.agreement >= 0.15 ? 'medium' : 'low', detail: `${Math.round(i.agreement * 100)} % overlap between keyword and vector top-10` });
  else signals.push({ signal: 'Retrieval agreement', level: 'n/a', detail: 'Answer from structured engines, not retrieval' });
  const c = i.constraints;
  if (c && c.pass + c.fail + c.unknown) signals.push({ signal: 'Constraint satisfaction', level: c.fail ? 'low' : c.unknown > c.pass ? 'medium' : 'high', detail: `${c.pass} passed · ${c.fail} violated · ${c.unknown} could not run` });
  else signals.push({ signal: 'Constraint satisfaction', level: 'n/a', detail: 'No engineering rule applies' });
  if (i.deterministic) signals.push({ signal: 'Model uncertainty', level: 'high', detail: i.deterministic });
  else if (i.modelUncertainty != null) signals.push({ signal: 'Model uncertainty', level: i.modelUncertainty <= 0.1 ? 'high' : i.modelUncertainty <= 0.3 ? 'medium' : 'low', detail: `posterior σ ≈ ${Math.round(i.modelUncertainty * 100)} % of the observed range` });
  else signals.push({ signal: 'Model uncertainty', level: 'n/a', detail: 'Deterministic engines — no statistical model involved' });
  if (i.historical != null) signals.push({ signal: 'Historical validation', level: i.historical >= 3 ? 'high' : i.historical >= 1 ? 'medium' : 'low', detail: i.historical ? `${i.historical} validated outcome(s) on record` : 'No validated outcome on record for this subject' });
  else signals.push({ signal: 'Historical validation', level: 'n/a', detail: 'Not applicable to this question' });

  const applicable = signals.filter((s) => s.level !== 'n/a') as (ConfidenceSignal & { level: 'high' | 'medium' | 'low' })[];
  if (!asserted.length || !applicable.length) return { label: 'INSUFFICIENT DATA', signals, reason: asserted.length ? 'No measurable signal applies' : 'Nothing in the knowledge base supports an answer' };
  const avg = applicable.reduce((a, s) => a + lv[s.level], 0) / applicable.length;
  const anyLow = applicable.some((s) => s.level === 'low');
  const label = avg >= 1.6 && !anyLow ? 'HIGH' : avg >= 0.9 ? 'MEDIUM' : 'LOW';
  const weakest = applicable.filter((s) => s.level === 'low').map((s) => s.signal.toLowerCase());
  return { label, signals, reason: weakest.length ? `Limited by ${weakest.join(', ')}` : `${applicable.length} signal(s) measured` };
}
