---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 56
part_title: "Part 46 — Project management"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 46 — Project management

An equipment project is a race between the critical path and the change list. Name one directly responsible individual (DRI) per milestone, track long-lead items weekly, freeze design at Gate 3 and enforce change control after it, run a live risk register, and measure progress by earned value rather than by effort spent.

### 46.1 Objective

Deliver the machine on schedule, on budget and to specification by planning stages, milestones, critical path, long-lead items, design freeze, change control and risks.

### 46.2 Engineering concept

Stages: concept → design → procurement → manufacturing → assembly → software → integration → FAT → delivery → SAT → ramp-up. Procurement, manufacturing and software overlap design; the art of equipment project management is starting long-lead and parallel work early without building on unfrozen decisions.

### 46.3 Architecture — milestone plan with DRIs

Indicative for the 24-week plan in Part 0.

| Milestone | Week | DRI | Exit evidence |
|---|---|---|---|
| G0 Requirement review | 0 | Project manager | Signed URS, assumptions list |
| G1 Concept review; long-lead orders released | 2 | System engineer | Concept matrix, long-lead POs |
| G2 Architecture freeze | 4 | System engineer | Module specs, budgets, safety concept, utility sheet |
| G3 Detailed design freeze | 8.5 | Mechanical and controls leads | Drawings, schematics, DFMEA, BOM rev A |
| G4 Procurement release | 9.5 | Procurement lead | Released BOM, POs placed |
| G5 Manufacturing readiness | 10.5 | Manufacturing lead | Drawings to vendors, inspection plan |
| G6 Assembly readiness | 13 | Assembly lead | Kits ≥ 95%, IQC complete |
| G7 Integration readiness | 15 | Controls lead | Panel and wiring tested, software v1 |
| G8 FAT readiness | 19 | Project manager | Dry-run FAT passed |
| FAT and shipment | 20 | Project manager | Signed FAT, release |
| G9 SAT readiness | 22 | Service lead | Installed, re-validated |
| SAT sign-off | 24 | Project manager | Acceptance certificate |
| G10 Production release | ~30 | Customer and service lead | Ramp targets met |

### 46.4 Components — control instruments

| Instrument | Content | Cadence |
|---|---|---|
| Master schedule | Tasks, dependencies, critical path, float | Weekly update |
| Long-lead tracker | Item, supplier, PO date, promised date, status, risk | Weekly |
| Design-freeze register | What is frozen, when, by whom | At each gate |
| Change log | ECR/ECN status, impact on cost and schedule (Part 47) | Weekly |
| Risk register | Risk, probability, impact, score, mitigation, owner, trigger | Weekly |
| Issue / punch list | Open items with owner and date | Daily during build and FAT |
| Cost tracker | Budget, committed, actual, forecast | Weekly |
| Customer report | Milestones, risks, decisions needed | Every two weeks |

Risk register example

| ID | Risk | P (1–5) | I (1–5) | Score | Mitigation | Owner | Trigger |
|---|---|---|---|---|---|---|---|
| R1 | Laser source delivery slips beyond week 13 | 3 | 5 | 15 | Early order at G1; demo unit loan agreement | Procurement | No shipping notice by week 10 |
| R2 | Customer samples late or unrepresentative | 4 | 4 | 16 | Contractual sample date; process study on first lot | Project manager | Samples not received by week 3 |
| R3 | MES interface specification late | 3 | 4 | 12 | Data dictionary freeze at G2; simulator | Software lead | No sign-off by week 5 |
| R4 | Code grade marginal on cast surface | 2 | 5 | 10 | MOPA source, Z-focus, process window margin | Process engineer | Grade B margin < 1 grade in trials |
| R5 | Site utilities not ready | 3 | 3 | 9 | Utility sheet at G2; readiness visit week 18 | Service lead | Readiness checklist open at week 18 |

### 46.5 Design methodology

- Build the schedule backward from the customer's SAT date; identify the critical path.
- Release long-lead items at G1 with frozen specifications for those items.
- Assign one DRI per milestone and module.
- Freeze design at G3; after freeze, changes go through ECR/ECN with impact assessment.
- Run weekly reviews: critical path, long-lead, risks, changes, costs, issues.
- Use gates as real decisions: do not pass a gate with open critical items.
- Measure progress with earned value; forecast cost and finish date.
- Close the project with post-calculation and lessons learned.

### 46.6 Calculations

TF=LS−ES

SPI=(EV)/(PV)

CPI=(EV)/(AC)

EAC=(BAC)/(CPI)

TF = total float (late start minus early start); PV, EV, AC = planned value, earned value, actual cost; BAC = budget at completion; EAC = estimate at completion.

Example: at week 10 the marking-cell project has PV = ₹40 lakh, EV = ₹34 lakh, AC = ₹38 lakh → SPI = 0.85 (behind schedule), CPI = 0.89 (over cost); EAC = 62.1 / 0.89 = ₹69.4 lakh, eating most of the margin unless recovered. Paths with zero float (design → laser source → integration → FAT) get daily attention.

Cash flow. Capital-equipment contracts in India commonly stage payments around order, FAT and SAT (for example advance, a large FAT-linked payment, and a SAT retention). Imported long-lead items are paid long before FAT, so the working-capital curve dips early; plan it with finance at G0.

### 46.7 Industrial example — recovering a late laser source

At week 9 the supplier moved the laser source from week 13 to week 16 (R1 triggered). Actions: (1) the supplier's demo unit was loaned for integration from week 14 under the pre-agreed clause; (2) software and safety validation proceeded with the demo unit; (3) the production unit was swapped in at week 17 with a one-day recalibration. FAT held at week 20; cost of mitigation ₹0.6 lakh, drawn from contingency.

### 46.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Early start vs frozen inputs | Schedule gain | Rework risk | Start only what is frozen for that item |
| Fast-tracking vs crashing | Overlap tasks | Add resources | Fast-track where interfaces are stable; crash on critical-path tasks only |
| Detailed plan vs rolling wave | Visibility | Flexibility | Detailed for 6 weeks ahead, milestones beyond |

### 46.9 Common mistakes

- Critical path unknown or never updated.
- Long-lead items ordered at BOM release.
- Gates passed with open critical items "to keep schedule".
- Risk register written once for the proposal and never reviewed.
- Progress reported as percent effort, not earned value.

### 46.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Corrective action | Preventive action |
|---|---|---|---|---|
| Repeated slips late in the project | Integration discovered problems | Compare planned vs actual per stage | Add integration capacity; resequence | Module tests before integration |
| Budget overrun | Scope creep, rework | CPI trend, change log | Change orders, value engineering | Design freeze discipline |
| Customer escalations | Surprises in reporting | Review reports vs internal status | Transparent status, decisions requested early | Biweekly customer reviews with risks |

### 46.11 Design checklist

- Schedule built backward from SAT; critical path identified
- DRIs named per milestone and module
- Long-lead tracker live from G1
- Design-freeze register and change control after G3
- Risk register reviewed weekly with triggers
- Earned-value tracking and forecast
- Cash-flow plan agreed with finance

### 46.12 Key takeaways

- One DRI per milestone; one truth for the critical path.
- Order long-lead items at G1; freeze design at G3.
- Manage risks with triggers and pre-agreed mitigations.
- Earned value tells you early what effort percentages hide.
