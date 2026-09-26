import { ArrowUpRight, PencilLine, Pin, PinOff } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { isFavorite, toggleFavorite, usePrefs } from '../app/prefs';
import type { AnyRecord } from '../domain';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { ENTITY_UI } from '../features/entities/entityUi';
import { useData } from '../hooks/useData';
import type { RecordOrigin } from '../repositories/types';
import { whatIsMissing } from '../services/gaps';
import { neighbours } from '../services/graph';
import { DataConfidence, OriginBadge, StatusBadge } from './badges';
import { fieldLabel, renderValue } from './fieldValue';
import { HealthBadge, useHealth } from './Health';
import { recordPath } from './RecordLink';
import { NextActionLine } from './ThreadPanels';
import { buttonClass, Drawer, IconButton, KV } from './ui';
import { WhyButton } from './why';

const STATUS_KEYS = ['status', 'stage', 'poc_status', 'risk_status', 'rfq_status', 'ticket_status', 'cr_status', 'maturity'];

/** Quick inspection of any record without leaving the list (spec §23). */
export function EntityDrawer({ record, onClose }: { record: (AnyRecord & { __origin?: RecordOrigin }) | null; onClose: () => void }) {
  const { graph } = useData();
  const prefs = usePrefs();
  const r = record;
  const def = r ? ENTITY_BY_TYPE[r.entity] : undefined;
  const ui = r ? ENTITY_UI[r.entity] : undefined;
  const related = useMemo(() => {
    if (!r) return [];
    const m = new Map<string, number>();
    for (const n of neighbours(graph, r.id)) m.set(n.record.entity, (m.get(n.record.entity) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [graph, r]);
  const health = useHealth(r ?? undefined);
  const gaps = useMemo(() => (r ? whatIsMissing(graph, r.id).filter((g) => g.status !== 'present') : []), [graph, r]);
  if (!r) return null;
  const x = r as Record<string, unknown>;
  const status = STATUS_KEYS.map((k) => x[k]).find((v) => typeof v === 'string') as string | undefined;
  const keys = [...new Set([...(ui?.columns.map((c) => c.key) ?? []), ...(ui?.fields.map((f) => f.key) ?? [])])].filter((k) => !STATUS_KEYS.includes(k) && k !== 'description').slice(0, 8);
  const fav = isFavorite(prefs, r.id);
  return (
    <Drawer
      open
      onClose={onClose}
      title={r.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <span>{def?.label}</span>
          <StatusBadge s={status} />
          {health && <HealthBadge health={health} />}
          <OriginBadge o={r.__origin} />
        </span>
      }
      actions={<IconButton label={fav ? 'Unpin from sidebar' : 'Pin to sidebar'} icon={fav ? PinOff : Pin} onClick={() => toggleFavorite({ id: r.id, name: r.name, entity: r.entity })} />}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Link to={recordPath(r.id)} className={buttonClass('primary')} onClick={onClose}>
            Open full page <ArrowUpRight className="size-4" aria-hidden />
          </Link>
          {!ui?.readOnly && (
            <Link to={`${recordPath(r.id)}?edit=1`} className={buttonClass('secondary')} onClick={onClose}>
              <PencilLine className="size-4" aria-hidden /> Edit
            </Link>
          )}
          <WhyButton record={r} label="Why?" />
        </div>
      }
    >
      <div className="space-y-5">
        {r.description && <p className="text-ink-2">{r.description}</p>}
        <DataConfidence dataType={r.data_type} verification={r.provenance?.verification_status} source={r.provenance?.document ?? r.provenance?.source_id} lastVerified={r.provenance?.last_verified} />
        {keys.length > 0 && <KV items={keys.map((k) => [fieldLabel(k), renderValue(x[k])])} />}
        {(def?.requiresNextAction || r.next_action) && (
          <section>
            <h3 className="mb-1.5 text-meta font-semibold text-ink-3">Next action</h3>
            <NextActionLine record={r} />
          </section>
        )}
        <section>
          <h3 className="mb-1.5 text-meta font-semibold text-ink-3">Related</h3>
          {related.length ? (
            <div className="flex flex-wrap gap-1.5">
              {related.map(([e, n]) => (
                <Link key={e} to={`${recordPath(r.id)}?tab=related`} onClick={onClose} className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-meta hover:bg-accent-soft hover:text-accent-2">
                  <b className="num">{n}</b> {(n === 1 ? ENTITY_BY_TYPE[e]?.label : ENTITY_BY_TYPE[e]?.plural) ?? e}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-meta text-ink-3">Not connected to other records yet.</p>
          )}
        </section>
        {gaps.length > 0 && (
          <section>
            <h3 className="mb-1.5 text-meta font-semibold text-ink-3">What is missing ({gaps.length})</h3>
            <ul className="space-y-1">
              {gaps.slice(0, 4).map((g, i) => (
                <li key={i} className="text-meta">
                  <span className="font-medium">{g.item}</span> <span className="text-ink-3">— {g.detail}</span>
                </li>
              ))}
            </ul>
            <Link to={`${recordPath(r.id)}?tab=intelligence`} onClick={onClose} className="mt-1 inline-block text-meta font-medium text-accent-2 hover:underline">
              See all gaps
            </Link>
          </section>
        )}
      </div>
    </Drawer>
  );
}
