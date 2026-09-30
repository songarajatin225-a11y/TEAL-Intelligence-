# Testing

```bash
npm test            # vitest: unit + integration (jsdom, fake-indexeddb)
npm run test:e2e    # Playwright against the production build — run `npm run build` first
npm run check       # typecheck + lint + npm test
npm run data:validate && npm run data:quality   # data gates
```

CI runs all of these (`validate.yml`, `test.yml`, `data-quality.yml`); deploy requires them.

## Unit — `tests/unit/`

| File | Covers |
|---|---|
| `laser.test.ts` | spot size, Rayleigh range, DOF, fluence, peak power, overlap, diffusion length, regimes — checked against the handbook's worked values (Part 54 L-rows) |
| `automation.test.ts` | takt, OEE, UPH, station count, balancing, buffers, cylinder force, vacuum cup, screw speed, servo RMS torque, current, demand load (K-, P-, E-, M-, N-rows) |
| `quality.test.ts` | Cp/Cpk (incl. one-sided), minimum sample size, yields, RTY, required starts, DOE run counts, RPN (Q-rows) |
| `cost.test.ts` | **legacy parity**: the Cost Platform's three templates reproduce every bucket, total and TEAL-sheet value from `tests/fixtures/legacy-golden.json`; landed cost, price-to-win, economics, scenarios |
| `configurator.test.ts` | **legacy parity**: 7 simulator cases — price, designation, spot, DOF, recommendations; compatibility and conflicts |
| `units.test.ts` | unit conversion, quantity parsing (original text preserved), currency never converted without FX |
| `gates.test.ts` | gate definitions from the handbook; rules R1–R5; critical path and cycle detection |
| `health.test.ts` | entity health dimensions and status rules, duplicate detection (normalisation, per-type only), Ask Intelligence answers only from matches and says UNKNOWN otherwise |
| `round3.test.ts` | business case cash flow / NPV / payback / sensitivity, market checks, LeadConnect records (schema-valid, linked, no duplicate customer, refusals), room presets |
| `attention.test.ts` | Mission Control attention ranking, de-duplication per record, closed work never raised |
| `ingestion.test.ts` | robots.txt (RFC 9309), refusals (disabled, http, outside inbox, 401/402/403/429, CAPTCHA), parsing with units, company normalization, dedupe conflicts, evidence, schema validation |

### Golden fixtures

`tests/fixtures/legacy-golden.json` is produced by `scripts/migration/generateLegacyGolden.cjs`,
which executes the **unchanged** legacy JavaScript (simulator `price/desig/optics/evalReco`,
cost platform `computeProject/tealSheet`) in a Node `vm` sandbox. Parity tests compare the OS
engines to those outputs. Regenerate only when a legacy app legitimately changes.

## Integration — `tests/integration/`

Real `/data` loaded through the same catalog-driven `StaticRepository` the app uses (filesystem
loader), IndexedDB via `fake-indexeddb`, a fresh workspace per test.

| File | Covers |
|---|---|
| `engineering.test.ts` | unit normalisation (original kept), specification rows with per-field evidence and source priority, spec validation, derived confidence (DEMO = Unverified), freshness, natural-language technical search (all six example queries), compatibility (rule vs recorded, rules never hidden by records, missing data = Unknown, protocol requirements), conflict detection, duplicate suggestion, change diffs, review queues, requirement quality and traceability |
| `simulation.test.ts` | laser process time, “cannot run because …”, cycle time / UPH / OEE / capacity / machine count, sequential vs inline, data lineage, discrete-event simulation (agrees with the capacity engine without variability, seeded repeatability, blocking/starvation, faults, replay), Monte Carlo percentiles, what-if, multi-level BOM and cost (currencies never mixed, missing FX → no total), scenario comparison, Pareto frontier, energy / maintenance / faults / calibration, supplier dependency, localization layers and disruption, design review, completeness, build and POC readiness, templates → scenarios, versions, sequence validation, twin layout, version diff, customer-mode report, rule-based drafts |
| `intelligenceOs.test.ts` | trust labels, TRL maturity rule, domains as data, parametric search on the example query, cross-domain evidence, application engine (and no machine without an application), all 11 document templates, requirement capture, lifecycle, new calculators |
| `masterData.test.ts` | every catalogued record validates; unique ids; no broken references; zero data-quality errors; DEMO labelling; no seeded results |
| `inquiry.test.ts` | flagship workflow for final-demo Scenario 1: platform choice, full thread drafted, all records schema-valid, references resolve, nothing fabricated, atomic save, all-or-nothing rejection |
| `thread.test.ts` | Product → BOM → Cost; Requirement → FAT/SAT → Traceability; Requirement → Module → BOM; Project → Gate |
| `threadServices.test.ts` | next action, what is missing, reuse, WHY? (record + calculation), graph links, search query syntax |
| `workspace.test.ts` | local draft principle (new / override / tombstone / discard), readable validation errors, change-package round trip, backup validation, lock never exported, legacy tracker and cost mapping, encrypted-vault message |
| `applyChangePackage.test.ts` | create / update / delete into a temp copy of `/data`, version bump, confidential-entity refusal, invalid records skipped |

## End-to-end — `tests/e2e/` (Playwright, Chromium)

| File | Covers |
|---|---|
| `studio.spec.ts` | **the §170 vertical slice**: scenario from a template with customer and requirement → “cannot run because …” → station times and laser inputs → laser, vision and PLC selection with live compatibility → save → cycle & capacity → discrete-event run with Play / Pause / Step → Monte Carlo → what-if → BOM and cost → design review → planned verification + result → measured value → report → derived scenario → version diff → customer mode; every Studio tab renders; Pareto frontier; digital-twin object data and fault state; engineering database search, compatibility, evidence and conflict resolution; specification editing; no page-level horizontal scroll at 320 / 390 / 768 / 1024 px |
| `smoke.spec.ts` | all 135 routes render with the right heading, exactly one `h1`, and **no runtime or console errors**; not-found page; demo labels visible |
| `workflows.spec.ts` | create customer → LOCAL DRAFT → change-package download; inquiry → package → opportunity → traceability; configuration → BOM + cost; FAT generation (NOT RUN); search; configurator physics/compatibility; backup download |
| `offline.spec.ts` | after one visit the app and data load offline and the shell says so |
| `intelligence.spec.ts` | health + relationship bar, compare, table/cards/board, saved views, board quick edit, Ask Intelligence, supplier risk matrix, unit converter, duplicates, route aliases |
| `rooms.spec.ts` | program room + pre-linked activity, rooms index, LeadConnect, business case, radar rings, multi-step forms, graph focus |
| `os.spec.ts` | master-prompt IA and sub-groups, business flow, executive board, application engine, cross-domain cell, parametric search, architecture tree, requirement capture, execution views, PRD generation + download, trust labels, LOCAL DATA sync state, development / value / settings / use cases |
| `shell.spec.ts` | navigation shell, command palette, search, shortcuts, quick create, drawers, tabs, pins, theme/density, workspaces, focus mode, help, onboarding, mobile, and **axe-core accessibility** (light + dark, 21 pages) |

`tests/e2e/fixtures.ts` fails any test that logs a page error or console error.

## Test data rules

* Fixtures never invent real-world facts. The ingestion fixture uses obviously fictional
  companies and models, test-only.
* Demo records used by tests are in `data/demo/` and labelled DEMO.

## 3D machine digital twin

- `tests/integration/twin.test.ts` — motion profiles, axis model from stage records, motion inside the canonical cycle, scene graph ↔ records, FOV and working distance, bounding-box collisions (clear demo; detected when the camera is lowered), axis limits, sub-steps only where data allows, deterministic replay, design check.
- `tests/integration/twin-all.test.ts` — the 3D machine works for **every** equipment template: each one builds, is collision-free, runs a sequence preview and has a tour and explanations. It also covers SCARA IK round-trip, pick-and-place phases and tool strokes. Every DEMO scenario runs, and `semi-marking` previews by design. It checks the SCARA assembly cell, the two parallel test nests with per-lane I/O, a robot that carries the part, a head-mode welder, the NG diverter firing only for parts the run rejects, and the contact-test narration.
- `tests/integration/twin-depth.test.ts` — S-curve (jerk-limited) move times and short-move peak speed, settling time only when entered (warning when missing), part transfer between inline stations from the entered distance and the conveyor's `max_speed` record (not included when no distance), articulated-arm IK/FK round-trip, 6-axis vs SCARA robot chosen from the record's axes, gripper-sweep collisions (detected against an injected obstacle, clear on every template), design-check findings grouped and mapped to components, stated utilities and live power from component specs only.
- `tests/integration/components.test.ts` — datasheets for every component, spec-text parsing (every token kept), vendor → supplier/company links, unknowns stay unknown.
- `tests/integration/architect.test.ts` — the machine architect builds stations from components: a galvo marker (operator load, fixture, scanned laser, mark verification, NG sorting), a welding head + axis instead of the scanner (head-and-gantry station, alignment), two sources → two parallel heads with a stated lens gap, conveyor → inline, robot → robot loading, robot + Assembly → assembly station, stated gaps with no invented times, the process read from the scenario, unused parts named, a rebuild on any component change that keeps entered times and changes the 3D machine without collisions, template mode never rebuilt, and a Copilot scenario built from components. `twin-all.test.ts` now covers all 70 templates, including the AI-drafted ones.
- `tests/e2e/builder.spec.ts` — the Builder panel: switching to *Build from components* with every station explained, removing a camera removes inspection and sorting, a welding head replacing the scanner changes the station and the 3D component tree, the utilization heat map table, and the glTF export download.
- `tests/e2e/twin.spec.ts` — renders, runs the cycle, jumps via events, component selection → datasheet, design check / motion / fault injection / assumptions, X-ray, camera modes, keyboard view, customer mode, component datasheets page, and non-laser machines: the test line (parallel test heads, NG diverter, contact-test narration), the SCARA assembly cell, and a new template machine that previews until its station times are entered and then runs. It also checks the workspace layout: the viewport is at least 85 % of the page width with one transport bar, studio mode fills the window and Esc exits it, the component tree and details drawers, design-check badges in the tree, grouped single-source findings, jerk and settling inputs, the camera-view inset, name-tag modes, a shared view link restoring time and selection, part trace and follow, the assembly-cell transfer input, and the 6-axis robot with its utilities.
- Playwright launches Chromium with software WebGL (`--use-angle=swiftshader --enable-unsafe-swiftshader`) so the 3D scene renders on GPU-less CI runners.

## AI intelligence layer

- `tests/integration/ai.test.ts` — gateway models OFFLINE with no provider configured and the local gateway refusing to complete (fallback chain), ML engines OFFLINE until real data reaches their thresholds (computed from the records), no provider key / endpoint in `src/services/ai`, cost-aware routing with the composer fallback and disabled-engine fallbacks, the intent engine on the gold set, query expansion, lexical vectors (unit length, spelling tolerance), hybrid retrieval legs and filters, reranking by constraint satisfaction, GraphRAG paths and derived edges, change impact (spec deltas, scenario re-checks, no invented cost), entity resolution, whitelisted natural-language queries (no SQL), requirement extraction (Not Defined for anything unstated), laser candidates from TEAL application records, the configurator pipeline, RFQ / URS / FMEA drafts (review banner, TO BE CONFIRMED, unscored S/O/D), DOE run counts and reproducibility, Bayesian optimisation (refusal below 5 measured runs; a SYNTHETIC test function only inside the test), the validator (unsourced claims removed, mismatching values CONFLICTING), confidence labels, the end-to-end flagship configuration answer, refused predictions, exact calculations, context answers, the evaluation thresholds (accuracy ≥ 0.9, Recall@10 ≥ 0.8, MRR ≥ 0.6, groundedness and citation accuracy 100 %, hallucination 0 %), DEMO data never VERIFIED, and decisions saved as validated `decision` drafts with feedback in the local log.
- `tests/e2e/ai.spec.ts` — the Copilot drawer answering the flagship requirement with the response contract, page context on a laser page (key **I**), change impact with a SPECIFICATION CONFLICT and a recorded decision, a refused prediction with feedback, the AI Engine Control Center (OFFLINE / DATA REQUIRED states, an engine switch, the in-browser evaluation), the AI Configurator stages and drafts, and the opt-in hybrid ranking on the search page (keyword results unchanged).
- `tests/helpers/ai.ts` builds the Copilot dependencies from the committed data and the built search indexes (falls back to an in-memory index when `public/search-index` is absent).
- Metrics and their honest reading: [docs/ai/AI_EVALUATION.md](ai/AI_EVALUATION.md).

