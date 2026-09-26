---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 23
part_title: "Part 17 — Electrical panel design"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 17 — Electrical panel design

A panel is a heat, noise and access problem more than a wiring problem. Size it for 20–30% spare space, calculate heat before choosing cooling (in a 42 °C Indian summer, fans cannot cool a panel at all), segregate power from signals, bond everything to a bare mounting plate, and design for the technician who opens it at 3 a.m.

### 17.1 Objective

Design a panel that stays within its internal temperature limit at the worst site ambient, passes EMC and safety verification, and can be serviced quickly.

### 17.2 Engineering concept

| Concern | Governing physics | Design lever |
|---|---|---|
| Heat | Component losses vs heat dissipated through walls and cooling | Losses, enclosure area, cooling method, push-through heat sinks |
| EMC | Fast switching in drives couples into signals by conduction, capacitive and inductive coupling | Segregation, shielding, bonding, filtering |
| Safety | Protection against electric shock and fire | Covers, IP rating, clearances, protective bonding, labelling |
| Maintainability | Time to find and fix a fault | Layout logic, labels, spare space, visible diagnostics |

### 17.3 Architecture — layout zones

| Zone | Contents | Placement rule |
|---|---|---|
| Incoming and main distribution | Isolator, main MCCB, surge protection, distribution | Top, near cable entry; clear shrouding |
| Power electronics | Servo drives, VFDs, filters, braking resistors | Upper section (heat rises to the outlet); manufacturer spacing; braking resistors outside or at the very top |
| Control | PLC, safety PLC, network switch, relays, ECBs, SMPS | Middle, away from drives, at comfortable reading height |
| Field interface | Terminals, fieldbus connectors, IO-Link masters | Bottom, near cable entries; grouped by module |
| Heat-generating extras | Laser source, industrial PC (rack) | Top or in their own ventilated section |
| Services | Panel light, service socket, drawing pocket, door switch | Door and upper side walls |

Wire colours per IEC 60204-1 practice: black for AC and DC power, red for AC control, blue for DC control, orange for circuits that stay live with the main isolator open, green-yellow for protective earth, light blue for neutral. North American panels follow NFPA 79 and UL 508A conventions instead.

### 17.4 Components

| Component | Specification points |
|---|---|
| Enclosure | Size, material, IP rating (IEC 60529), mounting plate (bare, zinc-plated for bonding), door interlock |
| Cooling | Filter fan, cooling unit (air conditioner), air-to-water or air-to-air heat exchanger, heater and hygrostat for condensation |
| Wiring duct and DIN rail | Duct fill ≤ 60–70%, separate ducts for each segregation class |
| EMC hardware | Shield clamps, EMC cable glands, filters, ferrites, bonding straps |
| Labels | Device tags matching schematics, wire markers both ends, warning labels, arc-flash or residual-voltage labels where required |

### 17.5 Design methodology

- Place components on a 2D panel layout; keep 20–30% spare area and spare DIN rail.
- Group by zone (17.3) and segregation class.
- Compute heat losses and the heat balance at worst-case ambient.
- Choose the cooling method; re-check IP rating with the cooling device fitted.
- Route cables by segregation class; plan shield termination points.
- Plan earthing: PE bar, mounting plate bonding, door bonding straps, 360° shield clamps.
- Check access: every adjustable device, LED and test point reachable and visible.
- Produce the panel drawing set: layout, wiring, terminal plan, labels, bill of materials.
- Test: visual, bonding continuity, insulation resistance, functional test of every I/O point, thermal check under load.

### 17.6 Calculations

P_(loss)=∑P_(loss,i)

Q_(walls)=k⋅A_(eff)⋅(T_(in)−T_(amb)), k≈5.5 W/m^2K (painted sheet steel)

Q_(cool)=P_(loss)−k A_(eff) (T_(in)−T_(amb))

V_(fan)=(3.1⋅Q_(cool))/(T_(in)−T_(amb))  [m^3/h]

A_eff = effective heat-dissipating surface (IEC/TR 60890 gives weightings by installation type: free-standing, against a wall, in a row); 3.1 m³·K/(W·h) = air heat-capacity factor at sea level (higher at altitude). If T_amb ≥ T_in, Q_walls is negative (heat flows in) and fans cannot help: use a cooling unit or a water heat exchanger.

Worked example — laser marking cell panel. Free-standing enclosure 800 × 2,000 × 400 mm; A_eff ≈ 5.1 m²; target T_in ≤ 40 °C.

| Heat source | Loss (W) |
|---|---|
| Rack-mounted 50 W fiber laser source | 250 |
| Industrial PC | 60 |
| Servo drives (750 W + 400 W) and VFD | 100 |
| 24 V supplies (standard and safety) | 38 |
| PLC and safety PLC | 25 |
| Relays, contactors, breakers | 35 |
| Cables, terminals, network switch | 28 |
| Total P_loss | 536 |

| Site ambient | Wall exchange at T_in = 40 °C | Cooling needed | Solution |
|---|---|---|---|
| 30 °C | +281 W out through walls | 255 W | Filter fans: 3.1 × 255 / 10 = 79 m³/h (select ≥ 120 m³/h for filter loss) |
| 42 °C | −56 W (heat flows in) | 592 W | Cooling unit ≥ 800 W; fans cannot work |

The laser source is 47% of the heat. Moving it to a separate ventilated compartment, or choosing a push-through drive mounting, is cheaper than a larger cooling unit.

### 17.7 Industrial example — panel design decisions for the marking cell

- Separate upper compartment for the laser source with its own airflow path; control section below with an 800 W cooling unit sized for 42 °C.
- Drive output (motor) cables in their own duct, shield clamped 360° at the drive and at the gland; encoder and EtherCAT cables in the signal duct, crossing power only at 90°.
- Bare zinc-plated mounting plate; every device bonded through its fixing; door and side panels bonded with braided straps.
- IO-Link master and terminals at the bottom by module (shuttle, laser, safety), so a technician finds a module's wiring in one place.
- 25% spare DIN rail and one empty I/O slot per rack; panel light, service socket on its own RCD, drawing pocket.

### 17.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Filter fan vs cooling unit | Cheap, simple; only when T_amb < T_in by ≥ 5 K; admits dust | Works at any ambient, keeps IP54+; costs, maintenance, condensate | Cooling unit for Indian summers, dusty or oily shops |
| Cooling unit vs air-to-water exchanger | Self-contained | Very quiet, efficient; needs chilled water | Water when the site has process cooling water |
| Heat inside vs push-through heat sinks | Simple mounting | Drive losses leave the panel | Push-through for high drive losses |
| One panel vs panel plus distributed I/O | All in one place | Smaller panel, fewer cables, modularity | Distributed for large or modular machines |
| IP54 vs IP65 | Lower cost | Washdown and heavy dust | Match the site environment in the URS |

### 17.9 Common mistakes

- Choosing fans for a panel whose site ambient exceeds the allowed internal temperature.
- Drives at the bottom heating the PLC above them.
- Motor cables and encoder cables in one duct.
- Painted mounting plates: no high-frequency bonding.
- No spare space; the first change order needs a second panel.
- Cooling unit running with the door open, flooding the panel with condensate.

### 17.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Drive or PLC over-temperature in afternoons | Cooling undersized, fan filter clogged, ambient higher than designed | Log panel temperature for a full day | T_in vs T_amb | Cooling unit, relocate heat sources, clean filters | Heat calculation at worst ambient |
| Encoder or fieldbus errors when motors run | Coupling from motor cables, poor shield bonding | Run motors with and without shield clamps; scope noise | Error counters vs motor activity | 360° shield clamps, segregation, ferrites, filters | EMC layout rules |
| Water inside panel | Condensate from cooling unit, door seal | Inspect drain, door-switch function | Humidity | Door switch cuts cooling, fix drain | Door switch and drain in design |
| Dust on electronics | Filter fans in dusty shop | Inspect filters | Dust deposits | Cooling unit or heat exchanger | IP and environment in URS |
| Hard to find faults | Poor labelling, no layout logic | Time a mock fault search | Minutes to locate | Relabel, reorganize by module | Labelling standard, zone layout |

### 17.11 Panel design checklist

Layout and space

- 20–30% spare area and spare DIN rail; duct fill ≤ 60–70%
- Zones: incoming, power electronics, control, field interface, heat sources
- Manufacturer spacing around drives and SMPS respected
- Devices that need adjustment or reading at 0.4–2.0 m height
Thermal

- Heat-loss table complete, including laser source and IPC
- Heat balance at worst site ambient; cooling method justified
- Airflow path bottom-in, top-out; no heat source below the PLC
- Condensation control (door switch, drain, heater if needed)
Power and protection

- Breaking capacity of devices ≥ site fault level
- Main isolator lockable; parts live with isolator open are marked orange and shrouded
- Separate safety and standard 24 V with selective protection
EMC and earthing

- Bare, bonded mounting plate; PE bar; door and panel bonding straps
- Segregated ducts: power, motor outputs, 24 V control, signals and networks
- 360° shield termination at glands and drives
- Suppression on inductive loads; filters placed per drive maker
Safety and compliance

- IP rating verified with cooling devices and glands fitted
- Finger-safe covers on live parts; warning labels
- Wire colours and markings per the applicable standard
Documentation and service

- Device tags match schematics; wire markers on both ends
- Terminal plan, layout drawing, BOM and panel test record
- Panel light, service socket, drawing pocket
- Bonding continuity, insulation resistance and I/O functional test recorded

### 17.12 Key takeaways

- Do the heat balance at the hottest site day; above ambient 35–40 °C fans stop working.
- Segregate, shield and bond; most EMC problems are layout problems.
- Keep 20–30% spare; every machine changes before SAT.
- Lay out by module and label everything; service time is designed in the panel.
