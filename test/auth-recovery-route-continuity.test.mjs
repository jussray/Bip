import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../app/(auth)/forgot-password.tsx', import.meta.url), 'utf8');

test('password recovery returns to the existing sign-in route', () => {
  const returnCalls = source.match(/onPress=\{\(\) => router\.back\(\)\}/g) ?? [];
  assert.equal(returnCalls.length, 2);
  assert.doesNotMatch(source, /router\.replace\('\/\(auth\)\/login'\)/);
});

test('password recovery keeps neutral account-disclosure copy', () => {
  assert.match(source, /If an account matches that email/);
  assert.doesNotMatch(source, /account exists|email is registered/i);
});
