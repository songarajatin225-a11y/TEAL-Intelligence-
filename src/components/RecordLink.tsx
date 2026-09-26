import { Link } from 'react-router-dom';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { useData } from '../hooks/useData';
import { OriginBadge } from './badges';
import { Unknown } from './ui';

export const recordPath = (id: string) => `/record/${encodeURIComponent(id)}`;

export function RecordLink({ id, showEntity, fallback }: { id?: string | null; showEntity?: boolean; fallback?: string }) {
  const { byId } = useData();
  if (!id) return fallback ? <span className="text-ink-3">{fallback}</span> : <Unknown label="—" />;
  const r = byId.get(id);
  if (!r)
    return (
      <span className="text-bad" title="Broken reference — the record does not exist">
        {id} (missing)
      </span>
    );
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {showEntity && <span className="text-micro text-ink-3">{ENTITY_BY_TYPE[r.entity]?.label}:</span>}
      <Link to={recordPath(id)} className="text-accent-2 hover:underline">
        {r.name}
      </Link>
      <OriginBadge o={r.__origin} />
    </span>
  );
}
