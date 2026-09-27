import { fmtNum } from '../../calculations/units';
import type { AnyRecord } from '../../domain';
import type { Requirement } from '../../domain/entities';
import type { EquipmentTemplate } from '../../domain/engineering';
import { productTypeLabel } from '../../domain/engineering';
import { parsePartQuery } from '../eng/partSearch';
import type { SpecDefs } from '../eng/specs';
import type { CostResult } from './bom';
import type { CapacityResult, CycleResult } from './capacity';
import type { McSummary, ScenarioMetrics } from './analysis';
import { basisLabel, MODEL_VERSION, type Resolved } from './model';
import type { ReviewIssue } from './review';
import type { DependencyRow } from './supply';

/*
 * REPORTS (master prompt §138, §139, §158) and RULE-BASED ARCHITECTURE DRAFTS (§121, §156).
 * Reports are Markdown built only from the scenario and its records. Customer mode omits internal
 * cost, supplier identities, internal risks and notes (§122, §159).
 */

const money = (v: number | null | undefined, cur: string) => (v == null ? 'Not Available' : `${cur} ${Math.round(v).toLocaleString('en-IN')}`);
const n = (v: number | null | undefined, d = 3) => (v == null ? 'Not Available' : fmtNum(v, d));
const esc = (s: string) => s.replace(/\|/g, '\\|');

export interface ReportInput {
  res: Resolved;
  cycle: CycleResult | null;
  cap: CapacityResult | null;
  bom: CostResult;
  deps: DependencyRow[];
  issues: ReviewIssue[];
  byId: Map<string, AnyRecord>;
  compare?: ScenarioMetrics[];
  mc?: McSummary | null;
  today: string;
  mode: 'engineering' | 'customer';
}

export function simulationReport(i: ReportInput): string {
  const { res, cycle: c, cap, bom, deps, issues, byId, mode } = i;
  const sim = res.sim;
  const cust = mode === 'customer';
  const L: string[] = [];
  const name = (id?: string) => (id ? String(byId.get(id)?.name ?? id) : 'Not linked');
  L.push(`# ${cust ? 'Equipment proposal' : 'Simulation report'} — ${sim.name}`);
  L.push('');
  L.push(`${i.today} · scenario v${sim.version ?? 1} · model ${MODEL_VERSION} · ${sim.data_type === 'DEMO' ? '**DEMO DATA** — fictional scenario for demonstration' : `status ${sim.sim_status}`}`);
  L.push('');
  L.push('> Engineering decision-support simulation: cycle time, capacity, queues and variability. It is not a physics (FEA / CFD / optical) simulation and is not factory-validated unless a calibration against measured data is shown below.');
  L.push('');
  L.push('## Executive summary');
  L.push('');
  if (!c) L.push(`The scenario cannot be simulated yet — missing: ${res.blocking.join('; ')}.`);
  else {
    L.push(`- Cycle time **${n(c.cycle)} s** (${c.layout === 'inline' ? `bottleneck: ${c.bottleneck.rs.station.name}` : 'sequential machine'})`);
    L.push(`- Theoretical **${n(c.theoreticalUph)} UPH**, practical **${n(c.practicalUph)} UPH** (OEE ${n(c.oee * 100)} %)`);
    if (cap?.targetUph != null) L.push(`- Target ${n(cap.targetUph)} UPH → ${cap.capacityGapUph! >= 0 ? `meets it with ${n(cap.capacityGapUph)} UPH margin` : `short by ${n(-cap.capacityGapUph!)} UPH — ${cap.machinesRequired} machine(s) of this configuration needed`}`);
    if (cap?.annualCapacity != null) L.push(`- Annual capacity ${n(cap.annualCapacity)} parts on ${n(cap.productiveHoursPerYear)} productive h/year`);
    if (!cust) L.push(`- Equipment cost ${bom.total != null ? money(bom.total, bom.currency) : 'Not Available — see Cost'}`);
  }
  L.push('');
  L.push('## Application');
  L.push('');
  L.push(`| | |\n|---|---|\n| Customer | ${esc(name(sim.customer_id))} |\n| Application | ${esc(name(sim.application_id))} |\n| Material | ${esc(name(sim.material_id))} |\n| Product platform | ${esc(name(sim.product_id))} |\n| Template | ${esc(name(sim.template_id))} |`);
  L.push('');
  L.push('## Equipment architecture and process flow');
  L.push('');
  L.push(res.stations.map((s) => s.station.name).join(' → '));
  L.push('');
  L.push('| # | Station | Function | Time / part (s) | Basis | Parallel | Buffer after |');
  L.push('|---|---|---|---|---|---|---|');
  res.stations.forEach((s, k) => L.push(`| ${k + 1} | ${esc(s.station.name)} | ${esc(s.station.function ?? s.station.kind)} | ${n(s.time)} | ${basisLabel(s.basis)} | ${s.station.parallel ?? 1} | ${s.station.buffer_after ?? 0} |`));
  L.push('');
  L.push('## Configuration');
  L.push('');
  L.push(cust ? '| Station | Function | Technology |' : '| Station | Role | Component | Manufacturer | Origin |');
  L.push(cust ? '|---|---|---|' : '|---|---|---|---|---|');
  for (const d of deps) L.push(cust ? `| ${esc(d.sp.station)} | ${esc(d.sp.role)} | ${esc(productTypeLabel(d.sp.part.product_type))}${(d.sp.part.technologies ?? []).length ? ` (${esc((d.sp.part.technologies ?? []).join(', '))})` : ''} |` : `| ${esc(d.sp.station)} | ${esc(d.sp.role)} | ${esc(d.sp.part.model_number)} | ${esc(d.manufacturer)} | ${d.origin} |`);
  if (!deps.length) L.push(cust ? '| — | — | — |' : '| — | — | Nothing selected | — | — |');
  L.push('');
  L.push('## Requirements');
  L.push('');
  const reqs = (sim.requirement_ids ?? []).map((id) => byId.get(id)).filter(Boolean) as (Requirement & AnyRecord)[];
  if (!reqs.length) L.push('No requirements are linked to this scenario.');
  else {
    L.push('| Code | Requirement | Value | Acceptance |');
    L.push('|---|---|---|---|');
    for (const r of reqs) L.push(`| ${esc(r.code ?? r.id)} | ${esc(r.name)} | ${esc(r.value ? `${r.value} ${r.unit ?? ''}` : 'Not stated')} | ${esc(r.acceptance_criterion ?? 'Not defined')} |`);
  }
  L.push('');
  if (!cust) {
    L.push('## Simulation inputs and assumptions');
    L.push('');
    L.push(`- Layout: ${res.layout === 'inline' ? 'inline — stations work concurrently' : 'sequential — one part in the machine at a time'}`);
    if (c) {
      L.push(`- Availability ${n(c.availability.value * 100)} % — ${c.availability.basis}`);
      L.push(`- Performance ${n(c.performance.value * 100)} % — ${c.performance.basis}`);
      L.push(`- Quality ${n(c.quality.value * 100)} % — ${c.quality.basis}`);
    }
    for (const s of res.stations.filter((x) => x.station.dist)) L.push(`- ${s.station.name}: ${s.station.dist!.type} distribution`);
    for (const w of res.warnings) L.push(`- ⚠ ${w}`);
    L.push('');
  }
  if (c) {
    L.push('## Cycle time, capacity and bottleneck');
    L.push('');
    L.push('| Station | Mean (s) | Effective (s) | Utilization |');
    L.push('|---|---|---|---|');
    for (const l of c.loads) L.push(`| ${esc(l.rs.station.name)} | ${n(l.mean)} | ${n(l.effective)} | ${n(l.utilization * 100)} % |`);
    L.push('');
    L.push(`Bottleneck: **${c.bottleneck.rs.station.name}** (${n(c.bottleneck.effective)} s per part).`);
    L.push('');
  }
  if (i.mc) {
    L.push('## Variability (Monte Carlo)');
    L.push('');
    L.push(`${i.mc.n} runs. ` + i.mc.percentiles.map((p) => `${p.p} ${n(p.uph)} UPH`).join(' · ') + (i.mc.probMeetTarget != null ? ` · P(≥ ${n(i.mc.target)} UPH) = ${n(i.mc.probMeetTarget * 100)} %` : ''));
    L.push('');
  }
  if (i.compare?.length) {
    L.push('## Scenario comparison');
    L.push('');
    L.push(`| Metric | ${i.compare.map((m) => esc(m.label)).join(' | ')} |`);
    L.push(`|---|${i.compare.map(() => '---').join('|')}|`);
    const row = (label: string, f: (m: ScenarioMetrics) => string) => L.push(`| ${label} | ${i.compare!.map(f).join(' | ')} |`);
    row('Cycle (s)', (m) => n(m.cycle));
    row('Practical UPH', (m) => n(m.practicalUph));
    if (!cust) row('Equipment cost', (m) => money(m.capex, m.currency));
    if (!cust) row('Localization (cost share)', (m) => (m.localization != null ? `${n(m.localization * 100)} %` : 'Not Available'));
    L.push('');
    L.push('No overall winner is declared — the trade-off is an engineering and commercial decision.');
    L.push('');
  }
  if (!cust) {
    L.push('## BOM and cost');
    L.push('');
    L.push('| Element | Value | Basis |');
    L.push('|---|---|---|');
    for (const e of bom.elements) L.push(`| ${e.label} | ${e.included ? money(e.value, bom.currency) : 'Not included'} | ${esc(e.basis)} |`);
    L.push(`| **Total equipment cost** | **${money(bom.total, bom.currency)}** | ${esc(bom.notes.join(' ') || 'Included elements only')} |`);
    L.push('');
    L.push('## Suppliers and risk');
    L.push('');
    for (const d of deps.filter((x) => x.risk.length)) L.push(`- ${d.sp.part.model_number}: ${d.risk.join('; ')}`);
    L.push('');
    L.push('## Engineering review');
    L.push('');
    if (!issues.length) L.push('No issues found by the automated checks. A human design review is still required.');
    for (const x of issues) L.push(`- **${x.section}** (${x.severity}): ${x.message}${x.potential ? ' — potential engineering issue, review required' : ''}`);
    L.push('');
  }
  L.push('## Validation');
  L.push('');
  const acts = sim.actuals ?? [];
  if (!acts.length) L.push('Not validated — no measured POC / FAT results are recorded against this prediction.');
  else {
    L.push('| Metric | Predicted | Actual | Error | Date |');
    L.push('|---|---|---|---|---|');
    for (const a of acts) L.push(`| ${esc(a.metric)} | ${n(a.predicted)} ${a.unit} | ${n(a.actual)} ${a.unit} | ${a.predicted ? `${n(((a.actual - a.predicted) / a.predicted) * 100)} %` : '—'} | ${a.date} |`);
  }
  L.push('');
  if (cust) {
    L.push('## Assumptions and exclusions');
    L.push('');
    L.push('- Throughput figures are simulation results from the stated station times; they are confirmed at FAT on customer parts.');
    L.push('- Excluded unless stated: installation, utilities, part logistics outside the machine, MES integration effort.');
    if (sim.customer_visible_notes) L.push(`- ${sim.customer_visible_notes}`);
    L.push('');
  }
  return L.join('\n');
}

/* ---------------------------------------------------------------- rule-based architecture draft (§121, §156) */

export interface DraftPlan {
  template: (EquipmentTemplate & AnyRecord) | null;
  uph: number | null;
  material: string | null;
  process: string | null;
  industry: string | null;
  missing: string[];
  reasoning: string[];
}

const INDUSTRY_WORDS: [RegExp, string][] = [
  [/\bpcb|ems|electronic/i, 'Electronics'],
  [/\bsemiconductor|wafer|package|strip|die\b/i, 'Semiconductor'],
  [/\bbattery|cell|tab|busbar|ev\b/i, 'Battery'],
];

/**
 * Turn a sentence ("Build a preliminary 500 UPH PCB laser marking machine") into a draft plan by
 * explicit keyword rules — no AI model is connected. What cannot be read from the text is listed
 * as missing instead of being assumed (§156).
 */
export function planDraft(text: string, templates: (EquipmentTemplate & AnyRecord)[], defs: SpecDefs): DraftPlan {
  const q = parsePartQuery(text, defs);
  const industry = INDUSTRY_WORDS.find(([re]) => re.test(text))?.[1] ?? null;
  const process = q.process ?? null;
  const reasoning: string[] = [];
  const score = (t: EquipmentTemplate) => {
    let s = 0;
    const hay = `${t.name} ${t.application} ${t.process ?? ''}`.toLowerCase();
    if (process && (t.process ?? '').toLowerCase() === process.toLowerCase()) s += 3;
    if (industry && (t.group === industry || hay.includes(industry.toLowerCase()))) s += 2;
    if (/laser/i.test(text) && t.has_laser_chain) s += 1;
    for (const w of text.toLowerCase().split(/\W+/).filter((x) => x.length > 3)) if (hay.includes(w)) s += 0.5;
    return s;
  };
  const ranked = templates.map((t) => ({ t, s: score(t) })).sort((a, b) => b.s - a.s);
  const template = ranked[0] && ranked[0].s >= 2 ? ranked[0].t : null;
  if (template) reasoning.push(`Template “${template.name}” matched on ${[process && `process ${process}`, industry && `industry ${industry}`, template.has_laser_chain && /laser/i.test(text) && 'laser'].filter(Boolean).join(', ')}`);
  const missing: string[] = [];
  if (!template) missing.push('Equipment type — no template matched; choose one from the library');
  if (q.uph == null) missing.push('Target throughput (UPH)');
  if (!q.material) missing.push('Material');
  if (!process) missing.push('Process');
  missing.push('Station times (loading, handling, vision, inspection) — enter measured or calculated values');
  if (template?.has_laser_chain) missing.push('Processed area or path length, hatch and speed (from a process window or POC)');
  missing.push('Part size and presentation (tray, conveyor, magazine)');
  return { template, uph: q.uph ?? null, material: q.material ?? null, process, industry, missing, reasoning };
}
