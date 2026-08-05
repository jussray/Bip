import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const signup = read('app/(auth)/signup.tsx');
const signupInsertMigration = read('supabase/migrations/20260726093000_external_user_signup_defaults.sql');
const signupUpdateMigration = read('supabase/migrations/20260805170500_sync_app_profile_on_auth_metadata_update.sql');
const frontDoor = read('app/index.tsx');
const humanSafeContract = read('docs/HUMAN_SAFE_BUILD_CONTRACT.md');

test('every permanent signup path carries durable approved identity metadata', () => {
  const metadataBuilder = signup.match(/function buildSignupMetadata[\s\S]*?\n}/)?.[0] ?? '';

  assert.match(metadataBuilder, /account_side:\s*side/);
  assert.match(metadataBuilder, /username:\s*username\.trim\(\)/);
  assert.match(metadataBuilder, /signup_source:\s*'sekret-bip'/);
  assert.doesNotMatch(
    metadataBuilder,
    /\b(role|founder|can_manage_app|can_view_audits|verified|verification_status)\b/,
  );

  assert.match(
    signup,
    /auth\.updateUser\(\{[\s\S]*?email:\s*e,[\s\S]*?password:\s*p,[\s\S]*?data:\s*metadata,[\s\S]*?\}\)/,
  );
  assert.match(
    signup,
    /auth\.signUp\(\{[\s\S]*?email:\s*e,[\s\S]*?password:\s*p,[\s\S]*?options:\s*\{\s*data:\s*metadata\s*\}/,
  );
  assert.match(
    signup,
    /auth\.signUp\(\{[\s\S]*?email:\s*signupEmail,[\s\S]*?password:\s*signupPassword,[\s\S]*?options:\s*\{\s*data:\s*metadata\s*\}/,
  );
  assert.match(signup, /recoverAmbiguousSignup\(sb, e, p, metadata, authErr\)/);
  assert.match(signup, /recoverAmbiguousSignup\(sb, e, p, metadata, upgradeError\)/);
});

test('profile initialization covers new users and anonymous account upgrades without privilege copying', () => {
  assert.match(signupInsertMigration, /raw_user_meta_data\s*->>\s*'account_side'/);
  assert.match(signupInsertMigration, /raw_user_meta_data\s*->>\s*'username'/);
  assert.doesNotMatch(
    signupInsertMigration,
    /raw_user_meta_data\s*->>\s*'(role|founder|can_manage_app|can_view_audits|verification_status)'/,
  );

  assert.match(signupUpdateMigration, /after update of raw_user_meta_data, email on auth\.users/);
  assert.match(signupUpdateMigration, /old\.raw_user_meta_data is distinct from new\.raw_user_meta_data/);
  assert.match(signupUpdateMigration, /execute function public\.initialize_app_profile\(\)/);
});

test('front-door bootstrap never leaves the human with an unlabeled spinner', () => {
  assert.match(frontDoor, /accessibilityRole="progressbar"/);
  assert.match(frontDoor, /accessibilityLabel="Opening Se'kret Bip"/);
  assert.match(frontDoor, /accessibilityLiveRegion="polite"/);
  assert.match(frontDoor, /Opening your Se’kret Bip space…/);
});

test('human-safe authority forbids decorative health and local-only routing identity', () => {
  assert.match(humanSafeContract, /A spinner by itself is not a complete loading state/);
  assert.match(humanSafeContract, /Truthful readiness language/);
  assert.match(humanSafeContract, /Never turn missing proof into success-colored copy/);
  assert.match(humanSafeContract, /Durable identity handoff/);
  assert.match(humanSafeContract, /must not be the only authority for Teen versus Parent side/);
});
