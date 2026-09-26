---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 20
part_title: "Parts XXXIX, XLVI, L — Master maps and the industry on one page"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts XXXIX, XLVI, L — Master maps and the industry on one page

## Part XXXIX — Master value-chain map

| Stage | Major process | Equipment | Materials | Companies (examples) | Output | Key KPI | Major defect | Value-add |
|---|---|---|---|---|---|---|---|---|
| Raw materials | Mining, beneficiation | Mining, crushing | Quartz, carbon | Silicon-metal producers, HPQ miners | Lump quartz | Purity | Fe/Al contamination | Low |
| Silicon | Carbothermic reduction | Submerged-arc furnace | Quartz, coal | Ferroglobe, Elkem, Chinese producers | MG-Si (~99 %) | Energy/t, purity | Metallic impurities | Low |
| Polysilicon | TCS route, Siemens CVD | Distillation, bell-jar reactors | HCl, H₂ | Wacker, Hemlock, Tokuyama, OCI | 9N–11N poly | ppt B/P, metals | Donor/acceptor contamination | Medium |
| Ingot | CZ / FZ growth | Crystal pullers | Crucibles, Ar | Shin-Etsu, SUMCO, GlobalWafers, Siltronic, SK siltron | Single-crystal ingot | Dislocation-free yield, O₂ | COPs, slip | Medium |
| Wafer | Slice, grind, polish | Wire saws, DSP, CMP | Slurries, diamond wire | Same | Prime/epi/SOI wafer | Flatness, LPD | Particles, haze | Medium |
| Fab | Litho, deposition, etch, implant, CMP | ASML, Applied, Lam, TEL, KLA tools | Resists, gases, chemicals, targets | TSMC, Samsung, Intel, SMIC, GF | Patterned wafer | Yield, cycle time, D₀ | Particles, pattern defects | Very high |
| Transistor → IC | FEOL + BEOL integration | Same | Same | Same | Finished wafer | Parametric yield | Vt variation, opens/shorts | Very high |
| Wafer test | Probe, sort | Probers, ATE, probe cards | Probe cards | Foundries, OSATs, test houses | Wafer map, KGD | Sort yield, coverage | Escapes | Medium |
| Dicing | Grind, dice | DISCO grinders/dicers, lasers | Tapes, blades | OSATs | Singulated die | Chipping, die strength | Cracks | Low–medium |
| Packaging | Attach, bond, mould / advanced integration | Die/wire/FC bonders, moulding, bonding | Substrates, EMC, wire, solder | ASE, Amkor, JCET, TSMC (CoWoS) | Packaged IC | Assembly yield, UPH | Voids, delamination, wire sweep | Medium → high (advanced) |
| Final test | Functional, burn-in, SLT | Handlers, ATE | Sockets | OSATs, IDMs | Qualified component | DPPM, test cost/unit | Escapes | Medium |
| Component | Distribution, logistics | — | Reels, trays | Distributors (Arrow, Avnet, WPG) | Component in stock | Lead time | — | Low |
| Module | SiP, camera/RF/memory modules | SMT, bonding | Substrates | Murata, LG Innotek, memory makers | Module | Yield | — | Medium |
| PCB | Board fabrication + SMT | PCB lines; SMT lines | Laminates, Cu, solder | Zhen Ding, TTM; Foxconn, Jabil, Dixon | PCBA | First-pass yield | Solder defects | Low–medium |
| System | Box build, integration, software | Assembly/test lines | Mechanics, batteries, displays | ODMs, OEMs | Phone, server, ECU | Throughput, quality | Functional failures | Medium |
| End product | Brand, distribution, service | — | — | Apple, Samsung, Tesla, Dell | Product | Margin, share | Field failures | Very high |
| End market | Use | — | — | Consumers, enterprises, governments | Demand | Growth | — | — |

## Part XLVI — Final master table: quartz to finished products

| Stage | Input | Process | Output | Equipment | Material | KPI | Major companies | Major countries | Application |
|---|---|---|---|---|---|---|---|---|---|
| 1 Quartz | Ore | Mining, washing | Lump quartz | Mining plant | — | SiO₂ % | Silicon-metal and HPQ producers | China, USA, Norway, Brazil | All silicon |
| 2 MG-Si | Quartz + C | Arc-furnace reduction | 98–99.5 % Si | Submerged-arc furnace | Coal, electrodes | kWh/t | Ferroglobe, Elkem, Hoshine | China, Norway, Brazil | Alloys, polysilicon |
| 3 Polysilicon | MG-Si + HCl | TCS, distillation, Siemens | 9N–11N rods | Reactors | H₂, HCl | Purity | Wacker, Hemlock, Tokuyama | Germany, USA, Japan (EG); China (solar) | Wafers |
| 4 Ingot | Poly + dopant | CZ / FZ | Single crystal | Pullers | Crucibles | Defect-free length | Shin-Etsu, SUMCO, GlobalWafers | Japan, Taiwan, Germany, Korea | Wafers |
| 5 Wafer | Ingot | Wafering | 300 mm wafer | Saws, polishers | Slurries | Flatness, LPD | Same | Same | Fabs |
| 6 Front-end | Wafer | ~1 000+ steps | Processed wafer | Scanners, etch, dep, CMP, metrology | Resists, gases, chemicals | Yield, D₀ | TSMC, Samsung, Intel, SMIC, Micron, SK hynix | Taiwan, Korea, USA, China, Japan | All chips |
| 7 Sort | Processed wafer | Probe test | KGD map | Probers, ATE | Probe cards | Sort yield | Foundries, OSATs | Taiwan, Korea, China | — |
| 8 Back-end | Wafer + map | Grind, dice, bond, mould, test | Packaged IC | DISCO, BESI, ASMPT, K&S, Advantest | Substrates, EMC, wire | Assembly yield, DPPM | ASE, Amkor, JCET, TSMC | Taiwan, China, Malaysia, Korea, India (emerging) | Components |
| 9 PCBA | ICs + PCB | SMT | Board | SMT lines | Solder paste | FPY | Foxconn, Jabil, Dixon | China, Vietnam, India, Mexico | Products |
| 10a Smartphone | Boards, display, battery | Box build | Phone | Assembly lines | — | Throughput | Apple, Samsung, Xiaomi via Foxconn, Tata, Dixon | China, India, Vietnam | Consumer |
| 10b EV | Power modules, ECUs, battery | Vehicle assembly | EV | Automotive lines | — | Quality, cost | Tesla, BYD, Hyundai, Tata Motors | China, USA, Europe, Korea, India | Mobility |
| 10c AI server | GPU trays, CPUs, switches, optics | Rack integration | AI server / rack | Rack integration lines | Liquid cooling | Throughput, reliability | NVIDIA partners via Foxconn, Quanta, Wistron | Taiwan, Mexico, USA | Data centres |
| 10d Satellite | Rad-hard electronics, RF, solar cells | Integration and qualification | Satellite | Clean integration halls | — | Reliability | Airbus, Thales, SpaceX, ISRO | USA, Europe, China, India | Space |
| 10e Industrial robot | Motion controllers, drives, sensors | Assembly | Robot | Assembly | — | Uptime | FANUC, ABB, Yaskawa, KUKA | Japan, Europe, China | Industry |

## Part L — The semiconductor industry in one page

| Question | Answer in one line |
|---|---|
| Where value is created | Chip design and IP; leading-edge front-end manufacturing; advanced packaging and HBM; equipment and EDA monopolies/oligopolies; branded end products |
| Where technical barriers are highest | EUV lithography, leading-edge logic process, HBM/DRAM, advanced packaging, EDA, photoresists, process-control tools |
| Where capital is required | Fabs ($1 bn–$20 bn+), memory, advanced packaging, polysilicon and wafers, substrates |
| Where equipment is required | Every stage from crystal pulling to SMT — front-end tools dominate spend |
| Where materials are required | Wafers, resists, gases, wet chemicals, CMP, targets, precursors, substrates, EMC, wire, solder |
| Where India participates today | Chip design (large workforce), ATMP (three plants in production), electronics assembly (large and growing), R&D centres; first fab under construction |
| Where localization can occur next | OSAT scale-up and advanced packaging; mature/specialty and compound fabs; equipment sub-systems, back-end tools and laser processes; gases, chemicals, quartz/ceramic parts; services and spares |
| Where future technology develops | GAA → CFET, backside power, High-NA EUV, hybrid bonding, chiplets, HBM4+, silicon photonics and CPO, SiC/GaN, quantum and neuromorphic research |

The one-sentence version: semiconductors are a chain of specialist industries, each a chokepoint, in which value concentrates in design, leading-edge manufacturing, advanced packaging and the tools and materials that make them possible — and in which ATMP, mature/specialty fabs, equipment services and materials are the realistic on-ramps for new regions.
