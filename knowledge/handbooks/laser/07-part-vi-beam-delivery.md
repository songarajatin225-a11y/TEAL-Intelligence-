---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 7
part_title: "Part VI — Beam Delivery"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part VI — Beam Delivery

Wavelengths from ~0.3 to ~2.2 µm travel through silica fiber, which is why fiber delivery dominates metal processing and robot integration; CO₂ and most mid-IR and deep-UV beams still travel through mirrors. The industrial fiber interface is essentially standardised on the QBH and QD connector families, with delivery fiber core diameter chosen per application.

## 6.1 Delivery methods

| Method | Wavelengths | Power range | Advantages | Limitations | Typical use |
|---|---|---|---|---|---|
| Free-space (mirrors, lenses) | Any | Any | No nonlinear limits; preserves pulse and beam quality | Alignment, enclosure, pointing drift with temperature | Ultrafast, UV, CO₂ marking, semiconductor tools |
| Beam tubes / flying optics | Any (mainly CO₂) | Up to multi-kW | Protected, purged path over metres | Beam path length changes with axis position | CO₂ flat-bed cutting, large gantries |
| Articulated arm | CO₂, Er:YAG, UV | W–100s W | Flexible delivery where no fiber exists | Limited reach and life; mirror joints | Medical CO₂ and Er:YAG, some manual processing |
| Step-index multimode silica fiber | ~0.3–2.2 µm | W to tens of kW | Robot-friendly, maintenance-free, long lengths | Raises BPP; peak-power limits for pulsed | Fiber, disk, diode lasers for cutting, welding, cladding |
| Single-mode / LMA fiber | 1–2 µm | W to kW | Diffraction-limited delivery | Nonlinear effects (SRS, SBS, SPM), back-reflection | Remote welding, fine cutting, AM, MOPA marking |
| Hollow-core fiber (anti-resonant, photonic bandgap) | UV–mid-IR by design | W–100s W | Very low nonlinearity: delivers ps/fs pulses | Cost, bend sensitivity, emerging supply base | Flexible ultrafast delivery |
| Hollow waveguides; IR fibers (chalcogenide, fluoride, sapphire) | 2–11 µm | W to tens of W | Mid-IR delivery | Fragile, lossy | Medical Er:YAG and CO₂, spectroscopy |

## 6.2 Feeding, delivery and process fibers

In fiber-laser installations the feeding fiber leaves the source (IPG lists 50, 100, 200 and 300 µm cores) and the process fiber runs to the head (100 µm to 1000 µm, lengths up to 100 m), linked through a fiber-to-fiber coupler, shutter or beam switch (IPG beam delivery). A beam switch time-shares one laser between stations; a beam splitter energy-shares it simultaneously. Because étendue cannot shrink, a process fiber must have an equal or larger core and NA than the feeding fiber; choosing it larger trades brightness for a bigger, more tolerant spot.

## 6.3 Fiber parameters

| Parameter | Definition | Typical values (≈) | Why it matters |
|---|---|---|---|
| Core diameter | Guiding region | SM 6–25 µm; delivery 50–1000 µm | Sets imaged spot (→ §4.5) and BPP |
| Cladding diameter | Glass around the core | e.g., 100/360 µm, 50/360 µm | Mechanical strength; cladding-light handling |
| Numerical aperture (NA) | sin of acceptance half-angle | 0.22 standard multimode; beam NA often ~0.08–0.12 | Collimator size, BPP |
| V-number | 2πa·NA/λ | < 2.405 for single-mode | Number of guided modes |
| BPP | ≈ core radius × effective NA | 50 µm ≈ 2; 100 µm ≈ 3.5–4; 200 µm ≈ 8 mm·mrad | Focusability and working distance |
| M² | Beam propagation ratio | SM < 1.1; few-mode 1.2–3 | Spot size and DOF |
| Mode content | Guided LP modes excited | SM, few-mode, fully filled multimode | Near-field profile, pointing stability, stability under bending |
| Core shape | Round, square, rectangular, ring | Square cores give top-hat spots | Uniform heating, cladding, hardening |
| Minimum bend radius | Static / dynamic | ~100–200 mm for armoured process cables | Robot dress-pack design |
| Damage threshold | End-face, bulk, nonlinear | End-caps (quartz block) cut end-face intensity by orders of magnitude | Peak power, contamination sensitivity |
| Cladding light and back-reflection | Unguided light, reflected process light | Mode strippers; back-reflection sensors | Protects connectors and source when processing Cu, Al, brass |

## 6.4 Industrial fiber connectors

| Connector | Power class (CW) | Cooling | Compatible interfaces (per supplier) | Notes |
|---|---|---|---|---|
| QBH (Quartz Block Head) | Up to ~10 kW standard; up to 15 kW in improved water-cooled versions | Water | TRUMPF LLK-Q; IPG HLC-8/LC-8 | De facto industrial standard; quartz end-cap, mode stripper, safety interlock, thermoswitch |
| QD | Up to 20 kW | Water | TRUMPF LLK-D; Highyag LLK-Auto; IPG LCA | High-power cutting and welding |
| RQB | ~1.5 kW | Air | QBH-type interface | Lower-power sources, diode lasers |
| LLK family | Supplier-specific | Water | TRUMPF laser light cables (LLK-D, LLK-Q, and others) | TRUMPF’s own naming |
| QCS, Q+ and similar | Supplier-specific (QBH-class to 20 kW+) | Water | Offered by several, mainly Chinese, cable makers as QBH-compatible or higher-power variants | Confirm mechanical fit, power rating and interlock wiring with the head supplier |
| SMA-905, FC/PC, FC/APC | mW to tens of W | None | Telecom and instrument standards | Seeds, low-power diodes, sensors — not for kW |

Power classes and interface equivalences are from Coherent’s QBH/QD fiber cable page, IPG’s bayonet table and Optizone’s cable range; confirm against current datasheets before specifying. A connector does four jobs: it expands the beam in a fused quartz end-cap so the glass–air surface sees low intensity; strips cladding light; carries cooling water; and closes the safety interlock loop so a broken or unplugged fiber stops the laser.

## 6.5 Delivery engineering rules

Respect the dynamic bend radius on robots; route cables in dress packs with strain relief.

Open connectors only under clean conditions and inspect end-caps with a fiber microscope; a single particle can burn an end-cap at kW power.

Protect the source from back-reflection when processing Cu, Al, brass or gold: slight beam tilt, back-reflection monitoring, and isolators on pulsed and seed lasers (Faraday rotators, TGG crystals at 1 µm).

Deliver ns MOPA pulses through the source’s own fiber and isolator head; deliver ps/fs pulses free-space or through hollow-core fiber, because solid-core fiber distorts high-peak-power pulses.

Size collimators to the fiber NA with margin: clipping at the collimator heats the head and degrades the spot.
