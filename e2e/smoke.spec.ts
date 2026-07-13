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

test('Teen Circle cannot bypass account onboarding from a blank browser session', async ({ page }) => {
  await page.goto('/circle?bipDevSide=teen');

  const splashButton = page.getByRole('button', {
    name: "Se'kret Bip — enter your safe space",
  });
  await expect(splashButton).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('🌐 Circle')).not.toBeVisible();
});

test('Teen Bridge remains closed from a blank browser session during controlled rollout proof', async ({ page }) => {
  await page.goto('/bridge?bipDevSide=teen');

  const splashButton = page.getByRole('button', {
    name: "Se'kret Bip — enter your safe space",
  });
  await expect(splashButton).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/share with parent/i)).not.toBeVisible();
  await expect(page.getByText(/conversation starters/i)).not.toBeVisible();
});

test('Parent Bridge fails closed until guardian verification is complete', async ({ page }) => {
  await page.goto('/bridge?bipDevSide=parent');

  await expect(page.getByText('GUARDIAN ACCESS')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Guardian verification is required.')).toBeVisible();
  await expect(page.getByText(/Linking to a teen is a separate consent step/)).toBeVisible();
  await expect(page.getByText(/No journal, voice note, or private source is shared automatically/)).toBeVisible();
  await expect(page.getByText('Submit for guardian review')).toBeVisible();
});

test('authorization evidence and secret identifiers stay out of the public web surface', async ({ page }) => {
  await page.goto('/');

  const splashButton = page.getByRole('button', {
    name: "Se'kret Bip — enter your safe space",
  });
  await expect(splashButton).toBeVisible({ timeout: 30_000 });

  const visibleText = await page.locator('body').innerText();
  expect(visibleText).not.toContain('authorization_phase0.sql');
  expect(visibleText).not.toContain('supabase-authorization-baseline.json');
  expect(visibleText).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  expect(visibleText).not.toContain('ACCOUNT_DELETION_PROCESS_SECRET');
  expect(visibleText).not.toContain('SAFETY_SCAN_SECRET');
  expect(visibleText).not.toContain('app_private_config');
  expect(visibleText).not.toContain('app_config');
  expect(visibleText).not.toContain('harden_config_table_grants');
});
