import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { OriginBadge, StatusBadge } from '../../components/badges';
import { TrustBadge } from '../../components/TrustBadge';
import { HealthBadge } from '../../components/Health';
import { recordPath } from '../../components/RecordLink';
import { toast } from '../../components/toast';
import { EmptyState } from '../../components/ui';
import { useData, type Rec } from '../../hooks/useData';
import { repo, ValidationFailure } from '../../repositories';
import { entityHealth } from '../../services/health';
import { todayIso } from '../../utils/dates';
import { ENTITY_UI } from './entityUi';

export const matchesQuery = (r: Rec, q: string) => {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => k !== 'provenance'))).toLowerCase().includes(t);
};

/** The list's grouping field for the board: its first status-kind column. */
export function boardKey(entity: string): { key: string; label: string; options?: readonly string[] } | null {
  const ui = ENTITY_UI[entity];
  const col = ui?.columns.find((c) => c.kind === 'status');
  if (!col) return null;
  return { key: col.key, label: col.label, options: ui.fields.find((f) => f.key === col.key)?.options };
}

const LIMIT = 120;

/** Card view — scannable tiles with status, health and the list's key columns. */
export function RecordCards({ entity, rows, onOpen }: { entity: string; rows: Rec[]; onOpen: (r: Rec) => void }) {
  const { graph } = useData();
  const ui = ENTITY_UI[entity];
  const today = todayIso();
  const cols = (ui?.columns ?? []).filter((c) => c.kind !== 'status').slice(0, 3);
  const statusCol = ui?.columns.find((c) => c.kind === 'status');
  if (!rows.length) return <EmptyState title="No matches" explain="No records match the filter." compact />;
  return (
    <>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Records">
        {rows.slice(0, LIMIT).map((r) => {
          const x = r as Record<string, unknown>;
          return (
            <li key={r.id}>
              <article className="surface interactive flex h-full flex-col gap-2 rounded-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={recordPath(r.id)} className="font-semibold text-ink hover:text-accent-2 hover:underline">
                    {r.name}
                  </Link>
                  {statusCol && typeof x[statusCol.key] === 'string' && <StatusBadge s={x[statusCol.key] as string} />}
                </div>
                {r.description && <p className="line-clamp-2 text-meta text-ink-2">{r.description}</p>}
                {cols.length > 0 && (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-meta">
                    {cols.map((c) => (
                      <Pair key={c.key} label={c.label} value={x[c.key]} />
                    ))}
                  </dl>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
                  <HealthBadge health={entityHealth(r, graph, today)} />
                  <TrustBadge record={r} />
                  <OriginBadge o={r.__origin} />
                  <button type="button" onClick={() => onOpen(r)} className="ml-auto text-meta font-medium text-accent-2 hover:underline">
                    Inspect
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
      {rows.length > LIMIT && <p className="mt-2 text-center text-meta text-ink-3">Showing {LIMIT} of {rows.length} — refine the filter or use the table.</p>}
    </>
  );
}

function Pair({ label, value }: { label: string; value: unknown }) {
  const { byId } = useData();
  let v: ReactNode = '—';
  if (typeof value === 'string' && byId.has(value)) v = byId.get(value)!.name;
  else if (value && typeof value === 'object' && 'value' in (value as object)) v = (value as { value: unknown }).value == null ? 'UNKNOWN' : String((value as { value: unknown }).value);
  else if (Array.isArray(value)) v = value.length ? value.join(', ') : '—';
  else if (value != null && value !== '') v = String(value);
  return (
    <>
      <dt className="text-ink-3">{label}</dt>
      <dd className="truncate">{v}</dd>
    </>
  );
}

/**
 * Board view — one column per status value. Moving a card is an inline quick edit, saved as a
 * local draft (schema-validated; refused changes are reported, never forced).
 */
export function RecordBoard({ entity, rows, onOpen, readOnly }: { entity: string; rows: Rec[]; onOpen: (r: Rec) => void; readOnly?: boolean }) {
  const bk = boardKey(entity)!;
  const columns = useMemo(() => {
    const seen = [...new Set(rows.map((r) => (r as Record<string, unknown>)[bk.key]).filter((v): v is string => typeof v === 'string'))];
    const order = bk.options ? [...bk.options.filter((o) => seen.includes(o) || bk.options!.length <= 8), ...seen.filter((s) => !bk.options!.includes(s))] : seen;
    const none = rows.some((r) => typeof (r as Record<string, unknown>)[bk.key] !== 'string');
    return [...order, ...(none ? ['—'] : [])];
  }, [rows, bk]);
  const move = async (r: Rec, v: string) => {
    try {
      await repo().workspace.save({ ...r, [bk.key]: v, __origin: undefined, __dataset: undefined } as Record<string, unknown>, `${bk.label} → ${v}`);
    } catch (e) {
      toast('Not moved', { tone: 'error', detail: e instanceof ValidationFailure ? e.message : (e as Error).message });
    }
  };
  return (
    <div className="scroll-thin flex gap-3 overflow-x-auto pb-2" role="list" aria-label={`Board by ${bk.label.toLowerCase()}`}>
      {columns.map((col) => {
        const items = rows.filter((r) => ((r as Record<string, unknown>)[bk.key] ?? '—') === col);
        return (
          <section key={col} role="listitem" aria-label={`${col}: ${items.length}`} className="surface flex w-72 shrink-0 flex-col rounded-card p-2.5">
            <h3 className="mb-2 flex items-center justify-between px-1 text-meta font-semibold">
              <span>{col === '—' ? 'Not set' : col}</span>
              <span className="num rounded-full bg-ink/[0.06] px-2 text-micro text-ink-3">{items.length}</span>
            </h3>
            <ul className="scroll-thin flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
              {items.slice(0, 60).map((r) => (
                <li key={r.id} className="rounded-control border border-line bg-solid/70 p-2.5">
                  <button type="button" onClick={() => onOpen(r)} className="text-left font-medium hover:text-accent-2 hover:underline">
                    {r.name}
                  </button>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <TrustBadge record={r} />
                    <OriginBadge o={r.__origin} />
                    {!readOnly && bk.options && (
                      <select aria-label={`Move ${r.name}`} value={col === '—' ? '' : col} onChange={(e) => e.target.value && void move(r, e.target.value)} className="ml-auto max-w-[8.5rem] rounded-md border border-line bg-transparent px-1 py-0.5 text-micro">
                        {col === '—' && <option value="">Move to…</option>}
                        {bk.options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </li>
              ))}
              {items.length > 60 && <li className="text-center text-micro text-ink-3">+{items.length - 60} more</li>}
              {!items.length && <li className="px-1 text-micro text-ink-3">Empty</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
