import { expect, go, test } from './fixtures';

const ROUTES: [string, RegExp][] = [
  ['', /Command Center/],
  ['dashboards', /Dashboards/],
  ['pm', /Product Manager/],
  ['products', /portfolio/i],
  ['configurator', /Configurator/],
  ['opportunities', /Opportunity/],
  ['inquiry', /customer inquiry/],
  ['applications', /Application/],
  ['laser', /Laser/],
  ['calculators', /Calculator/],
  ['process', /Process/],
  ['poc', /Proof of concept/],
  ['doe', /Design of experiments/],
  ['architecture', /architecture/i],
  ['semiconductor', /Semiconductor/],
  ['suppliers', /Suppliers/],
  ['rfq', /RFQ/],
  ['bom', /BOM/],
  ['cost', /Cost/],
  ['projects', /Projects/],
  ['gates', /G0–G10/],
  ['fat-sat', /FAT/],
  ['localization', /Localization/],
  ['technology', /Technology radar/],
  ['knowledge', /Handbook library/],
  ['memory', /Engineering memory/],
  ['missing', /What is missing/],
  ['changed', /What changed/],
  ['graph', /Knowledge graph/],
  ['evidence', /Evidence/],
  ['ai', /AI context/],
  ['service', /Field service/],
  ['admin', /Data management/],
  ['data-quality', /Data quality/],
  ['reports', /Reports/],
  ['legacy', /Legacy apps/],
  ['record/prd-semispm', /./],
  ['record/gate-g3', /G3/],
];

test.describe('every module renders without runtime errors', () => {
  for (const [route, title] of ROUTES) {
    test(`/${route}`, async ({ page }) => {
      await go(page, route);
      await expect(page.locator('main h1').first()).toHaveText(title);
    });
  }
});

test('unknown routes show a helpful not-found page', async ({ page }) => {
  await page.goto('./#/does-not-exist');
  await expect(page.getByText('Page not found')).toBeVisible();
});

test('data types stay visible: DEMO records are labelled', async ({ page }) => {
  await go(page, 'record/prj-demo-c2i');
  await expect(page.getByText('DEMO').first()).toBeVisible();
});
