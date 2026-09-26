---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 10
part_title: "Parts XVI–XVIII — Packaging, ATMP and dicing"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts XVI–XVIII — Packaging, ATMP and dicing

L1 summary. Packaging turns a fragile bare die into a component that can be soldered to a board: it protects the die, connects its µm-scale pads to mm-scale board pads, removes heat, and — increasingly — connects multiple dies into one system. ATMP (assembly, test, marking, packaging) is the Indian policy term; OSAT (outsourced semiconductor assembly and test) is the global term for companies doing it as a service. With advanced packaging, the back-end has become a leading-edge technology race.

## Chapter 22 — Traditional packaging

| Step | Purpose | Notes |
|---|---|---|
| Die attach | Bond die to lead frame paddle or substrate | Epoxy (Ag-filled), DAF film, solder, Ag sinter (power) |
| Wire bonding | Connect die pads to leads | Au, Cu (dominant by volume), Pd-coated Cu, Ag, Al (power) wires, ~15–50 µm (up to 500 µm Al for power); ball-wedge thermosonic bonding |
| Moulding | Encapsulate in epoxy mould compound | Transfer moulding (lead frames) or compression moulding (large panels, WLP) |
| Lead frame | Cu-alloy metal frame giving pins and heat path | Stamped or etched; plated (Ag, NiPdAu) |
| Singulation | Separate packages | Trim-and-form for leaded; saw singulation for QFN/BGA |
| Marking | Part number, date/lot code, logo | Laser marking (fibre or DPSS/green; CO₂ historically on mould compound) |
| Final inspection | Visual/3D, coplanarity, X-ray | Automated optical inspection |

### Package types

| Package | Interconnect to board | Typical pins | Relative size | Typical use |
|---|---|---|---|---|
| DIP | Through-hole leads, 2 rows | 8–64 | Large | Legacy, hobby, some power |
| SOIC / SOP / TSSOP | Gull-wing leads, 2 sides | 8–56 | Medium | Analog, logic, drivers |
| QFP / LQFP | Gull-wing leads, 4 sides | 32–256 | Large area | MCUs, older ASICs |
| QFN / DFN | Exposed pads under package, no leads | 8–100 | Small, good thermal | PMICs, RF, MCUs, power |
| BGA (wire-bond or flip-chip) | Solder ball array on substrate | 100–5 000+ | Scales with I/O | Processors, FPGAs, memory, SoCs |
| CSP | Package ≤ ~1.2× die size | Varies | Minimal | Mobile components |
| TO / D2PAK / power modules | Heavy leads, tabs, baseplates | 2–7+ | Large | Power discretes, IGBT/SiC modules |

## Chapter 23 — Advanced packaging

Why it matters now: transistor scaling is slower and costlier, and the largest chips are limited by the lithography reticle (~858 mm²). Splitting a system into multiple dies (chiplets) and connecting them densely in the package keeps performance rising, improves yield (small dies yield better), and allows each function on its best node. AI accelerators with HBM are only possible with 2.5D packaging, and CoWoS-class capacity has been an AI supply bottleneck.

| Technology | What it is | Interconnect pitch (indicative) | Examples | Status |
|---|---|---|---|---|
| Flip chip (C4 / Cu pillar) | Die flipped face-down, bumps to substrate | ~100–150 µm (C4); ~40–100 µm (Cu pillar) | CPUs, GPUs, SoCs on FCBGA | Mature |
| Fan-in WLP (WLCSP) | Redistribution and balls on the wafer, within die area | 300–500 µm ball pitch | Small mobile ICs, PMICs | Mature |
| Fan-out WLP (FOWLP) | Dies embedded in a reconstituted mould wafer; RDL fans out beyond die edge | RDL L/S ~2–10 µm | TSMC InFO (Apple application processors), ASE, Amkor, JCET, Nepes | Mature / growing |
| Panel-level packaging (PLP) | Fan-out on large rectangular panels | Similar | Samsung, PTI, ASE; TSMC announced interest | Emerging |
| 2.5D Si interposer | Dies side-by-side on a passive silicon interposer with TSVs | µ-bump ~40–55 µm; interposer wiring sub-µm | TSMC CoWoS-S, UMC/ASE, Samsung I-Cube | Mature, capacity-limited |
| 2.5D organic/RDL + bridge | Organic interposer with embedded Si bridges | Bridge µ-bump ~25–55 µm | TSMC CoWoS-L/-R, Intel EMIB, Samsung | Growing (large AI GPUs) |
| 3D stacking with TSV + µbumps | Dies stacked vertically | ~25–40 µm | HBM, Intel Foveros | Mature |
| Hybrid bonding (Cu-Cu direct) | Dielectric and Cu pads bonded without solder | ≤ 10 µm, down to ~1 µm (W2W) | Sony stacked CIS, AMD 3D V-Cache (TSMC SoIC), YMTC Xtacking | Growing |
| Co-packaged optics (CPO) | Optical engines in the switch/GPU package | — | Broadcom, NVIDIA (announced switches), TSMC COUPE | Emerging |
| Glass-core substrates | Glass replacing organic core | — | Intel, Absolics (SKC), others | Emerging |

Chiplets. A chiplet is a die designed to be combined with others in one package. Die-to-die interfaces are being standardised through UCIe (Universal Chiplet Interconnect Express). Examples: AMD EPYC/Ryzen (CCDs + I/O die), Intel Meteor Lake/Ponte Vecchio, NVIDIA Blackwell (two reticle-sized dies joined by a high-bandwidth interface).

Advanced substrates. FCBGA substrates use ABF (Ajinomoto Build-up Film) dielectric with fine-line copper; suppliers include Ibiden, Shinko, Unimicron, AT&S, Samsung Electro-Mechanics, Kinsus, Nan Ya PCB. They are a recurring bottleneck for large AI packages.

Who does advanced packaging: foundries (TSMC — CoWoS, InFO, SoIC; Intel — EMIB, Foveros; Samsung), and OSATs (ASE/SPIL, Amkor, JCET, Tongfu, Powertech). Equipment: BESI and ASMPT (die/hybrid bonders), Applied Materials, EV Group and SUSS (wafer bonding), DISCO (thinning/dicing), Tokyo Electron, Hanmi (TC bonders for HBM), Kulicke & Soffa.

## Chapter 24 — The complete ATMP flow

| Step | Machine | Process | Materials / consumables | Quality parameters | Typical defects | Automation needs |
|---|---|---|---|---|---|---|
| Incoming / wafer sort | Prober + ATE (if not done at fab) | Electrical test per die | Probe cards | Bin map integrity | Probe marks, map mismatch | MES map transfer (SEMI E142) |
| Backgrinding | Grinder + polisher (DISCO, Tokyo Seimitsu) | Thin wafer from ~775 µm to 50–200 µm (≤ 30 µm for stacked memory) | BG tape, wheels | Thickness, TTV, roughness | Cracks, warp, dimples | Inline thickness |
| Wafer mount | Mounter | Place on dicing tape in frame | Dicing tape (UV-release) | Bubble-free | Voids | Auto-load |
| Dicing | Blade saw, laser, stealth, plasma (Ch 25) | Separate dies | Blades, DI water, coolant | Kerf, chipping, die strength | Chipping, cracks, contamination | Vision alignment |
| Die attach | Die bonder (ASMPT, BESI, Fasford, K&S) | Pick die, place on lead frame/substrate | Epoxy, DAF, solder, sinter paste | Placement accuracy, bond-line thickness, voids | Voids, tilt, die crack | Map-based picking |
| Wire bond | Wire bonder (K&S, ASMPT, Shinkawa) | Thermosonic ball/wedge | Au/Cu/Ag wire, capillaries | Ball shear, wire pull, loop height | Non-stick, wire sweep, cratering | High UPH, vision |
| Flip chip | FC bonder, mass reflow or TCB | Bumped die face-down onto substrate | Solder, flux, underfill | Bump joint, alignment | Non-wet, bridging, underfill voids | X-ray, CSAM |
| Moulding | Transfer or compression moulding press (Towa, ASMPT, Besi) | Encapsulate | Epoxy mould compound (EMC) | Voids, wire sweep, warpage | Incomplete fill, delamination | Automated loading |
| Post-mould cure | Oven | Complete crosslinking | — | Tg, warpage | — | — |
| Plating / deflash | Plating line | Sn plating on leads | Sn chemistry | Plating thickness | Whiskers | — |
| Marking | Laser marker (fibre, green/UV DPSS) | Mark code, logo, 2D code | — | Legibility, depth, contrast | Burn-through, poor contrast | Vision verification, traceability |
| Ball attach | Ball mounter + reflow | Place solder balls on BGA | Solder balls, flux | Coplanarity, ball shear | Missing balls, bridging | 3D inspection |
| Singulation | Saw or punch; trim & form | Separate units | Blades | Burrs, dimensions | Chipping, burr | Vision |
| Final test | Handler + ATE; burn-in ovens | Functional, parametric, temperature | Test sockets, load boards | Test coverage, yield | Escapes, overkill | High parallelism |
| Final visual / pack | 3D/2D inspection, tape & reel | Lead/ball coplanarity, marking check | Carrier tape, trays, dry packs (MSL) | Moisture sensitivity level | Bent leads | Automated |

## Chapter 25 — Semiconductor dicing

| Method | Principle | Kerf (indicative) | Strengths | Limitations | Best for |
|---|---|---|---|---|---|
| Blade dicing | Diamond-resin or nickel-bonded blade spinning at ~30 000–60 000 rpm | ~15–60 µm | Low cost, universal, mature | Chipping, slow on thin/hard materials, water, mechanical stress | Most Si, QFN/BGA singulation |
| Laser ablation (full cut or grooving) | Pulsed UV/green laser vaporises material | ~10–30 µm | No blade wear; low-k grooving before blade cut | Heat-affected zone, debris, recast | Low-k groove, thin wafers, compound semi |
| Stealth dicing (SD) | IR laser focused inside the wafer forms a modified layer; tape expansion cleaves | ~0 µm | Dry, no debris, no chipping, zero kerf | Metal/test pads in streets problematic; needs expansion | MEMS, memory, thin wafers, sensors |
| Plasma dicing | DRIE through streets defined by a mask | ~5–20 µm | Parallel (all streets at once), high die strength, any die shape, narrow streets | Needs clear streets and a mask; capex | Small dies (RFID, discretes), thin wafers |
| DBG / SDBG | Dice before grind: half-cut (blade or SD) then grind to thickness to separate | Blade/SD dependent | Minimises backside chipping on ultra-thin dies | Process complexity | ≤ 50 µm memory dies |

Key terms

Kerf: width of material removed by the cut; sets how narrow streets can be and so how many dies fit on a wafer.

Chipping: front/backside edge breakouts; specification often ≤ ~10–25 µm.

Die strength: measured by 3-point or ball-on-ring bending; damage from dicing lowers it — critical for thin dies and stacks.

Throughput: blade speed limited by feed rate on thin/hard wafers; plasma is parallel; lasers limited by passes.

TTV: thickness variation of thinned wafers, which affects stealth-dicing focus and stacking.

Mechanical vs laser, in one line: blades are cheapest and most general; lasers win for thin, fragile, low-k, MEMS and hard/compound materials where chipping, cleanliness and street width matter. Main suppliers: DISCO (dominant in blade, grinder and stealth dicing), Tokyo Seimitsu (Accretech), ASMPT, Han’s Laser, EO Technics, SPTS (KLA) and Plasma-Therm for plasma dicing.

Localization considerations (ATMP). ATMP is the most accessible semiconductor manufacturing segment for new regions: lower capex than a fab (hundreds of millions of dollars for a large OSAT vs tens of billions for a leading-edge fab), labour and automation-intensive, and a gateway to test and advanced packaging. Equipment and many materials (EMC, substrates, bonding wire, lead frames) are still largely imported — equipment subsystems, laser marking, inspection automation, handlers, consumables and service are the localization openings.

Key takeaways — Parts XVI–XVIII

Packaging moved from commodity to strategic: 2.5D/3D, hybrid bonding and substrates now gate AI supply.

ATMP is a fixed sequence of ~12 steps, each with its own tools, consumables and defect modes.

Dicing choice is a trade between cost, kerf, damage and material.

Glossary terms introduced: ATMP, OSAT, lead frame, die attach, DAF, wire bond, capillary, EMC, transfer/compression moulding, QFN, BGA, CSP, flip chip, C4, Cu pillar, underfill, WLCSP, FOWLP, RDL, PLP, interposer, EMIB, Foveros, SoIC, hybrid bonding, chiplet, UCIe, ABF, FCBGA, CPO, backgrinding, stealth dicing, plasma dicing, DBG, kerf, chipping, die strength, MSL.
