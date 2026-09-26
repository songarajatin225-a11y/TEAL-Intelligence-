---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 12
part_title: "Part 8 — Mechanical engineering"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 8 — Mechanical engineering

The structure and machine elements decide what accuracy the controls can ever achieve. Choose the structure material for stiffness, damping and thermal behaviour against the accuracy class; size every element for life, stiffness and first resonance, not just strength — most precision machines are stiffness- and thermally-limited long before they are stress-limited.

### 8.1 Objective

Select the machine structure and elements, and verify by calculation that deflection, first natural frequency, thermal growth and life meet the error and reliability budgets from Part 6.

### 8.2 Engineering concept

A machine structure has five jobs: carry loads with small deflection (stiffness), dissipate vibration (damping), hold geometry as temperature changes (thermal stability), resist reaction forces of moving axes (mass and stiffness), and give access for assembly and service. Accuracy problems usually trace back to one of these, not to the servo.

### 8.3 Architecture — structure options

Values are typical ranges; relative damping is normalized to welded steel = 1.

| Structure | E (GPa) | Density (kg/m³) | CTE (µm/m·K) | Relative damping | Best use | Watch-outs |
|---|---|---|---|---|---|---|
| Welded steel frame | 200–210 | 7,850 | 11–13 | 1 | General SPMs, heavy parts, laser machines | Weld distortion; stress-relieve before machining |
| Aluminium extrusion | ~69 | 2,700 | 23 | ~1 (joints add some) | Guards, light frames, prototypes, cleanroom enclosures | Low stiffness at joints; doubles thermal growth of steel |
| Sheet metal | 200 (steel) | 7,850 | 11–13 | Low | Covers, panels, light brackets | Not a precision datum; resonates |
| Natural granite | ~40–90 | 2,600–3,000 | 5–8 | ~5–10 | Precision bases, metrology, wafer tools | Brittle, inserts needed, long lead time |
| Cast iron | 100–130 | 7,200 | 10–11 | ~3–10 | Machine-tool bases, volume platforms | Pattern cost, lead time, volume needed |
| Polymer concrete (mineral casting) | 30–45 | 2,300–2,500 | 12–16 | ~6–10 | High-dynamics precision bases in volume | Mould cost, needs cast-in inserts |

Vibration isolation. A machine either needs to be isolated from the floor (external vibration from presses, compressors, traffic) or to be rigidly anchored against its own reaction forces (fast axes). Soft isolators solve the first and worsen the second; decide which dominates.

### 8.4 Components — machine elements

| Element | Function | Key specifications | Selection drivers | Typical failure |
|---|---|---|---|---|
| Shaft | Transmit torque, carry rotating parts | Diameter, material, tolerance, runout | Torque, bending, torsional stiffness, speed | Fatigue at keyways and shoulders |
| Rolling bearing | Support rotation | Dynamic load C, static C₀, speed limit, preload | Life L10, stiffness, speed, sealing | Brinelling, lubricant loss, contamination |
| Coupling | Join shafts, absorb misalignment | Rated torque, torsional stiffness, misalignment | Stiffness (servo) vs compliance (misalignment) | Slip on clamp hub, bellows fatigue |
| Gearbox (planetary, harmonic, worm) | Match motor speed and torque to load | Ratio, backlash (arcmin), rated and peak torque, efficiency | Inertia ratio, backlash, stiffness | Backlash growth, overheating |
| Timing belt and pulleys | Linear or rotary transmission over distance | Pitch, width, tension, tooth rating | Long strokes, low cost, speed | Stretch, tooth jump, wear, resonance |
| Lead screw (trapezoidal) | Low-cost linear motion, self-locking | Lead, efficiency (20–50%) | Low duty, vertical holding, low speed | Wear, backlash |
| Ball screw | Efficient precise linear motion | Lead, accuracy class, preload, critical speed | Accuracy, stiffness, force | Whip at critical speed, contamination |
| Linear guide (profile rail) | Guide linear motion with stiffness | Dynamic load C (50 or 100 km basis), preload, accuracy class | Load, moment, stiffness, life | False brinelling, lubrication loss |
| Linear actuator (belt, screw, linear motor module) | Packaged axis | Stroke, thrust, speed, repeatability | Integration speed vs custom performance | Seal wear, carriage play |

Precision vocabulary. These terms appear in every specification; define them with the customer before signing numbers.

| Term | Definition | Measured with | Typical figure for a precision SPM axis |
|---|---|---|---|
| Accuracy | Closeness of achieved to commanded position, absolute | Laser interferometer, calibrated scale | ±5–20 µm over travel |
| Repeatability | Spread when returning to the same commanded point (usually ±3σ) | Interferometer, dial indicator, capacitive probe | ±1–5 µm |
| Resolution | Smallest increment the system can command or detect | Encoder specification, step test | 0.1–1 µm |
| Backlash / lost motion | Position difference on direction reversal | Bidirectional interferometer test | < 5 µm (screw with preload) |
| Runout | Radial or axial deviation during rotation | Dial indicator, capacitive probe | < 5–10 µm TIR |
| Straightness | Deviation from a straight line during travel | Straightedge with indicator, laser | 5–10 µm per 500 mm |
| Flatness | Deviation of a surface from a plane | Surface plate, autocollimator, CMM | 5–20 µm over a mounting plate |
| Parallelism | Deviation of a line or surface from parallel to a datum | Indicator traverse | 10–20 µm over rail length |
| Perpendicularity (squareness) | Deviation from 90° between axes or surfaces | Square with indicator, laser | 10–20 µm per 300 mm (≈ 30–70 µrad) |
| Abbe error | Error from angular motion × offset between measuring and working points | Calculation from pitch/yaw and offset | Designed out by minimising offset |

### 8.5 Design methodology

- Read the error budget and the loads (static, inertial, process) for each assembly.
- Choose the structure type for the accuracy class and volume (8.3).
- Place the measuring system as close as possible to the process point (Abbe principle).
- Size elements for stiffness and first resonance, then check strength and life.
- Check thermal growth for the expected temperature range and heat sources.
- Plan stress relief, machining sequence and datum surfaces for manufacture.
- Verify with FEA where hand calculations are not credible (complex frames, modal behaviour).
- Define alignment and inspection features (datum edges, dowel holes) for assembly.

### 8.6 Calculations

Beam deflection and stiffness (E = Young's modulus, I = second moment of area, L = span, F = point load, w = distributed load)

δ_(cantilever)=(FL^3)/(3EI)

δ_(simple,centre)=(FL^3)/(48EI)

δ_(simple,uniform)=(5wL^4)/(384EI)

I_(rect tube)=(bh^3−(b−2t)(h−2t)^3)/(12)

f_n=(1)/(2π)√((k)/(m_(eff)))

Worked example — gantry beam: steel tube 150 × 100 × 6 mm, simply supported over 1.2 m, carriage and head 30 kg at mid-span.

- I = [100 × 150³ − 88 × 138³] / 12 = 8.85 × 10⁶ mm⁴ = 8.85 × 10⁻⁶ m⁴; EI = 1.77 × 10⁶ N·m².
- Carriage deflection: F = 294 N → δ = 294 × 1.2³ / (48 × 1.77 × 10⁶) = 6.0 µm at mid-span, zero at the supports — a 6 µm straightness error along travel unless compensated.
- Self-weight: 22.4 kg/m (w = 220 N/m) → δ = 5 × 220 × 1.2⁴ / (384 × 1.77 × 10⁶) = 3.4 µm, constant and removed by machining or shimming.
- Stiffness k = 48EI / L³ = 4.92 × 10⁷ N/m; m_eff ≈ 30 + 0.49 × 26.9 = 43.2 kg → f_n = 170 Hz.
- Check: first resonance should exceed 3–5× the position-loop bandwidth; 170 Hz supports a 35–55 Hz loop comfortably.
Bearing life

L_(10)=((C)/(P))^p×10^6 rev

L_(10h)=(L_(10))/(60 n)

p = 3 for ball bearings, 10/3 for roller bearings; C = dynamic load rating (N); P = equivalent load (N); n = speed (min⁻¹). Example: C = 14 kN, P = 1.2 kN, n = 1,500 min⁻¹ → L10 = 11.67³ × 10⁶ = 1.59 × 10⁹ rev → L10h = 17,600 h.

Linear guide life

L=((C)/(f_w⋅P))^3⋅L_(rated)

L_rated = 50 km or 100 km depending on the manufacturer's rating basis (check the catalogue; mixing bases halves or doubles the answer); f_w = load factor for shock and vibration (1.0–1.5 smooth, 1.5–2.0 moderate). Example: C = 20 kN (50 km basis), P = 1.5 kN per block, f_w = 1.5 → L = (20 / 2.25)³ × 50 = 35,100 km. The Part 4 shuttle travels 0.4 m × 2 × 679 cycles/h = 543 m/h → 64,700 h, about 8 years at 22 h/day.

Shaft under combined bending and torsion

T_e=√(M^2+T^2)

d=((16 T_e)/(π τ_(allow)))^(1/3)

θ=(TL)/(GJ)

Example: M = 15 N·m, T = 20 N·m → T_e = 25 N·m; τ_allow = 40 MPa (safety factor included) → d = 14.7 mm → choose 16 mm, then check torsional wind-up θ against the error budget.

Thermal growth

ΔL=α L ΔT

For a 1,000 mm beam and a 5 K rise: aluminium 115 µm, steel 60 µm, granite about 30 µm. A single 5 K swing can consume a whole precision error budget, so control heat sources (motors, laser, panel) or compensate.

Vibration isolation

T_r=(1)/(|1−r^2|) (undamped)

r=(f_(disturbance))/(f_(n,mount))

Isolation starts only above r = √2. Example: 25 Hz floor vibration from a nearby press, mounts tuned to 8 Hz → r = 3.1, T_r = 0.11, 89% attenuation. The same soft mounts let the base rock under a 10 m/s² gantry move; add a seismic mass or stiffen the mounts if internal forces dominate.

### 8.7 Industrial example — choosing a structure for three TEAL machines

| Machine | Accuracy need | Chosen structure | Reason |
|---|---|---|---|
| Enclosed fiber marking workstation | ±0.1 mm | Welded steel frame, machined top plate, aluminium-extrusion enclosure | Low cost, stiff enough, extrusion keeps guards light |
| Busbar welding gantry (Part 5) | ±0.03 mm | Stress-relieved welded steel base, machined rail seats, steel gantry beam | High dynamic forces, heavy tooling, moderate volume |
| Wafer marking tool | ±0.02 mm, cleanroom | Granite base on steel frame, passive isolation, stainless covers | Thermal stability and damping; floor vibration isolation |

### 8.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Welded frame vs aluminium extrusion | Stiff, damped by mass, stable; fabrication and stress relief needed | Fast, reconfigurable, light; low joint stiffness, 2× thermal growth | Weld the precision base; use extrusion for guards and light modules |
| Granite vs steel base | Thermal stability, damping | Lower cost, easier to machine and modify | Granite below ±20 µm or in cleanrooms |
| Standard actuator vs custom axis | Fast integration, vendor support | Higher stiffness, better Abbe geometry | Custom when the error budget cannot absorb actuator compliance |
| Soft isolation vs rigid anchoring | Rejects floor vibration | Resists internal reaction forces | Decide by the dominant disturbance source |

### 8.9 Common mistakes

- Checking stress only; a beam at 10% of yield can still deflect 50 µm.
- Machining a welded frame before stress relief; it moves for weeks afterwards.
- Mounting the encoder scale far from the tool (large Abbe offset).
- Aluminium extrusion as the datum structure of a precision process.
- Ignoring heat from the laser source or panel mounted on the frame.

### 8.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Accuracy drifts through the shift | Thermal growth from motors, laser, ambient | Log position error vs temperature | Thermocouples on frame, repeat grid measurement | Thermal isolation, warm-up cycle, compensation | Thermal budget at design |
| Ringing after moves, long settle | Low first resonance, loose joints | Tap test, drive frequency response | FFT of following error | Stiffen, add damping, notch filter | Modal check at G3 |
| Straightness error along travel | Beam sag, rail seat not flat | Indicator traverse along axis | Straightness profile | Shim, rescrape, software compensation | Flatness spec on rail seats |
| Early bearing failure | Misalignment, contamination, overload | Inspect raceways, check alignment | Vibration spectrum, temperature | Realign, seal, resize | Alignment procedure, life calc |

### 8.11 Design checklist

- Structure type justified against accuracy class, dynamics and volume
- Deflection under static and inertial loads within the error budget
- First natural frequency ≥ 3–5× servo bandwidth
- Bearing and guide life meet the service-life target at real duty
- Thermal growth estimated for the site temperature range and heat sources
- Abbe offsets minimized and quantified
- Stress relief, machining sequence and datum features specified on drawings
- Lifting, levelling and anchoring points designed in

### 8.12 Key takeaways

- Precision machines fail on stiffness and heat, rarely on strength.
- Keep the measuring point close to the working point.
- Resonance above 3–5× servo bandwidth, or the controls cannot rescue accuracy.
- A 5 K swing costs 60 µm per metre of steel; treat temperature as a load.
