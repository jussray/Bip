import { expect, test, type Page } from '@playwright/test';

const testEmail = 'password-recovery-check@example.invalid';

async function fillRecoveryForm(page: Page) {
  await page.goto('/forgot-password');
  await page.getByLabel('Account email').fill(testEmail);
  await page.getByRole('button', { name: 'Send password reset email' }).click();
}

test('password recovery reports Auth delivery delay without sending a real email', async ({ page }) => {
  let recoverRequests = 0;

  await page.route('**/auth/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'POST' && url.pathname.endsWith('/recover')) {
      recoverRequests += 1;
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
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Blocked by password recovery test.' }),
    });
  });

  await fillRecoveryForm(page);

  await expect(page.getByText('Request received')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/email delivery is taking longer than expected/i)).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(recoverRequests).toBe(1);
});

test('password recovery remains retryable when the browser cannot reach Auth', async ({ page }) => {
  let recoverRequests = 0;

  await page.route('**/auth/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'POST' && url.pathname.endsWith('/recover')) {
      recoverRequests += 1;
      await route.abort('failed');
      return;
    }
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Blocked by password recovery test.' }),
    });
  });

  await fillRecoveryForm(page);

  await expect(page.getByRole('alert')).toHaveText(
    'Could not reach the account server. Check your connection and try again.',
    { timeout: 30_000 },
  );
  await expect(page.getByText('Request received')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Send password reset email' })).toBeEnabled();
  expect(recoverRequests).toBe(1);
});
