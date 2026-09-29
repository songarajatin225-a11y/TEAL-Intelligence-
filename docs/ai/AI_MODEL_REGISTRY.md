# AI Model Registry

Source of truth: [`src/services/ai/registry.ts`](../../src/services/ai/registry.ts). Live view:
**Admin → AI Engine Control Center** (`/ai-engine`).

## Contract

```typescript
interface AIModel {
  id: string;
  label: string;
  provider: string;            // "Not configured" for every gateway model in V1
  modelName: string;
  category: 'reasoning' | 'fast-llm' | 'embedding' | 'reranker' | 'retrieval' | 'vision' | 'vision-language'
          | 'ocr' | 'classification' | 'regression' | 'forecasting' | 'anomaly' | 'graph' | 'rules'
          | 'calculation' | 'optimization' | 'simulation' | 'generation';
  capabilities: string[];
  latencyClass: 'low' | 'medium' | 'high';
  costClass: 'low' | 'medium' | 'high';
  enabled: boolean;            // default; an administrator can override it (this browser)
  fallbackModel?: string;
  runtime: 'local' | 'gateway';
  featureState: 'LIVE' | 'BETA' | 'PROTOTYPE' | 'DATA REQUIRED' | 'EXPERIMENTAL' | 'FUTURE';
  description: string;
  implementation?: string;     // file in this repository
  mlops?: { version; trainingDataset; trainingDate; features; metrics; validationDataset; owner; deploymentDate;
            status: 'Development' | 'Testing' | 'Approved' | 'Production' | 'Deprecated' };
  dataRequirement?: { description; needed; unit; key: keyof DataReadiness };
}
```

## Status is computed, never declared

`engineStates(readiness, overrides)`:

| Condition | Status | Reason shown |
|---|---|---|
| `runtime: gateway` | OFFLINE | No AI gateway configured — provider keys live only on a server |
| data requirement not met | OFFLINE | `Data required: <have> of <need> <unit>` (counted from records) |
| `featureState: FUTURE` | OFFLINE | Not built yet |
| disabled by administrator | OFFLINE | Disabled in this browser |
| `EXPERIMENTAL` | EXPERIMENTAL | — |
| otherwise | ONLINE | Running in this browser |

## Registered engines (V1)

| Id | Engine | Category | Runtime | State | Fallback |
|---|---|---|---|---|---|
| `gw-reasoning` | Reasoning LLM | reasoning | gateway | FUTURE | `gw-fast` |
| `gw-fast` | Fast LLM | fast-llm | gateway | FUTURE | `local-composer` |
| `gw-embedding` | Neural embedding model | embedding | gateway | FUTURE | `local-lexvec` |
| `gw-cross-encoder` | Cross-encoder reranker | reranker | gateway | FUTURE | `local-reranker` |
| `gw-vision` | Vision service | vision | gateway | FUTURE · DATA REQUIRED | — |
| `gw-vlm` | Vision-language model | vision-language | gateway | FUTURE | — |
| `gw-ocr` | Document OCR / parser | ocr | gateway | FUTURE | `local-requirements` |
| `local-composer` | Local answer composer | generation | local | LIVE | — |
| `local-intent` | Intent engine | classification | local | BETA | — |
| `local-bm25` | BM25 keyword search (MiniSearch) | retrieval | local | LIVE | — |
| `local-lexvec` | Lexical vector index (hashed TF-IDF, **not neural**) | embedding | local | BETA | `local-bm25` |
| `local-reranker` | Technical feature reranker | reranker | local | BETA | — |
| `local-graph` | Knowledge graph + GraphRAG | graph | local | BETA | — |
| `local-rules` | Engineering rules & constraints | rules | local | LIVE | — |
| `local-units` | Unit-aware calculator | calculation | local | LIVE | — |
| `local-requirements` | Requirement extractor | classification | local | BETA | — |
| `local-configurator` | Product configurator | rules | local | BETA | — |
| `local-sim` | Capacity, DES, Monte Carlo, Pareto | simulation | local | LIVE | — |
| `local-doe` | DOE designer | optimization | local | BETA | — |
| `local-bayesopt` | Bayesian optimisation (GP + EI) | optimization | local | DATA REQUIRED (≥ 5 measured runs) | — |
| `ml-process-quality` | Process quality prediction | regression | local | DATA REQUIRED (≥ 30 validated results) | `local-doe` |
| `ml-leadtime` | Lead-time prediction (quantile) | regression | local | DATA REQUIRED (≥ 200 POs) | — |
| `ml-cost` | Cost estimation | regression | local | DATA REQUIRED (≥ 20 non-DEMO quotes) | — |
| `ml-anomaly` | Telemetry anomaly detection | anomaly | local | DATA REQUIRED (≥ 10 000 rows) | — |
| `ml-forecast` | Demand forecasting | forecasting | local | DATA REQUIRED (≥ 200 POs) | — |
| `ml-gnn` | Graph ML (substitution) | graph | local | FUTURE | — |

No model name of any vendor is hard-coded. When a gateway is configured, its server maps
`gw-*` ids to provider models; the frontend never learns the provider key.

## Model selection rule (§96)

A gateway or ML model enters the registry as `Development`, and moves to `Testing` →
`Approved` → `Production` only after:

1. the task, input/output and accuracy requirement are written down;
2. candidates are benchmarked on the gold set / held-out data ([AI_EVALUATION.md](AI_EVALUATION.md));
3. cost, latency, deployment complexity and data requirement are recorded;
4. the metrics are stored in `mlops.metrics` with the validation dataset id.

Rollback = set the previous version back to `Production` and the failed one to `Deprecated`;
the router reads status at request time.

## Cost-aware routing (§86)

The router asks for `gw-reasoning` only when complexity or risk is high, otherwise `gw-fast`;
retrieval and engineering steps always use local engines. See
[`router.ts`](../../src/services/ai/router.ts).
