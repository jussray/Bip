import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const migrationPath = 'supabase/migrations/20260717034535_create_voice_runtime_foundation.sql';

test('voice runtime migration creates the four telemetry tables with RLS', async () => {
  const migration = await read(migrationPath);

  for (const table of [
    'voice_sessions',
    'voice_turns',
    'voice_events',
    'voice_latency_metrics',
  ]) {
    assert.match(migration, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }

  assert.match(migration, /voice_sessions_user_started_idx/);
  assert.match(migration, /voice_turns_session_index_idx/);
  assert.match(migration, /voice_events_session_server_ts_idx/);
  assert.match(migration, /voice_latency_session_created_idx/);
  assert.match(migration, /^begin;/m);
  assert.match(migration, /^commit;/m);
});

test('voice telemetry is server-written and owner-readable with top-level owner deletion', async () => {
  const migration = await read(migrationPath);

  for (const table of [
    'voice_sessions',
    'voice_turns',
    'voice_events',
    'voice_latency_metrics',
  ]) {
    assert.match(
      migration,
      new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated`),
    );
    assert.match(
      migration,
      new RegExp(`grant select, insert, update, delete on table public\\.${table} to service_role`),
    );
  }

  assert.match(migration, /grant select, delete on table public\.voice_sessions to authenticated/);
  assert.match(migration, /grant select on table public\.voice_turns to authenticated/);
  assert.match(migration, /grant select on table public\.voice_events to authenticated/);
  assert.match(migration, /grant select on table public\.voice_latency_metrics to authenticated/);
  assert.doesNotMatch(migration, /grant\s+[^;]*insert[^;]*on table public\.voice_[^;]*to authenticated/i);
  assert.doesNotMatch(migration, /grant\s+[^;]*update[^;]*on table public\.voice_[^;]*to authenticated/i);

  assert.match(migration, /create policy "voice_sessions_select_own"/);
  assert.match(migration, /create policy "voice_sessions_delete_own"/);
  assert.match(migration, /create policy "voice_turns_select_own"/);
  assert.match(migration, /create policy "voice_events_select_own"/);
  assert.match(migration, /create policy "voice_latency_metrics_select_own"/);

  const permanentAccountChecks = migration.match(/public\.is_non_anonymous_user\(\)/g) ?? [];
  assert.ok(permanentAccountChecks.length >= 5, 'every client policy must reject anonymous-authenticated sessions');
  assert.match(migration, /references public\.voice_sessions\(id\) on delete cascade/);
});

test('voice schema excludes raw content and bounds metadata payloads', async () => {
  const migration = await read(migrationPath);

  assert.doesNotMatch(migration, /^\s*transcript\s+text\b/gm);
  assert.doesNotMatch(migration, /^\s*audio_(url|blob|bytes|base64)\s+/gm);
  assert.doesNotMatch(migration, /^\s*(prompt|response|message|content)\s+text\b/gm);

  assert.match(migration, /transcript_chars integer/);
  assert.match(migration, /octet_length\(payload::text\) <= 4096/);
  assert.match(migration, /voice_events_metadata_only/);
  assert.match(migration, /audio_base64\|audio_url\|transcript\|text\|content\|message\|prompt\|response/);

  assert.doesNotMatch(migration, /storage\.buckets/);
  assert.doesNotMatch(migration, /storage\.objects/);
});

test('voice foundation documentation, ledger, and rollback probe preserve the phase boundary', async () => {
  const [docs, extensionSource, probe] = await Promise.all([
    read('docs/VOICE_RUNTIME_FOUNDATION.md'),
    read('implementation-ledger.extensions/voice-runtime-foundation.json'),
    read('supabase/probes/voice_runtime_foundation.sql'),
  ]);
  const extension = JSON.parse(extensionSource);

  assert.match(docs, /No voice bucket is created in Phase 1/);
  assert.match(docs, /does not add a WebSocket proxy/);
  assert.match(docs, /raw audio and transcripts are excluded/i);
  assert.match(docs, /separate founder approval/);

  assert.equal(extension.id, 'voice-runtime-foundation');
  assert.equal(extension.status, 'contract');
  assert.equal(extension.ownerIssue, 'https://github.com/jussray/Sekret-Bip/issues/460');
  assert.equal(extension.verification.state, 'partial');
  assert.equal(extension.rollout.state, 'disabled');

  assert.match(probe, /^begin;/m);
  assert.match(probe, /^rollback;/m);
  assert.match(probe, /is_anonymous', false/);
  assert.match(probe, /is_anonymous', true/);
  assert.match(probe, /cross_user_reads_denied/);
  assert.match(probe, /owner_delete_cascades/);
  assert.match(probe, /raw_payload_rejected/);
});
