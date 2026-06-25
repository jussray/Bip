import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

test('account gate blocks app data until age gate and profile resolve', () => {
  const app = read('app/index.tsx');
  assert.match(app, /<AgeGate[\s\S]*<AccountGate[\s\S]*<SleepGate/, 'flow must be AgeGate → AccountGate → app gates');
  assert.match(app, /if \(ageGateStatus !== 'teen' && ageGateStatus !== 'guardian'\) return;/, 'cloud restore must wait for age gate');
  assert.match(app, /if \(!accountReady\) return;/, 'cloud restore must wait for account/profile readiness');
});

test('private account schema separates real identity from public Bip identity', () => {
  const schema = read('db/schema.sql');
  assert.match(schema, /create table if not exists public\.accounts/);
  assert.match(schema, /id\s+uuid\s+primary key references auth\.users\(id\)/);
  assert.match(schema, /email\s+text\s+not null/);
  assert.match(schema, /first_name\s+text\s+not null/);
  assert.match(schema, /anonymous_handle\s+text\s+not null/);
  assert.match(schema, /bip_id\s+text\s+not null unique/);
  assert.match(schema, /for select using \(auth\.uid\(\) = id\)/, 'accounts select must be owner-only');
  assert.doesNotMatch(schema, /accounts_public/i, 'accounts must not expose public real-identity reads');
});

test('owned sync tables are scoped to auth.uid through user_id', () => {
  const schema = read('db/schema.sql');
  for (const table of ['mood_history', 'journal_entries', 'circle_posts', 'voice_notes', 'comfort_sessions', 'crew_members', 'crew_check_ins']) {
    const start = schema.indexOf(`create table if not exists public.${table}`);
    assert.notEqual(start, -1, `${table} table exists`);
    const end = schema.indexOf(');', start);
    const block = schema.slice(start, end);
    assert.match(block, /user_id\s+uuid\s+not null references auth\.users\(id\)/, `${table} must belong to auth.users`);
    assert.match(schema, new RegExp(`create policy "${table}_self"[\\s\\S]*auth\\.uid\\(\\) = user_id`), `${table} must have owner-only RLS policy`);
  }
});

test('public and trusted identity contexts are explicit in UI rules', () => {
  const account = read('utils/account.ts');
  const app = read('app/index.tsx');
  const crew = read('screens/BipCrewScreen.tsx');
  assert.match(account, /public_circle[\s\S]*anonymousHandle/, 'public circle must resolve to anonymous handle');
  assert.match(account, /trusted_friend[\s\S]*firstName/, 'trusted friend context may resolve to first name');
  assert.match(app, /anonymousName:\s*publicIdentity\.label/, 'Circle posts must use public identity label');
  assert.match(crew, /No name search\./, 'Bip Crew invite UI must prevent real-name search');
  assert.match(crew, /connectionStatus === 'accepted' \? mem\.name : \(mem\.bipId \|\| 'pending Bip ID'\)/, 'Bip Crew should show first name only after acceptance');
  assert.match(app, /visibility:\s*extra\?\.visibility \?\? 'public_circle'/, 'Circle posts must default to public visibility');
});
