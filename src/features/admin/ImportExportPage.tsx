import { Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, PageHeader, Select } from '../../components/ui';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData } from '../../hooks/useData';
import type { DraftRow } from '../../repositories/workspaceDb';
import { DatabaseService } from '../../services/database';
import { download, stamp, toCsv } from '../../utils/export';
import { BackupCard, ChangePackageCard, LegacyImportCard } from './AdminPage';

/** DATA → IMPORT / EXPORT (final master prompt §33): every way data enters or leaves this browser. */
export default function ImportExportPage() {
  const { records, drafts: draftCount } = useData();
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [entity, setEntity] = useState('product');
  useEffect(() => {
    void DatabaseService.drafts().then(setDrafts);
  }, [draftCount]);
  const entities = useMemo(() => [...new Set(records.map((r) => r.entity))].sort(), [records]);
  const rows = records.filter((r) => r.entity === entity).map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('__'))));
  return (
    <div className="space-y-5">
      <PageHeader title="Import / Export" subtitle="Export any dataset as CSV or JSON, export your drafts as a change package for GitHub, back up or restore this browser’s workspace, and import the legacy apps’ data." />
      <Card title="Export a dataset" icon={Download} description="Master data plus your local drafts, as currently shown">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-meta font-medium text-ink-2">
            Record type
            <Select value={entity} onChange={(e) => setEntity(e.target.value)} className="w-64">
              {entities.map((e) => (
                <option key={e} value={e}>
                  {ENTITY_BY_TYPE[e]?.plural ?? e} ({records.filter((r) => r.entity === e).length})
                </option>
              ))}
            </Select>
          </label>
          <Button onClick={() => download(`teal-${entity}-${stamp()}.csv`, toCsv(rows), 'text/csv')}>CSV</Button>
          <Button onClick={() => download(`teal-${entity}-${stamp()}.json`, JSON.stringify({ entity, exported_at: new Date().toISOString(), records: rows }, null, 2))}>JSON</Button>
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChangePackageCard drafts={drafts} />
        <BackupCard />
      </div>
      <LegacyImportCard />
    </div>
  );
}
