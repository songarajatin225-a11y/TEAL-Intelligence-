import clsx from 'clsx';
import { Activity, AlertOctagon, ArrowRight, BookOpen, Boxes, Briefcase, Clock, Cpu, FileSearch, FlaskConical, Gauge, HeartPulse, ListChecks, Package, Plus, Radar, ShieldAlert, Sparkles, TrendingUp, Zap, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { workspaceDef } from '../../app/nav';
import { usePrefs } from '../../app/prefs';
import { useRecents } from '../../app/shell/recents';
import { useShell } from '../../app/shell/ShellContext';
import { useAttention } from '../../app/shell/StatusCenter';
import { DataConfidence, StatusBadge } from '../../components/badges';
import { BusinessStory } from '../../components/BusinessStory';
import { recordPath } from '../../components/RecordLink';
import { ExecutiveBoard } from './ExecutiveBoard';
import { Button, buttonClass, Card, EmptyState, SectionHeader } from '../../components/ui';
import type { Activity as Act, CostModel, Opportunity, Poc, Product, Project, Risk } from '../../domain/entities';
import { OPPORTUNITY_STAGES } from '../../domain/entities';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { summarizeCostModel, useFx } from '../../hooks/useCost';
import { useData } from '../../hooks/useData';
import { type ChangeLogRow } from '../../repositories/workspaceDb';
import { DatabaseService } from '../../services/database';
import { attentionCounts, type AttentionItem } from '../../services/attention';
import { runDataQuality } from '../../services/dataQuality';
import { isActive } from '../../services/nextAction';
import { fmtDate, relativeDay, todayIso } from '../../utils/dates';
import { fetchJson } from '../../utils/paths';

const inr = (v: number) => `₹${(v / 1e5).toLocaleString('en-IN', { maximumFractionDigits: 1 })} L`;
const LEVEL: Record<AttentionItem['level'], { label: string; tone: string; bar: string; icon: LucideIcon }> = {
  critical: { label: 'Critical', tone: 'text-bad', bar: 'bg-bad', icon: AlertOctagon },
  attention: { label: 'Attention', tone: 'text-warn', bar: 'bg-warn', icon: ShieldAlert },
  info: { label: 'Check', tone: 'text-info', bar: 'bg-info', icon: ListChecks },
};

/**
 * MISSION CONTROL (spec §19–§20, §80): Attention → My work → Business → Engineering →
 * Intelligence → Activity. Same underlying data as the V1 "ten questions", presented by priority.
 */
export default function CommandCenter() {
  const { records, catalog, drafts } = useData();
  const prefs = usePrefs();
  const shell = useShell();
  const fx = useFx();
  const today = todayIso();
  const attention = useAttention();
  const counts = attentionCounts(attention);
  const recents = useRecents(6);
  const [filter, setFilter] = useState<AttentionItem['level'] | 'due' | null>(null);
  const [changes, setChanges] = useState<ChangeLogRow[]>([]);
  const [sections, setSections] = useState<number | null>(null);
  useEffect(() => {
    fetchJson<{ partitions: Record<string, number> }>('search-index/manifest.json')
      .then((m) => setSections(m.partitions.knowledge ?? null))
      .catch(() => setSections(null));
  }, []);
  useEffect(() => {
    void DatabaseService.changelog({ limit: 6 }).then(setChanges);
  }, [records]);

  const d = useMemo(() => {
    const of = <T,>(e: string) => records.filter((r) => r.entity === e) as unknown as (T & (typeof records)[number])[];
    const opps = of<Opportunity>('opportunity');
    const projects = of<Project>('project');
    const pocs = of<Poc>('poc');
    const acts = of<Act>('activity').filter((a) => isActive(a));
    const risks = of<Risk>('risk');
    const products = of<Product>('product');
    const costs = of<CostModel>('cost_model').map((m) => ({ m, s: summarizeCostModel(m, fx) }));
    const stdUse = new Map<string, number>();
    for (const p of products) for (const k of p.standard_content) stdUse.set(k, (stdUse.get(k) ?? 0) + 1);
    const dq = runDataQuality(records);
    const activeOpps = opps.filter(isActive);
    return {
      opps,
      activeOpps,
      projects: projects.filter(isActive),
      pocs: pocs.filter(isActive),
      acts: acts.sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')),
      openRisks: risks.filter((r) => r.risk_status === 'Open'),
      products,
      costs,
      stages: OPPORTUNITY_STAGES.filter((s) => s !== 'Lost').map((s) => ({ s, n: opps.filter((o) => o.stage === s).length })),
      stdUse: [...stdUse.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
      techs: records.filter((r) => r.entity === 'technology'),
      dq,
      dueSoon: attention.filter((a) => a.dueInDays != null && a.dueInDays >= 0 && a.dueInDays <= 7).length,
    };
  }, [records, fx, attention]);

  const exec = prefs.workspace === 'executive';
  const ws = workspaceDef(prefs.workspace);
  const active = d.activeOpps.length + d.projects.length + d.pocs.length;
  const shown = attention.filter((a) => !filter || (filter === 'due' ? a.dueInDays != null && a.dueInDays >= 0 && a.dueInDays <= 7 : a.level === filter));
  const health = d.dq.errors ? { label: 'Needs attention', tone: 'text-bad' } : d.dq.warnings ? { label: 'Incomplete', tone: 'text-warn' } : { label: 'Healthy', tone: 'text-ok' };

  const strip: { key: AttentionItem['level'] | 'due' | null; label: string; value: number; tone: string; icon: LucideIcon }[] = [
    { key: 'critical', label: 'Critical', value: counts.critical, tone: counts.critical ? 'text-bad' : 'text-ink-3', icon: AlertOctagon },
    { key: 'attention', label: 'Attention', value: counts.attention, tone: counts.attention ? 'text-warn' : 'text-ink-3', icon: ShieldAlert },
    { key: null, label: 'Active', value: active, tone: 'text-accent-2', icon: Activity },
    { key: 'due', label: 'Due in 7 days', value: d.dueSoon, tone: d.dueSoon ? 'text-info' : 'text-ink-3', icon: Clock },
  ];

  const quick: { label: string; icon: LucideIcon; run: () => void }[] = [
    { label: 'New product', icon: Sparkles, run: () => shell.openQuickCreate('product') },
    { label: 'New project', icon: Briefcase, run: () => shell.openQuickCreate('project') },
    { label: 'New POC', icon: FlaskConical, run: () => shell.openQuickCreate('poc') },
    { label: 'New requirement', icon: ListChecks, run: () => shell.openQuickCreate('requirement') },
    { label: 'New RFQ', icon: FileSearch, run: () => shell.openQuickCreate('rfq') },
    { label: 'New BOM', icon: Package, run: () => shell.openQuickCreate('bom') },
  ];

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <div className="mb-1 text-micro font-semibold uppercase tracking-[0.1em] text-accent-2">TEAL Intelligence · {ws.label}</div>
          <h1 className="text-title font-semibold tracking-[-0.02em]">{exec ? 'Executive View' : 'Mission Control'}</h1>
          <p className="mt-1 text-lead text-ink-2">TEAL’s product development and technology intelligence platform — market opportunities, technology, applications, product architecture, suppliers, cost, localization and execution in one system.</p>
        </div>
        <div className="flex items-center gap-2 text-meta text-ink-3">
          <span className="signal signal-live text-ok" aria-hidden />
          Data {catalog?.generated_at ?? '—'} · {records.length} records{drafts ? ` · ${drafts} local draft${drafts === 1 ? '' : 's'}` : ''}
        </div>
      </div>

      <nav aria-label="Business flow" className="surface rounded-card px-3 py-2">
        <BusinessStory />
      </nav>

      {/* priority strip */}
      <div role="group" aria-label="Priority" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {strip.map((s) => {
          const on = filter === s.key && s.key !== null;
          return (
            <button
              key={s.label}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(on || s.key === null ? null : s.key)}
              className={clsx('surface interactive flex items-center gap-3 rounded-card px-4 py-3 text-left', on && 'ring-2 ring-accent')}
            >
              <span className={clsx('grid size-10 shrink-0 place-items-center rounded-xl bg-ink/[0.05]', s.tone)}>
                <s.icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className={clsx('num block text-metric font-semibold leading-none', s.value ? 'text-ink' : 'text-ink-3')}>{s.value}</span>
                <span className="text-meta text-ink-3">{s.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {exec && <ExecutiveBoard />}

      {/* attention hero + side rail */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section aria-labelledby="attn" className="surface glass-edge rounded-panel p-5 xl:col-span-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="attn" className="text-section font-semibold tracking-[-0.015em]">
                What needs your attention?
              </h2>
              <p className="text-meta text-ink-3">{filter ? `Filtered: ${strip.find((s) => s.key === filter)?.label}` : 'Overdue and due-soon actions, blocked work, open risks, awaited samples'}</p>
            </div>
            {filter && (
              <Button size="sm" variant="ghost" onClick={() => setFilter(null)}>
                Show all
              </Button>
            )}
          </div>
          {shown.length ? (
            <ol className="divide-y divide-line">
              {shown.slice(0, exec ? 4 : 7).map((a) => {
                const l = LEVEL[a.level];
                return (
                  <li key={a.id} className="group relative flex flex-col gap-2 py-3 pl-4 sm:flex-row sm:items-center sm:gap-4">
                    <span className={clsx('absolute top-3 bottom-3 left-0 w-1 rounded-full', l.bar)} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={clsx('inline-flex items-center gap-1 text-micro font-semibold uppercase tracking-[0.06em]', l.tone)}>
                          <l.icon className="size-3.5" aria-hidden />
                          {l.label}
                        </span>
                        <span className="text-micro text-ink-3">{a.context}</span>
                      </div>
                      <Link to={recordPath(a.recordId)} className="mt-0.5 block truncate text-lead font-medium hover:text-accent-2">
                        {a.title}
                      </Link>
                      {a.action && <p className="truncate text-meta text-ink-2">→ {a.action}</p>}
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-4 text-meta sm:justify-end">
                      {a.owner && <span className="hidden text-ink-3 md:inline">{a.owner}</span>}
                      {a.due && <span className={clsx('num font-medium', a.level === 'critical' ? 'text-bad' : 'text-ink-2')}>{relativeDay(a.due)}</span>}
                      <Link to={recordPath(a.recordId)} className={buttonClass('secondary', 'sm')}>
                        Open <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <EmptyState compact icon={HeartPulse} title="Nothing needs attention" explain="Every active record has a next action on time and no risk is critical." />
          )}
          {shown.length > 7 && (
            <p className="mt-2 text-meta text-ink-3">
              +{shown.length - 7} more in the attention centre (bell icon) and <Link className="text-accent-2 hover:underline" to="/pm">My Workspace</Link>.
            </p>
          )}
        </section>

        <div className="space-y-4 xl:col-span-4">
          <Card title="Quick actions">
            <div className="grid grid-cols-2 gap-2">
              {quick.map((q) => (
                <button key={q.label} type="button" onClick={q.run} className="flex items-center gap-2 rounded-control border border-line-strong bg-solid/50 px-3 py-2.5 text-left text-meta font-medium transition-colors hover:border-accent/50 hover:bg-accent-soft/50">
                  <q.icon className="size-4 shrink-0 text-accent-2" aria-hidden />
                  {q.label}
                </button>
              ))}
            </div>
          </Card>
          <Card title="Recently opened" actions={<span className="text-micro text-ink-3">this browser</span>}>
            {recents.length ? (
              <ul className="-mx-1 space-y-0.5">
                {recents.map((r) => (
                  <li key={r.id}>
                    <Link to={recordPath(r.id)} className="flex items-center justify-between gap-2 rounded-lg px-1 py-1 hover:bg-ink/5">
                      <span className="truncate">{r.name}</span>
                      <span className="shrink-0 text-micro text-ink-3">{ENTITY_BY_TYPE[r.entity]?.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-meta text-ink-3">Records you open appear here.</p>
            )}
          </Card>
          <Card title="System">
            <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-meta">
              <dt className="text-ink-3">Data quality</dt>
              <dd>
                <Link to="/data-quality" className={clsx('font-medium hover:underline', health.tone)}>
                  {health.label}
                </Link>
              </dd>
              <dt className="text-ink-3">Records / datasets</dt>
              <dd className="num">
                {records.length} / {catalog?.datasets.length ?? 0}
              </dd>
              <dt className="text-ink-3">Local drafts</dt>
              <dd>
                <Link to="/admin" className="num hover:underline">
                  {drafts}
                </Link>
              </dd>
              <dt className="text-ink-3">Knowledge sections</dt>
              <dd className="num">{sections ?? '—'}</dd>
            </dl>
          </Card>
        </div>
      </div>

      {/* my work / business */}
      <section aria-label={exec ? 'Business' : 'My work'}>
        <SectionHeader title={exec ? 'Portfolio & delivery' : 'My work'} description={exec ? 'Projects, pipeline and portfolio' : 'Projects, opportunities, POCs and activities in flight'} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card title="Projects" icon={Briefcase} actions={<MoreLink to="/projects" />}>
            {d.projects.length ? (
              <ul className="space-y-3">
                {d.projects.slice(0, 4).map((p) => {
                  const passed = p.gates.filter((g) => g.decision === 'GO' || g.decision === 'GO WITH CONDITIONS').length;
                  return (
                    <li key={p.id}>
                      <Link to={recordPath(p.id)} className="block truncate font-medium hover:text-accent-2">
                        {p.name}
                      </Link>
                      <div className="mt-1.5 flex gap-0.5" role="img" aria-label={`${passed} of 11 gates passed`}>
                        {Array.from({ length: 11 }).map((_, i) => (
                          <span key={i} className={clsx('h-1.5 flex-1 rounded-full', i < passed ? 'bg-accent' : i === passed ? 'bg-accent/35' : 'bg-ink/10')} />
                        ))}
                      </div>
                      <div className="mt-1 flex justify-between text-micro text-ink-3">
                        <span>Next: G{passed}</span>
                        <span>ends {fmtDate(p.end)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty text="No active projects" to="/projects" />
            )}
          </Card>
          <Card title="Opportunities" icon={Zap} actions={<MoreLink to="/opportunities" />}>
            <PipelineBars stages={d.stages} />
            <ul className="mt-3 space-y-1.5">
              {d.activeOpps.slice(0, 3).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2">
                  <Link to={recordPath(o.id)} className="min-w-0 truncate hover:text-accent-2">
                    {o.name}
                  </Link>
                  <StatusBadge s={o.stage} />
                </li>
              ))}
            </ul>
          </Card>
          {exec ? (
            <Card title="Portfolio" icon={Package} actions={<MoreLink to="/products" />}>
              <div className="num text-metric font-semibold">{d.products.length}</div>
              <p className="text-meta text-ink-3">TEAL platforms · {records.filter((r) => r.entity === 'module').length} reusable modules · {records.filter((r) => r.entity === 'application').length} applications</p>
              <Link to="/roadmap" className="mt-3 inline-flex items-center gap-1 text-meta font-medium text-accent-2 hover:underline">
                Strategic roadmap <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Card>
          ) : (
            <Card title="POCs" icon={FlaskConical} actions={<MoreLink to="/poc" />}>
              {d.pocs.length ? (
                <ul className="space-y-2">
                  {d.pocs.slice(0, 4).map((p) => (
                    <li key={p.id}>
                      <Link to={recordPath(p.id)} className="block truncate font-medium hover:text-accent-2">
                        {p.name}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2">
                        <StatusBadge s={p.poc_status} />
                        <DataConfidence dataType={p.data_type} verification={p.provenance?.verification_status} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty text="No active POCs" to="/poc" />
              )}
            </Card>
          )}
          {exec ? (
            <Card title="Risks" icon={ShieldAlert} actions={<MoreLink to="/quality" />}>
              <div className={clsx('num text-metric font-semibold', d.openRisks.length && 'text-warn')}>{d.openRisks.length}</div>
              <p className="text-meta text-ink-3">open risks</p>
              <ul className="mt-2 space-y-1">
                {d.openRisks.slice(0, 3).map((r) => (
                  <li key={r.id} className="truncate text-meta">
                    <Link to={recordPath(r.id)} className="hover:text-accent-2">
                      {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card title="Activities" icon={ListChecks} actions={<MoreLink to="/activities" />}>
              {d.acts.length ? (
                <ul className="space-y-2">
                  {d.acts.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-2">
                      <Link to={recordPath(a.id)} className="min-w-0 truncate hover:text-accent-2">
                        {a.name}
                      </Link>
                      <span className={clsx('num shrink-0 text-micro', a.due_date && a.due_date < today ? 'text-bad' : 'text-ink-3')}>{a.due_date ? relativeDay(a.due_date) : '—'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty text="No open activities" to="/activities" />
              )}
            </Card>
          )}
        </div>
      </section>

      {/* business + engineering signals */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-label="Business">
          <SectionHeader title="Business" description="Cost models on real cost logic — labels say how reliable each figure is" />
          <Card title="Cost & margin" icon={TrendingUp} actions={<MoreLink to="/cost" />}>
            {d.costs.length ? (
              <ul className="divide-y divide-line">
                {d.costs.slice(0, 4).map(({ m, s }) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-0.5 py-2">
                    <div className="min-w-0 flex-1">
                      <Link to={recordPath(m.id)} className="block truncate font-medium hover:text-accent-2">
                        {m.name}
                      </Link>
                      <DataConfidence dataType={m.data_type} verification={m.provenance?.verification_status} />
                    </div>
                    <div className="text-right">
                      <div className="num font-semibold">{inr(s.c.selling)}</div>
                      <div className="num text-micro text-ink-3">net {(s.c.netMargin * 100).toFixed(1)}%</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="No cost models yet" to="/cost" />
            )}
          </Card>
        </section>
        <section aria-label="Engineering signals">
          <SectionHeader title="Engineering signals" description="What is moving across the engineering system" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Signal icon={Boxes} title="Most reused content" to="/reuse">
              <ul className="space-y-1">
                {d.stdUse.map(([k, n]) => (
                  <li key={k} className="flex justify-between gap-2 text-meta">
                    <Link to={recordPath(`mod-${k}`)} className="truncate hover:text-accent-2">
                      {(records.find((r) => r.id === `mod-${k}`)?.name as string | undefined) ?? k}
                    </Link>
                    <span className="num shrink-0 text-ink-3">×{n}</span>
                  </li>
                ))}
              </ul>
            </Signal>
            <Signal icon={Radar} title="Technology" to="/technology">
              <p className="text-meta text-ink-2">
                <b className="num text-ink">{d.techs.length}</b> topics tracked · <b className="num text-ink">{d.techs.filter((t) => (t as { radar_status?: string | null }).radar_status).length}</b> assessed
              </p>
              <p className="mt-1 text-micro text-ink-3">Radar positions are set only with evidence.</p>
            </Signal>
            <Signal icon={BookOpen} title="Knowledge" to="/knowledge">
              <p className="text-meta text-ink-2">
                <b className="num text-ink">{sections ?? '—'}</b> handbook sections · <b className="num text-ink">{records.filter((r) => r.entity === 'evidence').length}</b> evidence records
              </p>
            </Signal>
            <Signal icon={Activity} title="Recent changes" to="/changed">
              {changes.length ? (
                <ul className="space-y-1">
                  {changes.slice(0, 3).map((c) => (
                    <li key={c.seq} className="truncate text-meta">
                      <span className="text-ink-3">{c.action}</span> {c.summary}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-meta text-ink-3">No local changes yet. Master data v{catalog?.generated_at}.</p>
              )}
            </Signal>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Shortcut icon={Sparkles} title="Create a product from an inquiry" text="Paste the customer’s words; get the full draft thread." to="/inquiry" />
        <Shortcut icon={Cpu} title="Semiconductor Intelligence" text="Value chain, equipment buyer view, localization." to="/semiconductor" />
        <Shortcut icon={Gauge} title="Dashboards" text="Management, engineering, procurement, quality, service." to="/dashboards" />
      </div>
    </div>
  );
}

function MoreLink({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-meta font-medium text-accent-2 hover:underline">
      All <ArrowRight className="size-3.5" aria-hidden />
    </Link>
  );
}

function Empty({ text, to }: { text: string; to: string }) {
  return (
    <p className="text-meta text-ink-3">
      {text}.{' '}
      <Link to={to} className="text-accent-2 hover:underline">
        Open
      </Link>
    </p>
  );
}

function PipelineBars({ stages }: { stages: { s: string; n: number }[] }) {
  const max = Math.max(1, ...stages.map((x) => x.n));
  return (
    <div className="flex h-16 items-end gap-1" role="img" aria-label={`Pipeline: ${stages.map((x) => `${x.s} ${x.n}`).join(', ')}`}>
      {stages.map((x) => (
        <div key={x.s} className="flex flex-1 flex-col items-center gap-1" title={`${x.s}: ${x.n}`}>
          <div className={clsx('w-full rounded-md', x.n ? 'bg-accent/75' : 'bg-ink/[0.07]')} style={{ height: `${Math.max(6, (x.n / max) * 48)}px` }} />
          <span className="w-full truncate text-center text-[0.625rem] text-ink-3">{x.s.slice(0, 4)}</span>
        </div>
      ))}
    </div>
  );
}

function Signal({ icon: Icon, title, to, children }: { icon: LucideIcon; title: string; to: string; children: React.ReactNode }) {
  return (
    <div className="surface rounded-card p-4">
      <Link to={to} className="mb-2 flex items-center gap-2 font-semibold hover:text-accent-2">
        <Icon className="size-4 text-accent-2" aria-hidden /> {title}
      </Link>
      {children}
    </div>
  );
}

function Shortcut({ icon: Icon, title, text, to }: { icon: LucideIcon; title: string; text: string; to: string }) {
  return (
    <Link to={to} className="surface interactive flex items-start gap-3 rounded-card p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-2">
        <Icon className="size-5" aria-hidden />
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-meta text-ink-3">{text}</span>
      </span>
      <Plus className="sr-only" aria-hidden />
    </Link>
  );
}
