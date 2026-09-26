import { expect, go, test } from './fixtures';

test('create a customer → LOCAL DRAFT → export change package', async ({ page }) => {
  await go(page, 'customers?new=1');
  await page.locator('#f-name').fill('E2E Test Customer');
  await page.getByLabel('Next action', { exact: true }).fill('Send questionnaire');
  await page.getByRole('button', { name: 'Save local draft' }).click();
  await expect(page.locator('main h1')).toHaveText('E2E Test Customer');
  await expect(page.getByText('Local draft · new').first()).toBeVisible();

  await go(page, 'admin');
  await expect(page.getByText('Permanent repository update requires a GitHub commit.')).toBeVisible();
  await expect(page.locator('main').getByRole('link', { name: 'E2E Test Customer' })).toBeVisible();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Export change package/ }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^teal-change-package-.*\.zip$/);
});

test('flagship: customer inquiry → draft package → opportunity with thread', async ({ page }) => {
  await go(page, 'inquiry');
  await page.getByRole('button', { name: 'Example 1' }).click();
  await page.locator('#inq-newcust').fill('E2E Semiconductor Customer');
  await page.getByRole('button', { name: 'Generate draft package' }).click();
  await expect(page.getByText(/Semi/).first()).toBeVisible();
  await page.getByRole('button', { name: /^Save \d+ drafts$/ }).click();
  await expect(page.locator('main h1')).toContainText('Inquiry:');
  await expect(page.getByText('Local draft · new').first()).toBeVisible();

  await go(page, 'traceability');
  await expect(page.getByText(/Laser source supplied by customer/).first()).toBeVisible();
});

test('configuration → generate BOM + cost → cost model computes', async ({ page }) => {
  await go(page, 'machines');
  await page.locator('main table a[href*="record/cfg-"]').first().click();
  await page.getByRole('button', { name: 'Generate BOM + cost' }).click();
  await expect(page.locator('main h1')).toContainText('Cost —');
  await expect(page.getByText('Local draft · new').first()).toBeVisible();
});

test('FAT protocol generated from requirements + handbook checklist, results NOT RUN', async ({ page }) => {
  await go(page, 'fat-sat');
  const opts = page.locator('#fs-p option');
  const value = await opts.nth(1).getAttribute('value');
  await page.locator('#fs-p').selectOption(value!);
  await page.getByRole('button', { name: 'Generate FAT' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /FAT protocol/ })).toBeVisible();
  await expect(page.getByText('NOT RUN').first()).toBeVisible();
});

test('search finds records and handbook sections', async ({ page }) => {
  await go(page, 'search?q=galvo');
  await expect(page.locator('main a[href*="#/"]').first()).toBeVisible({ timeout: 20_000 });
});

test('configurator computes price, physics and compatibility', async ({ page }) => {
  await go(page, 'configurator');
  await page.getByRole('button', { name: /^Mark F-Series/ }).click();
  await expect(page.getByText('Spot diameter')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Compatibility' })).toBeVisible();
  await expect(page.getByText(/ESTIMATE/).first()).toBeVisible();
});

test('workspace backup export downloads JSON', async ({ page }) => {
  await go(page, 'admin');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export backup' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^teal-workspace-backup-.*\.json$/);
});
