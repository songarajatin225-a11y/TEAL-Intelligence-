---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 43
part_title: "Part 34 — Supplier engineering"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 34 — Supplier engineering

A machine builder is only as good as its supply base. Send complete RFQ packages, evaluate suppliers on total cost (price plus quality, delay and service costs), qualify them with a first-article inspection, and develop the ones you depend on. The cheapest quote often loses once late deliveries are priced at what they really cost the project.

### 34.1 Objective

Build a qualified, measured supply base for custom parts and bought-in equipment, with RFQ, evaluation, qualification and incoming-inspection processes that keep quality and delivery predictable.

### 34.2 Engineering concept

| Stage | Purpose | Output |
|---|---|---|
| Identification | Find capable suppliers | Long list by commodity and region |
| RFQ | Obtain comparable offers | Quotes against one complete package |
| Technical evaluation | Can they make it right? | Capability assessment, sample results |
| Commercial evaluation | Total cost and terms | Total cost of ownership comparison |
| Qualification | Prove it on real parts | Audit, trial order, first-article inspection |
| Incoming inspection | Catch escapes | Sampling plan, inspection records |
| Performance monitoring | Keep them good | Scorecard: quality, delivery, cost, responsiveness |
| Development | Improve capability | Joint action plans, localization projects |

### 34.3 Architecture — supplier segmentation

| Segment | Examples | Relationship |
|---|---|---|
| Strategic OEM | Laser sources, galvos, robots, EFEMs, motion platforms | Framework agreements, roadmap sharing, service partnership |
| Precision build-to-print | Jig-bored nests, ground parts, granite, optics mounts | Qualified few, long-term, joint quality planning |
| General build-to-print | Frames, sheet metal, panels, harnesses | Several qualified, competitive, capacity-driven |
| Catalogue distributors | Pneumatics, sensors, fasteners, electrical | Price agreements, stock commitments |

Indian precision-machining and fabrication clusters (Bengaluru, Pune, Chennai, Coimbatore, Hosur and others) give local options for most build-to-print commodities; optics, laser sources and many precision motion components are still largely imported (Part 52).

### 34.4 Components — RFQ templates

RFQ template A — build-to-print parts

| # RFQ-[number] — [module / part family] Issued: [date] · Quote due: [date] · Buyer: [name] · Engineer: [name]  ## 1. Scope \| Item \| Drawing no. \| Rev \| Material \| Finish \| Qty per machine \| Annual qty \|  ## 2. Technical requirements - Drawings and 3D models (attached, controlled revision) - Critical characteristics (marked on drawings) and required Cpk - Material and coating certificates required - Heat treatment / stress relief requirements - Cleanliness, packaging and marking requirements  ## 3. Quality requirements - First-article inspection report with ballooned drawing - Inspection equipment for critical characteristics (CMM / gauges) - Nonconformance handling and change notification  ## 4. Commercial - Unit price by quantity break, tooling / fixture cost, validity - Lead time for first article and for series - Payment and delivery terms (Incoterms), warranty  ## 5. Supplier response - Deviations to drawing or specification (list each) - Process route and machine list for critical features - Capacity and single points of failure |
|---|

RFQ template B — bought-in equipment (laser source, robot, camera, EFEM)

| # RFQ-[number] — [equipment type]  ## 1. Application summary Process, part, rate, environment, integration context (no customer confidential data without NDA)  ## 2. Technical specification and compliance matrix \| Req ID \| Requirement \| Value / range \| Mandatory? \| Supplier value \| Comply Y/N \| Evidence \|  ## 3. Interfaces Mechanical (mounting, datum), electrical (supply, I/O, safety), communication (protocol, SDK), utilities (cooling, air)  ## 4. Safety and compliance Applicable standards, certifications, documentation, laser class / safety functions  ## 5. Service and lifecycle Warranty, local service in India, spare parts and lead times, exchange units, obsolescence notice, training  ## 6. Commercial Price, lead time, delivery terms, payment, framework pricing for volumes  ## 7. Trial / demo Application test on our samples: conditions and report format |
|---|

### 34.5 Design methodology

- Segment the BOM by commodity (Part 33) and list candidate suppliers per segment.
- Issue RFQs with complete packages (templates above); never quote from partial drawings.
- Evaluate technically: machines, metrology, process capability, quality system, references, sample parts.
- Evaluate commercially on total cost of ownership (34.6).
- Qualify: audit, trial order, first-article inspection of every characteristic.
- Set incoming inspection: critical characteristics 100%, others by sampling (for example ISO 2859-1 plans); reduce with proven performance.
- Measure monthly: ppm, on-time delivery, response time; review quarterly.
- Develop key suppliers: shared improvement plans, tooling support, localization roadmaps.

### 34.6 Calculations

S_j=(∑w_is_(ij))/(∑w_i)

TCO=P+C_(landed)+ppm⋅10^(−6) N C_(defect)+(1−OTD) C_(late)+C_(service)

ppm = defect rate (parts per million); N = parts per lot; C_defect = cost of a defect found at assembly; OTD = on-time delivery rate; C_late = cost to the project of one late lot.

TCO example — 50-part lot of machined parts. Defect found at assembly costs ₹3,000.

| Supplier | Unit price | Lot price | ppm | OTD | Late-lot cost ₹25,000 (normal) | Late-lot cost ₹1,00,000 (critical path) |
|---|---|---|---|---|---|---|
| A | ₹2,000 | ₹1,00,000 | 2,000 | 98% | ₹1,00,000 + 300 + 500 = ₹1,00,800 | ₹1,00,000 + 300 + 2,000 = ₹1,02,300 |
| B | ₹1,840 | ₹92,000 | 15,000 | 85% | ₹92,000 + 2,250 + 3,750 = ₹98,000 | ₹92,000 + 2,250 + 15,000 = ₹1,09,250 |

B is cheaper for off-critical-path parts; A is cheaper for parts on the critical path. Segment sourcing decisions by schedule criticality, not by unit price.

### 34.7 Industrial example — evaluating three laser-source offers

Suppliers anonymized; weights agreed before offers were opened.

| Criterion | Weight | Supplier X | Supplier Y | Supplier Z |
|---|---|---|---|---|
| Process result on our samples | 30 | 5 | 4 | 4 |
| Stability and monitoring features | 15 | 4 | 4 | 3 |
| Integration (interfaces, SDK) | 10 | 4 | 5 | 3 |
| Local service and spares in India | 15 | 3 | 5 | 4 |
| Lead time | 10 | 3 | 4 | 5 |
| Price (landed) | 20 | 3 | 3 | 5 |
| Weighted score | 100 | 3.85 | 4.05 | 4.05 |

The scores are within 0.2, so the decision rests on the discriminating criterion: the process result. Supplier X achieved the best code grade on cast aluminium; Y and Z passed but with less margin. The team chose Y as primary (process pass plus the strongest local service) and qualified X as second source for high-contrast variants.

### 34.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Lowest price vs lowest TCO | Visible saving | Real saving | Always compare TCO for critical and critical-path items |
| Few deep partners vs many suppliers | Capability growth, trust | Competition, resilience | Deep partners for precision and strategic items; competition for general items |
| Global OEM vs local supplier | Proven product | Service, lead time, cost, currency | Local where qualified; global where performance is unmatched, with local service |

### 34.9 Common mistakes

- RFQs with incomplete drawings; quotes are then not comparable.
- Qualifying on a single perfect sample.
- No first-article inspection, so the first problem appears in assembly.
- Measuring suppliers only on price.
- Sharing customer confidential information without an NDA chain.

### 34.10 Troubleshooting

| Symptom | Possible causes | Diagnostic test | Measurement | Corrective action | Preventive action |
|---|---|---|---|---|---|
| Repeated nonconforming parts | Process not capable, drawing ambiguity | Capability study at supplier | Cpk of critical features | 8D with supplier; fixture or process change | FAI plus Cpk requirement in RFQ |
| Late deliveries | Capacity, material shortage, priority | Supplier load review | OTD trend | Split orders, second source | Capacity check at qualification |
| Quality drops after a good start | Process or personnel change not notified | Compare process records | Change log | Change-notification clause, audit | Change control in agreement |

### 34.11 Design checklist

- Commodities segmented; supplier long list per segment
- RFQ packages complete (drawings, criticals, quality, commercial)
- Evaluation criteria and weights fixed before opening offers
- TCO comparison for critical and critical-path items
- Qualification: audit, trial order, first-article inspection
- Incoming inspection plan by characteristic class
- Scorecards reviewed quarterly; development plans for key suppliers

### 34.12 Key takeaways

- Complete RFQ packages make quotes comparable.
- Compare total cost, including defect and delay costs, not unit price.
- Qualify by first-article inspection of every characteristic.
- Develop the suppliers you depend on; they are part of your platform.
