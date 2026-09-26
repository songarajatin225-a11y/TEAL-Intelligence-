# Architecture

The design rationale is in [03_TARGET_ARCHITECTURE.md](03_TARGET_ARCHITECTURE.md). This page
describes the code as built.

## Runtime

```
index.html → src/main.tsx → App
  WorkspaceLockGate            optional LOCAL WORKSPACE LOCK (convenience only)
    DataProvider               loads catalog + all master datasets + local drafts → merged records,
                               knowledge graph, configurator pricing, inquiry lexicon, cost defaults
      RouterProvider           createHashRouter (GitHub Pages has no rewrites → #/deep/links)
        Layout                 sidebar (spec §117), top search, Ctrl+K palette, OFFLINE MODE,
                               local-draft counter, WhyProvider (WHY? drawer)
          RouteError           per-page error boundary (what / why / what to do)
          <lazy feature page>  one chunk per page
```

`DataProvider` re-derives everything when the local workspace changes (`workspaceBus`), so a
saved draft appears immediately in lists, graph, search, gaps and dashboards.

## Layers

| Layer | Path | Notes |
|---|---|---|
| Domain | `src/domain/` | Zod schemas for 42 entities (`entities.ts`), shared record shape (`common.ts`), registry with id prefixes, routes and search partitions (`registry.ts`). Types, runtime validation, CI validation and `schemas/*.schema.json` all come from here. |
| Calculations | `src/calculations/` | Pure functions returning `CalcResult` — formula, inputs with units, value, unit, assumptions, source citation, status. Missing inputs give `INSUFFICIENT_DATA`, never a guess. `laser.ts`, `automation.ts`, `quality.ts`, `cost.ts`, `units.ts`. |
| Repositories | `src/repositories/` | `StaticRepository` (catalog-driven lazy fetch of `/data`), `WorkspaceRepository` (Dexie/IndexedDB drafts, overrides, tombstones, change log), `MergedRepository` (master ∪ drafts with origin `MASTER` / `LOCAL_DRAFT` / `LOCAL_NEW`). |
| Services | `src/services/` | Digital-thread logic, UI-independent and unit-tested: `graph`, `refs`, `search`, `searchDocs`, `similarity` (reuse), `gaps` (what is missing), `nextAction`, `why`, `inquiry`, `bomGen`, `gates`, `schedule`, `fatSat`, `traceability`, `changePackage`, `backup`, `legacyImport`, `dataQuality`, `aiContext`, `knowledgeChunks`. |
| Features | `src/features/<module>/` | Pages and record views. `entities/` holds the schema-driven generic list, record page and form used by every entity; specialised views plug into `RecordPage` by entity. |
| Components | `src/components/` | UI primitives, badges (data type, verification, origin, status), virtualised `DataTable`, `EntityForm` (React Hook Form + schema validation), WHY? drawer, thread panels, safe Markdown renderer. |
| App shell | `src/app/` | Router, layout, navigation, command palette, workspace lock, route error. |

## Build pipeline

```
npm run build
  data:validate   scripts/data/validateData.ts        every dataset vs. Zod schemas, ids, prefixes, duplicates
  data:schemas    scripts/data/generateJsonSchemas.ts schemas/<entity>.schema.json
  data:catalog    scripts/ingestion/generateCatalog.ts data/catalog.json (counts, versions, sha256)
  data:publish    scripts/data/publishData.ts         data/, knowledge/, schemas/ → public/
  data:graph      scripts/data/generateGraph.ts       public/graph/graph.json
  data:index      scripts/ingestion/generateSearchIndex.ts  public/search-index/<partition>.json
  tsc -b && vite build                                 dist/ (chunks: react, data, charts, per page)
```

## Digital thread

References are ordinary fields (`customer_id`, `product_id`, `module_ids`, `links[]` …).
`services/refs.ts` extracts them; `services/graph.ts` builds forward/backward edges over master
data **and** local drafts. Everything that "knows what is connected" — linked records, WHY?,
what is missing, similar/reusable, next action, traceability, dashboards — reads that graph.

## Offline

`public/sw.js` caches the app shell; `/data`, `/search-index`, `/graph` and `/knowledge` are
network-first with the cached copy served offline; hashed assets are cache-first. Legacy apps are not intercepted. When offline the top bar
shows **OFFLINE MODE**; local drafts keep working because they live in IndexedDB.

## Future backend

UI code only talks to repositories and services. A later `ApiRepository` (for a private,
authenticated deployment) can replace `StaticRepository`/`WorkspaceRepository` without feature
changes. **Not built in V1.**
