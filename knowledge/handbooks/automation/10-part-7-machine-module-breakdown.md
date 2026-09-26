---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 10
part_title: "Part 7 — Machine module breakdown"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 7 — Machine module breakdown

A module is a unit with one function, one owner, defined interfaces and its own test. Breaking the machine into the 18 standard modules below turns one large design problem into parallel, testable work packages, and gives the BOM, spares list and service manual their structure.

### 7.1 Objective

Produce a module list where every module has a specification sheet (function, inputs, outputs, components, interfaces, failure modes, design considerations, validation method), an owner and a share of the machine's cycle-time, error and reliability budgets.

### 7.2 Engineering concept

Good modules have high internal cohesion (everything inside serves one function) and low external coupling (few, standard interfaces). A module boundary should also be a physical boundary for assembly, test, shipping and replacement wherever possible.

### 7.3 Architecture — the 18 standard modules

Function, inputs, outputs, components

| # | Module | Function | Inputs | Outputs | Typical components |
|---|---|---|---|---|---|
| 1 | Base frame | Carry and align all modules; isolate vibration | Loads, floor | Stable reference plane | Welded frame, machined plates, levelling feet, isolators |
| 2 | Loading | Bring one part per cycle into the machine | Parts in bulk, trays, conveyor | Singulated, oriented part | Conveyor, stopper, tray stacker, bowl feeder, robot |
| 3 | Unloading | Remove and sort processed parts | Processed part, OK/NOK result | Sorted parts, reject bin | Diverter, pick-and-place, reject chute with full sensor |
| 4 | Transfer | Move parts between stations | Part at station n | Part at station n+1 | Shuttle, rotary indexer, pallet conveyor, walking beam |
| 5 | Fixture | Locate the part on its datums | Part, datum scheme | Part in known position | Nest, locating pins, rest pads, poka-yoke |
| 6 | Clamping | Hold the part against process forces | Located part, clamp command | Clamped part, confirmation | Pneumatic clamps, vacuum, magnets, springs |
| 7 | Motion | Position part or tool | Command profile | Position within tolerance | Servo axes, ball screws, linear motors, guides |
| 8 | Process | Add value | Positioned part, recipe | Processed part, process data | Laser, galvo, dispenser, press, weld head |
| 9 | Vision | Locate or verify with images | Trigger, image | Offsets, pass/fail, measurements | Camera, lens, lighting, processor |
| 10 | Inspection | Measure CTQs | Processed part | Measurement, verdict | Gauges, displacement sensors, leak testers |
| 11 | Robot | Flexible handling or process motion | Program, target poses | Moved part or tool | Robot arm, controller, EOAT |
| 12 | Pneumatic | Distribute compressed air and vacuum | CDA supply | Controlled actuation | FRL, valve terminal, tubing, vacuum generators |
| 13 | Electrical | Distribute power and signals | Mains supply | Protected power, wiring | Isolator, breakers, PSUs, drives, terminals |
| 14 | Safety | Protect people and equipment | Guard and device states | Safe stop, safe states | Guards, interlocks, light curtains, safety PLC |
| 15 | HMI | Let people run and service the machine | Operator actions | Commands, displayed status | Touch panel, buttons, stack light |
| 16 | Utilities | Supply and remove media | Site utilities | Conditioned media, extraction | Chiller, fume extractor, N₂, CDA dryer |
| 17 | Traceability | Identify and record each part | Part ID, process data | Genealogy record | Code reader, RFID, printer, database |
| 18 | MES interface | Exchange orders, recipes and results | MES messages | Records, status, alarms | OPC UA, SECS/GEM, database connectors |

Interfaces, failure modes, design considerations, validation

| # | Module | Key interfaces | Dominant failure modes | Design considerations | Validation method |
|---|---|---|---|---|---|
| 1 | Base frame | All modules, floor | Deflection, resonance, weld distortion | Stiffness, stress-relief before machining, lifting points | Flatness survey, modal tap test |
| 2 | Loading | Upstream line, transfer | Jam, double feed, wrong orientation | Part-specific guides, orientation sensing | 1,000-cycle jam test |
| 3 | Unloading | Transfer, downstream, MES verdict | Mix of good and reject | Positive confirmation of reject | Forced-reject test on 100 parts |
| 4 | Transfer | Stations, controls | Position loss, collision | Index accuracy, crash protection | Repeatability test, E-stop mid-move |
| 5 | Fixture | Part, process, vision | Wrong seating, wear, contamination | 3-2-1 datums, wear inserts, chip relief | Repeatability study, 30 reloads |
| 6 | Clamping | Fixture, pneumatic, safety | Insufficient force, no confirmation | Force ≥ 2× process force, sensing | Force gauge, pressure-loss test |
| 7 | Motion | Structure, drives, controls | Following error, overheating, crash | Sizing margins, limits, brakes | Accuracy map, thermal run |
| 8 | Process | Motion, utilities, safety, MES | Process drift, source failure | Monitoring, calibration access | Capability study, OQ |
| 9 | Vision | Motion, process, lighting, controls | False reject, missed defect, calibration drift | Lighting control, calibration target | GR&R, known-defect challenge set |
| 10 | Inspection | Process, MES | Measurement drift | Reference masters, auto-check | GR&R, daily master check |
| 11 | Robot | Fixture, EOAT, safety, controls | Collision, TCP drift, drop | Reach, payload margin, safe zones | Cycle and TCP check, drop test |
| 12 | Pneumatic | Clamps, actuators, electrical | Leaks, pressure drop, valve failure | Valve sizing, pressure switches, dump valve | Leak test, pressure-decay |
| 13 | Electrical | Everything | Overheating, noise, earth faults | Segregation, earthing, heat budget | Continuity, insulation, earth-bond tests |
| 14 | Safety | Guards, drives, laser, pneumatic | Defeated interlock, wrong PL | Risk assessment, validation plan | Safety function validation |
| 15 | HMI | Controls, people | Operator error, hidden alarms | Alarm philosophy, user levels | Usability walk-through |
| 16 | Utilities | Site, process | Chiller or extractor fault | Flow and temperature interlocks | Utility fault simulation |
| 17 | Traceability | Reader, MES, labels | No-read, duplicate ID | Read verification, duplicate check | Read rate over 1,000 parts |
| 18 | MES interface | Customer IT | Lost records, timeouts | Buffering, acknowledgements | Offline/online recovery test |

### 7.4 Components — the module specification sheet

Every module gets a one-to-three-page sheet with these headings: module ID and owner; function; inputs and outputs with values; allocated budgets (cycle time, error, reliability, power, air, heat); components and key selections; interfaces with ICD references; failure modes (link to DFMEA); design considerations; validation method and acceptance criteria; spares and maintenance points. The template is in Book XII.

### 7.5 Design methodology

- Start from the process flow; each step becomes at least one module.
- Add the enabling modules every machine needs (frame, electrical, pneumatic, safety, HMI, utilities, traceability, MES).
- Merge modules only when they share a function and an owner; split when one module carries two unrelated functions.
- Allocate cycle-time, error and reliability budgets to each module.
- Write the module sheets and link each interface to the N² matrix.
- Define each module's stand-alone test so it can be proven before integration.

### 7.6 Calculations — allocating the reliability budget

Modules in a machine behave as a series system: any module stop stops the machine.

λ_(machine)=∑_i^​ λ_i

MTBF_(machine)=(1)/(λ_(machine))

R(t)=e^(−λ_(machine)t)

λ_i = stop rate of module i (stops/h), including jams and nuisance stops; R(t) = probability of running t hours without a stop.

Worked example: Part 4 requires MTBF ≥ 172 min = 2.87 h → λ_machine ≤ 0.348 stops/h. Allocate it where stops really happen:

| Module group | Share | Allowed stop rate (stops/h) | Allowed MTBF per module group (h) |
|---|---|---|---|
| Loading and unloading | 35% | 0.122 | 8.2 |
| Transfer and fixture | 15% | 0.052 | 19.2 |
| Vision and traceability (retries, no-reads) | 15% | 0.052 | 19.2 |
| Process module | 10% | 0.035 | 28.7 |
| Motion and robot | 10% | 0.035 | 28.7 |
| Pneumatic, electrical, utilities | 10% | 0.035 | 28.7 |
| Safety and HMI (nuisance trips) | 5% | 0.017 | 57.5 |
| Total | 100% | 0.348 | 2.87 |

The loading module may stop at most once every 8.2 hours — a demanding target for a feeder, which is why feeder trials with real parts belong before Gate 2.

### 7.7 Industrial example — module list for the laser marking shuttle

| ID | Module | Owner | Cycle budget (s) | Error budget (mm) | Stand-alone test |
|---|---|---|---|---|---|
| M01 | Base frame and mounting plate | Mechanical | — | 0.02 flatness | Flatness survey |
| M02 | Operator load station with light curtain | Mechanical | 4.1 (operator) | — | Ergonomic trial |
| M04 | Servo shuttle with two nests | Mechanical + controls | 1.0 | 0.02 repeatability | 500-cycle repeatability |
| M05 | Nest with datum pins, two variants | Mechanical | — | 0.05 | 30 reloads per variant |
| M06 | Pneumatic clamp with confirmation | Mechanical | 0.2 | — | Force and sensing check |
| M08 | Laser marking head with Z focus | Process | 3.5 | 0.10 | Mark quality and position grid |
| M09 | DPM vision verification | Vision | 0.8 | — | Grade correlation with offline verifier |
| M13 | Electrical panel | Electrical | — | — | Panel test: continuity, insulation, function |
| M14 | Enclosure and interlocks | Safety | — | — | Safety function validation |
| M18 | OPC UA MES interface | Software | 0.1 | — | Simulated MES test |

### 7.8 Design trade-offs

| Trade-off | Fine-grained modules | Coarse modules |
|---|---|---|
| Parallel design | More engineers in parallel | Fewer handovers |
| Interfaces | More interfaces to manage | Fewer interfaces |
| Reuse | Higher reuse across machines | Lower reuse |
| Test | Early stand-alone tests | Test only at integration |

### 7.9 Common mistakes

- Modules defined by who is available, not by function.
- No stand-alone test, so the first test of a module happens at integration.
- Reliability budget never allocated; the feeder becomes the machine's MTBF.
- Module boundaries that do not match shipping splits, forcing disassembly of calibrated assemblies.

### 7.10 Troubleshooting — locating faults by module

| Symptom | First module suspects | Isolation test | Typical root cause | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Intermittent stops, no alarm | Loading, sensors | Stop-reason logging per module | Sensor chattering, part bounce | Debounce, sensor relocation | Log stop reasons from day one |
| Mark position shifts between nests | Fixture, transfer | Mark both nests on a grid plate | Nest-to-nest offset not calibrated | Per-nest offsets | Per-nest calibration in procedure |
| Good parts in reject bin | Unloading, vision | Forced-good and forced-reject test | Diverter timing, verdict latency | Confirm diverter position before release | Positive reject confirmation |

### 7.11 Design checklist

- Every process step maps to at least one module
- All 18 standard module types considered; omissions justified
- Each module has one owner and a specification sheet
- Cycle-time, error and reliability budgets allocated to modules
- Each module has a stand-alone test with acceptance criteria
- Module boundaries match assembly, shipping and replacement units

### 7.12 Key takeaways

- One function, one owner, defined interfaces, one test — that is a module.
- Allocate the machine's MTBF to modules; loading and feeding usually dominate.
- Module sheets are the backbone of BOM, spares and service documentation.
- Test modules alone before integrating them.
BOOK II
