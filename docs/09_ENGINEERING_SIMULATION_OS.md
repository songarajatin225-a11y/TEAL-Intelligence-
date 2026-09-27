# 09 — Industrial Intelligence + Engineering Knowledge Graph + Equipment Simulation OS

Source: *TEAL Intelligence — Ultimate Industrial Intelligence + Engineering Knowledge Graph +
Equipment Simulation OS* master prompt (180 sections). This document records what was audited,
what was built, how each section maps to the code, and what is deliberately **not** claimed.

> TEAL Intelligence — Industrial Intelligence + Product Development + Equipment Simulation
> Operating System. Flagship: **Equipment Simulation Studio**.
> UNDERSTAND → CONFIGURE → ENGINEER → SIMULATE → OPTIMIZE → VALIDATE → BUILD → SCALE

## 1. Audit (§1, §179) — what existed and was reused

| Existing capability | Reused as |
|---|---|
| React 19 + TypeScript + Vite + Tailwind 4, HashRouter on GitHub Pages | unchanged stack; new routes are lazy chunks |
| Zod entity registry → JSON Schemas → catalog → search index → graph | new entities are registry entries + datasets; nothing bypasses validation |
| `MergedRepository` = GitHub master data ∪ IndexedDB drafts (Dexie) | the repository layer for every new entity (§5, §7); typed repositories added |
| Legacy laser configurator (golden-tested optics) | Studio laser & optics tab reuses `calculations/laser.ts` (spot, DOF, pulse energy, fluence, overlap, line energy) |
| Cost engine + dated FX table | equipment cost converts currencies through the FX table and shows the rate used |
| Unit engine | extended (voltage, current, angle, force, torque, acceleration, data, pixels, …) + `normalize()` |
| Requirements, traceability, FAT/SAT, ECR, risks, POCs, projects | requirement quality, trace chain, verification records, ECO, quality records |
| Duplicate detection, data quality, trust labels, WHY? drawer | engineering duplicates, review queues, field-level evidence, data lineage |

Nothing was deleted. The previous navigation was restructured into the §4 information architecture;
every earlier route still resolves (aliases added for new names).

## 2. Architecture (§5–§7, §151, §152)

```
UI (pages, Studio tabs)  →  hooks (useData, useEngineering)  →  services (eng/*, sim/*)
   →  repositories (Static + Workspace = Merged; typed per entity)  →  GitHub /data  +  IndexedDB
```

* **GitHub Pages is not a backend.** No server, no accounts, no shared database, no server-side secrets.
  IndexedDB holds local drafts, change log and settings; localStorage holds UI preferences only
  (theme, density, view mode). Permanent change = export change package → pull request.
* **Backend-ready.** UI code talks to services and repositories only. `ComponentRepository`,
  `ManufacturerRepository`, `SimulationRepository`, `RequirementRepository`, `BOMRepository`,
  `SourceRepository`, … share one `list / get / save` contract that an `APIRepository`
  (REST/GraphQL → PostgreSQL, object storage, search, ingestion workers) can implement later (§6).
* **Scale.** Datasets are partitioned; search uses per-partition MiniSearch indexes (new
  `engineering` partition); lists virtualise; engineering calculations are pure functions over the
  records they need. A future search engine / vector index replaces the SearchProvider (§152).

## 3. Data model (§8–§50)

| Entity | Prefix | Purpose |
|---|---|---|
| `part` | `prt` | Universal engineering product (§11): manufacturer, family, model, type, lifecycle, **specs[]**, interfaces, documents, certifications (each with a source), prices, scope GLOBAL / TEAL (§115) |
| `spec_definition` | `spd` | Dynamic specification engine (§12): 189 parameters from §15–§35 with type, canonical unit, allowed units, product types, query aliases. Holds no values |
| `compatibility_rule` | `cpr` | §44 rules: editable, versioned, source-tagged, DRAFT until reviewed. Checks: range contains, a ≤ b (× factor), a ≥ b, text equals, shared protocol |
| `compatibility` | `cmp` | Recorded relationship (§42). *ManufacturerRecommended* is refused by the schema without a source |
| `data_conflict` | `dcf` | Two sources disagree (§47) — resolved by a decision record, never by overwriting |
| `equipment_template` | `eqt` | 35 structures from §60/§61 (Laser, Electronics, Semiconductor, Battery, General Automation). Station times **empty** |
| `simulation` | `sim` | Scenario = equipment configuration + simulation inputs; versions/variants via `parent_id` (§134, §143); actuals for calibration (§84, §174); readiness + TRL (§147, §148) |
| `recipe` | `rcp` | Process recipe (§81) |
| `verification` | `ver` | Verification / validation record (§88, §89) — results never pre-filled |
| `quality_record` | `qr` | NCR, CAPA, 8D, control plan, inspection plan (§99) |

Extended: `company` (§10 manufacturer registry fields), `source` (§45 provenance, §52 controlled crawl
policy, §109 priority), `requirement` (§85 types, criticality, owner, baseline, validation), `change_request`
(§90 ECO, old → new value, approval).

**Field-level evidence (§46):** every `SpecValue` carries value / min / max / text, unit, the original text,
condition, `source_id`, evidence (page/table/excerpt), confidence, verified, extraction status and dates.
Normalised values are derived at read time — the original is never overwritten (§13).

**Confidence (§50)** is derived — source priority (§109), recency (§110), completeness (key specs per
type), verification and consistency (no conflict) — and the factors are shown. DEMO data and records
without a source are *Unverified* by definition.

## 4. Engines

| Module | Sections | What it does |
|---|---|---|
| `services/eng/specs.ts` | §12, §13, §46, §48–§50, §109, §110 | read / normalise / validate specifications, primary entry by source priority, completeness, confidence, freshness |
| `services/eng/partSearch.ts` | §56, §57, §119, §155 | words → explicit filters (“1064 nm 50 W MOPA”, “galvo above 30 mm aperture”, “f-theta for 100 mm field”, “12 MP global shutter camera”, “linear stage above 500 mm/s”); candidates with ✓ / ✕ / ? per filter, near matches, application evidence; no “best” |
| `services/eng/compatibility.ts` | §42–§44 | pair checks (rules in either orientation + records), selection-wide checks, protocol requirements. A rule violation is never hidden by a record |
| `services/eng/dataReview.ts` | §47, §111–§114 | conflict detection, duplicate suggestions (never auto-merged), field / spec diffs, review queues, database analytics |
| `services/eng/requirementQuality.ts` | §86, §87 | vague / ambiguous wording, units, acceptance, owner, source, verification, validation, duplicates, conflicts; trace chain + coverage |
| `services/sim/model.ts` | §59–§65, §140, §141, §163 | resolve a scenario; laser process time from area/hatch/speed/passes/overhead or path/speed; lineage; “Simulation cannot run because … is missing” |
| `services/sim/capacity.ts` | §65–§67 | cycle time (inline: max effective station; sequential: Σ), UPH, availability (MTBF/MTTR + PM), performance, quality, OEE, capacity, gap, machines required, bottleneck evidence |
| `services/sim/des.ts` | §63, §64, §73, §75 | seeded discrete-event simulation: parallel servers, finite buffers, blocking, starvation, rejects, rework, random failures, scheduled faults, PM; replay trace |
| `services/sim/analysis.ts` | §68–§71, §75–§77, §84 | Monte Carlo (P50/P90/P95/P99, probability of meeting target), what-if, scenario metrics, optimisation with Pareto frontier, energy, maintenance, fault impact, calibration |
| `services/sim/bom.ts` | §93, §94, §142 | multi-level BOM from canonical parts; cost elements (not entered = not included); per-currency subtotals; FX shown; no total without FX |
| `services/sim/supply.ts` | §95, §96, §145, §146 | origin from manufacturer country, compatible alternatives, single-source, localization layers, supplier disruption |
| `services/sim/review.ts` | §101–§105, §157 | design review by section with record links, DFM/DFA flags + questions, build readiness gaps, POC readiness, engineering completeness per dimension |
| `services/sim/build.ts` | §60, §72–§74, §134, §143, §144 | scenario from template, derived scenario (never overwrites), automation sequence + validation, 2D twin layout, equipment version diff |
| `services/sim/report.ts` | §121, §138, §139, §156, §158 | simulation report (engineering) and customer proposal (cost, suppliers, risks hidden); rule-based architecture draft that lists what is missing |

## 5. Pages

| Page | Route | Sections |
|---|---|---|
| Equipment Simulation Studio | `/studio` | scenarios, equipment library, scenario comparison, supplier disruption, draft from text (§59, §60, §70, §121, §145, §164) |
| Scenario workspace | `/studio/:id` | Overview (digital thread, KPIs with “How?” lineage), Architecture, Components, Laser & optics, Material flow (DES + replay: play / pause / stop / reset / step / 0.5–10×), Cycle & capacity, Monte Carlo, What-if, Optimize, Digital twin (2D, clickable objects, machine states), Sequence, Faults · maintenance · energy, BOM · cost · suppliers, Design review, Validation, Versions, Report |
| Global Engineering Database | `/engineering-db` | products + technical search/filters, manufacturers, specifications, compatibility, compare, analytics, sources & ingestion, TEAL overlay (§9–§58, §114–§116) |
| Engineering product | `/record/prt-…` | identity, derived confidence, specifications with evidence (editable), interfaces, where used, compatibility, documents, duplicates |
| Data Review Center | `/data-review` | New · Changed · Conflicting · Duplicate · Missing · Stale · Unverified; approve / reject / merge / edit / archive / restore (§113) |
| Requirement Quality & Traceability | `/requirements-quality` | quality, coverage, baselines (§85–§87) |
| Action Center | `/actions` | §161 |
| Technical Documents | `/document-library` | §4 DOCUMENTS |
| Recipes, V&V, NCR/CAPA/8D/control/inspection plans, DFMEA/PFMEA | `/recipes`, `/verification`, `/ncr`, … | §81, §88, §89, §99 |

Home (§160) shows twelve KPI tiles, each a record count that opens the records behind it.
Customer demo mode (§122, §159) is a global view mode: cost, supplier identities, internal risks and
internal tabs are hidden; reports switch to the customer proposal.

## 6. Honesty rules applied (§149, §150, §171, §172, §178)

* **No real manufacturer data was invented.** The engineering database ships **51 DEMO products from
  11 fictional DEMO manufacturers** with DEMO specifications and DEMO prices, one deliberate source
  conflict, one deliberate duplicate and one stale distributor source — so search, compatibility,
  conflicts, duplicates, freshness and cost can be demonstrated. Real products enter through the reviewed
  ingestion pipeline with a source per value.
* **Templates have no times.** Station times, capacities and costs come from scenarios, each with its
  basis (calculated, empirical, user input, manufacturer data, validated, assumption, DEMO).
* **Missing means missing.** A scenario without a station time does not run and says which input is
  missing; a component without a spec is “Not Available”; a cost element not entered is “Not included”;
  a currency without an FX rate prevents a total.
* **Inference is labelled.** Rule-based compatibility is “Engineering compatible (rule-based)”, never
  manufacturer-confirmed; certifications and safety levels are only shown with their source.
* **No arbitrary ranking.** Search candidates, comparisons, scenario comparisons and the Pareto frontier
  never declare a winner.
* **No fake AI.** No AI model is connected. “Draft from text” uses explicit keyword rules and is labelled
  *RULE-GENERATED DRAFT — engineering review required*; Ask Intelligence remains retrieval over records.
* **No fake physics.** The simulator is an *engineering decision-support simulator*: cycle time,
  capacity, queues, variability, faults, cost, energy. It is not FEA, CFD, optical ray-tracing,
  servo dynamics or a validated factory twin. The laser tab shows diffraction-limited physics relations,
  not a process window.
* **Calibration is manual.** Measured values are compared with the prediction frozen at entry; a large
  error becomes a *model calibration candidate* — one measurement never changes the model.

## 7. Not built (stated, not faked)

* 3D / WebGL twin — the 2D SVG twin is the complete view (§166 fallback is the default).
* An AI engineering copilot, semantic / vector search and AI extraction — the architecture keeps the
  seams (SearchProvider, ingestion pipeline, AI Context page); no model or API key is in the frontend.
* Live web crawling from the browser — ingestion stays a reviewed script run against an approved,
  robots.txt-respecting source registry; its output lands in the Data Review Center.
* Factory / line simulation across several machines, robot kinematics, recipe process windows from DOE
  data, spares optimisation — the data model and DES engine are ready for them; they need real data.
* External simulation integrations (Python, MATLAB, FEA, optical) — future integration points only.
* Multi-user persistence, authentication, RBAC, server-side audit — require the future backend.

## 8. Adding real engineering data

1. Add or update the manufacturer (`company` with `roles: ["manufacturer"]`, `registry_categories`).
2. Register the source (datasheet / manual / application note) with `source_type`, URL, dates, licence.
3. Add the product (`part`) with one `SpecValue` per parameter — value, unit, original text, condition,
   `source_id`, evidence. Leave unknown parameters out.
4. Record compatibility only with evidence; rules cover the rest as engineering inference.
5. Review in the Data Review Center, export the change package, open a pull request. CI validates the
   schema, references and data quality.
