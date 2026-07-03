-- Se'kret Bip — agent_memories (Agent L4 architecture, Phase 1)
--
-- docs/AGENT_L4_ARCHITECTURE.md Phase 1: durable, per-companion memory that
-- survives across sessions, so a companion's replies can draw on more than
-- the current chat's passed-in `history` array.
--
-- Deviates from that doc's illustrative schema sketch in one way: `user_id`
-- references auth.users(id), not public.app_profiles(id). app_profiles is
-- never CREATE TABLE'd anywhere in supabase/migrations/ (it's reserved for
-- founder/control-room role data — see docs/FOUNDER_CONTROL_ROOM.md), and
-- every other per-user table in this repo (oracle_records, oracle_sessions,
-- bridge_signals, mood_history, journal_entries, ...) keys on auth.users(id).
-- Following that convention here, not the doc's sketch.
--
-- This is a companion-scoped, forward-write-only log — distinct from
-- oracle_records/oracle_sessions (20260618_bridge_oracle_tables.sql), which
-- already persist a single upserted OracleRecord snapshot per (user, mode).
-- agent_memories is per-companion (Raylene, Rylane, Cloud, Night, Se'kret),
-- not per-mode, and is meant to hold individually retrievable memory items
-- rather than one big JSON blob.
--
-- `embedding` is included now (nullable, unpopulated) so the column doesn't
-- require a later migration, but nothing writes to it yet — there is no
-- embedding-generation call anywhere in this codebase today. Retrieval below
-- is recency-ordered, not similarity-search. Wiring an embeddings model and
-- switching retrieval to vector similarity is a follow-up, not part of this
-- migration.

create extension if not exists vector;

create table if not exists public.agent_memories (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  companion_id text        not null check (companion_id in ('raylene', 'rylane', 'cloud', 'night', 'sekret')),
  kind         text        not null check (kind in ('episodic', 'semantic')),
  content      text        not null,
  embedding    vector(1536),
  created_at   timestamptz not null default now()
);

create index if not exists agent_memories_user_companion_created_idx
  on public.agent_memories (user_id, companion_id, created_at desc);

alter table public.agent_memories enable row level security;

drop policy if exists "agent_memories: owner all" on public.agent_memories;
create policy "agent_memories: owner all"
  on public.agent_memories for all
  using     (auth.uid() = user_id)
  with check (auth.uid() = user_id);
