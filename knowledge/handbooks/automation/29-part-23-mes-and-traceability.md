---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 29
part_title: "Part 23 — MES and traceability"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 23 — MES and traceability

Traceability means that for any serial number the customer can answer: what was it made from, on which machine, with which recipe and parameters, by whom, when, and did it pass. Design it as architecture at Gate 2 — identification, part tracking, a data dictionary, store-and-forward buffering and an agreed MES handshake — because it is the most common reason SAT fails on otherwise perfect machines.

### 23.1 Objective

Define identification, data content, genealogy, timestamps, buffering and the equipment-to-MES interface (including SECS/GEM for semiconductor tools) so every part record is complete, correct and delivered exactly once.

### 23.2 Engineering concept

| Concept | Definition | Machine requirement |
|---|---|---|
| Serial tracking | Each unit has a unique ID | Read or create the ID at load; carry it through the part tracker |
| Lot tracking | Units grouped by material batch | Record lot of every consumed material (tray, reel, gas bottle, wire) |
| Genealogy | Parent–child links between assemblies and components | Record child IDs when combined (cells into module) |
| Recipe tracking | Which recipe and version produced the part | Recipe ID and version in every record |
| Process parameters | Measured values during processing | Actual values, not setpoints only |
| Inspection data | Results and verdicts | Values, limits, verdict, image reference |
| Timestamps | When each event occurred | Synchronized clock, UTC, millisecond resolution |
| User logs and audit trail | Who did what | Log logins, recipe edits, overrides, forced outputs |

### 23.3 Architecture — equipment to MES

| Layer | Role in traceability | Typical technology |
|---|---|---|
| Level 0 — devices | Read IDs, measure values | Code readers, RFID, sensors, laser and vision |
| Level 1 — PLC | Part tracker, assembles the part record, enforces interlocks | PLC data structures, persistent memory |
| Level 2 — edge / equipment PC | Store-and-forward buffer, local database, image storage, protocol conversion | Industrial PC, OPC UA, SQL, file storage |
| Level 3 — MES | Work orders, route checks, genealogy, SPC, quality release | Customer MES |
| Level 4 — ERP | Orders, inventory, shipping | Customer ERP (via MES only) |

Standard handshake per part

- Part arrives; machine reads ID.
- Route check: machine asks MES whether this ID may be processed here (right operation, not already processed, not on hold).
- MES replies OK plus recipe (or NOK with a reason).
- Machine processes and inspects.
- Machine sends the part record with a unique record ID.
- MES acknowledges; machine marks the record delivered. Without acknowledgement, the edge buffer keeps it and retries.
Semiconductor: SECS/GEM and related SEMI standards

| Standard | Role |
|---|---|
| SEMI E5 (SECS-II) | Message structure and content |
| SEMI E37 (HSMS) | Transport over TCP/IP |
| SEMI E30 (GEM) | Generic equipment model: state models, events, variables, alarms, remote commands, recipes, spooling |
| SEMI E40 / E94 | Process jobs / control jobs |
| SEMI E87 | Carrier management (FOUPs, load ports) |
| SEMI E90 | Substrate tracking |
| SEMI E116 | Equipment performance tracking |
| SEMI E10 / E79 | Equipment reliability states / productivity (OEE) definitions |
| SEMI E120, E125, E132, E134 (Interface A / EDA) | High-rate equipment data collection for engineering analysis |

A GEM-compliant tool exposes collection events, status and data variables, alarms, remote commands (START, STOP, PP-SELECT) and process-program (recipe) management; the fab host drives the tool. For 300 mm fabs, the GEM300 set (E39, E40, E87, E90, E94 and related standards) is normally required.

### 23.4 Components — identification technologies

| Technology | Capacity | Strengths | Limits | Quality standard |
|---|---|---|---|---|
| 1D barcode | ~20–40 characters | Cheap, universal | Low density, no error correction | ISO/IEC 15416 |
| QR code | Up to thousands of characters | Fast reading, error correction | Larger than Data Matrix for small data | ISO/IEC 18004; grading ISO/IEC 15415 |
| Data Matrix (printed or label) | Up to ~2,300 alphanumeric | Very compact, robust error correction | Needs good print or mark quality | ISO/IEC 16022; grading ISO/IEC 15415 |
| Data Matrix, direct part mark (laser, dot peen) | As above | Permanent, survives processing | Surface-dependent grading | ISO/IEC TR 29158 (AIM DPM) |
| RFID HF (13.56 MHz) | Kilobytes | No line of sight, rewritable | Metal interference, cost | ISO/IEC 15693, 14443 |
| RFID UHF | Bytes to kilobytes | Long range, bulk reading | Metal and liquid effects, read-zone control | ISO/IEC 18000-63 |
| OCR / OCV | Human-readable text | Operators can read it | Lower read reliability | Vision verification |

### 23.5 Design methodology

- Agree the traceability requirement: granularity (serial or lot), content, retention, latency, who owns the master data.
- Choose the identification method and position per product; include no-read handling.
- Write the data dictionary: every field, type, unit, source, when captured.
- Define the MES interface: protocol, handshake, route check, error codes, timeouts.
- Design part tracking in the PLC and the store-and-forward buffer on the edge PC.
- Synchronize clocks (NTP or PTP) to the plant time source; record in UTC with the plant offset.
- Define audit trail and user management.
- Test with a simulated MES at FAT and the live MES at SAT, including MES-offline recovery.

### 23.6 Calculations

S_(buffer)=N_(rec/day)⋅B_(rec)⋅d_(offline)

t_(loss,noread)=p_(noread)⋅t_(manual)

L_(code)=n_(modules)⋅x+2 q

S_buffer = buffer storage for d_offline days of MES outage; B_rec = bytes per record; p_noread = no-read rate; t_manual = manual handling time per no-read; L_code = code side length with module size x and quiet zone q (Data Matrix typically needs one module of quiet zone; more is safer on DPM).

Examples: 3,000 records/day × 4 kB × 7 days = 84 MB, trivial on an IPC but not in PLC memory, so buffer on the edge PC. At 0.5% no-reads and 40 s manual verification, 3,000 parts/day cost 10 minutes of operator time daily — push the read rate above 99.9%. A 16 × 16 Data Matrix at 0.40 mm with one-module quiet zones is 7.2 mm square.

### 23.7 Industrial example — battery module genealogy

A module line welds 96 cylindrical cells into a module, then the module into a pack.

| Record field | Example | Source |
|---|---|---|
| Record ID | EQ07-2026-09-26-000154 | Machine (unique, idempotent) |
| Module serial | MOD-24A-0012345 | Laser-marked Data Matrix, read by vision |
| Child cell IDs | 96 cell serials with positions | Cell codes read at loading, mapped to holder positions |
| Recipe ID, version | WLD-96S-R07 v3 | Recipe manager |
| Weld parameters per joint | Power, speed, focus, monitoring signal summary | Laser controller and process monitor |
| Pre-weld height scan | Min / max gap per joint | Laser displacement sensor |
| Verdict per joint and module | OK / NOK with reason | Inspection and monitoring |
| Timestamps | Start and end, UTC, ms | Synchronized PLC clock |
| Operator and shift | User ID | HMI login |
| Machine state events | Alarms during the cycle | Alarm manager |

The route check stops a module that failed incoming cell grading from being welded; the genealogy lets a field failure on one cell be traced to every pack containing cells from the same lot.

### 23.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Serial vs lot tracking | Unit-level recall and analysis | Cheaper, less data | Serial for safety-critical and high-value products (battery, automotive, semiconductor) |
| MES-driven vs machine-driven | Central control, route checks | Machine keeps running if MES is slow | MES-driven with local buffering and a defined offline mode |
| DPM vs label | Permanent | Cheaper, easier to read | DPM when the part goes through washing, coating or heat |
| Store full images vs results only | Full forensic evidence | Storage and bandwidth | Store images for NOK parts and a sample of OK parts |

### 23.9 Common mistakes

- Traceability requirement discovered in the SAT protocol.
- Setpoints recorded instead of actual values.
- Local PLC clocks drifting; records out of order across machines.
- Records sent without unique IDs, so retries create duplicates.
- No defined behaviour when MES is offline.
- Reading the ID once at loading and losing it after a fault.

### 23.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Duplicate records in MES | Retries without idempotent IDs | Compare record IDs | Duplicate count | Unique record IDs, MES de-duplication | Idempotency in interface spec |
| Missing records | Buffer overflow, no acknowledgement | Buffer log vs MES | Gaps by time | Store-and-forward with acknowledgement | Offline test at FAT and SAT |
| High no-read rate | Mark quality, lighting, reader position | Grade codes offline; check reader logs | Grade distribution, read time | Improve mark, lighting, reader angle | Grade target in URS, verified at FAT |
| Timestamps inconsistent | Clock not synchronized | Compare clocks with time server | Offset | NTP/PTP sync, UTC | Time sync in commissioning checklist |
| Route check blocks good parts | Master data or operation mismatch | Trace MES response codes | Error code | Correct routing data | Joint test with MES team |

### 23.11 Design checklist

- Traceability requirement signed: granularity, content, retention, latency
- Identification method, position, grade target and no-read handling defined
- Data dictionary with sources and capture points
- MES handshake with route check, acknowledgement, error codes, timeouts
- Store-and-forward buffer sized for the agreed offline duration
- Clock synchronization and UTC timestamps
- Audit trail for recipe edits, overrides and forces
- SECS/GEM (and GEM300 where required) capability list agreed for fab tools
- Simulated-MES test at FAT, live and offline tests at SAT

### 23.12 Key takeaways

- Traceability is architecture; freeze the data dictionary at Gate 2.
- Record actual values, synchronized timestamps and unique record IDs.
- Buffer on the edge PC and design the MES-offline mode explicitly.
- Semiconductor tools need GEM and usually GEM300; plan them as features, not add-ons.
BOOK V
