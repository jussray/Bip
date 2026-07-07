import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('parent link functions check anonymous session state', async () => {
  const source = await read('supabase/migrations/20260707034000_harden_parent_link_rpc_auth.sql');
  const checks = source.match(/is_anonymous/g) ?? [];
  assert.equal(checks.length, 2);
  assert.match(source, /create_parent_link_invite/);
  assert.match(source, /redeem_parent_link_invite/);
  assert.match(source, /unauthorized/);
});

test('parent link functions remain limited to authenticated callers', async () => {
  const source = await read('supabase/migrations/20260707034000_harden_parent_link_rpc_auth.sql');
  assert.match(source, /from public, anon/);
  assert.match(source, /to authenticated/);
});
