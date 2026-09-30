import type { AnyRecord } from '../../../domain';
import type { Part } from '../../../domain/engineering';
import type { LaserSource } from '../../../domain/entities';
import { readSpec, type SpecDefs } from '../../eng/specs';
import type { ParsedPartQuery } from '../../eng/partSearch';
import { neighbours, type Graph } from '../../graph';
import type { ParsedParams } from '../../parametric';
import type { Intent } from '../types';
import type { HybridHit } from './hybrid';

/*
 * TECHNICAL RERANKER (AI master prompt §14). Semantic closeness is not technical relevance: a 20 W
 * source is not relevant to "50 W MOPA" however similar the words are. The reranker scores each fused
 * candidate on explicit features and records every contribution, so each position can be explained.
 * A learned cross-encoder can replace it behind the gateway; the feature reasons stay as a check.
 */

export interface RankedHit extends HybridHit {
  score: number;
  why: string[];
}

export interface RerankContext {
  intent: Intent;
  graph: Graph;
  defs: SpecDefs;
  parsed: ParsedPartQuery | null;
  params: ParsedParams | null;
  focusId?: string | null;
}

/** Entity types each intent is usually asking for. */
export const INTENT_ENTITIES: Partial<Record<Intent, string[]>> = {
  find_parts: ['part', 'laser_source', 'optic', 'component'],
  alternatives: ['part', 'component'],
  compatibility: ['part', 'compatibility', 'compatibility_rule'],
  compare: ['part', 'laser_source', 'product', 'component'],
  laser_selection: ['application', 'laser_source', 'material', 'product'],
  configure: ['product', 'application', 'equipment_template', 'laser_source'],
  supplier: ['supplier', 'company'],
  supply_risk: ['supplier', 'company', 'localization', 'part'],
  bom: ['bom', 'product', 'module', 'component'],
  cost: ['cost_model', 'bom', 'component', 'part'],
  explain: ['knowledge', 'technology', 'laser_source', 'formula', 'standard', 'article'],
  project_status: ['project', 'opportunity', 'poc', 'requirement'],
  traceability: ['requirement', 'verification'],
  doe: ['doe', 'poc', 'recipe'],
  optimize_process: ['doe', 'recipe', 'poc', 'knowledge'],
  predict: ['recipe', 'doe', 'knowledge'],
};

const STOP = /^(the|and|for|with|from|that|this|what|which|how|can|use|find|show|list|need|a|an|of|to|in|on|is|are|me|we|i|best|good|laser|lasers)$/i;

export function rerank(query: string, hits: HybridHit[], ctx: RerankContext): RankedHit[] {
  const qTokens = query.toLowerCase().split(/[^a-z0-9µ.+-]+/).filter((t) => t.length > 1 && !STOP.test(t));
  const qLower = query.toLowerCase();
  const prior = new Set(INTENT_ENTITIES[ctx.intent] ?? []);
  const near1 = new Set<string>();
  const near2 = new Set<string>();
  if (ctx.focusId) {
    for (const n of neighbours(ctx.graph, ctx.focusId)) {
      near1.add(n.record.id);
      for (const m of neighbours(ctx.graph, n.record.id)) near2.add(m.record.id);
    }
  }
  return hits
    .map((h) => {
      const why: string[] = [];
      let score = h.rrf * 100;
      why.push(`fused retrieval ${score.toFixed(2)}`);
      const r = ctx.graph.byId.get(h.id) as (AnyRecord & Partial<Part> & Record<string, unknown>) | undefined;
      const name = h.name.toLowerCase();
      if (qTokens.length) {
        const cov = qTokens.filter((t) => name.includes(t)).length / qTokens.length;
        if (cov > 0) {
          score += 2 * cov;
          why.push(`name covers ${Math.round(cov * 100)} % of the query terms`);
        }
      }
      for (const ident of [r?.model_number, r?.code, r?.designation, (r as { key?: string } | undefined)?.key]) {
        if (typeof ident === 'string' && ident.length >= 3 && qLower.includes(ident.toLowerCase())) {
          score += 4;
          why.push(`exact identifier “${ident}”`);
          break;
        }
      }
      if (h.kind === 'knowledge' && /abbreviation|glossary|dictionary|\bindex\b|contents|acronym/i.test(h.name)) {
        score -= 2;
        why.push('lookup table (glossary / abbreviations), not an explanation');
      }
      if (prior.has(h.entity)) {
        score += 1.5;
        why.push(`${h.entity.replace(/_/g, ' ')} is what a “${ctx.intent.replace(/_/g, ' ')}” question asks for`);
      }
      // spec constraints on engineering parts — technical relevance, not word overlap
      if (r && h.entity === 'part' && ctx.parsed) {
        if (ctx.parsed.types.length && r.product_type && ctx.parsed.types.includes(r.product_type)) {
          score += 1.5;
          why.push(`type ${r.product_type.replace(/_/g, ' ')} requested`);
        } else if (ctx.parsed.types.length && r.product_type) {
          score -= 1;
          why.push(`type ${r.product_type.replace(/_/g, ' ')} not requested`);
        }
        for (const c of ctx.parsed.constraints) {
          const s = readSpec(r as Part & AnyRecord, c.spec, ctx.defs);
          if (!s || (s.value == null && s.min == null)) continue;
          const lo = s.min ?? s.value!;
          const hi = s.max ?? s.value!;
          const ok = s.min != null && s.max != null ? lo <= c.hi && hi >= c.lo : s.value! >= c.lo && s.value! <= c.hi;
          score += ok ? 1.2 : -2.5;
          why.push(`${ok ? 'meets' : 'fails'} ${c.text}`);
        }
        for (const t of ctx.parsed.technologies) {
          if ((r.technologies ?? []).some((x) => x.toLowerCase() === t.toLowerCase())) {
            score += 0.8;
            why.push(`technology ${t}`);
          }
        }
      }
      if (r && h.entity === 'laser_source' && ctx.params) {
        const ls = r as unknown as LaserSource;
        if (ctx.params.band && ls.wavelength?.value != null) {
          const ok = ls.wavelength.value >= ctx.params.band.min && ls.wavelength.value <= ctx.params.band.max;
          score += ok ? 1.2 : -1.5;
          why.push(`${ok ? 'in' : 'outside'} ${ctx.params.band.label}`);
        }
        if (ctx.params.regime && (ls.categories ?? []).includes(ctx.params.regime as never)) {
          score += 1;
          why.push(`${ctx.params.regime} regime`);
        }
      }
      const v = h.verification;
      if (v === 'VERIFIED') {
        score += 0.6;
        why.push('verified');
      } else if (v === 'SOURCE_DOCUMENTED') {
        score += 0.4;
        why.push('source-documented');
      }
      if (h.data_type === 'DEMO') {
        score -= 0.4;
        why.push('DEMO record (fictional)');
      } else if (h.data_type === 'AI_GENERATED') {
        score -= 0.2;
        why.push('AI-generated draft (unreviewed)');
      }
      if (ctx.focusId && h.id !== ctx.focusId) {
        if (near1.has(h.id)) {
          score += 1.2;
          why.push('directly linked to the record you are viewing');
        } else if (near2.has(h.id)) {
          score += 0.5;
          why.push('two links from the record you are viewing');
        }
      }
      return { ...h, score, why };
    })
    .sort((a, b) => b.score - a.score);
}
