---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 20
part_title: "Part 15 — Vacuum engineering"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 15 — Vacuum engineering

Vacuum holds parts by pressure difference, so holding force depends on sealing, surface and friction far more than on the pump. Size cups for the worst load case (usually horizontal acceleration relying on friction), check evacuation time against the cycle budget, and monitor vacuum level on every pick — an oily steel sheet needs three times the cup area of a dry one.

### 15.1 Objective

Select vacuum generation, cups or chucks, distribution and monitoring for each handling or holding task, with holding force, response time and air or energy consumption calculated.

### 15.2 Engineering concept

Atmosphere pushes the part against the cup with force F = Δp × A, where Δp is the pressure difference below atmosphere (at most about 101 kPa at sea level). Handling typically works at Δp = 40–80 kPa. The part is lost when inertial and gravity forces exceed the holding force, or when leaks make Δp collapse.

### 15.3 Architecture

Supply (compressed air or electric) → vacuum generator → filter → vacuum switch or sensor → manifold (with flow restrictors if cups may be partly uncovered) → cups, pads or chuck; release by vacuum-off plus blow-off pulse.

| Generator | Principle | Response | Energy | Best use |
|---|---|---|---|---|
| Single-stage ejector (venturi) | Compressed-air jet entrains air | Very fast, close to cup | High air use while on | Fast, decentral picking |
| Multi-stage ejector | Several nozzles in series | High suction flow at low vacuum | Better than single-stage | Porous parts, larger volumes |
| Ejector with air-saving | Supply cut when level reached; check valve holds | Fast | Low for sealed parts | Sealed parts, long hold times |
| Rotary-vane or claw pump | Mechanical displacement | Slower, central | Efficient for continuous duty | Many consumers, vacuum plates |
| Side-channel blower | High flow, low vacuum | Fast at high flow | Efficient at high flow | Porous parts, wood, cardboard, vacuum tables |
| Diaphragm pump | Oil-free mechanical | Moderate | Low | Clean applications, small flows |
| House vacuum (fab) | Central plant supply | Depends on line | Plant | Semiconductor tools in fabs |
| Bernoulli gripper | Air flow creates lift without contact | Fast | Continuous air flow | Thin, fragile wafers and cells |

### 15.4 Components

| Component | Variants | Selection points |
|---|---|---|
| Suction cup | Flat, 1.5-bellows, 2.5-bellows, oval, soft-lip, foam | Flat for rigid flat parts and high shear; bellows for height compensation and curved parts; foam for rough or uneven surfaces |
| Cup material | NBR, silicone, polyurethane, fluorinated, conductive (ESD) | Oil resistance, marking-free, silicone-free for coated parts, ESD-conductive for electronics |
| Vacuum pad / chuck | Porous ceramic, grooved metal, sintered | Wafers, thin foils, PCB processing |
| Vacuum switch / sensor | Mechanical, electronic, IO-Link with analogue value | Part-present threshold, part-lost threshold, diagnostics |
| Flow restrictor / valve per cup | Fixed orifice, self-closing valve | Keeps vacuum when some cups are uncovered |
| Filter | Inline, in-generator | Protects ejectors and valves from dust and debris |
| Release | Vacuum off, blow-off pulse | Fast, clean release; tune pulse to avoid throwing parts |

### 15.5 Design methodology

- Define the part: mass, size, surface (oily, porous, textured, coated), stiffness, temperature, cleanliness and ESD needs.
- Define the motion: accelerations in each direction and orientation of the cup relative to gravity.
- Choose the load case (15.6) and safety factor.
- Choose number and layout of cups (spread for moment stability; avoid holes and edges).
- Compute cup size, choose type and material.
- Compute system volume and evacuation time; check against cycle budget.
- Choose generator (ejector near cups for speed; pump for continuous or many consumers).
- Add monitoring thresholds and blow-off release; define reaction to part-lost.
- Validate with real parts at full acceleration, at minimum supply pressure, with contaminated surfaces.

### 15.6 Calculations

F_I=m (g+a) S

F_(II)=m(g+(a)/(μ))S

F_(III)=(m)/(μ) (g+a) S

d_(cup)=√((4 F)/(π Δp n))

t_(evac)=(V)/(Q) ln(p_0)/(p_1)

Case I = cup horizontal (on top of the part), moving vertically; case II = cup horizontal, moving horizontally (friction carries the lateral load); case III = cup on a vertical face (friction carries the weight). S = safety factor (≥ 1.5; ≥ 2 for fast, rotating or safety-relevant moves); μ = friction coefficient between cup and part (≈ 0.5 dry metal or glass, 0.1–0.2 oily, wet or smooth-coated); n = number of cups; V = evacuated volume; Q = generator suction flow; p₀, p₁ = absolute start and target pressure.

Example 1 — steel sheet, dry vs oily. 3 kg, horizontal moves at 5 m/s², 4 cups, Δp = 60 kPa, S = 2, case II.

| Surface | μ | Required force | Cup diameter (calculated) | Chosen |
|---|---|---|---|---|
| Dry | 0.5 | 3 × (9.81 + 10) × 2 = 119 N | 25 mm | 4 × ×30 mm |
| Oily | 0.1 | 3 × (9.81 + 50) × 2 = 359 N | 44 mm | 4 × ×50 mm, oil-grip profile, or reduce acceleration |

Example 2 — evacuation time. V = 0.05 L (cups and tubes), ejector Q = 20 NL/min = 0.33 NL/s, target Δp = 60 kPa (p₁ = 41.3 kPa abs): t = 0.05 / 0.33 × ln(101.3 / 41.3) = 0.14 s. Add sensor switching and valve time; budget about 0.2 s in the time chart.

Example 3 — 300 mm wafer on a robot end-effector. Mass ≈ 0.128 kg (×300 mm, 775 µm, silicon); horizontal acceleration 10 m/s²; μ ≈ 0.3; S = 2; case II → F = 0.128 × (9.81 + 33.3) × 2 = 11.0 N. At Δp = 50 kPa the pads need 220 mm² in total — three small backside pads of about 75 mm² each, placed in the wafer's backside contact zone.

### 15.7 Industrial example — vacuum selection by product

| Product | Holding solution | Δp typical | Special requirements | Main risk |
|---|---|---|---|---|
| Wafer | Backside vacuum pads on end-effector; porous ceramic chuck for processing; Bernoulli or edge grip for thin wafers | 40–70 kPa | Cleanroom materials, ESD-dissipative, minimal contact area | Particles, backside marks, breakage of thin wafers |
| Die | Pick-up tool (rubber or plastic tip, collet) with vacuum and blow-off | 60–80 kPa | Tip matched to die size, soft landing, fast vacuum rise | Die tilt, die cracks, release timing |
| PCB | ESD-conductive small bellows cups on component-free areas or rails; vacuum plate for processing | 40–60 kPa | Warp compensation, avoid components and vias | Warp leaks, component damage |
| Pouch cell | Foam or soft bellows cups on flat faces away from edges and tabs | 30–50 kPa | Low pressure to avoid deformation; no sharp edges | Puncture, dents, electrolyte-side damage |
| Prismatic / cylindrical cell | Mechanical grippers preferred; vacuum on flat can faces possible | 50–70 kPa | Insulating contact materials | Short circuits via tooling, drops |
| Glass | Soft-lip, marking-free, silicone-free cups | 50–70 kPa | No residues if coated later; anti-slip for wet glass | Slip, marks, breakage |
| Sheet metal | Oval or round NBR cups with oil-grip profile; magnetic grippers as alternative | 60–80 kPa | Oily surfaces, sharp edges | Slip on oil, cup wear |

### 15.8 Design trade-offs

| Trade-off | Ejector | Pump | Guidance |
|---|---|---|---|
| Response time | Very fast (at the cup) | Slower (long lines, central) | Ejector for fast pick-and-place |
| Energy | High air use, cut by air-saving control | Efficient in continuous duty | Pump for vacuum plates and many consumers |
| Maintenance | Almost none; nozzle can clog | Oil, vanes, filters | Ejector in dusty light-duty; pump with filtration for continuous duty |
| Noise | High without silencer | Moderate | Silencers and ducted exhaust in cleanrooms |

| Trade-off | Central vacuum | Decentral (one generator per cup group) |
|---|---|---|
| Failure mode | One leak affects all | Isolated failures |
| Monitoring | Coarse | Per cup group |
| Cost | Lower for many consumers | Higher parts count, simpler plumbing |

### 15.9 Common mistakes

- Sizing on case I (vertical lift) when the real limit is horizontal acceleration relying on friction.
- Using dry-surface friction for oily or wet parts.
- Long tubes between ejector and cups: slow build-up and slow release.
- No part-lost monitoring during the move, only at pick.
- Silicone cups on parts that will be painted, bonded or coated.
- Ejector exhaust blowing particles inside a cleanroom tool.

### 15.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Part drops during fast moves | Friction case underestimated, low supply pressure | Log vacuum level during move; slow-motion video | Vacuum dip, slip distance | Larger or more cups, anti-slip profile, lower acceleration | Size for case II with real μ |
| Vacuum level never reached | Leak (cup lip, fitting), porous part, clogged filter | Block cup with a flat plate and test | Level with and without part | Replace cup, fix fitting, clean filter, higher-flow generator | Filter maintenance, leak test |
| Slow pick or release | Long tubes, no blow-off, sticky cup | Time from valve signal to switch | Build-up and release times | Move generator near cups, add blow-off pulse | Time chart includes vacuum times |
| Marks on parts | Cup material, too high Δp | Inspect under light at several Δp | Mark visibility | Marking-free material, lower Δp, larger area | Material rules in URS |
| Ejector noisy, high air use | Continuous operation, no air-saving | Measure flow at idle | Air consumption | Air-saving control, pump | Include in air budget |

### 15.11 Design checklist

- Part surface condition, cleanliness and ESD needs defined
- Load case chosen per motion; S ≥ 1.5 (≥ 2 dynamic)
- Realistic friction coefficient used (oily, wet, coated)
- Cup layout resists moments; no cups over holes or edges
- Evacuation and release times in the cycle budget
- Part-present and part-lost thresholds, with reaction defined
- Generator placed for response; air or energy consumption in the utility budget
- Cup materials compatible with downstream processes and cleanroom class
- Validation at full acceleration, minimum pressure, contaminated surface

### 15.12 Key takeaways

- Holding force is Δp × area; losing a part is almost always a friction or leak problem.
- Horizontal acceleration relying on friction is usually the governing case.
- Put the generator next to the cups and monitor vacuum through the whole move.
- Material of the cup is a process decision, not a catalogue afterthought.
BOOK IV
