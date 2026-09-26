---
handbook: laser
handbook_title: "The Complete Laser Handbook"
part_index: 19
part_title: "Part XVIII — Medical"
source_document: "The_Complete_Laser_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
# Part XVIII — Medical

Medicine uses lasers in two completely different ways, and they must not be confused. Medical laser systems treat or diagnose patients and are themselves regulated medical devices (IEC 60601-2-22 for surgical, cosmetic, therapeutic and diagnostic laser equipment; FDA and EU MDR approvals). Manufacturing lasers build medical devices; they are industrial machines (IEC 60825-1, ISO 11553-1) whose processes are validated under the device maker’s quality system (ISO 13485; in the US, FDA’s QMSR, which incorporates ISO 13485 and took effect in February 2026).

| Aspect | Medical laser system | Manufacturing laser for medical devices |
|---|---|---|
| Target | Human tissue | Metals, polymers, glass used in devices |
| Regulation of the laser | Medical device approval and IEC 60601 series | Machinery and laser-product safety; not a medical device itself |
| Validation | Clinical evidence, device approval | Process validation (IQ/OQ/PQ) of each laser process |
| Wavelength logic | Tissue chromophores: water, haemoglobin, melanin, protein | Material absorption (Part IX) |

## 18.1 Clinical laser applications

| Field | Procedure | Laser (typical) | Why that wavelength |
|---|---|---|---|
| Surgery | Soft-tissue cutting and vaporisation | CO₂ 10.6 µm | Water absorption: shallow, haemostatic cuts |
| Surgery | Stone lithotripsy, prostate enucleation | Ho:YAG 2.1 µm; thulium fiber ~1.94 µm | Water absorption; silica-fiber delivery through endoscopes |
| Surgery | Prostate vaporisation, coagulation | 532 nm (KTP/LBO); 980/1470 nm diodes | Haemoglobin or water absorption |
| Surgery | Endovenous ablation | 1470 / 1940 nm diode or fiber | Water absorption in vein wall |
| Ophthalmology | Refractive surgery (PRK, LASIK ablation) | ArF excimer 193 nm | Photochemical corneal ablation with sub-µm precision |
| Ophthalmology | LASIK flaps, lenticule extraction, cataract incisions | Femtosecond ~1030 nm | Nonlinear absorption inside transparent tissue |
| Ophthalmology | Posterior capsulotomy, iridotomy | Q-switched Nd:YAG 1064 nm | Photodisruption |
| Ophthalmology | Retinal photocoagulation, trabeculoplasty | 532 / 577 nm | Melanin and haemoglobin absorption |
| Dermatology | Tattoo and pigment removal | Q-switched and ps Nd:YAG (1064/532), alexandrite 755 nm | Selective photothermolysis of pigment |
| Dermatology | Resurfacing (ablative, fractional) | CO₂, Er:YAG 2.94 µm | Water absorption |
| Dermatology | Hair removal | Diode ~810 nm, alexandrite 755 nm, Nd:YAG 1064 nm | Melanin in follicles, deeper penetration |
| Dermatology | Vascular lesions | Pulsed dye 585–595 nm, Nd:YAG | Haemoglobin absorption |
| Dentistry | Hard tissue (enamel, dentin, bone) | Er:YAG 2.94 µm, Er,Cr:YSGG 2.78 µm, CO₂ 9.3 µm | Water and hydroxyapatite absorption |
| Dentistry | Soft tissue | Diode 8xx–9xx nm, CO₂ | Coagulation, cutting |
| Diagnostics | OCT, flow cytometry, confocal microscopy, laser Doppler | SLDs, swept sources, visible and NIR lasers | Imaging and sensing, not tissue removal |

## 18.2 Medical device manufacturing

| Device | Laser process | Laser (typical) | Critical requirement |
|---|---|---|---|
| Stents (nitinol, Co-Cr, stainless, bioresorbable polymers) | Tube cutting of struts | Single-mode fiber (often with water-cooled tube); fs for low HAZ and polymers | Strut width tolerance, HAZ, dross; post-process electropolishing |
| Catheters and hypotubes | Spiral and pattern cutting, side holes, skiving of polymer layers, marker-band welding, polymer tip and balloon welding, marking | Fiber, fs, UV/excimer (skiving), Tm 2 µm (polymer welding), UV (marking) | Burr-free edges, no particle generation, biocompatibility |
| Implants (orthopaedic, dental, spinal) | UDI marking; porous structures by LPBF | ps or MOPA fiber (passivation- and autoclave-resistant black marks); LPBF | UDI readability after reprocessing; corrosion resistance |
| Active implants (pacemakers, neurostimulators) | Hermetic Ti can seam welding; feedthrough welding | Pulsed/QCW or CW fiber | Hermeticity (helium leak rate), no spatter inside |
| Surgical instruments | Welding, marking, cutting | Fiber, ps | Reprocessing durability |
| Needles and cannulas | Cutting, marking | Fiber, UV | Tip geometry, burr control |
| Diagnostic and microfluidic chips | Channel machining, welding, cutting | CO₂, UV, ps/fs | Channel accuracy, bonding without adhesives |
| Hearing aids, contact lenses, endoscopes | Micro-cutting, drilling, welding, marking | UV, fs, fiber | Precision and cleanliness |

Every manufacturing laser process used for a medical device needs a validated window (IQ/OQ/PQ), locked recipes, periodic power verification and full traceability of parameters to each lot (→ §12.5).
