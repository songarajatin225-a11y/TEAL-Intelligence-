import clsx from 'clsx';
import { Activity, Cpu, Database, Download, FlaskConical, Gauge, Play, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '../../components/toast';
import { Badge, Button, Card, Notice, PageHeader, Stat, Table, Tabs, type Tone } from '../../components/ui';
import { useData } from '../../hooks/useData';
import { evaluate, type EvalReport } from '../../services/ai/evaluate';
import { aiLog, clearAiLog, resetEngineOverrides, setEngineOverride } from '../../services/ai/feedback';
import { LocalGateway } from '../../services/ai/gateway';
import { dataReadiness, type EngineState } from '../../services/ai/registry';
import type { EngineStatus, FeatureState } from '../../services/ai/types';
import type { AiLogRow } from '../../repositories/workspaceDb';
import { aiSettingsBus, useCopilotDeps } from './useCopilotDeps';

/*
 * AI ENGINE CONTROL CENTER (AI master prompt §60, §85, §96). Every engine / model with provider,
 * runtime, feature state, computed status, latency and cost class, data readiness and MLOps metadata.
 * Administrators switch local engines on or off (this browser); gateway models show OFFLINE until a
 * secure gateway exists. The evaluation runs the gold set through the real pipeline, here, on demand.
 */

const STATUS_TONE: Record<EngineStatus, Tone> = { ONLINE: 'ok', DEGRADED: 'warn', OFFLINE: 'neutral', EXPERIMENTAL: 'draft' };
const STATE_TONE: Record<FeatureState, Tone> = { LIVE: 'ok', BETA: 'accent', PROTOTYPE: 'info', 'DATA REQUIRED': 'warn', EXPERIMENTAL: 'draft', FUTURE: 'neutral' };
const pct = (x: number) => `${(x * 100).toFixed(1)} %`;

type TabKey = 'engines' | 'data' | 'evaluation' | 'usage';

export default function ControlCenterPage() {
  const deps = useCopilotDeps();
  const { records } = useData();
  const readiness = useMemo(() => dataReadiness(records), [records]);
  const [tab, setTab] = useState<TabKey>('engines');
  const [report, setReport] = useState<EvalReport | null>(null);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<AiLogRow[]>([]);
  useEffect(() => {
    void aiLog().then(setLog);
  }, [tab]);

  // running engines first, then data-gated, then the gateway models that need a server
  const ORDER: Record<string, number> = { ONLINE: 0, EXPERIMENTAL: 1, DEGRADED: 2, OFFLINE: 3 };
  const states = [...(deps?.states ?? [])].sort((a, b) => ORDER[a.status] - ORDER[b.status] || Number(a.model.runtime === 'gateway') - Number(b.model.runtime === 'gateway') || Number(!!b.data) - Number(!!a.data));
  const toggle = async (s: EngineState) => {
    await setEngineOverride(s.model.id, !s.enabled);
    aiSettingsBus.emit();
    toast(`${s.model.label} ${s.enabled ? 'disabled' : 'enabled'} in this browser`, { tone: 'info' });
  };
  const run = async () => {
    if (!deps) return;
    setRunning(true);
    try {
      setReport(await evaluate(deps));
    } finally {
      setRunning(false);
    }
  };
  const online = states.filter((s) => s.status === 'ONLINE').length;
  const byIntent = log.reduce<Record<string, number>>((a, r) => ((a[r.intent] = (a[r.intent] ?? 0) + 1), a), {});
  const fb = log.filter((r) => r.kind === 'feedback');

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Admin" title="AI Engine Control Center" subtitle="Models and engines, status, data readiness, evaluation and usage — nothing here is a claim of capability that the platform does not have." />
      <Notice tone="info">
        <b>AI gateway:</b> {LocalGateway.describe()} Language, embedding and vision models are listed with provider “Not configured” and stay OFFLINE until a secure server-side gateway is connected (docs/ai/AI_API_SPEC.md). Every Copilot answer falls back to the local engines and says so.
      </Notice>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Engines online" value={`${online} / ${states.length}`} icon={Cpu} />
        <Stat label="Gateway models" value="OFFLINE" sub="no provider keys in this site" icon={ShieldCheck} />
        <Stat label="Copilot questions (this browser)" value={log.filter((r) => r.kind === 'interaction').length} icon={Activity} />
        <Stat label="Feedback given" value={fb.length} sub={fb.length ? `${fb.filter((f) => f.feedback === 'correct').length} correct · ${fb.filter((f) => f.feedback === 'incorrect').length} incorrect` : undefined} icon={Gauge} />
      </div>
      <Tabs<TabKey>
        label="Control center sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'engines', label: 'Engines & models', count: states.length },
          { key: 'data', label: 'Data readiness' },
          { key: 'evaluation', label: 'Evaluation' },
          { key: 'usage', label: 'Usage & feedback', count: log.length },
        ]}
      />
      {tab === 'engines' && (
        <Card
          title="Model registry"
          icon={Cpu}
          description="Status = admin switch × runtime × data readiness. Local switches apply to this browser."
          actions={
            <Button size="sm" onClick={async () => (await resetEngineOverrides(), aiSettingsBus.emit(), toast('Engine switches reset', { tone: 'info' }))}>
              <RotateCcw className="size-3.5" aria-hidden /> Reset switches
            </Button>
          }
        >
          <Table dense head={['Engine / model', 'Category', 'Provider · model', 'Runtime', 'State', 'Status', 'Latency · cost', 'Fallback', 'Enabled']}>
            {states.map((s) => (
              <tr key={s.model.id}>
                <td>
                  <div className="font-medium">{s.model.label}</div>
                  <div className="text-micro text-ink-3">{s.model.description}</div>
                  {s.model.mlops && (
                    <details className="text-micro text-ink-3">
                      <summary className="cursor-pointer">MLOps</summary>
                      version {s.model.mlops.version} · status {s.model.mlops.status} · owner {s.model.mlops.owner} · training data {s.model.mlops.trainingDataset ?? 'none'} · metrics {s.model.mlops.metrics ? JSON.stringify(s.model.mlops.metrics) : 'none (not trained)'}
                      {s.model.mlops.features.length > 0 && ` · features: ${s.model.mlops.features.join(', ')}`}
                      {s.model.implementation && ` · ${s.model.implementation}`}
                    </details>
                  )}
                </td>
                <td className="whitespace-nowrap">{s.model.category}</td>
                <td>
                  {s.model.provider}
                  <div className="text-micro text-ink-3">{s.model.modelName}</div>
                </td>
                <td>{s.model.runtime === 'gateway' ? 'AI gateway' : 'In browser'}</td>
                <td>
                  <Badge tone={STATE_TONE[s.model.featureState]}>{s.model.featureState}</Badge>
                </td>
                <td>
                  <Badge tone={STATUS_TONE[s.status]} title={s.reason}>
                    {s.status}
                  </Badge>
                  <div className="text-micro text-ink-3">{s.reason}</div>
                </td>
                <td className="whitespace-nowrap">
                  {s.model.latencyClass} · {s.model.costClass}
                </td>
                <td className="text-micro">{s.model.fallbackModel ?? '—'}</td>
                <td>
                  {s.model.runtime === 'local' && s.model.featureState !== 'FUTURE' && !s.data ? (
                    <button type="button" role="switch" aria-checked={s.enabled} aria-label={`${s.model.label} enabled`} onClick={() => void toggle(s)} className={clsx('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', s.enabled ? 'bg-accent' : 'bg-ink/20')}>
                      <span className={clsx('inline-block size-4 rounded-full bg-white shadow transition-transform', s.enabled ? 'translate-x-4' : 'translate-x-0.5')} />
                    </button>
                  ) : (
                    <span className="text-micro text-ink-3">{s.model.runtime === 'gateway' ? 'needs gateway' : s.data ? 'needs data' : '—'}</span>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
      {tab === 'data' && (
        <Card title="Data readiness" icon={Database} description="Counted from the records — the ML engines activate only when real, validated data reaches these thresholds. Synthetic, simulated or AI-generated data never counts.">
          <Table dense head={['Data asset', 'Available', 'Used by']}>
            {(
              [
                ['Measured runs on the best DOE', readiness.doeMeasuredRuns, 'Bayesian optimisation (≥ 5)'],
                ['Measured experiment results (all DOEs, non-DEMO)', readiness.experimentResults, 'Process quality prediction (≥ 30)'],
                ['Dated quotations on non-DEMO parts', readiness.quotations, 'Cost estimation (≥ 20)'],
                ['Purchase-order history', readiness.poHistory, 'Lead-time prediction, demand forecasting (≥ 200) — no entity yet'],
                ['Machine telemetry rows', readiness.telemetry, 'Anomaly detection / predictive maintenance — no entity yet'],
                ['Labelled inspection images', readiness.labelledImages, 'Vision models — no entity yet'],
                ['Verification records with a result', readiness.verifiedOutcomes, 'Confidence engine (historical validation)'],
                ['Compatibility facts (rules + relationships)', readiness.graphFacts, 'Graph ML (≥ 1 000)'],
              ] as [string, number, string][]
            ).map(([k, v, u]) => (
              <tr key={k}>
                <td>{k}</td>
                <td className="num">{v}</td>
                <td className="text-ink-3">{u}</td>
              </tr>
            ))}
          </Table>
          <p className="mt-2 text-micro text-ink-3">Provenance classes for any future dataset: REAL · SIMULATED · SYNTHETIC · AI_GENERATED — never mixed silently (docs/ai/AI_DATA_MODEL.md).</p>
        </Card>
      )}
      {tab === 'evaluation' && (
        <Card
          title="AI evaluation"
          icon={FlaskConical}
          description="Runs the hand-labelled gold set through the real pipeline in this browser (intent engine, hybrid retrieval, reranker, answer validator)."
          actions={
            <Button variant="primary" size="sm" onClick={() => void run()} disabled={!deps || running}>
              <Play className="size-3.5" aria-hidden /> {running ? 'Running…' : 'Run evaluation'}
            </Button>
          }
        >
          {!report ? (
            <p className="text-meta text-ink-3">Not run yet in this session.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Stat label="Intent accuracy" value={pct(report.classification.accuracy)} sub={`macro F1 ${report.classification.macroF1.toFixed(2)}`} />
                <Stat label={`Recall@${report.k}`} value={pct(report.retrieval.recallAtK)} sub={`MRR ${report.retrieval.mrr.toFixed(2)} · NDCG ${report.retrieval.ndcgAtK.toFixed(2)}`} />
                <Stat label="Groundedness" value={pct(report.answers.groundedness)} sub={`citation accuracy ${pct(report.answers.citationAccuracy)}`} />
                <Stat label="Hallucination rate" value={pct(report.answers.hallucinationRate)} sub={`answer relevance ${pct(report.answers.answerRelevance)}`} tone={report.answers.hallucinationRate > 0 ? 'bad' : 'ok'} />
              </div>
              <Notice tone="warn">The gold set is small ({report.cases.length} cases) and the intent rules were tuned on it — treat these as regression checks, not as a measure of accuracy on new questions. Regression metrics (MAE, RMSE, R²): {report.regression}.</Notice>
              <Table dense head={['Question', 'Expected', 'Got', 'First relevant rank', 'Confidence', 'ms']}>
                {report.cases.map((c) => (
                  <tr key={c.q}>
                    <td>{c.q}</td>
                    <td>{c.expected}</td>
                    <td className={c.intentOk ? '' : 'font-semibold text-bad'}>{c.got}</td>
                    <td className="num">{c.firstRelevantRank ?? (c.recallAtK == null ? '—' : 'not found')}</td>
                    <td>{c.confidence}</td>
                    <td className="num">{c.ms}</td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </Card>
      )}
      {tab === 'usage' && (
        <Card
          title="Usage & feedback (this browser)"
          icon={Activity}
          description="Interaction log for improving prompts, retrieval and routing. Stored only here; export it to share."
          actions={
            <>
              <Button
                size="sm"
                onClick={() => {
                  const url = URL.createObjectURL(new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' }));
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `teal-ai-log-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
                disabled={!log.length}
              >
                <Download className="size-3.5" aria-hidden /> Export JSON
              </Button>
              <Button size="sm" variant="danger" disabled={!log.length} onClick={async () => (window.confirm('Delete the AI interaction and feedback log in this browser?') ? (await clearAiLog(), setLog([]), toast('AI log cleared', { tone: 'info' })) : null)}>
                <Trash2 className="size-3.5" aria-hidden /> Clear
              </Button>
            </>
          }
        >
          {!log.length ? (
            <p className="text-meta text-ink-3">No Copilot questions in this browser yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(byIntent)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => (
                    <Badge key={k}>
                      {k}: {v}
                    </Badge>
                  ))}
              </div>
              <Table dense head={['When', 'Kind', 'Question', 'Intent', 'Confidence', 'Feedback']}>
                {log.slice(0, 100).map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">{r.at.slice(0, 16).replace('T', ' ')}</td>
                    <td>{r.kind}</td>
                    <td>{r.query}</td>
                    <td>{r.intent}</td>
                    <td>{r.confidence}</td>
                    <td>{r.feedback ? `${r.feedback}${r.correction ? ` — ${r.correction}` : ''}` : '—'}</td>
                  </tr>
                ))}
              </Table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
