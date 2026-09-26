---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 72
part_title: "Case 8 — Vision inspection machine (cylindrical cells)"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Case 8 — Vision inspection machine (cylindrical cells)

A rotating-cell inspection machine images the full cylindrical surface, both ends and the dimensions of 21700 cells at 120 cells per minute, sorting OK, NOK and "review" cells. The rate is set by rotation and exposure physics; the performance is set by lighting, a labelled defect library, and agreed false-reject and escape targets.

| Aspect | Design |
|---|---|
| Customer requirement | 120 cells/min (21700 format); detect dents, scratches, sleeve tears and wrinkles, terminal contamination, vent damage; measure length and diameter; read cell code; false-reject rate ≤ 0.5%; escape rate below customer limit on a seeded challenge set; per-cell image record for NOK cells |
| Process | Infeed from tray or conveyor → singulation by star wheel → station 1: rotate on rollers and scan the side → station 2: top and bottom ends → station 3: dimensions → decision → divert to OK, NOK or review lanes |
| UPH | 7,200 cells/h; 0.5 s per cell per station at steady state |
| Machine architecture | Indexing star-wheel carousel with three inspection stations and a roller-rotation station; three output lanes |
| Module breakdown | Infeed and singulation; star wheel with servo index; roller rotation unit; line-scan side cameras; area cameras for ends; telecentric backlight for diameter; laser displacement for length; code reader; divert gates; image-processing PC with GPU; panel; guarding |
| Mechanical architecture | Stainless contact parts with insulating inserts (no short across terminals); rollers with soft, non-marking treads |
| Motion architecture | Servo star wheel (index 0.15 s); roller drive at about 200 min⁻¹ so one revolution takes 0.3 s; encoder on the roller drive triggers line-scan acquisition |
| Pneumatic architecture | Divert gates; air knives to remove dust before imaging |
| Electrical architecture | 415 V, ≈ 6 kVA; strobe controllers; GPU PC on UPS |
| PLC architecture | PLC for motion and sorting; vision PC for acquisition and inference; per-cell results matched to star-wheel pocket index |
| Vision | Side: line-scan camera, about 3,300 lines per revolution (≈ 20 µm per line on a 66 mm circumference) at ≈ 11 kHz, with low-angle and diffuse lighting for dents and scratches; ends: area cameras with dome light; dimensions: telecentric backlight; defect classification by a deep-learning model trained on the customer's labelled images with rule-based measurements for dimensions |
| Safety | Fixed and interlocked guards; star-wheel pinch points; no energized hazard beyond cell voltage, but short-circuit prevention in tooling; thermal-event procedure for damaged cells |
| Software | Recipe per cell type; thresholds per defect class; review lane for low-confidence decisions; model version control and retraining workflow |
| MES | Per cell: code, verdict, defect class, measurements, image IDs; lot statistics |
| BOM (key items) | Line-scan camera and optics, area cameras, telecentric lens and backlight, laser displacement sensor, code reader, strobes, GPU PC, star wheel and servo, rollers, divert gates |
| Cost (indicative) | Vision hardware and computing ₹35 lakh; mechanics and motion ₹25 lakh; software and model development ₹25 lakh; price ₹1.1–1.4 crore |
| Cycle time | Per pocket: index 0.15 s + settle 0.05 s + rotation scan 0.3 s = 0.5 s; three stations in parallel pockets → 120 cells/min |
| Risk | Too few labelled defect images (start data collection at G1 with the customer); lighting sensitivity to sleeve colour variation; false rejects of cosmetic marks (defect catalogue agreed with limit samples); dust on cells (air knives) |
| FAT | Challenge set of seeded and naturally defective cells with known classes; false-reject rate on 10,000 good cells; GR&R on dimensions; run at rate |
| SAT | Correlation with the customer's manual inspection; model tuned on site data; review-lane rate trending down over ramp-up |
| Service | Lighting intensity checks; lens cleaning; model retraining service; roller tread replacement |

Design insight. Motion blur and exposure are the physical limit: at 200 min⁻¹ a 21 mm-diameter surface moves at about 0.22 m/s, so a 20 µm line needs exposure well under 90 µs — hence strobed high-intensity lighting. The contract states false-reject and escape targets against a defined challenge set and limit samples; without them, a vision machine's acceptance becomes an opinion.
