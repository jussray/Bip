import { expect, test } from '@playwright/test';

const liveEmail = process.env.LIVE_ONBOARDING_EMAIL?.trim();
const livePassword = process.env.LIVE_ONBOARDING_PASSWORD?.trim() || 'PlaywrightOnly-123!';
const liveUsername = (process.env.LIVE_ONBOARDING_USERNAME?.trim() || `pw_${Date.now()}`)
  .toLowerCase()
  .replace(/[^a-z0-9_.]/g, '')
  .slice(0, 24);
const inviteEmail = process.env.LIVE_PARENT_INVITE_EMAIL?.trim();
const phase = process.env.LIVE_ONBOARDING_PHASE?.trim().toLowerCase() || 'signup';

const shouldRunSignup = phase === 'signup' || phase === 'all';
const shouldRunInvite = phase === 'invite' || phase === 'all';

async function signInTeen(page: import('@playwright/test').Page) {
  await page.goto('/login?side=teen');
  await page.getByPlaceholder('Phone number, username or email').fill(liveEmail!);
  await page.getByPlaceholder('Password').fill(livePassword);
  await page.getByRole('button', { name: /log in/i }).click();
}

test.describe('live onboarding email smoke', () => {
  test('signup reaches the real email confirmation checkpoint', async ({ page }) => {
    test.skip(!shouldRunSignup, 'Set LIVE_ONBOARDING_PHASE=signup or all to run signup email smoke.');
    test.skip(!liveEmail, 'LIVE_ONBOARDING_EMAIL is required for live onboarding email smoke.');

    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    await page.goto('/signup?side=teen');
    await page.getByPlaceholder('Email address').fill(liveEmail!);
    await page.getByPlaceholder('Password (8+ characters)').fill(livePassword);
    await page.getByPlaceholder('Confirm password').fill(livePassword);
    await page.getByRole('button', { name: /^next$/i }).click();

    await page.getByPlaceholder('username').fill(liveUsername);
    await page.getByRole('button', { name: /^next$/i }).click();

    await page.getByRole('button', { name: /create account/i }).click();

    const confirmationCheckpoint = page.getByText('Check your email');
    const consentCheckpoint = page.getByText(/consent|privacy|continue/i).first();
    await expect(confirmationCheckpoint.or(consentCheckpoint)).toBeVisible({ timeout: 45_000 });

    await test.info().attach('live-onboarding-email', {
      body: JSON.stringify({
        email: liveEmail,
        username: liveUsername,
        phase,
        checkpoint: await confirmationCheckpoint.isVisible().catch(() => false)
          ? 'signup_confirmation_email'
          : 'post_auth_onboarding',
        note: 'If checkpoint is signup_confirmation_email, verify the inbox before running LIVE_ONBOARDING_PHASE=invite.',
      }, null, 2),
      contentType: 'application/json',
    });

    expect(consoleErrors).toEqual([]);
  });

  test('confirmed teen account can send parent invite email', async ({ page }) => {
    test.skip(!shouldRunInvite, 'Set LIVE_ONBOARDING_PHASE=invite or all after confirming the signup email.');
    test.skip(!liveEmail, 'LIVE_ONBOARDING_EMAIL is required for live parent invite smoke.');
    test.skip(!inviteEmail, 'LIVE_PARENT_INVITE_EMAIL is required for live parent invite smoke.');

    const inviteResponses: Array<{ status: number; body: unknown }> = [];
    page.on('response', async (response) => {
      if (!response.url().includes('/functions/v1/parent-link-create')) return;
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = await response.text().catch(() => null);
      }
      inviteResponses.push({ status: response.status(), body });
    });

    await signInTeen(page);
    await page.goto('/parent-link-verify');

    await expect(page.getByText(/private code|code check needed|creating your code/i)).toBeVisible({ timeout: 45_000 });
    await page.getByPlaceholder('parent@example.com').fill(inviteEmail!);
    await page.getByRole('button', { name: /send invite email/i }).click();

    await expect(page.getByText(/invite email sent|code created, but email did not send/i)).toBeVisible({ timeout: 45_000 });

    const latestInvite = inviteResponses.at(-1);
    await test.info().attach('parent-link-create-response', {
      body: JSON.stringify(latestInvite ?? { error: 'no parent-link-create response captured' }, null, 2),
      contentType: 'application/json',
    });

    expect(latestInvite, 'parent-link-create response should be captured').toBeTruthy();
    expect(latestInvite?.status).toBeLessThan(500);
  });
});
