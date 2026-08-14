import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const WORKFLOW_PATH = '.github/workflows/deploy-supabase-migrations.yml';
const workflow = fs.readFileSync(WORKFLOW_PATH, 'utf8');

function indexOfRequired(fragment) {
  const index = workflow.indexOf(fragment);
  assert.notEqual(index, -1, `Expected workflow to contain: ${fragment}`);
  return index;
}

function stepBlock(name, nextName) {
  const start = indexOfRequired(`- name: ${name}`);
  const end = nextName ? indexOfRequired(`- name: ${nextName}`) : workflow.length;
  assert.ok(start < end, `${name} must appear before ${nextName ?? 'workflow end'}.`);
  return workflow.slice(start, end);
}

test('production migration workflow is manual and dry-run by default', () => {
  assert.match(workflow, /on:\n  workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n  push:/);
  assert.doesNotMatch(workflow, /\n  pull_request:/);
  assert.match(workflow, /target_sha:/);
  assert.match(workflow, /mode:[\s\S]*?default: dry-run/);
  assert.match(workflow, /- dry-run\n\s+- apply\n\s+- normalize-alias/);
  assert.match(workflow, /confirm_project:/);
  assert.match(workflow, /apply_confirmation:/);
  assert.match(workflow, /canonical_version:/);
  assert.match(workflow, /execution_version:/);
  assert.match(workflow, /normalize_confirmation:/);
  assert.match(workflow, /environment: production/);
  assert.match(workflow, /cancel-in-progress: false/);
});

test('production migration workflow pins project and CLI while scoping secrets to required steps', () => {
  assert.match(workflow, /SUPABASE_PROJECT_REF: tbsevonvegdnlyjgplmm/);
  assert.match(workflow, /uses: supabase\/setup-cli@v1[\s\S]*?version: 2\.113\.0/);

  const workflowEnv = workflow.match(/\nenv:\n([\s\S]*?)\n\nconcurrency:/)?.[1] ?? '';
  assert.doesNotMatch(workflowEnv, /SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD/);

  const setupCli = stepBlock('Set up Supabase CLI', 'Verify production credentials');
  assert.doesNotMatch(setupCli, /secrets\.SUPABASE_ACCESS_TOKEN|secrets\.SUPABASE_DB_PASSWORD/);

  for (const [name, nextName] of [
    ['Verify production credentials', 'Link exact production project'],
    ['Link exact production project', 'Preview production migration plan'],
    ['Preview production migration plan', 'Verify production schema before alias normalization'],
    ['Capture migration history before alias normalization', 'Re-verify current main immediately before mutation'],
    ['Apply production migrations', 'Normalize canonical applied migration receipt'],
    ['Normalize canonical applied migration receipt', 'Remove superseded execution receipt'],
    ['Remove superseded execution receipt', 'Capture migration history after alias normalization'],
    ['Capture migration history after alias normalization', 'Verify normalized history matches repository migration plan'],
    ['Verify normalized history matches repository migration plan', 'Verify exact production schema after mutation'],
  ]) {
    const block = stepBlock(name, nextName);
    assert.match(block, /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
    assert.match(block, /SUPABASE_DB_PASSWORD: \$\{\{ secrets\.SUPABASE_DB_PASSWORD \}\}/);
  }

  for (const [name, nextName] of [
    ['Verify production schema before alias normalization', 'Capture migration history before alias normalization'],
    ['Verify exact production schema after mutation', 'Retain migration evidence'],
  ]) {
    const witness = stepBlock(name, nextName);
    assert.match(witness, /SUPABASE_ACCESS_TOKEN: \$\{\{ secrets\.SUPABASE_ACCESS_TOKEN \}\}/);
    assert.doesNotMatch(witness, /SUPABASE_DB_PASSWORD/);
  }

  const upload = stepBlock('Retain migration evidence');
  assert.doesNotMatch(upload, /secrets\.SUPABASE_ACCESS_TOKEN|secrets\.SUPABASE_DB_PASSWORD/);
  assert.match(workflow, /test -n "\$SUPABASE_ACCESS_TOKEN"/);
  assert.match(workflow, /test -n "\$SUPABASE_DB_PASSWORD"/);
  assert.match(workflow, /supabase link --project-ref "\$SUPABASE_PROJECT_REF"/);
});

test('apply and applied-alias normalization are explicit exact-current-main mutations', () => {
  assert.match(workflow, /test "\$APPLY_CONFIRMATION" = 'APPLY PRODUCTION MIGRATIONS'/);
  assert.match(workflow, /test "\$NORMALIZE_CONFIRMATION" = 'NORMALIZE APPLIED MIGRATION ALIAS'/);
  assert.match(workflow, /canonical_matches=\(supabase\/migrations\/"\$\{CANONICAL_VERSION\}"_\*\.sql\)/);
  assert.match(workflow, /execution_matches=\(supabase\/migrations\/"\$\{EXECUTION_VERSION\}"_\*\.sql\)/);
  assert.match(workflow, /test "\$\{#canonical_matches\[@\]\}" -eq 1/);
  assert.match(workflow, /test "\$\{#execution_matches\[@\]\}" -eq 0/);
  assert.match(workflow, /PRODUCTION_HISTORY_APPLIED_ALIASES/);
  assert.match(workflow, /PRODUCTION_HISTORY_APPLIED_ALIASES\[canonical\] !== execution/);

  const mainFetches = workflow.match(/git fetch --no-tags --depth=1 origin main/g) ?? [];
  assert.equal(mainFetches.length, 2, 'Current-main authority must be checked before provider access and again immediately before mutation.');
  assert.match(workflow, /Refusing to evaluate production migrations from a SHA that is no longer current main\./);
  assert.match(workflow, /Main advanced after pre-mutation proof; refusing production migration mutation\./);
  assert.match(workflow, /if: \$\{\{ inputs\.mode == 'apply' \|\| inputs\.mode == 'normalize-alias' \}\}/);
});

test('alias normalization requires a green pre-witness, reviewed mapping, and canonical remote history', () => {
  const aliasValidation = indexOfRequired('Validate reviewed applied alias belongs to exact target');
  const preWitness = indexOfRequired('Verify production schema before alias normalization');
  const before = indexOfRequired('supabase migration list --linked 2>&1 | tee artifacts/supabase-migration-list-before-normalize.txt');
  const recheck = indexOfRequired('Re-verify current main immediately before mutation');
  const canonicalRepair = indexOfRequired('supabase migration repair "$CANONICAL_VERSION" --status applied --linked');
  const executionRepair = indexOfRequired('supabase migration repair "$EXECUTION_VERSION" --status reverted --linked');
  const after = indexOfRequired('supabase migration list --linked 2>&1 | tee artifacts/supabase-migration-list-after-normalize.txt');
  const dryRun = indexOfRequired('Verify normalized history matches repository migration plan');
  const postWitness = indexOfRequired('Verify exact production schema after mutation');

  assert.ok(aliasValidation < preWitness, 'Reviewed alias identity must be established before live schema proof.');
  assert.ok(preWitness < before, 'Production schema must already verify before history normalization.');
  assert.ok(before < recheck, 'Remote history must be retained before the final authority check.');
  assert.ok(recheck < canonicalRepair, 'Current main must be re-verified immediately before history mutation.');
  assert.ok(canonicalRepair < executionRepair, 'Canonical history must be recorded before the execution alias is removed.');
  assert.ok(executionRepair < after, 'Remote history must be retained after both repair operations.');
  assert.ok(after < dryRun, 'Post-normalization dry-run must inspect the repaired migration plan.');
  assert.ok(dryRun < postWitness, 'Exact production schema witness must execute after normalized history is proven.');

  assert.doesNotMatch(workflow, /repair_version:/);
  assert.doesNotMatch(workflow, /--include-all/);
  assert.doesNotMatch(workflow, /--include-seed/);
  assert.doesNotMatch(workflow, /psql\s|execute_sql|apply_migration/);
});

test('apply still requires preview, immediate authority recheck, and exact post-apply witness', () => {
  const previewStep = stepBlock('Preview production migration plan', 'Verify production schema before alias normalization');
  assert.match(previewStep, /if: \$\{\{ inputs\.mode != 'normalize-alias' \}\}/);

  const dryRun = indexOfRequired('supabase db push --linked --dry-run 2>&1 | tee artifacts/supabase-db-push-dry-run.txt');
  const recheck = indexOfRequired('Re-verify current main immediately before mutation');
  const apply = indexOfRequired('supabase db push --linked 2>&1 | tee artifacts/supabase-db-push-apply.txt');
  const witness = indexOfRequired('Verify exact production schema after mutation');

  assert.ok(dryRun < recheck, 'Dry-run must execute before the final current-main authority check.');
  assert.ok(recheck < apply, 'Current main must be re-verified immediately before production apply.');
  assert.ok(apply < witness, 'Exact production schema witness must execute after apply.');
});

test('migration evidence is retained without weakening failed runs', () => {
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /artifacts\/supabase-db-push-dry-run\.txt/);
  assert.match(workflow, /artifacts\/supabase-db-push-apply\.txt/);
  assert.match(workflow, /artifacts\/supabase-migration-list-before-normalize\.txt/);
  assert.match(workflow, /artifacts\/supabase-migration-normalize-canonical\.txt/);
  assert.match(workflow, /artifacts\/supabase-migration-normalize-execution\.txt/);
  assert.match(workflow, /artifacts\/supabase-migration-list-after-normalize\.txt/);
  assert.match(workflow, /artifacts\/supabase-production-schema\.json/);
});
