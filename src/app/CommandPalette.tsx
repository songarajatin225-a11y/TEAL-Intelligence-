import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { useData } from '../hooks/useData';
import { NAV } from './nav';

interface Cmd {
  label: string;
  hint?: string;
  run: () => void;
}

/** Ctrl/⌘ + K command palette (spec §118). */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const { records } = useData();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const go = (to: string) => () => {
    nav(to);
    onClose();
  };
  const commands: Cmd[] = useMemo(
    () => [
      { label: 'Create Opportunity', run: go('/opportunities?new=1') },
      { label: 'Create Customer', run: go('/customers?new=1') },
      { label: 'Create Activity', run: go('/activities?new=1') },
      { label: 'Create Product (from customer inquiry)', run: go('/inquiry') },
      { label: 'New product configuration', run: go('/configurator') },
      { label: 'Create POC', run: go('/poc?new=1') },
      { label: 'Create Requirement', run: go('/requirements?new=1') },
      { label: 'Create BOM', run: go('/bom?new=1') },
      { label: 'Create Cost Model', run: go('/cost?new=1') },
      { label: 'Create RFQ', run: go('/rfq?new=1') },
      { label: 'Create Project', run: go('/projects?new=1') },
      { label: 'Create ECR', run: go('/changes?new=1') },
      { label: 'Search Engineering Knowledge', run: go(`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`) },
      { label: 'Find Similar / Have we solved this before?', run: go('/memory') },
      { label: 'What Can We Reuse?', run: go('/reuse') },
      { label: 'What Is Missing?', run: go('/missing') },
      { label: 'Why? (evidence ledger)', run: go('/evidence') },
      { label: 'Next Action', run: go('/pm') },
      { label: 'What Changed?', run: go('/changed') },
      { label: 'Open Technology Radar', run: go('/technology') },
      ...NAV.flatMap((n) => [{ label: `Go to ${n.label}`, run: go(n.to) }, ...(n.children ?? []).map((c) => ({ label: `Go to ${c.label}`, hint: n.label, run: go(c.to) }))]),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q],
  );

  const results = useMemo(() => {
    const needle = q.toLowerCase().trim();
    const cmds = commands.filter((c) => !needle || c.label.toLowerCase().includes(needle));
    const recs = needle.length >= 2
      ? records
          .filter((r) => r.name.toLowerCase().includes(needle))
          .slice(0, 12)
          .map((r) => ({ label: r.name, hint: ENTITY_BY_TYPE[r.entity]?.label ?? r.entity, run: go(`/record/${encodeURIComponent(r.id)}`) }))
      : [];
    return [...cmds.slice(0, 14), ...recs];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, commands, records]);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-[12vh] no-print" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="w-full max-w-xl overflow-hidden rounded-lg border border-line bg-panel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search className="size-4 text-ink-3" aria-hidden />
          <input
            ref={inputRef}
            aria-label="Command or record"
            className="w-full bg-transparent py-3 text-[14px] outline-none"
            placeholder="Type a command or a record name…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSel((s) => Math.min(results.length - 1, s + 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSel((s) => Math.max(0, s - 1));
              }
              if (e.key === 'Enter') results[sel]?.run();
            }}
          />
        </div>
        <ul role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto py-1">
          {results.map((r, i) => (
            <li key={`${r.label}-${i}`} role="option" aria-selected={i === sel}>
              <button type="button" onMouseEnter={() => setSel(i)} onClick={r.run} className={`flex w-full items-center justify-between px-3 py-1.5 text-left ${i === sel ? 'bg-accent-soft' : ''}`}>
                <span>{r.label}</span>
                {r.hint && <span className="text-[11px] text-ink-3">{r.hint}</span>}
              </button>
            </li>
          ))}
          {!results.length && <li className="px-3 py-3 text-ink-3">No match. Press Enter on “Search Engineering Knowledge” to search everything.</li>}
        </ul>
      </div>
    </div>
  );
}
