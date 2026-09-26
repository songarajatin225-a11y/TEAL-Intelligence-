---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 24
part_title: "Part XXIII — Economics and Product Management"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XXIII — Economics and Product Management

The laser source is the most visible cost in a laser machine but rarely the largest share of what the customer pays over its life; cost per good part is set by cycle time, uptime, yield and consumables as much as by capex. Product decisions should therefore run from the customer’s part and volume, through a proven process window, to a machine whose cost structure is known before design freeze.

## 23.1 Machine cost structure and illustrative BOMs

Shares of material and conversion cost (ex-works, excluding margin). These are illustrative engineering estimates for planning, not market data; validate against actual quotations.

| Cost block | Fiber marking workstation (20–50 W) | CO₂ in-line PCB marker (with vision, conveyor) | 6 kW flatbed fiber cutter | Battery module welding cell | Ultrafast micromachining station |
|---|---|---|---|---|---|
| Laser source | 30–45% | 15–25% | 25–35% | 15–25% | 40–55% |
| Optics (expander, lenses, windows) | 3–5% | 3–5% | 5–8% (cutting head) | 5–10% (heads, OCT) | 5–8% |
| Galvo / scanner + controller | 10–15% | 10–15% | — | 5–10% | 8–12% |
| Motion (stages, gantry, robot) | 3–6% (Z axis) | 10–15% (conveyor, axes) | 15–20% (drives, motors, CNC) | 15–20% | 10–15% (air-bearing stages) |
| Vision and sensors | 0–8% | 10–15% | 2–4% | 5–10% | 4–6% |
| Mechanical (frame, enclosure, fixtures) | 10–15% | 10–15% | 20–25% | 10–15% (fixtures, tooling) | 5–10% (granite base) |
| Electrical (PLC, PSU, panel) | 6–10% | 8–10% | 6–8% | 6–8% | 4–6% |
| Software and MES interface | 2–5% | 5–8% | 3–5% | 4–6% | 3–5% |
| Safety (Class 1 enclosure, interlocks, shutter) | 4–8% | 4–6% | 5–8% | 4–6% | 3–5% |
| Chiller, extraction, utilities | 3–6% | 3–5% | 6–10% | 4–6% | 3–5% |
| Assembly, test and FAT | 5–8% | 5–8% | 4–6% | 6–8% | 4–6% |
| Engineering (NRE per machine) | 2–5% | 4–8% | 2–4% | 6–12% (custom) | 3–6% |
| Installation and SAT | 1–2% | 2–4% | 2–4% | 3–5% | 2–3% |

Patterns worth remembering: the more standard the product, the higher the source share; the more automated and customised the cell, the more cost moves into motion, fixtures, vision and engineering.

## 23.2 CAPEX, OPEX and cost per part

| OPEX element | What drives it | Notes |
|---|---|---|
| Electricity | Wall-plug efficiency, chiller, extraction, idle load | Fiber 35–50% vs CO₂ 10–20% wall-plug efficiency |
| Process gases | N₂/O₂/Ar consumption | Dominant OPEX item in high-pressure N₂ cutting |
| Consumables | Protective windows, nozzles, filters, lamps (legacy), fixtures | Track per 1000 parts |
| Maintenance and service | Preventive maintenance, calibration, contracts | Often budgeted at ~3–5% of capex per year |
| Spare parts | Critical spares stock (heads, windows, scanners, drives) | Lead time risk for imported parts |
| Labour | Operator, set-up, quality checks | Automation reduces direct labour |
| Lifetime | Source life (tens of thousands of hours for fiber/diode; RF CO₂ tube refills; UV crystal shifts) | Drives replacement capex |

Worked example (illustrative, INR). CO₂ in-line PCB marker: capex ₹45 lakh, 7 years, 10% cost of capital (CRF 0.205 → ₹9.2 lakh/yr). OPEX: electricity 2 kW × 6000 h × ₹9/kWh = ₹1.1 lakh; consumables and filters ₹1.5 lakh; service at 4% of capex ₹1.8 lakh; 0.25 operator FTE ₹1.5 lakh — total ₹5.9 lakh/yr. Throughput at 6 s per panel, 6000 h, OEE 80%, yield 99.5% ≈ 2.87 million panels/yr. Cost per panel ≈ ₹0.53; cost per mark = cost per panel ÷ marks per panel. Sensitivity: cycle time and OEE move the answer far more than a ±20% change in laser price.

## 23.3 Laser process selection framework

| Question | Rule |
|---|---|
| Does the material absorb the wavelength? | If < ~10% (Cu, Al, Au at 1 µm; clear polymers at 1 µm), change wavelength or create absorption (keyhole, oxide, additive, nonlinear) |
| How much HAZ is acceptable? | Compare the thermal diffusion length (§9.4) with the allowed HAZ: CW/QCW for mm, ns for µm–tens of µm, ps/fs for sub-µm |
| What feature size is needed? | Spot ≈ ½–⅓ of the smallest feature; check λ, M² and focal length (§4.5) |
| What depth of focus does the part allow? | Part flatness and fixture tolerance must sit inside the ±5% spot band (§4.3) |
| What throughput is needed? | Average power sets removal or joining rate; check the scanner, motion and handling cycle too |
| What does it cost per part? | Compare technologies on §23.2 cost per part, not on source price |

| Example | Constraints | Selection |
|---|---|---|
| 0.3 mm Cu busbar to Ni-plated steel cylindrical can | No can breach, low spatter, low IMC | Green CW or IR fiber with wobble/ring beam; OCT depth monitoring; tight fixture clamping |
| DataMatrix on green solder mask, 0.25 mm modules | No copper exposure, high grade, in-line | CO₂ 9.3 µm, 10–30 W, galvo with f ≈ 100 mm, vision grading |
| Cut 50 µm polyimide coverlay over copper | No copper damage, clean edge | UV 355 nm ns or ps, galvo, multi-pass low fluence |
| 3 mm stainless sheet, bright oxide-free edge | Speed, edge colour | 3–6 kW CW fiber, N₂ fusion cutting, 100 µm fiber, zoom head |
| UDI on Ti implant | Survive passivation and autoclave, no corrosion | ps or MOPA ns black marking; validated recipe |
| 0.55 mm cover-glass contour | No chipping, arbitrary shape | ps/fs filamentation or Bessel beam + cleave |

## 23.4 Product management framework

| Stage | Key outputs | Gate question |
|---|---|---|
| Customer requirement | Part drawings, materials, volumes, quality criteria, line context | Is the problem specific and valuable enough to solve? |
| URS (user requirement specification) | Measurable requirements: cycle time, quality, uptime, footprint, utilities, standards, data | Are all requirements testable at FAT/SAT? |
| Technical specification | Machine concept, laser and optics choice, motion, vision, controls, safety concept | Does every URS line map to a design feature? |
| Application feasibility | Literature, absorption check, sample tests (→ §23.5) | Is there a plausible process window? |
| POC | Process window on real parts; quality evidence; cycle-time estimate | Is the process capable (Cpk) and fast enough? |
| Prototype | Working machine or cell | Does the integrated system meet the spec? |
| DFM | Manufacturable, serviceable design; standard parts | Can it be built repeatably at target cost? |
| BOM | Costed bill of materials with make/buy decisions | Is material cost within target? |
| Supplier selection and RFQ | Qualified suppliers, quotations, lead times, second sources | Are supply risks (lead time, single source, export control) acceptable? |
| Costing | Full cost: material, labour, overhead, warranty, service | Does price minus cost meet margin? |
| Validation | Process validation, reliability runs, safety verification | Are quality and safety demonstrated with data? |
| FAT (factory acceptance test) | Acceptance at the builder’s site against the URS | Customer sign-off to ship |
| SAT (site acceptance test) | Acceptance in the customer’s line, with real parts and interfaces | Customer sign-off to produce |
| Ramp-up | Yield learning, OEE improvement, training | Is the line at target OEE and yield? |
| Service | Preventive maintenance, spares, remote diagnostics, upgrades | Is uptime meeting contract; is service profitable? |

What differs by product type

| Product | Decisive requirements and risks |
|---|---|
| Laser source | Power stability, beam quality, pulse control, lifetime (MTBF), back-reflection tolerance, diode supply, thermal design, safety classification, OEM interface standards |
| Laser marking machine | Mark quality and grade across materials, cycle time, software and variable data, vision reading, Class 1 enclosure, cost |
| Laser welding machine | Penetration and porosity control, spatter, fixture and gap tolerance, process monitoring (OCT, photodiodes), shielding gas, traceability per weld |
| Laser soldering machine | Closed-loop temperature control, wire or ball feeding, vision alignment, flux management, board handling (SMEMA), per-joint data |
| Laser cutting machine | Speed and edge quality by thickness, gas cost, automation (load/unload), CNC and nesting software, machine dynamics, footprint |
| Laser cleaning machine | Removal rate (m²/h), substrate safety window, portability or robot integration, fume and particle extraction, operator safety for hand-held units |
| Semiconductor laser equipment | Particle and contamination control, cleanroom class, wafer handling (EFEM, FOUPs), SEMI S2/S8 safety and ergonomics, SECS/GEM, µm-level repeatability, yield impact data |

## 23.5 Application feasibility study template

| Section | Content to record |
|---|---|
| 1. Customer requirement | Part, drawing reference, feature to produce, acceptance criteria, annual volume, takt time |
| 2. Material | Composition, temper, coatings, thickness, surface state, supplier variation |
| 3. Process | Candidate processes and mechanisms; why the laser is preferred over alternatives |
| 4. Laser selection | λ, pulse regime, power, beam quality; absorption and HAZ reasoning |
| 5. Optics | Spot size, focal length, field, DOF, head or scanner type |
| 6. Parameter development | Factors and ranges, DOE design, responses measured (→ §23.6) |
| 7. POC | Samples produced, conditions, photos, cross-sections, measurements |
| 8. Quality validation | Metrology method, sample size, results vs criteria, capability (Cpk), durability tests |
| 9. Cycle time | Process time + handling + vision + indexing; bottleneck |
| 10. Machine design | Concept architecture, automation level, footprint, utilities |
| 11. Cost | Estimated machine price and OPEX; cost per part |
| 12. ROI | Savings vs current process, payback, NPV/IRR |
| 13. Production | Risks, open questions, next-stage plan and decision requested |

## 23.6 Laser parameter development and DOE

| Parameter | Primary effect | Coupled with | Typical watch-out |
|---|---|---|---|
| Power | Energy delivered per second | Speed (energy per length P/v) | Power at the workpiece, not the set-point — measure it |
| Speed | Interaction time, overlap | Power, frequency | Scanner dynamics at corners |
| Frequency (repetition rate) | Pulse energy and overlap | Power, speed | Q-switched pulses weaken and lengthen at high rate |
| Pulse width | Heat diffusion, peak power | Pulse energy | Changes the mechanism (§9.4) |
| Pulse energy | Fluence per pulse | Spot size | Optimum near e² × threshold for ablation |
| Hatch / line spacing | Uniformity, depth, time | Spot size | Too wide → stripes; too narrow → overheating |
| Focus / defocus | Spot size, intensity, DOF | All intensity-related effects | The most common cause of drift and escapes |
| Number of passes | Depth, heat accumulation | Energy per pass | Registration and cooling between passes |
| Scan strategy | Heat distribution, edge quality | Hatch, passes | Cross-hatch and interlacing for uniformity |
| Gas type and flow | Melt removal, shielding, oxidation | Nozzle geometry, stand-off | Turbulence and contamination |
| Spot size | Intensity, feature size | Focal length, expander | Changes every fluence-based optimum |

Work in derived quantities so results transfer between machines: fluence (J/cm²), intensity (W/cm²), energy per unit length (J/mm), pulse and hatch overlap (%), and dwell time.

DOE methodology

Define responses and specifications — e.g., mark contrast and ISO/IEC 29158 grade; weld penetration, porosity and strength; kerf width and dross.

Screen factors with a fractional factorial or Plackett–Burman design to find the 3–4 factors that matter.

Optimise with a response-surface design (central composite or Box–Behnken) over those factors; fit models; locate the optimum and the robust plateau.

Test robustness: vary noise factors (material lot, surface state, focus ±, part position) and choose settings where responses are flat.

Confirm and prove capability: confirmation runs, then a capability study (Cpk ≥ 1.33 typical) on production-representative parts.

Lock and monitor: freeze the recipe, set process-monitoring limits and periodic power and focus checks (§12.5).

Example — black annealing on 316L with a MOPA fiber laser: factors power (40–100%), pulse width (50–350 ns), frequency (20–200 kHz), speed (100–1000 mm/s) and hatch (5–30 µm); responses contrast, surface roughness, corrosion after passivation and cycle time. A 2⁵⁻¹ screening design typically narrows the problem to pulse width, speed and hatch, which are then optimised with a central composite design.
