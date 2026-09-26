---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 17
part_title: "Parts XXXIII–XXXIV — Quality, failure analysis, reliability and standards"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts XXXIII–XXXIV — Quality, failure analysis, reliability and standards

## Part XXXIII — Quality and failure analysis

L1 summary. Quality asks whether a part works when shipped; reliability asks whether it keeps working for 10–20 years under heat, voltage, humidity and cycling. Failure analysis (FA) finds out why parts die. Automotive parts target defect rates in the low parts-per-million or better (“zero defect” programmes).

### 33.1 Failure analysis toolkit

| Technique | What it does | Typical findings |
|---|---|---|
| Electrical FA (curve trace, ATE datalog) | Characterise the failure electrically | Shorts, opens, leakage paths |
| X-ray (2D/3D CT) | Image internal structures non-destructively | Wire sweep, voids, solder bridging, cracked balls |
| SAM / CSAM (scanning acoustic microscopy) | Ultrasound reflections from interfaces | Delamination, package cracks, die-attach voids |
| Fault isolation (lock-in thermography, OBIRCH, photon emission/EMMI) | Locate hot spots or emitting defects on the die | Gate-oxide breakdown sites, latch-up, resistive opens |
| Decapsulation | Remove mould compound (chemical or laser decap) | Access die and bonds |
| SEM / EDS | High-resolution imaging + elemental analysis | Corrosion, contamination, bond lift |
| FIB (focused ion beam) | Site-specific cross-sections, circuit edits | Via voids, interface defects |
| TEM | Atomic-scale imaging of thin lamellae | Gate stack defects, dislocations |
| Nanoprobing | Probe individual transistors | Vt shifts, leakage |

FA equipment suppliers include Thermo Fisher Scientific, Hitachi High-Tech, ZEISS, JEOL, Nordson (X-ray/SAM), PVA TePla (SAM), Hamamatsu (emission microscopy).

### 33.2 Reliability testing

| Test | Stress | Typical condition (indicative; see JEDEC JESD22 / AEC-Q100) | Failure mechanisms accelerated |
|---|---|---|---|
| Burn-in | Elevated T and V | e.g., 125 °C, overvoltage, hours to days | Infant mortality |
| HTOL (high-temperature operating life) | Temperature + bias, operating | 125 °C (or Tj max), 1 000 h | Oxide breakdown, BTI, HCI, EM |
| HAST (highly accelerated stress test) | Humidity + temperature + pressure + bias | 130 °C / 85 % RH, 96 h (biased) | Corrosion, moisture ingress |
| THB / H3TRB | Temperature-humidity-bias | 85 °C / 85 % RH, 1 000 h | Corrosion, leakage (power devices at high voltage) |
| Temperature cycling (TC) | −55/−65 °C ↔ +125/+150 °C | 500–1 000+ cycles | Solder fatigue, wire-bond lift, die crack, delamination |
| Thermal shock | Liquid-to-liquid rapid transitions | 100s of cycles | Package cracking |
| HTSL (high-temperature storage) | Temperature, unbiased | 150 °C, 1 000 h | Intermetallic growth, bond degradation |
| Preconditioning / MSL | Moisture soak + reflow simulation | JEDEC J-STD-020 levels | Popcorning, delamination |
| ESD (HBM, CDM) | Electrostatic discharge pulses | kV levels by model | Gate oxide/junction damage |
| Latch-up | Current injection | JESD78 | Parasitic thyristor triggering |
| Mechanical | Drop, vibration, shock, bend | Board-level JEDEC tests | Solder joint cracks |
| Power cycling (power modules) | Self-heating on/off | ΔTj 60–100 K, tens of thousands of cycles | Bond-wire lift-off, solder fatigue |

### 33.3 Intrinsic wear-out mechanisms

| Mechanism | Physics | Key parameters | Mitigation |
|---|---|---|---|
| Electromigration (EM) | Electron wind moves metal atoms in interconnects, forming voids/hillocks | Current density, temperature (Black’s equation) | Cu with caps, liners, design rules for current |
| TDDB (time-dependent dielectric breakdown) | Gradual trap generation until the dielectric breaks down | Field, temperature, thickness | Oxide quality, voltage limits |
| BTI (bias temperature instability: NBTI/PBTI) | Vₜ shifts under gate bias at high temperature | Gate field, T | Process tuning, design guard-bands |
| HCI (hot-carrier injection) | Energetic carriers damage the gate oxide near the drain | Drain field | LDD structures, voltage limits |
| Stress migration | Voiding from mechanical stress | Temperature history | Barrier design |

Black’s equation (L3):

MTTF=A J^(-n) e^(E_a/kT)

Arrhenius acceleration underlies most high-temperature tests: raising temperature by tens of °C compresses years of field life into weeks.

## Part XXXIV — Standards and frameworks

| Standard / body | Scope | Where it applies |
|---|---|---|
| JEDEC | Memory interfaces (DDR, LPDDR, HBM), package outlines (MO), reliability tests (JESD22, JESD47), moisture sensitivity (J-STD-020/033 with IPC) | Chip suppliers, OSATs, memory |
| SEMI standards | Equipment interfaces (SECS/GEM, E84 load-port handshake, GEM300), FOUPs (E47.1), wafer specs (M1), wafer ID marking (T7, M12/M13), safety (S2, S8), environmental | Fabs, equipment makers, wafer suppliers |
| IPC | PCB design (IPC-2221), bare board quality (IPC-6012), assembly acceptability (IPC-A-610), soldering (J-STD-001), rework (IPC-7711/7721) | EMS / PCB |
| ISO 14644 | Cleanroom classification and monitoring | Fabs, OSATs, EMS clean areas |
| AEC-Q100 / Q101 / Q102 / Q104 / Q200 | Automotive qualification for ICs, discretes, optoelectronics, multichip modules, passives | Automotive supply chain |
| AQG 324 | Automotive power-module qualification (European guideline) | SiC/IGBT modules |
| ISO 26262 | Functional safety for road vehicles (ASIL levels) | Automotive chips and systems |
| IATF 16949 | Automotive quality management system | Automotive suppliers incl. fabs and OSATs |
| ISO 9001 | General quality management | All |
| ISO 14001 / ISO 45001 | Environmental / occupational health and safety management | Manufacturing sites |
| MIL-STD-883 / MIL-PRF-38535 | Military microcircuit test methods and qualification | Defence and space |
| ESCC / NASA EEE-INST-002 | Space component qualification | Space |
| IEC 60747 / 60749 | Semiconductor devices and test methods | Discretes, general |
| Telcordia GR-468 | Reliability of optoelectronic devices | Lasers, transceivers |
| IEC 60825 | Laser product safety | Laser equipment, VCSEL products |
| UCIe, CXL, PCIe, USB, Ethernet (IEEE 802.3) | Interconnect and interface standards | Chip designers, systems |
| RoHS, REACH | Hazardous substances restrictions | All electronics |

Key takeaways — Parts XXXIII–XXXIV

Reliability is proven by acceleration: temperature, voltage, humidity and cycling compress field life into test time.

FA runs from non-destructive to destructive, locating then imaging the defect.

JEDEC and SEMI govern the chip and fab world; IPC governs boards; AEC/ISO 26262/IATF govern automotive.

Glossary terms introduced: FA, SAM/CSAM, OBIRCH, EMMI, FIB, TEM, EDS, burn-in, HTOL, HAST, THB, TC, HTSL, MSL, ESD (HBM/CDM), latch-up, EM, TDDB, BTI, HCI, Black’s equation, Arrhenius, AEC-Q100, ISO 26262, IATF 16949, JEDEC, SEMI, IPC-A-610.
