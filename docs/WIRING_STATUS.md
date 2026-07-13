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

## Database source of truth

`supabase/migrations/` is the schema source of truth.

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Do not use a second bootstrap schema. Migration ordering must remain replay-safe for an empty database, and repository migration versions must match the versions recorded by the live project.

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
- live inspection of the restored `bip_events` trigger.

Only `account-delete` and `safety-scan` intentionally remain outside platform JWT verification because they use dedicated server-to-server boundaries. They still require focused negative-auth tests.

See `docs/security/SUPABASE_AUTHORIZATION_PHASE0.md` and `security/supabase-authorization-baseline.json`.

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

## Companion status

Current companion runtime includes:

- unified reply payloads;
- short-term conversation history;
- approved RoomMemory and conversation context;
- canonical actor identity and style profiles;
- deterministic question-budget and forbidden-identity enforcement;
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

The retired `release-health` Supabase function is not a production release oracle. It now returns HTTP 410 behind JWT verification. Canonical deployment evidence comes from the Cloudflare-native verifier and its artifacts.

## Remaining wiring gates

- physical iOS/Android plus manual timer, accessibility, and movement-safety QA for Mind + Body Reset;
- controlled Bridge production proof;
- account deletion and storage cleanup proof;
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
