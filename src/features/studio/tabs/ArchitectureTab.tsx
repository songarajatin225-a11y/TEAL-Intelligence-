import clsx from 'clsx';
import { ArrowDown, ArrowUp, Network, Plus, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import { Badge, Button, Card, Field, IconButton, Notice, Table } from '../../../components/ui';
import { BASES, STATION_KINDS, type Station } from '../../../domain/engineering';
import { distMean, laserTime } from '../../../services/sim/model';
import type { TabProps } from '../ScenarioPage';
import { BasisBadge, num } from '../shared';
import { NumInput, SmallSelect, TextInput } from './edit';

/** §61 process flow as an engineering diagram (not decoration): time, parallel servers, buffers, bottleneck. */
export function FlowDiagram({ stations, bottleneck, times, selected, onSelect }: { stations: Station[]; bottleneck?: string; times: (number | null)[]; selected?: string; onSelect?: (k: string) => void }) {
  const W = 132;
  const G = 40;
  const width = 20 + stations.length * (W + G);
  return (
    <div className="scroll-thin overflow-x-auto">
      <svg viewBox={`0 0 ${width} 132`} width={width} height={132} role="img" aria-label={`Process flow: ${stations.map((s) => s.name).join(' → ')}`} className="min-w-full">
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="fill-accent" />
          </marker>
        </defs>
        {stations.map((s, i) => {
          const x = 10 + i * (W + G);
          const isB = s.key === bottleneck;
          const par = s.parallel ?? 1;
          return (
            <g key={s.key} onClick={() => onSelect?.(s.key)} className={onSelect ? 'cursor-pointer' : undefined}>
              {par > 1 && <rect x={x + 6} y={22} width={W} height={70} rx={10} className="fill-panel-2 stroke-line-strong" />}
              <rect x={x} y={16} width={W} height={70} rx={10} className={clsx('stroke-[1.5]', isB ? 'fill-bad/10 stroke-bad' : selected === s.key ? 'fill-accent-soft stroke-accent' : 'fill-solid stroke-line-strong')} />
              <text x={x + 10} y={36} className="fill-ink text-[11px] font-semibold">
                {s.name.length > 19 ? `${s.name.slice(0, 18)}…` : s.name}
              </text>
              <text x={x + 10} y={54} className="fill-ink-3 text-[10px]">
                {s.kind}
                {par > 1 ? ` · ×${par}` : ''}
              </text>
              <text x={x + 10} y={74} className={clsx('text-[12px] font-semibold', times[i] == null ? 'fill-warn' : 'fill-ink')}>
                {times[i] == null ? 'time missing' : `${num(times[i], 3)} s`}
              </text>
              {isB && (
                <text x={x + W - 8} y={74} textAnchor="end" className="fill-bad text-[10px] font-semibold">
                  bottleneck
                </text>
              )}
              {i < stations.length - 1 && (
                <>
                  <line x1={x + W + (par > 1 ? 6 : 0)} y1={51} x2={x + W + G - 4} y2={51} className="stroke-accent" strokeWidth={1.5} markerEnd="url(#arr)" />
                  {(s.buffer_after ?? 0) > 0 && (
                    <g>
                      <rect x={x + W + 8} y={96} width={G - 14} height={16} rx={4} className="fill-accent-soft stroke-accent/40" />
                      <text x={x + W + 8 + (G - 14) / 2} y={108} textAnchor="middle" className="fill-accent-2 text-[9px] font-semibold">
                        {s.buffer_after}
                      </text>
                    </g>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ArchitectureTab({ sim, set, d, customer }: TabProps) {
  const [sel, setSel] = useState<string | undefined>(sim.stations.find((s) => s.kind === 'laser')?.key ?? sim.stations[0]?.key);
  const st = sim.stations.find((s) => s.key === sel);
  const patch = (key: string, p: Partial<Station>) => set((s) => ({ ...s, stations: s.stations.map((x) => (x.key === key ? { ...x, ...p } : x)) }));
  const move = (i: number, dir: -1 | 1) =>
    set((s) => {
      const a = [...s.stations];
      const j = i + dir;
      if (j < 0 || j >= a.length) return s;
      [a[i], a[j]] = [a[j], a[i]];
      return { ...s, stations: a };
    });
  const remove = (key: string) => set((s) => (s.stations.length <= 1 ? s : { ...s, stations: s.stations.filter((x) => x.key !== key), selections: (s.selections ?? []).filter((x) => x.station_key !== key) }));
  const add = () =>
    set((s) => {
      let n = s.stations.length + 1;
      while (s.stations.some((x) => x.key === `st${n}`)) n++;
      return { ...s, stations: [...s.stations, { key: `st${n}`, name: `Station ${n}`, kind: 'process', time_s: null, parallel: 1, buffer_after: 0 }] };
    });
  const times = d.res.stations.map((r) => r.time);
  const lt = st?.kind === 'laser' ? laserTime(st) : null;
  return (
    <div className="space-y-4">
      <Card title="Equipment architecture" icon={Network} description="Material in → stations → material out. Click a station to edit it.">
        <FlowDiagram stations={sim.stations} times={times} bottleneck={d.cycle?.bottleneck.rs.station.key} selected={sel} onSelect={setSel} />
      </Card>
      <Card
        title="Stations"
        description="Time per part at one server. Enter the basis for every time — DEMO and assumptions are shown as such everywhere."
        actions={
          <Button size="sm" onClick={add}>
            <Plus className="size-3.5" aria-hidden /> Add station
          </Button>
        }
      >
        <Table head={['#', 'Station', 'Kind', 'Time / part (s)', 'Basis', 'Mean used', 'Parallel', 'Buffer after', '']} dense>
          {sim.stations.map((s, i) => {
            const r = d.res.stations[i];
            return (
              <tr key={s.key} className={clsx(sel === s.key && 'bg-accent-soft/50')}>
                <td className="num">{i + 1}</td>
                <td>
                  <TextInput label={`Station ${i + 1} name`} value={s.name} onChange={(v) => v.trim() && patch(s.key, { name: v.trim() })} className="w-44" />
                </td>
                <td>
                  <SmallSelect label={`Station ${i + 1} kind`} value={s.kind} options={STATION_KINDS} onChange={(v) => patch(s.key, { kind: v, ...(v === 'laser' && !s.laser ? { laser: { passes: 1 } } : {}) })} />
                </td>
                <td>{s.kind === 'laser' && r?.basis === 'CALCULATED' ? <span className="num text-meta">{num(r.time)} (calculated)</span> : <NumInput label={`Station ${i + 1} time`} min={0} value={s.time_s} onChange={(v) => patch(s.key, { time_s: v, time_basis: v == null ? undefined : s.time_basis ?? 'USER_INPUT' })} />}</td>
                <td>{s.kind === 'laser' && r?.basis === 'CALCULATED' ? <BasisBadge basis="CALCULATED" /> : <SmallSelect label={`Station ${i + 1} basis`} value={s.time_basis ?? ''} options={[{ value: '' as never, label: 'Not entered' }, ...BASES.filter((b) => b !== 'CALCULATED').map((b) => ({ value: b, label: b.replace('_', ' ').toLowerCase() }))]} onChange={(v) => patch(s.key, { time_basis: v || undefined })} />}</td>
                <td className="num text-meta">{r?.time != null ? num(distMean(r.time, s.dist)) : '—'}</td>
                <td>
                  <NumInput label={`Station ${i + 1} parallel servers`} min={1} value={s.parallel ?? 1} onChange={(v) => patch(s.key, { parallel: Math.max(1, Math.round(v ?? 1)) })} width="w-16" />
                </td>
                <td>
                  <NumInput label={`Station ${i + 1} buffer after`} min={0} value={s.buffer_after ?? 0} onChange={(v) => patch(s.key, { buffer_after: Math.max(0, Math.round(v ?? 0)) })} width="w-16" />
                </td>
                <td className="whitespace-nowrap">
                  <IconButton size="sm" label={`Edit details of ${s.name}`} icon={Zap} active={sel === s.key} onClick={() => setSel(s.key)} />
                  <IconButton size="sm" label={`Move ${s.name} up`} icon={ArrowUp} onClick={() => move(i, -1)} disabled={i === 0} />
                  <IconButton size="sm" label={`Move ${s.name} down`} icon={ArrowDown} onClick={() => move(i, 1)} disabled={i === sim.stations.length - 1} />
                  <IconButton size="sm" label={`Remove ${s.name}`} icon={Trash2} onClick={() => remove(s.key)} disabled={sim.stations.length <= 1} />
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
      {st && (
        <Card title={`${st.name} — details`} description="Variability feeds Monte Carlo and the discrete-event simulation; MTBF/MTTR feed availability and failures">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
            <Field label="Function">
              <TextInput label="Function" value={st.function} onChange={(v) => patch(st.key, { function: v || undefined })} className="w-full" />
            </Field>
            <Field label="Variability">
              <SmallSelect label="Distribution" value={st.dist?.type ?? 'fixed'} options={['fixed', 'uniform', 'triangular', 'normal'] as const} onChange={(v) => patch(st.key, { dist: v === 'fixed' ? undefined : { type: v } })} className="w-full" />
            </Field>
            {(st.dist?.type === 'uniform' || st.dist?.type === 'triangular') && (
              <>
                <Field label="Min (s)">
                  <NumInput label="Min" min={0} value={st.dist.min} onChange={(v) => patch(st.key, { dist: { ...st.dist!, min: v ?? undefined } })} width="w-full" />
                </Field>
                {st.dist.type === 'triangular' && (
                  <Field label="Most likely (s)">
                    <NumInput label="Mode" min={0} value={st.dist.mode} onChange={(v) => patch(st.key, { dist: { ...st.dist!, mode: v ?? undefined } })} width="w-full" />
                  </Field>
                )}
                <Field label="Max (s)">
                  <NumInput label="Max" min={0} value={st.dist.max} onChange={(v) => patch(st.key, { dist: { ...st.dist!, max: v ?? undefined } })} width="w-full" />
                </Field>
              </>
            )}
            {st.dist?.type === 'normal' && (
              <Field label="Std. deviation (s)">
                <NumInput label="SD" min={0} value={st.dist.sd} onChange={(v) => patch(st.key, { dist: { ...st.dist!, sd: v ?? undefined } })} width="w-full" />
              </Field>
            )}
            <Field label="Reject rate (0–1)">
              <NumInput label="Reject rate" min={0} max={1} value={st.reject_rate} onChange={(v) => patch(st.key, { reject_rate: v ?? undefined })} width="w-full" />
            </Field>
            <Field label="Rework share of rejects (0–1)">
              <NumInput label="Rework share" min={0} max={1} value={st.rework_rate} onChange={(v) => patch(st.key, { rework_rate: v ?? undefined })} width="w-full" />
            </Field>
            <Field label="MTBF (min)">
              <NumInput label="MTBF" min={0} value={st.mtbf_min} onChange={(v) => patch(st.key, { mtbf_min: v })} width="w-full" />
            </Field>
            <Field label="MTTR (min)">
              <NumInput label="MTTR" min={0} value={st.mttr_min} onChange={(v) => patch(st.key, { mttr_min: v })} width="w-full" />
            </Field>
            <Field label="Operator intervention p">
              <NumInput label="Intervention probability" min={0} max={1} value={st.intervention?.probability} onChange={(v) => patch(st.key, { intervention: v == null ? undefined : { probability: v, time_s: st.intervention?.time_s ?? 0 } })} width="w-full" />
            </Field>
            <Field label="Intervention time (s)">
              <NumInput label="Intervention time" min={0} value={st.intervention?.time_s} onChange={(v) => patch(st.key, { intervention: v == null ? undefined : { probability: st.intervention?.probability ?? 0, time_s: v } })} width="w-full" />
            </Field>
            <Field label="Power (kW)">
              <NumInput label="Station power" min={0} value={st.power_kw} onChange={(v) => patch(st.key, { power_kw: v })} width="w-full" />
            </Field>
            <Field label="Footprint (m²)">
              <NumInput label="Footprint" min={0} value={st.footprint_m2} onChange={(v) => patch(st.key, { footprint_m2: v })} width="w-full" />
            </Field>
            {!customer && (
              <Field label="Fabrication & integration cost">
                <NumInput label="Station cost" min={0} value={st.capex} onChange={(v) => patch(st.key, { capex: v })} width="w-full" />
              </Field>
            )}
            <Field label="Operator station">
              <SmallSelect label="Operator" value={st.operator ? 'yes' : 'no'} options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }] as const} onChange={(v) => patch(st.key, { operator: v === 'yes' })} className="w-full" />
            </Field>
          </div>
          {st.kind === 'laser' && (
            <div className="mt-4 border-t border-line pt-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="text-body font-semibold">Laser process inputs</h3>
                <Badge tone="info">time = area ÷ (hatch × speed) × passes + overhead — or path ÷ speed × passes + overhead</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
                {(
                  [
                    ['area_mm2', 'Area (mm²)'],
                    ['path_mm', 'Path (mm)'],
                    ['hatch_mm', 'Hatch (mm)'],
                    ['speed_mm_s', 'Speed (mm/s)'],
                    ['passes', 'Passes'],
                    ['jump_overhead_s', 'Overhead (s)'],
                    ['power_w', 'Power (W)'],
                    ['frequency_khz', 'Frequency (kHz)'],
                  ] as const
                ).map(([k, label]) => (
                  <Field key={k} label={label}>
                    <NumInput label={label} min={0} value={st.laser?.[k] ?? null} onChange={(v) => patch(st.key, { laser: { ...(st.laser ?? {}), [k]: v } })} width="w-full" />
                  </Field>
                ))}
              </div>
              {lt && <p className="mt-2 text-meta">{lt.time != null ? <>Laser time <strong className="num">{num(lt.time)} s</strong> (calculated)</> : <>Missing: {lt.missing.join(', ')}</>}</p>}
              <Notice tone="info">Power and frequency do not change the time here — the model does not know your process window. Enter the speed and passes your process window (DOE / POC) supports.</Notice>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
