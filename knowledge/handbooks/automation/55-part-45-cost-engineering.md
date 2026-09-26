---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 55
part_title: "Part 45 — Cost engineering"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 45 — Cost engineering

A machine's price must cover its bill of materials, the hours to engineer, build, test and install it, overheads, warranty and risk — and still leave margin. Build the cost model by module from Gate 1 (±30%) and tighten it at Gate 2 (±15%) and Gate 3 (±5–10%). In the worked example, a platform-derived machine costs about 22% less than a first-of-kind build of the same specification, almost all of it in engineering, software and contingency.

### 45.1 Objective

Estimate, control and reduce the cost of a machine, set a price that meets the target gross margin, and show where platform reuse and localization change the economics.

### 45.2 Engineering concept

Machine cost = mechanical + electrical + controls + motion + vision + robot + process module + laser + software + assembly + engineering + testing + overheads, plus warranty provision and risk contingency. Price follows from cost and target gross margin; service revenue (spares, AMC, upgrades) is a separate stream over the machine's life.

| Cost element | Contents | Main driver |
|---|---|---|
| BOM cost | Purchased and made parts, landed | Specification, localization, volume |
| Engineering cost | Design, calculations, drawings, project management | Novelty, platform reuse |
| Software cost | PLC, HMI, vision, MES interface | Library reuse, interface complexity |
| Manufacturing (assembly) cost | Assembly, wiring, panel build hours | DFA, modularity, learning |
| Integration and testing cost | Debug, calibration, FAT, SAT, travel | Process maturity, customer requirements |
| Overheads | Facilities, tools, administration, finance | Company structure |
| Warranty | Expected parts and labour during warranty | Reliability, contract terms |
| Contingency | Priced risk | Technical and schedule uncertainty |

### 45.3 Architecture — estimate maturity by gate

| Gate | Basis | Accuracy |
|---|---|---|
| G1 concept | Module costs from past machines, parametric estimates | ±30% |
| G2 architecture | Module specs, key quotes for long-lead items | ±15% |
| G3 detailed design | Released BOM with quotes, hour estimates by task | ±5–10% |
| After SAT | Actuals | Post-calculation for learning |

### 45.4 Components — cost model structure

| Line | Unit | Source |
|---|---|---|
| BOM by module (Part 33) | ₹ | Quotes, catalogues, landed-cost model |
| Engineering hours by discipline | h × rate | Task estimate, history |
| Software hours | h × rate | Library reuse percentage |
| Assembly and wiring hours | h × rate | DFA estimate, learning curve |
| Testing (FAT, SAT, travel, samples) | ₹ | Protocol scope |
| Overheads | % | Company rate |
| Warranty provision | % of price | Field data |
| Contingency | % of cost | Risk register (Part 46) |

### 45.5 Design methodology

- Build a module-level estimate at G1 from historical data.
- Replace estimates with quotes for the top 20% of items that make up about 80% of BOM cost.
- Estimate hours per task, adjusted for platform reuse.
- Price risks from the risk register as contingency.
- Compute cost, then price at the target gross margin; compare with the customer's budget and payback (Part 1).
- If price exceeds budget, value-engineer (Part 52) before discounting margin.
- Track actuals during the project; post-calculate after SAT and update the historical database.

### 45.6 Calculations

P=(C_(total))/(1−GM−w)

C_n=C_1⋅n^(log_2b)

GM=(P−C)/(P)

P = price; C_total = cost including contingency; GM = target gross margin; w = warranty provision as a fraction of price; C_n = labour hours or cost of the n-th build with learning rate b (0.80–0.90 typical). Example: 450 assembly hours on the first unit with an 85% learning curve → fourth unit 450 × 0.85² = 325 h.

### 45.7 Industrial example — cost model of the laser marking cell

Indicative 2026 India-build figures in ₹ lakh; hours at ₹2,500/h (engineering, software) and ₹1,000/h (assembly).

| Cost element | First-of-kind | Platform-derived | Notes |
|---|---|---|---|
| Mechanical (frame, plates, nests, pneumatics, guards, enclosure) | 9.0 | 9.0 |  |
| Electrical (panel, cabling, supplies, cooling unit) | 4.5 | 4.5 |  |
| Controls (PLC, safety PLC, HMI, IPC, network) | 4.0 | 4.0 |  |
| Motion (two servo axes, screws, guides) | 3.5 | 3.5 |  |
| Vision (DPM verifier, lighting) | 2.5 | 2.5 |  |
| Robot | 0.0 | 0.0 | Optional year-3 upgrade |
| Process module (galvo, F-theta, Z-axis, fume, height sensor) | 6.0 | 6.0 |  |
| Laser source 50 W MOPA (landed) | 5.5 | 5.5 | Imported |
| BOM subtotal | 35.0 | 35.0 |  |
| Software | 6.3 (250 h) | 4.0 (160 h) | Library reuse |
| Assembly and wiring | 4.5 (450 h) | 4.5 (450 h) | Learning curve lowers later units |
| Engineering and project management | 17.5 (700 h) | 7.5 (300 h) | Platform modules reused |
| Testing (FAT, SAT, travel, samples) | 4.0 | 3.0 | Proven test protocols |
| Direct cost | 67.3 | 54.0 |  |
| Overheads at 10% | 6.7 | 5.4 |  |
| Contingency | 5.4 (8%) | 2.7 (5%) | From risk register |
| Total cost | 79.4 | 62.1 | Platform 22% lower |
| Price at 30% GM, 3% warranty | 118.5 | 92.7 | P = C / (1 − 0.30 − 0.03) |

The first-of-kind price would exceed most customers' budget for this capability; the platform-derived price near ₹93 lakh is consistent with a payback under two years (Part 1). Platform reuse is a pricing strategy, not just an engineering convenience.

### 45.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Price to margin vs price to market | Protects margin | Wins orders | Price to market only with a cost-down plan (Part 52) |
| Contingency in price vs separate risk pricing | Simple | Transparent options | Separate priced options for customer-driven risks |
| Imported vs local components | Proven | Lower landed cost, currency hedge | Localize after qualification |

### 45.9 Common mistakes

- Estimating only BOM and treating engineering as free.
- Pricing first-of-kind machines with platform hours.
- No contingency for technical novelty.
- Forgetting landed costs and currency on imports.
- No post-calculation, so estimates never improve.

### 45.10 Troubleshooting — cost overruns

| Symptom | Possible causes | Diagnostic test | Corrective action | Preventive action |
|---|---|---|---|---|
| Engineering hours double | Novel process, late changes | Hours by task vs estimate | Freeze scope, change orders | Novelty-adjusted estimates, change control |
| BOM over budget | Late specification growth, imports | BOM variance by module | Value engineering, alternate vendors | Quotes for top items at G2 |
| Testing overrun | FAT failures, repeated trips | Trip and test log | Internal dry-run discipline | Gate 8 readiness criteria |

### 45.11 Design checklist

- Module-level cost model with estimate class per gate
- Quotes for the top 20% of BOM cost items
- Hours estimated by discipline with reuse assumptions stated
- Contingency linked to the risk register
- Warranty provision and service revenue modelled
- Price tested against customer payback
- Actuals tracked and post-calculated

### 45.12 Key takeaways

- Cost is BOM plus hours plus risk; hours are where platforms win.
- Tighten the estimate at every gate with real quotes.
- Price from cost and margin, then test against customer payback.
- Post-calculate every machine to improve the next estimate.
