import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('parent invite mapper covers server outcomes', async () => {
  const source = await read('src/utils/parentLinkErrors.ts');
  assert.match(source, /unauthorized/);
  assert.match(source, /invalid_invite_code/);
  assert.match(source, /invite_not_found/);
  assert.match(source, /invite_not_pending/);
  assert.match(source, /invite_expired/);
  assert.match(source, /cannot_link_self/);
  assert.match(source, /server_error/);
});

test('parent link utility delegates RPC errors to the mapper', async () => {
  const source = await read('src/utils/parentLink.ts');
  assert.match(source, /mapParentInviteRpcError/);
  assert.match(source, /mapParentInviteRpcError\(error\.message\)/);
});
