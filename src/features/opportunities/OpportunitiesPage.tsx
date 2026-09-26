import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTypeBadge } from '../../components/badges';
import { RecordLink } from '../../components/RecordLink';
import { NextActionLine } from '../../components/ThreadPanels';
import { buttonClass, PageHeader, SegmentedControl } from '../../components/ui';
import { OPPORTUNITY_STAGES, type Opportunity } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { EntityListPage } from '../entities/EntityListPage';

/** Opportunity management (spec §69): pipeline board + list. */
export default function OpportunitiesPage() {
  const [view, setView] = useState<'board' | 'list'>('board');
  const opps = useRecords<Opportunity>('opportunity');
  return (
    <div>
      <PageHeader
        title="Opportunities"
        subtitle="The customer pipeline from lead to won. Value and probability are shown only when recorded — never estimated."
        actions={
          <>
            <SegmentedControl label="View" value={view} onChange={setView} options={[{ value: 'board', label: 'Pipeline' }, { value: 'list', label: 'List' }]} />
            <Link to="/inquiry" className={buttonClass('secondary')}>
              Product from inquiry
            </Link>
            <Link to="/opportunities?new=1" onClick={() => setView('list')} className={buttonClass('primary')}>
              New opportunity
            </Link>
          </>
        }
      />
      {view === 'list' ? (
        <EntityListPage embedded entity="opportunity" title="All opportunities" />
      ) : (
        <div>
                    <div className="scroll-thin flex gap-3 overflow-x-auto pb-3">
            {OPPORTUNITY_STAGES.map((s) => {
              const list = opps.filter((o) => o.stage === s);
              return (
                <section key={s} aria-label={`${s} stage`} className="surface w-72 shrink-0 rounded-card">
                  <header className="flex justify-between border-b border-line px-3.5 py-2.5 text-meta font-semibold text-ink-2">
                    {s} <span className="num">{list.length}</span>
                  </header>
                  <ul className="space-y-1.5 p-1.5">
                    {list.map((o) => (
                      <li key={o.id} className="rounded-md border border-line bg-panel p-2">
                        <RecordLink id={o.id} />
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-meta text-ink-3">
                          <DataTypeBadge t={o.data_type} />
                          {o.customer_id && <RecordLink id={o.customer_id} />}
                        </div>
                        <div className="mt-1 text-meta">
                          <NextActionLine record={o} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
