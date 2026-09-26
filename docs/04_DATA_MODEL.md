# 04 — Data Model (design)

The field-level reference (all 42 entities, every dataset, nested structures) is
[DATA_MODEL.md](DATA_MODEL.md). This page records the decisions behind it.

## 1. One schema, four uses

Zod schemas in `src/domain/` are the only definition. From them come: TypeScript types (compile
time), browser validation of every local save and import, CI validation of every dataset
(`data:validate`), and published JSON Schemas (`schemas/`, `data:schemas`) for tools outside the
codebase. Nothing is typed twice.

## 2. Honesty is part of the record (spec §17–§18)

Every record carries `data_type` and `provenance.verification_status`. They are required fields
— a record without them fails validation. The UI shows both as badges everywhere a record
appears. Consequences built into the model:

* **Unknown is a value.** `Quantity.value` and most numeric fields are nullable; `null` renders
  as **UNKNOWN**. Calculations with missing inputs return `INSUFFICIENT_DATA` rather than a number.
* **Prices say what they are.** BOM lines carry `cost_basis` (QUOTED · CATALOGUE · ESTIMATE ·
  DEMO · UNKNOWN); only an RFQ selection sets QUOTED. Platform prices are ESTIMATE; legacy
  masters are DEMO.
* **Results are never seeded.** DOE runs, POC results and FAT/SAT tests start empty /
  `NOT RUN`; integration tests assert no master record claims a result.
* **Source units survive.** `Quantity.original` keeps the published text next to the
  normalised value (spec §87).

## 3. Identity

`<prefix>-<slug>` ids, prefix fixed per entity (`prd-`, `cus-`, `opp-` …). Master ids are
readable slugs derived from legacy keys (`prd-markf`, `mod-vision`); local ids are
`<prefix>-L<time36><rand>` so they never collide with master and survive into Git unchanged.
Legacy imports derive ids from legacy ids, so re-importing updates instead of duplicating.

## 4. Relationships are fields

Typed reference fields (`customer_id`, `product_id`, `module_ids`, `trace.module_ids` …) plus a
generic `links[{rel, target}]` with the spec §80 edge types. No join tables: the knowledge graph
is computed from these fields at build time (`public/graph/graph.json`) and in the browser
(including drafts). CI fails on any reference to a non-existent id.

## 5. Partitioning (spec §103)

Files are split by domain (`data/products/`, `data/laser/`, `data/modules/`, `data/demo/` …),
never one huge JSON. The catalog lets the app load lazily. Search is partitioned the same way
(products, companies, suppliers, laser, modules, applications, knowledge, research, patents,
records).

## 6. Demo data is separate

All demonstration records live in `data/demo/` with `data_type: DEMO`, use relative dates, and
reference only real master data (platforms, gates, modules) — never fabricated suppliers, prices
or results. Deleting `data/demo/` leaves a valid dataset.

## 7. Entity map by digital-thread stage

| Stage | Entities |
|---|---|
| Market & customer | `company`, `customer`, `opportunity`, `activity`, `industry` |
| Requirement | `requirement` |
| Application & process | `application`, `material`, `laser_source`, `optic`, `galvo`, `semi_step`, `formula` |
| Product | `product_family`, `product`, `module`, `module_conflict`, `rule`, `configuration` |
| Validation | `poc`, `doe`, `acceptance` |
| Commercial | `bom`, `component`, `cost_model`, `supplier`, `rfq`, `localization`, `reference` |
| Delivery | `project`, `gate_definition`, `risk`, `decision`, `change_request` |
| Operations | `machine`, `service_ticket` |
| Knowledge | `source`, `evidence`, `lesson`, `technology`, `standard`, `vocabulary` |
