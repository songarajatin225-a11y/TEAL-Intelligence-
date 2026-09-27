import type { AnyRecord } from '../domain';

/**
 * DUPLICATE DETECTION (ultimate spec §88). Finds records of the same type that probably describe
 * the same thing. It only *suggests* — nothing is merged automatically; a person compares the
 * pair and decides. Rules are deterministic and every pair lists its reasons:
 *   - identical normalised name, code, model or designation
 *   - name token overlap (Jaccard) ≥ threshold
 */
export interface DuplicatePair {
  a: AnyRecord;
  b: AnyRecord;
  score: number;
  reasons: string[];
}

const LEGAL = /\b(pvt|private|ltd|limited|inc|llc|gmbh|co|corp|corporation|company|plc|ag|sa|bv|srl|the)\b/g;
export const normaliseName = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.,()&/_-]+/g, ' ')
    .replace(LEGAL, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toks = (s: string) => new Set(normaliseName(s).split(' ').filter((t) => t.length > 1));
const IDENT_FIELDS = ['code', 'model', 'model_number', 'designation', 'serial'] as const;
/** entities whose members are distinct by design (reference data, generated structure) */
const SKIP = new Set(['source', 'evidence', 'vocabulary', 'gate_definition', 'module_conflict', 'rule', 'formula', 'semi_step', 'spec_definition', 'compatibility_rule', 'compatibility', 'equipment_template', 'simulation']);

export function findDuplicates(records: AnyRecord[], opts: { min?: number; entity?: string } = {}): DuplicatePair[] {
  const min = opts.min ?? 0.75;
  const groups = new Map<string, AnyRecord[]>();
  for (const r of records) {
    if (SKIP.has(r.entity) || (opts.entity && r.entity !== opts.entity)) continue;
    (groups.get(r.entity) ?? groups.set(r.entity, []).get(r.entity)!).push(r);
  }
  const out: DuplicatePair[] = [];
  for (const list of groups.values()) {
    const prepared = list.map((r) => ({ r, n: normaliseName(r.name), t: toks(r.name) }));
    for (let i = 0; i < prepared.length; i++) {
      for (let j = i + 1; j < prepared.length; j++) {
        const A = prepared[i];
        const B = prepared[j];
        const reasons: string[] = [];
        let score = 0;
        if (A.n && A.n === B.n) {
          reasons.push('same name (ignoring case, punctuation and legal suffixes)');
          score = 1;
        } else {
          let inter = 0;
          A.t.forEach((t) => B.t.has(t) && inter++);
          const jac = inter / Math.max(1, A.t.size + B.t.size - inter);
          if (jac >= min && inter >= 2) {
            reasons.push(`${Math.round(jac * 100)} % of name words shared`);
            score = jac;
          }
        }
        for (const f of IDENT_FIELDS) {
          const va = (A.r as Record<string, unknown>)[f];
          const vb = (B.r as Record<string, unknown>)[f];
          if (typeof va === 'string' && va && typeof vb === 'string' && va.trim().toLowerCase() === vb.trim().toLowerCase()) {
            reasons.push(`same ${f} “${va}”`);
            score = Math.max(score, 0.95);
          }
        }
        if (reasons.length) out.push({ a: A.r, b: B.r, score, reasons });
      }
    }
  }
  return out.sort((x, y) => y.score - x.score);
}
