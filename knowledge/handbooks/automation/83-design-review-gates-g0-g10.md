---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 83
part_title: "Design review gates G0–G10"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Design review gates G0–G10

A gate is a decision, not a meeting: the project proceeds only when the exit criteria are met, or when named risks are consciously accepted by the approvers with an owner and date. The table defines inputs, outputs and documents, approval criteria, responsible functions and exit criteria for each gate; Part 57 holds the detailed checklists.

| Gate | Inputs | Outputs and documents | Approval criteria | Responsible (DRI → approvers) | Exit criteria |
|---|---|---|---|---|---|
| G0 Requirement review | Customer inquiry, VOC, samples, site data | URS (signed values), assumptions list, CTQ list, takt and CT_ideal, market and regulation list, feasibility plan | Every URS line has value, condition, verification and acceptance; process status known | Project manager → head of engineering, sales, customer | Customer signs URS values; feasibility funded |
| G1 Concept review | URS, process trial data | Concept matrix with sensitivity, selected concept and fallback, time chart, first error budget, cost ±30%, risk register, long-lead list | Process feasible on real samples; CT and accuracy credible with margin | System engineer → engineering head, product manager | Concept chosen; long-lead POs released with change terms |
| G2 Architecture review | Selected concept | Six architecture views, N² matrix and ICDs, module specs, seven budgets, safety concept with PLr, utility sheet, data dictionary, FRS, cost ±15% | Budgets closed with margin; interfaces owned; customer agrees FRS, data and utilities | System engineer → discipline leads, safety engineer, customer | Architecture baseline frozen |
| G3 Detailed design review | Architecture baseline | Drawings, schematics, pneumatic diagrams, I/O list, calculations, DFMEA, SRS and PL calculations, BOM rev A, FAT protocol draft | Discipline checklists passed (Part 57); calculations independently checked; DFMEA high-priority actions closed | Mechanical, electrical, controls leads → system engineer, quality | Design baseline frozen; change control active |
| G4 Procurement release | Design baseline | Released BOM with classes, approved suppliers, POs, landed costs | BOM complete and classified; critical items dual-sourced or risk-accepted | Procurement lead → project manager, finance | All POs placed; long-lead status green or mitigated |
| G5 Manufacturing readiness | Released drawings | Vendor packages, inspection plan, FAI plan, panel build package | Drawings and inspection plans released at correct revisions | Manufacturing lead → quality | Fabrication started with controlled documents |
| G6 Assembly readiness | Received parts | Kits, IQC records, assembly instructions, build book | ≥ 95% kitted per step; IQC passed; instructions available | Assembly lead → manufacturing, quality | Assembly started |
| G7 Integration readiness | Assembled machine, tested panel | Wiring test records, controlled software release, safe power-up procedure | Bonding and insulation tests passed; software versioned; safety program reviewed | Controls lead → system engineer, safety engineer | First power-up and integration started |
| G8 FAT readiness | Integrated machine | Dry-run FAT report, safety validation, calibration records, draft manuals, spare list | Dry-run passed exactly per protocol; run-at-rate achieved; no open class A items | Project manager → system engineer, quality, customer invitation | Customer FAT scheduled |
| G9 SAT readiness | Shipped and installed machine | Site readiness record with measured utilities, installation log, re-validation and recalibration records | Safety re-validated; references restored; IT connectivity confirmed | Service lead → project manager, customer | SAT started |
| G10 Production release | SAT-accepted machine in ramp | Ramp data, capability on production lots, training records, spares list, as-built documents, open-item list | Ramp targets sustained for the agreed period; training complete; spares on site | Customer production and service lead → project manager, product manager | Ownership transferred; warranty and service mode |

Gate rules

- Documents are distributed at least two working days before the review.
- Approvers decide go, go-with-conditions (named risks with owner and date), or no-go.
- Conditions carried forward appear in the risk register and are closed before the next gate.
- Customer-facing gates (G0, G2, FAT, SAT, G10) include the customer's signature.
- Gate records are kept in the project file and reviewed in post-project lessons learned.
