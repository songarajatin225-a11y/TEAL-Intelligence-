---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 14
part_title: "Part 10 — Fixture and jig design"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 10 — Fixture and jig design

A fixture has three separate jobs — locate, support, clamp — and mixing them is the root of most fixture problems. Locate on the drawing's datums with exactly six constraints, support where the process pushes, clamp toward the locators without distorting the part, then make wrong loading impossible.

### 10.1 Objective

Design fixtures that put every part in the same place (repeatability), keep it there under process and inertial loads (security), prevent wrong loading (poka-yoke), load quickly (ergonomics and cycle time) and change over fast (variants).

### 10.2 Engineering concept

- Locating removes degrees of freedom. A rigid part has six (three translations, three rotations); 3-2-1 removes them with three points on datum A, two on B, one on C.
- Supporting prevents deflection under load without adding location; supports are adjustable or compliant so they do not over-constrain.
- Clamping holds the part against the locators. Clamp forces point toward locators and act over supports, never between them.
- Over-constraint (more than six effective constraints on a rigid part) makes location depend on part tolerances and causes rocking or distortion. Flexible parts (sheet, PCB) are the exception: they use N-2-1, with N > 3 primary supports.
- Poka-yoke makes incorrect loading physically impossible or immediately detected.

### 10.3 Architecture — fixture types

| Type | Holding principle | Strengths | Limits | Typical use |
|---|---|---|---|---|
| Mechanical nest | Pocket, pins, gravity | Simple, cheap, no utilities | No holding force, part can lift | Laser marking of stable parts |
| Pneumatic clamp fixture | Cylinder-driven clamps | Force, automation, confirmation sensing | Air quality, clamp marks | Welding, heavy parts, automatic cells |
| Vacuum fixture | Pressure difference over an area | Distributed force, no top access needed | Leaks, porous or warped parts, vias | PCB, wafers, thin sheet, glass |
| Magnetic fixture | Permanent or electro-permanent magnets | Fast, full top access | Ferrous only, residual magnetism, swarf | Steel sheet, stamped parts |
| Precision (kinematic) fixture | Balls in V-grooves or cones | Sub-micron repeatability, no over-constraint | Low load capacity, cost | Metrology, optics, wafer handling |
| Quick-change pallet | Zero-point clamps, dowels | Changeover in seconds, offline setup | Cost per pallet | Multi-variant cells, pallet conveyors |

### 10.4 Components

| Component | Function | Specification points | Selection guidance |
|---|---|---|---|
| Round locating pin | Locate a bore in X and Y | Diameter tolerance (g6 typical), lead-in chamfer, hardness | Pair with bore H7; hardened steel, replaceable |
| Diamond (relieved) pin | Locate rotation only | Land width, orientation | Land perpendicular to the line of centres (10.6) |
| Rest pad | Datum A contact | Height tolerance, flatness, hardness | Three pads, ground as a set; replaceable inserts |
| V-block | Centre round parts | Included angle (90° typical) | Self-centring for shafts and cylindrical cells |
| Toggle / swing clamp | Manual or pneumatic holding | Clamp force, stroke, swing direction | Swing clamps clear the loading path |
| Pneumatic clamp cylinder | Automatic holding | Bore, stroke, force at supply pressure | Size at minimum supply pressure (Part 14) |
| Vacuum plate or cups | Distributed holding | Hole pattern, zones, sealing | Zone by part size; use flow-restricting holes for partial coverage |
| Part-presence and seating sensors | Confirm part seated | Sensing distance, switching point | Sense seating on datum A, not just presence |
| Clamp-confirmation sensors | Confirm clamp closed on a part | Cylinder switches, pressure switch | Distinguish "clamped on part" from "clamped on nothing" |
| Wear inserts and contact materials | Protect part and fixture | Hardness, cosmetic compatibility, ESD | Hardened steel for metal; POM or PEEK for cosmetic; ESD-dissipative for electronics |

### 10.5 Design methodology

- Read the drawing's datums and CTQ features; confirm the drawing standard (Part 9).
- Place locators on datums A, B, C using 3-2-1 (rigid) or N-2-1 (flexible).
- Add supports under process loads and wherever the part would deflect beyond budget.
- Place clamps pointing toward locators, over supports; size forces (10.6).
- Check access: loading path, process access (beam, tool, camera), chip and spatter paths, cleaning.
- Add poka-yoke: asymmetric features, variant-specific pins, feature-presence sensors.
- Add sensing: seated on A, clamped on part, correct variant.
- Plan changeover: pallet, quick-change inserts or recipe-driven adjustment.
- Plan maintenance: wear inserts, calibration features, spare nests.
- Validate: repeatability study (≥ 30 reloads), clamp-force check, poka-yoke challenge test.

### 10.6 Calculations

Clamp force against sliding

F_(clamp)≥(SF⋅(F_(process)+m a))/(μ⋅n_(surfaces))

SF = 2–3; F_process = process force parallel to the contact plane (N); m·a = inertial force (N); μ = friction coefficient (0.1–0.2 steel on steel, dry); n_surfaces = friction surfaces (2 when clamped between jaw and pad). Where a locator takes the load in its direction, only the opposite direction relies on friction.

Example: a 2 kg part on the Part 4 shuttle at 2.5 m/s², laser process force ≈ 0, μ = 0.15, one friction surface, SF = 2 → F_clamp ≥ 2 × 5 / 0.15 = 67 N. A ×16 mm cylinder at 4 bar gives about 80 N (Part 14), so a single small clamp is enough.

Vacuum holding force

F_(vac)=Δp⋅A_(eff)⋅η_(seal)

require F_(vac)≥SF⋅F_(load)

Example: PCB panel 300 × 250 mm, vacuum Δp = 60 kPa, 30% of the area effectively sealed → F = 60,000 × 0.075 × 0.3 = 1,350 N. The limit is never force; it is leakage through vias and slots, and warp that lifts corners off the plate.

Diamond pin land width

b≤(c⋅D)/(2 Δ)

b = land width (mm); c = diametral clearance of the diamond pin in its hole (mm); D = hole diameter (mm); Δ = maximum centre-distance mismatch between part holes and fixture pins (mm). Example: D = 6 mm, c = 0.02 mm, Δ = 0.05 mm (part ±0.04 plus fixture ±0.01) → b ≤ 1.2 mm. A wider land jams parts at the tolerance extremes.

Locating repeatability from clearance

Δ_(xy)=(D_(max)−d_(min))/(2)

Δ_θ≈(Δ_1+Δ_2)/(L)

Δ_θ = angular play (rad) from radial clearances Δ₁, Δ₂ at two locators a distance L apart. Example: 0.0145 mm at each pin, L = 80 mm → 0.36 mrad, i.e. 0.036 mm across a 100 mm part. Clamping the part toward the pins removes most of this play.

Part distortion under clamp

δ_(part)=(F L^3)/(48 E I) (clamp between two supports)

If a clamp must sit between supports, check the part's deflection; it springs back after unclamping and moves the processed feature.

### 10.7 Industrial examples — fixtures by product

| Product | Locating | Holding | Special requirements | Poka-yoke and sensing |
|---|---|---|---|---|
| PCB panel | Two tooling holes (round + diamond pin) or edge clamping on conveyor rails | Vacuum plate or edge clamps; support pins against warp | ESD-dissipative contact materials (surface resistance about 10⁶–10⁹ Ω); keep-outs for bottom-side components; fiducial vision corrects residual position | Board presence, orientation by asymmetric hole pattern, panel ID read |
| Pouch cell | Edge stops on the rigid tab end; large flat support | Distributed low-pressure clamping with compliant pads | No point loads or sharp edges; insulating contact surfaces to avoid shorting tabs | Tab-side orientation sensing, cell ID read |
| Cylindrical cells in a module | Cell holder or honeycomb carrier; V-locating for loose cells | Hold-down mask pressing busbar to terminals (Part 3) | Electrical isolation of all tooling; force per cell verified | Polarity check by vision, height scan before welding |
| Prismatic cell | Base datum plus two side stops | Side clamping with controlled force | Controlled compression to manage swelling; keep vent clear | Terminal polarity by feature, force monitoring |
| Semiconductor package (JEDEC tray) | Tray pocket plus tray locating corners | Vacuum pick, pocket for processing | Low-particle, ESD-dissipative materials; minimal contact | Pin-1 orientation by vision, tray ID |
| Wafer | Edge contact or backside vacuum chuck; notch or flat for rotation | Vacuum chuck or edge grip | Contact only in exclusion zones; cleanroom materials | Notch alignment, wafer ID (OCR or code) |
| Machined or cast metal part | 3-2-1 on machined datums; adjustable pads for cast datums | Pneumatic or hydraulic clamps | Hardened wear inserts; spatter and chip protection | Variant pins, part-present on datum A |
| Sheet-metal part | N-2-1: several primary supports | Clamps close to each weld; magnetic clamps for steel | Supports near process points; allow thermal distortion | Hole-presence sensing, variant blocks |

### 10.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Manual vs pneumatic clamps | Cheap, no utilities, operator-dependent | Consistent force, confirmable, automatable | Pneumatic for automatic cells and safety-relevant clamping |
| Mechanical vs vacuum holding | Robust, positive, blocks access | Full top access, distributed force, leak-sensitive | Vacuum for thin flat parts; mechanical for heavy or porous parts |
| Dedicated nest vs quick-change pallet | Lowest cost per variant at few variants | Fast changeover, offline setup, higher unit cost | Pallets when changeovers exceed ~2 per day or variants exceed ~5 |
| Hardened steel vs polymer contact | Wear life, stability | Cosmetic protection, ESD options | Steel for datums, polymer for cosmetic non-datum contact |
| Mechanical accuracy vs vision correction | No software dependency | Cheaper fixture, handles variation | Vision correction when part variation exceeds fixture capability |

### 10.9 Common mistakes

- Locating on convenient surfaces instead of the drawing's datums.
- Four "locating" pads on a rigid part; it rocks and the result depends on which three touch.
- Clamping between supports and distorting the part during processing.
- Sensing part presence but not correct seating on datum A.
- A round pin in both holes: parts jam at tolerance extremes; use round plus diamond.
- Tooling that can short a battery cell.

### 10.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Position varies part to part | Clearance, rocking, debris on pads | Reload one part 30 times; process and measure | Repeatability σ | Clamp toward pins, reduce clearance, add air blow-off | Repeatability study at module test |
| Parts jam on loading | Two round pins, no lead-in, tight clearance | Load parts from tolerance extremes | Centre distance of hard-to-load parts | Diamond pin, chamfers, correct land width | Land-width calculation |
| Clamp marks or damage | Force too high, hard contact on cosmetic face | Pressure-sensitive film under clamp | Contact pressure | Pad material, lower pressure, larger contact | Cosmetic zones in the URS |
| Clamp confirmed but part loose | Cylinder switch sees end of stroke with no part | Clamp on empty nest | Switch state vs part state | Sense part-clamped position or pressure build-up | Distinguish clamped-on-part in design |
| Vacuum lost intermittently | Warp, vias, damaged seals, filter blockage | Vacuum level logging per cycle | Vacuum vs time, per zone | Zone the plate, replace seals, add support pins | Vacuum switch per zone |

### 10.11 Design checklist

- Locators on drawing datums; 3-2-1 (rigid) or N-2-1 (flexible) applied deliberately
- Clamps point toward locators and act over supports
- Clamp force calculated with SF ≥ 2 at minimum supply pressure
- Diamond pin land width calculated for worst-case centre distance
- Part distortion under clamping checked
- Loading path, process access and cleaning access verified in 3D
- Poka-yoke prevents every foreseeable wrong loading; challenge test planned
- Seating, clamping and variant sensing specified
- Contact materials match cosmetic, ESD and electrical-isolation needs
- Repeatability study (≥ 30 reloads) defined as the module test

### 10.12 Key takeaways

- Locate, support and clamp are three different functions; design them separately.
- Six constraints for rigid parts, N-2-1 for flexible ones.
- Round pin plus diamond pin, with the land sized by calculation.
- Sense "seated and clamped on a part", not just "part present".
BOOK III
