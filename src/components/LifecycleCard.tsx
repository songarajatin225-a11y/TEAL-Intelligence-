import clsx from 'clsx';
import { Check, Circle, Milestone } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useData } from '../hooks/useData';
import { lifecycleFor } from '../services/lifecycle';
import { Card } from './ui';

/** Product development lifecycle (master prompt §16) for one opportunity / project / product — every stage shows its rule and evidence. */
export function LifecycleCard({ id }: { id: string }) {
  const { graph } = useData();
  const lc = useMemo(() => lifecycleFor(graph, id), [graph, id]);
  const [all, setAll] = useState(false);
  const idx = lc.current ? lc.stages.findIndex((s) => s.stage === lc.current) : lc.stages.length;
  const shown = all ? lc.stages : lc.stages.slice(Math.max(0, idx - 2), idx + 4);
  return (
    <Card
      title="Development lifecycle"
      icon={Milestone}
      description={`${lc.doneCount} of ${lc.stages.length} stages evidenced${lc.current ? ` · next: ${lc.current}` : ''}`}
      actions={
        <button type="button" className="text-meta text-accent-2 hover:underline" onClick={() => setAll((v) => !v)}>
          {all ? 'Around current stage' : 'All 17 stages'}
        </button>
      }
    >
      <div className="mb-3 flex h-1.5 overflow-hidden rounded-full bg-ink/[0.07]" role="meter" aria-label="Lifecycle stages evidenced" aria-valuenow={lc.doneCount} aria-valuemin={0} aria-valuemax={lc.stages.length}>
        {lc.stages.map((s) => (
          <span key={s.stage} className={clsx('h-full flex-1 border-r border-solid/60 last:border-r-0', s.done ? 'bg-ok' : s.stage === lc.current ? 'bg-accent' : '')} />
        ))}
      </div>
      <ol className="space-y-1.5">
        {shown.map((s) => (
          <li key={s.stage} className="flex gap-2 text-meta">
            <span className={clsx('mt-0.5 grid size-4 shrink-0 place-items-center rounded-full', s.done ? 'bg-ok text-white' : s.stage === lc.current ? 'ring-2 ring-accent' : 'ring-1 ring-line-strong')} aria-hidden>
              {s.done ? <Check className="size-3" /> : <Circle className="size-2 opacity-0" />}
            </span>
            <span className="min-w-0">
              <span className={clsx('font-medium', s.stage === lc.current && 'text-accent-2')}>{s.stage}</span>
              <span className="sr-only">{s.done ? ' — done' : s.stage === lc.current ? ' — current' : ' — not yet'}</span>
              <span className="block text-micro text-ink-3">{s.done ? s.evidence.slice(0, 2).join('; ') : `Needs: ${s.rule}`}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
