import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { applyScenario, COST_MODULE_KEYS, COST_MODULE_META, computeCost, costPerPart, landedCost, lifecycleCost, lineAmount, payback, priceToWin, roi, SCENARIO_PRESETS, tealSheet, type CostModuleKey, type LineRow } from '../../calculations/cost';
import { StatusBadge } from '../../components/badges';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Button, Card, Field, Input, KV, Notice, Select, Stat, Table, Tabs, Unknown } from '../../components/ui';
import { CalcValue } from '../../components/why';
import type { Bom, CostModel } from '../../domain/entities';
import { costInputs, useApprovalBands, useFx } from '../../hooks/useCost';
import { useData, type Rec } from '../../hooks/useData';
import { repo } from '../../repositories';
import { download, stamp, toCsv } from '../../utils/export';
import { BLANK, COST_COLS } from './costColumns';
import { approvalFloor } from '../../calculations/cost';

const inr = (v: number) => `₹ ${Math.round(v).toLocaleString('en-IN')}`;
const lakh = (v: number) => `₹ ${(v / 1e5).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
type Tab = 'buildup' | 'teal' | 'landed' | 'scenarios' | 'economics' | 'params';

/** TEAL COST ENGINE (spec §9, §48–§50, §136) — the legacy cost platform, on the shared model. */
export default function CostModelView({ record }: { record: Rec }) {
  const saved = record as unknown as CostModel & Rec;
  const [m, setM] = useState<CostModel>(saved);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<Tab>('buildup');
  const [mod, setMod] = useState<CostModuleKey>('material');
  const [target, setTarget] = useState('');
  const { costDefaults, byId } = useData();
  const fx = useFx(m);
  const bands = useApprovalBands();
  useEffect(() => {
    setM(saved);
    setDirty(false);
  }, [saved]);

  const c = useMemo(() => computeCost(costInputs(m), fx), [m, fx]);
  const t = useMemo(() => tealSheet(c, m.teal), [c, m.teal]);
  const floor = approvalFloor(c.orderValue, bands);
  const vocab = ((costDefaults as { vocab?: Record<string, string[]> } | null)?.vocab ?? {}) as Record<string, string[]>;
  const update = (next: CostModel) => {
    setM(next);
    setDirty(true);
  };
  const setLine = (k: CostModuleKey, i: number, field: string, v: unknown) => {
    const rows = [...((m.lines[k] as LineRow[]) ?? [])];
    rows[i] = { ...rows[i], [field]: v };
    update({ ...m, lines: { ...m.lines, [k]: rows } });
  };
  const save = async () => {
    const { __origin, __dataset, ...clean } = m as CostModel & { __origin?: unknown; __dataset?: unknown };
    void __origin;
    void __dataset;
    await repo().workspace.save(clean as unknown as Record<string, unknown>, 'Edited cost model');
    setDirty(false);
  };
  const eco = m.economics ?? {};
  const pb = payback({ capex: c.selling, annual_saving: eco.annual_saving, annual_operating_cost: eco.annual_operating_cost });
  const r = roi({ capex: c.selling, annual_saving: eco.annual_saving, annual_operating_cost: eco.annual_operating_cost, life_years: eco.life_years });
  const lcc = lifecycleCost({ capex: c.selling, annual_operating_cost: eco.annual_operating_cost, life_years: eco.life_years, amc_total: c.amc });
  const cpp = costPerPart({ lifecycle_cost: lcc.value, annual_parts: eco.annual_parts, life_years: eco.life_years });
  const bom = m.bom_id ? (byId.get(m.bom_id) as unknown as Bom | undefined) : undefined;
  const bomLead = bom ? Math.max(0, ...bom.lines.map((l) => l.lead_time_weeks ?? 0)) : null;
  const bomRisk = bom ? bom.lines.filter((l) => l.risk === 'High').length : null;
  const unknownLines = bom ? bom.lines.filter((l) => l.unit_cost == null).length : 0;
  const ptw = target ? priceToWin(Number(target), c) : null;

  return (
    <div className="space-y-3">
      {m.data_type === 'DEMO' && <Notice tone="info">DEMO cost model — rates and prices are legacy seed values, not quotations.</Notice>}
      {c.warnings.map((w) => (
        <Notice key={w} tone="warn">
          {w}
        </Notice>
      ))}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
        <Stat label="Direct cost / unit" value={lakh(c.direct)} />
        <Stat label="Total cost / unit" value={lakh(c.totalCost)} sub={`OH ${lakh(c.overheads)} · cont. ${lakh(c.contingency)}`} />
        <Stat label="Selling / unit" value={lakh(c.selling)} sub={`mark-up ${m.markup.profitPct}% on cost`} />
        <Stat label="Net margin" value={`${(c.netMargin * 100).toFixed(1)}%`} tone={c.netMargin * 100 < floor.minMargin ? 'bad' : 'ok'} sub={`floor ${floor.minMargin}% (${floor.approver})`} />
        <Stat label="Order value" value={lakh(c.orderValue)} sub={`qty ${c.qty} · + AMC ${lakh(c.amc)}`} />
        <Stat label="TEAL sheet D / unit" value={lakh(t.D)} sub={`net ${(t.netMargin * 100).toFixed(1)}%`} />
      </div>
      {bom && unknownLines > 0 && <Notice tone="warn">{unknownLines} BOM line(s) have UNKNOWN cost and are not in this cost model — see <RecordLink id={bom.id} />.</Notice>}
      <Card
        title={
          <span className="flex items-center gap-2">
            Cost model {dirty && <Badge tone="draft">unsaved</Badge>}
          </span>
        }
        actions={
          <>
            <Button size="sm" onClick={() => download(`teal-cost-${m.id}-${stamp()}.csv`, toCsv(COST_MODULE_KEYS.flatMap((k) => (c.lines[k] ?? []).map((l) => ({ module: k, ...l, amount_inr: Math.round(l._amt) })))), 'text/csv')}>
              Export lines CSV
            </Button>
            <Button size="sm" variant="primary" disabled={!dirty} onClick={() => void save()}>
              Save local draft
            </Button>
          </>
        }
      >
        <Tabs
          label="Cost views"
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'buildup', label: 'Build-up' },
            { key: 'teal', label: 'TEAL sheet A/B/C/D' },
            { key: 'landed', label: 'Landed cost' },
            { key: 'scenarios', label: 'Scenarios' },
            { key: 'economics', label: 'ROI / payback' },
            { key: 'params', label: 'Parameters' },
          ]}
        />
        {tab === 'buildup' && (
          <div>
            <div className="mb-2 flex flex-wrap gap-1">
              {COST_MODULE_KEYS.map((k) => (
                <Button key={k} size="sm" variant={mod === k ? 'primary' : 'default'} onClick={() => setMod(k)}>
                  {COST_MODULE_META[k].label} <span className="num ml-1 text-micro opacity-80">{lakh(c.buckets[k])}</span>
                </Button>
              ))}
            </div>
            <p className="mb-1 text-meta text-ink-3">Line formula: {COST_MODULE_META[mod].formula}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <thead>
                  <tr className="text-left text-micro uppercase text-ink-3">
                    {COST_COLS[mod].map((col) => (
                      <th key={col.k} className="px-1 py-1">
                        {col.l}
                      </th>
                    ))}
                    <th className="px-1 py-1 text-right">Amount INR</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {((m.lines[mod] as LineRow[]) ?? []).map((row, i) => (
                    <tr key={i} className="border-t border-line/60">
                      {COST_COLS[mod].map((col) => (
                        <td key={col.k} className="px-1 py-0.5">
                          {col.t === 'select' ? (
                            <Select aria-label={col.l} value={String(row[col.k] ?? '')} onChange={(e) => setLine(mod, i, col.k, e.target.value)} className="py-1">
                              {[...new Set([...(col.opts ?? vocab[col.vocab ?? ''] ?? []), String(row[col.k] ?? '')])].filter(Boolean).map((o) => (
                                <option key={o}>{o}</option>
                              ))}
                            </Select>
                          ) : (
                            <Input aria-label={col.l} type={col.t === 'num' ? 'number' : 'text'} step="any" value={String(row[col.k] ?? '')} onChange={(e) => setLine(mod, i, col.k, col.t === 'num' ? (e.target.value === '' ? 0 : Number(e.target.value)) : e.target.value)} className={`py-1 ${col.t === 'num' ? 'w-24 text-right' : ''}`} />
                          )}
                        </td>
                      ))}
                      <td className="num px-1 text-right">{Number.isFinite(lineAmount(mod, row, fx, { directBase: 0 })) ? inr(c.lines[mod]?.[i]?._amt ?? lineAmount(mod, row, fx)) : <Unknown label="no FX" />}</td>
                      <td>
                        <Button size="sm" variant="ghost" aria-label="Remove line" onClick={() => update({ ...m, lines: { ...m.lines, [mod]: ((m.lines[mod] as LineRow[]) ?? []).filter((_, j) => j !== i) } })}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button size="sm" className="mt-2" onClick={() => update({ ...m, lines: { ...m.lines, [mod]: [...((m.lines[mod] as LineRow[]) ?? []), { id: `n${Date.now()}`, ...BLANK[mod]() }] } })}>
              <Plus className="size-3.5" /> Add line
            </Button>
            {mod === 'material' && (
              <p className="mt-2 text-meta text-ink-3">
                Material bucket = basic {inr(c.basic)} + freight {inr(c.freight)} + duty {inr(c.duty)} + landing {inr(c.landing)} = {inr(c.buckets.material)}. GST {inr(c.gst)} recorded for cash-flow only and excluded from cost (legacy rule).
              </p>
            )}
            <Table head={['Roll-up (per unit)', 'INR']} dense>
              <tr>
                <td>Direct cost (all equipment modules)</td>
                <td className="num text-right">{inr(c.direct)}</td>
              </tr>
              <tr>
                <td>Overheads @ {m.markup.overheadPct}%</td>
                <td className="num text-right">{inr(c.overheads)}</td>
              </tr>
              <tr>
                <td>Contingency @ {m.markup.contingencyPct}%</td>
                <td className="num text-right">{inr(c.contingency)}</td>
              </tr>
              <tr className="font-semibold">
                <td>Total cost</td>
                <td className="num text-right">{inr(c.totalCost)}</td>
              </tr>
              <tr>
                <td>Profit @ {m.markup.profitPct}% of cost</td>
                <td className="num text-right">{inr(c.profit)}</td>
              </tr>
              <tr className="font-semibold">
                <td>Selling price</td>
                <td className="num text-right">{inr(c.selling)}</td>
              </tr>
              <tr>
                <td>Gross margin · net margin</td>
                <td className="num text-right">
                  {(c.grossMargin * 100).toFixed(1)}% · {(c.netMargin * 100).toFixed(1)}%
                </td>
              </tr>
            </Table>
            <Field label="Price to win — target per unit (INR)" htmlFor="ptw">
              <div className="flex flex-wrap items-center gap-2">
                <Input id="ptw" type="number" className="w-48" value={target} onChange={(e) => setTarget(e.target.value)} />
                {ptw && (
                  <span className="text-body">
                    implied mark-up <b className="num">{ptw.markupPct.toFixed(1)}%</b> · margin <b className="num">{ptw.marginPct.toFixed(1)}%</b> · gap to current price <b className="num">{inr(ptw.gap)}</b> {ptw.marginPct < floor.minMargin && <Badge tone="bad">below approval floor</Badge>}
                  </span>
                )}
              </div>
            </Field>
          </div>
        )}
        {tab === 'teal' && (
          <div>
            <p className="mb-2 text-ink-2">House format. Price is grossed up, not marked up: D = C ÷ (1 − profit% − warranty%) (Automation Handbook C1). Divisor {t.divisor.toFixed(3)}.</p>
            <Table head={['', 'Line', 'Per unit', `× ${t.qty}`]} dense>
              {(
                [
                  ['A', 'Raw material + consumables', t.rawMat],
                  ['A', 'Standard boughts', t.boughts],
                  ['A', 'Manufacturing parts (mfg + mechanical + electrical)', t.mfgParts],
                  ['A', 'Packing & forwarding', t.packFwd],
                  ['A', `Insurance @ ${t.T.insurancePct}%`, t.insurance],
                  ['A', 'Boarding & lodging (site)', t.boarding],
                  ['A', 'A total', t.A],
                  ['B', 'Assembly', t.assembly],
                  ['B', 'Installation', t.installation],
                  ['B', 'Debug + OQC', t.debugOqc],
                  ['B', `SG&A (engineering + other commercial + ${t.T.sgaPct}%)`, t.sga],
                  ['B', 'Sustaining OSS', t.oss],
                  ['B', 'B total', t.B],
                  ['C', 'C = A + B (total cost)', t.C],
                  ['D', `Profit @ ${t.T.profitPct}% of price`, t.profit],
                  ['D', `Warranty @ ${t.T.warrantyPct}% of price`, t.warranty],
                  ['D', 'D = customer price', t.D],
                ] as [string, string, number][]
              ).map(([k, l, v], i) => (
                <tr key={i} className={/total|= /.test(l) ? 'font-semibold' : ''}>
                  <td className="num text-accent-2">{k}</td>
                  <td>{l}</td>
                  <td className="num text-right">{inr(v)}</td>
                  <td className="num text-right">{inr(v * t.qty)}</td>
                </tr>
              ))}
            </Table>
          </div>
        )}
        {tab === 'landed' && <LandedTab m={m} fx={fx} />}
        {tab === 'scenarios' && (
          <div>
            <p className="mb-2 text-ink-2">Scenario multipliers are ASSUMPTIONS (src/calculations/cost.ts SCENARIO_PRESETS). Lead time and risk come from the linked BOM.</p>
            <Table head={['Scenario', 'Qty', 'Total cost / unit', 'Selling / unit', 'Net margin', 'Payback', 'Lead time', 'High-risk lines', 'Basis']} dense>
              {SCENARIO_PRESETS.map((s) => {
                const cc = computeCost(applyScenario(costInputs(m), s), fx);
                const p = payback({ capex: cc.selling, annual_saving: eco.annual_saving, annual_operating_cost: eco.annual_operating_cost });
                return (
                  <tr key={s.key}>
                    <td className="font-medium">{s.label}</td>
                    <td className="num">{cc.qty}</td>
                    <td className="num text-right">{lakh(cc.totalCost)}</td>
                    <td className="num text-right">{lakh(cc.selling)}</td>
                    <td className="num text-right">{(cc.netMargin * 100).toFixed(1)}%</td>
                    <td className="num">{p.value == null ? <Unknown /> : `${p.value.toFixed(2)} y`}</td>
                    <td className="num">{bomLead == null ? <Unknown /> : `${bomLead} wk`}</td>
                    <td className="num">{bomRisk ?? <Unknown />}</td>
                    <td className="text-meta text-ink-3">{s.note}</td>
                  </tr>
                );
              })}
            </Table>
          </div>
        )}
        {tab === 'economics' && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-2">
              <p className="text-ink-2">Customer economics — enter the customer’s figures. Nothing is assumed.</p>
              {(
                [
                  ['annual_saving', 'Customer annual saving (INR/yr)'],
                  ['annual_operating_cost', 'Annual operating cost (INR/yr)'],
                  ['annual_parts', 'Good parts per year'],
                  ['life_years', 'Machine life (years)'],
                ] as const
              ).map(([k, l]) => (
                <Field key={k} label={l} htmlFor={`eco-${k}`}>
                  <Input id={`eco-${k}`} type="number" value={eco[k] ?? ''} onChange={(e) => update({ ...m, economics: { ...eco, [k]: e.target.value === '' ? null : Number(e.target.value) } })} />
                </Field>
              ))}
            </div>
            <KV
              items={[
                ['Capex (selling price)', inr(c.selling)],
                ['Payback', <CalcValue key="pb" c={pb} />],
                ['ROI (life)', <CalcValue key="r" c={r.value == null ? r : { ...r, value: r.value * 100, unit: '%' }} />],
                ['Life-cycle cost', <CalcValue key="l" c={lcc} />],
                ['Equipment cost per part', <CalcValue key="c" c={cpp} />],
              ]}
            />
          </div>
        )}
        {tab === 'params' && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <fieldset className="space-y-1 rounded border border-line p-2">
              <legend className="px-1 text-meta font-semibold">Landed % (on material)</legend>
              {(['freightPct', 'dutyPct', 'landingPct', 'gstPct', 'siteContPct'] as const).map((k) => (
                <Field key={k} label={k} htmlFor={`l-${k}`}>
                  <Input id={`l-${k}`} type="number" step="any" value={m.landed[k]} onChange={(e) => update({ ...m, landed: { ...m.landed, [k]: Number(e.target.value) } })} />
                </Field>
              ))}
            </fieldset>
            <fieldset className="space-y-1 rounded border border-line p-2">
              <legend className="px-1 text-meta font-semibold">Mark-up %</legend>
              {(['overheadPct', 'contingencyPct', 'profitPct'] as const).map((k) => (
                <Field key={k} label={k} htmlFor={`m-${k}`}>
                  <Input id={`m-${k}`} type="number" step="any" value={m.markup[k]} onChange={(e) => update({ ...m, markup: { ...m.markup, [k]: Number(e.target.value) } })} />
                </Field>
              ))}
              <Field label="Quantity" htmlFor="m-qty">
                <Input id="m-qty" type="number" min={1} value={m.qty} onChange={(e) => update({ ...m, qty: Math.max(1, Math.round(Number(e.target.value) || 1)) })} />
              </Field>
            </fieldset>
            <fieldset className="space-y-1 rounded border border-line p-2">
              <legend className="px-1 text-meta font-semibold">TEAL sheet</legend>
              {(['insurancePct', 'sgaPct', 'warrantyPct', 'profitPct', 'ossMonthly', 'stationHc', 'ossMonths'] as const).map((k) => (
                <Field key={k} label={k} htmlFor={`t-${k}`}>
                  <Input id={`t-${k}`} type="number" step="any" value={t.T[k]} onChange={(e) => update({ ...m, teal: { ...t.T, [k]: Number(e.target.value) } })} />
                </Field>
              ))}
            </fieldset>
          </div>
        )}
      </Card>
      {m.assumptions?.length ? (
        <Card title="Assumptions">
          <ul className="list-disc pl-5 text-ink-2">
            {m.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      <StatusBadge s={m.status} />
    </div>
  );
}

function LandedTab({ m, fx }: { m: CostModel; fx: ReturnType<typeof useFx> }) {
  const rows = ((m.lines.material as LineRow[]) ?? []).filter((r) => r.cur && r.cur !== 'INR');
  return (
    <div>
      <p className="mb-2 text-ink-2">Base cost + freight + insurance + duty + applicable charges = landed cost (Automation Handbook C4). Original currency, FX rate, FX date and source are preserved.</p>
      {rows.length ? (
        <Table head={['Item', 'Original', 'FX → INR', 'FX date', 'FX source', 'Landed INR (model %)', '']} dense>
          {rows.map((r, i) => {
            const rate = fx[String(r.cur)];
            const lc = landedCost({ base_cost: Number(r.qty) * Number(r.price), currency: String(r.cur), fx: rate ?? null, freight_pct: m.landed.freightPct, duty_pct: m.landed.dutyPct, other_pct: m.landed.landingPct });
            return (
              <tr key={i}>
                <td>{String(r.item)}</td>
                <td className="num">
                  {Number(r.price).toLocaleString('en-IN')} {String(r.cur)} × {String(r.qty)}
                </td>
                <td className="num">{rate?.rate_to_inr ?? <Unknown />}</td>
                <td>{rate?.as_of ?? <Unknown label="UNDATED" />}</td>
                <td className="text-meta text-ink-3">{rate?.source ?? '—'}</td>
                <td className="num">
                  <CalcValue c={lc} />
                </td>
                <td />
              </tr>
            );
          })}
        </Table>
      ) : (
        <p className="text-ink-3">No foreign-currency material lines in this model.</p>
      )}
    </div>
  );
}
