import { calc, input, type CalcResult } from './types';

/**
 * PROJECT CALCULATIONS (final master prompt §44): progress and schedule variance. Definitions, not
 * handbook formula codes — shown with their formula and assumptions like every other calculation.
 */
const DEF = { citation: 'Definition (duration-weighted progress; schedule variance in calendar days)' };

/** Duration-weighted progress = Σ duration(completed tasks) / Σ duration(all tasks) */
export function projectProgress(p: { completed_days?: number | null; total_days?: number | null }): CalcResult {
  return calc(
    { id: 'project_progress', label: 'Project progress', formula: 'progress = Σ d_done / Σ d_all', unit: '%', source: DEF, assumptions: ['Each task counts by its planned duration', 'In-progress tasks count as not done'] },
    [input('Dd', 'Duration of completed tasks', p.completed_days, 'days'), input('Da', 'Duration of all tasks', p.total_days, 'days')],
    (v) => (v.Dd / v.Da) * 100,
    (v) => (v.Da > 0 && v.Dd >= 0 && v.Dd <= v.Da ? null : 'Need 0 ≤ completed ≤ total, total > 0'),
  );
}

/** Schedule variance SV = planned finish − forecast finish (days); negative = late */
export function scheduleVariance(p: { planned_finish_day?: number | null; forecast_finish_day?: number | null }): CalcResult {
  const r = calc(
    { id: 'schedule_variance', label: 'Schedule variance', formula: 'SV = T_planned − T_forecast', unit: 'days', source: DEF, assumptions: ['Days counted from the same reference date', 'Negative = behind schedule'] },
    [input('Tp', 'Planned finish (day)', p.planned_finish_day, 'day'), input('Tf', 'Forecast finish (day)', p.forecast_finish_day, 'day')],
    (v) => v.Tp - v.Tf,
  );
  if (r.value != null && r.value < 0) r.warnings.push(`${-r.value} day(s) behind plan`);
  return r;
}

/** From project tasks: completed / total planned days. */
export function progressFromTasks(tasks: { start: string; end: string; status: string }[]): { completed: number; total: number } {
  const d = (t: { start: string; end: string }) => Math.max(1, Math.round((Date.parse(t.end) - Date.parse(t.start)) / 864e5));
  return { completed: tasks.filter((t) => t.status === 'Completed').reduce((s, t) => s + d(t), 0), total: tasks.reduce((s, t) => s + d(t), 0) };
}
