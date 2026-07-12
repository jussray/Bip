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

test('Teen Circle keeps public identity separate and does not expose fake Crew invites', async ({ page }) => {
  await page.goto('/(teen)/circle');

  await expect(page.getByText('🌐 Circle')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('🤝 Crew')).toBeVisible();
  await expect(page.getByText('💜 Messages')).toBeVisible();
  await expect(page.getByText(/Your Circle identity is separate from your private account/)).toBeVisible();

  await page.getByText('🤝 Crew').click();

  await expect(page.getByText('Private Crew is being prepared.')).toBeVisible();
  await expect(page.getByText(/Placeholder invite codes are no longer treated as real connections/)).toBeVisible();
});

test('Parent Bridge is reachable as a primary tab and preserves the privacy boundary', async ({ page }) => {
  await page.goto('/(parent)/bridge');

  await expect(page.getByText('Parent Bridge', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Bridge', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Only summaries your teen deliberately chooses to share.')).toBeVisible();
  await expect(page.getByText(/Linking accounts does not unlock journals, chats, mood history, media/)).toBeVisible();
});
