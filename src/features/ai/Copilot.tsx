import clsx from 'clsx';
import { ClipboardCopy, Loader2, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from '../../components/toast';
import { Badge, Button, inputClass, Notice } from '../../components/ui';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData } from '../../hooks/useData';
import { buildContext } from '../../services/aiContext';
import type { PageContext } from '../../services/ai/context';
import { logInteraction } from '../../services/ai/feedback';
import { runCopilot } from '../../services/ai/orchestrator';
import type { EngineeringAnswer } from '../../services/ai/types';
import { AnswerView } from './AnswerView';
import { useCopilotDeps } from './useCopilotDeps';

/*
 * TEAL INDUSTRIAL ENGINEERING COPILOT (AI master prompt §8, §92, §93). Context-aware: on a record page
 * the record is the subject ("Where can I use this?"). Session memory keeps this tab's conversation;
 * nothing is stored permanently except the interaction log and what you explicitly save.
 */

interface Turn {
  id: number;
  q: string;
  answer: EngineeringAnswer | null;
  error?: string;
}

/* session memory (§93): survives closing the drawer, not a page reload */
let turns: Turn[] = [];
let nextId = 1;
const subs = new Set<() => void>();
const store = {
  get: () => turns,
  set: (t: Turn[]) => {
    turns = t;
    subs.forEach((s) => s());
  },
  subscribe: (s: () => void) => {
    subs.add(s);
    return () => subs.delete(s);
  },
};

const EXAMPLES = [
  'I need a laser marking machine for aluminium battery cans, 5-second cycle time, high-contrast marking.',
  'Which laser for marking anodised aluminium?',
  'Find 50 W MOPA laser 1064 nm',
  'What changes if I replace DL-MOPA-20 with DL-MOPA-50?',
  'Find Indian suppliers for galvo scanners',
  'What is the cycle time of the laser marker and what must change to reach 10 s?',
  'DOE for power 20-50 W, speed 500-2000 mm/s',
  'Explain MOPA laser',
];

function actionsFor(ctx: PageContext | null): { label: string; q: string; run: boolean }[] {
  const n = ctx?.name ?? '';
  const model = n;
  const has = !!ctx?.id;
  return [
    { label: 'Explain', q: has ? `Explain ${n}` : 'Explain ', run: has },
    { label: 'Where can I use this?', q: 'Where can I use this?', run: true },
    { label: 'Compare', q: has ? `Compare ${n} and ` : 'Compare ', run: false },
    { label: 'Find alternatives', q: has ? `Find alternatives to ${model}` : 'Find alternatives to ', run: has },
    { label: 'Compatibility', q: has ? `What is compatible with ${model}?` : 'Is  compatible with ?', run: has },
    { label: 'Change impact', q: has ? `What changes if I replace ${model} with ` : 'What changes if I replace  with ', run: false },
    { label: 'Configure', q: 'I need a laser marking machine for ', run: false },
    { label: 'Generate BOM', q: 'Preliminary BOM for ', run: false },
    { label: 'Analyze cost', q: 'How much does it cost: ', run: false },
    { label: 'Generate RFQ', q: 'Generate an RFQ for ', run: false },
    { label: 'Generate URS', q: 'Draft a URS for ', run: false },
    { label: 'Open 3D', q: has && ctx?.kind === 'scenario' ? `Open the 3D model of ${n}` : 'Open the 3D model of ', run: has && ctx?.kind === 'scenario' },
    { label: 'What is pending?', q: 'What is pending in this project?', run: has },
  ];
}

export function Copilot({ context, mode, initialQuery }: { context: PageContext | null; mode: 'drawer' | 'page'; initialQuery?: string }) {
  const deps = useCopilotDeps();
  const { graph } = useData();
  const list = useSyncExternalStore(store.subscribe, store.get);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [useCtx, setUseCtx] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const ctx = useCtx && context?.id ? context : null;
  const actions = useMemo(() => actionsFor(ctx), [ctx]);

  const ask = async (q: string) => {
    const query = q.trim();
    if (!query || !deps) return;
    const id = nextId++;
    store.set([...store.get(), { id, q: query, answer: null }]);
    setText('');
    setBusy(true);
    try {
      const answer = await runCopilot(query, ctx, deps);
      store.set(store.get().map((t) => (t.id === id ? { ...t, answer } : t)));
      void logInteraction(answer);
    } catch (e) {
      store.set(store.get().map((t) => (t.id === id ? { ...t, error: e instanceof Error ? e.message : String(e) } : t)));
    } finally {
      setBusy(false);
    }
  };

  const ran = useRef(false);
  useEffect(() => {
    if (initialQuery && deps && !ran.current) {
      ran.current = true;
      void ask(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, deps]);
  // bring the start of the newest question into view (the ANSWER section, not the end of the sources)
  const lastRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    lastRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [list.length, busy]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(text);
  };

  return (
    <div className={clsx('flex flex-col gap-3', mode === 'page' && 'min-h-[60vh]')}>
      <Notice tone="info">
        <b>Local engines — no language model is connected.</b> Answers are composed from TEAL records, handbook passages and deterministic engines; every sentence cites its source and is checked by the engineering validator. <Link to="/ai-engine" className="font-medium text-accent-2 hover:underline">Engine status</Link>
      </Notice>

      {context?.id && (
        <div className="flex flex-wrap items-center gap-2 text-meta">
          <span className="text-ink-3">Context</span>
          <button type="button" aria-pressed={useCtx} onClick={() => setUseCtx((u) => !u)} className={clsx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5', useCtx ? 'border-accent/40 bg-accent-soft text-accent-2' : 'border-line text-ink-3 line-through')} title={useCtx ? 'Click to answer without this context' : 'Click to use this context'}>
            {ENTITY_BY_TYPE[context.entity ?? '']?.label ?? context.entity}: {context.name}
            {useCtx && <X className="size-3" aria-hidden />}
          </button>
          {useCtx && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigator.clipboard?.writeText(buildContext(graph, context.id!)).then(() => toast('Context copied for an external assistant', { tone: 'success', detail: 'Do not paste confidential data into a public AI service.' }), () => toast('Copy failed', { tone: 'error' }))}
            >
              <ClipboardCopy className="size-3.5" aria-hidden /> Copy context
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="AI actions">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            disabled={!deps || busy}
            onClick={() => (a.run ? void ask(a.q) : (setText(a.q), inputRef.current?.focus()))}
            className="rounded-full border border-line-strong px-2.5 py-1 text-micro font-medium hover:border-accent hover:text-accent-2 disabled:opacity-50"
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="space-y-4" aria-live="polite">
        {!list.length && (
          <div className="space-y-2">
            <p className="text-meta text-ink-3">Try:</p>
            <ul className="flex flex-col gap-1.5">
              {EXAMPLES.map((x) => (
                <li key={x}>
                  <button type="button" disabled={!deps} onClick={() => void ask(x)} className="text-left text-meta text-accent-2 hover:underline disabled:opacity-50">
                    {x}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {list.map((t, i) => {
          const last = i === list.length - 1;
          return (
            <div key={t.id} ref={last ? lastRef : undefined} className="scroll-mt-2 space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[90%] rounded-card bg-accent-soft px-3 py-2 text-body">{t.q}</div>
              </div>
              {t.error && <Notice tone="warn">The Copilot failed on this question: {t.error}. The rest of the platform is unaffected.</Notice>}
              {!t.answer && !t.error && (
                <div className="flex items-center gap-2 text-meta text-ink-3">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Routing, retrieving and validating…
                </div>
              )}
              {t.answer &&
                (last ? (
                  <div className="surface rounded-card p-3">
                    <AnswerView a={t.answer} onAsk={(q) => void ask(q)} compact={mode === 'drawer'} />
                  </div>
                ) : (
                  <details className="surface rounded-card p-3">
                    <summary className="cursor-pointer text-meta">
                      <span className="font-semibold">{t.answer.title}</span> · {t.answer.confidence.label}
                    </summary>
                    <div className="mt-2">
                      <AnswerView a={t.answer} onAsk={(q) => void ask(q)} compact={mode === 'drawer'} />
                    </div>
                  </details>
                ))}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className={clsx('flex items-end gap-2', mode === 'drawer' && 'sticky bottom-0 bg-solid/90 pt-2 backdrop-blur')} role="search" aria-label="Ask the Copilot">
        <label htmlFor={`copilot-q-${mode}`} className="sr-only">
          Ask the Copilot
        </label>
        <textarea
          id={`copilot-q-${mode}`}
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void ask(text);
            }
          }}
          placeholder={ctx ? `Ask about ${ctx.name}…` : 'Ask an engineering question, or describe a machine requirement…'}
          className={clsx(inputClass, 'h-16 flex-1 resize-none leading-relaxed')}
          disabled={!deps}
        />
        <Button variant="primary" type="submit" disabled={!text.trim() || busy || !deps} aria-label="Ask">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
          <span className="hidden sm:inline">Ask</span>
        </Button>
      </form>
      {list.length > 0 && (
        <div className="flex items-center justify-between text-micro text-ink-3">
          <span>
            <Sparkles className="mr-1 inline size-3" aria-hidden />
            Session memory: {list.length} question(s) in this tab
          </span>
          <button type="button" className="hover:text-ink" onClick={() => store.set([])}>
            Clear conversation
          </button>
        </div>
      )}
      {!deps && <Badge tone="neutral">Loading engines…</Badge>}
    </div>
  );
}
