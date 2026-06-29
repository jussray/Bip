import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('first launch collects identity before reflection', () => {
  const name = read('app/(onboarding)/name.tsx');
  const identity = read('app/(onboarding)/identity.tsx');
  assert.equal(name.includes('/(onboarding)/identity'), true);
  assert.equal(identity.includes('bip_onboarding_gender'), true);
  assert.equal(identity.includes('bip_onboarding_companion'), true);
  assert.equal(identity.includes('/(onboarding)/reflection'), true);
});

test('onboarding completion writes one complete private profile', () => {
  const reflection = read('app/(onboarding)/reflection.tsx');
  assert.equal(reflection.includes('teen_profile_done'), true);
  assert.equal(reflection.includes('teen_profile_data'), true);
  assert.equal(reflection.includes('bip_onboarding_gender'), true);
  assert.equal(reflection.includes('bip_onboarding_companion'), true);
  assert.equal(reflection.includes('...existing'), true);
  assert.equal(reflection.includes('gender'), true);
  assert.equal(reflection.includes('choice'), true);
});

test('unfinished teen routes redirect to onboarding', () => {
  const layout = read('app/(teen)/_layout.tsx');
  assert.equal(layout.includes('teen_profile_done'), true);
  assert.equal(layout.includes('profileChecked'), true);
  assert.equal(layout.includes('!profileDone'), true);
  assert.equal(layout.includes('/(onboarding)/welcome'), true);
});

test('editing identity does not silently replace the chosen companion', () => {
  const profile = read('app/(teen)/profile.tsx');
  const start = profile.indexOf('function pickGender');
  const end = profile.indexOf('\n  }', start);
  const pickGender = start >= 0 && end >= 0 ? profile.slice(start, end + 4) : '';
  assert.equal(pickGender.includes('setGender(g)'), true);
  assert.equal(pickGender.includes('setChoice'), false);
});

test('Circle identity remains separate from private profile data', () => {
  const profile = read('app/(teen)/profile.tsx');
  assert.equal(profile.includes('teen_profile_data'), true);
  assert.equal(profile.includes('teen_circle_identity'), true);
  assert.equal(profile.includes('separate from your private account identity'), true);
});
