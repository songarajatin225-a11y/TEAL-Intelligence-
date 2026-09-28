import clsx from 'clsx';
import { AlertOctagon, Box, Pause, Play, RotateCcw, Wrench, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../../components/RecordLink';
import { Badge, Button, Card, KV, Notice, Tabs } from '../../../components/ui';
import type { AnyRecord } from '../../../domain';
import type { Part, Verification } from '../../../domain/engineering';
import { productTypeLabel } from '../../../domain/engineering';
import { displaySpec, KEY_SPECS, readSpec } from '../../../services/eng/specs';
import { twinLayout } from '../../../services/sim/build';
import { originOf } from '../../../services/sim/supply';
import type { TabProps } from '../ScenarioPage';
import { money, num } from '../shared';

export const MACHINE_STATES = ['Idle', 'Loading', 'Aligning', 'Processing', 'Inspection', 'Unloading', 'Waiting', 'Fault', 'Maintenance', 'Emergency'] as const;
type MState = (typeof MACHINE_STATES)[number];
const KIND_STATE: Record<string, MState> = { load: 'Loading', fixture: 'Loading', align: 'Aligning', vision: 'Aligning', laser: 'Processing', process: 'Processing', assembly: 'Processing', test: 'Processing', motion: 'Processing', transfer: 'Processing', manual: 'Processing', inspect: 'Inspection', sort: 'Inspection', unload: 'Unloading', buffer: 'Waiting' };
type Panel = 'spec' | 'supplier' | 'bom' | 'requirements' | 'tests' | 'risks' | 'documents';

/**
 * §72 DIGITAL TWIN (2D SVG) + §73 machine-state simulation. Clicking an object opens its
 * specification, supplier, BOM, cost, requirements, tests, risks and documents.
 * A 3D (WebGL) view is not built — this 2D twin is the complete, fully functional view (§166).
 */
export default function TwinTab({ eng, sim, d, customer }: TabProps) {
  const layout = useMemo(() => twinLayout(sim.stations), [sim.stations]);
  const [sel, setSel] = useState<string>(layout.objects.find((o) => o.kind === 'station')?.id ?? 'frame');
  const [panel, setPanel] = useState<Panel>('spec');
  // machine-state simulation: one part walks the stations at scaled real time
  const [running, setRunning] = useState(false);
  const [override, setOverride] = useState<MState | null>(null);
  const [pos, setPos] = useState<{ i: number; t: number }>({ i: -1, t: 0 });
  const raf = useRef<number | null>(null);
  const times = d.res.stations.map((s) => s.time ?? 1);
  useEffect(() => {
    if (!running || override) return;
    let last: number | null = null;
    const tick = (now: number) => {
      const dt = last == null ? 0 : (now - last) / 1000;
      last = now;
      setPos((p) => {
        const i = p.i;
        const t = p.t + dt;
        if (i < 0) return { i: 0, t: 0 };
        if (t >= times[i]) return i + 1 >= times.length ? { i: -1, t: 0 } : { i: i + 1, t: 0 };
        return { i, t };
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [running, override, times]);
  const active = pos.i >= 0 ? sim.stations[pos.i] : undefined;
  const state: MState = override ?? (!running ? 'Idle' : active ? KIND_STATE[active.kind] ?? 'Processing' : 'Waiting');

  const obj = layout.objects.find((o) => o.id === sel);
  const stKey = obj?.stationKey;
  const parts: { role: string; part: Part & AnyRecord; qty: number }[] =
    obj?.kind === 'cabinet' || obj?.kind === 'operator' || obj?.kind === 'frame' || obj?.kind === 'conveyor'
      ? d.res.machineParts.filter((p) => (obj.kind === 'operator' ? ['hmi', 'light_curtain', 'door_switch', 'emergency_stop'].includes(p.part.product_type) : obj.kind === 'cabinet' ? !['hmi', 'enclosure'].includes(p.part.product_type) : obj.kind === 'frame' ? ['enclosure', 'frame'].includes(p.part.product_type) : false))
      : obj?.kind === 'enclosure'
        ? d.res.machineParts.filter((p) => p.part.product_type === 'enclosure')
        : (d.res.stations.find((s) => s.station.key === stKey)?.parts ?? []);
  const bomLines = d.bom.items.filter((i) => i.level === 'Component' && (stKey ? i.id.includes(`/${stKey}/`) : parts.some((p) => p.part.id === i.partId)));
  const reqs = (sim.requirement_ids ?? []).map((id) => eng.byId.get(id)).filter((x): x is AnyRecord => !!x);
  const tests = eng.records.filter((r) => r.entity === 'verification' && ((r as unknown as Verification).simulation_id === sim.id || (sim.requirement_ids ?? []).includes((r as unknown as Verification).requirement_id)));
  const station = sim.stations.find((s) => s.key === stKey);
  const risks = d.issues.filter((i) => (station && i.message.includes(station.name)) || parts.some((p) => i.message.includes(p.part.model_number)) || (obj?.kind === 'enclosure' && i.section === 'Safety'));
  const docs = parts.flatMap((p) => (p.part.documents ?? []).map((doc) => ({ ...doc, model: p.part.model_number })));

  const fillFor = (o: (typeof layout.objects)[number]) => {
    if (o.kind !== 'station') return undefined;
    if (override === 'Fault' || override === 'Emergency') return 'fill-bad/15 stroke-bad';
    if (override === 'Maintenance') return 'fill-warn/15 stroke-warn';
    if (active?.key === o.stationKey && running) return 'fill-ok/20 stroke-ok';
    return undefined;
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card
          title="Digital twin (2D)"
          icon={Box}
          description="Conceptual layout — click an object for its engineering data"
          actions={
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant={running ? 'secondary' : 'primary'} onClick={() => (setRunning(!running), setOverride(null))}>
                {running ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />} {running ? 'Pause' : 'Run cycle'}
              </Button>
              <Button size="sm" onClick={() => setOverride('Fault')}>
                <Zap className="size-3.5" aria-hidden /> Fault
              </Button>
              <Button size="sm" onClick={() => setOverride('Maintenance')}>
                <Wrench className="size-3.5" aria-hidden /> Maintenance
              </Button>
              <Button size="sm" onClick={() => (setOverride('Emergency'), setRunning(false))}>
                <AlertOctagon className="size-3.5" aria-hidden /> E-stop
              </Button>
              <Button size="sm" onClick={() => (setOverride(null), setRunning(false), setPos({ i: -1, t: 0 }))}>
                <RotateCcw className="size-3.5" aria-hidden /> Reset
              </Button>
            </div>
          }
        >
          <div className="scroll-thin overflow-x-auto" tabIndex={0}>
            <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="h-auto w-full min-w-[720px]" role="group" aria-label={`Digital twin, machine state ${state}`}>
              {layout.objects.map((o) => {
                const isSel = o.id === sel;
                const base = o.kind === 'frame' ? 'fill-panel-2 stroke-line-strong' : o.kind === 'conveyor' ? 'fill-ink/10 stroke-line-strong' : o.kind === 'enclosure' ? 'fill-none stroke-warn' : o.kind === 'cabinet' ? 'fill-info/10 stroke-info/60' : o.kind === 'operator' ? 'fill-accent-soft stroke-accent/50' : o.kind === 'buffer' ? 'fill-accent-soft stroke-accent/50' : 'fill-solid stroke-line-strong';
                return (
                  <g
                    key={o.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${o.label}${isSel ? ' (selected)' : ''}`}
                    onClick={() => setSel(o.id)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(o.id))}
                    className="cursor-pointer focus:outline-none [&:focus-visible>rect]:stroke-accent"
                  >
                    <rect x={o.x} y={o.y} width={o.w} height={o.h} rx={o.kind === 'enclosure' ? 12 : 8} className={clsx(fillFor(o) ?? base, 'transition-[fill,stroke] duration-200 motion-reduce:transition-none')} strokeWidth={isSel ? 2.5 : 1.2} strokeDasharray={o.kind === 'enclosure' ? '6 4' : undefined} />
                    {o.kind !== 'frame' && o.kind !== 'enclosure' && (
                      <text x={o.x + 8} y={o.y + (o.kind === 'station' ? 18 : o.h / 2 + 4)} className={clsx('text-[10px]', o.kind === 'station' ? 'fill-ink font-semibold' : 'fill-ink-2')}>
                        {o.label.length > (o.kind === 'station' ? 17 : 40) ? `${o.label.slice(0, o.kind === 'station' ? 16 : 39)}…` : o.label}
                      </text>
                    )}
                    {o.kind === 'station' && (
                      <text x={o.x + 8} y={o.y + 62} className="fill-ink-3 text-[9.5px]">
                        {num(d.res.stations.find((s) => s.station.key === o.stationKey)?.time)} s
                      </text>
                    )}
                    {o.kind === 'enclosure' && (
                      <text x={o.x + 6} y={o.y + o.h - 6} className="fill-warn text-[9px]">
                        laser enclosure
                      </text>
                    )}
                  </g>
                );
              })}
              {running && active && !override && (
                <circle cx={(layout.objects.find((o) => o.stationKey === active.key && o.kind === 'station')?.x ?? 0) + 60} cy={161} r={7} className="fill-accent stroke-solid" strokeWidth={2} />
              )}
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-live="polite">
            <span className="text-meta font-medium">Machine state:</span>
            {MACHINE_STATES.map((s) => (
              <Badge key={s} tone={s === state ? (s === 'Fault' || s === 'Emergency' ? 'bad' : s === 'Maintenance' ? 'warn' : 'accent') : 'neutral'} className={clsx(s !== state && 'opacity-50')}>
                {s}
              </Badge>
            ))}
          </div>
          <p className="mt-2 text-micro text-ink-3">The cycle view walks one part through the stations at their real station times. A 3D (WebGL) twin is not built; this 2D view is complete and needs no GPU.</p>
        </Card>
        <Card title={obj?.label ?? 'Select an object'} description={obj?.kind === 'station' ? `Station · ${station?.kind}` : obj?.kind}>
          <Tabs<Panel>
            label="Object data"
            value={panel}
            onChange={setPanel}
            tabs={[
              { key: 'spec', label: 'Specification' },
              ...(customer ? [] : [{ key: 'supplier' as Panel, label: 'Supplier' }, { key: 'bom' as Panel, label: 'BOM · cost' }]),
              { key: 'requirements', label: 'Requirements', count: reqs.length },
              { key: 'tests', label: 'Tests', count: tests.length },
              ...(customer ? [] : [{ key: 'risks' as Panel, label: 'Risks', count: risks.length }]),
              { key: 'documents', label: 'Documents', count: docs.length },
            ]}
          />
          {panel === 'spec' &&
            (parts.length ? (
              <ul className="space-y-3">
                {parts.map((p) => (
                  <li key={`${p.role}-${p.part.id}`}>
                    <div className="font-medium">
                      {p.role}: {customer ? productTypeLabel(p.part.product_type) : p.part.model_number}
                      {p.qty > 1 ? ` × ${p.qty}` : ''}
                    </div>
                    <KV items={(KEY_SPECS[p.part.product_type] ?? p.part.specs.map((s) => s.spec).slice(0, 4)).map((k) => [eng.defs.get(k)?.name ?? k, displaySpec(readSpec(p.part, k, eng.defs))])} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-meta text-ink-3">{station ? `No components selected for ${station.name}.` : 'No components recorded for this object.'}</p>
            ))}
          {panel === 'supplier' && (
            <ul className="space-y-1 text-meta">
              {parts.map((p) => {
                const o = originOf(p.part, eng.byId);
                return (
                  <li key={p.part.id}>
                    <Link to={recordPath(p.part.id)} className="text-accent-2 hover:underline">
                      {p.part.model_number}
                    </Link>{' '}
                    — {o.manufacturer} {o.country ? `(${o.country})` : ''} <Badge tone={o.origin === 'Imported' ? 'warn' : o.origin === 'Local' ? 'ok' : 'neutral'}>{o.origin}</Badge>
                  </li>
                );
              })}
              {!parts.length && <li className="text-ink-3">No supplier data for this object.</li>}
            </ul>
          )}
          {panel === 'bom' && (
            <ul className="space-y-1 text-meta">
              {bomLines.map((b) => (
                <li key={b.id} className="flex justify-between gap-2">
                  <span>{b.name}</span>
                  <span className="num">{b.unitCost != null ? `${b.currency} ${b.unitCost.toLocaleString('en-IN')} × ${b.quantity}` : 'No price'}</span>
                </li>
              ))}
              <li className="border-t border-line pt-1 font-semibold">Converted total: {money(bomLines.some((b) => b.extended == null && b.unitCost != null) ? null : bomLines.reduce((s, b) => s + (b.extended ?? 0), 0), d.bom.currency)}</li>
            </ul>
          )}
          {panel === 'requirements' && (reqs.length ? <ul className="space-y-1 text-meta">{reqs.map((r) => <li key={r.id}><Link to={recordPath(r.id)} className="text-accent-2 hover:underline">{String(r.code ?? r.id)}</Link> — {r.name}</li>)}</ul> : <p className="text-meta text-ink-3">No requirements linked to this equipment.</p>)}
          {panel === 'tests' && (tests.length ? <ul className="space-y-1 text-meta">{tests.map((t) => <li key={t.id}><Link to={recordPath(t.id)} className="text-accent-2 hover:underline">{t.name}</Link> <Badge>{String((t as unknown as Verification).result)}</Badge></li>)}</ul> : <p className="text-meta text-ink-3">No verification planned.</p>)}
          {panel === 'risks' && (risks.length ? <ul className="list-disc space-y-1 pl-5 text-meta">{risks.map((r, i) => <li key={i}><Badge tone={r.severity === 'blocker' ? 'bad' : r.severity === 'major' ? 'warn' : 'neutral'}>{r.severity}</Badge> {r.message}</li>)}</ul> : <p className="text-meta text-ink-3">The design review found no issue for this object.</p>)}
          {panel === 'documents' && (docs.length ? <ul className="space-y-1 text-meta">{docs.map((doc, i) => <li key={i}>{doc.kind}: {doc.title} <span className="text-ink-3">({doc.model})</span></li>)}</ul> : <p className="text-meta text-ink-3">No documents recorded.</p>)}
        </Card>
      </div>
      {override && <Notice tone={override === 'Maintenance' ? 'draft' : 'warn'}>Machine state forced to {override}. Production impact of faults is quantified under Faults · maintenance · energy.</Notice>}
    </div>
  );
}
