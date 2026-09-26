---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 42
part_title: "Part 33 — BOM and procurement engineering"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 33 — BOM and procurement engineering

The BOM is the machine in data form: if it is structured by module, classified by risk and lead time, and released under revision control, procurement becomes predictable. Identify long-lead and imported items at Gate 1 and order them against the critical path — a laser source with a 12-week lead time plus import clearance often has to be ordered before the design is finished.

### 33.1 Objective

Structure and classify the BOM, decide make vs buy per item, and plan procurement so every part arrives inspected before its assembly step.

### 33.2 Engineering concept

| BOM level | Content | Example |
|---|---|---|
| 0 — Machine | Top assembly | Laser marking cell LMC-2S |
| 1 — Module | Functional modules (Part 7) | M04 Servo shuttle |
| 2 — Assembly | Buildable units | Shuttle carriage assembly |
| 3 — Sub-assembly | Units within assemblies | Nest assembly |
| 4 — Component | Purchased or made parts | Hardened locating pin, ×8 g6 |

The engineering BOM (EBOM) follows the design structure; the manufacturing BOM (MBOM) follows the build sequence (kits per assembly step). Keep both linked to the same item numbers and revisions.

### 33.3 Architecture — item classification

| Class | Definition | Examples | Procurement rule |
|---|---|---|---|
| Standard | Catalogue items with multiple sources | Fasteners, bearings, sensors, pneumatics | Order at BOM release; stock common items |
| Custom (make-to-print) | Built to our drawings | Machined parts, weldments, sheet metal | Release with drawings; first-article inspection |
| Long-lead | Lead time beyond the design-to-assembly window | Laser sources, robots, EFEMs, granite, linear motors, special optics | Order at G1/G2, often before design freeze, with change terms |
| Critical | Failure stops the machine or safety depends on it | Safety devices, drives, laser, vision | Approved sources only; incoming verification |
| Customer-supplied | Provided by the customer | Customer-standard PLC, sample parts, fixtures | Written list with dates; delays are customer risk |
| Imported | From outside India | Laser sources, precision optics, some drives | Landed cost, customs time, forex exposure |
| Localized | Previously imported, now sourced in India | Frames, enclosures, some fixtures and cables | Qualification record (Part 52) |

### 33.4 Components — BOM line fields

| Field | Purpose |
|---|---|
| Item number and revision | Unique identity and change control |
| Level and parent | Structure |
| Description, manufacturer and part number | What exactly to buy |
| Quantity and unit | How many |
| Make / buy / customer-supplied | Responsibility |
| Class (standard, custom, long-lead, critical, imported) | Procurement treatment |
| Lead time and need date | Scheduling |
| Approved suppliers | Sourcing control |
| Cost (target and actual) | Cost engineering (Part 45) |
| Spare-part flag and recommended quantity | Service (Part 42) |

### 33.5 Design methodology — make vs buy

| Criterion | Favour make | Favour buy |
|---|---|---|
| Know-how and IP | Process modules, fixtures, software, calibration methods | Commodity functions |
| Capacity | In-house skills and time available | Team is the bottleneck |
| Cost | Lower total cost including engineering time | Supplier scale gives lower cost |
| Lead time | Faster in-house | Supplier has stock or standard product |
| Quality risk | We control critical tolerances | Supplier has proven quality |
| Supply risk | Single-source or obsolescence risk outside | Multiple qualified sources |
| Strategy | Platform differentiator | Non-differentiating |

For TEAL-type equipment the usual outcome: make fixtures, nests, process integration, calibration, software and platform modules; buy laser sources, galvos, robots, drives, PLCs, cameras, EFEMs and load ports; build-to-print with partners frames, sheet metal, panels and cable harnesses.

### 33.6 Calculations

t_(PO,latest)=t_(need)−(LT_(supplier)+t_(transit)+t_(customs)+t_(IQC))

C_(landed)=P_(FOB)⋅FX⋅(1+d+f+c)

t_need = week the item is needed at assembly; LT = supplier lead time; t_IQC = incoming inspection; P_FOB = supplier price; FX = exchange rate; d, f, c = duty, freight and insurance, clearance as fractions (use the actual tariff and freight quotes for each item).

Example — laser source. Needed at integration in week 15 after PO; supplier lead time 12 weeks, transit 2, customs 1, incoming check 1 → latest PO in week −1, i.e. one week before the machine PO. The only ways out are a stock unit, a frame order at G1 under a cancellation clause, or a platform buffer stock.

Example — landed cost with illustrative rates d = 0.10, f = 0.03, c = 0.02: a source priced USD 20,000 at ₹85/USD lands at 20,000 × 85 × 1.15 = ₹19.6 lakh, before GST treatment. Replace the rates with actual tariff and quotes.

### 33.7 Industrial example — BOM extract for the laser marking cell

| Item | Level | Description | Class | Make / buy | Lead time (weeks) | Spare |
|---|---|---|---|---|---|---|
| LMC-2S | 0 | Laser marking cell, two-station shuttle | — | Make | — | — |
| M04 | 1 | Servo shuttle module | — | Make | — | — |
| M04-A01 | 2 | Carriage assembly | Custom | Make | 4 | — |
| M04-A01-003 | 4 | Locating pin ×8 g6, hardened | Custom | Buy to print | 2 | Yes (4) |
| M04-P010 | 4 | Ball screw ×20 × 20 lead, C5, 600 mm | Standard | Buy | 6 | No |
| M04-P020 | 4 | Servo motor 750 W, absolute encoder | Critical | Buy | 6 | Yes (1) |
| M08-P001 | 4 | Fiber laser source 50 W MOPA | Long-lead, critical, imported | Buy | 12 + import | No (service exchange) |
| M08-P002 | 4 | Galvo scanner 10 mm aperture | Long-lead, critical, imported | Buy | 8 + import | No |
| M08-P005 | 4 | Protective window | Standard | Buy | 2 | Yes (20) |
| M14-P001 | 4 | Safety PLC | Critical | Buy | 4 | No |

### 33.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Early long-lead ordering vs waiting for design freeze | Protects schedule | Avoids cancellation cost if design changes | Order early with specifications frozen for that item and a cancellation clause |
| Single vs multiple suppliers | Leverage, simpler quality | Resilience | Dual-source critical commodities; single-source only with a risk plan |
| Customer-specified brands vs builder standard | Customer maintains it | Builder reuses platform | Agree at G0; price the deviation |

### 33.9 Common mistakes

- BOM kept in a spreadsheet without revisions, so the shop builds to an old revision.
- Long-lead items discovered at BOM release.
- Customer-supplied items without dates in the contract.
- Forgetting spares and consumables in the BOM.
- Landed cost estimated from list price, missing duty, freight and exchange risk.

### 33.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Assembly stops for missing parts | Late BOM release, long-lead missed | Kitting shortage report | Shortage count by class | Expedite, substitute with approval | Long-lead list at G1 |
| Wrong revision built | Uncontrolled BOM, old drawings on floor | Compare build with released revision | Mismatch list | Rework, recall old drawings | PLM or controlled release |
| Cost overrun | Unplanned imports, currency moves | Compare actual vs target by class | Variance by item | Localize, renegotiate | Landed-cost model, hedging policy |

### 33.11 Design checklist

- BOM structured by module with item numbers and revisions
- Every line classified (standard, custom, long-lead, critical, customer-supplied, imported, localized)
- Make vs buy decided with reasons
- Long-lead and imported items ordered against the critical path
- Customer-supplied items listed with dates
- Spares and consumables flagged
- Landed cost computed for imported items

### 33.12 Key takeaways

- Structure the BOM by module; classify every line by risk and lead time.
- Long-lead items set the schedule; order them from Gate 1.
- Make what differentiates, buy what is standard, partner for build-to-print.
- Landed cost and currency exposure belong in the cost model.
