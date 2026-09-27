import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { inputClass } from '../../../components/ui';

/** Inline nullable number editor: commits on blur / Enter; empty = null (Not Available), never 0. */
export function NumInput({ value, onChange, label, min, max, step, className, placeholder = '—', width = 'w-24' }: { value: number | null | undefined; onChange: (v: number | null) => void; label: string; min?: number; max?: number; step?: number | 'any'; className?: string; placeholder?: string; width?: string }) {
  const [s, setS] = useState(value == null ? '' : String(value));
  useEffect(() => setS(value == null ? '' : String(value)), [value]);
  const [bad, setBad] = useState(false);
  const commit = () => {
    const t = s.trim();
    if (!t) {
      setBad(false);
      if (value != null) onChange(null);
      return;
    }
    const n = Number(t);
    if (!Number.isFinite(n) || (min != null && n < min) || (max != null && n > max)) {
      setBad(true);
      return;
    }
    setBad(false);
    if (n !== value) onChange(n);
  };
  return (
    <input
      aria-label={label}
      aria-invalid={bad || undefined}
      title={bad ? `Enter a number${min != null ? ` ≥ ${min}` : ''}${max != null ? ` ≤ ${max}` : ''}` : undefined}
      inputMode="decimal"
      className={clsx(inputClass, 'num !min-h-8 !py-1 !text-meta', width, bad && '!border-bad', className)}
      value={s}
      step={step}
      placeholder={placeholder}
      onChange={(e) => setS(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}

export function TextInput({ value, onChange, label, className }: { value: string | undefined; onChange: (v: string) => void; label: string; className?: string }) {
  const [s, setS] = useState(value ?? '');
  useEffect(() => setS(value ?? ''), [value]);
  return <input aria-label={label} className={clsx(inputClass, '!min-h-8 !py-1 !text-meta', className)} value={s} onChange={(e) => setS(e.target.value)} onBlur={() => s !== (value ?? '') && onChange(s)} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />;
}

export function SmallSelect<T extends string>({ value, onChange, options, label, className }: { value: T | '' | undefined; onChange: (v: T) => void; options: readonly (T | { value: T; label: string })[]; label: string; className?: string }) {
  return (
    <select aria-label={label} className={clsx(inputClass, '!min-h-8 !py-1 !text-meta', className)} value={value ?? ''} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        return (
          <option key={v} value={v}>
            {typeof o === 'string' ? o : o.label}
          </option>
        );
      })}
    </select>
  );
}
