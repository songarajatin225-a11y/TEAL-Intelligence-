import { pageContext } from './context';
import { GOLD, type GoldCase } from './eval/gold';
import { classifyIntent } from './intent';
import { runCopilot, type CopilotDeps } from './orchestrator';
import { hybridSearch } from './retrieval/hybrid';
import { rerank } from './retrieval/rerank';
import { parsePartQuery } from '../eng/partSearch';
import { parseParams } from '../parametric';
import type { Claim, Intent } from './types';

/*
 * AI EVALUATION (AI master prompt §59). Runs the gold set through the real pipeline and reports:
 *   classification — accuracy, macro precision / recall / F1 of the intent engine
 *   retrieval      — Recall@K, Precision@K, MRR, NDCG@K of hybrid retrieval + reranker
 *   RAG / answers  — groundedness, citation accuracy, hallucination (rejected-claim) rate,
 *                    answer relevance (right intent and a relevant record cited)
 * Regression metrics (MAE, RMSE, R², interval coverage) apply to trained ML models; none is trained,
 * so they are reported as not applicable rather than as numbers.
 */

export interface CaseResult {
  q: string;
  expected: Intent;
  got: Intent;
  intentOk: boolean;
  firstRelevantRank: number | null;
  recallAtK: number | null;
  answerCitesRelevant: boolean | null;
  claims: number;
  grounded: number;
  rejected: number;
  confidence: string;
  ms: number;
}

export interface EvalReport {
  k: number;
  cases: CaseResult[];
  classification: { accuracy: number; macroPrecision: number; macroRecall: number; macroF1: number; confusions: { expected: Intent; got: Intent; q: string }[] };
  retrieval: { recallAtK: number; precisionAtK: number; mrr: number; ndcgAtK: number; cases: number };
  answers: { groundedness: number; citationAccuracy: number; hallucinationRate: number; answerRelevance: number; meanLatencyMs: number };
  regression: 'not applicable — no ML model is trained';
  ranAt: string;
}

const asserted = (cl: Claim) => cl.cls !== 'UNKNOWN';
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export async function evaluate(deps: CopilotDeps, gold: GoldCase[] = GOLD, k = 10): Promise<EvalReport> {
  const cases: CaseResult[] = [];
  const recalls: number[] = [];
  const precisions: number[] = [];
  const rr: number[] = [];
  const ndcg: number[] = [];
  let citations = 0;
  let validCitations = 0;
  for (const g of gold) {
    const got = classifyIntent(g.q).intent;
    const t0 = Date.now();
    const page = g.context ? pageContext(`/record/${g.context}`, deps.byId) : null;
    const a = await runCopilot(g.q, page, deps);
    const ms = Date.now() - t0;
    let firstRelevantRank: number | null = null;
    let recallAtK: number | null = null;
    if (g.ids?.length) {
      const hy = await hybridSearch(g.q, { bm25: deps.bm25, vec: deps.vec, graph: deps.graph }, {}, 40);
      const ranked = rerank(g.q, hy.hits, { intent: g.intent, graph: deps.graph, defs: deps.defs, parsed: parsePartQuery(g.q, deps.defs), params: parseParams(g.q), focusId: g.context });
      // the answer's own cited records count as retrieved too (structured engines retrieve by constraint, not by text)
      const order = [...new Set([...a.sources.filter((s) => s.kind === 'record').map((s) => s.id), ...ranked.map((h) => h.id)])];
      const top = order.slice(0, k);
      const rel = new Set(g.ids);
      const hits = top.filter((id) => rel.has(id)).length;
      recallAtK = hits / rel.size;
      recalls.push(recallAtK);
      precisions.push(hits / k);
      const first = top.findIndex((id) => rel.has(id));
      firstRelevantRank = first >= 0 ? first + 1 : null;
      rr.push(first >= 0 ? 1 / (first + 1) : 0);
      const dcg = top.reduce((s, id, i) => s + (rel.has(id) ? 1 / Math.log2(i + 2) : 0), 0);
      const idcg = [...Array(Math.min(k, rel.size))].reduce((s, _, i) => s + 1 / Math.log2(i + 2), 0);
      ndcg.push(idcg ? dcg / idcg : 0);
    }
    const claims = [...a.answer, ...a.basis, ...a.evidence, ...a.alternatives, ...a.constraints, ...a.risks].filter(asserted);
    const grounded = claims.filter((cl) => cl.sources.length > 0).length;
    for (const cl of claims) for (const s of cl.sources) if (s.kind === 'record') {
      citations++;
      if (deps.byId.has(s.id)) validCitations++;
    }
    cases.push({
      q: g.q,
      expected: g.intent,
      got,
      intentOk: got === g.intent,
      firstRelevantRank,
      recallAtK,
      answerCitesRelevant: g.ids?.length ? a.sources.some((s) => g.ids!.includes(s.id)) : null,
      claims: claims.length,
      grounded,
      rejected: a.verification.rejected.length,
      confidence: a.confidence.label,
      ms,
    });
  }

  const intents = [...new Set(gold.map((g) => g.intent))];
  const per = intents.map((i) => {
    const tp = cases.filter((c) => c.expected === i && c.got === i).length;
    const fp = cases.filter((c) => c.expected !== i && c.got === i).length;
    const fn = cases.filter((c) => c.expected === i && c.got !== i).length;
    const p = tp + fp ? tp / (tp + fp) : 0;
    const r = tp + fn ? tp / (tp + fn) : 0;
    return { p, r, f1: p + r ? (2 * p * r) / (p + r) : 0 };
  });
  const totalClaims = cases.reduce((a, c) => a + c.claims, 0);
  const totalRejected = cases.reduce((a, c) => a + c.rejected, 0);
  const withIds = cases.filter((c) => c.answerCitesRelevant != null);
  return {
    k,
    cases,
    classification: { accuracy: mean(cases.map((c) => Number(c.intentOk))), macroPrecision: mean(per.map((x) => x.p)), macroRecall: mean(per.map((x) => x.r)), macroF1: mean(per.map((x) => x.f1)), confusions: cases.filter((c) => !c.intentOk).map((c) => ({ expected: c.expected, got: c.got, q: c.q })) },
    retrieval: { recallAtK: mean(recalls), precisionAtK: mean(precisions), mrr: mean(rr), ndcgAtK: mean(ndcg), cases: recalls.length },
    answers: {
      groundedness: totalClaims ? cases.reduce((a, c) => a + c.grounded, 0) / totalClaims : 1,
      citationAccuracy: citations ? validCitations / citations : 1,
      hallucinationRate: totalClaims + totalRejected ? totalRejected / (totalClaims + totalRejected) : 0,
      answerRelevance: withIds.length ? withIds.filter((c) => c.intentOk && c.answerCitesRelevant).length / withIds.length : 0,
      meanLatencyMs: mean(cases.map((c) => c.ms)),
    },
    regression: 'not applicable — no ML model is trained',
    ranAt: new Date().toISOString(),
  };
}
