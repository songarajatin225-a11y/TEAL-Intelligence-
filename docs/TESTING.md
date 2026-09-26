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
| `masterData.test.ts` | every catalogued record validates; unique ids; no broken references; zero data-quality errors; DEMO labelling; no seeded results |
| `inquiry.test.ts` | flagship workflow for final-demo Scenario 1: platform choice, full thread drafted, all records schema-valid, references resolve, nothing fabricated, atomic save, all-or-nothing rejection |
| `thread.test.ts` | Product → BOM → Cost; Requirement → FAT/SAT → Traceability; Requirement → Module → BOM; Project → Gate |
| `threadServices.test.ts` | next action, what is missing, reuse, WHY? (record + calculation), graph links, search query syntax |
| `workspace.test.ts` | local draft principle (new / override / tombstone / discard), readable validation errors, change-package round trip, backup validation, lock never exported, legacy tracker and cost mapping, encrypted-vault message |
| `applyChangePackage.test.ts` | create / update / delete into a temp copy of `/data`, version bump, confidential-entity refusal, invalid records skipped |

## End-to-end — `tests/e2e/` (Playwright, Chromium)

| File | Covers |
|---|---|
| `smoke.spec.ts` | all 73 routes render with the right heading, exactly one `h1`, and **no runtime or console errors**; not-found page; demo labels visible |
| `workflows.spec.ts` | create customer → LOCAL DRAFT → change-package download; inquiry → package → opportunity → traceability; configuration → BOM + cost; FAT generation (NOT RUN); search; configurator physics/compatibility; backup download |
| `offline.spec.ts` | after one visit the app and data load offline and the shell says so |
| `intelligence.spec.ts` | health + relationship bar, compare, table/cards/board, saved views, board quick edit, Ask Intelligence, supplier risk matrix, unit converter, duplicates, route aliases |
| `rooms.spec.ts` | program room + pre-linked activity, rooms index, LeadConnect, business case, radar rings, multi-step forms, graph focus |
| `shell.spec.ts` | navigation shell, command palette, search, shortcuts, quick create, drawers, tabs, pins, theme/density, workspaces, focus mode, help, onboarding, mobile, and **axe-core accessibility** (light + dark, 14 pages) |

`tests/e2e/fixtures.ts` fails any test that logs a page error or console error.

## Test data rules

* Fixtures never invent real-world facts. The ingestion fixture uses obviously fictional
  companies and models, test-only.
* Demo records used by tests are in `data/demo/` and labelled DEMO.
