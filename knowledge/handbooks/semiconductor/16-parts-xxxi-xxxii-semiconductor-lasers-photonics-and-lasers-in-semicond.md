---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 16
part_title: "Parts XXXI–XXXII — Semiconductor lasers, photonics and lasers in semiconductor manufacturing"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts XXXI–XXXII — Semiconductor lasers, photonics and lasers in semiconductor manufacturing

L1 summary. Lasers meet semiconductors in two directions. First, semiconductor lasers and photodetectors are semiconductor devices — made on GaAs, InP and GaN wafers with the same epitaxy, lithography and etch toolkit, and they power telecom, data centres, LiDAR, sensing and industrial fibre lasers (as pump diodes). Second, industrial lasers are tools used throughout wafer processing, packaging and electronics assembly.

## Part XXXI — Semiconductor lasers and photonics

### 31.1 Device taxonomy

| Device | Structure | Material system | Wavelengths (typical) | Key applications |
|---|---|---|---|---|
| Fabry-Pérot (FP) laser | Edge-emitting; cleaved facets form the cavity; multimode spectrum | GaAs/AlGaAs, InGaAs/GaAs, InP | 780–1 550 nm | Low-cost links, CD/DVD historically, pumps |
| High-power broad-area EEL / diode bars | Wide stripe edge-emitters, bars and stacks | InGaAs/AlGaAs on GaAs | 8xx–9xx nm (e.g., 808, 915, 940, 976 nm) | Fibre-laser and solid-state-laser pumping, direct-diode materials processing |
| DFB laser | EEL with a grating along the cavity → single wavelength | InGaAsP/InP, AlGaInAs/InP | 1 270–1 610 nm | Telecom and data-centre optics, sensing |
| EML | DFB + integrated electro-absorption modulator | InP | 1 310 nm, 1 550 nm | 100G–200G/lane transceivers |
| VCSEL | Vertical cavity between DBR mirrors; emits from the surface | AlGaAs/GaAs | 850, 940 nm | Short-reach data links, 3D sensing (face ID), LiDAR, optical mice |
| GaN laser diodes | EEL on GaN | InGaN/GaN | 405–520 nm (blue/green) | Blue-laser copper welding, projection, Blu-ray, AR |
| Quantum cascade laser | Intersubband transitions | InP-based | Mid-IR (3–12 µm) | Gas sensing, defence |
| PIN photodiode | p-i-n junction | Si (visible–NIR), InGaAs (1 000–1 700 nm), Ge on Si | — | Receivers, sensing |
| APD | Internal avalanche gain | Si, InGaAs/InP | — | Long-reach receivers, LiDAR |
| SPAD / SiPM | Single-photon avalanche arrays | Si CMOS | — | Direct time-of-flight LiDAR, medical imaging |
| Silicon photonics PIC | Si waveguides, Ge detectors, Si modulators on SOI; laser attached or bonded | Si + III-V | 1 310 / 1 550 nm | Pluggable transceivers, CPO, LiDAR research |

### 31.2 Manufacturing flow

| Step | Specifics vs Si CMOS | Equipment (examples) |
|---|---|---|
| Substrate | 2”–6” GaAs and InP; GaN on sapphire/SiC/GaN | Sumitomo Electric, Freiberger, AXT, Coherent |
| Epitaxy | Quantum wells, graded layers, DBR mirrors grown by MOCVD — the core IP | Aixtron, Veeco (MOCVD); Riber (MBE) |
| Lithography | i-line/DUV steppers; e-beam or holographic litho for DFB gratings | Canon, Nikon, Raith, JEOL |
| Etch | Chlorine-based ICP for III-V ridges and facets; wet etch | Oxford Instruments, SAMCO, Plasma-Therm |
| VCSEL oxidation | Wet lateral oxidation of AlGaAs to form the current aperture | Specialist oxidation furnaces |
| Metallisation | Ti/Pt/Au p-contacts, AuGe/Ni/Au n-contacts | E-beam evaporators, sputter |
| Cleaving | EELs are cleaved along crystal planes to form mirror facets — distinctive step | Scribe-and-break tools |
| Facet coating | AR/HR dielectric stacks; facet passivation against catastrophic optical damage (COD) | Ion-beam / e-beam coaters |
| Burn-in and screening | Weeds out infant failures; essential for pumps and telecom | Burn-in racks, LIV testers |
| Packaging | Chip-on-submount (AuSn solder on AlN/SiC), TO-can, butterfly with TEC, fibre coupling with sub-µm alignment | Active alignment stations (e.g., ficonTEC), die bonders, laser welders |

Key parameters: threshold current, slope efficiency, wall-plug efficiency (> 60 % for best 9xx nm pumps), side-mode suppression ratio (DFB), linewidth, modulation bandwidth, RIN, COD level, lifetime/MTTF.

Suppliers (examples): Lumentum, Coherent, Broadcom, Mitsubishi Electric, Sumitomo Electric, Hamamatsu, ams OSRAM, TRUMPF Photonic Components (VCSEL), II-VI (now Coherent), IPG (in-house pumps), nLIGHT, Focuslight, BWT, Raycus-related Chinese diode makers; SiPh: Intel, Cisco (Acacia), Marvell, Broadcom, TSMC and GlobalFoundries (foundry processes).

### 31.3 Application map

| Market | Devices | Notes |
|---|---|---|
| Telecom | DFB, EML, tunable lasers, APDs, coherent PICs | Long-haul and access networks |
| Data centres | VCSEL (850 nm), EML, DFB + SiPh, PIN, CPO | AI clusters drive 800G/1.6T optics |
| LiDAR | 905 nm EEL arrays, 940 nm VCSEL arrays, 1 550 nm fibre/DFB, SPAD arrays | Automotive and robotics |
| Consumer | VCSEL (3D sensing, proximity), photodiodes | Phones, AR/VR |
| Industrial | 9xx nm pump diodes for fibre lasers; direct-diode lasers; blue GaN lasers | Laser cutting, welding, marking sources |
| Medical | Diode lasers (surgery, aesthetics), OCT sources, photodetectors | — |
| Automotive | LiDAR, in-cabin sensing (VCSEL), optical data links | — |

## Part XXXII — Lasers in semiconductor and electronics manufacturing

Indicative parameters; exact values depend on material, throughput target and equipment design.

| Process | Laser type | Wavelength | Power / pulse regime (indicative) | Material | Application | Key equipment suppliers (examples) |
|---|---|---|---|---|---|---|
| Wafer marking (front/back) | DPSS / fibre, often green or UV; soft-mark and hard-mark | 1 064, 532, 355 nm | Few W average, ns pulses | Si, SiC, GaAs, glass | Wafer ID / OCR / 2D codes (SEMI T7, M12/M13) | EO Technics, Keyence, Han’s Laser, domestic integrators |
| Laser grooving (low-k) | UV / green ps–ns | 355, 532 nm | ~5–20 W | Low-k dielectric, metal stacks | Remove street layers before blade dicing | DISCO, ASMPT, EO Technics |
| Laser full-cut dicing | UV ns/ps, fs for thin wafers | 355, 343, 1 030 nm | ~10–50 W | Si, GaAs, sapphire, thin wafers | Die singulation | DISCO, ASMPT, EO Technics, Han’s |
| Stealth dicing | NIR ns/ps, focused internally | ~1 064–1 342 nm (Si transparent above ~1.1 µm) | Few W | Si, SiC, sapphire, glass | Zero-kerf dicing for MEMS, memory | DISCO (Hamamatsu SD engine) |
| SiC boule slicing | NIR ps laser forming a subsurface split layer | ~1 µm | Tens of W | SiC | Reduce kerf loss on SiC wafering | DISCO (KABRA), Halo Industries, others |
| Laser lift-off (LLO) | Excimer or DPSS UV | 248, 266, 343 nm | Line beam, J/cm² fluence | GaN on sapphire, polyimide on glass | Separate GaN LEDs/micro-LEDs; flexible display release | Coherent (UVblade), AP Systems, Philoptics |
| Temporary-bond laser debond | UV DPSS | 355 nm | Few W | Release layer on glass carrier | Advanced packaging / thin-wafer handling | EV Group, SUSS, Brewer Science (materials) |
| Laser annealing — dopant activation | Green DPSS, CO₂ (historic), excimer | 532 nm, 10.6 µm, 308 nm | ns–ms dwell | Si, SiC backside | Ultra-shallow junction activation; IGBT and SiC backside contacts | Applied Materials, SCREEN (LASSE), Veeco, Mitsui, 3D-Micromac |
| ELA (excimer laser annealing) | Excimer line beam | 308 nm | ~kW-class | a-Si → poly-Si | LTPS display backplanes (OLED phones) | Coherent, AP Systems |
| Laser drilling (PCB, substrates) | CO₂ and UV | 9.3/10.6 µm, 355 nm | Tens to hundreds of W | FR-4, ABF build-up, glass, ceramics | Microvias for HDI and IC substrates; through-glass vias | Mitsubishi Electric, Via Mechanics, ESI (MKS), LPKF |
| Laser trimming | Pulsed DPSS | 1 064, 532 nm | Few W | Thin-film/thick-film resistors | Precision resistor/analog trimming | ESI (MKS), Heraeus |
| Laser ablation / patterning | UV/USP (ps/fs) | 355, 1 030 nm | ~10–100 W | Thin films, polymers, ITO | Solar scribing, display patterning, RDL, EMI shield patterning | 3D-Micromac, Coherent, TRUMPF |
| Package marking | Fibre / green / UV (formerly CO₂) | 1 064, 532, 355 nm | 10–50 W | Mould compound, metal lids, ceramic | Device ID, date code, logo | EO Technics, Han’s, Keyence, ASMPT |
| PCB marking | CO₂ or UV | 9.3–10.6 µm, 355 nm | 10–30 W | Solder mask, FR-4 | Serialisation, 2D codes | Keyence, Han’s, domestic integrators |
| Laser soldering | Diode (9xx nm), fibre | 915–980, 1 070 nm | 10–100 W CW | Sn-based solder | Selective soldering for heat-sensitive parts, camera modules, flex | Apollo Seiko, Unitechnologies, Pac Tech (Seika) |
| Laser-assisted bonding (LAB) | NIR area beam | ~980 nm | Hundreds of W to kW area | Flip-chip solder joints | Low-warpage flip-chip bonding for thin packages | Pac Tech, K&S, Korean LAB suppliers |
| Laser welding | Fibre, blue, green | 1 070, 450, 515 nm | 100 W – several kW | Cu, Al busbars; hermetic lids | Power modules, battery busbars, hermetic packages | TRUMPF, IPG, Coherent |
| Laser cutting | Fibre/USP | 1 070, 1 030 nm | 20 W – kW | Lead frames, stencils, flex, glass | Stencils, flex circuit singulation, cover glass | LPKF, Coherent, TRUMPF |
| Laser cleaning | Pulsed fibre (ns) | 1 064 nm | 20–500 W | Oxides, organics, mould residue | Lead-frame and pad cleaning; mould flash removal (deflash); pre-bond | Various; domestic integrators |
| Micromachining (MEMS, glass) | USP fs/ps | 1 030, 515, 343 nm | 10–100 W | Glass, sapphire, Si | Glass interposer via formation (LIDE-type), MEMS | LPKF (LIDE), 3D-Micromac, Coherent |
| EUV light source | CO₂ drive laser on Sn droplets | 10.6 µm (drive) → 13.5 nm (EUV) | Tens of kW drive | Tin | EUV lithography | TRUMPF (drive laser) for ASML |
| DUV lithography source | Excimer | 248 nm (KrF), 193 nm (ArF) | ~40–120 W | — | Scanners | Cymer (ASML), Gigaphoton |

Where laser equipment companies fit: back-end and board-level processes — marking, dicing and grooving, debonding, drilling, cleaning, soldering, welding of power modules — have lower entry barriers than front-end tools, and the qualification path runs through OSATs and EMS lines rather than leading-edge fabs.

Key takeaways — Parts XXXI–XXXII

Laser diodes follow the semiconductor flow, with epitaxy, cleaving, facet coating and burn-in as distinguishing steps.

9xx nm pump diodes link compound-semiconductor fabs to the industrial fibre-laser industry.

Lasers are used from EUV light generation to package marking; back-end and PCB-level laser processes are the accessible entry points.

Glossary terms introduced: FP laser, EEL, DFB, EML, VCSEL, DBR, COD, facet coating, MOCVD, MBE, APD, SPAD, PIC, SOI, COS, TEC, LIV, SMSR, wall-plug efficiency, LLO, ELA, LAB, USP, LIDE, stealth dicing, grooving.
