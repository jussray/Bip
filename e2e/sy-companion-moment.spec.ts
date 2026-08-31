import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const EVIDENCE_DIR = path.resolve(
  process.env.PLAYWRIGHT_ARTIFACT_DIR ?? 'artifacts/product-design-playwright',
  'sy-companion-moment',
);

async function saveEvidence(page: Page, name: string) {
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({
    path: path.join(EVIDENCE_DIR, `${name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
}

async function openSyMoment(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/companion-moment?bipDevSide=teen', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Let Sy help you name the moment.', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Rylane', { exact: true })).toHaveCount(0);
}

test('Sy moment screen exposes the approved five-choice native interaction', async ({ page }) => {
  await openSyMoment(page);

  const choices = [
    ['sort', 'Sorting it out', 'Talk with Sy'],
    ['write', 'I need to write', 'Start a private page'],
    ['company', 'I need company', 'Sit with Sy'],
    ['good', 'A good moment', 'Save this moment'],
    ['night', 'A late-night thought', 'Bring this to Night'],
  ] as const;

  for (const [id, label, action] of choices) {
    const radio = page.getByTestId(`sy-moment-choice-${id}`);
    await radio.click();
    await expect(radio).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByRole('button', { name: action, exact: true })).toBeVisible();
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }

  await saveEvidence(page, '01-five-approved-moments');
});

for (const scenario of [
  { id: 'sort', action: 'Talk with Sy', expected: 'sy-chat' },
  { id: 'company', action: 'Sit with Sy', expected: 'sy-chat' },
  { id: 'write', action: 'Start a private page', expected: 'pages' },
  { id: 'good', action: 'Save this moment', expected: 'pages' },
  { id: 'night', action: 'Bring this to Night', expected: 'night-chat' },
] as const) {
  test(`${scenario.id} delegates to its existing protected destination`, async ({ page }) => {
    await openSyMoment(page);
    await page.getByTestId(`sy-moment-choice-${scenario.id}`).click();
    await page.getByRole('button', { name: scenario.action, exact: true }).click();

    if (scenario.expected === 'pages') {
      await expect(page).toHaveURL(/\/pages(?:[/?]|$)/, { timeout: 15_000 });
      await expect(page.getByRole('textbox').first()).toBeVisible({ timeout: 15_000 });
    } else {
      await expect(page).toHaveURL(/\/companion-chat(?:[/?]|$)/, { timeout: 15_000 });
      const expectedName = scenario.expected === 'sy-chat' ? 'Sy' : 'Night';
      await expect(page.getByText(expectedName, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('Rylane', { exact: true })).toHaveCount(0);
      if (scenario.expected === 'sy-chat') {
        await expect(page).toHaveURL(/companion=rylane/);
      }
    }

    await saveEvidence(page, `02-${scenario.id}-destination`);
  });
}
