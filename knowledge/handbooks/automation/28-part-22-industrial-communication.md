---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 28
part_title: "Part 22 — Industrial communication"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 22 — Industrial communication

Use the right network for each job and keep them apart: a deterministic fieldbus for motion and I/O, an information network (OPC UA, SECS/GEM, MQTT) for MES and data, and a dedicated link for vision images. Most network problems at SAT are architecture problems — images on the motion network, flat networks with no segmentation, or remote access that plant IT will not approve.

### 22.1 Objective

Select protocols for control, safety, information and vision traffic, design the network topology and security zones, and verify timing and bandwidth.

### 22.2 Engineering concept

| Property | Meaning | Why it matters |
|---|---|---|
| Cycle / update time | How often data is exchanged | Must be faster than the control loop or event that uses it |
| Latency | Delay from send to receive | Adds to reaction time |
| Jitter and determinism | Variation of timing; whether timing is guaranteed | Motion synchronization needs microsecond-level jitter |
| Bandwidth | Data volume per second | Images and high-rate data need dedicated capacity |
| Topology | Line, star, ring, tree | Cabling, redundancy, diagnostics |
| Diagnostics | Error counters, topology discovery, device status | Time to find a network fault |

### 22.3 Architecture — protocol comparison

| Protocol | Organization / standard | Type | Typical cycle | Determinism | Typical use |
|---|---|---|---|---|---|
| EtherCAT | EtherCAT Technology Group; IEC 61158 | Fieldbus, processing on the fly | 50 µs–4 ms | High; distributed clocks with sub-µs sync | Servo drives, fast I/O, motion-heavy machines; FSoE for safety |
| PROFINET RT / IRT | PROFIBUS & PROFINET International; IEC 61158 | Fieldbus on Ethernet | RT ≈ 1 ms and up; IRT sub-ms | RT good; IRT high | Siemens-centric plants, automotive; PROFIsafe for safety |
| EtherNet/IP | ODVA; CIP on standard Ethernet | Fieldbus on Ethernet (TCP/UDP) | 1–100 ms typical (faster with CIP Motion) | Moderate; CIP Sync for time | Rockwell-centric plants, North America; CIP Safety |
| Modbus TCP | Modbus Organization | Client/server polling | 5–100 ms per request | Low | Simple devices, utilities, chillers, meters |
| CAN / CANopen | CAN in Automation (CiA) | Multi-master serial bus | Up to 1 Mbit/s (classical CAN) | Good at low data rates | Embedded devices, battery systems, mobile machines |
| OPC UA | OPC Foundation; IEC 62541 | Information model, client/server and PubSub | 100 ms–s typical (PubSub/TSN faster) | Low (client/server) | MES, SCADA, digital twins, vendor-neutral data |
| SECS/GEM (HSMS) | SEMI E5, E30, E37 | Host–equipment messaging over TCP/IP | Event-driven | Not real-time | Semiconductor fab host integration |
| RS-232 / RS-485 (Modbus RTU) | TIA/EIA standards | Serial point-to-point / multi-drop | 10–100 ms | Low | Legacy devices, laser sources, scales, barcode readers |
| IO-Link | IEC 61131-9 | Point-to-point sensor link | 1–10 ms | Good | Smart sensors and valve terminals |
| MQTT | OASIS standard | Publish/subscribe, broker-based | Event-driven | Not real-time | Cloud, dashboards, edge-to-IT |
| GigE Vision / USB3 Vision | AIA (A3) standards | Camera image streaming | Frame-rate dependent | Not control | Machine vision images |

Network zones

| Zone | Traffic | Rules |
|---|---|---|
| Control (fieldbus) | PLC ↔ drives, I/O, safety | Isolated; no IT devices; deterministic protocol |
| Machine | PLC ↔ HMI, IPC, vision results, robot | Managed switch; fixed addressing; VLAN if shared hardware |
| Vision | Camera ↔ vision PC | Dedicated NIC per camera for high-bandwidth streams |
| Plant / IT | Machine gateway ↔ MES, historian | Firewall or NAT gateway; only defined ports and protocols |
| Remote access | Service connection | Customer-approved secure gateway; session-based, logged |

Security architecture follows IEC 62443 concepts: group assets into zones, define the conduits between them, and set a target security level per zone. SEMI E187 sets cybersecurity expectations for fab equipment.

### 22.4 Components

| Component | Specification points |
|---|---|
| Managed industrial switch | Port count, VLAN, IGMP snooping, ring redundancy, diagnostics, temperature rating |
| Unmanaged switch | Only inside a closed machine network |
| Firewall / NAT gateway | Rule sets, NAT for identical machine IP ranges, logging |
| Protocol gateway | Translating legacy serial or one fieldbus to another |
| Cables and connectors | Category, shielding, M12 X- or D-coding for field use, drag-chain rating |
| Time server | NTP or PTP for consistent timestamps (Part 23) |

### 22.5 Design methodology

- List every communication relationship: who talks to whom, what data, how often, how fast.
- Classify each as control, safety, information, vision or service traffic.
- Choose protocols per class, starting from the customer's plant standard.
- Draw the topology with zones and conduits; assign IP ranges and names.
- Check bandwidth and cycle times (22.6).
- Define the security measures agreed with customer IT: firewall rules, accounts, remote access, patching.
- Document the network: topology drawing, address table, switch configuration backups.
- Test: load test, cable certification where needed, failure tests (unplug a device, break a ring).

### 22.6 Calculations

t_(EtherCAT)≈(8 (B_(overhead)+∑B_i))/(R)+N_(nodes) t_(fwd)

t_(byte,serial)=(b_(frame))/(baud)

BW_(image)=W⋅H⋅b_(pixel)⋅fps

U_(link)=(BW_(required))/(BW_(link))

R = link rate (100 Mbit/s); t_fwd = per-node forwarding delay (≈ 0.5–1 µs); b_frame = bits per serial character (typically 10–11).

| Case | Inputs | Result | Conclusion |
|---|---|---|---|
| EtherCAT frame for the marking cell | 12 nodes, 200 bytes process data, 60 bytes overhead | 21 µs + 12 µs ≈ 33 µs | 3% of a 1 ms cycle; ample headroom |
| Serial laser-source interface | 256-byte status message, 115.2 kbaud, 11 bits/char | ≈ 24 ms | Too slow for per-pulse control; fine for status and recipes |
| Vision stream | 5 MP, 8 bit, 20 fps | 800 Mbit/s | Needs its own gigabit link; never on the machine or control network |
| MES records | 3,000 records/day × 4 kB | 12 MB/day | Trivial bandwidth; reliability and buffering matter, not speed |

### 22.7 Industrial example — marking cell network

- Control: EtherCAT line from PLC to two servo drives, remote I/O on the shuttle, IO-Link master; safety over the same cable using a safe protocol.
- Machine: managed switch with PLC, HMI, IPC, DPM reader results, laser controller (Ethernet), and scanner card.
- Vision: the DPM reader is self-contained; if a full camera were used, it would sit on a dedicated NIC of the IPC.
- Plant: NAT gateway exposes only the OPC UA server port to the MES VLAN; every machine on the line keeps the same internal IP plan.
- Remote service: customer-approved gateway, sessions opened by the customer's IT, logged.

### 22.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| EtherCAT vs PROFINET | Fastest, flexible topology, strong motion ecosystem | Plant standard in many automotive and process sites, strong diagnostics tools | Follow the customer's plant standard; EtherCAT when the builder owns the platform and motion is demanding |
| OPC UA vs custom TCP / database writes | Standard, secure, self-describing | Quick to write | OPC UA for anything the customer's IT will maintain |
| SECS/GEM vs OPC UA in semiconductor | Required by fab host systems | Useful inside the tool and for non-fab customers | SECS/GEM mandatory for fab tools; OPC UA alongside for data |
| Flat network vs zoned | Easy commissioning | Security, fault containment | Always zone at the plant boundary |

### 22.9 Common mistakes

- Camera images streamed through the switch that carries fieldbus or HMI traffic.
- Identical machines with identical IP addresses connected directly to the plant network.
- Remote access via consumer remote-desktop tools that customer IT later bans.
- No switch configuration backup; a replaced switch loses VLANs.
- Serial devices polled in the main PLC task, stretching scan time.

### 22.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Intermittent fieldbus errors | Cable damage in drag chain, EMC, connector | Error counters per port, topology scan | CRC and lost-frame counts by port | Replace cable, fix shielding | Drag-chain-rated cables, EMC layout |
| Drives drop off when motors run | Noise coupling into fieldbus | Correlate errors with motor activity | Errors vs motor state | Segregation, shield bonding | Panel EMC rules (Part 17) |
| HMI slow, timeouts | Broadcast storm, loops, heavy polling | Port mirroring and capture | Network load % | Managed switch, loop protection, reduce polling | Load test at integration |
| MES loses records | Connection drops, no buffering | Compare machine buffer with MES log | Gaps | Store-and-forward buffering, acknowledgements | Buffering in SRS |
| Device not found after replacement | Name or address not assigned | Topology or name assignment tool | Device identity | Assign name or address; auto-parameterization | Device replacement procedure |

### 22.11 Design checklist

- Communication matrix: partners, data, rate, class
- Protocol per class agreed with the customer's plant standard
- Topology with zones, conduits, IP plan and names
- Bandwidth and cycle-time checks recorded
- Vision traffic on dedicated links
- Security measures agreed with customer IT; remote access approved
- Switch and gateway configurations backed up
- Network failure tests in the FAT protocol

### 22.12 Key takeaways

- Separate control, information, vision and service traffic.
- Pick the fieldbus the customer can support; pick OPC UA or SECS/GEM for information.
- Calculate bandwidth for images before choosing where cameras connect.
- Agree security and remote access with plant IT at Gate 2, not at SAT.
