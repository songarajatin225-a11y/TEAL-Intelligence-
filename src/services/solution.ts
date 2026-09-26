import type { AnyRecord } from '../domain';
import type { Application, BomLine, Domain, Localization, Product, Supplier } from '../domain/entities';
import type { ConfigState, ConfiguratorEngine } from '../features/configurator/engine';
import { architectureFromState, type ArchNode } from '../features/machines/architecture';
import { bomLinesFromConfig } from './bomGen';

/**
 * APPLICATION INTELLIGENCE ENGINE + UNIVERSAL CONFIGURATOR (final master prompt §14, §23).
 *
 *   Industry → Product (customer part) → Material → Process → Application → Technology → Machine → Subsystem
 *
 * Choices come only from records (domains, industries, materials, TEAL application records, laser
 * source classes, TEAL platforms). The outputs reuse the existing engines — the configurator
 * (physics, compatibility, price band), the architecture builder and the BOM generator — so the
 * answer is the same one those pages give. Every output says what it is based on.
 */
export const AUTOMATION_LEVELS = ['Manual', 'Semi-automatic', 'Inline', 'Fully automatic'] as const;
export type AutomationLevel = (typeof AUTOMATION_LEVELS)[number];

/** Published rule: which module families each automation level adds (first one that fits the platform). */
export const AUTOMATION_RULE: Record<AutomationLevel, string[][]> = {
  Manual: [],
  'Semi-automatic': [['shuttle', 'rotoidx', 'turntbl', 'rotary']],
  Inline: [['conveyor', 'r2r'], ['visfid']],
  'Fully automatic': [['robot6', 'cobotld'], ['conveyor', 'r2r'], ['visver'], ['reject']],
};

export interface SolutionInput {
  domainId?: string;
  industryId?: string;
  customerProduct?: string;
  materialId?: string;
  process?: string;
  applicationId?: string;
  sourceKey?: string;
  productKey?: string;
  automation?: AutomationLevel;
  throughputUph?: number | null;
  accuracyUm?: number | null;
}

export interface Options {
  domains: Domain[];
  industries: AnyRecord[];
  customerProducts: string[];
  materials: AnyRecord[];
  processes: string[];
  applications: Application[];
  sources: AnyRecord[];
  products: Product[];
}

export interface SubsystemView {
  lane: string;
  nodes: ArchNode[];
  suppliers: { id: string; name: string; basis: string }[];
}

export interface SolutionResult {
  application?: Application;
  product?: Product;
  state?: ConfigState;
  recommended: { source: string; power: number | null; rationale: string; basis: string } | null;
  requirements: { label: string; value: string; basis: string }[];
  subsystems: SubsystemView[];
  bom: BomLine[];
  priceBand: { value: number | null; band: [number, number] | null } | null;
  costDrivers: { line: BomLine; share: number | null }[];
  unknownCostLines: number;
  risks: string[];
  localization: { importLines: number; buyLines: number; records: Localization[]; statement: string };
  complexity: { level: 'Low' | 'Medium' | 'High'; reasons: string[] };
  addedModules: string[];
}

const industryMatch = (app: Application, ind: AnyRecord | undefined) => {
  if (!ind) return true;
  const code = String((ind as { code?: string }).code ?? ind.name).toLowerCase();
  return (app.industries ?? []).some((i) => i.toLowerCase().startsWith(code.split(/[ /]/)[0]) || code.startsWith(i.toLowerCase().split(' ')[0]));
};

export function solutionOptions(input: SolutionInput, records: AnyRecord[]): Options {
  const by = (e: string) => records.filter((r) => r.entity === e);
  const domains = (by('domain') as unknown as Domain[]).sort((a, b) => a.order - b.order);
  const domain = domains.find((d) => d.id === input.domainId);
  const industries = by('industry').filter((i) => !domain || !(domain.industry_ids?.length) || domain.industry_ids.includes(i.id));
  const industry = records.find((r) => r.id === input.industryId);
  let apps = (by('application') as unknown as Application[]).filter((a) => industryMatch(a, industry) && (!domain?.industry_ids?.length || industries.some((i) => industryMatch(a, i))));
  const matIds = new Set(apps.flatMap((a) => a.material_ids ?? []));
  const materials = by('material').filter((m) => !industry || matIds.has(m.id));
  if (input.materialId) apps = apps.filter((a) => (a.material_ids ?? []).includes(input.materialId!));
  const processes = [...new Set(apps.map((a) => String(a.process ?? '')).filter((p) => !!p && p !== 'Handling'))].sort();
  if (input.process) apps = apps.filter((a) => String(a.process) === input.process);
  const srcIds = new Set(apps.map((a) => a.recommended_source_id).filter(Boolean));
  const sources = by('laser_source').filter((s) => (s as { kind?: string }).kind === 'class' && (!apps.length || srcIds.has(s.id) || !input.process));
  const productIds = new Set(apps.map((a) => a.product_id));
  const products = (by('product') as unknown as Product[]).filter((p) => productIds.has(p.id) && (!input.sourceKey || (p.source_keys ?? []).includes(input.sourceKey)));
  const customerProducts = domain ? (domain.customer_products ?? []) : [...new Set(domains.flatMap((d) => d.customer_products ?? []))];
  return { domains, industries, customerProducts, materials, processes, applications: apps, sources, products };
}

const SUPPLIER_MATCH: Record<string, RegExp> = {
  Laser: /laser|photonic/i,
  Optics: /optic|lens/i,
  Galvo: /scan|galvo/i,
  Motion: /motion|linear|servo|drive/i,
  Robot: /robot/i,
  Vision: /vision|camera|sensor/i,
  PLC: /control|automation|plc|electric/i,
  IPC: /control|automation|computer|ipc/i,
  HMI: /control|automation|hmi/i,
  Safety: /safety/i,
  Chiller: /chill|cool|thermal/i,
  'Fume extraction': /fume|extract|filtr/i,
  Conveyor: /conveyor|motion|linear/i,
  Fixture: /fabricat|mechanic|machin/i,
  Inspection: /vision|inspection|sensor/i,
  MES: /software|mes|it\b/i,
};

export function solve(input: SolutionInput, records: AnyRecord[], e: ConfiguratorEngine | null): SolutionResult | null {
  const opts = solutionOptions(input, records);
  const app = opts.applications.find((a) => a.id === input.applicationId) ?? (input.process && input.materialId ? opts.applications[0] : undefined);
  const productId = input.productKey ? `prd-${input.productKey}` : app?.product_id;
  const product = records.find((r) => r.id === productId) as unknown as Product | undefined;
  if (!e || !product || !e.products.has(product.key)) return null;

  let s = e.initialState(product.key);
  const appKey = app?.id.split('.').slice(1).join('.');
  if (appKey && product.applications.some((a) => a.key === appKey)) s = e.withApplication(s, appKey);
  if (input.sourceKey && product.source_keys.includes(input.sourceKey)) s = e.withSource(s, input.sourceKey);
  if (input.throughputUph) s = { ...s, targetPerHour: input.throughputUph };

  // automation level → modules (published rule), only where the module fits and does not conflict
  const added: string[] = [];
  for (const family of AUTOMATION_RULE[input.automation ?? 'Manual']) {
    const k = family.find((m) => e.modules.has(m) && e.modFits(product, m));
    if (!k || s.modules.includes(k) || s.extras.includes(k)) continue;
    const next = e.isAutomation(k) ? { ...s, modules: [...s.modules, k] } : { ...s, extras: [...s.extras, k] };
    if (e.conflicts(next).length) continue;
    s = next;
    added.push(e.modules.get(k)!.name);
  }

  const physics = e.physics(s);
  const compat = e.compatibility(s);
  const price = e.price(s);
  const arch = architectureFromState(e, s);
  const bom = bomLinesFromConfig(e, s);
  const suppliers = records.filter((r) => r.entity === 'supplier') as unknown as Supplier[];
  const items = records.filter((r) => r.entity === 'component') as unknown as { name: string; category: string; vendor?: string }[];
  const lanes = [...new Set(arch.nodes.map((n) => n.lane))];
  const subsystems: SubsystemView[] = lanes.map((lane) => {
    const nodes = arch.nodes.filter((n) => n.lane === lane);
    const found = new Map<string, { id: string; name: string; basis: string }>();
    for (const n of nodes) {
      const re = SUPPLIER_MATCH[n.type];
      if (!re) continue;
      for (const sp of suppliers) if (re.test(`${sp.category ?? ''} ${(sp.capabilities ?? []).join(' ')} ${(sp.products ?? []).join(' ')}`)) found.set(sp.id, { id: sp.id, name: sp.name, basis: `supplier category “${sp.category ?? '—'}”` });
      for (const it of items) if (it.vendor && re.test(it.category)) {
        const sp = suppliers.find((x) => x.name.toLowerCase() === it.vendor!.toLowerCase());
        if (sp && !found.has(sp.id)) found.set(sp.id, { id: sp.id, name: sp.name, basis: `vendor of “${it.name}” in the component master` });
      }
    }
    return { lane, nodes, suppliers: [...found.values()] };
  });

  const known = bom.filter((l) => l.level !== 'Product' && l.unit_cost != null && l.unit_cost > 0);
  const total = known.reduce((a, l) => a + (l.unit_cost ?? 0) * l.quantity, 0);
  const costDrivers = [...known].sort((a, b) => (b.unit_cost ?? 0) * b.quantity - (a.unit_cost ?? 0) * a.quantity).slice(0, 5).map((line) => ({ line, share: total ? ((line.unit_cost ?? 0) * line.quantity) / total : null }));

  const locs = records.filter((r) => r.entity === 'localization') as unknown as Localization[];
  const importLines = bom.filter((l) => l.import_item);
  const buyLines = bom.filter((l) => l.make_buy === 'Buy');
  const locHits = locs.filter((l) => importLines.some((b) => b.description.toLowerCase().includes(l.imported_component.toLowerCase().split(' ')[0])));

  const risks: string[] = [];
  for (const c of compat) if (c.status !== 'OK') risks.push(`${c.check}: ${c.status} — ${c.detail}`);
  if (input.throughputUph == null) risks.push('Throughput not captured — cycle time and handling cannot be sized');
  if (input.accuracyUm == null) risks.push('Accuracy not captured — positioning, vision and optics cannot be verified against a requirement');
  if (!app) risks.push('No TEAL application record for this material + process — needs a POC before any commitment');
  if (bom.some((l) => l.cost_basis === 'UNKNOWN')) risks.push(`${bom.filter((l) => l.cost_basis === 'UNKNOWN').length} BOM line(s) with UNKNOWN cost`);

  const fails = compat.filter((c) => c.status === 'FAIL').length;
  const warns = compat.filter((c) => c.status === 'WARNING').length;
  const reasons: string[] = [];
  let level: 'Low' | 'Medium' | 'High' = 'Low';
  if (!app || fails) {
    level = 'High';
    if (!app) reasons.push('no catalogued TEAL application for this combination');
    if (fails) reasons.push(`${fails} compatibility check(s) fail`);
  } else if (added.length || warns || (input.automation && ['Inline', 'Fully automatic'].includes(input.automation))) {
    level = 'Medium';
    if (added.length) reasons.push(`${added.length} module(s) added beyond the platform standard`);
    if (warns) reasons.push(`${warns} compatibility warning(s)`);
    if (input.automation && ['Inline', 'Fully automatic'].includes(input.automation)) reasons.push(`${input.automation} handling`);
  } else reasons.push('catalogued TEAL application on a standard platform configuration');

  const src = e.sources.get(s.sourceKey ?? '');
  const requirements: SolutionResult['requirements'] = [
    { label: 'Process', value: String(app?.process ?? input.process ?? 'UNKNOWN'), basis: app ? 'TEAL application record' : 'user selection' },
    { label: 'Laser', value: src ? `${src.name}, ${s.powerW ?? '?'} W, ${src.wavelength.value} nm` : 'UNKNOWN', basis: 'configurator default for the application' },
    { label: 'Spot diameter', value: physics?.spot.value != null ? `${physics.spot.value.toFixed(1)} µm` : 'UNKNOWN', basis: 'calculated (Handbook L1)' },
    { label: 'Depth of focus', value: physics?.dof.value != null ? `${physics.dof.value.toFixed(2)} mm` : 'UNKNOWN', basis: 'calculated (Handbook L2)' },
    { label: 'Process regime', value: physics?.regime ? physics.regime.name : 'UNKNOWN', basis: 'calculated from irradiance / fluence' },
    { label: 'Throughput', value: input.throughputUph ? `${input.throughputUph} parts/h` : 'UNKNOWN — capture from the customer', basis: 'customer requirement' },
    { label: 'Accuracy', value: input.accuracyUm ? `± ${input.accuracyUm} µm` : 'UNKNOWN — capture from the customer', basis: 'customer requirement' },
  ];

  return {
    application: app,
    product,
    state: s,
    recommended: app ? { source: records.find((r) => r.id === app.recommended_source_id)?.name ?? String(app.recommended_source_id ?? 'UNKNOWN'), power: app.recommended_power_w ?? null, rationale: app.rationale ?? '', basis: 'TEAL application record (legacy configurator catalogue)' } : null,
    requirements,
    subsystems,
    bom,
    priceBand: { value: price.value, band: price.band },
    costDrivers,
    unknownCostLines: bom.filter((l) => l.unit_cost == null).length,
    risks,
    localization: {
      importLines: importLines.length,
      buyLines: buyLines.length,
      records: locHits,
      statement: `${importLines.length} of ${buyLines.length} bought line(s) are import items; ${locHits.length} localization record(s) cover them.`,
    },
    complexity: { level, reasons },
    addedModules: added,
  };
}
