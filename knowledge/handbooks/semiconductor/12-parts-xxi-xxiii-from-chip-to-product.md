---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 12
part_title: "Parts XXI–XXIII — From chip to product"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts XXI–XXIII — From chip to product

L1 summary. A packaged IC is a component, not a product. Electronics manufacturing (EMS/ODM) mounts components on printed circuit boards, tests them, and integrates boards into systems. This is a separate industry from semiconductor manufacturing: different equipment, materials, economics, cleanliness and companies — and it is where India has the most scale today.

## Part XXI — Electronic system value chain

| Level | Example | Who makes it |
|---|---|---|
| Packaged IC | Application processor, PMIC | Chip company via foundry + OSAT |
| Module | System-in-package, camera module, Wi-Fi module, DRAM DIMM, power module | OSATs, module makers (Murata, LG Innotek, Sunny Optical), memory makers |
| PCB | Bare board: FR-4, high-Tg, HDI, any-layer, flex, rigid-flex | PCB fabricators (Zhen Ding, Unimicron, TTM, Nippon Mektec, AT&S, Tripod) |
| PCBA | Populated board | EMS (Foxconn/Hon Hai, Pegatron, Jabil, Flex, Wistron, Luxshare, Celestica, Sanmina, BYD Electronic; India: Dixon, Kaynes, SGS/Syrma, VVDN, Tata Electronics) |
| System / box build | Phone, server, inverter, ECU | ODM/EMS or OEM |
| Product | Branded product | OEM (Apple, Samsung, Dell, Tesla, Bosch…) |

### SMT line

| Step | Equipment | Key parameters | Typical defects | Suppliers (examples) |
|---|---|---|---|---|
| Solder paste printing | Stencil printer | Paste volume, alignment | Insufficient/excess paste, bridging | ASMPT (DEK), ITW EAE (MPM), Fuji |
| SPI | 3D solder paste inspection | Volume, height, offset | — | Koh Young, CyberOptics (Nordson), Parmi |
| Pick & place | Chip shooters + flex placers | CPH (components per hour), accuracy (~±25–40 µm) | Missing, shifted, tombstoned parts | Fuji, ASMPT (SIPLACE), Panasonic, Yamaha, Hanwha, Juki, Mycronic |
| Reflow | Convection / vapour-phase ovens (N₂ optional) | Thermal profile (peak ~240–250 °C for SAC) | Voids, head-in-pillow, cold joints | Heller, Rehm, BTU, ERSA |
| AOI | 2D/3D optical inspection | Coverage, false-call rate | — | Koh Young, Omron, Mirtec, Saki, Viscom |
| AXI | X-ray | Hidden joints (BGA, QFN) | Voids, bridging | Nordson, Viscom, Nikon, Saki |
| THT / selective solder | Wave, selective solder | — | — | ERSA, Kurtz |
| ICT | Bed-of-nails, flying probe | Coverage of opens/shorts/values | — | Keysight, Teradyne, Takaya, SPEA |
| Functional test / box build | Custom rigs, end-of-line test | Pass yield | — | In-house, NI, Chroma |
| Conformal coat / potting | Selective coating | — | — | Nordson, PVA |

Semiconductor vs electronics manufacturing — do not confuse

|  | IC packaging (ATMP) | PCB assembly (EMS) |
|---|---|---|
| Input | Wafer / die | Packaged components + bare PCB |
| Scale of features | µm (bond pads ~40–100 µm; bumps 25–150 µm) | 100s µm to mm (0201/01005 passives, 0.35–0.8 mm BGA pitch) |
| Environment | Cleanroom ISO 6–7 (advanced packaging tighter) | ESD-controlled factory, sometimes ISO 8 |
| Output | Component | Board / product |
| Standards | JEDEC, SEMI | IPC (IPC-A-610, J-STD-001) |

## Part XXII — End products and semiconductor content

| Market | Products | Dominant semiconductor content |
|---|---|---|
| Consumer electronics | Smartphones, tablets, laptops, PCs, smartwatches, TVs, cameras, consoles, wearables, appliances | Advanced SoCs, LPDDR/NAND, RF front-end, CIS, PMICs, display drivers, MCUs in appliances, motor drivers |
| Automotive | EV, ICE vehicles, ADAS, autonomy, infotainment, BMS, powertrain, motor control, charging | MCUs (lots), SiC/IGBT power, gate drivers, BMS AFEs, radar/camera/LiDAR chips, ADAS SoCs, CAN/Ethernet PHYs, sensors |
| Data centre | CPUs, GPUs, accelerators, networking, storage, memory, optics, power | Leading-edge logic, HBM, DDR5, enterprise SSD, switch ASICs, DSPs and lasers in optical modules, 48 V power stages |
| Telecom | 4G/5G/6G, base stations, optical networks, routers, switches | Baseband SoCs, RF (GaN PA, LDMOS), FPGAs, coherent DSPs, InP lasers, network processors |
| Industrial | PLC, robotics, CNC, drives, machine vision, sensors, factory automation | MCUs, FPGAs, IGBT/SiC modules, isolators, ADCs, industrial Ethernet, CIS |
| Aerospace & defence | Avionics, radar, satellites, navigation, comms, missile electronics, space electronics | Rad-hard FPGAs/processors, GaN RF (AESA radar), high-reliability analog, MEMS IMUs, secure memory |
| Healthcare | MRI, CT, ultrasound, patient monitors, wearables, diagnostics | Precision ADCs/AFEs, CT/X-ray detectors, ultrasound transducer ASICs, FPGAs, low-power MCUs, biosensors |
| Energy | Solar, batteries/BMS, inverters, EV charging, grid, storage | IGBT/SiC/GaN, gate drivers, BMS ICs, MCUs/DSPs, current sensors, isolation, PV cells (themselves semiconductors) |
| Semiconductor manufacturing | Scanners, etchers, inspection, testers | FPGAs, high-end CPUs/GPUs for computation, precision ADCs, motion controllers, power electronics for RF/plasma, lasers, image sensors — the industry is also a customer of itself |

## Part XXIII — Application-to-chip mapping matrix

| End product | Major semiconductor types | Key chips | Typical package | Manufacturing technology | Notes |
|---|---|---|---|---|---|
| Smartphone | Logic, memory, RF, analog, sensors | Application processor SoC, LPDDR5X, UFS NAND + controller, PMICs, RF transceiver + front-end (PA/LNA/switch/filters), CIS, display driver IC, Wi-Fi/BT, NFC, fingerprint, IMU, audio codec | FOWLP/InFO PoP, FCBGA, WLCSP, SiP RF modules | 3 nm-class SoC; DRAM/NAND fabs; GaAs + SOI RF; BAW filters; stacked CIS 22–65 nm | Most advanced-node volume driver |
| Laptop / PC | Logic, memory, analog | CPU/APU (chiplets), GPU, DDR5/LPDDR5X, NVMe SSD, PMIC/VRs, EC (MCU), Wi-Fi, USB-C/TB retimers, audio | FCBGA, BGA | 3–7 nm CPU/GPU; mature analog | NPUs for AI PCs |
| Tablet | As smartphone | SoC, LPDDR, UFS, PMIC, CIS | FOWLP, WLCSP | As phone |  |
| Smartwatch / wearable | Low-power logic, sensors | Low-power SoC, PMIC, optical HR AFE, IMU, BLE radio, NOR/NAND | SiP, WLCSP | 5–22 nm SoC; MEMS; BCD | Extreme miniaturisation |
| TV | Logic, display | TV SoC, T-con, display driver ICs, LED drivers, PMIC, Wi-Fi | FCBGA, COF (chip-on-film) | 12–28 nm SoC; 28–90 nm DDIs |  |
| Gaming console | Logic, memory | Custom APU, GDDR6, SSD controller, PMIC | FCBGA | 5–7 nm |  |
| Digital camera | Sensors, logic | Large CIS, image processor, NAND | BGA, ceramic CIS package | CIS 40–90 nm |  |
| Home appliance | MCU, power | MCU, motor-drive IPM (IGBT/MOSFET), gate driver, sensors, Wi-Fi | QFP/QFN, IPM modules | 40–180 nm MCU; Si power | Mature-node heavy |
| Battery EV | Power, MCU, analog, sensors | SiC MOSFET or IGBT traction inverter, gate drivers, MCUs (dozens), BMS AFE/monitor ICs, isolated DC-DC, OBC PFC (SiC/GaN), current sensors, CAN/Ethernet PHYs | Power modules, QFP/BGA, AEC-Q100 packages | SiC 150/200 mm; MCUs 28–90 nm; BCD; Hall/TMR | Higher power semiconductor content than ICE |
| ICE vehicle | MCU, analog, sensors | Engine ECU MCUs, sensors, injector drivers, body MCUs | QFP, QFN | Mature |  |
| ADAS / autonomy | Logic, sensors, memory | ADAS SoC, 77 GHz radar MMIC (RF CMOS/SiGe), CIS, LiDAR lasers/detectors, LPDDR, safety MCU | FCBGA, eWLB/FOWLP (radar) | 5–16 nm SoC; 22–40 nm RF CMOS | ISO 26262 functional safety |
| Infotainment | Logic, memory | Cockpit SoC, LPDDR, UFS, audio DSP, display serializers | FCBGA | 4–7 nm |  |
| EV charger (DC fast) | Power, control | SiC MOSFETs/diodes modules, DSP/MCU, isolated gate drivers, metering | Power modules | SiC |  |
| AI server | Logic, memory, networking, power | GPU/accelerator + HBM3E/HBM4, host CPU, DDR5 RDIMM + RCD/PMIC, NVMe SSD + controller, NIC/DPU, switch ASIC, retimers, BMC, VRM power stages (MOSFET/GaN), optical transceivers | CoWoS-class 2.5D, FCBGA, OAM modules | 3–5 nm logic; HBM; 7/5 nm switch | Advanced packaging is the bottleneck |
| Enterprise storage server | Memory, controllers | SSD controllers, QLC/TLC NAND, DRAM cache | BGA | NAND 200+ layer |  |
| Network switch / router | Logic, optics | Switch ASIC (51.2T class), NPUs, SerDes, optical modules (DSP + lasers + PD) | FCBGA, CPO emerging | 3–7 nm switch ASIC; InP/SiPh optics |  |
| 5G base station | RF, logic | Baseband SoC/FPGA, beamforming ICs, GaN PAs, LNAs, high-speed ADC/DAC, clocking | FCBGA, air-cavity RF | 5–16 nm logic; GaN-on-SiC |  |
| Optical transceiver | Photonics, logic | DSP (PAM4), laser driver, TIA, lasers (EML/DFB/VCSEL or SiPh + CW laser), PDs | COB, hermetic/non-hermetic | 5–7 nm DSP; InP/GaAs lasers | See Part XXXI |
| Industrial robot | MCU, power, sensors | Motion controller MCU/FPGA/DSP, servo drives (IGBT/SiC), encoders, isolators, industrial Ethernet, vision SoC | QFP, BGA, power modules | Mature nodes; Si/SiC power |  |
| PLC / factory automation | MCU, analog | MCU/MPU, digital isolators, ADCs, fieldbus ICs, relays drivers | QFP/BGA | 28–90 nm | Long lifecycle |
| CNC / laser machine | Control, power, photonics | Motion control, drives, laser diode pumps, galvo drivers, FPGAs | Various | Mature logic; GaAs pump diodes | Relevant to laser equipment builders |
| Solar inverter | Power | IGBT/SiC modules, DSP/MCU, gate drivers, current sensors | Power modules | Si/SiC |  |
| Grid-scale BESS | Power, analog | BMS ICs, power conversion (IGBT/SiC), MCUs | Modules | Mature |  |
| Satellite | Rad-hard logic, RF | Rad-hard FPGAs/processors, GaN/GaAs RF, rad-hard memory, solar cells (GaAs multi-junction), DC-DC | Ceramic, hermetic | Rad-hard processes | Radiation qualification |
| Radar (defence) | RF | GaN MMIC T/R modules, beamformers, FPGAs, ADCs | Ceramic/air cavity | GaN-on-SiC |  |
| Medical imaging (CT/MRI/US) | Analog, sensors, logic | Detector ASICs, precision ADCs, FPGAs, GPUs, ultrasound AFE/transducer drivers | BGA, flip chip | Mature analog + GPUs |  |
| Patient monitor / medical wearable | Analog, MCU | Bio-potential AFEs, SpO₂ AFE, low-power MCU, BLE | WLCSP, QFN | Mature | Regulatory (IEC 60601) |
| Semiconductor equipment | Logic, power, sensors, photonics | FPGAs, industrial PCs/GPUs, RF generators, precision ADCs, motion controllers, lasers, image sensors | Various | Mixed | Customer of its own industry |

Key takeaways — Parts XXI–XXIII

Chip → package → module → PCB → system: each arrow is a different industry and supplier set.

Most end products combine one or two advanced-node chips with dozens of mature-node analog, power and sensor chips.

EVs and AI servers are the two fastest-shifting semiconductor content stories (power and memory/packaging respectively).

Glossary terms introduced: EMS, ODM, OEM, PCBA, SMT, THT, SPI, AOI, AXI, ICT, flying probe, box build, reflow profile, SiP, PoP, COF, HDI, AEC-Q100, ISO 26262, OAM.
