---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 12
part_title: "Part XI — Laser System and Machine Architecture"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XI — Laser System and Machine Architecture

A laser machine is two chains running in parallel: an optical chain that carries photons from source to workpiece, and a control chain that decides when, where and how much. Machine quality is set by how well the two are synchronised — at nanoseconds for laser gating, microseconds for scanners, milliseconds for PLC logic and seconds for MES.

## 11.1 Optical chain

| Subsystem | Function | Key specification | Reference |
|---|---|---|---|
| Laser source | Generates the beam with the required λ, power and pulse format | Power stability (±1–2%), pulse parameters, M², interfaces | Part III |
| Isolator | Blocks back-reflection into the source | Isolation (dB), aperture, power rating | §6.5 |
| Beam expander | Sets beam diameter at the scanner or lens (→ spot size) | Magnification, motorised zoom/focus | §4.5, §5.1 |
| Beam delivery | Moves the beam to the head | Fiber core/NA or mirror count, losses | Part VI |
| Galvo / scanner | Positions the beam at m/s | Aperture, speed, drift, protocol | Part VII |
| F-theta / focusing lens | Forms the spot over the field | f, field, spot, telecentricity | §5.1 |
| Process head | Couples beam, gas and sensors to the process | Window, nozzle, sensors, cooling | Part VIII |
| Workpiece and fixture | Holds and datums the part | Repeatability, heat sinking, gas shielding | §11.3 |

## 11.2 Control architecture

| Layer | Role | Typical cycle / latency (≈) | Typical technology |
|---|---|---|---|
| MES | Orders, recipes, genealogy, traceability | Seconds | OPC UA, MQTT, SQL, SECS/GEM (semiconductor), IPC-CFX (electronics) |
| HMI / IPC | Operator interface, recipe editor, data logging, user rights | 100 ms | Windows/Linux IPC, web HMI |
| PLC | Machine sequence, interlocks, I/O, station handshakes | 1–10 ms scan | IEC 61131-3 PLC over EtherCAT, PROFINET, EtherNet/IP |
| Motion control | Trajectories, servo loops, stage–scanner coordination | Servo loops ~50–250 µs | Multi-axis motion controllers, servo drives, encoders |
| Scan controller | Vector streaming to galvos, laser gating, delays | ~10 µs command period | RTC-class scan cards, embedded marking controllers |
| Laser control | Power, pulse width, frequency, gate, alarms | ns–µs gating | TTL gate/modulation, analogue 0–10 V power, DB25 parallel interface on marking lasers, RS-232/Ethernet |
| Vision | Fiducials, position offset, code reading, inspection | 20–200 ms per image | Smart cameras or PC vision |
| Safety | Stop functions, interlocks, shutter, STO | ≤ ~10–20 ms response | Safety PLC or relays rated per ISO 13849-1 |

## 11.3 Mechanical engineering

| Subsystem | Design goal | Typical solutions | Watch-outs |
|---|---|---|---|
| Frame and base | Stiffness, damping, thermal stability | Stress-relieved welded steel; mineral cast; granite for µm-class machines | Resonances near scanner or servo frequencies |
| Enclosure | Class 1 laser containment, fume containment, ergonomics | Sheet steel, labyrinth seals, laser-safe viewing windows rated for λ and power | Any gap in line of sight of reflected beams; window rating per IEC 60825-4 / EN 207-type data |
| Doors | Operator access with interlocks | Interlocked sliding or lift doors, guard locking | Nuisance trips; defeat resistance |
| Linear stages and gantry | Accuracy, speed, dynamics | Ball-screw, linear motor, air-bearing; dual-drive gantries | Thermal drift, cable-chain forces |
| Rotary axis | Cylindrical and multi-face parts | Direct-drive torque motors, indexers | Runout, eccentricity |
| Fixtures | Repeatable datum, clamping, heat sinking, gas | Hardened datums, pneumatic clamps, Cu heat sinks, integrated shielding gas | Part variation, spatter build-up, poka-yoke |
| Conveyor | Part flow | SMEMA-compatible PCB conveyors, pallet systems, belt | Stop accuracy, board support |
| Pneumatics | Clamps, shutters, air knives | FRL units, valve islands, flow and pressure sensors | Moisture and oil in air reaching optics |
| Fume extraction | Capture and filtration | Nozzle capture at source; spark arrestor, pre-filter, HEPA, activated carbon | Capture velocity, filter loading, combustible dust |
| Cooling | Temperature stability of laser and optics | Chillers ±0.1–1 °C | Condensation on optics below dew point |

## 11.4 Electrical engineering

| Element | Role | Selection notes |
|---|---|---|
| PLC | Sequence, I/O, handshakes | Fieldbus master; integrated safety option |
| Servo drives and motors | Axis motion | Safe torque off (STO); encoder resolution; tuning |
| SMPS | 24 V control and sensor power | Redundancy; separate supplies for noisy loads |
| Safety relay / safety PLC | Stop functions, interlocks | Required performance level from risk assessment |
| Sensors | Presence, position, pressure, flow, temperature, door status | Coded safety switches for doors |
| Distributed I/O | Wiring reduction | EtherCAT / PROFINET islands |
| Industrial PC | HMI, vision, data | Fanless, rated temperature, SSD |
| Laser and chiller interfaces | Control, status, alarms | Hard-wired interlocks for emission enable |
| Panel design | Compliance and EMC | IEC 60204-1 (electrical equipment of machines); UL 508A for North America; shielding of RF CO₂ and galvo lines |

## 11.5 Software architecture

| Module | Function |
|---|---|
| HMI | Operator screens, alarms, production counters, maintenance prompts |
| Motion control | Trajectories, homing, error maps, stage–scanner coordination |
| Laser control | Power, pulse and gate control; source status and alarms |
| Vision software | Calibration, fiducials, offsets, code reading and grading, inspection |
| Recipe management | Versioned, access-controlled parameter sets per product, joint or mark |
| MES interface | Order download, result upload, interlock on missing data |
| Traceability | Part ID ↔ recipe version ↔ process data ↔ inspection result |
| Data logging and SPC | Time series, process signatures, capability (Cpk) |
| User management and audit trail | Role-based access; electronic records compliance (e.g., 21 CFR Part 11 in regulated industries) |
| Remote service | Secure remote diagnostics and updates |

## 11.6 Safety architecture

| Element | Purpose |
|---|---|
| Interlocks and door switches | Stop emission when an access door opens; guard locking during emission |
| Emergency stop | Category 0 or 1 stop per IEC 60204-1 |
| Laser shutters | Redundant, monitored beam blocking independent of the source’s own control |
| Beam enclosure | Class 1 by design: no accessible radiation above Class 1 limits during operation |
| Warning lights | Emission-on indication, stack lights, signage |
| Key switch | Prevents unauthorised emission (required on Class 3B/4 laser products) |
| Safety PLC | Implements safety functions to the required performance level (ISO 13849-1) |
| Fire and fume | Spark detection, fire suppression, extraction interlocks |

Machine safety is designed from a risk assessment (ISO 12100) and verified against the laser-processing-machine standard ISO 11553-1 and the laser product standard IEC 60825-1; Part XXIV covers classes, hazards and standards in detail. Safety functions are never bypassed for set-up; service modes use controlled, documented procedures with protective eyewear and restricted access.
