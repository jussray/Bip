# Repo Knowledge Refresh — baseline 2026-07-20, refreshed 2026-07-23

This is the current agent-orientation checkpoint for Se'kret Bip. It began as the July 20 reset after the late-July repository surge and was refreshed on July 23 after PRs #594 and #577 merged.

Use this file to prevent stale agents, email summaries, issue snapshots, and prior chat conclusions from operating from an old repository map.

## Current repository authority

- Canonical active repo: `jussray/Sekret-Bip`.
- Default branch: `main`.
- Current reviewed `main`: `9cd5d6d4641160b9425320e31482a4bd05eb25c2`.
- That commit is the merge of PR #577.
- Current architecture: React Native + Expo Router + TypeScript frontend, Supabase Auth/Postgres/RLS/Storage/Edge Functions, Cloudflare Worker API, and Cloudflare Pages web deployment.
- Canonical backend Worker: `sekret-backend`.
- Canonical Pages project: `sekret-bip`.
- Schema source of truth: `supabase/migrations/`.

The app is not a one-file prototype. It has active `app/(auth)`, `app/(onboarding)`, `app/(teen)`, `app/(parent)`, and `app/(dev)` route groups, Worker code, Supabase migrations and functions, Playwright tests, agent skills, Control Room manifests, design artifacts, and implementation evidence.

## What changed since the July 20 snapshot

### PR #594 merged the polished web front door

PR #594 promoted the approved responsive welcome screen into the Expo web root.

Its exact head `e3f8f38bced1e3a5b27ef9fd35a3d5b06019ba9c` passed:

- Cookie Contract Mirror;
- Front Door Exact-Head Gate;
- base-versus-head TypeScript diagnostic comparison with no new diagnostics;
- focused Playwright for render, click and keyboard entry, age-bucket continuation, and narrow-phone overflow.

This is real exact-head proof for the scoped front-door change. It is not proof of the later merge SHA, `sekretbip.net`, Supabase Auth, RLS, production deployment, native devices, or founder access.

### PR #577 merged test and migration-history repairs

PR #577 merged into `main` at `9cd5d6d4641160b9425320e31482a4bd05eb25c2`.

It:

- repaired 18 failing or stale unit-test assertions;
- preserved the intended safety and authorization contracts;
- aligned the `expo-splash-screen` lockfile range;
- repaired the forgot-password JSX string syntax;
- added migration-history parity for reviewed trigger-function search paths, client EXECUTE revokes, and the auth-email synchronization trigger;
- recorded onboarding trigger functions honestly as repository-complete but not yet observed live.

The PR reported 877 passing unit tests locally. Its exact rebased head passed the focused front-door gate. The complete repository gate did not execute against the merge commit on `main`.

### Canonical companion naming advanced

Suhana and Sy are the canonical display/canon names.

Legacy identifiers `raylene` and `rylane` may remain where database, storage, analytics, route, fixture, or compatibility contracts still require them. User-facing and AI-facing paths must normalize legacy values rather than leak retired display names.

PR #592 merged runtime repair for legacy display-name output. Draft PR #595 continues propagation through remaining app, voice, safety, and service paths.

## Current open repair candidates

### PR #595 — onboarding-state and type-check repair

PR #595 is draft and not merged truth.

It reports that the active onboarding screens write through `src/services/onboarding.ts` to `onboarding_state`, a table that no repository migration creates. The real hardened table is `user_onboarding_state`.

It also reports that active screens call `markActivated()` while the current active service does not define it, and that a more complete duplicate implementation exists outside the live import path.

Treat this as the first runtime repair until review disproves it.

The branch reports:

- 906 passing unit tests locally;
- one remaining TypeScript error from `expo-apple-authentication` in an unused component;
- two pre-existing prototype lint errors;
- only Cookie Contract Mirror attached to the exact head.

### PR #596 — Crew invite RPC behavior contract

PR #596 is draft and not merged truth.

It adds static positive and negative behavior coverage for `redeem_crew_invite(text, text)` and reports 911 passing unit tests locally. No exact-head GitHub Actions run is attached.

## Current primary user-facing blocker

Founder Access Recovery Gate issue #563 remains the primary user-facing launch blocker.

Ray must personally prove on a real device that one permanent account can:

1. sign up through the intended Supabase client and environment;
2. log in;
3. survive confirmation and recovery links;
4. persist a session;
5. record required consent;
6. advance age, role, name, and onboarding state through one canonical path;
7. reach the correct teen or parent route;
8. log out and clear private transient state.

No controlled-alpha-ready or launch-proof language is allowed until that journey is observed.

## Current launch blockers

- canonical onboarding-state wiring and founder access recovery;
- complete repository type, lint, test, bundle, audit, and Playwright proof;
- live deployment and catalog verification for the PR #577 migration-history repairs;
- complete account deletion across database, Auth, Storage, caches, relationship access, retries, receipts, and second-user isolation;
- controlled Bridge and parent two-account production proof;
- remaining anonymous and cross-user authorization proof;
- behavior coverage for remaining high-blast-radius authenticated RPCs;
- trigger behavioral assurance with controlled external effects;
- physical-device, accessibility, offline, notification, moderation, and failure-state QA;
- legal, safeguarding, app-store, support, incident-response, backup, restore, and rollback readiness.

## Evidence separation rules

Never blend these witnesses:

1. repository code state;
2. local test reports;
3. GitHub Actions exact-head state;
4. merge-SHA state on `main`;
5. Cloudflare build or deployment state;
6. live Supabase migration and authorization state;
7. production-browser state;
8. physical-device and real-account state;
9. Product Design, Figma, Canva, or static mockup state.

A valid claim must name the repository, branch or PR, exact SHA, environment, evidence type, and what remains unproved.

If GitHub Actions has no jobs, no steps, or no logs, classify it as infrastructure evidence, not a code regression.

Cloudflare success does not prove GitHub checks, Supabase, auth, RLS, Playwright, or devices. GitHub success does not prove Cloudflare or live production. A screenshot does not prove runtime data boundaries.

## Agent operating rules from this refresh

1. Start nontrivial work with `AGENTS.md`, `SPRINT.md`, this refresh, `.agents/skills/bip-current-state/SKILL.md`, and the relevant issue or PR authority.
2. Check the real repository before repeating an email, issue, or prior-chat conclusion.
3. Check Founder Control Room before cross-repo, CI, outage, Cloudflare, release, or production claims.
4. Treat draft PR bodies as proposed diagnoses and self-reported local evidence, not merged truth.
5. Preserve legacy identifiers only where compatibility requires them; use Suhana and Sy for display/canon truth.
6. Do not create a second onboarding, auth, schema, deployment, or state authority.
7. Do not delete preserved Ray/Juss work merely to make the repository look cleaner.
8. Do not perform production deploys, Supabase mutations, credential changes, paid-capacity changes, external publication, destructive deletion, or DNS/Worker authority changes without explicit founder approval.

## Immediate next proof loop

1. Review and exact-head verify PR #595.
2. Resolve the Apple-auth TypeScript decision and prototype lint errors.
3. Rebase and exact-head verify PR #596 after #595 changes the base.
4. Run the full repository gate on the resulting exact head and merge SHA.
5. Deploy and verify the intended Supabase migrations before claiming live parity.
6. Complete founder access recovery on device.
7. Continue deletion, Bridge, authorization, RPC, trigger, mobile-quality, and launch-operations proof in the order defined by `SPRINT.md`.

When this file conflicts with an older dated snapshot, issue description, email, or chat summary, verify the current repository and update the stale source. Do not select the most convenient version.
