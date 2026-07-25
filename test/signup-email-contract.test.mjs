import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const signupSource = fs.readFileSync('app/(auth)/signup.tsx', 'utf8');

test('signup sends username and account side to Supabase email context', () => {
  assert.match(signupSource, /username:\s*username\.trim\(\)/);
  assert.match(signupSource, /account_side:\s*side/);
  assert.match(signupSource, /signup_source:\s*'sekret-bip-app'/);
  assert.match(signupSource, /options:\s*\{[\s\S]*emailRedirectTo:\s*redirectTo[\s\S]*data:\s*metadata/);
});

test('anonymous upgrades preserve the same metadata and redirect contract', () => {
  assert.match(signupSource, /auth\.updateUser\([\s\S]*data:\s*metadata[\s\S]*emailRedirectTo:\s*redirectTo/);
});

test('confirmation redirects retain Teen or Parent account context', () => {
  assert.match(signupSource, /emailConfirmed=1&side=/);
  assert.match(signupSource, /queryParams:\s*\{\s*emailConfirmed:\s*'1',\s*side\s*\}/);
});
