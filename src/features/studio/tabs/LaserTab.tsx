import clsx from 'clsx';
import { Crosshair, Sigma } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as L from '../../../calculations/laser';
import type { CalcResult } from '../../../calculations/types';
import { recordPath } from '../../../components/RecordLink';
import { Badge, Card, EmptyState, Notice, Table } from '../../../components/ui';
import type { AnyRecord } from '../../../domain';
import type { Part } from '../../../domain/engineering';
import { productTypeLabel } from '../../../domain/engineering';
import { checkPair } from '../../../services/eng/compatibility';
import { displaySpec, readSpec } from '../../../services/eng/specs';
import type { TabProps } from '../ScenarioPage';
import { CompatBadge, num } from '../shared';

const CHAIN: { role: string; type: string; specs: string[] }[] = [
  { role: 'Laser source', type: 'laser_source', specs: ['wavelength', 'average_power', 'm2', 'beam_diameter'] },
  { role: 'Beam expander', type: 'beam_expander', specs: ['magnification', 'output_beam_diameter', 'wavelength_range'] },
  { role: 'Galvo scanner', type: 'galvo', specs: ['aperture', 'wavelength_range', 'max_power', 'marking_speed'] },
  { role: 'F-theta lens', type: 'f_theta', specs: ['focal_length', 'scan_field_x', 'wavelength_range', 'entrance_beam_diameter'] },
];

function CalcRow({ r }: { r: CalcResult }) {
  return (
    <tr>
      <td className="font-medium">{r.label}</td>
      <td className="num">{r.value == null ? <Badge tone="warn">Not Available</Badge> : `${num(r.value, 4)} ${r.unit}`}</td>
      <td className="font-mono text-micro">{r.formula}</td>
      <td className="text-micro">
        {r.inputs.map((i) => `${i.label} ${i.value == null ? 'Not Available' : `${num(i.value, 4)} ${i.unit}`}`).join(' · ')}
        {r.warnings.length > 0 && <div className="text-warn">{r.warnings.join('; ')}</div>}
      </td>
      <td className="text-micro text-ink-3">{r.source.citation}</td>
    </tr>
  );
}

/** §62 laser equipment model: source → expander → galvo → f-theta → workpiece, with real / DEMO parts and calculated optics. */
export default function LaserTab({ eng, sim, customer }: TabProps) {
  const laserStations = sim.stations.filter((s) => s.kind === 'laser');
  if (!laserStations.length) return <EmptyState icon={Crosshair} title="No laser station in this equipment" explain="Add a station of kind “laser” under Architecture to configure a beam path." />;
  return (
    <div className="space-y-4">
      {laserStations.map((st) => {
        const sel = (role: string) => {
          const s = (sim.selections ?? []).find((x) => x.station_key === st.key && x.role === role);
          return s ? (eng.byId.get(s.part_id) as (Part & AnyRecord) | undefined) : undefined;
        };
        const chain = CHAIN.map((c) => ({ ...c, part: sel(c.role) }));
        const src = chain[0].part;
        const bex = chain[1].part;
        const ft = chain[3].part;
        const n = (p: Part | undefined, k: string) => (p ? readSpec(p, k, eng.defs)?.value ?? null : null);
        const lp = st.laser ?? {};
        const wl = n(src, 'wavelength');
        const m2 = n(src, 'm2');
        const raw = n(src, 'beam_diameter');
        const mag = n(bex, 'magnification');
        const beam = raw != null ? raw * (mag ?? 1) : null;
        const f = n(ft, 'focal_length');
        const power = lp.power_w ?? n(src, 'average_power');
        const spot = L.spotDiameter({ wavelength_nm: wl, focal_mm: f, m2, beam_mm: beam });
        const dof = L.depthOfFocus({ spot_um: spot.value, wavelength_nm: wl, m2 });
        const ep = L.pulseEnergy({ power_w: power, rep_khz: lp.frequency_khz });
        const flu = L.fluence({ pulse_energy_mj: ep.value, spot_um: spot.value });
        const ov = L.pulseOverlap({ speed_mm_s: lp.speed_mm_s, rep_khz: lp.frequency_khz, spot_um: spot.value });
        const le = L.lineEnergy({ power_w: power, speed_mm_s: lp.speed_mm_s });
        const links = chain.slice(0, -1).map((c, i) => (c.part && chain[i + 1].part ? checkPair(c.part, chain[i + 1].part!, eng.ctx) : null));
        return (
          <div key={st.key} className="space-y-4">
            <Card title={`${st.name} — beam path`} icon={Crosshair} description="Source → beam expander → galvo → f-theta → workpiece. The link colour is the compatibility result between neighbours.">
              <div className="scroll-thin overflow-x-auto pb-2">
                <div className="flex min-w-[760px] items-stretch gap-0">
                  {chain.map((c, i) => (
                    <div key={c.role} className="flex min-w-0 flex-1 items-center">
                      <div className={clsx('min-w-0 flex-1 rounded-control border p-2.5', c.part ? 'border-accent/40 bg-accent-soft/40' : 'border-dashed border-line-strong')}>
                        <div className="text-micro font-semibold uppercase tracking-wider text-ink-3">{c.role}</div>
                        {c.part ? (
                          <>
                            <div className="truncate font-semibold">{customer ? productTypeLabel(c.type) : c.part.model_number}</div>
                            <ul className="mt-1 space-y-0.5 text-micro text-ink-2">
                              {c.specs.map((k) => {
                                const s = readSpec(c.part!, k, eng.defs);
                                return (
                                  <li key={k}>
                                    {eng.defs.get(k)?.name ?? k}: {displaySpec(s)}
                                  </li>
                                );
                              })}
                            </ul>
                            {!customer && (
                              <Link to={recordPath(c.part.id)} className="mt-1 inline-flex min-h-6 items-center text-micro text-accent-2 hover:underline">
                                Open record
                              </Link>
                            )}
                          </>
                        ) : (
                          <div className="text-meta text-ink-3">{c.type === 'beam_expander' ? 'None (raw beam)' : 'Not selected'}</div>
                        )}
                      </div>
                      <div className="flex w-16 shrink-0 flex-col items-center gap-1 px-1" aria-hidden={i === chain.length - 1}>
                        <svg viewBox="0 0 60 12" className="h-3 w-full">
                          <line x1="0" y1="6" x2="60" y2="6" className={clsx('beam-line', i < links.length && links[i]?.relationship === 'Incompatible' ? 'stroke-bad' : 'stroke-accent')} strokeWidth="3" />
                        </svg>
                        {i < links.length && links[i] && (
                          <span className="text-micro font-semibold" title={links[i]!.summary} aria-label={links[i]!.relationship}>
                            {links[i]!.relationship === 'Incompatible' ? '✕' : links[i]!.relationship === 'ConditionallyCompatible' ? '⚠' : links[i]!.relationship === 'Unknown' ? '?' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="grid w-24 shrink-0 place-items-center rounded-control border border-line-strong bg-panel-2 p-2 text-center text-micro font-semibold">
                    Workpiece
                    <span className="font-normal text-ink-3">{eng.byId.get(sim.material_id ?? '')?.name ?? 'material?'}</span>
                  </div>
                </div>
              </div>
              <ul className="mt-2 space-y-1 text-meta">
                {links.map((l, i) =>
                  l ? (
                    <li key={i} className="flex flex-wrap items-center gap-2">
                      <span className="text-ink-2">
                        {chain[i].role} ↔ {chain[i + 1].role}:
                      </span>
                      <CompatBadge t={l.relationship} />
                      <span className="text-micro text-ink-3">{l.checks.filter((c) => c.status !== 'pass').map((c) => c.detail).join('; ') || l.summary}</span>
                    </li>
                  ) : null,
                )}
              </ul>
            </Card>
            <Card title="Calculated optics and process" icon={Sigma} description="Diffraction-limited ESTIMATES from the selected components and the process inputs — Not Available when an input is missing">
              <Table head={['Quantity', 'Value', 'Formula', 'Inputs', 'Source']} dense>
                <CalcRow r={spot} />
                <CalcRow r={dof} />
                <CalcRow r={ep} />
                <CalcRow r={flu} />
                <CalcRow r={ov} />
                <CalcRow r={le} />
              </Table>
              <Notice tone="info">These are physics relations, not a process window. Whether a fluence or overlap produces an acceptable mark or weld comes only from DOE / POC data on the customer’s material.</Notice>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
