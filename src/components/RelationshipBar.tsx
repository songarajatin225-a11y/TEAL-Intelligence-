import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { useData } from '../hooks/useData';
import { neighbours } from '../services/graph';
import { recordPath } from './RecordLink';

interface Group {
  entity: string;
  ids: string[];
  names: string[];
}

function group(list: { entity: string; id: string; name: string }[]): Group[] {
  const m = new Map<string, Group>();
  for (const x of list) {
    const g = m.get(x.entity) ?? m.set(x.entity, { entity: x.entity, ids: [], names: [] }).get(x.entity)!;
    if (!g.ids.includes(x.id)) {
      g.ids.push(x.id);
      g.names.push(x.name);
    }
  }
  return [...m.values()].sort((a, b) => b.ids.length - a.ids.length);
}

/**
 * RELATIONSHIP BAR (ultimate spec §14): upstream (what this record belongs to / uses) → this
 * record → downstream (what refers to it). A single link opens the record; several open the
 * Related tab.
 */
export function RelationshipBar({ record, relatedHref }: { record: AnyRecord; relatedHref: string }) {
  const { graph } = useData();
  const { up, down } = useMemo(() => {
    const n = neighbours(graph, record.id).filter((x) => x.record.entity !== 'source');
    return {
      up: group(n.filter((x) => x.direction === 'out').map((x) => ({ entity: x.record.entity, id: x.record.id, name: x.record.name }))),
      down: group(n.filter((x) => x.direction === 'in').map((x) => ({ entity: x.record.entity, id: x.record.id, name: x.record.name }))),
    };
  }, [graph, record.id]);
  if (!up.length && !down.length) return null;
  const chip = (g: Group) => {
    const def = ENTITY_BY_TYPE[g.entity];
    const single = g.ids.length === 1;
    return (
      <Link
        key={g.entity}
        to={single ? recordPath(g.ids[0]) : relatedHref}
        title={g.names.slice(0, 6).join(', ') + (g.names.length > 6 ? '…' : '')}
        className="inline-flex max-w-[16rem] items-center gap-1.5 rounded-full border border-line-strong bg-solid/60 px-2.5 py-1 text-meta hover:border-accent hover:text-accent-2"
      >
        <span className="whitespace-nowrap text-ink-3">{single ? def?.label ?? g.entity : def?.plural ?? g.entity}</span>
        <span className="truncate font-medium">{single ? g.names[0] : <span className="num">{g.ids.length}</span>}</span>
      </Link>
    );
  };
  return (
    <nav aria-label="Relationships" className="surface flex flex-wrap items-center gap-x-2 gap-y-2 rounded-card px-3 py-2">
      {up.length > 0 && (
        <>
          <span className="text-micro font-semibold uppercase tracking-[0.06em] text-ink-3">Uses / belongs to</span>
          {up.map(chip)}
          <ChevronRight className="size-4 text-accent" aria-hidden />
        </>
      )}
      <span className="rounded-full bg-accent-soft px-2.5 py-1 text-meta font-semibold text-accent-2">This {ENTITY_BY_TYPE[record.entity]?.label.toLowerCase() ?? 'record'}</span>
      {down.length > 0 && (
        <>
          <ChevronRight className="size-4 text-accent" aria-hidden />
          <span className="text-micro font-semibold uppercase tracking-[0.06em] text-ink-3">Used by</span>
          {down.map(chip)}
        </>
      )}
    </nav>
  );
}
