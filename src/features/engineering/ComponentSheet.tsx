import type { ReactNode } from 'react';
import { Building2, Cpu, FileText, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { Badge, Card, KV, Notice, Table, Unknown } from '../../components/ui';
import type { Rec } from '../../hooks/useData';
import { useData } from '../../hooks/useData';
import { sheetFor, type ComponentSheet as Sheet } from '../../services/eng/componentDetail';
import { displaySpec } from '../../services/eng/specs';
import { useCustomerMode, useEngineering } from '../studio/shared';

const COMMERCIAL_HIDDEN_FOR_CUSTOMER = new Set(['Price', 'Price basis', 'Price date', 'Configurator price factor', 'Price estimate']);

/** Technical + supplier datasheet, shared by record pages, the component directory and the 3D twin. */
export function SheetBody({ sheet, compact }: { sheet: Sheet; compact?: boolean }) {
  const eng = useEngineering();
  const customer = useCustomerMode();
  const label = (k: string) => eng.defs.get(k)?.name ?? k.replace(/_/g, ' ');
  const src = (id?: string) => (id ? eng.byId.get(id)?.name ?? id : 'Not recorded');
  const val = (v: string | null) => (v == null || v === '' ? <Unknown /> : v);
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <Card title="Technical specification" icon={Cpu} description={sheet.completeness != null ? `${sheet.completeness}% of the key specifications for a ${sheet.typeLabel.toLowerCase()} are stated` : 'Every stated value, with the text it came from'}>
        {sheet.specs.length ? (
          <Table head={compact ? ['Parameter', 'Value', 'Stated as'] : ['Parameter', 'Value', 'Stated as', 'Source', 'Evidence']} dense>
            {sheet.specs.map((s, i) => (
              <tr key={`${s.spec}-${i}`}>
                <td className="font-medium">{'label' in s && (s as { label?: string }).label ? (s as { label?: string }).label : label(s.spec)}</td>
                <td className="num">{displaySpec({ entry: s, value: s.value ?? null, min: s.min ?? null, max: s.max ?? null, unit: s.unit ?? '', text: s.text ?? null, original: s.original ?? '—' } as never)}</td>
                <td className="font-mono text-micro text-ink-3">{s.original ?? '—'}</td>
                {!compact && <td className="text-micro">{src(s.source_id)}</td>}
                {!compact && <td className="text-micro text-ink-3">{s.evidence ?? '—'}</td>}
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-meta text-ink-3">No technical values are recorded for this component.</p>
        )}
        {sheet.missing.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-micro font-semibold uppercase tracking-wider text-ink-3">Not Available — key specifications not yet stated</div>
            <div className="flex flex-wrap gap-1.5">
              {sheet.missing.map((k) => (
                <Badge key={k} tone="warn">
                  {label(k)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>
      {!customer && (
        <div className={compact ? 'space-y-3' : 'grid grid-cols-1 gap-4 xl:grid-cols-2'}>
          <Card title="Supplier" icon={Truck} description={sheet.vendor ? undefined : 'No vendor or manufacturer recorded'}>
            <KV
              items={[

                ['Vendor', sheet.supplier.supplier ? <Link key="v" to={recordPath(sheet.supplier.supplier.id)} className="text-accent-2 hover:underline">{sheet.supplier.supplier.name}</Link> : val(sheet.vendor)],
                ['Company record', sheet.supplier.company ? <Link key="c" to={recordPath(sheet.supplier.company.id)} className="text-accent-2 hover:underline">{sheet.supplier.company.name}</Link> : <Unknown key="c" label="Not linked" />],
                ...sheet.supplier.fields.map(([k, v]) => [k, val(v)] as [string, ReactNode]),
              ]}
            />
            {sheet.supplier.notes.map((n) => (
              <Notice key={n} tone="warn">
                {n}
              </Notice>
            ))}
          </Card>
          <Card title="Commercial" icon={Building2}>
            <KV items={sheet.commercial.filter(([k]) => !(customer && COMMERCIAL_HIDDEN_FOR_CUSTOMER.has(k))).map(([k, v]) => [k, val(v)])} />
          </Card>
        </div>
      )}
      {sheet.basisNote && (
        <p className="flex items-start gap-1.5 text-micro text-ink-3">
          <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {sheet.basisNote}
        </p>
      )}
    </div>
  );
}

/** Record-page main view for item-master components, laser-source classes, optics and modules. */
export default function ComponentSheetView({ record }: { record: Rec }) {
  const { records, byId } = useData();
  const sheet = sheetFor(record.id, records, byId);
  if (!sheet) return null;
  return <SheetBody sheet={sheet} />;
}
