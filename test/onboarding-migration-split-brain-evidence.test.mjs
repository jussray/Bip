import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const livePath = 'docs/migration-history/onboarding/20260718040638_onboarding_state.live.sql';
const repoStatePath = 'docs/migration-history/onboarding/20260718000000_onboarding_state.repository.sql';
const repoMoodPath = 'docs/migration-history/onboarding/20260718000001_onboarding_mood_log_trigger.repository.sql';
const observationPath = 'docs/migration-history/onboarding/production-observation-2026-07-18.json';

test('repository migration archives are exact content copies', async () => {
  const [activeState, archivedState, activeMood, archivedMood] = await Promise.all([
    read('supabase/migrations/20260718000000_onboarding_state.sql'),
    read(repoStatePath),
    read('supabase/migrations/20260718000001_onboarding_mood_log_trigger.sql'),
    read(repoMoodPath),
  ]);

  assert.equal(archivedState, activeState);
  assert.equal(archivedMood, activeMood);
});

test('live baseline evidence preserves the observed remote contract', async () => {
  const live = await read(livePath);

  for (const stage of [
    'signup',
    'welcome_seen',
    'consent_complete',
    'age_confirmed',
    'parent_link_complete',
    'activated',
    'offboarded',
  ]) {
    assert.ok(live.includes(`'${stage}'`), `missing live stage ${stage}`);
  }

  assert.match(live, /user_id\s+uuid PRIMARY KEY/);
  assert.match(live, /FOR ALL USING \(auth\.uid\(\) = user_id\)/);
  assert.match(live, /CREATE OR REPLACE FUNCTION public\.uos_set_updated_at/);
  assert.doesNotMatch(live, /age_bucket|parent_link_sent|steady_state|handle_first_mood_log/);
});

test('evidence document fails closed on execution and unsafe enum mapping', async () => {
  const doc = await read('docs/ONBOARDING_MIGRATION_RECONCILIATION.md');

  assert.match(doc, /evidence and planning only/);
  assert.match(doc, /All SQL under `docs\/migration-history\/onboarding\/` is inert historical evidence/);
  assert.match(doc, /`offboarded` \| none \| must fail\/manual review/);
  assert.match(doc, /Do not merge or apply them as live reconciliation/);
  assert.match(doc, /Production remains untouched/);
});

test('read-only parity probe contains no mutation statements', async () => {
  const probe = await read('supabase/probes/onboarding_migration_split_brain.sql');

  assert.match(probe, /^begin transaction read only;/m);
  assert.match(probe, /^rollback;/m);
  assert.match(probe, /Aggregate-only row witnesses/);
  assert.doesNotMatch(probe, /^\s*(insert|update|delete|alter|create|drop|grant|revoke|truncate)\b/gim);
  assert.doesNotMatch(probe, /select\s+\*/i);
});

test('retained production observation is aggregate-only and fail-closed', async () => {
  const observation = JSON.parse(await read(observationPath));

  assert.equal(observation.observationMode, 'read_only_catalog_and_aggregate');
  assert.equal(observation.migrationHistory.liveVersion, '20260718040638');
  assert.deepEqual(observation.migrationHistory.repositoryVersionsAbsentLive, [
    '20260718000000',
    '20260718000001',
  ]);
  assert.equal(observation.aggregateState.onboardingRows, 0);
  assert.equal(observation.aggregateState.moodRows, 0);
  assert.equal(observation.privacy.identifiersRetrieved, false);
  assert.equal(observation.privacy.rowContentRetrieved, false);
  assert.equal(observation.mutation.ddlExecuted, false);
  assert.equal(observation.mutation.dmlExecuted, false);
  assert.equal(observation.decision, 'hold_for_development_branch_reconciliation');
});

test('live and repository stage contracts are intentionally distinct evidence', async () => {
  const [live, repository] = await Promise.all([
    read(livePath),
    read(repoStatePath),
  ]);

  assert.notEqual(live, repository);
  assert.match(live, /'signup'/);
  assert.doesNotMatch(live, /'signed_up'/);
  assert.match(repository, /'signed_up'/);
  assert.doesNotMatch(repository, /'signup'/);
  assert.match(repository, /age_bucket/);
  assert.doesNotMatch(live, /age_bucket/);
});

test('evidence artifacts stay outside the ordered migration directory', async () => {
  for (const path of [livePath, repoStatePath, repoMoodPath, observationPath]) {
    assert.ok(path.startsWith('docs/migration-history/onboarding/'));
    assert.ok(!path.startsWith('supabase/migrations/'));
  }
});
