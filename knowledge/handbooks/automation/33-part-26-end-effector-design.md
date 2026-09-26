---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 33
part_title: "Part 26 — End-effector design"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 26 — End-effector design

The end effector (EOAT) is where the robot meets the product, and it causes more cell downtime than the robot itself. Prefer form-fit gripping over friction, size friction grips for the worst acceleration with a safety factor of 2–4, keep the centre of gravity close to the flange, and decide what happens to the part when air or power disappears.

### 26.1 Objective

Design an end effector that holds the part securely through every motion, places it accurately, survives collisions, detects part presence, and fails safe.

### 26.2 Engineering concept

| Holding principle | How it holds | Force needed | Best when |
|---|---|---|---|
| Form-fit (positive) | Fingers shaped around features, often under the CoG | Low; geometry carries the load | Parts with graspable features; fast moves |
| Force-fit (friction) | Clamping force × friction | High; scales with acceleration and 1/μ | Parts without features; simple fingers |
| Vacuum | Pressure difference (Part 15) | Area-dependent | Flat, sealed surfaces |
| Magnetic | Magnetic attraction | Depends on thickness and air gap | Ferrous sheet and parts |
| Adhesion-free (Bernoulli, electrostatic) | Air flow or electrostatic attraction | Low | Thin wafers, foils, fragile parts |

### 26.3 Architecture

| Type | Motion | Strengths | Limits | Use |
|---|---|---|---|---|
| Parallel gripper | Jaws move linearly | Constant finger orientation, simple finger design | Stroke limited | Most handling |
| Angular gripper | Jaws pivot | Compact, large opening angle | Grip point changes with part size | Small parts, space-limited access |
| Three-jaw centric | Three jaws to the centre | Centres round parts | Round parts mainly | Shafts, cylindrical cells, caps |
| Vacuum EOAT | Cups or pads | Top access, light, multi-part | Surface-dependent | PCB, trays, sheets, glass |
| Magnetic EOAT | Permanent or electro-permanent | Fast, no air | Ferrous only, residual magnetism | Steel parts |
| Custom EOAT | Combination, multiple grippers, tools | Task-optimized, dual grippers for swap | Mass, engineering effort | Machine tending, multi-step handling |
| Tool changer | Automatic exchange of EOAT with utilities | Multi-product cells | Mass, cost, repeatability of the coupling | Variant-rich cells |

### 26.4 Components

| Component | Specification points |
|---|---|
| Gripper body | Gripping force (check whether the catalogue gives force per jaw or total), stroke, closing time, allowable jaw moments, finger length limit, mass |
| Fingers | Material (steel, aluminium, PU-coated, PEEK, printed polymer), form-fit geometry, lead-in, compliance, ESD or cleanroom compatibility |
| Sensors | Jaw position (end switches or analogue for part-size check), part presence, vacuum switch |
| Compliance unit | Lateral and angular float for insertion into pins and nests |
| Collision protection | Break-away or overload sensor that stops the robot |
| Fail-safe elements | Spring-assisted grip, pilot-operated check valves, bistable valves |
| Utilities | Air, vacuum, signals, power routed through the wrist or dress pack |

### 26.5 Design methodology

- Define the part: mass, CoG, dimensions, gripping features, surface, fragility, cleanliness, temperature.
- Define the motions: maximum linear and angular accelerations in every direction, and emergency-stop decelerations (often higher than normal).
- Choose the principle: form-fit if a feature exists; otherwise friction, vacuum or magnetic.
- Calculate grip force with safety factor; select gripper and verify jaw moments at the real finger length.
- Design fingers: form-fit shapes, lead-ins, compliance for placement onto pins.
- Calculate EOAT mass, CoG and inertia; confirm robot payload limits (Part 25).
- Define sensing and fail-safe behaviour on air and power loss and on E-stop.
- Add collision protection and quick-change fingers for variants and wear.
- Validate at full acceleration, at minimum air pressure, with worst-case parts, including E-stop stops.

### 26.6 Calculations

F_(jaw)=(m (g+a) S)/(μ⋅n_(jaws)) (friction grip, load along the jaw faces)

M_(jaw)=F_(jaw) L_(finger)+m_(finger) a h

a_(E-stop)=(v^2)/(2 s_(stop))

a_(rot)=α⋅r

S = safety factor (2 for smooth moves, 3–4 for fast robots or safety-relevant holds); μ = finger-to-part friction (0.1 steel on oily steel, 0.2 steel on steel, 0.3–0.5 rubber or PU pads on dry parts); n_jaws = number of friction surfaces; L_finger = distance from jaw guide to grip point; a_E-stop = deceleration during an emergency stop over stopping distance s_stop; a_rot = tangential acceleration from rotation α at radius r.

Example — friction grip vs form-fit. Part 2 kg, robot acceleration 10 m/s², E-stop from 1.5 m/s in 0.08 m → a_E-stop = 1.5² / 0.16 = 14 m/s² (governing). Friction grip, μ = 0.2, two jaws, S = 2: F_jaw = 2 × (9.81 + 14) × 2 / (0.2 × 2) = 238 N per jaw. With PU-coated fingers (μ = 0.4): 119 N. With form-fit fingers that cradle the part below its CoG, gravity and most inertia go into the finger geometry, and 30–50 N per jaw is enough to keep the part seated. The same gripper then runs at lower pressure, closes faster and marks parts less.

Jaw moment check. 119 N at a 60 mm finger length = 7.1 N·m; compare with the gripper's allowable jaw moment. A longer finger is a smaller gripper.

### 26.7 Industrial example — dual gripper for the marking cell

The robot of Part 25 carries two grippers at 90°: it removes the marked part and inserts a new one in one visit, instead of two trips.

| Item | Value |
|---|---|
| Gripper A (unload) and B (load) | Parallel, 2 × 0.6 kg, form-fit PU fingers matching the housing bore |
| Adapter plate and utilities | 0.6 kg |
| EOAT mass | 1.8 kg; CoG 80 mm from flange (used in the Part 25 payload check) |
| Grip force required (form-fit, S = 3) | 40 N per jaw; gripper supplies 110 N at 4 bar |
| Placement | 0.5 mm lateral compliance so the part self-centres onto the nest pins |
| Sensing | Analogue jaw position confirms part present and correct variant by bore size |
| Air loss | Spring-assisted closing keeps the part gripped; robot stops on low-pressure signal |
| Cycle gain | Swap in one visit saves one approach and retract (≈ 1.4 s per cycle) |

### 26.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Form-fit vs friction | Low force, secure, part-specific fingers | Generic fingers, high force, marks | Form-fit whenever a feature exists |
| Pneumatic vs electric gripper | Fast, strong, cheap | Programmable force and position, no air | Electric for fragile parts, variant widths, cleanroom |
| Vacuum vs mechanical | Top access, light | Robust, positive | Mechanical for heavy, porous or oily parts |
| Dual gripper vs single | Faster swaps | Mass, inertia, complexity | Dual when the machine waits during load and unload |
| Tool changer vs universal fingers | Optimal tool per product | No changer mass or cost | Changer beyond ~3 incompatible part families |

### 26.9 Common mistakes

- Sizing grip force for normal moves, not for E-stop deceleration.
- Ignoring that catalogue grip force falls with finger length.
- Friction grips on oily parts with dry-friction values.
- No compliance, so the robot's repeatability fights the fixture pins.
- No defined state on air loss; parts drop into the machine.

### 26.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Part slips or drops | Low force, low μ, E-stop deceleration | High-speed video; test E-stop with part | Slip distance | Form-fit fingers, pads, higher pressure | Size for E-stop case |
| Part jams at placement | No compliance, TCP drift | Place slowly and watch float | Lateral offset at contact | Compliance unit, lead-ins, re-teach | Compliance in design |
| Finger breakage | Collisions, excessive moment | Check jaw moment vs limit | Finger length, load | Shorter or stronger fingers, collision sensor | Moment check |
| Wrong part variant loaded | No size sensing | Load wrong variant deliberately | Jaw position reading | Analogue jaw sensing and recipe check | Poka-yoke in EOAT |
| Marks on cosmetic surfaces | Hard fingers, high force | Pressure film test | Contact pressure | Softer pads, form-fit, lower force | Cosmetic zones in URS |

### 26.11 Design checklist

- Part mass, CoG, features, surface and fragility defined
- Grip force sized for the worst case including E-stop, with S ≥ 2–4
- Jaw moments at the real finger length within limits
- EOAT mass, CoG and inertia within robot limits
- Compliance for placement onto pins or nests
- Part-present and variant sensing
- Behaviour on air loss, power loss and E-stop defined and tested
- Collision protection and quick-change fingers

### 26.12 Key takeaways

- Form-fit beats friction for security, force and part protection.
- The emergency stop, not normal motion, usually sets the grip force.
- Longer fingers mean a weaker gripper; check jaw moments.
- Decide and test what the EOAT does when air or power disappears.
