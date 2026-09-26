import { Link } from 'react-router-dom';
import { RecordLink } from '../../components/RecordLink';
import { Button, Card } from '../../components/ui';
import { OPPORTUNITY_STAGES, type Opportunity } from '../../domain/entities';
import { useData, type Rec } from '../../hooks/useData';
import { repo } from '../../repositories';

/** Opportunity: stage stepper and the thread from inquiry to project. */
export default function OpportunityView({ record }: { record: Rec }) {
  const o = record as unknown as Opportunity & Rec;
  const { records } = useData();
  const idx = OPPORTUNITY_STAGES.indexOf(o.stage);
  const linked = (e: string) => records.filter((r) => r.entity === e && (r as { opportunity_id?: string }).opportunity_id === o.id);
  const setStage = (stage: string) => void repo().workspace.save({ ...o, stage, __origin: undefined, __dataset: undefined }, `Stage → ${stage}`);
  return (
    <Card title="Opportunity">
      <ol className="mb-3 flex flex-wrap gap-1" aria-label="Stage">
        {OPPORTUNITY_STAGES.map((s, i) => (
          <li key={s}>
            <button type="button" onClick={() => setStage(s)} aria-current={s === o.stage ? 'step' : undefined} className={`rounded px-2 py-1 text-meta font-semibold ${s === o.stage ? 'bg-accent text-white' : i < idx ? 'bg-accent-soft text-accent-2' : 'bg-panel-2 text-ink-3'} ${s === 'Lost' ? 'ml-2' : ''}`}>
              {s}
            </button>
          </li>
        ))}
      </ol>
      {o.inquiry_text && <blockquote className="mb-3 border-l-2 border-accent pl-3 text-ink-2">“{o.inquiry_text}”</blockquote>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {(
          [
            ['Requirements', 'requirement', '/requirements?new=1'],
            ['POCs', 'poc', '/poc?new=1'],
            ['Configurations', 'configuration', '/configurator'],
            ['Cost models', 'cost_model', '/cost?new=1'],
            ['Risks', 'risk', '/quality?new=1'],
            ['Projects', 'project', '/projects?new=1'],
          ] as const
        ).map(([label, e, to]) => {
          const l = linked(e);
          return (
            <div key={e} className="rounded border border-line p-2">
              <div className="mb-1 flex items-center justify-between text-micro font-semibold uppercase text-ink-3">
                {label} <span className="num">{l.length}</span>
              </div>
              <ul className="space-y-0.5">
                {l.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <RecordLink id={r.id} />
                  </li>
                ))}
              </ul>
              {!l.length && (
                <Link to={to} className="text-meta text-accent-2 hover:underline">
                  + add
                </Link>
              )}
            </div>
          );
        })}
      </div>
      {o.inquiry_text && !linked('requirement').length && (
        <div className="mt-3">
          <Link to={`/inquiry?text=${encodeURIComponent(o.inquiry_text)}${o.customer_id ? `&customer=${o.customer_id}` : ''}`}>
            <Button variant="primary">Create product package from this inquiry</Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
