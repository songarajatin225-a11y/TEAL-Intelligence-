import { useMemo, useState } from 'react';
import { RecordLink } from '../../components/RecordLink';
import { GapsPanel } from '../../components/ThreadPanels';
import { Badge, Card, EmptyState, PageHeader, Select } from '../../components/ui';
import { useData } from '../../hooks/useData';
import { whatIsMissing } from '../../services/gaps';
import { isActive } from '../../services/nextAction';

/** WHAT IS MISSING? (spec §44, §141) across active opportunities, projects, POCs and configurations. */
export default function MissingPage() {
  const { records, graph } = useData();
  const candidates = useMemo(() => records.filter((r) => ['opportunity', 'project', 'poc', 'configuration', 'product'].includes(r.entity) && isActive(r)), [records]);
  const summary = useMemo(
    () =>
      candidates
        .filter((r) => r.entity !== 'product')
        .map((r) => {
          const g = whatIsMissing(graph, r.id);
          return { r, missing: g.filter((x) => x.status === 'missing').length, partial: g.filter((x) => x.status === 'partial').length, total: g.length };
        })
        .sort((a, b) => b.missing - a.missing),
    [candidates, graph],
  );
  const [sel, setSel] = useState(summary[0]?.r.id ?? '');
  return (
    <div>
      <PageHeader eyebrow="Digital thread" title="What is missing?" subtitle="Missing requirements, process data, POCs, modules, suppliers, technology, validation, certification, cost and documents — found by walking the thread." />
      <div className="grid gap-3 xl:grid-cols-[380px_1fr]">
        <Card title="Active work, most gaps first">
          {summary.length ? (
            <ul className="space-y-1">
              {summary.map((s) => (
                <li key={s.r.id}>
                  <button type="button" onClick={() => setSel(s.r.id)} className={`w-full rounded px-1 py-0.5 text-left ${sel === s.r.id ? 'bg-accent-soft' : ''}`}>
                    <Badge tone={s.missing ? 'bad' : 'ok'}>{s.missing} missing</Badge> <Badge tone="warn">{s.partial} partial</Badge> <span className="text-[11px] text-ink-3">{s.r.entity}</span>
                    <div>{s.r.name}</div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No active work" explain="Create an opportunity or project first." />
          )}
        </Card>
        <div>
          <Select aria-label="Any record" value={sel} onChange={(e) => setSel(e.target.value)} className="mb-2 max-w-md">
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.entity}: {c.name}
              </option>
            ))}
          </Select>
          {sel && (
            <Card title={<RecordLink id={sel} />}>
              <GapsPanel id={sel} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
