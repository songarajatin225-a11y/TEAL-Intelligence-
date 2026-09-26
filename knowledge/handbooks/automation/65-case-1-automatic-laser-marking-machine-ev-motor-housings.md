---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 65
part_title: "Case 1 — Automatic laser marking machine (EV motor housings)"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Case 1 — Automatic laser marking machine (EV motor housings)

A two-station rotary cell marks and verifies Data Matrix codes on die-cast aluminium motor housings at 3,000 per day with 80% headroom; the operator, not the laser, sets the cycle. This is the running example of Parts 2–4 assembled into one machine.

| Aspect | Design |
|---|---|
| Customer requirement | 3,000 housings/day (year 2), 3 shifts; 2 variants; Data Matrix 16 × 16, 0.40 mm modules; grade ≥ B as-cast and ≥ C after e-coat; MES traceability; footprint ≤ 3.0 × 2.5 m; 42 °C ambient; no chilled water (Part 2 URS) |
| Process | Slide in → RFID variant and serial from MES → clamp on datums A/B/C → Z-focus to recipe → mark → verify grade → record → unload good / reject lane |
| UPH | Takt 27 s (Part 2); machine ideal 288 UPH; 5,500 good/day capacity at 85% OEE |
| Machine architecture | Two-station servo rotary indexer: operator station outside, process station inside a Class 1 enclosure; indexer wall separates operator from laser |
| Module breakdown | Base frame; rotary indexer with two quick-change nest plates per variant; clamp units; laser head with Z-axis; DPM verifier; fume extractor; reject chute; panel; enclosure and safety; HMI; OPC UA edge |
| Mechanical architecture | Welded, stress-relieved steel base with machined top plate; indexer table 900 mm diameter; zero-point nest plates; aluminium-extrusion enclosure with laser-rated window |
| Motion architecture | Servo indexer (180° in 1.5 s, direct-drive torque motor or servo + low-backlash reducer); Z-focus servo with brake, 50 mm stroke |
| Pneumatic architecture | Two ×20 clamps per nest via a rotary union; soft-start and dump valve; air knife on protective window (oil-free branch) |
| Electrical architecture | 415 V 3-phase, ≈ 6 kVA; panel with 800 W cooling unit for 42 °C; separate standard and safety 24 V |
| PLC architecture | PLC with integrated motion over EtherCAT; safety PLC; state-machine framework; recipe per variant from RFID |
| Vision | Fixed DPM verifier (ISO/IEC TR 29158 grading) at process station, 1.5 s budget |
| Safety | Risk assessment (Part 27): SF1 E-stop; SF2 enclosure doors with guard locking; SF3 light curtain at operator station stops indexer; SF4 laser emission enable; SF5 maintenance SLS |
| Software | Modes: auto, manual, maintenance, setup; recovery disabled after partial marks (abort and quarantine) |
| MES | OPC UA: route check, serial and recipe down, part record up (grade, laser power, focus, time); 7-day buffer |
| BOM (key items) | 50 W MOPA fiber laser, galvo 10 mm, F-theta 254 mm, servo indexer, Z-servo, DPM verifier, RFID reader, safety PLC, light curtain, fume extractor 1.1 kW, cooling unit |
| Cost (indicative) | BOM ₹38 lakh; hours ₹17 lakh; total cost ₹59 lakh; price ₹85–90 lakh at 30% GM |
| Cycle time | Operator side: unload 5 s + load 5 s + clamp confirm 1 s = 11 s; process side: Z 0.5 s + mark 6 s + verify 1.5 s + record 0.5 s = 8.5 s; CT = max(11, 8.5) + index 1.5 = 12.5 s |
| Risk | Grade on as-cast porosity (mitigate: MOPA pulse tuning, trials on 3 casting lots); e-coat readability (trials with customer's paint shop); operator ergonomics at 288 UPH (slide-in fixtures); RFID on metal carriers (on-metal tags) |
| FAT | 2 h run at rate on both variants; 50 parts per variant for position Cpk; 300-part grade run; MES simulator with 1 h outage; safety validation; changeover ≤ 10 min |
| SAT | Utilities check; safety re-validation; one shift of 100% grading; 3-day run-at-rate with customer operators; live MES; e-coat readability confirmation on 30 parts |
| Service | PM plan (Part 42); spares: protective windows, clamp pads, nest pins, one Z-servo; laser source service-exchange; remote support via customer gateway |

Design insight. Because the operator sets the 12.5 s cycle, the cheapest way to double capacity later is a robot load (Part 25) on the same machine, not a faster laser. The indexer geometry and safety concept were chosen at G2 so that the upgrade needs no structural change.
