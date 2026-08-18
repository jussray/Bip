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

test('Teen Room and VibeLab expose canonical companion display names', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/room?bipDevSide=teen', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText(/Suhana's Room/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Suhana is nearby.', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole('button', { name: 'Suhana is here. Tap to talk.', exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/Raylene's Room/)).toHaveCount(0);
  await expect(page.getByText('Raylene is nearby.', { exact: true })).toHaveCount(0);

  await saveEvidence(page, '01-room-canonical-display');

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
