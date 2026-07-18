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

test('initialization reuses existing state and handles insert races', async () => {
  const source = await read('services/onboarding.ts');

  assert.match(source, /const existing = await getOnboardingState\(userId\)/);
  assert.match(source, /if \(existing\) return existing/);
  assert.match(source, /\.insert\(\{/);
  assert.doesNotMatch(source, /ignoreDuplicates: true/);
  assert.match(source, /concurrent provider\/screen initialization may have won the insert race/);
  assert.match(source, /const raced = await getOnboardingState\(userId\)/);
});

test('stage writes are forward-only and concurrency-safe', async () => {
  const source = await read('services/onboarding.ts');

  assert.match(source, /if \(nextIndex <= currentIndex\) \{\s*return backfillPassedStageMetadata/);
  assert.match(source, /\.eq\('stage', current\.stage\)/);
  assert.match(source, /if \(!data\) return advanceStage\(userId, payload\)/);
  assert.match(source, /prevents stale fire-and-forget writes[\s\S]*moving the funnel backwards/);
});

test('passed stages can repair missing role and age without regression', async () => {
  const source = await read('services/onboarding.ts');

  assert.match(source, /async function backfillPassedStageMetadata/);
  assert.match(source, /current\.role === 'unknown' && role/);
  assert.match(source, /!current\.age_bucket && typeof payload\.age_bucket === 'string'/);
  assert.match(source, /\.update\(patch\)[\s\S]*\.eq\('stage', current\.stage\)/);
  assert.match(source, /Repair only missing metadata and never lower the current stage/);
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

test('context advances through the service even while its state snapshot is loading', async () => {
  const context = await read('context/OnboardingContext.tsx');

  assert.match(context, /if \(!user\?\.id\) return/);
  assert.doesNotMatch(context, /if \(!user\?\.id \|\| !state\) return/);
  assert.match(context, /Do not depend on the React state snapshot/);
  assert.match(context, /const updated = await advanceStage\(user\.id, \{ stage, \.\.\.extras \}\)/);
  assert.match(context, /\[user\?\.id\]/);
});

test('age screen keeps pre-auth choices local and supports permanent-account recovery', async () => {
  const age = await read('app/(onboarding)/age.tsx');

  assert.match(age, /Pre-auth selections\s*\n\s*\/\/ stay local and are replayed by consent\.tsx/);
  assert.match(age, /if \(error \|\| !data\.user \|\| data\.user\.is_anonymous\) return null/);
  assert.match(age, /advanceStage\(userId, 'age_verified', \{ age_bucket: selected \}\)/);
  assert.match(age, /advanceStage\(userId, 'role_selected', \{ role: 'teen' \}\)/);
  assert.match(age, /router\.push\('\/\(auth\)\/signup\?side=teen'/);
});

test('consent replays durable age and role milestones after permanent auth', async () => {
  const consent = await read('app/(onboarding)/consent.tsx');

  const consentIndex = consent.indexOf("await advance('consent_complete')");
  const ageIndex = consent.indexOf("await advance('age_verified', { age_bucket: storedAge })");
  const teenRoleIndex = consent.indexOf("await advance('role_selected', { role: 'teen' })");
  const parentRoleIndex = consent.indexOf("await advance('role_selected', { role: 'parent' })");

  assert.ok(consentIndex >= 0);
  assert.ok(ageIndex > consentIndex);
  assert.ok(teenRoleIndex > ageIndex);
  assert.ok(parentRoleIndex > consentIndex);
  assert.match(consent, /if \(!isStoredAgeRange\(storedAge\)\) \{\s*router\.replace\('\/\(onboarding\)\/age'\)/);
  assert.match(consent, /Replay any local\s*\n\s*\/\/ pre-signup role\/age choices only after the permanent account exists/);
});
