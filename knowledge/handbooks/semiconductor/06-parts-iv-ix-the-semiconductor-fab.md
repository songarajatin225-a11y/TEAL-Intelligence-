---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 6
part_title: "Parts IV–IX — The semiconductor fab"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts IV–IX — The semiconductor fab

## Chapter 7 — Inside a semiconductor fab

L1 summary. A fab is a precision chemical factory wrapped around a cleanroom. The cleanroom is only part of it: sub-fab utilities, ultrapure water, bulk and specialty gases, chemical distribution, exhaust abatement, waste treatment and an automated wafer-transport system consume most of the building and much of the non-tool capital.

### 7.1 Fab infrastructure map

Fabs are typically built as a stack: the cleanroom deck (“fab”), a sub-fab beneath with support equipment for each tool, and a plenum/interstitial level for air return and services. The central utility building sits alongside.

### 7.2 Cleanroom classification

ISO 14644-1 classifies air by maximum particles per m³.

| ISO class | Max particles ≥ 0.1 µm / m³ | Max ≥ 0.5 µm / m³ | Approx. US FED-STD-209E equivalent | Typical use |
|---|---|---|---|---|
| ISO 3 | 1 000 | 35 | Class 1 | Inside mini-environments / EFEMs |
| ISO 4 | 10 000 | 352 | Class 10 | Lithography bays (older open-bay fabs) |
| ISO 5 | 100 000 | 3 520 | Class 100 | Modern fab bays with FOUP isolation |
| ISO 6 | 1 000 000 | 35 200 | Class 1 000 | Back-end/ATMP clean areas, service chases |
| ISO 7 | — | 352 000 | Class 10 000 | SMT, assembly, gowning |
| ISO 8 | — | 3 520 000 | Class 100 000 | Packaging warehouses, EMS |

Modern 300 mm fabs use mini-environments: wafers stay in sealed FOUPs and only meet air inside the tool’s equipment front-end module (EFEM). The bay can then run at ISO 5–6 while the wafer sees ISO 1–3.

### 7.3 Environmental control

| Parameter | Typical specification | Why |
|---|---|---|
| Temperature | 21–22 °C ±0.1–0.5 °C (litho zones tightest) | Thermal expansion of wafer/reticle affects overlay |
| Humidity | ~40–45 % RH ±1–5 % | Resist behaviour, static, corrosion |
| Airflow | Vertical laminar via ceiling FFUs, ~0.3–0.5 m/s | Sweeps particles down |
| Pressure | Positive cascade: fab > corridors > outside | Prevents ingress |
| Vibration | VC-C to VC-E criteria on litho/metrology floors (a few µm/s) | Nm-scale exposure and SEM imaging |
| AMC (airborne molecular contamination) | Acids, bases, organics, dopants at ppt–ppb | Resist poisoning (amines), haze on optics |
| ESD / EMI | Grounded surfaces, ionisers, magnetic-field limits near e-beam | Device damage, SEM drift |

### 7.4 Utilities

Ultrapure water (UPW): resistivity 18.2 MΩ·cm, TOC < 1 ppb, particles controlled at tens of nm. Made by pre-treatment → reverse osmosis → ion exchange/EDI → UV oxidation → degassing → polishing mixed-bed → ultrafiltration. A large leading-edge fab uses on the order of tens of thousands of m³ of water per day (fab-specific; reclaim rates vary widely).

Bulk gases: N₂ (largest volume, often from an on-site air-separation unit), O₂, Ar, H₂, He, CDA.

Specialty gases: silane, NF₃, WF₆, NH₃, fluorocarbons (CF₄, C₄F₈, CHF₃), HBr, Cl₂, dopant gases (PH₃, AsH₃, B₂H₆, BF₃). Many are toxic, pyrophoric or corrosive; stored in gas cabinets with leak detection.

Chemicals: H₂SO₄, H₂O₂, HF, HCl, NH₄OH, IPA, developers (TMAH), solvents, CMP slurries — delivered by bulk chemical distribution systems at ppt metal specs.

Power: a large leading-edge fab can draw from tens to a few hundred MW; EUV scanners are among the largest single loads. Power quality (sag immunity, UPS for critical tools) matters because a sag can scrap wafers in process.

Exhaust and abatement: point-of-use abatement (burn/wet or plasma) for PFCs and toxics; general, acid, alkali and solvent exhaust streams.

Waste treatment: HF/fluoride, ammonia, CMP slurry, copper, and solvent streams treated separately.

### 7.5 Automation

FOUP (Front-Opening Unified Pod): sealed carrier for 25 × 300 mm wafers (SEMI E47.1 and related standards).

AMHS (Automated Material Handling System): overhead hoist transport (OHT) vehicles on ceiling rails move FOUPs between stockers and tool load ports.

MES (Manufacturing Execution System): tracks every lot, recipe, tool and measurement; dispatches work.

Host / equipment automation: SEMI SECS/GEM and GEM300 standards connect tools to MES; APC (advanced process control) and FDC (fault detection and classification) run on tool data.

## Chapter 8 — The complete wafer fabrication flow

L1 summary. A chip is built as a stack of patterned layers. Each layer repeats a small set of unit processes — clean, deposit, pattern, etch, implant, anneal, planarise, measure. An advanced logic wafer goes through on the order of 1 000+ process steps and 60–100+ mask layers over ~2–4 months of cycle time.

Why the loop repeats. Each lithography layer defines one pattern — an isolation trench, a gate, a contact, a metal line, a via. A transistor needs ~20–30 patterned layers (front-end-of-line, FEOL); the wiring above needs a pair of layers (metal + via) per interconnect level, and advanced logic has ~12–20 metal levels (back-end-of-line, BEOL). Multi-patterning multiplies litho-etch passes for the tightest layers.

| Module | What it builds | Main unit processes |
|---|---|---|
| FEOL | Isolation (STI), wells, transistor channel, gate, source/drain | Oxidation, litho, etch, implant, anneal, epitaxy, ALD high-k/metal gate |
| MOL (middle-of-line) | Contacts connecting transistors to wiring | Litho, etch, silicide, W/Co/Ru deposition, CMP |
| BEOL | Copper interconnect in low-k dielectric | Dielectric CVD, litho, etch, barrier/seed PVD, Cu electroplating, CMP |
| Passivation | Protective top layers, bond pads | Nitride/oxide CVD, pad opening, Al pads |

## Chapter 9 — Lithography

L1 summary. Lithography prints the pattern. It is the most expensive and most constraining step: it sets minimum feature size, it is repeated at every layer, and its leading-edge tool — the EUV scanner — comes from a single supplier, ASML.

### 9.1 How it works

Photoresist: light-sensitive polymer. Modern DUV resists are chemically amplified (CAR): exposure creates a photo-acid that catalyses a solubility switch during post-exposure bake. Positive resist: exposed areas dissolve; negative: exposed areas remain.

Spin coating: resist dispensed and spun at ~1 000–4 000 rpm to films of ~30 nm (EUV) to several µm (thick resists).

Mask / reticle: a quartz plate with a chromium (DUV) or multilayer-reflector/absorber (EUV) pattern, typically 4× the wafer image. A pellicle membrane keeps particles out of focus.

Exposure: scanners step across the wafer, scanning each field (26 × 33 mm maximum field).

Development: aqueous TMAH (2.38 %) dissolves the soluble regions.

Pattern transfer: the resist pattern is transferred into the underlying film by etch (Ch 11) or used as an implant mask (Ch 12).

Litho clusters integrate a track (coat/bake/develop; Tokyo Electron is the dominant supplier, with SCREEN also active) with the scanner.

### 9.2 Technology evolution

| Generation | Light source | Wavelength | NA | Typical resolution role |
|---|---|---|---|---|
| Contact / proximity | Mercury lamp | 436/365 nm | — | Legacy, MEMS, packaging, research |
| g-line / i-line steppers | Hg lamp | 436 / 365 nm | ≤ ~0.6 | Non-critical layers, power, MEMS, advanced packaging |
| KrF DUV | Excimer laser | 248 nm | up to ~0.93 | ~110–130 nm-class features; many mature-node layers |
| ArF dry | Excimer laser | 193 nm | up to ~0.93 | ~65–90 nm-class features |
| ArF immersion (ArFi) | Excimer laser + water between lens and wafer | 193 nm (effective ~134 nm in water) | up to 1.35 | ~38–40 nm half-pitch single exposure; with multi-patterning to 7 nm-class nodes |
| EUV (0.33 NA) | Tin-plasma, CO₂-laser-driven | 13.5 nm | 0.33 | ~13 nm half-pitch single exposure; 7/5/3 nm-class nodes |
| High-NA EUV (0.55 NA) | Same source family | 13.5 nm | 0.55 | ~8 nm half-pitch target; being introduced for 2 nm-and-beyond generations |

Scanner suppliers: ASML (Netherlands) is the only supplier of EUV and the leading supplier of immersion DUV; Nikon and Canon (Japan) supply DUV/i-line; Canon also markets nanoimprint lithography. Chinese domestic lithography is at earlier generations.

### 9.3 L3 deep dive — resolution physics

The Rayleigh criterion:

CD=k_1(λ)/(NA),  DOF=k_2(λ)/(NA^2)

CD (critical dimension): smallest printed feature.

λ: wavelength; NA = n·sin θ, the numerical aperture of the projection lens.

k₁: process factor. Physical limit for a single exposure is 0.25; production pushes toward ~0.28–0.3 using resolution enhancement (OPC, phase-shift masks, off-axis illumination, source-mask optimisation).

DOF (depth of focus) shrinks with NA², which is why wafer flatness (Ch 6) and CMP (Ch 13) matter.

Worked example: ArFi, λ = 193 nm, NA = 1.35, k₁ = 0.28 → CD ≈ 40 nm. EUV, λ = 13.5 nm, NA = 0.33, k₁ = 0.33 → CD ≈ 13.5 nm.

Pitch vs CD. Density is set by pitch (line + space), not CD alone. Below single-exposure limits, fabs use multi-patterning: LELE (litho-etch-litho-etch), SADP and SAQP (self-aligned double/quadruple patterning using spacers).

Overlay — alignment of one layer to the previous — must be a fraction of the smallest feature: low single-digit nm at the leading edge.

### 9.4 Why EUV is difficult

Source: EUV light is made by hitting ~25–30 µm tin droplets, tens of thousands of times per second, with a high-power CO₂ laser to create a plasma. Conversion efficiency is a few percent; source powers of ~250–600 W at intermediate focus require tens of kW of laser drive and very large wall-plug power.

All-reflective optics: everything absorbs 13.5 nm, including air and glass. Optics are Mo/Si multilayer mirrors (~70 % reflectivity each) in vacuum; after ~10 mirrors only a few percent of the light reaches the wafer. Mirrors are made by ZEISS with sub-atomic figure accuracy.

Reflective masks: multilayer blanks must be virtually defect-free; blank inspection needed new actinic tools.

Stochastics: few photons per nm² → random defects (missing contacts, bridges). Resist sensitivity, dose and line-edge roughness trade off.

Pellicles must survive EUV heating while transmitting ~90 %.

Cost and size: a scanner is the size of a bus, shipped in dozens of containers, and costs on the order of €150–200 M+ (0.33 NA) and substantially more for High-NA (reported figures vary; treat as order-of-magnitude).

Typical litho defects: CD variation, overlay error, focus spots, resist collapse, bridging, stochastic defects, reticle contamination (repeaters).

Cost drivers: scanner depreciation, masks (a leading-edge mask set costs millions of dollars), resist, throughput (wafers per hour), metrology sampling.

## Chapter 10 — Thin-film deposition

L1 summary. Deposition adds the layers — insulators, conductors, semiconductors, barriers — from a few atoms to microns thick. The toolkit spans physical (PVD), chemical (CVD), atomic-layer (ALD) and crystalline (epitaxy) methods, chosen for thickness control, conformality, temperature budget and film quality.

| Method | Principle | Typical temperature | Conformality | Key films | Advantages | Limitations | Major equipment suppliers |
|---|---|---|---|---|---|---|---|
| PVD — sputtering | Ar⁺ ions knock atoms off a target onto the wafer; magnetron confines plasma | RT–~400 °C | Poor (line of sight); improved by ionised PVD | Cu seed, Ta/TaN, Ti/TiN barriers, Al, W, Co, pads | Pure metals, fast, simple | Poor step coverage in high aspect ratios | Applied Materials (dominant), also ULVAC, Evatec, Canon Anelva, TEL |
| PVD — evaporation | Thermal or e-beam evaporation in high vacuum | RT | Very poor | Lift-off metals, compound-semi contacts, optical coatings | Very pure films, simple | Line of sight; limited in modern Si fabs | Various (compound semi / R&D) |
| LPCVD | Gas reaction on hot wafers in batch furnaces at ~0.1–1 Torr | ~550–850 °C | Good | Poly-Si, Si₃N₄, TEOS oxide | Excellent uniformity, batch | High thermal budget | Tokyo Electron, Kokusai Electric, ASM |
| PECVD | Plasma supplies energy, allowing low temperature | ~200–400 °C | Moderate | SiO₂, SiN, SiON, low-k, hard masks | Low temperature, BEOL compatible | Hydrogen content, film density | Lam Research, Applied Materials, ASM, TEL |
| HDPCVD | High-density plasma with simultaneous sputter etch | ~300–400 °C | Gap fill | STI and pre-metal gap fill oxide | Void-free fill | Largely replaced by flowable CVD and ALD at small dimensions | Applied, Lam |
| ALD | Two self-limiting half-reactions pulsed alternately; one monolayer (~0.1 nm) per cycle | ~150–400 °C | Near-perfect | High-k HfO₂, spacers, TiN, liners, DRAM capacitors, 3D NAND | Angstrom control, 100 % conformality | Slow (spatial / batch ALD mitigates) | ASM International, Tokyo Electron, Lam, Applied, Kokusai |
| Epitaxy | Single-crystal film continues the substrate lattice (CVD from SiH₄/SiH₂Cl₂/GeH₄) | ~550–1 150 °C | Selective / blanket | Si epi, SiGe S/D stressors, GaN, SiC epi | Crystalline, doped in-situ | Defects, thermal budget | Applied, ASM (Si); Aixtron, Veeco (MOCVD compound); Aixtron, NuFlare, LPE (SiC) |
| ECD (electroplating) | Electrochemical deposition of Cu into trenches (damascene) | RT | Bottom-up fill with additives | Cu interconnect, TSV, bumps | Fast void-free fill | Additive control, CMP needed | Lam Research, Applied, ACM Research, EBARA |

Critical parameters: thickness and uniformity (often < 1–2 % 1σ), stress, refractive index, step coverage, composition, resistivity, particle adders, defect density.

Typical defects: particles, voids/seams in gap fill, pinholes, delamination, stress-induced wafer bow, thickness non-uniformity.

Materials: precursors (silane, TEOS, TMA, TDMAT, HfCl₄, WF₆), sputter targets (Cu, Ta, Ti, Co, W, Al alloys), carrier/process gases.

Emerging: area-selective deposition, ALD of new metals (Ru, Mo) for interconnect, backside power delivery layers, 2D materials, atomic-layer etch/deposition co-optimisation.

## Chapter 11 — Etching

L1 summary. Etching removes material where the resist pattern allows, transferring the pattern into the film. Modern fabs rely on plasma (dry) etch for anisotropic, nm-accurate profiles, and on wet etch/clean for isotropic removal and surface preparation. Etch has grown in importance as 3D structures (FinFET, GAA, 3D NAND) require extreme aspect ratios.

| Type | Principle | Profile | Selectivity | Use |
|---|---|---|---|---|
| Wet etch | Chemical dissolution (HF for SiO₂, H₃PO₄ for Si₃N₄, KOH/TMAH for Si) | Isotropic (Si crystal-anisotropic in KOH) | Very high | Film strips, cleans, oxide removal, MEMS |
| Plasma (barrel/downstream) | Chemically reactive radicals | Isotropic | High | Resist ashing/strip |
| RIE (reactive ion etch) | Radicals + directional ion bombardment | Anisotropic | Moderate–high | Most patterning etches |
| ICP / TCP high-density RIE | Separate power for plasma density and ion energy | Highly anisotropic | Tunable | Conductor and dielectric etch in advanced nodes |
| DRIE (Bosch process) | Alternating SF₆ etch and C₄F₈ passivation | Very deep, vertical (aspect ratio > 20:1) | High to mask | MEMS, TSVs, plasma dicing |
| ALE (atomic layer etch) | Self-limiting surface modification + removal cycles | Atomic control | Very high | GAA, spacers, 3D NAND |

Key concepts

Isotropic vs anisotropic: isotropic etches equally in all directions and undercuts the mask; anisotropic etches vertically.

Selectivity: ratio of etch rate of the target film to the mask or underlying layer (e.g., oxide:nitride 20:1).

Etch rate: nm/min; uniformity across wafer matters as much as speed.

Endpoint detection: optical emission spectroscopy (watching a species’ emission line change as the layer clears) or interferometry.

Plasma chemistry: fluorine (CF₄, C₄F₈, SF₆, NF₃) for Si and oxides; chlorine/bromine (Cl₂, HBr, BCl₃) for Si, poly and metals; O₂ for organics.

Typical defects: microloading (dense vs isolated features etch differently), aspect-ratio-dependent etch (ARDE), notching, bowing, residues, plasma-induced damage, CD bias.

Suppliers: Lam Research (largest in etch), Tokyo Electron, Applied Materials; Hitachi High-Tech; SEMES (Korea); Chinese suppliers AMEC and NAURA growing. Wet processing: SCREEN, TEL, Lam (single-wafer clean), SEMES, ACM Research.

Emerging: cryogenic etch for 3D NAND high-aspect-ratio channels (e.g., TEL and Lam announcements), ALE, selective isotropic etch for GAA nanosheet release.

## Chapter 12 — Ion implantation and diffusion

L1 summary. Implantation fires ionised dopant atoms into the wafer at a precise dose and energy; annealing then repairs the lattice and activates the dopants. Implant replaced furnace diffusion in the 1970s–80s because it gives independent, accurate control of dose and depth.

| Parameter | Range | Controls |
|---|---|---|
| Dose | ~10¹¹–10¹⁶ ions/cm² | Dopant concentration |
| Energy | ~0.2 keV (ultra-shallow S/D) to several MeV (deep wells, CIS, power) | Depth (projected range) |
| Tilt / twist | 0–60° | Channelling, halo/pocket implants |
| Species | B, BF₂, P, As, Sb, In; also C, Ge, N, H, He for engineering | Type and profile |

Implanter classes: medium-current, high-current, high-energy, and plasma doping. Suppliers: Applied Materials (Varian), Axcelis Technologies, Sumitomo Heavy Industries Ion Technology, Nissin Ion Equipment; Chinese entrants growing.

Annealing: furnace anneal (minutes–hours), RTP/spike anneal (~1 000–1 100 °C for ~1 s), flash lamp and laser annealing (ms to µs) that activate dopants with minimal diffusion — essential for ultra-shallow junctions (Part XXXII). Suppliers: Applied, Mattson, SCREEN, Veeco, TEL.

Modern requirements: junction depths of a few nm, abrupt profiles, high activation (> 10²⁰ cm⁻³), in-situ doped epitaxial source/drain in FinFET/GAA (reducing reliance on implant for S/D), and conformal doping of 3D fins.

Defects: transient enhanced diffusion (TED), end-of-range defects, amorphisation damage, dose non-uniformity, charging, metal and energy contamination.

## Chapter 13 — Chemical Mechanical Planarization (CMP)

L1 summary. CMP polishes each wafer flat between layers. Without it, topography would accumulate and lithography’s shallow depth of focus could not print the next layer. CMP also enables copper damascene wiring: overfill trenches with copper, then polish away the excess.

| Element | Role |
|---|---|
| Slurry | Abrasive nanoparticles (silica, ceria, alumina) + chemistry (oxidisers, complexing agents, inhibitors) tuned per film |
| Pad | Porous polyurethane; conditioned continuously by a diamond disk |
| Carrier head | Holds wafer face-down with multi-zone pressure control |
| Chemical action | Softens/oxidises the surface |
| Mechanical action | Abrasives remove the softened layer |
| Post-CMP clean | Brush scrub + megasonic clean to remove particles and residues |

Preston equation (L3): removal rate ≈ Kₚ × P × V (pressure × relative velocity), modulated by chemistry.

Applications: STI oxide, pre-metal dielectric, W contacts, Cu/barrier, poly-Si, and hybrid-bonding surfaces (requiring sub-nm roughness and controlled Cu recess).

Defects: dishing (metal lines recessed below dielectric, worse in wide lines), erosion (dense arrays thinned), scratches, residual slurry, corrosion, delamination of low-k films.

Suppliers: tools — Applied Materials, EBARA; consumables — slurries (Entegris/CMC, Fujifilm, Resonac, DuPont, Merck/Versum), pads (DuPont, Entegris, 3M, Fujibo), conditioners (3M, Entegris, Kinik, Saesol).

Localization considerations for Parts IV–IX: front-end process tools are the highest-barrier segment of the equipment industry. Realistic entry points for new regions are subsystems and consumables (gas panels, valves, RF generators, chambers parts, quartz and ceramic parts, cleaning/refurbishment services, chemicals, gases) rather than full process tools.

Key takeaways — Parts IV–IX

A fab is utilities and automation around ~6 repeated unit processes.

Lithography sets the pace and the cost; EUV is a single-supplier chokepoint.

Deposition and etch have grown in importance as scaling moved from shrinking to 3D structures.

CMP and metrology are what make 60–100 stacked layers physically possible.

Glossary terms introduced: ISO 14644, FFU, EFEM, FOUP, OHT, AMHS, MES, SECS/GEM, APC, FDC, UPW, AMC, abatement, FEOL, MOL, BEOL, damascene, CAR, reticle, pellicle, scanner, track, NA, k₁, DOF, OPC, SADP/SAQP, overlay, stochastic defect, PVD, CVD, LPCVD, PECVD, ALD, epitaxy, ECD, RIE, ICP, DRIE, ALE, selectivity, endpoint, dose, projected range, RTP, laser anneal, TED, CMP, slurry, dishing, erosion.
