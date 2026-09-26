---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 14
part_title: "Parts XXVII–XXIX — Business models, fab economics and yield"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Parts XXVII–XXIX — Business models, fab economics and yield

## Part XXVII — Semiconductor business models

L1 summary. The industry disaggregated from vertically integrated IDMs into specialists: fabless designers, foundries, OSATs, equipment and materials suppliers, EDA and IP vendors, EMS assemblers and OEMs. Money flows from end customers down this chain; margins and capital intensity differ sharply by position.

| Model | What it sells | Customers | Revenue model | Capital intensity | Typical margin profile (qualitative) | Examples |
|---|---|---|---|---|---|---|
| IDM | Chips it designs and makes | OEMs, distributors | Product sales | Very high | Varies — analog IDMs historically high gross margin; memory cyclical | Intel, Samsung, TI, Infineon, STMicro, Micron, SK hynix |
| Fabless | Chips (design + brand) | OEMs, hyperscalers | Product sales | Low (buys wafers) | High when differentiated | NVIDIA, Qualcomm, AMD, Broadcom, MediaTek |
| Foundry | Wafer manufacturing service | Fabless, IDMs, system companies | Price per wafer (+ masks, packaging) | Extreme | High at leading edge; lower at mature nodes | TSMC, Samsung Foundry, GlobalFoundries, UMC, SMIC, Tower |
| OSAT | Assembly and test services | Fabless, IDMs, foundries | Price per unit / per test-second | Medium | Lower than foundry | ASE, Amkor, JCET, Tongfu, PTI |
| ATMP (India policy term) | Same as OSAT; includes captive back-end (e.g., Micron) | — | — | Medium | — | Micron Sanand, TSAT |
| Equipment OEM | Process and test tools + service | Fabs, OSATs | Tool sales + service/spares/upgrades (installed base) | R&D-heavy | High | ASML, Applied, Lam, TEL, KLA, Advantest |
| Materials supplier | Wafers, chemicals, gases, consumables | Fabs, OSATs | Recurring volume sales | Medium–high | Moderate–high | Shin-Etsu, Entegris, JSR, Linde |
| EDA | Design software | Chip designers | Term licences / subscriptions | Low capex, high R&D | Very high | Synopsys, Cadence, Siemens EDA |
| IP | Reusable design blocks | Chip designers | Upfront licence + per-unit royalty | Low | Very high | Arm, Synopsys IP, Cadence IP, Imagination, SiFive |
| Design services | Engineering capacity | Fabless, OEMs | Time and materials / fixed price | Low | Moderate | Tata Elxsi, L&T Semiconductor Tech (design), eInfochips, Wipro, HCLTech |
| EMS / ODM | Board and product assembly | OEMs | Per-unit assembly margin | Medium | Low (single-digit operating) | Foxconn, Jabil, Flex, Dixon |
| OEM | Branded product | Consumers, enterprises | Product sales | Varies | Varies | Apple, Dell, Tesla |
| Hyperscaler / system company | Cloud services; designs own chips | Their own data centres | Service revenue; chips are cost centre | Very high (data centres) | — | Google (TPU), AWS (Trainium, Graviton), Microsoft (Maia, Cobalt), Meta (MTIA) |

## Part XXVIII — Economics of a semiconductor fab

L1 summary. A fab is a capital-depreciation machine. Equipment is typically ~70–80 % of fab capex; depreciation is often the single largest cost per wafer; utilisation and yield decide profitability. Leading-edge fabs cost tens of billions of dollars; mature 200 mm fabs are fully depreciated and profitable at low wafer prices.

### 28.1 Cost structure (typical, indicative)

| Item | Share / range | Notes |
|---|---|---|
| Capex — building, cleanroom, utilities | ~20–30 % of total fab capex | Cleanroom + sub-fab + CUB + UPW + gas systems |
| Capex — equipment | ~70–80 % | Litho the largest block at advanced nodes |
| Depreciation | Often 30–50 %+ of wafer cost in early years | 5-year straight-line for tools is common |
| Materials and consumables | ~10–20 % of wafer cost | Wafers, chemicals, gases, targets, slurries, masks amortised |
| Labour | ~5–15 % | Varies strongly by country and automation |
| Utilities | ~5–10 % | Electricity, water, gases |
| Maintenance and spares | ~5–10 % | Service contracts, parts |

### 28.2 Illustrative fab economics model

All inputs are illustrative assumptions for a hypothetical 300 mm, 28 nm-class foundry fab, chosen to demonstrate the mechanics — not data for any real fab.

| Assumption | Value |
|---|---|
| Capacity | 40 000 wafer starts per month (WSPM) = 480 000 wafers/year |
| Total capex | $10 bn (building/utilities $2.5 bn; equipment $7.5 bn) |
| Depreciation | Equipment 5 years straight-line; building 20 years |
| Utilisation | 85 % |
| Cash cost per wafer (materials, labour, utilities, maintenance) | $1 300 |
| Die size | 50 mm² |
| Defect density D₀ | 0.1 defects/cm² |
| Average selling price per wafer | $3 000 |

Calculations:

Annual depreciation = 7.5/5 + 2.5/20 = $1.5 bn + $0.125 bn = $1.625 bn.

Wafers out per year = 480 000 × 0.85 = 408 000.

Depreciation per wafer = 1.625 bn / 408 000 ≈ $3 980.

Total cost per wafer ≈ 3 980 + 1 300 = $5 280 — above the $3 000 ASP during the depreciation period.

After tools are fully depreciated (year 6+), cost per wafer ≈ 1 300 + 306 (building) ≈ $1 610 → gross margin ≈ 46 %.

Gross die per 300 mm wafer (standard approximation):

DPW≈(π(d/2)^2)/(A)-(πd)/(√(2A))

With d = 300 mm, A = 50 mm²: 70 686/50 − 942.5/10 ≈ 1 414 − 94 ≈ 1 320 gross die.

Yield (Poisson, see Part XXIX): Y = e^(−0.5 cm² × 0.1) ≈ 95 % → ~1 254 good die.

Cost per good die ≈ $5 280 / 1 254 ≈ $4.2 during depreciation; ≈ $1.3 after.

What the model teaches: (1) new fabs lose money on a mature-node pricing basis until equipment depreciates — which is why subsidies target capex; (2) utilisation below ~80 % is punishing because depreciation is fixed; (3) yield and die size matter more than headline wafer price.

### 28.3 Resource intensity (orders of magnitude, fab-specific)

| Resource | Large 300 mm fab |
|---|---|
| Power | Tens to hundreds of MW |
| Water | Tens of thousands of m³/day intake (recycling reduces net) |
| Cleanroom | Tens of thousands of m² per phase |
| Headcount | Several thousand direct employees |
| Build time | ~2–4 years from ground-breaking to volume |

## Part XXIX — Yield

L1 summary. Yield is the share of product that works. Because cost per good die = cost per wafer ÷ good die, yield is the lever that moves margin fastest. Fabs spend years ramping yield on a new process — “yield learning” — and yield is one of the most closely guarded numbers in the industry.

### 29.1 Yield definitions

| Yield type | Definition | Typical drivers |
|---|---|---|
| Line (wafer) yield | Wafers completing the process ÷ wafers started | Breakage, scrap, misprocessing |
| Die (sort) yield | Good die ÷ gross die at wafer sort | Random defects, systematic (design-process) failures |
| Parametric yield | Die meeting speed/power/leakage specs | Process variation |
| Assembly yield | Good packages ÷ die assembled | Bonding, moulding, handling defects |
| Final test yield | Passing units ÷ units tested | Escapes from sort, package-induced failures |
| Overall | Product of all the above | — |

### 29.2 Yield mathematics

Poisson model (random, uniformly distributed defects):

Y=e^(-AD_0)

Murphy’s model (more realistic when defect density varies):

Y=((1-e^(-AD_0))/(AD_0))^2

Negative binomial (industry standard; α = clustering parameter):

Y=(1+(AD_0)/(α))^(-α)

where A is die area (cm²) and D₀ defect density (defects/cm²).

Worked examples (Poisson, D₀ = 0.1/cm²):

| Die area | A·D₀ | Yield |
|---|---|---|
| 0.5 cm² (phone-class SoC-sized chiplet) | 0.05 | ~95 % |
| 1 cm² | 0.1 | ~90 % |
| 6 cm² | 0.6 | ~55 % |
| 8 cm² (near reticle limit) | 0.8 | ~45 % |

This is the mathematical reason for chiplets: splitting one 8 cm² die into four 2 cm² dies raises die yield from ~45 % to ~82 % each — provided known-good-die testing and packaging yield keep up.

Why yield dominates: a 10-point yield gain on a large die can be worth more than a node shrink; early in a node, D₀ is high and falls along a learning curve as defect sources are eliminated.

Key takeaways — Parts XXVII–XXIX

Disaggregation created specialists; each position has distinct capital and margin economics.

Fab profitability is depreciation, utilisation and yield.

Yield falls exponentially with die area × defect density — the economic engine behind chiplets.

Glossary terms introduced: WSPM, utilisation, depreciation, cash cost, ASP, gross die, DPW, D₀, Poisson/Murphy/negative-binomial yield, parametric yield, yield learning, hyperscaler, royalty.
