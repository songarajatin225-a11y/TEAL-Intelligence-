---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 4
part_title: "Part 1 — Industrial automation fundamentals"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 1 — Industrial automation fundamentals

An automation machine senses, decides and acts inside its own cycle; mechanization only replaces muscle. Classifying the request correctly on day one fixes the architecture, cost band, validation burden and the platform you reuse.

### 1.1 Objective

Place any incoming request on four axes — level of automation, type of automation, machine category and precision class — so the right reference architecture and team are chosen before a single concept is sketched.

### 1.2 Engineering concept

- Industrial automation is the use of control systems (PLC, motion controllers, industrial PCs, robots) and information systems to run a process with minimal human action inside the cycle.
- An automation machine is an integrated system of structure, actuators, sensors, controls, software and safety that executes a process sequence autonomously within defined limits and detects its own deviations.
- Mechanization vs automation. Mechanization replaces human power; automation replaces human sensing and decision within the cycle. The test: does the machine verify its own state before the next step? If not, it is mechanized.

| Level | Human role in cycle | Loading | Decision and correction | Typical output | Indicative capex (₹ lakh) | Laser-marking example |
|---|---|---|---|---|---|---|
| Manual | Performs every step | Operator | Operator | 20–60 UPH | < 3 | Hand-held marker, stencil |
| Mechanized | Positions, starts, inspects | Operator | Operator | 60–150 UPH | 3–8 | Bench marker with fixed jig |
| Semi-automatic | Loads and unloads only | Operator | Machine within cycle | 150–600 UPH | 8–40 | Rotary two-station marker behind light curtain |
| Automatic | Supervises, replenishes | Feeder, conveyor, robot | Machine, with self-diagnosis | 600–3,600 UPH | 40–250 | Inline marker with vision verification and reject |
| Adaptive | Supervises by exception | Automatic | Machine adjusts parameters from in-process measurement | As automatic | 80–400 | Vision-corrected marking with closed-loop contrast control |

Output and capex are indicative planning bands for Indian builds; the product, accuracy and handling complexity move them by 2–3×.

| Type of automation | Product variety | Volume | Changeover | Characteristic hardware | Example |
|---|---|---|---|---|---|
| Dedicated (fixed) | One product or family | Very high | Hours to days, mechanical | Cams, dedicated fixtures, indexers | Single-format cylindrical-cell tab welder |
| Programmable | Batches of known variants | Medium–high | Minutes, recipe plus tooling | Servo axes, recipe-driven PLC | Recipe-based marking of 40 automotive SKUs |
| Flexible | Mixed models in one flow | Low–high | Seconds, automatic | Robots, vision, quick-change EOAT, RFID recipes | Robotic cell marking mixed parts from an AGV |

| Category | Defining requirement | TEAL-type example |
|---|---|---|
| Special purpose machine (SPM) | Built for one customer process; low reuse by default | Custom leak-test and mark station |
| General-purpose automation | Configurable standard platform sold in volume | Standard enclosed fiber-marking workstation |
| Robotic automation | Robot is the primary handling or process axis | Cobot-fed galvo marking cell |
| Precision automation | Accuracy ≤ ±10 µm or repeatability ≤ ±2 µm drives the design | Die placement, fine-pitch laser trimming |
| Semiconductor equipment | Contamination control, SEMI safety and SECS/GEM connectivity | Wafer or package laser marker |
| Production equipment | Runs at rate, three shifts, OEE-measured | Battery module busbar welding line |
| Inspection equipment | Measurement uncertainty and GR&R are the product | AOI of marked codes, weld-seam inspection |
| Material handling equipment | Moves, buffers, orients; adds no process value | Tray stacker, magazine loader, conveyor |

### 1.3 Architecture

The automation hierarchy sets what the machine builder owns. Levels follow the ISA-95 / IEC 62264 model.

| Level | Scope | Time scale | Typical systems | Builder's responsibility |
|---|---|---|---|---|
| 0 — Process | Sensing and actuation | µs–ms | Sensors, valves, motors, laser source | Own completely |
| 1 — Control | Sequencing, motion, safety | ms | PLC, motion controller, drives, safety PLC | Own completely |
| 2 — Supervisory | Operator interface, recipes, local data | s | HMI, equipment PC, SCADA client | Own completely |
| 3 — Operations | Work orders, genealogy, SPC | min–h | MES, historian, QMS | Own the interface |
| 4 — Business | Planning, inventory, finance | days | ERP | None; data only via MES |

Every machine decomposes into a five-level product hierarchy. Documentation, BOM, change control and spares all follow it, so fix it at Gate 2.

- Machine — automatic laser marking cell
- Module — infeed conveyor
- Sub-module — conveyor drive: belt, geared motor, pulleys, tensioner
- Sub-module — part presence: through-beam photoelectric sensor, bracket
- Module — lift-and-locate station: cylinder, locating pins, clamp, proximity sensors
- Module — laser process module
- Sub-module — source and delivery: fiber laser, beam expander, galvo head, F-theta lens
- Sub-module — focus axis: servo Z-stage, displacement sensor
- Sub-module — fume extraction: nozzle, duct, filter unit
- Module — vision verification: camera, lens, ring light
- Module — outfeed and reject: diverter, reject bin with full sensor
- Module — enclosure and safety: Class 1 enclosure, interlocked doors, E-stop circuit
- Module — electrical and control: panel, PLC, drives, safety relay, power distribution
- Module — software and MES interface

| Subsystem | Function | Typical failure if neglected |
|---|---|---|
| Structure | Carry loads, hold geometry, damp vibration | Drift in accuracy with temperature or load |
| Material handling | Load, transfer, orient, buffer, unload | Jams, misfeeds, cycle-time loss |
| Positioning and motion | Move tool or part to the process point | Position error, settling time overrun |
| Process | Add value (mark, weld, cut, dispense) | Yield loss, process drift |
| Sensing and inspection | Confirm state and quality | Escapes, false rejects |
| Control | Sequence, interlock, recover | Deadlocks, unsafe restarts |
| Safety | Protect people, product and machine | Injury, certification failure |
| Information | Recipes, traceability, OEE | Untraceable product, SAT failure |

### 1.4 Components

Components are selected in Books II–VI and the Component Selection Handbook (Part 55). At this stage, record only component classes per subsystem: structure type, handling principle, actuator family, process source, sensor family, controller class and safety architecture.

### 1.5 Design methodology — classify in five questions

- How many variants, and how often does the product change? → dedicated, programmable or flexible.
- What UPH is required against manual capability? → level of automation (calculation below).
- What accuracy and repeatability does the CTQ need? → standard or precision class.
- What environment applies — cleanroom, ESD, battery dry room, food, explosive atmosphere? → category and standards set.
- Is the process already validated? → if not, build a lab cell or process bench before quoting a production machine.

### 1.6 Calculations

Operators required for a manual process

N_(op)=(UPH⋅t_(manual))/(3600⋅η_(op))

N_op = operators per shift; UPH = required units per hour; t_manual = manual cycle time per unit (s); η_op = operator efficiency (0.80–0.90 typical, covering fatigue and allowances).

Worked example: 1,200 UPH, manual marking cycle 9 s, η_op = 0.85 → N_op = 1,200 × 9 / (3,600 × 0.85) = 3.53 → 4 operators per shift, 12 across three shifts.

Simple payback

PB=(C_(capex))/(S_(labour)+S_(quality)+S_(throughput)−C_(opex,added))

Worked example (indicative): automatic cell at ₹85 lakh replaces 12 operators with 3 (one per shift) → 9 FTE × ₹4.8 lakh = ₹43.2 lakh/yr; scrap falls 0.8% on 3.0 million units at ₹60 each = ₹14.4 lakh/yr; added power and maintenance ₹3.0 lakh/yr. PB = 85 / (43.2 + 14.4 − 3.0) = 1.56 years.

Sanity check: payback below 3 years is the usual trigger for automatic over semi-automatic in Indian electronics and automotive plants; below 1 year, question the savings assumptions.

### 1.7 Industrial example — classifying three incoming requests

| Request | Level | Type | Category | Precision | Consequence |
|---|---|---|---|---|---|
| Mark 40 automotive SKUs at 300 UPH | Semi-automatic | Programmable | SPM on standard marker platform | Standard (±100 µm) | Rotary two-station table, recipe per SKU, operator loads |
| Weld busbars on cylindrical-cell modules at 40 modules/h | Automatic | Dedicated per module family | Production equipment | Precision (±30 µm seam) | Pallet conveyor, vision-guided galvo welding, MES genealogy |
| Mark 300 mm wafers at 60 wafers/h | Automatic | Programmable | Semiconductor equipment | Precision (±20 µm) | EFEM with FOUP load ports, pre-aligner, SEMI S2, SECS/GEM |

### 1.8 Design trade-offs

| Choice | Gain | Cost |
|---|---|---|
| Semi-automatic over automatic | 40–70% lower capex, faster delivery, simpler validation | Operator cost, variability, lower UPH ceiling |
| Dedicated over flexible | Lowest cycle time and unit cost at volume | Stranded asset when the product changes |
| Flexible over programmable | Mixed-model flow, future-proof | Higher capex, more vision and software risk |
| Standard platform over SPM | Proven reliability, 30–50% shorter lead time | May not reach the last 10% of the requirement |

### 1.9 Common mistakes

- Quoting an automatic machine for a process nobody has validated at rate.
- Treating "flexible" as free: every variant adds fixture, recipe, vision and validation effort.
- Ignoring changeover time in UPH; a 30-minute changeover four times a day costs 8% of a 24-hour day.
- Designing to Level 2 and discovering at SAT that the customer needed Level 3 genealogy.

### 1.10 Troubleshooting (classification errors)

| Symptom after delivery | Likely classification error | Test | Correction | Prevention |
|---|---|---|---|---|
| Changeover takes hours | Dedicated chosen for a programmable need | Log changeovers per week vs plan | Quick-change fixtures, recipe-driven axes | Ask variant count and change frequency at G0 |
| Operators cannot keep pace | Semi-automatic chosen above manual ceiling | Time study of load/unload | Add automatic loading or second station | Run the operator calculation at G0 |
| Customer rejects data at SAT | Level 3 needs ignored | Compare MES spec with delivered data | Add MES interface, data dictionary | Freeze data model at G2 |

### 1.11 Design checklist

- Level, type, category and precision class recorded and agreed with the customer
- Variant count, changeover frequency and target changeover time documented
- Operator calculation and payback run with customer figures
- Process validation status known (validated / lab data / unknown)
- Automation hierarchy levels in scope confirmed, including MES and ERP boundaries
- Five-level product hierarchy drafted for the concept
- Environment class (cleanroom, ESD, dry room) and applicable standards identified

### 1.12 Key takeaways

- Automation means the machine senses and decides inside its cycle; size it differently from mechanization.
- Variant count and changeover frequency decide dedicated vs programmable vs flexible.
- The builder owns ISA-95 levels 0–2 and the interface to level 3.
- Fix the machine → module → sub-module → assembly → component hierarchy early; everything downstream hangs on it.
