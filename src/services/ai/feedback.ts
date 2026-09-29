import { repo } from '../../repositories';
import { newLocalId } from '../../repositories/WorkspaceRepository';
import { workspaceDb, type AiLogRow } from '../../repositories/workspaceDb';
import { DatabaseService } from '../database';
import type { EngineeringAnswer } from './types';

/*
 * FEEDBACK, INTERACTION LOG AND DECISION RECORDS (AI master prompt §57, §58, §93–§95).
 *  - Interactions and Correct / Incorrect / Needs review feedback stay in this browser (IndexedDB) and
 *    can be exported as JSON for prompt / retrieval / routing improvement. Nothing is sent anywhere.
 *  - An engineering decision becomes a `decision` record draft (USER_CREATED) with the question, the
 *    options, the evidence ids, the AI output summary, the human decision and reason — it reaches GitHub
 *    only through the normal change-package review. Unverified AI output never trains anything.
 */

const ENGINE_KEY = 'ai:engines';

export async function engineOverrides(): Promise<Record<string, boolean>> {
  return (await DatabaseService.getSetting<Record<string, boolean>>(ENGINE_KEY)) ?? {};
}
export async function setEngineOverride(id: string, enabled: boolean): Promise<void> {
  const cur = await engineOverrides();
  await DatabaseService.setSetting(ENGINE_KEY, { ...cur, [id]: enabled });
}
export async function resetEngineOverrides(): Promise<void> {
  await DatabaseService.deleteSetting(ENGINE_KEY);
}

const row = (a: EngineeringAnswer): Omit<AiLogRow, 'kind'> => ({
  at: new Date().toISOString(),
  query: a.query,
  intent: a.intent,
  title: a.title,
  confidence: a.confidence.label,
  mode: a.mode,
  sources: a.sources.map((s) => `${s.kind}:${s.id}`),
  engines: [...new Set(a.trace.map((t) => t.engine))],
});

export async function logInteraction(a: EngineeringAnswer): Promise<void> {
  try {
    await workspaceDb().ai_log.add({ kind: 'interaction', ...row(a) });
  } catch {
    /* logging must never break the Copilot */
  }
}

export async function recordFeedback(a: EngineeringAnswer, feedback: NonNullable<AiLogRow['feedback']>, correction?: string): Promise<void> {
  await workspaceDb().ai_log.add({ kind: 'feedback', ...row(a), feedback, correction: correction?.trim() || undefined });
}

export async function aiLog(limit = 500): Promise<AiLogRow[]> {
  try {
    return await workspaceDb().ai_log.orderBy('at').reverse().limit(limit).toArray();
  } catch {
    return [];
  }
}

export async function clearAiLog(): Promise<void> {
  await workspaceDb().ai_log.clear();
}

export interface DecisionInput {
  question: string;
  options: string[];
  decision: string;
  reason: string;
  approver: string;
  answer: EngineeringAnswer;
  modified?: string;
}

/** Store a human engineering decision as a `decision` record draft (§58, §95). */
export async function recordDecision(d: DecisionInput): Promise<string> {
  const id = newLocalId('decision');
  const evidence = d.answer.sources.filter((s) => s.kind === 'record').map((s) => s.id).slice(0, 30);
  const aiSummary = [...d.answer.answer, ...d.answer.risks].map((c) => `[${c.cls}] ${c.text}`).slice(0, 8).join('\n');
  await repo().workspace.save(
    {
      id,
      entity: 'decision',
      name: d.question.slice(0, 120),
      question: d.question,
      context: [`AI-assisted (${d.answer.mode === 'local' ? 'local engines, no language model' : 'gateway'}) · intent ${d.answer.intent} · confidence ${d.answer.confidence.label}`, 'AI output (summary):', aiSummary, d.modified ? `Human modification: ${d.modified}` : '', `Reason: ${d.reason}`].filter(Boolean).join('\n'),
      options: d.options.filter(Boolean),
      evidence_ids: evidence,
      decision: d.decision,
      approver: d.approver,
      decided_on: new Date().toISOString().slice(0, 10),
      data_type: 'USER_CREATED',
      provenance: { verification_status: 'DRAFT', note: 'Engineering decision recorded from the TEAL Copilot. AI output is advisory; the decision and reason are the approver’s.' },
      tags: ['ai-assisted', 'decision'],
    },
    'Recorded an AI-assisted engineering decision',
  );
  return id;
}
