import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('companion presentation variants never fork canonical companion identity', () => {
  const presentation = read('src/features/identity/companionPresentation.ts');
  const identity = read('src/features/sekret/identityContract.ts');

  assert.equal(presentation.includes("CompanionPresentationVariant = 'girl' | 'boy'"), true);
  assert.equal(presentation.includes("CompanionPresentationMode = CompanionPresentationVariant | 'mixed'"), true);
  assert.equal(presentation.includes("'suhana'"), true);
  assert.equal(presentation.includes("'sy'"), true);
  assert.equal(presentation.includes("'night'"), true);
  assert.equal(presentation.includes("'cloud'"), true);
  assert.equal(presentation.includes('boy-suhana'), false);
  assert.equal(presentation.includes('girl-suhana'), false);

  assert.equal(identity.includes("NamedCompanionId = 'suhana' | 'sy' | 'cloud' | 'night'"), true);
});

test('onboarding stores presentation independently from profile gender and selected companion', () => {
  const screen = read('app/(onboarding)/identity.tsx');

  assert.equal(screen.includes("['bip_onboarding_gender', identity]"), true);
  assert.equal(screen.includes("['bip_onboarding_companion', choice]"), true);
  assert.equal(screen.includes('saveCompanionPresentation'), true);
  assert.equal(screen.includes('presentationModeForProfileGender'), true);
  assert.equal(screen.includes('companion-presentation-mixer'), true);
  assert.equal(screen.includes('Their names and personalities stay the same.'), true);
});

test('My own way exposes independent girl or boy presentation choice per canonical companion', () => {
  const screen = read('app/(onboarding)/identity.tsx');

  assert.equal(screen.includes("identity === 'other'"), true);
  assert.equal(screen.includes('CANONICAL_COMPANION_IDS.map'), true);
  assert.equal(screen.includes('setCompanionVariant(companionId, variant)'), true);
  assert.equal(screen.includes('companion-presentation-${companionId}-${variant}'), true);
});

test('legacy companion keys remain compatibility-only while onboarding renders canonical names', () => {
  const screen = read('app/(onboarding)/identity.tsx');
  const identity = read('src/features/sekret/identityContract.ts');

  assert.equal(screen.includes("{ id: 'raylene', label: 'Suhana' }"), true);
  assert.equal(screen.includes("{ id: 'rylane', label: 'Sy' }"), true);
  assert.equal(screen.includes("label: 'Raylene'"), false);
  assert.equal(screen.includes("label: 'Rylane'"), false);
  assert.equal(identity.includes("raylene: 'suhana'"), true);
  assert.equal(identity.includes("rylane: 'sy'"), true);
});

test('presentation state is cleared with private profile identity cache', () => {
  const cache = read('src/features/identity/clearProfileIdentityCache.ts');
  assert.equal(cache.includes("'bip_companion_presentation_v1'"), true);
});

test('agent identity skill matches current canonical names and presentation invariant', () => {
  const skill = read('.agents/skills/bip-sekret-identity/SKILL.md');

  assert.equal(skill.includes('Suhana / Sy / Cloud / Night = named companions'), true);
  assert.equal(skill.includes('Raylene / Rylane = legacy compatibility aliases only'), true);
  assert.equal(skill.includes('Presentation changes must not rename companions'), true);
  assert.equal(skill.includes('boy-suhana'), true);
});
