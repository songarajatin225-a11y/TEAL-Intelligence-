import clsx from 'clsx';
import { AlertTriangle, CheckCircle2, Info, PencilLine, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { workspaceBus, type WorkspaceEvent } from '../repositories/workspaceDb';

/**
 * TOASTS (spec §56). `toast()` can be called from anywhere (no React context needed).
 * Every local-workspace write is confirmed automatically via the workspace bus.
 */
export type ToastTone = 'success' | 'info' | 'draft' | 'error';
interface ToastItem {
  id: number;
  title: string;
  detail?: string;
  tone: ToastTone;
}
const EVENT = 'teal:toast';
let seq = 0;

export function toast(title: string, opts: { detail?: string; tone?: ToastTone } = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastItem>(EVENT, { detail: { id: ++seq, title, detail: opts.detail, tone: opts.tone ?? 'success' } }));
}

const WS_TITLE: Record<WorkspaceEvent['action'], string> = {
  create: 'Saved as local draft',
  update: 'Local draft updated',
  delete: 'Removed locally',
  restore: 'Local draft discarded',
  import: 'Imported into workspace',
  batch: 'Saved as local drafts',
};

const ICON = { success: CheckCircle2, info: Info, draft: PencilLine, error: AlertTriangle };

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    const add = (t: ToastItem) => {
      setItems((xs) => [...xs.slice(-3), t]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), t.tone === 'error' ? 8000 : 4200);
    };
    const onToast = (e: Event) => add((e as CustomEvent<ToastItem>).detail);
    window.addEventListener(EVENT, onToast);
    const unsub = workspaceBus.subscribe((e) => {
      if (e) add({ id: ++seq, title: WS_TITLE[e.action], detail: e.summary, tone: e.action === 'delete' ? 'info' : 'draft' });
    });
    return () => {
      window.removeEventListener(EVENT, onToast);
      unsub();
    };
  }, []);
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-3 bottom-20 z-[90] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end no-print">
      {items.map((t) => {
        const Icon = ICON[t.tone];
        return (
          <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className="glass-strong pointer-events-auto flex w-full max-w-sm animate-pop-in items-start gap-3 rounded-card px-4 py-3">
            <Icon className={clsx('mt-0.5 size-[18px] shrink-0', t.tone === 'success' && 'text-ok', t.tone === 'info' && 'text-info', t.tone === 'draft' && 'text-draft', t.tone === 'error' && 'text-bad')} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{t.title}</div>
              {t.detail && <div className="truncate text-meta text-ink-2">{t.detail}</div>}
              {t.tone === 'draft' && <div className="text-micro text-ink-3">Stored in this browser · export a change package to commit</div>}
            </div>
            <button type="button" aria-label="Dismiss" className="rounded-md p-0.5 text-ink-3 hover:text-ink" onClick={() => setItems((xs) => xs.filter((x) => x.id !== t.id))}>
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
