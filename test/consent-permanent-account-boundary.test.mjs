import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migrationPath = 'supabase/migrations/20260826005500_harden_consent_permanent_account_boundary.sql';
const readMigration = () => readFile(new URL(`../${migrationPath}`, import.meta.url), 'utf8');
const readConsentScreen = () => readFile(new URL('../app/(onboarding)/consent.tsx', import.meta.url), 'utf8');

test('consent read policies reject anonymous-authenticated sessions', async () => {
  const sql = await readMigration();

  assert.match(sql, /create policy "Users read own consents"[\s\S]*public\.is_non_anonymous_user\(\)[\s\S]*auth\.uid\(\)\) = user_id/);
  assert.match(sql, /create policy "Users read own audit log"[\s\S]*public\.is_non_anonymous_user\(\)[\s\S]*auth\.uid\(\)\) = user_id/);
});

test('record_user_consent checks permanent account before durable writes', async () => {
  const sql = await readMigration();
  const start = sql.indexOf('create or replace function public.record_user_consent');
  const body = sql.slice(start, sql.indexOf('\nrevoke all on function', start));
  const guard = body.indexOf('not public.is_non_anonymous_user()');
  const firstWrite = body.indexOf('insert into public.user_consents');

  assert.ok(guard >= 0, 'missing permanent-account guard');
  assert.ok(firstWrite > guard, 'guard must run before consent persistence');
  assert.match(body, /raise exception 'permanent_account_required' using errcode = '42501'/);
});

test('server boundary mirrors onboarding redirect for anonymous auth users', async () => {
  const source = await readConsentScreen();

  assert.match(source, /!data\.user \|\| data\.user\.is_anonymous/);
  assert.match(source, /router\.replace\(`\/\(auth\)\/signup\?side=\$\{side\}`/);
});

test('consent RPC remains client-callable only behind in-function authorization', async () => {
  const sql = await readMigration();

  assert.match(sql, /revoke all on function public\.record_user_consent\(text,boolean,text\) from public, anon/);
  assert.match(sql, /grant execute on function public\.record_user_consent\(text,boolean,text\) to authenticated/);
});