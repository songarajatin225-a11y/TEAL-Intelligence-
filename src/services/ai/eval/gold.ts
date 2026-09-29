import type { Intent } from '../types';

/*
 * AI GOLD SET (AI master prompt §59). Hand-labelled questions: the intent a correct router picks and,
 * where one exists, the records a correct retrieval must surface (any of `ids` in the top K). Expected
 * ids were chosen by reading the datasets, not by running the engine. Add a case whenever a real
 * question is answered wrongly — that is how the evaluation grows.
 */
export interface GoldCase {
  q: string;
  intent: Intent;
  /** relevant record ids (binary relevance) */
  ids?: string[];
  /** page context record, when the question depends on it */
  context?: string;
}

export const GOLD: GoldCase[] = [
  { q: 'Explain MOPA laser', intent: 'explain', ids: ['las-mopa', 'tec-mopa'] },
  { q: 'What is the absorption of copper at green wavelength?', intent: 'explain', ids: ['mat-cu'] },
  { q: 'How is takt time calculated?', intent: 'explain' },
  { q: 'Which laser for marking anodised aluminium?', intent: 'laser_selection', ids: ['app-markf.anod', 'app-markm.black', 'las-mopa'] },
  { q: 'What wavelength should I use for welding copper?', intent: 'laser_selection' },
  { q: 'Find 50 W MOPA laser 1064 nm', intent: 'find_parts', ids: ['prt-demo-mopa-50', 'prt-demo-mopa-50-dist'] },
  { q: 'Show galvo scanners above 14 mm aperture', intent: 'find_parts', ids: ['prt-demo-galvo-30'] },
  { q: 'Find alternatives to DL-MOPA-20', intent: 'alternatives', ids: ['prt-demo-mopa-20', 'prt-demo-mopa-30'] },
  { q: 'Is DL-MOPA-20 compatible with SC-10?', intent: 'compatibility', ids: ['prt-demo-mopa-20', 'prt-demo-galvo-10'] },
  { q: 'Compare DL-MOPA-20 and DL-MOPA-30', intent: 'compare', ids: ['prt-demo-mopa-20', 'prt-demo-mopa-30'] },
  { q: 'What changes if I replace DL-MOPA-20 with DL-MOPA-50?', intent: 'change_impact', ids: ['prt-demo-mopa-20', 'prt-demo-mopa-50'] },
  { q: 'Find Indian suppliers for galvo scanners', intent: 'supplier' },
  { q: 'Which components are single-source?', intent: 'supply_risk' },
  { q: 'Convert 1064 nm to µm', intent: 'calculate' },
  { q: 'I need a laser marking machine for aluminium battery cans, 5-second cycle time, high-contrast marking.', intent: 'configure', ids: ['prd-voltm', 'app-markit.cell', 'app-voltm.cylcan'] },
  { q: 'Preliminary BOM for a PCB laser marking machine', intent: 'bom' },
  { q: 'How much does a UV laser marking machine cost?', intent: 'cost' },
  { q: 'Generate an RFQ for a laser welding cell for stainless steel sensor housings', intent: 'rfq' },
  { q: 'Draft a URS for PCB marking with a 2D code', intent: 'urs' },
  { q: 'FMEA for a fiber laser marking machine', intent: 'fmea' },
  { q: 'Show requirement traceability coverage', intent: 'traceability' },
  { q: 'What is pending in this project?', intent: 'project_status' },
  { q: 'What is the cycle time of the laser marker?', intent: 'cycle_time', ids: ['sim-demo-laser-marker'] },
  { q: 'DOE for power 20-50 W and speed 500-2000 mm/s', intent: 'doe' },
  { q: 'Optimize laser parameters for weld depth', intent: 'optimize_process' },
  { q: 'Predict weld quality for 1 mm stainless steel', intent: 'predict' },
  { q: 'Forecast galvo demand for next year', intent: 'forecast' },
  { q: 'Detect weld defects in this image', intent: 'vision' },
  { q: 'Root cause: why did the marking contrast drop?', intent: 'maintenance' },
  { q: 'Open the 3D model of the laser marker', intent: 'open_3d', ids: ['sim-demo-laser-marker'] },
  { q: 'Where can I use this?', intent: 'search', context: 'las-mopa', ids: ['app-markf.anod', 'app-markm.black', 'app-markit.cell'] },
];
