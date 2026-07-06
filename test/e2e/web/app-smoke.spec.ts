import { expect, test, type Page } from '@playwright/test';

async function expectHealthyPage(page: Page) {
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Application error');
  await expect(page.locator('body')).not.toContainText('Unhandled Runtime Error');
  await expect(page.locator('body')).not.toContainText('Module not found');
}

test.describe("Se'kret Bip web smoke", () => {
  test('root app shell renders', async ({ page }) => {
    await page.goto('/');
    await expectHealthyPage(page);
  });

  test('login route renders', async ({ page }) => {
    await page.goto('/login');
    await expectHealthyPage(page);
  });

  test('parent linking route renders', async ({ page }) => {
    await page.goto('/parent-link');
    await expectHealthyPage(page);
  });
});
