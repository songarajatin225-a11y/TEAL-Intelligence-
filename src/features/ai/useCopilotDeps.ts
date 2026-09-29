import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { newLocalId } from '../../repositories/WorkspaceRepository';
import { compatCtx } from '../../services/eng/compatibility';
import { specDefs } from '../../services/eng/specs';
import { engineOverrides } from '../../services/ai/feedback';
import type { CopilotDeps } from '../../services/ai/orchestrator';
import { dataReadiness, engineStates } from '../../services/ai/registry';
import { bm25FromRecords, recordVectorIndex, type Bm25Fn } from '../../services/ai/retrieval/hybrid';
import { search } from '../../services/search';
import { useData, useEngine } from '../../hooks/useData';
import { fetchText } from '../../utils/paths';

/* A tiny change bus so every AI view re-reads the engine switches after the Control Center changes one. */
let version = 0;
const listeners = new Set<() => void>();
export const aiSettingsBus = {
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  emit: () => {
    version++;
    listeners.forEach((l) => l());
  },
  version: () => version,
};

/** Everything the orchestrator needs, built once per data load (vector index is built in the browser). */
export function useCopilotDeps(): CopilotDeps | null {
  const { status, records, byId, graph, lexicon } = useData();
  const engine = useEngine();
  const v = useSyncExternalStore(aiSettingsBus.subscribe, aiSettingsBus.version);
  const [overrides, setOverrides] = useState<Record<string, boolean> | null>(null);
  useEffect(() => {
    let live = true;
    engineOverrides().then((o) => live && setOverrides(o));
    return () => {
      live = false;
    };
  }, [v]);
  const defs = useMemo(() => specDefs(records), [records]);
  const compat = useMemo(() => compatCtx(records, defs), [records, defs]);
  const readiness = useMemo(() => dataReadiness(records), [records]);
  const vec = useMemo(() => (records.length ? recordVectorIndex(records) : null), [records]);
  const bm25 = useMemo<Bm25Fn>(() => {
    const locals = records.filter((r) => r.__origin !== 'MASTER');
    let fallback: Bm25Fn | null = null;
    return async (text, limit) => {
      try {
        return await search({ text, limit }, locals);
      } catch {
        // the build-time index could not be loaded (offline, first visit): index the records in memory
        fallback ??= bm25FromRecords(records);
        return fallback(text, limit);
      }
    };
  }, [records]);
  return useMemo(() => {
    if (status !== 'ready' || !overrides) return null;
    return { records, byId, graph, defs, compat, engine, lexicon, bm25, vec, fetchText, states: engineStates(readiness, overrides), readiness, newId: newLocalId };
  }, [status, overrides, records, byId, graph, defs, compat, engine, lexicon, bm25, vec, readiness]);
}
