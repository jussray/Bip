import { expect, test } from '@playwright/test';

test('teen splash leads into onboarding welcome', async ({ page }) => {
  await page.goto('/');

  const splashButton = page.getByRole('button', {
    name: "Se'kret Bip — enter your safe space",
  });

  await expect(splashButton).toBeVisible({ timeout: 30_000 });
  await splashButton.click();

  await expect(page.getByText("I'm ready")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('For ages 13 and up')).toBeVisible();
});

test('login deep link renders and survives refresh', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByText('welcome back')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByPlaceholder('email')).toBeVisible();
  await expect(page.getByPlaceholder('password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

  await page.reload();

  await expect(page.getByText('welcome back')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});

test('signup deep link exposes account creation controls', async ({ page }) => {
  await page.goto('/signup');

  await expect(page.getByText('create your space')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByPlaceholder('email')).toBeVisible();
  await expect(page.getByPlaceholder('password (8+ characters)')).toBeVisible();
  await expect(page.getByPlaceholder('confirm password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
});

test('representative teen route (Room) renders without crashing and shows the tab bar', async ({ page }) => {
  await page.goto('/room');

  await expect(page.getByText('Talk to Se\'kret')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('how you holding up?')).toBeVisible();
  await expect(page.getByText('Room', { exact: true })).toBeVisible();
  await expect(page.getByText('Circle', { exact: true })).toBeVisible();
});

test('representative parent route (Dashboard) redirects to Parent Bridge and renders without crashing', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page.getByText('Parent Bridge')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Privacy boundary')).toBeVisible();
  await expect(page).toHaveURL(/\/bridge\?tab=signals/);
});

test('frontend entry renders at phone width without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const splashButton = page.getByRole('button', {
    name: "Se'kret Bip — enter your safe space",
  });

  await expect(splashButton).toBeVisible({ timeout: 30_000 });

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const box = await splashButton.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
});
