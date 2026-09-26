---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 79
part_title: "Part 57 — Engineering checklists"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 57 — Engineering checklists

Fourteen review checklists, 140 items, one per design review or readiness gate. Each item is a yes/no statement backed by evidence; "not applicable" needs a written reason (Part 0). The checklist owner completes it; a reviewer from another discipline closes it.

### 57.1 Concept review (G1)

- URS signed with values, assumptions and acceptance criteria
- Process feasibility shown on production-representative samples
- Morphological chart with ≥ 3 means per function; 3–5 real concepts
- Criteria and weights agreed before scoring; sensitivity check done
- Time chart per concept; CT within target with margin
- First-order error budget per concept
- Long-lead items identified and ordering plan agreed
- Cost estimate ±30%; top-five risks with mitigations
- Destination market and applicable regulations identified
- Runner-up concept documented as fallback

### 57.2 Mechanical design review (G3)

- Structure type justified; deflection and first resonance calculated
- Thermal growth estimated for site range and heat sources
- Error budget stack (worst case, RSS, mixed) within 75% of tolerance
- Fixtures on drawing datums; clamp forces and diamond-pin widths calculated
- Bearing, guide and screw life meet service life
- Tolerances only where the budget needs them; ISO 2768 elsewhere
- DFA review done; tool access for every fastener
- Lifting points, shipping splits and levelling features designed
- Service access for wear parts verified in 3D
- DFMEA actions closed or scheduled

### 57.3 Electrical design review (G3)

- Load list with diversity; incoming supply and protection sized
- Breaking capacity ≥ site fault level
- 24 V budget with margin; safety and standard supplies separate
- Panel heat balance at worst ambient; cooling selected
- Segregation, shielding and bonding plan (EMC)
- Earth-fault disconnection checked
- Schematics, terminal plans, cable schedule consistent with I/O list
- 20–30% spare panel space and I/O
- Verification test plan (bonding, insulation, functional)
- Market-specific requirements (IEC 60204-1 / NFPA 79 / UL 508A) addressed

### 57.4 Controls design review (G3)

- Controller selected through the 12-driver chain
- State table with entry actions, exit conditions, timeouts and faults
- Mode matrix agreed with safety engineer
- Device library in use; every device with timeout and plausibility
- Interlock matrix documented and shown on HMI
- Alarm list with classes, first-out, cause and remedy
- Recovery and abort defined per state; part tracking persistent
- Network topology, zones and addresses defined
- MES data dictionary and handshake frozen
- Software under version control with release numbering

### 57.5 Safety review (G2 and G3)

- Risk assessment per ISO 12100 for all life-cycle phases
- Hierarchy applied: elimination and reduction before safeguarding
- SRS with PLr/SIL, reaction, stop category and response time per function
- Achieved PL calculated per function
- Safeguard distances per current ISO 13855 with planned stopping-time measurement
- Interlocks per ISO 14119:2024; defeat protection assessed
- Laser Class 1 concept with rated guards and windows
- Energy isolation (electrical, pneumatic, gravity, stored) designed
- Validation plan with fault injection
- Market conformity route and documents identified

### 57.6 Vision review (G3)

- Task, tolerance and decision criteria numeric
- Sample set covers variation and defects; test set held back
- Pixel size justified by tolerance and sub-pixel repeatability
- Lens resolves pixels; DOF covers height variation; telecentricity decided
- Lighting chosen by measured contrast; ambient light excluded
- Hardware triggering where timing matters; blur calculated
- Calibration method, target and frequency defined
- Coordinate conventions shared with motion and laser software
- GR&R, challenge set or read-rate test in FAT
- False-reject and escape targets agreed with the customer

### 57.7 Process review (G1 and G3)

- CTQs with limits and measurement methods; GR&R acceptable
- Process flow with every exception path
- KPIVs identified by DOE
- Process window mapped with production noise; margin ≥ 2
- Capability demonstrated on ≥ 30 parts
- Control plan per KPIV (control, monitor, react)
- Process findings converted into SRS requirements
- Consumables and process utilities defined
- PFMEA completed with the customer
- IQ/OQ/PQ mapped to FAT, SAT and ramp-up

### 57.8 BOM review (G4)

- BOM structured by module, with revisions
- Every line classified (standard, custom, long-lead, critical, customer-supplied, imported, localized)
- Make vs buy decided with reasons
- Approved suppliers and second sources for critical items
- Landed costs for imports
- Spares and consumables flagged
- Customer-supplied items with dates
- Obsolescence check on key components
- BOM cost vs target reconciled
- Released under change control

### 57.9 Manufacturing readiness (G5)

- Drawings released at correct revision to vendors
- Critical characteristics marked; inspection plan issued
- First-article inspection planned for new parts
- Stress relief, heat treatment and coatings specified
- Vendor capacity and delivery dates confirmed
- Material certificates required and tracked
- Special tools, fixtures and gauges available
- Panel build package released
- Incoming-inspection resources scheduled
- Open DFM issues closed

### 57.10 Assembly readiness (G6)

- Kits ≥ 95% complete per build step; shortages with dates
- Incoming inspection passed; NCRs dispositioned
- Assembly instructions with torques and photos
- Build book prepared with verification points
- Tools, lifting gear and measuring equipment calibrated
- Frame levelled on the assembly floor
- Safe first power-up procedure available
- Panel tested at bench
- Staffing plan by skill
- Punch list and NCR log started

### 57.11 Software readiness (G7)

- PLC, HMI, robot, vision and scan-card software at controlled versions
- I/O mapping verified against I/O list
- Device library tested on hardware or emulator
- State machine and recovery tested (virtual commissioning where available)
- Safety program reviewed separately and locked
- Alarm texts complete
- Recipes and parameters validated
- MES interface tested with simulator
- Backups and restore procedure tested
- User levels configured

### 57.12 FAT readiness (G8)

- Internal dry-run FAT completed exactly per protocol
- Run-at-rate achieved internally
- Safety validation complete; stopping times measured
- Calibration records complete
- Customer samples received; GR&R on acceptance gauges
- Draft manuals, drawings and spare list ready
- Deviation classes and release criteria agreed
- Punch list without class A items
- Utilities and consumables for FAT in place
- Customer invitation and agenda issued

### 57.13 SAT readiness (G9)

- Site readiness verified with measured utility values
- Installation plan, permits and lifting plan approved
- Transport locks removed and recorded
- Staged power-up done; software restored from backups
- Safety functions re-validated at site
- References re-measured; recalibration where needed
- Network and MES connectivity tested with customer IT
- Production parts and operators available
- FAT class B deviations closed or scheduled
- SAT protocol signed off by customer

### 57.14 Production release (G10)

- SAT signed; acceptance certificate issued
- Run-at-rate and ramp targets met for the agreed period
- Capability confirmed on production lots
- Operators and technicians trained on all shifts with records
- Spares and consumables on site
- PM plan loaded into the customer's maintenance system
- Control plan adopted by customer quality
- As-built documentation delivered and archived
- Open items with owners and dates agreed
- Warranty start and service contacts confirmed
