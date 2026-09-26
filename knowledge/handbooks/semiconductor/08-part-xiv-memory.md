---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 8
part_title: "Part XIV — Memory"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XIV — Memory

L1 summary. Memory is a commodity-cycle business dominated by a few IDMs. DRAM (fast, volatile, one transistor + one capacitor per bit) and NAND flash (dense, non-volatile, charge stored in a trap layer) are the two giants. HBM — DRAM dies stacked with through-silicon vias beside an AI GPU — has turned memory into the gating resource for AI compute.

## Chapter 18 — DRAM

### 18.1 The 1T1C cell

Each bit is a capacitor (charged = 1, discharged = 0) accessed through one transistor.

Word line (WL): turns on a whole row of access transistors.

Bit line (BL): connects cells in a column to a sense amplifier.

Sense amplifier: detects the tiny voltage shift (tens of mV) when the cell shares charge with the bit line, amplifies it, and rewrites the value — reads are destructive.

Refresh: capacitors leak; every cell is refreshed within ~32–64 ms (JEDEC standard at normal temperature).

Scaling challenge: capacitance must stay at roughly ~10+ fF while cell area shrinks, so capacitors became tall cylinders with aspect ratios > 50:1, coated with high-k dielectrics by ALD. Buried-channel-array transistors (bWL) and, on roadmaps, 4F² vertical-channel cells and 3D DRAM are responses.

Node naming: DRAM uses its own labels — 1x, 1y, 1z, 1α (1a), 1β (1b), 1γ/1c — each roughly a ~10–15 nm-class half-pitch generation. EUV is used on some layers from 1α/1β onward, varying by maker.

### 18.2 DRAM product families (JEDEC standards)

| Family | Use | Key traits |
|---|---|---|
| DDR4 / DDR5 | PCs, servers | DDR5 adds on-die ECC, dual 32-bit subchannels, PMIC on module |
| LPDDR4X / LPDDR5 / LPDDR5X / LPDDR6 | Phones, laptops, auto, AI PCs | Low voltage, packaged beside or on the SoC |
| GDDR6 / GDDR7 | Graphics cards, some AI inference | Very high per-pin data rates (GDDR7 uses PAM3 signalling) |
| HBM2E / HBM3 / HBM3E / HBM4 | AI GPUs, accelerators, HPC | Very wide interface (1 024-bit per stack for HBM3; 2 048-bit for HBM4), stacked dies, 2.5D integration |

### 18.3 HBM architecture

Stack: 8, 12 and 16-high DRAM dies (HBM3E / HBM4 generations) thinned to ~30–50 µm, connected vertically by TSVs (through-silicon vias) and micro-bumps or hybrid bonds.

Bonding: SK hynix uses mass reflow-molded underfill (MR-MUF); Samsung and Micron have used thermo-compression bonding with non-conductive film (TC-NCF). Hybrid bonding (Cu-Cu, bumpless) is being developed for 16-high and beyond because stack-height standards (~720–775 µm) leave little room for bumps.

Base die: interface logic; for HBM4 some suppliers make the base die on a foundry logic process (e.g., SK hynix with TSMC), enabling customer-specific logic.

2.5D integration: GPU and several HBM stacks sit side-by-side on a silicon interposer (TSMC CoWoS-S) or organic interposer with local silicon bridges (CoWoS-L, Intel EMIB), carrying thousands of fine wires between them.

Why it matters: AI training throughput is often limited by memory bandwidth; HBM offers ~1–2+ TB/s per stack in current generations, far above DDR5 channels. HBM consumes several times the wafer area per bit of standard DRAM, tightening DRAM supply overall.

Suppliers: SK hynix, Samsung, Micron. HBM and CoWoS-class capacity have been the principal AI supply bottlenecks since 2023.

## Chapter 19 — NAND flash

### 19.1 How a NAND cell stores data

A NAND cell is a MOSFET with a charge-storage layer between gate and channel. Stored electrons shift the threshold voltage; reading senses which Vₜ window the cell is in.

| Storage type | Mechanism | Status |
|---|---|---|
| Floating gate | Conductive polysilicon island stores charge | Used in older planar and some 3D NAND (historically Intel/Micron) |
| Charge trap (CTF) | Charge trapped in a silicon-nitride layer | Dominant in 3D NAND |

Program/erase: Fowler-Nordheim tunnelling through a thin tunnel oxide at high voltage (~15–20 V). Each cycle damages the oxide — hence finite endurance.

### 19.2 Bits per cell

| Type | Bits / cell | Vₜ states | Endurance (P/E cycles, indicative) | Use |
|---|---|---|---|---|
| SLC | 1 | 2 | ~50 000–100 000 | Industrial, caches |
| MLC | 2 | 4 | ~3 000–10 000 | Enterprise (declining) |
| TLC | 3 | 8 | ~1 000–3 000 | Mainstream SSDs, phones |
| QLC | 4 | 16 | ~hundreds–1 000 | High-capacity, read-heavy (AI data lakes) |
| PLC | 5 | 32 | Low | Announced/in development |

### 19.3 3D NAND

Planar NAND hit a scaling wall around ~15 nm. 3D NAND stacks cells vertically: alternating oxide/nitride (or oxide/poly) layers are deposited, a channel hole is etched through the whole stack, and the hole is lined with charge-trap and channel layers. Word lines are the horizontal layers.

Layer counts: production products have passed 200 and 300 layers (e.g., SK hynix 321-layer, Samsung V9, Kioxia/SanDisk BiCS8 218-layer, YMTC’s Xtacking generations); roadmaps discuss 400–1 000 layers.

Key process challenges: high-aspect-ratio channel-hole etch (> 50–100:1), which drove cryogenic etch development; string stacking (building in two or three decks); wafer stress; word-line replacement (nitride → tungsten/molybdenum).

CMOS under/bonded to array: peripheral logic placed under the array (CuA, Micron/Intel) or on a separate wafer hybrid-bonded to the array wafer (YMTC Xtacking, Kioxia/SanDisk CBA) — a major use of wafer-to-wafer bonding.

### 19.4 Controller and ECC

Raw NAND is unreliable; the controller makes it usable: error-correcting codes (LDPC), wear levelling, bad-block management, garbage collection, the flash translation layer (FTL), and the host interface (NVMe/PCIe, UFS, eMMC). Controller suppliers include Phison, Silicon Motion, Marvell, and in-house designs at Samsung, SK hynix/Solidigm, Kioxia, WD/SanDisk and Micron.

## Emerging memory

| Technology | Principle | Status | Typical use |
|---|---|---|---|
| MRAM (STT/SOT) | Magnetic tunnel junction resistance | Production as embedded NVM at 22–28 nm-class; standalone niche | Replacing eFlash in MCUs, caches |
| ReRAM (RRAM) | Filament forming in an oxide | Embedded production in niche | Low-power IoT, in-memory compute research |
| PCM | Crystalline/amorphous phase change | Intel/Micron 3D XPoint discontinued; embedded PCM used by STMicro in auto MCUs | Embedded NVM |
| FeRAM / FeFET | Ferroelectric polarisation (HfO₂-based) | Niche production; research revival | Low-power NVM |
| CXL-attached memory | Protocol, not a cell type | Deploying in servers | Memory pooling/expansion |

Key takeaways — Part XIV

DRAM scaling is a capacitor problem; NAND scaling became a vertical stacking and etch problem.

HBM combines DRAM, TSVs, advanced bonding and 2.5D packaging — it sits at the intersection of front-end and back-end.

Memory is cyclical and concentrated in three DRAM and ~six NAND producers.

Glossary terms introduced: 1T1C, word line, bit line, sense amplifier, refresh, DDR, LPDDR, GDDR, HBM, TSV, micro-bump, MR-MUF, TC-NCF, interposer, CoWoS, floating gate, charge trap, SLC/MLC/TLC/QLC, P/E cycle, 3D NAND, channel hole, CuA/CBA, FTL, LDPC, MRAM, ReRAM, PCM, FeRAM, CXL.
