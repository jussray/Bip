import { expect, test } from '@playwright/test';

test('public signup stays bounded when browser transport fails throughout recovery', async ({ page }) => {
  let signupAttempts = 0;
  let passwordProbeAttempts = 0;

  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'POST' && url.pathname.endsWith('/signup')) {
      signupAttempts += 1;
      await route.abort('failed');
      return;
    }

    if (
      request.method() === 'POST' &&
      url.pathname.endsWith('/token') &&
      url.searchParams.get('grant_type') === 'password'
    ) {
      passwordProbeAttempts += 1;
      await route.abort('failed');
      return;
    }

    // No request from this test may reach real production Auth.
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Blocked by public signup transport test.' }),
    });
  });

  await page.goto('/signup?side=teen');
  await page.getByPlaceholder('email').fill('fresh-public-signup@example.invalid');
  await page.getByPlaceholder('password (8+ characters)').fill('PlaywrightOnly-123!');
  await page.getByPlaceholder('confirm password').fill('PlaywrightOnly-123!');
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page.getByText('Check your email')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/could not confirm the final signup response/i)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(signupAttempts).toBe(2);
  expect(passwordProbeAttempts).toBe(1);
});
