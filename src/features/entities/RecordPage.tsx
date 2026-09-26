import { lazy, Suspense, useState, type ComponentType, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DataTypeBadge, OriginBadge, VerificationBadge } from '../../components/badges';
import { EntityForm } from '../../components/EntityForm';
import { RecordLink } from '../../components/RecordLink';
import { AiContextButton, NextActionLine, ThreadCard } from '../../components/ThreadPanels';
import { Button, Card, Drawer, EmptyState, KV, Loading, Notice, PageHeader, Unknown } from '../../components/ui';
import { WhyButton } from '../../components/why';
import type { AnyRecord } from '../../domain';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData, type Rec } from '../../hooks/useData';
import { repo } from '../../repositories';
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

function renderValue(v: unknown): ReactNode {
  if (v == null) return <Unknown />;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'string') return /^[a-z]{2,6}-[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v) ? <RecordLink id={v} /> : v;
  if (typeof v === 'number') return <span className="num">{v.toLocaleString('en-IN')}</span>;
  if (Array.isArray(v)) {
    if (!v.length) return <span className="text-ink-3">—</span>;
    if (v.every((x) => typeof x === 'string' || typeof x === 'number'))
      return (
        <span className="flex flex-wrap gap-1">
          {v.map((x, i) => (
            <span key={i}>
              {renderValue(x)}
              {i < v.length - 1 ? ',' : ''}
            </span>
          ))}
        </span>
      );
    return <pre className="max-h-48 overflow-auto rounded bg-panel-2 p-2 text-[11px]">{JSON.stringify(v, null, 1)}</pre>;
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('value' in o && 'unit' in o) return o.value == null ? <Unknown /> : <span className="num">{`${String(o.value)} ${String(o.unit)}${o.original ? ` (source: ${String(o.original)})` : ''}`}</span>;
    return <pre className="max-h-48 overflow-auto rounded bg-panel-2 p-2 text-[11px]">{JSON.stringify(v, null, 1)}</pre>;
  }
  return String(v);
}

export function GenericFields({ record }: { record: AnyRecord }) {
  const entries = Object.entries(record).filter(([k]) => !BASE.has(k));
  if (!entries.length) return null;
  return <KV items={entries.map(([k, v]) => [k.replace(/_/g, ' '), renderValue(v)])} />;
}

export default function RecordPage() {
  const { id = '' } = useParams();
  const rid = decodeURIComponent(id);
  const { byId } = useData();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const r = byId.get(rid);
  if (!r)
    return (
      <EmptyState
        title="Record not found"
        explain={`No record with id "${rid}" exists in the master data or this browser’s workspace. It may have been deleted locally, or the link is out of date.`}
        actions={
          <>
            <Button onClick={() => nav('/search')}>Search</Button>
            <Button onClick={() => nav('/')}>Command Center</Button>
          </>
        }
      />
    );
  const def = ENTITY_BY_TYPE[r.entity];
  const ui = ENTITY_UI[r.entity];
  const Main = MAIN[r.entity];
  const isDraft = r.__origin && r.__origin !== 'MASTER';
  const p = r.provenance;

  return (
    <div className="space-y-3">
      <PageHeader
        eyebrow={
          <Link to={def?.route ?? '/'} className="hover:underline">
            {def?.label ?? r.entity}
          </Link>
        }
        title={r.name}
        subtitle={r.description}
        actions={
          <>
            <WhyButton record={r} label="Why?" />
            <AiContextButton id={r.id} />
            {!ui?.readOnly && <Button onClick={() => setEditing(true)}>Edit</Button>}
            {isDraft && (
              <Button variant="danger" onClick={() => void repo().workspace.discard(r.id)}>
                Discard local draft
              </Button>
            )}
            {!ui?.readOnly && (
              <Button
                variant="ghost"
                onClick={async () => {
                  if (window.confirm(`Delete "${r.name}" from this browser’s workspace? Master data is not changed; a deletion is recorded for the change package.`)) {
                    await repo().workspace.remove(r.id, r.entity, r.name);
                    nav(def?.route ?? '/');
                  }
                }}
              >
                Delete locally
              </Button>
            )}
            <Button variant="ghost" onClick={() => window.print()}>
              Print
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <DataTypeBadge t={r.data_type} />
        <VerificationBadge v={p?.verification_status} />
        <OriginBadge o={r.__origin} />
        {(r.tags ?? []).map((t) => (
          <span key={t} className="rounded bg-panel-2 px-1.5 text-[11px] text-ink-3">
            #{t}
          </span>
        ))}
        <span className="text-[11px] text-ink-3">{r.id}</span>
      </div>
      {r.data_type === 'DEMO' && <Notice tone="info">DEMO record — fictional data used to demonstrate the workflow. Not real customer or engineering data.</Notice>}
      {(r.data_type === 'INFERRED' || p?.verification_status === 'DRAFT') && r.data_type !== 'DEMO' && <Notice tone="draft">DRAFT — generated or entered without validation. Review before relying on it.</Notice>}
      {isDraft && <Notice tone="draft">LOCAL DRAFT — stored only in this browser. Permanent repository update requires a GitHub commit (Admin → Change package).</Notice>}

      <div className="grid gap-3 xl:grid-cols-3">
        <div className="min-w-0 space-y-3 xl:col-span-2">
          {Main && (
            <Suspense fallback={<Loading />}>
              <Main record={r} />
            </Suspense>
          )}
          <Card title="Details">
            <GenericFields record={r} />
            {r.notes && <p className="mt-2 whitespace-pre-wrap text-ink-2">{r.notes}</p>}
          </Card>
        </div>
        <div className="min-w-0 space-y-3">
          {def?.requiresNextAction !== undefined && (
            <Card title="Next required action">
              <NextActionLine record={r} />
            </Card>
          )}
          <Card title="Provenance" actions={<WhyButton record={r} />}>
            <KV
              items={[
                ['Data type', <DataTypeBadge key="d" t={r.data_type} />],
                ['Verification', <VerificationBadge key="v" v={p?.verification_status} />],
                ['Source', p?.source_id ? <RecordLink id={p.source_id} /> : <Unknown label="not recorded" />],
                ['Document', p?.document ?? '—'],
                ['Section', p?.section ?? '—'],
                ['Confidence', p?.confidence ?? '—'],
                ['Retrieved', p?.retrieved_at ? fmtDate(p.retrieved_at) : '—'],
                ['Last verified', p?.last_verified ? fmtDate(p.last_verified) : '—'],
                ['Note', p?.note ?? '—'],
                ['Updated', r.updated_at ? fmtDate(r.updated_at) : '—'],
              ]}
            />
          </Card>
        </div>
      </div>
      <ThreadCard record={r} />
      <Drawer open={editing} onClose={() => setEditing(false)} title={`Edit ${def?.label ?? ''}`} wide>
        <EntityForm entity={r.entity} record={r} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
      </Drawer>
    </div>
  );
}
