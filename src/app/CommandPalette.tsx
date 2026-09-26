import clsx from 'clsx';
import { ArrowRight, Clock, Columns2, MessageSquareText, CornerDownLeft, FileText, Pin, Plus, Search, Settings2, Sparkles, type LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Kbd, useFocusTrap } from '../components/ui';
import { useWhy } from '../components/why';
import { ENTITY_BY_TYPE } from '../domain/registry';
import { useData } from '../hooks/useData';
import { exportWorkspace } from '../services/backup';
import { neighbours } from '../services/graph';
import { whyForRecord } from '../services/why';
import { download, stamp } from '../utils/export';
import { ALL_PAGES, WORKSPACES } from './nav';
import { cycleTheme, getPrefs, isFavorite, setPrefs, toggleFavorite, usePrefs } from './prefs';
import { CREATE_OPTIONS } from './shell/QuickCreate';
import { useRecents } from './shell/recents';
import { useShell } from './shell/ShellContext';

interface Cmd {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon?: LucideIcon;
  keywords?: string;
  run: () => void;
}

/** Universal command centre (spec §10): context · recent · create · navigate · actions · records. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { records, byId, graph } = useData();
  const why = useWhy();
  const shell = useShell();
  const prefs = usePrefs();
  const recents = useRecents(6);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useFocusTrap(ref, open, onClose);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
    }
  }, [open]);

  const commands = useMemo<Cmd[]>(() => {
    const done = (f: () => void) => () => {
      onClose();
      f();
    };
    const go = (to: string) => done(() => nav(to));
    const out: Cmd[] = [];

    // context-sensitive actions on a record page
    const m = /^\/record\/(.+)$/.exec(pathname);
    const rec = m ? byId.get(decodeURIComponent(m[1])) : undefined;
    if (rec) {
      const label = ENTITY_BY_TYPE[rec.entity]?.label ?? 'record';
      out.push({ id: 'ctx:why', group: `This ${label.toLowerCase()}`, label: 'Why? — sources, evidence, assumptions', icon: Sparkles, run: done(() => why.open(rec.name, whyForRecord(rec, graph))) });
      out.push({ id: 'ctx:edit', group: `This ${label.toLowerCase()}`, label: `Edit ${label.toLowerCase()}`, icon: FileText, run: go(`/record/${encodeURIComponent(rec.id)}?edit=1`) });
      out.push({ id: 'ctx:pin', group: `This ${label.toLowerCase()}`, label: isFavorite(prefs, rec.id) ? 'Unpin from sidebar' : 'Pin to sidebar', icon: Pin, run: done(() => toggleFavorite({ id: rec.id, name: rec.name, entity: rec.entity })) });
      const rel = new Map<string, number>();
      for (const n of neighbours(graph, rec.id)) rel.set(n.record.entity, (rel.get(n.record.entity) ?? 0) + 1);
      for (const [e, n] of rel) out.push({ id: `ctx:rel:${e}`, group: `This ${label.toLowerCase()}`, label: `View ${n} related ${(ENTITY_BY_TYPE[e]?.plural ?? e).toLowerCase()}`, icon: ArrowRight, run: go(`/record/${encodeURIComponent(rec.id)}?tab=related`) });
      out.push({ id: 'ctx:compare', group: `This ${label.toLowerCase()}`, label: 'Compare with…', icon: Columns2, run: go(`/compare?ids=${encodeURIComponent(rec.id)}`) });
      out.push({ id: 'ctx:gaps', group: `This ${label.toLowerCase()}`, label: 'What is missing for this?', icon: ArrowRight, run: go(`/record/${encodeURIComponent(rec.id)}?tab=intelligence`) });
    }

    for (const r of recents) out.push({ id: `recent:${r.id}`, group: 'Recent', label: r.name, hint: ENTITY_BY_TYPE[r.entity]?.label, icon: Clock, run: go(`/record/${encodeURIComponent(r.id)}`) });

    for (const o of CREATE_OPTIONS) out.push({ id: `new:${o.entity}`, group: 'Create', label: `New ${o.label.toLowerCase()}`, icon: Plus, keywords: 'create add new', run: done(() => (o.to ? nav(o.to) : shell.openQuickCreate(o.entity))) });

    for (const p of ALL_PAGES) out.push({ id: `go:${p.to}`, group: 'Go to', label: p.label, hint: p.section.label, icon: p.icon, keywords: `${p.desc} ${p.keywords ?? ''}`, run: go(p.to) });

    const actions: [string, string, () => void][] = [
      ['theme', `Change theme (now ${prefs.theme})`, () => cycleTheme()],
      ['density', `Density: switch to ${prefs.density === 'compact' ? 'comfortable' : 'compact'}`, () => setPrefs({ density: getPrefs().density === 'compact' ? 'comfortable' : 'compact' })],
      ['sidebar', prefs.sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation', () => setPrefs((p) => ({ sidebarCollapsed: !p.sidebarCollapsed }))],
      ['focus', shell.focusMode ? 'Exit focus mode' : 'Enter focus mode', shell.toggleFocusMode],
      ['help', 'Help for this page', shell.openHelp],
      ['keys', 'Keyboard shortcuts', shell.openShortcuts],
      ['tour', 'Show the welcome tour', shell.openOnboarding],
      ['backup', 'Export workspace backup (JSON)', () => void exportWorkspace().then((b) => download(`teal-workspace-backup-${stamp()}.json`, JSON.stringify(b, null, 2)))],
      ['admin', 'Export change package / manage drafts', () => nav('/admin')],
    ];
    for (const [id, label, f] of actions) out.push({ id: `act:${id}`, group: 'Actions', label, icon: Settings2, run: done(f) });
    for (const w of WORKSPACES) out.push({ id: `ws:${w.id}`, group: 'Actions', label: `Switch to ${w.label} workspace`, hint: w.desc, icon: w.icon, keywords: 'workspace mode view', run: done(() => setPrefs({ workspace: w.id, openSections: {} })) });
    return out;
  }, [pathname, byId, graph, recents, prefs, shell, why, nav, onClose]);

  const results = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return commands.filter((c) => c.group.startsWith('This') || c.group === 'Recent' || ['new:project', 'new:opportunity', 'new:requirement', 'new:poc', 'go:/', 'go:/products', 'go:/laser', 'go:/projects', 'go:/knowledge', 'act:help'].includes(c.id));
    const words = needle.split(/\s+/);
    const match = (c: Cmd) => {
      const hay = `${c.label} ${c.hint ?? ''} ${c.keywords ?? ''} ${c.group}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    };
    const cmds = commands.filter(match).slice(0, 18);
    const recs: Cmd[] =
      needle.length >= 2
        ? records
            .filter((r) => r.name.toLowerCase().includes(needle))
            .slice(0, 10)
            .map((r) => ({ id: `rec:${r.id}`, group: 'Records', label: r.name, hint: ENTITY_BY_TYPE[r.entity]?.label, icon: FileText, run: () => (onClose(), nav(`/record/${encodeURIComponent(r.id)}`)) }))
        : [];
    const searchAll: Cmd = { id: 'search', group: 'Search', label: `Search everything for “${q.trim()}”`, icon: Search, run: () => (onClose(), nav(`/search?q=${encodeURIComponent(q.trim())}`)) };
    const ask: Cmd = { id: 'ask', group: 'Search', label: `Ask Intelligence: “${q.trim()}”`, icon: MessageSquareText, run: () => (onClose(), nav(`/ask?q=${encodeURIComponent(q.trim())}`)) };
    return [...cmds, ...recs, searchAll, ask];
  }, [q, commands, records, nav, onClose]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-start justify-center px-3 pt-[10vh] no-print">
      <div className="absolute inset-0 animate-fade-in bg-navy/30 dark:bg-black/50" onClick={onClose} aria-hidden />
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Command palette" className="glass-strong relative w-full max-w-2xl animate-pop-in overflow-hidden rounded-panel">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-5 text-ink-3" aria-hidden />
          <input
            data-autofocus
            role="combobox"
            aria-expanded
            aria-controls="palette-list"
            aria-activedescendant={`pal-${sel}`}
            aria-label="Type a command, page or record"
            className="h-14 w-full bg-transparent text-lead outline-none placeholder:text-ink-3"
            placeholder="Type a command, page or record…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSel((s) => Math.min(results.length - 1, s + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSel((s) => Math.max(0, s - 1));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                results[sel]?.run();
              }
            }}
          />
          <Kbd>Esc</Kbd>
        </div>
        <ul id="palette-list" ref={listRef} role="listbox" aria-label="Commands" className="scroll-thin max-h-[min(60vh,520px)] overflow-y-auto p-2">
          {results.map((r, i) => {
            const first = i === 0 || results[i - 1].group !== r.group;
            const Icon = r.icon;
            return (
              <li key={r.id} role="presentation">
                {first && <div className="px-3 pt-2.5 pb-1 text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">{r.group}</div>}
                <button type="button" id={`pal-${i}`} data-idx={i} role="option" aria-selected={i === sel} onMouseMove={() => setSel(i)} onClick={r.run} className={clsx('flex w-full items-center gap-3 rounded-control px-3 py-2 text-left', i === sel ? 'bg-accent-soft text-ink' : 'text-ink-2')}>
                  {Icon && <Icon className={clsx('size-4 shrink-0', i === sel ? 'text-accent-2' : 'text-ink-3')} aria-hidden />}
                  <span className="min-w-0 flex-1 truncate">{r.label}</span>
                  {r.hint && <span className="hidden shrink-0 text-micro text-ink-3 sm:inline">{r.hint}</span>}
                  {i === sel && <CornerDownLeft className="size-3.5 shrink-0 text-ink-3" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 border-t border-line px-4 py-2 text-micro text-ink-3">
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> move
          </span>
          <span>
            <Kbd>↵</Kbd> open
          </span>
          <span className="ml-auto">
            <Kbd>G</Kbd> then <Kbd>H</Kbd> home · <Kbd>N</Kbd> new · <Kbd>?</Kbd> shortcuts
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
