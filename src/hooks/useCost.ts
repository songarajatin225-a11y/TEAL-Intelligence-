import { useMemo } from 'react';
import { approvalFloor, computeCost, fxTable, tealSheet, type ApprovalBand, type CostInputs, type FxTable } from '../calculations/cost';
import type { CostModel } from '../domain/entities';
import { useData } from './useData';

/** FX table from reference data (legacy seed rates, undated → flagged) overridden per cost model. */
export function useFx(model?: Pick<CostModel, 'fx'>): FxTable {
  const { records } = useData();
  return useMemo(() => {
    const base = records
      .filter((r) => r.entity === 'reference' && (r as { table?: string }).table === 'fx')
      .map((r) => {
        const v = (r as unknown as { values: { code: string; rate_to_inr: number; as_of: string | null; source: string } }).values;
        return { code: v.code, rate_to_inr: Number(v.rate_to_inr), as_of: v.as_of, source: `${v.source} (${r.data_type})` };
      });
    return fxTable([...base, ...(model?.fx ?? [])]);
  }, [records, model?.fx]);
}

export function useApprovalBands(): ApprovalBand[] {
  const { records } = useData();
  return useMemo(
    () =>
      records
        .filter((r) => r.entity === 'reference' && (r as { table?: string }).table === 'approval_band')
        .map((r) => (r as unknown as { values: ApprovalBand }).values)
        .sort((a, b) => a.minMargin - b.minMargin),
    [records],
  );
}

export function costInputs(m: CostModel): CostInputs {
  return { qty: m.qty, lines: m.lines as CostInputs['lines'], landed: m.landed, markup: m.markup };
}

export function useCostSummary(m: CostModel | undefined) {
  const fx = useFx(m);
  const bands = useApprovalBands();
  return useMemo(() => {
    if (!m) return null;
    const c = computeCost(costInputs(m), fx);
    const t = tealSheet(c, m.teal);
    const floor = approvalFloor(c.orderValue, bands);
    return { c, t, floor, belowFloor: c.netMargin * 100 < floor.minMargin };
  }, [m, fx, bands]);
}

export function summarizeCostModel(m: CostModel, fx: FxTable) {
  const c = computeCost(costInputs(m), fx);
  return { c, t: tealSheet(c, m.teal) };
}
