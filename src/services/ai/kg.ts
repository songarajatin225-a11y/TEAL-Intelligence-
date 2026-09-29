import type { AnyRecord } from '../../domain';
import type { Part, Simulation } from '../../domain/engineering';
import { checkPair, COMPAT_LABEL, type CompatCtx } from '../eng/compatibility';
import { readSpec, type SpecDefs } from '../eng/specs';
import { neighbours, type Graph } from '../graph';
import { latestPrice } from '../sim/supply';

/*
 * INDUSTRIAL KNOWLEDGE GRAPH (AI master prompt §15, §16, §37). A typed view over the digital-thread
 * graph: every record is a node of an engineering class, every reference field an edge. Derived edges
 * (never stored) are marked `derived` and treated as INFERRED. GraphRAG walks multi-hop paths from
 * retrieved seeds to the classes a question needs; change impact walks dependencies of a component.
 */

export type KgClass =
  | 'Company'
  | 'Supplier'
  | 'Component'
  | 'Laser Source'
  | 'Laser Type'
  | 'Optics'
  | 'Galvo'
  | 'F-Theta'
  | 'Motion'
  | 'Servo'
  | 'PLC'
  | 'HMI'
  | 'Vision'
  | 'Camera'
  | 'Sensor'
  | 'Chiller'
  | 'Safety'
  | 'Material'
  | 'Process'
  | 'Application'
  | 'Industry'
  | 'Product'
  | 'Machine'
  | 'Specification'
  | 'Cost'
  | 'Document'
  | 'Project'
  | 'Customer'
  | 'Experiment'
  | 'Requirement'
  | 'Risk'
  | 'Decision'
  | 'Module'
  | 'Technology'
  | 'Other';

const PART_CLASS: Record<string, KgClass> = {
  laser_source: 'Laser Source',
  laser_module: 'Laser Source',
  galvo: 'Galvo',
  galvo_controller: 'Galvo',
  f_theta: 'F-Theta',
  beam_expander: 'Optics',
  telecentric_lens: 'Optics',
  linear_stage: 'Motion',
  ball_screw_stage: 'Motion',
  robot: 'Motion',
  gripper: 'Motion',
  conveyor: 'Motion',
  servo_motor: 'Servo',
  servo_drive: 'Servo',
  plc: 'PLC',
  ipc: 'PLC',
  hmi: 'HMI',
  camera: 'Camera',
  vision_lens: 'Vision',
  lighting: 'Vision',
  vision_controller: 'Vision',
  chiller: 'Chiller',
  safety_plc: 'Safety',
  light_curtain: 'Safety',
  door_switch: 'Safety',
};

const ENTITY_CLASS: Record<string, KgClass> = {
  company: 'Company',
  supplier: 'Supplier',
  component: 'Component',
  laser_source: 'Laser Type',
  optic: 'Optics',
  material: 'Material',
  recipe: 'Process',
  application: 'Application',
  industry: 'Industry',
  product: 'Product',
  product_family: 'Product',
  configuration: 'Machine',
  simulation: 'Machine',
  equipment_template: 'Machine',
  spec_definition: 'Specification',
  cost_model: 'Cost',
  bom: 'Cost',
  source: 'Document',
  evidence: 'Document',
  reference: 'Document',
  article: 'Document',
  standard: 'Document',
  project: 'Project',
  customer: 'Customer',
  doe: 'Experiment',
  poc: 'Experiment',
  verification: 'Experiment',
  requirement: 'Requirement',
  risk: 'Risk',
  decision: 'Decision',
  module: 'Module',
  technology: 'Technology',
};

export function kgClass(r: AnyRecord): KgClass {
  if (r.entity === 'part') return PART_CLASS[(r as unknown as Part).product_type] ?? 'Component';
  return ENTITY_CLASS[r.entity] ?? 'Other';
}

const REL_TEXT: Record<string, [string, string]> = {
  manufactures: ['is manufactured by', 'manufactures'],
  uses: ['uses', 'is used by'],
  applies_to: ['applies to', 'is applied in'],
  compatible_with: ['is compatible with', 'is compatible with'],
  supplied_by: ['is supplied by', 'supplies'],
  belongs_to: ['belongs to', 'has'],
  built_from: ['is built from', 'is part of'],
  tested_by: ['is tested by', 'tests'],
  requires: ['requires', 'is required by'],
  validated_by: ['is validated by', 'validates'],
  evidence_for: ['is evidence for', 'is evidenced by'],
  derived_from: ['is derived from', 'is the source of'],
  similar_to: ['is similar to', 'is similar to'],
  references: ['references', 'is referenced by'],
  matches_technology: ['matches the technology of', 'is the technology of'],
};
export const relText = (rel: string, dir: 'out' | 'in') => (REL_TEXT[rel] ?? [rel.replace(/_/g, ' '), `is ${rel.replace(/_/g, ' ')} of`])[dir === 'out' ? 0 : 1];

export interface KgEdge {
  from: string;
  to: string;
  rel: string;
  derived: boolean;
}

/** Derived (INFERRED) edges: engineering-DB laser parts ↔ laser technology classes by shared technology. */
export function derivedEdges(records: AnyRecord[]): KgEdge[] {
  const classes = records.filter((r) => r.entity === 'laser_source') as (AnyRecord & { categories?: string[] })[];
  const out: KgEdge[] = [];
  for (const p of records.filter((r) => r.entity === 'part') as (AnyRecord & Part)[]) {
    if (p.product_type !== 'laser_source' && p.product_type !== 'laser_module') continue;
    const tech = new Set((p.technologies ?? []).map((t) => t.toLowerCase()));
    if (!tech.size) continue;
    // the most specific class sharing the most technologies
    let best: { id: string; n: number; size: number } | null = null;
    for (const c of classes) {
      const cats = (c.categories ?? []).map((x) => x.toLowerCase());
      const n = cats.filter((x) => tech.has(x)).length;
      if (n && (!best || n > best.n || (n === best.n && cats.length < best.size))) best = { id: c.id, n, size: cats.length };
    }
    if (best) out.push({ from: p.id, to: best.id, rel: 'matches_technology', derived: true });
  }
  return out;
}

export interface KgStep {
  id: string;
  name: string;
  entity: string;
  cls: KgClass;
  /** relation text from the previous node to this one */
  via?: string;
  derived?: boolean;
}
export type KgPath = KgStep[];

interface Adj {
  to: string;
  rel: string;
  dir: 'out' | 'in';
  derived: boolean;
}

function adjacency(g: Graph, derived: KgEdge[]): (id: string) => Adj[] {
  const dOut = new Map<string, KgEdge[]>();
  const dIn = new Map<string, KgEdge[]>();
  for (const e of derived) {
    (dOut.get(e.from) ?? dOut.set(e.from, []).get(e.from)!).push(e);
    (dIn.get(e.to) ?? dIn.set(e.to, []).get(e.to)!).push(e);
  }
  return (id) => [
    ...neighbours(g, id).map((n) => ({ to: n.record.id, rel: n.rel, dir: n.direction, derived: false })),
    ...(dOut.get(id) ?? []).map((e) => ({ to: e.to, rel: e.rel, dir: 'out' as const, derived: true })),
    ...(dIn.get(id) ?? []).map((e) => ({ to: e.from, rel: e.rel, dir: 'in' as const, derived: true })),
  ];
}

const NO_TRANSIT = new Set(['source', 'evidence', 'vocabulary', 'spec_definition', 'gate_definition', 'formula', 'industry']);

/**
 * GraphRAG: breadth-first multi-hop paths from seed nodes to nodes of the target classes. Documents,
 * vocabularies and hub nodes are never used as stepping stones (they would connect everything).
 */
export function graphPaths(g: Graph, seeds: string[], targets: KgClass[], opts: { maxHops?: number; limit?: number; derived?: KgEdge[] } = {}): KgPath[] {
  const maxHops = opts.maxHops ?? 4;
  const limit = opts.limit ?? 12;
  const adj = adjacency(g, opts.derived ?? []);
  const want = new Set(targets);
  const out: KgPath[] = [];
  const reached = new Set<string>();
  for (const seed of seeds) {
    const s = g.byId.get(seed);
    if (!s) continue;
    const prev = new Map<string, { from: string; rel: string; dir: 'out' | 'in'; derived: boolean } | null>([[seed, null]]);
    let frontier = [seed];
    for (let d = 0; d < maxHops && frontier.length; d++) {
      const next: string[] = [];
      for (const id of frontier) {
        const r = g.byId.get(id);
        if (!r || (id !== seed && NO_TRANSIT.has(r.entity))) continue;
        for (const a of adj(id)) {
          if (prev.has(a.to)) continue;
          const t = g.byId.get(a.to);
          if (!t) continue;
          prev.set(a.to, { from: id, rel: a.rel, dir: a.dir, derived: a.derived });
          next.push(a.to);
          if (want.has(kgClass(t)) && !reached.has(a.to)) {
            reached.add(a.to);
            const path: KgPath = [];
            let cur: string | undefined = a.to;
            while (cur) {
              const rec = g.byId.get(cur)!;
              const p = prev.get(cur);
              path.unshift({ id: rec.id, name: rec.name, entity: rec.entity, cls: kgClass(rec), via: p ? relText(p.rel, p.dir) : undefined, derived: p?.derived });
              cur = p?.from;
            }
            out.push(path);
          }
        }
      }
      frontier = next;
    }
  }
  return out.sort((a, b) => a.length - b.length).slice(0, limit);
}

export const pathText = (p: KgPath) => p.map((s, i) => (i ? `${s.via} ${s.name}` : s.name)).join(' → ');

/* ------------------------------------------------------------------ change impact (§37) */

export type ImpactDomain = 'Optics' | 'Galvo / scanner' | 'Electrical / power supply' | 'Cooling' | 'Control interface / PLC' | 'Software' | 'Mechanical' | 'Safety' | 'Process parameters' | 'BOM' | 'Cost' | 'Lead time' | 'Qualification' | 'Documentation';

const CATEGORY_DOMAIN: Record<string, ImpactDomain> = {
  Optical: 'Optics',
  Beam: 'Optics',
  Scan: 'Galvo / scanner',
  Power: 'Electrical / power supply',
  Electrical: 'Electrical / power supply',
  Thermal: 'Cooling',
  Fluid: 'Cooling',
  'I/O': 'Control interface / PLC',
  Compute: 'Control interface / PLC',
  Mechanical: 'Mechanical',
  Physical: 'Mechanical',
  Safety: 'Safety',
  Pulse: 'Process parameters',
  Process: 'Process parameters',
  Stability: 'Process parameters',
};

export interface SpecDelta {
  spec: string;
  name: string;
  category: string;
  from: string;
  to: string;
}

export interface ImpactRow {
  domain: ImpactDomain;
  status: 'Affected' | 'Check' | 'No change recorded' | 'Unknown';
  reasons: string[];
  ids: string[];
}

export interface ChangeImpact {
  from: AnyRecord & Part;
  to: (AnyRecord & Part) | null;
  deltas: SpecDelta[];
  scenarios: { sim: AnyRecord & Simulation; station: string; checks: { other: AnyRecord & Part; before: string; after: string }[] }[];
  rows: ImpactRow[];
  review: AnyRecord[];
  assumptions: string[];
}

const fmt = (s: ReturnType<typeof readSpec>) => (!s ? 'Not Available' : s.min != null && s.max != null ? `${s.min}–${s.max} ${s.unit}` : s.value != null ? `${s.value} ${s.unit}` : 'Not Available');

export function changeImpact(fromId: string, toId: string | null, g: Graph, records: AnyRecord[], ctx: CompatCtx, defs: SpecDefs): ChangeImpact | null {
  const from = g.byId.get(fromId) as (AnyRecord & Part) | undefined;
  if (!from || from.entity !== 'part') return null;
  const to = toId ? ((g.byId.get(toId) as (AnyRecord & Part) | undefined) ?? null) : null;

  // 1. specification differences, grouped into engineering domains
  const deltas: SpecDelta[] = [];
  if (to) {
    const keys = new Set([...(from.specs ?? []).map((s) => s.spec), ...(to.specs ?? []).map((s) => s.spec)]);
    for (const k of keys) {
      const a = readSpec(from, k, defs);
      const b = readSpec(to, k, defs);
      const fa = fmt(a);
      const fb = fmt(b);
      if (fa !== fb) deltas.push({ spec: k, name: defs.get(k)?.name ?? k, category: defs.get(k)?.category ?? 'Other', from: fa, to: fb });
    }
    const ca = (from.interfaces?.communication ?? []).join(', ') || 'Not Available';
    const cb = (to.interfaces?.communication ?? []).join(', ') || 'Not Available';
    if (ca !== cb) deltas.push({ spec: 'communication', name: 'Communication interfaces', category: 'I/O', from: ca, to: cb });
  }

  // 2. scenarios that select the component: re-check compatibility with the station neighbours
  const sims = records.filter((r) => r.entity === 'simulation') as (AnyRecord & Simulation)[];
  const scenarios: ChangeImpact['scenarios'] = [];
  for (const sim of sims) {
    const sel = sim.selections ?? [];
    for (const s of sel.filter((x) => x.part_id === from.id)) {
      const others = sel.filter((x) => x.part_id !== from.id && (x.station_key === s.station_key || x.station_key === '_machine' || s.station_key === '_machine')).map((x) => g.byId.get(x.part_id) as (AnyRecord & Part) | undefined).filter((x): x is AnyRecord & Part => !!x);
      const checks = [...new Map(others.map((o) => [o.id, o])).values()].map((other) => {
        const before = checkPair(from, other, ctx);
        const after = to ? checkPair(to, other, ctx) : null;
        return { other, before: COMPAT_LABEL[before.relationship], after: after ? COMPAT_LABEL[after.relationship] : '—' };
      }).filter((c) => c.before !== 'Unknown' || c.after !== 'Unknown');
      scenarios.push({ sim, station: sim.stations.find((st) => st.key === s.station_key)?.name ?? s.station_key, checks });
    }
  }

  // 3. records within two links (BOMs, requirements, verifications, projects, documents) — to review
  const review = new Map<string, AnyRecord>();
  for (const n of neighbours(g, from.id)) {
    if (['source', 'company'].includes(n.record.entity)) continue;
    review.set(n.record.id, n.record);
    for (const m of neighbours(g, n.record.id)) if (['requirement', 'verification', 'project', 'bom', 'cost_model', 'poc', 'recipe'].includes(m.record.entity)) review.set(m.record.id, m.record);
  }
  for (const sc of scenarios) review.set(sc.sim.id, sc.sim);

  // 4. domain rows
  const rows = new Map<ImpactDomain, ImpactRow>();
  const row = (d: ImpactDomain) => rows.get(d) ?? rows.set(d, { domain: d, status: 'No change recorded', reasons: [], ids: [] }).get(d)!;
  const ALL: ImpactDomain[] = ['Optics', 'Galvo / scanner', 'Electrical / power supply', 'Cooling', 'Control interface / PLC', 'Software', 'Mechanical', 'Safety', 'Process parameters', 'BOM', 'Cost', 'Lead time', 'Qualification', 'Documentation'];
  ALL.forEach(row);
  for (const dl of deltas) {
    const d = CATEGORY_DOMAIN[dl.category];
    if (!d) continue;
    const r = row(d);
    r.status = dl.from === 'Not Available' || dl.to === 'Not Available' ? (r.status === 'Affected' ? 'Affected' : 'Unknown') : 'Affected';
    r.reasons.push(`${dl.name}: ${dl.from} → ${dl.to}`);
  }
  for (const sc of scenarios) {
    for (const c of sc.checks) {
      if (c.before === c.after) continue;
      const cls = kgClass(c.other);
      const d: ImpactDomain = cls === 'Galvo' ? 'Galvo / scanner' : cls === 'F-Theta' || cls === 'Optics' ? 'Optics' : cls === 'Chiller' ? 'Cooling' : cls === 'PLC' || cls === 'HMI' ? 'Control interface / PLC' : cls === 'Safety' ? 'Safety' : cls === 'Servo' || cls === 'Motion' ? 'Mechanical' : 'Electrical / power supply';
      const r = row(d);
      r.status = /Incompatible|Unknown/.test(c.after) ? 'Affected' : r.status === 'No change recorded' ? 'Check' : r.status;
      r.reasons.push(`${sc.sim.name} · ${sc.station}: with ${c.other.model_number} ${c.before} → ${c.after}`);
      r.ids.push(c.other.id);
    }
  }
  if (to) {
    const bom = row('BOM');
    bom.status = 'Affected';
    bom.reasons.push(`Replace ${from.model_number} with ${to.model_number} in ${scenarios.length} scenario selection(s) and any BOM that lists it`);
    const pa = latestPrice(from);
    const pb = latestPrice(to);
    const cost = row('Cost');
    if (pa && pb && pa.currency === pb.currency) {
      cost.status = 'Affected';
      cost.reasons.push(`${pa.price} → ${pb.price} ${pa.currency} (${pa.basis} → ${pb.basis})`);
    } else {
      cost.status = 'Unknown';
      cost.reasons.push(!pa || !pb ? 'Price not recorded for one of the parts' : `Currencies differ (${pa.currency} vs ${pb.currency}) — not converted without a recorded rate`);
    }
    const lt = row('Lead time');
    const la = pa?.lead_time_weeks;
    const lb = pb?.lead_time_weeks;
    if (la != null && lb != null) {
      lt.status = la === lb ? 'No change recorded' : 'Affected';
      lt.reasons.push(`${la} → ${lb} weeks`);
    } else {
      lt.status = 'Unknown';
      lt.reasons.push('Lead time not recorded for one of the parts');
    }
    const sw = row('Software');
    if (JSON.stringify(from.interfaces?.software ?? []) !== JSON.stringify(to.interfaces?.software ?? [])) {
      sw.status = 'Check';
      sw.reasons.push(`Software interfaces: ${(from.interfaces?.software ?? []).join(', ') || 'Not Available'} → ${(to.interfaces?.software ?? []).join(', ') || 'Not Available'}`);
    }
  }
  const q = row('Qualification');
  const quals = [...review.values()].filter((r) => r.entity === 'verification' || r.entity === 'poc');
  q.status = to ? 'Affected' : 'Check';
  q.reasons.push(quals.length ? `${quals.length} verification / POC record(s) reference this thread — re-verify with the new part` : 'No verification recorded — qualification of the new part is required before release');
  const docs = row('Documentation');
  if ((from.documents ?? []).length || to) {
    docs.status = 'Check';
    docs.reasons.push('Update datasheet references, wiring and BOM documents');
  }

  return {
    from,
    to,
    deltas,
    scenarios,
    rows: [...rows.values()],
    review: [...review.values()],
    assumptions: [
      'Impact is traced through recorded references, specifications and compatibility rules only — a physical change can have effects no record describes',
      'A specification missing on either part is reported as Unknown, never as unchanged',
      'Compatibility after the change is rule-based (Engineering compatible) unless a relationship is recorded',
    ],
  };
}
