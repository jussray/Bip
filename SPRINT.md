# Se'kret Bip — Current Sprint State

This file records volatile project state. Verify material claims with GitHub, Supabase, Cloudflare, and the relevant tests before acting.

## Verification

**Last verified:** 2026-07-13  
**Repository:** `jussray/Sekret-Bip`  
**Default branch:** `main`  
**Verified implementation baseline:** `3b9673add18108bacf6de9d500ddccbdefa8e844`

`implementation-ledger.json` is the machine-checked feature-status source. This file is an execution handoff, not a magical synchronization layer.

The verified baseline includes:

- merge `044d72ca4028c30401dd44c9948e4e51e8e51d3b` for the unified frontend-to-Worker contract spine;
- merge `3b9673add18108bacf6de9d500ddccbdefa8e844` for permanent-account RLS on `comfort_sessions` and `room_memory`;
- live Supabase migration `20260713230600_harden_private_self_data_permanent_accounts`;
- exact-head PR checks green before both merges;
- rollback-contained live authorization proof with no retained synthetic rows.

A green reviewed branch and an identical scoped squash merge prove repository integration. Production UI or Worker behavior still requires the separate Cloudflare exact-release workflow and user-journey evidence when those runtime surfaces changed.

## Current baseline

### Implementation Evidence

Merged and active on `main`:

- feature states: `planned -> contract -> integrated -> verified -> released`;
- architecture, roadmap, current-status, and agent-skill changes require ledger reconciliation;
- integrated features require runtime paths, telemetry, rollout controls, and rollback;
- verified/released claims require passed evidence and production proof;
- status docs are updated only after the implementation merges and the tested `main` content is verified.

### Frontend-to-Worker contract spine

Merged through PR #398.

Current state:

- `src/contracts/sekretApi.ts` is the shared request, response, avatar-state, voice, transcription, and stable-error contract;
- `src/services/backend/sekretClient.ts` owns migrated Worker transport, auth headers, timeouts, trace IDs, and HTTP/network error mapping;
- main chat, legacy API helpers, and founder Worker tooling route through the shared client;
- Worker fallback and client-local fallback are distinguished;
- Worker style enforcement supplies an avatar state for frontend visual truth;
- exact-head CI, Type Check, Quality Gate, Regression, Pre-Push, Companion Lab, and Playwright passed before merge;
- exact-production-release observation plus user-facing 401, 403, 429, timeout, offline, safety, malformed-response, and voice-unavailable state proof remain before verified or released status.

### Identity and companion style

The canonical identity/style contract is integrated into Worker reply and TTS paths.

Current state:

- exact-head CI, Companion Lab, and Playwright passed;
- Se'kret continuity identity and named-companion distinctions are enforced;
- question budgets and deterministic repair exist;
- telemetry records version metadata without private content;
- production style-version observation remains before promotion to verified/released.

### Supabase authorization

Completed live slices:

- rollback-contained owner/cross-user/anonymous denial proof;
- zero synthetic residue;
- config tables hardened to service-role-only with zero client grants and preserved rows;
- migration-history parity for completed security migrations;
- `notification_deliveries` verified as service-role-only;
- `release-health`, `bridge-e2e-probe`, and `github-workflow-status` retired as JWT-protected HTTP 410 functions with recorded versions and hashes;
- `comfort_sessions` and `room_memory` now require `is_non_anonymous_user()` plus matching ownership;
- all `anon` table privileges were removed from those two private tables;
- `authenticated` privileges were reduced to SELECT, INSERT, UPDATE, and DELETE only;
- migration `20260713230600_harden_private_self_data_permanent_accounts` is applied live and matches the repository;
- rollback-contained proof passed 7 of 7 checks while retaining no application rows.

Advisor interpretation:

- Supabase continues to emit role-based anonymous-access warnings for policies assigned to `authenticated`;
- the advisor does not evaluate the explicit `is_non_anonymous_user()` predicate;
- do not claim those static warnings are cleared;
- use the executable JWT-claim denial probe as authorization evidence.

Remaining before L4 activation:

- additional anonymous-auth policy hardening for Bridge, activity, points/rewards, tasks, relationships, and other private surfaces;
- behavior tests for high-blast-radius authenticated database functions;
- negative-auth tests for `account-delete` and `safety-scan`;
- password-breach protection planning and Auth regressions.

### Production deployment

Canonical deployment authority:

- Worker: `sekret-backend` through Cloudflare Workers Builds;
- Pages: `sekret-bip` through Cloudflare Pages;
- branch: `main`;
- GitHub Actions verifies production but does not upload code.

Exact-release proof requires:

1. Worker build success for the expected commit;
2. deployed `release.json` matching the expected SHA;
3. healthy Worker endpoint;
4. read-only production Playwright;
5. retained artifact.

The retired Supabase `release-health` function and stale `control_room_releases` rows are not deployment evidence.

The private-self-data change is a live Supabase migration, not a Worker or Pages runtime change. Its release evidence is migration parity plus the rollback-contained authorization probe. Do not use Cloudflare status as a substitute for database authorization proof.

## Current product priority

### Teen-to-parent Bridge proof

The required complete journey remains:

1. teen creates and verifies an account;
2. parent creates and verifies an account;
3. relationship is linked through the intended two-party flow;
4. teen creates private source content;
5. teen previews and confirms an eligible Bridge share;
6. Worker generates a privacy-safe parent summary;
7. parent sees only the generated summary;
8. teen revokes and parent access disappears;
9. re-share creates fresh generation without stale exposure;
10. unlink and deletion remove relationship access;
11. second-user isolation remains correct.

Contracts, runtime paths, and rollback controls exist. Bridge summary rollout remains disabled/controlled until the complete deployed journey passes with cleanup evidence.

### Account deletion

Deletion remains a release blocker. Proof must include:

- database rows;
- Storage objects;
- parent-link revocation;
- local private caches;
- retry/idempotency behavior;
- second-user restore isolation.

### Parent completion

Parent routes and data contracts exist, but product completion still requires:

- onboarding and guardian verification journey;
- relationship lifecycle states;
- Parent Circle privacy;
- Parent Coach boundaries;
- minimal-content notifications;
- physical-device and end-to-end privacy verification.

## L4 continuity memory

L4 is still planned, not integrated.

Do not create broad memory dashboards before the first approved runtime path includes:

- ownership and provenance;
- correction and deletion;
- expiration/retention;
- RLS and denial tests;
- one real consumer;
- rollout, telemetry, and rollback.

## L5 cross-companion synthesis

L5 is planned, defined, and blocked — see `docs/AGENT_L4_ARCHITECTURE.md` and
`implementation-ledger.json`'s `l5-cross-companion-synthesis` entry. It is
cross-companion memory synthesis under explicit consent plus autonomous goal
proposal, not a relabeling of L4.

Do not start L5 contract work — schema, services, or a consent flow — before
`l4-continuity-memory` reaches `verified`. Cross-companion reads without an
explicit consent contract are an automatic blocker per
`.agents/skills/bip-l4-memory/SKILL.md`.

## Control Room

Current Control Room operational sources are integrated. Additional panels must remain evidence-driven:

- identity/style observers require real version telemetry;
- voice observers require real runtime metadata;
- L4 observers wait for L4 storage and runtime;
- every panel needs freshness and honest unavailable states;
- no raw teen content or raw user identifiers.

## Next execution order

1. Continue issue #399 with the next bounded anonymous-auth policy slice: Bridge relationship/share tables first, then activity and points/rewards.
2. Add positive and negative behavior tests for remaining high-blast-radius authenticated RPCs instead of blindly revoking client-callable functions.
3. Add negative-auth tests for the two custom-auth Edge Functions.
4. Complete account deletion and Storage cleanup proof.
5. Run the controlled Bridge two-account production journey.
6. Observe companion style-version and shared Worker-contract telemetry in production.
7. Plan password-breach protection with Auth regression coverage.
8. Design the smallest safe L4 schema and one real runtime consumer.
9. Add Control Room observers only after their sources exist.
10. Only after item 8 reaches `verified`: design the L5 consent contract for
    cross-companion synthesis and autonomous goal proposal.

A green PR proves reviewed integration. It does not prove production behavior unless the correct system witness, deployed artifact, and user journey were observed. Computers remain deeply committed to this inconvenient distinction.
