---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 2
part_title: "Part 0 — How to use this handbook"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part 0 — How to use this handbook

Use the handbook in the order a machine is built: each book maps to a lifecycle phase, and each phase ends at a gate with named evidence. Read a book before its gate, run its calculations with your numbers, and close its checklist before asking for gate approval.

### 0.1 Structure

| Book | Parts | Lifecycle phase | Prepares for gate |
|---|---|---|---|
| I Foundations and requirements | 1–7 | Requirement → architecture | G0, G1, G2 |
| II Mechanical engineering | 8–10 | Detailed design | G3 |
| III Motion, pneumatics, vacuum | 11–15 | Detailed design | G3 |
| IV Electrical, controls, software | 16–23 | Detailed design, software | G3, G7 |
| V Vision, robotics, safety | 24–27 | Architecture → detailed design | G2, G3 |
| VI Process equipment domains | 28–31 | Process feasibility → design | G1–G3 |
| VII Build, procure, deliver | 32–41 | Procurement → ramp-up | G4–G10 |
| VIII Sustain and govern | 42–48 | Across the lifecycle | All |
| IX Scale the business | 49–52 | Portfolio and platform | Portfolio reviews |
| X Case studies | 53 | Reference designs | All |
| XI Reference | 54–58 | Calculations, selection, standards, checklists | All |
| XII Product view, gates, templates, playbook | 59–60 | Governance and daily use | All |

### 0.2 The chapter template

Every engineering part uses the same 12 blocks so a reader can jump straight to the block a decision needs. Foundation parts keep blocks brief where a block adds little.

| Block | Question it answers |
|---|---|
| Objective | What decision does this chapter let me make? |
| Engineering concept | What is it, why is it needed, where is it used, how does it work? |
| Architecture | What are the alternative structures and how do they connect? |
| Components | What parts make it up and what specifies each? |
| Design methodology | In what order do I decide, and from which inputs? |
| Calculations | What must I compute, with which formula and margin? |
| Industrial example | What does a worked, TEAL-relevant instance look like? |
| Design trade-offs | What do I give up with each option? |
| Common mistakes | What do experienced builders see go wrong? |
| Troubleshooting | Symptom → causes → tests → root cause → correction → prevention |
| Design checklist | What must be true before release, commissioning, FAT and SAT? |
| Key takeaways | Which three to five points must I remember? |

### 0.3 Engineering workflow: the V-model

Every requirement written on the left of the V is verified by a named test on the right. A requirement with no verification method is not a requirement; strike it or define its test at Gate 0.

| Definition artefact (left) | Verified by (right) | Where verified |
|---|---|---|
| Customer VOC and URS | SAT and run-at-rate | Customer site |
| System requirement spec (SRS) | FAT protocol | Builder's shop |
| Functional requirement spec (FRS) | Integration and sequence tests | Builder's shop |
| Module specification | Module test (dry cycle, accuracy, force) | Sub-assembly bay |
| Component design and drawing | Incoming and first-article inspection | Quality lab |

### 0.4 Cross-functional dependencies

R = responsible, A = accountable, C = consulted, I = informed, S = customer sign-off. One A per phase; the project manager owns delivery, the system engineer owns technical truth.

| Function | Req | Concept | Design | Procure | Build | Integrate | FAT | SAT | Ramp |
|---|---|---|---|---|---|---|---|---|---|
| Project manager | A | C | C | A | A | A | A | A | C |
| System engineer | R | A | A | C | C | R | R | R | C |
| Process / applications | R | R | C | I | I | R | R | R | A |
| Mechanical design | I | R | R | C | C | R | C | I | I |
| Electrical and controls | I | R | R | C | R | R | R | R | C |
| Software (PLC, HMI, MES) | I | C | R | I | I | R | R | R | C |
| Vision and robotics | I | C | R | C | I | R | R | R | C |
| Procurement | I | C | C | R | C | I | I | I | C |
| Manufacturing and assembly | I | C | C | I | R | R | C | R | I |
| Quality | C | I | C | R | R | C | R | C | R |
| Service | I | C | C | I | I | C | C | R | R |
| Customer | S | S | C | I | I | I | S | S | S |

Nine interface artefacts carry most cross-functional risk. Freeze each at the gate shown; a late artefact is the most common root cause of schedule slip.

| Interface artefact | From → to | Freeze at | What breaks if late |
|---|---|---|---|
| Cycle-time allocation sheet | System → all disciplines | G2 | Undersized motion, UPH miss at FAT |
| Datum scheme and error budget | Mechanical → process, vision | G2 | Accuracy miss discovered at FAT |
| Long-lead list | Procurement ↔ design | G1 | Critical path slip of 4–12 weeks |
| Safety function list with PL/SIL targets | Safety → electrical, software | G2 | Guarding redesign, re-validation |
| MES / traceability data dictionary | Software ↔ customer IT | G2 | SAT fails on data exchange |
| Utility requirement sheet | System → customer facilities | G2 | Site not ready at delivery |
| I/O and device list | Mechanical, process → controls | G3 | Panel rework, missing channels |
| Pneumatic schematic and valve list | Mechanical → electrical | G3 | Valve-terminal re-order |
| Spares and consumables list | Service → customer | G8 | Downtime in the first 90 days |

### 0.5 Using the calculation sections

- Every calculation lists variables with SI units, the formula, a worked example, a sanity check and the margin applied.
- Apply safety factors once, visibly, at the end; never bury them inside inputs.
- Record the source of every input (customer drawing, vendor datasheet, measurement, assumption) and its revision.
- Keep calculations in controlled calculation sheets (template in Book XII) and re-run them at every design change.
- A calculation that cannot be checked by a second engineer in 15 minutes is not finished.

### 0.6 Using the checklists

- Each item is a yes/no statement backed by evidence (drawing number, test record, photo, signature).
- "Not applicable" needs a one-line reason; an unexplained N/A counts as a fail.
- The checklist owner fills it; a reviewer from another discipline closes it.
- Open items carry an owner and a date, and are tracked in the project risk register.

### 0.7 Using the case studies

Treat each case study in Book X as a reference design: copy its architecture, then re-run its calculations with your product, rate and CTQs. Never copy its numbers; copy its reasoning.

### 0.8 New Machine Development Roadmap

*Figure 2. Development roadmap · 10 workstreams, 11 gates, critical path highlighted* — [Figure not transcribed; see source document]

A mid-complexity SPM runs about 20 weeks from purchase order to FAT and 24 to SAT; detailed design, long-lead procurement, assembly and integration form the critical path.

| Gate | Name | Decision | Minimum evidence |
|---|---|---|---|
| G0 | Requirement review | Accept the requirement and fund feasibility | URS draft, CTQ list, volume and UPH, utilities, site constraints |
| G1 | Concept review | Select the concept | Concept matrix, process feasibility data, cycle-time estimate, cost ±30% |
| G2 | Architecture review | Freeze architecture | Module specs, cycle-time allocation, error budget, safety concept, I/O estimate, cost ±15% |
| G3 | Detailed design review | Freeze design | 3D model, drawings, calculations, schematics, DFMEA, BOM rev A |
| G4 | Procurement release | Release the BOM | Released BOM, approved vendors, long-lead POs placed |
| G5 | Manufacturing readiness | Start fabrication | Released drawings, inspection plan, fixtures |
| G6 | Assembly readiness | Start assembly | ≥95% parts kitted, incoming QC passed, assembly instructions |
| G7 | Integration readiness | Power up and integrate | Wiring continuity and insulation test, software under version control |
| G8 | FAT readiness | Invite the customer | Internal dry-run FAT passed, run-at-rate, draft documentation |
| G9 | SAT readiness | Start SAT | Utilities verified, machine installed, levelled, recalibrated |
| G10 | Production release | Hand over to production | SAT signed, run-at-rate, Cpk at target, training done, spares on site |

BOOK I
