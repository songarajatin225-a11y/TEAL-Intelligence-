import type { Technology } from '../domain/entities';

/**
 * TECHNOLOGY MATURITY from TRL (final master prompt §17) — a transparent, published rule, never a
 * subjective ranking:
 *
 *   TRL 1–3  → Emerging       (basic principles → proof of concept)
 *   TRL 4–5  → Experimental   (validated in lab / relevant environment)
 *   TRL 6–7  → Developing     (prototype demonstrated in relevant / operational environment)
 *   TRL 8–9  → Mature         (qualified / proven in operation)
 *   TRL 9 and ≥ 3 suppliers recorded → Commodity
 *   no TRL   → Not assessed
 *
 * A TRL is only shown with its written basis (trl_basis).
 */
export const MATURITY_LANES = ['Emerging', 'Experimental', 'Developing', 'Mature', 'Commodity'] as const;
export type MaturityLane = (typeof MATURITY_LANES)[number] | 'Not assessed';
export const COMMODITY_MIN_SUPPLIERS = 3;

export const MATURITY_RULE: Record<(typeof MATURITY_LANES)[number], string> = {
  Emerging: 'TRL 1–3',
  Experimental: 'TRL 4–5',
  Developing: 'TRL 6–7',
  Mature: 'TRL 8–9',
  Commodity: `TRL 9 and ≥ ${COMMODITY_MIN_SUPPLIERS} suppliers recorded`,
};

export function maturityLane(t: Pick<Technology, 'trl' | 'supplier_ids'>): MaturityLane {
  const trl = t.trl;
  if (trl == null) return 'Not assessed';
  if (trl <= 3) return 'Emerging';
  if (trl <= 5) return 'Experimental';
  if (trl <= 7) return 'Developing';
  if (trl === 9 && (t.supplier_ids?.length ?? 0) >= COMMODITY_MIN_SUPPLIERS) return 'Commodity';
  return 'Mature';
}
