import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/*
 * 3D MACHINE DIGITAL TWIN — the flagship vertical slice (3D master prompt §136–§138, §170):
 * open the laser marking machine, run the cycle, inspect components, check the design, inject a fault.
 */
const TWIN = '/#/studio/sim-demo-laser-marker?tab=machine3d';

/** The component tree is a drawer over the viewport: open it and return the tree. */
async function openTree(page: Page) {
  const toggle = page.getByRole('button', { name: 'Component tree', exact: true });
  if ((await toggle.getAttribute('aria-pressed')) !== 'true') await toggle.click();
  return page.getByRole('tree', { name: 'Machine hierarchy' });
}

const setTime = (page: Page, t: number) =>
  page.getByLabel('Simulation time').evaluate((el, v) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    set.call(el, String(v));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, t);

test.describe('3D machine digital twin', () => {
  test('renders the conceptual machine with status, toolbar, tree and KPIs', async ({ page }) => {
    await page.goto(TWIN);
    await expect(page.getByRole('status', { name: 'Machine status' })).toContainText('READY');
    await expect(page.getByRole('application', { name: /3D machine viewport/ }).locator('canvas')).toBeVisible();
    await expect(page.getByText('CONCEPTUAL 3D MODEL').first()).toBeVisible();
    await expect(page.getByRole('toolbar', { name: '3D viewport tools' })).toBeVisible();
    for (const g of ['Explain', 'View', 'Inspect', 'Show', 'Export']) await expect(page.getByRole('group', { name: g })).toBeVisible();
    const tree = await openTree(page);
    await expect(tree).toContainText('Laser marking');
    await expect(tree).toContainText('Controls & electrical');
    await expect(page.getByText('Cycle time', { exact: true })).toBeVisible();
    await expect(page.getByRole('status', { name: 'Machine status' })).toContainText('BOTTLENECK');
  });

  test('the viewport is the largest element and one transport bar drives the clock', async ({ page }) => {
    await page.goto(TWIN);
    const vp = page.getByRole('application', { name: /3D machine viewport/ });
    await expect(vp.locator('canvas')).toBeVisible();
    const main = await page.locator('main').boundingBox();
    const box = await vp.boundingBox();
    expect(box!.width).toBeGreaterThan(main!.width * 0.85);
    expect(box!.height).toBeGreaterThan(400);
    await expect(page.getByRole('button', { name: 'Run simulation' })).toHaveCount(1);
    await expect(page.getByLabel('Simulation time')).toHaveCount(1);
    // studio mode: the workbench covers the window; Esc returns
    await page.getByRole('button', { name: 'Studio mode (full window)' }).click();
    await expect.poll(async () => (await page.getByRole('status', { name: 'Machine status' }).boundingBox())!.y).toBeLessThan(40);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Studio mode (full window)' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('run cycle drives the central state; timeline events jump the machine', async ({ page }) => {
    await page.goto(TWIN);
    await page.getByRole('button', { name: 'Run simulation' }).click();
    await expect(page.getByRole('status', { name: 'Machine status' })).not.toContainText('READY', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Pause simulation' }).click();
    await page.getByLabel('Event filter').selectOption('laser');
    await page.getByRole('log').getByText('Laser process — part 1').first().click();
    await expect(page.getByRole('status', { name: 'Machine status' })).toContainText('PART 1');
    await page.getByRole('tab', { name: 'PLC steps' }).click();
    await expect(page.getByText('Laser enable').first()).toBeVisible();
  });

  test('selecting a component opens its engineering record data and design-check findings (§58, §83)', async ({ page }) => {
    await page.goto(TWIN);
    const tree = await openTree(page);
    await tree.getByRole('button', { name: 'Expand Laser marking' }).click();
    await tree.getByRole('button', { name: /Galvo scanner — SC-10/ }).click();
    const details = page.getByRole('complementary', { name: 'Component details' });
    await expect(details.getByText('Technical specification').first()).toBeVisible();
    await expect(details.getByText('Change component (live)')).toBeVisible();
    await expect(details.getByText('Laser process (from configuration)')).toBeVisible();
    await expect(details.getByRole('link', { name: 'Knowledge graph' })).toBeVisible();
    // the camera / lens incompatibility is flagged on the component itself
    await tree.getByRole('button', { name: 'Expand CCD positioning' }).click();
    await expect(tree.getByLabel(/design-check finding/).first()).toBeVisible();
  });

  test('design check, motion, faults and export panels work (§72, §114)', async ({ page }) => {
    await page.goto(TWIN);
    await page.getByRole('tab', { name: /Design check/ }).click();
    await page.getByLabel('Show passed checks').check();
    await expect(page.getByText(/Marking field 110 × 110 mm covers the required 40 × 20 mm/)).toBeVisible();
    await expect(page.getByText(/No bounding-box interference along 4 planned moves/)).toBeVisible();
    // repeated single-source findings are one expandable row
    const group = page.getByRole('button', { name: /Single-source components: \d+ components/ });
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await group.click();
    await expect(page.getByText(/LS-500 \(X axis stage\): single source/)).toBeVisible();
    await page.getByRole('tab', { name: 'Motion', exact: true }).click();
    await expect(page.getByText('Move to marking position')).toBeVisible();
    await expect(page.getByText(/LS-500 · max speed/).first()).toBeVisible();
    await expect(page.getByLabel('X axis settling time ms')).toBeVisible();
    await page.getByRole('tab', { name: 'Fault injection', exact: true }).click();
    await page.getByLabel('Fault', { exact: true }).selectOption('vision');
    await page.getByRole('button', { name: /Inject at t =/ }).click();
    await expect(page.getByText(/Lost good parts over 60 min/)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('tab', { name: 'Export', exact: true }).click();
    await expect(page.getByRole('button', { name: '3D machine report' })).toBeVisible();
  });

  test('viewport tools, camera view and customer mode', async ({ page }) => {
    await page.goto(TWIN);
    await page.getByRole('button', { name: 'Equipment X-ray' }).click();
    await expect(page.getByRole('button', { name: 'Equipment X-ray' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByLabel('Camera mode').selectOption('exploded');
    await page.getByLabel('Camera mode').selectOption('laser');
    await page.getByRole('application', { name: /3D machine viewport/ }).focus();
    await page.keyboard.press('4');
    await page.getByLabel('Camera view').selectOption('inspect');
    await expect(page.getByText(/CAMERA VIEW · 79 × 66 mm/)).toBeVisible();
    await page.getByRole('radio', { name: 'Customer' }).click();
    await expect(page.getByText('Customer demo mode')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'I/O', exact: true })).toHaveCount(0);
    await page.getByRole('radio', { name: 'Engineering' }).click();
  });

  test('explains the machine: guided tour, component explanations, enclosure modes, name tags (§139, §164)', async ({ page }) => {
    await page.goto(TWIN);
    await page.getByRole('button', { name: 'Explain the machine (guided tour)' }).click();
    const tour = page.getByRole('dialog', { name: 'Guided machine tour' });
    await expect(tour).toContainText('The machine');
    await expect(tour).toContainText('1 / 12');
    for (let i = 0; i < 5; i++) await tour.getByRole('button', { name: /Next/ }).click();
    await expect(tour).toContainText('Laser source and beam delivery');
    await expect(page.getByLabel('Explanation: Pulsed fibre laser (MOPA)')).toContainText('In this machine (from the records)');
    await tour.getByRole('button', { name: 'Close' }).click();
    await expect(tour).toHaveCount(0);
    const tree = await openTree(page);
    await tree.getByRole('button', { name: 'Expand Laser marking' }).click();
    await tree.getByRole('button', { name: /Beam expander — BE-1064-1.5X/ }).click();
    await expect(page.getByLabel('Explanation: Beam expander')).toContainText('larger than the SC-10 aperture 10 mm');
    await page.getByLabel('Enclosure', { exact: true }).selectOption('closed');
    await page.getByLabel('Enclosure', { exact: true }).selectOption('hidden');
    await page.getByRole('radio', { name: 'All' }).click();
    await expect(page.getByRole('radio', { name: 'All' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('radio', { name: 'No tags' }).click();
    await expect(page.getByRole('radio', { name: 'No tags' })).toHaveAttribute('aria-checked', 'true');
  });

  test('a shared view link restores time and selection', async ({ page }) => {
    await page.goto(`${TWIN}&t=12&sel=st-laser-galvo`);
    await expect(page.getByRole('status', { name: 'Machine status' })).toContainText('t 12.00 s', { timeout: 15_000 });
    await expect(page.getByRole('complementary', { name: 'Component details' })).toContainText('Galvo scanner');
    await page.getByRole('button', { name: 'Copy view link' }).click();
    await expect(page.getByText(/View link copied|Copy the view link/).first()).toBeVisible();
  });

  test('component datasheets page covers every component', async ({ page }) => {
    await page.goto('/#/component-datasheets');
    await expect(page.getByRole('heading', { name: 'Component Datasheets' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Search' }).fill('galvo');
    await page.getByRole('button', { name: /Datasheet: 3-axis galvo scan head/ }).click();
    await expect(page.getByRole('dialog')).toContainText('Scanlab GmbH');
    await expect(page.getByRole('dialog')).toContainText('Not Available — key specifications not yet stated');
  });
});

/* The 3D simulation works for every machine type, not only the laser flagship. */
test.describe('3D simulation for every machine type', () => {
  test('test line: parallel test heads, NG diverter, contact-test narration and part trace', async ({ page }) => {
    await page.goto('/#/studio/sim-demo-test-line?tab=machine3d');
    await expect(page.getByRole('status', { name: 'Machine status' })).toContainText('READY');
    const tree = await openTree(page);
    await tree.getByRole('button', { name: 'Expand Functional test' }).click();
    await expect(tree.getByRole('button', { name: /^Test head · lane 1/ })).toBeVisible();
    await expect(tree.getByRole('button', { name: /^Test head · lane 2/ })).toBeVisible();
    await tree.getByRole('button', { name: 'Expand OK / NG diverter' }).click();
    await expect(tree.getByRole('button', { name: /^NG diverter \(pneumatic pusher\)/ })).toBeVisible();
    await setTime(page, 70);
    await expect(page.getByText(/tester runs the test program \(2 parallel nests/)).toBeVisible();
    await page.getByRole('tab', { name: 'Part trace' }).click();
    await page.getByRole('button', { name: /^#\d+$/ }).first().click();
    await expect(page.getByText(/Following part #\d+/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go to' }).first()).toBeVisible();
  });

  test('assembly cell: SCARA robot, and the conveyor transfer is part of the cycle', async ({ page }) => {
    await page.goto('/#/studio/sim-demo-assembly-cell?tab=machine3d');
    const tree = await openTree(page);
    await tree.getByRole('button', { name: 'Expand SCARA pick & place (connector)' }).click();
    await tree.getByRole('button', { name: 'Assembly robot — RB-S6', exact: true }).click();
    await expect(page.getByText('Technical specification').first()).toBeVisible();
    await expect(page.getByLabel(/^Explanation:/)).toContainText('In this machine');
    await setTime(page, 41);
    await expect(page.getByText(/placing a component onto the part/)).toBeVisible();
    await page.getByRole('tab', { name: /^Inputs/ }).click();
    await expect(page.getByRole('region', { name: 'Part transfer between stations' })).toContainText(/s per transfer — included/);
    await expect(page.getByRole('region', { name: 'Part transfer between stations' })).toContainText('CNV-PCB-450 · max speed');
  });

  test('robot transfer: 6-axis robot and utilities from the component records', async ({ page }) => {
    await page.goto('/#/studio/sim-demo-robot-transfer?tab=machine3d');
    const tree = await openTree(page);
    await tree.getByRole('button', { name: 'Expand Robot pick & place' }).click();
    await expect(tree).toContainText('RB-A7');
    await page.getByRole('tab', { name: 'Utilities' }).click();
    await expect(page.getByText('Stated power (Σ components)')).toBeVisible();
    await expect(page.getByRole('link', { name: /RB-A7/ })).toBeVisible();
  });

  test('a new machine from a template runs as a labelled sequence preview until its inputs exist', async ({ page }) => {
    await page.goto('/#/studio?new=1');
    const drawer = page.getByRole('dialog', { name: 'New simulation scenario' });
    await drawer.getByLabel('Equipment template').selectOption('eqt-screwdriving');
    await drawer.getByLabel('Scenario name').fill('E2E screwdriving cell');
    await drawer.getByRole('button', { name: 'Create and open in 3D' }).click();
    await expect(page.locator('main h1')).toHaveText('E2E screwdriving cell');
    await expect(page.getByText('SEQUENCE PREVIEW — not a result')).toBeVisible();
    await expect(page.getByRole('tab', { name: /^Inputs/ })).toHaveAttribute('aria-selected', 'true');
    const tree = await openTree(page);
    await tree.getByRole('button', { name: 'Expand Screwdriving (torque/angle)' }).click();
    await expect(tree.getByRole('button', { name: /^Screwdriver spindle/ }).last()).toBeVisible();
    // entering every station time turns the preview into a real (DEMO-free, user-input) simulation
    for (const name of ['Loading', 'Fixture / clamp', 'Screwdriving (torque/angle)', 'Unloading']) {
      await page.getByLabel(`${name} time per part`, { exact: true }).fill('3');
      await page.keyboard.press('Tab');
    }
    await expect(page.getByText('SEQUENCE PREVIEW — not a result')).toHaveCount(0);
    await page.getByRole('button', { name: 'Run simulation' }).click();
    await expect(page.getByRole('status', { name: 'Machine status' })).not.toContainText('READY', { timeout: 15_000 });
  });
});
