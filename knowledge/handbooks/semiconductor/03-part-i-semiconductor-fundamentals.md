---
handbook: semiconductor
handbook_title: "The Complete Semiconductor Industry Handbook"
part_index: 3
part_title: "Part I — Semiconductor fundamentals"
source_document: "The_Complete_Semiconductor_Industry_Handbook_1.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part I — Semiconductor fundamentals

## Chapter 1 — What is a semiconductor?

L1 summary. A semiconductor is a material whose conductivity can be switched and tuned over many orders of magnitude — by adding impurities (doping), applying an electric field, light or heat. That controllability, not the conductivity itself, is what makes transistors, diodes, lasers and sensors possible.

### 1.1 Conductors, insulators, semiconductors

In a solid, electron energies group into bands. The valence band holds electrons bound in chemical bonds; the conduction band holds electrons free to move. The energy gap between them is the bandgap (Eg).

| Class | Bandgap (eV) | Resistivity at 300 K (Ω·cm) | Free carriers | Example |
|---|---|---|---|---|
| Conductor | None (bands overlap) | ~10⁻⁶ | ~10²² cm⁻³, fixed | Cu, Al |
| Semiconductor | ~0.1–4 (Si 1.12) | ~10⁻³ to 10⁵, tunable | 10¹⁰–10²⁰ cm⁻³, tunable | Si, GaAs, SiC |
| Insulator | > ~4–5 (SiO₂ ~9) | > 10¹⁴ | Negligible | SiO₂, Si₃N₄ |

Analogy. A multi-storey car park: the valence band is a full ground floor where no car can move; the conduction band is an empty upper floor. Lift a car upstairs (thermal or optical energy ≥ Eg) and it can drive — and the empty slot it left downstairs lets the ground-floor cars shuffle too. That empty slot is a hole.

### 1.2 Carriers: electrons and holes

Electron (n): negative carrier in the conduction band.

Hole (p): absence of an electron in the valence band; behaves as a positive carrier with its own effective mass and mobility.

Intrinsic carrier concentration nᵢ: in pure Si at 300 K, nᵢ ≈ 1×10¹⁰ cm⁻³ — against ~5×10²² Si atoms cm⁻³. Pure silicon is a poor conductor.

Mass-action law: n·p = nᵢ² in equilibrium. Adding electrons suppresses holes, and vice versa.

### 1.3 Fermi level

The Fermi level (E_F) is the energy at which an electron state has a 50 % probability of occupation. In intrinsic Si it sits near mid-gap. n-type doping pushes it toward the conduction band; p-type pulls it toward the valence band. When two materials touch (a p-n junction, a metal contact), Fermi levels align — this alignment creates built-in fields, junction barriers and contact resistance.

### 1.4 Doping: intrinsic vs extrinsic

| Type | Dopant (in Si) | Group | Mechanism | Majority carrier |
|---|---|---|---|---|
| n-type | Phosphorus, Arsenic, Antimony | V | 5th valence electron is loosely bound (~0.045 eV for P), freed at room temperature | Electrons |
| p-type | Boron (Al, Ga, In less used) | III | Missing bond electron accepts a neighbour’s electron, leaving a hole | Holes |

Typical doping spans ~10¹⁴ cm⁻³ (lightly doped substrate) to >10²⁰ cm⁻³ (source/drain contacts). One boron atom per ~10⁸ silicon atoms already changes resistivity by orders of magnitude — which is why contamination at parts-per-billion levels matters (Ch 4).

### 1.5 Conductivity, mobility, resistivity

Engineering view. Current density depends on how many carriers exist and how fast they drift in a field.

σ=q (n μ_n+p μ_p),  ρ=(1)/(σ)

where q = 1.602×10⁻¹⁹ C, and μ is mobility (cm²/V·s). In lightly doped Si at 300 K, μₙ ≈ 1 400 and μₚ ≈ 450 cm²/V·s. Mobility falls with higher doping (impurity scattering) and higher temperature (phonon scattering).

Worked example. n-type Si doped with 1×10¹⁶ cm⁻³ phosphorus: σ ≈ 1.602×10⁻¹⁹ × 10¹⁶ × ~1 200 ≈ 1.9 S/cm → ρ ≈ 0.5 Ω·cm — a typical CMOS substrate value.

### 1.6 L3 deep dive — carrier statistics

n_i=√(N_cN_v) e^(-E_g/2kT)

nᵢ depends exponentially on Eg/kT. This single equation explains three industrial realities:

Wide-bandgap devices run hot. SiC (Eg ≈ 3.26 eV) has nᵢ many orders lower than Si, so it stays controllable above 200 °C — hence EV inverters.

Leakage doubles roughly every ~10 °C in Si devices, which drives data-centre thermal design.

Narrow-gap materials need cooling (InSb, HgCdTe infrared detectors).

Direct vs indirect bandgap. In GaAs, InP and GaN the conduction-band minimum and valence-band maximum align in momentum, so electron-hole recombination emits a photon efficiently. Silicon is indirect — it needs a phonon to conserve momentum — so Si is a poor light emitter. This is the physics behind compound-semiconductor lasers and silicon photonics’ need for heterogeneous laser integration (Part XXXI).

### 1.7 The p-n junction — the first device

Join p- and n-type Si: electrons diffuse into p, holes into n, leaving fixed ionised dopants that form a depletion region and a built-in potential (~0.6–0.8 V in Si). Forward bias shrinks the barrier and current flows exponentially; reverse bias widens it and blocks current until breakdown.

I=I_s(e^(qV/nkT)-1)

Every transistor, solar cell, LED, laser diode and photodiode is built from junctions.

Industrial relevance. Doping control (dose, depth, activation) is a core fab capability — ion implantation (Ch 12) and epitaxy (Ch 10) exist to place dopants precisely.

Key takeaways — Ch 1

Semiconductors matter because conductivity is controllable, not because it is high.

Doping at ppm–ppb concentrations sets device behaviour; purity is therefore existential.

Bandgap sets temperature limit, breakdown field and optical behaviour.

## Chapter 2 — Silicon: why it became the foundation

L1 summary. Silicon won not because it is the fastest semiconductor — it is not — but because it has a stable native oxide (SiO₂), is abundant, can be grown as near-perfect 300 mm crystals, and has 60+ years of accumulated process knowledge and equipment. Other materials win in niches: power (SiC, GaN), RF (GaAs, GaN), photonics (InP, GaAs).

### 2.1 Silicon atomic and crystal structure

Atomic number 14; four valence electrons; each atom bonds covalently to four neighbours in a tetrahedron.

Diamond cubic lattice, lattice constant 0.543 nm; ~5.0×10²² atoms/cm³.

Crystal orientation matters: (100) is standard for CMOS (lowest interface-trap density at Si/SiO₂); (111) is used for some bipolar and MEMS work; (110) has been explored for hole mobility.

Anisotropic wet etchants (KOH, TMAH) etch (100) far faster than (111) — the basis of bulk MEMS micromachining.

### 2.2 Why silicon dominates

| Factor | Why it matters |
|---|---|
| Native oxide SiO₂ | High-quality insulator grown by simply heating Si in O₂; gave the MOS transistor and planar process |
| Abundance | Si is ~28 % of Earth’s crust by mass; quartz feedstock is cheap |
| Crystal quality | Dislocation-free 300 mm ingots are routine; no compound semiconductor matches this scale |
| Mechanical strength | Wafers survive hundreds of process steps and robotic handling |
| Thermal conductivity | ~150 W/m·K, adequate heat spreading |
| Bandgap 1.12 eV | Good balance of low leakage and workable voltages at room temperature |
| Ecosystem | Equipment, materials, EDA, PDKs and talent built around Si CMOS |

### 2.3 Semiconductor materials comparison

Values at ~300 K, approximate; mobility is bulk electron mobility and varies with doping and quality.

| Material | Bandgap (eV) | Gap type | Electron mobility (cm²/V·s) | Advantages | Limitations | Typical devices |
|---|---|---|---|---|---|---|
| Silicon (Si) | 1.12 | Indirect | ~1 400 | Native oxide, 300 mm wafers, cost, ecosystem | Poor light emission, limited high-T/high-V | CMOS logic, memory, analog, IGBT, MOSFET, image sensors, solar |
| Germanium (Ge) | 0.66 | Indirect | ~3 900 | High hole/electron mobility, IR absorption | Poor native oxide, high leakage | SiGe HBTs, strained channels, IR photodetectors |
| Silicon carbide (4H-SiC) | ~3.26 | Indirect | ~900 | ~10× Si breakdown field, high T, thermal conductivity | Expensive substrates, defects, 150→200 mm transition | EV traction MOSFETs, Schottky diodes, solar/grid inverters |
| Gallium nitride (GaN) | ~3.4 | Direct | ~1 000–2 000 (2DEG in HEMT) | High breakdown + speed, blue/UV light emission | Mostly on foreign substrates (Si, SiC, sapphire), reliability learning | Fast chargers, data-centre PSUs, RF PAs, radar, LEDs, blue lasers |
| Gallium arsenide (GaAs) | 1.42 | Direct | ~8 500 | High speed, efficient light emission | Fragile, costly, small wafers, arsenic handling | RF front-end PAs, VCSELs, red/IR lasers, space solar |
| Indium phosphide (InP) | 1.34 | Direct | ~5 400 | Lasers at 1 310/1 550 nm telecom bands, very high frequency | Small (≤ 150 mm), brittle, expensive wafers | DFB/EML lasers, photodiodes, optical transceivers, THz |
| Gallium oxide (β-Ga₂O₃) | ~4.8 | — | ~200 | Ultra-wide gap, melt-grown substrates | Very poor thermal conductivity, no p-type | Research/early high-voltage power |
| Diamond | ~5.5 | Indirect | ~2 000+ | Highest thermal conductivity, extreme breakdown | Doping, substrate size, cost | Research; heat spreaders, detectors |

### 2.4 L3 deep dive — figures of merit

For power devices, specific on-resistance scales approximately as:

R_(on,sp)≈(4 V_(BR)^2)/(ε μ_n E_c^3)

Because Ec (critical field) appears cubed, SiC and GaN — with critical fields roughly an order of magnitude above Si — offer dramatically lower on-resistance at the same breakdown voltage. That is the entire economic case for wide-bandgap power (Part XI-D).

### 2.5 Why silicon remains dominant

Scale economics: a 300 mm Si wafer has ~2.25× the area of a 200 mm wafer; compound substrates are mostly 100–200 mm.

Integration: CMOS integrates billions of transistors; compound semiconductors mostly make discrete or low-integration devices.

Heterogeneous integration is the answer, not substitution: GaN-on-Si, SiGe, Ge photodetectors on Si, InP lasers bonded to Si photonics — Si is the platform other materials attach to.

Key takeaways — Ch 2

Si dominates integration; compound and wide-bandgap materials dominate where physics beats scale (power, RF, light).

Substrate size and defect density are the cost drivers for non-Si materials.

The future is Si plus others (heterogeneous), not Si versus others.

Glossary terms introduced: bandgap, valence band, conduction band, Fermi level, hole, intrinsic, extrinsic, donor, acceptor, mobility, resistivity, depletion region, direct/indirect gap, critical field, 2DEG.
