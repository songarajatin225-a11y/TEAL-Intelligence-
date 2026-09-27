import AxeBuilder from '@axe-core/playwright';
import { expect, go, test } from './fixtures';

test.describe('navigation shell', () => {
  test('sidebar groups pages into domains and collapses to an icon rail (remembered)', async ({ page }) => {
    await go(page, '');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav.getByRole('button', { name: /^Suppliers/ })).toBeVisible();
    await nav.getByRole('button', { name: /^Suppliers/ }).click();
    await nav.getByRole('link', { name: 'RFQs' }).click();
    await expect(page.locator('main h1')).toHaveText('RFQs');
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  });

  test('breadcrumb shows domain → page → record', async ({ page }) => {
    await go(page, 'record/prd-semispm');
    const bc = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(bc.getByText('Semi SPM')).toBeVisible();
    await expect(bc.locator('[aria-current="page"]')).toHaveText('Semi SPM');
  });

  test('command palette: Ctrl+K, type, Enter navigates', async ({ page }) => {
    await go(page, '');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Command palette' });
    await expect(dialog).toBeVisible();
    await page.keyboard.type('technology radar');
    await page.keyboard.press('Enter');
    await expect(page.locator('main h1')).toHaveText('Technology Radar');
    await expect(dialog).toBeHidden();
  });

  test('command palette offers context actions on a record', async ({ page }) => {
    await go(page, 'record/prd-semispm');
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('option', { name: /Why\? — sources/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /Pin to sidebar/ })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('global search groups results and opens one', async ({ page }) => {
    await go(page, '');
    const box = page.getByRole('combobox', { name: 'Search everything' });
    await box.fill('galvo');
    const list = page.getByRole('listbox', { name: 'Search results' });
    await expect(list.getByRole('option').first()).toBeVisible({ timeout: 20_000 });
    await list.getByRole('option').first().click();
    await expect(page.locator('main h1')).toBeVisible();
  });

  test('keyboard: g then p goes to projects; / focuses search', async ({ page }) => {
    await go(page, '');
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('g');
    await page.keyboard.press('p');
    await expect(page.locator('main h1')).toHaveText('Projects');
    await page.keyboard.press('/');
    await expect(page.getByRole('combobox', { name: 'Search everything' })).toBeFocused();
  });

  test('quick create: N → Customer → form in a drawer → saved as local draft with a toast', async ({ page }) => {
    await go(page, '');
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('n');
    await page.getByRole('dialog', { name: 'Create' }).getByRole('button', { name: 'Customer' }).click();
    await page.locator('#f-name').fill('Quick Create Customer');
    await page.getByRole('button', { name: 'Save local draft' }).click();
    await expect(page.locator('main h1')).toHaveText('Quick Create Customer');
    await expect(page.getByRole('status').filter({ hasText: 'Saved as local draft' })).toBeVisible();
    await expect(page.getByRole('button', { name: /1 draft/ })).toBeVisible();
  });

  test('list rows open an inspection drawer without leaving the list', async ({ page }) => {
    await go(page, 'suppliers');
    await page.locator('main table tbody tr').first().locator('td').nth(1).click();
    const drawer = page.getByRole('dialog');
    await expect(drawer.getByRole('link', { name: /Open full page/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(page.locator('main h1')).toHaveText('Suppliers');
  });

  test('record tabs disclose detail progressively and are linkable', async ({ page }) => {
    await go(page, 'record/prd-semispm');
    await page.getByRole('tab', { name: /Evidence/ }).click();
    await expect(page).toHaveURL(/tab=evidence/);
    await expect(page.getByText(/Why\? — sources, evidence/)).toBeVisible();
    await page.getByRole('tab', { name: /System/ }).click();
    await expect(page.getByText('All stored fields')).toBeVisible();
  });

  test('pin a record → it appears in the sidebar', async ({ page }) => {
    await go(page, 'record/prd-semispm');
    await page.getByRole('button', { name: 'Pin to sidebar' }).click();
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByText('Pinned')).toBeVisible();
  });

  test('appearance: dark theme and compact density persist', async ({ page }) => {
    await go(page, '');
    await page.getByRole('button', { name: /Appearance/ }).click();
    await page.getByRole('radio', { name: 'Dark' }).click();
    await page.getByRole('radio', { name: 'Compact' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme-resolved', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme-resolved', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
  });

  test('workspace switch changes emphasis: Executive view', async ({ page }) => {
    await go(page, '');
    await page.getByRole('button', { name: /Change workspace/ }).click();
    await page.getByRole('button', { name: /Executive/ }).click();
    await expect(page.locator('main h1')).toHaveText('Executive View');
  });

  test('focus mode hides navigation; F toggles', async ({ page }) => {
    await go(page, '');
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('f');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden();
    await page.keyboard.press('f');
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  });

  test('contextual help opens for the current page', async ({ page }) => {
    await go(page, 'cost');
    await page.getByRole('button', { name: 'Help for this page' }).click();
    await expect(page.getByRole('dialog', { name: /Help — .*Cost/ })).toBeVisible();
  });
});

test.describe('first visit', () => {
  test.use({ firstVisit: true });
  test('welcome dialog explains three ideas and can be dismissed for good', async ({ page }) => {
    await page.goto('./#/');
    const dlg = page.getByRole('dialog', { name: 'Welcome to TEAL Intelligence' });
    await expect(dlg).toBeVisible({ timeout: 20_000 });
    await dlg.getByRole('button', { name: 'Skip' }).click();
    await page.reload();
    await expect(page.locator('main h1')).toHaveText('Mission Control');
    await expect(dlg).toBeHidden();
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('bottom bar and navigation drawer', async ({ page }) => {
    await go(page, '');
    const bar = page.getByRole('navigation', { name: 'Quick navigation' });
    await expect(bar).toBeVisible();
    await bar.getByRole('button', { name: 'Menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Navigation' });
    // Intelligence is open by default (second primary section)
    await drawer.getByRole('link', { name: 'Customer Intelligence' }).click();
    await expect(page.locator('main h1')).toHaveText('Customers');
    await expect(page.locator('main table')).toHaveCount(0); // rows render as cards on phones
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe('accessibility (axe, WCAG 2.2 A/AA rules)', () => {
  for (const route of ['', 'products', 'record/prd-semispm', 'laser', 'cost', 'admin', 'room/prj-demo-c2i', 'leads', 'business-case', 'technology', 'ask?q=takt', 'supplier-risk', 'activities', 'graph', 'studio', 'studio/sim-demo-pcb-a', 'studio/sim-demo-pcb-a?tab=twin', 'engineering-db', 'record/prt-demo-mopa-50', 'data-review', 'requirements-quality']) {
    for (const theme of ['light', 'dark'] as const) {
      test(`/${route} — ${theme}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme });
        await go(page, route);
        await page.waitForTimeout(400);
        const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        const serious = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(serious.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
      });
    }
  }
});
