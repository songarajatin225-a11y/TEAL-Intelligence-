---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 9
part_title: "Part VIII — Laser Process Heads"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part VIII — Laser Process Heads

The process head is where optics, gas, material and sensors meet, and it is the most failure-prone and application-specific part of a laser machine. Every head is built from the same blocks — collimator, focusing optics, protective window, nozzle and gas, sensors — arranged for one process.

## 8.1 Building blocks

| Element | Function | Typical specification (≈) | Common failure modes |
|---|---|---|---|
| Fiber receiver | Locates the connector repeatably, closes interlock | QBH/QD bayonet, water-cooled | Contaminated end-cap, loose lock |
| Collimator | Converts fiber divergence into a parallel beam | f 50–200 mm, fused silica, water-cooled | Thermal focus shift, clipping |
| Focusing lens / optics | Sets spot and working distance | f 100–300 mm cutting; 150–600 mm welding; scanner optics for remote heads | Contamination, thermal lens |
| Protective window (cover slide) | Shields optics from spatter and fume | Fused silica or sapphire, AR-coated; consumable | Spatter pits → absorption → focus shift or crack |
| Nozzle | Shapes and directs gas; sensing electrode in cutting | Cu, single or double layer, Ø 0.8–5 mm | Spatter damage, off-centre beam |
| Gas delivery | Ejects melt, shields weld, protects optics | Coaxial up to ~25 bar (N₂ fusion cutting); shielding 10–30 L/min; cross-jet 4–6 bar | Turbulence, contamination, pressure drift |
| Coaxial sensing port | Views the process through the beam path | Dichroic splitter to camera, photodiodes, pyrometer, OCT | Chromatic focus mismatch |
| Off-axis sensors and feeders | Seam tracking, wire and powder feed | Laser-line triangulation, wire feeders, powder nozzles | Alignment drift |
| Autofocus / zoom | Moves lenses to shift focus or change spot | Motorised collimator or lens, mm range | Mechanical wear, calibration |
| Height sensing | Keeps stand-off constant | Capacitive (cutting), tactile, triangulation, OCT | Noise near edges and on non-conductive surfaces |
| Condition monitoring | Protects the head | Window scatter sensor, temperature, back-reflection, crash (magnetic breakaway) | — |

## 8.2 Head types

| Head | Optical layout | Gas | Sensors | Typical power / spot (≈) | Notes |
|---|---|---|---|---|---|
| Cutting | Collimator + focus lens (often zoom) + window + nozzle | O₂ ~0.5–1.5 bar (mild steel); N₂ 10–25 bar (stainless, Al); air 8–15 bar | Capacitive height, window monitor, pierce detection, focus-shift compensation | 1–40 kW; 100–400 µm | Nozzle-to-sheet ~0.3–1.5 mm; zoom sets spot per thickness (→ §10.3) |
| Fixed-optic welding | Collimator + focus lens + cross-jet + shielding nozzle | Ar, He, N₂ shielding | Seam tracking, photodiodes, camera, OCT depth | 0.5–20 kW; 0.2–1 mm | Ring-core fibers or DOEs for spatter control |
| Wobble welding | Fixed focus + internal galvo mirror oscillation | As welding | As welding | 0.5–6 kW; wobble amplitude ~0.2–3 mm | Gap bridging, Al and Cu porosity reduction |
| Remote / scanner welding | Collimator + 2D/3D scanner + long focal-length lens | Minimal or cross-jet | Scanner-integrated monitoring | 1–8 kW; f 250–500+ mm | Robot-mounted, welding on the fly; needs low BPP |
| Cladding / LMD (DED) | Collimator + focus; defocused 1–6 mm spot; coaxial or lateral powder/wire | Carrier + shielding gas (Ar, He) | Melt-pool camera, pyrometer, closed-loop power | 1–10 kW; 1–6 mm | Coaxial ring or 3–4-jet powder nozzles; coaxial wire heads |
| Brazing | Twin-spot or ring optics with tactile seam guidance and wire feed | Ar | Tactile or optical seam tracking | 2–4 kW; 1–3 mm | CuSi₃ wire, automotive roof and tailgate seams |
| Soldering | Diode or fiber optics with coaxial camera and IR pyrometer; wire feeder or solder-ball jetting nozzle | N₂ | Pyrometer temperature loop, vision | 10–150 W; 0.2–2 mm | Closed-loop temperature control is essential (→ §10.5) |
| Marking | Beam expander + galvo + F-theta | Fume extraction only | Red pointer, optional coaxial camera | 10–100 W (fiber), 10–60 W (CO₂), 3–30 W (UV) | Class 1 enclosure or workstation |
| Cleaning | 1D line or 2D galvo, long focal length (f 160–420 mm) | Fume and particle extraction | Optional camera, spectroscopy | 50 W–3 kW (pulsed, ns) | Hand-held or robot-mounted |
| Drilling | Percussion optics; trepanning or helical optics (rotating wedges, dove prism) | O₂, air, N₂ | Breakthrough detection | ms QCW to ps; 20–500 µm holes | Turbine cooling holes, injectors, filters |
| Heat treatment | Homogeniser or DOE to rectangle; or scanned line (dynamic beam shaping) | Optional shielding | Pyrometer or camera temperature control | 1–20 kW diode; 5–60 mm spots | Hardening depth set by temperature and time |
| Powder-bed AM | Scanner + F-theta over an inert build chamber | Ar or N₂ chamber flow | Melt-pool monitoring, layer imaging | 200 W–1 kW per laser; multi-laser | Not a head in the strict sense; scanner-based |

## 8.3 Coaxial vs off-axis arrangements

| Aspect | Coaxial | Off-axis |
|---|---|---|
| Sensing | Camera sees the process along the beam; direction-independent | Oblique view; simpler optics, may be shadowed |
| Gas | Symmetric flow, direction-independent quality | Directional; can be stronger for shielding or melt removal |
| Filler (wire, powder) | Direction-independent deposition, more complex nozzles | Simple, cheap; quality depends on travel direction |
| Typical use | Cutting, precision welding, cladding, soldering | Brazing, simple cladding, seam tracking |

## 8.4 Autofocus, height sensing and focus control

Focus position errors cause more process escapes than any other single parameter. Height is measured by capacitance between nozzle and conductive sheet (cutting), by tactile probes, laser-line triangulation (seam tracking), confocal chromatic sensors (precision micromachining), or optical coherence tomography (OCT), which measures keyhole depth through the process optics in real time. Motorised collimators compensate the thermal focus shift of the optics and let a recipe change focus during piercing or across thickness steps.
