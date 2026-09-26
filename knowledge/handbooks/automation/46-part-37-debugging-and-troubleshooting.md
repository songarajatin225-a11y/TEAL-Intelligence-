---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 46
part_title: "Part 37 — Debugging and troubleshooting"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 37 — Debugging and troubleshooting

Debugging is a measurement discipline, not a guessing game: state the problem precisely, collect evidence before touching anything, test one hypothesis at a time with a measurement that can prove it wrong, fix the root cause, and verify that the symptom is gone and stays gone. Most wasted debugging days come from changing several things at once.

### 37.1 Objective

Give every engineer and technician one systematic method, the tools to apply it, and worked cases for the ten most common machine faults.

### 37.2 Engineering concept — the method

- Problem. Describe what, where, when, how often, since when — and what it is not (is / is-not analysis).
- Evidence. Collect alarms, logs, traces, photos, parameter and software versions, recent changes. Do not reset or change anything before capturing it.
- Hypothesis. List plausible causes (Ishikawa: machine, method, material, measurement, environment, people); rank by likelihood and ease of testing.
- Measurement. Design a test that can disprove the top hypothesis; change one variable at a time.
- Root cause. Ask "why" until you reach a cause you can control (5 Whys); confirm it by switching the fault on and off.
- Corrective action. Fix the root cause, not the symptom; document the change through ECR/ECN.
- Verification. Show the symptom is gone over enough cycles to be statistically meaningful; if not, return to step 3.
- Prevention. Update design rules, checklists, FMEA and training so it does not recur elsewhere.

### 37.3 Architecture — tools

| Tool | Use |
|---|---|
| Is / is-not table | Bound the problem: which machine, station, part, shift, time |
| Ishikawa (fishbone) | Structure hypotheses by category |
| Half-split (binary search) | Isolate a fault in a chain of components or signals |
| PLC trace and data logging | Time-correlate signals around the event |
| Drive scope and diagnostics | Following error, torque, current, bus voltage |
| Network diagnostics | Error counters, topology, capture |
| High-speed video | Mechanical events faster than the eye |
| Swap test | Exchange suspected component with a known-good one |
| Fault tree | Complex, safety-relevant or intermittent failures |
| 8D report | Documentation and closure with the customer (Part 43) |

### 37.4 Components — evidence to capture before any change

- Alarm history with timestamps and first-out alarm
- PLC and drive traces around the event
- Software and parameter versions (compare with released)
- Recent changes: maintenance, parts, recipes, material lots, people
- Environmental conditions: temperature, supply voltage, air pressure
- Photos or video of the physical state

### 37.5 Design methodology — designing machines that are easy to debug

- Timestamp every step and state transition in the PLC.
- Log first-out alarms and machine states to the edge PC.
- Provide trace buffers triggered by alarms.
- Make I/O and IO-Link diagnostics visible on the HMI.
- Design test points and service positions.
- Keep parameter and software backups with version numbers on the HMI.

### 37.6 Calculations

n_(half-split)=⌈log_2N⌉

n_(verify)≥(ln(1−C))/(ln(1−p_0))

n_half-split = maximum tests to isolate one faulty element among N in a chain; n_verify = number of consecutive fault-free cycles needed to claim, with confidence C, that the fault rate is now below p₀. Examples: 64 wires in a harness need at most 6 half-split tests. To show with 95% confidence that a jam rate that used to be 1 in 200 cycles is now below 1 in 1,000, run ln(0.05) / ln(0.999) ≈ 3,000 consecutive cycles without a jam — not 50.

### 37.7 Industrial examples — ten worked cases

| Case | Symptom and evidence | Hypotheses tested (in order) | Decisive measurement | Root cause | Correction and verification |
|---|---|---|---|---|---|
| 1. Servo fault | Shuttle drive overload alarm after 2 h; only in afternoons | Undersized motor; friction rising; thermal | Friction torque traverse at start vs after 2 h | Rail preload plus thermal growth of frame increasing friction | Realigned rails with correct preload; 3-day run with torque log flat |
| 2. Sensor failure | Random "part not seated" stops, 3–4 per shift | Part variation; sensor range; vibration | IO-Link signal margin during cycles | Sensor at 95% of range; vibration crossing threshold | Moved sensor closer, margin 40%; 3,000 cycles without stop |
| 3. PLC fault | CPU stops monthly with watchdog error | Hardware; scan overload; memory | Task scan-time maximum logging | MES retry loop in cyclic task when network slow | Moved MES comms to background task; no stop in 2 months |
| 4. Communication failure | Drives drop off EtherCAT when laser fires | Cable; EMC; firmware | Error counters by port vs laser trigger | Laser head cable routed with EtherCAT in one chain, shield not clamped | Segregated cables, 360° shield clamps; zero errors over 10,000 marks |
| 5. Vision failure | Code reader no-reads rise from 0.1% to 3% on night shift | Mark quality; lighting; lens | Grade distribution day vs night; ambient light | Overhead lamps switched on at night reflecting into reader | Shroud and polarizer; no-reads back to 0.1% |
| 6. Pneumatic failure | Clamp timeout alarms at shift start | Valve; leak; pressure | Pressure log at machine inlet | Plant compressor sequencing leaves 4.3 bar for 10 min | Local receiver and pressure switch interlock; plant fixed sequencing |
| 7. Laser failure | Code contrast falls over a week | Source power; focus; window | Power at work plane; window inspection | Protective window fogged by oily air knife | Coalescing filter, oil-free branch, window change interval; contrast stable |
| 8. Cycle-time issue | CT 6.1 s vs 5.3 s design | Motion; waits; communication | PLC timestamps per step over 100 cycles | Clamp confirmation waited on a 300 ms filter, MES write synchronous | Filter 20 ms, asynchronous MES write; CT 5.2 s |
| 9. Repeatability issue | Mark position scatter ±0.08 mm vs ±0.04 mm expected | Pin clearance; galvo drift; part height | 30 reloads of one part; height sensor data | Part lifting on one pad because a burr on the casting | Burr check in incoming; pad relief groove; scatter ±0.035 mm |
| 10. Safety fault | Guard-locking discrepancy alarm, several per week | Switch failure; wiring; door alignment | Channel timing in safety PLC diagnostics | Door sagging; actuator entering off-centre | Hinge adjustment and door stop; discrepancy alarms stopped |

### 37.8 Design trade-offs

| Trade-off | Quick fix | Root-cause fix | Guidance |
|---|---|---|---|
| Speed of restart | Minutes | Hours to days | Contain with a quick fix, then always complete the root-cause fix |
| Parameter change vs design change | Easy, reversible | Permanent, costly | Parameter only if the root cause is a parameter |
| Swap parts vs measure | Fast, costly in spares, may hide cause | Slower, reveals cause | Measure first; swap to confirm |

### 37.9 Common mistakes

- Resetting before capturing evidence.
- Changing several parameters at once.
- Declaring victory after 50 good cycles for a 1-in-500 fault.
- Replacing parts until the symptom disappears, without knowing why.
- Fixing the machine but not the design rule, so the next machine repeats it.

### 37.10 Troubleshooting the troubleshooting

| Symptom | Possible causes | Corrective action |
|---|---|---|
| Fault "disappears" when observed | Intermittent, condition-dependent | Log continuously; reproduce the conditions (temperature, shift, material lot) |
| Two teams blame each other's subsystem | Interface fault | Measure at the interface with both teams present |
| Fix works on one machine only | Unit-to-unit variation | Compare as-built records and parameters between machines |

### 37.11 Design checklist

- Problem statement with is / is-not recorded
- Evidence captured before changes
- Hypotheses listed and tested one at a time
- Root cause confirmed by switching the fault on and off
- Verification run long enough for the original fault rate
- Design rules, FMEA and checklists updated

### 37.12 Key takeaways

- Evidence first, then hypotheses, then measurements — one variable at a time.
- Verify for a number of cycles that matches the original fault rate.
- Build machines that record their own history.
- Every root cause should change a rule, not just a machine.
