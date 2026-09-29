import type { AnyRecord } from '../../domain';
import type { ConfiguratorEngine } from '../../features/configurator/engine';
import type { CompatCtx } from '../eng/compatibility';
import type { SpecDefs } from '../eng/specs';
import type { Graph } from '../graph';
import type { Lexicon } from '../inquiry';
import { parsePartQuery } from '../eng/partSearch';
import { parseParams } from '../parametric';
import { confidence } from './confidence';
import type { PageContext } from './context';
import { findMentions, type Resolution } from './entities';
import { HANDLERS, type HandlerOut } from './handlers';
import { classifyIntent, INTENT_LABEL, type IntentResult } from './intent';
import { isOnline, type DataReadiness, type EngineState } from './registry';
import { route, type RoutePlan } from './router';
import { hybridSearch, type Bm25Fn, type HybridResult } from './retrieval/hybrid';
import type { VectorIndex } from './retrieval/lexvec';
import { fetchPassages, type Passage, type TextFetcher } from './retrieval/passages';
import { rerank, type RankedHit } from './retrieval/rerank';
import { dedupeSources } from './claims';
import { EMPTY_SECTIONS, type EngineeringAnswer, type Intent, type TraceStep } from './types';
import { verifyAnswer } from './verify';

/*
 * AI ORCHESTRATOR (AI master prompt §4, §62–§64). One call per question:
 *   intent → route plan → context / entity resolution → intent handler (agents + engines + retrieval)
 *   → compose (response contract) → engineering validator → confidence → answer with trace.
 * Everything runs locally; the plan records which gateway steps fell back and why.
 */

export interface CopilotDeps {
  records: AnyRecord[];
  byId: Map<string, AnyRecord>;
  graph: Graph;
  defs: SpecDefs;
  compat: CompatCtx;
  engine: ConfiguratorEngine | null;
  lexicon: Lexicon | null;
  bm25: Bm25Fn | null;
  vec: VectorIndex | null;
  fetchText: TextFetcher | null;
  states: EngineState[];
  readiness: DataReadiness;
  newId: (entity: string) => string;
  today?: string;
}

export interface Retrieved {
  hybrid: HybridResult | null;
  ranked: RankedHit[];
  passages: Passage[];
}

export interface HandlerCtx {
  query: string;
  ir: IntentResult;
  plan: RoutePlan;
  page: PageContext | null;
  deps: CopilotDeps;
  /** the record the question is about: a mention, else the page context */
  subject: AnyRecord | null;
  mentions: Resolution[];
  retrieve: (q?: string, opts?: { entities?: string[]; knowledge?: boolean }) => Promise<Retrieved>;
  trace: (step: string, engine: string, status: TraceStep['status'], detail: string, t0: number) => void;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export async function runCopilot(query: string, page: PageContext | null, deps: CopilotDeps, forced?: Intent): Promise<EngineeringAnswer> {
  const trace: TraceStep[] = [];
  const tr = (step: string, engine: string, status: TraceStep['status'], detail: string, t0: number) => trace.push({ step, engine, status, detail, ms: Math.round((now() - t0) * 10) / 10 });

  let t0 = now();
  const classified = classifyIntent(query);
  const ir: IntentResult = forced ? { ...classified, intent: forced, secondary: classified.secondary.filter((s) => s !== forced) } : classified;
  tr('Intent', 'local-intent', 'ok', `${INTENT_LABEL[ir.intent]}${ir.secondary.length ? ` · also ${ir.secondary.map((s) => INTENT_LABEL[s]).join(', ')}` : ''} · complexity ${ir.signals.complexity}, risk ${ir.signals.risk}`, t0);

  t0 = now();
  const plan = route(ir, deps.states);
  for (const s of plan.steps.slice(1)) if (s.status !== 'ok') trace.push({ step: `Route: ${s.role}`, engine: s.requested, status: s.status === 'fallback' ? 'fallback' : 'offline', detail: s.why, ms: 0 });
  trace.push({ step: 'Synthesis model', engine: plan.synthesis.engine ?? 'none', status: plan.synthesis.status === 'ok' ? 'ok' : 'fallback', detail: plan.synthesis.why, ms: 0 });
  tr('Route plan', 'router', 'ok', `${plan.steps.length} step(s) · cost ${plan.costClass} · latency ${plan.latencyClass}`, t0);

  t0 = now();
  const mentions = isOnline(deps.states, 'local-graph') ? findMentions(query, deps.records) : [];
  const ctxRecord = page?.id ? deps.byId.get(page.id) ?? null : null;
  const subject = mentions[0]?.record ?? (ctxRecord && (ir.signals.refersToContext || !mentions.length) ? ctxRecord : null);
  tr('Context & entities', 'local-graph', 'ok', `${mentions.length ? `mentions: ${mentions.map((m) => `${m.record.name} (${m.method})`).join(', ')}` : 'no record named'}${ctxRecord ? ` · page context: ${ctxRecord.name}${subject === ctxRecord ? ' (used)' : ''}` : ''}`, t0);

  const retrieve: HandlerCtx['retrieve'] = async (q = query, opts = {}) => {
    const r0 = now();
    const bm = isOnline(deps.states, 'local-bm25') ? deps.bm25 : null;
    const vec = isOnline(deps.states, 'local-lexvec') ? deps.vec : null;
    const hybrid = await hybridSearch(q, { bm25: bm, vec, graph: deps.graph, useGraph: isOnline(deps.states, 'local-graph') }, { entities: opts.entities, knowledge: opts.knowledge }, 40);
    tr('Hybrid retrieval', 'local-bm25 + local-lexvec + local-graph', bm || vec ? 'ok' : 'disabled', `keyword ${hybrid.legs.bm25} · vector ${hybrid.legs.vector} · graph +${hybrid.legs.graph}${hybrid.expansion.added.length ? ` · expanded with ${hybrid.expansion.added.slice(0, 5).join(', ')}` : ''}`, r0);
    const r1 = now();
    const defs = deps.defs;
    const ranked = isOnline(deps.states, 'local-reranker')
      ? rerank(q, hybrid.hits, { intent: ir.intent, graph: deps.graph, defs, parsed: parsePartQuery(q, defs), params: parseParams(q), focusId: subject?.id ?? page?.id })
      : hybrid.hits.map((h) => ({ ...h, score: h.rrf * 100, why: ['fused retrieval (reranker disabled)'] }));
    tr('Rerank', 'local-reranker', isOnline(deps.states, 'local-reranker') ? 'ok' : 'disabled', `${ranked.length} candidate(s) ordered by technical relevance`, r1);
    let passages: Passage[] = [];
    const refs = ranked.filter((h) => h.kind === 'knowledge' && h.ref).slice(0, 6).map((h) => h.ref!);
    if (refs.length && deps.fetchText) {
      const r2 = now();
      passages = await fetchPassages(refs, q, deps.fetchText);
      tr('Handbook passages', 'context builder', passages.length ? 'ok' : 'skipped', `${passages.length} passage(s) from ${refs.length} section(s)`, r2);
    }
    return { hybrid, ranked, passages };
  };

  const ctx: HandlerCtx = { query, ir, plan, page, deps, subject, mentions, retrieve, trace: tr };
  t0 = now();
  let out: HandlerOut;
  try {
    out = await HANDLERS[ir.intent](ctx);
    tr('Engines', ir.intent, 'ok', out.engineNote ?? 'done', t0);
  } catch (e) {
    tr('Engines', ir.intent, 'error', e instanceof Error ? e.message : String(e), t0);
    out = await HANDLERS.search(ctx);
  }

  const base: EngineeringAnswer = {
    query,
    intent: ir.intent,
    title: out.title,
    ...EMPTY_SECTIONS(),
    ...out.sections,
    tables: out.sections.tables ?? [],
    actions: out.sections.actions ?? [],
    conflicts: out.sections.conflicts ?? [],
    agents: out.sections.agents ?? [],
    confidence: { label: 'INSUFFICIENT DATA', signals: [], reason: '' },
    verification: { checks: [], rejected: [], reviewRequired: false },
    sources: [],
    trace,
    mode: 'local',
    draft: out.draft,
  };

  t0 = now();
  const { answer } = verifyAnswer(base, { byId: deps.byId, defs: deps.defs, constraints: out.constraints });
  tr('Engineering validator', 'verify', answer.verification.checks.some((c) => c.status === 'fail') ? 'error' : 'ok', answer.verification.checks.map((c) => `${c.check}: ${c.status}`).join(' · '), t0);
  answer.agents = [
    ...answer.agents,
    { agent: 'verification', task: 'verify answer', requirements: { intent: ir.intent }, constraints: [], candidates: answer.verification.checks, evidence: [], confidence: answer.verification.checks.some((c) => c.status === 'fail') ? 'low' : 'high', verification_required: answer.verification.reviewRequired, notes: answer.verification.rejected.map((c) => `rejected: ${c.text}`) },
  ];

  const claims = [...answer.answer, ...answer.basis, ...answer.evidence, ...answer.alternatives, ...answer.constraints, ...answer.risks];
  answer.confidence = confidence({ claims, agreement: out.agreement ?? null, coverage: out.coverage ?? null, constraints: out.constraints ?? null, modelUncertainty: out.modelUncertainty ?? null, historical: out.historical ?? null, deterministic: out.deterministic ?? null });
  answer.sources = dedupeSources([...claims, ...answer.assumptions, ...answer.gaps, ...answer.validation]);
  return answer;
}
