import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const entrypoint = fs.readFileSync('AGENTS_FOUNDER_INTELLIGENCE.md', 'utf8');
const agents = fs.readFileSync('AGENTS.md', 'utf8');
const founderDevFlow = fs.readFileSync('.agents/skills/founder-dev-flow/SKILL.md', 'utf8');

const canonicalCommands = [
  '/goalfix',
  '/ultrathink',
  '/truthmode',
  '/confess',
  '/redteam',
  '/lindymode',
  '/ooda',
  '/visualize',
];

test('Founder Intelligence exposes the portable Juss OS command surface', () => {
  for (const command of canonicalCommands) {
    assert.match(entrypoint, new RegExp(command.replace('/', '\\/')));
  }
});

test('portable commands cannot weaken Se’kret Bip authority and safety boundaries', () => {
  assert.match(entrypoint, /reasoning and planning modes only/);
  assert.match(entrypoint, /teen privacy, consent, dignity, anti-surveillance/);
  assert.match(entrypoint, /remain stricter and always win/);
  assert.match(entrypoint, /never create tool access/);
  assert.match(entrypoint, /generated visual is not proof of auth, consent, RLS/);
  assert.match(entrypoint, /figma-build-implement\/SKILL\.md/);
});

test('portable adapter preserves the mandatory Se’kret engineering and merge proof spine', () => {
  assert.match(agents, /AGENTS_FOUNDER_INTELLIGENCE\.md/);
  assert.match(entrypoint, /founder-dev-flow\/SKILL\.md/);
  assert.match(agents, /Playwright passed for changed user-facing web\/runtime paths or is explicitly inapplicable/);
  assert.match(founderDevFlow, /Merge only with an exact-head guard/);
  assert.match(founderDevFlow, /smallest reversible change/);
  assert.match(founderDevFlow, /teen privacy, consent, identity/);
});
