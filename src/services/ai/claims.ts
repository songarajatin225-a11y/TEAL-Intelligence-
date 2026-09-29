import type { AnyRecord } from '../../domain';
import type { Passage } from './retrieval/passages';
import type { Claim, ClaimClass, ClaimValue, SourceRef } from './types';

/*
 * CLAIM BUILDERS (AI master prompt §9, §81). The composer can only state something through these
 * helpers, so every sentence carries its class and its sources. Class from provenance:
 *   verified / source-documented (not DEMO)   → VERIFIED
 *   calculated / inferred / draft              → INFERRED
 *   DEMO data (fictional placeholders)         → ASSUMED, and the text says DEMO
 *   assumption                                 → ASSUMED
 *   unknown                                    → UNKNOWN
 *   conflicted                                 → CONFLICTING
 */

export const recHref = (id: string) => `/record/${encodeURIComponent(id)}`;

export function recRef(r: AnyRecord, locator?: string, excerpt?: string): SourceRef {
  return { kind: 'record', id: r.id, label: r.name, href: recHref(r.id), data_type: String(r.data_type ?? ''), verification: String(r.provenance?.verification_status ?? ''), locator, excerpt };
}
export const engineRef = (id: string, label: string, locator?: string): SourceRef => ({ kind: 'engine', id, label, locator });
export const ruleRef = (id: string, label: string, href?: string): SourceRef => ({ kind: 'rule', id, label, href });
export const hbRef = (p: Passage): SourceRef => ({ kind: 'handbook', id: p.ref, label: `${p.bookTitle} — ${p.heading}`, href: p.href, data_type: 'TEAL_INTERNAL', verification: 'SOURCE_DOCUMENTED', excerpt: p.text });

export function classOf(r: AnyRecord): ClaimClass {
  const v = r.provenance?.verification_status;
  if (r.data_type === 'DEMO') return 'ASSUMED';
  if (v === 'CONFLICTED') return 'CONFLICTING';
  if (v === 'UNKNOWN') return 'UNKNOWN';
  if (v === 'ASSUMPTION') return 'ASSUMED';
  if (v === 'VERIFIED' || v === 'SOURCE_DOCUMENTED') return 'VERIFIED';
  return 'INFERRED';
}

/** Weakest class of several sources (a chain is only as strong as its weakest link). */
const ORDER: ClaimClass[] = ['CONFLICTING', 'UNKNOWN', 'ASSUMED', 'ESTIMATED', 'INFERRED', 'VERIFIED'];
export const weakest = (...cls: ClaimClass[]): ClaimClass => cls.reduce((a, b) => (ORDER.indexOf(a) <= ORDER.indexOf(b) ? a : b), 'VERIFIED' as ClaimClass);

export const claim = (text: string, cls: ClaimClass, sources: SourceRef[], values?: ClaimValue[]): Claim => ({ text, cls, sources, values });

/** A statement read from one record; DEMO records say so in the text. */
export function fromRecord(text: string, r: AnyRecord, locator?: string, excerpt?: string, values?: ClaimValue[]): Claim {
  const cls = classOf(r);
  return { text: r.data_type === 'DEMO' && !/DEMO/.test(text) ? `${text} (DEMO data — fictional)` : text, cls, sources: [recRef(r, locator, excerpt)], values };
}

export const gap = (text: string, sources: SourceRef[] = []): Claim => ({ text, cls: 'UNKNOWN', sources });
export const assumption = (text: string, sources: SourceRef[] = []): Claim => ({ text, cls: 'ASSUMED', sources });

export function dedupeSources(claims: Claim[]): SourceRef[] {
  const m = new Map<string, SourceRef>();
  for (const c of claims) for (const s of c.sources) if (!m.has(`${s.kind}:${s.id}`)) m.set(`${s.kind}:${s.id}`, s);
  return [...m.values()];
}
