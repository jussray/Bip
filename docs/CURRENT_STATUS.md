# Se'kret Bip — Current Status

**Last reviewed:** 2026-07-20  
**Roadmap:** `docs/LAUNCH_ROADMAP.md`  
**Current execution:** `SPRINT.md`

This is the human-readable product snapshot. `implementation-ledger.json` and validated extensions are the machine-checked source for feature state, evidence, rollout controls, and blockers.

## Launch posture

Se'kret Bip has a substantial integrated product and infrastructure foundation. It is moving toward **controlled-alpha readiness**, not claiming unrestricted public-launch readiness.

Public launch, app-store release, or production teen-data collection remains blocked until applicable relationship, deletion, authorization, device, accessibility, legal, safeguarding, moderation, support, and operational gates have evidence.

## Integrated foundation

- Expo Router teen and parent route groups
- Supabase Auth, synchronization, ordered migrations, RLS, Storage, and Edge Functions
- Canonical Cloudflare Worker `sekret-backend`
- Canonical Cloudflare Pages project `sekret-bip`
- Shared typed frontend-to-Worker contracts for companion replies, transcription, speech, health, stable errors, trace IDs, fallback state, and avatar state
- Companion reply, transcription, speech, and metadata-only telemetry flows
- Versioned Se'kret identity and named-companion style contracts in Worker and TTS paths
- Teen Room, Pages, voice reflection, Calm tools, Circle surfaces, rewards infrastructure, and trusted-relationship surfaces
- Mind + Body Reset regulation tools and timer-driven bodyweight routines
- Bridge linking, consent, summary, revocation, and controlled-rollout contracts
- Founder Control Room operational sources and repository capability claims
- Exact-release production verification using the Worker check, deployed `release.json`, backend health, production Playwright, and retained evidence
- Runtime-truth gates that compare repository claims with live Supabase and production release witnesses
- Implementation Evidence CI enforcement for architecture, roadmap, current-status, and agent-skill claims

## Recently integrated

### July 20 completed repository, docs, and governance sync

The July 20 mainline work that is complete and should be treated as landed repository evidence includes:

- PR #549 completed the repo-side Resend parent invite email documentation and placeholder-only MCP config. Issue #548 is closed as completed for that docs/config lane.
- PR #551 made the default `sekret-backend` Worker config safer for Cloudflare Free-plan preview checks and corrected the custom-domain route pattern.
- PR #552 reconciled Actions Budget Mode with release verification so reduced automatic fan-out does not erase exact-head release/account-lifecycle proof requirements.
- PR #553 added the signed-in account security/password-change path while preserving the existing hardened recovery route.
- PR #556 added the Codex/OpenAI provider baseline plus companion identity/runtime documentation.
- PR #554, PR #555, and PR #557 landed the current Resend onboarding, trigger-function hardening, and relationship-status rebuild lanes on `main`.
- Direct main commits added Cloudflare MCP server configs, corrected the Worker config name to `sekret-backend`, and added per-agent 5W1H config files for Claude, ChatGPT, Perplexity, and Cursor.

These entries record completed repository/doc/config work only. Runtime delivery, live smoke evidence, account/device proof, and production release proof remain governed by their own gates.

### Privacy-safe Daily Intentions

The Teen User Room now has a local-first daily checklist that can produce at most three small intentions.

- Basic mode uses current mood and broad app actions.
- Personalized mode is explicit opt-in and examines up to three recent user-authored companion entries locally.
- No AI or backend request is required to generate the list.
- The durable record contains only the final generic labels and coarse metadata.
- Raw journal text, chat excerpts, companion replies, voice transcripts, Circle content, parent summaries, safety evidence, names, emails, and Bip IDs are excluded.
- The Supabase table is owner-only for permanent authenticated accounts and has no parent or guardian access policy.

Repository integration is complete. Exact production observation and physical-device layout and interaction QA remain evidence tasks.

### Custom-auth Edge Function contracts

Negative-auth tests now enforce that:

- `account-delete` rejects before protected database, Storage, or Auth administration work when the shared secret is missing or wrong;
- `safety-scan` rejects before scanning content when the shared secret is missing or wrong;
- safety scanning stores reduced metadata rather than raw content.

These are repository contract tests. Live operational configuration and end-to-end deletion evidence remain separate responsibilities.

### L5 definition

L5 now has one canonical meaning: cross-companion synthesis under explicit consent, distinguishable autonomous goal proposals, and self-directed reflection scheduling.

L5 is **planned and blocked**. No L5 schema, service, consent flow, or runtime should be created before L4 continuity memory reaches `verified`.

## Verified authorization and operations slices

- Rollback-contained owner, cross-user, anonymous, founder, and guardian proof for sampled boundaries
- Server-owned configuration tables hardened with zero client grants and preserved service access
- `notification_deliveries` verified as service-role-only
- Obsolete release and probe Edge Functions retired as JWT-protected, side-effect-free HTTP 410 functions
- Migration-history alignment for completed security changes
- Existing `bip_events` event-to-points behavior restored without a parallel workout or reward schema
- `comfort_sessions` and `room_memory` restricted to permanent matching owners with anonymous table grants removed
- Rollback-contained private-self-data proof with no retained synthetic application rows
- Runtime-contract health and release gates that fail when production claims drift from live Supabase

Supabase may still emit static role-based warnings for policies whose executable predicates deny anonymous authenticated users. Those warnings must be reported honestly; executable denial proof remains the relevant evidence.

## Integrated but not fully verified or released

### Frontend-to-Worker contract spine

The canonical client and shared contracts are integrated. Exact production observation and complete user-facing proof for authentication failures, rate limits, timeouts, offline behavior, safety responses, malformed responses, fallback state, and unavailable voice remain.

### Companion identity and style

Canonical identity and style rules are consumed by Worker and TTS runtime paths. Production style-version observation and broader user-journey evidence remain before promotion to verified or released.

### Mind + Body Reset

Guided regulation and four workout lengths are integrated with work and rest timers, low-impact alternatives, pause, skip, stop, progress, safety guidance, and completion thresholds. Physical iOS and Android, accessibility, timer, and movement-safety QA remain.

### Parent and Bridge

Parent routes, linked-account data, Bridge contracts, and runtime paths exist. Bridge summaries remain controlled until the complete two-account production journey proves:

- intentional linking;
- private-source isolation;
- teen preview and confirmation;
- parent summary-only visibility;
- revocation;
- fresh re-share behavior;
- unlink;
- deletion;
- second-user isolation;
- cleanup evidence.

Parent onboarding, guardian verification, relationship lifecycle states, Parent Circle privacy, Parent Coach boundaries, minimal-content notifications, physical-device QA, and end-to-end privacy evidence remain open.

### Founder Control Room

Operational data sources and repository capability contracts exist. Every panel must retain freshness and honest unavailable states. Raw teen content and broad user identifiers are forbidden. Observer panels must not claim identity, style, voice, memory, or release state without the corresponding runtime source.

## Launch-critical blockers

- Complete controlled production proof for Bridge and parent relationship journeys
- Complete account deletion across database rows, Auth handling, Storage objects, local caches, relationship access, retries, durable receipts, and second-user isolation
- Continue focused anonymous and cross-user denial proof for launch-critical Bridge, activity, rewards, tasks, relationships, and other private surfaces
- Add positive and negative behavior tests for remaining high-blast-radius authenticated database functions
- Plan password-breach protection with Auth regression evidence
- Complete physical-device, accessibility, offline, notification, and failure-state QA
- Complete applicable legal, safeguarding, moderation, app-store, support, incident-response, backup, restore, and rollback readiness
- Obtain exact production evidence for features still marked integrated rather than verified or released

## Planned only — not implemented

- Durable L4 continuity memory
- Persistent companion goals
- Scheduled reflection jobs
- Relationship phases derived from durable evidence
- Inter-companion coordination
- L5 cross-companion synthesis and consented goal proposal

L4 remains blocked until ownership, provenance, correction, expiration, deletion, RLS, denial tests, one real consumer, rollout, telemetry, and rollback are approved together. L5 remains blocked until L4 reaches `verified` and a separate cross-companion consent contract is approved.

## Canonical references

- `implementation-ledger.json`
- `implementation-ledger.extensions/`
- `SPRINT.md`
- `docs/LAUNCH_ROADMAP.md`
- `docs/DOCUMENTATION_MAP.md`
- `docs/WIRING_STATUS.md`
- `docs/DEMO_READINESS_ENFORCEMENT.md`
- `docs/security/SUPABASE_AUTHORIZATION_PHASE0.md`
- `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md`
- `DEPLOYMENT.md`

Documentation is an implementation guardrail. When code, production configuration, evidence, and documentation disagree, stop and reconcile the stale source rather than selecting the happiest version.
