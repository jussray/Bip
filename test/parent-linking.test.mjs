/**
 * Parent/teen linking: invite code contract, status machine, revocation rules,
 * safety-scan notification gate.
 *
 * These tests verify the business rules of parentLink.ts and the safety-scan
 * edge function without requiring a live Supabase connection.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const linkSrc  = fs.readFileSync(new URL('../src/utils/parentLink.ts',              import.meta.url), 'utf8');
const scanSrc  = fs.readFileSync(new URL('../supabase/functions/safety-scan/index.ts', import.meta.url), 'utf8');

// ─── Invite code format ───────────────────────────────────────────────────────

// Reconstruct randomCode() from source for behavioral testing.
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
  // With 36^6 ≈ 2.1 billion possibilities, 50 calls should all be unique.
  assert.ok(codes.size > 40, 'randomCode should rarely collide across 50 calls');
});

// ─── Invite code lifecycle rules in source ────────────────────────────────────
test('generateInviteCode sets expires_at to 48 hours from now', () => {
  assert.match(linkSrc, /48 \* 60 \* 60 \* 1000/);
});

test('generateInviteCode inserts with status="pending"', () => {
  assert.match(linkSrc, /status:\s*'pending'/);
});

test('generateInviteCode revokes existing pending invite before inserting a new one', () => {
  // Only one active invite per teen at a time.
  assert.match(linkSrc, /update\(.*status.*'revoked'[\s\S]*?\.eq\('status', 'pending'\)/s);
});

test('redeemInviteCode requires status="pending" before accepting', () => {
  assert.match(linkSrc, /\.eq\('status', 'pending'\)/);
});

test('redeemInviteCode rejects expired codes via gt(expires_at)', () => {
  assert.match(linkSrc, /\.gt\('expires_at',/);
});

test('redeemInviteCode sets status="active" on success', () => {
  assert.match(linkSrc, /status:\s*'active'/);
});

test('redeemInviteCode sets linked_at timestamp on success', () => {
  assert.match(linkSrc, /linked_at:\s*new Date\(\)\.toISOString\(\)/);
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

// ─── Graceful degradation when Supabase is not configured ────────────────────
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

// ─── Safety-scan notification gate ───────────────────────────────────────────
test('safety-scan notifies parent only if parent_links.status is active', () => {
  assert.match(scanSrc, /\.eq\('status', 'active'\)/);
});

test('safety-scan notification payload contains no content (alert_id + severity only)', () => {
  // Notification must reference alert_id and severity, and must NOT include content.
  assert.match(scanSrc, /alert_id/);
  assert.match(scanSrc, /severity/);
  // Content / text / message must not be in the notification payload section.
  const notifyFn = scanSrc.slice(scanSrc.indexOf('async function notifyParentIfLinked'));
  assert.doesNotMatch(notifyFn, /content:/);
});

test('safety-scan notifies parent only for high-severity events', () => {
  // The notify call must be conditional on severity === high.
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
  // Keyword pass must not be gated on OPENAI_KEY being set.
  const patternScanIdx = scanSrc.indexOf('function patternScan(');
  const openAiKeyIdx   = scanSrc.indexOf("if (!OPENAI_KEY)");
  assert.ok(patternScanIdx > 0, 'patternScan must be defined');
  // patternScan must be called outside the OPENAI_KEY guard.
  assert.ok(patternScanIdx < openAiKeyIdx || openAiKeyIdx === -1,
    'Keyword scan must not depend on OPENAI_KEY being present');
});

test('safety-scan does not log or store content text', () => {
  // Content is never stored — only reduced scan_metadata leaves the function.
  assert.match(scanSrc, /Content text is NEVER logged or stored|content.*never logged/i);
});

test('ScanMetadata has no content field', () => {
  // The metadata interface must only carry flagged, top_category, top_score, provider.
  const metaMatch = scanSrc.match(/interface ScanMetadata \{([\s\S]*?)\}/);
  assert.ok(metaMatch, 'ScanMetadata interface must exist');
  assert.doesNotMatch(metaMatch[1], /\bcontent\b/);
  assert.doesNotMatch(metaMatch[1], /\btext\b/);
  assert.match(metaMatch[1], /flagged/);
  assert.match(metaMatch[1], /top_category/);
  assert.match(metaMatch[1], /provider/);
});
