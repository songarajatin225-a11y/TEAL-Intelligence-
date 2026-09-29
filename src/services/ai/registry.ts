import type { AnyRecord } from '../../domain';
import type { EngineStatus, FeatureState } from './types';

/*
 * MODEL / ENGINE REGISTRY (AI master prompt §6, §60, §85, §96, §97). One configurable list of every
 * engine the orchestrator can call — local deterministic engines, gateway models and ML models —
 * with MLOps metadata. Nothing here is a claim of capability: a gateway model has no provider until
 * one is configured server-side, and an ML model has no metrics until it is trained on real data.
 * Status is computed (admin switch + data readiness + runtime), never hard-coded as "ONLINE".
 */

export type ModelCategory =
  | 'reasoning'
  | 'fast-llm'
  | 'embedding'
  | 'reranker'
  | 'retrieval'
  | 'vision'
  | 'vision-language'
  | 'ocr'
  | 'classification'
  | 'regression'
  | 'forecasting'
  | 'anomaly'
  | 'graph'
  | 'rules'
  | 'calculation'
  | 'optimization'
  | 'simulation'
  | 'generation';

export type MlopsStatus = 'Development' | 'Testing' | 'Approved' | 'Production' | 'Deprecated';

export interface Mlops {
  version: string;
  trainingDataset: string | null;
  trainingDate: string | null;
  features: string[];
  metrics: Record<string, number> | null;
  validationDataset: string | null;
  owner: string;
  deploymentDate: string | null;
  status: MlopsStatus;
}

export interface DataReadiness {
  /** best DOE: runs with at least one measured response */
  doeMeasuredRuns: number;
  /** runs with measured results across all DOE records */
  experimentResults: number;
  /** dated price records on non-DEMO parts */
  quotations: number;
  /** purchase-order history rows (no entity yet) */
  poHistory: number;
  /** machine telemetry rows (no entity yet) */
  telemetry: number;
  /** labelled inspection images (no entity yet) */
  labelledImages: number;
  /** verification records with a recorded result */
  verifiedOutcomes: number;
  /** compatibility relationships + rules */
  graphFacts: number;
}

export interface AIModel {
  id: string;
  label: string;
  provider: string;
  modelName: string;
  category: ModelCategory;
  capabilities: string[];
  latencyClass: 'low' | 'medium' | 'high';
  costClass: 'low' | 'medium' | 'high';
  /** default switch — the admin can override it locally */
  enabled: boolean;
  fallbackModel?: string;
  runtime: 'local' | 'gateway';
  featureState: FeatureState;
  description: string;
  /** where the engine is implemented in this repository */
  implementation?: string;
  mlops?: Mlops;
  /** DATA REQUIRED engines: what activates them */
  dataRequirement?: { description: string; needed: number; unit: string; key: keyof DataReadiness };
}

const LOCAL = (v: string): Mlops => ({ version: v, trainingDataset: null, trainingDate: null, features: [], metrics: null, validationDataset: null, owner: 'TEAL Intelligence platform', deploymentDate: null, status: 'Production' });
const UNTRAINED = (features: string[]): Mlops => ({ version: '0.0.0', trainingDataset: null, trainingDate: null, features, metrics: null, validationDataset: null, owner: 'Unassigned', deploymentDate: null, status: 'Development' });

export const MODEL_REGISTRY: AIModel[] = [
  /* ---------------------------------------------------------------- gateway models (not connected) */
  {
    id: 'gw-reasoning',
    label: 'Reasoning LLM',
    provider: 'Not configured',
    modelName: 'Not configured',
    category: 'reasoning',
    capabilities: ['synthesis of a verified evidence bundle', 'multi-step reasoning', 'structured output', 'tool calling'],
    latencyClass: 'high',
    costClass: 'high',
    enabled: false,
    fallbackModel: 'gw-fast',
    runtime: 'gateway',
    featureState: 'FUTURE',
    description: 'Synthesis layer for complex answers. Needs the secure AI gateway (server-side keys). Never the source of truth: it only receives evidence the validator has checked.',
  },
  {
    id: 'gw-fast',
    label: 'Fast LLM',
    provider: 'Not configured',
    modelName: 'Not configured',
    category: 'fast-llm',
    capabilities: ['short explanations', 'query rewriting', 'classification'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: false,
    fallbackModel: 'local-composer',
    runtime: 'gateway',
    featureState: 'FUTURE',
    description: 'Low-latency model for simple explanations. Falls back to the local composer.',
  },
  {
    id: 'gw-embedding',
    label: 'Neural embedding model',
    provider: 'Not configured',
    modelName: 'Not configured',
    category: 'embedding',
    capabilities: ['dense vectors for documents, parts, requirements'],
    latencyClass: 'medium',
    costClass: 'low',
    enabled: false,
    fallbackModel: 'local-lexvec',
    runtime: 'gateway',
    featureState: 'FUTURE',
    description: 'Dense semantic embeddings. Until connected, the lexical vector engine is used and labelled as lexical.',
  },
  {
    id: 'gw-cross-encoder',
    label: 'Cross-encoder reranker',
    provider: 'Not configured',
    modelName: 'Not configured',
    category: 'reranker',
    capabilities: ['query–passage relevance'],
    latencyClass: 'medium',
    costClass: 'medium',
    enabled: false,
    fallbackModel: 'local-reranker',
    runtime: 'gateway',
    featureState: 'FUTURE',
    description: 'Learned relevance model. Falls back to the technical feature reranker.',
  },
  {
    id: 'gw-vision',
    label: 'Vision service',
    provider: 'Not configured',
    modelName: 'Not configured',
    category: 'vision',
    capabilities: ['object detection', 'segmentation', 'classification', 'visual anomaly'],
    latencyClass: 'high',
    costClass: 'medium',
    enabled: false,
    runtime: 'gateway',
    featureState: 'FUTURE',
    description: 'Marking / weld / presence inspection. Needs the gateway and a labelled, approved dataset per task.',
    dataRequirement: { description: 'labelled inspection images per task', needed: 200, unit: 'images', key: 'labelledImages' },
  },
  {
    id: 'gw-vlm',
    label: 'Vision-language model',
    provider: 'Not configured',
    modelName: 'Not configured',
    category: 'vision-language',
    capabilities: ['drawing and photo understanding'],
    latencyClass: 'high',
    costClass: 'high',
    enabled: false,
    runtime: 'gateway',
    featureState: 'FUTURE',
    description: 'Multimodal reading of drawings and photos. Outputs are extraction candidates for human verification, never manufacturing instructions.',
  },
  {
    id: 'gw-ocr',
    label: 'Document OCR / parser',
    provider: 'Not configured',
    modelName: 'Not configured',
    category: 'ocr',
    capabilities: ['PDF / DOCX / XLSX text and table extraction'],
    latencyClass: 'medium',
    costClass: 'low',
    enabled: false,
    fallbackModel: 'local-requirements',
    runtime: 'gateway',
    featureState: 'FUTURE',
    description: 'Datasheet, RFQ and quotation extraction with page-level provenance. Pasted text works today through the local requirement extractor.',
  },

  /* ---------------------------------------------------------------- local deterministic engines */
  {
    id: 'local-composer',
    label: 'Local answer composer',
    provider: 'TEAL (in browser)',
    modelName: 'Template composer v1',
    category: 'generation',
    capabilities: ['response contract', 'claim classification', 'citations', 'no free text'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'LIVE',
    description: 'Builds every V1 answer from record fields, engine outputs and handbook passages. It writes no sentence without a source.',
    implementation: 'src/services/ai/compose.ts',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-intent',
    label: 'Intent engine',
    provider: 'TEAL (in browser)',
    modelName: 'Rule classifier v1',
    category: 'classification',
    capabilities: ['27 intents', 'complexity / risk / data-need signals', 'secondary intents'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'BETA',
    description: 'Weighted rules over the question plus the existing parameter, part and inquiry parsers. Measured on the gold set (AI Evaluation).',
    implementation: 'src/services/ai/intent.ts',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-bm25',
    label: 'BM25 keyword search',
    provider: 'TEAL (in browser)',
    modelName: 'MiniSearch BM25+ (build-time index)',
    category: 'retrieval',
    capabilities: ['fuzzy / prefix', 'field search', '11 partitions incl. 1 519 handbook sections'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'LIVE',
    description: 'The existing platform search, reused as the keyword leg of hybrid retrieval.',
    implementation: 'src/services/search.ts',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-lexvec',
    label: 'Lexical vector index',
    provider: 'TEAL (in browser)',
    modelName: 'Hashed TF-IDF word + character-trigram vectors (2^13 dims)',
    category: 'embedding',
    capabilities: ['cosine similarity over records', 'spelling-tolerant', 'no training'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    fallbackModel: 'local-bm25',
    runtime: 'local',
    featureState: 'BETA',
    description: 'A lexical vector space, not a neural embedding: it captures shared words and word fragments, not meaning. Labelled as such wherever it is used.',
    implementation: 'src/services/ai/retrieval/lexvec.ts',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-reranker',
    label: 'Technical reranker',
    provider: 'TEAL (in browser)',
    modelName: 'Feature reranker v1',
    category: 'reranker',
    capabilities: ['spec-constraint satisfaction', 'exact model/identifier match', 'entity prior by intent', 'trust weighting', 'graph proximity to context'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'BETA',
    description: 'Reorders fused candidates by technical relevance and states the reason for every position.',
    implementation: 'src/services/ai/retrieval/rerank.ts',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-graph',
    label: 'Knowledge graph + GraphRAG',
    provider: 'TEAL (in browser)',
    modelName: 'Digital-thread graph',
    category: 'graph',
    capabilities: ['typed nodes and relations', 'multi-hop paths', 'change-impact traversal', 'entity resolution'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'BETA',
    description: 'Every reference field becomes an edge; GraphRAG walks application → material → laser → platform → parts → manufacturer.',
    implementation: 'src/services/ai/kg.ts',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-rules',
    label: 'Engineering rules & constraints',
    provider: 'TEAL (in browser)',
    modelName: 'Compatibility + recommendation + requirement rules',
    category: 'rules',
    capabilities: ['compatibility (recorded + rule-based)', 'module conflicts', 'spec constraints', 'protocol requirements'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'LIVE',
    description: 'The existing compatibility engine and rule sets. Missing data gives Unknown with the parameter named.',
    implementation: 'src/services/eng/compatibility.ts',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-units',
    label: 'Unit-aware calculator',
    provider: 'TEAL (in browser)',
    modelName: 'Unit engine',
    category: 'calculation',
    capabilities: ['conversion', 'normalisation (raw / normalized / unit)', 'dimension checks'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'LIVE',
    description: 'Deterministic arithmetic. No language model ever does engineering arithmetic.',
    implementation: 'src/calculations/units.ts',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-requirements',
    label: 'Requirement extractor',
    provider: 'TEAL (in browser)',
    modelName: 'Inquiry lexicon + pattern extractor',
    category: 'classification',
    capabilities: ['material, process, industry, throughput, cycle time, dimensions, accuracy, budget', 'Not Defined for anything not stated'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'BETA',
    description: 'Reads pasted RFQ / inquiry text. Anything not stated stays Not Defined.',
    implementation: 'src/services/ai/agents.ts',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-configurator',
    label: 'Product configurator',
    provider: 'TEAL (in browser)',
    modelName: 'Application engine + platform matcher',
    category: 'rules',
    capabilities: ['technology candidates', 'architecture', 'preliminary BOM', 'price band', 'supplier candidates', 'data gaps'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'BETA',
    description: 'Requirement → technology → architecture → BOM → suppliers → cost → risks, reusing the configurator and application engine.',
    implementation: 'src/services/ai/configure.ts',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-sim',
    label: 'Capacity, DES, Monte Carlo, Pareto',
    provider: 'TEAL (in browser)',
    modelName: 'Simulation engines',
    category: 'simulation',
    capabilities: ['cycle time', 'bottleneck', 'discrete-event', 'P50–P99', 'Pareto frontier'],
    latencyClass: 'medium',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'LIVE',
    description: 'The existing Studio engines, used for cycle-time and counterfactual questions.',
    implementation: 'src/services/sim/*',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-doe',
    label: 'DOE designer',
    provider: 'TEAL (in browser)',
    modelName: 'Full / fractional factorial, Latin hypercube, central composite',
    category: 'optimization',
    capabilities: ['experiment plans labelled as plans', 'seeded, reproducible'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'BETA',
    description: 'Generates experiment plans. A plan is never a result.',
    implementation: 'src/services/ai/doe.ts',
    mlops: LOCAL('1.0.0'),
  },
  {
    id: 'local-bayesopt',
    label: 'Bayesian optimisation',
    provider: 'TEAL (in browser)',
    modelName: 'Gaussian process (RBF) + expected improvement',
    category: 'optimization',
    capabilities: ['next-experiment suggestion within factor bounds', 'posterior mean ± σ'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: true,
    runtime: 'local',
    featureState: 'DATA REQUIRED',
    description: 'Fits only on measured DOE runs. Below the threshold it refuses and proposes a DOE plan instead.',
    implementation: 'src/services/ai/bayesopt.ts',
    mlops: UNTRAINED(['DOE factors']),
    dataRequirement: { description: 'measured runs on one DOE', needed: 5, unit: 'runs', key: 'doeMeasuredRuns' },
  },

  /* ---------------------------------------------------------------- ML models (need real data) */
  {
    id: 'ml-process-quality',
    label: 'Process quality prediction',
    provider: 'TEAL ML (not trained)',
    modelName: 'Candidate: gradient boosting / GP regression',
    category: 'regression',
    capabilities: ['predicted quality', 'defect probability', 'process window', 'prediction interval'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: false,
    fallbackModel: 'local-doe',
    runtime: 'local',
    featureState: 'DATA REQUIRED',
    description: 'Trains only on validated TEAL experiments. Until then the Copilot answers with rules, handbook evidence and a DOE plan.',
    mlops: UNTRAINED(['material', 'thickness', 'laser type', 'power', 'wavelength', 'pulse width', 'frequency', 'spot', 'speed', 'hatch', 'focus']),
    dataRequirement: { description: 'validated experiment results for one process / material family', needed: 30, unit: 'results', key: 'experimentResults' },
  },
  {
    id: 'ml-leadtime',
    label: 'Lead-time prediction',
    provider: 'TEAL ML (not trained)',
    modelName: 'Candidate: quantile gradient boosting',
    category: 'regression',
    capabilities: ['lead-time range (P10–P90)'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: false,
    runtime: 'local',
    featureState: 'DATA REQUIRED',
    description: 'Returns ranges, not dates. Needs purchase-order history (order, promise and delivery dates).',
    mlops: UNTRAINED(['supplier', 'component', 'country', 'PO date', 'transit', 'customs']),
    dataRequirement: { description: 'purchase-order history rows', needed: 200, unit: 'POs', key: 'poHistory' },
  },
  {
    id: 'ml-cost',
    label: 'Cost estimation',
    provider: 'TEAL ML (not trained)',
    modelName: 'Candidate: regression per category',
    category: 'regression',
    capabilities: ['cost range per component category'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: false,
    runtime: 'local',
    featureState: 'DATA REQUIRED',
    description: 'Needs dated, non-DEMO quotations. DEMO prices are never used for training.',
    mlops: UNTRAINED(['category', 'key specs', 'quantity', 'date', 'supplier country']),
    dataRequirement: { description: 'dated quotations on non-DEMO parts', needed: 20, unit: 'quotes', key: 'quotations' },
  },
  {
    id: 'ml-anomaly',
    label: 'Telemetry anomaly detection',
    provider: 'TEAL ML (not trained)',
    modelName: 'Candidate: isolation forest / SPC baselines',
    category: 'anomaly',
    capabilities: ['machine health', 'subsystem anomaly score'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: false,
    runtime: 'local',
    featureState: 'DATA REQUIRED',
    description: 'Needs machine telemetry. Predictive-maintenance claims activate only after validation on real machines.',
    mlops: UNTRAINED(['laser power', 'temperature', 'vibration', 'servo current', 'cycle time', 'chiller', 'vacuum', 'alarms']),
    dataRequirement: { description: 'telemetry rows from installed machines', needed: 10000, unit: 'rows', key: 'telemetry' },
  },
  {
    id: 'ml-forecast',
    label: 'Demand forecasting',
    provider: 'TEAL ML (not trained)',
    modelName: 'Candidate: seasonal naive → ETS → gradient boosting (benchmarked)',
    category: 'forecasting',
    capabilities: ['forecast with prediction range'],
    latencyClass: 'low',
    costClass: 'low',
    enabled: false,
    runtime: 'local',
    featureState: 'DATA REQUIRED',
    description: 'Benchmarked against a simple baseline first; deep models only if they beat it.',
    mlops: UNTRAINED(['period', 'component', 'consumption']),
    dataRequirement: { description: 'purchase-order history rows', needed: 200, unit: 'POs', key: 'poHistory' },
  },
  {
    id: 'ml-gnn',
    label: 'Graph ML (substitution / compatibility)',
    provider: 'TEAL ML (not trained)',
    modelName: 'Candidate: GNN link prediction',
    category: 'graph',
    capabilities: ['substitution prediction', 'supply-chain propagation'],
    latencyClass: 'medium',
    costClass: 'low',
    enabled: false,
    runtime: 'local',
    featureState: 'FUTURE',
    description: 'Not trained until the structured graph holds enough verified compatibility facts.',
    mlops: UNTRAINED(['graph structure', 'spec vectors']),
    dataRequirement: { description: 'verified compatibility facts', needed: 1000, unit: 'facts', key: 'graphFacts' },
  },
];

export const MODEL_BY_ID = new Map(MODEL_REGISTRY.map((m) => [m.id, m]));

/** Count what real data exists for the DATA REQUIRED engines. */
export function dataReadiness(records: AnyRecord[]): DataReadiness {
  let doeMeasuredRuns = 0;
  let experimentResults = 0;
  let quotations = 0;
  let verifiedOutcomes = 0;
  let graphFacts = 0;
  for (const r of records) {
    const x = r as AnyRecord & Record<string, unknown>;
    if (r.entity === 'doe' && r.data_type !== 'DEMO') {
      const runs = (x.runs as { results?: Record<string, unknown> }[] | undefined) ?? [];
      const measured = runs.filter((run) => Object.values(run.results ?? {}).some((v) => typeof v === 'number')).length;
      experimentResults += measured;
      doeMeasuredRuns = Math.max(doeMeasuredRuns, measured);
    }
    if (r.entity === 'part' && r.data_type !== 'DEMO') quotations += ((x.prices as { date?: string }[] | undefined) ?? []).filter((p) => !!p.date).length;
    if (r.entity === 'verification' && x.result != null && r.data_type !== 'DEMO') verifiedOutcomes++;
    if (r.entity === 'compatibility' || r.entity === 'compatibility_rule') graphFacts++;
  }
  return { doeMeasuredRuns, experimentResults, quotations, poHistory: 0, telemetry: 0, labelledImages: 0, verifiedOutcomes, graphFacts };
}

export interface EngineState {
  model: AIModel;
  enabled: boolean;
  status: EngineStatus;
  reason: string;
  /** DATA REQUIRED: have / need */
  data?: { have: number; need: number; unit: string; description: string };
}

/** Runtime state of every engine: admin switch × runtime × data readiness. */
export function engineStates(readiness: DataReadiness, overrides: Record<string, boolean> = {}): EngineState[] {
  return MODEL_REGISTRY.map((model) => {
    const enabled = overrides[model.id] ?? model.enabled;
    const data = model.dataRequirement ? { have: readiness[model.dataRequirement.key], need: model.dataRequirement.needed, unit: model.dataRequirement.unit, description: model.dataRequirement.description } : undefined;
    if (model.runtime === 'gateway') return { model, enabled: false, status: 'OFFLINE' as const, reason: 'No AI gateway configured — provider keys live only on a server, never in this site', data };
    if (data && data.have < data.need) return { model, enabled: false, status: 'OFFLINE' as const, reason: `Data required: ${data.have} of ${data.need} ${data.unit} (${data.description})`, data };
    if (model.featureState === 'FUTURE') return { model, enabled: false, status: 'OFFLINE' as const, reason: 'Not built yet', data };
    if (!enabled) return { model, enabled, status: 'OFFLINE' as const, reason: 'Disabled in this browser by an administrator', data };
    if (model.featureState === 'EXPERIMENTAL') return { model, enabled, status: 'EXPERIMENTAL' as const, reason: 'Experimental', data };
    return { model, enabled, status: 'ONLINE' as const, reason: 'Running in this browser', data };
  });
}

export const isOnline = (states: EngineState[], id: string) => states.find((s) => s.model.id === id)?.status === 'ONLINE';
