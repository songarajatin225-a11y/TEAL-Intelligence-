---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 25
part_title: "Part XXIV — Safety, Standards, Quality and Metrology"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XXIV — Safety, Standards, Quality and Metrology

Almost every industrial laser source is Class 4; the machine around it is designed to be a Class 1 product, so that no one is exposed during normal operation. Safety is achieved by engineering (enclosure, interlocks, shutters), then administration (training, procedures, a laser safety officer), and only last by personal protective equipment. Quality rests on the same discipline applied to measurement: what is not measured at the workpiece cannot be controlled.

## 24.1 Laser classes (IEC 60825-1)

IEC 60825-1:2014 (Edition 3) classifies laser products from 180 nm to 1 mm and introduced Class 1C (IEC webstore); check for later amendments before certifying a product. Accessible emission limits (AELs) depend on wavelength and exposure time; the power figures below are the familiar CW visible-wavelength values.

| Class | Meaning | Typical AEL (CW, visible) | Examples | Key requirements |
|---|---|---|---|---|
| 1 | Safe under reasonably foreseeable use, including enclosed high-power lasers | Class 1 limit | Enclosed marking, cutting and welding machines; CD players | Enclosure and interlocks must keep it Class 1; service may expose Class 4 |
| 1C | Safe when used in contact with the target (e.g., skin); eye exposure prevented by engineering | — | Contact aesthetic devices | Contact sensing interlocks |
| 1M | Safe unless viewed with optical instruments | — | Large-diameter or diverging beams, some telecom | Warnings about optical aids |
| 2 | Visible; blink reflex protects for accidental exposure | ≤ 1 mW | Pointers, alignment lasers, barcode scanners | Label; do not stare |
| 2M | As Class 2, but hazardous with optical instruments | — | Line generators with large beams | Warnings about optical aids |
| 3R | Low risk; direct intrabeam viewing potentially hazardous | ≤ 5 mW | Some pointers, aiming beams | Avoid direct viewing |
| 3B | Direct beam and specular reflections hazardous to the eye; diffuse reflections usually not | ≤ 500 mW | Low-power lab lasers, some medical and display lasers | Key switch, remote interlock, emission indicator, beam stop |
| 4 | Direct, specular and diffuse reflections hazardous; skin and fire hazards | > 500 mW | Virtually all processing sources | All Class 3B controls plus engineering controls, LSO, controlled area |

## 24.2 Hazards

| Hazard | Mechanism | Controls |
|---|---|---|
| Eye — 400–1400 nm (retinal hazard region) | The eye focuses the beam on the retina, raising irradiance by roughly 10⁵; NIR is invisible, so there is no blink response | Enclosure, interlocks, wavelength-specific eyewear with adequate OD, beam stops |
| Eye — UV and IR > 1400 nm | Absorbed in cornea and lens: photokeratitis, cataract, thermal burns | Enclosure, UV/IR-rated windows and eyewear |
| Skin | Thermal burns (IR, visible); photochemical damage (UV) | Enclosure, gloves and covering during service |
| Reflections | Metals produce specular reflections of the full beam; surfaces become mirrors when molten | Beam enclosure; no line-of-sight paths; matte, non-reflective internal surfaces |
| Fire | Class 4 beams ignite paper, plastics, solvents, fume-filter media | Non-combustible enclosures, spark arrestors, fire detection in extraction, housekeeping |
| Fume (laser-generated air contaminants) | Metal oxides, hexavalent chromium (stainless), HCN (polyurethane), HCl and chlorine compounds (PVC — do not laser-process), organic vapours, nanoparticles | Capture at source, filtration (HEPA + activated carbon), exposure monitoring, material approval lists |
| Electrical and high voltage | Excimer and DC CO₂ supplies (tens of kV), capacitor banks, high-current diode drivers | Interlocked covers, discharge procedures, lock-out/tag-out |
| Cooling systems | Water leaks near high voltage; condensation on optics; chiller failure overheats sources | Flow and temperature interlocks, dew-point control, leak detection |
| Collateral radiation | Blue light and UV from welding plasma; soft X-rays from ultrafast processing at very high intensity and repetition rate | Filtered windows; X-ray measurement and shielding where required (regulated in some jurisdictions) |
| Mechanical | Moving axes, robots, pinch points | Guarding, safe speeds, STO, risk assessment |

Eyewear optical density and hazard distance are calculated, not guessed:

H₀ is the worst-case exposure, MPE the maximum permissible exposure (IEC 60825-1 / ANSI Z136.1 tables), φ the beam divergence, a the exit beam diameter and P the power. This handbook does not describe bypassing or defeating safety systems; service work on open Class 4 systems follows documented procedures under a laser safety officer.

## 24.3 Relevant standards

| Standard | Scope |
|---|---|
| IEC 60825-1 | Safety of laser products: classification, AELs, engineering and labelling requirements |
| IEC 60825-4 | Laser guards (enclosure and window performance) |
| IEC TR 60825-14 | User’s guide to safe use of laser products |
| ISO 11553-1 / -2 | Safety of laser processing machines; hand-held laser processing devices |
| ISO 12100 | Machinery risk assessment and risk reduction |
| ISO 13849-1 / -2; IEC 62061 | Functional safety of machine control systems (performance levels, SIL) |
| IEC 60204-1 | Electrical equipment of machines |
| ISO 14119; ISO 14120 | Interlocking devices; guards |
| EN 207 / EN 208 | Laser protective eyewear; alignment eyewear |
| ANSI Z136.1; ANSI Z136.9 | US safe use of lasers (laser safety officer, controls); lasers in manufacturing environments |
| US FDA 21 CFR 1040.10 / 1040.11 | US laser product performance standard; FDA guidance permits conformance with IEC 60825-1 and IEC 60601-2-22 for most requirements |
| IEC 60601-2-22 | Medical laser equipment |
| SEMI S2 / S8 | EHS and ergonomics guidelines for semiconductor manufacturing equipment |
| ISO 11145 | Laser vocabulary and symbols |
| ISO 11146 | Beam widths, divergence angles and M² |
| ISO 11554 | Test methods for laser power, energy and temporal characteristics |
| ISO 13694 | Power (energy) density distribution |
| ISO 11670 | Beam positional (pointing) stability |
| ISO 21254 | Laser-induced damage threshold testing |
| ISO 9013 | Quality of thermally cut surfaces |
| ISO 13919-1 | Quality levels for electron- and laser-beam welds in steel |
| ISO 15609-4 / ISO 15614-11 | Laser welding procedure specification; procedure qualification for EB and laser welding |

## 24.4 Quality and metrology

| Quantity | Instruments | Principle | Practical notes |
|---|---|---|---|
| Power | Thermopile sensors (mW–kW), photodiode sensors (nW–mW), water-flow calorimeters (multi-kW) | Heat flow or photocurrent | Measure after the final optic, at the workpiece; typical uncertainty a few percent |
| Pulse energy | Pyroelectric sensors (µJ–J); photodiodes (nJ) | Pyroelectric charge per pulse | Check rep-rate and pulse-width limits of the sensor |
| Beam diameter and profile | CCD/CMOS beam profilers with attenuators or samplers; scanning slit / knife-edge; rotating-needle focus analysers for kW | Imaging or scanning apertures | Use D4σ (ISO 11146); high-power focus needs samplers or needle scanners |
| M² | Caustic measurement through focus | Fit of D4σ widths along z | ≥ 10 planes, about half within one Rayleigh length (ISO 11146) |
| Wavelength | Spectrometers, optical spectrum analysers, wavemeters | Grating or interferometric | Needed for harmonic, line-selected CO₂ and diode sources |
| Pulse duration | Fast photodiode + oscilloscope (ns); streak camera (ps); autocorrelator (fs–ps); FROG/SPIDER (full phase) | Direct detection or nonlinear correlation | Autocorrelation needs a pulse-shape assumption |
| Repetition rate | Photodiode + counter | Timing | Verify pulse-to-pulse energy stability too |
| Pointing stability | Quadrant cells, position-sensitive detectors, cameras | Centroid tracking | Measure over warm-up and temperature cycles (ISO 11670) |
| Focus position | Caustic analysers; camera focus routines; ramp or burn tests | Minimum spot or maximum intensity | Re-check after optics changes and at shift start for precision work |
| Optical surfaces and wavefront | Interferometers (Fizeau, Shack–Hartmann) | Interference, wavefront slope | Lens and mirror acceptance, thermal-lens studies |
| Process result | Microscopes, profilometers, cross-sections, CT, leak testers, code verifiers | Direct inspection | Tie metrology back to recipe version and machine data |

Production practice: daily or per-shift power verification at the workpiece, periodic focus and scanner-field checks, calibration records traceable to national standards, and measurement system analysis (gauge R&R) for the process results that release product.
