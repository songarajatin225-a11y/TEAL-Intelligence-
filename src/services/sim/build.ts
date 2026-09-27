import type { FxRate } from '../../calculations/cost';
import type { AnyRecord } from '../../domain';
import type { EquipmentTemplate, Part, Simulation, Station } from '../../domain/engineering';
import type { SpecDefs } from '../eng/specs';
import { scenarioMetrics } from './analysis';

/*
 * SCENARIO CONSTRUCTION, VERSIONS, SEQUENCES AND THE 2D DIGITAL TWIN LAYOUT
 * (master prompt §59, §72–§74, §134, §143, §144).
 */

type NewId = (entity: string) => string;

/** A new scenario from a template: structure copied, every time empty until someone enters it. */
export function scenarioFromTemplate(t: EquipmentTemplate & AnyRecord, o: { newId: NewId; today: string; name?: string; customer_id?: string; requirement_ids?: string[]; uph?: number | null; label?: string }): Simulation & AnyRecord {
  return {
    id: o.newId('simulation'),
    entity: 'simulation',
    name: o.name ?? `${t.name} — new scenario`,
    scenario_label: o.label ?? 'A',
    template_id: t.id,
    config_level: 'Equipment Variant',
    sim_status: 'Draft',
    layout: 'inline',
    stations: t.stations.map((s) => ({ ...s, time_s: null, time_basis: undefined, laser: s.kind === 'laser' ? { passes: 1 } : s.laser })),
    selections: [],
    targets: { uph: o.uph ?? null },
    shift: { hours_per_shift: 8, shifts_per_day: 2, days_per_year: 300 },
    currency: 'INR',
    ...(o.customer_id ? { customer_id: o.customer_id } : {}),
    ...(o.requirement_ids?.length ? { requirement_ids: o.requirement_ids } : {}),
    ...(t.product_id ? { product_id: t.product_id } : {}),
    sequence: defaultSequence(t.stations),
    version: 1,
    data_type: 'USER_CREATED',
    provenance: { verification_status: 'DRAFT', note: `Created from template ${t.code} on ${o.today}. Shift pattern 8 h × 2 × 300 d is a starting assumption — edit it.` },
    created_at: o.today,
  } as Simulation & AnyRecord;
}

/** §134/§143 — a new version or configuration never overwrites its parent. */
export function deriveScenario(sim: Simulation & AnyRecord, o: { newId: NewId; today: string; reason: string; label?: string; level?: Simulation['config_level']; name?: string }): Simulation & AnyRecord {
  const { __origin: _o, __dataset: _d, ...rest } = sim as Simulation & AnyRecord & { __origin?: string; __dataset?: string };
  void _o;
  void _d;
  return {
    ...rest,
    id: o.newId('simulation'),
    name: o.name ?? `${sim.name.replace(/ — Scenario [A-Z].*$/, '')} — ${o.label ? `Scenario ${o.label}` : `v${(sim.version ?? 1) + 1}`}`,
    parent_id: sim.id,
    scenario_label: o.label ?? sim.scenario_label,
    config_level: o.level ?? sim.config_level,
    change_reason: o.reason,
    version: (sim.version ?? 1) + 1,
    sim_status: 'Draft',
    actuals: [],
    data_type: sim.data_type === 'DEMO' ? 'USER_CREATED' : sim.data_type,
    provenance: { verification_status: 'DRAFT', note: `Derived from ${sim.id} on ${o.today}: ${o.reason}${sim.data_type === 'DEMO' ? ' — inputs copied from a DEMO scenario (DEMO values remain DEMO)' : ''}` },
    tags: [...new Set([...(sim.tags ?? []).filter((t) => t !== 'demo'), 'derived'])],
    created_at: o.today,
  } as Simulation & AnyRecord;
}

/* ---------------------------------------------------------------- automation sequence (§74) */

export type SeqStep = NonNullable<Simulation['sequence']>[number];
export function defaultSequence(stations: Station[]): SeqStep[] {
  const s: SeqStep[] = [{ key: 'start', name: 'START', kind: 'start' }, { key: 'safety', name: 'Safety check', kind: 'check', interlock: 'Guards closed, E-stop healthy', alarm: 'Safety circuit open' }];
  for (const st of stations) {
    if (st.kind === 'load') s.push({ key: `present-${st.key}`, name: 'Part present', kind: 'check', sensor: 'Part-present sensor', timer_s: 5, alarm: 'Part missing (timeout)' });
    if (st.kind === 'fixture') s.push({ key: `clamp-${st.key}`, name: 'Clamp', kind: 'action', actuator: 'Clamp', sensor: 'Clamp confirmation', timer_s: 1, alarm: 'Clamp not confirmed' });
    if (st.kind === 'align' || st.kind === 'vision') s.push({ key: `vision-${st.key}`, name: 'Vision', kind: 'action', actuator: 'Camera trigger', condition: 'Features found', alarm: 'Vision failure' }, { key: `position-${st.key}`, name: 'Position', kind: 'action', condition: 'Offsets applied' });
    if (st.kind === 'laser') s.push({ key: `enable-${st.key}`, name: 'Laser enable', kind: 'action', interlock: 'Enclosure interlock closed, extraction running', alarm: 'Laser not ready' }, { key: `process-${st.key}`, name: 'Process', kind: 'action', actuator: 'Laser job' }, { key: `disable-${st.key}`, name: 'Laser disable', kind: 'action' });
    if (st.kind === 'process' || st.kind === 'assembly' || st.kind === 'test' || st.kind === 'transfer' || st.kind === 'motion') s.push({ key: `op-${st.key}`, name: st.name, kind: 'action' });
    if (st.kind === 'inspect') s.push({ key: `inspect-${st.key}`, name: 'Inspection', kind: 'action', actuator: 'Inspection trigger' }, { key: `decide-${st.key}`, name: 'Decision', kind: 'decision', condition: 'OK → continue; NG → reject path' });
    if (st.kind === 'unload') s.push({ key: `unclamp-${st.key}`, name: 'Unclamp', kind: 'action' }, { key: `unload-${st.key}`, name: 'Unload', kind: 'action' });
  }
  s.push({ key: 'done', name: 'Complete', kind: 'end' });
  const seen = new Set<string>();
  return s.filter((x) => (seen.has(x.key) ? false : (seen.add(x.key), true)));
}

/** Structural checks of a sequence — each message names the step. */
export function validateSequence(seq: SeqStep[]): string[] {
  const out: string[] = [];
  if (!seq.length) return ['Empty sequence'];
  if (seq[0].kind !== 'start') out.push('The first step must be START');
  if (seq[seq.length - 1].kind !== 'end') out.push('The last step must be an end step (Complete)');
  const idx = (re: RegExp) => seq.findIndex((s) => re.test(s.name));
  const en = idx(/laser enable/i);
  const pr = seq.findIndex((s, i) => i > en && /process/i.test(s.name));
  const dis = idx(/laser disable/i);
  if (en >= 0 && !seq[en].interlock) out.push(`${seq[en].name}: no interlock condition — laser emission must depend on the guard chain`);
  if (en >= 0 && dis < 0) out.push('Laser enable without a Laser disable step');
  if (en >= 0 && dis >= 0 && dis < en) out.push('Laser disable comes before Laser enable');
  if (en >= 0 && pr >= 0 && dis >= 0 && !(en < pr && pr < dis)) out.push('Process must sit between Laser enable and Laser disable');
  if (idx(/safety/i) < 0) out.push('No safety check step');
  for (const s of seq) {
    if (s.kind === 'check' && !s.alarm) out.push(`${s.name}: a check without an alarm / timeout`);
    if (s.kind === 'decision' && !s.condition) out.push(`${s.name}: a decision without a condition`);
  }
  const keys = seq.map((s) => s.key);
  if (new Set(keys).size !== keys.length) out.push('Duplicate step keys');
  return out;
}

/* ---------------------------------------------------------------- 2D digital twin layout (§72) */

export interface TwinObject {
  id: string;
  kind: 'frame' | 'conveyor' | 'station' | 'cabinet' | 'operator' | 'enclosure' | 'buffer';
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  stationKey?: string;
}
export function twinLayout(stations: Station[]): { width: number; height: number; objects: TwinObject[] } {
  const W = 120;
  const G = 34;
  const n = stations.length;
  const width = 60 + n * W + (n - 1) * G + 60;
  const height = 300;
  const objects: TwinObject[] = [];
  objects.push({ id: 'frame', kind: 'frame', label: 'Machine frame', x: 20, y: 40, w: width - 40, h: 170 });
  objects.push({ id: 'conveyor', kind: 'conveyor', label: 'Transfer / conveyor', x: 40, y: 150, w: width - 80, h: 22 });
  stations.forEach((s, i) => {
    const x = 60 + i * (W + G);
    objects.push({ id: `st-${s.key}`, kind: 'station', label: s.name, x, y: 64, w: W, h: 76, stationKey: s.key });
    if ((s.buffer_after ?? 0) > 0 && i < n - 1) objects.push({ id: `buf-${s.key}`, kind: 'buffer', label: `Buffer ${s.buffer_after}`, x: x + W + 3, y: 152, w: G - 6, h: 18, stationKey: s.key });
    if (s.kind === 'laser') objects.push({ id: `enc-${s.key}`, kind: 'enclosure', label: 'Laser safety enclosure', x: x - 10, y: 48, w: W + 20, h: 130, stationKey: s.key });
  });
  objects.push({ id: 'cabinet', kind: 'cabinet', label: 'Electrical cabinet (PLC, safety, drives)', x: 20, y: 228, w: 190, h: 52 });
  objects.push({ id: 'operator', kind: 'operator', label: 'Operator / HMI area', x: 230, y: 228, w: Math.max(160, width - 250), h: 52 });
  return { width, height, objects };
}

/* ---------------------------------------------------------------- equipment version diff (§144) */

export interface VersionDiff {
  components: { station: string; role: string; before: string | null; after: string | null }[];
  laser: { station: string; field: string; before: string; after: string }[];
  stations: { station: string; field: string; before: string; after: string }[];
  suppliers: { before: string[]; after: string[] };
  requirements: { added: string[]; removed: string[] };
  metrics: { metric: string; before: string; after: string }[];
}
export function versionDiff(a: Simulation & AnyRecord, b: Simulation & AnyRecord, byId: Map<string, AnyRecord>, defs: SpecDefs, fx: Record<string, FxRate>): VersionDiff {
  const key = (s: { station_key: string; role: string }) => `${s.station_key}|${s.role}`;
  const selA = new Map((a.selections ?? []).map((s) => [key(s), s]));
  const selB = new Map((b.selections ?? []).map((s) => [key(s), s]));
  const stName = (sim: Simulation, k: string) => (k === '_machine' ? 'Machine level' : sim.stations.find((s) => s.key === k)?.name ?? k);
  const model = (id?: string) => (id ? String((byId.get(id) as Part | undefined)?.model_number ?? id) : null);
  const components = [...new Set([...selA.keys(), ...selB.keys()])]
    .map((k) => ({ k, x: selA.get(k), y: selB.get(k) }))
    .filter(({ x, y }) => x?.part_id !== y?.part_id || (x?.quantity ?? 1) !== (y?.quantity ?? 1))
    .map(({ k, x, y }) => ({ station: stName(b, k.split('|')[0]), role: k.split('|')[1], before: x ? `${model(x.part_id)}${(x.quantity ?? 1) > 1 ? ` × ${x.quantity}` : ''}` : null, after: y ? `${model(y.part_id)}${(y.quantity ?? 1) > 1 ? ` × ${y.quantity}` : ''}` : null }));
  const laser: VersionDiff['laser'] = [];
  const stations: VersionDiff['stations'] = [];
  const keys = new Set([...a.stations.map((s) => s.key), ...b.stations.map((s) => s.key)]);
  for (const k of keys) {
    const x = a.stations.find((s) => s.key === k);
    const y = b.stations.find((s) => s.key === k);
    if (!x || !y) {
      stations.push({ station: (x ?? y)!.name, field: 'station', before: x ? 'present' : '—', after: y ? 'present' : 'removed' });
      continue;
    }
    for (const f of ['time_s', 'parallel', 'buffer_after', 'reject_rate', 'mtbf_min', 'mttr_min', 'capex'] as const) if ((x[f] ?? null) !== (y[f] ?? null)) stations.push({ station: y.name, field: f, before: String(x[f] ?? '—'), after: String(y[f] ?? '—') });
    for (const f of Object.keys({ ...(x.laser ?? {}), ...(y.laser ?? {}) }) as (keyof NonNullable<Station['laser']>)[]) if ((x.laser?.[f] ?? null) !== (y.laser?.[f] ?? null)) laser.push({ station: y.name, field: f, before: String(x.laser?.[f] ?? '—'), after: String(y.laser?.[f] ?? '—') });
  }
  const mfrs = (s: Simulation) => [...new Set((s.selections ?? []).map((x) => String(byId.get(String((byId.get(x.part_id) as Part | undefined)?.manufacturer_id ?? ''))?.name ?? '')).filter(Boolean))].sort();
  const ra = new Set(a.requirement_ids ?? []);
  const rb = new Set(b.requirement_ids ?? []);
  const ma = scenarioMetrics(a, byId, defs, fx);
  const mb = scenarioMetrics(b, byId, defs, fx);
  const f = (v: number | null, d = 0) => (v == null ? 'Not Available' : v.toLocaleString('en-IN', { maximumFractionDigits: d }));
  return {
    components,
    laser,
    stations,
    suppliers: { before: mfrs(a), after: mfrs(b) },
    requirements: { added: [...rb].filter((x) => !ra.has(x)), removed: [...ra].filter((x) => !rb.has(x)) },
    metrics: [
      { metric: 'Cycle time (s)', before: f(ma.cycle, 2), after: f(mb.cycle, 2) },
      { metric: 'Practical UPH', before: f(ma.practicalUph), after: f(mb.practicalUph) },
      { metric: `Equipment cost (${mb.currency})`, before: f(ma.capex), after: f(mb.capex) },
      { metric: 'BOM lines', before: String(ma.bomLines), after: String(mb.bomLines) },
      { metric: 'Local cost share', before: ma.localization != null ? `${(ma.localization * 100).toFixed(0)} %` : 'Not Available', after: mb.localization != null ? `${(mb.localization * 100).toFixed(0)} %` : 'Not Available' },
    ],
  };
}
