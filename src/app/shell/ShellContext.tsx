import { createContext, useContext } from 'react';

/** Shell-level actions available to any page (palette, quick create, help, focus mode). */
export interface ShellApi {
  openPalette: () => void;
  openQuickCreate: (entity?: string) => void;
  openHelp: () => void;
  openShortcuts: () => void;
  focusSearch: () => void;
  focusMode: boolean;
  toggleFocusMode: () => void;
  openOnboarding: () => void;
}
const noop = () => {};
export const ShellContext = createContext<ShellApi>({ openPalette: noop, openQuickCreate: noop, openHelp: noop, openShortcuts: noop, focusSearch: noop, focusMode: false, toggleFocusMode: noop, openOnboarding: noop });
export const useShell = () => useContext(ShellContext);
