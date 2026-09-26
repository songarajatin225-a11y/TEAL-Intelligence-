---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 69
part_title: "Case 5 — Wafer handling and inspection machine"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Case 5 — Wafer handling and inspection machine

A standard EFEM feeds an inspection module that images the full surface and edge of 300 mm wafers. Throughput is easy (the chamber cycle supports about 170 WPH against a 60 WPH need); the hard problems are vibration, cleanliness, calibration, and the 2.8 GB of image data each surface pass generates — which must be processed on the fly, keeping only defect crops.

| Aspect | Design |
|---|---|
| Customer requirement | 300 mm wafers; macro-defect inspection of front surface (defects ≥ 20 µm) and edge (chips, cracks); wafer ID read; 60 WPH; GEM300 (E87, E90, E40, E94); SEMI S2/S8; particle adders within fab specification; defect results to the fab's yield system |
| Process | FOUP on load port (E84 hand-off) → map slots → robot picks wafer → pre-align and read ID → inspection chamber: align, surface scan (bright-field and dark-field), edge scan → classify defects → return wafer → report results per wafer and lot |
| UPH | Requirement 60 WPH; chamber cycle 21 s (below) gives 171 WPH ideal, leaving budget for a second illumination pass or finer resolution |
| Machine architecture | Purchased EFEM (two load ports, dual-arm robot, pre-aligner with ID reader, FFU) plus an in-house inspection module on an isolated granite base |
| Module breakdown | EFEM; inspection stage (XY air-bearing or rotary-linear); line-scan camera with bright- and dark-field illumination; edge camera; vibration isolation; image-processing computers; defect classifier; GEM300 software; utilities |
| Mechanical architecture | Granite base on active or passive isolators; stage with vacuum chuck contacting only the allowed backside zone; stainless and anodized aluminium covers; downflow from FFU through the chamber |
| Motion architecture | Linear-motor stage with linear encoders; scan speed synchronized to camera line rate via position-compare triggers (Part 13) |
| Pneumatic architecture | Minimal inside the chamber (electric actuators); CDA and vacuum for chuck through clean, filtered lines |
| Electrical architecture | 400 V, ≈ 12 kVA; SEMI F47 voltage-sag ride-through for chuck vacuum and controls; SEMI S22 electrical design |
| PLC architecture | Motion controller for the stage; EFEM controller; equipment PC running scheduler and GEM300; image-processing cluster |
| Vision | 16k line-scan at 5 µm/pixel (80 mm swath); four swaths per wafer; dark-field for particles and scratches, bright-field for pattern and stains; edge camera during 360° rotation; deep-learning classifier for defect types |
| Safety | SEMI S2 evaluation; covers interlocked; linear-motor magnet hazards labelled; ergonomic load-port height per S8 |
| Software | Scheduler for robot, aligner and chamber; recipe per product and layer; defect classification training workflow with engineering review |
| MES / host | GEM300 with carrier (E87), substrate tracking (E90), process and control jobs (E40, E94); defect result files in the fab's required format; EDA data for engineering where contracted |
| BOM (key items) | EFEM with two load ports; granite base and isolators; linear-motor stage; line-scan and edge cameras; illumination; GPU image-processing servers; GEM300 software; SEMI S2 evaluation |
| Cost (indicative) | EFEM ₹80–120 lakh; inspection module ₹1.2–1.8 crore; software and qualification ₹40–60 lakh; price ₹3.5–5 crore |
| Cycle time | Chamber: robot swap 6 s + align 3 s + surface scan 4 swaths × 1.2 s + 4 turnarounds × 0.5 s = 6.8 s + edge scan 5 s ≈ 21 s → 171 WPH; EFEM tasks overlap (Part 29) |
| Risk | Vibration blurring images (isolation, stage tuning, VC-level floor survey); particle adders from the stage (bellows, downflow, particle tests); classifier drift across products (training workflow); data throughput (on-the-fly processing, crop storage only) |
| FAT | Standard wafers with programmed defects (sensitivity and capture rate); repeatability of defect counts over 30 runs; particle-per-wafer-pass test; GEM300 compliance with host simulator; SEMI S2/S8 report |
| SAT | Fab host integration; correlation with the fab's reference inspection tool; throughput and availability over a qualification period |
| Service | Illumination life tracking; stage lubrication-free (air bearings) but filter and supply checks; calibration wafers monthly; classifier retraining service |

Data calculation. Wafer area π × 150² = 70,686 mm²; at 5 µm pixels that is 2.8 × 10⁹ pixels, about 2.8 GB per 8-bit pass. At 60 WPH and two passes this is over 300 GB per hour — impossible to store, easy to process on GPUs as it streams. The architecture decision to keep only defect crops and statistics sets the computing and storage design.
