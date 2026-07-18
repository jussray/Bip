import { expect, test } from '@playwright/test';

const expectedReleaseSha = process.env.EXPECTED_RELEASE_SHA?.trim().toLowerCase();

test('production exposes the exact expected release commit', async ({ request }) => {
  test.skip(!expectedReleaseSha, 'EXPECTED_RELEASE_SHA is required for exact production release proof.');

  const response = await request.get(`/release.json?playwright=${Date.now()}`, {
    headers: {
      'cache-control': 'no-cache, no-store, max-age=0',
    },
  });
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/json');

  const release = await response.json();
  expect(release).toMatchObject({
    schemaVersion: 1,
    app: 'sekret-bip',
    commitSha: expectedReleaseSha,
    branch: 'main',
    deploymentProvider: 'cloudflare-pages',
  });
});

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

test('signup recovers from an ambiguous Supabase timeout without creating a real user', async ({ page }) => {
  let signupAttempts = 0;
  let passwordProbeAttempts = 0;

  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'POST' && url.pathname.endsWith('/signup')) {
      signupAttempts += 1;
      await route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'request_timeout',
          message: 'Processing this request timed out, please retry after a moment.',
        }),
      });
      return;
    }

    if (
      request.method() === 'POST' &&
      url.pathname.endsWith('/token') &&
      url.searchParams.get('grant_type') === 'password'
    ) {
      passwordProbeAttempts += 1;
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'email_not_confirmed',
          msg: 'Email not confirmed',
          message: 'Email not confirmed',
        }),
      });
      return;
    }

    // Never let this verification test mutate or inspect real production Auth.
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Blocked by signup recovery test.' }),
    });
  });

  await page.goto('/signup?side=teen');
  await page.getByPlaceholder('email').fill('playwright-signup-timeout@example.invalid');
  await page.getByPlaceholder('password (8+ characters)').fill('PlaywrightOnly-123!');
  await page.getByPlaceholder('confirm password').fill('PlaywrightOnly-123!');
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.getByText('Check your email')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/account was created.*confirmation is still pending/i)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(signupAttempts).toBe(1);
  expect(passwordProbeAttempts).toBe(1);
});
