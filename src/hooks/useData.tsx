import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { AnyRecord } from '../domain';
import type { LaserSource, Material, Module, ModuleConflict, Optic, Product, RecommendationRule } from '../domain/entities';
import { ConfiguratorEngine, type PricingRules } from '../features/configurator/engine';
import { repo, type Catalog, type WithOrigin } from '../repositories';
import { workspaceBus } from '../repositories/workspaceDb';
import { buildGraph, type Graph } from '../services/graph';
import type { Lexicon } from '../services/inquiry';
import { FetchError } from '../utils/paths';

export type Rec = WithOrigin<AnyRecord>;

interface DataState {
  status: 'loading' | 'ready' | 'error';
  error?: { what: string; why: string; todo: string };
  records: Rec[];
  byId: Map<string, Rec>;
  graph: Graph;
  catalog: Catalog | null;
  drafts: number;
  pricing: PricingRules | null;
  lexicon: Lexicon | null;
  costDefaults: Record<string, unknown> | null;
  reload: () => void;
}

const empty = buildGraph([]);
const Ctx = createContext<DataState>({ status: 'loading', records: [], byId: new Map(), graph: empty, catalog: null, drafts: 0, pricing: null, lexicon: null, costDefaults: null, reload: () => {} });

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<DataState, 'reload'>>({ status: 'loading', records: [], byId: new Map(), graph: empty, catalog: null, drafts: 0, pricing: null, lexicon: null, costDefaults: null });
  const version = useSyncExternalStore(workspaceBus.subscribe, workspaceBus.version);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = repo();
        const [catalog, records, drafts, pricing, lexicon, costDefaults] = await Promise.all([
          r.master.catalog(),
          r.all(),
          r.workspace.drafts(),
          r.master.config<PricingRules>('configurator-pricing-rules'),
          r.master.config<Lexicon>('inquiry-lexicon'),
          r.master.config<Record<string, unknown>>('cost-defaults'),
        ]);
        if (cancel) return;
        setState({ status: 'ready', records, byId: new Map(records.map((x) => [x.id, x])), graph: buildGraph(records), catalog, drafts: drafts.length, pricing, lexicon, costDefaults });
      } catch (e) {
        if (cancel) return;
        const fe = e instanceof FetchError;
        setState((s) => ({
          ...s,
          status: 'error',
          error: {
            what: 'The engineering data could not be loaded.',
            why: fe ? e.message : 'The data files were unreadable or the local workspace database is unavailable.',
            todo: navigator.onLine ? 'Reload the page. If this persists, the deployment may be incomplete — check the latest GitHub Actions run.' : 'You are offline and this data has not been cached yet. Reconnect and reload once.',
          },
        }));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [version, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const value = useMemo(() => ({ ...state, reload }), [state, reload]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useData = () => useContext(Ctx);

export function useRecords<T = AnyRecord>(entity: string): (T & Rec)[] {
  const { records } = useData();
  return useMemo(() => records.filter((r) => r.entity === entity) as (T & Rec)[], [records, entity]);
}

export function useRecord<T = AnyRecord>(id: string | undefined): (T & Rec) | undefined {
  const { byId } = useData();
  return id ? (byId.get(id) as (T & Rec) | undefined) : undefined;
}

export function useEngine(): ConfiguratorEngine | null {
  const { records, pricing } = useData();
  return useMemo(() => {
    if (!pricing || !records.length) return null;
    const by = <T,>(e: string) => records.filter((r) => r.entity === e) as unknown as T[];
    return new ConfiguratorEngine({
      products: by<Product>('product'),
      sources: by<LaserSource>('laser_source').filter((s) => s.kind === 'class'),
      lenses: by<Optic>('optic').filter((o) => o.optic_type === 'f_theta'),
      modules: by<Module>('module'),
      conflicts: by<ModuleConflict>('module_conflict'),
      rules: by<RecommendationRule>('rule').filter((r) => r.rule_type === 'recommendation'),
      materials: by<Material>('material'),
      pricing,
    });
  }, [records, pricing]);
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb);
      window.addEventListener('offline', cb);
      return () => {
        window.removeEventListener('online', cb);
        window.removeEventListener('offline', cb);
      };
    },
    () => navigator.onLine,
  );
}
