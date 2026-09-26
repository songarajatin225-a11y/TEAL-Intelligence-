---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 7
part_title: "Parts X–XIII — Transistors, devices, design and nodes"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts X–XIII — Transistors, devices, design and nodes

## Chapter 14 — The MOSFET from scratch

L1 summary. A MOSFET is a voltage-controlled switch: a gate voltage, insulated from the silicon by a thin dielectric, creates or removes a conducting channel between source and drain. Every generation since the 1960s has aimed to give the gate stronger control over a shorter channel — which is why the transistor went from flat (planar) to fin (FinFET) to fully wrapped (gate-all-around).

### 14.1 MOS capacitor → MOSFET

MOS capacitor: metal (gate) – oxide – semiconductor. A positive gate voltage on p-type Si repels holes (depletion), then attracts electrons to the surface (inversion).

Threshold voltage (Vₜ): gate voltage at which a strong inversion layer forms — typically ~0.2–0.5 V in modern logic.

Add source and drain: heavily doped n⁺ regions either side. When V_G > Vₜ, the inversion layer connects them and current flows under drain bias.

nMOS + pMOS = CMOS: complementary pairs draw almost no static current, which made billion-transistor chips thermally possible.

Drain current (long-channel, saturation, L3):

I_D=(1)/(2) μ C_(ox) (W)/(L) (V_(GS)-V_T)^2

Short channels break this model: velocity saturation, drain-induced barrier lowering (DIBL), and leakage when the gate can no longer shut off the channel. Subthreshold swing — the gate voltage needed to change current 10× below Vₜ — has a physical limit of ~60 mV/decade at room temperature for conventional MOSFETs.

### 14.2 Architecture evolution

| Architecture | Gate control | Introduced in volume | Key idea | Status |
|---|---|---|---|---|
| Planar bulk MOSFET | One side (top) | 1970s–2011 at the leading edge | Flat channel under gate | Mature; still dominant at ≥ 28 nm |
| Planar FD-SOI | Top + back-bias through buried oxide | 28/22/18/12 nm-class | Ultra-thin fully-depleted channel on insulator | Mature niche (low power, RF, auto) — GlobalFoundries, Samsung, STMicroelectronics |
| High-k / metal gate (HKMG) | Stack change, not shape | 45 nm (Intel, 2007) | HfO₂ replaces SiO₂ to cut gate leakage | Standard |
| FinFET | Three sides of a vertical fin | 22 nm (Intel, 2011); 16/14 nm foundry | Channel is a fin; gate wraps it | Mature; 16 → 3 nm-class |
| Gate-all-around (GAA) nanosheet | All four sides of stacked horizontal sheets | Samsung 3 nm (2022); TSMC N2 and Intel 18A (RibbonFET) in 2025–26 ramp | Stacked sheets, width tunable | Emerging → production |
| Nanowire | All around a thin wire | Research/variants | Narrow GAA | Mostly superseded by sheets |
| Forksheet | GAA sheets separated by a dielectric wall | Research / announced roadmaps | Tighter n-p spacing | R&D |
| CFET (complementary FET) | nMOS stacked on pMOS | Research (imec and major fabs demonstrations) | Vertical stacking halves footprint | Research, targeted for 2030s |
| 2D-channel FETs (MoS₂, WSe₂) | Atomically thin channel | Research | Beyond Si channel | Research |

Backside power delivery (Intel PowerVia, TSMC Super Power Rail on A16) moves power wiring under the transistors, freeing front-side routing — a major architecture change alongside GAA.

## Chapter 15 — How a transistor becomes a computer

L1 summary. Transistors form logic gates; gates form arithmetic and memory elements; those form processors. Every CPU is, physically, hundreds of millions to tens of billions of switches wired into this hierarchy.

| Block | Transistors (CMOS, typical) | Function |
|---|---|---|
| NOT (inverter) | 2 | Output = inverse of input |
| NAND / NOR | 4 | Universal: any logic can be built from NAND alone |
| AND / OR | 6 | NAND/NOR + inverter |
| XOR | ~8–12 | Output 1 when inputs differ; core of adders |
| Multiplexer (2:1) | ~6–12 | Selects one of two inputs |
| D flip-flop | ~20–24 | Stores 1 bit on a clock edge |
| SRAM cell | 6 (6T) | Static bit storage for caches and registers |
| Full adder | ~28 | Adds 3 bits |
| 32-bit ALU | ~thousands | Arithmetic and logic operations |
| Control unit | ~tens of thousands+ | Decodes instructions, sequences datapath |

How a CPU executes: fetch instruction from cache → decode → read registers → execute in ALU → access memory → write back. Pipelining overlaps these stages; out-of-order execution and branch prediction keep them full. Caches (SRAM, L1/L2/L3) hide the ~100 ns latency of DRAM from a core running at ~0.3 ns per cycle.

An SoC integrates CPU cores, GPU, NPU (AI engine), ISP (image signal processor), modem (in phones), memory controllers, PCIe/USB PHYs, security and power management on one die — or increasingly across chiplets (Ch 23).

## Part XI — Semiconductor device taxonomy

L1 summary. “Chips” span very different businesses. Leading-edge logic grabs headlines; analog, power, discrete, RF and sensors make up most units shipped and run on mature nodes and different materials.

| Category | Device | Function | Typical technology | Typical node / material | Example suppliers (non-exhaustive) |
|---|---|---|---|---|---|
| A. Logic | CPU | General-purpose compute | Advanced CMOS | 3–7 nm-class | Intel, AMD, Apple, Qualcomm, Arm licensees |
|  | GPU | Parallel compute, graphics, AI | Advanced CMOS + CoWoS + HBM | 3–5 nm-class | NVIDIA, AMD, Intel |
|  | TPU / AI accelerator | Matrix compute for AI | Advanced CMOS, custom ASIC | 3–7 nm-class | Google, AWS, Microsoft, Meta, Broadcom/Marvell (custom) |
|  | FPGA | Reprogrammable logic | CMOS | 7–28 nm | AMD (Xilinx), Intel (Altera), Lattice, Microchip |
|  | ASIC | Application-specific | CMOS, any node | 3 nm – 180 nm | Broadcom, Marvell, MediaTek, many design houses |
|  | SoC | System on chip | CMOS | 3–28 nm | Apple, Qualcomm, MediaTek, Samsung |
|  | MCU | Embedded control with on-chip flash | CMOS + embedded NVM | 16–180 nm (mostly 28–90 nm) | Renesas, NXP, STMicroelectronics, Infineon, Microchip, TI |
|  | DSP | Signal processing | CMOS | 16–65 nm | TI, Analog Devices, CEVA (IP) |
| B. Memory | SRAM | Fast cache | CMOS 6T | Embedded | All logic vendors |
|  | DRAM | Main memory | 1T1C trench/stacked capacitor | 1x–1c nm-class DRAM | Samsung, SK hynix, Micron, CXMT |
|  | HBM | Stacked high-bandwidth DRAM | DRAM + TSV + base die | DRAM nodes + logic base die | SK hynix, Samsung, Micron |
|  | NAND flash | Mass storage | 3D charge-trap | 200–300+ layers | Samsung, SK hynix (+Solidigm), Kioxia, Western Digital/SanDisk, Micron, YMTC |
|  | NOR flash | Code storage | Floating gate | 45–65 nm | Winbond, Macronix, Infineon, GigaDevice |
|  | MRAM / ReRAM / PCM | Emerging NVM | Magnetic / resistive / phase change | 22–28 nm embedded | Everspin, foundry embedded offerings |
| C. Analog / mixed-signal | ADC, DAC, amplifier, comparator | Real-world ↔ digital interface | Analog CMOS, BiCMOS | 65–350 nm | Analog Devices, TI, STMicro, Microchip, NXP |
|  | PMIC, voltage regulator | Power conversion and sequencing | BCD (bipolar-CMOS-DMOS) | 40–180 nm | TI, Qualcomm, MPS, Renesas (Dialog), Infineon, ADI |
|  | Sensor interface / AFE | Signal conditioning | Mixed-signal CMOS | 65–180 nm | ADI, TI, Renesas, ams OSRAM |
| D. Power | Si MOSFET | Low/medium-voltage switching | Trench / superjunction | 150–300 mm Si | Infineon, onsemi, STMicro, Vishay, Nexperia, Toshiba |
|  | IGBT | High-voltage, high-current switching | FZ/CZ Si, thin-wafer | 200–300 mm Si | Infineon, Mitsubishi Electric, Fuji Electric, onsemi, StarPower, BYD |
|  | Power diode | Rectification | Si PIN / fast recovery | Si | Many |
|  | SiC MOSFET / diode | High-voltage, high-temperature, efficient | 4H-SiC | 150 → 200 mm SiC | STMicro, Infineon, Wolfspeed, onsemi, ROHM, Bosch |
|  | GaN HEMT | Fast, efficient switching ≤ 650 V (emerging higher) | GaN-on-Si | 150–200 mm (300 mm announced) | Infineon (GaN Systems), Navitas, EPC, Innoscience, TI, Transphorm/Renesas |
|  | Power module | Packaged multi-die switches | DBC/AMB substrates, sintering | — | Infineon, Mitsubishi, Semikron Danfoss, Fuji, BYD |
| E. RF | RF CMOS / RF SOI | Transceivers, switches | CMOS / SOI | 22–130 nm | Qualcomm, MediaTek, GlobalFoundries/Tower (foundry) |
|  | GaAs HBT / pHEMT | Handset PAs, LNAs | GaAs | 150 mm | Qorvo, Skyworks, Broadcom, WIN Semiconductors (foundry) |
|  | GaN RF | Base-station and radar PAs | GaN-on-SiC | 100–150 mm | Qorvo, Wolfspeed RF (MACOM), Sumitomo Electric, NXP |
|  | LDMOS | Base-station, industrial RF | Si | 200 mm | NXP, Ampleon |
|  | RF front-end (PA, LNA, switch, filters) | Complete antenna-side chain | Modules: GaAs + SOI + BAW/SAW filters | — | Qualcomm, Qorvo, Skyworks, Murata, Broadcom |
| F. Discrete | Rectifier, Schottky, Zener, TVS, BJT, small-signal MOSFET | Protection, rectification, switching | Si planar | 150–200 mm, 0.35–2 µm | Nexperia, Vishay, onsemi, ROHM, Diodes Inc., Littelfuse |
| G. Sensors | CMOS image sensor | Imaging | Stacked BSI CMOS, hybrid bonded | 22–65 nm + logic die | Sony, Samsung, OmniVision, STMicro, onsemi |
|  | MEMS inertial, pressure, microphone | Motion, pressure, sound | Si micromachining | 150–200 mm | Bosch, STMicro, TDK InvenSense, Knowles, Infineon |
|  | Temperature, magnetic (Hall/TMR), gas, biosensor | Environment and body sensing | CMOS + special materials | Mature | TI, Allegro, Melexis, Sensirion, ams OSRAM |

## Chapter 16 — Semiconductor design flow

L1 summary. A chip is designed in software long before it is manufactured. Designers describe behaviour in RTL code, verify it, synthesise it into gates, place and route those gates physically, sign it off against the foundry’s rules, and “tape out” a GDSII/OASIS database from which masks are made. A leading-edge SoC design costs hundreds of millions of dollars; verification typically consumes the most effort.

| Stage | What happens | Key tools / inputs |
|---|---|---|
| Specification | Function, performance, power, area, cost targets | Customer requirements |
| Architecture | Block diagram, IP selection, memory hierarchy | Modelling (SystemC, performance models) |
| RTL | Register-transfer-level code | Verilog, SystemVerilog, VHDL |
| Verification | Prove RTL matches spec | UVM simulation, formal, hardware emulation (Cadence Palladium, Synopsys ZeBu, Siemens Veloce) |
| Synthesis | RTL → gate netlist using standard cells | Synopsys Design Compiler / Fusion, Cadence Genus |
| Physical design | Floorplan, placement, clock-tree synthesis, routing | Synopsys ICC2/Fusion Compiler, Cadence Innovus |
| STA | Static timing analysis at all corners | Synopsys PrimeTime, Cadence Tempus |
| DRC / LVS | Design-rule check; layout vs schematic | Siemens Calibre, Synopsys IC Validator, Cadence Pegasus |
| Tapeout | Final database to mask shop | Mask data preparation, OPC |

Key concepts

EDA (electronic design automation): software for design and verification. Three US-headquartered companies dominate: Synopsys (which acquired Ansys in 2025), Cadence, and Siemens EDA.

IP (intellectual property) cores: pre-designed blocks licensed for reuse — CPU cores (Arm, RISC-V vendors such as SiFive, Andes), interface PHYs (Synopsys, Cadence, Alphawave), memory compilers, SerDes.

Standard cells: pre-characterised gate library provided per process.

PDK (process design kit): foundry-supplied models, rules, device layouts and libraries that encode what the fab can make.

DFM (design for manufacturing): layout practices that improve yield (redundant vias, litho-friendly patterns, dummy fill for CMP).

Business models

| Model | Designs | Owns fabs | Examples |
|---|---|---|---|
| IDM (integrated device manufacturer) | Yes | Yes | Intel, Samsung, TI, Infineon, STMicro, Micron, SK hynix |
| Fabless | Yes | No — uses foundries and OSATs | NVIDIA, AMD, Qualcomm, Broadcom, MediaTek, Apple (for its chips) |
| Foundry | No (customer designs) | Yes | TSMC, Samsung Foundry, GlobalFoundries, UMC, SMIC, Tower, Intel Foundry |
| Fab-lite | Yes | Partial | Many analog/MCU players outsource advanced nodes |

## Chapter 17 — Semiconductor process nodes

L1 summary. A “node” is a manufacturing generation, not a measurement. Until the mid-1990s, node names roughly tracked gate length; since then they have become marketing labels for a bundle of density, power and performance gains. No feature on a “3 nm” chip is 3 nm wide. Compare nodes by transistor density, contacted gate pitch (CGP) and minimum metal pitch (MMP) — and only within one company’s roadmap.

| Node (label) | Approx. era of volume | Transistor | Lithography (critical layers) | Typical CGP / MMP (indicative) | Typical applications today |
|---|---|---|---|---|---|
| 180 nm | ~1999 | Planar | KrF | — | Power, analog, BCD, sensors, discretes’ control ICs |
| 130 nm | ~2001 | Planar | KrF/ArF | — | Analog, PMIC, MCU, RF |
| 90 nm | ~2004 | Planar, strained Si | ArF | — | MCU, embedded flash, CIS |
| 65 nm | ~2006 | Planar | ArF | — | MCU, RF, CIS, connectivity |
| 45/40 nm | ~2008 | Planar, HKMG (Intel) | ArFi | — | MCU, connectivity, DTV, auto |
| 28 nm | ~2011 | Planar HKMG | ArFi | ~117 nm / ~90 nm | Long-lived “sweet spot”: MCUs, displays, IoT, auto, ISPs |
| 22 nm (incl. FD-SOI) | ~2012 | FinFET (Intel) / planar | ArFi | — | IoT, auto, RF, embedded MRAM |
| 16/14/12 nm | ~2014–15 | FinFET | ArFi double-patterning | ~78–90 nm / ~64 nm | Mid-range SoCs, networking, crypto, auto ADAS |
| 10 nm | ~2017 | FinFET | ArFi multi-patterning | — | Transitional |
| 7 nm | ~2018 | FinFET | ArFi SAQP; EUV (N7+) | ~57 nm / ~40 nm | GPUs, CPUs, SoCs |
| 5 nm | ~2020 | FinFET | EUV | ~51 nm / ~28–30 nm | Flagship phones, AI GPUs |
| 3 nm | ~2022–23 | FinFET (TSMC N3) / GAA (Samsung) | EUV | ~45–48 nm / ~21–23 nm | Flagship SoCs, AI accelerators |
| 2 nm-class (TSMC N2, Intel 18A, Samsung SF2) | 2025–26 ramp | GAA nanosheet; backside power (Intel 18A) | EUV | Not uniformly disclosed | Leading-edge CPUs, SoCs, AI |
| A16 / 14A / 1.4 nm-class | Announced for ~2026–2028+ | GAA + backside power; High-NA EUV evaluated | EUV / High-NA | Roadmap | Future |

Pitch figures are indicative from public technical disclosures and vary by variant; use company IEDM/VLSI papers for exact numbers.

Trade-offs by node

| Dimension | Mature (≥ 28 nm) | Advanced (≤ 7 nm) |
|---|---|---|
| Density | Low | Very high |
| Performance/W | Adequate | Highest |
| Wafer cost | Low (fully depreciated fabs) | Very high; rises steeply each node |
| Mask set cost | Low (~$1 M-ish or less at 28 nm and above; varies) | Very high (multi-million to > $10 M class) |
| Analog/HV/NVM options | Rich (BCD, eFlash, RF, HV) | Limited |
| Design cost | Low–moderate | Very high |
| Share of units | Majority | Minority, but large share of value |

Why mature nodes still matter: automotive, industrial, power, analog, display drivers, IoT and many MCUs do not benefit from advanced density, need high voltage or embedded NVM, and require 10–15 year product lives. The 2021–22 shortage was largely a mature-node shortage.

Key takeaways — Parts X–XIII

The transistor’s history is a history of gate control: planar → FinFET → GAA → CFET.

Device categories differ in materials, nodes, customers and economics — do not treat all as advanced logic.

Design is software-intensive and dominated by three EDA firms and a few IP vendors.

Node names are labels; compare densities and pitches.

Glossary terms introduced: MOSFET, CMOS, Vₜ, subthreshold swing, DIBL, HKMG, FinFET, GAA, nanosheet, forksheet, CFET, FD-SOI, backside power, NAND gate, flip-flop, 6T SRAM, ALU, SoC, NPU, ISP, BCD, IGBT, HEMT, LDMOS, HBT, BAW/SAW, CIS, BSI, RTL, UVM, synthesis, P&R, CTS, STA, DRC, LVS, GDSII, PDK, standard cell, DFM, IDM, fabless, foundry, node, CGP, MMP.
