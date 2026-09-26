---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 39
part_title: "Part 31 — Machine utilities"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 31 — Machine utilities

Every utility a machine consumes or emits must be quantified, agreed with the customer's facilities team at Gate 2 and verified before the machine arrives. The utility requirement sheet is the contract between machine and site; most installation delays trace back to a missing line on it — an exhaust flow, a nitrogen purity, a cooling-water temperature.

### 31.1 Objective

Quantify all utilities (supply and emission), size connections, specify quality, and issue a utility requirement sheet that the site can prepare against.

### 31.2 Engineering concept

| Utility | Specify | Typical values for TEAL-type machines | Watch-outs |
|---|---|---|---|
| Electrical | Voltage, phases, frequency, kVA, fault level, earthing system, connection point | 415 V 3-phase 50 Hz (India); 2–60 kVA | Supply quality, voltage sags, earthing type |
| Compressed air (CDA) | Pressure range, flow (NL/min), quality class (ISO 8573-1), connection | 5–7 bar; 50–500 NL/min | Minimum pressure, oil and water near optics |
| Vacuum | Level, flow, house or internal | Internal ejectors or pumps | House vacuum stability |
| Cooling water (PCW) | Supply temperature, flow, pressure, allowed Δp, water quality, heat load | 15–25 °C; 5–60 L/min | Condensation if water is below dew point |
| Chiller (internal) | Capacity, ambient range, heat to room | 1–30 kW | Heat added to the room, space, noise |
| Exhaust | Flow (m³/h), static pressure (Pa), type (general, heat, fume, acid, solvent) | 200–2,000 m³/h | Duct routing, fire dampers, fab exhaust classes |
| Fume extraction | Internal filter unit or facility exhaust | 100–1,500 m³/h | Filter disposal, combustible dust |
| Nitrogen | Purity, pressure, flow, dew point | 99.9–99.999%; 5–50 L/min per head | Oxygen-depletion risk in enclosures |
| Process gases | Argon, helium, forming gas; purity, pressure, flow | Welding shielding, leak testing | Gas cabinets, detection, regulations |
| Network | Ports, IP plan, VLAN, remote access | 1–3 connections | Customer IT approval (Part 22) |
| Drainage | Condensate, coolant, wash water | Small volumes | Chemical content, local disposal rules |
| Environment and space | Ambient range, humidity, heat to room, noise, floor load, footprint, service area | 10–40 °C typical design range | Heat and noise added to the shop |

### 31.3 Architecture

Decide for each utility whether the machine generates it internally or takes it from the site, and where the boundary sits.

| Utility | Internal option | Site option | Boundary rule |
|---|---|---|---|
| Cooling | Internal chiller | Site PCW loop | One flange or quick-coupling per circuit, shut-off and strainer on machine side |
| Fume | Internal filter unit | Central exhaust | Duct flange with damper; machine monitors Δp or flow |
| Nitrogen | Cylinders or generator | Bulk or pipeline | Machine-side regulator, filter, flow switch |
| Vacuum | Ejectors or pump | House vacuum | Machine-side switch and filter |
| Power | — | Site distribution | Machine isolator input terminals |

### 31.4 Components

| Item | Purpose |
|---|---|
| Utility panel on machine | One labelled location for all connections |
| Isolation valves and lockable shut-offs | Maintenance isolation of each medium |
| Filters and strainers | Protect machine from site contamination |
| Regulators, flow and pressure switches | Confirm supply before auto mode (Part 18) |
| Flow meters, energy meters | Consumption monitoring for OEE and energy reporting (Part 49) |
| Gas detection | Oxygen depletion or toxic gas where the risk assessment requires |

### 31.5 Design methodology

- List every consumer and emitter per utility from the module list.
- Sum loads with diversity and simultaneity; add margins (20–25%).
- Specify quality (air class, water quality, gas purity).
- Choose internal vs site supply per utility and define the boundary.
- Size connections, lines and machine-side conditioning.
- Compute heat to room and noise; share with the site's HVAC and EHS teams.
- Issue the utility requirement sheet at Gate 2; get site sign-off.
- Verify utilities at site readiness (Gate 9) before the machine is unpacked.

### 31.6 Calculations

V_(PCW)=(Q)/(ρ c_p ΔT)

Q_(room)=P_(el,total)−Q_(water)−Q_(exhaust)

D_(duct)=√((4 V)/(π v_(duct)))

Examples: 5.5 kW to cooling water with ΔT = 5 K → 5,500 / (1,000 × 4,186 × 5) = 2.6 × 10⁻⁴ m³/s = 15.8 L/min. Exhaust of 600 m³/h at 12 m/s duct velocity → D = √(4 × 0.167 / (π × 12)) = 0.133 m → 140 mm duct. A machine drawing 25 kW with 5.5 kW to water and 3 kW to exhaust puts about 16.5 kW of heat into the room — a real HVAC load.

### 31.7 Industrial example — utility requirement sheet (busbar welding cell)

| Utility | Requirement | Connection | Quality / conditions | Notes |
|---|---|---|---|---|
| Electrical | 415 V ±10%, 3-phase + PE, 50 Hz; 32 kVA max demand | Main isolator input, cable entry from top | TN-S earthing; prospective fault current ≤ 25 kA at connection | Customer to state fault level |
| CDA | 6 bar (min 5 bar), 250 NL/min average, 400 NL/min peak | G1/2 female, lockable ball valve on machine | ISO 8573-1 class suitable for pneumatics; optics branch filtered on machine | Air-knife branch oil-free, dry |
| Cooling water (for laser chiller condenser) | 20–25 °C, 20 L/min, Δp ≤ 1.5 bar | 2 × G3/4 | Filtered to 100 µm, no dew-point condensation | Alternative: air-cooled chiller adds 7 kW to room |
| Argon (shielding gas) | 99.996%, 4 bar, 20 L/min per head | 6 mm tube fitting | Dry, oil-free | Cylinder bank or pipeline |
| Exhaust | 1,200 m³/h at 800 Pa available static pressure | 200 mm flange with damper | General exhaust to outside after internal filtration | Fume unit on machine; spark arrestor |
| Network | 2 × RJ45 (MES VLAN, service) | Machine gateway | Fixed IP from customer IT | Remote access via customer gateway |
| Environment | 15–40 °C, RH ≤ 80% non-condensing | — | Floor flatness and load 1,500 kg/m² | Heat to room ≈ 12 kW |
| Space | 4.2 × 3.0 m footprint plus 1 m service on three sides; 2.6 m height | — | Access route 1.5 m door | Two shipping splits |

### 31.8 Design trade-offs

| Trade-off | Internal | Site | Guidance |
|---|---|---|---|
| Chiller vs site PCW | Self-contained, independent | Less heat and noise in the room, lower machine cost | Site PCW where available and stable; internal chiller otherwise |
| Fume unit vs central exhaust | Independent, filtered at source | Less maintenance on machine | Internal unit plus exhaust of filtered air for most laser machines |
| Nitrogen cylinders vs generator vs bulk | Low capex | Low running cost, space | Decide by consumption; generator above moderate continuous use |

### 31.9 Common mistakes

- Utility sheet issued after FAT.
- Air flow given as average only; peaks stall the machine.
- Chilled water below the room's dew point, causing condensation inside the machine.
- Heat to room ignored; the shop overheats and the panel cooling unit struggles.
- Oxygen-depletion hazard from nitrogen purges inside enclosures not assessed.

### 31.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Machine stops on low air at peaks | Site supply or line undersized | Log pressure at machine inlet | Minimum pressure | Local receiver, larger line | Peak flow on sheet |
| Laser chiller alarms in summer | Site water too warm or low flow | Measure supply temperature and flow | °C, L/min | Correct site supply, larger chiller | Worst-case conditions on sheet |
| Condensation on optics or panels | Water below dew point | Measure dew point and water temperature | Dew-point margin | Raise water temperature, insulate | Dew-point rule on sheet |
| Fume escapes at nozzle | Exhaust static pressure too low | Measure flow at nozzle | Capture velocity | Rebalance, larger fan | Static pressure on sheet |

### 31.11 Design checklist

- Every consumer and emitter listed per utility
- Average and peak values with margins
- Quality specified (air class, water quality, gas purity)
- Internal vs site supply decided; boundary and connections defined
- Heat to room, noise and floor load given
- Utility requirement sheet signed by the customer's facilities team at Gate 2
- Site verification scheduled before delivery

### 31.12 Key takeaways

- The utility requirement sheet is a contract; issue it at Gate 2.
- Specify peaks, quality and boundaries, not just averages.
- Heat to room and exhaust static pressure are the most-forgotten lines.
- Verify the site before the machine ships.
BOOK VII
