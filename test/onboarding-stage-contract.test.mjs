import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

// src/services/onboarding.ts and src/context/OnboardingContext.tsx are the
// live implementation: every onboarding screen imports through the `@/`
// alias, which resolves to src/. (A duplicate, more elaborate pair of files
// used to live at the repo root and were covered by this test, but nothing
// ever imported them by their real path — they were dead, uncompilable code
// referencing a nonexistent AuthContext, and this test was giving false
// confidence about logic that never ran. They were deleted and merged into
// the live implementation below instead.)
const service = fs.readFileSync(new URL('../src/services/onboarding.ts', import.meta.url), 'utf8');
const context = fs.readFileSync(new URL('../src/context/OnboardingContext.tsx', import.meta.url), 'utf8');
const age = fs.readFileSync(new URL('../app/(onboarding)/age.tsx', import.meta.url), 'utf8');
const consent = fs.readFileSync(new URL('../app/(onboarding)/consent.tsx', import.meta.url), 'utf8');
const storage = fs.readFileSync(new URL('../src/utils/storage.ts', import.meta.url), 'utf8');

test('onboarding state writes target the real, RLS-hardened table with the real stage enum', () => {
  assert.match(service, /from\('user_onboarding_state'\)/);
  assert.doesNotMatch(service, /from\('onboarding_state'\)/);

  // Must match supabase/migrations/20260718000000_onboarding_state.sql's
  // onboarding_stage enum exactly, or the server will reject the write.
  for (const stage of [
    'pre_signup', 'signed_up', 'consent_complete', 'age_verified', 'role_selected',
    'name_set', 'identity_set', 'reflection_complete', 'parent_link_sent',
    'parent_linked', 'parent_link_skipped', 'parent_setup_complete', 'activated', 'steady_state',
  ]) {
    assert.match(service, new RegExp(`'${stage}'`), `ONBOARDING_STAGES is missing '${stage}'`);
  }
});

test('advanceStage self-heals a missing baseline row via insert, never upsert (never overwrites progress)', () => {
  assert.match(service, /\.insert\(\{\s*\n?\s*user_id: userId,\s*\n?\s*stage: 'signed_up',\s*\n?\s*role: 'unknown',/);
  assert.doesNotMatch(service, /user_onboarding_state'\)\s*\n?\s*\.upsert/);
});

test('advanceStage whitelists payload columns instead of spreading arbitrary client fields', () => {
  const body = service.slice(service.indexOf('function pickKnownColumns'), service.indexOf('function ensureBaselineRow'));
  assert.match(body, /payload\.role/);
  assert.match(body, /payload\.age_bucket/);
  assert.match(service, /\.update\(\{ stage, \.\.\.pickKnownColumns\(payload\) \}\)/);
});

test('markActivated sets stage and activated_at together, as the trigger requires', () => {
  const body = service.slice(service.indexOf('export async function markActivated'));
  assert.match(body, /stage: 'activated'/);
  assert.match(body, /activated_at: new Date\(\)\.toISOString\(\)/);
  assert.match(body, /activation_action: activationAction/);
});

test('onboarding context advance() is fire-and-forget and forwards to advanceStage', () => {
  const body = context.slice(context.indexOf('export function OnboardingProvider'));
  assert.match(body, /advanceStage\(data\.user\.id, event, payload\)\.catch\(\(\) => null\)/);
});

test('public age route redirects permanent accounts to consent before durable writes', () => {
  assert.match(age, /getPermanentConsentGate/);
  assert.match(age, /consentService\.hasCompletedOnboarding\(\) \? 'complete' : 'missing_consent'/);
  assert.match(age, /router\.replace\(`\/\(onboarding\)\/consent\?side=\$\{decision\.nextSide\}` as never\)/);
  assert.match(age, /router\.replace\('\/\(onboarding\)\/consent\?side=parent' as never\)/);
  assert.match(age, /if \(consentGate === 'complete'\)[\s\S]*await advance\('age_verified'/);
});

test('consent replays scoped local choices only after required consent is durable', () => {
  assert.match(consent, /await consentService\.load\(userId\)/);
  assert.match(consent, /if \(!consentService\.hasCompletedOnboarding\(\)\)/);
  assert.match(consent, /await advance\('consent_complete'\)/);
  assert.match(consent, /AsyncStorage\.getItem\(AGE_ASSURANCE_STORAGE_KEYS\.bucket\)/);
  assert.match(consent, /if \(!isStoredAgeBucket\(storedAge\) \|\| storedAge === 'under-13'\)/);
  assert.match(consent, /await advance\('age_verified', \{ age_bucket: storedAge \}\)/);
  assert.match(consent, /await advance\('role_selected', \{ role: 'teen' \}\)/);
});

test('private cache clearing removes transient onboarding age and side choices', () => {
  for (const key of [
    'bip_onboarding_side',
    'bip_onboarding_age',
    'bip_age_verification_status',
    'bip_age_verification_method',
    'bip_age_guardian_required',
    'bip_age_raw_evidence_stored',
  ]) {
    assert.match(storage, new RegExp(`'${key}'`));
  }
});
