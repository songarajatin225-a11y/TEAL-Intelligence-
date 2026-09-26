---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 25
part_title: "Part 19 — PLC engineering"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 19 — PLC engineering

Choose the PLC from a chain of requirements — I/O, scan time, motion, communication, safety, processing, expansion, lifecycle, serviceability, cost — never from brand habit. Structure the program in layers (I/O mapping, device blocks, module sequences, machine state manager) so every cylinder, axis and sensor is handled once, the same way, with timeouts and alarms built in.

### 19.1 Objective

Select the controller hardware and structure the PLC software so it is deterministic, readable by the customer's technicians, reusable across machines, and fault-tolerant.

### 19.2 Engineering concept

A PLC executes a cyclic scan: read inputs → execute program → write outputs → communication and housekeeping. Modern controllers add prioritized tasks: fast cyclic tasks (motion, 1–4 ms), normal cyclic tasks (sequence, 5–20 ms), event tasks (hardware interrupts) and background tasks (data, MES).

t_(response,max)=t_(in delay)+2 t_(scan)+t_(out delay)

An input that changes just after the input image is read waits a full scan to be seen and another to act on, so worst-case reaction is about two scans plus I/O delays.

### 19.3 Architecture

| Element | Function | Specify |
|---|---|---|
| CPU | Executes logic and motion | Scan performance, memory, number of axes, task model |
| Digital inputs / outputs | 24 V discrete signals | Count, sourcing/sinking, speed, output current |
| Analogue inputs / outputs | Continuous values | Range, resolution (bits), isolation, update rate |
| High-speed counters | Encoder or pulse counting beyond scan rate | Frequency, latch and compare functions |
| Motion modules / integrated motion | Axis control | Axes, interpolation, cams, fieldbus cycle |
| Safety controller | Safety functions to PL d/e or SIL 2/3 | Safe I/O count, safe fieldbus, certification |
| Communication | Fieldbus masters, OPC UA server, serial | Protocols, bandwidth, security features |
| Remote I/O | I/O close to sensors | IP rating, fieldbus, diagnostics |

Program layers

| Layer | Contents | Rule |
|---|---|---|
| I/O mapping | Physical addresses mapped to named tags | Only place where addresses appear |
| Device layer | One function block per device type: cylinder, gripper, axis, sensor, vacuum, laser interface | Each block owns its timeouts, plausibility and alarms |
| Module layer | Sequence of each module (shuttle, loader, laser station) | Written as a state machine with explicit transitions |
| Machine layer | Mode and state manager, recipe, counters | One owner for Auto, Manual, Maintenance |
| Interfaces | HMI, MES, safety status, robot, vision | Defined data structures, versioned |

### 19.4 Components — the PLC selection chain

| Driver | Question | What it decides |
|---|---|---|
| I/O count | How many DI, DO, AI, AO, with 20% spare? | CPU class, number of modules or remote stations |
| Scan time | What is the fastest event that software must react to? | CPU performance, high-speed I/O, task design |
| Motion | How many axes, interpolation, cams, synchronization? | Integrated motion vs separate controller |
| Communication | Which fieldbus, MES protocol, robot and vision links? | Interfaces, number of connections |
| Safety | How many safety functions and which PL/SIL? | Safety relays vs safety PLC, safe fieldbus |
| Processing | Data handling, recipes, math, vision results? | PLC vs IPC |
| Expansion | Will the platform grow (more stations, variants)? | Headroom in CPU and network |
| Network | Topology, segmentation, security | Switches, firewalls, VLANs |
| Software | Programming environment, libraries, version control | Engineering productivity, reuse |
| Lifecycle | Product availability for 10+ years | Avoid end-of-life ranges |
| Serviceability | Local support, spares in India, technician familiarity | Customer acceptance, downtime |
| Cost | Hardware, licences, engineering | Total cost, not list price |

### 19.5 Design methodology — programming

IEC 61131-3 languages and where each fits

| Language | Strength | Best use |
|---|---|---|
| Ladder Diagram (LD) | Readable by electricians, great online monitoring | Interlocks, simple discrete logic, safety-relay-style logic |
| Function Block Diagram (FBD) | Signal flow, reusable blocks | Analogue processing, safety programs (commonly FBD) |
| Structured Text (ST) | Algorithms, loops, data handling, state machines | Device blocks, calculations, recipes, communication |
| Sequential Function Chart (SFC) | Visual step-transition sequences | Module sequences where technicians need to see the active step |
| Instruction List (IL) | Legacy | Deprecated; do not use for new work |

Use ST inside device blocks, a state machine (ST or SFC) for sequences, and LD only where maintenance staff will read it. PLCopen motion function blocks (MC_Power, MC_Home, MC_MoveAbsolute and others) give a vendor-neutral axis interface.

Device block example — cylinder with timeout and plausibility (Structured Text)

| FUNCTION_BLOCK FB_Cylinder VAR_INPUT xCmdExtend : BOOL; // request from the module sequence xSnsExtended : BOOL; // end-position sensor xSnsRetracted: BOOL; tTimeout : TIME := T#1S; xReset : BOOL; END_VAR VAR_OUTPUT xValve : BOOL; // valve coil (monostable, spring = retract) xExtended : BOOL; // confirmed state for the sequence xRetracted : BOOL; xFault : BOOL; nAlarm : INT; // 0 none, 1 extend timeout, 2 retract timeout, 3 both sensors END_VAR VAR tonMove : TON; END_VAR  xValve := xCmdExtend AND NOT xFault; xExtended := xSnsExtended AND NOT xSnsRetracted AND xCmdExtend; xRetracted := xSnsRetracted AND NOT xSnsExtended AND NOT xCmdExtend; tonMove(IN := (xCmdExtend AND NOT xExtended) OR (NOT xCmdExtend AND NOT xRetracted), PT := tTimeout);  IF xSnsExtended AND xSnsRetracted THEN xFault := TRUE; nAlarm := 3; // impossible state: sensor or wiring fault ELSIF tonMove.Q THEN xFault := TRUE; nAlarm := SEL(xCmdExtend, 2, 1); END_IF;  IF xReset AND NOT tonMove.Q AND NOT (xSnsExtended AND xSnsRetracted) THEN xFault := FALSE; nAlarm := 0; END_IF; END_FUNCTION_BLOCK |
|---|

The sequence never reads the raw sensors; it waits for xExtended or xRetracted, so timeouts and plausibility are handled identically for all 30 cylinders on the machine.

Interlocks. Write permissives per action in one place and show them on the HMI. Example for the shuttle:

| Action | Permissives (all true) | Reason |
|---|---|---|
| Shuttle move | Both nests clamped or empty-confirmed; Z-axis at safe height; laser not emitting; operator-side light curtain clear or muting condition valid | Prevent collision, marking a moving part, or trapping a hand |
| Laser emission | Enclosure doors closed and locked; nest at laser position and in-position; clamp confirmed; extraction running | Class 1 operation, process quality, fume control |
| Unclamp at laser nest | Marking complete or aborted; shuttle stationary | Do not release during processing |

Alarms. Each alarm has an ID, class, message, probable cause and remedy text. Use three classes — stop immediately, stop at end of cycle, warning — and record the first-out alarm so cascades do not hide the root cause.

Fault recovery. Every module sequence must be able to restart from any step after a fault: each step records its entry conditions, and a recovery routine drives devices back to a known state (Part 20).

### 19.6 Calculations

N_(I/O,installed)=⌈1.2⋅N_(I/O,used)⌉

t_(scan)≤(t_(event,min))/(2)

Example: the marking cell uses 86 DI, 44 DO, 6 AI, 2 AO → install at least 104 DI, 53 DO, 8 AI, 3 AO (rounded up to module sizes). The fastest software-handled event (light-curtain muting window of 40 ms) needs t_scan ≤ 20 ms, easily met; faster events (camera triggers) go to hardware (Part 13).

### 19.7 Industrial example — controller choice for the marking cell

| Requirement | Value | Consequence |
|---|---|---|
| I/O | ~140 points plus IO-Link | PLC with local I/O plus one remote IO-Link station on the shuttle |
| Axes | 2 servo + galvo (separate scanner card) | Integrated motion over EtherCAT is sufficient |
| Safety functions | Doors, light curtain, E-stops, laser emission, STO | Safety PLC or integrated safety CPU with safe fieldbus |
| Data | OPC UA server, 25,000-record buffer | CPU with OPC UA; buffer in PLC memory or on the IPC |
| Service in India | Customer technicians trained on one brand | Choose the customer's standard brand where possible |

### 19.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| PLC vs industrial PC | Deterministic, robust, long lifecycle, familiar to technicians | Heavy computing, vision, data, many axes, modern software practice | PLC for sequence and safety; IPC when vision, data or kinematics dominate (often both, split by role) |
| Ladder vs Structured Text | Readable for maintenance | Compact, powerful, testable | ST in device blocks and state machines; LD for interlock views |
| Integrated vs separate safety PLC | One engineering tool, shared network | Clear separation, simpler validation for some teams | Integrated for most new machines; keep safety code in its own protected program |
| Customer brand vs builder brand | Customer can maintain it | Builder reuses its libraries | Negotiate at G0; platform machines need a standard brand |

### 19.9 Common mistakes

- Raw sensor bits used throughout the sequence, each with a different timeout.
- Interlocks scattered through hundreds of rungs; nobody can list them.
- Forcing I/O during commissioning and forgetting to remove the forces.
- No first-out alarm; the operator sees 20 consequential alarms.
- Program versions not controlled; the SAT machine runs a laptop copy.

### 19.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| CPU stops with watchdog | Scan time exceeded, endless loop | Scan-time diagnostics, task load | Maximum scan per task | Split tasks, optimize loops | Task design, load test at integration |
| Sequence hangs at one step | Missing transition condition, sensor not confirming | Online view of active step and permissives | Which condition is false | Fix sensor or logic; add timeout alarm | Timeouts on every step |
| I/O module fault | Power, bus, short on outputs | Module diagnostics LEDs and buffer | Fault code | Replace module, fix short | ECB-protected output groups |
| Behaviour differs from last week | Unauthorized program change | Compare online program with archived version | Diff | Restore controlled version | Version control and access levels |
| Communication timeout to HMI or MES | Network load, IP conflict | Ping, network capture | Latency, errors | Fix addressing, segment network | Network plan (Part 22) |

### 19.11 Design checklist

- Controller chosen through the 12-driver selection chain
- I/O list with 20% spare; addresses only in the mapping layer
- Device blocks for every device type, each with timeout, plausibility and alarms
- Module sequences as state machines; recovery from every step
- Interlock matrix documented and displayed on the HMI
- Alarm list with classes, first-out, cause and remedy text
- Task model and scan times verified under full load
- Program under version control; release numbering on HMI

### 19.12 Key takeaways

- Pick the controller from requirements, then from what the customer can maintain.
- Layer the program: mapping, devices, modules, machine.
- One device block per device type makes every cylinder behave and fail the same way.
- Interlocks and alarms are designed artefacts, not by-products of coding.
