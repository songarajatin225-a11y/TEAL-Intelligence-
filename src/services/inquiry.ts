import type { AnyRecord } from '../domain';
import type { Application, Bom, BomLine, Company, Configuration, CostModel, Doe, GateDefinition, LaserSource, Material, Module, Opportunity, Poc, Product, Project, Requirement, Risk, Supplier } from '../domain/entities';
import type { ConfigState, ConfiguratorEngine } from '../features/configurator/engine';
import { addDays, todayIso } from '../utils/dates';
import { BOM_COST_ASSUMPTIONS, bomLinesFromConfig, costMaterialLinesFromBom } from './bomGen';

/*
 * CUSTOMER INQUIRY → PRODUCT (spec §61, §139) — the flagship workflow.
 * Stage 1 (parse + platform match) is the legacy configurator's inquiry advisor (`advise()`),
 * ported with its lexicon. Stage 2 drafts the connected engineering package.
 * Everything produced is data_type INFERRED, verification DRAFT, and tagged "generated".
 * No price, result or customer fact is invented: unknowns stay UNKNOWN and become open questions.
 */

export interface Lexicon {
  _os_additions?: unknown;
  process: Record<string, string[]>;
  material: Record<string, string[]>;
  need: Record<string, string[]>;
  scale: Record<string, string[]>;
  care: Record<string, string[]>;
}

export interface InquiryFacts {
  text: string;
  families: Record<string, number>;
  materials: Record<string, number>;
  needs: string[];
  cares: string[];
  scale: 'high' | 'low' | null;
  industry: string | null;
  perHour: number | null;
  customerSuppliesLaser: boolean;
  matchedTerms: string[];
}

const INDUSTRY_TERMS: [string, RegExp][] = [
  ['semi', /semiconductor|wafer|osat|atmp|package|die\b|lead ?frame/],
  ['ems', /\bpcb\b|smt|circuit board|\bems\b|solder mask/],
  ['battery', /battery|cell\b|busbar|pack\b|gigafactory/],
  ['auto', /automotive|vehicle|\bev\b|motor housing|hairpin/],
  ['medical', /medical|implant|surgical|\budi\b/],
  ['aero', /aerospace|aircraft|defen[cs]e/],
];

/** Stage 1a — read an inquiry against the lexicon (legacy `advise()` term rules). */
export function parseInquiry(raw: string, lex: Lexicon): InquiryFacts {
  const text = raw.toLowerCase();
  const matched: string[] = [];
  const termIn = (t: string) => {
    const hit =
      t.length <= 4 && !t.includes(' ')
        ? new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text)
        : text.includes(t);
    if (hit) matched.push(t);
    return hit;
  };
  const score = (dict: Record<string, string[]>) => {
    const out: Record<string, number> = {};
    for (const [k, terms] of Object.entries(dict)) {
      const n = terms.filter(termIn).length;
      if (n) out[k] = n;
    }
    return out;
  };
  const families = score(lex.process);
  const materials = score(lex.material);
  const needs = Object.keys(score(lex.need));
  const cares = Object.keys(score(lex.care));
  let scale: 'high' | 'low' | null = null;
  for (const [k, terms] of Object.entries(lex.scale)) if (terms.some(termIn)) scale = k as 'high' | 'low';
  const industry = INDUSTRY_TERMS.find(([, re]) => re.test(text))?.[0] ?? null;
  let perHour: number | null = null;
  const ph = /(\d[\d,.]*)\s*(uph|units? ?(?:per|\/) ?h(?:ou)?r|parts? ?(?:per|\/) ?h(?:ou)?r|pph)/.exec(text);
  const pm = /(\d[\d,.]*)\s*(parts?|units?|pcs|packages?) ?(?:per|\/) ?min/.exec(text);
  const pd = /(\d[\d,.]*)\s*(parts?|units?|pcs|packages?) ?(?:per|\/) ?day/.exec(text);
  if (ph) perHour = parseFloat(ph[1].replace(/,/g, ''));
  else if (pm) perHour = parseFloat(pm[1].replace(/,/g, '')) * 60;
  else if (pd) perHour = null; // per-day demand needs the shift pattern → stays an open question
  const customerSuppliesLaser = /customer[- ](supplie[sd]|provide[sd]|free[- ]issue)[a-z ]{0,20}laser|laser (is )?(supplied|provided) by (the )?customer|customer'?s own laser/.test(text);
  return { text: raw, families, materials, needs, cares, scale, industry, perHour, customerSuppliesLaser, matchedTerms: [...new Set(matched)] };
}

export interface PlatformMatch {
  product: Product;
  appKey: string;
  score: number;
  why: { t: string; d: string }[];
}

const PROCESS_FAMILY: Record<string, string> = { Marking: 'mark', Welding: 'weld', Cutting: 'cut', Cleaning: 'clean' };

/**
 * Stage 1b — legacy `advise()` scoring (best application per platform, top 3), plus two OS rules:
 *  (1) a platform is credited for the process its applications perform, not only its family
 *      (the Semi WM-300 / SPM are marking machines in the "semi" family);
 *  (2) a platform that serves only the detected industry gets a specialist bonus (+10).
 */
export function matchPlatforms(f: InquiryFacts, products: Product[], sources: Map<string, LaserSource>, materialNames: Map<string, string>, applications: Application[] = []): PlatformMatch[] {
  const text = f.text.toLowerCase();
  const out: PlatformMatch[] = [];
  const processFam = new Map<string, Set<string>>();
  for (const a of applications) {
    const pk = a.product_id?.replace(/^prd-/, '');
    const pf = PROCESS_FAMILY[a.process];
    if (pk && pf) (processFam.get(pk) ?? processFam.set(pk, new Set()).get(pk)!).add(pf);
  }
  for (const p of products) {
    const fam = p.family_id.replace(/^fam-/, '');
    for (const a of p.applications) {
      let sc = 0;
      const why: { t: string; d: string }[] = [];
      if (f.families[fam]) {
        sc += f.families[fam] * 10;
        why.push({ t: 'process', d: `${fam} terms matched` });
      }
      for (const pf of processFam.get(p.key) ?? []) {
        if (pf !== fam && f.families[pf]) {
          sc += f.families[pf] * 10;
          why.push({ t: 'process', d: `${pf} terms matched (platform performs ${pf})` });
        }
      }
      if (f.industry && p.industries.length === 1 && p.industries[0] === `ind-${f.industry}`) {
        sc += 10;
        why.push({ t: 'specialist', d: `dedicated ${f.industry} platform` });
      }
      if (a.material_key && f.materials[a.material_key]) {
        sc += f.materials[a.material_key] * 9;
        why.push({ t: 'material', d: materialNames.get(a.material_key) ?? a.material_key });
      }
      if (f.industry && p.industries.includes(`ind-${f.industry}`)) {
        sc += 8;
        why.push({ t: 'industry', d: f.industry });
      }
      const hay = `${a.name} ${a.description ?? ''} ${p.name} ${p.title} ${p.tagline ?? ''}`.toLowerCase();
      const wh = text.split(/[^a-z0-9]+/).filter((w) => w.length > 3 && hay.includes(w)).length;
      if (wh) {
        sc += wh * 3;
        why.push({ t: 'wording', d: `${wh} term${wh > 1 ? 's' : ''} matched` });
      }
      const s = a.source_key ? sources.get(a.source_key) : undefined;
      const um = (s?.wavelength.value ?? 1064) / 1000;
      const tau = s?.pulse_duration?.unit === 'ns' ? s.pulse_duration.value : null;
      if (f.cares.includes('heat') && s && (um < 0.6 || (tau != null && tau < 1))) {
        sc += 7;
        why.push({ t: 'low heat', d: 'short wavelength / pulse keeps thermal input down' });
      }
      if (f.cares.includes('medical') && (fam === 'weld' || p.industries.includes('ind-medical'))) {
        sc += 5;
        why.push({ t: 'regulated', d: 'validated-site pathway available' });
      }
      const pt = `${p.title} ${p.tagline ?? ''}`;
      if ((f.scale === 'high' || (f.perHour ?? 0) >= 200) && /inline|rotary|on-the-fly|magazine|conveyor/i.test(pt)) {
        sc += 5;
        why.push({ t: 'throughput', d: 'built for continuous production' });
      }
      if (f.scale === 'low' && /workstation|portable|bench/i.test(pt)) {
        sc += 5;
        why.push({ t: 'scale', d: 'suits low volume and development' });
      }
      if (sc > 0) out.push({ product: p, appKey: a.key, score: sc, why });
    }
  }
  out.sort((x, y) => y.score - x.score);
  const seen = new Set<string>();
  return out.filter((r) => !seen.has(r.product.key) && seen.add(r.product.key)).slice(0, 3);
}

/* ================================================== stage 2 — the package */

export interface InquiryContext {
  engine: ConfiguratorEngine;
  lexicon: Lexicon;
  applications: Application[];
  materials: Material[];
  suppliers: Supplier[];
  companies: Company[];
  gates: GateDefinition[];
  customerId?: string;
  customerName?: string;
  newId: (entity: string) => string;
  today?: string;
}

export interface DraftPackage {
  facts: InquiryFacts;
  matches: PlatformMatch[];
  opportunity: Opportunity;
  requirements: Requirement[];
  application: Application | null;
  processCandidates: { product: string; application: string; source: string; regime: string | null; spot_um: number | null; score: number; why: string }[];
  configuration: Configuration | null;
  poc: Poc | null;
  doe: Doe | null;
  bom: Bom | null;
  costModel: CostModel | null;
  supplierNeeds: { need: string; candidates: { id: string; name: string; basis: string }[] }[];
  risks: Risk[];
  openQuestions: string[];
  g0Checklist: { item: string; status: 'missing' | 'draft'; note: string }[];
  project: Project | null;
  reusableModules: { key: string; name: string; status: 'Standard content' | 'Recommended' | 'Requested need' }[];
  records: AnyRecord[];
}

const DRAFT = (note: string) => ({ data_type: 'INFERRED' as const, provenance: { verification_status: 'DRAFT' as const, source_id: 'src-os-spec', note }, tags: ['generated', 'draft'] });

interface ReqRule {
  test: (f: InquiryFacts) => boolean;
  make: (f: InquiryFacts) => Pick<Requirement, 'name' | 'category' | 'priority' | 'verification_method'> & Partial<Requirement>;
  question?: string;
}
const REQ_RULES: ReqRule[] = [
  { test: (f) => /2d code|dmc|data ?matrix|barcode|qr/.test(f.text.toLowerCase()), make: () => ({ name: 'Mark a 2D code on each part', category: 'Process', priority: 'Must', verification_method: 'Test', acceptance_criterion: 'Code content, size and minimum grade (e.g. ISO/IEC 29158) — UNKNOWN, to agree' }), question: 'Code content, cell size and minimum grade?' },
  { test: (f) => !!f.families.mark && !/2d code|dmc|data ?matrix|barcode|qr/.test(f.text.toLowerCase()), make: () => ({ name: 'Laser marking of the specified content', category: 'Process', priority: 'Must', verification_method: 'Test' }), question: 'Mark content, size and contrast requirement?' },
  { test: (f) => !!f.families.weld, make: () => ({ name: 'Laser weld the specified joint', category: 'Process', priority: 'Must', verification_method: 'Test', acceptance_criterion: 'Penetration / strength / leak criteria — UNKNOWN' }), question: 'Joint design, material stack and strength or leak criterion?' },
  { test: (f) => !!f.families.cut, make: () => ({ name: 'Laser cut / singulate to drawing', category: 'Process', priority: 'Must', verification_method: 'Test' }), question: 'Contour tolerance, kerf/HAZ limits and material thickness?' },
  { test: (f) => !!f.families.clean, make: () => ({ name: 'Laser clean the specified surface', category: 'Process', priority: 'Must', verification_method: 'Test' }), question: 'Contaminant, substrate and cleanliness acceptance method?' },
  { test: (f) => f.perHour != null || f.scale === 'high' || /throughput|uph|high volume|high speed/.test(f.text.toLowerCase()), make: (f) => ({ name: f.perHour ? `Throughput ${f.perHour} parts/h` : 'High throughput', category: 'Performance', priority: 'Must', verification_method: 'Test', value: f.perHour ? String(f.perHour) : undefined, unit: 'UPH', acceptance_criterion: 'Run-at-rate at FAT (Handbook Part 38); multi-day run at SAT' }), question: 'Required good units per day/hour, shift pattern and OEE target?' },
  { test: (f) => /automatic handling|auto(matic|mated)? load|unload|handling|automation/.test(f.text.toLowerCase()), make: () => ({ name: 'Automatic part handling (load / unload)', category: 'Functional', priority: 'Must', verification_method: 'Demonstration' }), question: 'Part presentation: strip, tray, magazine, reel or loose? Variants?' },
  { test: (f) => f.needs.includes('visver') || /vision|inspect|verif|grading/.test(f.text.toLowerCase()), make: () => ({ name: 'In-machine vision inspection / verification', category: 'Quality', priority: 'Must', verification_method: 'Test', acceptance_criterion: 'Inspection criteria (decode, grade, position) — UNKNOWN' }), question: 'What must vision check, and what happens to a failed part?' },
  { test: (f) => /\bmes\b|secs|gem\b|traceab|host/.test(f.text.toLowerCase()), make: () => ({ name: 'MES / host communication', category: 'Interface', priority: 'Must', verification_method: 'Test' }), question: 'Host protocol (SECS/GEM, OPC UA, REST…) and data dictionary?' },
  { test: (f) => f.customerSuppliesLaser, make: () => ({ name: 'Laser source supplied by customer (free issue)', category: 'Interface', priority: 'Must', verification_method: 'Inspection' }), question: 'Customer laser make/model, control interface, interlocks and warranty boundary?' },
  { test: (f) => f.needs.includes('conveyor') || /inline|in-line|conveyor|smema/.test(f.text.toLowerCase()), make: () => ({ name: 'Inline integration with upstream/downstream equipment', category: 'Interface', priority: 'Must', verification_method: 'Demonstration' }), question: 'Line handshake standard (SMEMA/Hermes), conveyor height and direction?' },
  { test: (f) => f.needs.includes('cleanrm'), make: () => ({ name: 'Cleanroom compatibility', category: 'Environment', priority: 'Must', verification_method: 'Inspection' }), question: 'Cleanroom class at the installation site?' },
  { test: () => true, make: () => ({ name: 'Laser safety: Class 1 enclosed system', category: 'Safety', priority: 'Should', verification_method: 'Inspection', acceptance_criterion: 'Conformity to IEC 60825-1 (INFERRED default for enclosed systems — confirm)' }) },
];

/** Build the full draft package for an inquiry. Pure: persists nothing. */
export function buildDraftPackage(text: string, ctx: InquiryContext): DraftPackage {
  const today = ctx.today ?? todayIso();
  const facts = parseInquiry(text, ctx.lexicon);
  const e = ctx.engine;
  const materialNames = new Map(ctx.materials.map((m) => [m.id.replace(/^mat-/, ''), m.name]));
  const matches = matchPlatforms(facts, [...e.products.values()], e.sources, materialNames, ctx.applications);
  const top = matches[0];
  const oppId = ctx.newId('opportunity');
  const title = top ? `${top.product.name} — ${top.product.applications.find((a) => a.key === top.appKey)?.name}` : 'Unmatched inquiry';
  const openQuestions: string[] = [];

  const opportunity: Opportunity = {
    id: oppId,
    entity: 'opportunity',
    name: `Inquiry: ${text.slice(0, 70)}${text.length > 70 ? '…' : ''}`,
    stage: 'Requirement',
    customer_id: ctx.customerId,
    inquiry_text: text,
    industry: facts.industry ?? undefined,
    product_id: top ? top.product.id : undefined,
    value: null,
    probability: null,
    technical_status: top ? `Candidate platform: ${title} (score ${top.score})` : 'No catalogue platform matched — new development candidate',
    commercial_status: 'Not discussed',
    status: 'Active',
    next_action: { action: 'Review the draft package with the customer; confirm open questions', due: addDays(today, 3) },
    ...DRAFT('Generated from customer inquiry text'),
  };

  const requirements: Requirement[] = [];
  let n = 1;
  for (const rule of REQ_RULES) {
    if (!rule.test(facts)) continue;
    const r = rule.make(facts);
    requirements.push({
      id: ctx.newId('requirement'),
      entity: 'requirement',
      code: `URS-${String(n++).padStart(3, '0')}`,
      level: 'URS',
      source: text,
      opportunity_id: oppId,
      status: 'Draft',
      next_action: { action: rule.question ? `Confirm with customer: ${rule.question}` : 'Confirm with customer' },
      ...r,
      ...DRAFT('Requirement drafted by rule from the inquiry text'),
    } as Requirement);
    if (rule.question) openQuestions.push(rule.question);
  }

  // Application + process candidates
  const application = top ? (ctx.applications.find((a) => a.id === `app-${top.product.key}.${top.appKey}`) ?? null) : null;
  const processCandidates = matches.map((m) => {
    const s0 = e.withApplication(e.initialState(m.product.key), m.appKey);
    const ph = e.physics(s0);
    const app = m.product.applications.find((a) => a.key === m.appKey);
    return {
      product: m.product.name,
      application: app?.name ?? m.appKey,
      source: e.sources.get(s0.sourceKey ?? '')?.name ?? s0.sourceKey ?? '—',
      regime: ph?.regime?.name ?? null,
      spot_um: ph?.spot.value ?? null,
      score: m.score,
      why: m.why.map((w) => `${w.t}: ${w.d}`).join('; '),
    };
  });
  if (!matches.length) openQuestions.push('No catalogue platform matched: what process, material and part is this?');

  // Configuration with needs + recommendations applied
  let configuration: Configuration | null = null;
  let state: ConfigState | null = null;
  const reusableModules: DraftPackage['reusableModules'] = [];
  if (top) {
    state = e.withApplication(e.initialState(top.product.key), top.appKey);
    for (const k of state.modules) reusableModules.push({ key: k, name: e.modules.get(k)?.name ?? k, status: 'Standard content' });
    for (const need of facts.needs) {
      if (e.modules.has(need) && e.modFits(top.product, need) && !state.modules.includes(need)) {
        state = { ...state, modules: [...state.modules, need] };
        reusableModules.push({ key: need, name: e.modules.get(need)!.name, status: 'Requested need' });
      }
    }
    for (const hit of e.recommendations(state)) {
      state = e.applyRecommendation(state, hit);
      for (const i of hit.items) if (i.type !== 'std' && !reusableModules.some((x) => x.key === i.key)) reusableModules.push({ key: i.key, name: i.name, status: 'Recommended' });
    }
    // drop conflicting pairs introduced by combining needs and recommendations (keep the first)
    for (const c of e.conflicts(state)) state = { ...state, modules: state.modules.filter((k) => k !== c.b.replace(/^mod-/, '')) };
    if (facts.perHour) state = { ...state, targetPerHour: facts.perHour };
    const price = e.price(state);
    const ph = e.physics(state);
    configuration = {
      id: ctx.newId('configuration'),
      entity: 'configuration',
      name: `Draft configuration — ${title}`,
      product_id: top.product.id,
      application_key: state.appKey,
      source_key: state.sourceKey,
      power_w: state.powerW,
      lens_key: state.lensKey,
      modules: state.modules,
      software: state.software,
      extras: state.extras,
      ...(state.targetPerHour ? { target_per_hour: state.targetPerHour } : {}),
      designation: e.designation(state) ?? undefined,
      opportunity_id: oppId,
      customer_id: ctx.customerId,
      version: 1,
      snapshot: {
        price_estimate_inr: price.value,
        price_band_inr: price.band,
        spot_um: ph?.spot.value ?? null,
        dof_mm: ph?.dof.value ?? null,
        warnings: e.compatibility(state).filter((c) => c.status !== 'OK').map((c) => `${c.check}: ${c.detail}`),
        computed_at: today,
      },
      ...DRAFT('Configured by the inquiry workflow: platform defaults + inquiry needs + recommendation rules'),
    };
  }

  // POC + DOE plan
  let poc: Poc | null = null;
  let doe: Doe | null = null;
  if (top && state) {
    const fam = top.product.family_id.replace(/^fam-/, '');
    const app = top.product.applications.find((a) => a.key === state!.appKey);
    const src = e.sources.get(state.sourceKey ?? '');
    const powers = e.powersFor(top.product, state.sourceKey);
    const pIdx = Math.max(0, powers.indexOf(state.powerW ?? powers[0]));
    const powerLevels = [...new Set([powers[Math.max(0, pIdx - 1)], powers[pIdx], powers[Math.min(powers.length - 1, pIdx + 1)]])];
    const responses: Record<string, { name: string; unit?: string }[]> = {
      mark: [{ name: 'Code grade (0–4)' }, { name: 'Mark contrast', unit: '%' }],
      semi: [{ name: 'Code grade (0–4)' }, { name: 'Mark depth', unit: 'µm' }],
      volt: [{ name: 'Code grade (0–4)' }, { name: 'Mark contrast', unit: '%' }],
      weld: [{ name: 'Penetration depth', unit: 'mm' }, { name: 'Joint strength', unit: 'N' }],
      cut: [{ name: 'Kerf width', unit: 'µm' }, { name: 'HAZ width', unit: 'µm' }],
      clean: [{ name: 'Residual contamination', unit: '%' }, { name: 'Substrate roughness change', unit: 'µm' }],
      auto: [{ name: 'Cycle time', unit: 's' }],
    };
    const factors: Doe['factors'] = [{ name: 'Average power', unit: 'W', levels: powerLevels }];
    if (fam === 'weld') factors.push({ name: 'Weld speed', unit: 'mm/s', levels: [50, 100, 150] });
    else factors.push({ name: 'Scan speed', unit: 'mm/s', levels: [500, 1000, 2000] });
    if (src?.mode === 'pulsed' && src.repetition_rate_khz) {
      const [lo, hi] = src.repetition_rate_khz;
      factors.push({ name: 'Pulse frequency', unit: 'kHz', levels: [...new Set([lo, Math.round(Math.sqrt(lo * hi)), hi])] });
    }
    const runs: Doe['runs'] = [];
    const resp = responses[fam] ?? [{ name: 'Primary response' }];
    const rec = (i: number, acc: Record<string, number | string>) => {
      if (i === factors.length) {
        runs.push({ run: runs.length + 1, settings: acc, results: Object.fromEntries(resp.map((r) => [r.name, null])) });
        return;
      }
      for (const l of factors[i].levels) rec(i + 1, { ...acc, [factors[i].name]: l });
    };
    rec(0, {});
    const pocId = ctx.newId('poc');
    const doeId = ctx.newId('doe');
    doe = {
      id: doeId,
      entity: 'doe',
      name: `DOE plan — ${app?.name ?? 'process'}`,
      poc_id: pocId,
      design: 'full_factorial',
      factors,
      responses: resp.map((r) => ({ ...r, lsl: null, usl: null, target: null })),
      constraints: ['Speed levels are ASSUMED starting points — adjust after the first trial'],
      noise_factors: ['Material lot', 'Surface condition'],
      replicates: 1,
      runs,
      ...DRAFT('DOE plan generated from the configuration; no results'),
    };
    poc = {
      id: pocId,
      entity: 'poc',
      name: `POC — ${app?.name ?? title}`,
      poc_status: 'Planned',
      opportunity_id: oppId,
      customer_id: ctx.customerId,
      application_id: application?.id,
      product_id: top.product.id,
      objective: `Establish a process window for "${app?.name ?? 'the process'}" on customer parts at the required rate`,
      part: 'Customer samples — type and quantity UNKNOWN',
      material_id: app?.material_key ? `mat-${app.material_key}` : undefined,
      source_id: state.sourceKey ? `las-${state.sourceKey}` : undefined,
      power_w: state.powerW ?? null,
      optic_id: state.lensKey ? `opt-${state.lensKey}` : undefined,
      doe_id: doeId,
      decision: 'Undecided',
      open_questions: ['Sample quantity and representativeness?', 'Measurement method for each response?'],
      next_action: { action: 'Request representative samples', due: addDays(today, 7) },
      ...DRAFT('POC plan generated from the inquiry'),
    };
  }

  // Preliminary BOM (list-price estimates) and cost assumptions
  let bom: Bom | null = null;
  let costModel: CostModel | null = null;
  const supplierNeeds: DraftPackage['supplierNeeds'] = [];
  if (top && state) {
    const p = top.product;
    const src = e.sources.get(state.sourceKey ?? '');
    const lines: BomLine[] = bomLinesFromConfig(e, state, { customerSuppliesLaser: facts.customerSuppliesLaser });
    bom = {
      id: ctx.newId('bom'),
      entity: 'bom',
      name: `Preliminary BOM — ${p.name}`,
      bom_type: 'EBOM',
      revision: 'P0',
      product_id: p.id,
      configuration_id: configuration?.id,
      lines,
      ...DRAFT('Preliminary BOM from configuration; unit costs are configurator list-price ESTIMATES'),
    };
    costModel = {
      id: ctx.newId('cost_model'),
      entity: 'cost_model',
      name: `Cost assumptions — ${p.name}`,
      currency: 'INR',
      qty: 1,
      bom_id: bom.id,
      configuration_id: configuration?.id,
      opportunity_id: oppId,
      product_id: p.id,
      lines: { material: costMaterialLinesFromBom(lines) },
      landed: { freightPct: 2, dutyPct: 0, landingPct: 1.5, gstPct: 18, siteContPct: 8 },
      markup: { overheadPct: 14, contingencyPct: 3, profitPct: 18 },
      scenario: 'Base',
      assumptions: [...BOM_COST_ASSUMPTIONS],
      ...DRAFT('Cost assumptions generated from the preliminary BOM'),
    };
    // Supplier needs
    const byCat = (re: RegExp) => ctx.suppliers.filter((s) => re.test(String(s.category ?? ''))).map((s) => ({ id: s.id, name: s.name, basis: `${s.data_type} vendor master` }));
    if (!facts.customerSuppliesLaser) {
      const cls = src?.categories ?? [];
      const techRe = cls.includes('CO2') ? /co₂|co2/i : cls.includes('Ultrafast') ? /ultrafast/i : cls.includes('UV') || cls.includes('Green') ? /dpss uv and green/i : cls.includes('CW') ? /cw fiber|direct diode/i : /pulsed fiber/i;
      supplierNeeds.push({
        need: `Laser source: ${src?.name ?? state.sourceKey} ${state.powerW ?? ''} W`,
        candidates: [
          ...ctx.companies.filter((c) => (c.technologies ?? []).some((t) => techRe.test(t))).map((c) => ({ id: c.id, name: c.name, basis: 'Named in Laser Handbook §21.3 (representative supplier)' })),
          ...byCat(/laser/i),
        ].slice(0, 8),
      });
    }
    if (state.modules.some((k) => /vis/.test(k))) supplierNeeds.push({ need: 'Machine vision (camera, lighting, verification)', candidates: byCat(/vision|sensor/i) });
    supplierNeeds.push({ need: 'Galvo scan head / f-theta objective', candidates: byCat(/galvo|scanner|optic/i) });
    supplierNeeds.push({ need: 'PLC, drives and safety controller', candidates: byCat(/plc|drive/i) });
    if (state.modules.some((k) => /conveyor|magazine|traytwr|robot|shuttle|rotoidx|turntbl/.test(k))) supplierNeeds.push({ need: 'Motion & handling components', candidates: byCat(/motion|linear|cobot|standard parts/i) });
    for (const sn of supplierNeeds) if (!sn.candidates.length) openQuestions.push(`No supplier on record for: ${sn.need}`);
  }

  // Risks from unknowns
  const risks: Risk[] = [];
  const risk = (name: string, cause: string, effect: string, kind: Risk['kind'] = 'Risk') =>
    risks.push({ id: ctx.newId('risk'), entity: 'risk', kind, name, cause, effect, risk_status: 'Open', opportunity_id: oppId, next_action: { action: 'Score S/O/D and assign owner' }, ...DRAFT('Risk drafted from an unknown in the inquiry') });
  if (facts.perHour == null) risk('Throughput target not quantified', 'Inquiry does not state a rate', 'Architecture (stations, heads, handling) cannot be sized', 'Process Risk');
  if (facts.customerSuppliesLaser) risk('Customer-supplied laser: interface and responsibility boundary', 'Laser model and interface unknown', 'Integration rework; unclear FAT/SAT responsibility');
  if (configuration?.snapshot?.warnings.some((w) => /UNKNOWN/.test(w))) risk('Optics compatibility not verified', 'Coating, damage threshold and scanner aperture data not held', 'Optic damage or clipping on the real machine', 'Machine FMEA');
  if (!Object.keys(facts.materials).length) risk('Material not identified', 'Inquiry does not name the material', 'Process window cannot be established', 'Process Risk');
  if (!matches.length) risk('No catalogue platform fits', 'Inquiry outside current portfolio', 'New development: cost and schedule risk');

  // G0 checklist from the handbook gate definition
  const g0 = ctx.gates.find((g) => g.code === 'G0');
  const g0Checklist = (g0?.mandatory_evidence ?? []).map((item) => ({
    item,
    status: /assumptions|ctq|urs/i.test(item) && requirements.length ? ('draft' as const) : ('missing' as const),
    note: /urs/i.test(item) ? `${requirements.length} draft URS lines — values not yet signed by the customer` : /assumptions/i.test(item) ? `${(costModel?.assumptions ?? []).length} cost assumptions + open questions recorded` : 'Not yet available',
  }));

  // Project skeleton: gate-aligned phases scaled to the platform lead time (ASSUMED split)
  let project: Project | null = null;
  if (top) {
    const weeks = top.product.lead_time_weeks ?? 26;
    const split: [string, string, number][] = [
      ['G0', 'Requirement review — URS signed', 0.06],
      ['G1', 'Concept review — POC on samples', 0.1],
      ['G2', 'Architecture review', 0.08],
      ['G3', 'Detailed design review', 0.16],
      ['G4', 'Procurement release', 0.06],
      ['G5', 'Manufacturing readiness', 0.1],
      ['G6', 'Assembly readiness', 0.1],
      ['G7', 'Integration readiness', 0.12],
      ['G8', 'FAT readiness — FAT', 0.08],
      ['G9', 'SAT readiness — ship, install, SAT', 0.1],
      ['G10', 'Production release', 0.04],
    ];
    let d = today;
    const tasks = split.map(([code, name, frac], i) => {
      const days = Math.max(3, Math.round(weeks * 7 * frac));
      const t = { id: `t${i + 1}`, name, start: d, end: addDays(d, days), status: 'Not Started' as const, gate_code: code, depends_on: i ? [`t${i}`] : [], milestone: ['G8', 'G9', 'G10'].includes(code) };
      d = addDays(d, days);
      return t;
    });
    project = {
      id: ctx.newId('project'),
      entity: 'project',
      name: `Project skeleton — ${title}`,
      customer_id: ctx.customerId,
      opportunity_id: oppId,
      product_id: top.product.id,
      configuration_id: configuration?.id,
      bom_id: bom?.id,
      cost_model_id: costModel?.id,
      scope: text,
      start: today,
      end: d,
      currency: 'INR',
      budget: null,
      tasks,
      gates: [],
      status: 'Draft',
      next_action: { action: 'Complete G0 evidence', due: addDays(today, 7) },
      ...DRAFT(`Schedule = ${weeks}-week platform lead time split across gates by ASSUMED percentages`),
    };
  }

  const records = [opportunity, ...requirements, configuration, poc, doe, bom, costModel, ...risks, project].filter(Boolean) as AnyRecord[];
  return { facts, matches, opportunity, requirements, application, processCandidates, configuration, poc, doe, bom, costModel, supplierNeeds, risks, openQuestions: [...new Set(openQuestions)], g0Checklist, project, reusableModules, records };
}

export const reusableProductsFor = (pkg: DraftPackage): Product[] => pkg.matches.map((m) => m.product);
export type { Module };
