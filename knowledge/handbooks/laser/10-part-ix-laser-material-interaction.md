---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 10
part_title: "Part IX — Laser–Material Interaction"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part IX — Laser–Material Interaction

What a laser does to a material is decided by three numbers: how much of the light is absorbed (wavelength × material × surface state), how deep it is absorbed (optical penetration depth), and how far heat spreads during the interaction (thermal diffusion length, set by pulse duration or dwell time). Every process in Part X is a choice of those three.

## 9.1 The four fates of a photon

At a surface, light is reflected, absorbed, transmitted or scattered: R + A + T + S = 1; for opaque materials A = 1 − R. For metals and absorbing materials, the complex refractive index ñ = n + ik sets both reflectivity and absorption depth.

## 9.2 Metals

Metals absorb in a 10–20 nm skin layer, so absorption is a surface property. Absorptance falls toward the infrared (free-electron reflection, → §1.11); copper and gold absorb strongly only below ~550 nm because of interband transitions.

Approximate literature values, polished metals at 20 °C · 6 wavelengths

Three effects raise effective absorption above the chart during processing: temperature (steel and copper absorb more as they heat, and liquid more than solid); surface state (oxide, roughness, anodising, coatings); and geometry — in a keyhole, multiple reflections raise coupling to roughly 60–90% even for copper at 1 µm. That is why IR fiber lasers can weld copper in keyhole mode, but with unstable onset and spatter, while green and blue lasers couple from the first microsecond.

| Metal | Behaviour under laser | Preferred approaches |
|---|---|---|
| Copper | ~4% absorption at 1 µm when cold; very high conductivity drains heat; keyhole onset unstable; spatter | Green (515/532 nm) or blue (450 nm); IR with high brightness + wobble or ring beams; ns/ps for micro-joining |
| Aluminium | Low absorption, low melting point (660 °C), tenacious oxide, hot-cracking alloys (6xxx), hydrogen porosity | IR with wobble or ring-core beams, filler wire for 6xxx, cleaning before welding |
| Carbon and stainless steel | Good absorption at 1 µm (~35%); stainless has low conductivity → narrow HAZ | Fiber lasers for almost all processes; O₂ cutting for mild steel, N₂ for stainless |
| Titanium | Good absorption; highly reactive with O and N when hot | Full inert shielding (trailing shields, chambers); fiber lasers |
| Nickel and superalloys | Moderate absorption; strain-age and solidification cracking in some alloys | Controlled heat input, preheat, pulse shaping |
| Gold, silver | Very reflective in IR; Au absorbs green/blue | Green or UV for micro-welding and ablation; ultrafast for thin films |
| Brass, zinc-coated steel | Zinc boils at 907 °C, far below steel melting → vapour blows out porosity | Gap for vapour escape, dual-beam or wobble strategies |
| Solder alloys (SnAgCu, SnPb) | Low melting (~183–220 °C); flux and wetting dominate | Diode or fiber at 9xx nm with temperature control (→ §10.5) |

## 9.3 Non-metals and engineered materials

| Material | Absorbs well at | Largely transparent at | Interaction notes |
|---|---|---|---|
| Most polymers (PE, PP, PC, PA, PMMA, PET) | 10.6 / 9.3 µm; UV (≤ 355 nm); 2 µm in clear polymers | 0.4–1.1 µm unless pigmented or additive-doped | CO₂ melts and vaporises; UV gives fine, low-HAZ ablation; 1064 nm needs carbon black or laser additives for marking |
| Polyimide (Kapton, FPC base) | UV (355, 308, 248 nm); 9.3/10.6 µm | NIR | UV is the standard for FPC coverlay and base cutting |
| Glass (soda-lime, borosilicate, fused silica) | > ~5 µm (CO₂); < ~200–300 nm | Visible–NIR | CO₂ causes thermal stress and melting; ultrafast NIR works through nonlinear absorption inside the volume |
| Sapphire | < ~150 nm (linear) | Visible–5 µm | Ultrafast in-volume modification, stealth-type cutting |
| Ceramics (Al₂O₃, AlN, ZrO₂) | 10.6 µm strongly; UV; partly 1 µm | — | Scribing and drilling of substrates; thermal cracking risk |
| Silicon | < 1.1 µm (strong at 355–532 nm) | 1.2–7 µm | Stealth dicing and inspection use transparency; UV and green for surface processing |
| SiC, GaN | UV (above band gap: < ~380 / 365 nm) | Visible–NIR | Hard and brittle; ultrafast or UV processing; LLO of GaN at 248–355 nm |
| GaAs, InP | < ~870 / 920 nm | NIR beyond band gap | Brittle, toxic debris (As, P): enclosed processing and extraction |
| FR-4 (glass–epoxy) | 9.3/10.6 µm, UV | Glass fibers transparent at 1 µm | Different absorption of resin and glass causes fiber protrusion |
| Solder mask (PCB) | 9.3 µm very strongly; 10.6 µm; UV | — | CO₂ removes or foams the mask to create contrast marks |
| Battery materials | Cu and Al foils (see metals); NMC/LFP/graphite coatings absorb IR well; PE/PP separators transparent in NIR | — | Coatings ablate easily; separator must not be damaged; pouch laminates absorb CO₂ |
| Biological tissue | Water: 2.94 µm, 1.94 µm, 10.6 µm; haemoglobin: 400–600 nm; melanin: UV–NIR | ~700–900 nm “optical window” | Basis of medical wavelength choice (→ Part XVIII) |

## 9.4 The thermal regime: conduction, melting, vaporisation and HAZ

For pulses longer than ~10 ps, absorbed energy becomes heat almost instantly and spreads by conduction. The thermal diffusion length during the interaction time sets the minimum heat-affected zone:

| Material | κ (mm²/s, ≈) | 10 ps | 10 ns | 100 ns | 1 ms |
|---|---|---|---|---|---|
| Copper | 117 | 68 nm | 2.2 µm | 6.8 µm | 0.68 mm |
| Silicon | 88 | 59 nm | 1.9 µm | 5.9 µm | 0.59 mm |
| Stainless steel | 4 | 13 nm | 0.4 µm | 1.3 µm | 0.13 mm |
| Glass | 0.8 | 6 nm | 0.18 µm | 0.57 µm | 57 µm |
| Polymer (PC) | 0.14 | 2 nm | 75 nm | 0.24 µm | 24 µm |

For ps and fs pulses in metals, hot electrons carry energy some tens of nm before coupling to the lattice (two-temperature model), so the practical minimum HAZ is ~0.1–1 µm rather than the values in the first column.

Sequence as intensity rises: heating without melting (hardening, soldering), melting by conduction (conduction welding, cladding), vaporisation with recoil pressure opening a keyhole (above ~10⁶ W/cm² for steel), and finally explosive vaporisation and ablation (pulsed). Heat input per unit length, P/v (J/mm), is the governing parameter for distortion, grain growth and HAZ width in welding.

| Material | Melting point (°C, ≈) | Boiling point (°C, ≈) | Note |
|---|---|---|---|
| SAC305 solder | 217–220 | — | Flux activation and wetting window ~240–260 °C |
| Aluminium | 660 | 2470 | Low melting, high conductivity |
| Silver | 962 | 2162 | Highly reflective |
| Gold | 1064 | 2856 | Absorbs green/blue |
| Copper | 1085 | 2562 | High conductivity |
| Silicon | 1414 | 3265 | Brittle; melts to a reflective liquid |
| Stainless steel 304 | ~1400–1450 | ~2900 (Fe) | Low conductivity |
| Titanium Ti-6Al-4V | ~1650 | ~3290 | Needs inert shielding |
| Zinc | 420 | 907 | Vapour causes porosity in galvanised steel |

## 9.5 Ablation regimes: photothermal, photochemical, non-thermal

| Regime | Pulse / λ | Mechanism | Result |
|---|---|---|---|
| Photothermal | ns–µs, any λ | Heating → melting → vaporisation; melt expelled by vapour pressure | Recast layer, burr, HAZ of µm–tens of µm |
| Photochemical | UV (193/248 nm) on polymers | Photon energy breaks molecular bonds directly | Clean edges, little heat; excimer polymer and corneal ablation |
| Non-thermal (“cold”) ablation | < ~10 ps, any λ | Energy deposited before electron–phonon coupling (~1–10 ps); solid → vapour/plasma directly | Minimal melt and HAZ; works on transparent materials via nonlinear absorption |
| Spallation / thermo-elastic | ns pulses on layered systems | Rapid expansion stresses break adhesion | Paint and oxide removal (cleaning), thin-film scribing |

Ablation depth per pulse grows logarithmically with fluence above a threshold F_th; for a Gaussian beam the energy-specific removal rate is highest at a peak fluence of about e² × F_th (≈7.4 F_th). Operating far above that wastes energy in plasma and heat, which is why ultrafast throughput scales by spreading power over more pulses (higher rep rate, bursts, larger or multiple spots), not by raising pulse energy.

Heat accumulation: at MHz repetition rates, pulses arrive faster than heat dissipates, so even femtosecond processing can build a HAZ. Rep rate, burst format and scan speed must be chosen together.

## 9.6 Plasma formation and shielding

Above the vaporisation threshold, the vapour plume ionises. The plasma absorbs laser light by inverse bremsstrahlung, a process that scales roughly with λ²: at 10.6 µm, plasma shielding is ~100× stronger than at 1 µm, which is why CO₂ welding uses helium shielding gas to suppress it. In ns ablation, plasma forming during the pulse shields the surface at high fluence; ultrafast pulses end before the plume develops. In keyhole welding the metal-vapour plume above the keyhole scatters and defocuses the beam, and plume management (cross-jets, gas flow) is part of process design.

## 9.7 Process regime map

Order-of-magnitude engineering map · 10 process families

The map is the most compact summary of laser processing: surface heating processes sit at low intensity and long times, melting processes in the middle, and ablation at short times and high intensity. Moving left (shorter pulses) at constant fluence shrinks the HAZ; moving up at constant time changes the mechanism.
