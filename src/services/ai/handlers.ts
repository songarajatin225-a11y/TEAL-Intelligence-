import type { AnyRecord } from '../../domain';
import type { Doe, Requirement } from '../../domain/entities';
import type { Part, Simulation } from '../../domain/engineering';
import { productTypeLabel } from '../../domain/engineering';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { convert, dimensionOf, fmtNum } from '../../calculations/units';
import { checkPair, compatibleWith, COMPAT_LABEL } from '../eng/compatibility';
import { describeQuery, searchParts } from '../eng/partSearch';
import { traceChain, traceCoverage } from '../eng/requirementQuality';
import { displaySpec, readSpec } from '../eng/specs';
import { whatIsMissing } from '../gaps';
import { neighbours } from '../graph';
import { parametricSearch } from '../parametric';
import { capacity, cycleTime } from '../sim/capacity';
import { resolveScenario } from '../sim/model';
import { latestPrice, localizationLayers, originOf, supplierDependency } from '../sim/supply';
import { REQUIREMENT_FIELDS } from './agents';
import { suggestNext, type Observation } from './bayesopt';
import { claim, classOf, classOfMeta, engineRef, fromRecord, gap, hbRef, recHref, recRef, weakest } from './claims';
import { configure, type ConfigureResult } from './configure';
import { design, type DesignKind, type DoeFactor } from './doe';
import { fmeaDraft, rfqDraft, ursDraft } from './drafts';
import { changeImpact, graphPaths, pathText } from './kg';
import { closestByName } from './entities';
import { compileQuery, runQuery } from './nlq';
import type { HandlerCtx, Retrieved } from './orchestrator';
import { engineStates, MODEL_BY_ID } from './registry';
import { NOT_AVAILABLE, type AgentMessage, type AnswerAction, type AnswerTable, type Claim, type ConflictNote, type EngineeringAnswer, type Intent, type SourceRef } from './types';

/*
 * INTENT HANDLERS. Each one calls existing engines and turns their structured output into claims.
 * No handler writes a number that did not come out of a record or a deterministic engine.
 */

export interface HandlerOut {
  title: string;
  sections: Partial<Pick<EngineeringAnswer, 'answer' | 'basis' | 'evidence' | 'alternatives' | 'constraints' | 'risks' | 'assumptions' | 'gaps' | 'validation' | 'tables' | 'actions' | 'conflicts' | 'agents'>>;
  draft?: EngineeringAnswer['draft'];
  constraints?: { pass: number; fail: number; unknown: number };
  coverage?: { known: number; total: number };
  agreement?: number | null;
  historical?: number | null;
  modelUncertainty?: number | null;
  deterministic?: string | null;
  engineNote?: string;
}

type Handler = (c: HandlerCtx) => Promise<HandlerOut>;
type P = AnyRecord & Part;

const label = (e: string) => ENTITY_BY_TYPE[e]?.label ?? e.replace(/_/g, ' ');
/** money as written in TEAL documents (Indian digit grouping), never scientific notation */
const inr = (v: number) => `${Math.round(v).toLocaleString('en-IN')} INR`;
const parts = (c: HandlerCtx) => c.deps.records.filter((r) => r.entity === 'part') as P[];
const isPart = (r: AnyRecord | null | undefined): r is P => !!r && r.entity === 'part';
const userRef = (excerpt: string): SourceRef => ({ kind: 'user', id: 'query', label: 'Your requirement text', excerpt });

function conflictsOf(p: P, c: HandlerCtx): ConflictNote[] {
  const out: ConflictNote[] = [];
  for (const key of new Set((p.specs ?? []).map((s) => s.spec))) {
    const s = readSpec(p, key, c.deps.defs, c.deps.byId);
    if (!s?.conflict) continue;
    out.push({
      subject: `${p.model_number} (${p.name})`,
      field: c.deps.defs.get(key)?.name ?? key,
      values: s.all.map((n) => {
        const src = n.entry.source_id ? c.deps.byId.get(n.entry.source_id) : undefined;
        return { value: n.original, source: src ? recRef(src, n.entry.evidence) : { kind: 'record', id: p.id, label: p.name, href: recHref(p.id) } };
      }),
    });
  }
  return out;
}

/** Retrieval claims: handbook passages (quoted) and top records. */
function retrievalClaims(r: Retrieved, max = 3): { answer: Claim[]; evidence: Claim[]; table: AnswerTable } {
  const answer: Claim[] = r.passages.slice(0, 2).map((p) => claim(`“${p.text}” — ${p.bookTitle}, ${p.heading}`, 'VERIFIED', [hbRef(p)]));
  const recs = r.ranked.filter((h) => h.kind === 'record').slice(0, 8);
  const evidence: Claim[] = [];
  for (const h of recs.slice(0, max)) {
    evidence.push(claim(`${label(h.entity)} “${h.name}” — ${h.why.slice(1, 3).join('; ') || h.reasons[0]}`, classOfMeta(h.data_type, h.verification), [{ kind: 'record', id: h.id, label: h.name, href: recHref(h.id), data_type: h.data_type, verification: h.verification }]));
  }
  const table: AnswerTable = {
    title: 'Retrieved (hybrid: keyword + lexical vectors + graph, reranked)',
    columns: ['#', 'Result', 'Type', 'Why it ranks here'],
    rows: r.ranked.slice(0, 10).map((h, i) => ({ cells: [String(i + 1), h.name, h.kind === 'knowledge' ? `Handbook${h.book ? ` (${h.book})` : ''}` : label(h.entity), h.why.slice(1, 4).join('; ') || h.reasons.join('; ')], href: h.kind === 'knowledge' && h.ref ? `/knowledge/${h.ref.split('#')[0]}?a=${h.ref.split('#')[1]}` : recHref(h.id) })),
  };
  return { answer, evidence, table };
}

/* ------------------------------------------------------------------ explain / search / GraphRAG */

const QWORDS = /^(what|which|why|how|is|are|the|a|an|of|for|explain|describe|define|tell|me|about|does|do|laser|lasers)$/i;

type Rec = AnyRecord & Record<string, unknown>;
const q = (v: unknown): string | null => (v && typeof v === 'object' && 'value' in (v as object) ? ((v as { value: unknown }).value == null ? null : `${(v as { value: unknown }).value} ${(v as { unit?: string }).unit ?? ''}`.trim()) : null);

/** The recorded facts of a record, as one sourced claim (the "definition" an explain answer leads with). */
function recordFacts(r: AnyRecord, c: HandlerCtx): Claim | null {
  const x = r as Rec;
  const facts: string[] = [];
  if (r.entity === 'technology' && Array.isArray(x.laser_source_ids) && x.laser_source_ids.length) {
    const ls = c.deps.byId.get(String(x.laser_source_ids[0]));
    if (ls) return recordFacts(ls, c);
  }
  if (r.entity === 'laser_source') {
    const pd = x.pulse_duration_range as { min?: number; max?: number; unit?: string } | undefined;
    facts.push(`wavelength ${q(x.wavelength) ?? 'Not Available'}`);
    if (x.mode) facts.push(`mode ${x.mode}`);
    if (pd?.min != null) facts.push(`pulse duration ${pd.min}–${pd.max} ${pd.unit ?? ''}`.trim());
    else if (q(x.pulse_duration)) facts.push(`pulse duration ${q(x.pulse_duration)}`);
    if (Array.isArray(x.repetition_rate_khz)) facts.push(`repetition rate ${(x.repetition_rate_khz as number[]).join('–')} kHz`);
    if (x.m2 != null) facts.push(`M² ${typeof x.m2 === 'object' ? q(x.m2) : x.m2}`);
    if (Array.isArray(x.categories)) facts.push(`categories ${(x.categories as string[]).join(' / ')}`);
    return fromRecord(`${r.name} (TEAL source class): ${facts.join(', ')}.`, r, 'wavelength, mode, pulse, repetition rate');
  }
  if (r.entity === 'material' && x.absorption && typeof x.absorption === 'object') {
    return fromRecord(`${r.name}: absorption ${Object.entries(x.absorption as Record<string, number>).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(', ')}; thermal conductivity ${q(x.thermal_conductivity) ?? 'Not Available'}; melting point ${q(x.melting_point) ?? 'Not Available'}.`, r, 'absorption, thermal properties');
  }
  if (r.entity === 'application') {
    const src = c.deps.byId.get(String(x.recommended_source_id ?? ''));
    return fromRecord(`${r.name} (${x.process}): recommended source ${src?.name ?? 'Not Available'}${x.recommended_power_w ? ` at ${x.recommended_power_w} W` : ''}${x.rationale ? ` — “${x.rationale}”` : ''}.`, r, 'recommended_source_id, rationale');
  }
  if (isPart(r)) {
    const specs = (r.specs ?? []).slice(0, 5).map((s) => `${c.deps.defs.get(s.spec)?.name ?? s.spec} ${displaySpec(readSpec(r, s.spec, c.deps.defs))}`);
    return fromRecord(`${r.model_number} (${productTypeLabel(r.product_type)}): ${specs.join(', ')}.`, r, 'specs');
  }
  const desc = typeof x.description === 'string' ? x.description : typeof x.summary === 'string' ? x.summary : '';
  return desc ? fromRecord(`${r.name}: ${desc}`, r, 'description', desc) : null;
}

const search: Handler = async (c) => {
  const r = await c.retrieve();
  const { answer, evidence, table } = retrievalClaims(r);
  // a record whose name the question is about leads with its own recorded description
  const terms = c.query.toLowerCase().split(/[^a-z0-9µ-]+/).filter((t) => t.length > 1 && !QWORDS.test(t));
  // prefer curated reference records (technology, source class, material, application) over DEMO parts as the definition
  const PREF = ['technology', 'laser_source', 'material', 'application', 'product', 'standard', 'formula', 'optic', 'module'];
  const named = r.ranked
    .filter((h) => h.kind === 'record' && h.entity !== 'evidence')
    .slice(0, 10)
    .filter((h) => terms.length && terms.every((t) => h.name.toLowerCase().includes(t)))
    .sort((a, b) => Number(a.data_type === 'DEMO') - Number(b.data_type === 'DEMO') || (PREF.indexOf(a.entity) + 1 || 99) - (PREF.indexOf(b.entity) + 1 || 99))[0];
  const rec = named ? c.deps.byId.get(named.id) : undefined;
  const mentioned = c.mentions.find((m) => ['material', 'laser_source', 'application', 'technology', 'part', 'product'].includes(m.record.entity))?.record;
  const fact = rec ? recordFacts(rec, c) : mentioned ? recordFacts(mentioned, c) : c.subject && c.ir.signals.refersToContext ? recordFacts(c.subject, c) : null;
  if (fact) answer.unshift(fact);
  const sections: HandlerOut['sections'] = { answer, evidence, tables: [table] };
  // "Where can I use this?" — GraphRAG from the subject to applications / industries / platforms
  if (c.subject && /\b(where|use|used|applications?|suitable|industr|what (is it|can it) (for|do))\b/i.test(c.query)) {
    const paths = graphPaths(c.deps.graph, [c.subject.id], ['Application', 'Industry', 'Product', 'Laser Type'], { maxHops: 3, limit: 10 });
    if (paths.length) {
      sections.answer = [
        ...paths.slice(0, 6).map((p) =>
          claim(
            pathText(p),
            p.some((s) => s.derived) ? 'INFERRED' : weakest(...p.map((s) => (c.deps.byId.has(s.id) ? classOf(c.deps.byId.get(s.id)) : ('VERIFIED' as const)))),
            p.map((s) => recRef(c.deps.byId.get(s.id)!)),
          ),
        ),
        ...answer,
      ];
      sections.tables = [{ title: `Knowledge-graph paths from ${c.subject.name}`, columns: ['Path', 'Hops'], rows: paths.map((p) => ({ cells: [pathText(p), String(p.length - 1)], href: recHref(p[p.length - 1].id) })) }, table];
    }
  }
  if (!answer.length && !evidence.length && !sections.answer?.length) sections.gaps = [gap(NOT_AVAILABLE)];
  return { title: c.subject ? `About ${c.subject.name}` : 'Answer from the knowledge base', sections, agreement: r.hybrid?.agreement ?? null, engineNote: `${r.ranked.length} retrieved, ${r.passages.length} passages` };
};

/* ------------------------------------------------------------------ technical part search */

const findParts: Handler = async (c) => {
  const res = searchParts(c.query, parts(c), c.deps.defs);
  const pr = parametricSearch(c.query, c.deps.records);
  const answer: Claim[] = [];
  const tables: AnswerTable[] = [];
  const gaps: Claim[] = [];
  let pass = 0;
  let fail = 0;
  let unknown = 0;
  const filters = describeQuery(res.parsed);
  if (res.understood) {
    answer.push(claim(`${res.candidates.length} part(s) in the engineering database meet every stated constraint (${filters.join('; ') || 'no numeric constraint'})${res.near.length ? `; ${res.near.length} more miss exactly one` : ''}. Ranked by constraints met — not declared “best”.`, res.candidates.length ? 'INFERRED' : 'UNKNOWN', [engineRef('local-rules', 'Part search constraint filter'), ...res.candidates.slice(0, 6).map((x) => recRef(x.part))]));
    // constraint satisfaction of what is offered as a match (near misses are shown as alternatives)
    for (const x of res.candidates) for (const ch of x.checks) {
      if (ch.state === 'match') pass++;
      else if (ch.state === 'fail') fail++;
      else unknown++;
    }
    tables.push({
      title: 'Candidates (engineering database)',
      columns: ['Model', 'Type', 'Manufacturer', 'Matched', 'Failed', 'Not available', 'Checks'],
      rows: [...res.candidates, ...res.near].slice(0, 12).map((x) => ({ cells: [x.part.model_number, productTypeLabel(x.part.product_type), originOf(x.part, c.deps.byId).manufacturer, String(x.matched), String(x.failed), String(x.unknown), x.checks.map((k) => `${k.state === 'match' ? '✓' : k.state === 'fail' ? '✗' : '?'} ${k.label}: ${k.detail}`).join(' · ')], href: recHref(x.part.id), cls: x.failed ? 'CONFLICTING' : classOf(x.part) })),
      note: 'DEMO parts are fictional placeholders until real datasheets are ingested.',
    });
    const unk = [...res.candidates].filter((x) => x.unknown).length;
    if (unk) gaps.push(gap(`${unk} candidate(s) have Not Available values for a requested parameter — cannot be confirmed from the database`));
  }
  if (pr.filters.length && (pr.sources.length || pr.offers.length)) {
    answer.push(claim(`TEAL platforms offering ${pr.filters.join(', ')}: ${pr.offers.slice(0, 6).map((o) => `${o.product.name} (${o.source.name}, ${o.powers.join('/')} W)`).join('; ') || 'none'}.`, 'VERIFIED', pr.offers.slice(0, 6).map((o) => recRef(o.product as unknown as AnyRecord, 'powers_by_source'))));
    tables.push({ title: 'TEAL platforms (parametric)', columns: ['Platform', 'Source', 'Powers (W)'], rows: pr.offers.slice(0, 10).map((o) => ({ cells: [o.product.name, o.source.name, o.powers.join(', ')], href: recHref(o.product.id) })) });
  }
  const conflicts = res.candidates.slice(0, 6).flatMap((x) => conflictsOf(x.part, c));
  if (!answer.length) {
    const r = await c.retrieve();
    const rc = retrievalClaims(r);
    return { title: 'Technical search', sections: { answer: rc.answer, evidence: rc.evidence, tables: [rc.table], gaps: [gap('The question names no part type, technology or parameter the technical search understands — showing knowledge-base results instead')] }, agreement: r.hybrid?.agreement ?? null };
  }
  return { title: 'Technical part search', sections: { answer, tables, gaps, conflicts, alternatives: res.near.slice(0, 4).map((x) => fromRecord(`Near match ${x.part.model_number}: fails ${x.checks.filter((k) => k.state === 'fail').map((k) => k.label).join(', ')}`, x.part)) }, constraints: { pass, fail, unknown }, engineNote: filters.join('; ') };
};

/* ------------------------------------------------------------------ compare */

const compare: Handler = async (c) => {
  const subjects = [...new Map([...c.mentions.map((m) => m.record), ...(c.subject ? [c.subject] : [])].map((r) => [r.id, r])).values()];
  if (subjects.length < 2) {
    const out = await search(c);
    return { ...out, title: 'Compare', sections: { ...out.sections, gaps: [...(out.sections.gaps ?? []), gap(`Name two records to compare (model numbers or full names) — ${subjects.length ? `only “${subjects[0].name}” was recognised` : 'none was recognised'}.`)] } };
  }
  const [a, b] = subjects;
  const tables: AnswerTable[] = [];
  const answer: Claim[] = [];
  const conflicts: ConflictNote[] = [];
  if (isPart(a) && isPart(b)) {
    const keys = [...new Set([...(a.specs ?? []), ...(b.specs ?? [])].map((s) => s.spec))];
    let diff = 0;
    let missing = 0;
    const rows = keys.map((k) => {
      const va = displaySpec(readSpec(a, k, c.deps.defs));
      const vb = displaySpec(readSpec(b, k, c.deps.defs));
      if (va !== vb) diff++;
      if (va === 'Not Available' || vb === 'Not Available') missing++;
      return { cells: [c.deps.defs.get(k)?.name ?? k, va, vb, va === vb ? 'same' : va === 'Not Available' || vb === 'Not Available' ? 'not comparable' : 'differs'] };
    });
    tables.push({ title: `${a.model_number} vs ${b.model_number}`, columns: ['Specification', a.model_number, b.model_number, 'Result'], rows });
    answer.push(claim(`Compared ${a.model_number} and ${b.model_number} on ${keys.length} specification(s): ${diff} differ, ${missing} are Not Available on one side. No winner is declared — the right choice depends on the requirement.`, weakest(fromRecord('', a).cls, fromRecord('', b).cls), [recRef(a, 'specs'), recRef(b, 'specs')]));
    const pr = checkPair(a, b, c.deps.compat);
    if (pr.basis !== 'No rule applies') answer.push(claim(`Together: ${COMPAT_LABEL[pr.relationship]} — ${pr.summary}`, pr.relationship === 'Unknown' ? 'UNKNOWN' : 'INFERRED', [engineRef('local-rules', 'Compatibility engine'), recRef(a), recRef(b)]));
    conflicts.push(...conflictsOf(a, c), ...conflictsOf(b, c));
  } else {
    const fields = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => !['id', 'entity', 'provenance', 'tags', '__origin', '__dataset', 'description', 'name'].includes(k));
    const fmt = (v: unknown): string => (v == null ? 'Not Available' : typeof v === 'object' ? ('value' in (v as object) ? `${(v as { value: unknown }).value ?? 'Not Available'} ${(v as { unit?: string }).unit ?? ''}`.trim() : Array.isArray(v) ? v.map(fmt).join(', ') : JSON.stringify(v).slice(0, 80)) : String(v));
    tables.push({ title: `${a.name} vs ${b.name}`, columns: ['Field', a.name, b.name], rows: fields.map((f) => ({ cells: [f.replace(/_/g, ' '), fmt((a as Record<string, unknown>)[f]), fmt((b as Record<string, unknown>)[f])] })) });
    answer.push(claim(`${label(a.entity)} “${a.name}” and ${label(b.entity)} “${b.name}” compared field by field (${fields.length} fields). No winner is declared.`, weakest(fromRecord('', a).cls, fromRecord('', b).cls), [recRef(a), recRef(b)]));
  }
  return { title: `Compare ${a.name} and ${b.name}`, sections: { answer, tables, conflicts } };
};

/* ------------------------------------------------------------------ alternatives */

const alternatives: Handler = async (c) => {
  const subj = c.mentions.map((m) => m.record).find(isPart) ?? (isPart(c.subject) ? c.subject : null);
  if (!subj) {
    const out = await search(c);
    return { ...out, title: 'Find alternatives', sections: { ...out.sections, gaps: [gap('Open a component page or name its model number — alternatives are computed for one engineering-database part')] } };
  }
  const sims = c.deps.records.filter((r) => r.entity === 'simulation' && ((r as unknown as Simulation).selections ?? []).some((s) => s.part_id === subj.id)) as (AnyRecord & Simulation)[];
  const neighboursOf = sims.flatMap((sim) => {
    const sel = sim.selections ?? [];
    const mine = sel.filter((s) => s.part_id === subj.id).map((s) => s.station_key);
    return sel.filter((s) => s.part_id !== subj.id && (mine.includes(s.station_key) || s.station_key === '_machine')).map((s) => c.deps.byId.get(s.part_id)).filter(isPart);
  });
  const uniqN = [...new Map(neighboursOf.map((p) => [p.id, p])).values()];
  const keySpecs = [...c.deps.defs.values()].filter((d) => d.filterable && d.applies_to.includes(subj.product_type)).slice(0, 4);
  const cands = parts(c).filter((p) => p.product_type === subj.product_type && p.id !== subj.id && p.record_status !== 'Archived' && p.lifecycle_status !== 'Discontinued');
  let pass = 0;
  let fail = 0;
  let unknown = 0;
  const rows = cands.map((p) => {
    const results = uniqN.map((n) => checkPair(p, n, c.deps.compat)).filter((r) => r.basis !== 'No rule applies');
    const worst = results.find((r) => r.relationship === 'Incompatible') ?? results.find((r) => r.relationship === 'Unknown' || r.relationship === 'ConditionallyCompatible') ?? results[0];
    for (const r of results) for (const ch of r.checks) {
      if (ch.status === 'pass') pass++;
      else if (ch.status === 'fail') fail++;
      else unknown++;
    }
    const o = originOf(p, c.deps.byId);
    const pr = latestPrice(p);
    return { p, rel: worst ? COMPAT_LABEL[worst.relationship] : uniqN.length ? 'No rule applies' : 'No scenario uses the original', o, pr, incompatible: worst?.relationship === 'Incompatible' };
  });
  const ok = rows.filter((r) => !r.incompatible);
  const answer = [
    claim(`${cands.length} other ${productTypeLabel(subj.product_type)} part(s) exist in the engineering database; ${ok.length} are not marked incompatible with the ${uniqN.length} component(s) the original works with${sims.length ? ` in ${sims.length} scenario(s)` : ''}. None is a confirmed drop-in replacement.`, cands.length ? 'INFERRED' : 'UNKNOWN', [recRef(subj), engineRef('local-rules', 'Compatibility engine'), ...cands.slice(0, 6).map((p) => recRef(p))]),
  ];
  const tables: AnswerTable[] = [
    {
      title: `Alternatives to ${subj.model_number}`,
      columns: ['Model', 'Manufacturer', 'Origin', ...keySpecs.map((d) => d.name), 'With current neighbours', 'Lead time', 'Price'],
      rows: [
        { cells: [`${subj.model_number} (current)`, originOf(subj, c.deps.byId).manufacturer, originOf(subj, c.deps.byId).origin, ...keySpecs.map((d) => displaySpec(readSpec(subj, d.key, c.deps.defs))), '—', latestPrice(subj)?.lead_time_weeks != null ? `${latestPrice(subj)!.lead_time_weeks} wk` : 'Not Available', latestPrice(subj) ? `${latestPrice(subj)!.price} ${latestPrice(subj)!.currency} (${latestPrice(subj)!.basis})` : 'Not Available'], href: recHref(subj.id) },
        ...rows.map((r) => ({ cells: [r.p.model_number, r.o.manufacturer, r.o.origin, ...keySpecs.map((d) => displaySpec(readSpec(r.p, d.key, c.deps.defs))), r.rel, r.pr?.lead_time_weeks != null ? `${r.pr.lead_time_weeks} wk` : 'Not Available', r.pr ? `${r.pr.price} ${r.pr.currency} (${r.pr.basis})` : 'Not Available'], href: recHref(r.p.id), cls: r.incompatible ? ('CONFLICTING' as const) : r.p.data_type === 'DEMO' ? ('ASSUMED' as const) : ('INFERRED' as const) })),
      ],
      note: 'Compatibility is rule-based against the parts the original is combined with; a physical fit, qualification and a datasheet check are still required.',
    },
  ];
  return {
    title: `Alternatives to ${subj.model_number}`,
    sections: {
      answer,
      tables,
      alternatives: ok.slice(0, 5).map((r) => fromRecord(`${r.p.model_number} (${r.o.manufacturer}, ${r.o.origin}) — ${r.rel}`, r.p)),
      validation: [claim('Qualify any alternative on the machine (fit, interfaces, process result) before it replaces the original', 'ASSUMED', [engineRef('local-rules', 'Engineering practice')])],
      actions: [{ kind: 'ask', label: `Change impact: replace ${subj.model_number}`, query: ok[0] ? `What changes if I replace ${subj.model_number} with ${ok[0].p.model_number}?` : `What changes if I replace ${subj.model_number}?` }],
    },
    constraints: { pass, fail, unknown },
  };
};

/* ------------------------------------------------------------------ compatibility */

const compatibility: Handler = async (c) => {
  const ps = [...new Map([...c.mentions.map((m) => m.record).filter(isPart), ...(isPart(c.subject) ? [c.subject] : [])].map((p) => [p.id, p])).values()];
  if (ps.length >= 2) {
    const r = checkPair(ps[0], ps[1], c.deps.compat);
    const pass = r.checks.filter((x) => x.status === 'pass').length;
    const fail = r.checks.filter((x) => x.status === 'fail').length;
    const unknown = r.checks.filter((x) => x.status === 'missing').length;
    return {
      title: `${ps[0].model_number} ↔ ${ps[1].model_number}`,
      sections: {
        answer: [claim(`${COMPAT_LABEL[r.relationship]} (${r.basis}) — ${r.summary}`, r.relationship === 'Unknown' ? 'UNKNOWN' : r.relationship === 'Incompatible' ? 'INFERRED' : r.basis === 'Recorded relationship' ? 'VERIFIED' : 'INFERRED', [engineRef('local-rules', 'Compatibility engine'), recRef(ps[0]), recRef(ps[1]), ...r.recorded.map((x) => recRef(x))])],
        tables: [{ title: 'Rule checks', columns: ['Rule', 'Result', 'Detail'], rows: r.checks.map((x) => ({ cells: [x.rule.name, x.status === 'pass' ? 'pass' : x.status === 'fail' ? `fail → ${COMPAT_LABEL[x.result]}` : 'could not run', x.detail], cls: x.status === 'fail' ? 'CONFLICTING' : x.status === 'missing' ? 'UNKNOWN' : 'INFERRED' })) }],
        gaps: r.checks.filter((x) => x.status === 'missing').map((x) => gap(x.detail, [recRef(x.a), recRef(x.b)])),
        conflicts: [...conflictsOf(ps[0], c), ...conflictsOf(ps[1], c)],
      },
      constraints: { pass, fail, unknown },
    };
  }
  if (ps.length === 1) {
    const res = compatibleWith(ps[0], parts(c), c.deps.compat);
    return {
      title: `What works with ${ps[0].model_number}`,
      sections: {
        answer: [claim(`${res.length} part(s) are connected to ${ps[0].model_number} by a recorded relationship or an engineering rule; ${res.filter((r) => r.relationship === 'Incompatible').length} are incompatible.`, 'INFERRED', [engineRef('local-rules', 'Compatibility engine'), recRef(ps[0])])],
        tables: [{ title: `Compatibility of ${ps[0].model_number}`, columns: ['Part', 'Type', 'Result', 'Basis', 'Summary'], rows: res.slice(0, 20).map((r) => ({ cells: [r.b.model_number, productTypeLabel(r.b.product_type), COMPAT_LABEL[r.relationship], r.basis, r.summary], href: recHref(r.b.id), cls: r.relationship === 'Incompatible' ? 'CONFLICTING' : r.relationship === 'Unknown' ? 'UNKNOWN' : 'INFERRED' })) }],
      },
      constraints: { pass: res.filter((r) => !['Incompatible', 'Unknown'].includes(r.relationship)).length, fail: res.filter((r) => r.relationship === 'Incompatible').length, unknown: res.filter((r) => r.relationship === 'Unknown').length },
    };
  }
  const out = await search(c);
  return { ...out, title: 'Compatibility check', sections: { ...out.sections, gaps: [gap('Name one or two engineering-database parts (model numbers) or open a part page')] } };
};

/* ------------------------------------------------------------------ configure / laser / BOM / cost / RFQ / URS / FMEA */

function configureSections(cfg: ConfigureResult, intent: Intent, query: string): HandlerOut {
  const q = userRef(query.slice(0, 300));
  const answer: Claim[] = [];
  const basis: Claim[] = [];
  const tables: AnswerTable[] = [];
  const agents: AgentMessage[] = [];
  const req = cfg.req;
  const reqRows = REQUIREMENT_FIELDS.map((k) => req[k]);
  agents.push({ agent: 'requirements', task: 'extract requirements', requirements: Object.fromEntries(reqRows.map((f) => [f.label, f.value])), constraints: req.missing.map((m) => `${m}: Not Defined`), candidates: [], evidence: [q], confidence: req.missing.length > 6 ? 'low' : req.missing.length > 3 ? 'medium' : 'high', verification_required: true, notes: [] });
  for (const f of reqRows) if (f.status !== 'NOT DEFINED') basis.push(claim(`${f.label}: ${f.value}${f.unit ? ` ${f.unit}` : ''} — ${f.basis}`, f.status === 'CALCULATED' ? 'INFERRED' : 'VERIFIED', f.status === 'CALCULATED' ? [engineRef('local-units', 'Unit engine', 'throughput = 3600 / cycle time')] : [q]));
  tables.push({ title: 'Requirement extraction', columns: ['Parameter', 'Value', 'Status', 'Basis'], rows: reqRows.map((f) => ({ cells: [f.label, f.value == null ? 'Not Defined' : `${f.value}${f.unit ? ` ${f.unit}` : ''}`, f.status, f.basis], cls: f.status === 'NOT DEFINED' ? 'UNKNOWN' : f.status === 'CALCULATED' ? 'INFERRED' : 'VERIFIED' })) });

  // technology candidates
  agents.push({ agent: 'laser', task: 'technology candidates', requirements: { process: req.process.value, material: req.material.value }, constraints: [], candidates: cfg.lasers.map((l) => l.source.name), evidence: cfg.lasers.flatMap((l) => l.refs).slice(0, 10), confidence: cfg.lasers.some((l) => l.applications.length) ? 'medium' : cfg.lasers.length ? 'low' : 'insufficient', verification_required: true, notes: ['Ordered by TEAL application records, then recorded absorption — no single "best"'] });
  if (cfg.lasers.length) {
    const top = cfg.lasers.slice(0, 3);
    answer.push(claim(`Candidate technologies for ${req.process.value ?? 'this process'}${req.material.value ? ` on ${req.material.value}` : ''}: ${top.map((l) => `${l.source.name}${l.recommendedPowerW.length ? ` (${l.recommendedPowerW.join('/')} W in TEAL application records)` : ''}`).join('; ')}. Candidates, not a single “best” — each needs a process trial.`, top.some((l) => l.applications.length) ? 'INFERRED' : 'ESTIMATED', top.flatMap((l) => l.refs)));
    for (const l of cfg.lasers.slice(0, 4)) for (const b of l.basis) basis.push(claim(b, l.applications.length ? 'VERIFIED' : 'INFERRED', l.refs));
    tables.push({ title: 'Technology candidates', columns: ['Source class', 'Wavelength', 'Regime', 'TEAL application records', 'Absorption (material)'], rows: cfg.lasers.map((l) => ({ cells: [l.source.name, `${l.source.wavelength?.value ?? '?'} nm`, (l.source.categories ?? []).join(' / '), l.applications.map((a) => `${a.name}${a.recommended_power_w ? ` · ${a.recommended_power_w} W` : ''}`).join('; ') || '—', l.absorption ? `${l.absorption.value} (${l.absorption.band})` : 'Not Available'], href: recHref(l.source.id), cls: l.applications.length ? 'VERIFIED' : 'INFERRED' })) });
  }
  // platform + configuration
  const pkg = cfg.pkg;
  const top = pkg?.matches[0];
  if (top) {
    const app = top.product.applications.find((a) => a.key === top.appKey);
    answer.push(claim(`Closest TEAL platform: ${top.product.name}${app ? ` — ${app.name}` : ''} (match score ${top.score}: ${top.why.map((w) => `${w.t} ${w.d}`).join(', ')}).`, 'INFERRED', [recRef(top.product as unknown as AnyRecord), engineRef('local-configurator', 'Inquiry platform matcher')]));
    tables.push({ title: 'Platform matches', columns: ['Platform', 'Application', 'Score', 'Why'], rows: pkg!.matches.map((m) => ({ cells: [m.product.name, m.product.applications.find((a) => a.key === m.appKey)?.name ?? m.appKey, String(m.score), m.why.map((w) => `${w.t}: ${w.d}`).join('; ')], href: recHref(m.product.id) })) });
  } else if (pkg) answer.push(gap('No TEAL platform matched this requirement — treat it as a new development candidate'));
  if (cfg.solution) {
    tables.push({ title: 'Architecture (subsystems)', columns: ['Layer', 'Blocks', 'Supplier candidates (records)'], rows: cfg.solution.subsystems.map((s) => ({ cells: [s.lane, s.nodes.map((n) => n.label).join(', '), s.suppliers.map((x) => x.name).join(', ') || '—'] })) });
    answer.push(claim(`Complexity: ${cfg.solution.complexity.level} — ${cfg.solution.complexity.reasons.join('; ')}.`, 'INFERRED', [engineRef('local-configurator', 'Application engine')]));
  }
  // BOM + cost
  const lines = pkg?.bom?.lines.filter((l) => l.level !== 'Product') ?? [];
  if (lines.length) {
    agents.push({ agent: 'bom', task: 'preliminary BOM', requirements: { platform: top?.product.name }, constraints: [], candidates: lines.map((l) => l.description), evidence: [engineRef('local-configurator', 'BOM generator')], confidence: 'medium', verification_required: true, notes: [cfg.cost.basis] });
    tables.push({ title: 'Preliminary BOM', columns: ['Level', 'Item', 'Qty', 'Unit cost (INR)', 'Basis', 'Make / buy', 'Import'], rows: lines.map((l) => ({ cells: [String(l.level), l.description, String(l.quantity), l.unit_cost != null ? Math.round(l.unit_cost).toLocaleString('en-IN') : 'UNKNOWN', String(l.cost_basis ?? '—'), String(l.make_buy ?? '—'), l.import_item ? 'yes' : 'no'], cls: l.unit_cost == null ? 'UNKNOWN' : 'ESTIMATED' })), note: cfg.cost.basis });
  }
  const costClaims: Claim[] = [];
  if (cfg.cost.band || cfg.cost.estimate != null) costClaims.push(claim(`Configurator price band: ${cfg.cost.band ? `${inr(cfg.cost.band[0])} – ${inr(cfg.cost.band[1])}` : 'Not Available'}${cfg.cost.estimate != null ? ` (point estimate ${inr(cfg.cost.estimate)})` : ''} — ${cfg.cost.basis}.`, 'ESTIMATED', [engineRef('local-configurator', 'Configurator pricing rules')]));
  if (cfg.cost.knownLines) costClaims.push(claim(`${cfg.cost.knownLines} BOM line(s) carry list-price estimates summing to ${inr(cfg.cost.knownTotal)}; ${cfg.cost.unknownLines} line(s) have no cost.`, 'ESTIMATED', [engineRef('local-configurator', 'BOM generator')]));
  // components from the engineering DB + compatibility
  agents.push({ agent: 'component', task: 'components per subsystem', requirements: { process: req.process.value, technology: cfg.lasers[0]?.source.name }, constraints: [], candidates: cfg.components.map((x) => `${x.role}: ${x.parts.map((p) => p.model_number).join(', ') || 'none'}`), evidence: cfg.components.flatMap((x) => x.parts.slice(0, 1).map((p) => recRef(p))), confidence: 'low', verification_required: true, notes: ['Engineering-database parts are DEMO until real datasheets are ingested'] });
  tables.push({ title: 'Components from the engineering database', columns: ['Role', 'Candidates', 'Note'], rows: cfg.components.map((x) => ({ cells: [x.role, x.parts.map((p) => `${p.model_number}${p.data_type === 'DEMO' ? ' (DEMO)' : ''}`).join(', ') || '—', x.note], href: x.parts[0] ? recHref(x.parts[0].id) : undefined, cls: x.parts.length ? classOf(x.parts[0]) : 'UNKNOWN' })) });
  let pass = 0;
  let fail = 0;
  let unknown = 0;
  for (const r of cfg.compat) for (const ch of r.checks) {
    if (ch.status === 'pass') pass++;
    else if (ch.status === 'fail') fail++;
    else unknown++;
  }
  if (cfg.compat.length) tables.push({ title: 'Compatibility of the first candidate per role', columns: ['Pair', 'Result', 'Summary'], rows: cfg.compat.map((r) => ({ cells: [`${r.a.model_number} ↔ ${r.b.model_number}`, COMPAT_LABEL[r.relationship], r.summary], cls: r.relationship === 'Incompatible' ? 'CONFLICTING' : r.relationship === 'Unknown' ? 'UNKNOWN' : 'INFERRED' })) });
  const cfgWarn = (pkg?.configuration?.snapshot?.warnings ?? []) as string[];
  // suppliers
  if (pkg?.supplierNeeds.length) {
    agents.push({ agent: 'supplier', task: 'supplier candidates', requirements: {}, constraints: [], candidates: pkg.supplierNeeds.map((n) => `${n.need}: ${n.candidates.length}`), evidence: [], confidence: 'low', verification_required: true, notes: ['Candidates from supplier / company records — capability not verified'] });
    tables.push({ title: 'Supplier candidates (records)', columns: ['Need', 'Candidates', 'Basis'], rows: pkg.supplierNeeds.map((n) => ({ cells: [n.need, n.candidates.map((x) => x.name).join(', ') || 'None on record', [...new Set(n.candidates.map((x) => x.basis))].join('; ') || '—'], cls: n.candidates.length ? 'INFERRED' : 'UNKNOWN' })) });
  }
  const risks: Claim[] = [...(pkg?.risks ?? []).map((r) => claim(`${r.name} — ${r.cause} → ${r.effect}`, 'INFERRED', [engineRef('local-configurator', 'Inquiry risk rules')])), ...cfgWarn.map((w) => claim(w, /UNKNOWN/.test(w) ? 'UNKNOWN' : 'INFERRED', [engineRef('local-rules', 'Configurator compatibility checks')])), ...(cfg.solution?.risks ?? []).map((r) => claim(r, 'INFERRED', [engineRef('local-configurator', 'Application engine')]))];
  const dedupRisks = [...new Map(risks.map((r) => [r.text, r])).values()];
  const actions: AnswerAction[] = [];
  const tpl = cfg.templates[0];
  if (tpl) actions.push({ kind: 'open3d', label: `Open a 3D scenario from “${tpl.template.name}”`, templateId: tpl.template.id, uph: typeof req.throughput.value === 'number' ? req.throughput.value : null });
  actions.push({ kind: 'open', label: 'Open in AI Configurator', href: `/ai-configure?q=${encodeURIComponent(query)}` });
  if (intent !== 'rfq') actions.push({ kind: 'ask', label: 'Generate RFQ', query: `Generate an RFQ for: ${query}` });
  if (intent !== 'urs') actions.push({ kind: 'ask', label: 'Generate URS', query: `Generate a URS for: ${query}` });
  if (intent !== 'fmea') actions.push({ kind: 'ask', label: 'AI-suggested FMEA', query: `FMEA for: ${query}` });
  actions.push({ kind: 'decision', label: 'Record an engineering decision' });

  const draft = intent === 'rfq' ? { kind: 'rfq' as const, ...rfqDraft(cfg) } : intent === 'urs' ? { kind: 'urs' as const, ...ursDraft(cfg) } : intent === 'fmea' ? { kind: 'fmea' as const, ...fmeaDraft(cfg) } : undefined;
  const focus = intent === 'cost' ? [...costClaims, ...answer] : intent === 'bom' ? [...answer.slice(0, 1), ...costClaims, ...answer.slice(1)] : [...answer, ...costClaims];
  const order = intent === 'bom' ? ['Preliminary BOM'] : intent === 'laser_selection' ? ['Technology candidates'] : intent === 'cost' ? ['Preliminary BOM'] : [];
  const sortedTables = [...tables.filter((t) => order.includes(t.title)), ...tables.filter((t) => !order.includes(t.title))];
  const known = reqRows.filter((f) => f.status !== 'NOT DEFINED').length;
  return {
    title: intent === 'laser_selection' ? 'Laser technology selection' : intent === 'bom' ? 'Preliminary BOM' : intent === 'cost' ? 'Cost analysis' : intent === 'rfq' ? 'RFQ draft' : intent === 'urs' ? 'URS draft' : intent === 'fmea' ? 'AI-suggested FMEA' : 'Machine configuration',
    sections: {
      answer: focus,
      basis,
      tables: sortedTables,
      risks: dedupRisks,
      assumptions: [claim('Unit costs are configurator list-price ESTIMATES, not quotations', 'ASSUMED', [engineRef('local-configurator', 'Pricing rules')]), ...(pkg?.costModel?.assumptions ?? []).slice(0, 4).map((a) => claim(String(a), 'ASSUMED', [engineRef('local-configurator', 'Cost assumptions')]))],
      gaps: cfg.gaps.map((g) => gap(g)),
      validation: cfg.validation.map((v) => claim(v, 'ASSUMED', [engineRef('verify', 'Validation plan')])),
      actions,
      agents,
    },
    draft,
    constraints: { pass: pass + cfgWarn.filter((w) => !/UNKNOWN|FAIL|WARN/i.test(w)).length, fail: fail + cfgWarn.filter((w) => /FAIL/i.test(w)).length, unknown: unknown + cfgWarn.filter((w) => /UNKNOWN/i.test(w)).length },
    coverage: { known, total: reqRows.length },
    engineNote: `${cfg.lasers.length} technology candidate(s), ${pkg?.matches.length ?? 0} platform match(es), ${lines.length} BOM line(s)`,
  };
}

const configureH: Handler = async (c) => {
  const x = c.subject as (AnyRecord & { inquiry_text?: string }) | null;
  const text = c.query.trim().split(/\s+/).length < 6 && x?.inquiry_text ? x.inquiry_text : c.query.replace(/^(generate|draft|create|write)\s+(an?\s+)?(rfq|urs|fmea)\s*(for|:)?\s*/i, '');
  const cfg = configure(text, { records: c.deps.records, engine: c.deps.engine, lexicon: c.deps.lexicon, compat: c.deps.compat, newId: c.deps.newId, today: c.deps.today });
  const out = configureSections(cfg, c.ir.intent, text);
  if (!c.deps.engine || !c.deps.lexicon) out.sections.gaps = [...(out.sections.gaps ?? []), gap('Configurator data not loaded — platform match, BOM and price band are unavailable in this answer')];
  // handbook evidence for the technical basis
  const r = await c.retrieve(`${cfg.req.process.value ?? ''} ${cfg.req.material.value ?? ''} ${cfg.lasers[0]?.source.name ?? ''}`.trim() || c.query, { knowledge: true });
  out.sections.evidence = [...(out.sections.evidence ?? []), ...r.passages.slice(0, 2).map((p) => claim(`“${p.text}” — ${p.bookTitle}, ${p.heading}`, 'VERIFIED', [hbRef(p)]))];
  return out;
};

/* ------------------------------------------------------------------ suppliers & supply risk */

const supplier: Handler = async (c) => {
  const cq = compileQuery(c.query, c.deps.defs);
  if (cq && cq.filters.length) {
    const rows = runQuery(cq, c.deps.records);
    const relaxed = !rows.length && cq.filters.some((f) => f.field === 'country') ? runQuery({ ...cq, filters: cq.filters.filter((f) => f.field !== 'country') }, c.deps.records) : [];
    return {
      title: 'Supplier intelligence',
      sections: {
        answer: [rows.length ? claim(`${rows.length} record(s) match the controlled query (${cq.filters.map((f) => f.label).join('; ')}).`, 'INFERRED', rows.slice(0, 8).map((r) => recRef(r.record))) : gap(`No supplier or manufacturer record matches ${cq.filters.map((f) => f.label).join('; ')}.${relaxed.length ? ` Without the country filter, ${relaxed.length} match.` : ''}`)],
        tables: [
          { title: 'Controlled query (no SQL — whitelisted filters)', columns: ['Entities', 'Filters'], rows: [{ cells: [cq.entities.join(', '), cq.filters.map((f) => f.label).join('; ')] }] },
          { title: rows.length ? 'Matches' : 'Matches without the country filter', columns: ['Name', 'Type', 'Why'], rows: (rows.length ? rows : relaxed).slice(0, 20).map((r) => ({ cells: [r.record.name, label(r.record.entity), r.reasons.join('; ')], href: recHref(r.record.id), cls: classOf(r.record) })) },
        ],
        alternatives: rows.length ? [] : relaxed.slice(0, 5).map((r) => fromRecord(`${r.record.name} — ${r.reasons.join('; ')}`, r.record)),
        validation: [claim('Supplier capability, quality system and delivery performance must be assessed — records list names and categories, not qualification', 'ASSUMED', [engineRef('local-graph', 'Controlled query')])],
      },
    };
  }
  const r = await c.retrieve(c.query, { entities: ['supplier', 'company'], knowledge: true });
  const rc = retrievalClaims(r, 5);
  return { title: 'Supplier intelligence', sections: { answer: [...rc.evidence, ...rc.answer], tables: [rc.table] }, agreement: r.hybrid?.agreement ?? null };
};

const supplyRisk: Handler = async (c) => {
  const sim = (c.subject?.entity === 'simulation' ? c.subject : c.mentions.find((m) => m.record.entity === 'simulation')?.record) as (AnyRecord & Simulation) | undefined;
  if (sim) {
    const res = resolveScenario(sim, c.deps.byId, c.deps.defs);
    const deps = supplierDependency(res, parts(c), c.deps.compat, c.deps.byId);
    const layers = localizationLayers(deps, !!sim.recipe_id);
    const single = deps.filter((d) => d.singleSource);
    const imported = deps.filter((d) => d.origin === 'Imported');
    return {
      title: `Supply-chain risk — ${sim.name}`,
      sections: {
        answer: [claim(`${deps.length} selected component(s): ${single.length} single-source (no alternative in the database), ${imported.length} imported, ${deps.filter((d) => d.origin === 'Unknown').length} of unknown origin.`, 'INFERRED', [recRef(sim), engineRef('local-graph', 'Supplier dependency engine')])],
        risks: deps.filter((d) => d.risk.length).map((d) => fromRecord(`${d.sp.part.model_number} (${d.sp.role}, ${d.sp.station}): ${d.risk.join('; ')}`, d.sp.part)),
        tables: [
          { title: 'Dependency by component', columns: ['Component', 'Role', 'Manufacturer', 'Origin', 'Lead time', 'Alternatives', 'Risk drivers'], rows: deps.map((d) => ({ cells: [d.sp.part.model_number, d.sp.role, d.manufacturer, d.country ?? 'Unknown', d.leadTimeWeeks != null ? `${d.leadTimeWeeks} wk` : 'Not Available', String(d.alternatives.length), d.risk.join('; ') || '—'], href: recHref(d.sp.part.id), cls: d.risk.length ? 'CONFLICTING' : 'INFERRED' })) },
          { title: 'Localization by layer', columns: ['Layer', 'Status', 'Suppliers', 'Gap'], rows: layers.map((l) => ({ cells: [l.layer, l.status, l.suppliers.join(', ') || '—', l.gap] })) },
        ],
        alternatives: single.length ? [] : deps.flatMap((d) => d.alternatives.slice(0, 1).map((a) => fromRecord(`${d.sp.part.model_number} → ${a.part.model_number} (${a.relationship}, ${a.origin})`, a.part))).slice(0, 5),
        assumptions: [claim('Origin comes from the manufacturer’s recorded country; unknown stays unknown. No risk score is invented — the drivers are listed', 'ASSUMED', [engineRef('local-graph', 'Supply engine')])],
      },
    };
  }
  const ps = parts(c);
  const byType = new Map<string, Set<string>>();
  for (const p of ps) (byType.get(p.product_type) ?? byType.set(p.product_type, new Set()).get(p.product_type)!).add(p.manufacturer_id ?? '—');
  const singleTypes = [...byType.entries()].filter(([, m]) => m.size === 1);
  return {
    title: 'Supply-chain risk (engineering database)',
    sections: {
      answer: [claim(`${singleTypes.length} of ${byType.size} component types have only one manufacturer in the database: ${singleTypes.map(([t]) => productTypeLabel(t)).slice(0, 10).join(', ')}.`, 'INFERRED', [engineRef('local-graph', 'Manufacturer concentration by type')])],
      gaps: [gap('Open a Studio scenario (or name it) for a machine-level dependency and localization analysis')],
      tables: [{ title: 'Manufacturers per component type', columns: ['Type', 'Manufacturers'], rows: [...byType.entries()].map(([t, m]) => ({ cells: [productTypeLabel(t), String(m.size)], cls: m.size === 1 ? 'CONFLICTING' : 'INFERRED' })) }],
    },
  };
};

/* ------------------------------------------------------------------ change impact */

const changeImpactH: Handler = async (c) => {
  const q = c.query.toLowerCase();
  const pm = c.mentions.filter((m) => isPart(m.record)).sort((a, b) => q.indexOf(a.matched) - q.indexOf(b.matched));
  let from = pm[0]?.record as P | undefined;
  let to = pm[1]?.record as P | undefined;
  if (isPart(c.subject) && pm.length === 1 && c.subject.id !== pm[0].record.id) {
    from = c.subject;
    to = pm[0].record as P;
  } else if (!from && isPart(c.subject)) from = c.subject;
  if (!from) {
    const out = await search(c);
    return { ...out, title: 'Change impact analysis', sections: { ...out.sections, gaps: [gap('Name the component to change (and its replacement) by model number, or open its page')] } };
  }
  const ci = changeImpact(from.id, to?.id ?? null, c.deps.graph, c.deps.records, c.deps.compat, c.deps.defs)!;
  const affected = ci.rows.filter((r) => r.status === 'Affected');
  let pass = 0;
  let fail = 0;
  let unknown = 0;
  for (const s of ci.scenarios) for (const ch of s.checks) {
    if (/Incompatible/.test(ch.after)) fail++;
    else if (/Unknown/.test(ch.after)) unknown++;
    else if (ch.after !== '—') pass++;
  }
  return {
    title: to ? `Change impact: ${from.model_number} → ${to.model_number}` : `Dependencies of ${from.model_number}`,
    sections: {
      answer: [claim(to ? `Replacing ${from.model_number} with ${to.model_number} affects ${affected.length} of ${ci.rows.length} engineering domains (${affected.map((r) => r.domain).join(', ') || 'none recorded'}); ${ci.rows.filter((r) => r.status === 'Unknown').length} cannot be assessed from the data.` : `${from.model_number} is used in ${ci.scenarios.length} scenario selection(s) and linked to ${ci.review.length} record(s) that would need review on any change.`, 'INFERRED', [recRef(from), ...(to ? [recRef(to)] : []), engineRef('local-graph', 'Dependency traversal'), engineRef('local-rules', 'Compatibility re-check')])],
      tables: [
        { title: 'Impact by engineering domain', columns: ['Domain', 'Status', 'Reasons'], rows: ci.rows.map((r) => ({ cells: [r.domain, r.status, r.reasons.join(' · ') || '—'], cls: r.status === 'Affected' ? 'CONFLICTING' : r.status === 'Unknown' ? 'UNKNOWN' : r.status === 'Check' ? 'ASSUMED' : 'INFERRED' })) },
        ...(ci.deltas.length ? [{ title: 'Specification differences', columns: ['Specification', 'Category', from.model_number, to?.model_number ?? '—'], rows: ci.deltas.map((d) => ({ cells: [d.name, d.category, d.from, d.to] })) }] : []),
        ...(ci.scenarios.length ? [{ title: 'Compatibility in scenarios (before → after)', columns: ['Scenario · station', 'With', 'Before', 'After'], rows: ci.scenarios.flatMap((s) => s.checks.map((ch) => ({ cells: [`${s.sim.name} · ${s.station}`, ch.other.model_number, ch.before, ch.after], href: recHref(s.sim.id), cls: /Incompatible/.test(ch.after) ? ('CONFLICTING' as const) : /Unknown/.test(ch.after) ? ('UNKNOWN' as const) : ('INFERRED' as const) }))) }] : []),
      ],
      evidence: ci.review.slice(0, 10).map((r) => fromRecord(`Review ${label(r.entity).toLowerCase()} “${r.name}”`, r)),
      gaps: ci.rows.filter((r) => r.status === 'Unknown').map((r) => gap(`${r.domain}: ${r.reasons.join(' · ')}`)),
      assumptions: ci.assumptions.map((a) => claim(a, 'ASSUMED', [engineRef('local-graph', 'Change impact engine')])),
      validation: [claim('Re-qualify the process and re-run FAT items touched by the change; raise an ECR before release', 'ASSUMED', [engineRef('verify', 'Change control')])],
      actions: [{ kind: 'open', label: 'Raise a change request', href: '/changes' }, { kind: 'decision', label: 'Record the decision' }],
      conflicts: [...conflictsOf(from, c), ...(to ? conflictsOf(to, c) : [])],
    },
    constraints: { pass, fail, unknown },
  };
};

/* ------------------------------------------------------------------ traceability & project status */

const traceability: Handler = async (c) => {
  const all = c.deps.records.filter((r) => r.entity === 'requirement') as (Requirement & AnyRecord)[];
  const scope = c.subject && c.subject.entity !== 'requirement' ? all.filter((r) => [r.opportunity_id, r.project_id, r.product_id, r.customer_id].includes(c.subject!.id)) : c.subject?.entity === 'requirement' ? [c.subject as Requirement & AnyRecord] : all;
  const chains = scope.map((r) => traceChain(r, c.deps.records));
  const cov = traceCoverage(chains);
  const noVer = chains.filter((ch) => !ch.steps.find((s) => s.step === 'Verification')!.ok);
  return {
    title: `Requirements traceability${c.subject ? ` — ${c.subject.name}` : ''}`,
    sections: {
      answer: [claim(`${chains.length} requirement(s) traced: ${noVer.length} have no verification result; average chain coverage ${chains.length ? Math.round(chains.reduce((a, ch) => a + ch.coverage, 0) / chains.length) : 0} %.`, 'INFERRED', [engineRef('local-graph', 'Trace chain engine'), ...scope.slice(0, 6).map((r) => recRef(r))])],
      tables: [
        { title: 'Coverage by link', columns: ['Link', 'Covered', 'Total'], rows: cov.map((x) => ({ cells: [x.step, String(x.covered), String(x.total)], cls: x.covered < x.total ? 'UNKNOWN' : 'INFERRED' })) },
        { title: 'Requirements', columns: ['Requirement', 'Coverage', 'Missing links'], rows: chains.map((ch) => ({ cells: [`${ch.req.code ?? ''} ${ch.req.name}`.trim(), `${ch.coverage} %`, ch.steps.filter((s) => !s.ok).map((s) => s.step).join(', ') || '—'], href: recHref(ch.req.id) })) },
      ],
      gaps: noVer.slice(0, 8).map((ch) => gap(`${ch.req.code ?? ch.req.name}: no verification recorded`, [recRef(ch.req)])),
    },
    historical: chains.length - noVer.length,
  };
};

const projectStatus: Handler = async (c) => {
  const s = c.subject;
  if (!s) {
    const active = c.deps.records.filter((r) => ['project', 'opportunity', 'poc'].includes(r.entity) && r.next_action?.action).slice(0, 12);
    return {
      title: 'Open work',
      sections: {
        answer: [claim(`${active.length} project / opportunity / POC record(s) have a recorded next action. Open one (or name it) for a project-specific answer.`, 'INFERRED', active.map((r) => recRef(r, 'next_action')))],
        tables: [{ title: 'Next actions on record', columns: ['Record', 'Next action', 'Due'], rows: active.map((r) => ({ cells: [r.name, r.next_action!.action, r.next_action!.due ?? '—'], href: recHref(r.id), cls: classOf(r) })) }],
      },
    };
  }
  const gaps = whatIsMissing(c.deps.graph, s.id);
  const openRisks = neighbours(c.deps.graph, s.id).map((n) => n.record).filter((r) => r.entity === 'risk' && (r as { risk_status?: string }).risk_status === 'Open');
  return {
    title: `What is pending — ${s.name}`,
    sections: {
      answer: [
        ...(s.next_action?.action ? [fromRecord(`Next action: ${s.next_action.action}${s.next_action.due ? ` (due ${s.next_action.due})` : ''}`, s, 'next_action')] : []),
        claim(`${gaps.filter((g) => g.status === 'missing').length} item(s) missing and ${gaps.filter((g) => g.status === 'partial').length} partial in the digital thread of ${s.name}.`, 'INFERRED', [recRef(s), engineRef('local-graph', 'Gap engine')]),
      ],
      tables: [{ title: 'What is missing', columns: ['Category', 'Item', 'Status', 'Detail', 'Action'], rows: gaps.map((g) => ({ cells: [g.category, g.item, g.status, g.detail, g.action ?? '—'], cls: g.status === 'missing' ? 'UNKNOWN' : g.status === 'partial' ? 'ASSUMED' : 'VERIFIED' })) }],
      risks: openRisks.map((r) => fromRecord(`Open risk: ${r.name}`, r)),
      gaps: gaps.filter((g) => g.status === 'missing').map((g) => gap(`${g.item}: ${g.detail}${g.action ? ` → ${g.action}` : ''}`, [recRef(s)])),
      actions: gaps.filter((g) => g.status !== 'present' && g.action).slice(0, 4).map((g) => ({ kind: 'open' as const, label: g.action!, href: recHref(s.id) })),
    },
    coverage: { known: gaps.filter((g) => g.status === 'present').length, total: gaps.length || 1 },
  };
};

/* ------------------------------------------------------------------ calculation */

const calculate: Handler = async (c) => {
  const m = /(-?\d+(?:[.,]\d+)?)\s*([a-zA-Zµ°/²³·]+)\s+(?:to|in|into)\s+([a-zA-Zµ°/²³·]+)/.exec(c.query) ?? (/how many\s+([a-zA-Zµ°/²³·]+)\s+(?:in|are in)\s+(-?\d+(?:[.,]\d+)?)\s*([a-zA-Zµ°/²³·]+)/i.exec(c.query) ? (() => {
    const x = /how many\s+([a-zA-Zµ°/²³·]+)\s+(?:in|are in)\s+(-?\d+(?:[.,]\d+)?)\s*([a-zA-Zµ°/²³·]+)/i.exec(c.query)!;
    return [x[0], x[2], x[3], x[1]] as unknown as RegExpExecArray;
  })() : null);
  if (!m) return { title: 'Calculation', sections: { gaps: [gap('Write the conversion as “<value> <unit> to <unit>”, e.g. “1064 nm to µm”')] } };
  const v = parseFloat(m[1].replace(',', '.'));
  const from = m[2].replace(/^u(?=[mJsW])/, 'µ');
  const to = m[3].replace(/^u(?=[mJsW])/, 'µ');
  try {
    const out = convert(v, from, to);
    return { title: 'Unit-aware calculation', sections: { answer: [claim(`${fmtNum(v, 9)} ${from} = ${fmtNum(out, 9)} ${to}`, 'INFERRED', [engineRef('local-units', 'Unit engine', `${dimensionOf(from) ?? '?'} conversion`)])], basis: [claim('Deterministic conversion by the unit engine — no language model does arithmetic', 'VERIFIED', [engineRef('local-units', 'Unit engine')])] }, deterministic: 'Exact conversion by the unit engine' };
  } catch (e) {
    return { title: 'Calculation', sections: { gaps: [gap(e instanceof Error ? e.message : `Cannot convert ${from} to ${to}`, [engineRef('local-units', 'Unit engine')])] } };
  }
};

/* ------------------------------------------------------------------ cycle time / counterfactual */

const cycleTimeH: Handler = async (c) => {
  let sim = (c.subject?.entity === 'simulation' ? c.subject : c.mentions.find((m) => m.record.entity === 'simulation')?.record) as (AnyRecord & Simulation) | undefined;
  let guessed = false;
  if (!sim) {
    // closest scenario by wording — stated as an assumption, with the others offered
    const best = closestByName(c.query, c.deps.records, 'simulation');
    if (best[0] && best[0].score >= 1) {
      sim = best[0].record as AnyRecord & Simulation;
      guessed = true;
    }
  }
  if (!sim) {
    const sims = c.deps.records.filter((r) => r.entity === 'simulation').slice(0, 8);
    return { title: 'Cycle time & capacity', sections: { gaps: [gap('Open a Studio scenario (or name it) — cycle time comes from a scenario’s stations and components')], actions: sims.map((s) => ({ kind: 'ask' as const, label: s.name, query: `${c.query} in ${s.name}` })) } };
  }
  const res = resolveScenario(sim, c.deps.byId, c.deps.defs);
  const ct = cycleTime(res);
  if (!ct) return { title: `Cycle time — ${sim.name}`, sections: { gaps: res.blocking.slice(0, 6).map((b) => gap(`Missing input: ${b}`, [recRef(sim)])), answer: [claim('The scenario cannot be simulated until its missing inputs are entered.', 'UNKNOWN', [recRef(sim)])] } };
  const cap = capacity(sim, ct);
  const target = /(?:reach|achieve|get to|hit|target of?|to)\s*(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)\b/i.exec(c.query) ?? /(\d+(?:\.\d+)?)[- ]?(?:s|sec|second)s?\s*cycle/i.exec(c.query);
  const answer: Claim[] = [claim(`Cycle time ${fmtNum(ct.cycle, 4)} s (${ct.layout}); bottleneck ${ct.bottleneck.rs.station.name} at ${fmtNum(ct.bottleneck.effective, 4)} s; theoretical ${fmtNum(ct.theoreticalUph, 5)} UPH, practical ${fmtNum(ct.practicalUph, 5)} UPH (OEE ${fmtNum(ct.oee * 100, 3)} %).`, 'INFERRED', [recRef(sim), engineRef('local-sim', 'Capacity engine')])];
  const tables: AnswerTable[] = [{ title: 'Stations', columns: ['Station', 'Mean s', 'Parallel', 'Effective s', 'Utilisation'], rows: ct.loads.map((l) => ({ cells: [l.rs.station.name, fmtNum(l.mean, 4), String(l.rs.station.parallel ?? 1), fmtNum(l.effective, 4), `${fmtNum(l.utilization * 100, 3)} %`], cls: l === ct.bottleneck ? 'CONFLICTING' : 'INFERRED' })) }];
  const validation: Claim[] = [];
  if (target) {
    const T = parseFloat(target[1]);
    const over = ct.loads.filter((l) => (ct.layout === 'sequential' ? false : l.effective > T));
    const rows = ct.layout === 'sequential' ? [{ cells: ['Whole machine (sequential)', fmtNum(ct.throughputTime, 4), fmtNum(T, 4), `${fmtNum(Math.max(0, (1 - T / ct.throughputTime) * 100), 3)} % faster`, 'Reduce station times or change to an inline layout'] }] : over.map((l) => ({ cells: [l.rs.station.name, fmtNum(l.effective, 4), fmtNum(T, 4), `${fmtNum((1 - T / l.effective) * 100, 3)} % faster`, `or ${Math.ceil(l.mean / T - 1e-9)} parallel server(s) at the current time`] }));
    answer.push(claim(ct.cycle <= T ? `The modelled cycle (${fmtNum(ct.cycle, 4)} s) already meets ${T} s.` : `To reach ${T} s, ${ct.layout === 'sequential' ? 'the sequential throughput time' : `${over.length} station(s)`} must change — see the counterfactual table. Feasibility is not claimed.`, 'INFERRED', [recRef(sim), engineRef('local-sim', 'Counterfactual on the capacity model')]));
    tables.push({ title: `Counterfactual: what must change for ${T} s`, columns: ['Station', 'Now (s)', 'Target (s)', 'Required change', 'Alternative'], rows });
    validation.push(claim('Each required change is a hypothesis — confirm with process trials or motion calculations before committing', 'ASSUMED', [engineRef('local-sim', 'Capacity model')]));
  }
  const others = guessed ? c.deps.records.filter((r) => r.entity === 'simulation' && r.id !== sim!.id).slice(0, 5) : [];
  return {
    title: `Cycle time — ${sim.name}`,
    sections: {
      answer,
      tables,
      validation,
      assumptions: guessed ? [claim(`Scenario “${sim.name}” was chosen because its name matches your wording — pick another below if that is wrong`, 'ASSUMED', [recRef(sim)])] : [],
      gaps: cap.notes.filter((n) => /Not Available/.test(n)).map((n) => gap(n)),
      actions: [{ kind: 'open', label: 'Open the scenario in 3D', href: `/studio/${encodeURIComponent(sim.id)}?tab=machine3d` }, ...others.map((o) => ({ kind: 'ask' as const, label: `Use ${o.name}`, query: `${c.query} (scenario ${o.name})` }))],
    },
  };
};

/* ------------------------------------------------------------------ DOE & optimisation */

function factorsFromText(q: string): DoeFactor[] {
  const out: DoeFactor[] = [];
  const re = /([a-zA-Z][a-zA-Z ]{1,30}?)\s*(?:of|from|between|:|=)?\s*(\d+(?:\.\d+)?)\s*(?:-|to|–|and)\s*(\d+(?:\.\d+)?)\s*(W|kW|mm\/s|m\/s|kHz|Hz|ns|ps|µm|um|mm|%|s|J\/cm²)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(q.replace(/[–—]/g, '-')))) {
    const name = m[1]
      .trim()
      .split(/\s+/)
      .filter((w) => !/^(for|with|and|doe|plan|a|an|the|of|from|between|over|at|in|on|design|experiments?)$/i.test(w))
      .slice(-3)
      .join(' ');
    const lo = parseFloat(m[2]);
    const hi = parseFloat(m[3]);
    if (!name || !(hi > lo)) continue;
    out.push({ name: name.replace(/^\w/, (x) => x.toUpperCase()), unit: m[4]?.replace(/^u/, 'µ'), low: lo, high: hi });
  }
  return out;
}

function factorsFromDoe(d: Doe): DoeFactor[] {
  return (d.factors ?? []).filter((f) => f.levels.some((l) => typeof l === 'number')).map((f) => {
    const nums = f.levels.filter((l): l is number => typeof l === 'number');
    return { name: f.name, unit: f.unit, low: Math.min(...nums), high: Math.max(...nums), levels: nums };
  });
}

const doeH: Handler = async (c) => {
  const kind: DesignKind = /fraction/i.test(c.query) ? 'fractional_factorial' : /latin|lhs|space[- ]filling/i.test(c.query) ? 'latin_hypercube' : /ccd|central composite|response surface|rsm/i.test(c.query) ? 'central_composite' : 'full_factorial';
  const doeRec = (c.subject?.entity === 'doe' ? c.subject : c.mentions.find((m) => m.record.entity === 'doe')?.record) as (AnyRecord & Doe) | undefined;
  const factors = factorsFromText(c.query);
  const fs = factors.length ? factors : doeRec ? factorsFromDoe(doeRec) : [];
  if (!fs.length) return { title: 'Design of experiments', sections: { gaps: [gap('State the factors with ranges — e.g. “DOE for power 20–50 W, speed 500–2000 mm/s, frequency 20–200 kHz” — or open a DOE record')] } };
  const plan = design(kind, fs, { seed: 1 });
  return {
    title: `${plan.label}`,
    sections: {
      answer: [claim(`${plan.kind.replace(/_/g, ' ')} plan with ${plan.runs.length} runs over ${fs.map((f) => `${f.name} ${f.low}–${f.high}${f.unit ? ` ${f.unit}` : ''}`).join(', ')}. This is a plan — it contains no results.`, 'INFERRED', [engineRef('local-doe', 'DOE designer'), ...(doeRec && !factors.length ? [recRef(doeRec, 'factors')] : [])])],
      basis: plan.notes.map((n) => claim(n, 'INFERRED', [engineRef('local-doe', 'DOE designer')])),
      tables: [{ title: plan.label, columns: ['Run', ...fs.map((f) => `${f.name}${f.unit ? ` (${f.unit})` : ''}`), 'Point'], rows: plan.runs.map((r) => ({ cells: [String(r.run), ...fs.map((f) => String(r.settings[f.name])), r.kind ?? '—'] })) }],
      assumptions: factors.length ? [claim('Factor ranges are the ones you stated — confirm they are within the laser, scanner and material limits', 'ASSUMED', [userRef(c.query)])] : [],
      validation: [claim('Record every measured response against the run number; only measured results may train a model', 'ASSUMED', [engineRef('local-doe', 'Data flywheel rule')])],
    },
    deterministic: 'Deterministic, seeded design — the plan is exact for the stated factors (it predicts nothing)',
  };
};

const optimizeH: Handler = async (c) => {
  const doeRec = (c.subject?.entity === 'doe' ? c.subject : c.mentions.find((m) => m.record.entity === 'doe')?.record ?? c.deps.records.find((r) => r.entity === 'doe')) as (AnyRecord & Doe) | undefined;
  if (!doeRec) return { title: 'Process optimisation', sections: { gaps: [gap('No DOE record — run a DOE first; Bayesian optimisation needs measured runs')] } };
  const fs = factorsFromDoe(doeRec);
  const resp = (doeRec.responses ?? [])[0];
  const obs: Observation[] = resp ? (doeRec.runs ?? []).filter((r) => typeof r.results?.[resp.name] === 'number').map((r) => ({ x: Object.fromEntries(Object.entries(r.settings).filter(([, v]) => typeof v === 'number')) as Record<string, number>, y: r.results[resp.name] as number })) : [];
  const goal = resp && /defect|haz|rough|residual|kerf|time|spatter|crack/i.test(resp.name) ? 'min' : 'max';
  const res = suggestNext(fs, obs, goal);
  const state = engineStates(c.deps.readiness).find((s) => s.model.id === 'local-bayesopt');
  if (res.status !== 'OK') {
    const plan = fs.length ? design(fs.length >= 3 ? 'fractional_factorial' : 'full_factorial', fs) : null;
    return {
      title: 'Process optimisation — DATA REQUIRED',
      sections: {
        answer: [claim(`${res.message}`, 'UNKNOWN', [recRef(doeRec, 'runs'), engineRef('local-bayesopt', 'Bayesian optimisation')])],
        basis: state ? [claim(`Engine status: ${state.status} — ${state.reason}`, 'VERIFIED', [engineRef('local-bayesopt', 'Model registry')])] : [],
        tables: plan ? [{ title: `Proposed instead: ${plan.label}`, columns: ['Run', ...fs.map((f) => f.name)], rows: plan.runs.map((r) => ({ cells: [String(r.run), ...fs.map((f) => String(r.settings[f.name]))] })) }] : [],
        gaps: [gap(`${doeRec.name}: ${obs.length} measured run(s) for “${resp?.name ?? 'response'}”`, [recRef(doeRec)])],
      },
    };
  }
  return {
    title: `Next experiment — ${doeRec.name}`,
    sections: {
      answer: [claim(`Suggested next run (${goal === 'max' ? 'maximise' : 'minimise'} ${resp!.name}): ${Object.entries(res.next).map(([k, v]) => `${k} ${v}`).join(', ')}. Posterior ${fmtNum(res.mean, 4)} ± ${fmtNum(res.sd, 3)} (1σ) from ${res.n} measured runs — a run to perform, not a promised result.`, 'ESTIMATED', [recRef(doeRec, 'runs'), engineRef('local-bayesopt', 'GP + expected improvement')])],
      basis: res.notes.map((n) => claim(n, 'INFERRED', [engineRef('local-bayesopt', 'Bayesian optimisation')])),
      validation: [claim('Measure the suggested run and add it to the DOE record before the next suggestion', 'ASSUMED', [engineRef('local-bayesopt', 'Active learning loop')])],
    },
    modelUncertainty: res.relSd,
  };
};

/* ------------------------------------------------------------------ models that need data (predict / forecast / maintenance / vision) */

const MODEL_FOR: Partial<Record<Intent, string>> = { predict: 'ml-process-quality', forecast: 'ml-forecast', maintenance: 'ml-anomaly', vision: 'gw-vision' };

const modelGated: Handler = async (c) => {
  const id = MODEL_FOR[c.ir.intent]!;
  const st = c.deps.states.find((s) => s.model.id === id) ?? engineStates(c.deps.readiness).find((s) => s.model.id === id)!;
  const m = MODEL_BY_ID.get(id)!;
  const r = await c.retrieve(c.ir.intent === 'maintenance' ? `${c.query} troubleshooting root cause` : c.query, { knowledge: true });
  const rc = retrievalClaims(r);
  return {
    title: `${m.label} — ${st.status === 'ONLINE' ? 'online' : m.featureState}`,
    sections: {
      answer: [claim(`No prediction is made: the ${m.label.toLowerCase()} is ${st.status} (${st.reason}).${m.fallbackModel ? ` Fallback: ${MODEL_BY_ID.get(m.fallbackModel)?.label}.` : ''}`, 'VERIFIED', [engineRef(id, `${m.label} (model registry)`)]), ...rc.answer],
      basis: [claim(m.description, 'VERIFIED', [engineRef(id, 'Model registry')])],
      evidence: rc.evidence,
      tables: [rc.table],
      gaps: st.data ? [gap(`Data required: ${st.data.have} of ${st.data.need} ${st.data.unit} (${st.data.description})`, [engineRef(id, 'Data readiness')])] : [gap(`${m.label} needs the secure AI gateway, which is not configured`)],
      validation: c.ir.intent === 'maintenance' ? [claim('Handbook causes are candidates to check — correlation is not confirmed causation; run the diagnostic tests', 'ASSUMED', [engineRef('local-bm25', 'Handbook retrieval')])] : [],
      actions: c.ir.intent === 'predict' ? [{ kind: 'ask', label: 'Plan a DOE instead', query: 'DOE for power 20-50 W, speed 500-2000 mm/s' }] : [],
    },
    agreement: r.hybrid?.agreement ?? null,
  };
};

/* ------------------------------------------------------------------ open 3D */

const open3d: Handler = async (c) => {
  const named = closestByName(c.query, c.deps.records, 'simulation')[0];
  const sim = (c.subject?.entity === 'simulation' ? c.subject : (c.mentions.find((m) => m.record.entity === 'simulation')?.record ?? (named && named.score >= 1 ? named.record : undefined))) as (AnyRecord & Simulation) | undefined;
  if (sim) return { title: `3D — ${sim.name}`, sections: { answer: [fromRecord(`Open the conceptual 3D model of ${sim.name}`, sim)], actions: [{ kind: 'open', label: 'Open in 3D', href: `/studio/${encodeURIComponent(sim.id)}?tab=machine3d` }] } };
  const cfg = configure(c.query, { records: c.deps.records, engine: null, lexicon: c.deps.lexicon, compat: c.deps.compat, newId: c.deps.newId });
  return {
    title: 'Open in 3D',
    sections: {
      answer: cfg.templates.length ? [claim(`Equipment templates that fit: ${cfg.templates.map((t) => `${t.template.name} (${t.why.join(', ')})`).join('; ')}. A scenario created from one previews as a labelled sequence until station times are entered.`, 'INFERRED', cfg.templates.map((t) => recRef(t.template)))] : [gap('No equipment template matches — name the process (marking, welding, …) or open a scenario')],
      actions: cfg.templates.map((t) => ({ kind: 'open3d' as const, label: `Create 3D scenario: ${t.template.name}`, templateId: t.template.id, uph: typeof cfg.req.throughput.value === 'number' ? cfg.req.throughput.value : null })),
    },
  };
};

export const HANDLERS: Record<Intent, Handler> = {
  explain: search,
  search,
  find_parts: findParts,
  compare,
  alternatives,
  compatibility,
  configure: configureH,
  laser_selection: configureH,
  bom: configureH,
  cost: configureH,
  rfq: configureH,
  urs: configureH,
  fmea: configureH,
  supplier,
  supply_risk: supplyRisk,
  change_impact: changeImpactH,
  traceability,
  project_status: projectStatus,
  calculate,
  cycle_time: cycleTimeH,
  doe: doeH,
  optimize_process: optimizeH,
  predict: modelGated,
  forecast: modelGated,
  maintenance: modelGated,
  vision: modelGated,
  open_3d: open3d,
};
