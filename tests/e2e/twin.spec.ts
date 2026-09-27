import { expect, test } from './fixtures';

/*
 * 3D MACHINE DIGITAL TWIN — the flagship vertical slice (3D master prompt §136–§138, §170):
 * open the laser marking machine, run the cycle, inspect components, check the design, inject a fault.
 */
const TWIN = '/#/studio/sim-demo-laser-marker?tab=machine3d';

test.describe('3D machine digital twin', () => {
  test('renders the conceptual machine with status, toolbar, tree and KPIs', async ({ page }) => {
    await page.goto(TWIN);
    await expect(page.getByRole('status', { name: 'Machine status' })).toContainText('READY');
    await expect(page.getByRole('application', { name: /3D machine viewport/ }).locator('canvas')).toBeVisible();
    await expect(page.getByText('CONCEPTUAL 3D MODEL').first()).toBeVisible();
    await expect(page.getByRole('toolbar', { name: '3D viewport tools' })).toBeVisible();
    const tree = page.getByRole('tree', { name: 'Machine hierarchy' });
    await expect(tree).toContainText('Laser marking');
    await expect(tree).toContainText('Controls & electrical');
    await expect(page.getByText('Cycle time', { exact: true })).toBeVisible();
    await expect(page.getByText(/BOTTLENECK /)).toBeVisible();
  });

  test('run cycle drives the central state; timeline events jump the machine', async ({ page }) => {
    await page.goto(TWIN);
    await page.getByRole('button', { name: 'Run simulation' }).first().click();
    await expect(page.getByRole('status', { name: 'Machine status' })).not.toContainText('READY', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Pause simulation' }).first().click();
    await page.getByLabel('Event filter').selectOption('laser');
    await page.getByRole('log').getByText('Laser process — part 1').first().click();
    await expect(page.getByRole('status', { name: 'Machine status' })).toContainText('PART 1');
    await page.getByRole('tab', { name: 'Sequence (PLC)' }).click();
    await expect(page.getByText('Laser enable').first()).toBeVisible();
  });

  test('selecting a component opens its engineering record data (§58, §83)', async ({ page }) => {
    await page.goto(TWIN);
    const tree = page.getByRole('tree', { name: 'Machine hierarchy' });
    await tree.getByRole('button', { name: 'Expand Laser marking' }).click();
    await tree.getByRole('button', { name: /Galvo scanner — SC-10/ }).click();
    await expect(page.getByText('Technical specification').first()).toBeVisible();
    await expect(page.getByText('Change component (live)')).toBeVisible();
    await expect(page.getByText('Laser process (from configuration)')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Knowledge graph' })).toBeVisible();
  });

  test('design check, motion, faults and assumptions panels work (§72, §114)', async ({ page }) => {
    await page.goto(TWIN);
    await page.getByRole('tab', { name: /Design check/ }).click();
    await page.getByLabel('Show passed checks').check();
    await expect(page.getByText(/Marking field 110 × 110 mm covers the required 40 × 20 mm/)).toBeVisible();
    await expect(page.getByText(/No bounding-box interference along 4 planned moves/)).toBeVisible();
    await page.getByRole('tab', { name: 'Motion', exact: true }).click();
    await expect(page.getByText('Move to marking position')).toBeVisible();
    await expect(page.getByText(/LS-500 · max speed/).first()).toBeVisible();
    await page.getByRole('tab', { name: 'Faults', exact: true }).click();
    await page.getByLabel('Fault', { exact: true }).selectOption('vision');
    await page.getByRole('button', { name: /Inject at t =/ }).click();
    await expect(page.getByText(/Lost good parts over 60 min/)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('tab', { name: /Assumptions/ }).click();
    await expect(page.getByRole('button', { name: '3D machine report' })).toBeVisible();
  });

  test('viewport tools and customer mode', async ({ page }) => {
    await page.goto(TWIN);
    await page.getByRole('button', { name: 'Equipment X-ray' }).click();
    await expect(page.getByRole('button', { name: 'Equipment X-ray' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByLabel('Camera mode').selectOption('exploded');
    await page.getByLabel('Camera mode').selectOption('laser');
    await page.getByRole('application', { name: /3D machine viewport/ }).focus();
    await page.keyboard.press('4');
    await page.getByRole('radio', { name: 'Customer' }).click();
    await expect(page.getByText('Customer demo mode')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'I/O & sensors' })).toHaveCount(0);
    await page.getByRole('radio', { name: 'Engineering' }).click();
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
