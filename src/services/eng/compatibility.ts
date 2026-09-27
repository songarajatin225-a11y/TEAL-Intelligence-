import { fmtNum } from '../../calculations/units';
import type { AnyRecord } from '../../domain';
import type { Compatibility, CompatibilityRule, CompatType, Part } from '../../domain/engineering';
import { readSpec, specText, type SpecDefs } from './specs';

/*
 * COMPATIBILITY ENGINE (master prompt §42–§44). Two kinds of evidence, never mixed up:
 *   1. recorded relationships (with a source) — only these can say "ManufacturerRecommended"
 *   2. engineering rules evaluated on the two parts' specifications — at most "EngineeringCompatible"
 * Missing data gives Unknown with the missing parameter named. Nothing is inferred as confirmed.
 */

export type RuleStatus = 'pass' | 'fail' | 'missing';
export interface RuleCheck {
  rule: CompatibilityRule & AnyRecord;
  status: RuleStatus;
  result: CompatType;
  /** A-side and B-side part (after orientation) */
  a: Part & AnyRecord;
  b: Part & AnyRecord;
  detail: string;
}

export interface PairResult {
  a: Part & AnyRecord;
  b: Part & AnyRecord;
  relationship: CompatType;
  /** where the relationship comes from */
  basis: 'Recorded relationship' | 'Engineering rules' | 'No rule applies';
  recorded: (Compatibility & AnyRecord)[];
  checks: RuleCheck[];
  summary: string;
}

export interface CompatCtx {
  rules: (CompatibilityRule & AnyRecord)[];
  relationships: (Compatibility & AnyRecord)[];
  defs: SpecDefs;
}

export function compatCtx(records: AnyRecord[], defs: SpecDefs): CompatCtx {
  return {
    rules: records.filter((r) => r.entity === 'compatibility_rule' && (r as unknown as CompatibilityRule).rule_status === 'Active') as (CompatibilityRule & AnyRecord)[],
    relationships: records.filter((r) => r.entity === 'compatibility') as (Compatibility & AnyRecord)[],
    defs,
  };
}

const matches = (types: string[], t: string) => types.includes(t) || types.includes('*');
const protocols = (p: Part) => (p.interfaces?.communication ?? []).map((x) => x.toLowerCase());

function unitOf(defs: SpecDefs, key: string) {
  return defs.get(key)?.canonical_unit ?? '';
}

/** Evaluate one rule with A and B already oriented. */
export function evaluateRule(rule: CompatibilityRule & AnyRecord, a: Part & AnyRecord, b: Part & AnyRecord, defs: SpecDefs): RuleCheck {
  const base = { rule, a, b };
  const miss = (who: Part, key: string): RuleCheck => ({ ...base, status: 'missing', result: 'Unknown', detail: `${who.model_number}: ${defs.get(key)?.name ?? key} is Not Available — cannot evaluate “${rule.name}”` });
  const verdict = (ok: boolean, detail: string): RuleCheck => ({ ...base, status: ok ? 'pass' : 'fail', result: ok ? 'EngineeringCompatible' : rule.on_fail, detail });
  const f = rule.factor ?? 1;

  if (rule.check === 'shared_protocol') {
    const pa = protocols(a);
    const pb = protocols(b);
    if (!pa.length) return miss(a, 'communication');
    if (!pb.length) return miss(b, 'communication');
    const shared = (a.interfaces?.communication ?? []).filter((x) => pb.includes(x.toLowerCase()));
    return verdict(shared.length > 0, shared.length ? `Shared interface: ${shared.join(', ')}` : `No shared interface — ${a.model_number}: ${(a.interfaces?.communication ?? []).join(', ')}; ${b.model_number}: ${(b.interfaces?.communication ?? []).join(', ')}`);
  }
  if (rule.check === 'text_equals') {
    const ta = specText(a, rule.a_spec);
    const tb = specText(b, rule.b_spec);
    if (ta == null) return miss(a, rule.a_spec);
    if (tb == null) return miss(b, rule.b_spec);
    const ok = ta.trim().toLowerCase() === tb.trim().toLowerCase();
    return verdict(ok, `${defs.get(rule.a_spec)?.name ?? rule.a_spec}: ${ta} vs ${tb}`);
  }
  if (rule.check === 'range_contains') {
    const sa = readSpec(a, rule.a_spec, defs);
    const sb = readSpec(b, rule.b_spec, defs);
    if (!sa || (sa.value == null && sa.min == null)) return miss(a, rule.a_spec);
    if (!sb || sb.min == null || sb.max == null) return miss(b, rule.b_spec);
    const lo = sa.min ?? sa.value!;
    const hi = sa.max ?? sa.value!;
    const ok = lo >= sb.min && hi <= sb.max;
    const u = unitOf(defs, rule.b_spec);
    return verdict(ok, `${a.model_number} ${lo === hi ? fmtNum(lo, 6) : `${fmtNum(lo, 6)}–${fmtNum(hi, 6)}`} ${u} ${ok ? 'within' : 'outside'} ${b.model_number} ${fmtNum(sb.min, 6)}–${fmtNum(sb.max, 6)} ${u}`);
  }
  // a_lte_b / a_gte_b
  const va = readSpec(a, rule.a_spec, defs)?.value ?? null;
  const vb = readSpec(b, rule.b_spec, defs)?.value ?? null;
  if (va == null) return miss(a, rule.a_spec);
  if (vb == null) return miss(b, rule.b_spec);
  const lhs = va * f;
  const ok = rule.check === 'a_lte_b' ? lhs <= vb : lhs >= vb;
  const ua = unitOf(defs, rule.a_spec);
  const ub = unitOf(defs, rule.b_spec);
  return verdict(ok, `${a.model_number} ${defs.get(rule.a_spec)?.name ?? rule.a_spec} ${fmtNum(va, 6)} ${ua}${f !== 1 ? ` × ${f}` : ''} ${rule.check === 'a_lte_b' ? '≤' : '≥'} ${b.model_number} ${defs.get(rule.b_spec)?.name ?? rule.b_spec} ${fmtNum(vb, 6)} ${ub} → ${ok ? 'OK' : 'violated'}`);
}

/** Rules that apply to a pair (in either orientation), each evaluated with the right orientation. */
export function applicableChecks(x: Part & AnyRecord, y: Part & AnyRecord, ctx: CompatCtx): RuleCheck[] {
  const out: RuleCheck[] = [];
  for (const rule of ctx.rules) {
    if (matches(rule.a_types, x.product_type) && matches(rule.b_types, y.product_type)) out.push(evaluateRule(rule, x, y, ctx.defs));
    else if (matches(rule.a_types, y.product_type) && matches(rule.b_types, x.product_type)) out.push(evaluateRule(rule, y, x, ctx.defs));
  }
  return out;
}

const RANK: Record<CompatType, number> = { Incompatible: 0, ConditionallyCompatible: 1, Unknown: 2, EngineeringCompatible: 3, Compatible: 4, ManufacturerRecommended: 5 };

export const COMPAT_LABEL: Record<CompatType, string> = {
  Compatible: 'Compatible',
  ConditionallyCompatible: 'Conditionally compatible',
  ManufacturerRecommended: 'Manufacturer recommended',
  EngineeringCompatible: 'Engineering compatible (rule-based)',
  Incompatible: 'Incompatible',
  Unknown: 'Unknown',
};
export const COMPAT_TONE: Record<CompatType, 'ok' | 'warn' | 'bad' | 'neutral' | 'info'> = { Compatible: 'ok', ManufacturerRecommended: 'ok', EngineeringCompatible: 'info', ConditionallyCompatible: 'warn', Incompatible: 'bad', Unknown: 'neutral' };

/** Full evaluation of two parts. */
export function checkPair(x: Part & AnyRecord, y: Part & AnyRecord, ctx: CompatCtx): PairResult {
  const recorded = ctx.relationships.filter((c) => (c.a_id === x.id && c.b_id === y.id) || (c.a_id === y.id && c.b_id === x.id));
  const checks = applicableChecks(x, y, ctx);
  const failing = checks.filter((c) => c.status === 'fail');
  const missing = checks.filter((c) => c.status === 'missing');
  let relationship: CompatType;
  let basis: PairResult['basis'];
  // A rule violation always shows — a recorded relationship cannot hide a physical mismatch.
  const worstRule = failing.sort((p, q) => RANK[p.result] - RANK[q.result])[0];
  if (recorded.length) {
    const rec = [...recorded].sort((p, q) => RANK[p.relationship] - RANK[q.relationship])[0];
    relationship = worstRule && RANK[worstRule.result] < RANK[rec.relationship] ? worstRule.result : rec.relationship;
    basis = worstRule && relationship === worstRule.result ? 'Engineering rules' : 'Recorded relationship';
  } else if (checks.length) {
    relationship = worstRule ? worstRule.result : missing.length === checks.length ? 'Unknown' : 'EngineeringCompatible';
    basis = 'Engineering rules';
  } else {
    relationship = 'Unknown';
    basis = 'No rule applies';
  }
  const parts: string[] = [];
  if (recorded.length) parts.push(`${recorded.length} recorded relationship${recorded.length > 1 ? 's' : ''}`);
  if (checks.length) parts.push(`${checks.filter((c) => c.status === 'pass').length} of ${checks.length} rule checks passed${missing.length ? `, ${missing.length} could not run (missing data)` : ''}${failing.length ? `, ${failing.length} violated` : ''}`);
  if (!parts.length) parts.push('No recorded relationship and no engineering rule covers this pair');
  return { a: x, b: y, relationship, basis, recorded, checks, summary: parts.join(' · ') };
}

/** Parts of other types that a rule or record connects to `part`, with the result (§154 "compatible galvos"). */
export function compatibleWith(part: Part & AnyRecord, all: (Part & AnyRecord)[], ctx: CompatCtx): PairResult[] {
  return all
    .filter((o) => o.id !== part.id && o.product_type !== part.product_type)
    .map((o) => checkPair(part, o, ctx))
    .filter((r) => r.basis !== 'No rule applies')
    .sort((p, q) => RANK[q.relationship] - RANK[p.relationship] || p.b.model_number.localeCompare(q.b.model_number));
}

/** All pairwise results inside a selection (a station or a whole machine) where a rule or record applies. */
export function checkSelection(parts: (Part & AnyRecord)[], ctx: CompatCtx): PairResult[] {
  const out: PairResult[] = [];
  const uniq = [...new Map(parts.map((p) => [p.id, p])).values()];
  for (let i = 0; i < uniq.length; i++) for (let j = i + 1; j < uniq.length; j++) {
    const r = checkPair(uniq[i], uniq[j], ctx);
    if (r.basis !== 'No rule applies') out.push(r);
  }
  return out.sort((p, q) => RANK[p.relationship] - RANK[q.relationship]);
}

/** §44 "IF equipment interface requires EtherCAT THEN the selected controller must support EtherCAT". */
export function protocolRequirement(required: string[], parts: (Part & AnyRecord)[]): { protocol: string; ok: boolean; detail: string }[] {
  const controllers = parts.filter((p) => ['plc', 'motion_controller', 'ipc'].includes(p.product_type));
  return required.map((protocol) => {
    const hits = controllers.filter((c) => protocols(c).includes(protocol.toLowerCase()));
    return {
      protocol,
      ok: hits.length > 0,
      detail: !controllers.length ? 'No controller selected' : hits.length ? `Supported by ${hits.map((h) => h.model_number).join(', ')}` : `Selected controller(s) ${controllers.map((c) => `${c.model_number} (${(c.interfaces?.communication ?? []).join(', ') || 'no interface recorded'})`).join('; ')} do not list ${protocol}`,
    };
  });
}
