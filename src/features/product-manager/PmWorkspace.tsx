import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/badges';
import { RecordLink } from '../../components/RecordLink';
import { NextActionLine } from '../../components/ThreadPanels';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Tabs } from '../../components/ui';
import { ACTIVITY_KINDS, PRIORITIES, type Activity } from '../../domain/entities';
import { useData, type Rec } from '../../hooks/useData';
import { newLocalId, repo } from '../../repositories';
import { isActive, nextActions } from '../../services/nextAction';
import { addDays, fmtDate, relativeDay, todayIso } from '../../utils/dates';

type Tab = 'today' | 'week' | 'overdue' | 'followups' | 'meetings' | 'next';

function ActivityRow({ a }: { a: Activity & Rec }) {
  const done = a.status === 'Completed';
  return (
    <li className="flex flex-wrap items-start gap-2 border-b border-line/60 py-1.5">
      <button
        type="button"
        aria-label={done ? 'Completed' : `Mark "${a.name}" completed`}
        disabled={done}
        onClick={() => void repo().workspace.save({ ...a, status: 'Completed', __origin: undefined, __dataset: undefined }, 'Completed activity')}
        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border ${done ? 'border-ok bg-ok text-white' : 'border-line hover:border-accent'}`}
      >
        {done && <Check className="size-3" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{a.kind.replace('_', ' ')}</Badge>
          <RecordLink id={a.id} />
          <StatusBadge s={a.priority} />
          <StatusBadge s={a.status} />
        </div>
        <div className="text-meta text-ink-3">
          {a.due_date && <span className={a.due_date < todayIso() && !done ? 'text-bad' : ''}>due {fmtDate(a.due_date)} ({relativeDay(a.due_date)})</span>}
          {a.customer_id && (
            <>
              {' · '}
              <RecordLink id={a.customer_id} />
            </>
          )}
          {a.blocker && <span className="text-bad"> · blocker: {a.blocker}</span>}
        </div>
      </div>
    </li>
  );
}

function QuickAdd() {
  const { records } = useData();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<string>('task');
  const [due, setDue] = useState(todayIso());
  const [prio, setPrio] = useState('Medium');
  const [cust, setCust] = useState('');
  const [msg, setMsg] = useState('');
  const customers = records.filter((r) => r.entity === 'customer');
  const add = async () => {
    if (!name.trim()) return setMsg('Give the activity a title.');
    await repo().workspace.save({ id: newLocalId('activity'), entity: 'activity', name: name.trim(), kind, status: 'Not Started', priority: prio, due_date: due || undefined, customer_id: cust || undefined, data_type: 'USER_CREATED', provenance: { verification_status: 'DRAFT' } }, 'Quick-added activity');
    setName('');
    setMsg('Added (local draft).');
  };
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void add();
      }}
    >
      <Input aria-label="Activity title" placeholder="New activity, follow-up or meeting…" value={name} onChange={(e) => setName(e.target.value)} className="min-w-[220px] flex-1" />
      <Select aria-label="Kind" value={kind} onChange={(e) => setKind(e.target.value)} className="w-32">
        {ACTIVITY_KINDS.map((k) => (
          <option key={k} value={k}>
            {k.replace('_', ' ')}
          </option>
        ))}
      </Select>
      <Select aria-label="Priority" value={prio} onChange={(e) => setPrio(e.target.value)} className="w-28">
        {PRIORITIES.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </Select>
      <Input aria-label="Due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-40" />
      <Select aria-label="Customer" value={cust} onChange={(e) => setCust(e.target.value)} className="w-48">
        <option value="">No customer</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="primary">
        Add
      </Button>
      {msg && <span className="text-meta text-ink-3">{msg}</span>}
    </form>
  );
}

/** PRODUCT MANAGER COMMAND CENTER (spec §10, §67, §112) — the tracker, on the shared entity model. */
export default function PmWorkspace() {
  const { records } = useData();
  const [tab, setTab] = useState<Tab>('today');
  const today = todayIso();
  const weekEnd = addDays(today, 7);
  const acts = useMemo(() => records.filter((r) => r.entity === 'activity') as (Activity & Rec)[], [records]);
  const open = acts.filter((a) => isActive(a));
  const lists: Record<Tab, (Activity & Rec)[]> = {
    today: open.filter((a) => a.due_date === today || a.follow_up_date === today),
    week: open.filter((a) => a.due_date && a.due_date >= today && a.due_date <= weekEnd).sort((a, b) => (a.due_date ?? '').localeCompare(b.due_date ?? '')),
    overdue: open.filter((a) => a.due_date && a.due_date < today),
    followups: open.filter((a) => a.kind === 'follow_up' || a.follow_up_date).sort((a, b) => (a.follow_up_date ?? a.due_date ?? '').localeCompare(b.follow_up_date ?? b.due_date ?? '')),
    meetings: acts.filter((a) => a.kind === 'meeting').sort((a, b) => (b.due_date ?? '').localeCompare(a.due_date ?? '')),
    next: [],
  };
  const na = useMemo(() => nextActions(records, today), [records, today]);
  const count = (e: string, f?: (r: Rec) => boolean) => records.filter((r) => r.entity === e && (!f || f(r))).length;
  const section = (label: string, to: string, n: number) => (
    <Link to={to} className="flex items-center justify-between rounded border border-line px-2 py-1 hover:border-accent">
      <span>{label}</span>
      <b className="num">{n}</b>
    </Link>
  );

  return (
    <div>
      <PageHeader eyebrow="Product Manager" title="My Workspace" subtitle="Daily activities, follow-ups, meetings and next actions — linked to the same customers, opportunities, products and projects as the rest of the OS." />
      <Card className="mb-3">
        <QuickAdd />
      </Card>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Tabs
            label="Workspace views"
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'today', label: 'Today', count: lists.today.length },
              { key: 'week', label: 'This week', count: lists.week.length },
              { key: 'overdue', label: 'Overdue', count: lists.overdue.length },
              { key: 'followups', label: 'Follow-ups', count: lists.followups.length },
              { key: 'meetings', label: 'Meetings', count: lists.meetings.length },
              { key: 'next', label: 'Next actions', count: na.length },
            ]}
          />
          {tab === 'next' ? (
            <ul>
              {na.map((x) => (
                <li key={x.record.id} className="border-b border-line/60 py-1.5">
                  <RecordLink id={x.record.id} showEntity />
                  <div className="pl-1 text-body">
                    <NextActionLine record={x.record} />
                  </div>
                </li>
              ))}
            </ul>
          ) : lists[tab].length ? (
            <ul>
              {lists[tab].map((a) => (
                <ActivityRow key={a.id} a={a} />
              ))}
            </ul>
          ) : (
            <EmptyState title="Nothing here" explain={tab === 'overdue' ? 'No overdue activities.' : 'No activities in this view. Add one above, or import your legacy tracker data (Admin → Legacy import).'} />
          )}
        </div>
        <div className="space-y-3">
          <Card title="Portfolio">
            <div className="grid grid-cols-1 gap-1 text-body">
              {section('Customers', '/customers', count('customer'))}
              {section('Opportunities (active)', '/opportunities', count('opportunity', isActive))}
              {section('POCs / samples (active)', '/poc', count('poc', isActive))}
              {section('Products / platforms', '/products', count('product'))}
              {section('R&D — technologies tracked', '/technology', count('technology'))}
              {section('Localization items', '/localization', count('localization'))}
              {section('Suppliers', '/suppliers', count('supplier'))}
              {section('Competitors', '/companies', count('company', (r) => ((r as { roles?: string[] }).roles ?? []).includes('competitor')))}
              {section('Projects', '/projects', count('project'))}
              {section('Gates reviewed', '/gates', records.filter((r) => r.entity === 'project').reduce((s, p) => s + ((p as { gates?: unknown[] }).gates?.length ?? 0), 0))}
              {section('Open risks', '/quality', count('risk', (r) => (r as { risk_status?: string }).risk_status === 'Open'))}
              {section('Roadmap', '/roadmap', count('product') + count('opportunity'))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
