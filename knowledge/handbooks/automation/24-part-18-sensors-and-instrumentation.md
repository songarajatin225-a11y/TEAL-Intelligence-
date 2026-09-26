---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 24
part_title: "Part 18 — Sensors and instrumentation"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 18 — Sensors and instrumentation

A sensor must tell the controller the truth fast enough and must fail in a way the controller can see. Choose each sensor from the physical property you need to detect, the target material and speed, and the failure you must catch; then check response time against target speed and PLC scan — a 5 mm flag at 1 m/s is visible for only 5 ms.

### 18.1 Objective

Select, wire and configure sensors so every machine state the software relies on is detected reliably, in time, with detectable failure.

### 18.2 Engineering concept

| Output type | Meaning | Use |
|---|---|---|
| Discrete PNP (sourcing) | Switches +24 V to the input | Standard in Europe and India |
| Discrete NPN (sinking) | Switches 0 V | Common in Japanese and some Asian equipment; do not mix without planning |
| NO / NC | Output on when target present / absent | Choose so that a broken wire looks like the unsafe or "not confirmed" state |
| Analogue 4–20 mA | Current proportional to value; 0 mA = wire break | Long runs, noisy environments, broken-wire detection |
| Analogue 0–10 V | Voltage proportional to value | Short runs inside panels |
| IO-Link | Point-to-point digital link over standard 3-wire cable | Parameters, measured values, diagnostics, identification, device replacement with auto-parameterization |
| Fieldbus / Ethernet | Sensor on the network | Vision systems, complex sensors |

### 18.3 Architecture — ten sensor families: principle, selection, applications

| Family | Working principle | Selection criteria | Application examples |
|---|---|---|---|
| Inductive proximity | Eddy-current damping of an oscillator by metal | Target metal (correction factor), sensing distance, flush or non-flush, switching frequency | Cylinder end positions (via targets), home flags, pallet presence |
| Capacitive proximity | Change in capacitance by a dielectric target | Target dielectric, background, adjustability | Level in plastic tanks, non-metal part presence |
| Photoelectric | Light beam interrupted or reflected | Mode (through-beam, retro-reflective, diffuse, background suppression), range, excess gain, spot size | Part presence on conveyors, stack height, transparent object detection |
| Laser displacement | Triangulation or confocal distance measurement | Range, resolution, spot size, surface (shiny, dark, transparent), sampling rate | Height scan before welding, focus control, warp measurement |
| Pressure | Strain-gauge or piezoresistive diaphragm | Range, gauge or absolute, media, accuracy, switching points | Supply pressure, vacuum level, clamp confirmation, leak test |
| Temperature | RTD (Pt100/Pt1000), thermocouple, thermistor, infrared | Range, accuracy, response, contact or non-contact | Chiller water, panel, bearing, part temperature |
| Flow | Thermal mass, vortex, magnetic, paddle | Media, range, pressure drop, accuracy | Cooling water to laser, shielding gas, CDA consumption |
| Force | Strain-gauge load cell, piezo sensor | Range, overload, accuracy, dynamic response | Press-fit monitoring, clamp force, pull test |
| Position | LVDT, magnetostrictive, potentiometer, linear scale | Range, resolution, linearity, environment | Gauge probes, cylinder position, part height |
| Rotary encoder and vision | Optical or magnetic counts; camera image processing | Resolution, speed, interface; field of view, resolution, lighting (Part 24) | Conveyor tracking, axis feedback; code reading, alignment, inspection |

### 18.4 Components — wiring, output and failure modes

| Family | Typical wiring | Typical output | Dominant failure modes | How to detect the failure |
|---|---|---|---|---|
| Inductive / capacitive | 3-wire DC (brown +, blue 0 V, black output); 2-wire variants | PNP/NPN NO or NC; IO-Link | Mechanical damage, mis-set distance, weld-spatter build-up | Plausibility (both end sensors on = fault), IO-Link diagnostics |
| Photoelectric | 3- or 4-wire; separate emitter and receiver for through-beam | PNP/NPN, light-on/dark-on; IO-Link with signal level | Dirty lens, misalignment, ambient light | Excess-gain monitoring, test input on emitter |
| Laser displacement | 4–8 wire or Ethernet | Analogue, IO-Link, Ethernet | Surface-dependent errors, dirty window | Plausibility against expected range, reference target check |
| Pressure | 3-wire, M12 | Switch outputs plus analogue or IO-Link | Diaphragm damage, drift | Compare with a reference gauge at PM |
| Temperature | 2-, 3- or 4-wire RTD; thermocouple with compensating cable | Raw to input card or transmitter 4–20 mA | Open circuit, wrong compensation cable | Open-circuit detection on the input card |
| Flow | 3-wire or analogue | Switch, frequency, analogue | Fouling, air bubbles | Cross-check with temperature rise |
| Force | 4- or 6-wire bridge to amplifier | mV/V into amplifier, then analogue or fieldbus | Overload, cable damage, zero drift | Zero check at each cycle start |
| Position | Transformer-coupled (LVDT) or digital | Analogue, SSI, IO-Link | Mechanical wear, mis-mounting | Reference check against master |
| Encoder | Shielded twisted pairs, differential | TTL/HTL, sin/cos, serial absolute | Noise, counting errors, cable damage | Differential signal monitoring, drive diagnostics |
| Vision | Ethernet, trigger and I/O | Result data, images | Lighting change, lens fouling, calibration drift | Golden-sample check each shift |

### 18.5 Design methodology

- For every state the software needs, write the question the sensor answers ("is a part seated on datum A?").
- Choose the family from the physical property and target material.
- Check response time and switching frequency against target speed and PLC scan.
- Choose output and logic (PNP/NPN, NO/NC, IO-Link) so wire breaks and power loss show as "not confirmed".
- Place the sensor for robust mechanical protection and easy adjustment.
- Add plausibility checks in software (both end positions active is impossible).
- Enter every sensor in the sensor list with tag, type, part number, setting and I/O address.

### 18.6 Calculations

t_(visible)=(L_(target))/(v)≥t_(sensor)+t_(input filter)+2 t_(scan)

S_a≤0.81 S_n⋅k_(material)

x=x_(min)+(I−4 mA)/(16 mA) (x_(max)−x_(min))

U_(out)=S_(mV/V)⋅U_(exc)⋅(F)/(F_(nom))

t_visible = time the target is in view; S_n = nominal switching distance (mild steel); S_a = assured operating distance; k_material ≈ 1.0 mild steel, 0.6–0.8 stainless, 0.3–0.5 aluminium and brass, 0.25–0.4 copper (check the datasheet; "factor-1" sensors are near 1.0 for all metals); S_mV/V = load-cell sensitivity; U_exc = excitation voltage.

Examples: a 5 mm flag at 1 m/s is visible for 5 ms; with a 1 ms sensor, 3 ms input filter and 10 ms PLC scan it will often be missed — use a high-speed input, a hardware latch, or a longer flag (30 mm gives 30 ms). An 8 mm inductive sensor detecting aluminium at k = 0.4 is reliable only to 0.81 × 8 × 0.4 = 2.6 mm. A 2 mV/V load cell at 10 V excitation gives 20 mV at full scale — amplify it close to the cell and shield the cable.

### 18.7 Industrial example — sensor list extract for the laser marking shuttle

| Tag | Question answered | Type | Output / logic | Why this choice |
|---|---|---|---|---|
| B101 | Is a part seated on datum A in nest 1? | Inductive, flush M8, under the part | PNP NO, IO-Link | Detects metal part only when fully down on the pads |
| B102 | Is clamp 1 closed on a part (not on nothing)? | Magnetic cylinder switch at "clamped-on-part" position | PNP NO | Distinguishes part clamped from empty stroke |
| B103 | Is the shuttle at the laser position? | Servo in-position flag (no separate sensor) | Fieldbus status | Encoder already knows; avoids duplicate hardware |
| B110 | Is the part height within the recipe window? | Laser triangulation sensor | IO-Link value | Feeds Z-focus correction and the height-to-position stack (Part 9) |
| B120 | Is fume extraction running and filters not blocked? | Differential pressure sensor | Analogue 4–20 mA | Detects both fan failure and filter clogging |
| B130 | Is the reject bin full? | Diffuse photoelectric with background suppression | PNP NO | Ignores bin wall behind parts |
| B140 | Is supply air above 4.2 bar? | Pressure sensor with switch output | PNP NC logic (signal present = OK) | Wire break reads as "not OK" |

### 18.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Inductive vs photoelectric | Robust, short range, metal only | Long range, any material, sensitive to dirt | Inductive whenever the target is metal and close |
| Discrete vs IO-Link | Cheapest, universal | Values, diagnostics, auto-parameterization on replacement | IO-Link for sensors with settings or diagnostics value |
| 4–20 mA vs 0–10 V | Wire-break detection, noise-robust | Simple, short runs | 4–20 mA outside the panel |
| Sensor vs vision | Fast, cheap, deterministic, one feature | Many features, variants, measurement | Sensor for a single binary state; vision when position varies or several features matter |
| Dedicated sensor vs derived signal (servo in-position, drive torque) | Independent confirmation | No extra hardware | Derived when the source is reliable and diagnosable; independent for safety or quality-critical states |

### 18.9 Common mistakes

- Sensing "part present" when the process needs "part seated".
- Mixing PNP and NPN devices on one input card.
- Missing short targets at speed because of PLC scan and input filters.
- Standard sensor on stainless or aluminium without the correction factor.
- Diffuse photoelectric sensors seeing the background.
- NO logic on a supervisory signal, so a broken wire looks like "OK".

### 18.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Intermittent "part missing" | Target at edge of range, vibration, chattering | Watch sensor LED and input over many cycles | Switching margin (IO-Link signal level) | Reposition, increase margin, add debounce | Margin check in commissioning |
| Signal never arrives at PLC | Wiring, PNP/NPN mismatch, blown channel fuse | Measure at sensor and at terminal | Voltage at each point | Rewire, correct type, replace channel | Sensor list defines output type |
| Missed events at speed | Response and scan too slow | Log with high-speed input or latch | Pulse width vs scan | High-speed input, longer target, hardware latch | Response calculation |
| Analogue value noisy | Unshielded cable, ground loop, voltage signal over long run | Scope at input; disconnect shield ends one at a time | Noise amplitude | Shield, switch to 4–20 mA, local amplifier | Analogue wiring rules |
| Photoelectric false triggers | Dirty lens, ambient light, reflective background | Check signal margin, shade test | Excess gain | Clean, background suppression, polarized retro-reflective | Excess gain ≥ 10× in dirty areas |

### 18.11 Design checklist

- Each sensor answers a written question the software needs
- Family matched to target material, range and environment
- Response time checked against target speed and scan
- Logic chosen so wire break reads as "not confirmed"
- Plausibility checks defined in software
- Mechanical protection and adjustment access designed
- Sensor list complete: tag, type, part number, setting, I/O address, spare part
- IO-Link parameters stored for automatic replacement where used

### 18.12 Key takeaways

- Sense the state the process needs, not a proxy for it.
- Check visibility time against response and scan at full speed.
- Design every signal so that failure looks like "not OK".
- IO-Link turns a sensor from a switch into a diagnosable instrument.
