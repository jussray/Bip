import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('advanceStage supports payload and ergonomic stage call forms', async () => {
  const source = await read('services/onboarding.ts');

  assert.match(source, /payload: StageAdvancePayload/);
  assert.match(source, /stage: OnboardingStage,\s*\n\s*extras\?: StageAdvanceExtras/);
  assert.match(source, /payloadOrStage: StageAdvancePayload \| OnboardingStage/);
  assert.match(source, /typeof payloadOrStage === 'string'/);
  assert.match(source, /\{ stage: payloadOrStage, \.\.\.extras \}/);
});

test('stage writes are forward-only and concurrency-safe', async () => {
  const source = await read('services/onboarding.ts');

  assert.match(source, /if \(nextIndex <= currentIndex\) return current/);
  assert.match(source, /\.eq\('stage', current\.stage\)/);
  assert.match(source, /if \(!data\) return advanceStage\(userId, payload\)/);
  assert.match(source, /prevents stale fire-and-forget writes[\s\S]*moving the funnel backwards/);
});

test('role-specific milestones persist the correct account side', async () => {
  const source = await read('services/onboarding.ts');

  for (const stage of ['parent_linked', 'parent_link_skipped', 'parent_setup_complete']) {
    assert.match(source, new RegExp(`payload\\.stage === '${stage}'`));
  }
  assert.match(source, /if \(payload\.stage === 'parent_link_sent'\) return 'teen'/);
  assert.match(source, /const role = inferredRole\(payload\) \?\? current\.role/);
});

test('parent-link code updates cannot directly regress the stage', async () => {
  const source = await read('services/onboarding.ts');
  const functionBody = source.match(/export async function setParentLinkCode[\s\S]*?\n}\n\nexport async function completeParentLink/)?.[0] ?? '';

  assert.match(functionBody, /\.update\(\{ parent_link_code: code \}\)/);
  assert.doesNotMatch(functionBody, /parent_link_code: code, stage:/);
  assert.match(functionBody, /await advanceStage\(userId, 'parent_link_sent'\)/);
});

test('name-to-identity timing is recorded on identity transition', async () => {
  const source = await read('services/onboarding.ts');

  assert.match(source, /payload\.stage === 'identity_set' && current\.stage === 'name_set'/);
  assert.doesNotMatch(source, /payload\.stage === 'reflection_complete' && current\.stage === 'name_set'/);
});
