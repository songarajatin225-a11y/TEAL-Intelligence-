---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 38
part_title: "Part 30 — Battery and EV equipment"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 30 — Battery and EV equipment

Battery equipment joins, marks, tests and tracks energy-storing parts that cannot be allowed to short, overheat or leak. The machine-builder's priorities are fit-up control for laser welding of dissimilar thin metals, 100% non-destructive verification of joints, electrical isolation of all tooling, thermal-event readiness, and cell-to-pack genealogy.

### 30.1 Objective

Design cell-handling, welding, marking, inspection, leak-test and traceability equipment for module and pack lines that meets rate, joint quality and safety requirements for energized products.

### 30.2 Engineering concept

| Cell format | Construction | Terminals / tabs | Handling characteristics | Main risks in equipment |
|---|---|---|---|---|
| Pouch | Laminated foil pouch, flexible | Al (positive) and Ni-plated Cu (negative) foil tabs | Soft, no point loads, tab-edge sensitive | Puncture, tab damage, electrolyte exposure |
| Cylindrical (e.g. 18650, 21700, 46xx) | Steel or aluminium can | Positive cap and negative can on one or both ends | Rigid, round, high count per module | Weld penetration into the can, polarity errors, shorts between cans |
| Prismatic | Aluminium can, rigid | Al and Cu terminals on the top | Heavy, swells in use, needs compression | Terminal weld quality, compression control, vent protection |

Typical module and pack process chain: incoming cell test (OCV, internal resistance) → grading and sorting → cleaning of weld surfaces (laser or plasma) → stacking or insertion in holders → busbar or tab placement → laser welding → weld inspection → sensing-harness or FPC connection → end-of-line test (insulation, voltage, resistance) → marking and genealogy → enclosure, cooling-plate joining, leak test.

### 30.3 Architecture

| Station | Function | Key technology | CTQs |
|---|---|---|---|
| Cell handling and sorting | Test, grade, orient | Grippers with insulated jaws, OCV/IR testers, vision polarity check | Correct grade, correct polarity, no damage |
| Surface cleaning | Remove oxides, oils, coatings | Pulsed fiber laser cleaning, plasma | Surface energy, no substrate damage |
| Stacking / insertion | Build the cell array | Robots, compression fixtures | Position, compression force |
| Laser welding | Join tabs and busbars | CW fiber (single-mode, ring-mode), wobble, galvo or fixed optics | Penetration window, strength, joint resistance, no spatter on cells |
| Weld inspection | Verify joints 100% | In-process monitoring, 2D/3D vision, resistance measurement | Escape rate, false-call rate |
| Marking | Identify modules and packs | Fiber laser DPM | Grade after downstream processes |
| End-of-line test | Verify electrical safety and function | Insulation resistance, hipot, OCV, resistance | Pass/fail with traceable data |
| Leak test | Verify cooling circuits and enclosures | Pressure decay, mass flow, tracer gas (helium) | Leak rate below specification |

### 30.4 Components — laser welding of battery joints

| Material pair | Difficulty | Approach |
|---|---|---|
| Al–Al | Moderate: porosity, cracking with some alloys | Wobble or ring-mode beams, controlled heat input, clean surfaces |
| Cu–Cu | High reflectivity at ~1 µm, spatter | High brightness, ring-mode or green/blue-assisted sources, back-reflection protection |
| Al–Cu | Brittle intermetallics | Minimal mixing: low line energy, lap joints with controlled penetration, or alternative joining |
| Ni-plated steel to cell terminals | Penetration into thin cans | Tight focus and power control, gap control, penetration monitoring |

Joint design (lap, fillet, penetration, butt) and fit-up usually matter more than laser settings; the Part 3 study showed strength collapsing above a 0.05 mm gap, which turned into a hold-down mask requirement.

### 30.5 Design methodology

- Obtain cell and module drawings, materials, joint CTQs and the customer's test methods.
- Run welding DOE with production-representative materials, including surface and gap variation.
- Design fixtures for fit-up (hold-down masks, compression) and electrical isolation.
- Choose welding optics (galvo vs fixed), monitoring and inspection methods.
- Build the cycle-time chart from weld count, field moves, inspection and handling.
- Design safety for energized products: insulated tooling, voltage-rated gloves and procedures above safe-voltage levels, thermal-event detection, quarantine.
- Define genealogy: cell IDs to module positions to pack (Part 23).
- Validate joint quality by destructive tests (pull, shear, cross-section) correlated with non-destructive monitoring.

### 30.6 Calculations

CT_(module)=N_(welds) (t_(weld)+t_(jump))+N_(fields) t_(field)+t_(inspect)+t_(handling)

P_(joint)=I^2R_(joint)

Q_(leak)=(V Δp)/(Δt)

1 Pa·m^3/s=10 mbar·L/s

Module weld cycle (Part 5 concept A). 192 welds × 0.15 s = 28.8 s; 8 fields × 0.4 s gantry step = 3.2 s; in-line seam vision 8 × 0.5 s = 4.0 s; load, clamp mask, unload 20 s → 56 s against the 90 s takt, leaving room for a second weld pass on NOK joints.

Joint heating. At 200 A continuous, a 50 µΩ joint dissipates 2 W; a defective 200 µΩ joint dissipates 8 W and becomes a hot spot. This is why joint resistance is measured or inferred, not assumed.

Pressure-decay leak test. Cooling plate volume 2 L, pressure drop 20 Pa over 30 s → Q = 0.002 × 20 / 30 = 1.3 × 10⁻³ Pa·m³/s = 1.3 × 10⁻² mbar·L/s. Temperature drift of the part during the test can mimic a leak of this size; thermal stabilization or mass-flow and tracer-gas methods are used when the specification is tighter than pressure decay can resolve.

### 30.7 Industrial example — module busbar welding station (summary; full case in Book X)

- Pallet-borne module with cell holder; RFID on pallet; cell map from the insertion station.
- Hold-down mask with spring-loaded fingers per busbar tab; force verified by the mask's load cells.
- Height scan by laser line sensor before welding: gap and busbar flatness per joint.
- Ring-mode fiber laser on a gantry galvo head (concept A, Part 5); photodiode monitoring per weld; high-speed re-weld path for flagged joints.
- 3D vision seam inspection; periodic destructive pull tests on witness coupons each shift.
- Insulated tooling throughout; thermal camera over the station; smoke and temperature detection linked to an evacuation and quarantine procedure.
- Genealogy: every weld's parameters and monitoring summary stored against module serial and cell positions.

### 30.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Laser vs ultrasonic vs resistance welding vs wire bonding | Laser: fast, non-contact, flexible geometry | Ultrasonic: good for foil stacks; resistance: simple; wire bond: fusible links | Laser for busbars and cans; ultrasonic for pouch foil stacks; wire bonding where fusing links are designed in |
| Galvo vs fixed optic | Speed within field | Long seams, simpler optics | Galvo for spot and short-seam arrays |
| Pressure decay vs tracer gas | Simple, cheap | Much higher sensitivity | Tracer gas when leak specifications are tight |
| 100% monitoring vs sampling destructive tests | Every joint screened | Direct strength evidence | Both: monitoring for every joint, destructive tests for correlation |

### 30.9 Common mistakes

- Chasing laser settings when the root cause is fit-up.
- Metal tooling that can bridge cell terminals.
- Treating module voltage as harmless; tens of cells in series exceed safe-touch voltages.
- No plan for a thermal event in the station.
- Leak tests without thermal stabilization.
- Genealogy that records the module serial but not which cell sat in which position.

### 30.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Weak or failed welds in clusters | Gap from mask wear or busbar warp | Height-scan data vs weld result | Gap per joint | Replace mask fingers, busbar flatness control | Mask force monitoring |
| Spatter on cells | Focus, contamination, beam mode | High-speed video, surface check | Spatter count | Clean surfaces, ring-mode ratio, focus | Surface cleaning station |
| Penetration too deep | Power drift, gap closed, focus shift | Cross-sections, monitoring signal | Penetration depth | Recalibrate power, focus check | Daily coupon test |
| Leak test false fails | Temperature drift, fixture seal leaks | Test a known-good master | Master results | Stabilization time, seal replacement | Master part check each shift |
| High joint resistance at EOL | Weld defects, contamination | Micro-ohm measurement per joint | Resistance map | Re-weld or reject | Cleaning and monitoring |

### 30.11 Design checklist

- Cell format, materials and joint CTQs defined with test methods
- Welding DOE with production variation completed; fit-up requirements in the SRS
- Fixtures control gap and are electrically insulated
- Monitoring plus destructive-test correlation plan
- Cycle time from weld count, field moves, inspection and handling
- Electrical safety for energized products; thermal-event detection and procedure
- Leak-test method chosen for the specification; thermal stabilization included
- Cell-position genealogy to module and pack

### 30.12 Key takeaways

- Fit-up control is the heart of battery laser welding.
- Verify every joint non-destructively and correlate with destructive tests.
- Energized products change the safety case: insulation, voltage procedures, thermal events.
- Genealogy must reach cell position level.
