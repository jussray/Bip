import fs from 'node:fs';
import { expect, test } from '@playwright/test';

const productionEnv = fs.readFileSync('.env.production', 'utf8');

function productionEnvValue(name: string): string {
  const match = productionEnv.match(new RegExp(`^${name}=(.+)$`, 'm'));
  if (!match?.[1]?.trim()) {
    throw new Error(`Missing ${name} in .env.production`);
  }
  return match[1].trim();
}

const PRODUCTION_SUPABASE_URL = productionEnvValue('EXPO_PUBLIC_SUPABASE_URL');
const PRODUCTION_SUPABASE_KEY = productionEnvValue('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

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

test('production browser can reach Supabase Auth without creating an account', async ({ page }) => {
  await page.goto('/signup');

  const probe = await page.evaluate(
    async ({ supabaseUrl, supabaseKey }) => {
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
          method: 'GET',
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        return {
          status: response.status,
          error: null,
        };
      } catch (error) {
        return {
          status: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    {
      supabaseUrl: PRODUCTION_SUPABASE_URL,
      supabaseKey: PRODUCTION_SUPABASE_KEY,
    },
  );

  expect(probe.error).toBeNull();
  expect(probe.status).toBe(200);
});

test('signup contains auth transport failures without exposing raw fetch text', async ({ page }) => {
  await page.route('**/auth/v1/signup', route => route.abort('failed'));
  await page.goto('/signup');

  await page.getByPlaceholder('email').fill('playwright-network-probe@example.invalid');
  await page.getByPlaceholder('password (8+ characters)').fill('BipPlaywright!2026');
  await page.getByPlaceholder('confirm password').fill('BipPlaywright!2026');
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(
    page.getByText('Could not reach the account server. Check your connection, then try again.'),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/^Failed to fetch$/i)).not.toBeVisible();
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
