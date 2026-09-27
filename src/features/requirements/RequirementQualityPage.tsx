import clsx from 'clsx';
import { ClipboardCheck, GitBranch, Route } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { Badge, Card, EmptyState, Loading, PageHeader, Table, Tabs } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import type { Requirement } from '../../domain/entities';
import { useData } from '../../hooks/useData';
import { requirementIssues, traceChain, traceCoverage, TRACE_STEPS } from '../../services/eng/requirementQuality';

type Tab = 'quality' | 'coverage' | 'baselines';

/** REQUIREMENTS ENGINEERING (industrial intelligence master prompt §85–§87): quality, trace coverage, baselines. */
export default function RequirementQualityPage() {
  const { records, status } = useData();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) ?? 'quality';
  const reqs = useMemo(() => records.filter((r) => r.entity === 'requirement') as unknown as (Requirement & AnyRecord)[], [records]);
  const rows = useMemo(() => reqs.map((r) => ({ r, issues: requirementIssues(r, reqs), chain: traceChain(r, records) })), [reqs, records]);
  const cov = traceCoverage(rows.map((x) => x.chain));
  if (status === 'loading') return <Loading />;
  const baselines = [...new Set(reqs.map((r) => r.baseline ?? 'No baseline'))];
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Requirements" title="Requirement Quality & Traceability" subtitle="Vague or ambiguous wording, missing units, acceptance criteria, owners, sources, verification and validation — and how far each requirement is traced from customer to acceptance." />
      <Tabs<Tab>
        label="Requirements engineering"
        value={tab}
        onChange={(k) => setParams((p) => (p.set('tab', k), p), { replace: true })}
        tabs={[
          { key: 'quality', label: 'Quality', count: rows.filter((x) => x.issues.some((i) => i.severity === 'error')).length },
          { key: 'coverage', label: 'Traceability coverage' },
          { key: 'baselines', label: 'Baselines', count: baselines.length },
        ]}
      />
      {!reqs.length && <EmptyState title="No requirements" explain="Capture requirements under Requirements or Requirement Capture." />}
      {tab === 'quality' && reqs.length > 0 && (
        <Card title="Requirement quality" icon={ClipboardCheck} description="Each finding names the rule it breaks (§86)">
          <Table head={['Requirement', 'Level / type', 'Findings']} dense>
            {rows.map(({ r, issues }) => (
              <tr key={r.id}>
                <td>
                  <Link to={recordPath(r.id)} className="font-medium text-accent-2 hover:underline">
                    {r.code} — {r.name}
                  </Link>
                </td>
                <td className="text-micro">
                  {r.level}
                  {r.req_type ? ` · ${r.req_type}` : ''}
                </td>
                <td>
                  {issues.length ? (
                    <ul className="space-y-0.5 text-micro">
                      {issues.map((i, k) => (
                        <li key={k} className={i.severity === 'error' ? 'text-bad' : 'text-warn'}>
                          <Badge tone={i.severity === 'error' ? 'bad' : 'warn'}>{i.rule}</Badge> {i.message}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <Badge tone="ok">No finding</Badge>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {tab === 'coverage' && reqs.length > 0 && (
        <>
          <Card title="Coverage by link" icon={Route} description="Customer requirement → product/system → subsystem/component → design → BOM → test → verification → validation → acceptance (§87)">
            <ul className="space-y-1.5">
              {cov.map((c) => (
                <li key={c.step} className="grid grid-cols-[minmax(9rem,14rem)_1fr_4rem] items-center gap-3 text-meta">
                  <span>{c.step}</span>
                  <div className="h-2.5 rounded-full bg-ink/10">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${c.total ? (c.covered / c.total) * 100 : 0}%` }} />
                  </div>
                  <span className="num text-right">
                    {c.covered}/{c.total}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Per requirement">
            <Table head={['Requirement', ...TRACE_STEPS.map((s) => s.split(' ')[0]), 'Coverage']} dense>
              {rows.map(({ r, chain }) => (
                <tr key={r.id}>
                  <td>
                    <Link to={recordPath(r.id)} className="text-accent-2 hover:underline">
                      {r.code}
                    </Link>
                  </td>
                  {chain.steps.map((s) => (
                    <td key={s.step} title={`${s.step}: ${s.evidence.join(', ') || 'no evidence'}`} className={clsx('text-center', s.ok ? 'text-ok' : 'text-ink-3')}>
                      {s.ok ? '✓' : '○'}
                    </td>
                  ))}
                  <td className="num">{chain.coverage} %</td>
                </tr>
              ))}
            </Table>
          </Card>
        </>
      )}
      {tab === 'baselines' && reqs.length > 0 && (
        <Card title="Baselines" icon={GitBranch} description="Requirements grouped by the baseline they belong to. Change a baselined requirement through an ECR (Change Management).">
          {baselines.map((b) => (
            <section key={b} className="border-t border-line py-2 first:border-0">
              <h3 className="mb-1 font-semibold">
                {b} <Badge>{reqs.filter((r) => (r.baseline ?? 'No baseline') === b).length}</Badge>
              </h3>
              <ul className="grid grid-cols-1 gap-1 text-meta md:grid-cols-2">
                {reqs
                  .filter((r) => (r.baseline ?? 'No baseline') === b)
                  .map((r) => (
                    <li key={r.id}>
                      <Link to={recordPath(r.id)} className="text-accent-2 hover:underline">
                        {r.code}
                      </Link>{' '}
                      {r.name} <span className="text-micro text-ink-3">v{r.version ?? 1}</span>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
          <Link to="/changes" className="mt-2 inline-block text-meta text-accent-2 hover:underline">
            Change management (ECR / ECO) →
          </Link>
        </Card>
      )}
    </div>
  );
}
