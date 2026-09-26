---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 61
part_title: "Part 50 — Industry 4.0"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 50 — Industry 4.0

Industry 4.0 for a machine builder means delivering equipment that plugs into the customer's data architecture through standard, secure interfaces, and using digital models to engineer and commission faster. The practical core is a layered stack — machine, PLC, edge, MES, database, analytics — with OPC UA and MQTT as the common languages, IEC 62443 zoning for security, and virtual commissioning to cut debug time.

### 50.1 Objective

Define the machine's place in the plant data architecture, its interfaces and security, and the digital-twin and virtual-commissioning practices that improve engineering.

### 50.2 Engineering concept

*Figure 13. Industry 4.0 stack · 6 layers, ISA-95 levels, interfaces between layers* — [Figure not transcribed; see source document]

Data rises through the layers; commands and recipes flow down. The edge layer is the builder's most useful addition: it decouples the deterministic PLC from IT systems, buffers data during outages, extracts features from high-rate signals, and hosts local applications.

| Technology | What it is | When to use |
|---|---|---|
| OPC UA (IEC 62541) | Platform-independent client/server and publish/subscribe communication with information models and built-in security | Machine-to-MES, SCADA and historian; vendor-neutral data models (companion specifications such as OPC UA for Machinery) |
| MQTT (OASIS standard) | Lightweight publish/subscribe via a broker; QoS levels 0, 1, 2 | Edge-to-cloud, many consumers, event streams; Sparkplug B adds industrial state and payload conventions |
| REST / other APIs | Web interfaces for services | Integration with IT applications, dashboards |
| MES (ISA-95 functions) | Orders, genealogy, quality, performance | Plant operations |
| SCADA | Supervisory visualization and control across machines | Line-level overview |
| Digital twin | Model of the machine linked to its data | Design (simulation), commissioning (virtual), operation (monitoring, prediction) |
| Predictive maintenance | Models on condition data | Parts 42 and 49 |

### 50.3 Architecture — digital twin types

| Twin | Model | Data | Value |
|---|---|---|---|
| Design twin | 3D kinematics, cycle simulation, FEA | Design parameters | Cycle-time and reach validation before build |
| Commissioning twin (virtual commissioning) | 3D model with behaviour, connected to the real or emulated PLC | PLC I/O | Test PLC code, interlocks and recovery before hardware exists |
| Operational twin | Model of the running machine | Live states, counts, condition signals | Monitoring, what-if, predictive maintenance, remote support |

### 50.4 Components — security (IEC 62443 approach)

| Element | Machine-builder practice |
|---|---|
| Zones and conduits | Control zone (PLC, drives, safety), machine zone (HMI, edge), plant conduit via firewall or NAT gateway |
| Security level target | Agreed with customer per zone |
| Accounts and authentication | No shared default passwords; role-based accounts; certificates for OPC UA |
| Hardening | Disable unused services and ports; signed firmware where available |
| Patching | Documented process with the customer; test before deployment |
| Remote access | Customer-controlled, session-based, logged |
| Backup and recovery | Offline backups of all programs and configurations |

### 50.5 Design methodology

- Map the customer's plant architecture and standards (MES, historian, cloud policy, security levels).
- Place the machine in the stack; define interfaces per layer (tag list, OPC UA model, MQTT topics).
- Design the edge: buffering, features, local dashboards, publication.
- Apply zoning and security measures; agree them with IT at G2.
- Use a design twin for cycle and reach; a commissioning twin for PLC testing on complex machines.
- Validate data flows end to end at FAT with simulators and at SAT live.

### 50.6 Calculations

t_(latency)=t_(scan)+t_(edge)+t_(network)+t_(MES)

BW_(MQTT)=N_(msg/s)⋅(B_(payload)+B_(overhead))⋅8

S_(VC)=d_(debug,saved)⋅C_(team/day)−C_(model)

Examples: 3,000 part records/day plus 200 condition values/min with 300-byte payloads is a few messages per second — negligible bandwidth; reliability (QoS, buffering) matters, not speed. Virtual commissioning that saves 6 debug days for a 4-person team at ₹40,000 per person-day saves ₹9.6 lakh against a modelling cost of, say, ₹3 lakh — worthwhile on complex or platform machines, rarely on simple SPMs.

### 50.7 Industrial example — connected marking cell

- PLC exposes states, counts and alarms; the edge IPC hosts an OPC UA server with a machine model (identification, state, jobs, part records, alarms), structured along the lines of the OPC UA for Machinery building blocks.
- MES reads part records and writes jobs and recipes through OPC UA methods; route check per part (Part 23).
- Optional MQTT publication of OEE and condition data to the customer's data platform through the plant broker.
- Firewall between machine zone and plant network; only the OPC UA endpoint and the broker connection allowed.
- The commissioning twin (3D shuttle and nest model driven by the PLC) tested sequence, interlocks and recovery two weeks before the panel was wired.

### 50.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| OPC UA client/server vs MQTT pub/sub | Rich models, request/response, methods | Scalable fan-out, loose coupling | OPC UA to MES; MQTT to analytics and cloud; often both |
| Point-to-point integrations vs unified namespace | Simple for one machine | Scales across plant, one source of truth | Follow the customer's architecture; expose data cleanly either way |
| Full digital twin vs targeted models | Complete | Faster, cheaper | Model what reduces risk: cycle, collisions, logic |

### 50.9 Common mistakes

- Exposing the PLC directly to the plant network.
- Custom TCP protocols nobody else can maintain.
- Default passwords and shared accounts on HMIs and edge devices.
- Building a twin that is never connected to real data or code.

### 50.10 Troubleshooting

| Symptom | Possible causes | Corrective action | Preventive action |
|---|---|---|---|
| MES cannot browse OPC UA server | Certificates, endpoints, firewall | Exchange certificates, open endpoint | Connectivity test before SAT |
| MQTT data missing | QoS 0 with network drops, broker limits | QoS 1 with buffering, broker sizing | Message design review |
| Security audit findings | Open services, default credentials | Harden, rotate credentials | Hardening checklist at FAT |

### 50.11 Design checklist

- Plant architecture and standards captured
- Interfaces defined per layer (tags, OPC UA model, MQTT topics)
- Edge buffering and features designed
- Zones, conduits and security measures agreed with IT
- Design and commissioning twins used where they reduce risk
- End-to-end data tests at FAT (simulated) and SAT (live)

### 50.12 Key takeaways

- Put an edge layer between the PLC and IT.
- Use OPC UA and MQTT; avoid custom protocols.
- Zone the network and harden every device.
- Virtual commissioning pays on complex and platform machines.
