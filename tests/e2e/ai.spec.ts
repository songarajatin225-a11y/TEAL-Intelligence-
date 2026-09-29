import { expect, go, test } from './fixtures';

/*
 * AI layer (AI master prompt §8, §9, §85, §92, §106): the Copilot answers from local engines with the
 * response contract, uses page context, records decisions; the Control Center shows honest engine states
 * and runs the evaluation; the configurator walks every stage; search gains an opt-in hybrid ranking.
 */
test.describe('AI intelligence layer', () => {
  test('Copilot drawer: grounded configuration answer with the response contract', async ({ page }) => {
    await go(page, '');
    await page.getByRole('button', { name: 'Open TEAL Copilot (I)' }).click();
    const dlg = page.getByRole('dialog', { name: /TEAL Copilot/ });
    await expect(dlg.getByText('Local engines — no language model is connected.')).toBeVisible();
    await dlg.getByRole('button', { name: /aluminium battery cans/ }).click();
    const ans = dlg.getByRole('article', { name: /Answer: Machine configuration/ });
    await expect(ans).toBeVisible({ timeout: 20_000 });
    for (const h of ['Answer', 'Technical basis', 'Data gaps', 'Validation required', 'Confidence']) await expect(ans.getByRole('heading', { name: h, exact: true })).toBeVisible();
    await expect(ans.getByText('Engineering review required.')).toBeVisible();
    await expect(ans.getByText(/Candidate technologies for Marking on Aluminium/)).toBeVisible();
    await expect(ans.getByRole('button', { name: /Open a 3D scenario from “Can Marking”/ })).toBeVisible();
    await expect(ans.getByText('Local engines · no LLM')).toBeVisible();
  });

  test('context-aware: on a laser page, “Where can I use this?” answers for that laser (key I)', async ({ page }) => {
    await go(page, 'record/las-mopa');
    await page.keyboard.press('i');
    const dlg = page.getByRole('dialog', { name: /TEAL Copilot/ });
    await expect(dlg.getByRole('button', { name: /Fiber MOPA/, pressed: true })).toBeVisible();
    await dlg.getByRole('button', { name: 'Where can I use this?' }).click();
    const ans = dlg.getByRole('article', { name: /Answer: About Fiber MOPA/ });
    await expect(ans).toBeVisible({ timeout: 20_000 });
    await expect(ans.getByText(/Fiber MOPA → is used by/).first()).toBeVisible();
  });

  test('change impact and a recorded engineering decision (human in the loop)', async ({ page }) => {
    await go(page, `copilot?q=${encodeURIComponent('What changes if I replace DL-MOPA-20 with DL-MOPA-50?')}`);
    const ans = page.getByRole('article', { name: /Answer: Change impact/ });
    await expect(ans).toBeVisible({ timeout: 20_000 });
    await expect(ans.getByText(/SPECIFICATION CONFLICT/).first()).toBeVisible();
    await expect(ans.getByRole('region', { name: 'Impact by engineering domain' })).toContainText('Cooling');
    await ans.getByRole('button', { name: 'Record the decision' }).click();
    const m = page.getByRole('dialog', { name: 'Record an engineering decision' });
    await m.getByLabel('Decision', { exact: true }).fill('Keep DL-MOPA-20 until the chiller is re-sized');
    await m.getByLabel('Reason').fill('Heat load increases from 150 W to 350 W');
    await m.getByLabel('Approver (engineer)').fill('E2E Engineer');
    await m.getByRole('button', { name: 'Save decision' }).click();
    await expect(page.locator('main h1')).toContainText('What changes if I replace');
    await expect(page.getByText('Keep DL-MOPA-20 until the chiller is re-sized').first()).toBeVisible();
  });

  test('predictions are refused without data; feedback is recorded', async ({ page }) => {
    await go(page, `copilot?q=${encodeURIComponent('Predict weld quality for 1 mm stainless steel')}`);
    const ans = page.getByRole('article').first();
    await expect(ans.getByText(/No prediction is made/)).toBeVisible({ timeout: 20_000 });
    await ans.getByRole('button', { name: 'Needs review' }).click();
    await expect(page.getByText('Feedback recorded in this browser')).toBeVisible();
  });

  test('AI Engine Control Center: honest statuses, engine switch, evaluation', async ({ page }) => {
    await go(page, 'ai-engine');
    await expect(page.getByRole('row', { name: /Reasoning LLM/ })).toContainText('OFFLINE');
    await expect(page.getByRole('row', { name: /Bayesian optimisation/ })).toContainText(/DATA REQUIRED/);
    const sw = page.getByRole('switch', { name: 'Lexical vector index enabled' });
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await page.getByRole('button', { name: 'Reset switches' }).click();
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('tab', { name: /Evaluation/ }).click();
    await page.getByRole('button', { name: 'Run evaluation' }).click();
    await expect(page.getByText('Intent accuracy')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Hallucination rate')).toBeVisible();
  });

  test('AI Configurator: every stage, drafts with the review banner', async ({ page }) => {
    await go(page, `ai-configure?q=${encodeURIComponent('I need a laser marking machine for aluminium battery cans, 5-second cycle time, high-contrast marking.')}`);
    await expect(page.getByRole('list', { name: 'Configuration stages' })).toContainText('Volt-M', { timeout: 20_000 });
    await expect(page.getByRole('list', { name: 'Configuration stages' })).toContainText('Can Marking');
    await expect(page.getByRole('textbox', { name: 'RFQ draft' })).toHaveValue(/DRAFT — ENGINEERING REVIEW REQUIRED/);
    await page.getByRole('tab', { name: 'FMEA (AI-suggested)' }).click();
    await expect(page.getByRole('textbox', { name: 'FMEA draft' })).toHaveValue(/AI-SUGGESTED/);
  });

  test('search: keyword results unchanged; hybrid ranking is opt-in and explains positions', async ({ page }) => {
    await go(page, `search?q=${encodeURIComponent('MOPA laser aluminium marking')}`);
    await expect(page.getByText(/result\(s\) for “MOPA laser aluminium marking”/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('list', { name: 'Hybrid results' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Hybrid ranking (BETA)' }).click();
    const list = page.getByRole('list', { name: 'Hybrid results' });
    await expect(list).toBeVisible({ timeout: 20_000 });
    await expect(list.getByText(/name covers|keyword rank|meets/).first()).toBeVisible();
  });
});
