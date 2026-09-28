import { useEffect, useState } from 'react';
import { fxOf } from '../../calculations/cost';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Button, Card, Input, Notice, Select, Unknown } from '../../components/ui';
import type { Bom, Rfq } from '../../domain/entities';
import { useFx } from '../../hooks/useCost';
import { useData, useRecords, type Rec } from '../../hooks/useData';
import { repo } from '../../repositories';
import { todayIso } from '../../utils/dates';
import { download, stamp, toCsv } from '../../utils/export';

type Quote = Rfq['quotes'][number];

/** RFQ ENGINE (spec §51): items from BOM → suppliers → quotations → comparison → selection → BOM. */
export default function RfqView({ record }: { record: Rec }) {
  const saved = record as unknown as Rfq & Rec;
  const [r, setR] = useState<Rfq>(saved);
  const [dirty, setDirty] = useState(false);
  const [addSup, setAddSup] = useState('');
  const suppliers = useRecords('supplier');
  const { byId } = useData();
  const fx = useFx();
  useEffect(() => {
    setR(saved);
    setDirty(false);
  }, [saved]);
  const upd = (x: Partial<Rfq>) => {
    setR({ ...r, ...x });
    setDirty(true);
  };
  const quote = (sup: string, line: string) => r.quotes.find((q) => q.supplier_id === sup && q.line_id === line);
  const setQuote = (sup: string, line: string, patch: Partial<Quote>) => {
    const existing = quote(sup, line) ?? { supplier_id: sup, line_id: line, price: null, currency: 'INR' as const, technical_compliance: 'Unknown' as const, received_at: todayIso() };
    upd({ quotes: [...r.quotes.filter((q) => !(q.supplier_id === sup && q.line_id === line)), { ...existing, ...patch }] });
  };
  const inrOf = (q?: Quote) => (q?.price == null ? null : q.price * fxOf(fx, q.currency));
  const lowestCompliant = (line: string) => {
    const qs = r.quotes.filter((q) => q.line_id === line && q.price != null && (q.technical_compliance === 'Compliant' || q.technical_compliance === 'Deviation'));
    return qs.sort((a, b) => (inrOf(a) ?? Infinity) - (inrOf(b) ?? Infinity))[0];
  };
  const save = async () => {
    const { __origin, __dataset, ...clean } = r as Rfq & { __origin?: unknown; __dataset?: unknown };
    void __origin;
    void __dataset;
    await repo().workspace.save(clean as unknown as Record<string, unknown>, 'Updated RFQ');
    setDirty(false);
  };
  const applyToBom = async () => {
    const bom = r.bom_id ? (byId.get(r.bom_id) as unknown as Bom | undefined) : undefined;
    if (!bom) return;
    const lines = bom.lines.map((l) => {
      const supId = r.selection?.[l.line_id];
      const q = supId ? quote(supId, l.line_id) : undefined;
      return q && q.price != null ? { ...l, unit_cost: q.price, currency: q.currency, cost_basis: 'QUOTED' as const, supplier: byId.get(supId!)?.name, lead_time_weeks: q.lead_time_weeks ?? l.lead_time_weeks } : l;
    });
    const { __origin, __dataset, ...cleanBom } = { ...bom, lines } as Bom & { __origin?: unknown; __dataset?: unknown };
    void __origin;
    void __dataset;
    await repo().workspace.saveMany([cleanBom as unknown as Record<string, unknown>, { ...r, rfq_status: 'Awarded' } as unknown as Record<string, unknown>], 'Applied RFQ selection to BOM');
  };
  const sel = r.selection ?? {};
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          RFQ {dirty && <Badge tone="draft">unsaved</Badge>}
        </span>
      }
      actions={
        <>
          <Button size="sm" onClick={() => download(`teal-rfq-${r.id}-${stamp()}.csv`, toCsv(r.items as unknown as Record<string, unknown>[]), 'text/csv')}>
            Export RFQ items
          </Button>
          {r.bom_id && Object.keys(sel).length > 0 && (
            <Button size="sm" onClick={() => void applyToBom()}>
              Apply selection to BOM
            </Button>
          )}
          <Button size="sm" variant="primary" disabled={!dirty} onClick={() => void save()}>
            Save
          </Button>
        </>
      }
    >
      <Notice tone="info">Quotations are entered from real supplier responses. The OS never generates prices. “Lowest compliant” is a comparison aid, not a recommendation.</Notice>
      <div className="my-2 flex flex-wrap items-center gap-2">
        <span className="text-body">
          BOM: <RecordLink id={r.bom_id} />
        </span>
        <Select aria-label="Add supplier" value={addSup} onChange={(e) => setAddSup(e.target.value)} className="w-64">
          <option value="">Add supplier…</option>
          {suppliers.filter((s) => !r.supplier_ids.includes(s.id)).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Button size="sm" disabled={!addSup} onClick={() => (upd({ supplier_ids: [...r.supplier_ids, addSup], rfq_status: r.rfq_status === 'Draft' ? 'Issued' : r.rfq_status }), setAddSup(''))}>
          Add
        </Button>
      </div>
      {!r.supplier_ids.length ? (
        <p className="text-ink-3">Add suppliers to record quotations.</p>
      ) : (
        <div className="overflow-x-auto" tabIndex={0}>
          <table className="w-full text-meta">
            <thead>
              <tr className="text-left text-micro uppercase text-ink-3">
                <th className="px-1">Item</th>
                {r.supplier_ids.map((s) => (
                  <th key={s} className="px-1">
                    <RecordLink id={s} />
                  </th>
                ))}
                <th className="px-1">Selected</th>
              </tr>
            </thead>
            <tbody>
              {r.items.map((it) => {
                const low = lowestCompliant(it.line_id);
                return (
                  <tr key={it.line_id} className="border-t border-line/60 align-top">
                    <td className="max-w-[220px] px-1">
                      <div className="font-medium">{it.part}</div>
                      <div className="text-micro text-ink-3">
                        {it.quantity} {it.unit} · {it.delivery}
                      </div>
                    </td>
                    {r.supplier_ids.map((s) => {
                      const q = quote(s, it.line_id);
                      return (
                        <td key={s} className={`px-1 ${low && low.supplier_id === s ? 'bg-ok/10' : ''}`}>
                          <div className="flex gap-1">
                            <Input aria-label="Price" type="number" placeholder="price" value={q?.price ?? ''} onChange={(e) => setQuote(s, it.line_id, { price: e.target.value === '' ? null : Number(e.target.value) })} className="w-24 py-0.5" />
                            <Select aria-label="Currency" value={q?.currency ?? 'INR'} onChange={(e) => setQuote(s, it.line_id, { currency: e.target.value as Quote['currency'] })} className="w-16 py-0.5">
                              {['INR', 'USD', 'EUR', 'JPY'].map((c) => (
                                <option key={c}>{c}</option>
                              ))}
                            </Select>
                          </div>
                          <div className="mt-0.5 flex gap-1">
                            <Input aria-label="Lead time weeks" type="number" placeholder="LT wk" value={q?.lead_time_weeks ?? ''} onChange={(e) => setQuote(s, it.line_id, { lead_time_weeks: e.target.value === '' ? null : Number(e.target.value) })} className="w-16 py-0.5" />
                            <Select aria-label="Technical compliance" value={q?.technical_compliance ?? 'Unknown'} onChange={(e) => setQuote(s, it.line_id, { technical_compliance: e.target.value as Quote['technical_compliance'] })} className="py-0.5">
                              {['Compliant', 'Deviation', 'Non-compliant', 'Unknown'].map((c) => (
                                <option key={c}>{c}</option>
                              ))}
                            </Select>
                          </div>
                          <Input aria-label="Validity" type="date" value={q?.validity ?? ''} onChange={(e) => setQuote(s, it.line_id, { validity: e.target.value || undefined })} className="mt-0.5 py-0.5" />
                          {q?.technical_compliance === 'Deviation' && <Input aria-label="Deviation" placeholder="deviation" value={q.deviation ?? ''} onChange={(e) => setQuote(s, it.line_id, { deviation: e.target.value })} className="mt-0.5 py-0.5" />}
                        </td>
                      );
                    })}
                    <td className="px-1">
                      <Select aria-label="Selected supplier" value={sel[it.line_id] ?? ''} onChange={(e) => upd({ selection: { ...sel, [it.line_id]: e.target.value }, rfq_status: 'Evaluated' })} className="py-0.5">
                        <option value="">—</option>
                        {r.supplier_ids.map((s) => (
                          <option key={s} value={s}>
                            {byId.get(s)?.name}
                          </option>
                        ))}
                      </Select>
                      <div className="text-micro text-ink-3">{low ? `lowest compliant: ${byId.get(low.supplier_id)?.name} (₹${Math.round(inrOf(low) ?? 0).toLocaleString('en-IN')})` : <Unknown label="no compliant quote" />}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
