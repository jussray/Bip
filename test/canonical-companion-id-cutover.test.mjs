import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const legacyPattern = /raylene|rylane/i;

test('onboarding writes canonical companion ids only', () => {
  const screen = read('app/(onboarding)/identity.tsx');

  assert.doesNotMatch(screen, legacyPattern);
  assert.match(screen, /type \{ NamedCompanionId \}/);
  assert.match(screen, /\{ id: 'suhana', label: 'Suhana' \}/);
  assert.match(screen, /\{ id: 'sy', label: 'Sy' \}/);
  assert.match(screen, /useState<NamedCompanionId>\('suhana'\)/);
  assert.match(screen, /setChoice\(next === 'boy' \? 'sy' : 'suhana'\)/);
  assert.match(screen, /\['bip_onboarding_companion', choice\]/);
});

test('canonical identity contract contains no legacy companion ids', () => {
  const identity = read('src/features/sekret/identityContract.ts');
  const canonical = read('src/features/identity/companionIds.ts');

  assert.doesNotMatch(identity, legacyPattern);
  assert.doesNotMatch(canonical, legacyPattern);
  assert.match(canonical, /\['suhana', 'sy', 'cloud', 'night'\]/);
  assert.match(identity, /migratePersistedCompanionId\(identity\)/);
});

test('legacy ids are quarantined to the read-only migration adapter', () => {
  const migration = read('src/features/identity/legacyCompanionIdMigration.ts');

  assert.match(migration, /raylene: 'suhana'/);
  assert.match(migration, /rylane: 'sy'/);
  assert.match(migration, /New writes must never use these legacy keys/);
  assert.doesNotMatch(migration, /AsyncStorage\.setItem|AsyncStorage\.multiSet|supabase\.|fetch\(/);
});
