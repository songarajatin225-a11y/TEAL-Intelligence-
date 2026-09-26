# 06 — Implementation Roadmap

Phases follow spec §147 ("build P0 completely before expanding"). Status reflects the code on
this branch; "Definition of done" (spec §153) = UI, data model, validation, business logic,
error/loading/empty states, tests, documentation, navigation, export.

Legend: ✅ done · 🟡 done with a stated limit · ⏳ not started

## P0 — Foundation and the core thread

| Item | Status | Where / notes |
|---|---|---|
| Foundation (React + TS strict + Vite + Tailwind, HashRouter, PWA, CI, Pages) | ✅ | `src/app`, `.github/workflows`, `public/sw.js` |
| Navigation (spec §117), Ctrl+K command palette, global search box | ✅ | `src/app/nav.ts`, `CommandPalette.tsx` |
| Data model (42 entities, provenance, data types, JSON Schemas, catalog) | ✅ | `src/domain`, `schemas/`, [DATA_MODEL.md](DATA_MODEL.md) |
| Local workspace (drafts, overrides, tombstones, change log), change packages, backup | ✅ | `src/repositories`, `services/changePackage.ts`, `services/backup.ts` |
| Product (portfolio, Product DNA, platformization) | ✅ | `features/products` |
| Application library, materials, industries | ✅ | `features/applications` |
| Customer, opportunity pipeline, activities | ✅ | `features/opportunities`, generic entity pages |
| **Create product from customer inquiry** | ✅ | `features/inquiry`, `services/inquiry.ts`; integration + E2E tested |
| Product Configurator 2.0 | ✅ | `features/configurator`; golden-fixture parity with the legacy simulator |
| Cost engine (buckets, landed, TEAL sheet, scenarios, price-to-win, ROI, payback) | ✅ | `features/cost`, `calculations/cost.ts`; golden parity with the legacy platform |
| BOM engine | ✅ | `features/bom`, `services/bomGen.ts` |
| Product Manager workspace + Command Center (10 questions) + dashboards | ✅ | `features/product-manager`, `features/command-center` |
| POC + DOE | ✅ | `features/poc`, `features/doe` — results entered by users, never generated |
| Gates G0–G10 with rules R1–R5, project Gantt + critical path | ✅ | `services/gates.ts`, `services/schedule.ts`, `features/projects`, `features/gates` |
| Search (partitioned build-time index + local drafts) | ✅ | `services/search.ts`, `scripts/ingestion/generateSearchIndex.ts` |
| WHY? / What is missing? / What can we reuse? / What changed? / Engineering memory | ✅ | `services/why.ts`, `gaps.ts`, `similarity.ts`; `features/knowledge` |
| Calculators (41 handbook formulas implemented of 177 catalogued) | 🟡 | `src/calculations`; the rest are browsable in the formula catalogue, not yet executable |
| FAT / SAT protocols, traceability matrix, production release | ✅ | `features/fat-sat`, `features/requirements`, `services/fatSat.ts` |
| Legacy apps preserved + legacy data import | ✅ | `public/legacy`, Admin → Import |

## P1 — Supply, semiconductor, knowledge

| Item | Status | Where / notes |
|---|---|---|
| Supplier intelligence | 🟡 | 10 legacy vendors (DEMO) + 60 handbook-named companies; capability/quality scoring needs curated data |
| RFQ engine (from BOM, quote comparison, selection → BOM as QUOTED) | ✅ | `features/suppliers` |
| Semiconductor value chain + equipment buyer / cost of ownership | ✅ | `features/semiconductor` (from Semiconductor Handbook) |
| Localization engine | ✅ | `features/localization`; candidates generated from BOM import items |
| Technology radar | 🟡 | 16 technologies from the handbooks; **radar position intentionally unset** (no assessment exists yet) |
| Knowledge graph | ✅ | `services/graph.ts`, `features/knowledge/GraphPage.tsx` |
| Evidence ledger + source registry | ✅ | 136 handbook evidence records, 8 sources |
| Reviewed ingestion pipeline | ✅ | `scripts/ingestion`, [INGESTION.md](INGESTION.md) — no external source enabled yet |

## P2 — Later

| Item | Status | Notes |
|---|---|---|
| Global intelligence **data** (manufacturer products, specs) | ⏳ | Pipeline and UI exist; needs reviewed source manifests. Nothing is invented meanwhile. |
| Research / patents / market data | ⏳ | Pages explain the gap; no generated numbers |
| Advanced similarity (embeddings) | ⏳ | V1 uses deterministic token + feature similarity with visible reasons |
| Digital twin / telemetry | ⏳ | Machine + service records only; no live data is claimed |
| Advanced AI | ⏳ | V1 has the AI Context Generator + prompt library (copy/paste, no keys) |
| Private deployment / backend (`ApiRepository`, auth, encryption at rest) | ⏳ | Required before confidential data can live in the system — see [SECURITY.md](SECURITY.md) |

## Final demo scenarios (spec §133–§142)

| Scenario | Path in the app | Limits |
|---|---|---|
| 1 — Semiconductor package marking | Inquiry (Example 1) → saved package → opportunity → requirements / traceability → configuration → Generate BOM + cost → RFQ from BOM → project gates → FAT/SAT generation → production release | Supplier quotes and test results are entered by people |
| 2 — CO₂ PCB marking | Demo opportunity *CO₂ inline PCB marking* → configuration → architecture → BOM + cost → project *C2i* → FAT/SAT | Demo records are labelled DEMO |
| 3 — Semiconductor / ATMP | Semiconductor → value chain → equipment buyer (COO) → localization → cost → roadmap | Market figures are not provided |
| Cost | Any cost model: buckets → overhead → contingency → selling → margin → economics (ROI, payback) | Rates are DEMO seed values |
| Product manager | PM workspace: today, follow-ups, meetings, opportunities, POCs, next actions | |
| Global intelligence | Search "50W 1064nm nanosecond laser marking source" → source classes, handbook sections, companies with evidence → Find similar / Reuse / Missing | No manufacturer product data until a reviewed source is ingested |

## Next steps (proposed order)

1. Enable the first reviewed ingestion source (manufacturer-provided laser/optics catalogues).
2. Implement the remaining catalogued formulas as calculators (each with its handbook row as a test).
3. Supplier capability/quality fields from real RFQ history.
4. Decide the confidential-data path (private repo + Pages access control, or backend) before
   importing real customer work into shared data.
