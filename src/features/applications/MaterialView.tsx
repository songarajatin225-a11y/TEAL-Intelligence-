import { Link } from 'react-router-dom';
import { Badge, Card, Notice, Table, Unknown } from '../../components/ui';
import { ABSORPTION_BANDS, type Material } from '../../domain/entities';
import { useRecords, type Rec } from '../../hooks/useData';

const BAND_LABEL: Record<string, string> = { uv: 'UV (<400 nm)', blue: 'Blue (400–500)', green: 'Green (500–600)', ir: 'NIR (0.6–3 µm)', co2: 'CO₂ (9–11 µm)' };

export default function MaterialView({ record }: { record: Rec }) {
  const m = record as unknown as Material & Rec;
  const apps = useRecords('application').filter((a) => ((a as { material_ids?: string[] }).material_ids ?? []).includes(m.id));
  const q = (x: Material['density']) => (x?.value == null ? <Unknown /> : `${x.value} ${x.unit}`);
  return (
    <Card title="Material properties">
      {m.provenance.confidence === 'LOW' && <Notice tone="warn">Confidence LOW: primary reference not recorded. Verify before design use.</Notice>}
      <div className="mt-2 grid gap-3 lg:grid-cols-2">
        <Table head={['Property', 'Value']} dense>
          <tr>
            <td>Thermal conductivity</td>
            <td className="num">{q(m.thermal_conductivity)}</td>
          </tr>
          <tr>
            <td>Melting point</td>
            <td className="num">{q(m.melting_point)}</td>
          </tr>
          <tr>
            <td>Density</td>
            <td className="num">{q(m.density)}</td>
          </tr>
          <tr>
            <td>Specific heat</td>
            <td className="num">{q(m.specific_heat)}</td>
          </tr>
        </Table>
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase text-ink-3">Indicative absorptance (clean, flat surface)</div>
          {m.absorption ? (
            <ul className="space-y-1">
              {ABSORPTION_BANDS.map((b) => {
                const v = m.absorption?.[b];
                return (
                  <li key={b} className="grid grid-cols-[120px_1fr_40px] items-center gap-2">
                    <span className="text-[12px]">{BAND_LABEL[b]}</span>
                    <div className="h-2 rounded bg-panel-2">{v != null && <div className="h-2 rounded bg-accent" style={{ width: `${v * 100}%` }} />}</div>
                    <span className="num text-[12px]">{v ?? '—'}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Unknown label="Absorption UNKNOWN" />
          )}
        </div>
      </div>
      <div className="mt-3">
        <span className="text-[11px] font-semibold uppercase text-ink-3">Applications on this material</span>{' '}
        {apps.length ? (
          apps.map((a) => (
            <Link key={a.id} to={`/record/${encodeURIComponent(a.id)}`} className="mr-2 text-accent-2 hover:underline">
              {a.name}
            </Link>
          ))
        ) : (
          <Badge>none</Badge>
        )}
        <Link className="ml-2 text-[12px] text-accent-2" to={`/process?material=${m.id}`}>
          Process candidates →
        </Link>
      </div>
    </Card>
  );
}
