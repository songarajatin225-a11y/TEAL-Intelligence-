import { AlertTriangle, Copy, FileDown, GitBranch, RotateCcw, Save } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState, type ComponentType } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { toast } from '../../components/toast';
import { TrustBadge } from '../../components/TrustBadge';
import { Badge, Button, buttonClass, Card, Chain, EmptyState, Field, Input, Loading, Modal, Notice, PageHeader, Tabs } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import type { Simulation } from '../../domain/engineering';
import { newLocalId, repo, ValidationFailure } from '../../repositories';
import { buildBom } from '../../services/sim/bom';
import { deriveScenario } from '../../services/sim/build';
import { capacity, cycleTime } from '../../services/sim/capacity';
import { cannotRun, resolveScenario } from '../../services/sim/model';
import { designReview } from '../../services/sim/review';
import { supplierDependency } from '../../services/sim/supply';
import { todayIso } from '../../utils/dates';
import { ModeToggle, num, useCustomerMode, useEngineering, type Eng } from './shared';
import { studioPath } from './StudioPage';

export type Sim = Simulation & AnyRecord;

/** Everything a Studio tab needs: the working copy, its setter and the derived engineering results. */
export function useStudioState(eng: Eng, sim: Sim) {
  return useMemo(() => {
    const res = resolveScenario(sim, eng.byId, eng.defs);
    const cycle = cycleTime(res);
    const cap = cycle ? capacity(sim, cycle) : null;
    const bom = buildBom(res, eng.byId, eng.fx);
    const deps = supplierDependency(res, eng.parts, eng.ctx, eng.byId);
    const issues = designReview({ res, records: eng.records, byId: eng.byId, defs: eng.defs, ctx: eng.ctx, bom, deps });
    return { res, cycle, cap, bom, deps, issues };
  }, [eng, sim]);
}
export type Derived = ReturnType<typeof useStudioState>;
export interface TabProps {
  eng: Eng;
  sim: Sim;
  set: (f: (s: Sim) => Sim) => void;
  d: Derived;
  customer: boolean;
  saveAsNew: (s: Sim, reason: string, label?: string) => Promise<void>;
}

const TABS = {
  overview: { label: 'Overview', C: lazy(() => import('./tabs/OverviewTab')) },
  machine3d: { label: '3D machine', C: lazy(() => import('../twin/MachineTab')) },
  architecture: { label: 'Architecture', C: lazy(() => import('./tabs/ArchitectureTab')) },
  components: { label: 'Components', C: lazy(() => import('./tabs/ComponentsTab')) },
  laser: { label: 'Laser & optics', C: lazy(() => import('./tabs/LaserTab')) },
  simulate: { label: 'Material flow', C: lazy(() => import('./tabs/SimulateTab')) },
  capacity: { label: 'Cycle & capacity', C: lazy(() => import('./tabs/CapacityTab')) },
  variability: { label: 'Monte Carlo', C: lazy(() => import('./tabs/VariabilityTab')) },
  whatif: { label: 'What-if', C: lazy(() => import('./tabs/WhatIfTab')) },
  optimize: { label: 'Optimize', C: lazy(() => import('./tabs/OptimizeTab')) },
  twin: { label: '2D twin', C: lazy(() => import('./tabs/TwinTab')) },
  sequence: { label: 'Sequence', C: lazy(() => import('./tabs/SequenceTab')) },
  reliability: { label: 'Faults · maintenance · energy', C: lazy(() => import('./tabs/ReliabilityTab')) },
  cost: { label: 'BOM · cost · suppliers', C: lazy(() => import('./tabs/CostTab')) },
  review: { label: 'Design review', C: lazy(() => import('./tabs/ReviewTab')) },
  validation: { label: 'Validation', C: lazy(() => import('./tabs/ValidationTab')) },
  versions: { label: 'Versions', C: lazy(() => import('./tabs/VersionsTab')) },
  report: { label: 'Report', C: lazy(() => import('./tabs/ReportTab')) },
} satisfies Record<string, { label: string; C: ComponentType<TabProps> }>;
type TabKey = keyof typeof TABS;
const CUSTOMER_HIDDEN: TabKey[] = ['cost', 'review', 'versions', 'optimize'];

export default function ScenarioPage() {
  const { id = '' } = useParams();
  const rid = decodeURIComponent(id);
  const eng = useEngineering();
  const rec = eng.byId.get(rid) as Sim | undefined;
  const [work, setWork] = useState<Sim | undefined>(rec);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    // a fresh record (after save, another tab, a data reload) replaces the working copy unless it has unsaved edits
    if (!dirty) setWork(rec);
  }, [rec]); // eslint-disable-line react-hooks/exhaustive-deps
  if (eng.status === 'loading') return <Loading />;
  if (!rec || rec.entity !== 'simulation' || !work)
    return (
      <EmptyState
        title="Scenario not found"
        explain={`No simulation scenario “${rid}”. It may be a local draft from another browser.`}
        actions={
          <Link to="/studio" className={buttonClass('primary')}>
            Equipment Simulation Studio
          </Link>
        }
      />
    );
  return <Workspace key={rec.id} eng={eng} rec={rec} work={work} setWork={setWork} dirty={dirty} setDirty={setDirty} />;
}

function Workspace({ eng, rec, work, setWork, dirty, setDirty }: { eng: Eng; rec: Sim; work: Sim; setWork: (s: Sim) => void; dirty: boolean; setDirty: (b: boolean) => void }) {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const customer = useCustomerMode();
  const [derive, setDerive] = useState<null | { kind: 'version' | 'variant' }>(null);
  const [reason, setReason] = useState('');
  const d = useStudioState(eng, work);
  let tab = (params.get('tab') as TabKey) ?? 'overview';
  if (!TABS[tab] || (customer && CUSTOMER_HIDDEN.includes(tab))) tab = 'overview';
  const set = (f: (s: Sim) => Sim) => {
    setWork(f(work));
    setDirty(true);
  };
  const save = async () => {
    try {
      const { __origin: _o, __dataset: _d, ...clean } = work as Sim & { __origin?: string; __dataset?: string };
      void _o;
      void _d;
      await repo().workspace.save(clean as unknown as Record<string, unknown>, `Scenario saved: ${work.name}`);
      setDirty(false);
      toast('Scenario saved as a local draft', { tone: 'draft', detail: 'Export a change package to make it permanent in GitHub.' });
    } catch (e) {
      toast('Scenario not saved', { tone: 'error', detail: e instanceof ValidationFailure ? e.message : String(e) });
    }
  };
  const saveAsNew = async (s: Sim, why: string, label?: string) => {
    const next = deriveScenario(s, { newId: newLocalId, today: todayIso(), reason: why, label, level: s.config_level });
    try {
      await repo().workspace.save(next as unknown as Record<string, unknown>, `New scenario version: ${next.name}`);
      toast(`Created ${next.name}`, { tone: 'draft', detail: `Derived from ${s.name}; the original is unchanged.` });
      setDirty(false);
      nav(studioPath(next.id));
    } catch (e) {
      toast('Could not create the scenario', { tone: 'error', detail: e instanceof ValidationFailure ? e.message : String(e) });
    }
  };
  const Tab = TABS[tab].C;
  const blocked = cannotRun(d.res);
  const draftTag = (work.tags ?? []).includes('rule-generated-draft');
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={
          <Link to="/studio" className="hover:underline">
            Equipment Simulation Studio
          </Link>
        }
        title={work.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {work.scenario_label && <Badge tone="accent">Scenario {work.scenario_label}</Badge>}
            <Badge>v{work.version ?? 1}</Badge>
            <Badge>{work.sim_status}</Badge>
            {work.config_level && <Badge>{work.config_level}</Badge>}
            <TrustBadge record={work} />
            {dirty && <Badge tone="draft">Unsaved changes</Badge>}
          </span>
        }
        actions={
          <>
            <ModeToggle />
            {!customer && (
              <>
                <Button onClick={() => setDerive({ kind: 'version' })}>
                  <GitBranch className="size-4" aria-hidden /> New version
                </Button>
                <Button onClick={() => setDerive({ kind: 'variant' })}>
                  <Copy className="size-4" aria-hidden /> New scenario
                </Button>
                {dirty && (
                  <Button onClick={() => (setWork(rec), setDirty(false))}>
                    <RotateCcw className="size-4" aria-hidden /> Discard edits
                  </Button>
                )}
                <Button variant="primary" onClick={save} disabled={!dirty}>
                  <Save className="size-4" aria-hidden /> Save
                </Button>
              </>
            )}
            <Link to={`${studioPath(work.id)}?tab=report`} className={buttonClass('secondary')}>
              <FileDown className="size-4" aria-hidden /> Report
            </Link>
          </>
        }
      />
      {draftTag && <Notice tone="draft">RULE-GENERATED DRAFT — engineering review required. {work.provenance?.note}</Notice>}
      {work.data_type === 'DEMO' && <Notice tone="info">DEMO DATA — fictional scenario. Station times, prices and components are illustrative; edits save as a local draft.</Notice>}
      {customer && <Notice tone="info">Customer demo mode — internal cost, supplier identities, internal risks and notes are hidden.</Notice>}
      {blocked && (
        <div role="alert" className="flex items-start gap-2 rounded-control border border-warn/40 bg-warn/10 px-3 py-2 text-body">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <div>
            <strong>{blocked}</strong>
            <div className="text-meta text-ink-2">Enter it under Architecture{d.res.blocking.some((b) => /area|hatch|speed/.test(b)) ? ' (laser inputs) or Laser & optics' : ''}. Nothing is estimated for you.</div>
          </div>
        </div>
      )}
      <Card padded={false} bodyClassName="px-4 py-3">
        <Chain
          label="Digital thread for this equipment"
          steps={[
            { label: 'Customer', sub: eng.byId.get(work.customer_id ?? '')?.name ?? '—', state: work.customer_id ? 'done' : 'gap', to: work.customer_id ? recordPath(work.customer_id) : undefined },
            { label: 'Requirements', sub: String((work.requirement_ids ?? []).length), state: (work.requirement_ids ?? []).length ? 'done' : 'gap', to: `${studioPath(work.id)}?tab=validation` },
            { label: 'Application', sub: eng.byId.get(work.application_id ?? '')?.name ?? '—', state: work.application_id ? 'done' : 'todo' },
            { label: 'Architecture', sub: `${work.stations.length} stations`, state: 'done', to: `${studioPath(work.id)}?tab=architecture` },
            { label: '3D machine', sub: 'conceptual', state: 'done', to: `${studioPath(work.id)}?tab=machine3d` },
            { label: 'Components', sub: String(d.deps.length), state: d.deps.length ? 'done' : 'gap', to: `${studioPath(work.id)}?tab=components` },
            { label: 'Simulation', sub: d.cycle ? `${num(d.cycle.practicalUph, 4)} UPH` : 'inputs missing', state: d.cycle ? 'done' : 'gap', to: `${studioPath(work.id)}?tab=capacity` },
            { label: 'BOM · cost', sub: String(d.bom.items.filter((i) => i.level === 'Component').length), state: d.bom.total != null ? 'done' : 'todo', to: customer ? undefined : `${studioPath(work.id)}?tab=cost` },
            { label: 'Test', sub: '', state: 'todo', to: `${studioPath(work.id)}?tab=validation` },
            { label: 'Validation', sub: (work.actuals ?? []).length ? `${(work.actuals ?? []).length} measured` : 'none', state: (work.actuals ?? []).length ? 'done' : 'todo', to: `${studioPath(work.id)}?tab=validation` },
          ]}
        />
      </Card>
      <Tabs<TabKey>
        label="Scenario workspace"
        value={tab}
        onChange={(k) => setParams((p) => (p.set('tab', k), p), { replace: true })}
        tabs={(Object.keys(TABS) as TabKey[]).filter((k) => !(customer && CUSTOMER_HIDDEN.includes(k))).map((k) => ({ key: k, label: TABS[k].label, ...(k === 'review' ? { count: d.issues.filter((i) => i.severity !== 'minor').length } : {}) }))}
      />
      <Suspense fallback={<Loading />}>
        <Tab eng={eng} sim={work} set={set} d={d} customer={customer} saveAsNew={saveAsNew} />
      </Suspense>
      <Modal
        open={!!derive}
        onClose={() => setDerive(null)}
        title={derive?.kind === 'version' ? 'New version' : 'New scenario from this one'}
        footer={
          <>
            <Button onClick={() => setDerive(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!reason.trim()}
              onClick={() => {
                const k = derive!.kind;
                setDerive(null);
                void saveAsNew(work, reason.trim(), k === 'variant' ? String.fromCharCode(((work.scenario_label ?? 'A').charCodeAt(0) || 64) + 1) : work.scenario_label);
                setReason('');
              }}
            >
              Create
            </Button>
          </>
        }
      >
        <p className="mb-3 text-meta text-ink-2">The current scenario (including unsaved edits) is copied into a new record that points back to it. The original is never overwritten (version control §134, configuration management §143).</p>
        <Field label="Change reason (required)" htmlFor="dv-r">
          <Input id="dv-r" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. second laser station to reach 500 UPH" />
        </Field>
      </Modal>
    </div>
  );
}
