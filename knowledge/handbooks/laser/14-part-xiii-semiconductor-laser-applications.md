---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 14
part_title: "Part XIII — Semiconductor Laser Applications"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XIII — Semiconductor Laser Applications

Lasers touch almost every stage of semiconductor manufacturing, and the most valuable laser in a fab — the lithography light source — does not machine anything. Processing lasers cluster in five jobs: identify (marking), separate (dicing, singulation, ingot slicing), heat (annealing), release (lift-off, debonding) and join or modify at micro-scale (soldering, sealing, drilling, trimming).

## 13.1 Front end

| Application | What the laser does | Laser type / λ (typical) | Notes |
|---|---|---|---|
| Lithography light source | Exposes photoresist | ArF (193 nm, immersion), KrF (248 nm) excimers; EUV 13.5 nm from CO₂-driven tin plasma | The largest laser value in a fab; supplied inside scanners |
| Wafer marking | Wafer ID on front or back side | Green 532 nm ns (soft marks), 1064/532 nm (hard marks), fs for low debris | SEMI marking specifications, including back-side 2D DataMatrix (SEMI T7) |
| Wafer and mask inspection | Illuminates for defect scattering and metrology | DUV/UV CW and pulsed lasers (193–355 nm class), visible lasers | Inspection light sources, not processing |
| Dicing | Separates dies | Stealth dicing (NIR, focused inside Si, then tape expansion); UV/USP ablation full-cut; UV ns/ps grooving of low-k stacks before blade dicing | Stealth dicing is dry and debris-free, suited to MEMS, memory and thin wafers |
| Drilling | Holes in substrates and glass | UV, CO₂ (substrate micro-vias); fs/ps + etch (glass TGV) | TSVs in Si are made by deep reactive-ion etching, not laser |
| Annealing | Activates dopants, forms contacts, recrystallises | Laser spike annealing (CO₂ or diode line beams, µs–ms); melt annealing (UV/green ns); excimer laser annealing (308 nm) for LTPS | Low thermal budget for advanced logic, image sensors, 3D integration, SiC back-side contacts |
| Laser lift-off (LLO) | Decomposes an interface layer to release a film | 248 nm (KrF), 266 nm, 308 nm (XeCl), 343/355 nm DPSS | GaN from sapphire (LED, micro-LED), polyimide from glass (flexible OLED) |
| Laser direct writing | Maskless patterning | 405 nm diode arrays (LDI), UV lasers; two-photon lithography for micro-optics | Photomask writing for display and mature nodes; PCB and IC substrates |
| Lithography-related | Mask repair, pellicle and reticle processing | UV/ultrafast | Niche, high-value |

## 13.2 Back end and advanced packaging

| Application | What the laser does | Laser type / λ (typical) | Notes |
|---|---|---|---|
| Package marking | Mould-compound surface marking | Fiber 1064 nm; green; UV for thin packages | Mark depth kept shallow to protect wires and die |
| Die and package singulation | Cuts SiP, camera modules, irregular strips | UV ns/ps; ps IR | Where saws cannot follow contours or cause chipping |
| Temporary-bond debonding | Releases wafers from glass carriers | 308/343/355 nm line or scanned beams | Fan-out and 3D stacking |
| Wire-related processing | Mould ablation to expose wires/leads; deflash; laser decapsulation for failure analysis | Fiber, UV | Decap usually finished chemically |
| Trimming | Adjusts thin-film resistors and sensor calibration | 1064/532/355 nm with in-process measurement | Precision analogue ICs, sensors, hybrids |
| Laser cleaning | Removes oxide, mould release, contamination from pads and lead frames | Pulsed ns fiber, UV | Improves wire-bond and solder yield |
| Laser soldering and bonding | Solder-ball attach and rework; laser-assisted bonding (area diode beams) for flip-chip | Diode 9xx nm, fiber | Reduces warpage and thermal budget vs mass reflow |
| Laser welding and sealing | Hermetic lid seam sealing; fiber and lens attachment in photonic modules | Pulsed Nd:YAG or fiber | Sub-µm post-weld shift control for optical alignment |
| Micromachining | Through-mould vias, EMI-shield compartment patterning on SiP, probe-card guide-plate holes | UV, CO₂, ps | High-mix, high-precision |
| Glass-core substrates | Through-glass vias and cavities | fs/ps modification + selective etch | Emerging platform for large AI packages |

## 13.3 Materials: silicon and compound semiconductors

| Material | Band gap (≈) | Processing challenge | Key laser applications |
|---|---|---|---|
| Si | 1.12 eV | Thin wafers chip and crack; low-k stacks delaminate | Stealth dicing, UV grooving, marking, annealing, debonding |
| SiC (4H) | 3.26 eV | Extremely hard (Mohs ~9.5), costly, slow to saw | Laser ingot slicing (sub-surface separation layer, e.g., DISCO’s KABRA process), thermal laser separation and ablation dicing, back-side ohmic-contact annealing, marking |
| GaN (on sapphire, Si, SiC) | 3.4 eV | Hard substrates; film transfer | LLO from sapphire, stealth dicing of sapphire, micro-LED selective release and transfer |
| GaAs | 1.42 eV | Brittle; arsenic-containing debris | Scribing and dicing of RF and VCSEL wafers with debris extraction, marking |
| InP | 1.34 eV | Brittle; facets cleaved mechanically | Scribing to initiate cleaves, marking; PIC singulation |

Representative semiconductor laser-equipment makers include DISCO, Hamamatsu (stealth-dicing engines), ASMPT, EO Technics, Han’s Laser, 3D-Micromac, Veeco, SCREEN and Coherent; lithography sources come from Cymer (ASML) and Gigaphoton. Part XXI covers the ecosystem.
