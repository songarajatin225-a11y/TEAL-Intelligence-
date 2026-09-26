---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 66
part_title: "Case 2 — Laser welding machine (stainless sensor housings)"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Case 2 — Laser welding machine (stainless sensor housings)

A single-station, semi-automatic rotary seam welder meets a 45 s takt with a 22 s cycle; the case shows how the cycle-time calculation stops over-automation, and how chuck runout becomes the critical mechanical CTQ when the weld spot is 0.1 mm.

| Aspect | Design |
|---|---|
| Customer requirement | 1,200 hermetic stainless-steel sensor housings/day, 2 shifts; circumferential cap-to-tube seam, ×20 mm, 0.5 mm wall; leak-tight (helium test downstream); no heat damage to internal sensing element (≤ 80 °C at element); traceability per serial |
| Process | Load tube and cap → press-fit cap with force–displacement monitoring → height and gap check → argon pre-flow → rotate and weld 1.1 turns (overlap) → post-flow → vision seam check → unload → offline helium leak test |
| UPH | Takt: 2 × 7.5 h = 54,000 s / 1,200 = 45 s; CT_ideal ≤ 45 × 0.85 = 38 s |
| Machine architecture | Single station, operator loads through a sliding drawer that closes the Class 1 enclosure; fixed optic, part rotates |
| Module breakdown | Base frame; drawer with interlock; servo press (cap fit); rotary chuck with tailstock; fixed laser head with shielding nozzle; photodiode weld monitor; seam camera; fume extraction; panel; HMI; data edge |
| Mechanical architecture | Welded steel base; precision rotary axis with collet chuck (runout ≤ 10 µm); pneumatic tailstock; copper heat-sink collar around the sensor zone |
| Motion architecture | Servo rotary axis (weld speed 40 mm/s → 0.64 rev/s); servo press 2 kN with force–displacement; Z-focus manual micrometer with lock (fixed product) |
| Pneumatic architecture | Tailstock cylinder, drawer lock, argon via mass-flow controller with flow switch; dump on E-stop |
| Electrical architecture | 415 V 3-phase, ≈ 8 kVA; laser 1 kW CW single-mode fiber with water chiller (1.5 kW) |
| PLC architecture | PLC with motion; laser via fieldbus and hardware gate; press controller with curve evaluation |
| Vision | Post-weld seam camera, 360° unwrapped with part rotation: width, continuity, spatter, pinholes |
| Safety | Drawer interlock with guard locking; laser guard rated per IEC 60825-4 for a 1 kW beam; press safety via closed drawer; E-stop SS1 |
| Software | Recipe per housing type; weld only if press curve OK, gap OK, argon OK |
| MES | Serial from laser-marked code; press curve features, weld power, monitor signal features, vision verdict |
| BOM (key items) | 1 kW single-mode fiber laser, fixed weld head with camera port, chiller, servo rotary axis, collet chuck, servo press, photodiode monitor, seam camera, MFC for argon, safety PLC |
| Cost (indicative) | BOM ₹34 lakh; hours ₹14 lakh; total cost ₹52 lakh; price ₹75–80 lakh |
| Cycle time | Load 8 s + press 3 s + gap check 1 s + pre-flow 1 s + weld 1.8 s (62.8 mm × 1.1 / 40 mm/s) + post-flow 1 s + vision 2 s + unload 4 s = 21.8 s ≤ 38 s |
| Risk | Porosity and hermeticity (argon coverage, joint cleanliness); heat reaching the element (short weld, copper collar, validated by thermocouple parts); cap-fit gap > 0.05 mm (press monitoring); runout error: beam 0.1 mm spot must stay on a joint line — runout budget ≤ 30 µm total |
| FAT | 200-part run with metallographic sections on 10; 100% helium test of FAT parts; temperature-probe parts for element limit; press-curve capability; safety validation |
| SAT | Chiller and argon supply verification; 2-shift run with operators; helium yield ≥ target; MES data complete |
| Service | Protective window and nozzle spares; chuck collets; chiller PM; laser power check weekly; press calibration yearly |

Design insight. A four-station rotary table would have cut CT to about 9 s — four times faster than needed and roughly 40% more expensive. The single station with a sliding drawer meets the 38 s target with 43% margin; the extra budget went into weld monitoring and chuck precision, which is where the quality risk lies.
