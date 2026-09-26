---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 37
part_title: "Part 29 — Semiconductor equipment"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 29 — Semiconductor equipment

Semiconductor equipment is automation where the product is fragile, expensive, invisible to the eye when damaged, and tracked at wafer or die level by the fab's host. Four things separate it from general SPMs: standardized material interfaces (FOUPs, load ports, trays, magazines), contamination and ESD control, SEMI safety guidelines (S2, S8, S10) as a condition of sale, and GEM/GEM300 host integration. Buy the standard handling where it exists and engineer the process module.

### 29.1 Objective

Design ATMP and front-end-adjacent equipment (marking, inspection, trimming, singulation, handling) that meets fab interface, cleanliness, ESD, safety and automation standards at the required wafer-per-hour or unit-per-hour rate.

### 29.2 Engineering concept

| Handled format | Carrier / interface | Handling method | Main risks |
|---|---|---|---|
| Wafer (150 / 200 / 300 mm) | Open cassettes, SMIF, FOUP on load ports; EFEM with robot and aligner | Vacuum or edge-grip end-effectors; notch/flat pre-aligner | Breakage, backside contamination, particles, slip, ESD |
| Die | Dicing frame on tape, waffle pack, gel pack | Needle or needle-less ejector plus pick-up collet | Cracks from ejection, chipping, orientation |
| Tray (JEDEC matrix) | Tray stacks, tray elevators | Pick-and-place, tray shuttles | Pocket misplacement, pin-1 orientation |
| Leadframe | Strips in magazines | Magazine elevator, strip pusher, indexing claws or pins | Bent leads, strip warp, jams |
| Substrate (BGA, panel) | Strips or panels in magazines or boats | Vacuum tables, edge conveyors | Warp, surface damage |
| Packaged unit | Tubes, trays, tape and reel | Pick-and-place, gravity feed | Lead or ball damage, mixing |

### 29.3 Architecture — standards that shape the machine

| Area | Standard | What it drives |
|---|---|---|
| EHS | SEMI S2 (current: S2-0724, editorial S2-0724E), with S8 (ergonomics) and S10 (risk assessment) | Safety design, third-party evaluation report often required for purchase |
| Electrical design | SEMI S22 | Electrical safety of the tool |
| Voltage sag immunity | SEMI F47 | Ride-through of supply dips; controls and vacuum must not drop wafers |
| ESD | SEMI E78 | Charge control, dissipative materials, ionization |
| Material interface | SEMI E15.1 (load ports), E47.1 (FOUP), E57 (kinematic coupling), E62 (FOUP opener), E84 (AMHS hand-off) | Load ports and automated delivery |
| Host automation | SEMI E5, E30 (GEM), E37 (HSMS); GEM300: E39, E40, E87, E90, E94 | Host control, carrier and substrate tracking (Part 23) |
| Productivity | SEMI E10, E79, E116 | Equipment states, OEE, performance tracking |
| Data collection | SEMI E120, E125, E132, E134 (Interface A / EDA) | High-rate data for engineering |
| Cybersecurity | SEMI E187 | Fab equipment security expectations |
| Cleanroom | ISO 14644-1 classes | Particle limits for tool environment |
| Wafer identification | SEMI M12, M13 (alphanumeric), T7 (backside 2D matrix) | Wafer marking content and position |

Check the current revision of each SEMI document with SEMI at contract stage; the fab's purchase specification overrides generic assumptions.

### 29.4 Components — contamination and ESD control

| Source of contamination | Control |
|---|---|
| Moving parts (guides, screws, belts) | Covered or bellowed axes, cleanroom-grade lubricants, local exhaust below motion |
| Cables in drag chains | Cleanroom-rated chains and cables; route below the wafer plane |
| Pneumatic exhaust | Ducted exhaust, filters, or electric actuators |
| Laser ablation debris and fume | Process-chamber exhaust with capture at the source; pressure cascade away from the EFEM |
| Materials | Stainless steel, anodized aluminium, PEEK, low-outgassing plastics; avoid shedding foams and uncured coatings |
| Airflow | Fan-filter units with downflow over the wafer path; positive pressure to the bay |
| People | Front-loading design, covers, service procedures |
| ESD | Dissipative materials (≈ 10⁶–10⁹ Ω), grounded end-effectors, ionizers, charge monitoring |

### 29.5 Design methodology

- Obtain the fab's equipment purchase specification: interfaces, cleanliness, SEMI S2 evaluation, host requirements, facilities.
- Buy standard modules: EFEM, load ports, wafer robots, pre-aligners, tray handlers, magazine elevators.
- Design the process module (laser, inspection, trimming) and its interface to the EFEM.
- Design airflow, exhaust and pressure cascade; plan particle tests.
- Design ESD control and grounding.
- Implement GEM (and GEM300 where required) from the start of software design.
- Plan the SEMI S2/S8 third-party evaluation during design, not after build.
- Verify throughput with a scheduler model (robot swaps, aligner, chamber).
- FAT with particle-per-wafer-pass tests, breakage tests, host simulation; SAT on the fab host.

### 29.6 Calculations

WPH=(3600)/(t_(bottleneck))⋅A

t_(chamber)=t_(swap)+t_(process)+t_(verify)

Q_(FFU)=A_(FFU)⋅v_(down)

t_bottleneck = the longest non-overlapped resource time per wafer; A = availability; v_down = downflow velocity (typically 0.3–0.5 m/s).

Throughput example — 300 mm wafer marker. Pre-align 6 s; laser mark 18 s; OCR verify 3 s; robot moves 4–5 s each.

| Configuration | Bottleneck | Time per wafer (s) | Ideal WPH | WPH at 90% availability |
|---|---|---|---|---|
| Single-arm robot, no overlap | Whole sequence | 5 + 6 + 4 + 18 + 3 + 4 = 40 | 90 | 81 |
| Dual-arm robot, aligner buffered, two load ports | Chamber: swap 5 + mark 18 + verify 3 | 26 | 138 | 125 |

The dual-arm robot and a second load port are standard EFEM options; they add about 50% throughput without touching the laser module.

Airflow example. An EFEM with 1.2 m² of FFU area at 0.4 m/s moves 0.48 m³/s (about 1,700 m³/h); the laser chamber exhaust must not pull more than the pressure cascade allows, or dirty air flows toward wafers.

### 29.7 Industrial example — semiconductor equipment types

| Equipment | Process | Key specifications | Engineering challenges |
|---|---|---|---|
| Wafer marking | Laser ID on wafer front (OCR) or backside (2D T7 code), soft or hard mark | Mark position and depth, readability, particles, WPH | Debris control, notch alignment, SEMI M12/M13/T7 content, GEM300 |
| Die inspection | 2D/3D imaging of die surfaces and edges | Defect size detectable, false-call rate, UPH | Lighting for chips and cracks, stage vibration, image data volume |
| Package laser marking | Mark mold compound or lids on strips or trays | Character quality, depth, position, UPH | Strip warp, fume, OCV verification, recipe per device |
| Laser trimming | Adjust thin- or thick-film resistors to value with in-process measurement | Trim accuracy, speed, measurement repeatability | Probe-card measurement synchronized with laser |
| Laser singulation / grooving | Ablation grooving, stealth or full-cut dicing | Kerf, chipping, die strength, throughput | Ultrafast or UV sources, debris, tape handling |
| Package inspection | Leads, balls, marks, body defects | Coplanarity, ball height, OCR/OCV | 3D measurement, handling without damage |
| Material handling | Tray, tube, reel, magazine transfer | UPH, jam rate, no mixing | Standard carriers, error recovery, traceability |

### 29.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Build vs buy EFEM and load ports | Control, lower bill cost | Proven SEMI compliance, fab acceptance | Buy; engineer the process module |
| Vacuum vs edge-grip end-effector | Simple, secure | No backside contact, thin wafers | Edge grip for thin or backside-sensitive wafers |
| Pneumatic vs electric actuators | Cheap | Clean, programmable | Electric inside the minienvironment |
| Blade vs laser dicing | Mature, cheap per cut | Narrow kerf, low chipping, fragile materials | Laser for thin wafers, low-k stacks, narrow streets |
| Full GEM300 vs basic GEM | Required by 300 mm fabs | Lower effort | Match the fab's specification; architect for GEM300 in platforms |

### 29.9 Common mistakes

- Designing a custom wafer handler instead of buying a standard EFEM.
- Treating SEMI S2 evaluation as a document exercise after build.
- Laser exhaust that reverses the pressure cascade and pulls debris onto wafers.
- No SEMI F47 consideration; a supply dip releases vacuum and drops wafers.
- GEM added at the end, breaking the software architecture.
- Needle ejection unchanged for thinned die, cracking them.

### 29.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Particle adders above specification | Motion debris, exhaust imbalance, laser debris | Particle-per-wafer-pass test by module | Adders by size bin and location | Bellows, exhaust rebalancing, chamber redesign | Particle tests at module level |
| Wafer breakage or chipping | End-effector misalignment, pre-aligner, slot mapping error | Teach check, slot mapping log | Breakage location | Re-teach, fix mapping, soft-landing | Teach verification each PM |
| Load port hand-off errors | E84 signal timing, AMHS mismatch | E84 signal trace | Signal sequence | Fix timing and configuration | E84 test with AMHS simulator |
| OCR or code read failures | Mark depth, lighting, contamination | Reader grading, offline microscope | Grade and depth | Adjust recipe, lighting | Mark quality monitoring |
| Host rejects messages | GEM variable or event mismatch | Host log comparison | Message trace | Align GEM manual with host spec | GEM compliance test at FAT |

### 29.11 Design checklist

- Fab purchase specification captured: interfaces, cleanliness, safety, host, facilities
- Standard EFEM, load ports and robots selected; process module interface defined
- Airflow, exhaust and pressure cascade designed; particle test plan
- ESD control plan (materials, grounding, ionization)
- SEMI S2/S8/S10 evaluation planned from design start
- SEMI F47 voltage-sag ride-through addressed
- GEM / GEM300 capabilities specified and simulated at FAT
- Throughput verified with a scheduler model

### 29.12 Key takeaways

- Buy the standard material-handling interfaces; differentiate in the process module.
- Cleanliness, ESD and airflow are design features, verified by particle tests.
- SEMI S2 and GEM are conditions of sale; plan them from day one.
- Throughput is usually set by chamber occupancy and robot swaps, not by the process alone.
