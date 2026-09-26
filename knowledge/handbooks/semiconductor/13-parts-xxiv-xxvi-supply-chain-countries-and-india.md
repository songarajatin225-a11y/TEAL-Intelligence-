---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 13
part_title: "Parts XXIV–XXVI — Supply chain, countries and India"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts XXIV–XXVI — Supply chain, countries and India

## Part XXIV — The global semiconductor supply chain

L1 summary. No country is self-sufficient. A typical chip crosses borders many times: US EDA and IP, a design team in the US or India, Japanese wafers and chemicals, Dutch and US tools, a Taiwanese or Korean fab, packaging in Taiwan, Malaysia or China, and board assembly in China, Vietnam or India. Each stage has different barriers, capital needs and chokepoints.

| Stage | Leading countries/regions | Example companies | Dependencies / bottlenecks | Technology barrier | Capital intensity | Localization opportunity |
|---|---|---|---|---|---|---|
| Raw materials | China (silicon metal, gallium, germanium, rare earths refining), USA (HPQ quartz), Ukraine/Russia historically (neon), Qatar/USA (helium) | Various miners and refiners | Gallium/germanium export controls (China, from 2023); HPQ concentration | Low–medium | Medium | Critical-minerals processing |
| Materials | Japan, USA, Europe, Korea, Taiwan, China | Shin-Etsu, SUMCO, JSR, TOK, Entegris, Linde, Air Liquide, Merck | Resists, wafers, specialty gases concentrated | High (purity) | Medium–high | Gases, chemicals, parts first |
| Equipment | USA, Netherlands, Japan; growing China, Korea | ASML, Applied, Lam, TEL, KLA | EUV single source; sub-tier optics (Zeiss) | Very high | High R&D | Sub-assemblies, service, back-end tools |
| EDA / IP | USA, UK (Arm), Europe | Synopsys, Cadence, Siemens EDA, Arm | Near-oligopoly; export-controlled | Very high | Low capex, high R&D | Tool plug-ins, verification services, RISC-V IP |
| Design | USA, Taiwan, China, Israel, India (engineering centres), Korea, Europe | NVIDIA, Qualcomm, MediaTek, HiSilicon | Talent, EDA access, foundry access | High | Asset-light | Fabless start-ups, design services |
| Foundry / front-end | Taiwan, Korea, China, USA, Japan, Europe, Singapore | TSMC, Samsung, Intel, SMIC, GlobalFoundries, UMC | Leading edge concentrated in Taiwan | Very high | Extreme | Mature-node and specialty fabs |
| Memory | Korea, USA/Japan (via Micron fabs), China, Japan (Kioxia) | Samsung, SK hynix, Micron, Kioxia, YMTC, CXMT | Few producers; cyclical | Very high | Extreme | Back-end first (as Micron in India) |
| Packaging & test | Taiwan, China, Malaysia, Korea, Singapore, Philippines, Vietnam, USA (advanced), Japan | ASE, Amkor, JCET, Tongfu, PTI, Intel, TSMC | Advanced packaging (CoWoS-class), substrates | Medium (traditional) → very high (advanced) | Medium–high | Most accessible manufacturing entry |
| Electronics manufacturing | China, Vietnam, India, Mexico, Taiwan, Malaysia, Thailand | Foxconn, Pegatron, Luxshare, Jabil, Flex, Dixon, Tata Electronics | Component imports | Medium | Medium | Scale + component localization |
| OEM / end market | USA, China, Korea, Japan, Europe, Taiwan | Apple, Samsung, Dell, Huawei, Tesla, Bosch | Demand concentration | — | — | Domestic demand anchor |

Structural chokepoints (no share figures implied): EUV lithography; leading-edge logic foundry capacity in Taiwan; HBM and CoWoS-class packaging; ABF substrates; EDA; photoresists; specialty gases (neon, helium); gallium/germanium; high-purity quartz.

Export controls. Since October 2022, the US (with allied measures in the Netherlands and Japan) has restricted exports of advanced computing chips and chipmaking equipment to China; China has responded with controls on gallium, germanium, graphite and some rare-earth-related items. These controls now shape capacity decisions globally. Rules change frequently; check current regulations before relying on specifics.

## Part XXV — Country roles across the value chain

Ratings are qualitative (● strong global position, ◐ meaningful presence, ○ limited) and reflect the handbook’s reading of the industry structure, not measured shares.

| Country / region | Design | EDA / IP | Equipment | Materials | Foundry / logic | Memory | Packaging / test | Electronics mfg | Signature strengths |
|---|---|---|---|---|---|---|---|---|---|
| Taiwan | ● | ○ | ○ | ◐ | ● | ◐ | ● | ◐ | TSMC leading-edge and CoWoS; ASE; MediaTek; substrate makers |
| South Korea | ◐ | ○ | ◐ | ◐ | ◐ | ● | ◐ | ● | Samsung, SK hynix (DRAM, HBM, NAND); SEMES, Wonik |
| United States | ● | ● | ● | ◐ | ◐ | ◐ | ◐ | ○ | NVIDIA, Qualcomm, AMD, Intel; Applied, Lam, KLA; Synopsys, Cadence; Micron |
| Japan | ◐ | ○ | ● | ● | ◐ | ◐ | ◐ | ◐ | TEL, SCREEN, Lasertec, Advantest, DISCO; Shin-Etsu, SUMCO, JSR, TOK; Kioxia; Sony CIS; Rapidus (2 nm project) |
| China | ◐ | ○ | ◐ | ◐ | ◐ | ◐ | ● | ● | SMIC, Hua Hong; YMTC, CXMT; JCET, Tongfu; NAURA, AMEC; the largest electronics manufacturing base |
| Netherlands | ○ | ○ | ● | ○ | ○ | ○ | ◐ | ○ | ASML, ASM International, BESI; NXP |
| Germany | ◐ | ○ | ◐ | ● | ◐ | ○ | ◐ | ◐ | Infineon, Bosch; Zeiss (EUV optics), Trumpf (EUV laser drive); Siltronic, Merck, Wacker |
| Europe (other) | ◐ | ◐ | ◐ | ◐ | ◐ | ○ | ◐ | ◐ | STMicro (FR/IT), Arm (UK), imec (BE, R&D), Soitec (FR), Aixtron |
| Singapore | ◐ | ○ | ◐ | ◐ | ◐ | ◐ | ● | ◐ | Mature foundry (GF, UMC, VIS-NXP), Micron NAND, ASMPT, packaging hub |
| Malaysia | ◐ | ○ | ◐ | ○ | ○ | ○ | ● | ◐ | Long-established OSAT and test hub (Penang): Intel, Infineon, ASE, Inari, Unisem |
| Israel | ● | ◐ | ◐ | ○ | ◐ | ○ | ○ | ○ | Design centres (Intel, NVIDIA/Mellanox, Apple), Tower, Intel Kiryat Gat fab, metrology (Nova, Camtek) |
| India | ● (engineering talent) | ○ | ○ | ○ | ○ (first fab under construction) | ○ | ◐ (emerging) | ◐ | Large chip-design workforce; ATMP buildout; electronics assembly scale; ISM incentives |

## Part XXVI — India semiconductor ecosystem

L1 summary. India’s strength has long been chip design — global semiconductor companies run some of their largest engineering centres in Bengaluru, Hyderabad and Noida. Manufacturing started in earnest with the India Semiconductor Mission (ISM, launched December 2021). As of September 2026, 12 manufacturing projects are approved under ISM and three ATMP/OSAT plants in Sanand, Gujarat — Micron, Kaynes Semicon and CG Semi — are in commercial production. India’s first commercial silicon fab (Tata Electronics–PSMC, Dholera) is under construction. Semicon 2.0 was approved in July 2026 with an outlay of ₹1,27,500 crore. Upstream equipment and materials remain overwhelmingly imported.

Status checked 21 Sep 2026 against news and government-cited reports; statuses change quickly — verify at ism.gov.in / PIB before external use.

### 26.1 History (condensed)

| Year | Event |
|---|---|
| 1984 | Semiconductor Complex Ltd (SCL), Mohali, founded — a government fab; now ISRO’s Semi-Conductor Laboratory, operating a mature-node (180 nm-class) CMOS line |
| 1989 | Fire at SCL sets back India’s fab ambitions for decades |
| 1980s–2000s | Texas Instruments opens its Bengaluru design centre (1985); global firms follow, building India’s design base |
| 2007, 2014 | Earlier fab incentive attempts (SIPS; two consortia approved in 2014 — HSMC/STMicro and Jaiprakash/IBM/Tower) — neither materialised |
| Dec 2021 | Semicon India Programme / ISM launched: ₹76,000 crore outlay; up to 50 % fiscal support for fabs and ATMP, plus Design-Linked Incentive (DLI) |
| Jun 2023 | Micron ATMP (Sanand) approved — first project |
| Feb 2024 | Tata–PSMC fab (Dholera), Tata TSAT OSAT (Assam), CG Power–Renesas–Stars OSAT (Sanand) approved |
| Sep 2024 | Kaynes Semicon OSAT (Sanand) approved |
| 2025 | HCL–Foxconn OSAT (Uttar Pradesh) approved (May); four further projects approved (Aug) incl. SiCSem SiC fab and 3D Glass Solutions packaging (Odisha), CDIL (Punjab), ASIP (Andhra Pradesh) |
| Feb–Jul 2026 | Micron Sanand inaugurated (28 Feb); Kaynes commercial (31 Mar); CG Semi commercial (Jul) |
| May 2026 | Crystal Matrix (GaN/micro-LED compound fab + ATMP, Dholera) and Suchi Semicon (OSAT, Surat) approved — total reaches 12 |
| Jul 2026 | Semicon 2.0 approved: ₹1,27,500 crore across six pillars — design, equipment & materials, fabs, packaging, R&D, talent |

### 26.2 Approved manufacturing projects — status-graded

| Project | Type | Location | Announced investment | Status (Sep 2026) |
|---|---|---|---|---|
| Micron Technology | ATMP (DRAM, NAND) | Sanand, Gujarat | ₹22,516 crore | Operational — inaugurated 28 Feb 2026 |
| Kaynes Semicon | OSAT | Sanand, Gujarat | ₹3,307 crore | Operational — commercial 31 Mar 2026 |
| CG Semi (CG Power + Renesas + Stars Microelectronics) | OSAT (~15 M units/day design capacity) | Sanand, Gujarat | ₹7,584 crore | Operational — commercial Jul 2026 |
| Tata Electronics + PSMC | 300 mm fab, 28 nm and mature nodes, 50 k WSPM planned | Dholera, Gujarat | ₹91,000 crore | Under construction — reported ~50 % built (Apr 2026); SEZ notified Apr 2026 |
| Tata Semiconductor Assembly & Test (TSAT) | OSAT incl. advanced packaging (~48 M units/day planned) | Jagiroad, Morigaon, Assam | ₹27,000 crore | Under construction |
| HCL–Foxconn JV | OSAT (display driver ICs) | Jewar, Uttar Pradesh | ~₹3,700 crore | Approved / under construction |
| SiCSem | Compound (SiC) fab + packaging | Odisha | Per 2025 approval | Approved / under construction |
| 3D Glass Solutions | Glass-substrate advanced packaging | Odisha | Per 2025 approval | Approved / under construction |
| Continental Device India (CDIL) | Discrete power devices expansion (Si, SiC) | Mohali, Punjab | Per 2025 approval | Approved / under construction |
| ASIP Technologies (with APACT, Korea) | OSAT | Andhra Pradesh | Per 2025 approval | Approved / under construction |
| Crystal Matrix Ltd | GaN compound fab + ATMP (micro-LED displays, GaN foundry, 6” epi) | Dholera, Gujarat | Per May 2026 approval | Approved |
| Suchi Semicon | OSAT | Surat, Gujarat | Per May 2026 approval | Approved |

Separately, reports cite an ATMP/OSAT facility in Bhiwadi, Rajasthan inaugurated in May 2026 under the SPECS component scheme (outside ISM’s 12). Proposed / not approved: Tower–Adani fab (Maharashtra, announced 2024) and other state-level MoUs; treat as proposals.

### 26.3 Ecosystem layer by layer

| Layer | India today | Key players / institutions |
|---|---|---|
| Design | Large engineering base at multinational R&D centres; growing fabless start-ups under DLI | Intel, Qualcomm, TI, NVIDIA, AMD, NXP, Micron, Analog Devices, MediaTek, Renesas, Infineon centres; start-ups e.g. Mindgrove, InCore (RISC-V), Netrasemi, Saankhya (Tejas), Morphing Machines |
| EDA | Users, not producers; large EDA vendor R&D centres (Synopsys, Cadence, Siemens) | ChipIN centre / C-DAC provides shared EDA access to academia and start-ups |
| Fabs | SCL Mohali (180 nm-class, government); GAETEC (GaAs, DRDO, Hyderabad); SITAR (Bengaluru); first commercial fab under construction | ISRO SCL, DRDO, Tata Electronics |
| ATMP / OSAT | Three commercial plants operating; several under construction | Micron, Kaynes, CG Semi, TSAT, HCL–Foxconn, others |
| Equipment | Largely imported; services and sub-assemblies emerging; Semicon 2.0 targets this pillar | Equipment OEM service centres (Applied Materials engineering centre in Bengaluru, Lam Research India operations), domestic automation and laser integrators |
| Materials | Largely imported; gases and chemicals localisation starting | Industrial gas majors’ Indian operations; specialty chemical firms |
| Electronics manufacturing | Large and growing — India is the world’s second-largest mobile-phone producer by volume | Foxconn, Tata Electronics, Pegatron, Dixon, Kaynes, Syrma SGS, VVDN |
| R&D / universities | Nanofabrication centres; growing semiconductor curricula | IIT Bombay (CEN), IISc (CeNSE), IIT Madras (Shakti RISC-V), IIT Delhi, IIT Kharagpur, IIT Hyderabad; C-DAC; SCL |
| Talent | Strong in design/verification; limited in fab process, equipment and yield engineering | ISM training programmes; industry-academia partnerships |

Structural gaps (fact-based): process and equipment engineering experience; materials and equipment supply base; utilities (UPW, power quality, specialty gases) at fab grade; advanced packaging (flip-chip, 2.5D) still ahead of the legacy wire-bond processes in initial ATMP operations; domestic demand anchoring for mature-node wafers.

Key takeaways — Parts XXIV–XXVI

The supply chain is multi-country by construction; chokepoints sit in equipment, materials, EDA and advanced packaging as much as in fabs.

India’s manufacturing entry sequence is ATMP first, mature/specialty fab second, upstream equipment and materials third — Semicon 2.0 explicitly targets the third.

Treat Indian project announcements by status: 3 operational, the rest under construction or approved.

Sources for Part XXVI: Business Today, SEMICON India 2026 · Tech Observer on Semicon 2.0 · Tech Times on operational plants · IndexBox on packaging and import gaps · IMARC on May 2026 approvals · India Briefing · Wikipedia: Electronics and semiconductor manufacturing in India
