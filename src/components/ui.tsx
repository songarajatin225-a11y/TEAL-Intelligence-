import clsx from 'clsx';
import { AlertTriangle, Inbox, Loader2, X } from 'lucide-react';
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

/* Small set of shadcn-style primitives (Tailwind only, no Radix dependency). */

export function Button({ variant = 'default', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'primary' | 'ghost' | 'danger'; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      {...p}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
        variant === 'primary' && 'border-accent bg-accent text-white hover:bg-accent-2',
        variant === 'default' && 'border-line bg-panel text-ink hover:bg-panel-2',
        variant === 'ghost' && 'border-transparent bg-transparent text-ink-2 hover:bg-panel-2',
        variant === 'danger' && 'border-bad/40 bg-panel text-bad hover:bg-bad/10',
        className,
      )}
    />
  );
}

export function Card({ title, actions, children, className, id }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={clsx('rounded-lg border border-line bg-panel', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-ink-2">{title}</h2>
          <div className="flex items-center gap-1.5">{actions}</div>
        </header>
      )}
      <div className="p-3">{children}</div>
    </section>
  );
}

export function PageHeader({ title, subtitle, actions, eyebrow, level = 1 }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; level?: 1 | 2 }) {
  const H = level === 1 ? 'h1' : 'h2';
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div className="min-w-0">
        {eyebrow && <div className="text-[11px] font-semibold uppercase tracking-wider text-accent">{eyebrow}</div>}
        <H className={clsx('truncate font-semibold', level === 1 ? 'text-xl' : 'text-base')}>{title}</H>
        {subtitle && <p className="mt-0.5 max-w-3xl text-ink-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-1.5 no-print">{actions}</div>}
    </div>
  );
}

const TONES = {
  neutral: 'bg-panel-2 text-ink-2 border-line',
  accent: 'bg-accent-soft text-accent-2 border-accent/30',
  ok: 'bg-ok/10 text-ok border-ok/30',
  warn: 'bg-warn/10 text-warn border-warn/30',
  bad: 'bg-bad/10 text-bad border-bad/30',
  info: 'bg-info/10 text-info border-info/30',
  demo: 'bg-demo/10 text-demo border-demo/30',
  draft: 'bg-draft/10 text-draft border-draft/40',
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ tone = 'neutral', children, title, className }: { tone?: Tone; children: ReactNode; title?: string; className?: string }) {
  return (
    <span title={title} className={clsx('inline-flex items-center whitespace-nowrap rounded border px-1.5 py-px text-[10.5px] font-semibold uppercase tracking-wide', TONES[tone], className)}>
      {children}
    </span>
  );
}

export function Stat({ label, value, sub, tone, to }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; to?: string }) {
  const body = (
    <div className={clsx('rounded-lg border border-line bg-panel px-3 py-2', to && 'hover:border-accent')}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-3">{label}</div>
      <div className={clsx('num text-xl font-semibold', tone === 'bad' && 'text-bad', tone === 'warn' && 'text-warn', tone === 'ok' && 'text-ok')}>{value}</div>
      {sub && <div className="text-[11.5px] text-ink-3">{sub}</div>}
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 p-6 text-ink-3">
      <Loader2 className="size-4 animate-spin" aria-hidden /> {label}
    </div>
  );
}

/** Errors explain what happened, why, and what the user can do (spec §121). Never a stack trace. */
export function ErrorState({ what, why, todo, onRetry }: { what: string; why?: string; todo?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-bad/30 bg-bad/5 p-4">
      <div className="flex items-center gap-2 font-semibold text-bad">
        <AlertTriangle className="size-4" aria-hidden /> {what}
      </div>
      {why && <p className="mt-1 text-ink-2">Why: {why}</p>}
      {todo && <p className="mt-1 text-ink-2">What you can do: {todo}</p>}
      {onRetry && (
        <Button className="mt-2" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

/** Empty states explain what is missing and offer create / import / search / learn more (spec §122). */
export function EmptyState({ title, explain, actions }: { title: string; explain: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line bg-panel-2 px-6 py-8 text-center">
      <Inbox className="mb-2 size-6 text-ink-3" aria-hidden />
      <div className="font-semibold">{title}</div>
      <div className="mt-1 max-w-xl text-ink-2">{explain}</div>
      {actions && <div className="mt-3 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={htmlFor} className="text-[11.5px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && !error && <span className="text-[11px] text-ink-3">{hint}</span>}
      {error && (
        <span role="alert" className="text-[11px] text-bad">
          {error}
        </span>
      )}
    </div>
  );
}

const inputCls = 'w-full rounded-md border border-line bg-panel px-2 py-1.5 text-[13px] text-ink placeholder:text-ink-3 focus:border-accent';
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={clsx(inputCls, className)} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={clsx(inputCls, 'min-h-[70px]', className)} />;
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={clsx(inputCls, 'pr-6', className)}>
    {children}
  </select>
);

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { key: T; label: ReactNode; count?: number }[]; value: T; onChange: (k: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="mb-3 flex flex-wrap gap-1 border-b border-line no-print">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          type="button"
          aria-selected={value === t.key}
          onClick={() => onChange(t.key)}
          className={clsx('-mb-px border-b-2 px-2.5 py-1.5 text-[13px] font-medium', value === t.key ? 'border-accent text-accent-2' : 'border-transparent text-ink-3 hover:text-ink')}
        >
          {t.label}
          {t.count != null && <span className="ml-1 text-[11px] text-ink-3">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Side drawer (Why?, previews). Traps initial focus; Esc closes. */
export function Drawer({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end no-print">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className={clsx('relative flex h-full w-full flex-col border-l border-line bg-panel shadow-xl', wide ? 'max-w-3xl' : 'max-w-xl')}>
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <h2 id={id} className="font-semibold">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function KV({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-1">
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-ink-3">{k}</dt>
          <dd className="min-w-0 break-words">{v ?? <Unknown />}</dd>
        </div>
      ))}
    </dl>
  );
}

export const Unknown = ({ label = 'UNKNOWN' }: { label?: string }) => <span className="font-mono text-[11px] font-semibold text-ink-3">{label}</span>;

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'draft'; children: ReactNode }) {
  return (
    <div
      role="note"
      className={clsx(
        'rounded-md border px-3 py-2 text-[12.5px]',
        tone === 'info' && 'border-info/30 bg-info/5 text-ink-2',
        tone === 'warn' && 'border-warn/40 bg-warn/5 text-ink-2',
        tone === 'draft' && 'border-draft/40 bg-draft/5 text-ink-2',
      )}
    >
      {children}
    </div>
  );
}

export function Table({ head, children, dense }: { head: ReactNode[]; children: ReactNode; dense?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('w-full border-collapse text-left', dense ? 'text-[12px]' : 'text-[12.5px]')}>
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-3">
            {head.map((h, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-2 py-1.5 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:border-b [&_td]:border-line/70 [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top">{children}</tbody>
      </table>
    </div>
  );
}
