import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const WORKFLOW_PATH = '.github/workflows/reconcile-supabase-production-history.yml';
const FOUNDER_COMMAND_PATH = '.github/workflows/app-domain-founder-command.yml';
const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf8');
const founderCommand = fs.readFileSync(FOUNDER_COMMAND_PATH, 'utf8');

const liveVersions = [
  '20260723203050',
  '20260723203116',
  '20260820214601',
  '20260821073219',
  '20260826065736',
];

const canonicalVersions = [
  '20260718035000',
  '20260718035500',
  '20260820211200',
  '20260821071500',
  '20260824223800',
];

const pendingSecurityVersions = [
  '20260827060000',
  '20260827061000',
  '20260827062000',
];

test('history reconciliation is manual, exact-current-main, and production-gated', () => {
  assert.match(workflow, /on:\n  workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n  push:/);
  assert.doesNotMatch(workflow, /\n  pull_request:/);
  assert.match(workflow, /target_sha:/);
  assert.match(workflow, /confirm_project:/);
  assert.match(workflow, /RECONCILE FIVE MIGRATION ALIASES/);
  assert.match(workflow, /environment: production/);
  assert.match(workflow, /group: supabase-production-migrations/);
  assert.match(workflow, /git fetch --no-tags --depth=1 origin main/);
  assert.match(workflow, /Refusing production history reconciliation from a SHA that is no longer current main\./);
  assert.match(workflow, /Main advanced after pre-mutation proof; refusing production history reconciliation\./);
});

test('workflow repairs exactly the five approved alias pairs and no arbitrary input version', () => {
  assert.doesNotMatch(workflow, /repair_version:/);
  assert.doesNotMatch(workflow, /canonical_version:/);
  for (const version of [...liveVersions, ...canonicalVersions]) {
    assert.match(workflow, new RegExp(version));
  }
  assert.match(workflow, /supabase migration repair[\s\S]*--status applied --db-url/);
  assert.match(workflow, /supabase migration repair[\s\S]*--status reverted --db-url/);
});

test('canonical markers are inserted before historical aliases are retired', () => {
  const applyCanonical = workflow.indexOf('- name: Mark canonical versions applied');
  const retireAliases = workflow.indexOf('- name: Retire historical live aliases');
  const postVerify = workflow.indexOf('- name: Verify exact post-reconciliation migration history');
  assert.ok(applyCanonical >= 0);
  assert.ok(retireAliases > applyCanonical);
  assert.ok(postVerify > retireAliases);
});

test('history reconciliation cannot apply migration SQL or pending security migrations', () => {
  const dbPushLines = workflow.split('\n').filter((line) => line.includes('supabase db push'));
  assert.equal(dbPushLines.length, 1);
  assert.match(dbPushLines[0], /--db-url .*--dry-run/);
  assert.doesNotMatch(workflow, /supabase link/);
  assert.doesNotMatch(workflow, /supabase migration up/);
  assert.doesNotMatch(workflow, /apply_migration|psql\s|execute_sql/i);
  for (const version of pendingSecurityVersions) {
    assert.doesNotMatch(workflow, new RegExp(version));
  }
});

test('workflow preserves before, midpoint, after, and dry-run evidence', () => {
  assert.match(workflow, /supabase-migration-list-before-reconciliation\.txt/);
  assert.match(workflow, /supabase-history-canonical-applied\.txt/);
  assert.match(workflow, /supabase-migration-list-mid-reconciliation\.txt/);
  assert.match(workflow, /supabase-history-live-reverted\.txt/);
  assert.match(workflow, /supabase-migration-list-after-reconciliation\.txt/);
  assert.match(workflow, /supabase-db-push-after-history-reconciliation\.txt/);
  assert.match(workflow, /if: always\(\)/);
});

test('workflow uses the IPv4 session-pooler path and no stale Supabase management token', () => {
  assert.equal(workflow.includes('aws-1-us-east-1.pooler.supabase.com'), true);
  assert.match(workflow, /postgres\.\$\{SUPABASE_PROJECT_REF\}/);
  assert.match(workflow, /supabase migration list --db-url/);
  assert.match(workflow, /supabase db push --db-url/);
  assert.doesNotMatch(workflow, /SUPABASE_ACCESS_TOKEN/);
});

test('workflow pins repository and Supabase action identities', () => {
  assert.match(workflow, /actions\/checkout@11d5960a326750d5838078e36cf38b85af677262/);
  assert.match(workflow, /supabase\/setup-cli@ab058987d8d6c725971f6cf9d0b5c98467e30bd1/);
  assert.match(workflow, /version: 2\.113\.0/);
  assert.match(workflow, /actions\/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02/);
  assert.doesNotMatch(workflow, /(?:actions\/checkout|actions\/upload-artifact|supabase\/setup-cli)@v\d+/);
});

test('founder command bridge preserves app-domain command and adds one bounded Supabase history dispatcher', () => {
  assert.match(founderCommand, /actions: write/);
  assert.match(founderCommand, /github\.event\.issue\.number == 925/);
  assert.match(founderCommand, /github\.event\.comment\.user\.login == 'jussray'/);
  assert.match(founderCommand, /\/reconcile-app-domain/);
  assert.match(founderCommand, /reconcile-cloudflare-app-domain\.yml\/dispatches/);
  assert.match(founderCommand, /\/reconcile-supabase-history/);
  assert.match(founderCommand, /reconcile-supabase-production-history\.yml\/dispatches/);
  assert.match(founderCommand, /tbsevonvegdnlyjgplmm/);
  assert.match(founderCommand, /RECONCILE FIVE MIGRATION ALIASES/);
});

test('founder command bridge carries authority but no Supabase credentials or migration execution primitives', () => {
  assert.doesNotMatch(founderCommand, /SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD/);
  assert.doesNotMatch(founderCommand, /supabase migration repair|supabase db push|supabase migration up|execute_sql|apply_migration/i);
  for (const version of pendingSecurityVersions) {
    assert.doesNotMatch(founderCommand, new RegExp(version));
  }
});