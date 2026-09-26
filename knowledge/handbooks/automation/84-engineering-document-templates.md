---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 84
part_title: "Engineering document templates"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Engineering document templates

Twenty-three templates, ready to copy. Text templates are shown as documents; list-type templates are CSV grids you can copy into a spreadsheet. Each links to the part that explains how to fill it.

T1 — URS (Part 2)

| # URS — [machine] for [customer], rev [x] ## 1. Scope and intended use ## 2. Product (drawings, variants, samples) ## 3. Requirements \| ID \| Requirement \| Value and unit \| Condition \| Priority \| Verification \| Acceptance \| Source \| ## 4. Assumptions (signed) ## 5. Utilities, space, environment ## 6. Safety, regulations, customer standards ## 7. Data and MES ## 8. Documentation, training, delivery Signatures: customer [ ] builder [ ] date [ ] |
|---|

T2 — SRS (Part 2)

| # SRS — [machine], rev [x] \| ID \| System requirement \| Value \| Parent URS \| Verification (FAT/SAT ID) \| Takt and CT_ideal calculation · Accuracy budget summary · Interfaces · Compliance targets |
|---|

T3 — FRS (Parts 2, 20)

| # FRS — [machine], rev [x] 1. Modes and user levels 2. State table (entry actions, exit conditions, timeouts, fault behaviour) 3. Auto sequence per module 4. Manual functions and interlocks 5. Alarms (class, text, remedy) 6. Recipes and variant handling 7. Recovery, retry, abort 8. Data records and MES handshake |
|---|

T4 — Process flow (Part 3)

| # Process flow — [process] \| Step \| Operation \| Input \| Output \| CTQ / KPIV \| Module \| Exception path \| Exceptions: no-read · NOK · rework · abort · quarantine |
|---|

T5 — Machine architecture (Part 6)

| # Architecture — [machine] Views: functional · physical · control · safety · data · utility N² interface matrix · ICD list Budgets: cycle time · error · power · air · heat · I/O and network · mass and footprint |
|---|

T6 — Module specification (Part 7)

| # Module [ID] — [name] · Owner [ ] Function · Inputs · Outputs Allocated budgets: CT [s] · error [mm] · stop rate [/h] · power [W] · air [NL/min] · heat [W] Components and key selections · Interfaces (ICD refs) · Failure modes (DFMEA refs) Design considerations · Stand-alone test and acceptance · Spares and maintenance points |
|---|

T7 — Motor sizing (general) (Parts 11, 12)

| # Motor sizing — [axis] Load and duty · Transmission · Speed required · Torque required (continuous, peak) Candidate motor · Margins · Thermal check · Brake (vertical) · Decision and reviewer |
|---|

T8 — Servo sizing (Part 12)

| # Servo sizing — [axis] Inputs: stroke, move time, dwell, cycle, mass, friction, external force, transmission data Profile: t_a, t_c, t_d, v_max, a Inertias: J_L, J_screw, J_coupling, J_m · Torques per phase · T_peak · T_RMS · n_max · inertia ratio Transmission limits: critical speed, DN, buckling · Regeneration · Drive, encoder, cable Result: motor / drive part numbers · margins · checked by [ ] |
|---|

T9 — Pneumatic calculation (Part 14)

| Actuator | Function | Bore mm | Rod mm | Stroke mm | Min pressure bar | Load N | Load ratio % | Speed mm/s | Valve | Flow NL/min | Air per cycle NL | Cycles/min | Consumption NL/min |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A101 | Clamp nest 1 | 20 | 8 | 15 | 4.0 | 67 | 53 | 50 | 5/2 mono | 26 | 0.09 | 11.3 | 1.0 |

T10 — Electrical load list (Part 16)

| Consumer | Supply | Rated kVA | Diversity | Demand kVA | Current A | Protection | Cable mm2 |
|---|---|---|---|---|---|---|---|
| Servo drive shuttle 750 W | 3-phase | 0.90 | 0.6 | 0.54 | 1.3 | MCB C6 | 1.5 |
| Fiber laser 50 W | 1-phase | 0.40 | 1.0 | 0.40 | 1.7 | MCB C6 | 1.5 |

T11 — I/O list (Parts 18, 19)

| Tag | Address | Type | Description | Device | Module | Signal | Logic | Terminal | Cable |
|---|---|---|---|---|---|---|---|---|---|
| B101 | I10.0 | DI | Part seated nest 1 | Inductive M8 IO-Link | M05 | 24 V PNP | NO | X3:12 | W101 |
| Y101 | Q4.0 | DO | Clamp nest 1 extend | Valve terminal coil 1 | M06 | 24 V |  | X5:01 | W201 |

T12 — Sensor list (Part 18)

| Tag | Question answered | Type | Part number | Range/setting | Output | Response ms | IO-Link params saved | Spare |
|---|---|---|---|---|---|---|---|---|
| B110 | Part height in recipe window? | Laser triangulation | [pn] | 30-80 mm | IO-Link | 2 | Yes | 1 |

T13 — BOM (Part 33)

| Item | Rev | Level | Parent | Description | Manufacturer | MPN | Qty | Class | Make/Buy | Lead time wk | Supplier | Unit cost | Spare flag |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M04-P020 | A | 4 | M04-A01 | Servo motor 750 W | [mfr] | [mpn] | 1 | Critical | Buy | 6 | [supplier] | [cost] | Y |

T14 — RFQ (Part 34) — use templates A (build-to-print) and B (bought-in equipment) in Part 34.

T15 — Supplier evaluation (Part 34)

| Criterion | Weight | Supplier A | Supplier B | Supplier C | Evidence |
|---|---|---|---|---|---|
| Process or part result | 30 |  |  |  |  |
| Quality system and metrology | 15 |  |  |  |  |
| Capacity and lead time | 15 |  |  |  |  |
| Local service and support | 15 |  |  |  |  |
| Total cost of ownership | 25 |  |  |  |  |

T16 — Design review record (Part 57, gates)

| # Design review — [gate / discipline] — [date] Attendees and roles · Documents reviewed (numbers, revisions) Checklist result (Part 57) · Findings (ID, description, severity, owner, due) Decision: go / go with conditions / no-go · Conditions and risk-register links Signatures |
|---|

T17 — Risk register (Part 46)

| ID | Risk | Category | Probability 1-5 | Impact 1-5 | Score | Mitigation | Owner | Trigger | Status | Due |
|---|---|---|---|---|---|---|---|---|---|---|
| R1 | Laser source late | Supply | 3 | 5 | 15 | Early order; demo loan clause | Procurement | No ship notice by wk 10 | Open | wk 10 |

T18 — FMEA (Part 44)

| Item/Step | Function | Failure mode | Effect | S | Cause | Prevention | O | Detection | D | RPN/AP | Action | Owner | Due | S2 | O2 | D2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Nest pins | Locate part | Pin wear | Position drift | 7 | Low hardness |  | 5 | Position audit | 5 | 175 | Hardened replaceable pins | Mech lead |  | 7 | 2 | 5 |

T19 — FAT protocol (Part 38)

| # FAT protocol — [machine] Scope and references · Preconditions (G8) · Instruments · Samples \| FAT ID \| Requirement \| Procedure \| Acceptance \| Result \| Evidence \| Sign \| Deviation classes A/B/C · Release criteria · Signatures |
|---|

T20 — SAT protocol (Part 40) — use the template in Part 40.

T21 — Preventive maintenance plan (Part 42)

| Task ID | Module | Task | Frequency | Duration min | Skill | Tools/parts | Condition trigger | Record |
|---|---|---|---|---|---|---|---|---|
| PM-01 | Laser | Inspect protective window | Every shift | 2 | Operator | Spare window | Contrast drop | Shift log |
| PM-08 | Shuttle | Lubricate guides and screw | Monthly | 20 | Technician | Grease gun | Torque trend +20% | PM record |

T22 — Spare-parts list (Parts 41, 42)

| Item | Description | MPN | Qty installed | Recommended stock | Class | Lead time wk | Criticality | Supplier |
|---|---|---|---|---|---|---|---|---|
| M08-P005 | Protective window | [mpn] | 1 | 20 | Consumable | 2 | High | [supplier] |
| M04-P020 | Servo motor 750 W | [mpn] | 1 | 1 | Critical spare | 6 | High | [supplier] |

T23 — Machine handover (Parts 40, 41, 48)

| # Machine handover — [machine serial] — [date] Acceptance: SAT report [no.] · open items (owner, date) Performance at handover: UPH, yield, OEE, Cpk Training: names, roles, competence records Documentation delivered: list with revisions Software and parameter backups: versions, checksums, media Spares and consumables on site: list Warranty start date · Service contacts and response times Signatures: customer production, customer maintenance, builder project manager, builder service |
|---|
