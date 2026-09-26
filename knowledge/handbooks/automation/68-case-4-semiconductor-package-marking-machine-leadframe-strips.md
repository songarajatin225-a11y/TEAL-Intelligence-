---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 68
part_title: "Case 4 — Semiconductor package marking machine (leadframe strips)"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Case 4 — Semiconductor package marking machine (leadframe strips)

A magazine-to-magazine strip marker with pre-mark vision, one laser head and line-scan OCV delivers about 43,700 units per hour at 85% OEE. The calculation shows a second head is not needed; the engineering effort goes into strip handling without damage, substrate maps, fume control and GEM.

| Aspect | Design |
|---|---|
| Customer requirement | Mark mold-compound packages on leadframe strips (250 × 70 mm, 200 units per strip): device code, lot, date code (character height 0.4 mm) plus a small 2D code per unit where specified; ≥ 40,000 units/h; skip units flagged bad upstream; OCV of every unit; SEMI S2; GEM; ESD control; low particles |
| Process | Magazine load → strip push-out to track → strip ID read and orientation check → fetch strip map (bad units) from host → mark good units → OCV per unit → update map (mark-fail units) → push into output magazine |
| UPH | 40,000 units/h → 200 strips/h → 18 s per strip at 100%; with 85% OEE the machine needs CT ≤ 15.3 s per strip |
| Machine architecture | Linear three-station track: pre-vision, mark, OCV; magazine elevators at both ends; strip indexed by grippers |
| Module breakdown | Input and output magazine elevators; pusher; indexing track with vacuum hold-down; pre-mark camera; laser module with fume hood; line-scan OCV; reject-map handling; panel; EFEM-free (strips, not wafers); GEM software |
| Mechanical architecture | Precision track with width adjustment by recipe; vacuum hold-down against strip warp; covers and local exhaust; ESD-dissipative contact surfaces |
| Motion architecture | Magazine elevators (servo Z), strip gripper indexing (servo X, ±50 µm), galvo marking in a 100 × 100 mm field (two fields per strip via track index) |
| Pneumatic architecture | Pushers, grippers, vacuum hold-down zones by ejectors |
| Electrical architecture | 415 V, ≈ 5 kVA; laser air-cooled; panel with filtration suited to the cleanroom class |
| PLC architecture | PLC for handling; scanner card for marking; vision PC for pre-vision and OCV; GEM layer on the equipment PC |
| Vision | Pre-mark area camera: strip ID, orientation, unit presence; post-mark line-scan: OCV of each unit (character quality, position, content) |
| Safety | Class 1 laser enclosure with interlocked covers; pinch points at elevators guarded; SEMI S2 evaluation |
| Software | Recipes per device (text, font, position, parameters); strip-map logic; lot start and end; OCV thresholds per device |
| MES / host | SEMI E30 GEM over HSMS: recipe download, lot and strip events, alarms; substrate (strip) map exchange in the E142 style so units rejected upstream are not marked |
| BOM (key items) | 20–30 W fiber or green laser (chosen by mark contrast trials on the customer's mold compound), galvo, F-theta 160 mm, two magazine elevators, track, area camera, line-scan camera and illumination, fume extractor with HEPA and carbon, GEM software |
| Cost (indicative) | Total cost ₹65 lakh; price ₹95–110 lakh including GEM and SEMI S2 evaluation |
| Cycle time | Per strip with one head: marking 200 units × 0.06 s = 12 s + field change 0.5 s + index 1.5 s = 14 s (pre-vision and OCV run in parallel stations) → 257 strips/h → 51,400 units/h ideal → 43,700 at 85% OEE |
| Risk | Mold-compound batch variation changing contrast (parameter window across batches); strip warp (vacuum zones, focus depth); dust on units (extraction at the mark point, no ablation debris on leads); OCV false rejects (golden devices per recipe) |
| FAT | 3 device types; 500 strips; OCV false-reject and escape rates using seeded defects; GEM compliance test with host simulator; particle check on units; SEMI S2 report |
| SAT | Host connection; production lots across mold-compound batches; OEE over 3 days; operator and technician training |
| Service | Lens and window cleaning; extraction filters by Δp; track wear parts; OCV golden-sample check per shift |

Design insight. A second laser head would lift ideal throughput to about 90,000 units/h, far above demand; the marking field and strip index were instead laid out so that a second head can be added later without redesign.
