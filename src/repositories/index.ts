import type { AnyRecord } from '../domain';
import type * as E from '../domain/entities';
import type * as G from '../domain/engineering';
import { MergedRepository } from './MergedRepository';
import { StaticRepository } from './StaticRepository';
import type { WithOrigin } from './types';

export * from './types';
export { MergedRepository } from './MergedRepository';
export { StaticRepository } from './StaticRepository';
export { newLocalId, validateRecord, ValidationFailure, WorkspaceRepository } from './WorkspaceRepository';

/** The application-wide repository: GitHub master data merged with this browser's drafts. */
let _repo: MergedRepository | null = null;
export function repo(): MergedRepository {
  _repo ??= new MergedRepository(new StaticRepository());
  return _repo;
}
/** Tests only. */
export function setRepo(r: MergedRepository): void {
  _repo = r;
}

/* Typed entity repositories (spec §127). Thin, but they keep features off raw entity strings. */
function typed<T>(entity: string) {
  return {
    list: () => repo().list(entity) as Promise<WithOrigin<T & AnyRecord>[]>,
    get: (id: string) => repo().get(id) as Promise<WithOrigin<T & AnyRecord> | undefined>,
    save: (r: T & Record<string, unknown>, summary?: string) => repo().workspace.save(r, summary),
  };
}
export const ProductRepository = typed<E.Product>('product');
export const CustomerRepository = typed<E.Customer>('customer');
export const OpportunityRepository = typed<E.Opportunity>('opportunity');
export const CostRepository = typed<E.CostModel>('cost_model');
export const SupplierRepository = typed<E.Supplier>('supplier');
export const ProjectRepository = typed<E.Project>('project');
export const KnowledgeRepository = typed<E.Evidence>('evidence');

/* Engineering repositories (industrial intelligence master prompt §7). V1 = IndexedDB drafts over GitHub
   master data; a future APIRepository implements the same list / get / save contract. */
export const ManufacturerRepository = typed<E.Company>('company');
export const ComponentRepository = typed<G.Part>('part');
export const RequirementRepository = typed<E.Requirement>('requirement');
export const EquipmentRepository = typed<G.EquipmentTemplate>('equipment_template');
export const SimulationRepository = typed<G.Simulation>('simulation');
export const BOMRepository = typed<E.Bom>('bom');
export const SourceRepository = typed<E.Source>('source');
export const VerificationRepository = typed<G.Verification>('verification');
export const SpecificationRepository = typed<G.SpecDefinition>('spec_definition');
export const CompatibilityRepository = typed<G.CompatibilityRule>('compatibility_rule');
