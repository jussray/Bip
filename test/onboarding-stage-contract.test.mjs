import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const service = fs.readFileSync(new URL('../services/onboarding.ts', import.meta.url), 'utf8');
const context = fs.readFileSync(new URL('../context/OnboardingContext.tsx', import.meta.url), 'utf8');
const age = fs.readFileSync(new URL('../app/(onboarding)/age.tsx', import.meta.url), 'utf8');
const consent = fs.readFileSync(new URL('../app/(onboarding)/consent.tsx', import.meta.url), 'utf8');
const storage = fs.readFileSync(new URL('../src/utils/storage.ts', import.meta.url), 'utf8');

function functionBody(source, name, nextName) {
  const start = source.indexOf(`function ${name}`);
  const end = nextName ? source.indexOf(`function ${nextName}`, start + 1) : source.length;
  assert.notEqual(start, -1, `${name} is missing`);
  return source.slice(start, end === -1 ? source.length : end);
}

test('metadata repair is compare-and-swap guarded by old role and age values', () => {
  const body = functionBody(service, 'backfillPassedStageMetadata', 'advanceStageInternal');
  assert.match(body, /\.eq\('stage', current\.stage\)/);
  assert.match(body, /\.eq\('role', current\.role\)/);
  assert.match(body, /current\.age_bucket === null[\s\S]*\.is\('age_bucket', null\)/);
  assert.match(body, /request\.eq\('age_bucket', current\.age_bucket\)/);
  assert.match(body, /Metadata repair conflict/);
});

test('onboarding context advances through database truth while local state is loading', () => {
  const body = functionBody(context, 'OnboardingProvider', 'useOnboarding');
  assert.match(body, /const updated = await advanceStage\(user\.id, \{ stage, \.\.\.extras \}\)/);
  assert.doesNotMatch(body, /if \(!user\?\.id \|\| !state\) return/);
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
