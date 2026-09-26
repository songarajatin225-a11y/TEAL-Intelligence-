---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 47
part_title: "Part 38 — Factory acceptance test (FAT)"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 38 — Factory acceptance test (FAT)

FAT proves, at the builder's site and in front of the customer, that the machine meets its SRS and FRS before it is dismantled and shipped. It should hold no surprises: every test was written from the traceability matrix at Gate 2, every test was dry-run internally at Gate 8, and every acceptance criterion was agreed in writing. Capability claims need enough parts — a Cpk of 1.50 measured on 50 parts only proves about 1.24 with 95% confidence.

### 38.1 Objective

Demonstrate functional, safety, performance, quality and data requirements with objective evidence, record deviations and release the machine for shipment.

### 38.2 Engineering concept

FAT is the operational qualification (OQ) of the machine: it tests that the system operates as specified across its range. SAT (Part 40) repeats the critical tests after installation and adds performance in the real environment (PQ).

### 38.3 Architecture — FAT protocol structure

| Section | Content |
|---|---|
| 1. Scope and references | Machine ID, URS/SRS/FRS revisions, drawings, software versions |
| 2. Responsibilities | Builder test lead, customer witnesses, sign-off authority |
| 3. Preconditions | Gate 8 readiness: internal dry-run passed, documents drafted, samples received |
| 4. Test equipment | Instruments with calibration status |
| 5. Samples | Quantity, variants, source, condition (customer-supplied) |
| 6. Test list | ID, requirement reference, procedure, acceptance criterion, result, evidence, signature |
| 7. Deviation handling | Classification A / B / C, owner, closure plan |
| 8. Release criteria | Conditions for shipment |
| 9. Records | Data files, photos, videos, signed sheets |

Deviation classes

| Class | Meaning | Rule |
|---|---|---|
| A | Requirement not met; affects safety, quality or rate | Fix and re-test before shipment |
| B | Requirement not met; fix possible at site without risk | Agreed plan and date; closed at SAT |
| C | Observation or improvement | Logged; no acceptance impact |

### 38.4 Components — test categories

| Category | Typical tests |
|---|---|
| Documentation | Drawings, schematics, BOM, manuals draft, risk assessment, software versions |
| Visual and mechanical | Workmanship, labels, guards, cable routing, accessibility |
| Electrical safety | Protective bonding continuity, insulation resistance, voltage tests where applicable, residual voltage |
| Functional | I/O check, modes, manual functions, recipes, user levels |
| Safety | Validation of every safety function in the SRS; stopping times; guard-locking behaviour |
| Cycle time and run-at-rate | Continuous production at rate for an agreed duration (e.g. 2–4 h) |
| Accuracy and repeatability | Position, dimensional or process CTQs on real parts |
| Process capability | Cpk on an agreed number of parts after GR&R |
| Traceability and MES | Data completeness with a simulated MES; offline buffering |
| Alarms and recovery | Trigger alarms; fault injection at each state; power-loss recovery |
| Changeover | Variant change time and first-part quality |
| Utilities and environment | Consumption, noise, heat, leak (air) at idle |

### 38.5 Design methodology

- Write the FAT protocol from the traceability matrix at Gate 2; agree criteria with the customer.
- Request production-representative samples early (quantity for capability plus spares).
- Run an internal dry-run FAT (Gate 8) exactly as written; fix failures before inviting the customer.
- Perform GR&R on the measurement systems used for acceptance.
- Execute FAT in a planned sequence: documentation → safety → functions → performance → capability → data → recovery.
- Record evidence as you go; classify deviations immediately.
- Sign the FAT report with the deviation list and release decision.

### 38.6 Calculations

C_(pk,L)≈C_(pk)−z_(1−α)√((1)/(9n)+(C_(pk)^2)/(2(n−1)))

A_(FAT)=(t_(run))/(t_(run)+t_(stops))

C_pk,L = lower confidence bound for Cpk from n parts (z = 1.645 for 95% one-sided). Examples: measured Cpk 1.50 on n = 50 → 1.50 − 1.645 × √(0.00222 + 0.02296) = 1.50 − 0.26 = 1.24. To demonstrate Cpk ≥ 1.33 at 95% confidence with 50 parts, the measured Cpk must be about 1.62; with 125 parts, about 1.52. Agree whether acceptance is on the point estimate or the confidence bound — before FAT.

### 38.7 Industrial example — FAT test list extract, marking cell

| FAT ID | Requirement | Procedure | Acceptance |
|---|---|---|---|
| FAT-01 | Documentation (URS-15) | Review documents against list | All listed documents present in draft |
| FAT-03 | Electrical safety | Bonding continuity, insulation resistance | Within IEC 60204-1 test limits |
| FAT-04 | Throughput (URS-03, SRS-01) | 2 h continuous run at rate, both variants | CT ≤ 5.3 s average; availability ≥ 95% during run |
| FAT-08 | Mark position (SRS-03) | 50 parts per variant, measured against datums | Position within ±0.25 mm; Cpk ≥ 1.33 point estimate |
| FAT-11 | Code grade (URS-02) | 300 consecutive parts verified in-line; 30 re-graded offline | All ≥ B; in-line vs offline grade agreement |
| FAT-13 | Changeover (URS-06) | Timed change between variants | ≤ 10 min; first part OK |
| FAT-15 | MES data (URS-07) | Simulated MES; disconnect for 1 h; reconnect | 100% records delivered once; buffer replays in order |
| FAT-18 | Recovery | Fault injected at each state; power-off mid-cycle | Recovery per FRS; no lost or duplicate part records |
| FAT-20 | Safety functions (URS-11, 12) | Validate SF1–SF6; measure stopping times | Per SRS; distances recalculated with measured times |

### 38.8 Sample FAT checklist

Readiness

- Internal dry-run FAT completed and signed (Gate 8)
- Customer samples received and logged
- Test instruments calibrated; GR&R done on acceptance gauges
- Software versions frozen and recorded
Documentation

- Electrical, pneumatic and mechanical drawings current
- Risk assessment and safety validation plan available
- Draft user and maintenance manuals, spare list
Mechanical and electrical

- Workmanship, labels, guards, cable routing inspected
- Protective bonding and insulation tests recorded
- Air leak test at idle within limit
Functional

- All I/O verified against I/O list
- Auto, manual, maintenance, setup modes behave per mode matrix
- Recipes load, validate, and are version-logged
- User levels restrict functions correctly
Safety

- Every safety function validated with fault injection
- Stopping times measured; safety distances confirmed
- Guard locking releases only under safe conditions
Performance and quality

- Run-at-rate completed; cycle time and availability recorded
- Accuracy and repeatability within specification
- Capability demonstrated on agreed sample size and basis
- Changeover time demonstrated
Data and recovery

- Traceability records complete; MES offline test passed
- Alarms trigger with correct texts; first-out works
- Recovery tested at every state; power-loss recovery tested
Close-out

- Deviations classified with owners and dates
- FAT report signed; shipment release decision recorded

### 38.9 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Long FAT vs long SAT | Problems found where tools and people are | Tests in the real environment | Prove everything possible at FAT; SAT confirms |
| In-person vs remote FAT | Full witness, hands-on | Faster, cheaper | Remote only for low-risk repeats of proven platforms |
| Point estimate vs confidence bound | Simple, fewer parts | Statistically defensible | Confidence bound for safety- or quality-critical CTQs |

### 38.10 Troubleshooting — why FATs fail

| Symptom | Root cause | Prevention |
|---|---|---|
| Arguments about pass criteria | Criteria not agreed in writing | Criteria in URS and protocol, signed at G2 |
| Capability fails on customer parts | Samples not representative; process developed on different lots | Early sample request; process study on production lots |
| Cycle time missed only at FAT | Dry-run done with idealized conditions | Dry-run exactly per protocol with real parts |
| MES test impossible | Customer interface spec late | Data dictionary frozen at G2; simulator built early |

### 38.11 Design checklist

- Protocol derived from traceability matrix; criteria signed
- Samples, instruments and GR&R ready
- Internal dry-run passed
- Deviation classes and release criteria agreed
- Evidence recorded for every test

### 38.12 Key takeaways

- FAT is a rehearsal of SAT: no surprises allowed.
- Every test traces to a requirement and has a signed criterion.
- Capability needs enough parts and an agreed statistical basis.
- Classify deviations immediately and decide shipment on facts.
