---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 2
part_title: "Part I — Physics: Understanding Light from First Principles"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part I — Physics: Understanding Light from First Principles

Light is a stream of energy quanta whose energy, E = hν = hc/λ, decides which material transitions it can drive. That one relationship explains most of laser processing: why CO₂ marks PCB solder mask, why 1064 nm passes through silicon, and why copper needs green or blue light.

## 1.1 Energy

Energy is the capacity to do work. Laser processing converts electrical energy into photons, delivers them to a point, and converts them into heat, bond breaking or electron excitation in the workpiece. Units: joule (J); electron-volt (1 eV = 1.602 × 10⁻¹⁹ J) at atomic scale. Power is energy per unit time (1 W = 1 J/s).

A laser’s value is not its energy but its concentration of energy. It concentrates in space (a 30 µm spot), in time (a 10 ps pulse) and in spectrum (one wavelength). The same 1 J delivered over 1 s warms a part; delivered in 10 ps into 30 µm it vaporises material without melting its surroundings.

## 1.2 Matter and the atom

Matter is built from atoms, ~0.1 nm across, each a nucleus (~10⁻¹⁵ m) surrounded by electrons. Optical and chemical behaviour is set almost entirely by the outer electrons.

| Particle | Charge | Relative mass | Role in laser technology |
|---|---|---|---|
| Proton | +1 | 1836 | Sets the element (atomic number Z) and hence its electron structure |
| Neutron | 0 | 1839 | Sets the isotope; minor optical effect (e.g., isotopic CO₂ shifts laser lines) |
| Electron | −1 | 1 | Absorbs and emits photons; carries heat and current in metals; its energy levels define laser transitions |

## 1.3 Electron energy levels

Electrons occupy discrete energy states. A photon is absorbed or emitted only when its energy matches the gap between two allowed states. Different physical systems give very different gaps, and therefore different wavelengths.

| System | Type of level | Energy scale | Photon region | Laser example |
|---|---|---|---|---|
| Inner-shell electrons | Atomic core levels | 0.1–100 keV | X-ray | X-ray free-electron laser |
| Outer electrons of atoms/ions | Electronic | 1–10 eV | UV–visible | He-Ne, Ar-ion, excimer |
| Rare-earth ions in crystal/glass | Shielded 4f levels | 0.5–1.5 eV | NIR–SWIR | Nd, Yb, Er, Tm, Ho |
| Transition-metal ions | 3d levels, broad vibronic bands | 1–2 eV | Red–NIR, tunable | Ti:sapphire, Cr:ZnSe |
| Semiconductor | Band gap (conduction–valence) | 0.1–3.5 eV | Mid-IR to UV | Laser diodes, VCSELs |
| Engineered quantum wells | Intersubband | 0.1–0.4 eV | 3–12 µm | Quantum cascade laser |
| Molecules | Vibrational | 0.05–0.5 eV | 2.5–25 µm | CO₂ (9–11 µm), CO (5–6 µm) |
| Molecules | Rotational | meV | Fine line structure | CO₂ P- and R-branch lines |

In solids, discrete atomic levels broaden into bands. Metals have a partly filled band of free electrons, so they reflect strongly across the IR. Semiconductors have a band gap Eg: photons with hν > Eg are absorbed, photons below it pass through. Wide-gap insulators (glass, sapphire) are transparent from the UV to the mid-IR. Rare-earth ions keep sharp, well-defined transitions even inside a host, which is why Nd³⁺, Yb³⁺ and Er³⁺ dominate solid-state and fiber lasers.

## 1.4 Quantum mechanics relevant to lasers

Five ideas carry the whole of laser physics:

Quantisation — states have discrete energies; transitions exchange ΔE = hν.

Lifetime and linewidth — an excited state decays in time τ; its spectral width is roughly Δν ≈ 1/(2πτ). Long-lived (metastable) states store energy for pulsed operation (→ §2.3).

Thermal population — at equilibrium, populations follow the Boltzmann distribution. At 300 K, kT ≈ 0.026 eV, so a level 1 eV up is essentially empty. Inversion must be forced by pumping.

Cross-section — σ (cm²) measures how strongly an ion or molecule absorbs or emits at a wavelength; gain and absorption both scale with σ × population.

Selection rules — not every pair of levels couples to light; allowed transitions are fast, forbidden ones slow (and often metastable).

## 1.5 The photon

A photon is the quantum of the electromagnetic field: zero rest mass, travelling at c, carrying energy, momentum and polarisation. Light behaves as a wave when it propagates (interference, diffraction — which set the minimum spot size) and as a particle when it exchanges energy with matter (absorption thresholds, photochemistry). Laser engineering uses both views constantly.

## 1.6 Photon energy, frequency and wavelength

In a medium of index n, speed and wavelength fall to c/n and λ/n; frequency is unchanged.

| Wavelength | Frequency | Photon energy | Photons/s per W | What it can do directly |
|---|---|---|---|---|
| 193 nm (ArF) | 1553 THz | 6.42 eV | 9.7 × 10¹⁷ | Breaks C–C, C–H and C=C bonds; absorbed by nearly all polymers |
| 248 nm (KrF) | 1209 THz | 5.00 eV | 1.25 × 10¹⁸ | Breaks C–C and C–H; above GaN and SiC band gaps |
| 266 nm (4ω Nd) | 1127 THz | 4.66 eV | 1.34 × 10¹⁸ | Breaks C–C and C–H; strong absorption in most organics |
| 355 nm (3ω Nd) | 845 THz | 3.49 eV | 1.79 × 10¹⁸ | Above GaN/SiC gaps; just below C–C bond energy — polymer processing is mainly photothermal with very shallow absorption |
| 532 nm (2ω Nd) | 564 THz | 2.33 eV | 2.68 × 10¹⁸ | Well above Si gap; absorbed by Cu and Au far better than 1 µm |
| 1064 nm (Nd) | 282 THz | 1.17 eV | 5.36 × 10¹⁸ | Barely above Si gap (1.12 eV): Si absorbs weakly |
| 1550 nm (Er) | 193 THz | 0.80 eV | 7.80 × 10¹⁸ | Below Si gap: Si is transparent |
| 10.6 µm (CO₂) | 28.3 THz | 0.117 eV | 5.34 × 10¹⁹ | Excites molecular vibrations: strong absorption in polymers, glass, ceramics, water |

Reference energies (≈): Si 1.12 eV (1107 nm edge); InP 1.34 eV; GaAs 1.42 eV (873 nm); 4H-SiC 3.26 eV (380 nm); GaN 3.4 eV (365 nm); diamond 5.5 eV; sapphire ~8.8 eV; fused silica ~9 eV. Bond energies: C–C 3.6 eV, C–O 3.7 eV, C–H 4.3 eV, Si–O 4.7 eV, O–H 4.8 eV, C–F 5.0 eV, C=C 6.4 eV.

Engineering note: “UV cold processing” at 355 nm is not pure bond-breaking. A single 3.49 eV photon cannot break a C–C bond; the benefit comes from absorption depths of ~0.1–1 µm, which confine heat, plus some photochemical and two-photon contribution. Predominantly photochemical ablation is a 193/248 nm phenomenon (→ §9.5).

## 1.7 Phase

Phase is the position within the wave cycle. Laser light has a fixed phase relationship across the beam and along it (coherence, → §2.5). Phase control underlies interferometry, holographic and diffractive beam shaping (→ §5.4), coherent beam combining and mode-locking (→ §2.8).

## 1.8 Polarisation

Polarisation is the direction of the electric field. Linear, circular, elliptical, radial and azimuthal states are used industrially. Reflection and absorption depend on it: at oblique incidence, p-polarised light (E in the plane of incidence) is absorbed more than s-polarised light by metals, peaking near grazing angles.

Practical consequences: a linearly polarised CO₂ beam cuts differently in X and Y, so cutting heads use circular polarisation; thin-film polarisers and waveplates control power and harmonic generation; radially polarised beams are studied for deep cutting and drilling. Multimode fiber-laser output is randomly polarised.

## 1.9 Photon momentum

1 kW absorbed exerts only 3.3 µN. Photon pressure matters in optical tweezers, laser cooling and precision metrology. In welding and drilling, the pressure that opens a keyhole is vapour recoil, not photon momentum — a frequent misconception.

## 1.10 Electromagnetic radiation, the spectrum and the laser wavelength map

Light is a coupled oscillation of electric and magnetic fields (Maxwell’s equations) travelling at c = 2.998 × 10⁸ m/s. Intensity and field strength are linked:

At 10¹⁴ W/cm² — reached by focused femtosecond pulses — E₀ ≈ 2.7 × 10¹⁰ V/m, about 5% of the field binding an electron in hydrogen. This is why ultrafast pulses can ionise “transparent” glass (→ §10.15).

| Region | Wavelength | Photon energy | Key laser lines | Source technologies | Industrial role |
|---|---|---|---|---|---|
| X-ray | 0.01–10 nm | 0.1–100 keV | — | XFEL, synchrotron, laser-plasma | Imaging, metrology, science; not machining |
| EUV | 10–121 nm | 10–124 eV | 13.5 nm | Laser-produced tin plasma (driven by high-power CO₂ lasers) | EUV lithography light source |
| VUV | 100–200 nm | 6–12 eV | 157 (F₂), 193 (ArF) | Excimer | DUV lithography, polymer micromachining; needs purged beam paths (O₂ absorbs below ~190 nm) |
| UV-C | 200–280 nm | 4.4–6.2 eV | 248 (KrF), 257, 266 | Excimer, 4th-harmonic DPSS/fiber | LLO, fine polymer and glass processing, inspection |
| UV-B | 280–315 nm | 3.9–4.4 eV | 308 (XeCl) | Excimer | Excimer laser annealing (LTPS displays), LLO |
| UV-A | 315–400 nm | 3.1–3.9 eV | 343, 351, 355, 375 | 3rd-harmonic DPSS/fiber, diodes | PCB/FPC cutting and drilling, marking, LDI, micro-machining |
| Visible | 400–780 nm | 1.6–3.1 eV | 405, 445–455, 515, 532, 633, 635–660 | GaN/InGaN diodes, 2nd-harmonic lasers, He-Ne | Cu/Au welding (blue, green), LDI (405), alignment, Si processing, displays |
| NIR (IR-A) | 780–1400 nm | 0.9–1.6 eV | 808, 915, 940, 976, 1030, 1064, 1070 | Diodes, Nd and Yb solid-state and fiber | The industrial workhorse: marking, cutting, welding, cladding, pumping |
| SWIR (IR-B) | 1.4–3 µm | 0.4–0.9 eV | 1550, 1940, 2050–2100, 2940 | Er, Tm, Ho fiber/solid-state; Er:YAG | Polymer welding, Si-transparent processing, LiDAR, telecom, medical |
| MWIR | 3–8 µm | 0.16–0.4 eV | 3–5 µm bands, 5–6 µm (CO) | OPO, Cr:ZnSe, ICL/QCL, CO | Gas sensing, spectroscopy, defence, polymer and glass research |
| LWIR | 8–15 µm | 0.08–0.16 eV | 9.3, 9.6, 10.2, 10.6 µm | CO₂, QCL | Polymers, glass, wood, textiles, PCB marking, packaging |
| Far-IR / THz | 15 µm–1 mm | < 0.08 eV | — | FEL, gas lasers, THz emitters | Spectroscopy, security imaging, science |

Band boundaries differ between standards (ISO 20473 for IR; CIE UV-A/B/C and IR-A/B/C are used in laser safety, → Part XXIV).

## 1.11 Why different wavelengths interact differently with different materials

A material absorbs a wavelength only if it has a mechanism that can accept that photon energy. Five mechanisms matter industrially.

| Mechanism | Materials | Wavelength dependence | Engineering consequence |
|---|---|---|---|
| Free-electron (Drude) absorption | Metals | Absorptance falls as λ rises; lower electrical conductivity absorbs more | Steel absorbs ~35% at 1 µm but ~5–10% at 10.6 µm; Cu and Al are poor absorbers in the IR |
| Interband transitions | Cu, Au (visible colour), semiconductors | Strong absorption above a threshold energy | Cu and Au absorb green/blue far better than NIR; Si absorbs below ~1.1 µm |
| Band-gap absorption | Semiconductors, dielectrics | Absorbed only if hν > Eg | Si transparent at 1.3–1.55 µm (stealth dicing, inspection); GaN and SiC absorb only in the UV |
| Molecular vibration | Polymers, glass, ceramics, water, wood | Resonant bands in the mid/long IR | CO₂ is absorbed by almost all non-metals; 2.94 µm matches the water peak |
| Nonlinear (multiphoton, avalanche) | Any material, including transparent ones | Needs ≳10¹² W/cm² (ultrafast pulses) | Glass and sapphire can be machined inside their volume |

In the infrared the free-electron trend has a compact form (Hagen–Rubens), with σₑ the electrical conductivity and ω the angular frequency:

It predicts ≈1.5% absorptance for copper and ≈9% for stainless steel at 10.6 µm, close to measured values for polished surfaces. Beyond the intrinsic mechanism, real absorption also depends on temperature (it rises as metals heat), surface roughness, oxide layers, angle of incidence, polarisation and, above ~10⁶ W/cm², on keyhole multiple reflection and plasma. Part IX develops this into quantitative selection rules.

Penetration depth δ = 1/α sets how deeply energy is deposited: ~10–20 nm in metals; in silicon ≈10 nm at 355 nm, ≈1 µm at 532 nm and ≈1 mm at 1064 nm.
