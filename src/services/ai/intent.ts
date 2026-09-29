import type { Intent } from './types';

/*
 * INTENT ENGINE (AI master prompt §7). A transparent, weighted rule classifier: every intent has
 * patterns; the strongest wins and the runners-up are kept as secondary intents. It also derives the
 * routing signals — complexity, risk and what the question needs (retrieval, prediction,
 * optimisation, vision, simulation). Measured against the gold set in eval/gold.ts.
 */

interface Rule {
  intent: Intent;
  re: RegExp;
  w: number;
}

const RULES: Rule[] = [
  // documents
  { intent: 'rfq', re: /\brfq\b|request for quot|quotation request|draft (an? )?(rfq|enquiry to supplier)/i, w: 6 },
  { intent: 'urs', re: /\burs\b|user requirement spec/i, w: 6 },
  { intent: 'fmea', re: /\bd?p?fmea\b|failure modes?\b/i, w: 6 },
  // change & substitution
  { intent: 'change_impact', re: /\b(replace|replacing|swap|swapping|switch(ing)? from)\b.{1,80}\b(with|to|by|for)\b|what (changes|happens|breaks) if (i|we) (replace|swap|change|switch)|impact of (changing|replacing|swapping)|change impact|\bchange (the )?[a-z0-9-]+ (to|with) [a-z0-9-]+/i, w: 5 },
  { intent: 'alternatives', re: /\b(alternatives?|equivalents?|substitutes?|second[- ]source|drop[- ]in|replacement(s)? for|instead of|similar (parts?|components?))\b/i, w: 5 },
  { intent: 'compatibility', re: /\bcompatib|\bwork(s)? with\b|\binterface (with|to)\b|\bfit(s)? (on|with)\b|\bpair(ed)? with\b|can .{1,40} (drive|control|run|mount)/i, w: 4.5 },
  { intent: 'compare', re: /\bcompare\b|\bcomparison\b|\bvs\.?\b|\bversus\b|difference between|which is better|pros and cons/i, w: 4 },
  // configuration & selection
  { intent: 'configure', re: /\b(i|we) need an? .{0,60}(machine|system|station|cell|line)|\bconfigure\b|\bconfiguration for\b|(machine|system|cell|station) for .{3,}|build an? .{0,40}(machine|system)|design an? .{0,40}(machine|system)|propose an? .{0,40}(machine|solution)/i, w: 4 },
  { intent: 'laser_selection', re: /which (laser|technology|wavelength|source)|what (laser|technology|wavelength)|(laser|technology|wavelength) (should|to use|for (marking|welding|cutting|cleaning|drilling|dicing|ablation|texturing))|select (a |the )?laser|best laser|suitable laser/i, w: 4.5 },
  { intent: 'bom', re: /\bbom\b|bill of materials?|parts list|what components (are|do)/i, w: 5 },
  { intent: 'cost', re: /\bcost\b|\bprice\b|\bbudget\b|how much|should[- ]cost|\bsaving/i, w: 3.5 },
  { intent: 'supply_risk', re: /single[- ]source|supply[- ]chain|supply risk|import dependen|country dependen|\blocali[sz]|obsolesc|lead[- ]time risk/i, w: 4.5 },
  { intent: 'supplier', re: /\bsuppliers?\b|\bvendors?\b|\bmanufacturers?\b|who (makes|supplies|sells|manufactures)|buy .{1,30} from|source .{1,30} from/i, w: 3.5 },
  // requirements & projects
  { intent: 'traceability', re: /traceab|trace (the )?requirement|requirements? (coverage|without)|untested|not verified|missing (link|test)/i, w: 4.5 },
  { intent: 'project_status', re: /\bpending\b|\bstatus of\b|what('?s| is) (left|open|next|pending|missing)|next (action|step)s?|overdue|\bblocked\b|what should (i|we) do next/i, w: 4 },
  // calculation & performance
  { intent: 'calculate', re: /\bconvert\b|\d\s*(nm|µm|um|mm|m|kw|w|khz|mhz|hz|ns|ps|fs|mj|µj|kg|g|rpm|nm)\s+(to|in|into)\s+[a-zµ]+\b|how many (µm|um|mm|nm|w|kw|hz|khz)/i, w: 5 },
  { intent: 'cycle_time', re: /cycle[- ]time|\buph\b|\btakt\b|throughput|bottleneck|parts? per (hour|minute)|reach \d+(\.\d+)? ?s\b|\d+(\.\d+)?[- ]?(s|sec|second) cycle/i, w: 3.5 },
  { intent: 'cycle_time', re: /what (would|must|should) (need to )?change to (reach|achieve|get)|how (can|do) (we|i) (reach|achieve|get to) \d/i, w: 3 },
  // process & ML
  { intent: 'doe', re: /\bdoe\b|design of experiments?|experiment(al)? plan|factorial|latin hypercube|response surface/i, w: 5 },
  { intent: 'optimize_process', re: /optimi[sz]e .{0,30}(parameter|process|laser|weld|mark)|process window|best (parameters|settings)|bayesian optimi[sz]/i, w: 5 },
  { intent: 'predict', re: /\bpredict|will (it|this|the (weld|mark|cut)) (pass|fail|work)|estimate (the )?(quality|defect)|defect probability|quality prediction/i, w: 4.5 },
  { intent: 'forecast', re: /\bforecast|\bdemand\b|consumption trend|spare parts? (need|demand)/i, w: 4.5 },
  { intent: 'maintenance', re: /predictive maintenance|remaining useful life|\brul\b|machine health|anomal(y|ies) in (telemetry|machine)|root[- ]cause|why did .{1,40} (fail|increase|drop)/i, w: 4.5 },
  { intent: 'vision', re: /(detect|inspect|classify) .{0,30}(image|photo|defect|weld|mark)|\bimage\b|\bphoto\b|visual (inspection|anomaly)|ocr\b/i, w: 4 },
  { intent: 'open_3d', re: /\b(open|show|view) .{0,20}\b3d\b|\b3d (model|view|twin|layout)\b|digital twin/i, w: 4 },
  // parts & knowledge
  { intent: 'find_parts', re: /\b(find|show|list|search|looking for)\b.{0,60}\b(lasers?|galvos?|scan heads?|f[- ]?theta|lens(es)?|cameras?|servo|drives?|motors?|plcs?|hmis?|stages?|robots?|chillers?|grippers?|light curtains?|sensors?|scanners?|sources?)\b/i, w: 3.5 },
  { intent: 'explain', re: /^(what|why|how|explain|describe|define|tell me)\b|\bwhat is\b|\bwhat are\b|\bhow does\b|\bhow do\b|meaning of|explain/i, w: 2 },
  { intent: 'explain', re: /\bhow (is|are) .{1,40} (calculated|computed|defined|measured)\b|\b(formula|definition) (of|for)\b/i, w: 4 },
];

export interface IntentResult {
  intent: Intent;
  secondary: Intent[];
  /** rule score of the winner — a transparency aid, not a probability */
  score: number;
  matched: string[];
  signals: RouteSignals;
}

export interface RouteSignals {
  complexity: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  needsRetrieval: boolean;
  needsStructured: boolean;
  needsPrediction: boolean;
  needsOptimization: boolean;
  needsVision: boolean;
  needsSimulation: boolean;
  /** numbers with units in the question */
  quantities: number;
  /** pronouns that refer to the page context ("this", "it") */
  refersToContext: boolean;
}

/** Consequential intents: the answer can change a design, a purchase or a commitment (§58). */
export const CONSEQUENTIAL: Intent[] = ['configure', 'change_impact', 'compatibility', 'alternatives', 'rfq', 'urs', 'fmea', 'laser_selection', 'bom', 'cost', 'optimize_process', 'predict', 'maintenance'];

const PRONOUN = /\b(this|it|its|these|this one|here|current|selected)\b/i;
const QTY = /\d+(?:[.,]\d+)?\s*(nm|µm|um|mm\/s|m\/s|mm|kW|mW|W|kHz|MHz|Hz|ns|ps|fs|µs|ms|mJ|µJ|J|MP|kg|s|uph|%)(?![a-z])/gi;

export function classifyIntent(query: string): IntentResult {
  const q = query.trim();
  const scores = new Map<Intent, number>();
  const matched: string[] = [];
  for (const r of RULES) {
    const m = r.re.exec(q);
    if (m) {
      scores.set(r.intent, (scores.get(r.intent) ?? 0) + r.w);
      matched.push(`${r.intent}: “${m[0].trim()}”`);
    }
  }
  const quantities = (q.match(QTY) ?? []).length;
  // a question full of technical parameters is a part / parameter search unless something stronger fires
  if (quantities >= 1 && !scores.has('find_parts') && /\b(laser|galvo|lens|camera|servo|stage|robot|chiller|f[- ]?theta|scanner|source|mopa|fib(er|re)|uv|green|co2)\b/i.test(q)) scores.set('find_parts', 3);
  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const intent: Intent = ranked[0]?.[0] ?? 'search';
  const secondary = ranked.slice(1, 4).map(([i]) => i);
  const all = new Set<Intent>([intent, ...secondary]);

  const words = q.split(/\s+/).filter(Boolean).length;
  const complexity: RouteSignals['complexity'] = intent === 'configure' || all.size >= 3 || words > 40 ? 'high' : all.size === 2 || quantities >= 2 || words > 18 ? 'medium' : 'low';
  const risk: RouteSignals['risk'] = CONSEQUENTIAL.includes(intent) ? 'high' : secondary.some((s) => CONSEQUENTIAL.includes(s)) ? 'medium' : 'low';
  return {
    intent,
    secondary,
    score: ranked[0]?.[1] ?? 0,
    matched,
    signals: {
      complexity,
      risk,
      needsRetrieval: true,
      needsStructured: !['explain', 'search'].includes(intent) || quantities > 0,
      needsPrediction: all.has('predict') || all.has('forecast') || all.has('maintenance'),
      needsOptimization: all.has('optimize_process') || all.has('doe'),
      needsVision: all.has('vision'),
      needsSimulation: all.has('cycle_time') || all.has('open_3d'),
      quantities,
      refersToContext: PRONOUN.test(q),
    },
  };
}

export const INTENT_LABEL: Record<Intent, string> = {
  explain: 'Explain',
  search: 'Search the knowledge base',
  find_parts: 'Technical part search',
  compare: 'Compare',
  alternatives: 'Find alternatives',
  compatibility: 'Compatibility check',
  configure: 'Configure a machine',
  laser_selection: 'Laser technology selection',
  bom: 'Preliminary BOM',
  cost: 'Cost analysis',
  supplier: 'Supplier intelligence',
  supply_risk: 'Supply-chain risk',
  change_impact: 'Change impact analysis',
  rfq: 'Generate RFQ',
  urs: 'Generate URS',
  fmea: 'AI-suggested FMEA',
  traceability: 'Requirements traceability',
  project_status: 'Project status',
  calculate: 'Unit-aware calculation',
  cycle_time: 'Cycle time & capacity',
  doe: 'Design of experiments',
  optimize_process: 'Process optimisation',
  predict: 'Quality prediction',
  forecast: 'Forecast',
  maintenance: 'Predictive maintenance / root cause',
  vision: 'Computer vision',
  open_3d: 'Open in 3D',
};
