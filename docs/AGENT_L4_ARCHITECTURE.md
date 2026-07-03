# Agent L4 Architecture — Decision Matrix

## Purpose

This doc evaluates what it would take to move Bip's companions (Raylene, Rylane,
Cloud, Night, Oracle/Se'kret) from **stateless per-turn responders** toward
**L4 agents**: durable memory across sessions, persistent goals, self-reflection,
and — only where a real product need exists — coordination between companions.

It replaces an earlier ungrounded draft (an "Agent L-4 Architecture Decision
Matrix" bundle of standalone HTML/JSON files) that recommended a third-party
memory SaaS (Mem0), a temporal graph store (Zep/Graphiti), a new message-queue
protocol (A2A), and a dedicated WebSocket layer — none of which exist in this
repo, and none of which were checked against Bip's actual stack or its COPPA
obligations. This version starts from what's actually here.

Maturity scale used below, specific to this doc:

| Level | Meaning |
|---|---|
| L1 | Single stateless completion, no history |
| L2 | Stateless call + injected short-term history (**current state**) |
| L3 | Durable memory across sessions, per companion, per user |
| L4 | L3 + persistent goals, self-reflection, and coordination across companions where warranted |

## Current state (as implemented today)

- **Turn flow:** `src/services/ai/buildReplyRequest.ts` → `fetchSekretBrainReply`
  (`src/utils/api.ts`) → `worker/sekret-reply.ts`. Each call is stateless except
  for the `history` array passed in from the client — this is **L2**.
- **`RoomMemory`** (`src/types/roomMemory.ts`) tracks last visit/hotspot/summon
  per companion, but it's a client-side struct, not synced to a durable server
  table.
- **`companionEngine.ts`** (`src/features/sekret/companionEngine.ts`) is the
  single entry point for all companion sends today; it explicitly states memory
  persistence "stays in `sekretCompanion.ts` + `sync.ts`" — i.e. local device
  sync, not server-side agent memory.
- **No cross-session goal tracking, no reflection loop, no agent-to-agent
  messaging** exist today. Oracle/Se'kret currently reflects patterns back
  using whatever `oracleContext` is passed in per-call, not a queried memory
  store.
- **`oracle_records` / `oracle_sessions`** (`20260618_bridge_oracle_tables.sql`,
  extending `0003_oracle_parentlinks_period_safety.sql`) already persist a
  durable, cross-device `OracleRecord` snapshot per `(user_id, mode)` plus an
  append-only session log — this is real L3-equivalent memory, just scoped to
  the Oracle discovery flow (teen/parent mode), not per-companion.
- Supabase already hosts event-sourced tables (`audit_events`, `founder_ideas`,
  control room tables — see `supabase/migrations/`), so there's precedent for
  the kind of append-only tables L3/L4 memory would need.
- The Cloudflare Worker (`worker/index.ts`) already owns routing, auth, and
  telemetry (`worker/telemetry.ts`) — any future queue poller would live
  alongside those, not as new infrastructure.

## Constraint that overrides the original draft's recommendations

Bip is a COPPA-covered product (`docs/COPPA_COMPLIANCE.md`): data from
Children is not shared with third parties beyond what's disclosed, and adding
a new subprocessor (a hosted memory SaaS, a hosted graph-memory service, a new
managed protocol vendor) requires a legal/compliance review before it can be
adopted, not just an engineering decision. That rules out defaulting to a
third-party memory vendor the way the original draft did. Supabase is already
an approved processor for this data; new companion memory should stay there
unless a documented gap forces otherwise.

## Decision matrix

### 1. Memory framework

| Option | Data residency | Fits existing RLS model | COPPA subprocessor impact | Notes |
|---|---|---|---|---|
| **Supabase `pgvector`** | Stays in our own Postgres | Yes — same `supabase/migrations/` + RLS pattern as every other table | None — no new subprocessor | Recommended default |
| Mem0 (hosted) | Third-party | No | New subprocessor, needs legal sign-off | Only worth revisiting if pgvector recall is proven insufficient in practice |
| Zep / Graphiti (temporal graph) | Third-party (or self-hosted graph DB) | No | New subprocessor or new infra to operate | Adds a whole datastore type for a temporal-reasoning need we haven't hit yet |

**Recommendation:** build on Supabase `pgvector`. It's already the system of
record for everything else in this app, it needs no new legal review, and it's
one migration file away instead of a new integration.

### 2. Orchestration pattern

Bip has a **fixed roster of 5 companions**, invoked one at a time per user
turn — not a swarm of dozens of autonomous agents. Patterns aimed at
100-agent-scale hierarchical orchestration or fully-audited supervisor/worker
decision logs are solving a problem this product doesn't have.

| Option | Fits Bip today? | Notes |
|---|---|---|
| **Single agent per turn (current)** | Yes | Keep as default for Raylene, Rylane, Cloud, Night |
| Lightweight supervisor/worker | Only for Oracle/Se'kret | Oracle already synthesizes across other companions' history/RoomMemory — that's the one place a thin "read what the other companions saw" step is justified, not a general orchestration layer |
| Hierarchical multi-agent (100-agent scale) | No | Over-engineered for a fixed 5-companion roster; do not build |

### 3. Inter-agent communication protocol

Companions don't run concurrently and don't need to negotiate with each other
in real time — they're invoked sequentially per user action. A full A2A
message-envelope protocol, a Supabase queue table, and a dedicated Cloudflare
Worker poller are **speculative infrastructure** with no current trigger.
Documenting the trigger conditions is more useful right now than building it:

- A scheduled reflection job needs to notify Oracle asynchronously after the
  user has left the session, **or**
- A Circle/multiplayer feature needs two companions to co-respond in the same
  thread.

**If and when one of those triggers happens:** reuse what's already in the
stack — a Postgres queue table polled by the existing Worker (same shape as
`worker/telemetry.ts`) — rather than introducing WebSockets or a new
real-time vendor. That keeps the protocol inside infrastructure Bip already
operates and pays for.

## Phased plan

| Phase | Level | Scope | Status |
|---|---|---|---|
| 1 | L3 | Add an `agent_memories` table; wire it into `buildReplyRequest.ts` so every companion turn reads recent memory and writes the new one | **Built** — see below |
| 2 | L3 | Add an `agent_goals` table for cross-session continuity (e.g. "follow up about X next time") | Not started |
| 3 | L4 | Scheduled reflection job that summarizes a finished session into semantic memory and flags patterns for Oracle | Not started |
| 4 | L4 (conditional) | Async inter-companion signaling via a Supabase queue + the existing Worker poller — **only** if one of the trigger conditions above materializes | Not started |

### Phase 1 — what actually shipped

- `supabase/migrations/20260702090000_agent_memories.sql`
- `src/services/agentMemory.ts` — `writeAgentMemory()` / `listRecentAgentMemories()`
- Wired into `src/services/ai/buildReplyRequest.ts`: reads the 5 most recent
  memories for the companion before assembling the request, writes the
  incoming message as a new `episodic` memory after, folds the read result
  into the shared `memory` bundle under its own `agentMemories` key (kept
  separate from `oracleContext`, which is the caller-supplied Oracle profile
  summary — a different thing).
- `test/agent-memory.test.mjs`

Two corrections made against this doc's own earlier proposal, found while
implementing it:

1. **`user_id references auth.users(id)`, not `app_profiles(id)`.** The
   original schema sketch below (kept for the record) pointed at
   `public.app_profiles`. That table is never `create table`'d anywhere in
   `supabase/migrations/` — it's referenced only by founder/control-room
   tables (see `docs/FOUNDER_CONTROL_ROOM.md`) and isn't the right FK target
   for teen-owned data. Every other per-user table in this repo
   (`oracle_records`, `bridge_signals`, `mood_history`, `journal_entries`, …)
   keys on `auth.users(id)`; `agent_memories` now does too.
2. **`oracle_records` / `oracle_sessions` already existed** (added in
   `20260618_bridge_oracle_tables.sql`, extending `0003_oracle_parentlinks_period_safety.sql`)
   and already provide durable, per-user, cross-device memory — a single
   upserted JSON snapshot per `(user_id, mode)` plus an append-only session
   log. This doc's original "Current state" section missed them. They're not
   a substitute for `agent_memories`: they're mode-scoped (teen/parent) profile
   snapshots for the Oracle discovery flow, not per-companion, individually
   retrievable memory items. `agent_memories` is additive, not a replacement.

`embedding vector(1536)` is in the table now but **unpopulated** — there is no
embedding-generation call anywhere in this codebase yet (no embeddings model is
configured; `worker/config/models.ts` only has chat/TTS/STT models). Retrieval
today is recency-ordered, not similarity search. Wiring an embeddings model and
switching `listRecentAgentMemories()` to vector similarity is a real follow-up,
not done here — it's a new external-model-call decision, not "just" a query
change.

## Illustrative schema sketch (superseded — kept for the record)

The version actually applied is `supabase/migrations/20260702090000_agent_memories.sql`.
This is the original sketch from before Phase 1 was built, left here so the
"what changed and why" note above makes sense:

```sql
-- Superseded — see supabase/migrations/20260702090000_agent_memories.sql
create table public.agent_memories (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.app_profiles(id) on delete cascade,
  companion_id text not null,               -- 'raylene' | 'rylane' | 'cloud' | 'night' | 'sekret'
  kind         text not null,               -- 'episodic' | 'semantic'
  content      text not null,
  embedding    vector(1536),
  created_at   timestamptz not null default now()
);

create index on public.agent_memories using ivfflat (embedding vector_cosine_ops);

alter table public.agent_memories enable row level security;
```

## Open questions for founder decision

- Is cross-session goal tracking (Phase 2) or inter-companion coordination
  (Phase 4) the more valuable next step? Nothing in the current product
  requires Phase 4 yet.
- Confirm: no third-party memory/orchestration vendor is adopted without a
  COPPA subprocessor review, even if it benchmarks better than `pgvector`.
- Is it worth wiring an embeddings model now to make `agent_memories`
  similarity-searchable, or is recency-ordered retrieval good enough until
  Phase 3's reflection job needs it?

## Next steps if Phase 2 is approved

Follow the same conventions Phase 1 used:

1. Migration under `supabase/migrations/<YYYYMMDDHHMMSS>_agent_goals.sql`
2. Extend `src/services/agentMemory.ts` (or a sibling `agentGoals.ts`)
3. Wire into `src/services/ai/buildReplyRequest.ts` alongside the Phase 1 read/write
4. Tests under `test/`, following `test/agent-memory.test.mjs`
