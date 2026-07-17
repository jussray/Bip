import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

const scanner = read('scripts/control-room-ingest-github-failures.mjs');
const docs = read('docs/CONTROL_ROOM_GITHUB_FAILURES.md');
const packageJson = JSON.parse(read('package.json'));

test('GitHub failures route through Founder Control Room first', () => {
  assert.match(scanner, /Founder Control Room is the first escalation surface whenever GitHub fails/);
  assert.match(scanner, /github_actions_/);
  assert.match(scanner, /upsert_control_room_issue/);
  assert.match(scanner, /audit_events/);
  assert.match(docs, /Every GitHub failure must be checked against Founder Control Room first/);
});

test('runner-startup failures are not mislabeled as code regressions', () => {
  assert.match(scanner, /runner_startup_failure/);
  assert.match(scanner, /workflow_no_jobs/);
  assert.match(scanner, /workflow_step_failure/);
  assert.match(scanner, /A run with no executed steps or logs is infrastructure evidence, not proof of a code regression/);
  assert.match(scanner, /do not change application code until a real failing step or log exists/);
  assert.match(docs, /This is infrastructure evidence\. It is not proof of a code regression/);
});

test('GitHub failure reports retain exact PR and head evidence', () => {
  for (const field of [
    'pr_number',
    'pr_url',
    'head_ref',
    'head_sha',
    'workflow_name',
    'run_id',
    'run_url',
    'failure_class',
    'jobs',
  ]) {
    assert.match(scanner, new RegExp(field));
  }
  assert.match(scanner, /github-failures-latest\.json/);
  assert.match(scanner, /github_actions:\$\{item\.repository\}:pr-\$\{item\.pr_number\}/);
});

test('credentials stay server-side and out of issue metadata', () => {
  assert.match(scanner, /process\.env\.GH_TOKEN \|\| process\.env\.GITHUB_TOKEN/);
  assert.match(scanner, /process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(scanner, /EXPO_PUBLIC_GITHUB/);
  assert.doesNotMatch(scanner, /githubToken[,}]/);
  assert.doesNotMatch(scanner, /serviceRoleKey[,}]/);
  assert.match(scanner, /credentials are read only from server-side environment variables and are never written to reports or issue metadata/);
  assert.match(docs, /Tokens and keys must never enter React Native, Expo public variables, reports, audit metadata, PR comments, or committed files/);
});

test('scan and ingest commands are explicitly exposed', () => {
  assert.equal(
    packageJson.scripts['control-room:github-failures:scan'],
    'node scripts/control-room-ingest-github-failures.mjs',
  );
  assert.equal(
    packageJson.scripts['control-room:github-failures:ingest'],
    'CONTROL_ROOM_GITHUB_INGEST=1 node scripts/control-room-ingest-github-failures.mjs',
  );
});
