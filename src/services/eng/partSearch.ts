import { convert, dimensionOf, fmtNum } from '../../calculations/units';
import type { AnyRecord } from '../../domain';
import type { Part } from '../../domain/engineering';
import { productTypeLabel } from '../../domain/engineering';
import { readSpec, specText, type SpecDefs } from './specs';

/*
 * NATURAL-LANGUAGE TECHNICAL SEARCH (master prompt §56, §57, §119, §155).
 * "1064 nm 50 W MOPA", "galvo above 30 mm aperture", "f-theta for 100 mm field",
 * "12 MP global shutter camera", "linear stage above 500 mm/s".
 * The query becomes explicit structured filters (shown to the user); candidates are listed with what
 * matched, what failed and what could not be checked — never ranked into a single "best".
 */

export type Op = 'gte' | 'lte' | 'between' | 'approx' | 'eq';
export interface Constraint {
  spec: string;
  op: Op;
  value: number;
  value2?: number;
  unit: string;
  /** canonical-unit bounds used for matching */
  lo: number;
  hi: number;
  text: string;
}
export interface TextConstraint {
  spec: string;
  value: string;
  text: string;
}
export interface ParsedPartQuery {
  types: string[];
  technologies: string[];
  constraints: Constraint[];
  texts: TextConstraint[];
  material?: string;
  process?: string;
  uph?: number;
  words: string[];
}

const TYPE_WORDS: [RegExp, string[]][] = [
  [/\bf[\s-]?theta\b/i, ['f_theta']],
  [/\btelecentric\b/i, ['telecentric_lens']],
  [/\bbeam expanders?\b|\bexpanders?\b/i, ['beam_expander']],
  [/\b(galvos?|galvanometers?|scan ?heads?|scanners?)\b(?!\s*(controller|card))/i, ['galvo']],
  [/\b(scan|galvo) (controller|card)s?\b/i, ['galvo_controller']],
  [/\bwelding heads?|cutting heads?|laser heads?|processing heads?\b/i, ['laser_head']],
  [/\bchillers?\b/i, ['chiller']],
  [/\bfume|extract(or|ion)\b/i, ['fume_extraction']],
  [/\bcameras?\b/i, ['camera']],
  [/\b(vision )?lens(es)?\b/i, ['vision_lens', 'telecentric_lens']],
  [/\b(ring|bar|dome|coaxial|back) ?lights?\b|\blighting\b/i, ['lighting']],
  [/\bvision controllers?\b/i, ['vision_controller']],
  [/\blinear stages?\b|\bstages?\b|\blinear axis\b/i, ['linear_stage', 'ball_screw_stage']],
  [/\bservo motors?\b/i, ['servo_motor']],
  [/\bservo drives?\b|\bdrives?\b/i, ['servo_drive']],
  [/\bplcs?\b/i, ['plc']],
  [/\bhmis?\b/i, ['hmi']],
  [/\b(industrial pc|ipc)\b/i, ['ipc']],
  [/\brobots?\b|\bscara\b/i, ['robot']],
  [/\bgrippers?\b/i, ['gripper']],
  [/\blight curtains?\b/i, ['light_curtain']],
  [/\bsafety plc\b/i, ['safety_plc']],
  [/\blasers?\b|\blaser sources?\b/i, ['laser_source', 'laser_module']],
];
const TECH_WORDS: [RegExp, string][] = [
  [/\bmopa\b/i, 'MOPA'],
  [/\bfib(er|re)\b/i, 'Fiber'],
  [/\buv\b|\bultraviolet\b/i, 'UV'],
  [/\bgreen\b/i, 'Green'],
  [/\bco2\b|\bco₂\b/i, 'CO2'],
  [/\bcw\b|\bcontinuous[- ]wave\b/i, 'CW'],
  [/\bq[- ]?switch(ed)?\b/i, 'Q-switched'],
  [/\bpico(second)?\b|\bps laser\b/i, 'Picosecond'],
  [/\bfemto(second)?\b|\bfs laser\b/i, 'Femtosecond'],
  [/\bnanosecond\b|\bns laser\b/i, 'Nanosecond'],
  [/\bdpss\b/i, 'DPSS'],
];
const MATERIALS: [RegExp, string][] = [
  [/\balumin(i)?um\b/i, 'Aluminium'],
  [/\bstainless\b/i, 'Stainless steel'],
  [/\bsteel\b/i, 'Steel'],
  [/\bcopper\b/i, 'Copper'],
  [/\bplastics?\b|\bpolymer\b/i, 'Plastic'],
  [/\bpcb\b|\bsolder ?mask\b/i, 'PCB / solder mask'],
  [/\bsilicon\b|\bwafer\b/i, 'Silicon'],
  [/\bglass\b/i, 'Glass'],
];
const PROCESS: [RegExp, string][] = [
  [/\bmark(ing)?\b/i, 'Marking'],
  [/\bengrav(e|ing)\b|\betch(ing)?\b/i, 'Engraving'],
  [/\bweld(ing)?\b/i, 'Welding'],
  [/\bcut(ting)?\b/i, 'Cutting'],
  [/\bclean(ing)?\b/i, 'Cleaning'],
  [/\bdrill(ing)?\b/i, 'Drilling'],
  [/\bscrib(e|ing)\b/i, 'Scribing'],
];

/** Which spec a bare unit means for a given product type. */
const DIM_SPEC: Record<string, Record<string, string>> = {
  power: { laser_source: 'average_power', laser_module: 'average_power', galvo: 'max_power', f_theta: 'max_power', laser_head: 'max_power', chiller: 'cooling_capacity', servo_motor: 'rated_power', servo_drive: 'rated_power', smps: 'output_power' },
  length: { laser_source: 'wavelength', laser_module: 'wavelength', galvo: 'aperture', f_theta: 'focal_length', beam_expander: 'output_beam_diameter', vision_lens: 'focal_length', linear_stage: 'travel', ball_screw_stage: 'travel', robot: 'reach', camera: 'pixel_size' },
  speed: { galvo: 'marking_speed', linear_stage: 'max_speed', ball_screw_stage: 'max_speed', robot: 'max_speed', conveyor: 'max_speed' },
  frequency: { laser_source: 'repetition_rate', camera: 'frame_rate' },
  time: { laser_source: 'pulse_width', galvo: 'settling_time' },
  energy: { laser_source: 'pulse_energy' },
  count: { camera: 'megapixel' },
  mass: { linear_stage: 'payload', robot: 'payload' },
  flow: { fume_extraction: 'airflow', chiller: 'flow_rate' },
};

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const UNIT = String.raw`(nm|µm|um|mm/s|m/s|mm|m³/h|m|kW|mW|W|kHz|MHz|Hz|fps|ns|ps|fs|µs|ms|mJ|µJ|uJ|J|MP|kg|g|L/min)(?![a-zA-Z/³²])`;
const OPS: [RegExp, Op][] = [
  [/(above|over|greater than|more than|at least|min(imum)?|≥|>=|>)\s*$/i, 'gte'],
  [/(below|under|less than|at most|max(imum)?|up to|≤|<=|<)\s*$/i, 'lte'],
];

function aliasSpec(after: string, types: string[], defs: SpecDefs, dim?: string): string | undefined {
  const w = after.toLowerCase();
  let best: { key: string; len: number } | undefined;
  for (const d of defs.values()) {
    if (types.length && !d.applies_to.some((t) => t === '*' || types.includes(t))) continue;
    // a number can only constrain a numeric parameter of the same dimension
    if (d.spec_type !== 'number' && d.spec_type !== 'range') continue;
    if (dim && d.unit_type !== dim && !(d.unit_type === 'none' && dim === 'dimensionless')) continue;
    for (const a of d.aliases ?? []) {
      if (w.startsWith(a.toLowerCase()) && (!best || a.length > best.len)) best = { key: d.key, len: a.length };
    }
  }
  return best?.key;
}

export function parsePartQuery(q: string, defs: SpecDefs): ParsedPartQuery {
  const types = [...new Set(TYPE_WORDS.filter(([re]) => re.test(q)).flatMap(([, t]) => t))];
  // "lens" also matches inside "f-theta lens" / "telecentric lens": keep the specific type only
  const typesClean = types.includes('f_theta') ? types.filter((t) => t !== 'vision_lens' && t !== 'telecentric_lens') : types.includes('telecentric_lens') && /telecentric/i.test(q) ? types.filter((t) => t !== 'vision_lens') : types;
  const technologies = TECH_WORDS.filter(([re]) => re.test(q)).map(([, t]) => t);
  const constraints: Constraint[] = [];
  const texts: TextConstraint[] = [];
  const re = new RegExp(`${NUM}\\s*(?:[–-]|to)\\s*${NUM}\\s*${UNIT}|${NUM}\\s*${UNIT}`, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(q))) {
    const isRange = m[1] != null;
    const unit = (isRange ? m[3] : m[5]).replace(/^u(?=[mJ])/, 'µ');
    const v1 = parseFloat((isRange ? m[1] : m[4]).replace(',', '.'));
    const v2 = isRange ? parseFloat(m[2].replace(',', '.')) : undefined;
    const before = q.slice(0, m.index);
    const after = q.slice(m.index + m[0].length).trim();
    const dim = dimensionOf(unit);
    if (!dim) continue;
    // spec: an alias right after the number ("30 mm aperture", "100 mm field"), else by unit + type
    let spec = aliasSpec(after, typesClean, defs, dim) ?? aliasSpec(before.split(/\s+/).slice(-2).join(' '), typesClean, defs, dim);
    if (!spec) {
      const byType = DIM_SPEC[dim] ?? {};
      const t = typesClean.find((x) => byType[x]) ?? (typesClean.length ? undefined : Object.keys(byType)[0]);
      spec = t ? byType[t] : undefined;
      if (!spec && dim === 'length' && unit === 'nm') spec = 'wavelength';
      if (!spec && dim === 'power') spec = 'average_power';
    }
    if (!spec) continue;
    const def = defs.get(spec);
    const canon = def?.canonical_unit ?? unit;
    const c = (x: number) => {
      try {
        return convert(x, unit, canon);
      } catch {
        return x;
      }
    };
    const opM = OPS.find(([r]) => r.test(before));
    let op: Op = isRange ? 'between' : opM ? opM[1] : spec === 'wavelength' ? 'eq' : 'approx';
    if (/\bfor\s*$/i.test(before) && (spec.startsWith('scan_field') || spec === 'travel')) op = 'gte';
    const a = c(v1);
    const b = v2 != null ? c(v2) : a;
    const [lo, hi] = op === 'between' ? [Math.min(a, b), Math.max(a, b)] : op === 'gte' ? [a, Infinity] : op === 'lte' ? [-Infinity, a] : op === 'eq' ? [a * 0.99, a * 1.01] : [a * 0.9, a * 1.1];
    const label = def?.name ?? spec;
    const txt = op === 'between' ? `${label} ${v1}–${v2} ${unit}` : op === 'gte' ? `${label} ≥ ${v1} ${unit}` : op === 'lte' ? `${label} ≤ ${v1} ${unit}` : op === 'eq' ? `${label} = ${v1} ${unit} (±1 %)` : `${label} ≈ ${v1} ${unit} (±10 %)`;
    constraints.push({ spec, op, value: v1, value2: v2, unit, lo, hi, text: txt });
  }
  if (/\bglobal[- ]shutter\b/i.test(q)) texts.push({ spec: 'shutter', value: 'Global', text: 'Shutter = Global' });
  if (/\brolling[- ]shutter\b/i.test(q)) texts.push({ spec: 'shutter', value: 'Rolling', text: 'Shutter = Rolling' });
  const mount = /\b(c|cs|f|m42)[- ]mount\b/i.exec(q);
  if (mount) texts.push({ spec: 'lens_mount', value: mount[1].toUpperCase(), text: `Lens mount = ${mount[1].toUpperCase()}` });
  const uph = /(\d+)\s*uph\b/i.exec(q);
  const material = MATERIALS.find(([r]) => r.test(q))?.[1];
  const process = PROCESS.find(([r]) => r.test(q))?.[1];
  const words = q
    .toLowerCase()
    .replace(re, ' ')
    .split(/[^a-z0-9µ.-]+/)
    .filter((w) => w.length > 2);
  return { types: typesClean, technologies, constraints, texts, material, process, uph: uph ? Number(uph[1]) : undefined, words };
}

export interface CheckOutcome {
  label: string;
  state: 'match' | 'fail' | 'unknown';
  detail: string;
}
export interface Candidate {
  part: Part & AnyRecord;
  checks: CheckOutcome[];
  matched: number;
  failed: number;
  unknown: number;
  applicationEvidence: string[];
}
export interface PartSearchResult {
  parsed: ParsedPartQuery;
  /** every structured filter satisfied (unknowns listed) */
  candidates: Candidate[];
  /** exactly one filter failed — shown as near matches with the reason */
  near: Candidate[];
  /** the query named no type, technology or parameter this engine understands */
  understood: boolean;
}

function evaluate(part: Part & AnyRecord, p: ParsedPartQuery, defs: SpecDefs): Candidate {
  const checks: CheckOutcome[] = [];
  for (const c of p.constraints) {
    const s = readSpec(part, c.spec, defs);
    if (!s || (s.value == null && s.min == null)) {
      checks.push({ label: c.text, state: 'unknown', detail: `${defs.get(c.spec)?.name ?? c.spec}: Not Available` });
      continue;
    }
    const lo = s.min ?? s.value!;
    const hi = s.max ?? s.value!;
    // a range spec (e.g. wavelength range) matches when it overlaps the requested window
    const ok = s.min != null && s.max != null ? lo <= c.hi && hi >= c.lo : s.value! >= c.lo && s.value! <= c.hi;
    checks.push({ label: c.text, state: ok ? 'match' : 'fail', detail: `${fmtNum(lo)}${lo !== hi ? `–${fmtNum(hi)}` : ''} ${s.unit}` });
  }
  for (const t of p.texts) {
    const v = specText(part, t.spec);
    checks.push(v == null ? { label: t.text, state: 'unknown', detail: 'Not Available' } : { label: t.text, state: v.toLowerCase() === t.value.toLowerCase() ? 'match' : 'fail', detail: v });
  }
  for (const tech of p.technologies) {
    const has = (part.technologies ?? []).some((x) => x.toLowerCase() === tech.toLowerCase());
    checks.push({ label: `Technology ${tech}`, state: has ? 'match' : (part.technologies ?? []).length ? 'fail' : 'unknown', detail: (part.technologies ?? []).join(', ') || 'Not Available' });
  }
  const applicationEvidence: string[] = [];
  if (p.process) {
    const has = (part.processes ?? []).some((x) => x.toLowerCase() === p.process!.toLowerCase());
    if (has) applicationEvidence.push(`Lists ${p.process} as a process (${part.data_type === 'DEMO' ? 'DEMO datasheet' : 'record'})`);
    else applicationEvidence.push(`No recorded evidence for ${p.process}`);
  }
  if (p.material) applicationEvidence.push(`No material-specific evidence recorded for ${p.material} — needs a POC or application note`);
  return { part, checks, matched: checks.filter((c) => c.state === 'match').length, failed: checks.filter((c) => c.state === 'fail').length, unknown: checks.filter((c) => c.state === 'unknown').length, applicationEvidence };
}

export function searchParts(q: string, parts: (Part & AnyRecord)[], defs: SpecDefs): PartSearchResult {
  const parsed = parsePartQuery(q, defs);
  const understood = parsed.types.length > 0 || parsed.constraints.length > 0 || parsed.technologies.length > 0 || parsed.texts.length > 0;
  let pool = parsed.types.length ? parts.filter((p) => parsed.types.includes(p.product_type)) : parts;
  // constraints without a type: keep parts that have the constrained spec at all
  if (!parsed.types.length && parsed.constraints.length) pool = pool.filter((p) => parsed.constraints.some((c) => readSpec(p, c.spec, defs)));
  if (!understood) {
    const w = parsed.words;
    pool = parts.filter((p) => w.some((x) => `${p.name} ${p.model_number} ${p.brand ?? ''} ${p.family ?? ''} ${productTypeLabel(p.product_type)}`.toLowerCase().includes(x)));
  }
  const evaluated = pool.filter((p) => p.record_status !== 'Archived').map((p) => evaluate(p, parsed, defs));
  const order = (a: Candidate, b: Candidate) => b.matched - a.matched || a.unknown - b.unknown || a.part.model_number.localeCompare(b.part.model_number);
  return {
    parsed,
    candidates: evaluated.filter((c) => c.failed === 0).sort(order),
    near: evaluated.filter((c) => c.failed === 1 && c.matched > 0).sort(order),
    understood,
  };
}

/** Human description of the structured filters (shown above results). */
export function describeQuery(p: ParsedPartQuery): string[] {
  return [
    ...(p.types.length ? [`Type: ${p.types.map(productTypeLabel).join(' or ')}`] : []),
    ...p.technologies.map((t) => `Technology: ${t}`),
    ...p.constraints.map((c) => c.text),
    ...p.texts.map((t) => t.text),
    ...(p.process ? [`Process: ${p.process} (evidence shown, not filtered)`] : []),
    ...(p.material ? [`Material: ${p.material} (evidence shown, not filtered)`] : []),
    ...(p.uph ? [`Throughput: ${p.uph} UPH (equipment scenarios)`] : []),
  ];
}
