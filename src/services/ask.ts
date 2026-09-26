import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { whatIsMissing } from './gaps';
import { neighbours, type Graph } from './graph';
import type { Hit } from './search';

/**
 * ASK INTELLIGENCE (ultimate spec §78–80). A *retrieval* answer composed from the local
 * knowledge base — search hits, the digital-thread graph and the gap engine. There is no
 * language model and no API: the answer never contains a sentence that is not a record, a
 * handbook section, a field value or a rule. Structured as the spec asks:
 * direct answer · key findings · evidence · assumptions/unknowns · risks · recommended action ·
 * related records · confidence.
 */
export type AnswerConfidence = 'High' | 'Medium' | 'Low' | 'None';
export interface AnswerItem {
  id: string;
  entity: string;
  name: string;
  /** why this item is in the answer */
  note?: string;
  data_type?: string;
  verification?: string;
  href: string;
}
export interface Answer {
  question: string;
  confidence: AnswerConfidence;
  confidenceReason: string;
  direct: string;
  findings: AnswerItem[];
  knowledge: AnswerItem[];
  evidence: AnswerItem[];
  unknowns: string[];
  risks: AnswerItem[];
  actions: string[];
  related: AnswerItem[];
}

const TRUSTED = new Set(['VERIFIED', 'SOURCE_DOCUMENTED']);
const MID = new Set(['CALCULATED', 'INFERRED']);
const recHref = (id: string) => `/record/${encodeURIComponent(id)}`;

export function composeAnswer(question: string, hits: Hit[], g: Graph): Answer {
  const recordHits = hits.filter((h) => h.entity !== 'knowledge' && g.byId.has(h.id)).slice(0, 8);
  const knowledgeHits = hits.filter((h) => h.entity === 'knowledge').slice(0, 5);
  const top = recordHits[0] ? g.byId.get(recordHits[0].id) : undefined;
  const label = (e: string) => ENTITY_BY_TYPE[e]?.label ?? e;

  const findings: AnswerItem[] = recordHits.map((h) => ({ id: h.id, entity: h.entity, name: h.name, data_type: h.data_type, verification: h.verification, note: h.terms.length ? `matched: ${[...new Set(h.terms)].slice(0, 4).join(', ')}` : undefined, href: recHref(h.id) }));
  const knowledge: AnswerItem[] = knowledgeHits.map((h) => {
    const [p, a] = (h.ref ?? '').split('#');
    return { id: h.id, entity: 'knowledge', name: h.name, note: h.book, data_type: h.data_type, verification: h.verification, href: h.ref ? `/knowledge/${p}?a=${a}&q=${encodeURIComponent(question)}` : '/knowledge' };
  });

  const evidence: AnswerItem[] = [];
  const unknowns: string[] = [];
  const seenEv = new Set<string>();
  for (const h of recordHits.slice(0, 5)) {
    const r = g.byId.get(h.id)!;
    for (const n of neighbours(g, r.id)) {
      if ((n.record.entity === 'evidence' || n.record.entity === 'source') && !seenEv.has(n.record.id)) {
        seenEv.add(n.record.id);
        evidence.push({ id: n.record.id, entity: n.record.entity, name: n.record.name, note: `for ${r.name}`, data_type: n.record.data_type, verification: n.record.provenance?.verification_status, href: recHref(n.record.id) });
      }
    }
    if (r.data_type === 'DEMO') unknowns.push(`${r.name} is a DEMO record — fictional, not real engineering data.`);
    else if (!TRUSTED.has(r.provenance?.verification_status ?? '')) unknowns.push(`${r.name} is ${String(r.provenance?.verification_status ?? 'UNKNOWN').toLowerCase().replace(/_/g, ' ')} — verify before relying on it.`);
    const unk = Object.entries(r).filter(([, v]) => v && typeof v === 'object' && 'value' in (v as object) && (v as { value: unknown }).value == null).map(([k]) => k.replace(/_/g, ' '));
    if (unk.length) unknowns.push(`${r.name}: ${unk.slice(0, 4).join(', ')} UNKNOWN.`);
  }

  const risks: AnswerItem[] = [];
  const related: AnswerItem[] = [];
  const actions: string[] = [];
  if (top) {
    const seen = new Set<string>();
    for (const n of neighbours(g, top.id)) {
      if (seen.has(n.record.id) || n.record.entity === 'source' || n.record.entity === 'evidence') continue;
      seen.add(n.record.id);
      const x = n.record as AnyRecord & { risk_status?: string };
      if (x.entity === 'risk' && x.risk_status === 'Open') risks.push({ id: x.id, entity: x.entity, name: x.name, note: 'open risk', href: recHref(x.id) });
      else if (related.length < 8) related.push({ id: x.id, entity: x.entity, name: x.name, note: `${n.rel.replace(/_/g, ' ')} · ${label(x.entity)}`, href: recHref(x.id) });
    }
    if (top.next_action?.action) actions.push(`${top.name}: ${top.next_action.action}${top.next_action.due ? ` (due ${top.next_action.due})` : ''}`);
    for (const gap of whatIsMissing(g, top.id).filter((x) => x.status === 'missing' && x.action && x.item !== 'Controlled documents').slice(0, 4)) actions.push(`${gap.item}: ${gap.action}`);
  }

  const considered = [...recordHits.slice(0, 5), ...knowledgeHits.slice(0, 3)];
  const trusted = considered.filter((h) => TRUSTED.has(h.verification) && h.data_type !== 'DEMO').length;
  const mid = considered.filter((h) => MID.has(h.verification)).length;
  let confidence: AnswerConfidence = 'None';
  let confidenceReason = 'Nothing in the knowledge base matched the question.';
  if (considered.length) {
    const ratio = trusted / considered.length;
    confidence = ratio >= 0.6 ? 'High' : ratio + mid / considered.length >= 0.5 ? 'Medium' : 'Low';
    confidenceReason = `${trusted} of ${considered.length} matched sources are verified or source-documented${mid ? `, ${mid} calculated/inferred` : ''}.`;
  }

  const direct = !considered.length
    ? 'No record or handbook section in the knowledge base answers this. The information is UNKNOWN here — add it through a record, evidence or the ingestion pipeline.'
    : top
      ? `The closest match is the ${label(top.entity).toLowerCase()} “${top.name}”${recordHits.length > 1 ? `, with ${recordHits.length - 1} further record(s)` : ''}${knowledgeHits.length ? ` and ${knowledgeHits.length} handbook section(s)` : ''}.`
      : `${knowledgeHits.length} handbook section(s) cover this; no records match.`;

  return { question, confidence, confidenceReason, direct, findings, knowledge, evidence: evidence.slice(0, 8), unknowns: [...new Set(unknowns)].slice(0, 8), risks, actions, related };
}
