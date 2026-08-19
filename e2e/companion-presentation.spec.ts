import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const ARTIFACT_DIR = path.resolve(
  process.env.PLAYWRIGHT_ARTIFACT_DIR ?? 'artifacts/product-design-playwright',
  'companion-presentation',
);

test('My own way mixes visual variants without renaming companions', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/identity', { waitUntil: 'networkidle' });

  await expect(page.getByText('Make this space feel like you.', { exact: true })).toBeVisible();
  await page.getByTestId('identity-other').click();

  const mixer = page.getByTestId('companion-presentation-mixer');
  await expect(mixer).toBeVisible();

  for (const name of ['Suhana', 'Sy', 'Night', 'Cloud']) {
    await expect(mixer.getByText(name, { exact: true })).toBeVisible();
  }

  await expect(page.getByText('Raylene', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Rylane', { exact: true })).toHaveCount(0);

  await page.getByTestId('companion-presentation-suhana-boy').click();
  await page.getByTestId('companion-presentation-sy-girl').click();
  await page.getByTestId('companion-presentation-night-boy').click();
  await page.getByTestId('companion-presentation-cloud-girl').click();

  await expect(page.getByTestId('companion-presentation-suhana-boy')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('companion-presentation-sy-girl')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('companion-presentation-night-boy')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('companion-presentation-cloud-girl')).toHaveAttribute('aria-selected', 'true');

  await fs.mkdir(ARTIFACT_DIR, { recursive: true });
  const body = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await fs.writeFile(path.join(ARTIFACT_DIR, '01-my-own-way-mixed-crew.png'), body);
  await testInfo.attach('my-own-way-mixed-crew.png', {
    body,
    contentType: 'image/png',
  });
});
