import type { AnyRecord } from '../../domain';
import type { Part } from '../../domain/engineering';
import type { Application, LaserSource, Material } from '../../domain/entities';
import { parseInquiry, type Lexicon } from '../inquiry';
import { parseParams } from '../parametric';
import type { SourceRef } from './types';

/*
 * STRUCTURED AGENTS (AI master prompt §20–§22, §64–§65). Deterministic specialists with typed inputs
 * and outputs. They never write prose to each other: the orchestrator passes their structured results
 * on, and logs each exchange as an AgentMessage.
 *   Requirements agent — reads the inquiry; anything not stated is Not Defined
 *   Laser agent        — technology candidates from TEAL application records + material absorption
 *   Component agent    — engineering-database parts per subsystem
 *   Template agent     — equipment templates for the 3D / simulation pipeline
 */

/* ------------------------------------------------------------------ requirements agent */

export type FieldStatus = 'STATED' | 'CALCULATED' | 'NOT DEFINED';
export interface ReqField {
  label: string;
  value: string | number | null;
  unit?: string;
  raw?: string;
  status: FieldStatus;
  basis: string;
}

export interface ExtractedRequirements {
  text: string;
  process: ReqField;
  material: ReqField & { id?: string };
  industry: ReqField;
  thickness: ReqField;
  partSize: ReqField;
  workingArea: ReqField;
  accuracy: ReqField;
  cycleTime: ReqField;
  throughput: ReqField;
  automation: ReqField;
  quality: ReqField;
  budget: ReqField;
  code: ReqField;
  /** labels of fields still Not Defined */
  missing: string[];
}

const nd = (label: string): ReqField => ({ label, value: null, status: 'NOT DEFINED', basis: 'Not stated in the requirement — ask the customer' });
const stated = (label: string, value: string | number, raw: string, unit?: string): ReqField => ({ label, value, unit, raw, status: 'STATED', basis: `stated: “${raw.trim()}”` });

const PROCESS_WORDS: [RegExp, string][] = [
  [/\bmark(ing|ed)?\b|\bengrav|\betch(ing)?\b|\b(dmc|qr|2d code|data ?matrix|serial number)\b/i, 'Marking'],
  [/\bweld(ing|ed)?\b|\bseal(ing)?\b|\bjoin(ing)?\b/i, 'Welding'],
  [/\bcut(ting)?\b|\bsingulat|\bdepanel/i, 'Cutting'],
  [/\bclean(ing)?\b|\bde-?coat|\bpaint removal|\brust removal/i, 'Cleaning'],
  [/\bdrill(ing)?\b/i, 'Drilling'],
  [/\bscrib(e|ing)\b|\bdic(e|ing)\b/i, 'Cutting'],
  [/\binspect(ion)?\b|\baoi\b/i, 'Inspection'],
];

const num = (s: string) => parseFloat(s.replace(/,/g, ''));

export function extractRequirements(text: string, records: AnyRecord[], lexicon: Lexicon | null): ExtractedRequirements {
  const t = text.replace(/[–—]/g, '-');
  const facts = lexicon ? parseInquiry(text, lexicon) : null;
  const params = parseParams(text);

  // process
  let process = nd('Process / application');
  const famToProcess: Record<string, string> = { mark: 'Marking', weld: 'Welding', cut: 'Cutting', clean: 'Cleaning' };
  const fam = facts ? Object.entries(facts.families).sort((a, b) => b[1] - a[1])[0]?.[0] : undefined;
  const pw = PROCESS_WORDS.find(([re]) => re.test(t));
  if (pw) process = stated('Process / application', pw[1], pw[0].exec(t)![0]);
  else if (fam && famToProcess[fam]) process = { label: 'Process / application', value: famToProcess[fam], status: 'STATED', basis: 'inquiry lexicon term match' };

  // material — a material record named in the text (longest name wins), else the lexicon
  const materials = records.filter((r) => r.entity === 'material') as (AnyRecord & Material)[];
  const MAT_ALIASES: Record<string, string> = { aluminum: 'Aluminium', 'stainless steel': 'Stainless 304', stainless: 'Stainless 304', ss304: 'Stainless 304', steel: 'Carbon steel', fr4: 'FR4 / solder mask', pcb: 'FR4 / solder mask', wafer: 'Silicon', ceramic: 'Alumina', plastic: 'Engineering polymer', polymer: 'Engineering polymer' };
  let material: ExtractedRequirements['material'] = nd('Material');
  const lower = t.toLowerCase();
  const direct = materials
    .map((m) => ({ m, n: m.name.toLowerCase().replace(/\s*\(.*\)$/, '') }))
    .filter(({ n }) => n.length >= 4 && new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower))
    .sort((a, b) => b.n.length - a.n.length)[0];
  const alias = Object.entries(MAT_ALIASES).find(([k]) => new RegExp(`\\b${k}\\b`).test(lower));
  if (direct) material = { ...stated('Material', direct.m.name, direct.n), id: direct.m.id };
  else if (alias) {
    const m = materials.find((x) => x.name === alias[1]);
    material = { ...stated('Material', alias[1], alias[0]), id: m?.id };
  }

  const industry = facts?.industry ? { label: 'Industry', value: facts.industry, status: 'STATED' as const, basis: 'industry terms in the text' } : params.industry ? stated('Industry', params.industry.label, params.industry.label) : nd('Industry');

  const thickM = /(\d+(?:\.\d+)?)\s*(mm|µm|um)\s*(?:thick|thickness)|thickness\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(mm|µm|um)/i.exec(t);
  const thickness = thickM ? stated('Material thickness', num(thickM[1] ?? thickM[3]), thickM[0], (thickM[2] ?? thickM[4]).replace('um', 'µm')) : nd('Material thickness');

  const dimM = /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)(?:\s*[x×]\s*(\d+(?:\.\d+)?))?\s*mm(?!\s*(field|area|working|marking area))/i.exec(t);
  const diaM = /(?:ø|⌀|dia(?:meter)?\.?\s*(?:of\s*)?)\s*(\d+(?:\.\d+)?)\s*mm|(\d+(?:\.\d+)?)\s*mm\s*(?:diameter|dia\b)/i.exec(t);
  const partSize = dimM ? stated('Part dimensions', `${dimM[1]} × ${dimM[2]}${dimM[3] ? ` × ${dimM[3]}` : ''}`, dimM[0], 'mm') : diaM ? stated('Part dimensions', `Ø ${diaM[1] ?? diaM[2]}`, diaM[0], 'mm') : nd('Part dimensions');

  const areaM = /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*mm\s*(?:field|area|working area|marking area)|(?:field|working area|marking area)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(?:[x×]\s*(\d+(?:\.\d+)?))?\s*mm/i.exec(t);
  const workingArea = areaM ? stated('Working / marking area', areaM[1] ? `${areaM[1]} × ${areaM[2]}` : `${areaM[3]}${areaM[4] ? ` × ${areaM[4]}` : ''}`, areaM[0], 'mm') : nd('Working / marking area');

  const accM = /(?:±|\+\/-|\+-)\s*(\d+(?:\.\d+)?)\s*(µm|um|mm)|accuracy\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(µm|um|mm)/i.exec(t);
  const accuracy = accM ? stated('Accuracy', num(accM[1] ?? accM[3]), accM[0], (accM[2] ?? accM[4]).replace('um', 'µm')) : nd('Accuracy');

  const ctM = /(\d+(?:\.\d+)?)\s*[- ]?(?:s|sec|secs|second|seconds)\b\s*(?:cycle|cycle[- ]time|per part|takt)?|cycle[- ]time\s*(?:of|:|=|<|≤|below|under)?\s*(\d+(?:\.\d+)?)\s*(?:s|sec|seconds?)\b/i.exec(t);
  const ctIsCycle = ctM && /cycle|per part|takt/i.test(t.slice(Math.max(0, (ctM.index ?? 0) - 25), (ctM.index ?? 0) + ctM[0].length + 25));
  const cycleTime = ctM && ctIsCycle ? stated('Cycle time', num(ctM[1] ?? ctM[2]), ctM[0], 's') : nd('Cycle time');

  let throughput: ReqField = nd('Throughput');
  if (facts?.perHour != null) throughput = { label: 'Throughput', value: facts.perHour, unit: 'UPH', status: 'STATED', basis: 'stated rate (per hour / per minute)' };
  else if (typeof cycleTime.value === 'number' && cycleTime.value > 0) throughput = { label: 'Throughput', value: Math.floor(3600 / cycleTime.value), unit: 'UPH', status: 'CALCULATED', basis: `3600 s ÷ ${cycleTime.value} s cycle time (100 % availability — an upper bound, not a commitment)` };

  const autoM = /\b(fully automatic|full automation|inline|in-line|semi-?automatic|manual (load|loading)|manual|robot(ic)? (load|loading|handling)|automatic (load|loading|handling))\b/i.exec(t);
  const automation = autoM ? stated('Automation level', autoM[0].replace(/^\w/, (c) => c.toUpperCase()), autoM[0]) : nd('Automation level');

  const qualM = t.match(/\b(high[- ]contrast|black mark(ing)?|dark mark(ing)?|deep (mark|engrav)\w*|crack[- ]free|spatter[- ]free|leak[- ]tight|burr[- ]free|low heat|minimal heat|no heat|readable|grade [a-d]\b|iso\/iec \d+|high quality)\b/gi);
  const quality = qualM ? stated('Quality requirement', [...new Set(qualM.map((q) => q.toLowerCase()))].join(', '), qualM.join(', ')) : nd('Quality requirement');

  const budM = /(?:budget|under|below|max(?:imum)?|within)\s*(?:of\s*)?(₹|inr|rs\.?|usd|\$|eur|€)\s*([\d,.]+)\s*(lakh|lac|crore|cr|k|m|million)?/i.exec(t);
  const budget = budM ? stated('Budget', `${budM[1].toUpperCase().replace('$', 'USD').replace('€', 'EUR').replace('₹', 'INR').replace(/^RS\.?$/, 'INR')} ${budM[2]}${budM[3] ? ` ${budM[3]}` : ''}`, budM[0]) : nd('Budget');

  const codeM = /\b(2d code|dmc|data ?matrix|qr( code)?|barcode|serial number|logo|text)\b/i.exec(t);
  const code = codeM ? stated('Mark / feature content', codeM[0], codeM[0]) : nd('Mark / feature content');

  const out: ExtractedRequirements = { text, process, material, industry, thickness, partSize, workingArea, accuracy, cycleTime, throughput, automation, quality, budget, code, missing: [] };
  out.missing = (['process', 'material', 'thickness', 'partSize', 'workingArea', 'accuracy', 'cycleTime', 'throughput', 'automation', 'quality', 'budget'] as const).filter((k) => out[k].status === 'NOT DEFINED').map((k) => out[k].label);
  return out;
}

export const REQUIREMENT_FIELDS = ['process', 'material', 'industry', 'code', 'thickness', 'partSize', 'workingArea', 'accuracy', 'cycleTime', 'throughput', 'automation', 'quality', 'budget'] as const;

/* ------------------------------------------------------------------ laser agent */

const BAND_KEY = (s: LaserSource): 'uv' | 'blue' | 'green' | 'ir' | 'co2' | null => {
  const wl = s.wavelength?.value;
  if (wl == null) return null;
  if (wl < 400) return 'uv';
  if (wl < 500) return 'blue';
  if (wl < 600) return 'green';
  if (wl < 2000) return 'ir';
  return 'co2';
};

export interface LaserCandidate {
  source: AnyRecord & LaserSource;
  /** TEAL application records that recommend this source for the process + material */
  applications: (AnyRecord & Application)[];
  recommendedPowerW: number[];
  absorption: { band: string; value: number } | null;
  basis: string[];
  refs: SourceRef[];
}

const rec = (r: AnyRecord, locator?: string, excerpt?: string): SourceRef => ({ kind: 'record', id: r.id, label: r.name, href: `/record/${encodeURIComponent(r.id)}`, data_type: String(r.data_type ?? ''), verification: String(r.provenance?.verification_status ?? ''), locator, excerpt });

/**
 * Technology candidates for a process on a material. Ordered by an explicit criterion shown to the
 * user — first sources that TEAL application records recommend for this exact process + material,
 * then by the material's recorded absorption at the source wavelength. Never declared "best".
 */
export function laserCandidates(req: Pick<ExtractedRequirements, 'process' | 'material'>, records: AnyRecord[]): LaserCandidate[] {
  const sources = records.filter((r) => r.entity === 'laser_source' && (r as unknown as LaserSource).kind === 'class') as (AnyRecord & LaserSource)[];
  const apps = records.filter((r) => r.entity === 'application') as (AnyRecord & Application)[];
  const mat = req.material.id ? (records.find((r) => r.id === req.material.id) as (AnyRecord & Material) | undefined) : undefined;
  const proc = typeof req.process.value === 'string' ? req.process.value : null;
  // with neither a process nor a known material there is nothing to select on — say so rather than list everything
  if (!proc && !mat) return [];
  const relevant = apps.filter((a) => (!proc || String(a.process) === proc) && (!mat || (a.material_ids ?? []).includes(mat.id)));
  const out: LaserCandidate[] = sources.map((s) => {
    const applications = relevant.filter((a) => a.recommended_source_id === s.id);
    const band = BAND_KEY(s);
    const abs = mat && band ? ((mat as unknown as { absorption?: Record<string, number> }).absorption?.[band] ?? null) : null;
    const basis: string[] = [];
    const refs: SourceRef[] = [];
    for (const a of applications) {
      basis.push(`TEAL application “${a.name}” recommends ${s.name}${a.recommended_power_w ? ` at ${a.recommended_power_w} W` : ''}${a.rationale ? ` — “${a.rationale}”` : ''}`);
      refs.push(rec(a, 'recommended_source_id', a.rationale));
    }
    if (abs != null && mat) {
      basis.push(`${mat.name} absorption at ${band!.toUpperCase()} (${s.wavelength?.value} nm): ${abs}`);
      refs.push(rec(mat, `absorption.${band}`, String(abs)));
    }
    refs.push(rec(s, 'wavelength', `${s.wavelength?.value} nm`));
    return { source: s, applications, recommendedPowerW: [...new Set(applications.map((a) => a.recommended_power_w).filter((x): x is number => x != null))], absorption: abs != null && band ? { band: band.toUpperCase(), value: abs } : null, basis, refs };
  });
  return out
    .filter((c) => c.applications.length || c.absorption)
    .sort((a, b) => b.applications.length - a.applications.length || (b.absorption?.value ?? -1) - (a.absorption?.value ?? -1));
}

/* ------------------------------------------------------------------ component agent */

export interface ComponentPick {
  role: string;
  type: string;
  parts: (AnyRecord & Part)[];
  note: string;
}

const ROLE_TYPES: { role: string; types: string[]; when?: (p: string | null) => boolean }[] = [
  { role: 'Laser source', types: ['laser_source', 'laser_module'], when: (p) => p !== 'Inspection' },
  { role: 'Scan head (galvo)', types: ['galvo'], when: (p) => p === 'Marking' || p === 'Cleaning' || p === 'Drilling' },
  { role: 'F-theta objective', types: ['f_theta'], when: (p) => p === 'Marking' || p === 'Cleaning' || p === 'Drilling' },
  { role: 'Processing head', types: ['laser_head'], when: (p) => p === 'Welding' || p === 'Cutting' },
  { role: 'Vision camera', types: ['camera'] },
  { role: 'Controller (PLC / IPC)', types: ['plc', 'ipc'] },
  { role: 'HMI', types: ['hmi'] },
  { role: 'Safety', types: ['safety_plc', 'light_curtain', 'door_switch'] },
  { role: 'Chiller', types: ['chiller'], when: (p) => p === 'Welding' || p === 'Cutting' },
  { role: 'Fume extraction', types: ['fume_extraction'], when: (p) => p !== 'Inspection' },
  { role: 'Motion / handling', types: ['linear_stage', 'conveyor', 'robot'] },
];

/** Engineering-database parts per subsystem role. Laser parts are filtered to the candidate technology. */
export function componentCandidates(process: string | null, laser: LaserCandidate | null, records: AnyRecord[]): ComponentPick[] {
  const parts = (records.filter((r) => r.entity === 'part') as (AnyRecord & Part)[]).filter((p) => p.record_status !== 'Archived' && p.lifecycle_status !== 'Discontinued');
  const cats = new Set((laser?.source.categories ?? []).map((c) => String(c).toLowerCase()));
  return ROLE_TYPES.filter((r) => !r.when || r.when(process)).map((r) => {
    let list = parts.filter((p) => r.types.includes(p.product_type));
    let note = list.length ? `${list.length} part(s) of this type in the engineering database` : 'No part of this type in the engineering database';
    if (r.role === 'Laser source' && laser && list.length) {
      const match = list.filter((p) => (p.technologies ?? []).some((t) => cats.has(t.toLowerCase())));
      if (match.length) {
        list = match;
        note = `${match.length} part(s) sharing the ${[...cats].join(' / ')} technology of ${laser.source.name}`;
      } else note = `No part with the ${[...cats].join(' / ')} technology — showing all laser parts`;
    }
    return { role: r.role, type: r.types.join(' / '), parts: list.slice(0, 6), note };
  });
}

/* ------------------------------------------------------------------ template agent (AI → 3D) */

export interface TemplateMatch {
  template: AnyRecord;
  score: number;
  why: string[];
}

export function matchTemplates(req: Pick<ExtractedRequirements, 'process' | 'industry' | 'text'>, records: AnyRecord[]): TemplateMatch[] {
  const text = req.text.toLowerCase();
  const proc = typeof req.process.value === 'string' ? req.process.value.toLowerCase() : null;
  const WORDS = ['can', 'battery', 'tab', 'busbar', 'pcb', 'wafer', 'semiconductor', 'package', 'cell', 'module', 'pack', 'electronics', 'inline'];
  return records
    .filter((r) => r.entity === 'equipment_template')
    .map((tpl) => {
      const x = tpl as AnyRecord & { process?: string; application?: string };
      const why: string[] = [];
      let score = 0;
      if (proc && String(x.process ?? '').toLowerCase() === proc) {
        score += 5;
        why.push(`process ${x.process}`);
      }
      const hay = `${tpl.name} ${x.application ?? ''}`.toLowerCase();
      for (const w of WORDS) {
        if (new RegExp(`\\b${w}s?\\b`).test(text) && new RegExp(`\\b${w}`).test(hay)) {
          score += 3;
          why.push(`“${w}” in the requirement and the template`);
        }
      }
      return { template: tpl, score, why };
    })
    .filter((m) => m.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
