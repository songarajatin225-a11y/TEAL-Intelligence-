import clsx from 'clsx';
import { Minus, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { recordPath } from '../../components/RecordLink';
import { Badge, Button, Notice } from '../../components/ui';
import type { AnyRecord } from '../../domain';
import { BUILD_AUTOMATION, BUILD_PROCESSES, DISCIPLINES, disciplineOf, productTypeLabel, type Part, type TwinBuild } from '../../domain/engineering';
import { originOf } from '../../services/sim/supply';
import { architectScenario, buildProcess, poolOf, stationDiff } from '../../services/twin/architect';
import type { TabProps } from '../studio/ScenarioPage';
import { SmallSelect } from '../studio/tabs/edit';

type P = Part & AnyRecord;

/*
 * BUILDER (component-driven machine). The engineer picks the components; the architect decides the
 * stations and says why. In "build from components" mode every change here — swap, add, remove,
 * quantity, process, automation — rebuilds the machine, and the 3D view, simulation and BOM follow.
 */
export function BuilderPanel({ eng, sim, set, customer }: Pick<TabProps, 'eng' | 'sim' | 'set' | 'customer'>) {
  const build: TwinBuild = useMemo(() => sim.twin?.build ?? { mode: 'template' }, [sim.twin?.build]);
  const components = build.mode === 'components';
  const pool = useMemo(() => poolOf(sim, eng.byId), [sim, eng.byId]);
  // the architecture of the current pool — the live result in component mode, a preview in template mode
  const plan = useMemo(() => architectScenario({ ...sim, twin: { ...sim.twin, build: { ...build, mode: 'components' } } }, eng.byId), [sim, build, eng.byId]);
  const diff = useMemo(() => stationDiff(sim.stations, plan.sim.stations), [sim.stations, plan]);
  const inferred = buildProcess(sim, eng.byId);
  const tpl = sim.template_id ? eng.byId.get(sim.template_id) : undefined;
  const [addType, setAddType] = useState('');
  const [addPart, setAddPart] = useState('');

  const setBuild = (patch: Partial<TwinBuild>) => set((s) => ({ ...s, twin: { ...s.twin, build: { ...(s.twin?.build ?? { mode: 'template' }), ...patch } } }));
  const swap = (from: string, to: string) => set((s) => ({ ...s, selections: (s.selections ?? []).map((x) => (x.part_id === from ? { ...x, part_id: to } : x)) }));
  const remove = (id: string) => set((s) => ({ ...s, selections: (s.selections ?? []).filter((x) => x.part_id !== id) }));
  const bump = (id: string, by: number) =>
    set((s) => {
      const list = [...(s.selections ?? [])];
      const i = list.findIndex((x) => x.part_id === id);
      if (i < 0) return s;
      const q = (list[i].quantity ?? 1) + by;
      if (q < 1) list.splice(i, 1);
      else list[i] = { ...list[i], quantity: q };
      return { ...s, selections: list };
    });
  const add = () => {
    const p = eng.byId.get(addPart) as P | undefined;
    if (!p) return;
    set((s) => ({ ...s, selections: [...(s.selections ?? []), { station_key: '_machine', role: productTypeLabel(p.product_type), part_id: p.id }] }));
    setAddPart('');
  };

  const types = useMemo(() => [...new Set(eng.parts.map((p) => p.product_type))].sort((a, b) => DISCIPLINES.indexOf(disciplineOf(a) as never) - DISCIPLINES.indexOf(disciplineOf(b) as never) || productTypeLabel(a).localeCompare(productTypeLabel(b))), [eng.parts]);
  const ofType = (t: string) => eng.parts.filter((p) => p.product_type === t);
  const grouped = useMemo(() => {
    const g = new Map<string, { part: P; qty: number }[]>();
    for (const x of pool) {
      const d = disciplineOf(x.part.product_type);
      (g.get(d) ?? g.set(d, []).get(d)!).push(x);
    }
    return [...g.entries()].sort((a, b) => DISCIPLINES.indexOf(a[0] as never) - DISCIPLINES.indexOf(b[0] as never));
  }, [pool]);
  const placedAt = (id: string) => (sim.selections ?? []).filter((x) => x.part_id === id).map((x) => (x.station_key === '_machine' ? 'machine' : sim.stations.find((s) => s.key === x.station_key)?.name ?? x.station_key));
  const modelOf = (id: string) => (eng.byId.get(id) as P | undefined)?.model_number ?? id;
  const a = plan.arch;
  const gaps = a.notes.filter((x) => x.kind === 'gap');
  const infos = a.notes.filter((x) => x.kind === 'info');

  return (
    <div className="space-y-3">
      <fieldset className="flex flex-wrap items-center gap-2" aria-describedby="builder-mode-help">
        <legend className="sr-only">How the stations are decided</legend>
        {(['template', 'components'] as const).map((m) => (
          <label key={m} className={clsx('flex cursor-pointer items-center gap-2 rounded-control border px-3 py-1.5 text-meta', build.mode === m ? 'border-accent bg-accent/10 text-ink' : 'border-line text-ink-2 hover:bg-hover')}>
            <input type="radio" name="builder-mode" value={m} checked={build.mode === m} onChange={() => setBuild({ mode: m })} className="accent-[var(--c-accent)]" />
            {m === 'template' ? `Template stations${tpl ? ` — “${tpl.name}”` : ''}` : 'Build from components'}
          </label>
        ))}
        <span id="builder-mode-help" className="text-micro text-ink-3">
          {components ? 'The builder decides the stations from the components below — change a component and the machine, 3D view, simulation and BOM follow.' : 'Stations are fixed by the template; component changes only change the parts in them.'}
        </span>
      </fieldset>

      <div className="flex flex-wrap items-end gap-3 text-meta">
        <label className="grid gap-1">
          <span className="text-micro text-ink-3">Process</span>
          <SmallSelect label="Process" value={build.process ?? ''} options={[{ value: '' as never, label: inferred.process && inferred.basis !== 'stated' ? `From the ${inferred.basis}: ${inferred.process}` : 'Not stated' }, ...BUILD_PROCESSES.map((p) => ({ value: p, label: p }))]} onChange={(v) => setBuild({ process: (v || undefined) as TwinBuild['process'] })} className="w-56" />
        </label>
        <label className="grid gap-1">
          <span className="text-micro text-ink-3">Automation</span>
          <SmallSelect label="Automation" value={build.automation ?? ''} options={[{ value: '' as never, label: `Inferred: ${a.automation}` }, ...BUILD_AUTOMATION.map((x) => ({ value: x, label: x }))]} onChange={(v) => setBuild({ automation: (v || undefined) as TwinBuild['automation'] })} className="w-48" />
        </label>
        <label className="grid gap-1">
          <span className="text-micro text-ink-3">Inline inspection</span>
          <SmallSelect label="Inline inspection" value={build.inspect ?? 'auto'} options={[{ value: 'auto', label: 'Decide from the process' }, { value: 'yes', label: 'Required' }, { value: 'no', label: 'Not required' }]} onChange={(v) => setBuild({ inspect: v as TwinBuild['inspect'] })} className="w-52" />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------------- components */}
        <section aria-labelledby="builder-components">
          <h4 id="builder-components" className="mb-1.5 text-meta font-semibold text-ink">
            Components <span className="font-normal text-ink-3">({pool.reduce((n, x) => n + x.qty, 0)})</span>
          </h4>
          {!pool.length && <p className="text-meta text-ink-3">No components yet — add them below and the machine is built from them.</p>}
          <div className="space-y-2">
            {grouped.map(([disc, list]) => (
              <div key={disc}>
                <div className="text-micro font-semibold uppercase tracking-wider text-ink-3">{disc}</div>
                <ul className="divide-y divide-line rounded-control border border-line">
                  {list.map(({ part, qty }) => {
                    const alts = ofType(part.product_type);
                    return (
                      <li key={part.id} className="flex flex-wrap items-center gap-2 px-2 py-1.5 text-meta">
                        <span className="w-28 shrink-0 text-ink-3">{productTypeLabel(part.product_type)}</span>
                        <Link to={recordPath(part.id)} className="font-mono text-accent-2 hover:underline">
                          {part.model_number}
                        </Link>
                        {!customer && <span className="text-micro text-ink-3">{originOf(part, eng.byId).manufacturer}</span>}
                        {part.data_type === 'DEMO' && <Badge tone="demo">DEMO</Badge>}
                        <span className="text-micro text-ink-3">→ {placedAt(part.id).join(', ')}</span>
                        <span className="ml-auto flex items-center gap-1">
                          {alts.length > 1 && <SmallSelect label={`Swap ${part.model_number}`} value={part.id} options={alts.map((x) => ({ value: x.id, label: `Swap → ${x.model_number}` }))} onChange={(v) => v !== part.id && swap(part.id, v)} className="w-40" />}
                          <Button size="sm" variant="ghost" aria-label={`One less ${part.model_number}`} onClick={() => bump(part.id, -1)}>
                            <Minus className="size-3.5" />
                          </Button>
                          <span className="num w-5 text-center" aria-label={`Quantity ${qty}`}>
                            {qty}
                          </span>
                          <Button size="sm" variant="ghost" aria-label={`One more ${part.model_number}`} onClick={() => bump(part.id, 1)}>
                            <Plus className="size-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" aria-label={`Remove ${part.model_number}`} onClick={() => remove(part.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SmallSelect label="Component type to add" value={addType} options={[{ value: '', label: 'Add a component…' }, ...types.map((t) => ({ value: t, label: `${disciplineOf(t)} · ${productTypeLabel(t)}` }))]} onChange={(v) => (setAddType(v), setAddPart(''))} className="w-56" />
            {addType && <SmallSelect label="Component to add" value={addPart} options={[{ value: '', label: 'Choose the part…' }, ...ofType(addType).map((p) => ({ value: p.id, label: `${p.model_number}${p.data_type === 'DEMO' ? ' (DEMO)' : ''}` }))]} onChange={setAddPart} className="w-48" />}
            <Button size="sm" disabled={!addPart} onClick={add}>
              <Plus className="size-3.5" /> Add
            </Button>
          </div>
          {!components && <p className="mt-1 text-micro text-ink-3">In template mode an added component is listed at machine level; switch to “Build from components” to let the builder place it.</p>}
        </section>

        {/* ---------------- decisions */}
        <section aria-labelledby="builder-decisions">
          <h4 id="builder-decisions" className="mb-1.5 flex items-center gap-1.5 text-meta font-semibold text-ink">
            <Sparkles className="size-4 text-accent-2" aria-hidden /> {components ? 'How the builder decided the machine' : 'If built from these components'}
          </h4>
          {!components && (diff.added.length || diff.removed.length || diff.changed.length) ? (
            <div className="mb-2 rounded-control border border-line p-2 text-meta">
              <p className="text-ink-2">Compared with the template stations:</p>
              <ul className="mt-1 space-y-0.5">
                {diff.added.map((s) => (
                  <li key={`a${s.key}`}>
                    <Badge tone="ok">added</Badge> {s.name}
                  </li>
                ))}
                {diff.removed.map((s) => (
                  <li key={`r${s.key}`}>
                    <Badge tone="warn">removed</Badge> {s.name}
                  </li>
                ))}
                {diff.changed.map((c) => (
                  <li key={`c${c.key}`}>
                    <Badge tone="info">changed</Badge> {c.from} → {c.to}
                  </li>
                ))}
              </ul>
              <Button size="sm" className="mt-2" onClick={() => setBuild({ mode: 'components' })}>
                Build from components
              </Button>
            </div>
          ) : null}
          <ol className="space-y-1.5" aria-label="Station decisions">
            {a.decisions.map((d, i) => (
              <li key={d.key} className="rounded-control border border-line px-2 py-1.5 text-meta">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="num text-ink-3">{i + 1}</span>
                  <span className="font-semibold text-ink">{d.name}</span>
                  <span className="text-micro text-ink-3">{d.rule}</span>
                </div>
                <p className="text-ink-2">{d.because}</p>
                {d.evidence.length > 0 && <p className="text-micro text-ink-3">Components: {d.evidence.map(modelOf).join(', ')}</p>}
              </li>
            ))}
          </ol>
          {a.machineLevel.length > 0 && <p className="mt-1.5 text-micro text-ink-3">Machine level (controls, safety, electrical): {a.machineLevel.map(modelOf).join(', ')}</p>}
          {gaps.length > 0 && (
            <div className="mt-2">
              <Notice tone="warn">
                <div>
                  <p className="font-semibold">{`${gaps.length} gap${gaps.length > 1 ? 's' : ''} in the component set`}</p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    {gaps.map((g) => (
                      <li key={g.text}>{g.text}</li>
                    ))}
                  </ul>
                </div>
              </Notice>
            </div>
          )}
          {infos.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-micro text-ink-3">
              {infos.map((g) => (
                <li key={g.text}>{g.text}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-micro text-ink-3">Rule-based engineering heuristics — deterministic and explained, not a language model. Station times are never invented: times you entered stay with their station. CONCEPTUAL 3D MODEL.</p>
        </section>
      </div>
    </div>
  );
}
