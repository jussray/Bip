# Se'kret Bip — Current Sprint State

This file records volatile project state. Read it at the start of a working session, then verify material claims with GitHub, Supabase, Cloudflare, and the relevant tests before acting.

Update this file only after verification when PR, deployment, migration, backend, release, or blocker state changes. Do not store private user data or unverified dashboard claims here.

---

## Verification

**Last verified:** 2026-07-12  
**Repository:** `jussray/Sekret-Bip`  
**Default branch:** `main`  
**Verified main commit:** `85624c99429a1356a7aa192133d7635cbb1e0c80`

Query GitHub before relying on PR or workflow state. This file is a handoff, not a magical synchronization layer.

---

## Main Baseline

### #339 — Green CI and Worker baseline

Established Companion Lab scripts and CI, `sekret-backend` as the canonical Cloudflare Worker, `sekret` as the frontend Pages project, and deterministic repository quality gates.

### #340 — Living state and operational agent layer

Added current-state, Companion Lab, Supabase guardian, and founder-reasoning operating instructions.

### #346 — Se'kret identity, style, and L4 contracts

Added identity, companion-style, relationship-phase, and future L4 contracts. These are contracts, not proof that every screen, Worker path, TTS flow, memory write, or Control Room panel is live.

### #348 — Supabase-backed feature hardening

Merged durable account hydration, owner-scoped Teen and Parent Pages, Circle correctness and RLS/RPC hardening, navigation consolidation, production migrations, and rollback-contained cross-account probes. Crew remains gated pending accepted-connection beta.

### #349 — Product guardrails and Playwright verification

Merged at `85624c99429a1356a7aa192133d7635cbb1e0c80` after Playwright Smoke and Guardrails, Type Check, Pre-Push Checks, Regression Tests, Quality Gate, and CI passed.

Added the canonical product vision, executable privacy/consent/identity/auth/isolation/AI/memory/safety/secret guardrails, a public-safe runtime snapshot, and browser verification.

---

## Current Priority: #259 Teen-to-Parent V1 Proof

The required proof remains:

1. teen signs up and verifies;
2. parent signs up and verifies;
3. relationship is linked through the intended two-party flow;
4. teen creates private source content;
5. teen previews and confirms an eligible Bridge share;
6. Worker generates a privacy-safe parent summary;
7. parent sees only the generated summary;
8. teen revokes and parent access disappears;
9. relationship unlink removes relationship access;
10. deletion and second-user isolation remain correct.

Steps 1–4 and 8–10 have existing implementation and contract coverage, but the entire journey has not yet been proven against a deployed Worker with two real Supabase accounts.

### PR #350 — Bridge summary activation and privacy hardening

**State:** Open; query GitHub for the latest head and checks.

Implemented on `claude/bip-v1-production-proof-nx6222`:

- Bridge summary UI moved from internal-only to client-visible;
- confirmation discloses that selected text is sent to an external AI provider;
- revoke → re-share is supported instead of ending in a dead UI state;
- selected journal and mood content is fetched only for the authenticated teen;
- missing, stale, unsupported, or partially resolved sources fail explicitly;
- raw source text is used only as ephemeral model input and is not stored in `bridge_summaries`;
- OpenAI Structured Outputs use a strict JSON schema;
- deterministic privacy validation enforces count and length bounds, blocks clinical language in parent-facing content, and rejects seven-word near-verbatim source overlap;
- one corrective model retry is allowed before a static safe fallback;
- server-side rollout control is independent of the client bundle;
- rollout fails closed when unset and is explicitly `disabled` in `wrangler.toml`;
- activation requires either `enabled` or a comma-separated teen-user cohort;
- Supabase data access was extracted into an injected-fetch store and is covered by behavioral tests for owner scoping, headers, status writes, summary persistence, complete source resolution, partial-source rejection, unsupported sources, upstream failures, and missing configuration;
- Quality Gate uses Node 22 and the repository's real test command rather than pretending the custom runner understands unrelated coverage flags.

### Verified live Supabase boundaries

Production project `tbsevonvegdnlyjgplmm` was checked directly on 2026-07-12:

- Bridge request, source, and summary policies are teen/parent relationship scoped;
- parent summary visibility requires ready/viewed status, no revocation, no expiry, and an active parent link;
- journal and mood source tables remain owner scoped;
- `notification_deliveries` has RLS enabled, no policies, no grants for `anon` or `authenticated`, and table privileges only for `service_role`;
- the no-policy shape of `notification_deliveries` is therefore an intentional server-only boundary, not a missing client policy.

The repository RLS scanner now verifies that exception only when both RLS and the migration-level client-role revocation are present.

### Still not production proof

The following remain separate activation/release gates:

- deployed Worker test with two real teen/parent accounts;
- real OpenAI summary generation and fallback observation;
- parent view, revoke, re-share, unlink, and delete in the same real relationship;
- physical-device verification;
- deliberate OpenAI retention/account configuration decision;
- production rollout variable change from `disabled` to a controlled cohort or `enabled`.

Merging PR #350 does not activate the feature in production and does not certify the full V1 journey.

---

## #344 — Supabase Authorization Hardening

**State:** Open.

Continue phased, test-first review of:

- `app_config`, `app_private_config`, and `guardian_verification_reviews` access intent;
- anonymous-capable roles on private tables;
- SECURITY DEFINER grants and search paths;
- leaked-password protection;
- denial tests before broad policy changes.

Do not mass-rewrite production policies merely to reduce advisory counts. `notification_deliveries` is now documented and scanner-verified as service-role-only.

---

## Control Room AI Rollout

1. **PR B — observers:** read-only identity, style, voice, L4, and MCP panels with privacy-safe adapters.
2. **PR C — runtime activation:** connect identity/style contracts to actual screens, reply requests, accessibility, archives, notifications, and TTS; add identity-leak and Companion Lab evaluations.
3. **PR D — L4 persistence:** reviewed memory, goal, and reflection storage with ownership, provenance, correction, expiry, deletion, and denial tests.

The old `control-room-architecture` branch is not a merge candidate. Reuse ideas only through scoped branches from current main.

---

## Cloudflare / OpenAI

- **Backend Worker:** `sekret-backend`
- **Worker entrypoint:** `worker/observed-index.ts`
- **Frontend Pages project:** `sekret`
- **Bridge summary rollout default:** `disabled`
- **Model configuration:** Worker environment-backed
- **Production AI health:** requires authenticated live proof; repository code and CI alone are insufficient
- **TTS:** contracts exist, but production Se'kret/companion TTS activation is not certified

Do not rename the Worker, change production rollout, or deploy from an unrelated task.

---

## Supabase

- **Project:** Se'kret Bip
- **Project ref:** `tbsevonvegdnlyjgplmm`
- **Status:** `ACTIVE_HEALTHY`
- **Region:** `us-east-1`
- **Schema source of truth:** `supabase/migrations/`
- **Project health alone does not certify schema parity or user journeys**

---

## Next Execution Order

1. Finish PR #350 checks, including Playwright, unit tests, typecheck, lint, build, regression, and RLS audit.
2. Merge PR #350 only after all required checks pass, with rollout still disabled.
3. Deploy separately under an explicit deployment approval.
4. Run issue #259's complete two-account journey using a controlled rollout cohort.
5. Record failures, repair them, and repeat until revoke, re-share, unlink, delete, and privacy boundaries pass.
6. Complete issue #344 denial-test inventory before broad authorization changes.
7. Continue Control Room observer work only after the V1 proof path is stable.

A green PR is permission to integrate reviewed code. It is not evidence that a teenager and parent completed the real production journey. Computers remain annoyingly literal about this distinction.
