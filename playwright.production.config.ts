import fs from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Se'kret Bip — read-only and intercepted transport checks against the live
// deployed frontend. Local harness, seeded-session, founder, and fixture-only
// specs must never be promoted into production launch evidence.
const BASE_URL = process.env.PRODUCTION_BASE_URL || 'https://sekretbip.net';
const sandboxChromium = '/opt/pw-browsers/chromium';
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  (fs.existsSync(sandboxChromium) ? sandboxChromium : undefined);

export default defineConfig({
  testDir: './e2e',
  testMatch: [
    'production-smoke.spec.ts',
    'production-auth-reachability.spec.ts',
    'production-password-recovery.spec.ts',
    'production-signup-transport.spec.ts',
  ],
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
