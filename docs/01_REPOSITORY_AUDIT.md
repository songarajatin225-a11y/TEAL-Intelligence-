# 01 — Repository Audit

Audit date: 2026-09-26 · Auditor: Claude Code (session on branch `claude/beautiful-euler-rhrv25`)

## 1. Target repository — `songarajatin225-a11y/TEAL-Intelligence-`

| Item | Finding |
|---|---|
| Contents at audit | One commit (`ff39e7a Initial commit`), one file: `README.md` ("TEAL Intelligence Product Platform") |
| Visibility | **Public** (per GitHub repository listing) |
| Existing code / data / deployment | None |
| Consequence | The OS is built from scratch in this repository; the three legacy applications live in **other** repositories and were audited there (read-only). |

> **Public-repository warning.** Everything committed here, and everything deployed to GitHub
> Pages from it, is readable by anyone. See `docs/SECURITY.md` §"What is in this public repo".

## 2. Legacy applications located

The master specification names three existing products. They were found in the owner's other
repositories (all public) and cloned read-only for audit:

| Specified product | Repository audited | Why this one | Other candidates seen |
|---|---|---|---|
| TEAL Laser Product Simulator | `TEAL-Laser-Product-Sim-2` (pushed 2026-09-23) | Most recent; README describes it as the full configurator + 3D simulator | `TEAL-Laser-Product-Configurator-Sim-`, `TEAL-Laser-Product-V3…V7`, `TEAL-Laser-Catalogue-V1/V2` (older generations, not audited in depth) |
| TEAL Cost Platform | `TEAL-COST-DEMO-7-8` (pushed 2026-08-07) | Newest and a superset of `TEAL-Cost-Platform-2` (same file set; larger `app.js`, 219 KB vs 195 KB) | `TEAL-Cost-Platform-2`, `Teal-Cost-Platform-1-`, `teal-costing-platform`, `TEAL-Cost-Platform-`, `Cost-Platform`, `TEAL-Costing-Demo` |
| TEAL Product Management Tracker | `Product-Tracker-` (pushed 2026-09-06) | Only tracker repository | — |

If a different generation is the one in daily use, the migration map (02) still applies: the
data models are consistent across generations, and the OS importers accept the export formats.

## 3. Legacy application inventory

### 3.1 TEAL Laser Product Simulator (`TEAL-Laser-Product-Sim-2`)

| Aspect | Finding |
|---|---|
| Files | `index.html` (626 KB, single file, ~11,000 lines, 349 functions), `data.json` (90 KB), `README.md` (60 KB) |
| Stack | Vanilla JS, no build, no dependencies; Google Fonts only; logo embedded as base64 |
| Deployment | GitHub Pages "deploy from branch" |
| Data model (`data.json`) | `SRC` 12 laser source classes · `LENS` 5 f-theta objectives · `MAT` 15 materials (k, Tm, ρ, cp, absorption by band) · `IND` 8 industries · `STD` 15 standards · `LEX` inquiry lexicon (process / material / need / scale / care) · `FAM` 7 product families · `PLAT` 22 platforms (base price, sources, powers, lenses, standard content, specs, applications) · `MOD` 26 automation modules · `SW` 4 LaserSuite editions · `EXTRA` 4 connectivity/compliance packages · `MODFIT` 30 fitment rules · `RECO` 27 recommendation rules · `RULES` pricing rules (+ admin PIN) |
| In-code only | `MODCONFLICT` (7 incompatible module pairs), `pwBySrc` power lists, `FAM`/`PLAT` fallbacks |
| Business logic | 6-step configurator (family → platform → application → source/power/objective → integration → specification); `price()` parametric ex-works band; `optics()` spot `d = 4λfM²/(πD)` and DOF ±z_R; `physics()` pulse energy, peak power, fluence, irradiance, regime (keyhole ≥ 10⁶ W/cm² for welding), material coupling, thermal diffusion length, wall-plug and chiller estimate; `evalReco()` rule engine with fitment gating; `modConflicts()`; inquiry parser (lexicon scoring → top 3 platform/application matches); designation code (`TEAL-F-FB-30W-F254-02M`) |
| UI features | Painter's-algorithm 3D machine view built from the configuration; run-cycle simulation with computed timings and faults; layers/view modes; clickable assemblies (~60 described); DFM report PDF written directly (PDF 1.4, no library); print spec sheet; URL-hash shareable state (`#p=…&a=…&s=…&w=…&l=…&m=…&f=…&x=…&t=…`); admin panel (5 tabs, undo/redo, change log, search, health check, rule sweep, 3D build sweep, export `data.json`) |
| Persistence | `localStorage` draft of admin edits only |
| Security | Admin PIN `teal2026` stored in `data.json` — **not a security control** (readable by anyone) |
| Limitations | Monolithic 626 KB file; data and logic coupled; no tests; no provenance on values; prices are parametric estimates; no link to cost, BOM, projects, customers |

### 3.2 TEAL Cost Platform (`TEAL-COST-DEMO-7-8`)

| Aspect | Finding |
|---|---|
| Files | `index.html`, `assets/app.js` (220 KB), `assets/styles.css`, `data/config.json`, `data/masters.json`, `data/projects.json`, `encrypt.html` |
| Stack | Vanilla JS, no build; inline SVG charts |
| Data model | `config`: company, brand, 14 business units, 14 product categories, 11 roles, defaults (landed %, mark-up %, currency, code prefix), 8 statuses · `masters`: item master (58 stock codes with price, currency, vendor, lead, MOQ, HSN, updated), currency (4, **no rate date**), process rates (22), labour (8), engineering (9), vendor (10), customer (7), material (9), tax (5), freight (5), plant (4), approval matrix (4 bands) · `projects`: 6 projects, 3 templates, audit trail |
| Business logic | 12 cost modules with per-line formulas (material landed, mechanical, electrical, software, manufacturing machine-hour, labour + OT, design + NRE, site + contingency, commercial % of direct, commissioning hours, packing crate area `2(LW+LH+WH)`, AMC with escalation); `computeProject()` direct → overheads → contingency → profit → selling, gross/net margin; **TEAL cost sheet A/B/C/D** with gross-up `D = C / (1 − profit% − warranty%)`; approval floor by order-value band; catalogue discipline (coverage, drift, stale > 180 days); price-to-win back-solve; cost drivers; margin sensitivity; revisions; templates; audit |
| Persistence | `localStorage` key `teal:costing:db:v1` (optionally AES-256-GCM encrypted with PBKDF2 key) |
| Security | Optional real encryption vault (good); role selector is explicitly "a workflow guard, not a security control" |
| Data quality | Seed data mixes **real company names** (customers, vendors) with **fabricated projects and prices** (e.g. "Wafer handling robot" sourced from Universal Robots; "Helium leak detector" from Keyence). Must be treated as DEMO. |
| Limitations | No link to configurator/product/BOM structure; costs keyed by free text; FX has no date/source |

### 3.3 TEAL Product Management Tracker (`Product-Tracker-`)

| Aspect | Finding |
|---|---|
| Files | 15 HTML pages, 22 JS files (~330 KB), 3 CSS, `data/sample-data.json` |
| Stack | Vanilla ES6, IndexedDB, no build |
| Data model | 11 stores: activities, customers, applications, products (laser diode parts), localization, samples, meetings, suppliers, competitors, dailyLogs, weeklyReviews (+ settings). Schema-driven (`schema.js`): vocabularies (status, priority, workstream, opportunity stage, application category, laser type, package …), sectioned fields, filters, derived dates, code prefixes (ACT, CUS, APP, PRD, LOC, SMP, MTG, SUP, CMP, LOG, WRV) |
| Business logic | Derived overdue/follow-up status; dashboard KPIs; weekly review; reports; CSV/JSON export; full JSON backup/restore; `@today±N` relative sample dates |
| Persistence | IndexedDB database `laser_pm_tracker` (v1) |
| Security | Local login: PBKDF2-SHA256 (210k iterations) credential in the browser — a **local workspace lock**, not authentication |
| Sample data | Fictional (e.g. "Northern Defence Systems", `example.com` e-mails), flagged `isSample` |
| Limitations | Separate entity model (customer is free text on every record); no link to products/costs/projects |

## 4. Handbooks (uploaded .docx, authored by Jatin Songara, TEAL Laser & Photonics Vertical)

| Handbook | Size | Structure | Tables | Word equations | Figures |
|---|---|---|---|---|---|
| The Complete Laser Handbook (22 Sep 2026) | 7.0 MB | 28 parts + front/back matter, 143 sections | 177 | 0 (equations inline as text/images) | 72 media files |
| Automation Equipment Building Handbook (Ed. 1.0, 26 Sep 2026) | 1.4 MB | 12 books, 60 parts, 10 case studies, G0–G10 gates, 23 templates, 27-step playbook; Part 54 = catalogue of 177 formulas | 392 | 225 (OMML) | 15 |
| The Complete Semiconductor Industry Handbook (21 Sep 2026) | 2.4 MB | 50 parts grouped in 21 sections, glossary | 83 | 14 (OMML) | 30 |

Converted to Markdown by `scripts/knowledge/docx_to_markdown.py` (headings, tables and OMML
equations preserved; figures **not** transcribed) → `knowledge/handbooks/{laser,automation,semiconductor}/`.
No confidentiality marking was found in the documents. They are nevertheless TEAL-authored
material being placed in a **public** repository — see SECURITY.md.

Known source defect preserved as-is: Automation Part 54 row T1/T3 contain `|t_i|` which splits
the table cell in the source document.

## 5. Existing deployment configuration

All three legacy apps use GitHub Pages "deploy from branch" with no Actions. None has CI,
tests, schema validation, or a build step.

**Shared origin.** All the owner's project sites are served from
`https://songarajatin225-a11y.github.io/<repo>/` — the same browser origin. IndexedDB and
localStorage are per-origin, so the OS deployed at `/TEAL-Intelligence-/` can read the
legacy tracker's `laser_pm_tracker` database and the cost platform's `teal:costing:db:v1` key
**in the user's own browser**. The OS uses this for a no-upload migration (Admin → Legacy import).

## 6. Reusable assets identified

| Asset | Reuse decision |
|---|---|
| Simulator `data.json` (sources, lenses, materials, platforms, modules, fitment, rules, lexicon, standards) | Migrated to `/data` with provenance |
| Simulator optics/physics/price/reco/fitment/conflict logic | Ported to TypeScript (`src/calculations/laser.ts`, `src/features/configurator/engine.ts`) with tests |
| Simulator 3D view, run simulation, DFM PDF | Kept as-is, embedded (`/legacy/laser-simulator/`), opened with the OS configuration via URL hash |
| Cost platform module formulas, `computeProject`, TEAL A/B/C/D sheet | Ported to `src/calculations/cost.ts` with tests |
| Cost platform masters (rates, items, FX, tax, freight, approval) | Migrated as **DEMO / UNKNOWN verification** |
| Cost platform projects (real customer names + fabricated jobs) | **Not republished.** Importable from the user's own browser/export |
| Tracker schema-driven entity pattern | Adopted as the OS field-schema pattern |
| Tracker vocabularies | Migrated to `/data/knowledge/vocabularies.json` |
| Tracker data | Importable from the user's own browser/backup JSON |
