---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 4
part_title: "Part II — From sand to electronic-grade silicon"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part II — From sand to electronic-grade silicon

## Chapter 3 — Silicon raw materials

L1 summary. Chips are not made from beach sand. They start from high-purity quartz or quartzite (SiO₂), reduced with carbon to ~98–99 % metallurgical-grade silicon, then chemically converted to a volatile chlorosilane, distilled, and redeposited as 9N–11N polysilicon. Each step raises purity by orders of magnitude and adds most of the cost.

| Material | Chemistry | Purity | Role |
|---|---|---|---|
| Quartz / quartzite | SiO₂, crystalline | Industrial lump quartz ≥ ~99 %; ultra-high-purity quartz is a separate premium grade | Feedstock for MG-Si; UHP quartz also makes crucibles |
| Silica | SiO₂ (any form) | Varies | Generic term; includes sand (too impure for MG-Si routes in most cases) |
| Metallurgical-grade Si (MG-Si) | Si | ~98–99.5 % (≈2N) | Aluminium alloys, silicones; feedstock for polysilicon |
| Solar-grade polysilicon | Si | ~6N–9N | PV wafers |
| Electronic-grade polysilicon (EG-Si) | Si | 9N–11N (99.9999999 %+) | Semiconductor ingots |
| Monocrystalline Si | Si, single crystal | EG + controlled doping | Wafers |

A note on high-purity quartz (HPQ). The quartz crucibles that hold molten silicon during crystal growth (Ch 5) are made from ultra-high-purity quartz sand from very few deposits worldwide — the Spruce Pine district in North Carolina, USA, is the best-known source. This is a small, concentrated, often-overlooked chokepoint.

## Chapter 4 — Silicon purification

L1 summary. Purification is a chemistry business. The Siemens process — chemical vapour deposition of silicon from trichlorosilane onto heated rods — dominates electronic-grade supply. It is extremely energy-intensive and capital-heavy, and the supply base is concentrated in a handful of producers.

### 4.1 Step 1 — Carbothermic reduction (quartz → MG-Si)

| Item | Detail |
|---|---|
| Reaction | SiO₂ + 2C → Si + 2CO (overall; proceeds via SiO and SiC intermediates) |
| Equipment | Submerged-arc furnace with graphite/carbon electrodes, typically tens of MW |
| Temperature | ~1 900–2 000 °C at the reaction zone |
| Reductants | Coal, charcoal, coke, woodchips |
| Energy | Roughly 11–13 MWh per tonne of MG-Si (industry range; plant-dependent) |
| Output | MG-Si ~98–99.5 %, tapped and cast; main impurities Fe, Al, Ca, Ti, B, P |
| Producers | Ferroalloy / silicon-metal producers; China is the largest producing country |

### 4.2 Step 2 — Hydrochlorination to trichlorosilane

MG-Si powder reacts with HCl in a fluidised-bed reactor at ~300 °C:

Si+3HCl→SiHCl_3+H_2

Trichlorosilane (TCS) boils at ~32 °C, so it can be purified by fractional distillation — dozens of column stages strip B, P and metal chlorides. Boron and phosphorus are hardest because their chlorides boil close to TCS; they are the critical impurities because they are electrically active dopants.

### 4.3 Step 3 — Siemens process (TCS → polysilicon)

| Item | Detail |
|---|---|
| Principle | CVD: SiHCl₃ + H₂ → Si + 3HCl (with SiCl₄ by-product) |
| Equipment | Bell-jar reactor, inverted-U high-purity Si filaments heated resistively to ~1 000–1 150 °C |
| Growth | Rods grow from ~7–10 mm to ~150–200 mm diameter over several days |
| Energy | Tens of kWh per kg Si in the deposition step alone; the most energy-intensive stage |
| By-product | Silicon tetrachloride (STC), recycled to TCS in closed-loop plants; historically an environmental hazard when dumped |
| Output | Rods broken into chunks, etched, packed in cleanroom bags |

Fluidised-bed reactor (FBR). Silane (SiH₄) or TCS decomposes onto small Si seed granules fluidised in a hot gas stream, producing granular polysilicon. FBR uses much less energy per kg and runs continuously, but historically reached lower purity; it is widely used for solar grade, with ongoing work for higher grades. Semiconductor grade remains overwhelmingly Siemens.

### 4.4 Purity grades

| Grade | Nines | Total impurity | Use |
|---|---|---|---|
| MG-Si | ~2N | ~5 000–20 000 ppmw | Alloys, chemical feedstock |
| Solar | 6N–9N | ~1 ppmw–1 ppbw | PV |
| Electronic | 9N–11N | ≤ ppb to sub-ppb; donors/acceptors at ppt levels | ICs |

### 4.5 Why extreme purity is required

| Contaminant | Effect | Why it matters |
|---|---|---|
| Transition metals (Fe, Cu, Ni, Cr) | Deep-level traps in the bandgap; kill minority-carrier lifetime; Cu diffuses fast even at room temperature | Junction leakage, DRAM retention loss, image-sensor dark current |
| Boron / phosphorus | Unintended doping | Shifts resistivity and threshold voltage |
| Oxygen | Enters from the quartz crucible during CZ growth (10¹⁷–10¹⁸ cm⁻³); forms precipitates | Beneficial when controlled — precipitates getter metals; harmful near the device surface |
| Carbon | Nucleates oxygen precipitates, forms defects | Controlled to low ppma |
| Particles | Physical defects | Kill die in lithography and deposition |
| Alkali (Na, K) | Mobile ions in gate oxide | Threshold drift — the historic 1960s MOS reliability problem |

### 4.6 Supplier ecosystem and localization

Electronic-grade polysilicon for semiconductors is supplied by a small number of producers, including Wacker Chemie (Germany/USA), Hemlock Semiconductor (USA), Tokuyama (Japan), Mitsubishi Materials (Japan), and OCI (Korea/Malaysia). Solar-grade polysilicon capacity is concentrated in China (e.g., Tongwei, GCL Tech, Daqo, Xinte) — a separate market with far greater tonnage.

Localization considerations

Capital-heavy, energy-intensive, chemistry-heavy; viable only with cheap reliable power and long-term offtake.

Semiconductor-grade volumes are small relative to solar; a new entrant faces multi-year wafer-maker qualification.

India’s near-term relevance is more likely via solar-grade polysilicon linked to PV manufacturing policy than semiconductor-grade.

Key takeaways — Part II

The value chain from quartz to 11N polysilicon is a chemical engineering chain, not a semiconductor fab chain.

Boron/phosphorus and transition metals are the critical impurities.

HPQ crucible quartz and EG polysilicon are concentrated, low-visibility supply risks.

Glossary terms introduced: MG-Si, EG-Si, polysilicon, trichlorosilane, STC, Siemens process, FBR, nines (N), gettering, minority-carrier lifetime, HPQ.
