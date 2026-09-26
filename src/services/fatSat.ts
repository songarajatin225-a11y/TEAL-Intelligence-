import type { AcceptanceProtocol, AcceptanceTest, Project, Requirement } from '../domain/entities';

/**
 * FAT / SAT generation (spec §73–§74). Tests come from two places:
 *  1. every requirement of the project/opportunity (requirement → test traceability), and
 *  2. the Automation Handbook checklists (§38.8 FAT, §57.13 SAT readiness, §40.4 SAT template).
 * Results start NOT RUN; nothing is pre-passed.
 */
export interface ChecklistSection {
  ref: string;
  heading: string;
  items: { section: string; item: string }[];
}
export interface AcceptanceChecklists {
  fat: ChecklistSection;
  fat_readiness: ChecklistSection;
  sat_readiness: ChecklistSection;
  production_release: ChecklistSection;
}

// SAT sections from the handbook SAT protocol template (§40.4), in the spec §74 order.
const SAT_TEMPLATE: { section: string; test: string }[] = [
  { section: 'Installation', test: 'Installation log complete; transport locks removed and recorded' },
  { section: 'Calibration', test: 'References re-measured; recalibration records attached' },
  { section: 'Run-at-rate', test: 'Run-at-rate: duration, shifts, variants, stop-reason logging, OEE calculation method agreed and met' },
  { section: 'Production trial', test: 'Production trial on customer parts with customer operators' },
  { section: 'Training', test: 'Operators, technicians, engineers: attendance and competence check records' },
  { section: 'Documentation handover', test: 'Manuals, as-built drawings, spare list, software backups, calibration certificates, safety documents handed over' },
  { section: 'Acceptance', test: 'Open items with owners and dates · acceptance certificate · warranty start date' },
];

export function requirementTests(prefix: string, reqs: Requirement[]): AcceptanceTest[] {
  return reqs.map((r, i) => ({
    test_id: `${prefix}-R${String(i + 1).padStart(3, '0')}`,
    requirement_id: r.id,
    section: 'Requirements',
    test: `${r.code}: ${r.name}`,
    method: r.verification_method ?? 'UNKNOWN — define verification method',
    expected: r.acceptance_criterion ?? (r.value ? `${r.value} ${r.unit ?? ''}`.trim() : 'UNKNOWN — define acceptance criterion'),
    result: 'NOT RUN',
  }));
}

export function generateProtocol(phase: 'FAT' | 'SAT', project: Pick<Project, 'id' | 'name'>, reqs: Requirement[], ck: AcceptanceChecklists | null, newId: (e: string) => string): AcceptanceProtocol {
  const tests: AcceptanceTest[] = requirementTests(phase, reqs);
  let n = 1;
  const add = (section: string, test: string, method = 'Inspection / Demonstration') => tests.push({ test_id: `${phase}-C${String(n++).padStart(3, '0')}`, section, test, method, expected: 'Per protocol', result: 'NOT RUN' });
  if (phase === 'FAT' && ck) for (const it of ck.fat.items) add(it.section, it.item);
  if (phase === 'SAT') {
    if (ck) for (const it of ck.sat_readiness.items) add('Site readiness & safety (G9)', it.item);
    for (const s of SAT_TEMPLATE) add(s.section, s.test);
  }
  return {
    id: newId('acceptance'),
    entity: 'acceptance',
    name: `${phase} protocol — ${project.name}`,
    phase,
    project_id: project.id,
    tests,
    data_type: 'USER_CREATED',
    provenance: { verification_status: 'DRAFT', source_id: 'src-automation-handbook', section: phase === 'FAT' ? `${ck?.fat.heading ?? '38.8'} + requirements` : `${ck?.sat_readiness.heading ?? '57.13'} + 40.4 SAT template + requirements`, note: 'Generated; results NOT RUN until executed.' },
    next_action: { action: `Review ${phase} protocol with the customer before execution` },
  };
}

export function protocolSummary(p: AcceptanceProtocol) {
  const by = (r: AcceptanceTest['result']) => p.tests.filter((t) => t.result === r).length;
  return { total: p.tests.length, pass: by('PASS'), dev: by('PASS WITH DEVIATION'), fail: by('FAIL'), notRun: by('NOT RUN') };
}
