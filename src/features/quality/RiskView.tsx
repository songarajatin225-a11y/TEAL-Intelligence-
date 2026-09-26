import { rpn } from '../../calculations/quality';
import { Badge, Card, KV } from '../../components/ui';
import { CalcValue } from '../../components/why';
import type { Risk } from '../../domain/entities';
import type { Rec } from '../../hooks/useData';

/** Risk / FMEA line (spec §46): RPN = S·O·D (Handbook Q10); severity first. */
export default function RiskView({ record }: { record: Rec }) {
  const r = record as unknown as Risk;
  const c = rpn({ severity: r.severity, occurrence: r.occurrence, detection: r.detection });
  const tone = r.severity != null && r.severity >= 9 ? 'bad' : c.value != null && c.value >= 200 ? 'bad' : c.value != null && c.value >= 100 ? 'warn' : 'neutral';
  return (
    <Card title={`${r.kind} line`}>
      <KV
        items={[
          ['Failure mode', r.failure_mode ?? '—'],
          ['Cause → effect', `${r.cause ?? '—'} → ${r.effect ?? '—'}`],
          ['S / O / D', `${r.severity ?? '—'} / ${r.occurrence ?? '—'} / ${r.detection ?? '—'}`],
          ['RPN', <span key="r" className="inline-flex items-center gap-2"><CalcValue c={c} />{c.value != null && <Badge tone={tone}>{tone === 'bad' ? 'act now' : tone === 'warn' ? 'review' : 'monitor'}</Badge>}</span>],
          ['Action', r.action ?? '—'],
          ['Status', r.risk_status],
        ]}
      />
      <p className="mt-2 text-meta text-ink-3">Severity ≥ 9 needs action regardless of RPN. Thresholds (RPN ≥ 200 act, ≥ 100 review) are an ASSUMED team convention — set your own.</p>
    </Card>
  );
}
