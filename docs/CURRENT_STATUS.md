# Se'kret Bip — Current Status

Last reviewed: 2026-07-13

This page is the human-readable status summary. `implementation-ledger.json` is the machine-checked source for feature state, evidence, rollout controls, and blockers.

## Integrated

- Expo Router route groups for teen and parent experiences
- Supabase-backed authentication, synchronization, ordered migrations, RLS, Storage, and Edge Functions
- Canonical Cloudflare Worker `sekret-backend`
- Cloudflare Pages project `sekret-bip`
- One typed frontend-to-Worker client and shared request/response contract for companion replies, transcription, speech, health, stable errors, trace IDs, fallback state, and avatar state
- Companion reply, transcription, speech, and metadata-only telemetry flows
- Versioned Se'kret identity and companion-style runtime wrapper in Worker and TTS paths
- Mind + Body Reset guided regulation tools and timer-driven bodyweight workouts
- Bridge account-link, consent, summary, revocation, and controlled-rollout contracts
- Founder Control Room operational data sources
- Exact-release production verification using the Worker check, deployed `release.json`, health verification, and read-only Playwright
- Implementation Evidence CI gate for architecture, roadmap, status, and agent-skill claims

## Verified authorization and operations slices

- Rollback-contained live proof for sampled owner access, cross-user denial, anonymous denial, and zero synthetic residue
- `app_config` and `app_private_config` hardened as service-role-only with RLS enabled, zero client grants, zero policies, and unchanged rows
- `notification_deliveries` verified as an intentional service-role-only table rather than an unresolved user-policy gap
- `release-health`, `bridge-e2e-probe`, and `github-workflow-status` retired as JWT-protected, side-effect-free HTTP 410 functions with replacement evidence
- Repository migration history aligned with the live Supabase migration version for config-grant hardening
- The existing `bip_events` event-to-points trigger restored and inspected live without adding a parallel workout or reward table
- `comfort_sessions` and `room_memory` now require both permanent-account status and matching ownership; anonymous table grants were removed and authenticated access was reduced to CRUD only
- Migration `20260713230600_harden_private_self_data_permanent_accounts` is applied live and matches the repository migration ledger
- A rollback-contained live proof passed 7 of 7 checks: anonymous-auth writes were denied, permanent-owner writes remained functional, least-privilege grants were confirmed, and no synthetic application rows were retained
- Supabase still emits static anonymous-role warnings for these guarded policies because the advisor does not evaluate `is_non_anonymous_user()`; the executable JWT-claim proof is the authorization evidence

## Integrated but not yet fully verified or released

### Frontend-to-Worker contract spine

- `src/contracts/sekretApi.ts` defines the shared reply, voice, transcription, avatar-state, and stable-error contracts.
- `src/services/backend/sekretClient.ts` owns migrated Worker transport, authentication headers, timeout mapping, trace IDs, and Worker-versus-local fallback state.
- Main chat, legacy API helpers, and the founder Worker adapter route through the shared client rather than owning separate direct fetch logic.
- Exact-head CI, Type Check, Quality Gate, Regression, Pre-Push, Companion Lab, and Playwright passed before merge.
- Exact-production-release observation and complete user-facing proof for 401, 403, 429, timeout, offline, safety, malformed-response, and voice-unavailable states remain before verified or released status.

### Mind + Body Reset

- Guided mind tools, guided body regulation, and four real bodyweight routines are wired through teen-only hidden routes.
- Work/rest timers, low-impact alternatives, pause, skip, stop, progress, safety guidance, and meaningful-completion thresholds are implemented.
- Minimal routine metadata uses the existing `bip_events` pipeline; raw emotional text is not written by the reset flow.
- Exact-head CI, Expo web export, and Playwright passed; physical iOS/Android plus manual timer, accessibility, and movement-safety QA remain before verified or released status.

### Parent and Bridge

- Parent routes and linked-account data exist.
- Bridge contracts and runtime paths exist.
- Bridge summaries remain under controlled rollout.
- Production two-account journey proof, full relationship lifecycle coverage, Parent Circle privacy, Parent Coach boundaries, minimal-content notifications, and parent-facing completion remain open.

### Companion identity and style

- Canonical identity and style contracts are consumed by Worker and TTS runtime paths.
- Exact-head CI, Companion Lab, and Playwright passed.
- Production style-version telemetry still needs to be observed before the feature is promoted from integrated to verified or released.

### Control Room

- Founder-gated operational sources and screens exist.
- Freshness, unavailable states, and metadata-only boundaries are required.
- Identity, style, voice, and L4 observer adapters must not be presented as complete before their runtime or data sources are evidenced.

## Enforced release blockers

- Controlled production proof for Bridge and parent relationship journeys
- Account deletion and privacy lifecycle completion
- Focused positive and negative behavior tests for remaining high-blast-radius authenticated database functions
- Continued anonymous-auth policy hardening for Bridge, activity, points/rewards, tasks, relationships, and other private surfaces tracked in issue #399
- Negative-auth tests for the two remaining custom-auth Edge Functions: `account-delete` and `safety-scan`
- Password-breach protection planning and Auth regression evidence
- Legal, accessibility, safeguarding, moderation, and store-review readiness
- Production evidence for any feature still marked integrated rather than verified or released

## Planned only — not implemented

- Durable L4 continuity memory
- Persistent companion goals
- Scheduled reflection jobs
- Inter-companion coordination
- Relationship phase derived from persisted evidence

L4 remains blocked until ownership, provenance, correction, expiration, deletion, RLS, denial tests, runtime use, rollout, and rollback are approved together.

## Release posture

A controlled internal demo may use synthetic or non-sensitive data while unfinished areas are clearly labeled. Public launch, public demo involving real teen data, app-store release, and production teen-data collection remain blocked until the applicable engineering, privacy, security, legal, and operational gates have evidence.

See:

- `implementation-ledger.json`
- `docs/WIRING_STATUS.md`
- `docs/DEMO_READINESS_ENFORCEMENT.md`
- `docs/security/SUPABASE_AUTHORIZATION_PHASE0.md`
- `security/private-self-data-hardening.json`
- `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md`
- `DEPLOYMENT.md`
