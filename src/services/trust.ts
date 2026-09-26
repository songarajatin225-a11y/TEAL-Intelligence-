import type { AnyRecord } from '../domain';

/**
 * SOURCE & TRUST LABELS (final master prompt §18, §40). One plain label per record, derived only
 * from its data type, verification status and origin — the same six words everywhere:
 *
 *   DEMO DATA        data_type DEMO (fictional, demonstrates a workflow)
 *   VERIFIED         checked by a reviewer against a source
 *   USER ADDED       created by a user and not yet reviewed
 *   REFERENCE        documented in a cited source (handbook, catalogue, datasheet)
 *   ESTIMATED        calculated, inferred or assumed
 *   TO BE VALIDATED  draft, unknown, conflicting or stale
 */
export const TRUST_LABELS = ['VERIFIED', 'REFERENCE', 'ESTIMATED', 'USER ADDED', 'TO BE VALIDATED', 'DEMO DATA'] as const;
export type TrustLabel = (typeof TRUST_LABELS)[number];

export const TRUST_EXPLAIN: Record<TrustLabel, string> = {
  VERIFIED: 'Checked by a reviewer against a source.',
  REFERENCE: 'Documented in a cited source; not independently re-verified.',
  ESTIMATED: 'Calculated, inferred or assumed — not measured or quoted.',
  'USER ADDED': 'Entered by a user; not yet reviewed.',
  'TO BE VALIDATED': 'Draft, unknown, conflicting or stale — check before relying on it.',
  'DEMO DATA': 'Fictional record that demonstrates a workflow. Not real data.',
};

export function trustLabel(r: Pick<AnyRecord, 'data_type' | 'provenance'> & { __origin?: string }): TrustLabel {
  const v = r.provenance?.verification_status;
  if (r.data_type === 'DEMO') return 'DEMO DATA';
  if (v === 'VERIFIED') return 'VERIFIED';
  if (v === 'CONFLICTED' || v === 'STALE') return 'TO BE VALIDATED';
  if (r.data_type === 'USER_CREATED' || r.__origin === 'LOCAL_NEW') return 'USER ADDED';
  if (v === 'SOURCE_DOCUMENTED') return 'REFERENCE';
  if (v === 'CALCULATED' || v === 'INFERRED' || v === 'ASSUMPTION' || r.data_type === 'CALCULATED' || r.data_type === 'INFERRED' || r.data_type === 'AI_GENERATED') return 'ESTIMATED';
  return 'TO BE VALIDATED';
}
