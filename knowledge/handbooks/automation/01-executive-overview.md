---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 1
part_title: "Executive overview"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Executive overview

A machine is a validated process wrapped in structure, motion, control, safety and data, delivered at the customer's rate and held there for its service life. This handbook converts any new automation requirement into that machine through 60 parts in 12 books, 11 design-review gates, 10 complete case studies and a 27-step playbook.

The short answer to "I have a new machine requirement — what next?" is four moves: freeze the process before the machine, size the machine backward from UPH, fix one datum chain from fixture to tool before detailing, and treat FAT as a rehearsal for SAT rather than the finish line. Every book below expands one of those moves into calculations, specifications, checklists and failure analysis.

### Six laws of machine building

| # | Law | What it means in practice | Where it is developed |
|---|---|---|---|
| 1 | The process owns the machine | Concept work starts only after the process window (parameters, CTQs, capability) is proven on a bench or lab cell | Parts 3, 28–30 |
| 2 | Design backward from UPH | Required UPH at target OEE fixes station count, parallelism and every motion profile | Parts 4, 12, 13 |
| 3 | Datums before details | One datum scheme runs fixture → part → axis → tool; the error budget is allocated before parts are drawn | Parts 9, 10, 36 |
| 4 | Every function has a failure path | Each module spec names its failure modes, detection and recovery state before design release | Parts 7, 20, 37, 44 |
| 5 | Safety and traceability are architecture | Risk assessment and the MES data model freeze at Gate 2, never after build | Parts 23, 27 |
| 6 | Platform beats project | Reuse modules, electrical architecture, PLC framework and HMI; engineer only the process edge | Parts 51, 52 |

### Master reference architecture

*Figure 1. Master reference architecture · 14 stages, 3 disciplines, 1 feedback loop* — [Figure not transcribed; see source document]

Read top to bottom: the requirement flows through three engineering disciplines that converge on the process module; delivery runs left to right; field data loops back as the next-generation requirement.

### Where TEAL-type equipment is different

Equipment at the intersection of automation, laser, semiconductor, electronics and battery shares one core — precision motion, vision, laser integration, handling and MES — and differs only at the process edge. The table sets typical planning ranges; replace them with the customer's CTQs at Gate 0.

| Domain | Typical process | Dominant CTQ | Typical positional need | Dominant integration risk |
|---|---|---|---|---|
| Industrial laser marking | Fiber / CO₂ / UV galvo marking | Code grade, contrast, legibility | ±50–100 µm | Part presentation, focus drift, fume |
| Battery / EV laser welding | Fiber, single-mode, ring-mode welding | Penetration, porosity, joint strength | ±30–50 µm seam | Fit-up gap, spatter, back-reflection |
| PCB processing | UV / CO₂ marking, laser depaneling | Legibility, no copper damage, debris | ±25–50 µm | Panel warp, fiducial vision |
| Semiconductor ATMP | Package / wafer marking, singulation, inspection | Mark quality, kerf, chipping, particles | ±10–25 µm | Contamination, SECS/GEM, handling damage |
| Precision assembly & inspection | Pick-and-place, dispensing, AOI | Placement accuracy, Cpk | ±10–50 µm | Vision calibration, thermal drift |

### Reading paths by role

| Reader | Read first (parts) | Then | Keep open as reference |
|---|---|---|---|
| Product manager | 0, 2, 4, 5, 45, 51, 59, 60 | 53 (case studies) | 46, 56 |
| System engineer / architect | 0, 2–7 | 11, 20, 24, 27, 28 | 54, 57 |
| Mechanical design | 8–10, 12, 14, 15 | 32, 36 | 54, 55 |
| Electrical and controls | 16–23 | 27, 37 | 55, 56 |
| Vision and robotics | 24–26, 36 | 13 | 55 |
| Manufacturing and assembly | 32, 35, 36, 39 | 38, 40 | 48, 57 |
| Procurement and supply chain | 33, 34, 52 | 45 | 55 |
| Quality | 43, 44, 38, 40 | 3 | 57 |
| Service and maintenance | 37, 41, 42 | 49 | 48 |
| Sales and applications | 1–4, 59 | 53 | 45 |

### Conventions

- SI units throughout; angles in rad inside calculations, degrees in specifications.
- Costs in ₹ lakh (1 lakh = ₹100,000), indicative 2026 India-build figures unless stated otherwise.
- "Typical" values are planning ranges, not guarantees; replace them with measured or vendor-certified values before design freeze.
- Brands appear only as representative examples, never as recommendations.
- Standards carry the edition checked for this handbook (Book XI); confirm the edition in force for the destination market at Gate 0.
- Every part follows the 12-block chapter template defined in Part 0.
