import { expect, test } from '@playwright/test';

async function heroBox(page: import('@playwright/test').Page) {
  const box = await page.getByTestId('web-welcome-hero-motion').boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

test('teen welcome settles the canonical family artwork and leaves it still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?bipDevAudience=teen', { waitUntil: 'domcontentloaded' });

  await expect(page.getByTestId('web-welcome-hero-teen')).toBeVisible();
  await expect(page.getByTestId('web-welcome-enter')).toBeVisible();
  await expect(page.getByText('Night · Suhana · Sy', { exact: true })).toHaveCount(0);

  await expect(page.getByTestId('web-welcome-motion-settled')).toHaveCount(1, {
    timeout: 5_000,
  });

  const first = await heroBox(page);
  await page.waitForTimeout(300);
  const second = await heroBox(page);

  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(first[key] - second[key])).toBeLessThanOrEqual(0.5);
  }
});

test('reduced motion renders the canonical hero settled immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?bipDevAudience=teen', { waitUntil: 'domcontentloaded' });

  await expect(page.getByTestId('web-welcome-hero-teen')).toBeVisible();
  await expect(page.getByTestId('web-welcome-motion-settled')).toHaveCount(1);

  const first = await heroBox(page);
  await page.waitForTimeout(300);
  const second = await heroBox(page);

  for (const key of ['x', 'y', 'width', 'height'] as const) {
    expect(Math.abs(first[key] - second[key])).toBeLessThanOrEqual(0.5);
  }
});
