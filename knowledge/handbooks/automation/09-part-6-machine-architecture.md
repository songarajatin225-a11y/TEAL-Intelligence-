---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 9
part_title: "Part 6 — Machine architecture"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 6 — Machine architecture

Architecture is the set of decisions that are expensive to change later: how the machine divides into subsystems, how they connect, and which budgets each must respect. Freeze it at Gate 2 as six views, one N² interface matrix and seven budgets.

### 6.1 Objective

Define the machine's structure, interfaces and budgets so that every discipline can design in parallel without surprises at integration.

### 6.2 Engineering concept

A machine exchanges three kinds of flow between its subsystems. Each flow crossing a boundary is an interface that must be specified, owned and tested.

| Flow | Examples | Interface specified by |
|---|---|---|
| Material | Part, tray, carrier, scrap, fume | Datums, transfer heights, orientation, handover timing |
| Energy | Electrical, pneumatic, hydraulic, thermal, optical (laser beam) | Voltage, current, pressure, flow, heat load, beam path |
| Information | Discrete signals, analogue values, fieldbus data, recipes, MES records | I/O list, tag list, protocol, timing, data dictionary |

### 6.3 Architecture — the reference framework

*Figure 4. Machine architecture · 4 subsystems, 16 elements, 6 interface types* — [Figure not transcribed; see source document]

The four pillars are designed by different people; the interface band is where machines fail, so it gets its own owner (the system engineer) and its own document (the interface control document).

| Architecture view | Question it answers | Main artefact | Owner |
|---|---|---|---|
| Functional | What must the machine do, in what order? | Function tree, process flow, state machine | System engineer |
| Physical | Where does each module sit and how is it built? | Layout, module list, GA drawing | Mechanical lead |
| Control | Which controller does what, over which network? | Control architecture diagram, network topology | Controls lead |
| Safety | Which hazards, which safety functions, which PL? | Risk assessment, safety function list | Safety engineer |
| Data | Which data is created, stored, sent where? | Data dictionary, MES interface spec | Software lead |
| Utility | What does the machine consume and emit? | Utility requirement sheet | System engineer |

### 6.4 Components — the interface matrix (N²)

Put subsystems on the diagonal; each off-diagonal cell names what flows from the row to the column. Empty cells are deliberate; unknown cells are risks.

| From ↓ / To → | Mechanical | Electrical | Controls | Process | Safety |
|---|---|---|---|---|---|
| Mechanical | — | Motor and sensor mounts, cable-chain routing | Axis limits, home positions | Part datum, focal plane, standoff | Guard positions, door switches |
| Electrical | Heat load, cable mass | — | I/O and drive signals | Laser power supply, interlock loop | Safety circuit wiring |
| Controls | Motion commands | Contactor and valve commands | — | Recipe, trigger, synchronization | Reset, status monitoring |
| Process | Reaction forces, heat, fume, spatter | Power demand | Process status, measured values | — | Laser hazard, fume hazard |
| Safety | Guard locking | Power removal (STO, contactors) | Safe states, stop categories | Laser shutter and emission stop | — |

### 6.5 Design methodology

- Draw the functional architecture from the process flow and the state machine.
- Allocate functions to physical modules; each module gets one owner.
- Choose the control architecture (6.8) and draw the network topology.
- Build the N² matrix and write an interface control document for every non-empty cell.
- Set the seven budgets (6.6) and allocate each to modules.
- Review the safety concept and data architecture with the customer.
- Freeze at Gate 2; later changes to an interface go through change control.

### 6.6 Calculations — architecture budgets

| Budget | Top-level value from | Allocated to | Checked at |
|---|---|---|---|
| Cycle time | CT_ideal (Part 4) | Every motion and process step | Time chart, FAT run-at-rate |
| Error (accuracy) | Position CTQ | Fixture, axes, thermal, vision, process | Error budget, FAT accuracy test |
| Electrical power | Sum of loads × diversity | Incoming supply, breakers | Load list, FAT power measurement |
| Compressed air | Sum of consumers | Compressor and FRL sizing | Air calculation, flow meter |
| Heat | Losses of drives, laser, PSU | Panel cooling, chiller, room HVAC | Heat calculation, thermal test |
| I/O and network | Device list | PLC I/O, fieldbus nodes, bandwidth | I/O list, network load check |
| Mass and footprint | Site constraints | Frame, shipping splits | GA drawing, weighbridge |

N_(interfaces,max)=(n(n−1))/(2)

With n = 12 modules, up to 66 pairwise interfaces exist; a good architecture keeps real interfaces well below that by routing information through the controller and mechanics through a common base frame.

### 6.7 Industrial example — architecture of the two-station laser marking shuttle (Part 4)

| Pillar | Elements | Key architectural decision |
|---|---|---|
| Mechanical | Welded steel base with machined mounting plate; one servo shuttle axis; two identical nests; Z-axis for focus | Laser, vision and both nests share one machined plate so the datum chain stays short |
| Electrical | Single panel, 415 V 3-phase; one servo drive with STO; 24 V DC distribution split into safety and standard branches | Safety 24 V separated so a standard fault cannot mask a safety fault |
| Controls | PLC with integrated motion over EtherCAT; safety PLC; HMI; OPC UA to MES | One controller owns the sequence; the safety controller owns doors and laser emission |
| Process | Fiber MOPA laser, galvo head, F-theta lens; DPM vision reader; fume extractor | Laser triggered by the PLC only when clamp and door are confirmed |
| Interfaces | Nest datum pins define part coordinates; galvo field calibrated to the same pins | One coordinate system for laser and vision, calibrated at FAT and SAT |

### 6.8 Design trade-offs

| Decision | Option A | Option B | Guidance |
|---|---|---|---|
| Control topology | Centralized PLC with remote I/O | Distributed module controllers (one PLC per module) | Centralized for single machines; distributed for lines and platforms |
| Controller type | PLC with integrated motion | Industrial PC with soft-PLC | PLC for determinism and serviceability; IPC for heavy vision, data or many axes |
| Safety integration | Separate safety relays | Safety PLC with safe fieldbus | Relays for fewer than ~4 simple functions; safety PLC beyond that |
| Process integration | Process equipment as black box over I/O | Deep integration over fieldbus | Black box for proven third-party units; deep integration when timing or data matter |
| Frame | One base for all modules | Separate module frames | One base for accuracy; separate for shipping and platform reuse |

### 6.9 Common mistakes

- Designing modules in parallel with no N² matrix; interface gaps surface at integration.
- Giving laser and vision separate coordinate systems and reconciling them in software forever.
- Mixing safety and standard 24 V, making fault diagnosis and validation harder.
- Choosing a controller before the I/O, axis and data budgets exist.

### 6.10 Troubleshooting — architecture faults found at integration

| Symptom | Architectural cause | Diagnostic | Corrective action | Prevention |
|---|---|---|---|---|
| Two modules cannot hand over a part | Transfer height or timing never specified | Compare module ICDs | Adapter plate, sequence change | ICD for every material handover |
| Network overloaded, jitter in motion | Vision images or MES data on the motion network | Network load capture | Separate networks | Network topology at Gate 2 |
| Panel overheats | Heat budget not allocated | Measure panel temperature under load | Cooling unit upgrade | Heat budget at Gate 2 |

### 6.11 Design checklist

- Six architecture views drafted and reviewed
- Every module has one owner
- N² matrix complete; every non-empty cell has an ICD
- Seven budgets set and allocated
- One coordinate system for process, motion and vision
- Safety and standard control separated in the architecture
- Control topology and network drawn

### 6.12 Key takeaways

- Architecture is the set of decisions that are expensive to change; freeze it at Gate 2.
- Interfaces, not modules, are where machines fail; own them explicitly.
- Budgets turn system requirements into module requirements.
- One datum and one coordinate system for the whole machine.
