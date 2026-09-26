import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DataTypeBadge, OriginBadge, StatusBadge, VerificationBadge } from '../../components/badges';
import { DataTable } from '../../components/DataTable';
import { EntityForm } from '../../components/EntityForm';
import { RecordLink } from '../../components/RecordLink';
import { NextActionLine } from '../../components/ThreadPanels';
import { Button, Drawer, EmptyState, Notice, PageHeader } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData, type Rec } from '../../hooks/useData';
import { newLocalId, repo, ValidationFailure } from '../../repositories';
import { fmtDate } from '../../utils/dates';
import { download, parseCsv, readFileText, stamp, toCsv } from '../../utils/export';
import { ENTITY_UI } from './entityUi';

function cellValue(kind: string | undefined, v: unknown): ReactNode {
  if (v == null || v === '') return <span className="text-ink-3">—</span>;
  if (kind === 'status') return <StatusBadge s={String(v)} />;
  if (kind === 'date') return fmtDate(String(v));
  if (kind === 'ref') return <RecordLink id={String(v)} />;
  if (kind === 'list') return Array.isArray(v) ? (v as unknown[]).map(String).map((x) => x.replace(/^ind-/, '')).join(', ') : String(v);
  if (kind === 'num' || kind === 'money') {
    const n = typeof v === 'object' && v && 'value' in (v as object) ? (v as { value: number | null }).value : (v as number);
    if (n == null) return <span className="font-mono text-[11px] text-ink-3">UNKNOWN</span>;
    return <span className="num">{kind === 'money' ? Number(n).toLocaleString('en-IN') : String(n)}</span>;
  }
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 60);
  return String(v);
}

export function EntityListPage({ entity, title, intro, filter, extraActions, eyebrow }: { entity: string; title?: string; intro?: ReactNode; filter?: (r: Rec) => boolean; extraActions?: ReactNode; eyebrow?: string }) {
  const def = ENTITY_BY_TYPE[entity];
  const ui = ENTITY_UI[entity];
  const { records } = useData();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const creating = params.get('new') === '1';
  const rows = useMemo(() => records.filter((r) => r.entity === entity && (!filter || filter(r))), [records, entity, filter]);

  const columns = useMemo<ColumnDef<Rec, unknown>[]>(() => {
    const cols: ColumnDef<Rec, unknown>[] = [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (r) => r.name,
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1">
            <span className="font-medium text-accent-2">{row.original.name}</span>
            <OriginBadge o={row.original.__origin} />
          </div>
        ),
      },
      ...(ui?.columns ?? []).map((c) => ({
        id: c.key,
        header: c.label,
        accessorFn: (r: Rec) => {
          const v = (r as Record<string, unknown>)[c.key];
          return v && typeof v === 'object' && 'value' in (v as object) ? (v as { value: unknown }).value : Array.isArray(v) ? v.join(', ') : v;
        },
        cell: ({ row }: { row: { original: Rec } }) => cellValue(c.kind, (row.original as Record<string, unknown>)[c.key]),
      })),
      { id: 'data_type', header: 'Data', accessorFn: (r) => r.data_type, cell: ({ row }) => <DataTypeBadge t={row.original.data_type} /> },
      { id: 'verification', header: 'Verification', accessorFn: (r) => r.provenance?.verification_status, cell: ({ row }) => <VerificationBadge v={row.original.provenance?.verification_status} /> },
    ];
    if (def?.requiresNextAction) cols.push({ id: 'next', header: 'Next action', accessorFn: (r) => r.next_action?.action ?? '', cell: ({ row }) => <NextActionLine record={row.original} /> });
    return cols;
  }, [ui, def]);

  const exportRows = (fmt: 'csv' | 'json') => {
    const clean = rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('__'))));
    if (fmt === 'json') download(`teal-${entity}-${stamp()}.json`, JSON.stringify({ entity, exported_at: new Date().toISOString(), records: clean }, null, 2));
    else download(`teal-${entity}-${stamp()}.csv`, toCsv(clean), 'text/csv');
  };

  const importFile = async (f: File) => {
    setImportMsg(null);
    try {
      const text = await readFileText(f);
      let items: Record<string, unknown>[];
      if (f.name.endsWith('.csv')) {
        items = parseCsv(text).map((row) => {
          const o: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(row)) {
            if (!v) continue;
            try {
              o[k] = /^[[{]/.test(v) ? JSON.parse(v) : v;
            } catch {
              o[k] = v;
            }
          }
          return o;
        });
      } else {
        const j = JSON.parse(text) as { records?: Record<string, unknown>[] } | Record<string, unknown>[];
        items = Array.isArray(j) ? j : (j.records ?? []);
      }
      const prepared = items.map((x) => ({
        ...(ui?.defaults ?? {}),
        ...x,
        entity,
        id: typeof x.id === 'string' && x.id.startsWith(`${def?.prefix}-`) ? x.id : newLocalId(entity),
        data_type: x.data_type ?? 'USER_CREATED',
        provenance: x.provenance ?? { verification_status: 'DRAFT', note: `Imported from ${f.name}` },
      }));
      await repo().workspace.saveMany(prepared, `Imported ${f.name}`);
      setImportMsg(`Imported ${prepared.length} record(s) as local drafts.`);
    } catch (e) {
      setImportMsg(e instanceof ValidationFailure ? `Nothing imported — validation failed: ${e.message}` : `Nothing imported — ${(e as Error).message}. Use a JSON export from this OS or a CSV with a header row.`);
    }
  };

  if (!def) return <EmptyState title="Unknown module" explain={`No entity "${entity}".`} />;
  return (
    <div>
      <PageHeader
        eyebrow={eyebrow}
        title={title ?? def.plural}
        subtitle={intro ?? ui?.intro}
        actions={
          <>
            {extraActions}
            {!ui?.readOnly && (
              <Button variant="primary" onClick={() => setParams({ new: '1' })}>
                <Plus className="size-3.5" /> New {def.label.toLowerCase()}
              </Button>
            )}
          </>
        }
      />
      {importMsg && (
        <div className="mb-2">
          <Notice tone={importMsg.startsWith('Nothing') ? 'warn' : 'info'}>{importMsg}</Notice>
        </div>
      )}
      {rows.length ? (
        <DataTable
          data={rows}
          columns={columns}
          onRowClick={(r) => nav(`/record/${encodeURIComponent(r.id)}`)}
          filterPlaceholder={`Filter ${def.plural.toLowerCase()}…`}
          toolbar={
            <>
              <Button size="sm" onClick={() => exportRows('csv')}>
                Export CSV
              </Button>
              <Button size="sm" onClick={() => exportRows('json')}>
                Export JSON
              </Button>
              {!ui?.readOnly && (
                <Button size="sm" onClick={() => fileRef.current?.click()}>
                  Import
                </Button>
              )}
            </>
          }
        />
      ) : (
        <EmptyState
          title={`No ${def.plural.toLowerCase()} yet`}
          explain={`There are no ${def.plural.toLowerCase()} in the GitHub master data or in this browser’s workspace. Create one, import a JSON/CSV file, or search the knowledge base.`}
          actions={
            <>
              {!ui?.readOnly && (
                <Button variant="primary" onClick={() => setParams({ new: '1' })}>
                  Create
                </Button>
              )}
              {!ui?.readOnly && <Button onClick={() => fileRef.current?.click()}>Import</Button>}
              <Button onClick={() => nav('/search')}>Search</Button>
              <Button onClick={() => nav('/knowledge')}>Learn more</Button>
            </>
          }
        />
      )}
      <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" aria-label="Import file" onChange={(e) => e.target.files?.[0] && void importFile(e.target.files[0])} />
      <Drawer open={creating} onClose={() => setParams({})} title={`New ${def.label.toLowerCase()}`} wide>
        <EntityForm entity={entity} onCancel={() => setParams({})} onSaved={(r: AnyRecord) => nav(`/record/${encodeURIComponent(r.id)}`)} />
      </Drawer>
    </div>
  );
}
