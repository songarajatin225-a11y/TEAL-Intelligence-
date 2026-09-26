import { useMemo, useState } from 'react';
import { depthOfFocus, peakPower, pulseEnergy, spotDiameter } from '../../calculations/laser';
import { RecordLink } from '../../components/RecordLink';
import { Card, Field, Input, KV, Select, Table, Unknown } from '../../components/ui';
import { CalcValue } from '../../components/why';
import type { LaserSource, Optic, Product } from '../../domain/entities';
import { useRecords, type Rec } from '../../hooks/useData';

/** Laser source: parameters, platforms that use it, suppliers named in the handbook, quick optics. */
export default function LaserSourceView({ record }: { record: Rec }) {
  const s = record as unknown as LaserSource & Rec;
  const optics = useRecords<Optic>('optic');
  const products = useRecords<Product>('product');
  const companies = useRecords('company');
  const key = s.id.replace(/^las-/, '');
  const [opt, setOpt] = useState(optics[0]?.id ?? '');
  const [pw, setPw] = useState('20');
  const [rep, setRep] = useState(s.repetition_rate_khz ? String(Math.round(Math.sqrt(s.repetition_rate_khz[0] * s.repetition_rate_khz[1]))) : '');
  const o = optics.find((x) => x.id === opt);
  const spot = useMemo(() => spotDiameter({ wavelength_nm: s.wavelength.value, focal_mm: o?.focal_length_mm, m2: s.m2, beam_mm: s.beam_diameter_mm }), [s, o]);
  const dof = depthOfFocus({ spot_um: spot.value, wavelength_nm: s.wavelength.value, m2: s.m2 });
  const pe = s.mode === 'pulsed' ? pulseEnergy({ power_w: Number(pw), rep_khz: Number(rep) }) : null;
  const pk = pe && s.pulse_duration?.unit === 'ns' ? peakPower({ pulse_energy_mj: pe.value, pulse_ns: s.pulse_duration.value }) : null;
  const plats = products.filter((p) => p.source_keys.includes(key));
  const catWords = s.categories.join(' ').toLowerCase();
  const suppliers = companies.filter((c) => ((c as { technologies?: string[] }).technologies ?? []).some((t) => (catWords.includes('co2') && /co₂|co2/i.test(t)) || (catWords.includes('ultrafast') && /ultrafast/i.test(t)) || ((catWords.includes('uv') || catWords.includes('green')) && /dpss uv and green/i.test(t)) || (catWords.includes('q-switched') || catWords.includes('mopa') ? /pulsed fiber/i.test(t) : false) || (catWords.includes('fiber cw') && /cw fiber/i.test(t))));
  return (
    <Card title="Laser source">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <KV
          items={[
            ['Kind', s.kind === 'class' ? 'Source class (no manufacturer)' : 'Manufacturer product'],
            ['Manufacturer / model', s.manufacturer ? `${s.manufacturer} ${s.model ?? ''}` : <Unknown label="—" />],
            ['Wavelength', `${s.wavelength.value ?? 'UNKNOWN'} nm${s.wavelength.original ? ` (source: ${s.wavelength.original})` : ''}`],
            ['Mode', s.mode],
            ['Pulse duration', s.pulse_duration ? `${s.pulse_duration.value} ${s.pulse_duration.unit}${s.pulse_duration_range ? ` (range ${s.pulse_duration_range.join('–')} ns)` : ''}` : '—'],
            ['Repetition rate', s.repetition_rate_khz ? `${s.repetition_rate_khz.join('–')} kHz` : '—'],
            ['M²', s.m2 ?? <Unknown />],
            ['Beam Ø at lens', s.beam_diameter_mm != null ? `${s.beam_diameter_mm} mm` : <Unknown />],
            ['Wall-plug efficiency', s.wall_plug_efficiency != null ? `${(s.wall_plug_efficiency * 100).toFixed(0)} % (estimate)` : <Unknown />],
            ['Platforms', plats.length ? plats.map((p) => <RecordLink key={p.id} id={p.id} />) : '—'],
          ]}
        />
        <div className="space-y-2">
          <div className="text-micro font-semibold uppercase text-ink-3">Quick optics</div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Objective" htmlFor="ls-o">
              <Select id="ls-o" value={opt} onChange={(e) => setOpt(e.target.value)}>
                {optics.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.short_code ?? x.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Power W" htmlFor="ls-p">
              <Input id="ls-p" type="number" value={pw} onChange={(e) => setPw(e.target.value)} />
            </Field>
            {s.mode === 'pulsed' && (
              <Field label="Rep kHz" htmlFor="ls-r">
                <Input id="ls-r" type="number" value={rep} onChange={(e) => setRep(e.target.value)} />
              </Field>
            )}
          </div>
          <Table head={['Quantity', 'Value']} dense>
            <tr>
              <td>Spot</td>
              <td>
                <CalcValue c={spot} />
              </td>
            </tr>
            <tr>
              <td>DOF</td>
              <td>
                <CalcValue c={dof} />
              </td>
            </tr>
            {pe && (
              <tr>
                <td>Pulse energy</td>
                <td>
                  <CalcValue c={pe} />
                </td>
              </tr>
            )}
            {pk && (
              <tr>
                <td>Peak power</td>
                <td>
                  <CalcValue c={pk} />
                </td>
              </tr>
            )}
          </Table>
          <div className="text-micro font-semibold uppercase text-ink-3">Representative suppliers (Laser Handbook §21.3)</div>
          <div className="text-body">{suppliers.length ? suppliers.map((c) => <RecordLink key={c.id} id={c.id} />).reduce<React.ReactNode[]>((a, x, i) => (i ? [...a, ', ', x] : [x]), []) : <Unknown label="none matched" />}</div>
        </div>
      </div>
    </Card>
  );
}
