import fs from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Deliberately separate from playwright.config.ts. The main e2e suite runs with
// EXPO_PUBLIC_SUPABASE_URL/ANON_KEY blank on purpose (no real credentials in CI),
// which makes isSupabaseConfigured false and short-circuits the RouteBoundary
// auth-redirect guard entirely (see src/context/VerificationContext.tsx and
// app/_layout.tsx). To exercise that guard for real we need isSupabaseConfigured
// to be true, so this config points at a syntactically valid but non-functional
// Supabase project. supabase-js's getSession() reads local/session storage first
// and resolves to "no session" without a network round trip when nothing is
// stored, so this stays fast and never contacts a real backend.
//
// This is opt-in (npm run test:e2e:auth-redirect) and intentionally NOT part of
// npm run test:e2e or verify:prepush — whether to run it in CI by default is a
// call for a human, not something to fold into the default gate silently.

const PORT = 4175;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const sandboxChromium = '/opt/pw-browsers/chromium';
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  (fs.existsSync(sandboxChromium) ? sandboxChromium : undefined);

export default defineConfig({
  testDir: './e2e-auth-redirect',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report-auth-redirect' }]]
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
  webServer: {
    command: `npx expo start --web --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Syntactically valid but non-functional. Never real credentials.
      EXPO_PUBLIC_SUPABASE_URL: 'https://auth-redirect-test.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'auth-redirect-test-placeholder-anon-key',
    },
  },
});
