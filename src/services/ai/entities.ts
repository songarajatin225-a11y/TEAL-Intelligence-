import type { AnyRecord } from '../../domain';
import { normaliseName } from '../duplicates';

/*
 * ENTITY RESOLUTION (AI master prompt §17). Maps a mention ("IPG Photonics Corporation", "DL-MOPA-20",
 * "the 20 W MOPA") to records: exact identifier → exact normalised name → curated alias → fuzzy
 * (Jaro-Winkler on normalised names). Fuzzy matches are flagged for human verification and never
 * merge or create records.
 */

export type ResolveMethod = 'exact-identifier' | 'exact-name' | 'alias' | 'fuzzy';
export interface Resolution {
  record: AnyRecord;
  method: ResolveMethod;
  score: number;
  matched: string;
  needsVerification: boolean;
}

/** Curated alias → canonical normalised name (add entries as records are curated). */
export const ALIASES: Record<string, string> = {
  ipg: 'ipg photonics',
  'ipg photonics corporation': 'ipg photonics',
  trumpf: 'trumpf',
  'trumpf gmbh co kg': 'trumpf',
  coherent: 'coherent',
  'coherent corp': 'coherent',
  scanlab: 'scanlab',
  'scanlab gmbh': 'scanlab',
  raycus: 'raycus',
  'wuhan raycus': 'raycus',
  jpt: 'jpt',
  'jpt opto electronics': 'jpt',
  keyence: 'keyence',
  cognex: 'cognex',
  siemens: 'siemens',
  beckhoff: 'beckhoff',
};

const RESOLVABLE = new Set(['part', 'company', 'supplier', 'product', 'laser_source', 'material', 'application', 'optic', 'module', 'component', 'project', 'customer', 'simulation', 'opportunity', 'industry', 'technology', 'equipment_template', 'poc', 'doe', 'recipe']);

export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const range = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const am = new Array<boolean>(a.length).fill(false);
  const bm = new Array<boolean>(b.length).fill(false);
  let m = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = Math.max(0, i - range); j < Math.min(b.length, i + range + 1); j++) {
      if (bm[j] || a[i] !== b[j]) continue;
      am[i] = bm[j] = true;
      m++;
      break;
    }
  }
  if (!m) return 0;
  let t = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!am[i]) continue;
    while (!bm[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const jaro = (m / a.length + m / b.length + (m - t / 2) / m) / 3;
  let p = 0;
  while (p < Math.min(4, a.length, b.length) && a[p] === b[p]) p++;
  return jaro + p * 0.1 * (1 - jaro);
}

interface NameEntry {
  record: AnyRecord;
  names: string[];
  idents: string[];
}

const cache = new WeakMap<AnyRecord[], NameEntry[]>();
function nameIndex(records: AnyRecord[]): NameEntry[] {
  let idx = cache.get(records);
  if (!idx) {
    idx = records
      .filter((r) => RESOLVABLE.has(r.entity))
      .map((r) => {
        const x = r as unknown as Record<string, unknown>;
        const idents = ['model_number', 'code', 'designation', 'short_code'].map((f) => x[f]).filter((v): v is string => typeof v === 'string' && v.length >= 3).map((v) => v.toLowerCase());
        const names = [normaliseName(r.name), ...(typeof x.brand === 'string' ? [normaliseName(`${x.brand} ${x.model_number ?? ''}`)] : [])].filter((n) => n.length >= 3);
        return { record: r, names, idents };
      });
    cache.set(records, idx);
  }
  return idx;
}

/** Resolve one name (e.g. a manufacturer typed in a form) to ranked candidate records. */
export function resolveName(name: string, records: AnyRecord[], opts: { entities?: string[]; min?: number } = {}): Resolution[] {
  const n = normaliseName(name);
  if (!n) return [];
  const canon = ALIASES[n];
  const out: Resolution[] = [];
  for (const e of nameIndex(records)) {
    if (opts.entities && !opts.entities.includes(e.record.entity)) continue;
    if (e.idents.includes(name.trim().toLowerCase())) {
      out.push({ record: e.record, method: 'exact-identifier', score: 1, matched: name, needsVerification: false });
      continue;
    }
    if (e.names.includes(n)) {
      out.push({ record: e.record, method: 'exact-name', score: 0.97, matched: n, needsVerification: false });
      continue;
    }
    if (canon && e.names.some((x) => x === canon || x.startsWith(`${canon} `))) {
      out.push({ record: e.record, method: 'alias', score: 0.93, matched: `${n} → ${canon}`, needsVerification: false });
      continue;
    }
    const best = Math.max(0, ...e.names.map((x) => jaroWinkler(n, x)));
    if (best >= (opts.min ?? 0.9)) out.push({ record: e.record, method: 'fuzzy', score: best, matched: n, needsVerification: true });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 8);
}

const NAME_STOP = /^(what|which|the|a|an|of|and|for|to|in|is|are|it|this|that|must|should|would|change|reach|time|cycle|how|can|we|i|do|does|with|s|sec|seconds?|\d+(\.\d+)?)$/i;
const stem = (t: string) => (t.length > 5 ? t.slice(0, t.length - 2) : t);

/**
 * Closest record of one entity by wording ("the laser marker" → sim-demo-laser-marker): stem overlap
 * with the name and id. Returns the ranking so callers can state the choice as an assumption and
 * offer the runners-up — it never silently picks when nothing overlaps.
 */
export function closestByName(query: string, records: AnyRecord[], entity: string): { record: AnyRecord; score: number }[] {
  const toks = query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !NAME_STOP.test(t));
  if (!toks.length) return [];
  return records
    .filter((r) => r.entity === entity)
    .map((r) => {
      const hay = `${r.name} ${r.id}`.toLowerCase();
      const score = toks.reduce((s, t) => s + (new RegExp(`(^|[^a-z0-9])${t}($|[^a-z0-9])`).test(hay) ? 1 : hay.includes(stem(t)) ? 0.6 : 0), 0);
      return { record: r, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** Records a free-text question mentions by identifier or full name (longest mentions win). */
export function findMentions(query: string, records: AnyRecord[], entities?: string[]): Resolution[] {
  const q = query.toLowerCase();
  const nq = ` ${normaliseName(query)} `;
  const out: Resolution[] = [];
  for (const e of nameIndex(records)) {
    if (entities && !entities.includes(e.record.entity)) continue;
    const id = e.idents.find((i) => new RegExp(`(^|[^a-z0-9])${i.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`).test(q));
    if (id) {
      out.push({ record: e.record, method: 'exact-identifier', score: 1, matched: id, needsVerification: false });
      continue;
    }
    const nm = e.names.find((x) => x.length >= 6 && nq.includes(` ${x} `));
    if (nm) out.push({ record: e.record, method: 'exact-name', score: 0.9 + Math.min(0.09, nm.length / 1000), matched: nm, needsVerification: false });
  }
  // drop mentions contained in a longer mention
  const sorted = out.sort((a, b) => b.matched.length - a.matched.length || b.score - a.score);
  const kept: Resolution[] = [];
  for (const r of sorted) if (!kept.some((k) => k.matched.includes(r.matched) && k.matched !== r.matched)) kept.push(r);
  return kept.slice(0, 6);
}
