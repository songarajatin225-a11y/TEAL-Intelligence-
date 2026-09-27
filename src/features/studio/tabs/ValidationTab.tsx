import clsx from 'clsx';
import { ClipboardCheck, FlaskConical, Plus, Route, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../../components/RecordLink';
import { toast } from '../../../components/toast';
import { Badge, Button, Card, Field, IconButton, Notice, Table } from '../../../components/ui';
import type { AnyRecord } from '../../../domain';
import type { Requirement } from '../../../domain/entities';
import type { Verification } from '../../../domain/engineering';
import { newLocalId, repo, ValidationFailure } from '../../../repositories';
import { requirementIssues, traceChain } from '../../../services/eng/requirementQuality';
import { calibration } from '../../../services/sim/analysis';
import { MODEL_VERSION } from '../../../services/sim/model';
import { todayIso } from '../../../utils/dates';
import type { TabProps } from '../ScenarioPage';
import { num } from '../shared';
import { NumInput, SmallSelect, TextInput } from './edit';

type V = Verification & AnyRecord;

export default function ValidationTab({ eng, sim, set, d, customer }: TabProps) {
  const reqs = (sim.requirement_ids ?? []).map((id) => eng.byId.get(id)).filter((x): x is Requirement & AnyRecord => !!x) as (Requirement & AnyRecord)[];
  const allReqs = eng.records.filter((r) => r.entity === 'requirement') as unknown as (Requirement & AnyRecord)[];
  const vers = eng.records.filter((r) => r.entity === 'verification' && ((r as unknown as V).simulation_id === sim.id || (sim.requirement_ids ?? []).includes((r as unknown as V).requirement_id))) as unknown as V[];
  const metrics: { key: string; label: string; unit: string; predicted: number | null }[] = [
    { key: 'Cycle time', label: 'Cycle time', unit: 's', predicted: d.cycle?.cycle ?? null },
    { key: 'Practical UPH', label: 'Practical UPH', unit: 'parts/h', predicted: d.cycle?.practicalUph ?? null },
    ...d.res.stations.map((s) => ({ key: `${s.station.name} time`, label: `${s.station.name} time`, unit: 's', predicted: s.time })),
  ];
  const [m, setM] = useState(metrics[0].key);
  const [actual, setActual] = useState<number | null>(null);
  const [date, setDate] = useState(todayIso());
  const [poc, setPoc] = useState('');
  const [note, setNote] = useState('');
  const cal = calibration(sim);
  const saveVer = async (v: Record<string, unknown>, summary: string) => {
    try {
      await repo().workspace.save(v, summary);
      toast(summary, { tone: 'draft' });
    } catch (e) {
      toast('Not saved', { tone: 'error', detail: e instanceof ValidationFailure ? e.message : String(e) });
    }
  };
  const plan = (r: Requirement & AnyRecord, kind: 'Verification' | 'Validation') =>
    saveVer(
      {
        id: newLocalId('verification'),
        entity: 'verification',
        name: `${kind} of ${r.code ?? r.id} — ${r.name}`,
        kind,
        requirement_id: r.id,
        method: r.verification_method ?? 'Test',
        expected: r.acceptance_criterion ?? (r.value ? `${r.value} ${r.unit ?? ''}` : undefined),
        result: 'NOT RUN',
        simulation_id: sim.id,
        ...(sim.customer_id ? { customer_id: sim.customer_id } : {}),
        data_type: 'USER_CREATED',
        provenance: { verification_status: 'DRAFT', note: 'Planned from the Equipment Simulation Studio. No result recorded.' },
      },
      `${kind} planned for ${r.code ?? r.id}`,
    );
  return (
    <div className="space-y-4">
      <Card title="Requirement traceability" icon={Route} description="Customer requirement → system → component → design → BOM → test → verification → validation → acceptance (§87)">
        {reqs.length ? (
          <ul className="space-y-3">
            {reqs.map((r) => {
              const ch = traceChain(r, eng.records);
              const iss = requirementIssues(r, allReqs);
              return (
                <li key={r.id} className="rounded-control border border-line p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={recordPath(r.id)} className="font-semibold text-accent-2 hover:underline">
                      {String(r.code ?? r.id)} — {r.name}
                    </Link>
                    <Badge tone={ch.coverage >= 70 ? 'ok' : ch.coverage >= 40 ? 'warn' : 'bad'}>{ch.coverage} % of the chain</Badge>
                  </div>
                  <ol className="mt-2 flex flex-wrap gap-1">
                    {ch.steps.map((s) => (
                      <li key={s.step} title={s.evidence.join(', ') || 'no evidence'} className={clsx('rounded-md border px-1.5 py-0.5 text-micro', s.ok ? 'border-ok/40 bg-ok/10 text-ok' : 'border-dashed border-line-strong text-ink-3')}>
                        {s.ok ? '✓' : '○'} {s.step}
                      </li>
                    ))}
                  </ol>
                  {!customer && iss.length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-micro">
                      {iss.map((i, k) => (
                        <li key={k} className={i.severity === 'error' ? 'text-bad' : 'text-warn'}>
                          {i.message}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!customer && (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={() => plan(r, 'Verification')}>
                        <Plus className="size-3.5" aria-hidden /> Plan verification
                      </Button>
                      <Button size="sm" onClick={() => plan(r, 'Validation')}>
                        <Plus className="size-3.5" aria-hidden /> Plan validation
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-meta text-ink-3">No requirement is linked — link them on the Overview tab.</p>
        )}
      </Card>
      <Card title="Verification and validation records" icon={ClipboardCheck} description="Record what was measured. Results are never pre-filled.">
        {vers.length ? (
          <Table head={['Record', 'Kind', 'Method', 'Expected', 'Actual', 'Result', 'Date', 'Tester']} dense>
            {vers.map((v) => (
              <tr key={v.id}>
                <td>
                  <Link to={recordPath(v.id)} className="text-accent-2 hover:underline">
                    {v.name}
                  </Link>
                </td>
                <td>{v.kind}</td>
                <td>{v.method}</td>
                <td className="text-micro">{v.expected ?? '—'}</td>
                <td>{customer ? v.actual ?? '—' : <TextInput label={`${v.name} actual`} value={v.actual} onChange={(x) => saveVer({ ...stripOrigin(v), actual: x || undefined }, `Result updated: ${v.name}`)} className="w-28" />}</td>
                <td>{customer ? <Badge>{v.result}</Badge> : <SmallSelect label={`${v.name} result`} value={v.result} options={['NOT RUN', 'PASS', 'FAIL', 'PASS WITH DEVIATION'] as const} onChange={(x) => saveVer({ ...stripOrigin(v), result: x, date: v.date ?? todayIso() }, `Result recorded: ${v.name} — ${x}`)} />}</td>
                <td className="num">{v.date ?? '—'}</td>
                <td>{customer ? v.tester ?? '—' : <TextInput label={`${v.name} tester`} value={v.tester} onChange={(x) => saveVer({ ...stripOrigin(v), tester: x || undefined }, `Tester set: ${v.name}`)} className="w-28" />}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-meta text-ink-3">No verification or validation planned.</p>
        )}
      </Card>
      <Card title="Simulation vs actual" icon={FlaskConical} description="Enter measured POC / FAT values. The prediction is copied from the current model so the comparison is fixed at the time of measurement (§84, §174).">
        {!customer && (
          <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <Field label="Metric">
              <SmallSelect label="Metric" value={m} options={metrics.map((x) => ({ value: x.key, label: x.label }))} onChange={setM} className="w-full" />
            </Field>
            <Field label="Predicted (model)">
              <div className="num min-h-8 py-1 text-meta">
                {num(metrics.find((x) => x.key === m)?.predicted ?? null)} {metrics.find((x) => x.key === m)?.unit}
              </div>
            </Field>
            <Field label="Actual (measured)">
              <NumInput label="Actual" min={0} value={actual} onChange={setActual} width="w-full" />
            </Field>
            <Field label="Date">
              <input type="date" aria-label="Measurement date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-8 w-full rounded-control border border-line-strong bg-solid px-2 text-meta" />
            </Field>
            <Field label="POC">
              <SmallSelect label="POC" value={poc} options={[{ value: '', label: 'None' }, ...eng.records.filter((r) => r.entity === 'poc').map((r) => ({ value: r.id, label: r.name }))]} onChange={setPoc} className="w-full" />
            </Field>
            <Field label="Note">
              <TextInput label="Note" value={note} onChange={setNote} className="w-full" />
            </Field>
            <Button
              variant="primary"
              disabled={actual == null}
              onClick={() => {
                const mm = metrics.find((x) => x.key === m)!;
                set((s) => ({ ...s, actuals: [...(s.actuals ?? []), { metric: mm.label, predicted: mm.predicted, actual: actual!, unit: mm.unit, date, equipment_version: `v${s.version ?? 1}`, simulation_version: MODEL_VERSION, ...(poc ? { poc_id: poc } : {}), ...(note ? { note } : {}) }] }));
                setActual(null);
                setNote('');
              }}
            >
              <Plus className="size-4" aria-hidden /> Add measurement
            </Button>
          </div>
        )}
        {cal.length ? (
          <Table head={['Metric', 'Predicted', 'Actual', 'Error', '% error', 'Date', 'Versions', '']} dense>
            {cal.map((c, i) => (
              <tr key={i}>
                <td>{c.metric}</td>
                <td className="num">
                  {num(c.predicted)} {c.unit}
                </td>
                <td className="num font-semibold">
                  {num(c.actual)} {c.unit}
                </td>
                <td className="num">{num(c.error)}</td>
                <td className="num">
                  {c.pctError != null ? `${num(c.pctError)} %` : '—'} {c.candidate && <Badge tone="warn">calibration candidate</Badge>}
                </td>
                <td className="num">{c.date}</td>
                <td className="text-micro">
                  {sim.actuals?.[i]?.equipment_version} · {sim.actuals?.[i]?.simulation_version}
                </td>
                <td>{!customer && <IconButton size="sm" label={`Remove measurement ${c.metric}`} icon={Trash2} onClick={() => set((s) => ({ ...s, actuals: (s.actuals ?? []).filter((_, j) => j !== i) }))} />}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <p className="text-meta text-ink-3">Not validated — no measured values recorded. The simulation stays a model until measured data is compared here.</p>
        )}
        {cal.filter((c) => c.suggestion).map((c, i) => (
          <Notice key={i} tone="draft">
            {c.suggestion}
          </Notice>
        ))}
        <p className="mt-2 text-micro text-ink-3">Measurements are part of the scenario — press Save to keep them.</p>
      </Card>
    </div>
  );
}

function stripOrigin(v: V): Record<string, unknown> {
  const { __origin: _o, __dataset: _d, ...rest } = v as V & { __origin?: string; __dataset?: string };
  void _o;
  void _d;
  return rest;
}
