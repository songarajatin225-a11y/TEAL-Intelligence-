import { AlertTriangle, ClipboardCheck, GitPullRequest, Handshake, ListChecks, Milestone, ShieldAlert, Truck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { Badge, Card, Loading, PageHeader } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { useData } from '../../hooks/useData';
import { todayIso } from '../../utils/dates';

interface Item {
  id: string;
  title: string;
  detail: string;
  to?: string;
}

/** ACTION CENTER (industrial intelligence master prompt §161) — derived from records only. */
export default function ActionCenterPage() {
  const { records, status } = useData();
  const today = todayIso();
  const groups = useMemo(() => {
    const by = (e: string) => records.filter((r) => r.entity === e) as (AnyRecord & Record<string, unknown>)[];
    const it = (r: AnyRecord, detail: string, to?: string): Item => ({ id: r.id, title: r.name, detail, to: to ?? recordPath(r.id) });
    const closedReq = new Set(['Closed', 'Verified', 'Done', 'Cancelled']);
    const out: { key: string; title: string; icon: LucideIcon; items: Item[]; empty: string }[] = [
      { key: 'req', title: 'Assigned requirements', icon: ClipboardCheck, items: by('requirement').filter((r) => r.owner && !closedReq.has(String(r.status ?? ''))).map((r) => it(r, `Owner ${r.owner} · ${r.code}`)), empty: 'No open requirement has an owner yet — assign owners on the requirement records.' },
      {
        key: 'approve',
        title: 'Pending approvals',
        icon: ListChecks,
        items: [
          ...by('part').filter((p) => ['Draft', 'Imported', 'Extracted'].includes(String(p.record_status))).map((p) => it(p, `Engineering data · ${p.record_status}`, '/data-review')),
          ...by('simulation').filter((s) => s.sim_status === 'In Review').map((s) => it(s, 'Simulation scenario in review', `/studio/${encodeURIComponent(s.id)}`)),
          ...by('change_request').filter((c) => c.cr_status === 'Submitted').map((c) => it(c, `${c.change_type} submitted`)),
          ...by('recipe').filter((c) => c.recipe_status === 'Trial').map((c) => it(c, 'Recipe on trial')),
        ],
        empty: 'Nothing is waiting for approval.',
      },
      { key: 'ecr', title: 'Engineering changes', icon: GitPullRequest, items: by('change_request').filter((c) => !['Implemented', 'Verified', 'Rejected'].includes(String(c.cr_status))).map((c) => it(c, `${c.change_type} · ${c.cr_status}`)), empty: 'No open ECR / ECO.' },
      {
        key: 'fail',
        title: 'Failed tests',
        icon: AlertTriangle,
        items: [
          ...by('verification').filter((v) => v.result === 'FAIL').map((v) => it(v, `${v.kind} failed`)),
          ...by('acceptance').flatMap((a) => ((a.tests as { test_id: string; test: string; result: string }[] | undefined) ?? []).filter((t) => t.result === 'FAIL').map((t) => ({ id: `${a.id}:${t.test_id}`, title: `${a.name} — ${t.test}`, detail: `${a.phase} test failed`, to: recordPath(a.id) }))),
          ...by('quality_record').filter((q) => q.kind === 'NCR' && q.qr_status !== 'Closed').map((q) => it(q, `NCR · ${q.qr_status}`)),
        ],
        empty: 'No failed verification, FAT/SAT test or open NCR.',
      },
      { key: 'sup', title: 'Supplier actions', icon: Truck, items: [...by('rfq').filter((r) => !['Awarded', 'Cancelled'].includes(String(r.rfq_status))).map((r) => it(r, `RFQ ${r.rfq_status}`)), ...by('supplier').filter((s) => (s.next_action as { action?: string } | undefined)?.action).map((s) => it(s, String((s.next_action as { action: string }).action)))], empty: 'No open RFQ or supplier action.' },
      { key: 'cus', title: 'Customer actions', icon: Users, items: [...by('customer'), ...by('opportunity')].filter((r) => (r.next_action as { action?: string } | undefined)?.action).map((r) => it(r, `${(r.next_action as { action: string; due?: string }).action}${(r.next_action as { due?: string }).due ? ` · due ${(r.next_action as { due?: string }).due}` : ''}`)), empty: 'No customer or opportunity next action.' },
      {
        key: 'late',
        title: 'Overdue milestones',
        icon: Milestone,
        items: [
          ...by('project').flatMap((p) => ((p.tasks as { id?: string; name: string; end?: string; status?: string; milestone?: boolean }[] | undefined) ?? []).filter((t) => t.end && t.end < today && t.status !== 'Completed').map((t, i) => ({ id: `${p.id}:${t.id ?? i}`, title: `${p.name} — ${t.name}`, detail: `was due ${t.end}`, to: recordPath(p.id) }))),
          ...by('activity').filter((a) => a.due_date && String(a.due_date) < today && !['Completed', 'Cancelled'].includes(String(a.status))).map((a) => it(a, `was due ${a.due_date}`)),
        ],
        empty: 'Nothing is overdue.',
      },
      { key: 'risk', title: 'High risks', icon: ShieldAlert, items: by('risk').filter((r) => r.risk_status !== 'Closed' && Number(r.severity ?? 0) >= 8).map((r) => it(r, `Severity ${r.severity}`)), empty: 'No open risk with severity ≥ 8.' },
    ];
    return out;
  }, [records, today]);
  if (status === 'loading') return <Loading />;
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Home" title="Action Center" subtitle="What needs a person: requirements, approvals, engineering changes, failed tests, supplier and customer actions, overdue milestones, high risks — every item from a record." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.key} title={g.title} icon={g.icon} actions={<Badge tone={g.items.length ? 'warn' : 'ok'}>{g.items.length}</Badge>}>
            {g.items.length ? (
              <ul className="space-y-1 text-meta">
                {g.items.slice(0, 12).map((x) => (
                  <li key={x.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    {x.to ? (
                      <Link to={x.to} className="min-w-0 truncate text-accent-2 hover:underline">
                        {x.title}
                      </Link>
                    ) : (
                      <span>{x.title}</span>
                    )}
                    <span className="text-micro text-ink-3">{x.detail}</span>
                  </li>
                ))}
                {g.items.length > 12 && <li className="text-micro text-ink-3">+{g.items.length - 12} more</li>}
              </ul>
            ) : (
              <p className="flex items-center gap-1.5 text-meta text-ink-3">
                <Handshake className="size-4" aria-hidden /> {g.empty}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
