import { FlaskConical, Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, buttonClass, Card, Table } from '../../components/ui';
import type { EquipmentTemplate } from '../../domain/engineering';
import { productTypeLabel } from '../../domain/engineering';
import type { Rec } from '../../hooks/useData';
import { FlowDiagram } from '../studio/tabs/ArchitectureTab';

/** Equipment template record: structure and component slots — no times (§60, §61). */
export default function TemplateView({ record }: { record: Rec }) {
  const t = record as unknown as EquipmentTemplate & Rec;
  return (
    <div className="space-y-4">
      <Card
        title="Structure"
        icon={Network}
        description={`${t.group} · ${t.application}${t.process ? ` · ${t.process}` : ''}`}
        actions={
          <Link to={`/studio?new=1&template=${encodeURIComponent(t.id)}`} className={buttonClass('primary', 'sm')}>
            <FlaskConical className="size-3.5" aria-hidden /> New scenario from this template
          </Link>
        }
      >
        <FlowDiagram stations={t.stations} times={t.stations.map(() => null)} />
        <p className="mt-2 text-micro text-ink-3">Times are empty on purpose: a scenario asks for measured, calculated or assumed values, each with its basis.</p>
      </Card>
      <Card title="Stations and component slots">
        <Table head={['#', 'Station', 'Kind', 'Function', 'Component slots']} dense>
          {t.stations.map((s, i) => (
            <tr key={s.key}>
              <td className="num">{i + 1}</td>
              <td className="font-medium">{s.name}</td>
              <td>{s.kind}</td>
              <td className="text-micro">{s.function ?? '—'}</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {(s.slots ?? []).map((sl) => (
                    <Badge key={sl.role} tone={sl.required ? 'accent' : 'neutral'}>
                      {sl.role} · {productTypeLabel(sl.product_type)}
                    </Badge>
                  ))}
                  {!(s.slots ?? []).length && <span className="text-micro text-ink-3">—</span>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
