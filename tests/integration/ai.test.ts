import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractRequirements, laserCandidates, matchTemplates } from '../../src/services/ai/agents';
import { MIN_RUNS, suggestNext } from '../../src/services/ai/bayesopt';
import { confidence } from '../../src/services/ai/confidence';
import { configure } from '../../src/services/ai/configure';
import { centralComposite, fractionalFactorial, fullFactorial, latinHypercube } from '../../src/services/ai/doe';
import { fmeaDraft, REVIEW_BANNER, rfqDraft, ursDraft } from '../../src/services/ai/drafts';
import { closestByName, findMentions, jaroWinkler, resolveName } from '../../src/services/ai/entities';
import { evaluate } from '../../src/services/ai/evaluate';
import { GOLD } from '../../src/services/ai/eval/gold';
import { GatewayUnavailable, LocalGateway, withFallback } from '../../src/services/ai/gateway';
import { classifyIntent } from '../../src/services/ai/intent';
import { changeImpact, derivedEdges, graphPaths } from '../../src/services/ai/kg';
import { compileQuery, runQuery, validate } from '../../src/services/ai/nlq';
import { runCopilot } from '../../src/services/ai/orchestrator';
import { dataReadiness, engineStates, MODEL_REGISTRY } from '../../src/services/ai/registry';
import { route } from '../../src/services/ai/router';
import { expandQuery } from '../../src/services/ai/retrieval/expand';
import { hybridSearch } from '../../src/services/ai/retrieval/hybrid';
import { buildVectorIndex, cosine, embedQuery, vectorSearch } from '../../src/services/ai/retrieval/lexvec';
import { rerank } from '../../src/services/ai/retrieval/rerank';
import { EMPTY_SECTIONS, type EngineeringAnswer } from '../../src/services/ai/types';
import { verifyAnswer } from '../../src/services/ai/verify';
import { parsePartQuery } from '../../src/services/eng/partSearch';
import { parseParams } from '../../src/services/parametric';
import { aiDeps } from '../helpers/ai';

const asserted = (a: EngineeringAnswer) => [...a.answer, ...a.basis, ...a.evidence, ...a.alternatives, ...a.constraints, ...a.risks].filter((c) => c.cls !== 'UNKNOWN');

describe('AI layer — registry, gateway, router', async () => {
  const deps = await aiDeps();

  it('gateway models are OFFLINE with no provider configured; the local gateway refuses to complete', async () => {
    const states = engineStates(deps.readiness);
    for (const s of states.filter((x) => x.model.runtime === 'gateway')) {
      expect(s.status).toBe('OFFLINE');
      expect(s.model.provider).toBe('Not configured');
    }
    expect(LocalGateway.available('llm')).toBe(false);
    await expect(LocalGateway.complete({ task: 'synthesize', model: 'gw-reasoning', query: 'x', evidence: [] })).rejects.toBeInstanceOf(GatewayUnavailable);
    const r = await withFallback([{ name: 'llm', run: () => LocalGateway.complete({ task: 'synthesize', model: 'gw-reasoning', query: 'x', evidence: [] }).then(() => 'llm') }, { name: 'local', run: async () => 'local' }]);
    expect(r).toEqual({ value: 'local', used: 'local' });
  });

  it('ML engines stay OFFLINE until real data reaches the threshold (DATA REQUIRED is computed, not declared)', () => {
    const ready = dataReadiness(deps.records);
    expect(ready.poHistory).toBe(0);
    expect(ready.telemetry).toBe(0);
    const states = engineStates(ready);
    const bo = states.find((s) => s.model.id === 'local-bayesopt')!;
    expect(bo.status).toBe(ready.doeMeasuredRuns >= MIN_RUNS ? 'ONLINE' : 'OFFLINE');
    expect(states.find((s) => s.model.id === 'ml-process-quality')!.reason).toMatch(/Data required: \d+ of 30/);
    // every ML model has MLOps metadata and no metrics until trained
    for (const m of MODEL_REGISTRY.filter((x) => x.id.startsWith('ml-'))) expect(m.mlops?.metrics).toBeNull();
  });

  it('no provider key, endpoint or SDK exists in the AI layer', () => {
    const dir = join(__dirname, '..', '..', 'src', 'services', 'ai');
    const files = (d: string): string[] => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)]));
    for (const f of files(dir)) {
      const t = readFileSync(f, 'utf-8');
      expect(t, f).not.toMatch(/sk-[A-Za-z0-9]{16,}|api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis|x-api-key|Bearer [A-Za-z0-9]/);
    }
  });

  it('router: cost-aware synthesis falls back to the local composer and says why; disabled engines are skipped', () => {
    const plan = route(classifyIntent('I need a laser marking machine for aluminium cans'), deps.states);
    expect(plan.synthesis.requested).toBe('gw-reasoning');
    expect(plan.synthesis.engine).toBe('local-composer');
    expect(plan.synthesis.why).toMatch(/No AI gateway configured/);
    const simple = route(classifyIntent('Explain MOPA laser'), deps.states);
    expect(simple.synthesis.requested).toBe('gw-fast');
    const off = engineStates(deps.readiness, { 'local-lexvec': false });
    const p2 = route(classifyIntent('Explain MOPA laser'), off);
    const vecStep = p2.steps.find((s) => s.requested === 'local-lexvec')!;
    expect(vecStep.status).toBe('fallback');
    expect(vecStep.engine).toBe('local-bm25');
  });
});

describe('AI layer — intent, retrieval, reranking', async () => {
  const deps = await aiDeps();

  it('intent engine classifies the gold set (regression check)', () => {
    const wrong = GOLD.filter((g) => classifyIntent(g.q).intent !== g.intent);
    expect(wrong.map((g) => `${g.q} → ${classifyIntent(g.q).intent}`)).toEqual([]);
    expect(classifyIntent('Where can I use this?').signals.refersToContext).toBe(true);
    expect(classifyIntent('What changes if I replace DL-MOPA-20 with DL-MOPA-50?').signals.risk).toBe('high');
  });

  it('query expansion adds curated variants only', () => {
    const e = expandQuery('fibre laser for aluminium galvo');
    expect(e.added).toEqual(expect.arrayContaining(['fiber', 'aluminum', 'galvanometer']));
    expect(e.added).not.toContain('uv');
  });

  it('lexical vectors: unit length, spelling tolerance, labelled as lexical', () => {
    const idx = buildVectorIndex([
      { id: 'a', text: 'fiber laser marking source' },
      { id: 'b', text: 'servo motor drive' },
    ]);
    expect(idx.kind).toBe('lexical-tfidf-hashed');
    expect(cosine(embedQuery(idx, 'fiber laser marking source'), idx.docs[0].vec)).toBeCloseTo(1, 5);
    // a spelling variant still finds the document through shared words and character trigrams
    expect(vectorSearch(idx, 'fibre laser marking')[0].id).toBe('a');
    expect(vectorSearch(idx, 'servomotor drive')[0].id).toBe('b');
  });

  it('hybrid retrieval fuses keyword, vector and graph legs with reasons', async () => {
    const r = await hybridSearch('MOPA laser for anodised aluminium marking', { bm25: deps.bm25, vec: deps.vec, graph: deps.graph }, {}, 30);
    expect(r.legs.bm25).toBeGreaterThan(0);
    expect(r.legs.vector).toBeGreaterThan(0);
    expect(r.hits.length).toBeGreaterThan(5);
    for (const h of r.hits) expect(h.reasons.length).toBeGreaterThan(0);
    const excl = await hybridSearch('MOPA', { bm25: deps.bm25, vec: deps.vec, graph: deps.graph }, { excludeDemo: true }, 30);
    expect(excl.hits.every((h) => h.data_type !== 'DEMO')).toBe(true);
  });

  it('reranker: a part that fails a stated constraint ranks below one that meets it', async () => {
    const q = 'Find 50 W MOPA laser';
    const h = await hybridSearch(q, { bm25: deps.bm25, vec: deps.vec, graph: deps.graph }, {}, 40);
    const r = rerank(q, h.hits, { intent: 'find_parts', graph: deps.graph, defs: deps.defs, parsed: parsePartQuery(q, deps.defs), params: parseParams(q) });
    const i50 = r.findIndex((x) => x.id === 'prt-demo-mopa-50');
    const i20 = r.findIndex((x) => x.id === 'prt-demo-mopa-20');
    expect(i50).toBeGreaterThanOrEqual(0);
    expect(i20 === -1 || i50 < i20).toBe(true);
    expect(r[i50].why.join(' ')).toMatch(/meets Average power/);
  });
});

describe('AI layer — knowledge graph, entities, controlled queries', async () => {
  const deps = await aiDeps();

  it('GraphRAG walks from a laser class to the applications that use it', () => {
    const paths = graphPaths(deps.graph, ['las-mopa'], ['Application'], { maxHops: 2 });
    expect(paths.length).toBeGreaterThan(2);
    expect(paths.every((p) => p[0].id === 'las-mopa' && p[p.length - 1].cls === 'Application')).toBe(true);
    const d = derivedEdges(deps.records);
    expect(d.find((e) => e.from === 'prt-demo-mopa-20')?.to).toBe('las-mopa');
  });

  it('change impact: spec deltas, compatibility before/after in scenarios, no invented cost', () => {
    const ci = changeImpact('prt-demo-mopa-20', 'prt-demo-mopa-50', deps.graph, deps.records, deps.compat, deps.defs)!;
    expect(ci.deltas.find((d) => d.spec === 'average_power')).toMatchObject({ from: '20 W', to: '50 W' });
    expect(ci.scenarios.length).toBeGreaterThan(0);
    const cooling = ci.rows.find((r) => r.domain === 'Cooling')!;
    expect(cooling.status).toBe('Affected');
    const cost = ci.rows.find((r) => r.domain === 'Cost')!;
    expect(['Affected', 'Unknown']).toContain(cost.status);
  });

  it('entity resolution: identifiers, names, aliases and fuzzy matches (fuzzy needs verification)', () => {
    expect(findMentions('replace DL-MOPA-20 with DL-MOPA-50', deps.records).map((m) => m.record.id)).toEqual(expect.arrayContaining(['prt-demo-mopa-20', 'prt-demo-mopa-50']));
    expect(jaroWinkler('photonics', 'photonics')).toBe(1);
    expect(jaroWinkler('ipg photonics', 'ipg photonic')).toBeGreaterThan(0.9);
    const r = resolveName('DEMO Photonic Co', deps.records, { entities: ['company'] });
    expect(r[0]?.record.id).toBe('co-demo-photonics');
    expect(r[0]?.needsVerification).toBe(r[0]?.method === 'fuzzy');
    expect(closestByName('cycle time of the laser marker', deps.records, 'simulation')[0].record.id).toBe('sim-demo-laser-marker');
  });

  it('natural-language queries compile to a whitelisted filter object — never SQL', () => {
    const cq = compileQuery('Find Indian suppliers for galvo scanners', deps.defs)!;
    expect(cq.entities).toEqual(['supplier', 'company']);
    expect(cq.filters.map((f) => f.field)).toEqual(['country', 'capability']);
    expect(validate({ entities: ['supplier', 'users' as never], filters: [{ field: 'password' as never, op: 'contains', value: 'x', label: 'x' }], limit: 1e9 })).toEqual({ entities: ['supplier'], filters: [], limit: 200 });
    const rows = runQuery({ ...cq, filters: cq.filters.filter((f) => f.field !== 'country') }, deps.records);
    expect(rows.some((r) => r.record.id === 'co-demo-scan')).toBe(true);
  });
});

describe('AI layer — agents, configurator, drafts, DOE, Bayesian optimisation', async () => {
  const deps = await aiDeps();
  const TEXT = 'I need a laser marking machine for aluminium battery cans, 5-second cycle time, high-contrast marking.';

  it('requirement extraction reads what is stated and marks the rest Not Defined', () => {
    const r = extractRequirements(TEXT, deps.records, deps.lexicon);
    expect(r.process.value).toBe('Marking');
    expect(r.material).toMatchObject({ value: 'Aluminium', id: 'mat-al' });
    expect(r.cycleTime).toMatchObject({ value: 5, unit: 's', status: 'STATED' });
    expect(r.throughput).toMatchObject({ value: 720, status: 'CALCULATED' });
    expect(r.quality.value).toMatch(/high-contrast/);
    expect(r.missing).toEqual(expect.arrayContaining(['Material thickness', 'Accuracy', 'Budget']));
    expect(r.budget.value).toBeNull();
  });

  it('laser candidates come from TEAL application records and absorption — ordered, never a single “best”', () => {
    const req = extractRequirements(TEXT, deps.records, deps.lexicon);
    const c = laserCandidates(req, deps.records);
    expect(c[0].source.id).toBe('las-mopa');
    expect(c[0].applications.map((a) => a.id)).toEqual(expect.arrayContaining(['app-markit.cell']));
    expect(c[0].refs.some((r) => r.id === 'mat-al' || r.id.startsWith('app-'))).toBe(true);
    expect(matchTemplates(req, deps.records)[0].template.id).toBe('eqt-can-marking');
    // nothing to select on → no candidates (never “everything”)
    expect(laserCandidates(extractRequirements('Generate an RFQ', deps.records, deps.lexicon), deps.records)).toEqual([]);
  });

  it('configurator pipeline: platform, BOM with estimates only, gaps and validation — nothing invented', () => {
    const c = configure(TEXT, { records: deps.records, engine: deps.engine, lexicon: deps.lexicon, compat: deps.compat, newId: deps.newId, today: '2026-09-29' });
    expect(c.pkg?.matches[0].product.key).toBe('voltm');
    expect(c.cost.basis).toMatch(/ESTIMATES/);
    for (const l of c.pkg!.bom!.lines) if (l.unit_cost == null) expect(l.cost_basis).toBe('UNKNOWN');
    expect(c.gaps.join(' ')).toMatch(/Material thickness: Not Defined/);
    expect(c.validation.join(' ')).toMatch(/POC/);
    const rfq = rfqDraft(c).markdown;
    expect(rfq).toContain(REVIEW_BANNER);
    expect(rfq).toContain('TO BE CONFIRMED');
    expect(ursDraft(c).markdown).toContain('no compliance is claimed');
    const fmea = fmeaDraft(c).markdown;
    expect(fmea).toMatch(/AI-SUGGESTED/);
    expect(fmea).toMatch(/\| — \| — \| — \|/); // S, O, D left unscored
  });

  it('DOE designs have the right run counts and are reproducible', () => {
    const f = [
      { name: 'Power', low: 20, high: 50 },
      { name: 'Speed', low: 500, high: 2000 },
      { name: 'Frequency', low: 20, high: 200 },
    ];
    expect(fullFactorial(f).runs).toHaveLength(8);
    expect(fullFactorial([{ ...f[0], levels: [20, 35, 50] }, f[1]]).runs).toHaveLength(6);
    const ff = fractionalFactorial(f);
    expect(ff.runs).toHaveLength(4);
    expect(ff.label).toBe('GENERATED EXPERIMENT PLAN — not a result');
    expect(centralComposite(f).runs).toHaveLength(8 + 6 + 3);
    const a = latinHypercube(f, 10, 3);
    expect(a.runs).toEqual(latinHypercube(f, 10, 3).runs);
    // stratified: one point per tenth of every factor range
    const bins = new Set(a.runs.map((r) => Math.floor(((r.settings.Power - 20) / 30) * 10)));
    expect(bins.size).toBe(10);
  });

  it('Bayesian optimisation refuses below the data threshold and suggests within bounds above it', () => {
    const f = [
      { name: 'x', low: 0, high: 1 },
      { name: 'y', low: 0, high: 1 },
    ];
    expect(suggestNext(f, [{ x: { x: 0.1, y: 0.1 }, y: 1 }], 'max').status).toBe('DATA REQUIRED');
    // SYNTHETIC test function (test only — never platform data): peak at (0.7, 0.3)
    const g = (x: number, y: number) => -((x - 0.7) ** 2) - (y - 0.3) ** 2;
    const obs = [
      [0.1, 0.1],
      [0.9, 0.9],
      [0.5, 0.5],
      [0.2, 0.8],
      [0.8, 0.2],
      [0.6, 0.4],
    ].map(([x, y]) => ({ x: { x, y }, y: g(x, y) }));
    const r = suggestNext(f, obs, 'max');
    expect(r.status).toBe('OK');
    if (r.status === 'OK') {
      expect(r.next.x).toBeGreaterThanOrEqual(0);
      expect(r.next.x).toBeLessThanOrEqual(1);
      expect(r.sd).toBeGreaterThan(0);
      expect(Math.hypot(r.next.x - 0.7, r.next.y - 0.3)).toBeLessThan(0.35);
    }
  });
});

describe('AI layer — validator, confidence, orchestrator, evaluation', async () => {
  const deps = await aiDeps();

  it('validator removes unsourced claims and flags values that differ from the record', () => {
    const base: EngineeringAnswer = {
      query: 'q',
      intent: 'find_parts',
      title: 't',
      ...EMPTY_SECTIONS(),
      answer: [
        { text: 'unsourced', cls: 'VERIFIED', sources: [] },
        { text: 'ghost record', cls: 'VERIFIED', sources: [{ kind: 'record', id: 'prt-does-not-exist', label: 'x' }] },
        { text: 'DL-MOPA-20 is 20 W', cls: 'VERIFIED', sources: [{ kind: 'record', id: 'prt-demo-mopa-20', label: 'x' }], values: [{ value: 20, unit: 'W', field: 'spec:average_power', recordId: 'prt-demo-mopa-20' }] },
        { text: 'DL-MOPA-20 is 25 W', cls: 'VERIFIED', sources: [{ kind: 'record', id: 'prt-demo-mopa-20', label: 'x' }], values: [{ value: 25, unit: 'W', field: 'spec:average_power', recordId: 'prt-demo-mopa-20' }] },
      ],
      confidence: { label: 'LOW', signals: [], reason: '' },
      verification: { checks: [], rejected: [], reviewRequired: false },
      sources: [],
      trace: [],
      mode: 'local',
    };
    const { answer, report } = verifyAnswer(base, { byId: deps.byId, defs: deps.defs });
    expect(report.rejected.map((c) => c.text)).toEqual(['unsourced', 'ghost record']);
    expect(answer.answer.map((c) => c.cls)).toEqual(['VERIFIED', 'CONFLICTING']);
    expect(report.checks.find((c) => c.check === 'database')?.status).toBe('fail');
    expect(report.reviewRequired).toBe(true);
  });

  it('confidence is a label from signals; nothing asserted → INSUFFICIENT DATA', () => {
    expect(confidence({ claims: [], agreement: null, coverage: null, constraints: null, modelUncertainty: null, historical: null }).label).toBe('INSUFFICIENT DATA');
    const demo = confidence({ claims: [{ text: 'x', cls: 'ASSUMED', sources: [{ kind: 'record', id: 'p', label: 'p', data_type: 'DEMO', verification: 'SOURCE_DOCUMENTED' }] }], agreement: null, coverage: null, constraints: null, modelUncertainty: null, historical: null });
    expect(demo.signals.find((s) => s.signal === 'Source quality')?.level).toBe('low');
  });

  it('end-to-end: the flagship requirement gives a grounded, validated configuration answer', async () => {
    const a = await runCopilot('I need a laser marking machine for aluminium battery cans, 5-second cycle time, high-contrast marking.', null, deps);
    expect(a.intent).toBe('configure');
    expect(a.mode).toBe('local');
    expect(a.verification.rejected).toEqual([]);
    for (const c of asserted(a)) expect(c.sources.length, c.text).toBeGreaterThan(0);
    expect(a.tables.map((t) => t.title)).toEqual(expect.arrayContaining(['Requirement extraction', 'Technology candidates', 'Preliminary BOM']));
    expect(a.actions.some((x) => x.kind === 'open3d' && x.templateId === 'eqt-can-marking')).toBe(true);
    expect(a.verification.reviewRequired).toBe(true);
    expect(a.trace.find((t) => t.step === 'Synthesis model')?.status).toBe('fallback');
    expect(a.agents.map((m) => m.agent)).toEqual(expect.arrayContaining(['requirements', 'laser', 'component', 'verification']));
  });

  it('predictions are refused without data; calculations are exact; context answers “Where can I use this?”', async () => {
    const p = await runCopilot('Predict weld quality for 1 mm stainless steel', null, deps);
    expect(p.answer[0].text).toMatch(/No prediction is made/);
    expect(p.gaps.some((g) => /Data required/.test(g.text))).toBe(true);
    const c = await runCopilot('Convert 1064 nm to µm', null, deps);
    expect(c.answer[0].text).toBe('1,064 nm = 1.064 µm');
    const w = await runCopilot('Where can I use this?', { kind: 'record', id: 'las-mopa', entity: 'laser_source', name: 'Fiber MOPA', label: '', route: '/record/las-mopa' }, deps);
    expect(w.answer.some((x) => x.sources.some((s) => s.id === 'app-markit.cell'))).toBe(true);
  });

  it('evaluation harness: regression thresholds on the gold set', async () => {
    const r = await evaluate(deps);
    expect(r.classification.accuracy).toBeGreaterThanOrEqual(0.9);
    expect(r.retrieval.recallAtK).toBeGreaterThanOrEqual(0.8);
    expect(r.retrieval.mrr).toBeGreaterThanOrEqual(0.6);
    expect(r.answers.groundedness).toBe(1);
    expect(r.answers.citationAccuracy).toBe(1);
    expect(r.answers.hallucinationRate).toBe(0);
    expect(r.regression).toMatch(/not applicable/);
  }, 30000);

  it('records with DEMO data never become VERIFIED claims', async () => {
    const a = await runCopilot('Find 50 W MOPA laser 1064 nm', null, deps);
    const demoOnly = asserted(a).filter((c) => c.sources.length && c.sources.every((s) => s.kind === 'record' && s.data_type === 'DEMO'));
    expect(demoOnly.every((c) => c.cls !== 'VERIFIED')).toBe(true);
  });
});

describe('AI layer — decisions and feedback (local workspace)', async () => {
  const { freshRepo } = await import('../helpers/repo');
  it('a decision is stored as a validated decision draft with evidence; feedback goes to the local log', async () => {
    const { setRepo, repo } = await import('../../src/repositories');
    setRepo(freshRepo());
    const { recordDecision, recordFeedback, aiLog } = await import('../../src/services/ai/feedback');
    const deps = await aiDeps();
    const a = await runCopilot('Is DL-MOPA-20 compatible with SC-10?', null, deps);
    const id = await recordDecision({ question: 'Use SC-10 with DL-MOPA-20?', options: ['SC-10', 'SC-14'], decision: 'SC-10', reason: 'Rule checks pass; aperture margin to be confirmed on the bench', approver: 'Test Engineer', answer: a });
    const d = (await repo().workspace.drafts()).find((x) => x.id === id)!;
    expect(d.entity).toBe('decision');
    expect(d.record).toMatchObject({ decision: 'SC-10', approver: 'Test Engineer', data_type: 'USER_CREATED' });
    expect((d.record.evidence_ids as string[]).length).toBeGreaterThan(0);
    await recordFeedback(a, 'needs_review', 'check aperture');
    const log = await aiLog();
    expect(log[0]).toMatchObject({ kind: 'feedback', feedback: 'needs_review', correction: 'check aperture' });
  });
});
