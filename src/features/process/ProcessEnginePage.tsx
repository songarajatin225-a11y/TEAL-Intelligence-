import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { absorptionBand, depthOfFocus, spotDiameter, thermalDiffusionLength } from '../../calculations/laser';
import { RecordLink } from '../../components/RecordLink';
import { Badge, Card, Field, Notice, PageHeader, Select, Table, Unknown } from '../../components/ui';
import { CalcValue } from '../../components/why';
import { PROCESSES, type Application, type LaserSource, type Material, type Optic } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';
import { search, type Hit } from '../../services/search';
import { hitLink } from '../knowledge/SearchPage';

/**
 * PROCESS ENGINE (spec §34): material → wavelength → absorption → thermal budget → pulse regime →
 * spot → DOF → candidates. Output is PROCESS CANDIDATES, never a guaranteed process.
 */
export default function ProcessEnginePage() {
  const [params] = useSearchParams();
  const materials = useRecords<Material>('material');
  const sources = useRecords<LaserSource>('laser_source').filter((s) => s.kind === 'class');
  const optics = useRecords<Optic>('optic');
  const apps = useRecords<Application>('application');
  const [mat, setMat] = useState(params.get('material') ?? 'mat-cu');
  const [proc, setProc] = useState<string>('Marking');
  const [opt, setOpt] = useState('opt-f163');
  const [refs, setRefs] = useState<Hit[]>([]);
  const m = materials.find((x) => x.id === mat);
  const o = optics.find((x) => x.id === opt);
  const ranked = useMemo(
    () =>
      sources
        .map((s) => {
          const band = absorptionBand(s.wavelength.value ?? 1064);
          const abs = m?.absorption?.[band] ?? null;
          const tau = s.pulse_duration?.unit === 'ns' ? s.pulse_duration.value : null;
          const diff = tau != null && m ? thermalDiffusionLength({ k: m.thermal_conductivity?.value, rho: m.density?.value, cp: m.specific_heat?.value, pulse_ns: tau }) : null;
          const spot = spotDiameter({ wavelength_nm: s.wavelength.value, focal_mm: o?.focal_length_mm, m2: s.m2, beam_mm: s.beam_diameter_mm });
          const dof = depthOfFocus({ spot_um: spot.value, wavelength_nm: s.wavelength.value, m2: s.m2 });
          const regime = s.mode === 'cw' ? 'CW — thermal (conduction/keyhole by intensity)' : tau != null && tau < 0.001 ? 'fs — non-thermal ablation' : tau != null && tau < 1 ? 'ps — cold ablation, minimal HAZ' : tau != null && tau > 1000 ? 'QCW — long-pulse thermal' : 'ns — photothermal ablation';
          const lib = apps.filter((a) => a.material_ids?.includes(mat) && a.recommended_source_id === s.id && a.process === proc);
          return { s, band, abs, diff, spot, dof, regime, lib };
        })
        .sort((a, b) => (b.lib.length - a.lib.length) * 10 + ((b.abs ?? -1) - (a.abs ?? -1))),
    [sources, m, o, apps, mat, proc],
  );
  useEffect(() => {
    if (!m) return;
    search({ text: `${m.name} ${proc}`, partitions: ['knowledge'], limit: 8 })
      .then(setRefs)
      .catch(() => setRefs([]));
  }, [m, proc]);
  const libApps = apps.filter((a) => a.material_ids?.includes(mat) && a.process === proc);
  return (
    <div>
      <PageHeader eyebrow="Process" title="Process Engineering" subtitle="Material → wavelength → absorption → thermal budget → pulse regime → spot → DOF → throughput → cost per good part. Candidates to test in a POC — not a guaranteed process." />
      <Card className="mb-3">
        <div className="flex flex-wrap gap-3">
          <Field label="Material" htmlFor="pe-m">
            <Select id="pe-m" value={mat} onChange={(e) => setMat(e.target.value)} className="w-64">
              {materials.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Process" htmlFor="pe-p">
            <Select id="pe-p" value={proc} onChange={(e) => setProc(e.target.value)} className="w-48">
              {PROCESSES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Objective (for spot / DOF)" htmlFor="pe-o">
            <Select id="pe-o" value={opt} onChange={(e) => setOpt(e.target.value)} className="w-48">
              {optics.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>
      {m && !m.absorption && <Notice tone="warn">No absorption data for {m.name}: wavelength ranking is UNKNOWN. The engine does not guess material properties.</Notice>}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_360px]">
        <Card title="Process candidates by source class">
          <Table head={['Source', 'λ band', 'Absorptance', 'Regime', 'Diffusion / pulse', 'Spot', 'DOF', 'TEAL applications']} dense>
            {ranked.map((r) => (
              <tr key={r.s.id}>
                <td>
                  <RecordLink id={r.s.id} />
                </td>
                <td>{r.band}</td>
                <td className="num">{r.abs == null ? <Unknown /> : r.abs}</td>
                <td className="text-meta">{r.regime}</td>
                <td>{r.diff ? <CalcValue c={r.diff} digits={2} /> : '—'}</td>
                <td>
                  <CalcValue c={r.spot} digits={2} />
                </td>
                <td>
                  <CalcValue c={r.dof} digits={2} />
                </td>
                <td>{r.lib.length ? r.lib.map((a) => <Badge key={a.id} tone="ok">{a.name}</Badge>) : '—'}</td>
              </tr>
            ))}
          </Table>
          <p className="mt-1 text-meta text-ink-3">Ordering: catalogue applications for this material/process first, then indicative absorptance. Throughput and cost per good part need POC data (cycle time, yield) — see POC / DOE.</p>
        </Card>
        <div className="space-y-3">
          <Card title="Applications">
            {libApps.length ? (
              <ul className="space-y-1">
                {libApps.map((a) => (
                  <li key={a.id}>
                    <RecordLink id={a.id} /> <span className="text-meta text-ink-3">on <RecordLink id={a.product_id} /></span>
                    <div className="text-meta text-ink-2">{a.rationale}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-3">No TEAL application for this material and process — a gap, or new development.</p>
            )}
          </Card>
          <Card title="Handbook references">
            <ul className="space-y-0.5">
              {refs.map((h) => (
                <li key={h.id}>
                  <Link className="text-accent-2 hover:underline" to={hitLink(h, `${m?.name} ${proc}`)}>
                    {h.name}
                  </Link>
                </li>
              ))}
              {!refs.length && <li className="text-ink-3">—</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
