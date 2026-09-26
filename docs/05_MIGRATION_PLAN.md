# 05 — Migration Plan

Feature-by-feature status lives in [02_LEGACY_FEATURE_MAP.md](02_LEGACY_FEATURE_MAP.md); how to
run the migration scripts is in [MIGRATION.md](MIGRATION.md).

## Principles

1. **Do not delete useful functionality.** All three legacy apps keep running, unchanged, under
   `/legacy/` until every feature has a native equivalent that users prefer.
2. **Do not blindly rewrite.** Business logic is ported function by function and proven
   identical against *golden fixtures* produced by executing the untouched legacy JavaScript.
3. **Migrate reference data, not confidential working data.** Catalogues, rules, rates and
   vocabularies move into `/data` with provenance. Users' own customers, pipelines and cost
   projects move only into their own browser workspace.
4. **Keep it deployable.** Every step lands behind passing CI.

## Stage 1 — Reference data → `/data` (done)

| Source | Target | Labelled |
|---|---|---|
| Simulator `data.json` / `index.html` (platforms, sources, objectives, materials, modules, fitment, conflicts, rules, lexicon, pricing) | `data/products`, `data/laser`, `data/optics`, `data/materials`, `data/applications`, `data/modules`, `data/knowledge`, `data/config` | TEAL_INTERNAL; prices ESTIMATE; admin PIN dropped |
| Cost Platform masters (items, rates, vendors, templates, defaults) | `data/components`, `data/cost`, `data/suppliers`, `data/config` | DEMO (seed values, not quotations); vendor ratings dropped |
| PM Tracker `schema.js` vocabularies | `data/knowledge/vocabularies.json` | TEAL_INTERNAL |
| Three handbooks (.docx) | `knowledge/handbooks/**` (Markdown) + extracted gates, formulas, value chain, companies, evidence, technologies, acceptance checklists | TEAL_INTERNAL / SOURCE_DOCUMENTED, with section citations |

Tooling: `scripts/migration/migrateLegacy.ts`, `scripts/knowledge/docx_to_markdown.py`,
`scripts/knowledge/extractHandbookData.ts`.

## Stage 2 — Logic → engines (done)

| Legacy logic | OS module | Proof |
|---|---|---|
| Simulator `price`, `desig`, `optics`, `physics`, `evalReco`, `modFits`, `modConflicts`, URL hash | `features/configurator/engine.ts`, `calculations/laser.ts` | 7 golden simulator cases (price, designation, spot, DOF, recommendations) |
| Cost Platform `computeProject`, module formulas, `tealSheet`, `approvalFloor`, landed cost | `calculations/cost.ts` | 3 golden templates (all buckets, totals, TEAL sheet) |
| Tracker overdue/follow-up logic | `services/nextAction.ts` | unit/integration tests |

## Stage 3 — Working data → user workspace (done, user-driven)

Admin → **Import from legacy apps** reads the tracker's IndexedDB and the cost platform's
localStorage on the shared GitHub Pages origin (without creating anything if absent), or the
apps' export files. Records become LOCAL DRAFTS (USER_CREATED / DRAFT), ids derived from legacy
ids. Encrypted cost vaults must be exported from the legacy app first — the OS does not handle
the passphrase.

## Stage 4 — Legacy embeds retire (future)

A legacy app is removed from `/legacy/` only when (a) every row of its section in the feature map
is ✅, (b) its users confirm, and (c) its data has been imported. The 3D simulator view stays
embedded for now — the OS links configurations to it by URL hash.

## Not migrated, on purpose

| Item | Why |
|---|---|
| Simulator admin PIN | Readable in page source — not a security control |
| Cost platform seeded projects, audit log, customer master | Pair real customer names with illustrative jobs and prices |
| Vendor ratings | Subjective, undocumented; would read as verified supplier scoring |
| Cost platform AES vault | Real encryption for a different threat model; V1 keeps confidential data out of the public site instead (see SECURITY.md) |
