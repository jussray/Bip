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
    identityText: 'YOUR PEOPLE. YOUR PEACE.',
    enter: { kind: 'testId', value: 'web-welcome-enter' },
  },
  {
    name: 'bip-jr',
    url: '/?bipDevSide=parent',
    heroTestId: 'web-welcome-hero-bip-jr',
    identityText: 'THE SOFTER ORIGINAL',
    enter: { kind: 'role', value: 'Enter Bip Jr' },
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
      await expect(page.getByText(variant.identityText, { exact: true })).toBeVisible();

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      expect(metrics.scrollHeight).toBeGreaterThanOrEqual(metrics.clientHeight);

      const enterButton = variant.enter.kind === 'testId'
        ? page.getByTestId(variant.enter.value)
        : page.getByRole('button', { name: variant.enter.value, exact: true });
      const bottomNav = page.getByTestId('web-welcome-bottom-nav');
      await enterButton.scrollIntoViewIfNeeded();
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

test('Teen Enter keeps the teen onboarding path after role choice', async ({ page }) => {
  await page.goto('/?bipDevSide=teen', { waitUntil: 'networkidle' });
  await page.getByTestId('web-welcome-enter').click();
  await expect(page.getByTestId('web-welcome-enter-teen')).toBeVisible();
  await expect(page.getByTestId('web-welcome-enter-parent')).toBeVisible();
  await page.getByTestId('web-welcome-enter-teen').click();
  await expect(page).toHaveURL(/\/welcome(?:\?|$)/);
  await expect(page.getByText('How old are you?')).toBeVisible({ timeout: 15_000 });
});

test('Parent role choice keeps the parent onboarding path', async ({ page }) => {
  await page.goto('/?bipDevSide=teen', { waitUntil: 'networkidle' });
  await page.getByTestId('web-welcome-enter').click();
  await page.getByTestId('web-welcome-enter-parent').click();
  await expect(page).toHaveURL(/\/parent-splash(?:\?|$)/);
  await expect(page.getByRole('button', { name: "Se'kret Bip — enter your parent space" })).toBeVisible({ timeout: 15_000 });
});

test('Bip Jr Enter keeps the parent onboarding path', async ({ page }) => {
  await page.goto('/?bipDevSide=parent', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Enter Bip Jr', exact: true }).click();
  await expect(page).toHaveURL(/\/parent-splash(?:\?|$)/);
  await expect(page.getByRole('button', { name: "Se'kret Bip — enter your parent space" })).toBeVisible({ timeout: 15_000 });
});
