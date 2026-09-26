import clsx from 'clsx';
import { Check, ChevronDown, ChevronsUpDown, Clock, PanelLeftClose, PanelLeftOpen, Star } from 'lucide-react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Popover, Tooltip } from '../../components/ui';
import { TealLogo, TealMark } from '../../components/TealLogo';
import { ENTITY_BY_TYPE } from '../../domain/registry';
import { orderedSections, pageFor, workspaceDef, WORKSPACES, type NavSection } from '../nav';
import { setPrefs, usePrefs } from '../prefs';
import { useRecents } from './recents';

function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);
}

export function WorkspaceSwitcher({ collapsed }: { collapsed?: boolean }) {
  const prefs = usePrefs();
  const ws = workspaceDef(prefs.workspace);
  return (
    <Popover
      label="Choose workspace"
      align="start"
      width="w-72"
      trigger={({ toggle, open, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          aria-label={`Workspace: ${ws.label}. Change workspace`}
          className={clsx('flex w-full items-center gap-2.5 rounded-control p-1.5 text-left transition-colors hover:bg-ink/5', collapsed && 'justify-center')}
        >
          {collapsed ? (
            <TealMark className="size-10 shrink-0" />
          ) : (
            <>
              <span className="min-w-0 flex-1 px-1 leading-tight">
                <TealLogo className="h-9 w-auto max-w-[9rem]" fallbackClassName="text-body" />
                <span className="mt-1 block truncate text-micro text-ink-3">
                  <span className="font-semibold text-accent-2">Intelligence</span> · {ws.label}
                </span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-ink-3" aria-hidden />
            </>
          )}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="px-2.5 pt-1.5 pb-1 text-micro font-medium text-ink-3">Workspace — changes emphasis, not data</div>
          <ul>
            {WORKSPACES.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => {
                    setPrefs({ workspace: w.id, openSections: {} });
                    close();
                  }}
                  className={clsx('flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-ink/5', w.id === ws.id && 'bg-accent-soft')}
                >
                  <w.icon className="mt-0.5 size-4 shrink-0 text-accent-2" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{w.label}</span>
                    <span className="block text-micro text-ink-3">{w.desc}</span>
                  </span>
                  {w.id === ws.id && <Check className="mt-0.5 size-4 text-accent-2" aria-label="current" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Popover>
  );
}

function SectionFlyout({ section, pathname }: { section: NavSection; pathname: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const anchor = useRef<HTMLLIElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const active = section.pages.some((p) => isActive(pathname, p.to));
  const show = () => {
    window.clearTimeout(timer.current);
    const r = anchor.current?.getBoundingClientRect();
    if (r) setPos({ top: Math.max(8, Math.min(r.top, window.innerHeight - 40 - section.pages.length * 34)), left: r.right + 6 });
  };
  const hide = () => {
    timer.current = window.setTimeout(() => setPos(null), 120);
  };
  return (
    <li ref={anchor} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && !document.getElementById(`fly-${section.id}`)?.contains(e.relatedTarget as Node) && hide()}>
      <Link
        to={section.pages[0].to}
        aria-label={section.label}
        aria-haspopup="true"
        aria-expanded={!!pos}
        onKeyDown={(e) => e.key === 'Escape' && setPos(null)}
        className={clsx('mx-auto grid size-11 place-items-center rounded-control transition-colors', active ? 'bg-accent-soft text-accent-2' : 'text-ink-2 hover:bg-ink/5 hover:text-ink')}
      >
        <section.icon className="size-5" aria-hidden />
      </Link>
      {pos &&
        createPortal(
          <div id={`fly-${section.id}`} className="fixed z-[65]" style={{ top: Math.max(8, pos.top), left: pos.left }} onMouseEnter={show} onMouseLeave={hide} onClick={() => setPos(null)}>
            <div className="glass-strong w-60 animate-pop-in rounded-card p-1.5">
              <div className="px-2.5 pt-1 pb-1.5 text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">{section.label}</div>
              <ul className="scroll-thin max-h-[calc(100vh-5rem)] overflow-y-auto">
                {section.pages.map((p, pi) => [
                  p.group && p.group !== section.pages[pi - 1]?.group && (
                    <li key={`g-${p.group}`} aria-hidden className="px-2.5 pt-1.5 pb-0.5 text-micro font-semibold uppercase tracking-[0.07em] text-ink-3">
                      {p.group}
                    </li>
                  ),
                  <li key={p.to}>
                    <NavLink to={p.to} end={p.to === '/'} onBlur={hide} onFocus={show} className={({ isActive: a }) => clsx('flex items-center gap-2.5 rounded-lg px-2.5 py-1.5', a ? 'bg-accent-soft text-accent-2' : 'hover:bg-ink/5')}>
                      <p.icon className="size-4 shrink-0 opacity-80" aria-hidden />
                      {p.label}
                    </NavLink>
                  </li>,
                ])}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </li>
  );
}

export function Sidebar({ mobile, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const prefs = usePrefs();
  const { pathname } = useLocation();
  const recents = useRecents(4);
  const collapsed = !mobile && prefs.sidebarCollapsed;
  const sections = orderedSections(prefs.workspace);
  const current = pageFor(pathname);
  const isOpen = (id: string, primary: boolean, idx: number) => prefs.openSections[id] ?? (current?.section.id === id || (primary && idx < 2));

  return (
    <nav aria-label="Primary" className={clsx('glass flex h-full flex-col overflow-hidden', mobile ? 'w-[300px] rounded-r-panel' : 'rounded-panel', collapsed ? 'w-[72px]' : !mobile && 'w-[270px]')} onClick={(e) => (e.target as HTMLElement).closest('a') && onNavigate?.()}>
      <div className={clsx('p-2.5', collapsed && 'px-1.5')}>
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2.5 pb-3">
        {collapsed ? (
          <ul className="space-y-1 pt-1">
            {sections.map(({ section }) => (
              <SectionFlyout key={section.id} section={section} pathname={pathname} />
            ))}
          </ul>
        ) : (
          <>
            {(prefs.favorites.length > 0 || recents.length > 0) && (
              <div className="mb-3 space-y-2 border-b border-line pb-3">
                {prefs.favorites.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 pb-1 text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">
                      <Star className="size-3" aria-hidden /> Pinned
                    </div>
                    <ul>
                      {prefs.favorites.slice(0, 6).map((f) => (
                        <li key={f.id}>
                          <NavLink to={`/record/${encodeURIComponent(f.id)}`} className={({ isActive: a }) => clsx('block truncate rounded-lg px-2 py-1 text-meta', a ? 'bg-accent-soft text-accent-2' : 'text-ink-2 hover:bg-ink/5 hover:text-ink')} title={`${ENTITY_BY_TYPE[f.entity]?.label ?? ''}: ${f.name}`}>
                            {f.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {recents.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 pb-1 text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">
                      <Clock className="size-3" aria-hidden /> Recent
                    </div>
                    <ul>
                      {recents.map((r) => (
                        <li key={r.id}>
                          <NavLink to={`/record/${encodeURIComponent(r.id)}`} className={({ isActive: a }) => clsx('block truncate rounded-lg px-2 py-1 text-meta', a ? 'bg-accent-soft text-accent-2' : 'text-ink-2 hover:bg-ink/5 hover:text-ink')}>
                            {r.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <ul className="space-y-0.5">
              {sections.map(({ section, primary }, idx) => {
                const open = isOpen(section.id, primary, idx);
                const hasActive = section.pages.some((p) => isActive(pathname, p.to));
                const listId = `nav-${section.id}`;
                return (
                  <li key={section.id} className={clsx(!primary && idx > 0 && sections[idx - 1].primary && 'mt-2 border-t border-line pt-2')}>
                    <button
                      type="button"
                      aria-expanded={open}
                      aria-controls={listId}
                      onClick={() => setPrefs((p) => ({ openSections: { ...p.openSections, [section.id]: !open } }))}
                      className={clsx('group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ink/5', hasActive ? 'text-ink' : primary ? 'text-ink-2' : 'text-ink-3')}
                    >
                      <section.icon className={clsx('size-[18px] shrink-0', hasActive && 'text-accent-2')} aria-hidden />
                      <span className="flex-1 text-meta font-semibold uppercase tracking-[0.06em]">{section.label}</span>
                      <ChevronDown className={clsx('size-3.5 text-ink-3 transition-transform duration-200', !open && '-rotate-90')} aria-hidden />
                    </button>
                    {open && (
                      <ul id={listId} className="mt-0.5 mb-1.5 ml-[1.15rem] space-y-px border-l border-line pl-2">
                        {section.pages.map((p, pi) => [
                          p.group && p.group !== section.pages[pi - 1]?.group && (
                            <li key={`g-${p.group}`} aria-hidden className="px-2 pt-2 pb-0.5 text-micro font-semibold uppercase tracking-[0.07em] text-ink-3 first:pt-0.5">
                              {p.group}
                            </li>
                          ),
                          <li key={p.to}>
                            <NavLink
                              to={p.to}
                              end={p.to === '/'}
                              className={({ isActive: a }) => clsx('relative flex items-center gap-2 rounded-lg px-2 py-[0.3rem] text-body transition-colors', a ? 'bg-accent-soft font-medium text-accent-2 before:absolute before:top-1.5 before:bottom-1.5 before:-left-[0.6rem] before:w-0.5 before:rounded-full before:bg-accent' : 'text-ink-2 hover:bg-ink/5 hover:text-ink')}
                            >
                              {p.label}
                            </NavLink>
                          </li>,
                        ])}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {!mobile && (
        <div className={clsx('border-t border-line p-2', collapsed ? 'flex justify-center' : 'flex items-center justify-between')}>
          {!collapsed && <span className="px-2 text-micro text-ink-3">Drafts stay in this browser</span>}
          <Tooltip label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side={collapsed ? 'right' : 'top'}>
            <button type="button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setPrefs((p) => ({ sidebarCollapsed: !p.sidebarCollapsed }))} className="grid size-9 place-items-center rounded-control text-ink-2 hover:bg-ink/5 hover:text-ink">
              {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            </button>
          </Tooltip>
        </div>
      )}
    </nav>
  );
}
