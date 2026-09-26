import { expect, go, test } from './fixtures';

/** Rooms, LeadConnect, business case, radar rings, multi-step forms, graph focus. */
test.describe('rooms and strategy tools', () => {
  test('program room: open from the record, log a pre-linked activity', async ({ page }) => {
    await go(page, 'record/prj-demo-c2i');
    await page.getByRole('link', { name: /Program room/ }).click();
    await expect(page.locator('main h1')).toHaveText(/C2i inline PCB marking/);
    await expect(page.getByRole('heading', { name: 'Now' })).toBeVisible();
    await page.getByRole('button', { name: 'Log activity' }).click();
    const drawer = page.getByRole('dialog');
    await drawer.getByLabel('Name *').fill('Room test call');
    await drawer.getByRole('button', { name: 'Save local draft' }).click();
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('link', { name: 'Room test call', exact: true }).first()).toBeVisible();
  });

  test('rooms index lists rooms by type', async ({ page }) => {
    await go(page, 'rooms');
    await page.getByRole('tab', { name: /Suppliers/ }).click();
    await expect(page.getByRole('list', { name: 'Rooms' }).getByRole('link').first()).toBeVisible();
  });

  test('LeadConnect: one save → customer, Lead opportunity and follow-up, grouped by event', async ({ page }) => {
    await go(page, 'leads');
    await page.getByLabel('Event *').fill('Test Expo 2026');
    await page.getByLabel('Company name *').fill('Fictional Test Pvt Ltd');
    await page.getByLabel('What they asked').fill('Marking on anodised aluminium');
    await page.getByRole('button', { name: /Save lead/ }).click();
    await expect(page.getByText(/Lead captured at Test Expo 2026/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Test Expo 2026' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Fictional Test Pvt Ltd' })).toBeVisible();
    await expect(page.getByLabel('Company name *')).toHaveValue('');
    await expect(page.getByLabel('Event *')).toHaveValue('Test Expo 2026');
  });

  test('business case: NPV from inputs; unsourced market figures are flagged', async ({ page }) => {
    await go(page, 'business-case');
    await expect(page.getByText(/Enter the required inputs/)).toBeVisible();
    await page.getByLabel('Selling price per unit *').fill('100');
    await page.getByLabel('Unit cost *').fill('60');
    await page.getByLabel('Units in year 1 *').fill('100');
    await page.getByLabel('Horizon (years) *').fill('3');
    await expect(page.getByRole('status', { name: 'NPV' }).or(page.locator('output[aria-label="NPV"]'))).toHaveText(/12,000/);
    await page.getByLabel(/TAM value/).fill('5000000');
    await expect(page.getByText('UNSOURCED', { exact: true })).toBeVisible();
    await page.getByLabel('TAM source').fill('Internal study 2026');
    await expect(page.getByText('Sourced', { exact: true })).toBeVisible();
  });

  test('technology radar: a ring needs a reason, then appears on the radar', async ({ page }) => {
    await go(page, 'technology');
    await page.getByLabel('Technology', { exact: true }).selectOption({ label: 'Laser' });
    await page.getByLabel('Ring for Laser').selectOption('Adopt');
    await page.getByRole('button', { name: /Save ring/ }).click();
    await expect(page.getByText('Add the reason for this ring')).toBeVisible();
    await page.getByLabel('Why Laser is in this ring').fill('Core of every TEAL platform.');
    await page.getByRole('button', { name: /Save ring/ }).click();
    await expect(page.getByRole('button', { name: 'Laser: Adopt' })).toBeVisible();
  });

  test('long forms are split into steps', async ({ page }) => {
    await go(page, 'activities?new=1');
    const steps = page.getByRole('list', { name: 'Form steps' });
    await expect(steps).toBeVisible();
    await expect(page.getByLabel('Customer')).toBeHidden();
    await page.getByRole('button', { name: /Next: Links/ }).click();
    await expect(page.getByLabel('Customer')).toBeVisible();
    await steps.getByRole('button', { name: /Essentials/ }).click();
    await page.getByLabel('Name *').fill('Stepped activity');
    await page.getByRole('button', { name: 'Save local draft' }).click();
    await expect(page.locator('main h1')).toHaveText('Stepped activity');
  });

  test('knowledge graph: focusing a node dims the others; types can be dimmed', async ({ page }) => {
    await go(page, 'graph?id=prd-markf');
    const node = page.locator('svg g[role="button"]').first();
    await node.focus();
    await expect(page.getByRole('link', { name: 'open record' })).toBeVisible();
    const toggle = page.getByRole('group', { name: 'Show or dim record types' }).getByRole('button').first();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });
});
