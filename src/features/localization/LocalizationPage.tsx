import { useMemo, useState } from 'react';
import { localizationPayback } from '../../calculations/cost';
import { Card, Field, Input, PageHeader, Stat } from '../../components/ui';
import { CalcValue } from '../../components/why';
import type { Localization } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { EntityListPage } from '../entities/EntityListPage';

/** LOCALIZATION ENGINE (spec §56): imported component → Indian alternative → LOCALIZE / PARTNER / BUY / DEVELOP / IMPORT. */
export default function LocalizationPage() {
  const items = useRecords<Localization>('localization');
  const [q, setQ] = useState({ qual: '', imp: '', loc: '', vol: '' });
  const by = useMemo(() => {
    const m: Record<string, number> = {};
    for (const i of items) m[i.classification] = (m[i.classification] ?? 0) + 1;
    return m;
  }, [items]);
  const saving = items.reduce((s, i) => s + (i.current_cost != null && i.localized_cost != null ? i.current_cost - i.localized_cost : 0), 0);
  const n = (v: string) => (v === '' ? null : Number(v));
  return (
    <div className="space-y-3">
      <PageHeader eyebrow="Localization" title="Localization engine" subtitle="Imported component → Indian alternative → supplier → current vs localized cost → lead time → technology gap → risk → validation. Generate candidates from any BOM (import items). Handbook: localize after qualification (Automation Part 52; Semiconductor Part XXXVIII)." />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
        {['LOCALIZE', 'PARTNER', 'BUY', 'DEVELOP', 'IMPORT', 'UNDECIDED'].map((k) => (
          <Stat key={k} label={k} value={by[k] ?? 0} />
        ))}
        <Stat label="Unit saving (where both costs known)" value={saving ? `₹ ${Math.round(saving).toLocaleString('en-IN')}` : '—'} />
      </div>
      <Card title="Localization payback (Handbook C9)">
        <div className="flex flex-wrap items-end gap-2">
          {(
            [
              ['qual', 'Qualification cost'],
              ['imp', 'Imported landed cost / unit'],
              ['loc', 'Localized cost / unit'],
              ['vol', 'Units per year'],
            ] as const
          ).map(([k, l]) => (
            <Field key={k} label={l} htmlFor={`lp-${k}`}>
              <Input id={`lp-${k}`} type="number" value={q[k]} onChange={(e) => setQ({ ...q, [k]: e.target.value })} className="w-40" />
            </Field>
          ))}
          <div className="pb-1.5">
            Payback: <CalcValue c={localizationPayback({ qualification_cost: n(q.qual), import_cost: n(q.imp), local_cost: n(q.loc), annual_volume: n(q.vol) })} />
          </div>
        </div>
      </Card>
      <EntityListPage entity="localization" title="Localization items" />
    </div>
  );
}
