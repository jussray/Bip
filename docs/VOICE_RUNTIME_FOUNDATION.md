# Se’kret Bip — Voice Runtime Foundation

**Owner issue:** [#460](https://github.com/jussray/Sekret-Bip/issues/460)  
**State:** contract; migration authored, not applied to production  
**Supabase project observed:** `tbsevonvegdnlyjgplmm`  
**Last live observation:** 2026-07-17 UTC

## Decision

Se’kret Bip should use one shared voice runtime for Voice Bip, future Circle voice, and any approved Bridge rehearsal experience. The first implementation slice is SQL-only lifecycle and performance telemetry. It does not add a WebSocket proxy, recorder changes, VAD, provider relay, raw-audio retention, or transcript retention.

The architecture direction came from the structural voice audit, but repository and live Supabase truth control the implementation. The live database already has a legacy owner-scoped `voice_notes` table. It does not have `voice_sessions`, `voice_turns`, `voice_events`, `voice_latency_metrics`, or a voice Storage bucket.

## Phase 1 tables

| Table | Purpose | Content boundary |
|---|---|---|
| `voice_sessions` | Session lifecycle, surface, companion, transport, region, timestamps | No audio, transcript, prompt, reply, or message content |
| `voice_turns` | Speaker, ordering, duration, language, end reason, transcript character count | Character count only; no transcript text |
| `voice_events` | High-level events such as speech start/end, barge-in, first-token and playback state | Bounded metadata JSON; obvious raw-content keys are rejected, including nested keys |
| `voice_latency_metrics` | VAD, STT, LLM, TTS, playback, and total latency slices | Integer timing values only |

## Authorization model

### `service_role`

The future authenticated relay or Worker is the only writer. It receives explicit CRUD grants for the four tables and sequence access for `voice_events`.

### Permanent authenticated owner

A permanent authenticated user may:

- read their own session, turn, event, and latency metadata;
- delete one of their own top-level sessions, which cascades to its turns, events, and latency rows.

A permanent authenticated user may not directly insert or update telemetry. The client cannot award itself successful sessions, forge latency, or inject fake provider events.

### Anonymous and anonymous-authenticated users

- `anon` receives no table or sequence privileges.
- Supabase anonymous-authenticated sessions fail the `public.is_non_anonymous_user()` policy predicate.
- Cross-user reads and deletes fail closed.

## Why raw audio and transcripts are excluded

This product handles youth-centered emotional data. Voice telemetry exists to answer operational questions such as:

- Did a session connect?
- Where did latency occur?
- Did barge-in work?
- Did playback start?
- Did the session fail or degrade?

Those questions do not require storing what a teen said. Raw audio and transcripts would create materially higher breach, deletion, moderation, subpoena, support, and account-switch risk. They remain excluded until a separate founder-approved retention and consent contract proves why they are necessary.

## Storage decision

No voice bucket is created in Phase 1.

A private bucket may be considered only after all of the following exist together:

1. one verified uploader and consumer;
2. exact file path ownership rules;
3. MIME and size limits;
4. retention and automatic expiry;
5. owner deletion and account-deletion coverage;
6. second-user and device-switch isolation proof;
7. explicit handling for recordings interrupted before upload completion;
8. no public URLs and no broad parent access;
9. physical-device evidence;
10. a rollback and cleanup procedure.

A bucket without this contract would be unused attack surface, not a feature.

## Migration and verification sequence

1. Review `supabase/migrations/20260717034535_create_voice_runtime_foundation.sql`.
2. Run repository unit, lint, TypeScript, migration-contract, RLS-audit, and implementation-evidence gates.
3. Run `supabase/probes/voice_runtime_foundation.sql` against a development branch or approved administrator connection after applying the migration. The probe must end in `ROLLBACK` and leave no users or application rows.
4. Run Supabase security and performance advisors.
5. Apply the migration to production only under separate founder approval.
6. Re-run catalog, grants, policy, owner/cross-user/anonymous denial, payload-check, and cascade-delete proof.
7. Record the live migration version and evidence before changing this feature from `contract` to `integrated` or `verified`.

## Phase 2 prerequisites

An authenticated realtime relay and shared client runtime may begin only when:

- the Phase 1 migration is applied and authorization proof passes;
- the relay has an explicit JWT and permanent-account contract;
- service credentials remain server-only;
- reconnect and idempotency behavior are specified;
- VAD and barge-in events map to the Phase 1 event allowlist;
- event payload sanitization is tested;
- latency budgets and unavailable states are defined;
- provider failure cannot be disguised as a successful live voice session;
- no raw content enters logs, Control Room, CI artifacts, or telemetry.

## Non-claims

This contract does not mean live realtime voice is implemented, deployed, verified, or released. It creates the narrow database foundation needed to build and observe that runtime later without collecting conversation content by default.
