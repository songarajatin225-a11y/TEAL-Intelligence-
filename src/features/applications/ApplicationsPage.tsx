import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, PageHeader, Tabs } from '../../components/ui';
import { INDUSTRIES, PROCESSES, type Application } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { EntityListPage } from '../entities/EntityListPage';

/** APPLICATION LIBRARY (spec §32): industry × process matrix + list. */
export default function ApplicationsPage() {
  const apps = useRecords<Application>('application');
  const [tab, setTab] = useState<'matrix' | 'list'>('matrix');
  const industries = useMemo(() => INDUSTRIES.filter((i) => apps.some((a) => a.industries.includes(i))).concat(INDUSTRIES.filter((i) => !apps.some((a) => a.industries.includes(i)))), [apps]);
  const cell = (ind: string, proc: string) => apps.filter((a) => a.industries.includes(ind) && a.process === proc);
  return (
    <div>
      <Tabs label="View" value={tab} onChange={setTab} tabs={[{ key: 'matrix', label: 'Industry × process' }, { key: 'list', label: 'All applications', count: apps.length }]} />
      {tab === 'list' ? (
        <EntityListPage entity="application" title="Application library" />
      ) : (
        <div>
          <PageHeader eyebrow="Applications" title="Application library" subtitle="Where each TEAL application sits by industry and process. Empty cells are gaps in the portfolio — not evidence that no market exists." />
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11.5px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-panel px-1 text-left">Industry</th>
                    {PROCESSES.map((p) => (
                      <th key={p} className="px-1 text-left font-semibold text-ink-3">
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {industries.map((i) => (
                    <tr key={i} className="border-t border-line/60 align-top">
                      <td className="sticky left-0 bg-panel px-1 font-medium">{i}</td>
                      {PROCESSES.map((p) => {
                        const l = cell(i, p);
                        return (
                          <td key={p} className={`px-1 py-1 ${l.length ? 'bg-accent-soft/40' : ''}`}>
                            {l.slice(0, 4).map((a) => (
                              <Link key={a.id} to={`/record/${encodeURIComponent(a.id)}`} className="block text-accent-2 hover:underline" title={a.rationale}>
                                {a.name}
                              </Link>
                            ))}
                            {l.length > 4 && <span className="text-ink-3">+{l.length - 4}</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
