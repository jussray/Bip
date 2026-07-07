import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('trigger-only security definer functions are not RPC executable', async () => {
  const source = await read('supabase/migrations/20260707035500_harden_exposed_security_definer_functions.sql');
  assert.match(source, /auto_resolve_issue_on_event_resolve\(\) from public, anon, authenticated/);
  assert.match(source, /enforce_circle_anonymity\(\) from public, anon, authenticated/);
  assert.match(source, /handle_bip_event_points\(\) from public, anon, authenticated/);
});

test('push token RPCs reject anonymous sessions', async () => {
  const source = await read('supabase/migrations/20260707035500_harden_exposed_security_definer_functions.sql');
  const checks = source.match(/is_anonymous/g) ?? [];
  assert.equal(checks.length, 2);
  assert.match(source, /claim_push_token/);
  assert.match(source, /disable_push_token/);
});

test('founder helpers are not exposed to anon', async () => {
  const source = await read('supabase/migrations/20260707035500_harden_exposed_security_definer_functions.sql');
  assert.match(source, /is_founder\(\) from public, anon/);
  assert.match(source, /upsert_control_room_issue[\s\S]*from public, anon/);
});
