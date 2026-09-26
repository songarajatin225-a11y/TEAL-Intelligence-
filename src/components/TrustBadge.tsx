import { BadgeCheck, BookMarked, Calculator, CircleHelp, FlaskConical, UserPen, type LucideIcon } from 'lucide-react';
import type { AnyRecord } from '../domain';
import { TRUST_EXPLAIN, trustLabel, type TrustLabel } from '../services/trust';
import { Badge, type Tone } from './ui';

const TONE: Record<TrustLabel, Tone> = { VERIFIED: 'ok', REFERENCE: 'accent', ESTIMATED: 'warn', 'USER ADDED': 'draft', 'TO BE VALIDATED': 'neutral', 'DEMO DATA': 'demo' };
const ICON: Record<TrustLabel, LucideIcon> = { VERIFIED: BadgeCheck, REFERENCE: BookMarked, ESTIMATED: Calculator, 'USER ADDED': UserPen, 'TO BE VALIDATED': CircleHelp, 'DEMO DATA': FlaskConical };

/** The one trust label of a record (master prompt §40), with its meaning on hover. */
export function TrustBadge({ record, label }: { record?: Pick<AnyRecord, 'data_type' | 'provenance'> & { __origin?: string }; label?: TrustLabel }) {
  const l = label ?? (record ? trustLabel(record) : 'TO BE VALIDATED');
  const Icon = ICON[l];
  return (
    <Badge tone={TONE[l]} title={`${l} — ${TRUST_EXPLAIN[l]}`}>
      <Icon className="size-3" aria-hidden /> {l}
    </Badge>
  );
}
