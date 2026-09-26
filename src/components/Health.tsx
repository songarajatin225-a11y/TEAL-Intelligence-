import clsx from 'clsx';
import { Activity, AlertTriangle, CheckCircle2, CircleDashed, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import type { AnyRecord } from '../domain';
import { useData } from '../hooks/useData';
import { entityHealth, HEALTH_TONE, type Health, type HealthStatus } from '../services/health';
import { todayIso } from '../utils/dates';
import { Badge, Card } from './ui';

const ICON: Record<HealthStatus, LucideIcon> = { Healthy: CheckCircle2, Attention: AlertTriangle, 'At Risk': AlertTriangle, Incomplete: CircleDashed };
const BAR: Record<string, string> = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', neutral: 'bg-ink-3' };

export function useHealth(r: AnyRecord | undefined): Health | null {
  const { graph } = useData();
  return useMemo(() => (r ? entityHealth(r, graph, todayIso()) : null), [r, graph]);
}

export function HealthBadge({ health, title }: { health: Health; title?: string }) {
  const Icon = ICON[health.status];
  return (
    <Badge tone={HEALTH_TONE[health.status]} title={title ?? `Health ${Math.round(health.score * 100)} % — ${health.drivers.map((d) => d.reason).join('; ') || 'all dimensions healthy'}`}>
      <Icon className="size-3" aria-hidden /> {health.status}
    </Badge>
  );
}

const tone = (s: number) => (s >= 0.7 ? 'ok' : s >= 0.4 ? 'warn' : 'bad');

/** Health card with one bar per dimension and its reason — explainable, never a black box. */
export function HealthCard({ record }: { record: AnyRecord }) {
  const h = useHealth(record);
  if (!h) return null;
  return (
    <Card title="Health" icon={Activity} description="Computed from this record and its thread" actions={<HealthBadge health={h} />}>
      <ul className="space-y-2.5">
        {h.dimensions.map((d) => (
          <li key={d.key}>
            <div className="flex items-baseline justify-between gap-2 text-meta">
              <span className="font-medium">{d.label}</span>
              <span className="num text-ink-3">{Math.round(d.score * 100)} %</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]" role="meter" aria-label={`${d.label} ${Math.round(d.score * 100)} percent`} aria-valuenow={Math.round(d.score * 100)} aria-valuemin={0} aria-valuemax={100}>
              <div className={clsx('h-full rounded-full', BAR[tone(d.score)])} style={{ width: `${Math.max(3, d.score * 100)}%` }} />
            </div>
            <p className="mt-0.5 text-micro text-ink-3">{d.reason}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
