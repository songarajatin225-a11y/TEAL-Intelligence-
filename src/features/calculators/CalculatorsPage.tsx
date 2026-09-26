import { useState } from 'react';
import * as A from '../../calculations/automation';
import * as C from '../../calculations/cost';
import * as L from '../../calculations/laser';
import * as Q from '../../calculations/quality';
import type { CalcResult } from '../../calculations/types';
import { convert, knownUnits, dimensionOf, UnitError } from '../../calculations/units';
import { Card, Field, Input, PageHeader, Select, Tabs } from '../../components/ui';
import { CalcValue } from '../../components/why';

interface Spec {
  title: string;
  fields: { key: string; label: string; def: string }[];
  run: (v: Record<string, number | null>) => CalcResult;
}

const n = (v: string) => (v.trim() === '' ? null : Number(v));

const GROUPS: Record<string, Spec[]> = {
  Laser: [
    { title: 'Spot diameter (L1)', fields: [{ key: 'wl', label: 'λ nm', def: '1064' }, { key: 'm2', label: 'M²', def: '1.3' }, { key: 'D', label: 'Beam Ø mm', def: '7' }, { key: 'f', label: 'f mm', def: '160' }], run: (v) => L.spotDiameter({ wavelength_nm: v.wl, m2: v.m2, beam_mm: v.D, focal_mm: v.f }) },
    { title: 'Depth of focus 2·z_R (L2)', fields: [{ key: 'd', label: 'Spot µm', def: '40' }, { key: 'wl', label: 'λ nm', def: '1064' }, { key: 'm2', label: 'M²', def: '1.3' }], run: (v) => L.depthOfFocus({ spot_um: v.d, wavelength_nm: v.wl, m2: v.m2 }) },
    { title: 'Pulse energy (L4)', fields: [{ key: 'p', label: 'P avg W', def: '50' }, { key: 'f', label: 'f kHz', def: '100' }], run: (v) => L.pulseEnergy({ power_w: v.p, rep_khz: v.f }) },
    { title: 'Peak power (L5)', fields: [{ key: 'e', label: 'E mJ', def: '0.5' }, { key: 't', label: 'τ ns', def: '100' }], run: (v) => L.peakPower({ pulse_energy_mj: v.e, pulse_ns: v.t }) },
    { title: 'Fluence (L6)', fields: [{ key: 'e', label: 'E mJ', def: '0.5' }, { key: 'd', label: 'Spot µm', def: '45' }], run: (v) => L.fluence({ pulse_energy_mj: v.e, spot_um: v.d }) },
    { title: 'Intensity (L7)', fields: [{ key: 'p', label: 'P W', def: '1000' }, { key: 'd', label: 'Spot µm', def: '100' }], run: (v) => L.intensity({ power_w: v.p, spot_um: v.d }) },
    { title: 'Pulse overlap (L8)', fields: [{ key: 'v', label: 'v mm/s', def: '1000' }, { key: 'f', label: 'f kHz', def: '100' }, { key: 'd', label: 'Spot µm', def: '30' }], run: (v) => L.pulseOverlap({ speed_mm_s: v.v, rep_khz: v.f, spot_um: v.d }) },
    { title: 'Line energy (L9)', fields: [{ key: 'p', label: 'P W', def: '3000' }, { key: 'v', label: 'v mm/s', def: '100' }], run: (v) => L.lineEnergy({ power_w: v.p, speed_mm_s: v.v }) },
    { title: 'Areal energy density', fields: [{ key: 'p', label: 'P W', def: '20' }, { key: 'v', label: 'v mm/s', def: '1000' }, { key: 'h', label: 'Hatch µm', def: '20' }], run: (v) => L.energyDensity({ power_w: v.p, speed_mm_s: v.v, hatch_um: v.h }) },
    { title: 'Chiller capacity (L11)', fields: [{ key: 'el', label: 'P el kW', def: '6' }, { key: 'op', label: 'P opt kW', def: '2' }, { key: 'x', label: 'Optics heat kW', def: '0.2' }], run: (v) => L.chillerCapacity({ electrical_kw: v.el, optical_kw: v.op, optics_heat_kw: v.x }) },
  ],
  Automation: [
    { title: 'Takt (K2)', fields: [{ key: 't', label: 'Available s', def: '79200' }, { key: 'q', label: 'Demand', def: '10000' }], run: (v) => A.takt({ available_s: v.t, demand: v.q }) },
    { title: 'OEE (K5)', fields: [{ key: 'a', label: 'A', def: '0.92' }, { key: 'p', label: 'P', def: '0.95' }, { key: 'q', label: 'Q', def: '0.985' }], run: (v) => A.oee({ availability: v.a, performance: v.p, quality: v.q }) },
    { title: 'Ideal cycle time (K3)', fields: [{ key: 't', label: 'T plan s', def: '79200' }, { key: 'o', label: 'OEE', def: '0.861' }, { key: 'n', label: 'Good units', def: '10000' }], run: (v) => A.idealCycleTime({ planned_s: v.t, oee: v.o, good_units: v.n }) },
    { title: 'UPH (K4)', fields: [{ key: 'ct', label: 'CT s', def: '6.82' }], run: (v) => A.uph({ cycle_s: v.ct }) },
    { title: 'Throughput per period', fields: [{ key: 'ct', label: 'CT s', def: '6.2' }, { key: 't', label: 'T plan s', def: '79200' }, { key: 'o', label: 'OEE', def: '0.861' }], run: (v) => A.throughput({ cycle_s: v.ct, planned_s: v.t, oee: v.o }) },
    { title: 'Annual capacity', fields: [{ key: 'u', label: 'UPH', def: '528' }, { key: 'o', label: 'OEE', def: '0.861' }, { key: 'h', label: 'h/yr', def: '6000' }], run: (v) => A.annualCapacity({ uph: v.u, oee: v.o, hours_per_year: v.h }) },
    { title: 'Load-while-process cycle', fields: [{ key: 'h', label: 'Handling s', def: '4.9' }, { key: 'p', label: 'Process s', def: '3.5' }, { key: 's', label: 'Shuttle s', def: '0.4' }], run: (v) => A.loadWhileProcessCycle({ handling_s: v.h, process_s: v.p, shuttle_s: v.s }) },
    { title: 'Machines required (K9)', fields: [{ key: 'r', label: 'UPH req', def: '1100' }, { key: 'm', label: 'UPH/machine', def: '528' }], run: (v) => A.machinesRequired({ uph_required: v.r, uph_machine: v.m }) },
    { title: 'Buffer (K11)', fields: [{ key: 's', label: 'Stop s', def: '300' }, { key: 't', label: 'Takt s', def: '7.92' }], run: (v) => A.bufferSize({ stop_s: v.s, takt_s: v.t }) },
    { title: 'Cylinder force (P1)', fields: [{ key: 'p', label: 'p bar', def: '4' }, { key: 'd', label: 'Bore mm', def: '20' }, { key: 'e', label: 'η', def: '0.9' }], run: (v) => A.cylinderExtendForce({ pressure_bar: v.p, bore_mm: v.d, efficiency: v.e }) },
    { title: 'Air flow (P6)', fields: [{ key: 'd', label: 'Bore mm', def: '32' }, { key: 'v', label: 'v m/s', def: '0.5' }, { key: 'p', label: 'p bar', def: '6' }], run: (v) => A.airFlowForSpeed({ bore_mm: v.d, speed_m_s: v.v, pressure_bar: v.p }) },
    { title: 'Vacuum cup Ø (P12)', fields: [{ key: 'f', label: 'F N', def: '119' }, { key: 'dp', label: 'Δp kPa', def: '60' }, { key: 'n', label: 'Cups', def: '4' }], run: (v) => A.vacuumCupDiameter({ force_n: v.f, vacuum_kpa: v.dp, cups: v.n }) },
    { title: 'Evacuation time (P13)', fields: [{ key: 'V', label: 'V L', def: '0.05' }, { key: 'Q', label: 'Q L/min', def: '30' }, { key: 'p0', label: 'p0 kPa abs', def: '101' }, { key: 'p1', label: 'p1 kPa abs', def: '40' }], run: (v) => A.evacuationTime({ volume_l: v.V, flow_l_min: v.Q, p0_kpa: v.p0, p1_kpa: v.p1 }) },
    { title: 'Three-phase current (E1)', fields: [{ key: 's', label: 'S kVA', def: '4.32' }, { key: 'v', label: 'V', def: '415' }], run: (v) => A.threePhaseCurrent({ apparent_kva: v.s, voltage_v: v.v }) },
    { title: 'Motor speed, ball screw (N5)', fields: [{ key: 'v', label: 'v m/s', def: '0.75' }, { key: 'p', label: 'Lead mm', def: '20' }], run: (v) => A.motorSpeedScrew({ speed_m_s: v.v, lead_mm: v.p }) },
  ],
  Commercial: [
    { title: 'Price from margin (C1)', fields: [{ key: 'c', label: 'Cost', def: '6210000' }, { key: 'gm', label: 'GM', def: '0.30' }, { key: 'w', label: 'Warranty', def: '0.03' }], run: (v) => C.priceFromMargin({ cost: v.c, gross_margin: v.gm, warranty: v.w }) },
    { title: 'Payback (C6)', fields: [{ key: 'c', label: 'Capex', def: '9270000' }, { key: 's', label: 'Saving/yr', def: '5460000' }, { key: 'o', label: 'Opex/yr', def: '0' }], run: (v) => C.payback({ capex: v.c, annual_saving: v.s, annual_operating_cost: v.o }) },
    { title: 'ROI over life', fields: [{ key: 'c', label: 'Capex', def: '9270000' }, { key: 's', label: 'Saving/yr', def: '5460000' }, { key: 'o', label: 'Opex/yr', def: '0' }, { key: 'l', label: 'Life yr', def: '8' }], run: (v) => C.roi({ capex: v.c, annual_saving: v.s, annual_operating_cost: v.o, life_years: v.l }) },
    { title: 'Landed cost (C4)', fields: [{ key: 'p', label: 'Base (USD)', def: '10000' }, { key: 'fx', label: 'FX INR/USD', def: '' }, { key: 'f', label: 'Freight %', def: '2' }, { key: 'd', label: 'Duty %', def: '7.5' }, { key: 'i', label: 'Insurance %', def: '0.5' }], run: (v) => C.landedCost({ base_cost: v.p, currency: 'USD', fx: v.fx != null ? { code: 'USD', rate_to_inr: v.fx, as_of: null, source: 'entered by user' } : null, freight_pct: v.f ?? 0, duty_pct: v.d ?? 0, insurance_pct: v.i ?? 0 }) },
    { title: 'Localization payback (C9)', fields: [{ key: 'q', label: 'Qualification', def: '110000' }, { key: 'i', label: 'Import cost', def: '20000' }, { key: 'l', label: 'Local cost', def: '10000' }, { key: 'n', label: 'Units/yr', def: '100' }], run: (v) => C.localizationPayback({ qualification_cost: v.q, import_cost: v.i, local_cost: v.l, annual_volume: v.n }) },
    { title: 'Learning curve (C2)', fields: [{ key: 'c', label: 'Unit-1 hours', def: '500' }, { key: 'n', label: 'Unit n', def: '4' }, { key: 'b', label: 'b', def: '0.85' }], run: (v) => C.learningCurve({ first_unit: v.c, n: v.n, b: v.b }) },
  ],
  Quality: [
    { title: 'Cp from statistics (Q1)', fields: [{ key: 'u', label: 'USL', def: '5' }, { key: 'l', label: 'LSL', def: '-5' }, { key: 's', label: 'σ', def: '1' }], run: (v) => Q.capabilityFromStats({ usl: v.u, lsl: v.l, sigma: v.s }).cp },
    { title: 'Cpk from statistics (Q1)', fields: [{ key: 'u', label: 'USL', def: '5' }, { key: 'l', label: 'LSL', def: '-5' }, { key: 'm', label: 'μ', def: '0.5' }, { key: 's', label: 'σ', def: '1' }], run: (v) => Q.capabilityFromStats({ usl: v.u, lsl: v.l, mean: v.m, sigma: v.s }).cpk },
    { title: 'Cpk lower bound (Q2)', fields: [{ key: 'c', label: 'Cpk', def: '1.5' }, { key: 'n', label: 'n', def: '50' }], run: (v) => Q.cpkLowerBound({ cpk: v.c, n: v.n }) },
    { title: 'Yield', fields: [{ key: 'g', label: 'Good', def: '9850' }, { key: 't', label: 'Total', def: '10000' }], run: (v) => Q.yieldFromCounts({ good: v.g, total: v.t }).yield },
    { title: 'DOE runs (Q6)', fields: [{ key: 'k', label: 'k', def: '5' }, { key: 'p', label: 'p', def: '1' }, { key: 'r', label: 'r', def: '2' }, { key: 'c', label: 'centre', def: '3' }], run: (v) => Q.doeRuns({ factors: v.k, fraction: v.p, replicates: v.r, centre_points: v.c }) },
    { title: 'RPN (Q10)', fields: [{ key: 's', label: 'S', def: '8' }, { key: 'o', label: 'O', def: '3' }, { key: 'd', label: 'D', def: '9' }], run: (v) => Q.rpn({ severity: v.s, occurrence: v.o, detection: v.d }) },
  ],
};

function Calc({ spec }: { spec: Spec }) {
  const [vals, setVals] = useState<Record<string, string>>(Object.fromEntries(spec.fields.map((f) => [f.key, f.def])));
  const r = spec.run(Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, n(v)])));
  return (
    <Card title={spec.title}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {spec.fields.map((f) => (
          <Field key={f.key} label={f.label} htmlFor={`${spec.title}-${f.key}`}>
            <Input id={`${spec.title}-${f.key}`} type="number" step="any" value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
          </Field>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-[12px] text-ink-3">{r.formula}</span>
        <span className="ml-auto text-[14px] font-semibold">
          <CalcValue c={r} digits={4} />
        </span>
      </div>
      {r.warnings.length > 0 && <div className="text-[11.5px] text-warn">{r.warnings.join('; ')}</div>}
    </Card>
  );
}

function UnitConverter() {
  const [v, setV] = useState('1064');
  const [from, setFrom] = useState('nm');
  const [to, setTo] = useState('µm');
  let out = '';
  try {
    out = String(convert(Number(v), from, to));
  } catch (e) {
    out = e instanceof UnitError ? e.message : 'Invalid';
  }
  const units = knownUnits().filter((u) => dimensionOf(u) !== 'currency');
  return (
    <Card title="Unit engine">
      <div className="flex flex-wrap items-end gap-2">
        <Input aria-label="Value" type="number" value={v} onChange={(e) => setV(e.target.value)} className="w-32" />
        <Select aria-label="From unit" value={from} onChange={(e) => setFrom(e.target.value)} className="w-28">
          {units.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </Select>
        →
        <Select aria-label="To unit" value={to} onChange={(e) => setTo(e.target.value)} className="w-28">
          {units.filter((u) => dimensionOf(u) === dimensionOf(from)).map((u) => (
            <option key={u}>{u}</option>
          ))}
        </Select>
        <span className="num text-[14px] font-semibold">{out}</span>
      </div>
      <p className="mt-1 text-[11.5px] text-ink-3">Currency is not converted here: it needs a dated FX rate (Cost Engine → Landed cost). Source values keep their original text.</p>
    </Card>
  );
}

/** CALCULATOR ENGINE (spec §86): formula · inputs · units · result · assumptions · source. */
export default function CalculatorsPage() {
  const [tab, setTab] = useState<keyof typeof GROUPS | 'Units'>('Laser');
  return (
    <div>
      <PageHeader eyebrow="Laser" title="Calculator engine" subtitle="Every result shows its formula, inputs with units, assumptions and handbook source (click the ? next to a result). Defaults reproduce Automation Handbook Part 54 worked values where the handbook gives the inputs." />
      <Tabs label="Calculator groups" value={tab} onChange={setTab} tabs={[...Object.keys(GROUPS).map((k) => ({ key: k as keyof typeof GROUPS, label: k })), { key: 'Units' as const, label: 'Units' }]} />
      {tab === 'Units' ? (
        <UnitConverter />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {GROUPS[tab].map((s) => (
            <Calc key={s.title} spec={s} />
          ))}
        </div>
      )}
    </div>
  );
}
