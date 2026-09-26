import clsx from 'clsx';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '../../components/badges';
import { Badge, Button, Card, Input, Notice, Select, Tabs } from '../../components/ui';
import { TASK_STATUSES, type GateDefinition, type GateReview, type Project, type ProjectTask } from '../../domain/entities';
import { useData, useRecords, type Rec } from '../../hooks/useData';
import { repo } from '../../repositories';
import { canDecide, gateHealth, newReview } from '../../services/gates';
import { criticalPath } from '../../services/schedule';
import { addDays, daysBetween, fmtDate, todayIso } from '../../utils/dates';

const HEALTH_TONE = { passed: 'ok', conditional: 'warn', failed: 'bad', in_review: 'info', not_started: 'neutral' } as const;

export function Gantt({ tasks, onSelect }: { tasks: ProjectTask[]; onSelect?: (id: string) => void }) {
  const cpm = useMemo(() => criticalPath(tasks), [tasks]);
  if (!tasks.length) return <p className="text-ink-3">No tasks.</p>;
  const start = tasks.map((t) => t.start).sort()[0];
  const end = tasks.map((t) => t.end).sort().at(-1)!;
  const span = Math.max(1, daysBetween(start, end));
  const W = 900;
  const rowH = 24;
  const x = (d: string) => 170 + (daysBetween(start, d) / span) * (W - 180);
  const today = todayIso();
  const months: string[] = [];
  for (let d = start.slice(0, 7) + '-01'; d <= end; d = addDays(d, 32).slice(0, 7) + '-01') if (d >= start) months.push(d);
  return (
    <div className="overflow-x-auto">
      {cpm.cycle && <Notice tone="warn">Dependency cycle detected — critical path is incomplete.</Notice>}
      <svg role="img" aria-label={`Gantt chart, critical path ${cpm.length} days`} viewBox={`0 0 ${W} ${tasks.length * rowH + 30}`} className="min-w-[700px]">
        {months.map((m) => (
          <g key={m}>
            <line x1={x(m)} x2={x(m)} y1={14} y2={tasks.length * rowH + 22} stroke="var(--c-line)" />
            <text x={x(m) + 3} y={11} fontSize={9.5} fill="var(--c-ink-3)">
              {new Date(`${m}T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' })}
            </text>
          </g>
        ))}
        {today >= start && today <= end && <line x1={x(today)} x2={x(today)} y1={14} y2={tasks.length * rowH + 22} stroke="var(--c-bad)" strokeDasharray="3 3" />}
        {tasks.map((t, i) => {
          const c = cpm.tasks.get(t.id);
          const y = 18 + i * rowH;
          const w = Math.max(3, x(t.end) - x(t.start));
          return (
            <g key={t.id} onClick={() => onSelect?.(t.id)} className={onSelect ? 'cursor-pointer' : ''}>
              <text x={4} y={y + 13} fontSize={10.5} fill="var(--c-ink)">
                {t.gate_code ? `${t.gate_code} · ` : ''}
                {t.name.slice(0, 26)}
              </text>
              {t.milestone ? (
                <path d={`M ${x(t.end)} ${y + 3} l 7 7 l -7 7 l -7 -7 z`} fill={c?.critical ? 'var(--c-bad)' : 'var(--c-accent)'} />
              ) : (
                <rect x={x(t.start)} y={y + 4} width={w} height={13} rx={2} fill={t.status === 'Completed' ? 'var(--c-ok)' : c?.critical ? 'var(--c-bad)' : 'var(--c-accent)'} opacity={t.status === 'Completed' ? 0.6 : 0.85}>
                  <title>{`${t.name}: ${fmtDate(t.start)} → ${fmtDate(t.end)} · ${t.status}${c ? ` · slack ${c.slack} d${c.critical ? ' (critical)' : ''}` : ''}`}</title>
                </rect>
              )}
              {(t.depends_on ?? []).map((dep) => {
                const j = tasks.findIndex((x2) => x2.id === dep);
                if (j < 0) return null;
                const from = tasks[j];
                const y0 = 18 + j * rowH + 10;
                return <path key={dep} d={`M ${x(from.end)} ${y0} C ${x(from.end) + 10} ${y0}, ${x(t.start) - 10} ${y + 10}, ${x(t.start)} ${y + 10}`} fill="none" stroke="var(--c-ink-3)" strokeWidth={0.8} />;
              })}
            </g>
          );
        })}
      </svg>
      <p className="text-meta text-ink-3">
        Red = critical path ({cpm.length} days: {cpm.path.join(' → ')}). Dashed line = today.
      </p>
    </div>
  );
}

function GateReviewPanel({ project, def, onChange }: { project: Project; def: GateDefinition; onChange: (g: GateReview) => void }) {
  const existing = project.gates.find((g) => g.gate_code === def.code);
  const [r, setR] = useState<GateReview>(existing ?? newReview(def));
  const [msg, setMsg] = useState<string[]>([]);
  useEffect(() => setR(existing ?? newReview(def)), [existing, def]);
  const decide = (decision: GateReview['decision']) => {
    const res = canDecide(project, r, def, decision);
    setMsg(res.checks.filter((c) => !c.ok).map((c) => `${c.rule}: ${c.message}`));
    if (res.allowed) onChange({ ...r, decision, date: todayIso() });
  };
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2 text-body md:grid-cols-2">
        <div>
          <b>Inputs:</b> {def.inputs}
        </div>
        <div>
          <b>Approval criteria:</b> {def.approval_criteria}
        </div>
        <div>
          <b>Responsible:</b> {def.responsible}
        </div>
        <div>
          <b>Exit criteria:</b> {def.exit_criteria}
        </div>
      </div>
      <div className="text-micro font-semibold uppercase text-ink-3">Mandatory evidence</div>
      <ul className="space-y-1">
        {r.evidence.map((e, i) => (
          <li key={i} className="grid grid-cols-[1fr_140px_1fr] items-center gap-2">
            <span>{e.item}</span>
            <Select aria-label={`Status of ${e.item}`} value={e.status} onChange={(ev) => setR({ ...r, evidence: r.evidence.map((x, j) => (j === i ? { ...x, status: ev.target.value as typeof e.status } : x)) })} className="py-0.5">
              <option value="missing">missing</option>
              <option value="provided">provided</option>
              <option value="not_applicable">not applicable</option>
            </Select>
            <Input aria-label={`Reference for ${e.item}`} placeholder="document / record reference" value={e.reference ?? ''} onChange={(ev) => setR({ ...r, evidence: r.evidence.map((x, j) => (j === i ? { ...x, reference: ev.target.value } : x)) })} className="py-0.5" />
          </li>
        ))}
      </ul>
      <Input aria-label="Approvers" placeholder={`Approvers, comma separated${def.customer_facing ? ' — include Customer (customer-facing gate)' : ''}`} value={(r.approvers ?? []).join(', ')} onChange={(ev) => setR({ ...r, approvers: ev.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} />
      <div>
        <div className="text-micro font-semibold uppercase text-ink-3">Conditions (owner and date required)</div>
        {(r.conditions ?? []).map((c, i) => (
          <div key={i} className="mb-1 grid grid-cols-[1fr_140px_150px_auto_auto] gap-1">
            <Input aria-label="Condition" value={c.text} onChange={(ev) => setR({ ...r, conditions: r.conditions!.map((x, j) => (j === i ? { ...x, text: ev.target.value } : x)) })} />
            <Input aria-label="Condition owner" placeholder="owner" value={c.owner} onChange={(ev) => setR({ ...r, conditions: r.conditions!.map((x, j) => (j === i ? { ...x, owner: ev.target.value } : x)) })} />
            <Input aria-label="Condition due date" type="date" value={c.due} onChange={(ev) => setR({ ...r, conditions: r.conditions!.map((x, j) => (j === i ? { ...x, due: ev.target.value } : x)) })} />
            <label className="flex items-center gap-1 text-meta">
              <input type="checkbox" checked={!!c.closed} onChange={(ev) => setR({ ...r, conditions: r.conditions!.map((x, j) => (j === i ? { ...x, closed: ev.target.checked } : x)) })} /> closed
            </label>
            <Button size="sm" variant="ghost" aria-label="Remove condition" onClick={() => setR({ ...r, conditions: r.conditions!.filter((_, j) => j !== i) })}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        <Button size="sm" onClick={() => setR({ ...r, conditions: [...(r.conditions ?? []), { text: '', owner: '', due: addDays(todayIso(), 14) }] })}>
          <Plus className="size-3.5" /> Condition
        </Button>
      </div>
      {msg.length > 0 && (
        <div role="alert" className="rounded border border-bad/40 bg-bad/5 p-2 text-body text-bad">
          Gate cannot pass:
          <ul className="list-disc pl-5">
            {msg.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => decide('GO')}>
          GO
        </Button>
        <Button onClick={() => decide('GO WITH CONDITIONS')}>GO WITH CONDITIONS</Button>
        <Button variant="danger" onClick={() => decide('NO-GO')}>
          NO-GO
        </Button>
        <Button variant="ghost" onClick={() => onChange({ ...r, decision: 'PENDING' })}>
          Save as pending
        </Button>
      </div>
    </div>
  );
}

/** PROJECT MANAGEMENT (spec §71–§72) with G0–G10 (§45). */
export default function ProjectView({ record }: { record: Rec }) {
  const saved = record as unknown as Project & Rec;
  const [p, setP] = useState<Project>(saved);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<'gantt' | 'tasks' | 'gates'>('gantt');
  const defs = useRecords<GateDefinition>('gate_definition').sort((a, b) => a.order - b.order);
  const [gate, setGate] = useState('G0');
  const { byId } = useData();
  useEffect(() => {
    setP(saved);
    setDirty(false);
  }, [saved]);
  const persist = async (next: Project, summary: string) => {
    const { __origin, __dataset, ...clean } = next as Project & { __origin?: unknown; __dataset?: unknown };
    void __origin;
    void __dataset;
    await repo().workspace.save(clean as unknown as Record<string, unknown>, summary);
    setDirty(false);
  };
  const setTask = (i: number, k: keyof ProjectTask, v: unknown) => {
    const tasks = [...p.tasks];
    tasks[i] = { ...tasks[i], [k]: v } as ProjectTask;
    setP({ ...p, tasks });
    setDirty(true);
  };
  const def = defs.find((d) => d.code === gate);
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          Project {dirty && <Badge tone="draft">unsaved</Badge>}
        </span>
      }
      actions={
        <Button size="sm" variant="primary" disabled={!dirty} onClick={() => void persist(p, 'Edited project')}>
          Save
        </Button>
      }
    >
      <div className="mb-2 flex flex-wrap gap-1" aria-label="Gate status">
        {defs.map((d) => {
          const h = gateHealth(p, d.code);
          return (
            <button
              type="button"
              key={d.code}
              onClick={() => {
                setGate(d.code);
                setTab('gates');
              }}
              title={`${d.name}: ${h.replace('_', ' ')}`}
            >
              <Badge tone={HEALTH_TONE[h]}>{d.code}</Badge>
            </button>
          );
        })}
      </div>
      <Tabs
        label="Project views"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'gantt', label: 'Gantt' },
          { key: 'tasks', label: 'Tasks', count: p.tasks.length },
          { key: 'gates', label: 'G0–G10 reviews', count: p.gates.length },
        ]}
      />
      {tab === 'gantt' && <Gantt tasks={p.tasks} onSelect={() => setTab('tasks')} />}
      {tab === 'tasks' && (
        <div className="overflow-x-auto">
          <table className="w-full text-meta">
            <thead>
              <tr className="text-left text-micro uppercase text-ink-3">
                {['ID', 'Task', 'Owner', 'Start', 'End', 'Depends on', 'Status', 'Gate', 'MS', ''].map((h) => (
                  <th key={h} className="px-1">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {p.tasks.map((t, i) => (
                <tr key={t.id} className={clsx('border-t border-line/60')}>
                  <td className="num px-1">{t.id}</td>
                  <td className="px-1">
                    <Input aria-label="Task name" value={t.name} onChange={(e) => setTask(i, 'name', e.target.value)} className="py-0.5" />
                  </td>
                  <td className="px-1">
                    <Input aria-label="Owner" value={t.owner ?? ''} onChange={(e) => setTask(i, 'owner', e.target.value || undefined)} className="w-28 py-0.5" />
                  </td>
                  <td className="px-1">
                    <Input aria-label="Start" type="date" value={t.start} onChange={(e) => setTask(i, 'start', e.target.value)} className="py-0.5" />
                  </td>
                  <td className="px-1">
                    <Input aria-label="End" type="date" value={t.end} onChange={(e) => setTask(i, 'end', e.target.value)} className="py-0.5" />
                  </td>
                  <td className="px-1">
                    <Input aria-label="Depends on" value={(t.depends_on ?? []).join(',')} onChange={(e) => setTask(i, 'depends_on', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} className="w-20 py-0.5" />
                  </td>
                  <td className="px-1">
                    <Select aria-label="Status" value={t.status} onChange={(e) => setTask(i, 'status', e.target.value)} className="py-0.5">
                      {TASK_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-1">
                    <Input aria-label="Gate" value={t.gate_code ?? ''} onChange={(e) => setTask(i, 'gate_code', e.target.value || undefined)} className="w-14 py-0.5" />
                  </td>
                  <td className="px-1 text-center">
                    <input type="checkbox" aria-label="Milestone" checked={!!t.milestone} onChange={(e) => setTask(i, 'milestone', e.target.checked)} />
                  </td>
                  <td>
                    <Button size="sm" variant="ghost" aria-label="Remove task" onClick={() => (setP({ ...p, tasks: p.tasks.filter((_, j) => j !== i) }), setDirty(true))}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button
            size="sm"
            className="mt-2"
            onClick={() => {
              const last = p.tasks.at(-1);
              const s = last?.end ?? todayIso();
              setP({ ...p, tasks: [...p.tasks, { id: `t${p.tasks.length + 1}`, name: 'New task', start: s, end: addDays(s, 7), status: 'Not Started', depends_on: last ? [last.id] : [] }] });
              setDirty(true);
            }}
          >
            <Plus className="size-3.5" /> Add task
          </Button>
        </div>
      )}
      {tab === 'gates' && def && (
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Select aria-label="Gate" value={gate} onChange={(e) => setGate(e.target.value)} className="w-72">
              {defs.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </Select>
            <StatusBadge s={p.gates.find((g) => g.gate_code === gate)?.decision ?? 'PENDING'} />
            {def.customer_facing && <Badge tone="info">customer-facing</Badge>}
          </div>
          <GateReviewPanel
            project={p}
            def={def}
            onChange={(g) => {
              const next = { ...p, gates: [...p.gates.filter((x) => x.gate_code !== g.gate_code), g].sort((a, b) => parseInt(a.gate_code.slice(1)) - parseInt(b.gate_code.slice(1))) };
              setP(next);
              void persist(next, `${g.gate_code} ${g.decision}`);
            }}
          />
          <p className="mt-2 text-meta text-ink-3">
            Rules R1–R5 (src/services/gates.ts): mandatory evidence, previous gate passed, previous conditions closed, named conditions, customer signature on customer-facing gates. Source: {byId.get('src-automation-handbook')?.name}.
          </p>
        </div>
      )}
    </Card>
  );
}
