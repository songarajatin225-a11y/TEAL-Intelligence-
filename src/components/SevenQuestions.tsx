import { HelpCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AnyRecord } from '../domain';
import { useData } from '../hooks/useData';
import { neighbours } from '../services/graph';
import { nextActionFor } from '../services/nextAction';
import { fmtDate } from '../utils/dates';
import { recordPath } from './RecordLink';
import { Card } from './ui';

type R = AnyRecord & Record<string, unknown>;
const U = <span className="font-mono text-micro text-ink-3">UNKNOWN</span>;

/**
 * UX PRINCIPLE (final master prompt §31): every opportunity / product / project answers
 * WHAT · WHY · HOW · WHO · HOW MUCH · WHEN · WHAT NEXT — from its own thread, UNKNOWN when it can’t.
 */
export function SevenQuestions({ record }: { record: AnyRecord }) {
  const { graph, byId } = useData();
  const r = record as R;
  const n = [...new Map(neighbours(graph, r.id).map((x) => [x.record.id, x.record as R])).values()];
  const of = (e: string) => n.filter((x) => x.entity === e);
  const link = (x: R) => (
    <Link key={x.id} to={recordPath(x.id)} className="text-accent-2 hover:underline">
      {x.name}
    </Link>
  );
  const list = (xs: R[], max = 3): ReactNode => (xs.length ? <>{xs.slice(0, max).map((x, i) => [i > 0 && ', ', link(x)])}{xs.length > max && ` +${xs.length - max}`}</> : null);
  const reqs = of('requirement');
  const money = (v: unknown, cur?: unknown) => (typeof v === 'number' ? `${String(cur ?? '')} ${v.toLocaleString('en-IN')}`.trim() : null);
  const project = r.entity === 'project' ? r : of('project')[0];
  const na = nextActionFor(r);
  const customer = r.customer_id ? byId.get(String(r.customer_id)) : undefined;

  const rows: [string, string, ReactNode][] = [
    ['WHAT?', 'What is the opportunity?', String(r.inquiry_text ?? r.description ?? r.title ?? '') || r.name],
    ['WHY?', 'Why should TEAL pursue it?', [money(r.value, r.currency) && `Value ${money(r.value, r.currency)}`, money(r.market_size) && `market ${money(r.market_size)}${r.market_size_source ? ` (${String(r.market_size_source)})` : ''}`, r.strategic_relevance && `strategic relevance: ${String(r.strategic_relevance)}`, reqs.length && `${reqs.length} customer requirement(s)`].filter(Boolean).join(' · ') || U],
    ['HOW?', 'How can TEAL build it?', list([...of('configuration'), ...of('product'), ...of('application')]) ?? U],
    ['WHO?', 'Who can supply or partner?', list([...(customer ? [customer as R] : []), ...of('supplier'), ...of('company')]) ?? U],
    ['HOW MUCH?', 'What will it cost?', list(of('cost_model')) ?? (money(r.budget, r.currency) ? `Budget ${money(r.budget, r.currency)}` : U)],
    ['WHEN?', 'When can it be delivered?', project?.end ? `${project.name}: ${fmtDate(String(project.start ?? ''))} → ${fmtDate(String(project.end))}` : r.next_action?.due ? `Next step due ${fmtDate(r.next_action.due)}` : U],
    ['WHAT NEXT?', 'What action should happen now?', na.action ? `${na.action}${na.source === 'SUGGESTED' ? ' (suggested)' : ''}` : U],
  ];
  return (
    <Card title="Seven questions" icon={HelpCircle} description="What · Why · How · Who · How much · When · What next">
      <dl className="space-y-2">
        {rows.map(([q, sub, a]) => (
          <div key={q} className="grid grid-cols-[6.5rem_1fr] gap-3 text-meta">
            <dt>
              <span className="font-semibold text-accent-2">{q}</span>
              <span className="block text-micro text-ink-3">{sub}</span>
            </dt>
            <dd className="min-w-0 break-words text-ink-2">{a}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
