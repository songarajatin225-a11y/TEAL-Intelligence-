import type { AnyRecord } from '../../domain';
import type { Company, GateDefinition, Supplier } from '../../domain/entities';
import type { Application, Material } from '../../domain/entities';
import type { ConfiguratorEngine } from '../../features/configurator/engine';
import { checkSelection, type CompatCtx, type PairResult } from '../eng/compatibility';
import { buildDraftPackage, type DraftPackage, type Lexicon } from '../inquiry';
import { solve, type AutomationLevel, type SolutionResult } from '../solution';
import { componentCandidates, extractRequirements, laserCandidates, matchTemplates, type ComponentPick, type ExtractedRequirements, type LaserCandidate, type TemplateMatch } from './agents';

/*
 * AI PRODUCT CONFIGURATOR (AI master prompt §20, §76, §104). One pipeline, every stage inspectable:
 *   requirement extraction → material + application → technology candidates → platform match →
 *   configuration (physics, compatibility, modules) → architecture → preliminary BOM → supplier
 *   candidates → known cost / price band → components from the engineering database → compatibility
 *   of the picked set → equipment template for the 3D digital twin → data gaps → validation required.
 * It reuses the inquiry package builder and the application engine unchanged; it persists nothing.
 */

export interface ConfigureDeps {
  records: AnyRecord[];
  engine: ConfiguratorEngine | null;
  lexicon: Lexicon | null;
  compat: CompatCtx;
  newId: (entity: string) => string;
  today?: string;
}

export interface ConfigureResult {
  req: ExtractedRequirements;
  lasers: LaserCandidate[];
  pkg: DraftPackage | null;
  solution: SolutionResult | null;
  components: ComponentPick[];
  compat: PairResult[];
  templates: TemplateMatch[];
  cost: { currency: string; knownTotal: number; knownLines: number; unknownLines: number; band: [number, number] | null; estimate: number | null; basis: string };
  gaps: string[];
  validation: string[];
}

const AUTOMATION_MAP: [RegExp, AutomationLevel][] = [
  [/fully automatic|full automation|robot/i, 'Fully automatic'],
  [/inline|in-line/i, 'Inline'],
  [/semi/i, 'Semi-automatic'],
  [/manual/i, 'Manual'],
];

export function configure(text: string, deps: ConfigureDeps): ConfigureResult {
  const { records } = deps;
  const req = extractRequirements(text, records, deps.lexicon);
  const lasers = laserCandidates(req, records);

  let pkg: DraftPackage | null = null;
  if (deps.engine && deps.lexicon) {
    const by = <T,>(e: string) => records.filter((r) => r.entity === e) as unknown as T[];
    pkg = buildDraftPackage(text, {
      engine: deps.engine,
      lexicon: deps.lexicon,
      applications: by<Application>('application'),
      materials: by<Material>('material'),
      suppliers: by<Supplier>('supplier'),
      companies: by<Company>('company'),
      gates: by<GateDefinition>('gate_definition'),
      newId: deps.newId,
      today: deps.today,
    });
  }

  let solution: SolutionResult | null = null;
  if (pkg?.matches[0] && deps.engine) {
    const top = pkg.matches[0];
    const automation = AUTOMATION_MAP.find(([re]) => re.test(String(req.automation.value ?? '')))?.[1];
    solution = solve({ applicationId: pkg.application?.id, productKey: top.product.key, automation, throughputUph: typeof req.throughput.value === 'number' ? req.throughput.value : null, accuracyUm: typeof req.accuracy.value === 'number' && req.accuracy.unit === 'µm' ? req.accuracy.value : null }, records, deps.engine);
  }

  const process = typeof req.process.value === 'string' ? req.process.value : null;
  const components = componentCandidates(process, lasers[0] ?? null, records);
  const picked = components.map((c) => c.parts[0]).filter((p): p is NonNullable<typeof p> => !!p);
  const compat = checkSelection(picked, deps.compat);
  const templates = matchTemplates(req, records);

  const lines = pkg?.bom?.lines ?? [];
  const known = lines.filter((l) => l.level !== 'Product' && l.unit_cost != null && l.unit_cost > 0);
  const snap = pkg?.configuration?.snapshot;
  const cost = {
    currency: 'INR',
    knownTotal: known.reduce((a, l) => a + (l.unit_cost ?? 0) * l.quantity, 0),
    knownLines: known.length,
    unknownLines: lines.filter((l) => l.level !== 'Product' && (l.unit_cost == null || l.unit_cost <= 0)).length,
    band: (snap?.price_band_inr as [number, number] | null | undefined) ?? null,
    estimate: (snap?.price_estimate_inr as number | null | undefined) ?? null,
    basis: 'Configurator list-price ESTIMATES (legacy pricing rules) — not quotations',
  };

  const gaps = [...req.missing.map((m) => `${m}: Not Defined`), ...(pkg?.openQuestions ?? [])];
  if (!lasers.length) gaps.push(req.process.status === 'NOT DEFINED' && req.material.status === 'NOT DEFINED' ? 'State the process (marking, welding, cutting …) and the material — technology candidates need at least one of them' : 'No TEAL application record or absorption data links this material and process to a laser technology');
  if (!pkg?.matches.length) gaps.push('No TEAL platform matched the requirement — new development candidate');
  const validation = [
    'Process feasibility on customer samples (POC / DOE) — no process result exists for this requirement',
    ...(req.quality.status === 'STATED' ? [`Quality criterion “${req.quality.value}” — define the measurement method and acceptance limit`] : []),
    ...(typeof req.cycleTime.value === 'number' ? [`Cycle time ${req.cycleTime.value} s — verify run-at-rate at FAT (handling, marking and vision time included)`] : []),
    'Laser safety of the enclosure (e.g. IEC 60825-1 Class 1) — conformity must be assessed, not assumed',
    ...(compat.some((c) => c.relationship === 'Unknown' || c.relationship === 'ConditionallyCompatible') ? ['Component interfaces with Unknown / conditional compatibility — confirm with datasheets'] : []),
  ];
  return { req, lasers, pkg, solution, components, compat, templates, cost, gaps: [...new Set(gaps)], validation };
}
