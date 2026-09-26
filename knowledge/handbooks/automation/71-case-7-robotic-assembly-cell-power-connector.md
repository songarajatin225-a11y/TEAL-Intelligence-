---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 71
part_title: "Case 7 — Robotic assembly cell (power connector)"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Case 7 — Robotic assembly cell (power connector)

A pallet-loop cell with two robots, a SCARA with a flexible feeder, a servo press, an automatic screwdriver and an end-of-line electrical tester assembles a five-contact power connector at 24 s per unit against a 51 s target. The case shows station balancing, force- and torque-monitored joining, and how an electrical test adds its own hazard to the safety case.

| Aspect | Design |
|---|---|
| Customer requirement | 900 assemblies/day, 2 shifts; housing (PA66), 5 press-fit contacts, elastomer seal, cover with 4 M3 thread-forming screws; contact push-out force ≥ 50 N; insulation resistance and continuity test at end of line; serial marking and genealogy; 3 variants (contact layouts) |
| Process | Housing load → contact insertion and press → seal insertion and presence check → cover placement and screwdriving → EOL test (continuity, insulation, contact height, push-out on sample) → laser-mark serial → unload good / NOK |
| UPH | Takt 54,000 s / 900 = 60 s; CT target ≤ 51 s |
| Machine architecture | Rectangular pallet loop (belt conveyor, 8 pallets) with four stations; fenced cell; operator supplies trays and bulk contacts from outside |
| Module breakdown | Pallet conveyor with lift-and-locate; 6-axis robot (housing and seal, cover); SCARA with flexible feeder and vision (contacts); servo press 1 kN; automatic screwdriver with screw feeder; EOL test fixture with spring probes and HV tester; marking head; reject drawer; safety fence; panel |
| Mechanical architecture | Welded base; pallets with variant inserts and RFID; press frame stiff enough for force monitoring; test fixture with guided probe plate |
| Motion architecture | Robots with their controllers under PLC job control; servo press with force–displacement; screwdriver with torque–angle; conveyor with stoppers |
| Pneumatic architecture | Pallet lift and locate, test-fixture probe plate, reject drawer lock, vacuum on seal EOAT |
| Electrical architecture | 415 V, ≈ 15 kVA; HV tester in its own interlocked enclosure |
| PLC architecture | PLC master with robot job handshake (Part 25); press and screwdriver controllers report curves and results; safety PLC for fence, drawers and HV test |
| Vision | Feeder vision for contact pose; seal presence and position; contact-height check by laser displacement or 2D side view |
| Safety | Fenced cell with guard-locked doors; robot safe zones; press within the robot cell guarding; HV test enclosure interlocked so voltage is applied only when closed; discharge verified before opening |
| Software | Variant from pallet RFID; station results merged in the part tracker; NOK routing; recovery per station |
| MES | Per serial: press curves (peak force, position), screw torque and angle for each screw, test values, verdict |
| BOM (key items) | 6-axis 7 kg robot; SCARA 3 kg; flexible feeder with camera; servo press; screwdriver with feeder; HV and continuity tester; marking laser; conveyor with 8 pallets; safety fence and PLC |
| Cost (indicative) | Robots and tooling ₹55 lakh; joining and test ₹40 lakh; conveyor, frame, guarding ₹25 lakh; controls and software ₹30 lakh; price ₹1.8–2.1 crore |
| Cycle time | Contact station: 5 × (pick 1.2 s + place 1.5 s) + 5 × press 1.5 s = 21 s; robot station (housing load 5 s + seal 6 s + cover 4 s) = 15 s; screwdriving 4 × 3.5 s = 14 s; EOL test 15 s; with 3 s pallet transfer per station: contact 24 s (bottleneck), combined robot 18 s, screwdriving 17 s, EOL test 18 s → CT = 24 s |
| Risk | Contact feeding tangles (feeder trials with production contacts); press-fit variation from housing moulding (force window from DOE); thread-forming torque scatter (torque–angle windows); HV test false fails from humidity (conditioning, guard ring) |
| FAT | 300 units per variant; press and screw capability; seeded defects (missing seal, wrong contact, loose screw) all caught; safety validation incl. HV interlock |
| SAT | Material flow with the customer's logistics; 2-shift run; MES genealogy; operator training on feeder refill and recovery |
| Service | Screwdriver bits and feeder wear parts; press load-cell calibration yearly; test fixture probes; robot TCP checks |

Design insight. The first concept used three robots. Because the contact station (24 s) is the bottleneck either way, merging housing load, seal insertion and cover placement into one 6-axis robot (an 18 s station) cost no cycle time and removed one robot, one set of safety zones and about ₹18 lakh. Balance stations to the target, not to the minimum achievable cycle.
