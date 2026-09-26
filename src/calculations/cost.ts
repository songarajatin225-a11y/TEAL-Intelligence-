import { calc, input, part54, positive, type CalcResult } from './types';

/*
 * TEAL COST ENGINE — ported from the legacy TEAL Costing & Estimation Platform
 * (TEAL-COST-DEMO-7-8/assets/app.js: MODULES[].calc, computeProject, tealSheet, approvalFloor,
 * crateSqm) and extended per spec §48–§50 (landed cost with dated FX, ROI, payback, cost per part,
 * life-cycle cost, scenarios). Behaviour of the ported functions is kept identical; tests in
 * tests/unit/cost.test.ts pin it.
 */

export const N = (v: unknown): number => {
  const x = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(x) ? x : 0;
};

export interface FxRate {
  code: string;
  rate_to_inr: number;
  as_of: string | null;
  source: string;
}
export type FxTable = Record<string, FxRate>;

export function fxTable(rates: FxRate[]): FxTable {
  return Object.fromEntries(rates.map((r) => [r.code, r]));
}

export function fxOf(fx: FxTable, code: string | undefined): number {
  if (!code || code === 'INR') return 1;
  const r = fx[code];
  return r ? r.rate_to_inr : NaN;
}

export type LineRow = Record<string, unknown>;

/** Crate surface area — plywood consumed, both faces of six sides (legacy crateSqm). */
export function crateSqm(r: LineRow): number {
  const L = N(r.len) / 1000;
  const W = N(r.wid) / 1000;
  const H = N(r.hgt) / 1000;
  if (!L || !W || !H) return 0;
  return 2 * (L * W + L * H + W * H) * Math.max(1, N(r.boxes) || 1);
}

export const COST_MODULE_KEYS = [
  'material',
  'mechanical',
  'electrical',
  'software',
  'manufacturing',
  'labour',
  'design',
  'site',
  'commercial',
  'commissioning',
  'packaging',
  'amc',
] as const;
export type CostModuleKey = (typeof COST_MODULE_KEYS)[number];

/** Equipment (direct) modules — everything except AMC, which is quoted separately. */
export const EQUIP_KEYS: CostModuleKey[] = ['material', 'mechanical', 'electrical', 'software', 'manufacturing', 'labour', 'commissioning', 'design', 'site', 'packaging', 'commercial'];

export const COST_MODULE_META: Record<CostModuleKey, { label: string; formula: string }> = {
  material: { label: 'Material (landed BOM)', formula: 'qty × unit price × FX' },
  mechanical: { label: 'Mechanical', formula: 'qty × rate' },
  electrical: { label: 'Electrical', formula: 'qty × unit price' },
  software: { label: 'Software & controls', formula: 'mandays × rate' },
  manufacturing: { label: 'Manufacturing (machine-hour)', formula: '(setup h + run h) × rate' },
  labour: { label: 'Labour', formula: 'mandays × rate + OT h × OT rate' },
  design: { label: 'Design & engineering (incl. NRE)', formula: 'mandays × rate + NRE' },
  site: { label: 'Site & installation', formula: 'persons × days × rate (+ site contingency)' },
  commercial: { label: 'Commercial', formula: 'lump sum or % of preceding direct cost' },
  commissioning: { label: 'Commissioning', formula: 'hours × rate' },
  packaging: { label: 'Packing & crating', formula: '2(LW+LH+WH) × boxes × rate/m²' },
  amc: { label: 'AMC (quoted separately)', formula: 'Σ visits × cost × (1+esc)^year' },
};

/** Per-line amount for a module (legacy MODULES[].calc). */
export function lineAmount(key: CostModuleKey, r: LineRow, fx: FxTable, ctx?: { directBase: number }): number {
  switch (key) {
    case 'material':
      return N(r.qty) * N(r.price) * fxOf(fx, (r.cur as string) || 'INR');
    case 'mechanical':
    case 'electrical':
      return N(r.qty) * N(r.rate);
    case 'software':
      return N(r.md) * N(r.rate);
    case 'manufacturing':
      return (N(r.setup) + N(r.hrs)) * N(r.rate);
    case 'labour':
      return N(r.md) * N(r.rate) + N(r.ot) * N(r.otr);
    case 'design':
      return N(r.md) * N(r.rate) + N(r.nre);
    case 'site':
      return Math.max(1, N(r.pax)) * Math.max(1, N(r.days)) * N(r.rate);
    case 'commercial':
      return r.basis === '% of direct cost' ? ((ctx?.directBase ?? 0) * N(r.val)) / 100 : N(r.val);
    case 'commissioning':
      return N(r.hrs) * N(r.rate);
    case 'packaging':
      return crateSqm(r) * N(r.rate);
    case 'amc': {
      const base = N(r.visits) * N(r.rate);
      const e = N(r.esc) / 100;
      const y = Math.max(1, Math.round(N(r.yrs) || 1));
      let t = 0;
      for (let i = 0; i < y; i++) t += base * Math.pow(1 + e, i);
      return t;
    }
  }
}

export interface CostInputs {
  qty: number;
  lines: Partial<Record<string, LineRow[]>>;
  landed: { freightPct: number; dutyPct: number; landingPct: number; gstPct: number; siteContPct: number };
  markup: { overheadPct: number; contingencyPct: number; profitPct: number };
}

export interface CostResult {
  lines: Record<string, (LineRow & { _amt: number })[]>;
  buckets: Record<CostModuleKey, number>;
  basic: number;
  freight: number;
  duty: number;
  landing: number;
  gst: number;
  siteBase: number;
  direct: number;
  overheads: number;
  contingency: number;
  totalCost: number;
  profit: number;
  selling: number;
  amc: number;
  qty: number;
  orderValue: number;
  perUnit: number;
  grossMargin: number;
  netMargin: number;
  contractValue: number;
  warnings: string[];
}

/** Legacy computeProject(): direct → overheads → contingency → profit → selling. INR. */
export function computeCost(p: CostInputs, fx: FxTable): CostResult {
  const warnings: string[] = [];
  const lines: Record<string, (LineRow & { _amt: number })[]> = {};
  const buckets = Object.fromEntries(COST_MODULE_KEYS.map((k) => [k, 0])) as Record<CostModuleKey, number>;
  for (const key of COST_MODULE_KEYS) {
    if (key === 'commercial') continue;
    const rows = (p.lines[key] ?? []).map((r) => ({ ...r, _amt: lineAmount(key, r, fx) }));
    for (const r of rows) {
      if (!Number.isFinite(r._amt)) {
        warnings.push(`${COST_MODULE_META[key].label}: no FX rate for "${String(r.cur)}" on "${String(r.item ?? r.desc ?? '')}" — line excluded`);
        r._amt = 0;
      }
    }
    lines[key] = rows;
    buckets[key] = rows.reduce((s, r) => s + r._amt, 0);
  }
  const basic = buckets.material;
  const freight = (basic * N(p.landed.freightPct)) / 100;
  const duty = (basic * N(p.landed.dutyPct)) / 100;
  const landing = (basic * N(p.landed.landingPct)) / 100;
  const gst = ((basic + freight + duty + landing) * N(p.landed.gstPct)) / 100;
  buckets.material = basic + freight + duty + landing;

  const siteBase = buckets.site;
  buckets.site = siteBase * (1 + N(p.landed.siteContPct) / 100);

  const directBase = EQUIP_KEYS.filter((k) => k !== 'commercial').reduce((s, k) => s + buckets[k], 0);
  const cRows = (p.lines.commercial ?? []).map((r) => ({ ...r, _amt: lineAmount('commercial', r, fx, { directBase }) }));
  lines.commercial = cRows;
  buckets.commercial = cRows.reduce((s, r) => s + r._amt, 0);

  const qty = Math.max(1, N(p.qty) || 1);
  const direct = EQUIP_KEYS.reduce((s, k) => s + buckets[k], 0);
  const overheads = (direct * N(p.markup.overheadPct)) / 100;
  const contingency = ((direct + overheads) * N(p.markup.contingencyPct)) / 100;
  const totalCost = direct + overheads + contingency;
  const profit = (totalCost * N(p.markup.profitPct)) / 100;
  const selling = totalCost + profit;
  const amc = buckets.amc;
  return {
    lines,
    buckets,
    basic,
    freight,
    duty,
    landing,
    gst,
    siteBase,
    direct,
    overheads,
    contingency,
    totalCost,
    profit,
    selling,
    amc,
    qty,
    orderValue: selling * qty,
    perUnit: selling,
    grossMargin: selling ? (selling - direct) / selling : 0,
    netMargin: selling ? profit / selling : 0,
    contractValue: selling * qty + amc,
    warnings,
  };
}

export interface TealParams {
  insurancePct: number;
  sgaPct: number;
  warrantyPct: number;
  profitPct: number;
  ossMonthly: number;
  stationHc: number;
  ossMonths: number;
  packRate: number;
}
export const TEAL_DEFAULTS: TealParams = { insurancePct: 0.05, sgaPct: 8, warrantyPct: 2.5, profitPct: 12, ossMonthly: 65000, stationHc: 0.5, ossMonths: 12, packRate: 1600 };

export interface TealSheet {
  T: TealParams;
  rawMat: number;
  boughts: number;
  mfgParts: number;
  packFwd: number;
  insurance: number;
  boarding: number;
  A: number;
  assembly: number;
  installation: number;
  debugOqc: number;
  engineering: number;
  otherComm: number;
  sgaPctAmt: number;
  sga: number;
  ossFormula: number;
  oss: number;
  B: number;
  C: number;
  D: number;
  profit: number;
  warranty: number;
  divisor: number;
  netMargin: number;
  qty: number;
  orderValue: number;
}

/** TEAL cost sheet A/B/C/D — legacy tealSheet(). D = C / (1 − profit% − warranty%) (Handbook C1). */
export function tealSheet(c: CostResult, params?: Partial<TealParams>): TealSheet {
  const T = { ...TEAL_DEFAULTS, ...(params ?? {}) };
  const mat = c.lines.material ?? [];
  const isRaw = (r: LineRow) => r.cls === 'Raw Material' || r.cls === 'Consumable';
  const rawMat = mat.filter(isRaw).reduce((s, r) => s + r._amt, 0);
  const boughts = mat.filter((r) => !isRaw(r)).reduce((s, r) => s + r._amt, 0);
  const mfgParts = c.buckets.manufacturing + c.buckets.mechanical + c.buckets.electrical;

  const commLines = c.lines.commercial ?? [];
  const fwdHeads = ['Outward Freight', 'Export Packaging', 'Transit Insurance'];
  const packFwdComm = commLines.filter((r) => fwdHeads.includes(String(r.head))).reduce((s, r) => s + r._amt, 0);
  const otherComm = c.buckets.commercial - packFwdComm;
  const packFwd = c.buckets.packaging + packFwdComm;

  const insurance = ((rawMat + boughts + mfgParts + packFwd) * N(T.insurancePct)) / 100;
  const boarding = c.buckets.site;
  const A = rawMat + boughts + mfgParts + packFwd + insurance + boarding;

  const cm = (acts: string[]) => (c.lines.commissioning ?? []).filter((r) => acts.includes(String(r.act))).reduce((s, r) => s + r._amt, 0);
  const lb = (acts: string[]) => (c.lines.labour ?? []).filter((r) => acts.includes(String(r.item))).reduce((s, r) => s + r._amt, 0);
  const assembly = cm(['Assembly Mechanical', 'Assembly Electrical']) + lb(['Mechanical Assembly', 'Electrical Assembly']);
  const installation = cm(['Dispatch']) + lb(['Installation', 'Commissioning', 'Packing']);
  const debugOqc =
    cm(['Testing Mechanical', 'Programming & Testing', 'OQC', 'LBU - SW']) + lb(['Functional Testing', 'In-process Inspection', 'Operator Training', 'As-built Documentation']);

  const engineering = c.buckets.design + c.buckets.software;
  const sgaBase = A + assembly + installation + debugOqc;
  const sgaPctAmt = (sgaBase * N(T.sgaPct)) / 100;
  const sga = engineering + otherComm + sgaPctAmt;

  const ossFormula = N(T.ossMonthly) * N(T.stationHc) * N(T.ossMonths);
  const oss = cm(['LBU - OSS']) + ossFormula;

  const B = assembly + installation + debugOqc + sga + oss;
  const C = A + B;
  const pPct = N(T.profitPct) / 100;
  const wPct = N(T.warrantyPct) / 100;
  const divisor = 1 - pPct - wPct;
  const D = divisor > 0.05 ? C / divisor : C;
  const profit = D * pPct;
  const warranty = D * wPct;
  return {
    T,
    rawMat,
    boughts,
    mfgParts,
    packFwd,
    insurance,
    boarding,
    A,
    assembly,
    installation,
    debugOqc,
    engineering,
    otherComm,
    sgaPctAmt,
    sga,
    ossFormula,
    oss,
    B,
    C,
    D,
    profit,
    warranty,
    divisor,
    netMargin: D ? profit / D : 0,
    qty: c.qty,
    orderValue: D * c.qty,
  };
}

export interface ApprovalBand {
  band: string;
  approver: string;
  minMargin: number;
}
/** Legacy approvalFloor(): minimum margin by order-value band (INR). */
export function approvalFloor(orderValueINR: number, bands: ApprovalBand[]): ApprovalBand {
  const a = bands.length ? bands : [{ band: '—', approver: '—', minMargin: 20 }];
  const i = orderValueINR <= 2500000 ? 0 : orderValueINR <= 10000000 ? 1 : orderValueINR <= 50000000 ? 2 : 3;
  return a[Math.min(i, a.length - 1)];
}

/** Legacy price-to-win: mark-up and margin implied by a target unit price. */
export function priceToWin(target: number, c: CostResult): { markupPct: number; marginPct: number; gap: number } {
  return {
    markupPct: (target / (c.totalCost || 1) - 1) * 100,
    marginPct: target ? ((target - c.totalCost) / target) * 100 : 0,
    gap: target - c.selling,
  };
}

/* ------------------------------------------------ spec §49 landed cost */

export interface LandedCostInput {
  base_cost: number | null;
  currency: string;
  fx: FxRate | null;
  freight_pct?: number;
  insurance_pct?: number;
  duty_pct?: number;
  other_pct?: number;
}

/** C4 — Landed cost C = P_FOB·FX·(1 + d + f + c) (+ insurance). Preserves original currency, FX, date, source. */
export function landedCost(p: LandedCostInput): CalcResult & { original: { value: number | null; currency: string }; fx_used: FxRate | null } {
  const isInr = p.currency === 'INR';
  const fxRate = isInr ? 1 : (p.fx?.rate_to_inr ?? null);
  const r = calc(
    {
      id: 'landed_cost',
      label: 'Landed cost (INR)',
      formula: 'C = P_base·FX·(1 + freight + insurance + duty + other)',
      unit: 'INR',
      source: part54('C4', 'cost'),
      assumptions: [
        isInr ? 'Base cost already in INR' : `FX ${p.currency}→INR = ${p.fx?.rate_to_inr ?? 'UNKNOWN'} as of ${p.fx?.as_of ?? 'UNKNOWN DATE'} (source: ${p.fx?.source ?? 'UNKNOWN'})`,
        'Percentages applied to the converted base cost; GST/IGST treated as recoverable and excluded',
      ],
    },
    [
      input('P', `Base cost (${p.currency})`, p.base_cost, p.currency),
      input('FX', 'FX rate to INR', fxRate, 'INR/unit'),
      input('f', 'Freight', (p.freight_pct ?? 0) / 100, ''),
      input('i', 'Insurance', (p.insurance_pct ?? 0) / 100, ''),
      input('d', 'Duty', (p.duty_pct ?? 0) / 100, ''),
      input('c', 'Other applicable charges', (p.other_pct ?? 0) / 100, ''),
    ],
    (v) => v.P * v.FX * (1 + v.f + v.i + v.d + v.c),
  );
  if (!isInr && p.fx && !p.fx.as_of) r.warnings.push(`FX rate for ${p.currency} has no date — replace with a dated rate before quoting`);
  return { ...r, original: { value: p.base_cost, currency: p.currency }, fx_used: isInr ? null : p.fx };
}

/** C1 — price from margin P = C / (1 − GM − w) */
export function priceFromMargin(p: { cost?: number | null; gross_margin?: number | null; warranty?: number | null }): CalcResult {
  return calc(
    { id: 'price_from_margin', label: 'Price from target margin', formula: 'P = C / (1 − GM − w)', unit: 'INR', source: part54('C1', 'cost'), assumptions: ['Margin and warranty as fractions of price (grossed up, not marked up)'] },
    [input('C', 'Cost', p.cost, 'INR'), input('GM', 'Target gross margin', p.gross_margin, ''), input('w', 'Warranty provision', p.warranty ?? 0, '')],
    (v) => v.C / (1 - v.GM - v.w),
    (v) => (v.GM + v.w >= 1 ? 'GM + w must be < 1' : null),
  );
}

/** C6 — payback PB = capex / net annual saving → years */
export function payback(p: { capex?: number | null; annual_saving?: number | null; annual_operating_cost?: number | null }): CalcResult {
  return calc(
    { id: 'payback', label: 'Payback period (customer)', formula: 'PB = capex / (annual saving − annual operating cost)', unit: 'years', source: part54('C6', 'cost'), assumptions: ['Undiscounted; savings and costs constant each year'] },
    [input('capex', 'Capital cost (price paid)', p.capex, 'INR'), input('S', 'Annual saving', p.annual_saving, 'INR/yr'), input('O', 'Annual operating cost', p.annual_operating_cost ?? 0, 'INR/yr')],
    (v) => v.capex / (v.S - v.O),
    (v) => (v.S - v.O <= 0 ? 'Net annual saving must be positive for payback to exist' : null),
  );
}

/** ROI over the life: (Σ net saving − capex) / capex */
export function roi(p: { capex?: number | null; annual_saving?: number | null; annual_operating_cost?: number | null; life_years?: number | null }): CalcResult {
  return calc(
    { id: 'roi', label: 'Return on investment (life)', formula: 'ROI = (L·(S − O) − capex) / capex', unit: '', source: { citation: 'Simple undiscounted ROI; payback per Handbook C6', formula_id: 'fml-c6' }, assumptions: ['Undiscounted; no residual value'] },
    [input('capex', 'Capital cost', p.capex, 'INR'), input('S', 'Annual saving', p.annual_saving, 'INR/yr'), input('O', 'Annual operating cost', p.annual_operating_cost ?? 0, 'INR/yr'), input('L', 'Life', p.life_years, 'years')],
    (v) => (v.L * (v.S - v.O) - v.capex) / v.capex,
    positive('capex', 'L'),
  );
}

/** Life-cycle cost = capex + L·O + AMC */
export function lifecycleCost(p: { capex?: number | null; annual_operating_cost?: number | null; life_years?: number | null; amc_total?: number | null }): CalcResult {
  return calc(
    { id: 'lcc', label: 'Life-cycle cost', formula: 'LCC = capex + L·O + AMC', unit: 'INR', source: { citation: 'Life-cycle cost (spec §9); service revenue context: Handbook §59.6' }, assumptions: ['Undiscounted'] },
    [input('capex', 'Capital cost', p.capex, 'INR'), input('O', 'Annual operating cost', p.annual_operating_cost ?? 0, 'INR/yr'), input('L', 'Life', p.life_years, 'years'), input('AMC', 'AMC total', p.amc_total ?? 0, 'INR')],
    (v) => v.capex + v.L * v.O + v.AMC,
  );
}

/** Cost per part = LCC / (annual parts · life) */
export function costPerPart(p: { lifecycle_cost?: number | null; annual_parts?: number | null; life_years?: number | null }): CalcResult {
  return calc(
    { id: 'cost_per_part', label: 'Equipment cost per part', formula: 'c = LCC / (N_year · L)', unit: 'INR/part', source: { citation: 'Derived from life-cycle cost' }, assumptions: ['Good parts; excludes material and labour of the part itself'] },
    [input('LCC', 'Life-cycle cost', p.lifecycle_cost, 'INR'), input('N', 'Parts per year', p.annual_parts, 'parts/yr'), input('L', 'Life', p.life_years, 'years')],
    (v) => v.LCC / (v.N * v.L),
    positive('N', 'L'),
  );
}

/** C8 — platform break-even N = I_platform / ΔC_machine */
export function platformBreakEven(p: { investment?: number | null; saving_per_machine?: number | null }): CalcResult {
  return calc(
    { id: 'platform_break_even', label: 'Platform break-even', formula: 'N = I_platform / ΔC_machine', unit: 'machines', source: part54('C8', 'cost') },
    [input('I', 'Platform investment', p.investment, 'INR'), input('ΔC', 'Saving per machine', p.saving_per_machine, 'INR')],
    (v) => v.I / v['ΔC'],
    positive('ΔC'),
  );
}

/** C9 — localization payback PB = C_qual / ((C_imp − C_loc)·N) */
export function localizationPayback(p: { qualification_cost?: number | null; import_cost?: number | null; local_cost?: number | null; annual_volume?: number | null }): CalcResult {
  return calc(
    { id: 'localization_payback', label: 'Localization payback', formula: 'PB = C_qual / ((C_imp − C_loc)·N)', unit: 'years', source: part54('C9', 'cost') },
    [input('Cq', 'Qualification cost', p.qualification_cost, 'INR'), input('Ci', 'Imported landed cost', p.import_cost, 'INR'), input('Cl', 'Localized cost', p.local_cost, 'INR'), input('N', 'Annual volume', p.annual_volume, 'units/yr')],
    (v) => v.Cq / ((v.Ci - v.Cl) * v.N),
    (v) => (v.Ci - v.Cl <= 0 ? 'Localized cost must be below imported cost' : v.N > 0 ? null : 'Volume must be > 0'),
  );
}

/** C2 — learning curve C_n = C₁·n^(log₂ b) */
export function learningCurve(p: { first_unit?: number | null; n?: number | null; b?: number | null }): CalcResult {
  return calc(
    { id: 'learning_curve', label: 'Learning curve (unit n)', formula: 'C_n = C₁·n^(log₂ b)', unit: 'same as C₁', source: part54('C2', 'cost'), assumptions: ['b typically 0.8–0.9'] },
    [input('C1', 'First-unit value', p.first_unit, ''), input('n', 'Unit number', p.n, ''), input('b', 'Learning rate', p.b, '')],
    (v) => v.C1 * Math.pow(v.n, Math.log2(v.b)),
    positive('C1', 'n', 'b'),
  );
}

/* ------------------------------------------------------ scenarios §50 */

export interface ScenarioDef {
  key: string;
  label: string;
  /** multipliers applied to module buckets before mark-up */
  material?: number;
  labour?: number;
  engineering?: number;
  site?: number;
  /** FX shock on non-INR material lines */
  fx?: number;
  /** import items (Import Item class) cost multiplier (localization) */
  import_items?: number;
  qty?: number;
  contingency_add_pct?: number;
  note: string;
}

/** Scenario presets — ASSUMPTIONS, editable per cost model. */
export const SCENARIO_PRESETS: ScenarioDef[] = [
  { key: 'base', label: 'Base', note: 'Cost model as entered.' },
  { key: 'optimistic', label: 'Optimistic', material: 0.95, labour: 0.95, engineering: 0.95, note: 'Assumed −5 % material, labour and engineering.' },
  { key: 'conservative', label: 'Conservative', material: 1.1, labour: 1.1, engineering: 1.15, contingency_add_pct: 2, note: 'Assumed +10 % material/labour, +15 % engineering, +2 pts contingency.' },
  { key: 'import_heavy', label: 'Import-heavy', fx: 1.05, note: 'Assumed 5 % adverse FX on foreign-currency lines.' },
  { key: 'localization', label: 'Localization', import_items: 0.85, note: 'Assumed imported items localized at −15 % (validate per item in Localization).' },
  { key: 'make_heavy', label: 'Make-heavy', material: 0.97, labour: 1.12, note: 'Assumed more in-house manufacture: −3 % material, +12 % labour.' },
  { key: 'buy_heavy', label: 'Buy-heavy', material: 1.06, labour: 0.9, note: 'Assumed more bought-out assemblies: +6 % material, −10 % labour.' },
  { key: 'high_volume', label: 'High-volume', qty: 10, engineering: 0.4, note: 'Assumed 10 units; engineering amortised (×0.4 per unit).' },
  { key: 'low_volume', label: 'Low-volume', qty: 1, note: 'Single unit.' },
  { key: 'customer_specific', label: 'Customer-specific', engineering: 1.3, site: 1.2, note: 'Assumed +30 % engineering, +20 % site for customer-specific scope.' },
];

export function applyScenario(p: CostInputs, s: ScenarioDef): CostInputs {
  const scale = (rows: LineRow[] | undefined, fields: string[], m: number | undefined) =>
    (rows ?? []).map((r) => (m == null ? r : Object.fromEntries(Object.entries(r).map(([k, v]) => [k, fields.includes(k) ? N(v) * m : v]))));
  const mat = (p.lines.material ?? []).map((r) => {
    let price = N(r.price);
    if (s.material != null) price *= s.material;
    if (s.fx != null && r.cur && r.cur !== 'INR') price *= s.fx;
    if (s.import_items != null && r.cls === 'Import Item') price *= s.import_items;
    return { ...r, price };
  });
  return {
    ...p,
    qty: s.qty ?? p.qty,
    lines: {
      ...p.lines,
      material: mat,
      labour: scale(p.lines.labour, ['rate', 'otr'], s.labour),
      commissioning: scale(p.lines.commissioning, ['rate'], s.labour),
      software: scale(p.lines.software, ['md'], s.engineering),
      design: scale(p.lines.design, ['md', 'nre'], s.engineering),
      site: scale(p.lines.site, ['rate'], s.site),
    },
    markup: { ...p.markup, contingencyPct: p.markup.contingencyPct + (s.contingency_add_pct ?? 0) },
  };
}
