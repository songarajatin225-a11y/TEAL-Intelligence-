---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 6
part_title: "Part V — Laser Optics"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part V — Laser Optics

Optics are chosen by wavelength first (the material must transmit or reflect it), by power and pulse regime second (damage threshold and thermal lensing), and by geometry last. At kilowatt power, absorption of a few hundred ppm in a lens or a dirty protective window becomes watts of heat, a millimetre of focal shift and a failed process.

## 5.1 Optical components

| Component | Function | Typical materials | Key specifications | Where used |
|---|---|---|---|---|
| Mirrors | Fold, steer and reflect beams | Dielectric HR on fused silica; Au/Ag/Cu/Mo metal; Si, SiC or Be scanner substrates | Reflectivity at λ and angle, flatness (λ/10), LIDT, polarisation | Beam paths, scanners, resonators, CO₂ flying optics |
| Lenses | Focus and collimate | Fused silica, BK7, ZnSe, Ge, CaF₂ | f, clear aperture, surface form, coating | Focusing heads, collimators, relays |
| Windows / cover slides | Seal and protect optics from spatter and fume | Fused silica, sapphire, ZnSe | Parallelism, AR coating, LIDT | Process heads, scanners, enclosures (consumable) |
| Beam splitters | Split power or wavelength | Plate, cube, dichroic | Split ratio, polarisation behaviour | Power monitoring, coaxial cameras, pyrometers |
| Polarisers | Select one polarisation | Thin-film plate, Glan-laser prism, wire-grid (IR) | Extinction ratio, LIDT | Power attenuators, harmonic stages, isolators |
| Waveplates / retarders | Rotate or convert polarisation | Crystal quartz (zero-order), phase-retarding mirrors (CO₂) | Retardance at λ | λ/2 rotation; λ/4 linear→circular for CO₂ cutting |
| Prisms | Deflect, disperse, reshape | Fused silica, CaF₂ | Dispersion, angle | Pulse compression, anamorphic diode-beam shaping |
| Cylindrical lenses | Focus in one axis | Fused silica, S-TIH | Focal length per axis | Diode fast-axis collimation (FAC), line beams |
| Aspheric lenses | Aberration-free focusing with one element | Moulded glass, fused silica | Surface form error | Fiber and diode collimators, high-NA focusing |
| Collimators | Convert divergent fiber output to parallel beam | Fused silica lens groups | f (typically 50–200 mm), NA acceptance, water cooling | Cutting and welding heads, scanners |
| Beam expanders | Enlarge beam to reduce focused spot and divergence | Galilean (no internal focus) or Keplerian | Magnification (2–10×), fixed, zoom or motorised | Marking, micromachining, scanners |
| Spatial filters | Remove high-order spatial noise | Lens + pinhole + lens | Pinhole size ~1.5–2× focused spot | Ultrafast, metrology, CO₂ beam clean-up |
| F-theta lenses | Flat-field scan lens whose image height = f·θ | Fused silica (UV–NIR), ZnSe/Ge (CO₂) | f, field, spot size, distortion, entrance pupil | Galvo marking, scanning, micromachining |
| Telecentric F-theta | Chief ray normal to work surface across the field | Fused silica | Telecentricity error (< ~1–3°); lens diameter > field | Via drilling, deep engraving, coaxial vision, stitching |
| Achromatic optics | Bring two or more wavelengths to one focus | Doublets, triplets | Focal shift between wavelengths | Process + aiming beam, coaxial cameras |
| Diffractive optical elements (DOEs) | Shape the beam by phase modulation | Fused silica, ZnSe | Efficiency, zero-order, wavelength and input tolerance | Top-hat, multi-spot, ring, line (→ §5.4) |

## 5.2 Coatings

Energy balance at any optic: R + T + A + S = 1 (reflection, transmission, absorption, scatter). Uncoated fused silica reflects ~3.5% per surface; ZnSe (n ≈ 2.4) ~17%; germanium (n ≈ 4) ~36%. Coatings are therefore not optional.

| Coating | Performance (≈) | Use | Note |
|---|---|---|---|
| V-coat AR | R < 0.25% per surface at one λ | Lenses and windows for a single laser line | Lowest loss |
| Broadband AR | R < 0.5–1% across a band | Multi-wavelength, laser + camera | Higher loss at the laser line |
| Dielectric HR (quarter-wave stack) | R > 99.5–99.9% | Resonators, fold and scanner mirrors | Angle- and polarisation-dependent |
| Protected gold | R > 98% at 10.6 µm | CO₂ mirrors | Soft |
| Protected / enhanced silver | R > 97% vis–NIR | Broadband mirrors | Tarnishes if unprotected |
| Enhanced aluminium | R ~90% UV | UV mirrors | Lower LIDT |
| Partial reflector | Specified R | Output couplers | Tolerance ±0.5–2% |
| Dichroic | Reflect process λ, transmit visible | Coaxial vision, pyrometry | Edge steepness matters |

Deposition process matters: ion-beam sputtered (IBS) and magnetron coatings are dense, low-loss, stable with humidity and have high LIDT; e-beam evaporated coatings are cheaper but porous and can shift spectrally. At 10 kW, 50 ppm absorption is 0.5 W deposited in the optic.

## 5.3 Damage threshold, absorption and thermal lensing

Laser-induced damage threshold (LIDT) is measured under ISO 21254 and is meaningful only with its conditions: wavelength, pulse duration, repetition rate, spot size and test method. Pulsed LIDT is quoted as fluence (J/cm²); CW LIDT as linear power density (W/cm or kW/cm), because thermal damage depends on beam diameter.

Below ~10 ps, damage is driven by multiphoton and avalanche ionisation and the √τ law fails. Apply at least a 2× safety factor to catalogue LIDT, which is often measured on small, pristine spots. In factories, contamination — spatter, fume condensate, fingerprints, dust — causes far more optic failures than intrinsic damage.

Thermal lensing. Absorbed power creates a radial temperature gradient; the refractive index changes with temperature (dn/dT) and the optic bulges, forming a weak positive lens. The effective focal length scales as:

K is thermal conductivity. Low absorption, low dn/dT and high K minimise it: fused silica (dn/dT ≈ 1 × 10⁻⁵ /K) is the standard for kW NIR optics; ZnSe (≈ 6 × 10⁻⁵ /K) is acceptable at CO₂ powers with cooling; germanium (≈ 4 × 10⁻⁴ /K) also suffers thermal runaway as its absorption rises with temperature. In multi-kW cutting and welding heads, a contaminated protective window can shift focus by a millimetre or more; countermeasures are low-OH fused silica, water-cooled mounts, window monitoring sensors and automatic focus-shift compensation.

## 5.4 Beam shaping and diffractive optics

| Technique | Principle | Output | Uses | Constraints |
|---|---|---|---|---|
| DOE top-hat | Phase microstructure redistributes a Gaussian | Uniform square or round spot | Ablation, thin-film removal, annealing, soldering | Needs specified input diameter, M² < ~1.3, precise centring; works in a design focal plane |
| DOE multi-spot | Diffractive fan-out | 2 to hundreds of beamlets | Parallel drilling, patterning, solar scribing | Uniformity and zero-order suppression |
| Ring / donut (DOE, axicon or ring-core fiber) | Energy moved to an annulus, often with a centre spot | Ring or core+ring | Welding with less spatter, cutting edge quality | Reduced peak intensity |
| Axicon (Bessel beam) | Conical wavefront forms a long, narrow line focus | Needle-like focus 0.1–several mm long | Glass and sapphire cutting, high-aspect via drilling | Side-lobes carry energy |
| Homogenisers (microlens arrays) | Split and overlap beamlets | Uniform line or field | Excimer annealing, LLO, diode surface treatment | Works best with low-coherence beams |
| Spatial light modulator (SLM) | Programmable phase mask (LCoS) | Any pattern, switchable in ms | Research, parallel ultrafast processing | Limited average power handling, slow refresh |

## 5.5 Optical materials

| Material | Transmission range (≈) | Index (≈) | Strengths | Typical uses | Cautions |
|---|---|---|---|---|---|
| Fused silica (UV grade) | 0.18–2.1 µm (IR grade to ~3.5 µm) | 1.45 at 1064 nm | Very low absorption and expansion, high LIDT | F-theta lenses, windows, collimators and focus lenses 193–1080 nm | UV grade has OH absorption bands (1.38, 2.2, 2.7 µm) |
| N-BK7 | 0.35–2.0 µm | 1.51 at 1064 nm | Low cost, easy to polish | Low-power visible/NIR optics, aiming paths | Higher absorption, lower LIDT; unsuitable for UV or kW |
| CaF₂ | 0.13–9 µm | 1.43 | Deep-UV and IR transparent, low dispersion | 157/193 nm optics, IR windows, broadband | Soft, thermal-shock sensitive, costly |
| ZnSe | 0.6–16 µm | 2.40 at 10.6 µm | Very low absorption at 10.6 µm; passes red aiming beams | CO₂ lenses, windows, output couplers | Soft; toxic dust and decomposition products; high Fresnel loss uncoated |
| Sapphire | 0.17–5.5 µm | 1.75 at 1064 nm | Extremely hard, high thermal conductivity | Protective windows in harsh environments, UV windows | Birefringent; hard to polish |
| Silicon | 1.2–7 µm | 3.42 | Light, high conductivity, stiff | CO₂ mirror substrates, MWIR lenses, galvo mirrors | Opaque below 1.1 µm; not a 10.6 µm transmissive material |
| Germanium | 2–12 µm | 4.0 | High index, LWIR lens designs | Thermal-imaging lenses, some CO₂ optics | Thermal runaway above ~40–100 °C; high Fresnel loss |
| Copper / molybdenum | Reflective | — | Water-coolable (Cu), abrasion-resistant (Mo) | High-power CO₂ mirrors | Cu needs coating; Mo lower R |
| Crystal quartz | 0.2–2.5 µm | 1.54 | Birefringent | Waveplates | Orientation-sensitive |
| LBO, BBO, KTP, CLBO | UV–NIR | — | Nonlinear | Harmonic generation (532, 355, 266 nm) | Degradation in UV, humidity (CLBO) |

Wavelength compatibility (✓ standard use; △ special grade or with care; ✗ not usable in transmission):

| Material | 193 nm | 248 nm | 266 nm | 355 nm | 532 nm | 1064 nm | 1550 nm | 2 µm | 2.94 µm | 10.6 µm |
|---|---|---|---|---|---|---|---|---|---|---|
| Fused silica | △ excimer grade | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | △ IR grade | △ IR grade | ✗ |
| N-BK7 | ✗ | ✗ | ✗ | △ | ✓ | ✓ | ✓ | △ | ✗ | ✗ |
| CaF₂ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Sapphire | △ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| ZnSe | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Silicon | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | △ mirror substrate |
| Germanium | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
