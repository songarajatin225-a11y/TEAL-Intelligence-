---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 78
part_title: "Part 56 — Industrial standards and compliance map"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 56 — Industrial standards and compliance map

A standard creates obligations only through law, contract or a customer specification, and compliance is shown only by records — never by naming the standard. Use the map below to identify which documents apply to a machine and market, then build the chain standard → requirement → design implication → verification for each clause you rely on. Editions marked ✓ were checked against publisher or authoritative pages on 26 September 2026; confirm the others, and the edition in force in the destination market, at Gate 0.

### 56.1 Regulatory layer by market

| Market | Instrument | Status as checked | What the builder must produce |
|---|---|---|---|
| India | Machinery and Electrical Equipment Safety (Omnibus Technical Regulation) Order, 2024, as amended in 2025 | Applies from 1 September 2026 to machines and electrical equipment listed in its First Schedule; assemblies and components from dates to be notified; BIS is the certifying authority ✓ | Determine whether the machine type is listed; BIS certification (Scheme X) where required; test reports and technical documentation |
| European Union | Machinery Regulation (EU) 2023/1230 | Applies from 20 January 2027, replacing Directive 2006/42/EC; until then the Directive applies ✓ | Risk assessment, technical file, EU declaration of conformity, CE marking, instructions (digital allowed under the Regulation) |
| United States | OSHA workplace rules; NFPA 79 and UL 508A by customer or authority requirement; laser products under FDA CDRH 21 CFR 1040.10/1040.11 | Confirm | Electrical design per NFPA 79 / panel per UL 508A where specified; laser product certification and reporting to CDRH for laser products |
| Semiconductor fabs (global) | Customer purchase specification invoking SEMI S2/S8/S10, F47, GEM/GEM300, E187 | By contract | Third-party SEMI S2/S8 evaluation report, GEM compliance, cybersecurity evidence |
| Automotive and battery customers | Customer standards (safety, controls, data), often stricter than law | By contract | Compliance matrix against customer specification |

### 56.2 Standards map

| Area | Standard (edition) | Purpose | Applies when | Builder documents | Validation implication |
|---|---|---|---|---|---|
| Machine safety — basic | ISO 12100:2010 (confirm) | Risk assessment and risk reduction method | Every machine | Risk assessment report | Hazard list traced to measures and residual risks |
| Functional safety | ISO 13849-1:2023 ✓ | Design of safety-related control parts, PL | Safety functions using control systems | SRS, PL calculations, validation plan and report | Fault-injection tests, component data, CCF evidence |
| Functional safety | IEC 62061:2021 (confirm) | SIL-based alternative for safety-related control systems | Complex or programmable safety systems | Same as above in SIL terms | As above |
| Safeguard positioning | ISO 13855:2024 ✓ | Minimum distances for ESPE, interlocking guards, controls | Light curtains, scanners, interlocked guards | Distance calculations with measured stopping times | Stopping-time measurement at FAT/SAT |
| Safety distances / gaps | ISO 13857:2019, ISO 13854:2017 (confirm) | Reach distances; minimum gaps against crushing | Guard openings, pinch points | Guard design records | Measurement of openings and gaps |
| Interlocking devices | ISO 14119:2024 ✓ | Selection and design of interlocks, guard locking, defeat protection | Movable guards | Interlock selection and defeat assessment | Functional tests; defeat checks |
| Guards | ISO 14120:2015 (confirm) | Design of fixed and movable guards | All guarding | Guard specifications | Inspection |
| Emergency stop | ISO 13850:2015 (confirm) | E-stop function design | Every machine with E-stop | Stop category, device selection | Functional test |
| ESPE | IEC 61496 series (confirm) | Electro-sensitive protective equipment | Light curtains, scanners | Device type certificates | Integration test |
| Pneumatic safety | ISO 4414:2010 (confirm) | Safety of pneumatic systems | Pneumatic machines | Schematic, energy isolation | Dump and hold tests |
| Electrical equipment | IEC 60204-1:2016+AMD1:2021 (edition 6.1; edition 7 in development) ✓ | Electrical equipment of machines | Every machine | Schematics, verification tests | Bonding continuity, insulation, voltage and functional tests |
| Panels | IEC 61439-1/-2 (confirm); UL 508A (US) | Low-voltage assemblies / industrial control panels | Panel design and build | Design verification, temperature rise, SCCR (UL) | Routine verification of each panel |
| North America electrical | NFPA 79 (confirm edition) | Electrical standard for industrial machinery | US and many export customers | As IEC 60204-1 equivalent | Per NFPA 79 tests |
| Drive safety functions | IEC 61800-5-2 (confirm) | Safety functions of power drive systems | STO, SS1, SLS etc. | Drive certificates, parameterization | Function tests |
| EMC | IEC 61000-6-2 / 61000-6-4 (confirm); IEC 61800-3 for drives | Immunity and emissions in industrial environments | Every machine | EMC design and test evidence or assessment | Tests or documented assessment |
| Laser product safety | IEC 60825-1:2014 (current Part 1 in the 2026 series) ✓ | Laser classification and product requirements | Machines containing lasers | Classification, labels, interlocks, emission indicators | Accessible-emission assessment |
| Laser guards | IEC 60825-4:2022 ✓ | Guards and windows for laser radiation | Enclosures of Class 4 lasers | Guard exposure ratings, window OD data | Guard assessment, supplier data |
| Laser processing machines | ISO 11553-1:2020 (confirmed 2025) ✓ | Laser radiation hazards of processing machines | Laser marking, welding, cutting machines | Machine-level laser safety file | Verification of Class 1 in production modes |
| Robots | ISO 10218-1:2025 and ISO 10218-2:2025 ✓ (collaborative-application content formerly in ISO/TS 15066) | Robot and robot-cell safety | Robot cells | Cell risk assessment, safeguarding, collaborative measurements | Force and pressure measurements for PFL; safety function tests |
| Semiconductor EHS | SEMI S2-0724 (editorial S2-0724E) ✓, with S8, S10, S22 | EHS guideline for semiconductor equipment | Fab tools | Third-party S2/S8 evaluation report | Evaluation by qualified body |
| Semiconductor power quality | SEMI F47 (confirm) | Voltage-sag immunity | Fab tools | Test evidence | Sag test |
| Semiconductor automation | SEMI E5, E30, E37; GEM300 set (confirm revisions) | Host communication | Fab tools | GEM manual, compliance statement | Host simulator tests |
| Semiconductor cybersecurity | SEMI E187 (confirm) | Equipment cybersecurity | Fab tools | Security documentation | Customer audit |
| Cleanroom | ISO 14644-1:2015 (confirm) | Air cleanliness classes | Cleanroom tools and environments | Particle performance data | Particle tests |
| Industrial communication | IEC 61158 / 61784 (fieldbus), IEC 62541 (OPC UA) (confirm) | Protocol specifications | Networked machines | Conformance or certified devices | Interoperability tests |
| Industrial cybersecurity | IEC 62443 series (confirm) | Security of automation systems | Connected machines | Zone model, measures | Security review, hardening checklist |
| Programming | IEC 61131-3 (confirm edition) | PLC languages | PLC software | Coding standards | Code review |
| Documentation | IEC/IEEE 82079-1, ISO 20607 (confirm) | Information for use; instruction handbooks | Manuals | Manual structure and content | Review against checklist |
| Drawings | ISO 1101 / ISO GPS; ASME Y14.5-2018; ISO 1219 (fluid power symbols); IEC 81346 (designations) (confirm) | Technical drawing conventions | All drawings | Drawing standard statement | Drawing review |

### 56.3 The compliance chain — examples

| Standard | Requirement (paraphrased) | Design implication | Verification |
|---|---|---|---|
| ISO 13849-1:2023 | Each safety function reaches its required PL | Door interlock with guard locking, dual channel, monitored outputs (Cat. 3) | PL calculation; fault-injection test record |
| ISO 13855:2024 | Protective device positioned at least the calculated distance from the hazard | Light curtain 350 mm from the shuttle's danger zone (Part 27 example) | Stopping-time measurement; distance check at FAT and SAT |
| IEC 60204-1 | Protective bonding and insulation of electrical equipment | PE bar, bonding of all exposed parts, insulation-rated components | Bonding continuity and insulation resistance tests |
| IEC 60825-1 / ISO 11553-1 | Accessible laser radiation limited in production to the declared class | Class 1 enclosure, interlocked doors, rated windows | Accessible-emission assessment; interlock tests |
| SEMI S2 | Equipment meets EHS guideline sections applicable to the tool | Interlocks, labels, ergonomics, exhaust, seismic design as applicable | Third-party evaluation report |

### 56.4 Sources (checked 26 September 2026)

- ISO 13855:2024 — ISO catalogue
- ISO 11553-1:2020 — ISO catalogue
- ISO 10218-2:2025 — ISO catalogue
- ISO 10218-1:2025 preview (third edition, collaborative content)
- EN ISO 13849-1:2023 — CEN-CENELEC news
- ISO 14119:2024 and ISO 13855:2024 roundup
- IEC 60204-1:2016+AMD1:2021 — IEC webstore
- IEC 60204-1 edition 7 in development — project record
- IEC 60825 series 2026 pack (IEC 60825-1:2014, IEC 60825-4:2022)
- SEMI S2-0724 publication note
- SEMI S2 current revision listing
- India OTR Amendment Order 2025 — PIB
- EU Machinery Regulation 2023/1230 — TÜV Rheinland overview
