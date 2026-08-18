import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const EVIDENCE_DIR = path.resolve(
  process.env.PLAYWRIGHT_ARTIFACT_DIR ?? 'artifacts/product-design-playwright',
  'room-canonical-display',
);

async function saveEvidence(page: Page, name: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, `${name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
}

test('Teen Room keeps canonical identity while the companion leads the composition', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/room?bipDevSide=teen', { waitUntil: 'domcontentloaded' });

  const sanctuary = page.getByTestId('living-sanctuary-layer');
  const companionVisual = page.getByTestId('living-sanctuary-companion-visual');
  const companionButton = page.getByRole('button', {
    name: 'Suhana is here. Tap to talk.',
    exact: true,
  });

  await expect(sanctuary).toBeVisible({ timeout: 15_000 });
  await expect(companionVisual).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Suhana's Room/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Suhana is nearby.', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(companionButton).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Raylene's Room/)).toHaveCount(0);
  await expect(page.getByText('Raylene is nearby.', { exact: true })).toHaveCount(0);
  await expect(page.getByText('YOUR SANCTUARY', { exact: true })).toHaveCount(0);
  await expect(page.getByText('✦ yours to explore', { exact: true })).toHaveCount(0);
  await expect(sanctuary).toHaveCSS('pointer-events', 'none');

  const [visualBox, tapBox] = await Promise.all([
    companionVisual.boundingBox(),
    companionButton.boundingBox(),
  ]);
  expect(visualBox).not.toBeNull();
  expect(tapBox).not.toBeNull();
  expect(visualBox!.width).toBeGreaterThan(250);
  expect(visualBox!.height).toBeGreaterThan(400);
  expect(visualBox!.width).toBeGreaterThan(tapBox!.width);
  expect(visualBox!.height).toBeGreaterThan(tapBox!.height);

  await saveEvidence(page, '01-room-living-sanctuary-v2');

  await page.getByRole('button', { name: 'Customize your room in VibeLab', exact: true }).click();
  await expect(page.getByText('your room ✦', { exact: true })).toBeVisible();
  await expect(page.getByText("Suhana's Room", { exact: true })).toBeVisible();
  await expect(page.getByText("Sy's Room", { exact: true })).toBeVisible();
  await expect(page.getByText(/Raylene's Room/)).toHaveCount(0);
  await expect(page.getByText(/Rylane's Room/)).toHaveCount(0);

  await saveEvidence(page, '02-vibelab-room-picker-canonical-display');

  await page.getByText('💫', { exact: true }).click();
  await expect(page.getByText('Suhana', { exact: true })).toBeVisible();
  await expect(page.getByText('Sy', { exact: true })).toBeVisible();
  await expect(page.getByText('Cloud', { exact: true })).toBeVisible();
  await expect(page.getByText('Night', { exact: true })).toBeVisible();
  await expect(page.getByText('raylene', { exact: true })).toHaveCount(0);
  await expect(page.getByText('rylane', { exact: true })).toHaveCount(0);

  await saveEvidence(page, '03-vibelab-companion-picker-canonical-display');
});

test('Living Sanctuary v2 stays physically still under reduced motion', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  try {
    await page.goto('/room?bipDevSide=teen', { waitUntil: 'domcontentloaded' });
    const sanctuary = page.getByTestId('living-sanctuary-layer');
    const companionVisual = page.getByTestId('living-sanctuary-companion-visual');

    await expect(sanctuary).toBeVisible({ timeout: 15_000 });
    await expect(companionVisual).toBeVisible({ timeout: 15_000 });

    const before = await companionVisual.evaluate(element => {
      const style = window.getComputedStyle(element);
      return `${style.transform}|${style.opacity}|${style.left}|${style.bottom}`;
    });

    await page.waitForTimeout(700);

    const after = await companionVisual.evaluate(element => {
      const style = window.getComputedStyle(element);
      return `${style.transform}|${style.opacity}|${style.left}|${style.bottom}`;
    });

    expect(after).toBe(before);
    await saveEvidence(page, '04-room-living-sanctuary-v2-reduced-motion');
  } finally {
    await context.close();
  }
});
