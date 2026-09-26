---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 36
part_title: "Part 28 — Laser equipment integration"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 28 — Laser equipment integration

A laser machine is a beam path plus the systems that keep it stable and safe: the source sets wavelength, power and pulse; the optics set spot size, depth of focus and field; the scanner sets speed; the chiller, fume extraction and enclosure make it run for years without drifting or hurting anyone. Calculate spot size, fluence, pulse overlap, field and heat load before choosing hardware — they decide whether the process window of Part 3 can be held.

### 28.1 Objective

Select and integrate laser source, beam delivery, scanning and focusing optics, cooling, fume extraction, controls and laser safety so the machine delivers the validated process window at rate, with Class 1 operation in production.

### 28.2 Engineering concept

*Figure 12. Laser equipment architecture · 6-element beam path, 4 supporting systems, Class 1 enclosure* — [Figure not transcribed; see source document]

The beam leaves the source, travels by fiber or mirrors, is collimated and expanded, steered by two galvo mirrors, and focused by an F-theta lens onto a flat field. A larger beam at the lens gives a smaller focused spot; a longer focal length gives a larger field but a larger spot and longer depth of focus. The controller gates the laser in step with the mirrors (Part 13).

### 28.3 Architecture — laser sources and applications

Typical, application-dependent choices; process trials decide.

| Source | Wavelength | Regimes | Strengths | Typical applications |
|---|---|---|---|---|
| Fiber, pulsed (Q-switched, MOPA) | ~1,064 nm | 10–200 W avg, ns pulses; MOPA gives adjustable pulse width | Robust, efficient, maintenance-light | Metal marking, colour marking on steel, black marks on anodized Al, cleaning |
| Fiber, CW (single-mode, multimode, ring/adjustable-mode) | ~1,070 nm | 0.5–20+ kW | High brightness, fiber delivery, spatter control with ring modes | Welding (busbars, tabs, cans), cutting |
| CO₂ | 10.6 µm (also 9.3 µm) | 10 W–kW | Absorbed by organics, glass, polymers | PCB solder-mask and paper marking, plastics, depaneling of some materials |
| UV DPSS | 355 nm | 3–30 W | Small spot, "cold" photochemical interaction | Fine PCB and plastic marking, flex cutting, semiconductor marking |
| Green | 532 nm | 5–50 W | Better absorption on copper and silicon | Copper welding (with IR hybrids), wafer marking |
| Ultrafast (ps, fs) | IR, green, UV | 10–100+ W | Minimal heat-affected zone | Glass and wafer dicing, micro-drilling, thin-film patterning |
| Diode (direct) | 800–980 nm | High power, low brightness | Efficient, compact | Soldering, plastic welding, heat treatment, cladding |

| Application | Key parameters | CTQs | Integration focus |
|---|---|---|---|
| Marking | Power, frequency, pulse width, speed, hatch, passes, focus | Contrast, code grade, depth | Part presentation, focus, fume, vision verification |
| Welding | Power profile, speed, spot, wobble or ring ratio, focus, shielding gas | Penetration, width, porosity, spatter, strength | Fit-up clamping, seam tracking, process monitoring, back-reflection protection |
| Cutting | Power, speed, assist gas and pressure, nozzle standoff | Kerf, dross, taper | Height sensing, gas supply, slag handling |
| Drilling | Pulse energy, repetition, trepanning path | Diameter, taper, recast | Beam quality, positioning, debris |
| Cleaning | Fluence, overlap, passes | Residue removal, no substrate damage | Standoff, ablation debris extraction |
| PCB processing | UV/CO₂ marking, depaneling | Legibility, no copper or component damage, debris | Fiducial vision, panel warp, cleanliness |
| Semiconductor | Wafer/package marking, grooving, dicing | Mark quality, chipping, particles | Cleanroom, SECS/GEM, handling (Part 29) |
| Battery | Tab and busbar welding, cleaning, marking | Joint resistance and strength, no cell damage | Clamping, monitoring, traceability (Part 30) |

### 28.4 Components

| Component | Function | Key specifications | Selection points |
|---|---|---|---|
| Laser source | Generates the beam | Wavelength, average and peak power, pulse energy and width, repetition rate, M², stability, interfaces | Match the absorption and interaction regime found in trials |
| Beam delivery | Carries beam to optics | Fiber core size, length, connector; or mirror path | Fiber for flexibility; protect against back-reflection |
| Collimator, beam expander | Sets beam diameter at the scanner | Expansion ratio, aperture, damage threshold | Expand to the largest beam the galvo aperture accepts for the smallest spot |
| Mirrors | Steer free-space beams | Coating for wavelength and power, flatness | Protect from contamination |
| Galvo scanner | Deflects beam in X and Y | Aperture, speed, repeatability, drift, digital protocol | Aperture vs beam size, drift vs error budget (Part 9) |
| Dynamic focus / Z-shifter | Moves the focal plane | Range, speed | For 3D parts or large fields |
| F-theta lens | Focuses onto a flat field | Focal length, field size, spot size, telecentric or not, damage threshold | Telecentric for height variation and through-holes |
| Protective window | Protects the lens from spatter and fume | Material, coating, change method | Quick-change; air knife with clean dry air (Part 14) |
| Chiller | Removes heat from source and optics | Capacity, temperature stability, flow, water quality | Size with margin; separate circuits if temperatures differ |
| Fume extraction | Removes particles and gases | Flow, capture velocity, filtration stages, spark arrest | Match fume type; fire risk with flammable dust |
| Safety enclosure and interlocks | Contains radiation | Guard material and exposure rating, window OD, interlock loop | Class 1 in production (IEC 60825-1), guard design per IEC 60825-4 |
| Laser controller / scan card | Vectors, laser gating, delays, correction tables | Protocol, I/O, encoder inputs, software | Integration with PLC and vision |
| Process monitoring | Detects deviations | Photodiodes, cameras, OCT, power meter | Needed where 100% destructive testing is impossible (welding) |

### 28.5 Design methodology

- Start from the process window validated on the bench (Part 3): wavelength, pulse regime, fluence, spot, speed.
- Choose source class and power with margin for ageing (10–20%).
- Choose field size from part geometry and focal length from field and spot needs.
- Compute spot size, depth of focus and fluence; iterate beam expansion and focal length.
- Check scanner speed, aperture and drift against cycle and error budgets.
- Size the chiller and fume extraction.
- Design the enclosure, windows, interlocks and emission control for Class 1 operation.
- Define calibration: field correction, power measurement, focus finding, delays.
- Define process monitoring and data for traceability.
- Validate with capability runs at rate (FAT) and after installation (SAT).

### 28.6 Calculations

d_0=(4 M^2 λ f)/(πD)

z_R=(π w_0^2)/(M^2λ)

L_(field)≈f⋅θ_(opt)

E_p=(P_(avg))/(f_(rep))

P_(peak)≈(E_p)/(τ)

F=(E_p)/(πw_0^2)

I=(P)/(πw_0^2)

O=1−(v)/(f_(rep) d_0)

HI=(P)/(v)

OD=log_(10)(H_0)/(MPE)

Q_(chiller)≥1.2(P_(el)−P_(opt)+P_(optics))

Q_(hood)=v_c (10x^2+A)

d_0 = focused spot diameter (w_0 = d_0 / 2); M² = beam quality; λ = wavelength; f = focal length; D = beam diameter at the lens; z_R = Rayleigh range (depth of focus ≈ ±z_R); θ_opt = full optical scan angle; E_p = pulse energy; τ = pulse width; F = fluence; I = intensity; O = pulse overlap; v = scan or weld speed; HI = line energy (J/mm); OD = optical density needed to reduce exposure H_0 to the maximum permissible exposure (MPE from IEC 60825-1 for the wavelength and exposure time); Q_hood = required extraction flow for capture velocity v_c at distance x from a hood of face area A (unflanged hood approximation).

Marking example (50 W MOPA, 1,064 nm). D = 10 mm after a 2× expander, M² = 1.3, f = 254 mm:

- d_0 = 4 × 1.3 × 1.064 µm × 254 mm / (π × 10 mm) = 45 µm; w_0 = 22 µm.
- z_R = π × (22.4 µm)² / (1.3 × 1.064 µm) = 1.1 mm → focus tolerance about ±1 mm, consistent with the Z-axis spec of Part 2.
- Field: θ_opt ≈ 0.69 rad → L ≈ 175 mm square.
- At 100 kHz: E_p = 0.5 mJ; at 100 ns, P_peak = 5 kW; F = 0.5 mJ / (π × (22.4 µm)²) = 32 J/cm².
- At 2,000 mm/s: pulse spacing 20 µm, overlap O = 1 − 20/45 = 56%.
- Data Matrix 6.4 × 6.4 mm, hatch 0.04 mm: 160 lines, about 510 mm of marked path (≈ 50% dark modules) → 0.26 s per pass plus about 0.05 s of jumps and delays. Deep, high-contrast marks on cast aluminium need several passes at lower speed — which is why the Part 4 trial measured 3.5 s.
Welding example (3 kW fiber). Spot 0.2 mm → I = 3,000 / (π × 0.1² mm²) = 9.5 × 10⁴ W/mm² (≈ 10⁷ W/cm²), well into keyhole welding. At 100 mm/s, line energy = 30 J/mm.

Chiller example. A 3 kW fiber laser with about 40% wall-plug efficiency draws about 7.5 kW and rejects about 4.5 kW; add optics load (tens to hundreds of watts in the head) → chiller ≥ 1.2 × 4.6 ≈ 5.5 kW, with the temperature stability and flow the laser maker specifies.

Fume extraction example. Nozzle 80 mm diameter (A ≈ 0.005 m²) at x = 0.10 m, capture velocity 0.5 m/s → Q = 0.5 × (10 × 0.01 + 0.005) = 0.053 m³/s ≈ 190 m³/h at the nozzle; size the unit for duct losses and filter loading.

Laser safety windows. Required optical density follows from the worst credible exposure at the window (direct or diffusely reflected beam) and the MPE for the wavelength and exposure time from IEC 60825-1; the window and guard panels must also withstand the beam for the foreseeable exposure time (IEC 60825-4). Use the laser supplier's and window supplier's certified data, never a generic OD.

### 28.7 Industrial example — integrating the marking head in the Part 4 cell

- 50 W MOPA source rack-mounted in a separate panel compartment (Part 17), fiber to a 10 mm collimator, 2-axis galvo with 10 mm aperture, 254 mm F-theta, quick-change protective window with clean-air knife.
- Z-focus axis sets the focal plane per recipe; a laser displacement sensor checks part height, so height error stays inside the Part 9 stack.
- Scan card receives mark data and recipe from the PLC over Ethernet; laser emission enabled only by the safety PLC (Part 27 SF4).
- Field correction and a camera-to-galvo calibration are run on anodized test plates at FAT and SAT (Part 24).
- Fume extractor 1.1 kW with pre-filter, HEPA and activated carbon; differential pressure monitored (Part 18).
- Weekly power check with an external power meter, logged in the maintenance screen.

### 28.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Galvo vs fixed optic with axes | Very fast within a field | Unlimited field, simpler optics | Galvo for marking and spot welds; fixed optic plus axes or robot for long seams |
| Short vs long focal length | Small spot, high fluence, small field, short depth of focus | Large field and depth of focus, larger spot | Choose from field needed; recover spot size with a larger beam |
| Standard vs telecentric F-theta | Cheaper, larger field | Perpendicular beam, no height-to-position error | Telecentric for through-features and height variation |
| MOPA vs Q-switched fiber | Adjustable pulse width, colour and black marking | Lower cost, high pulse energy | MOPA for anodized Al, colour marking and fine contrast control |
| Single-mode vs ring-mode fiber for welding | Narrow deep welds | Less spatter, more stable keyhole | Ring or adjustable-mode for battery and copper welding |
| Air-cooled vs water-cooled source | No chiller, simple | Higher power, better stability | Air-cooled up to roughly 50–100 W depending on source; above that, water |

### 28.9 Common mistakes

- Choosing the source from power alone, before trials on the customer's material.
- Forgetting that a longer focal length for a bigger field grows the spot and cuts fluence.
- Oily or wet air on the protective window.
- No back-reflection protection when welding copper or aluminium.
- Enclosure windows chosen by "laser safe" labels without OD and exposure data for the wavelength.
- Fume extraction sized for dust but not for gases from coatings and plastics.

### 28.10 Troubleshooting — laser failures

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Mark or weld quality drops gradually | Dirty protective window, lens contamination, power loss | Inspect window; measure power at the work plane | Power vs baseline | Replace window, clean optics, recalibrate power | Window change interval, power logging |
| Quality varies across the field | Focus not flat, field distortion, tilted part | Grid and focus test over full field | Spot size and position map | Field correction, re-level, dynamic focus | Field calibration at SAT |
| Sudden no emission | Interlock loop open, source fault, shutter | Source status and interlock diagnostics | Fault codes | Close loop, reset, service source | Interlock status on HMI |
| Spatter and porosity in welds | Contaminated surface, wrong focus, gas flow, gap | Cross-sections, high-speed camera | Porosity %, gap | Clean surfaces, adjust focus, control gap | Pre-weld gap scan, gas flow switch |
| Source alarms for back-reflection | Highly reflective material, normal incidence | Change incidence angle, check isolator | Back-reflection monitor | Tilt head, add isolator | Back-reflection design review |
| Chiller alarm | Low flow, blocked filter, ambient heat | Flow and temperature logs | Flow, ΔT | Clean filters, check pump, ventilate | Chiller PM schedule |

### 28.11 Design checklist

- Source chosen from trial data on production material
- Spot size, depth of focus, field, fluence and overlap calculated
- Scanner aperture, speed and drift checked against beam size, cycle and error budgets
- Chiller and fume extraction sized; filter stages match fume composition
- Class 1 enclosure: windows with certified OD and exposure rating; interlocks per Part 27
- Calibration routines: field correction, focus, power, delays, camera-to-galvo
- Process monitoring and traceability data defined
- Back-reflection protection assessed for reflective materials

### 28.12 Key takeaways

- The process window sets the optics; compute spot, depth of focus and fluence first.
- Field size and spot size trade against each other through focal length.
- Chiller, fume extraction and clean air decide long-term stability.
- Class 1 operation comes from engineered enclosures, certified windows and safety functions.
