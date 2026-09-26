---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 16
part_title: "Part 11 — Motion control"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 11 — Motion control

Every axis is a chain — controller, drive, motor, transmission, load, feedback — and it performs only as well as its weakest link. Choose the motor family from the motion profile and accuracy class, the feedback from the accuracy and restart requirements, and the control architecture from axis count and synchronization needs.

### 11.1 Objective

Select motor, drive, feedback and control architecture for each axis, and define the control-loop structure that meets the positioning, settling and synchronization requirements.

### 11.2 Engineering concept

*Figure 5. Motion chain · 6 elements, 2 feedback loops* — [Figure not transcribed; see source document]

The drive closes three cascaded loops on the motor encoder: current (innermost, fastest), velocity, and position. When the transmission adds backlash or compliance, a load-side encoder closes the position loop on the load itself (dual loop) while the motor encoder keeps the inner loops stable.

| Loop | Controls | Typical bandwidth | Tuned for |
|---|---|---|---|
| Current (torque) | Motor current | 1–3 kHz | Set by drive; rarely touched |
| Velocity | Speed | 100–400 Hz | Stiffness and disturbance rejection |
| Position | Position | 20–100 Hz | Following error, settling, overshoot |
| Feedforward (velocity, acceleration) | Predicts the needed command | — | Cuts following error during moves without raising gains |

### 11.3 Architecture — control options

| Architecture | How it works | Axis count | Synchronization | Best use |
|---|---|---|---|---|
| Drive-based indexer | Positions stored in the drive; PLC sends I/O triggers | 1–4 | None | Simple point-to-point axes |
| PLC with pulse-train output | PLC generates step/direction pulses | 1–4 | Limited | Low-cost steppers, legacy |
| PLC with integrated motion over fieldbus | PLC motion engine (PLCopen) commands drives on EtherCAT or PROFINET IRT | 1–64+ | Electronic gearing, cams, interpolation | Most SPMs |
| Dedicated motion controller | Separate controller for trajectories; PLC for sequence | 4–32 | Advanced kinematics, high-rate interpolation | Complex multi-axis, laser processing |
| Industrial PC with soft motion | Real-time kernel runs PLC and motion | 1–100+ | Full, plus vision and data on one CPU | Data- and vision-heavy machines |
| Robot controller | Kinematics built in | 4–7 per arm | Conveyor tracking | Robot handling |

### 11.4 Components

Motors

| Motor | Principle | Speed and torque range | Feedback | Accuracy potential | Best use | Limits |
|---|---|---|---|---|---|---|
| Stepper (hybrid) | Magnetic steps, open loop (closed-loop variants exist) | High torque at low speed, falls sharply above ~600–1,000 min⁻¹ | None or encoder | Microstep resolution is not accuracy; ±0.05° step accuracy typical | Low-cost, low-speed, light-load positioning | Loses steps silently if overloaded; resonance |
| AC servo (PMSM) | Permanent-magnet synchronous, closed loop | 3,000–6,000 min⁻¹ rated, ~3× peak torque | Encoder or resolver | Limited by encoder and mechanics | Default for dynamic precise axes | Tuning required, higher cost |
| BLDC | Trapezoidal commutation, Hall or encoder | Compact, efficient | Hall sensors, encoder | Moderate | Fans, pumps, compact actuators | Torque ripple at low speed |
| AC induction with VFD | Slip-based, frequency controlled | Constant or variable speed | None, or encoder for vector control | Speed control, not positioning | Conveyors, pumps, fans, spindles | Poor low-speed positioning |
| Torque motor (direct-drive rotary) | Large-diameter PMSM, no gearbox | High torque, low speed | High-resolution encoder | Arc-seconds | Rotary indexers, precision tables | Cost, needs rigid bearing, heat |
| Linear motor | Unrolled PMSM, direct linear force | Up to several m/s, high acceleration | Linear encoder | Sub-micron with good encoder | High-dynamics precision axes, gantries | Cost, heat, magnet attraction (iron-core), no self-braking |

Drives

| Drive | Controls | Command interfaces | Safety functions to specify |
|---|---|---|---|
| Servo drive | Position, velocity or torque of a servo motor | EtherCAT (CiA 402), PROFINET (PROFIdrive), analogue ±10 V, pulse/direction | STO as baseline; SS1, SS2, SLS, SBC where the risk assessment needs them |
| VFD | Speed of induction or PM motors | Fieldbus, analogue, digital inputs | STO; braking resistor or regenerative unit |
| Stepper drive | Step current profile | Pulse/direction, fieldbus | Enable input; STO on some models |

Feedback devices

| Device | Output | Strengths | Limits | Use |
|---|---|---|---|---|
| Incremental encoder (TTL, sin/cos) | Counts from a reference | Low cost, high resolution with interpolation | Needs homing after power-up | Axes that home every start |
| Absolute encoder, single-turn | Position within one turn | No homing within a turn | Loses turn count | Rotary axes within one turn |
| Absolute encoder, multi-turn | Position across many turns (battery-backed or gear/energy-harvesting) | No homing; safe restart mid-cycle | Battery maintenance on some types | Default for automatic machines |
| Resolver | Analogue sine/cosine | Robust to heat, shock, radiation | Lower accuracy than optical encoders | Harsh environments |
| Linear encoder (optical, magnetic) | Position of the load directly | Removes screw and thermal errors from the loop | Cost, cleanliness (optical) | Precision axes, dual-loop control |

Serial encoder protocols (EnDat, BiSS-C, Hiperface DSL and proprietary ones) carry absolute position, diagnostics and, on some, safety data; check drive compatibility before choosing a motor.

### 11.5 Design methodology

- From the cycle time budget, define each axis's move profile: distance, time, dwell, duty.
- From the error budget, define accuracy, repeatability and settling window.
- Choose actuator family (pneumatic, stepper, servo, linear motor) using the trade-offs in 11.8.
- Choose the transmission (Part 12) and size the motor and drive.
- Choose feedback: absolute multi-turn by default; add a load encoder when transmission error exceeds the budget.
- Choose the control architecture from axis count and synchronization needs.
- Define safety functions per axis from the risk assessment (STO minimum).
- Plan tuning: auto-tune, then frequency-response check, notch filters for resonances, feedforward.

### 11.6 Calculations

res_(lin)=(p_(lead))/(i⋅2^(N_(bits)))

e_(follow)≈(v)/(K_v)

n_(sync)=(120f)/(p_(poles))

res_lin = linear resolution (m); p_lead = screw lead (m); i = gear ratio; N_bits = encoder bits per turn; e_follow = steady-state following error of a proportional position loop without feedforward; v = velocity (m/s); K_v = position-loop gain (s⁻¹); n_sync = synchronous speed (min⁻¹) at supply frequency f (Hz) for p_poles poles; induction motors run below n_sync by the slip.

Examples: a 20-bit encoder on a 10 mm-lead screw gives 10 mm / 1,048,576 = 0.0095 µm per count, far finer than the mechanics. At v = 0.5 m/s with K_v = 100 s⁻¹, following error is 5 mm without feedforward; velocity feedforward typically cuts it by one to two orders of magnitude. A 4-pole motor at 50 Hz has n_sync = 1,500 min⁻¹ and runs near 1,440 min⁻¹ at rated load.

### 11.7 Industrial example — axes of the Part 4 laser marking shuttle

| Axis | Requirement | Choice | Reason |
|---|---|---|---|
| Shuttle (400 mm, 1.0 s incl. settle, ±5 µm repeatability) | Dynamic, precise, two fixed stations plus service position | AC servo, ball screw, absolute multi-turn encoder, EtherCAT | Pneumatic cannot hold ±5 µm at two stations with a service position; stepper risks lost steps at 1 m/s |
| Z-focus (50 mm, recipe positions, ±20 µm) | Slow, vertical, holds position | Servo or closed-loop stepper with brake, ball screw | Vertical load needs a brake; recipe-driven positions |
| Infeed conveyor | Constant speed, start/stop | Induction motor and VFD, or 24 V BLDC roller | No positioning; stopper and sensor locate the part |
| Galvo X/Y | Beam steering | Galvo scanner with its own digital servo loop | Integrated with the laser controller (Part 28) |

### 11.8 Design trade-offs

| Trade-off | First option wins when | Second option wins when |
|---|---|---|
| Servo vs stepper | Speed above ~600 min⁻¹, varying loads, need to know position after a disturbance, high duty | Low speed, constant light load, cost-driven, short moves; closed-loop steppers narrow the gap |
| Ball screw vs linear motor | Moderate speed, high force, vertical axes, cost | Very high speed and acceleration, long travel with multiple carriages, no backlash, highest accuracy |
| Direct drive vs gearbox | Highest stiffness and accuracy, no backlash | High inertia loads, cost, compactness |
| Absolute vs incremental encoder | Restart without homing, safety, crash recovery | Lowest cost, homing acceptable |
| Centralized motion vs drive-based | Synchronization, interpolation, many axes | Independent point-to-point axes |

### 11.9 Common mistakes

- Choosing a stepper for a varying load and discovering lost steps only through scrap.
- Confusing encoder resolution with axis accuracy.
- Raising position gain to cut following error instead of adding feedforward, and exciting a resonance.
- Forgetting the brake on vertical axes, or not controlling it through the drive's safe brake function.
- Incremental encoders on a machine that must restart mid-cycle after a power loss.

### 11.10 Troubleshooting — servo axis not reaching position

Work from the load back to the controller, one hypothesis at a time, measuring before changing anything.

| Step | Question | Test | If yes |
|---|---|---|---|
| 1 | Does the axis move freely by hand (power off, brake released)? | Push with a force gauge along travel | Mechanical binding, misaligned rails or screw, crashed carriage → fix mechanics first |
| 2 | Does commanded position match motor encoder position at standstill? | Read following error and in-position flag | Large static error → torque limit reached, integral too low, friction too high |
| 3 | Does motor encoder position match the real load position? | Dial indicator or laser on the load vs encoder reading | Coupling slip, backlash, belt stretch, wrong lead or gear-ratio parameter |
| 4 | Does the error appear only during acceleration? | Scope following error vs time | Acceleration too high for torque, load inertia underestimated, no feedforward |
| 5 | Does the axis oscillate or hunt at target? | Frequency response or step response | Tuning too aggressive, resonance → lower gains, notch filter |
| 6 | Does the drive report faults (overcurrent, overload, encoder)? | Drive fault log | Undersized drive, cable or encoder fault, noise |
| 7 | Does the error grow over hours? | Log error vs temperature | Thermal growth of screw; add load encoder or compensation |

| Symptom | Possible causes | Root cause confirmed by | Corrective action | Preventive action |
|---|---|---|---|---|
| Position error only at one end of travel | Rail misalignment, screw bent | Force-vs-position traverse | Realign, replace screw | Alignment check in assembly procedure |
| Constant offset | Wrong lead parameter, home offset | Commanded vs measured slope | Correct parameter | Parameter review checklist |
| Random drift | Coupling slip | Paint mark on coupling and shaft | Re-torque, keyed or clamp coupling | Torque marks, coupling sized for peak torque |
| Overload fault on long moves | RMS torque above rating | Drive thermal log | Resize motor or profile | RMS check in sizing (Part 12) |

### 11.11 Design checklist

- Move profile, accuracy and settling window defined for every axis
- Actuator family justified against alternatives
- Feedback type chosen for restart behaviour and accuracy; load encoder where needed
- Encoder protocol compatible with drive and safety functions
- Brakes on vertical and gravity-loaded axes, controlled by the drive
- Safety functions (STO minimum) mapped to each axis
- Tuning plan with frequency-response check and feedforward
- Axis parameters (lead, ratio, limits, home) in a controlled parameter file

### 11.12 Key takeaways

- Motor, transmission and feedback form one chain; size and tune them together.
- Absolute multi-turn feedback by default in automatic machines.
- Feedforward, not higher gain, removes following error during moves.
- Debug from the load back to the controller, measuring at each link.
