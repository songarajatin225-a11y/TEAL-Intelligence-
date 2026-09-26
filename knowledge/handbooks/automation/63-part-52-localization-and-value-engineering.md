---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 63
part_title: "Part 52 — Localization and value engineering"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 52 — Localization and value engineering

Localization lowers cost, lead time and currency exposure, but only when each localized part is qualified as rigorously as the import it replaces — and, for automotive and semiconductor customers, only after the customer has been notified or has approved. Pair it with value engineering: remove cost where it does not buy function, then localize what remains.

### 52.1 Objective

Run a structured localization and cost-down programme that reduces machine cost and lead time without reducing performance, reliability or customer confidence.

### 52.2 Engineering concept

| Lever | What it does | Example |
|---|---|---|
| Value engineering | Improves the ratio of function to cost | Replace a custom casting with a standard profile where stiffness allows |
| Design-to-cost | Sets module cost targets before design | Enclosure target ₹2.5 lakh for frame size M |
| Specification right-sizing | Removes over-specification | ISO 2768-m instead of ±0.01 mm on non-functional features |
| Alternate vendors and second sources | Competition and resilience | Two qualified machining partners per commodity |
| Localization | Replace imports with Indian-made parts | Enclosures, harnesses, fixtures, conveyors, some motion components |
| Supplier development | Build capability at partners | Joint process improvement, fixtures, metrology support |
| Technology localization | Develop core technology in India | Laser sources, scanners, optics with industrial and academic partners |

### 52.3 Architecture — localization framework

| Step | Activities | Evidence | Typical duration |
|---|---|---|---|
| 1. Imported component | Rank imports by landed cost, lead time, currency risk, strategic importance | Import spend analysis | — |
| 2. Local supplier identification | Search clusters, associations, trade shows; screen capability | Long list, capability screening | 2–6 weeks |
| 3. Technical qualification | Audit, drawings and specs, process review, sample parts | Audit report, sample inspection | 4–8 weeks |
| 4. Prototype | Build parts or units to full specification | First-article inspection | 4–12 weeks |
| 5. Validation | Performance, life, environmental and interchangeability tests on a machine | Test reports vs import baseline | 4–16 weeks |
| 6. Customer qualification | Notify or seek approval where required; trial on customer machines | Customer approval or acknowledgement | 2–12 weeks |
| 7. Production localization | Series orders, incoming control, second source kept warm | Scorecards, field data | Ongoing |

### 52.4 Components — localization landscape (indicative, India)

| Category | Local maturity | Notes |
|---|---|---|
| Frames, sheet metal, machining, panels, harnesses, fixtures | High | Qualify for precision and cleanliness where needed |
| Conveyors, standard handling modules | High | Standard designs available |
| Pneumatics, sensors, PLCs, servo drives | Medium to high (local manufacturing or assembly by several global and Indian brands) | Check what is made locally vs imported and rebranded |
| Linear guides, ball screws, granite bases | Medium | Several suppliers; validate accuracy and life |
| Industrial robots | Low to medium (local assembly by some makers) | Service capability is often the deciding factor |
| Laser sources, galvo scanners, precision optics, linear motors, EFEMs | Low (largely imported) | Strategic technology localization candidates |

### 52.5 Design methodology

- Build the import-spend Pareto per platform module.
- Run value-engineering workshops per module: function list, cost per function, ideas.
- Select localization candidates by savings, lead-time gain, risk and strategic value.
- Run the seven-step framework with gates and evidence.
- Keep the import as qualified second source until field data proves the local part.
- Notify customers per their change-notification requirements; semiconductor and automotive customers often require formal approval for supplier or material changes.
- Track savings, quality and delivery; report quarterly.

### 52.6 Calculations

V=(F)/(C)

S_(year)=(C_(import,landed)−C_(local)) N_(year)−C_(qual)/n_(years)

PB=(C_(qual))/((C_(import,landed)−C_(local)) N_(year))

V = value index (function over cost); S_year = annual net saving; C_qual = qualification cost amortized over n years; PB = payback in years.

Example — Class 1 enclosure for the frame-M platform. Imported panel set landed at ₹4.0 lakh; local fabrication and laser-safe window sourcing ₹2.6 lakh; qualification (prototype, laser-guard testing, first article) ₹3.0 lakh; 20 machines per year → annual gross saving ₹28 lakh; payback 3.0 / 28 = 0.11 years (about six weeks of production).

Example — value engineering by module (marking cell).

| Module | Share of cost | Share of customer-valued function | Value signal | Action |
|---|---|---|---|---|
| Enclosure and guarding | 14% | 8% | Cost > function | Localize, standardize panel sizes |
| Laser source and head | 33% | 40% | Balanced | Keep; second source |
| Handling (shuttle, nests) | 20% | 25% | Balanced | Platform module |
| Controls and software | 18% | 17% | Balanced | Framework reuse |
| Documentation and testing | 15% | 10% | Cost > function | Templates, proven protocols |

### 52.7 Industrial example — localizing a servo shuttle module

- Step 1: the imported pre-assembled axis module cost ₹2.1 lakh landed with 10 weeks' lead time.
- Steps 2–3: two local precision-machining partners qualified; guides and screws sourced from a supplier with local stock.
- Step 4: prototype built with the platform's own carriage design; first article passed.
- Step 5: 500,000-cycle endurance test, repeatability ±4 µm before and after, thermal run.
- Step 6: customers with change-notification clauses informed with test reports.
- Step 7: local module at ₹1.3 lakh and 4 weeks' lead time; the imported module kept as second source.

### 52.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Local vs imported | Cost, lead time, currency, service | Proven performance, brand trust | Localize with evidence; keep import as fallback until field data is in |
| Single vs second source | Leverage, simplicity | Resilience | Second source for critical, long-lead and imported items |
| Specification relaxation vs margin | Lower cost | Robustness | Relax only where the error budget and FMEA show margin |
| Buy technology vs develop | Fast, proven | Strategic independence, margin | Develop where it differentiates the platform and demand is sustained |

### 52.9 Common mistakes

- Localizing on price alone, skipping validation.
- Changing suppliers without telling customers who require notification.
- Dropping the import source before field data proves the local part.
- Cost-down by specification cuts that erode margin in the error budget.
- One-time savings reported as recurring.

### 52.10 Troubleshooting

| Symptom | Possible causes | Corrective action | Preventive action |
|---|---|---|---|
| Local part fails in field | Validation too short or too narrow | Contain with import source; extend testing | Validation plan with life and environmental tests |
| Savings not realized | Hidden costs (inspection, rework, scrap) | Total cost review | TCO method (Part 34) |
| Customer rejects change | Notification or approval missing | Provide data, requalify | Change-notification process in localization steps |

### 52.11 Design checklist

- Import-spend Pareto and value-engineering workshop per module
- Seven-step framework with evidence at each step
- Validation against the import baseline (performance, life, environment)
- Customer notification or approval where required
- Second source retained until field data proves the local part
- Savings tracked on total cost, reported quarterly

### 52.12 Key takeaways

- Remove cost that does not buy function, then localize what remains.
- Qualify local parts as rigorously as imports.
- Respect customers' change-notification rules.
- Keep a second source until the field proves the change.
BOOK X
