import clsx from 'clsx';
import { ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTypeBadge } from '../../components/badges';
import { recordPath } from '../../components/RecordLink';
import { Badge, Card, EmptyState, Notice, PageHeader, Stat, Table } from '../../components/ui';
import type { ItemMaster, Supplier } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { normaliseName } from '../../services/duplicates';

const RISKS = ['High', 'Medium', 'Low', 'Unknown'] as const;
const BANDS = [
  { key: 'none', label: 'No items', test: (n: number) => n === 0 },
  { key: 'low', label: '1–3 items', test: (n: number) => n >= 1 && n <= 3 },
  { key: 'mid', label: '4–7 items', test: (n: number) => n >= 4 && n <= 7 },
  { key: 'high', label: '8+ items', test: (n: number) => n >= 8 },
] as const;
const CELL_TONE: Record<string, string> = {
  'High:high': 'bg-bad/20',
  'High:mid': 'bg-bad/15',
  'Medium:high': 'bg-bad/12',
  'High:low': 'bg-warn/15',
  'Medium:mid': 'bg-warn/15',
  'Low:high': 'bg-warn/10',
  'Medium:low': 'bg-warn/8',
};

interface Row {
  s: Supplier & { __origin?: string };
  items: number;
  longLead: number;
  imports: number;
  singleSource: number;
  maxLead: number | null;
}

/**
 * SUPPLIER RISK MATRIX (ultimate spec §24). Assessed risk (as recorded on the supplier — never
 * guessed) × exposure (component-master items that name the supplier as vendor). Long-lead,
 * import and single-source counts come from the component master. Unassessed suppliers stay in
 * the "Unknown" row so the gap is visible.
 */
export default function SupplierRiskPage() {
  const suppliers = useRecords<Supplier>('supplier');
  const items = useRecords<ItemMaster>('component');
  const [cell, setCell] = useState<string | null>(null);

  const rows = useMemo<Row[]>(() => {
    const byCategory = new Map<string, Set<string>>();
    for (const i of items) if (i.vendor && i.category) (byCategory.get(i.category) ?? byCategory.set(i.category, new Set()).get(i.category)!).add(normaliseName(i.vendor));
    return suppliers.map((s) => {
      const n = normaliseName(s.name);
      const mine = items.filter((i) => i.vendor && normaliseName(i.vendor) === n);
      const leads = mine.map((i) => i.lead_time_weeks).filter((x): x is number => typeof x === 'number');
      return {
        s,
        items: mine.length,
        longLead: mine.filter((i) => (i.lead_time_weeks ?? 0) >= 8).length,
        imports: mine.filter((i) => /import/i.test(String(i.item_class ?? ''))).length,
        singleSource: mine.filter((i) => i.category && byCategory.get(i.category)?.size === 1).length,
        maxLead: leads.length ? Math.max(...leads) : null,
      };
    });
  }, [suppliers, items]);

  const riskOf = (r: Row) => r.s.supplier_risk ?? 'Unknown';
  const bandOf = (r: Row) => BANDS.find((b) => b.test(r.items))!.key;
  const inCell = (risk: string, band: string) => rows.filter((r) => riskOf(r) === risk && bandOf(r) === band);
  const listed = cell ? rows.filter((r) => `${riskOf(r)}:${bandOf(r)}` === cell) : rows;
  const unassessed = rows.filter((r) => riskOf(r) === 'Unknown').length;

  if (!suppliers.length) return <EmptyState title="No suppliers yet" explain="Create supplier records to see the risk matrix." />;
  return (
    <div className="space-y-5">
      <PageHeader title="Supplier Risk" subtitle="Recorded supplier risk against how much of the component master depends on each supplier. Click a cell to filter." />
      {unassessed > 0 && <Notice tone="warn">{unassessed} of {rows.length} suppliers have no risk assessment (UNKNOWN). Record supplier risk on the supplier with evidence — the OS never assigns it.</Notice>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Suppliers" value={rows.length} to="/suppliers" />
        <Stat label="Risk not assessed" value={unassessed} tone={unassessed ? 'warn' : undefined} />
        <Stat label="Long-lead items (≥ 8 wk)" value={rows.reduce((s, r) => s + r.longLead, 0)} />
        <Stat label="Single-source items" value={rows.reduce((s, r) => s + r.singleSource, 0)} sub="only vendor in their category" />
      </div>

      <Card title="Risk × exposure" icon={ShieldAlert} description="Rows: recorded risk · Columns: component-master items naming the supplier as vendor">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[34rem] table-fixed border-separate border-spacing-1.5 text-body">
            <thead>
              <tr>
                <th scope="col" className="w-24 text-left text-meta font-medium text-ink-3">
                  Risk
                </th>
                {BANDS.map((b) => (
                  <th key={b.key} scope="col" className="text-left text-meta font-medium text-ink-3">
                    {b.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RISKS.map((risk) => (
                <tr key={risk}>
                  <th scope="row" className="text-left text-meta font-semibold">
                    {risk}
                  </th>
                  {BANDS.map((b) => {
                    const key = `${risk}:${b.key}`;
                    const list = inCell(risk, b.key);
                    return (
                      <td key={b.key} className="p-0">
                        <button
                          type="button"
                          disabled={!list.length}
                          aria-pressed={cell === key}
                          aria-label={`${risk} risk, ${b.label}: ${list.length} supplier(s)`}
                          onClick={() => setCell(cell === key ? null : key)}
                          className={clsx('flex h-16 w-full min-w-0 flex-col items-start justify-between rounded-control border px-2.5 py-1.5 text-left transition-colors', CELL_TONE[key] ?? (risk === 'Unknown' ? 'bg-ink/[0.04]' : 'bg-ok/8'), cell === key ? 'border-accent ring-2 ring-accent/40' : 'border-line', list.length ? 'hover:border-accent' : 'opacity-60')}
                        >
                          <span className="num text-section font-semibold">{list.length}</span>
                          <span className="w-full truncate text-micro text-ink-3">{list.map((r) => r.s.name).join(', ')}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={cell ? `Suppliers in ${cell.replace(':', ' risk · ').replace('none', 'no items').replace('low', '1–3 items').replace('mid', '4–7 items').replace('high', '8+ items')}` : 'All suppliers'} actions={cell ? <button type="button" className="text-meta text-accent-2 hover:underline" onClick={() => setCell(null)}>Clear filter</button> : undefined}>
        <Table head={['Supplier', 'Category', 'Country', 'Risk', 'Items', 'Long-lead', 'Import', 'Single-source', 'Max lead', 'Data']} dense>
          {listed.map((r) => (
            <tr key={r.s.id} className="border-t border-line/60">
              <td>
                <Link to={recordPath(r.s.id)} className="font-medium text-accent-2 hover:underline">
                  {r.s.name}
                </Link>
              </td>
              <td>{r.s.category ?? '—'}</td>
              <td>{r.s.country ?? '—'}</td>
              <td>
                <Badge tone={riskOf(r) === 'High' ? 'bad' : riskOf(r) === 'Medium' ? 'warn' : riskOf(r) === 'Low' ? 'ok' : 'neutral'}>{riskOf(r)}</Badge>
              </td>
              <td className="num">{r.items}</td>
              <td className="num">{r.longLead}</td>
              <td className="num">{r.imports}</td>
              <td className="num">{r.singleSource}</td>
              <td className="num">{r.maxLead != null ? `${r.maxLead} wk` : '—'}</td>
              <td>
                <DataTypeBadge t={r.s.data_type} />
              </td>
            </tr>
          ))}
        </Table>
        <p className="mt-2 text-micro text-ink-3">Component prices, vendors and lead times in the component master are DEMO seed values from the legacy cost platform — exposure is indicative until real sourcing data is recorded.</p>
      </Card>
    </div>
  );
}
