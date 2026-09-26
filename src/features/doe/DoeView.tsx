import { useEffect, useMemo, useState } from 'react';
import { fluence, lineEnergy, pulseEnergy, pulseOverlap, spotDiameter } from '../../calculations/laser';
import { capability, fullFactorialRuns, MIN_SAMPLES } from '../../calculations/quality';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Button, Card, Field, Input, Notice, Table, Unknown } from '../../components/ui';
import { CalcValue } from '../../components/why';
import type { Doe, LaserSource, Optic, Poc } from '../../domain/entities';
import { useData, type Rec } from '../../hooks/useData';
import { repo } from '../../repositories';
import { download, stamp, toCsv } from '../../utils/export';

type Run = Doe['runs'][number];

export function generateRuns(factors: Doe['factors'], responses: Doe['responses'], replicates: number): Run[] {
  const runs: Run[] = [];
  const rec = (i: number, acc: Record<string, number | string>) => {
    if (i === factors.length) {
      for (let r = 1; r <= replicates; r++) runs.push({ run: runs.length + 1, replicate: r, settings: acc, results: Object.fromEntries(responses.map((x) => [x.name, null])) });
      return;
    }
    for (const l of factors[i].levels) rec(i + 1, { ...acc, [factors[i].name]: l });
  };
  if (factors.length) rec(0, {});
  return runs;
}

const find = (s: Record<string, number | string>, re: RegExp) => {
  const k = Object.keys(s).find((x) => re.test(x));
  return k ? Number(s[k]) : null;
};

/** DOE ENGINE (spec §36): factors, levels, responses, runs, results, process window, per-run calculations. */
export default function DoeView({ record }: { record: Rec }) {
  const saved = record as unknown as Doe & Rec;
  const { byId } = useData();
  const [d, setD] = useState<Doe>(saved);
  const [dirty, setDirty] = useState(false);
  const [factorText, setFactorText] = useState(saved.factors.map((f) => `${f.name} | ${f.unit ?? ''} | ${f.levels.join(', ')}`).join('\n'));
  useEffect(() => {
    setD(saved);
    setDirty(false);
  }, [saved]);
  const poc = d.poc_id ? (byId.get(d.poc_id) as unknown as Poc | undefined) : undefined;
  const src = poc?.source_id ? (byId.get(poc.source_id) as unknown as LaserSource | undefined) : undefined;
  const optic = poc?.optic_id ? (byId.get(poc.optic_id) as unknown as Optic | undefined) : undefined;
  const spot = src && optic ? spotDiameter({ wavelength_nm: src.wavelength.value, focal_mm: optic.focal_length_mm, m2: src.m2, beam_mm: src.beam_diameter_mm }) : null;
  const measured = d.runs.filter((r) => Object.values(r.results).some((v) => v != null));

  const analysis = useMemo(() => {
    return d.responses.map((resp) => {
      const vals = d.runs.map((r) => r.results[resp.name]).filter((v): v is number => v != null);
      const effects = d.factors.map((f) => ({
        factor: f.name,
        levels: f.levels.map((l) => {
          const xs = d.runs.filter((r) => r.settings[f.name] === l && r.results[resp.name] != null).map((r) => r.results[resp.name] as number);
          return { level: l, n: xs.length, mean: xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null };
        }),
      }));
      const inSpec = d.runs.filter((r) => {
        const v = r.results[resp.name];
        if (v == null) return false;
        if (resp.lsl != null && v < resp.lsl) return false;
        if (resp.usl != null && v > resp.usl) return false;
        return resp.lsl != null || resp.usl != null;
      });
      const window = d.factors.map((f) => {
        const lv = inSpec.map((r) => r.settings[f.name]).filter((x) => typeof x === 'number') as number[];
        return { factor: f.name, unit: f.unit, min: lv.length ? Math.min(...lv) : null, max: lv.length ? Math.max(...lv) : null };
      });
      return { resp, n: vals.length, effects, inSpec: inSpec.length, window, cap: capability(vals, { lsl: resp.lsl, usl: resp.usl }) };
    });
  }, [d]);

  const setResult = (i: number, name: string, v: string) => {
    const runs = [...d.runs];
    runs[i] = { ...runs[i], results: { ...runs[i].results, [name]: v === '' ? null : Number(v) } };
    setD({ ...d, runs });
    setDirty(true);
  };
  const applyFactors = () => {
    const factors = factorText
      .split('\n')
      .map((l) => l.split('|').map((x) => x.trim()))
      .filter((p) => p[0])
      .map(([name, unit, levels]) => ({ name, unit: unit || undefined, levels: (levels ?? '').split(',').map((x) => x.trim()).filter(Boolean).map((x) => (Number.isFinite(Number(x)) ? Number(x) : x)) }))
      .filter((f) => f.levels.length);
    if (measured.length && !window.confirm('Regenerating runs discards recorded results. Continue?')) return;
    setD({ ...d, factors, runs: generateRuns(factors, d.responses, d.replicates) });
    setDirty(true);
  };
  const save = async () => {
    const { __origin, __dataset, ...clean } = d as Doe & { __origin?: unknown; __dataset?: unknown };
    void __origin;
    void __dataset;
    await repo().workspace.save(clean as unknown as Record<string, unknown>, 'Recorded DOE results');
    setDirty(false);
  };

  return (
    <div className="space-y-3">
      <Card
        title={
          <span className="flex items-center gap-2">
            DOE plan & results {dirty && <Badge tone="draft">unsaved</Badge>}
          </span>
        }
        actions={
          <>
            <Button size="sm" onClick={() => download(`teal-doe-${d.id}-${stamp()}.csv`, toCsv(d.runs.map((r) => ({ run: r.run, replicate: r.replicate ?? 1, ...r.settings, ...r.results }))), 'text/csv')}>
              Export run sheet
            </Button>
            <Button size="sm" variant="primary" disabled={!dirty} onClick={() => void save()}>
              Save
            </Button>
          </>
        }
      >
        <div className="mb-2 text-body text-ink-2">
          POC: {d.poc_id ? <RecordLink id={d.poc_id} /> : '—'} · Design: full factorial · {d.factors.length} factor(s) · {d.replicates} replicate(s) · <b>{fullFactorialRuns(d.factors.map((f) => f.levels.length), d.replicates)}</b> runs · measured {measured.length}
        </div>
        <details className="mb-2">
          <summary className="cursor-pointer text-body text-accent-2">Edit factors & levels</summary>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
            <Field label="One factor per line: name | unit | level1, level2, …" htmlFor="doe-f">
              <textarea id="doe-f" className="min-h-[80px] w-full rounded-md border border-line bg-panel p-2 font-mono text-meta" value={factorText} onChange={(e) => setFactorText(e.target.value)} />
            </Field>
            <div className="flex flex-col gap-2">
              <Field label="Replicates" htmlFor="doe-r">
                <Input id="doe-r" type="number" min={1} value={d.replicates} onChange={(e) => (setD({ ...d, replicates: Math.max(1, Number(e.target.value) || 1) }), setDirty(true))} className="w-24" />
              </Field>
              <Button onClick={applyFactors}>Regenerate runs</Button>
            </div>
          </div>
        </details>
        {!spot && <Notice tone="info">Link a laser source and optic on the POC to get per-run fluence, pulse overlap and line energy.</Notice>}
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-meta">
            <thead className="sticky top-0 bg-panel">
              <tr className="text-left text-micro uppercase text-ink-3">
                <th className="px-1">Run</th>
                {d.factors.map((f) => (
                  <th key={f.name} className="px-1">
                    {f.name} {f.unit && `(${f.unit})`}
                  </th>
                ))}
                {spot && (
                  <>
                    <th className="px-1">Overlap</th>
                    <th className="px-1">Fluence</th>
                    <th className="px-1">Line energy</th>
                  </>
                )}
                {d.responses.map((r) => (
                  <th key={r.name} className="bg-accent-soft/40 px-1">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.runs.map((r, i) => {
                const P = find(r.settings, /power/i);
                const v = find(r.settings, /speed/i);
                const f = find(r.settings, /freq/i);
                const pe = P != null && f != null ? pulseEnergy({ power_w: P, rep_khz: f }) : null;
                return (
                  <tr key={r.run} className="border-t border-line/60">
                    <td className="num px-1">
                      {r.run}
                      {r.replicate && d.replicates > 1 ? `.${r.replicate}` : ''}
                    </td>
                    {d.factors.map((fc) => (
                      <td key={fc.name} className="num px-1">
                        {String(r.settings[fc.name])}
                      </td>
                    ))}
                    {spot && (
                      <>
                        <td className="px-1">{v != null && f != null ? <CalcValue c={pulseOverlap({ speed_mm_s: v, rep_khz: f, spot_um: spot.value })} digits={2} /> : '—'}</td>
                        <td className="px-1">{pe ? <CalcValue c={fluence({ pulse_energy_mj: pe.value, spot_um: spot.value })} digits={2} /> : '—'}</td>
                        <td className="px-1">{P != null && v != null ? <CalcValue c={lineEnergy({ power_w: P, speed_mm_s: v })} digits={2} /> : '—'}</td>
                      </>
                    )}
                    {d.responses.map((resp) => (
                      <td key={resp.name} className="px-1">
                        <Input aria-label={`${resp.name} run ${r.run}`} type="number" step="any" value={r.results[resp.name] ?? ''} placeholder="—" onChange={(e) => setResult(i, resp.name, e.target.value)} className="w-24 py-0.5 text-right" />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Analysis (measured results only)">
        {analysis.map((a) => (
          <div key={a.resp.name} className="mb-3">
            <div className="mb-1 font-semibold">
              {a.resp.name} {a.resp.unit && `(${a.resp.unit})`} — {a.n} measurement(s); spec {a.resp.lsl ?? '−∞'} … {a.resp.usl ?? '+∞'}
            </div>
            {a.n === 0 ? (
              <p className="text-ink-3">No results recorded — no effects, window or capability are shown. Nothing is estimated.</p>
            ) : (
              <>
                <Table head={['Factor', 'Level → mean response (n)']} dense>
                  {a.effects.map((e) => (
                    <tr key={e.factor}>
                      <td>{e.factor}</td>
                      <td>{e.levels.map((l) => `${l.level} → ${l.mean == null ? '—' : l.mean.toFixed(3)} (${l.n})`).join(' · ')}</td>
                    </tr>
                  ))}
                </Table>
                <div className="mt-1 text-body">
                  Process window ({a.inSpec} run(s) in spec):{' '}
                  {a.resp.lsl == null && a.resp.usl == null ? <Unknown label="set LSL/USL on the response to define a window" /> : a.window.map((w) => `${w.factor} ${w.min ?? '—'}–${w.max ?? '—'} ${w.unit ?? ''}`).join(' · ')}
                </div>
                <div className="text-meta text-ink-3">Capability: {a.cap.status === 'CALCULATED' ? `Ppk ${a.cap.ppk.value?.toFixed(2)} (n=${a.cap.n})` : `${a.cap.message} (need ≥ ${MIN_SAMPLES} results)`}</div>
              </>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
