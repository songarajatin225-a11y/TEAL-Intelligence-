---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 74
part_title: "Case 10 — Complete semiconductor ATMP back-end line"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Case 10 — Complete semiconductor ATMP back-end line

A back-end line for leadframe packages — mark, singulate, clean, inspect, sort to tape — is a system of five machine types linked by carriers, buffers, strip maps and a host. The line target of 20,000 units per hour is set by the singulation saws; buffers between modules, not faster modules, lift line output from roughly 13,000 to about 22,000 units per hour. It also shows where a TEAL-type builder makes, buys and integrates.

| Aspect | Design |
|---|---|
| Customer requirement | 20,000 good units/h of QFN packages from molded leadframe strips (200 units per strip); marking, singulation, cleaning, 5-side inspection, sort by bin into tape and reel; unit-level traceability via strip maps; GEM on every tool; cleanroom back-end environment; phased capacity growth |
| Process | Molded strips in magazines → laser mark (Case 4) → mount on tape frames → singulation by dicing saw → clean and dry → unit inspection (top, bottom, sides) → pick-and-place to tape by bin (Case 9) → reels to test or packing |
| UPH | Line target 20,000 good units/h; each module sized with its own OEE and a common buffer strategy |
| Machine architecture | Five module types in sequence with magazine or frame buffers between them; a line controller tracks lots and strip maps; each tool connected to the host by GEM |
| Module breakdown | Strip marker; frame mounter; two dicing saws; cleaner and dryer; 5-side inspection machine; two tray/tape pick-and-place sorters; AGV or manual carrier transfer; line controller and host interface |
| Mechanical architecture | Each module on its own frame with standard carrier interfaces (magazines, tape frames, trays) and SEMI-style hand-off heights; service access from the front and back aisles |
| Motion architecture | Module-internal: galvo and track (marker), spindles and cutting axes (saw), stages and gantries (inspection, sorters) |
| Pneumatic architecture | Module-internal; CDA quality per module; vacuum systems on saw chucks and sorter nozzles |
| Electrical architecture | Line total ≈ 150 kVA; each tool with its own isolator; SEMI F47-style sag immunity for tools holding vacuum-chucked frames |
| PLC architecture | Tool-level controllers; line controller for dispatch, buffers and alarms; OPC UA or GEM to host |
| Vision | Pre-mark and OCV (marker), kerf and chipping check (saw), 5-side inspection (inspection tool), bottom and pocket vision (sorter) |
| Safety | Each tool with its own risk assessment and SEMI S2 evaluation; line-level: AGV and aisle safety, DI water and slurry electrical hazards at saws, laser Class 1 at the marker |
| Software | Lot management across tools; recipe consistency checks (same device recipe on every tool); strip-map continuity from mold through sorting |
| MES | Host GEM on each tool; strip maps in the E142 style carried from marker through saw to inspection and sorter so each unit's position-based identity and bin are preserved; lot genealogy to reels |
| BOM (key items) | Marker (make), frame mounter (buy or make), dicing saws (buy), cleaner (buy or make), 5-side inspection (make), sorters (make), line controller (make), carriers and AGVs (buy) |
| Cost (indicative) | Marker ₹1.0 crore; saws 2 × ₹2.5 crore; cleaner ₹0.6 crore; inspection ₹1.2 crore; sorters 2 × ₹2.0 crore; line control and integration ₹1.0 crore; total ≈ ₹12.8 crore |
| Cycle time and line balance | See table below |
| Risk | Saw capacity and blade life as the bottleneck; strip-map integrity through singulation; DI water and slurry near electrics; dust from saw affecting inspection; interface mismatches between vendors' tools |
| FAT | Per tool FAT at each vendor; line-level integration test with carriers, strip maps and host at the customer (or a staging area) |
| SAT | Line run-at-rate for 5 days; unit-level traceability audit from reel back to strip position and mold lot; OEE per tool and line |
| Service | Tool-level service contracts; line-level spares pool for common items (vacuum pumps, cameras, controllers); line performance review monthly |

Line balance

| Module | Units | Ideal UPH per unit | Line ideal UPH | OEE | Effective UPH |
|---|---|---|---|---|---|
| Laser marker | 1 | 51,400 | 51,400 | 0.85 | 43,700 |
| Dicing saw | 2 | 13,000 | 26,000 | 0.85 | 22,100 |
| Clean and dry | 1 | 30,000 | 30,000 | 0.90 | 27,000 |
| 5-side inspection | 1 | 28,000 | 28,000 | 0.88 | 24,600 |
| Pick-and-place sorter | 2 | 15,160 | 30,300 | 0.85 | 25,800 |

With generous buffers the line approaches the bottleneck's effective rate: ≈ 22,100 units/h, 10% above target. Without buffers, stops propagate: line availability approaches the product of module availabilities, roughly 0.85 × 0.85 × 0.90 × 0.88 × 0.85 = 0.49 applied to the 26,000 ideal, about 12,700 units/h — a simplification that overstates the loss, but explains why the magazine and frame buffers (≈ 20 minutes of bottleneck output between each pair of modules) are part of the line design, not an afterthought.

Design insight. For a TEAL-type builder the natural scope is to make the laser marker, inspection, sorters and line controller — laser, vision, motion and software are core — while buying saws from specialists. Laser singulation for suitable package types is the platform-extension path that would bring the bottleneck in-house.

BOOK XI
