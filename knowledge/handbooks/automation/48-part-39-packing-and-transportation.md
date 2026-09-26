---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 48
part_title: "Part 39 — Packing and transportation"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 39 — Packing and transportation

A machine that passed FAT can fail SAT because of the journey. Split it along module boundaries that keep calibrated assemblies intact, lock every axis, drain every fluid, protect against shock and humidity, record reference measurements before dismantling, and re-measure the same references at site.

### 39.1 Objective

Deliver the machine to site with no damage, no loss of calibration beyond what the site procedure restores, and complete shipping documentation.

### 39.2 Engineering concept

Transport exposes the machine to shock, vibration, tilt, humidity and temperature swings, and to handling by people who have never seen it. The design response is: fewer, stronger shipping units; locked motion; clear lifting instructions; monitoring indicators; and a reassembly procedure based on recorded references.

### 39.3 Architecture — packing plan

| Element | Practice |
|---|---|
| Shipping splits | Along module boundaries (Part 7); calibrated modules shipped whole; interfaces dowelled for exact re-location |
| Matchmarking | Tags on every disconnected cable, tube and bolt joint; photo record |
| Transport locks | Red-painted brackets on axes, gantries, robots and doors; list in the unpacking instruction |
| Fluids | Drain chillers and water circuits; blow dry; tag "drained" |
| Sensitive components | Laser sources, optics, cameras and IPCs in original or dedicated packaging, shipped separately inside the crate or as separate cases |
| Humidity | Sealed barrier bags with desiccant for electronics and optics; VCI film for bare steel |
| Crate | Heat-treated wood meeting ISPM-15 for export; skids for forklift; marked centre of gravity and lifting points |
| Indicators | Shock and tilt indicators on every crate |
| Documents | Packing list per crate, unpacking instruction, dangerous-goods declarations (UPS batteries, refrigerants), commercial documents |

### 39.4 Components — what to record before dismantling

| Reference | Why |
|---|---|
| Frame level and key flatness readings | To reproduce geometry at site |
| Axis parallelism and squareness values | To detect transport distortion |
| Calibration residuals (galvo field, camera, nests) | To decide whether full recalibration is needed |
| Software, parameter and IO-Link backups | To restore quickly |
| Photos of cable routing and connections | To reassemble correctly |

### 39.5 Design methodology

- Design shipping splits and lifting points during design (Gate 3), not after FAT.
- Write the packing and unpacking instructions with photos.
- Record references and back up software (39.4).
- Lock, drain, bag, crate and mark each unit; attach indicators.
- Check transport route, vehicle (air-ride suspension for precision machines), and insurance; agree Incoterms.
- At site: inspect indicators and crates on arrival with the customer and carrier present before signing delivery.

### 39.6 Calculations

T_(leg)=(W)/(n sinθ)

a_(shock)≈(v^2)/(2 s_(stop))=(g h)/(s_(stop))

T_leg = tension per sling leg for load weight W on n legs at angle θ from horizontal; a_shock = deceleration of a dropped unit from height h stopping over distance s_stop.

Examples: a 1,500 kg crate on two legs at 60° → T = 14,715 / (2 × 0.866) = 8.5 kN per leg → slings and shackles rated ≥ 1 t each with margin; at 30° the tension rises to 14.7 kN, 73% more. A 0.1 m drop onto a surface that stops the crate in 5 mm → a ≈ 9.81 × 0.1 / 0.005 = 196 m/s² (20 g) — far above what precision guides and optics tolerate, hence transport locks and cushioned mounts for sensitive modules.

### 39.7 Industrial example — shipping the busbar welding cell

- Two shipping splits: base with gantry (locked, 1.8 t) and enclosure panels with electrical cabinet (0.9 t).
- Laser source and chiller in the manufacturer's packaging; fiber cable coiled on a former above the minimum bend radius.
- Gantry locked at both ends; linear motor axes secured with brackets and magnets covered.
- Reference readings: gantry squareness 12 µm, rail parallelism 8 µm, galvo field RMS residual 11 µm.
- Air-ride truck Bengaluru to Pune; shock and tilt indicators on both crates; delivery inspection photos.

### 39.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Few large units vs many small | Less reassembly, calibration preserved | Easier handling, access | Largest units the route and site doors allow |
| Ship calibrated vs recalibrate at site | Faster SAT | Robust to transport | Ship calibrated and verify; recalibrate only if residuals exceed limits |
| Road vs sea vs air | Cost and control | Distance | Air-ride road domestically; sea with humidity protection for export |

### 39.9 Common mistakes

- Shipping splits decided after FAT, cutting through calibrated assemblies.
- Chiller water left in circuits, freezing or corroding.
- Transport locks left on at power-up.
- No reference readings, so transport damage cannot be proven.
- Signing delivery before inspecting indicators.

### 39.10 Troubleshooting

| Symptom at site | Possible causes | Diagnostic test | Corrective action | Preventive action |
|---|---|---|---|---|
| Axis squareness changed | Frame twisted in transit or uneven site floor | Re-measure against recorded references; check levelling | Re-level; re-square | Stiffer shipping base, correct lifting |
| Optics misaligned | Shock | Beam path and field check | Realign; recalibrate | Shock-isolated packaging |
| Corrosion on bare surfaces | Humidity in transit | Inspection | Clean, protect | VCI and desiccant sizing for route and duration |
| Missing parts | Packing list gaps | Reconcile against packing list | Expedite | Crate-level packing lists with photos |

### 39.11 Design checklist

- Shipping splits and lifting points designed at Gate 3
- References recorded and software backed up
- Axes locked; fluids drained; sensitive items packed separately
- Humidity protection and indicators fitted
- Crates marked: centre of gravity, lifting points, orientation, fragile
- Dangerous-goods items declared
- Unpacking instructions and transport-lock list in the crate

### 39.12 Key takeaways

- Plan shipping splits at design time along module boundaries.
- Record references before dismantling; re-measure at site.
- Lock, drain, bag, crate, indicate.
- Inspect on arrival with the carrier before signing.
