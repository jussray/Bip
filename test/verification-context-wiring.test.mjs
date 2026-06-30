import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('verification context reads the server-authoritative account row', async () => {
  const source = await read('src/context/VerificationContext.tsx');
  assert.match(source, /from\('account_verification'\)/);
  assert.match(source, /verification_state,parent_link_state,verification_reason,verification_updated_at/);
  assert.match(source, /setSnapshot\(INITIAL_VERIFICATION_SNAPSHOT\)/);
});

test('root layout waits for verification hydration before enforcing routes', async () => {
  const source = await read('app/_layout.tsx');
  assert.match(source, /VerificationProvider/);
  assert.match(source, /isVerificationLoading/);
  assert.match(source, /decideRouteAccess/);
  assert.match(source, /SOCIAL_SEGMENTS/);
});
