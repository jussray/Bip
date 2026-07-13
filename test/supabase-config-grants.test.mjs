import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrationPath = path.join(
  root,
  'supabase',
  'migrations',
  '20260713011803_harden_config_table_grants.sql',
);
const sql = fs.readFileSync(migrationPath, 'utf8');

test('config grant migration keeps RLS enabled on both server-owned tables', () => {
  assert.match(sql, /alter table public\.app_config enable row level security;/i);
  assert.match(sql, /alter table public\.app_private_config enable row level security;/i);
});

test('config grant migration revokes every client and PUBLIC table privilege', () => {
  assert.match(
    sql,
    /revoke all privileges\s+on table public\.app_config, public\.app_private_config\s+from public, anon, authenticated;/i,
  );
  assert.doesNotMatch(sql, /grant\s+.+\s+to\s+(anon|authenticated|public)\b/i);
});

test('config grant migration preserves explicit service-role access', () => {
  assert.match(
    sql,
    /grant all privileges\s+on table public\.app_config, public\.app_private_config\s+to service_role;/i,
  );
});

test('config grant migration does not add client policies or mutate configuration rows', () => {
  assert.doesNotMatch(sql, /create\s+policy/i);
  assert.doesNotMatch(sql, /^\s*(insert|update|delete|truncate)\b/im);
});

test('config grant migration documents server-only intent', () => {
  assert.match(sql, /comment on table public\.app_config/i);
  assert.match(sql, /comment on table public\.app_private_config/i);
  assert.match(sql, /Client roles have no table privileges and no RLS policies/i);
});
