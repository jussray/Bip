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

test('sign-out clears private local state and blocks next-user sync until profile ready', () => {
  const app = read('app/index.tsx');
  const account = read('utils/account.ts');
  const storage = read('utils/storage.ts');
  const settings = read('screens/SettingsScreen.tsx');

  assert.match(account, /signOutAndClearLocalState/, 'central sign-out helper must exist');
  assert.match(account, /auth\.signOut\(\)/, 'central helper must sign out from Supabase auth');
  assert.match(account, /clearPrivateLocalState\(\)[\s\S]*auth\.signOut\(\)[\s\S]*clearPrivateLocalState\(\)/, 'helper must clear local private data around auth sign-out');
  for (const key of ['accountProfile', 'journalText', 'entries', 'voiceNotes', 'circlePosts', 'crewMembers', 'crewCheckIns', 'streakDays', 'roomMemory', 'oracleProfile', 'oracleJournalEntries', 'parentPagesEntries', 'parentCirclePosts', 'notificationPreferences']) {
    assert.match(storage, new RegExp(`STORAGE_KEYS\\.${key}`), `${key} must be in private clear list`);
  }
  assert.match(app, /setAccountReady\(false\)/, 'sign-out reset must mark account not ready');
  assert.match(app, /setJournalEntries\(\[\]\)[\s\S]*setVoiceNotes\(\[\]\)[\s\S]*setCrewMembers\(\[\]\)/, 'in-memory private arrays must reset');
  assert.match(app, /setScreen\('splash'\)/, 'sign-out reset must leave app routes');
  assert.match(app, /if \(!accountReady\) return;/, 'boot sync must remain blocked until User B profile is ready');
  assert.match(settings, /Sign out \+ clear private data/, 'Settings must expose true sign-out');
});

test('parent teen linking is invite-only and permission scoped', () => {
  const schema = read('db/schema.sql');
  const parentLinks = read('utils/parentLinks.ts');
  const parentBridge = read('screens/ParentBridgeScreen.tsx');
  const teenBridge = read('screens/BridgeScreen.tsx');
  const storage = read('utils/storage.ts');

  assert.match(parentBridge, /cannot search by real name or email/i, 'parent UI must forbid name/email search');
  assert.match(teenBridge, /approve or block the request/i, 'teen invite copy must require teen approval');
  assert.match(parentLinks, /status:\s*'pending'/, 'parent invite request must start pending');
  assert.match(parentLinks, /canGuardianAccessSharedContent[\s\S]*status === 'approved'[\s\S]*permissions\.includes/, 'guardian access must require approved link plus explicit permission');
  assert.match(parentLinks, /status === 'approved' \? permissions : \[\]/, 'blocked/removed links must drop permissions immediately');
  assert.match(schema, /parent_teen_links[\s\S]*status\s+text[\s\S]*pending[\s\S]*approved[\s\S]*blocked[\s\S]*removed/, 'schema must model all link statuses');
  assert.match(schema, /teen_guardian_shares[\s\S]*share_kind[\s\S]*mood_summary[\s\S]*journal_entry[\s\S]*voice_summary[\s\S]*safety_alert[\s\S]*streaks_rewards/, 'shared content must be explicit typed summaries');
  assert.match(schema, /teen_guardian_shares_linked_guardian_select[\s\S]*l\.guardian_id = auth\.uid\(\)[\s\S]*l\.status = 'approved'[\s\S]*share_kind = any\(l\.permissions\)/, 'RLS must block unlinked or unapproved guardian reads');
  assert.doesNotMatch(schema, /parent_teen_links[\s\S]{0,500}(first_name|email)/, 'parent links must not search/store teen real name or email');
  assert.match(storage, /STORAGE_KEYS\.parentTeenLinks[\s\S]*STORAGE_KEYS\.teenGuardianShares/, 'logout must clear parent/teen link caches');
  assert.doesNotMatch(parentLinks, /crew/i, 'parent/guardian permissions must not reuse Bip Crew permissions');
});
