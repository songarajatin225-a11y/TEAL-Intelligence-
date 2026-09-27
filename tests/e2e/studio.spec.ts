import { expect, go, test } from './fixtures';

/**
 * The first full vertical slice (industrial intelligence master prompt §170):
 * customer + requirement → equipment from a template → architecture → components (laser, vision,
 * controls) → process → simulation → cycle time / capacity / bottleneck → Monte Carlo → what-if →
 * new scenario → version diff → BOM → cost → verification → measured value → report → customer mode.
 */
test('vertical slice: requirement → equipment → simulate → scenario → BOM → validate → report', async ({ page }) => {
  test.setTimeout(180_000);
  await go(page, 'studio?new=1');
  const drawer = page.getByRole('dialog', { name: 'New simulation scenario' });
  await drawer.getByLabel('Equipment template').selectOption('eqt-pcb-laser-marking');
  await drawer.getByLabel('Scenario name').fill('E2E PCB marking line');
  await drawer.getByLabel('Customer').selectOption('cus-demo-ems');
  await drawer.getByLabel('Target throughput (UPH)').fill('500');
  await drawer.getByLabel('Requirements this equipment must meet').selectOption(['req-demo-s1-01']);
  await drawer.getByRole('button', { name: 'Create scenario' }).click();
  await expect(page.locator('main h1')).toHaveText('E2E PCB marking line');
  await expect(page.getByRole('alert')).toContainText('Simulation cannot run because Board in (conveyor) — time per part is missing');

  // architecture: station times with their basis, laser process inputs
  await page.getByRole('tab', { name: 'Architecture' }).click();
  for (const [i, v] of [
    [1, '2.5'],
    [2, '1.5'],
    [3, '1.2'],
    [5, '1'],
    [6, '1'],
    [7, '2'],
  ] as const) {
    const input = page.getByLabel(`Station ${i} time`, { exact: true });
    await input.fill(v);
    await input.press('Enter');
  }
  for (const [label, v] of [
    ['Area (mm²)', '300'],
    ['Hatch (mm)', '0.03'],
    ['Speed (mm/s)', '1500'],
    ['Overhead (s)', '0.8'],
  ] as const) {
    const input = page.getByLabel(label, { exact: true });
    await input.fill(v);
    await input.press('Enter');
  }
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText(/Laser time 7\.47 s/)).toBeVisible();

  // components: laser chain, vision, controls — compatibility is evaluated live
  await page.getByRole('tab', { name: 'Components' }).click();
  await page.getByLabel('Laser marking — Laser source').selectOption('prt-demo-mopa-20');
  await page.getByLabel('Laser marking — Galvo scanner').selectOption('prt-demo-galvo-10');
  await page.getByLabel('Laser marking — F-theta lens').selectOption('prt-demo-ft-160');
  await page.getByLabel('Fiducial alignment — Camera').selectOption('prt-demo-cam-5mp');
  await page.getByLabel('Fiducial alignment — Lens').selectOption('prt-demo-lens-16');
  await page.getByLabel('Machine level — controls, safety, utilities — PLC').selectOption('prt-demo-plc-ecat');
  await expect(page.getByText('DL-MOPA-20 ↔ FT-1064-160')).toBeVisible();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Scenario saved as a local draft').first()).toBeVisible();

  // cycle time, capacity, bottleneck, lineage
  await page.getByRole('tab', { name: 'Cycle & capacity' }).click();
  await expect(page.getByRole('heading', { name: 'Cycle time engine' })).toBeVisible();
  await expect(page.getByText('Practical UPH', { exact: true }).first()).toBeVisible();

  // discrete-event material flow with replay controls
  await page.getByRole('tab', { name: 'Material flow' }).click();
  await page.getByRole('button', { name: 'Run simulation' }).click();
  await expect(page.getByText('Simulated UPH (good)')).toBeVisible();
  await page.getByRole('button', { name: 'Play' }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Step to the next event' }).click();
  await expect(page.getByRole('heading', { name: 'Bottleneck — evidence' })).toBeVisible();

  // Monte Carlo
  await page.getByRole('tab', { name: 'Monte Carlo' }).click();
  await page.getByRole('radio', { name: '100', exact: true }).click();
  await page.getByRole('button', { name: /Run 100 iterations/ }).click();
  await expect(page.getByText('Probability of meeting target')).toBeVisible({ timeout: 30_000 });

  // what-if recalculates without touching the scenario
  await page.getByRole('tab', { name: 'What-if' }).click();
  const speed = page.getByLabel('Speed (mm/s)', { exact: true });
  await speed.fill('3000');
  await speed.press('Enter');
  await expect(page.getByRole('heading', { name: 'Result' })).toBeVisible();

  // BOM and equipment cost
  await page.getByRole('tab', { name: 'BOM · cost · suppliers' }).click();
  await expect(page.getByText('Total equipment cost')).toBeVisible();
  await expect(page.getByRole('link', { name: 'DL-MOPA-20' }).first()).toBeVisible();

  // design review lists findings by section
  await page.getByRole('tab', { name: /Design review/ }).click();
  await expect(page.getByRole('heading', { name: 'Engineering design review' })).toBeVisible();

  // verification + measured value (simulation vs actual)
  await page.getByRole('tab', { name: 'Validation' }).click();
  await page.getByRole('button', { name: 'Plan verification' }).click();
  await expect(page.getByText('Verification planned for URS-001').first()).toBeVisible();
  await page.getByLabel(/Verification of URS-001 .* result/).selectOption('PASS');
  await page.getByLabel('Actual', { exact: true }).fill('7.9');
  await page.getByLabel('Actual', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Add measurement' }).click();
  await expect(page.getByText('calibration candidate').or(page.getByRole('cell', { name: /%/ }).first())).toBeVisible();

  // report, then a derived scenario (the original is never overwritten)
  await page.getByRole('tab', { name: 'Report' }).click();
  await expect(page.getByRole('heading', { name: 'Executive summary' })).toBeVisible();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'New scenario' }).click();
  await page.getByLabel('Change reason (required)').fill('Second laser station for 500 UPH');
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click();
  await expect(page.locator('main h1')).toContainText('Scenario B');
  await page.getByRole('tab', { name: 'Versions' }).click();
  await expect(page.getByRole('heading', { name: 'Equipment version diff' })).toBeVisible();

  // customer demo mode hides cost and internal tabs
  await page.getByRole('radio', { name: 'Customer' }).click();
  await expect(page.getByRole('tab', { name: 'BOM · cost · suppliers' })).toHaveCount(0);
  await expect(page.getByText(/Customer demo mode/)).toBeVisible();
  await page.getByRole('radio', { name: 'Engineering' }).click();
});

test.describe('every Studio tab renders on a DEMO scenario', () => {
  for (const tab of ['overview', 'architecture', 'components', 'laser', 'simulate', 'capacity', 'variability', 'whatif', 'optimize', 'twin', 'sequence', 'reliability', 'cost', 'review', 'validation', 'versions', 'report']) {
    test(tab, async ({ page }) => {
      await go(page, `studio/sim-demo-pcb-a?tab=${tab}`);
      await expect(page.getByRole('tablist', { name: 'Scenario workspace' }).getByRole('tab', { selected: true })).toBeVisible();
      await expect(page.locator('main h1')).toHaveCount(1);
    });
  }
});

test('optimization shows a Pareto frontier and never picks a winner', async ({ page }) => {
  await go(page, 'studio/sim-demo-pcb-a?tab=optimize');
  await page.getByRole('button', { name: 'Explore configurations' }).click();
  await expect(page.getByRole('heading', { name: /Pareto frontier/ })).toBeVisible();
  await expect(page.getByText(/on the Pareto frontier/)).toBeVisible();
});

test('digital twin: clicking an object opens its engineering data; machine states animate', async ({ page }) => {
  await go(page, 'studio/sim-demo-pcb-a?tab=twin');
  await page.getByRole('button', { name: /^Laser marking/ }).first().click();
  await expect(page.getByText('Laser source: DL-MOPA-20')).toBeVisible();
  await page.getByRole('button', { name: 'Run cycle' }).click();
  await page.getByRole('button', { name: 'Fault' }).click();
  await expect(page.getByText(/Machine state forced to Fault/)).toBeVisible();
});

test('a scenario with missing inputs explains what is missing (no guessed numbers)', async ({ page }) => {
  await go(page, 'studio/sim-demo-semi-marking');
  await expect(page.getByRole('alert')).toContainText('Simulation cannot run because Strip clamp — time per part is missing');
});

test('engineering database: technical search, compatibility, evidence, conflicts', async ({ page }) => {
  await go(page, 'engineering-db?q=Galvo%20above%2030%20mm%20aperture');
  await expect(page.getByText(/Read as: .*Aperture ≥ 30 mm/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'SC-30HP' }).first()).toBeVisible();
  await page.getByRole('tab', { name: /Compatibility/ }).click();
  await page.getByLabel('Component A').selectOption('prt-demo-uv-5');
  await page.getByLabel('Component B').selectOption('prt-demo-ft-160');
  await expect(page.getByText('Incompatible', { exact: true }).first()).toBeVisible();
  await go(page, 'record/prt-demo-mopa-50');
  await expect(page.getByText('Conflict', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Confidence: Unverified/ })).toBeVisible();
  await go(page, 'data-review?queue=Conflicting');
  await expect(page.getByRole('link', { name: 'DL-MOPA-50' })).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss' }).first().click();
  await expect(page.getByText(/Conflict dismissed/).first()).toBeVisible();
});

test('engineering database: add a specification value with its source', async ({ page }) => {
  await go(page, 'record/prt-demo-galvo-14');
  await page.getByRole('button', { name: 'Edit specifications' }).click();
  await page.getByRole('button', { name: 'Add value' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Specifications saved as a local draft').first()).toBeVisible();
});

test.describe('responsive: no page-level horizontal scroll on the new pages (§130)', () => {
  for (const width of [320, 390, 768, 1024]) {
    test(`${width}px`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['studio', 'studio?tab=library', 'studio/sim-demo-pcb-a', 'studio/sim-demo-pcb-a?tab=architecture', 'studio/sim-demo-pcb-a?tab=components', 'studio/sim-demo-pcb-a?tab=laser', 'studio/sim-demo-pcb-a?tab=twin', 'studio/sim-demo-pcb-a?tab=cost', 'studio/sim-demo-pcb-a?tab=review', 'engineering-db', 'engineering-db?tab=compare&ids=prt-demo-mopa-20,prt-demo-mopa-50', 'record/prt-demo-mopa-50', 'data-review', 'requirements-quality?tab=coverage', 'actions', '']) {
        await go(page, route);
        await page.waitForTimeout(150);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `/${route} at ${width}px`).toBeLessThanOrEqual(1);
      }
    });
  }
});
