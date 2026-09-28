import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// Same base path as vite.config.ts (GitHub Pages project site: /<repo>/).
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'TEAL-Intelligence-';
const base = `http://localhost:4173/${repo}/`;

// Use the pre-installed Chromium when present (CI installs its own via `npx playwright install`).
const localChromium = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => existsSync(p));

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: base,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    launchOptions: localChromium ? { executablePath: localChromium } : {},
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: base,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
