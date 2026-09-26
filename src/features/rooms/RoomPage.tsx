import { ArrowUpRight, BellRing, CalendarClock, FileSearch, GitBranch, Lightbulb, ListChecks, MessageSquareText, Plus, ShieldAlert, Wrench } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AttentionRow } from '../../app/shell/StatusCenter';
import { trackRecent } from '../../app/shell/recents';
import { DataTypeBadge, StatusBadge } from '../../components/badges';
import { EntityForm } from '../../components/EntityForm';
import { HealthBadge, HealthCard, useHealth } from '../../components/Health';
import { LifecycleCard } from '../../components/LifecycleCard';
import { SevenQuestions } from '../../components/SevenQuestions';
import { recordPath } from '../../components/RecordLink';
import { RelationshipBar } from '../../components/RelationshipBar';
import { NextActionLine } from '../../components/ThreadPanels';
import { Button, buttonClass, Card, Drawer, EmptyState, Notice } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData } from '../../hooks/useData';
import { attentionItems } from '../../services/attention';
import { whatIsMissing } from '../../services/gaps';
import { fmtDate, relativeDay, todayIso } from '../../utils/dates';
import { isRoomEntity, presetFor, ROOM_LABEL, roomContents, roomTimeline } from './rooms';

const STATUS_KEYS = ['status', 'stage', 'poc_status', 'risk_status', 'rfq_status', 'ticket_status', 'cr_status', 'maturity'];
const statusOf = (r: AnyRecord) => STATUS_KEYS.map((k) => (r as Record<string, unknown>)[k]).find((v) => typeof v === 'string') as string | undefined;

function RecordList({ items, empty, extra }: { items: AnyRecord[]; empty: string; extra?: (r: AnyRecord) => ReactNode }) {
  if (!items.length) return <p className="text-meta text-ink-3">{empty}</p>;
  return (
    <ul className="divide-y divide-line/60">
      {items.map((r) => (
        <li key={r.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5">
          <Link to={recordPath(r.id)} className="min-w-0 flex-1 font-medium text-accent-2 hover:underline">
            {r.name}
          </Link>
          {extra?.(r)}
          <StatusBadge s={statusOf(r)} />
        </li>
      ))}
    </ul>
  );
}

const CREATE: { entity: string; label: string; icon: typeof Plus }[] = [
  { entity: 'activity', label: 'Log activity', icon: ListChecks },
  { entity: 'risk', label: 'Add risk', icon: ShieldAlert },
  { entity: 'decision', label: 'Record decision', icon: GitBranch },
  { entity: 'change_request', label: 'Raise change', icon: Wrench },
  { entity: 'lesson', label: 'Capture lesson', icon: Lightbulb },
];

/** A ROOM: everything about one program / product / POC / supplier / opportunity / customer in one place. */
export default function RoomPage() {
  const { id = '' } = useParams();
  const rid = decodeURIComponent(id);
  const { byId, graph, records } = useData();
  const nav = useNavigate();
  const subject = byId.get(rid);
  const health = useHealth(subject);
  const [creating, setCreating] = useState<string | null>(null);
  const today = todayIso();

  const room = useMemo(() => roomContents(graph, rid), [graph, rid]);
  const attention = useMemo(() => {
    const ids = new Set([rid, ...room.all.map((r) => r.id)]);
    return attentionItems(records.filter((r) => ids.has(r.id)), today).slice(0, 6);
  }, [records, room, rid, today]);
  const gaps = useMemo(() => whatIsMissing(graph, rid).filter((g) => g.status === 'missing' && g.item !== 'Controlled documents').slice(0, 6), [graph, rid]);
  const timeline = useMemo(() => (subject ? roomTimeline(subject, room.all).slice(0, 14) : []), [subject, room]);

  useEffect(() => {
    if (subject) void trackRecent({ id: subject.id, entity: subject.entity, name: subject.name });
  }, [subject?.id, subject?.name, subject?.entity]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!subject || !isRoomEntity(subject.entity))
    return (
      <EmptyState
        title="No room for this record"
        explain={subject ? `Rooms exist for programs, products, POCs, suppliers, opportunities and customers — “${subject.name}” is a ${ENTITY_BY_TYPE[subject.entity]?.label.toLowerCase()}.` : `No record with id “${rid}”.`}
        actions={
          <>
            {subject && <Button onClick={() => nav(recordPath(subject.id))}>Open the record</Button>}
            <Button variant="primary" onClick={() => nav('/rooms')}>
              All rooms
            </Button>
          </>
        }
      />
    );

  const label = ROOM_LABEL[subject.entity];
  const activities = room.byEntity('activity').sort((a, b) => String((b as { due_date?: string }).due_date ?? '').localeCompare(String((a as { due_date?: string }).due_date ?? '')));
  const meetings = activities.filter((a) => (a as { kind?: string }).kind === 'meeting');
  const risks = room.byEntity('risk');
  const decisions = [...room.byEntity('decision'), ...room.byEntity('change_request')];
  const lessons = room.byEntity('lesson');
  const evidence = [...room.byEntity('evidence'), ...room.byEntity('source')];
  const technical = ['requirement', 'poc', 'doe', 'configuration', 'bom', 'cost_model', 'acceptance', 'rfq', 'component', 'module'].flatMap((e) => room.byEntity(e));
  const def = ENTITY_BY_TYPE[creating ?? ''];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-4xl">
          <Link to="/rooms" className="text-micro font-semibold uppercase tracking-[0.08em] text-accent-2 hover:underline">
            {label} room
          </Link>
          <h1 className="mt-1 text-title font-semibold tracking-[-0.02em]">{subject.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge s={statusOf(subject)} />
            {health && <HealthBadge health={health} />}
            <DataTypeBadge t={subject.data_type} />
            <span className="text-micro text-ink-3">
              {room.all.length} connected record{room.all.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <Link to={`/ask?q=${encodeURIComponent(subject.name)}`} className={buttonClass('secondary')}>
            <MessageSquareText className="size-4" aria-hidden /> Ask about this
          </Link>
          <Link to={recordPath(subject.id)} className={buttonClass('secondary')}>
            <ArrowUpRight className="size-4" aria-hidden /> Open record
          </Link>
        </div>
      </header>

      {subject.data_type === 'DEMO' && <Notice tone="info">Demo record — fictional data that demonstrates the workflow.</Notice>}
      <RelationshipBar record={subject} relatedHref={`${recordPath(subject.id)}?tab=related`} />

      <div className="flex flex-wrap gap-2 no-print" aria-label="Add to this room">
        {CREATE.map((c) => (
          <Button key={c.entity} size="sm" onClick={() => setCreating(c.entity)}>
            <c.icon className="size-3.5" aria-hidden /> {c.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 space-y-4 xl:col-span-2">
          <Card title="Now" icon={BellRing} description="Next action and what needs attention in this room" edge>
            <div className="mb-3 rounded-control bg-ink/[0.03] p-3">
              <div className="mb-1 text-micro font-semibold uppercase tracking-[0.06em] text-ink-3">Next action</div>
              <NextActionLine record={subject} />
            </div>
            {attention.length ? (
              <ul className="-mx-2.5">
                {attention.map((a) => (
                  <li key={a.id}>
                    <AttentionRow item={a} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-meta text-ink-3">Nothing overdue, blocked or at risk in this room.</p>
            )}
          </Card>
          {['opportunity', 'project', 'product'].includes(subject.entity) && <SevenQuestions record={subject} />}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Activities & meetings" icon={ListChecks} description={`${activities.length} activities · ${meetings.length} meetings`}>
              <RecordList
                items={activities.slice(0, 10)}
                empty="No activities logged yet."
                extra={(a) => {
                  const due = (a as { due_date?: string }).due_date;
                  return due ? <span className="text-micro text-ink-3">{relativeDay(due, today)}</span> : null;
                }}
              />
            </Card>
            <Card title="Risks" icon={ShieldAlert} description={`${risks.filter((r) => (r as { risk_status?: string }).risk_status === 'Open').length} open`}>
              <RecordList
                items={risks}
                empty="No risks recorded."
                extra={(r) => {
                  const x = r as { severity?: number | null; occurrence?: number | null; detection?: number | null };
                  return x.severity != null && x.occurrence != null && x.detection != null ? <span className="num text-micro text-ink-3">RPN {x.severity * x.occurrence * x.detection}</span> : null;
                }}
              />
            </Card>
            <Card title="Decisions & changes" icon={GitBranch}>
              <RecordList items={decisions} empty="No decisions or change requests linked." />
            </Card>
            <Card title="Lessons learned" icon={Lightbulb}>
              <RecordList items={lessons} empty="No lessons captured yet." />
            </Card>
          </div>
          <Card title="Engineering work" icon={Wrench} description="Requirements, POCs, DOE, configurations, BOMs, cost, protocols">
            <RecordList items={technical} empty="No engineering records linked yet." extra={(r) => <span className="text-micro text-ink-3">{ENTITY_BY_TYPE[r.entity]?.label}</span>} />
          </Card>
        </div>
        <div className="min-w-0 space-y-4">
          {['opportunity', 'project', 'product'].includes(subject.entity) && <LifecycleCard id={subject.id} />}
          <HealthCard record={subject} />
          {gaps.length > 0 && (
            <Card title="What is missing" icon={ListChecks}>
              <ul className="space-y-2 text-meta">
                {gaps.map((g) => (
                  <li key={g.item}>
                    <div className="font-medium">{g.item}</div>
                    {g.action && <div className="text-ink-3">{g.action}</div>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card title="Timeline" icon={CalendarClock}>
            {timeline.length ? (
              <ol className="space-y-2 border-l border-line pl-4">
                {timeline.map((e, i) => (
                  <li key={i} className="relative text-meta">
                    <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-accent" aria-hidden />
                    <Link to={recordPath(e.recordId)} className="hover:text-accent-2 hover:underline">
                      {e.label}
                    </Link>
                    <div className="text-micro text-ink-3">{fmtDate(e.date)}</div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-meta text-ink-3">No dated events yet.</p>
            )}
          </Card>
          <Card title="Evidence & sources" icon={FileSearch}>
            <RecordList items={evidence} empty="No evidence linked." />
          </Card>
        </div>
      </div>

      <Drawer open={!!creating} onClose={() => setCreating(null)} title={`New ${def?.label.toLowerCase() ?? 'record'} in this room`} subtitle={`Linked to ${subject.name}. Saved as a local draft.`} wide>
        {creating && <EntityForm entity={creating} preset={presetFor(subject, creating)} onCancel={() => setCreating(null)} onSaved={() => setCreating(null)} />}
      </Drawer>
    </div>
  );
}
