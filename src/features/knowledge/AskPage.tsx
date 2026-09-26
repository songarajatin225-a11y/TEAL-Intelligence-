import { ArrowRight, BookOpen, FileSearch, Lightbulb, Link2, MessageSquareText, ShieldAlert, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DataTypeBadge, VerificationBadge } from '../../components/badges';
import { Badge, Button, Card, ErrorState, Input, Loading, Notice, PageHeader } from '../../components/ui';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData } from '../../hooks/useData';
import { composeAnswer, type Answer, type AnswerItem } from '../../services/ask';
import { search } from '../../services/search';

const EXAMPLES = ['What laser is used for marking stainless steel?', 'Which suppliers provide motion components?', 'How is takt time calculated?', 'What does the G1 gate require?', 'Fibre laser for PCB depaneling'];
const CONF_TONE = { High: 'ok', Medium: 'warn', Low: 'bad', None: 'neutral' } as const;

function Items({ items, empty }: { items: AnswerItem[]; empty: string }) {
  if (!items.length) return <p className="text-meta text-ink-3">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.id} className="flex flex-wrap items-center gap-1.5">
          <Badge>{it.entity === 'knowledge' ? 'Handbook' : (ENTITY_BY_TYPE[it.entity]?.label ?? it.entity)}</Badge>
          <Link to={it.href} className="font-medium text-accent-2 hover:underline">
            {it.name}
          </Link>
          {it.data_type && <DataTypeBadge t={it.data_type} />}
          {it.verification && <VerificationBadge v={it.verification} />}
          {it.note && <span className="text-micro text-ink-3">{it.note}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * ASK INTELLIGENCE (ultimate spec §78–80). Question in, structured answer out — composed only
 * from the local knowledge base (search index, digital-thread graph, gap engine). No AI model,
 * no API call, no invented sentences; the page says so.
 */
export default function AskPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [text, setText] = useState(q);
  const { records, graph } = useData();
  const locals = useMemo(() => records.filter((r) => r.__origin !== 'MASTER'), [records]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => setText(q), [q]);
  useEffect(() => {
    if (!q.trim()) {
      setAnswer(null);
      return;
    }
    let cancel = false;
    setBusy(true);
    setErr(false);
    search({ text: q, limit: 60 }, locals)
      .then((hits) => !cancel && setAnswer(composeAnswer(q, hits, graph)))
      .catch(() => !cancel && setErr(true))
      .finally(() => !cancel && setBusy(false));
    return () => {
      cancel = true;
    };
  }, [q, locals, graph]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) setParams({ q: text.trim() });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Ask Intelligence" subtitle="Ask in plain language. Answers are assembled from TEAL records and handbooks — every line links to where it came from." />
      <Notice tone="info">
        No AI model is connected in this GitHub-only version. This is <b>local retrieval</b>: search, the digital-thread graph and the gap engine. To reason further, open <Link to="/ai" className="font-medium text-accent-2 hover:underline">AI Context</Link> and paste the context into your own assistant.
      </Notice>
      <form onSubmit={submit} className="surface glass-edge flex flex-col gap-2 rounded-panel p-3 sm:flex-row" role="search">
        <label htmlFor="ask-q" className="sr-only">
          Question
        </label>
        <Input id="ask-q" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Which laser for marking anodised aluminium?" className="flex-1 text-lead" autoFocus />
        <Button variant="primary" type="submit" disabled={!text.trim()}>
          <Sparkles className="size-4" aria-hidden /> Ask
        </Button>
      </form>

      {!q && (
        <Card title="Try" icon={Lightbulb}>
          <ul className="flex flex-wrap gap-2">
            {EXAMPLES.map((x) => (
              <li key={x}>
                <button type="button" onClick={() => setParams({ q: x })} className="rounded-full border border-line-strong px-3 py-1 text-meta hover:border-accent hover:text-accent-2">
                  {x}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {busy && <Loading label="Searching the knowledge base…" />}
      {err && <ErrorState what="The search index could not be loaded." why="The index files may not be cached for offline use yet." todo="Reconnect and try again." />}

      {answer && !busy && (
        <div className="space-y-4" aria-live="polite">
          <Card title="Answer" icon={MessageSquareText} actions={<Badge tone={CONF_TONE[answer.confidence]}>Confidence: {answer.confidence}</Badge>} edge>
            <p className="text-lead">{answer.direct}</p>
            <p className="mt-1 text-micro text-ink-3">{answer.confidenceReason}</p>
          </Card>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="Key findings" icon={FileSearch} description="Matching records, best first">
              <Items items={answer.findings} empty="No matching records." />
            </Card>
            <Card title="From the handbooks" icon={BookOpen}>
              <Items items={answer.knowledge} empty="No handbook section matched." />
            </Card>
            <Card title="Evidence & sources" icon={Link2}>
              <Items items={answer.evidence} empty="No evidence or source records are linked to the findings." />
            </Card>
            <Card title="Unknowns & assumptions" icon={ShieldAlert}>
              {answer.unknowns.length ? (
                <ul className="list-disc space-y-1 pl-5 text-meta text-ink-2">
                  {answer.unknowns.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-meta text-ink-3">None flagged on the top findings.</p>
              )}
            </Card>
            <Card title="Risks" icon={ShieldAlert}>
              <Items items={answer.risks} empty="No open risks linked to the top finding." />
            </Card>
            <Card title="Recommended next steps" icon={ArrowRight} description="From the record’s next action and the gap engine">
              {answer.actions.length ? (
                <ol className="list-decimal space-y-1 pl-5 text-meta text-ink-2">
                  {answer.actions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-meta text-ink-3">No recorded next action or open gap for the top finding.</p>
              )}
            </Card>
          </div>
          <Card title="Related records" description="Connected to the top finding in the digital thread">
            <Items items={answer.related} empty="No related records." />
          </Card>
        </div>
      )}
    </div>
  );
}
