---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 5
part_title: "Part III — Wafer manufacturing"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part III — Wafer manufacturing

## Chapter 5 — Crystal growth

L1 summary. Polysilicon chunks are melted and regrown as a single, dislocation-free crystal — an ingot up to ~2 m long and 300 mm in diameter. Czochralski (CZ) growth makes the vast majority of IC wafers; Float Zone (FZ) makes ultra-low-oxygen crystals for power and detectors. Five companies supply most of the world’s silicon wafers.

### 5.1 Czochralski (CZ) process

| Element | Function / typical range |
|---|---|
| Crucible | Fused silica (quartz) in a graphite susceptor; dissolves slowly into the melt — the source of oxygen in CZ Si |
| Melt | Si melts at 1 414 °C; charge for 300 mm ingot is several hundred kg |
| Seed | Small single-crystal bar with the target orientation, (100) for CMOS |
| Dash neck | Thin (~3–5 mm) fast-pulled neck lets dislocations grow out — the Dash technique |
| Pull rate | ~0.5–1.5 mm/min for the body; pull rate / thermal gradient (V/G) controls point-defect type |
| Rotation | Seed and crucible counter-rotate, a few to ~20 rpm, to homogenise temperature and dopant |
| Magnetic field (MCZ) | Horizontal or cusp field suppresses melt convection — standard for 300 mm to control oxygen and uniformity |
| Atmosphere | Argon at reduced pressure; carries away SiO |
| Dopant introduction | B, P, As or Sb added to the melt; segregation makes dopant concentration rise along the ingot |

Dopant segregation (L3). Dopant incorporates into the solid at a fraction k₀ of its melt concentration (k₀ ≈ 0.8 for B, 0.35 for P, 0.3 for As, 0.023 for Sb). As the melt depletes, concentration rises along the ingot:

C_s=k_0 C_0 (1-f)^(k_0-1)

where f is the fraction solidified. This is why resistivity varies from seed to tail and why wafers are sorted into resistivity bins.

Crystal defects (L3). The ratio V/G decides whether vacancies or interstitials dominate. Vacancy-rich crystals form voids (COPs, crystal-originated particles); interstitial-rich crystals form dislocation loops. Modern “perfect” or near-defect-free 300 mm crystals are grown in a narrow V/G window — a key competitive know-how of wafer makers.

### 5.2 Float Zone (FZ) process

A polysilicon rod is passed through an RF induction coil that melts a narrow zone; the zone travels along the rod and recrystallises behind it on a seed. No crucible touches the melt.

|  | CZ | FZ |
|---|---|---|
| Oxygen | ~10¹⁷–10¹⁸ cm⁻³ | < 10¹⁶ cm⁻³ |
| Max diameter | 300 mm (450 mm demonstrated) | Up to ~200 mm |
| Resistivity | Up to ~100 Ω·cm typical | Up to > 1 000 Ω·cm |
| Mechanical strength | Higher (oxygen pins dislocations) | Lower |
| Uses | Logic, memory, most ICs | IGBTs, thyristors, power diodes, radiation detectors, RF substrates |
| Doping | Melt doping | Gas doping or neutron transmutation doping (NTD) for extreme uniformity |

### 5.3 Wafer diameters

| Diameter | Thickness (typ.) | Status | Typical use today |
|---|---|---|---|
| 100 mm (4”) | ~525 µm | Legacy / compound | GaAs, InP, SiC R&D, MEMS, universities |
| 150 mm (6”) | ~675 µm | Mature | Power discretes, SiC mainstream, GaAs, MEMS, analog |
| 200 mm (8”) | ~725 µm | Mature, capacity in demand | Analog, power, MCU, sensors, MEMS, mature-node logic; SiC transitioning here |
| 300 mm (12”) | ~775 µm | Mainstream leading edge | Logic, DRAM, NAND, CIS, and increasingly mature nodes and power |
| 450 mm | ~925 µm | Abandoned (industry consortium work ended in mid-2010s) | None in production |

Area scales with diameter squared: 300 mm offers ~2.25× the area of 200 mm, lowering cost per die by ~20–40 % for the same process — but only if the tool set and volume justify it. 450 mm stalled because equipment makers could not recover the development cost across so few potential customers.

### 5.4 Suppliers

Silicon wafer supply is concentrated. Major producers: Shin-Etsu Chemical (Japan), SUMCO (Japan), GlobalWafers (Taiwan; includes former SunEdison/MEMC), Siltronic (Germany), SK siltron (Korea). Chinese producers (e.g., NSIG, Zhonghuan/TCL) are expanding, particularly in 300 mm. Crystal-puller equipment is often built in-house by wafer makers; external suppliers include PVA TePla (Germany) and several Chinese puller makers (e.g., Jingsheng).

## Chapter 6 — Ingot to wafer

L1 summary. The ingot is ground, sliced, lapped or ground flat, etched, polished to atomic smoothness, cleaned, inspected and shipped in sealed front-opening shipping boxes. Flatness at the level of tens of nanometres across 300 mm is the key output — lithography depth of focus depends on it.

| # | Step | What happens | Equipment | Key parameters / notes |
|---|---|---|---|---|
| 1 | Ingot inspection | X-ray orientation, resistivity profile, dislocation check | X-ray diffractometer, four-point probe | Out-of-spec sections cut away |
| 2 | Cropping | Remove seed and tail cones; cut into blocks | Band saw / diamond saw | Blocks sorted by resistivity |
| 3 | Diameter grinding | Grind to exact diameter | Cylindrical grinder | ±0.2 mm tolerance typical |
| 4 | Orientation flat / notch | Flat for ≤ 150 mm; notch for 200/300 mm | Grinder, X-ray alignment | Marks crystal direction for lithography and dicing alignment |
| 5 | Wire sawing | Multi-wire saw slices hundreds of wafers at once | Multi-wire saw (diamond wire or slurry) | Kerf loss ~150–250 µm per cut for IC wafers; controls warp and saw marks |
| 6 | Edge grinding | Round and profile edge | Edge grinder | Prevents chipping, epi crown, resist bead |
| 7 | Lapping / grinding | Remove saw damage, set parallelism | Double-side lapper or double-side grinder | Sets TTV foundation |
| 8 | Etching | Chemically remove mechanically damaged layer | Acid (HF/HNO₃) or alkaline (KOH) etch baths | Removes subsurface damage |
| 9 | Polishing | Double-side polish (DSP) then final touch polish | DSP and single-side CMP tools | Colloidal silica slurry; roughness to sub-nm |
| 10 | Cleaning | RCA-type and advanced cleans | Wet benches, single-wafer cleaners | Particles, metals, organics |
| 11 | Inspection | Geometry, surface particles, metals | Laser surface scanners, capacitive/interferometric flatness gauges | Particles > ~20–30 nm counted on 300 mm prime wafers |
| 12 | Packaging | Load into FOSB, sealed in bags | Automated packers | Shipped as prime, test or monitor wafers |

Optional value-add steps: epitaxial wafers (a doped single-crystal Si layer grown on top — standard for many logic, power and CIS wafers), SOI wafers (silicon-on-insulator, e.g., Smart Cut™ technology, Soitec), annealed wafers (surface defect-free zone), and backside poly/oxide seals.

### 6.1 Wafer quality metrics

| Metric | Definition | Why it matters |
|---|---|---|
| TTV (total thickness variation) | Max minus min thickness across the wafer | Chucking flatness, CMP uniformity |
| Bow | Deviation of the median surface centre from a reference plane | Handling, lithography focus |
| Warp | Max minus min of the median surface relative to reference plane | Handling, chucking, overlay |
| Site flatness (SFQR/SBIR) | Flatness within lithography-field-sized sites | Depth of focus at each exposure field |
| Nanotopography | Height variation at mm-scale wavelengths | Directly transfers into CMP thickness variation |
| Surface roughness (Ra/RMS) | Atomic-scale roughness, sub-nm on prime wafers | Gate oxide integrity |
| LPD (light-point defects) | Particles and pits detected by laser scatter | Yield killers |
| Metallic contamination | Surface metals, typically < 10¹⁰ atoms/cm² | Leakage, lifetime |
| Oxygen content / BMD | Interstitial oxygen and bulk micro-defect density | Intrinsic gettering, wafer strength |

Typical defects: saw marks, edge chips, slip lines (thermal stress), COPs, haze, residual subsurface damage, contamination.

Cost drivers: polysilicon, crucibles, diamond wire and slurry, polishing consumables, energy, yield loss from kerf and breakage, and — dominating at 300 mm — the know-how to hold flatness and defect specs.

Localization considerations. Wafer manufacturing is a mid-capex, high-know-how business with a 1–3 year customer qualification per product. Entry points for new regions include reclaim wafers (reprocessing used test wafers), test/monitor wafers, and smaller-diameter or SiC wafering services, before prime 300 mm.

Emerging: SiC wafering with laser-based slicing (e.g., DISCO’s KABRA process) to cut kerf loss on expensive SiC boules; engineered substrates (SOI variants, GaN-on-Si, bonded SiC).

Key takeaways — Part III

CZ makes almost all IC wafers; FZ serves power and detectors.

300 mm is the leading-edge standard; 200 mm remains critical for analog, power and sensors; 450 mm is dead for now.

Flatness and defect control — not slicing — are the core competencies of wafer makers.

Glossary terms introduced: CZ, MCZ, FZ, NTD, Dash neck, segregation coefficient, COP, V/G, notch, wire saw, kerf, lapping, DSP, TTV, bow, warp, SFQR, nanotopography, LPD, FOSB, epi wafer, SOI, reclaim wafer.
