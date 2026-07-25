import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const;

const VARIANTS = [
  {
    name: 'teen',
    url: '/?bipDevSide=teen',
    heroTestId: 'web-welcome-hero-teen',
    eyebrow: 'YOUR PEOPLE. YOUR PEACE.',
  },
  {
    name: 'bip-jr',
    url: '/?bipDevSide=parent',
    heroTestId: 'web-welcome-hero-bip-jr',
    eyebrow: 'YOUR FAMILY. YOUR SPACE.',
  },
] as const;

for (const variant of VARIANTS) {
  for (const viewport of VIEWPORTS) {
    test(`Product Design evidence: ${variant.name} ${viewport.name} front door`, async ({ page }, testInfo) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', error => pageErrors.push(error.message));

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(variant.url, { waitUntil: 'networkidle' });

      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('body')).not.toHaveText(/^\s*$/);
      await expect(page.getByTestId(variant.heroTestId)).toBeVisible();
      await expect(page.getByTestId('web-welcome-eyebrow')).toHaveText(variant.eyebrow);

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      expect(metrics.scrollHeight).toBeGreaterThanOrEqual(metrics.clientHeight);

      const enterButton = page.getByTestId('web-welcome-enter');
      const bottomNav = page.getByTestId('web-welcome-bottom-nav');
      await expect(enterButton).toBeVisible();
      await expect(bottomNav).toBeVisible();

      const enterBox = await enterButton.boundingBox();
      const navBox = await bottomNav.boundingBox();
      expect(enterBox).not.toBeNull();
      expect(navBox).not.toBeNull();
      expect(enterBox!.y + enterBox!.height).toBeLessThanOrEqual(navBox!.y - 8);

      const screenshot = await page.screenshot({
        fullPage: true,
        animations: 'disabled',
      });
      await testInfo.attach(`${variant.name}-${viewport.name}-front-door.png`, {
        body: screenshot,
        contentType: 'image/png',
      });

      expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
      expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
    });
  }
}

test('Teen Enter keeps the teen onboarding path', async ({ page }) => {
  await page.goto('/?bipDevSide=teen', { waitUntil: 'networkidle' });
  await page.getByTestId('web-welcome-enter').click();
  await expect(page).toHaveURL(/\/welcome(?:\?|$)/);
  await expect(page.getByText('How old are you?')).toBeVisible({ timeout: 15_000 });
});

test('Bip Jr Enter keeps the parent onboarding path', async ({ page }) => {
  await page.goto('/?bipDevSide=parent', { waitUntil: 'networkidle' });
  await page.getByTestId('web-welcome-enter').click();
  await expect(page).toHaveURL(/\/parent-splash(?:\?|$)/);
  await expect(page.getByRole('button', { name: "Se'kret Bip — enter your parent space" })).toBeVisible({ timeout: 15_000 });
});
