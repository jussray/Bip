import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const;

const VARIANTS = [
  {
    name: 'teen',
    url: '/?bipDevAudience=teen',
    heroTestId: 'web-welcome-hero-teen',
    identityText: 'YOUR PEOPLE. YOUR PEACE.',
    enterName: "Se'kret Bip teen welcome — continue to age setup",
  },
  {
    name: 'bip-jr',
    url: '/?bipDevAudience=bip-jr',
    heroTestId: 'web-welcome-hero-bip-jr',
    identityText: 'YOUR FAMILY. YOUR SPACE.',
    enterName: 'Bip Jr family welcome — continue to family setup',
  },
] as const;

for (const variant of VARIANTS) {
  for (const viewport of VIEWPORTS) {
    test(`rollback evidence: ${variant.name} ${viewport.name} front door`, async ({ page }, testInfo) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on('console', message => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', error => pageErrors.push(error.message));

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(variant.url, { waitUntil: 'networkidle' });

      await expect(page.getByTestId('web-welcome-shell')).toBeVisible();
      await expect(page.getByTestId('web-welcome-living-world')).toBeVisible();
      await expect(page.getByTestId(variant.heroTestId)).toBeVisible();
      await expect(page.getByText(variant.identityText, { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: variant.enterName, exact: true })).toBeVisible();
      await expect(page.getByTestId('web-welcome-bottom-nav')).toHaveCount(0);
      await expect(page.getByText('Night · Suhana · Sy', { exact: true })).toHaveCount(0);

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight,
      }));

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
      expect(metrics.scrollHeight).toBeGreaterThanOrEqual(metrics.clientHeight);

      await testInfo.attach(`${variant.name}-${viewport.name}-rollback-front-door.png`, {
        body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
        contentType: 'image/png',
      });

      expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
      expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
    });
  }
}

test('reduced motion is still from the first rendered hero frame', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    const samples: Array<{ top: number; left: number; width: number; height: number }> = [];
    Object.defineProperty(window, '__sekretReducedMotionSamples', {
      configurable: true,
      value: samples,
    });

    const capture = () => {
      const hero = document.querySelector('[data-testid="web-welcome-hero-motion"]');
      if (hero instanceof HTMLElement) {
        const rect = hero.getBoundingClientRect();
        samples.push({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
      window.requestAnimationFrame(capture);
    };

    window.requestAnimationFrame(capture);
  });

  await page.goto('/?bipDevAudience=teen', { waitUntil: 'networkidle' });
  await expect(page.getByTestId('web-welcome-hero-motion')).toBeVisible();
  await page.waitForTimeout(400);

  const samples = await page.evaluate(() => (
    window as typeof window & {
      __sekretReducedMotionSamples?: Array<{
        top: number;
        left: number;
        width: number;
        height: number;
      }>;
    }
  ).__sekretReducedMotionSamples ?? []);

  expect(samples.length).toBeGreaterThan(2);

  for (const key of ['top', 'left', 'width', 'height'] as const) {
    const values = samples.map(sample => sample[key]);
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(0.5);
  }
});

test('Teen entry preserves the teen onboarding path', async ({ page }) => {
  await page.goto('/?bipDevAudience=teen', { waitUntil: 'networkidle' });
  await page.getByTestId('web-welcome-enter').click();
  await expect(page).toHaveURL(/\/welcome(?:\?|$)/);
  await expect(page.getByText('How old are you?')).toBeVisible({ timeout: 15_000 });
});

test('Bip Jr entry preserves the parent onboarding path', async ({ page }) => {
  await page.goto('/?bipDevAudience=bip-jr', { waitUntil: 'networkidle' });
  await page.getByTestId('web-welcome-enter').click();
  await expect(page).toHaveURL(/\/parent-splash(?:\?|$)/);
  await expect(page.getByRole('button', { name: "Se'kret Bip — enter your parent space" })).toBeVisible({ timeout: 15_000 });
});

test('Circle renders Open Bip as the public audience layer with the face rule', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/circle?bipDevSide=teen', { waitUntil: 'networkidle' });

  await expect(page.getByText('🌐 Circle', { exact: true })).toBeVisible();
  await expect(page.getByText('🌎 Open Bip', { exact: true })).toBeVisible();
  await expect(page.getByText('inside Circle · faces stay hidden here', { exact: true })).toBeVisible();
  await expect(page.getByText('Public Circle and public niches. Visible faces are not allowed.', { exact: true })).toBeVisible();

  await testInfo.attach('circle-open-bip-audience.png', {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
});

test('Voice Bip presence holds still when reduced motion is requested', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/voicebip?bipDevSide=teen', { waitUntil: 'networkidle' });

  const avatar = page.getByTestId('voice-presence-avatar');
  const liveAvatar = page.getByTestId('voice-presence-avatar-live');
  await expect(avatar).toBeVisible({ timeout: 15_000 });
  await expect(liveAvatar).toBeVisible({ timeout: 15_000 });

  const readMotion = () => liveAvatar.evaluate(node => {
    const style = getComputedStyle(node);
    return {
      transform: style.transform,
      opacity: Number.parseFloat(style.opacity),
    };
  });

  const first = await readMotion();
  await page.waitForTimeout(500);
  const second = await readMotion();

  expect(second.transform).toBe(first.transform);
  expect(Math.abs(second.opacity - first.opacity)).toBeLessThanOrEqual(0.001);

  await testInfo.attach('voice-bip-reduced-motion.png', {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
});
