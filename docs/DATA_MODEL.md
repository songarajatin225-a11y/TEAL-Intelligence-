# Data model (reference)

Source of truth: `src/domain/` (Zod). JSON Schemas generated from it: `schemas/<entity>.schema.json`.
Design decisions: [04_DATA_MODEL.md](04_DATA_MODEL.md).

## Every record

| Field | Type | Meaning |
|---|---|---|
| `id` | `<prefix>-<slug>` | unique across all data; prefix fixed per entity (below). Local records: `<prefix>-L<time><rand>` |
| `entity` | string | entity type |
| `name`, `description?` | string | |
| `data_type` | TEAL_INTERNAL · PUBLIC · EXTERNAL · DEMO · CALCULATED · INFERRED · AI_GENERATED · USER_CREATED | what kind of data this is — always shown as a badge |
| `provenance` | `{ verification_status, source_id?, source_url?, document?, section?, page?, retrieved_at?, last_verified?, confidence?, note? }` | where it came from and how far to trust it |
| `verification_status` | VERIFIED · SOURCE_DOCUMENTED · CALCULATED · INFERRED · DRAFT · ASSUMPTION · UNKNOWN · CONFLICTED · STALE | |
| `tags?`, `links?[{rel, target, note?}]` | | `rel` ∈ manufactures, uses, compatible_with, applies_to, built_from, supplied_by, tested_by, derived_from, similar_to, used_in, requires, validated_by, learned_from, belongs_to, references, evidence_for |
| `status?`, `owner?` | string | |
| `next_action?` | `{ action, due?, owner? }` | required (warned) on active opportunities, requirements, POCs, projects, risks |
| `created_at?`, `updated_at?`, `version?`, `notes?` | | |

Physical values use `Quantity { value | null, unit, original?, status? }` — the source text is
kept in `original`; `value: null` means UNKNOWN.

## Entities

| Entity | Prefix | Label | Route | Search partition | Next action required | Master records |
|---|---|---|---|---|---|---|
| `company` | `co-` | Company | `/companies` | companies | — | 60 |
| `customer` | `cus-` | Customer | `/customers` | companies | — | 3 |
| `opportunity` | `opp-` | Opportunity | `/opportunities` | records | yes | 3 |
| `activity` | `act-` | Activity | `/activities` | records | — | 7 |
| `requirement` | `req-` | Requirement | `/requirements` | records | yes | 6 |
| `industry` | `ind-` | Industry | `/applications` | applications | — | 8 |
| `application` | `app-` | Application | `/applications` | applications | — | 76 |
| `material` | `mat-` | Material | `/materials` | applications | — | 19 |
| `laser_source` | `las-` | Laser source | `/laser` | laser | — | 12 |
| `optic` | `opt-` | Optic | `/optics` | laser | — | 5 |
| `galvo` | `gal-` | Galvo scanner | `/galvo` | laser | — | 0 |
| `standard` | `std-` | Standard | `/knowledge` | knowledge | — | 15 |
| `module` | `mod-` | Module | `/modules` | modules | — | 34 |
| `module_conflict` | `mcf-` | Module conflict | `/modules` | modules | — | 7 |
| `product_family` | `fam-` | Product family | `/products` | products | — | 7 |
| `product` | `prd-` | Product | `/products` | products | — | 22 |
| `rule` | `rul-` | Rule | `/knowledge` | knowledge | — | 27 |
| `configuration` | `cfg-` | Configuration | `/configurator` | products | — | 1 |
| `bom` | `bom-` | BOM | `/bom` | records | — | 0 |
| `component` | `itm-` | Component | `/bom` | records | — | 58 |
| `cost_model` | `cst-` | Cost model | `/cost` | records | — | 3 |
| `poc` | `poc-` | POC | `/poc` | records | yes | 1 |
| `doe` | `doe-` | DOE | `/doe` | records | — | 1 |
| `project` | `prj-` | Project | `/projects` | records | yes | 1 |
| `gate_definition` | `gate-` | Gate definition | `/gates` | knowledge | — | 11 |
| `risk` | `rsk-` | Risk / FMEA | `/quality` | records | yes | 2 |
| `supplier` | `sup-` | Supplier | `/suppliers` | suppliers | — | 10 |
| `rfq` | `rfq-` | RFQ | `/rfq` | records | — | 0 |
| `acceptance` | `acc-` | FAT/SAT protocol | `/fat-sat` | records | — | 0 |
| `machine` | `mch-` | Machine | `/service` | records | — | 0 |
| `service_ticket` | `svc-` | Service ticket | `/service` | records | — | 0 |
| `source` | `src-` | Source | `/evidence` | knowledge | — | 8 |
| `evidence` | `evd-` | Evidence | `/evidence` | knowledge | — | 136 |
| `lesson` | `les-` | Lesson learned | `/lessons` | knowledge | — | 0 |
| `technology` | `tec-` | Technology | `/technology` | research | — | 16 |
| `semi_step` | `sem-` | Semiconductor process step | `/semiconductor` | knowledge | — | 21 |
| `decision` | `edr-` | Decision record | `/decisions` | records | — | 0 |
| `change_request` | `ecr-` | Change request | `/changes` | records | — | 0 |
| `localization` | `loc-` | Localization item | `/localization` | suppliers | — | 0 |
| `vocabulary` | `voc-` | Vocabulary | `/admin` | knowledge | — | 34 |
| `formula` | `fml-` | Formula | `/calculators` | knowledge | — | 177 |
| `reference` | `ref-` | Reference row | `/admin` | records | — | 70 |

## Master datasets

| Dataset file | Entity | Records | Data type |
|---|---|---|---|
| `data/applications/applications.json` | application | 76 | TEAL_INTERNAL |
| `data/applications/industries.json` | industry | 8 | TEAL_INTERNAL |
| `data/companies/handbook-companies.json` | company | 60 | PUBLIC |
| `data/components/item-master.json` | component | 58 | DEMO |
| `data/config/acceptance-checklists.json` | config | config | TEAL_INTERNAL |
| `data/config/configurator-pricing-rules.json` | config | config | TEAL_INTERNAL |
| `data/config/cost-defaults.json` | config | config | DEMO |
| `data/config/inquiry-lexicon.json` | config | config | TEAL_INTERNAL |
| `data/cost/cost-templates.json` | cost_model | 3 | DEMO |
| `data/cost/rates.json` | reference | 70 | DEMO |
| `data/demo/activities.json` | activity | 7 | DEMO |
| `data/demo/configurations.json` | configuration | 1 | DEMO |
| `data/demo/customers.json` | customer | 3 | DEMO |
| `data/demo/does.json` | doe | 1 | DEMO |
| `data/demo/opportunities.json` | opportunity | 3 | DEMO |
| `data/demo/pocs.json` | poc | 1 | DEMO |
| `data/demo/projects.json` | project | 1 | DEMO |
| `data/demo/requirements.json` | requirement | 6 | DEMO |
| `data/demo/risks.json` | risk | 2 | DEMO |
| `data/evidence/handbook-evidence.json` | evidence | 136 | TEAL_INTERNAL |
| `data/gates/gate-definitions.json` | gate_definition | 11 | TEAL_INTERNAL |
| `data/knowledge/formulas.json` | formula | 177 | TEAL_INTERNAL |
| `data/knowledge/recommendation-rules.json` | rule | 27 | TEAL_INTERNAL |
| `data/knowledge/standards.json` | standard | 15 | PUBLIC |
| `data/knowledge/vocabularies.json` | vocabulary | 34 | TEAL_INTERNAL |
| `data/laser/laser-source-classes.json` | laser_source | 12 | TEAL_INTERNAL |
| `data/materials/materials.json` | material | 19 | TEAL_INTERNAL |
| `data/modules/automation-modules.json` | module | 34 | TEAL_INTERNAL |
| `data/modules/module-conflicts.json` | module_conflict | 7 | TEAL_INTERNAL |
| `data/optics/f-theta-objectives.json` | optic | 5 | TEAL_INTERNAL |
| `data/products/platforms.json` | product | 22 | TEAL_INTERNAL |
| `data/reference-drafts/applications.json` | application | 45 | AI_GENERATED |
| `data/reference-drafts/equipment-templates.json` | equipment_template | 35 | AI_GENERATED |
| `data/reference-drafts/equipment-types.json` | equipment | 73 | AI_GENERATED |
| `data/reference-drafts/materials.json` | material | 16 | AI_GENERATED |
| `data/reference-drafts/source.json` | source | 1 | AI_GENERATED |
| `data/products/product-families.json` | product_family | 7 | TEAL_INTERNAL |
| `data/semiconductor/value-chain.json` | semi_step | 21 | TEAL_INTERNAL |
| `data/sources/sources.json` | source | 8 | TEAL_INTERNAL |
| `data/suppliers/suppliers.json` | supplier | 10 | DEMO |
| `data/technology/technologies.json` | technology | 16 | TEAL_INTERNAL |

Counts are from `data/catalog.json` at the time of writing; the catalog is regenerated on every build.

**AI-generated reference drafts** (`data/reference-drafts/`, built by `scripts/data/buildReferenceDrafts.ts`) extend the library with applications, material classes, equipment categories and equipment station structures drafted from general engineering knowledge. Every record is `data_type: AI_GENERATED`, `verification_status: DRAFT`, `confidence: LOW` and cites `src-ai-draft-knowledge`. They contain **no** manufacturer, model, price, market figure, certification or performance value: application power / speed / quality, material properties, equipment throughput / accuracy / capex and template station times are UNKNOWN (null or absent). An application draft names a candidate technology class and its rationale but no TEAL platform. The UI labels them *AI-generated — requires review*; the Copilot classes them INFERRED (never VERIFIED), says so in the claim text and ranks them below curated records. A reviewer promotes a record by changing its data type and verification status after checking a primary source.

## Key nested structures

* **Product** — `key`, `family_id`, `code`, `title`, `delivery`, `source_keys[]`, `powers_w[]`, `powers_by_source`, `lens_keys[]`, defaults, `standard_content[]` (module keys never charged twice), `specs[]`, `industries[]`, `applications[{key, name, source_key, material_key, …}]`, `base_price_inr` (ESTIMATE), `lead_time_weeks`, `warranty_months`, `install_weeks`, `maturity`, `variant_of`.
* **Configuration** — `product_id`, `application_key`, `source_key`, `power_w`, `lens_key`, `modules[]`, `software`, `extras[]`, `target_per_hour`, `designation`, `parent_id` (versions), `opportunity_id`, `customer_id`, `snapshot` (price + physics at save time).
* **BOM** — `bom_type` (EBOM · MBOM · Service BOM · Spare BOM), `revision`, `lines[{line_id, parent_line_id, level (Product · Assembly · Subassembly · Module · Component), part_number, item_code, description, manufacturer, supplier, quantity, unit, make_buy, unit_cost, currency, cost_basis (QUOTED · CATALOGUE · ESTIMATE · DEMO · UNKNOWN), lead_time_weeks, moq, risk, alternate, revision, module_id, item_class, import_item}]`.
* **Cost model** — legacy Cost Platform structure: `lines` per cost module, `landed`, `markup`, `teal` sheet parameters, `economics`, `fx[]` (dated), `scenario`, `assumptions[]`. See [COST_ENGINE.md](COST_ENGINE.md).
* **Project** — `tasks[{id, name, owner, start, end, depends_on[], status, milestone, gate_code}]`, `gates[{gate_code, decision, date, approvers[], evidence[{item, mandatory, status}], conditions[{text, owner, due, closed}], risks[], notes}]`. See [GATES.md](GATES.md).
* **Requirement** — `code`, `level`, `category`, `value`, `unit`, `condition`, `source`, `priority`, `verification_method`, `acceptance_criterion`, `trace{design_features, module_ids, bom_line_ids, test_ids, fat_test_ids, sat_test_ids}`.
* **Acceptance (FAT/SAT)** — `phase`, `project_id`, `tests[{test_id, requirement_id?, section, test, method, expected, actual?, result (NOT RUN · PASS · FAIL · PASS WITH DEVIATION), evidence?, deviation?, action?}]`.
* **RFQ** — `bom_id`, `rfq_status`, `commercial_terms`, `supplier_ids[]`, `items[]`, `quotes[]`, `selection`, `approval`.
