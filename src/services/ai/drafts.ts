import type { ConfigureResult } from './configure';
import { REQUIREMENT_FIELDS } from './agents';

/*
 * RFQ / URS / FMEA DRAFTS (AI master prompt §34, §35, §54). Editable Markdown built only from the
 * extracted requirements and the configuration. Anything not stated is "TO BE CONFIRMED" — never a
 * guessed number. Every draft opens with the review banner; FMEA ratings are left unscored.
 */

export const REVIEW_BANNER = 'DRAFT — ENGINEERING REVIEW REQUIRED';
const TBC = 'TO BE CONFIRMED';

const val = (f: { value: string | number | null; unit?: string; status: string }) => (f.value == null ? TBC : `${f.value}${f.unit ? ` ${f.unit}` : ''}${f.status === 'CALCULATED' ? ' (calculated)' : ''}`);
const today = () => new Date().toISOString().slice(0, 10);

function requirementTable(c: ConfigureResult): string[] {
  const rows = REQUIREMENT_FIELDS.map((k) => c.req[k]).map((f) => `| ${f.label} | ${val(f)} | ${f.status === 'NOT DEFINED' ? 'Not Defined' : f.basis.replace(/\|/g, '/')} |`);
  return ['| Parameter | Requirement | Basis |', '|---|---|---|', ...rows];
}

export function rfqDraft(c: ConfigureResult, opts: { title?: string } = {}): { title: string; markdown: string } {
  const top = c.pkg?.matches[0];
  const title = opts.title ?? `RFQ — ${c.req.process.value ?? 'Equipment'}${c.req.material.value ? ` on ${c.req.material.value}` : ''}`;
  const lines = c.pkg?.bom?.lines.filter((l) => l.level !== 'Product' && l.make_buy === 'Buy') ?? [];
  const md = [
    `# ${title}`,
    '',
    `> **${REVIEW_BANNER}** · generated ${today()} by TEAL Intelligence from the requirement text. Values marked ${TBC} are not known and must be confirmed before issue.`,
    '',
    '## 1. Technical scope',
    `Supply of ${c.req.automation.value ? `a ${String(c.req.automation.value).toLowerCase()} ` : 'a '}${String(c.req.process.value ?? 'laser processing').toLowerCase()} system${c.req.material.value ? ` for ${c.req.material.value}` : ''}${top ? ` (reference architecture: ${top.product.name})` : ''}.`,
    '',
    '## 2. Requirements',
    ...requirementTable(c),
    '',
    '## 3. Items requested',
    ...(lines.length ? ['| Item | Qty | Specification | Notes |', '|---|---|---|---|', ...lines.map((l) => `| ${l.description} | ${l.quantity} | ${TBC} | ${l.import_item ? 'Imported item — state origin' : ''} |`)] : [`Complete system — item breakdown ${TBC}.`]),
    '',
    '## 4. Quantity',
    `${TBC} (systems and spares).`,
    '',
    '## 5. Deliverables requested from the supplier',
    '- Equipment as specified, with a compliance statement against every requirement line (comply / deviate / exception)',
    '- Documentation: layout, electrical schematics, pneumatic schematic, BOM with makes, manuals, software backup',
    '- FAT at the supplier and SAT at site, with protocols submitted for approval before the tests',
    '- Training for operators and maintenance',
    '',
    '## 6. Acceptance criteria',
    `- Throughput / cycle time: ${val(c.req.throughput)} — verified by a run-at-rate at FAT`,
    `- Quality: ${val(c.req.quality)} — measurement method and limit ${TBC}`,
    `- Accuracy: ${val(c.req.accuracy)}`,
    '- Safety: laser safety and machine safety conformity evidence (standards to be agreed)',
    '',
    '## 7. Commercial requirements',
    '- Price breakdown per item, currency and validity',
    '- Delivery lead time per item and for the complete system',
    '- Payment terms, warranty period, spares list with prices, service response time',
    '- Country of origin for each major item',
    '',
    '## Open questions',
    ...(c.gaps.length ? c.gaps.map((g) => `- ${g}`) : ['- None recorded']),
  ].join('\n');
  return { title, markdown: md };
}

export function ursDraft(c: ConfigureResult, opts: { title?: string } = {}): { title: string; markdown: string } {
  const title = opts.title ?? `URS — ${c.req.process.value ?? 'Equipment'}${c.req.material.value ? ` on ${c.req.material.value}` : ''}`;
  const reqs = c.pkg?.requirements ?? [];
  const md = [
    `# ${title}`,
    '',
    `> **${REVIEW_BANNER}** · each line needs a value, condition, verification method and acceptance criterion. ${TBC} = not stated by the customer.`,
    '',
    '## Functional requirements',
    ...(reqs.filter((r) => ['Process', 'Functional'].includes(String(r.category))).map((r) => `- **${r.code}** ${r.name} — verification: ${r.verification_method ?? TBC}; acceptance: ${r.acceptance_criterion ?? TBC}`) || []),
    `- Process: ${val(c.req.process)} on ${val(c.req.material)}; content: ${val(c.req.code)}`,
    '',
    '## Performance requirements',
    `- Cycle time: ${val(c.req.cycleTime)} · throughput: ${val(c.req.throughput)}`,
    `- Working / marking area: ${val(c.req.workingArea)} · part dimensions: ${val(c.req.partSize)} · material thickness: ${val(c.req.thickness)}`,
    `- Accuracy: ${val(c.req.accuracy)}`,
    '',
    '## Quality',
    `- ${val(c.req.quality)} — measurement method and acceptance limit ${TBC}`,
    ...reqs.filter((r) => r.category === 'Quality').map((r) => `- **${r.code}** ${r.name}`),
    '',
    '## Safety',
    ...reqs.filter((r) => r.category === 'Safety').map((r) => `- **${r.code}** ${r.name} — ${r.acceptance_criterion ?? TBC}`),
    '- Machine safety risk assessment and safety functions — standards and performance levels to be agreed',
    '',
    '## Interfaces',
    ...(reqs.filter((r) => r.category === 'Interface').map((r) => `- **${r.code}** ${r.name}`).length ? reqs.filter((r) => r.category === 'Interface').map((r) => `- **${r.code}** ${r.name}`) : [`- Upstream / downstream handshake, MES / host protocol: ${TBC}`]),
    '',
    '## Environment',
    `- Site conditions (temperature, humidity, cleanroom class, utilities): ${TBC}`,
    '',
    '## Compliance',
    `- Applicable standards and certifications: ${TBC} — no compliance is claimed by this draft`,
    '',
    '## Documentation',
    '- Manuals, drawings, schematics, BOM, software backup, FAT/SAT protocols and reports',
    '',
    '## Acceptance criteria',
    '- FAT: run-at-rate, quality sampling and safety function tests against the lines above',
    '- SAT: repeat at site with customer parts over an agreed production period',
  ].join('\n');
  return { title, markdown: md };
}

/** Generic starter failure modes per subsystem role — AI-SUGGESTED, never product data. */
export const FMEA_LIBRARY: Record<string, { fn: string; mode: string; effect: string; cause: string; control: string; detection: string; action: string }[]> = {
  'Laser source': [{ fn: 'Deliver the specified average power / pulse energy', mode: 'Output power drift or drop', effect: 'Process result out of specification (contrast, depth, penetration)', cause: 'Source ageing, contamination of the output optics, thermal drift', control: 'Power verification at defined intervals (to define)', detection: 'Power meter check; process monitoring / vision grading', action: 'Define the power check interval and acceptance band' }],
  'Scan head (galvo)': [{ fn: 'Position the beam in the field', mode: 'Position error / drift', effect: 'Feature out of position tolerance', cause: 'Thermal drift, lost field calibration', control: 'Field calibration procedure', detection: 'Vision position check', action: 'Set a calibration schedule and a vision position check' }],
  'F-theta objective': [{ fn: 'Focus the beam uniformly across the field', mode: 'Lens contamination or damage', effect: 'Larger spot, lower fluence, inconsistent result', cause: 'Process fume deposition, back-reflection', control: 'Protective window, fume extraction', detection: 'Visual inspection; result drift', action: 'Define window inspection / replacement interval' }],
  'Processing head': [{ fn: 'Deliver focused beam and process gas', mode: 'Focus position drift / protective window soiling', effect: 'Weld / cut quality loss', cause: 'Spatter, thermal lensing, mechanical shift', control: 'Window change routine', detection: 'Process monitoring', action: 'Define window change and focus check routine' }],
  'Vision camera': [{ fn: 'Verify the result / locate the part', mode: 'False accept or false reject', effect: 'Bad part shipped or good part scrapped', cause: 'Lighting change, focus drift, threshold setting', control: 'Golden-sample check', detection: 'Periodic challenge parts', action: 'Define challenge-part test and threshold ownership' }],
  'Controller (PLC / IPC)': [{ fn: 'Sequence the machine and exchange data', mode: 'Communication loss / sequence fault', effect: 'Stop, lost traceability data', cause: 'Network fault, software error', control: 'Watchdogs, alarm handling', detection: 'Alarm log', action: 'Define recovery sequence and data buffering' }],
  Safety: [{ fn: 'Prevent exposure to laser radiation and moving parts', mode: 'Interlock failure or bypass', effect: 'Risk of injury', cause: 'Component failure, tampering', control: 'Safety-rated interlocks', detection: 'Periodic safety function test', action: 'Safety validation by a qualified engineer (standards and performance level to be agreed)' }],
  Chiller: [{ fn: 'Keep the source at operating temperature', mode: 'Coolant flow / temperature out of range', effect: 'Source shutdown or power instability', cause: 'Clogged filter, low coolant, ambient heat', control: 'Flow / temperature interlock', detection: 'Chiller alarm', action: 'Define filter and coolant maintenance interval' }],
  'Fume extraction': [{ fn: 'Remove process fume', mode: 'Airflow drop', effect: 'Optics contamination, operator exposure', cause: 'Filter saturation', control: 'Differential-pressure monitoring', detection: 'Filter alarm', action: 'Define filter change criterion' }],
  'Motion / handling': [{ fn: 'Present the part at the process position', mode: 'Part mis-positioned or jammed', effect: 'Process on the wrong location, stop', cause: 'Part variation, fixture wear, sensor fault', control: 'Part-present sensing, fixture design', detection: 'Sensor check; vision', action: 'Define part tolerance with the customer and fixture checks' }],
};

export function fmeaDraft(c: ConfigureResult, opts: { title?: string } = {}): { title: string; markdown: string } {
  const title = opts.title ?? `FMEA (starter) — ${c.req.process.value ?? 'Equipment'}${c.req.material.value ? ` on ${c.req.material.value}` : ''}`;
  const roles = c.components.map((x) => x.role).filter((r) => FMEA_LIBRARY[r]);
  const rows = roles.flatMap((r) => FMEA_LIBRARY[r].map((m) => `| ${r} | ${m.fn} | ${m.mode} | ${m.effect} | ${m.cause} | ${m.control} | ${m.detection} | — | — | — | ${m.action} |`));
  const md = [
    `# ${title}`,
    '',
    `> **AI-SUGGESTED · ${REVIEW_BANNER}** · generic starter failure modes per subsystem. Severity (S), occurrence (O) and detection (D) are deliberately **not scored** — they need engineering judgement for this machine. No safety or regulatory compliance is claimed.`,
    '',
    '| Subsystem | Function | Potential failure | Effect | Cause | Current control | Detection | S | O | D | Recommended action |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...rows,
  ].join('\n');
  return { title, markdown: md };
}
