import type { z } from 'zod';
import * as E from './entities';

/**
 * Entity registry — the one place that maps an entity type to its schema, id prefix,
 * labels, route and search partition. Scripts (validation, catalog, index, graph) and the UI
 * both read this, so adding an entity is a one-line change here plus a dataset.
 */
export interface EntityDef {
  entity: string;
  schema: z.ZodType;
  prefix: string;
  label: string;
  plural: string;
  route: string;
  partition: SearchPartition;
  /** fields (besides name/description/tags) that feed full-text search */
  searchFields: string[];
  /** the spec says every *active* one of these must show a next action */
  requiresNextAction?: boolean;
}

export const SEARCH_PARTITIONS = [
  'products',
  'companies',
  'suppliers',
  'laser',
  'modules',
  'applications',
  'knowledge',
  'research',
  'patents',
  'records',
] as const;
export type SearchPartition = (typeof SEARCH_PARTITIONS)[number];

const d = (x: EntityDef) => x;

export const ENTITY_DEFS = [
  d({ entity: 'company', schema: E.Company, prefix: 'co', label: 'Company', plural: 'Companies', route: '/companies', partition: 'companies', searchFields: ['country', 'industries', 'technologies'] }),
  d({ entity: 'customer', schema: E.Customer, prefix: 'cus', label: 'Customer', plural: 'Customers', route: '/customers', partition: 'companies', searchFields: ['industry', 'segment', 'location'] }),
  d({ entity: 'opportunity', schema: E.Opportunity, prefix: 'opp', label: 'Opportunity', plural: 'Opportunities', route: '/opportunities', partition: 'records', searchFields: ['stage', 'inquiry_text', 'industry'], requiresNextAction: true }),
  d({ entity: 'activity', schema: E.Activity, prefix: 'act', label: 'Activity', plural: 'Activities', route: '/activities', partition: 'records', searchFields: ['kind', 'status', 'minutes', 'workstream'] }),
  d({ entity: 'requirement', schema: E.Requirement, prefix: 'req', label: 'Requirement', plural: 'Requirements', route: '/requirements', partition: 'records', searchFields: ['code', 'category', 'value', 'acceptance_criterion'], requiresNextAction: true }),
  d({ entity: 'industry', schema: E.Industry, prefix: 'ind', label: 'Industry', plural: 'Industries', route: '/applications', partition: 'applications', searchFields: ['code'] }),
  d({ entity: 'application', schema: E.Application, prefix: 'app', label: 'Application', plural: 'Applications', route: '/applications', partition: 'applications', searchFields: ['process', 'industries', 'rationale'] }),
  d({ entity: 'material', schema: E.Material, prefix: 'mat', label: 'Material', plural: 'Materials', route: '/materials', partition: 'applications', searchFields: ['category'] }),
  d({ entity: 'laser_source', schema: E.LaserSource, prefix: 'las', label: 'Laser source', plural: 'Laser sources', route: '/laser', partition: 'laser', searchFields: ['manufacturer', 'model', 'categories', 'mode', 'family'] }),
  d({ entity: 'optic', schema: E.Optic, prefix: 'opt', label: 'Optic', plural: 'Optics', route: '/optics', partition: 'laser', searchFields: ['optic_type', 'manufacturer', 'model'] }),
  d({ entity: 'galvo', schema: E.Galvo, prefix: 'gal', label: 'Galvo scanner', plural: 'Galvo scanners', route: '/galvo', partition: 'laser', searchFields: ['manufacturer', 'model'] }),
  d({ entity: 'standard', schema: E.Standard, prefix: 'std', label: 'Standard', plural: 'Standards', route: '/knowledge', partition: 'knowledge', searchFields: ['code', 'scope'] }),
  d({ entity: 'module', schema: E.Module, prefix: 'mod', label: 'Module', plural: 'Modules', route: '/modules', partition: 'modules', searchFields: ['group', 'kind', 'module_type'] }),
  d({ entity: 'module_conflict', schema: E.ModuleConflict, prefix: 'mcf', label: 'Module conflict', plural: 'Module conflicts', route: '/modules', partition: 'modules', searchFields: ['reason'] }),
  d({ entity: 'product_family', schema: E.ProductFamily, prefix: 'fam', label: 'Product family', plural: 'Product families', route: '/products', partition: 'products', searchFields: ['segment'] }),
  d({ entity: 'product', schema: E.Product, prefix: 'prd', label: 'Product', plural: 'Products', route: '/products', partition: 'products', searchFields: ['code', 'title', 'tagline', 'industries', 'delivery'], requiresNextAction: false }),
  d({ entity: 'rule', schema: E.RecommendationRule, prefix: 'rul', label: 'Rule', plural: 'Rules', route: '/knowledge', partition: 'knowledge', searchFields: ['why'] }),
  d({ entity: 'configuration', schema: E.Configuration, prefix: 'cfg', label: 'Configuration', plural: 'Configurations', route: '/configurator', partition: 'products', searchFields: ['designation'] }),
  d({ entity: 'bom', schema: E.Bom, prefix: 'bom', label: 'BOM', plural: 'BOMs', route: '/bom', partition: 'records', searchFields: ['bom_type', 'revision'] }),
  d({ entity: 'component', schema: E.ItemMaster, prefix: 'itm', label: 'Component', plural: 'Components', route: '/bom', partition: 'records', searchFields: ['code', 'spec', 'category', 'vendor'] }),
  d({ entity: 'cost_model', schema: E.CostModel, prefix: 'cst', label: 'Cost model', plural: 'Cost models', route: '/cost', partition: 'records', searchFields: ['scenario'] }),
  d({ entity: 'poc', schema: E.Poc, prefix: 'poc', label: 'POC', plural: 'POCs', route: '/poc', partition: 'records', searchFields: ['objective', 'part', 'conclusion', 'poc_status'], requiresNextAction: true }),
  d({ entity: 'doe', schema: E.Doe, prefix: 'doe', label: 'DOE', plural: 'DOEs', route: '/doe', partition: 'records', searchFields: [] }),
  d({ entity: 'project', schema: E.Project, prefix: 'prj', label: 'Project', plural: 'Projects', route: '/projects', partition: 'records', searchFields: ['scope'], requiresNextAction: true }),
  d({ entity: 'gate_definition', schema: E.GateDefinition, prefix: 'gate', label: 'Gate definition', plural: 'Gate definitions', route: '/gates', partition: 'knowledge', searchFields: ['code', 'inputs', 'outputs', 'exit_criteria'] }),
  d({ entity: 'risk', schema: E.Risk, prefix: 'rsk', label: 'Risk / FMEA', plural: 'Risks', route: '/quality', partition: 'records', searchFields: ['failure_mode', 'cause', 'effect', 'kind'], requiresNextAction: true }),
  d({ entity: 'supplier', schema: E.Supplier, prefix: 'sup', label: 'Supplier', plural: 'Suppliers', route: '/suppliers', partition: 'suppliers', searchFields: ['country', 'category', 'capabilities', 'products'], requiresNextAction: false }),
  d({ entity: 'rfq', schema: E.Rfq, prefix: 'rfq', label: 'RFQ', plural: 'RFQs', route: '/rfq', partition: 'records', searchFields: ['rfq_status'] }),
  d({ entity: 'acceptance', schema: E.AcceptanceProtocol, prefix: 'acc', label: 'FAT/SAT protocol', plural: 'FAT/SAT protocols', route: '/fat-sat', partition: 'records', searchFields: ['phase'] }),
  d({ entity: 'machine', schema: E.Machine, prefix: 'mch', label: 'Machine', plural: 'Machines', route: '/service', partition: 'records', searchFields: ['serial', 'site'] }),
  d({ entity: 'service_ticket', schema: E.ServiceTicket, prefix: 'svc', label: 'Service ticket', plural: 'Service tickets', route: '/service', partition: 'records', searchFields: ['issue', 'root_cause', 'alarm'] }),
  d({ entity: 'source', schema: E.Source, prefix: 'src', label: 'Source', plural: 'Sources', route: '/evidence', partition: 'knowledge', searchFields: ['kind', 'publisher'] }),
  d({ entity: 'evidence', schema: E.Evidence, prefix: 'evd', label: 'Evidence', plural: 'Evidence', route: '/evidence', partition: 'knowledge', searchFields: ['claim', 'excerpt', 'section'] }),
  d({ entity: 'lesson', schema: E.Lesson, prefix: 'les', label: 'Lesson learned', plural: 'Lessons learned', route: '/lessons', partition: 'knowledge', searchFields: ['what_worked', 'what_failed', 'why', 'design_rule', 'category'] }),
  d({ entity: 'technology', schema: E.Technology, prefix: 'tec', label: 'Technology', plural: 'Technologies', route: '/technology', partition: 'research', searchFields: ['domain'] }),
  d({ entity: 'semi_step', schema: E.SemiconductorStep, prefix: 'sem', label: 'Semiconductor process step', plural: 'Semiconductor process steps', route: '/semiconductor', partition: 'knowledge', searchFields: ['stage', 'laser_relevance'] }),
  d({ entity: 'decision', schema: E.DecisionRecord, prefix: 'edr', label: 'Engineering decision', plural: 'Engineering decisions', route: '/decisions', partition: 'records', searchFields: ['question', 'decision'] }),
  d({ entity: 'change_request', schema: E.ChangeRequest, prefix: 'ecr', label: 'Change request', plural: 'Change requests', route: '/changes', partition: 'records', searchFields: ['reason', 'impact'] }),
  d({ entity: 'localization', schema: E.Localization, prefix: 'loc', label: 'Localization item', plural: 'Localization items', route: '/localization', partition: 'suppliers', searchFields: ['imported_component', 'indian_alternative', 'classification'], requiresNextAction: false }),
  d({ entity: 'vocabulary', schema: E.Vocabulary, prefix: 'voc', label: 'Vocabulary', plural: 'Vocabularies', route: '/admin', partition: 'knowledge', searchFields: ['key'] }),
  d({ entity: 'formula', schema: E.Formula, prefix: 'fml', label: 'Formula', plural: 'Formulas', route: '/calculators', partition: 'knowledge', searchFields: ['code', 'quantity', 'formula', 'discipline'] }),
  d({ entity: 'reference', schema: E.ReferenceRow, prefix: 'ref', label: 'Reference row', plural: 'Reference data', route: '/admin', partition: 'records', searchFields: ['table'] }),
] as const;

export type EntityType = (typeof ENTITY_DEFS)[number]['entity'];

export const ENTITY_BY_TYPE: Record<string, EntityDef> = Object.fromEntries(ENTITY_DEFS.map((e) => [e.entity, e]));
export const ENTITY_BY_PREFIX: Record<string, EntityDef> = Object.fromEntries(ENTITY_DEFS.map((e) => [e.prefix, e]));

export function defForId(id: string): EntityDef | undefined {
  const prefix = id.split('-')[0];
  return prefix ? ENTITY_BY_PREFIX[prefix] : undefined;
}

export function schemaFor(entity: string): z.ZodType | undefined {
  return ENTITY_BY_TYPE[entity]?.schema;
}
