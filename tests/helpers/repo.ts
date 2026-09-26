import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AnyRecord } from '../../src/domain';
import type { Application, Company, GateDefinition, LaserSource, Material, Module, ModuleConflict, Optic, Product, RecommendationRule, Supplier } from '../../src/domain/entities';
import { ConfiguratorEngine, type PricingRules } from '../../src/features/configurator/engine';
import { MergedRepository, StaticRepository, newLocalId } from '../../src/repositories';
import { WorkspaceDb, setWorkspaceDb } from '../../src/repositories/workspaceDb';
import type { InquiryContext, Lexicon } from '../../src/services/inquiry';

const ROOT = join(__dirname, '..', '..');

/** StaticRepository over the committed /data files (no network). */
export const fsLoader = async <T,>(path: string): Promise<T> => JSON.parse(readFileSync(join(ROOT, path), 'utf-8')) as T;

let n = 0;
/** A fresh merged repository with an isolated fake-indexeddb workspace. */
export function freshRepo(): MergedRepository {
  setWorkspaceDb(new WorkspaceDb(`test-workspace-${Date.now()}-${n++}`));
  return new MergedRepository(new StaticRepository(fsLoader));
}

export async function masterRecords(): Promise<AnyRecord[]> {
  return new StaticRepository(fsLoader).all();
}

export async function inquiryContext(records?: AnyRecord[]): Promise<InquiryContext> {
  const all = records ?? (await masterRecords());
  const master = new StaticRepository(fsLoader);
  const by = <T,>(e: string) => all.filter((r) => r.entity === e) as unknown as T[];
  const engine = new ConfiguratorEngine({
    products: by<Product>('product'),
    sources: by<LaserSource>('laser_source').filter((s) => s.kind === 'class'),
    lenses: by<Optic>('optic').filter((o) => o.optic_type === 'f_theta'),
    modules: by<Module>('module'),
    conflicts: by<ModuleConflict>('module_conflict'),
    rules: by<RecommendationRule>('rule').filter((r) => r.rule_type === 'recommendation'),
    materials: by<Material>('material'),
    pricing: await master.config<PricingRules>('configurator-pricing-rules'),
  });
  return {
    engine,
    lexicon: await master.config<Lexicon>('inquiry-lexicon'),
    applications: by<Application>('application'),
    materials: by<Material>('material'),
    suppliers: by<Supplier>('supplier'),
    companies: by<Company>('company'),
    gates: by<GateDefinition>('gate_definition'),
    newId: newLocalId,
    today: '2026-09-01',
  };
}
