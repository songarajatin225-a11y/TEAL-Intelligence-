import { Check, Circle, Copy, Minus } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { useData } from '../hooks/useData';
import { buildContext, PROMPT_LIBRARY, renderPrompt } from '../services/aiContext';
import { whatIsMissing } from '../services/gaps';
import { neighbours } from '../services/graph';
import { nextActionFor } from '../services/nextAction';
import { classifyReuse, findSimilar } from '../services/similarity';
import { fmtDate, relativeDay } from '../utils/dates';
import { DataTypeBadge } from './badges';
import { RecordLink } from './RecordLink';
import { Badge, Button, Card, Drawer, EmptyState, Select, Textarea } from './ui';

export function LinkedRecords({ id }: { id: string }) {
  const { graph } = useData();
  const groups = useMemo(() => {
    const m = new Map<string, { id: string; rel: string; dir: string }[]>();
    for (const n of neighbours(graph, id)) {
      const k = ENTITY_BY_TYPE[n.record.entity]?.plural ?? n.record.entity;
      if (!m.has(k)) m.set(k, []);
      const list = m.get(k)!;
      if (!list.some((x) => x.id === n.record.id)) list.push({ id: n.record.id, rel: n.rel, dir: n.direction });
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [graph, id]);
  if (!groups.length) return <EmptyState title="Not connected yet" explain="This record has no links in the digital thread. Link it from a related record (customer, opportunity, product, project…) or reference it in a new record." />;
  return (
    <div className="space-y-2">
      {groups.map(([k, list]) => (
        <div key={k}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
            {k} <span className="font-normal">({list.length})</span>
          </div>
          <ul className="mt-0.5 space-y-0.5">
            {list.slice(0, 25).map((x) => (
              <li key={x.id} className="flex flex-wrap items-center gap-1.5">
                <span className="w-24 shrink-0 text-[11px] text-ink-3">{x.dir === 'out' ? x.rel.replace('_', ' ') : `← ${x.rel.replace('_', ' ')}`}</span>
                <RecordLink id={x.id} />
              </li>
            ))}
            {list.length > 25 && <li className="text-[11px] text-ink-3">…and {list.length - 25} more</li>}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function GapsPanel({ id }: { id: string }) {
  const { graph } = useData();
  const gaps = useMemo(() => whatIsMissing(graph, id), [graph, id]);
  const missing = gaps.filter((g) => g.status !== 'present').length;
  return (
    <div>
      <p className="mb-2 text-ink-3">
        {missing} of {gaps.length} thread checks open. Rules walk the digital thread; see docs/GATES.md.
      </p>
      <ul className="space-y-1">
        {gaps.map((g, i) => (
          <li key={i} className="flex gap-2">
            {g.status === 'present' ? <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-label="present" /> : g.status === 'partial' ? <Minus className="mt-0.5 size-4 shrink-0 text-warn" aria-label="partial" /> : <Circle className="mt-0.5 size-4 shrink-0 text-bad" aria-label="missing" />}
            <div className="min-w-0">
              <div>
                <Badge className="mr-1">{g.category}</Badge>
                <span className="font-medium">{g.item}</span> — <span className="text-ink-2">{g.detail}</span>
              </div>
              {g.status !== 'present' && g.action && <div className="text-[12px] text-accent-2">→ {g.action}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SimilarPanel({ record, mode }: { record: AnyRecord; mode: 'similar' | 'reuse' }) {
  const { records } = useData();
  const hits = useMemo(() => {
    const pool = records.filter((r) => r.entity !== 'knowledge' && r.entity !== 'vocabulary' && r.entity !== 'reference' && r.entity !== 'formula');
    const entities = mode === 'reuse' ? ['product', 'module', 'poc', 'bom', 'cost_model', 'supplier', 'lesson', 'configuration', 'application'] : undefined;
    const sim = findSimilar(record, pool, { limit: 30, entities });
    return classifyReuse(record, sim);
  }, [records, record, mode]);
  if (!hits.length) return <EmptyState title="Nothing similar found" explain="No record shares enough attributes or terms. Try Engineering Search or the Knowledge base." />;
  const groups = mode === 'reuse' ? (['Reusable', 'Potentially reusable', 'Requires validation', 'Similar', 'Not compatible'] as const) : null;
  const row = (h: (typeof hits)[number]) => (
    <li key={h.record.id} className="flex flex-wrap items-center gap-1.5 border-b border-line/60 py-1">
      <span className="num w-10 text-right text-[11px] text-ink-3">{(h.score * 100).toFixed(0)}%</span>
      <span className="text-[11px] text-ink-3">{ENTITY_BY_TYPE[h.record.entity]?.label}</span>
      <RecordLink id={h.record.id} />
      <DataTypeBadge t={h.record.data_type} />
      <span className="w-full pl-12 text-[11.5px] text-ink-3">{h.reasons.slice(0, 4).join(' · ')}</span>
    </li>
  );
  return groups ? (
    <div className="space-y-3">
      {groups.map((g) => {
        const list = hits.filter((h) => h.class === g);
        if (!list.length) return null;
        return (
          <div key={g}>
            <div className="mb-1 flex items-center gap-2">
              <Badge tone={g === 'Reusable' ? 'ok' : g === 'Requires validation' ? 'warn' : g === 'Not compatible' ? 'bad' : 'accent'}>{g}</Badge>
              <span className="text-[11px] text-ink-3">{list[0].basis}</span>
            </div>
            <ul>{list.map(row)}</ul>
          </div>
        );
      })}
      <p className="text-[11.5px] text-ink-3">Classification rules: src/services/similarity.ts (classifyReuse). DEMO and draft records never count as validated reuse.</p>
    </div>
  ) : (
    <ul>{hits.map(row)}</ul>
  );
}

export function NextActionLine({ record }: { record: AnyRecord }) {
  const na = nextActionFor(record);
  if (!na.action) return <span className="text-bad">No next action defined — add one.</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {na.source === 'SUGGESTED' && (
        <Badge tone="draft" title={`Rule: ${na.rule}`}>
          Suggested
        </Badge>
      )}
      <span>{na.action}</span>
      {na.due && (
        <span className={na.overdue ? 'text-bad' : 'text-ink-3'}>
          · {fmtDate(na.due)} ({relativeDay(na.due)})
        </span>
      )}
      {na.owner && <span className="text-ink-3">· {na.owner}</span>}
    </span>
  );
}

export function AiContextButton({ id }: { id: string }) {
  const { graph, byId } = useData();
  const [open, setOpen] = useState(false);
  const [tpl, setTpl] = useState('');
  const [copied, setCopied] = useState(false);
  const r = byId.get(id);
  const context = useMemo(() => (open ? buildContext(graph, id) : ''), [open, graph, id]);
  const templates = PROMPT_LIBRARY.filter((t) => !r || t.appliesTo.includes(r.entity));
  const text = tpl ? renderPrompt(PROMPT_LIBRARY.find((t) => t.key === tpl)!, context) : context;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        AI context
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="AI context / prompt" wide>
        <p className="mb-2 text-ink-2">No AI service is called and no API key is used. Copy this structured, provenance-labelled context into the assistant of your choice.</p>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Select aria-label="Prompt template" value={tpl} onChange={(e) => setTpl(e.target.value)} className="max-w-xs">
            <option value="">Context only</option>
            {templates.map((t) => (
              <option key={t.key} value={t.key}>
                {t.title}
              </option>
            ))}
          </Select>
          <Button variant="primary" onClick={copy}>
            <Copy className="size-3.5" /> {copied ? 'Copied' : 'Copy context'}
          </Button>
        </div>
        <Textarea readOnly value={text} className="h-[65vh] font-mono text-[11.5px]" aria-label="Generated context" />
      </Drawer>
    </>
  );
}

export function ThreadCard({ record }: { record: AnyRecord }) {
  const [tab, setTab] = useState<'linked' | 'missing' | 'reuse' | 'similar'>('linked');
  return (
    <Card title="Digital thread">
      <div role="tablist" aria-label="Thread views" className="mb-2 flex flex-wrap gap-1">
        {(
          [
            ['linked', 'Linked records'],
            ['missing', 'What is missing?'],
            ['reuse', 'What can we reuse?'],
            ['similar', 'Find similar'],
          ] as const
        ).map(([k, l]) => (
          <Button key={k} size="sm" variant={tab === k ? 'primary' : 'default'} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {l}
          </Button>
        ))}
      </div>
      {tab === 'linked' && <LinkedRecords id={record.id} />}
      {tab === 'missing' && <GapsPanel id={record.id} />}
      {tab === 'reuse' && <SimilarPanel record={record} mode="reuse" />}
      {tab === 'similar' && <SimilarPanel record={record} mode="similar" />}
    </Card>
  );
}
