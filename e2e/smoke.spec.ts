import { expect, test } from '@playwright/test';

test('teen front door leads directly into age-bucket onboarding', async ({ page }) => {
  await page.goto('/?bipDevSide=teen');
  const enter = page.getByTestId('web-welcome-enter');
  await expect(enter).toBeVisible({ timeout: 30_000 });
  await enter.click();
  await expect(page.getByText('How old are you?')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /13\s*[–-]\s*15 Teen mode starts/i })).toBeVisible();
});

test('parent front door leads directly into parent onboarding', async ({ page }) => {
  await page.goto('/?bipDevSide=parent');
  const enter = page.getByTestId('web-welcome-enter');
  await expect(enter).toBeVisible({ timeout: 30_000 });
  await enter.click();
  await expect(page.getByRole('button', { name: "Se'kret Bip — enter your parent space" })).toBeVisible({ timeout: 15_000 });
});

test('rollback front door exposes bounded working actions and canonical identity', async ({ page }) => {
  await page.goto('/?bipDevSide=teen');
  await expect(page.getByTestId('web-welcome-shell')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('web-welcome-hero-teen')).toBeVisible();
  await expect(page.getByText('Come on in.')).toBeVisible();
  await expect(page.getByRole('img', { name: /Night on the left, Suhana in the center, Sy on the right, Cloud, and their parents together/ })).toBeVisible();
  await expect(page.getByText('Night', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Suhana', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Sy', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button')).toHaveCount(2);
  await page.screenshot({ path: 'test-results/front-door-desktop.png', fullPage: true });
});

test('web welcome Enter supports keyboard activation', async ({ page }) => {
  await page.goto('/?bipDevSide=teen');
  const enter = page.getByTestId('web-welcome-enter');
  await expect(enter).toBeVisible({ timeout: 30_000 });
  await enter.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('How old are you?')).toBeVisible({ timeout: 15_000 });
});

test('frontend entry renders at phone width without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const enter = page.getByTestId('web-welcome-enter');
  await expect(enter).toBeVisible({ timeout: 30_000 });
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalOverflow).toBe(false);
  const box = await enter.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/front-door-390x844.png' });
});

test('frontend entry remains contained on a short narrow phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  const shell = page.getByTestId('web-welcome-shell');
  await expect(shell).toBeVisible({ timeout: 30_000 });
  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(hasHorizontalOverflow).toBe(false);
  const shellBox = await shell.boundingBox();
  expect(shellBox).not.toBeNull();
  expect(shellBox!.x).toBeGreaterThanOrEqual(0);
  expect(shellBox!.x + shellBox!.width).toBeLessThanOrEqual(320);
  await page.screenshot({ path: 'test-results/front-door-320x568.png' });
});

test('login deep link renders current controls and survives refresh', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('sign in to continue')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('sign in to continue')).toBeVisible({ timeout: 30_000 });
});

test('teen signup deep link enforces age assurance before account fields', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.getByText('How old are you?')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: /13\s*[–-]\s*15 Teen mode starts/i })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email' })).not.toBeVisible();
});

test('parent signup deep link exposes account creation controls', async ({ page }) => {
  await page.goto('/signup?side=parent');
  await expect(page.getByText('create your Parent Space')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
});

test('protected teen routes remain behind the public boundary', async ({ page }) => {
  await page.goto('/circle?bipDevSide=teen');
  await expect(page.getByTestId('web-welcome-enter')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('🌐 Circle')).not.toBeVisible();
});

test('authorization evidence and secrets stay out of the public surface', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('web-welcome-enter')).toBeVisible({ timeout: 30_000 });
  const visibleText = await page.locator('body').innerText();
  for (const forbidden of [
    'SUPABASE_SERVICE_ROLE_KEY',
    'ACCOUNT_DELETION_PROCESS_SECRET',
    'SAFETY_SCAN_SECRET',
    'app_private_config',
    'authorization_phase0.sql',
    'supabase-authorization-baseline.json',
  ]) {
    expect(visibleText).not.toContain(forbidden);
  }
});
