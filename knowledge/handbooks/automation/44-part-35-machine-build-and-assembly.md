---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 44
part_title: "Part 35 — Machine build and assembly"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 35 — Machine build and assembly

Build in the order that lets each step be verified before the next hides it: frame and datums first, then mechanics, motion, pneumatics, panel, wiring, sensors, software, process module, safety, calibration and debugging. Record every step in a build book so the as-built machine is known, not remembered.

### 35.1 Objective

Assemble the machine to released drawings with verified quality at each step, a safe first power-up, and complete as-built records ready for FAT.

### 35.2 Engineering concept

Assembly is a sequence of irreversible concealments: once a cover goes on, a cable is tied, or a module is bolted in, what lies beneath can no longer be inspected cheaply. Each step therefore ends with a check and a record.

### 35.3 Architecture — the 12-step build sequence

Durations are indicative for a mid-complexity SPM built by a small team.

| Step | Content | Prerequisites | Verification before next step | Typical duration |
|---|---|---|---|---|
| 1. Frame | Level frame, fit machined plates, dowel datums | Frame stress-relieved and machined | Level, flatness of mounting faces, datum positions | 2–3 days |
| 2. Mechanical assemblies | Fixtures, transfer, guards brackets | Parts passed incoming inspection | Fit, free movement, torque marks | 3–5 days |
| 3. Motion | Rails, screws, motors, belts; parallelism and squareness | Datum plates verified | Rail parallelism, screw alignment, friction traverse | 3–4 days |
| 4. Pneumatics | Valve terminal, tubing, FRL, actuators | Pneumatic schematic released | Leak test, tube labelling, flow controls set loosely | 1–2 days |
| 5. Electrical panel | Build and test the panel (often in parallel from week 1 of assembly) | Released schematics, panel BOM | Panel test: continuity, insulation resistance, functional I/O at bench | 5–10 days (parallel) |
| 6. Wiring | Field wiring from panel to devices, cable chains | Panel and devices mounted | Point-to-point check, labels both ends, shield terminations | 3–5 days |
| 7. Sensors | Mount, adjust, record settings | Wiring complete | Each sensor switching at the right point; IO-Link parameters saved | 1–2 days |
| 8. Software | Load controlled versions of PLC, HMI, robot, vision | Version-controlled release | Version numbers recorded; I/O mapping verified | 1 day to load, then iterative |
| 9. Process module | Laser, optics, chiller, fume, or other process units | Utilities available, safety enclosure closed | Process unit self-tests, alignment beam path | 2–4 days |
| 10. Safety | Guards, interlocks, safety program | Safety program released | Safety function validation per SRS (Part 27) | 1–2 days |
| 11. Calibration | Axes, laser field, camera, fixtures, TCP (Part 36) | Stable mechanics, warm-up | Calibration records with residuals | 2–3 days |
| 12. Debugging | Sequence, recovery, cycle time (Part 37) | All above | Internal dry-run FAT (Gate 8) | 1–3 weeks |

Safe first power-up

- Visual check; all breakers off; loads disconnected where possible.
- Verify protective bonding continuity and insulation resistance (IEC 60204-1 verification methods).
- Energize incoming supply; check phase sequence and voltages.
- Switch on 24 V supplies; check voltages and polarity at the panel and at the far devices.
- Power the PLC and safety PLC; verify safety functions before enabling any motion.
- Enable drives with torque limits and reduced speed; verify direction, limits and homing one axis at a time.
- Pressurize pneumatics at low pressure; check each actuator manually.

### 35.4 Components — build documentation

| Document | Content | Owner |
|---|---|---|
| Build book / traveller | Steps, sign-offs, dates, deviations | Assembly lead |
| Assembly instructions | Sequence, torques, adhesives, orientations, photos | Manufacturing engineer |
| Inspection records | Measurements at each verification point | Quality |
| Wiring check sheets | Point-to-point results, insulation and bonding tests | Electrical lead |
| As-built BOM | Actual serial numbers of critical parts (drives, laser, robot, safety devices) | Assembly lead |
| Parameter and software record | Versions, checksums, parameter backups | Controls lead |
| Punch list | Open items with owner and date | Project manager |
| NCR log | Nonconformances and dispositions | Quality |

### 35.5 Design methodology

- Plan the build: sequence, manpower, tools, kit lists per step (MBOM).
- Kit parts per step; do not start a step with missing parts except by documented exception.
- Build panel and modules in parallel; test each before installation.
- Verify at the end of each step; record results and deviations.
- Control changes: red-line drawings only through ECR/ECN (Part 47).
- Photograph concealed work before closing.
- Keep the punch list live; review daily.

### 35.6 Calculations

F_(preload)≈(T)/(K d)

H_(build)=∑_k^​ h_k⋅(1+r_(rework))

T = tightening torque; K = nut factor (≈ 0.15–0.2 for lightly oiled to dry steel); d = nominal diameter; h_k = estimated hours per step; r_rework = rework allowance (10–20% on first builds).

Example: an M8 bolt tightened to 25 N·m with K = 0.2 gives F ≈ 25 / (0.2 × 0.008) = 15.6 kN of clamp load — torque values belong on assembly instructions, not in a technician's memory.

### 35.7 Industrial example — build plan for the marking cell

- Week 1: frame levelled on the assembly floor; panel build starts in parallel.
- Week 2: shuttle axis installed; rail parallelism 8 µm over 600 mm recorded; nests fitted and repeatability checked (Part 10 test).
- Week 3: laser head, Z-axis, enclosure, pneumatics; panel tested at bench and installed.
- Week 4: field wiring, sensors, software load; safety validation; first laser firing in Class 1 enclosure.
- Week 5: calibration (galvo field, camera-to-galvo, nest offsets) and debugging; dry-run FAT at week end.

### 35.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Serial build vs parallel module build | Simple coordination | Shorter lead time, early testing | Parallel for anything beyond a small SPM |
| In-house vs outsourced panel build | Control, fast changes | Capacity, specialized quality | Outsource standard panels with in-house test; keep prototypes in-house |
| Full kitting vs build-as-parts-arrive | Fewer interruptions | Earlier start | Kit per step; exceptions documented |

### 35.9 Common mistakes

- Starting assembly on an unlevelled frame.
- Closing covers before photographs and checks.
- Powering up without bonding and insulation tests.
- Enabling all axes at once at full speed.
- Undocumented red-line changes on the shop floor.

### 35.10 Troubleshooting — build problems

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Axis binds after assembly | Rail parallelism, screw misalignment | Friction traverse by hand and torque monitor | Force vs position | Realign rails and bearing blocks | Parallelism check at step 3 |
| Wrong device responds to an output | Wiring or mapping error | Point-to-point and I/O check | Address vs tag | Correct wiring or mapping | Wiring check sheets |
| Pneumatic cylinder moves on power-up | Valve type or default state | Observe on air-up with outputs off | Valve state | Correct valve or soft-start sequence | Air-up procedure |
| Parts do not fit | Revision mismatch, tolerance | Compare part and drawing revisions | Measured dimensions | NCR, rework or remake | Revision control on the floor |

### 35.11 Design checklist

- Build plan with sequence, kits and manpower
- Verification and record at the end of every step
- Panel tested before installation
- Safe first power-up procedure followed and recorded
- Safety functions validated before normal motion
- As-built BOM with serial numbers of critical parts
- Software versions and parameters backed up
- Punch list and NCR log closed or dispositioned before FAT readiness

### 35.12 Key takeaways

- Build in the order that allows inspection before concealment.
- Test modules and the panel before integration.
- Power up in stages, safety first, one axis at a time.
- The build book is the machine's birth certificate.
