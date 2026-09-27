import type { AnyRecord } from '../../domain';
import type { Part, PriceRecord, Simulation } from '../../domain/engineering';
import { checkPair, type CompatCtx } from '../eng/compatibility';
import type { Resolved } from './model';

/*
 * SUPPLIER INTELLIGENCE, LOCALIZATION AND DISRUPTION (master prompt §95, §96, §145, §146).
 * "Imported" / "Local" come from the manufacturer's recorded country; unknown stays unknown.
 * Alternatives are parts of the same type that no rule marks incompatible with the rest of the
 * station — a drop-in replacement still has to be verified (stated with every result).
 */

export const HOME_COUNTRY = /india/i;

export type Origin = 'Local' | 'Imported' | 'Unknown';
export function originOf(part: Part, byId: Map<string, AnyRecord>): { origin: Origin; country: string | null; manufacturer: string } {
  const m = part.manufacturer_id ? byId.get(part.manufacturer_id) : undefined;
  const country = (m?.country as string | undefined) ?? part.country_of_origin ?? null;
  const manufacturer = m?.name ?? part.brand ?? 'Not recorded';
  if (part.scope === 'TEAL') return { origin: 'Local', country: country ?? 'TEAL', manufacturer: part.brand ?? 'TEAL' };
  if (!country) return { origin: 'Unknown', country: null, manufacturer };
  return { origin: HOME_COUNTRY.test(country) ? 'Local' : 'Imported', country, manufacturer };
}

export function latestPrice(part: Part): PriceRecord | null {
  const ps = [...(part.prices ?? [])].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
  return ps[0] ?? null;
}

export interface SelectedPart {
  station: string;
  stationKey: string;
  role: string;
  part: Part & AnyRecord;
  qty: number;
}
export function selectedParts(res: Resolved): SelectedPart[] {
  return [
    ...res.stations.flatMap((s) => s.parts.map((p) => ({ station: s.station.name, stationKey: s.station.key, role: p.role, part: p.part, qty: p.qty }))),
    ...res.machineParts.map((p) => ({ station: 'Machine level', stationKey: '_machine', role: p.role, part: p.part, qty: p.qty })),
  ];
}

export interface Alternative {
  part: Part & AnyRecord;
  relationship: string;
  origin: Origin;
}
/** Same-type parts not marked incompatible with the other parts of the station (or machine). */
export function alternativesFor(sp: SelectedPart, all: (Part & AnyRecord)[], res: Resolved, ctx: CompatCtx, byId: Map<string, AnyRecord>): Alternative[] {
  const neighbours = selectedParts(res)
    .filter((x) => (x.stationKey === sp.stationKey || x.stationKey === '_machine' || sp.stationKey === '_machine') && x.part.id !== sp.part.id)
    .map((x) => x.part);
  return all
    .filter((p) => p.product_type === sp.part.product_type && p.id !== sp.part.id && p.record_status !== 'Archived' && p.lifecycle_status !== 'Discontinued')
    .map((p) => {
      const results = neighbours.map((n) => checkPair(p, n, ctx)).filter((r) => r.basis !== 'No rule applies');
      const bad = results.find((r) => r.relationship === 'Incompatible');
      const cond = results.find((r) => r.relationship === 'ConditionallyCompatible' || r.relationship === 'Unknown');
      return { part: p, relationship: bad ? 'Incompatible' : cond ? cond.relationship : results.length ? 'EngineeringCompatible' : 'Unknown (no rule applies)', origin: originOf(p, byId).origin };
    })
    .filter((a) => a.relationship !== 'Incompatible');
}

export interface DependencyRow {
  sp: SelectedPart;
  manufacturer: string;
  country: string | null;
  origin: Origin;
  leadTimeWeeks: number | null;
  alternatives: Alternative[];
  singleSource: boolean;
  risk: string[];
}
export function supplierDependency(res: Resolved, all: (Part & AnyRecord)[], ctx: CompatCtx, byId: Map<string, AnyRecord>): DependencyRow[] {
  return selectedParts(res).map((sp) => {
    const o = originOf(sp.part, byId);
    const lead = latestPrice(sp.part)?.lead_time_weeks ?? null;
    const alternatives = alternativesFor(sp, all, res, ctx, byId);
    const risk: string[] = [];
    if (!alternatives.length) risk.push('Single source — no qualified alternative in the database');
    if (o.origin === 'Imported' && lead != null && lead >= 8) risk.push(`Imported, ${lead}-week lead time`);
    if (sp.part.lifecycle_status === 'NRND' || sp.part.lifecycle_status === 'Discontinued') risk.push(`Lifecycle: ${sp.part.lifecycle_status}`);
    if (o.origin === 'Unknown') risk.push('Country of origin not recorded');
    return { sp, manufacturer: o.manufacturer, country: o.country, origin: o.origin, leadTimeWeeks: lead, alternatives, singleSource: alternatives.length === 0, risk };
  });
}

/* ---------------------------------------------------------------- localization layers (§96) */

export const LOCALIZATION_LAYERS: { layer: string; types: string[] }[] = [
  { layer: 'Laser Source', types: ['laser_source', 'laser_module', 'laser_engine', 'laser_driver'] },
  { layer: 'Beam Delivery', types: ['beam_expander', 'beam_delivery', 'fiber', 'laser_head', 'isolator', 'collimator'] },
  { layer: 'Galvo', types: ['galvo', 'galvo_controller'] },
  { layer: 'Optics', types: ['f_theta', 'mirror', 'lens', 'window', 'polarizer', 'waveplate', 'filter', 'dichroic', 'aom', 'eom'] },
  { layer: 'Motion', types: ['servo_motor', 'servo_drive', 'linear_motor', 'linear_stage', 'ball_screw_stage', 'rotary_stage', 'encoder', 'motion_controller', 'gearbox', 'coupling', 'robot', 'robot_controller', 'gripper', 'end_effector'] },
  { layer: 'Controls', types: ['plc', 'hmi', 'ipc', 'sensor', 'safety_plc', 'safety_relay', 'light_curtain', 'safety_scanner', 'door_switch', 'emergency_stop', 'safety_controller', 'smps', 'circuit_breaker', 'contactor', 'cable', 'ups', 'panel'] },
  { layer: 'Vision', types: ['camera', 'vision_lens', 'telecentric_lens', 'lighting', 'vision_controller'] },
  { layer: 'Machine', types: ['frame', 'fixture', 'conveyor', 'guide_rail', 'enclosure', 'chiller', 'fume_extraction', 'cylinder', 'valve', 'regulator', 'vacuum_generator'] },
  { layer: 'Software', types: ['software', 'vision_software'] },
];

export interface LayerRow {
  layer: string;
  status: 'Imported' | 'Localized' | 'Partially localized' | 'Unknown' | 'No component selected';
  suppliers: string[];
  localAlternatives: string[];
  gap: string;
  risk: string[];
}
export function localizationLayers(deps: DependencyRow[], hasRecipe: boolean): LayerRow[] {
  const rows: LayerRow[] = LOCALIZATION_LAYERS.map(({ layer, types }) => {
    const d = deps.filter((x) => types.includes(x.sp.part.product_type));
    if (!d.length) return { layer, status: 'No component selected', suppliers: [], localAlternatives: [], gap: layer === 'Software' ? 'No software component recorded (TEAL LaserSuite / PLC code live outside the component database)' : '—', risk: [] };
    const loc = d.filter((x) => x.origin === 'Local').length;
    const imp = d.filter((x) => x.origin === 'Imported').length;
    const status: LayerRow['status'] = imp === 0 && loc > 0 ? 'Localized' : loc === 0 && imp > 0 ? 'Imported' : loc > 0 && imp > 0 ? 'Partially localized' : 'Unknown';
    const localAlternatives = [...new Set(d.filter((x) => x.origin !== 'Local').flatMap((x) => x.alternatives.filter((a) => a.origin === 'Local').map((a) => a.part.model_number)))];
    return {
      layer,
      status,
      suppliers: [...new Set(d.map((x) => `${x.manufacturer}${x.country ? ` (${x.country})` : ''}`))],
      localAlternatives,
      gap: status === 'Localized' ? 'None recorded' : localAlternatives.length ? `Local alternative(s) exist: ${localAlternatives.join(', ')} — qualification needed` : imp ? 'No local alternative in the database — capability gap' : 'Origin unknown',
      risk: [...new Set(d.flatMap((x) => x.risk))],
    };
  });
  rows.push({ layer: 'Application', status: hasRecipe ? 'Localized' : 'Unknown', suppliers: hasRecipe ? ['TEAL (recipe on record)'] : [], localAlternatives: [], gap: hasRecipe ? 'Recipe exists — validate it on customer samples' : 'No process recipe linked — application know-how not captured', risk: [] });
  return rows;
}

/* ---------------------------------------------------------------- supplier disruption (§145) */

export interface DisruptionResult {
  manufacturer: AnyRecord | undefined;
  days: number;
  affectedParts: (Part & AnyRecord)[];
  affectedScenarios: (Simulation & AnyRecord)[];
  affectedProjects: AnyRecord[];
  rows: { part: Part & AnyRecord; scenarios: string[]; alternatives: (Part & AnyRecord)[]; leadImpactWeeks: number; note: string }[];
  assumptions: string[];
}
export function supplierDisruption(manufacturerId: string, days: number, records: AnyRecord[]): DisruptionResult {
  const byId = new Map(records.map((r) => [r.id, r]));
  const parts = records.filter((r) => r.entity === 'part') as (Part & AnyRecord)[];
  const sims = records.filter((r) => r.entity === 'simulation') as (Simulation & AnyRecord)[];
  const affectedParts = parts.filter((p) => p.manufacturer_id === manufacturerId);
  const ids = new Set(affectedParts.map((p) => p.id));
  const affectedScenarios = sims.filter((s) => (s.selections ?? []).some((x) => ids.has(x.part_id)));
  const affectedProjects = [...new Set(affectedScenarios.map((s) => s.project_id).filter((x): x is string => !!x))].map((id) => byId.get(id)).filter((x): x is AnyRecord => !!x);
  const weeks = days / 7;
  const rows = affectedParts.map((p) => {
    const alternatives = parts.filter((a) => a.product_type === p.product_type && a.manufacturer_id !== manufacturerId && a.record_status !== 'Archived');
    const altLead = Math.min(...alternatives.map((a) => latestPrice(a)?.lead_time_weeks ?? Infinity));
    const leadImpactWeeks = alternatives.length && Number.isFinite(altLead) ? Math.min(weeks, altLead) : weeks;
    return {
      part: p,
      scenarios: affectedScenarios.filter((s) => (s.selections ?? []).some((x) => x.part_id === p.id)).map((s) => s.name),
      alternatives,
      leadImpactWeeks,
      note: alternatives.length ? (Number.isFinite(altLead) ? `Switching to the fastest alternative (${altLead} wk lead time) limits the delay — if it qualifies` : 'Alternative(s) exist; lead time not recorded') : 'No alternative in the database — full outage delay applies',
    };
  });
  return {
    manufacturer: byId.get(manufacturerId),
    days,
    affectedParts,
    affectedScenarios,
    affectedProjects,
    rows,
    assumptions: ['Alternatives are same-type parts from other manufacturers — each must be checked for compatibility and qualified before use', 'Lead-time impact = min(outage, alternative lead time) when an alternative has a recorded lead time', 'Cost impact uses recorded prices only; missing prices are not estimated'],
  };
}
