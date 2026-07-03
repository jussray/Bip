import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

// Guards docs/AGENT_L4_ARCHITECTURE.md's Phase 1: durable, per-companion memory
// that survives across sessions, wired into the one shared reply-assembly path
// so every companion surface benefits, not just one screen.

test('agent_memories migration exists and is safely rerunnable', async () => {
  const migrationsDir = fileURLToPath(new URL('../supabase/migrations/', import.meta.url));
  const migrationFile = readdirSync(migrationsDir).find((f) => f.endsWith('_agent_memories.sql'));
  assert.ok(migrationFile, 'expected a supabase/migrations/*_agent_memories.sql file');

  const migration = await read(`supabase/migrations/${migrationFile}`);

  assert.match(migration, /create extension if not exists vector/);
  assert.match(migration, /create table if not exists public\.agent_memories/);

  // user_id must key on auth.users(id), matching every other per-user table in
  // this repo (oracle_records, bridge_signals, mood_history, ...) — not
  // app_profiles(id), which is never CREATE TABLE'd in supabase/migrations/.
  assert.match(migration, /user_id\s+uuid\s+not null references auth\.users\(id\)/);
  assert.doesNotMatch(migration, /references\s+(public\.)?app_profiles/);

  assert.match(migration, /check \(companion_id in \('raylene', 'rylane', 'cloud', 'night', 'sekret'\)\)/);
  assert.match(migration, /check \(kind in \('episodic', 'semantic'\)\)/);

  assert.match(migration, /enable row level security/);
  assert.match(migration, /drop policy if exists "agent_memories: owner all"/);
  assert.match(migration, /using\s+\(auth\.uid\(\) = user_id\)/);
});

test('agentMemory service reads recency-ordered and writes best-effort', async () => {
  const source = await read('src/services/agentMemory.ts');

  assert.match(source, /export async function writeAgentMemory/);
  assert.match(source, /export async function listRecentAgentMemories/);

  // Both must degrade to safe no-ops rather than throwing — a memory failure
  // must never break a companion reply.
  assert.match(source, /if \(!isSupabaseConfigured/);
  assert.match(source, /catch \{/);

  // Read is ordered newest-first from the DB, then reversed so callers get
  // reading order (oldest of the recent batch first).
  assert.match(source, /order\('created_at', \{ ascending: false \}\)/);
  assert.match(source, /\.reverse\(\)/);
});

test('buildReplyRequest wires agent memory into every companion turn', async () => {
  const source = await read('src/services/ai/buildReplyRequest.ts');

  assert.match(source, /listRecentAgentMemories/);
  assert.match(source, /writeAgentMemory/);

  // Read must happen before write, so the current turn's memories reflect
  // prior context and don't include the message that triggered this call.
  const readIdx = source.indexOf('listRecentAgentMemories(ctx.characterId');
  const writeIdx = source.indexOf('writeAgentMemory(ctx.characterId');
  assert.ok(readIdx !== -1 && writeIdx !== -1, 'expected both calls in buildReplyRequest');
  assert.ok(readIdx < writeIdx, 'must read existing memories before writing the current turn');

  // agentMemories is folded into the shared memory bundle under its own key —
  // distinct from oracleContext (the caller-supplied Oracle profile summary),
  // not merged into it.
  assert.match(source, /agentMemories\.length > 0 \? \{ agentMemories \} : \{\}/);
});
