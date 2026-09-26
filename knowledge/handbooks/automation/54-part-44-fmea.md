---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 54
part_title: "Part 44 — FMEA"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 44 — FMEA

FMEA asks, for every function, how it can fail, what happens, why, and how we would know — before the failure is built into metal. Equipment builders need three: the Design FMEA of the machine, the Process FMEA of the process the machine performs, and the Machinery FMEA of how the running machine loses availability or becomes unsafe. Rank by severity first; a high-severity failure deserves action even when it is rare.

### 44.1 Objective

Identify and reduce design, process and machinery risks early, and turn the results into design changes, controls, tests and maintenance tasks.

### 44.2 Engineering concept

| FMEA | Subject | Typical team | Feeds |
|---|---|---|---|
| Design FMEA (DFMEA) | Machine modules and components | Mechanical, electrical, controls, process | Design changes, DVP (design verification), FAT tests |
| Process FMEA (PFMEA) | The manufacturing process the machine performs (mark, weld, dispense) | Process, quality, customer | Control plan, in-machine verification, recipe limits |
| Machinery FMEA (MFMEA) | The running machine's availability and safety | Maintenance, controls, service | PM plan, spares, diagnostics, MTTR design |

The AIAG-VDA FMEA handbook (2019) structures the analysis in seven steps and prioritizes actions with Action Priority (AP) tables rather than ranking by the RPN product; the examples below show S, O, D and RPN for readability — use the AP tables for customer submissions that require them.

### 44.3 Architecture — rating scales (abbreviated)

| Rating | Severity (S) | Occurrence (O) | Detection (D) |
|---|---|---|---|
| 9–10 | Safety or regulatory impact | Very high; almost certain | Cannot detect, or no control |
| 7–8 | Loss of primary function; line stop; scrap | High | Detection unlikely before shipment |
| 5–6 | Degraded function; rework | Moderate | Detection by sampling or later process step |
| 3–4 | Minor defect noticed by some customers | Low | Detection by in-station verification |
| 1–2 | No noticeable effect | Very low; proven design | Failure prevented or detected 100% automatically |

### 44.4 Components — the FMEA line

Function → failure mode → effect (with S) → cause (with O, current prevention) → current detection (with D) → priority → recommended action → owner and date → re-rated S, O, D after action.

### 44.5 Design methodology

- Define scope and structure (machine → module → component, or process → step).
- List functions and requirements per element.
- Brainstorm failure modes per function; list effects at local, machine and customer level.
- List causes; rate occurrence considering current prevention controls.
- List detection controls; rate detection.
- Prioritize (severity first, then AP or RPN); assign actions.
- Implement, verify, re-rate; update control plan, PM plan and test plans.
- Keep the FMEA alive through changes (Part 47) and field data.

### 44.6 Calculations

RPN=S×O×D

Priority: S≥9⇒act regardless of O,D

### 44.7 Industrial examples

Design FMEA — laser marking cell (extract)

| Item / function | Failure mode | Effect | S | Cause | O | Detection | D | RPN | Action |
|---|---|---|---|---|---|---|---|---|---|
| Nest pins locate part | Pin wear | Mark position drift, scrap | 7 | Hardness too low; no replaceable insert | 5 | Periodic position audit | 5 | 175 | Hardened replaceable pins; monthly nest offset check |
| Cable chain carries shuttle cables | Conductor break | Intermittent sensor faults, stops | 6 | Non-flex cable, tight bend radius | 4 | Alarm only after failure | 6 | 144 | Flex-rated cables; bend radius ≥ vendor minimum; IO-Link diagnostics |
| Door interlock | Actuator misalignment | Nuisance trips; risk of defeat | 8 | Door sag | 4 | Discrepancy alarm | 3 | 96 | Adjustable hinges, door stop, coded interlock |
| Protective window | Contamination | Contrast loss, grade B not met | 7 | Fume back-flow, oily air | 6 | In-line grade verification | 2 | 84 | Air knife with oil-free air; window change interval |
| Z-axis holds focus height | Drops on power loss | Collision with part or nest | 8 | No brake | 3 | None | 9 | 216 | Motor brake controlled by drive (SBC); verified at FAT |

Process FMEA — busbar laser welding (extract)

| Step / requirement | Failure mode | Effect | S | Cause | O | Detection | D | RPN | Action |
|---|---|---|---|---|---|---|---|---|---|
| Weld joint strength ≥ spec | Weak weld | Field failure, thermal hot spot | 9 | Gap > 0.05 mm | 5 | Photodiode monitoring | 4 | 180 | Hold-down mask with force check; pre-weld height scan (D 2) |
| No damage to cell | Over-penetration | Cell damage, safety risk | 10 | Power drift, focus shift | 3 | Periodic cross-section | 6 | 180 | Power check each shift, focus coupon daily, monitoring limits |
| Clean joint | Spatter on cell | Short-circuit risk | 9 | Contaminated surface, beam mode | 4 | Vision seam inspection | 4 | 144 | Laser cleaning station; ring-mode beam |
| Correct recipe | Wrong recipe used | Wrong joint geometry | 8 | Manual selection | 3 | None | 8 | 192 | Recipe from pallet RFID; recipe-product check interlock |
| Traceability | Weld data not linked | Recall scope unknown | 7 | MES offline without buffer | 3 | Periodic data audit | 6 | 126 | Store-and-forward buffer; completeness check at shift end |

Machinery FMEA — busbar welding cell (extract)

| Subsystem | Failure mode | Effect on machine | S | Cause | O | Detection | D | RPN | Action |
|---|---|---|---|---|---|---|---|---|---|
| Chiller | Low coolant flow | Laser stops, line down | 7 | Clogged filter | 5 | Flow alarm at failure | 5 | 175 | PdM: flow and ΔT trend; monthly filter PM |
| Fume extraction | Filter saturated | Fume escape, optics contamination | 8 | Filter life exceeded | 4 | Δp sensor | 3 | 96 | Δp warning threshold; spare filters on site |
| Gantry | Skew fault | Stop, possible structural stress | 7 | Binding on one rail | 3 | Skew monitor | 2 | 42 | Rail lubrication PM; skew trend logging |
| Pallet conveyor | Pallet jam at stopper | Micro-stops | 5 | Worn stopper, debris | 6 | Timeout alarm | 3 | 90 | Hardened stopper; debris guard; weekly clean |
| EtherCAT network | Communication loss | Machine stop | 7 | Cable wear in chain | 3 | Error counters | 4 | 84 | Drag-chain-rated cable; counter monitoring |

### 44.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Prevention vs detection actions | Lower occurrence | Better detection | Prefer prevention; add detection where prevention is impractical |
| Broad vs deep FMEA | Covers everything shallowly | Focuses on high-risk areas | Full structure, depth where severity is high |
| RPN vs AP | Familiar | Severity-weighted, current handbook practice | AP for customer-facing FMEAs |

### 44.9 Common mistakes

- FMEA done after design freeze to satisfy a checklist.
- Low RPN used to ignore severity-10 items.
- Detection ratings credited to controls that do not exist yet.
- FMEA never updated after changes or field failures.
- No link from FMEA actions to control plan, PM plan and tests.

### 44.10 Troubleshooting — FMEA quality

| Symptom | Cause | Correction |
|---|---|---|
| Field failures not in the FMEA | Team lacked service or process experience | Add service and process people; use field data |
| Hundreds of rows, few actions | No prioritization | Rank by severity and AP; act on the top |
| Actions open for months | No owners or dates | Owner, date, review at gate meetings |

### 44.11 Design checklist

- DFMEA started at concept, refined through detailed design
- PFMEA with the customer's process knowledge
- MFMEA feeding PM, spares and diagnostics
- Severity-first prioritization; AP where required
- Actions with owners, dates and re-ratings
- Links to control plan, test plans and PM plan

### 44.12 Key takeaways

- Three FMEAs: design, process, machinery.
- Severity first; never let a low RPN hide a severe failure.
- FMEA actions must land in designs, tests, control plans and PM tasks.
- Keep it alive with changes and field data.
