import { expect, test } from '@playwright/test';

// These two checks only mean anything against a build with Supabase
// actually configured: app/_layout.tsx only redirects unauthenticated
// visitors off protected routes when `isSupabaseConfigured` is true, and
// the local e2e dev server intentionally runs with Supabase disabled (see
// playwright.config.ts). Real production has real Supabase config, so
// these live only in the production Playwright run.

test('unauthenticated visitor is redirected off a protected teen route', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  // comfort.tsx exists only under app/(teen)/ — an unambiguous teen route.
  await page.goto('/comfort');

  await expect(page.getByText('welcome back')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  await expect(page.getByText('Bridge')).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('unauthenticated visitor is redirected off a protected parent route', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  // dashboard.tsx exists only under app/(parent)/ — an unambiguous parent route.
  await page.goto('/dashboard');

  await expect(page.getByText('welcome back')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  await expect(page.getByText('Bridge')).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});
