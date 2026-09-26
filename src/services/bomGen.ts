import type { BomLine } from '../domain/entities';
import type { ConfigState, ConfiguratorEngine } from '../features/configurator/engine';

/**
 * CONFIGURATION → PRELIMINARY BOM → COST LINES. Used by the inquiry workflow, the configurator
 * and the BOM engine so the rules are identical everywhere:
 *  - L001 platform standard machine at its parametric base-price ESTIMATE
 *  - laser source line (customer-supplied → 0, else cost UNKNOWN: included in the platform estimate)
 *  - one line per module/extra/software: list-price ESTIMATE, or 0 when it is standard content
 */
export function bomLinesFromConfig(e: ConfiguratorEngine, s: ConfigState, opts: { customerSuppliesLaser?: boolean } = {}): BomLine[] {
  const p = e.product(s);
  if (!p) return [];
  const lines: BomLine[] = [];
  let li = 1;
  const L = (x: Omit<BomLine, 'line_id'>) => lines.push({ line_id: `L${String(li++).padStart(3, '0')}`, ...x });
  L({ level: 'Product', description: `${p.name} — standard machine (${p.title})`, quantity: 1, unit: 'no', make_buy: 'Make', unit_cost: p.base_price_inr, currency: 'INR', cost_basis: 'ESTIMATE', risk: 'Unknown' });
  const src = e.sources.get(s.sourceKey ?? '');
  const lens = e.lenses.get(s.lensKey ?? '');
  L({
    level: 'Module',
    parent_line_id: 'L001',
    description: opts.customerSuppliesLaser ? `Laser source — CUSTOMER SUPPLIED (free issue): ${src?.name ?? ''} class, ${s.powerW ?? '?'} W` : `Laser source — ${src?.name ?? s.sourceKey} ${s.powerW ?? ''} W (in platform estimate)`,
    quantity: 1,
    unit: 'no',
    make_buy: 'Buy',
    unit_cost: opts.customerSuppliesLaser ? 0 : null,
    currency: 'INR',
    cost_basis: opts.customerSuppliesLaser ? 'ESTIMATE' : 'UNKNOWN',
    import_item: !opts.customerSuppliesLaser,
    risk: 'Unknown',
  });
  if (lens) L({ level: 'Component', parent_line_id: 'L001', description: `${lens.name} (in platform estimate)`, quantity: 1, unit: 'no', make_buy: 'Buy', unit_cost: null, currency: 'INR', cost_basis: 'UNKNOWN', import_item: true, risk: 'Unknown' });
  for (const k of [...s.modules, ...s.extras, ...(s.software ? [s.software] : [])]) {
    const m = e.modules.get(k);
    if (!m) continue;
    const std = p.standard_content.includes(k);
    L({
      level: 'Module',
      parent_line_id: 'L001',
      description: `${m.name}${std ? ' (standard content — in platform base)' : ''}`,
      quantity: 1,
      unit: 'no',
      make_buy: m.kind === 'automation' ? 'Make' : 'Buy',
      unit_cost: std ? 0 : m.price_estimate_inr,
      currency: 'INR',
      cost_basis: 'ESTIMATE',
      module_id: m.id,
      risk: 'Unknown',
    });
  }
  return lines;
}

/** BOM lines → cost-engine material lines (only lines with a known unit cost; product header excluded). */
export function costMaterialLinesFromBom(lines: BomLine[]): Record<string, unknown>[] {
  return lines
    .filter((l) => l.unit_cost != null && l.level !== 'Product')
    .map((l) => ({ id: l.line_id, item: l.description, code: l.item_code ?? '', cls: l.import_item ? 'Import Item' : l.make_buy === 'Make' ? 'Standard Component' : 'Bought-Out Assembly', vendor: l.supplier ?? '', qty: l.quantity, uom: l.unit, price: l.unit_cost, cur: l.currency }));
}

export const BOM_COST_ASSUMPTIONS = [
  'Module values are configurator LIST-PRICE ESTIMATES used as cost proxies — replace with quotations (RFQ)',
  'Platform standard machine cost is UNKNOWN (only its parametric price estimate exists) — not included',
  'Engineering, labour, commissioning, site, packing and AMC not yet estimated — UNKNOWN',
  'Landed % and mark-up % are legacy defaults (ASSUMPTION)',
];
