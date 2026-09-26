import clsx from 'clsx';
import { ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Button, Card, EmptyState, Field, Input, KV, Notice, PageHeader, Select, Table, Unknown } from '../../components/ui';
import { CalcValue, WhyButton } from '../../components/why';
import type { Configuration } from '../../domain/entities';
import { useData, useEngine, useRecords } from '../../hooks/useData';
import { newLocalId, repo } from '../../repositories';
import { assetUrl } from '../../utils/paths';
import { download, stamp } from '../../utils/export';
import { todayIso } from '../../utils/dates';
import type { ConfigState, ConfiguratorEngine } from './engine';

const inr = (v: number | null | undefined) => (v == null ? '—' : `₹ ${Math.round(v).toLocaleString('en-IN')}`);

export function stateFromConfiguration(c: Configuration): ConfigState {
  return { productKey: c.product_id.replace(/^prd-/, ''), appKey: c.application_key, sourceKey: c.source_key, powerW: c.power_w, lensKey: c.lens_key, modules: c.modules, extras: c.extras, software: c.software, targetPerHour: c.target_per_hour };
}

export function configurationFromState(e: ConfiguratorEngine, s: ConfigState, base: Partial<Configuration> & { id: string; name: string }): Configuration {
  const price = e.price(s);
  const ph = e.physics(s);
  return {
    ...base,
    entity: 'configuration',
    product_id: `prd-${s.productKey}`,
    application_key: s.appKey,
    source_key: s.sourceKey,
    power_w: s.powerW,
    lens_key: s.lensKey,
    modules: s.modules,
    software: s.software,
    extras: s.extras,
    ...(s.targetPerHour ? { target_per_hour: s.targetPerHour } : {}),
    designation: e.designation(s) ?? undefined,
    snapshot: {
      price_estimate_inr: price.value,
      price_band_inr: price.band,
      spot_um: ph?.spot.value ?? null,
      dof_mm: ph?.dof.value ?? null,
      warnings: e.compatibility(s).filter((c) => c.status !== 'OK').map((c) => `${c.check}: ${c.detail}`),
      computed_at: todayIso(),
    },
    data_type: base.data_type ?? 'USER_CREATED',
    provenance: base.provenance ?? { verification_status: 'DRAFT', note: 'Configured in Product Configurator 2.0' },
  } as Configuration;
}

/** TEAL PRODUCT CONFIGURATOR 2.0 (spec §8, §106) — the legacy simulator's engine, connected. */
export default function ConfiguratorPage() {
  const e = useEngine();
  const { byId } = useData();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const saved = useRecords<Configuration>('configuration');
  const editing = params.get('cfg') ? (byId.get(params.get('cfg')!) as unknown as Configuration | undefined) : undefined;
  const [s, setS] = useState<ConfigState | null>(null);
  const [fam, setFam] = useState<string>('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [compareId, setCompareId] = useState('');

  useEffect(() => {
    if (!e || s) return;
    if (editing) {
      setS(stateFromConfiguration(editing));
      setName(editing.name);
      return;
    }
    const pk = params.get('product');
    if (pk && e.products.has(pk)) {
      let st = e.initialState(pk);
      const app = params.get('app');
      if (app) st = e.withApplication(st, app);
      setS(st);
    }
  }, [e, editing, params, s]);

  const view = useMemo(() => {
    if (!e || !s) return null;
    return { p: e.product(s)!, price: e.price(s), ph: e.physics(s), comp: e.compatibility(s), reco: e.recommendations(s), desig: e.designation(s), hash: e.legacyHash(s) };
  }, [e, s]);

  if (!e) return <EmptyState title="Configurator data unavailable" explain="Platform, source, objective or module datasets did not load." />;
  const families = [...new Set([...e.products.values()].map((p) => p.family_id))];
  const byFam = (f: string) => [...e.products.values()].filter((p) => p.family_id === f);

  const save = async (asNewVersion: boolean) => {
    if (!s) return;
    const base = editing && !asNewVersion ? editing : undefined;
    const id = base?.id ?? newLocalId('configuration');
    const rec = configurationFromState(e, s, {
      ...(base ?? {}),
      id,
      name: name.trim() || `${view?.p.name} — ${view?.desig}`,
      version: asNewVersion && editing ? (editing.version ?? 1) + 1 : (base?.version ?? 1),
      ...(asNewVersion && editing ? { parent_id: editing.id, opportunity_id: editing.opportunity_id, customer_id: editing.customer_id } : {}),
    });
    const r = await repo().workspace.save(rec as unknown as Record<string, unknown>, asNewVersion && editing ? 'New configuration version' : 'Saved configuration');
    setMsg('Saved as local draft.');
    nav(`/record/${encodeURIComponent(r.id)}`);
  };

  const cmp = compareId ? (byId.get(compareId) as unknown as Configuration | undefined) : undefined;

  return (
    <div>
      <PageHeader
        eyebrow="Products"
        title="Product Configurator 2.0"
        subtitle="Laser, application, process, machine configuration, modules, optics, motion, vision, controls, safety, utilities, cost, BOM and compatibility — on the TEAL catalogue data. Prices are parametric ESTIMATES, not quotations."
        actions={
          s && (
            <>
              <a href={assetUrl(`legacy/laser-simulator/index.html#${view?.hash}`)} target="_blank" rel="noreferrer">
                <Button>
                  <ExternalLink className="size-3.5" /> Open in 3D simulator (legacy)
                </Button>
              </a>
              <Button onClick={() => view && download(`teal-configuration-${view.desig}-${stamp()}.json`, JSON.stringify(configurationFromState(e, s, { id: editing?.id ?? 'cfg-export', name: name || view.desig || 'configuration' }), null, 2))}>Export JSON</Button>
            </>
          )
        }
      />
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-3">
          <Card title="01 · Family & platform">
            <div className="mb-2 flex flex-wrap gap-1">
              {families.map((f) => (
                <Button key={f} size="sm" variant={(fam || (view ? view.p.family_id : '')) === f ? 'primary' : 'default'} onClick={() => setFam(f)}>
                  {byId.get(f)?.name ?? f}
                </Button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {byFam(fam || view?.p.family_id || families[0]).map((p) => (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => {
                    setS(e.initialState(p.key));
                    setMsg('');
                  }}
                  aria-pressed={s?.productKey === p.key}
                  className={clsx('rounded-md border p-2 text-left hover:border-accent', s?.productKey === p.key ? 'border-accent bg-accent-soft' : 'border-line')}
                >
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-[12px] text-ink-2">{p.title}</div>
                  <div className="mt-1 text-[11px] text-ink-3">
                    {p.delivery} · {p.source_keys.join('/')} · from {inr(p.base_price_inr)} est.
                  </div>
                </button>
              ))}
            </div>
          </Card>
          {s && view && (
            <>
              <Card title="02 · Application">
                <div className="grid gap-2 sm:grid-cols-2">
                  {view.p.applications.map((a) => (
                    <button type="button" key={a.key} onClick={() => setS(e.withApplication(s, a.key))} aria-pressed={s.appKey === a.key} className={clsx('rounded-md border p-2 text-left hover:border-accent', s.appKey === a.key ? 'border-accent bg-accent-soft' : 'border-line')}>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-[12px] text-ink-2">{a.description}</div>
                      <div className="mt-0.5 text-[11.5px] text-ink-3">{a.rationale}</div>
                    </button>
                  ))}
                </div>
              </Card>
              <Card title="03 · Source, power & objective">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Laser source" htmlFor="cfg-src">
                    <Select id="cfg-src" value={s.sourceKey} onChange={(ev) => setS(e.withSource(s, ev.target.value))}>
                      {view.p.source_keys.map((k) => (
                        <option key={k} value={k}>
                          {e.sources.get(k)?.name} — {e.sources.get(k)?.wavelength.original}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Power class (W)" htmlFor="cfg-pw">
                    <Select id="cfg-pw" value={s.powerW} onChange={(ev) => setS({ ...s, powerW: Number(ev.target.value) })}>
                      {e.powersFor(view.p, s.sourceKey).map((w) => (
                        <option key={w} value={w}>
                          {w} W
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="F-theta objective" htmlFor="cfg-lens">
                    <Select id="cfg-lens" value={s.lensKey} onChange={(ev) => setS({ ...s, lensKey: ev.target.value })}>
                      {view.p.lens_keys.map((k) => (
                        <option key={k} value={k}>
                          {e.lenses.get(k)?.short_code} — f {e.lenses.get(k)?.focal_length_mm} mm, field {e.lenses.get(k)?.scan_field_mm} mm
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Target throughput (parts/h)" htmlFor="cfg-t" hint="Optional — used by the legacy 3D cycle simulation">
                    <Input id="cfg-t" type="number" value={s.targetPerHour ?? ''} onChange={(ev) => setS({ ...s, targetPerHour: ev.target.value ? Number(ev.target.value) : undefined })} />
                  </Field>
                </div>
              </Card>
              <Card title="04 · Integration — modules, software, connectivity">
                {[...new Set([...e.modules.values()].map((m) => m.group))].map((g) => (
                  <fieldset key={g} className="mb-2">
                    <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-3">{g}</legend>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {[...e.modules.values()]
                        .filter((m) => m.group === g)
                        .map((m) => {
                          const std = view.p.standard_content.includes(m.key);
                          const isSw = m.kind === 'software';
                          const isExtra = m.kind === 'connectivity' || m.kind === 'compliance';
                          const on = isSw ? s.software === m.key : isExtra ? s.extras.includes(m.key) : s.modules.includes(m.key);
                          const fits = e.modFits(view.p, m.key);
                          const toggle = () => {
                            if (isSw) setS({ ...s, software: m.key });
                            else if (isExtra) setS({ ...s, extras: on ? s.extras.filter((x) => x !== m.key) : [...s.extras, m.key] });
                            else if (!std) setS({ ...s, modules: on ? s.modules.filter((x) => x !== m.key) : [...s.modules, m.key] });
                          };
                          return (
                            <label key={m.key} className={clsx('flex cursor-pointer items-start gap-2 rounded border px-2 py-1', on ? 'border-accent bg-accent-soft/60' : 'border-line', !fits && 'opacity-70')}>
                              <input type={isSw ? 'radio' : 'checkbox'} name={isSw ? 'sw' : undefined} checked={on} disabled={std} onChange={toggle} className="mt-1" />
                              <span className="min-w-0">
                                <span className="font-medium">{m.name}</span> {std && <Badge tone="ok">standard</Badge>} {!fits && <Badge tone="warn" title="Fitment rule: not normally fitted to this platform">fitment</Badge>}
                                <span className="block text-[11.5px] text-ink-3">
                                  {m.description} · {std ? 'included' : m.price_estimate_inr ? `${inr(m.price_estimate_inr)} est.` : '—'}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </fieldset>
                ))}
              </Card>
            </>
          )}
          {!s && <EmptyState title="Choose a platform" explain="Start from a TEAL platform, or run Create product from inquiry to get a draft configuration." />}
        </div>

        {s && view && (
          <div className="min-w-0 space-y-3 xl:sticky xl:top-14 xl:self-start">
            <Card title="Configuration" actions={<Badge tone="draft">DRAFT</Badge>}>
              <div className="num mb-1 text-[15px] font-semibold">{view.desig}</div>
              <div className="mb-2 text-[12px] text-ink-2">{view.p.title}</div>
              <div className="rounded-md border border-line bg-panel-2 p-2">
                <div className="text-[11px] font-semibold uppercase text-ink-3">Price band — parametric ESTIMATE (ex-works)</div>
                <div className="num text-lg font-semibold">{view.price.band ? `${inr(view.price.band[0])} – ${inr(view.price.band[1])}` : <Unknown />}</div>
                <details className="mt-1 text-[12px]">
                  <summary className="cursor-pointer text-accent-2">Breakdown</summary>
                  <Table head={['Item', 'Δ INR']} dense>
                    {view.price.breakdown.map((b, i) => (
                      <tr key={i}>
                        <td>{b.label}</td>
                        <td className="num text-right">{Math.round(b.value).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </Table>
                  <p className="mt-1 text-ink-3">Legacy configurator price() — not a quotation. Cost comes from the Cost Engine.</p>
                </details>
              </div>
            </Card>
            <Card title="Optics & process physics">
              {view.ph ? (
                <KV
                  items={[
                    ['Spot diameter', <CalcValue key="s" c={view.ph.spot} />],
                    ['Depth of focus', <CalcValue key="d" c={view.ph.dof} />],
                    ['Mode', view.ph.mode],
                    ...(view.ph.pulseEnergy ? ([['Pulse energy', <CalcValue key="e" c={view.ph.pulseEnergy} />]] as [string, React.ReactNode][]) : []),
                    ...(view.ph.peakPower ? ([['Peak power', <CalcValue key="p" c={view.ph.peakPower} />]] as [string, React.ReactNode][]) : []),
                    ...(view.ph.fluence ? ([['Fluence', <CalcValue key="f" c={view.ph.fluence} />]] as [string, React.ReactNode][]) : []),
                    [view.ph.irradiance.label, <CalcValue key="i" c={view.ph.irradiance} />],
                    ['Regime', view.ph.regime ? <span title={view.ph.regime.basis}>{view.ph.regime.name}</span> : <Unknown />],
                    ['Absorptance', view.ph.absorption ? `${view.ph.absorption.value ?? 'UNKNOWN'} (${view.ph.absorption.material}, ${view.ph.absorption.band} band, indicative)` : <Unknown />],
                    ...(view.ph.diffusion ? ([['Thermal diffusion / pulse', <CalcValue key="t" c={view.ph.diffusion} />]] as [string, React.ReactNode][]) : []),
                    ['Wall plug', <CalcValue key="w" c={view.ph.wallPlug} />],
                    ['Cooling', view.ph.cooling ?? <Unknown />],
                  ]}
                />
              ) : (
                <Unknown />
              )}
            </Card>
            <Card title="Compatibility">
              <ul className="space-y-0.5 text-[12.5px]">
                {view.comp.map((c, i) => (
                  <li key={i} className="flex gap-2">
                    <Badge tone={c.status === 'OK' ? 'ok' : c.status === 'FAIL' ? 'bad' : c.status === 'WARNING' ? 'warn' : 'neutral'}>{c.status}</Badge>
                    <span>
                      <b>{c.check}</b> — {c.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
            {view.reco.length > 0 && (
              <Card title={`Recommendations (${view.reco.length})`}>
                <ul className="space-y-2">
                  {view.reco.map((h) => (
                    <li key={h.rule.id}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{h.rule.name}</span>
                        <span className="flex items-center gap-1">
                          <WhyButton record={h.rule} />
                          <Button size="sm" onClick={() => setS(e.applyRecommendation(s, h))}>
                            Apply
                          </Button>
                        </span>
                      </div>
                      <div className="text-[12px] text-ink-2">{h.rule.why}</div>
                      <div className="text-[11.5px] text-ink-3">{h.items.map((i) => `${i.type === 'std' ? '✓ ' : '+ '}${i.name}`).join(' · ')}</div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <Card title="Save & compare">
              <Notice tone="draft">Saved to the local workspace. Commit via Admin → Change package.</Notice>
              <div className="mt-2 space-y-2">
                <Input aria-label="Configuration name" placeholder="Configuration name" value={name} onChange={(ev) => setName(ev.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={() => void save(false)}>
                    {editing ? 'Save changes' : 'Save configuration'}
                  </Button>
                  {editing && <Button onClick={() => void save(true)}>Save as new version</Button>}
                </div>
                {msg && <p className="text-[12px] text-ink-3">{msg}</p>}
                <Select aria-label="Compare with" value={compareId} onChange={(ev) => setCompareId(ev.target.value)}>
                  <option value="">Compare with a saved configuration…</option>
                  {saved.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                {cmp && <CompareTable a={s} b={stateFromConfiguration(cmp)} e={e} bName={cmp.name} />}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export function CompareTable({ a, b, e, bName }: { a: ConfigState; b: ConfigState; e: ConfiguratorEngine; bName: string }) {
  const row = (label: string, x: unknown, y: unknown) => (
    <tr key={label} className={JSON.stringify(x) !== JSON.stringify(y) ? 'bg-warn/5' : ''}>
      <td className="text-ink-3">{label}</td>
      <td>{Array.isArray(x) ? x.join(', ') : String(x ?? '—')}</td>
      <td>{Array.isArray(y) ? y.join(', ') : String(y ?? '—')}</td>
    </tr>
  );
  const pa = e.price(a).value;
  const pb = e.price(b).value;
  return (
    <Table head={['', 'Current', bName]} dense>
      {row('Designation', e.designation(a), e.designation(b))}
      {row('Platform', a.productKey, b.productKey)}
      {row('Application', a.appKey, b.appKey)}
      {row('Source', a.sourceKey, b.sourceKey)}
      {row('Power W', a.powerW, b.powerW)}
      {row('Objective', a.lensKey, b.lensKey)}
      {row('Modules', a.modules, b.modules)}
      {row('Software', a.software, b.software)}
      {row('Extras', a.extras, b.extras)}
      {row('Price est. INR', pa && Math.round(pa).toLocaleString('en-IN'), pb && Math.round(pb).toLocaleString('en-IN'))}
      {row('Spot µm', e.physics(a)?.spot.value?.toFixed(1), e.physics(b)?.spot.value?.toFixed(1))}
    </Table>
  );
}
