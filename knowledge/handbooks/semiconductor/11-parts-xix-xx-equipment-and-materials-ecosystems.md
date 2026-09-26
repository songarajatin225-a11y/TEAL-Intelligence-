---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 11
part_title: "Parts XIX–XX — Equipment and materials ecosystems"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts XIX–XX — Equipment and materials ecosystems

L1 summary. Semiconductor manufacturing rests on two supplier industries that are as concentrated as the chipmakers themselves. Front-end equipment is led by a handful of US, Dutch and Japanese firms; back-end equipment by Japanese, Dutch, Singaporean/HK and US firms; materials by Japanese, US, European, Korean and Taiwanese chemical companies. Supplier lists below indicate active players, not rankings or shares.

## Part XIX — Equipment map

| Process | Equipment | Function | Key parameters | Major suppliers (examples) | Consumables | Localization opportunity |
|---|---|---|---|---|---|---|
| Crystal growth | CZ/MCZ pullers, FZ machines | Grow single-crystal ingots | Diameter, pull rate, O₂, defect control | In-house at wafer makers; PVA TePla; Jingsheng | Quartz crucibles, graphite hot zone, Ar | Graphite/quartz parts, hot-zone refurbishment |
| Wafering | Multi-wire saws, grinders, lappers, DSP/CMP polishers | Slice, thin, flatten, polish | TTV, flatness, roughness | Takatori, Komatsu NTC, Meyer Burger (historic), Peter Wolters (Lapmaster Wolters), Okamoto, Fujikoshi | Diamond wire, slurries, pads | Solar-derived wafering, reclaim |
| Cleaning | Wet benches, single-wafer spin cleaners, scrubbers | Remove particles, metals, organics | Particle adders, metal levels, chemical use | SCREEN, Tokyo Electron, Lam Research, SEMES, ACM Research | Acids, bases, UPW, filters | Wet benches for mature/ATMP, chemical delivery |
| Lithography — exposure | EUV, ArFi, ArF, KrF, i-line scanners/steppers | Pattern resist | Resolution, overlay, throughput (WPH) | ASML, Nikon, Canon | Light-source parts, reticles, pellicles | Very high barrier; packaging steppers/LDI more accessible |
| Lithography — track | Coater/developer | Coat, bake, develop | CD uniformity, defects | Tokyo Electron, SCREEN, SEMES | Resist, developer | Moderate |
| Mask making | E-beam and multi-beam mask writers, mask inspection/repair | Make reticles | Placement accuracy | NuFlare, IMS Nanofabrication, JEOL, KLA, Lasertec, Zeiss | Mask blanks (HOYA, AGC, S&S Tech) | High barrier |
| Deposition | PVD, CVD, PECVD, ALD, epi, ECD | Add films | Uniformity, conformality, stress | Applied Materials, Lam Research, Tokyo Electron, ASM International, Kokusai Electric, Eugene, Wonik IPS, NAURA, Piotech | Targets, precursors, gases | Chamber parts, gas panels, refurbishment |
| Etch | Conductor/dielectric RIE, DRIE, ALE, strip | Remove patterned material | Profile, selectivity, uniformity | Lam Research, Tokyo Electron, Applied Materials, Hitachi High-Tech, SPTS (KLA), Oxford Instruments, AMEC, NAURA | Edge rings, electrodes (Si, SiC, quartz), gases | Ring/electrode manufacturing, parts cleaning |
| Ion implant | Medium/high-current, high-energy implanters | Dope | Dose accuracy, energy purity | Applied Materials, Axcelis, SMIT (Sumitomo), Nissin Ion | Source parts, dopant gases | High barrier |
| Thermal / anneal | Furnaces, RTP, flash/laser anneal | Oxidise, diffuse, activate | Temperature uniformity, ramp rate | Tokyo Electron, Kokusai Electric, Applied Materials, Mattson, SCREEN, ASM; laser anneal: Applied, Veeco, SCREEN | Quartz tubes/boats, SiC parts | Quartzware, heaters |
| CMP | Polishers + post-CMP clean | Planarise | Removal uniformity, defects | Applied Materials, EBARA | Slurries, pads, conditioners, brushes | Slurries and pads (chemistry-driven) |
| Metrology | CD-SEM, OCD, overlay, film, X-ray | Measure | Precision, matching | KLA, Hitachi High-Tech, Applied, Nova, Onto Innovation, ASML, Bruker, Rigaku, Thermo Fisher | Standards, reference wafers | Software/AI analytics, service |
| Inspection | Brightfield, darkfield, e-beam, review, mask | Find defects | Sensitivity, throughput | KLA, Applied, Hitachi High-Tech, ASML (HMI), Lasertec, Camtek, Onto | — | Back-end AOI, software |
| Wafer test | Probers, ATE, probe cards | Test die | Parallelism, accuracy, temperature | Tokyo Electron, Tokyo Seimitsu, Advantest, Teradyne, FormFactor, Technoprobe, MJC | Probe cards, load boards | Probe-card repair, load boards, test services |
| Backgrinding | Grinders/polishers | Thin wafers | Thickness, TTV | DISCO, Tokyo Seimitsu, Okamoto | Wheels, tapes | Wheels/tapes |
| Dicing | Blade, laser, stealth, plasma dicers | Separate dies | Kerf, chipping, UPH | DISCO, Tokyo Seimitsu, ASMPT, EO Technics, Han’s Laser, SPTS, Plasma-Therm | Blades, tapes | Laser dicing/grooving systems, integration |
| Die bonding | Die bonders, TCB, hybrid bonders | Place and bond dies | Accuracy (µm → sub-µm), UPH | BESI, ASMPT, K&S, Fasford (Fuji), Shinkawa, Hanmi, Toray Engineering, EV Group, SUSS | Epoxy, DAF, flux | Standard die bonders, automation |
| Wire bonding | Ball/wedge bonders | Interconnect | UPH, bond quality | K&S, ASMPT, Shinkawa, Hesse (wedge) | Wire, capillaries | Capillaries, service |
| Flip chip | FC bonders, reflow, underfill dispense | Bumped die attach | Alignment, void rate | ASMPT, BESI, K&S, Nordson (dispense), Heller/BTU (reflow) | Solder, underfill | Reflow, dispensing |
| Moulding | Transfer/compression presses | Encapsulate | Void, wire sweep, warp | Towa, ASMPT, BESI (Fico), Yamada | EMC, release film | Mould tooling |
| Marking | Laser markers | Identify and trace | Contrast, depth, speed | EO Technics, Han’s Laser, Keyence, Trumpf, domestic integrators | — | High — laser marking and vision integration |
| Final test & handling | Handlers, burn-in systems, ATE | Test packaged parts | Parallelism, temperature, jam rate | Advantest, Teradyne, Cohu, Chroma, Aehr (wafer-level burn-in), Hon Precision | Sockets, contactors | Sockets, handlers, burn-in boards |
| Packaging inspection | 2D/3D AOI, X-ray, SAM | Detect package defects | Sensitivity, speed | KLA, Camtek, Koh Young, Nordson (Dage, SONOSCAN), Nikon Metrology | — | AOI and automation software |
| Advanced packaging litho/RDL | Steppers, laser direct imaging, laser debonding | Pattern RDL, debond carriers | Overlay, L/S | Canon, Onto (JetStep), SCREEN, Orbotech (KLA), EV Group, SUSS | Resist, carriers | Laser debond, LDI integration |
| Fab infrastructure | Gas cabinets, abatement, UPW, chillers, AMHS | Support | Uptime, purity | Edwards (Atlas Copco), Ebara, Kurita, Organo, Daifuku, Murata Machinery, CSK | Filters, resins | High — construction, utilities, gas/chemical systems |

Structural observations

Front-end process tools (litho, deposition, etch, implant, process control) are concentrated in the US (Applied, Lam, KLA), Netherlands (ASML, ASM) and Japan (TEL, SCREEN, Kokusai, Hitachi High-Tech, Lasertec). China’s domestic suppliers (NAURA, AMEC, Piotech, SMEE, Hwatsing) are growing under export controls.

Each process tool depends on a deep sub-tier: RF generators (MKS, Advanced Energy), vacuum pumps (Edwards, Ebara, Pfeiffer), valves and MFCs (Horiba, Fujikin, Swagelok, Brooks/Hitachi Metals), robots (Brooks/Azenta, Rorze, Kawasaki), ceramic and quartz parts (Kyocera, CoorsTek, Ferrotec), precision optics (Zeiss). Sub-tier components are a realistic localization path.

Back-end equipment is more fragmented and more accessible, with Asian (Japan, Korea, China, Singapore) mid-size firms active.

## Part XX — Materials and consumables map

| Category | Examples | Where used | Supplier ecosystem (examples) | Barrier notes |
|---|---|---|---|---|
| Wafers | Prime Si, epi, SOI, SiC, GaN-on-Si, GaAs, InP | Starting material | Shin-Etsu, SUMCO, GlobalWafers, Siltronic, SK siltron, Soitec (SOI); Wolfspeed, Coherent, SiCrystal (ROHM), SK siltron CSS, SICC, TankeBlue (SiC); Sumitomo Electric, Freiberger, AXT (GaAs/InP) | Qualification, crystal know-how |
| Photoresists | g/i-line, KrF, ArF, ArFi, EUV (CAR, metal-oxide) | Lithography | JSR, Tokyo Ohka (TOK), Shin-Etsu, Sumitomo Chemical, Fujifilm, DuPont, Merck, Dongjin; Inpria (JSR) metal-oxide EUV | Very high — Japan-concentrated |
| Litho ancillaries | BARC/top coats, developers, rinses, pellicles, mask blanks | Litho | Nissan Chemical, Brewer Science, Merck; Mitsui Chemicals (pellicles); HOYA, AGC (EUV blanks) | High |
| Wet chemicals | H₂SO₄, H₂O₂, HF, HCl, NH₄OH, HNO₃, H₃PO₄, IPA, TMAH | Clean, etch, develop | Stella Chemifa, Morita, Kanto Chemical, BASF, Honeywell, Avantor, Solvay, Dongwoo Fine-Chem | Purity (ppt metals), logistics |
| Bulk gases | N₂, O₂, Ar, H₂, He, CO₂ | Everywhere | Linde, Air Liquide, Air Products, Taiyo Nippon Sanso | On-site plants; He is geopolitically sensitive |
| Specialty/electronic gases | NF₃, WF₆, SiH₄, NH₃, N₂O, CF₄, C₄F₈, CHF₃, SF₆, HBr, Cl₂, BCl₃, PH₃, AsH₃, B₂H₆, GeH₄, rare gases (Ne, Kr, Xe for excimer lasers) | Deposition, etch, clean, implant, litho | SK specialty, Hyosung, Kanto Denka, Resonac, Merck (Versum), Linde, Air Liquide, Entegris; neon historically sourced heavily from Ukraine/Russia | Toxicity, purity, safety |
| CMP materials | Slurries (silica, ceria, alumina), pads, conditioners, post-CMP cleans | Planarization | Entegris (CMC), Fujifilm, Resonac, DuPont, Merck, Fujimi; pads DuPont | Chemistry know-how |
| Sputter targets | Cu, Ta, Ti, Co, W, Al alloys, Ru, Mo | PVD | JX Advanced Metals, Honeywell, Materion, Tosoh, Ulvac, Konfoong (China) | Purity (5N–6N+), metallurgy |
| Precursors | TEOS, TMA, TDMAT, HfCl₄, TiCl₄, metal-organics, silicon precursors for ALD/CVD | CVD/ALD | Merck (EMD), Air Liquide, Entegris, DNF, Soulbrain, Adeka, Hansol | High — molecule-specific |
| Quartz, ceramics, Si/SiC parts | Quartzware, susceptors, electrodes, edge rings | Furnaces, etch, CVD | Heraeus, Tosoh Quartz, Ferrotec, Shin-Etsu Quartz, CoorsTek, Kyocera, Hana Materials | Medium; strong localization candidate |
| Filters, purifiers, containers | Liquid/gas filters, FOUPs, FOSBs | Contamination control | Entegris, Pall, Shin-Etsu Polymer, Miraial | Medium |
| Lead frames | Stamped/etched Cu alloy | Packaging | Mitsui High-tec, Shinko, SDI, Haesung DS, Chang Wah | Medium |
| Mould compounds (EMC) | Epoxy + silica filler | Packaging | Sumitomo Bakelite, Resonac, KCC, Chang Chun, Panasonic | Medium–high (formulation) |
| Bonding wire | Au, Cu, PdCu, Ag, Al | Wire bond | Heraeus, Tanaka, Nippon Micrometal, MK Electron | Medium |
| Solder balls, pastes, fluxes | SAC alloys | Flip chip, BGA, SMT | Senju, Indium Corp., Accurus, MacDermid Alpha, Duksan | Medium |
| Substrates | ABF FCBGA, BT-core, coreless | Package substrate | Ibiden, Shinko, Unimicron, AT&S, SEMCO, Kinsus, Nan Ya PCB, LG Innotek; ABF film Ajinomoto | High, capex-heavy |
| Interposers | Si, glass, organic RDL | 2.5D | Foundries/OSATs (TSMC, UMC), glass emerging (Corning, AGC, Schott for glass) | High |
| Underfill, adhesives, DAF, tapes | Capillary/moulded underfill, die-attach film, BG/dicing tapes | Assembly | Namics, Henkel, Resonac, Lintec, Nitto Denko, Furukawa, Mitsui Chemicals Tohcello | Medium |
| Thermal interface & sinter | TIMs, Ag sinter pastes | Power and HPC packages | Henkel, Heraeus, Indium, MacDermid Alpha, Kyocera | Medium |
| Cleanroom consumables | Gloves, garments, wipes, swabs, masks | Cleanroom operations | Kimberly-Clark, Ansell, Contec, DuPont (Tyvek), Berkshire | Low — first localization step |

Structural observations

Japan holds exceptional depth in materials (resists, wafers, high-purity chemicals, substrates, EMC, bonding films).

Many materials are formulation and purity businesses: the chemistry is known, the qualified purity and consistency are the barrier.

Localization typically progresses: cleanroom consumables → bulk gases and commodity chemicals → high-purity chemicals → specialty gases/parts → CMP and precursors → resists and wafers.

Key takeaways — Parts XIX–XX

Equipment and materials are chokepoints as strategic as fabs.

Sub-tier components, spare parts, refurbishment and consumables are the realistic entry points for new regions.

Back-end equipment (marking, dicing, inspection, handling) is where laser and automation companies can enter the semiconductor supply chain.

Glossary terms introduced: WPH, sub-tier, MFC, edge ring, quartzware, susceptor, target, precursor, BARC, EMC, ABF, BT, SAC solder, DAF, TIM, sinter paste, FOSB.
