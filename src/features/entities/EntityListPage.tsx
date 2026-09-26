import type { ColumnDef } from '@tanstack/react-table';
import { Bookmark, Download, KanbanSquare, LayoutGrid, Plus, Table2, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { setPrefs, usePrefs, type ListView } from '../../app/prefs';
import { DataTypeBadge, OriginBadge, StatusBadge, VerificationBadge } from '../../components/badges';
import { DataTable } from '../../components/DataTable';
import { EntityForm } from '../../components/EntityForm';
import { RecordLink, recordPath } from '../../components/RecordLink';
import { NextActionLine } from '../../components/ThreadPanels';
import { EntityDrawer } from '../../components/EntityDrawer';
import { toast } from '../../components/toast';
import { Button, Drawer, EmptyState, Input, Notice, PageHeader, Popover, SegmentedControl } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData, type Rec } from '../../hooks/useData';
import { newLocalId, repo, ValidationFailure } from '../../repositories';
import { fmtDate } from '../../utils/dates';
import { download, parseCsv, readFileText, stamp, toCsv } from '../../utils/export';
import { ENTITY_UI } from './entityUi';
import { boardKey, matchesQuery, RecordBoard, RecordCards } from './ListViews';

function cellValue(kind: string | undefined, v: unknown): ReactNode {
  if (v == null || v === '') return <span className="text-ink-3">—</span>;
  if (kind === 'status') return <StatusBadge s={String(v)} />;
  if (kind === 'date') return fmtDate(String(v));
  if (kind === 'ref') return <RecordLink id={String(v)} />;
  if (kind === 'list') return Array.isArray(v) ? (v as unknown[]).map(String).map((x) => x.replace(/^ind-/, '')).join(', ') : String(v);
  if (kind === 'num' || kind === 'money') {
    const n = typeof v === 'object' && v && 'value' in (v as object) ? (v as { value: number | null }).value : (v as number);
    if (n == null) return <span className="font-mono text-micro text-ink-3">UNKNOWN</span>;
    return <span className="num">{kind === 'money' ? Number(n).toLocaleString('en-IN') : String(n)}</span>;
  }
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 60);
  return String(v);
}

/**
 * `embedded`: the list sits under another page's h1, so its header renders as h2.
 * `createTo`: route of a dedicated editor that replaces the generic "New" form.
 */
export function EntityListPage({ entity, title, intro, filter, extraActions, eyebrow, embedded, createTo }: { entity: string; title?: string; intro?: ReactNode; filter?: (r: Rec) => boolean; extraActions?: ReactNode; eyebrow?: string; embedded?: boolean; createTo?: string }) {
  const def = ENTITY_BY_TYPE[entity];
  const ui = ENTITY_UI[entity];
  const { records } = useData();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const creating = params.get('new') === '1';
  const [preview, setPreview] = useState<Rec | null>(null);
  const rows = useMemo(() => records.filter((r) => r.entity === entity && (!filter || filter(r))), [records, entity, filter]);
  const prefs = usePrefs();
  const board = boardKey(entity);
  const view: ListView = ((v) => (v === 'board' && !board ? 'table' : v))(prefs.listView[entity] ?? 'table');
  const setView = (v: ListView) => setPrefs((p) => ({ listView: { ...p.listView, [entity]: v } }));
  const q = params.get('q') ?? '';
  const setQ = (v: string) =>
    setParams(
      (p) => {
        if (v) p.set('q', v);
        else p.delete('q');
        return p;
      },
      { replace: true },
    );
  const filtered = useMemo(() => (view === 'table' ? rows : rows.filter((r) => matchesQuery(r, q))), [rows, q, view]);
  const saved = prefs.savedViews.filter((v) => v.entity === entity);
  const [viewName, setViewName] = useState('');
  const saveView = () => {
    const name = viewName.trim() || (q ? `“${q}”` : `${view} view`);
    setPrefs((p) => ({ savedViews: [...p.savedViews, { id: `${entity}:${Date.now()}`, name, entity, q, view }] }));
    setViewName('');
    toast('View saved', { detail: `${name} — in this browser` });
  };

  const columns = useMemo<ColumnDef<Rec, unknown>[]>(() => {
    const cols: ColumnDef<Rec, unknown>[] = [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (r) => r.name,
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1">
            <Link className="font-medium text-accent-2 hover:underline" to={recordPath(row.original.id)}>
              {row.original.name}
            </Link>
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
        level={embedded ? 2 : 1}
        eyebrow={eyebrow}
        title={title ?? def.plural}
        subtitle={intro ?? ui?.intro}
        actions={
          <>
            {extraActions}
            {!ui?.readOnly && (
              <Button variant="primary" onClick={() => (createTo ? nav(createTo) : setParams({ new: '1' }))}>
                <Plus className="size-4" aria-hidden /> New {def.label.toLowerCase()}
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
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SegmentedControl<ListView>
              label="View"
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { value: 'table', label: 'Table', icon: Table2 },
                { value: 'cards', label: 'Cards', icon: LayoutGrid },
                ...(board ? [{ value: 'board' as const, label: 'Board', icon: KanbanSquare }] : []),
              ]}
            />
            {view !== 'table' && (
              <div className="w-full sm:w-64">
                <Input aria-label={`Filter ${def.plural.toLowerCase()}`} placeholder={`Filter ${def.plural.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} className="h-8 py-1" />
              </div>
            )}
            <Popover
              label="Saved views"
              width="w-72"
              align="start"
              trigger={({ toggle, open, id }) => (
                <Button size="sm" variant="ghost" onClick={toggle} aria-expanded={open} aria-controls={id}>
                  <Bookmark className="size-3.5" aria-hidden /> Views{saved.length ? ` (${saved.length})` : ''}
                </Button>
              )}
            >
              {(close) => (
                <div className="space-y-2">
                  {saved.length ? (
                    <ul>
                      {saved.map((v) => (
                        <li key={v.id} className="flex items-center gap-1">
                          <button
                            type="button"
                            className="min-w-0 flex-1 truncate rounded-lg px-2.5 py-1.5 text-left hover:bg-ink/5"
                            onClick={() => {
                              setView(v.view);
                              setQ(v.q);
                              close();
                            }}
                          >
                            {v.name} <span className="text-micro text-ink-3">· {v.view}</span>
                          </button>
                          <button type="button" aria-label={`Delete view ${v.name}`} className="rounded-lg p-1.5 text-ink-3 hover:bg-bad/10 hover:text-bad" onClick={() => setPrefs((p) => ({ savedViews: p.savedViews.filter((x) => x.id !== v.id) }))}>
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-1 text-meta text-ink-3">No saved views yet. Save the current layout and filter to come back to it.</p>
                  )}
                  <form
                    className="flex gap-1.5 border-t border-line pt-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveView();
                      close();
                    }}
                  >
                    <Input aria-label="View name" placeholder="Name this view" value={viewName} onChange={(e) => setViewName(e.target.value)} className="h-8 flex-1 py-1" />
                    <Button size="sm" type="submit">
                      Save
                    </Button>
                  </form>
                </div>
              )}
            </Popover>
          </div>
          {view === 'cards' ? (
            <RecordCards entity={entity} rows={filtered} onOpen={setPreview} />
          ) : view === 'board' ? (
            <RecordBoard entity={entity} rows={filtered} onOpen={setPreview} readOnly={ui?.readOnly} />
          ) : (
            <DataTable
              tableKey={entity}
              filter={q}
              onFilterChange={setQ}
              data={rows}
              columns={columns}
              onRowClick={(r) => setPreview(r)}
              filterPlaceholder={`Filter ${def.plural.toLowerCase()}…`}
              toolbar={
                <Popover
                  label="Export and import"
                  width="w-56"
                  trigger={({ toggle, open, id }) => (
                    <Button size="sm" onClick={toggle} aria-expanded={open} aria-controls={id}>
                      <Download className="size-3.5" aria-hidden /> Export
                    </Button>
                  )}
                >
                  {(close) => (
                    <ul>
                      {[
                        ['Export CSV', () => exportRows('csv')],
                        ['Export JSON', () => exportRows('json')],
                        ...(!ui?.readOnly ? ([['Import JSON / CSV…', () => fileRef.current?.click()]] as const) : []),
                      ].map(([label, f]) => (
                        <li key={label as string}>
                          <button
                            type="button"
                            className="w-full rounded-lg px-2.5 py-1.5 text-left hover:bg-ink/5"
                            onClick={() => {
                              close();
                              (f as () => void)();
                            }}
                          >
                            {label as string}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </Popover>
              }
        />
          )}
        </>
      ) : (
        <EmptyState
          title={`No ${def.plural.toLowerCase()} yet`}
          explain={`There are no ${def.plural.toLowerCase()} in the GitHub master data or in this browser’s workspace. Create one, import a JSON/CSV file, or search the knowledge base.`}
          actions={
            <>
              {!ui?.readOnly && (
                <Button variant="primary" onClick={() => (createTo ? nav(createTo) : setParams({ new: '1' }))}>
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
      <EntityDrawer record={preview} onClose={() => setPreview(null)} />
      <Drawer open={creating} onClose={() => setParams({})} title={`New ${def.label.toLowerCase()}`} wide>
        <EntityForm entity={entity} onCancel={() => setParams({})} onSaved={(r: AnyRecord) => nav(`/record/${encodeURIComponent(r.id)}`)} />
      </Drawer>
    </div>
  );
}
