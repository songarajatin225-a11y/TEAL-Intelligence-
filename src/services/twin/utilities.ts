import type { AnyRecord } from '../../domain';
import type { Part } from '../../domain/engineering';
import type { SpecDefs } from '../eng/specs';
import type { Resolved } from '../sim/model';
import { specIn } from './motion';
import type { SimulationState } from './timeline';

/*
 * UTILITIES (3D master prompt §97): electrical power and extraction airflow of the machine, read only from
 * the selected components' records. A component without a stated value is listed as "not stated" and is
 * not estimated. Live power sums the stated values of components at stations that are working now —
 * rated / typical values, not a metered consumption.
 */

export interface UtilityItem {
  partId: string;
  name: string;
  stationKey: string;
  /** W — typical consumption, else rated input power */
  power: number | null;
  powerBasis: 'typical' | 'rated' | null;
  /** m³/h (fume extraction) */
  airflow: number | null;
  qty: number;
}

export interface UtilitySummary {
  items: UtilityItem[];
  /** Σ stated power × quantity, W */
  statedPower: number;
  /** components with no power value in their record */
  missingPower: UtilityItem[];
  airflow: number | null;
  /** Σ stated power × busy time per part ÷ 3600, Wh — only the components that state power */
  energyPerPart: number | null;
}

/** Electrically passive or mechanical parts: no power value is expected, so they are not listed as missing. */
const PASSIVE = new Set(['f_theta', 'beam_expander', 'vision_lens', 'telecentric_lens', 'fixture', 'enclosure', 'gripper', 'door_switch', 'linear_stage', 'optic', 'mirror', 'nozzle', 'cable', 'frame']);

export function utilities(res: Resolved, byId: Map<string, AnyRecord>, defs: SpecDefs): UtilitySummary {
  const items: UtilityItem[] = [];
  const sel = res.sim.selections ?? [];
  for (const s of sel) {
    const part = byId.get(s.part_id) as (Part & AnyRecord) | undefined;
    if (!part) continue;
    const typical = specIn(part, 'power_consumption', 'W', defs);
    const rated = typical == null ? specIn(part, 'input_power', 'W', defs) : null;
    items.push({ partId: part.id, name: `${part.model_number} (${s.role})`, stationKey: s.station_key, power: typical ?? rated, powerBasis: typical != null ? 'typical' : rated != null ? 'rated' : null, airflow: specIn(part, 'airflow', 'm³/h', defs), qty: s.quantity ?? 1 });
  }
  const statedPower = items.reduce((n, i) => n + (i.power ?? 0) * i.qty, 0);
  const missingPower = items.filter((i) => i.power == null && !PASSIVE.has(String((byId.get(i.partId) as Part | undefined)?.product_type)));
  const air = items.filter((i) => i.airflow != null);
  // energy per part: machine-level components draw for the whole cycle, station components while their station works
  let energy: number | null = null;
  const cycleTime = res.stations.every((s) => s.time != null) ? (res.layout === 'sequential' ? res.stations.reduce((n, s) => n + (s.time ?? 0), 0) : Math.max(...res.stations.map((s) => (s.time ?? 0) / Math.max(1, s.station.parallel ?? 1)))) : null;
  if (cycleTime != null && items.some((i) => i.power != null)) {
    energy = 0;
    for (const i of items) {
      if (i.power == null) continue;
      const st = res.stations.find((s) => s.station.key === i.stationKey);
      const busy = st ? (st.time ?? 0) : cycleTime;
      energy += (i.power * i.qty * busy) / 3600;
    }
  }
  return { items, statedPower, missingPower, airflow: air.length ? air.reduce((n, i) => n + i.airflow! * i.qty, 0) : null, energyPerPart: energy };
}

/** Stated power of components at stations working at this instant, plus machine-level components (W). */
export function livePower(u: UtilitySummary, snap: SimulationState | null): number | null {
  if (!snap || !u.items.some((i) => i.power != null)) return null;
  const busy = new Set(snap.stations.filter((s) => s.servers.some((x) => x.state === 'busy')).map((s) => s.key));
  return u.items.reduce((n, i) => n + (i.power != null && (i.stationKey === '_machine' || busy.has(i.stationKey)) ? i.power * i.qty : 0), 0);
}
