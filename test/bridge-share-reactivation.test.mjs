import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = new URL(
  '../supabase/migrations/20260706060000_reactivate_revoked_bridge_share_request.sql',
  import.meta.url,
);
const pagesPath = new URL('../app/(teen)/pages/index.tsx', import.meta.url);

const sql = await readFile(migrationPath, 'utf8');
const pages = await readFile(pagesPath, 'utf8');

test('create_bridge_share_request reactivates terminal rows on conflict', () => {
  assert.match(sql, /create or replace function public\.create_bridge_share_request/i);
  assert.match(sql, /on conflict \(teen_user_id, idempotency_key\) do update/i);
  assert.match(sql, /status in \('revoked', 'expired', 'failed'\)/i);
  assert.match(sql, /then 'pending'/i);
});

test('reactivation clears revocation/failure state instead of leaving it stale', () => {
  assert.match(sql, /revoked_at\s*=\s*case/i);
  assert.match(sql, /failure_code\s*=\s*case/i);
  // Both must resolve to null in the reactivating branch, not just be left alone.
  const revokedAtBlock = sql.slice(sql.indexOf('revoked_at ='), sql.indexOf('failure_code ='));
  assert.match(revokedAtBlock, /then\s+null/i);
});

test('reactivation re-addresses the request to the current parent_user_id', () => {
  assert.match(sql, /parent_user_id\s*=\s*excluded\.parent_user_id/i);
});

test('Pages screen no longer treats a revoked/expired/failed share as terminal', () => {
  assert.doesNotMatch(pages, /not re-shareable from here yet/);
  assert.doesNotMatch(pages, /isTerminal/);
});
