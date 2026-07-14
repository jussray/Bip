import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PASSWORD_RECOVERY_PATH,
  buildRecoveryRedirectUrl,
  isRecoveryCredential,
  normalizeRecoveryEmail,
  parseRecoveryUrl,
  validateNewPassword,
  validateRecoveryEmail,
} from '../src/features/auth/passwordRecovery.ts';

test('normalizes and validates recovery emails without changing account semantics', () => {
  assert.equal(normalizeRecoveryEmail('  Teen@Example.COM  '), 'teen@example.com');
  assert.equal(validateRecoveryEmail(''), 'Enter the email connected to your Bip account.');
  assert.equal(validateRecoveryEmail('not-an-email'), 'Enter a valid email address.');
  assert.equal(validateRecoveryEmail('teen@example.com'), null);
});

test('builds explicit web and native recovery redirects', () => {
  assert.equal(PASSWORD_RECOVERY_PATH, '/reset-password');
  assert.equal(
    buildRecoveryRedirectUrl({ webOrigin: 'https://sekretbip.net' }),
    'https://sekretbip.net/reset-password',
  );
  assert.equal(
    buildRecoveryRedirectUrl({ nativeUrl: 'sekret://reset-password' }),
    'sekret://reset-password',
  );
  assert.throws(() => buildRecoveryRedirectUrl({}), /web origin or native recovery URL/i);
});

test('parses implicit recovery tokens from URL fragments and query strings', () => {
  const fragment = parseRecoveryUrl(
    'https://sekretbip.net/reset-password#access_token=access-1&refresh_token=refresh-1&type=recovery',
  );
  assert.deepEqual(fragment, {
    kind: 'tokens',
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    type: 'recovery',
  });
  assert.equal(isRecoveryCredential(fragment), true);

  const query = parseRecoveryUrl(
    'sekret://reset-password?access_token=access-2&refresh_token=refresh-2&type=recovery',
  );
  assert.deepEqual(query, {
    kind: 'tokens',
    accessToken: 'access-2',
    refreshToken: 'refresh-2',
    type: 'recovery',
  });
  assert.equal(isRecoveryCredential(query), true);
});

test('supports PKCE recovery codes but rejects non-recovery credentials', () => {
  const recoveryCode = parseRecoveryUrl(
    'https://sekretbip.net/reset-password?code=pkce-code&type=recovery',
  );
  assert.deepEqual(recoveryCode, {
    kind: 'code',
    code: 'pkce-code',
    type: 'recovery',
  });
  assert.equal(isRecoveryCredential(recoveryCode), true);

  const ordinarySession = parseRecoveryUrl(
    'https://sekretbip.net/reset-password#access_token=access&refresh_token=refresh&type=signup',
  );
  assert.equal(ordinarySession.kind, 'tokens');
  assert.equal(isRecoveryCredential(ordinarySession), false);
});

test('fails closed for missing, expired, and malformed recovery links', () => {
  assert.deepEqual(parseRecoveryUrl(null), { kind: 'missing' });
  assert.deepEqual(parseRecoveryUrl('https://sekretbip.net/reset-password'), { kind: 'missing' });

  const expired = parseRecoveryUrl(
    'https://sekretbip.net/reset-password?error=access_denied&error_description=Link%20expired',
  );
  assert.deepEqual(expired, {
    kind: 'error',
    message: 'This reset link is invalid or expired. Request a new one.',
  });

  const malformed = parseRecoveryUrl('http://[');
  assert.deepEqual(malformed, {
    kind: 'error',
    message: 'This reset link is malformed. Request a new one.',
  });
});

test('validates new password length and confirmation exactly', () => {
  assert.equal(validateNewPassword('short', 'short'), 'Password must be at least 8 characters.');
  assert.equal(validateNewPassword('password1', 'password2'), "Passwords don't match.");
  assert.equal(validateNewPassword(' password ', ' password '), null);
});
