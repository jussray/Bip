import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('first launch collects identity before reflection', () => {
  const name = read('app/(onboarding)/name.tsx');
  const identity = read('app/(onboarding)/identity.tsx');
  assert.match(name, /\/\(onboarding\)\/identity/);
  assert.match(identity, /bip_onboarding_gender/);
  assert.match(identity, /bip_onboarding_companion/);
  assert.match(identity, /\/\(onboarding\)\/reflection/);
});

test('onboarding completion writes one complete private profile', () => {
  const reflection = read('app/(onboarding)/reflection.tsx');
  assert.match(reflection, /teen_profile_done/);
  assert.match(reflection, /teen_profile_data/);
  assert.match(reflection, /bip_onboarding_gender/);
  assert.match(reflection, /bip_onboarding_companion/);
  assert.match(reflection, /\.\.\.existing/);
  assert.match(reflection, /gender/);
  assert.match(reflection, /choice/);
});

test('unfinished teen routes redirect to onboarding', () => {
  const layout = read('app/(teen)/_layout.tsx');
  assert.match(layout, /teen_profile_done/);
  assert.match(layout, /profileChecked/);
  assert.match(layout, /!profileDone/);
  assert.match(layout, /\/\(onboarding\)\/welcome/);
});

test('editing identity does not silently replace the chosen companion', () => {
  const profile = read('app/(teen)/profile.tsx');
  const pickGender = profile.match(/function pickGender[\s\S]*?\n  }/u)?.[0] ?? '';
  assert.match(pickGender, /setGender\(g\)/);
  assert.doesNotMatch(pickGender, /setChoice/);
});

test('Circle identity remains separate from private profile data', () => {
  const profile = read('app/(teen)/profile.tsx');
  assert.match(profile, /teen_profile_data/);
  assert.match(profile, /teen_circle_identity/);
  assert.match(profile, /separate from your private account identity/);
});
