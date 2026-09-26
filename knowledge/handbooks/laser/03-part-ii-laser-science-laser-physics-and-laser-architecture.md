---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 3
part_title: "Part II — Laser Science: Laser Physics and Laser Architecture"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part II — Laser Science: Laser Physics and Laser Architecture

A laser is an optical amplifier (a gain medium with more atoms up than down) placed inside a feedback loop (a resonator), powered by a pump. Every industrial laser — from a 5 mW diode to a 30 kW fiber source — is a variation of that architecture, and its pulse format is set by how gain and loss are switched in time.

## 2.1 Absorption, spontaneous emission and stimulated emission

| Process | What happens | Rate depends on | Photon produced |
|---|---|---|---|
| Absorption | Photon lifts an electron from level 1 to level 2 | Lower-level population N₁ × light intensity | None (photon consumed) |
| Spontaneous emission | Excited electron decays on its own | Upper-level population N₂ / lifetime | Random direction, phase and polarisation — ordinary light |
| Stimulated emission | Incoming photon triggers the decay | Upper-level population N₂ × light intensity | A clone: same frequency, phase, direction and polarisation |

The ν³ factor means spontaneous emission competes ever harder at short wavelengths. That is the physical reason UV, X-ray and attosecond sources need enormous pump power or indirect routes (harmonics, plasmas, accelerators).

## 2.2 Population inversion and level schemes

Net gain requires N₂ > N₁ (weighted by degeneracy): population inversion. In a two-level system optical pumping can at best equalise the populations (transparency), so practical lasers use three or four levels.

Four-level scheme (Nd:YAG at 1064 nm): the lower laser level empties in nanoseconds, so inversion is easy and threshold is low. Three-level (ruby): the lower laser level is the ground state, so over half the ions must be pumped. Quasi-three-level (Yb at 1030 nm, Er at 1550 nm): the lower level is thermally populated, so these lasers need high pump intensity and good cooling, but reward it with very low heat load.

Quantum defect — the fraction of pump photon energy lost as heat — is the key efficiency and thermal-management number:

| Gain medium | Pump → laser | Quantum defect | Consequence |
|---|---|---|---|
| Yb (fiber or YAG) | 976 → 1030 nm | 5.2% | Very low heat; basis of kW fiber and disk lasers |
| Yb fiber | 915 → 1070 nm | 14.5% | Broad pump band eases diode wavelength control |
| Nd:YAG / Nd:YVO₄ | 808 → 1064 nm | 24% | More heat; thermal lensing limits rod power |
| Nd:YVO₄ (in-band) | 880–888 → 1064 nm | ≈17% | Used in high-power DPSS to cut heat |
| Er fiber | 980 → 1550 nm | 37% | Telecom amplifiers; low power efficiency |
| Er fiber (in-band) | 1480 → 1550 nm | 4.5% | High-power Er amplifiers |
| Tm fiber | 793 → 1940 nm | 59% nominal | “Two-for-one” cross-relaxation yields up to two laser ions per pump photon, lifting practical efficiency |
| Ho (in-band) | 1940 → 2100 nm | 7.6% | Tm-pumped Ho for 2.1 µm |

## 2.3 Metastable states, pumping and gain

A metastable upper level (long lifetime τ) stores energy, which sets how much a Q-switched laser can release in one pulse.

| Medium | Upper-state lifetime (≈) | Practical effect |
|---|---|---|
| Er:silica fiber | ~10 ms | Excellent storage; low-noise amplifiers |
| Ruby | ~3 ms | Historic high-energy pulses |
| Yb:YAG / Yb:silica | ~0.8–1 ms | Large storage for amplifiers |
| Nd:YAG | ~230 µs | High-energy Q-switched pulses at low rep rate |
| Nd:YVO₄ | ~100 µs | Higher gain, better at high rep rates (marking, micromachining) |
| Ti:sapphire | ~3 µs | Too short for lamp or CW storage; pumped by pulsed green lasers |
| Semiconductor (carriers) | ~1 ns | No storage; modulated directly by current |

Pumping mechanisms: optical (flash lamps, laser diodes — now dominant), electrical discharge (DC or RF in gas lasers), current injection (diodes), chemical reaction (HF/DF and oxygen-iodine lasers, defence), electron beams and accelerators (excimer e-beam pumping, free-electron lasers). Optical parametric oscillators produce gain without inversion by splitting a pump photon in a nonlinear crystal.

Gain saturation is why amplifiers stop scaling linearly and why pulse energy extraction is efficient only near the saturation fluence hν/σ.

## 2.4 The optical cavity, threshold and oscillation

Light bouncing between the mirrors is amplified on every pass. Oscillation starts when round-trip gain equals round-trip loss:

Cavity losses: output coupling (the useful loss), mirror absorption and scatter, diffraction at apertures, intracavity components (Q-switch, polariser), and reabsorption in quasi-three-level media. High-gain media need only weak feedback; low-gain media need nearly perfect mirrors.

| Laser | Output-coupler reflectivity (≈) | Reason |
|---|---|---|
| He-Ne | 98–99.5% | Very low gain per pass |
| Nd:YAG / Nd:YVO₄ DPSS | 70–95% | Moderate gain |
| Sealed CO₂ | 70–95% (partially reflecting ZnSe) | Moderate gain; slab types use unstable resonators |
| Yb fiber oscillator | ~4–15% (fiber Bragg grating or cleaved facet) | Very high gain over metres of fiber |
| Laser diode | ~1–10% front facet | Very high gain, µm-scale cavity |

Resonator stability (spherical mirrors, radii R₁ and R₂, spacing L): stable if 0 ≤ g₁g₂ ≤ 1, where g = 1 − L/R. Stable resonators give good beams from small apertures. Unstable resonators extract power from large, high-gain volumes (CO₂ slab, excimer, high-energy solid-state) with acceptable beam quality.

## 2.5 Modes, coherence, monochromaticity, directionality and brightness

Longitudinal modes are the standing-wave frequencies the cavity allows, spaced by the free spectral range. That spacing is also the pulse repetition rate of a mode-locked laser (→ §2.8).

Examples: 0.5 m free-space cavity → 300 MHz; 10 m fiber ring or linear cavity (n = 1.45) → ~10 MHz; 1 mm diode chip (n ≈ 3.5) → ~43 GHz.

Transverse modes (TEMₘₙ) are the cross-sectional intensity patterns. TEM₀₀ is the Gaussian fundamental with the best focusability; higher-order modes and multimode mixtures raise M² (→ §4.2). A step-index fiber is single-mode when its V-number is below 2.405.

Coherence. Temporal coherence is phase correlation along the beam, measured by coherence length Lc; spatial coherence is correlation across the beam, and a beam with M² ≈ 1 is fully spatially coherent.

| Source | Linewidth (≈) | Coherence length (≈) |
|---|---|---|
| Single-frequency DFB / NPRO laser | kHz–MHz | 100 m to km |
| Multi-mode He-Ne | ~1.5 GHz | ~0.2 m |
| Multi-kW Yb fiber laser | 2–5 nm | ~0.3 mm |
| 100 fs pulse at 1030 nm | ~10 nm | ~0.1 mm |
| White LED | ~30–100 nm | ~5–10 µm |
| Sunlight | broadband | ~1 µm |

Monochromaticity comes from gain bandwidth plus cavity filtering. Directionality: far-field half-angle divergence θ ≈ M²λ/(πw₀); a He-Ne with a 0.4 mm waist diverges only ~0.5 mrad. Brightness (radiance) combines power with focusability:

A 1 kW single-mode fiber laser at 1.07 µm has B ≈ 9 × 10¹⁰ W/(cm²·sr), roughly 4 × 10⁷ times the radiance of the Sun’s surface. Brightness, not power, is what lets a laser cut at a 300 mm working distance or weld remotely through a scanner.

## 2.6 Ordinary light vs laser light

| Property | Incandescent lamp / LED | Laser | Why it matters in manufacturing |
|---|---|---|---|
| Emission process | Spontaneous | Stimulated | Photons share phase and direction |
| Spectrum | Broad (tens to hundreds of nm) | Narrow (pm to a few nm; ultrafast tens of nm) | Wavelength can be matched to material absorption |
| Divergence | Radiates into a hemisphere | mrad or less | Energy delivered over metres with little loss |
| Spatial coherence | Very low | High (M² ≈ 1–1.5 for many sources) | Focusable to µm spots |
| Achievable intensity | ~10²–10³ W/cm² focused | 10⁶–10¹⁴ W/cm² | Melting, vaporisation, nonlinear absorption |
| Temporal control | ms at best | CW down to femtoseconds | Controls heat-affected zone |
| Polarisation | Random | Often linear, controllable | Absorption, cutting quality, harmonic generation |

## 2.7 Generic laser architecture

| Block | Function | Industrial examples | Key engineering concerns |
|---|---|---|---|
| Power source | Converts mains to regulated electrical drive | Diode current drivers, RF generators (CO₂), HV supplies (excimer) | Wall-plug efficiency, ripple, modulation bandwidth, EMC |
| Pump source | Delivers energy to the gain medium | 915/976 nm diode modules, flash lamps, RF or DC discharge | Wavelength locking, lifetime, spectral match to absorption |
| Gain medium | Stores energy and amplifies light | Yb-doped fiber, Nd:YVO₄ crystal, CO₂ gas mix, InGaAs quantum wells | Heat removal, doping, damage, nonlinear effects |
| Resonator | Provides feedback and selects modes | Mirrors, fiber Bragg gratings, cleaved facets | Alignment stability, mode control, back-reflection sensitivity |
| Beam extraction | Couples power out | Output coupler, FBG, facet, polariser, Q-switch | Coupling ratio, isolation from back-reflection |
| Beam conditioning | Shapes the beam for use | Isolator, collimator, harmonic generator, beam expander, pulse picker | Pointing stability, polarisation, M² preservation |
| Beam delivery | Moves the beam to the workpiece | Process fiber, mirrors, articulated arm | Losses, bend limits, damage, safety (→ Part VI) |
| Focusing | Concentrates the beam | F-theta lens, focusing lens, scanner | Spot size, depth of focus, field, thermal focus shift (→ Parts IV, VII) |
| Process | Energy meets material | Kerf, weld pool, ablation crater | Absorption, gas, fume, monitoring (→ Parts IX, X) |

## 2.8 Operating modes and pulse architectures

| Mode | How it works | Pulse duration | Repetition rate | Typical pulse energy | Industrial use |
|---|---|---|---|---|---|
| Continuous wave (CW) | Constant pump and output | — | — | — | Cutting, keyhole welding, cladding, hardening |
| Modulated CW / QCW | CW source switched or driven with overdrive; QCW fiber gives ~10× average power as peak | 10 µs–100 ms | Hz–kHz | mJ–tens of J | Spot and seam welding, drilling, soldering |
| Q-switched | Loss held high while inversion builds, then switched low (acousto-optic, electro-optic or saturable absorber) | ~1–300 ns | 1–500 kHz | µJ–J | Marking, engraving, drilling, cleaning |
| Gain-switched | Pump pulsed faster than the cavity can respond | ~10 ps–1 ns | kHz–GHz | pJ–nJ | Seeds for fiber amplifiers, LiDAR |
| Mode-locked | Longitudinal modes phase-locked (SESAM, Kerr lens, NALM) | ~10 fs–100 ps | ~10 MHz–GHz (= cavity FSR) | nJ | Oscillators for ultrafast amplifiers, metrology |
| MOPA | Low-power seed with the desired pulse shape, amplified by fiber stages | ~1–2000 ns (seed-defined) | Single shot–MHz | µJ–mJ | Fiber marking with selectable pulse width, colour marking, cleaning |
| Regenerative amplifier | Pockels cell traps a seed pulse for tens of round trips in an amplifier cavity | fs–ps | kHz–MHz | µJ–mJ | Ultrafast micromachining sources |
| Fiber amplifier | Seed amplified in core- or cladding-pumped doped fiber | Any | Any | Limited by peak power in fiber | Most modern industrial pulsed sources |

A Q-switched laser’s pulse energy falls as repetition rate rises, because the gain medium no longer has time to refill between pulses; pulses also lengthen.

For Nd:YVO₄ (τ ≈ 100 µs), pulse energy at 100 kHz is only about 10% of its low-rep-rate value. Fiber MOPA sources decouple pulse width and shape from repetition rate, which is why they dominate flexible marking.

Fiber amplifiers are limited by nonlinear effects in the small core — stimulated Raman and Brillouin scattering, self-phase modulation — and by transverse mode instability at kW average power. Large-mode-area (LMA) fibers, chirped-pulse amplification (→ §10.15) and coherent combining push those limits.

## 2.9 Pulse parameters

| Parameter | Symbol | Unit | Definition |
|---|---|---|---|
| Pulse energy (energy per pulse) | Eₚ | J | Energy in one pulse |
| Pulse duration / pulse width | τ | s | Usually full width at half maximum (FWHM) |
| Repetition rate | f | Hz | Pulses per second |
| Average power | P_avg | W | Eₚ × f |
| Peak power | P_peak | W | ≈ Eₚ/τ × shape factor |
| Duty cycle | D | — | τ × f (fraction of time the laser is on) |
| Pulse shape | — | — | Temporal profile: Gaussian, sech², square, tailored (MOPA) |
| Fluence | F | J/cm² | Energy per unit area |
| Intensity (irradiance) | I | W/cm² | Power per unit area |

| Worked example | Eₚ | τ | f | P_avg | P_peak (≈) | Peak fluence (≈) |
|---|---|---|---|---|---|---|
| 20 W MOPA fiber marker, long pulse | 0.2 mJ | 100 ns | 100 kHz | 20 W | 2 kW | 57 J/cm² (w₀ = 15 µm) |
| Same laser, short pulse | 33 µJ | 4 ns | 600 kHz | 20 W | 8 kW | 9.4 J/cm² (w₀ = 15 µm) |
| 50 W picosecond micromachining | 50 µJ | 10 ps | 1 MHz | 50 W | 4.7 MW | 5.1 J/cm² (w₀ = 25 µm) |
| 20 W femtosecond glass processing | 100 µJ | 300 fs | 200 kHz | 20 W | 310 MW | 16 J/cm², ~5 × 10¹³ W/cm² (w₀ = 20 µm) |
| 150 W QCW fiber spot welding | 7.5 J | 5 ms | 20 Hz | 150 W | 1.5 kW | — |

The duty cycle of the 100 ns marker is 1%: the laser emits for only 10 ms each second, at 100× its average power. Pulse overlap example: v = 1000 mm/s, f = 100 kHz and d = 30 µm give 10 µm pulse spacing and 67% overlap.
