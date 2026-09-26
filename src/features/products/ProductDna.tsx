import { Link } from 'react-router-dom';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Button, Card, Chain, KV, Table, Unknown } from '../../components/ui';
import { MATURITY_STAGES, type Product } from '../../domain/entities';
import { useData, useEngine, type Rec } from '../../hooks/useData';

const inr = (v: number | null | undefined) => (v == null ? null : `₹ ${Math.round(v).toLocaleString('en-IN')}`);

/** PRODUCT DNA (spec §30): every field linked to the thread; UNKNOWN where no record exists. */
export default function ProductDna({ record }: { record: Rec }) {
  const p = record as unknown as Product & Rec;
  const { records } = useData();
  const e = useEngine();
  const by = (entity: string, field = 'product_id') => records.filter((r) => r.entity === entity && (r as Record<string, unknown>)[field] === p.id);
  const list = (rs: Rec[]) => (rs.length ? <span className="flex flex-wrap gap-x-2">{rs.slice(0, 8).map((r) => <RecordLink key={r.id} id={r.id} />)}{rs.length > 8 && <span className="text-ink-3">+{rs.length - 8}</span>}</span> : <Unknown label="none recorded" />);
  const std = p.standard_content.map((k) => e?.modules.get(k)?.name ?? k);
  const stageIdx = p.maturity ? MATURITY_STAGES.indexOf(p.maturity) : -1;
  return (
    <div className="space-y-3">
      <Card title="Development stage" description={p.maturity ? `Currently ${p.maturity}` : 'Maturity not recorded for this platform'}>
        <Chain label="Product development stages" steps={MATURITY_STAGES.map((m, i) => ({ label: m, state: i < stageIdx ? 'done' : i === stageIdx ? 'current' : 'todo' }))} />
      </Card>
      <Card
        title="Product DNA"
        actions={
          <Link to={`/configurator?product=${p.key}`}>
            <Button size="sm" variant="primary">
              Configure
            </Button>
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <KV
            items={[
              ['Family', <RecordLink key="f" id={p.family_id} />],
              ['Code / version', `${p.code} · ${p.version ?? 'v1 (catalogue 2026)'}`],
              ['Market / industries', p.industries.map((i) => <RecordLink key={i} id={i} />)],
              ['Customer segment', <Unknown key="cs" />],
              ['Architecture', `${p.delivery} beam delivery`],
              ['Sources', p.source_keys.map((k) => e?.sources.get(k)?.name ?? k).join(', ')],
              ['Power classes', `${p.powers_w.join(', ')} W${p.powers_by_source ? ' (per source)' : ''}`],
              ['Objectives', p.lens_keys.map((k) => e?.lenses.get(k)?.short_code ?? k).join(', ')],
              ['Standard modules', std.length ? std.join(', ') : 'none'],
              ['Maturity', p.maturity ?? <Unknown />],
            ]}
          />
          <KV
            items={[
              ['Base price (ESTIMATE)', inr(p.base_price_inr) ?? <Unknown />],
              ['Cost', list(by('cost_model'))],
              ['Margin', <Unknown key="m" label="UNKNOWN — needs a cost model" />],
              ['BOM', list(by('bom'))],
              ['Configurations', list(by('configuration'))],
              ['Requirements', list(by('requirement'))],
              ['POCs', list(by('poc'))],
              ['Risks', list(by('risk'))],
              ['Projects', list(by('project'))],
              ['Machines in field', list(by('machine'))],
              ['Lessons', list(by('lesson'))],
              ['Lead time / warranty / install', `${p.lead_time_weeks ?? '—'} wk · ${p.warranty_months ?? '—'} mo · ${p.install_weeks ?? '—'} wk`],
            ]}
          />
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Card title="Specifications (catalogue)">
          <Table head={['Parameter', 'Value']} dense>
            {p.specs.map((s) => (
              <tr key={s.label}>
                <td className="text-ink-3">{s.label}</td>
                <td>{s.value}</td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Applications">
          <ul className="space-y-1.5">
            {p.applications.map((a) => (
              <li key={a.key}>
                <Link className="font-medium text-accent-2 hover:underline" to={`/record/app-${p.key}.${a.key}`}>
                  {a.name}
                </Link>{' '}
                <Badge>{a.source_key}</Badge> <span className="num text-micro text-ink-3">{a.power_w} W</span>
                <div className="text-meta text-ink-2">{a.rationale}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
