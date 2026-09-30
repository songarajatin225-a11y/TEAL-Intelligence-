import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/*
 * COMPONENT-DRIVEN MACHINE (the builder): the stations follow the components. Swap, remove or add a
 * component and the machine, its 3D view and its simulation change; every station states its reason.
 */
const TWIN = '/#/studio/sim-demo-laser-marker?tab=machine3d';
const decisions = (page: Page) => page.getByRole('list', { name: 'Station decisions' });

async function add(page: Page, type: string, part: string) {
  await page.getByRole('combobox', { name: 'Component type to add' }).selectOption({ label: type });
  await page.getByRole('combobox', { name: 'Component to add' }).selectOption({ label: part });
  await page.getByRole('button', { name: 'Add', exact: true }).click();
}

test.describe('3D machine builder — stations from components', () => {
  test('switching to "Build from components" derives the stations and explains each one', async ({ page }) => {
    await page.goto(TWIN);
    await page.getByRole('tab', { name: /^Builder/ }).click();
    // template mode shows what the builder would decide, before anything changes
    await expect(decisions(page)).toContainText('Laser marking');
    await page.getByRole('radio', { name: 'Build from components' }).check();
    await expect(page.getByRole('tab', { name: 'Builder (live)' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Process' })).toHaveValue('');
    await expect(page.getByRole('combobox', { name: 'Process' }).locator('option:checked')).toHaveText('From the scenario: Marking');
    for (const s of ['Operator load', 'Fixture / clamp', 'Laser marking', 'Mark verification', 'OK / NG sorting', 'Operator unload']) await expect(decisions(page)).toContainText(s);
    await expect(decisions(page)).toContainText('Laser source + galvo scanner → scanned laser station');
  });

  test('removing the camera removes inspection; a welding head + axis instead of the scanner changes the 3D machine', async ({ page }) => {
    await page.goto(TWIN);
    await page.getByRole('tab', { name: /^Builder/ }).click();
    await page.getByRole('radio', { name: 'Build from components' }).check();
    await page.getByRole('button', { name: /^Remove CV-/ }).first().click();
    await expect(decisions(page)).not.toContainText('Mark verification');
    await expect(decisions(page)).not.toContainText('OK / NG sorting');
    await add(page, 'Laser · Laser head', 'WH-3000 (DEMO)');
    const scanners = page.getByRole('button', { name: /^Remove SC-/ });
    while (await scanners.count()) await scanners.first().click();
    await expect(decisions(page)).toContainText('Laser marking (head)');
    await expect(decisions(page)).toContainText('Laser source + processing head → head-and-axis laser station');
    // unused scanner optics are named, not silently kept
    await expect(page.getByText(/Not used — scanner optics not used by the head delivery/)).toBeVisible();
    // the 3D machine follows: the component tree now has a processing head and no galvo
    const toggle = page.getByRole('button', { name: 'Component tree', exact: true });
    if ((await toggle.getAttribute('aria-pressed')) !== 'true') await toggle.click();
    const tree = page.getByRole('tree', { name: 'Machine hierarchy' });
    await expect(tree).toContainText('Laser marking (head)');
    const filter = page.getByLabel('Filter components');
    await filter.fill('Processing head');
    await expect(tree).toContainText('Processing head — WH-3000');
    await filter.fill('Galvo scanner');
    await expect(tree).not.toContainText('Galvo scanner —');
  });

  test('utilization heat map and glTF export of the conceptual model', async ({ page }) => {
    await page.goto('/#/studio/sim-demo-pcb-a?tab=machine3d');
    await expect(page.getByRole('status', { name: 'Machine status' })).toContainText('READY');
    await page.getByRole('button', { name: 'Overlay', exact: true }).click();
    await page.getByRole('combobox', { name: 'Overlay' }).selectOption('utilization');
    const table = page.getByRole('table', { name: /Share of run time per station/ });
    await expect(table.locator('tbody tr')).toHaveCount(7);
    await expect(table).toContainText('Laser marking');
    await page.keyboard.press('Escape');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export 3D model (glTF .glb)' }).click()]);
    expect(dl.suggestedFilename()).toBe('sim-demo-pcb-a-conceptual.glb');
    await expect(page.getByText('3D model exported (glTF)')).toBeVisible();
  });
});
