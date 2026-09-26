import clsx from 'clsx';
import { Network } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { Card, Notice, PageHeader } from '../../components/ui';
import { useData } from '../../hooks/useData';
import { crossDomainMatrix } from '../../services/crossDomain';
import { domainPath } from './DomainPage';

/** CROSS-DOMAIN INTELLIGENCE (final master prompt §27): which technologies serve which domains, and why we know. */
export default function CrossDomainPage() {
  const { records } = useData();
  const { domains, rows } = useMemo(() => crossDomainMatrix(records), [records]);
  const [pick, setPick] = useState<{ t: string; d: string } | null>(null);
  const sel = pick ? rows.find((r) => r.technology.id === pick.t) : undefined;
  const cell = sel && pick ? sel.cells.get(pick.d) : undefined;
  return (
    <div className="space-y-5">
      <PageHeader title="Cross-Domain Map" subtitle="One technology, many industries. Each cell shows the evidence: TEAL application records (real TEAL data) and the domain’s own taxonomy." />
      <Notice tone="info">A filled cell means TEAL has application records for that technology in the domain’s industries (number), or the domain’s taxonomy names it (●). An empty cell means no record says so — not that it is impossible.</Notice>
      <Card title="Technology × domain" icon={Network} description={`${rows.length} technologies across ${domains.length} domains`}>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[40rem] border-separate border-spacing-1 text-meta">
            <thead>
              <tr>
                <th scope="col" className="text-left font-medium text-ink-3">
                  Technology
                </th>
                {domains.map((d) => (
                  <th key={d.id} scope="col" className="text-left font-medium">
                    <Link to={domainPath(d)} className="hover:text-accent-2 hover:underline">
                      {d.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.technology.id}>
                  <th scope="row" className="whitespace-nowrap text-left font-medium">
                    <Link to={recordPath(r.technology.id)} className="hover:text-accent-2 hover:underline">
                      {r.technology.name}
                    </Link>
                  </th>
                  {domains.map((d) => {
                    const c = r.cells.get(d.id);
                    const on = pick?.t === r.technology.id && pick?.d === d.id;
                    return (
                      <td key={d.id} className="p-0">
                        {c ? (
                          <button
                            type="button"
                            aria-pressed={on}
                            aria-label={`${r.technology.name} in ${d.name}: ${c.applications.length} application records${c.taxonomy.length ? ', named in taxonomy' : ''}`}
                            onClick={() => setPick(on ? null : { t: r.technology.id, d: d.id })}
                            className={clsx('flex h-8 w-full min-w-16 items-center justify-center gap-1 rounded-md border text-micro', on ? 'border-accent ring-2 ring-accent/40' : 'border-line', c.applications.length ? 'bg-accent-soft/60 text-accent-2' : 'bg-ink/[0.04]')}
                          >
                            {c.applications.length > 0 && <span className="num font-semibold">{c.applications.length}</span>}
                            {c.taxonomy.length > 0 && <span aria-hidden>●</span>}
                          </button>
                        ) : (
                          <span className="block h-8 rounded-md border border-dashed border-line/70" aria-hidden />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {sel && cell && pick && (
        <Card title={`${sel.technology.name} × ${domains.find((d) => d.id === pick.d)?.name}`} edge>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <div className="mb-1 text-meta font-semibold">TEAL application records ({cell.applications.length})</div>
              <ul className="space-y-0.5 text-meta">
                {cell.applications.slice(0, 20).map((a) => (
                  <li key={a.id}>
                    <Link to={recordPath(a.id)} className="text-accent-2 hover:underline">
                      {a.name}
                    </Link>{' '}
                    <span className="text-ink-3">· {a.process}</span>
                  </li>
                ))}
                {!cell.applications.length && <li className="text-ink-3">None.</li>}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-meta font-semibold">Domain taxonomy mentions</div>
              <ul className="list-disc pl-5 text-meta text-ink-2">
                {cell.taxonomy.map((x) => (
                  <li key={x}>{x}</li>
                ))}
                {!cell.taxonomy.length && <li className="list-none text-ink-3">None.</li>}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
