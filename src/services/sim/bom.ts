import type { FxRate } from '../../calculations/cost';
import type { AnyRecord } from '../../domain';
import { disciplineOf, productTypeLabel } from '../../domain/engineering';
import type { Resolved } from './model';
import { latestPrice, originOf, selectedParts } from './supply';

/*
 * BOM ENGINE + EQUIPMENT COST (master prompt §93, §94, §142). The BOM is derived from the scenario's
 * selections — each line references the canonical part record (no copied specifications).
 * Currencies are never mixed silently: every line keeps its own currency; conversion uses a dated
 * FX table and the rate used is shown. Cost elements that were not entered are "Not included".
 */

export type BomLevel = 'Equipment' | 'System' | 'Subsystem' | 'Component';
export interface BomItem {
  id: string;
  parentId: string | null;
  level: BomLevel;
  name: string;
  partId?: string;
  quantity: number;
  reference?: string;
  revision?: string;
  supplier?: string;
  unitCost: number | null;
  currency: string | null;
  basis?: string;
  leadTimeWeeks: number | null;
  origin?: string;
  status?: string;
  /** unit cost converted to the scenario currency (null = no price or no FX) */
  extended: number | null;
}

export interface CostElement {
  key: 'boughtOut' | 'fabrication' | 'material' | 'integration' | 'testing' | 'shipping' | 'duty' | 'installation';
  label: string;
  value: number | null;
  included: boolean;
  basis: string;
}
export interface CostResult {
  currency: string;
  items: BomItem[];
  elements: CostElement[];
  manufacturing: number | null;
  total: number | null;
  /** subtotal of bought-out lines in their own currencies */
  byCurrency: Record<string, number>;
  fxUsed: { code: string; rate_to_inr: number; as_of: string | null; source: string }[];
  missingPrices: BomItem[];
  missingFx: string[];
  importedShare: number | null;
  localShare: number | null;
  notes: string[];
}

export function fxFromRecords(records: AnyRecord[]): Record<string, FxRate> {
  const out: Record<string, FxRate> = {};
  for (const r of records) {
    if (r.entity !== 'reference' || r.table !== 'fx') continue;
    const v = r.values as { code: string; rate_to_inr: number; as_of: string | null; source: string };
    out[v.code] = { code: v.code, rate_to_inr: v.rate_to_inr, as_of: v.as_of, source: v.source };
  }
  return out;
}

function convertMoney(v: number, from: string, to: string, fx: Record<string, FxRate>): number | null {
  if (from === to) return v;
  const a = from === 'INR' ? 1 : fx[from]?.rate_to_inr;
  const b = to === 'INR' ? 1 : fx[to]?.rate_to_inr;
  if (!a || !b) return null;
  return (v * a) / b;
}

export function buildBom(res: Resolved, byId: Map<string, AnyRecord>, fx: Record<string, FxRate>): CostResult {
  const sim = res.sim;
  const cur = sim.currency ?? 'INR';
  const items: BomItem[] = [];
  const root = `bom-${sim.id}`;
  const fxCodes = new Set<string>();
  const missingFx = new Set<string>();
  items.push({ id: root, parentId: null, level: 'Equipment', name: sim.name, quantity: 1, revision: `v${sim.version ?? 1}`, unitCost: null, currency: cur, leadTimeWeeks: null, extended: null });
  const groups = [...res.stations.map((s) => ({ key: s.station.key, name: s.station.name, capex: s.station.capex ?? null })), { key: '_machine', name: 'Machine-level systems (controls, safety, utilities)', capex: null }];
  const sp = selectedParts(res);
  for (const g of groups) {
    const sysId = `${root}/${g.key}`;
    const mine = sp.filter((x) => x.stationKey === g.key);
    if (!mine.length && g.capex == null && g.key === '_machine') continue;
    items.push({ id: sysId, parentId: root, level: 'System', name: g.name, quantity: 1, unitCost: null, currency: null, leadTimeWeeks: null, extended: null });
    const disciplines = [...new Set(mine.map((x) => disciplineOf(x.part.product_type)))];
    for (const d of disciplines) {
      const subId = `${sysId}/${d}`;
      items.push({ id: subId, parentId: sysId, level: 'Subsystem', name: d, quantity: 1, unitCost: null, currency: null, leadTimeWeeks: null, extended: null });
      for (const x of mine.filter((m) => disciplineOf(m.part.product_type) === d)) {
        const pr = latestPrice(x.part);
        const o = originOf(x.part, byId);
        let extended: number | null = null;
        if (pr) {
          if (pr.currency !== cur) fxCodes.add(pr.currency);
          const c = convertMoney(pr.price, pr.currency, cur, fx);
          if (c == null) missingFx.add(pr.currency);
          extended = c != null ? c * x.qty : null;
        }
        items.push({
          id: `${subId}/${x.part.id}/${x.role}`,
          parentId: subId,
          level: 'Component',
          name: `${x.role}: ${x.part.name}`,
          partId: x.part.id,
          quantity: x.qty,
          reference: x.part.model_number,
          supplier: o.manufacturer,
          unitCost: pr?.price ?? null,
          currency: pr?.currency ?? null,
          basis: pr?.basis ?? 'No price recorded',
          leadTimeWeeks: pr?.lead_time_weeks ?? null,
          origin: o.origin,
          status: x.part.record_status,
          extended,
        });
      }
    }
    if (g.capex != null) {
      items.push({ id: `${sysId}/fabrication`, parentId: sysId, level: 'Component', name: `Fabrication & integration — ${g.name}`, quantity: 1, unitCost: g.capex, currency: cur, basis: sim.data_type === 'DEMO' ? 'DEMO' : 'ESTIMATE', leadTimeWeeks: null, origin: 'Local', extended: g.capex });
    }
  }
  const comps = items.filter((i) => i.level === 'Component');
  const bought = comps.filter((i) => i.partId);
  const fab = comps.filter((i) => !i.partId);
  const byCurrency: Record<string, number> = {};
  for (const b of bought) if (b.unitCost != null && b.currency) byCurrency[b.currency] = (byCurrency[b.currency] ?? 0) + b.unitCost * b.quantity;
  const missingPrices = bought.filter((b) => b.unitCost == null);
  const sum = (xs: BomItem[]) => (xs.some((x) => x.extended == null && x.unitCost != null) ? null : xs.reduce((s, x) => s + (x.extended ?? 0), 0));
  const boughtOut = sum(bought);
  const fabrication = fab.length ? fab.reduce((s, x) => s + (x.extended ?? 0), 0) : null;
  const importedCost = bought.filter((b) => b.origin === 'Imported').reduce((s, b) => s + (b.extended ?? 0), 0);
  const localCost = bought.filter((b) => b.origin === 'Local').reduce((s, b) => s + (b.extended ?? 0), 0) + (fabrication ?? 0);
  const c = sim.cost ?? {};
  const base = boughtOut != null ? boughtOut + (fabrication ?? 0) : null;
  const pctOf = (p: number | null | undefined, of: number | null) => (p != null && of != null ? (of * p) / 100 : null);
  const elements: CostElement[] = [
    { key: 'boughtOut', label: 'Bought-out components', value: boughtOut, included: boughtOut != null, basis: `${bought.length} lines from recorded prices${missingPrices.length ? `; ${missingPrices.length} without a price (not included)` : ''}` },
    { key: 'fabrication', label: 'Fabrication & integration (stations)', value: fabrication, included: fabrication != null, basis: fabrication != null ? `Station cost inputs (${sim.data_type === 'DEMO' ? 'DEMO' : 'estimate'})` : 'No station cost entered' },
    { key: 'material', label: 'Raw material', value: null, included: false, basis: 'Not modelled separately — part of the fabrication input' },
    { key: 'integration', label: 'System integration', value: pctOf(c.integration_pct, base), included: c.integration_pct != null && base != null, basis: c.integration_pct != null ? `${c.integration_pct} % of components + fabrication` : 'Not entered — not included' },
    { key: 'testing', label: 'Testing (FAT)', value: pctOf(c.testing_pct, base), included: c.testing_pct != null && base != null, basis: c.testing_pct != null ? `${c.testing_pct} % of components + fabrication` : 'Not entered — not included' },
    { key: 'shipping', label: 'Shipping (imported parts)', value: pctOf(c.shipping_pct, importedCost), included: c.shipping_pct != null, basis: c.shipping_pct != null ? `${c.shipping_pct} % of imported cost` : 'Not entered — not included' },
    { key: 'duty', label: 'Import duty', value: pctOf(c.duty_pct, importedCost), included: c.duty_pct != null, basis: c.duty_pct != null ? `${c.duty_pct} % of imported cost` : 'Not entered — not included' },
    { key: 'installation', label: 'Installation', value: c.installation ?? null, included: c.installation != null, basis: c.installation != null ? 'Entered' : 'Not entered — not included' },
  ];
  const manufacturing = fabrication != null || elements[3].included || elements[4].included ? (fabrication ?? 0) + (elements[3].value ?? 0) + (elements[4].value ?? 0) : null;
  const total = boughtOut == null ? null : elements.filter((e) => e.included && e.key !== 'material').reduce((s, e) => s + (e.value ?? 0), 0);
  const notes: string[] = [];
  if (missingFx.size) notes.push(`No FX rate for ${[...missingFx].join(', ')} — the total cannot be formed without silently mixing currencies`);
  const fxUsed = [...fxCodes].filter((code) => fx[code]).map((code) => fx[code]);
  if (fxUsed.some((f) => !f.as_of)) notes.push('FX rates have no as-of date (legacy seed, ASSUMPTION) — replace with dated rates from Finance before quoting');
  if (missingPrices.length) notes.push(`${missingPrices.length} component(s) have no price and are not in the total`);
  const known = importedCost + localCost;
  return {
    currency: cur,
    items,
    elements,
    manufacturing,
    total,
    byCurrency,
    fxUsed,
    missingPrices,
    missingFx: [...missingFx],
    importedShare: known ? importedCost / known : null,
    localShare: known ? localCost / known : null,
    notes,
  };
}

export const bomTypeLabel = (partType: string) => productTypeLabel(partType);
