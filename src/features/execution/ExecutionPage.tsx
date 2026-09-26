import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Flag, KanbanSquare } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../../components/badges';
import { recordPath } from '../../components/RecordLink';
import { toast } from '../../components/toast';
import { Badge, Card, EmptyState, IconButton, PageHeader, Table, Tabs } from '../../components/ui';
import type { Activity, Project, Risk } from '../../domain/entities';
import { useData, useRecords, type Rec } from '../../hooks/useData';
import { repo, ValidationFailure } from '../../repositories';
import { addDays, daysBetween, fmtDate, todayIso } from '../../utils/dates';

type Tab = 'kanban' | 'table' | 'timeline' | 'calendar' | 'milestones' | 'risks';
const COLS = ['Not Started', 'In Progress', 'Blocked', 'Completed'] as const;

interface Item {
  key: string;
  kind: 'task' | 'activity';
  name: string;
  status: string;
  start?: string;
  end?: string;
  owner?: string;
  milestone: boolean;
  deps: number;
  context: string;
  recordId: string;
  project?: Project & Rec;
  taskId?: string;
  activity?: Activity & Rec;
}

const colOf = (s: string) => (s === 'Waiting' ? 'Blocked' : s === 'Cancelled' ? 'Completed' : s);

/**
 * PROJECT EXECUTION (final master prompt §24): project tasks and activities in one place — kanban,
 * table, timeline, calendar, milestones and a risk matrix. Moving a card saves a local draft of the
 * project (task status) or the activity.
 */
export default function ExecutionPage() {
  const projects = useRecords<Project>('project');
  const activities = useRecords<Activity>('activity');
  const risks = useRecords<Risk>('risk');
  const { byId } = useData();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('view') as Tab | null) ?? 'kanban';
  const today = todayIso();
  const [month, setMonth] = useState(today.slice(0, 7));
  const [cell, setCell] = useState<string | null>(null);

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const p of projects)
      for (const t of p.tasks)
        out.push({ key: `${p.id}:${t.id}`, kind: 'task', name: t.name, status: t.status, start: t.start, end: t.end, owner: t.owner, milestone: !!t.milestone || !!t.gate_code, deps: t.depends_on?.length ?? 0, context: p.name, recordId: p.id, project: p, taskId: t.id });
    for (const a of activities)
      out.push({ key: a.id, kind: 'activity', name: a.name, status: a.status, end: a.due_date ?? a.follow_up_date, owner: a.owner, milestone: false, deps: 0, context: [a.kind.replace('_', ' '), a.customer_id ? `customer: ${byId.get(a.customer_id)?.name ?? a.customer_id}` : '', a.supplier_id ? `supplier: ${byId.get(a.supplier_id)?.name ?? a.supplier_id}` : ''].filter(Boolean).join(' · '), recordId: a.id, activity: a });
    return out;
  }, [projects, activities, byId]);

  const move = async (it: Item, status: string) => {
    try {
      if (it.kind === 'task' && it.project) {
        const p = it.project;
        await repo().workspace.save({ ...p, tasks: p.tasks.map((t) => (t.id === it.taskId ? { ...t, status } : t)), __origin: undefined, __dataset: undefined } as Record<string, unknown>, `Task “${it.name}” → ${status}`);
      } else if (it.activity) {
        await repo().workspace.save({ ...it.activity, status, __origin: undefined, __dataset: undefined } as Record<string, unknown>, `Activity “${it.name}” → ${status}`);
      }
    } catch (e) {
      toast('Not moved', { tone: 'error', detail: e instanceof ValidationFailure ? e.message : (e as Error).message });
    }
  };

  const dated = items.filter((i) => i.end);
  const milestones = [
    ...items.filter((i) => i.milestone && i.end),
    ...projects.filter((p) => p.end).map<Item>((p) => ({ key: `${p.id}:end`, kind: 'task', name: `${p.name} — project end`, status: '', end: p.end, milestone: true, deps: 0, context: 'Project end', recordId: p.id })),
  ].sort((a, b) => (a.end ?? '').localeCompare(b.end ?? ''));

  const openRisks = risks.filter((r) => r.risk_status === 'Open' || r.risk_status === 'Mitigating');
  const band = (v: number | null | undefined) => (v == null ? null : Math.min(4, Math.floor((v - 1) / 2)));
  const scored = openRisks.filter((r) => r.severity != null && r.occurrence != null);
  const inCell = (si: number, oi: number) => scored.filter((r) => band(r.severity) === si && band(r.occurrence) === oi);

  return (
    <div className="space-y-5">
      <PageHeader title="Execution" subtitle="Tasks, milestones, owners, dependencies, customer and supplier actions and risks across every project — in the view that fits the question." />
      <Tabs<Tab>
        label="Execution views"
        value={tab}
        onChange={(t) => setParams(t === 'kanban' ? {} : { view: t })}
        tabs={[
          { key: 'kanban', label: 'Kanban' },
          { key: 'table', label: 'Table', count: items.length },
          { key: 'timeline', label: 'Timeline' },
          { key: 'calendar', label: 'Calendar' },
          { key: 'milestones', label: 'Milestones', count: milestones.length },
          { key: 'risks', label: 'Risk matrix', count: openRisks.length },
        ]}
      />
      {!items.length && tab !== 'risks' ? (
        <EmptyState icon={KanbanSquare} title="No tasks or activities" explain="Create a project (its tasks appear here) or log activities." />
      ) : tab === 'kanban' ? (
        <div className="scroll-thin flex gap-3 overflow-x-auto pb-2" role="list" aria-label="Kanban">
          {COLS.map((c) => {
            const here = items.filter((i) => colOf(i.status) === c);
            return (
              <section key={c} role="listitem" aria-label={`${c}: ${here.length}`} className="surface flex w-72 shrink-0 flex-col rounded-card p-2.5">
                <h2 className="mb-2 flex items-center justify-between px-1 text-meta font-semibold">
                  {c === 'Blocked' ? 'Blocked / waiting' : c} <span className="num rounded-full bg-ink/[0.06] px-2 text-micro text-ink-3">{here.length}</span>
                </h2>
                <ul className="scroll-thin flex max-h-[65vh] flex-col gap-2 overflow-y-auto">
                  {here.map((i) => (
                    <li key={i.key} className={clsx('rounded-control border bg-solid/70 p-2.5 text-meta', i.end && i.end < today && c !== 'Completed' ? 'border-bad/50' : 'border-line')}>
                      <Link to={recordPath(i.recordId)} className="font-medium hover:text-accent-2 hover:underline">
                        {i.milestone && <Flag className="mr-1 inline size-3.5 text-accent" aria-label="Milestone" />}
                        {i.name}
                      </Link>
                      <div className="mt-0.5 text-micro text-ink-3">
                        {i.kind === 'task' ? i.context : i.context}
                        {i.end && ` · due ${fmtDate(i.end)}`}
                        {i.owner && ` · ${i.owner}`}
                      </div>
                      <select aria-label={`Move ${i.name}`} value={i.kind === 'activity' ? i.status : colOf(i.status)} onChange={(e) => void move(i, e.target.value)} className="mt-1.5 rounded-md border border-line bg-transparent px-1 py-0.5 text-micro">
                        {(i.kind === 'activity' ? ['Not Started', 'In Progress', 'Blocked', 'Waiting', 'Completed', 'Cancelled'] : COLS).map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </li>
                  ))}
                  {!here.length && <li className="px-1 text-micro text-ink-3">Empty</li>}
                </ul>
              </section>
            );
          })}
        </div>
      ) : tab === 'table' ? (
        <div className="surface scroll-thin overflow-x-auto rounded-card p-2">
          <Table head={['Item', 'Kind', 'Project / context', 'Owner', 'Start', 'Due', 'Dependencies', 'Status']} dense>
            {items.map((i) => (
              <tr key={i.key} className="border-t border-line/60">
                <td>
                  <Link to={recordPath(i.recordId)} className="text-accent-2 hover:underline">
                    {i.name}
                  </Link>
                </td>
                <td>{i.milestone ? 'Milestone' : i.kind === 'task' ? 'Task' : 'Action'}</td>
                <td>{i.context}</td>
                <td>{i.owner ?? '—'}</td>
                <td>{fmtDate(i.start)}</td>
                <td className={i.end && i.end < today && colOf(i.status) !== 'Completed' ? 'text-bad' : ''}>{fmtDate(i.end)}</td>
                <td className="num">{i.deps}</td>
                <td>
                  <StatusBadge s={i.status} />
                </td>
              </tr>
            ))}
          </Table>
        </div>
      ) : tab === 'timeline' ? (
        <Timeline items={items.filter((i) => i.kind === 'task' && i.start && i.end)} today={today} />
      ) : tab === 'calendar' ? (
        <Card
          title={new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })}
          actions={
            <>
              <IconButton size="sm" label="Previous month" icon={ChevronLeft} onClick={() => setMonth(addDays(`${month}-01`, -1).slice(0, 7))} />
              <IconButton size="sm" label="Next month" icon={ChevronRight} onClick={() => setMonth(addDays(`${month}-28`, 5).slice(0, 7))} />
            </>
          }
        >
          <Calendar month={month} items={dated} today={today} />
        </Card>
      ) : tab === 'milestones' ? (
        <Card title="Milestones" icon={Flag} description="Milestone and gate tasks, and project end dates">
          <ol className="space-y-2 border-l border-line pl-4">
            {milestones.map((m) => {
              const d = daysBetween(today, m.end!);
              const done = colOf(m.status) === 'Completed';
              return (
                <li key={m.key} className="relative text-meta">
                  <span className={clsx('absolute top-1.5 -left-[1.3rem] size-2.5 rounded-full', done ? 'bg-ok' : d < 0 ? 'bg-bad' : 'bg-accent')} aria-hidden />
                  <Link to={recordPath(m.recordId)} className="font-medium hover:text-accent-2 hover:underline">
                    {m.name}
                  </Link>
                  <span className="text-ink-3">
                    {' '}
                    · {m.context} · {fmtDate(m.end)} {done ? '· done' : d < 0 ? `· ${-d} days overdue` : `· in ${d} days`}
                  </span>
                </li>
              );
            })}
            {!milestones.length && <li className="text-ink-3">No milestones.</li>}
          </ol>
        </Card>
      ) : (
        <Card title="Risk matrix — severity × occurrence" description={`${scored.length} of ${openRisks.length} open risks scored; unscored risks are listed below`}>
          <div className="scroll-thin overflow-x-auto">
            <table className="border-separate border-spacing-1 text-micro" aria-label="Risk matrix">
              <thead>
                <tr>
                  <th />
                  {['1–2', '3–4', '5–6', '7–8', '9–10'].map((o) => (
                    <th key={o} scope="col" className="font-medium text-ink-3">
                      O {o}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[4, 3, 2, 1, 0].map((si) => (
                  <tr key={si}>
                    <th scope="row" className="pr-1 text-right font-medium text-ink-3">
                      S {si * 2 + 1}–{si * 2 + 2}
                    </th>
                    {[0, 1, 2, 3, 4].map((oi) => {
                      const list = inCell(si, oi);
                      const heat = si + oi;
                      const k = `${si}:${oi}`;
                      return (
                        <td key={oi} className="p-0">
                          <button
                            type="button"
                            disabled={!list.length}
                            aria-pressed={cell === k}
                            aria-label={`Severity ${si * 2 + 1}–${si * 2 + 2}, occurrence ${oi * 2 + 1}–${oi * 2 + 2}: ${list.length}`}
                            onClick={() => setCell(cell === k ? null : k)}
                            className={clsx('grid size-14 place-items-center rounded-md border text-meta font-semibold', heat >= 7 ? 'bg-bad/25' : heat >= 5 ? 'bg-bad/12' : heat >= 3 ? 'bg-warn/15' : 'bg-ok/10', cell === k ? 'border-accent ring-2 ring-accent/40' : 'border-line', !list.length && 'opacity-50')}
                          >
                            {list.length || ''}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-3 space-y-1 text-meta">
            {(cell ? inCell(Number(cell[0]), Number(cell[2])) : openRisks.filter((r) => r.severity == null || r.occurrence == null)).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <Link to={recordPath(r.id)} className="text-accent-2 hover:underline">
                  {r.name}
                </Link>
                <Badge>{r.severity != null && r.occurrence != null ? `S${r.severity} · O${r.occurrence}${r.detection != null ? ` · D${r.detection}` : ''}` : 'not scored'}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Timeline({ items, today }: { items: Item[]; today: string }) {
  if (!items.length) return <EmptyState title="No scheduled tasks" explain="Project tasks with start and end dates appear here." compact />;
  const min = items.map((i) => i.start!).sort()[0];
  const max = items.map((i) => i.end!).sort().at(-1)!;
  const span = Math.max(1, daysBetween(min, max));
  const pos = (d: string) => `${(daysBetween(min, d) / span) * 100}%`;
  const byProject = [...new Set(items.map((i) => i.context))];
  return (
    <Card title="Timeline" description={`${fmtDate(min)} → ${fmtDate(max)}`}>
      <div className="relative space-y-4">
        {today >= min && today <= max && <span className="absolute inset-y-0 w-px border-l border-dashed border-bad/60" style={{ left: `calc(12rem + (100% - 12rem) * ${daysBetween(min, today) / span})` }} aria-hidden />}
        {byProject.map((p) => (
          <div key={p}>
            <div className="mb-1 text-meta font-semibold">{p}</div>
            <ul className="space-y-1">
              {items
                .filter((i) => i.context === p)
                .map((i) => (
                  <li key={i.key} className="grid grid-cols-[12rem_1fr] items-center gap-2 text-micro">
                    <span className="truncate" title={i.name}>
                      {i.name}
                    </span>
                    <span className="relative h-3 rounded bg-ink/[0.05]">
                      <span
                        className={clsx('absolute inset-y-0 rounded', colOf(i.status) === 'Completed' ? 'bg-ok/70' : colOf(i.status) === 'Blocked' ? 'bg-bad/70' : i.milestone ? 'bg-accent' : 'bg-accent/60')}
                        style={{ left: pos(i.start!), width: `max(4px, calc(${pos(i.end!)} - ${pos(i.start!)}))` }}
                        title={`${fmtDate(i.start)} → ${fmtDate(i.end)}`}
                      />
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Calendar({ month, items, today }: { month: string; items: Item[]; today: string }) {
  const first = `${month}-01`;
  const startDow = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  const cells = [...Array(startDow).fill(null), ...Array.from({ length: days }, (_, i) => addDays(first, i))];
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-micro font-medium text-ink-3" aria-hidden>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <ol className="mt-1 grid grid-cols-7 gap-1" aria-label="Calendar">
        {cells.map((d, i) => {
          const here = d ? items.filter((x) => x.end === d) : [];
          return (
            <li key={i} className={clsx('min-h-20 rounded-md border p-1', d ? 'border-line' : 'border-transparent', d === today && 'border-accent ring-1 ring-accent/40')} aria-label={d ? `${fmtDate(d)}: ${here.length} item(s)` : undefined}>
              {d && <div className="num text-micro text-ink-3">{Number(d.slice(8))}</div>}
              <ul className="space-y-0.5">
                {here.slice(0, 3).map((x) => (
                  <li key={x.key} className="truncate text-micro">
                    <Link to={recordPath(x.recordId)} className={clsx('hover:underline', x.milestone ? 'font-semibold text-accent-2' : 'text-ink-2')} title={x.name}>
                      {x.name}
                    </Link>
                  </li>
                ))}
                {here.length > 3 && <li className="text-micro text-ink-3">+{here.length - 3}</li>}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
