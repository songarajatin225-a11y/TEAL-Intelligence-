import { flexRender, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useDeferredValue, useRef, useState } from 'react';
import { Input } from './ui';

/**
 * Sortable, filterable table (TanStack Table). Rows are virtualized above 80 rows so large
 * datasets (item master, formulas, knowledge) stay fast (spec §123).
 */
export function DataTable<T>({ data, columns, onRowClick, filterPlaceholder = 'Filter…', height = 560, toolbar }: { data: T[]; columns: ColumnDef<T, unknown>[]; onRowClick?: (row: T) => void; filterPlaceholder?: string; height?: number; toolbar?: React.ReactNode }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState('');
  const deferred = useDeferredValue(filter);
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: deferred },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });
  const rows = table.getRowModel().rows;
  const parentRef = useRef<HTMLDivElement>(null);
  const virtual = rows.length > 80;
  const v = useVirtualizer({ count: rows.length, getScrollElement: () => parentRef.current, estimateSize: () => 34, overscan: 12, enabled: virtual });
  const items = virtual ? v.getVirtualItems() : rows.map((_, i) => ({ index: i, start: 0, size: 0, end: 0, key: i }));
  const padTop = virtual && items.length ? items[0].start : 0;
  const padBottom = virtual && items.length ? v.getTotalSize() - items[items.length - 1].end : 0;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 no-print">
        <Input aria-label="Filter rows" placeholder={filterPlaceholder} value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" />
        <span className="text-[12px] text-ink-3">
          {rows.length} of {data.length}
        </span>
        <div className="ml-auto flex flex-wrap gap-1.5">{toolbar}</div>
      </div>
      <div ref={parentRef} className="overflow-auto rounded-lg border border-line bg-panel" style={{ maxHeight: height }}>
        <table className="w-full border-collapse text-left text-[12.5px]">
          <thead className="sticky top-0 z-10 bg-panel-2">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted();
                  return (
                    <th key={h.id} scope="col" aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'} className="whitespace-nowrap border-b border-line px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                      {h.isPlaceholder ? null : (
                        <button type="button" className="inline-flex items-center gap-1 hover:text-ink" onClick={h.column.getToggleSortingHandler()}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sorted === 'asc' && <ArrowUp className="size-3" />}
                          {sorted === 'desc' && <ArrowDown className="size-3" />}
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
                  className={onRowClick ? 'cursor-pointer hover:bg-accent-soft/50' : ''}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row.original) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {row.getVisibleCells().map((c) => (
                    <td key={c.id} className="border-b border-line/70 px-2 py-1.5 align-top">
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
