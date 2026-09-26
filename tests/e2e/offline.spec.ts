import { expect, go, test } from './fixtures';

test('works offline after one visit (service worker + cached data), showing the offline state', async ({ page, context }) => {
  await go(page, '');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // second online load runs under the service worker, which caches app assets and data
  await page.reload();
  await expect(page.locator('main h1').first()).toHaveText(/Mission Control/, { timeout: 20_000 });
  await go(page, 'products');

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline — cached engineering data')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('main h1').first()).toHaveText(/Products & Platforms/, { timeout: 20_000 });
  await expect(page.getByRole('link', { name: /Mark F-Series/ }).first()).toBeVisible();
  await context.setOffline(false);
});
