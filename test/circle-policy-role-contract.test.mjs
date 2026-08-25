import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  'supabase/migrations/20260824223800_restore_circle_authenticated_policy_roles.sql',
  'utf8',
);
const executableMigration = migration.replace(/--[^\n]*/gu, '');

const requiredPolicies = [
  ['circles select owner or member', 'public.circles'],
  ['circles insert own', 'public.circles'],
  ['posts select by circle visibility', 'public.posts'],
  ['posts insert by author', 'public.posts'],
];

test('Circle policies are explicitly restored to authenticated', () => {
  for (const [policy, table] of requiredPolicies) {
    const escapedPolicy = policy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedTable = table.replace('.', '\\.');
    const pattern = new RegExp(
      `alter\\s+policy\\s+"${escapedPolicy}"\\s+on\\s+${escapedTable}\\s+to\\s+authenticated`,
      'iu',
    );
    assert.match(migration, pattern, `${policy} must be scoped to authenticated`);
  }
});

test('the repair does not add anon or public policy roles', () => {
  assert.doesNotMatch(executableMigration, /\bto\s+(?:anon|public)\b/iu);
});
