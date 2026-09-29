# AI Data Model

**Principle:** the existing schema is preserved. The AI layer reads the 53 datasets as they are
and adds **one local table** and **no new master-data entity** in V1. Future datasets are specified
here so they are designed before they are needed, never filled with invented data.

## 1. What the AI layer reads (existing)

| Entities | Used for |
|---|---|
| `part`, `spec_definition`, `compatibility_rule`, `compatibility`, `data_conflict` | technical search, reranking, compatibility, alternatives, change impact, spec conflicts |
| `laser_source`, `material`, `application`, `product`, `module`, `rule`, `optic` | technology candidates, configurator, GraphRAG |
| `equipment_template`, `simulation` | AI → 3D, cycle time / counterfactual |
| `supplier`, `company` | supplier intelligence, controlled queries, entity resolution |
| `requirement`, `verification`, `project`, `opportunity`, `poc`, `doe`, `risk` | traceability, project status, Bayesian optimisation, data readiness |
| `source`, `evidence`, handbook sections | citations and passages |
| `decision` | human decisions recorded from the Copilot |

Every record already carries `data_type` and `provenance.verification_status` — the claim class of
each answer sentence is derived from them (see [AI_RAG_ARCHITECTURE.md](AI_RAG_ARCHITECTURE.md)).

## 2. Added in V1

### 2.1 Local AI log (IndexedDB, Dexie schema v2)

```text
ai_log  ++id, kind, at, intent
  kind: 'interaction' | 'feedback'
  at, query, intent, title, confidence, mode, sources[] (kind:id), engines[]
  feedback?: 'correct' | 'incorrect' | 'needs_review'
  correction?: string
```

* stays in this browser; exportable as JSON from the Control Center; clearable;
* used to improve prompts, retrieval, routing and the gold set — **never to train a model
  directly** (unverified AI output never trains anything, §57);
* Dexie v1 → v2 adds only this table; all existing tables are unchanged.

### 2.2 Engine switches

Preference key `ai:engines` (`{ [engineId]: boolean }`) in the existing `prefs` table.

### 2.3 Decisions (§58, §95)

A decision from the Copilot is saved as an existing **`decision` record draft**:

```text
question · options[] · decision · approver · decided_on · evidence_ids[] (the answer's record sources)
context = "AI-assisted (local engines) · intent · confidence" + AI output summary (claims with classes)
          + human modification + reason
data_type USER_CREATED · provenance DRAFT · tags [ai-assisted, decision]
```

It becomes permanent only through the change-package → pull-request review, like every draft.

## 3. Specified for later (DATA REQUIRED)

These entities do not exist yet. They are listed so collection can start in the right shape. Each
row carries the provenance block below.

| Entity | Key fields | Activates |
|---|---|---|
| `experiment_result` | doe_id, run, material, thickness, laser type, power, wavelength, pulse width, frequency, spot, speed, hatch, focus, shielding, response values, images, engineer note | process quality prediction, Bayesian optimisation across DOEs |
| `purchase_order` | supplier_id, part_id, country, po_date, promised_date, delivered_date, transit, customs, quantity, price, currency | lead-time prediction, demand forecasting, cost estimation |
| `telemetry` | machine_id, timestamp, laser power, temperature, vibration, servo / motor current, cycle time, chiller, vacuum, vision errors, PLC alarms | anomaly detection, predictive maintenance, root cause |
| `inspection_image` | image uri, task, label, labeller, verified, machine / part / process links | vision models, active learning |
| `model_evaluation` | model_id, version, dataset_id, metrics, date, evaluator | MLOps registry metrics |

### Provenance for every AI-relevant dataset (§80, §81)

```text
dataset_class: REAL | SIMULATED | SYNTHETIC | AI_GENERATED   (never mixed silently)
source_document · page / record · extraction_method · timestamp
verification_status · data_owner · revision
```

Only `REAL` + `VERIFIED` rows count towards the data-readiness thresholds in the model registry.

## 4. Normalisation

Units: the existing unit engine (`calculations/units.ts`) normalises every specification at read
time to the definition's canonical unit, keeping `raw` (original) and `normalized` values and the
unit (§18). The AI layer never does arithmetic in text — conversions, cycle times, throughput and
costs come from deterministic functions.
