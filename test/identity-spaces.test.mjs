import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('profile separates account identity from Circle identity', () => {
  const profile = read('app/(teen)/profile.tsx');
  assert.match(profile, /My Profile/);
  assert.match(profile, /Circle Identity/);
  assert.match(profile, /teen_profile_data/);
  assert.match(profile, /teen_circle_identity/);
});

test('profile links growth and support to their owning spaces instead of duplicating them', () => {
  const profile = read('app/(teen)/profile.tsx');
  assert.match(profile, /Growth lives in Bippin 2/);
  assert.match(profile, /Support lives in Bridge/);
  assert.match(profile, /\/(teen)\/bippin2|\/\(teen\)\/bippin2/);
  assert.match(profile, /\/\(teen\)\/bridge/);
});

test('Circle exposes a direct doorway to social identity', () => {
  const circle = read('app/(teen)/circle/index.tsx');
  assert.match(circle, /\/(teen)\/profile|\/\(teen\)\/profile/);
  assert.match(circle, /Your Circle identity is separate from your private account/);
});

test('Circle identity copy preserves privacy boundaries', () => {
  const profile = read('app/(teen)/profile.tsx');
  assert.match(profile, /separate from your private account identity/);
  assert.match(profile, /Crew sees only what you choose to share/);
});
