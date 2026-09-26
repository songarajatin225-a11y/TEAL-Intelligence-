import { expect, go, test } from './fixtures';

/** Every module renders its page title with no runtime errors (all pre-redesign routes kept, plus the intelligence pages). */
const ROUTES: [string, RegExp][] = [
  ['', /Mission Control/],
  ['dashboards', /Dashboards/],
  ['pm', /My Workspace/],
  ['activities', /Activities/],
  ['products', /Products & Platforms/],
  ['configurator', /Configurator/],
  ['platformization', /Platformization/],
  ['customers', /Customers/],
  ['companies', /Companies/],
  ['opportunities', /Opportunities/],
  ['inquiry', /customer inquiry/],
  ['requirements', /Requirements/],
  ['traceability', /Traceability/],
  ['applications', /Applications/],
  ['materials', /Materials/],
  ['laser', /Laser Platform/],
  ['laser-sources', /Laser Sources/],
  ['optics', /Optics/],
  ['galvo', /Galvo/],
  ['calculators', /Calculators/],
  ['formulas', /Formulas/],
  ['process', /Process Engineering/],
  ['poc', /POCs/],
  ['doe', /DOE Studies/],
  ['machines', /Machines/],
  ['architecture', /Architecture/],
  ['modules', /Modules/],
  ['reuse', /What Can We Reuse/],
  ['semiconductor', /Semiconductor Intelligence/],
  ['equipment-buyer', /Equipment Buyer/],
  ['suppliers', /Suppliers/],
  ['rfq', /RFQs/],
  ['procurement', /Procurement/],
  ['bom', /BOM/],
  ['items', /Components/],
  ['cost', /Cost/],
  ['projects', /Projects/],
  ['gates', /Design Gates/],
  ['quality', /Risk & FMEA/],
  ['decisions', /Engineering Decisions/],
  ['changes', /Change Requests/],
  ['fat-sat', /FAT/],
  ['production-release', /Production Release/],
  ['localization', /Localization/],
  ['technology', /Technology Radar/],
  ['roadmap', /Roadmap/],
  ['global', /Global Intelligence/],
  ['knowledge', /Engineering Knowledge/],
  ['search', /Search/],
  ['memory', /Engineering Memory/],
  ['missing', /What Is Missing/],
  ['changed', /What Changed/],
  ['graph', /Knowledge Graph/],
  ['evidence', /Evidence/],
  ['lessons', /Lessons Learned/],
  ['ai', /AI context/i],
  ['service', /Field Service/],
  ['admin', /Data & Workspace/],
  ['data-quality', /Data Quality/],
  ['reports', /Reports/],
  ['help', /Help Center/],
  ['legacy', /Legacy Applications/],
  ['compare', /Compare/],
  ['ask', /Ask Intelligence/],
  ['duplicates', /Duplicates/],
  ['supplier-risk', /Supplier Risk/],
  ['units', /Unit Converter/],
  ['rooms', /Rooms/],
  ['room/prd-markf', /Mark F-Series/],
  ['leads', /LeadConnect/],
  ['business-case', /Market & Business Case/],
  ['record/prd-semispm', /Semi SPM/],
  ['record/gate-g3', /G3/],
];

test.describe('every module renders without runtime errors', () => {
  for (const [route, title] of ROUTES) {
    test(`/${route}`, async ({ page }) => {
      await go(page, route);
      await expect(page.locator('main h1').first()).toHaveText(title);
      await expect(page.locator('main h1')).toHaveCount(1);
    });
  }
});

test('unknown routes show a helpful not-found page', async ({ page }) => {
  await page.goto('./#/does-not-exist');
  await expect(page.getByText('Page not found')).toBeVisible();
});

test('data types stay visible: demo records are labelled', async ({ page }) => {
  await go(page, 'record/prj-demo-c2i');
  await expect(page.getByText(/Demo record/)).toBeVisible();
});
