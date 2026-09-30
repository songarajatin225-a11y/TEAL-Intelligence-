/*
 * AI LAYER CONTRACTS (AI master prompt §9, §61, §65, §106). Typed shapes shared by the orchestrator,
 * the agents, the validator and the UI. Agents talk through these structures — never free prose.
 */

/** §106 — honest feature state, shown next to every AI capability. */
export type FeatureState = 'LIVE' | 'BETA' | 'PROTOTYPE' | 'DATA REQUIRED' | 'EXPERIMENTAL' | 'FUTURE';
/** §85 — runtime status of an engine / model. */
export type EngineStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'EXPERIMENTAL';
/** §9 — every claim in an answer is classified; nothing is silently asserted. */
export type ClaimClass = 'VERIFIED' | 'INFERRED' | 'ESTIMATED' | 'ASSUMED' | 'UNKNOWN' | 'CONFLICTING';
/** §61 — confidence is a label derived from measurable signals, never an invented percentage. */
export type ConfidenceLabel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT DATA';

export type Intent =
  | 'explain'
  | 'search'
  | 'find_parts'
  | 'compare'
  | 'alternatives'
  | 'compatibility'
  | 'configure'
  | 'laser_selection'
  | 'bom'
  | 'cost'
  | 'supplier'
  | 'supply_risk'
  | 'change_impact'
  | 'rfq'
  | 'urs'
  | 'fmea'
  | 'traceability'
  | 'project_status'
  | 'calculate'
  | 'cycle_time'
  | 'doe'
  | 'optimize_process'
  | 'predict'
  | 'forecast'
  | 'maintenance'
  | 'vision'
  | 'open_3d';

export interface SourceRef {
  kind: 'record' | 'handbook' | 'engine' | 'rule' | 'user';
  /** record id, handbook ref (`book/file.md#anchor`) or engine id */
  id: string;
  label: string;
  href?: string;
  data_type?: string;
  verification?: string;
  /** field, section or step the claim relies on */
  locator?: string;
  /** the exact value or passage cited */
  excerpt?: string;
}

export interface ClaimValue {
  value: number;
  unit: string;
  /** record field the value was read from (the validator re-reads it) */
  field?: string;
  recordId?: string;
}

export interface Claim {
  text: string;
  cls: ClaimClass;
  sources: SourceRef[];
  values?: ClaimValue[];
}

export interface AnswerTable {
  title: string;
  columns: string[];
  rows: { cells: string[]; href?: string; cls?: ClaimClass }[];
  note?: string;
}

export interface AnswerAction {
  kind: 'open' | 'open3d' | 'build3d' | 'draft' | 'decision' | 'ask' | 'copy';
  label: string;
  href?: string;
  /** for `ask`: the follow-up question */
  query?: string;
  /** for `open3d`: equipment template to start a scenario from */
  templateId?: string;
  uph?: number | null;
  /** for `build3d`: components the machine is built from, and the process */
  partIds?: string[];
  process?: string;
}

export interface ConflictNote {
  subject: string;
  field: string;
  values: { value: string; source: SourceRef }[];
}

export interface TraceStep {
  step: string;
  engine: string;
  status: 'ok' | 'skipped' | 'fallback' | 'offline' | 'error' | 'disabled';
  detail: string;
  ms: number;
}

export interface VerificationCheck {
  check: 'sources' | 'database' | 'units' | 'constraints' | 'conflicts' | 'review';
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}
export interface VerificationReport {
  checks: VerificationCheck[];
  /** claims whose sources could not be verified — removed from the answer body, listed here */
  rejected: Claim[];
  reviewRequired: boolean;
}

export interface ConfidenceSignal {
  signal: 'Source quality' | 'Data coverage' | 'Retrieval agreement' | 'Constraint satisfaction' | 'Model uncertainty' | 'Historical validation';
  level: 'high' | 'medium' | 'low' | 'n/a';
  detail: string;
}
export interface ConfidenceResult {
  label: ConfidenceLabel;
  signals: ConfidenceSignal[];
  reason: string;
}

export interface EngineeringAnswer {
  query: string;
  intent: Intent;
  title: string;
  /** ANSWER */
  answer: Claim[];
  /** TECHNICAL BASIS */
  basis: Claim[];
  /** EVIDENCE */
  evidence: Claim[];
  /** ALTERNATIVES */
  alternatives: Claim[];
  /** CONSTRAINTS */
  constraints: Claim[];
  /** RISKS */
  risks: Claim[];
  /** ASSUMPTIONS */
  assumptions: Claim[];
  /** DATA GAPS */
  gaps: Claim[];
  /** VALIDATION REQUIRED */
  validation: Claim[];
  tables: AnswerTable[];
  actions: AnswerAction[];
  conflicts: ConflictNote[];
  confidence: ConfidenceResult;
  verification: VerificationReport;
  /** SOURCES — de-duplicated */
  sources: SourceRef[];
  trace: TraceStep[];
  /** 'local' = deterministic engines + template composer (no language model) */
  mode: 'local' | 'gateway';
  draft?: { kind: 'rfq' | 'urs' | 'fmea'; title: string; markdown: string };
  /** agent messages exchanged for this answer (§65) */
  agents: AgentMessage[];
}

/** §65 — structured agent contract. */
export type AgentId = 'requirements' | 'laser' | 'component' | 'compatibility' | 'bom' | 'supplier' | 'cost' | 'process' | 'document' | 'verification' | 'research' | 'project';
export interface AgentMessage<T = unknown> {
  agent: AgentId;
  task: string;
  requirements: Record<string, unknown>;
  constraints: string[];
  candidates: T[];
  evidence: SourceRef[];
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  verification_required: boolean;
  notes: string[];
}

export const EMPTY_SECTIONS = (): Pick<EngineeringAnswer, 'answer' | 'basis' | 'evidence' | 'alternatives' | 'constraints' | 'risks' | 'assumptions' | 'gaps' | 'validation' | 'tables' | 'actions' | 'conflicts' | 'agents'> => ({
  answer: [],
  basis: [],
  evidence: [],
  alternatives: [],
  constraints: [],
  risks: [],
  assumptions: [],
  gaps: [],
  validation: [],
  tables: [],
  actions: [],
  conflicts: [],
  agents: [],
});

/** The exact sentence the platform uses when the knowledge base holds nothing (§10). */
export const NOT_AVAILABLE = 'Data not available in the TEAL Intelligence knowledge base.';
