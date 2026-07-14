import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const migration = read('supabase/migrations/20260714193000_sync_auth_email_to_app_profile.sql');
const upgradeState = read('src/features/identity/accountUpgrade.ts');
const signup = read('app/(auth)/signup.tsx');
const index = read('app/index.tsx');
const profile = read('src/features/identity/accountProfile.ts');

test('Auth email changes mirror to app_profiles only through immutable user id', () => {
  assert.match(migration, /after update of email on auth\.users/i);
  assert.match(migration, /when \(old\.email is distinct from new\.email\)/i);
  assert.match(migration, /values \(new\.id, new\.email\)/i);
  assert.match(migration, /on conflict \(user_id\) do update/i);
  assert.match(migration, /where p\.user_id = u\.id/i);
  assert.doesNotMatch(migration, /where\s+p\.email\s*=\s*u\.email/i);
});

test('Auth trigger functions are not client-callable and use locked search paths', () => {
  assert.match(migration, /security definer[\s\S]*set search_path = pg_catalog, pg_temp/i);
  assert.match(migration, /revoke all on function public\.sync_app_profile_email_from_auth\(\)[\s\S]*from public, anon, authenticated/i);
  assert.match(migration, /alter function public\.initialize_app_profile\(\)[\s\S]*set search_path = pg_catalog, pg_temp/i);
  assert.match(migration, /alter function public\.upsert_own_bip_profile\([\s\S]*set search_path = pg_catalog, pg_temp/i);
});

test('anonymous conversion verifies email before attaching a password', () => {
  const anonymousBlock = signup.slice(
    signup.indexOf('if (currentUser?.is_anonymous)'),
    signup.indexOf('if (currentUser) {'),
  );
  assert.match(anonymousBlock, /auth\.updateUser\(\{\s*email: e,?\s*\}\)/s);
  assert.doesNotMatch(anonymousBlock, /password:\s*p/);
  assert.match(signup, /email_confirmed_at/);
  assert.match(signup, /auth\.updateUser\(\{\s*password: nextPassword,?\s*\}\)/s);
  assert.match(signup, /markPendingAccountUpgrade\(e\)/);
  assert.match(signup, /clearPendingAccountUpgrade\(\)/);
});

test('upgrade recovery stores only normalized email and never credential material', () => {
  assert.match(upgradeState, /PENDING_ACCOUNT_UPGRADE_KEY/);
  assert.match(upgradeState, /AsyncStorage\.setItem\(PENDING_ACCOUNT_UPGRADE_KEY, normalized\)/);
  assert.doesNotMatch(upgradeState, /password|secret|credential/i);
  assert.match(upgradeState, /trim\(\)\.toLowerCase\(\)/);
});

test('bootstrap resumes an incomplete account conversion before private onboarding', () => {
  assert.match(index, /loadPendingAccountUpgradeEmail\(\)/);
  assert.match(index, /isPendingUpgradeForEmail\(pendingUpgradeEmail, user\.email\)/);
  assert.match(index, /router\.replace\('\/\(auth\)\/signup'\)/);
  assert.ok(
    index.indexOf('isPendingUpgradeForEmail(pendingUpgradeEmail, user.email)')
      < index.indexOf('hydrateAccountProfile(buildSide)'),
  );
});

test('the permanent Auth UUID remains the profile and data ownership source', () => {
  assert.match(profile, /\.eq\('user_id', user\.id\)/);
  assert.match(profile, /user_id: user\.id/);
  assert.match(profile, /userId: user\.id/);
  assert.doesNotMatch(profile, /\.eq\('email', user\.email\)/);
});
