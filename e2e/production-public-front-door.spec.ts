import { expect, test } from '@playwright/test';

function isCloudflareAccessUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    return (
      hostname === 'cloudflareaccess.com' ||
      hostname.endsWith('.cloudflareaccess.com') ||
      url.pathname.toLowerCase().startsWith('/cdn-cgi/access/')
    );
  } catch {
    return false;
  }
}

async function assertPublicFrontDoor(page, target: string) {
  const documentNavigations: string[] = [];

  page.on('request', (request) => {
    if (request.resourceType() === 'document' && request.frame() === page.mainFrame()) {
      documentNavigations.push(request.url());
    }
  });

  const response = await page.goto(target, { waitUntil: 'domcontentloaded' });
  expect(response, 'public front door must return a browser response').not.toBeNull();
  expect(response!.status(), 'public front door must not fail at transport').toBeLessThan(400);

  await expect(page.getByTestId('web-welcome-enter')).toBeVisible({ timeout: 30_000 });

  const finalUrl = new URL(page.url());
  expect(['sekretbip.net', 'app.sekretbip.net']).toContain(finalUrl.hostname);
  expect(isCloudflareAccessUrl(finalUrl.toString())).toBe(false);

  const accessNavigations = documentNavigations.filter(isCloudflareAccessUrl);
  expect(
    accessNavigations,
    `anonymous customer navigation must never enter Cloudflare Access; observed: ${documentNavigations.join(' -> ')}`,
  ).toEqual([]);
}

test('anonymous app front door reaches Se’kret Bip without Cloudflare Access', async ({ page }, testInfo) => {
  await assertPublicFrontDoor(page, '/');

  const finalUrl = new URL(page.url());
  expect(finalUrl.hostname).toBe('app.sekretbip.net');

  await testInfo.attach('production-anonymous-app-front-door.png', {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
});

test('anonymous apex front door reaches Se’kret Bip without Cloudflare Access', async ({ page }, testInfo) => {
  await assertPublicFrontDoor(page, 'https://sekretbip.net/');

  await testInfo.attach('production-anonymous-apex-front-door.png', {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
});
