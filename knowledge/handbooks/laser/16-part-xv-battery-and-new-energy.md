---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 16
part_title: "Part XV — Battery and New Energy"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XV — Battery and New Energy

A lithium-ion battery pack contains hundreds to thousands of laser processes: electrodes are notched, foils and tabs welded, cans sealed, cells marked and cleaned, busbars welded and packs sealed. The dominant difficulties are copper and aluminium reflectivity, dissimilar Al–Cu joints, spatter and particles (a single particle can short a cell) and penetration control over thin cans.

## 15.1 Cell formats

| Format | Construction | Laser touchpoints |
|---|---|---|
| Cylindrical (18650, 21700, 46xx) | Wound jelly roll in a Ni-plated steel (or Al) can; crimped or welded cap | Electrode notching; tab or current-collector-plate welding (tabless designs); can-bottom and cap welds; busbar-to-cell welds through thin can walls |
| Prismatic | Wound or stacked electrodes in an Al can; lid with terminals and vent | Notching; foil-stack-to-tab welding; lid-to-can seam sealing; fill-port seal-pin welding; terminal welding |
| Pouch | Stacked electrodes in Al-polymer laminate | Notching and cutting; foil-stack-to-tab welding; tab cutting; laminate cutting (tab-film sealing itself is thermal, not laser) |

## 15.2 From electrode to pack

## 15.3 Laser applications

| Process | Level | Materials (≈) | Laser options | Key challenges |
|---|---|---|---|---|
| Electrode notching / cutting | Cell | Cu foil ~6–10 µm and Al foil ~10–15 µm, with coatings tens of µm thick | ns MOPA fiber (100–500 W), ps | Burr height, coating delamination, particles, speed matching the coater |
| Separator cutting | Cell | PE/PP films | CO₂, UV | Melted edges, shrinkage |
| Coating removal (tab clearing) | Cell | Active material on foil | Pulsed ns fiber, ps | Remove coating without thinning foil |
| Foil-stack-to-tab welding | Cell | 20–100 foils to Al or Ni-plated Cu tab | Fiber with wobble; green for Cu (ultrasonic welding is the incumbent) | Foil tearing, porosity, heat into stack |
| Tab-to-terminal / cap welding | Cell | Al, Cu, Ni-plated Cu | CW or QCW fiber | Dissimilar joints, spatter |
| Can sealing (prismatic lid-to-can) | Cell | Al alloys (1xxx, 3xxx) | 2–6 kW CW fiber, ring-core or wobble | Hermeticity, cracks, spatter entering the cell |
| Fill-port seal-pin welding | Cell | Al | Pulsed, QCW or CW fiber | Hermetic seal over electrolyte residue |
| Cell marking | Cell | Steel or Al can, laminate | Fiber (can), UV/CO₂ (laminate) | Readable codes through later coating and handling; battery-passport traceability |
| Cell cleaning | Module | Can surfaces, terminals | Pulsed ns fiber | Oxide and residue removal before welding, bonding and insulation coating |
| Busbar welding | Module | Al or Cu busbars to cell terminals; Al–Cu dissimilar | CW fiber with wobble or ring beam; green or blue for Cu; OCT depth monitoring | Penetration limit over thin cylindrical can walls; brittle Al–Cu intermetallics; spatter |
| Module and pack welding | Pack | Al housings, cooling plates, HV terminals | Multi-kW fiber (fixed or remote optics) | Leak-tightness, distortion, weld length |
| BMS and sense-wire joints | Pack | Ni strips, wires to PCB | Laser soldering, micro-welding | Heat into electronics |

Traceability pressure is rising: under Article 77 of the EU Battery Regulation (2023/1542), EV, light-means-of-transport and industrial batteries above 2 kWh need a digital battery passport from 18 February 2027 (EUR-Lex text; summary), which makes durable, machine-readable cell and module marks and per-weld process data a compliance requirement rather than an option.

For Al–Cu joints, brittle intermetallic phases grow with time at temperature, so the goal is minimum heat input and a thin, controlled mixing zone: low-BPP sources with wobble, green light on the Cu side, or pulse-shaped QCW.

## 15.4 Wavelength and pulse comparison for battery manufacturing

| Criterion | IR fiber CW (1070 nm) | Green (515/532 nm) | Blue diode (~450 nm) | IR QCW / pulsed | UV (355 nm) | Ultrafast (ps/fs) |
|---|---|---|---|---|---|---|
| Cu absorption (cold) | ~4% | ~40% | ~50–65% | ~4% | ~60% | Nonlinear, high |
| Al absorption (cold) | ~6% | ~8% | ~8% | ~6% | ~8% | High |
| Spatter on Cu | High unless shaped | Low | Very low (conduction) | Medium | — | Very low |
| Penetration control | Good with OCT and shaping | Very good | Conduction-limited depth | Good per pulse | Surface only | Surface only |
| Capex per W | Lowest | Higher | Moderate–high | Low | High | Highest |
| Maturity in battery lines | Highest | Growing fast | Emerging / growing | High | Niche | Niche |
| Typical use | Busbars, can sealing, housings | Cu foils, tabs, busbars, hairpins | Thin Cu, foil stacks, hybrid with IR | Tabs, seal pins | Separator, marking | Burr-free foil cutting, electrode structuring |

Absorption values are the approximate room-temperature figures of §9.2; effective coupling during welding is higher. The EV drive-train side (hairpins, rotors, inverters) is covered in Part XVI.
