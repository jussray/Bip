import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const screen = fs.readFileSync(new URL('../app/(auth)/parent-link-verify.tsx', import.meta.url), 'utf8');
const context = fs.readFileSync(new URL('../src/context/VerificationContext.tsx', import.meta.url), 'utf8');

test('teen verification screen subscribes only to its own verification row', () => {
  assert.match(screen, /table: 'account_verification'/);
  assert.match(screen, /event: 'UPDATE'/);
  assert.match(screen, /filter: `user_id=eq\.\$\{user\.id\}`/);
  assert.match(screen, /void refreshVerification\(\)/);
  assert.match(screen, /supabase\.removeChannel\(channel\)/);
});

test('VerificationContext does not already create a duplicate postgres channel', () => {
  assert.doesNotMatch(context, /postgres_changes/);
  assert.doesNotMatch(context, /\.channel\(/);
});
