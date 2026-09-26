import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { neighbours, type Graph } from './graph';
import { whatIsMissing } from './gaps';

/**
 * AI CONTEXT GENERATOR + PROMPT LIBRARY (spec §83–§85). The platform does not call any AI API
 * and holds no keys. It assembles a structured, provenance-labelled context the user can copy
 * into Claude, ChatGPT or another assistant.
 */
const STRIP = new Set(['__origin', '__dataset', 'provenance']);

function compact(r: AnyRecord): Record<string, unknown> {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(r)) {
    if (STRIP.has(k) || v == null || (Array.isArray(v) && !v.length)) continue;
    o[k] = v;
  }
  o.verification = r.provenance?.verification_status;
  if (r.provenance?.source_id) o.source = r.provenance.source_id;
  return o;
}

export function buildContext(g: Graph, id: string): string {
  const r = g.byId.get(id);
  if (!r) return '';
  const ns = neighbours(g, id).filter((n) => n.record.entity !== 'source');
  const groups = new Map<string, AnyRecord[]>();
  for (const n of ns) {
    const k = ENTITY_BY_TYPE[n.record.entity]?.plural ?? n.record.entity;
    if (!groups.has(k)) groups.set(k, []);
    if (!groups.get(k)!.some((x) => x.id === n.record.id)) groups.get(k)!.push(n.record);
  }
  const gaps = whatIsMissing(g, id).filter((x) => x.status !== 'present');
  const lines = [
    `# TEAL engineering context — ${ENTITY_BY_TYPE[r.entity]?.label ?? r.entity}: ${r.name}`,
    '',
    'Data-type legend: TEAL_INTERNAL, PUBLIC, EXTERNAL, DEMO (fictional), CALCULATED, INFERRED/DRAFT (generated, unvalidated), USER_CREATED. Treat DEMO and DRAFT as unverified. UNKNOWN means not known — do not fill it in by assumption.',
    '',
    '## Focus record',
    '```json',
    JSON.stringify(compact(r), null, 2),
    '```',
  ];
  for (const [k, list] of groups) {
    lines.push('', `## Linked ${k} (${list.length})`, '```json', JSON.stringify(list.slice(0, 12).map(compact), null, 2), '```');
  }
  if (gaps.length) {
    lines.push('', '## Known gaps (What is missing?)');
    for (const gp of gaps) lines.push(`- [${gp.category}] ${gp.item}: ${gp.detail}`);
  }
  return lines.join('\n');
}

export interface PromptTemplate {
  key: string;
  title: string;
  appliesTo: string[];
  template: string;
}

const RULES = `Rules: cite which record each statement relies on; separate facts from assumptions; say UNKNOWN when the context does not contain a value; do not invent suppliers, prices, specifications or results.`;

export const PROMPT_LIBRARY: PromptTemplate[] = [
  { key: 'poc', title: 'POC analysis', appliesTo: ['poc', 'opportunity'], template: `Review this proof of concept. Assess whether the objective can be met, what the measurements show (if any), what the process window is, and what must be tested next.\n${RULES}\n\n{{context}}` },
  { key: 'doe', title: 'DOE analysis', appliesTo: ['doe', 'poc'], template: `Analyse this DOE. Identify main effects and interactions only where results exist; propose the next experiment and the process window. Do not fabricate missing results.\n${RULES}\n\n{{context}}` },
  { key: 'urs', title: 'URS drafting', appliesTo: ['opportunity', 'requirement', 'project'], template: `Draft a User Requirement Specification. Each line needs value, condition, verification method and acceptance criterion (Automation Handbook Part 2). Mark every value not in the context as TO BE CONFIRMED.\n${RULES}\n\n{{context}}` },
  { key: 'fmea', title: 'FMEA', appliesTo: ['project', 'configuration', 'product', 'opportunity', 'risk'], template: `Produce a starter FMEA (failure mode, cause, effect, S, O, D, action). Explain every rating; flag ratings that need engineering judgement.\n${RULES}\n\n{{context}}` },
  { key: 'architecture', title: 'Architecture review', appliesTo: ['configuration', 'product', 'project'], template: `Review the machine architecture: flow (input → handling → positioning → process → inspection → output), layers (mechanical, electrical, controls, software, safety, utilities, data), interfaces and budgets. List risks and missing interface data.\n${RULES}\n\n{{context}}` },
  { key: 'cost', title: 'Cost review', appliesTo: ['cost_model', 'bom', 'project', 'opportunity'], template: `Review this cost build-up. Identify the largest cost drivers, estimates that must be replaced with quotations, missing cost categories and margin risk.\n${RULES}\n\n{{context}}` },
  { key: 'supplier', title: 'Supplier comparison', appliesTo: ['supplier', 'rfq', 'bom'], template: `Compare the suppliers/quotations in the context on technical compliance, price, lead time, risk and India presence. Do not assume information not given.\n${RULES}\n\n{{context}}` },
  { key: 'localization', title: 'Localization', appliesTo: ['localization', 'bom', 'supplier'], template: `For each imported item, assess localization options (LOCALIZE / PARTNER / BUY / DEVELOP / IMPORT), technology gap, validation needed and payback (Handbook C9).\n${RULES}\n\n{{context}}` },
  { key: 'strategy', title: 'Product strategy', appliesTo: ['product', 'product_family', 'opportunity'], template: `Assess product strategy: target applications, platform content vs specials, value-based price vs cost floor, lifecycle revenue (Automation Handbook Part 59).\n${RULES}\n\n{{context}}` },
  { key: 'tech', title: 'Technology assessment', appliesTo: ['technology', 'laser_source', 'product'], template: `Assess this technology for TEAL: maturity (only with evidence), applications, suppliers, risks and what evidence is still needed to assign a radar status.\n${RULES}\n\n{{context}}` },
  { key: 'meeting', title: 'Customer meeting preparation', appliesTo: ['customer', 'opportunity', 'activity'], template: `Prepare for the customer meeting: objectives, questions to close open gaps, what to show, risks to raise, and agreed next actions to propose.\n${RULES}\n\n{{context}}` },
  { key: 'gate', title: 'Gate review', appliesTo: ['project'], template: `Act as the gate review secretary. For the next gate, check each mandatory evidence item against the context, list conditions with owner and date, and recommend GO / GO WITH CONDITIONS / NO-GO with reasons.\n${RULES}\n\n{{context}}` },
  { key: 'risk', title: 'Risk analysis', appliesTo: ['risk', 'project', 'opportunity'], template: `Analyse the risks: probability drivers, impact, detection, mitigation and residual risk. Identify risks missing from the register.\n${RULES}\n\n{{context}}` },
];

export function renderPrompt(t: PromptTemplate, context: string): string {
  return t.template.replace('{{context}}', context);
}
