---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 85
part_title: "Part 60 — The Machine Builder Playbook"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 60 — The Machine Builder Playbook

When a new project arrives, run these 27 steps in order. Each step names what to do, the output that proves it is done, the gate it feeds and the part that explains it. Steps overlap in time; they do not overlap in responsibility.

| Step | Do this | Output that proves it | Gate | Part |
|---|---|---|---|---|
| 1. Understand the requirement | Run the VOC workshop; walk the process; collect ≥ 30 real samples; write URS lines with value, condition, verification and acceptance | Signed URS and assumption list | G0 | 2 |
| 2. Define the process | Map the flow with exceptions; find KPIVs by DOE; map the window; prove capability on samples | Process window and control plan draft | G1 | 3 |
| 3. Calculate cycle time | Planned time → OEE → CT_ideal; list operation times; compare parallelism options | Time chart and architecture comparison | G1 | 4 |
| 4. Create the machine architecture | Choose concept with weighted matrix and sensitivity; draw six views and the N² matrix | Concept decision, architecture baseline | G1–G2 | 5, 6 |
| 5. Break into modules | One function, one owner, one test per module; allocate CT, error and reliability budgets | Module list and specification sheets | G2 | 7 |
| 6. Select technology | Decide process source, handling principle, actuator families, controller class, vision type | Selection records with trade-offs | G2 | 5, 55 |
| 7. Design the mechanical system | Structure, elements, datums, error stack, fixtures, DFM/DFA | Drawings and calculations | G3 | 8–10, 32 |
| 8. Design motion | Profiles from time chart; size transmissions and servos; plan synchronization | Sizing files, axis parameters | G3 | 11–13 |
| 9. Design the pneumatic system | Size at minimum pressure; choose valves by safe behaviour; air budget; vacuum | Pneumatic schematic and calculations | G3 | 14, 15 |
| 10. Design the electrical system | Load list, protection, 24 V budget, panel heat and layout, EMC, earthing | Schematics, panel layout, load list | G3 | 16, 17 |
| 11. Design controls | Select PLC; sensors; network; layered program structure; interlocks; alarms | I/O list, network plan, controls architecture | G3 | 18, 19, 22 |
| 12. Design vision | Pixel size from tolerance; optics; lighting trials; calibration; coordinate conventions | Vision specification and calibration method | G3 | 24 |
| 13. Design safety | Risk assessment; hierarchy; SRS with PLr; architecture; distances; validation plan | Safety concept, SRS, PL calculations | G2–G3 | 27 |
| 14. Design software | State machine, modes, recovery, part tracking, HMI, MES data and handshake | FRS, state table, data dictionary | G3 | 20, 21, 23 |
| 15. Create the BOM | Structure by module; classify; make or buy; landed costs; spares | Released BOM | G4 | 33 |
| 16. Procure | Complete RFQs; evaluate on TCO; qualify with first articles; track long-lead | POs, FAI reports, IQC records | G4–G6 | 34 |
| 17. Build | Kit per step; build in inspection order; record in the build book | Build book, as-built BOM | G6 | 35 |
| 18. Integrate | Safe staged power-up; I/O check; sequences; recovery; safety validation | Integration and validation records | G7 | 35, 27 |
| 19. Debug | Evidence → hypothesis → measurement → root cause → fix → verification | Closed issue log | G8 | 37 |
| 20. Calibrate | Base outward: axes, fixtures, tool, camera, robot; traceable references; residuals | Calibration records | G8 | 36 |
| 21. Run FAT | Dry-run first; then execute protocol with customer; classify deviations | Signed FAT report | G8 | 38 |
| 22. Ship | Record references; back up; lock, drain, pack, indicate | Packing list, reference record | — | 39 |
| 23. Install | Verify site first; rig, level, reconnect, re-validate safety, restore references | Installation record | G9 | 40 |
| 24. Run SAT | Site tests, live MES, multi-day run-at-rate with customer operators, training | Signed SAT, acceptance certificate | G9 | 40 |
| 25. Release to production | Ramp with loss tree; hypercare; capability on production lots; spares; handover | Handover record | G10 | 41 |
| 26. Service | PM plan, spares, remote support, field data, 8D on failures | Service reports, KPIs | — | 42, 43 |
| 27. Improve continuously | Post-calculate; update FMEA, design rules, checklists; promote modules to the platform; localize | Lessons learned, platform release notes | Portfolio | 44–52 |

The first ten working days of any new project

- Day 1–2: VOC workshop, process walk, sample request, site data request.
- Day 3: draft URS with assumptions; start the risk register.
- Day 4: takt and CT_ideal; first operation-time list; long-lead list draft.
- Day 5: process trial plan on samples.
- Day 6–7: three concepts, time charts, first error budgets.
- Day 8: customer review of URS values and concept criteria.
- Day 9: cost estimate ±30%; schedule backward from the SAT date.
- Day 10: Gate 0 decision, and a Gate 1 date on the calendar.
