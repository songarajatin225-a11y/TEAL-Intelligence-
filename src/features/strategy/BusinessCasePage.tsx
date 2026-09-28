import clsx from 'clsx';
import { Briefcase, Download, Swords, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/badges';
import { recordPath } from '../../components/RecordLink';
import { Badge, Button, Card, EmptyState, Field, Input, Notice, PageHeader, Select, Table } from '../../components/ui';
import { businessCase, marketChecks, SENSITIVITY_LABEL, sensitivity, type BusinessCaseInput, type MarketFigure } from '../../calculations/businessCase';
import { useData } from '../../hooks/useData';
import { download, stamp } from '../../utils/export';

const KEY = 'teal-os:business-case:v1';
type Num = keyof BusinessCaseInput;
const FIELDS: { key: Num; label: string; hint?: string }[] = [
  { key: 'price', label: 'Selling price per unit' },
  { key: 'unitCost', label: 'Unit cost', hint: 'From Cost → TEAL cost sheet (C)' },
  { key: 'unitsYear1', label: 'Units in year 1' },
  { key: 'growthPct', label: 'Volume growth per year (%)' },
  { key: 'investment', label: 'Up-front investment (NRE, tooling)' },
  { key: 'fixedAnnual', label: 'Fixed cost per year' },
  { key: 'years', label: 'Horizon (years)' },
  { key: 'discountPct', label: 'Discount rate (%)' },
];
const REQUIRED: Num[] = ['price', 'unitCost', 'unitsYear1', 'years'];

interface Sheet {
  currency: string;
  inputs: Partial<Record<Num, string>>;
  market: Record<'tam' | 'sam' | 'som', { value: string; source: string; year: string }>;
}
const EMPTY: Sheet = { currency: 'INR', inputs: { growthPct: '0', investment: '0', fixedAnnual: '0', discountPct: '0' }, market: { tam: { value: '', source: '', year: '' }, sam: { value: '', source: '', year: '' }, som: { value: '', source: '', year: '' } } };

function load(): Sheet {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Sheet) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

const money = (v: number, cur: string) => `${cur} ${Math.round(v).toLocaleString('en-IN')}`;
const toNum = (s?: string) => (s == null || s.trim() === '' ? null : Number(s));

function Competitors() {
  const { records } = useData();
  const seen = useMemo(() => {
    const m = new Map<string, { name: string; opps: typeof records }>();
    for (const o of records.filter((r) => r.entity === 'opportunity')) {
      const c = (o as { competitor?: string }).competitor?.trim();
      if (!c) continue;
      const k = c.toLowerCase();
      (m.get(k) ?? m.set(k, { name: c, opps: [] }).get(k)!).opps.push(o);
    }
    return [...m.values()].sort((a, b) => b.opps.length - a.opps.length);
  }, [records]);
  const companies = records.filter((r) => r.entity === 'company' && ((r as { roles?: string[] }).roles ?? []).includes('competitor'));
  return (
    <Card title="Competitor intelligence" icon={Swords} description="Only competitors recorded on opportunities or on company records — nothing is looked up or assumed">
      {!seen.length && !companies.length ? (
        <EmptyState compact icon={Swords} title="No competitors recorded" explain={<>Record the competitor on an opportunity (field “Competitor”) or mark a company’s role as competitor. Competitive claims need evidence — see <Link className="text-accent-2 hover:underline" to="/evidence">Evidence</Link>.</>} />
      ) : (
        <Table head={['Competitor', 'Seen on', 'Stages', 'Company record']} dense>
          {seen.map((c) => (
            <tr key={c.name} className="border-t border-line/60">
              <td className="font-medium">{c.name}</td>
              <td>
                {c.opps.map((o) => (
                  <Link key={o.id} to={recordPath(o.id)} className="mr-2 text-accent-2 hover:underline">
                    {o.name}
                  </Link>
                ))}
              </td>
              <td className="space-x-1">
                {c.opps.map((o) => (
                  <StatusBadge key={o.id} s={(o as { stage?: string }).stage} />
                ))}
              </td>
              <td>{companies.find((co) => co.name.toLowerCase() === c.name.toLowerCase()) ? <Badge tone="ok">linked</Badge> : '—'}</td>
            </tr>
          ))}
          {companies
            .filter((co) => !seen.some((c) => c.name.toLowerCase() === co.name.toLowerCase()))
            .map((co) => (
              <tr key={co.id} className="border-t border-line/60">
                <td className="font-medium">
                  <Link to={recordPath(co.id)} className="text-accent-2 hover:underline">
                    {co.name}
                  </Link>
                </td>
                <td className="text-ink-3">no opportunity yet</td>
                <td />
                <td>
                  <Badge tone="ok">company</Badge>
                </td>
              </tr>
            ))}
        </Table>
      )}
    </Card>
  );
}

/** MARKET & BUSINESS CASE (ultimate spec §69–76): competitors, sourced market sizing, cash-flow case with sensitivity. */
export default function BusinessCasePage() {
  const [sheet, setSheet] = useState<Sheet>(load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(sheet));
    } catch {
      /* worksheet lasts for this page only */
    }
  }, [sheet]);
  const cur = sheet.currency;
  const set = (k: Num, v: string) => setSheet((s) => ({ ...s, inputs: { ...s.inputs, [k]: v } }));
  const missing = REQUIRED.filter((k) => toNum(sheet.inputs[k]) == null || Number.isNaN(toNum(sheet.inputs[k])));
  const input: BusinessCaseInput | null = missing.length ? null : (Object.fromEntries(FIELDS.map((f) => [f.key, toNum(sheet.inputs[f.key]) ?? 0])) as unknown as BusinessCaseInput);
  const result = input ? businessCase(input) : null;
  const sens = input ? sensitivity(input, 10) : [];
  const maxSwing = Math.max(1, ...sens.map((s) => Math.max(Math.abs(s.low - (result?.npv ?? 0)), Math.abs(s.high - (result?.npv ?? 0)))));

  const fig = (k: 'tam' | 'sam' | 'som'): MarketFigure => ({ value: toNum(sheet.market[k].value), source: sheet.market[k].source, year: sheet.market[k].year });
  const issues = marketChecks(fig('tam'), fig('sam'), fig('som'));
  const tamV = fig('tam').value ?? 0;
  const setM = (k: 'tam' | 'sam' | 'som', f: 'value' | 'source' | 'year', v: string) => setSheet((s) => ({ ...s, market: { ...s.market, [k]: { ...s.market[k], [f]: v } } }));

  const exportMd = () => {
    const lines = [
      `# Business case — ${new Date().toISOString().slice(0, 10)}`,
      '',
      '> ESTIMATE — calculated from the inputs below; not a forecast from TEAL data.',
      '',
      '## Market',
      ...(['tam', 'sam', 'som'] as const).map((k) => `- ${k.toUpperCase()}: ${sheet.market[k].value ? `${cur} ${sheet.market[k].value}` : 'UNKNOWN'} (${sheet.market[k].year || 'year ?'}) — source: ${sheet.market[k].source || 'UNSOURCED'}`),
      '',
      '## Inputs',
      ...FIELDS.map((f) => `- ${f.label}: ${sheet.inputs[f.key] || '—'}`),
      '',
      ...(result ? ['## Results', `- NPV: ${money(result.npv, cur)}`, `- Payback: ${result.paybackYears != null ? `${result.paybackYears.toFixed(1)} years` : 'not within horizon'}`, `- Gross margin: ${result.grossMarginPct?.toFixed(1) ?? '—'} %`, '', '| Year | Units | Revenue | Cash | Cumulative |', '|---|---|---|---|---|', ...result.rows.map((r) => `| ${r.year} | ${Math.round(r.units)} | ${Math.round(r.revenue)} | ${Math.round(r.cash)} | ${Math.round(r.cumulative)} |`)] : ['Results: inputs incomplete.']),
    ];
    download(`teal-business-case-${stamp()}.md`, lines.join('\n'), 'text/markdown');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Market & Business Case"
        subtitle="Competitors you have recorded, market size with a source for every number, and a cash-flow business case with sensitivity."
        actions={
          <Button onClick={exportMd}>
            <Download className="size-4" aria-hidden /> Export Markdown
          </Button>
        }
      />
      <Notice tone="info">Nothing on this page is looked up or invented. Market figures without a source are flagged UNSOURCED; the business case is an ESTIMATE calculated only from your inputs. The worksheet is kept in this browser.</Notice>

      <Competitors />

      <Card title="Market sizing — TAM · SAM · SOM" icon={Target} description="Enter each figure with its source and year">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {(['tam', 'sam', 'som'] as const).map((k) => {
            const f = fig(k);
            return (
              <fieldset key={k} className="rounded-control border border-line p-3">
                <legend className="px-1 text-meta font-semibold">{k === 'tam' ? 'TAM — total market' : k === 'sam' ? 'SAM — serviceable' : 'SOM — obtainable'}</legend>
                <div className="grid gap-2">
                  <Input aria-label={`${k.toUpperCase()} value (${cur})`} inputMode="decimal" placeholder={`Value (${cur})`} value={sheet.market[k].value} onChange={(e) => setM(k, 'value', e.target.value)} />
                  <Input aria-label={`${k.toUpperCase()} source`} placeholder="Source (report, URL, internal study)" value={sheet.market[k].source} onChange={(e) => setM(k, 'source', e.target.value)} />
                  <Input aria-label={`${k.toUpperCase()} year`} placeholder="Year" value={sheet.market[k].year} onChange={(e) => setM(k, 'year', e.target.value)} />
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[0.07]">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${tamV && f.value != null ? Math.min(100, (f.value / tamV) * 100) : 0}%` }} />
                    </div>
                    {f.value != null && <Badge tone={f.source.trim() ? 'ok' : 'warn'}>{f.source.trim() ? 'Sourced' : 'UNSOURCED'}</Badge>}
                  </div>
                </div>
              </fieldset>
            );
          })}
        </div>
        {issues.length > 0 && (
          <ul className="mt-3 list-disc space-y-0.5 pl-5 text-meta text-warn" aria-label="Market checks">
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <Card title="Business case inputs" icon={Briefcase}>
          <div className="grid gap-3">
            <Field label="Currency" htmlFor="bc-cur" hint="Labels only — nothing is converted">
              <Select id="bc-cur" value={cur} onChange={(e) => setSheet((s) => ({ ...s, currency: e.target.value }))}>
                {['INR', 'USD', 'EUR', 'JPY'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            {FIELDS.map((f) => (
              <Field key={f.key} label={`${f.label}${REQUIRED.includes(f.key) ? ' *' : ''}`} htmlFor={`bc-${f.key}`} hint={f.hint}>
                <Input id={`bc-${f.key}`} inputMode="decimal" className="num" value={sheet.inputs[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)} />
              </Field>
            ))}
          </div>
        </Card>
        <div className="min-w-0 space-y-4">
          {!result ? (
            <EmptyState compact icon={Briefcase} title="Enter the required inputs" explain={`Still needed: ${missing.map((k) => FIELDS.find((f) => f.key === k)!.label.toLowerCase()).join(', ')}.`} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  ['NPV', money(result.npv, cur), result.npv < 0],
                  ['Payback', result.paybackYears != null ? `${result.paybackYears.toFixed(1)} yr` : 'beyond horizon', result.paybackYears == null],
                  ['Gross margin', result.grossMarginPct != null ? `${result.grossMarginPct.toFixed(1)} %` : '—', (result.grossMarginPct ?? 0) < 0],
                  ['Revenue (total)', money(result.totalRevenue, cur), false],
                ].map(([l, v, bad]) => (
                  <div key={l as string} className="surface rounded-card px-4 py-3">
                    <div className="text-meta text-ink-3">{l as string}</div>
                    <output className={clsx('num mt-1 block text-section font-semibold', bad && 'text-bad')} aria-label={l as string}>
                      {v as string}
                    </output>
                    <div className="text-micro text-ink-3">ESTIMATE</div>
                  </div>
                ))}
              </div>
              <Card title="Cash flow by year">
                <div className="scroll-thin overflow-x-auto" tabIndex={0}>
                  <Table head={['Year', 'Units', 'Revenue', 'Gross margin', 'Cash flow', 'Cumulative']} dense>
                    {result.rows.map((r) => (
                      <tr key={r.year} className="num border-t border-line/60">
                        <td>{r.year}</td>
                        <td>{Math.round(r.units).toLocaleString('en-IN')}</td>
                        <td>{money(r.revenue, cur)}</td>
                        <td>{money(r.gross, cur)}</td>
                        <td className={r.cash < 0 ? 'text-bad' : ''}>{money(r.cash, cur)}</td>
                        <td className={r.cumulative < 0 ? 'text-bad' : 'text-ok'}>{money(r.cumulative, cur)}</td>
                      </tr>
                    ))}
                  </Table>
                </div>
              </Card>
              <Card title="Sensitivity — NPV when each input moves ±10 %" description="Largest swing first">
                <ul className="space-y-2" aria-label="Sensitivity">
                  {sens.map((s) => {
                    const lo = s.low - result.npv;
                    const hi = s.high - result.npv;
                    const w = (v: number) => `${(Math.abs(v) / maxSwing) * 50}%`;
                    return (
                      <li key={s.key} className="grid grid-cols-[8rem_1fr] items-center gap-2 text-meta sm:grid-cols-[10rem_1fr_12rem]">
                        <span>{SENSITIVITY_LABEL[s.key]}</span>
                        <div className="relative h-4 rounded bg-ink/[0.05]" aria-hidden>
                          <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
                          {[lo, hi].map((d, i) => (
                            <span key={i} className={clsx('absolute inset-y-0.5 rounded-sm', d < 0 ? 'bg-bad/70' : 'bg-ok/70')} style={d < 0 ? { right: '50%', width: w(d) } : { left: '50%', width: w(d) }} />
                          ))}
                        </div>
                        <span className="num col-span-2 text-micro text-ink-3 sm:col-span-1">
                          −10 %: {money(s.low, cur)} · +10 %: {money(s.high, cur)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
