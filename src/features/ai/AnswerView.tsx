import clsx from 'clsx';
import { AlertTriangle, BookOpen, Box, CheckCircle2, ChevronDown, ChevronRight, ClipboardCopy, Download, FileText, Gavel, Link2, MessageSquarePlus, ShieldAlert, Sparkles, ThumbsDown, ThumbsUp, TriangleAlert } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '../../components/toast';
import { Badge, Button, Field, Input, Modal, Textarea, type Tone } from '../../components/ui';
import { repo } from '../../repositories';
import { newLocalId } from '../../repositories/WorkspaceRepository';
import { recordDecision, recordFeedback } from '../../services/ai/feedback';
import { INTENT_LABEL } from '../../services/ai/intent';
import type { AnswerAction, AnswerTable, Claim, ClaimClass, ConfidenceLabel, EngineeringAnswer, SourceRef } from '../../services/ai/types';
import { scenarioFromTemplate } from '../../services/sim/build';
import { useData } from '../../hooks/useData';
import { todayIso } from '../../utils/dates';
import type { EquipmentTemplate } from '../../domain/engineering';
import type { AnyRecord } from '../../domain';

/*
 * The response contract rendered (AI master prompt §9, §105): ANSWER · TECHNICAL BASIS · EVIDENCE ·
 * ALTERNATIVES · CONSTRAINTS · RISKS · ASSUMPTIONS · DATA GAPS · VALIDATION REQUIRED · CONFIDENCE ·
 * SOURCES. Every claim shows its class; every source is a link. Nothing is hidden behind a summary.
 */

export const CLASS_TONE: Record<ClaimClass, Tone> = { VERIFIED: 'ok', INFERRED: 'info', ESTIMATED: 'warn', ASSUMED: 'draft', UNKNOWN: 'neutral', CONFLICTING: 'bad' };
export const CONF_TONE: Record<ConfidenceLabel, Tone> = { HIGH: 'ok', MEDIUM: 'warn', LOW: 'bad', 'INSUFFICIENT DATA': 'neutral' };
const CLASS_HELP: Record<ClaimClass, string> = {
  VERIFIED: 'Stated in a verified or source-documented record or handbook section',
  INFERRED: 'Derived by a rule or engine from sourced data',
  ESTIMATED: 'An estimate (list price, calculated bound, model posterior) — not a measured or quoted value',
  ASSUMED: 'An assumption or DEMO (fictional) data — must be confirmed',
  UNKNOWN: 'Not known — a data gap',
  CONFLICTING: 'Sources disagree or a rule is violated — engineering verification required',
};

function SourceChip({ s }: { s: SourceRef }) {
  const body = (
    <>
      {s.kind === 'handbook' ? <BookOpen className="size-3" aria-hidden /> : s.kind === 'record' ? <Link2 className="size-3" aria-hidden /> : <Sparkles className="size-3" aria-hidden />}
      <span className="max-w-[16rem] truncate">{s.label}</span>
      {s.data_type === 'DEMO' && <span className="font-semibold text-demo">DEMO</span>}
    </>
  );
  const cls = 'inline-flex items-center gap-1 rounded-full border border-line px-1.5 py-0.5 text-micro text-ink-2';
  const title = [s.kind === 'engine' ? 'Engine' : s.kind === 'rule' ? 'Rule' : s.kind === 'user' ? 'Your input' : s.kind === 'handbook' ? 'Handbook section' : 'Record', s.locator ? `· ${s.locator}` : '', s.verification ? `· ${s.verification}` : '', s.excerpt ? `\n“${s.excerpt.slice(0, 240)}”` : ''].join(' ');
  return s.href ? (
    <Link to={s.href} className={clsx(cls, 'hover:border-accent hover:text-accent-2')} title={title}>
      {body}
    </Link>
  ) : (
    <span className={cls} title={title}>
      {body}
    </span>
  );
}

function ClaimList({ claims, empty }: { claims: Claim[]; empty?: string }) {
  if (!claims.length) return empty ? <p className="text-meta text-ink-3">{empty}</p> : null;
  return (
    <ul className="space-y-2">
      {claims.map((c, i) => (
        <li key={i} className="text-body">
          <div className="flex flex-wrap items-start gap-1.5">
            <Badge tone={CLASS_TONE[c.cls]} title={CLASS_HELP[c.cls]} className="mt-0.5">
              {c.cls}
            </Badge>
            <span className="min-w-0 flex-1 leading-relaxed">{c.text}</span>
          </div>
          {c.sources.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1 pl-[4.5rem]">
              {c.sources.slice(0, 6).map((s) => (
                <SourceChip key={`${s.kind}:${s.id}`} s={s} />
              ))}
              {c.sources.length > 6 && <span className="text-micro text-ink-3">+{c.sources.length - 6} more</span>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children, tone }: { title: string; children: ReactNode; tone?: 'warn' | 'bad' }) {
  return (
    <section className="border-t border-line pt-3">
      <h3 className={clsx('mb-2 text-micro font-semibold uppercase tracking-[0.08em]', tone === 'bad' ? 'text-bad' : tone === 'warn' ? 'text-warn' : 'text-ink-3')}>{title}</h3>
      {children}
    </section>
  );
}

export function AnswerTableView({ t }: { t: AnswerTable }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-meta font-semibold">{t.title}</div>
      <div className="scroll-thin max-h-80 overflow-auto rounded-control border border-line" tabIndex={0} role="region" aria-label={t.title}>
        <table className="w-full border-collapse text-left text-meta">
          <thead className="sticky top-0 bg-solid">
            <tr className="border-b border-line text-micro text-ink-3">
              {t.columns.map((c) => (
                <th key={c} scope="col" className="whitespace-nowrap px-2 py-1.5 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={i} className="border-b border-line last:border-0 align-top hover:bg-accent-soft/30">
                {r.cells.map((cell, j) => (
                  <td key={j} className={clsx('px-2 py-1.5', j === 0 && 'font-medium')}>
                    {j === 0 && r.cls && (
                      <>
                        <span className={clsx('mr-1 inline-block size-1.5 rounded-full align-middle', { VERIFIED: 'bg-ok', INFERRED: 'bg-info', ESTIMATED: 'bg-warn', ASSUMED: 'bg-draft', UNKNOWN: 'bg-ink-3', CONFLICTING: 'bg-bad' }[r.cls])} title={r.cls} aria-hidden />
                        <span className="sr-only">{r.cls}: </span>
                      </>
                    )}
                    {j === 0 && r.href ? (
                      <Link to={r.href} className="text-accent-2 hover:underline">
                        {cell}
                      </Link>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {t.note && <p className="mt-1 text-micro text-ink-3">{t.note}</p>}
    </div>
  );
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DraftView({ d }: { d: NonNullable<EngineeringAnswer['draft']> }) {
  const [text, setText] = useState(d.markdown);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="draft">DRAFT — ENGINEERING REVIEW REQUIRED</Badge>
        <span className="text-meta font-semibold">{d.title}</span>
      </div>
      <Textarea aria-label={`${d.kind.toUpperCase()} draft (editable)`} value={text} onChange={(e) => setText(e.target.value)} className="h-72 font-mono text-micro" />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => navigator.clipboard?.writeText(text).then(() => toast('Draft copied', { tone: 'success' }), () => toast('Copy failed', { tone: 'error' }))}>
          <ClipboardCopy className="size-3.5" aria-hidden /> Copy
        </Button>
        <Button size="sm" onClick={() => download(`${d.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`, text)}>
          <Download className="size-3.5" aria-hidden /> Download .md
        </Button>
      </div>
    </div>
  );
}

function DecisionModal({ a, open, onClose }: { a: EngineeringAnswer; open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const [question, setQuestion] = useState(a.query);
  const [options, setOptions] = useState(a.alternatives.map((c) => c.text.slice(0, 120)).concat(a.answer.slice(0, 1).map((c) => c.text.slice(0, 120))).join('\n'));
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [approver, setApprover] = useState('');
  const [modified, setModified] = useState('');
  const ok = decision.trim() && reason.trim() && approver.trim();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record an engineering decision"
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!ok}
            onClick={async () => {
              const id = await recordDecision({ question, options: options.split('\n').map((x) => x.trim()), decision, reason, approver, answer: a, modified });
              toast('Decision saved as a local draft', { tone: 'draft', detail: 'Export it with a change package to make it permanent.' });
              onClose();
              nav(`/record/${encodeURIComponent(id)}`);
            }}
          >
            <Gavel className="size-4" aria-hidden /> Save decision
          </Button>
        </>
      }
    >
      <p className="mb-3 text-meta text-ink-3">The AI output is advisory. The decision, the reason and the approver are yours; the answer’s sources are stored as evidence.</p>
      <div className="space-y-2">
        <Field label="Question" htmlFor="dm-q">
          <Input id="dm-q" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </Field>
        <Field label="Options considered (one per line)" htmlFor="dm-o">
          <Textarea id="dm-o" value={options} onChange={(e) => setOptions(e.target.value)} className="h-24" />
        </Field>
        <Field label="Decision" htmlFor="dm-d">
          <Input id="dm-d" value={decision} onChange={(e) => setDecision(e.target.value)} />
        </Field>
        <Field label="Reason" htmlFor="dm-r">
          <Textarea id="dm-r" value={reason} onChange={(e) => setReason(e.target.value)} className="h-20" />
        </Field>
        <Field label="Where you changed the AI recommendation (optional)" htmlFor="dm-m">
          <Input id="dm-m" value={modified} onChange={(e) => setModified(e.target.value)} />
        </Field>
        <Field label="Approver (engineer)" htmlFor="dm-a">
          <Input id="dm-a" value={approver} onChange={(e) => setApprover(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

function Feedback({ a }: { a: EngineeringAnswer }) {
  const [sent, setSent] = useState<string | null>(null);
  const [correction, setCorrection] = useState('');
  const [open, setOpen] = useState(false);
  const send = async (f: 'correct' | 'incorrect' | 'needs_review') => {
    await recordFeedback(a, f, correction);
    setSent(f);
    toast('Feedback recorded in this browser', { tone: 'success' });
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-micro text-ink-3">Was this right?</span>
      <Button size="sm" variant="ghost" aria-pressed={sent === 'correct'} onClick={() => send('correct')}>
        <ThumbsUp className="size-3.5" aria-hidden /> Correct
      </Button>
      <Button size="sm" variant="ghost" aria-pressed={sent === 'incorrect'} onClick={() => setOpen(true)}>
        <ThumbsDown className="size-3.5" aria-hidden /> Incorrect
      </Button>
      <Button size="sm" variant="ghost" aria-pressed={sent === 'needs_review'} onClick={() => send('needs_review')}>
        <TriangleAlert className="size-3.5" aria-hidden /> Needs review
      </Button>
      {open && (
        <div className="flex w-full gap-1.5">
          <Input aria-label="What is wrong? (correction)" placeholder="What is wrong? (optional correction)" value={correction} onChange={(e) => setCorrection(e.target.value)} className="flex-1" />
          <Button size="sm" onClick={() => (send('incorrect'), setOpen(false))}>
            Send
          </Button>
        </div>
      )}
    </div>
  );
}

export function AnswerView({ a, onAsk, compact }: { a: EngineeringAnswer; onAsk: (q: string) => void; compact?: boolean }) {
  const nav = useNavigate();
  const { byId } = useData();
  const [trace, setTrace] = useState(false);
  const [decision, setDecision] = useState(false);
  const act = async (x: AnswerAction) => {
    if (x.kind === 'ask' && x.query) onAsk(x.query);
    else if (x.kind === 'open' && x.href) nav(x.href);
    else if (x.kind === 'decision') setDecision(true);
    else if (x.kind === 'open3d' && x.templateId) {
      const tpl = byId.get(x.templateId) as (EquipmentTemplate & AnyRecord) | undefined;
      if (!tpl) return;
      const sim = scenarioFromTemplate(tpl, { newId: newLocalId, today: todayIso(), name: `Copilot draft — ${tpl.name}`, uph: x.uph ?? null });
      const rec = { ...sim, tags: ['ai-assisted', 'draft'], provenance: { verification_status: 'DRAFT', note: `Created from the TEAL Copilot for “${a.query.slice(0, 160)}”. Conceptual scenario — station times and components must be entered; engineering review required.` } };
      await repo().workspace.save(rec as unknown as Record<string, unknown>, `Copilot 3D scenario: ${rec.name}`);
      toast('Draft scenario created', { tone: 'draft', detail: 'It previews as a labelled sequence until its inputs exist.' });
      nav(`/studio/${encodeURIComponent(rec.id)}?tab=machine3d`);
    }
  };
  const actionIcon = (k: AnswerAction['kind']) => (k === 'open3d' ? Box : k === 'decision' ? Gavel : k === 'ask' ? MessageSquarePlus : FileText);
  const sections: [string, Claim[], ('warn' | 'bad')?][] = [
    ['Technical basis', a.basis],
    ['Evidence', a.evidence],
    ['Alternatives', a.alternatives],
    ['Constraints', a.constraints],
    ['Risks', a.risks, 'warn'],
    ['Assumptions', a.assumptions],
    ['Data gaps', a.gaps],
    ['Validation required', a.validation, 'warn'],
  ];
  return (
    <article className="space-y-3" aria-label={`Answer: ${a.title}`}>
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="text-lead font-semibold">{a.title}</h3>
        <Badge tone="accent">{INTENT_LABEL[a.intent]}</Badge>
        <Badge tone={CONF_TONE[a.confidence.label]} title={a.confidence.reason}>
          Confidence: {a.confidence.label}
        </Badge>
        <Badge tone="neutral" title="Every sentence comes from a record, an engine or a handbook passage — no language model is connected">
          Local engines · no LLM
        </Badge>
      </header>
      {a.verification.reviewRequired && (
        <div role="note" className="flex items-start gap-2 rounded-control bg-warn/[0.07] px-3 py-2 text-meta ring-1 ring-inset ring-warn/25">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <span>
            <b>Engineering review required.</b> {a.verification.checks.find((c) => c.check === 'review')?.detail.replace(/^Engineering review required/, '').replace(/^ — /, '')}
          </span>
        </div>
      )}
      <Section title="Answer">
        <ClaimList claims={a.answer} empty="Data not available in the TEAL Intelligence knowledge base." />
      </Section>
      {a.conflicts.length > 0 && (
        <Section title="Specification conflict" tone="bad">
          <ul className="space-y-2 text-meta">
            {a.conflicts.map((c, i) => (
              <li key={i} className="rounded-control border border-bad/30 p-2">
                <div className="flex items-center gap-1.5 font-semibold text-bad">
                  <AlertTriangle className="size-3.5" aria-hidden /> SPECIFICATION CONFLICT — {c.subject} · {c.field}
                </div>
                <ul className="mt-1 space-y-0.5">
                  {c.values.map((v, j) => (
                    <li key={j} className="flex flex-wrap items-center gap-1.5">
                      Source {String.fromCharCode(65 + j)}: <b>{v.value}</b> <SourceChip s={v.source} />
                    </li>
                  ))}
                </ul>
                <div className="mt-1 text-ink-3">Engineering verification required.</div>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {a.tables.length > 0 && (
        <Section title="Details">
          <div className="space-y-3">
            {(compact ? a.tables.slice(0, 2) : a.tables).map((t) => (
              <AnswerTableView key={t.title} t={t} />
            ))}
            {compact && a.tables.length > 2 && <p className="text-micro text-ink-3">{a.tables.length - 2} more table(s) — open the answer on the Copilot page for everything.</p>}
          </div>
        </Section>
      )}
      {a.draft && (
        <Section title={a.draft.kind === 'fmea' ? 'AI-suggested FMEA' : `${a.draft.kind.toUpperCase()} draft`}>
          <DraftView d={a.draft} />
        </Section>
      )}
      {sections.map(([t, c, tone]) => (c.length ? <Section key={t} title={t} tone={tone}><ClaimList claims={c} /></Section> : null))}
      <Section title="Confidence">
        <p className="mb-1 text-meta">
          <Badge tone={CONF_TONE[a.confidence.label]}>{a.confidence.label}</Badge> <span className="text-ink-3">{a.confidence.reason} · derived from measurable signals, not estimated by a model</span>
        </p>
        <ul className="grid gap-1 text-micro sm:grid-cols-2">
          {a.confidence.signals.map((s) => (
            <li key={s.signal} className="flex gap-1.5">
              <span className={clsx('font-semibold', s.level === 'high' ? 'text-ok' : s.level === 'medium' ? 'text-warn' : s.level === 'low' ? 'text-bad' : 'text-ink-3')}>{s.level}</span>
              <span>
                <b>{s.signal}:</b> {s.detail}
              </span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={`Sources (${a.sources.length})`}>
        <div className="flex flex-wrap gap-1">{a.sources.length ? a.sources.map((s) => <SourceChip key={`${s.kind}:${s.id}`} s={s} />) : <span className="text-meta text-ink-3">None</span>}</div>
      </Section>
      {a.actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
          {a.actions.map((x, i) => {
            const I = actionIcon(x.kind);
            return (
              <Button key={i} size="sm" variant={x.kind === 'open3d' ? 'primary' : 'secondary'} onClick={() => act(x)}>
                <I className="size-3.5" aria-hidden /> {x.label}
              </Button>
            );
          })}
        </div>
      )}
      <div className="border-t border-line pt-2">
        <button type="button" className="flex items-center gap-1 text-micro font-medium text-ink-3 hover:text-ink" aria-expanded={trace} onClick={() => setTrace((t) => !t)}>
          {trace ? <ChevronDown className="size-3.5" aria-hidden /> : <ChevronRight className="size-3.5" aria-hidden />} How this answer was produced ({a.trace.length} steps · {a.verification.checks.filter((c) => c.status === 'pass').length}/{a.verification.checks.length} checks passed)
        </button>
        {trace && (
          <div className="mt-2 space-y-2 text-micro">
            <ol className="space-y-0.5">
              {a.trace.map((t, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className={clsx('w-16 shrink-0 font-semibold', t.status === 'ok' ? 'text-ok' : t.status === 'fallback' ? 'text-warn' : t.status === 'error' ? 'text-bad' : 'text-ink-3')}>{t.status}</span>
                  <span>
                    <b>{t.step}</b> · {t.engine} · {t.detail} {t.ms ? `· ${t.ms} ms` : ''}
                  </span>
                </li>
              ))}
            </ol>
            <div>
              <b>Engineering validator:</b>
              <ul>
                {a.verification.checks.map((c) => (
                  <li key={c.check} className="flex gap-1.5">
                    {c.status === 'pass' ? <CheckCircle2 className="size-3.5 text-ok" aria-hidden /> : <TriangleAlert className={clsx('size-3.5', c.status === 'fail' ? 'text-bad' : 'text-warn')} aria-hidden />}
                    {c.check}: {c.detail}
                  </li>
                ))}
              </ul>
            </div>
            {a.agents.length > 0 && (
              <details>
                <summary className="cursor-pointer font-medium">Agent messages ({a.agents.length}) — structured contracts</summary>
                <pre className="scroll-thin mt-1 max-h-60 overflow-auto rounded-control bg-ink/[0.04] p-2 font-mono">{JSON.stringify(a.agents.map((m) => ({ ...m, evidence: m.evidence.map((e) => e.id) })), null, 1)}</pre>
              </details>
            )}
          </div>
        )}
      </div>
      <Feedback a={a} />
      {decision && <DecisionModal a={a} open={decision} onClose={() => setDecision(false)} />}
    </article>
  );
}
