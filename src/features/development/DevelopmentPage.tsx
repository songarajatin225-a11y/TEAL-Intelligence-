import { Milestone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/badges';
import { LifecycleCard } from '../../components/LifecycleCard';
import { recordPath } from '../../components/RecordLink';
import { Badge, Card, EmptyState, PageHeader, SegmentedControl, Table } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData } from '../../hooks/useData';
import { neighbours } from '../../services/graph';
import { LIFECYCLE_STAGES, lifecycleFor } from '../../services/lifecycle';
import { isActive } from '../../services/nextAction';
import { fmtDate } from '../../utils/dates';
import { isRoomEntity, roomPath } from '../rooms/rooms';

type View = 'board' | 'table';

/**
 * PRODUCT DEVELOPMENT (final master prompt §16): every active opportunity and project placed on the
 * 17-stage lifecycle by its evidence, with owner, timeline, budget, customer, suppliers, technology
 * (TRL), risks, dependencies, milestones and deliverables from the linked records.
 */
export default function DevelopmentPage() {
  const { records, graph, byId } = useData();
  const [view, setView] = useState<View>('board');
  const [open, setOpen] = useState<string | null>(null);
  const items = useMemo(() => {
    const subjects = records.filter((r) => (r.entity === 'opportunity' || r.entity === 'project') && isActive(r));
    // a project supersedes its opportunity (same development)
    const projOpps = new Set(subjects.filter((r) => r.entity === 'project').map((p) => (p as { opportunity_id?: string }).opportunity_id));
    return subjects
      .filter((r) => !(r.entity === 'opportunity' && projOpps.has(r.id)))
      .map((r) => {
        const x = r as AnyRecord & Record<string, unknown>;
        const n = neighbours(graph, r.id).map((k) => k.record);
        const tasks = (x.tasks as { milestone?: boolean; depends_on?: string[]; end: string; name: string }[] | undefined) ?? [];
        const techs = ((x.technology_ids as string[] | undefined) ?? []).map((t) => byId.get(t)).filter(Boolean) as (AnyRecord & { trl?: number | null })[];
        return {
          r,
          lc: lifecycleFor(graph, r.id),
          owner: r.owner ?? r.next_action?.owner,
          timeline: x.start && x.end ? `${fmtDate(String(x.start))} → ${fmtDate(String(x.end))}` : r.next_action?.due ? `next due ${fmtDate(r.next_action.due)}` : null,
          budget: typeof x.budget === 'number' ? `${String(x.currency ?? '')} ${x.budget.toLocaleString('en-IN')}` : null,
          customer: x.customer_id ? byId.get(String(x.customer_id))?.name : null,
          suppliers: n.filter((k) => k.entity === 'supplier').length,
          technology: techs.map((t) => `${t.name}${t.trl ? ` (TRL ${t.trl})` : ''}`).join(', '),
          risks: n.filter((k) => k.entity === 'risk' && (k as { risk_status?: string }).risk_status === 'Open').length,
          dependencies: tasks.filter((t) => t.depends_on?.length).length,
          milestones: tasks.filter((t) => t.milestone).length,
          deliverables: n.filter((k) => ['acceptance', 'bom', 'cost_model', 'configuration'].includes(k.entity)).length,
        };
      });
  }, [records, graph, byId]);

  const stageOf = (i: (typeof items)[number]) => i.lc.current ?? 'Commercialization';
  const sel = items.find((i) => i.r.id === open);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Product Development"
        subtitle="Opportunity → requirement → market & technology assessment → concept → architecture → feasibility → suppliers → BOM → costing → prototype → POC → DFM → build → validation → pilot → commercialization. Each item sits at its first stage without evidence."
        actions={<SegmentedControl<View> label="View" value={view} onChange={setView} options={[{ value: 'board', label: 'Stages' }, { value: 'table', label: 'Table' }]} />}
      />
      {!items.length ? (
        <EmptyState icon={Milestone} title="Nothing in development" explain="Active opportunities and projects appear here, placed by the evidence in their thread." />
      ) : view === 'board' ? (
        <div className="scroll-thin flex gap-2 overflow-x-auto pb-2" role="list" aria-label="Lifecycle stages">
          {LIFECYCLE_STAGES.map((st) => {
            const here = items.filter((i) => stageOf(i) === st);
            return (
              <section key={st} role="listitem" aria-label={`${st}: ${here.length}`} className="surface flex w-52 shrink-0 flex-col rounded-card p-2">
                <h2 className="mb-1.5 flex items-center justify-between px-1 text-micro font-semibold uppercase tracking-[0.05em] text-ink-2">
                  {st} <span className="num rounded-full bg-ink/[0.06] px-1.5">{here.length}</span>
                </h2>
                <ul className="space-y-1.5">
                  {here.map((i) => (
                    <li key={i.r.id}>
                      <button type="button" onClick={() => setOpen(i.r.id === open ? null : i.r.id)} className="w-full rounded-control border border-line bg-solid/70 p-2 text-left text-meta hover:border-accent" aria-pressed={i.r.id === open}>
                        <span className="font-medium">{i.r.name}</span>
                        <span className="mt-0.5 block text-micro text-ink-3">
                          {ENTITY_BY_TYPE[i.r.entity]?.label} · {i.lc.doneCount}/17
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="surface scroll-thin overflow-x-auto rounded-card p-2" tabIndex={0}>
          <Table head={['Item', 'Stage', 'Owner', 'Timeline', 'Budget', 'Customer', 'Suppliers', 'Technology (TRL)', 'Open risks', 'Dependencies', 'Milestones', 'Deliverables']} dense>
            {items.map((i) => (
              <tr key={i.r.id} className="border-t border-line/60">
                <td>
                  <button type="button" className="text-left font-medium text-accent-2 hover:underline" onClick={() => setOpen(i.r.id)}>
                    {i.r.name}
                  </button>
                </td>
                <td>
                  <Badge tone="accent">{stageOf(i)}</Badge>
                </td>
                <td>{i.owner ?? '—'}</td>
                <td>{i.timeline ?? 'UNKNOWN'}</td>
                <td className="num">{i.budget ?? 'UNKNOWN'}</td>
                <td>{i.customer ?? '—'}</td>
                <td className="num">{i.suppliers}</td>
                <td>{i.technology || '—'}</td>
                <td className="num">{i.risks}</td>
                <td className="num">{i.dependencies}</td>
                <td className="num">{i.milestones}</td>
                <td className="num">{i.deliverables}</td>
              </tr>
            ))}
          </Table>
        </div>
      )}
      {sel && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <Card title={sel.r.name} description={ENTITY_BY_TYPE[sel.r.entity]?.label}>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge s={(sel.r as { stage?: string }).stage} />
              <Link to={recordPath(sel.r.id)} className="text-meta text-accent-2 hover:underline">
                Open record
              </Link>
              {isRoomEntity(sel.r.entity) && (
                <Link to={roomPath(sel.r.id)} className="text-meta text-accent-2 hover:underline">
                  Open room
                </Link>
              )}
            </div>
          </Card>
          <LifecycleCard id={sel.r.id} />
        </div>
      )}
    </div>
  );
}
