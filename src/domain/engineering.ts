import { z } from 'zod';
import { baseShape, Confidence, IsoDate } from './common';

/*
 * GLOBAL ENGINEERING DATABASE + EQUIPMENT SIMULATION (industrial intelligence master prompt §8–§60,
 * §81, §85–§90). Schemas only — engineering logic lives in src/services/eng and src/services/sim.
 *
 * Principles encoded here:
 *  - one canonical record per component (part); equipment, simulation and BOM reference it (§142)
 *  - specifications are rows, not columns (§12): a SpecValue names a SpecDefinition by key
 *  - evidence is attached per specification, not only per product (§46)
 *  - GLOBAL (public engineering) and TEAL (internal) data are separated by `scope` (§115)
 *  - nothing implies a value is known: missing = null / omitted → shown as Not Available
 */

const ref = z.string();
const refs = z.array(ref);

/* ================================================================ taxonomy */

/** Engineering disciplines (§4 ENGINEERING) — the product-type taxonomy groups under these. */
export const DISCIPLINES = ['Laser', 'Optics', 'Vision', 'Motion', 'Controls', 'Robotics', 'Safety', 'Pneumatics', 'Electrical', 'Mechanical', 'Software'] as const;
export type Discipline = (typeof DISCIPLINES)[number];

/**
 * Product types (§9, §14–§35). A part's `product_type` is one of these keys; unknown keys are
 * allowed (the database is extensible) and group under "Other".
 */
export const PRODUCT_TYPES: Record<string, { label: string; discipline: Discipline }> = {
  laser_source: { label: 'Laser source', discipline: 'Laser' },
  laser_module: { label: 'Laser module', discipline: 'Laser' },
  laser_engine: { label: 'Laser engine', discipline: 'Laser' },
  laser_controller: { label: 'Laser controller', discipline: 'Laser' },
  laser_driver: { label: 'Laser driver', discipline: 'Laser' },
  laser_head: { label: 'Laser head', discipline: 'Laser' },
  chiller: { label: 'Chiller', discipline: 'Laser' },
  fume_extraction: { label: 'Fume extraction', discipline: 'Laser' },
  galvo: { label: 'Galvo scanner', discipline: 'Optics' },
  galvo_controller: { label: 'Galvo controller', discipline: 'Optics' },
  f_theta: { label: 'F-theta lens', discipline: 'Optics' },
  beam_expander: { label: 'Beam expander', discipline: 'Optics' },
  mirror: { label: 'Mirror', discipline: 'Optics' },
  lens: { label: 'Lens', discipline: 'Optics' },
  window: { label: 'Window', discipline: 'Optics' },
  collimator: { label: 'Collimator', discipline: 'Optics' },
  polarizer: { label: 'Polarizer', discipline: 'Optics' },
  waveplate: { label: 'Waveplate', discipline: 'Optics' },
  filter: { label: 'Filter', discipline: 'Optics' },
  dichroic: { label: 'Dichroic', discipline: 'Optics' },
  isolator: { label: 'Optical isolator', discipline: 'Optics' },
  aom: { label: 'AOM', discipline: 'Optics' },
  eom: { label: 'EOM', discipline: 'Optics' },
  fiber: { label: 'Fiber / fiber component', discipline: 'Optics' },
  beam_delivery: { label: 'Beam delivery', discipline: 'Optics' },
  camera: { label: 'Camera', discipline: 'Vision' },
  vision_lens: { label: 'Vision lens', discipline: 'Vision' },
  telecentric_lens: { label: 'Telecentric lens', discipline: 'Vision' },
  lighting: { label: 'Lighting', discipline: 'Vision' },
  vision_controller: { label: 'Vision controller', discipline: 'Vision' },
  vision_software: { label: 'Vision software', discipline: 'Vision' },
  servo_motor: { label: 'Servo motor', discipline: 'Motion' },
  servo_drive: { label: 'Servo drive', discipline: 'Motion' },
  linear_motor: { label: 'Linear motor', discipline: 'Motion' },
  linear_stage: { label: 'Linear stage', discipline: 'Motion' },
  ball_screw_stage: { label: 'Ball-screw stage', discipline: 'Motion' },
  rotary_stage: { label: 'Rotary stage', discipline: 'Motion' },
  encoder: { label: 'Encoder', discipline: 'Motion' },
  motion_controller: { label: 'Motion controller', discipline: 'Motion' },
  gearbox: { label: 'Gearbox', discipline: 'Motion' },
  coupling: { label: 'Coupling', discipline: 'Motion' },
  plc: { label: 'PLC', discipline: 'Controls' },
  hmi: { label: 'HMI', discipline: 'Controls' },
  ipc: { label: 'Industrial PC', discipline: 'Controls' },
  sensor: { label: 'Sensor', discipline: 'Controls' },
  robot: { label: 'Robot', discipline: 'Robotics' },
  robot_controller: { label: 'Robot controller', discipline: 'Robotics' },
  gripper: { label: 'Gripper', discipline: 'Robotics' },
  end_effector: { label: 'End effector', discipline: 'Robotics' },
  safety_plc: { label: 'Safety PLC', discipline: 'Safety' },
  safety_relay: { label: 'Safety relay', discipline: 'Safety' },
  light_curtain: { label: 'Light curtain', discipline: 'Safety' },
  safety_scanner: { label: 'Safety laser scanner', discipline: 'Safety' },
  door_switch: { label: 'Door switch / interlock', discipline: 'Safety' },
  emergency_stop: { label: 'Emergency stop', discipline: 'Safety' },
  safety_controller: { label: 'Safety controller', discipline: 'Safety' },
  cylinder: { label: 'Cylinder', discipline: 'Pneumatics' },
  valve: { label: 'Valve', discipline: 'Pneumatics' },
  regulator: { label: 'Regulator / FRL', discipline: 'Pneumatics' },
  vacuum_generator: { label: 'Vacuum pump / generator', discipline: 'Pneumatics' },
  smps: { label: 'Power supply (SMPS)', discipline: 'Electrical' },
  circuit_breaker: { label: 'MCB / MCCB', discipline: 'Electrical' },
  contactor: { label: 'Contactor / relay', discipline: 'Electrical' },
  cable: { label: 'Cable / connector', discipline: 'Electrical' },
  ups: { label: 'UPS / transformer', discipline: 'Electrical' },
  panel: { label: 'Electrical panel', discipline: 'Electrical' },
  frame: { label: 'Frame / profile', discipline: 'Mechanical' },
  fixture: { label: 'Fixture / jig', discipline: 'Mechanical' },
  conveyor: { label: 'Conveyor', discipline: 'Mechanical' },
  guide_rail: { label: 'Guide rail / bearing', discipline: 'Mechanical' },
  enclosure: { label: 'Enclosure', discipline: 'Mechanical' },
  software: { label: 'Software', discipline: 'Software' },
};
export const productTypeLabel = (t: string) => PRODUCT_TYPES[t]?.label ?? t.replace(/_/g, ' ');
export const disciplineOf = (t: string): Discipline | 'Other' => PRODUCT_TYPES[t]?.discipline ?? 'Other';

/** Communication protocols (§43). */
export const COMM_PROTOCOLS = ['Ethernet', 'USB', 'RS232', 'RS485', 'CAN', 'EtherCAT', 'PROFINET', 'EtherNet/IP', 'Modbus TCP', 'Modbus RTU', 'OPC UA', 'SECS/GEM', 'TCP/IP', 'GigE Vision', 'USB3 Vision', 'CoaXPress', 'Camera Link', 'XY2-100', 'SL2-100', 'IO-Link', 'DB25'] as const;

/* ============================================================ provenance */

/** §45 source types, with the §109 priority order (1 = most authoritative). */
export const SOURCE_TYPES = ['Manufacturer', 'Distributor', 'Technical Paper', 'Research', 'Standard', 'Government', 'Industry Report', 'User Provided', 'TEAL Internal', 'Derived'] as const;

/** §49 record lifecycle for engineering data. */
export const RECORD_STATUSES = ['Draft', 'Imported', 'Extracted', 'Reviewed', 'Approved', 'Validated', 'Archived'] as const;

/** §115 data separation. */
export const DATA_SCOPES = ['GLOBAL', 'TEAL', 'PROJECT', 'POC', 'VALIDATED'] as const;

export const EXTRACTION_STATUSES = ['USER_ENTERED', 'EXTRACTED', 'REVIEWED', 'APPROVED', 'NOT_FOUND'] as const;

/* ======================================================= specifications */

export const SPEC_DATA_TYPES = ['number', 'range', 'text', 'enum', 'boolean'] as const;

/** §12 Specification definition — the dynamic column. Data-driven: a new parameter is a new record. */
export const SpecDefinition = z.object({
  ...baseShape,
  entity: z.literal('spec_definition'),
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  category: z.string(),
  spec_type: z.enum(SPEC_DATA_TYPES),
  /** unit dimension from the unit engine ('power', 'length' …) or 'none' */
  unit_type: z.string(),
  canonical_unit: z.string().optional(),
  allowed_units: z.array(z.string()).optional(),
  applies_to: z.array(z.string()),
  enum_values: z.array(z.string()).optional(),
  validation: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
  /** words that name this parameter in a query ("aperture", "clear aperture") */
  aliases: z.array(z.string()).optional(),
  filterable: z.boolean().optional(),
});
export type SpecDefinition = z.infer<typeof SpecDefinition>;

/**
 * §12/§13/§46 Specification value with field-level evidence. `value` is the nominal as published
 * in `unit`; min/max hold a range. Normalised values are derived at read time from the definition's
 * canonical unit — the original is never overwritten.
 */
export const SpecValue = z.object({
  spec: z.string(),
  value: z.number().nullable().optional(),
  min: z.number().nullable().optional(),
  max: z.number().nullable().optional(),
  text: z.string().optional(),
  unit: z.string().optional(),
  /** the text exactly as the source printed it */
  original: z.string().optional(),
  condition: z.string().optional(),
  source_id: ref.optional(),
  /** where in the source: page, table, section, or an excerpt */
  evidence: z.string().optional(),
  confidence: Confidence.optional(),
  verified: z.boolean().optional(),
  extraction_status: z.enum(EXTRACTION_STATUSES).optional(),
  retrieved_at: IsoDate.optional(),
  last_verified: IsoDate.optional(),
});
export type SpecValue = z.infer<typeof SpecValue>;

/** §43 interface model. */
export const Interfaces = z.object({
  mechanical: z
    .object({ mounting_pattern: z.string().optional(), thread: z.string().optional(), flange: z.string().optional(), dimensions: z.string().optional(), orientation: z.string().optional(), tolerance: z.string().optional() })
    .optional(),
  optical: z.object({ wavelength: z.string().optional(), beam_diameter: z.string().optional(), aperture: z.string().optional(), polarization: z.string().optional(), connector: z.string().optional(), na: z.string().optional(), focus: z.string().optional() }).optional(),
  electrical: z.object({ voltage: z.string().optional(), current: z.string().optional(), power: z.string().optional(), connector: z.string().optional(), signals: z.array(z.string()).optional() }).optional(),
  communication: z.array(z.string()).optional(),
  software: z.array(z.string()).optional(),
});
export type Interfaces = z.infer<typeof Interfaces>;

export const PriceRecord = z.object({
  price: z.number().nonnegative(),
  currency: z.enum(['INR', 'USD', 'EUR', 'JPY', 'GBP', 'CNY']),
  basis: z.enum(['QUOTED', 'CATALOGUE', 'ESTIMATE', 'DEMO']),
  date: IsoDate.optional(),
  supplier_id: ref.optional(),
  source_id: ref.optional(),
  moq: z.number().int().positive().optional(),
  lead_time_weeks: z.number().nonnegative().nullable().optional(),
});
export type PriceRecord = z.infer<typeof PriceRecord>;

export const LIFECYCLE_STATUSES = ['Announced', 'Active', 'NRND', 'Discontinued', 'Unknown'] as const;

/**
 * §11 Universal product (a manufacturer's component in the global engineering database, or a TEAL
 * component in the TEAL overlay). Not to be confused with `product` (TEAL's machine platforms).
 */
export const Part = z.object({
  ...baseShape,
  entity: z.literal('part'),
  scope: z.enum(DATA_SCOPES),
  record_status: z.enum(RECORD_STATUSES),
  manufacturer_id: ref.optional(),
  brand: z.string().optional(),
  family: z.string().optional(),
  series: z.string().optional(),
  model_number: z.string(),
  product_type: z.string(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  application_ids: refs.optional(),
  processes: z.array(z.string()).optional(),
  country_of_origin: z.string().optional(),
  manufacturing_location: z.string().optional(),
  lifecycle_status: z.enum(LIFECYCLE_STATUSES),
  release_date: IsoDate.optional(),
  discontinued_date: IsoDate.optional(),
  successor_id: ref.optional(),
  specs: z.array(SpecValue),
  interfaces: Interfaces.optional(),
  /** never inferred: each certification names its source */
  certifications: z.array(z.object({ name: z.string(), source_id: ref.optional(), verified: z.boolean().optional() })).optional(),
  documents: z.array(z.object({ kind: z.enum(['Datasheet', 'Manual', 'Drawing', 'CAD', 'Application Note', 'Test Report', 'Specification', 'Product Page']), title: z.string(), url: z.string().optional(), source_id: ref.optional() })).optional(),
  supplier_ids: refs.optional(),
  prices: z.array(PriceRecord).optional(),
  /** TEAL overlay: the global part this TEAL part is compared against */
  compare_to_ids: refs.optional(),
  next_review: IsoDate.optional(),
});
export type Part = z.infer<typeof Part>;

/* ========================================================== compatibility */

export const COMPAT_TYPES = ['Compatible', 'ConditionallyCompatible', 'ManufacturerRecommended', 'EngineeringCompatible', 'Incompatible', 'Unknown'] as const;
export type CompatType = (typeof COMPAT_TYPES)[number];

export const RULE_CHECKS = ['range_contains', 'a_lte_b', 'a_gte_b', 'text_equals', 'shared_protocol'] as const;

/**
 * §42/§44 Compatibility rule — editable, source-tagged, versioned, reviewable. A rule result is an
 * ENGINEERING inference; it is never presented as manufacturer-confirmed.
 */
export const CompatibilityRule = z.object({
  ...baseShape,
  entity: z.literal('compatibility_rule'),
  a_types: z.array(z.string()).min(1),
  b_types: z.array(z.string()).min(1),
  check: z.enum(RULE_CHECKS),
  /** spec keys (or 'communication' for the protocol list) */
  a_spec: z.string(),
  b_spec: z.string(),
  /** a_lte_b / a_gte_b: compare a × factor against b (e.g. 0.9 for a margin) */
  factor: z.number().positive().optional(),
  on_fail: z.enum(['Incompatible', 'ConditionallyCompatible']),
  explanation: z.string(),
  rule_version: z.number().int().positive(),
  rule_status: z.enum(['Draft', 'Active', 'Retired']),
  reviewed_by: z.string().optional(),
  reviewed_at: IsoDate.optional(),
});
export type CompatibilityRule = z.infer<typeof CompatibilityRule>;

/** §42 Compatibility relationship between two parts, with evidence. */
export const Compatibility = z
  .object({
    ...baseShape,
    entity: z.literal('compatibility'),
    a_id: ref,
    b_id: ref,
    relationship: z.enum(COMPAT_TYPES),
    conditions: z.string().optional(),
    evidence: z.string().optional(),
  })
  .refine((c) => c.relationship !== 'ManufacturerRecommended' || !!c.provenance.source_id, {
    message: 'A manufacturer-recommended relationship needs a source (provenance.source_id)',
    path: ['relationship'],
  });
export type Compatibility = z.infer<typeof Compatibility>;

/** §47 Data conflict — two sources disagree. Never resolved by overwriting. */
export const DataConflict = z.object({
  ...baseShape,
  entity: z.literal('data_conflict'),
  part_id: ref,
  parameter: z.string(),
  source_a_id: ref.optional(),
  value_a: z.string(),
  source_b_id: ref.optional(),
  value_b: z.string(),
  conflict_status: z.enum(['Open', 'Resolved', 'Dismissed']),
  reviewer: z.string().optional(),
  resolution: z.string().optional(),
  resolution_source_id: ref.optional(),
});
export type DataConflict = z.infer<typeof DataConflict>;

/* ============================================================ simulation */

export const STATION_KINDS = ['load', 'buffer', 'fixture', 'align', 'vision', 'motion', 'process', 'laser', 'inspect', 'sort', 'unload', 'transfer', 'assembly', 'test', 'manual'] as const;
export type StationKind = (typeof STATION_KINDS)[number];

/** §140 basis of an input or result. */
export const BASES = ['CALCULATED', 'EMPIRICAL', 'USER_INPUT', 'MANUFACTURER_DATA', 'VALIDATED', 'ASSUMPTION', 'DEMO'] as const;
export type Basis = (typeof BASES)[number];

/** Variability of a station time (§68). Parameters are seconds. */
export const Distribution = z.object({
  type: z.enum(['fixed', 'uniform', 'triangular', 'normal']),
  min: z.number().nonnegative().optional(),
  max: z.number().nonnegative().optional(),
  mode: z.number().nonnegative().optional(),
  sd: z.number().nonnegative().optional(),
});
export type Distribution = z.infer<typeof Distribution>;

/** Laser process-time inputs (§69 what-if on speed, passes, frequency). */
export const LaserProcess = z.object({
  /** vector length for welding / cutting / scribing (time = path ÷ speed × passes) */
  path_mm: z.number().nonnegative().nullable().optional(),
  /** filled area for marking / cleaning / ablation (time = area ÷ (hatch × speed) × passes) */
  area_mm2: z.number().nonnegative().nullable().optional(),
  hatch_mm: z.number().positive().nullable().optional(),
  speed_mm_s: z.number().positive().nullable().optional(),
  passes: z.number().int().positive().nullable().optional(),
  jump_overhead_s: z.number().nonnegative().nullable().optional(),
  power_w: z.number().positive().nullable().optional(),
  frequency_khz: z.number().positive().nullable().optional(),
  pulse_width_ns: z.number().positive().nullable().optional(),
});
export type LaserProcess = z.infer<typeof LaserProcess>;

export const Slot = z.object({ role: z.string(), product_type: z.string(), required: z.boolean().optional(), quantity: z.number().int().positive().optional() });
export type Slot = z.infer<typeof Slot>;

/** §61 Architecture node / station. */
export const Station = z.object({
  key: z.string().regex(/^[a-z0-9_-]+$/),
  name: z.string(),
  kind: z.enum(STATION_KINDS),
  function: z.string().optional(),
  /** mean time per part at this station, seconds; null = not yet known */
  time_s: z.number().nonnegative().nullable(),
  time_basis: z.enum(BASES).optional(),
  dist: Distribution.optional(),
  laser: LaserProcess.optional(),
  parallel: z.number().int().positive().default(1),
  /** capacity of the queue after this station (0 = none) */
  buffer_after: z.number().int().nonnegative().default(0),
  reject_rate: z.number().min(0).max(1).optional(),
  rework_rate: z.number().min(0).max(1).optional(),
  mtbf_min: z.number().positive().nullable().optional(),
  mttr_min: z.number().nonnegative().nullable().optional(),
  changeover_min: z.number().nonnegative().nullable().optional(),
  power_kw: z.number().nonnegative().nullable().optional(),
  footprint_m2: z.number().nonnegative().nullable().optional(),
  capex: z.number().nonnegative().nullable().optional(),
  operator: z.boolean().optional(),
  /** random operator intervention: probability per part and added seconds (§64, §68) */
  intervention: z.object({ probability: z.number().min(0).max(1), time_s: z.number().nonnegative() }).optional(),
  slots: z.array(Slot).optional(),
});
export type Station = z.infer<typeof Station>;

export const READINESS_DIMENSIONS = ['Technology', 'Mechanical', 'Electrical', 'Controls', 'Laser', 'Vision', 'Software', 'Manufacturing', 'Supply Chain', 'Quality', 'Safety', 'Customer', 'Commercial', 'Service'] as const;
export const READINESS_STATUSES = ['Not Started', 'Concept', 'Development', 'Prototype', 'POC', 'Validated', 'Production Ready'] as const;

export const TEMPLATE_GROUPS = ['Laser', 'Electronics', 'Semiconductor', 'Battery', 'General Automation'] as const;

/** §60 Equipment template — structure only; station times are entered per scenario. */
export const EquipmentTemplate = z.object({
  ...baseShape,
  entity: z.literal('equipment_template'),
  code: z.string(),
  group: z.enum(TEMPLATE_GROUPS),
  domain_id: ref.optional(),
  application: z.string(),
  process: z.string().optional(),
  stations: z.array(Station).min(1),
  has_laser_chain: z.boolean().optional(),
  application_ids: refs.optional(),
  product_id: ref.optional(),
});
export type EquipmentTemplate = z.infer<typeof EquipmentTemplate>;

export const Selection = z.object({ station_key: z.string(), role: z.string(), part_id: ref, quantity: z.number().int().positive().optional() });
export type Selection = z.infer<typeof Selection>;

export const FaultCase = z.object({
  key: z.string(),
  name: z.string(),
  station_key: z.string(),
  /** simulated minutes into the run when the fault starts, and its duration */
  at_min: z.number().nonnegative(),
  duration_min: z.number().positive(),
});
export type FaultCase = z.infer<typeof FaultCase>;

export const Actual = z.object({
  metric: z.string(),
  predicted: z.number().nullable(),
  actual: z.number(),
  unit: z.string(),
  date: IsoDate,
  equipment_version: z.string().optional(),
  simulation_version: z.string().optional(),
  poc_id: ref.optional(),
  source_id: ref.optional(),
  note: z.string().optional(),
});
export type Actual = z.infer<typeof Actual>;

/* ============================================================ 3D digital twin inputs (3D master prompt) */

/*
 * The 3D machine is a REPRESENTATION of the scenario (§176): these fields hold only the engineering
 * inputs the 3D model and motion need that a station does not already carry. Geometry is generated
 * from stations + selected components; nothing important lives only in the scene.
 */
export const WORKPIECE_TEMPLATES = ['pcb', 'plate', 'battery_tab', 'battery_can', 'wafer', 'metal_part'] as const;
export const TWIN_MODEL_MATURITY = ['Procedural', 'Imported', 'Engineering Reviewed', 'CAD Linked', 'Released'] as const;
export const TWIN_SIM_MATURITY = ['Conceptual', 'Configured', 'Engineering Reviewed', 'POC Calibrated', 'Validated'] as const;
export const SAFETY_ZONE_TYPES = ['operator', 'robot', 'laser', 'maintenance', 'restricted'] as const;

/** §17 Axis model inputs. Speed / acceleration come from the linked part's specification when not entered. */
export const TwinAxis = z.object({
  key: z.string().regex(/^[a-z0-9_-]+$/),
  name: z.string(),
  type: z.enum(['linear', 'rotary']),
  station_key: z.string(),
  /** the stage / motor this axis is (speed, acceleration and travel are read from it when not entered) */
  part_id: ref.optional(),
  stroke_mm: z.number().positive().nullable().optional(),
  home_mm: z.number().optional(),
  speed_mm_s: z.number().positive().nullable().optional(),
  accel_mm_s2: z.number().positive().nullable().optional(),
  decel_mm_s2: z.number().positive().nullable().optional(),
  /** jerk limit (S-curve); when absent the profile is trapezoidal */
  jerk_mm_s3: z.number().positive().nullable().optional(),
  /** in-position settling time after each move; when absent it is NOT included (stated, never assumed) */
  settle_ms: z.number().nonnegative().nullable().optional(),
  basis: z.enum(BASES).optional(),
});
export type TwinAxis = z.infer<typeof TwinAxis>;

/** A move executed once per part at a station: simultaneous axis targets (absolute positions, mm). */
export const TwinMove = z.object({ station_key: z.string(), label: z.string().optional(), targets: z.record(z.string(), z.number()) });
export type TwinMove = z.infer<typeof TwinMove>;

export const TwinSnapshot = z.object({
  id: z.string(),
  name: z.string(),
  at: z.string(),
  view: z.string(),
  camera: z.object({ position: z.array(z.number()).length(3), target: z.array(z.number()).length(3), ortho: z.boolean().optional() }),
  layers: z.array(z.string()),
  selected: z.string().optional(),
  t_s: z.number().nonnegative(),
});
export type TwinSnapshot = z.infer<typeof TwinSnapshot>;

/** §77 / §165 recorded run — inputs + summary; events are regenerated deterministically from the seed. */
export const TwinRun = z.object({
  id: z.string(),
  at: z.string(),
  seed: z.number().int(),
  horizon_s: z.number().positive(),
  model_version: z.string(),
  twin_version: z.string(),
  equipment_version: z.number().int().optional(),
  faults: z.array(z.string()),
  results: z.object({ ok: z.number(), ng: z.number(), uph: z.number(), collisions: z.number(), alarms: z.number() }),
  assumptions: z.array(z.object({ name: z.string(), value: z.string(), unit: z.string().optional(), basis: z.string() })),
  note: z.string().optional(),
});
export type TwinRun = z.infer<typeof TwinRun>;

export const TwinInputs = z.object({
  model_maturity: z.enum(TWIN_MODEL_MATURITY).optional(),
  sim_maturity: z.enum(TWIN_SIM_MATURITY).optional(),
  workpiece: z
    .object({ template: z.enum(WORKPIECE_TEMPLATES), length_mm: z.number().positive(), width_mm: z.number().positive(), thickness_mm: z.number().positive(), material: z.string().optional(), basis: z.enum(BASES).optional() })
    .optional(),
  /** required process area on the part (marking field / weld path extent) */
  process_area: z.object({ x_mm: z.number().positive(), y_mm: z.number().positive(), requirement_id: ref.optional() }).optional(),
  axes: z.array(TwinAxis).optional(),
  moves: z.array(TwinMove).optional(),
  /** per vision station: working distance and the target area the camera must see */
  vision: z.record(z.string(), z.object({ wd_mm: z.number().positive().nullable().optional(), target_x_mm: z.number().positive().nullable().optional(), target_y_mm: z.number().positive().nullable().optional() })).optional(),
  /** manual layout overrides for auto-placed objects (§13) */
  overrides: z.record(z.string(), z.object({ x_mm: z.number().optional(), z_mm: z.number().optional(), hidden: z.boolean().optional() })).optional(),
  zones: z.array(z.object({ key: z.string(), name: z.string(), type: z.enum(SAFETY_ZONE_TYPES), enabled: z.boolean(), rule: z.string().optional() })).optional(),
  snapshots: z.array(TwinSnapshot).optional(),
  runs: z.array(TwinRun).optional(),
  /**
   * Inline part transfer between stations (conveyor / shuttle). Time = distance ÷ speed (trapezoidal when
   * an acceleration is given). Speed falls back to the selected conveyor's stated max speed. When the
   * distance is not entered the transfer time is not included and the Studio says so.
   */
  transfer: z
    .object({ distance_mm: z.number().positive().nullable().optional(), speed_mm_s: z.number().positive().nullable().optional(), accel_mm_s2: z.number().positive().nullable().optional(), basis: z.enum(BASES).optional() })
    .optional(),
  /** §107 conceptual factory placement of machines (this and other scenarios) */
  factory: z.array(z.object({ id: z.string(), sim_id: ref, x_mm: z.number(), z_mm: z.number(), rot_deg: z.number() })).optional(),
});
export type TwinInputs = z.infer<typeof TwinInputs>;

/**
 * §59 Simulation scenario = an equipment configuration + its simulation inputs. A customer or
 * project configuration is its own record (parent_id → the base), so it never overwrites the base
 * (§143). Versions chain via parent_id; `version` counts them (§134, §144).
 */
export const Simulation = z.object({
  ...baseShape,
  entity: z.literal('simulation'),
  template_id: ref.optional(),
  parent_id: ref.optional(),
  config_level: z.enum(['Base Product', 'Product Variant', 'Equipment Variant', 'Customer Configuration', 'Project Configuration']).optional(),
  change_reason: z.string().optional(),
  scenario_label: z.string().optional(),
  sim_status: z.enum(['Draft', 'In Review', 'Baselined', 'Archived']),
  customer_id: ref.optional(),
  opportunity_id: ref.optional(),
  project_id: ref.optional(),
  poc_id: ref.optional(),
  application_id: ref.optional(),
  material_id: ref.optional(),
  product_id: ref.optional(),
  requirement_ids: refs.optional(),
  recipe_id: ref.optional(),
  /** inline = stations work concurrently (line); sequential = one part in the machine at a time */
  layout: z.enum(['inline', 'sequential']).optional(),
  stations: z.array(Station).min(1),
  selections: z.array(Selection).optional(),
  targets: z
    .object({
      uph: z.number().positive().nullable().optional(),
      cycle_s: z.number().positive().nullable().optional(),
      annual_units: z.number().positive().nullable().optional(),
      capex_budget: z.number().positive().nullable().optional(),
      footprint_m2: z.number().positive().nullable().optional(),
      localization_pct: z.number().min(0).max(100).nullable().optional(),
    })
    .optional(),
  shift: z
    .object({
      hours_per_shift: z.number().positive().max(24),
      shifts_per_day: z.number().int().positive().max(4),
      days_per_year: z.number().int().positive().max(366),
      planned_downtime_min_per_shift: z.number().nonnegative().optional(),
    })
    .optional(),
  /** OEE factors entered as assumptions (0–1); availability may instead be derived from MTBF/MTTR */
  oee: z.object({ availability: z.number().min(0).max(1).nullable().optional(), performance: z.number().min(0).max(1).nullable().optional(), quality: z.number().min(0).max(1).nullable().optional() }).optional(),
  currency: z.enum(['INR', 'USD', 'EUR', 'JPY', 'GBP', 'CNY']).optional(),
  required_protocols: z.array(z.string()).optional(),
  faults: z.array(FaultCase).optional(),
  maintenance: z.object({ pm_interval_h: z.number().positive().nullable().optional(), pm_duration_min: z.number().nonnegative().nullable().optional(), calibration_interval_h: z.number().positive().nullable().optional(), calibration_duration_min: z.number().nonnegative().nullable().optional() }).optional(),
  energy: z.object({ tariff_per_kwh: z.number().nonnegative().nullable().optional(), compressed_air_kw: z.number().nonnegative().nullable().optional(), idle_fraction: z.number().min(0).max(1).nullable().optional() }).optional(),
  sequence: z.array(z.object({ key: z.string(), name: z.string(), kind: z.enum(['start', 'check', 'action', 'decision', 'end']), sensor: z.string().optional(), actuator: z.string().optional(), timer_s: z.number().nonnegative().optional(), interlock: z.string().optional(), alarm: z.string().optional(), condition: z.string().optional() })).optional(),
  actuals: z.array(Actual).optional(),
  /** cost roll-up inputs (§94) — not entered = not included, never guessed */
  cost: z
    .object({
      integration_pct: z.number().min(0).max(200).nullable().optional(),
      testing_pct: z.number().min(0).max(200).nullable().optional(),
      shipping_pct: z.number().min(0).max(200).nullable().optional(),
      duty_pct: z.number().min(0).max(200).nullable().optional(),
      installation: z.number().nonnegative().nullable().optional(),
      life_years: z.number().positive().nullable().optional(),
    })
    .optional(),
  /** §147 equipment readiness per dimension and §148 TRL — entered by the team, never computed */
  readiness: z.record(z.string(), z.enum(READINESS_STATUSES)).optional(),
  trl: z.number().int().min(1).max(9).nullable().optional(),
  customer_visible_notes: z.string().optional(),
  twin: TwinInputs.optional(),
});
export type Simulation = z.infer<typeof Simulation>;

/** §81 Process recipe. */
export const Recipe = z.object({
  ...baseShape,
  entity: z.literal('recipe'),
  simulation_id: ref.optional(),
  product_id: ref.optional(),
  application_id: ref.optional(),
  material_id: ref.optional(),
  recipe_version: z.string(),
  parameters: z.array(z.object({ name: z.string(), value: z.string(), unit: z.string().optional() })),
  quality_criteria: z.array(z.string()).optional(),
  acceptance_criteria: z.array(z.string()).optional(),
  recipe_status: z.enum(['Draft', 'Trial', 'Validated', 'Released', 'Obsolete']),
  poc_id: ref.optional(),
  verification_ids: refs.optional(),
});
export type Recipe = z.infer<typeof Recipe>;

/** §88/§89 Verification (inspection, analysis, demonstration, test) or validation record. */
export const Verification = z.object({
  ...baseShape,
  entity: z.literal('verification'),
  kind: z.enum(['Verification', 'Validation']),
  requirement_id: ref,
  method: z.enum(['Inspection', 'Analysis', 'Demonstration', 'Test']),
  expected: z.string().optional(),
  actual: z.string().optional(),
  unit: z.string().optional(),
  result: z.enum(['NOT RUN', 'PASS', 'FAIL', 'PASS WITH DEVIATION']),
  evidence: z.string().optional(),
  simulation_id: ref.optional(),
  machine_id: ref.optional(),
  poc_id: ref.optional(),
  recipe_id: ref.optional(),
  customer_id: ref.optional(),
  application_id: ref.optional(),
  material_id: ref.optional(),
  environment: z.string().optional(),
  tester: z.string().optional(),
  date: IsoDate.optional(),
  calibration: z.string().optional(),
  approved_by: z.string().optional(),
  approved_at: IsoDate.optional(),
});
export type Verification = z.infer<typeof Verification>;

/* ================================================================ quality (§99) */

export const QUALITY_KINDS = ['NCR', 'CAPA', '8D', 'Control Plan', 'Inspection Plan'] as const;
export const QUALITY_STATUSES = ['Open', 'Containment', 'Root cause', 'Corrective action', 'Verification', 'Closed'] as const;

/** NCR, CAPA, 8D, control plan and inspection plan — linked to equipment, components and requirements. */
export const QualityRecord = z.object({
  ...baseShape,
  entity: z.literal('quality_record'),
  kind: z.enum(QUALITY_KINDS),
  qr_status: z.enum(QUALITY_STATUSES),
  simulation_id: ref.optional(),
  machine_id: ref.optional(),
  part_id: ref.optional(),
  project_id: ref.optional(),
  customer_id: ref.optional(),
  requirement_ids: refs.optional(),
  problem: z.string().optional(),
  containment: z.string().optional(),
  root_cause: z.string().optional(),
  corrective_action: z.string().optional(),
  preventive_action: z.string().optional(),
  verification: z.string().optional(),
  /** control / inspection plan: characteristic — method — frequency — reaction, one per line */
  characteristics: z.array(z.string()).optional(),
  due: IsoDate.optional(),
});
export type QualityRecord = z.infer<typeof QualityRecord>;
