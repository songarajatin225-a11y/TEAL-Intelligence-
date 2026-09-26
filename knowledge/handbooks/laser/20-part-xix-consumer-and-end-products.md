---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 20
part_title: "Part XIX — Consumer and End Products"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XIX — Consumer and End Products

A modern smartphone carries dozens of laser-made features — marks, cuts, welds, vias, solder joints and lift-off layers — spread across a dozen suppliers’ factories. Mapping a product from the outside in (product → component → material → process → laser → machine) is the fastest way to find where laser equipment sells and which technology each supplier needs.

## 19.1 End-product map

Format: component (material) → process → laser / wavelength → machine type.

| Product | Signature laser applications |
|---|---|
| Smartphone | Housing (anodised Al, Ti) → marking, antenna-line ablation → MOPA fiber 1064 nm → galvo marker · Cover glass → cutting, camera holes → ps/fs 1030 nm → USP glass cutter · Flexible OLED (PI on glass) → LLO → 308/343 nm → line-beam LLO system · Battery tabs → welding → QCW fiber → micro-welder |
| Laptop | Keycaps (painted translucent polymer) → legend ablation → fiber/UV → marking cell · Chassis (Al) → logo marking → MOPA fiber · Heat pipes and vapour chambers (Cu) → sealing welds → fiber/green → micro-welder · Mainboard → depaneling → UV → depaneler |
| Smartwatch | Sapphire crystal → cutting, chamfer → ps/fs → USP cutter · Case (Ti, stainless) → marking, welding → MOPA/QCW fiber · Ceramic back (ZrO₂) → cutting, marking → ps |
| Earbud | Antenna carrier (LDS-grade thermoplastic) → laser direct structuring → 1064 nm fiber → LDS system · Coin cell and contacts → welding → pulsed fiber · Housing → transmission welding → 9xx nm diode |
| Camera | Lens cover and IR filter (glass, sapphire) → cutting → ps/fs · VCM coil and flex → soldering → diode · Holder and springs → welding → pulsed fiber |
| Tablet | As smartphone with larger cover glass (USP cutting), larger batteries (tab and pack welding) and Al housings (marking, antenna ablation) |
| Server | Cu cold plates → welding/brazing → fiber/green → welding cell · Busbars (Cu) → welding → fiber/green · Optical transceivers → fiber attach welding → pulsed Nd:YAG/fiber · Large PCBs → DataMatrix → CO₂ 9.3 µm/UV |
| Network switch | Transceivers (QSFP/OSFP) → laser welding, lens and fiber attach → pulsed fiber · Chassis (steel) → cutting → CW fiber flatbed · Front panel → marking → fiber |
| Router | PCB → marking, depaneling → CO₂/UV · Housing (plastic/Al) → marking → fiber/UV |
| Display | LTPS backplane (a-Si) → excimer laser annealing → XeCl 308 nm → ELA line · OLED on PI → LLO → 308/343 nm · Panel and polariser → cutting → ps/CO₂ · Defects → repair → UV/ps |
| TV | Panel glass and polarisers → cutting → CO₂/ps · Light-guide plates (PMMA) → micro-structuring → CO₂ · Mini-LED backlight PCBs → marking, depaneling → UV |
| Game console | APU package → marking → fiber/green · Mainboard → depaneling, soldering → UV, diode · Heat pipes (Cu) → welding → fiber |
| Automotive ECU | Housing (PBT-GF or Al) → laser plastic welding or seam welding → diode/fiber · PCBA → depaneling, THT soldering → UV, diode · Label-free IDs → marking → CO₂/UV |
| Sensor | MEMS wafer → stealth dicing → NIR · Diaphragm (stainless) → hermetic welding → pulsed fiber · Bridge resistors → trimming → 1064/532 nm |
| Medical device | Stent (nitinol) → tube cutting → SM fiber/fs · Implant (Ti) → UDI marking → ps/MOPA · Pacemaker can (Ti) → hermetic welding → fiber |
| Battery | Electrodes → notching → ns MOPA/ps · Can → sealing → CW fiber with ring beam · Busbars → welding → fiber/green/blue |
| Solar panel | c-Si cell → contact opening, laser-assisted firing, half-cell separation → green/UV ns-ps, IR · Thin-film module → P1–P3 scribing → 1064/532/355 nm ns/ps |
| EV | Body → 3D cutting, remote welding, brazing → fiber, disk, diode · Stator → hairpin stripping and welding → green, IR+blue · Battery → Part XV |
| Industrial equipment | Sheet-metal frames → cutting → CW fiber · Welded structures → fiber welding · Wear parts → cladding, hardening → diode/fiber · Nameplates → marking → fiber |

## 19.2 Exploded application maps

1. Smartphone

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Housing / frame | Anodised Al, Ti, stainless | Logo, regulatory and colour marking; antenna-break and grounding-point ablation; nut and bracket welding | MOPA fiber 1064 nm; UV; QCW fiber | Galvo markers; micro-welders |
| Cover and back glass | Aluminosilicate glass, glass-ceramic | Contour and camera-hole cutting; decoration ink ablation | ps/fs 1030 nm (filament/Bessel); UV/ps | USP glass cutting systems |
| Display | OLED on polyimide, LTPS backplane | Excimer annealing; LLO; panel and polariser cutting; punch-hole; repair | XeCl 308 nm; 308/343 nm; ps UV; UV | ELA and LLO line-beam systems; USP cutters; repair tools |
| Camera module | Sapphire/glass covers, IR filter, VCM, flex | Cover and filter cutting; VCM soldering; spring welding | ps/fs; diode 9xx nm; pulsed fiber | USP cutter; laser soldering; micro-welder |
| Mainboard (HDI / substrate-like PCB) | Resin, Cu, glass fabric | Micro-via drilling; direct imaging; depaneling; ID marking; shield-can welding; component soldering | CO₂ + UV; 405 nm LDI; UV/ps; CO₂ 9.3 µm/UV; QCW fiber; diode | Via drillers; LDI; depanelers; markers |
| FPC and connectors | Polyimide, Cu, Au-plated pins | Outline and coverlay cutting; board-to-board connector soldering; plating stripping | UV ns/ps; diode; fiber | FPC cutters; soldering cells |
| Battery | Li-ion pouch, Ni strips, PCM | Tab welding; protection-circuit welding; marking | QCW/pulsed fiber; UV | Battery pack welders |
| SoC and memory packages | Mould compound, Si | Wafer dicing; package marking | Stealth/UV grooving; fiber/green | Dicing and marking systems |
| Acoustic and small parts | Meshes, SIM tray, buttons | Mesh welding; micro-hole drilling; marking | Pulsed fiber; ps; MOPA fiber | Micro-welders; drillers |

2. Laptop

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Chassis | Anodised Al (unibody), Mg alloys | Logo marking, antenna windows, colour marks | MOPA fiber; UV | Galvo marker |
| Keyboard | Painted translucent ABS/PBT keycaps | Legend ablation for backlighting | Fiber 1064 nm; UV | High-speed marking cell with vision |
| Hinge and brackets | Steel, Zn and Al alloys | Spot and seam welding | QCW/CW fiber | Welding station |
| Thermal module | Cu heat pipes, vapour chambers | End sealing, fin and plate welding | Fiber; green | Micro-welder |
| Battery pack | Cylindrical or pouch cells, Ni strips | Tab and strip welding | QCW fiber | Pack welder |
| Mainboard | HDI PCB | Depaneling, marking, via drilling | UV/ps; CO₂/UV | EMS stations |
| Trackpad and display | Glass, polariser | Cutting | ps/CO₂ | Glass cutter |

3. Smartwatch

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Crystal | Sapphire, glass | Contour cutting, chamfering | ps/fs | USP cutter |
| Case | Ti, stainless steel, Al | Marking, welding of parts | MOPA fiber; QCW fiber | Marker; micro-welder |
| Back and sensor window | ZrO₂ ceramic, sapphire, glass | Cutting, drilling, marking | ps/fs | USP micromachining |
| Micro-battery | Li-ion pouch or button | Tab welding | Pulsed fiber | Micro-welder |
| Sensors | Optical and electrical sensor modules | Hermetic sealing, soldering | Pulsed fiber; diode | Micro-welding, soldering |
| Strap | Fluoroelastomer, leather, metal links | Cutting, marking, link welding | CO₂; UV; fiber | Markers, cutters |

4. Earbuds

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Antenna carrier | LDS-grade thermoplastic | Laser direct structuring (activates additive for selective plating) | Fiber 1064 nm | LDS system |
| Shells | PC/ABS | Transmission welding; marking | 9xx nm diode; UV | Plastic welder; marker |
| Coin cell and contacts | Li-ion coin cell, Au-plated pins | Tab welding; contact soldering | Pulsed fiber; diode | Micro-welder; soldering cell |
| Acoustic mesh | Stainless or polymer mesh | Welding, cutting | Pulsed fiber; UV | Micro-welder |
| FPC | Polyimide | Cutting | UV | FPC cutter |

5. Camera module

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Image-sensor wafer | Si (CMOS) | Stealth dicing or grooving | NIR; UV/ps | Wafer dicing system |
| IR-cut filter, cover | Coated glass, sapphire | Singulation | ps/fs | USP cutter |
| VCM actuator | Cu coil, springs | Coil soldering; spring welding | Diode; pulsed fiber | Soldering and micro-welding |
| Lens holder and barrel | Plastics | Plastic welding; marking | Diode; UV | Welder; marker |
| Flex and connector | PI, Cu | Cutting; soldering | UV; diode | Cutter; soldering cell |

6. Server

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Motherboard and backplane | Thick multilayer PCB | DataMatrix marking; via drilling (HDI areas) | CO₂ 9.3 µm/UV; CO₂/UV | Marking and drilling systems |
| Liquid-cooling cold plates | Cu, Al | Seam welding, brazing | Fiber CW; green | Welding cell |
| Power distribution | Cu busbars | Welding, marking | Fiber; green | Welding cell |
| GPU/CPU packages | Mould compound, lids | Marking; substrate vias | Fiber/green; CO₂/UV | Package lines |
| Optical transceivers | Kovar, stainless, glass | Fiber and lens attach welding; marking | Pulsed Nd:YAG/fiber | Opto-assembly welder |
| Chassis | Steel sheet | Cutting, welding | CW fiber | Flatbed cutter; welder |

7. Network equipment

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Optical modules (QSFP, OSFP) | Metal housings, PICs, lenses | Laser welding, fiber-array attach, marking | Pulsed fiber; UV | Opto-assembly cells |
| Switch ASIC package | Mould compound, substrate | Marking; micro-vias | Fiber/green; CO₂/UV | Back-end lines |
| PCB | High-layer-count boards | Marking; depaneling of daughter cards | CO₂/UV; UV | EMS stations |
| Chassis and front panel | Steel, Al | Cutting; marking | CW fiber; MOPA fiber | Flatbed cutter; marker |
| Heat sinks | Al, Cu | Fin welding | Fiber | Welding cell |

8. Automotive ECU

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Housing | PBT-GF, PA-GF; or die-cast Al | Transmission plastic welding; seam welding of Al covers | 9xx nm diode/fiber; CW fiber | Contour or quasi-simultaneous welder; seam welder |
| PCBA | FR-4, ceramic, components | Depaneling; THT connector soldering; ID marking | UV/ps; diode; CO₂/UV | EMS stations |
| Connector and pins | Cu alloys, tin plating | Pin soldering, press-fit zone cleaning | Diode; pulsed fiber | Soldering cell |
| Conformal coating | Acrylic, silicone | Selective removal for rework | UV/CO₂ | Rework station |
| Label and ID | Housing or PCB | Marking | Fiber, CO₂, UV | Marking station |

9. EV battery

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Electrodes | Coated Cu and Al foils | Notching, cutting, tab clearing | ns MOPA fiber; ps | Roll-to-roll notching system |
| Cell tabs | Foil stacks, Al/Cu tabs | Foil-stack and tab welding | Fiber with wobble; green | Tab welder |
| Cell housing | Al cans (prismatic), steel cans (cylindrical) | Lid sealing, seal-pin welding, marking | Multi-kW fiber (ring beam); fiber | Can-sealing and marking stations |
| Module | Cells, busbars | Cell cleaning, busbar welding | Pulsed ns fiber; CW fiber, green, blue; OCT | Module welding cell |
| Pack | Al housing, cooling plates, HV connectors | Housing and cold-plate welding, terminal welding | Multi-kW fiber (remote or fixed optics) | Pack assembly line |
| BMS | PCBA, sense wires | Soldering, micro-welding | Diode; pulsed fiber | Electronics cell |

10. Solar module

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| c-Si cell (PERC) | Si with rear passivation stack | Laser contact opening; selective-emitter doping | Green/UV ns-ps | In-line cell laser tools |
| c-Si cell (TOPCon) | Si with poly-Si passivation | Laser-assisted firing of contacts; edge processes | IR/green pulsed | In-line cell laser tools |
| Half and shingled cells | Si wafers | Low-damage separation | Thermal laser separation or scribe-and-break | Cell cutter |
| Thin-film modules (CdTe, CIGS, perovskite) | Coated glass | P1, P2, P3 scribing; edge deletion | 1064/532/355 nm ns/ps; high-power pulsed fiber | Scribing and edge-deletion systems |
| Glass and frame | Solar glass, Al | Marking, traceability | Fiber, CO₂ | Marking station |

11. Semiconductor package

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Die | Si, SiC, GaN | Stealth dicing; grooving; ablation dicing | NIR; UV/ps | Laser dicing system |
| Substrate | Organic laminate; glass core | Micro-via drilling; through-glass vias | CO₂ + UV; fs/ps + etch | Via driller; glass processing system |
| Mould body | Epoxy mould compound | Marking; through-mould vias; EMI-shield patterning | Fiber/green/UV; UV/CO₂ | Package marker; micromachining |
| Interconnects | Solder balls, bumps | Ball attach and rework; laser-assisted bonding | Diode; fiber | Bonding and rework systems |
| Hermetic packages | Kovar, ceramics | Lid seam sealing | Pulsed Nd:YAG/fiber | Seam sealer |
| Strip / panel | Leadframe, substrate strip | Singulation (irregular shapes) | UV/ps | Laser singulation system |

12. PCB

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Inner and outer layers | Dry film, photoresist | Direct imaging | 405 nm diodes (or 355 nm) | LDI system |
| Micro-vias | Resin, glass fabric, Cu | Blind and through micro-via drilling | CO₂ (dielectric) + UV (Cu) | Via drilling system |
| Solder mask | Epoxy mask | Direct imaging; marking | 405 nm; CO₂ 9.3 µm/UV | LDI; marker |
| Cavities, rigid-flex caps | Laminate, PI | Depth-controlled ablation, cap removal | CO₂, UV, ps | Micromachining system |
| Panel | Finished boards | Depaneling | UV/ps, green | Laser depaneler |
| Defects | Shorts, opens | Trimming and repair | UV | Repair station |

13. Display

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| TFT backplane | a-Si → poly-Si (LTPS) | Excimer laser annealing | XeCl 308 nm | ELA line-beam system |
| Flexible OLED | PI on glass carrier | Laser lift-off | 308 nm excimer or 343 nm DPSS | LLO line-beam system |
| Cell and module | Glass, PI, polariser, OCA | Cutting, punch-hole, polariser cutting | ps UV/IR; CO₂ | USP cutting system |
| Micro-LED | GaN on sapphire | LLO, selective release and transfer | 248–355 nm | Mass-transfer tools |
| Defects | Line and pixel defects | Laser repair (ablation, deposition) | UV/ps | Repair tool |
| Cover glass | Chemically strengthened glass | Cutting, chamfer | ps/fs | USP cutter |

14. Medical device (example: drug-eluting coronary stent and delivery catheter)

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Stent | Co-Cr or nitinol tube | Strut cutting | Single-mode fiber or fs | Tube-cutting machine with rotary axis |
| Stent marking | Metal | Micro-marking (lot ID) | ps/UV | Micro-marker |
| Catheter shaft and hypotube | Stainless hypotube, polymer layers | Spiral cutting, skiving, side holes | Fiber, fs; UV/excimer | Tube cutter; skiving system |
| Balloon and tip | Polyamide, Pebax | Polymer welding, tip forming | Tm fiber ~2 µm; CO₂ | Polymer welding station |
| Marker bands | Pt-Ir | Welding or crimp | Pulsed fiber | Micro-welder |
| Shaft marking | Polymer | Depth and length marks | UV | UV marker |

15. Aerospace component (example: high-pressure turbine blade)

| Component | Material | Process | Laser / λ | Machine type |
|---|---|---|---|---|
| Blade airfoil | Ni single-crystal superalloy with thermal-barrier coating | Cooling-hole drilling (round and shaped) | ms QCW fiber/Nd:YAG; ps | 5-axis drilling machine |
| Blade tip | Ni superalloy | Repair cladding | DED fiber or diode | DED cell with adaptive path |
| Root and fir-tree | Ni superalloy | Laser shock peening | J-class ns Nd:glass/Nd:YAG | LSP cell |
| Identification | Blade surface | UID marking | Fiber, ps | Marking station |
| Related parts | Combustor liners, fuel nozzles | Drilling; LPBF | QCW fiber; multi-laser LPBF | Driller; powder-bed AM system |
