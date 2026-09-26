import { z } from 'zod';
import { baseShape, IsoDate, Quantity, VerificationStatus } from './common';

/*
 * Entity schemas. One Zod schema per entity type; these produce:
 *   - TypeScript types (z.infer)
 *   - runtime validation for static data (CI) and local drafts (browser)
 *   - JSON Schemas in /schemas (scripts/data/generateJsonSchemas.ts)
 *
 * Unknown facts are represented as null / omitted and surface as UNKNOWN in the UI.
 * Nothing in here implies a value is known.
 */

const ref = z.string(); // record id reference (validated for existence by data-quality)
const refs = z.array(ref);
const money = z.number();
export const Currency = z.enum(['INR', 'USD', 'EUR', 'JPY', 'GBP', 'CNY']);
export type Currency = z.infer<typeof Currency>;

export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const;
export const Priority = z.enum(PRIORITIES);

/* ================================================================ people */

export const Contact = z.object({
  name: z.string(),
  role: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export const COMPANY_ROLES = ['customer', 'supplier', 'competitor', 'manufacturer', 'partner', 'research'] as const;

export const Company = z.object({
  ...baseShape,
  entity: z.literal('company'),
  legal_name: z.string().optional(),
  brand: z.string().optional(),
  country: z.string().optional(),
  headquarters: z.string().optional(),
  parent: z.string().optional(),
  subsidiaries: z.array(z.string()).optional(),
  roles: z.array(z.enum(COMPANY_ROLES)).default([]),
  industries: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  product_ids: refs.optional(),
  application_ids: refs.optional(),
  india_presence: z.string().optional(),
  website: z.string().optional(),
});
export type Company = z.infer<typeof Company>;

export const Customer = z.object({
  ...baseShape,
  entity: z.literal('customer'),
  company_id: ref.optional(),
  industry: z.string().optional(),
  segment: z.string().optional(),
  sites: z.array(z.string()).optional(),
  contacts: z.array(Contact).optional(),
  application_ids: refs.optional(),
  location: z.string().optional(),
});
export type Customer = z.infer<typeof Customer>;

/* ======================================================== opportunities */

export const OPPORTUNITY_STAGES = [
  'Lead',
  'Discovery',
  'Requirement',
  'Feasibility',
  'POC',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
] as const;

export const Opportunity = z.object({
  ...baseShape,
  entity: z.literal('opportunity'),
  customer_id: ref.optional(),
  stage: z.enum(OPPORTUNITY_STAGES),
  value: money.nullable().optional(),
  currency: Currency.optional(),
  volume: z.string().optional(),
  probability: z.number().min(0).max(100).nullable().optional(),
  technical_status: z.string().optional(),
  commercial_status: z.string().optional(),
  competitor: z.string().optional(),
  application_id: ref.optional(),
  product_id: ref.optional(),
  configuration_id: ref.optional(),
  inquiry_text: z.string().optional(),
  industry: z.string().optional(),
});
export type Opportunity = z.infer<typeof Opportunity>;

export const ACTIVITY_STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Waiting', 'Completed', 'Cancelled'] as const;
export const ACTIVITY_KINDS = ['task', 'meeting', 'follow_up', 'call', 'note', 'sample', 'daily_log'] as const;

export const Activity = z.object({
  ...baseShape,
  entity: z.literal('activity'),
  kind: z.enum(ACTIVITY_KINDS),
  priority: Priority,
  status: z.enum(ACTIVITY_STATUSES),
  due_date: IsoDate.optional(),
  follow_up_date: IsoDate.optional(),
  customer_id: ref.optional(),
  opportunity_id: ref.optional(),
  product_id: ref.optional(),
  project_id: ref.optional(),
  poc_id: ref.optional(),
  supplier_id: ref.optional(),
  workstream: z.string().optional(),
  blocker: z.string().optional(),
  attendees: z.string().optional(),
  minutes: z.string().optional(),
});
export type Activity = z.infer<typeof Activity>;

/* ========================================================= requirements */

export const REQUIREMENT_LEVELS = ['Customer Statement', 'URS', 'SRS', 'FRS'] as const;
export const REQUIREMENT_CATEGORIES = [
  'Functional',
  'Performance',
  'Process',
  'Quality',
  'Safety',
  'Interface',
  'Utility',
  'Regulatory',
  'Commercial',
  'Environment',
] as const;
export const VERIFICATION_METHODS = ['Inspection', 'Analysis', 'Demonstration', 'Test'] as const;

export const Requirement = z.object({
  ...baseShape,
  entity: z.literal('requirement'),
  code: z.string(),
  level: z.enum(REQUIREMENT_LEVELS),
  category: z.enum(REQUIREMENT_CATEGORIES),
  value: z.string().optional(),
  unit: z.string().optional(),
  condition: z.string().optional(),
  source: z.string().optional(),
  priority: z.enum(['Must', 'Should', 'Could']),
  verification_method: z.enum(VERIFICATION_METHODS).optional(),
  acceptance_criterion: z.string().optional(),
  parent_id: ref.optional(),
  opportunity_id: ref.optional(),
  project_id: ref.optional(),
  product_id: ref.optional(),
  trace: z
    .object({
      design_features: z.array(z.string()).optional(),
      module_ids: refs.optional(),
      bom_line_ids: z.array(z.string()).optional(),
      test_ids: z.array(z.string()).optional(),
      fat_test_ids: z.array(z.string()).optional(),
      sat_test_ids: z.array(z.string()).optional(),
    })
    .optional(),
});
export type Requirement = z.infer<typeof Requirement>;

/* =========================================== applications and materials */

export const INDUSTRIES = [
  'EMS',
  'Semiconductor',
  'ATMP',
  'Battery',
  'EV',
  'Solar',
  'Automotive',
  'Aerospace',
  'Medical',
  'Consumer',
  'Industrial',
  'Energy',
  'New Energy',
  'Defence',
  'General Engineering',
] as const;
export const PROCESSES = [
  'Marking',
  'Welding',
  'Cutting',
  'Cleaning',
  'Drilling',
  'Soldering',
  'Dicing',
  'Inspection',
  'Metrology',
  'Assembly',
  'Handling',
  'Packaging',
  'Trimming',
  'Micromachining',
  'Other',
] as const;

export const Industry = z.object({
  ...baseShape,
  entity: z.literal('industry'),
  code: z.string(),
});
export type Industry = z.infer<typeof Industry>;

export const Application = z.object({
  ...baseShape,
  entity: z.literal('application'),
  process: z.enum(PROCESSES),
  industries: z.array(z.string()),
  product_id: ref.optional(),
  family_id: ref.optional(),
  material_ids: refs.optional(),
  recommended_source_id: ref.optional(),
  recommended_power_w: z.number().nullable().optional(),
  rationale: z.string().optional(),
});
export type Application = z.infer<typeof Application>;

export const ABSORPTION_BANDS = ['uv', 'blue', 'green', 'ir', 'co2'] as const;

export const Material = z.object({
  ...baseShape,
  entity: z.literal('material'),
  category: z.string(),
  thermal_conductivity: Quantity.nullable(),
  melting_point: Quantity.nullable(),
  density: Quantity.nullable(),
  specific_heat: Quantity.nullable(),
  /** Indicative absorptance (0–1) by wavelength band for a clean, flat surface. null = unknown. */
  absorption: z
    .object({
      uv: z.number().min(0).max(1).nullable(),
      blue: z.number().min(0).max(1).nullable(),
      green: z.number().min(0).max(1).nullable(),
      ir: z.number().min(0).max(1).nullable(),
      co2: z.number().min(0).max(1).nullable(),
    })
    .nullable(),
});
export type Material = z.infer<typeof Material>;

/* ========================================================= laser / optics */

export const LASER_CATEGORIES = [
  'Fiber',
  'CO2',
  'UV',
  'Green',
  'Blue',
  'DPSS',
  'Diode',
  'Nd:YAG',
  'Nd:YVO4',
  'MOPA',
  'Q-switched',
  'CW',
  'QCW',
  'Nanosecond',
  'Picosecond',
  'Femtosecond',
  'Excimer',
  'Ultrafast',
] as const;

export const LaserSource = z.object({
  ...baseShape,
  entity: z.literal('laser_source'),
  /** `class` = a generic source technology option (no manufacturer); `product` = a specific model */
  kind: z.enum(['class', 'product']),
  manufacturer_id: ref.optional(),
  manufacturer: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  family: z.string().optional(),
  categories: z.array(z.enum(LASER_CATEGORIES)),
  wavelength: Quantity,
  mode: z.enum(['cw', 'pulsed']),
  pulse_duration: Quantity.nullable().optional(),
  pulse_duration_range: z.tuple([z.number(), z.number()]).nullable().optional(),
  repetition_rate_khz: z.tuple([z.number(), z.number()]).nullable().optional(),
  average_power_w: z.array(z.number()).nullable().optional(),
  pulse_energy: Quantity.nullable().optional(),
  m2: z.number().nullable(),
  /** Collimated beam diameter at the scan head / focusing optic input, mm (used for spot size) */
  beam_diameter_mm: z.number().nullable(),
  wall_plug_efficiency: z.number().min(0).max(1).nullable().optional(),
  cooling: z.string().nullable().optional(),
  interface: z.string().nullable().optional(),
  fiber_connector: z.string().nullable().optional(),
  dimensions: z.string().nullable().optional(),
  datasheet_url: z.string().optional(),
  /** Configurator price multiplier relative to the platform default source — an ESTIMATE */
  price_premium: z.number().nullable().optional(),
  display_color: z.string().optional(),
  short_code: z.string().optional(),
});
export type LaserSource = z.infer<typeof LaserSource>;

export const OPTIC_TYPES = [
  'f_theta',
  'beam_expander',
  'mirror',
  'window',
  'collimator',
  'beam_delivery',
  'objective',
  'telecentric',
] as const;

export const Optic = z.object({
  ...baseShape,
  entity: z.literal('optic'),
  optic_type: z.enum(OPTIC_TYPES),
  manufacturer: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  wavelength_range: z.string().nullable().optional(),
  coating: z.string().nullable().optional(),
  transmission: z.number().nullable().optional(),
  aperture_mm: z.number().nullable().optional(),
  focal_length_mm: z.number().nullable(),
  working_distance_mm: z.number().nullable().optional(),
  scan_field_mm: z.number().nullable().optional(),
  damage_threshold: Quantity.nullable().optional(),
  compatible_source_ids: refs.optional(),
  short_code: z.string().optional(),
});
export type Optic = z.infer<typeof Optic>;

export const Galvo = z.object({
  ...baseShape,
  entity: z.literal('galvo'),
  manufacturer: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  aperture_mm: z.number().nullable().optional(),
  scan_angle_deg: z.number().nullable().optional(),
  speed: Quantity.nullable().optional(),
  repeatability: Quantity.nullable().optional(),
  interface: z.string().nullable().optional(),
  compatible_optic_ids: refs.optional(),
});
export type Galvo = z.infer<typeof Galvo>;

export const Standard = z.object({
  ...baseShape,
  entity: z.literal('standard'),
  code: z.string(),
  scope: z.string().optional(),
});
export type Standard = z.infer<typeof Standard>;

/* ============================================= modules / products / config */

export const Fitment = z.object({
  fam: z.array(z.string()).optional(),
  noFam: z.array(z.string()).optional(),
  deliv: z.array(z.string()).optional(),
  noDeliv: z.array(z.string()).optional(),
  noPlat: z.array(z.string()).optional(),
  mat: z.array(z.string()).optional(),
});
export type Fitment = z.infer<typeof Fitment>;

export const MODULE_KINDS = ['automation', 'software', 'connectivity', 'compliance'] as const;

export const Module = z.object({
  ...baseShape,
  entity: z.literal('module'),
  key: z.string(),
  kind: z.enum(MODULE_KINDS),
  group: z.string(),
  module_type: z.string().optional(),
  /** Configurator list price, INR — ESTIMATE, not a quotation */
  price_estimate_inr: z.number().nullable(),
  fitment: Fitment.optional(),
  // Module DNA (spec §29). Unknown until documented.
  module_version: z.string().optional(),
  mechanical_interfaces: z.array(z.string()).optional(),
  electrical_interfaces: z.array(z.string()).optional(),
  communication: z.array(z.string()).optional(),
  utilities: z.array(z.string()).optional(),
  dimensions: z.string().optional(),
  payload: z.string().optional(),
  accuracy: z.string().optional(),
  cycle_time: z.string().optional(),
  supplier_ids: refs.optional(),
  alternate_supplier_ids: refs.optional(),
  dependencies: refs.optional(),
  approval: z.string().optional(),
});
export type Module = z.infer<typeof Module>;

export const ModuleConflict = z.object({
  ...baseShape,
  entity: z.literal('module_conflict'),
  a: z.string(),
  b: z.string(),
  reason: z.string(),
});
export type ModuleConflict = z.infer<typeof ModuleConflict>;

export const ProductFamily = z.object({
  ...baseShape,
  entity: z.literal('product_family'),
  key: z.string(),
  chapter: z.string().optional(),
  segment: z.string(),
});
export type ProductFamily = z.infer<typeof ProductFamily>;

export const DELIVERY_TYPES = ['galvo', 'galvo2', 'gantry', 'robot', 'handpiece'] as const;
export const MATURITY_STAGES = ['Idea', 'Concept', 'POC', 'Prototype', 'Pilot', 'Product', 'Platform', 'Scale'] as const;

export const ProductApplication = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  source_key: z.string().optional(),
  power_w: z.number().optional(),
  material_key: z.string().optional(),
  rationale: z.string().optional(),
});

export const Product = z.object({
  ...baseShape,
  entity: z.literal('product'),
  key: z.string(),
  family_id: ref,
  code: z.string(),
  title: z.string(),
  tagline: z.string().optional(),
  delivery: z.enum(DELIVERY_TYPES),
  source_keys: z.array(z.string()),
  default_source_key: z.string(),
  powers_w: z.array(z.number()),
  powers_by_source: z.record(z.string(), z.array(z.number())).optional(),
  default_power_w: z.number(),
  lens_keys: z.array(z.string()),
  default_lens_key: z.string(),
  standard_content: z.array(z.string()),
  specs: z.array(z.object({ label: z.string(), value: z.string() })),
  industries: z.array(z.string()),
  lead_time_weeks: z.number().nullable(),
  warranty_months: z.number().nullable(),
  install_weeks: z.number().nullable(),
  /** Standard-machine ex-works price, INR — parametric ESTIMATE, not a quotation */
  base_price_inr: z.number().nullable(),
  maturity: z.enum(MATURITY_STAGES).optional(),
  applications: z.array(ProductApplication),
  variant_of: ref.optional(),
});
export type Product = z.infer<typeof Product>;

export const RecommendationRule = z.object({
  ...baseShape,
  entity: z.literal('rule'),
  rule_type: z.enum(['recommendation', 'compatibility', 'gap']),
  why: z.string(),
  iff: z.record(z.string(), z.unknown()),
  then: z.record(z.string(), z.unknown()),
});
export type RecommendationRule = z.infer<typeof RecommendationRule>;

export const Configuration = z.object({
  ...baseShape,
  entity: z.literal('configuration'),
  product_id: ref,
  application_key: z.string().optional(),
  source_key: z.string().optional(),
  power_w: z.number().optional(),
  lens_key: z.string().optional(),
  modules: z.array(z.string()),
  software: z.string().optional(),
  extras: z.array(z.string()),
  /** Target throughput in parts per hour (legacy simulator `t=` hash field) */
  target_per_hour: z.number().optional(),
  designation: z.string().optional(),
  parent_id: ref.optional(),
  opportunity_id: ref.optional(),
  customer_id: ref.optional(),
  snapshot: z
    .object({
      price_estimate_inr: z.number().nullable(),
      price_band_inr: z.tuple([z.number(), z.number()]).nullable(),
      spot_um: z.number().nullable(),
      dof_mm: z.number().nullable(),
      warnings: z.array(z.string()),
      computed_at: IsoDate,
    })
    .optional(),
});
export type Configuration = z.infer<typeof Configuration>;

/* ==================================================================== BOM */

export const BOM_TYPES = ['EBOM', 'MBOM', 'Service BOM', 'Spare BOM'] as const;
export const BOM_LEVELS = ['Product', 'Assembly', 'Subassembly', 'Module', 'Component'] as const;
export const COST_BASIS = ['QUOTED', 'CATALOGUE', 'ESTIMATE', 'DEMO', 'UNKNOWN'] as const;

export const BomLine = z.object({
  line_id: z.string(),
  parent_line_id: z.string().optional(),
  level: z.enum(BOM_LEVELS),
  part_number: z.string().optional(),
  item_code: z.string().optional(),
  description: z.string(),
  manufacturer: z.string().optional(),
  supplier: z.string().optional(),
  quantity: z.number().min(0),
  unit: z.string(),
  make_buy: z.enum(['Make', 'Buy']),
  unit_cost: z.number().nullable(),
  currency: Currency,
  cost_basis: z.enum(COST_BASIS),
  lead_time_weeks: z.number().nullable().optional(),
  moq: z.number().nullable().optional(),
  risk: z.enum(['Low', 'Medium', 'High', 'Unknown']).optional(),
  alternate: z.string().optional(),
  revision: z.string().optional(),
  module_id: ref.optional(),
  item_class: z.string().optional(),
  import_item: z.boolean().optional(),
});
export type BomLine = z.infer<typeof BomLine>;

export const Bom = z.object({
  ...baseShape,
  entity: z.literal('bom'),
  bom_type: z.enum(BOM_TYPES),
  revision: z.string(),
  product_id: ref.optional(),
  configuration_id: ref.optional(),
  project_id: ref.optional(),
  lines: z.array(BomLine),
});
export type Bom = z.infer<typeof Bom>;

/* ============================================================== cost model */

const costLine = z.record(z.string(), z.unknown());

export const CostModel = z.object({
  ...baseShape,
  entity: z.literal('cost_model'),
  currency: Currency,
  qty: z.number().int().min(1),
  bom_id: ref.optional(),
  configuration_id: ref.optional(),
  opportunity_id: ref.optional(),
  project_id: ref.optional(),
  product_id: ref.optional(),
  /** Legacy-compatible module lines: material, mechanical, electrical, software, manufacturing,
   *  labour, design, site, commercial, commissioning, packaging, amc */
  lines: z.record(z.string(), z.array(costLine)),
  landed: z.object({
    freightPct: z.number(),
    dutyPct: z.number(),
    landingPct: z.number(),
    gstPct: z.number(),
    siteContPct: z.number(),
  }),
  markup: z.object({
    overheadPct: z.number(),
    contingencyPct: z.number(),
    profitPct: z.number(),
  }),
  teal: z
    .object({
      insurancePct: z.number(),
      sgaPct: z.number(),
      warrantyPct: z.number(),
      profitPct: z.number(),
      ossMonthly: z.number(),
      stationHc: z.number(),
      ossMonths: z.number(),
      packRate: z.number(),
    })
    .optional(),
  economics: z
    .object({
      annual_saving: z.number().nullable().optional(),
      annual_parts: z.number().nullable().optional(),
      life_years: z.number().nullable().optional(),
      annual_operating_cost: z.number().nullable().optional(),
    })
    .optional(),
  fx: z
    .array(z.object({ code: z.string(), rate_to_inr: z.number(), as_of: z.string().nullable(), source: z.string() }))
    .optional(),
  scenario: z.string().optional(),
  assumptions: z.array(z.string()).optional(),
});
export type CostModel = z.infer<typeof CostModel>;

/* ============================================================== POC / DOE */

export const POC_STATUSES = ['Planned', 'Samples Awaited', 'In Progress', 'Analysis', 'Complete', 'Cancelled'] as const;
export const POC_DECISIONS = ['Undecided', 'Feasible', 'Feasible with conditions', 'Not feasible'] as const;

export const Parameter = z.object({ name: z.string(), value: z.string(), unit: z.string().optional() });

export const Poc = z.object({
  ...baseShape,
  entity: z.literal('poc'),
  poc_status: z.enum(POC_STATUSES),
  customer_id: ref.optional(),
  opportunity_id: ref.optional(),
  application_id: ref.optional(),
  product_id: ref.optional(),
  objective: z.string(),
  part: z.string().optional(),
  material_id: ref.optional(),
  lot: z.string().optional(),
  source_id: ref.optional(),
  power_w: z.number().nullable().optional(),
  optic_id: ref.optional(),
  parameters: z.array(Parameter).optional(),
  doe_id: ref.optional(),
  measurements: z
    .array(z.object({ characteristic: z.string(), value: z.string(), unit: z.string().optional(), method: z.string().optional() }))
    .optional(),
  images: z.array(z.string()).optional(),
  cycle_time_s: z.number().nullable().optional(),
  quality: z.string().optional(),
  defects: z.string().optional(),
  conclusion: z.string().optional(),
  decision: z.enum(POC_DECISIONS),
  open_questions: z.array(z.string()).optional(),
});
export type Poc = z.infer<typeof Poc>;

export const DoeFactor = z.object({
  name: z.string(),
  unit: z.string().optional(),
  levels: z.array(z.union([z.number(), z.string()])).min(1),
});
export const DoeResponse = z.object({
  name: z.string(),
  unit: z.string().optional(),
  lsl: z.number().nullable().optional(),
  usl: z.number().nullable().optional(),
  target: z.number().nullable().optional(),
});
export const DoeRun = z.object({
  run: z.number().int(),
  replicate: z.number().int().optional(),
  settings: z.record(z.string(), z.union([z.number(), z.string()])),
  results: z.record(z.string(), z.number().nullable()),
});

export const Doe = z.object({
  ...baseShape,
  entity: z.literal('doe'),
  poc_id: ref.optional(),
  design: z.enum(['full_factorial']),
  factors: z.array(DoeFactor),
  responses: z.array(DoeResponse),
  constraints: z.array(z.string()).optional(),
  noise_factors: z.array(z.string()).optional(),
  replicates: z.number().int().min(1),
  runs: z.array(DoeRun),
});
export type Doe = z.infer<typeof Doe>;

/* ============================================================== projects */

export const TASK_STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Completed'] as const;
export const ProjectTask = z.object({
  id: z.string(),
  name: z.string(),
  owner: z.string().optional(),
  start: IsoDate,
  end: IsoDate,
  depends_on: z.array(z.string()).optional(),
  status: z.enum(TASK_STATUSES),
  milestone: z.boolean().optional(),
  gate_code: z.string().optional(),
});
export type ProjectTask = z.infer<typeof ProjectTask>;

export const GATE_DECISIONS = ['PENDING', 'GO', 'GO WITH CONDITIONS', 'NO-GO'] as const;

export const GateEvidenceItem = z.object({
  item: z.string(),
  mandatory: z.boolean(),
  status: z.enum(['provided', 'missing', 'not_applicable']),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export const GateReview = z.object({
  gate_code: z.string(),
  decision: z.enum(GATE_DECISIONS),
  date: IsoDate.optional(),
  approvers: z.array(z.string()).optional(),
  evidence: z.array(GateEvidenceItem),
  conditions: z.array(z.object({ text: z.string(), owner: z.string(), due: IsoDate, closed: z.boolean().optional() })).optional(),
  risks: z.array(z.string()).optional(),
  notes: z.string().optional(),
});
export type GateReview = z.infer<typeof GateReview>;

export const Project = z.object({
  ...baseShape,
  entity: z.literal('project'),
  customer_id: ref.optional(),
  opportunity_id: ref.optional(),
  product_id: ref.optional(),
  configuration_id: ref.optional(),
  bom_id: ref.optional(),
  cost_model_id: ref.optional(),
  scope: z.string().optional(),
  start: IsoDate.optional(),
  end: IsoDate.optional(),
  budget: z.number().nullable().optional(),
  currency: Currency.optional(),
  tasks: z.array(ProjectTask),
  gates: z.array(GateReview),
});
export type Project = z.infer<typeof Project>;

export const GateDefinition = z.object({
  ...baseShape,
  entity: z.literal('gate_definition'),
  code: z.string().regex(/^G(10|[0-9])$/),
  order: z.number().int(),
  inputs: z.string(),
  outputs: z.string(),
  approval_criteria: z.string(),
  responsible: z.string(),
  exit_criteria: z.string(),
  mandatory_evidence: z.array(z.string()),
  customer_facing: z.boolean(),
});
export type GateDefinition = z.infer<typeof GateDefinition>;

/* ================================================================== risk */

export const RISK_KINDS = ['Risk', 'DFMEA', 'PFMEA', 'Machine FMEA', 'Process Risk'] as const;

export const Risk = z.object({
  ...baseShape,
  entity: z.literal('risk'),
  kind: z.enum(RISK_KINDS),
  failure_mode: z.string().optional(),
  cause: z.string().optional(),
  effect: z.string().optional(),
  severity: z.number().int().min(1).max(10).nullable().optional(),
  occurrence: z.number().int().min(1).max(10).nullable().optional(),
  detection: z.number().int().min(1).max(10).nullable().optional(),
  action: z.string().optional(),
  due_date: IsoDate.optional(),
  risk_status: z.enum(['Open', 'Mitigating', 'Closed', 'Accepted']),
  project_id: ref.optional(),
  product_id: ref.optional(),
  opportunity_id: ref.optional(),
  module_id: ref.optional(),
});
export type Risk = z.infer<typeof Risk>;

/* ============================================================ suppliers */

export const Supplier = z.object({
  ...baseShape,
  entity: z.literal('supplier'),
  company_id: ref.optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  products: z.array(z.string()).optional(),
  typical_lead_time: z.string().optional(),
  moq: z.string().optional(),
  payment_terms: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  india_presence: z.string().optional(),
  service: z.string().optional(),
  supplier_risk: z.enum(['Low', 'Medium', 'High', 'Unknown']).optional(),
  alternate_ids: refs.optional(),
});
export type Supplier = z.infer<typeof Supplier>;

export const RfqItem = z.object({
  line_id: z.string(),
  part: z.string(),
  specification: z.string().optional(),
  drawing: z.string().optional(),
  quantity: z.number(),
  unit: z.string(),
  quality: z.string().optional(),
  delivery: z.string().optional(),
  technical_requirements: z.string().optional(),
});
export const RfqQuote = z.object({
  supplier_id: ref,
  line_id: z.string(),
  price: z.number().nullable(),
  currency: Currency,
  lead_time_weeks: z.number().nullable().optional(),
  validity: IsoDate.optional(),
  technical_compliance: z.enum(['Compliant', 'Deviation', 'Non-compliant', 'Unknown']),
  deviation: z.string().optional(),
  received_at: IsoDate.optional(),
});

export const Rfq = z.object({
  ...baseShape,
  entity: z.literal('rfq'),
  bom_id: ref.optional(),
  project_id: ref.optional(),
  rfq_status: z.enum(['Draft', 'Issued', 'Quotes Received', 'Evaluated', 'Awarded', 'Cancelled']),
  commercial_terms: z.string().optional(),
  supplier_ids: refs,
  items: z.array(RfqItem),
  quotes: z.array(RfqQuote),
  selection: z.record(z.string(), ref).optional(),
  approval: z.string().optional(),
});
export type Rfq = z.infer<typeof Rfq>;

/* ======================================================== FAT / SAT / fleet */

export const TestResult = z.enum(['NOT RUN', 'PASS', 'FAIL', 'PASS WITH DEVIATION']);
export const AcceptanceTest = z.object({
  test_id: z.string(),
  requirement_id: ref.optional(),
  section: z.string().optional(),
  test: z.string(),
  method: z.string().optional(),
  expected: z.string().optional(),
  actual: z.string().optional(),
  result: TestResult,
  evidence: z.string().optional(),
  deviation: z.string().optional(),
  action: z.string().optional(),
});
export type AcceptanceTest = z.infer<typeof AcceptanceTest>;

export const AcceptanceProtocol = z.object({
  ...baseShape,
  entity: z.literal('acceptance'),
  phase: z.enum(['FAT', 'SAT']),
  project_id: ref.optional(),
  machine_id: ref.optional(),
  tests: z.array(AcceptanceTest),
  approval: z.string().optional(),
  approved_on: IsoDate.optional(),
});
export type AcceptanceProtocol = z.infer<typeof AcceptanceProtocol>;

export const Machine = z.object({
  ...baseShape,
  entity: z.literal('machine'),
  serial: z.string(),
  customer_id: ref.optional(),
  site: z.string().optional(),
  product_id: ref.optional(),
  configuration_id: ref.optional(),
  project_id: ref.optional(),
  bom_revision: z.string().optional(),
  software_version: z.string().optional(),
  plc_version: z.string().optional(),
  commissioned_on: IsoDate.optional(),
  warranty_until: IsoDate.optional(),
  amc: z.string().optional(),
});
export type Machine = z.infer<typeof Machine>;

export const ServiceTicket = z.object({
  ...baseShape,
  entity: z.literal('service_ticket'),
  machine_id: ref.optional(),
  issue: z.string(),
  alarm: z.string().optional(),
  root_cause: z.string().optional(),
  action: z.string().optional(),
  spare: z.string().optional(),
  technician: z.string().optional(),
  downtime_h: z.number().nullable().optional(),
  opened_on: IsoDate.optional(),
  resolved_on: IsoDate.optional(),
  ticket_status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']),
});
export type ServiceTicket = z.infer<typeof ServiceTicket>;

/* =========================================== knowledge / evidence / memory */

export const Source = z.object({
  ...baseShape,
  entity: z.literal('source'),
  kind: z.enum(['handbook', 'legacy_app', 'datasheet', 'web', 'standard', 'internal', 'paper', 'patent', 'dataset']),
  url: z.string().optional(),
  publisher: z.string().optional(),
  author: z.string().optional(),
  published: z.string().optional(),
  retrieved_at: IsoDate.optional(),
  terms_note: z.string().optional(),
});
export type Source = z.infer<typeof Source>;

export const Evidence = z.object({
  ...baseShape,
  entity: z.literal('evidence'),
  claim: z.string(),
  entity_id: ref,
  source_id: ref.optional(),
  source_url: z.string().optional(),
  document: z.string().optional(),
  page: z.string().optional(),
  section: z.string().optional(),
  excerpt: z.string().optional(),
  retrieved_at: IsoDate.optional(),
  verification_status: VerificationStatus,
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']),
  reviewer: z.string().optional(),
  verification_date: IsoDate.optional(),
});
export type Evidence = z.infer<typeof Evidence>;

export const Lesson = z.object({
  ...baseShape,
  entity: z.literal('lesson'),
  what_worked: z.string().optional(),
  what_failed: z.string().optional(),
  why: z.string().optional(),
  corrective_action: z.string().optional(),
  design_rule: z.string().optional(),
  category: z.enum(['Design', 'Process', 'Supplier', 'Cost', 'Schedule', 'Quality', 'Service', 'Other']),
  product_id: ref.optional(),
  module_id: ref.optional(),
  supplier_id: ref.optional(),
  project_id: ref.optional(),
  customer_id: ref.optional(),
});
export type Lesson = z.infer<typeof Lesson>;

export const TECH_STATUSES = ['Emerging', 'Developing', 'Commercial', 'Mature', 'Declining'] as const;
export const Technology = z.object({
  ...baseShape,
  entity: z.literal('technology'),
  domain: z.string(),
  /** Only assigned with evidence; null = not assessed */
  radar_status: z.enum(TECH_STATUSES).nullable(),
  evidence_ids: refs.optional(),
  knowledge_refs: z.array(z.string()).optional(),
});
export type Technology = z.infer<typeof Technology>;

export const SemiconductorStep = z.object({
  ...baseShape,
  entity: z.literal('semi_step'),
  order: z.number().int(),
  stage: z.enum(['Materials', 'Wafer', 'Front-end fab', 'Test', 'Back-end / ATMP']),
  laser_relevance: z.string().optional(),
  knowledge_refs: z.array(z.string()).optional(),
});
export type SemiconductorStep = z.infer<typeof SemiconductorStep>;

export const DecisionRecord = z.object({
  ...baseShape,
  entity: z.literal('decision'),
  question: z.string(),
  context: z.string().optional(),
  options: z.array(z.string()),
  criteria: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  evidence_ids: refs.optional(),
  decision: z.string().optional(),
  approver: z.string().optional(),
  decided_on: IsoDate.optional(),
  revision: z.number().int().optional(),
});
export type DecisionRecord = z.infer<typeof DecisionRecord>;

export const ChangeRequest = z.object({
  ...baseShape,
  entity: z.literal('change_request'),
  change_type: z.enum(['ECR', 'ECN']),
  reason: z.string(),
  impact: z.string().optional(),
  affected_ids: refs.optional(),
  cr_status: z.enum(['Draft', 'Submitted', 'Approved', 'Rejected', 'Implemented', 'Verified']),
});
export type ChangeRequest = z.infer<typeof ChangeRequest>;

export const Localization = z.object({
  ...baseShape,
  entity: z.literal('localization'),
  imported_component: z.string(),
  indian_alternative: z.string().optional(),
  supplier_id: ref.optional(),
  current_cost: z.number().nullable().optional(),
  localized_cost: z.number().nullable().optional(),
  currency: Currency.optional(),
  lead_time: z.string().optional(),
  technology_gap: z.string().optional(),
  classification: z.enum(['LOCALIZE', 'PARTNER', 'BUY', 'DEVELOP', 'IMPORT', 'UNDECIDED']),
  stage: z.string().optional(),
});
export type Localization = z.infer<typeof Localization>;

export const Vocabulary = z.object({
  ...baseShape,
  entity: z.literal('vocabulary'),
  key: z.string(),
  values: z.array(z.string()),
});
export type Vocabulary = z.infer<typeof Vocabulary>;

/* Formula catalogue entries (Automation Handbook Part 54) */
export const Formula = z.object({
  ...baseShape,
  entity: z.literal('formula'),
  code: z.string(),
  discipline: z.string(),
  quantity: z.string(),
  formula: z.string(),
  symbols: z.string().optional(),
  worked_value: z.string().optional(),
  handbook_part: z.string().optional(),
  implemented_by: z.string().optional(),
});
export type Formula = z.infer<typeof Formula>;

/* Generic reference data rows (rates, FX, tax, approval bands) */
export const ReferenceRow = z.object({
  ...baseShape,
  entity: z.literal('reference'),
  table: z.string(),
  values: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
});
export type ReferenceRow = z.infer<typeof ReferenceRow>;

export const ItemMaster = z.object({
  ...baseShape,
  entity: z.literal('component'),
  code: z.string(),
  spec: z.string().optional(),
  category: z.string(),
  item_class: z.string(),
  uom: z.string(),
  price: z.number().nullable(),
  currency: Currency,
  price_basis: z.enum(COST_BASIS),
  vendor: z.string().optional(),
  lead_time_weeks: z.number().nullable().optional(),
  moq: z.number().nullable().optional(),
  hsn: z.string().optional(),
  price_date: IsoDate.optional(),
});
export type ItemMaster = z.infer<typeof ItemMaster>;
