import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const migrationPath = 'supabase/migrations/20260705010000_crew_accountability.sql';
const migration = fs.readFileSync(migrationPath, 'utf8');

test('Crew accountability migration reconstructs live identity columns before policies use them', () => {
  const memberColumn = migration.indexOf('add column if not exists member_user_id uuid');
  const acceptedAtColumn = migration.indexOf('add column if not exists accepted_at timestamptz');
  const memberForeignKey = migration.indexOf('foreign key (member_user_id) references auth.users(id) on delete set null');
  const firstMemberPolicyUse = migration.indexOf('cm.member_user_id = shared_with');

  assert.ok(memberColumn >= 0, 'member_user_id reconstruction is required for fresh replay');
  assert.ok(acceptedAtColumn >= 0, 'accepted_at reconstruction is required by later Crew hardening');
  assert.ok(memberForeignKey >= 0, 'member_user_id must retain the live auth.users ON DELETE SET NULL contract');
  assert.ok(firstMemberPolicyUse >= 0, 'expected Crew policy reference was not found');

  assert.ok(memberColumn < firstMemberPolicyUse, 'member_user_id must exist before RLS policy creation');
  assert.ok(acceptedAtColumn < firstMemberPolicyUse, 'accepted_at should be reconstructed with the Crew identity contract');
  assert.ok(memberForeignKey < firstMemberPolicyUse, 'member_user_id FK must exist before policy creation');
});
