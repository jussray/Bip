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
  // Production specs require repository-controlled browser configuration.
  // This default dev server intentionally runs with Supabase disabled so it
  // can prove graceful local fallback. The intercepted signup transport proof
  // runs through playwright.auth-transport.config.ts with fake public values.
  // Room specs use a dedicated founder-preview config and remain isolated here.
  testIgnore: [
    '**/production-smoke.spec.ts',
    '**/production-password-recovery.spec.ts',
    '**/production-auth-reachability.spec.ts',
    '**/production-signup-transport.spec.ts',
    '**/rooms/**',
  ],
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
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
    },
  },
});
