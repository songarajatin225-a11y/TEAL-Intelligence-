import { test as base, expect, type Page } from '@playwright/test';

/** Fails the test on any uncaught page error or console error (except blocked external fonts). */
export const test = base.extend<{ errors: string[] }>({
  errors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_CERT|net::ERR_/.test(m.text())) errors.push(`console: ${m.text()}`);
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
