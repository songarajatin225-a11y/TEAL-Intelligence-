---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 19
part_title: "Parts XLVII–XLIX — Case studies"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts XLVII–XLIX — Case studies

## Part XLVII — Follow one chip: a hypothetical 3 nm-class smartphone SoC

Assumptions (illustrative): die area 110 mm²; 300 mm wafer; foundry wafer price in the high-teens of thousands of US dollars per wafer (public estimates for 3 nm-class wafers vary widely); ~500 gross die; mature-ramp die yield ~80 %; InFO-type fan-out package-on-package with LPDDR on top. Cost shares are orders of magnitude for teaching, not a real product’s bill of materials.

| # | Stage | What happens | Equipment | Materials | Quality control | Yield / value note |
|---|---|---|---|---|---|---|
| 1 | Quartz → MG-Si | Carbothermic reduction | Submerged-arc furnace | Quartz, carbon | Chemical assay | Negligible cost per chip |
| 2 | MG-Si → polysilicon | TCS distillation, Siemens CVD | Fluidised-bed hydrochlorinator, distillation columns, bell-jar reactors | HCl, H₂ | ppt-level B/P/metal assay | Well under $1 of silicon per chip |
| 3 | Polysilicon → 300 mm ingot | MCZ growth | Crystal puller | Quartz crucible, Ar, dopant | Resistivity, oxygen, defect profile | — |
| 4 | Ingot → prime/epi wafer | Slice, grind, polish, clean | Wire saw, DSP, CMP, inspection | Diamond wire, slurries | Flatness (SFQR), LPD, metals | Blank wafer ~low hundreds of $ |
| 5 | Front-end: transistors | ~20–30 FEOL/MOL mask layers: STI, wells, fins, gates (HKMG), epi S/D, contacts | EUV + ArFi scanners, etch, ALD, epi, implant, anneal, CMP | Resists, precursors, gases, targets | CD-SEM, OCD, overlay, e-beam inspection | Most process cost and most yield loss |
| 6 | Back-end-of-line: wiring | ~15 metal levels, Cu damascene in low-k; EUV on tightest levels | Dielectric CVD, etch, PVD barrier/seed, ECD Cu, CMP | Cu, Ta/TaN, Co/Ru liners, low-k precursors | Resistance, via chains, defect scans | — |
| 7 | Logic → SoC | CPU cores, GPU, NPU, ISP, modem interfaces, SRAM caches realised physically | (Designed upstream with EDA; embodied here) | — | Design-for-test structures inserted | Value set by design IP |
| 8 | Wafer sort | Test each die at speed; bin; KGD | Prober, probe card, ATE | Probe cards | Coverage, speed bins | ~80 % good die → ~400 per wafer |
| 9 | Thin + dice | Backgrind; laser groove + blade or stealth dicing | DISCO grinder/dicer | Tapes, blades | Chipping, die strength | — |
| 10 | Fan-out PoP packaging | Reconstituted wafer, RDL, TIVs; LPDDR stacked on top | Pick-and-place, compression mould, litho/plating for RDL, ball attach | EMC, polyimide, Cu, solder | X-ray, warpage, RDL continuity | Package + test is a meaningful share of chip cost |
| 11 | Final test | System-level test, speed binning | Handlers, ATE, SLT racks | Sockets | Escapes, DPPM | Final yield high (> 95 %) |
| 12 | PCB assembly | SoC-PoP, PMICs, RF modules etc. onto HDI/any-layer board | SMT line, reflow, AOI, X-ray | Solder paste, underfill | ICT, functional test | EMS margin small |
| 13 | Smartphone | Box build, display, battery, camera, enclosure | Assembly lines, test stations | — | Final QA, RF calibration | Brand/OEM captures the largest share of end-product value |
| 14 | Consumer | Uses for ~3–5 years | — | — | Field returns | — |

Illustrative per-die cost stack (order of magnitude): wafer at high-teens $k ÷ ~400 good die ≈ tens of dollars per die; packaging and test add several dollars; the SoC’s selling price to the phone maker is typically a multiple of its manufacturing cost, reflecting design, IP and R&D amortisation.

## Part XLVIII — Follow one EV

| Subsystem | Semiconductor | Function | Manufacturing technology | Package | Example suppliers |
|---|---|---|---|---|---|
| Battery management | Cell-monitoring AFE ICs, isolators, MCU, current sensor | Measure cell voltages/temperatures, balance cells, estimate SoC/SoH | BCD 90–180 nm; Hall/TMR sensors; MCU 28–90 nm | QFP/TSSOP, AEC-Q100 | ADI, TI, NXP, Infineon, Renesas |
| Traction inverter | SiC MOSFETs (800 V platforms) or Si IGBTs + diodes; isolated gate drivers; DSP/MCU | DC→3-phase AC for the motor | SiC 150/200 mm planar/trench; IGBT on 200/300 mm Si; driver ICs on BCD with isolation (capacitive/magnetic) | Power modules (sintered die, Cu clips, AMB substrates) | Infineon, STMicro, onsemi, Wolfspeed, ROHM, Bosch, BYD Semiconductor |
| Motor control | MCU with motor-control timers, resolver-to-digital, sensors | Torque/speed control | MCU 28–40 nm with eFlash; magnetic sensors | QFP/BGA | Infineon (AURIX), NXP, Renesas, TI |
| On-board charger + DC-DC | SiC or GaN switches, PFC controllers, MCU | AC→DC charging; HV→12/48 V | SiC, GaN-on-Si | Discrete/modules | Infineon, Navitas, TI, onsemi |
| Vehicle compute / zonal | Automotive MCUs and SoCs, Ethernet switches, CAN-FD transceivers | Body, chassis, gateway | 16–40 nm | BGA, QFP | NXP, Renesas, Infineon, TI, Marvell, Broadcom |
| ADAS | ADAS SoC, 77 GHz radar MMIC, CIS, LiDAR emitters/detectors, LPDDR | Perception and driving assistance | 5–16 nm SoC; RF CMOS 22–40 nm; CIS; 905 nm EEL / VCSEL; SPAD | FCBGA, eWLB (radar) | NVIDIA, Mobileye, Qualcomm, Horizon Robotics; TI/NXP/Infineon radar; Sony/onsemi/OmniVision CIS |
| Infotainment / cockpit | Cockpit SoC, LPDDR, UFS, audio DSP, display serializers | Displays, audio, navigation | 4–7 nm SoC | FCBGA | Qualcomm, MediaTek, Samsung, NXP |
| Connectivity | Telematics modem (4G/5G), GNSS, Wi-Fi/BT, V2X | Remote services, OTA updates | Advanced CMOS + RF | Modules | Qualcomm, u-blox, MediaTek |
| Charging (off-board DC fast charger) | SiC modules, controllers | Grid AC → high-power DC | SiC | Power modules | Infineon, Wolfspeed, STMicro |
| Sensors (general) | Pressure, temperature, IMU, position, current | Safety and control | MEMS, Hall/TMR, CMOS | SOIC, QFN | Bosch, Melexis, Allegro, Infineon |

What makes the EV different from an ICE car: far more power-semiconductor content (inverter, OBC, DC-DC) and a shift to wide-bandgap SiC/GaN; battery monitoring electronics; heavier compute for ADAS and software-defined vehicle architectures.

## Part XLIX — Follow one AI server

| Component | Semiconductor technology | Packaging | Why it matters |
|---|---|---|---|
| AI GPU / accelerator | 3–5 nm-class logic; often multiple reticle-limited dies or chiplets | CoWoS-S/-L-class 2.5D with HBM stacks on an ABF FCBGA substrate | Compute; die size near reticle limit makes yield and packaging critical |
| HBM3E / HBM4 | DRAM 1b/1c-class dies, TSVs, 8–16-high stacks, logic base die | 3D stack; MR-MUF, TC-NCF or hybrid bonding | Memory bandwidth — frequently the limiting resource |
| Host CPU | 3–5 nm chiplets (compute dies + I/O die) | FCBGA, chiplet packaging | Orchestration, pre-processing |
| Scale-up interconnect | Switch ASICs, SerDes at 200G-class per lane | FCBGA; copper backplanes | GPU-to-GPU bandwidth inside a rack |
| Scale-out networking | 51.2T-class switch ASICs (3–5 nm), DSP-based optical modules (800G/1.6T), SiPh or EML lasers; NICs/DPUs | FCBGA; CPO emerging | Cluster bandwidth; optics are a major power item |
| Storage | Enterprise NVMe SSD controllers + 200–300+ layer TLC/QLC NAND | BGA | Dataset and checkpoint storage |
| Server memory | DDR5 RDIMM with RCD, PMIC, SPD hub | DIMM modules | CPU memory |
| Power delivery | 48 V → point-of-load VRMs (Si MOSFET/DrMOS, GaN emerging); PSUs with SiC/GaN; hot-swap controllers | Power stages, modules | Rack powers of tens to 100+ kW demand high-efficiency conversion |
| Management | BMC SoC, security chips, FPGAs | BGA | Telemetry, secure boot |
| Cooling support | Sensors, pump/fan controllers | — | Liquid cooling now common at the high end |

Key insight: the AI server concentrates four bottlenecks in one box — leading-edge logic, HBM, CoWoS-class packaging and optical interconnect — plus a power-electronics challenge at rack level.

Key takeaways — case studies

A smartphone SoC’s value sits in design and leading-edge front-end; its silicon raw material is negligible.

An EV shifts content toward power semiconductors and mature-node MCUs.

An AI server shifts value toward memory, packaging, networking and power delivery around the GPU.
