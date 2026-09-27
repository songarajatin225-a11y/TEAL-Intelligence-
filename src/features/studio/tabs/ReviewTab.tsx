import { CheckCircle2, ClipboardCheck, Gauge, Hammer, ListChecks, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../../components/RecordLink';
import { Badge, Card, Field, Notice, Table } from '../../../components/ui';
import { READINESS_DIMENSIONS, READINESS_STATUSES } from '../../../domain/engineering';
import { buildReadiness, DFM_QUESTIONS, dfmFlags, engineeringCompleteness, pocReadiness, REVIEW_SECTIONS, type GateCheck } from '../../../services/sim/review';
import type { TabProps } from '../ScenarioPage';
import { SmallSelect } from './edit';

function Checklist({ items }: { items: GateCheck[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((c) => (
        <li key={c.item} className="flex items-start gap-2 text-meta">
          {c.ok ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-label="OK" /> : <XCircle className="mt-0.5 size-4 shrink-0 text-bad" aria-label="Gap" />}
          <span>
            <strong>{c.item}</strong> — {c.detail}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ReviewTab({ eng, sim, set, d }: TabProps) {
  const inp = { res: d.res, records: eng.records, byId: eng.byId, defs: eng.defs, ctx: eng.ctx, bom: d.bom, deps: d.deps };
  const comp = engineeringCompleteness(inp, d.issues);
  const build = buildReadiness(inp);
  const poc = pocReadiness(inp);
  const dfm = dfmFlags(inp);
  const TONE = { Complete: 'ok', Incomplete: 'warn', Missing: 'bad', Unverified: 'info' } as const;
  return (
    <div className="space-y-4">
      <Card title="Engineering completeness" icon={Gauge} description="Per dimension — never collapsed into one score (§101)">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-9">
          {comp.map((c) => (
            <div key={c.dimension} className="rounded-control border border-line p-2.5">
              <div className="text-micro text-ink-3">{c.dimension}</div>
              <Badge tone={TONE[c.status]}>{c.status}</Badge>
              <div className="mt-1 text-micro text-ink-3">{c.detail}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Engineering design review" icon={ClipboardCheck} description={`${d.issues.length} findings by automated checks. Each links to its record where there is one. A human review is still required.`}>
        {REVIEW_SECTIONS.map((s) => {
          const xs = d.issues.filter((i) => i.section === s);
          return (
            <section key={s} className="border-t border-line py-2 first:border-0">
              <h3 className="mb-1 flex items-center gap-2 text-body font-semibold">
                {s} {xs.length ? <Badge tone={xs.some((x) => x.severity === 'blocker') ? 'bad' : xs.some((x) => x.severity === 'major') ? 'warn' : 'neutral'}>{xs.length}</Badge> : <Badge tone="ok">no finding</Badge>}
              </h3>
              {xs.length > 0 && (
                <ul className="space-y-1">
                  {xs.map((x, i) => (
                    <li key={i} className="flex flex-wrap items-start gap-2 text-meta">
                      <Badge tone={x.severity === 'blocker' ? 'bad' : x.severity === 'major' ? 'warn' : 'neutral'}>{x.severity}</Badge>
                      <span className="min-w-0 flex-1">
                        {x.message}
                        {x.potential && <em className="text-ink-3"> — potential engineering issue, review required</em>}
                      </span>
                      {x.recordId && (
                        <Link to={recordPath(x.recordId)} className="text-micro text-accent-2 hover:underline">
                          Open record
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Build readiness gaps" icon={Hammer} description="Before a prototype (§104)">
          <Checklist items={build} />
        </Card>
        <Card title="POC readiness" icon={ListChecks} description="Before a customer POC (§105)">
          <Checklist items={poc} />
        </Card>
      </div>
      <Card title="DFM / DFA" description="Flags come from recorded data; the questions cannot be answered from data and need a review">
        {dfm.length ? (
          <ul className="mb-3 list-disc space-y-1 pl-5 text-meta">
            {dfm.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-meta text-ink-3">No data-based DFM flag.</p>
        )}
        <ol className="list-decimal space-y-1 pl-5 text-meta text-ink-2">
          {DFM_QUESTIONS.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </Card>
      <Card title="Equipment readiness" description="Entered by the team per dimension (§147). TRL (technology), product readiness and commercial readiness are different things (§148).">
        <div className="mb-3 max-w-xs">
          <Field label="Technology Readiness Level (TRL 1–9)">
            <SmallSelect label="TRL" value={sim.trl != null ? String(sim.trl) : ''} options={[{ value: '', label: 'Not assessed' }, ...Array.from({ length: 9 }, (_, i) => ({ value: String(i + 1), label: `TRL ${i + 1}` }))]} onChange={(v) => set((s) => ({ ...s, trl: v ? Number(v) : null }))} className="w-full" />
          </Field>
        </div>
        <Table head={['Dimension', 'Status']} dense>
          {READINESS_DIMENSIONS.map((dim) => (
            <tr key={dim}>
              <td>{dim}</td>
              <td>
                <SmallSelect label={`${dim} readiness`} value={sim.readiness?.[dim] ?? ''} options={[{ value: '' as never, label: 'Not assessed' }, ...READINESS_STATUSES.map((x) => ({ value: x, label: x }))]} onChange={(v) => set((s) => ({ ...s, readiness: Object.fromEntries(Object.entries({ ...(s.readiness ?? {}), [dim]: v }).filter(([, x]) => x)) as typeof s.readiness }))} />
              </td>
            </tr>
          ))}
        </Table>
        <Notice tone="info">Readiness is a team judgement recorded here with the scenario; the automated checks above are evidence for it, not a substitute.</Notice>
      </Card>
    </div>
  );
}
