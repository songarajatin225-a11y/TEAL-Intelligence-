---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 18
part_title: "Parts XXXVI–XXXVIII & XLI — Buyer’s guide, opportunities, localization and company landscape"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts XXXVI–XXXVIII & XLI — Buyer’s guide, opportunities, localization and company landscape

## Part XXXVI — Semiconductor equipment buyer’s guide

L1 summary. Buy on total cost of ownership (TCO) and cost per good unit, not purchase price. A cheaper tool with lower uptime, higher consumable cost or poorer yield usually costs more per good die. SEMI E10 (equipment reliability/availability metrics) and E35 (cost of ownership) provide the common vocabulary.

| Category | Parameter | What to ask / measure |
|---|---|---|
| Technical | Specifications | Guaranteed vs typical; test method; at what throughput |
|  | Accuracy / repeatability | Placement or measurement accuracy (3σ), gauge R&R, tool-to-tool matching |
|  | Process window | Recipe range; sensitivity to incoming variation |
| Productivity | Throughput (WPH / UPH) | At the customer’s recipe, including overheads (alignment, load/unload, calibration) |
|  | Availability / uptime | SEMI E10 states: productive, standby, engineering, scheduled/unscheduled down |
|  | MTBF / MTBA / MTTR | Mean time between failures (or assists) and to repair; data from installed base |
|  | OEE | Availability × performance × quality |
| Quality | Yield impact | Defect adders, process-induced damage, first-pass yield |
| Utilities | Power, CDA, N₂, vacuum, exhaust, PCW, UPW | Consumption per wafer/hour; peak vs idle; site infrastructure needs |
|  | Gas and chemical consumption | Specialty gas per wafer; abatement needs |
| Facility | Footprint | Tool + service area; cleanroom cost per m² |
|  | Vibration, EMI, floor loading | Site preparation requirements |
| Automation | Load ports, AMHS, SECS/GEM, GEM300, E84, E142 map handling | Full-auto readiness; MES integration effort |
|  | Recipe management | Version control, access control, offline editing, recipe transfer between tools |
|  | Data | FDC data export, sensor access, APC interfaces, cybersecurity (SEMI E187) |
| Safety | SEMI S2 / S8 | Third-party S2 report; interlocks; laser class (IEC 60825); chemical/gas safety |
| Service | Maintenance | PM frequency and duration; consumable and spare lifetime; parts kits |
|  | Serviceability | Local field engineers, response time, spare-parts depot, remote diagnostics |
|  | Training | Operator, maintenance, process training; documentation quality |
| Commercial | Warranty, SLAs | Uptime guarantees, penalties, acceptance criteria (SAT/FAT) |
|  | Lifecycle | Upgrade path, end-of-life policy, refurbishment market |

TCO / cost of ownership (simplified):

COO_(per good unit)=(C_(fixed)+C_(recurring)+C_(yield loss))/(Throughput×Utilisation×Yield)

Fixed = depreciation, installation, facility share; recurring = labour, consumables, spares, utilities, service; yield loss = scrapped units attributable to the tool.

## Part XXXVII — Business opportunity map

Factual characteristics and decision factors, not a ranking.

| Opportunity | Barrier | Capital | Model | Localization relevance | Export potential | Key decision factors |
|---|---|---|---|---|---|---|
| Leading-edge logic fab | High | Extreme ($20 bn+) | Capital-intensive | High strategic, low near-term feasibility | High | Technology partner, customers, subsidy durability |
| Mature/specialty fab (28–180 nm, BCD, SiC, GaN) | High | Very high ($1–10 bn) | Capital-intensive | High | Medium–high | Anchor customers, process licence, utilities |
| Compound-semi fab (GaAs/InP lasers, photodiodes, RF) | High | Medium–high | Capital-intensive | High (defence, telecom, sensing) | High | Epitaxy know-how, qualification |
| OSAT / ATMP — traditional | Medium | Medium ($0.1–1 bn) | Capital + labour | Very high | High | Customer contracts, automation, yield |
| Advanced packaging (flip-chip, fan-out, 2.5D) | High | High | Capital-intensive | High | High | Substrate access, technology partner |
| Test services / test houses | Medium | Medium | Service | High | Medium | ATE capex utilisation, test program skills |
| Chip design services | Medium | Low | Asset-light | High | High | Talent, EDA licences |
| Fabless product companies | High | Low–medium (design, masks) | Asset-light | High | High | Product-market fit, foundry access, time to revenue |
| EDA / IP (e.g., RISC-V cores, interface IP) | High | Low | Asset-light | Medium | High | Differentiation, silicon validation |
| Equipment sub-systems (gas panels, frames, chambers, vacuum, motion, RF) | Medium | Medium | Manufacturing | High | High | OEM qualification, precision machining, cleanliness |
| Back-end equipment (marking, dicing, inspection, handling, dispensing) | Medium | Medium | Manufacturing | High | Medium–high | Process capability, service network, OSAT references |
| Laser process equipment for back-end/PCB | Medium | Low–medium | Manufacturing | High | Medium | Laser source access, application know-how |
| Spare parts, refurbishment, parts cleaning | Low–medium | Low–medium | Service | High | Medium | OEM relationships, cleanliness certification |
| Materials — gases, wet chemicals | Medium | Medium–high | Manufacturing | High | Medium | Purity, logistics, safety |
| Materials — quartz, ceramics, Si/SiC parts | Medium | Medium | Manufacturing | High | High | Material science, precision |
| Materials — resists, precursors, CMP | High | Medium | Specialty chemistry | Medium | Medium | Formulation IP, qualification time |
| Cleanroom consumables | Low | Low | Manufacturing | High | Medium | Certification, scale |
| Fab construction and utilities (UPW, gas, HVAC, abatement) | Medium | Medium | EPC / service | Very high | Medium | Track record, specialist partners |
| Reclaim and test wafers | Medium | Medium | Manufacturing/service | High | Medium | Polishing know-how |
| Training and workforce | Low | Low | Service | Very high | Low | Industry alignment |
| EMS / PCBA | Medium | Medium | Manufacturing | Very high | High | Scale, component supply |

## Part XXXVIII — Semiconductor localization framework

How to use it. Score each segment (not a company or a policy) on measurable parameters. Replace the illustrative scores with data for your region. The weights are assumptions; state them explicitly in any decision paper.

| Parameter | Measurable proxy | Data source examples | Direction |
|---|---|---|---|
| Technology complexity | Process steps, tolerances, IP intensity | Industry technical literature | Higher = harder |
| CAPEX | $ per unit capacity | Company filings, SEMI data | Higher = harder |
| IP barrier | Patent concentration, licensing availability | Patent databases | Higher = harder |
| Talent availability | Relevant engineers in region | University output, industry surveys | Higher = easier |
| Supply-chain dependency | Number of imported critical inputs | BOM analysis | Higher = harder |
| Import dependence | Import value vs domestic demand | Customs/trade data | Higher = bigger prize |
| Qualification cycle | Months to qualify with customers | Customer interviews | Longer = harder |
| Customer concentration | Share of top-5 buyers | Market data | Higher = riskier |
| Gross-margin potential | Segment gross margins | Public company filings | Higher = better |
| Volume | Domestic demand units/$ | Market data | Higher = better |
| Export potential | Global demand + competitiveness | Trade data | Higher = better |
| Localization feasibility | Composite of the above | Derived | — |

Illustrative scoring (1 = low, 5 = high). These are qualitative assumptions for demonstration, not measured data.

| Segment | Tech complexity | CAPEX | IP barrier | Talent availability (India, qualitative) | Qualification cycle | Import dependence (prize) | Illustrative feasibility |
|---|---|---|---|---|---|---|---|
| Leading-edge logic fab | 5 | 5 | 5 | 2 | 5 | 5 | Low |
| Mature-node fab | 4 | 4 | 4 | 2 | 4 | 4 | Medium–low |
| Traditional OSAT | 3 | 3 | 2 | 3 | 3 | 4 | Medium–high |
| Advanced packaging | 4 | 4 | 4 | 2 | 4 | 4 | Medium–low |
| Chip design services | 3 | 1 | 2 | 5 | 2 | 3 | High |
| Back-end equipment | 3 | 2 | 3 | 3 | 3 | 4 | Medium–high |
| Front-end equipment sub-systems | 3 | 2 | 3 | 3 | 4 | 4 | Medium |
| Specialty gases & chemicals | 3 | 3 | 3 | 3 | 4 | 4 | Medium |
| Cleanroom consumables | 1 | 1 | 1 | 4 | 2 | 3 | High |

## Part XLI — Company landscape

Headquarters and roles as of the handbook date; verify corporate changes before external use.

| Category | Company | HQ | Primary role / focus |
|---|---|---|---|
| EDA | Synopsys | USA | EDA, IP, simulation (incl. Ansys since 2025) |
|  | Cadence Design Systems | USA | EDA, IP, system analysis |
|  | Siemens EDA | USA (part of Siemens, Germany) | Calibre verification, PCB, analog |
|  | Keysight (EDA) | USA | RF/high-speed design |
| IP | Arm | UK | CPU/GPU IP, compute subsystems |
|  | SiFive, Andes | USA, Taiwan | RISC-V cores |
|  | Imagination Technologies | UK | GPU IP |
|  | Alphawave Semi | UK/Canada | SerDes/connectivity IP (acquisition by Qualcomm announced 2025) |
|  | Rambus | USA | Memory interface IP and chips |
| Foundry | TSMC | Taiwan | Leading-edge and specialty foundry, advanced packaging |
|  | Samsung Foundry | Korea | Leading-edge foundry |
|  | Intel Foundry | USA | Foundry and advanced packaging |
|  | GlobalFoundries | USA | Specialty/mature foundry, FD-SOI, RF, SiPh |
|  | UMC | Taiwan | Mature foundry |
|  | SMIC, Hua Hong | China | Foundry |
|  | Tower Semiconductor | Israel | Specialty analog, RF, SiPh, CIS |
|  | Vanguard (VIS), PSMC | Taiwan | Mature foundry (PSMC is Tata’s Dholera partner) |
|  | Rapidus | Japan | 2 nm-class foundry project |
| IDM | Intel | USA | CPUs, foundry |
|  | Texas Instruments | USA | Analog, embedded |
|  | Infineon | Germany | Power, auto MCUs, security |
|  | STMicroelectronics | Switzerland (NL-registered; FR/IT ops) | Power, SiC, MCU, sensors |
|  | NXP | Netherlands | Auto MCU, RF, secure |
|  | Renesas | Japan | MCU, analog, power |
|  | onsemi | USA | Power (SiC), image sensors |
|  | Analog Devices | USA | High-performance analog |
|  | Microchip | USA | MCU, FPGA, analog |
|  | Bosch | Germany | MEMS, SiC |
|  | Sony Semiconductor Solutions | Japan | Image sensors |
| Memory | Samsung, SK hynix | Korea | DRAM, HBM, NAND |
|  | Micron | USA | DRAM, HBM, NAND |
|  | Kioxia, SanDisk | Japan, USA | NAND (JV fabs) |
|  | YMTC, CXMT | China | NAND, DRAM |
| Fabless | NVIDIA, AMD, Qualcomm, Broadcom, Marvell | USA | GPUs, CPUs, SoCs, networking, custom ASICs |
|  | MediaTek, Realtek, Novatek | Taiwan | SoCs, connectivity, display drivers |
| Equipment | ASML | Netherlands | Lithography |
|  | Applied Materials | USA | Deposition, etch, CMP, implant, inspection |
|  | Lam Research | USA | Etch, deposition, clean |
|  | Tokyo Electron | Japan | Coat/develop, etch, deposition, thermal, probers |
|  | KLA | USA | Inspection, metrology, SPTS etch |
|  | ASM International | Netherlands | ALD, epitaxy |
|  | SCREEN | Japan | Cleaning, coat/develop, anneal |
|  | Kokusai Electric | Japan | Batch furnaces, ALD |
|  | Hitachi High-Tech | Japan | CD-SEM, etch, inspection |
|  | Lasertec | Japan | EUV mask inspection |
|  | DISCO | Japan | Dicing, grinding, polishing |
|  | Advantest, Teradyne | Japan, USA | ATE |
|  | BESI | Netherlands | Die attach, hybrid bonding |
|  | ASMPT | Singapore/Hong Kong | Back-end assembly, SMT |
|  | Kulicke & Soffa | USA/Singapore | Wire, advanced bonding |
|  | Onto Innovation, Nova, Camtek | USA, Israel, Israel | Metrology, inspection |
|  | Nikon, Canon | Japan | Lithography |
|  | NAURA, AMEC | China | Deposition, etch |
| Materials | Shin-Etsu, SUMCO | Japan | Wafers, materials |
|  | GlobalWafers, Siltronic, SK siltron | Taiwan, Germany, Korea | Wafers |
|  | JSR, TOK, Fujifilm | Japan | Resists, chemicals |
|  | Entegris | USA | Filters, CMP, specialty chemicals |
|  | Linde, Air Liquide, Air Products | UK/US, France, USA | Gases |
|  | Merck KGaA (EMD Electronics) | Germany | Specialty chemicals, gases |
|  | Resonac, Sumitomo Bakelite | Japan | Packaging materials |
|  | Ajinomoto | Japan | ABF build-up film |
| OSAT | ASE Technology (incl. SPIL) | Taiwan | Largest OSAT, advanced packaging |
|  | Amkor | USA | OSAT, advanced packaging |
|  | JCET, Tongfu Microelectronics, Huatian | China | OSAT |
|  | Powertech Technology (PTI) | Taiwan | Memory packaging/test |
|  | Kaynes Semicon, CG Semi, TSAT | India | Indian OSATs |
| Substrates | Ibiden, Shinko, Unimicron, AT&S, SEMCO, Kinsus | Japan, Taiwan, Austria, Korea | IC substrates |
| EMS | Foxconn (Hon Hai), Pegatron, Wistron, Quanta | Taiwan | EMS/ODM |
|  | Jabil, Flex, Celestica, Sanmina | USA/Singapore/Canada | EMS |
|  | Luxshare, BYD Electronics | China | EMS |
|  | Dixon, Tata Electronics, Kaynes, Syrma SGS | India | EMS |
| OEM | Apple, Samsung, Dell, HP, Lenovo, Xiaomi, Tesla, Bosch, Siemens | Various | Systems |

Key takeaways

Evaluate equipment on cost per good unit and installed-base service data.

Opportunities differ by barrier, capital and qualification cycle — asset-light design and back-end equipment/services sit at a very different point from fabs.

Score segments on measurable parameters; label assumptions.
