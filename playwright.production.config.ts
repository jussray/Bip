import { defineConfig, devices } from '@playwright/test';
import { resolvePlaywrightExecutablePath } from './scripts/playwright-executable.mjs';

const BASE_URL = process.env.PRODUCTION_BASE_URL || 'https://sekretbip.net';
const executablePath = resolvePlaywrightExecutablePath();

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
