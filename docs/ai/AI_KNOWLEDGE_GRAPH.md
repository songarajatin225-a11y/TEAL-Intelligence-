# Industrial Knowledge Graph

The graph is not a separate database: it is a **typed view over the digital-thread graph** the
platform already builds from every reference field (`src/services/graph.ts`, `refs.ts`). The AI
layer (`src/services/ai/kg.ts`) adds engineering classes, readable relations, derived edges and
traversals.

## Node classes

| Class | From |
|---|---|
| Company, Supplier | `company`, `supplier` |
| Component, Laser Source, Galvo, F-Theta, Optics, Motion, Servo, PLC, HMI, Camera, Vision, Chiller, Safety | `part` by `product_type`; `component` (item master) |
| Laser Type | `laser_source` (TEAL source classes) |
| Material · Application · Industry · Process | `material` · `application` · `industry` · `recipe` |
| Product · Machine | `product`, `product_family` · `configuration`, `simulation`, `equipment_template` |
| Specification | `spec_definition` |
| Cost | `bom`, `cost_model` |
| Document | `source`, `evidence`, `reference`, `article`, `standard` |
| Project · Customer · Experiment · Requirement · Risk · Decision · Module · Technology | matching entities (`doe`, `poc`, `verification` → Experiment) |

## Relations

Stored edges come from reference fields (`REL_BY_FIELD` in `refs.ts`) and are rendered directionally:

| Edge | Read out | Read in |
|---|---|---|
| `manufactures` (part.manufacturer_id) | is manufactured by | manufactures |
| `uses` (application.recommended_source_id, …) | uses | is used by |
| `applies_to` (application.material_ids, industries) | applies to | is applied in |
| `compatible_with` (product.source_keys / lens_keys, recorded compatibility) | is compatible with | is compatible with |
| `supplied_by`, `built_from`, `tested_by`, `requires`, `validated_by`, `derived_from`, `references` | … | … |

**Derived edges** (computed, never stored, class INFERRED): `matches_technology` — an
engineering-database laser part → the TEAL laser class sharing the most technologies (e.g.
DL-MOPA-20 → Fiber MOPA).

The prompt's relation list maps as: Supplier→manufactures→Component = `manufactures`;
Component→alternative_to→Component = same-type parts filtered by rules (computed per question);
Component→compatible_with→Component = compatibility engine (recorded + rules); Machine→contains→
Component = scenario `selections`; Laser→used_for→Application = `uses` (in); Application→
processes→Material = `applies_to`; Document→describes→Product = `evidence_for` / provenance;
Experiment→validates→Process = `tested_by` / verification.

## GraphRAG

`graphPaths(graph, seeds, targetClasses, { maxHops, limit, derived })` — breadth-first from the
retrieved seed records (or the page context) to the classes a question needs. Documents,
vocabularies, formulas and industry hubs are never used as stepping stones (they would connect
everything). Example on the MOPA page, "Where can I use this?":

```text
Fiber MOPA → is used by → Cell & can marking
Fiber MOPA → is used by → Black on anodised Al
Fiber MOPA → is compatible with → Volt-M
```

Each path becomes a claim whose sources are every node on the path.

## Change impact (§37)

`changeImpact(from, to, …)` traverses:

1. **Specification differences** between the two parts, grouped into domains by the spec
   definition's category (Optical/Beam → Optics, Scan → Galvo, Power/Electrical → Electrical,
   Thermal/Fluid → Cooling, I/O/Compute → Control interface, Mechanical/Physical → Mechanical,
   Safety → Safety, Pulse/Process → Process parameters).
2. **Scenarios that select the part** — compatibility with every station / machine neighbour is
   re-checked with the rules engine, before and after.
3. **Records within two links** — BOMs, requirements, verifications, projects, POCs, recipes — to review.
4. **BOM, cost, lead time** — from recorded prices only; different currencies are not converted.
5. **Qualification and documentation** — always flagged for re-verification.

Missing data on either side is **Unknown**, never "unchanged".

## Entity resolution (§17)

`resolveName` / `findMentions`: exact identifier → exact normalised name (legal suffixes removed)
→ curated alias (IPG → IPG Photonics …) → fuzzy (Jaro-Winkler ≥ 0.9, flagged for human
verification). Nothing is merged automatically; the existing Duplicates page remains the place to
act on duplicates.

## Graph ML

GNN link prediction for substitution / compatibility is FUTURE: it needs ≥ 1 000 verified
compatibility facts (the Control Center counts them — rules + recorded relationships).
