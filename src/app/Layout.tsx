import clsx from 'clsx';
import { Command, Menu, Search, WifiOff, X } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Badge, ErrorState, Loading } from '../components/ui';
import { WhyProvider } from '../components/why';
import { useData, useOnline } from '../hooks/useData';
import { CommandPalette } from './CommandPalette';
import { NAV } from './nav';

export function Layout() {
  const [palette, setPalette] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [q, setQ] = useState('');
  const online = useOnline();
  const { drafts, status, error, reload } = useData();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => setMobileNav(false), [loc.pathname]);

  const active = (to: string) => (to === '/' ? loc.pathname === '/' : loc.pathname === to || loc.pathname.startsWith(`${to}/`));

  return (
    <WhyProvider>
    <div className="flex h-full">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-panel focus:p-2">
        Skip to content
      </a>
      <aside aria-label="Primary navigation" className={clsx('fixed inset-y-0 left-0 z-40 w-60 shrink-0 overflow-y-auto border-r border-line bg-panel transition-transform lg:static lg:translate-x-0 no-print', mobileNav ? 'translate-x-0' : '-translate-x-full')}>
        <Link to="/" className="flex items-center gap-2 border-b border-line px-3 py-3">
          <span className="grid size-7 place-items-center rounded bg-accent text-[11px] font-bold text-white">TEAL</span>
          <span className="leading-tight">
            <span className="block text-[12.5px] font-semibold">Engineering Intelligence OS</span>
            <span className="block text-[10.5px] text-ink-3">GitHub-native digital thread · V1</span>
          </span>
        </Link>
        <nav className="p-2">
          <ul className="space-y-px">
            {NAV.map((n) => {
              const isActive = active(n.to) || n.children?.some((c) => active(c.to));
              return (
                <li key={n.to}>
                  <NavLink to={n.to} end={n.to === '/'} className={clsx('flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] font-medium uppercase tracking-wide', active(n.to) ? 'bg-accent-soft text-accent-2' : 'text-ink-2 hover:bg-panel-2')}>
                    <n.icon className="size-3.5 shrink-0" aria-hidden />
                    {n.label}
                  </NavLink>
                  {n.children && isActive && (
                    <ul className="mb-1 ml-6 border-l border-line pl-2">
                      {n.children.map((c) => (
                        <li key={c.to}>
                          <NavLink to={c.to} className={({ isActive: a }) => clsx('block rounded px-2 py-1 text-[12.5px]', a ? 'font-semibold text-accent-2' : 'text-ink-3 hover:text-ink')}>
                            {c.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      {mobileNav && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMobileNav(false)} aria-hidden />}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-panel/95 px-3 py-2 backdrop-blur no-print">
          <button type="button" className="rounded p-1 lg:hidden" aria-label={mobileNav ? 'Close navigation' : 'Open navigation'} onClick={() => setMobileNav((m) => !m)}>
            {mobileNav ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <form
            role="search"
            className="flex min-w-0 max-w-xl flex-1 items-center gap-2 rounded-md border border-line bg-panel-2 px-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <Search className="size-4 shrink-0 text-ink-3" aria-hidden />
            <input aria-label="Search engineering knowledge" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, lasers, modules, handbooks… (e.g. 50W 1064nm nanosecond marking)" className="w-full bg-transparent py-1.5 outline-none" />
          </form>
          <button type="button" onClick={() => setPalette(true)} className="hidden items-center gap-1 rounded-md border border-line px-2 py-1 text-[12px] text-ink-3 hover:text-ink sm:inline-flex" aria-label="Open command palette (Ctrl+K)">
            <Command className="size-3.5" /> Ctrl K
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            {!online && (
              <Badge tone="warn" title="No network. Showing cached data; external data is not being refreshed.">
                <WifiOff className="mr-1 size-3" /> Offline mode
              </Badge>
            )}
            {drafts > 0 && (
              <Link to="/admin" title="Local drafts stored only in this browser — export a change package to commit them">
                <Badge tone="draft">{drafts} local draft{drafts === 1 ? '' : 's'}</Badge>
              </Link>
            )}
          </div>
        </header>
        <main id="main" className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4">
          {status === 'loading' && <Loading label="Loading engineering data…" />}
          {status === 'error' && error && <ErrorState what={error.what} why={error.why} todo={error.todo} onRetry={reload} />}
          {status === 'ready' && (
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          )}
        </main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
    </WhyProvider>
  );
}
