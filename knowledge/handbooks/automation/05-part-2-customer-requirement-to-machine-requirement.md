---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 5
part_title: "Part 2 — Customer requirement to machine requirement"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 2 — Customer requirement to machine requirement

A requirement is finished only when it is measurable, testable and owned. The chain VOC → URS → SRS → FRS → design inputs turns what the customer says into numbers an engineer can design to and a quality engineer can verify at FAT and SAT.

### 2.1 Objective

Produce a signed URS, a builder's SRS and FRS, and module-level design inputs, each traceable to the customer's words and to a named FAT or SAT test.

### 2.2 Engineering concept

| Document | Author | Says | Answers | Example line |
|---|---|---|---|---|
| VOC (voice of customer) | Customer, captured by builder | Needs in the customer's words | Why do they want a machine? | "Every housing must carry a code we can read at every station." |
| URS (user requirement spec) | Customer, assisted by builder | What and how well, never how | What must the machine achieve? | "Shall mark a Data Matrix of grade B or better on 100% of parts." |
| SRS (system requirement spec) | Builder | System-level performance, interfaces, compliance | What must the whole system do, measurably? | "Ideal cycle time ≤ 22 s per part including verification." |
| FRS (functional requirement spec) | Builder | Behaviour of each function: modes, sequences, alarms | How does each function behave? | "On grade below B, the part is routed to the reject lane and the counter increments." |
| Design inputs | Builder's discipline leads | Quantified module parameters | What number do I design each module to? | "Fixture repeatability ≤ 0.05 mm on datum A/B/C." |

### 2.3 Architecture — the customer inputs to capture

Capture all 15 inputs before Gate 0. Missing inputs become assumptions; list each assumption in the URS so the customer signs it.

| Input | Questions to ask | Why it matters | Typical trap |
|---|---|---|---|
| Product | Drawings, material, mass, variants, tolerances, surface finish; how many samples can we get? | Drives fixture, handling, process | Designing from CAD, not from real castings |
| Process | What operation, current method, known parameters, upstream and downstream steps | Defines the process module | Process not yet validated anywhere |
| Volume | Annual, daily, peak; ramp profile; product life | Drives UPH and scalability | Using today's volume, not year-3 |
| Cycle time | Required takt, line-balance constraints | Drives architecture and parallelism | Quoting mark time as cycle time |
| Quality | CTQs, acceptance criteria, sampling, AQL, Cpk targets | Drives inspection and validation | "Good quality" with no number |
| Accuracy | Position, orientation, dimensional tolerances with datums | Drives error budget | Tolerance given without a datum |
| Traceability | What data, which granularity, retention, labels | Drives MES interface and data model | Discovered at SAT |
| Operator | Skill level, shifts, language, ergonomics, PPE | Drives HMI, loading height, guarding | Heavy manual lifting at high rate |
| Utilities | Voltage, frequency, fault level, CDA quality, water, exhaust, N₂ | Drives electrical and pneumatic design | Assuming chilled water exists |
| Floor space | Footprint, height, access, floor loading, route to site | Drives layout and shipping splits | Machine fits the bay but not the door |
| Safety | Local law, customer corporate standards, required certifications | Drives safety architecture | Customer standard stricter than law |
| Environment | Temperature, humidity, dust, vibration, EMC environment | Drives cooling, sealing, isolation | 42 °C summer ambient ignored |
| Cleanroom | ISO class, ESD, outgassing, materials restrictions | Drives materials and design | Lubricants and cables that shed particles |
| Communication | MES, protocols, IT security, remote access policy | Drives controls architecture | IT blocks remote access at SAT |
| Commercial | Budget, delivery, FAT/SAT location, warranty, payment milestones | Drives scope and risk | Scope creep without change orders |

### 2.4 Components — anatomy of a good requirement

Every requirement line carries eight fields. A line missing any field is returned to its author.

| Field | Rule | Example |
|---|---|---|
| ID | Unique, never reused | URS-07 |
| Statement | One requirement, "shall", no design solution | Shall transfer the part record to MES |
| Value and unit | Number, unit, tolerance | Within 2 s of cycle end |
| Condition | When and under what state | In auto mode, MES online |
| Priority | Must / should / could | Must |
| Verification | Inspection, analysis, demonstration or test | Test (T) |
| Acceptance | Pass criterion | 100% of 500 consecutive records received and matched |
| Source | VOC line, standard or regulation | VOC-4 |

### 2.5 Design methodology

- Capture VOC in a structured workshop: product walk, process observation, samples collected, photographs, current defect data.
- Translate each VOC line into one or more measurable URS lines; mark assumptions explicitly.
- Review URS with the customer line by line; get signature on values, not just on the document.
- Derive the SRS: compute takt and ideal cycle time, allocate accuracy budget, choose the laser class, set interfaces and compliance targets.
- Write the FRS: operating modes, auto sequence, manual functions, alarms, recovery, user levels, recipes, data.
- Break down design inputs per module, each tagged with its parent SRS or FRS ID.
- Build the traceability matrix: every URS line maps to at least one FAT or SAT test.
- Freeze at Gate 0 (URS) and Gate 2 (SRS, FRS); after freeze, changes go through ECR/ECN (Part 47).

### 2.6 Calculations

Takt time, ideal cycle target and lifting load are the three numbers every URS review needs.

T_(takt)=(t_(available))/(Q_(demand))

CT_(ideal)≤T_(takt)⋅OEE_(target)

t_available = planned production time per day (s); Q_demand = units per day; OEE_target = planned overall equipment effectiveness (0.80–0.90 for new equipment).

M_(lift,h)=m_(part)⋅UPH

M_lift,h = mass an operator lifts per hour (kg/h); m_part = part mass (kg). Above roughly 500 kg/h of repeated lifts, specify a conveyor, slide or lift assist and run a formal ergonomic assessment.

### 2.7 Industrial example — laser marking of EV motor housings

A Tier-1 EV traction-motor maker needs 2D codes on aluminium die-cast housings. The example runs VOC to design inputs end to end.

VOC captured in the workshop

| ID | Customer's words |
|---|---|
| VOC-1 | "Every housing must carry a code we can read at every station." |
| VOC-2 | "We make 1,500 housings a day now; 3,000 next year." |
| VOC-3 | "Operators should just load. No settings." |
| VOC-4 | "Our MES must know which housing was marked with what." |
| VOC-5 | "The code has to survive washing and e-coat." |
| VOC-6 | "It must fit next to the CMM — 3 m by 2.5 m." |
| VOC-7 | "Two housing variants; changeover must be quick." |
| VOC-8 | "Our plant gets to 42 °C in summer, and we have no chilled water." |

URS (extract, signed at Gate 0)

| ID | Requirement | Value | Priority | Verify | Source |
|---|---|---|---|---|---|
| URS-01 | Mark a Data Matrix ECC200 with part number, serial, date and line (20 characters) | 16 × 16 modules, module size 0.40 mm | Must | I | VOC-1 |
| URS-02 | Code quality on as-cast surface, 100% verified in-line | Grade ≥ B (ISO/IEC TR 29158) | Must | T | VOC-1 |
| URS-03 | Throughput | 3,000 parts/day, 3 shifts | Must | T | VOC-2 |
| URS-04 | Code quality after wash and e-coat | Grade ≥ C on 30 of 30 samples | Must | T | VOC-5 |
| URS-05 | Operator role | Load and unload only; no parameter access | Must | D | VOC-3 |
| URS-06 | Changeover between variants | ≤ 10 min, recipe auto-selected | Must | D | VOC-7 |
| URS-07 | MES data per part | Serial, time, grade, recipe, laser parameters within 2 s; 7-day buffer if MES offline | Must | T | VOC-4 |
| URS-08 | Footprint | ≤ 3.0 × 2.5 m, height ≤ 2.4 m | Must | I | VOC-6 |
| URS-09 | Ambient | 10–42 °C, RH ≤ 85% non-condensing | Must | A | VOC-8 |
| URS-10 | Utilities | 415 V 3-phase 50 Hz; CDA 6 bar; no chilled water | Must | I | VOC-8 |
| URS-11 | Laser safety | Class 1 in production, per IEC 60825-1 | Must | T | Regulation |
| URS-12 | Machine safety | Risk assessment per ISO 12100; residual risks documented | Must | A | Regulation |
| URS-13 | Availability, machine-attributable | ≥ 95%; MTTR ≤ 30 min for top-10 failures | Should | T | Customer standard |
| URS-14 | Fume handling | Extraction with filtration, no discharge outside the cell | Must | T | Customer EHS |
| URS-15 | Documentation | English manuals, drawings, spares list, FAT/SAT protocols | Must | I | Contract |

SRS (derived by the builder)

Takt: available time = 3 shifts × (480 − 30) min = 1,350 min = 81,000 s. T_takt = 81,000 / 3,000 = 27.0 s. CT_ideal ≤ 27.0 × 0.85 = 22.9 s → design target 22 s. Part mass 6.5 kg at 133 UPH gives 867 kg/h lifted → roller-conveyor infeed so the operator slides parts instead of lifting.

| ID | System requirement | Value | Parent |
|---|---|---|---|
| SRS-01 | Ideal cycle time including index, mark, verify | ≤ 22 s | URS-03 |
| SRS-02 | Laser mark time per code (to be confirmed by process trial) | ≤ 6 s | URS-01, 03 |
| SRS-03 | Code position relative to cast datums A/B/C | ±0.25 mm | URS-01 |
| SRS-04 | In-cycle verification, grade reported | ≤ 1.5 s | URS-02 |
| SRS-05 | Laser class | Pulsed fiber (MOPA), 30–50 W, air-cooled | URS-02, 10 |
| SRS-06 | Recipe capacity | 2 variants, expandable to 20 | URS-06 |
| SRS-07 | Equipment data interface | OPC UA server; buffer ≥ 25,000 records | URS-07 |
| SRS-08 | Door interlock safety function | Performance level set by risk assessment; PL d Cat. 3 assumed at G2 | URS-11, 12 |
| SRS-09 | Panel thermal design | Internal ≤ 40 °C at 42 °C ambient (cooling unit) | URS-09 |
| SRS-10 | Loading ergonomics | Conveyor infeed at 950–1,050 mm; no lift above 3 kg | URS-05 |

FRS (extract)

- Modes: Auto, Manual (jog, single-step), Maintenance (laser alignment behind key switch), Setup (recipe edit, engineer level).
- Auto sequence: part arrives → variant read from RFID tag on carrier → recipe loaded → index to mark station → clamp confirmed → Z-focus to recipe height → mark → verify → if grade ≥ B release, else reject lane → record to MES → unclamp → index.
- Alarms: three classes — stop immediately (safety), stop at end of cycle (process), warning (consumables, filter Δp high).
- Recovery: after any stop, the sequence resumes from the last confirmed state; a part with an unconfirmed mark is flagged for manual verification.
- User levels: operator (start, stop, reset), technician (manual mode, alarm history), engineer (recipes, parameters), administrator (users, network).
Design inputs (extract)

| Module | Design input | Value | Parent |
|---|---|---|---|
| Fixture | Locate on datums: A (three cast pads), B (bore, round pin), C (slot, diamond pin) | Repeatability ≤ 0.05 mm | SRS-03 |
| Indexer | Two-station rotary table, load while mark | Index ≤ 1.5 s, 180° | SRS-01 |
| Laser module | F-theta field to cover both variants' code positions | ≥ 110 × 110 mm | SRS-03, 06 |
| Focus axis | Z travel for variant height difference | 50 mm, repeatability ±0.02 mm | SRS-06 |
| Vision | Fixed DPM reader, field of view | ≥ 20 × 16 mm, ≥ 5 px per module | SRS-04 |
| Controls | PLC with OPC UA, safety PLC or relay per assessment | 3,000 records/day × 7 days | SRS-07, 08 |
| Enclosure | Laser-rated viewing window for 1,064 nm; interlocked doors | Class 1 in production | SRS-08 |

Traceability matrix (extract)

| URS | SRS / FRS | Design input | FAT test | SAT test |
|---|---|---|---|---|
| URS-02 | SRS-04 | Vision FOV, px/module | FAT-11: grade on 300 consecutive parts | SAT-06: grade on 1 shift of production |
| URS-03 | SRS-01 | Index time, mark time | FAT-04: 2-hour run at rate | SAT-09: 3-day run-at-rate |
| URS-07 | SRS-07 | OPC UA server, buffer | FAT-15: simulated MES | SAT-12: live MES, offline recovery |
| URS-11 | SRS-08 | Enclosure, interlocks | FAT-20: interlock validation | SAT-03: re-validation after install |

### 2.8 Design trade-offs

| Decision | Option A | Option B | How to choose |
|---|---|---|---|
| Who writes the URS | Customer alone: ownership, but often vague | Builder drafts for customer: precise, but risk of self-serving specs | Builder drafts, customer signs values line by line |
| Specification depth at quote | Detailed: fewer surprises, costly pre-sales | Outline: cheap, but price risk | Detail proportional to contract value and novelty |
| Hard numbers early | Enable design and test | May lock in unvalidated targets | Mark unvalidated values "TBC by trial" with a date |

### 2.9 Common mistakes

- Writing solutions in the URS ("shall use a 30 W fiber laser") instead of outcomes.
- Accepting "high speed" or "good quality" with no number or verification method.
- Taking one golden sample instead of 30+ production samples across cavities, shifts and suppliers.
- Ignoring year-3 volume and designing an architecture that cannot scale.
- No traceability matrix, so FAT tests are invented the week before FAT.

### 2.10 Troubleshooting — requirement defects

| Symptom | Likely cause | Diagnostic test | Corrective action | Preventive action |
|---|---|---|---|---|
| FAT argument over pass criteria | Acceptance criteria missing in URS | Check each URS line for its acceptance field | Agree criteria in writing before FAT | Eight-field rule at G0 |
| Machine meets spec, customer unhappy | VOC mistranslated | Re-read VOC against URS | Change order for real need | Customer walk-through of URS values |
| Late scope growth | Assumptions not listed | Compare design to signed assumptions | Price the change (Part 47) | Assumption list signed at G0 |
| Process fails at rate | Samples not representative | Test full production sample spread | Process re-development | 30+ samples across variation sources |

### 2.11 Design checklist

- All 15 customer inputs captured, or listed as signed assumptions
- Every URS line has all eight fields
- Takt, ideal cycle time and lifting load calculated
- Production-representative samples in hand (≥ 30, across variation sources)
- SRS and FRS written and traced to URS
- Traceability matrix links every URS line to FAT and SAT tests
- Customer signature on URS values, not just the cover page
- Change-control rule agreed for post-freeze changes

### 2.12 Key takeaways

- Customers state needs; the builder must turn each into a number, a condition and a test.
- The URS says what and how well; the SRS, FRS and design inputs say how.
- Traceability from VOC to SAT test is what makes FAT and SAT uncontroversial.
- Most project overruns trace back to an assumption nobody wrote down at Gate 0.
