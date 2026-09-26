import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { depthOfFocus, spotDiameter } from '../../calculations/laser';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Button, Card, Input, KV, Notice, Select, Unknown } from '../../components/ui';
import { CalcValue } from '../../components/why';
import { POC_DECISIONS, POC_STATUSES, type Doe, type LaserSource, type Optic, type Poc } from '../../domain/entities';
import { useData, type Rec } from '../../hooks/useData';
import { newLocalId, repo } from '../../repositories';
import { generateRuns } from '../doe/DoeView';

/** POC ENGINE (spec §35): requirement → objective → sample → laser → optics → parameters → DOE → measurement → result → window → decision. */
export default function PocView({ record }: { record: Rec }) {
  const saved = record as unknown as Poc & Rec;
  const [p, setP] = useState<Poc>(saved);
  const [dirty, setDirty] = useState(false);
  const { byId } = useData();
  const nav = useNavigate();
  useEffect(() => {
    setP(saved);
    setDirty(false);
  }, [saved]);
  const src = p.source_id ? (byId.get(p.source_id) as unknown as LaserSource | undefined) : undefined;
  const optic = p.optic_id ? (byId.get(p.optic_id) as unknown as Optic | undefined) : undefined;
  const spot = src && optic ? spotDiameter({ wavelength_nm: src.wavelength.value, focal_mm: optic.focal_length_mm, m2: src.m2, beam_mm: src.beam_diameter_mm }) : null;
  const dof = spot && src ? depthOfFocus({ spot_um: spot.value, wavelength_nm: src.wavelength.value, m2: src.m2 }) : null;
  const upd = (x: Partial<Poc>) => {
    setP({ ...p, ...x });
    setDirty(true);
  };
  const save = async () => {
    const { __origin, __dataset, ...clean } = p as Poc & { __origin?: unknown; __dataset?: unknown };
    void __origin;
    void __dataset;
    await repo().workspace.save(clean as unknown as Record<string, unknown>, 'Updated POC');
    setDirty(false);
  };
  const createDoe = async () => {
    const factors: Doe['factors'] = [
      { name: 'Average power', unit: 'W', levels: p.power_w ? [Math.round(p.power_w * 0.5), Math.round(p.power_w * 0.75), p.power_w] : [10, 20] },
      { name: 'Scan speed', unit: 'mm/s', levels: [500, 1000, 2000] },
    ];
    const responses: Doe['responses'] = [{ name: 'Primary response', lsl: null, usl: null, target: null }];
    const doe: Doe = { id: newLocalId('doe'), entity: 'doe', name: `DOE — ${p.name}`, poc_id: p.id, design: 'full_factorial', factors, responses, replicates: 1, runs: generateRuns(factors, responses, 1), constraints: ['Starting levels are ASSUMED — edit before running'], data_type: 'USER_CREATED', provenance: { verification_status: 'DRAFT' } };
    await repo().workspace.saveMany([doe, { ...p, doe_id: doe.id }] as unknown as Record<string, unknown>[], 'Created DOE for POC');
    nav(`/record/${encodeURIComponent(doe.id)}`);
  };
  const ms = p.measurements ?? [];

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          Proof of concept {dirty && <Badge tone="draft">unsaved</Badge>}
        </span>
      }
      actions={
        <Button size="sm" variant="primary" disabled={!dirty} onClick={() => void save()}>
          Save
        </Button>
      }
    >
      <ol className="mb-3 flex flex-wrap gap-1" aria-label="POC status">
        {POC_STATUSES.map((s) => (
          <li key={s}>
            <button type="button" aria-current={p.poc_status === s ? 'step' : undefined} onClick={() => upd({ poc_status: s })} className={`rounded px-2 py-1 text-[11.5px] font-semibold ${p.poc_status === s ? 'bg-accent text-white' : 'bg-panel-2 text-ink-3'}`}>
              {s}
            </button>
          </li>
        ))}
      </ol>
      <div className="grid gap-3 lg:grid-cols-2">
        <KV
          items={[
            ['Objective', p.objective],
            ['Customer', <RecordLink key="c" id={p.customer_id} />],
            ['Part / lot', `${p.part ?? '—'}${p.lot ? ` · lot ${p.lot}` : ''}`],
            ['Material', <RecordLink key="m" id={p.material_id} />],
            ['Laser', <span key="l">{p.source_id ? <RecordLink id={p.source_id} /> : <Unknown />} · {p.power_w ?? '—'} W</span>],
            ['Optic', <RecordLink key="o" id={p.optic_id} />],
            ['Spot / DOF', spot ? <span key="s"><CalcValue c={spot} /> · <CalcValue c={dof} /></span> : <Unknown label="link source + optic" />],
            ['DOE', p.doe_id ? <RecordLink key="d" id={p.doe_id} /> : <Button key="b" size="sm" onClick={() => void createDoe()}>Create DOE</Button>],
          ]}
        />
        <div className="space-y-2">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase text-ink-3">Measurements (actual)</div>
            {ms.map((m, i) => (
              <div key={i} className="mb-1 grid grid-cols-[1fr_80px_60px_1fr_auto] gap-1">
                <Input aria-label="Characteristic" value={m.characteristic} onChange={(e) => upd({ measurements: ms.map((x, j) => (j === i ? { ...x, characteristic: e.target.value } : x)) })} />
                <Input aria-label="Value" value={m.value} onChange={(e) => upd({ measurements: ms.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                <Input aria-label="Unit" value={m.unit ?? ''} onChange={(e) => upd({ measurements: ms.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)) })} />
                <Input aria-label="Method / metrology" value={m.method ?? ''} placeholder="method" onChange={(e) => upd({ measurements: ms.map((x, j) => (j === i ? { ...x, method: e.target.value } : x)) })} />
                <Button size="sm" variant="ghost" aria-label="Remove measurement" onClick={() => upd({ measurements: ms.filter((_, j) => j !== i) })}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button size="sm" onClick={() => upd({ measurements: [...ms, { characteristic: '', value: '' }] })}>
              <Plus className="size-3.5" /> Add measurement
            </Button>
          </div>
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase text-ink-3">Decision</div>
            <Select aria-label="Decision" value={p.decision} onChange={(e) => upd({ decision: e.target.value as Poc['decision'] })}>
              {POC_DECISIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
            {p.decision !== 'Undecided' && !ms.length && <Notice tone="warn">A decision without recorded measurements is not evidence-based. Record the measurements that support it.</Notice>}
            <textarea aria-label="Conclusion" className="mt-1 min-h-[60px] w-full rounded-md border border-line bg-panel p-2 text-[13px]" placeholder="Conclusion and evidence…" value={p.conclusion ?? ''} onChange={(e) => upd({ conclusion: e.target.value })} />
          </div>
        </div>
      </div>
    </Card>
  );
}
