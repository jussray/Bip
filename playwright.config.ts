import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const sandboxChromium = '/opt/pw-browsers/chromium';
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  (fs.existsSync(sandboxChromium) ? sandboxChromium : undefined);
const artifactDir = process.env.PLAYWRIGHT_ARTIFACT_DIR
  ? path.resolve(process.env.PLAYWRIGHT_ARTIFACT_DIR)
  : null;

export default defineConfig({
  testDir: './e2e',
  // Requires real Supabase config to be meaningful (see e2e/production-smoke.spec.ts);
  // this dev server intentionally runs with Supabase disabled, so it's excluded here
  // and only runs against the live domain via playwright.production.config.ts.
  testIgnore: '**/production-smoke.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: artifactDir
    ? [
        ['line'],
        ['json', { outputFile: path.join(artifactDir, 'results.json') }],
        ['html', { open: 'never', outputFolder: path.join(artifactDir, 'html') }],
      ]
    : process.env.CI
      ? [['line'], ['html', { open: 'never' }]]
      : 'html',
  outputDir: artifactDir ? path.join(artifactDir, 'test-results') : undefined,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
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
  webServer: {
    command: `npx expo start --web --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      EXPO_PUBLIC_SUPABASE_URL: '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
    },
  },
});