---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 28
part_title: "Part XXVII — Reference Tables and Troubleshooting"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XXVII — Reference Tables and Troubleshooting

This part collects quick-reference data and a symptom-driven troubleshooting guide. To avoid repetition, detailed reference tables stay where they are developed and are indexed here; three compact tables summarise the most-used numbers.

## 27.1 Quick reference

| Reference | Location |
|---|---|
| Laser types (specs, suppliers, architectures) | §3.2–3.7 |
| Wavelengths (24-line map) | §3.8 |
| Materials: absorption, thermal data | §9.2–9.4 |
| Processes (taxonomy and deep dives) | §10.1–10.15 |
| Applications by industry | Part XX |
| Optics and optical materials | §5.1, §5.5 |
| Galvos and scanners | §7.1–7.2 |
| Fibers and connectors | §6.3–6.4 |
| Process heads | §8.2 |
| Suppliers and components | §21.3–21.4 |
| Standards | §24.3 |

Laser families at a glance

| Family | λ | Average power (≈) | Pulse | Wall-plug efficiency (≈) | Beam quality | Relative cost per W | Sweet spot |
|---|---|---|---|---|---|---|---|
| CW fiber (Yb) | 1.07 µm | 0.1–30+ kW | CW, QCW | 35–50% | M² 1.05 to BPP ~20 | Lowest | Metal cutting and welding |
| ns fiber (Q-switched, MOPA) | 1.064 µm | 20–500 W | 2–2000 ns | 20–30% | M² 1.2–1.8 | Low | Marking, cleaning |
| CO₂ | 9.3–10.6 µm | 10 W–20 kW | CW, µs | 10–20% | M² ~1.1 | Low | Non-metals, PCB, packaging |
| DPSS UV / green | 355 / 532 nm | 3–100 W | 5–30 ns | ~5–10% (UV) | M² < 1.3 | High | Electronics micro-processing |
| Ultrafast | 1030 / 515 / 343 nm | 5–300 W | 0.2–50 ps | 10–20% | M² < 1.3 | Highest | Precision, transparent materials |
| Direct diode | 0.45 / 0.9x µm | 0.1–20+ kW | CW | 35–50% | BPP 10–100 | Low–moderate | Surfaces; Cu (blue) |
| Thin disk | 1.03 µm | 1 kW to multi-kW | CW | 25–35% | BPP 2–8 | Moderate | Welding, cutting |
| Excimer | 193–351 nm | W to ~1 kW | 10–30 ns | 1–3% | Homogenised | Very high | Lithography, ELA, LLO |

Typical average power by application

| Application | Power (≈) |
|---|---|
| Metal marking (fiber) | 20–100 W |
| PCB marking (CO₂) | 10–30 W |
| UV marking | 3–10 W |
| FPC / PCB cutting (UV) | 10–30 W |
| Ultrafast micromachining | 10–100 W |
| Laser soldering | 10–150 W |
| Electronics micro-welding (QCW, pulsed) | 50–500 W |
| Laser cleaning (pulsed) | 100 W–2 kW |
| Powder-bed AM (per laser) | 0.2–1 kW |
| Battery and hairpin welding | 1–6 kW |
| Remote body welding | 4–8 kW |
| Cladding / hardening | 2–10 kW / 2–20 kW |
| Sheet cutting / thick plate | 1–30 kW / 20–60+ kW |

Pulse-duration regimes

| Regime | Thermal diffusion length in steel (≈, §9.4) | Interaction | Typical processes |
|---|---|---|---|
| CW / ms | 0.1–1 mm | Heating, melting, keyhole | Cutting, welding, cladding, hardening, soldering |
| µs | ~10–50 µm | Melting and vaporisation | CO₂ marking and perforation, Er:YAG tissue ablation |
| ns | ~0.4–1.3 µm (10–100 ns) | Photothermal ablation | Marking, engraving, cleaning, micromachining, drilling |
| ps | ~10–100 nm | Near non-thermal ablation | Precision micromachining, glass, stents |
| fs | < ~10 nm (plus electron transport) | Non-thermal, nonlinear absorption | Transparent materials, medical, highest-quality micro-features |

## 27.2 Troubleshooting handbook

Work from the workpiece back to the source: measure power and focus at the workpiece first; most faults are optics contamination, focus, fixturing or recipe drift, not the laser.

| Symptom | Possible causes | Diagnostic | Corrective action |
|---|---|---|---|
| Low power | Dirty or damaged window/optics; contaminated fiber connector; source degradation (pump diodes); wrong recipe; chiller out of range | Measure at workpiece and at source output; inspect window and end-cap; read source logs and diode currents | Clean or replace optics; re-terminate or replace cable; service source; recalibrate power tables |
| Poor marking | Material lot or finish change; focus error; wrong pulse width or hatch | Parameter matrix on the same material; focus ramp test | Re-run DOE; adjust pulse width, hatch, defocus; tighten material specification |
| Uneven marking across the field | Part tilt or warpage; field curvature; scanner calibration; beam clipping at field edges | Mark a test grid; measure spot at corners; check flatness | Level the fixture; recalibrate; 3D scanner focus; correct expander size |
| Large spot | Focus error; wrong expander setting; clipping; thermal lensing; degraded M²; wrong fiber | Beam profiler or caustic measurement | Refocus; correct expander; clean optics; verify fiber and M² |
| Beam distortion | Misalignment; damaged or tilted optic (astigmatism); clipping; back-reflection damage | Profile near and far field along the path | Realign; replace optic; enlarge apertures |
| Lens damage | Contamination burn; spatter; exceeded LIDT; back-reflection | Inspect damage pattern (pits = spatter; central burn = absorption) | Clean-handling regime; cross-jet and protective windows; larger beam on optics; correct coatings |
| Fiber damage | Contamination at connection; back-reflection; bend below radius; cladding light; overpower | Fiber microscope inspection; back-reflection logs | Clean connection procedure; replace cable; back-reflection protection; re-route cable |
| Weld porosity | Keyhole instability; oil, moisture or oxide; Zn vapour; shielding problems; focus | X-ray/CT or cross-sections; process signals | Clean parts; correct gas flow and angle; wobble or ring beam; adjust speed and focus; vent Zn |
| Spatter | Excess intensity; unstable keyhole (Cu at IR); contamination; focus too tight | High-speed imaging; spatter counts | Ring beam, wobble, green or blue; power ramps; slight defocus |
| Cracks | Susceptible alloy (6xxx Al, some Ni alloys); restraint; fast cooling; brittle Al–Cu intermetallics | Metallography | Filler wire; pulse ramp-down; preheat; reduce restraint; minimise heat input for dissimilar joints |
| Poor penetration | Low power at workpiece; focus shift; excess speed; reflectivity; gap | Power check; cross-section; OCT depth | Restore power and focus; reduce speed; beam shaping or green |
| Excess HAZ | Too much heat input; long pulses; heat accumulation at high rep rate; wrong λ | Cross-section; thermal imaging | Shorter pulses; faster multi-pass with cooling; change wavelength |
| Burning | Excess fluence; dwell at vector starts and corners; focus | Inspect starts and corners | Tune delays or use skywriting; reduce power or raise speed |
| Charring (polymers, wood, PCB) | Thermal degradation; slow speed; no assist gas | Visual and cross-section | Faster multi-pass; air assist; UV or 9.3 µm; shorter pulses |
| Poor contrast (codes) | Mark mode unsuited to surface; reader lighting; surface finish | Verifier analysis of contrast and modulation | Change mark mode (anneal vs engrave vs ablate); adjust verifier lighting; surface preparation |
| Misalignment | Fixture wear; vision-to-scanner calibration drift; thermal drift; wrong offsets | Mark calibration grid; check transforms; measure datums | Recalibrate; stabilise temperature; maintain fixtures |
| Focus errors | Z drift; part height variation; thermal focus shift; wrong window thickness | Focus ramp test; height sensor data | Autofocus or height sensing; compensation tables; correct window; tighter fixture tolerances |
| Galvo distortion | Wrong correction file for lens; scanner drift or ageing; tuning | Grid measurement; scanner status | Load correct file and recalibrate; retune; warm-up routine; service scanner |
| Vision errors (no-reads, false rejects) | Ambient light; focus; reflections; mark contrast variation; calibration drift; dirty lens | Review failed images; check grade components | Enclosed strobe lighting; polarisers; re-teach models; clean optics; adapt mark for readability |
