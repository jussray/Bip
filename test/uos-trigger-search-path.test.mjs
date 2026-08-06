import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const historicalPath = 'docs/migration-history/onboarding/20260718040638_onboarding_state.live.sql';
const hardeningPath = 'supabase/migrations/20260806024500_harden_uos_set_updated_at_search_path.sql';

test('uos_set_updated_at keeps its existing invoker trigger contract', async () => {
  const historical = await read(historicalPath);
  const fn = historical.match(/create or replace function public\.uos_set_updated_at\(\)[\s\S]*?\$\$;/i)?.[0] ?? '';

  assert.match(fn, /returns trigger language plpgsql/i);
  assert.match(fn, /new\.updated_at = now\(\)/i);
  assert.doesNotMatch(fn, /security definer/i);
  assert.match(
    historical,
    /before update on public\.user_onboarding_state[\s\S]*execute function public\.uos_set_updated_at\(\)/i,
  );
});

test('follow-up migration pins only the effective uos trigger search path', async () => {
  const migration = await read(hardeningPath);
  const executableSql = migration.replace(/--.*$/gm, '');

  assert.match(
    executableSql,
    /alter function public\.uos_set_updated_at\(\)\s+set search_path = pg_catalog, pg_temp\s*;/i,
  );
  assert.doesNotMatch(executableSql, /create\s+or\s+replace\s+function/i);
  assert.doesNotMatch(executableSql, /security\s+(definer|invoker)/i);
  assert.doesNotMatch(executableSql, /\b(revoke|grant)\b/i);
  assert.doesNotMatch(executableSql, /\b(drop|create)\s+trigger\b/i);
  assert.equal((executableSql.match(/alter\s+function/gi) ?? []).length, 1);
});
