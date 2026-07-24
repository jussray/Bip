import { expect, test } from '@playwright/test';

test('teen splash leads into age-bucket onboarding', async ({ page }) => {
  await page.goto('/');

  const splashButton = page.getByRole('button', {
    name: "Se'kret Bip — enter your safe space",
  });

  await expect(splashButton).toBeVisible({ timeout: 30_000 });
  await splashButton.click();

  await expect(page.getByText('How old are you?')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /13\s*[–-]\s*15 Teen mode starts/i })).toBeVisible();
});

test('web welcome front door exposes only working actions and approved identity', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('web-welcome-shell')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('web-welcome-hero')).toBeVisible();
  await expect(page.getByText('Come on in.')).toBeVisible();
  await expect(page.getByText('Night')).toBeVisible();
  await expect(page.getByText('Suhana')).toBeVisible();
  await expect(page.getByText('Sy')).toBeVisible();

  // The main CTA and the center Enter control are the only interactive
  // actions on this public welcome surface. Decorative nav items must not
  // pretend to be working buttons.
  await expect(page.getByRole('button')).toHaveCount(2);
  await page.screenshot({ path: 'test-results/front-door-desktop.png', fullPage: true });
});

test('web welcome Enter supports keyboard activation', async ({ page }) => {
  await page.goto('/');

  const splashButton = page.getByRole('button', {
    name: "Se'kret Bip — enter your safe space",
  });

  await expect(splashButton).toBeVisible({ timeout: 30_000 });
  await splashButton.focus();
  await page.keyboard.press('Enter');

  await expect(page.getByText('How old are you?')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: /13\s*[–-]\s*15 Teen mode starts/i })).toBeVisible();
});

test('login deep link renders current controls and survives refresh', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByText('sign in to continue')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();

  await page.reload();

  await expect(page.getByText('sign in to continue')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
});

test('teen signup deep link enforces age assurance before account fields', async ({ page }) => {
  await page.goto('/signup');

  await expect(page.getByText('How old are you?')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Suhana')).toBeVisible();
  await expect(page.getByText('Sy')).toBeVisible();
  await expect(page.getByRole('button', { name: /13\s*[–-]\s*15 Teen mode starts/i })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email' })).not.toBeVisible();
});

test('parent signup deep link exposes account creation controls', async ({ page }) => {
  await page.goto('/signup?side=parent');

  await expect(page.getByText('create your Parent Space')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Confirm password', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
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
  await page.screenshot({ path: 'test-results/front-door-390x844.png' });
});

test('frontend entry remains contained on a short narrow phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');

  await expect(page.getByTestId('web-welcome-shell')).toBeVisible({ timeout: 30_000 });

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(hasHorizontalOverflow).toBe(false);

  const shellBox = await page.getByTestId('web-welcome-shell').boundingBox();
  expect(shellBox).not.toBeNull();
  expect(shellBox!.x).toBeGreaterThanOrEqual(0);
  expect(shellBox!.x + shellBox!.width).toBeLessThanOrEqual(320);
  await page.screenshot({ path: 'test-results/front-door-320x568.png' });
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
  await expect(page.getByText('Guardian verification required.')).toBeVisible();
  await expect(page.getByText(/Linking to a teen is a separate consent step/)).toBeVisible();
  await expect(page.getByText(/No journal, voice note, or private source is shared automatically/)).toBeVisible();
  await expect(page.getByText('Submit for guardian review')).toBeVisible();
});

test('authorization evidence and retired internals stay out of the public web surface', async ({ page }) => {
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
  expect(visibleText).not.toContain('release-health');
  expect(visibleText).not.toContain('bridge-e2e-probe');
  expect(visibleText).not.toContain('github-workflow-status');
  expect(visibleText).not.toContain('retirement-manifest.json');
  expect(visibleText).not.toContain('function_retired');
  expect(visibleText).not.toContain('harden_founder_helper_anonymous_guard');
  expect(visibleText).not.toContain('harden_audit_control_room_policies');
  expect(visibleText).not.toContain('remove_anon_audit_control_room_grants');
  expect(visibleText).not.toContain('authorization_founder_guardian_phase1.sql');
});
