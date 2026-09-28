import clsx from 'clsx';
import { AlertTriangle, ChevronRight, Inbox, X, type LucideIcon } from 'lucide-react';
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type RefObject,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

/*
 * TEAL design-system primitives (Engineering Liquid Glass — docs/07_UX_REDESIGN.md §3).
 * Every page composes these; visual values come from tokens in src/index.css.
 */

/* ------------------------------------------------------------------ buttons */

export type ButtonVariant = 'primary' | 'secondary' | 'default' | 'tertiary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', className?: string): string {
  return clsx(
    'interactive-press inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-control font-medium transition-[background-color,border-color,color,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-50',
    size === 'sm' && 'h-8 px-2.5 text-meta',
    size === 'md' && 'h-9 px-3.5 text-body',
    size === 'lg' && 'h-11 px-5 text-lead',
    variant === 'primary' && 'bg-accent text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_16px_-8px_var(--c-accent)] hover:bg-accent-2 dark:text-[#032126]',
    (variant === 'secondary' || variant === 'default') && 'border border-line-strong bg-solid/70 text-ink hover:border-accent/50 hover:bg-solid',
    variant === 'tertiary' && 'text-accent-2 hover:bg-accent-soft',
    variant === 'ghost' && 'text-ink-2 hover:bg-ink/5 hover:text-ink',
    variant === 'danger' && 'border border-bad/35 text-bad hover:bg-bad/10',
    className,
  );
}

export function Button({ variant = 'secondary', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type="button" {...p} className={buttonClass(variant, size, className)} />;
}

/** Square icon button; `label` is required (accessible name + tooltip). */
export function IconButton({ label, icon: Icon, className, size = 'md', active, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: LucideIcon; size?: 'sm' | 'md'; active?: boolean }) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        {...p}
        className={clsx(
          'inline-grid shrink-0 place-items-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-ink/5 hover:text-ink disabled:opacity-40',
          size === 'sm' ? 'size-8' : 'size-9',
          active && 'bg-accent-soft text-accent-2',
          className,
        )}
      >
        <Icon className={size === 'sm' ? 'size-4' : 'size-[18px]'} aria-hidden />
      </button>
    </Tooltip>
  );
}

export const Kbd = ({ children }: { children: ReactNode }) => <kbd className="inline-flex min-w-5 items-center justify-center rounded-md border border-line-strong bg-solid/60 px-1 font-mono text-micro text-ink-3">{children}</kbd>;

/* ------------------------------------------------------------------ surfaces */

/** Content card — translucent glass surface (no blur). */
export function Card({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
  bodyClassName,
  id,
  padded = true,
  edge,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  padded?: boolean;
  edge?: boolean;
}) {
  return (
    <section id={id} className={clsx('surface min-w-0 rounded-card', edge && 'glass-edge', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-2 px-4 pt-3.5 pb-1">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && (
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-2">
                <Icon className="size-4" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-lead font-semibold tracking-[-0.01em] text-ink">{title}</h2>
              {description && <p className="text-meta text-ink-3">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-1.5 no-print">{actions}</div>}
        </header>
      )}
      <div className={clsx(padded && 'px-4 pt-2 pb-4', !title && !actions && padded && 'pt-4', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Section heading inside a page (between cards). */
export function SectionHeader({ title, description, actions, icon: Icon }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="mb-2.5 mt-1 flex flex-wrap items-end justify-between gap-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-[18px] text-accent-2" aria-hidden />}
        <div>
          <h2 className="text-section font-semibold tracking-[-0.015em]">{title}</h2>
          {description && <p className="text-meta text-ink-3">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-1.5">{actions}</div>}
    </div>
  );
}

/** Page header: title, one-line explanation, primary actions. Breadcrumbs live in the top bar. */
export function PageHeader({ title, subtitle, actions, eyebrow, level = 1 }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; level?: 1 | 2 }) {
  const H = level === 1 ? 'h1' : 'h2';
  return (
    <div className={clsx('flex flex-wrap items-end justify-between gap-x-4 gap-y-3', level === 1 ? 'mb-5' : 'mb-3')}>
      <div className="min-w-0 max-w-4xl">
        {eyebrow && level === 2 && <div className="mb-1 text-micro font-semibold uppercase tracking-[0.08em] text-accent-2">{eyebrow}</div>}
        <H className={clsx('font-semibold tracking-[-0.02em] text-ink', level === 1 ? 'text-title' : 'text-section')}>{title}</H>
        {subtitle && <p className={clsx('mt-1 text-ink-2', level === 1 ? 'text-lead' : 'text-body')}>{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 no-print">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ status */

const TONES = {
  neutral: 'bg-ink/[0.06] text-ink-2 ring-line-strong',
  accent: 'bg-accent-soft text-accent-2 ring-accent/25',
  ok: 'bg-ok/10 text-ok ring-ok/25',
  warn: 'bg-warn/10 text-warn ring-warn/30',
  bad: 'bg-bad/10 text-bad ring-bad/25',
  info: 'bg-info/10 text-info ring-info/25',
  demo: 'bg-demo/10 text-demo ring-demo/25',
  draft: 'bg-draft/10 text-draft ring-draft/30',
} as const;
export type Tone = keyof typeof TONES;
export const TONE_DOT: Record<Tone, string> = { neutral: 'text-ink-3', accent: 'text-accent', ok: 'text-ok', warn: 'text-warn', bad: 'text-bad', info: 'text-info', demo: 'text-demo', draft: 'text-draft' };

export function Badge({ tone = 'neutral', children, title, className, dot }: { tone?: Tone; children: ReactNode; title?: string; className?: string; dot?: boolean }) {
  return (
    <span title={title} className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-micro font-medium ring-1 ring-inset', TONES[tone], className)}>
      {dot && <span className="signal size-1.5" aria-hidden />}
      {children}
    </span>
  );
}

/** Metric card — KPI with optional link, tone and sub-line. */
export function Stat({ label, value, sub, tone, to, icon: Icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; to?: string; icon?: LucideIcon }) {
  const body = (
    <div className={clsx('surface h-full rounded-card px-4 py-3', to && 'interactive')}>
      <div className="flex items-center justify-between gap-2 text-meta font-medium text-ink-3">
        <span>{label}</span>
        {Icon && <Icon className="size-4 text-ink-3" aria-hidden />}
      </div>
      <div className={clsx('num mt-1 text-metric font-semibold tracking-[-0.02em]', tone === 'bad' && 'text-bad', tone === 'warn' && 'text-warn', tone === 'ok' && 'text-ok', (!tone || tone === 'neutral') && 'text-ink')}>{value}</div>
      {sub && <div className="mt-0.5 text-micro text-ink-3">{sub}</div>}
    </div>
  );
  return to ? (
    <Link to={to} className="block rounded-card">
      {body}
    </Link>
  ) : (
    body
  );
}

/* ------------------------------------------------------------------ loading / error / empty */

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} aria-hidden />;
}

/** Page-level loading: a skeleton of header, metrics and cards (not a spinner). */
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-4 w-96 max-w-full" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-card" />
        <Skeleton className="h-56 rounded-card" />
      </div>
    </div>
  );
}

/** Errors explain what happened, what may be affected, and what the user can do. */
export function ErrorState({ what, why, todo, onRetry, secondary }: { what: string; why?: string; todo?: string; onRetry?: () => void; secondary?: ReactNode }) {
  return (
    <div role="alert" className="surface mx-auto max-w-2xl rounded-card border-bad/25 p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-bad/10 text-bad">
          <AlertTriangle className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="text-section font-semibold">{what}</div>
          {why && <p className="mt-1 text-ink-2">{why}</p>}
          {todo && <p className="mt-1 text-ink-2">{todo}</p>}
          {(onRetry || secondary) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {onRetry && (
                <Button variant="primary" onClick={onRetry}>
                  Retry
                </Button>
              )}
              {secondary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Empty states say what this is, why it is empty and what to do next. */
export function EmptyState({ title, explain, actions, icon: Icon = Inbox, compact }: { title: string; explain: ReactNode; actions?: ReactNode; icon?: LucideIcon; compact?: boolean }) {
  return (
    <div className={clsx('flex flex-col items-center rounded-card border border-dashed border-line-strong text-center', compact ? 'px-4 py-6' : 'px-6 py-12')}>
      <span className="mb-3 grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent-2">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="text-lead font-semibold">{title}</div>
      <div className="mt-1 max-w-xl text-ink-2">{explain}</div>
      {actions && <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ forms */

export function Field({ label, hint, error, children, htmlFor }: { label: string; hint?: string; error?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-meta font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint && !error && <span className="text-micro text-ink-3">{hint}</span>}
      {error && (
        <span role="alert" className="text-micro font-medium text-bad">
          {error}
        </span>
      )}
    </div>
  );
}

export const inputClass =
  'w-full rounded-control border border-line-strong bg-solid/75 px-3 py-2 text-body text-ink shadow-[inset_0_1px_2px_rgb(14_32_40/0.04)] transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3 hover:border-ink-3/50 focus:border-accent focus:outline-none focus:ring-3 focus:ring-accent/15 disabled:opacity-60 aria-invalid:border-bad';
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={clsx(inputClass, className)} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={clsx(inputClass, 'min-h-[88px] leading-relaxed', className)} />;
export const Select = ({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={clsx(inputClass, 'cursor-pointer pr-8', className)}>
    {children}
  </select>
);

/* ------------------------------------------------------------------ navigation within a page */

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { key: T; label: ReactNode; count?: number }[]; value: T; onChange: (k: T) => void; label: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + tabs.length) % tabs.length;
    onChange(tabs[n].key);
    refs.current[n]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="scroll-thin mb-4 flex gap-1 overflow-x-auto border-b border-line no-print">
      {tabs.map((t, i) => (
        <button
          key={t.key}
          ref={(el) => {
            refs.current[i] = el;
          }}
          role="tab"
          type="button"
          tabIndex={value === t.key ? 0 : -1}
          aria-selected={value === t.key}
          onKeyDown={(e) => onKey(e, i)}
          onClick={() => onChange(t.key)}
          className={clsx(
            'relative -mb-px shrink-0 whitespace-nowrap rounded-t-lg px-3 py-2 text-body font-medium transition-colors duration-150',
            value === t.key ? 'text-accent-2 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent' : 'text-ink-3 hover:text-ink',
          )}
        >
          {t.label}
          {t.count != null && <span className={clsx('ml-1.5 rounded-full px-1.5 text-micro', value === t.key ? 'bg-accent-soft' : 'bg-ink/5 text-ink-2')}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Segmented control for small mutually exclusive choices (density, view mode…). */
export function SegmentedControl<T extends string>({ options, value, onChange, label, size = 'md' }: { options: { value: T; label: ReactNode; icon?: LucideIcon }[]; value: T; onChange: (v: T) => void; label: string; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-control bg-ink/[0.06] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-[10px] font-medium transition-all duration-150',
            size === 'sm' ? 'px-2 py-1 text-micro' : 'px-3 py-1.5 text-meta',
            value === o.value ? 'bg-solid text-ink shadow-sm' : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.icon && <o.icon className="size-3.5" aria-hidden />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ overlays */

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Traps Tab inside `ref` while active; restores focus on close; Esc calls onEscape. */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, onEscape?: () => void) {
  useEffect(() => {
    if (!active) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el;
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== 'Tab' || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null);
      if (!items.length) return;
      const a = items[0];
      const b = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        b.focus();
      } else if (!e.shiftKey && document.activeElement === b) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      prev?.focus?.();
    };
  }, [active, ref, onEscape]);
}

/** Right-side drawer for contextual inspection and forms. Focus trapped; Esc closes. */
export function Drawer({ open, onClose, title, subtitle, children, wide, footer, actions }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; wide?: boolean; footer?: ReactNode; actions?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end no-print">
      <div className="absolute inset-0 animate-fade-in bg-navy/25 dark:bg-black/45" onClick={onClose} aria-hidden />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className={clsx('glass-strong relative m-0 flex h-full w-full animate-slide-in flex-col outline-none sm:m-2 sm:h-[calc(100%-1rem)] sm:rounded-panel', wide ? 'sm:max-w-3xl' : 'sm:max-w-[520px]')}>
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={id} className="text-section font-semibold tracking-[-0.01em]">
              {title}
            </h2>
            {subtitle && <div className="mt-0.5 text-meta text-ink-3">{subtitle}</div>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {actions}
            <IconButton label="Close" icon={X} onClick={onClose} />
          </div>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Centered modal for confirmations, onboarding and focused tasks. */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  useFocusTrap(ref, open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center p-4 no-print">
      <div className="absolute inset-0 animate-fade-in bg-navy/30 dark:bg-black/50" onClick={onClose} aria-hidden />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className={clsx('glass-strong relative w-full animate-pop-in rounded-panel outline-none', size === 'sm' && 'max-w-md', size === 'md' && 'max-w-xl', size === 'lg' && 'max-w-3xl')}>
        <div className="flex items-start justify-between gap-3 px-6 pt-5">
          <h2 id={id} className="text-section font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          <IconButton label="Close" icon={X} onClick={onClose} size="sm" />
        </div>
        <div className="px-6 pt-2 pb-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Click-toggled popover, rendered in a portal (glass ancestors would clip it). Esc / outside click closes. */
export function Popover({ trigger, children, align = 'end', label, width = 'w-80' }: { trigger: (p: { open: boolean; toggle: () => void; id: string }) => ReactNode; children: (close: () => void) => ReactNode; align?: 'start' | 'end'; label: string; width?: string }) {
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useCallback(() => setPos(null), []);
  const toggle = useCallback(() => {
    setPos((p) => {
      if (p) return null;
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return null;
      return align === 'end' ? { top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) } : { top: r.bottom + 8, left: Math.max(8, r.left) };
    });
  }, [align]);
  useEffect(() => {
    if (!pos) return;
    const onDown = (e: MouseEvent) => !anchor.current?.contains(e.target as Node) && !panel.current?.contains(e.target as Node) && setPos(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPos(null);
        anchor.current?.querySelector<HTMLElement>('button')?.focus();
      }
    };
    const onResize = () => setPos(null);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [pos]);
  return (
    <div ref={anchor} className="relative">
      {trigger({ open: !!pos, toggle, id })}
      {pos &&
        createPortal(
          <div ref={panel} id={id} role="dialog" aria-label={label} style={{ top: pos.top, left: pos.left, right: pos.right }} className={clsx('glass-strong scroll-thin fixed z-[75] max-h-[calc(100vh-5rem)] max-w-[calc(100vw-1rem)] animate-pop-in overflow-y-auto rounded-card p-1.5', width)}>
            {children(close)}
          </div>,
          document.body,
        )}
    </div>
  );
}

/** Tooltip on hover/focus (portal, fixed-positioned so no container clips it). Wrap one focusable element. */
export function Tooltip({ label, children, side = 'bottom' }: { label: ReactNode; children: ReactElement; side?: 'bottom' | 'right' | 'top' }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useId();
  if (!isValidElement(children)) return children;
  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos(side === 'right' ? { x: r.right + 8, y: r.top + r.height / 2 } : side === 'top' ? { x: r.left + r.width / 2, y: r.top - 6 } : { x: r.left + r.width / 2, y: r.bottom + 6 });
  };
  const child = cloneElement(children as ReactElement<Record<string, unknown>>, { 'aria-describedby': pos ? id : undefined });
  return (
    <span ref={ref} className="inline-flex" onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)} onClick={() => setPos(null)}>
      {child}
      {pos &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{ left: pos.x, top: pos.y }}
            className={clsx(
              'pointer-events-none fixed z-[95] animate-fade-in whitespace-nowrap rounded-lg bg-navy px-2 py-1 text-micro font-medium text-white shadow-lg dark:bg-[#e5eff1] dark:text-[#0e2028]',
              side === 'bottom' && '-translate-x-1/2',
              side === 'top' && '-translate-x-1/2 -translate-y-full',
              side === 'right' && '-translate-y-1/2',
            )}
          >
            {label}
          </span>,
          document.body,
        )}
    </span>
  );
}

/* ------------------------------------------------------------------ data display */

export function KV({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(120px,max-content)_1fr] gap-x-5 gap-y-2">
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-meta text-ink-3">{k}</dt>
          <dd className="min-w-0 break-words">{v ?? <Unknown />}</dd>
        </div>
      ))}
    </dl>
  );
}

export const Unknown = ({ label = 'UNKNOWN' }: { label?: string }) => (
  <span className="inline-flex items-center gap-1 font-mono text-micro font-medium tracking-wide text-unknown" title="No verified value recorded">
    <span className="size-1.5 rounded-full border border-current" aria-hidden />
    {label}
  </span>
);

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'draft'; children: ReactNode }) {
  return (
    <div
      role="note"
      className={clsx(
        'flex gap-2.5 rounded-control px-3.5 py-2.5 text-meta leading-relaxed ring-1 ring-inset',
        tone === 'info' && 'bg-info/[0.06] text-ink-2 ring-info/20',
        tone === 'warn' && 'bg-warn/[0.07] text-ink-2 ring-warn/25',
        tone === 'draft' && 'bg-draft/[0.07] text-ink-2 ring-draft/25',
      )}
    >
      <span className={clsx('mt-1.5 size-1.5 shrink-0 rounded-full', tone === 'info' && 'bg-info', tone === 'warn' && 'bg-warn', tone === 'draft' && 'bg-draft')} aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Table({ head, children, dense }: { head: ReactNode[]; children: ReactNode; dense?: boolean }) {
  return (
    <div className="scroll-thin overflow-x-auto" tabIndex={0}>
      <table className={clsx('w-full border-collapse text-left', dense ? 'text-meta' : 'text-body')}>
        <thead>
          <tr className="border-b border-line text-micro font-medium text-ink-3">
            {head.map((h, i) => (
              <th key={i} scope="col" className="whitespace-nowrap px-2.5 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={clsx('[&_td]:border-b [&_td]:border-line [&_td]:px-2.5 [&_td]:align-top [&_tr:hover]:bg-accent-soft/40 [&_tr:last-child_td]:border-0', dense ? '[&_td]:py-1.5' : '[&_td]:py-2.5')}>{children}</tbody>
      </table>
    </div>
  );
}

/** Horizontal chain with Traceability Line connectors (signature motif). */
export function Chain({ steps, label }: { steps: { label: ReactNode; sub?: ReactNode; to?: string; state?: 'done' | 'current' | 'todo' | 'gap' }[]; label: string }) {
  return (
    <ol aria-label={label} tabIndex={0} className="scroll-thin flex items-stretch gap-0 overflow-x-auto pb-1">
      {steps.map((s, i) => {
        const inner = (
          <div
            className={clsx(
              'rounded-control border py-2 transition-colors',
              steps.length > 7 ? 'px-2' : 'px-3',
              s.state === 'done' && 'border-accent/35 bg-accent-soft/60',
              s.state === 'current' && 'border-accent bg-accent-soft shadow-[0_0_0_3px_var(--glow)]',
              s.state === 'gap' && 'border-dashed border-bad/40',
              (!s.state || s.state === 'todo') && 'border-line-strong bg-solid/50',
              s.to && 'hover:border-accent',
            )}
          >
            <div className={clsx('text-meta font-semibold text-ink', steps.length > 9 && 'whitespace-nowrap')}>{s.label}</div>
            {s.sub != null && <div className="num text-micro text-ink-3">{s.sub}</div>}
          </div>
        );
        return (
          <li key={i} className={clsx('flex items-center', steps.length > 9 ? 'flex-none' : steps.length > 7 ? 'min-w-[4.75rem] flex-1' : 'min-w-[6.5rem] flex-1')}>
            {s.to ? (
              <Link to={s.to} className={clsx('block rounded-control', steps.length > 9 ? 'flex-none' : 'min-w-0 flex-1')}>
                {inner}
              </Link>
            ) : (
              <div className={steps.length > 9 ? 'flex-none' : 'min-w-0 flex-1'}>{inner}</div>
            )}
            {i < steps.length - 1 && (
              <span className={clsx('flex shrink-0 items-center text-accent', steps.length > 7 ? 'w-3.5' : 'w-5')} aria-hidden>
                <span className="h-px flex-1 bg-gradient-to-r from-accent/60 to-accent/20" />
                <ChevronRight className="-ml-1 size-3.5" />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
