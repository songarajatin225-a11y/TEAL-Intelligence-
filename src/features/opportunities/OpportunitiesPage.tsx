import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTypeBadge } from '../../components/badges';
import { RecordLink } from '../../components/RecordLink';
import { NextActionLine } from '../../components/ThreadPanels';
import { Button, Tabs } from '../../components/ui';
import { OPPORTUNITY_STAGES, type Opportunity } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { EntityListPage } from '../entities/EntityListPage';

/** Opportunity management (spec §69): pipeline board + list. */
export default function OpportunitiesPage() {
  const [view, setView] = useState<'board' | 'list'>('board');
  const opps = useRecords<Opportunity>('opportunity');
  return (
    <div>
      <Tabs label="View" value={view} onChange={setView} tabs={[{ key: 'board', label: 'Pipeline' }, { key: 'list', label: 'List' }]} />
      {view === 'list' ? (
        <EntityListPage
          entity="opportunity"
          extraActions={
            <Link to="/inquiry">
              <Button>Inquiry → Product</Button>
            </Link>
          }
        />
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h1 className="text-xl font-semibold">Opportunity pipeline</h1>
            <div className="flex gap-2">
              <Link to="/inquiry">
                <Button variant="primary">Create product from inquiry</Button>
              </Link>
              <Link to="/opportunities?new=1" onClick={() => setView('list')}>
                <Button>New opportunity</Button>
              </Link>
            </div>
          </div>
          <p className="mb-2 text-ink-3">Value and probability are shown only when recorded — they are never estimated by the OS.</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {OPPORTUNITY_STAGES.map((s) => {
              const list = opps.filter((o) => o.stage === s);
              return (
                <section key={s} aria-label={`${s} stage`} className="w-64 shrink-0 rounded-lg border border-line bg-panel-2">
                  <header className="flex justify-between border-b border-line px-2 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-2">
                    {s} <span className="num">{list.length}</span>
                  </header>
                  <ul className="space-y-1.5 p-1.5">
                    {list.map((o) => (
                      <li key={o.id} className="rounded-md border border-line bg-panel p-2">
                        <RecordLink id={o.id} />
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11.5px] text-ink-3">
                          <DataTypeBadge t={o.data_type} />
                          {o.customer_id && <RecordLink id={o.customer_id} />}
                        </div>
                        <div className="mt-1 text-[12px]">
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
