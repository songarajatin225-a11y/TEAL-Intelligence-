import { HelpCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { fmtNum } from '../calculations/units';
import type { CalcResult } from '../calculations/types';
import type { AnyRecord } from '../domain';
import { useData } from '../hooks/useData';
import { whyForCalc, whyForRecord, type WhyItem } from '../services/why';
import { Badge, Drawer } from './ui';

interface WhyCtx {
  open: (title: string, items: WhyItem[]) => void;
}
const Ctx = createContext<WhyCtx>({ open: () => {} });

const KIND_TONE = { Source: 'accent', Evidence: 'ok', Calculation: 'info', Rule: 'demo', Assumption: 'warn', Unknown: 'neutral', Provenance: 'neutral' } as const;

export function WhyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ title: string; items: WhyItem[] } | null>(null);
  const open = useCallback((title: string, items: WhyItem[]) => setState({ title, items }), []);
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <Drawer open={!!state} onClose={() => setState(null)} title={<>WHY? — {state?.title}</>}>
        <p className="mb-3 text-ink-3">Source · Evidence · Calculation · Rule · Assumption · Unknown</p>
        <ol className="space-y-2">
          {state?.items.map((it, i) => (
            <li key={i} className="rounded-md border border-line p-2.5">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge tone={KIND_TONE[it.kind]}>{it.kind}</Badge>
                {it.status && <Badge>{it.status}</Badge>}
                <span className="font-medium">{it.title}</span>
              </div>
              {it.detail && <pre className="whitespace-pre-wrap break-words font-sans text-body text-ink-2">{it.detail}</pre>}
              {it.ref && (
                <div className="mt-1 text-meta">
                  {it.ref.includes('.md') ? (
                    <Link className="text-accent-2 underline" to={`/knowledge/${it.ref.replace('#', '?a=')}`}>
                      Open handbook section
                    </Link>
                  ) : (
                    <Link className="text-accent-2 underline" to={`/record/${it.ref}`}>
                      Open {it.ref}
                    </Link>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      </Drawer>
    </Ctx.Provider>
  );
}

export const useWhy = () => useContext(Ctx);

export function WhyButton({ record, calc, label = 'Why?', title }: { record?: AnyRecord; calc?: CalcResult; label?: string; title?: string }) {
  const { open } = useWhy();
  const { graph } = useData();
  return (
    <button
      type="button"
      className={label ? 'inline-flex h-9 items-center gap-1.5 rounded-control border border-line-strong bg-solid/70 px-3 text-body font-medium text-accent-2 hover:border-accent/50 hover:bg-accent-soft no-print' : 'inline-flex items-center rounded-full p-0.5 text-accent-2 hover:bg-accent-soft no-print'}
      aria-label={`Why? ${title ?? record?.name ?? calc?.label ?? ''}`}
      onClick={() => {
        if (calc) open(title ?? calc.label, whyForCalc(calc));
        else if (record) open(title ?? record.name, whyForRecord(record, graph));
      }}
    >
      <HelpCircle className={label ? 'size-4' : 'size-3.5'} aria-hidden />
      {label}
    </button>
  );
}

/** A calculated number with its unit and a WHY? link to formula, inputs, assumptions and source. */
export function CalcValue({ c, digits = 3, unitOverride }: { c: CalcResult | null | undefined; digits?: number; unitOverride?: string }) {
  if (!c) return <span className="font-mono text-micro text-ink-3">UNKNOWN</span>;
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={c.value == null ? 'font-mono text-micro font-semibold text-ink-3' : 'num'} title={c.warnings.join('; ') || undefined}>
        {c.value == null ? 'UNKNOWN' : fmtNum(c.value, digits)}
      </span>
      {c.value != null && <span className="text-ink-3">{unitOverride ?? c.unit}</span>}
      <WhyButton calc={c} label="" title={c.label} />
    </span>
  );
}
