import { useEffect, useMemo, useState } from 'react';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Card, PageHeader, Table } from '../../components/ui';
import { useData } from '../../hooks/useData';
import { workspaceDb, type ChangeLogRow } from '../../repositories/workspaceDb';
import { fmtDate, todayIso, daysBetween } from '../../utils/dates';

/**
 * WHAT CHANGED? (spec §65, §143): new · updated · removed · discontinued · conflicted · stale.
 * Master data changes live in Git history; this page shows dataset versions, record flags and
 * this browser's local changes.
 */
export default function ChangedPage() {
  const { records, catalog } = useData();
  const [log, setLog] = useState<ChangeLogRow[]>([]);
  useEffect(() => {
    workspaceDb().changelog.orderBy('seq').reverse().limit(200).toArray().then(setLog).catch(() => setLog([]));
  }, [records]);
  const today = todayIso();
  const flags = useMemo(() => {
    const conflicted = records.filter((r) => r.provenance?.verification_status === 'CONFLICTED');
    const stale = records.filter((r) => r.provenance?.verification_status === 'STALE' || (r.provenance?.last_verified && daysBetween(r.provenance.last_verified, today) > 365) || ((r as { price_date?: string }).price_date && daysBetween((r as unknown as { price_date: string }).price_date, today) > 180));
    const discontinued = records.filter((r) => /discontinued|obsolete/i.test(String(r.status ?? '')));
    const localNew = records.filter((r) => r.__origin === 'LOCAL_NEW');
    const localUpd = records.filter((r) => r.__origin === 'LOCAL_DRAFT');
    return { conflicted, stale, discontinued, localNew, localUpd };
  }, [records, today]);
  const removed = log.filter((l) => l.action === 'delete');
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Digital thread" title="What Changed?" subtitle="Git history is the change history of master data. Local changes in this browser are listed until exported as a change package." />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {(
          [
            ['New (local)', flags.localNew.length, 'draft'],
            ['Updated (local)', flags.localUpd.length, 'draft'],
            ['Removed (local)', removed.length, 'bad'],
            ['Discontinued', flags.discontinued.length, 'neutral'],
            ['Conflicted', flags.conflicted.length, 'bad'],
            ['Stale', flags.stale.length, 'warn'],
          ] as const
        ).map(([l, n, t]) => (
          <div key={l} className="rounded-lg border border-line bg-panel p-2">
            <Badge tone={t}>{l}</Badge>
            <div className="num text-xl font-semibold">{n}</div>
          </div>
        ))}
      </div>
      <Card title="Master datasets (from data/catalog.json)">
        <Table head={['Dataset', 'Version', 'Records', 'Last updated', 'Data type', 'Hash']} dense>
          {(catalog?.datasets ?? [])
            .slice()
            .sort((a, b) => b.last_updated.localeCompare(a.last_updated))
            .map((d) => (
              <tr key={d.id}>
                <td>{d.title}</td>
                <td className="num">{d.version}</td>
                <td className="num">{d.record_count || '—'}</td>
                <td>{fmtDate(d.last_updated)}</td>
                <td>{d.data_type}</td>
                <td className="num text-micro text-ink-3">{d.sha256}</td>
              </tr>
            ))}
        </Table>
      </Card>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card title="Stale records">
          <ul className="max-h-72 space-y-0.5 overflow-y-auto">
            {flags.stale.slice(0, 80).map((r) => (
              <li key={r.id}>
                <RecordLink id={r.id} /> <span className="text-micro text-ink-3">{(r as { price_date?: string }).price_date ? `price dated ${(r as { price_date?: string }).price_date}` : `verified ${r.provenance?.last_verified}`}</span>
              </li>
            ))}
            {!flags.stale.length && <li className="text-ink-3">None.</li>}
          </ul>
        </Card>
        <Card title="Local change log (this browser)">
          <ul className="max-h-72 space-y-0.5 overflow-y-auto">
            {log.map((l) => (
              <li key={l.seq} className="flex gap-2">
                <Badge tone={l.action === 'delete' ? 'bad' : l.action === 'create' ? 'ok' : 'neutral'}>{l.action}</Badge>
                <span className="min-w-0 flex-1 truncate">{l.summary}</span>
                <span className="text-micro text-ink-3">{fmtDate(l.at)}</span>
              </li>
            ))}
            {!log.length && <li className="text-ink-3">No local changes.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
