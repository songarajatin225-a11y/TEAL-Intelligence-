# AI API Specification

Two layers:

1. **In-process API** (implemented, V1) — the TypeScript contracts the UI calls.
2. **AI gateway HTTP API** (specified, FUTURE) — what a private deployment implements on a
   server so that language, embedding, reranking and vision models can be used **without any
   provider key in the frontend**.

## 1. In-process API (V1)

| Function | File | Purpose |
|---|---|---|
| `runCopilot(query, pageContext, deps, forcedIntent?) → EngineeringAnswer` | `orchestrator.ts` | The whole pipeline: intent → route → context → handler → validator → confidence |
| `classifyIntent(query) → IntentResult` | `intent.ts` | Intent, secondary intents, routing signals |
| `route(intentResult, engineStates) → RoutePlan` | `router.ts` | Engines per step, fallbacks, synthesis model |
| `hybridSearch(query, deps, filters, limit) → HybridResult` | `retrieval/hybrid.ts` | BM25 + lexical vectors + graph, RRF fusion |
| `rerank(query, hits, ctx) → RankedHit[]` | `retrieval/rerank.ts` | Technical reranking with reasons |
| `fetchPassages(refs, query, fetchText) → Passage[]` | `retrieval/passages.ts` | Handbook passages for citation |
| `graphPaths(graph, seeds, targetClasses, opts) → KgPath[]` | `kg.ts` | GraphRAG multi-hop paths |
| `changeImpact(fromId, toId, graph, records, compat, defs)` | `kg.ts` | Change impact by engineering domain |
| `resolveName / findMentions / closestByName` | `entities.ts` | Entity resolution |
| `compileQuery / validate / runQuery` | `nlq.ts` | Natural language → whitelisted filter → rows |
| `extractRequirements / laserCandidates / componentCandidates / matchTemplates` | `agents.ts` | Typed agents |
| `configure(text, deps) → ConfigureResult` | `configure.ts` | Configurator pipeline |
| `rfqDraft / ursDraft / fmeaDraft` | `drafts.ts` | Editable drafts with the review banner |
| `design(kind, factors) / suggestNext(factors, obs, goal)` | `doe.ts`, `bayesopt.ts` | DOE plans, Bayesian optimisation |
| `verifyAnswer(answer, deps)` | `verify.ts` | Engineering validator |
| `confidence(inputs)` | `confidence.ts` | Confidence label from signals |
| `evaluate(deps, gold?, k?) → EvalReport` | `evaluate.ts` | Evaluation harness |
| `recordFeedback / recordDecision / aiLog` | `feedback.ts` | Local feedback log; decisions as `decision` drafts |

### Response contract — `EngineeringAnswer`

```text
query · intent · title
answer[] · basis[] · evidence[] · alternatives[] · constraints[] · risks[] · assumptions[] · gaps[] · validation[]
  each item: Claim { text, cls: VERIFIED|INFERRED|ESTIMATED|ASSUMED|UNKNOWN|CONFLICTING, sources: SourceRef[], values? }
tables[] · actions[] · conflicts[] (SPECIFICATION CONFLICT: subject, field, values with sources)
confidence { label: HIGH|MEDIUM|LOW|INSUFFICIENT DATA, signals[], reason }
verification { checks[sources|database|units|constraints|conflicts|review], rejected[], reviewRequired }
sources[] (de-duplicated) · trace[] · agents[] (structured AgentMessage) · mode: 'local'|'gateway' · draft?
```

### Agent contract — `AgentMessage` (§65)

```json
{ "agent": "laser", "task": "technology candidates",
  "requirements": { "process": "Marking", "material": "Aluminium" },
  "constraints": [], "candidates": ["Fiber MOPA", "Fiber (Q-switched)"],
  "evidence": [{ "kind": "record", "id": "app-markit.cell", "label": "Cell & can marking" }],
  "confidence": "medium", "verification_required": true, "notes": ["…"] }
```

## 2. AI gateway HTTP API (FUTURE — private deployment only)

```text
Frontend (static)  ──HTTPS + session token──►  AI gateway (org server, holds provider keys)  ──►  providers
                                                        │
                                                        ├── RBAC, audit log, rate limit, input/file validation
                                                        └── vector store / graph store (optional)
```

The frontend `AIGateway` interface (`gateway.ts`) is implemented by a `RemoteGateway` that calls:

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/v1/models` | — | registry entries the server has configured (`id`, `status`, `provider`, `modelName`, latency / cost) |
| `POST` | `/v1/complete` | `{ task, model, query, evidence: [{ source, text }], schema, maxTokens }` | `{ model, provider, output (must match schema), usage, latencyMs }` |
| `POST` | `/v1/embed` | `{ model, texts[] }` | `{ vectors: number[][], dims }` |
| `POST` | `/v1/rerank` | `{ model, query, passages[] }` | `{ scores[] }` |
| `POST` | `/v1/extract` | multipart file (PDF/DOCX/XLSX) | `{ fields: [{ field, value, page, section, confidence }] }` — candidates for human verification |
| `POST` | `/v1/vision` | `{ model, task, image }` | `{ result, regions, score }` |
| `POST` | `/v1/feedback` | interaction / feedback rows | `204` |

Rules the gateway must enforce:

* provider keys only in server environment variables / secret store — never returned;
* authentication + RBAC; every call audit-logged (user, model, tokens, sources);
* `complete` answers are rejected unless they validate against `schema`; the frontend still runs
  `verifyAnswer` on them — the gateway is not trusted to be right;
* evidence text is wrapped as data (delimited, labelled); instructions inside retrieved documents
  are never executed (prompt-injection defence);
* uploads: type/size allow-list, malware scan, no execution; extracted values are stored as
  `INFERRED` + `DRAFT` until an engineer verifies them;
* rate limits per user; fallback responses carry `mode: 'gateway'` and the model id actually used.

Until such a server exists, the public site keeps `LocalGateway`, which reports every capability as
unavailable (`available() === false`) and throws `GatewayUnavailable` on `complete`.
