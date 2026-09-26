---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 32
part_title: "Part 25 — Robotics"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 25 — Robotics

A robot is the right choice when the task needs reach around obstacles, orientation changes or reuse across products; a Cartesian system usually wins on accuracy, stiffness and cost for planar work. Select on payload including moments and inertia at the wrist, reach with approach angles, repeatability versus the accuracy you actually need, and a simulated cycle time — then integrate it as a subordinate of the PLC, not as a second machine controller.

### 25.1 Objective

Select robot type and model, define its integration with PLC, vision, safety and MES, and verify payload, reach, cycle time and safety distances by calculation and simulation.

### 25.2 Engineering concept

Robot specifications follow ISO 9283 definitions. Pose repeatability (how closely the robot returns to a taught point) is typically ±0.01–0.1 mm. Pose accuracy (how closely it reaches a computed point) is much worse — often 0.2–1 mm without calibration — because of link tolerances, gear compliance and thermal effects. Taught points use repeatability; points computed from CAD or vision use accuracy, unless the cell is calibrated or vision-guided locally.

Safety requirements are in ISO 10218-1:2025 (the robot) and ISO 10218-2:2025 (robot applications and cells). The 2025 editions replaced the 2011 versions and absorbed most of the collaborative-application requirements formerly in ISO/TS 15066; the standards now speak of collaborative applications rather than collaborative robots.

### 25.3 Architecture — robot types

Ranges are typical of current catalogues; confirm on the specific model.

| Type | Axes | Payload | Reach | Repeatability | Strengths | Limits | TEAL-type use |
|---|---|---|---|---|---|---|---|
| SCARA | 4 | 1–20 kg | 200–1,000 mm | ±0.01–0.02 mm | Very fast, stiff vertically, compact | Planar work, one rotation | Pick-and-place, assembly, tray handling |
| 6-axis articulated | 6 | 3 kg to > 1 t | 0.5–3.5 m | ±0.02–0.1 mm | Any orientation, reach around obstacles | Lower stiffness, accuracy needs calibration | Machine tending, laser welding heads, handling |
| Delta (parallel) | 3–4 | 1–15 kg | 0.8–1.6 m working diameter | ±0.02–0.1 mm | Highest pick rate, light moving mass | Small payload, limited height | High-speed sorting, packaging, die sorting |
| Cartesian / gantry | 2–4 linear | Any | Any (modular) | ±0.01–0.05 mm | Accuracy, stiffness, large rectangular area | Footprint, limited orientation | Palletizing, large-panel processing, dispensing |
| Robot in a collaborative application | 6 (typ.) | 3–35 kg | 0.5–1.8 m | ±0.02–0.1 mm | Fence-less operation where the risk assessment allows | Speed and force limited near people | Low-volume tending, flexible assembly, demo cells |

### 25.4 Components — selection criteria

| Criterion | What to check | Typical trap |
|---|---|---|
| Payload | EOAT + part mass, and the allowable wrist moment and inertia at the actual centre-of-gravity offset | Rated payload applies only at a small CoG offset |
| Reach and workspace | Farthest point plus approach and orientation; singularities; cable routing | Point is reachable, but not with the needed tool angle |
| Repeatability vs accuracy | Taught points vs computed points | Planning vision-computed picks with repeatability numbers |
| Speed and cycle time | Simulated cycle including approach, gripper, settle | Using the brochure's standard cycle |
| Environment | IP rating, cleanroom class, ESD, temperature, spatter, chemicals | Standard robot in weld spatter or cleanroom |
| Mounting | Floor, wall, ceiling, on a track; base stiffness | Flexible base reduces accuracy and settling |
| Controller integration | Fieldbus, PLC function blocks, safety fieldbus, programming model | Robot becomes a second, conflicting sequence controller |
| Safety functions | Safe zones, safe speed, safe tool orientation, safe I/O | Functions exist but the required PL is not reached |
| Service | Local support, spares, training in India | Long lead time for a replacement reducer |

### 25.5 Design methodology — integration

- Lay out the cell in 3D; place robot, fixtures, trays, safeguards; check reach and orientations.
- Compute payload moments and inertia (25.6); choose model with margin.
- Simulate the cycle; adjust layout to shorten paths and avoid wrist flips.
- Define the PLC–robot handshake and error handling; the PLC owns the machine state.
- Define vision interfaces and calibration frames.
- Perform the risk assessment; choose safeguarding or a collaborative method; compute separation distances.
- Define MES data through the PLC.
- Program with a structured template: home, service position, recovery paths.
- Validate: cycle time, repeatability at the process point, safety functions, recovery.
*Figure 10. Robot cell integration · PLC hub with robot, vision, safety, MES and EOAT* — [Figure not transcribed; see source document]

The PLC is the hub: it dispatches robot jobs, triggers vision and exchanges records with MES; the safety PLC acts on the robot directly through stops, safe zones and safe speed, and only reports status to the PLC.

| Interface | Content | Protocol | Rule |
|---|---|---|---|
| Robot ↔ PLC | Job number, start, running, done, error code, at home, in zone, interlock permissions | Fieldbus I/O, or PLC-based robot function blocks | PLC commands jobs; robot never starts the machine cycle |
| Robot ↔ vision | Pick offsets (x, y, θ), calibration frames, results | Ethernet (TCP or fieldbus) | Calibrate camera to robot base with a hand-eye routine |
| Robot ↔ safety | E-stop, protective stop, enabling device, safe zones, safe speed, muting | Safety fieldbus or hardwired safety I/O | Safety PLC owns safety decisions |
| Robot ↔ MES | Cycle counts, errors, program version | Through the PLC | One data path to MES |

Collaborative application methods (now in ISO 10218-2:2025)

| Method | How it protects | Typical use | Must be verified |
|---|---|---|---|
| Safety-rated monitored stop | Robot stops when a person enters the shared space | Manual loading of a fixture the robot then processes | Stop function PL, detection of entry |
| Hand guiding | Person moves the robot directly with an enabling device | Teaching, heavy-part guidance | Enabling device, speed limits |
| Speed and separation monitoring | Robot slows or stops as a person approaches | Shared aisles, mixed work areas | Separation distance, sensor PL, stopping performance |
| Power and force limiting | Contact allowed within body-region force and pressure limits | Light assembly and tending | Measured forces and pressures for each contact case, tool edges |

### 25.6 Calculations

r_(CoG)=(∑m_ir_i)/(∑m_i)

M_(wrist)=m_(tot) g r_(CoG)

J_(wrist)≈∑m_i(r_i^2+k_i^2)

S_p≥v_h (T_r+T_s)+v_r T_r+S_s+C+Z (simplified speed and separation distance)

r_CoG = centre-of-gravity offset from the flange; M_wrist = static moment on the wrist; J_wrist = load inertia about the wrist axis (k_i = radius of gyration of each body); v_h = human approach speed (1.6 m/s commonly used for walking); T_r = system reaction time; T_s = robot stopping time; v_r = robot speed toward the person; S_s = robot stopping distance; C = intrusion distance; Z = position uncertainties. Use the full method of ISO 10218-2 and ISO 13855 for the design value.

Payload example. Gripper 1.8 kg with CoG 80 mm from the flange, part 1.2 kg at 120 mm → r_CoG = (1.8 × 80 + 1.2 × 120) / 3.0 = 96 mm; M_wrist = 3.0 × 9.81 × 0.096 = 2.8 N·m; J ≈ 3.0 × 0.096² + 0.005 = 0.033 kg·m². A "5 kg" robot whose wrist allows, say, 8 N·m and 0.2 kg·m² passes; the same load at 250 mm offset would exceed the moment limit of many 5 kg robots even though the mass is only 3 kg.

Separation example (simplified). v_h = 1.6 m/s, T_r = 0.1 s, T_s = 0.3 s, v_r = 1.0 m/s, S_s = 0.15 m, C = 0.2 m, Z = 0.1 m → S_p = 0.64 + 0.10 + 0.15 + 0.20 + 0.10 = 1.19 m. Halving robot speed near people and cutting stopping time shrinks this distance and the cell footprint.

### 25.7 Industrial example — robot tending for the laser marking cell

A year-3 upgrade replaces the operator at the shuttle with a robot loading from stacked trays.

- Type: 6-axis in a fenced cell rather than a collaborative application: the Part 4 rate needs 1.2 s load and unload moves, above what power-and-force limiting allows near people.
- Payload: 3 kg load at 96 mm CoG (above) on a 7 kg-class robot, giving margin for a dual gripper later.
- Accuracy: parts placed on datum pins with compliant fingers and lead-in chamfers; the nest, not the robot, defines final position.
- Integration: PLC sends job numbers per tray position; robot reports done and at-home; tray changes through a safety-rated drawer with its own interlock.
- Cycle: simulated unload + load = 3.9 s, inside the 4.1 s operator budget of Part 4.

### 25.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Robot vs Cartesian | Reach, orientation, reuse | Accuracy, stiffness, cost for planar work | Cartesian for planar high-accuracy work; robot for 3D access and flexibility |
| SCARA vs 6-axis | Faster, stiffer for planar pick-place | Orientation freedom, reach around | SCARA when all moves are vertical-approach |
| Collaborative application vs fenced cell | No fence, small footprint, shared work | Full speed, simpler risk case | Collaborative only when rate and hazards allow; many "cobot" cells end up fenced |
| Robot-language programs vs PLC-controlled robot | Vendor tools, full features | One environment, technicians use PLC skills | PLC-based control for simple handling on standard platforms |

### 25.9 Common mistakes

- Checking payload mass but not wrist moment and inertia.
- Computing pick points from CAD and expecting repeatability-level accuracy.
- Letting the robot program run the machine sequence.
- Choosing a collaborative application, then discovering the cycle time needs full speed and a fence.
- No defined recovery path from every robot position after an E-stop.

### 25.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Picks drift over hours | Thermal growth, TCP shift after a collision | Re-measure TCP; check a reference point | TCP offset, point deviation | Re-teach TCP, thermal warm-up, collision sensor | TCP check in daily routine |
| Overload or collision alarms | Payload data wrong, path too aggressive | Compare configured payload with actual | Motor torque logs | Correct payload data, smooth path | Payload identification at commissioning |
| Cycle slower than simulated | Wrist flips, fine-positioning zones, I/O wait | Robot timing log per segment | Segment times | Fly-by zones, remove waits, re-layout | Simulation with real I/O timing |
| Robot and PLC out of step | Handshake race, missing error codes | Trace handshake signals | Signal timing | Formal handshake with timeouts | Handshake spec in FRS |
| Collaborative force test fails | Sharp tool edges, speed too high | Measure force and pressure at contact points | N and N/cm² by body region | Pad edges, reduce speed, change task | Contact analysis before build |

### 25.11 Design checklist

- Reach and orientation verified in 3D simulation, without singularities in the path
- Payload, wrist moment and inertia within limits with margin
- Accuracy approach defined (taught, calibrated, vision-guided, compliant placement)
- PLC–robot handshake and error codes specified; PLC owns the machine state
- Vision calibration frames defined
- Risk assessment and safeguarding or collaborative method chosen; distances calculated
- Recovery path from any robot position
- Environment, IP, cleanroom and ESD requirements met

### 25.12 Key takeaways

- Choose the robot by moments, inertia, reach with orientation and simulated cycle, not mass and brochure speed.
- Repeatability is not accuracy; use taught points, calibration, vision or compliant placement.
- The PLC runs the machine; the robot runs jobs.
- ISO 10218-1/-2:2025 now carry the collaborative-application requirements.
