import { expect, test, type Page } from '@playwright/test';

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

type InviteResponseBody = {
  ok?: boolean;
  email?: {
    status?: string;
    error_code?: string | null;
  };
};

function isInviteResponseBody(value: unknown): value is InviteResponseBody {
  return Boolean(value && typeof value === 'object');
}

async function attachPageState(page: Page, name: string, extra: Record<string, unknown> = {}) {
  const alert = page.getByRole('alert');
  await test.info().attach(name, {
    body: JSON.stringify({
      url: page.url(),
      visibleAlert: await alert.textContent().catch(() => null),
      title: await page.title().catch(() => null),
      ...extra,
    }, null, 2),
    contentType: 'application/json',
  });
}

async function signInTeen(page: Page) {
  await page.goto('/login?side=teen');
  await page.getByPlaceholder('Phone number, username or email').fill(liveEmail!);
  await page.getByPlaceholder('Password').fill(livePassword);

  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForLoadState('networkidle', { timeout: 45_000 }).catch(() => null);

  const alert = page.getByRole('alert');
  if (await alert.isVisible().catch(() => false)) {
    await attachPageState(page, 'live-login-failed');
    throw new Error(`Live teen login failed: ${await alert.textContent()}`);
  }

  await expect(page.getByRole('button', { name: /log in/i })).toHaveCount(0, { timeout: 45_000 });
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

    const checkpoint = await confirmationCheckpoint.isVisible().catch(() => false)
      ? 'signup_confirmation_email'
      : 'post_auth_onboarding';

    await attachPageState(page, 'live-onboarding-email', {
      email: liveEmail,
      username: liveUsername,
      phase,
      checkpoint,
      note: checkpoint === 'signup_confirmation_email'
        ? 'Verify this inbox before running LIVE_ONBOARDING_PHASE=invite.'
        : 'The account reached post-auth onboarding; email confirmation may be disabled for this project.',
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
    await attachPageState(page, 'parent-link-create-response', {
      response: latestInvite ?? { error: 'no parent-link-create response captured' },
    });

    expect(latestInvite, 'parent-link-create response should be captured').toBeTruthy();
    expect(latestInvite?.status).toBe(200);
    expect(isInviteResponseBody(latestInvite?.body)).toBe(true);
    expect((latestInvite?.body as InviteResponseBody).ok).toBe(true);
    expect((latestInvite?.body as InviteResponseBody).email?.status).toBe('sent');
    expect((latestInvite?.body as InviteResponseBody).email?.error_code ?? null).toBeNull();
  });
});
