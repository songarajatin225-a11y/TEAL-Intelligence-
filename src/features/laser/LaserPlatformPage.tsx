import clsx from 'clsx';
import { ArrowRight, Check, Crosshair, Eye, FlaskConical, Focus, Layers, Maximize, ScanLine, SlidersHorizontal, Zap, type LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { depthOfFocus, spotDiameter } from '../../calculations/laser';
import { DataConfidence } from '../../components/badges';
import { recordPath } from '../../components/RecordLink';
import { buttonClass, Card, Field, PageHeader, SectionHeader, Select, Unknown } from '../../components/ui';
import { CalcValue } from '../../components/why';
import type { LaserSource, Material, Module, Optic, Product } from '../../domain/entities';
import { useRecords } from '../../hooks/useData';

interface Stage {
  key: string;
  label: string;
  icon: LucideIcon;
  role: string;
  params: string[];
  data: { label: string; count: number; to: string; empty?: string }[];
}

/**
 * LASER PLATFORM (spec §29–§30): the beam path as an interactive map — source → expander →
 * galvo → f-theta → workpiece → inspection → validation — with the real data behind each stage.
 */
export default function LaserPlatformPage() {
  const sources = useRecords<LaserSource>('laser_source');
  const optics = useRecords<Optic>('optic');
  const galvos = useRecords('galvo');
  const materials = useRecords<Material>('material');
  const modules = useRecords<Module>('module');
  const products = useRecords<Product>('product');
  const pocs = useRecords('poc');
  const does = useRecords('doe');
  const apps = useRecords('application');
  const classes = sources.filter((s) => s.kind === 'class');
  const lenses = optics.filter((o) => o.optic_type === 'f_theta');
  const inspection = modules.filter((m) => /vision|verif|inspect|monitor|oct/i.test(m.name));

  const stages: Stage[] = [
    { key: 'source', label: 'Laser source', icon: Zap, role: 'Generates the beam. Wavelength sets absorption; pulse duration and repetition rate set the process regime; M² and beam diameter set the smallest achievable spot.', params: ['Wavelength λ', 'Pulse duration τ', 'Repetition rate', 'Average power', 'Beam quality M²'], data: [{ label: 'Source classes', count: classes.length, to: '/laser-sources' }] },
    { key: 'expander', label: 'Beam expander', icon: Maximize, role: 'Expands the collimated beam before the scanner. A larger input diameter D gives a smaller focused spot (d ∝ 1/D) and a shorter depth of focus.', params: ['Expansion ratio', 'Input diameter D at the scan head'], data: [{ label: 'Modelled via source beam diameter', count: classes.filter((c) => c.beam_diameter_mm != null).length, to: '/laser-sources', empty: 'No expander components curated' }] },
    { key: 'galvo', label: 'Galvo scanner', icon: ScanLine, role: 'Two mirrors deflect the beam across the field. Aperture must exceed the beam diameter; scan speed and acceleration bound throughput.', params: ['Aperture', 'Scan angle', 'Marking speed', 'Repeatability'], data: [{ label: 'Scanner records', count: galvos.length, to: '/galvo', empty: 'No scanners curated yet — add from official datasheets' }] },
    { key: 'lens', label: 'F-theta lens', icon: Focus, role: 'Focuses onto a flat field. Focal length trades field size against spot size: d = 4λfM²/(πD) (Handbook L1); DOF = 2·z_R.', params: ['Focal length f', 'Scan field', 'Working distance'], data: [{ label: 'F-theta objectives', count: lenses.length, to: '/optics' }] },
    { key: 'workpiece', label: 'Workpiece', icon: Layers, role: 'Absorption at the wavelength, thermal diffusion during the pulse and the fluence threshold decide what the process does to the material.', params: ['Absorptance at λ', 'Thermal diffusion length', 'Ablation threshold'], data: [{ label: 'Materials', count: materials.length, to: '/materials' }, { label: 'Applications', count: apps.length, to: '/applications' }] },
    { key: 'inspection', label: 'Inspection', icon: Eye, role: 'Vision locates the part and verifies the result — mark grading, weld monitoring, depth measurement — closing the loop on quality.', params: ['Resolution', 'Grading standard', 'Cycle time'], data: [{ label: 'Inspection & monitoring modules', count: inspection.length, to: '/modules' }] },
    { key: 'validation', label: 'Process validation', icon: FlaskConical, role: 'A POC on real samples and a DOE establish the process window before the machine is committed (gate G1).', params: ['Process window', 'Cpk', 'Yield'], data: [{ label: 'POCs', count: pocs.length, to: '/poc' }, { label: 'DOE studies', count: does.length, to: '/doe' }] },
  ];
  const [active, setActive] = useState('source');
  const stage = stages.find((s) => s.key === active)!;

  // live spot calculator on the real source classes and objectives
  const [srcId, setSrcId] = useState(classes.find((c) => c.id === 'las-fiber')?.id ?? classes[0]?.id ?? '');
  const [lensId, setLensId] = useState(lenses.find((l) => l.id === 'opt-f254')?.id ?? lenses[0]?.id ?? '');
  const src = classes.find((c) => c.id === srcId);
  const lens = lenses.find((l) => l.id === lensId);
  const spot = spotDiameter({ wavelength_nm: src?.wavelength.value, focal_mm: lens?.focal_length_mm, m2: src?.m2, beam_mm: src?.beam_diameter_mm });
  const dof = depthOfFocus({ spot_um: spot.value, wavelength_nm: src?.wavelength.value, m2: src?.m2 });

  const [compare, setCompare] = useState<string[]>([]);
  const platformFor = useMemo(() => {
    const m = new Map<string, Product[]>();
    for (const p of products) for (const k of p.source_keys) m.set(k, [...(m.get(k) ?? []), p]);
    return m;
  }, [products]);
  const keyOf = (s: LaserSource) => s.id.replace(/^las-/, '');
  const cmp = classes.filter((c) => compare.includes(c.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laser Platform"
        subtitle="From source to validated process — the beam path, and the engineering data behind every stage."
        actions={
          <Link to="/configurator" className={buttonClass('primary')}>
            <SlidersHorizontal className="size-4" aria-hidden /> Open configurator
          </Link>
        }
      />

      {/* beam path */}
      <section aria-labelledby="beam" className="surface glass-edge rounded-panel p-5">
        <h2 id="beam" className="text-section font-semibold">
          Beam path
        </h2>
        <p className="mb-4 text-meta text-ink-3">Select a stage to see what it does, what governs it and the data behind it.</p>
        <div role="tablist" aria-label="Beam path stages" className="scroll-thin flex items-center overflow-x-auto pb-2">
          {stages.map((s, i) => (
            <div key={s.key} className={clsx('flex min-w-[7.25rem] items-center', i < stages.length - 1 ? 'flex-[1_1_0]' : 'flex-[0.78_1_0]')}>
              <button
                type="button"
                role="tab"
                aria-selected={active === s.key}
                onClick={() => setActive(s.key)}
                className={clsx('flex min-w-0 flex-1 flex-col items-center gap-2 rounded-card border px-2 py-3 text-center transition-all', active === s.key ? 'border-accent bg-accent-soft shadow-[0_0_0_4px_var(--glow)]' : 'border-line-strong bg-solid/50 hover:border-accent/50')}
              >
                <span className={clsx('grid size-10 place-items-center rounded-xl', active === s.key ? 'bg-accent text-white' : 'bg-accent-soft text-accent-2')}>
                  <s.icon className="size-5" aria-hidden />
                </span>
                <span className="text-meta font-semibold leading-tight">{s.label}</span>
              </button>
              {i < stages.length - 1 && (
                <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden className="shrink-0">
                  <line x1="2" y1="6" x2="26" y2="6" className="beam" strokeWidth="2" opacity="0.35" />
                  <line x1="2" y1="6" x2="26" y2="6" className="beam beam-flow" strokeWidth="2" />
                </svg>
              )}
            </div>
          ))}
        </div>
        <div role="tabpanel" aria-label={stage.label} className="mt-4 grid grid-cols-1 gap-4 border-t border-line pt-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="flex items-center gap-2 text-lead font-semibold">
              <stage.icon className="size-5 text-accent-2" aria-hidden /> {stage.label}
            </h3>
            <p className="mt-1 text-ink-2">{stage.role}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stage.params.map((p) => (
                <span key={p} className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-meta">
                  {p}
                </span>
              ))}
            </div>
          </div>
          <ul className="space-y-2">
            {stage.data.map((d) => (
              <li key={d.label}>
                <Link to={d.to} className="flex items-center justify-between gap-3 rounded-control border border-line-strong px-3 py-2.5 hover:border-accent/50">
                  <span>
                    <span className="num block text-section font-semibold">{d.count}</span>
                    <span className="text-meta text-ink-3">{d.count || !d.empty ? d.label : d.empty}</span>
                  </span>
                  <ArrowRight className="size-4 text-ink-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* spot estimator */}
      <Card title="Spot size estimator" icon={Crosshair} description="Diffraction-limited estimate on TEAL source classes and objectives — click a value for its formula (WHY?)">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Field label="Source class" htmlFor="lp-src">
            <Select id="lp-src" value={srcId} onChange={(e) => setSrcId(e.target.value)}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="F-theta objective" htmlFor="lp-lens">
            <Select id="lp-lens" value={lensId} onChange={(e) => setLensId(e.target.value)}>
              {lenses.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="surface rounded-card px-4 py-3">
            <div className="text-meta text-ink-3">Spot diameter</div>
            <div className="text-metric font-semibold">
              <CalcValue c={spot} />
            </div>
          </div>
          <div className="surface rounded-card px-4 py-3">
            <div className="text-meta text-ink-3">Depth of focus</div>
            <div className="text-metric font-semibold">
              <CalcValue c={dof} />
            </div>
          </div>
        </div>
        <p className="mt-3 text-micro text-ink-3">Representative parameters, not datasheet values. Field {lens?.scan_field_mm ?? '—'} mm · λ {src?.wavelength.value ?? '—'} nm · M² {src?.m2 ?? '—'} · D {src?.beam_diameter_mm ?? '—'} mm.</p>
      </Card>

      {/* source cards */}
      <section aria-label="Laser sources">
        <SectionHeader
          title="Laser sources"
          description={`${classes.length} source technologies offered by TEAL platforms`}
          actions={
            <Link to="/laser-sources" className="inline-flex items-center gap-1 text-meta font-medium text-accent-2 hover:underline">
              Table view <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          }
        />
        {cmp.length > 1 && (
          <Card title={`Compare (${cmp.length})`} className="mb-4" actions={<button type="button" className="text-meta text-accent-2 hover:underline" onClick={() => setCompare([])}>Clear</button>}>
            <div className="scroll-thin overflow-x-auto" tabIndex={0}>
              <table className="w-full text-left text-meta">
                <thead>
                  <tr className="text-ink-3">
                    <th className="py-1.5 pr-4 font-medium">Parameter</th>
                    {cmp.map((c) => (
                      <th key={c.id} className="py-1.5 pr-4 font-semibold text-ink">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_td]:border-t [&_td]:border-line [&_td]:py-1.5 [&_td]:pr-4">
                  {(
                    [
                      ['Wavelength', (c: LaserSource) => `${c.wavelength.value ?? '—'} ${c.wavelength.unit}`],
                      ['Mode', (c: LaserSource) => c.mode],
                      ['Pulse duration', (c: LaserSource) => (c.pulse_duration ? `${c.pulse_duration.value} ${c.pulse_duration.unit}` : '—')],
                      ['Repetition rate', (c: LaserSource) => (c.repetition_rate_khz ? `${c.repetition_rate_khz[0]}–${c.repetition_rate_khz[1]} kHz` : '—')],
                      ['M²', (c: LaserSource) => c.m2 ?? '—'],
                      ['Beam diameter', (c: LaserSource) => (c.beam_diameter_mm != null ? `${c.beam_diameter_mm} mm` : '—')],
                      ['Wall-plug efficiency', (c: LaserSource) => (c.wall_plug_efficiency != null ? `${Math.round(c.wall_plug_efficiency * 100)}%` : '—')],
                      ['Platforms', (c: LaserSource) => (platformFor.get(keyOf(c)) ?? []).length],
                    ] as [string, (c: LaserSource) => React.ReactNode][]
                  ).map(([label, f]) => (
                    <tr key={label}>
                      <td className="text-ink-3">{label}</td>
                      {cmp.map((c) => (
                        <td key={c.id} className="num">
                          {f(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {classes.map((c) => {
            const plats = platformFor.get(keyOf(c)) ?? [];
            const inCmp = compare.includes(c.id);
            return (
              <article key={c.id} className="surface flex flex-col rounded-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link to={recordPath(c.id)} className="block truncate font-semibold hover:text-accent-2">
                      {c.name}
                    </Link>
                    <div className="text-micro text-ink-3">{c.categories.join(' · ')}</div>
                  </div>
                  <span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: c.display_color ?? 'var(--c-accent)' }} aria-hidden />
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="num text-metric font-semibold">{c.wavelength.value ?? '—'}</span>
                  <span className="text-meta text-ink-3">{c.wavelength.unit}</span>
                  <span className="ml-auto text-meta capitalize text-ink-2">{c.mode === 'cw' ? 'Continuous wave' : 'Pulsed'}</span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-meta">
                  <dt className="text-ink-3">Pulse</dt>
                  <dd className="num">{c.pulse_duration ? `${c.pulse_duration.value} ${c.pulse_duration.unit}` : <Unknown label="n/a" />}</dd>
                  <dt className="text-ink-3">Rep. rate</dt>
                  <dd className="num">{c.repetition_rate_khz ? `${c.repetition_rate_khz[0]}–${c.repetition_rate_khz[1]} kHz` : '—'}</dd>
                  <dt className="text-ink-3">M²</dt>
                  <dd className="num">{c.m2 ?? <Unknown />}</dd>
                  <dt className="text-ink-3">Platforms</dt>
                  <dd className="num">{plats.length}</dd>
                </dl>
                <DataConfidence className="mt-3" dataType={c.data_type} verification={c.provenance?.verification_status} source={c.provenance?.document} />
                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  <button type="button" aria-pressed={inCmp} onClick={() => setCompare((xs) => (inCmp ? xs.filter((x) => x !== c.id) : [...xs, c.id].slice(-3)))} className={buttonClass(inCmp ? 'tertiary' : 'secondary', 'sm')}>
                    {inCmp && <Check className="size-3.5" aria-hidden />} Compare
                  </button>
                  {plats[0] && (
                    <Link to={`/configurator?product=${plats[0].key}&source=${keyOf(c)}`} className={buttonClass('secondary', 'sm')} title={`Configure ${plats[0].name} with this source`}>
                      Configure
                    </Link>
                  )}
                  <Link to={recordPath(c.id)} className={buttonClass('ghost', 'sm')}>
                    Details
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
