/**
 * DEMO scenario data (spec §133–§137). Everything here is data_type DEMO and is shown with a
 * DEMO badge. Deliberately absent: prices, market numbers, POC/DOE results, FAT/SAT results,
 * lessons learned and machine records — those must come from real work, never from a seed.
 * Dates use "@today±N" and are resolved when the data is loaded.
 *
 *   npx tsx scripts/data/buildDemoData.ts
 */
import { join } from 'node:path';
import { DATA_DIR, writeJson } from '../lib/dataset';

const TODAY = '2026-09-26';
const prov = { source_id: 'src-os-spec', verification_status: 'DRAFT', note: 'DEMO scenario record (spec §133–§137). Not real customer data.' };
const base = { data_type: 'DEMO', provenance: prov };
const hdr = (id: string, title: string, entity: string, description: string) => ({
  id,
  title,
  entity,
  description,
  version: '1.0.0',
  last_updated: TODAY,
  data_type: 'DEMO',
  source_ids: ['src-os-spec'],
  relative_dates: true,
});

export const S1_INQUIRY =
  'Need inline laser marking of semiconductor packages, 2D code, high throughput, automatic handling, vision inspection and MES communication. Customer supplies laser.';

writeJson(join(DATA_DIR, 'demo', 'customers.json'), {
  dataset: hdr('demo-customers', 'DEMO customers', 'customer', 'Fictional customers for the demonstration scenarios.'),
  records: [
    { ...base, id: 'cus-demo-osat', entity: 'customer', name: 'DEMO OSAT Customer', industry: 'Semiconductor', segment: 'Strategic', location: 'India (DEMO)', sites: ['Assembly & test site (DEMO)'], contacts: [{ name: 'DEMO Contact — Process Engineering', role: 'Process engineering' }], next_action: { action: 'Confirm package types, UPH and host protocol for the marking line', due: '@today+2', owner: 'Product Manager' } },
    { ...base, id: 'cus-demo-ems', entity: 'customer', name: 'DEMO EMS Customer', industry: 'EMS', segment: 'Key Account', location: 'India (DEMO)', contacts: [{ name: 'DEMO Contact — SMT Engineering', role: 'SMT engineering' }], next_action: { action: 'Share C2i concept and ask for board samples', due: '@today+5', owner: 'Product Manager' } },
    { ...base, id: 'cus-demo-battery', entity: 'customer', name: 'DEMO Battery Pack Customer', industry: 'Battery', segment: 'Growth', location: 'India (DEMO)', next_action: { action: 'Qualify busbar welding interest (materials, joint design)', due: '@today+9', owner: 'Product Manager' } },
  ],
});

writeJson(join(DATA_DIR, 'demo', 'opportunities.json'), {
  dataset: hdr('demo-opportunities', 'DEMO opportunities', 'opportunity', 'Scenario opportunities. Values and probabilities are intentionally UNKNOWN.'),
  records: [
    { ...base, id: 'opp-demo-pkg-marking', entity: 'opportunity', name: 'Inline package marking line (Scenario 1)', stage: 'Requirement', customer_id: 'cus-demo-osat', industry: 'Semiconductor', inquiry_text: S1_INQUIRY, product_id: 'prd-semispm', value: null, probability: null, technical_status: 'Requirements being drafted', commercial_status: 'No price discussed', next_action: { action: 'Run "Create product from inquiry" and review the draft package with the customer', due: '@today+1', owner: 'Product Manager' } },
    { ...base, id: 'opp-demo-pcb-co2', entity: 'opportunity', name: 'CO₂ inline PCB marking (Scenario 2)', stage: 'Feasibility', customer_id: 'cus-demo-ems', industry: 'EMS', product_id: 'prd-markc2i', configuration_id: 'cfg-demo-c2i', value: null, probability: null, technical_status: 'Platform fit identified (Mark PCB C2i)', next_action: { action: 'Plan sample marking on customer boards (solder mask colours)', due: '@today+4', owner: 'Application Engineering' } },
    { ...base, id: 'opp-demo-atmp', entity: 'opportunity', name: 'ATMP back-end laser equipment study (Scenario 3)', stage: 'Discovery', customer_id: 'cus-demo-osat', industry: 'ATMP', value: null, probability: null, technical_status: 'Mapping laser processes to the ATMP flow', next_action: { action: 'Review Semiconductor Handbook Part XXXII against TEAL modules and list gaps', due: '@today+7', owner: 'Product Manager' } },
  ],
});

writeJson(join(DATA_DIR, 'demo', 'activities.json'), {
  dataset: hdr('demo-activities', 'DEMO activities', 'activity', 'Product-manager activities for the demonstration day.'),
  records: [
    { ...base, id: 'act-demo-1', entity: 'activity', kind: 'follow_up', name: 'Follow up: OSAT marking inquiry — confirm UPH and package list', priority: 'High', status: 'In Progress', due_date: '@today', customer_id: 'cus-demo-osat', opportunity_id: 'opp-demo-pkg-marking', next_action: { action: 'Call process engineering lead', due: '@today' } },
    { ...base, id: 'act-demo-2', entity: 'activity', kind: 'meeting', name: 'Technical meeting: package marking requirements review', priority: 'High', status: 'Not Started', due_date: '@today+1', customer_id: 'cus-demo-osat', opportunity_id: 'opp-demo-pkg-marking', attendees: 'PM, Application Engineering, customer process team (DEMO)' },
    { ...base, id: 'act-demo-3', entity: 'activity', kind: 'task', name: 'Send POC plan for mould-compound marking', priority: 'Medium', status: 'Not Started', due_date: '@today-2', customer_id: 'cus-demo-osat', poc_id: 'poc-demo-pkg-marking', blocker: 'Samples not yet received' },
    { ...base, id: 'act-demo-4', entity: 'activity', kind: 'task', name: 'Request UV DPSS datasheets from candidate suppliers (Laser Handbook §21.3 list)', priority: 'Medium', status: 'Waiting', due_date: '@today+3', workstream: 'Supplier Development' },
    { ...base, id: 'act-demo-5', entity: 'activity', kind: 'task', name: 'Prepare G1 concept review pack — C2i PCB marking', priority: 'High', status: 'In Progress', due_date: '@today+6', customer_id: 'cus-demo-ems', project_id: 'prj-demo-c2i' },
    { ...base, id: 'act-demo-6', entity: 'activity', kind: 'task', name: 'Localization: list imported items on the C2i BOM', priority: 'Low', status: 'Not Started', due_date: '@today+12', project_id: 'prj-demo-c2i', workstream: 'Localization' },
    { ...base, id: 'act-demo-7', entity: 'activity', kind: 'call', name: 'Battery customer: busbar welding discovery call', priority: 'Medium', status: 'Completed', due_date: '@today-1', customer_id: 'cus-demo-battery', minutes: 'DEMO: customer interested; joint design and materials to be shared.' },
  ],
});

writeJson(join(DATA_DIR, 'demo', 'requirements.json'), {
  dataset: hdr('demo-requirements', 'DEMO requirements (Scenario 1)', 'requirement', 'Draft URS lines derived from the Scenario 1 inquiry. Values the customer has not given are left blank.'),
  records: [
    { ...base, id: 'req-demo-s1-01', entity: 'requirement', code: 'URS-001', name: 'Mark a 2D code on each semiconductor package', level: 'URS', category: 'Process', priority: 'Must', source: S1_INQUIRY, verification_method: 'Test', acceptance_criterion: 'Code grade to be agreed (e.g. ISO/IEC 29158) — UNKNOWN', opportunity_id: 'opp-demo-pkg-marking', status: 'Draft', next_action: { action: 'Agree code size, content and minimum grade with customer' } },
    { ...base, id: 'req-demo-s1-02', entity: 'requirement', code: 'URS-002', name: 'High throughput', level: 'URS', category: 'Performance', priority: 'Must', source: S1_INQUIRY, unit: 'UPH', verification_method: 'Test', acceptance_criterion: 'Run-at-rate at FAT — rate UNKNOWN until customer states it', opportunity_id: 'opp-demo-pkg-marking', status: 'Draft', next_action: { action: 'Obtain required UPH and shift pattern (Automation Handbook Part 4)' } },
    { ...base, id: 'req-demo-s1-03', entity: 'requirement', code: 'URS-003', name: 'Automatic handling of packages/strips', level: 'URS', category: 'Functional', priority: 'Must', source: S1_INQUIRY, verification_method: 'Demonstration', opportunity_id: 'opp-demo-pkg-marking', status: 'Draft', next_action: { action: 'Confirm strip vs singulated units and magazine/tray format' } },
    { ...base, id: 'req-demo-s1-04', entity: 'requirement', code: 'URS-004', name: 'Vision inspection of the mark', level: 'URS', category: 'Quality', priority: 'Must', source: S1_INQUIRY, verification_method: 'Test', opportunity_id: 'opp-demo-pkg-marking', status: 'Draft', next_action: { action: 'Define inspection criteria (decode, grade, position)' } },
    { ...base, id: 'req-demo-s1-05', entity: 'requirement', code: 'URS-005', name: 'MES communication', level: 'URS', category: 'Interface', priority: 'Must', source: S1_INQUIRY, verification_method: 'Test', opportunity_id: 'opp-demo-pkg-marking', status: 'Draft', next_action: { action: 'Confirm host protocol (SECS/GEM or other) and data dictionary' } },
    { ...base, id: 'req-demo-s1-06', entity: 'requirement', code: 'URS-006', name: 'Laser source supplied by customer', level: 'URS', category: 'Interface', priority: 'Must', source: S1_INQUIRY, verification_method: 'Inspection', opportunity_id: 'opp-demo-pkg-marking', status: 'Draft', next_action: { action: 'Obtain laser model, interface, safety interlock scheme and warranty boundary' } },
  ],
});

// DOE plan: 3 × 3 × 2 full factorial, results empty (to be measured).
const powers = [10, 15, 20];
const speeds = [500, 1000, 2000];
const freqs = [20, 50];
const runs: unknown[] = [];
let n = 1;
for (const p of powers)
  for (const v of speeds)
    for (const f of freqs)
      runs.push({ run: n++, settings: { 'Average power': p, 'Mark speed': v, 'Pulse frequency': f }, results: { 'Code grade (0–4)': null, 'Mark contrast (%)': null } });

writeJson(join(DATA_DIR, 'demo', 'pocs.json'), {
  dataset: hdr('demo-pocs', 'DEMO POCs', 'poc', 'A planned POC. No results are recorded.'),
  records: [
    { ...base, id: 'poc-demo-pkg-marking', entity: 'poc', name: 'POC — 2D code marking on mould compound', poc_status: 'Samples Awaited', customer_id: 'cus-demo-osat', opportunity_id: 'opp-demo-pkg-marking', application_id: 'app-semispm.perunit', product_id: 'prd-semispm', objective: 'Establish a process window for readable 2D codes on the customer’s mould compound at the required rate', part: 'Customer package samples (type UNKNOWN)', material_id: 'mat-emc', source_id: 'las-fiber', power_w: 20, optic_id: 'opt-f163', doe_id: 'doe-demo-pkg-marking', decision: 'Undecided', open_questions: ['Package types and mould compound grades?', 'Required code size and grade?', 'Customer-supplied laser model and interface?'], next_action: { action: 'Receive samples and run DOE', due: '@today+5', owner: 'Application Engineering' } },
  ],
});

writeJson(join(DATA_DIR, 'demo', 'does.json'), {
  dataset: hdr('demo-does', 'DEMO DOE plans', 'doe', 'An unrun full-factorial DOE plan. All results are null (not measured).'),
  records: [
    { ...base, id: 'doe-demo-pkg-marking', entity: 'doe', name: 'DOE — power × speed × frequency on EMC', poc_id: 'poc-demo-pkg-marking', design: 'full_factorial', factors: [{ name: 'Average power', unit: 'W', levels: powers }, { name: 'Mark speed', unit: 'mm/s', levels: speeds }, { name: 'Pulse frequency', unit: 'kHz', levels: freqs }], responses: [{ name: 'Code grade (0–4)', lsl: 3, usl: null, target: 4 }, { name: 'Mark contrast (%)', unit: '%', lsl: null, usl: null, target: null }], constraints: ['No damage to die (verify by X-ray / decap if required)'], noise_factors: ['Mould compound lot', 'Surface texture'], replicates: 1, runs },
  ],
});

writeJson(join(DATA_DIR, 'demo', 'configurations.json'), {
  dataset: hdr('demo-configurations', 'DEMO configurations', 'configuration', 'Example configuration for Scenario 2.'),
  records: [
    { ...base, id: 'cfg-demo-c2i', entity: 'configuration', name: 'C2i — dual-side PCB ID, inline, graded', product_id: 'prd-markc2i', application_key: 'dual', source_key: 'co2', power_w: 30, lens_key: 'f254', modules: ['visfid', 'conveyor', 'fume', 'visver', 'reject'], software: 'inline', extras: ['mes'], opportunity_id: 'opp-demo-pcb-co2', customer_id: 'cus-demo-ems', version: 1 },
  ],
});

const t = (id: string, name: string, s: number, e: number, status: string, extra: Record<string, unknown> = {}) => ({
  id,
  name,
  start: `@today${s >= 0 ? '+' : ''}${s}`,
  end: `@today${e >= 0 ? '+' : ''}${e}`,
  status,
  ...extra,
});
writeJson(join(DATA_DIR, 'demo', 'projects.json'), {
  dataset: hdr('demo-projects', 'DEMO projects', 'project', 'Scenario 2 project skeleton. Gate reviews are recorded in the browser workspace.'),
  records: [
    {
      ...base,
      id: 'prj-demo-c2i',
      entity: 'project',
      name: 'C2i inline PCB marking — DEMO EMS Customer',
      customer_id: 'cus-demo-ems',
      opportunity_id: 'opp-demo-pcb-co2',
      product_id: 'prd-markc2i',
      configuration_id: 'cfg-demo-c2i',
      cost_model_id: 'cst-tpl-006k1jmy',
      scope: 'Dual-head CO₂ inline PCB marking with grading and reject (Scenario 2).',
      start: '@today-10',
      end: '@today+160',
      currency: 'INR',
      budget: null,
      tasks: [
        t('t1', 'Requirement capture & URS', -10, 2, 'In Progress', { gate_code: 'G0', owner: 'PM' }),
        t('t2', 'Sample marking on customer boards', 0, 10, 'Not Started', { depends_on: ['t1'], owner: 'Application Engineering' }),
        t('t3', 'Concept & architecture', 3, 25, 'Not Started', { depends_on: ['t1'], gate_code: 'G2', owner: 'System Engineer' }),
        t('t4', 'Detailed design', 25, 70, 'Not Started', { depends_on: ['t3'], gate_code: 'G3' }),
        t('t5', 'Procurement release', 60, 75, 'Not Started', { depends_on: ['t4'], gate_code: 'G4' }),
        t('t6', 'Build & integration', 75, 130, 'Not Started', { depends_on: ['t5'], gate_code: 'G7' }),
        t('t7', 'FAT', 130, 140, 'Not Started', { depends_on: ['t6'], gate_code: 'G8', milestone: true }),
        t('t8', 'Ship, install, SAT', 140, 160, 'Not Started', { depends_on: ['t7'], gate_code: 'G9', milestone: true }),
      ],
      gates: [],
      next_action: { action: 'Complete G0 evidence: signed URS values and CTQ list', due: '@today+2', owner: 'PM' },
    },
  ],
});

writeJson(join(DATA_DIR, 'demo', 'risks.json'), {
  dataset: hdr('demo-risks', 'DEMO risks', 'risk', 'Starter risks for Scenario 1. S/O/D are not scored (would require engineering judgement).'),
  records: [
    { ...base, id: 'rsk-demo-s1-laser', entity: 'risk', kind: 'Risk', name: 'Customer-supplied laser: interface, safety and warranty boundary undefined', cause: 'Laser model and control interface not yet known', effect: 'Integration rework; unclear responsibility at FAT/SAT', risk_status: 'Open', opportunity_id: 'opp-demo-pkg-marking', next_action: { action: 'Obtain laser model, interface specification and interlock scheme', due: '@today+3' } },
    { ...base, id: 'rsk-demo-s1-uph', entity: 'risk', kind: 'Process Risk', name: 'Throughput target unknown', cause: '"High throughput" not quantified', effect: 'Architecture (stations, heads) cannot be sized', risk_status: 'Open', opportunity_id: 'opp-demo-pkg-marking', next_action: { action: 'Get UPH and OEE target; compute CT_ideal (Handbook Part 4)', due: '@today+2' } },
  ],
});
console.log('DEMO data written');
