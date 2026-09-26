# 03 — Target Architecture

## 1. Constraint

GitHub-only V1: **no backend, no external database, no auth server.**
GitHub = master repository · GitHub Actions = validation/processing · GitHub Pages = hosting ·
the browser = the application · IndexedDB = local working database.

```
                    GITHUB (master)
                       │
         ┌─────────────┼─────────────┐
       CODE           DATA        KNOWLEDGE
     /src          /data/**      /knowledge/handbooks/**
         └─────────────┼─────────────┘
                GITHUB ACTIONS
     validate.yml · data-quality.yml · test.yml · search-index.yml · build.yml · deploy.yml
                       │
            scripts/data/*  scripts/ingestion/*
     validate → catalog → publish(public/data) → graph → search-index → vite build
                       │
                GITHUB PAGES  (dist/, base = /TEAL-Intelligence-/)
                       │
              REACT APPLICATION (HashRouter)
              ┌────────┴──────────┐
       STATIC DATA (fetch, lazy)   INDEXEDDB (Dexie) — LOCAL WORKSPACE
       /data/<dataset>.json        drafts · activities · configs · cost models
       /search-index/<part>.json   saved searches · notes · preferences
       /graph/graph.json           change packages (export)
```

## 2. Layers in `src/`

| Layer | Folder | Responsibility |
|---|---|---|
| Domain | `src/domain` | Zod schemas = single source of truth for types, runtime validation, JSON Schema generation (`schemas/`) |
| Calculations | `src/calculations` | Pure functions returning `CalcResult {formula, inputs(units), result, unit, assumptions, source}` — laser, automation, cost, quality, units |
| Repositories | `src/repositories` | `DataRepository<T>` interface; `StaticRepository` (fetch + cache), `WorkspaceRepository` (Dexie), `MergedRepository` (master ∪ local drafts). A future `ApiRepository` implements the same interface — **not built in V1** |
| Services | `src/services` | Digital-thread services: graph, search, similarity/reuse, gap ("what is missing"), next action, why/evidence, inquiry→product, change package, backup, legacy import, AI context |
| Features | `src/features/*` | One folder per module (spec §126) |
| Components | `src/components` | UI primitives (shadcn-style, no Radix dependency), data table, entity form, badges, empty/error/loading states, Why? drawer, command palette |
| App shell | `src/app` | Router, layout, navigation, providers, offline indicator |

## 3. Record model (every record)

```
{ id, entity, name, description?, data_type, provenance{source_id?, source_url?, document?,
  section?, retrieved_at?, last_verified?, verification_status, confidence?, note?},
  tags?, links?[{rel, target, note?}], status?, owner?, next_action?, created_at?, updated_at?, version? }
```

* `data_type` ∈ TEAL_INTERNAL · PUBLIC · EXTERNAL · DEMO · CALCULATED · INFERRED · AI_GENERATED · USER_CREATED — shown as a badge on every record; never silently mixed.
* `verification_status` ∈ VERIFIED · SOURCE_DOCUMENTED · CALCULATED · INFERRED · DRAFT · ASSUMPTION · UNKNOWN · CONFLICTED · STALE.
* Typed reference fields (`customer_id`, `product_id`…) plus generic `links[]` build the **Knowledge Graph** at build time (`scripts/data/generateGraph.ts`) and live in the browser (`services/graph.ts`) including local drafts.

## 4. Local draft principle

Records created/edited in the browser are stored in IndexedDB with `origin: LOCAL_DRAFT` and a
**LOCAL DRAFT** badge. The UI never claims GitHub master data has changed. Users export a
**TEAL CHANGE PACKAGE** (zip-less folder layout serialised as JSON: `manifest.json`, `data/`,
`changes/`, `documents/`) and commit it via PR; `scripts/data/applyChangePackage.ts` applies it
to `/data` for review.

## 5. Search

Build time: `scripts/ingestion/generateSearchIndex.ts` → `public/search-index/<partition>.json`
(MiniSearch serialised). Partitions: products, companies, suppliers, laser, modules,
applications, knowledge, research, patents, records (everything else). Loaded lazily per
partition; local drafts indexed in-browser at runtime.

## 6. Deployment

`deploy.yml` builds on push to `main` and publishes `dist/` with `actions/deploy-pages`.
Vite `base` = `/<repo>/` from `GITHUB_REPOSITORY` (fallback `/TEAL-Intelligence-/`); HashRouter
avoids 404s on deep links. Legacy apps are copied verbatim into `public/legacy/*`.

## 7. PWA

`public/sw.js` caches the app shell + core datasets (stale-while-revalidate for data). The top
bar shows **OFFLINE MODE** when `navigator.onLine` is false and data is labelled "cached".

## 8. AI

No AI dependency. The AI layer is an **AI Context Generator** + **Prompt Library** that
assembles a structured, copyable context for any object. No API keys anywhere in the frontend.

## 9. Future backend readiness

All UI reads go through repository interfaces and services. Replacing `StaticRepository` +
`WorkspaceRepository` with an `ApiRepository` (Supabase/Postgres or internal server) requires
no feature changes. Not implemented in V1 by design.
