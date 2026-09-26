---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 22
part_title: "Part 16 — Electrical engineering"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 16 — Electrical engineering

The electrical system must isolate, protect, distribute, convert and earth — in that order of priority. Build every machine from a load list, give every branch its own protection, keep the safety 24 V separate from the standard 24 V, and verify protective bonding and insulation before the first power-up.

### 16.1 Objective

Define the electrical architecture, size supply, cables and protection from a load list, design the 24 V DC system and earthing, and prepare the verification tests required before energizing.

### 16.2 Engineering concept

| Function | What it does | Typical devices |
|---|---|---|
| Isolate | Separate the machine from supply for safe maintenance | Lockable main disconnect |
| Protect | Clear overloads and short circuits; protect people from indirect contact | MCCB, MCB, MPCB, fuses, RCD where applicable |
| Distribute | Deliver power to each consumer group | Busbars, distribution blocks, cables |
| Convert | Provide DC and variable-frequency supplies | SMPS, drives, VFDs, transformers |
| Control | Switch loads | Contactors, relays, solid-state relays, drive enables |
| Earth and bond | Keep exposed metal at earth potential; control EMC | PE bar, bonding straps, shielding |

The governing standard for machine electrical equipment is IEC 60204-1; panel assemblies follow IEC 61439; North American machines follow NFPA 79 and UL 508A. Book XI lists the editions checked for this handbook.

### 16.3 Architecture

*Figure 7. Electrical architecture · supply chain, 6 protected branches, PE bar* — [Figure not transcribed; see source document]

Each branch has its own protection so a fault in one consumer group trips only that group; the safety 24 V branch is separate so a short on a standard sensor cannot collapse the safety circuit.

### 16.4 Components

| Device | Function | Specification points | Selection guidance |
|---|---|---|---|
| Main isolator | Supply disconnect | Rated current, utilization category, lockable in OFF | Handle outside the panel, interlocked with door where required |
| MCCB | Main or large-branch protection | Rated current, adjustable trip, breaking capacity (kA) | Breaking capacity ≥ prospective fault current at the panel |
| MCB | Branch protection | Rating, curve B/C/D, breaking capacity | B resistive, C general and SMPS, D high inrush (transformers) |
| MPCB | Motor overload and short-circuit protection | Setting range covering motor full-load current | One per direct-on-line motor |
| Fuses (gG, aR) | Short-circuit protection | Class, rating | aR (semiconductor) fuses where the drive maker requires them |
| RCD / RCBO | Earth-leakage protection for people | Sensitivity, type (A, F, B) | Service sockets; drives need types that tolerate DC and HF leakage (often type B) |
| Contactor | Switch power loads | AC-3 rating, coil voltage, auxiliary contacts | Safety contactors with mirror contacts for safety functions |
| Relays | Interface and isolation | Contact rating, coil voltage | Interface relays for high-current or foreign-voltage loads |
| SMPS | 24 V DC supply | Current, efficiency, hold-up time, overload behaviour | 25–30% margin; separate supplies for safety and standard |
| Electronic circuit breakers (24 V) | Selective DC branch protection | Channels, trip current, diagnostics | One channel per 24 V group, so one short does not stop everything |
| Terminal blocks | Connection points | Spring or screw, cross-section, jumpers | Spring clamps for vibration and speed of wiring |
| Surge protection | Clamp supply transients | Type 2 at the panel incomer | Recommended where supply quality is poor |
| Line reactors and EMC filters | Reduce harmonics and conducted emissions | Rating, leakage current | As required by drive maker and EMC assessment |

### 16.5 Design methodology

- Collect the utility data: voltage, frequency, earthing system (TN-S, TN-C-S, TT), prospective fault current, supply quality.
- Build the load list: every consumer with rated power, current, phase, duty and diversity.
- Size the incoming cable, main protection and main isolator.
- Define branches and size their protection for selectivity.
- Build the 24 V budget and split into standard and safety supplies.
- Design protective bonding and functional earthing (EMC).
- Draw schematics with consistent reference designations (IEC 81346 style) and wire numbers.
- Prepare verification: protective bonding continuity, insulation resistance, voltage tests where required, residual voltage, and functional tests (IEC 60204-1 verification clause).

### 16.6 Calculations

I_(3ϕ)=(P)/(√(3) V_(LL) cosφ η)

I_(1ϕ)=(P)/(V_(LN)cosφ η)

S_(demand)=∑S_i⋅k_(d,i)

I_b≤I_n≤I_z⋅k_(temp)⋅k_(group)

ΔV_(3ϕ)=(√(3) I L ρ)/(A)

ΔV_(DC)=(2 I L ρ)/(A)

Z_s⋅I_a≤U_0

I_(SMPS)≥1.25∑I_(24V,i) k_i

I_b = design current; I_n = protective device rating; I_z = cable current capacity; k = derating factors for ambient temperature and grouping; ρ = resistivity of copper ≈ 0.0175 Ω·mm²/m at 20 °C (≈ 0.0225 at operating temperature); Z_s = earth-fault loop impedance; I_a = current that trips the device within the required time; U_0 = line-to-earth voltage.

### 16.7 Industrial example — load list of the laser marking cell

| Consumer | Supply | Rated input (kVA) | Diversity | Demand (kVA) |
|---|---|---|---|---|
| Servo drive, shuttle 750 W | 3-phase | 0.90 | 0.6 | 0.54 |
| Servo drive, Z 400 W | 1-phase | 0.50 | 0.4 | 0.20 |
| VFD, conveyor 0.37 kW | 3-phase | 0.50 | 1.0 | 0.50 |
| Fiber laser 50 W (air-cooled) | 1-phase | 0.40 | 1.0 | 0.40 |
| Fume extractor 1.1 kW | 3-phase | 1.40 | 1.0 | 1.40 |
| Panel cooling unit | 1-phase | 0.35 | 1.0 | 0.35 |
| 24 V SMPS, standard (20 A) | 1-phase | 0.55 | 0.8 | 0.44 |
| 24 V SMPS, safety (5 A) | 1-phase | 0.14 | 1.0 | 0.14 |
| Industrial PC and HMI | 1-phase | 0.15 | 1.0 | 0.15 |
| Service socket | 1-phase | 1.00 | 0.2 | 0.20 |
| Total |  | 5.89 |  | 4.32 |

- Incoming current: 4.32 kVA / (√3 × 415 V) = 6.0 A; single-phase loads are spread across phases to keep imbalance low.
- Main protection 16 A, breaking capacity at least the site's prospective fault current (asked at G0).
- Incoming cable 4 mm² Cu over 30 m: ΔV = √3 × 16 × 30 × 0.0225 / 4 = 4.7 V = 1.1% at full breaker rating.
- Earth-fault check for a C16 branch MCB (magnetic trip at 10 × I_n = 160 A): Z_s ≤ 230 / 160 = 1.44 Ω.
24 V budget (standard supply)

| Load | Current (A) |
|---|---|
| PLC CPU and I/O modules | 2.0 |
| 40 sensors × 40 mA | 1.6 |
| IO-Link valve terminal, 16 coils | 2.0 |
| Camera and light | 1.5 |
| HMI panel | 1.0 |
| Z-axis motor brake | 0.6 |
| Stack light, buzzer, misc. | 0.8 |
| Sum | 9.5 |
| × 1.25 margin | 11.9 → 20 A supply chosen for inrush and future I/O |

Voltage drop to a sensor 20 m away drawing 1 A through 0.5 mm²: 2 × 1 × 20 × 0.0175 / 0.5 = 1.4 V (5.8%) — acceptable for most 24 V devices, but group heavy loads on thicker cable or local distribution.

India-specific supply notes. Plants often see voltage swings of ±10% or more, harmonics from neighbouring drives, and dips during grid-to-generator changeover. Specify surge protection at the incomer, confirm drive and laser input tolerance, put the industrial PC on a small UPS, and consider an isolation transformer or stabilizer for sensitive laser sources after measuring the site supply.

### 16.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Fuses vs circuit breakers | High breaking capacity, current-limiting, cheap | Resettable, adjustable, visible trip | Breakers for branches; fuses where drive makers require aR |
| One large SMPS vs several | Fewer parts | Selectivity, no single point of failure | Separate safety and standard supplies at minimum |
| Spring vs screw terminals | Vibration-proof, fast | Familiar, accepts bigger conductors | Spring clamps as default |
| Central panel vs distributed IP65 drives and I/O | All in one cabinet | Shorter cables, smaller panel, easier modular machines | Distributed for modular platforms and large machines |
| RCD on drive branches | Protects against leakage faults | Nuisance trips from drive leakage | Follow drive maker; type B where RCD is required |

### 16.9 Common mistakes

- No load list, so the incoming breaker is chosen by habit.
- One 24 V supply for safety and standard devices.
- Ignoring prospective fault current; breakers with too low a breaking capacity.
- Drives with filters on a standard RCD, tripping every morning.
- Laser source on the same branch as the fume extractor start-up inrush.
- Unmarked wires and missing wire numbers that make every later fault a hunt.

### 16.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Main breaker trips at start-up | Inrush of SMPS, transformers, drives | Clamp meter with inrush capture | Peak inrush current | Staggered start, inrush limiters, D-curve where justified | Inrush in load list |
| RCD nuisance trips | Drive leakage currents | Leakage clamp on drive branch | Leakage (mA) | Correct RCD type, per-branch RCDs, filter choice | Drive leakage data at design |
| Random PLC resets | 24 V dips from valve or brake surges, undersized SMPS | Scope on 24 V during cycle | Minimum voltage | Larger SMPS, separate supplies, ECB channels | 24 V budget with peaks |
| Sensor faults on long runs | Voltage drop, noise pickup | Measure voltage at sensor | Voltage under load | Thicker cable, local supply, shielding | ΔV calculation |
| Tingle from machine frame | Broken PE, missing bond | Continuity test of protective bonding | Resistance to PE bar | Restore bond | PE continuity test at FAT |

### 16.11 Design checklist

- Site utility data captured: voltage, frequency, earthing system, fault level, supply quality
- Load list with diversity; incoming current and cable sized
- Breaking capacity of every device ≥ prospective fault current
- Branch protection selective; single-phase loads balanced
- 24 V budget with margin; safety and standard supplies separate; ECB channels
- Earth-fault loop impedance and disconnection checked
- Protective bonding to every exposed conductive part; EMC bonding plan
- Schematic reference designations and wire numbers consistent
- Verification tests (bonding continuity, insulation resistance, functional) planned

### 16.12 Key takeaways

- Start from a load list and the site's fault level; everything else follows.
- Protect each branch separately; separate safety 24 V from standard 24 V.
- Size 24 V supplies for peaks and future I/O, not the average.
- Verify bonding and insulation before first power-up.
