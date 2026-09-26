import { expect, go, test } from './fixtures';

/** Health, relationships, compare, view modes, saved views, Ask Intelligence, risk matrix, units, aliases. */
test.describe('intelligence layer', () => {
  test('records show computed health and a relationship bar', async ({ page }) => {
    await go(page, 'record/prj-demo-c2i');
    await expect(page.locator('main header').getByTitle(/^Health \d+ %/).first()).toHaveText(/Healthy|Attention|At Risk|Incomplete/);
    await expect(page.getByRole('navigation', { name: 'Relationships' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Health' })).toBeVisible();
    await expect(page.getByRole('meter', { name: /Completeness/ })).toBeVisible();
  });

  test('compare with: two products side by side, differences only', async ({ page }) => {
    await go(page, 'record/prd-markf');
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('button', { name: 'Compare with…' }).click();
    await expect(page.locator('main h1')).toHaveText('Compare');
    await page.getByPlaceholder(/Filter products/).fill('Mark M');
    await page.getByRole('button', { name: /Mark M-Series/ }).click();
    const table = page.locator('main table');
    await expect(table.getByRole('link', { name: 'Mark F-Series' })).toBeVisible();
    await expect(table.getByRole('link', { name: 'Mark M-Series' })).toBeVisible();
    await page.getByRole('button', { name: 'Only differences' }).click();
    await expect(table.getByText('(differs)').first()).toBeAttached();
    await expect(page).toHaveURL(/ids=prd-markf/);
  });

  test('lists switch between table, cards and board; views can be saved', async ({ page }) => {
    await go(page, 'activities');
    await page.getByRole('radio', { name: 'Board' }).click();
    await expect(page.getByRole('list', { name: /Board by status/ })).toBeVisible();
    await page.getByRole('radio', { name: 'Cards' }).click();
    await expect(page.getByRole('list', { name: 'Records' })).toBeVisible();
    await page.getByLabel('Filter activities').fill('meeting');
    await expect(page).toHaveURL(/q=meeting/);
    await page.getByRole('button', { name: /^Views/ }).click();
    await page.getByLabel('View name').fill('Meetings');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('View saved')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('list', { name: 'Records' })).toBeVisible();
    await page.getByRole('button', { name: /^Views \(1\)/ }).click();
    await expect(page.getByRole('button', { name: 'Meetings · cards' })).toBeVisible();
  });

  test('board: moving a card is a local-draft quick edit', async ({ page }) => {
    await go(page, 'activities');
    await page.getByRole('radio', { name: 'Board' }).click();
    const col = page.locator('section[aria-label^="In Progress:"]');
    const n = Number((await col.getAttribute('aria-label'))!.split(': ')[1]);
    await page.getByLabel(/^Move Send POC plan/).selectOption('In Progress');
    await expect(col).toHaveAttribute('aria-label', `In Progress: ${n + 1}`);
    await expect(col.getByText(/Local draft/).first()).toBeVisible();
  });

  test('ask intelligence answers from the knowledge base with confidence and sources', async ({ page }) => {
    await go(page, 'ask');
    await expect(page.getByText(/No AI model is connected/)).toBeVisible();
    await page.getByLabel('Question').fill('takt time');
    await page.getByRole('button', { name: 'Ask' }).click();
    await expect(page).toHaveURL(/q=takt/);
    await expect(page.getByText(/Confidence: (High|Medium|Low)/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'From the handbooks' })).toBeVisible();
  });

  test('supplier risk matrix keeps unassessed suppliers visible as Unknown', async ({ page }) => {
    await go(page, 'supplier-risk');
    await expect(page.getByText(/have no risk assessment/)).toBeVisible();
    const cell = page.getByRole('button', { name: /^Unknown risk/ }).filter({ hasNotText: /^0/ }).first();
    await cell.click();
    await expect(cell).toHaveAttribute('aria-pressed', 'true');
  });

  test('unit converter converts with the calculator engine', async ({ page }) => {
    await go(page, 'units');
    await page.getByLabel('Value').fill('50');
    await page.getByLabel('From unit').selectOption('W');
    await page.getByLabel('To unit').selectOption('kW');
    await expect(page.locator('output')).toHaveText('0.05');
  });

  test('duplicates page explains its rules and never merges', async ({ page }) => {
    await go(page, 'duplicates');
    await expect(page.getByText(/Nothing is merged automatically/)).toBeVisible();
  });

  test('route aliases land on the canonical page', async ({ page }) => {
    await go(page, 'fmea');
    await expect(page.locator('main h1')).toHaveText('Risk & FMEA');
    await go(page, 'follow-ups');
    await expect(page.locator('main h1')).toHaveText('My Workspace');
    await expect(page.getByRole('tab', { name: /Follow-ups/i, selected: true })).toBeVisible();
  });
});
