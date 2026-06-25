/**
 * Contract tests for the PR #114 account gate + privacy-first sync features.
 * Adapted for main's Expo Router + src/ architecture.
 * Run with: npm run test:device-sync
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const exists = (path) => existsSync(path);

test('account gate infrastructure exists in Expo Router layout', () => {
  const layout = read('app/_layout.tsx');
  assert.match(layout, /getAuthenticatedProfile/, 'root layout must import getAuthenticatedProfile');
  assert.match(layout, /profile-setup/, 'root layout must redirect to profile-setup when profile absent');
  assert.match(layout, /signOutAndClearLocalState/, 'root layout must call sign-out cleaner on session end');
});

test('account profile utilities are present', () => {
  assert.ok(exists('src/utils/account.ts'), 'src/utils/account.ts must exist');
  const account = read('src/utils/account.ts');
  assert.match(account, /generateBipId/, 'must export generateBipId');
  assert.match(account, /normalizeAnonymousHandle/, 'must export normalizeAnonymousHandle');
  assert.match(account, /profileIdentity/, 'must export profileIdentity');
  assert.match(account, /signOutAndClearLocalState/, 'must export signOutAndClearLocalState');
  assert.match(account, /upsertPrivateProfile/, 'must export upsertPrivateProfile');
  assert.match(account, /getAuthenticatedProfile/, 'must export getAuthenticatedProfile');
});

test('profileIdentity respects context boundaries', () => {
  const account = read('src/utils/account.ts');
  assert.match(account, /public_circle[\s\S]*anonymousHandle/, 'public_circle context must resolve to anonymous handle');
  assert.match(account, /trusted_friend[\s\S]*firstName/, 'trusted_friend context may resolve to first name');
  assert.match(account, /private_self[\s\S]*firstName/, 'private_self context resolves to first name');
});

test('parent/guardian linking utilities are present', () => {
  assert.ok(exists('src/utils/parentLinks.ts'), 'src/utils/parentLinks.ts must exist');
  const links = read('src/utils/parentLinks.ts');
  assert.match(links, /generateTeenGuardianInviteCode/, 'must export invite code generator');
  assert.match(links, /requestGuardianLinkByCode/, 'must export guardian link request');
  assert.match(links, /canGuardianAccessSharedContent/, 'must export permission-scoped access check');
  assert.match(links, /status === 'approved' \? permissions : \[\]/, 'blocked/removed links must clear permissions');
});

test('private account schema separates real identity from public Bip identity', () => {
  const schema = read('db/schema.sql');
  assert.match(schema, /create table if not exists public\.accounts/);
  assert.match(schema, /id\s+uuid\s+primary key references auth\.users\(id\)/);
  assert.match(schema, /email\s+text\s+not null/);
  assert.match(schema, /first_name\s+text\s+not null/);
  assert.match(schema, /anonymous_handle\s+text\s+not null/);
  assert.match(schema, /bip_id\s+text\s+not null unique/);
  assert.match(schema, /for select using \(auth\.uid\(\) = id\)/, 'accounts select must be owner-only');
});

test('Supabase TABLES includes account + parent-teen tables', () => {
  const sb = read('src/utils/supabase.ts');
  assert.match(sb, /accounts:\s*'accounts'/, 'TABLES must include accounts');
  assert.match(sb, /parentTeenInvites:\s*'parent_teen_invites'/, 'TABLES must include parentTeenInvites');
  assert.match(sb, /parentTeenLinks:\s*'parent_teen_links'/, 'TABLES must include parentTeenLinks');
  assert.match(sb, /teenGuardianShares:\s*'teen_guardian_shares'/, 'TABLES must include teenGuardianShares');
});

test('storage layer clears private state on sign-out', () => {
  const storage = read('src/utils/storage.ts');
  assert.match(storage, /clearPrivateLocalState/, 'must export clearPrivateLocalState');
  assert.match(storage, /accountProfile/, 'accountProfile must be in private clear set');
  assert.match(storage, /parentTeenLinks/, 'parentTeenLinks must be in private clear set');
  assert.match(storage, /teenGuardianShares/, 'teenGuardianShares must be in private clear set');
});

test('profile-setup screen exists in auth route group', () => {
  assert.ok(exists('app/(auth)/profile-setup.tsx'), 'app/(auth)/profile-setup.tsx must exist');
  const setup = read('app/(auth)/profile-setup.tsx');
  assert.match(setup, /upsertPrivateProfile/, 'profile setup must call upsertPrivateProfile');
  assert.match(setup, /teen[\s\S]*guardian/, 'profile setup must offer side selection');
  assert.match(setup, /Bip ID preview/, 'profile setup must show Bip ID preview');
});

test('parent teen linking is invite-only and permission scoped', () => {
  const schema = read('db/schema.sql');
  const parentLinks = read('src/utils/parentLinks.ts');
  assert.match(parentLinks, /status:\s*'pending'/, 'guardian request must start pending');
  assert.match(parentLinks, /canGuardianAccessSharedContent[\s\S]*status === 'approved'[\s\S]*permissions\.includes/, 'guardian access requires approved link + explicit permission');
  assert.match(schema, /parent_teen_links/, 'schema must have parent_teen_links table');
  assert.match(schema, /teen_guardian_shares/, 'schema must have teen_guardian_shares table');
  assert.match(schema, /teen_guardian_shares_linked_guardian_select/, 'RLS must scope guardian reads');
  assert.doesNotMatch(parentLinks, /crew/i, 'parent-teen permissions must not reuse Bip Crew logic');
});
