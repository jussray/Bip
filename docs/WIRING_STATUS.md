# Se'kret Bip — Backend Wiring Status

Last reviewed: 2026-07-13

`implementation-ledger.json` is the machine-checked status source. This page describes the current runtime and data wiring in human-readable form.

## Implemented runtime paths

- Supabase authentication and persisted sessions
- Local-first AsyncStorage restore and cloud synchronization
- Teen Circle and Parent Circle data flows
- Bip Crew members, invites, connection states, and check-ins
- Points, rewards, and activity-ledger infrastructure
- Mind + Body Reset guided tools, timed bodyweight routines, and minimal completion events
- One shared typed frontend client for Worker reply, voice synthesis, transcription, and health routes
- Stable frontend mapping for authentication failures, access denial, invalid requests, rate limits, backend unavailability, voice unavailability, timeouts, and network errors
- Worker-versus-local fallback distinction, trace IDs, and Worker-supplied avatar state
- Voice Bip recording, transcription, reply, TTS, and playback
- Parent-link invites, redemption, revocation, and relationship-aware data
- Safety tables, triggers, alerts, and Edge Functions
- Period-calendar synchronization
- Bridge signals, messages, summaries, consent, and revocation contracts
- Founder Control Room operational ingestion and metadata-only telemetry
- Canonical Se'kret identity and companion-style wrapper in Worker reply and voice paths
- Exact-production-release verification for Worker and Pages deployments

## Current route model

The app uses Expo Router route groups:

- teen routes: `app/(teen)/`
- parent routes: `app/(parent)/`
- founder/internal routes: `app/(dev)/`

Mind + Body Reset uses `app/(teen)/mind-body-reset.tsx` as the hub and the hidden `app/(teen)/body-workout.tsx` route for timer-driven movement routines.

Older references to `app/(main)/`, `app/parent/`, or a global string router are historical and must not be used for new work.

## Frontend-to-Worker contract

The migrated frontend runtime uses one contract spine:

1. `src/contracts/sekretApi.ts` defines companion, surface, history, reply, voice, transcription, avatar-state, and stable-error types.
2. `src/services/backend/sekretClient.ts` resolves the canonical backend URL, adds authenticated headers, applies timeouts, parses response metadata, and maps HTTP/network failures.
3. `src/services/ai/chat.ts`, `src/utils/api.ts`, and `src/services/ai/workerClient.ts` consume the shared client instead of maintaining independent direct Worker fetches.
4. `worker/runtime-style.ts` guarantees an avatar state from safety, tone, and comfort-tool metadata.
5. `test/worker-contract-spine.test.mjs` prevents migrated surfaces from silently creating new transport paths.

Exact-head CI, Type Check, Quality Gate, Regression, Pre-Push, Companion Lab, and Playwright passed before PR #398 merged.

This path is integrated, not yet released. Exact-production-release observation and full user-facing error-state proof remain required.

## Database source of truth

`supabase/migrations/` is the schema source of truth.

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Do not use a second bootstrap schema. Migration ordering must remain replay-safe for an empty database, and repository migration versions must match the versions recorded by the live project.

Current verified migration parity includes:

- `20260713011803_harden_config_table_grants`
- `20260713230600_harden_private_self_data_permanent_accounts`

## Activity and reset wiring

Reset completions use the existing activity path:

1. Guided or workout UI requires meaningful elapsed participation before completion is emitted.
2. `src/features/activity/events.ts` writes only minimal routine metadata to `public.bip_events`.
3. `public.bip_events_award_points` invokes the existing `public.handle_bip_event_points()` trigger function.
4. Eligible events create server-owned point transactions through the existing points model.

No workout-history table, raw mood-content column, or second point ledger is introduced.

## Authorization state

Verified live evidence currently includes:

- sampled owner access for private rows;
- cross-user read and update denial;
- anonymous denial;
- zero synthetic probe residue;
- server-only configuration tables with no client grants;
- `notification_deliveries` documented and verified as service-role-only;
- three obsolete Edge Functions retired behind platform JWT verification;
- live inspection of the restored `bip_events` trigger;
- permanent-account enforcement for `comfort_sessions` and `room_memory`;
- removal of all `anon` table grants from those two private tables;
- reduction of authenticated table privileges to SELECT, INSERT, UPDATE, and DELETE only;
- one consolidated permanent-owner RLS policy per table;
- a rollback-contained live proof passing 7 of 7 checks without retained application rows.

The relevant evidence paths are:

- `supabase/migrations/20260713230600_harden_private_self_data_permanent_accounts.sql`
- `supabase/probes/authorization_private_self_data_phase1.sql`
- `security/private-self-data-hardening.json`
- `test/private-self-data-hardening.test.mjs`

Supabase's static advisor still warns that policies assigned to `authenticated` may include anonymous Auth sessions. It does not evaluate the explicit `public.is_non_anonymous_user()` predicate. Treat the warning as an inventory signal, not as proof of access. The executable JWT-claim probe is the authorization evidence.

Only `account-delete` and `safety-scan` intentionally remain outside platform JWT verification because they use dedicated server-to-server boundaries. They still require focused negative-auth tests.

See `docs/security/SUPABASE_AUTHORIZATION_PHASE0.md`, `security/supabase-authorization-baseline.json`, and `security/private-self-data-hardening.json`.

## Parent and Bridge status

The linked-account data model is implemented, including parent links, Bridge signals, Bridge messages, summary contracts, revocation, and relationship-aware RLS.

The parent product remains an enforced release gate. It is not production-complete until evidence covers:

- parent splash and onboarding;
- pending, active, expired, revoked, blocked, and deleted states;
- controlled two-account Bridge production journeys;
- Parent Circle privacy validation;
- Parent Coach boundaries;
- period-sharing permissions;
- minimal-content notifications;
- complete relationship and privacy tests.

Bridge remains under controlled rollout. A runtime path existing is not permission to broaden parent visibility.

The next Supabase authorization slice should harden Bridge relationship and share tables against anonymous-authenticated sessions before the controlled two-account proof is promoted.

## Companion status

Current companion runtime includes:

- unified reply payloads;
- one shared typed frontend Worker transport;
- short-term conversation history;
- approved RoomMemory and conversation context;
- canonical actor identity and style profiles;
- deterministic question-budget and forbidden-identity enforcement;
- Worker-supplied avatar state;
- Worker and TTS style-version metadata;
- metadata-only provider telemetry.

Durable semantic memory, persistent goals, scheduled reflection, and inter-companion coordination are not implemented. L4 remains blocked until its ownership, provenance, correction, expiry, deletion, RLS, denial-test, rollout, and rollback contracts are approved.

## Deployment status

Production authority is Cloudflare native Git integration:

- Pages project: `sekret-bip`
- Worker: `sekret-backend`
- branch: `main`

The release verifier requires:

1. a successful exact-commit Worker build;
2. a deployed `release.json` marker matching the exact `main` SHA;
3. a healthy canonical Worker endpoint;
4. read-only production Playwright against protected teen and parent routes.

The retired `release-health` Supabase function and stale `control_room_releases` rows are not production release oracles. Canonical Cloudflare deployment evidence comes from the native verifier and its artifacts.

The private-self-data hardening is a live Supabase migration. Its evidence is migration parity and the database authorization probe, not a Cloudflare deployment badge.

## Remaining wiring gates

- physical iOS/Android plus manual timer, accessibility, and movement-safety QA for Mind + Body Reset;
- exact-production-release and user-facing state proof for the shared frontend Worker contract;
- controlled Bridge production proof;
- account deletion and storage cleanup proof;
- anonymous-auth policy hardening for remaining Bridge, activity, points/rewards, tasks, relationships, and private surfaces;
- behavior tests for authenticated database functions with broad operational impact;
- negative tests for the two remaining custom-auth Edge Functions;
- password-breach protection planning and Auth regressions;
- production observation of companion style-version telemetry;
- legal, moderation, accessibility, and app-store readiness.

## Validation

```bash
npm run type-check
npm test
npm run lint
npm run verify:bundle
npm run audit:control-room
npm run validate:companions
npm run test:e2e
npm run verify:prepush
```

Do not mark a path complete merely because code exists. Completion requires the route, service, authorization boundary, tests, rollout, telemetry, and rollback to agree.
