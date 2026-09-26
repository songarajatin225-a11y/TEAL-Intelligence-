/**
 * Run the LEGACY implementations (unchanged source, in a VM sandbox) and record their outputs
 * as golden fixtures. The OS ports must reproduce these exactly (tests/unit/*legacy*.test.ts).
 *   LEGACY_ROOT=/path node scripts/migration/generateLegacyGolden.cjs
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = process.env.LEGACY_ROOT || path.join(__dirname, '..', '..', '..', 'songarajatin225-a11y');

function extractFn(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`function ${name} not found`);
  let i = src.indexOf('{', start), depth = 0;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
  }
  return src.slice(start, i + 1);
}

/* ---------------- configurator ---------------- */
const simSrc = fs.readFileSync(path.join(ROOT, 'teal-laser-product-sim-2', 'index.html'), 'utf8');
const D = JSON.parse(fs.readFileSync(path.join(ROOT, 'teal-laser-product-sim-2', 'data.json'), 'utf8'));
const simCode = ['price', 'desig', 'optics', 'modFits', 'powersFor', 'snapPower', 'recoMatches', 'evalReco', 'matBand'].map((n) => extractFn(simSrc, n)).join('\n');
const MODCONFLICT = [
  ['cleanrm', 'dryroom'], ['glovebx', 'fume'], ['rotoidx', 'turntbl'], ['rotoidx', 'shuttle'], ['turntbl', 'shuttle'], ['conveyor', 'r2r'], ['robot6', 'cobotld'],
];
const cases = [
  { plat: 'markf', app: 'metal', src: 'fiber', pw: 30, lens: 'f254', mods: [], sw: 'desktop', extra: [] },
  { plat: 'markf', app: 'anod', src: 'mopa', pw: 50, lens: 'f420', mods: ['visfid'], sw: 'desktop', extra: [] },
  { plat: 'markc2i', app: 'dual', src: 'co2', pw: 30, lens: 'f254', mods: ['visfid', 'conveyor', 'fume', 'visver', 'reject'], sw: 'inline', extra: ['mes'] },
  { plat: 'semispm', app: 'perunit', src: 'fiber', pw: 20, lens: 'f163', mods: ['magazine', 'visver'], sw: 'inline', extra: ['secsgem', 'mes'] },
  { plat: 'weldb', app: 'tab', src: 'green', pw: 1500, lens: 'f254', mods: ['weldmon', 'wobble', 'gascon'], sw: 'volt', extra: [] },
  { plat: 'cutxg', app: 'haz', src: 'pico', pw: 100, lens: 'f100', mods: ['fume'], sw: 'desktop', extra: [] },
  { plat: 'robo', app: 'complex3d', src: 'smcw', pw: 2000, lens: 'f254', mods: ['robot6'], sw: 'inline', extra: ['connect'] },
];
const sim = cases.map((c) => {
  const S = { plat: c.plat, app: c.app, src: c.src, pw: c.pw, lens: c.lens, mods: Object.fromEntries(c.mods.map((m) => [m, true])), sw: c.sw, extra: Object.fromEntries(c.extra.map((m) => [m, true])) };
  const ctx = { ...D, S, MODCONFLICT, Math, console };
  ctx.P = () => (S.plat ? ctx.PLAT[S.plat] : null);
  ctx.A = () => { const p = ctx.P(); return p && S.app ? p.apps[S.app] : null; };
  vm.createContext(ctx);
  vm.runInContext(simCode, ctx);
  const reco = vm.runInContext('evalReco()', ctx).map((h) => ({ id: h.r.id, items: h.items.map((i) => `${i.t}:${i.k}`) }));
  const o = vm.runInContext('optics()', ctx);
  return { input: c, price: vm.runInContext('price()', ctx), designation: vm.runInContext('desig()', ctx), spot_um: o.spot, dof_um: o.dof, reco };
});

/* ---------------- cost platform ---------------- */
const costSrc = fs.readFileSync(path.join(ROOT, 'teal-cost-demo-7-8', 'assets', 'app.js'), 'utf8');
const masters = JSON.parse(fs.readFileSync(path.join(ROOT, 'teal-cost-demo-7-8', 'data', 'masters.json'), 'utf8'));
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'teal-cost-demo-7-8', 'data', 'projects.json'), 'utf8'));
/** Extract `const NAME = …;` honouring brackets and string literals. */
function constBlock(name) {
  const s = costSrc.indexOf(`const ${name} =`);
  if (s < 0) throw new Error(`const ${name} not found`);
  let depth = 0, q = null;
  for (let i = s; i < costSrc.length; i++) {
    const ch = costSrc[i];
    if (q) { if (ch === '\\') { i++; continue; } if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
    if (ch === '/' && costSrc[i + 1] === '/') { i = costSrc.indexOf('\n', i); continue; }
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (ch === ';' && depth === 0) return costSrc.slice(s, i + 1);
  }
  throw new Error(`unterminated const ${name}`);
}
function constArrayOrObj(name) {
  const s = costSrc.indexOf(`const ${name} = `);
  let i = s + `const ${name} = `.length; const open = costSrc[i]; const close = open === '[' ? ']' : '}';
  let depth = 0;
  for (; i < costSrc.length; i++) { if (costSrc[i] === open) depth++; else if (costSrc[i] === close) { depth--; if (depth === 0) break; } }
  return costSrc.slice(s, i + 1) + ';';
}
const costCode = [
  'var S = { db: { masters: MASTERS } };',
  'const uid = () => "x";',
  constBlock('N'),
  constBlock('fxOf'),
  ...['TYPE_MECH', 'TYPE_ELEC', 'ACT_SW', 'ACT_LAB', 'HEAD_SITE', 'HEAD_COMM', 'HEAD_AMC', 'MAT_CLASS', 'COMM_ACTS'].map(constBlock),
  constBlock('TEAL_DEFAULTS'),
  constBlock('tealP'),
  constBlock('crateSqm'),
  constBlock('MODULES'),
  constBlock('MOD_MAP'),
  constBlock('EQUIP_KEYS'),
  extractFn(costSrc, 'computeProject'),
  extractFn(costSrc, 'tealSheet'),
].join('\n');
const cost = seed.templates.map((t) => {
  const project = { id: t.id, qty: 2, lines: t.lines, landed: t.landed, markup: t.markup, teal: {} };
  const ctx = { MASTERS: masters, Math, Object, Number, parseFloat, Array, console };
  vm.createContext(ctx);
  vm.runInContext(costCode, ctx);
  ctx.PROJ = project;
  const c = vm.runInContext('computeProject(PROJ)', ctx);
  ctx.CALC = c;
  const t2 = vm.runInContext('tealSheet(PROJ, CALC)', ctx);
  const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, o[k]]));
  return {
    template_id: t.id,
    qty: 2,
    compute: pick(c, ['basic', 'freight', 'duty', 'landing', 'gst', 'siteBase', 'direct', 'overheads', 'contingency', 'totalCost', 'profit', 'selling', 'amc', 'orderValue', 'grossMargin', 'netMargin', 'contractValue']),
    buckets: c.buckets,
    teal: pick(t2, ['rawMat', 'boughts', 'mfgParts', 'packFwd', 'insurance', 'A', 'assembly', 'installation', 'debugOqc', 'sga', 'oss', 'B', 'C', 'D', 'profit', 'warranty']),
  };
});
const out = path.join(__dirname, '..', '..', 'tests', 'fixtures', 'legacy-golden.json');
fs.writeFileSync(out, JSON.stringify({ generated_from: { simulator: 'TEAL-Laser-Product-Sim-2/index.html', cost: 'TEAL-COST-DEMO-7-8/assets/app.js' }, fx: masters.currency, sim, cost }, null, 2) + '\n');
console.log('golden fixtures →', out, `sim=${sim.length} cost=${cost.length}`);
