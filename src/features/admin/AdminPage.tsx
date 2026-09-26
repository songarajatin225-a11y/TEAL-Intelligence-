import { Download, FileUp, Lock, PackageOpen, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { hasLock, setLock } from '../../app/WorkspaceLock';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Button, Card, Field, Input, Notice, PageHeader, Select, Stat, Table } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { useData } from '../../hooks/useData';
import { repo, validateRecord } from '../../repositories';
import { workspaceBus, workspaceDb, type DraftRow } from '../../repositories/workspaceDb';
import { exportWorkspace, importWorkspace } from '../../services/backup';
import { buildChangePackage, parseChangePackage, type ParsedChangePackage } from '../../services/changePackage';
import { mapCostPlatform, mapTrackerBackup, readCostFromBrowser, readTrackerFromBrowser, type LegacyImportResult } from '../../services/legacyImport';
import { download, readFileText, stamp } from '../../utils/export';
import { fmtDate } from '../../utils/dates';

/**
 * ADMIN / DATA MANAGEMENT (spec §91–§97, §132). Everything on this page acts on this browser's
 * local workspace. Nothing here can change GitHub master data: that takes a change package →
 * reviewed pull request → merge.
 */
export default function AdminPage() {
  const { drafts: draftCount, catalog, records } = useData();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  useEffect(() => {
    workspaceDb().drafts.orderBy('updated_at').reverse().toArray().then(setDrafts).catch(() => setDrafts([]));
  }, [draftCount, records]);

  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Admin" title="Data management" subtitle="Local workspace, change packages, backups, legacy import and the local workspace lock." />
      <Notice tone="draft">
        <strong>Permanent repository update requires a GitHub commit.</strong> Records you create or edit here are LOCAL DRAFTS stored in this browser (IndexedDB). Export a change package and apply it with <code>scripts/data/applyChangePackage.ts</code> in a pull request to update master data.
      </Notice>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Stat label="Local drafts" value={drafts.filter((d) => !d.deleted && !d.overrides_master).length} sub="new records" />
        <Stat label="Local edits of master" value={drafts.filter((d) => !d.deleted && d.overrides_master).length} />
        <Stat label="Local deletions" value={drafts.filter((d) => d.deleted).length} sub="tombstones" />
        <Stat label="Master datasets" value={catalog?.datasets.length ?? '—'} to="/changed" />
        <Stat label="Data quality" value="Run" to="/data-quality" />
      </div>
      <DraftsCard drafts={drafts} />
      <div className="grid gap-3 xl:grid-cols-2">
        <ChangePackageCard drafts={drafts} />
        <BackupCard />
      </div>
      <LegacyImportCard />
      <LockCard />
    </div>
  );
}

function DraftsCard({ drafts }: { drafts: DraftRow[] }) {
  const [filter, setFilter] = useState('');
  const entities = [...new Set(drafts.map((d) => d.entity))].sort();
  const shown = drafts.filter((d) => !filter || d.entity === filter);
  const discardAll = async () => {
    if (!window.confirm(`Discard all ${drafts.length} local draft(s)? Master data is unaffected; unexported local work is lost.`)) return;
    const db = workspaceDb();
    await db.transaction('rw', db.drafts, db.changelog, async () => {
      await db.drafts.clear();
      await db.changelog.add({ record_id: '*', entity: '*', action: 'restore', at: new Date().toISOString(), summary: `Discarded all local drafts (${drafts.length})` });
    });
    workspaceBus.emit();
  };
  return (
    <Card
      title={`Local workspace (${drafts.length})`}
      actions={
        <div className="flex gap-1">
          <Select aria-label="Filter drafts by entity" value={filter} onChange={(e) => setFilter(e.target.value)} className="py-0.5 text-[12px]">
            <option value="">All entities</option>
            {entities.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </Select>
          <Button size="sm" variant="danger" disabled={!drafts.length} onClick={() => void discardAll()}>
            <Trash2 className="size-3.5" /> Discard all
          </Button>
        </div>
      }
    >
      {!drafts.length ? (
        <p className="text-ink-3">No local drafts. Create or edit any record and it appears here as a LOCAL DRAFT.</p>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          <Table head={['Record', 'Entity', 'Change', 'Updated', '']} dense>
            {shown.map((d) => (
              <tr key={d.id}>
                <td>{d.deleted ? <span className="line-through">{String(d.record.name ?? d.id)}</span> : <RecordLink id={d.id} />}</td>
                <td>{d.entity}</td>
                <td>{d.deleted ? <Badge tone="bad">local delete</Badge> : d.overrides_master ? <Badge tone="draft">edit of master</Badge> : <Badge tone="draft">new</Badge>}</td>
                <td>{fmtDate(d.updated_at)}</td>
                <td className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => void repo().workspace.discard(d.id)}>
                    Discard
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </Card>
  );
}

function ChangePackageCard({ drafts }: { drafts: DraftRow[] }) {
  const [by, setBy] = useState('');
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState<ParsedChangePackage | null>(null);
  const [msg, setMsg] = useState<{ tone: 'info' | 'warn'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const exportPkg = async () => {
    const changelog = await workspaceDb().changelog.toArray();
    const { manifest, zip } = buildChangePackage(drafts, changelog, by, note);
    download(`teal-change-package-${stamp()}.zip`, zip, 'application/zip');
    setMsg({ tone: 'info', text: `Exported ${manifest.records.length} record(s). Apply with scripts/data/applyChangePackage.ts and open a pull request.` });
  };
  const openPkg = async (f: File) => {
    try {
      const parsed = parseChangePackage(new Uint8Array(await f.arrayBuffer()));
      setPreview(parsed);
      setMsg(null);
    } catch (e) {
      setPreview(null);
      setMsg({ tone: 'warn', text: `Could not read the package: ${(e as Error).message}` });
    }
  };
  const loadPkg = async () => {
    if (!preview) return;
    const good: Record<string, unknown>[] = [];
    const bad: string[] = [];
    for (const r of preview.records) {
      if ((r as { __delete?: boolean }).__delete) continue;
      try {
        good.push(validateRecord(r as Record<string, unknown>) as Record<string, unknown>);
      } catch (e) {
        bad.push(`${(r as AnyRecord).id}: ${(e as Error).message}`);
      }
    }
    if (good.length) await repo().workspace.saveMany(good, 'Loaded from change package');
    setMsg({ tone: bad.length ? 'warn' : 'info', text: `Loaded ${good.length} record(s) as local drafts.${bad.length ? ` Rejected ${bad.length}: ${bad.slice(0, 3).join(' · ')}` : ''} Deletions in the package are not applied locally.` });
    setPreview(null);
  };
  return (
    <Card title="TEAL change package">
      <p className="mb-2 text-[12.5px] text-ink-2">A ZIP with manifest.json, data/&lt;entity&gt;/&lt;id&gt;.json, changes/changelog.json and documents/README.md. It is the reviewed path from local drafts to GitHub master data.</p>
      <div className="grid gap-2 md:grid-cols-2">
        <Field label="Prepared by" htmlFor="cp-by" hint="Your name or initials — stored in the manifest">
          <Input id="cp-by" value={by} onChange={(e) => setBy(e.target.value)} />
        </Field>
        <Field label="Note for the reviewer" htmlFor="cp-note">
          <Input id="cp-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button variant="primary" disabled={!drafts.length} onClick={() => void exportPkg()}>
          <Download className="size-3.5" /> Export change package ({drafts.length})
        </Button>
        <Button onClick={() => fileRef.current?.click()}>
          <PackageOpen className="size-3.5" /> Open a change package…
        </Button>
        <input ref={fileRef} type="file" accept=".zip,application/zip" className="hidden" aria-label="Change package file" onChange={(e) => e.target.files?.[0] && void openPkg(e.target.files[0])} />
      </div>
      {msg && (
        <div className="mt-2">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      )}
      {preview && (
        <div className="mt-2 rounded border border-line p-2">
          <div className="text-[12px] text-ink-2">
            Created {fmtDate(preview.manifest.created_at)} by {preview.manifest.created_by} · {preview.manifest.records.length} record(s) · {preview.manifest.note}
          </div>
          <ul className="my-1 max-h-40 overflow-y-auto text-[12px]">
            {preview.manifest.records.map((r) => (
              <li key={r.id}>
                <Badge tone={r.action === 'delete' ? 'bad' : 'draft'}>{r.action}</Badge> {r.entity} · {r.name} <span className="text-ink-3">({r.id})</span>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="primary" onClick={() => void loadPkg()}>
            Load into this workspace as drafts
          </Button>
        </div>
      )}
    </Card>
  );
}

function BackupCard() {
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [msg, setMsg] = useState<{ tone: 'info' | 'warn'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const exp = async () => {
    const b = await exportWorkspace();
    download(`teal-workspace-backup-${stamp()}.json`, JSON.stringify(b, null, 2));
    setMsg({ tone: 'info', text: `Backup exported: ${b.drafts.length} draft(s), ${b.changelog.length} change-log rows. The workspace lock is not included.` });
  };
  const imp = async (f: File) => {
    try {
      const json = JSON.parse(await readFileText(f));
      if (mode === 'replace' && !window.confirm('Replace mode clears existing local drafts and change log before importing. Continue?')) return;
      const r = await importWorkspace(json, mode);
      setMsg({ tone: r.ok && !r.rejected.length ? 'info' : 'warn', text: `${r.message}${r.rejected.length ? ` ${r.rejected.slice(0, 3).map((x) => `${x.id}: ${x.reason}`).join(' · ')}` : ''}` });
    } catch (e) {
      setMsg({ tone: 'warn', text: `Not a readable JSON file: ${(e as Error).message}. Nothing was imported.` });
    }
  };
  return (
    <Card title="Workspace backup">
      <p className="mb-2 text-[12.5px] text-ink-2">Everything in this browser’s workspace (drafts, change log, saved searches, preferences) as one JSON file. Import validates every record against its schema; invalid records are reported and skipped.</p>
      <div className="flex flex-wrap items-end gap-2">
        <Button variant="primary" onClick={() => void exp()}>
          <Download className="size-3.5" /> Export backup
        </Button>
        <Field label="Import mode" htmlFor="bk-mode">
          <Select id="bk-mode" value={mode} onChange={(e) => setMode(e.target.value as 'merge' | 'replace')}>
            <option value="merge">Merge (keep existing drafts)</option>
            <option value="replace">Replace (clear drafts first)</option>
          </Select>
        </Field>
        <Button onClick={() => fileRef.current?.click()}>
          <Upload className="size-3.5" /> Import backup…
        </Button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" aria-label="Backup file" onChange={(e) => e.target.files?.[0] && void imp(e.target.files[0])} />
      </div>
      {msg && (
        <div className="mt-2">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      )}
    </Card>
  );
}

type LegacySource = 'tracker' | 'cost';

function LegacyImportCard() {
  const [result, setResult] = useState<(LegacyImportResult & { source: LegacySource; valid: AnyRecord[]; invalid: string[] }) | null>(null);
  const [msg, setMsg] = useState<{ tone: 'info' | 'warn'; text: string } | null>(null);
  const trackerFile = useRef<HTMLInputElement>(null);
  const costFile = useRef<HTMLInputElement>(null);
  const prepare = (source: LegacySource, r: LegacyImportResult) => {
    const valid: AnyRecord[] = [];
    const invalid: string[] = [];
    for (const rec of r.records) {
      try {
        valid.push(validateRecord(rec as Record<string, unknown>));
      } catch (e) {
        invalid.push(`${rec.id}: ${(e as Error).message}`);
      }
    }
    setResult({ ...r, source, valid, invalid });
    setMsg(null);
  };
  const fromBrowser = async (source: LegacySource) => {
    setResult(null);
    if (source === 'tracker') {
      const p = await readTrackerFromBrowser();
      if (!p) return setMsg({ tone: 'warn', text: 'No legacy PM Tracker database was found in this browser. Use the tracker’s “Export backup” and import the file instead.' });
      prepare('tracker', mapTrackerBackup(p));
    } else {
      const p = readCostFromBrowser();
      if (!p) return setMsg({ tone: 'warn', text: 'No legacy Cost Platform data was found in this browser. Use its “Export JSON” and import the file instead.' });
      prepare('cost', mapCostPlatform(p));
    }
  };
  const fromFile = async (source: LegacySource, f: File) => {
    try {
      const json = JSON.parse(await readFileText(f)) as Record<string, unknown>;
      prepare(source, source === 'tracker' ? mapTrackerBackup(json) : mapCostPlatform(((json.db as Record<string, unknown>) ?? json) as Record<string, unknown>));
    } catch (e) {
      setMsg({ tone: 'warn', text: `Could not read ${f.name}: ${(e as Error).message}` });
    }
  };
  const commit = async () => {
    if (!result?.valid.length) return;
    await repo().workspace.saveMany(result.valid as unknown as Record<string, unknown>[], `Imported from legacy ${result.source === 'tracker' ? 'PM Tracker' : 'Cost Platform'}`);
    setMsg({ tone: 'info', text: `Imported ${result.valid.length} record(s) as LOCAL DRAFTS. Re-importing the same data updates them (ids derive from legacy ids).` });
    setResult(null);
  };
  return (
    <Card title="Import from legacy apps">
      <Notice tone="warn">Legacy data stays in this browser. It is your own working data (customers, contacts, quotations) — do not put it into the public repository. Imported records are DRAFT / USER_CREATED and unverified.</Notice>
      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="font-medium">Product Management Tracker</div>
          <p className="text-[12px] text-ink-3">Customers → customers, opportunities/pipeline → opportunities, tasks and follow-ups → activities, sample/POC tracking → POCs.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void fromBrowser('tracker')}>Read from this browser</Button>
            <Button onClick={() => trackerFile.current?.click()}>
              <FileUp className="size-3.5" /> Backup file…
            </Button>
            <input ref={trackerFile} type="file" accept=".json" className="hidden" aria-label="Tracker backup file" onChange={(e) => e.target.files?.[0] && void fromFile('tracker', e.target.files[0])} />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="font-medium">Cost Platform</div>
          <p className="text-[12px] text-ink-3">Costing projects → cost models (all buckets, landed, markup, TEAL sheet) with their customers. Encrypted vaults must be exported from the legacy app first.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void fromBrowser('cost')}>Read from this browser</Button>
            <Button onClick={() => costFile.current?.click()}>
              <FileUp className="size-3.5" /> Export file…
            </Button>
            <input ref={costFile} type="file" accept=".json" className="hidden" aria-label="Cost platform export file" onChange={(e) => e.target.files?.[0] && void fromFile('cost', e.target.files[0])} />
          </div>
        </div>
      </div>
      {msg && (
        <div className="mt-2">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      )}
      {result && (
        <div className="mt-2 space-y-1.5 rounded border border-line p-2 text-[12.5px]">
          <div className="flex flex-wrap gap-1">
            {Object.entries(result.counts).map(([k, v]) => (
              <Badge key={k}>
                {k}: {v}
              </Badge>
            ))}
            <Badge tone="ok">valid {result.valid.length}</Badge>
            {result.invalid.length > 0 && <Badge tone="bad">invalid {result.invalid.length}</Badge>}
          </div>
          {result.warnings.map((w) => (
            <div key={w} className="text-warn">
              {w}
            </div>
          ))}
          {result.invalid.length > 0 && (
            <details>
              <summary className="cursor-pointer text-ink-3">Why were records rejected?</summary>
              <ul className="max-h-40 overflow-y-auto">
                {result.invalid.slice(0, 50).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </details>
          )}
          <Button variant="primary" disabled={!result.valid.length} onClick={() => void commit()}>
            Import {result.valid.length} record(s) as local drafts
          </Button>
        </div>
      )}
      <p className="mt-2 text-[11.5px] text-ink-3">
        The legacy apps themselves remain available under <Link className="text-accent-2" to="/legacy">Legacy apps</Link>.
      </p>
    </Card>
  );
}

function LockCard() {
  const [locked, setLocked] = useState<boolean | null>(null);
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    hasLock().then(setLocked).catch(() => setLocked(false));
  }, []);
  const save = async () => {
    if (a.length < 6) return setMsg('Use at least 6 characters.');
    if (a !== b) return setMsg('The two entries do not match.');
    await setLock(a);
    setA('');
    setB('');
    setLocked(true);
    setMsg('Local workspace lock set. It applies from the next browser session.');
  };
  const clear = async () => {
    await setLock(null);
    setLocked(false);
    setMsg('Local workspace lock removed.');
  };
  return (
    <Card title={<span className="inline-flex items-center gap-1.5"><Lock className="size-4" /> LOCAL WORKSPACE LOCK</span>}>
      <Notice tone="warn">
        A convenience screen lock for a shared computer. It is <strong>not</strong> secure authentication: the passphrase hash lives in this browser, anyone with access to the browser profile or developer tools can bypass it, and it protects nothing published on GitHub Pages. Never rely on it for confidential data — keep confidential data out of the public site.
      </Notice>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <span className="text-[12.5px]">Status: {locked == null ? '…' : locked ? <Badge tone="warn">lock set</Badge> : <Badge>no lock</Badge>}</span>
        <Field label={locked ? 'New passphrase' : 'Passphrase'} htmlFor="lk-a">
          <Input id="lk-a" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} />
        </Field>
        <Field label="Repeat" htmlFor="lk-b">
          <Input id="lk-b" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} />
        </Field>
        <Button variant="primary" onClick={() => void save()}>
          {locked ? 'Change lock' : 'Set lock'}
        </Button>
        {locked && (
          <Button variant="danger" onClick={() => void clear()}>
            Remove lock
          </Button>
        )}
      </div>
      {msg && <p className="mt-1 text-[12px] text-ink-2">{msg}</p>}
    </Card>
  );
}
