import { useSyncExternalStore } from 'react';

/**
 * PERSONALISATION (docs/07 §2, spec §73). Per-browser presentation preferences in localStorage:
 * theme, density, visual effects, sidebar, workspace, open nav sections, favourites, onboarding.
 * Never engineering data — that lives in the IndexedDB workspace and GitHub.
 */
export type Theme = 'system' | 'light' | 'dark';
export type Density = 'comfortable' | 'compact' | 'focus';
export type Effects = 'full' | 'reduced';
export type WorkspaceId = 'engineering' | 'product' | 'laser' | 'semiconductor' | 'supply' | 'intelligence' | 'executive';

export interface Favorite {
  id: string;
  name: string;
  entity: string;
}

export type ListView = 'table' | 'cards' | 'board';
export interface SavedView {
  id: string;
  name: string;
  entity: string;
  q: string;
  view: ListView;
}

export interface Prefs {
  theme: Theme;
  density: Density;
  effects: Effects;
  sidebarCollapsed: boolean;
  workspace: WorkspaceId;
  openSections: Record<string, boolean>;
  favorites: Favorite[];
  onboarded: boolean;
  tableDensity: Record<string, 'comfortable' | 'compact'>;
  hiddenColumns: Record<string, string[]>;
  listView: Record<string, ListView>;
  savedViews: SavedView[];
  /** §122/§159 — customer demo mode hides internal cost, suppliers, risks and notes */
  viewMode: 'engineering' | 'customer';
}

const KEY = 'teal-os:prefs:v1';
export const DEFAULT_PREFS: Prefs = {
  theme: 'system',
  density: 'comfortable',
  effects: 'full',
  sidebarCollapsed: false,
  workspace: 'engineering',
  openSections: {},
  favorites: [],
  onboarded: false,
  tableDensity: {},
  hiddenColumns: {},
  listView: {},
  savedViews: [],
  viewMode: 'engineering',
};

function read(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

let state: Prefs = typeof window === 'undefined' ? DEFAULT_PREFS : read();
const listeners = new Set<() => void>();

export function getPrefs(): Prefs {
  return state;
}

export function setPrefs(patch: Partial<Prefs> | ((p: Prefs) => Partial<Prefs>)): void {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode — preferences last for this page only */
  }
  applyPrefs();
  listeners.forEach((l) => l());
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

const darkQuery = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null);

export function resolvedTheme(p: Prefs = state): 'light' | 'dark' {
  return p.theme === 'system' ? (darkQuery()?.matches ? 'dark' : 'light') : p.theme;
}

/** Reflect preferences on <html> (theme, density, effects). Safe to call repeatedly. */
export function applyPrefs(): void {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  const t = resolvedTheme();
  el.dataset.themeResolved = t;
  el.dataset.density = state.density;
  el.dataset.effects = state.effects;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#071317' : '#eef3f4');
}

if (typeof window !== 'undefined') {
  applyPrefs();
  darkQuery()?.addEventListener?.('change', () => {
    if (state.theme === 'system') {
      applyPrefs();
      listeners.forEach((l) => l());
    }
  });
}

export function toggleFavorite(f: Favorite): void {
  setPrefs((p) => ({ favorites: p.favorites.some((x) => x.id === f.id) ? p.favorites.filter((x) => x.id !== f.id) : [f, ...p.favorites].slice(0, 30) }));
}
export const isFavorite = (p: Prefs, id: string) => p.favorites.some((x) => x.id === id);

export function cycleTheme(): Theme {
  const order: Theme[] = ['system', 'light', 'dark'];
  const next = order[(order.indexOf(state.theme) + 1) % order.length];
  setPrefs({ theme: next });
  return next;
}
