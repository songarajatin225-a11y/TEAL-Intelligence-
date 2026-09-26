---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 13
part_title: "Part 9 — GD&T and tolerance stack-up"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 9 — GD&T and tolerance stack-up

Accuracy at the process point is the sum of every error between the part's datums and the tool. Locate the part on the same datums the drawing uses, list every contributor from fixture to tool, and stack them three ways (worst case, RSS, mixed); in the worked example below a lens-height effect alone is worth more than the whole motion system.

### 9.1 Objective

Translate the customer's GD&T into a machine error budget, allocate it to fixture, part location, axes, calibration and process tool, and prove by stack-up that the CTQ tolerance is met with margin.

### 9.2 Engineering concept

GD&T defines what is controlled, relative to which datums, and within which zone. A machine builder uses it in two directions: to read what the customer really requires, and to specify fixtures, axes and calibration so the requirement holds.

Two drawing systems are in common use and differ in a default that matters. ASME Y14.5 applies Rule #1 (the envelope principle): size limits also control form unless stated otherwise. ISO 8015 applies the independency principle: size and form are independent unless the envelope is invoked. Confirm which system each drawing uses before interpreting it.

### 9.3 Architecture — datums and the reference frame

| Datum | Constrains | Contact on the part | Fixture element |
|---|---|---|---|
| Primary (A) | 3 degrees of freedom: Z translation, rotation about X and Y | Three points on the largest stable surface | Three rest pads or a machined plane |
| Secondary (B) | 2 degrees of freedom: X translation, rotation about Z (or X and Y for a bore) | Two points on an edge, or a bore | Two pins on an edge, or a round pin in a bore |
| Tertiary (C) | 1 degree of freedom: remaining translation | One point, or a slot | One stop, or a diamond pin in a slot |

The golden rule: the fixture's locating elements sit on the drawing's datums. Then the part's own manufacturing tolerances between datum features and the processed feature drop out of the machine's stack.

### 9.4 Components — the geometric controls

| Control | Symbol | What it controls | Needs datum? | Where a machine builder meets it |
|---|---|---|---|---|
| Position | ⌖ | Location of a feature within a zone around its true position | Yes | Mark, weld or hole position relative to part datums |
| Flatness | ⏥ | Form of a surface between two parallel planes | No | Rest pads, mounting plates, vacuum chucks |
| Parallelism | ∥ | Orientation parallel to a datum | Yes | Rail seats, gantry beams, focus planes |
| Perpendicularity | ⟂ | Orientation at 90° to a datum | Yes | Axis squareness, pin axes to rest planes |
| Concentricity | ◎ | Median points about a datum axis (ISO; withdrawn from ASME Y14.5-2018) | Yes | Legacy drawings; replace with runout or position |
| Circular / total runout | ↗ / ⌰ | Surface variation during rotation about a datum axis | Yes | Rotary tables, spindles, rollers |
| Profile of a line / surface | ⌒ / ⌓ | Form, orientation and location of a curved or complex surface | Optional | Formed parts, weld seams, contoured fixtures |

A diametral position tolerance Ø0.2 mm allows ±0.1 mm in any direction; a square ±0.1 mm zone is not equivalent, because its corners reach 0.141 mm. The Ø0.283 mm circle through those corners has 57% more area than the square, so converting between the two silently changes the requirement.

### 9.5 Design methodology

- List CTQ features with their GD&T callouts and datums.
- Design the fixture on those datums (Part 10).
- Draw the error chain from part datums to the tool point, direction by direction (X, Y, Z, angle).
- Quantify each contributor from drawings, vendor data or measurement; mark each as random or systematic.
- Stack by worst case, RSS and mixed methods; compare with the CTQ tolerance.
- If the stack fails, attack the largest contributors first (Pareto), usually by calibration, geometry change or datum change.
- Record the stack as a controlled calculation; re-run at every design change.
- Verify at FAT by measuring the CTQ on parts, not by adding up component certificates.

### 9.6 Calculations

T_(WC)=∑_(i=1)^n |t_i|

T_(RSS)=√(∑_(i=1)^n t_i^2)

T_(mixed)=∑_(sys)^​ |t_j|+√(∑_(rand)^​ t_k^2)

T_(MRSS)=C_f√(∑t_i^2), C_f≈1.5

Δ_(clearance)=(D_(hole,max)−d_(pin,min))/(2)

Δ_(xy,height)=Δz⋅tanθ

tanθ≈(r)/(f)

t_i = ± tolerance of contributor i (each treated as ±3σ in RSS); C_f = Bender correction for non-centred processes; Δ_clearance = maximum radial shift of a part on a locating pin; Δ_xy,height = lateral mark shift caused by a height error Δz under a non-telecentric scan lens at radius r from the field centre with focal length f.

### 9.7 Industrial example — fixture → part → axis → tool stack for a laser mark

Requirement: a Data Matrix mark with position tolerance ×0.2 mm relative to datums A|B|C (±0.10 mm radially). The machine is the Part 4 shuttle: part on a nest with round pin in bore B and diamond pin in slot C, shuttle axis, galvo head with a 254 mm F-theta lens. The mark sits 20 mm from the field centre; part-height variation at the mark is ±0.2 mm.

| # | Contributor | Chain link | Value (±mm) | Type | Basis |
|---|---|---|---|---|---|
| 1 | Round-pin position in nest | Fixture | 0.010 | Random (per nest) | Jig-bored nest, drawing tolerance |
| 2 | Pin-to-bore clearance (×8 H7 bore, ×8 g6 pin) | Fixture → part | 0.0145 | Random | (8.015 − 7.986) / 2 |
| 3 | Nest-to-shuttle repeatability | Fixture → axis | 0.010 | Random | Dowelled nest, measured |
| 4 | Shuttle positioning repeatability | Axis | 0.005 | Random | Servo and ball screw spec |
| 5 | Shuttle-to-galvo field calibration residual | Axis → tool | 0.020 | Random | Calibration grid residual |
| 6 | Galvo repeatability | Tool | 0.005 | Random | Galvo spec at 254 mm |
| 7 | Galvo drift over 8 h after warm-up (~50 µrad) | Tool | 0.013 | Random | 50 µrad × 254 mm |
| 8 | F-theta distortion residual after correction | Tool | 0.015 | Systematic | Field-correction residual |
| 9 | Thermal drift of galvo mount and frame | Structure | 0.010 | Systematic | Thermal estimate, 3 K |
| 10 | Height error through non-telecentric lens | Part → tool | 0.016 | Random | 0.2 × (20 / 254) |

Stack results

| Method | Result (±mm) | vs ±0.10 mm | Verdict |
|---|---|---|---|
| Worst case | 0.119 | 119% | Fails |
| RSS | 0.040 | 40% | Passes, but assumes every term random and centred |
| Mixed (systematic linear + random RSS) | 0.025 + 0.036 = 0.061 | 61% | Passes with 39% margin — use this for design sign-off |
| Modified RSS (×1.5) | 0.060 | 60% | Passes; consistent with the mixed result |

How the errors accumulate. Worst case assumes all ten errors peak in the same direction at once, which almost never happens; RSS assumes none are systematic, which is optimistic. The mixed method is the honest middle: it adds calibration residuals and thermal drift linearly because they push in one direction for hours.

The lesson hidden in line 10. Had the customer placed the code 80 mm from the field centre, the same ±0.2 mm height variation would shift the mark by 0.2 × 80 / 254 = ±0.063 mm — larger than the whole motion system. The fixes, in order of cost: place codes near the field centre, add Z-focus per variant, measure height and correct in software, or use a telecentric lens.

What dropped out. The part's own tolerance between bore B and the mark area does not appear, because the fixture locates on B. Had the nest located on the cast outline instead, the casting's ±0.3 mm profile tolerance would have entered the stack and failed it outright.

Second stack — focus (Z) for a laser weld, depth of focus ±0.5 mm:

| Contributor | ±mm | Type |
|---|---|---|
| Part weld-surface height from datum A | 0.050 | Random |
| Rest-pad height in fixture | 0.010 | Random |
| Mounting-plate flatness under the fixture | 0.020 | Systematic |
| Z-axis repeatability | 0.010 | Random |
| Thermal focal shift of optics at full power | 0.100 | Systematic |
| Mixed total | 0.120 + 0.052 = 0.172 | 34% of depth of focus |

The largest term is thermal focus shift in the optics, invisible in any mechanical drawing — measure it on the process bench at full power.

### 9.8 Design trade-offs

| Choice | Tighter component tolerance | Calibration and compensation |
|---|---|---|
| Cost profile | Paid on every part and every machine | Paid once in engineering, plus a calibration procedure |
| Stability | Stable, no software dependency | Depends on the calibration staying valid |
| Best for | Random terms that cannot be measured in-process | Systematic, repeatable terms (distortion, offsets, squareness) |

| Stack method | Use when |
|---|---|
| Worst case | Safety-critical fits, few contributors, or 100% interchangeability required |
| RSS | Many independent random contributors, capable processes |
| Mixed / modified RSS | Design sign-off for machines with calibrated systematic terms |
| Monte Carlo | Non-normal distributions, non-linear geometry, many contributors |

### 9.9 Common mistakes

- Locating the part on convenient features instead of the drawing's datums.
- Converting diametral position tolerances into square ± zones without noticing.
- RSS-ing systematic errors such as calibration residuals and thermal drift.
- Ignoring height-to-position coupling through non-telecentric optics.
- Treating ASME and ISO drawings as if the same default rules apply.

### 9.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Mark position varies part to part | Pin clearance, part seating, height variation | Mark 30 parts, measure against datums; correlate with height | Position scatter vs height | Reduce clearance, add clamp toward pins, Z-correction | Stack includes height coupling |
| Constant offset on every part | Calibration or nest offset | Mark a glass grid plate in the nest | Mean offset | Correct offset in recipe | Calibration step in FAT procedure |
| Error grows toward field edge | F-theta distortion, height effect | Grid test over full field at two heights | Error map | Field correction table, keep features central | Specify mark zones at G2 |
| Nest A good, nest B offset | Per-nest variation | Same part in both nests | Nest-to-nest delta | Per-nest offsets | Nest identification in recipe |

### 9.11 Design checklist

- Drawing standard (ASME Y14.5 or ISO GPS) identified for every customer drawing
- Fixture locators on drawing datums A, B, C
- Error chain drawn per direction (X, Y, Z, angle)
- Each contributor quantified and tagged random or systematic
- Worst-case, RSS and mixed results recorded; mixed result ≤ 75% of tolerance
- Optical height-to-position coupling included for scan-head processes
- Calibration procedures defined for every systematic term that is compensated
- FAT verification measures the CTQ on real parts

### 9.12 Key takeaways

- Fixture on the drawing's datums, and the part's own tolerances leave the stack.
- Stack systematic terms linearly and random terms by RSS.
- In scan-head machines, part height becomes position error away from the field centre.
- Calibrate systematic errors; tighten tolerances only on random ones.
