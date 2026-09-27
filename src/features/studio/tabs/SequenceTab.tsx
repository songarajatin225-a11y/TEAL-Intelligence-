import clsx from 'clsx';
import { ArrowDown, ArrowUp, CheckCircle2, ListOrdered, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Badge, Button, Card, IconButton, Notice, Table } from '../../../components/ui';
import { defaultSequence, validateSequence, type SeqStep } from '../../../services/sim/build';
import type { TabProps } from '../ScenarioPage';
import { NumInput, SmallSelect, TextInput } from './edit';

const KINDS = ['start', 'check', 'action', 'decision', 'end'] as const;

/** §74 automation sequence as an editable state machine with structural checks. */
export default function SequenceTab({ sim, set, customer }: TabProps) {
  const seq = sim.sequence ?? [];
  const issues = validateSequence(seq);
  const put = (f: (s: SeqStep[]) => SeqStep[]) => set((s) => ({ ...s, sequence: f(s.sequence ?? []) }));
  const patch = (i: number, p: Partial<SeqStep>) => put((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const move = (i: number, d: -1 | 1) =>
    put((s) => {
      const a = [...s];
      const j = i + d;
      if (j < 0 || j >= a.length) return s;
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });
  const add = (i: number) =>
    put((s) => {
      let n = s.length + 1;
      while (s.some((x) => x.key === `step${n}`)) n++;
      const a = [...s];
      a.splice(i + 1, 0, { key: `step${n}`, name: 'New step', kind: 'action' });
      return a;
    });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card
          title="Automation sequence"
          icon={ListOrdered}
          description="Steps with sensors, actuators, timers, interlocks, alarms and conditions"
          actions={
            !customer && (
              <Button size="sm" onClick={() => set((s) => ({ ...s, sequence: defaultSequence(s.stations) }))}>
                <RotateCcw className="size-3.5" aria-hidden /> Rebuild from stations
              </Button>
            )
          }
        >
          {seq.length ? (
            <Table head={['#', 'Step', 'Kind', 'Sensor', 'Actuator', 'Timer (s)', 'Interlock', 'Alarm', 'Condition', '']} dense>
              {seq.map((s, i) => (
                <tr key={s.key}>
                  <td className="num">{i + 1}</td>
                  <td>
                    <TextInput label={`Step ${i + 1} name`} value={s.name} onChange={(v) => v.trim() && patch(i, { name: v.trim() })} className="w-36" />
                  </td>
                  <td>
                    <SmallSelect label={`Step ${i + 1} kind`} value={s.kind} options={KINDS} onChange={(v) => patch(i, { kind: v })} />
                  </td>
                  {(['sensor', 'actuator'] as const).map((k) => (
                    <td key={k}>
                      <TextInput label={`Step ${i + 1} ${k}`} value={s[k]} onChange={(v) => patch(i, { [k]: v || undefined })} className="w-32" />
                    </td>
                  ))}
                  <td>
                    <NumInput label={`Step ${i + 1} timer`} min={0} value={s.timer_s ?? null} onChange={(v) => patch(i, { timer_s: v ?? undefined })} width="w-16" />
                  </td>
                  {(['interlock', 'alarm', 'condition'] as const).map((k) => (
                    <td key={k}>
                      <TextInput label={`Step ${i + 1} ${k}`} value={s[k]} onChange={(v) => patch(i, { [k]: v || undefined })} className="w-36" />
                    </td>
                  ))}
                  <td className="whitespace-nowrap">
                    <IconButton size="sm" label={`Insert a step after ${s.name}`} icon={Plus} onClick={() => add(i)} />
                    <IconButton size="sm" label={`Move ${s.name} up`} icon={ArrowUp} onClick={() => move(i, -1)} disabled={i === 0} />
                    <IconButton size="sm" label={`Move ${s.name} down`} icon={ArrowDown} onClick={() => move(i, 1)} disabled={i === seq.length - 1} />
                    <IconButton size="sm" label={`Delete ${s.name}`} icon={Trash2} onClick={() => put((x) => x.filter((_, j) => j !== i))} />
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <div className="space-y-2">
              <p className="text-meta text-ink-3">No sequence defined.</p>
              <Button size="sm" variant="primary" onClick={() => set((s) => ({ ...s, sequence: defaultSequence(s.stations) }))}>
                Build from stations
              </Button>
            </div>
          )}
        </Card>
        <Card title="State machine" description="Read top to bottom; decisions branch to OK / NG">
          <ol className="space-y-1" aria-label="Sequence flow">
            {seq.map((s, i) => (
              <li key={s.key} className="flex flex-col items-center">
                <div className={clsx('w-full rounded-control border px-2.5 py-1.5 text-center text-meta', s.kind === 'start' || s.kind === 'end' ? 'border-accent bg-accent-soft font-semibold' : s.kind === 'decision' ? 'border-warn/60 bg-warn/10' : s.kind === 'check' ? 'border-info/50 bg-info/10' : 'border-line-strong bg-solid')}>
                  {s.name}
                  {s.interlock && <div className="text-micro text-warn">interlock: {s.interlock}</div>}
                </div>
                {i < seq.length - 1 && <ArrowDown className="my-0.5 size-3.5 text-accent" aria-hidden />}
              </li>
            ))}
          </ol>
        </Card>
      </div>
      {issues.length ? (
        <Notice tone="warn">
          <strong>Sequence checks:</strong>
          <ul className="mt-1 list-disc pl-5">
            {issues.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Notice>
      ) : (
        seq.length > 0 && (
          <p className="flex items-center gap-1.5 text-meta text-ok">
            <CheckCircle2 className="size-4" aria-hidden /> Structural checks pass (start, end, safety check, laser enable/disable ordering, interlocks, alarms, decision conditions). <Badge>Not a PLC program — review with controls engineering</Badge>
          </p>
        )
      )}
    </div>
  );
}
