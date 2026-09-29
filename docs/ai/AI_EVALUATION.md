# AI Evaluation

The evaluation runs the **real pipeline** — intent engine, hybrid retrieval, reranker, handlers,
validator, confidence engine — on a hand-labelled gold set. It runs in CI
(`tests/integration/ai.test.ts`) and on demand in the browser (Control Center → Evaluation).

Code: [`src/services/ai/evaluate.ts`](../../src/services/ai/evaluate.ts) ·
gold set: [`src/services/ai/eval/gold.ts`](../../src/services/ai/eval/gold.ts).

## Metrics

| Family | Metric | How it is measured |
|---|---|---|
| Classification (intent) | accuracy, macro precision / recall / F1 | expected vs. classified intent per gold case |
| Retrieval | Recall@K, Precision@K, MRR, NDCG@K (K = 10) | binary relevance of labelled record ids in the ranking (the answer's cited records first, then the reranked hybrid list) |
| RAG / answers | groundedness | share of asserted claims with ≥ 1 resolvable source |
| | citation accuracy | share of record citations that resolve to an existing record |
| | hallucination rate | claims the validator rejected ÷ all claims |
| | answer relevance | cases with the right intent **and** a relevant record cited |
| Regression (MAE, RMSE, R², interval coverage) | — | **not applicable** — no ML model is trained; reported as such, never as numbers |

## Latest results (V1)

| Metric | Value |
|---|---|
| Intent accuracy | 100 % (31 / 31), macro F1 1.00 |
| Recall@10 | 0.97 |
| MRR | 0.87 |
| NDCG@10 | 0.89 |
| Groundedness | 100 % |
| Citation accuracy | 100 % |
| Hallucination (rejected-claim) rate | 0 % |
| Answer relevance | 100 % |
| Mean latency per question (Node, in-process) | ≈ 13 ms |

**Read these honestly.** The gold set is small (31 cases), was written by the same team that
wrote the intent rules, and the rules were adjusted when a case failed. The numbers are
**regression checks** (CI fails if accuracy < 0.9, Recall@10 < 0.8, MRR < 0.6, or if
groundedness / citation accuracy drop below 100 % or hallucination rises above 0 %) — they are not
an estimate of accuracy on new questions. Groundedness is 100 % by construction: the composer cannot
state a claim without a source, and the validator removes any claim whose source does not resolve.
That guarantees traceability, not correctness of the underlying data (most engineering-database
parts are DEMO).

## Growing the evaluation

1. Every *Incorrect* / *Needs review* feedback in the AI log is a candidate gold case.
2. Keep a **held-out** set (not used when tuning rules) once there are ≥ 50 real questions.
3. When a gateway model is added, run the same set with the model on and off and record both in
   the model's `mlops.metrics` — a model is promoted only if it beats the local pipeline.
4. For ML models: time-based train / validation split, baseline first (naive / mean), then the
   candidate; report MAE, RMSE, R² and prediction-interval coverage on the validation set.

## Engineering validator checks (per answer)

`sources` (claims cite existing records / sections / engines) · `database` (numbers re-read from the
cited record, ±0.5 %) · `units` (known to the unit engine) · `constraints` (rule violations
reported) · `conflicts` (specification conflicts shown) · `review` (engineering review flag for
consequential intents or estimated / assumed / conflicting content).
