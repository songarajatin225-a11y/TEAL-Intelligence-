---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 6
part_title: "Part 3 — Process engineering"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 3 — Process engineering

The machine can never be more capable than its process window. Map the process, name the CTQs and the parameters that drive them, prove a robust window by designed experiments, then give every process step a module and every critical parameter a sensor or a control.

### 3.1 Objective

Convert the URS quality requirements into a validated process window, a list of critical parameters with their control method, and a process flow that becomes the module list.

### 3.2 Engineering concept

| Term | Definition | Machine-builder meaning |
|---|---|---|
| Process mapping | Visual record of every step, input and output (SIPOC, flow chart) | Reveals hidden steps: cleaning, drying, orientation |
| Process flow | Ordered steps with decisions and exception paths | Becomes the state machine and module list |
| Operation sequence | Timed order of actions within one cycle | Becomes the cycle-time chart (Part 4) |
| CTQ | Critical-to-quality output characteristic the customer measures | Drives inspection and acceptance tests |
| Critical parameter (KPIV) | Input that moves a CTQ materially | Must be controlled, monitored or both |
| Process window | Range of KPIVs over which all CTQs stay in specification | The machine must hold KPIVs inside it with margin |
| Process capability | Ability to stay within specification, expressed as Cp, Cpk | FAT and SAT acceptance targets |
| Yield | Good output ÷ input; FPY per step, RTY across steps | Drives input rate and scrap cost |
| Scrap / rework | Unrecoverable / recoverable nonconforming output | Needs reject lanes, quarantine and data |
| Process validation | Documented evidence the process consistently meets requirements (IQ, OQ, PQ) | Structure of FAT, SAT and ramp-up |

### 3.3 Architecture — from process flow to modules

*Figure 3. Process flow · 6 steps, 3 exception paths* — [Figure not transcribed; see source document]

Every exception path needs its own hardware (a reject lane, an operator station) and its own state in the software; a flow drawn without exceptions under-scopes the machine.

| Process step | Machine module | Function | Typical CTQ or parameter controlled |
|---|---|---|---|
| Loading | Loading module (conveyor, tray, robot) | Present one part per cycle | Orientation, one-and-only-one |
| Identification | ID reader, RFID or vision | Confirm part, variant, serial | Read rate ≥ 99.9% |
| Alignment | Fixture, clamp, vision alignment | Place part in process coordinates | Position and angle within the error budget |
| Processing | Process module (laser, dispense, press) | Add value | CTQs of the process |
| Inspection | Vision, gauge, sensor | Verify CTQs, 100% or sampled | Measurement uncertainty, GR&R |
| Unloading | Unload, sort, reject | Separate good from bad, record | Zero mix-up of good and reject |

### 3.4 Components — KPIVs and CTQs of common TEAL processes

| Process | Key input parameters (KPIV) | CTQs (KPOV) | How the machine holds the window |
|---|---|---|---|
| Laser marking | Average power, pulse frequency, pulse width, scan speed, hatch spacing, passes, focus offset | Code grade, contrast, depth, legibility | Power monitor, auto-focus or Z-axis, recipe lock, fume removal |
| Laser welding | Peak power, speed, wobble amplitude and frequency, focus offset, shielding gas, fit-up gap | Penetration, width, strength, porosity, spatter | Clamping to hold gap, in-process monitoring, gas flow switch, power calibration |
| Laser cleaning | Fluence, pulse overlap, line overlap, passes | Residue removal, substrate damage | Standoff control, speed lock, surface energy check |
| Laser cutting / singulation | Power, pulse energy, speed, passes, assist gas | Kerf, taper, chipping, heat-affected zone | Focus tracking, gas pressure regulation, debris extraction |
| Adhesive dispensing | Pressure or volumetric rate, speed, needle height, viscosity (temperature) | Bead width, volume, position | Volumetric pump, heated syringe, vision bead inspection |
| Press-fit | Force, position, speed | Insertion depth, force signature | Servo press with force–displacement monitoring |

### 3.5 Design methodology — the process study

- Define CTQs from the URS with specification limits and measurement methods.
- Map the process with SIPOC and a flow including every exception.
- List candidate KPIVs with a cause-and-effect (Ishikawa) diagram: machine, method, material, measurement, environment, people.
- Screen with a fractional-factorial DOE to find the 3–5 parameters that matter.
- Optimize with a response-surface design around the promising region.
- Map the window: run edge-of-window and noise tests (material lots, surface condition, fit-up gap, temperature).
- Run a capability study at the chosen setpoint (≥ 30 parts, ideally ≥ 125 for a first-article Cpk).
- Write the control plan: for each KPIV, how the machine controls it, monitors it and reacts.
- Convert findings into machine requirements (clamp force, focus tolerance, gas flow) and feed them to the SRS.
- Plan validation: installation qualification (IQ), operational qualification (OQ) at FAT, performance qualification (PQ) at SAT and ramp-up.

### 3.6 Calculations

Rolled throughput yield

RTY=∏_(i=1)^n FPY_i

Q_(start)=(Q_(good))/(RTY)

FPY_i = first-pass yield of step i; Q_good = required good output; Q_start = required starts.

Worked example: five steps with FPY 99.5%, 99.8%, 99.0%, 99.7%, 99.9% → RTY = 0.995 × 0.998 × 0.990 × 0.997 × 0.999 = 0.979. For 10,000 good units per day, Q_start = 10,000 / 0.979 = 10,215 starts per day. The machine must be sized for starts, not good units.

Process capability

C_p=(USL−LSL)/(6σ)

C_(pk)=min((USL−μ)/(3σ),(μ−LSL)/(3σ))

Worked example: weld penetration specified 0.40–0.80 mm; measured μ = 0.62 mm, σ = 0.04 mm → Cp = 0.40 / 0.24 = 1.67; Cpk = min(0.18, 0.22) / 0.12 = 1.50.

DOE run count

N_(runs)=2^(k−p)⋅r+n_c

k = factors; p = fractionation; r = replicates; n_c = centre points. Five factors at resolution V: 2^(5−1) = 16 runs; with 2 replicates and 3 centre points, N = 35 runs.

Window margin

M_w=(min(x_(max)−x_(set), x_(set)−x_(min)))/(3σ_x)

x_set = operating setpoint; x_min, x_max = window edges; σ_x = standard deviation of the parameter's real variation. Target M_w ≥ 2. Example: acceptable weld power window 180–240 W, setpoint 210 W, laser power variation σ = 3 W → M_w = 30 / 9 = 3.3, robust.

### 3.7 Industrial example — cylindrical-cell busbar welding study

A module maker welds 0.3 mm nickel-plated steel busbar to 21700 cell terminals. CTQs: weld shear strength above the customer minimum, penetration into the terminal between 40% and 70% of its thickness, no cracks, no spatter on the cell.

- Screening DOE (6 factors, 16 runs) showed peak power, speed, focus offset and fit-up gap dominate; wobble frequency and gas flow were minor within their tested range.
- Window mapping showed strength collapsed when the busbar-to-terminal gap exceeded about 0.05 mm, whatever the laser settings.
- Machine requirement created: a hold-down mask pressing every busbar tab around each weld, with force verified per cell, plus a pre-weld height check by laser displacement sensor.
- Control plan: power measured by an internal monitor each shift and by an external power meter weekly; focus verified by a daily test coupon; gap verified 100% by height scan before welding.
The lesson: the most important output of a process study is often a mechanical requirement, not a laser setting.

### 3.8 Design trade-offs

| Decision | Option A | Option B | Guidance |
|---|---|---|---|
| Where to develop the process | Lab bench: fast, cheap, flexible | Prototype machine: real handling and timing | Bench for the window, prototype for rate and handling effects |
| Operating point | Peak performance, narrow window | Centre of wide window, slightly slower | Choose the robust centre; FAT rewards stability |
| Inspection | 100% in-line: zero escape, adds cycle time and cost | Sampling offline: cheap, delayed detection | 100% for safety CTQs and high-value parts |
| Parameter control | Open loop with periodic calibration | Closed loop with in-process sensing | Closed loop when the KPIV drifts faster than the calibration interval |

### 3.9 Common mistakes

- Developing the process on perfect samples and meeting production variation for the first time at SAT.
- Recording laser settings but not focus position, gas flow, part temperature or surface state.
- Declaring capability from 10 parts.
- Ignoring measurement uncertainty: a gauge with poor GR&R hides or invents process variation.
- Leaving the control plan to the customer after SAT.

### 3.10 Troubleshooting — process drift

| Symptom | Possible causes | Diagnostic test | Root cause found by | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Yield falls over a shift | Thermal drift of optics or part; lens contamination | Compare first-hour and last-hour CTQs; inspect protective window | Correlating CTQ with time and temperature | Clean or replace window; warm-up routine | Scheduled window change; temperature-compensated focus |
| Yield differs by material lot | Surface coating, alloy, flatness variation | Split test across lots | Incoming material data vs CTQ | Recipe per lot class or tighter incoming spec | Add material properties to URS |
| Random failures, no trend | Fit-up, fixture wear, gas interruption | Log gap, clamp, gas flow per part | Per-part data correlation | Fix the uncontrolled KPIV | Add sensor and interlock for it |

### 3.11 Design checklist

- CTQs listed with limits and measurement method; GR&R acceptable (< 10% preferred, < 30% conditional)
- Process flow includes every exception path and its hardware
- KPIVs identified by screening DOE, not by opinion
- Process window mapped with production-representative noise
- Capability demonstrated at setpoint on ≥ 30 parts
- Control plan defines control, monitoring and reaction for each KPIV
- Process findings converted into SRS lines
- IQ / OQ / PQ plan mapped to FAT, SAT and ramp-up

### 3.12 Key takeaways

- Freeze the process before the machine; a machine built around an unproven process is a science experiment.
- Size for starts, not good parts: RTY sets the input rate.
- Run at the centre of a wide window with margin ≥ 2 in parameter variation.
- The process study's biggest output is usually a mechanical or sensing requirement.
