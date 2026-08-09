import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Circle remains the social world and audience layers stay canonical', () => {
  const policy = read('src/features/circle/audiencePolicy.ts');

  assert.equal(policy.includes("Se'kret Bip -> Circle -> audience layer -> post."), true);
  assert.equal(policy.includes("| 'open_bip'"), true);
  assert.equal(policy.includes("| 'community'"), true);
  assert.equal(policy.includes("| 'friends'"), true);
  assert.equal(policy.includes("| 'friend_group'"), true);
  assert.equal(policy.includes("| 'crew'"), true);
  assert.equal(policy.includes("| 'family_bridge'"), true);
  assert.equal(policy.includes("| 'private'"), true);
});

test('Family Bridge is an explicit Circle audience without exposing private Bridge data automatically', () => {
  const policy = read('src/features/circle/audiencePolicy.ts');
  const purposes = read('src/constants/screenPurpose.ts');

  assert.equal(policy.includes("label: 'Family / Bridge'"), true);
  assert.equal(policy.includes('does not make private Bridge data automatically visible in Circle'), true);
  assert.equal(purposes.includes("mustNotBecome: ['parent communication', 'private journaling', 'family messaging']"), true);
  assert.equal(purposes.includes("mustNotBecome: ['Circle', 'public community', 'parent surveillance']"), true);
});

test('public and broad community audiences fail closed for visible faces', () => {
  const policy = read('src/features/circle/audiencePolicy.ts');

  assert.equal(policy.includes("facePolicy: 'reject_visible_faces'"), true);
  assert.equal(policy.includes("facePolicy: 'hide_faces_by_default'"), true);
  assert.equal(policy.includes("case 'open_bip':\n    case 'community':\n      return false;"), true);
});

test('identity exposure requires active trust for Friends, Groups, Crew, and Family Bridge', () => {
  const policy = read('src/features/circle/audiencePolicy.ts');

  assert.equal(policy.includes("return trust.mutualFriendAccepted === true"), true);
  assert.equal(policy.includes("return trust.activeGroupMembership === true"), true);
  assert.equal(policy.includes("return trust.acceptedCrewSelected === true"), true);
  assert.equal(policy.includes("return trust.activeFamilyBridge === true"), true);
  assert.equal(policy.includes("return trust.isOwnerOnly === true"), true);
});

test('trusted audience labels keep the approved Circle product language', () => {
  const policy = read('src/features/circle/audiencePolicy.ts');

  for (const label of [
    "label: 'Open Bip'",
    "label: 'Community'",
    "label: 'Friends'",
    "label: 'Private Friend Group'",
    "label: 'Crew'",
    "label: 'Family / Bridge'",
    "label: 'Just Me / Scrapbook'",
  ]) {
    assert.equal(policy.includes(label), true, `missing ${label}`);
  }
});

test('public Circle composer consumes the Open Bip policy instead of duplicating its own audience rules', () => {
  const feed = read('app/(teen)/circle/feed-v2.tsx');

  assert.equal(feed.includes("CIRCLE_AUDIENCES.open_bip"), true);
  assert.equal(feed.includes("audienceLabel('open_bip')"), true);
  assert.equal(feed.includes('inside Circle · faces stay hidden here'), true);
  assert.equal(feed.includes('OPEN_BIP_AUDIENCE.description'), true);
});
