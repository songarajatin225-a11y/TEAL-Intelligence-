---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 21
part_title: "Part XX — Laser Application × Industry Matrix"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XX — Laser Application × Industry Matrix

One matrix links all layers of the handbook: industry → product → component → material → process → laser → wavelength → power → pulse duration → machine. Values are representative industrial configurations, not specifications; use it to find the technology class for an application, then develop the process (Part XXIII).

| Industry | Product | Component | Material | Process | Laser type | λ | Avg power (≈) | Pulse | Machine type |
|---|---|---|---|---|---|---|---|---|---|
| Semiconductor | Memory / logic | Die | Si | Stealth dicing | NIR solid-state | ~1.06–1.3 µm class | 1–10 W | ns | Laser dicing system |
| Semiconductor | Power devices | Ingot, wafer | 4H-SiC | Ingot slicing; dicing | NIR / UV, ns–ps | 1030–1064 / 355 nm | 10–100 W | ns–ps | Laser slicing / dicing system |
| Electronics | Smartphone | Cover glass | Aluminosilicate glass | Contour cutting | ps/fs | 1030 nm | 20–100 W | 0.3–10 ps | USP glass cutter |
| Electronics | Display | Flexible OLED | PI on glass | Laser lift-off | Excimer / DPSS UV | 308 / 343 nm | 100 W–1 kW class | 10–30 ns | Line-beam LLO system |
| EMS | PCBA | Panel | FR-4 | Depaneling | UV DPSS | 355 nm | 10–30 W | 10–30 ns (or ps) | Laser depaneler |
| EMS | PCB | Board ID | Solder mask | DataMatrix marking | CO₂ | 9.3 µm | 10–30 W | µs (RF-pulsed) | In-line marker with vision |
| Automotive | Body | B-pillar | Press-hardened boron steel | 3D trimming | CW fiber | 1070 nm | 3–6 kW | CW | 5-axis cutting cell |
| Automotive | Body | Door, closure | Galvanised steel | Remote welding | Fiber / disk | 1030–1070 nm | 4–8 kW | CW | Robot + remote scanner head |
| EV | E-motor | Hairpin stator | Enamelled Cu | Stripping; welding | Pulsed fiber / CO₂; green, IR+blue | 1064 / 10.6 µm; 515, 450 + 1070 nm | 0.1–0.5 kW; 1–6 kW | ns; CW | Hairpin line |
| EV | Inverter | Busbar, module terminals | Cu, Al | Welding | Green; shaped IR fiber | 515 / 1070 nm | 0.5–3 kW | CW / pulsed | Micro-welding cell |
| Battery | Cell | Electrode | Coated Cu and Al foil | Notching | MOPA fiber; ps | 1064 / 1030 nm | 100–500 W | ns; ps | Roll-to-roll notcher |
| Battery | Module | Busbar-to-cell joints | Al–Cu, Ni-plated steel | Welding with depth monitoring | CW fiber + wobble; OCT | 1070 nm | 1–4 kW | CW | Module welding cell |
| Solar | c-Si cell | Rear side, contacts | Si, dielectric stacks | Contact opening; laser-assisted firing | DPSS / fiber | 532 / 355 / 1064 nm | 10–100 W | ps–ns | In-line cell laser tool |
| Solar | Thin-film module | Functional layers | CdTe, CIGS, perovskite on glass | P1–P3 scribing | DPSS / fiber | 1064 / 532 / 355 nm | 5–50 W | ns–ps | Scribing system |
| Aerospace | Engine | Turbine blade | Ni superalloy + TBC | Cooling-hole drilling | QCW fiber / Nd:YAG | 1064–1070 nm | 0.1–1 kW (kW-class peak) | 0.1–2 ms | 5-axis drilling machine |
| Aerospace | Engine | Fuel nozzle | Co-Cr / Ni alloy | Powder-bed fusion | Single-mode fiber | 1070 nm | 0.2–1 kW per laser | CW | Multi-laser LPBF |
| Defence | Vehicles, munitions, equipment | Part ID | Steel, Al | UID marking | Fiber | 1064 nm | 20–50 W | ns | Marking station |
| Defence | Optronics | Rangefinder, LiDAR, designator | — (the laser is the product) | — | Er:glass, Er/Yb fiber, Nd:YAG | 1.5 µm / 1064 nm | mW–W | ns | Product assembly |
| Medical | Cardiology | Stent | Nitinol, Co-Cr | Tube cutting | Single-mode fiber; fs | 1070 / 1030 nm | 50–500 W; 10–50 W | Modulated CW; fs | Tube-cutting machine |
| Medical | Orthopaedics | Implant | Ti-6Al-4V | UDI marking | ps or MOPA fiber | 1064 nm | 20–50 W | ps; 100–500 ns | Marking station |
| Consumer electronics | Laptop | Keycaps | Painted translucent polymer | Legend ablation | Fiber; UV | 1064 / 355 nm | 20–50 W; 5–10 W | ns | Marking cell with vision |
| Consumer electronics | Earbuds, phones | Antenna carrier | LDS thermoplastic | Laser direct structuring | Fiber | 1064 nm | 10–30 W | ns | LDS system |
| Packaging | Food and beverage | Films, labels | PET, PE, paper | Coding, micro-perforation | CO₂ | 10.6 / 10.2 / 9.3 µm | 10–100 W | µs | In-line coder |
| Packaging | Pharma | Cartons, blisters | Coated board, foil | Serialisation coding | CO₂; fiber | 10.6 µm; 1064 nm | 10–50 W | µs; ns | Serialisation line |
| Jewellery | Rings, pendants | Surfaces, joints | Au, Ag, Pt | Engraving; repair welding | MOPA fiber, green; pulsed fiber / Nd:YAG | 1064 / 532 nm | 20–60 W | ns; ms | Desktop marker; welding workstation |
| Machine tools | Cutting machines | Sheet parts | Steel, stainless, Al | Flatbed cutting | CW fiber | 1070 nm | 1–30+ kW | CW | Flatbed cutter with automation |
| Machine tools | Tooling | Moulds, dies | Tool steel | Texturing, deep engraving; repair cladding | ns/ps fiber; DED | 1064 / 1070 nm | 50–100 W; 1–2 kW | ns–ps; CW | 5-axis texturing; DED cell |
| Heavy engineering | Ships, structures | Thick plate | Structural steel | Thick-plate cutting; hybrid laser–arc welding | CW fiber | 1070 nm | 10–40+ kW | CW | Gantry cutter; hybrid welding gantry |
| Heavy engineering | Mining, oil and gas | Shafts, valves, rolls | Steel with Ni/Co/WC overlays | Cladding | Diode / fiber | 9xx / 1070 nm | 2–10 kW | CW | Cladding cell |
| Energy | Power generation | Turbine and boiler parts | Steels, Ni alloys | Cladding, hardening, welding | Diode / fiber | 9xx / 1070 nm | 2–10 kW | CW | Robotic cells |
| Energy | Nuclear decommissioning | Structures, pipework | Steel | Remote cutting, decontamination | Fiber | 1070 nm | kW-class | CW / pulsed | Remote robotic systems |
| Research | Physics | XUV / attosecond pulses | Gas targets | High-harmonic generation | Ti:sapphire, OPCPA, Yb fs | ~800 / 1030 nm | W–kW | fs | Laboratory system |
| Research | Life science | Tissue imaging | Biological samples | Multiphoton microscopy | Ti:sapphire, Yb fs | 700–1100 nm | W | fs | Microscope |

Reading the matrix vertically is as useful as horizontally: CW fiber at 1070 nm appears in most heavy and automotive rows, UV and ultrafast in electronics, display and medical rows, CO₂ in packaging and PCB rows. That distribution is the demand map behind the supplier landscape in Part XXI.
