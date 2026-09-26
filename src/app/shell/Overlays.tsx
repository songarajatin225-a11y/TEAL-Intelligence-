import { Compass, Plus, Search, Sparkles } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TealLogo } from '../../components/TealLogo';
import { Button, Drawer, Kbd, Modal, SegmentedControl } from '../../components/ui';
import { GLOSSARY, helpFor } from '../help';
import { pageFor } from '../nav';
import { setPrefs, usePrefs, type Density, type Effects, type Theme } from '../prefs';
import { SHORTCUTS } from './shortcuts';

export function ShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="md">
      <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {SHORTCUTS.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="text-meta text-ink-2">{s.label}</span>
            <span className="flex shrink-0 gap-1">
              {s.keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

/** Contextual help for the current page (spec §98). */
export function HelpDrawer({ open, onClose, onShortcuts }: { open: boolean; onClose: () => void; onShortcuts: () => void }) {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const page = pageFor(pathname);
  const h = helpFor(pathname.startsWith('/record/') ? '/' : pathname);
  const title = pathname.startsWith('/record/') ? 'Records' : (page?.label ?? 'Help');
  return (
    <Drawer open={open} onClose={onClose} title={`Help — ${title}`} subtitle={page?.desc}>
      <div className="space-y-5">
        {pathname.startsWith('/record/') ? (
          <p className="text-ink-2">A record page shows one object and its digital thread. Tabs: <b>Overview</b> (the essentials), <b>Related</b> (connected records), <b>Intelligence</b> (what is missing, similar work, reuse), <b>Evidence</b> (sources and WHY?), <b>History</b> (local changes) and <b>System</b> (every stored field).</p>
        ) : h ? (
          <>
            <p className="text-lead text-ink-2">{h.what}</p>
            {h.terms && (
              <section>
                <h3 className="mb-1.5 font-semibold">Key terms</h3>
                <dl className="space-y-1.5">
                  {h.terms.map(([t, d]) => (
                    <div key={t}>
                      <dt className="font-medium">{t}</dt>
                      <dd className="text-meta text-ink-2">{d}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            {h.workflow && (
              <section>
                <h3 className="mb-1.5 font-semibold">Typical workflow</h3>
                <ol className="list-decimal space-y-1 pl-5 text-ink-2">
                  {h.workflow.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ol>
              </section>
            )}
            {h.next && <p className="rounded-control bg-accent-soft px-3 py-2 text-meta text-accent-2">Next: {h.next}</p>}
          </>
        ) : (
          <p className="text-ink-2">{page?.desc ?? 'This page is part of TEAL Intelligence.'} Use the WHY? buttons to see where any value comes from.</p>
        )}
        <section>
          <h3 className="mb-1.5 font-semibold">Everywhere</h3>
          <ul className="space-y-1 text-meta text-ink-2">
            <li>
              <Kbd>⌘</Kbd> <Kbd>K</Kbd> command palette · <Kbd>/</Kbd> search · <Kbd>N</Kbd> create · <Kbd>F</Kbd> focus mode
            </li>
            <li>Badges tell you how far to trust a value: Verified, Source linked, Estimate, Demo, Unknown.</li>
          </ul>
        </section>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onShortcuts}>All shortcuts</Button>
          <Button
            variant="tertiary"
            onClick={() => {
              onClose();
              nav('/help');
            }}
          >
            Open the Help Center
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

/** First-visit welcome (spec §99). Dismissible; reopen from Help. */
export function Onboarding({ open, onClose, onSearch, onCreate }: { open: boolean; onClose: () => void; onSearch: () => void; onCreate: () => void }) {
  const nav = useNavigate();
  const done = () => {
    setPrefs({ onboarded: true });
    onClose();
  };
  const concepts = [
    ['Everything is connected.', 'Customers, requirements, products, BOMs, costs, projects and lessons link into one engineering thread.'],
    ['Start from what you need to do.', 'Mission Control shows what needs attention. Search or press ⌘K to go anywhere.'],
    ['Depth is there when you need it.', 'Advanced engineering detail, evidence and formulas are one click away — never in your way.'],
  ];
  return (
    <Modal
      open={open}
      onClose={done}
      title="Welcome to TEAL Intelligence"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={done}>
            Skip
          </Button>
          <Button
            onClick={() => {
              done();
              onSearch();
            }}
          >
            <Search className="size-4" aria-hidden /> Find something
          </Button>
          <Button
            onClick={() => {
              done();
              onCreate();
            }}
          >
            <Plus className="size-4" aria-hidden /> Create something
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              done();
              nav('/graph');
            }}
          >
            <Compass className="size-4" aria-hidden /> Explore intelligence
          </Button>
        </>
      }
    >
      <TealLogo className="mb-4 h-20 w-auto" fallbackClassName="mb-3 block text-section" />
      <p className="mb-4 text-lead text-ink-2">One engineering operating system for laser, automation and semiconductor equipment — from customer inquiry to production release.</p>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {concepts.map(([t, d], i) => (
          <li key={t} className="surface rounded-card p-4">
            <span className="mb-2 grid size-8 place-items-center rounded-full bg-accent text-meta font-bold text-white">{i + 1}</span>
            <div className="font-semibold">{t}</div>
            <p className="mt-1 text-meta text-ink-2">{d}</p>
          </li>
        ))}
      </ol>
      <p className="mt-4 flex items-center gap-2 text-micro text-ink-3">
        <Sparkles className="size-3.5" aria-hidden /> Your work is saved in this browser. Nothing is sent to a server.
      </p>
    </Modal>
  );
}

/** Appearance settings: theme, density, visual effects (spec §47–§50). */
export function AppearanceSettings() {
  const p = usePrefs();
  return (
    <div className="space-y-3 p-2.5">
      <div>
        <div className="mb-1.5 text-micro font-medium text-ink-3">Theme</div>
        <SegmentedControl<Theme> label="Theme" value={p.theme} onChange={(theme) => setPrefs({ theme })} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
      </div>
      <div>
        <div className="mb-1.5 text-micro font-medium text-ink-3">Density</div>
        <SegmentedControl<Density> label="Density" value={p.density} onChange={(density) => setPrefs({ density })} options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }, { value: 'focus', label: 'Reading' }]} />
      </div>
      <div>
        <div className="mb-1.5 text-micro font-medium text-ink-3">Visual effects</div>
        <SegmentedControl<Effects> label="Visual effects" value={p.effects} onChange={(effects) => setPrefs({ effects })} options={[{ value: 'full', label: 'Glass' }, { value: 'reduced', label: 'Low power (opaque, no motion)' }]} />
      </div>
      <p className="text-micro text-ink-3">Saved in this browser.</p>
    </div>
  );
}

export { GLOSSARY };
