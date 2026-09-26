# Design review gates G0–G10

Source: Automation Equipment Building Handbook — design review gates G0–G10 and gate rules.
Extracted by `scripts/knowledge/extractHandbookData.ts` into `data/gates/gate-definitions.json`
(inputs, outputs, approval criteria, responsible, exit criteria, **mandatory evidence** = the
gate's outputs, customer-facing flag). Logic: `src/services/gates.ts`; UI: *Projects* (gate
review panel per project) and *G0–G10* (definitions and portfolio gate health).

| Gate | Review | Responsible → approvers | Mandatory evidence items | Customer-facing |
|---|---|---|---|---|
| G0 | Requirement review | Project manager → head of engineering, sales, customer | 6 | yes |
| G1 | Concept review | System engineer → engineering head, product manager | 7 | — |
| G2 | Architecture review | System engineer → discipline leads, safety engineer, customer | 9 | yes |
| G3 | Detailed design review | Mechanical, electrical, controls leads → system engineer, quality | 9 | — |
| G4 | Procurement release | Procurement lead → project manager, finance | 4 | — |
| G5 | Manufacturing readiness | Manufacturing lead → quality | 4 | — |
| G6 | Assembly readiness | Assembly lead → manufacturing, quality | 4 | — |
| G7 | Integration readiness | Controls lead → system engineer, safety engineer | 3 | — |
| G8 | FAT readiness | Project manager → system engineer, quality, customer invitation | 5 | yes |
| G9 | SAT readiness | Service lead → project manager, customer | 3 | yes |
| G10 | Production release | Customer production and service lead → project manager, product manager | 6 | yes |

## Rules (enforced when recording a decision)

| Rule | Check |
|---|---|
| **R1** | GO / GO WITH CONDITIONS is blocked while any mandatory evidence item is *missing* (each item: provided · not applicable · missing) |
| **R2** | the previous gate must have passed (GO or GO WITH CONDITIONS) |
| **R3** | conditions carried from the previous gate must be closed |
| **R4** | GO WITH CONDITIONS needs at least one condition, each with an owner and a date |
| **R5** | customer-facing gates (G0, G2, G8, G9, G10) need the customer among the approvers |

NO-GO and PENDING can always be recorded. The panel lists every rule with ✔/✖ and the reason,
so a blocked decision explains itself. Tests: `tests/unit/gates.test.ts`,
`tests/integration/thread.test.ts`.

## Health and next gate

`gateHealth` → passed (GO) · conditional (GO WITH CONDITIONS) · failed (NO-GO) · in_review ·
not_started. `nextGate` = first gate not passed. Dashboards and reports show gate health per
project; the project's suggested next action is "Prepare G<n> gate evidence".

## Schedule

Project tasks can carry `depends_on`, `milestone` and `gate_code`. `services/schedule.ts`
computes the critical path (Kahn topological order, forward/backward pass, float) and detects
dependency cycles; *Projects* draws a Gantt with the critical path highlighted.

## FAT, SAT and production release

* **G8 FAT** — *FAT / SAT → Generate FAT*: one test per linked requirement (method and
  acceptance criterion from the requirement) + the handbook FAT checklist (§38.8, 26 items).
* **G9 SAT** — requirement tests + site readiness (§57.13) + the SAT protocol template (§40.4).
* Every test starts **NOT RUN**; results (PASS · FAIL · PASS WITH DEVIATION) are entered with
  actual value, evidence, deviation and action.
* **G10** — *Production release* uses the handbook production-release checklist (§57.14).
