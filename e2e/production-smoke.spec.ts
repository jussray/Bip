import { expect, test } from '@playwright/test';

// A blank/unauthenticated session on a protected route lands on the splash
// onboarding entry point, not a bare /login form — confirmed against real
// production by the sibling "Teen Circle cannot bypass account onboarding"
// and "Parent Bridge fails closed until guardian verification is complete"
// checks in e2e/smoke.spec.ts, which run in every environment (they don't
// depend on isSupabaseConfigured the way a /login redirect assumption
// would). These two extend that same proven pattern to a plain teen-only
// and parent-only screen instead of Circle/Bridge specifically.

test('unauthenticated visitor cannot reach a protected teen route from a blank session', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  // comfort.tsx exists only under app/(teen)/ — an unambiguous teen route.
  await page.goto('/comfort');

  const splashButton = page.getByRole('button', {
    name: "Se'kret Bip — enter your safe space",
  });
  await expect(splashButton).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Grounding Steps')).not.toBeVisible();
  await expect(page.getByText('Bridge')).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test('unauthenticated visitor cannot reach a protected parent route from a blank session', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  // approvals.tsx exists only under app/(parent)/ and renders a real screen
  // (unlike dashboard.tsx, which is just <Redirect href="/(parent)/bridge..." />).
  await page.goto('/approvals');

  const splashButton = page.getByRole('button', {
    name: "Se'kret Bip — enter your safe space",
  });
  await expect(splashButton).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('To Review')).not.toBeVisible();
  await expect(page.getByText('Bridge')).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});
