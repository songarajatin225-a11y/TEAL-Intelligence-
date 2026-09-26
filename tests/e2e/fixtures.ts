import { test as base, expect, type Page } from '@playwright/test';

/**
 * Every test fails on an uncaught page error or console error. Tolerated: blocked external fonts
 * and the optional brand logo file (public/brand/teal-logo.png shows a text fallback when absent).
 * The welcome dialog is pre-dismissed unless a test opts in with `firstVisit`.
 */
export const test = base.extend<{ errors: string[]; firstVisit: boolean }>({
  firstVisit: [false, { option: true }],
  page: async ({ page, firstVisit }, provide) => {
    if (!firstVisit) await page.addInitScript(() => localStorage.setItem('teal-os:prefs:v1', JSON.stringify({ ...JSON.parse(localStorage.getItem('teal-os:prefs:v1') || '{}'), onboarded: true })));
    await provide(page);
  },
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        if (/fonts\.(googleapis|gstatic)|ERR_CERT|net::ERR_/.test(m.text()) || m.location().url.includes('brand/teal-logo')) return;
        errors.push(`console: ${m.text()}`);
      });
      await use(errors);
      expect(errors, 'no runtime errors').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

/** Navigate by hash route and wait until the data layer has loaded. */
export async function go(page: Page, route: string): Promise<void> {
  await page.goto(`./#/${route.replace(/^\//, '')}`);
  await expect(page.locator('main h1').first()).toBeVisible({ timeout: 20_000 });
}
