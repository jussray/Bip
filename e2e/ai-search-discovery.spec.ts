import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test('AI search discovery page is crawlable, extractable, and privacy-bounded', async ({ page, request }, testInfo) => {
  const redirects = readFileSync('public/_redirects', 'utf8')
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  expect(redirects.slice(0, 3)).toEqual([
    '/what-is-sekret-bip /what-is-sekret-bip/ 301',
    '/what-is-sekret-bip/index.html /what-is-sekret-bip/ 301',
    '/what-is-sekret-bip/ /what-is-sekret-bip/index.html 200',
  ]);
  expect(redirects.at(-1)).toBe('/* /index.html 200');

  const robotsResponse = await request.get('/robots.txt');
  expect(robotsResponse.ok()).toBe(true);
  const robots = await robotsResponse.text();
  expect(robots).toContain('Disallow: /');
  expect(robots).toContain('Allow: /what-is-sekret-bip/');
  expect(robots).toContain('Sitemap: https://sekretbip.net/sitemap.xml');

  const sitemapResponse = await request.get('/sitemap.xml');
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain('<loc>https://sekretbip.net/what-is-sekret-bip/</loc>');

  await page.goto('/what-is-sekret-bip/', { waitUntil: 'domcontentloaded' });

  await expect(page).toHaveTitle("What is Se'kret Bip? | Private, age-aware family communication");
  await expect(page.getByRole('heading', { level: 1, name: "What is Se'kret Bip?" })).toBeVisible();
  await expect(page.getByText(/Se'kret Bip is a private, age-aware digital space for young people and families/).first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: "What Se'kret Bip is not" })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Privacy and public discovery' })).toBeVisible();

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://sekretbip.net/what-is-sekret-bip/',
  );
  await expect(page.locator('a.home')).toHaveAttribute('href', 'https://sekretbip.net/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /private, age-aware digital space/i,
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index,follow/i);

  const jsonLdText = await page.locator('script[type="application/ld+json"]').textContent();
  expect(jsonLdText).toBeTruthy();
  const jsonLd = JSON.parse(jsonLdText ?? '{}') as {
    '@graph'?: Array<Record<string, unknown>>;
  };
  const graph = jsonLd['@graph'] ?? [];
  expect(graph.some(entity => entity['@type'] === 'SoftwareApplication' && entity.name === "Se'kret Bip")).toBe(true);
  expect(graph.some(entity => entity['@type'] === 'FAQPage')).toBe(true);

  const bodyText = await page.locator('body').innerText();
  for (const forbidden of [
    'SUPABASE_SERVICE_ROLE_KEY',
    'ACCOUNT_DELETION_PROCESS_SECRET',
    'SAFETY_SCAN_SECRET',
    'app_private_config',
  ]) {
    expect(bodyText).not.toContain(forbidden);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const overflow = await page.evaluate(() => (
    document.documentElement.scrollWidth > document.documentElement.clientWidth
  ));
  expect(overflow).toBe(false);

  await testInfo.attach('ai-search-what-is-sekret-bip-mobile.png', {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
});
