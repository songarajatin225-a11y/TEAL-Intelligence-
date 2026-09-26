---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 15
part_title: "Part XXX — Technology roadmap"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XXX — Technology roadmap

L1 summary. Progress now comes from three directions at once: new transistor architectures (FinFET → GAA → CFET), new wiring and power delivery (backside power), and system integration in the package (2.5D/3D, chiplets, hybrid bonding, optical I/O). Materials beyond silicon grow in power, RF and photonics. Each item below is tagged by maturity.

| Technology | What it is | Maturity (Sep 2026) | Drivers | Main hurdles |
|---|---|---|---|---|
| FinFET | 3-sided gate | Mature | Workhorse 16–3 nm | Fin width limits |
| GAA nanosheet | 4-sided gate, stacked sheets | Emerging → volume (Samsung 3 nm; TSMC N2, Intel 18A ramping 2025–26) | Better electrostatics, variable width | Process complexity, sheet release etch, variability |
| Backside power delivery | Power rails under the transistor | Emerging (Intel 18A PowerVia; TSMC A16 announced) | IR drop, routing congestion | Wafer bonding/thinning, thermal, debug |
| CFET | nFET stacked on pFET | Research (imec and fab demonstrations) | ~Half standard-cell footprint | Sequential/monolithic integration, thermal budget |
| 2D-material channels | MoS₂, WSe₂ monolayers | Research | Scaling beyond Si | Contacts, growth on 300 mm, variability |
| High-NA EUV | 0.55 NA EUV | Emerging (early tools installed at Intel, imec; insertion decisions vary by fab) | Single-exposure patterning below ~10 nm half-pitch | Half-field size, cost, resist |
| 2.5D interposer / bridge | Side-by-side dies | Mature, capacity-constrained | AI accelerators with HBM | Interposer size, substrates, cost |
| 3D stacking + hybrid bonding | Cu-Cu direct bonds < 10 µm pitch | Growing (CIS, SRAM cache, NAND) | Bandwidth density, energy/bit | Yield, thermal, KGD, test |
| Chiplets + UCIe | Standard die-to-die links | Growing | Yield, reuse, mix-and-match nodes | Ecosystem, test, standards maturity |
| HBM4 / HBM4E | 2 048-bit interface, custom base die | Emerging (2025–26 introduction) | AI bandwidth | Stack height, bonding, power |
| Silicon photonics | Optical circuits on Si wafers | Mature in pluggable transceivers; growing | Data-centre bandwidth, power | Laser integration, packaging, test |
| Co-packaged optics / optical I/O | Optics next to the switch/GPU die | Emerging (announced switch products) | Reach and energy for AI clusters | Serviceability, laser reliability, ecosystem |
| Wide-bandgap (SiC) | 150 → 200 mm SiC power | Mature / scaling | EVs, renewables | Substrate cost, defects, market cyclicality |
| GaN power | GaN-on-Si, 650 V class; higher voltage emerging | Mature / growing; 300 mm GaN announced | Chargers, data-centre PSUs, EV OBCs | Reliability qualification, vertical GaN |
| Ga₂O₃, diamond, AlN | Ultra-wide bandgap | Research | Very high voltage | Doping, thermal, substrates |
| AI accelerators | Domain-specific compute | Mature and diversifying | AI training and inference | Memory bandwidth, power, packaging |
| In-/near-memory compute | Compute in or beside memory arrays | Research → early products | Energy per op | Precision, programming model |
| Neuromorphic computing | Spiking, event-driven hardware (e.g., Intel Loihi, IBM NorthPole-class research) | Research / niche | Low-power edge inference | Software, applications |
| Quantum technologies | Superconducting qubits (made in semiconductor-style fabs), Si spin qubits, photonic, trapped-ion | Research / early commercial | New computational classes | Error correction, scale, cryogenics |
| Glass-core substrates | Glass replacing organic core | Emerging | Flatness, fine lines for large packages | Handling, cracking, supply chain |
| Panel-level packaging | Large-panel fan-out | Emerging | Cost for large packages | Equipment, warpage |

Three signals to watch (non-predictive): High-NA EUV insertion timing; hybrid-bonding adoption in HBM (16-high and beyond); CPO deployment in AI clusters.

Key takeaways — Part XXX

Scaling continues, but the gains are increasingly architectural (GAA, backside power) and system-level (packaging).

Advanced packaging and photonics are where front-end and back-end, electronics and optics converge.

Separate what ships (mature), what ramps (emerging) and what is in papers (research).
