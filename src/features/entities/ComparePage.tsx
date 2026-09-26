import clsx from 'clsx';
import { Columns2, Plus, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DataTypeBadge, StatusBadge, VerificationBadge } from '../../components/badges';
import { fieldLabel, renderValue } from '../../components/fieldValue';
import { HealthBadge } from '../../components/Health';
import { recordPath } from '../../components/RecordLink';
import { Button, Card, EmptyState, IconButton, Input, PageHeader, Select } from '../../components/ui';
import { ENTITY_BY_TYPE, ENTITY_DEFS } from '../../domain/registry';
import { useData } from '../../hooks/useData';
import { entityHealth } from '../../services/health';
import { todayIso } from '../../utils/dates';

const MAX = 4;
const SKIP = new Set(['id', 'entity', 'name', 'provenance', 'links', '__origin', '__dataset', 'version', 'created_at']);
const STATUS_KEYS = ['status', 'stage', 'poc_status', 'risk_status', 'rfq_status', 'ticket_status', 'cr_status', 'maturity'];
const COMPARABLE = ['product', 'configuration', 'supplier', 'laser_source', 'optic', 'module', 'material', 'component', 'cost_model', 'bom', 'poc', 'opportunity', 'project', 'customer', 'company', 'technology', 'application', 'machine', 'risk', 'lesson'];

const same = (vals: unknown[]) => new Set(vals.map((v) => JSON.stringify(v ?? null))).size <= 1;

/**
 * COMPARE (ultimate spec §100): up to four records of one type side by side — every stored field,
 * differences highlighted, trust and health on top. Values are shown exactly as stored: UNKNOWN
 * stays UNKNOWN, nothing is filled in to make the comparison look complete.
 */
export default function ComparePage() {
  const { byId, records, graph } = useData();
  const [params, setParams] = useSearchParams();
  const ids = (params.get('ids') ?? '').split(',').map(decodeURIComponent).filter((i) => byId.has(i)).slice(0, MAX);
  const recs = ids.map((i) => byId.get(i)!);
  const entity = recs[0]?.entity ?? params.get('entity') ?? '';
  const [q, setQ] = useState('');
  const [onlyDiff, setOnlyDiff] = useState(false);
  const setIds = (next: string[]) =>
    setParams((p) => {
      if (next.length) p.set('ids', next.map(encodeURIComponent).join(','));
      else p.delete('ids');
      return p;
    });
  const setEntity = (e: string) => setParams({ entity: e });

  const candidates = useMemo(() => {
    if (!entity) return [];
    const t = q.trim().toLowerCase();
    return records.filter((r) => r.entity === entity && !ids.includes(r.id) && (!t || r.name.toLowerCase().includes(t))).slice(0, 8);
  }, [records, entity, ids, q]);

  const today = todayIso();
  const rows = useMemo(() => {
    const keys = [...new Set(recs.flatMap((r) => Object.keys(r)))].filter((k) => !SKIP.has(k) && !STATUS_KEYS.includes(k));
    return keys.map((k) => ({ key: k, values: recs.map((r) => (r as Record<string, unknown>)[k]) }));
  }, [recs]);
  const shown = onlyDiff && recs.length > 1 ? rows.filter((r) => !same(r.values)) : rows;
  const def = ENTITY_BY_TYPE[entity];

  const head: { label: string; cells: ReactNode[]; diff?: boolean }[] = recs.length
    ? [
        { label: 'Status', cells: recs.map((r) => <StatusBadge key={r.id} s={STATUS_KEYS.map((k) => (r as Record<string, unknown>)[k]).find((v) => typeof v === 'string') as string | undefined} />) },
        { label: 'Health', cells: recs.map((r) => <HealthBadge key={r.id} health={entityHealth(r, graph, today)} />) },
        { label: 'Data', cells: recs.map((r) => <DataTypeBadge key={r.id} t={r.data_type} />) },
        { label: 'Verification', cells: recs.map((r) => <VerificationBadge key={r.id} v={r.provenance?.verification_status} />) },
      ]
    : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Compare"
        subtitle="Put up to four records of the same type side by side. Differences are highlighted; unknown values stay unknown."
        actions={
          recs.length > 1 ? (
            <Button onClick={() => setOnlyDiff((v) => !v)} aria-pressed={onlyDiff}>
              {onlyDiff ? 'Show all fields' : 'Only differences'}
            </Button>
          ) : undefined
        }
      />

      <Card title="Records" icon={Columns2} description={def ? `${def.plural} · ${recs.length} of ${MAX}` : 'Choose what to compare'}>
        <div className="flex flex-wrap items-end gap-3">
          {!recs.length && (
            <label className="flex flex-col gap-1 text-meta font-medium text-ink-2">
              Type
              <Select value={entity} onChange={(e) => setEntity(e.target.value)} className="w-56">
                <option value="">Choose a type…</option>
                {COMPARABLE.map((e) => (
                  <option key={e} value={e}>
                    {ENTITY_DEFS.find((d) => d.entity === e)?.plural ?? e}
                  </option>
                ))}
              </Select>
            </label>
          )}
          {entity && recs.length < MAX && (
            <label className="flex min-w-[14rem] flex-1 flex-col gap-1 text-meta font-medium text-ink-2">
              Add a {def?.label.toLowerCase() ?? 'record'}
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${def?.plural.toLowerCase() ?? 'records'} by name…`} />
            </label>
          )}
        </div>
        {entity && recs.length < MAX && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Candidates">
            {candidates.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setIds([...ids, c.id])} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-2.5 py-1 text-meta hover:border-accent hover:text-accent-2">
                  <Plus className="size-3.5" aria-hidden /> {c.name}
                </button>
              </li>
            ))}
            {!candidates.length && <li className="text-meta text-ink-3">No more {def?.plural.toLowerCase() ?? 'records'} match.</li>}
          </ul>
        )}
      </Card>

      {recs.length === 0 ? (
        <EmptyState title="Nothing to compare yet" explain="Choose a type and add two or more records, or use “Compare with…” from any record’s More menu." icon={Columns2} compact />
      ) : (
        <div className="surface scroll-thin overflow-x-auto rounded-card">
          <table className="w-full min-w-[40rem] border-collapse text-body">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="sticky left-0 z-10 w-48 bg-solid/90 px-3 py-2.5 text-left text-meta font-semibold text-ink-3">
                  Field
                </th>
                {recs.map((r) => (
                  <th key={r.id} scope="col" className="px-3 py-2.5 text-left align-top">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={recordPath(r.id)} className="font-semibold text-accent-2 hover:underline">
                        {r.name}
                      </Link>
                      <IconButton size="sm" label={`Remove ${r.name}`} icon={X} onClick={() => setIds(ids.filter((i) => i !== r.id))} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {head.map((h) => (
                <tr key={h.label} className="border-b border-line/60">
                  <th scope="row" className="sticky left-0 bg-solid/90 px-3 py-2 text-left text-meta font-medium text-ink-2">
                    {h.label}
                  </th>
                  {h.cells.map((c, i) => (
                    <td key={i} className="px-3 py-2">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
              {shown.map((row) => {
                const differs = recs.length > 1 && !same(row.values);
                return (
                  <tr key={row.key} className={clsx('border-b border-line/60 align-top', differs && 'bg-accent-soft/35')}>
                    <th scope="row" className="sticky left-0 bg-solid/90 px-3 py-2 text-left text-meta font-medium text-ink-2">
                      {fieldLabel(row.key)}
                      {differs && <span className="sr-only"> (differs)</span>}
                    </th>
                    {row.values.map((v, i) => (
                      <td key={i} className="max-w-[22rem] break-words px-3 py-2">
                        {v !== null && typeof v === 'object' && !Array.isArray(v) && !('unit' in v) && !('value' in v) ? <code className="text-micro text-ink-3">{JSON.stringify(v).slice(0, 160)}</code> : Array.isArray(v) && v.some((x) => typeof x === 'object') ? <span className="text-meta text-ink-3">{v.length} entries</span> : renderValue(v)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
