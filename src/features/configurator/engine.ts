import { absorptionBand, depthOfFocus, fluence, intensity, peakPower, processRegime, pulseEnergy, spotDiameter, thermalDiffusionLength, wallPlugPower, type ProcessRegime } from '../../calculations/laser';
import type { CalcResult } from '../../calculations/types';
import type { LaserSource, Material, Module, ModuleConflict, Optic, Product, RecommendationRule } from '../../domain/entities';

/*
 * TEAL PRODUCT CONFIGURATOR 2.0 — engine.
 * Ported from the legacy TEAL Laser Equipment Configurator (index.html: powersFor, snapPower,
 * stdSeed, pickPlatform, price, desig, modFits, modConflicts, recoMatches/evalReco, advise,
 * encodeState). Behaviour is kept identical and pinned by tests/unit/configurator.test.ts.
 */

export interface PricingRules {
  band_lo: number;
  band_hi: number;
  pw_up: number;
  pw_dn: number;
  lens_uplift: number;
}

export interface ConfigCatalog {
  products: Product[];
  sources: LaserSource[];
  lenses: Optic[];
  modules: Module[];
  conflicts: ModuleConflict[];
  rules: RecommendationRule[];
  materials: Material[];
  pricing: PricingRules;
}

export interface ConfigState {
  productKey: string;
  appKey?: string;
  sourceKey?: string;
  powerW?: number;
  lensKey?: string;
  modules: string[];
  software?: string;
  extras: string[];
  targetPerHour?: number;
}

const byKey = <T extends { id: string }>(list: T[], prefix: string) => new Map(list.map((x) => [x.id.slice(prefix.length + 1), x]));

export class ConfiguratorEngine {
  readonly products: Map<string, Product>;
  readonly sources: Map<string, LaserSource>;
  readonly lenses: Map<string, Optic>;
  readonly modules: Map<string, Module>;
  readonly materials: Map<string, Material>;
  constructor(readonly cat: ConfigCatalog) {
    this.products = new Map(cat.products.map((p) => [p.key, p]));
    this.sources = byKey(cat.sources, 'las');
    this.lenses = byKey(cat.lenses, 'opt');
    this.modules = new Map(cat.modules.map((m) => [m.key, m]));
    this.materials = byKey(cat.materials, 'mat');
  }

  product(s: ConfigState): Product | undefined {
    return this.products.get(s.productKey);
  }

  powersFor(p: Product, src?: string): number[] {
    if (p.powers_by_source && src && p.powers_by_source[src]?.length) return p.powers_by_source[src];
    return p.powers_w ?? [];
  }

  snapPower(p: Product, src: string | undefined, want: number): number {
    const list = this.powersFor(p, src);
    if (!list.length) return want;
    if (list.includes(want)) return want;
    let best = list[0];
    let bd = Math.abs(list[0] - want);
    for (const v of list) {
      const d = Math.abs(v - want);
      if (d < bd) {
        bd = d;
        best = v;
      }
    }
    return best;
  }

  isAutomation(k: string): boolean {
    return this.modules.get(k)?.kind === 'automation';
  }

  /** Legacy pickPlatform(): defaults, standard content, matching LaserSuite edition. */
  initialState(productKey: string): ConfigState {
    const p = this.products.get(productKey);
    if (!p) throw new Error(`Unknown product "${productKey}"`);
    const std = p.standard_content;
    const famKey = p.family_id.replace(/^fam-/, '');
    return {
      productKey,
      appKey: p.applications[0]?.key,
      sourceKey: p.default_source_key,
      powerW: this.snapPower(p, p.default_source_key, p.default_power_w),
      lensKey: p.default_lens_key,
      modules: std.filter((k) => this.isAutomation(k)),
      extras: std.filter((k) => this.modules.has(k) && !this.isAutomation(k) && this.modules.get(k)?.kind !== 'software'),
      software: famKey === 'volt' ? 'volt' : p.delivery === 'galvo2' || famKey === 'auto' ? 'inline' : 'desktop',
    };
  }

  /** Apply an application's recommended source/power (as the legacy app step 03 does). */
  withApplication(s: ConfigState, appKey: string): ConfigState {
    const p = this.product(s);
    const a = p?.applications.find((x) => x.key === appKey);
    if (!p || !a) return { ...s, appKey };
    const src = a.source_key && p.source_keys.includes(a.source_key) ? a.source_key : s.sourceKey;
    return { ...s, appKey, sourceKey: src, powerW: this.snapPower(p, src, a.power_w ?? s.powerW ?? p.default_power_w) };
  }

  withSource(s: ConfigState, sourceKey: string): ConfigState {
    const p = this.product(s);
    if (!p) return s;
    return { ...s, sourceKey, powerW: this.snapPower(p, sourceKey, s.powerW ?? p.default_power_w) };
  }

  /** Legacy modFits(): can platform p physically accept module k? */
  modFits(p: Product, k: string): boolean {
    const f = this.modules.get(k)?.fitment;
    if (!f) return true;
    const fam = p.family_id.replace(/^fam-/, '');
    if (f.fam && !f.fam.includes(fam)) return false;
    if (f.noFam && f.noFam.includes(fam)) return false;
    if (f.deliv && !f.deliv.includes(p.delivery)) return false;
    if (f.noDeliv && f.noDeliv.includes(p.delivery)) return false;
    if (f.noPlat && f.noPlat.includes(p.key)) return false;
    if (f.mat && !p.applications.some((a) => a.material_key && f.mat!.includes(a.material_key))) return false;
    return true;
  }

  /** Legacy modConflicts(): selected pairs that cannot coexist. */
  conflicts(s: ConfigState): ModuleConflict[] {
    const sel = new Set(s.modules);
    return this.cat.conflicts.filter((c) => sel.has(c.a.replace(/^mod-/, '')) && sel.has(c.b.replace(/^mod-/, '')));
  }

  /** Legacy price(): parametric ex-works ESTIMATE in INR. */
  price(s: ConfigState): { value: number | null; band: [number, number] | null; breakdown: { label: string; value: number }[] } {
    const p = this.product(s);
    if (!p || p.base_price_inr == null) return { value: null, band: null, breakdown: [] };
    const R = this.cat.pricing;
    const breakdown: { label: string; value: number }[] = [];
    let v = p.base_price_inr;
    breakdown.push({ label: `${p.name} standard machine (base)`, value: v });
    if (s.powerW != null && p.default_power_w) {
      const r = s.powerW / p.default_power_w;
      const before = v;
      if (r > 1) v *= 1 + (r - 1) * R.pw_up;
      else if (r < 1) v *= 1 - (1 - r) * R.pw_dn;
      if (v !== before) breakdown.push({ label: `Power scaling ${s.powerW} W vs ${p.default_power_w} W`, value: v - before });
    }
    if (s.sourceKey && p.default_source_key) {
      const a = this.sources.get(s.sourceKey)?.price_premium ?? 1;
      const b = this.sources.get(p.default_source_key)?.price_premium ?? 1;
      const before = v;
      v *= a / b;
      if (v !== before) breakdown.push({ label: `Source premium (${s.sourceKey} vs ${p.default_source_key})`, value: v - before });
    }
    if (s.lensKey === 'f420') {
      const before = v;
      v *= R.lens_uplift;
      breakdown.push({ label: 'Large objective uplift (F420)', value: v - before });
    }
    const std = p.standard_content;
    for (const k of [...s.modules, ...(s.extras ?? [])]) {
      const m = this.modules.get(k);
      if (m && !std.includes(k) && m.price_estimate_inr != null) {
        v += m.price_estimate_inr;
        breakdown.push({ label: m.name, value: m.price_estimate_inr });
      }
    }
    if (s.software) {
      const sw = this.modules.get(s.software);
      if (sw?.price_estimate_inr) {
        v += sw.price_estimate_inr;
        breakdown.push({ label: sw.name, value: sw.price_estimate_inr });
      }
    }
    return { value: v, band: [v * R.band_lo, v * R.band_hi], breakdown };
  }

  /** Legacy desig(): designation code. */
  designation(s: ConfigState): string | null {
    const p = this.product(s);
    if (!p) return null;
    const parts = ['TEAL', p.code];
    if (s.sourceKey) parts.push(this.sources.get(s.sourceKey)?.short_code ?? s.sourceKey.toUpperCase());
    if (s.powerW != null) parts.push(`${s.powerW}W`);
    if (s.lensKey) parts.push(this.lenses.get(s.lensKey)?.short_code ?? s.lensKey);
    const extra = s.modules.filter((k) => !p.standard_content.includes(k));
    if (extra.length) parts.push(`${String(extra.length).padStart(2, '0')}M`);
    if (s.software && s.software !== 'desktop') parts.push(s.software.slice(0, 3).toUpperCase());
    return parts.join('-');
  }

  /** Legacy evalReco(): rules whose conditions all match, gated by fitment. */
  recommendations(s: ConfigState): { rule: RecommendationRule; items: { type: 'std' | 'mod' | 'extra' | 'sw'; key: string; name: string; price: number | null }[] }[] {
    const p = this.product(s);
    if (!p) return [];
    const fam = p.family_id.replace(/^fam-/, '');
    const app = p.applications.find((a) => a.key === s.appKey);
    const ctx: Record<string, string | undefined> = { fam, plat: p.key, app: s.appKey, src: s.sourceKey };
    const out: ReturnType<ConfiguratorEngine['recommendations']> = [];
    for (const rule of this.cat.rules) {
      const c = rule.iff as Record<string, unknown>;
      let ok = true;
      for (const k of ['fam', 'plat', 'app', 'src']) {
        const list = c[k] as string[] | undefined;
        if (list?.length && !list.includes(ctx[k] ?? '')) ok = false;
      }
      if (c.deliv && !(c.deliv as string[]).includes(p.delivery)) ok = false;
      if (c.mat && !(app?.material_key && (c.mat as string[]).includes(app.material_key))) ok = false;
      if (c.pwMin != null && !((s.powerW ?? -Infinity) >= (c.pwMin as number))) ok = false;
      if (c.pwMax != null && !((s.powerW ?? Infinity) <= (c.pwMax as number))) ok = false;
      const n = c.not as Record<string, string[]> | undefined;
      if (n) {
        if (n.fam?.includes(fam)) ok = false;
        if (n.plat?.includes(p.key)) ok = false;
        if (n.app && s.appKey && n.app.includes(s.appKey)) ok = false;
        if (n.src && s.sourceKey && n.src.includes(s.sourceKey)) ok = false;
        if (n.deliv?.includes(p.delivery)) ok = false;
        if (n.mat && app?.material_key && n.mat.includes(app.material_key)) ok = false;
      }
      if (!ok) continue;
      const t = rule.then as { mods?: string[]; extra?: string[]; sw?: string };
      const items: (typeof out)[number]['items'] = [];
      for (const m of t.mods ?? []) {
        const mod = this.modules.get(m);
        if (!mod || !this.modFits(p, m)) continue;
        if (p.standard_content.includes(m)) items.push({ type: 'std', key: m, name: mod.name, price: null });
        else if (!s.modules.includes(m)) items.push({ type: 'mod', key: m, name: mod.name, price: mod.price_estimate_inr });
      }
      for (const x of t.extra ?? []) {
        const mod = this.modules.get(x);
        if (!mod || !this.modFits(p, x)) continue;
        if (p.standard_content.includes(x)) items.push({ type: 'std', key: x, name: mod.name, price: null });
        else if (!s.extras.includes(x)) items.push({ type: 'extra', key: x, name: mod.name, price: mod.price_estimate_inr });
      }
      if (t.sw && this.modules.has(t.sw) && s.software !== t.sw) items.push({ type: 'sw', key: t.sw, name: this.modules.get(t.sw)!.name, price: this.modules.get(t.sw)!.price_estimate_inr });
      if (items.length) out.push({ rule, items });
    }
    return out;
  }

  applyRecommendation(s: ConfigState, hit: ReturnType<ConfiguratorEngine['recommendations']>[number]): ConfigState {
    const next = { ...s, modules: [...s.modules], extras: [...s.extras] };
    for (const i of hit.items) {
      if (i.type === 'mod' && !next.modules.includes(i.key)) next.modules.push(i.key);
      else if (i.type === 'extra' && !next.extras.includes(i.key)) next.extras.push(i.key);
      else if (i.type === 'sw') next.software = i.key;
    }
    return next;
  }

  /** Optics + process physics as CalcResults (legacy optics()/physics()). */
  physics(s: ConfigState): {
    spot: CalcResult;
    dof: CalcResult;
    pulseEnergy: CalcResult | null;
    peakPower: CalcResult | null;
    fluence: CalcResult | null;
    irradiance: CalcResult;
    regime: ProcessRegime | null;
    absorption: { band: string; value: number | null; material: string } | null;
    diffusion: CalcResult | null;
    wallPlug: CalcResult;
    cooling: string | null;
    mode: 'pulsed' | 'cw' | null;
  } | null {
    const p = this.product(s);
    const src = s.sourceKey ? this.sources.get(s.sourceKey) : undefined;
    const lens = s.lensKey ? this.lenses.get(s.lensKey) : undefined;
    if (!p || !src || !lens) return null;
    const wl = src.wavelength.value;
    const spot = spotDiameter({ wavelength_nm: wl, focal_mm: lens.focal_length_mm, m2: src.m2, beam_mm: src.beam_diameter_mm });
    const dof = depthOfFocus({ spot_um: spot.value, wavelength_nm: wl, m2: src.m2 });
    const fam = p.family_id.replace(/^fam-/, '');
    const tauNs = src.pulse_duration && src.pulse_duration.unit === 'ns' ? src.pulse_duration.value : null;
    // Effective mode: a pulsed source above ~400 W on a welding/cutting platform (non-QCW) runs CW.
    let pulsed = src.mode === 'pulsed';
    if (pulsed && (fam === 'weld' || fam === 'cut') && (s.powerW ?? 0) >= 400 && (tauNs ?? 0) < 1000) pulsed = false;
    let pe: CalcResult | null = null;
    let pk: CalcResult | null = null;
    let fl: CalcResult | null = null;
    let irr: CalcResult;
    if (pulsed && src.repetition_rate_khz) {
      const f = Math.sqrt(src.repetition_rate_khz[0] * src.repetition_rate_khz[1]);
      pe = pulseEnergy({ power_w: s.powerW, rep_khz: f });
      pe.assumptions.push(`Repetition rate = geometric mean of the source band ${src.repetition_rate_khz[0]}–${src.repetition_rate_khz[1]} kHz (${f.toFixed(1)} kHz)`);
      pk = peakPower({ pulse_energy_mj: pe.value, pulse_ns: tauNs });
      fl = fam !== 'weld' ? fluence({ pulse_energy_mj: pe.value, spot_um: spot.value }) : null;
      irr = intensity({ power_w: pk.value != null ? pk.value * 1000 : null, spot_um: spot.value });
      irr = { ...irr, label: 'Peak irradiance', assumptions: [...irr.assumptions, 'Computed with peak power'] };
    } else {
      irr = intensity({ power_w: s.powerW, spot_um: spot.value });
    }
    const app = p.applications.find((a) => a.key === s.appKey);
    const mat = app?.material_key ? this.materials.get(app.material_key) : undefined;
    let absorption = null;
    let diffusion: CalcResult | null = null;
    if (mat && wl != null) {
      const band = absorptionBand(wl);
      absorption = { band, value: mat.absorption?.[band] ?? null, material: mat.name };
      if (pulsed && tauNs != null) {
        diffusion = thermalDiffusionLength({ k: mat.thermal_conductivity?.value, rho: mat.density?.value, cp: mat.specific_heat?.value, pulse_ns: tauNs });
      }
    }
    const wall = wallPlugPower({ power_w: s.powerW, efficiency: src.wall_plug_efficiency });
    const heatKw = wall.value != null && s.powerW != null ? wall.value - s.powerW / 1000 : null;
    const cooling = wall.value == null ? null : wall.value > 2 ? `Chiller, approx. ${(Math.ceil((heatKw ?? 0) * 1.25 * 10) / 10).toFixed(1)} kW heat rejection (estimate)` : 'Air cooled (estimate)';
    const regime = processRegime({ family: fam, irradiance_w_cm2: irr.value, fluence_j_cm2: fl?.value ?? null, pulse_ns: tauNs });
    return { spot, dof, pulseEnergy: pe, peakPower: pk, fluence: fl, irradiance: irr, regime, absorption, diffusion, wallPlug: wall, cooling, mode: pulsed ? 'pulsed' : 'cw' };
  }

  /** Compatibility checks (spec §42) where data exists; UNKNOWN otherwise. */
  compatibility(s: ConfigState): { check: string; status: 'OK' | 'WARNING' | 'FAIL' | 'UNKNOWN'; detail: string }[] {
    const p = this.product(s);
    if (!p) return [];
    const out: ReturnType<ConfiguratorEngine['compatibility']> = [];
    const src = s.sourceKey ? this.sources.get(s.sourceKey) : undefined;
    out.push(
      s.sourceKey && p.source_keys.includes(s.sourceKey)
        ? { check: 'Laser ↔ platform', status: 'OK', detail: `${src?.name ?? s.sourceKey} is offered on ${p.name}` }
        : { check: 'Laser ↔ platform', status: 'FAIL', detail: `${s.sourceKey ?? 'No source'} is not offered on ${p.name}` },
    );
    const powers = this.powersFor(p, s.sourceKey);
    out.push(
      s.powerW != null && powers.includes(s.powerW)
        ? { check: 'Power class', status: 'OK', detail: `${s.powerW} W is a catalogue power class for this source` }
        : { check: 'Power class', status: 'WARNING', detail: `${s.powerW ?? '—'} W is not a catalogue class (${powers.join(', ')} W)` },
    );
    out.push(
      s.lensKey && p.lens_keys.includes(s.lensKey)
        ? { check: 'Objective ↔ platform', status: 'OK', detail: `${s.lensKey.toUpperCase()} offered on ${p.name}` }
        : { check: 'Objective ↔ platform', status: 'FAIL', detail: `${s.lensKey ?? 'No objective'} not offered on ${p.name}` },
    );
    out.push({ check: 'Wavelength ↔ optic coating', status: 'UNKNOWN', detail: 'COMPATIBILITY UNKNOWN — objective coating data not held' });
    out.push({ check: 'Power ↔ damage threshold', status: 'UNKNOWN', detail: 'COMPATIBILITY UNKNOWN — optic damage-threshold data not held' });
    out.push({ check: 'Galvo ↔ lens', status: 'UNKNOWN', detail: 'COMPATIBILITY UNKNOWN — scanner aperture data not held' });
    const app = p.applications.find((a) => a.key === s.appKey);
    if (app?.source_key)
      out.push(
        app.source_key === s.sourceKey
          ? { check: 'Laser ↔ process', status: 'OK', detail: `${app.name}: catalogue recommends ${app.source_key}` }
          : { check: 'Laser ↔ process', status: 'WARNING', detail: `${app.name}: catalogue recommends ${app.source_key}, configured ${s.sourceKey}` },
      );
    for (const k of [...s.modules, ...s.extras]) {
      if (!this.modFits(p, k)) out.push({ check: 'Module ↔ architecture', status: 'WARNING', detail: `${this.modules.get(k)?.name ?? k} is not normally fitted to ${p.name} (fitment rule) — flagged, not blocked` });
    }
    for (const c of this.conflicts(s)) out.push({ check: 'Module conflict', status: 'FAIL', detail: c.reason });
    return out;
  }

  /** Legacy encodeState(): URL hash understood by the legacy 3D simulator. */
  legacyHash(s: ConfigState): string {
    const q = [`p=${s.productKey}`];
    if (s.appKey) q.push(`a=${s.appKey}`);
    if (s.sourceKey) q.push(`s=${s.sourceKey}`);
    if (s.powerW != null) q.push(`w=${s.powerW}`);
    if (s.lensKey) q.push(`l=${s.lensKey}`);
    if (s.modules.length) q.push(`m=${s.modules.join('.')}`);
    if (s.software) q.push(`f=${s.software}`);
    if (s.extras.length) q.push(`x=${s.extras.join('.')}`);
    if (s.targetPerHour && s.targetPerHour > 0) q.push(`t=${Math.round(s.targetPerHour)}`);
    return q.join('&');
  }
}
