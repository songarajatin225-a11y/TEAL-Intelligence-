---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 19
part_title: "Part 14 — Pneumatics"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 14 — Pneumatics

Pneumatics is the cheapest, most robust way to make simple two-position moves — if it is sized at the lowest pressure the plant will ever deliver, valves sit close to actuators, and continuous consumers (blow-offs, vacuum ejectors) are counted. Those continuous consumers usually use more air than every cylinder on the machine combined.

### 14.1 Objective

Design the pneumatic system from the plant supply to each actuator: architecture, air quality, safety functions, component sizing, air consumption and diagnostics.

### 14.2 Engineering concept

Compressed air stores energy as pressure; a cylinder converts it into force over an area. Force is fixed by pressure and bore, speed by flow, and position by end stops. Pneumatics is compliant (air compresses), which suits clamping and handling but not intermediate positioning or precise speed control.

### 14.3 Architecture

Compressor → dryer and filters → receiver → plant distribution → machine shut-off and dump valve → FRL → soft-start → pressure switch → valve terminal → flow control → actuator → position sensors.

*Figure 6. Pneumatic architecture · 7-stage air path, PLC and safety PLC control* — [Figure not transcribed; see source document]

| Stage | Function | Specify |
|---|---|---|
| Compressor, dryer, receiver (plant) | Generate and condition air | Plant scope; confirm pressure range and air quality at G0 |
| Lockable shut-off with exhaust | Isolate and vent stored energy for maintenance | Lockable, sized for full flow |
| Filter and regulator (lubricator rarely used today) | Remove particles and water; set machine pressure | Filtration grade, flow capacity at allowed pressure drop |
| Soft-start and safety exhaust valve | Build pressure slowly after reset; vent on safety demand | Safety rating where it implements a safety function |
| Pressure switch | Confirm supply before auto mode | Setpoint below minimum working pressure |
| Valve terminal (with fieldbus or IO-Link) | Direct air to actuators | Flow per valve, centre positions, diagnostics |
| Flow controls (meter-out) | Set actuator speed | Adjustable, lockable |
| Actuators | Move or hold | Bore, stroke, cushioning, guidance |
| Sensors | Confirm end positions | Magnetic reed or solid-state switches, position sensors |

Air quality is specified as ISO 8573-1 classes for particles, water and oil, written as [particles:water:oil]. General actuators tolerate modest classes; air that touches optics, laser beam paths, cleanroom products or wafers needs much finer filtration and oil-free, dry air. Blowing air across a laser protective window with oily air contaminates it within hours.

### 14.4 Components

| Component | Variants | Selection points |
|---|---|---|
| Cylinder | ISO 15552 profile, ISO 6432 round, compact ISO 21287, guided, rodless, short-stroke | Bore for force, stroke, guidance for side loads, cushioning for energy |
| Gripper | Parallel, angular, three-jaw, long-stroke | Grip force at minimum pressure, jaw length, moment capacity (Part 26) |
| Rotary actuator | Rack and pinion, vane | Torque, angle, kinetic energy at end of rotation |
| Directional valve | 3/2, 5/2 monostable or bistable, 5/3 closed, exhaust or pressure centre | Fail-safe behaviour on power or air loss decides the type |
| Pilot-operated check valve | Holds a cylinder when valve centres | For vertical loads; not a safety function alone |
| Flow control | Meter-in, meter-out | Meter-out for stable speed of double-acting cylinders |
| Pressure regulator | Manual, proportional | Separate regulated zones for gentle grips or low-force clamps |
| Position sensors | Magnetic switches, analogue position sensors | Sense end position and, for clamps, clamped-on-part position |

### 14.5 Design methodology

- List every pneumatic function: action, force, stroke, time, holding behaviour on stop and on air loss.
- Define minimum working pressure (plant minimum minus drops; typically 4–4.5 bar in plants nominally at 6 bar).
- Size each actuator at minimum pressure with load ratio limits.
- Choose valve functions from required safe behaviour (hold, release, exhaust).
- Size valves and tubes for the required speed; keep valves close to actuators.
- Add flow controls, cushioning or shock absorbers from the kinetic energy.
- Calculate air consumption, including tube dead volume and continuous consumers.
- Design the safety functions: dump on E-stop or guard opening, soft start, load holding.
- Draw the pneumatic schematic (ISO 1219 symbols) with valve and tube numbering matching the I/O list.

### 14.6 Calculations

F_(ext)=p A η

F_(ret)=p (A−A_(rod)) η

A=(πD^2)/(4)

LR=(F_(load))/(p A)≤0.5–0.7 (moving loads), ≤0.85 (static clamping)

V_(free)=(A_(ext)+A_(ret)) s⋅(p_g+p_(atm))/(p_(atm))+V_(tubes)⋅(p_g+p_(atm))/(p_(atm))

Q_(free)=A v (p_g+p_(atm))/(p_(atm))

E_k=(1)/(2)mv^2

p = gauge pressure (Pa); η = cylinder efficiency (≈ 0.9 for friction); LR = load ratio; V_free = free-air volume per double stroke; s = stroke; p_atm = 1.013 bar; Q_free = free-air flow for speed v; E_k = kinetic energy to absorb at end of stroke.

Example 1 — clamp (static). Part 10 needs 67 N. At 4 bar minimum: ×16 gives 0.4 MPa × 2.01 × 10⁻⁴ m² × 0.9 = 72 N (LR = 83%, acceptable for a static clamp); ×20 gives 113 N (LR = 53%). Choose ×20 for margin against pressure dips.

Example 2 — vertical lift (dynamic). 3 kg over 50 mm in 0.3 s: a = 4s / t² = 2.2 m/s²; F_load = 3 × (9.81 + 2.2) + 10 N friction = 46 N. With LR ≤ 0.5 at 4 bar: A ≥ 46 / (0.5 × 0.4 × 10⁶) = 2.3 × 10⁻⁴ m² → ×17 minimum → ×20 standard bore. Add a pilot-operated check valve or a 5/3 closed-centre valve if the lift must hold on stop, and assess the hazard of the load descending on air loss.

Example 3 — air consumption. ×20/×8 rod, 50 mm stroke, 6 bar: A_ext = 3.14 cm², A_ret = 2.64 cm² → (5.78 × 5) cm³ × (7.01 / 1.01) = 200 cm³ = 0.20 NL per cycle. Two 1 m tubes of 4 mm bore add 2 × 12.6 cm³ × 6.9 = 0.17 NL — almost as much as the cylinder. At 679 cycles/h (Part 4): 0.37 NL × 11.3 min⁻¹ = 4.2 NL/min.

Example 4 — whole-machine air budget.

| Consumer | Type | Consumption (NL/min) |
|---|---|---|
| 6 cylinders like example 3 | Cyclic | 25 |
| 2 grippers | Cyclic | 4 |
| Vacuum ejector, 50% duty | Continuous while on | 30 |
| Protective-window air knife on the laser head | Continuous | 60 |
| Leak allowance (10% of total) | — | 12 |
| Total |  | ≈ 131 |

The air knife and ejector are 69% of the budget; a low-flow knife design or a vacuum pump would pay for itself quickly.

Example 5 — valve flow. ×20 at 0.2 m/s: Q = 3.14 × 10⁻⁴ × 0.2 × 6.9 = 4.3 × 10⁻⁴ m³/s ≈ 26 NL/min; choose a valve with nominal flow about 2–3× higher (60–80 NL/min) to allow for pressure drop in fittings and tubes.

Example 6 — cushioning. 3 kg at 0.4 m/s → E_k = 0.24 J; compare with the cylinder's cushioning capacity from the catalogue; above it, add an external shock absorber.

### 14.7 Industrial example — pneumatic system of the laser marking shuttle

- Supply: lockable shut-off and dump valve, 5 µm filter plus coalescing filter for the air knife branch, regulator at 5 bar, pressure switch at 4.2 bar blocks auto mode.
- Safety: safety-rated exhaust valve removes clamp air on E-stop only when the risk assessment shows clamp release is safe; here the operator-side clamp must release on stop so a hand is not trapped, while the laser-side clamp is behind the closed enclosure.
- Actuators: two ×20 clamps per nest with clamped-on-part position sensing; one locating-pin retract cylinder per nest for part removal.
- Valve terminal: IO-Link, mounted on the shuttle bridge, 0.5 m tubes to every actuator.
- Air knife: separate regulated branch with oil-free, dry air to protect the F-theta window.

### 14.8 Design trade-offs

| Trade-off | Pneumatic | Electric servo | Guidance |
|---|---|---|---|
| Cost for a two-position move | Low | High | Pneumatic for fixed end positions |
| Intermediate positions, recipes | Poor | Excellent | Servo when positions vary by recipe |
| Force control | Simple via pressure | Precise via torque | Servo when force profile matters (press-fit) |
| Energy efficiency | Low (compressor losses, leaks) | High | Servo for high-duty continuous motion |
| Cleanroom suitability | Exhaust must be ducted or filtered | Better | Electric in ISO 5 and cleaner zones |
| Robustness to crashes and stall | Excellent (stalls safely) | Needs torque limits | Pneumatic for simple clamps and stops |

| Valve choice | Behaviour on power loss | Use when |
|---|---|---|
| 5/2 monostable | Returns to spring position | A defined safe position exists |
| 5/2 bistable | Holds last position | Motion must not change on power loss (e.g. gripper holding a part) |
| 5/3 closed centre | Traps air, holds position (leaks slowly) | Stop mid-stroke; not a safety function alone |
| 5/3 exhaust centre | Vents both sides, actuator free | Manual movement needed after stop |
| 5/3 pressure centre | Pressurizes both sides | Balance mid-stroke (with differential areas, moves slowly) |

### 14.9 Common mistakes

- Sizing at nominal 6 bar and failing on the plant's 4.5 bar afternoons.
- Valve terminal in the panel with 3 m tubes to every actuator: slow, air-hungry.
- Forgetting air knives, blow-offs and ejectors in the air budget.
- Relying on a closed-centre valve to hold a vertical load as a safety measure.
- Oily or wet air near laser optics or cleanroom product.
- Clamps that keep pressure on E-stop and trap an operator's hand.

### 14.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Cylinder slow | Undersized valve or tube, flow control closed, low pressure | Gauge at cylinder port during stroke | Dynamic pressure drop | Larger valve, shorter tube, reopen flow control | Flow sizing, valves near actuators |
| Jerky motion at low speed | Stick-slip, meter-in control | Observe at different speeds | Speed variation | Meter-out, low-friction cylinder | Meter-out as standard |
| Pressure dips when several actuators move | Supply or FRL undersized | Log supply pressure over a cycle | Minimum pressure | Larger FRL, local reservoir | Air budget with simultaneity |
| High air consumption | Leaks, continuous blowers | Ultrasonic leak detection, flow meter at idle | Idle flow | Fix leaks, switch blowers off when idle | Idle-flow test at FAT |
| End-position sensor not switching | Sensor position, magnet weak, wrong switch type | Move manually, watch sensor LED | Switching point | Reposition, correct sensor | Sensor setting in commissioning checklist |
| Valve not switching | Coil fault, no pilot pressure, contamination | Manual override, coil voltage check | Coil current, pilot pressure | Replace coil or valve, clean supply | Filtration, diagnostics on terminal |

### 14.11 Design checklist

- Minimum working pressure defined and used for all sizing
- Every actuator sized with load ratio and cushioning checked
- Valve function chosen for behaviour on power and air loss
- Stored-energy isolation, dump and soft start designed; safety rating per risk assessment
- Vertical-load holding assessed as a hazard, not just a function
- Air budget includes tube volume, continuous consumers and leaks
- Air quality class specified per branch (optics and cleanroom branches separate)
- Schematic in ISO 1219 symbols; numbering matches I/O list
- Idle-flow (leak) test defined for FAT

### 14.12 Key takeaways

- Size at the lowest plant pressure, with load ratio ≤ 0.5–0.7 for moving loads.
- Valves close to actuators; tube volume costs air and speed.
- Blow-offs and ejectors usually dominate air consumption.
- Choose every valve by what must happen when power or air disappears.
