import clsx from 'clsx';
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react';
import { forwardRef, useDeferredValue, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataConfidence } from '../../components/badges';
import { Kbd } from '../../components/ui';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { useData } from '../../hooks/useData';
import { BOOK_TITLES } from '../../services/knowledgeChunks';
import { hitLink, search, type Hit } from '../../services/search';
import { ALL_PAGES } from '../nav';

interface Row {
  key: string;
  group: string;
  title: string;
  sub?: string;
  to: string;
  hit?: Hit;
}

export interface GlobalSearchHandle {
  focus: () => void;
}

/** Global search (spec §09): pages + every search partition + local drafts, grouped by category. */
export const GlobalSearch = forwardRef<GlobalSearchHandle, { className?: string }>(function GlobalSearch({ className }, ref) {
  const { records } = useData();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(0);
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();
  const dq = useDeferredValue(q.trim());
  useImperativeHandle(ref, () => ({ focus: () => input.current?.focus() }), []);

  const drafts = useMemo(() => records.filter((r) => r.__origin && r.__origin !== 'MASTER'), [records]);
  useEffect(() => {
    if (dq.length < 2) {
      setHits([]);
      return;
    }
    let alive = true;
    setBusy(true);
    const t = setTimeout(() => {
      search({ text: dq, limit: 40 }, drafts)
        .then((h) => alive && setHits(h))
        .catch(() => alive && setHits([]))
        .finally(() => alive && setBusy(false));
    }, 120);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [dq, drafts]);

  const rows = useMemo<Row[]>(() => {
    if (dq.length < 2) return [];
    const needle = dq.toLowerCase();
    const pages: Row[] = ALL_PAGES.filter((p) => `${p.label} ${p.desc} ${p.keywords ?? ''}`.toLowerCase().includes(needle))
      .slice(0, 3)
      .map((p) => ({ key: `page:${p.to}`, group: 'Go to', title: p.label, sub: `${p.section.label} · ${p.desc}`, to: p.to }));
    const groups = new Map<string, Row[]>();
    for (const h of hits) {
      const g = h.entity === 'knowledge' ? 'Knowledge' : (ENTITY_BY_TYPE[h.entity]?.plural ?? 'Records');
      const list = groups.get(g) ?? [];
      if (list.length >= 4) continue;
      list.push({ key: `${h.entity}:${h.id}`, group: g, title: h.name, sub: h.entity === 'knowledge' ? (BOOK_TITLES[h.book ?? ''] ?? 'Handbook') : ENTITY_BY_TYPE[h.entity]?.label, to: hitLink(h, dq), hit: h });
      groups.set(g, list);
    }
    return [...pages, ...[...groups.values()].slice(0, 7).flat()];
  }, [hits, dq]);

  useEffect(() => setSel(0), [dq]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const go = (to: string) => {
    nav(to);
    setOpen(false);
    setQ('');
    input.current?.blur();
  };
  const all = () => go(`/search?q=${encodeURIComponent(q.trim())}`);
  const show = open && q.trim().length >= 2;

  return (
    <div ref={box} className={clsx('relative', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (rows[sel]) go(rows[sel].to);
          else if (q.trim()) all();
        }}
        className="group flex h-10 items-center gap-2 rounded-control border border-line-strong bg-solid/60 px-3 transition-[border-color,box-shadow,background-color] duration-150 focus-within:border-accent focus-within:bg-solid focus-within:ring-3 focus-within:ring-accent/15"
      >
        <Search className="size-4 shrink-0 text-ink-3" aria-hidden />
        <input
          ref={input}
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={show && rows[sel] ? `${listId}-${sel}` : undefined}
          aria-label="Search everything"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSel((s) => Math.min(rows.length - 1, s + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSel((s) => Math.max(0, s - 1));
            } else if (e.key === 'Escape') {
              setOpen(false);
              input.current?.blur();
            }
          }}
          placeholder="Search anything… products, suppliers, lasers, requirements, customers"
          className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-ink-3"
        />
        <span className="hidden shrink-0 items-center gap-1 md:flex" aria-hidden>
          <Kbd>/</Kbd>
        </span>
      </form>
      {show && (
        <div className="glass-strong absolute inset-x-0 top-full z-[60] mt-2 animate-pop-in overflow-hidden rounded-card">
          <ul id={listId} role="listbox" aria-label="Search results" className="scroll-thin max-h-[min(70vh,560px)] overflow-y-auto p-1.5">
            {rows.map((r, i) => {
              const first = i === 0 || rows[i - 1].group !== r.group;
              return (
                <li key={r.key} role="presentation">
                  {first && <div className="px-2.5 pt-2 pb-1 text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">{r.group}</div>}
                  <button
                    type="button"
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === sel}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => go(r.to)}
                    className={clsx('flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left', i === sel ? 'bg-accent-soft' : 'hover:bg-ink/5')}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{r.title}</span>
                      {r.sub && <span className="block truncate text-micro text-ink-3">{r.sub}</span>}
                    </span>
                    {r.hit && r.hit.entity !== 'knowledge' && <DataConfidence verification={r.hit.verification} dataType={r.hit.data_type} className="hidden shrink-0 sm:inline-flex" />}
                    {i === sel && <CornerDownLeft className="size-3.5 shrink-0 text-ink-3" aria-hidden />}
                  </button>
                </li>
              );
            })}
            {!rows.length && <li className="px-3 py-6 text-center text-ink-3">{busy ? 'Searching…' : `No matches for “${q.trim()}”.`}</li>}
          </ul>
          <button type="button" onClick={all} className="flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-meta font-medium text-accent-2 hover:bg-accent-soft/50">
            <span>See all results for “{q.trim()}” with filters</span>
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
});
