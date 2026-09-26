import * as E from '../../domain/entities';

/*
 * Schema-driven UI definitions (the pattern the legacy PM Tracker used in schema.js):
 * each entity declares its list columns and form fields; one generic list/detail/form renders
 * them. Complex nested structures (BOM lines, cost lines, DOE runs, gates, tasks, tests) have
 * dedicated editors and are shown read-only in the generic form.
 */
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'ref' | 'refs' | 'tags' | 'lines' | 'bool';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: readonly string[];
  entity?: string;
  required?: boolean;
  hint?: string;
  span?: 2;
}

export interface EntityUi {
  columns: { key: string; label: string; kind?: 'status' | 'date' | 'ref' | 'num' | 'money' | 'list' }[];
  fields: FieldDef[];
  /** default values for a new record (besides id/entity/name/data_type/provenance) */
  defaults?: Record<string, unknown>;
  readOnly?: boolean;
  intro?: string;
}

const t = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'text', ...extra });
const ta = (key: string, label: string): FieldDef => ({ key, label, type: 'textarea', span: 2 });
const sel = (key: string, label: string, options: readonly string[], extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'select', options, ...extra });
const ref = (key: string, label: string, entity: string): FieldDef => ({ key, label, type: 'ref', entity });
const refs = (key: string, label: string, entity: string): FieldDef => ({ key, label, type: 'refs', entity });
const num = (key: string, label: string, hint?: string): FieldDef => ({ key, label, type: 'number', hint });
const date = (key: string, label: string): FieldDef => ({ key, label, type: 'date' });
const lines = (key: string, label: string, hint?: string): FieldDef => ({ key, label, type: 'lines', span: 2, hint });

export const ENTITY_UI: Record<string, EntityUi> = {
  company: {
    columns: [{ key: 'roles', label: 'Roles', kind: 'list' }, { key: 'country', label: 'Country' }, { key: 'technologies', label: 'Technologies', kind: 'list' }],
    fields: [t('legal_name', 'Legal name'), t('brand', 'Brand'), t('country', 'Country'), t('headquarters', 'Headquarters'), t('parent', 'Parent'), { key: 'roles', label: 'Roles', type: 'tags', hint: `One of: ${E.COMPANY_ROLES.join(', ')}` }, lines('industries', 'Industries'), lines('technologies', 'Technologies'), t('india_presence', 'India presence'), t('website', 'Website'), ta('description', 'Description')],
    defaults: { roles: [] },
  },
  customer: {
    columns: [{ key: 'industry', label: 'Industry' }, { key: 'segment', label: 'Segment' }, { key: 'location', label: 'Location' }],
    fields: [ref('company_id', 'Company', 'company'), t('industry', 'Industry'), t('segment', 'Segment'), t('location', 'Location'), lines('sites', 'Sites'), refs('application_ids', 'Applications', 'application'), ta('description', 'Notes')],
  },
  opportunity: {
    columns: [{ key: 'stage', label: 'Stage', kind: 'status' }, { key: 'customer_id', label: 'Customer', kind: 'ref' }, { key: 'value', label: 'Value', kind: 'money' }, { key: 'probability', label: 'Prob. %', kind: 'num' }],
    fields: [ref('customer_id', 'Customer', 'customer'), sel('stage', 'Stage', E.OPPORTUNITY_STAGES, { required: true }), num('value', 'Value', 'Leave empty if unknown — never estimate silently'), sel('currency', 'Currency', E.Currency.options), t('volume', 'Volume'), num('probability', 'Probability (%)'), t('technical_status', 'Technical status'), t('commercial_status', 'Commercial status'), t('competitor', 'Competitor'), ref('application_id', 'Application', 'application'), ref('product_id', 'Product', 'product'), ref('configuration_id', 'Configuration', 'configuration'), t('industry', 'Industry'), ta('inquiry_text', 'Customer inquiry')],
    defaults: { stage: 'Lead', value: null, probability: null },
  },
  activity: {
    columns: [{ key: 'kind', label: 'Kind' }, { key: 'status', label: 'Status', kind: 'status' }, { key: 'priority', label: 'Priority', kind: 'status' }, { key: 'due_date', label: 'Due', kind: 'date' }, { key: 'customer_id', label: 'Customer', kind: 'ref' }],
    fields: [sel('kind', 'Kind', E.ACTIVITY_KINDS, { required: true }), sel('status', 'Status', E.ACTIVITY_STATUSES, { required: true }), sel('priority', 'Priority', E.PRIORITIES, { required: true }), date('due_date', 'Due date'), date('follow_up_date', 'Follow-up date'), ref('customer_id', 'Customer', 'customer'), ref('opportunity_id', 'Opportunity', 'opportunity'), ref('product_id', 'Product', 'product'), ref('project_id', 'Project', 'project'), ref('poc_id', 'POC', 'poc'), ref('supplier_id', 'Supplier', 'supplier'), t('workstream', 'Workstream'), t('blocker', 'Blocker'), t('attendees', 'Attendees'), ta('minutes', 'Minutes / notes'), ta('description', 'Description')],
    defaults: { kind: 'task', status: 'Not Started', priority: 'Medium' },
  },
  requirement: {
    columns: [{ key: 'code', label: 'Code' }, { key: 'level', label: 'Level' }, { key: 'category', label: 'Category' }, { key: 'priority', label: 'Priority', kind: 'status' }, { key: 'verification_method', label: 'Verify by' }, { key: 'acceptance_criterion', label: 'Acceptance' }],
    fields: [t('code', 'ID / code', { required: true }), sel('level', 'Level', E.REQUIREMENT_LEVELS), sel('category', 'Type', E.REQUIREMENT_CATEGORIES), t('value', 'Value'), t('unit', 'Unit'), t('condition', 'Condition'), sel('priority', 'Priority', ['Must', 'Should', 'Could']), sel('verification_method', 'Verification method', E.VERIFICATION_METHODS), t('acceptance_criterion', 'Acceptance criterion', { span: 2 }), t('status', 'Status'), ref('parent_id', 'Parent requirement', 'requirement'), ref('opportunity_id', 'Opportunity', 'opportunity'), ref('project_id', 'Project', 'project'), ref('product_id', 'Product', 'product'), ta('source', 'Source (customer statement)')],
    defaults: { level: 'URS', category: 'Functional', priority: 'Must', code: 'URS-' },
  },
  application: {
    columns: [{ key: 'process', label: 'Process' }, { key: 'industries', label: 'Industries', kind: 'list' }, { key: 'product_id', label: 'Platform', kind: 'ref' }, { key: 'recommended_source_id', label: 'Source', kind: 'ref' }],
    fields: [sel('process', 'Process', E.PROCESSES, { required: true }), lines('industries', 'Industries'), ref('product_id', 'Platform', 'product'), refs('material_ids', 'Materials', 'material'), ref('recommended_source_id', 'Recommended source', 'laser_source'), num('recommended_power_w', 'Recommended power (W)'), ta('rationale', 'Engineering rationale'), ta('description', 'Description')],
    defaults: { process: 'Marking', industries: [] },
  },
  material: {
    columns: [{ key: 'category', label: 'Category' }, { key: 'thermal_conductivity', label: 'k W/(m·K)', kind: 'num' }, { key: 'melting_point', label: 'Tm °C', kind: 'num' }],
    fields: [t('category', 'Category')],
    readOnly: true,
    intro: 'Material properties are carried with their provenance. Values the OS does not hold are UNKNOWN — they are never estimated.',
  },
  laser_source: {
    columns: [{ key: 'categories', label: 'Categories', kind: 'list' }, { key: 'wavelength', label: 'λ nm', kind: 'num' }, { key: 'mode', label: 'Mode' }, { key: 'm2', label: 'M²', kind: 'num' }, { key: 'manufacturer', label: 'Manufacturer' }],
    fields: [sel('kind', 'Kind', ['class', 'product']), t('manufacturer', 'Manufacturer'), t('model', 'Model'), t('family', 'Family'), sel('mode', 'Mode', ['cw', 'pulsed']), num('m2', 'M²'), num('beam_diameter_mm', 'Beam diameter at lens (mm)'), t('cooling', 'Cooling'), t('interface', 'Interface'), t('datasheet_url', 'Datasheet URL'), ta('description', 'Description')],
    defaults: { kind: 'product', categories: [], mode: 'pulsed', wavelength: { value: null, unit: 'nm' }, m2: null, beam_diameter_mm: null },
  },
  optic: {
    columns: [{ key: 'optic_type', label: 'Type' }, { key: 'focal_length_mm', label: 'f mm', kind: 'num' }, { key: 'scan_field_mm', label: 'Field mm', kind: 'num' }, { key: 'manufacturer', label: 'Manufacturer' }],
    fields: [sel('optic_type', 'Type', E.OPTIC_TYPES), t('manufacturer', 'Manufacturer'), t('model', 'Model'), num('focal_length_mm', 'Focal length (mm)'), num('scan_field_mm', 'Scan field (mm)'), num('aperture_mm', 'Aperture (mm)'), t('coating', 'Coating'), t('wavelength_range', 'Wavelength range')],
    defaults: { optic_type: 'f_theta', focal_length_mm: null },
  },
  galvo: {
    columns: [{ key: 'manufacturer', label: 'Manufacturer' }, { key: 'model', label: 'Model' }, { key: 'aperture_mm', label: 'Aperture mm', kind: 'num' }],
    fields: [t('manufacturer', 'Manufacturer'), t('model', 'Model'), num('aperture_mm', 'Aperture (mm)'), num('scan_angle_deg', 'Scan angle (°)'), t('interface', 'Interface'), refs('compatible_optic_ids', 'Compatible optics', 'optic')],
  },
  module: {
    columns: [{ key: 'group', label: 'Group' }, { key: 'kind', label: 'Kind' }, { key: 'price_estimate_inr', label: 'List est. ₹', kind: 'money' }],
    fields: [t('key', 'Key', { required: true }), sel('kind', 'Kind', E.MODULE_KINDS), t('group', 'Group'), t('module_type', 'Type'), num('price_estimate_inr', 'List price estimate (INR)'), t('module_version', 'Version'), lines('mechanical_interfaces', 'Mechanical interfaces'), lines('electrical_interfaces', 'Electrical interfaces'), lines('communication', 'Communication'), lines('utilities', 'Utilities'), t('dimensions', 'Dimensions'), t('payload', 'Payload'), t('accuracy', 'Accuracy'), t('cycle_time', 'Cycle time'), refs('supplier_ids', 'Suppliers', 'supplier'), refs('alternate_supplier_ids', 'Alternate suppliers', 'supplier'), refs('dependencies', 'Dependencies', 'module'), t('approval', 'Approval'), ta('description', 'Description')],
    defaults: { kind: 'automation', group: 'Handling & flow', price_estimate_inr: null },
  },
  product: {
    columns: [{ key: 'family_id', label: 'Family', kind: 'ref' }, { key: 'code', label: 'Code' }, { key: 'delivery', label: 'Delivery' }, { key: 'base_price_inr', label: 'Base est. ₹', kind: 'money' }, { key: 'maturity', label: 'Maturity', kind: 'status' }],
    fields: [sel('maturity', 'Maturity', E.MATURITY_STAGES), t('tagline', 'Tagline', { span: 2 }), num('lead_time_weeks', 'Lead time (weeks)'), num('warranty_months', 'Warranty (months)'), ta('description', 'Description')],
    readOnly: true,
    intro: 'TEAL platforms from the 2026 catalogue. New products start as a configuration (Configurator 2.0) or from a customer inquiry; platform definitions change through a reviewed data commit.',
  },
  configuration: { columns: [{ key: 'product_id', label: 'Platform', kind: 'ref' }, { key: 'designation', label: 'Designation' }, { key: 'opportunity_id', label: 'Opportunity', kind: 'ref' }], fields: [ref('opportunity_id', 'Opportunity', 'opportunity'), ref('customer_id', 'Customer', 'customer'), ta('description', 'Notes')] },
  bom: { columns: [{ key: 'bom_type', label: 'Type' }, { key: 'revision', label: 'Rev' }, { key: 'product_id', label: 'Product', kind: 'ref' }], fields: [sel('bom_type', 'Type', E.BOM_TYPES), t('revision', 'Revision'), ref('product_id', 'Product', 'product'), ref('configuration_id', 'Configuration', 'configuration'), ref('project_id', 'Project', 'project')], defaults: { bom_type: 'EBOM', revision: 'A', lines: [] } },
  component: { columns: [{ key: 'code', label: 'Code' }, { key: 'category', label: 'Category' }, { key: 'price', label: 'Price', kind: 'num' }, { key: 'currency', label: 'Cur' }, { key: 'vendor', label: 'Vendor' }], fields: [t('code', 'Code', { required: true }), t('spec', 'Specification', { span: 2 }), t('category', 'Category'), t('item_class', 'Class'), t('uom', 'UOM'), num('price', 'Price'), sel('currency', 'Currency', E.Currency.options), sel('price_basis', 'Price basis', E.COST_BASIS), t('vendor', 'Vendor'), num('lead_time_weeks', 'Lead time (weeks)'), date('price_date', 'Price date')], defaults: { category: 'General', item_class: 'Standard Component', uom: 'no', price: null, currency: 'INR', price_basis: 'UNKNOWN' } },
  cost_model: {
    columns: [{ key: 'scenario', label: 'Scenario' }, { key: 'currency', label: 'Cur' }, { key: 'qty', label: 'Qty', kind: 'num' }],
    fields: [t('scenario', 'Scenario'), num('qty', 'Quantity'), ref('opportunity_id', 'Opportunity', 'opportunity'), ref('project_id', 'Project', 'project'), ref('bom_id', 'BOM', 'bom'), ref('configuration_id', 'Configuration', 'configuration'), ref('product_id', 'Product', 'product')],
    defaults: { currency: 'INR', qty: 1, lines: {}, landed: { freightPct: 2, dutyPct: 0, landingPct: 1.5, gstPct: 18, siteContPct: 8 }, markup: { overheadPct: 14, contingencyPct: 3, profitPct: 18 }, scenario: 'Base' },
  },
  poc: {
    columns: [{ key: 'poc_status', label: 'Status', kind: 'status' }, { key: 'decision', label: 'Decision', kind: 'status' }, { key: 'customer_id', label: 'Customer', kind: 'ref' }, { key: 'material_id', label: 'Material', kind: 'ref' }],
    fields: [sel('poc_status', 'Status', E.POC_STATUSES), sel('decision', 'Decision', E.POC_DECISIONS), ta('objective', 'Objective'), ref('customer_id', 'Customer', 'customer'), ref('opportunity_id', 'Opportunity', 'opportunity'), ref('application_id', 'Application', 'application'), ref('product_id', 'Product', 'product'), t('part', 'Part'), ref('material_id', 'Material', 'material'), t('lot', 'Lot'), ref('source_id', 'Laser source', 'laser_source'), num('power_w', 'Power (W)'), ref('optic_id', 'Optic', 'optic'), ref('doe_id', 'DOE', 'doe'), num('cycle_time_s', 'Measured cycle time (s)'), t('quality', 'Quality'), t('defects', 'Defects'), ta('conclusion', 'Conclusion'), lines('open_questions', 'Open questions'), lines('images', 'Image file names')],
    defaults: { poc_status: 'Planned', decision: 'Undecided', objective: '' },
  },
  doe: { columns: [{ key: 'poc_id', label: 'POC', kind: 'ref' }, { key: 'replicates', label: 'Replicates', kind: 'num' }], fields: [ref('poc_id', 'POC', 'poc'), lines('constraints', 'Constraints'), lines('noise_factors', 'Noise factors')], defaults: { design: 'full_factorial', factors: [], responses: [], replicates: 1, runs: [] } },
  project: { columns: [{ key: 'customer_id', label: 'Customer', kind: 'ref' }, { key: 'start', label: 'Start', kind: 'date' }, { key: 'end', label: 'End', kind: 'date' }], fields: [ref('customer_id', 'Customer', 'customer'), ref('opportunity_id', 'Opportunity', 'opportunity'), ref('product_id', 'Product', 'product'), ref('configuration_id', 'Configuration', 'configuration'), ref('bom_id', 'BOM', 'bom'), ref('cost_model_id', 'Cost model', 'cost_model'), date('start', 'Start'), date('end', 'End'), num('budget', 'Budget'), sel('currency', 'Currency', E.Currency.options), ta('scope', 'Scope')], defaults: { tasks: [], gates: [] } },
  risk: {
    columns: [{ key: 'kind', label: 'Kind' }, { key: 'severity', label: 'S', kind: 'num' }, { key: 'occurrence', label: 'O', kind: 'num' }, { key: 'detection', label: 'D', kind: 'num' }, { key: 'risk_status', label: 'Status', kind: 'status' }],
    fields: [sel('kind', 'Kind', E.RISK_KINDS), sel('risk_status', 'Status', ['Open', 'Mitigating', 'Closed', 'Accepted']), t('failure_mode', 'Failure mode', { span: 2 }), t('cause', 'Cause', { span: 2 }), t('effect', 'Effect', { span: 2 }), num('severity', 'Severity (1–10)'), num('occurrence', 'Occurrence (1–10)'), num('detection', 'Detection (1–10)'), t('action', 'Action', { span: 2 }), date('due_date', 'Due date'), ref('project_id', 'Project', 'project'), ref('product_id', 'Product', 'product'), ref('opportunity_id', 'Opportunity', 'opportunity'), ref('module_id', 'Module', 'module')],
    defaults: { kind: 'Risk', risk_status: 'Open', severity: null, occurrence: null, detection: null },
  },
  supplier: {
    columns: [{ key: 'category', label: 'Category' }, { key: 'country', label: 'Country' }, { key: 'typical_lead_time', label: 'Lead time' }, { key: 'supplier_risk', label: 'Risk', kind: 'status' }],
    fields: [ref('company_id', 'Company', 'company'), t('country', 'Country'), t('category', 'Category'), lines('capabilities', 'Capabilities'), lines('products', 'Products'), t('typical_lead_time', 'Typical lead time'), t('moq', 'MOQ'), t('payment_terms', 'Payment terms'), lines('certifications', 'Certifications'), t('india_presence', 'India presence'), t('service', 'Service'), sel('supplier_risk', 'Risk', ['Low', 'Medium', 'High', 'Unknown']), refs('alternate_ids', 'Alternates', 'supplier')],
    defaults: { supplier_risk: 'Unknown' },
  },
  rfq: { columns: [{ key: 'rfq_status', label: 'Status', kind: 'status' }, { key: 'bom_id', label: 'BOM', kind: 'ref' }], fields: [sel('rfq_status', 'Status', ['Draft', 'Issued', 'Quotes Received', 'Evaluated', 'Awarded', 'Cancelled']), ref('bom_id', 'BOM', 'bom'), ref('project_id', 'Project', 'project'), ta('commercial_terms', 'Commercial terms'), t('approval', 'Approval')], defaults: { rfq_status: 'Draft', supplier_ids: [], items: [], quotes: [] } },
  acceptance: { columns: [{ key: 'phase', label: 'Phase' }, { key: 'project_id', label: 'Project', kind: 'ref' }, { key: 'approved_on', label: 'Approved', kind: 'date' }], fields: [sel('phase', 'Phase', ['FAT', 'SAT']), ref('project_id', 'Project', 'project'), ref('machine_id', 'Machine', 'machine'), t('approval', 'Approval'), date('approved_on', 'Approved on')], defaults: { phase: 'FAT', tests: [] } },
  machine: { columns: [{ key: 'serial', label: 'Serial' }, { key: 'customer_id', label: 'Customer', kind: 'ref' }, { key: 'product_id', label: 'Product', kind: 'ref' }, { key: 'warranty_until', label: 'Warranty', kind: 'date' }], fields: [t('serial', 'Serial', { required: true }), ref('customer_id', 'Customer', 'customer'), t('site', 'Site'), ref('product_id', 'Product', 'product'), ref('configuration_id', 'Configuration', 'configuration'), ref('project_id', 'Project', 'project'), t('bom_revision', 'BOM revision'), t('software_version', 'Software version'), t('plc_version', 'PLC version'), date('commissioned_on', 'Commissioned'), date('warranty_until', 'Warranty until'), t('amc', 'AMC')], defaults: { serial: '' } },
  service_ticket: { columns: [{ key: 'ticket_status', label: 'Status', kind: 'status' }, { key: 'machine_id', label: 'Machine', kind: 'ref' }, { key: 'downtime_h', label: 'Downtime h', kind: 'num' }, { key: 'opened_on', label: 'Opened', kind: 'date' }], fields: [ref('machine_id', 'Machine', 'machine'), sel('ticket_status', 'Status', ['Open', 'In Progress', 'Resolved', 'Closed']), t('issue', 'Issue', { span: 2, required: true }), t('alarm', 'Alarm'), t('root_cause', 'Root cause', { span: 2 }), t('action', 'Action', { span: 2 }), t('spare', 'Spare'), t('technician', 'Technician'), num('downtime_h', 'Downtime (h)'), date('opened_on', 'Opened'), date('resolved_on', 'Resolved')], defaults: { ticket_status: 'Open', issue: '' } },
  lesson: { columns: [{ key: 'category', label: 'Category' }, { key: 'product_id', label: 'Product', kind: 'ref' }, { key: 'project_id', label: 'Project', kind: 'ref' }], fields: [sel('category', 'Category', ['Design', 'Process', 'Supplier', 'Cost', 'Schedule', 'Quality', 'Service', 'Other']), ta('what_worked', 'What worked?'), ta('what_failed', 'What failed?'), ta('why', 'Why?'), ta('corrective_action', 'Corrective action'), ta('design_rule', 'Design rule'), ref('product_id', 'Product', 'product'), ref('module_id', 'Module', 'module'), ref('supplier_id', 'Supplier', 'supplier'), ref('project_id', 'Project', 'project'), ref('customer_id', 'Customer', 'customer')], defaults: { category: 'Design' } },
  technology: { columns: [{ key: 'domain', label: 'Domain' }, { key: 'adoption', label: 'Ring', kind: 'status' }, { key: 'radar_status', label: 'Maturity' }], fields: [t('domain', 'Domain'), sel('adoption', 'TEAL radar ring (team decision)', E.TECH_ADOPTION), ta('adoption_rationale', 'Why this ring? (required when a ring is set)'), date('adoption_reviewed', 'Ring reviewed on'), sel('radar_status', 'Market maturity (requires evidence)', ['', ...E.TECH_STATUSES]), refs('evidence_ids', 'Evidence', 'evidence')], defaults: { domain: 'Laser', radar_status: null } },
  decision: { columns: [{ key: 'decided_on', label: 'Decided', kind: 'date' }, { key: 'approver', label: 'Approver' }], fields: [ta('question', 'Question'), ta('context', 'Context'), lines('options', 'Options'), lines('criteria', 'Criteria'), lines('constraints', 'Constraints'), refs('evidence_ids', 'Evidence', 'evidence'), ta('decision', 'Decision'), t('approver', 'Approver'), date('decided_on', 'Date'), num('revision', 'Revision')], defaults: { question: '', options: [] } },
  change_request: { columns: [{ key: 'change_type', label: 'Type' }, { key: 'cr_status', label: 'Status', kind: 'status' }], fields: [sel('change_type', 'Type', ['ECR', 'ECN']), sel('cr_status', 'Status', ['Draft', 'Submitted', 'Approved', 'Rejected', 'Implemented', 'Verified']), ta('reason', 'Reason'), ta('impact', 'Impact analysis (BOM, documents, software, requirements, tests)'), refs('affected_ids', 'Affected records', '*')], defaults: { change_type: 'ECR', cr_status: 'Draft', reason: '' } },
  localization: { columns: [{ key: 'imported_component', label: 'Imported component' }, { key: 'indian_alternative', label: 'Indian alternative' }, { key: 'classification', label: 'Class', kind: 'status' }, { key: 'current_cost', label: 'Current', kind: 'money' }, { key: 'localized_cost', label: 'Localized', kind: 'money' }], fields: [t('imported_component', 'Imported component', { required: true }), t('indian_alternative', 'Indian alternative'), ref('supplier_id', 'Supplier', 'supplier'), num('current_cost', 'Current (landed) cost'), num('localized_cost', 'Localized cost'), sel('currency', 'Currency', E.Currency.options), t('lead_time', 'Lead time'), t('technology_gap', 'Technology gap', { span: 2 }), sel('classification', 'Classification', ['LOCALIZE', 'PARTNER', 'BUY', 'DEVELOP', 'IMPORT', 'UNDECIDED']), t('stage', 'Stage')], defaults: { classification: 'UNDECIDED', imported_component: '' } },
  evidence: { columns: [{ key: 'entity_id', label: 'About', kind: 'ref' }, { key: 'source_id', label: 'Source', kind: 'ref' }, { key: 'confidence', label: 'Confidence' }], fields: [ta('claim', 'Claim'), ref('entity_id', 'About record', '*'), ref('source_id', 'Source', 'source'), t('source_url', 'Source URL'), t('document', 'Document'), t('page', 'Page'), t('section', 'Section'), ta('excerpt', 'Excerpt (if permitted)'), sel('verification_status', 'Verification', ['VERIFIED', 'SOURCE_DOCUMENTED', 'DRAFT', 'UNKNOWN', 'CONFLICTED', 'STALE']), sel('confidence', 'Confidence', ['HIGH', 'MEDIUM', 'LOW', 'UNKNOWN']), t('reviewer', 'Reviewer'), date('verification_date', 'Verification date')], defaults: { verification_status: 'DRAFT', confidence: 'UNKNOWN', claim: '' } },
  source: { columns: [{ key: 'kind', label: 'Kind' }, { key: 'publisher', label: 'Publisher' }, { key: 'published', label: 'Published' }], fields: [sel('kind', 'Kind', ['handbook', 'legacy_app', 'datasheet', 'web', 'standard', 'internal', 'paper', 'patent', 'dataset']), t('url', 'URL'), t('publisher', 'Publisher'), t('author', 'Author'), t('published', 'Published'), date('retrieved_at', 'Retrieved'), t('terms_note', 'Terms / licence note', { span: 2 })], defaults: { kind: 'datasheet' } },
  standard: { columns: [{ key: 'code', label: 'Code' }, { key: 'scope', label: 'Scope' }], fields: [], readOnly: true },
  industry: { columns: [{ key: 'code', label: 'Code' }], fields: [], readOnly: true },
  semi_step: { columns: [{ key: 'order', label: '#', kind: 'num' }, { key: 'stage', label: 'Stage' }, { key: 'laser_relevance', label: 'Laser relevance' }], fields: [], readOnly: true },
  gate_definition: { columns: [{ key: 'code', label: 'Gate' }, { key: 'responsible', label: 'Responsible' }], fields: [], readOnly: true },
  formula: { columns: [{ key: 'code', label: '#' }, { key: 'discipline', label: 'Discipline' }, { key: 'formula', label: 'Formula' }, { key: 'implemented_by', label: 'In calculator' }], fields: [], readOnly: true },
  rule: { columns: [{ key: 'rule_type', label: 'Type' }, { key: 'why', label: 'Why' }], fields: [], readOnly: true },
  reference: { columns: [{ key: 'table', label: 'Table' }], fields: [], readOnly: true },
  vocabulary: { columns: [{ key: 'key', label: 'Key' }, { key: 'values', label: 'Values', kind: 'list' }], fields: [], readOnly: true },
  product_family: { columns: [{ key: 'segment', label: 'Segment' }, { key: 'chapter', label: 'Chapter' }], fields: [], readOnly: true },
  module_conflict: { columns: [{ key: 'reason', label: 'Reason' }], fields: [], readOnly: true },
};
