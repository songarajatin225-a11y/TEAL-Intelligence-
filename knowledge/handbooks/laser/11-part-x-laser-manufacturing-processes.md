---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 11
part_title: "Part X — Laser Manufacturing Processes"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part X — Laser Manufacturing Processes

Laser manufacturing processes fall into five families — modification, removal, separation, joining and addition — and each family maps onto a band of the process-regime map in §9.7. The right process is the one that achieves the quality target at the lowest heat input and cost per part.

## 10.1 Process taxonomy

| Family | Process | Mechanism | Typical lasers | Key quality metrics |
|---|---|---|---|---|
| Modification | Annealing mark, colour mark, hardening, annealing, remelting, texturing | Heating below or just above melting; oxide growth; phase change | ns MOPA fiber, CW diode/fiber, ps/fs for LIPSS | Contrast, colour, case depth, hardness, roughness, wettability |
| Removal | Engraving, ablation, foaming, deep engraving, cleaning, thin-film removal, micromachining | Vaporisation, ablation, spallation | ns fiber, CO₂, UV, green, ps/fs | Depth, edge quality, residue, substrate damage |
| Separation | Sheet, tube, film, PCB, glass, wafer and battery cutting; drilling; scribing; dicing | Melt ejection, sublimation, nonlinear modification + cleave | CW fiber/CO₂, UV, ps/fs, QCW | Kerf, dross, roughness, taper, HAZ, chipping |
| Joining | Conduction, keyhole, seam, spot, remote, wobble welding; soldering; brazing | Melting and solidification; wetting | CW/QCW fiber, disk, diode, green, blue | Penetration, porosity, cracks, strength, fillet shape |
| Addition | Cladding, laser metal deposition (DED), powder-bed fusion (LPBF) | Melting of filler (powder or wire) onto substrate | Fiber, diode, disk | Dilution, porosity, density, build rate |

## 10.2 Laser marking

Laser marking creates a permanent, contact-free, ink-free identifier by changing a surface’s optical properties. It is the largest industrial laser application by unit count and the backbone of product traceability (UDI, DPM, wafer and package IDs).

Marking mechanisms

| Mechanism | What happens | Typical materials | Typical laser | Result |
|---|---|---|---|---|
| Annealing | Heating below melting grows an oxide layer; colour set by oxide thickness (interference) | Stainless steel, titanium, tool steel | ns MOPA fiber, long pulses (~100–500 ns), high overlap | Smooth black or coloured mark, no material removal; corrosion-resistant when correctly processed |
| Engraving | Material vaporised to form a recess | Metals, plastics, ceramics | Q-switched/MOPA fiber, CO₂ | Depth 5–100 µm; tactile, durable |
| Deep engraving | Multi-pass engraving, often cross-hatched | Tool steel, moulds, dies, name plates | 30–100 W fiber, ps for quality | 0.1–several mm depth |
| Ablation | A coating or layer removed to expose contrast | Anodised Al, painted parts, solder mask, coated glass | MOPA fiber, CO₂, UV | High contrast, shallow |
| Foaming | Local heating releases gas; bubbles scatter light | Dark plastics | Fiber 1064 nm | Light, slightly raised mark |
| Carbonisation / colour change | Polymer darkens or pigment/additive changes colour | Light plastics, laser-additive compounds, paper | UV 355 nm, fiber with additives, CO₂ | Dark mark on light background |
| Colour marking | Controlled oxide thickness gives interference colours | Stainless steel, titanium | MOPA fiber with fine pulse control | Decorative colours |
| Black marking (nanostructure) | Light-trapping micro/nanostructures | Anodised or bare Al, stainless, Ti | ps/fs, short-pulse MOPA | Deep black, high contrast, readable at wide angles |

Laser technology comparison for marking

| Laser | λ | Strengths | Limitations | Typical markets |
|---|---|---|---|---|
| Fiber, Q-switched ns | 1064 nm | Lowest cost, robust, fast on metals | Fixed pulse width; poor on clear and light plastics | General industrial metal marking |
| Fiber, MOPA ns | 1064 nm | Pulse width 2–500 ns selectable: black anodised, colour, annealing, delicate plastics | Higher cost than Q-switched | Electronics, medical, consumer goods |
| CO₂ | 10.6 / 9.3 µm | Organics, glass, paper, PCB solder mask; very low cost per W | Large spot; metals only via coatings | Packaging, PCB, wood, leather, glass |
| UV (DPSS or fiber) | 355 nm | Fine features, low heat; white and light plastics without additives | Cost; optics ageing | Electronics, medical, cables, glass, wafers |
| Green | 532 / 515 nm | Small spot; Au, Cu, Si; some plastics | Cost | Semiconductor, precious metals, PCB |
| Picosecond | 1064/532/355 nm | Near-zero HAZ; deep black on metals; micro-marks | High cost | Medical, luxury, semiconductor, display |
| Femtosecond | 1030/515/343 nm | Sub-surface marks in glass and sapphire; no cracks | Highest cost | Glass, sapphire, medical, anti-counterfeit |

Decision matrix: material × wavelength × laser × method × result

| Material | Wavelength | Laser type | Marking method | Result |
|---|---|---|---|---|
| Stainless steel (medical UDI) | 1064 nm | MOPA ns (long pulse) or ps | Annealing / ps black | Smooth black mark; must survive passivation and autoclave |
| Stainless steel (industrial) | 1064 nm | Q-switched or MOPA fiber | Engraving, annealing | Dark or light mark, fast |
| Carbon and tool steel | 1064 nm | Q-switched / MOPA fiber | Engraving, deep engraving, annealing | Durable, tactile |
| Titanium | 1064 nm | MOPA fiber | Annealing (colour/black) | Colour or black oxide |
| Bare aluminium | 1064 nm | MOPA fiber; ps for black | Engraving; nanostructure black | Grey/white or black |
| Anodised aluminium | 1064 nm | MOPA fiber (short pulses); ps | Dye ablation; black nanostructure | White/grey or black on anodised finish |
| Copper, brass | 1064 / 532 / 355 nm | MOPA fiber, green, UV | Engraving | Better contrast and control at green/UV |
| Gold, silver (jewellery) | 1064 / 532 nm | MOPA fiber, green, ps | Engraving | Fine text and images |
| Dark plastics (ABS, PA, PBT black) | 1064 nm | Fiber | Foaming | Light mark |
| Light plastics (PP, PE, PC, white ABS) | 355 nm (or 1064 nm with additive) | UV; fiber with laser-marking additive | Carbonisation / colour change | Dark mark |
| Clear PC, PMMA | 355 nm; 10.6 µm | UV; CO₂ | Surface ablation | Frosted mark |
| PET and packaging films | 10.6 / 9.3 µm; 355 nm | CO₂; UV | Ink or coating ablation, coding | Date and batch codes at line speed |
| PCB solder mask | 9.3 µm (or 10.6 µm, 355 nm) | CO₂; UV | Mask ablation or colour change | High-contrast DataMatrix |
| Bare FR-4 | 355 nm; 10.6 µm | UV; CO₂ | Carbonisation | Dark mark |
| Glass | 10.6 µm; 355/532 nm; fs | CO₂; UV/green; fs | Surface micro-cracks; sub-surface modification | Frosted or internal, crack-free (fs) |
| Ceramics (Al₂O₃, ZrO₂) | 1064 / 355 nm | Fiber; UV | Colour change, ablation | Dark mark |
| Silicon wafer | 532 / 355 nm ns; fs | Green, UV, fs | Soft mark (shallow) or hard mark | Wafer ID, back-side DataMatrix |
| IC mould compound (epoxy) | 1064 nm (also 532, 10.6 µm) | Fiber, green, CO₂ | Surface ablation of compound | Package marking |
| Rubber, silicone | 10.6 µm; 1064 nm | CO₂; fiber | Ablation | Engraved text |
| Paper, cardboard, wood, leather | 10.6 µm | CO₂ | Ablation, carbonisation | Coding, decoration |

Identifiers and traceability

| Mark | Standard / context | Laser notes |
|---|---|---|
| DataMatrix (ECC 200) | ISO/IEC 16022 symbology; ISO/IEC 29158 (AIM DPM) quality grading for direct part marks; ISO/IEC 15415 for printed-style marks | Module typically ≥ 3–5 × hatch line width for filled cells, or ≥ ~1.5 × spot for single-dot cells; quiet zone ≥ 1 module |
| QR code | ISO/IEC 18004 | Consumer-facing; larger than DataMatrix for the same data |
| 1D barcode | ISO/IEC 15416 quality | Needs uniform bar width; less robust on curved metal |
| Serial number, text | OCR/OCV; SEMI fonts for wafers | Stroke-font vectors, fast |
| Logo, graphics | Customer artwork | Raster or vector hatch |
| UID | MIL-STD-130 (US defence) | DataMatrix-based, verified grade |
| UDI | FDA UDI rule and EU MDR for medical devices | Direct marking required for reusable devices; must survive reprocessing |
| Traceability ID | Link to MES record (→ Part XII) | Mark, then verify grade in-line |
| Micro-marking | Die, pins, lenses, implants | Modules < 100 µm; UV, green or ps; microscope readers |

Marking quality depends on eight parameters: power, pulse width, repetition rate, scan speed, hatch spacing, number of passes, focus/defocus and fill pattern (→ §23.6). Durability tests include salt spray, passivation (stainless), autoclave cycles (medical) and abrasion.

## 10.3 Laser cutting

Laser cutting melts or vaporises a narrow kerf and removes the material with gas or by sublimation. Thin and medium metal sheet is now dominated by CW fiber lasers; CO₂ remains strong for non-metals; UV and ultrafast lasers own precision cutting of films, flexible circuits, glass and semiconductors.

Cutting mechanisms

| Mechanism | How material leaves the kerf | Gas | Materials | Edge result |
|---|---|---|---|---|
| Fusion cutting | Melt blown out by high-pressure inert gas | N₂ (10–25 bar), Ar | Stainless steel, Al, Ti, thin mild steel | Bright, oxide-free |
| Oxidation (flame) cutting | Exothermic Fe + O₂ reaction adds energy; oxide melt blown out | O₂ (~0.5–1.5 bar) | Mild steel, thick plate | Thin oxide layer; lower laser power per mm |
| Air cutting | Mixed fusion/oxidation | Compressed air (8–15 bar) | Thin mild and stainless steel, Al | Low gas cost; slight oxidation |
| Sublimation / vaporisation | Material vaporised directly | Air or N₂ for plume removal | Acrylic, wood, textiles, films, thin foils | Polished acrylic edges (CO₂) |
| Thermal-stress fracture | Heating and cooling propagate a crack | — | Glass, ceramics | Clean, chip-free on straight lines |
| Ultrafast modification + cleave | Filament or Bessel-beam damage line, then mechanical or thermal separation | — | Glass, sapphire, display stacks | Near-zero chipping, arbitrary contours |

Physics of the cut front. The beam strikes a steep, inclined melting front, so absorption depends on angle and polarisation (→ §1.8). A melt film tens of µm thick is dragged down by gas shear and leaves the bottom edge. Striations, dross (re-solidified melt clinging to the bottom edge) and taper all come from melt-flow dynamics.

| Parameter | Effect | Practical guidance |
|---|---|---|
| Power | Maximum thickness and speed | Power for thickness; excess power widens kerf and HAZ |
| Speed | Too slow → wide kerf, burning; too fast → loss of cut, dross | Optimise at ~80–90% of the loss-of-cut speed |
| Focus position | Kerf shape, dross | N₂ fusion: focus inside the sheet, often below mid-thickness; O₂: near the top surface |
| Spot size (zoom) | Kerf width, melt flow | Larger spot for thick plate, smaller for thin sheet |
| Nozzle diameter and stand-off | Gas dynamics | Ø 1–5 mm; stand-off ~0.3–1.5 mm held by capacitive sensing |
| Gas type and pressure | Mechanism, edge colour, dross | N₂ for bright edges; O₂ for thick mild steel; air for cost |
| Piercing | Start hole quality, spatter on optics | Pulsed, ramped piercing with its own focus and gas |
| Beam shape | Thick-plate edge quality | Ring or adjustable-mode beams improve thick sections |
| Kerf | Part accuracy | ~0.1–0.3 mm on sheet; compensate in CAM |
| HAZ | Metallurgy of the edge | Tens to hundreds of µm for CW; µm for ns; near-zero for ultrafast |

Cut quality is specified by ISO 9013 (perpendicularity tolerance and mean profile height Rz5 classes).

Technology comparison

| Criterion | CW fiber (1.07 µm) | CO₂ (10.6 µm) | UV ns (355 nm) | Ultrashort pulse (ps/fs) |
|---|---|---|---|---|
| Materials | Metals (all), some non-metals | Non-metals; metals (esp. thick mild steel) | Polymers, PI, FR-4, thin metals, Si, ceramics | Glass, sapphire, Si, films, composites, metals |
| Thin-metal speed | Highest (≈2–3× CO₂ at equal power, ≤ 3 mm) | Lower | Slow (µm-scale removal) | Slow |
| Thick metal | Strong with ≥ 12 kW and beam shaping | Historically best edge on thick mild steel | — | — |
| Precision / kerf | 50–300 µm | 150–400 µm | 10–30 µm | 5–30 µm |
| HAZ | Moderate | Larger | Small | Minimal |
| Wall-plug efficiency | 35–50% | 10–20% | ~5–10% | ~10–20% |
| Capex per W | Lowest | Low | High | Highest |
| Maintenance | Very low | Moderate (optics, gas, RF tube life) | Moderate (crystals, optics) | Moderate |
| Beam delivery | Fiber | Mirrors | Free-space | Free-space / hollow-core |

Applications

| Application | Typical laser | Notes |
|---|---|---|
| Sheet metal and plate | CW fiber 1–30+ kW; CO₂ in legacy fleets | Flat-bed 2D with automation towers; tube and 3D cutting |
| PCB depaneling | UV ns or ps (355 nm); green | Stress-free, dust-free vs routers; tighter component-to-edge clearances |
| Flexible PCB and coverlay | UV ns/ps | Kiss-cut of coverlay without damaging copper |
| Films (polariser, OCA, protective) | CO₂, UV, ps | Kiss cutting and through cutting at roll-to-roll speeds |
| Battery electrodes and separators | ns MOPA fiber or ps (electrode notching); CO₂/UV (separator) | Burr and coating delamination control; particle control critical |
| Glass | Ultrafast (filamentation, Bessel) + cleave; CO₂ thermal-stress cutting | Display cover glass, camera lens covers, medical glass |
| Semiconductor | Stealth dicing (sub-surface NIR), UV/USP grooving and full-cut | Low-k grooving before blade dicing; thin-wafer dicing |
| Polymers and composites | CO₂; UV; ps; kW fiber for CFRP | HAZ and fiber pull-out control in composites |

## 10.4 Laser welding

Laser welding melts the joint interface with a concentrated beam and lets it solidify, at speeds of metres per minute and with heat input a fraction of arc welding. The central choice is the welding mode — conduction or keyhole — and the central difficulty in electrification is copper and aluminium.

| Mode | Intensity (≈) | Physics | Aspect ratio (depth/width) | Typical use |
|---|---|---|---|---|
| Conduction | < ~10⁶ W/cm² | Heat conducts from the surface; no vaporisation cavity | ≤ ~1 | Thin sheet, cosmetic seams, battery tabs, electronics, medical |
| Transition | ~10⁶ W/cm² | Unstable intermittent keyhole | ~1–2 | Usually avoided: least stable regime |
| Keyhole (deep penetration) | ≳ 10⁶ W/cm² | Vapour recoil pressure opens a cavity; beam absorbed by multiple reflection | Up to ~10:1 | Structural welds, thick sections, busbars, hairpins |

Penetration depth grows with power and falls with speed; weld width grows with spot size and heat input. Keeping Q low minimises distortion, grain growth and damage to nearby components (critical in batteries and electronics).

Weld defects: causes and countermeasures

| Defect | Main causes | Countermeasures |
|---|---|---|
| Process porosity | Keyhole collapse traps gas; unstable keyhole on Cu/Al | Stable keyhole (speed, focus), wobble, ring-core beams, pulse shaping |
| Metallurgical porosity | Hydrogen (Al, from moisture and oxide); Zn vapour (galvanised steel, brass) | Cleaning, drying, venting gaps for Zn, shielding gas |
| Spatter | Melt ejection from keyhole instability, especially Cu | Green/blue or IR+blue hybrid; ring beams; lower intensity peaks; wobble |
| Hot (solidification) cracking | Susceptible alloys (6xxx Al, some Ni alloys, high-S steels) | Filler wire (e.g., 4xxx Al), pulse shaping, reduced restraint |
| Cold cracking | Hardenable steels, hydrogen | Preheat, controlled cooling |
| Poor penetration / lack of fusion | Low power, wrong focus, gap, reflectivity | Process window from DOE, seam tracking, OCT depth monitoring |
| Burn-through / blow-holes | Excess heat input, gaps | Gap control, power ramps |
| Undercut, underfill | Melt displacement, gap | Filler, wobble, gap control |
| Humping | Excessive speed with deep keyhole | Lower speed or beam shaping |

Laser sources for welding

| Source | λ | Operation | Strengths | Limitations | Typical applications |
|---|---|---|---|---|---|
| CW fiber (single-mode to multimode) | 1070 nm | CW, modulated | Power, efficiency, brightness, scanner compatibility | Cu/Al absorption onset; spatter on Cu | Automotive, battery, EV, general fabrication |
| Adjustable ring / core+ring fiber | 1070 nm | CW | Independently controlled core and ring stabilise keyhole | Higher source cost | Al and Cu welding, busbars, battery cans |
| QCW fiber | 1070 nm | 0.1–50 ms pulses | High peak at low cost | Duty-cycle limits | Spot welds, sealing, medical, jewellery |
| Pulsed lamp Nd:YAG | 1064 nm | ms pulses | Pulse shaping, legacy qualified processes | Low efficiency, maintenance | Legacy medical and electronics lines |
| Thin-disk | 1030 nm | CW | Robust to back-reflection | Cost | Automotive powertrain and body |
| Green (515/532 nm) | 515–532 nm | CW or pulsed | ~40% Cu absorption → stable conduction and keyhole on Cu | Lower power than IR, higher cost per W | Cu hairpins, busbars, electronics, battery foils |
| Blue diode | ~450 nm | CW | Very high Cu absorption; stable conduction mode | Large BPP limits deep keyholes and spot size | Thin Cu, foil stacks, electronics, hybrid with IR |
| IR + blue hybrid | 1070 + 450 nm | CW | Blue preheats and stabilises; IR adds depth | System complexity | Cu hairpins and busbars with low spatter |
| Direct diode (9xx nm) | 915–980 nm | CW | Top-hat, cheap | Conduction only | Plastic welding, brazing, conduction welds |

Applications

| Sector | Welds | Common approach |
|---|---|---|
| Battery | Tab-to-busbar, can sealing, busbar, module and pack joints | Fiber with wobble or ring beams; green/blue for Cu; QCW for tabs (→ Part XV) |
| EV drive | Hairpin stator joints, rotor, inverter busbars | Green, IR+blue hybrid, scanner optics, OCT monitoring |
| Electronics | Connectors, sensors, hermetic housings, precious-metal contacts | QCW or pulsed fiber, green, spot welding |
| Automotive | Body-in-white remote welding, tailored blanks, gears, airbag inflators, injectors | Remote scanner welding, fiber and disk |
| Aerospace | Ti and Ni-superalloy seams, stringer-to-skin welding in Al | Inert shielding, fiber and disk (→ Part XVII) |
| Medical | Pacemaker and implant Ti hermetic seams, catheters, instruments | QCW or pulsed fiber, fine spots |
| Photonics and semiconductor packaging | Fiber and lens attachment in butterfly modules, lid sealing | Pulsed Nd:YAG or fiber spot welds with sub-µm alignment shift control |

## 10.5 Laser soldering

Laser soldering heats only the joint — pad, lead and solder — for 0.5–3 s, instead of taking a whole assembly through a reflow oven. It is chosen when components are heat-sensitive, when joints are hard to reach, or when a single through-hole or flex joint must be made on an otherwise finished SMT board. Success depends on temperature control, not on laser power.

Physics and process window

Heating: the beam (typically 915–980 nm diode or fiber) is absorbed mainly by the Cu pad, lead and solder surface; bare FR-4 and solder mask absorb too and can burn.

Melting: SAC305 melts at ~217–220 °C; SnPb at 183 °C. Target peak joint temperature is usually ~240–260 °C for SAC alloys.

Flux activation: flux removes oxides during preheat; too fast a ramp spatters flux and forms solder balls.

Wetting: molten solder spreads when surfaces are clean and hot; a good fillet has a low contact angle (well under 90°, ideally < ~30°).

Intermetallic formation: a thin Cu₆Sn₅ layer (~1–4 µm) bonds solder to copper; excessive time or temperature thickens it and embrittles the joint.

Solidification and cooling: short times give fine microstructure; the joint must not be disturbed while solidifying.

Temperature profile and closed-loop control. An IR pyrometer looks coaxially through the optics at the joint and the controller adjusts power in real time to follow a recipe: preheat (flux activation), ramp to peak, hold for wetting, then off. Open-loop power control fails on real production variation (pad size, board thickness, copper planes).

Solder delivery

| Method | How it works | Use |
|---|---|---|
| Wire feeding | Solder wire (~0.3–1.0 mm, flux-cored) fed at 30–45° into the heated joint, synchronised with the power profile | Through-hole pins, wires to pads, connectors |
| Paste + laser | Pre-dispensed or printed paste reflowed by the beam | Small SMT joints, rework, flex attachment |
| Solder-ball jetting | A preform ball (tens to hundreds of µm) is melted by a laser pulse in a capillary and jetted onto the pad | Camera modules, HDD heads, MEMS, fine-pitch interconnects, wafer-level rework |
| Preforms / pre-tinned | Solder already on the parts | Coil terminations, flex-to-board |

Key parameters: spot size (0.2–2 mm, top-hat preferred), power (10–150 W), profile times, wire feed rate and timing, wire angle and position, nitrogen shielding flow, and the pyrometer’s emissivity setting and measuring spot.

Machine architecture

| Module | Typical content |
|---|---|
| Laser source | Fiber-coupled diode 915–980 nm, 30–150 W, 200–400 µm fiber |
| Head | Collimator, focusing optics, coaxial camera, IR pyrometer, dichroic splitter, N₂ nozzle, wire feeder or ball-jet nozzle |
| Motion | XYZ gantry or SCARA, optional rotary/tilt for angled joints |
| Vision | Fiducial alignment, pad and pin location, pre- and post-solder inspection |
| Controls | PLC or IPC, real-time temperature controller, recipe per joint, SMEMA conveyor interface |
| Safety | Class 1 enclosure, interlocked doors, fume extraction with filtration |
| Data | Temperature curve per joint stored for traceability (MES) |

Comparison with other soldering methods

| Method | Heat locality | Cycle time per joint | Strengths | Limitations |
|---|---|---|---|---|
| Laser soldering | Highest (sub-mm) | 0.5–3 s | Non-contact, heat-sensitive parts, data per joint | Serial process; needs vision and temperature control |
| Soldering iron (robotic) | Medium | 1–4 s | Low capex | Tip wear, contact force, larger thermal footprint |
| Hot-bar | Medium | 5–15 s (many joints at once) | Gang soldering of flex | Tooling per product |
| Selective wave / mini-wave | Low–medium | Seconds per joint, batch | Robust for many THT pins | Fixtures, nitrogen, dross |
| Reflow oven | Whole board | Minutes (batch) | Massive parallelism for SMT | Entire assembly heated |

Applications: selective through-hole joints on SMT boards; camera modules (VCM coils, flex, lens holders); FPC-to-board and connector joints; temperature-sensitive sensors (MEMS, optical, thermistors); automotive ECUs, sensors and LED lighting; semiconductor and photonic packages (ball attach, rework, fiber-array and TEC attachment); coil and motor wire terminations.

## 10.6 Laser brazing

Brazing joins parts with a filler whose liquidus is above 450 °C while the base metals stay solid. Laser brazing gives narrow, cosmetic seams with low heat input. Its best-known use is the visible roof and tailgate seams of car bodies, where CuSi₃ wire is brazed onto galvanised steel at 2–4 kW, often with twin-spot or ring optics and tactile seam guidance; it also joins dissimilar metals (steel–aluminium, carbide to steel) where fusion welding forms brittle intermetallics. Critical factors: wetting (surface cleanliness, zinc layer preservation), wire feed stability and seam tracking.

## 10.7 Laser drilling

| Method | Principle | Hole diameter (≈) | Aspect ratio (≈) | Quality | Typical lasers |
|---|---|---|---|---|---|
| Single-pulse | One pulse removes the hole | 20–500 µm | < 10:1 | Recast, taper | QCW fiber, ms Nd:YAG |
| Percussion | Repeated pulses at one spot | 20–1000 µm | Up to ~20:1+ | Moderate; recast | QCW, ns, ps |
| Trepanning | Beam cuts the circumference | 100 µm–mm | ~10:1 | Better roundness | QCW, ns |
| Helical | Rotating beam with progressive depth, taper control via beam tilt | 20–300 µm | ~10–20:1 | Best: little recast, controllable or negative taper | ps, fs with rotating optics |
| Laser-induced selective etching | Ultrafast pulses modify glass along a line; HF or KOH etch opens the via | 10–100 µm | High | Crack-free glass vias | fs/ps + wet etch |

Applications: turbine-blade and combustor cooling holes (QCW fiber or ms Nd:YAG; ps for recast-free); fuel-injector spray holes (ps/fs helical drilling); PCB and IC-substrate micro-vias (CO₂ ~9.4 µm class for dielectric, UV for copper; 50–150 µm); through-glass vias for glass-core substrates and interposers; filters, sieves and spinnerets; catheter side holes; ceramic substrates.

## 10.8 Ablation and micromachining

Micromachining removes µm-scale volumes with controlled depth: thin-film patterning (ITO, metal, dielectric), P1–P3 scribing of thin-film solar modules (CIGS, CdTe, perovskite), laser lift-off (→ §13.1), low-k grooving of wafers, resistor and thin-film trimming (1064/532/355 nm with in-process measurement), microfluidic channels, stent and medical-tube cutting (single-mode fiber or fs), and precision structuring of ceramics and polymers. The choice is ns UV/green for cost and ps/fs where melt, debris or micro-cracks are unacceptable. Metrics: depth repeatability, edge sharpness, debris and redeposition, substrate damage.

## 10.9 Laser cleaning

Laser cleaning removes a surface layer whose ablation threshold is lower than the substrate’s, so the process is self-limiting when fluence sits between the two thresholds.

| Target | Mechanism | Typical laser | Notes |
|---|---|---|---|
| Paint and coatings | Ablation, spallation | Pulsed ns fiber 200 W–2 kW; high-energy multimode | Aerospace depainting, e-coat removal before welding, mould release layers |
| Oxides | Ablation of oxide | Pulsed ns fiber 50–500 W | Pre-weld cleaning of Al and Cu (battery busbars, tabs), pre-bonding |
| Rust | Ablation, thermal shock | Pulsed ns fiber 100 W–2 kW | Maintenance, heritage restoration, rail and ship parts |
| Organic contamination, oils | Vaporisation | Pulsed ns fiber, CO₂ | Pre-painting, pre-bonding surface activation |
| Tyre and production moulds | Ablation of residue | Pulsed ns fiber | In-situ, no dry-ice or chemicals |

Fluence must exceed the contaminant threshold and stay below the substrate damage threshold; overlap, scan speed and passes set throughput (m²/h scales with average power). CW lasers remove thick coatings faster but heat the substrate. Quality checks: contact angle or dyne level, residual contamination (XPS, microscopy), roughness change. Fume and particle extraction with filtration is mandatory.

## 10.10 Cladding and additive manufacturing

| Process | Principle | Typical laser | Key parameters | Applications |
|---|---|---|---|---|
| Laser cladding / LMD (DED) | Powder or wire melted onto a substrate by a defocused beam; overlapping tracks | 1–10 kW fiber, diode or disk; 1–6 mm spots | Dilution (target ~2–10%), track overlap 30–50%, powder mass flow, build rate ~1–5 kg/h | Wear and corrosion coatings (oil and gas, mining), repair of shafts, blisks and blades, near-net features |
| Extreme high-speed cladding (EHLA-type) | Powder melted above the surface; very high surface speed, thin layers | Multi-kW diode or fiber | Surface speeds of tens to hundreds of m/min, layers 25–250 µm | Hydraulic cylinders, brake discs (particle-emission reduction), chrome-plating replacement |
| Laser powder-bed fusion (LPBF) | Scanner melts 20–60 µm powder layers | 200 W–1 kW single-mode fiber per laser; multi-laser machines | Hatch, layer thickness, scan strategy, inert gas flow | Aerospace fuel nozzles, brackets, medical implants (porous Ti), conformal-cooled tooling |
| Green / blue LPBF | Shorter wavelength for reflective powders | 515 nm or 450 nm sources | As LPBF | Pure copper and precious metals |
| Wire-laser DED | Wire fed coaxially or laterally | Multi-kW fiber | Deposition rate, wire feed stability | Large near-net parts, repair |

## 10.11 Laser heat treatment

| Process | Principle | Typical laser | Result | Applications |
|---|---|---|---|---|
| Transformation hardening | Steel heated above austenitising temperature, self-quenched by conduction into the bulk | 1–20 kW diode with rectangular top-hat; pyrometer control | Case depth ~0.1–2 mm, no quench media, low distortion | Cams, gears, dies, cutting edges, guideways |
| Local annealing / softening | Controlled heating reduces hardness locally | Diode, fiber | Formability, crash behaviour | Press-hardened body parts, springs, stainless tubes |
| Remelting, glazing, alloying | Surface melted, optionally with added elements | Diode, fiber | Refined microstructure, new surface chemistry | Wear resistance, corrosion |
| Laser shock peening | High-energy ns pulses under a water overlay generate a pressure wave | Joule-class Nd:glass/Nd:YAG | Deep compressive residual stress | Fan and compressor blades, fatigue-critical parts |
| Semiconductor annealing | ns–ms heating of wafer surface | Excimer, green, NIR, CO₂ | Dopant activation, recrystallisation | Front-end (→ §13.1), LTPS displays |

## 10.12 Laser surface texturing

Surface texturing creates designed topography: dimples for oil retention in piston rings and bearings (lower friction), riblets for drag reduction, laser-induced periodic surface structures (LIPSS, period near the wavelength, produced with fs/ps pulses) for hydrophobic, antibacterial or anti-reflective surfaces, adhesion-promoting micro-structures before bonding, and decorative grain textures on moulds (5-axis ns fiber or ps texturing replacing chemical etching). Parameters: pulse energy and overlap per layer, number of layers, and CAD-based texture mapping onto 3D surfaces.

## 10.13 The CO₂ laser

The CO₂ laser is the industrial workhorse for non-metals because its 9–11 µm output falls on the vibrational absorption bands of polymers, glass, ceramics, wood, paper and water. Sealed RF-excited CO₂ lasers of 10–1000 W are rugged, cheap per watt and have operating lives of tens of thousands of hours.

Physics. The CO₂ molecule has three vibrational modes: symmetric stretch (ν₁), bending (ν₂) and asymmetric stretch (ν₃). The upper laser level is the asymmetric-stretch state (00°1); lasing to the symmetric-stretch state (10°0) gives the 10.6 µm band, and to the bending overtone (02°0) the 9.6 µm band. Each band splits into P- and R-branch rotational lines:

| Band / branch | Wavelength region (≈) | Note |
|---|---|---|
| 10P | 10.5–10.8 µm | Strongest line 10P(20) at 10.59 µm: the standard “10.6 µm” |
| 10R | 10.1–10.4 µm | “10.2 µm” sources for specific polymers and glass |
| 9P | 9.4–9.7 µm | “9.6 µm” lines |
| 9R | 9.2–9.4 µm | “9.3 µm” sources: strong absorption in PET, polyimide, solder mask and tooth enamel |

Line selection uses a grating or wavelength-selective resonator optics; isotopic CO₂ shifts lines further.

Gas mixture. CO₂ (lasing), N₂ (its first vibrational level is nearly resonant with CO₂ 00°1 and transfers energy efficiently), and He (high thermal conductivity; depopulates the lower laser level and cools the gas). Xenon is often added to lower the electron temperature and raise efficiency; CO helps counter CO₂ dissociation in sealed tubes. Quantum efficiency is ~40%; practical wall-plug efficiency 10–20%.

Excitation and architecture

| Architecture | Excitation | Power range (≈) | Beam | Life / service | Typical use |
|---|---|---|---|---|---|
| Sealed glass DC tube | Longitudinal DC discharge, 10–30 kV | 40–150 W | Moderate M² | ~1000–10 000 h; tube replacement | Low-cost engraving and cutting of non-metals |
| Sealed RF metal/ceramic tube or waveguide | Transverse RF discharge (tens to ~100 MHz) | 10–1000 W | M² ~1.1–1.3 | Tens of thousands of hours; gas refill possible | Industrial marking, coding, cutting, PCB |
| Diffusion-cooled slab | RF between large water-cooled planar electrodes a few mm apart; hybrid unstable–stable resonator | ~0.5 kW to multi-kW | M² ~1.2 after beam shaping | Sealed, gas exchange at service | Cutting, welding, high-power marking |
| Fast-axial-flow | Gas circulated by a blower through heat exchangers | 1–20 kW | Good; power-scalable | Gas consumption, blower service | Legacy thick-metal and non-metal cutting |
| TEA / high-energy pulsed | Transverse discharge at atmospheric pressure | J-level pulses | Multimode | Electrodes, gas | Legacy coding, research |
| Amplifier chains | Multi-stage RF-pumped CO₂ amplifiers | Tens of kW average class | Seeded | Complex | Drive lasers for EUV tin-plasma light sources |

RF excitation allows pulse-width modulation at kHz to tens of kHz with rise times of tens of µs, which marking and perforation need. Output couples through a partially reflecting ZnSe mirror (stable resonators) or past a mirror edge (unstable slab resonators); Brewster elements fix linear polarisation.

Beam delivery and optics. No silica fiber transmits 10 µm, so beams travel through mirrors (Cu, Mo, Si with Au or dielectric coatings), ZnSe beam expanders, galvo mirrors (Si or Be) and ZnSe or Ge F-theta lenses. For cutting, a λ/4 phase-retarding mirror converts linear to circular polarisation to remove direction-dependent cut quality. The long wavelength makes spots ~10× larger than at 1 µm for the same optics (→ §4.6).

Applications

| Application | Why CO₂ | Typical configuration |
|---|---|---|
| PCB marking | Solder mask absorbs 9.3/10.6 µm strongly; copper reflects, protecting traces | 10–30 W sealed RF, galvo, vision-guided DataMatrix; 9.3 µm for finer marks with less FR-4 damage |
| PCB via drilling | Dielectric (resin, glass) absorbs; Cu acts as stop | Pulsed high-peak CO₂ with galvo + stage |
| Polymer marking and coding | Direct absorption without additives | Packaging lines, bottles, caps, cables |
| Plastic processing | Clean vaporisation; flame-polished acrylic edges | Flatbed cutters, 3D trimming |
| Film cutting and perforation | Fast, non-contact, roll-to-roll | Micro-perforation for fresh-produce packaging, easy-open scores, label kiss-cutting |
| Glass | Strong absorption at ~10 µm | Scribing, thermal-stress cutting, marking, polishing |
| Wood, paper, leather | Clean cutting and engraving | Furniture, signage, packaging prototypes |
| Textile | Sealed edges on synthetics; denim fading | Garment, automotive airbags and interiors |
| Packaging | Coding at line speed; scoring | Food, beverage, pharma |
| Electronics | Ceramic (Al₂O₃) scribing, thin-board depaneling, flex coverlay | Hybrid circuits, LED substrates |
| Medical | Water absorption for soft-tissue surgery | Surgical CO₂ systems (distinct from manufacturing, → Part XVIII) |

| Strengths | Limitations |
|---|---|
| Broadest non-metal compatibility; low cost per W; long sealed life; excellent beam quality | Mirror-only delivery; large spot at a given f-number; poor absorption on cold metals; ZnSe optics are soft and toxic when damaged; lower efficiency than fiber |

## 10.14 The UV laser

Industrial UV lasers at 343–355 nm are infrared lasers whose output is converted to the third harmonic in nonlinear crystals. They combine a small diffraction-limited spot with a short absorption depth in almost every material, which gives fine features with little heat — the basis of flexible-circuit, PCB, semiconductor and plastic micro-processing.

Nonlinear optics and harmonic generation. In intense light, a crystal’s polarisation responds nonlinearly to the field:

The χ⁽²⁾ term generates the second harmonic (2ω) and sum frequencies (ω₁ + ω₂). Conversion efficiency rises with intensity, so pulsed lasers with kW–MW peak power convert well; phase matching (Δk = 0), set by crystal angle or temperature, is essential.

Fourth harmonic (266/257 nm) comes from doubling the green in BBO or CLBO. Typical IR-to-355 nm conversion is a few tens of percent. UV degrades crystals and coatings over time, so many industrial UV lasers automatically shift the crystal to a fresh spot after a set number of hours — a key service and cost-of-ownership parameter.

Typical specification (≈): ns DPSS or fiber-based 355 nm at 3–50 W mainstream (~100 W class available), 10–30 ns pulses (1–5 ns in short-pulse models), 30–300 kHz; ps UV at 343/355 nm at ~10–50 W.

“Cold” processing, stated precisely. At 355 nm, polymers, polyimide, FR-4 resin and silicon absorb within ~0.01–1 µm, and the focused spot is 3× smaller than at 1064 nm with the same optics. Heat is confined to a thin layer and a small area, giving HAZ of a few µm to tens of µm with ns pulses — not zero. Direct photochemical bond breaking contributes but dominates only at 193/248 nm (→ §1.6).

| Sector | Applications | Why UV |
|---|---|---|
| Electronics | FPC outline and coverlay cutting, rigid-flex depaneling, component and chip marking, white-plastic marking without additives, aerospace wire insulation marking | Fine, low-carbonisation edges on polymers |
| PCB | Depaneling, micro-vias through Cu and dielectric, solder-mask repair, direct imaging (historically) | Cuts both copper and resin |
| Semiconductor | Wafer marking, low-k grooving, thin-wafer dicing, laser lift-off, through-mould via drilling, trimming | Short absorption depth in Si and dielectrics |
| Glass | Surface marking, scribing, TCO/ITO removal | Absorption at glass and coatings |
| Medical | Catheter and tubing marking and cutting, polymer device micro-features | Biocompatible, clean edges, no inks |
| Polymers and films | Film and membrane cutting, micro-structuring | Minimal melt |
| Micromachining | Ceramics, thin films, sensors | Small spot, shallow removal |

## 10.15 Ultrafast lasers in processing

Ultrafast (ps and fs) processing removes or modifies material without significant heat flow, and can deposit energy inside transparent materials. It trades high cost per watt for quality no other laser achieves: minimal HAZ, no recast, no micro-cracks, and 3D processing inside glass.

Mode-locking and pulse bandwidth. Mode-locking (active with AOM/EOM, or passive with SESAM, Kerr-lens or nonlinear-loop mirrors) phase-locks many longitudinal modes; the pulse repetition rate equals the cavity free spectral range (→ §2.5). Short pulses need broad spectra:

Example: a 300 fs sech² pulse at 1030 nm needs ≥ 3.7 nm bandwidth. Dispersion in optics stretches such pulses, so delivery optics are pre-compensated with grating, prism or chirped-mirror compressors.

Chirped-pulse amplification (CPA) stretches pulses 10³–10⁴× (to ~ns), amplifies them safely, then recompresses them (→ §3.6).

Nonlinear effects. Above the critical power for self-focusing, the Kerr effect collapses a beam into a filament:

At 1030 nm this is ~4 MW in fused silica and ~5 GW in air. Filamentation, multiphoton and avalanche ionisation, self-phase modulation and white-light generation are all active in ultrafast processing — as tools (filament and Bessel cutting of glass) and as limits (beam distortion, uncontrolled damage).

Cold ablation and minimal HAZ. Energy is deposited in electrons in femtoseconds and transferred to the lattice in ~1–10 ps; for shorter pulses, material is ablated before heat diffuses (→ §9.5). Quality is best near e² × threshold fluence; throughput scales with average power spread over more pulses, bursts or beams. At MHz rates, heat accumulation can reintroduce a HAZ.

Glass and transparent-material modes

| Mode | Mechanism | Use |
|---|---|---|
| Surface ablation | Nonlinear absorption at the surface | Marking, patterning, drilling |
| Type I in-volume modification | Smooth refractive-index change | Written waveguides, photonic chips |
| Type II nanogratings | Self-organised birefringent structures | Birefringent optics, long-term data storage research |
| Type III voids | Micro-explosion | Internal marking, cutting precursors |
| Filament / Bessel full-thickness modification + cleave | Line damage through the thickness, then mechanical or thermal separation | Display and cover glass, sapphire, chamfers |
| Glass welding | Local melting at an interface under high rep rate | Adhesive-free glass–glass and glass–metal joints |
| Laser-induced selective etching | Modified tracks etch 100–1000× faster | Through-glass vias, microfluidics |

Applications

| Sector | Applications |
|---|---|
| Semiconductor | Low-k and metal-stack grooving, thin-wafer and SiC/GaN dicing, via drilling, wafer marking, probe-card and MEMS micromachining |
| Display | Cover-glass and notch cutting, polariser and OLED stack cutting, pixel repair |
| Glass | Through-glass vias, glass welding, internal marking |
| Medical | Stent cutting (nitinol, Co-Cr, bioresorbable polymers), catheters; ophthalmic surgery (flap, lenticule and cataract procedures) |
| Microfluidics | Channels in glass and polymers; lab-on-chip |
| Battery | Burr-free foil cutting, electrode structuring for faster charging (emerging) |
| Precision electronics and mechanics | FPC, ceramics, fuel-injector nozzles, watch components |

Select ultrafast only when quality requirements cannot be met with ns UV/green; the cost per watt is several times higher and throughput per watt is lower.
