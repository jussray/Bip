# Se'kret Bip — Current Status

**Last reviewed:** 2026-07-29  
**Repository baseline:** `main` at `eeebc15ebd3dc9b420dab04def0d121f41524670`  
**Current launch gate:** `docs/LAUNCH_GATE_STATUS_2026-07-29.md`  
**Roadmap:** `docs/LAUNCH_ROADMAP.md`  
**Current execution:** `SPRINT.md`

## Current authority overlay

This block supersedes the historical July 23 progress narrative retained below.

- PR #595 and PR #596 are merged repository history, not open repair candidates.
- PR #688 merged a fail-closed restored-session account-switching boundary.
- PR #691 repaired main contract authority; PR #695 reconciled the canonical Cloudflare operator documentation.
- **Public launch remains blocked:** live release-marker URLs return application fallbacks instead of JSON. Track [P0 #696](https://github.com/jussray/Sekret-Bip/issues/696).
- The canonical release marker is `/.well-known/sekret-release.json`; the legacy `/release.json` path is not release authority.
- PR #690 and PR #692 are drafts. Neither is current merge, deployment, or launch truth.
- The live welcome screen visually paints its approved family artwork, but that observation cannot identify the deployed commit while the marker is missing.

> **Historical context below.** It may explain earlier decisions, but it must not override this current authority overlay, the reviewed `main` ref, or live evidence.

## Truth rules

Keep these evidence layers separate:

- code merged into `main`;
- checks that executed against an exact PR head;
- checks that executed against the merge commit on `main`;
- Cloudflare build or deployment evidence;
- live Supabase schema and authorization evidence;
- production-browser evidence;
- physical-device and real-account journey evidence.

A green signal in one layer does not silently prove the others.

## Current launch posture

Se'kret Bip has a substantial integrated product and infrastructure foundation. It is moving toward **controlled-alpha readiness**, not unrestricted public-launch readiness.

Public launch, app-store release, and production teen-data collection remain blocked until the applicable relationship, deletion, authorization, device, accessibility, legal, safeguarding, moderation, support, backup, restore, rollback, and incident-response gates have evidence.

## Repository progress through July 23

### Merged front door

PR #594 merged the polished responsive web welcome screen into `main`.

Its exact PR head `e3f8f38bced1e3a5b27ef9fd35a3d5b06019ba9c` passed:

- Cookie Contract Mirror;
- Front Door Exact-Head Gate;
- base-versus-head TypeScript diagnostic comparison with no new diagnostics;
- focused Playwright for the welcome screen, click and keyboard entry, age-bucket continuation, and narrow-phone overflow.

This proves the scoped front-door change at that PR head. It does not by itself prove the current merge commit, `sekretbip.net`, Supabase Auth, RLS, native devices, or a complete founder-access journey.

### Merged test and migration-history repair

PR #577 merged into `main` at `9cd5d6d4641160b9425320e31482a4bd05eb25c2`.

It:

- repaired 18 failing unit-test assertions without weakening the intended safety or auth contracts;
- aligned the `expo-splash-screen` lockfile range with `package.json`;
- repaired the forgot-password JSX string syntax;
- added migration-history parity for reviewed trigger functions, search paths, and client EXECUTE revokes;
- recorded onboarding trigger functions as repository-complete but not yet verified live;
- preserved the distinction between repository structure, live catalog observation, and behavioral verification.

The PR reported 877 passing unit tests locally. Its exact rebased head passed the focused Front Door Exact-Head Gate, but the complete repository gate did not execute against the merge commit on `main`.

## Historical repair candidates — July 23 (resolved or superseded)

### PR #595 — canonical onboarding-state and repository-gate repair

PR #595 is a draft and is not merged truth.

The original branch diagnosis was valid: active onboarding screens wrote through `src/services/onboarding.ts` to `onboarding_state`, a table no migration creates, while the hardened table is `user_onboarding_state`. The active service also lacked `markActivated()` even though live onboarding screens called it.

The current branch now proposes a preservation-first repair:

- one canonical `src/` onboarding service and context;
- the real table and stage enum;
- checked database errors and bounded compare-and-swap retries;
- local progress mirrored only after confirmed server writes;
- truthful success/failure status from onboarding writes;
- historical root paths retained as compatibility re-exports with exact recovery coordinates;
- Suhana and Sy restored on remaining user-facing and AI-facing boundaries while legacy database IDs remain at persisted compatibility seams;
- the unapproved Apple native dependency removed from the active type graph while its prior implementation is archived;
- known TypeScript and prototype-lint blockers repaired;
- an exact-head gate covering typecheck, lint, focused contracts, the full unit suite, bundle export, and focused Playwright.

Executed exact-head evidence has already proved zero TypeScript diagnostics, repository lint, focused contracts, the full unit suite, bundle export, and the independent front-door gate on recent branch heads. Browser traces then exposed two final test-and-routing issues: an ambiguous password locator and a parent-signup query that was incorrectly routed into teen age assurance. Both are repaired on the current branch, whose final exact-head checks must still complete before promotion.

Until #595 is reviewed, fully green at one exact head, and merged through the separately approved auth/onboarding gate, the current `main` onboarding-state inconsistency remains an open runtime risk.

### PR #596 — Crew invite RPC behavior contract

PR #596 is a draft and is not merged truth.

It adds static positive and negative contract coverage for `redeem_crew_invite(text, text)`, including caller identity, malformed and unknown codes, relationship state, blocked/self/duplicate cases, completed-profile requirements, and server-owned display-name behavior.

The branch reports 911 passing unit tests locally. It must be rebased and exact-head verified after the onboarding/type lane settles.

## Integrated foundation

- Expo Router teen and parent route groups
- Supabase Auth, synchronization, ordered migrations, RLS, Storage, and Edge Functions
- Canonical Cloudflare Worker `sekret-backend`
- Canonical Cloudflare Pages project `sekret-bip`
- Shared typed frontend-to-Worker contracts for companion replies, transcription, speech, health, stable errors, trace IDs, fallback state, and avatar state
- Companion reply, transcription, speech, and metadata-only telemetry flows
- Versioned Se'kret identity and named-companion style contracts
- Suhana and Sy as canonical display/canon names, with `raylene` and `rylane` retained only where compatibility still requires the legacy identifiers
- Teen Room, Pages, voice reflection, Calm tools, Circle surfaces, rewards infrastructure, and trusted-relationship surfaces
- **Privacy-safe Daily Intentions** with local deterministic generation, explicit mode controls, and owner-only durable metadata
- Mind + Body Reset regulation tools and timer-driven bodyweight routines
- Bridge linking, consent, summary, revocation, and controlled-rollout contracts
- Founder Control Room operational sources and repository capability claims
- Exact-release verification machinery using Worker checks, `release.json`, backend health, production Playwright, and retained evidence

## Verified authorization and operations slices

- rollback-contained owner, cross-user, anonymous, founder, and guardian proof for sampled boundaries;
- server-owned configuration tables hardened with zero client grants and preserved service access;
- `notification_deliveries` verified as service-role-only;
- obsolete release and probe Edge Functions retired as JWT-protected, side-effect-free HTTP 410 functions;
- permanent-account restrictions for sampled private self-data;
- fail-closed negative-auth source contracts for `account-delete` and `safety-scan`;
- safety-scan durable output restricted to reduced metadata rather than raw content;
- reviewed trigger-function inventory and migration-history parity improvements merged through PR #577.

Trigger assurance is still not behaviorally complete. Repository structure and read-only live catalog observations are not substitutes for rollback-contained behavior probes with controlled external effects.

## Integrated but not fully verified or released

### Authentication and onboarding

Auth, consent, age assurance, profile bootstrap, and onboarding routes exist. Founder Access Recovery Gate issue #563 remains the primary user-facing blocker until one real account can complete signup, login, confirmation or recovery, consent, onboarding, route bootstrap, persistence, logout, and cache cleanup on device.

The onboarding-state wiring inconsistency being repaired in draft PR #595 must be merged and then proven in the intended database and real-device journey before this path is treated as reliable.

### Privacy-safe Daily Intentions

The Teen User Room can generate up to three local-first intentions from broad mood and app-action inputs, with Basic, explicit opt-in Personalized, and Off modes. The durable record excludes raw journal text, conversation excerpts, voice transcripts, Circle content, parent summaries, safety evidence, names, emails, and other private source material. Exact production observation and physical-device layout and interaction QA remain incomplete.

### Frontend-to-Worker contract spine

The canonical client and shared contracts are integrated. Exact production observation and complete user-facing proof remain for authentication failures, rate limits, timeouts, offline behavior, safety responses, malformed responses, fallback state, and unavailable voice.

### Companion identity and style

Canonical identity and style rules are consumed in Worker paths, and PR #592 added runtime output repair for legacy display-name leaks. Remaining app and service references must distinguish legacy persisted identifiers from user-facing Suhana and Sy display truth.

### Parent and Bridge

Parent routes, linked-account data, Bridge contracts, and runtime paths exist. Bridge remains controlled until a complete two-account production journey proves intentional linking, private-source isolation, teen preview and confirmation, parent summary-only visibility, revocation, fresh re-share, unlink, deletion, second-user isolation, and cleanup.

### Account deletion

Deletion contracts and UI entry points exist, but full proof remains incomplete across database rows, Auth handling, Storage objects, local caches, relationship access, retries, durable receipts, and second-user restoration.

### Mobile and accessibility quality

Physical iOS and Android journeys, screen-reader behavior, keyboard and focus behavior, contrast, motion, safe areas, touch targets, offline states, notifications, timers, and movement-safety checks remain incomplete.

## Launch-critical blockers

- complete and merge the canonical onboarding-state repair through its separate approval gate;
- complete founder access recovery on a real device and account;
- complete controlled Bridge and parent relationship production proof;
- complete account deletion and Storage cleanup proof;
- continue anonymous and cross-user denial proof for remaining launch-critical private surfaces;
- add positive and negative behavior tests for the remaining high-blast-radius authenticated RPCs;
- complete trigger behavioral assurance with safe external-effect controls;
- complete physical-device, accessibility, offline, notification, moderation, and failure-state QA;
- complete legal, safeguarding, app-store, support, incident-response, backup, restore, and rollback readiness;
- obtain exact production evidence for features still marked integrated rather than verified or released.

## Planned only — not implemented

- durable L4 continuity memory;
- persistent companion goals;
- scheduled reflection jobs;
- relationship phases derived from durable evidence;
- inter-companion coordination;
- L5 cross-companion synthesis and consented goal proposals.

L4 remains blocked until ownership, provenance, correction, expiration, deletion, RLS, denial tests, one real consumer, rollout, telemetry, and rollback are approved together. L5 remains blocked until L4 reaches `verified` and a separate cross-companion consent contract is approved.

## Canonical references

- `implementation-ledger.json`
- `implementation-ledger.extensions/`
- `SPRINT.md`
- `docs/LAUNCH_ROADMAP.md`
- `docs/DOCUMENTATION_MAP.md`
- `docs/WIRING_STATUS.md`
- `docs/REPO_KNOWLEDGE_REFRESH_2026-07-20.md`
- `docs/DEMO_READINESS_ENFORCEMENT.md`
- `docs/security/SUPABASE_AUTHORIZATION_PHASE0.md`
- `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md`
- `DEPLOYMENT.md`

Documentation is an implementation guardrail. When code, production configuration, evidence, and documentation disagree, stop and reconcile the stale source rather than selecting the happiest version.
