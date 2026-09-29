import type { AnyRecord } from '../../domain';
import type { Part } from '../../domain/engineering';
import { convert, isKnownUnit } from '../../calculations/units';
import { readSpec, type SpecDefs } from '../eng/specs';
import { CONSEQUENTIAL } from './intent';
import type { Claim, EngineeringAnswer, Intent, VerificationCheck, VerificationReport } from './types';

/*
 * ENGINEERING VALIDATOR (AI master prompt §62, §63). An independent check that runs after the answer
 * is composed — it does not trust the composer (or, later, a language model):
 *   1. source verification   — every asserted claim cites a record / section / engine that exists
 *   2. database verification — every number a claim carries is re-read from the cited record
 *   3. unit validation       — every unit is known to the unit engine
 *   4. constraint validation — rule violations surfaced by the engines are reported, not hidden
 *   5. conflict detection    — conflicting specifications are shown as SPECIFICATION CONFLICT
 *   6. review flag           — consequential or estimated / assumed content needs an engineer
 * Claims that fail (1) are removed from the answer and listed as rejected.
 */

const SECTIONS = ['answer', 'basis', 'evidence', 'alternatives', 'constraints', 'risks', 'assumptions', 'gaps', 'validation'] as const;
type SectionKey = (typeof SECTIONS)[number];

const EXTRA_UNITS = new Set(['%', 'UPH', 'parts/h', 'INR', 'USD', 'EUR', 'JPY', 'GBP', 'CNY', 'weeks', 'wk', 'runs', 'lines', '']);

function readValue(r: AnyRecord, field: string, defs: SpecDefs, unit: string): number | null {
  if (field.startsWith('spec:')) {
    const s = readSpec(r as Part & AnyRecord, field.slice(5), defs);
    if (!s) return null;
    const v = s.value ?? s.min ?? null;
    if (v == null) return null;
    try {
      return unit && s.unit && unit !== s.unit ? convert(v, s.unit, unit) : v;
    } catch {
      return v;
    }
  }
  let cur: unknown = r;
  for (const k of field.split('.')) cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[k] : undefined;
  if (cur && typeof cur === 'object' && 'value' in (cur as object)) cur = (cur as { value: unknown }).value;
  return typeof cur === 'number' ? cur : null;
}

export interface VerifyDeps {
  byId: Map<string, AnyRecord>;
  defs: SpecDefs;
  /** rule results surfaced by the engines for this answer */
  constraints?: { pass: number; fail: number; unknown: number };
}

export function verifyAnswer(a: EngineeringAnswer, deps: VerifyDeps): { answer: EngineeringAnswer; report: VerificationReport } {
  const checks: VerificationCheck[] = [];
  const rejected: Claim[] = [];
  let unsourced = 0;
  let dbChecked = 0;
  let dbMismatch = 0;
  const badUnits = new Set<string>();

  const next = { ...a } as EngineeringAnswer;
  for (const key of SECTIONS) {
    const kept: Claim[] = [];
    for (const c of a[key as SectionKey]) {
      const valid = c.sources.filter((s) => (s.kind === 'record' ? deps.byId.has(s.id) : s.kind === 'handbook' ? /^[a-z]+\/[^#]+\.md#.+/.test(s.id) : true));
      if (c.cls !== 'UNKNOWN' && c.cls !== 'ASSUMED' && key !== 'gaps' && !valid.length) {
        unsourced++;
        rejected.push(c);
        continue;
      }
      let cls = c.cls;
      for (const v of c.values ?? []) {
        if (v.unit && !isKnownUnit(v.unit) && !EXTRA_UNITS.has(v.unit)) badUnits.add(v.unit);
        if (!v.recordId || !v.field) continue;
        const r = deps.byId.get(v.recordId);
        if (!r) continue;
        const actual = readValue(r, v.field, deps.defs, v.unit);
        dbChecked++;
        if (actual == null || Math.abs(actual - v.value) > Math.max(1e-9, Math.abs(actual) * 0.005)) {
          dbMismatch++;
          cls = 'CONFLICTING';
        }
      }
      kept.push({ ...c, sources: valid, cls });
    }
    next[key as SectionKey] = kept;
  }

  checks.push(unsourced ? { check: 'sources', status: 'fail', detail: `${unsourced} claim(s) had no verifiable source and were removed` } : { check: 'sources', status: 'pass', detail: 'Every asserted claim cites an existing record, handbook section or engine' });
  checks.push(dbMismatch ? { check: 'database', status: 'fail', detail: `${dbMismatch} of ${dbChecked} value(s) differ from the cited record — marked CONFLICTING` } : { check: 'database', status: 'pass', detail: dbChecked ? `${dbChecked} value(s) re-read from their records and matched` : 'No numeric values to re-read' });
  checks.push(badUnits.size ? { check: 'units', status: 'warn', detail: `Unrecognised unit(s): ${[...badUnits].join(', ')}` } : { check: 'units', status: 'pass', detail: 'All units recognised by the unit engine' });
  const cr = deps.constraints;
  checks.push(!cr || cr.pass + cr.fail + cr.unknown === 0 ? { check: 'constraints', status: 'pass', detail: 'No engineering rule applied to this answer' } : cr.fail ? { check: 'constraints', status: 'warn', detail: `${cr.fail} rule violation(s) reported in the answer, ${cr.unknown} check(s) could not run (missing data)` } : cr.unknown ? { check: 'constraints', status: 'warn', detail: `${cr.pass} rule check(s) passed, ${cr.unknown} could not run (missing data)` } : { check: 'constraints', status: 'pass', detail: `${cr.pass} rule check(s) passed` });
  checks.push(next.conflicts.length ? { check: 'conflicts', status: 'warn', detail: `${next.conflicts.length} specification conflict(s) — engineering verification required` } : { check: 'conflicts', status: 'pass', detail: 'No conflicting specification among the cited records' });

  const all = SECTIONS.flatMap((k) => next[k as SectionKey]);
  const soft = all.filter((c) => c.cls === 'ESTIMATED' || c.cls === 'ASSUMED' || c.cls === 'CONFLICTING').length;
  const reviewRequired = CONSEQUENTIAL.includes(a.intent as Intent) || soft > 0 || rejected.length > 0 || !!cr?.fail || next.conflicts.length > 0;
  checks.push({ check: 'review', status: reviewRequired ? 'warn' : 'pass', detail: reviewRequired ? `Engineering review required${CONSEQUENTIAL.includes(a.intent) ? ' — this answer can change a design, purchase or commitment' : ''}${soft ? `; ${soft} estimated / assumed / conflicting claim(s)` : ''}` : 'Informational answer from cited records' });

  const report: VerificationReport = { checks, rejected, reviewRequired };
  return { answer: { ...next, verification: report }, report };
}
