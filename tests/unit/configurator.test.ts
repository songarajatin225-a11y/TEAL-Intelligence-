import { describe, expect, it } from 'vitest';
import type { LaserSource, Material, Module, ModuleConflict, Optic, Product, RecommendationRule } from '../../src/domain/entities';
import { ConfiguratorEngine, type ConfigState, type PricingRules } from '../../src/features/configurator/engine';
import { config, dataset, fixture } from '../helpers/data';

const engine = new ConfiguratorEngine({
  products: dataset<Product>('products/platforms.json'),
  sources: dataset<LaserSource>('laser/laser-source-classes.json'),
  lenses: dataset<Optic>('optics/f-theta-objectives.json'),
  modules: dataset<Module>('modules/automation-modules.json'),
  conflicts: dataset<ModuleConflict>('modules/module-conflicts.json'),
  rules: dataset<RecommendationRule>('knowledge/recommendation-rules.json'),
  materials: dataset<Material>('materials/materials.json'),
  pricing: config<PricingRules>('config/configurator-pricing-rules.json'),
});

interface GoldenSim {
  input: { plat: string; app: string; src: string; pw: number; lens: string; mods: string[]; sw: string; extra: string[] };
  price: number;
  designation: string;
  spot_um: number;
  dof_um: number;
  reco: { id: string; items: string[] }[];
}
const golden = fixture<{ sim: GoldenSim[] }>('legacy-golden.json').sim;
const toState = (i: GoldenSim['input']): ConfigState => ({ productKey: i.plat, appKey: i.app, sourceKey: i.src, powerW: i.pw, lensKey: i.lens, modules: i.mods, software: i.sw, extras: i.extra });

describe('Configurator 2.0 reproduces the legacy simulator', () => {
  for (const g of golden) {
    const s = toState(g.input);
    it(`${g.input.plat}/${g.input.src}/${g.input.pw}W — price, designation, optics, recommendations`, () => {
      expect(engine.price(s).value).toBeCloseTo(g.price, 4);
      expect(engine.designation(s)).toBe(g.designation);
      const ph = engine.physics(s)!;
      expect(ph.spot.value).toBeCloseTo(g.spot_um, 6);
      // legacy "dof" is ±z_R in µm; the OS reports the full 2·z_R window in mm
      expect(ph.dof.value! / 2).toBeCloseTo(g.dof_um / 1000, 6);
      const reco = engine.recommendations(s).map((h) => ({ id: `r-${h.rule.id.replace(/^rul-/, '')}`, items: h.items.map((i) => `${i.type}:${i.key}`) }));
      expect(reco).toEqual(g.reco);
    });
  }
});

describe('configurator behaviour', () => {
  it('initial state seeds standard content and the matching LaserSuite edition', () => {
    const s = engine.initialState('markc2i');
    expect(s.modules).toEqual(['visfid', 'conveyor', 'fume', 'visver']);
    expect(s.software).toBe('inline');
    expect(engine.initialState('voltm').software).toBe('volt');
  });
  it('standard content is never charged twice', () => {
    const s = engine.initialState('markc2i');
    const p = engine.price(s);
    expect(p.breakdown.some((b) => b.label.includes('SMEMA'))).toBe(false);
  });
  it('snaps power to the catalogue class for the source', () => {
    const s = engine.withSource(engine.initialState('markit'), 'uv');
    expect(s.powerW).toBe(10);
  });
  it('detects module conflicts', () => {
    const s = { ...engine.initialState('markf'), modules: ['turntbl', 'shuttle'] };
    const c = engine.compatibility(s);
    expect(c.some((x) => x.status === 'FAIL' && /turntable/i.test(x.detail))).toBe(true);
  });
  it('reports COMPATIBILITY UNKNOWN where no data exists (never guesses)', () => {
    const c = engine.compatibility(engine.initialState('markf'));
    expect(c.filter((x) => x.status === 'UNKNOWN').length).toBeGreaterThanOrEqual(3);
    expect(c.find((x) => x.check.startsWith('Wavelength'))!.detail).toMatch(/COMPATIBILITY UNKNOWN/);
  });
  it('legacy URL hash matches the simulator format', () => {
    const s: ConfigState = { productKey: 'markc2i', appKey: 'dual', sourceKey: 'co2', powerW: 30, lensKey: 'f254', modules: [], software: 'inline', extras: [] };
    expect(engine.legacyHash(s)).toBe('p=markc2i&a=dual&s=co2&w=30&l=f254&f=inline');
  });
  it('price band applies the pricing rules', () => {
    const p = engine.price(engine.initialState('markf'));
    expect(p.band![0]).toBeCloseTo(p.value! * 0.9, 6);
    expect(p.band![1]).toBeCloseTo(p.value! * 1.12, 6);
  });
});
