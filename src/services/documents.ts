import type { AnyRecord } from '../domain';
import type { AcceptanceProtocol, BomLine, Configuration, Doe, Poc, Product, Rfq, Supplier, Technology } from '../domain/entities';
import { ENTITY_BY_TYPE } from '../domain/registry';
import type { ConfiguratorEngine } from '../features/configurator/engine';
import { stateFromConfiguration } from '../features/configurator/state';
import { whatIsMissing } from './gaps';
import { neighbours, type Graph } from './graph';
import { lifecycleFor } from './lifecycle';
import { maturityLane, MATURITY_RULE } from './maturity';
import { nextActionFor } from './nextAction';
import { trustLabel } from './trust';

/**
 * DOCUMENT GENERATION (final master prompt §42). Eleven templates rendered to Markdown from records
 * only: every value comes from a record or an engine, UNKNOWN where nothing is recorded, and
 * results are never pre-filled (POC, FAT/SAT). The header states the source records and their
 * trust labels. Checklists quote the TEAL Automation handbook and cite it.
 */
export interface DocContext {
  records: AnyRecord[];
  byId: Map<string, AnyRecord>;
  graph: Graph;
  engine: ConfiguratorEngine | null;
  today: string;
}

export interface DocTemplate {
  id: string;
  title: string;
  purpose: string;
  /** entity types the template is generated from */
  entities: string[];
  /** true when several records are combined (supplier comparison) */
  multi?: boolean;
  render: (subjects: AnyRecord[], ctx: DocContext) => string;
}

type R = AnyRecord & Record<string, unknown>;
const U = 'UNKNOWN';
const val = (v: unknown): string => {
  if (v == null || v === '') return U;
  if (Array.isArray(v)) return v.length ? v.map(val).join(', ') : U;
  if (typeof v === 'object' && 'value' in (v as object)) return (v as { value: unknown }).value == null ? U : `${String((v as { value: unknown }).value)} ${String((v as { unit?: string }).unit ?? '')}`.trim();
  if (typeof v === 'number') return v.toLocaleString('en-IN');
  return String(v).replace(/\|/g, '/').replace(/\n+/g, ' ');
};
const name = (ctx: DocContext, id: unknown) => (typeof id === 'string' ? (ctx.byId.get(id)?.name ?? id) : U);
const table = (head: string[], rows: string[][]) => (rows.length ? [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map((c) => c || '—').join(' | ')} |`)].join('\n') : '_None recorded._');
const bullets = (xs: string[], empty = '_None recorded._') => (xs.length ? xs.map((x) => `- ${x}`).join('\n') : empty);
const checklist = (xs: string[]) => xs.map((x) => `- [ ] ${x}`).join('\n');
const linked = (ctx: DocContext, id: string, entity: string) => [...new Map(neighbours(ctx.graph, id).filter((n) => n.record.entity === entity).map((n) => [n.record.id, n.record as R])).values()];

function header(title: string, subjects: AnyRecord[], ctx: DocContext): string {
  return [
    `# ${title}`,
    '',
    `**Generated:** ${ctx.today} from TEAL Intelligence records · **Status:** DRAFT — review before issue`,
    '',
    `**Source records:** ${subjects.map((s) => `${s.name} (${ENTITY_BY_TYPE[s.entity]?.label ?? s.entity}, ${trustLabel(s)})`).join('; ')}`,
    '',
    '*Values come only from the records above. UNKNOWN means nothing is recorded — obtain it; do not assume it.*',
    '',
  ].join('\n');
}

function reqTable(reqs: R[]): string {
  return table(
    ['Code', 'Requirement', 'Value', 'Verification', 'Acceptance criterion'],
    reqs.map((r) => [val(r.code), r.name, `${val(r.value)}${r.unit ? ` ${String(r.unit)}` : ''}`, val(r.verification_method), val(r.acceptance_criterion)]),
  );
}

const requirementsOf = (ctx: DocContext, s: R) => (ctx.records as R[]).filter((r) => r.entity === 'requirement' && (r.opportunity_id === s.id || r.project_id === s.id || (s.entity === 'product' && r.product_id === s.id) || (s.opportunity_id && r.opportunity_id === s.opportunity_id)));

const DFM = [
  'Only error-budget features have tight tolerances; rest ISO 2768',
  'Datums on drawings match the fixture and machine datum scheme',
  'Coating and heat-treatment allowances on drawings; masked faces noted',
  'DFA review done per module; part and fastener counts minimized',
  'Self-locating features and error-proofing present',
  'Tool access for every fastener and adjustment',
  'Vendor review of critical parts before release',
  'Service access for wear parts verified in 3D',
];
const G5 = [
  'Drawings released at correct revision to vendors',
  'Critical characteristics marked; inspection plan issued',
  'First-article inspection planned for new parts',
  'Stress relief, heat treatment and coatings specified',
  'Vendor capacity and delivery dates confirmed',
  'Material certificates required and tracked',
  'Special tools, fixtures and gauges available',
  'Panel build package released',
  'Incoming-inspection resources scheduled',
  'Open DFM issues closed',
];

export const TEMPLATES: DocTemplate[] = [
  {
    id: 'prd',
    title: 'Product Requirements Document (PRD)',
    purpose: 'What the customer needs, the product concept that answers it, and how success is judged.',
    entities: ['opportunity', 'product'],
    render: ([s0], ctx) => {
      const s = s0 as R;
      const reqs = requirementsOf(ctx, s);
      const risks = linked(ctx, s.id, 'risk');
      const gaps = whatIsMissing(ctx.graph, s.id).filter((g) => g.status === 'missing' && g.item !== 'Controlled documents');
      const cfgs = (ctx.records as R[]).filter((r) => r.entity === 'configuration' && (r.opportunity_id === s.id || r.product_id === s.id));
      return [
        header(`PRD — ${s.name}`, [s], ctx),
        '## 1. Overview',
        table(['Field', 'Value'], [['Customer', name(ctx, s.customer_id)], ['Industry', val(s.industry)], ['Market', val(s.market)], ['Stage', val(s.stage ?? s.maturity)], ['Owner', val(s.owner)]]),
        '',
        '## 2. Customer need',
        val(s.inquiry_text ?? s.description),
        '',
        '## 3. Requirements',
        reqTable(reqs),
        '',
        '## 4. Application & product concept',
        table(['Item', 'Value'], [['Application', name(ctx, s.application_id)], ['Platform', name(ctx, s.product_id ?? (s.entity === 'product' ? s.id : undefined))], ['Configurations', cfgs.map((c) => c.name).join(', ') || U]]),
        '',
        '## 5. Success criteria',
        bullets(reqs.filter((r) => r.acceptance_criterion).map((r) => `${val(r.code)}: ${val(r.acceptance_criterion)}`), '_No acceptance criteria recorded — define them before G0._'),
        '',
        '## 6. Risks',
        bullets(risks.map((r) => `${r.name} (${val(r.risk_status)})`)),
        '',
        '## 7. Open questions (from the gap engine)',
        bullets(gaps.map((g) => `${g.item} — ${g.action ?? g.detail}`)),
        '',
        '## 8. Next action',
        val(nextActionFor(s).action),
      ].join('\n');
    },
  },
  {
    id: 'rfq',
    title: 'Request for Quotation (RFQ)',
    purpose: 'Items, quantities, specifications and terms sent to suppliers.',
    entities: ['rfq'],
    render: ([s0], ctx) => {
      const r = s0 as unknown as Rfq & R;
      return [
        header(`RFQ — ${r.name}`, [r], ctx),
        table(['Field', 'Value'], [['Status', r.rfq_status], ['BOM', name(ctx, r.bom_id)], ['Project', name(ctx, r.project_id)], ['Suppliers invited', r.supplier_ids.map((i) => name(ctx, i)).join(', ') || U]]),
        '',
        '## Items',
        table(['Line', 'Part', 'Specification', 'Qty', 'Unit', 'Quality', 'Delivery', 'Technical requirements'], r.items.map((i) => [i.line_id, i.part, val(i.specification), String(i.quantity), i.unit, val(i.quality), val(i.delivery), val(i.technical_requirements)])),
        '',
        '## Commercial terms',
        val(r.commercial_terms),
        '',
        '## Please quote',
        bullets(['Unit price and currency, validity', 'Lead time and MOQ', 'Compliance with each technical requirement, with deviations stated', 'Country of origin and HSN code', 'Warranty and service terms']),
      ].join('\n');
    },
  },
  {
    id: 'techspec',
    title: 'Technical Specification',
    purpose: 'The configured machine: platform, laser, optics, modules, physics and compatibility.',
    entities: ['configuration'],
    render: ([s0], ctx) => {
      const c = s0 as unknown as Configuration & R;
      const e = ctx.engine;
      const st = stateFromConfiguration(c);
      const ph = e?.physics(st);
      const comp = e?.compatibility(st) ?? [];
      const price = e?.price(st);
      const f = (x: { value: number | null; unit: string } | null | undefined, d = 2) => (x?.value == null ? U : `${x.value.toFixed(d)} ${x.unit}`);
      return [
        header(`Technical specification — ${c.name}`, [c], ctx),
        '## Machine',
        table(['Item', 'Value'], [['Platform', name(ctx, c.product_id)], ['Designation', val(c.designation ?? e?.designation(st))], ['Laser source', `${e?.sources.get(c.source_key ?? '')?.name ?? val(c.source_key)}, ${val(c.power_w)} W`], ['Objective', e?.lenses.get(c.lens_key ?? '')?.name ?? val(c.lens_key)], ['Modules', [...c.modules, ...c.extras].map((k) => e?.modules.get(k)?.name ?? k).join(', ') || 'Standard content only'], ['Software', e?.modules.get(c.software ?? '')?.name ?? val(c.software)], ['Target throughput', c.target_per_hour ? `${c.target_per_hour} parts/h` : U]]),
        '',
        '## Optics & process physics (calculated)',
        table(['Quantity', 'Value', 'Basis'], ph ? [['Spot diameter', f(ph.spot, 1), 'Handbook L1'], ['Depth of focus', f(ph.dof), 'Handbook L2'], ['Pulse energy', f(ph.pulseEnergy, 3), 'Handbook L4'], ['Peak power', f(ph.peakPower), 'Handbook L5'], ['Fluence', f(ph.fluence), 'Handbook L6'], ['Process regime', ph.regime?.name ?? U, 'irradiance / fluence'], ['Cooling', ph.cooling ?? U, 'wall-plug estimate']] : []),
        '',
        '## Compatibility checks',
        table(['Check', 'Status', 'Detail'], comp.map((x) => [x.check, x.status, x.detail])),
        '',
        '## Indicative price (ESTIMATE, not a quotation)',
        price?.band ? `INR ${price.band[0].toLocaleString('en-IN')} – ${price.band[1].toLocaleString('en-IN')}` : U,
      ].join('\n');
    },
  },
  {
    id: 'bom',
    title: 'Bill of Materials',
    purpose: 'Hierarchical BOM with cost basis, supplier, lead time and import status on every line.',
    entities: ['bom'],
    render: ([s0], ctx) => {
      const b = s0 as R;
      const lines = (b.lines as BomLine[] | undefined) ?? [];
      const known = lines.filter((l) => l.unit_cost != null && l.level !== 'Product').reduce((a, l) => a + (l.unit_cost ?? 0) * l.quantity, 0);
      return [
        header(`BOM — ${b.name}`, [b], ctx),
        table(['Field', 'Value'], [['Type', val(b.bom_type)], ['Revision', val(b.revision)], ['Product', name(ctx, b.product_id)], ['Configuration', name(ctx, b.configuration_id)]]),
        '',
        table(['Line', 'Level', 'Description', 'Qty', 'Make/Buy', 'Supplier', 'Unit cost', 'Basis', 'Lead time (wk)', 'Import'], lines.map((l) => [l.line_id, l.level, l.description, `${l.quantity} ${l.unit}`, l.make_buy, val(l.supplier), l.unit_cost == null ? U : `${l.currency} ${l.unit_cost.toLocaleString('en-IN')}`, l.cost_basis, val(l.lead_time_weeks), l.import_item ? 'yes' : 'no'])),
        '',
        `**Sum of priced lines (excluding the product header):** INR ${known.toLocaleString('en-IN')} — lines with UNKNOWN cost: ${lines.filter((l) => l.unit_cost == null).length}.`,
      ].join('\n');
    },
  },
  {
    id: 'suppliers',
    title: 'Supplier Comparison',
    purpose: 'Recorded supplier facts side by side, with each supplier’s trust label.',
    entities: ['supplier'],
    multi: true,
    render: (subjects, ctx) => {
      const ss = subjects as unknown as (Supplier & R)[];
      const rows: [string, (s: Supplier & R) => string][] = [
        ['Trust', (s) => trustLabel(s)],
        ['Country', (s) => val(s.country)],
        ['Category', (s) => val(s.category)],
        ['Capabilities', (s) => val(s.capabilities)],
        ['Products', (s) => val(s.products)],
        ['Typical lead time', (s) => val(s.typical_lead_time)],
        ['MOQ', (s) => val(s.moq)],
        ['Payment terms', (s) => val(s.payment_terms)],
        ['Certifications', (s) => val(s.certifications)],
        ['India presence', (s) => val(s.india_presence)],
        ['Service', (s) => val(s.service)],
        ['Supplier risk', (s) => val(s.supplier_risk)],
        ['Alternates', (s) => (s.alternate_ids ?? []).map((i) => name(ctx, i)).join(', ') || U],
      ];
      return [header('Supplier comparison', ss, ctx), table(['Field', ...ss.map((s) => s.name)], rows.map(([l, f]) => [l, ...ss.map(f)]))].join('\n');
    },
  },
  {
    id: 'poc',
    title: 'POC Plan',
    purpose: 'Objective, samples, set-up, parameters, DOE, measurements and acceptance — results left to record.',
    entities: ['poc'],
    render: ([s0], ctx) => {
      const p = s0 as unknown as Poc & R;
      const doe = p.doe_id ? (ctx.byId.get(p.doe_id) as unknown as Doe | undefined) : undefined;
      const reqs = (ctx.records as R[]).filter((r) => r.entity === 'requirement' && p.opportunity_id && r.opportunity_id === p.opportunity_id);
      return [
        header(`POC plan — ${p.name}`, [p], ctx),
        '## Objective',
        val(p.objective),
        '',
        '## Samples & set-up',
        table(['Item', 'Value'], [['Customer', name(ctx, p.customer_id)], ['Part', val(p.part)], ['Material', name(ctx, p.material_id)], ['Lot', val(p.lot)], ['Laser source', name(ctx, p.source_id)], ['Power', p.power_w != null ? `${p.power_w} W` : U], ['Optic', name(ctx, p.optic_id)]]),
        '',
        '## Parameters',
        table(['Parameter', 'Value'], (p.parameters ?? []).map((x) => [String((x as { name?: string }).name ?? ''), val((x as { value?: unknown }).value)])),
        '',
        '## Design of experiments',
        doe ? table(['Factor', 'Unit', 'Levels'], doe.factors.map((f) => [f.name, val(f.unit), f.levels.join(', ')])) + `\n\nRuns: ${doe.runs.length} · replicates: ${doe.replicates} · responses: ${doe.responses.map((r) => r.name).join(', ') || U}` : '_No DOE linked._',
        '',
        '## Acceptance (from the customer’s requirements)',
        reqTable(reqs),
        '',
        '## Results',
        '_To be recorded from measurements. Nothing is pre-filled._',
        '',
        '## Open questions',
        bullets(p.open_questions ?? []),
      ].join('\n');
    },
  },
  {
    id: 'dfm',
    title: 'DFM Checklist',
    purpose: 'Design-for-manufacturing and manufacturing-readiness checks from the TEAL Automation handbook.',
    entities: ['product', 'project'],
    render: ([s0], ctx) =>
      [
        header(`DFM checklist — ${s0.name}`, [s0], ctx),
        '## Design checklist',
        '_Source: Automation Equipment Building Handbook, Part 32.11 (Design for manufacturing and assembly)._',
        '',
        checklist(DFM),
        '',
        '## Manufacturing readiness (G5)',
        '_Source: Automation Equipment Building Handbook, Part 57.9._',
        '',
        checklist(G5),
        '',
        '## Reviewer, date, open issues',
        table(['Reviewer', 'Date', 'Open issues'], [['', '', '']]),
      ].join('\n'),
  },
  {
    id: 'validation',
    title: 'Validation Plan',
    purpose: 'Each requirement with its verification method, acceptance criterion and FAT / SAT test.',
    entities: ['project', 'opportunity'],
    render: ([s0], ctx) => {
      const s = s0 as R;
      const reqs = requirementsOf(ctx, s);
      const protos = (ctx.records as R[]).filter((r) => r.entity === 'acceptance' && r.project_id === s.id) as unknown as (AcceptanceProtocol & R)[];
      const testFor = (id: string) => protos.flatMap((p) => p.tests.filter((t) => t.requirement_id === id).map((t) => `${p.phase} ${t.test_id} (${t.result})`)).join(', ');
      return [
        header(`Validation plan — ${s.name}`, [s], ctx),
        table(['Requirement', 'Value', 'Verification method', 'Acceptance criterion', 'FAT / SAT test'], reqs.map((r) => [`${val(r.code)} ${r.name}`, val(r.value), val(r.verification_method), val(r.acceptance_criterion), testFor(r.id) || 'not yet in a protocol'])),
        '',
        '## Protocols',
        bullets(protos.map((p) => `${p.phase}: ${p.name} — ${p.tests.length} test(s), ${p.tests.filter((t) => t.result === 'PASS').length} passed`)),
        '',
        '## Responsibilities & schedule',
        table(['Activity', 'Owner', 'Date'], [['FAT', '', ''], ['SAT', '', '']]),
      ].join('\n');
    },
  },
  {
    id: 'mom',
    title: 'Project MOM (minutes of meeting)',
    purpose: 'Meeting record: attendees, agenda, minutes, decisions and actions with owners.',
    entities: ['activity', 'project'],
    render: ([s0], ctx) => {
      const s = s0 as R;
      const projectId = s.entity === 'project' ? s.id : (s.project_id as string | undefined);
      const actions = (ctx.records as R[]).filter((r) => r.entity === 'activity' && r.id !== s.id && ((projectId && r.project_id === projectId) || (s.opportunity_id && r.opportunity_id === s.opportunity_id)) && r.status !== 'Completed');
      const decisions = linked(ctx, s.id, 'decision');
      return [
        header(`Minutes — ${s.name}`, [s], ctx),
        table(['Field', 'Value'], [['Date', val(s.due_date ?? ctx.today)], ['Project', name(ctx, projectId)], ['Customer', name(ctx, s.customer_id)], ['Attendees', val(s.attendees)]]),
        '',
        '## Agenda / purpose',
        val(s.description),
        '',
        '## Minutes',
        val(s.minutes),
        '',
        '## Decisions',
        bullets(decisions.map((d) => `${d.name}: ${val(d.decision)}`)),
        '',
        '## Actions',
        table(['Action', 'Owner', 'Due', 'Status'], actions.map((a) => [a.name, val(a.owner), val(a.due_date), val(a.status)])),
      ].join('\n');
    },
  },
  {
    id: 'review',
    title: 'Product Review',
    purpose: 'Where a product stands: lifecycle, applications, POCs, projects, cost, risks, lessons and next actions.',
    entities: ['product'],
    render: ([s0], ctx) => {
      const p = s0 as unknown as Product & R;
      const lc = lifecycleFor(ctx.graph, p.id);
      const of = (e: string) => linked(ctx, p.id, e);
      return [
        header(`Product review — ${p.name}`, [p], ctx),
        table(['Field', 'Value'], [['Title', val(p.title)], ['Maturity', val(p.maturity)], ['Lifecycle', `${lc.doneCount}/17 stages evidenced · next: ${lc.current ?? 'complete'}`], ['Industries', (p.industries ?? []).map((i) => name(ctx, i)).join(', ') || U], ['Powers (W)', val(p.powers_w)], ['Lead time', p.lead_time_weeks ? `${p.lead_time_weeks} weeks` : U], ['Base price', p.base_price_inr ? `INR ${p.base_price_inr.toLocaleString('en-IN')} (ESTIMATE)` : U]]),
        '',
        '## Applications',
        bullets((p.applications ?? []).map((a) => a.name)),
        '',
        '## POCs, projects, risks, lessons',
        table(['Type', 'Records'], [['POCs', of('poc').map((x) => x.name).join(', ')], ['Projects', of('project').map((x) => x.name).join(', ')], ['Open risks', of('risk').filter((x) => x.risk_status === 'Open').map((x) => x.name).join(', ')], ['Lessons', of('lesson').map((x) => x.name).join(', ')]]),
        '',
        '## Next actions',
        bullets(lc.stages.filter((s) => !s.done).slice(0, 3).map((s) => `${s.stage}: ${s.rule}`)),
      ].join('\n');
    },
  },
  {
    id: 'techassess',
    title: 'Technology Assessment',
    purpose: 'TRL with its basis, maturity by the published rule, suppliers, alternatives, cost, lead time, localization, risks and references.',
    entities: ['technology'],
    render: ([s0], ctx) => {
      const t = s0 as unknown as Technology & R;
      const lane = maturityLane(t);
      return [
        header(`Technology assessment — ${t.name}`, [t], ctx),
        table(['Field', 'Value'], [
          ['Category', val(t.category)],
          ['Domain', val(t.domain)],
          ['TRL', t.trl != null ? `${t.trl} — basis: ${val(t.trl_basis)}` : 'Not assessed'],
          ['Maturity', lane === 'Not assessed' ? 'Not assessed (no TRL)' : `${lane} (${MATURITY_RULE[lane]})`],
          ['Market maturity (evidence)', val(t.radar_status)],
          ['TEAL radar ring', t.adoption ? `${t.adoption} — ${val(t.adoption_rationale)}` : 'Not classified'],
          ['Performance', val(t.performance)],
          ['Suppliers', (t.supplier_ids ?? []).map((i) => name(ctx, i)).join(', ') || U],
          ['Alternatives', (t.alternate_ids ?? []).map((i) => name(ctx, i)).join(', ') || U],
          ['Cost', val(t.cost_note)],
          ['Lead time', val(t.lead_time)],
          ['Localization', val(t.localization)],
          ['Laser source classes', (t.laser_source_ids ?? []).map((i) => name(ctx, i)).join(', ') || '—'],
        ]),
        '',
        '## Risks',
        bullets(t.risks ?? []),
        '',
        '## References & evidence',
        bullets([...(t.references ?? []), ...(t.evidence_ids ?? []).map((i) => name(ctx, i)), ...(t.knowledge_refs ?? []).slice(0, 5).map((r) => `Handbook: ${decodeURIComponent(r.split('#')[1] ?? r).replace(/-/g, ' ')}`)]),
      ].join('\n');
    },
  },
];

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);
