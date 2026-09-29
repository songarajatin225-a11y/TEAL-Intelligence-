# AI Roadmap

Feature states: **LIVE** (works, tested) · **BETA** (works, tested, still being tuned) ·
**PROTOTYPE** (works on limited scope) · **DATA REQUIRED** (engine exists, activates only when
enough real, validated data exists) · **EXPERIMENTAL** · **FUTURE** (designed, not built).

The Control Center (`/ai-engine`) shows the live state of every engine — computed from the data,
not hard-coded, for everything marked DATA REQUIRED.

## Phase 1 — Immediate value (this release)

| # | Capability | State | Notes |
|---|---|---|---|
| 1 | AI gateway | LIVE (local) · FUTURE (remote) | Provider-agnostic interface. Local gateway serves retrieval/rerank; remote LLM/embedding adapters are a contract only — no keys, no calls. |
| 2 | AI Copilot | BETA | Global drawer (header button, key **I**), `/copilot` page, context-aware (record, scenario). |
| 3 | Model router | LIVE | Intent → complexity/risk/data/prediction/optimisation/vision/simulation needs → engines, with fallback chain. |
| 4 | Embeddings | BETA | *Lexical* hashed TF-IDF n-gram vectors, labelled as such. Neural embeddings: FUTURE (gateway). |
| 5 | Hybrid RAG | BETA | BM25 + lexical vectors + metadata filters + graph expansion, fused with RRF; handbook passages fetched per section. |
| 6 | Reranker | BETA | Technical feature reranker (spec constraint satisfaction, exact identifiers, entity prior, trust, graph proximity). Cross-encoder: FUTURE. |
| 7 | Knowledge graph foundation | LIVE | Typed view over the digital-thread graph. |
| 8 | GraphRAG | BETA | Multi-hop paths (application → material → laser → platform → parts → manufacturer). |
| 9 | Engineering rules engine | LIVE (existing) | Compatibility rules, recommendation rules, requirement rules. |
| 10 | Constraint engine | LIVE (existing) | Spec constraints in part search; module conflicts; compatibility. |
| 11 | Source / citation system | LIVE | Every claim → record / handbook section / engine. |
| 12 | AI verification | LIVE | Source, database, unit, constraint and conflict checks + review flag. |
| 13 | Semantic search | BETA | Hybrid retrieval on the search page (opt-in "Hybrid" mode) and in the Copilot. |

## Phase 2 — Product / engineering AI (this release, BETA)

| # | Capability | State | Built on |
|---|---|---|---|
| 14 | Product configurator | BETA | inquiry parser, platform matcher, `solve()`, part search, compatibility |
| 15 | Laser technology selection | BETA | TEAL application records, material absorption, source classes — candidates, never "best" |
| 16 | BOM intelligence | BETA | configurator BOM + engineering-DB parts |
| 17 | Supplier intelligence | BETA | supplier/company records, manufacturer countries, dependency engine |
| 18 | Equivalent components | BETA | same-type parts + constraint filtering + compatibility vs. neighbours |
| 19 | Compatibility engine | LIVE (existing) | |
| 20 | Cost intelligence | BETA | recorded prices / list-price estimates only; unknowns listed |
| 21 | RFQ generator | BETA | editable, DRAFT — ENGINEERING REVIEW REQUIRED |
| 22 | URS generator | BETA | editable, DRAFT — ENGINEERING REVIEW REQUIRED |
| 23 | Change impact analysis | BETA | graph traversal + compatibility re-check + spec diff |
| 24 | FMEA AI | PROTOTYPE | AI-SUGGESTED failure modes per subsystem; S/O/D left unscored |
| 25 | Requirements traceability | LIVE (existing) + gap findings in the Copilot |

## Phase 3 — Proprietary TEAL ML (DATA REQUIRED)

| # | Capability | State | Activation condition |
|---|---|---|---|
| 26 | Process parameter prediction | DATA REQUIRED | ≥ 30 validated experiment results for one process/material family |
| 27 | Bayesian optimisation | BETA engine · DATA REQUIRED per DOE | ≥ 5 measured runs on a DOE record; GP + expected improvement |
| 28 | DOE | BETA | full factorial, 2-level fractional, Latin hypercube, central composite |
| 29 | Component recommendation | DATA REQUIRED | historical configurations with outcomes |
| 30 | Cost estimation | DATA REQUIRED | ≥ 20 quotations per category with dates |
| 31 | Lead-time prediction | DATA REQUIRED | PO history (order, promise, delivery dates) |
| 32 | Demand forecasting | DATA REQUIRED | ≥ 24 periods of consumption |
| 33 | Anomaly detection | DATA REQUIRED | machine telemetry |
| 34 | Predictive maintenance | DATA REQUIRED | telemetry + failure records |
| 35 | Quality prediction | DATA REQUIRED | inspection results linked to parameters |

## Phase 4 — Advanced digital engineering

| # | Capability | State |
|---|---|---|
| 36 | Multimodal AI (RFQ upload → requirements) | PROTOTYPE for pasted text; files FUTURE (gateway OCR) |
| 37 | Drawing intelligence | FUTURE |
| 38 | Computer vision | FUTURE (gateway vision service; contract defined) |
| 39 | Visual anomaly detection | FUTURE · DATA REQUIRED (good-sample sets) |
| 40 | 3D machine configurator | LIVE (existing twin) — Copilot/Configurator open a scenario draft in 3D |
| 41 | Digital twin | LIVE (existing) |
| 42 | Simulation surrogates | FUTURE |
| 43 | Physics-informed AI | FUTURE |
| 44 | Counterfactual engine | PROTOTYPE — cycle-time target: bottleneck + required change per station from the capacity model |
| 45 | Multi-objective optimisation | LIVE (existing Pareto in Studio) |

## Phase 5 — TEAL product intelligence

46–52 (roadmap, technology, competitor, opportunity, portfolio, project, decision intelligence):
existing pages provide the data views; the Copilot answers project status questions
("what is pending in this project?") from the gap and next-action engines (BETA). AI synthesis
across them: FUTURE (needs the gateway).

## Data flywheel

```text
Requirement → Configuration → Component selection → Supplier → BOM → Cost → Process → Experiment
→ Test → Telemetry → Engineering decision → Validated TEAL dataset → model improvement → better configuration
```

What exists now: requirement, configuration, BOM, cost, POC/DOE, verification, decision records;
Copilot feedback and decisions are captured locally and exported through change packages. What is
missing: experiment results at volume, telemetry, PO history — collected before any model trains.
