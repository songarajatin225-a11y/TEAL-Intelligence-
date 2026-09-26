---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 77
part_title: "Part 55 — Component selection handbook"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 55 — Component selection handbook

Select every component by the chain specification → application → selection → trade-off, never by brand habit. The tables give the specifications that matter, the application facts that drive the choice, the selection rule, the main trade-off, and representative suppliers. Supplier names are examples to orient a search, not recommendations; qualify any supplier for your application, service needs and local support.

### 55.1 Specification, application and selection rule

| Component | Key specifications | Application drivers | Selection rule | Part |
|---|---|---|---|---|
| PLC | I/O capacity, scan performance, motion axes, fieldbus, safety integration, memory, lifecycle | I/O count +20%, fastest event, axis count, protocols, customer standard | Walk the 12-driver chain; choose the lowest class meeting all with headroom | 19 |
| Servo motor | Rated/peak torque, speeds, rotor inertia, encoder, brake, IP | Move profile, load inertia, duty, vertical load | Five checks: peak, RMS, speed, inertia ratio, regeneration | 12 |
| Motor (induction / BLDC / stepper) | Power, speed, torque curve, efficiency class | Constant speed vs positioning, load variation | Induction + VFD for speed; stepper for light constant low-speed positioning; servo otherwise | 11 |
| Servo drive | Current, control modes, fieldbus, safety functions, encoder interfaces | Motor match, STO/SS1/SLS needs, network | Same family as motor; safety functions from SRS | 11, 27 |
| VFD | Power, overload class, control mode, braking, EMC filter | Conveyors, fans, pumps; starting torque | Size by motor current and overload; add braking for high inertia | 11 |
| Linear guide | Dynamic load C (50/100 km basis), preload, accuracy class, size | Load and moments, stiffness, life, speed | Life calculation with load factor; preload by stiffness need | 8 |
| Ball screw | Diameter, lead, accuracy class, preload, critical speed, DN | Force, speed, accuracy, stroke | Lead from speed and DN; diameter from critical speed and buckling | 12 |
| Bearing | C, C₀, speed limit, sealing, lubrication | Load, speed, life, environment | L10h ≥ target life with application factors | 8 |
| Cylinder | Bore, stroke, cushioning, guidance, mounting | Force at minimum pressure, side load, speed | Load ratio ≤ 0.5–0.7 moving; guided if side loads | 14 |
| Valve | Function (3/2, 5/2, 5/3), flow, response, diagnostics | Behaviour on power/air loss, speed | Function by safe behaviour; flow ≥ 2–3× required | 14 |
| Sensor | Principle, range, response, output, IP, IO-Link | Target, speed, environment, failure detection | Answer one written question; check visibility time | 18 |
| Camera | Resolution, pixel size, frame rate, shutter, interface | Tolerance, FOV, motion, lighting | Pixel size from tolerance and sub-pixel repeatability | 24 |
| Lens | Focal length, magnification, WD, aperture, DOF, distortion, telecentricity | FOV, height variation, accuracy | Resolve sensor pixels; telecentric for height variation | 24 |
| Lighting | Geometry, wavelength, intensity, strobe | Surface (shiny, dark, textured), defect type | Choose by measured contrast in trials | 24 |
| Robot | Payload, wrist moment and inertia, reach, repeatability, speed, IP, cleanroom class | Part and EOAT, workspace, cycle | Moments and inertia at real CoG; simulated cycle | 25 |
| Safety PLC | Safe I/O, PL/SIL capability, safe fieldbus, programming | Number and type of safety functions | Relays for ≤ 3 simple functions; safety PLC beyond | 27 |
| Safety sensor | Type (interlock, light curtain, scanner, mat), PL capability, resolution, response | Access frequency, hazard, distance | From risk assessment and ISO 13855 distances | 27 |
| Laser source | Wavelength, power, pulse regime, M², stability, interfaces, cooling | Material absorption, process window, rate | From process trials on production material | 28 |
| Galvo scanner | Aperture, speed, repeatability, drift, protocol | Beam size, cycle, error budget | Aperture ≥ beam; drift inside error budget | 28 |
| Chiller | Capacity, stability, flow, ambient range | Laser and optics heat, site ambient | ≥ 1.2× heat load at worst ambient | 28, 31 |
| Fume extractor | Flow, static pressure, filter stages, spark arrest, monitoring | Fume type (particles, gases), volume | Flow from capture velocity; filters from fume composition | 28 |
| SMPS | Current, efficiency, hold-up, overload behaviour, redundancy | Peak loads, safety separation | 1.25× peak sum; separate safety supply | 16 |
| MCCB | Rated current, adjustable trips, breaking capacity | Main or large branch protection | Breaking capacity ≥ site fault level | 16 |
| MCB | Rating, curve (B/C/D), breaking capacity | Branch type, inrush | C for SMPS and general, D for high inrush | 16 |

### 55.2 Trade-offs and representative suppliers

| Component | Main trade-off | Representative suppliers (examples only) |
|---|---|---|
| PLC | PLC determinism and serviceability vs IPC computing power | Siemens, Rockwell Automation, Mitsubishi Electric, Beckhoff, Omron, Schneider Electric, Delta |
| Servo motor and drive | Low- vs medium-inertia; integrated safety vs external | Yaskawa, Siemens, Panasonic, Mitsubishi Electric, Beckhoff, Bosch Rexroth, Delta |
| Induction motor / VFD | Cost vs positioning capability | ABB, Siemens, Danfoss, Schneider Electric, WEG, Crompton, Delta |
| Linear guide | Ball vs roller; preload vs friction | THK, HIWIN, NSK, Bosch Rexroth, Schneeberger |
| Ball screw | Short lead (resolution) vs long lead (speed) | THK, HIWIN, NSK, Bosch Rexroth, PMI |
| Bearing | Life vs size and cost | SKF, Schaeffler (FAG), NSK, NTN, Timken |
| Cylinder and valve | Pneumatic simplicity vs electric control | Festo, SMC, Parker, Emerson (Aventics), Janatics |
| Sensor | Discrete cost vs IO-Link diagnostics | SICK, Keyence, ifm, Pepperl+Fuchs, Balluff, Omron, Baumer |
| Camera and smart vision | Smart camera simplicity vs PC flexibility | Cognex, Keyence, Basler, Teledyne (DALSA, FLIR), Allied Vision, Omron |
| Lens | Standard vs telecentric | Computar, Kowa, Edmund Optics, Opto Engineering |
| Lighting | Generic vs application-engineered | CCS, Smart Vision Lights, Advanced Illumination, Opto Engineering |
| Robot | Flexibility vs precision and cost | FANUC, ABB, KUKA, Yaskawa, Epson, Denso, Universal Robots |
| Safety PLC and relays | Flexibility vs simplicity | Pilz, Siemens, Rockwell Automation, Omron, SICK, Schmersal |
| Safety sensors and interlocks | Fixed guard vs ESPE; coded vs uncoded interlocks | SICK, Pilz, Keyence, Omron, Leuze, Schmersal, Euchner |
| Laser source | Beam quality and support vs cost | IPG Photonics, Coherent, TRUMPF, nLIGHT, Raycus, MAX Photonics, JPT |
| Galvo scanner | Speed and drift vs cost | SCANLAB, RAYLASE, Novanta (Cambridge Technology), Sino-Galvo |
| Chiller | Integrated vs facility water | TEYU (S&A), Termotek, Riedel, OptiTemp |
| Fume extractor | Local filter unit vs central exhaust | ULT, BOFA (Donaldson), Purex, Kemper |
| SMPS | Single large vs distributed supplies | Phoenix Contact, PULS, Mean Well, Siemens, Omron |
| MCCB / MCB | Fuses vs breakers | Schneider Electric, ABB, Siemens, Lauritz Knudsen (formerly L&T switchgear), Legrand |

### 55.3 Selection record template

| # Component selection record — [component] for [module] Requirement (from SRS / module spec): [values with units] Application facts: [load, speed, environment, duty, interfaces] Candidates: [A] [B] [C] with key specs Checks: [calculation references, margins] Trade-off: [what we give up with the chosen option] Decision: [part number] · Second source: [part number] Lifecycle and service: [availability in India, lead time, spares] Approved: [engineer] [reviewer] [date] |
|---|

### 55.4 Common mistakes

- Choosing brands before specifications.
- Ignoring local service and spares availability.
- No second source for critical, long-lead items.
- Components selected at the edge of their ratings with no margin for real conditions.

### 55.5 Key takeaways

- Specification first, application second, brand last.
- Record every selection with its check and trade-off.
- Service, lead time and lifecycle are part of the specification.
