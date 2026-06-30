import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const linkSrc = fs.readFileSync(new URL('../src/utils/parentLink.ts', import.meta.url), 'utf8');
const createSql = fs.readFileSync(new URL('../supabase/migrations/20260630002000_limited_mode_parent_invite.sql', import.meta.url), 'utf8');
const approvalSql = fs.readFileSync(new URL('../supabase/migrations/20260630001000_account_verification_parent_approval.sql', import.meta.url), 'utf8');

test('invite creation uses the protected RPC', () => {
  assert.match(linkSrc, /\.rpc\('create_parent_link_invite'\)/);
  assert.doesNotMatch(linkSrc, /Math\.random/);
});

test('invite creation produces a six-character uppercase code', () => {
  assert.match(createSql, /upper\(substr\(md5\(gen_random_uuid\(\)::text\), 1, 6\)\)/);
});

test('invite creation revokes older pending links', () => {
  assert.match(createSql, /set status = 'revoked'[\s\S]*status = 'pending'/);
});

test('invite creation stores a pending link with a 48-hour expiry', () => {
  assert.match(createSql, /'pending'/);
  assert.match(createSql, /interval '48 hours'/);
});

test('invite creation moves verification to PENDING_PARENT', () => {
  assert.match(createSql, /'PENDING_PARENT'/);
  assert.match(createSql, /parent_invite_created/);
});

test('invite creation RPC is authenticated-only', () => {
  assert.match(createSql, /revoke execute on function public\.create_parent_link_invite\(\) from public, anon/);
  assert.match(createSql, /grant execute on function public\.create_parent_link_invite\(\) to authenticated/);
});

test('invite redemption uses the protected RPC', () => {
  assert.match(linkSrc, /\.rpc\('redeem_parent_link_invite'/);
  assert.match(linkSrc, /p_invite_code:\s*normalized/);
});

test('redemption requires a pending unexpired invite', () => {
  assert.match(approvalSql, /status = 'pending'/);
  assert.match(approvalSql, /expires_at is null or expires_at > now\(\)/);
});

test('redemption activates the link and verifies the teen atomically', () => {
  assert.match(approvalSql, /parent_user_id = v_parent_id/);
  assert.match(approvalSql, /status = 'active'/);
  assert.match(approvalSql, /verification_state = 'VERIFIED_TEEN'/);
  assert.match(approvalSql, /parent_link_state = 'active'/);
  assert.match(approvalSql, /for update/);
});

test('linked teen lookup reads only active links', () => {
  assert.match(linkSrc, /fetchLinkedTeenId[\s\S]*?\.eq\('status', 'active'\)/s);
});

test('revocation updates only the teen active link', () => {
  assert.match(linkSrc, /revokeParentLink[\s\S]*?\.eq\('teen_user_id', uid\)[\s\S]*?\.eq\('status', 'active'\)/s);
});

test('link helpers degrade safely without Supabase', () => {
  const generateBody = linkSrc.slice(linkSrc.indexOf('export async function generateInviteCode'), linkSrc.indexOf('export async function redeemInviteCode'));
  const redeemBody = linkSrc.slice(linkSrc.indexOf('export async function redeemInviteCode'), linkSrc.indexOf('export async function fetchLinkedTeenId'));
  const revokeBody = linkSrc.slice(linkSrc.indexOf('export async function revokeParentLink'));
  assert.match(generateBody, /if \(!sb\) return null/);
  assert.match(redeemBody, /if \(!sb\) return null/);
  assert.match(revokeBody, /if \(!sb\) return false/);
});
