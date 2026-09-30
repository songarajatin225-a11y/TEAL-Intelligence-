/**
 * AI-GENERATED REFERENCE DRAFTS — applications, materials, equipment types and equipment templates
 * drafted by an AI assistant from general engineering knowledge, at the platform owner's request.
 *
 * Writes (all data_type AI_GENERATED, verification DRAFT, confidence LOW):
 *   data/reference-drafts/source.json               the source every draft cites
 *   data/reference-drafts/materials.json            material CLASSES — properties left UNKNOWN (null)
 *   data/reference-drafts/applications.json         laser process applications — technology class and
 *                                                   rationale only; power, speed and quality left UNKNOWN
 *   data/reference-drafts/equipment-types.json      equipment CATEGORIES by domain — no manufacturer,
 *                                                   model, price, throughput or accuracy
 *   data/reference-drafts/equipment-templates.json  station structures for the Simulation Studio and the
 *                                                   3D twin — station times, capacities and costs empty
 *
 * What is deliberately NOT here (TEAL data rules): suppliers, companies, product models, prices, market
 * numbers, customers, certifications, performance values, POC / FAT / SAT results. A reviewer promotes a
 * record by changing its data_type and verification_status after checking it against a primary source.
 *
 *   npx tsx scripts/data/buildReferenceDrafts.ts
 */
import { join } from 'node:path';
import { DATA_DIR, writeJson } from '../lib/dataset';

const TODAY = '2026-09-29';
const SRC = 'src-ai-draft-knowledge';
const OUT = join(DATA_DIR, 'reference-drafts');
const NOTE = 'AI-generated draft from general engineering knowledge — not taken from a cited document. Engineering review required before use; values that need a source are left UNKNOWN.';
const prov = (extra: Record<string, unknown> = {}) => ({ source_id: SRC, retrieved_at: TODAY, verification_status: 'DRAFT', confidence: 'LOW', note: NOTE, ...extra });
const hdr = (id: string, title: string, entity: string, description: string, partition: string) => ({
  id,
  title,
  entity,
  description,
  version: '1.0.0',
  last_updated: TODAY,
  data_type: 'AI_GENERATED',
  source_ids: [SRC],
  partition,
  notes: 'Every record is an AI-generated DRAFT. Review against a primary source before relying on it.',
});

/* ------------------------------------------------------------------ source */

const source = {
  id: SRC,
  entity: 'source',
  name: 'AI-generated engineering drafts (unreviewed)',
  description:
    'Reference records drafted by an AI assistant from general engineering knowledge: application descriptions, material classes, equipment categories and equipment station structures. No manufacturer, model, price, market figure, certification or performance value is included.',
  kind: 'internal',
  source_type: 'Derived',
  organization: 'AI assistant (draft for TEAL engineering review)',
  retrieved_at: TODAY,
  next_review: '2026-12-31',
  data_type: 'AI_GENERATED',
  provenance: { verification_status: 'DRAFT', confidence: 'LOW', note: NOTE },
  tags: ['ai-generated', 'draft'],
};

/* --------------------------------------------------------------- materials */

const nullProps = { thermal_conductivity: null, melting_point: null, density: null, specific_heat: null, absorption: null };
const mat = (id: string, name: string, category: string, description: string) => ({
  id: `mat-${id}`,
  entity: 'material',
  name,
  category,
  description,
  ...nullProps,
  data_type: 'AI_GENERATED',
  provenance: prov({ note: `${NOTE} Thermal properties and absorptance are UNKNOWN here — enter them from a primary handbook with the grade, temper and surface condition.` }),
  tags: ['ai-generated', 'material-class'],
});
const materials = [
  mat('brass', 'Brass (Cu–Zn alloys)', 'Metal', 'Copper–zinc alloys used for connectors, fittings and decorative parts. Reflective in the near-infrared; zinc vaporises well below the copper melting range, which affects welding.'),
  mat('precious', 'Precious metals (gold, silver, platinum)', 'Metal', 'Jewellery, contacts and medical parts. Highly reflective and highly conductive; small, high-value parts.'),
  mat('coated-steel', 'Coated steel sheet (zinc / Al–Si)', 'Metal', 'Galvanised or aluminised steel sheet used in automotive bodies and appliances. The coating vaporises during welding and can cause porosity in lap joints.'),
  mat('tool-steel', 'Tool & die steels', 'Metal', 'Hardenable steels for moulds, dies and cutting tools — typical substrates for laser hardening, cladding repair and texturing.'),
  mat('superalloy', 'Nickel-based superalloys', 'Metal', 'Heat-resistant alloys used in turbine and exhaust parts; common in cooling-hole drilling, cladding and powder-bed fusion.'),
  mat('nitinol', 'Nitinol (Ni–Ti shape-memory alloy)', 'Metal', 'Shape-memory alloy used for stents and guidewires; the heat-affected zone influences the transformation behaviour.'),
  mat('wood', 'Wood, plywood & MDF', 'Organic', 'Natural and engineered wood. Absorbs far-infrared (CO₂) wavelengths well; cut edges char.'),
  mat('pmma', 'Acrylic (PMMA)', 'Polymer', 'Transparent thermoplastic for signage, light guides and displays. Vaporises cleanly under CO₂ lasers, giving a polished edge.'),
  mat('paper', 'Paper, label stock & cardboard', 'Organic', 'Packaging and label materials; used for coding, perforation and kiss-cutting.'),
  mat('textile', 'Textiles, leather & technical fabrics', 'Organic', 'Natural and synthetic fabrics, leather and non-wovens. Synthetic edges fuse (seal) when laser-cut.'),
  mat('rubber', 'Rubber & silicone elastomers', 'Polymer', 'Gaskets, seals and keypads. Cut edges may leave residue; fume extraction and filtration are required.'),
  mat('sapphire', 'Sapphire (Al₂O₃ single crystal)', 'Ceramic', 'Hard, transparent crystal used for cover windows, LED substrates and watch glasses; brittle, so crack-free processing is the main challenge.'),
  mat('thin-film', 'Thin-film coatings (TCO, metal, absorber layers)', 'Coating', 'Functional layers on glass or foil — ITO / TCO, metallisation and photovoltaic absorbers — patterned by selective ablation.'),
  mat('nd-magnet', 'NdFeB magnets & electrical steel', 'Metal', 'Rotor magnets and laminated electrical steel in e-motors; relevant to marking and welding of motor components.'),
  mat('ptfe', 'Fluoropolymers (PTFE, FEP)', 'Polymer', 'Wire insulation and medical tubing; decomposition products are hazardous, so extraction and filtration design matter.'),
  mat('lfp-nmc-cathode', 'Cathode-coated aluminium foil', 'Battery', 'Aluminium current collector carrying a cathode coating (e.g. LFP or NMC). Notching and slitting must avoid burrs and coating delamination.'),
];

/* ------------------------------------------------------------ applications */

type AppIn = { id: string; name: string; process: string; industries: string[]; materials: string[]; source?: string; description: string; rationale: string; tags?: string[] };
const app = (a: AppIn) => ({
  id: `app-ai.${a.id}`,
  entity: 'application',
  name: a.name,
  description: a.description,
  process: a.process,
  industries: a.industries,
  material_ids: a.materials,
  ...(a.source ? { recommended_source_id: a.source } : {}),
  recommended_power_w: null,
  rationale: a.rationale,
  data_type: 'AI_GENERATED',
  provenance: prov(),
  tags: ['ai-generated', ...(a.tags ?? [])],
});
const GE = 'General Engineering';
const applications = [
  // CUTTING
  app({ id: 'sheetcut', name: 'Sheet-metal profile cutting (steel & stainless)', process: 'Cutting', industries: [GE, 'Automotive', 'Aerospace'], materials: ['mat-steel', 'mat-ss'], source: 'las-smcw', description: 'Flatbed 2D cutting of steel and stainless sheet with a CW fiber laser and assist gas.', rationale: 'Steels absorb the ~1 µm fiber wavelength well and CW fiber sources dominate 2D sheet cutting. Oxygen assist is typical for mild steel and nitrogen for oxide-free stainless edges. Multi-kilowatt cutting sources are usually multimode — confirm the source class with the supplier.', tags: ['cutting'] }),
  app({ id: 'reflectcut', name: 'Reflective-metal sheet cutting (aluminium, brass, copper)', process: 'Cutting', industries: [GE, 'EMS', 'Automotive'], materials: ['mat-al', 'mat-brass', 'mat-cu'], source: 'las-smcw', description: 'Cutting of highly reflective sheet metals.', rationale: 'The ~1 µm fiber wavelength couples far better than 10.6 µm CO₂ into reflective metals. Back-reflection protection of the source must be confirmed for copper and brass.', tags: ['cutting'] }),
  app({ id: 'tubecut', name: 'Tube & profile cutting', process: 'Cutting', industries: [GE, 'Automotive'], materials: ['mat-steel', 'mat-ss', 'mat-al'], source: 'las-smcw', description: 'Rotary cutting of round, square and open profiles for frames, furniture and exhaust parts.', rationale: 'CW fiber with a rotary chuck axis. Chucking, support of long tubes and slag inside the tube are the main design points.', tags: ['cutting', 'tube'] }),
  app({ id: 'woodcut', name: 'Wood, plywood & MDF cutting and engraving', process: 'Cutting', industries: ['Consumer', GE], materials: ['mat-wood'], source: 'las-co2', description: 'Cutting and engraving of wood-based panels for signage, models and furniture parts.', rationale: 'Organic materials absorb the 10.6 µm CO₂ wavelength strongly. Edge charring and fume / fire risk drive extraction and air-assist design.', tags: ['cutting', 'organic'] }),
  app({ id: 'pmmacut', name: 'Acrylic (PMMA) cutting with polished edge', process: 'Cutting', industries: ['Consumer', GE], materials: ['mat-pmma'], source: 'las-co2', description: 'Cutting of acrylic sheet for displays, light guides and signage.', rationale: 'PMMA absorbs CO₂ radiation and vaporises cleanly, which leaves a flame-polished edge without post-processing.', tags: ['cutting', 'polymer'] }),
  app({ id: 'textilecut', name: 'Textile, leather & technical-fabric cutting', process: 'Cutting', industries: ['Consumer', 'Automotive'], materials: ['mat-textile'], source: 'las-co2', description: 'Contour cutting of fabrics, airbag material, filters and leather.', rationale: 'CO₂ lasers cut without tool wear and seal synthetic edges against fraying. Material handling (conveyor bed, roll feed) usually sets the throughput.', tags: ['cutting', 'organic'] }),
  app({ id: 'papercut', name: 'Paper, label & carton cutting / perforation', process: 'Cutting', industries: ['Consumer'], materials: ['mat-paper'], source: 'las-co2', description: 'Kiss-cutting of labels, perforation and die-less carton cutting.', rationale: 'CO₂ radiation is well absorbed by paper; a galvo scanner allows die-less, on-the-fly cutting of changing shapes.', tags: ['cutting', 'packaging'] }),
  app({ id: 'gasketcut', name: 'Rubber & silicone gasket cutting', process: 'Cutting', industries: ['Automotive', GE], materials: ['mat-rubber'], source: 'las-co2', description: 'Tool-less cutting of seals, gaskets and keypads.', rationale: 'CO₂ lasers cut elastomers without tooling; residue and fumes need extraction and filtration.', tags: ['cutting', 'polymer'] }),
  app({ id: 'stentcut', name: 'Stent & hypotube micro-cutting', process: 'Cutting', industries: ['Medical'], materials: ['mat-ss', 'mat-nitinol'], source: 'las-femto', description: 'Micro-cutting of thin-walled tubes into stents, catheter shafts and hypotubes.', rationale: 'Ultrafast pulses keep the heat-affected zone and recast minimal, which matters for fatigue life and for nitinol transformation behaviour. Rotary + linear motion under a fixed head.', tags: ['cutting', 'medical', 'ultrafast'] }),
  app({ id: 'glasscut', name: 'Display & cover-glass cutting (ultrafast)', process: 'Cutting', industries: ['Consumer', 'EMS'], materials: ['mat-glass', 'mat-sapphire'], source: 'las-pico', description: 'Crack-free cutting of thin glass and sapphire, including curved contours.', rationale: 'Ultrafast filamentation or modification inside the transparent material followed by cleaving gives low chipping compared with mechanical scribing.', tags: ['cutting', 'glass', 'ultrafast'] }),
  app({ id: 'pcbdepanel', name: 'PCB depaneling (UV laser)', process: 'Cutting', industries: ['EMS'], materials: ['mat-fr4', 'mat-pi'], source: 'las-uv', description: 'Singulation of rigid, rigid-flex and flex boards from the panel.', rationale: 'UV laser depaneling is stress-free and dust-free compared with routing or punching; carbonisation of the edge and cycle time per cut length must be validated.', tags: ['cutting', 'pcb'] }),
  app({ id: 'cfrptrim', name: 'CFRP trimming & contour cutting', process: 'Cutting', industries: ['Aerospace', 'Automotive'], materials: ['mat-composite'], source: 'las-pico', description: 'Trimming and cut-outs in carbon-fibre composites.', rationale: 'Carbon fibre and matrix react very differently to heat; short pulses limit matrix damage and delamination. Extraction of hazardous fibre dust is mandatory.', tags: ['cutting', 'composite'] }),
  app({ id: 'notching', name: 'Electrode notching (continuous web)', process: 'Cutting', industries: ['Battery'], materials: ['mat-battery-electrode', 'mat-lfp-nmc-cathode'], source: 'las-fiber', description: 'Cutting tabs into coated electrode foil moving on a web.', rationale: 'Pulsed fiber lasers with galvo scanners cut on the fly without tool wear. Burr height, coating delamination and particles are the critical quality criteria.', tags: ['cutting', 'battery'] }),
  // DICING / SCRIBING / MICROMACHINING
  app({ id: 'sicdicing', name: 'SiC wafer laser dicing', process: 'Dicing', industries: ['Semiconductor', 'Automotive'], materials: ['mat-sic'], source: 'las-pico', description: 'Singulation of silicon-carbide power-device wafers.', rationale: 'SiC is very hard, so blade dicing is slow and wears blades; laser-based dicing (internal modification or ablation) is an alternative. Die strength after dicing must be validated.', tags: ['dicing', 'semiconductor'] }),
  app({ id: 'grooving', name: 'Low-k grooving before blade dicing', process: 'Dicing', industries: ['Semiconductor'], materials: ['mat-si'], source: 'las-uv', description: 'Laser removal of the low-k / metal stack in the street before the blade cut.', rationale: 'Mechanical dicing can peel fragile low-k layers; a laser groove first removes them. Debris and heat-affected zone must be controlled.', tags: ['dicing', 'semiconductor'] }),
  app({ id: 'pvscribe', name: 'Thin-film PV scribing (P1 / P2 / P3)', process: 'Micromachining', industries: ['Semiconductor', GE], materials: ['mat-thin-film', 'mat-glass'], source: 'las-pico', description: 'Selective scribing of the layers that interconnect thin-film solar cells.', rationale: 'Each scribe removes one layer without damaging the one below, so wavelength and pulse duration are chosen per layer. Short pulses reduce thermal damage.', tags: ['scribing', 'solar'] }),
  app({ id: 'thinfilm', name: 'Selective thin-film ablation (ITO / coatings)', process: 'Micromachining', industries: ['Consumer', 'EMS'], materials: ['mat-thin-film', 'mat-glass'], source: 'las-pico', description: 'Patterning of transparent conductors and functional coatings on glass or film.', rationale: 'Ultrafast ablation removes the coating with little damage to the substrate. Isolation resistance of the pattern is the usual acceptance test.', tags: ['micromachining'] }),
  app({ id: 'texture', name: 'Functional surface texturing', process: 'Micromachining', industries: ['Medical', 'Automotive', GE], materials: ['mat-steel', 'mat-ti', 'mat-tool-steel'], source: 'las-femto', description: 'Micro-structures that change friction, wetting or adhesion (dimples, grooves, periodic structures).', rationale: 'Ultrafast pulses create micro- and nano-structures with minimal melt. Area rate is usually the economic limit.', tags: ['micromachining', 'surface'] }),
  app({ id: 'wirestrip', name: 'Laser wire stripping (insulation & enamel)', process: 'Micromachining', industries: ['EMS', 'Automotive', 'Medical'], materials: ['mat-cu', 'mat-ptfe', 'mat-poly'], source: 'las-co2', description: 'Removal of polymer insulation or enamel from fine wires and hairpins.', rationale: 'CO₂ radiation is absorbed by polymer insulation and largely reflected by the copper, so the conductor is not damaged. Enamel removal on hairpins often uses fiber or pulsed sources instead — choose per coating.', tags: ['stripping'] }),
  app({ id: 'trimming', name: 'Thick / thin-film resistor trimming', process: 'Trimming', industries: ['EMS', 'Semiconductor'], materials: ['mat-al2o3'], source: 'las-green', description: 'Closed-loop trimming of resistors on ceramic substrates to a target value.', rationale: 'The laser cuts a kerf while the resistance is measured in real time. Shorter wavelengths give narrower kerfs and less micro-cracking; the source class is chosen by film type.', tags: ['trimming'] }),
  // WELDING
  app({ id: 'galvweld', name: 'Coated (galvanised) steel lap welding', process: 'Welding', industries: ['Automotive', GE], materials: ['mat-coated-steel'], source: 'las-smcw', description: 'Lap welding of zinc-coated sheet in body and appliance parts.', rationale: 'Zinc vaporises well below the steel melting range; without a degassing gap or beam oscillation, the vapour causes porosity and spatter.', tags: ['welding'] }),
  app({ id: 'tailored', name: 'Tailor-welded blanks', process: 'Welding', industries: ['Automotive'], materials: ['mat-steel', 'mat-coated-steel'], source: 'las-smcw', description: 'Butt welding of sheets of different thickness or grade before stamping.', rationale: 'A narrow, low-distortion laser weld survives the later forming step. Edge preparation and gap control dominate quality.', tags: ['welding'] }),
  app({ id: 'plasticweld', name: 'Laser transmission welding of plastics', process: 'Welding', industries: ['Automotive', 'Medical', 'EMS'], materials: ['mat-poly'], source: 'las-diode', description: 'Joining a laser-transparent upper part to an absorbing lower part through the top part.', rationale: 'Near-infrared diode radiation passes the transparent part and is absorbed at the interface, giving a hermetic, particle-free seam. Clamping pressure and the transmission of the upper part must be validated.', tags: ['welding', 'polymer'] }),
  app({ id: 'bluecu', name: 'Copper welding with blue or green lasers', process: 'Welding', industries: ['Battery', 'EMS', 'Automotive'], materials: ['mat-cu'], source: 'las-blue', description: 'Conduction and keyhole welding of copper with visible wavelengths.', rationale: 'Copper absorbs visible light much better than 1 µm, giving a more stable process with less spatter — see the absorption values on the copper material record.', tags: ['welding', 'copper'] }),
  app({ id: 'cual', name: 'Dissimilar copper–aluminium joints', process: 'Welding', industries: ['Battery', 'Automotive'], materials: ['mat-cu', 'mat-al'], source: 'las-smcw', description: 'Welding of copper to aluminium in busbars and cell connectors.', rationale: 'Brittle intermetallic phases form when the two metals mix; beam oscillation and low dilution limit them. Joint resistance and ageing must be tested.', tags: ['welding', 'battery'] }),
  app({ id: 'jewelweld', name: 'Jewellery & precious-metal spot welding', process: 'Welding', industries: ['Consumer'], materials: ['mat-precious'], source: 'las-qcw', description: 'Repair and assembly welding of small precious-metal parts.', rationale: 'Pulsed, small-spot welding limits heat input on small, high-value parts; reflectivity varies strongly with alloy.', tags: ['welding', 'jewellery'] }),
  app({ id: 'motorweld', name: 'E-motor rotor & lamination welding', process: 'Welding', industries: ['Automotive'], materials: ['mat-nd-magnet', 'mat-steel'], source: 'las-smcw', description: 'Welding of lamination stacks and rotor components.', rationale: 'Low heat input keeps magnetic properties of the electrical steel. Magnet temperature limits must be respected.', tags: ['welding', 'e-motor'] }),
  // SOLDERING
  app({ id: 'lasersolder', name: 'Selective laser soldering (pins, connectors, flex)', process: 'Soldering', industries: ['EMS', 'Automotive'], materials: ['mat-fr4', 'mat-cu'], source: 'las-diode', description: 'Non-contact soldering of through-hole pins, connectors and flex-to-board joints.', rationale: 'A diode laser heats only the joint, which suits heat-sensitive neighbours and dense layouts. Solder feed (wire, paste, ball) and pyrometer control are key design points.', tags: ['soldering'] }),
  // CLEANING
  app({ id: 'prebondal', name: 'Surface activation before adhesive bonding', process: 'Cleaning', industries: ['Automotive', 'Aerospace'], materials: ['mat-al', 'mat-composite'], source: 'las-fiber', description: 'Removal of oils, release agents and weak oxide before bonding or coating.', rationale: 'Pulsed laser cleaning removes contaminants selectively and repeatably without chemicals. Bond strength after ageing is the acceptance test.', tags: ['cleaning'] }),
  app({ id: 'oxidecell', name: 'Oxide removal before welding (aluminium)', process: 'Cleaning', industries: ['Battery', 'Automotive'], materials: ['mat-al'], source: 'las-fiber', description: 'Removal of the oxide layer from aluminium joints just before welding.', rationale: 'Aluminium oxide causes porosity; laser cleaning directly before welding limits re-oxidation time.', tags: ['cleaning'] }),
  // DRILLING
  app({ id: 'microvia', name: 'PCB micro-via drilling', process: 'Drilling', industries: ['EMS', 'Semiconductor'], materials: ['mat-fr4', 'mat-cu'], source: 'las-uv', description: 'Blind micro-vias in HDI boards and IC substrates.', rationale: 'UV lasers ablate both copper and dielectric; CO₂ lasers are also common for dielectric-only openings under a copper window. Via taper and the bottom copper condition are the quality criteria.', tags: ['drilling', 'pcb'] }),
  app({ id: 'coolinghole', name: 'Cooling-hole drilling in turbine parts', process: 'Drilling', industries: ['Aerospace'], materials: ['mat-superalloy'], source: 'las-qcw', description: 'Percussion or trepanning drilling of shaped cooling holes in blades and vanes.', rationale: 'Long-pulse percussion drilling removes material quickly; recast layer and micro-cracks must stay within the customer specification.', tags: ['drilling', 'aerospace'] }),
  app({ id: 'finehole', name: 'Fine-hole drilling in foils & nozzles', process: 'Drilling', industries: ['Automotive', 'Medical', GE], materials: ['mat-ss'], source: 'las-pico', description: 'Small, precise holes for injectors, filters, sieves and medical parts.', rationale: 'Ultrafast pulses give clean holes with little recast; helical optics control taper.', tags: ['drilling', 'ultrafast'] }),
  app({ id: 'tgv', name: 'Through-glass via (TGV) drilling', process: 'Drilling', industries: ['Semiconductor'], materials: ['mat-glass'], source: 'las-pico', description: 'Via formation in glass interposers and substrates.', rationale: 'Laser modification followed by selective etching, or direct ultrafast drilling, avoids cracks in glass.', tags: ['drilling', 'packaging'] }),
  // MARKING
  app({ id: 'organicmark', name: 'Wood & leather engraving (personalisation)', process: 'Marking', industries: ['Consumer'], materials: ['mat-wood', 'mat-textile'], source: 'las-co2', description: 'Engraving of logos, text and images on wood and leather goods.', rationale: 'CO₂ radiation is absorbed strongly by organic materials; the contrast comes from controlled charring.', tags: ['marking', 'organic'] }),
  app({ id: 'glassmark', name: 'Glass & sapphire marking', process: 'Marking', industries: ['Consumer', 'Medical'], materials: ['mat-glass', 'mat-sapphire'], source: 'las-uv', description: 'Codes and logos on glass vials, displays and sapphire windows.', rationale: 'Short-wavelength or ultrafast sources mark transparent materials with less micro-cracking than CO₂.', tags: ['marking', 'glass'] }),
  app({ id: 'jewelmark', name: 'Jewellery & precious-metal engraving', process: 'Marking', industries: ['Consumer'], materials: ['mat-precious'], source: 'las-mopa', description: 'Hallmarks, serials and decoration on precious-metal items.', rationale: 'Adjustable pulse duration helps control depth and appearance on reflective, high-value parts.', tags: ['marking', 'jewellery'] }),
  app({ id: 'ceramicmark', name: 'Ceramic substrate marking', process: 'Marking', industries: ['EMS', 'Semiconductor'], materials: ['mat-al2o3', 'mat-aln'], source: 'las-uv', description: 'Serials and codes on alumina and AlN substrates.', rationale: 'Short wavelengths and short pulses reduce micro-cracks in brittle ceramics.', tags: ['marking', 'ceramic'] }),
  app({ id: 'packcode', name: 'Packaging date & batch coding', process: 'Marking', industries: ['Consumer'], materials: ['mat-paper', 'mat-poly'], source: 'las-co2', description: 'On-the-fly coding of cartons, labels and films on packaging lines.', rationale: 'CO₂ galvo coders mark without inks or consumables; line speed and code content decide the scanner and field size.', tags: ['marking', 'packaging'] }),
  app({ id: 'cablemark', name: 'Cable & wire insulation marking', process: 'Marking', industries: ['Aerospace', 'Automotive'], materials: ['mat-ptfe', 'mat-poly'], source: 'las-uv', description: 'Identification marks on wire insulation, including fluoropolymers.', rationale: 'UV marking changes colour without cutting through thin insulation; insulation integrity must be tested.', tags: ['marking', 'wire'] }),
  app({ id: 'toolmark', name: 'Tool & die marking (deep, wear-resistant)', process: 'Marking', industries: [GE, 'Automotive'], materials: ['mat-tool-steel'], source: 'las-fiber', description: 'Durable identification on moulds, dies and cutting tools.', rationale: 'Deep engraving with pulsed fiber survives wear and re-coating; depth per pass is validated on the actual hardness.', tags: ['marking'] }),
  // OTHER (additive, hardening, cladding)
  app({ id: 'cladding', name: 'Laser cladding / directed-energy deposition repair', process: 'Other', industries: ['Aerospace', GE, 'Automotive'], materials: ['mat-tool-steel', 'mat-superalloy'], source: 'las-diode', description: 'Deposition of wear- or corrosion-resistant layers and repair of worn parts with powder or wire.', rationale: 'Direct diode or fiber sources with a wide spot give low dilution; powder feed and robot path are the main design points.', tags: ['cladding', 'additive'] }),
  app({ id: 'hardening', name: 'Laser surface hardening', process: 'Other', industries: ['Automotive', GE], materials: ['mat-steel', 'mat-tool-steel'], source: 'las-diode', description: 'Selective transformation hardening of wear zones without quenching media.', rationale: 'A rectangular diode beam profile heats the surface evenly; pyrometer control keeps below melting. Hardness depth is validated by sectioning.', tags: ['hardening'] }),
  app({ id: 'lpbf', name: 'Metal powder-bed fusion (additive manufacturing)', process: 'Other', industries: ['Aerospace', 'Medical', GE], materials: ['mat-ti', 'mat-superalloy', 'mat-ss'], source: 'las-smcw', description: 'Layer-by-layer melting of metal powder into complex parts.', rationale: 'Single-mode CW fiber lasers with galvo scanners are typical. Powder handling, inert gas flow and part qualification dominate engineering effort.', tags: ['additive'] }),
  // INSPECTION (no laser source)
  app({ id: 'weldmonitor', name: 'In-process weld monitoring', process: 'Inspection', industries: ['Battery', 'Automotive'], materials: ['mat-cu', 'mat-al'], description: 'Monitoring of laser welds while they are made (photodiodes, cameras, optical coherence).', rationale: 'In-process sensing detects defects at the weld instead of after it; correlation to destructive tests must be established per joint.', tags: ['inspection', 'sensing'] }),
];

/* ---------------------------------------------------------- equipment types */

type EqIn = { id: string; name: string; domain: string; type: string; process: string; description: string; material?: string; automation?: string; laser?: string; vision?: string; motion?: string; safety?: string; qual?: string; clean?: string; tech?: string[] };
const eq = (e: EqIn) => ({
  id: `eqp-${e.id}`,
  entity: 'equipment',
  name: e.name,
  description: e.description,
  domain_id: e.domain,
  equipment_type: e.type,
  process: e.process,
  ...(e.material ? { material: e.material } : {}),
  ...(e.automation ? { automation_level: e.automation } : {}),
  ...(e.laser ? { laser_requirement: e.laser } : {}),
  ...(e.vision ? { vision: e.vision } : {}),
  ...(e.motion ? { motion: e.motion } : {}),
  ...(e.safety ? { safety: e.safety } : {}),
  ...(e.qual ? { qualification_requirements: e.qual } : {}),
  ...(e.clean ? { cleanroom_requirement: e.clean } : {}),
  ...(e.tech ? { technology_ids: e.tech } : {}),
  capex: null,
  data_type: 'AI_GENERATED',
  provenance: prov({ note: `${NOTE} Equipment CATEGORY, not a product: no manufacturer, model, price, throughput or accuracy is stated.` }),
  tags: ['ai-generated', 'equipment-type'],
});
const LS = 'Laser Class 4 source inside a Class 1 enclosure with interlocked doors — conformity must be assessed, not assumed';
const SEMI = 'Fab qualification typically asks for SEMI S2 / S8 safety and ergonomics assessment and SECS/GEM host communication — confirm with the customer';
const CR = 'Cleanroom class set by the customer process — Not Available';
const DRY = 'Dry-room / low-dew-point environment usually required for cell assembly — value set by the cell maker';
const S = 'dom-semiconductor';
const E = 'dom-electronics';
const B = 'dom-battery';
const L = 'dom-laser';
const A = 'dom-automation';
const M = 'dom-advanced-manufacturing';
const equipment = [
  // SEMICONDUCTOR — front-end support and back-end (ATMP)
  eq({ id: 'wafer-backgrinder', name: 'Wafer back-grinder', domain: S, type: 'Back-end — thinning', process: 'Wafer thinning', description: 'Grinds wafers to final thickness before dicing; often combined with stress-relief polishing.', material: 'Silicon, SiC, compound-semiconductor wafers', automation: 'Cassette-to-cassette automatic', motion: 'Spindles, rotary chuck table', qual: SEMI, clean: CR, tech: ['tec-semiconductor'] }),
  eq({ id: 'wafer-mounter', name: 'Wafer mounter / tape laminator', domain: S, type: 'Back-end — preparation', process: 'Tape mounting', description: 'Mounts the wafer on dicing tape in a frame; UV-release tapes are cured afterwards.', material: 'Wafers, dicing tape, frames', automation: 'Automatic', qual: SEMI, clean: CR, tech: ['tec-semiconductor'] }),
  eq({ id: 'blade-dicer', name: 'Blade dicing saw', domain: S, type: 'Back-end — singulation', process: 'Dicing', description: 'Singulates wafers with a rotating diamond blade along the streets.', material: 'Silicon, glass, ceramics, packages', automation: 'Automatic with vision alignment', vision: 'Street alignment and kerf inspection', motion: 'High-speed spindle, X/Y/Z/θ stages', qual: SEMI, clean: CR, tech: ['tec-semiconductor'] }),
  eq({ id: 'laser-dicer', name: 'Laser dicing / grooving system', domain: S, type: 'Back-end — singulation', process: 'Dicing', description: 'Singulates or grooves wafers by laser — ablation, internal modification or grooving before blade dicing.', material: 'Silicon, SiC, low-k stacks, glass', automation: 'Automatic', laser: 'Pulsed UV, IR or ultrafast depending on method — see laser source classes', vision: 'Street alignment', motion: 'X/Y/θ stages, autofocus', safety: LS, qual: SEMI, clean: CR, tech: ['tec-laser', 'tec-ultrafast', 'tec-semiconductor'] }),
  eq({ id: 'die-bonder', name: 'Die bonder', domain: S, type: 'Back-end — assembly', process: 'Die attach', description: 'Picks dies from the tape and places them on substrates or lead frames with adhesive, solder or sinter.', material: 'Dies, lead frames, substrates', automation: 'Automatic', vision: 'Die and substrate recognition', motion: 'Bond head, wafer table, ejector', qual: SEMI, clean: CR, tech: ['tec-semiconductor', 'tec-vision'] }),
  eq({ id: 'flipchip-bonder', name: 'Flip-chip / thermocompression bonder', domain: S, type: 'Back-end — assembly', process: 'Die attach', description: 'Places bumped dies face-down and bonds them by reflow or thermocompression.', material: 'Bumped dies, substrates', automation: 'Automatic', vision: 'Up/down-looking alignment', motion: 'High-precision bond head with force control', qual: SEMI, clean: CR, tech: ['tec-semiconductor'] }),
  eq({ id: 'wire-bonder', name: 'Wire bonder', domain: S, type: 'Back-end — interconnect', process: 'Wire bonding', description: 'Connects die pads to the package with fine gold, copper or aluminium wire (ball or wedge bonding).', material: 'Au / Cu / Al wire', automation: 'Automatic', vision: 'Pad recognition', motion: 'Bond head with ultrasonic transducer, X/Y table', qual: SEMI, clean: CR, tech: ['tec-semiconductor'] }),
  eq({ id: 'plasma-cleaner', name: 'Plasma cleaner', domain: S, type: 'Back-end — surface preparation', process: 'Cleaning', description: 'Removes organic contamination before wire bonding or moulding to improve adhesion.', material: 'Strips, substrates', automation: 'Batch or inline', qual: SEMI, clean: CR, tech: ['tec-semiconductor'] }),
  eq({ id: 'mould-press', name: 'Transfer / compression moulding system', domain: S, type: 'Back-end — encapsulation', process: 'Moulding', description: 'Encapsulates dies and wires in epoxy mould compound.', material: 'Epoxy mould compound', automation: 'Automatic', qual: SEMI, clean: CR, tech: ['tec-semiconductor'] }),
  eq({ id: 'package-marker', name: 'Package laser marker', domain: S, type: 'Back-end — identification', process: 'Marking', description: 'Marks logos, codes and serials on moulded packages or strips.', material: 'Epoxy mould compound, substrates', automation: 'Strip or tray automatic', laser: 'Pulsed fiber, green or UV — see laser source classes', vision: 'Mark inspection (OCR / 2D)', safety: LS, qual: SEMI, clean: CR, tech: ['tec-laser', 'tec-semiconductor'] }),
  eq({ id: 'trim-form', name: 'Trim & form system', domain: S, type: 'Back-end — lead finishing', process: 'Trim & form', description: 'Cuts dam bars and forms leads of lead-frame packages.', material: 'Lead frames', automation: 'Automatic', qual: SEMI, tech: ['tec-semiconductor'] }),
  eq({ id: 'package-saw', name: 'Package singulation saw', domain: S, type: 'Back-end — singulation', process: 'Singulation', description: 'Cuts moulded strips into individual packages (QFN, BGA).', material: 'Moulded strips', automation: 'Automatic with vision', qual: SEMI, tech: ['tec-semiconductor'] }),
  eq({ id: 'test-handler', name: 'Test handler', domain: S, type: 'Back-end — test', process: 'Final test', description: 'Presents packaged devices to the tester at temperature and sorts them into bins.', material: 'Packaged devices', automation: 'Automatic (pick-and-place, gravity or turret)', motion: 'Pick-and-place heads, soak chamber', qual: SEMI, tech: ['tec-semiconductor', 'tec-automation'] }),
  eq({ id: 'wafer-prober', name: 'Wafer prober', domain: S, type: 'Test — wafer sort', process: 'Wafer test', description: 'Aligns wafers under a probe card for electrical testing of each die.', material: 'Wafers', automation: 'Cassette automatic', vision: 'Probe-to-pad alignment', qual: SEMI, clean: CR, tech: ['tec-semiconductor'] }),
  eq({ id: 'wafer-aoi', name: 'Wafer / die optical inspection', domain: S, type: 'Inspection', process: 'Inspection', description: 'Detects defects on wafers, dies or bumps with optical imaging.', automation: 'Automatic', vision: 'Bright-/dark-field imaging', qual: SEMI, clean: CR, tech: ['tec-aoi', 'tec-vision', 'tec-semiconductor'] }),
  eq({ id: 'xray-semi', name: 'X-ray inspection (packages)', domain: S, type: 'Inspection', process: 'Inspection', description: 'Inspects wire sweep, voids and bump joints inside packages.', automation: 'Offline or inline', safety: 'Radiation shielding and interlocks — conformity must be assessed', tech: ['tec-semiconductor'] }),
  eq({ id: 'tape-reel', name: 'Tape & reel system', domain: S, type: 'Back-end — packing', process: 'Packing', description: 'Places tested devices into carrier tape, seals it and winds it on reels.', automation: 'Automatic', vision: 'Orientation and lead inspection', tech: ['tec-semiconductor', 'tec-automation'] }),
  eq({ id: 'wafer-id-marker', name: 'Wafer ID laser marker', domain: S, type: 'Front-end support — identification', process: 'Marking', description: 'Writes the wafer ID (hard or soft mark) near the notch or flat.', material: 'Silicon and compound wafers', automation: 'Cassette / FOUP automatic', laser: 'Pulsed UV or IR — see laser source classes', vision: 'Notch finding and ID read-back', safety: LS, qual: SEMI, clean: CR, tech: ['tec-laser', 'tec-semiconductor'] }),
  // ELECTRONICS / EMS
  eq({ id: 'paste-printer', name: 'Solder-paste stencil printer', domain: E, type: 'SMT', process: 'Printing', description: 'Prints solder paste through a stencil onto PCB pads.', material: 'PCBs, solder paste', automation: 'Inline', vision: 'Board-to-stencil alignment', tech: ['tec-automation'] }),
  eq({ id: 'spi', name: 'Solder-paste inspection (SPI)', domain: E, type: 'SMT inspection', process: 'Inspection', description: 'Measures paste volume, area and height after printing, usually in 3D.', automation: 'Inline', vision: '3D measurement', tech: ['tec-aoi', 'tec-vision'] }),
  eq({ id: 'pick-place', name: 'SMT pick-and-place mounter', domain: E, type: 'SMT', process: 'Assembly', description: 'Places surface-mount components from feeders onto the board.', automation: 'Inline', vision: 'Component centring, fiducials', motion: 'Gantry heads, nozzles, feeders', tech: ['tec-automation', 'tec-vision', 'tec-motion'] }),
  eq({ id: 'reflow-oven', name: 'Reflow oven', domain: E, type: 'SMT', process: 'Soldering', description: 'Melts the solder paste with a controlled temperature profile, optionally in nitrogen.', automation: 'Inline conveyor', tech: ['tec-automation'] }),
  eq({ id: 'aoi', name: 'Automated optical inspection (AOI)', domain: E, type: 'Inspection', process: 'Inspection', description: 'Checks placement and solder joints after reflow.', automation: 'Inline', vision: '2D / 3D imaging', tech: ['tec-aoi', 'tec-vision'] }),
  eq({ id: 'axi', name: 'Automated X-ray inspection (AXI)', domain: E, type: 'Inspection', process: 'Inspection', description: 'Inspects hidden joints such as BGA and QFN.', automation: 'Inline or offline', safety: 'Radiation shielding and interlocks — conformity must be assessed' }),
  eq({ id: 'selective-solder', name: 'Selective soldering system', domain: E, type: 'THT soldering', process: 'Soldering', description: 'Solders through-hole joints with a mini-wave after fluxing and preheating.', automation: 'Inline', motion: 'X/Y/Z board or nozzle motion', tech: ['tec-automation'] }),
  eq({ id: 'wave-solder', name: 'Wave soldering machine', domain: E, type: 'THT soldering', process: 'Soldering', description: 'Solders through-hole boards over a solder wave.', automation: 'Inline conveyor' }),
  eq({ id: 'laser-solder', name: 'Laser soldering system', domain: E, type: 'Selective soldering', process: 'Soldering', description: 'Solders individual joints with a laser and wire, paste or ball feed.', automation: 'Cell or inline', laser: 'Diode laser — see laser source classes', vision: 'Joint alignment', safety: LS, tech: ['tec-laser', 'tec-closed-loop-control'] }),
  eq({ id: 'conformal-coat', name: 'Selective conformal-coating system', domain: E, type: 'Coating', process: 'Coating', description: 'Applies protective coating selectively, followed by curing and UV inspection.', automation: 'Inline', vision: 'UV-fluorescence inspection', motion: 'X/Y/Z valve motion' }),
  eq({ id: 'ict', name: 'In-circuit tester (ICT)', domain: E, type: 'Test', process: 'Testing', description: 'Tests components and nets through a bed-of-nails fixture.', automation: 'Inline or offline' }),
  eq({ id: 'flying-probe', name: 'Flying-probe tester', domain: E, type: 'Test', process: 'Testing', description: 'Tests boards with moving probes, without a dedicated fixture — suits low volume and prototypes.', automation: 'Offline or inline', motion: 'Multiple probe axes' }),
  eq({ id: 'fct', name: 'Functional test station (FCT)', domain: E, type: 'Test', process: 'Testing', description: 'Powers the assembly and checks its functions against the product specification.', automation: 'Manual, semi or fully automatic' }),
  eq({ id: 'depaneler', name: 'PCB depaneling system (router or laser)', domain: E, type: 'Depaneling', process: 'Cutting', description: 'Separates boards from the panel by routing, sawing or laser cutting.', automation: 'Offline or inline', laser: 'UV laser for stress-free depaneling (laser variant)', vision: 'Fiducial alignment', safety: LS, tech: ['tec-laser', 'tec-uv'] }),
  eq({ id: 'pcb-marker', name: 'PCB laser marker', domain: E, type: 'Identification', process: 'Marking', description: 'Marks 2D codes and serials on boards for traceability.', automation: 'Inline', laser: 'CO₂, UV or fiber depending on surface — see laser source classes', vision: 'Code verification', safety: LS, tech: ['tec-laser', 'tec-mes'] }),
  eq({ id: 'press-fit', name: 'Press-fit connector press', domain: E, type: 'Assembly', process: 'Pressing', description: 'Presses compliant-pin connectors into boards with force–distance monitoring.', automation: 'Semi or fully automatic', motion: 'Servo press' }),
  // BATTERY
  eq({ id: 'electrode-coater', name: 'Electrode coater & dryer', domain: B, type: 'Electrode manufacturing', process: 'Coating', description: 'Coats slurry onto current-collector foil and dries it in a long oven.', material: 'Cathode / anode slurry, Al / Cu foil', automation: 'Continuous roll-to-roll', tech: ['tec-lithium-ion'] }),
  eq({ id: 'calender', name: 'Calender', domain: B, type: 'Electrode manufacturing', process: 'Calendering', description: 'Compresses the dried electrode to target density and thickness.', automation: 'Continuous roll-to-roll', tech: ['tec-lithium-ion'] }),
  eq({ id: 'slitter', name: 'Electrode slitter', domain: B, type: 'Electrode manufacturing', process: 'Slitting', description: 'Slits wide electrode rolls into narrower strips.', automation: 'Continuous roll-to-roll', tech: ['tec-lithium-ion'] }),
  eq({ id: 'laser-notcher', name: 'Laser electrode notcher', domain: B, type: 'Electrode manufacturing', process: 'Notching', description: 'Cuts tabs into the moving electrode web with galvo-scanned lasers.', material: 'Coated Al / Cu foil', automation: 'Continuous roll-to-roll', laser: 'Pulsed fiber — see laser source classes', vision: 'Burr and tab-position inspection', safety: LS, tech: ['tec-laser', 'tec-galvo', 'tec-lithium-ion'] }),
  eq({ id: 'winder', name: 'Cell winder', domain: B, type: 'Cell assembly', process: 'Winding', description: 'Winds electrodes and separator into jelly rolls for cylindrical or prismatic cells.', automation: 'Automatic', clean: DRY, tech: ['tec-lithium-ion'] }),
  eq({ id: 'stacker', name: 'Electrode stacker (Z-fold)', domain: B, type: 'Cell assembly', process: 'Stacking', description: 'Stacks anode and cathode sheets with Z-folded separator for pouch and prismatic cells.', automation: 'Automatic', vision: 'Sheet alignment', clean: DRY, tech: ['tec-lithium-ion', 'tec-vision'] }),
  eq({ id: 'tab-welder-us', name: 'Ultrasonic tab welder', domain: B, type: 'Cell assembly', process: 'Welding', description: 'Joins foil stacks to tabs by ultrasonic welding.', automation: 'Automatic', clean: DRY, tech: ['tec-lithium-ion'] }),
  eq({ id: 'tab-welder-laser', name: 'Laser tab / terminal welder', domain: B, type: 'Cell assembly', process: 'Welding', description: 'Welds tabs to terminals or lids with a laser.', automation: 'Automatic', laser: 'CW fiber, green or blue — see laser source classes', vision: 'Seam finding', safety: LS, tech: ['tec-laser', 'tec-lithium-ion'] }),
  eq({ id: 'electrolyte-filler', name: 'Electrolyte filling system', domain: B, type: 'Cell assembly', process: 'Filling', description: 'Evacuates the cell, doses electrolyte and lets it wet the electrodes before sealing.', automation: 'Automatic', safety: 'Electrolyte handling (flammable, toxic) — process safety assessment required', clean: DRY, tech: ['tec-lithium-ion'] }),
  eq({ id: 'formation', name: 'Formation & ageing system', domain: B, type: 'Cell finishing', process: 'Formation', description: 'First charge / discharge cycles and storage to form the SEI and screen out weak cells.', automation: 'Automatic racks with tray handling', safety: 'Thermal-runaway detection and suppression — assessment required', tech: ['tec-lithium-ion'] }),
  eq({ id: 'grader', name: 'Cell grading & OCV/IR sorter', domain: B, type: 'Cell finishing', process: 'Testing', description: 'Measures open-circuit voltage and internal resistance and sorts cells into grades.', automation: 'Automatic', tech: ['tec-lithium-ion'] }),
  eq({ id: 'module-line', name: 'Module stacking & compression station', domain: B, type: 'Module assembly', process: 'Assembly', description: 'Stacks cells with spacers and compresses them into module frames.', automation: 'Automatic', vision: 'Cell polarity and position check', tech: ['tec-lithium-ion', 'tec-robotics'] }),
  eq({ id: 'busbar-welder', name: 'Busbar laser welder', domain: B, type: 'Module assembly', process: 'Welding', description: 'Welds busbars to cell terminals in modules and packs.', automation: 'Automatic', laser: 'CW fiber with beam oscillation, or green / blue — see laser source classes', vision: 'Terminal position measurement', safety: LS, tech: ['tec-laser', 'tec-lithium-ion'] }),
  eq({ id: 'pack-eol', name: 'Pack end-of-line tester', domain: B, type: 'Pack assembly', process: 'Testing', description: 'Electrical, insulation and BMS communication tests of the finished pack.', automation: 'Semi or fully automatic', safety: 'High-voltage safety concept required', tech: ['tec-lithium-ion'] }),
  eq({ id: 'battery-leak', name: 'Pack / module leak tester', domain: B, type: 'Pack assembly', process: 'Leak testing', description: 'Checks enclosure tightness by pressure decay or tracer gas.', automation: 'Semi or fully automatic', tech: ['tec-lithium-ion'] }),
  // LASER & PHOTONICS
  eq({ id: 'fiber-cutter', name: 'Flatbed fiber-laser cutting machine', domain: L, type: 'Laser cutting', process: 'Cutting', description: '2D sheet cutting with a gantry-mounted cutting head and shuttle tables.', material: 'Steel, stainless, aluminium, brass, copper sheet', automation: 'Standalone; optional load / unload towers', laser: 'CW fiber — see laser source classes', motion: 'Gantry with linear or rack-and-pinion drives, capacitive height control', safety: LS, tech: ['tec-fiber-laser', 'tec-cw', 'tec-motion'] }),
  eq({ id: 'tube-cutter', name: 'Tube laser cutting machine', domain: L, type: 'Laser cutting', process: 'Cutting', description: 'Cuts tubes and profiles with rotary chucks and a cutting head.', automation: 'Bundle loader and part unloader optional', laser: 'CW fiber — see laser source classes', motion: 'Rotary chucks, linear axes', safety: LS, tech: ['tec-fiber-laser', 'tec-cw'] }),
  eq({ id: 'co2-cutter', name: 'CO₂ laser cutting / engraving system', domain: L, type: 'Laser cutting', process: 'Cutting', description: 'Cuts and engraves non-metals: wood, acrylic, textiles, paper, rubber.', automation: 'Standalone or roll-fed', laser: 'Sealed CO₂ — see laser source classes', safety: 'Fire risk and fume extraction; laser safety conformity must be assessed', tech: ['tec-co2-laser'] }),
  eq({ id: 'galvo-marker', name: 'Galvo laser marking workstation', domain: L, type: 'Laser marking', process: 'Marking', description: 'Class 1 workstation or integrable head for marking and engraving.', automation: 'Manual load or integrated', laser: 'Fiber, MOPA, UV, green or CO₂ — see laser source classes', safety: LS, tech: ['tec-galvo', 'tec-laser'] }),
  eq({ id: 'weld-cell', name: 'Laser welding cell (robot or gantry)', domain: L, type: 'Laser welding', process: 'Welding', description: 'Welds 2D/3D seams with a fixed optic, wobble head or remote scanner on a robot or gantry.', automation: 'Cell with fixtures and turntable', laser: 'CW fiber, QCW or diode — see laser source classes', vision: 'Seam tracking optional', motion: 'Robot or gantry', safety: LS, tech: ['tec-laser', 'tec-robotics', 'tec-in-process-sensing'] }),
  eq({ id: 'cleaning-system', name: 'Laser cleaning system', domain: L, type: 'Laser cleaning', process: 'Cleaning', description: 'Removes rust, paint, oxide and contamination; handheld or integrated.', automation: 'Handheld, robot or inline', laser: 'Pulsed fiber — see laser source classes', safety: LS, tech: ['tec-laser'] }),
  eq({ id: 'cladding-cell', name: 'Laser cladding / DED cell', domain: L, type: 'Laser deposition', process: 'Cladding', description: 'Deposits metal powder or wire with a laser for coating and repair.', automation: 'Robot or CNC cell', laser: 'Direct diode or CW fiber — see laser source classes', motion: 'Robot or 5-axis CNC with powder feeder', safety: LS, tech: ['tec-laser', 'tec-robotics'] }),
  eq({ id: 'hardening-cell', name: 'Laser hardening cell', domain: L, type: 'Laser heat treatment', process: 'Hardening', description: 'Selective surface hardening with temperature-controlled laser heating.', automation: 'Robot or CNC cell', laser: 'Direct diode — see laser source classes', safety: LS, tech: ['tec-laser', 'tec-closed-loop-control'] }),
  eq({ id: 'ultrafast-station', name: 'Ultrafast micromachining workstation', domain: L, type: 'Laser micromachining', process: 'Micromachining', description: 'Precision cutting, drilling and structuring with picosecond or femtosecond lasers.', automation: 'Standalone with vision alignment', laser: 'Picosecond / femtosecond — see laser source classes', vision: 'Coaxial alignment camera', motion: 'Precision stages plus galvo', safety: LS, tech: ['tec-ultrafast', 'tec-picosecond', 'tec-femtosecond'] }),
  // INDUSTRIAL AUTOMATION
  eq({ id: 'robot-cell', name: '6-axis robot cell', domain: A, type: 'Robotics', process: 'Handling', description: 'Articulated robot for handling, assembly or process tasks inside a guarded cell.', automation: 'Automatic', safety: 'Guarding and safety functions per risk assessment — conformity must be assessed', tech: ['tec-robotics'] }),
  eq({ id: 'scara-cell', name: 'SCARA pick-and-place cell', domain: A, type: 'Robotics', process: 'Handling', description: 'Fast planar pick-and-place of small parts.', automation: 'Automatic', vision: 'Part location optional', tech: ['tec-robotics', 'tec-vision'] }),
  eq({ id: 'cobot', name: 'Collaborative robot station', domain: A, type: 'Robotics', process: 'Handling', description: 'Robot working near people with speed and force limits.', automation: 'Semi-automatic / collaborative', safety: 'Collaborative operation needs an application-level risk assessment', tech: ['tec-robotics'] }),
  eq({ id: 'screwdriver', name: 'Automatic screwdriving station', domain: A, type: 'Assembly', process: 'Assembly', description: 'Feeds and drives screws with torque / angle monitoring.', automation: 'Semi or fully automatic', tech: ['tec-automation'] }),
  eq({ id: 'servo-press', name: 'Servo press station', domain: A, type: 'Assembly', process: 'Pressing', description: 'Press-fit with force–displacement monitoring and evaluation windows.', automation: 'Semi or fully automatic', motion: 'Servo press', tech: ['tec-automation', 'tec-motion'] }),
  eq({ id: 'dispenser', name: 'Adhesive / sealant dispensing station', domain: A, type: 'Assembly', process: 'Dispensing', description: 'Applies beads or dots of adhesive, sealant or thermal material.', automation: 'Semi or fully automatic', vision: 'Bead inspection', motion: 'X/Y/Z or robot-guided valve', tech: ['tec-automation'] }),
  eq({ id: 'vision-station', name: 'Machine-vision inspection station', domain: A, type: 'Inspection', process: 'Inspection', description: 'Camera-based presence, dimension and defect checks.', automation: 'Inline', vision: '2D / 3D cameras, lighting', tech: ['tec-vision', 'tec-aoi'] }),
  eq({ id: 'leak-tester', name: 'Leak test station', domain: A, type: 'Test', process: 'Leak testing', description: 'Pressure-decay, flow or tracer-gas leak testing.', automation: 'Semi or fully automatic', tech: ['tec-automation'] }),
  eq({ id: 'palletizer', name: 'Robot palletizer', domain: A, type: 'End-of-line', process: 'Palletizing', description: 'Stacks cases or trays onto pallets in programmed patterns.', automation: 'Automatic', tech: ['tec-robotics'] }),
  eq({ id: 'amr', name: 'Autonomous mobile robot (AMR) transport', domain: A, type: 'Intralogistics', process: 'Transport', description: 'Moves material between stations without fixed conveyors.', automation: 'Automatic with fleet management', safety: 'Safety scanners and route risk assessment', tech: ['tec-robotics', 'tec-industry-4-0'] }),
  eq({ id: 'conveyor', name: 'Pallet / belt conveyor system', domain: A, type: 'Transfer', process: 'Transport', description: 'Links stations with belts, rollers or workpiece-carrier pallets.', automation: 'Automatic', tech: ['tec-automation'] }),
  // ADVANCED MANUFACTURING
  eq({ id: 'lpbf', name: 'Metal powder-bed fusion system', domain: M, type: 'Additive manufacturing', process: 'Additive manufacturing', description: 'Builds metal parts layer by layer from powder with one or more galvo-scanned lasers.', material: 'Titanium, nickel alloys, stainless, aluminium powders', automation: 'Build-job automatic; powder handling separate', laser: 'Single-mode CW fiber — see laser source classes', safety: 'Laser safety plus reactive-powder and inert-gas hazards — assessment required', tech: ['tec-laser', 'tec-galvo'] }),
  eq({ id: 'cnc-5axis', name: '5-axis CNC machining centre', domain: M, type: 'Machining', process: 'Machining', description: 'Subtractive machining of complex parts in one set-up.', automation: 'Standalone or with pallet / robot loading', tech: ['tec-motion'] }),
  eq({ id: 'cmm', name: 'Coordinate measuring machine (CMM)', domain: M, type: 'Metrology', process: 'Metrology', description: 'Measures part geometry against the drawing with tactile or optical probes.', automation: 'Offline or shop-floor', tech: ['tec-vision'] }),
  eq({ id: 'ultrasonic-welder', name: 'Ultrasonic welding system', domain: M, type: 'Joining', process: 'Welding', description: 'Joins plastics or thin metals with high-frequency vibration.', automation: 'Semi or fully automatic', tech: ['tec-automation'] }),
];

/* -------------------------------------------------------- equipment templates */

type St = Record<string, unknown>;
const st = (key: string, name: string, kind: string, o: St = {}): St => ({ key, name, kind, time_s: null, parallel: 1, buffer_after: 0, ...o });
const slot = (role: string, product_type: string, required = true) => ({ role, product_type, required });
const CAM = [slot('Camera', 'camera'), slot('Lens', 'vision_lens'), slot('Lighting', 'lighting', false)];
const LOAD = (name = 'Loading', o: St = {}) => st('load', name, 'load', { function: 'Bring the part into the machine', ...o });
const UNLOAD = (name = 'Unloading', o: St = {}) => st('unload', name, 'unload', { function: 'Remove the finished part', ...o });
const FIX = (name = 'Fixture / clamp', o: St = {}) => st('fixture', name, 'fixture', { function: 'Locate and hold the part', slots: [slot('Fixture', 'fixture'), slot('Clamp cylinder', 'cylinder', false)], ...o });
const ALIGN = (name = 'Vision alignment', o: St = {}) => st('align', name, 'align', { function: 'Find fiducials / part position', slots: CAM, ...o });
const INSPECT = (name = 'Inspection', key = 'inspect', o: St = {}) => st(key, name, 'inspect', { function: 'Check the result against the quality criteria', slots: CAM, ...o });
const SORT = (name = 'OK / NG sorting', o: St = {}) => st('sort', name, 'sort', { function: 'Separate rejected parts', ...o });
const GALVO = (name: string, o: St = {}) =>
  st('laser', name, 'laser', {
    function: 'Laser process with a galvo scanner',
    laser: {},
    slots: [slot('Laser source', 'laser_source'), slot('Beam expander', 'beam_expander', false), slot('Galvo scanner', 'galvo'), slot('F-theta lens', 'f_theta'), slot('Galvo controller', 'galvo_controller', false), slot('Chiller', 'chiller', false), slot('Fume extraction', 'fume_extraction', false)],
    ...o,
  });
const HEAD = (name: string, o: St = {}) =>
  st('laser', name, 'laser', {
    function: 'Laser process with a processing head and motion',
    laser: {},
    slots: [slot('Laser source', 'laser_source'), slot('Processing head', 'laser_head'), slot('Motion axis', 'linear_stage'), slot('Chiller', 'chiller', false), slot('Fume extraction', 'fume_extraction', false)],
    ...o,
  });
const P = (key: string, name: string, kind = 'process', o: St = {}) => st(key, name, kind, o);
const ROBOT = [slot('Robot', 'robot'), slot('Gripper', 'gripper')];

const tpl = (code: string, name: string, group: string, application: string, stations: St[], o: St = {}) => ({
  id: `eqt-${code}`,
  entity: 'equipment_template',
  name,
  code: code.toUpperCase(),
  group,
  application,
  stations,
  data_type: 'AI_GENERATED',
  provenance: prov({ note: `${NOTE} Station structure only — times, capacities and costs are deliberately empty; enter them per scenario with their basis.` }),
  tags: ['ai-generated'],
  ...o,
});

const templates = [
  // LASER
  tpl('sheet-laser-cutting', 'Flatbed Sheet-Metal Laser Cutting', 'Laser', 'Sheet-metal profile cutting', [LOAD('Sheet load (shuttle table)'), FIX('Slat bed / sheet support'), HEAD('Laser cutting (gantry head)'), INSPECT('Edge / dimension check'), SORT('Part sorting / de-skeleton'), UNLOAD('Parts & skeleton unload')], { domain_id: 'dom-laser', process: 'Cutting', has_laser_chain: true, application_ids: ['app-ai.sheetcut', 'app-ai.reflectcut'] }),
  tpl('tube-laser-cutting', 'Tube & Profile Laser Cutting', 'Laser', 'Tube and profile cutting', [LOAD('Bundle loader'), FIX('Rotary chucks'), HEAD('Laser cutting (rotary + head)'), INSPECT('Cut-feature check'), UNLOAD('Part outfeed')], { domain_id: 'dom-laser', process: 'Cutting', has_laser_chain: true, application_ids: ['app-ai.tubecut'] }),
  tpl('co2-cutting', 'CO₂ Laser Cutting (non-metals)', 'Laser', 'Cutting / engraving of wood, acrylic, textile, paper, rubber', [LOAD('Sheet / roll feed'), FIX('Honeycomb / conveyor bed'), HEAD('CO₂ laser cutting (flying optics)'), INSPECT('Edge check'), UNLOAD('Part removal')], { domain_id: 'dom-laser', process: 'Cutting', has_laser_chain: true, application_ids: ['app-ai.woodcut', 'app-ai.pmmacut', 'app-ai.textilecut', 'app-ai.gasketcut'] }),
  tpl('laser-cladding', 'Laser Cladding / DED', 'Laser', 'Cladding and repair by directed-energy deposition', [LOAD(), FIX(), ALIGN('Surface scan'), HEAD('Laser cladding (powder / wire feed)', { slots: [slot('Laser source', 'laser_source'), slot('Processing head', 'laser_head'), slot('Robot', 'robot', false), slot('Chiller', 'chiller', false), slot('Fume extraction', 'fume_extraction', false)] }), INSPECT('Clad height / defect check'), UNLOAD()], { domain_id: 'dom-laser', process: 'Cladding', has_laser_chain: true, application_ids: ['app-ai.cladding'] }),
  tpl('laser-hardening', 'Laser Hardening', 'Laser', 'Selective surface hardening', [LOAD(), FIX(), HEAD('Laser hardening (temperature-controlled)'), INSPECT('Pattern / hardness check'), UNLOAD()], { domain_id: 'dom-laser', process: 'Hardening', has_laser_chain: true, application_ids: ['app-ai.hardening'] }),
  tpl('laser-soldering', 'Laser Soldering', 'Laser', 'Selective laser soldering', [LOAD('Board in (conveyor)', { slots: [slot('Conveyor', 'conveyor')] }), FIX('Board clamp'), ALIGN('Pad / pin alignment'), HEAD('Laser soldering (wire / paste feed)'), INSPECT('Joint inspection'), SORT(), UNLOAD('Board out (conveyor)')], { domain_id: 'dom-electronics', process: 'Soldering', has_laser_chain: true, application_ids: ['app-ai.lasersolder'] }),
  tpl('plastic-laser-welding', 'Plastic Laser Welding', 'Laser', 'Laser transmission welding of plastics', [LOAD(), FIX('Clamp (transparent pressing plate)'), GALVO('Transmission welding (quasi-simultaneous)'), INSPECT('Seam / collapse check'), P('leak', 'Leak test', 'test'), UNLOAD()], { domain_id: 'dom-laser', process: 'Welding', has_laser_chain: true, application_ids: ['app-ai.plasticweld'] }),
  tpl('laser-texturing', 'Laser Surface Texturing', 'Laser', 'Functional surface texturing', [LOAD(), FIX(), ALIGN(), GALVO('Surface texturing (ultrafast)'), INSPECT('Surface / roughness check'), UNLOAD()], { domain_id: 'dom-laser', process: 'Texturing', has_laser_chain: true, application_ids: ['app-ai.texture'] }),
  tpl('stent-cutting', 'Stent / Hypotube Micro-Cutting', 'Laser', 'Micro-cutting of thin-walled tubes', [LOAD('Tube feed'), FIX('Rotary collet / guide bushing'), HEAD('Micro-cutting (rotary + linear)'), P('post', 'Post-process hand-off (descale / polish)', 'process'), INSPECT('Strut inspection'), UNLOAD()], { domain_id: 'dom-laser', process: 'Cutting', has_laser_chain: true, application_ids: ['app-ai.stentcut'] }),
  tpl('laser-depaneling', 'PCB Laser Depaneling', 'Laser', 'UV laser singulation of PCBs', [LOAD('Panel in'), FIX('Vacuum panel fixture'), ALIGN('Fiducial alignment'), GALVO('UV laser depaneling'), P('clean', 'Debris extraction / cleaning', 'process'), INSPECT('Edge inspection'), UNLOAD('Board unload / tray')], { domain_id: 'dom-electronics', process: 'Cutting', has_laser_chain: true, application_ids: ['app-ai.pcbdepanel'] }),
  tpl('glass-cutting', 'Glass & Sapphire Cutting (ultrafast)', 'Laser', 'Crack-free cutting of thin glass and sapphire', [LOAD(), FIX('Vacuum chuck'), ALIGN(), HEAD('Ultrafast filamentation / modification'), P('cleave', 'Cleave / break', 'process'), INSPECT('Edge-chipping check'), UNLOAD()], { domain_id: 'dom-laser', process: 'Cutting', has_laser_chain: true, application_ids: ['app-ai.glasscut'] }),
  tpl('hairpin-welding', 'Hairpin Stator Welding', 'Laser', 'Hairpin pin-pair welding for e-motor stators', [LOAD('Stator load'), FIX('Hairpin clamping'), ALIGN('Pin-pair 3D vision'), GALVO('Hairpin welding (scanner)'), INSPECT('Weld inspection'), UNLOAD()], { domain_id: 'dom-battery', process: 'Welding', has_laser_chain: true, application_ids: ['app-weldb.hairpin'] }),
  tpl('wire-stripping', 'Laser Wire Stripping', 'Laser', 'Insulation / enamel removal', [LOAD('Wire feed'), FIX('Wire clamp'), GALVO('Laser stripping'), INSPECT('Strip-length / residue check'), UNLOAD()], { domain_id: 'dom-laser', process: 'Stripping', has_laser_chain: true, application_ids: ['app-ai.wirestrip'] }),
  tpl('laser-trimming', 'Laser Resistor Trimming', 'Electronics', 'Closed-loop resistor trimming', [LOAD('Substrate load'), P('probe', 'Probe contact', 'test'), GALVO('Laser trimming'), P('measure', 'Resistance measurement (closed loop)', 'test'), SORT(), UNLOAD()], { domain_id: 'dom-electronics', process: 'Trimming', has_laser_chain: true, application_ids: ['app-ai.trimming'] }),
  tpl('powder-bed-fusion', 'Metal Powder-Bed Fusion (AM)', 'Laser', 'Additive manufacturing of metal parts', [LOAD('Build-plate load'), P('recoat', 'Powder recoating', 'process'), GALVO('Layer exposure'), P('depowder', 'De-powdering', 'process'), INSPECT('Build inspection'), UNLOAD()], { domain_id: 'dom-advanced-manufacturing', process: 'Additive manufacturing', has_laser_chain: true, application_ids: ['app-ai.lpbf'] }),
  // ELECTRONICS
  tpl('smt-line', 'SMT Assembly Line', 'Electronics', 'Surface-mount assembly (print → SPI → place → reflow → AOI)', [LOAD('Board loader (magazine)', { slots: [slot('Conveyor', 'conveyor')] }), P('print', 'Solder-paste printing', 'process'), INSPECT('Solder-paste inspection (SPI)', 'spi'), P('place', 'Pick & place', 'assembly'), P('reflow', 'Reflow soldering', 'process', { buffer_after: 0 }), INSPECT('Automated optical inspection (AOI)', 'aoi'), UNLOAD('Board unloader')], { domain_id: 'dom-electronics', process: 'Assembly' }),
  tpl('selective-soldering', 'Selective Soldering', 'Electronics', 'Through-hole selective soldering', [LOAD('Board in'), P('flux', 'Fluxing', 'process'), P('preheat', 'Preheat', 'process'), P('solder', 'Selective solder (mini-wave)', 'process'), INSPECT('Joint inspection'), UNLOAD('Board out')], { domain_id: 'dom-electronics', process: 'Soldering' }),
  tpl('conformal-coating', 'Conformal Coating', 'Electronics', 'Selective conformal coating', [LOAD('Board in'), P('coat', 'Selective coating', 'process'), P('cure', 'Cure (UV / thermal)', 'process'), INSPECT('UV-fluorescence inspection'), UNLOAD('Board out')], { domain_id: 'dom-electronics', process: 'Coating' }),
  tpl('xray-inspection', 'X-ray Inspection', 'Electronics', 'Hidden-joint inspection (BGA / QFN)', [LOAD('Board in'), P('xray', 'X-ray imaging', 'inspect'), SORT(), UNLOAD('Board out')], { domain_id: 'dom-electronics', process: 'Inspection' }),
  // SEMICONDUCTOR
  tpl('wire-bonding', 'Wire Bonding', 'Semiconductor', 'Die-to-package wire interconnect', [LOAD('Magazine / strip load'), ALIGN('Pad recognition'), P('bond', 'Wire bonding', 'assembly'), INSPECT('Bond inspection'), UNLOAD('Magazine unload')], { domain_id: 'dom-semiconductor', process: 'Wire bonding' }),
  tpl('moulding', 'Package Moulding', 'Semiconductor', 'Encapsulation of dies in mould compound', [LOAD('Strip load'), P('preheat', 'Pre-heat', 'process'), P('mould', 'Transfer / compression moulding', 'process'), P('degate', 'Degate', 'process'), UNLOAD('Strip unload')], { domain_id: 'dom-semiconductor', process: 'Moulding' }),
  tpl('test-handler', 'Final Test Handler', 'Semiconductor', 'Package test at temperature and binning', [LOAD('Tray / tube input'), P('soak', 'Temperature soak', 'buffer'), P('test', 'Contact & test', 'test'), SORT('Bin sorting'), UNLOAD('Output trays')], { domain_id: 'dom-semiconductor', process: 'Testing' }),
  tpl('tape-reel', 'Tape & Reel', 'Semiconductor', 'Packing of devices into carrier tape', [LOAD('Device input'), INSPECT('Orientation / lead inspection'), P('pocket', 'Pocket placement', 'transfer'), P('seal', 'Cover-tape sealing', 'process'), UNLOAD('Reel out')], { domain_id: 'dom-semiconductor', process: 'Packing' }),
  tpl('wafer-backgrinding', 'Wafer Back-Grinding', 'Semiconductor', 'Wafer thinning', [LOAD('Load port'), P('tape', 'Protective-tape lamination', 'process'), P('grind', 'Coarse / fine grinding', 'process'), P('polish', 'Stress-relief polish', 'process'), INSPECT('Thickness check'), UNLOAD('Load port (out)')], { domain_id: 'dom-semiconductor', process: 'Thinning' }),
  // BATTERY
  tpl('electrode-notching', 'Electrode Laser Notching', 'Battery', 'Tab notching on a moving electrode web', [LOAD('Unwinder (electrode roll)'), P('web', 'Web guiding / tension control', 'motion'), GALVO('Laser notching (on the fly)'), INSPECT('Burr / tab-position inspection'), UNLOAD('Rewinder')], { domain_id: 'dom-battery', process: 'Cutting', has_laser_chain: true, application_ids: ['app-ai.notching'] }),
  tpl('cell-stacking', 'Cell Stacking (Z-fold)', 'Battery', 'Electrode and separator stacking', [LOAD('Electrode magazines'), P('stack', 'Z-fold stacking', 'assembly'), P('tape', 'Stack taping', 'assembly'), INSPECT('Alignment check'), UNLOAD()], { domain_id: 'dom-battery', process: 'Stacking' }),
  tpl('cell-winding', 'Cell Winding', 'Battery', 'Jelly-roll winding', [LOAD('Electrode & separator unwind'), P('wind', 'Winding', 'assembly'), INSPECT('Jelly-roll inspection'), UNLOAD()], { domain_id: 'dom-battery', process: 'Winding' }),
  tpl('electrolyte-filling', 'Electrolyte Filling', 'Battery', 'Evacuation, dosing, wetting and sealing', [LOAD('Cell infeed'), P('vac', 'Evacuation', 'process'), P('fill', 'Electrolyte dosing', 'process'), P('soak', 'Wetting / soak', 'buffer'), P('seal', 'Sealing', 'process'), UNLOAD()], { domain_id: 'dom-battery', process: 'Filling' }),
  tpl('formation-grading', 'Formation & Grading', 'Battery', 'Formation, ageing and OCV / IR grading', [LOAD('Tray load'), P('form', 'Formation (charge / discharge)', 'test'), P('age', 'Ageing', 'buffer'), P('ocv', 'OCV / IR grading', 'test'), SORT('Grade sorting'), UNLOAD()], { domain_id: 'dom-battery', process: 'Formation' }),
  // GENERAL AUTOMATION
  tpl('palletizing', 'Robot Palletizing', 'General Automation', 'End-of-line palletizing', [LOAD('Case infeed'), P('pal', 'Robot palletizing', 'transfer', { slots: ROBOT }), UNLOAD('Pallet out')], { domain_id: 'dom-automation', process: 'Palletizing' }),
  tpl('vision-inspection', 'Vision Inspection Cell', 'General Automation', 'Camera-based inspection and sorting', [LOAD(), INSPECT('Multi-camera inspection'), SORT(), UNLOAD()], { domain_id: 'dom-automation', process: 'Inspection' }),
  tpl('leak-testing', 'Leak Testing', 'General Automation', 'Pressure-decay / tracer-gas leak test', [LOAD(), FIX('Sealing fixture'), P('leak', 'Leak test', 'test'), SORT(), UNLOAD()], { domain_id: 'dom-automation', process: 'Leak testing' }),
  tpl('ultrasonic-welding', 'Ultrasonic Welding', 'General Automation', 'Ultrasonic joining of plastics or foils', [LOAD(), FIX('Anvil / nest'), P('usw', 'Ultrasonic welding', 'process'), INSPECT('Weld check'), UNLOAD()], { domain_id: 'dom-automation', process: 'Welding' }),
  tpl('machine-tending', 'Robot Machine Tending', 'General Automation', 'Robot loading of a CNC or press', [LOAD('Raw-part tray'), P('tend', 'Robot load / unload', 'transfer', { slots: ROBOT }), P('machine', 'Machine cycle', 'process'), UNLOAD('Finished-part tray')], { domain_id: 'dom-automation', process: 'Handling' }),
  tpl('labeling', 'Print & Apply Labelling', 'General Automation', 'Label print, apply and verify', [LOAD(), P('print', 'Label print', 'process'), P('apply', 'Label apply', 'assembly'), INSPECT('Code verification'), UNLOAD()], { domain_id: 'dom-automation', process: 'Labelling' }),
];

writeJson(join(OUT, 'source.json'), { dataset: hdr('reference-drafts-source', 'AI-generated drafts — source', 'source', 'The source record every AI-generated reference draft cites.', 'knowledge'), records: [source] });
writeJson(join(OUT, 'materials.json'), { dataset: hdr('reference-drafts-materials', 'Material classes (AI-generated drafts)', 'material', 'Material classes not yet in the TEAL library. Thermal properties and absorptance are UNKNOWN (null) until entered from a primary handbook.', 'applications'), records: materials });
writeJson(join(OUT, 'applications.json'), { dataset: hdr('reference-drafts-applications', 'Applications (AI-generated drafts)', 'application', 'Laser process applications beyond the TEAL configurator library: process, materials, industries, candidate technology class and engineering rationale. Power, speed, quality and cycle time are UNKNOWN; no TEAL platform is assigned.', 'applications'), records: applications });
writeJson(join(OUT, 'equipment-types.json'), { dataset: hdr('reference-drafts-equipment', 'Equipment types (AI-generated drafts)', 'equipment', 'Equipment CATEGORIES by domain (semiconductor, electronics, battery, laser, automation, advanced manufacturing). No manufacturer, model, price, throughput or accuracy — those enter only from sourced datasheets.', 'records'), records: equipment });
writeJson(join(OUT, 'equipment-templates.json'), { dataset: hdr('reference-drafts-templates', 'Equipment templates (AI-generated drafts)', 'equipment_template', 'Additional station structures for the Simulation Studio and the 3D digital twin. Station times, capacities and costs are deliberately empty.', 'engineering'), records: templates });

console.log(`AI drafts: materials ${materials.length} · applications ${applications.length} · equipment types ${equipment.length} · templates ${templates.length}`);
