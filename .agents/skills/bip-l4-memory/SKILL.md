# Skill: bip-l4-memory

Enforce L4 memory and privacy rules in all code changes.

## The Rule

L4 (durable long-term) memories are the highest-sensitivity data class in Bip.
They belong to the teen, not the app. Every code change that reads, writes,
shares, or deletes L4 memories must comply with these rules.

## Current State (PR A)

The following L4 runtime systems are **specified but not yet implemented**:

```
src/services/ai/agentMemory.ts      — future: L4 read/write API
src/services/ai/agentGoals.ts       — future: goal read/write API
worker/reflection-worker.ts         — future: nightly synthesis
supabase/migrations/agent_memories  — future: schema (PR D)
supabase/migrations/agent_goals     — future: schema (PR D)
supabase/migrations/reflection_runs — future: schema (PR D)
```

This skill governs those future files. Any PR that creates them must satisfy
every criterion below.

## Pass Criteria

- [ ] L4 memories are never read in a reply request without per-session consent
- [ ] Memories are scoped per user — no cross-user reads under any code path
- [ ] Cross-companion memory sharing is zero unless the teen explicitly enabled it
- [ ] Delete / forget requests are honoured within 24 hours — verified by migration or service logic
- [ ] Memories never appear verbatim in a reply (they inform tone; they are not quoted)
- [ ] Memory provenance is stored (which session created this memory)
- [ ] Reflection runs flag contradictory memories rather than silently merging them
- [ ] No L4 data is sent to analytics, logging pipelines, or third-party SDKs
- [ ] TTS pipeline never receives a memory payload — only the final reply string

## Privacy Red Flags (Auto-Fail)

- Any `SELECT` on `agent_memories` without `WHERE user_id = $userId`
- Passing a memory object into a prompt visible to a non-Se’kret companion
- Logging a memory string to any crash reporter or analytics pipeline
- Returning memory content in an API response to the client
- Rendering a raw `user_id` or UUID in any Control Room panel

## Relationship Phase Contract

Phase transitions are computed solely by `src/features/sekret/relationshipPhase.ts`.
Do not hardcode phase strings anywhere else.

```
new         → 0 durable memories
building    → 1–9
established → 10–29 (or 10–29 with reflection + contradictions > 0)
reflective  → 10–29 + reflection run + 0 contradictions
deep        → 30+
```

## Required With

- `bip-supabase-guardian` — verify RLS policies on memory tables
- `bip-privacy-redteam` — red-team all memory exposure paths
- `bip-sekret-identity` — confirm memories never leak Oracle identity
- `bip-release-gate` — memory schema changes require migration review
