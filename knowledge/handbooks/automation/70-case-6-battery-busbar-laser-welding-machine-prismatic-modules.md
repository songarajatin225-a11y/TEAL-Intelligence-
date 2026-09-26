---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 70
part_title: "Case 6 — Battery busbar laser welding machine (prismatic modules)"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Case 6 — Battery busbar laser welding machine (prismatic modules)

A pallet-fed station welds aluminium busbars to the terminals of 12-cell prismatic modules with a ring-mode fiber laser on a gantry-mounted scanner. The 49 s cycle fits the 102 s target easily; the design effort goes into fit-up (hold-down and height scan), weld monitoring on every seam, and the safety case for an energized product with a multi-kilowatt laser.

| Aspect | Design |
|---|---|
| Customer requirement | 30 modules/h; 12 prismatic cells in series per module; 24 terminal-to-busbar joints; Al busbar 2 mm on Al and Cu (or Al-clad) terminals; joint resistance and pull strength per customer specification; no damage to cell vents or seals; per-joint traceability |
| Process | Pallet in (module stacked, compressed and banded) → terminal cleaning (upstream laser-cleaning station) → busbar placement (upstream robot) → hold-down → height and gap scan → weld 24 seams with wobble or ring-mode profile → 3D seam inspection → pallet out |
| UPH | Takt 120 s; CT target ≤ 102 s at 85% OEE |
| Machine architecture | Pallet conveyor station; gantry XY carrying a scanner head over the module; hold-down tool lowered by a servo Z; laser source and chiller beside the cell; Class 1 enclosure with guard panels rated for the power |
| Module breakdown | Pallet conveyor with lift-and-locate; hold-down tool with spring fingers and load cells; gantry; scanner head with coaxial camera and process monitoring; line-laser height sensor; 3D inspection sensor; fume extraction; laser and chiller; panel; safety; MES edge |
| Mechanical architecture | Welded base; dual-drive gantry (Part 13) over a 700 × 400 mm module; hold-down tool machined to busbar layout with replaceable fingers; extraction hood on the head |
| Motion architecture | Gantry X (dual drive), Y, and Z for focus and hold-down; scanner covers each 2-joint field; position-compare triggers for the height scan |
| Pneumatic architecture | Pallet lift and locate pins; tool change clamps; argon or nitrogen shielding where the process requires |
| Electrical architecture | 415 V, ≈ 30 kVA (laser and chiller dominate); separate safety 24 V; UPS for the IPC |
| PLC architecture | PLC with gantry motion; scanner card for weld patterns; process-monitor PC; safety PLC with SLS for maintenance |
| Vision | Coaxial camera for busbar position correction; 3D line sensor for gap before welding and seam geometry after |
| Safety | Class 1 enclosure with guard panels rated per IEC 60825-4 for the source power; guard locking; module is energized (12 × 3.2 V ≈ 38 V DC nominal): insulated tooling and short-circuit prevention; thermal-event detection (thermal camera, smoke) with a quarantine procedure |
| Software | Weld recipe per module type; per-joint pattern; re-weld path for flagged joints within limits; interlock: no weld if hold-down force or gap out of window |
| MES | Module serial from pallet RFID; per-joint gap, weld energy, monitor features, inspection verdict; cell-position genealogy (Part 23) |
| BOM (key items) | 4–6 kW ring-mode fiber laser; scanner head with monitoring; chiller ≈ 8 kW; dual-drive gantry; hold-down tool with load cells; line-laser sensors; pallet conveyor; fume extraction; safety PLC |
| Cost (indicative) | Laser and optics ₹80–120 lakh; mechanics and gantry ₹40 lakh; controls, vision, software ₹35 lakh; station price ₹2.2–2.8 crore |
| Cycle time | Pallet in and locate 10 s + hold-down 5 s + height scan 6 s + weld 24 × 0.6 s = 14.4 s + field moves 6 × 1 s = 6 s + 3D inspection 8 s = 49.4 s ≤ 102 s |
| Risk | Terminal cleanliness and oxide (upstream cleaning with verification); Al–Cu intermetallics where terminals are copper (low line energy, controlled penetration, trials); spatter on cell tops (ring-mode, extraction); penetration into cell (monitoring, power checks); back-reflection |
| FAT | 20 modules of production cells; pull and resistance tests on witness joints; cross-sections; monitoring correlation with deliberate gap defects; safety validation including guard exposure rating; data completeness |
| SAT | Line integration with upstream stacking and downstream EOL test; 3-day run; thermal-event drill with the customer's EHS team |
| Service | Protective window and nozzle spares; hold-down fingers; chiller PM; weekly power check; quarterly focus and field verification |

Design insight. The 50% idle time is deliberate: it allows a full re-weld pass on flagged joints and future modules with 48 joints without a second station. The binding constraint is not rate but proving every joint, so the budget went into monitoring and inspection rather than a faster gantry.
