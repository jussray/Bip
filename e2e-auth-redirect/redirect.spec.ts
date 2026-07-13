import { expect, test } from '@playwright/test';

test('unauthenticated visit to a protected teen route redirects to login', async ({ page }) => {
  await page.goto('/room');

  await expect(page.getByText('welcome back')).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/login/);
});

test('unauthenticated visit to a protected parent route redirects to login', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page.getByText('welcome back')).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/login/);
});

test('auth routes remain directly reachable without a redirect loop', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByText('welcome back')).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/login/);
});
