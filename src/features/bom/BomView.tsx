import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, Input, Notice, Select, Stat } from '../../components/ui';
import { BOM_LEVELS, BOM_TYPES, COST_BASIS, type Bom, type BomLine, type CostModel, type Rfq, type Localization } from '../../domain/entities';
import { useFx } from '../../hooks/useCost';
import { useData, useRecords, type Rec } from '../../hooks/useData';
import { newLocalId, repo } from '../../repositories';
import { BOM_COST_ASSUMPTIONS, costMaterialLinesFromBom } from '../../services/bomGen';
import { download, stamp, toCsv } from '../../utils/export';
import { fxOf } from '../../calculations/cost';

const depth = (l: BomLine, all: BomLine[]): number => {
  let d = 0;
  let p = l.parent_line_id;
  while (p && d < 8) {
    d++;
    p = all.find((x) => x.line_id === p)?.parent_line_id;
  }
  return d;
};

/** BOM ENGINE (spec §47): Product → Assembly → Subassembly → Module → Component; EBOM/MBOM/Service/Spare. */
export default function BomView({ record }: { record: Rec }) {
  const saved = record as unknown as Bom & Rec;
  const [b, setB] = useState<Bom>(saved);
  const [dirty, setDirty] = useState(false);
  const fx = useFx();
  const nav = useNavigate();
  const { costDefaults } = useData();
  const suppliers = useRecords('supplier');
  useEffect(() => {
    setB(saved);
    setDirty(false);
  }, [saved]);
  const set = (i: number, k: keyof BomLine, v: unknown) => {
    const lines = [...b.lines];
    lines[i] = { ...lines[i], [k]: v } as BomLine;
    setB({ ...b, lines });
    setDirty(true);
  };
  const totals = useMemo(() => {
    const by: Record<string, number> = {};
    let inrTotal = 0;
    let unknown = 0;
    for (const l of b.lines) {
      if (l.unit_cost == null) {
        unknown++;
        continue;
      }
      const v = l.quantity * l.unit_cost * fxOf(fx, l.currency);
      by[l.cost_basis] = (by[l.cost_basis] ?? 0) + v;
      inrTotal += v;
    }
    return { by, inrTotal, unknown, longLead: b.lines.filter((l) => (l.lead_time_weeks ?? 0) >= 12), imports: b.lines.filter((l) => l.import_item) };
  }, [b, fx]);

  const save = async () => {
    const { __origin, __dataset, ...clean } = b as Bom & { __origin?: unknown; __dataset?: unknown };
    void __origin;
    void __dataset;
    await repo().workspace.save(clean as unknown as Record<string, unknown>, 'Edited BOM');
    setDirty(false);
  };
  const genRfq = async () => {
    const buy = b.lines.filter((l) => l.make_buy === 'Buy' && l.level !== 'Product');
    const rfq: Rfq = {
      id: newLocalId('rfq'),
      entity: 'rfq',
      name: `RFQ — ${b.name}`,
      bom_id: b.id,
      project_id: b.project_id,
      rfq_status: 'Draft',
      supplier_ids: [],
      items: buy.map((l) => ({ line_id: l.line_id, part: l.description, specification: [l.part_number, l.manufacturer].filter(Boolean).join(' · ') || undefined, quantity: l.quantity, unit: l.unit, quality: 'As per specification; certificates of conformity', delivery: l.lead_time_weeks ? `${l.lead_time_weeks} weeks` : 'To be quoted', technical_requirements: 'Datasheet and compliance statement required' })),
      quotes: [],
      commercial_terms: 'Price basis, validity, payment terms, Incoterms and warranty to be stated by supplier.',
      data_type: 'USER_CREATED',
      provenance: { verification_status: 'DRAFT', note: `Generated from BOM ${b.id}` },
    };
    const r = await repo().workspace.save(rfq as unknown as Record<string, unknown>, 'Generated RFQ from BOM');
    nav(`/record/${encodeURIComponent(r.id)}`);
  };
  const genCost = async () => {
    const d = (costDefaults ?? {}) as { landed?: CostModel['landed']; markup?: CostModel['markup']; teal?: CostModel['teal'] };
    const cm: CostModel = { id: newLocalId('cost_model'), entity: 'cost_model', name: `Cost — ${b.name}`, currency: 'INR', qty: 1, bom_id: b.id, product_id: b.product_id, configuration_id: b.configuration_id, project_id: b.project_id, lines: { material: costMaterialLinesFromBom(b.lines) }, landed: d.landed ?? { freightPct: 2, dutyPct: 0, landingPct: 1.5, gstPct: 18, siteContPct: 8 }, markup: d.markup ?? { overheadPct: 14, contingencyPct: 3, profitPct: 18 }, teal: d.teal, scenario: 'Base', assumptions: [...BOM_COST_ASSUMPTIONS], data_type: 'USER_CREATED', provenance: { verification_status: 'DRAFT', note: `From BOM ${b.id}` } };
    const r = await repo().workspace.save(cm as unknown as Record<string, unknown>, 'Cost model from BOM');
    nav(`/record/${encodeURIComponent(r.id)}`);
  };
  const genLoc = async () => {
    const recs: Localization[] = totals.imports.map((l) => ({ id: newLocalId('localization'), entity: 'localization', name: `Localize: ${l.description}`, imported_component: l.description, current_cost: l.unit_cost, currency: l.currency, classification: 'UNDECIDED', data_type: 'USER_CREATED', provenance: { verification_status: 'DRAFT', note: `From BOM ${b.id} line ${l.line_id}` }, next_action: { action: 'Identify Indian alternative and technology gap' } }));
    await repo().workspace.saveMany(recs as unknown as Record<string, unknown>[], 'Localization candidates from BOM');
    nav('/localization');
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          BOM {dirty && <Badge tone="draft">unsaved</Badge>}
        </span>
      }
      actions={
        <>
          <Button size="sm" onClick={() => download(`teal-bom-${b.id}-${stamp()}.csv`, toCsv(b.lines as unknown as Record<string, unknown>[]), 'text/csv')}>
            Export CSV
          </Button>
          <Button size="sm" onClick={() => void genRfq()}>
            Generate RFQ
          </Button>
          <Button size="sm" onClick={() => void genCost()}>
            Cost model
          </Button>
          {totals.imports.length > 0 && (
            <Button size="sm" onClick={() => void genLoc()}>
              Localization candidates ({totals.imports.length})
            </Button>
          )}
          <Button size="sm" variant="primary" disabled={!dirty} onClick={() => void save()}>
            Save
          </Button>
        </>
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-5">
        <Stat label="Lines" value={b.lines.length} sub={`${b.bom_type} rev ${b.revision}`} />
        <Stat label="Known cost (INR)" value={`${(totals.inrTotal / 1e5).toFixed(2)} L`} sub={Object.entries(totals.by).map(([k, v]) => `${k} ${(v / 1e5).toFixed(1)} L`).join(' · ')} />
        <Stat label="UNKNOWN cost lines" value={totals.unknown} tone={totals.unknown ? 'warn' : 'ok'} />
        <Stat label="Long-lead (≥12 wk)" value={totals.longLead.length} />
        <Stat label="Import items" value={totals.imports.length} />
      </div>
      {totals.unknown > 0 && <Notice tone="warn">Lines with UNKNOWN cost are excluded from totals — request quotations with Generate RFQ.</Notice>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-body">
        <label>
          Type{' '}
          <Select aria-label="BOM type" value={b.bom_type} onChange={(e) => (setB({ ...b, bom_type: e.target.value as Bom['bom_type'] }), setDirty(true))} className="inline w-36">
            {BOM_TYPES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </label>
        <label>
          Revision <Input aria-label="Revision" value={b.revision} onChange={(e) => (setB({ ...b, revision: e.target.value }), setDirty(true))} className="inline w-20" />
        </label>
      </div>
      <div className="mt-2 overflow-x-auto" tabIndex={0}>
        <table className="w-full text-meta">
          <thead>
            <tr className="text-left text-micro uppercase text-ink-3">
              {['#', 'Level', 'Description', 'Part no.', 'Mfr', 'Supplier', 'Qty', 'Unit', 'M/B', 'Unit cost', 'Cur', 'Basis', 'LT wk', 'MOQ', 'Risk', 'Alt', 'Rev', 'Imp', ''].map((h) => (
                <th key={h} className="px-1 py-1">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.lines.map((l, i) => (
              <tr key={l.line_id} className="border-t border-line/60">
                <td className="num px-1">{l.line_id}</td>
                <td className="px-1">
                  <Select aria-label="Level" value={l.level} onChange={(e) => set(i, 'level', e.target.value)} className="py-0.5">
                    {BOM_LEVELS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </Select>
                </td>
                <td className="min-w-[220px] px-1" style={{ paddingLeft: depth(l, b.lines) * 14 }}>
                  <Input aria-label="Description" value={l.description} onChange={(e) => set(i, 'description', e.target.value)} className="py-0.5" />
                </td>
                <td className="px-1">
                  <Input aria-label="Part number" value={l.part_number ?? ''} onChange={(e) => set(i, 'part_number', e.target.value || undefined)} className="w-24 py-0.5" />
                </td>
                <td className="px-1">
                  <Input aria-label="Manufacturer" value={l.manufacturer ?? ''} onChange={(e) => set(i, 'manufacturer', e.target.value || undefined)} className="w-24 py-0.5" />
                </td>
                <td className="px-1">
                  <Input aria-label="Supplier" list="bom-suppliers" value={l.supplier ?? ''} onChange={(e) => set(i, 'supplier', e.target.value || undefined)} className="w-28 py-0.5" />
                </td>
                <td className="px-1">
                  <Input aria-label="Quantity" type="number" value={l.quantity} onChange={(e) => set(i, 'quantity', Number(e.target.value))} className="w-14 py-0.5 text-right" />
                </td>
                <td className="px-1">
                  <Input aria-label="Unit" value={l.unit} onChange={(e) => set(i, 'unit', e.target.value)} className="w-12 py-0.5" />
                </td>
                <td className="px-1">
                  <Select aria-label="Make or buy" value={l.make_buy} onChange={(e) => set(i, 'make_buy', e.target.value)} className="py-0.5">
                    <option>Make</option>
                    <option>Buy</option>
                  </Select>
                </td>
                <td className="px-1">
                  <Input aria-label="Unit cost" type="number" value={l.unit_cost ?? ''} placeholder="UNKNOWN" onChange={(e) => set(i, 'unit_cost', e.target.value === '' ? null : Number(e.target.value))} className="w-24 py-0.5 text-right" />
                </td>
                <td className="px-1">
                  <Select aria-label="Currency" value={l.currency} onChange={(e) => set(i, 'currency', e.target.value)} className="py-0.5">
                    {['INR', 'USD', 'EUR', 'JPY'].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </Select>
                </td>
                <td className="px-1">
                  <Select aria-label="Cost basis" value={l.cost_basis} onChange={(e) => set(i, 'cost_basis', e.target.value)} className="py-0.5">
                    {COST_BASIS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </Select>
                </td>
                <td className="px-1">
                  <Input aria-label="Lead time weeks" type="number" value={l.lead_time_weeks ?? ''} onChange={(e) => set(i, 'lead_time_weeks', e.target.value === '' ? null : Number(e.target.value))} className="w-14 py-0.5" />
                </td>
                <td className="px-1">
                  <Input aria-label="MOQ" type="number" value={l.moq ?? ''} onChange={(e) => set(i, 'moq', e.target.value === '' ? null : Number(e.target.value))} className="w-14 py-0.5" />
                </td>
                <td className="px-1">
                  <Select aria-label="Risk" value={l.risk ?? 'Unknown'} onChange={(e) => set(i, 'risk', e.target.value)} className="py-0.5">
                    {['Low', 'Medium', 'High', 'Unknown'].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </Select>
                </td>
                <td className="px-1">
                  <Input aria-label="Alternate" value={l.alternate ?? ''} onChange={(e) => set(i, 'alternate', e.target.value || undefined)} className="w-20 py-0.5" />
                </td>
                <td className="px-1">
                  <Input aria-label="Revision" value={l.revision ?? ''} onChange={(e) => set(i, 'revision', e.target.value || undefined)} className="w-10 py-0.5" />
                </td>
                <td className="px-1 text-center">
                  <input type="checkbox" aria-label="Import item" checked={!!l.import_item} onChange={(e) => set(i, 'import_item', e.target.checked)} />
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Remove line"
                    onClick={() => {
                      setB({ ...b, lines: b.lines.filter((_, j) => j !== i) });
                      setDirty(true);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="bom-suppliers">
          {suppliers.map((s) => (
            <option key={s.id} value={s.name} />
          ))}
        </datalist>
      </div>
      <Button
        size="sm"
        className="mt-2"
        onClick={() => {
          const n = b.lines.length + 1;
          setB({ ...b, lines: [...b.lines, { line_id: `L${String(n).padStart(3, '0')}${n > 999 ? n : ''}`, parent_line_id: b.lines[0]?.line_id, level: 'Component', description: '', quantity: 1, unit: 'no', make_buy: 'Buy', unit_cost: null, currency: 'INR', cost_basis: 'UNKNOWN', risk: 'Unknown' }] });
          setDirty(true);
        }}
      >
        <Plus className="size-3.5" /> Add line
      </Button>
    </Card>
  );
}
