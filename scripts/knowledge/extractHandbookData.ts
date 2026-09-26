/**
 * Extract structured datasets from the handbook Markdown (knowledge/handbooks/**).
 * Nothing is invented: every value is a cell or heading from a handbook table, and each record
 * carries provenance (handbook, part, section). Re-run after re-converting the handbooks:
 *
 *   npx tsx scripts/knowledge/extractHandbookData.ts
 *
 * Outputs
 *   data/gates/gate-definitions.json        G0–G10 (Automation Handbook, "Design review gates G0–G10")
 *   data/knowledge/formulas.json            177-formula catalogue (Automation Handbook Part 54)
 *   data/semiconductor/value-chain.json     process steps + laser relevance (Semiconductor Handbook Part XXXII)
 *   data/companies/handbook-companies.json  companies named as representative suppliers
 *   data/evidence/handbook-evidence.json    one evidence record per extracted claim
 *   data/technology/technologies.json       radar topics (status NOT assessed) + knowledge refs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR, ROOT, writeJson } from '../lib/dataset';

const HB = join(ROOT, 'knowledge', 'handbooks');
const TODAY = '2026-09-26';

type Row = Record<string, string>;
interface Table {
  headers: string[];
  rows: Row[];
  heading: string; // nearest preceding heading
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function readPart(book: string, prefix: string): { file: string; text: string } {
  const file = readdirSync(join(HB, book)).find((f) => f.startsWith(prefix));
  if (!file) throw new Error(`No ${book} part starting with ${prefix}`);
  return { file, text: readFileSync(join(HB, book, file), 'utf-8') };
}

function splitRow(line: string): string[] {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let cur = '';
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === '\\' && inner[i + 1] === '|') {
      cur += '|';
      i++;
    } else if (ch === '|') {
      cells.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

export function parseTables(md: string): Table[] {
  const lines = md.split('\n');
  const tables: Table[] = [];
  let heading = '';
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const h = /^#{1,6} (.*)$/.exec(l);
    if (h) heading = h[1].trim();
    if (l.startsWith('|') && lines[i + 1]?.startsWith('|---')) {
      const headers = splitRow(l);
      const rows: Row[] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].startsWith('|')) {
        const cells = splitRow(lines[j]);
        // Source defect: a formula containing |x| splits a cell. Re-join the overflow into
        // the formula column so the remaining columns stay aligned to their headers.
        while (cells.length > headers.length) {
          const fi = headers.indexOf('Formula');
          const at = fi >= 0 ? fi : 1;
          cells.splice(at, 2, `${cells[at]} | ${cells[at + 1]}`.trim());
        }
        rows.push(Object.fromEntries(headers.map((hh, k) => [hh, cells[k] ?? ''])));
        j++;
      }
      tables.push({ headers, rows, heading });
      i = j - 1;
    }
  }
  return tables;
}

/** Split on commas that are not inside parentheses. */
function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === ';') && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const ref = (book: string, file: string, heading: string) => `${book}/${file}#${slug(heading)}`;

/* ============================================================== gates */
function gates() {
  const { file, text } = readPart('automation', '83-');
  const t = parseTables(text).find((x) => x.headers[0] === 'Gate');
  if (!t) throw new Error('Gate table not found');
  const rulesStart = text.indexOf('Gate rules');
  const rules = text
    .slice(rulesStart)
    .split('\n')
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).trim());
  const customerFacing = new Set(['G0', 'G2', 'G8', 'G9', 'G10']); // "Customer-facing gates (G0, G2, FAT, SAT, G10)"
  const records = t.rows.map((r, idx) => {
    const code = r.Gate.split(' ')[0];
    const name = r.Gate.slice(code.length).trim();
    // Mandatory evidence = the gate's listed outputs/documents (split on commas, keeping "and" phrases whole)
    const evidence = r['Outputs and documents']
      .split(/,\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      id: `gate-${code.toLowerCase()}`,
      entity: 'gate_definition',
      code,
      order: idx,
      name: `${code} ${name}`,
      inputs: r.Inputs,
      outputs: r['Outputs and documents'],
      approval_criteria: r['Approval criteria'],
      responsible: r['Responsible (DRI → approvers)'],
      exit_criteria: r['Exit criteria'],
      mandatory_evidence: evidence,
      customer_facing: customerFacing.has(code),
      description: `Gate rules: ${rules.join(' ')}`,
      data_type: 'TEAL_INTERNAL',
      provenance: {
        source_id: 'src-automation-handbook',
        document: 'Automation Equipment Building Handbook',
        section: 'Design review gates G0–G10',
        verification_status: 'SOURCE_DOCUMENTED',
        note: `Knowledge ref ${ref('automation', file, 'Design review gates G0–G10')}. mandatory_evidence is the "Outputs and documents" cell split at commas (INFERRED split of handbook text). Detailed checklists: Part 57.`,
      },
      tags: ['gate'],
    };
  });
  writeJson(join(DATA_DIR, 'gates', 'gate-definitions.json'), {
    dataset: {
      id: 'gate-definitions',
      title: 'Design review gates G0–G10',
      description: 'Inputs, outputs and documents, approval criteria, responsible functions and exit criteria for each gate, verbatim from the Automation Equipment Building Handbook.',
      entity: 'gate_definition',
      version: '1.0.0',
      last_updated: TODAY,
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-automation-handbook'],
      partition: 'knowledge',
    },
    records,
  });
  return records.length;
}

/* ============================================================ formulas */
const IMPLEMENTED: Record<string, string> = {
  K1: 'automation.plannedTime', K2: 'automation.takt', K3: 'automation.idealCycleTime', K4: 'automation.uph', K5: 'automation.oee',
  K6: 'automation.availabilityFromMtbf', K7: 'automation.minimumStations', K8: 'automation.balanceEfficiency', K9: 'automation.machinesRequired',
  K10: 'automation.utilization', K11: 'automation.bufferSize', K13: 'quality.rolledThroughputYield', K14: 'quality.requiredStarts',
  N22: 'automation.parallelStationCycle', Q1: 'quality.capability', Q2: 'quality.cpkLowerBound', Q6: 'quality.doeRuns', Q7: 'quality.windowMargin', Q10: 'quality.rpn',
  L1: 'laser.spotDiameter', L2: 'laser.rayleighRange', L3: 'laser.scanField', L4: 'laser.pulseEnergy', L5: 'laser.peakPower', L6: 'laser.fluence',
  L7: 'laser.intensity', L8: 'laser.pulseOverlap', L9: 'laser.lineEnergy', L11: 'laser.chillerCapacity',
  C1: 'cost.priceFromMargin', C4: 'cost.landedCost', C6: 'cost.payback', C8: 'cost.platformBreakEven', C9: 'cost.localizationPayback',
  P1: 'automation.cylinderExtendForce', P6: 'automation.airFlowForSpeed', P12: 'automation.vacuumCupDiameter', P13: 'automation.evacuationTime',
  E1: 'automation.threePhaseCurrent', M1: 'automation.force', N5: 'automation.motorSpeedScrew',
};

function formulas() {
  const { file, text } = readPart('automation', '76-');
  const tables = parseTables(text).filter((t) => t.headers[0] === '#');
  const records = tables.flatMap((t) =>
    t.rows.map((raw) => {
      const r = { ...raw };
      const code = r['#'];
      // Source defect (T1, T3): the formula contains |x|, which split the row in the source
      // document itself. Re-join the formula; the worked value and part number are lost in the source.
      const repaired = code === 'T1' || code === 'T3';
      if (repaired) {
        const cells = t.headers.map((h) => raw[h]);
        r.Formula = `${cells[2]} |${cells[3]}|${cells[4] ? ' ' + cells[4] : ''}`;
        r.Symbols = cells[5];
        r['Worked value'] = '';
        r.Part = '';
      }
      const discipline = t.heading.replace(/^54\.\d+\s*/, '');
      return {
        id: `fml-${code.toLowerCase()}`,
        entity: 'formula',
        code,
        name: `${code} — ${r.Quantity}`,
        discipline,
        quantity: r.Quantity,
        formula: r.Formula,
        symbols: r.Symbols || r['Symbols (SI)'] || undefined,
        worked_value: r['Worked value'] || undefined,
        handbook_part: r.Part ? `Part ${r.Part}` : undefined,
        ...(IMPLEMENTED[code] ? { implemented_by: `src/calculations/${IMPLEMENTED[code].split('.')[0]}.ts#${IMPLEMENTED[code].split('.')[1]}` } : {}),
        data_type: 'TEAL_INTERNAL',
        provenance: {
          source_id: 'src-automation-handbook',
          document: 'Automation Equipment Building Handbook',
          section: `Part 54 — ${t.heading}`,
          verification_status: 'SOURCE_DOCUMENTED',
          note: `Knowledge ref ${ref('automation', file, t.heading)}${repaired ? '. Row repaired: the source table splits this formula at |x|; worked value and part number are missing in the source.' : ''}`,
        },
        tags: ['formula', discipline.toLowerCase()],
      };
    }),
  );
  writeJson(join(DATA_DIR, 'knowledge', 'formulas.json'), {
    dataset: {
      id: 'formulas',
      title: 'Engineering formula catalogue (Automation Handbook Part 54)',
      description: 'The handbook formula catalogue: quantity, formula, symbols, worked value and the part that develops it. `implemented_by` marks formulas available in the OS calculator engine.',
      entity: 'formula',
      version: '1.0.0',
      last_updated: TODAY,
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-automation-handbook'],
      partition: 'knowledge',
    },
    records,
  });
  return records.length;
}

/* ================================== semiconductor value chain + companies */
interface SemiStep {
  key: string;
  name: string;
  stage: 'Materials' | 'Wafer' | 'Front-end fab' | 'Test' | 'Back-end / ATMP';
  headings: string[]; // semiconductor handbook headings that cover it
  laserRows: string[]; // Part XXXII "Process" cells relevant to this step
}
// Step list = spec §54. Headings/rows are matched literally against the handbook.
const STEPS: SemiStep[] = [
  { key: 'raw-material', name: 'Raw material', stage: 'Materials', headings: ['Chapter 3 — Silicon raw materials'], laserRows: [] },
  { key: 'silicon', name: 'Silicon (purification)', stage: 'Materials', headings: ['Chapter 4 — Silicon purification'], laserRows: [] },
  { key: 'wafer', name: 'Wafer', stage: 'Wafer', headings: ['Chapter 5 — Crystal growth', 'Chapter 6 — Ingot to wafer'], laserRows: ['SiC boule slicing', 'Wafer marking (front/back)'] },
  { key: 'fab', name: 'Fab', stage: 'Front-end fab', headings: ['Chapter 7 — Inside a semiconductor fab', 'Chapter 8 — The complete wafer fabrication flow'], laserRows: ['Laser annealing — dopant activation'] },
  { key: 'lithography', name: 'Lithography', stage: 'Front-end fab', headings: ['Chapter 9 — Lithography'], laserRows: ['EUV light source', 'DUV lithography source'] },
  { key: 'deposition', name: 'Deposition', stage: 'Front-end fab', headings: ['Chapter 10 — Thin-film deposition'], laserRows: [] },
  { key: 'etch', name: 'Etch', stage: 'Front-end fab', headings: ['Chapter 11 — Etching'], laserRows: [] },
  { key: 'implant', name: 'Implant', stage: 'Front-end fab', headings: ['Chapter 12 — Ion implantation and diffusion'], laserRows: ['Laser annealing — dopant activation'] },
  { key: 'cmp', name: 'CMP', stage: 'Front-end fab', headings: ['Chapter 13 — Chemical Mechanical Planarization (CMP)'], laserRows: [] },
  { key: 'metrology', name: 'Metrology', stage: 'Front-end fab', headings: ['Chapter 20 — Metrology and inspection'], laserRows: [] },
  { key: 'inspection', name: 'Inspection', stage: 'Front-end fab', headings: ['Chapter 20 — Metrology and inspection'], laserRows: [] },
  { key: 'wafer-test', name: 'Wafer test', stage: 'Test', headings: ['Chapter 21 — Wafer testing (sort / probe)'], laserRows: [] },
  { key: 'dicing', name: 'Dicing', stage: 'Back-end / ATMP', headings: ['Chapter 25 — Semiconductor dicing'], laserRows: ['Laser grooving (low-k)', 'Laser full-cut dicing', 'Stealth dicing'] },
  { key: 'die-attach', name: 'Die attach', stage: 'Back-end / ATMP', headings: ['Chapter 24 — The complete ATMP flow'], laserRows: [] },
  { key: 'wire-bond', name: 'Wire bond', stage: 'Back-end / ATMP', headings: ['Chapter 22 — Traditional packaging', 'Chapter 24 — The complete ATMP flow'], laserRows: [] },
  { key: 'flip-chip', name: 'Flip chip', stage: 'Back-end / ATMP', headings: ['Chapter 23 — Advanced packaging'], laserRows: ['Laser-assisted bonding (LAB)', 'Temporary-bond laser debond'] },
  { key: 'molding', name: 'Molding', stage: 'Back-end / ATMP', headings: ['Chapter 24 — The complete ATMP flow'], laserRows: ['Laser cleaning'] },
  { key: 'marking', name: 'Marking', stage: 'Back-end / ATMP', headings: ['Chapter 24 — The complete ATMP flow'], laserRows: ['Package marking'] },
  { key: 'final-test', name: 'Final test', stage: 'Back-end / ATMP', headings: ['Chapter 24 — The complete ATMP flow'], laserRows: [] },
  { key: 'burn-in', name: 'Burn-in', stage: 'Back-end / ATMP', headings: ['33.2 Reliability testing'], laserRows: [] },
  { key: 'packing', name: 'Packing', stage: 'Back-end / ATMP', headings: ['Chapter 24 — The complete ATMP flow'], laserRows: [] },
];

function semiconductor() {
  const files = readdirSync(join(HB, 'semiconductor')).filter((f) => f.endsWith('.md'));
  const headingIndex = new Map<string, string>();
  for (const f of files) {
    for (const l of readFileSync(join(HB, 'semiconductor', f), 'utf-8').split('\n')) {
      const m = /^#{1,6} (.*)$/.exec(l);
      if (m) headingIndex.set(m[1].trim(), f);
    }
  }
  const { file: laserFile, text: laserText } = readPart('semiconductor', '16-');
  const lt = parseTables(laserText).find((t) => t.headers[0] === 'Process' && t.headers.includes('Laser type'));
  if (!lt) throw new Error('Part XXXII table not found');
  const byProcess = new Map(lt.rows.map((r) => [r.Process, r]));
  const lasRef = ref('semiconductor', laserFile, 'Part XXXII — Lasers in semiconductor and electronics manufacturing');

  const evidence: Record<string, unknown>[] = [];
  const steps = STEPS.map((s, i) => {
    const refs = s.headings
      .filter((h) => headingIndex.has(h))
      .map((h) => ref('semiconductor', headingIndex.get(h)!, h));
    const missing = s.headings.filter((h) => !headingIndex.has(h));
    if (missing.length) throw new Error(`Headings not found for ${s.key}: ${missing.join(', ')}`);
    const rows = s.laserRows.map((p) => {
      const r = byProcess.get(p);
      if (!r) throw new Error(`Part XXXII row not found: ${p}`);
      return r;
    });
    const relevance = rows.length
      ? rows.map((r) => `${r.Process}: ${r['Laser type']}, ${r.Wavelength}, ${r['Power / pulse regime (indicative)']} — ${r.Application}`).join(' · ')
      : undefined;
    rows.forEach((r, k) =>
      evidence.push({
        id: `evd-semi.${s.key}.${k}`,
        entity: 'evidence',
        name: `Laser use in ${s.name}: ${r.Process}`,
        claim: `${r.Process} uses ${r['Laser type']} at ${r.Wavelength} (${r['Power / pulse regime (indicative)']}) on ${r.Material} for ${r.Application}.`,
        entity_id: `sem-${s.key}`,
        source_id: 'src-semiconductor-handbook',
        document: 'The Complete Semiconductor Industry Handbook',
        section: 'Part XXXII — Lasers in semiconductor and electronics manufacturing',
        excerpt: Object.values(r).join(' | '),
        verification_status: 'SOURCE_DOCUMENTED',
        confidence: 'MEDIUM',
        data_type: 'TEAL_INTERNAL',
        provenance: { source_id: 'src-semiconductor-handbook', verification_status: 'SOURCE_DOCUMENTED', note: 'Handbook states parameters are indicative.' },
      }),
    );
    return {
      id: `sem-${s.key}`,
      entity: 'semi_step',
      name: s.name,
      order: i + 1,
      stage: s.stage,
      ...(relevance ? { laser_relevance: relevance } : {}),
      knowledge_refs: rows.length ? [...refs, lasRef] : refs,
      data_type: 'TEAL_INTERNAL',
      provenance: {
        source_id: 'src-semiconductor-handbook',
        verification_status: 'SOURCE_DOCUMENTED',
        note: relevance ? 'Laser relevance quoted from Part XXXII (indicative parameters).' : 'No laser process listed for this step in Part XXXII.',
      },
      tags: ['semiconductor', s.stage.toLowerCase()],
    };
  });
  writeJson(join(DATA_DIR, 'semiconductor', 'value-chain.json'), {
    dataset: {
      id: 'semiconductor-value-chain',
      title: 'Semiconductor value chain (process steps)',
      description: 'Raw material → packing, with the handbook sections that cover each step and, where the handbook lists one, the laser process used there.',
      entity: 'semi_step',
      version: '1.0.0',
      last_updated: TODAY,
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-semiconductor-handbook', 'src-os-spec'],
      partition: 'knowledge',
    },
    records: steps,
  });

  /* Companies named as representative suppliers: Laser Handbook §21.3 + Semi Part XXXII */
  const companies = new Map<string, { name: string; tech: Set<string>; claims: { claim: string; section: string; doc: string; src: string; excerpt: string }[] }>();
  const ALIAS: Record<string, string> = { IPG: 'IPG Photonics', 'Han’s': 'Han’s Laser', 'TRUMPF for ASML': 'TRUMPF' };
  const addCo = (name: string, tech: string, claim: string, section: string, doc: string, src: string, excerpt: string) => {
    let n = name.replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    n = ALIAS[n] ?? n;
    if (!n || /^(several|many|various|domestic|others|same|—)/i.test(n) || /suppliers|makers|integrators/i.test(n)) return;
    const key = slug(n);
    if (!companies.has(key)) companies.set(key, { name: n, tech: new Set(), claims: [] });
    const c = companies.get(key)!;
    c.tech.add(tech);
    c.claims.push({ claim, section, doc, src, excerpt });
  };
  const { text: supText } = readPart('laser', '22-');
  const st = parseTables(supText).find((t) => t.headers[0] === 'Class' && t.headers.some((h) => h.startsWith('Representative suppliers')));
  if (!st) throw new Error('Laser §21.3 table not found');
  for (const r of st.rows) {
    // Medical row lists device categories with companies in parentheses — not a supplier list.
    if (r.Class === 'Medical laser systems') continue;
    for (const col of st.headers.filter((h) => h.startsWith('Representative suppliers'))) {
      for (const name of splitTopLevel(r[col])) {
        addCo(name, r.Class, `Named as a representative ${r.Class} laser source supplier (${col.replace('Representative suppliers ', '')}).`, '21.3 Laser source suppliers by technology class', 'The Complete Laser Handbook', 'src-laser-handbook', `${r.Class} | ${r[col]}`);
      }
    }
  }
  for (const r of lt.rows) {
    for (const name of splitTopLevel(r['Key equipment suppliers (examples)'])) {
      addCo(name, r.Process, `Named as an example equipment supplier for ${r.Process}.`, 'Part XXXII — Lasers in semiconductor and electronics manufacturing', 'The Complete Semiconductor Industry Handbook', 'src-semiconductor-handbook', `${r.Process} | ${r['Key equipment suppliers (examples)']}`);
    }
  }
  const coRecords = [...companies.entries()].map(([key, c]) => ({
    id: `co-${key}`,
    entity: 'company',
    name: c.name,
    roles: ['manufacturer'],
    technologies: [...c.tech],
    data_type: 'PUBLIC',
    provenance: {
      source_id: c.claims[0].src,
      section: c.claims[0].section,
      verification_status: 'SOURCE_DOCUMENTED',
      confidence: 'MEDIUM',
      note: 'Named in a TEAL handbook as a representative/example supplier. Country, products and India presence are UNKNOWN until curated through the ingestion pipeline.',
    },
    tags: ['handbook-named'],
  }));
  let n = 0;
  for (const [key, c] of companies) {
    for (const cl of c.claims) {
      evidence.push({
        id: `evd-co.${key}.${n++}`,
        entity: 'evidence',
        name: `${c.name}: ${cl.claim}`,
        claim: `${c.name} — ${cl.claim}`,
        entity_id: `co-${key}`,
        source_id: cl.src,
        document: cl.doc,
        section: cl.section,
        excerpt: cl.excerpt,
        verification_status: 'SOURCE_DOCUMENTED',
        confidence: 'MEDIUM',
        data_type: 'TEAL_INTERNAL',
        provenance: { source_id: cl.src, verification_status: 'SOURCE_DOCUMENTED' },
      });
    }
  }
  writeJson(join(DATA_DIR, 'companies', 'handbook-companies.json'), {
    dataset: {
      id: 'handbook-companies',
      title: 'Companies named in the handbooks',
      description: 'Laser-source and laser-equipment suppliers named as representative examples in the Laser Handbook §21.3 and Semiconductor Handbook Part XXXII. Each claim has an evidence record.',
      entity: 'company',
      version: '1.0.0',
      last_updated: TODAY,
      data_type: 'PUBLIC',
      source_ids: ['src-laser-handbook', 'src-semiconductor-handbook'],
      partition: 'companies',
    },
    records: coRecords,
  });
  writeJson(join(DATA_DIR, 'evidence', 'handbook-evidence.json'), {
    dataset: {
      id: 'handbook-evidence',
      title: 'Evidence extracted from handbooks',
      description: 'Claims extracted verbatim from handbook tables, each pointing at the handbook section.',
      entity: 'evidence',
      version: '1.0.0',
      last_updated: TODAY,
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-laser-handbook', 'src-semiconductor-handbook'],
      partition: 'knowledge',
    },
    records: evidence,
  });
  return { steps: steps.length, companies: coRecords.length, evidence: evidence.length };
}

/* ============================================================ technology */
function technology() {
  // Radar topics are the spec §58 list. Status is NOT assigned: the spec forbids assigning a
  // status without evidence, and the handbooks describe trends rather than grade them.
  const topics: [string, string][] = [
    ['Laser', 'Laser'], ['Photonics', 'Photonics'], ['Automation', 'Automation'], ['Robotics', 'Robotics'], ['Vision', 'Vision'],
    ['Semiconductor', 'Semiconductor'], ['AI', 'Digital'], ['Digital twin', 'Digital'], ['Ultrafast', 'Laser'], ['UV', 'Laser'],
    ['Green', 'Laser'], ['Beam shaping', 'Laser'], ['In-process sensing', 'Laser'], ['Closed-loop control', 'Automation'],
    ['MES', 'Digital'], ['Industry 4.0', 'Digital'],
  ];
  const files = ['laser', 'automation', 'semiconductor'].flatMap((b) =>
    readdirSync(join(HB, b))
      .filter((f) => f.endsWith('.md'))
      .map((f) => ({ b, f, lines: readFileSync(join(HB, b, f), 'utf-8').split('\n') })),
  );
  const records = topics.map(([name, domain]) => {
    const needle = name.toLowerCase();
    const refs: string[] = [];
    for (const { b, f, lines } of files) {
      for (const l of lines) {
        const m = /^#{2,3} (.*)$/.exec(l);
        if (m && m[1].toLowerCase().includes(needle)) refs.push(ref(b, f, m[1].trim()));
      }
    }
    return {
      id: `tec-${slug(name)}`,
      entity: 'technology',
      name,
      domain,
      radar_status: null,
      knowledge_refs: refs.slice(0, 12),
      data_type: 'TEAL_INTERNAL',
      provenance: {
        source_id: 'src-os-spec',
        verification_status: 'UNKNOWN',
        note: 'Radar status not assessed — requires evidence (spec §58). knowledge_refs are handbook sections whose headings mention this topic.',
      },
    };
  });
  writeJson(join(DATA_DIR, 'technology', 'technologies.json'), {
    dataset: {
      id: 'technologies',
      title: 'Technology radar topics',
      description: 'Radar topics from the OS specification. Radar status is deliberately unassessed until evidence is attached.',
      entity: 'technology',
      version: '1.0.0',
      last_updated: TODAY,
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-os-spec'],
      partition: 'research',
    },
    records,
  });
  return records.length;
}

/* ======================================= acceptance / release checklists */
function checklists() {
  const section = (prefix: string, heading: string) => {
    const { file, text } = readPart('automation', prefix);
    const start = text.indexOf(`### ${heading}`);
    if (start < 0) throw new Error(`Section not found: ${heading}`);
    const rest = text.slice(start + 4 + heading.length);
    const end = rest.search(/\n### /);
    const body = end >= 0 ? rest.slice(0, end) : rest;
    const items: { section: string; item: string }[] = [];
    let cur = 'General';
    for (const l of body.split('\n')) {
      const t = l.trim();
      if (!t) continue;
      if (t.startsWith('- ')) items.push({ section: cur, item: t.slice(2).trim() });
      else if (!t.startsWith('|') && t.length < 40) cur = t;
    }
    if (!items.length) throw new Error(`No items in ${heading}`);
    return { ref: ref('automation', file, heading), heading, items };
  };
  const fat = section('47-', '38.8 Sample FAT checklist');
  const g8 = section('79-', '57.12 FAT readiness (G8)');
  const g9 = section('79-', '57.13 SAT readiness (G9)');
  const g10 = section('79-', '57.14 Production release (G10)');
  writeJson(join(DATA_DIR, 'config', 'acceptance-checklists.json'), {
    dataset: {
      id: 'acceptance-checklists',
      kind: 'config',
      title: 'FAT / SAT / production-release checklists',
      description: 'Checklist items verbatim from the Automation Equipment Building Handbook (§38.8 sample FAT checklist, §57.12 FAT readiness G8, §57.13 SAT readiness G9, §57.14 production release G10).',
      entity: 'config',
      version: '1.0.0',
      last_updated: TODAY,
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-automation-handbook'],
    },
    config: { fat, fat_readiness: g8, sat_readiness: g9, production_release: g10 },
  });
  return fat.items.length + g8.items.length + g9.items.length + g10.items.length;
}

const g = gates();
const ck = checklists();
const f = formulas();
const s = semiconductor();
const t = technology();
console.log(`checklist items=${ck} gates=${g} formulas=${f} semi=${JSON.stringify(s)} technologies=${t}`);
