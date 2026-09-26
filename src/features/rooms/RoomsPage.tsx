import { DoorOpen } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../../components/badges';
import { HealthBadge } from '../../components/Health';
import { EmptyState, PageHeader, Tabs } from '../../components/ui';
import { useData } from '../../hooks/useData';
import { entityHealth } from '../../services/health';
import { isActive } from '../../services/nextAction';
import { todayIso } from '../../utils/dates';
import { ROOM_ENTITIES, ROOM_LABEL, roomContents, roomPath, type RoomEntity } from './rooms';

const STATUS_KEYS = ['status', 'stage', 'poc_status', 'maturity'];

/** ROOMS index: pick a program, product, POC, supplier, opportunity or customer and work in its room. */
export default function RoomsPage() {
  const { records, graph } = useData();
  const [params, setParams] = useSearchParams();
  const kind = (params.get('type') as RoomEntity | null) ?? 'project';
  const today = todayIso();
  const list = useMemo(
    () =>
      records
        .filter((r) => r.entity === kind)
        .sort((a, b) => Number(isActive(b)) - Number(isActive(a)) || a.name.localeCompare(b.name))
        .slice(0, 90)
        .map((r) => {
          const c = roomContents(graph, r.id);
          return { r, health: entityHealth(r, graph, today), activities: c.byEntity('activity').length, risks: c.byEntity('risk').length };
        }),
    [records, graph, kind, today],
  );
  return (
    <div className="space-y-5">
      <PageHeader title="Rooms" subtitle="One place per program, product, POC, supplier, opportunity or customer: next action, attention, activities, risks, decisions, lessons, evidence and timeline." />
      <Tabs<RoomEntity> label="Room type" value={kind} onChange={(t) => setParams({ type: t })} tabs={ROOM_ENTITIES.map((e) => ({ key: e, label: `${ROOM_LABEL[e]}s`, count: records.filter((r) => r.entity === e).length }))} />
      {!list.length ? (
        <EmptyState icon={DoorOpen} title={`No ${ROOM_LABEL[kind].toLowerCase()}s yet`} explain="Create one and its room appears here." compact />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Rooms">
          {list.map(({ r, health, activities, risks }) => (
            <li key={r.id}>
              <Link to={roomPath(r.id)} className="surface interactive flex h-full flex-col gap-2 rounded-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-ink">{r.name}</span>
                  <StatusBadge s={STATUS_KEYS.map((k) => (r as Record<string, unknown>)[k]).find((v) => typeof v === 'string') as string | undefined} />
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2 text-micro text-ink-3">
                  <HealthBadge health={health} />
                  <span>
                    {activities} activit{activities === 1 ? 'y' : 'ies'} · {risks} risk{risks === 1 ? '' : 's'}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
