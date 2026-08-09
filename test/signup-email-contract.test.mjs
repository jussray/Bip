import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const signupSource = fs.readFileSync('app/(auth)/signup.tsx', 'utf8');
const loginSource = fs.readFileSync('app/(auth)/login.tsx', 'utf8');
const helperSource = fs.readFileSync('src/features/auth/emailConfirmation.ts', 'utf8');

test('signup sends the platform-safe confirmation redirect on both auth paths', () => {
  assert.match(signupSource, /buildEmailConfirmationRedirectUrl\(preferredSide\)/);
  assert.match(
    signupSource,
    /auth\.signUp\([\s\S]*?emailRedirectTo: redirectTo[\s\S]*?data: metadata/,
  );
  assert.match(
    signupSource,
    /auth\.updateUser\([\s\S]*?data: metadata,[\s\S]*?\},\s*\{ emailRedirectTo: redirectTo \}/,
  );
});

test('confirmation links restore the session and reuse canonical onboarding routing', () => {
  assert.match(loginSource, /emailConfirmed = params\.emailConfirmed === '1'/);
  assert.match(loginSource, /parseEmailConfirmationUrl/);
  assert.match(loginSource, /auth\.setSession\(/);
  assert.match(loginSource, /fetchPostAuthBootstrap\(preferredSide\)/);
  assert.match(loginSource, /router\.replace\(bootstrap\.nextRoute/);
});

test('redirects use the public web route and Expo native deep link', () => {
  assert.match(helperSource, /new URL\('\/login', window\.location\.origin\)/);
  assert.match(helperSource, /Linking\.createURL\('\/login'/);
  assert.match(helperSource, /access_token/);
  assert.match(helperSource, /refresh_token/);
});
