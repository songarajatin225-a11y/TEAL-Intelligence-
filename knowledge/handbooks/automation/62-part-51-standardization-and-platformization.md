---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 62
part_title: "Part 51 — Standardization and platformization"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 51 — Standardization and platformization

An equipment company scales when most of each new machine is already designed, built, coded, validated and documented. Aim for a standard core plus configurable modules covering 70–80% of each machine, and engineer only the process edge. In the Part 45 example this cuts cost by about 22% per machine; a platform investment of ₹1.5 crore breaks even after about nine machines.

### 51.1 Objective

Move from one-off SPMs to a product platform with standard modules, electrical architecture, software, HMI, safety, fixtures, motion, BOM and documentation, governed by a platform owner and a roadmap.

### 51.2 Engineering concept

| Maturity stage | What is reused | Typical reuse | Characteristic |
|---|---|---|---|
| 1. One-off SPM | People's memory | < 20% | Every project starts from a blank CAD file |
| 2. Copy-and-modify | Previous projects' files | 20–40% | Reuse without standards; errors copied too |
| 3. Standard modules | Validated modules and libraries | 40–60% | Modules with specs, tests, BOMs |
| 4. Configurable platform | Core plus option modules, configuration rules | 60–80% | Quote from a configurator; engineering on the process edge |
| 5. Product line | Catalogue products with variants | > 80% | Sold as products; SPM work only for special requests |

### 51.3 Architecture — what a platform standardizes

| Layer | Standard content |
|---|---|
| Mechanical modules | Frame sizes, enclosure families, handling modules (drawer, rotary, shuttle, conveyor, robot interface), fixture interface (zero-point plate) |
| Motion | Axis families with pre-sized motor, screw and guide combinations and tuning sets |
| Electrical architecture | Panel families, 24 V distribution scheme, drive and safety wiring patterns, labelling |
| PLC software | State-machine framework, mode manager, device library (cylinder, axis, vacuum, laser, reader), alarm manager, recipe manager, part tracker |
| HMI | Screen templates, style guide, navigation, alarm presentation |
| Safety | Standard safety functions with pre-calculated PL, validated safety program blocks, standard guarding |
| Process heads | Laser marking, welding, cleaning heads with standard mounting, cooling and control interfaces |
| Data and MES | OPC UA model, part-record schema, SECS/GEM option |
| BOM | Preferred-parts list, module BOMs with configuration rules, approved suppliers |
| Documentation | Manual templates, test protocols, risk assessment templates |

### 51.4 Components — platform governance

| Element | Role |
|---|---|
| Platform owner | Owns roadmap, standards, module quality; approves deviations |
| Module owners | Maintain specs, drawings, code, tests, BOM for each module |
| Configuration rules | Which options combine; which require engineering |
| Configurator | Turns customer choices into a priced configuration, BOM and draft specification |
| Deviation process | Customer-specific changes either stay project-specific or are promoted into the platform |
| Release management | Versioned platform releases; compatibility notes |

### 51.5 Design methodology

- Analyse the last 10–20 machines: which modules recur, which differ.
- Define the platform scope: core, options, and what stays custom.
- Standardize interfaces first (mechanical, electrical, software, data); modules follow.
- Build the software framework and device library; port one existing machine onto it.
- Validate each module to a module test spec; document once.
- Build configuration rules and a configurator for quoting.
- Govern: platform owner, release cycles, deviation promotion.
- Measure: reuse ratio, engineering hours per machine, lead time, first-time-right at FAT, field failure rate.

### 51.6 Calculations

N_(BE)=(I_(platform))/(ΔC_(machine))

R_(reuse)=(standard content (hours or cost))/(total content)

Example: investing ₹1.5 crore in platform engineering (framework software, module validation, documentation) with a saving of ₹17.3 lakh per machine (Part 45: ₹79.4 lakh first-of-kind vs ₹62.1 lakh platform-derived) → N_BE = 150 / 17.3 ≈ 8.7, so about nine machines. Beyond cost, lead time typically falls because engineering and software move off the critical path, and FAT risk falls because modules are proven.

### 51.7 Industrial example — a TEAL-type laser platform

| Platform layer | Standard offer | Options | Custom edge |
|---|---|---|---|
| Base and enclosure | Frames S / M / L; Class 1 enclosure family | Cleanroom finish, extraction interfaces | Special part access |
| Handling | Manual drawer, rotary two-station, servo shuttle | Pallet conveyor, robot interface, tray stacker | Product-specific feeders |
| Process head | Marking head (fiber, UV, CO₂) | Welding head (single-mode, ring-mode), cleaning head | Special optics, multi-head layouts |
| Motion | Z-focus axis; XY table family | Gantry family | Long-stroke or high-dynamics axes |
| Vision | Code verification, fiducial alignment | Coaxial camera, 3D seam inspection | Product-specific inspection algorithms |
| Controls and software | PLC framework, HMI templates, safety functions | Robot integration, recipe server | Process-specific sequences |
| Data | OPC UA model, part records | SECS/GEM, MQTT | Customer-specific MES adaptations |

Marking machines for automotive, electronics and battery customers then differ mainly in the fixture, recipe and data mapping — the parts that should differ.

### 51.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Platform fit vs customer-perfect | Lower cost, faster, proven | Exact fit | Offer platform first; price deviations transparently |
| Broad vs narrow platform | Covers more applications | Simpler, cheaper to maintain | Start narrow where volume is; extend with evidence |
| Standardize early vs late | Consistency | Flexibility while learning | Standardize interfaces early, internals once proven |

### 51.9 Common mistakes

- Calling a folder of old projects a platform.
- Standardizing internals before interfaces.
- No platform owner; every project forks the standard.
- Letting customer-specific changes erode the core without review.
- Measuring platform success by number of modules instead of reuse and lead time.

### 51.10 Troubleshooting

| Symptom | Cause | Correction |
|---|---|---|
| Reuse ratio stagnates | Projects bypass standards to meet deadlines | Platform owner approval for deviations; make standard the fastest path |
| Platform modules fail in new applications | Modules validated for too narrow a range | Define and test module operating envelopes |
| Sales sells specials | Configurator missing or unused | Price specials realistically; train sales on platform value |

### 51.11 Design checklist

- Recurring modules identified from past machines
- Core, options and custom edge defined
- Interfaces standardized (mechanical, electrical, software, data)
- Software framework and device library in use
- Module specs, tests, BOMs and documentation released
- Platform owner, release process and deviation process active
- Reuse ratio, hours per machine and lead time tracked

### 51.12 Key takeaways

- Engineer the process edge; reuse everything else.
- Standardize interfaces first.
- A platform needs an owner, a roadmap and releases.
- Platform economics show up in price, lead time and FAT risk.
