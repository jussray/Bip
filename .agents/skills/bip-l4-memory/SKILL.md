# Skill: bip-l4-memory

Enforce L4 memory and privacy rules in all code changes.

## The Rule

L4 (durable long-term) memories are the highest-sensitivity data class in Bip.
They belong to the teen, not the app. Every code change that reads, writes,
shares, or deletes L4 memories must comply with these rules.

## Source of Truth

```
src/services/ai/agentMemory.ts      — read/write API
src/services/ai/agentGoals.ts       — goal read/write API
worker/reflection-worker.ts         — nightly synthesis
supabase/migrations/agent_memories  — schema
supabase/migrations/agent_goals     — schema
supabase/migrations/reflection_runs — schema
```

## Pass Criteria

- [ ] L4 memories are never read in a companion reply request without user consent for that session
- [ ] Memories are scoped per user — no cross-user reads under any code path
- [ ] Cross-companion memory sharing is **zero** unless the teen explicitly enabled it
- [ ] Delete / forget requests are honoured within 24 hours — verified by migration or service logic
- [ ] Memories never appear verbatim in a reply (they inform tone; they are not quoted)
- [ ] Memory provenance is stored (which session created this memory)
- [ ] Reflection runs do not merge contradictory memories without flagging them
- [ ] No L4 data is sent to analytics, logging pipelines, or third-party SDKs
- [ ] TTS pipeline never receives a memory payload — only the final reply string

## Privacy Red Flags (auto-fail)

- Any `SELECT` on `agent_memories` without a `WHERE user_id = $userId` clause
- Passing a memory object into a prompt visible to a non-Se'kret companion
- Logging a memory string to Sentry, Datadog, or any crash reporter
- Returning memory content in an API response to the client

## Relationship Phases

Phase transitions are computed by `src/features/sekret/relationshipPhase.ts`.
Do not hardcode phase strings anywhere else.

```
new         → 0 durable memories
building    → 1–9
established → 10–29
deep        → 30+
reflective  → post-reflection, no contradictions
```

## Required with

- `bip-supabase-guardian` — verify RLS policies on memory tables
- `bip-privacy-redteam` — red-team memory exposure paths
- `bip-sekret-identity` — confirm memories never leak Oracle identity
- `bip-release-gate` — memory schema changes require migration review
