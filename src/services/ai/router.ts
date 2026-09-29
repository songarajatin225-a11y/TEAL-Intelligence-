import type { IntentResult } from './intent';
import { MODEL_BY_ID, type EngineState } from './registry';
import type { Intent } from './types';

/*
 * TEAL MODEL ROUTER (AI master prompt §7, §86, §87). Picks engines per intent, checks each against its
 * runtime state (admin switch, gateway, data readiness) and walks the fallback chain when one is not
 * available. Cost-aware: the large reasoning model is chosen only for high-complexity questions, and in
 * V1 every language-model step falls back to the local composer — the plan says so explicitly.
 */

export interface RouteStep {
  role: string;
  requested: string;
  engine: string | null;
  status: 'ok' | 'fallback' | 'offline';
  why: string;
}

export interface RoutePlan {
  steps: RouteStep[];
  synthesis: RouteStep;
  costClass: 'low' | 'medium' | 'high';
  latencyClass: 'low' | 'medium' | 'high';
}

const RETRIEVAL = ['local-bm25', 'local-lexvec', 'local-reranker', 'local-graph'];

/** Which engines each intent needs, in order. */
const PIPELINE: Record<Intent, { role: string; engine: string }[]> = {
  explain: [...RETRIEVAL.map((e) => ({ role: 'retrieve', engine: e }))],
  search: [...RETRIEVAL.map((e) => ({ role: 'retrieve', engine: e }))],
  find_parts: [{ role: 'parse constraints', engine: 'local-units' }, { role: 'filter by constraints', engine: 'local-rules' }, ...RETRIEVAL.map((e) => ({ role: 'retrieve', engine: e }))],
  compare: [{ role: 'resolve entities', engine: 'local-graph' }, { role: 'normalise specs', engine: 'local-units' }, ...RETRIEVAL.map((e) => ({ role: 'retrieve', engine: e }))],
  alternatives: [{ role: 'resolve entity', engine: 'local-graph' }, { role: 'constraint filter + compatibility', engine: 'local-rules' }, { role: 'rank', engine: 'local-reranker' }],
  compatibility: [{ role: 'resolve entities', engine: 'local-graph' }, { role: 'rules + recorded relationships', engine: 'local-rules' }],
  configure: [{ role: 'extract requirements', engine: 'local-requirements' }, { role: 'configure', engine: 'local-configurator' }, { role: 'compatibility', engine: 'local-rules' }, { role: 'retrieve evidence', engine: 'local-bm25' }],
  laser_selection: [{ role: 'extract requirements', engine: 'local-requirements' }, { role: 'candidate technologies', engine: 'local-configurator' }, { role: 'multi-hop evidence', engine: 'local-graph' }, { role: 'retrieve evidence', engine: 'local-bm25' }],
  bom: [{ role: 'extract requirements', engine: 'local-requirements' }, { role: 'architecture + BOM', engine: 'local-configurator' }],
  cost: [{ role: 'extract requirements', engine: 'local-requirements' }, { role: 'BOM + known costs', engine: 'local-configurator' }],
  supplier: [{ role: 'controlled query', engine: 'local-graph' }, ...RETRIEVAL.map((e) => ({ role: 'retrieve', engine: e }))],
  supply_risk: [{ role: 'dependency + localization', engine: 'local-graph' }, { role: 'alternatives', engine: 'local-rules' }],
  change_impact: [{ role: 'resolve entities', engine: 'local-graph' }, { role: 'dependency traversal', engine: 'local-graph' }, { role: 'compatibility re-check', engine: 'local-rules' }],
  rfq: [{ role: 'extract requirements', engine: 'local-requirements' }, { role: 'configure', engine: 'local-configurator' }],
  urs: [{ role: 'extract requirements', engine: 'local-requirements' }],
  fmea: [{ role: 'extract requirements', engine: 'local-requirements' }, { role: 'architecture', engine: 'local-configurator' }],
  traceability: [{ role: 'trace chain', engine: 'local-graph' }],
  project_status: [{ role: 'gaps + next actions', engine: 'local-graph' }],
  calculate: [{ role: 'calculate', engine: 'local-units' }],
  cycle_time: [{ role: 'capacity model', engine: 'local-sim' }],
  doe: [{ role: 'experiment plan', engine: 'local-doe' }],
  optimize_process: [{ role: 'surrogate + acquisition', engine: 'local-bayesopt' }],
  predict: [{ role: 'quality model', engine: 'ml-process-quality' }, { role: 'retrieve evidence', engine: 'local-bm25' }],
  forecast: [{ role: 'forecast model', engine: 'ml-forecast' }],
  maintenance: [{ role: 'anomaly model', engine: 'ml-anomaly' }, { role: 'retrieve troubleshooting', engine: 'local-bm25' }],
  vision: [{ role: 'vision model', engine: 'gw-vision' }, { role: 'retrieve evidence', engine: 'local-bm25' }],
  open_3d: [{ role: 'find scenario / template', engine: 'local-sim' }],
};

function resolve(states: EngineState[], id: string, role: string, why: string): RouteStep {
  const byId = new Map(states.map((s) => [s.model.id, s]));
  let cur: string | undefined = id;
  const seen = new Set<string>();
  const chain: string[] = [];
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const st = byId.get(cur);
    if (st?.status === 'ONLINE') return { role, requested: id, engine: cur, status: cur === id ? 'ok' : 'fallback', why: cur === id ? why : `${MODEL_BY_ID.get(id)?.label ?? id} unavailable (${chain.join('; ')}) → ${st.model.label}` };
    chain.push(`${MODEL_BY_ID.get(cur)?.label ?? cur}: ${st?.reason ?? 'unknown engine'}`);
    cur = MODEL_BY_ID.get(cur)?.fallbackModel;
  }
  return { role, requested: id, engine: null, status: 'offline', why: chain.join('; ') };
}

const rank = { low: 0, medium: 1, high: 2 } as const;
const worst = (xs: ('low' | 'medium' | 'high')[]) => (['low', 'medium', 'high'] as const)[Math.max(0, ...xs.map((x) => rank[x]))];

export function route(ir: IntentResult, states: EngineState[]): RoutePlan {
  const seen = new Set<string>();
  const steps: RouteStep[] = [{ role: 'classify intent', requested: 'local-intent', engine: 'local-intent', status: 'ok', why: `intent “${ir.intent}”${ir.secondary.length ? ` (also: ${ir.secondary.join(', ')})` : ''}` }];
  for (const s of PIPELINE[ir.intent]) {
    const key = `${s.role}|${s.engine}`;
    if (seen.has(key)) continue;
    seen.add(key);
    steps.push(resolve(states, s.engine, s.role, s.role));
  }
  // synthesis: reasoning model only when the question is complex; otherwise the fast model — both fall back to the composer
  const wanted = ir.signals.complexity === 'high' || ir.signals.risk === 'high' ? 'gw-reasoning' : 'gw-fast';
  const synthesis = resolve(states, wanted, 'synthesise answer', `${ir.signals.complexity} complexity, ${ir.signals.risk} risk`);
  if (!synthesis.engine) {
    const composer = resolve(states, 'local-composer', 'synthesise answer', 'template composer');
    synthesis.engine = composer.engine;
    synthesis.status = composer.engine ? 'fallback' : 'offline';
    synthesis.why = `${synthesis.why} → local answer composer (no language model; every sentence from a record, engine or handbook passage)`;
  }
  const used = [...steps, synthesis].map((s) => (s.engine ? MODEL_BY_ID.get(s.engine) : undefined)).filter((m): m is NonNullable<typeof m> => !!m);
  return { steps, synthesis, costClass: worst(used.map((m) => m.costClass)), latencyClass: worst(used.map((m) => m.latencyClass)) };
}
