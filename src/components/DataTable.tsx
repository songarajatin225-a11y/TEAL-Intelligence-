import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState, type VisibilityState } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Rows3, Rows4, Search } from 'lucide-react';
import { useDeferredValue, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { setPrefs, usePrefs } from '../app/prefs';
import { IconButton, Popover, SegmentedControl } from './ui';

const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 639px)') : null;
const useSmall = () =>
  useSyncExternalStore(
    (cb) => {
      mq?.addEventListener('change', cb);
      return () => mq?.removeEventListener('change', cb);
    },
    () => !!mq?.matches,
    () => false,
  );

/**
 * Enterprise table (spec §22): sticky header, sort, filter, density, column visibility
 * (remembered per table), keyboard row activation, virtualisation above 80 rows, and a card
 * layout on phones.
 */
export function DataTable<T>({ data, columns, onRowClick, filterPlaceholder = 'Filter…', height = 620, toolbar, tableKey, filter: filterProp, onFilterChange }: { filter?: string; onFilterChange?: (v: string) => void; data: T[]; columns: ColumnDef<T, unknown>[]; onRowClick?: (row: T) => void; filterPlaceholder?: string; height?: number; toolbar?: React.ReactNode; tableKey?: string }) {
  const prefs = usePrefs();
  const small = useSmall();
  const density = (tableKey && prefs.tableDensity[tableKey]) || 'comfortable';
  const hidden = useMemo(() => (tableKey ? (prefs.hiddenColumns[tableKey] ?? []) : []), [prefs.hiddenColumns, tableKey]);
  const [localHidden, setLocalHidden] = useState<string[]>([]);
  const hiddenCols = tableKey ? hidden : localHidden;
  const visibility: VisibilityState = useMemo(() => Object.fromEntries(hiddenCols.map((c) => [c, false])), [hiddenCols]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterLocal, setFilterLocal] = useState('');
  const filter = filterProp ?? filterLocal;
  const setFilter = onFilterChange ?? setFilterLocal;
  const deferred = useDeferredValue(filter);
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: deferred, columnVisibility: visibility },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });
  const rows = table.getRowModel().rows;
  const parentRef = useRef<HTMLDivElement>(null);
  const rowH = density === 'compact' ? 34 : 46;
  const virtual = !small && rows.length > 80;
  const v = useVirtualizer({ count: rows.length, getScrollElement: () => parentRef.current, estimateSize: () => rowH, overscan: 12, enabled: virtual });
  const items = virtual ? v.getVirtualItems() : rows.map((_, i) => ({ index: i, start: 0, size: 0, end: 0, key: i }));
  const padTop = virtual && items.length ? items[0].start : 0;
  const padBottom = virtual && items.length ? v.getTotalSize() - items[items.length - 1].end : 0;
  const toggleCol = (id: string) => {
    const next = hiddenCols.includes(id) ? hiddenCols.filter((c) => c !== id) : [...hiddenCols, id];
    if (tableKey) setPrefs((p) => ({ hiddenColumns: { ...p.hiddenColumns, [tableKey]: next } }));
    else setLocalHidden(next);
  };
  const visibleCells = (r: (typeof rows)[number]) => r.getVisibleCells();

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 no-print">
        <label className="flex h-9 min-w-0 max-w-xs flex-1 items-center gap-2 rounded-control border border-line-strong bg-solid/60 px-3 focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/15">
          <Search className="size-4 shrink-0 text-ink-3" aria-hidden />
          <input aria-label="Filter rows" placeholder={filterPlaceholder} value={filter} onChange={(e) => setFilter(e.target.value)} className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-ink-3" />
        </label>
        <span className="num text-meta text-ink-3" aria-live="polite">
          {rows.length === data.length ? `${data.length} rows` : `${rows.length} of ${data.length}`}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {toolbar}
          {!small && (
            <>
              <SegmentedControl
                size="sm"
                label="Row density"
                value={density}
                onChange={(d) => tableKey && setPrefs((p) => ({ tableDensity: { ...p.tableDensity, [tableKey]: d } }))}
                options={[
                  { value: 'comfortable', label: <span className="sr-only">Comfortable</span>, icon: Rows3 },
                  { value: 'compact', label: <span className="sr-only">Compact</span>, icon: Rows4 },
                ]}
              />
              <Popover label="Columns" width="w-60" trigger={({ toggle, open, id }) => <IconButton size="sm" label="Show or hide columns" icon={Columns3} onClick={toggle} aria-expanded={open} aria-controls={id} />}>
                {() => (
                  <div className="p-1">
                    <div className="px-2 pt-1 pb-1.5 text-micro font-medium text-ink-3">Columns</div>
                    {table.getAllLeafColumns().map((c, i) => (
                      <label key={c.id} className={clsx('flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink/5', i === 0 && 'opacity-60')}>
                        <input type="checkbox" className="accent-[var(--c-accent)]" checked={c.getIsVisible()} disabled={i === 0} onChange={() => toggleCol(c.id)} />
                        <span className="text-meta">{typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id}</span>
                      </label>
                    ))}
                  </div>
                )}
              </Popover>
            </>
          )}
        </div>
      </div>

      {small ? (
        <ul className="space-y-2">
          {rows.slice(0, 200).map((row) => {
            const cells = visibleCells(row);
            return (
              <li key={row.id}>
                <div
                  role={onRowClick ? 'button' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onRowClick(row.original)) : undefined}
                  className="surface rounded-card p-3.5"
                >
                  <div className="font-medium">{flexRender(cells[0].column.columnDef.cell, cells[0].getContext())}</div>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-meta">
                    {cells.slice(1, 5).map((c) => (
                      <div key={c.id} className="contents">
                        <dt className="text-ink-3">{typeof c.column.columnDef.header === 'string' ? c.column.columnDef.header : ''}</dt>
                        <dd className="min-w-0">{flexRender(c.column.columnDef.cell, c.getContext())}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </li>
            );
          })}
          {rows.length > 200 && <li className="text-center text-meta text-ink-3">Showing 200 of {rows.length} — refine the filter.</li>}
        </ul>
      ) : (
        <div ref={parentRef} className="surface scroll-thin overflow-auto rounded-card" style={{ maxHeight: height }}>
          <table className={clsx('w-full border-collapse text-left', density === 'compact' ? 'text-meta' : 'text-body')}>
            <thead className="sticky top-0 z-10 bg-panel-2/95 backdrop-blur-sm">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => {
                    const sorted = h.column.getIsSorted();
                    return (
                      <th key={h.id} scope="col" aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'} className="whitespace-nowrap border-b border-line px-3 py-2.5 text-meta font-medium text-ink-3">
                        {h.isPlaceholder ? null : (
                          <button type="button" className="group inline-flex items-center gap-1 rounded-md hover:text-ink" onClick={h.column.getToggleSortingHandler()}>
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {sorted === 'asc' ? <ArrowUp className="size-3.5" /> : sorted === 'desc' ? <ArrowDown className="size-3.5" /> : <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />}
                          </button>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {padTop > 0 && (
                <tr>
                  <td style={{ height: padTop }} />
                </tr>
              )}
              {items.map((vi) => {
                const row = rows[vi.index];
                return (
                  <tr
                    key={row.id}
                    className={clsx('border-b border-line transition-colors last:border-0', onRowClick && 'cursor-pointer hover:bg-accent-soft/50 focus-visible:bg-accent-soft/60')}
                    onClick={onRowClick ? (e) => !(e.target as HTMLElement).closest('a,button') && onRowClick(row.original) : undefined}
                    onKeyDown={onRowClick ? (e) => (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && (e.preventDefault(), onRowClick(row.original)) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                  >
                    {visibleCells(row).map((c) => (
                      <td key={c.id} className={clsx('px-3 align-top', density === 'compact' ? 'py-1.5' : 'py-3')}>
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {padBottom > 0 && (
                <tr>
                  <td style={{ height: padBottom }} />
                </tr>
              )}
              {!rows.length && (
                <tr>
                  <td colSpan={99} className="px-3 py-10 text-center text-ink-3">
                    No rows match “{filter}”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
