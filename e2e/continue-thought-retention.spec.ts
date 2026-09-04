import { expect, test, type Page, type TestInfo } from '@playwright/test';

const ENTRY_ID = 424242;
const PRIVATE_TEXT = 'I want to remember this exact thought without showing it in Room.';
const CONTINUATION_KEY = 'sekretbip_saved_continuation_v1';

async function seedTeenEntry(page: Page) {
  await page.addInitScript(({ entryId, privateText, continuationKey }) => {
    window.localStorage.setItem('userSide', 'teen');
    window.localStorage.setItem('selectedSekret', 'raylene');
    window.localStorage.setItem('entries', JSON.stringify([
      {
        id: entryId,
        text: privateText,
        mood: 'okay',
        moodTag: 'okay',
        date: '9/4/2026',
        time: '4:50 PM',
        source: 'suhana',
        activeTab: 'suhana',
        entryMode: 'typed',
        locked: true,
      },
    ]));
    window.localStorage.removeItem(continuationKey);
  }, {
    entryId: ENTRY_ID,
    privateText: PRIVATE_TEXT,
    continuationKey: CONTINUATION_KEY,
  });
}

test('Continue the Thought saves metadata only, resumes the exact Page, and consumes the bookmark', async ({ page }, testInfo: TestInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedTeenEntry(page);

  await page.goto(`/pages/${ENTRY_ID}?bipDevSide=teen`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(PRIVATE_TEXT, { exact: true })).toBeVisible({ timeout: 15_000 });

  const saveForLater = page.getByRole('button', {
    name: 'Save this page so you can continue it later',
    exact: true,
  });
  await expect(saveForLater).toBeVisible();
  await saveForLater.click();
  await expect(page.getByText('✓ saved for later', { exact: true })).toBeVisible();

  const stored = await page.evaluate(key => window.localStorage.getItem(key), CONTINUATION_KEY);
  expect(stored).not.toBeNull();
  expect(stored).not.toContain(PRIVATE_TEXT);
  expect(JSON.parse(stored!)).toMatchObject({
    version: 1,
    entryId: String(ENTRY_ID),
    companionKey: 'suhana',
  });

  await page.goto('/room?bipDevSide=teen', { waitUntil: 'domcontentloaded' });

  const returnButton = page.getByRole('button', {
    name: 'Open your Bip return receipt and choose what you need',
    exact: true,
  });
  await expect(returnButton).toBeVisible({ timeout: 15_000 });
  await expect(returnButton).toContainText('continue your thought');
  await returnButton.click();

  await expect(page.getByText('Continue where you left off.', { exact: true })).toBeVisible();
  await expect(page.getByText(PRIVATE_TEXT, { exact: true })).toHaveCount(0);
  await expect(page.getByText('Room remembers which page you chose, not a preview of what you wrote.', { exact: true })).toBeVisible();

  await testInfo.attach('continue-thought-room-mobile.png', {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });

  await page.getByRole('button', { name: 'Continue the saved page', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/pages/${ENTRY_ID}`));
  await expect(page.getByText(PRIVATE_TEXT, { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect.poll(() => page.evaluate(key => window.localStorage.getItem(key), CONTINUATION_KEY)).toBeNull();

  await testInfo.attach('continue-thought-resumed-page-mobile.png', {
    body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
    contentType: 'image/png',
  });
});
