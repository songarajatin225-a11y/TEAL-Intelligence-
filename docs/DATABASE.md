# Database

V1 has two stores and no server.

## 1. Master data — Git (`/data`)

The "database of record" is the JSON under `/data`, versioned by Git and reviewed in pull
requests. Each file is a **dataset**:

```json
{
  "dataset": { "id": "platforms", "title": "TEAL laser platforms (products)", "description": "…", "entity": "product",
               "version": "1.0.0", "last_updated": "2026-09-26", "data_type": "TEAL_INTERNAL",
               "source_ids": ["src-legacy-laser-sim", "src-teal-catalogue-2026"], "partition": "products" },
  "records": [ { "id": "prd-markf", "entity": "product", "name": "…", "data_type": "…", "provenance": { … } } ]
}
```

Configuration datasets use `"kind": "config"` and a `config` object instead of `records`.
`data/catalog.json` (generated) lists every dataset with record count, version, schema path and
a content hash; the app loads datasets lazily through it. Demo datasets may use relative dates
(`"@today+3"`) resolved at load time so the demo never looks stale.

Rules enforced in CI: one entity per dataset, id prefix per entity, globally unique ids, every
record valid against its schema, references resolve, sources registered (data quality).

## 2. Local workspace — IndexedDB (`teal-os-workspace`, Dexie)

| Table | Key | Holds |
|---|---|---|
| `drafts` | `id` | full record + `overrides_master` (edit of a master record) + `deleted` (local tombstone) |
| `changelog` | `++seq` | every local create / update / delete / restore with a summary |
| `recent` | `id` | recently visited records |
| `saved` | `++id` | saved searches |
| `prefs` | `key` | preferences, architecture canvas layouts, the optional workspace-lock hash |
| `notifications` | `++id` | reserved for in-app notices |

Semantics (`MergedRepository`):

* a draft with a new id → **LOCAL_NEW**; a draft with a master id → **LOCAL_DRAFT** (overrides
  master in this browser only); a tombstone hides a master record in this browser only;
  *Discard local draft* restores master.
* every write validates the record against its schema first; batch saves (`saveMany`, used by
  the inquiry package, imports) are all-or-nothing.
* nothing in IndexedDB reaches GitHub until you export a change package and it is merged.

IndexedDB is per browser profile. Clearing site data deletes drafts — export a **workspace
backup** (Admin → Data management) regularly.

## 3. Moving data between them

| From → To | How |
|---|---|
| Workspace → Git | Change package ZIP → `npm run data:apply -- <zip>` → PR |
| Git → workspace | automatic (master data loads on start; new deploys are picked up on reload) |
| Browser ↔ browser | Workspace backup JSON (validated on import; the lock is never exported) |
| Legacy apps → workspace | Admin → Import from legacy apps (same-origin storage or export files) |
| Any list ↔ file | CSV / JSON export and import on every entity list |
