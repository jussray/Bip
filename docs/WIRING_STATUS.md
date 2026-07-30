# Se'kret Bip — Backend Wiring Status

**Last reviewed:** 2026-07-29  
**Reviewed application baseline:** `2a3d11efa094be2b9ae0a6095a1d84f21844f85b`

Documentation-only merges may advance `main` after this application baseline without changing the app evidence.

`implementation-ledger.json` is the machine-checked status source. This page describes the current runtime and data wiring in human-readable form.

## Current wiring delta

- Canonical production Worker entry point: `worker/voice-entry.ts` for `sekret-backend`.
- Canonical frontend release marker: `/.well-known/sekret-release.json`.
- [P0 #696](https://github.com/jussray/Sekret-Bip/issues/696) is open because the live Pages domain serves an app fallback instead of that JSON marker.
- Local build output and repository configuration do not prove the live Pages artifact or current frontend SHA.
- PR #595 and PR #698 are merged repository history; PR #690 is closed as preserved history. PR #692 remains a draft and is not current runtime truth.

## Evidence boundary

A path can be:

- present in the repository;
- type-checked or tested at one PR head;
- merged into `main`;
- deployed by Cloudflare;
- aligned with live Supabase;
- observed in a production browser;
- observed on a physical device.

Those are different states. This file does not collapse them.

## Implemented runtime paths

- Expo Router teen and parent route groups
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
- Canonical Se'kret identity and companion-style wrapper in Worker reply paths
- Exact-production-release verification machinery for Worker and Pages deployments
- Responsive polished web welcome screen merged through PR #594

## Current route model

The app uses Expo Router route groups:

- auth routes: `app/(auth)/`
- onboarding routes: `app/(onboarding)/`
- teen routes: `app/(teen)/`
- parent routes: `app/(parent)/`
- founder/internal routes: `app/(dev)/`

The public web root now renders the polished welcome screen before handing control to the existing auth and onboarding router. PR #594's exact head passed focused Playwright for render, click and keyboard entry, age-bucket continuation, and narrow-phone overflow.

That scoped proof does not establish the full current merge SHA, live-domain auth behavior, Supabase state, or physical-device behavior.

Older references to `app/(main)/`, `app/parent/`, or a global string router are historical and must not be used for new work.

## Authentication and onboarding wiring

### Confirmed structure

- Supabase client: `src/utils/supabase.ts`
- environment source: `src/utils/env.ts`
- post-auth bootstrap: `src/services/auth/postAuthBootstrap.ts`
- onboarding routes: `app/(onboarding)/`
- age-assurance model: `src/features/onboarding/ageAssurance.ts`
- required consent service: `services/consentService.ts`
- hardened onboarding table and trigger migrations: `supabase/migrations/`

### Canonical repository path; live journey still required

PR #595 merged the repository repair for the active onboarding-state path. The canonical durable table is `user_onboarding_state`, and current repository work must not restore a parallel `onboarding_state` path.

This is repository evidence, not a complete founder-access proof. A real-account, physical-device journey and the related database, auth, network, failure, and cleanup witnesses still remain launch gates.

## Frontend-to-Worker contract

The migrated frontend runtime uses one contract spine:

1. `src/contracts/sekretApi.ts` defines companion, surface, history, reply, voice, transcription, avatar-state, and stable-error types.
2. `src/services/backend/sekretClient.ts` resolves the canonical backend URL, adds authenticated headers, applies timeouts, parses response metadata, and maps HTTP/network failures.
3. `src/services/ai/chat.ts`, `src/utils/api.ts`, and `src/services/ai/workerClient.ts` consume the shared client instead of maintaining independent direct Worker fetches.
4. `worker/runtime-style.ts` applies the authoritative identity and style contract and repairs legacy display-name leaks.
5. `test/worker-contract-spine.test.mjs` prevents migrated surfaces from silently creating new transport paths.

The contract spine is integrated. Exact production observation and full user-facing error-state proof remain required.

## Companion identity wiring

Canonical display/canon names are:

- Suhana, with legacy internal identifier `raylene` where compatibility still requires it;
- Sy, with legacy internal identifier `rylane` where compatibility still requires it;
- Cloud;
- Night.

PR #592 merged runtime output repair for legacy display-name leaks. PR #595 is merged repository history; remaining user-facing and AI-facing normalization must preserve legacy stored identifiers and gain its own scoped proof.

The persisted `app_profiles.selected_companion` database vocabulary still accepts legacy identifiers. Do not rename stored values or database constraints without a dedicated compatibility migration. Normalize at boundaries where persisted identifiers become user-facing or AI-facing behavior.

## Database source of truth

`supabase/migrations/` is the schema source of truth.

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Do not use a second bootstrap schema. Migration ordering must remain replay-safe for an empty database, and repository migration versions must match versions recorded by the live project.

PR #577 merged repository-history parity improvements for reviewed trigger functions, including search-path and client EXECUTE statements and a missing migration representation for the already-live auth-email synchronization trigger.

Some onboarding trigger functions are repository-complete but explicitly recorded as not yet observed live. Do not mark them deployed or behaviorally verified until live catalog parity is rerun after migration deployment.

## Trigger assurance

Current trigger assurance includes:

- a reviewed structural inventory;
- explicit latest-definition handling;
- search-path and client EXECUTE expectations;
- attachment inventory;
- duplicate and orphan detection;
- read-only live observations for selected functions.

It does **not** yet include complete behavior verification.

Behavioral proof must control external effects from `pg_net`, Edge Functions, notification systems, and queues, remain rollback-contained where possible, retain explicit cleanup evidence, and leave zero synthetic private rows.

## Authorization state

Verified live evidence includes sampled:

- owner access for private rows;
- cross-user read and update denial;
- anonymous denial;
- zero synthetic probe residue;
- server-only configuration tables with no client grants;
- `notification_deliveries` as service-role-only;
- retirement of obsolete Edge Functions;
- permanent-account enforcement for selected private tables;
- removal of `anon` grants from selected private tables;
- rollback-contained private-self-data checks.

Supabase static advisor warnings remain inventory signals. Executable predicates and rollback-contained probes are the authorization evidence.

`account-delete` and `safety-scan` intentionally use dedicated custom-auth boundaries rather than ordinary user JWT verification. Their negative-auth source contracts are merged; live configuration and end-to-end behavior remain separate proof.

## Activity and reset wiring

Reset completions use the existing activity path:

1. guided or workout UI requires meaningful elapsed participation;
2. `src/features/activity/events.ts` writes minimal routine metadata to `public.bip_events`;
3. `public.bip_events_award_points` invokes `public.handle_bip_event_points()`;
4. eligible events create server-owned point transactions through the existing points model.

No second workout-history table, raw mood-content column, or parallel points ledger is authorized.

## Parent and Bridge status

The linked-account data model is implemented, including parent links, Bridge signals, Bridge messages, summary contracts, revocation, and relationship-aware RLS.

The parent product remains an enforced release gate. It is not production-complete until evidence covers:

- parent splash and onboarding;
- guardian verification;
- pending, active, expired, revoked, blocked, and deleted relationship states;
- controlled two-account Bridge production journeys;
- Parent Circle privacy;
- Parent Coach boundaries;
- period-sharing permissions;
- minimal-content notifications;
- unlink, deletion, cleanup, and second-user isolation.

A runtime path existing is not permission to broaden parent visibility.

## Deployment status

Production authority remains Cloudflare native Git integration:

- Pages project: `sekret-bip`
- Worker: `sekret-backend`
- branch: `main`

The release verifier requires:

1. a successful exact-commit Worker build;
2. a deployed `/.well-known/sekret-release.json` marker matching the exact `main` SHA;
3. a healthy canonical Worker endpoint;
4. read-only production Playwright against protected teen and parent routes;
5. retained evidence that names the exact observed commit.

Cloudflare preview or deployment success does not prove GitHub checks, Supabase migrations, RLS, auth journeys, or device behavior.

The current `main` merge SHA does not yet have a complete repository-wide GitHub Actions proof set.

## Current repository-quality evidence boundary

PR #695’s exact-head gate passed its scoped contract tests, complete unit suite, and type-check before merge. That is strong scoped evidence, not a repository-wide proof for the current `main` merge SHA.

PR #698 has exact-head merge evidence but it does not prove live auth, email delivery, reset links, production, or device behavior. PR #692 remains a draft branch whose previous checks cannot be reused after content or base changes. Do not call the repository clean, release-ready, or production-deployed without an executed gate for the exact target head and the independent live release witness.

## Remaining wiring gates

- real-account and physical-device onboarding proof for the canonical merged path;
- exact-head type, lint, test, bundle, audit, and Playwright gates for each merge candidate and release target;
- P0 public release-marker restoration and exact deployment proof under #696;
- controlled Bridge production proof;
- account deletion and Storage cleanup proof;
- anonymous-auth hardening for remaining private surfaces;
- behavior tests for remaining authenticated database functions with broad impact;
- trigger behavioral assurance with controlled external effects;
- production observation of companion style and Worker-contract metadata;
- physical iOS/Android, accessibility, offline, notification, moderation, and failure-state QA;
- legal, safeguarding, support, app-store, backup, restore, incident, and rollback readiness.

## Validation

```bash
npm run type-check
npm test
npm run lint
npm run verify:bundle
npm run audit:control-room
npm run validate:companions
npm run test:e2e
npm run test:e2e:production
npm run verify:prepush
```

Do not mark a path complete merely because code exists. Completion requires the route, service, authorization boundary, tests, rollout, telemetry, deployment witness, and rollback to agree.
