import type { CostModuleKey } from '../../calculations/cost';

/** Line-grid columns per cost module — same layout as the legacy TEAL Cost Platform. */
export interface CostCol {
  k: string;
  l: string;
  t: 'text' | 'num' | 'select';
  opts?: string[];
  vocab?: string;
  w?: string;
}

export const COST_COLS: Record<CostModuleKey, CostCol[]> = {
  material: [
    { k: 'code', l: 'Stock code', t: 'text' },
    { k: 'item', l: 'Item / sub-assembly', t: 'text', w: '2fr' },
    { k: 'cls', l: 'Class', t: 'select', vocab: 'MAT_CLASS' },
    { k: 'vendor', l: 'Vendor', t: 'text' },
    { k: 'qty', l: 'Qty', t: 'num' },
    { k: 'uom', l: 'UOM', t: 'text' },
    { k: 'price', l: 'Unit price', t: 'num' },
    { k: 'cur', l: 'Cur', t: 'select', opts: ['INR', 'USD', 'EUR', 'JPY'] },
  ],
  mechanical: [
    { k: 'item', l: 'Description', t: 'text', w: '2fr' },
    { k: 'type', l: 'Type', t: 'select', vocab: 'TYPE_MECH' },
    { k: 'vendor', l: 'Vendor', t: 'text' },
    { k: 'qty', l: 'Qty', t: 'num' },
    { k: 'rate', l: 'Rate', t: 'num' },
  ],
  electrical: [
    { k: 'item', l: 'Description', t: 'text', w: '2fr' },
    { k: 'type', l: 'Type', t: 'select', vocab: 'TYPE_ELEC' },
    { k: 'make', l: 'Make', t: 'text' },
    { k: 'qty', l: 'Qty', t: 'num' },
    { k: 'rate', l: 'Unit price', t: 'num' },
  ],
  software: [
    { k: 'item', l: 'Activity', t: 'select', vocab: 'ACT_SW' },
    { k: 'res', l: 'Resource', t: 'text' },
    { k: 'md', l: 'Mandays', t: 'num' },
    { k: 'rate', l: 'Rate / manday', t: 'num' },
  ],
  manufacturing: [
    { k: 'proc', l: 'Process', t: 'text', w: '2fr' },
    { k: 'dept', l: 'Dept', t: 'text' },
    { k: 'part', l: 'Part / reference', t: 'text' },
    { k: 'setup', l: 'Setup h', t: 'num' },
    { k: 'hrs', l: 'Run h', t: 'num' },
    { k: 'rate', l: 'Rate / h', t: 'num' },
  ],
  labour: [
    { k: 'item', l: 'Activity', t: 'select', vocab: 'ACT_LAB' },
    { k: 'cat', l: 'Category', t: 'text' },
    { k: 'md', l: 'Mandays', t: 'num' },
    { k: 'rate', l: 'Rate / day', t: 'num' },
    { k: 'ot', l: 'OT h', t: 'num' },
    { k: 'otr', l: 'OT rate', t: 'num' },
  ],
  design: [
    { k: 'disc', l: 'Discipline', t: 'text', w: '2fr' },
    { k: 'scope', l: 'Scope note', t: 'text' },
    { k: 'md', l: 'Mandays', t: 'num' },
    { k: 'rate', l: 'Rate / day', t: 'num' },
    { k: 'nre', l: 'NRE', t: 'num' },
  ],
  site: [
    { k: 'head', l: 'Head', t: 'select', vocab: 'HEAD_SITE' },
    { k: 'loc', l: 'Location', t: 'text' },
    { k: 'pax', l: 'Persons', t: 'num' },
    { k: 'days', l: 'Days', t: 'num' },
    { k: 'rate', l: 'Rate / unit', t: 'num' },
  ],
  commercial: [
    { k: 'head', l: 'Head', t: 'select', vocab: 'HEAD_COMM' },
    { k: 'basis', l: 'Basis', t: 'select', opts: ['Lump sum', '% of direct cost'] },
    { k: 'val', l: 'Value', t: 'num' },
  ],
  commissioning: [
    { k: 'act', l: 'Activity', t: 'select', vocab: 'COMM_ACTS' },
    { k: 'note', l: 'Reference', t: 'text' },
    { k: 'hrs', l: 'Hours', t: 'num' },
    { k: 'rate', l: 'Rate / h', t: 'num' },
  ],
  packaging: [
    { k: 'desc', l: 'Crate description', t: 'text', w: '2fr' },
    { k: 'len', l: 'L mm', t: 'num' },
    { k: 'wid', l: 'W mm', t: 'num' },
    { k: 'hgt', l: 'H mm', t: 'num' },
    { k: 'boxes', l: 'Boxes', t: 'num' },
    { k: 'rate', l: 'Rate / m²', t: 'num' },
  ],
  amc: [
    { k: 'head', l: 'Head', t: 'select', vocab: 'HEAD_AMC' },
    { k: 'tier', l: 'Tier', t: 'select', opts: ['Basic', 'Standard', 'Premium'] },
    { k: 'visits', l: 'Visits / yr', t: 'num' },
    { k: 'rate', l: 'Cost / visit', t: 'num' },
    { k: 'esc', l: 'Escalation %', t: 'num' },
    { k: 'yrs', l: 'Years', t: 'num' },
  ],
};

export const BLANK: Record<CostModuleKey, () => Record<string, unknown>> = {
  material: () => ({ code: '', item: '', cls: 'Standard Component', vendor: '', qty: 1, uom: 'no', price: 0, cur: 'INR' }),
  mechanical: () => ({ item: '', type: 'Fabrication', vendor: '', qty: 1, rate: 0 }),
  electrical: () => ({ item: '', type: 'Sensors', make: '', qty: 1, rate: 0 }),
  software: () => ({ item: 'PLC Programming', res: 'Controls Engineering', md: 0, rate: 0 }),
  manufacturing: () => ({ proc: '', dept: '', part: '', setup: 0, hrs: 0, rate: 0 }),
  labour: () => ({ item: 'Mechanical Assembly', cat: '', md: 0, rate: 0, ot: 0, otr: 0 }),
  design: () => ({ disc: 'Mechanical Design', scope: '', md: 0, rate: 0, nre: 0 }),
  site: () => ({ head: 'Engineer Deployment', loc: '', pax: 1, days: 1, rate: 0 }),
  commercial: () => ({ head: 'Outward Freight', basis: 'Lump sum', val: 0 }),
  commissioning: () => ({ act: 'Assembly Mechanical', note: '', hrs: 0, rate: 0 }),
  packaging: () => ({ desc: '', len: 0, wid: 0, hgt: 0, boxes: 1, rate: 1600 }),
  amc: () => ({ head: 'Preventive Maintenance Labour', tier: 'Standard', visits: 4, rate: 0, esc: 6, yrs: 3 }),
};
