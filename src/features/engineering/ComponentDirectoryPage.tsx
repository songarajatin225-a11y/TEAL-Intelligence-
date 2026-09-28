import { Boxes, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge, Button, Card, Drawer, Field, Input, PageHeader, Select, Stat, Table, Unknown } from '../../components/ui';
import { Link } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { useData } from '../../hooks/useData';
import { allComponentSheets, type ComponentSheet, type ComponentSource } from '../../services/eng/componentDetail';
import { useCustomerMode } from '../studio/shared';
import { SheetBody } from './ComponentSheet';

const SOURCES: ComponentSource[] = ['Item master', 'Engineering database', 'Laser source class', 'F-theta objective', 'Automation module'];

function toCsv(rows: ComponentSheet[]) {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['id', 'name', 'source', 'type', 'category', 'specifications', 'missing_key_specs', 'completeness_pct', 'vendor', 'supplier_country', 'supplier_lead_time', 'lead_time', 'price_basis', 'data_type'];
  const f = (s: ComponentSheet, k: string) => s.commercial.find(([n]) => n === k)?.[1] ?? '';
  const sf = (s: ComponentSheet, k: string) => s.supplier.fields.find(([n]) => n === k)?.[1] ?? '';
  return [head.join(','), ...rows.map((s) => [s.id, s.name, s.source, s.typeLabel, s.category, s.specs.map((x) => x.original).join('; '), s.missing.join('; '), s.completeness ?? '', s.vendor ?? '', sf(s, 'Country'), sf(s, 'Typical lead time'), f(s, 'Lead time'), f(s, 'Price basis'), s.dataType ?? ''].map(q).join(','))].join('\n');
}

/** Every component the platform holds — one technical + supplier datasheet each (no value added that a record does not state). */
export default function ComponentDirectoryPage() {
  const { records, byId } = useData();
  const customer = useCustomerMode();
  const sheets = useMemo(() => allComponentSheets(records, byId), [records, byId]);
  const [q, setQ] = useState('');
  const [src, setSrc] = useState<string>('');
  const [gap, setGap] = useState<'' | 'tech' | 'supplier'>('');
  const [open, setOpen] = useState<ComponentSheet | null>(null);
  const rows = sheets.filter((s) => (!src || s.source === src) && (!q || `${s.name} ${s.typeLabel} ${s.vendor ?? ''} ${s.specs.map((x) => x.original).join(' ')}`.toLowerCase().includes(q.toLowerCase())) && (gap !== 'tech' || s.missing.length > 0) && (gap !== 'supplier' || !s.supplier.supplier));
  const withSupplier = sheets.filter((s) => s.supplier.supplier).length;
  const fullTech = sheets.filter((s) => s.completeness === 100).length;
  const totalSpecs = sheets.reduce((n, s) => n + s.specs.length, 0);
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([toCsv(rows)], { type: 'text/csv' }));
    a.download = 'teal-component-datasheets.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Engineering"
        title="Component Datasheets"
        subtitle="Technical specification and supplier details for every component in the platform — item master, engineering database, laser source classes, optics and automation modules. Values are only what a record states; the rest is shown as Not Available."
        actions={
          <Button onClick={download}>
            Export CSV
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Components" value={sheets.length} sub={`${SOURCES.filter((s) => sheets.some((x) => x.source === s)).length} sources`} />
        <Stat label="Stated specification values" value={totalSpecs} sub="each with the text it came from" />
        <Stat label="Key specs complete" value={fullTech} sub={`of ${sheets.filter((s) => s.completeness != null).length} with a key-spec list`} />
        <Stat label="Linked to a supplier record" value={withSupplier} sub={`${sheets.length - withSupplier} not linked`} tone={withSupplier < sheets.length ? 'warn' : 'ok'} />
      </div>
      <Card title="Directory" icon={Boxes}>
        <div className="mb-3 flex flex-wrap items-end gap-2">
          <Field label="Search" htmlFor="cd-q">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <Input id="cd-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="galvo, 1064nm, Keyence…" className="w-64 pl-8" />
            </div>
          </Field>
          <Field label="Source" htmlFor="cd-s">
            <Select id="cd-s" value={src} onChange={(e) => setSrc(e.target.value)}>
              <option value="">All sources</option>
              {SOURCES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Field label="Show" htmlFor="cd-g">
            <Select id="cd-g" value={gap} onChange={(e) => setGap(e.target.value as typeof gap)}>
              <option value="">All components</option>
              <option value="tech">Missing key specifications</option>
              <option value="supplier">No supplier record</option>
            </Select>
          </Field>
          <span className="ml-auto text-meta text-ink-3">{rows.length} shown</span>
        </div>
        <Table head={['Component', 'Type', 'Source', 'Key specifications', 'Technical', ...(customer ? [] : ['Vendor', 'Lead time']), '']} dense>
          {rows.map((s) => {
            const lead = s.commercial.find(([k]) => k === 'Lead time')?.[1] ?? s.supplier.fields.find(([k]) => k === 'Typical lead time')?.[1];
            return (
              <tr key={s.id}>
                <td>
                  <Link to={recordPath(s.id)} className="font-medium text-accent-2 hover:underline">
                    {s.name}
                  </Link>
                  {s.dataType === 'DEMO' && (
                    <Badge tone="warn" className="ml-1.5">
                      DEMO
                    </Badge>
                  )}
                </td>
                <td>{s.typeLabel}</td>
                <td className="text-micro text-ink-3">{s.source}</td>
                <td className="max-w-md text-micro">{s.specs.length ? s.specs.slice(0, 4).map((x) => x.original).join(' · ') + (s.specs.length > 4 ? ` · +${s.specs.length - 4}` : '') : <Unknown label="Not Available" />}</td>
                <td>{s.completeness == null ? <span className="text-micro text-ink-3">{s.specs.length} stated</span> : <Badge tone={s.completeness === 100 ? 'ok' : s.completeness >= 50 ? 'info' : 'warn'}>{s.completeness}%</Badge>}</td>
                {!customer && <td className="text-micro">{s.vendor ? <>{s.vendor}{!s.supplier.supplier && <span className="text-warn"> · no record</span>}</> : <Unknown />}</td>}
                {!customer && <td className="num text-micro">{lead ?? <Unknown />}</td>}
                <td>
                  <Button size="sm" onClick={() => setOpen(s)} aria-label={`Datasheet: ${s.name}`}>
                    Datasheet
                  </Button>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ''} subtitle={open ? `${open.typeLabel} · ${open.source}` : undefined} wide>
        {open && <SheetBody sheet={open} compact />}
      </Drawer>
    </div>
  );
}
