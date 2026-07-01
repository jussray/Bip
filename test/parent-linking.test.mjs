import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const linkSrc = fs.readFileSync(new URL('../src/utils/parentLink.ts', import.meta.url), 'utf8');
const reconcileSql = fs.readFileSync(new URL('../supabase/migrations/20260630003000_reconcile_parent_link_contract.sql', import.meta.url), 'utf8');

test('invite creation uses the protected RPC', () => {
  assert.match(linkSrc, /\.rpc\('create_parent_link_invite'\)/);
  assert.doesNotMatch(linkSrc, /Math\.random/);
});

test('invite creation produces an eight-character uppercase code', () => {
  assert.match(linkSrc, /PARENT_INVITE_CODE_LENGTH = 8/);
  assert.match(reconcileSql, /upper\(substr\(md5\(gen_random_uuid\(\)::text\), 1, 8\)\)/);
});

test('invite creation stores a pending link with a 48-hour expiry', () => {
  assert.match(reconcileSql, /'pending'/);
  assert.match(reconcileSql, /interval '48 hours'/);
});

test('invite creation moves verification to PENDING_PARENT', () => {
  assert.match(reconcileSql, /'PENDING_PARENT'/);
  assert.match(reconcileSql, /parent_invite_created/);
});

test('invite creation RPC is authenticated-only', () => {
  assert.match(reconcileSql, /revoke execute on function public\.create_parent_link_invite\(\) from public, anon/);
  assert.match(reconcileSql, /grant execute on function public\.create_parent_link_invite\(\) to authenticated/);
});

test('invite redemption uses the protected RPC', () => {
  assert.match(linkSrc, /\.rpc\('redeem_parent_link_invite'/);
  assert.match(linkSrc, /p_invite_code:\s*normalized/);
});

test('redemption requires a pending unexpired invite', () => {
  assert.match(reconcileSql, /v_link\.status <> 'pending'/);
  assert.match(reconcileSql, /v_link\.expires_at is null or v_link\.expires_at <= now\(\)/);
});

test('redemption activates the link and verifies the teen atomically', () => {
  assert.match(reconcileSql, /parent_user_id = v_parent_id/);
  assert.match(reconcileSql, /status = 'active'/);
  assert.match(reconcileSql, /verification_state = 'VERIFIED_TEEN'/);
  assert.match(reconcileSql, /parent_link_state = 'active'/);
  assert.match(reconcileSql, /for update/);
});

test('linked teen lookup reads only active links', () => {
  assert.match(linkSrc, /fetchLinkedTeenId[\s\S]*?\.eq\('status', 'active'\)[\s\S]*?\.eq\('is_active', true\)/s);
});

test('revocation updates only the teen active link', () => {
  assert.match(linkSrc, /revokeParentLink[\s\S]*?\.eq\('teen_user_id', uid\)[\s\S]*?\.eq\('status', 'active'\)/s);
});

test('link helpers return actionable failures without Supabase or auth', () => {
  assert.match(linkSrc, /code: 'not_configured'/);
  assert.match(linkSrc, /code: 'not_authenticated'/);
  assert.match(linkSrc, /export async function generateInviteCode\(\): Promise<string \| null>/);
  assert.match(linkSrc, /export async function redeemInviteCode\(code: string\): Promise<string \| null>/);
});
