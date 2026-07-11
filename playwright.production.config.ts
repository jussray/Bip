import fs from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Se'kret Bip — read-only smoke checks against the live deployed frontend.
// No webServer block: this targets the real deployed domain instead of a
// local dev server, and every test here must stay read-only (no real
// production credentials, no destructive actions).
const BASE_URL = process.env.PRODUCTION_BASE_URL || 'https://sekretbip.net';
const sandboxChromium = '/opt/pw-browsers/chromium';
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  (fs.existsSync(sandboxChromium) ? sandboxChromium : undefined);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 2,
  workers: 1,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report-production' }]]
    : 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(executablePath ? { launchOptions: { executablePath } } : {}),
      },
    },
  ],
});
