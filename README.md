# TEAL Engineering Intelligence OS

A GitHub-native engineering digital thread for TEAL's laser, automation and semiconductor
equipment business: **customer inquiry → requirements → product → configuration → POC/DOE →
BOM → cost → suppliers/RFQ → project gates G0–G10 → FAT/SAT → production release → service →
lessons learned**, with every value labelled by where it came from.

**GitHub-only V1.** No backend, no external database, no authentication server, no AI keys.
GitHub stores the master data, GitHub Actions validates and indexes it, GitHub Pages serves the
app, and your browser (IndexedDB) holds your local working drafts.

```
GitHub (code · /data · /knowledge) → Actions (validate · test · quality · index · build) → Pages
                                                                  ↓
                        React app in the browser  ←  static master data (lazy, cached, offline)
                                                  ←→ IndexedDB local workspace (LOCAL DRAFTS)
```

## What is in it

| Area | What works today |
|---|---|
| **Flagship** | *Create product from customer inquiry*: one action drafts opportunity, requirements, platform match with reasons, configuration, preliminary BOM, cost model, POC + DOE plan, risks, open questions, G0 checklist and project skeleton — all DRAFT, all schema-validated |
| Products | 22 TEAL platforms in 7 families, Product DNA, platformization, **Configurator 2.0** (the legacy simulator's engine, reproduced exactly — golden-fixture tests) |
| Engineering | Laser, automation, quality calculators (41 handbook formulas implemented, each citing Automation Handbook Part 54), process engine, POC, DOE, machine architecture builder, module library |
| Commercial | Cost engine (legacy Cost Platform logic, reproduced exactly), TEAL cost sheet, landed cost, scenarios, price-to-win, ROI/payback, BOM engine, RFQ + quote comparison, procurement, localization |
| Delivery | Projects with Gantt + critical path, gates G0–G10 enforcing rules R1–R5, FAT/SAT protocols generated from requirements + handbook checklists, traceability matrix, production release, field service |
| Knowledge | The three TEAL handbooks as searchable Markdown (140 parts), 177 formulas, 136 evidence records, knowledge graph, engineering memory, what-is-missing, what-can-we-reuse, what-changed, WHY? on every value |
| Data management | Local drafts, **TEAL change packages** (ZIP) → pull request, workspace backup/restore, legacy-app import, data quality, reports, CSV/JSON export, optional **LOCAL WORKSPACE LOCK** (not security) |
| Legacy apps | Laser Product Simulator, Cost Platform and PM Tracker still run unchanged under `/legacy/` |

Data honesty: every record carries a `data_type` (TEAL_INTERNAL, PUBLIC, EXTERNAL, DEMO,
CALCULATED, INFERRED, AI_GENERATED, USER_CREATED) and a verification status. Demo records are
labelled DEMO; prices are ESTIMATE / DEMO unless quoted; unknown values show **UNKNOWN**; POC,
DOE, FAT and SAT results are never pre-filled.

## Run it

```bash
npm ci
npm run dev          # prepares data, then Vite dev server
npm run build        # data → schemas → catalog → graph → search index → app (dist/)
npm run check        # typecheck + lint + unit/integration tests
npm run test:e2e     # Playwright against the production build (npm run build first)
```

Node 22. The app is served under `/TEAL-Intelligence-/` in production (set by `GITHUB_REPOSITORY`).

## Change master data

1. Work in the app — new/edited records are **LOCAL DRAFTS** in your browser.
2. Admin → Data management → **Export change package** (ZIP).
3. `npm run data:apply -- teal-change-package-YYYY-MM-DD.zip` then `npm run data:catalog`.
4. Open a pull request. CI validates schemas, references and data quality. Merge → deploy.

*Permanent repository update requires a GitHub commit.* The app never claims otherwise.

## ⚠️ This repository is public

Do not commit customer names, drawings, quotations, confidential BOMs or prices, NDA material,
personal data or secrets. `applyChangePackage` refuses customer-type records unless you confirm
they are not confidential. See [docs/SECURITY.md](docs/SECURITY.md) — including a note on the
three TEAL handbooks that are published here as Markdown.

## Documentation

| Plan (from the audit) | Reference |
|---|---|
| [01 Repository audit](docs/01_REPOSITORY_AUDIT.md) | [Architecture](docs/ARCHITECTURE.md) · [Database](docs/DATABASE.md) · [Data model](docs/DATA_MODEL.md) |
| [02 Legacy feature map](docs/02_LEGACY_FEATURE_MAP.md) | [Product engine](docs/PRODUCT_ENGINE.md) · [Cost engine](docs/COST_ENGINE.md) · [Gates](docs/GATES.md) |
| [03 Target architecture](docs/03_TARGET_ARCHITECTURE.md) | [Knowledge](docs/KNOWLEDGE.md) · [Ingestion](docs/INGESTION.md) · [Global intelligence](docs/GLOBAL_INTELLIGENCE.md) |
| [04 Data model](docs/04_DATA_MODEL.md) | [Security](docs/SECURITY.md) · [Deployment](docs/DEPLOYMENT.md) · [Testing](docs/TESTING.md) |
| [05 Migration plan](docs/05_MIGRATION_PLAN.md) · [06 Roadmap](docs/06_IMPLEMENTATION_ROADMAP.md) | [Migration](docs/MIGRATION.md) |
