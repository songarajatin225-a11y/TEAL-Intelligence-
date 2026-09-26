import clsx from 'clsx';
import { Briefcase, Home, Keyboard, LifeBuoy, Maximize2, Menu, Minimize2, MoonStar, Plus, Search, SunMedium, X } from 'lucide-react';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ToastHost } from '../components/toast';
import { ErrorState, IconButton, Loading, Modal, Popover, useFocusTrap } from '../components/ui';
import { WhyProvider } from '../components/why';
import { useData } from '../hooks/useData';
import { CommandPalette } from './CommandPalette';
import { resolvedTheme, usePrefs } from './prefs';
import { Breadcrumbs, useCrumbs } from './shell/Breadcrumbs';
import { GlobalSearch, type GlobalSearchHandle } from './shell/GlobalSearch';
import { AppearanceSettings, HelpDrawer, Onboarding, ShortcutsModal } from './shell/Overlays';
import { CREATE_OPTIONS, QuickCreateDrawer, QuickCreateMenu } from './shell/QuickCreate';
import { ShellContext, type ShellApi } from './shell/ShellContext';
import { useShortcuts } from './shell/shortcuts';
import { Sidebar } from './shell/Sidebar';
import { TealMark } from '../components/TealLogo';
import { AttentionCenter, DraftsIndicator, SystemStatus } from './shell/StatusCenter';

const FOCUS_KEY = 'teal-os:focus';

/** The TEAL Intelligence shell (docs/07_UX_REDESIGN.md): sidebar · command header · workspace. */
export function Layout() {
  const prefs = usePrefs();
  const { status, error, reload } = useData();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const crumbs = useCrumbs();
  const searchRef = useRef<GlobalSearchHandle>(null);
  const [palette, setPalette] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [create, setCreate] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [onboarding, setOnboarding] = useState(() => !prefs.onboarded);
  const [focusMode, setFocusMode] = useState(() => {
    try {
      return sessionStorage.getItem(FOCUS_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggleFocusMode = useCallback(() => {
    setFocusMode((f) => {
      try {
        sessionStorage.setItem(FOCUS_KEY, f ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !f;
    });
  }, []);
  const openQuickCreate = useCallback(
    (entity?: string) => {
      const to = CREATE_OPTIONS.find((o) => o.entity === entity)?.to;
      if (to) nav(to);
      else setCreate(entity ?? 'project');
    },
    [nav],
  );
  const focusSearch = useCallback(() => {
    if (window.matchMedia('(min-width: 768px)').matches && !focusMode) searchRef.current?.focus();
    else setPalette(true);
  }, [focusMode]);

  const api = useMemo<ShellApi>(
    () => ({
      openPalette: () => setPalette(true),
      openQuickCreate,
      openHelp: () => setHelp(true),
      openShortcuts: () => setShortcuts(true),
      focusSearch,
      focusMode,
      toggleFocusMode,
      openOnboarding: () => setOnboarding(true),
    }),
    [openQuickCreate, focusSearch, focusMode, toggleFocusMode],
  );

  useShortcuts({ palette: () => setPalette((p) => !p), search: focusSearch, create: () => setCreate('__menu'), focus: toggleFocusMode, help: () => setShortcuts(true), go: nav });

  useEffect(() => {
    setMobileNav(false);
    window.scrollTo(0, 0);
  }, [pathname]);
  const pageTitle = crumbs[crumbs.length - 1]?.label;
  useEffect(() => {
    document.title = pageTitle && pathname !== '/' ? `${pageTitle} · TEAL Intelligence` : 'TEAL Intelligence';
  }, [pageTitle, pathname]);

  const dark = resolvedTheme(prefs) === 'dark';

  return (
    <WhyProvider>
      <ShellContext.Provider value={api}>
        <div className="app-bg" aria-hidden />
        <a href="#main" className="sr-only z-[100] rounded-control bg-solid px-3 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          Skip to content
        </a>
        <div className="flex min-h-full">
          {!focusMode && (
            <aside className="sticky top-0 hidden h-screen shrink-0 p-3 pr-0 lg:block no-print">
              <Sidebar />
            </aside>
          )}
          {mobileNav && <MobileDrawer onClose={() => setMobileNav(false)} />}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 no-print">
              <div className="glass flex h-14 items-center gap-2 rounded-panel px-2 sm:gap-3 sm:px-3">
                {!focusMode && <IconButton className="lg:hidden" label="Open navigation" icon={Menu} onClick={() => setMobileNav(true)} />}
                <Link to="/" className="shrink-0 lg:hidden" aria-label="TEAL Intelligence — Mission Control">
                  <TealMark className="size-8" />
                </Link>
                <div className="hidden min-w-0 flex-1 md:block">
                  <Breadcrumbs />
                </div>
                {!focusMode && <GlobalSearch ref={searchRef} className="hidden w-[clamp(14rem,28vw,32rem)] shrink md:block" />}
                <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
                  <IconButton className="md:hidden" label="Search" icon={Search} onClick={() => setPalette(true)} />
                  {!focusMode && (
                    <>
                      <SystemStatus />
                      <DraftsIndicator />
                      <AttentionCenter />
                    </>
                  )}
                  <Popover
                    label="Appearance"
                    width="w-[22rem]"
                    trigger={({ toggle, open, id }) => <IconButton label="Appearance: theme, density, effects" icon={dark ? MoonStar : SunMedium} onClick={toggle} aria-expanded={open} aria-controls={id} className="hidden sm:inline-grid" />}
                  >
                    {() => <AppearanceSettings />}
                  </Popover>
                  <IconButton className="hidden sm:inline-grid" label="Help for this page" icon={LifeBuoy} onClick={() => setHelp(true)} />
                  <IconButton label={focusMode ? 'Exit focus mode (F)' : 'Focus mode (F)'} icon={focusMode ? Minimize2 : Maximize2} onClick={toggleFocusMode} active={focusMode} className="hidden sm:inline-grid" />
                  {!focusMode && (
                    <span className="ml-1 hidden sm:block">
                      <QuickCreateMenu onPick={openQuickCreate} />
                    </span>
                  )}
                </div>
              </div>
            </header>

            <main id="main" tabIndex={-1} className={clsx('mx-auto w-full min-w-0 flex-1 px-3 pt-6 pb-28 outline-none sm:px-6 lg:pb-10', focusMode ? 'max-w-5xl' : 'max-w-[1680px]')}>
              {status === 'loading' && <Loading label="Loading engineering data…" />}
              {status === 'error' && error && <ErrorState what={error.what} why={error.why} todo={error.todo} onRetry={reload} />}
              {status === 'ready' && (
                <div key={pathname} className="animate-route-in">
                  <Suspense fallback={<Loading />}>
                    <Outlet />
                  </Suspense>
                </div>
              )}
            </main>
            <footer className="mx-auto hidden w-full max-w-[1680px] items-center gap-4 px-6 pb-6 text-micro text-ink-3 lg:flex no-print">
              <span>TEAL Intelligence V1 · static GitHub Pages build</span>
              <span>Your drafts stay in this browser</span>
              <button type="button" className="hover:text-ink" onClick={() => setShortcuts(true)}>
                <Keyboard className="mr-1 inline size-3.5" aria-hidden />
                Shortcuts
              </button>
              <Link to="/help" className="hover:text-ink">
                Help
              </Link>
              <a href="https://github.com/songarajatin225-a11y/TEAL-Intelligence-" target="_blank" rel="noreferrer" className="ml-auto hover:text-ink">
                GitHub
              </a>
            </footer>
          </div>
        </div>

        {!focusMode && <MobileBar onMenu={() => setMobileNav(true)} onSearch={() => setPalette(true)} onCreate={() => setCreate('__menu')} />}

        <CommandPalette open={palette} onClose={() => setPalette(false)} />
        <CreateChooser open={create === '__menu'} onClose={() => setCreate(null)} onPick={(e) => (setCreate(null), openQuickCreate(e))} />
        <QuickCreateDrawer entity={create && create !== '__menu' ? create : null} onClose={() => setCreate(null)} />
        <HelpDrawer open={help} onClose={() => setHelp(false)} onShortcuts={() => (setHelp(false), setShortcuts(true))} />
        <ShortcutsModal open={shortcuts} onClose={() => setShortcuts(false)} />
        <Onboarding open={onboarding && status === 'ready'} onClose={() => setOnboarding(false)} onSearch={focusSearch} onCreate={() => setCreate('__menu')} />
        <ToastHost />
      </ShellContext.Provider>
    </WhyProvider>
  );
}

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onClose);
  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="absolute inset-0 animate-fade-in bg-navy/30 dark:bg-black/50" onClick={onClose} aria-hidden />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Navigation" className="relative h-full w-fit animate-fade-in outline-none">
        <div className="absolute top-3 right-[-3rem]">
          <IconButton label="Close navigation" icon={X} onClick={onClose} className="bg-solid/80" />
        </div>
        <div className="h-full py-2">
          <Sidebar mobile onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}

/** Mobile bottom bar (spec §44–§45): home · work · search · create · menu. */
function MobileBar({ onMenu, onSearch, onCreate }: { onMenu: () => void; onSearch: () => void; onCreate: () => void }) {
  const { pathname } = useLocation();
  const item = 'flex flex-1 flex-col items-center gap-0.5 py-2 text-micro font-medium';
  return (
    <nav aria-label="Quick navigation" className="glass fixed inset-x-3 bottom-3 z-40 flex rounded-panel px-1 lg:hidden no-print">
      <Link to="/" className={clsx(item, pathname === '/' ? 'text-accent-2' : 'text-ink-3')}>
        <Home className="size-5" aria-hidden /> Home
      </Link>
      <Link to="/pm" className={clsx(item, pathname === '/pm' ? 'text-accent-2' : 'text-ink-3')}>
        <Briefcase className="size-5" aria-hidden /> Work
      </Link>
      <button type="button" onClick={onCreate} className={clsx(item, 'text-ink-3')} aria-label="Create">
        <span className="-mt-5 grid size-11 place-items-center rounded-full bg-accent text-white shadow-lg">
          <Plus className="size-5" aria-hidden />
        </span>
        New
      </button>
      <button type="button" onClick={onSearch} className={clsx(item, 'text-ink-3')}>
        <Search className="size-5" aria-hidden /> Search
      </button>
      <button type="button" onClick={onMenu} className={clsx(item, 'text-ink-3')}>
        <Menu className="size-5" aria-hidden /> Menu
      </button>
    </nav>
  );
}

/** Keyboard (N) / mobile chooser for Quick Create. */
function CreateChooser({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (entity: string) => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Create" size="md">
      <p className="mb-3 text-meta text-ink-3">Saved in this browser as a local draft.</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CREATE_OPTIONS.map((o, i) => (
          <li key={o.entity}>
            <button type="button" data-autofocus={i === 0 ? true : undefined} onClick={() => onPick(o.entity)} className="surface interactive flex w-full flex-col items-start gap-2 rounded-card p-3 text-left">
              <o.icon className="size-5 text-accent-2" aria-hidden />
              <span className="text-meta font-medium">{o.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
