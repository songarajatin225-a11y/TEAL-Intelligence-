---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 15
part_title: "Part XIV — Electronics and EMS"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XIV — Electronics and EMS

In electronics manufacturing the laser does eight jobs — marking, depaneling, cutting, soldering, welding, drilling, cleaning and stripping — and each one replaced a mechanical or chemical process because it is contact-free, programmable and leaves a data trail. The laser’s place in an SMT line is fixed: an ID mark at the start, selective soldering and depaneling after reflow, and joining and marking in box build.

## 14.1 Process-by-assembly map

| Assembly | Marking | Depaneling / cutting | Soldering | Welding | Drilling | Cleaning / stripping |
|---|---|---|---|---|---|---|
| Bare PCB (fabrication) | CO₂ 9.3 µm or UV DataMatrix on solder mask | UV, green, ps outline cutting | — | — | CO₂ micro-vias in dielectric; UV through Cu (HDI) | Solder-mask ablation for rework; LDI imaging at 405 nm |
| SMT / PCBA | Board and panel IDs; component marking | UV ns/ps depaneling after SMT | Diode/fiber selective soldering of THT parts | — | — | Conformal-coating removal for rework |
| Flexible PCB (FPCB) | UV | UV ns/ps outline and coverlay cutting; kiss-cut | Laser and hot-bar FPC-to-board joints | — | UV micro-vias | Polyimide and coverlay removal at contacts |
| Connectors | Fiber or UV on housings and shells | — | Pin-to-board laser soldering | Pulsed or QCW spot welds on shells and contacts | — | Laser stripping of Au/Ni plating to form solder dams on pins |
| Camera module | UV/fiber IDs | USP cutting of cover glass and IR filters | Laser soldering of VCM coils and flex; solder-ball jetting | Spot welds on holders and springs | — | — |
| Display | Panel IDs | USP cutting of cover glass, polariser and OLED stacks; camera-hole drilling | — | — | Punch-hole openings | LLO of flexible OLED; excimer annealing of LTPS; pixel/line repair |
| Wire and cable | UV marking of insulation (incl. aerospace wire) | Cutting of flat flex cables | — | — | — | CO₂ insulation stripping; fiber/UV shield and enamel removal |

## 14.2 End devices

| Device | Characteristic laser applications |
|---|---|
| Smartphone | Anodised-Al housing marking and antenna-line ablation, cover-glass and camera-lens cutting, battery tab welding, shield-can and bracket welding, FPC cutting, camera-module soldering (full map in §19.2) |
| Laptop | Keycap legend ablation on backlit keys, anodised chassis logos, hinge and bracket welding, battery-pack welding, PCB depaneling |
| Wearables | Watch-case and sapphire-crystal cutting and marking, sensor windows, micro-battery welding, hermetic sealing, strap marking |
| Server | Large-board DataMatrix marking, copper cold-plate and vapour-chamber welding for liquid-cooled AI servers, busbar welding, optical transceiver assembly |
| Networking equipment | Transceiver TOSA/ROSA laser welding, PIC and fiber-array attachment, housing and front-panel marking, backplane marking |

## 14.3 Process summary

| Process | Typical laser | What it displaced | Main quality risk |
|---|---|---|---|
| Marking | CO₂ (9.3/10.6 µm), UV, fiber | Labels, inkjet | Low contrast or grade on dark or thin masks |
| Depaneling | UV ns/ps, green; CO₂ for thin boards | Routers, punching, V-score breaking | Carbonisation, conductive residue on FR-4 edges |
| Cutting (FPC, films) | UV ns/ps | Steel-rule and rotary die cutting | Edge carbonisation, copper damage in kiss-cuts |
| Soldering | Diode/fiber 9xx nm | Robotic iron, selective wave | Flux spatter, board burn, cold joints |
| Welding | QCW/pulsed fiber, green | Resistance welding | Spatter, porosity on plated parts |
| Drilling | CO₂, UV | Mechanical drilling | Via taper, capture-pad damage |
| Cleaning | Pulsed ns fiber | Chemical and abrasive cleaning | Substrate damage above threshold |
| Stripping | CO₂, UV, fiber | Mechanical strippers, chemical plating masks | Conductor nicks, incomplete removal |
