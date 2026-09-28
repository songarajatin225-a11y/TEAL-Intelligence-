import type { CycleResult } from '../sim/capacity';
import type { Resolved } from '../sim/model';
import type { ReviewIssue } from '../sim/review';
import type { CollisionHit } from './collision';
import type { MachineModel } from './machine';

/*
 * MACHINE DESIGN CHECK (3D master prompt §113, §114, §161). Every item comes from a defined rule and
 * names where to fix it: a Studio tab, a record, or a 3D object. The simulation-level design review
 * (services/sim/review) is reused, not re-implemented (§178).
 */

export type CheckArea = 'Geometry' | 'Motion' | 'Collision' | 'Requirement' | 'Compatibility' | 'BOM' | 'Simulation' | 'Safety' | 'Supplier' | 'Service' | 'Input gap';

export interface TwinCheck {
  area: CheckArea;
  severity: 'critical' | 'major' | 'minor' | 'ok';
  text: string;
  /** Studio tab to fix it, a record id, or a 3D object id */
  tab?: string;
  recordId?: string;
  objectId?: string;
  rule: string;
}

const areaOf = (section: string): CheckArea => (/compat|interface|optic|laser|controls|electrical/i.test(section) ? 'Compatibility' : /cost|bom/i.test(section) ? 'BOM' : /supplier|supply|local/i.test(section) ? 'Supplier' : /requirement/i.test(section) ? 'Requirement' : /safety/i.test(section) ? 'Safety' : /service|maint/i.test(section) ? 'Service' : /mechanical|footprint/i.test(section) ? 'Geometry' : 'Simulation');

export function twinChecks(res: Resolved, model: MachineModel, cycle: CycleResult | null, collisions: CollisionHit[], review: ReviewIssue[]): TwinCheck[] {
  const out: TwinCheck[] = [];
  const sim = res.sim;
  // §161 simulation input gaps
  for (const b of res.blocking) out.push({ area: 'Input gap', severity: 'critical', text: `Simulation input gap: ${b}`, tab: /axis/i.test(b) ? 'machine3d' : 'architecture', rule: 'Simulation cannot run on an undefined value (§162)' });
  // geometry: f-theta field vs required process area
  for (const l of model.lasers) {
    if (!model.processArea) continue;
    const need = Math.max(model.processArea.x, model.processArea.y);
    if (l.field == null) out.push({ area: 'Geometry', severity: 'major', text: 'F-theta scan field is not stated — the marking area cannot be checked', objectId: l.fthetaId, tab: 'laser', rule: 'field ≥ required process area' });
    else if (l.field < need) out.push({ area: 'Geometry', severity: 'critical', text: `Selected f-theta field (${l.field} × ${l.field} mm) is smaller than the required marking area (${model.processArea.x} × ${model.processArea.y} mm)`, objectId: l.fthetaId, tab: 'components', rule: 'field ≥ required process area' });
    else out.push({ area: 'Geometry', severity: 'ok', text: `Marking field ${l.field} × ${l.field} mm covers the required ${model.processArea.x} × ${model.processArea.y} mm`, objectId: l.fthetaId, rule: 'field ≥ required process area' });
  }
  // geometry: camera FOV vs target area
  for (const v of model.vision) {
    if (v.missing.length) {
      out.push({ area: 'Geometry', severity: 'minor', text: `Camera field of view cannot be computed — missing ${v.missing.join(', ')}`, objectId: v.cameraId, tab: 'machine3d', rule: 'FOV ≥ target area' });
      continue;
    }
    if (!v.target) continue;
    if (v.fovX! < v.target.x || v.fovY! < v.target.y) out.push({ area: 'Geometry', severity: 'critical', text: `Selected camera FOV (${v.fovX!.toFixed(1)} × ${v.fovY!.toFixed(1)} mm) does not cover the target area (${v.target.x} × ${v.target.y} mm)`, objectId: v.cameraId, tab: 'components', rule: 'FOV ≥ target area' });
    else out.push({ area: 'Geometry', severity: 'ok', text: `Camera FOV ${v.fovX!.toFixed(1)} × ${v.fovY!.toFixed(1)} mm covers the ${v.target.x} × ${v.target.y} mm target`, objectId: v.cameraId, rule: 'FOV ≥ target area' });
  }
  // motion: stroke and limits
  for (const m of model.plan) for (const v of m.limitViolations) out.push({ area: 'Motion', severity: 'critical', text: `Configured axis travel is below the required stroke — ${v}`, tab: 'machine3d', rule: 'target within axis travel' });
  for (const a of model.axes) if (a.stroke == null) out.push({ area: 'Motion', severity: 'minor', text: `${a.name}: travel not stated — limits cannot be checked`, recordId: a.partId, rule: 'axis travel defined' });
  // collisions
  if (collisions.length) for (const h of collisions) out.push({ area: 'Collision', severity: 'critical', text: h.text, objectId: h.a, rule: 'bounding-box clearance along every move' });
  else if (model.plan.length) out.push({ area: 'Collision', severity: 'ok', text: `No bounding-box interference along ${model.plan.length} planned moves`, rule: 'bounding-box clearance along every move' });
  // throughput
  const target = sim.targets?.uph;
  if (cycle && target) {
    if (cycle.practicalUph < target) out.push({ area: 'Simulation', severity: 'critical', text: `Simulation cannot satisfy the required throughput with the current configuration: ${cycle.practicalUph.toFixed(0)} UPH practical vs ${target} UPH target (bottleneck ${cycle.bottleneck.rs.station.name})`, tab: 'capacity', rule: 'practical UPH ≥ target' });
    else out.push({ area: 'Simulation', severity: 'ok', text: `Practical ${cycle.practicalUph.toFixed(0)} UPH meets the ${target} UPH target`, tab: 'capacity', rule: 'practical UPH ≥ target' });
  }
  // footprint
  const fp = (model.dims.width * model.dims.depth) / 1e6;
  if (sim.targets?.footprint_m2 && fp > sim.targets.footprint_m2) out.push({ area: 'Geometry', severity: 'major', text: `Conceptual footprint ${fp.toFixed(2)} m² exceeds the ${sim.targets.footprint_m2} m² limit`, rule: 'footprint ≤ limit' });
  // safety: laser station without enclosure / door interlock
  if (model.lasers.length && !model.objects.some((o) => o.id === 'enclosure' && o.partId)) out.push({ area: 'Safety', severity: 'major', text: 'No enclosure component is selected for a laser machine — the enclosure is drawn conceptually only', tab: 'components', rule: 'laser machine has an enclosure record' });
  // reuse the simulation design review (compatibility, BOM, supplier, requirements …)
  for (const r of review) out.push({ area: areaOf(r.section), severity: r.severity === 'blocker' ? 'critical' : r.severity, text: r.message, recordId: r.recordId, tab: 'review', rule: `Design review — ${r.section}${r.potential ? ' (potential)' : ''}` });
  const order = { critical: 0, major: 1, minor: 2, ok: 3 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}
