# 02 — Legacy Feature Map (LEGACY → OS MIGRATION MAP)

Columns follow spec §131: feature · current implementation · data · business logic ·
reusable component · duplicate · missing · migration action. "Phase" is the roadmap phase in
`06_IMPLEMENTATION_ROADMAP.md`; the **Status** column is kept current as work lands.

Legend — Status: ✅ migrated · 🔗 preserved via embedded legacy app · ⏳ planned · ✖ intentionally not migrated

## A. TEAL Laser Product Simulator → TEAL PRODUCT CONFIGURATOR 2.0

| Feature | Current implementation | Data | Business logic | Reusable | Duplicate with | Missing today | Migration action | Phase | Status |
|---|---|---|---|---|---|---|---|---|---|
| Family / platform / application selection | 6-step wizard in `index.html` | `FAM`, `PLAT`, `PLAT[].apps` | Defaults, `stdSeed`, `snapPower`, `powersFor` | Data + logic | — | Provenance, versioning | Port to `features/configurator`; data → `data/products`, `data/applications` | P0 | ✅ |
| Source / power / objective | Step 04 | `SRC`, `LENS`, `pw`, `pwBySrc` | Power snapping per source | Logic | Laser/Optics DBs | Manufacturer products | Port; source classes → `data/laser`, objectives → `data/optics` | P0 | ✅ |
| Optics (spot, DOF) | `optics()` | `SRC.um/m2/dia`, `LENS.f` | d = 4λfM²/(πD); DOF = ±πd²/(4M²λ) | Formula | Calculator engine | Formula provenance | `calculations/laser.ts` with handbook citation (Automation Part 54 L1/L2) | P0 | ✅ |
| Process physics | `physics()` | `MAT`, `SRC` | Pulse energy, P_peak, fluence, irradiance, regime, absorption, diffusion length, wall-plug, chiller | Formulas | DOE engine | Assumption list | `calculations/laser.ts` (`processPhysics`) | P0 | ✅ |
| Automation modules + standard content | Step 05 | `MOD`, `PLAT.std` | Standard content never charged twice | Data | Module Library | Module DNA fields | Modules → `data/modules`; Module DNA fields UNKNOWN until documented | P0 | ✅ |
| Fitment | `modFits()` | `MODFIT` | Family/delivery/material gates | Logic | Compatibility engine | — | Port to `configurator/engine.ts`; exposed as compatibility rules | P0 | ✅ |
| Module conflicts | `modConflicts()` (in-code) | `MODCONFLICT` | 7 exclusive pairs | Logic | Compatibility engine | Was not in data | Moved into `data/modules/module-conflicts.json` | P0 | ✅ |
| Recommendation rules | `evalReco()` | `RECO` 27 rules | Condition match + fitment gating | Logic + data | Why? engine | — | Port; each recommendation shows its rule as WHY? evidence | P0 | ✅ |
| Price band | `price()` | `PLAT.base`, `SRC.prem`, `RULES` | Parametric ex-works estimate ± band | Logic | Cost engine | Marked as estimate | Port; always labelled ESTIMATE; feeds Cost Engine as an assumption | P0 | ✅ |
| Designation code | `desig()` | — | `TEAL-<code>-<src>-<W>-<lens>-<nn>M-<sw>` | Logic | — | — | Port | P0 | ✅ |
| Inquiry text parser | lexicon scoring | `LEX` | Term matching → top platforms | Logic + data | Customer Inquiry → Product | Drafting of other objects | Reused as the first stage of the flagship "Create product from inquiry" workflow | P0 | ✅ |
| URL-hash shareable state | `encodeState/readHash` | — | — | Format | Configuration export | — | OS configurations generate the same hash → open in legacy 3D simulator | P0 | ✅ |
| 3D machine view, run-cycle simulation, faults, layers | ~6,000 lines painter's-algorithm engine | derived | Cycle timing model | UI (large) | — | — | **Preserved** by embedding the legacy file unchanged at `/legacy/laser-simulator/` | P0 | 🔗 |
| DFM report PDF | Direct PDF 1.4 writer | derived | Design rules by family | UI | Engineering package generator | — | Preserved via embed; native DFM content ⏳ | P1 | 🔗 |
| Admin panel (values editor, undo, change log, health check, rule & 3D sweeps) | In-page | `data.json` | Health check | Concept | Admin / Data Management, Data Quality CI | — | Replaced by Data Management mode + CI data-quality; legacy admin still reachable in embed | P0 | ✅ / 🔗 |
| Admin PIN | `RULES.adminPin` in public JSON | — | — | ✖ | — | — | **Not migrated** (not a security control) | — | ✖ |

## B. TEAL Cost Platform → TEAL COST ENGINE

| Feature | Current implementation | Data | Business logic | Reusable | Duplicate with | Missing today | Migration action | Phase | Status |
|---|---|---|---|---|---|---|---|---|---|
| 12 cost modules (line grids) | `MODULES[].calc` | project `lines` | Per-module formulas | Formulas | BOM Engine (material) | Link to BOM/config | `calculations/cost.ts` `lineAmount()` per module | P0 | ✅ |
| Project roll-up | `computeProject()` | `landed`, `markup` | direct → OH → contingency → profit → selling; margins | Logic | — | ROI, payback, cost/part | Port + extend (ROI, payback, cost per part, life-cycle) | P0 | ✅ |
| TEAL cost sheet A/B/C/D | `tealSheet()` | `teal` params | Gross-up D = C/(1−p−w) | Logic | Handbook C1 | — | Port; cites Automation Part 54 C1 | P0 | ✅ |
| Landed cost | material bucket × % | `landed` | basic + freight + duty + landing; GST excluded | Logic | Handbook C4 | FX date/source | Landed-cost calculator preserving original currency, FX, date, source (spec §49) | P0 | ✅ |
| Approval floor | `approvalFloor()` | `approval` | Min margin by order-value band | Logic | Gates | — | Port; shown on cost model | P0 | ✅ |
| Item master + catalogue discipline | Masters screen | `item` 58 | Coverage, drift, stale > 180 d | Logic | Component DB | Verification | Items → `data/components/item-master.json` (DEMO); stale rule reused in Data Quality | P0 | ✅ |
| Rate masters | Masters | process/labour/engineering/material/tax/freight/plant | Fill-down rates | Data | — | Source/date | → `data/cost/rates.json` (DEMO, verification UNKNOWN) | P0 | ✅ |
| Templates | Templates screen | 3 templates | Seed a project | Data | Cost scenarios | — | → `data/cost/cost-templates.json` (DEMO) | P0 | ✅ |
| Price-to-win, cost drivers, margin sensitivity | Summary panels | computed | Back-solve mark-up; top-20 lines; swings | Logic | Scenario engine | — | Price-to-win + scenarios ported; sensitivity via scenarios | P0 | ✅ |
| Revisions / audit / approvals workflow | In-app | `revisions`, `audit` | Status workflow | Concept | Git history, gates | — | Replaced by versioned local cost models + change packages; Git history is the audit trail | P0 | ✅ |
| Vault encryption (AES-GCM) | `encrypt.html` | — | Real encryption | Concept | Local workspace lock | — | Not re-implemented in P0; documented as the pattern for confidential data | P2 | ⏳ |
| Seeded projects (real customer names + fabricated jobs) | `projects.json` | — | — | ✖ | — | — | **Not republished.** User imports own data via Admin → Legacy import | — | ✖ |
| Whole app | — | — | — | — | — | — | Preserved via embed at `/legacy/cost-platform/` with customer master and projects **removed** from the embedded seed | P0 | 🔗 |

## C. Product Management Tracker → TEAL PRODUCT MANAGER COMMAND CENTER

| Feature | Current implementation | Data | Business logic | Reusable | Duplicate with | Missing today | Migration action | Phase | Status |
|---|---|---|---|---|---|---|---|---|---|
| Activities | CRUD page | `activities` | Overdue / follow-up derivation | Schema + logic | OS Activities | Links to entities | Native OS Activities with typed links (customer, opportunity, product) | P0 | ✅ |
| Customers | CRUD | `customers` | Next interaction | Schema | OS Customers/Companies | Company/site/contacts split | Native Customers | P0 | ✅ |
| Applications | CRUD | `applications` | — | Schema | Application Library | — | Imported as applications (USER_CREATED) | P0 | ✅ |
| Products (laser diode parts) | CRUD | `products` | — | Schema | Laser/Product DB | — | Imported as external products | P0 | ✅ |
| Meetings | CRUD | `meetings` | Follow-ups | Schema | Activities | — | Native Meetings (activity kind = meeting) | P0 | ✅ |
| Samples / demos / trials | CRUD | `samples` | — | Schema | POC Engine | — | Imported as POC records (stage from sample status) | P0 | ✅ |
| Localization | CRUD | `localization` | Stages | Schema | Localization Engine | — | Imported; native Localization Engine ⏳ | P1 | ✅ import / ⏳ engine |
| Suppliers / partners | CRUD | `suppliers` | — | Schema | Supplier Intelligence | — | Imported as suppliers | P0/P1 | ✅ |
| Competitors | CRUD | `competitors` | Threat level | Schema | Market Intelligence | — | Imported as competitor notes | P1 | ✅ import |
| Daily log / weekly review | CRUD | `dailyLogs`, `weeklyReviews` | — | Schema | PM workspace notes | — | Imported as workspace notes | P0 | ✅ |
| Dashboard / reports | Pages | derived | KPIs | Concept | Command Center, PM workspace | — | Rebuilt natively | P0 | ✅ |
| Backup / restore JSON, CSV export | export.js | all | — | Format | Workspace backup | — | OS backup + legacy backup importer | P0 | ✅ |
| Local login (PBKDF2) | auth.js | settings | — | Concept | LOCAL WORKSPACE LOCK | — | OS offers an optional *local workspace lock*, labelled as such | P0 | ✅ |
| Whole app | — | — | — | — | — | — | Preserved via embed at `/legacy/pm-tracker/` | P0 | 🔗 |

## D. Duplicates resolved by the OS

| Concept | Simulator | Cost Platform | Tracker | OS single entity |
|---|---|---|---|---|
| Customer | industry only | `masters.customer` | `customers` | `customer` (+ `company`) |
| Product | `PLAT` platforms | `machine` free text | `products` (diode parts) | `product` (TEAL platforms) + `laser_source`/external `product` records |
| Application | `PLAT.apps` | category | `applications` | `application` |
| Supplier | vendor examples in text | `masters.vendor` | `suppliers` | `supplier` |
| Price / cost | `price()` band | full cost model | est. value | `cost_model` (config price band enters as an assumption) |
| Status / next action | — | project status | activity next action | `next_action` on every active record |
