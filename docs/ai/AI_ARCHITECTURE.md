# TEAL Intelligence — AI Architecture

> **Status of this document:** architecture of record for the AI layer. Every capability below
> carries an honest feature state (LIVE · BETA · PROTOTYPE · DATA REQUIRED · EXPERIMENTAL · FUTURE).
> Nothing marked DATA REQUIRED or FUTURE is presented in the product as working.

The AI layer is an **intelligence layer on top of the existing platform**. It does not replace
any page, dataset, route or engine. If every AI engine is switched off (AI Engine Control
Center → disable), every existing page keeps working exactly as before.

**Principle:** PRESERVE → INTEGRATE → VALIDATE → IMPROVE.

---

## 1. Audit of the existing platform (before any AI change)

### 1.1 What exists

| Area | Finding |
|---|---|
| Deployment | Static GitHub Pages build (Vite 7, React 19, TypeScript strict, Tailwind 4). HashRouter. No backend, no server-side secrets, no authentication server. PWA service worker. |
| Routes | ~110 page routes + ~70 aliases (`src/app/App.tsx`), every page lazy-loaded. |
| Data | 53 versioned JSON datasets, 1 224 records (`/data`, validated by Zod in CI). Every record carries `data_type` (TEAL_INTERNAL · PUBLIC · EXTERNAL · DEMO · CALCULATED · INFERRED · AI_GENERATED · USER_CREATED) and `provenance.verification_status`. |
| Knowledge | Three TEAL handbooks as Markdown (`knowledge/handbooks/**`, 140 files, 1 519 indexed sections), 177 formulas, 136 evidence records, 15 standards. |
| Local workspace | IndexedDB (Dexie): drafts, change log, recents, saved searches, prefs. Drafts reach GitHub only as a reviewed change package → PR. |
| Search | Build-time partitioned MiniSearch indexes (BM25+ scoring, fuzzy/prefix, field search) — 11 partitions, 2 303 docs. Runtime indexing of local drafts. |
| Graph | Digital-thread graph built from every `*_id` / `*_ids` reference + provenance (`src/services/graph.ts`). |
| Deterministic engines | Units & normalisation (`calculations/units.ts`), spec normalisation + conflicts (`services/eng/specs.ts`, `dataReview.ts`), NL technical part search (`eng/partSearch.ts`), parametric search (`services/parametric.ts`), compatibility rules engine — 19 active rules + recorded relationships (`eng/compatibility.ts`), inquiry parsing + platform matching + draft package (`services/inquiry.ts`), application engine / configurator (`services/solution.ts`, `features/configurator/engine.ts`), BOM + multi-currency cost (`sim/bom.ts`, `bomGen.ts`), supplier dependency, alternatives, localization, disruption (`sim/supply.ts`), capacity, DES, Monte Carlo, what-if, Pareto optimisation, energy, maintenance (`services/sim/*`), design review, requirement quality + traceability, gap engine, duplicate detection, 3D machine digital twin (`services/twin/*`). |
| Existing "AI" | *Ask Intelligence* (`/ask`) — retrieval answer from search + graph + gap engine, no model. *AI Context* (`/ai`) — provenance-labelled context + prompt library to paste into an external assistant. Both explicitly say no model is connected. |
| Security | No keys in the repo; CI secret scan; LOCAL WORKSPACE LOCK labelled as not authentication; no third-party requests from the frontend. |

### 1.2 Reusable building blocks for AI

Search (BM25), graph, gap engine, unit engine, spec reader, part search, parametric parser,
inquiry parser, compatibility engine, BOM/cost, supply engines, DES/Monte Carlo/Pareto,
design review, traceability, twin. **The AI layer orchestrates these; it re-implements none.**

### 1.3 Technical debt and limitations

* No backend → no server-side model calls, no shared vector store, no multi-user audit log.
* No neural embedding model; no cross-encoder; no LLM.
* Search index stores no section text (only ids/names) → passages must be fetched per section.
* Most engineering part/supplier/price data is **DEMO**; very few validated experiments;
  **no machine telemetry, no PO history, no labelled images**.
* Workspace data lives in one browser; decisions are durable only once exported to GitHub.

### 1.4 AI integration points

1. Every record page (context = the record and its thread).
2. Studio scenario pages (context = the scenario, its selections and results).
3. Engineering database parts (alternatives, compatibility, change impact).
4. Inquiry / requirement capture (requirement extraction → configuration).
5. Search (hybrid retrieval behind the existing search page, opt-in).
6. Knowledge handbooks (grounded passages with section citations).

### 1.5 Missing infrastructure (and where it is planned)

| Missing | Needed for | Plan |
|---|---|---|
| Secure AI gateway (server) | LLM, neural embeddings, cross-encoder, vision | FUTURE — contract in [AI_API_SPEC.md](AI_API_SPEC.md) |
| Vector DB / graph DB | Scale beyond one browser | FUTURE — same interfaces, server implementations |
| Experiment, telemetry, PO datasets | Process ML, predictive maintenance, lead-time models | DATA REQUIRED — schemas in [AI_DATA_MODEL.md](AI_DATA_MODEL.md) |
| Multi-user auth + audit log | Enterprise traceability | FUTURE — `AuthProvider` seam exists (`services/providers.ts`) |

### 1.6 Security risks addressed

* **Keys:** none in the frontend. The gateway contract requires server-side keys only.
* **Prompt injection:** retrieved text is treated as data; the local composer never executes
  instructions from records; a future LLM receives retrieved text inside delimited, labelled
  blocks and has no tool that writes data without a human confirmation.
* **Arbitrary query execution:** natural-language queries compile to a whitelisted filter
  object — never SQL, never `eval`.
* **Confidential data:** unchanged rule — nothing confidential in the public repository.

---

## 2. Target architecture (implemented shape in V1)

```text
                         TEAL INTELLIGENCE (existing pages, data, engines — unchanged)
                                         │
                                         ▼
                     TEAL COPILOT (global drawer · /copilot · record actions)
                                         │
                                         ▼
                                AI ORCHESTRATOR  src/services/ai/orchestrator.ts
                                         │
          ┌───────────────┬──────────────┼───────────────┬────────────────┐
          ▼               ▼              ▼               ▼                ▼
    INTENT ENGINE   CONTEXT ENGINE   MODEL ROUTER   ENGINE REGISTRY   AI GATEWAY
    intent.ts       context.ts       router.ts      registry.ts       gateway.ts
          │                              │                                │
          │               ┌──────────────┼─────────────────┐              │ LocalGateway (ONLINE)
          │               ▼              ▼                 ▼              │ RemoteGateway (OFFLINE —
          │        HYBRID RETRIEVAL   KNOWLEDGE GRAPH   ENGINEERING       │  contract only, no keys)
          │        BM25 (MiniSearch)  graph.ts + kg.ts  ENGINES (existing)│
          │        lexical vectors    GraphRAG paths    units, specs,     │
          │        query expansion    change impact     compatibility,    │
          │        RRF fusion         entity resolution part search, BOM, │
          │        technical reranker                   cost, supply, DES,│
          │        handbook passages                    Monte Carlo, DOE, │
          │                                             Bayesian opt.     │
          ▼                                                               │
    STRUCTURED AGENTS (typed contracts, deterministic): Requirements · Laser · Component ·
    Compatibility · BOM · Supplier · Cost · Process · Document (RFQ/URS/FMEA) · Verification
                                         │
                                         ▼
                   ENGINEERING VALIDATOR  verify.ts  (sources · database · units ·
                   constraints · conflicts · review flag)  →  CONFIDENCE ENGINE confidence.ts
                                         │
                                         ▼
                   TEAL ANSWER (response contract, claim classes, sources, trace)
                                         │
                ┌────────────────────────┼──────────────────────────┐
                ▼                        ▼                          ▼
        Records / evidence        3D digital twin (Studio)    Actions: decision record,
        (links)                   via scenario draft          RFQ/URS/FMEA drafts, feedback
```

### 2.1 The LLM is not the system

In V1 **no language model is connected**. The orchestrator therefore runs the full pipeline with
deterministic engines and a template composer: every sentence is built from a record field, an
engine output or a handbook passage, and carries its sources. When a secure gateway is later
configured, the reasoning LLM becomes the *synthesis* step only — it receives the same verified
evidence bundle and its output goes through the same validator. The LLM is never the database,
the calculator, the compatibility validator, the simulator or the source of truth.

### 2.2 Graceful degradation

```text
Primary (remote reasoning LLM)  →  OFFLINE in V1
  ↓
Fallback (remote fast LLM)      →  OFFLINE in V1
  ↓
RAG / database-only composer    →  ONLINE (local)   ← every V1 answer comes from here
  ↓
Graceful failure                →  "Data not available in the TEAL Intelligence knowledge base."
```

Every engine can be disabled in the Control Center; the router skips disabled engines and says
so in the answer trace.

### 2.3 Modules

| Module | File | State |
|---|---|---|
| Contracts (answer, claim, source, agent message, feature state) | `src/services/ai/types.ts` | LIVE |
| Engine & model registry (incl. MLOps metadata, data readiness) | `src/services/ai/registry.ts` | LIVE |
| AI gateway (local implementation + remote contract) | `src/services/ai/gateway.ts` | LIVE (local) · FUTURE (remote) |
| Intent engine | `src/services/ai/intent.ts` | BETA |
| Context engine | `src/services/ai/context.ts` | LIVE |
| Model router (cost/latency/risk aware, fallback chain) | `src/services/ai/router.ts` | LIVE |
| Query expansion, lexical vectors, hybrid retrieval, reranker, passages | `src/services/ai/retrieval/*` | BETA |
| Knowledge graph view, GraphRAG paths, change impact | `src/services/ai/kg.ts` | BETA |
| Entity resolution | `src/services/ai/entities.ts` | BETA |
| Natural-language → controlled query | `src/services/ai/nlq.ts` | BETA |
| Agents (typed, deterministic) | `src/services/ai/agents.ts` | BETA |
| Product configurator pipeline | `src/services/ai/configure.ts` | BETA |
| RFQ / URS / FMEA drafts | `src/services/ai/drafts.ts` | BETA (DRAFT — ENGINEERING REVIEW REQUIRED) |
| DOE designer, Bayesian optimisation | `src/services/ai/doe.ts`, `bayesopt.ts` | BETA · DATA REQUIRED |
| Engineering validator + confidence | `src/services/ai/verify.ts`, `confidence.ts` | LIVE |
| Evaluation harness + gold set | `src/services/ai/evaluate.ts`, `eval/gold.ts` | LIVE |
| Feedback + interaction log (local) | `src/services/ai/feedback.ts` | LIVE (this browser) |
| Copilot UI, Control Center, Configurator page | `src/features/ai/*` | BETA |

### 2.4 Non-negotiable principles (enforced in code)

1. The LLM does not become the database — no LLM in V1; the future LLM only synthesises verified bundles.
2. RAG does not replace structured data — structured engines run first; passages add explanation.
3. The knowledge graph does not replace constraints — compatibility always comes from the rules engine.
4. ML does not replace deterministic validation — every ML output passes the validator.
5. AI output never becomes a verified specification automatically — generated records are `INFERRED`/`DRAFT`.
6. Predictions carry data coverage and uncertainty — the Bayesian engine reports σ and sample count.
7. AI content stays distinguishable — claim classes, DRAFT banners, `AI_GENERATED`/`INFERRED` data types.
8. Consequential decisions need a person — "Record decision" creates a `decision` draft with the approver's name.
9. Never fabricate missing data — unknowns become data gaps.
10. Never break the platform — the AI layer is additive and lazy-loaded.

See also: [AI_ROADMAP.md](AI_ROADMAP.md) · [AI_DATA_MODEL.md](AI_DATA_MODEL.md) ·
[AI_API_SPEC.md](AI_API_SPEC.md) · [AI_MODEL_REGISTRY.md](AI_MODEL_REGISTRY.md) ·
[AI_KNOWLEDGE_GRAPH.md](AI_KNOWLEDGE_GRAPH.md) · [AI_RAG_ARCHITECTURE.md](AI_RAG_ARCHITECTURE.md) ·
[AI_EVALUATION.md](AI_EVALUATION.md)
