---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 5
part_title: "Part IV — Beam Engineering"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part IV — Beam Engineering

Focused spot size scales as M²λf/D and depth of focus as spot diameter squared divided by M²λ. Those two relationships, plus the fact that beam parameter product (BPP) is conserved through passive optics, decide lens choice, working distance, scanner size and much of machine cost.

## 4.1 The Gaussian beam

A TEM₀₀ laser beam has a Gaussian intensity profile that keeps its shape as it propagates; only its width and wavefront curvature change.

The 1/e² radius w contains 86.5% of the power. Beam-diameter conventions must be stated on every drawing and datasheet:

| Convention | Definition | Relation to 1/e² diameter (Gaussian) | Where used |
|---|---|---|---|
| 1/e² | Diameter where intensity falls to 13.5% of peak | 1.00 | Optics design, most datasheets |
| D4σ (second moment) | Four times the standard deviation of the intensity distribution | 1.00 (Gaussian only) | ISO 11146 standard for M² and non-Gaussian beams |
| FWHM | Full width at half maximum | 0.589 | Ultrafast and process papers |
| Knife-edge 10/90 | Distance between 10% and 90% transmitted power points | 0.64 | Quick lab measurements |

## 4.2 TEM modes and M²

Transverse electromagnetic modes TEMₘₙ (Hermite–Gaussian, rectangular symmetry) or LGₚₗ (Laguerre–Gaussian, cylindrical symmetry) describe beam cross-sections. TEM₀₀ is Gaussian; TEM₀₁* is the “donut”; multimode fibers emit a near-top-hat near-field made of hundreds of modes.

M² (beam propagation ratio, ISO 11146) compares a real beam with an ideal Gaussian of the same wavelength:

Why M² matters industrially — the fair comparison is at a fixed required spot size:

| For a required spot, higher M² means | Consequence |
|---|---|
| Depth of focus falls as 1/M² | Tighter height control; more sensitivity to part warpage |
| A faster focusing cone is needed | Larger optics, or a shorter working distance |
| Larger scanner apertures for the same field | Heavier mirrors, lower scan speed, higher cost |
| Lower brightness | Less capability for remote welding, thick-section cutting at long focal lengths |

For fixed optics, higher M² simply gives a larger spot (∝ M²).

## 4.3 Beam waist, Rayleigh range, divergence and depth of focus

The waist w₀ is the narrowest point. The Rayleigh range z_R is where the radius has grown by √2 (area doubled); far-field half-angle divergence is θ = M²λ/(πw₀). The textbook depth of focus 2z_R is usually too generous for processing; practitioners use a tolerance on spot growth:

So a marking lens with 2z_R = 1.8 mm holds spot size within ±5% over only about ±0.3 mm.

## 4.4 Numerical aperture, BPP, brightness and étendue

Étendue (≈ π²·BPP² for round beams) is conserved by lenses and mirrors: no passive optical system can make a beam more focusable. Combining incoherent beams (diode modules, multiple fiber oscillators) always increases étendue. This is why a multi-kW multimode fiber laser cannot be focused like a single-mode one, and why direct diodes are surface-processing tools.

| Source / delivery | M² or BPP (≈) | BPP (mm·mrad, ≈) | Comment |
|---|---|---|---|
| Single-mode Yb fiber, 1070 nm | M² 1.05 | 0.36 | Diffraction-limited |
| Ultrafast Yb, 1030 nm | M² 1.2 | 0.39 | Near-diffraction-limited |
| DPSS / MOPA ns, 1064 nm | M² 1.3–1.8 | 0.44–0.6 | Marking sources |
| CO₂, 10.6 µm | M² 1.1 | 3.7 | Perfect beam, but long λ gives a BPP similar to 100 µm-fiber delivery at 1 µm |
| Yb multimode, 50 µm delivery fiber | — | ~2 | Fine cutting, remote welding |
| Yb multimode, 100 µm delivery fiber | — | ~3.5–4 | Standard flat-sheet cutting |
| Yb multimode, 200 µm delivery fiber | — | ~8 | Thick plate, welding, cladding |
| Thin-disk, multi-kW | — | 2–8 | Welding, cutting |
| Direct diode, multi-kW | — | 10–100 | Hardening, cladding, brazing |
| Excimer | Rectangular, very high M² | — | Homogenised into lines or top-hats |

## 4.5 Spot size and depth of focus: design equations

Focusing a collimated beam of 1/e² diameter D with a lens of focal length f:

For a multimode fiber, the focus is an image of the fiber core:

Clear aperture rule: an aperture 1.5× the 1/e² beam diameter passes ~98.9% of a Gaussian beam; use ~2× on high-power paths to avoid clipping, diffraction ripple and heating of mounts.

## 4.6 Worked examples

| Case | Inputs | Spot d₀ (1/e²) | 2z_R | Engineering reading |
|---|---|---|---|---|
| Fiber marker, standard | λ 1.064 µm, M² 1.3, D 7 mm, f 160 mm | 40 µm | 1.8 mm | ~110 × 110 mm field; ±0.3 mm for ±5% spot stability |
| Fiber marker, 10 mm expander | same, D 10 mm | 28 µm | 0.9 mm | Finer marks, but half the focus tolerance |
| CO₂ PCB marker, 10.6 µm | M² 1.2, D 12 mm, f 100 mm | 135 µm | 2.3 mm | Sets minimum DataMatrix module (~0.2 mm class) |
| CO₂ PCB marker, 9.3 µm | same optics | 118 µm | 2.0 mm | 12% smaller spot, shallower absorption in solder mask |
| Fiber cutting head | 6 kW, 100 µm core, BPP 3.5, f_coll 100 mm, f_focus 200 mm | ~200 µm | ~5.7 mm | Peak intensity ≈ 1.9 × 10⁷ W/cm²; nozzle stand-off control essential |
| Ultrafast glass processing | λ 1.03 µm, M² 1.2, D 6 mm, f 50 mm | 13 µm | 0.22 mm | Tight focus; Bessel beams extend it for cutting (→ §25.2) |

Why brightness buys working distance. A remote-welding scanner needs a 150 µm spot at f = 450 mm. With a 50 µm fiber (BPP ≈ 2), magnification 3 means f_coll = 150 mm and a ~24 mm collimated beam: a standard 30 mm-aperture scanner. With a 100 µm fiber (BPP ≈ 3.5), magnification 1.5 means f_coll = 300 mm and a ~42 mm beam: large, slow, expensive mirrors. The lower-BPP source makes the whole machine smaller and faster.
