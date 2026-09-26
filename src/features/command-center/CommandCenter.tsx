import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTypeBadge, StatusBadge } from '../../components/badges';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Card, PageHeader, Stat } from '../../components/ui';
import type { Activity, CostModel, Opportunity, Product, Project, Risk } from '../../domain/entities';
import { OPPORTUNITY_STAGES } from '../../domain/entities';
import { summarizeCostModel, useFx } from '../../hooks/useCost';
import { useData } from '../../hooks/useData';
import { workspaceDb, type ChangeLogRow } from '../../repositories/workspaceDb';
import { isActive, nextActions } from '../../services/nextAction';
import { fmtDate, relativeDay, todayIso } from '../../utils/dates';
import { fetchJson } from '../../utils/paths';

const inr = (v: number) => `₹ ${(v / 1e5).toLocaleString('en-IN', { maximumFractionDigits: 1 })} L`;

function Q({ n, q, children, to }: { n: number; q: string; children: React.ReactNode; to?: string }) {
  return (
    <Card
      title={
        <span>
          <span className="mr-1 text-accent">{String(n).padStart(2, '0')}</span> {q}
        </span>
      }
      actions={
        to && (
          <Link to={to} className="text-[11.5px] text-accent-2 hover:underline">
            Open →
          </Link>
        )
      }
    >
      {children}
    </Card>
  );
}

/** COMMAND CENTER (spec §156): ten questions, answered from the live digital thread. */
export default function CommandCenter() {
  const { records, catalog, drafts } = useData();
  const fx = useFx();
  const today = todayIso();
  const [changes, setChanges] = useState<ChangeLogRow[]>([]);
  const [sections, setSections] = useState<number | null>(null);
  useEffect(() => {
    fetchJson<{ partitions: Record<string, number> }>('search-index/manifest.json')
      .then((m) => setSections(m.partitions.knowledge ?? null))
      .catch(() => setSections(null));
  }, []);
  useEffect(() => {
    workspaceDb().changelog.orderBy('seq').reverse().limit(8).toArray().then(setChanges).catch(() => setChanges([]));
  }, [records]);

  const d = useMemo(() => {
    const of = <T,>(e: string) => records.filter((r) => r.entity === e) as unknown as (T & (typeof records)[number])[];
    const opps = of<Opportunity>('opportunity');
    const acts = of<Activity>('activity');
    const projects = of<Project>('project');
    const risks = of<Risk>('risk');
    const products = of<Product>('product');
    const cms = of<CostModel>('cost_model');
    const na = nextActions(records, today);
    const overdueActs = acts.filter((a) => isActive(a) && a.due_date && a.due_date < today && a.status !== 'Completed');
    const blocked = acts.filter((a) => a.status === 'Blocked' || !!a.blocker).filter((a) => isActive(a));
    const openRisks = risks.filter((r) => r.risk_status === 'Open');
    const stages = OPPORTUNITY_STAGES.map((s) => ({ s, n: opps.filter((o) => o.stage === s).length }));
    const stdUse = new Map<string, number>();
    for (const p of products) for (const k of p.standard_content) stdUse.set(k, (stdUse.get(k) ?? 0) + 1);
    const costs = cms.map((m) => ({ m, s: summarizeCostModel(m, fx) }));
    return { opps, acts, projects, risks, products, na, overdueActs, blocked, openRisks, stages, stdUse: [...stdUse.entries()].sort((a, b) => b[1] - a[1]), costs, techs: records.filter((r) => r.entity === 'technology'), pocs: records.filter((r) => r.entity === 'poc' && isActive(r)) };
  }, [records, today, fx]);

  const recentDatasets = [...(catalog?.datasets ?? [])].sort((a, b) => b.last_updated.localeCompare(a.last_updated)).slice(0, 5);
  const assessed = d.techs.filter((t) => (t as { radar_status?: string | null }).radar_status).length;

  return (
    <div>
      <PageHeader eyebrow="TEAL Engineering Intelligence OS" title="Command Center" subtitle="One connected engineering system: global intelligence → customer → application → process → product → machine → cost → supplier → project → FAT/SAT → field → lessons → next product." />
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        <Stat label="Active opportunities" value={d.opps.filter(isActive).length} to="/opportunities" />
        <Stat label="Active projects" value={d.projects.filter(isActive).length} to="/projects" />
        <Stat label="Active POCs" value={d.pocs.length} to="/poc" />
        <Stat label="Overdue actions" value={d.na.filter((x) => x.overdue).length + d.overdueActs.length} tone={d.na.some((x) => x.overdue) || d.overdueActs.length ? 'bad' : undefined} to="/pm" />
        <Stat label="Open risks" value={d.openRisks.length} tone={d.openRisks.length ? 'warn' : undefined} to="/quality" />
        <Stat label="TEAL platforms" value={d.products.length} to="/products" />
        <Stat label="Knowledge entries" value={sections ?? '—'} sub="handbook sections + knowledge records" to="/knowledge" />
        <Stat label="Local drafts" value={drafts} sub="this browser" to="/admin" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        <Q n={1} q="What is happening?" to="/changed">
          <ul className="space-y-1">
            {changes.map((c) => (
              <li key={c.seq} className="flex gap-2">
                <Badge>{c.action}</Badge>
                <span className="min-w-0 truncate">{c.summary}</span>
                <span className="ml-auto shrink-0 text-[11px] text-ink-3">{fmtDate(c.at)}</span>
              </li>
            ))}
            {!changes.length && <li className="text-ink-3">No local activity yet in this browser. Master data: {catalog?.datasets.length} datasets, {records.length} records.</li>}
          </ul>
        </Q>
        <Q n={2} q="What needs attention?" to="/pm">
          <ul className="space-y-1">
            {d.na
              .filter((x) => x.overdue || (x.dueInDays != null && x.dueInDays <= 2))
              .slice(0, 7)
              .map((x) => (
                <li key={x.record.id} className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={x.overdue ? 'bad' : 'warn'}>{relativeDay(x.due)}</Badge>
                  <RecordLink id={x.record.id} />
                  <span className="w-full pl-1 text-[12px] text-ink-2">→ {x.action}</span>
                </li>
              ))}
            {d.openRisks.slice(0, 3).map((r) => (
              <li key={r.id} className="flex items-center gap-1.5">
                <Badge tone="warn">risk</Badge>
                <RecordLink id={r.id} />
              </li>
            ))}
          </ul>
        </Q>
        <Q n={3} q="What are we building?" to="/projects">
          <ul className="space-y-1.5">
            {d.projects.slice(0, 6).map((p) => {
              const passed = p.gates.filter((g) => g.decision === 'GO' || g.decision === 'GO WITH CONDITIONS').length;
              return (
                <li key={p.id}>
                  <RecordLink id={p.id} /> <DataTypeBadge t={p.data_type} />
                  <div className="mt-0.5 flex h-1.5 overflow-hidden rounded bg-panel-2" aria-label={`${passed} of 11 gates passed`}>
                    <div className="bg-accent" style={{ width: `${(passed / 11) * 100}%` }} />
                  </div>
                  <div className="text-[11px] text-ink-3">{passed}/11 gates · {p.tasks.length} tasks · ends {fmtDate(p.end)}</div>
                </li>
              );
            })}
            {!d.projects.length && <li className="text-ink-3">No projects yet.</li>}
          </ul>
        </Q>
        <Q n={4} q="What do customers want?" to="/opportunities">
          <div className="mb-2 flex flex-wrap gap-1">
            {d.stages.map((s) => (
              <span key={s.s} className="rounded border border-line px-1.5 py-0.5 text-[11.5px]">
                {s.s} <b className="num">{s.n}</b>
              </span>
            ))}
          </div>
          <ul className="space-y-1">
            {d.opps.filter(isActive).slice(0, 5).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-1.5">
                <StatusBadge s={o.stage} /> <RecordLink id={o.id} />
              </li>
            ))}
          </ul>
          <Link to="/inquiry" className="mt-2 inline-block text-[12px] font-semibold text-accent-2 hover:underline">
            + Create product from a customer inquiry
          </Link>
        </Q>
        <Q n={5} q="What is blocked?" to="/activities">
          <ul className="space-y-1">
            {d.blocked.slice(0, 6).map((a) => (
              <li key={a.id}>
                <RecordLink id={a.id} />
                {a.blocker && <div className="text-[12px] text-bad">Blocker: {a.blocker}</div>}
              </li>
            ))}
            {d.pocs
              .filter((p) => (p as { poc_status?: string }).poc_status === 'Samples Awaited')
              .map((p) => (
                <li key={p.id}>
                  <RecordLink id={p.id} /> <span className="text-[12px] text-warn">samples awaited</span>
                </li>
              ))}
            {!d.blocked.length && <li className="text-ink-3">Nothing flagged as blocked.</li>}
          </ul>
        </Q>
        <Q n={6} q="What can we reuse?" to="/reuse">
          <p className="mb-1 text-ink-2">
            {d.products.length} catalogue platforms · {records.filter((r) => r.entity === 'module').length} modules · {records.filter((r) => r.entity === 'application').length} applications
          </p>
          <div className="text-[11px] font-semibold uppercase text-ink-3">Most reused standard content</div>
          <ul className="mt-0.5 space-y-0.5">
            {d.stdUse.slice(0, 5).map(([k, n]) => (
              <li key={k} className="flex items-center gap-2">
                <RecordLink id={`mod-${k}`} /> <span className="text-[11px] text-ink-3">on {n} platforms</span>
              </li>
            ))}
          </ul>
        </Q>
        <Q n={7} q="What does it cost?" to="/cost">
          <ul className="space-y-1">
            {d.costs.slice(0, 5).map(({ m, s }) => (
              <li key={m.id} className="flex flex-wrap items-center gap-1.5">
                <RecordLink id={m.id} /> <DataTypeBadge t={m.data_type} />
                <span className="w-full pl-1 text-[12px] text-ink-2">
                  Selling <b className="num">{inr(s.c.selling)}</b> · net margin <b className="num">{(s.c.netMargin * 100).toFixed(1)}%</b> · TEAL D <b className="num">{inr(s.t.D)}</b>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[11px] text-ink-3">Values from DEMO/legacy seed rates are labelled DEMO; they are not quotations.</p>
        </Q>
        <Q n={8} q="What is changing?" to="/changed">
          <div className="text-[11px] font-semibold uppercase text-ink-3">Master data (GitHub)</div>
          <ul className="mb-2 space-y-0.5">
            {recentDatasets.map((ds) => (
              <li key={ds.id} className="flex gap-2">
                <span className="min-w-0 truncate">{ds.title}</span>
                <span className="ml-auto shrink-0 text-[11px] text-ink-3">
                  v{ds.version} · {fmtDate(ds.last_updated)}
                </span>
              </li>
            ))}
          </ul>
          <div className="text-[11.5px] text-ink-3">Git history is the change history of master data.</div>
        </Q>
        <Q n={9} q="What technology is emerging?" to="/technology">
          <p className="text-ink-2">
            {d.techs.length} radar topics tracked; <b>{assessed}</b> assessed. Radar status is assigned only with evidence — unassessed topics link to the handbook sections that discuss them.
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {d.techs.slice(0, 10).map((t) => (
              <Link key={t.id} to={`/record/${t.id}`} className="rounded border border-line px-1.5 py-0.5 text-[11.5px] hover:border-accent">
                {t.name}
              </Link>
            ))}
          </div>
        </Q>
        <Q n={10} q="What should we do next?" to="/pm">
          <ol className="space-y-1">
            {d.na.slice(0, 8).map((x) => (
              <li key={x.record.id} className="flex flex-wrap items-center gap-1.5">
                {x.source === 'SUGGESTED' ? <Badge tone="draft">suggested</Badge> : x.due ? <Badge tone={x.overdue ? 'bad' : 'neutral'}>{relativeDay(x.due)}</Badge> : <Badge>no date</Badge>}
                <span>{x.action ?? <span className="text-bad">No next action defined</span>}</span>
                <span className="w-full pl-1 text-[11.5px] text-ink-3">
                  <RecordLink id={x.record.id} showEntity />
                </span>
              </li>
            ))}
          </ol>
        </Q>
      </div>
    </div>
  );
}
