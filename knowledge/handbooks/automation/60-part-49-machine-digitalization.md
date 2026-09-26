---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 60
part_title: "Part 49 — Machine digitalization"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 49 — Machine digitalization

A digital machine records what it is doing, why it stopped, how well it processed each part and how its components are ageing — and makes that data available through standard interfaces. Designing this in costs little: a state model, stop-reason codes, a tag list and an edge buffer. Retrofitting it costs a lot and is rarely complete.

### 49.1 Objective

Specify the data a machine produces, how it is acquired, buffered and exposed, and how it feeds OEE, maintenance, quality and traceability.

### 49.2 Engineering concept

| Data class | Examples | Rate | Use |
|---|---|---|---|
| States and modes | Running, idle, starved, blocked, fault, setup, maintenance | Event | OEE, availability, loss tree |
| Counts and cycle times | Good, NOK, rework; cycle time per part | Per part | Performance, quality |
| Stop reasons and alarms | First-out alarm, operator-entered reason | Event | Loss Pareto, MTBF, MTTR |
| Process parameters | Laser power, speed, focus, clamp force, weld monitoring features | Per part or per feature | SPC, traceability, process analytics |
| Condition signals | Filter Δp, drive torque, temperature, vibration, laser power trend | Periodic | Predictive maintenance |
| Energy and utilities | kWh, air flow, water flow | Periodic | Cost, sustainability reporting |
| Genealogy | Part IDs, lots, recipe versions | Per part | Traceability (Part 23) |

State definitions should follow an accepted model — PackML states for packaging and general machines, SEMI E10 equipment states for semiconductor tools — so OEE numbers compare across machines and vendors.

### 49.3 Architecture

| Layer | Function | Technology |
|---|---|---|
| PLC | Generates states, counts, stop reasons, part records, condition values | Structured data blocks, timestamps |
| Edge (IPC or gateway) | Buffers, pre-processes (features from high-rate signals), stores locally, publishes | OPC UA server/client, MQTT, local database |
| Plant systems | MES, historian, maintenance system | OPC UA, MQTT, REST, SQL |
| Analytics and dashboards | OEE, SPC, predictive models | Customer's platform or the builder's service platform (with approval) |

### 49.4 Components — OEE dashboard content

| View | Content |
|---|---|
| Now | State, mode, current recipe, cycle time vs target, active alarm |
| Shift | OEE with A, P, Q; good and NOK counts; top five stop reasons by time |
| Loss tree | Availability, performance, quality losses by category and module |
| Trend | OEE, MTBF, MTTR by day and week |
| Quality | Yield by variant and lot; SPC of key process parameters |
| Maintenance | Condition signals vs thresholds; PM due |

### 49.5 Design methodology

- Define the state model and stop-reason code tree with the customer (Part 41).
- Write the tag list: name, type, unit, rate, source, consumer.
- Implement state and part-record generation in the PLC (Part 20).
- Implement the edge: buffering, feature extraction, OPC UA / MQTT publication, local dashboard.
- Agree data ownership, security and any cloud connection with customer IT.
- Validate OEE calculation against manual logs during SAT.

### 49.6 Calculations

D_(day)=N_(tags)⋅f⋅B⋅86,400

OEE=(N_(good)⋅CT_(ideal))/(T_(plan))

Examples: 200 tags sampled at 1 Hz with 8 bytes each generate 1.6 kB/s, about 138 MB/day raw; deadband and event-based logging typically cut this by an order of magnitude. High-rate process monitoring is different: a 50 kHz photodiode signal over a 0.12 s weld is 6,000 samples (12 kB) per weld; 192 welds × 40 modules/h is about 92 MB/h. Store extracted features (peak, mean, integral, anomaly score) per weld, and raw traces only for NOK joints and a sample of OK joints.

### 49.7 Industrial example — digital layer of the marking cell

- PLC generates PackML-style states, first-out alarms, operator stop-reason entry after any stop longer than 2 minutes.
- Per-part record: serial, recipe version, laser power measured, focus height, code grade, cycle time, verdict.
- Condition tags: fume filter Δp, galvo temperature, shuttle torque RMS per hour, laser power at weekly check.
- Edge IPC: 30-day local store, OPC UA server for MES and historian, local OEE dashboard on the HMI and a web view on the plant network.
- Threshold alarms: Δp warning at 80% of limit; shuttle torque drift > 20% from baseline triggers a lubrication check.

### 49.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Edge vs cloud analytics | Low latency, data stays on site | Fleet-wide learning, remote experts | Edge first; cloud with customer consent and security review |
| Raw vs feature storage | Full forensic detail | Manageable volumes | Features always; raw on exceptions |
| Builder platform vs customer platform | Consistent across the builder's fleet | Integrated in the customer's systems | Standard interfaces so either works |

### 49.9 Common mistakes

- No stop-reason codes, so OEE losses cannot be explained.
- OEE calculated with different definitions on different machines.
- High-rate data flooding the network or disk.
- Cloud connection promised without customer IT agreement.

### 49.10 Troubleshooting

| Symptom | Possible causes | Corrective action | Preventive action |
|---|---|---|---|
| OEE disagrees with production counts | State or count logic errors | Reconcile with manual logs; fix logic | OEE validation at SAT |
| Dashboard gaps | Edge buffer overflow, network drops | Increase buffer, store-and-forward | Buffer sizing |
| Predictive alarms ignored | Too many false alarms | Tune thresholds with field data | Baseline period before alerting |

### 49.11 Design checklist

- State model and stop-reason tree agreed
- Tag list with rates, units and consumers
- Edge buffering and feature extraction designed
- OEE definition documented and validated
- Security and data ownership agreed with customer IT

### 49.12 Key takeaways

- Design the state model, stop reasons and tag list with the machine.
- Buffer at the edge; publish through standard interfaces.
- Store features, not floods.
- OEE is only useful when its definition is the same everywhere.
