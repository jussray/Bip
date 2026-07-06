import { test, expect } from '@playwright/test';

test('teen splash leads into onboarding welcome', async ({ page }) => {
  await page.goto('/');

  const splashButton = page.getByRole('button', { name: "Se'kret Bip — enter your safe space" });
  await expect(splashButton).toBeVisible({ timeout: 30_000 });
  await splashButton.click();

  await expect(page.getByText("I'm ready")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('For ages 13 and up')).toBeVisible();
});
