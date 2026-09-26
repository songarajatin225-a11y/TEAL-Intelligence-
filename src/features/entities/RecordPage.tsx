import { Copy, MoreHorizontal, PencilLine, Pin, PinOff, Printer, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { isFavorite, toggleFavorite, usePrefs } from '../../app/prefs';
import { trackRecent } from '../../app/shell/recents';
import { DataConfidence, DataTypeBadge, OriginBadge, StatusBadge, VerificationBadge } from '../../components/badges';
import { EntityForm } from '../../components/EntityForm';
import { fieldLabel, renderValue } from '../../components/fieldValue';
import { RecordLink } from '../../components/RecordLink';
import { AiContextDrawer, GapsPanel, LinkedRecords, NextActionLine, SimilarPanel } from '../../components/ThreadPanels';
import { toast } from '../../components/toast';
import { Badge, Button, Card, Drawer, EmptyState, IconButton, KV, Loading, Notice, Popover, Tabs, Unknown } from '../../components/ui';
import { WhyButton } from '../../components/why';
import type { AnyRecord } from '../../domain';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData, type Rec } from '../../hooks/useData';
import { repo } from '../../repositories';
import { workspaceDb, type ChangeLogRow } from '../../repositories/workspaceDb';
import { whatIsMissing } from '../../services/gaps';
import { neighbours } from '../../services/graph';
import { whyForRecord } from '../../services/why';
import { fmtDate } from '../../utils/dates';
import { ENTITY_UI } from './entityUi';

/* Entity-specific main panels, code-split. Each receives the record. */
type Main = ComponentType<{ record: Rec }>;
const MAIN: Record<string, Main> = {
  product: lazy(() => import('../products/ProductDna')),
  configuration: lazy(() => import('../configurator/ConfigurationView')),
  cost_model: lazy(() => import('../cost/CostModelView')),
  bom: lazy(() => import('../bom/BomView')),
  doe: lazy(() => import('../doe/DoeView')),
  poc: lazy(() => import('../poc/PocView')),
  project: lazy(() => import('../projects/ProjectView')),
  acceptance: lazy(() => import('../fat-sat/AcceptanceView')),
  rfq: lazy(() => import('../suppliers/RfqView')),
  material: lazy(() => import('../applications/MaterialView')),
  laser_source: lazy(() => import('../laser/LaserSourceView')),
  gate_definition: lazy(() => import('../gates/GateDefinitionView')),
  risk: lazy(() => import('../quality/RiskView')),
  opportunity: lazy(() => import('../opportunities/OpportunityView')),
};

const BASE = new Set(['id', 'entity', 'name', 'description', 'data_type', 'provenance', 'tags', 'links', 'next_action', 'created_at', 'updated_at', 'version', 'notes', '__origin', '__dataset']);
const STATUS_KEYS = ['status', 'stage', 'poc_status', 'risk_status', 'rfq_status', 'ticket_status', 'cr_status', 'maturity'];

function JsonBlock({ v }: { v: unknown }) {
  return (
    <details>
      <summary className="cursor-pointer text-meta text-accent-2">Show {Array.isArray(v) ? `${v.length} entries` : 'fields'}</summary>
      <pre className="scroll-thin mt-1 max-h-64 overflow-auto rounded-control bg-panel-2 p-3 text-micro">{JSON.stringify(v, null, 2)}</pre>
    </details>
  );
}

/** Every stored field, human-labelled (the "System" tab). */
export function GenericFields({ record }: { record: AnyRecord }) {
  const entries = Object.entries(record).filter(([k]) => !BASE.has(k));
  if (!entries.length) return null;
  const complex = (v: unknown) => (Array.isArray(v) ? v.some((x) => typeof x === 'object' && x !== null) : typeof v === 'object' && v !== null && !('unit' in v));
  return <KV items={entries.map(([k, v]) => [fieldLabel(k), complex(v) ? <JsonBlock v={v} /> : renderValue(v)])} />;
}

type Tab = 'overview' | 'related' | 'intelligence' | 'evidence' | 'history' | 'system';

export default function RecordPage() {
  const { id = '' } = useParams();
  const rid = decodeURIComponent(id);
  const { byId, graph } = useData();
  const prefs = usePrefs();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [ai, setAi] = useState(false);
  const r = byId.get(rid);
  const tab = (params.get('tab') as Tab | null) ?? 'overview';
  const editing = params.get('edit') === '1';
  const setTab = (t: Tab) =>
    setParams(
      (p) => {
        if (t === 'overview') p.delete('tab');
        else p.set('tab', t);
        return p;
      },
      { replace: true },
    );
  const setEditing = (on: boolean) =>
    setParams(
      (p) => {
        if (on) p.set('edit', '1');
        else p.delete('edit');
        return p;
      },
      { replace: true },
    );

  useEffect(() => {
    if (r) void trackRecent({ id: r.id, entity: r.entity, name: r.name });
  }, [r?.id, r?.name, r?.entity]); // eslint-disable-line react-hooks/exhaustive-deps

  const related = useMemo(() => {
    if (!r) return [];
    const m = new Map<string, number>();
    for (const n of neighbours(graph, r.id)) m.set(n.record.entity, (m.get(n.record.entity) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [graph, r]);
  const gapsOpen = useMemo(() => (r ? whatIsMissing(graph, r.id).filter((g) => g.status !== 'present').length : 0), [graph, r]);

  if (!r)
    return (
      <EmptyState
        title="Record not found"
        explain={`No record with id “${rid}” exists in the master data or in this browser’s workspace. It may have been deleted locally, or the link is out of date.`}
        actions={
          <>
            <Button variant="primary" onClick={() => nav(`/search?q=${encodeURIComponent(rid)}`)}>
              Search for it
            </Button>
            <Button onClick={() => nav('/')}>Mission Control</Button>
          </>
        }
      />
    );

  const def = ENTITY_BY_TYPE[r.entity];
  const ui = ENTITY_UI[r.entity];
  const Main = MAIN[r.entity];
  const isDraft = r.__origin && r.__origin !== 'MASTER';
  const p = r.provenance;
  const x = r as Record<string, unknown>;
  const status = STATUS_KEYS.map((k) => x[k]).find((v) => typeof v === 'string') as string | undefined;
  const fav = isFavorite(prefs, r.id);
  const keyFields = [...new Set([...(ui?.columns.map((c) => c.key) ?? []), ...(ui?.fields.map((f) => f.key) ?? [])])].filter((k) => !STATUS_KEYS.includes(k) && k !== 'description' && x[k] !== undefined);
  const relatedCount = related.reduce((s, [, n]) => s + n, 0);

  const menu: { icon: typeof Copy; label: string; danger?: boolean; run: () => unknown }[] = [
    { icon: Sparkles, label: 'AI context for this record', run: () => setAi(true) },
    {
      icon: Copy,
      label: 'Copy link',
      run: () =>
        navigator.clipboard
          ?.writeText(window.location.href)
          .then(() => toast('Link copied'))
          .catch(() => toast('Could not copy the link', { tone: 'error' })),
    },
    { icon: Printer, label: 'Print', run: () => window.print() },
    ...(isDraft ? [{ icon: RotateCcw, label: 'Discard local draft', run: () => repo().workspace.discard(r.id) }] : []),
    ...(!ui?.readOnly
      ? [
          {
            icon: Trash2,
            label: 'Delete locally',
            danger: true,
            run: async () => {
              if (window.confirm(`Delete “${r.name}” from this browser’s workspace? Master data is not changed; the deletion is recorded for the change package.`)) {
                await repo().workspace.remove(r.id, r.entity, r.name);
                nav(def?.route ?? '/');
              }
            },
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-4xl">
          <Link to={def?.route ?? '/'} className="text-micro font-semibold uppercase tracking-[0.08em] text-accent-2 hover:underline">
            {def?.label ?? 'Record'}
          </Link>
          <h1 className="mt-1 text-title font-semibold tracking-[-0.02em]">{r.name}</h1>
          {r.description && <p className="mt-1 text-lead text-ink-2">{r.description}</p>}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <StatusBadge s={status} />
            <OriginBadge o={r.__origin} />
            <DataConfidence dataType={r.data_type} verification={p?.verification_status} source={p?.document ?? p?.source_id} lastVerified={p?.last_verified} />
            {r.updated_at && <span className="text-micro text-ink-3">· updated {fmtDate(r.updated_at)}</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <WhyButton record={r} label="Why?" />
          <IconButton label={fav ? 'Unpin from sidebar' : 'Pin to sidebar'} icon={fav ? PinOff : Pin} onClick={() => toggleFavorite({ id: r.id, name: r.name, entity: r.entity })} active={fav} />
          {!ui?.readOnly && (
            <Button variant="primary" onClick={() => setEditing(true)}>
              <PencilLine className="size-4" aria-hidden /> Edit
            </Button>
          )}
          <Popover label="More actions" width="w-60" trigger={({ toggle, open, id: pid }) => <IconButton label="More actions" icon={MoreHorizontal} onClick={toggle} aria-expanded={open} aria-controls={pid} />}>
            {(close) => (
              <ul>
                {menu.map((m) => (
                  <li key={m.label}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left hover:bg-ink/5 ${m.danger ? 'text-bad' : ''}`}
                      onClick={() => {
                        close();
                        void m.run();
                      }}
                    >
                      <m.icon className="size-4 shrink-0 opacity-80" aria-hidden />
                      {m.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Popover>
        </div>
      </header>

      {(r.data_type === 'DEMO' || isDraft || p?.verification_status === 'DRAFT' || r.data_type === 'INFERRED') && (
        <Notice tone={r.data_type === 'DEMO' ? 'info' : 'draft'}>
          {r.data_type === 'DEMO'
            ? 'Demo record — fictional data that demonstrates the workflow. Not real customer or engineering data.'
            : isDraft
              ? 'Local draft — stored only in this browser. Permanent repository update requires a GitHub commit (Data & Workspace → change package).'
              : 'Draft — generated or entered without validation. Review before relying on it.'}
        </Notice>
      )}

      {related.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Related records">
          <span className="text-meta text-ink-3">Related</span>
          {related.map(([e, n]) => (
            <button key={e} type="button" onClick={() => setTab('related')} className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-meta hover:bg-accent-soft hover:text-accent-2">
              <b className="num">{n}</b> {(n === 1 ? ENTITY_BY_TYPE[e]?.label : ENTITY_BY_TYPE[e]?.plural) ?? e}
            </button>
          ))}
        </div>
      )}

      <div>
        <Tabs<Tab>
          label="Record sections"
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'overview', label: 'Overview' },
            { key: 'related', label: 'Related', count: relatedCount },
            { key: 'intelligence', label: 'Intelligence', count: gapsOpen || undefined },
            { key: 'evidence', label: 'Evidence' },
            { key: 'history', label: 'History' },
            { key: 'system', label: 'System' },
          ]}
        />

        {tab === 'overview' && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="min-w-0 space-y-4 xl:col-span-2">
              {Main ? (
                <Suspense fallback={<Loading />}>
                  <Main record={r} />
                </Suspense>
              ) : (
                <Card title="Details">
                  {keyFields.length ? <KV items={keyFields.map((k) => [fieldLabel(k), renderValue(x[k])])} /> : <GenericFields record={r} />}
                  {r.notes && <p className="mt-3 whitespace-pre-wrap text-ink-2">{r.notes}</p>}
                </Card>
              )}
            </div>
            <div className="min-w-0 space-y-4">
              {(def?.requiresNextAction || r.next_action) && (
                <Card title="Next action">
                  <NextActionLine record={r} />
                </Card>
              )}
              <Card title="Trust" description="Where this came from and how far to rely on it">
                <KV
                  items={[
                    ['Data type', <DataTypeBadge key="d" t={r.data_type} />],
                    ['Verification', <VerificationBadge key="v" v={p?.verification_status} />],
                    ['Source', p?.source_id ? <RecordLink id={p.source_id} /> : <Unknown label="not recorded" />],
                    ...(p?.document ? ([['Document', p.document]] as [string, string][]) : []),
                    ...(p?.last_verified ? ([['Last verified', fmtDate(p.last_verified)]] as [string, string][]) : []),
                  ]}
                />
                <button type="button" onClick={() => setTab('evidence')} className="mt-3 text-meta font-medium text-accent-2 hover:underline">
                  Show evidence
                </button>
              </Card>
              {gapsOpen > 0 && (
                <Card title="What is missing" description={`${gapsOpen} open thread check${gapsOpen === 1 ? '' : 's'}`}>
                  <button type="button" onClick={() => setTab('intelligence')} className="text-meta font-medium text-accent-2 hover:underline">
                    Review gaps, similar work and reuse
                  </button>
                </Card>
              )}
              {(r.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {r.tags!.map((t) => (
                    <Badge key={t}>#{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'related' && (
          <Card title="Connected records" description="Every link in the digital thread, both directions">
            <LinkedRecords id={r.id} />
          </Card>
        )}

        {tab === 'intelligence' && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="What Is Missing?" description="Thread checks against the handbook method">
              <GapsPanel id={r.id} />
            </Card>
            <div className="space-y-4">
              <Card title="What Can We Reuse?">
                <SimilarPanel record={r} mode="reuse" />
              </Card>
              <Card title="Similar work">
                <SimilarPanel record={r} mode="similar" />
              </Card>
            </div>
          </div>
        )}

        {tab === 'evidence' && <EvidenceTab record={r} />}
        {tab === 'history' && <HistoryTab record={r} />}
        {tab === 'system' && (
          <Card title="All stored fields" description="Every field as stored — for engineers and data reviewers">
            <KV
              items={[
                ['Record id', <span key="i" className="num">{r.id}</span>],
                ['Type', def?.label ?? r.entity],
                ['Stored in', r.__origin === 'MASTER' ? `GitHub master data${r.__dataset ? ` · dataset ${r.__dataset}` : ''}` : 'This browser (local draft)'],
                ['Version', r.version ?? '—'],
              ]}
            />
            <div className="my-4 border-t border-line" />
            <GenericFields record={r} />
          </Card>
        )}
      </div>

      <Drawer open={editing} onClose={() => setEditing(false)} title={`Edit ${def?.label.toLowerCase() ?? 'record'}`} subtitle="Changes are saved as a local draft in this browser." wide>
        <EntityForm entity={r.entity} record={r} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
      </Drawer>
      <AiContextDrawer id={r.id} open={ai} onClose={() => setAi(false)} />
    </div>
  );
}

function EvidenceTab({ record }: { record: Rec }) {
  const { graph } = useData();
  const items = useMemo(() => whyForRecord(record, graph), [record, graph]);
  const p = record.provenance;
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card title="Provenance">
        <KV
          items={[
            ['Data type', <DataTypeBadge key="d" t={record.data_type} />],
            ['Verification', <VerificationBadge key="v" v={p?.verification_status} />],
            ['Source', p?.source_id ? <RecordLink id={p.source_id} /> : <Unknown label="not recorded" />],
            ['Document', p?.document ?? '—'],
            ['Section', p?.section ?? '—'],
            ['Confidence', p?.confidence ?? '—'],
            ['Retrieved', p?.retrieved_at ? fmtDate(p.retrieved_at) : '—'],
            ['Last verified', p?.last_verified ? fmtDate(p.last_verified) : '—'],
            ['Note', p?.note ?? '—'],
          ]}
        />
      </Card>
      <Card title="Why? — sources, evidence, assumptions, unknowns" className="xl:col-span-2">
        <ol className="space-y-2.5">
          {items.map((it, i) => (
            <li key={i} className="rounded-control border border-line p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={it.kind === 'Evidence' ? 'ok' : it.kind === 'Assumption' ? 'warn' : it.kind === 'Unknown' ? 'neutral' : 'accent'}>{it.kind}</Badge>
                <span className="font-medium">{it.title}</span>
              </div>
              {it.detail && <p className="mt-1 whitespace-pre-wrap text-meta text-ink-2">{it.detail}</p>}
              {it.ref &&
                (it.ref.includes('.md') ? (
                  <Link to={`/knowledge/${it.ref.replace('#', '?a=')}`} className="mt-1 inline-block text-meta text-accent-2 hover:underline">
                    Open handbook section
                  </Link>
                ) : (
                  <Link to={`/record/${encodeURIComponent(it.ref)}`} className="mt-1 inline-block text-meta text-accent-2 hover:underline">
                    Open source record
                  </Link>
                ))}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function HistoryTab({ record }: { record: Rec }) {
  const [rows, setRows] = useState<ChangeLogRow[] | null>(null);
  useEffect(() => {
    workspaceDb()
      .changelog.where('record_id')
      .equals(record.id)
      .reverse()
      .sortBy('seq')
      .then(setRows)
      .catch(() => setRows([]));
  }, [record.id, record.updated_at]);
  return (
    <Card title="History" description="Local changes in this browser. Master-data history is the Git log of its dataset.">
      <KV
        items={[
          ['Created', record.created_at ? fmtDate(record.created_at) : '—'],
          ['Last updated', record.updated_at ? fmtDate(record.updated_at) : '—'],
          ['Stored in', record.__origin === 'MASTER' ? `GitHub dataset ${record.__dataset ?? ''}` : 'This browser (local draft)'],
        ]}
      />
      <ol className="mt-4 space-y-2.5 border-l border-line pl-4">
        {(rows ?? []).map((c) => (
          <li key={c.seq} className="relative">
            <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-accent" aria-hidden />
            <div className="text-meta">
              <span className="font-medium capitalize">{c.action}</span> — {c.summary}
            </div>
            <div className="text-micro text-ink-3">{new Date(c.at).toLocaleString()}</div>
          </li>
        ))}
        {rows && !rows.length && <li className="text-meta text-ink-3">No local changes to this record.</li>}
      </ol>
    </Card>
  );
}
