---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 34
part_title: "Part 27 — Machine safety"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 27 — Machine safety

Safety is engineered from a documented risk assessment, not from a catalogue of guards. Follow the ISO 12100 order — eliminate or reduce the hazard by design, then safeguard, then warn — and give every safeguard that depends on control a safety function with a required performance level, a validated architecture and measured stopping performance. Know which requirements are law in the destination market and which are recommended practice.

### 27.1 Objective

Produce a risk assessment, a safety concept, a safety requirements specification (SRS) with PLr or SIL per safety function, a validated design, and the documentation the destination market requires.

### 27.2 Engineering concept

Mandatory vs recommended — keep them apart.

| Layer | What it is | Examples | Consequence |
|---|---|---|---|
| Law and regulation | Legally binding in the market where the machine is placed or used | EU Machinery Directive 2006/42/EC, replaced by Machinery Regulation (EU) 2023/1230 applying from 20 January 2027; India's Machinery and Electrical Equipment Safety (Omnibus Technical Regulation) Order 2024, applying from 1 September 2026 to listed machines with BIS certification; workplace safety law at the user's site; US OSHA regulations | Must comply; defines conformity route and documents |
| Harmonized or recognized standards | Standards that give presumption of conformity or are referenced by law | ISO 12100, ISO 13849-1, IEC 62061, IEC 60204-1, ISO 10218-1/-2, IEC 60825-1 | Using them is the normal way to show compliance |
| Contract and customer standards | Customer corporate safety specifications | Automotive OEM safety specs, fab EHS requirements, SEMI S2 | Binding by contract |
| Recommended engineering practice | Good practice, not required by any document | Guard colours, extra diagnostics, redundant stops beyond PLr | Improves safety or usability; optional |

Mentioning a standard does not make a machine compliant. Compliance is shown by a traceable chain: standard → requirement → design implication → verification record (Book XI, Part 56).

Standards structure (ISO/IEC machine-safety system)

| Type | Scope | Examples |
|---|---|---|
| A | Basic concepts for all machinery | ISO 12100 (risk assessment and risk reduction) |
| B1 | Safety aspects | ISO 13849-1:2023 and IEC 62061 (functional safety), ISO 13855:2024 (safeguard positioning), ISO 13854 (minimum gaps), IEC 60204-1 (electrical equipment) |
| B2 | Safeguards | ISO 14119:2024 (interlocking devices), ISO 14120 (guards), ISO 13850 (emergency stop), IEC 61496 (electro-sensitive protective equipment), ISO 13851 (two-hand controls), ISO 4414 (pneumatics) |
| C | Specific machine types | ISO 10218-1/-2:2025 (industrial robots), ISO 11553-1 (laser processing machines), SEMI S2 (semiconductor equipment, industry guideline) |

### 27.3 Architecture

Risk reduction hierarchy

| Step | Action | TEAL-type example |
|---|---|---|
| 1. Eliminate the hazard | Remove it by design | Keep pinch gaps ≥ the ISO 13854 minimum for fingers so the shuttle cannot crush |
| 2. Reduce the hazard | Lower energy, speed, force, power | Low-power pilot laser for alignment; reduced axis speed in maintenance |
| 3. Guard | Fixed guards, interlocked guards, enclosures | Class 1 laser enclosure with interlocked, locked doors |
| 4. Safety control | Safety functions with required PL/SIL | Door interlock removes laser emission and axis torque |
| 5. Warn and inform | Signs, lights, manuals, training, PPE | Laser warning labels on service panels, maintenance procedures |

Steps 1–2 are ISO 12100's inherently safe design; steps 3–4 are safeguarding and complementary measures; step 5 is information for use. Never jump to step 4 or 5 when steps 1–3 are practicable.

Safety function architecture

*Figure 11. Safety function architecture · 4 input types, logic, 4 output types, feedback* — [Figure not transcribed; see source document]

Every safety function is a chain of input, logic and output, each contributing to the achieved PL. Feedback from outputs (external device monitoring of contactors and valves) lets the logic detect a welded contact or stuck valve before the next demand.

### 27.4 Components

| Device | Function | Governing standard | Selection points |
|---|---|---|---|
| Fixed guard | Physical barrier, tool needed to remove | ISO 14120 | Opening sizes and distances per ISO 13857 |
| Interlocked guard, guard locking | Stops hazard on opening; keeps locked until safe | ISO 14119:2024 | Coding level against defeat, locking force, escape release |
| Light curtain / safety scanner | Detects entry | IEC 61496 | Type 4 for high PL, resolution, response time, muting |
| Emergency stop | Complementary protective measure | ISO 13850 | Stop category 0 or 1; never a substitute for safeguarding |
| Enabling device | Allows motion only while held in the middle position | IEC 60204-1, ISO 10218 | Three-position type |
| Two-hand control | Keeps both hands away | ISO 13851 | Type and synchronism |
| Safety relay | Monitors a few safety inputs | ISO 13849-1 | Few functions, fixed logic |
| Safety PLC | Programmable safety logic | ISO 13849-1, IEC 62061 | Many functions, zones, diagnostics |
| Drive safety functions (STO, SS1, SS2, SLS, SBC) | Safe torque removal and monitored motion | IEC 61800-5-2 | PL/SIL of the drive function, response time |
| Pneumatic safety valve (dump, soft start) | Removes or controls pneumatic energy | ISO 4414, ISO 13849-1 | Redundant, monitored valves for higher PL |
| Laser guard and shutter | Contains laser radiation | IEC 60825-4, ISO 11553-1 | Guard exposure rating, shutter monitoring |

Stop categories (IEC 60204-1). Category 0: immediate removal of power. Category 1: controlled stop, then power removed. Category 2: controlled stop with power maintained. Most servo machines use category 1 (SS1) for E-stop, so axes stop on their ramps before STO.

### 27.5 Design methodology — risk assessment to validation

- Define limits: intended use, foreseeable misuse, life-cycle phases (installation, operation, cleaning, maintenance, changeover, decommissioning), people exposed.
- Identify hazards per phase and zone: mechanical, electrical, thermal, laser radiation, fumes, noise, ergonomic, stored energy, battery-specific (short circuit, thermal runaway, electrolyte), chemical.
- Estimate risk: severity, frequency and duration of exposure, probability of the hazardous event, possibility of avoidance.
- Evaluate against acceptability; reduce by the hierarchy.
- Specify safety functions in the SRS: trigger, reaction, stop category, response time, PLr (ISO 13849-1) or SIL (IEC 62061), operating modes, reset behaviour.
- Design each function: category/architecture, component data (MTTF_D, B10_D, DC), common-cause measures; calculate the achieved PL.
- Validate: analysis plus fault-injection tests; measure stopping times; verify distances; record results.
- Document: risk assessment, SRS, calculations, validation report, residual risks in the manual; conformity documents required by the market (EU technical file and declaration; BIS certification documents for listed machines in India).
Risk graph for PLr (ISO 13849-1)

| Severity | Frequency / exposure | Possibility of avoidance | PLr |
|---|---|---|---|
| S1 slight, reversible | F1 seldom or short | P1 possible | a |
| S1 | F1 | P2 scarcely possible | b |
| S1 | F2 frequent or long | P1 | b |
| S1 | F2 | P2 | c |
| S2 serious, irreversible | F1 | P1 | c |
| S2 | F1 | P2 | d |
| S2 | F2 | P1 | d |
| S2 | F2 | P2 | e |

The 2023 edition refines guidance on the parameters and on the probability of occurrence; apply the edition in force for the project.

### 27.6 Calculations

S=K⋅T+C

T=t_(ESPE)+t_(logic)+t_(stop)

n_(op)=(d_(op)⋅h_(op)⋅3600)/(t_(cycle))

MTTF_D=(B_(10D))/(0.1⋅n_(op))

T_(10D)=(B_(10D))/(n_(op))

S = minimum distance from detection zone to hazard (mm); K = approach speed (the classic values are 2,000 mm/s for short distances and 1,600 mm/s beyond 500 mm); T = overall stopping time (s); C = intrusion allowance based on detection capability; n_op = operations per year of an electromechanical device; B_10D = operations until 10% dangerous failures; T_10D = replacement interval. ISO 13855:2024 revised parameters and added cases (for example interlocking guards and new sensor types); take design values from the edition in force — the example below shows the structure of the calculation.

Light-curtain distance (illustrative). 14 mm resolution (C ≈ 0 for finger detection in the classic method); light-curtain response 10 ms, safety PLC 15 ms, measured shuttle stopping time 150 ms → T = 0.175 s → S = 2,000 × 0.175 = 350 mm. A 20 ms slower brake adds 40 mm; stopping time must be measured at FAT and re-measured periodically.

Interlock switch life. Door opened 10 times per hour, 16 h/day, 300 days/year → n_op = 48,000/yr. With B_10D = 2,000,000: MTTF_D = 2,000,000 / 4,800 = 417 years (rated "high"; ISO 13849-1 caps the value used per channel), and T_10D = 42 years.

### 27.7 Industrial example — safety functions of the laser marking cell

| ID | Safety function | Hazard | Risk parameters | PLr | Design | Stop |
|---|---|---|---|---|---|---|
| SF1 | Emergency stop | Any | Complementary measure | d (by specification) | E-stop buttons → safety PLC → SS1 on drives, laser emission stop, air dump | Cat 1 |
| SF2 | Enclosure door interlock with guard locking | Laser radiation, moving shuttle | S2, F1, P2 | d | Coded interlocks with locking; unlock only when laser off and axes at standstill | Cat 1 |
| SF3 | Light curtain at load station | Impact from moving nest | S1 after gaps designed to ISO 13854 (crushing eliminated), F2, P2 | c | Type 4 light curtain → SS1 of shuttle; muting only when shuttle is at standstill and parked | Cat 1 |
| SF4 | Laser emission enable | Laser radiation | S2, F1, P2 | d | Laser key-switch interlock loop plus monitored shutter, only with SF2 locked | Cat 0 for emission |
| SF5 | Safe speed in maintenance | Crushing during setup | S2, F1, P1 | c | Enabling device + SLS 25 mm/s on shuttle | Cat 1 |
| SF6 | Pneumatic energy removal | Unexpected clamp motion | S1, F2, P1 | b | Monitored dump valve on SF1 and SF2 demand; operator-side clamp releases | — |

The design decision in SF3 shows the hierarchy working: an S2 crushing hazard would have required PL e; enlarging the gaps removed crushing, leaving an impact hazard at PL c.

### 27.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Safety relay vs safety PLC | Simple, cheap for 1–3 functions | Flexible, zones, diagnostics, safe fieldbus | Safety PLC beyond ~4 functions or with drive safety functions |
| Fixed guard vs light curtain | No control dependency, cheap | Fast access for frequent loading | Fixed where access is rare; ESPE where access is every cycle |
| Interlock only vs guard locking | Simple | Needed when the hazard outlasts the opening time (run-down, laser, stored energy) | Guard locking whenever stopping time exceeds the time to reach the hazard |
| Type 2 vs type 4 ESPE | Lower cost | Required for higher PL | Type 4 for PL d/e |
| ISO 13849-1 vs IEC 62061 | Category-based, familiar, all technologies | SIL-based, suits complex programmable systems | Either is valid; use one consistently per function |

### 27.9 Common mistakes

- Choosing guards before doing the risk assessment.
- Using E-stop as the primary safeguard.
- Distances calculated with datasheet stopping times instead of measured ones.
- Muting or bypass keys in maintenance mode without equivalent measures.
- Treating a standard mentioned in a brochure as compliance evidence.
- Forgetting laser radiation reflected through viewing windows and gaps.

### 27.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Light-curtain nuisance trips | Misalignment, reflections, weld or laser flashes, vibration | Alignment indicator, diagnostics log | Beam intensity, trip timestamps | Realign, shield, mount rigidly | Mounting and alignment spec |
| Discrepancy fault on dual-channel input | One contact slower or failed, wiring | Safety PLC diagnostics | Channel timing | Replace device, fix wiring | Diagnostics review at FAT |
| Guard lock does not release | Standstill not detected, laser not confirmed off | Check release conditions online | Standstill signal, laser status | Fix monitoring signal | Clear permissive display |
| Stopping time increased | Brake wear, heavier tooling, changed ramps | Stopping-time measurement | Stop time and distance | Restore brake, re-tune, recalculate distance | Periodic stopping-time check |
| Operators defeat interlocks | Access needed too often, slow restart | Observe tasks, count accesses | Access frequency | Redesign access, faster safe restart | Task analysis in risk assessment |

### 27.11 Design checklist

- Destination market's legal requirements identified; mandatory vs recommended separated
- Risk assessment per ISO 12100 for all life-cycle phases and zones
- Hierarchy applied: elimination and reduction tried before safeguarding
- SRS lists every safety function with PLr/SIL, reaction, stop category and response time
- Achieved PL calculated per function (architecture, MTTF_D, DC, CCF)
- Safety distances calculated with measured stopping times and the current ISO 13855 edition
- Interlocks and guard locking per ISO 14119:2024, protected against defeat
- Validation plan with fault injection; results recorded
- Residual risks and safe procedures in the manual; conformity documents prepared

### 27.12 Key takeaways

- Risk assessment first; guards and safety devices follow from it.
- Eliminating a hazard by design is cheaper than a higher PL.
- Measure stopping times; distances depend on them.
- Keep law, standards, contract and good practice separate, and prove compliance with records.
BOOK VI
