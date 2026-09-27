import clsx from 'clsx';
import { ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { setPrefs, usePrefs } from '../../app/prefs';
import { fmtNum } from '../../calculations/units';
import { Badge, SegmentedControl } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import type { Basis, CompatType, EquipmentTemplate, Part, Simulation } from '../../domain/engineering';
import { useData } from '../../hooks/useData';
import { COMPAT_LABEL, COMPAT_TONE, compatCtx } from '../../services/eng/compatibility';
import { specDefs } from '../../services/eng/specs';
import { fxFromRecords } from '../../services/sim/bom';
import { basisLabel, type Lineage } from '../../services/sim/model';

/** Engineering context shared by the Studio, the Engineering Database and the Data Review Center. */
export function useEngineering() {
  const { records, byId, status } = useData();
  return useMemo(() => {
    const defs = specDefs(records);
    return {
      status,
      records,
      byId: byId as Map<string, AnyRecord>,
      defs,
      fx: fxFromRecords(records),
      ctx: compatCtx(records, defs),
      parts: records.filter((r) => r.entity === 'part') as unknown as (Part & AnyRecord)[],
      templates: records.filter((r) => r.entity === 'equipment_template') as unknown as (EquipmentTemplate & AnyRecord)[],
      sims: records.filter((r) => r.entity === 'simulation') as unknown as (Simulation & AnyRecord)[],
    };
  }, [records, byId, status]);
}
export type Eng = ReturnType<typeof useEngineering>;

export const num = (v: number | null | undefined, d = 3) => (v == null || !Number.isFinite(v) ? 'Not Available' : fmtNum(v, d));
export const money = (v: number | null | undefined, cur = 'INR') => (v == null || !Number.isFinite(v) ? 'Not Available' : `${cur === 'INR' ? '₹' : `${cur} `}${Math.round(v).toLocaleString('en-IN')}`);
/** Large counts: 29,96,585 → "29.97 lakh" / 3.1 million style kept readable in a tile. */
export const big = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? 'Not Available' : v >= 1e7 ? `${(v / 1e7).toLocaleString('en-IN', { maximumFractionDigits: 2 })} cr` : v >= 1e5 ? `${(v / 1e5).toLocaleString('en-IN', { maximumFractionDigits: 2 })} lakh` : Math.round(v).toLocaleString('en-IN'));
/** Money for tiles: INR in lakh / crore, other currencies in thousands / millions. */
export const moneyShort = (v: number | null | undefined, cur = 'INR') =>
  v == null || !Number.isFinite(v) ? 'Not Available' : cur === 'INR' ? `₹${big(v)}` : `${cur} ${v >= 1e6 ? `${(v / 1e6).toLocaleString('en-IN', { maximumFractionDigits: 2 })} M` : v >= 1e3 ? `${(v / 1e3).toLocaleString('en-IN', { maximumFractionDigits: 1 })} k` : Math.round(v).toLocaleString('en-IN')}`;
export const pct = (v: number | null | undefined, d = 3) => (v == null || !Number.isFinite(v) ? 'Not Available' : `${fmtNum(v * 100, d)} %`);

const BASIS_TONE: Record<string, 'ok' | 'info' | 'warn' | 'demo' | 'neutral' | 'accent'> = { CALCULATED: 'info', EMPIRICAL: 'ok', USER_INPUT: 'accent', MANUFACTURER_DATA: 'ok', VALIDATED: 'ok', ASSUMPTION: 'warn', DEMO: 'demo', MIXED: 'neutral' };
export function BasisBadge({ basis }: { basis?: Basis | 'MIXED' }) {
  if (!basis) return <Badge tone="warn">Not entered</Badge>;
  return <Badge tone={BASIS_TONE[basis] ?? 'neutral'}>{basisLabel(basis)}</Badge>;
}

export function CompatBadge({ t }: { t: CompatType }) {
  return <Badge tone={COMPAT_TONE[t]}>{COMPAT_LABEL[t]}</Badge>;
}

/** §141 engineering data lineage — every calculated number unfolds into its derivation. */
export function LineageTree({ node, depth = 0, open: open0 = depth < 2 }: { node: Lineage; depth?: number; open?: boolean }) {
  const [open, setOpen] = useState(open0);
  const kids = node.children ?? [];
  return (
    <li className={clsx(depth > 0 && 'border-l border-line pl-3')}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1">
        {kids.length ? (
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="inline-flex min-h-6 items-center gap-1 text-left font-medium text-ink hover:text-accent-2">
            <ChevronRight className={clsx('size-3.5 transition-transform duration-150', open && 'rotate-90')} aria-hidden />
            {node.label}
          </button>
        ) : (
          <span className="pl-4.5 text-ink-2">{node.label}</span>
        )}
        <span className="num font-semibold">
          {node.value == null ? 'Not Available' : fmtNum(node.value, 4)} {node.unit}
        </span>
        <BasisBadge basis={node.basis} />
        {node.formula && <span className="font-mono text-micro text-ink-3">{node.formula}</span>}
        {node.source && <span className="text-micro text-ink-3">{node.source}</span>}
      </div>
      {open && kids.length > 0 && (
        <ul className="ml-1.5">
          {kids.map((k, i) => (
            <LineageTree key={i} node={k} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

/** §122/§159 Engineering vs Customer demo mode. */
export function ModeToggle() {
  const { viewMode } = usePrefs();
  return (
    <SegmentedControl
      label="View mode"
      size="sm"
      value={viewMode}
      onChange={(v) => setPrefs({ viewMode: v })}
      options={[
        { value: 'engineering', label: 'Engineering', icon: Eye },
        { value: 'customer', label: 'Customer', icon: EyeOff },
      ]}
    />
  );
}
export const useCustomerMode = () => usePrefs().viewMode === 'customer';
