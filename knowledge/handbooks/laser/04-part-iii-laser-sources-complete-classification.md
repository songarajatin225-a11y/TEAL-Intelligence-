---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 4
part_title: "Part III — Laser Sources: Complete Classification"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part III — Laser Sources: Complete Classification

Industrial laser processing is dominated by four source families — Yb fiber (1.03–1.08 µm), CO₂ (9.3–10.6 µm), diode-pumped solid-state with harmonics (1064/532/355 nm) and ultrafast (ps/fs, 1030 nm and harmonics) — with direct diodes, excimers and thin-disk lasers filling specific niches. Each family exists because it wins on one axis: absorption, beam quality, pulse regime, efficiency or cost. Supplier names below are representative, not exhaustive; Part XXI maps the ecosystem with sources.

## 3.1 Classification axes

| Axis | Classes | Why it matters |
|---|---|---|
| A. Gain medium | Bulk solid-state crystal/glass, fiber, gas, semiconductor, liquid dye, free-electron beam | Sets wavelength, scalability, efficiency, beam quality |
| B. Wavelength | UV, visible, NIR, SWIR, MWIR, LWIR (→ §1.10) | Sets absorption and achievable spot size |
| C. Operating mode | CW, modulated/QCW, pulsed (Q-switched, gain-switched, mode-locked) | Sets heat input and peak intensity |
| D. Pumping | Flash lamp, laser diode, electrical discharge (DC/RF), current injection, chemical, electron beam | Sets efficiency, lifetime, cost |
| E. Pulse duration | ms, µs, ns, ps, fs, as | Sets thermal vs non-thermal interaction (→ Part IX) |
| F. Average power | Low < 1 W; medium 1–100 W; high 0.1–10 kW; ultra-high > 10 kW | Sets throughput and thickness capability |
| G. Architecture | Oscillator, MOPA, regenerative/multipass amplifier, CPA, beam combining, harmonic conversion, OPO | Sets pulse flexibility and power scaling |
| H. Application | Marking, cutting, welding, micromachining, medical, telecom, sensing, defence, science | Commercial segmentation |
| I. Process regime enabled | Heating (hardening, soldering), melting (welding, cutting, cladding), vaporisation/ablation (marking, drilling), photochemical (excimer), nonlinear/cold (ultrafast) | Links the source to the manufacturing process (→ Part X) |

“Ultrafast” is a pulse regime, not a gain medium: industrial ultrafast lasers are Yb or Nd solid-state, Yb disk or slab, or Yb fiber systems.

## 3.2 Solid-state lasers

Solid-state lasers use rare-earth or transition-metal ions doped into a crystal or glass. Diode pumping (DPSS) replaced flash lamps in most industrial designs from the late 1990s, raising efficiency roughly tenfold and lifetime from hundreds of hours to tens of thousands.

| Type | Gain medium and physics | Pump | Wavelength | Typical power / energy | Pulse duration | Wall-plug efficiency (≈) | Beam quality (≈) |
|---|---|---|---|---|---|---|---|
| Ruby | Cr³⁺:Al₂O₃, three-level | Flash lamp | 694.3 nm | J per pulse, ≤ ~10 Hz | ns (Q-switched), ms (free-running) | < 1% | Moderate–poor |
| Nd:YAG | Nd³⁺:Y₃Al₅O₁₂, four-level, isotropic | Flash lamp; 808/885 nm diodes | 1064 nm (also 946, 1319 nm) | mW to multi-kW CW (lamp rods); mJ–J Q-switched | CW; 5–20 ns Q-switched; 0.1–20 ms free-running | Lamp 1–3%; diode 10–20% | M² 1.1 (TEM₀₀) to > 20 (multimode rods) |
| Nd:YVO₄ | Nd³⁺:YVO₄; high emission cross-section, polarised output, τ ≈ 100 µs | 808/880 nm diodes, end-pumped | 1064 nm (also 1342 nm) | 5–100 W | 5–100 ns at 10–500 kHz; ps with mode-locking | 10–20% | M² < 1.3 |
| Nd:YLF | Nd³⁺:LiYF₄; long τ (~480 µs), weak thermal lens, birefringent | Diodes, lamps | 1047 / 1053 nm | mJ–tens of mJ at 1–10 kHz | 10–200 ns | 5–15% | M² < 1.5 |
| Yb:YAG | Yb³⁺:YAG, quasi-three-level, 5–9% quantum defect | 940 / 969 nm diodes | 1030 nm | Rod: W–100s W; thin disk: multi-kW CW; ultrafast disk/slab: 100s W | CW; ns; ps–fs | 25–35% (disk) | Disk BPP 2–8 mm·mrad (CW); M² < 1.3 (ultrafast) |
| Other Yb hosts | Yb:KGW / KYW, Yb:CaF₂, Yb:CALGO — broad gain bandwidth | 976–981 nm diodes | 1025–1050 nm | 1–100 W average | 100 fs–10 ps | 15–25% | M² < 1.2 |
| Er:YAG | Er³⁺:YAG | Flash lamp; diodes | 2.94 µm (also 1.645 µm in-band pumped) | 1–30 W average; mJ–J pulses | 50–1000 µs (free-running) | 1–3% | Multimode |
| Ho:YAG | Ho³⁺:YAG (often Cr,Tm,Ho-codoped) | Flash lamp; Tm-fiber pumped | 2.08–2.1 µm | 20–150 W average (medical) | 100 µs–1 ms | 1–3% (lamp) | Multimode |
| Ti:sapphire | Ti³⁺:Al₂O₃; broadband vibronic gain | 532 nm lasers (CW for oscillators, pulsed for amplifiers) | 650–1100 nm tunable, peak ~800 nm | mW–W oscillators; mJ–J in CPA amplifiers | < 10 fs to ps | < 1% | M² < 1.2 |

| Type | Advantages | Limitations | Typical applications | Representative suppliers | Typical architecture |
|---|---|---|---|---|---|
| Ruby | Visible red, high pulse energy | Very inefficient, low rep rate | Historical; Q-switched tattoo and pigment removal | Medical-aesthetic OEMs | Lamp-pumped rod oscillator |
| Nd:YAG | Mature, robust, high pulse energy | Thermal lensing and birefringence at high power; lamp versions inefficient | Pulsed welding (jewellery, medical), drilling, rangefinding, aesthetics, OPO pumping | Lumibird (Quantel), Coherent, legacy lamp-pumped OEMs | Rod oscillator, often with Q-switch and amplifier |
| Nd:YVO₄ | High gain, short pulses at high rep rate, efficient harmonic conversion | Poor energy storage; low thermal conductivity limits power | Green and UV DPSS sources, marking, micromachining, ps seeds | Coherent, MKS Spectra-Physics, Photonics Industries, Huaray, Inno Laser | End-pumped oscillator, AO Q-switch, intracavity or external harmonics |
| Nd:YLF | Stores energy, low thermal distortion | Limited power; unusual wavelength | Q-switched green (527 nm) pumping of Ti:sapphire amplifiers; drilling | Scientific laser OEMs | Q-switched oscillator + doubler |
| Yb:YAG | Very low heat, power-scalable (disk, slab) | Needs high pump brightness; thermally populated lower level | Thin-disk CW welding/cutting; high-power ultrafast | TRUMPF (disk), EdgeWave (Innoslab), Dausinger+Giesen | Thin disk on heat sink, multi-pass pumping; Innoslab |
| Other Yb hosts | Supports sub-300 fs pulses directly | Lower thermal conductivity than YAG | Industrial fs micromachining, OPA pumping | Light Conversion, Amplitude, Coherent | Mode-locked oscillator + regenerative amplifier |
| Er:YAG | 2.94 µm matches the water absorption peak | Needs IR-transmitting delivery (articulated arm, special fibers) | Dental and dermatology ablation; 1.645 µm eye-safe LiDAR | Medical OEMs (e.g., Fotona) | Lamp-pumped rod, free-running |
| Ho:YAG | Strong water absorption, delivered via silica fiber | Low efficiency, large power supplies | Urology lithotripsy, orthopaedics | Medical OEMs (e.g., Lumenis, Boston Scientific, Olympus) | Multiple lamp-pumped rods combined |
| Ti:sapphire | Broadest gain; shortest pulses; tunable | Expensive, complex, low efficiency | Research, multiphoton microscopy, attosecond science | Coherent, MKS Spectra-Physics, Amplitude, Thales | Kerr-lens mode-locked oscillator + CPA |

## 3.3 Fiber lasers

A fiber laser’s gain medium is a rare-earth-doped silica core, a few µm to ~50 µm across, inside a larger pump cladding. Pump light from fiber-coupled diodes is absorbed over metres; heat spreads over a long, thin fiber with a large surface-to-volume ratio; and the waveguide fixes the output mode. The result is high efficiency, excellent beam quality, no free-space alignment and a monolithic, spliced construction — the reasons fiber lasers took most of industrial metal processing from lamp-pumped Nd:YAG and a large share of flat-sheet cutting from CO₂.

| Type | Gain medium / physics | Pump | Wavelength | Typical power | Pulse duration | Wall-plug efficiency (≈) | Beam quality (≈) |
|---|---|---|---|---|---|---|---|
| Yb fiber, CW single-mode | Yb:silica, core ~10–25 µm, quasi-three-level at 1030, four-level-like at 1070 | 915 / 976 nm diodes, cladding-pumped | 1060–1080 nm (1070 typical) | 10 W to low kW (higher demonstrated) | CW, modulated to ~50 kHz | 30–45% | M² < 1.1 |
| Yb fiber, CW multimode | Yb:silica; oscillators combined or large-core oscillators | 915 / 976 nm | ~1070–1080 nm | 1–30 kW mainstream; ≥ 50 kW offered for thick-plate cutting | CW, modulated | 35–50% | BPP ~1.5–20 mm·mrad by delivery fiber |
| Yb fiber, QCW | CW architecture with overdriven pumps | 915 / 976 nm | ~1070 nm | 100–2000 W average; ~10× peak | 0.05–50 ms | 30–40% | BPP 1.5–6 mm·mrad |
| Yb fiber, Q-switched ns | AO-modulated cavity | 915 / 976 nm | 1064 nm | 10–100 W | 80–200 ns (fixed-ish) | 20–30% | M² < 1.5 |
| Yb fiber, MOPA ns | Directly modulated seed diode + Yb amplifiers | 915 / 976 nm | 1064 nm | 20–500 W | ~2–2000 ns selectable | 20–30% | M² 1.2–1.8 (higher for high-energy multimode) |
| Yb fiber, picosecond | Mode-locked or gain-switched seed + fiber amplifiers | 976 nm | 1030–1064 nm (+ 515, 343 nm) | 5–100 W | 1–50 ps | 15–25% | M² < 1.3 |
| Yb fiber, femtosecond | Mode-locked oscillator + stretcher + fiber/rod amplifiers + compressor (CPA) | 976 nm | 1030 nm (+ harmonics) | 5–200 W industrial | 200–900 fs | 10–20% | M² < 1.3 |
| Er fiber | Er:silica, quasi-three-level | 980 / 1480 nm | 1530–1610 nm | mW–10 W (amplifiers) | CW, pulsed | 10–25% | M² < 1.1 |
| Er/Yb co-doped | Yb absorbs pump, transfers energy to Er | 915 / 976 nm | 1530–1570 nm | 1–100 W | CW, ns | 15–30% | M² < 1.2 |
| Thulium fiber | Tm:silica; two-for-one cross-relaxation | 793 nm or in-band 1.6 µm | 1.9–2.05 µm (1940 typical) | 1 W–kW | CW, QCW, ns | 10–25% | M² < 1.2 (SM) |
| Holmium fiber | Ho:silica, in-band pumped | Tm fiber at 1.95 µm | 2.05–2.15 µm | 1–100 W | CW, pulsed | — (two-stage) | M² < 1.2 |
| Raman fiber | Stimulated Raman scattering in passive fiber; no inversion | Yb fiber laser | Cascaded 1.1–1.6 µm | 1 W–100s W | CW | Stage-dependent | M² < 1.2 |

| Type | Advantages | Limitations | Typical applications | Representative suppliers | Typical architecture |
|---|---|---|---|---|---|
| Yb CW single-mode | Smallest spots, longest working distances, remote welding | Back-reflection sensitivity; lower max power than multimode | Fine cutting (stents, foils), remote and wobble welding, AM (LPBF) | IPG, TRUMPF, Coherent, Raycus, Maxphotonics; nLIGHT for AM and defence (exited cutting and welding in 2026, → §21.2) | Oscillator or MOPA; single-mode delivery |
| Yb CW multimode | Cheapest W, kW scaling, maintenance-free | Poor absorption on Cu/Al at room temperature; back-reflection protection needed | Sheet and plate cutting, keyhole welding, cladding | IPG, Raycus, Maxphotonics, TRUMPF, Coherent | Combined oscillators into 50–200 µm delivery fiber |
| Yb QCW | High peak at low average power and cost | Limited duty cycle | Spot and seam welding, drilling, battery tabs | IPG, Raycus, Maxphotonics | CW design with pump overdrive |
| Yb Q-switched ns | Low cost, robust | Fixed pulse width, limited flexibility | Basic metal marking and engraving | Raycus, JPT, Maxphotonics, IPG | AO Q-switched oscillator |
| Yb MOPA ns | Pulse width tunable per recipe; stable at high rep rate | Pulse energy limited by fiber core | Black and colour marking, anodised Al, plastics, fine engraving, cleaning | JPT, IPG, Raycus, Maxphotonics, TRUMPF (SPI) | Seed + pre-amp + booster |
| Yb ps / fs | Minimal HAZ, compact, lower cost than bulk ultrafast | Pulse energy limited by nonlinearity (fs needs CPA) | Glass, sapphire, film and semiconductor micromachining | Coherent, NKT Photonics, IPG, TRUMPF, Amplitude, Huaray, YSL | Seed + fiber amps; CPA or rod booster |
| Er fiber | Telecom C/L band; eye-safer region | Low power per W electrical | EDFAs, LiDAR, sensing, seeds | Lumentum, Coherent, NKT, Lumibird | Core-pumped amplifier |
| Er/Yb | Watts at 1.5 µm | Efficiency ceiling | Rangefinding, LiDAR, free-space optical communication | Lumibird (Keopsys), IPG, NKT | Cladding-pumped amplifier |
| Thulium fiber | Strong absorption in polymers and water | Low efficiency at 793 nm pumping; needs water-free paths | Transparent polymer welding, medical lithotripsy and cutting, Si processing, Ho pumping | IPG, nLIGHT, Coherent, specialist OEMs | Oscillator or MOPA |
| Holmium fiber | Longer 2 µm atmospheric window | Complex two-stage pumping | Defence, LiDAR, mid-IR OPO pumping | Specialist and research suppliers | Tm-pumped Ho oscillator |
| Raman fiber | Reaches wavelengths with no good rare-earth transition | Nonlinear, limited efficiency | Telecom Raman amplifiers, 1.1–1.5 µm sources, frequency-doubled yellow guide stars | IPG, MPB Communications | Cascaded Raman resonators |

## 3.4 Gas lasers

Gas lasers use atomic, ionic or molecular transitions in a gas excited by an electrical discharge. Industrially, only two remain large: CO₂ (long-wave IR, for non-metals and some thick metal cutting) and excimer (deep UV, for lithography and display processing). He-Ne and ion lasers are mostly legacy. CO₂ is treated in depth in §10.13.

| Type | Gain medium / physics | Pump | Wavelength | Typical power / energy | Pulse duration | Wall-plug efficiency (≈) | Beam quality (≈) |
|---|---|---|---|---|---|---|---|
| CO₂ | CO₂:N₂:He mix; vibrational–rotational transitions; N₂ transfers energy to CO₂ | RF (sealed) or DC (flowing, glass tubes) discharge | 10.6 µm (also 9.3, 9.6, 10.2 µm) | Sealed 5 W–~1 kW; diffusion-cooled slab to multi-kW; fast-axial-flow to ~20 kW | CW; RF-pulsed µs; TEA and EUV-driver pulses ns–µs | 10–20% | M² 1.05–1.3 |
| CO | CO vibrational transitions, cooled or sealed RF | RF discharge | ~5.2–6 µm | Tens to hundreds of W | CW, pulsed | ~10% | M² < 1.3 |
| He-Ne | Ne transitions pumped by He metastables | DC glow discharge | 632.8 nm (also 543, 594, 1152, 3391 nm) | 0.5–50 mW | CW | < 0.1% | M² ≈ 1.0 |
| Ar-ion | Ar⁺ ion transitions | High-current DC discharge | 488 / 514.5 nm (UV lines 351/364 nm) | mW–25 W | CW (mode-locking possible) | 0.01–0.1% | M² < 1.2 |
| Kr-ion | Kr⁺ ion transitions | High-current DC discharge | 647.1 nm (also 413, 531, 568 nm) | mW–W | CW | < 0.1% | M² < 1.2 |
| Excimer | Rare-gas–halide dimers bound only in the excited state, so inversion is automatic | Pulsed high-voltage discharge (e-beam for very large systems) | 157 (F₂), 193 (ArF), 248 (KrF), 308 (XeCl), 351 nm (XeF) | W to ~1 kW average; mJ to ~1 J per pulse | 10–30 ns at 100 Hz–6 kHz | 1–3% | Rectangular, M² ~100 × 1000; homogenised to line or top-hat |

| Type | Advantages | Limitations | Typical applications | Representative suppliers | Typical architecture |
|---|---|---|---|---|---|
| CO₂ | Absorbed by nearly all non-metals; low cost per watt at 10 µm; mature | No silica-fiber delivery (mirrors only); 10× larger diffraction-limited spot than 1 µm; poor absorption on cold metals; ZnSe/Ge optics | PCB marking and depaneling (9.3 µm), polymer and film cutting, packaging coding, wood, acrylic, textile, glass, thick non-metal cutting, EUV plasma drive | Coherent, Novanta (Synrad), Luxinar, TRUMPF (incl. Access Laser); low-cost glass-tube makers in China | Sealed RF metal/ceramic tube or waveguide; diffusion-cooled slab with hybrid unstable resonator; fast-axial-flow with blower |
| CO | Shorter λ than CO₂ with strong polymer and glass absorption; smaller spot | Few suppliers, limited ecosystem | Thin films, glass, polymers where CO₂ absorbs too strongly or weakly | Small number of CO₂ specialists | Sealed RF, CO₂-like construction |
| He-Ne | Near-perfect beam, stable, low noise | Very low power and efficiency | Alignment, interferometry, metrology | Photonics catalogue suppliers | Sealed glass tube with internal mirrors |
| Ar / Kr ion | Visible lines, CW | 10–50 kW electrical for watts; water cooling; short tube life | Legacy spectroscopy and bio-instruments (mostly replaced by DPSS, OPSL and diodes) | Legacy suppliers | Plasma tube with magnetic confinement |
| Excimer | High-energy deep-UV photons, large-area beams | Toxic halogen gas handling, gas refills, high maintenance cost | DUV lithography (ArF immersion, KrF), excimer laser annealing of LTPS/OLED backplanes (308 nm), laser lift-off of flexible displays, refractive eye surgery (193 nm), fiber Bragg grating writing, pulsed laser deposition | Cymer (ASML) and Gigaphoton (lithography); Coherent (industrial, display, medical OEM) | Pulsed discharge chamber, halogen gas circulation, solid-state pulser, line-narrowing module for lithography |

## 3.5 Semiconductor lasers

Semiconductor lasers generate gain by injecting electrons and holes into a quantum-well active region; recombination emits photons at roughly the band-gap energy. They are the most efficient lasers (55–70% electrical-to-optical for high-power 9xx nm chips), the most produced by unit count, and the pump source inside almost every fiber and DPSS laser. Their wavelength shifts with temperature (~0.3 nm/K for edge emitters, ~0.07 nm/K for VCSELs), which is why 976 nm pumps for Yb’s narrow absorption peak are stabilised with volume Bragg gratings.

| Type | Structure / physics | Wavelength | Typical power | Pulse | Efficiency (≈) | Beam quality |
|---|---|---|---|---|---|---|
| Edge-emitting broad-area single emitter | Stripe waveguide ~100–200 µm wide, cleaved facet mirrors, InGaAs/AlGaAs quantum wells | 780–1060 nm (808, 915, 940, 976 pumps); 445–455 nm GaN | 10–30 W per 9xx nm chip | CW, QCW | 55–70% E-O | Fast axis near-diffraction-limited; slow axis BPP several mm·mrad |
| Diode bars and stacks | 10–50+ emitters on a 10 mm bar; bars stacked | 8xx–9xx nm | 100–500+ W CW per bar; stacks to multi-kW | CW, QCW | 50–65% | Poor, asymmetric; needs beam shaping |
| Fiber-coupled pump module | Many single emitters combined spatially and by polarisation into 105–200 µm fiber | 915, 940, 976 nm | Tens to several hundred W | CW | 40–50% at fiber output | BPP set by fiber (e.g., 105 µm / 0.15–0.22 NA) |
| Direct-diode industrial system | Modules combined spatially, spectrally and by polarisation | 9xx nm; 445–455 nm (blue) | kW to tens of kW (9xx); kW-class (blue) | CW, modulated | 35–50% wall-plug | BPP ~10–100 mm·mrad |
| Single-mode ridge (Fabry–Pérot) | Narrow ridge waveguide | 405, 635–660, 780–1550 nm | mW–1 W | CW, modulated | 20–40% | M² ≈ 1.1 (elliptical) |
| DFB | Bragg grating along the active region → single longitudinal mode | 760–2000 nm (1310/1550 telecom) | mW–100s mW | CW, modulated to tens of GHz | 20–40% | Single-mode, MHz linewidth |
| DBR | Grating in a separate passive section; tunable | 780–1100 nm and telecom | mW–W | CW | 20–30% | Single-mode |
| Quantum-well / quantum-dot | Active-region design used in nearly all modern diodes; strain sets wavelength | All diode bands | — | — | — | — |
| VCSEL | Vertical cavity between epitaxial DBR mirrors; circular output | 850, 940 nm (680–1550 nm) | mW per emitter; arrays to 100s W–kW | CW, pulsed ns | 30–55% | Circular, low divergence; multimode arrays |
| Quantum cascade laser (QCL) | Electron intersubband transitions cascaded through tens of stages (InGaAs/InAlAs on InP) | ~3.5–12 µm (THz with cooling) | mW–several W | CW, pulsed | ~5–20% | Near-diffraction-limited |
| Interband cascade laser (ICL) | Type-II interband cascade | ~3–6 µm | mW | CW | Low drive power | Single-mode |

| Type | Advantages | Limitations | Typical applications | Representative suppliers |
|---|---|---|---|---|
| Broad-area, bars, pump modules | Highest efficiency, compact, low cost per W | Poor, asymmetric beam; temperature-sensitive wavelength; facet damage (COD); back-reflection sensitive | Pumping fiber and DPSS lasers; hardening; soldering; plastic welding | Coherent, Lumentum, nLIGHT, IPG (captive), Jenoptik, Focuslight, BWT, Everbright |
| Direct-diode system | Highest wall-plug efficiency; top-hat spots ideal for surfaces | BPP too large for fine cutting and deep keyholes | Hardening, cladding, brazing, conduction welding; blue diodes for copper | Laserline, TRUMPF, Coherent, Nuburu (blue), Shimadzu (blue) |
| Single-mode FP / DFB / DBR | Single frequency, direct high-speed modulation, low cost at volume | Low power | Telecom and datacom, gas sensing, seeds for fiber MOPAs, optical storage | Lumentum, Coherent, Broadcom, Mitsubishi Electric, Sumitomo, nanoplus |
| VCSEL | Wafer-level test, circular beam, low drift, cheap in volume | Low power per emitter | 3D sensing and face recognition, datacom links, ToF and LiDAR, optical mice, industrial IR heating arrays | Lumentum, Coherent, ams OSRAM, TRUMPF Photonic Components, Broadcom |
| GaN violet/blue diodes | 405–455 nm direct emission | Lower efficiency than 9xx nm | Laser direct imaging (405 nm), projectors, blue industrial sources, Cu welding | Nichia, ams OSRAM |
| QCL / ICL | Direct mid-IR emission at chosen wavelength | Costly, low power, limited suppliers | Gas and breath analysis, spectroscopy, IR countermeasures, explosive detection | Hamamatsu, Thorlabs, Leonardo DRS (Daylight Solutions), Alpes Lasers, mirSense |

High-power diode value chain — relevant to any indigenous source or diode ATMP programme:

Facet quality (catastrophic optical damage threshold), die-bond void control and burn-in screening dominate reliability; the optical assembly steps (G–I) dominate cost and yield in module production.

## 3.6 Ultrafast lasers

Ultrafast lasers deliver pulses shorter than the time electrons take to pass energy to the lattice (~1–10 ps in metals). Material is removed before heat can spread, so melt, recast and HAZ shrink to near zero (physics in §9.5, processing in §10.15). Industrial ultrafast sources are almost all Yb-based at 1030 nm, frequency-converted to 515 and 343 nm when shorter wavelengths are needed.

| Regime | Duration | How it is generated | Gain media | Typical industrial specification (≈) | Uses |
|---|---|---|---|---|---|
| Picosecond | 1–50 ps | SESAM mode-locked oscillator + regenerative, Innoslab, disk or fiber amplifier | Nd:YVO₄, Yb:YAG disk/slab, Yb fiber | 10–200 W; 1–500 µJ; 100 kHz–several MHz; burst mode | Glass and sapphire cutting, display, drilling, stents, PCB and FPC, wafer grooving |
| Femtosecond | ~100–900 fs industrial (< 100 fs research) | Chirped-pulse amplification (CPA): stretch, amplify, recompress | Yb:KGW, Yb fiber, Yb disk/slab/rod; Ti:sapphire (research) | 5–300 W; µJ–mJ; kHz–MHz; 1030/515/343 nm | Glass welding and in-volume modification, waveguide writing, ophthalmic surgery, medical tubes, semiconductor and OLED processing, microfluidics |
| Attosecond | 10⁻¹⁸ s range (isolated pulses ~50–500 as) | High-harmonic generation (HHG) in gas driven by intense fs pulses | Driven by Ti:sapphire, OPCPA or Yb systems | nJ-level XUV/soft X-ray pulses | Research on electron dynamics in atoms, molecules and solids; no industrial machining role |

CPA (Strickland and Mourou, Nobel Prize in Physics 2018) stretches pulses before amplification so that peak power stays below damage and nonlinear limits, then recompresses them. Attosecond pulse generation earned the 2023 Nobel Prize in Physics (Agostini, Krausz, L’Huillier). Burst modes — trains of pulses at MHz or GHz spacing — raise removal rates for metals and silicon and are a key differentiator between industrial sources.

Representative industrial ultrafast suppliers: TRUMPF, Coherent, MKS Spectra-Physics, Light Conversion, Amplitude, NKT Photonics, EKSPLA, IPG; Chinese suppliers such as Huaray and YSL Photonics are expanding rapidly.

## 3.7 Specialised lasers

| Type | What it is | Why it exists | Typical specification (≈) | Applications | Limitations | Representative suppliers |
|---|---|---|---|---|---|---|
| Disk laser | Yb:YAG disk ~0.1–0.3 mm thick on a heat sink; pump passes many times | Heat flows along the beam axis → very low thermal lensing, power-scalable | Multi-kW CW at BPP ~2–8 mm·mrad; ultrafast 100s W | Welding, cutting, high-power ultrafast | Complex pump optics | TRUMPF |
| Slab laser | Rectangular gain medium; CO₂ slab or Yb/Nd Innoslab | Large cooled surface with good beam extraction | CO₂: multi-kW sealed; Innoslab: 100s W ps/fs | CO₂ cutting and marking; ultrafast | Anamorphic beam needs conditioning | Coherent (CO₂ slab), EdgeWave |
| DPSS | Generic term: diode-pumped solid-state (Nd:YVO₄, Nd:YAG, Yb:YAG) incl. harmonics | Replaced lamp pumping | mW–100s W | Green/UV marking, micromachining, scientific | Crystal thermal limits | Coherent, MKS, Huaray, Inno Laser, Photonics Industries |
| OPSL | Optically pumped semiconductor disk (VECSEL) with intracavity doubling | Any visible wavelength, low noise | mW–tens of W at 460–640 nm | Bio-instruments, displays, medical, light shows | Low power for processing | Coherent |
| Dye laser | Organic dye in solvent, pumped by lamp or laser | Broad tunability 400–900 nm | mW–W; ns or fs | Legacy spectroscopy, some dermatology | Toxic, degrading dyes; replaced by OPOs and Ti:sapphire | Specialist scientific suppliers |
| Free-electron laser (FEL) | Relativistic electron beam in an undulator; no bound gain medium | Tunable from THz to hard X-ray at extreme brightness | fs pulses, GW–TW peak (XFEL) | Structural biology, materials science, EUV/X-ray research | Accelerator-scale facility | Facilities: European XFEL, LCLS, SACLA, SwissFEL, PAL-XFEL |
| OPO / OPA | Nonlinear crystal (PPLN, LBO, BBO, KTA) splits a pump photon into signal + idler | Wavelengths no gain medium provides; broad tuning | 0.4–5 µm (to ~20 µm with special crystals) | Spectroscopy, mid-IR sources, microscopy, defence | Needs a strong pump laser; complexity | Light Conversion, Coherent, MKS, EKSPLA |
| Mid-IR solid-state and fiber | Cr:ZnSe/ZnS (2–3 µm), Fe:ZnSe (3.7–5 µm), Er:ZBLAN fiber (~2.8 µm), Tm/Ho fiber, QCL | Molecular fingerprint region; water and polymer absorption | mW–10s W | Sensing, medical ablation, polymer processing research, defence | Fragile fluoride fibers; costly crystals | IPG (Cr:ZnSe/ZnS), specialist suppliers |
| UV sources | Harmonic DPSS/fiber (355, 343, 266, 257, 213 nm), excimer, UV diodes (375, 405 nm) | Short absorption depth, small spot, direct photochemistry | 355 nm to ~100 W class ns; UV ps/fs tens of W | PCB/FPC, semiconductor, glass, marking, LDI, inspection | Crystal and optics degradation; cost per W ~5–10× IR | Coherent, MKS, Huaray, Inno Laser, TRUMPF |
| Supercontinuum | fs/ps pulses broadened in photonic-crystal fiber | Single-mode “white laser” 400–2400 nm | mW–W total | Microscopy, OCT, metrology, inspection | Low spectral power density | NKT Photonics, Leukos |
| XUV / EUV | HHG; laser-produced plasma (LPP); discharge-produced plasma; FEL | Wavelengths below ~120 nm, where no conventional laser exists | EUV lithography: hundreds of watts class in-band at 13.5 nm | EUV lithography, mask inspection, XUV science | All-reflective vacuum optics; low conversion efficiency | ASML (Cymer) LPP source driven by TRUMPF CO₂ amplifiers; research HHG sources |

## 3.8 Laser wavelengths: source, absorption and application map

Twenty-four wavelengths cover almost all industrial, semiconductor and medical practice. Read the table as: the application needs absorption in a specific material; the wavelength column gives the candidates; the source column gives the cost and maturity of each.

| Wavelength | Source technology | Absorbed well by | Advantages | Limitations | Typical applications | Typical industries |
|---|---|---|---|---|---|---|
| 193 nm | ArF excimer | Virtually all polymers, tissue (cornea), most glasses except UV-grade fused silica and CaF₂ | Photochemical ablation; highest-resolution optical lithography | O₂ absorption (purged paths), optics degradation, gas maintenance | DUV immersion lithography, refractive eye surgery, polymer micromachining | Semiconductor, medical |
| 248 nm | KrF excimer | Polymers, many glasses, GaN, SiC | Large-area UV; photosensitivity of Ge-doped silica | Excimer running costs | Lithography (mature nodes), fiber Bragg grating writing, laser lift-off | Semiconductor, telecom, display |
| 266 nm | 4th harmonic Nd (257 nm from Yb) | Polymers, glass (partly), GaN, SiC; higher metal absorption | Solid-state deep UV, no gas | W-level power; nonlinear-crystal lifetime | Wafer and mask inspection, sensitive-plastic marking, micro-drilling | Semiconductor, medical devices |
| 355 nm | 3rd harmonic Nd (343 nm from Yb) | Nearly all polymers (PI, FR-4, solder mask), Si (≈10 nm depth), glass (partly), ceramics | Small spot, short absorption depth, low HAZ, versatile | Cost per W 5–10× IR; optics and crystal ageing | FPC cutting, PCB depaneling, micro-via drilling, white/fine marking of plastics, glass marking, wafer grooving | EMS, semiconductor, display, medical |
| 375 nm | GaN diode | Photoresists, photopolymers | Compact, directly modulated | mW–W power | Maskless lithography, direct imaging, SLA 3D printing, fluorescence | PCB, research, AM |
| 405 nm | GaN (violet) diode | Photoresists, dry film, solder mask, photopolymers | Low cost, high reliability, array-scalable | Not a machining wavelength | Laser direct imaging (LDI) of PCB and substrates, SLA printing, bio-instruments | PCB, IC substrate, AM, life science |
| 515 nm | 2nd harmonic Yb (disk, fiber, ultrafast) | Cu (~40%), Au, Si (strong), many pigments; glass transparent | Copper welding without keyhole instability; smaller spot than 1030 nm | Conversion cost; lower power than IR | Cu hairpin, busbar and electronics welding; battery foil; ultrafast green PCB, Si and glass processing | EV, electronics, solar, semiconductor |
| 532 nm | 2nd harmonic Nd | Cu, Au, Si, haemoglobin, dark pigments | Mature DPSS; small spot | Lower power than IR | Si scribing, FPC and PCB marking, precious-metal micro-welding, retinal photocoagulation, Ti:sapphire pumping | Electronics, semiconductor, medical, science |
| 635 nm | Red diode | — (not a processing wavelength) | Visible, cheap | Low power | Aiming and alignment beams, distance sensors, photodynamic therapy | All (as auxiliary), medical |
| 660 nm | Red diode | — | Visible, cheap | Low power | Aiming beams, optical sensing, low-level laser therapy | Instrumentation, medical |
| 808 nm | GaAs/AlGaAs diode | Nd³⁺ absorption; Al interband peak (~13%); carbon black; melanin | Efficient Nd pumping; direct diode heating | Large BPP as direct source | Pumping Nd:YAG/YVO₄; hair removal; transmission plastic welding; hardening | Laser OEMs, medical-aesthetic, automotive |
| 915 nm | InGaAs diode | Yb³⁺ (broad band) | Pump wavelength tolerant to diode drift | Longer absorption fiber length | Pumping Yb fiber lasers; direct diode | Laser OEMs |
| 940 nm | InGaAs diode / VCSEL | Yb:YAG absorption; low solar background (atmospheric water dip) | Good for eye-safe-ish sensing with low sunlight noise | — | Yb:YAG disk pumping; 3D sensing and face recognition; plastic welding | Laser OEMs, consumer electronics |
| 976 nm | InGaAs diode (VBG-locked) | Yb³⁺ (narrow peak); Er³⁺ at ~980 nm | Shortest Yb fiber, lowest quantum defect | Needs wavelength stabilisation | Pumping Yb and Er fiber lasers; direct soldering and welding | Laser OEMs, telecom, electronics |
| 1030 nm | Yb:YAG disk, Yb fiber, Yb ultrafast | Metals (steel ~35%), dark polymers; Si weakly | Base wavelength for high-power ultrafast and disk | Cu and Al reflect; glass transparent (needs nonlinear absorption) | Ultrafast micromachining, disk welding and cutting | All metalworking, semiconductor, display |
| 1064 nm | Nd:YAG/YVO₄; Yb fiber Q-switched and MOPA | Metals, dark and additive-doped plastics, ceramics (partly); Si weakly | The reference marking wavelength; huge ecosystem | Poor on clear plastics, Cu, glass | Marking, engraving, resistor trimming, drilling, cleaning | Universal |
| 1070 nm | Yb CW fiber (1060–1080 nm) | Metals | Lowest cost per kW; best efficiency; fiber delivery | Cu/Al reflectivity and back-reflection; keyhole spatter on Cu | Sheet and plate cutting, keyhole welding, cladding, hardening, LPBF metal AM | Sheet metal, automotive, EV, energy, AM |
| 1550 nm | Er fiber, InGaAsP diodes | Water (moderate), some polymers weakly; Si transparent | Eye-safer (higher MPE), low-loss telecom band | Lower efficiency; weak material absorption | Telecom, LiDAR, rangefinding, fiber sensing, Si-transparent inspection | Telecom, automotive, defence |
| 1940 nm | Tm fiber | Water (strong), clear polymers (C–H overtones) | Welds transparent plastics without absorbers; precise soft-tissue cutting | Water vapour absorption in air paths | Transparent polymer welding, medical lithotripsy and cutting, Ho pumping | Medical devices, packaging, automotive lighting |
| 2 µm (2.05–2.1 µm) | Ho:YAG, Ho fiber, Tm-pumped Ho | Water, polymers | Silica-fiber-deliverable medical wavelength | Low efficiency (lamp Ho:YAG) | Urology lithotripsy, orthopaedics, wind and CO₂ LiDAR, OPO pumping | Medical, defence, sensing |
| 2.94 µm | Er:YAG | Water (absorption peak, ~1 µm penetration), hydroxyapatite | Very shallow, clean tissue ablation | Needs articulated arm or special fibers | Dental hard tissue, skin resurfacing | Medical, dental |
| 3–5 µm | OPO, QCL, ICL, Fe:ZnSe, Er:ZBLAN (~2.8 µm) | C–H stretch band (3.3–3.5 µm) of polymers; gases (CH₄, CO₂ 4.26 µm, CO 4.6 µm) | Molecular selectivity; atmospheric window | Cost, low power | Gas sensing and spectroscopy, IR countermeasures, selective polymer processing (research) | Environmental, oil and gas, defence, research |
| 9.3 µm | CO₂ (line-selected / isotopic) | Very strongly by PCB solder mask, polyimide, PET, glass; tooth enamel | ~12% smaller spot than 10.6 µm and shallower absorption: finer marks, less substrate damage | Few suppliers offer it; slightly lower power | PCB DataMatrix marking, PCB via drilling, polymer films, dental hard tissue | EMS, packaging, dental |
| 10.6 µm | CO₂ (standard) | Nearly all organics, glass, ceramics, water, wood, paper, textiles; metals reflect ~98% when cold | Cheap high power at long wave; very broad non-metal compatibility | Mirror-only delivery; larger spot; ZnSe optics | Cutting acrylic, wood, textile, film and paper; packaging coding; glass and ceramic scribing; soft-tissue surgery; legacy steel cutting | Packaging, signage, textile, electronics, automotive interiors, medical |
