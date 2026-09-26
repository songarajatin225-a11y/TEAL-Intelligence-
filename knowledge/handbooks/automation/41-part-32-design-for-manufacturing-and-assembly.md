---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 41
part_title: "Part 32 — Design for manufacturing and assembly"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 32 — Design for manufacturing and assembly

Most of a machine's cost and lead time is decided on the drawing: tolerances, part count, processes and access. Tolerance only what the error budget needs, reduce and standardize parts, design modules that can be built and tested offline, and review drawings with the vendors who will make them.

### 32.1 Objective

Release drawings that local vendors can make right first time at the lowest cost that meets function, and assemblies that technicians can build, align and service quickly.

### 32.2 Engineering concept

DFM (design for manufacturing) shapes each part for its process: machining, sheet metal, welding, surface treatment. DFA (design for assembly) minimizes part count and assembly time and makes wrong assembly impossible. Together with standardization and modularity, they turn one-off engineering into repeatable manufacturing.

### 32.3 Architecture — rules by process

| Process | Key DFM rules | Typical Indian vendor capability (indicative) |
|---|---|---|
| Machining | General tolerances per ISO 2768 (m or f) unless the error budget needs tighter; datum faces machined in one setup; standard tool radii; no deep narrow pockets; tolerance only functional features | VMC work ±0.02 mm routine; jig boring and grinding for ±0.005 mm at cost |
| Sheet metal | Inside bend radius ≥ thickness; holes clear of bends; standard gauges; one bend direction where possible; relief cuts | CNC punch/laser and press brake widely available |
| Welding | Access for torch; balanced welds to limit distortion; stress relief before machining precision faces; weld symbols on drawings | Fabrication shops plus plano-milling for large frames |
| Surface treatment | Allow for coating thickness (anodizing, nickel); mask datum and electrical bonding faces; zinc-plated mounting plates for EMC | Anodizing, powder coating, electroless nickel common |
| Purchased parts | Standard catalogue items; avoid obsolete or single-source parts | Local stock for common brands; imported lead times vary |

### 32.4 Components — DFA principles

| Principle | Practice |
|---|---|
| Reduce part count | Combine parts that do not move relative to each other, are the same material, and need not be separated for service |
| Standardize fasteners | Few sizes and lengths across the machine; same tool for most joints |
| Self-locate | Dowels, shoulders and spigots so parts land in position without measurement |
| Top-down, one direction | Assemble from above where possible; avoid turning the assembly over |
| Error-proof | Asymmetric features so parts fit only one way |
| Access | Tool and hand clearance for every fastener, connector and adjustment |
| Modular sub-assemblies | Build and test modules offline (Part 7), then install |
| Designed cable routes | Chains, trays and clips shown in 3D, not left to the electrician |

### 32.5 Design methodology

- Apply the error budget: tolerance only features in the stack (Part 9); everything else to general tolerance.
- Choose process per part; apply the rules in 32.3.
- Run a DFA review on each module: part count, fastener count, assembly direction, access.
- Review with vendors before release: machinability, fixturing, coating, cost drivers.
- Plan adjustments deliberately (shims, eccentric pins) only where a stack cannot be met by machining.
- Check service access: wear parts replaceable in the target time.
- Freeze drawings at Gate 3 with revision control.

### 32.6 Calculations

E_(DFA)=(3 N_(min))/(t_(assembly))

BA=θ (R+K t)

C(T)∝(1)/(T^k)

E_DFA = Boothroyd–Dewhurst assembly efficiency (3 s ideal time per theoretically necessary part N_min); BA = bend allowance for bend angle θ (rad), inside radius R, thickness t and K-factor (≈ 0.3–0.5); C(T) = machining cost rising steeply as tolerance T tightens.

Examples: a nest assembly of 24 parts taking 310 s with 6 theoretically necessary parts has E = 18 / 310 = 5.8%; redesigned to 11 parts and 140 s, E = 12.9% — and fewer parts to stock and inspect. A 90° bend in 2 mm sheet with R = 2 mm and K = 0.4 has BA = 1.571 × (2 + 0.8) = 4.4 mm.

### 32.7 Industrial example — redesigning the marking nest

| Issue in first design | DFM/DFA change | Result |
|---|---|---|
| Nest built from 9 plates and 16 screws | One machined block with pressed-in hardened pins | Part count 24 → 11 |
| Every hole toleranced ±0.01 mm | Only datum pin holes at ±0.005 mm (jig bored); rest ISO 2768-m | Lower machining cost (quote both versions to confirm) |
| Anodized after machining pin bores | Pin bores masked; pins pressed after anodizing | No lost fit from coating |
| Clamp mounted from underneath | Clamp mounted from above on dowels | Replaceable in 5 minutes without removing the nest |
| Sensor cable loose under nest | Cable channel machined into block | No pinched cables at shuttle ends |

### 32.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Welded frame vs bolted extrusion | Stiff, cheap per kg, needs machining and stress relief | Fast, adjustable, less stiff | Weldment for precision bases; extrusion for guards and light frames |
| Machined-in accuracy vs adjustment | No assembly skill needed, stable | Cheaper parts, depends on technician | Machine accuracy into datum chains; adjust only non-critical alignments |
| Custom vs catalogue part | Optimal fit | Stock, lead time, service | Catalogue whenever function allows |
| One-piece vs multi-piece | Fewer parts, stiffer | Easier to machine, replaceable wear parts | Separate only parts that wear or need different materials |

### 32.9 Common mistakes

- Default tight tolerances on every dimension.
- Coating thickness forgotten on precision fits.
- Parts that can be assembled upside down.
- Fasteners with no tool access after the next part is fitted.
- No vendor review; the first article reveals the design cannot be fixtured.

### 32.10 Troubleshooting — manufacturing and assembly problems

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Parts rejected at incoming inspection | Unachievable tolerance, ambiguous datum | Review drawing with vendor and inspector | Cpk of feature at vendor | Relax or re-datum; change process | DFM review before release |
| Assembly takes twice the planned time | Access, alignment, adjustments | Time study of assembly | Minutes per step | Redesign for access and self-location | DFA review per module |
| Frame moves after machining | No stress relief | Re-measure after days | Flatness change | Stress relieve, re-machine | Stress relief on drawing |
| Coated parts do not fit | Coating build-up | Measure before and after coating | Size change | Mask or re-machine after coating | Coating allowance rule |

### 32.11 Design checklist

- Only error-budget features have tight tolerances; rest ISO 2768
- Datums on drawings match the fixture and machine datum scheme
- Coating and heat-treatment allowances on drawings; masked faces noted
- DFA review done per module; part and fastener counts minimized
- Self-locating features and error-proofing present
- Tool access for every fastener and adjustment
- Vendor review of critical parts before release
- Service access for wear parts verified in 3D

### 32.12 Key takeaways

- Tolerance is cost; spend it only where the error budget needs it.
- Fewer, self-locating, error-proof parts assemble faster and fail less.
- Build modules that can be tested before integration.
- Review drawings with the vendor before they become purchase orders.
