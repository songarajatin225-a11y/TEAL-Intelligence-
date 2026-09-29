/*
 * QUERY EXPANSION (AI master prompt §12). Curated engineering synonyms and spelling variants — a
 * transparent list, shown to the user as "also searched". It adds recall; it never changes meaning
 * (no "MOPA" → "UV" jumps). Each group is a set of interchangeable surface forms.
 */
export const SYNONYM_GROUPS: string[][] = [
  ['fiber', 'fibre'],
  ['aluminium', 'aluminum'],
  ['galvo', 'galvanometer', 'scan head', 'scanhead', 'galvo scanner'],
  ['f-theta', 'ftheta', 'f theta', 'scan lens'],
  ['mopa', 'master oscillator power amplifier'],
  ['uv', 'ultraviolet', '355 nm'],
  ['green', '532 nm'],
  ['co2', 'co₂', '10.6 µm'],
  ['ir', 'infrared', '1064 nm'],
  ['ultrafast', 'picosecond', 'femtosecond', 'ultra-short pulse'],
  ['servo motor', 'servomotor', 'servo'],
  ['servo drive', 'servo amplifier', 'drive'],
  ['plc', 'programmable logic controller'],
  ['hmi', 'operator panel', 'touch panel'],
  ['ipc', 'industrial pc', 'industrial computer'],
  ['camera', 'machine vision camera', 'vision camera'],
  ['dmc', 'data matrix', 'datamatrix', '2d code'],
  ['qr', 'qr code'],
  ['marking', 'engraving', 'etching', 'mark'],
  ['welding', 'weld', 'joining'],
  ['cutting', 'cut', 'singulation'],
  ['cleaning', 'surface cleaning', 'de-coating', 'paint removal'],
  ['battery', 'cell', 'battery can'],
  ['pcb', 'circuit board', 'printed circuit board'],
  ['wafer', 'silicon wafer'],
  ['chiller', 'water cooler', 'cooling unit'],
  ['fume extraction', 'fume extractor', 'extraction'],
  ['linear stage', 'linear axis', 'linear actuator'],
  ['light curtain', 'safety light curtain'],
  ['supplier', 'vendor'],
  ['cycle time', 'takt', 'uph'],
  ['stainless', 'stainless steel', 'ss304', 'ss316'],
];

export interface Expansion {
  query: string;
  added: string[];
  text: string;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function expandQuery(query: string): Expansion {
  const q = query.toLowerCase();
  const added: string[] = [];
  for (const g of SYNONYM_GROUPS) {
    const hit = g.find((t) => new RegExp(`(^|[^a-z0-9])${esc(t)}($|[^a-z0-9])`, 'i').test(q));
    if (!hit) continue;
    for (const t of g) if (t !== hit && !q.includes(t) && !added.includes(t)) added.push(t);
  }
  return { query, added, text: added.length ? `${query} ${added.join(' ')}` : query };
}
