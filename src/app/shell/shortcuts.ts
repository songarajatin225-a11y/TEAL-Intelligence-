import { useEffect, useRef } from 'react';

/**
 * KEYBOARD SHORTCUTS (spec §75). Ignored while typing in a field.
 *   ⌘/Ctrl K palette · / search · g then h/w/p/l/k/c/s/e go · n new · f focus · ? shortcuts
 */
export const GO_KEYS: Record<string, { to: string; label: string }> = {
  h: { to: '/', label: 'Mission Control' },
  w: { to: '/pm', label: 'My Workspace' },
  o: { to: '/opportunities', label: 'Opportunities' },
  p: { to: '/projects', label: 'Projects' },
  r: { to: '/products', label: 'Products' },
  l: { to: '/laser', label: 'Laser Platform' },
  k: { to: '/knowledge', label: 'Knowledge' },
  c: { to: '/cost', label: 'Cost' },
  s: { to: '/suppliers', label: 'Suppliers' },
  e: { to: '/semiconductor', label: 'Semiconductor' },
};

export const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['⌘', 'K'], label: 'Command palette (Ctrl K on Windows / Linux)' },
  { keys: ['/'], label: 'Focus global search' },
  { keys: ['N'], label: 'Quick create' },
  { keys: ['I'], label: 'Open the TEAL Copilot' },
  { keys: ['F'], label: 'Toggle focus mode' },
  { keys: ['?'], label: 'Show keyboard shortcuts' },
  { keys: ['Esc'], label: 'Close drawer, dialog or menu' },
  ...Object.entries(GO_KEYS).map(([k, v]) => ({ keys: ['G', k.toUpperCase()], label: `Go to ${v.label}` })),
];

const typing = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
};

export function useShortcuts(h: { palette: () => void; search: () => void; create: () => void; focus: () => void; help: () => void; go: (to: string) => void; copilot?: () => void }) {
  const ref = useRef(h);
  ref.current = h;
  useEffect(() => {
    let pendingG = 0;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        ref.current.palette();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || document.querySelector('[aria-modal="true"]')) return;
      const k = e.key;
      if (pendingG && Date.now() - pendingG < 1200) {
        pendingG = 0;
        const g = GO_KEYS[k.toLowerCase()];
        if (g) {
          e.preventDefault();
          ref.current.go(g.to);
        }
        return;
      }
      if (k === 'g' || k === 'G') pendingG = Date.now();
      else if (k === '/') {
        e.preventDefault();
        ref.current.search();
      } else if (k === 'n' || k === 'N') {
        e.preventDefault();
        ref.current.create();
      } else if ((k === 'i' || k === 'I') && ref.current.copilot) {
        e.preventDefault();
        ref.current.copilot();
      } else if (k === 'f' || k === 'F') ref.current.focus();
      else if (k === '?') ref.current.help();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
