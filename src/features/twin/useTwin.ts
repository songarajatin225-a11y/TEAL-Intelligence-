import { useMemo } from 'react';
import type { AnyRecord } from '../../domain';
import type { FaultCase, Part } from '../../domain/engineering';
import { runDes, type DesResult } from '../../services/sim/des';
import { originOf } from '../../services/sim/supply';
import { twinChecks } from '../../services/twin/checks';
import { checkCollisions } from '../../services/twin/collision';
import { previewResolved } from '../../services/twin/preview';
import { buildMachine, type MachineModel } from '../../services/twin/machine';
import { scanPath, type ScanPath } from '../../services/twin/process';
import { TwinPlayer } from '../../services/twin/timeline';
import type { Eng } from '../studio/shared';
import type { Derived, Sim } from '../studio/ScenarioPage';

/** Everything derived from the canonical scenario for the 3D view — never stored in the scene (§176). */
export function useTwinModel(eng: Eng, sim: Sim, d: Derived) {
  return useMemo(() => {
    const model = buildMachine(d.res, eng.byId, eng.defs, d.bom);
    const collisions = checkCollisions(model);
    const checks = twinChecks(d.res, model, d.cycle, collisions, d.issues);
    const symbolicArea = !model.processArea;
    const paths: ScanPath[] = model.lasers.map((l) => {
      const f = l.field ?? 100;
      const a = model.processArea ?? { x: Math.min(40, f * 0.35), y: Math.min(20, f * 0.18) };
      return scanPath(l.process as never, a.x, a.y, sim.recipe_id ?? sim.id);
    });
    return { model, collisions, checks, paths, symbolicArea };
  }, [eng, sim, d]);
}
export type TwinModel = ReturnType<typeof useTwinModel>;

export interface RunOptions {
  seed: number;
  horizon_s: number;
  failures: boolean;
  scenarioFaults: boolean;
  injected: FaultCase[];
}

/** The ONE simulation run the 3D view, events, KPIs, HMI and alarms all read (§45). */
export function useTwinRun(d: Derived, model: MachineModel, o: RunOptions): { des: DesResult | null; player: TwinPlayer | null; baseline: DesResult | null; error: string | null; preview: boolean } {
  return useMemo(() => {
    if (!d.res.runnable) {
      try {
        const pr = previewResolved(d.res);
        const des = runDes(pr, { horizon_s: Math.min(o.horizon_s, 1800), seed: o.seed, traceUntil_s: Math.min(o.horizon_s, 1800), failures: false, maintenance: false, variability: false });
        return { des, player: new TwinPlayer(pr, des, model), baseline: null, error: null, preview: true };
      } catch (e) {
        return { des: null, player: null, baseline: null, error: String(e), preview: true };
      }
    }
    try {
      const faults = [...(o.scenarioFaults ? d.res.sim.faults ?? [] : []), ...o.injected];
      const des = runDes(d.res, { horizon_s: o.horizon_s, seed: o.seed, traceUntil_s: o.horizon_s, failures: o.failures, maintenance: false, faults, variability: true });
      const baseline = o.injected.length ? runDes(d.res, { horizon_s: o.horizon_s, seed: o.seed, failures: o.failures, maintenance: false, faults: o.scenarioFaults ? d.res.sim.faults ?? [] : [], variability: true }) : null;
      const names = Object.fromEntries(faults.map((f) => [f.station_key, f.name]));
      return { des, player: new TwinPlayer(d.res, des, model, names), baseline, error: null, preview: false };
    } catch (e) {
      return { des: null, player: null, baseline: null, error: String(e), preview: false };
    }
  }, [d.res, model, o.seed, o.horizon_s, o.failures, o.scenarioFaults, o.injected]);
}

export const ORIGIN_COLOR = { Local: '#2fbf71', Imported: '#f5a524', Unknown: '#8d9a9a' } as const;

export function originColors(model: MachineModel, byId: Map<string, AnyRecord>) {
  const m = new Map<string, string>();
  for (const o of model.objects) {
    if (!o.partId) continue;
    const p = byId.get(o.partId) as (Part & AnyRecord) | undefined;
    if (p) m.set(o.id, ORIGIN_COLOR[originOf(p, byId).origin]);
  }
  return m;
}

/** Sequential single-hue scale (light → dark teal) for cost share. */
export function costColor(share: number) {
  const s = Math.max(0, Math.min(1, share));
  const l = 78 - s * 48;
  return `hsl(174 70% ${l}%)`;
}

/** Sequential single-hue scale (light → dark blue) for station utilization, 0–1. */
export function utilColor(u: number) {
  const s = Math.max(0, Math.min(1, u));
  return `hsl(211 80% ${84 - s * 50}%)`;
}
