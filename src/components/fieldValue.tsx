import type { ReactNode } from 'react';
import { RecordLink } from './RecordLink';
import { Unknown } from './ui';

const ID_RE = /^[a-z]{2,6}-[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** Human rendering of any stored field value: ids → links, quantities with units, UNKNOWN for null. */
export function renderValue(v: unknown): ReactNode {
  if (v == null || v === '') return <Unknown />;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'string') return ID_RE.test(v) ? <RecordLink id={v} /> : v;
  if (typeof v === 'number') return <span className="num">{v.toLocaleString('en-IN')}</span>;
  if (Array.isArray(v)) {
    if (!v.length) return <span className="text-ink-3">—</span>;
    if (v.every((x) => typeof x === 'string' || typeof x === 'number'))
      return (
        <span className="flex flex-wrap gap-x-1.5 gap-y-0.5">
          {v.map((x, i) => (
            <span key={i}>
              {renderValue(x)}
              {i < v.length - 1 ? ',' : ''}
            </span>
          ))}
        </span>
      );
    return <span className="text-meta text-ink-3">{v.length} entries</span>;
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('value' in o && 'unit' in o) return o.value == null ? <Unknown /> : <span className="num">{`${String(o.value)} ${String(o.unit)}`}</span>;
    return <span className="text-meta text-ink-3">{Object.keys(o).length} fields</span>;
  }
  return String(v);
}

/** Field key → human label ("price_estimate_inr" → "Price estimate (INR)"). */
export function fieldLabel(k: string): string {
  const s = k
    .replace(/_ids?$/, (m) => (m === '_ids' ? 's' : ''))
    .replace(/_inr$/, ' (INR)')
    .replace(/_(w|mm|um|nm|kg|h|khz)$/, (_, u: string) => ` (${u === 'um' ? 'µm' : u === 'w' ? 'W' : u === 'khz' ? 'kHz' : u})`)
    .replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
