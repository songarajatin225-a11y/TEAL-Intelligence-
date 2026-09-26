---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 58
part_title: "Part 48 — Documentation"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 48 — Documentation

Documentation is part of the product: the customer cannot operate, maintain, certify or modify the machine without it, and the builder cannot service or reuse it. Define the document set at Gate 2, generate it as the design progresses rather than after FAT, control every item by number and revision, and deliver an as-built set at SAT.

### 48.1 Objective

Define, produce, control and hand over the complete engineering and customer documentation set, matching the as-built machine.

### 48.2 Engineering concept

Two audiences use the documentation: the builder's engineers (design intent, calculations, source files) and the customer's people (operation, maintenance, compliance). Instructions for use follow the principles of IEC/IEEE 82079-1 (preparation of information for use) and ISO 20607 (instruction handbook for machinery): task-oriented, safety information where the task happens, and in the users' language.

### 48.3 Architecture — document structure

Engineering documents

| Document | Content | Owner | Delivered to customer? |
|---|---|---|---|
| General arrangement (GA) | Layout, footprint, heights, utilities connection points, weights | Mechanical lead | Yes |
| Assembly drawings | Assemblies with BOM balloons | Mechanical | As agreed (often yes for spares identification) |
| Part drawings | Manufacturing drawings of custom parts | Mechanical | Wear and spare parts at least |
| BOM | Structured bill with revisions | Configuration manager | As-built BOM of spares-relevant items |
| Pneumatic schematic | ISO 1219 symbols, valve and tube numbers | Mechanical / controls | Yes |
| Electrical schematic | Power, control, safety circuits, terminal plans | Electrical | Yes |
| I/O list | Every signal with tag, address, description, device | Controls | Yes |
| Cable schedule | Cable IDs, types, lengths, routes, terminations | Electrical | Yes |
| Software architecture | States, modes, modules, interfaces, data model | Software | Summary |
| PLC, HMI, robot, vision backups | Released source and runtime files with versions | Software | Yes (as agreed in contract) |
| Calculations | Sizing, stack-ups, heat, safety PL | Each discipline | Safety-relevant extracts |
| Risk assessment and safety validation | ISO 12100 assessment, SRS, PL calculations, validation records | Safety engineer | Yes (or conformity summary) |
| FMEA | DFMEA, PFMEA, MFMEA | Quality | PFMEA and control plan usually yes |

Customer documents

| Document | Content |
|---|---|
| User (operating) manual | Intended use, safety, controls, modes, operation, changeover, alarms and responses, cleaning |
| Maintenance manual | PM schedule, procedures, adjustments, calibration checks, troubleshooting, lock-out/tag-out |
| Spare-parts list | Item, manufacturer part number, quantity, recommended stock, lead time, criticality |
| FAT report | Signed protocol, results, deviations |
| SAT report and acceptance certificate | Signed protocol, results, open items |
| Calibration certificates | Machine calibrations and references used |
| Safety documentation | Declaration of conformity or equivalent for the market, residual risks, laser class labelling information, certification documents where required |
| Utility requirements | Final utility sheet with measured site values |
| Training material and records | Slides, exercises, attendance and competence records |
| Supplier documentation | Manuals and certificates of bought-in equipment (laser, robot, drives) |

### 48.4 Components — document control

| Element | Rule |
|---|---|
| Numbering | Machine code + document type + sequence (for example LMC2S-EL-001) |
| Revision | Every document revised through ECN (Part 47) |
| Status | Draft, in review, released, superseded |
| Storage | One controlled repository (PLM or document management); no uncontrolled copies on the floor |
| Formats | Editable native files internally; PDF and editable where contracted for the customer |
| Language | English plus operator languages as agreed |

### 48.5 Design methodology

- Agree the document list, formats and languages with the customer at G2.
- Generate documents from design data (schematics, I/O lists, BOM from CAD/ECAD).
- Write manuals task by task while the machine is being debugged; test them on new technicians.
- Review documents at G8 for FAT; issue as-built revisions after SAT.
- Archive the complete as-built set per serial number for service.

### 48.6 Calculations

No engineering formulas; documentation is sized by the task list. A practical check: every alarm in the alarm list has a remedy text in the user or maintenance manual, and every PM task has a procedure — count both and compare.

### 48.7 Industrial example — handover set for the marking cell

| Item | Format | Delivered |
|---|---|---|
| GA, electrical and pneumatic schematics, I/O list, cable schedule | PDF + native on request | SAT |
| As-built BOM of spares-relevant items and spare-parts list | Spreadsheet + PDF | SAT |
| User manual (English), quick-reference cards for operators | PDF + laminated cards | FAT draft, SAT final |
| Maintenance manual with PM schedule and procedures | PDF | SAT |
| PLC, HMI and scan-card backups with version list | Files on encrypted media | SAT |
| Risk assessment summary, safety validation report, conformity documentation | PDF | SAT |
| FAT and SAT reports, calibration certificates | Signed PDF | After each event |
| Supplier manuals (laser, drives, safety PLC, reader) | PDF | SAT |

### 48.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Full source files vs compiled only | Customer self-sufficiency | Protects builder IP | Contract decides; escrow is a middle path |
| Paper vs digital manuals | Available at the machine | Searchable, current | Digital with quick-reference cards at the machine |
| Generated vs hand-written | Consistent with design | Readable | Generate reference documents; hand-write task instructions |

### 48.9 Common mistakes

- Manuals written after FAT from memory.
- Schematics not updated after site changes.
- Alarm list and manual out of step.
- Supplier manuals missing from the handover.
- Uncontrolled printouts on the shop floor.

### 48.10 Troubleshooting

| Symptom | Cause | Correction |
|---|---|---|
| Service engineer finds machine differs from drawings | Changes not documented | As-built audit, ECNs, re-issue |
| Customer technicians call for routine tasks | Manual missing procedures | Add task-based procedures with photos |
| Audit finds missing safety documents | Documentation list not agreed | Compile and issue; add to G2 checklist |

### 48.11 Design checklist

- Document list, formats and languages agreed at G2
- Engineering documents generated from design data and under revision control
- Manuals task-based, tested on new staff
- Every alarm and PM task covered in manuals
- Safety and conformity documents complete for the market
- As-built set delivered at SAT and archived per serial number

### 48.12 Key takeaways

- Documentation is part of the machine and part of acceptance.
- Generate it with the design, not after it.
- Control every document by number and revision.
- Deliver the as-built truth at SAT.
BOOK IX
