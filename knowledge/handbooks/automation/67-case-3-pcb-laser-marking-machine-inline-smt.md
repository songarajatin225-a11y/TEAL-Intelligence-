---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 67
part_title: "Case 3 — PCB laser marking machine (inline SMT)"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Case 3 — PCB laser marking machine (inline SMT)

An inline marker adds a 2D code to every board of a panel at the start of an SMT line, synchronized with line beat through standard board-handover signals. The design turns on three choices: wavelength for the solder mask, a step-and-mark gantry because panels exceed the scan field, and fiducial vision because panels are never where the conveyor puts them.

| Aspect | Design |
|---|---|
| Customer requirement | Mark Data Matrix (10 × 10 to 14 × 14, ≥ 0.15 mm modules) on each board of panels up to 460 × 510 mm; 12 boards per panel typical; SMT line beat 30 s per panel; no damage to copper or components; code grade ≥ B; ESD-safe; MES link to line software |
| Process | Panel arrives on SMEMA/Hermes handshake → stop and clamp → read panel ID or assign serials → fiducial vision → mark each board's code → read and grade each code → release downstream |
| UPH | 120 panels/h line beat (30 s); machine CT target ≤ 25 s |
| Machine architecture | Inline conveyor with width adjustment and clamp; XY gantry carrying a compact galvo head and a code-reading camera; step-and-mark across the panel |
| Module breakdown | Conveyor with stoppers and edge clamps; bottom-support pins; XY gantry; galvo marking head; fiducial and verification camera; fume extraction hood; panel; enclosure with interlocked covers; line interface |
| Mechanical architecture | Steel frame; conveyor rails with motorized width adjust (50–460 mm); gantry on machined bridge; all board-contact parts ESD-dissipative |
| Motion architecture | X and Y servo axes (±20 µm repeatability), conveyor motor, width-adjust axis; galvo inside each 110 × 110 mm field |
| Pneumatic architecture | Board stopper, edge clamps, support-pin lift |
| Electrical architecture | 230/415 V, ≈ 3 kVA; compact panel within machine footprint |
| PLC architecture | PLC for conveyor and handshake, scanner card for marking, vision PC for fiducials and grading |
| Vision | One camera on the gantry: fiducials (panel offset and rotation), then code verification with grading per board |
| Safety | Class 1 enclosure with interlocked covers; conveyor entry and exit tunnels sized to prevent reach to the beam; E-stop linked to line |
| Software | Recipe per product: board positions, code content rules, marking parameters; bad-board marks honoured |
| MES | Line-level standards: IPC-HERMES-9852 for board handover and IPC-2591 (CFX) for machine data where the line uses them; serial generation from MES; per-board records |
| BOM (key items) | UV 355 nm (fine codes on light masks) or CO₂ (larger codes on green masks) source; galvo; F-theta 100 mm; XY gantry; conveyor; camera and lighting; fume extractor with HEPA and carbon |
| Cost (indicative) | BOM ₹28 lakh (UV source dominates); total cost ₹41 lakh; price ₹60–65 lakh |
| Cycle time | Conveyor in and clamp 4 s + fiducials 2 s + 4 fields × (gantry step 0.4 s + 3 codes × 0.4 s) = 6.4 s + grading 12 × 0.2 s = 2.4 s + release 3 s = 17.8 s ≤ 25 s |
| Risk | Copper exposure through thin mask (wavelength and fluence window from trials on the customer's mask colours); panel warp shifting focus (support pins, depth-of-focus check); debris on boards (extraction at source); code grade on dark masks |
| FAT | 50 panels of three products; grade distribution per mask colour; cross-sections for copper damage; handshake test with a line simulator; ESD audit |
| SAT | Integration with upstream loader and downstream printer; 2-shift run at beat; MES/CFX data verification |
| Service | Fume filter replacement by Δp; lens cleaning; UV source service interval per vendor; conveyor belts |

Design insight. Marking at the start of the line gives every later process a traceable board, but it also makes the marker a line-stopper. Its CT target was set at 83% of line beat, and a bypass mode (pass-through with serials assigned later) was designed so a marker fault never stops the SMT line.
