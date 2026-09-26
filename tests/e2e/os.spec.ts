import { expect, go, test } from './fixtures';

/** Final master prompt: domains, engines, execution, documents, trust, sync, IA. */
test.describe('TEAL Intelligence OS', () => {
  test('navigation follows the master-prompt IA with sub-groups', async ({ page }) => {
    await go(page, '');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    for (const s of ['Command Center', 'Intelligence', 'Domains', 'Product', 'Ecosystem', 'Execution', 'Roadmap', 'Data', 'Settings']) await expect(nav.getByRole('button', { name: new RegExp(`^${s}`) })).toBeVisible();
    await nav.getByRole('button', { name: /^Domains/ }).click();
    await nav.getByRole('link', { name: 'Battery & New Energy' }).click();
    await expect(page.locator('main h1')).toHaveText('Battery & New Energy');
    await expect(page.getByRole('list', { name: 'Battery & New Energy lifecycle' })).toContainText('Tab Welding');
  });

  test('home shows the business flow; executive view shows the nine panels', async ({ page }) => {
    await go(page, '');
    await expect(page.getByRole('list', { name: 'TEAL Intelligence business flow' })).toContainText('Localization');
    await page.getByRole('button', { name: /Change workspace/ }).click();
    await page.getByRole('button', { name: /Executive/ }).click();
    const board = page.getByRole('region', { name: 'Executive overview' });
    for (const t of ['Strategic opportunities', 'Technology priorities', 'Critical risks', 'Upcoming decisions']) await expect(board.getByRole('heading', { name: t })).toBeVisible();
  });

  test('application engine: semiconductor package marking → machine, architecture, BOM, complexity', async ({ page }) => {
    await go(page, 'solution?domain=semiconductor&industry=ind-semi&material=mat-emc&process=Marking&app=app-semispm.mould&auto=Inline');
    await expect(page.getByRole('link', { name: 'Semi SPM' }).first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Process subsystem' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Indicative BOM' })).toBeVisible();
    await expect(page.getByText('Medium', { exact: true })).toBeVisible();
    await expect(page.getByText(/Throughput not captured/)).toBeVisible();
  });

  test('cross-domain map explains a cell', async ({ page }) => {
    await go(page, 'cross-domain');
    await page.getByRole('button', { name: /^UV in Semiconductor/ }).click();
    await expect(page.getByText(/TEAL application records \(\d+\)/)).toBeVisible();
  });

  test('parametric search answers the example query without inventing a 20–50 W UV platform', async ({ page }) => {
    await go(page, 'search?q=' + encodeURIComponent('Find 20–50W UV lasers suitable for semiconductor marking'));
    const panel = page.getByRole('heading', { name: 'Parameter matches' }).locator('xpath=ancestor::section[1]');
    await expect(page.getByText('power 20–50 W')).toBeVisible();
    await expect(page.getByText(/none in the power range; closest options/)).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Semi SPM' }).or(page.getByRole('link', { name: 'Semi SPM' }).first())).toBeVisible();
  });

  test('product architecture drills down to components with trust labels', async ({ page }) => {
    await go(page, 'product-architecture?product=markf');
    const tree = page.getByRole('list', { name: 'Architecture tree' });
    await expect(tree.getByText('Process system')).toBeVisible();
    await tree.locator('summary', { hasText: /^Laser/ }).first().click();
    await expect(tree.getByText(/DEMO DATA/).first()).toBeVisible();
  });

  test('requirement capture creates URS requirements on a new opportunity', async ({ page }) => {
    await go(page, 'capture');
    await page.getByLabel('Customer name *').fill('Fictional Capture Co');
    await page.getByLabel('Throughput (parts/h)').fill('1200');
    await page.getByLabel('Accuracy (µm)').fill('25');
    await page.getByRole('button', { name: /Save requirements/ }).click();
    await page.getByRole('link', { name: 'Open the opportunity' }).click();
    await expect(page.locator('main h1')).toContainText('Fictional Capture Co');
  });

  test('execution: kanban, calendar, milestones and risk matrix', async ({ page }) => {
    await go(page, 'execution');
    await expect(page.getByRole('list', { name: 'Kanban' })).toBeVisible();
    await page.getByRole('tab', { name: /Calendar/ }).click();
    await expect(page.getByRole('list', { name: 'Calendar' })).toBeVisible();
    await page.getByRole('tab', { name: /Milestones/ }).click();
    await expect(page.getByRole('heading', { name: 'Milestones' })).toBeVisible();
    await page.getByRole('tab', { name: /Risk matrix/ }).click();
    await expect(page.getByRole('table', { name: 'Risk matrix' })).toBeVisible();
  });

  test('documents: a PRD generated from an opportunity, downloadable as Markdown', async ({ page }) => {
    await go(page, 'documents?t=prd&ids=opp-demo-pkg-marking');
    const doc = page.getByRole('article', { name: 'Document preview' });
    await expect(doc.getByRole('heading', { name: /PRD — Inline package marking line/ })).toBeVisible();
    await expect(doc.getByText(/Values come only from the records above/)).toBeVisible();
    const dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Markdown' }).click();
    expect((await dl).suggestedFilename()).toMatch(/^teal-prd-.*\.md$/);
  });

  test('lists show one trust label per record; drafts show SYNC state', async ({ page }) => {
    await go(page, 'suppliers');
    await expect(page.locator('main table thead')).toContainText('Trust');
    await expect(page.locator('main table tbody').getByText('DEMO DATA').first()).toBeVisible();
    await go(page, 'customers?new=1');
    await page.getByLabel('Name *').fill('Sync Test Co');
    await page.getByRole('button', { name: 'Save local draft' }).click();
    await page.getByRole('button', { name: /draft/ }).first().click();
    await expect(page.getByText(/LOCAL DATA — never exported/)).toBeVisible();
  });

  test('development, value, settings, use cases render their essentials', async ({ page }) => {
    await go(page, 'development');
    await expect(page.getByRole('list', { name: 'Lifecycle stages' })).toBeVisible();
    await go(page, 'value');
    await expect(page.getByRole('meter', { name: /Laser source classes reused/ })).toBeVisible();
    await go(page, 'settings');
    await expect(page.getByText(/no user accounts and no access control/)).toBeVisible();
    await go(page, 'use-cases');
    await expect(page.getByRole('list', { name: '4 · EMS depaneling' })).toContainText('no application record');
  });
});
