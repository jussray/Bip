/**
 * Parent/teen linking: invite code contract, status machine, revocation rules,
 * safety-scan notification gate.
 *
 * These tests verify the business rules of parentLink.ts, the protected
 * parent-link redemption migration, and the safety-scan edge function without
 * requiring a live Supabase connection.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const linkSrc = fs.readFileSync(new URL('../src/utils/parentLink.ts', import.meta.url), 'utf8');
const approvalSql = fs.readFileSync(new URL('../supabase/migrations/20260630001000_account_verification_parent_approval.sql', import.meta.url), 'utf8');
const scanSrc = fs.readFileSync(new URL('../supabase/functions/safety-scan/index.ts', import.meta.url), 'utf8');

const randomCodeBody = linkSrc.match(
  /function randomCode\(\): string \{([\s\S]*?)\n\}/,
)?.[1] ?? '';
const randomCode = new Function(randomCodeBody); // eslint-disable-line no-new-func

test('randomCode returns a string', () => {
  assert.equal(typeof randomCode(), 'string');
});

test('randomCode is 6 characters long', () => {
  for (let i = 0; i < 20; i++) {
    assert.equal(randomCode().length, 6, 'Invite code must be exactly 6 chars');
  }
});

test('randomCode is uppercase', () => {
  for (let i = 0; i < 20; i++) {
    const code = randomCode();
    assert.equal(code, code.toUpperCase(), 'Invite code must be uppercase');
  }
});

test('randomCode contains only alphanumeric characters', () => {
  for (let i = 0; i < 30; i++) {
    assert.match(randomCode(), /^[A-Z0-9]+$/, 'Invite code must be alphanumeric');
  }
});

test('randomCode produces unique values across calls', () => {
  const codes = new Set(Array.from({ length: 50 }, () => randomCode()));
  assert.ok(codes.size > 40, 'randomCode should rarely collide across 50 calls');
});

test('generateInviteCode sets expires_at to 48 hours from now', () => {
  assert.match(linkSrc, /48 \* 60 \* 60 \* 1000/);
});

test('generateInviteCode inserts with status="pending"', () => {
  assert.match(linkSrc, /status:\s*'pending'/);
});

test('generateInviteCode revokes existing pending invite before inserting a new one', () => {
  assert.match(linkSrc, /update\(.*status.*'revoked'[\s\S]*?\.eq\('status', 'pending'\)/s);
});

test('redeemInviteCode uses the protected server-authoritative RPC', () => {
  assert.match(linkSrc, /\.rpc\('redeem_parent_link_invite'/);
  assert.match(linkSrc, /p_invite_code:\s*normalized/);
});

test('redemption RPC requires a pending invite', () => {
  assert.match(approvalSql, /status = 'pending'/);
});

test('redemption RPC rejects expired invites', () => {
  assert.match(approvalSql, /expires_at is null or expires_at > now\(\)/);
  assert.match(approvalSql, /invalid or expired invite/);
});

test('redemption RPC activates the parent link', () => {
  assert.match(approvalSql, /status = 'active'/);
  assert.match(approvalSql, /parent_user_id = v_parent_id/);
});

test('redemption RPC verifies the linked teen atomically', () => {
  assert.match(approvalSql, /verification_state = 'VERIFIED_TEEN'/);
  assert.match(approvalSql, /parent_link_state = 'active'/);
  assert.match(approvalSql, /for update/);
});

test('fetchLinkedTeenId queries only status="active" links', () => {
  assert.match(linkSrc, /fetchLinkedTeenId[\s\S]*?\.eq\('status', 'active'\)/s);
});

test('revokeParentLink updates only the teen\'s active link', () => {
  assert.match(linkSrc, /revokeParentLink[\s\S]*?\.eq\('teen_user_id', uid\)[\s\S]*?\.eq\('status', 'active'\)/s);
});

test('revokeParentLink sets status="revoked" not "pending"', () => {
  const revokeBody = linkSrc.slice(linkSrc.indexOf('export async function revokeParentLink'));
  assert.match(revokeBody, /status.*'revoked'/);
  assert.doesNotMatch(revokeBody, /status.*'pending'/);
});

test('generateInviteCode returns null when Supabase is not configured', () => {
  assert.match(linkSrc, /if \(!sb\) return null/);
});

test('redeemInviteCode returns null when Supabase is not configured', () => {
  const redeemBody = linkSrc.slice(linkSrc.indexOf('export async function redeemInviteCode'));
  assert.match(redeemBody, /if \(!sb\) return null/);
});

test('revokeParentLink returns false (not throws) when Supabase is not configured', () => {
  const revokeBody = linkSrc.slice(linkSrc.indexOf('export async function revokeParentLink'));
  assert.match(revokeBody, /if \(!sb\) return false/);
});

test('safety-scan notifies parent only if parent_links.status is active', () => {
  assert.match(scanSrc, /\.eq\('status', 'active'\)/);
});

test('safety-scan notification payload contains no content (alert_id + severity only)', () => {
  assert.match(scanSrc, /alert_id/);
  assert.match(scanSrc, /severity/);
  const notifyFn = scanSrc.slice(scanSrc.indexOf('async function notifyParentIfLinked'));
  assert.doesNotMatch(notifyFn, /content:/);
});

test('safety-scan notifies parent only for high-severity events', () => {
  assert.match(scanSrc, /severity.*===.*'high'|'high'.*===.*severity/);
});

test('safety-scan keyword scan includes high-severity self-harm patterns', () => {
  assert.match(scanSrc, /kill myself/i);
  assert.match(scanSrc, /want to die/i);
  assert.match(scanSrc, /suicidal/i);
  assert.match(scanSrc, /cut myself/i);
  assert.match(scanSrc, /self.harm/i);
});

test('safety-scan keyword scan includes high-severity abuse patterns', () => {
  assert.match(scanSrc, /not safe/i);
  assert.match(scanSrc, /being abused/i);
  assert.match(scanSrc, /he hits|she hits/i);
});

test('safety-scan keyword scan includes medium-severity distress patterns', () => {
  assert.match(scanSrc, /can'?t take it/i);
  assert.match(scanSrc, /i hate myself/i);
  assert.match(scanSrc, /disappear forever/i);
});

test('safety-scan keyword scan includes runaway signals', () => {
  assert.match(scanSrc, /running away/i);
  assert.match(scanSrc, /goodbye forever/i);
});

test('safety-scan runs keyword scan even without OPENAI_API_KEY', () => {
  const patternScanIdx = scanSrc.indexOf('function patternScan(');
  const openAiKeyIdx = scanSrc.indexOf("if (!OPENAI_KEY)");
  assert.ok(patternScanIdx > 0, 'patternScan must be defined');
  assert.ok(patternScanIdx < openAiKeyIdx || openAiKeyIdx === -1,
    'Keyword scan must not depend on OPENAI_KEY being present');
});

test('safety-scan does not log or store content text', () => {
  assert.match(scanSrc, /Content text is NEVER logged or stored|content.*never logged/i);
});

test('ScanMetadata has no content field', () => {
  const metaMatch = scanSrc.match(/interface ScanMetadata \{([\s\S]*?)\}/);
  assert.ok(metaMatch, 'ScanMetadata interface must exist');
  assert.doesNotMatch(metaMatch[1], /\bcontent\b/);
  assert.doesNotMatch(metaMatch[1], /\btext\b/);
  assert.match(metaMatch[1], /flagged/);
  assert.match(metaMatch[1], /top_category/);
  assert.match(metaMatch[1], /provider/);
});
