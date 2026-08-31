import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const;

const ARTIFACT_DIR = path.resolve(
  process.env.PLAYWRIGHT_ARTIFACT_DIR ?? 'artifacts/product-design-playwright',
  'cinematic-dossier',
);

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(Math.max(metrics.html, metrics.body)).toBeLessThanOrEqual(metrics.viewport + 1);
}

async function expectDossierImagesDecoded(page: Page) {
  const images = page.locator('img');
  await expect.poll(async () => images.count()).toBeGreaterThanOrEqual(15);

  await expect
    .poll(async () =>
      images.evaluateAll(nodes =>
        nodes.map(node => ({
          src: node.currentSrc || node.src,
          complete: node.complete,
          width: node.naturalWidth,
          height: node.naturalHeight,
        })),
      ),
    )
    .toEqual(
      expect.arrayContaining([
        expect.objectContaining({ complete: true }),
      ]),
    );

  const unloaded = await images.evaluateAll(nodes =>
    nodes
      .filter(node => !node.complete || node.naturalWidth <= 0 || node.naturalHeight <= 0)
      .map(node => ({ src: node.currentSrc || node.src, complete: node.complete })),
  );
  expect(unloaded, `Unloaded dossier images: ${JSON.stringify(unloaded)}`).toEqual([]);
}

for (const viewport of VIEWPORTS) {
  test(`cinematic evidence dossier renders on ${viewport.name}`, async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', error => pageErrors.push(error.message));

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/cinematic-dossier', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('cinematic-dossier-screen')).toBeVisible();
    await expect(page.getByTestId('cinematic-evidence-board')).toBeVisible();
    await expect(page.getByTestId('cinematic-dossier-hero')).toBeVisible();
    await expect(page.getByTestId('cinematic-shot-01')).toBeVisible();
    await expect(page.getByTestId('cinematic-shot-07')).toBeVisible();
    await expect(page.getByTestId('cinematic-module-1')).toBeVisible();
    await expect(page.getByTestId('cinematic-module-2')).toBeVisible();
    await expect(page.getByTestId('cinematic-module-3')).toBeVisible();
    await expect(page.getByTestId('cinematic-truth-strip')).toBeVisible();
    await expect(page.getByText('CURRENT STATE', { exact: true })).toBeVisible();
    await expect(page.getByText('PROOF', { exact: true })).toBeVisible();
    await expect(page.getByText('NEXT GATE', { exact: true })).toBeVisible();
    await expectDossierImagesDecoded(page);
    await expectNoHorizontalOverflow(page);

    await fs.mkdir(ARTIFACT_DIR, { recursive: true });
    const screenshot = await page.screenshot({ fullPage: true, animations: 'disabled' });
    const filename = `cinematic-dossier-${viewport.name}.png`;
    await fs.writeFile(path.join(ARTIFACT_DIR, filename), screenshot);
    await testInfo.attach(filename, { body: screenshot, contentType: 'image/png' });

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(consoleErrors, `Console errors: ${consoleErrors.join('\n')}`).toEqual([]);
  });
}

test('cinematic dossier keeps one grammar while the companion changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/cinematic-dossier', { waitUntil: 'networkidle' });

  await expect(page.getByText('NIGHT', { exact: true })).toBeVisible();
  await page.getByTestId('cinematic-dossier-select-cloud').click();
  await expect(page.getByText('CLOUD', { exact: true })).toBeVisible();
  await expect(page.getByTestId('cinematic-shot-07')).toBeVisible();
  await expect(page.getByTestId('cinematic-truth-strip')).toContainText('PLAYWRIGHT DESKTOP + MOBILE');
});
