/**
 * One-shot (re-runnable) migration of the three legacy TEAL applications' *reference* data
 * into /data datasets with provenance.
 *
 *   LEGACY_ROOT=/path/to/clones npx tsx scripts/migration/migrateLegacy.ts
 *
 * LEGACY_ROOT must contain clones of:
 *   teal-laser-product-sim-2/   (data.json)
 *   teal-cost-demo-7-8/         (data/config.json, data/masters.json, data/projects.json)
 *   product-tracker-/           (js/schema.js)
 *
 * What is migrated and how it is labelled:
 *   - Simulator catalogue data → TEAL_INTERNAL, SOURCE_DOCUMENTED (source: legacy simulator,
 *     which states it is derived from the TEAL Laser Automation Solutions Product Catalogue 2026).
 *     Prices are parametric ESTIMATES, never quotations.
 *   - Material properties → SOURCE_DOCUMENTED with confidence LOW: the primary reference
 *     was not recorded in the legacy app.
 *   - Cost platform masters → DEMO with verification UNKNOWN (seed data; several records are
 *     visibly fabricated). The admin PIN, customer master and seeded projects are NOT migrated.
 *   - Tracker vocabularies → TEAL_INTERNAL controlled lists.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { DATA_DIR, writeJson } from '../lib/dataset';

const LEGACY_ROOT = process.env.LEGACY_ROOT ?? join(process.cwd(), '..', 'songarajatin225-a11y');
const TODAY = '2026-09-26';

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const SIM = JSON.parse(readFileSync(join(LEGACY_ROOT, 'teal-laser-product-sim-2', 'data.json'), 'utf-8')) as Json;
const COST_ROOT = join(LEGACY_ROOT, 'teal-cost-demo-7-8', 'data');
const COST_CONFIG = JSON.parse(readFileSync(join(COST_ROOT, 'config.json'), 'utf-8')) as Json;
const COST_MASTERS = JSON.parse(readFileSync(join(COST_ROOT, 'masters.json'), 'utf-8')) as Json;
const COST_PROJECTS = JSON.parse(readFileSync(join(COST_ROOT, 'projects.json'), 'utf-8')) as Json;

const header = (h: Json) => ({ version: '1.0.0', last_updated: TODAY, ...h });

const simProv = (extra: Json = {}) => ({
  source_id: 'src-legacy-laser-sim',
  document: 'TEAL-Laser-Product-Sim-2/data.json',
  retrieved_at: TODAY,
  verification_status: 'SOURCE_DOCUMENTED',
  confidence: 'MEDIUM',
  ...extra,
});
const costProv = (section: string, extra: Json = {}) => ({
  source_id: 'src-legacy-cost-platform',
  document: 'TEAL-COST-DEMO-7-8/data/masters.json',
  section,
  retrieved_at: TODAY,
  verification_status: 'UNKNOWN',
  confidence: 'LOW',
  note: 'Legacy cost-platform seed data. Treat as DEMO until confirmed by TEAL Finance / Procurement.',
  ...extra,
});

/* ================================================================ sources */
function sources() {
  const records = [
    {
      id: 'src-laser-handbook',
      entity: 'source',
      name: 'The Complete Laser Handbook',
      description: 'From Photon to Industrial Laser Systems, Processes, Machines & End-Product Applications. 28 parts.',
      kind: 'handbook',
      author: 'Jatin Songara — Laser and Photonics Vertical, Titan Engineering and Automation Ltd.',
      published: '2026-09-22',
      data_type: 'TEAL_INTERNAL',
      provenance: { verification_status: 'SOURCE_DOCUMENTED', document: 'The_Complete_Laser_Handbook.docx' },
      tags: ['handbook', 'laser'],
    },
    {
      id: 'src-automation-handbook',
      entity: 'source',
      name: 'Automation Equipment Building Handbook',
      description:
        'From customer requirement to machine architecture, engineering, manufacturing, FAT, SAT and production. Edition 1.0; 60 parts, 12 books, 10 case studies, 11 design-review gates, 177 formulas.',
      kind: 'handbook',
      author: 'Jatin Songara — Project Manager, Laser & Photonics Vertical, TEAL',
      published: '2026-09-26',
      data_type: 'TEAL_INTERNAL',
      provenance: { verification_status: 'SOURCE_DOCUMENTED', document: 'Automation_Equipment_Building_Handbook.docx' },
      tags: ['handbook', 'automation'],
    },
    {
      id: 'src-semiconductor-handbook',
      entity: 'source',
      name: 'The Complete Semiconductor Industry Handbook',
      description: 'From Silicon to Chips to Systems to Everything.',
      kind: 'handbook',
      author: 'Jatin Songara — Laser & Photonics Vertical, Titan Engineering & Automation Ltd.',
      published: '2026-09-21',
      data_type: 'TEAL_INTERNAL',
      provenance: { verification_status: 'SOURCE_DOCUMENTED', document: 'The_Complete_Semiconductor_Industry_Handbook_1.docx' },
      tags: ['handbook', 'semiconductor'],
    },
    {
      id: 'src-legacy-laser-sim',
      entity: 'source',
      name: 'Legacy TEAL Laser Equipment Configurator (data.json)',
      description: `Value store of the legacy configurator (_updated ${SIM._updated}). Its README states the configuration data is derived from "TEAL Laser Automation Solutions — Product Catalogue, 2026 Edition (Ch. 02–13)" and that prices are indicative ex-works estimates from a parametric model, not quotations.`,
      kind: 'legacy_app',
      url: 'https://github.com/songarajatin225-a11y/TEAL-Laser-Product-Sim-2',
      retrieved_at: TODAY,
      data_type: 'TEAL_INTERNAL',
      provenance: { verification_status: 'SOURCE_DOCUMENTED', source_url: 'https://github.com/songarajatin225-a11y/TEAL-Laser-Product-Sim-2' },
      tags: ['legacy'],
    },
    {
      id: 'src-teal-catalogue-2026',
      entity: 'source',
      name: 'TEAL Laser Automation Solutions — Product Catalogue, 2026 Edition',
      description: 'Referenced by the legacy configurator as the origin of its platform data. The catalogue itself is not in this repository.',
      kind: 'internal',
      data_type: 'TEAL_INTERNAL',
      provenance: { verification_status: 'UNKNOWN', note: 'Document not available to the OS; cited second-hand via the legacy configurator.' },
      tags: ['catalogue'],
    },
    {
      id: 'src-legacy-cost-platform',
      entity: 'source',
      name: 'Legacy TEAL Costing & Estimation Platform (data/*.json)',
      description:
        'Seed masters of the legacy cost platform. Mixes real company names with fabricated demonstration records (e.g. items attributed to vendors that do not make them). Treated as DEMO.',
      kind: 'legacy_app',
      url: 'https://github.com/songarajatin225-a11y/TEAL-COST-DEMO-7-8',
      retrieved_at: TODAY,
      data_type: 'DEMO',
      provenance: { verification_status: 'UNKNOWN', source_url: 'https://github.com/songarajatin225-a11y/TEAL-COST-DEMO-7-8' },
      tags: ['legacy'],
    },
    {
      id: 'src-legacy-pm-tracker',
      entity: 'source',
      name: 'Legacy Laser Applications PM Operating Tracker (js/schema.js)',
      description: 'Controlled vocabularies and entity definitions of the legacy product-management tracker.',
      kind: 'legacy_app',
      url: 'https://github.com/songarajatin225-a11y/Product-Tracker-',
      retrieved_at: TODAY,
      data_type: 'TEAL_INTERNAL',
      provenance: { verification_status: 'SOURCE_DOCUMENTED', source_url: 'https://github.com/songarajatin225-a11y/Product-Tracker-' },
      tags: ['legacy'],
    },
    {
      id: 'src-os-spec',
      entity: 'source',
      name: 'TEAL Engineering Intelligence OS — Final Master Build Specification (GitHub-only V1)',
      description: 'The build specification for this platform. Source of module lists, workflows and enumerations (e.g. application industries, laser categories, radar statuses).',
      kind: 'internal',
      data_type: 'TEAL_INTERNAL',
      provenance: { verification_status: 'SOURCE_DOCUMENTED' },
      tags: ['specification'],
    },
  ];
  writeJson(join(DATA_DIR, 'sources', 'sources.json'), {
    dataset: header({
      id: 'sources',
      title: 'Sources',
      description: 'Registry of every source the OS cites. Evidence and provenance reference these ids.',
      entity: 'source',
      data_type: 'TEAL_INTERNAL',
      source_ids: [],
    }),
    records,
  });
}

/* ========================================================= laser / optics */
const CATEGORY: Record<string, string[]> = {
  fiber: ['Fiber', 'Q-switched', 'Nanosecond'],
  mopa: ['Fiber', 'MOPA', 'Nanosecond'],
  qcw: ['Fiber', 'QCW'],
  smcw: ['Fiber', 'CW'],
  uv: ['UV', 'DPSS', 'Nanosecond'],
  green: ['Green', 'DPSS', 'Nanosecond'],
  blue: ['Blue', 'Diode', 'CW'],
  co2: ['CO2', 'CW'],
  co293: ['CO2', 'CW'],
  pico: ['Picosecond', 'Ultrafast'],
  femto: ['Femtosecond', 'Ultrafast'],
  diode: ['Diode', 'CW'],
};
const SHORT: Record<string, string> = {
  fiber: 'FB', mopa: 'MP', qcw: 'QC', smcw: 'CW', uv: 'UV', green: 'GR', blue: 'BL', co2: 'C10', co293: 'C93', pico: 'PS', femto: 'FS', diode: 'DD',
};

function laser() {
  const records = Object.entries(SIM.SRC as Json).map(([k, s]) => ({
    id: `las-${k}`,
    entity: 'laser_source',
    name: k === 'co293' ? 'Sealed RF CO₂ (9.3 µm)' : k === 'co2' ? 'Sealed RF CO₂ (10.6 µm)' : s.n,
    description: 'Source technology option offered by the TEAL configurator (not a specific manufacturer model).',
    kind: 'class',
    manufacturer: null,
    model: null,
    categories: CATEGORY[k],
    wavelength: { value: Math.round(s.um * 1000 * 100) / 100, unit: 'nm', original: s.wl },
    mode: s.mode,
    pulse_duration: s.tau != null ? { value: s.tau, unit: s.tauU, original: `${s.tau} ${s.tauU} (representative)` } : null,
    pulse_duration_range: s.tauRange ?? null,
    repetition_rate_khz: s.frep ?? null,
    m2: s.m2,
    beam_diameter_mm: s.dia,
    wall_plug_efficiency: s.wpe,
    price_premium: s.prem,
    display_color: s.col,
    short_code: SHORT[k],
    data_type: 'TEAL_INTERNAL',
    provenance: simProv({
      section: `SRC.${k}`,
      note: 'Representative parameters used by the configurator for diffraction-limited estimates. Not a datasheet.',
    }),
    tags: ['source-class', ...CATEGORY[k].map((c) => c.toLowerCase())],
  }));
  writeJson(join(DATA_DIR, 'laser', 'laser-source-classes.json'), {
    dataset: header({
      id: 'laser-source-classes',
      title: 'Laser source classes (TEAL configurator)',
      description: 'The 12 source technology options the TEAL configurator offers, with representative optical parameters. No manufacturer models — see Global Intelligence for curated external products.',
      entity: 'laser_source',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim', 'src-teal-catalogue-2026'],
      partition: 'laser',
    }),
    records,
  });

  const optics = Object.entries(SIM.LENS as Json).map(([k, l]) => ({
    id: `opt-${k}`,
    entity: 'optic',
    name: `${l.n} f-theta objective`,
    optic_type: 'f_theta',
    manufacturer: null,
    model: null,
    focal_length_mm: l.f,
    scan_field_mm: l.fld,
    short_code: l.n,
    data_type: 'TEAL_INTERNAL',
    provenance: simProv({ section: `LENS.${k}` }),
    tags: ['f-theta'],
  }));
  writeJson(join(DATA_DIR, 'optics', 'f-theta-objectives.json'), {
    dataset: header({
      id: 'f-theta-objectives',
      title: 'F-theta objectives (TEAL configurator)',
      description: 'Objective options offered by the configurator: focal length and addressable field. Coating, damage threshold and manufacturer are UNKNOWN until documented.',
      entity: 'optic',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim'],
      partition: 'laser',
    }),
    records: optics,
  });
}

/* ============================================================== materials */
const MAT_CATEGORY: Record<string, string> = {
  steel: 'Metal', ss: 'Metal', al: 'Metal', cu: 'Metal', ti: 'Metal', ni: 'Metal',
  si: 'Semiconductor', sic: 'Semiconductor', al2o3: 'Ceramic', aln: 'Ceramic', glass: 'Glass',
  fr4: 'PCB / laminate', pi: 'Polymer film', poly: 'Polymer', emc: 'Semiconductor package',
};

function materials() {
  const q = (value: number, unit: string) => ({ value, unit, status: 'SOURCE_DOCUMENTED' });
  const records: Json[] = Object.entries(SIM.MAT as Json).map(([k, m]) => ({
    id: `mat-${k}`,
    entity: 'material',
    name: m.n,
    category: MAT_CATEGORY[k] ?? 'Other',
    thermal_conductivity: q(m.k, 'W/(m·K)'),
    melting_point: q(m.tm, '°C'),
    density: q(m.rho, 'kg/m³'),
    specific_heat: q(m.cp, 'J/(kg·K)'),
    absorption: m.a,
    data_type: 'TEAL_INTERNAL',
    provenance: simProv({
      section: `MAT.${k}`,
      confidence: 'LOW',
      note:
        'Carried over from the legacy configurator, which describes them as handbook data for a clean flat surface. The primary reference was not recorded — verify against a primary source before using for design. Absorption values are indicative only.',
    }),
    tags: m.org ? ['organic'] : [],
  }));
  // Materials named in the specification (§33) for which the OS has no property data yet.
  const unknown: [string, string, string][] = [
    ['gan', 'Gallium nitride (GaN)', 'Semiconductor'],
    ['soldermask', 'Solder mask', 'PCB / laminate'],
    ['battery-electrode', 'Battery electrode materials', 'Battery'],
    ['composite', 'Composites (fibre-reinforced polymers)', 'Composite'],
  ];
  for (const [k, n, cat] of unknown) {
    records.push({
      id: `mat-${k}`,
      entity: 'material',
      name: n,
      category: cat,
      thermal_conductivity: null,
      melting_point: null,
      density: null,
      specific_heat: null,
      absorption: null,
      data_type: 'TEAL_INTERNAL',
      provenance: {
        source_id: 'src-os-spec',
        verification_status: 'UNKNOWN',
        note: 'Listed in the OS specification (§33). No property data held — UNKNOWN. Do not infer.',
      },
      tags: ['properties-unknown'],
    });
  }
  writeJson(join(DATA_DIR, 'materials', 'materials.json'), {
    dataset: header({
      id: 'materials',
      title: 'Materials',
      description: 'Engineering materials with thermal properties and indicative absorptance by wavelength band. null = UNKNOWN.',
      entity: 'material',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim', 'src-os-spec'],
      partition: 'applications',
    }),
    records,
  });
}

/* =================================================== industries, standards */
const IND_MAP: Record<string, string> = {
  ems: 'EMS', semi: 'Semiconductor', battery: 'Battery', auto: 'Automotive', medical: 'Medical',
  aero: 'Aerospace', genengg: 'General Engineering', consumer: 'Consumer',
};

function industriesAndStandards() {
  const inds = Object.entries(SIM.IND as Json).map(([k, v]) => ({
    id: `ind-${k}`,
    entity: 'industry',
    name: v.n,
    code: IND_MAP[k] ?? k,
    description: v.d,
    data_type: 'TEAL_INTERNAL',
    provenance: simProv({ section: `IND.${k}` }),
  }));
  writeJson(join(DATA_DIR, 'applications', 'industries.json'), {
    dataset: header({
      id: 'industries',
      title: 'Industries served',
      description: 'Industries the TEAL laser portfolio serves (configurator taxonomy).',
      entity: 'industry',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim'],
      partition: 'applications',
    }),
    records: inds,
  });

  const stds = Object.entries(SIM.STD as Json).map(([k, v]) => ({
    id: `std-${k.replace(/_/g, '-')}`,
    entity: 'standard',
    name: v.n,
    code: v.n,
    description: v.d,
    scope: v.s,
    data_type: 'PUBLIC',
    provenance: simProv({
      section: `STD.${k}`,
      note: 'Title and scope as summarised in the legacy configurator. Consult the current edition of the standard itself.',
    }),
    tags: ['standard'],
  }));
  writeJson(join(DATA_DIR, 'knowledge', 'standards.json'), {
    dataset: header({
      id: 'standards',
      title: 'Standards referenced by TEAL equipment',
      description: 'Standards the configurator references (laser safety, machinery safety, code grading, SEMI, ESD, cleanroom, 21 CFR 11).',
      entity: 'standard',
      data_type: 'PUBLIC',
      source_ids: ['src-legacy-laser-sim'],
      partition: 'knowledge',
    }),
    records: stds,
  });
}

/* ========================================================== products etc */
const FAM_PROCESS: Record<string, string> = {
  mark: 'Marking', weld: 'Welding', clean: 'Cleaning', cut: 'Cutting', volt: 'Marking', auto: 'Handling',
};
const PLAT_PROCESS: Record<string, string> = {
  semiwm: 'Marking', semispm: 'Marking', semils: 'Cutting', semidc: 'Micromachining', voltt: 'Marking',
};

function products() {
  const fams = Object.entries(SIM.FAM as Json).map(([k, f]) => ({
    id: `fam-${k}`,
    entity: 'product_family',
    key: k,
    name: f.n,
    chapter: f.ch,
    segment: f.s,
    description: f.d,
    data_type: 'TEAL_INTERNAL',
    provenance: simProv({ section: `FAM.${k}`, note: `Catalogue chapter ${f.ch}.` }),
  }));
  writeJson(join(DATA_DIR, 'products', 'product-families.json'), {
    dataset: header({
      id: 'product-families',
      title: 'TEAL laser product families',
      description: 'The seven TEAL laser product families (catalogue chapters 02–08).',
      entity: 'product_family',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim', 'src-teal-catalogue-2026'],
      partition: 'products',
    }),
    records: fams,
  });

  const plats = Object.entries(SIM.PLAT as Json).map(([k, p]) => ({
    id: `prd-${k}`,
    entity: 'product',
    key: k,
    name: p.n,
    family_id: `fam-${p.fam}`,
    code: p.code,
    title: p.t,
    tagline: p.tag,
    description: p.tag,
    delivery: p.deliv,
    source_keys: p.src,
    default_source_key: p.dsrc,
    powers_w: p.pw,
    ...(p.pwBySrc ? { powers_by_source: p.pwBySrc } : {}),
    default_power_w: p.dpw,
    lens_keys: p.lens,
    default_lens_key: p.dlens,
    standard_content: p.std,
    specs: (p.specs as [string, string][]).map(([label, value]) => ({ label, value })),
    industries: (p.ind as string[]).map((i) => `ind-${i}`),
    lead_time_weeks: p.lead ?? null,
    warranty_months: p.warranty ?? null,
    install_weeks: p.install ?? null,
    base_price_inr: p.base ?? null,
    maturity: 'Product',
    applications: Object.entries(p.apps as Json).map(([ak, a]) => ({
      key: ak,
      name: a.n,
      description: a.d,
      source_key: a.src,
      power_w: a.pw,
      material_key: a.mat,
      rationale: a.w,
    })),
    data_type: 'TEAL_INTERNAL',
    provenance: simProv({
      section: `PLAT.${k}`,
      note: 'Specifications as published in the configurator. base_price_inr is a parametric ex-works ESTIMATE, not a quotation. Maturity "Product" = listed in the 2026 catalogue.',
    }),
    tags: [p.fam, p.deliv],
  }));
  writeJson(join(DATA_DIR, 'products', 'platforms.json'), {
    dataset: header({
      id: 'platforms',
      title: 'TEAL laser platforms (products)',
      description: '22 TEAL platforms with sources, powers, objectives, standard content, specifications and applications.',
      entity: 'product',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim', 'src-teal-catalogue-2026'],
      partition: 'products',
    }),
    records: plats,
  });

  // Application library: one record per platform application.
  const apps: Json[] = [];
  for (const [k, p] of Object.entries(SIM.PLAT as Json)) {
    for (const [ak, a] of Object.entries(p.apps as Json)) {
      apps.push({
        id: `app-${k}.${ak}`,
        entity: 'application',
        name: a.n,
        description: a.d,
        process: PLAT_PROCESS[k] ?? FAM_PROCESS[p.fam] ?? 'Marking',
        industries: (p.ind as string[]).map((i) => IND_MAP[i] ?? i),
        product_id: `prd-${k}`,
        family_id: `fam-${p.fam}`,
        material_ids: a.mat ? [`mat-${a.mat}`] : [],
        recommended_source_id: a.src ? `las-${a.src}` : undefined,
        recommended_power_w: a.pw ?? null,
        rationale: a.w,
        data_type: 'TEAL_INTERNAL',
        provenance: simProv({ section: `PLAT.${k}.apps.${ak}` }),
        tags: [p.fam],
      });
    }
  }
  // two platforms can reuse a legacy label for different processes — keep list names unambiguous
  const seen = new Set<string>();
  for (const a of apps) {
    const n = String(a.name).toLowerCase();
    if (seen.has(n)) {
      a.provenance = { ...(a.provenance as Json), note: `Name disambiguated from the legacy label “${a.name}”, which another platform's application also uses.` };
      a.name = `${a.name} (${String(a.process).toLowerCase()})`;
    }
    seen.add(String(a.name).toLowerCase());
  }
  writeJson(join(DATA_DIR, 'applications', 'applications.json'), {
    dataset: header({
      id: 'applications',
      title: 'Application library',
      description: 'Applications TEAL platforms are configured for, each with process, material, recommended source/power and the engineering rationale.',
      entity: 'application',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim'],
      partition: 'applications',
    }),
    records: apps,
  });
}

/* ======================================================= lexicon additions */
// OS additions to the legacy lexicon, kept separate and recorded in the dataset (`_os_additions`)
// so they are distinguishable from the legacy terms. Reason: semiconductor package inquiries
// ("marking of semiconductor packages") did not reach the package-marking platform.
const LEX_ADDITIONS: Json = {
  process: { semi: ['package', 'strip', 'leadframe'] },
  material: { emc: ['package', 'ic package', 'semiconductor package'] },
  need: { magazine: ['strip', 'magazine'] },
};
function mergeLexicon(base: Json, add: Json): Json {
  const out: Json = JSON.parse(JSON.stringify(base));
  for (const [group, entries] of Object.entries(add)) {
    for (const [key, terms] of Object.entries(entries as Json)) {
      out[group][key] = [...new Set([...(out[group][key] ?? []), ...(terms as string[])])];
    }
  }
  out._os_additions = add;
  return out;
}

/* ================================================================= modules */
const MODCONFLICT: [string, string, string][] = [
  ['cleanrm', 'dryroom', 'A cleanroom canopy and a dry-room shell are different environmental strategies.'],
  ['glovebx', 'fume', 'An inert-backfilled chamber and open extraction defeat one another.'],
  ['rotoidx', 'turntbl', 'Two indexing tables cannot occupy the same work position.'],
  ['rotoidx', 'shuttle', 'A dial and a shuttle are alternative ways to present the same part.'],
  ['turntbl', 'shuttle', 'A turntable and a shuttle table are alternative load strategies.'],
  ['conveyor', 'r2r', 'Discrete transport and continuous web are different material formats.'],
  ['robot6', 'cobotld', 'One manipulator per load station.'],
];

function modules() {
  const fit = SIM.MODFIT as Json;
  const rec = (key: string, m: Json, kind: string, group: string) => ({
    id: `mod-${key}`,
    entity: 'module',
    key,
    kind,
    name: m.n,
    description: m.d,
    group,
    price_estimate_inr: m.p ?? null,
    ...(fit[key] && Object.keys(fit[key]).length ? { fitment: fit[key] } : {}),
    data_type: 'TEAL_INTERNAL',
    provenance: simProv({
      section: `${kind === 'automation' ? 'MOD' : kind === 'software' ? 'SW' : 'EXTRA'}.${key}`,
      note: 'Module list price is a configurator ESTIMATE (INR), not a quotation. Module DNA fields (interfaces, utilities, accuracy, suppliers) are UNKNOWN until documented.',
    }),
    tags: [group.toLowerCase()],
  });
  const records = [
    ...Object.entries(SIM.MOD as Json).map(([k, m]) => rec(k, m, 'automation', m.g)),
    ...Object.entries(SIM.SW as Json).map(([k, m]) => rec(k, m, 'software', 'LaserSuite software')),
    ...Object.entries(SIM.EXTRA as Json).map(([k, m]) =>
      rec(k, m, k === 'iqoqpq' ? 'compliance' : 'connectivity', k === 'iqoqpq' ? 'Compliance' : 'Connectivity'),
    ),
  ];
  writeJson(join(DATA_DIR, 'modules', 'automation-modules.json'), {
    dataset: header({
      id: 'automation-modules',
      title: 'Module library',
      description: 'Automation modules (catalogue Ch. 13), LaserSuite software editions and connectivity/compliance packages, with fitment rules.',
      entity: 'module',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim'],
      partition: 'modules',
    }),
    records,
  });
  writeJson(join(DATA_DIR, 'modules', 'module-conflicts.json'), {
    dataset: header({
      id: 'module-conflicts',
      title: 'Module conflicts',
      description: 'Module pairs that cannot sensibly coexist on one machine (from the legacy configurator code, MODCONFLICT).',
      entity: 'module_conflict',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim'],
      partition: 'modules',
    }),
    records: MODCONFLICT.map(([a, b, reason]) => ({
      id: `mcf-${a}.${b}`,
      entity: 'module_conflict',
      name: `${a} × ${b}`,
      a: `mod-${a}`,
      b: `mod-${b}`,
      reason,
      data_type: 'TEAL_INTERNAL',
      provenance: simProv({ document: 'TEAL-Laser-Product-Sim-2/index.html', section: 'MODCONFLICT' }),
    })),
  });

  writeJson(join(DATA_DIR, 'knowledge', 'recommendation-rules.json'), {
    dataset: header({
      id: 'recommendation-rules',
      title: 'Configurator recommendation rules',
      description: '27 engineering recommendation rules. A rule fires when all its conditions match; it can only recommend equipment the platform can physically accept.',
      entity: 'rule',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim'],
      partition: 'knowledge',
    }),
    records: (SIM.RECO as Json[]).map((r) => ({
      id: `rul-${String(r.id).replace(/^r-/, '')}`,
      entity: 'rule',
      rule_type: 'recommendation',
      name: r.n,
      why: r.why,
      iff: r.iff,
      then: r.then,
      data_type: 'TEAL_INTERNAL',
      provenance: simProv({ section: `RECO.${r.id}` }),
    })),
  });

  const { adminPin: _omit, ...pricing } = SIM.RULES as Json; // admin PIN is not a security control — not migrated
  void _omit;
  writeJson(join(DATA_DIR, 'config', 'configurator-pricing-rules.json'), {
    dataset: header({
      id: 'configurator-pricing-rules',
      kind: 'config',
      title: 'Configurator pricing rules',
      description: 'Parametric price-band rules: band_lo/band_hi multipliers, power scaling up/down, large-objective uplift. Output is an ESTIMATE.',
      entity: 'config',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim'],
    }),
    config: pricing,
  });

  writeJson(join(DATA_DIR, 'config', 'inquiry-lexicon.json'), {
    dataset: header({
      id: 'inquiry-lexicon',
      kind: 'config',
      title: 'Inquiry lexicon',
      description: 'Terms that map free-text customer inquiries to process families, materials, needs (modules), scale and care signals. Used by "Create product from customer inquiry".',
      entity: 'config',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-laser-sim'],
    }),
    config: mergeLexicon(SIM.LEX, LEX_ADDITIONS),
  });
}

/* ==================================================================== cost */
function cost() {
  const items = (COST_MASTERS.item as Json[]).map((i) => ({
    id: `itm-${String(i.code).toLowerCase()}`,
    entity: 'component',
    code: i.code,
    name: i.name,
    spec: i.spec,
    category: i.cat,
    item_class: i.cls,
    uom: i.uom,
    price: i.price,
    currency: i.cur,
    price_basis: 'DEMO',
    vendor: i.vendor,
    lead_time_weeks: i.lead,
    moq: i.moq,
    hsn: i.hsn,
    price_date: i.updated,
    status: i.status,
    data_type: 'DEMO',
    provenance: costProv('item'),
    tags: ['legacy-seed'],
  }));
  writeJson(join(DATA_DIR, 'components', 'item-master.json'), {
    dataset: header({
      id: 'item-master',
      title: 'Item master (legacy seed — DEMO)',
      description: 'TEAL stock-code catalogue structure carried over from the legacy cost platform. Prices, vendors and lead times are DEMO seed values — not quotations and not verified.',
      entity: 'component',
      data_type: 'DEMO',
      source_ids: ['src-legacy-cost-platform'],
    }),
    records: items,
  });

  const rows: Json[] = [];
  const table = (tableName: string, list: Json[], nameKey = 'name') => {
    for (const r of list) {
      const { id, ...values } = r;
      rows.push({
        id: `ref-${tableName}.${id}`,
        entity: 'reference',
        table: tableName,
        name: String(r[nameKey] ?? r.code ?? id),
        values,
        data_type: 'DEMO',
        provenance: costProv(tableName),
      });
    }
  };
  table('process_rate', COST_MASTERS.process);
  table('labour_rate', COST_MASTERS.labour);
  table('engineering_rate', COST_MASTERS.engineering);
  table('material_rate', COST_MASTERS.material);
  table('tax', COST_MASTERS.tax);
  table('freight', COST_MASTERS.freight);
  table('plant', COST_MASTERS.plant);
  table('approval_band', COST_MASTERS.approval, 'band');
  for (const c of COST_MASTERS.currency as Json[]) {
    rows.push({
      id: `ref-fx.${String(c.code).toLowerCase()}`,
      entity: 'reference',
      table: 'fx',
      name: `${c.code} → INR`,
      values: { code: c.code, name: c.name, rate_to_inr: c.rate, symbol: c.symbol, as_of: null, source: 'legacy cost platform seed' },
      data_type: 'DEMO',
      provenance: costProv('currency', {
        verification_status: 'ASSUMPTION',
        note: 'FX rate from legacy seed with NO date or source recorded. Replace with a dated rate from Finance before quoting.',
      }),
    });
  }
  writeJson(join(DATA_DIR, 'cost', 'rates.json'), {
    dataset: header({
      id: 'cost-rates',
      title: 'Cost reference data (legacy seed — DEMO)',
      description: 'Machine-hour, labour and engineering rates, material rates, tax, freight, plant overheads, approval bands and FX from the legacy cost platform seed. DEMO / UNKNOWN verification.',
      entity: 'reference',
      data_type: 'DEMO',
      source_ids: ['src-legacy-cost-platform'],
    }),
    records: rows,
  });

  // Vendors → suppliers (names only + category; the seed "rating" is not migrated: it is an
  // unverified judgement about real companies).
  const sups = (COST_MASTERS.vendor as Json[]).map((v) => ({
    id: `sup-${String(v.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    entity: 'supplier',
    name: v.name,
    category: v.category,
    country: /india|hosur/i.test(v.name) ? 'India' : undefined,
    typical_lead_time: v.lead,
    payment_terms: v.terms,
    supplier_risk: 'Unknown',
    data_type: 'DEMO',
    provenance: costProv('vendor', {
      note: 'Company name is real; category, lead time and terms are legacy seed values (DEMO). Seed "rating" intentionally not migrated.',
    }),
  }));
  writeJson(join(DATA_DIR, 'suppliers', 'suppliers.json'), {
    dataset: header({
      id: 'suppliers',
      title: 'Suppliers (legacy vendor master — DEMO)',
      description: 'Vendor list from the legacy cost platform. Relationship data is seed/DEMO until TEAL Procurement confirms it.',
      entity: 'supplier',
      data_type: 'DEMO',
      source_ids: ['src-legacy-cost-platform'],
      partition: 'suppliers',
    }),
    records: sups,
  });

  // Cost templates → DEMO cost models
  const TEAL_DEFAULTS = { insurancePct: 0.05, sgaPct: 8, warrantyPct: 2.5, profitPct: 12, ossMonthly: 65000, stationHc: 0.5, ossMonths: 12, packRate: 1600 };
  const templates = (COST_PROJECTS.templates as Json[]).map((t) => ({
    id: `cst-tpl-${String(t.id).toLowerCase()}`,
    entity: 'cost_model',
    name: `Template — ${t.name}`,
    description: t.note,
    currency: 'INR',
    qty: 1,
    lines: t.lines,
    landed: t.landed ?? COST_CONFIG.defaults.landed,
    markup: t.markup ?? COST_CONFIG.defaults.markup,
    teal: TEAL_DEFAULTS,
    scenario: 'Base',
    assumptions: ['Template lines and rates are legacy DEMO seed values.'],
    data_type: 'DEMO',
    provenance: { ...costProv('templates'), document: 'TEAL-COST-DEMO-7-8/data/projects.json' },
    tags: ['template'],
  }));
  writeJson(join(DATA_DIR, 'cost', 'cost-templates.json'), {
    dataset: header({
      id: 'cost-templates',
      title: 'Cost templates (legacy — DEMO)',
      description: 'Starting cost structures from the legacy cost platform. Use as a structure, not as prices.',
      entity: 'cost_model',
      data_type: 'DEMO',
      source_ids: ['src-legacy-cost-platform'],
    }),
    records: templates,
  });

  writeJson(join(DATA_DIR, 'config', 'cost-defaults.json'), {
    dataset: header({
      id: 'cost-defaults',
      kind: 'config',
      title: 'Cost engine defaults',
      description: 'Default landed-cost %, mark-up % and TEAL cost-sheet parameters from the legacy platform. ASSUMPTIONS — set per job.',
      entity: 'config',
      data_type: 'DEMO',
      source_ids: ['src-legacy-cost-platform'],
    }),
    config: {
      landed: COST_CONFIG.defaults.landed,
      markup: COST_CONFIG.defaults.markup,
      teal: TEAL_DEFAULTS,
      currency: COST_CONFIG.defaults.currency,
      business_units: COST_CONFIG.businessUnits,
      product_categories: COST_CONFIG.productCategories,
      vocab: {
        TYPE_MECH: ['Fabrication', 'Machining', 'Sheet Metal', 'Standard Parts', 'Motion Components', 'Bearings & Guides', 'Fasteners', 'Pneumatics', 'Hydraulics', 'Surface Treatment', 'Assembly Hardware', 'Inspection Tooling'],
        TYPE_ELEC: ['PLC', 'HMI', 'Servo Motor', 'Servo Drive', 'VFD', 'Sensors', 'Vision Camera', 'Lighting', 'Cables & Glands', 'Panel & Enclosure', 'Safety Components', 'Wiring Accessories', 'Test Instruments'],
        ACT_SW: ['PLC Programming', 'HMI Development', 'Robot Programming', 'Vision Programming', 'SCADA / MES Interface', 'Application Software', 'Software Documentation', 'FAT Software Validation'],
        ACT_LAB: ['Mechanical Assembly', 'Electrical Assembly', 'In-process Inspection', 'Functional Testing', 'Packing', 'Installation', 'Commissioning', 'Operator Training', 'As-built Documentation'],
        HEAD_SITE: ['Engineer Deployment', 'Air / Rail Travel', 'Accommodation', 'Food & Per Diem', 'Local Transport', 'Equipment Rental', 'Consumables at Site', 'Site Facilities'],
        HEAD_COMM: ['Outward Freight', 'Transit Insurance', 'Export Packaging', 'Special Tooling', 'Certification (CE/UL)', 'Warranty Provision', 'Third-Party Services', 'Finance / LC Charges', 'Miscellaneous'],
        HEAD_AMC: ['Preventive Maintenance Labour', 'Spare Parts Kit', 'Travel & Lodging', 'Consumables', 'Remote Support', 'Calibration'],
        MAT_CLASS: ['Raw Material', 'Standard Component', 'Bought-Out Assembly', 'Import Item', 'Consumable'],
        COMM_ACTS: ['Assembly Mechanical', 'Assembly Electrical', 'Testing Mechanical', 'Programming & Testing', 'OQC', 'Dispatch', 'LBU - SW', 'LBU - OSS'],
      },
    },
  });
}

/* ================================================================ tracker */
function tracker() {
  const code = readFileSync(join(LEGACY_ROOT, 'product-tracker-', 'js', 'schema.js'), 'utf-8');
  const sandbox: Json = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const V = sandbox.window.LPM?.schema?.V ?? sandbox.window.LPM?.schema?.vocab;
  if (!V) throw new Error('Could not read vocabularies from tracker schema.js');
  const records = Object.entries(V as Json).map(([k, values]) => ({
    id: `voc-${k.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
    entity: 'vocabulary',
    key: k,
    name: k,
    values,
    data_type: 'TEAL_INTERNAL',
    provenance: {
      source_id: 'src-legacy-pm-tracker',
      document: 'Product-Tracker-/js/schema.js',
      section: `V.${k}`,
      retrieved_at: TODAY,
      verification_status: 'SOURCE_DOCUMENTED',
    },
  }));
  writeJson(join(DATA_DIR, 'knowledge', 'vocabularies.json'), {
    dataset: header({
      id: 'vocabularies',
      title: 'Controlled vocabularies (PM tracker)',
      description: 'Dropdown vocabularies from the legacy product-management tracker (workstreams, application categories, laser types, packages, stages …).',
      entity: 'vocabulary',
      data_type: 'TEAL_INTERNAL',
      source_ids: ['src-legacy-pm-tracker'],
      partition: 'knowledge',
    }),
    records,
  });
}

sources();
laser();
materials();
industriesAndStandards();
products();
modules();
cost();
tracker();
console.log('Legacy migration complete →', DATA_DIR);
