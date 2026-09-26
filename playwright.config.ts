import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

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
    baseURL: 'http://localhost:4173/TEAL-Intelligence-/',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    launchOptions: localChromium ? { executablePath: localChromium } : {},
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/TEAL-Intelligence-/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
