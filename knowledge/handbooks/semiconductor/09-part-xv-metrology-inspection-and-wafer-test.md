---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 9
part_title: "Part XV — Metrology, inspection and wafer test"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XV — Metrology, inspection and wafer test

L1 summary. Fabs measure constantly because they cannot afford to find a problem after 1 000 steps. Metrology measures dimensions and film properties; inspection finds defects; review classifies them; wafer test (sort) proves each die works electrically. Together they are the feedback loop that drives yield. KLA is the largest process-control supplier.

## Chapter 20 — Metrology and inspection

| Measurement | What it measures | Technique / equipment | Typical precision need | Suppliers (examples) |
|---|---|---|---|---|
| Critical dimension (CD) | Line/space width, hole diameter | CD-SEM (top-down e-beam); optical CD (OCD) scatterometry | Sub-nm at leading edge | Hitachi High-Tech (CD-SEM), Applied Materials; KLA, Nova, Onto (OCD) |
| Overlay | Layer-to-layer alignment | Image-based and diffraction-based optical overlay; e-beam overlay | Low single-digit nm or better | KLA, ASML (YieldStar), Onto |
| Film thickness / optical constants | Film thickness, n and k | Spectroscopic ellipsometry, reflectometry, X-ray (XRR/XRF) | Å-level | KLA, Nova, Onto, Rigaku, Bruker |
| 3D profile | Sidewall angle, depth, shape | OCD scatterometry, AFM, X-ray (CD-SAXS), TEM (offline) | Sub-nm | Nova, KLA, Bruker (AFM), Park Systems |
| Wafer geometry | Bow, warp, flatness, nanotopography | Interferometric and capacitive gauges | nm-level | KLA, Tokyo Seimitsu |
| Surface / step height | Topography, roughness | Stylus profilometer, AFM, white-light interferometry | nm | KLA, Bruker, Park |
| Composition / contamination | Elements, dopant profile, metals | XPS, SIMS, TXRF, VPD-ICP-MS | ppm–ppt | Rigaku, Thermo Fisher, CAMECA |
| Electrical (inline) | Sheet resistance, C-V, leakage | Four-point probe, non-contact corona-Kelvin (e.g., Semilab), parametric test structures | — | KLA, Semilab, Onto |

Inspection categories

| Type | Detects | Sensitivity vs speed | Suppliers |
|---|---|---|---|
| Unpatterned (bare) wafer inspection | Particles, pits, haze | Laser scatter; very fast | KLA (Surfscan), Hitachi High-Tech, Lasertec |
| Brightfield patterned inspection | Pattern defects, bridges, missing features | High sensitivity, slower; broadband plasma light | KLA (dominant), Applied |
| Darkfield / laser-scatter patterned | Particles on patterned wafers | Faster, lower resolution | KLA, Hitachi High-Tech |
| E-beam inspection | Voltage-contrast (electrically open/short) and tiny physical defects | Highest resolution, slowest; multi-beam improving throughput | ASML (HMI), Applied, KLA |
| Defect review SEM (DR-SEM) | Images and classifies defects found by inspection | Per-defect | Applied, KLA, Hitachi High-Tech |
| Mask / reticle inspection | Reticle pattern defects, particles | Actinic (13.5 nm) and DUV | KLA, Lasertec (EUV actinic blank/pattern) |
| Macro / edge / backside inspection | Coating, edge chips, backside particles | Fast | KLA, Onto, Camtek |

How the loop works: inspection maps defect locations → sampling to review SEM → classification (particle, scratch, bridge, residue) → root cause to a tool/chamber → corrective action. APC uses metrology results to adjust the next lot’s recipe (e.g., dose correction for CD, alignment correction for overlay).

Economics: process control is often cited as roughly ~10–15 % of fab equipment spend; sampling strategy (how many wafers/sites per lot) trades cost against risk.

## Chapter 21 — Wafer testing (sort / probe)

| Element | Detail |
|---|---|
| Parametric test (PCM/WAT) | Measures transistors, resistors, capacitors built in the scribe lines; verifies the process is in spec before functional test |
| Wafer prober | Robot that aligns the wafer and steps each die under the probe card; temperature-controlled chucks (−40 to +150 °C for automotive) |
| Probe card | Custom array of needles/MEMS springs touching bond pads or bumps; thousands of probes for SoCs; a significant consumable cost |
| ATE (automatic test equipment) | Generates patterns and measures responses |
| Test program | Functional, structural (scan/ATPG, BIST), parametric, speed-binning |
| Output | Wafer map: bin codes per die (pass, fail categories, speed grades) |

Known good die (KGD). For single-die packages, some escapes at sort are caught at final test. For multi-die packages (HBM, chiplets, 2.5D/3D), one bad die scraps the whole expensive assembly, so sort must deliver known good die: higher test coverage, at-speed and sometimes burn-in at wafer level. The economics of chiplets depend on it.

Yield definitions (see Part XXIX): wafer sort yield = good die ÷ gross die on the wafer.

Localization considerations: probe-card repair/refurbishment, test program development, test-floor operations and test services are lower-capital entry points; ATE and advanced probe cards are high-barrier.

Key takeaways — Part XV

Metrology asks “is it the right size?”; inspection asks “is something wrong?”; sort asks “does it work?”.

Process control is a data business feeding APC and yield learning.

KGD is the enabling economic condition for chiplets and HBM.

Glossary terms introduced: metrology, CD-SEM, OCD, scatterometry, ellipsometry, overlay, brightfield/darkfield, e-beam inspection, voltage contrast, DR-SEM, actinic inspection, SIMS, TXRF, PCM/WAT, prober, probe card, ATE, ATPG, BIST, wafer map, bin, KGD.
