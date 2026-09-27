import type { AnyRecord } from '../../domain';
import type { Requirement } from '../../domain/entities';
import type { Part, Verification } from '../../domain/engineering';
import { checkSelection, protocolRequirement, type CompatCtx } from '../eng/compatibility';
import { requirementIssues } from '../eng/requirementQuality';
import { completeness, type SpecDefs } from '../eng/specs';
import type { CostResult } from './bom';
import { cycleTime } from './capacity';
import type { Resolved } from './model';
import type { DependencyRow } from './supply';
import { selectedParts } from './supply';

/*
 * ENGINEERING DESIGN REVIEW, DFM/DFA, BUILDABILITY, POC READINESS, ENGINEERING COMPLETENESS
 * (master prompt §101–§105, §157). Every issue names its section, its evidence and the record it
 * links to. Potential issues are labelled "Potential engineering issue — review required".
 */

export const REVIEW_SECTIONS = ['Requirements', 'Architecture', 'Interfaces', 'Components', 'BOM', 'Suppliers', 'Simulation', 'Safety', 'Quality', 'Manufacturing', 'Service'] as const;
export type ReviewSection = (typeof REVIEW_SECTIONS)[number];
export interface ReviewIssue {
  section: ReviewSection;
  severity: 'blocker' | 'major' | 'minor';
  message: string;
  recordId?: string;
  potential?: boolean;
}

export interface ReviewInput {
  res: Resolved;
  records: AnyRecord[];
  byId: Map<string, AnyRecord>;
  defs: SpecDefs;
  ctx: CompatCtx;
  bom: CostResult;
  deps: DependencyRow[];
}

const has = (res: Resolved, types: string[]) => selectedParts(res).some((x) => types.includes(x.part.product_type));

export function designReview(inp: ReviewInput): ReviewIssue[] {
  const { res, records, byId, defs, ctx, bom, deps } = inp;
  const sim = res.sim;
  const out: ReviewIssue[] = [];
  const add = (section: ReviewSection, severity: ReviewIssue['severity'], message: string, recordId?: string, potential?: boolean) => out.push({ section, severity, message, recordId, potential });

  // Requirements
  const reqs = (sim.requirement_ids ?? []).map((id) => byId.get(id)).filter((x): x is AnyRecord => !!x) as (Requirement & AnyRecord)[];
  if (!reqs.length) add('Requirements', 'major', 'No requirements are traced to this equipment — link the customer / system requirements it must meet');
  const allReqs = records.filter((r) => r.entity === 'requirement') as (Requirement & AnyRecord)[];
  for (const r of reqs) {
    const iss = requirementIssues(r, allReqs).filter((i) => i.severity === 'error');
    if (iss.length) add('Requirements', 'major', `${r.code ?? r.id}: ${iss.map((i) => i.message).join('; ')}`, r.id);
  }
  if (sim.targets?.uph == null && sim.targets?.annual_units == null) add('Requirements', 'major', 'No throughput target (UPH or annual volume) — capacity cannot be judged');

  // Architecture
  for (const s of res.stations) {
    const req = (s.station.slots ?? []).filter((x) => x.required);
    const missing = req.filter((slot) => !s.parts.some((p) => p.role === slot.role));
    if (missing.length) add('Architecture', 'major', `${s.station.name}: required component(s) not selected — ${missing.map((m) => m.role).join(', ')}`);
  }
  if (!sim.sequence?.length) add('Architecture', 'minor', 'No automation sequence (state machine) defined');

  // Interfaces
  for (const p of protocolRequirement(sim.required_protocols ?? [], selectedParts(res).map((x) => x.part))) if (!p.ok) add('Interfaces', 'blocker', `Required protocol ${p.protocol}: ${p.detail}`);
  const controls = selectedParts(res).filter((x) => ['plc', 'ipc', 'hmi', 'vision_controller', 'servo_drive', 'galvo_controller', 'camera'].includes(x.part.product_type));
  for (const c of controls) if (!(c.part.interfaces?.communication ?? []).length) add('Interfaces', 'minor', `${c.part.model_number}: no communication interface recorded`, c.part.id);

  // Components — compatibility and missing key specs
  const compat = checkSelection(selectedParts(res).map((x) => x.part), ctx);
  for (const r of compat.filter((x) => x.relationship === 'Incompatible')) add('Components', 'blocker', `${r.a.model_number} ↔ ${r.b.model_number}: incompatible — ${r.checks.filter((c) => c.status === 'fail').map((c) => c.detail).join('; ')}`, r.a.id);
  for (const r of compat.filter((x) => x.relationship === 'ConditionallyCompatible')) add('Components', 'minor', `${r.a.model_number} ↔ ${r.b.model_number}: conditional — ${[...r.checks.filter((c) => c.status === 'fail').map((c) => c.detail), ...r.recorded.map((x) => x.conditions ?? '')].filter(Boolean).join('; ')}`, r.a.id);
  for (const x of selectedParts(res)) {
    const c = completeness(x.part);
    if (c.pct != null && c.pct < 80) add('Components', 'minor', `${x.part.model_number}: missing key specifications — ${c.missing.map((k) => defs.get(k)?.name ?? k).join(', ')}`, x.part.id);
    if (x.part.lifecycle_status === 'Discontinued' || x.part.lifecycle_status === 'NRND') add('Components', 'major', `${x.part.model_number}: lifecycle ${x.part.lifecycle_status}`, x.part.id);
  }
  for (const w of res.warnings.filter((w) => /exceeds|outside/.test(w))) add('Components', 'major', w);

  // BOM
  for (const m of bom.missingPrices) add('BOM', 'minor', `${m.reference}: no price recorded`, m.partId);
  if (bom.missingFx.length) add('BOM', 'major', `Cost total not formed — no FX rate for ${bom.missingFx.join(', ')}`);
  if (bom.elements.filter((e) => !e.included && e.key !== 'material').length) add('BOM', 'minor', `Cost elements not included: ${bom.elements.filter((e) => !e.included && e.key !== 'material').map((e) => e.label).join(', ')}`);

  // Suppliers
  for (const d of deps.filter((x) => x.singleSource)) add('Suppliers', 'major', `${d.sp.part.model_number} (${d.sp.role}): single source — ${d.manufacturer}`, d.sp.part.id);
  for (const d of deps.filter((x) => x.origin === 'Imported' && (x.leadTimeWeeks ?? 0) >= 8)) add('Suppliers', 'minor', `${d.sp.part.model_number}: imported with ${d.leadTimeWeeks}-week lead time`, d.sp.part.id);

  // Simulation
  for (const b of res.blocking) add('Simulation', 'blocker', `Missing input — ${b}`);
  const c = cycleTime(res);
  if (c && sim.targets?.uph != null && c.practicalUph < sim.targets.uph) add('Simulation', 'major', `Practical ${c.practicalUph.toFixed(0)} UPH is below the ${sim.targets.uph} UPH target — bottleneck: ${c.bottleneck.rs.station.name}`);
  if (res.stations.some((s) => s.basis === 'DEMO' || s.basis === 'ASSUMPTION')) add('Simulation', 'minor', 'Some station times are DEMO or assumptions — replace with measured or calculated values before a customer commitment');
  if (!(sim.actuals ?? []).length) add('Simulation', 'minor', 'Not calibrated — no measured POC / FAT values recorded against the prediction');

  // Safety
  const laser = res.stations.some((s) => s.station.kind === 'laser');
  if (!has(res, ['safety_plc', 'safety_relay', 'safety_controller'])) add('Safety', 'blocker', 'Missing safety chain — no safety controller / relay selected');
  if (!has(res, ['door_switch', 'light_curtain', 'safety_scanner'])) add('Safety', 'major', 'No guarding device (interlock, light curtain or scanner) selected');
  if (laser && !has(res, ['enclosure'])) add('Safety', 'major', 'Laser station without a recorded enclosure — laser class of the machine cannot be argued', undefined, true);
  if (laser && !has(res, ['fume_extraction'])) add('Safety', 'minor', 'Laser process without fume extraction', undefined, true);

  // Quality
  const vers = records.filter((r) => r.entity === 'verification' && reqs.some((q) => q.id === (r as unknown as Verification).requirement_id));
  if (reqs.length && !vers.length) add('Quality', 'major', 'No verification planned for the traced requirements');
  if (!res.stations.some((s) => s.station.kind === 'inspect')) add('Quality', 'minor', 'No inspection station — how is the output verified in line?', undefined, true);
  if (!sim.recipe_id && laser) add('Quality', 'minor', 'No process recipe linked');

  // Manufacturing (DFM/DFA)
  for (const d of dfmFlags(inp)) add('Manufacturing', 'minor', d, undefined, true);

  // Service
  if (!sim.maintenance?.pm_interval_h) add('Service', 'minor', 'No maintenance strategy (PM interval) entered');
  if (res.stations.every((s) => s.station.mtbf_min == null)) add('Service', 'minor', 'No MTBF / MTTR anywhere — availability is an assumption');

  const order = { blocker: 0, major: 1, minor: 2 };
  return out.sort((a, b) => REVIEW_SECTIONS.indexOf(a.section) - REVIEW_SECTIONS.indexOf(b.section) || order[a.severity] - order[b.severity]);
}

/** §103 — flags from data; everything else is a review question, never a claim. */
export function dfmFlags(inp: ReviewInput): string[] {
  const sp = selectedParts(inp.res);
  const custom = sp.filter((x) => ['fixture', 'frame', 'enclosure'].includes(x.part.product_type) || x.part.scope === 'TEAL').length + inp.res.stations.filter((s) => s.station.capex != null).length;
  const flags: string[] = [];
  if (custom > 8) flags.push(`${custom} custom / fabricated items — potential engineering issue (fabrication complexity), review required`);
  const nonStd = sp.filter((x) => x.part.record_status === 'Draft' || x.part.lifecycle_status === 'Unknown');
  if (nonStd.length) flags.push(`${nonStd.length} component(s) not yet catalogued / lifecycle unknown (${nonStd.map((x) => x.part.model_number).join(', ')}) — potential non-standard components, review required`);
  const mfr = new Set(sp.map((x) => x.part.manufacturer_id ?? x.part.brand));
  if (mfr.size > 10) flags.push(`${mfr.size} different manufacturers — potential supplier-management burden, review required`);
  const single = inp.deps.filter((d) => d.singleSource).length;
  if (single > 3) flags.push(`${single} single-source components — potential supplier dependency, review required`);
  return flags;
}

export const DFM_QUESTIONS = [
  'Can every wear part (lens protective window, filters, fixture pads) be replaced without removing other assemblies?',
  'Are fastener counts and fastener types minimised and standardised?',
  'Is cable routing defined with bend radii, strain relief and separation of power and signal?',
  'Is there maintenance access to the laser source, scanner, chiller and filters without breaking the enclosure interlock chain?',
  'Are fixtures poka-yoke (cannot load a part the wrong way)?',
];

export interface GateCheck {
  item: string;
  ok: boolean;
  detail: string;
}
/** §104 BUILD READINESS GAPS before prototype. */
export function buildReadiness(inp: ReviewInput): GateCheck[] {
  const { res, bom } = inp;
  const sp = selectedParts(res);
  const comps = bom.items.filter((i) => i.level === 'Component' && i.partId);
  const priced = comps.filter((c) => c.unitCost != null).length;
  const active = sp.filter((x) => x.part.lifecycle_status === 'Active').length;
  const leads = comps.map((c) => c.leadTimeWeeks).filter((x): x is number => x != null);
  const drawings = sp.filter((x) => ['fixture', 'frame', 'enclosure'].includes(x.part.product_type));
  const withDrawings = drawings.filter((x) => (x.part.documents ?? []).some((d) => d.kind === 'Drawing' || d.kind === 'CAD'));
  const missingSlots = res.stations.flatMap((s) => (s.station.slots ?? []).filter((sl) => sl.required && !s.parts.some((p) => p.role === sl.role)).map((sl) => `${s.station.name}: ${sl.role}`));
  const vers = inp.records.filter((r) => r.entity === 'verification' && (r as unknown as Verification).simulation_id === res.sim.id);
  return [
    { item: 'BOM completeness', ok: !missingSlots.length && priced === comps.length, detail: `${comps.length} component lines, ${priced} priced${missingSlots.length ? `; unselected: ${missingSlots.join(', ')}` : ''}` },
    { item: 'Supplier availability', ok: active === sp.length, detail: `${active} of ${sp.length} components in Active lifecycle` },
    { item: 'Lead time', ok: leads.length === comps.length, detail: leads.length ? `Longest recorded lead time ${Math.max(...leads)} weeks${leads.length < comps.length ? `; ${comps.length - leads.length} without lead time` : ''}` : 'No lead times recorded' },
    { item: 'Drawings', ok: drawings.length > 0 && withDrawings.length === drawings.length, detail: drawings.length ? `${withDrawings.length} of ${drawings.length} fabricated items have a drawing / CAD reference` : 'No fabricated items recorded' },
    { item: 'Interfaces', ok: protocolRequirement(res.sim.required_protocols ?? [], sp.map((x) => x.part)).every((p) => p.ok), detail: (res.sim.required_protocols ?? []).length ? `Required: ${(res.sim.required_protocols ?? []).join(', ')}` : 'No required protocols stated' },
    { item: 'Manufacturing process', ok: false, detail: 'Fabrication routes are not recorded in the component database — confirm with manufacturing engineering' },
    { item: 'Assembly', ok: !!res.sim.sequence?.length, detail: res.sim.sequence?.length ? 'Automation sequence defined' : 'No sequence / assembly order defined' },
    { item: 'Test requirements', ok: vers.length > 0, detail: vers.length ? `${vers.length} verification record(s) planned` : 'No verification planned against this equipment' },
  ];
}

/** §105 POC readiness. */
export function pocReadiness(inp: ReviewInput): GateCheck[] {
  const { res, byId, records } = inp;
  const sim = res.sim;
  const reqs = (sim.requirement_ids ?? []).map((id) => byId.get(id)).filter(Boolean) as (Requirement & AnyRecord)[];
  const recipe = sim.recipe_id ? byId.get(sim.recipe_id) : undefined;
  const vers = records.filter((r) => r.entity === 'verification' && (reqs.some((q) => q.id === (r as unknown as Verification).requirement_id) || (r as unknown as Verification).simulation_id === sim.id));
  const slot = (t: string[]) => selectedParts(res).some((x) => t.includes(x.part.product_type));
  return [
    { item: 'Requirement', ok: reqs.length > 0, detail: reqs.length ? `${reqs.length} linked` : 'None linked' },
    { item: 'Equipment', ok: res.runnable, detail: res.runnable ? 'Scenario resolves' : `${res.blocking.length} missing input(s)` },
    { item: 'Material', ok: !!sim.material_id, detail: sim.material_id ? String(byId.get(sim.material_id)?.name ?? sim.material_id) : 'Not specified' },
    { item: 'Fixture', ok: slot(['fixture']), detail: slot(['fixture']) ? 'Selected' : 'No fixture selected' },
    { item: 'Recipe', ok: !!recipe, detail: recipe ? `${recipe.name} (${String(recipe.recipe_status)})` : 'No recipe' },
    { item: 'Laser', ok: slot(['laser_source']), detail: slot(['laser_source']) ? 'Source selected' : 'No laser source' },
    { item: 'Vision', ok: slot(['camera']), detail: slot(['camera']) ? 'Camera selected' : 'No camera' },
    { item: 'Safety', ok: slot(['safety_plc', 'safety_relay', 'safety_controller']) && slot(['door_switch', 'light_curtain', 'safety_scanner', 'enclosure']), detail: 'Safety controller + guarding' },
    { item: 'Test plan', ok: vers.length > 0, detail: vers.length ? `${vers.length} verification(s)` : 'None' },
    { item: 'Acceptance criteria', ok: reqs.length > 0 && reqs.every((r) => !!r.acceptance_criterion), detail: reqs.length ? `${reqs.filter((r) => r.acceptance_criterion).length} of ${reqs.length} requirements` : '—' },
    { item: 'Traceability', ok: reqs.length > 0 && vers.length > 0, detail: 'Requirement → equipment → verification' },
    { item: 'Data collection', ok: !!recipe && ((recipe as { quality_criteria?: string[] }).quality_criteria ?? []).length > 0, detail: recipe ? 'Quality criteria define what to measure' : 'Define what to measure and how' },
  ];
}

export type CompletenessStatus = 'Complete' | 'Incomplete' | 'Missing' | 'Unverified';
/** §101 — per dimension, never one number. */
export function engineeringCompleteness(inp: ReviewInput, issues: ReviewIssue[]): { dimension: string; status: CompletenessStatus; detail: string }[] {
  const { res } = inp;
  const sec = (s: ReviewSection) => issues.filter((i) => i.section === s);
  const st = (s: ReviewSection, present: boolean, verified = true): CompletenessStatus => (!present ? 'Missing' : sec(s).some((i) => i.severity !== 'minor') ? 'Incomplete' : !verified ? 'Unverified' : sec(s).length ? 'Incomplete' : 'Complete');
  const demo = res.sim.data_type === 'DEMO';
  const reqs = (res.sim.requirement_ids ?? []).length > 0;
  const parts = selectedParts(res).length > 0;
  return [
    { dimension: 'Requirements', status: st('Requirements', reqs), detail: `${(res.sim.requirement_ids ?? []).length} traced` },
    { dimension: 'Architecture', status: st('Architecture', res.stations.length > 0), detail: `${res.stations.length} stations` },
    { dimension: 'BOM', status: st('BOM', parts, !demo), detail: `${inp.bom.items.filter((i) => i.level === 'Component').length} lines` },
    { dimension: 'Simulation', status: st('Simulation', res.runnable, (res.sim.actuals ?? []).length > 0), detail: res.runnable ? 'Runs' : 'Missing inputs' },
    { dimension: 'Supplier', status: st('Suppliers', parts, !demo), detail: `${inp.deps.filter((d) => d.singleSource).length} single-source` },
    { dimension: 'Testing', status: issues.some((i) => i.section === 'Quality' && /verification/.test(i.message)) ? 'Missing' : 'Unverified', detail: 'Verification records vs requirements' },
    { dimension: 'Quality', status: st('Quality', res.stations.some((s) => s.station.kind === 'inspect')), detail: 'Inspection + recipe' },
    { dimension: 'Safety', status: st('Safety', parts), detail: 'Safety chain + guarding' },
    { dimension: 'Service', status: st('Service', !!res.sim.maintenance), detail: 'Maintenance strategy + MTBF/MTTR' },
  ];
}

export const partLabel = (p: Part) => `${p.model_number}`;
