---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 73
part_title: "Case 9 — High-speed pick-and-place machine (IC packages, tray to tape)"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Case 9 — High-speed pick-and-place machine (IC packages, tray to tape)

Two gantries with four-nozzle heads move packages from JEDEC trays into carrier tape at about 15,000 units per hour, checking each unit with a fly-by bottom camera and each pocket after sealing. Speed comes from gang picking and overlapping motion; quality comes from vision at three points and zero tolerance for mixing lots.

| Aspect | Design |
|---|---|
| Customer requirement | QFN 8 × 8 mm packages from JEDEC matrix trays into 12 mm embossed carrier tape, heat-sealed cover tape, reels labelled; ≥ 15,000 UPH; pin-1 orientation, lead or pad damage and mark (OCV) checked; no mixing of lots or bins; tray and reel traceability |
| Process | Tray stack in → tray to pick position → gang pick 4 units → fly over bottom camera (orientation, pads, OCV of top mark by a second camera if required) → place into tape pockets → seal cover tape → post-seal pocket inspection → reel wind → label |
| UPH | 15,000 units/h → 0.24 s per unit |
| Machine architecture | Tray stacker and shuttle; two independent gantries sharing one tape track, each with a 4-nozzle head; fly-by bottom camera per gantry; tape feeder, sealer and reel winder |
| Module breakdown | Input and output tray stackers; tray shuttle; gantry 1 and 2 (linear motors); 4-nozzle heads with θ rotation; bottom cameras; top camera for tray pocket and mark checks; tape feeder with sprocket drive; heat sealer; post-seal camera; reel winder; label printer; reject bin per gantry |
| Mechanical architecture | Granite or heavy welded base to take gantry reaction forces; lightweight heads; ESD-dissipative nozzles and contact parts |
| Motion architecture | Linear-motor X and Y per gantry (accelerations about 20–30 m/s²), Z and θ servos per nozzle; tape indexing servo; collision avoidance between gantries in the shared tape zone |
| Pneumatic architecture | Vacuum per nozzle with fast valves and pressure sensing (pick confirmation); blow-off pulse for release |
| Electrical architecture | 415 V, ≈ 10 kVA; drives with regenerative handling for high-dynamics axes |
| PLC architecture | Motion controller for gantries and heads; PLC for stackers, tape and sealer; vision PC; equipment PC with lot management and GEM where required |
| Vision | Bottom cameras (fly-by with strobe, position-compare triggered); tray pocket camera; post-seal camera for missing, flipped or rotated units in pockets |
| Safety | Fully guarded with interlocked covers; linear-motor hazards; heat sealer hot parts; tray stacker pinch points |
| Software | Lot start and end with tray and reel IDs; unit counts per reel; bin rules; purge on lot end so no unit carries over |
| MES | Lot, tray IDs, reel IDs and counts, rejects by reason; GEM events if the host requires |
| BOM (key items) | Two linear-motor gantries, eight nozzle Z-θ units, three camera systems, tray stackers, tape feeder, sealer, reel winder, label printer, vacuum system, motion controller |
| Cost (indicative) | Motion and heads ₹60 lakh; vision ₹25 lakh; tape and tray handling ₹30 lakh; controls and software ₹30 lakh; price ₹1.8–2.2 crore |
| Cycle time | Per gantry trip: pick 4 × 0.15 s = 0.6 s + fly-by 0.2 s + place 4 × 0.12 s = 0.48 s + tape index share 0.32 s + travel 0.3 s = 1.9 s per 4 units → 7,580 UPH per gantry → 15,160 UPH with two gantries alternating |
| Risk | Gantry interference in the shared tape zone (zoned motion and interlocks); pick failures on small or light packages (vacuum sensing, nozzle wear); seal quality (peel-force test); lot mixing at lot changes (purge sequence, counts) |
| FAT | 50,000-unit run; pick and placement error rate; vision seeded defects (flipped, rotated, damaged pads); peel-force tests; lot-change purge test |
| SAT | Material and label integration; 3-day run; reel quality audit by customer quality |
| Service | Nozzles and filters, sealer heater, tape guides, linear-motor encoder cleaning, camera calibration |

Design insight. A single gantry would need 0.95 s trips for four units — accelerations beyond what small heads can carry without vibration. Two gantries alternating into one tape lane keep each gantry at a comfortable 1.9 s trip, and give degraded-mode operation at half speed when one gantry is down.
