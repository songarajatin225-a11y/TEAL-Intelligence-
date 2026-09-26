import { Columns2, CopyCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTypeBadge, OriginBadge } from '../../components/badges';
import { recordPath } from '../../components/RecordLink';
import { Badge, buttonClass, Card, EmptyState, Notice, PageHeader, Select } from '../../components/ui';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData, type Rec } from '../../hooks/useData';
import { findDuplicates } from '../../services/duplicates';

/**
 * DUPLICATE DETECTION (ultimate spec §88). Suggests likely duplicates within each record type with
 * the reasons. It never merges: compare the pair, then edit or delete one as a local draft.
 */
export default function DuplicatesPage() {
  const { records } = useData();
  const [entity, setEntity] = useState('');
  const pairs = useMemo(() => findDuplicates(records), [records]);
  const types = useMemo(() => [...new Set(pairs.map((p) => p.a.entity))], [pairs]);
  const shown = entity ? pairs.filter((p) => p.a.entity === entity) : pairs;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Duplicates"
        subtitle="Records of the same type that probably describe the same thing. Nothing is merged automatically."
        actions={
          types.length > 1 ? (
            <Select aria-label="Record type" value={entity} onChange={(e) => setEntity(e.target.value)} className="w-52">
              <option value="">All types ({pairs.length})</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {ENTITY_BY_TYPE[t]?.plural ?? t} ({pairs.filter((p) => p.a.entity === t).length})
                </option>
              ))}
            </Select>
          ) : undefined
        }
      />
      <Notice tone="info">Rules: same name ignoring case, punctuation and legal suffixes (Pvt, Ltd, GmbH…); same code, model, designation or serial; or at least 75 % of name words shared. Review each pair — similar names can be different things.</Notice>
      {!shown.length ? (
        <EmptyState icon={CopyCheck} title="No likely duplicates" explain="No two records of the same type match the duplicate rules." compact />
      ) : (
        <Card title={`${shown.length} possible duplicate pair${shown.length === 1 ? '' : 's'}`} icon={CopyCheck}>
          <ul className="divide-y divide-line/60">
            {shown.slice(0, 200).map((p) => (
              <li key={`${p.a.id}|${p.b.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5">
                <Badge>{ENTITY_BY_TYPE[p.a.entity]?.label ?? p.a.entity}</Badge>
                {[p.a, p.b].map((r, i) => (
                  <span key={r.id} className="inline-flex items-center gap-1.5">
                    {i === 1 && <span className="text-ink-3">↔</span>}
                    <Link to={recordPath(r.id)} className="font-medium text-accent-2 hover:underline">
                      {r.name}
                    </Link>
                    <DataTypeBadge t={r.data_type} />
                    <OriginBadge o={(r as Rec).__origin} />
                  </span>
                ))}
                <span className="basis-full text-micro text-ink-3 sm:basis-auto">{p.reasons.join(' · ')}</span>
                <Link to={`/compare?ids=${encodeURIComponent(p.a.id)},${encodeURIComponent(p.b.id)}`} className={buttonClass('secondary', 'sm', 'ml-auto')}>
                  <Columns2 className="size-3.5" aria-hidden /> Compare
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
