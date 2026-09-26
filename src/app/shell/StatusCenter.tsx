import clsx from 'clsx';
import { Bell, CloudOff, Download, PencilLine, Wifi } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { Button, Popover, Tooltip } from '../../components/ui';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData, useOnline } from '../../hooks/useData';
import type { DraftRow } from '../../repositories/workspaceDb';
import { DatabaseService } from '../../services/database';
import { providers, type SyncStatus } from '../../services/providers';
import { attentionCounts, attentionItems, type AttentionItem } from '../../services/attention';
import { buildChangePackage } from '../../services/changePackage';
import { download, stamp } from '../../utils/export';
import { fmtDate, relativeDay, todayIso } from '../../utils/dates';

const LEVEL = {
  critical: { label: 'Critical', cls: 'text-bad', dot: 'bg-bad' },
  attention: { label: 'Attention', cls: 'text-warn', dot: 'bg-warn' },
  info: { label: 'Info', cls: 'text-info', dot: 'bg-info' },
} as const;

export function useAttention(): AttentionItem[] {
  const { records } = useData();
  const today = todayIso();
  return useMemo(() => attentionItems(records, today), [records, today]);
}

export function AttentionRow({ item, onGo }: { item: AttentionItem; onGo?: () => void }) {
  const l = LEVEL[item.level];
  return (
    <Link to={recordPath(item.recordId)} onClick={onGo} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 hover:bg-ink/5">
      <span className={clsx('mt-1.5 size-2 shrink-0 rounded-full', l.dot)} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.title}</span>
        <span className="block text-micro text-ink-3">
          <span className={clsx('font-medium', l.cls)}>{l.label}</span> · {item.context}
          {item.due && ` · ${relativeDay(item.due)}`}
        </span>
        {item.action && <span className="mt-0.5 block truncate text-meta text-ink-2">→ {item.action}</span>}
      </span>
    </Link>
  );
}

/** Attention centre (spec §40): engineering signals, not social notifications. */
export function AttentionCenter() {
  const items = useAttention();
  const c = attentionCounts(items);
  const urgent = c.critical + c.attention;
  return (
    <Popover
      label="Attention centre"
      width="w-[380px]"
      trigger={({ toggle, open, id }) => (
        <Tooltip label={urgent ? `${urgent} items need attention` : 'Nothing urgent'}>
          <button type="button" onClick={toggle} aria-expanded={open} aria-controls={id} aria-label={`Attention: ${c.critical} critical, ${c.attention} need attention`} className="relative grid size-9 place-items-center rounded-control text-ink-2 hover:bg-ink/5 hover:text-ink">
            <Bell className="size-[18px]" aria-hidden />
            {urgent > 0 && <span className={clsx('absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[0.625rem] font-bold text-white', c.critical ? 'bg-bad' : 'bg-warn')}>{urgent}</span>}
          </button>
        </Tooltip>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-2.5 pt-1.5 pb-2">
            <span className="font-semibold">Needs attention</span>
            <span className="text-micro text-ink-3">
              <span className="text-bad">{c.critical} critical</span> · <span className="text-warn">{c.attention} attention</span>
            </span>
          </div>
          <div className="space-y-0.5">
            {items.slice(0, 9).map((i) => (
              <AttentionRow key={i.id} item={i} onGo={close} />
            ))}
            {!items.length && <p className="px-2.5 py-6 text-center text-ink-3">Nothing needs attention. Every active record has a next action on time.</p>}
          </div>
          <Link to="/" onClick={close} className="mt-1 block rounded-lg px-2.5 py-2 text-center text-meta font-medium text-accent-2 hover:bg-accent-soft/60">
            Open Mission Control
          </Link>
        </div>
      )}
    </Popover>
  );
}

/** System status (spec §38): connected / offline with cached data, freshness, local data. */
export function SystemStatus() {
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const online = useOnline();
  const { catalog, records, loadedAt, drafts } = useData();
  const [sw, setSw] = useState(false);
  useEffect(() => {
    setSw(!!navigator.serviceWorker?.controller);
    void providers.sync.status().then(setSync);
  }, [loadedAt]);
  return (
    <Popover
      label="System status"
      width="w-80"
      trigger={({ toggle, open, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          className={clsx('inline-flex h-9 items-center gap-2 rounded-control px-2.5 text-meta font-medium hover:bg-ink/5', online ? 'text-ink-2' : 'bg-warn/10 text-warn')}
        >
          <span className={clsx('signal', online ? 'signal-live text-ok' : 'text-warn')} aria-hidden />
          <span className={clsx(online && 'hidden xl:inline')}>{online ? 'Online' : 'Offline — cached engineering data'}</span>
          <span className="sr-only">{online ? 'System status: online' : ''}</span>
        </button>
      )}
    >
      {() => (
        <div className="space-y-3 p-2.5">
          <div className="flex items-center gap-2 font-semibold">
            {online ? <Wifi className="size-4 text-ok" aria-hidden /> : <CloudOff className="size-4 text-warn" aria-hidden />}
            {online ? 'Online' : 'Offline mode'}
          </div>
          <p className="text-meta text-ink-2">{online ? 'Master data is served from GitHub Pages; your drafts live in this browser.' : 'Showing the last cached copy of the engineering data. Local drafts keep working; nothing is lost.'}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-meta">
            <dt className="text-ink-3">Data version</dt>
            <dd className="num">{catalog?.generated_at ?? '—'}</dd>
            <dt className="text-ink-3">Loaded</dt>
            <dd>{loadedAt ? new Date(loadedAt).toLocaleTimeString() : '—'}</dd>
            <dt className="text-ink-3">Datasets / records</dt>
            <dd className="num">
              {catalog?.datasets.length ?? 0} / {records.length}
            </dd>
            <dt className="text-ink-3">Available offline</dt>
            <dd>{sw ? 'Yes — app and visited data cached' : 'After the next visit (service worker installing)'}</dd>
            <dt className="text-ink-3">Local drafts</dt>
            <dd className="num">{drafts}</dd>
            <dt className="text-ink-3">Sync</dt>
            <dd>{sync ? `${sync.state}${sync.pending ? ` · ${sync.pending} change(s)` : ''}` : '—'}</dd>
          </dl>
          <Link to="/changed" className="block text-meta font-medium text-accent-2 hover:underline">
            What changed?
          </Link>
        </div>
      )}
    </Popover>
  );
}

/** Local drafts (spec §39): grouped by type with review and export. */
export function DraftsIndicator() {
  const { drafts, loadedAt } = useData();
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [sync, setSync] = useState<SyncStatus | null>(null);
  useEffect(() => {
    void DatabaseService.drafts().then(setRows);
    void providers.sync.status().then(setSync);
  }, [drafts, loadedAt]);
  if (!drafts) return null;
  const groups = new Map<string, number>();
  for (const r of rows) groups.set(r.entity, (groups.get(r.entity) ?? 0) + 1);
  const exportPkg = async () => {
    const log = await DatabaseService.changelog();
    const { zip } = buildChangePackage(rows, log, '', '');
    download(`teal-change-package-${stamp()}.zip`, zip, 'application/zip');
    await providers.sync.markExported();
    setSync(await providers.sync.status());
  };
  return (
    <Popover
      label="Local drafts"
      width="w-80"
      trigger={({ toggle, open, id }) => (
        <Tooltip label="Changes stored only in this browser">
          <button type="button" onClick={toggle} aria-expanded={open} aria-controls={id} className="inline-flex h-9 items-center gap-1.5 rounded-control bg-draft/10 px-2.5 text-meta font-semibold text-draft ring-1 ring-inset ring-draft/25 hover:bg-draft/15">
            <PencilLine className="size-3.5" aria-hidden />
            <span className="num">{drafts}</span>
            <span className="hidden lg:inline">draft{drafts === 1 ? '' : 's'}</span>
            {sync && sync.state !== 'SYNCED' && <span className="hidden text-micro font-bold tracking-[0.04em] 2xl:inline">· {sync.state === 'SYNC PENDING' ? 'SYNC PENDING' : 'LOCAL DATA'}</span>}
          </button>
        </Tooltip>
      )}
    >
      {(close) => (
        <div className="p-2.5">
          <div className="font-semibold">Workspace drafts</div>
          <p className="mt-0.5 text-meta text-ink-3">Stored only in this browser. Permanent repository update requires a GitHub commit.</p>
          {sync && (
            <p className="mt-1.5 text-micro font-semibold tracking-[0.04em] text-draft">
              {sync.state === 'SYNC PENDING' ? `SYNC PENDING — ${sync.pending} change(s) since the last export` : sync.state === 'LOCAL DATA ONLY' ? 'LOCAL DATA — never exported as a change package' : 'SYNCED — exported; awaiting pull request'}
            </p>
          )}
          <ul className="my-2.5 space-y-1">
            {[...groups.entries()].map(([e, n]) => (
              <li key={e} className="flex justify-between text-meta">
                <span>{ENTITY_BY_TYPE[e]?.plural ?? 'Records'}</span>
                <span className="num font-medium">{n}</span>
              </li>
            ))}
          </ul>
          {rows[0] && <div className="mb-2 text-micro text-ink-3">Last change {fmtDate(rows.map((r) => r.updated_at).sort().at(-1))}</div>}
          <div className="flex gap-2">
            <Link to="/admin" onClick={close} className="flex-1">
              <Button className="w-full" size="sm">
                Review
              </Button>
            </Link>
            <Button
              size="sm"
              variant="primary"
              className="flex-1"
              onClick={() => {
                close();
                void exportPkg();
              }}
            >
              <Download className="size-3.5" aria-hidden /> Export package
            </Button>
          </div>
        </div>
      )}
    </Popover>
  );
}
