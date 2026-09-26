---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 27
part_title: "Part XXVI — Reference Machine Architectures and Case Studies"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XXVI — Reference Machine Architectures and Case Studies

Ten reference machines and eight end-to-end cases show the whole chain — photon to product — resolved into concrete engineering choices. Specifications are typical configurations for orientation, not designs to copy; every real machine starts from a URS and a proven process window (Part XXIII).

## 26.1 Reference machine architectures

Every machine follows the generic pattern of §11.1–11.2; the tables record what is specific.

1. Fiber laser marking machine (Class 1 workstation)

| Aspect | Typical configuration |
|---|---|
| Block diagram | 20–50 W MOPA fiber source (integrated isolator/collimator) → optional 2–3× expander → 10 mm galvo → F-theta f 160 mm → part on fixture; motorised Z; IPC with scan card |
| BOM architecture | Source; galvo and scan controller; F-theta; Z column; Class 1 cabinet with laser-safe window and interlocked door; IPC and HMI; 24 V supply and safety relay; fume extractor; red pointer; optional rotary axis and camera |
| Mechanical | Welded frame, cabinet enclosure, T-slot table or fixture plate, motorised Z for focus, optional rotary chuck |
| Optical | Spot ≈ 30–40 µm; field ≈ 110 × 110 mm; ±0.3 mm focus band for ±5% spot (§4.6) |
| Electrical | Single-phase supply; source DB25 interface; door interlocks, E-stop and key switch to safety relay; emission-enable hard-wired |
| Software | Vector/raster marking, variable data (serials, dates, codes), DataMatrix/QR, job library, user levels, optional MES link |
| Vision | Optional camera for positioning and code verification |
| Safety | Class 1 enclosure, interlocked door, key switch, E-stop, emission indicator, extraction interlock |
| Process flow | Load → close door → (align) → mark → (verify) → unload |
| Applications | Tools, nameplates, medical instruments, electronics housings, automotive parts |

2. CO₂ PCB marking machine (in-line)

| Aspect | Typical configuration |
|---|---|
| Block diagram | 10–30 W sealed RF CO₂ (9.3 or 10.6 µm) → ZnSe expander → galvo (Si or Be mirrors) → ZnSe F-theta f ≈ 100 mm → PCB on SMEMA conveyor; head on XY gantry for large panels; camera for fiducials and code grading |
| BOM architecture | CO₂ source (air- or water-cooled); expander; galvo and controller; F-theta; width-adjustable conveyor with stop and clamp; XY gantry; camera, lighting, code verifier; PLC, IPC/HMI; extraction with HEPA and carbon; tunnel enclosure; MES interface; optional board flipper |
| Mechanical | Tunnel enclosure with labyrinth entries; motorised conveyor width; board support against sag; gantry to reach all panel positions |
| Optical | Spot ≈ 120–135 µm (§4.6); DataMatrix modules ~0.2–0.3 mm; field per position ~70 × 70 mm |
| Electrical | PLC with servo gantry; SMEMA / IPC-HERMES-9852 upstream–downstream; safety relay for covers |
| Software | Board-type recipes, fiducial offsets, serialisation from MES, grade-based reject, per-board records |
| Vision | Fiducial alignment; post-mark read and grade (ISO/IEC 15415 or 29158) |
| Safety | Class 1 tunnel with interlocked covers; no line-of-sight through board gaps |
| Process flow | Board in → stop and clamp → fiducials → mark → read and grade → MES record → release or reject |
| Applications | Bare PCB and PCBA traceability, panels, FPC and substrates |

3. UV marking machine

| Aspect | Typical configuration |
|---|---|
| Block diagram | 3–10 W 355 nm DPSS or fiber-based source → expander → galvo with UV-coated mirrors → fused-silica UV F-theta f 100–160 mm → part |
| BOM architecture | UV source (often water-cooled with chiller); UV-grade optics; galvo and controller; enclosure with UV-rated window; IPC; extraction |
| Mechanical | Workstation or in-line; vibration-stable base |
| Optical | Spot ≈ 15–25 µm; UV coatings and crystal-shift monitoring are the main service items |
| Electrical and software | As machine 1; plus source crystal-position and hours monitoring |
| Vision | Camera for positioning and verification on small parts |
| Safety | Class 1 enclosure; UV-rated viewing window |
| Process flow | As machine 1 |
| Applications | White and light plastics, cables, glass, silicon, medical devices, small electronic parts |

4. Laser welding machine (fiber, wobble head)

| Aspect | Typical configuration |
|---|---|
| Block diagram | 1–3 kW CW fiber → QBH → wobble head (collimator, internal galvo mirror, focus lens, cross-jet, shielding nozzle) → part in fixture on XYZ + rotary |
| BOM architecture | Source and chiller; wobble head; 3–5-axis motion or robot; fixtures with clamps and Cu heat sinks; shielding-gas console; seam-tracking sensor; process-monitoring module (photodiodes or OCT); PLC/CNC; Class 1 cell |
| Mechanical | Rigid gantry or robot cell; quick-change fixtures; spatter shields |
| Optical | Spot ≈ 100–400 µm; wobble amplitude 0.2–2 mm at 100 Hz–kHz |
| Electrical | Three-phase source supply; safety PLC; gas and chiller interlocks |
| Software | Weld recipes (power ramps, wobble pattern, speed), seam-tracking offsets, monitoring envelopes, per-weld data |
| Vision | Seam finding, pre- and post-weld inspection |
| Safety | Class 1 cell with laser-rated guarding; fume extraction; interlocked doors |
| Process flow | Load and clamp → locate seam → weld with monitoring → inspect → unload |
| Applications | Sensors, housings, battery components, medical devices, automotive parts |

5. Laser soldering machine — architecture, modules and process flow are given in §10.5. BOM highlights: 30–150 W fiber-coupled 9xx nm diode; head with coaxial camera, IR pyrometer and wire feeder or ball-jet nozzle; XYZ gantry; SMEMA conveyor; PLC/IPC with real-time temperature controller; Class 1 enclosure; flux-fume extraction; per-joint temperature records.

6. Battery module welding machine

| Aspect | Typical configuration |
|---|---|
| Block diagram | 3–6 kW CW fiber with ring/adjustable mode (or green for Cu) → 2D/3D scanner with long focal length → module on pallet under clamping mask (down-holder); OCT depth sensor through the scanner; gantry positions the scanner over the module |
| BOM architecture | Source and chiller; scanner optics with OCT; gantry or robot; pallet conveyor; clamping masks per module type; 2D/3D vision to locate each terminal; pre-weld laser cleaning station (often upstream); fume extraction rated for Al dust; PLC and IPC; MES link |
| Mechanical | Stiff gantry; mask tooling with Cu contact inserts; pallet locating to ±0.05 mm class |
| Optical | Spot ≈ 100–300 µm; wobble or spiral paths per joint |
| Electrical | Three-phase; safety PLC; clamping pressure and gas interlocks |
| Software | Weld maps per module variant; vision-corrected positions; OCT and photodiode envelopes; per-weld pass/fail and data for the battery passport (§15.3) |
| Vision | Terminal location, gap and height checks before welding; post-weld inspection |
| Safety | Class 1 cell; extraction interlocks; fire detection (Li cells) |
| Process flow | Pallet in → clamp → scan terminals → weld sequence with monitoring → inspect → electrical test → release |
| Applications | Cylindrical, prismatic and pouch modules; busbars; pack terminals |

7. Laser cleaning machine

| Aspect | Typical configuration |
|---|---|
| Block diagram | 200 W–2 kW pulsed ns fiber (high pulse energy) → armoured fiber → 1D or 2D scanner head, f 160–420 mm → surface; hand-held gun or robot-mounted |
| BOM architecture | Source and chiller; scanner head; hand-held gun or robot adapter; extraction nozzle and filter unit; controller with recipe library; safety kit |
| Mechanical | Mobile trolley (hand-held) or robot cell; nozzle stand-off guides |
| Optical | Line or area scanning; fluence set between contaminant and substrate thresholds (§10.9) |
| Electrical | Single- or three-phase by power; interlocks on gun trigger and area access |
| Software | Recipes per coating and substrate; scan width and speed; logging |
| Vision | Optional camera or spectroscopic end-point check |
| Safety | Hand-held: controlled laser area, eyewear, barriers and ISO 11553-2 requirements; robot: Class 1 cell |
| Process flow | Select recipe → clean → verify (contact angle, visual) |
| Applications | Pre-weld oxide removal, paint and coating stripping, mould cleaning, rust removal, pre-bonding activation |

8. Laser cutting machine (flatbed)

| Aspect | Typical configuration |
|---|---|
| Block diagram | 3–20 kW CW fiber → feeding fiber → cutting head (zoom, capacitive height sensing, window monitoring) → sheet on exchange table; gantry with dual drives |
| BOM architecture | Source and chiller; cutting head; gantry with linear motors or rack-and-pinion drives; CNC and servo drives; pallet changer; gas console (N₂, O₂, air); zoned down-draft extraction; Class 1 enclosure with laser-safe windows; nesting CAM; optional load/unload tower |
| Mechanical | Stress-relieved welded bed; lightweight high-stiffness gantry (1–2 g); slat tables |
| Optical | Spot ≈ 100–300 µm; focus and spot set by recipe per material and thickness |
| Electrical | Three-phase; CNC safety; gas and chiller interlocks |
| Software | CNC with cutting technology tables, piercing and corner strategies, nesting, remote monitoring |
| Vision | Optional camera for sheet edge and remnant detection |
| Safety | Full enclosure, interlocked doors, extraction with spark arrestor and fire protection |
| Process flow | Nest → load sheet → pierce and cut per technology table → unload and sort |
| Applications | Sheet metal fabrication, enclosures, automotive and agricultural parts, electrical cabinets |

9. Semiconductor marking machine

| Aspect | Wafer marker | Package / strip marker |
|---|---|---|
| Block diagram | Green 532 nm ns DPSS (or fs) → galvo or fixed optics → wafer on chuck | Fiber 1064 nm, green or UV → galvo → strips or JEDEC trays |
| BOM architecture | Source; optics; EFEM with FOUP load ports, robot and aligner (notch/flat); chuck; OCR/verification camera; minienvironment; tool controller | Source; galvo; strip/tray handler; vision for position and OCV; extraction; controller |
| Mechanical | Cleanroom-compatible materials, particle control | Precision indexing of strips |
| Software | SECS/GEM host interface; recipe per product; ID assignment from host | Lot-based mark content; OCV reject logic |
| Safety and compliance | Class 1; SEMI S2/S8 | Class 1 |
| Process flow | FOUP → align → mark → read/verify → FOUP | Strip in → align → mark → OCV → strip out |
| Applications | Wafer IDs (front or back side) | Package top marks, lot codes, 2D codes |

10. Ultrafast laser micromachining machine

| Aspect | Typical configuration |
|---|---|
| Block diagram | 20–100 W ps/fs source (1030/515/343 nm) → attenuator (λ/2 + polariser) and shutter/AOM → expander → galvo (or polygon) + telecentric F-theta, or fixed objective over XY stages → part |
| BOM architecture | Source and chiller; free-space beam train on a stabilised breadboard; scanner or objective; air-bearing XY + Z; granite base with vibration isolation; TTL camera; confocal height sensor; debris extraction and gas knife; motion controller with PSO; CAD/CAM |
| Mechanical | Granite frame; temperature-controlled enclosure (±0.5 °C class) |
| Optical | Spot 5–20 µm; Bessel or multi-spot options for glass (§5.4) |
| Electrical | Clean power, separate grounds for motion and optics |
| Software | CAD/CAM with scanner–stage coordination, burst and pulse-train control, calibration routines |
| Vision | Fiducial alignment, in-process and post-process inspection |
| Safety | Class 1 enclosure; beam path fully enclosed; X-ray assessment at very high intensity (§24.2) |
| Process flow | Load → align → height map → process → clean → inspect |
| Applications | Glass and sapphire cutting and drilling, FPC, stents and medical tubes, semiconductor grooving, display repair |

## 26.2 End-to-end case studies

Each case walks the handbook’s chain from product to machine. Parameters are indicative starting points for a DOE, not validated recipes.

Case 1 — Smartphone → camera cover lens → sapphire → ultrafast cutting

| Step | Decision |
|---|---|
| Component and material | Rear-camera cover lens, sapphire (~0.3–0.5 mm) |
| Requirement | Contour and chamfer; edge chipping below ~10–20 µm; high edge strength |
| Process | Through-thickness modification by filament or Bessel beam, then separation; fs ablation for small features |
| Laser | ps/fs at 1030 nm, 20–50 W, burst mode (§10.15) |
| Optics and motion | Bessel optics or high-NA objective; air-bearing XY stages with PSO |
| Machine | Reference machine 10 |
| Validation | Edge microscopy, bending strength, AOI for cracks |
| Pitfalls | Crystal orientation effects, debris, stress concentration at contour start points |

Case 2 — PCB → DataMatrix marking → CO₂ laser → in-line marker

| Step | Decision |
|---|---|
| Product and component | Automotive ECU; bare PCB before SMT |
| Material | Green solder mask on FR-4, partly over copper |
| Requirement | 12 × 12 DataMatrix, ~0.25 mm modules, grade ≥ B, no copper exposure, in-line takt ~8 s |
| Process | Solder-mask ablation / colour change |
| Laser | CO₂ 9.3 µm, 10–20 W (10.6 µm acceptable with more substrate effect) |
| Optics | ZnSe F-theta f ≈ 100 mm; spot ≈ 120 µm; single-pass hatch |
| Machine | Reference machine 2 with fiducial alignment and grading |
| Validation | ISO/IEC 29158 or 15415 grade; cross-sections over copper; readability after reflow and conformal coating |
| Pitfalls | Mask colour and thickness variation between board suppliers; reflow discolouration; fume redeposition |

Case 3 — Battery → tab → welding → laser selection

| Step | Decision |
|---|---|
| Product and component | EV module of pouch cells; cell tabs to busbar |
| Material | Al tab (~0.2–0.4 mm) and Ni-plated Cu tab to Ni-plated Cu or Al busbar |
| Requirement | Low resistance, pull strength, no cracks, no spatter, no tab tearing |
| Laser options considered | IR fiber with wobble (robust, low cost); green (stable on Cu, higher cost); QCW spot welds (thin tabs) |
| Selection logic | Al–Al: IR fiber with wobble or ring beam. Cu-side joints: green or shaped IR. Al–Cu: minimum heat input to limit brittle intermetallics (§15.3) |
| Optics and motion | Scanner optics over clamped module; OCT or photodiode monitoring |
| Machine | Reference machine 6 with upstream laser cleaning |
| Validation | Cross-sections, resistance, pull/peel tests, thermal cycling and vibration |
| Pitfalls | Gaps above ~10% of tab thickness; electrolyte or oxide contamination; clamp wear |

Case 4 — Semiconductor → package → marking

| Step | Decision |
|---|---|
| Component and material | QFN/BGA mould body; black epoxy mould compound with silica filler |
| Requirement | Legible text and 2D code, consistent contrast, controlled shallow depth over wires, strip throughput |
| Laser | Fiber 1064 nm ns, 10–30 W; green or UV for thin packages and fine fonts |
| Optics and handling | Galvo over strips or trays; vision alignment |
| Machine | Reference machine 9 (package/strip marker) with OCV |
| Validation | Legibility after permanence tests (solvent, rub); depth measurement; no wire or die exposure |
| Pitfalls | Compound-to-compound variation in contrast; filler exposure changes appearance |

Case 5 — Automotive → copper component → welding

| Step | Decision |
|---|---|
| Product and component | E-motor stator; hairpin pin pairs |
| Material | Enamelled rectangular Cu wire |
| Requirement | Joint cross-section ≥ conductor area, low porosity, no spatter on windings, low resistance |
| Process chain | Enamel stripping → cut and level pins → weld each pin pair |
| Laser | Stripping: pulsed fiber or CO₂. Welding: green CW, IR + blue hybrid, or IR with wobble/spiral paths |
| Optics and sensing | Scanner on gantry; vision locates each pin pair; OCT or photodiode monitoring |
| Machine | Hairpin welding station (variant of machine 6) |
| Validation | Cross-section area, CT porosity, pull tests, resistance |
| Pitfalls | Pin height and gap variation; enamel residue causing porosity; spatter |

Case 6 — Medical → stainless-steel device → UDI marking

| Step | Decision |
|---|---|
| Component and material | Surgical instrument, 316L or martensitic stainless |
| Requirement | UDI DataMatrix and text readable after repeated reprocessing; no corrosion; smooth surface |
| Laser | MOPA ns fiber (long-pulse black annealing) or ps black marking |
| Machine | Reference machine 1 with vision grading |
| Validation | Passivation (e.g., citric), autoclave cycling, corrosion testing, grade after reprocessing; IQ/OQ/PQ |
| Pitfalls | Annealed marks can lose corrosion resistance if overheated or not re-passivated; curved surfaces need 3D focus control |

Case 7 — Glass → ultrafast processing → microfluidic chip

| Step | Decision |
|---|---|
| Component and material | Borosilicate microfluidic chip with channels, inlets and a cover plate |
| Requirement | Smooth channels, through-holes, adhesive-free sealing, clean dicing |
| Process chain | fs in-volume modification + selective etching (channels, vias) → fs glass welding of the cover → Bessel filament dicing + separation |
| Laser | fs 1030 nm (and 515 nm for fine features), high repetition rate for welding |
| Machine | Reference machine 10 |
| Validation | Channel dimensions and roughness, pressure and leak tests, optical inspection |
| Pitfalls | Heat accumulation at high rep rate cracking welds; etch selectivity variation |

Case 8 — Flexible electronics → UV laser cutting

| Step | Decision |
|---|---|
| Component and material | FPC: polyimide base (~25 µm), Cu (~12–18 µm), coverlay and adhesive |
| Requirement | Outline cutting and coverlay openings; dimensional accuracy ~±25–50 µm; no copper damage; minimal carbonisation |
| Process | Multi-pass low-fluence ablation; kiss-cut for coverlay |
| Laser | UV 355 nm ns (15–30 W) or ps |
| Optics and motion | Galvo with stage stitching over a vacuum table; fiducial alignment with scale compensation |
| Machine | UV micromachining system (variant of machine 10) |
| Validation | Kerf and HAZ measurement, dimensional check, insulation resistance (carbon residue), peel |
| Pitfalls | Carbon residue causing leakage; adhesive melt-back; panel shrinkage between layers |
