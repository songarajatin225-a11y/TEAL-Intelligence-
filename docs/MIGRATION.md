# Migration (how-to)

Plan and rationale: [05_MIGRATION_PLAN.md](05_MIGRATION_PLAN.md). Feature status:
[02_LEGACY_FEATURE_MAP.md](02_LEGACY_FEATURE_MAP.md).

## Legacy sources

| App | Repository |
|---|---|
| TEAL Laser Product Simulator | `songarajatin225-a11y/teal-laser-product-sim-2` |
| TEAL Cost Platform | `songarajatin225-a11y/teal-cost-platform-2` (and the older `teal-cost-demo-7-8`) |
| Product Management Tracker | `songarajatin225-a11y/product-tracker-` |

Clone them side by side, e.g. into `../songarajatin225-a11y/`.

## 1. Re-run the reference-data migration

```bash
LEGACY_ROOT=../songarajatin225-a11y npx tsx scripts/migration/migrateLegacy.ts
npm run data:validate && npm run data:catalog && npm run data:quality
git diff data/            # review, then commit via PR
```

Writes the datasets listed in 05 §Stage 1 with provenance (`source_id`, document, section),
`data_type` and verification status. Idempotent: ids are derived from legacy keys.

## 2. Re-embed the legacy apps

```bash
LEGACY_ROOT=../songarajatin225-a11y npm run legacy:embed
```

Copies the three apps into `public/legacy/{laser-simulator, cost-platform, pm-tracker}` and
re-applies the sanitisation (simulator admin PIN removed; cost platform seeded projects, audit
trail and customer master emptied). Review `git diff public/legacy` before committing.

## 3. Regenerate the golden fixtures (only if a legacy app changed)

```bash
LEGACY_ROOT=../songarajatin225-a11y node scripts/migration/generateLegacyGolden.cjs
npm test
```

If parity tests fail after regeneration, the legacy logic changed: port the change into
`src/features/configurator/engine.ts` or `src/calculations/cost.ts` deliberately.

## 4. Handbooks

```bash
pip install python-docx
python3 scripts/knowledge/docx_to_markdown.py <laser.docx> <automation.docx> <semiconductor.docx>
npx tsx scripts/knowledge/extractHandbookData.ts
npm run data:validate && npm test
```

The `.docx` sources are not committed (`knowledge/sources/*.docx` is git-ignored). See the
handbook note in [SECURITY.md](SECURITY.md) before publishing new versions.

## 5. Users' own legacy data (in the browser)

Each user, in the browser they used the legacy apps with:

1. Open the OS → **Admin → Data management → Import from legacy apps**.
2. *PM Tracker → Read from this browser* (reads the tracker's IndexedDB `laser_pm_tracker`
   read-only; nothing is created if it does not exist) — or import the tracker's backup JSON.
3. *Cost Platform → Read from this browser* (reads `localStorage['teal:costing:db:v1']`). If the
   data is an encrypted vault, unlock it in the legacy app, use its *Export JSON*, and import that
   file instead.
4. Review the counts and any rejected records, then *Import as local drafts*.

| Tracker | → OS |
|---|---|
| customers | `customer` (contacts kept) |
| pipeline / opportunities | `opportunity` (stage mapped: Lead, Discovery, Feasibility, POC, Proposal, Won, Lost) |
| activities, follow-ups, meetings, daily logs, weekly reviews | `activity` (kind task / meeting / daily_log / note) |
| applications | `application` |
| products | `laser_source` (kind product, category mapped) |
| samples / demos / trials | `poc` (status mapped) |
| localization, suppliers, competitors | `localization`, `supplier`, `company` |

| Cost Platform | → OS |
|---|---|
| projects | `cost_model` (all module lines, landed, markup, TEAL parameters, status, revision note) |
| project customers | `customer` (linked from the cost model) |

Imported records are `USER_CREATED` / `DRAFT`, tagged `legacy-tracker` / `legacy-cost`, and stay
in the browser until exported as a change package — and customer-type records should normally
stay out of this public repository altogether.
