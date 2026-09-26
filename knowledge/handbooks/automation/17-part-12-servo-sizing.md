---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 17
part_title: "Part 12 — Servo sizing"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 12 — Servo sizing

A servo is sized by five checks — peak torque, RMS torque, speed, inertia ratio and regeneration — plus the transmission's own limits. In short-stroke precision axes the inertia ratio, not torque, usually decides the motor: in the worked example below the chosen motor carries 7% of its rated RMS torque, and that is the right answer.

### 12.1 Objective

Select transmission, motor, drive, encoder and cable for an axis from its move profile and load, with every check documented and a margin stated.

### 12.2 Engineering concept

The sizing chain runs: load → mass → friction → acceleration → force → transmission (lead, ratio, efficiency) → reflected inertia and torque → speed → motor → drive → encoder → cable → controller. Each arrow is a calculation; skipping one is how axes end up either failing at FAT or three sizes too large.

| Check | Requirement | Why it matters |
|---|---|---|
| Peak torque | T_peak ≤ motor peak torque at that speed (intermittent zone), with ≥ 20–30% margin | Motor can deliver the acceleration |
| RMS torque | T_RMS ≤ motor rated torque, with ≥ 20–30% margin | Motor does not overheat over the duty cycle |
| Speed | n_max ≤ rated speed for continuous use; ≤ max speed briefly, with torque available | Torque falls in the high-speed region |
| Inertia ratio | J_load / J_motor within the drive's recommended range (≤ 5 high dynamics, ≤ 10 typical, higher only with advanced tuning) | Governs stability, settling and tuning robustness |
| Regeneration | Braking energy ≤ bus capacitor absorption, or resistor sized for energy and average power | Prevents overvoltage faults |
| Transmission limits | Screw critical speed, DN value, buckling, life; belt tension and stretch; gearbox rated torque | The mechanics fail before the motor |

### 12.3 Architecture — transmissions and their reflected values

| Transmission | Reflected load inertia at motor | Motor torque from load force F | Motor speed | Notes |
|---|---|---|---|---|
| Ball screw, lead p | J_L = m (p / 2π)² | T = F p / (2π η) | n = v / p | η ≈ 0.9; add screw inertia |
| Belt and pulley, radius r | J_L = m r² | T = F r / η | ω = v / r | Add both pulleys' inertia; belt stretch limits stiffness |
| Rack and pinion, radius r | J_L = m r² | T = F r / η | ω = v / r | Long travel; backlash unless preloaded |
| Gearbox, ratio i | J_L,motor = J_L / i² | T_motor = T_load / (i η) | n_motor = i · n_load | Add gearbox inertia at motor side |
| Direct drive | J_L as is | T = T_load | n = n_load | Highest stiffness |

### 12.4 Components — reading a servo motor datasheet

| Parameter | Use in sizing |
|---|---|
| Rated (continuous) torque and speed | RMS and continuous-speed checks |
| Peak (instantaneous) torque | Acceleration check |
| Speed–torque curve (continuous and intermittent zones) | Peak torque at the actual top speed |
| Rotor inertia (low / medium inertia series) | Inertia ratio |
| Torque constant K_t, rated current | Drive current sizing |
| Thermal time constant | Validity of RMS averaging over the cycle |
| Holding brake torque | Vertical axes: brake ≥ 1.5–2× gravity torque |
| Encoder type and bits | Resolution, absolute or incremental, protocol |

### 12.5 Design methodology

- Define the move: distance, time, dwell, direction pattern, cycle time (from Part 4).
- Choose the profile: trapezoidal 1/3-1/3-1/3 minimizes RMS torque for inertia-dominated moves; S-curve reduces jerk and settling at a small peak-torque cost.
- Compute v_max and acceleration.
- Tabulate masses, friction, external and gravity forces.
- Choose the transmission and lead or ratio; check its limits (critical speed, DN, belt stretch).
- Compute reflected inertias and torques for each phase (accelerate, constant, decelerate, dwell).
- Compute T_peak, T_RMS, n_max.
- Pick candidate motors; check inertia ratio and speed–torque curve.
- Compute regenerative energy; size the braking resistor if needed.
- Select the drive (current, safety functions, fieldbus), encoder (bits, absolute), cable (length, flex rating, shielding).
- Record margins; re-run when mass or profile changes.

### 12.6 Calculations

t_a=t_c=t_d=(t_m)/(3)

v_(max)=(d)/(t_m−t_a)

a=(v_(max))/(t_a)

α=a⋅(2π)/(p)

J_(screw)=(πρLd^4)/(32)

J_L=m((p)/(2π))^2

J_Σ=J_m+J_(screw)+J_(coupling)+(J_L)/(η)

T_f=((μmg+F_(seal)+F_(ext)) p)/(2πη)+T_(preload)

T_(acc)=J_Σ α

T_(RMS)=√((∑T_k^2 t_k)/(t_(cycle)))

n_(max)=(60 v_(max))/(p)

R_J=(J_Σ−J_m)/(J_m)

n_(crit)=0.8⋅(60)/(2π)⋅(λ^2)/(L^2)√((EI)/(ρA))

DN=d_(screw,mm)⋅n_(max)

E_(regen)=(1)/(2)Jω^2−T_fθ_(dec)

E_(cap)=(1)/(2)C(V_(regen)^2−V_(bus)^2)

t_m = move time; d = distance; p = screw lead (m); η = screw efficiency; μ = guide friction coefficient (≈ 0.005–0.01 for profile rails); λ = 3.927 for fixed–supported screw mounting (4.730 fixed–fixed, 3.142 supported–supported, 1.875 fixed–free); 0.8 = safety factor on critical speed; DN limits are typically 50,000–70,000 for standard precision screws (higher for high-speed series; check the catalogue); C = drive bus capacitance; V_regen = braking-resistor switch-on voltage; V_bus = nominal DC bus voltage.

### 12.7 Worked example — the Part 4 shuttle axis

Inputs

| Quantity | Value | Source |
|---|---|---|
| Stroke d | 0.400 m | Layout |
| Move time t_m | 0.80 s (plus 0.20 s settle) | Part 4 time budget |
| Cycle time | 5.3 s; one move per cycle, alternating direction | Part 4 |
| Moving mass m | 35 kg (carriage 18, two nests 13, two parts 4) | 3D model |
| Guide friction μ; seal drag | 0.01; 8 N | Rail catalogue |
| Screw | ×20 mm, length 0.6 m, fixed–supported, root ×17.5 mm, η = 0.9, preload drag 0.05 N·m | Screw catalogue |
| Coupling inertia | 1.5 × 10⁻⁵ kg·m² | Coupling catalogue |
| Repeatability, settle | ±5 µm within 0.20 s | Error and time budgets |

Step 1 — profile. t_a = t_c = t_d = 0.267 s → v_max = 0.4 / 0.533 = 0.75 m/s; a = 0.75 / 0.267 = 2.81 m/s².

Step 2 — choose the lead. Compare 10 mm and 20 mm:

| Check | Lead 10 mm | Lead 20 mm |
|---|---|---|
| Motor speed n_max | 4,500 min⁻¹ — above 3,000 rated, torque derated | 2,250 min⁻¹ — inside continuous zone |
| DN value | 20 × 4,500 = 90,000 — exceeds standard screw limit | 45,000 — acceptable |
| Critical speed (≈ 7,200 min⁻¹ allowed, see below) | Passes | Passes |
| Reflected load inertia J_L | 0.89 × 10⁻⁴ kg·m² | 3.55 × 10⁻⁴ kg·m² (4× higher) |
| Resolution with 20-bit encoder | 0.0095 µm | 0.019 µm |

Lead 20 mm is chosen: the 10 mm screw fails DN and pushes the motor out of its continuous zone. The price is 4× reflected inertia, handled in step 5.

Step 3 — screw critical speed (20 mm lead). I = π × 0.0175⁴ / 64 = 4.60 × 10⁻⁹ m⁴; ρA = 7,850 × 2.41 × 10⁻⁴ = 1.89 kg/m; √(EI/ρA) = 22.1 m²/s; n_crit = 0.8 × (60 / 2π) × (3.927² / 0.6²) × 22.1 = 7,230 min⁻¹. Operating 2,250 min⁻¹ is 31% of the allowed value.

Step 4 — inertias and torques.

- J_L = 35 × (0.02 / 2π)² = 3.546 × 10⁻⁴ kg·m²; J_L / η = 3.940 × 10⁻⁴
- J_screw = π × 7,850 × 0.6 × 0.02⁴ / 32 = 0.740 × 10⁻⁴ kg·m²
- External inertia at motor: 0.740 + 0.150 + 3.940 = 4.830 × 10⁻⁴ kg·m²
- Friction: (0.01 × 35 × 9.81 + 8) = 11.4 N → T_f = 11.4 × 0.02 / (2π × 0.9) + 0.05 = 0.090 N·m
- α = 2.81 × 2π / 0.02 = 884 rad/s²
Step 5 — candidate motors (generic catalogue values for illustration; use your vendor's data):

| Motor | Rated / peak torque (N·m) | Rotor inertia (10⁻⁴ kg·m²) | T_peak needed (N·m) | Inertia ratio R_J | Verdict |
|---|---|---|---|---|---|
| 200 W | 0.64 / 1.91 | 0.18 | 0.533 | 26.8 | Fails inertia ratio |
| 400 W, low inertia | 1.27 / 3.82 | 0.42 | 0.554 | 11.5 | Marginal: needs advanced tuning to settle ±5 µm in 0.2 s |
| 750 W, low inertia | 2.39 / 7.16 | 1.20 | 0.623 | 4.0 | Passes every check with margin |

Step 6 — verify the 750 W motor. J_Σ = 1.20 + 4.83 = 6.03 × 10⁻⁴ kg·m²; T_acc = 6.03 × 10⁻⁴ × 884 = 0.533 N·m.

| Phase | Duration (s) | Torque (N·m) | T²·t |
|---|---|---|---|
| Accelerate | 0.267 | 0.533 + 0.090 = 0.623 | 0.1036 |
| Constant velocity | 0.267 | 0.090 | 0.0022 |
| Decelerate | 0.267 | −0.533 + 0.090 = −0.443 | 0.0523 |
| Dwell | 4.500 | ≈ 0 (horizontal axis) | 0 |
| Cycle | 5.3 |  | 0.1581 |

T_RMS = √(0.1581 / 5.3) = 0.173 N·m = 7% of rated; T_peak = 0.623 N·m = 9% of peak; n_max = 2,250 min⁻¹ < 3,000 rated. Every check passes.

Step 7 — regeneration. ω = 2π × 2,250 / 60 = 235.6 rad/s. Stored energy with J = 1.20 + 0.74 + 0.15 + 3.55 = 5.64 × 10⁻⁴ kg·m²: E = ½ × 5.64 × 10⁻⁴ × 235.6² = 15.6 J. Friction absorbs 0.090 × (117.8 × 0.267) = 2.8 J → E_regen ≈ 12.8 J per stop. A drive with 470 µF on a 325 V bus switching its resistor at 390 V absorbs ½ × 470 × 10⁻⁶ × (390² − 325²) = 10.9 J, so the braking resistor will switch; average power is 12.8 / 5.3 = 2.4 W, well within a drive's internal resistor.

Step 8 — drive, encoder, cable, controller.

- Drive: 750 W class matched to the motor, STO with SS1 where the risk assessment calls for controlled stops, EtherCAT (CiA 402).
- Encoder: absolute multi-turn, ≥ 20 bits, so the machine restarts mid-cycle without homing.
- Cable: flex-rated power and encoder cables for the cable chain, length checked against the drive's maximum, shield bonded 360° at both ends.
- Controller: 1 ms EtherCAT cycle is ample for a point-to-point axis.
Decision and trade-off. The 400 W motor would pass torque with 6× margin and cost less. It fails only on inertia ratio for a demanding settle window. For about the price difference of one drive size, the 750 W motor removes a tuning risk that would otherwise surface at FAT as cycle-time loss. If settle were relaxed to ±20 µm, the 400 W motor would be the better engineering choice.

### 12.8 Design trade-offs

| Trade-off | First option | Second option | Guidance |
|---|---|---|---|
| Short vs long lead | Lower reflected inertia, finer resolution, more motor speed | Lower motor speed, higher reflected inertia | Pick the lead that keeps n_max inside the continuous zone and DN within limits, then fix inertia with motor choice |
| Belt vs ball screw | Long stroke, high speed, low cost, low inertia per metre | Stiffness, accuracy, force, vertical capability | Belt above ~1.5 m or 2 m/s at moderate accuracy; screw for precision and force |
| Gearbox vs larger motor | Reduces reflected inertia by i², smaller motor | No backlash, no gear wear, higher stiffness | Gearbox for high-inertia rotary loads; direct for precision linear |
| Low- vs medium-inertia motor | Faster acceleration of light loads | Better match to heavy loads, easier tuning | Choose by inertia ratio, not by power rating |
| Oversizing | Robust, easy tuning | Cost, larger drive, more heat in the panel | Oversize for inertia or risk; not by habit |

### 12.9 Common mistakes

- Sizing on peak torque alone and ignoring RMS on high-duty axes, or ignoring inertia ratio on low-duty precision axes.
- Forgetting screw, coupling and pulley inertia.
- Using motor speed above rated with continuous-zone torque.
- Not checking screw critical speed and DN when choosing a short lead.
- No braking resistor check on high-inertia or vertical axes; overvoltage faults at FAT.
- Mixing linear guide friction values with seal drag omitted.

### 12.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Overload alarm after minutes | RMS torque above rating, friction higher than assumed | Drive load-ratio monitor over a full cycle | Load factor %, motor temperature | Reduce acceleration, lower friction, larger motor | RMS check with measured friction |
| Overvoltage alarm on stops | Regenerative energy above capacitor and resistor capacity | Bus voltage trace during deceleration | Peak bus voltage | Add or enlarge braking resistor, longer deceleration | Regeneration calculation |
| Long settle, overshoot | High inertia ratio, low stiffness | Step response, frequency response | Settling time, resonance frequency | Retune, notch filter, lower ratio (motor or lead) | Ratio within drive guideline |
| Screw vibration at speed | Near critical speed, bent screw | Speed sweep with accelerometer | Vibration vs speed | Lower speed, longer lead, fixed–fixed mounting | Critical-speed check |
| Torque higher than calculated at constant speed | Misalignment, lubrication, seals | Torque monitor at constant slow speed across stroke | Friction torque vs position | Realign, lubricate | Friction traverse test at assembly |

### 12.11 Design checklist

- Move profile from the Part 4 time chart
- All masses, friction, external and gravity forces tabulated with sources
- Transmission limits checked: critical speed, DN, buckling (vertical/thrust), belt stretch
- T_peak, T_RMS, n_max and inertia ratio within limits with stated margins
- Regenerative energy and resistor checked
- Brake sized for vertical axes (≥ 1.5–2× gravity torque)
- Drive, encoder, cable and fieldbus selected and compatible
- Sizing file under revision control and re-run after design changes

### 12.12 Key takeaways

- Five checks: peak, RMS, speed, inertia ratio, regeneration — plus transmission limits.
- Short-stroke precision axes are inertia-limited; long high-duty axes are RMS-limited.
- Choose the lead from speed and DN limits, then fix inertia with the motor.
- Record why the motor was chosen; the next engineer will be tempted to "save cost".
