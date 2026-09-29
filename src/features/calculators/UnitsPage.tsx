import { ArrowLeftRight, Ruler } from 'lucide-react';
import { useMemo, useState } from 'react';
import { convert, dimensionOf, fmtNum, knownUnits, parseQuantity, type Dimension } from '../../calculations/units';
import { Card, Field, IconButton, Input, Notice, PageHeader, Select } from '../../components/ui';

const DIM_LABEL: Partial<Record<Dimension, string>> = {
  power: 'Power',
  length: 'Length / wavelength',
  frequency: 'Frequency',
  time: 'Time / pulse duration',
  energy: 'Energy',
  speed: 'Speed',
  temperature: 'Temperature',
  mass: 'Mass',
  pressure: 'Pressure',
  area: 'Area',
  fluence: 'Fluence',
  density: 'Density',
  flow: 'Flow',
  thermal_conductivity: 'Thermal conductivity',
  specific_heat: 'Specific heat',
  voltage: 'Voltage',
  current: 'Current',
  angle: 'Angle',
  force: 'Force',
  torque: 'Torque',
  acceleration: 'Acceleration',
  inertia: 'Inertia',
  data: 'Data size',
  count: 'Count / pixels',
  volume: 'Volume',
  illuminance: 'Illuminance',
  sound: 'Sound level',
  intensity: 'Intensity / irradiance',
  throughput: 'Throughput (UPH)',
};

/**
 * UNIT CONVERTER (ultimate spec §92). Uses the same unit engine as the calculators. Currency is
 * deliberately absent: converting money needs a dated FX rate (Cost → landed cost).
 */
export default function UnitsPage() {
  const units = useMemo(() => knownUnits().filter((u) => dimensionOf(u) !== 'currency' && dimensionOf(u) !== 'dimensionless' && u !== 'um' && u !== 'us' && u !== 'uJ'), []);
  const dims = useMemo(() => [...new Set(units.map((u) => dimensionOf(u)!))], [units]);
  const [dim, setDim] = useState<Dimension>('power');
  const inDim = units.filter((u) => dimensionOf(u) === dim);
  const [from, setFrom] = useState('W');
  const [to, setTo] = useState('kW');
  const [value, setValue] = useState('50');
  const [text, setText] = useState('1064 nm');

  const pickDim = (d: Dimension) => {
    const list = units.filter((u) => dimensionOf(u) === d);
    setDim(d);
    setFrom(list[0]);
    setTo(list[1] ?? list[0]);
  };
  const n = Number(value);
  const result = Number.isFinite(n) && value.trim() !== '' ? convert(n, from, to) : null;
  const parsed = parseQuantity(text);
  const parsedDim = parsed?.unit ? dimensionOf(parsed.unit) : undefined;
  const alternatives = parsed && parsedDim && parsedDim !== 'currency' ? units.filter((u) => dimensionOf(u) === parsedDim && u !== parsed.unit) : [];

  return (
    <div className="space-y-5">
      <PageHeader title="Unit Converter" subtitle="Engineering units, converted with the same engine the calculators use. Original values are never overwritten." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Convert" icon={Ruler}>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Quantity" htmlFor="u-dim">
              <Select id="u-dim" value={dim} onChange={(e) => pickDim(e.target.value as Dimension)}>
                {dims.map((d) => (
                  <option key={d} value={d}>
                    {DIM_LABEL[d] ?? d}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <div className="grid gap-2">
                <Field label="Value" htmlFor="u-val">
                  <Input id="u-val" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className="num" />
                </Field>
                <Select aria-label="From unit" value={from} onChange={(e) => setFrom(e.target.value)}>
                  {inDim.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </Select>
              </div>
              <IconButton
                label="Swap units"
                icon={ArrowLeftRight}
                onClick={() => {
                  setFrom(to);
                  setTo(from);
                }}
              />
              <div className="grid gap-2">
                <div>
                  <div className="mb-1 text-meta font-medium text-ink-2">Result</div>
                  <output className="num flex h-10 items-center rounded-control border border-line bg-accent-soft/40 px-3 text-lead font-semibold" aria-live="polite">
                    {result == null ? '—' : fmtNum(result, 6)}
                  </output>
                </div>
                <Select aria-label="To unit" value={to} onChange={(e) => setTo(e.target.value)}>
                  {inDim.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </Card>
        <Card title="Read a value from text" description="Paste a datasheet value such as “20 W”, “10.6 µm” or “100 ns”">
          <Field label="Text" htmlFor="u-text">
            <Input id="u-text" value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          {parsed ? (
            <div className="mt-3 text-body">
              Read as <b className="num">{fmtNum(parsed.value, 6)}</b> <b>{parsed.unit || '(no unit)'}</b>
              {parsedDim && <span className="text-ink-3"> · {DIM_LABEL[parsedDim] ?? parsedDim}</span>}
              {parsedDim === 'currency' && <Notice tone="warn">Currency is not converted without a dated FX rate.</Notice>}
              {alternatives.length > 0 && (
                <ul className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {alternatives.map((u) => (
                    <li key={u} className="num rounded-control bg-ink/[0.04] px-2 py-1 text-meta">
                      {fmtNum(convert(parsed.value, parsed.unit, u), 6)} {u}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="mt-3 text-meta text-ink-3">Could not read a number with a known unit.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
