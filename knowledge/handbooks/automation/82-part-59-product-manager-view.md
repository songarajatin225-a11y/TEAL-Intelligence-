---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 82
part_title: "Part 59 — Product manager view"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 59 — Product manager view

An automation equipment product manager owns the answer to one question: which machines should we build, for whom, at what price and cost, on which platform — and how do we make the second unit cheaper, faster and more reliable than the first? That requires working knowledge of every dimension below, a roadmap that moves an application from customer problem to scale, and numbers: customer payback, gross margin, lifecycle revenue, and engineering hours per unit.

### 59.1 Objective

Give product managers the dimensions, questions, artefacts, KPIs and roadmap process that turn engineering capability into a profitable equipment portfolio.

### 59.2 What an equipment product manager must know

| Dimension | Questions to answer | Artefact | KPI |
|---|---|---|---|
| Market | Which industries and applications, what size, what growth, who competes? | Market map, segment sizing | Pipeline by segment |
| Customer | Who buys, who uses, who approves; what is their pain in money? | Customer profiles, VOC library | Win rate, repeat orders |
| Application | Which processes, CTQs, rates and variants recur? | Application catalogue with process windows | Application success rate at FAT |
| Technology | What is proven, what is risky, what is differentiating? | Technology roadmap, trial database | Share of quotes needing new technology |
| Product | Which configurations, options, and platform boundaries? | Platform definition, configurator | Standard-content ratio |
| Cost | What does each module cost and why? | Cost model by module (Part 45) | Gross margin, cost vs target |
| Supplier | Which critical suppliers, what risks, which second sources? | Supplier map, localization roadmap | Landed cost trend, OTD |
| Engineering | How many hours per machine, where are they spent? | Hours by module, reuse ratio | Engineering hours per unit |
| Manufacturing | Build time, capacity, quality at FAT? | Build data, first-time-right | Build hours, FAT pass rate |
| Quality | Field failures, warranty cost, capability delivered? | Field data, 8D reports | Warranty cost % of revenue |
| Certification | Which regulations and customer standards in each market? | Compliance map (Part 56) | Certification lead time |
| Sales | Value proposition, pricing, proposal quality? | Value calculator, proposal templates | Quote-to-order cycle time |
| Service | Installed base, spares, AMC, upgrades? | Service catalogue, installed-base register | Service revenue share, response time |

### 59.3 Architecture — the product roadmap

*Figure 14. Product roadmap · 3 phases, 9 stages, 2 gates* — [Figure not transcribed; see source document]

Most equipment companies stall between pilot and productization: the first machine works, but the second costs as much engineering as the first. Productization — platform modules, cost targets, standard documentation, service readiness — is where the product manager earns the role.

| Stage | Entry | Exit evidence | Typical risks |
|---|---|---|---|
| Customer problem | Customer contact, market signal | Pain quantified in money; budget holder identified | Solving a problem nobody pays for |
| Application | Problem confirmed | Process, CTQs, volumes, variants documented | Vague requirements |
| Technology | Application defined | Feasibility on real samples; process window | Physics does not cooperate |
| Prototype | Feasibility shown | Lab cell proves process at representative rate | Rate or stability not reached |
| Proof of concept | Prototype works | Customer parts meet CTQs; customer sign-off | Sample representativeness |
| Pilot | PoC accepted | First machine in production at SAT criteria | Hidden site and integration issues |
| Productization | Pilot successful | Platform modules, cost target, documents, service package | Treating the pilot as the product |
| Production | Product released | Repeatable build, FAT first-time-right, service in place | Capacity, supplier scaling |
| Scale | Repeatable product | Channels, localization, variants, geographic expansion | Complexity creep |

### 59.4 Components — the business case

| Element | Content |
|---|---|
| Customer value | Savings, quality gains, capacity, compliance; customer payback |
| Pricing | Value-based ceiling, competitive position, cost-plus floor |
| Unit economics | Cost by module, margin, learning curve, platform effect |
| Lifecycle revenue | Spares, consumables, AMC, upgrades over machine life |
| Investment | Platform development, prototypes, certification |
| Risks | Technical, market, supply, regulatory |

### 59.5 Design methodology

- Build an application catalogue from every inquiry, won or lost.
- Rank applications by recurrence, value and fit with the platform.
- Move the top applications through the roadmap with stage gates.
- Price by customer value, protected by a cost-plus floor.
- Invest in productization after the first successful pilot, not after the fifth.
- Track KPIs quarterly; kill or pivot applications that stall.

### 59.6 Calculations

P_(max)=PB_(target)⋅S_(annual)

P_(min)=(C)/(1−GM_(min))

R_(life)≈P⋅r_(service)⋅Y

Example: the Part 1 automatic cell saves the customer ₹54.6 lakh per year; with a 2-year payback target the value ceiling is ₹109 lakh. The platform-derived cost of ₹62.1 lakh gives a 30%-margin floor of ₹88.7 lakh (₹92.7 lakh including warranty provision). A price near ₹93 lakh gives the customer a 1.7-year payback and the builder its margin. If service and spares run at 3–5% of price per year over 10 years, lifecycle service revenue is 30–50% of the original price — an argument for designing serviceability and remote support into the platform.

### 59.7 Industrial example — a laser-marking product line

A TEAL-type laser vertical sees recurring inquiries for marking automotive parts, PCBs, battery modules and semiconductor packages. The product manager defines one marking platform (Part 51) with handling options and process heads, prices it by application value, and uses special machines only where the platform cannot reach — each special reviewed for promotion into the platform. KPIs: standard content > 70%, gross margin ≥ 30%, FAT first-time-right ≥ 90%, service revenue ≥ 15% of vertical revenue within three years (targets to be set by the business).

### 59.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Say yes to specials vs protect the platform | Revenue now | Scalability later | Accept specials that teach a recurring application; price the rest honestly |
| Value-based vs cost-plus pricing | Captures value | Simple, defensible | Value-based with a cost floor |
| Broad portfolio vs focus | More inquiries addressed | Depth, reuse, reputation | Focus on applications where the platform wins |

### 59.9 Common mistakes

- Treating every inquiry as a new product.
- Pricing from cost alone and leaving customer value on the table.
- Declaring a pilot machine a product.
- Ignoring service revenue and serviceability in the business case.

### 59.10 Troubleshooting

| Symptom | Likely cause | Correction |
|---|---|---|
| Margins fall as volume grows | Specials, no platform reuse | Productization plan; configurator; special-machine pricing rules |
| Low win rate | Value not quantified for customers | Value calculator in every proposal |
| Long delivery times | Engineering on the critical path | Platform modules, long-lead buffer stock |

### 59.11 Design checklist

- Application catalogue maintained from all inquiries
- Roadmap stage and gate status for each application
- Value-based price with cost floor for each offer
- Platform content and reuse ratio tracked
- Lifecycle revenue plan per product
- Quarterly KPI review

### 59.12 Key takeaways

- The product manager's job is to make the second machine cheaper and faster than the first.
- Move applications through discover, prove and scale with explicit gates.
- Price on customer value, protected by a cost floor.
- Productization is where equipment businesses win or stall.
