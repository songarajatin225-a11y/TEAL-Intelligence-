---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 8
part_title: "Part 5 — Machine concept development"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 5 — Machine concept development

Generate at least three genuinely different concepts from a functional breakdown, score them against weighted criteria the customer agrees, then test how sensitive the ranking is before choosing. When two concepts score within 0.1 of each other, the matrix has not decided; the discriminating criterion must.

### 5.1 Objective

Arrive at Gate 1 with a selected concept, the two runners-up, the scoring evidence, a sensitivity check and a cost estimate within ±30%.

### 5.2 Engineering concept

A concept is a combination of one means for every function the machine must perform. Concept generation is therefore a search across a morphological chart: rows are functions, columns are alternative means. Good concepts come from combinations, not from the first idea.

| Function | Means 1 | Means 2 | Means 3 | Means 4 |
|---|---|---|---|---|
| Feed parts | Operator on shuttle | Conveyor with stopper | Tray stacker | Robot from bin with vision |
| Hold part | Mechanical nest with pins | Pneumatic clamp | Vacuum | Magnetic |
| Present part to process | Part moves (XY table) | Tool moves (gantry) | Robot moves tool | Robot moves part |
| Process | Single galvo head | Two galvo heads | Fixed optic with axes | Galvo on robot |
| Verify | Vision 100% | Sensor 100% | Sampling offline | In-process monitoring |
| Sort | Diverter | Robot place-to-bin | Operator | Reject drawer |

### 5.3 Architecture — the recurring concept decisions

| Decision | Favour the first when | Favour the second when |
|---|---|---|
| Make vs buy (module) | It carries the process know-how or differentiates the product | It is a commodity with proven vendors (conveyor, feeder, robot) |
| Manual vs automatic loading | Rate ≤ ~300 UPH, many variants, low labour cost | High rate, heavy or hazardous parts, three shifts |
| Servo vs pneumatic | Positions vary by recipe; force or speed profile matters; accuracy < 0.05 mm | Two fixed end positions; low cost; fast simple strokes |
| Robot vs Cartesian | Multi-plane access, orientation changes, flexible paths | Planar work, high accuracy, rigid, simple kinematics |
| Vision vs discrete sensor | Position varies, many features, variants, measurement needed | One binary state, fast, cheap, robust |
| Single vs multi-station | Few operations, low rate, low cost | Many operations or rate beyond one station |
| Inline vs batch | Continuous flow, one-piece traceability | Long process time per part, trays or magazines |
| Rotary indexer vs shuttle | Four or more short operations, compact | Two to three operations, easy access, lower cost |
| Gantry vs robot | Large rectangular work area, accuracy, stiffness | Compact cell, reach around obstacles, flexible |

### 5.4 Components of a concept package

| Item | Content | Level of detail at Gate 1 |
|---|---|---|
| Layout sketch | Footprint, material flow, operator position, access | Scaled 2D or simple 3D |
| Function–means selection | One means per function | Morphological chart row |
| Cycle-time estimate | Time chart per Part 4 | ±15% |
| Accuracy estimate | First error budget per Part 9 | Dominant terms only |
| Key components | Laser class, robot class, controller class | Class and two candidate suppliers |
| Risks | Technical, supply, schedule | Top five with mitigation |
| Cost estimate | ROM by module (Part 45) | ±30% |

### 5.5 Design methodology

- Decompose the machine into functions from the process flow (Part 3).
- Fill the morphological chart with at least three means per function.
- Combine into 3–5 concepts that differ in principle, not in detail.
- Agree criteria and weights with the customer before scoring.
- Score each concept 1–5 per criterion, using estimates, not feelings; record the reason for each score.
- Compute weighted totals and run a sensitivity check on the two or three heaviest weights.
- Identify the discriminating criterion when totals are close; decide on it explicitly.
- Document why the runners-up lost; they become fallbacks if a risk materializes.

### 5.6 Calculations

S_j=(∑_i^​ w_i⋅s_(ij))/(∑_i^​ w_i)

S_j = weighted score of concept j; w_i = weight of criterion i; s_ij = score 1–5 of concept j on criterion i. Treat differences below about 0.1 as a tie; the scoring uncertainty is larger than that.

### 5.7 Industrial example — battery-module busbar welding cell

Requirement: weld 192 busbar joints on a 96-cell cylindrical module (600 × 300 mm) at 40 modules/h (90 s takt). Measured weld time 0.12 s per joint plus 0.03 s galvo jump → 28.8 s of laser-on time per module. A 160 × 160 mm galvo field covers the module in 8 fields.

| Concept | Principle |
|---|---|
| A | Gantry XY carries one galvo head; step-and-scan across 8 fields |
| B | 6-axis robot carries the galvo head; vision correction per field |
| C | Fixed galvo head; module moves on a precision XY table |
| D | Two galvo heads on a fixed bridge; module moves on a Y table |

Criteria and weights were agreed with the customer. Supply availability means component lead time and second-source options; reliability and maintainability already cover machine uptime, so uptime is not scored twice.

| Criterion | Weight | A Gantry + galvo | B Robot + galvo | C XY table, fixed galvo | D Dual galvo + Y table |
|---|---|---|---|---|---|
| Cost | 15 | 3 | 3 | 4 | 2 |
| Cycle time | 15 | 4 | 3 | 3 | 5 |
| Accuracy | 15 | 4 | 2 | 5 | 4 |
| Reliability | 10 | 4 | 4 | 4 | 3 |
| Maintainability | 8 | 4 | 4 | 4 | 3 |
| Scalability (future modules) | 10 | 4 | 5 | 2 | 4 |
| Technical risk | 12 | 4 | 3 | 4 | 3 |
| Supply availability | 7 | 4 | 5 | 4 | 3 |
| Serviceability | 8 | 4 | 4 | 4 | 3 |
| Weighted score | 100 | 3.85 | 3.45 | 3.80 | 3.40 |

Sensitivity check

| Scenario | A | B | C | D | Leader |
|---|---|---|---|---|---|
| Base weights | 3.85 | 3.45 | 3.80 | 3.40 | A ≈ C (tie) |
| Accuracy 20, scalability 5 (fixed product family) | 3.85 | 3.30 | 3.95 | 3.40 | C |
| Cycle time 25, cost 5 (rate doubles in year 3) | 3.95 | 3.45 | 3.70 | 3.70 | A |

Reading the result. A and C tie on base weights. The discriminating question is the product roadmap: if the customer will introduce larger modules, C's XY table must be rebuilt, so A wins; if the module family is fixed and accuracy tightens, C wins because moving the part under a fixed optic removes gantry dynamics from the error budget. B loses on accuracy — robot path accuracy is typically in the 0.1–0.5 mm range, so it needs per-field vision correction and adds cycle time. D is the scaling path if rate doubles; keep it as the documented fallback.

### 5.8 Design trade-offs

| Trade-off | What you gain | What you give up |
|---|---|---|
| Part moves vs tool moves | Stable optics and process, better accuracy | Larger moving mass, footprint grows with part size |
| Robot flexibility vs Cartesian precision | Reach, orientation, reuse across products | Absolute accuracy, stiffness, deterministic path timing |
| More heads vs faster single head | Parallel process time, redundancy of capacity | Cost, calibration between heads, more software |
| Buy vs make | Proven reliability, faster delivery | Margin, control of know-how, integration effort |
| Standard platform vs optimal custom | Reuse, lower risk, shorter lead time | Last 5–10% of performance |

### 5.9 Common mistakes

- Generating three versions of one idea and calling them concepts.
- Letting the team score before the customer agrees weights; the result gets reverse-engineered.
- Treating a 0.05 difference in weighted score as a decision.
- Ignoring service access in the concept; it cannot be added later without moving modules.
- Skipping the fallback concept, then restarting from zero when a key risk hits.

### 5.10 Troubleshooting — concept-level failures

| Symptom (found later) | Root cause at concept stage | How to detect earlier | Correction | Prevention |
|---|---|---|---|---|
| Accuracy unreachable at FAT | Kinematic choice (robot, long cantilever) outside error budget | First-order error budget at Gate 1 | Add vision correction or change kinematics | Error budget is a Gate 1 deliverable |
| Cycle time unreachable | Handling hidden time assumed, not charted | Time chart per concept | Add parallelism | Time chart per concept at Gate 1 |
| Machine cannot be serviced | Layout optimized for footprint only | Service walk-through on 3D | Re-layout, removable modules | Serviceability scored in the matrix |

### 5.11 Design checklist

- Morphological chart with ≥ 3 means per function
- 3–5 concepts that differ in principle
- Criteria and weights signed by the customer before scoring
- Each score justified by an estimate (time chart, error budget, cost ROM)
- Sensitivity check on the heaviest weights
- Discriminating criterion stated when totals are within 0.1
- Runners-up documented as fallbacks
- Cost estimate ±30% and top-five risks with mitigations

### 5.12 Key takeaways

- Concepts are combinations of means for functions; search the combinations.
- Agree weights before scoring and always run a sensitivity check.
- A close score is a tie; decide on the criterion that separates the concepts.
- Keep the runner-up alive as a documented fallback.
