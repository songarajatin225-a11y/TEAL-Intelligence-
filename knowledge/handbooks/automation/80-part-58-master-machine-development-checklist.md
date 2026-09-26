---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 80
part_title: "Part 58 — Master machine development checklist"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 58 — Master machine development checklist

One list from 0% to 100%: seventeen milestones, each with the evidence that proves it and the gate it closes. Percentages are earned-value weights for a typical SPM (Part 46); a milestone counts only when every item under it is true.

| Milestone | Cumulative progress | Gate | Proof |
|---|---|---|---|
| Requirement freeze | 5% | G0 | Signed URS with values, assumptions, acceptance criteria |
| Concept freeze | 10% | G1 | Selected concept, fallback, long-lead POs |
| Architecture freeze | 15% | G2 | Module specs, budgets, safety concept, utility sheet, data dictionary |
| Design freeze | 30% | G3 | Released drawings, schematics, calculations, DFMEA |
| BOM release | 35% | G4 | Released BOM, suppliers, POs |
| Procurement complete | 45% | G5–G6 | Parts received and inspected |
| Manufacturing complete | 55% | G6 | Custom parts and panel built and inspected |
| Assembly complete | 65% | — | Mechanical and pneumatic assembly verified |
| Wiring complete | 70% | G7 | Point-to-point, bonding and insulation tests |
| Software complete | 75% | G7 | Controlled release loaded, I/O verified |
| Integration complete | 80% | — | Sequences, recovery, safety validated |
| Calibration complete | 83% | — | Calibration records with residuals |
| FAT passed | 88% | G8 | Signed FAT report |
| Dispatch | 90% | — | References recorded, packed, shipped |
| Installation complete | 94% | G9 | Installed, re-validated, recalibrated |
| SAT passed | 98% | — | Signed SAT, acceptance certificate |
| Production handover | 100% | G10 | Ramp targets met, training, spares, documents |

### 58.1 Requirement freeze (0 → 5%)

- VOC captured; 15 customer inputs complete or listed as assumptions
- URS lines with all eight fields; takt, CT_ideal, lifting load calculated
- Production-representative samples requested (≥ 30)
- Destination market, regulations and customer standards identified
- URS values signed by the customer

### 58.2 Concept freeze (5 → 10%)

- Process feasibility proven
- Concepts scored with agreed weights; sensitivity checked
- Long-lead items ordered with change terms
- Cost ±30%; risks registered

### 58.3 Architecture freeze (10 → 15%)

- Six architecture views; N² matrix; ICDs
- Seven budgets allocated to modules
- Module list with owners and stand-alone tests
- Safety concept with PLr targets; utility sheet and data dictionary issued

### 58.4 Design freeze (15 → 30%)

- Mechanical, electrical, controls, safety, vision, process reviews passed (Part 57)
- Calculations checked by a second engineer
- DFMEA actions closed or scheduled
- Design baseline recorded; change control active

### 58.5 BOM release (30 → 35%)

- BOM classified and released; make/buy decided
- Approved suppliers and second sources
- Spares flagged; landed costs updated

### 58.6 Procurement (35 → 45%)

- All POs placed; long-lead tracker green or mitigated
- First articles inspected; incoming inspection running

### 58.7 Manufacturing (45 → 55%)

- Custom parts made and inspected; NCRs dispositioned
- Panel built and bench-tested

### 58.8 Assembly (55 → 65%)

- Frame levelled; datums verified
- Axes aligned (parallelism, squareness recorded)
- Pneumatics leak-tested; modules tested stand-alone

### 58.9 Wiring (65 → 70%)

- Point-to-point check; labels on both ends
- Bonding continuity and insulation resistance recorded
- Shield terminations and segregation inspected

### 58.10 Software (70 → 75%)

- Controlled versions loaded; I/O verified
- Safety program locked and reviewed

### 58.11 Integration (75 → 80%)

- Safe staged power-up completed
- Safety functions validated with fault injection
- Sequences, recovery and abort tested at every state
- Cycle time measured against the time chart

### 58.12 Calibration (80 → 83%)

- Axes, laser field, camera, fixtures, sensors, TCP calibrated with residuals recorded

### 58.13 FAT (83 → 88%)

- Internal dry-run passed
- FAT executed; deviations classified; report signed

### 58.14 Dispatch (88 → 90%)

- References recorded; software backed up
- Locked, drained, packed, indicators fitted; documents in crates

### 58.15 Installation (90 → 94%)

- Site verified before shipment; installation completed per sequence
- Safety re-validated; references re-measured; recalibration as needed

### 58.16 SAT (94 → 98%)

- SAT protocol executed; run-at-rate with customer operators
- Live MES and offline recovery passed
- Acceptance certificate signed

### 58.17 Production handover (98 → 100%)

- Ramp targets sustained for the agreed period
- Training records for all shifts; spares on site; PM plan loaded
- As-built documentation delivered and archived; post-calculation done; lessons learned recorded
BOOK XII
