import type { Resolved } from '../sim/model';

/** Visual-only duration for a station whose time is not defined — used by the sequence preview. */
export const PREVIEW_STATION_S = 2;

/**
 * Sequence preview (3D master prompt §161, §162): when inputs are missing the machine can still be
 * walked through its sequence so the equipment is understandable, but every undefined station gets
 * the same visual placeholder, no variability and no failures, and nothing from a preview is
 * reported as a result.
 */
export function previewResolved(res: Resolved): Resolved {
  return { ...res, stations: res.stations.map((rs) => (rs.time != null ? rs : { ...rs, time: PREVIEW_STATION_S, basis: 'ASSUMPTION' as const, missing: [] })), blocking: [], runnable: true };
}
