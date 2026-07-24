# Se'kret Bip — Current Sprint

**Sprint theme:** Restore one current truth layer, then close launch-critical trust gaps  
**Last verified:** 2026-07-23  
**Repository:** `jussray/Sekret-Bip`  
**Default branch:** `main`  
**Verified repository baseline reviewed:** `9cd5d6d4641160b9425320e31482a4bd05eb25c2`  
**Owner roadmap:** `docs/LAUNCH_ROADMAP.md`

This file is the volatile execution handoff. Verify material claims against GitHub, live Supabase, Cloudflare, tests, the exact deployed SHA, and real-device evidence before acting.

`implementation-ledger.json` remains the machine-checked feature-state source. A green PR proves only the scope and evidence that actually ran against its exact head.

## Sprint outcome

Move Se'kret Bip toward controlled-alpha readiness by doing the work in this order:

1. keep Markdown and agent understanding aligned with current repository truth;
2. restore one canonical onboarding-state runtime path;
3. close the remaining repository type and lint debt;
4. continue bounded authorization and authenticated-RPC behavior proof;
5. complete founder access recovery on a real device;
6. complete deletion and Bridge two-account production proof;
7. complete physical-device, accessibility, offline, notification, moderation, and failure-state QA;
8. assign evidence owners for legal, safeguarding, store, support, and operations.

This sprint does **not** promise public launch. It closes evidence gaps required before a responsible controlled alpha and later launch-clearance decision.

## Current baseline

### Merged into `main`

- PR #594: polished responsive web welcome screen promoted into the live Expo web root.
- PR #594 exact-head proof: Cookie Contract Mirror, no-new-TypeScript-diagnostics comparison, and focused Playwright for render, click/keyboard entry, age-bucket continuation, and narrow-phone overflow.
- PR #577: 18 stale or failing unit-test assertions repaired without weakening intended safety/auth contracts.
- PR #577: trigger-function migration-history parity improvements, lockfile range correction, and forgot-password JSX repair.
- PR #592: runtime repair for legacy Raylene/Rylane display-name leaks while preserving compatibility aliases.

### Proof limits

- The current `main` merge commit is `9cd5d6d4641160b9425320e31482a4bd05eb25c2`.
- The complete repository gate has not executed against that merge SHA.
- PR #594's exact-head gate is valid for its scoped front-door head, not automatic proof of the later merge commit or live domain.
- PR #577 reported 877 passing unit tests locally, but type-check debt remained outside its focused scope.
- Cloudflare deployment comments, GitHub Actions results, live Supabase state, production-browser behavior, and physical-device behavior remain separate witnesses.

## Current repair queue

### 1. PR #595 — canonical onboarding-state path

**Status:** draft, not merged.

The branch reports a real runtime inconsistency:

- active screens import `src/services/onboarding.ts`;
- that service targets `onboarding_state`, which no repository migration creates;
- the real hardened table is `user_onboarding_state`;
- active screens call `markActivated()`, which the current active service does not define;
- a more complete duplicate implementation exists outside the active import path.

Required outcome:

- one canonical onboarding context and service;
- real table and enum names;
- safe baseline-row creation without clobbering progress;
- allowed-column writes only;
- stage and timestamp updates that satisfy database trigger rules;
- tests that inspect the implementation users actually execute;
- no duplicate active state system left behind.

The branch reports 906 passing unit tests locally, one remaining TypeScript error from `expo-apple-authentication` in an unused component, and two pre-existing prototype lint errors. Only Cookie Contract Mirror is currently attached to its exact head.

### 2. PR #596 — Crew invite RPC behavior contract

**Status:** draft, not merged.

The branch adds static positive and negative coverage for `redeem_crew_invite(text, text)` and reports 911 passing unit tests locally. It currently has no exact-head GitHub Actions run.

Keep the scope focused, but use its inventory to continue behavior coverage for the remaining untested authenticated SECURITY DEFINER RPCs.

## Workstream A — Repository truth and verification

### Completion work

- update canonical Markdown before using old issue, PR, email, or agent summaries;
- require exact repository, branch, and SHA in status claims;
- distinguish local checks, exact-head GitHub checks, merge-SHA checks, Cloudflare builds, live Supabase evidence, production Playwright, and device proof;
- keep zero-step or no-log jobs classified as infrastructure evidence, never application-code diagnosis;
- retain terminal failure evidence and an actionable next gate;
- run the full repository gate after the current onboarding/type repair lands.

## Workstream B — Authentication and onboarding

### Founder access proof path

1. signup renders and submits with the intended Supabase client and environment;
2. login authenticates a permanent account;
3. confirmation and recovery links route correctly;
4. session persists across refresh or app restart;
5. required consent saves before durable onboarding milestones;
6. age, role, name, and onboarding state advance through one canonical service;
7. post-auth bootstrap reaches the correct teen or parent surface;
8. logout clears private transient account and onboarding state;
9. Ray verifies the complete path on a real device.

No founder-access, alpha-ready, or launch-proof language is allowed until this journey is observed.

## Workstream C — Runtime truth and authorization

### Already established

- Supabase migrations are the schema source of truth.
- Several owner, cross-user, anonymous, founder, guardian, configuration, room-memory, and comfort-session authorization slices have executable proof.
- `account-delete` and `safety-scan` have fail-closed negative-auth source contracts.
- PR #577 improved structural trigger-function and migration-history coverage.

### Completion work

- verify repository migration history against the live catalog after the new migrations are deployed;
- build rollback-contained behavior probes for trigger functions;
- isolate or safely stub external effects such as `pg_net`, Edge Functions, notifications, and queues;
- add positive and negative behavior tests for remaining high-blast-radius authenticated RPCs;
- continue bounded anonymous-auth hardening for launch-critical private surfaces;
- preserve zero retained synthetic private rows and explicit cleanup evidence.

Do not mark trigger assurance verified from structure or read-only catalog observation alone.

## Workstream D — Bridge, parent lifecycle, and deletion

### Required Bridge journey

1. teen and parent create and verify permanent accounts;
2. both complete the intended link flow;
3. teen creates private source content;
4. teen previews and confirms an eligible Bridge share;
5. Worker creates a privacy-safe summary;
6. parent sees only the summary;
7. revocation removes access immediately;
8. re-share creates a fresh generation;
9. unlink removes relationship access;
10. deletion removes database, Storage, local, and relationship access;
11. second-user isolation remains correct;
12. test data and artifacts are cleaned up or retained only as privacy-safe receipts.

Bridge summary rollout remains controlled until this deployed journey passes.

### Account-deletion proof

Proof must cover:

- application database rows;
- Auth identity handling;
- Storage objects discovered from live configuration;
- parent and trusted-relationship revocation;
- local private caches;
- retry and idempotency behavior;
- durable metadata-only receipts;
- second-user restore and isolation.

## Workstream E — Mobile product quality

Required physical-device and accessibility proof:

- iOS and Android signup, login, onboarding, Room, Pages, Calm, Circle, More, and parent-link smoke journeys;
- keyboard, screen-reader, contrast, motion, orientation, safe-area, and touch-target checks;
- offline, timeout, 401, 403, 429, malformed-response, safety, and unavailable-voice states;
- Daily Intentions layout, controls, completion, privacy sheet, and off-state behavior;
- timer, pause, skip, stop, completion threshold, low-impact alternatives, and movement-safety review for Mind + Body Reset;
- minimal notification content and no private-content leakage into logs or evidence.

Use Playwright for web and release guardrails. Use Maestro for physical mobile journeys.

## Workstream F — Launch operations

- assign an owner and evidence state to every applicable item in `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md`;
- define the controlled-alpha cohort, support channel, success conditions, and stop conditions;
- decide which integrated features are enabled, controlled, hidden, or explicitly unfinished;
- complete incident, moderation, safeguarding, backup, restore, and rollback runbooks;
- ensure launch messaging matches verified behavior rather than repository ambition.

## Immediate execution order

1. Complete this Markdown truth refresh and use it as the new orientation baseline.
2. Review, repair, and exact-head verify PR #595.
3. Resolve the `expo-apple-authentication` decision and the two prototype lint errors so the full type and lint gates can actually pass.
4. Rebase and exact-head verify PR #596 after #595 changes the base.
5. Run the complete repository gate on the resulting exact head and then on the merge commit.
6. Deploy and verify the PR #577 trigger-history migrations in the intended Supabase project before claiming live parity.
7. Continue the next bounded private-surface authorization and authenticated-RPC behavior slices.
8. Complete founder access recovery on a real device.
9. Complete account deletion and the controlled Bridge two-account journey.
10. Run mobile, accessibility, offline, notification, moderation, and failure-state QA.
11. Prepare the controlled-alpha decision packet with scope, cohort, metrics, rollback thresholds, support, and stop conditions.
12. Only after launch-critical work is complete, design the smallest safe L4 schema and one real consumer.
13. Only after L4 reaches `verified`, consider an L5 consent contract.

## Explicit non-goals

- broad visual redesign unrelated to a launch defect;
- a second backend, state system, schema bootstrap, or deployment authority;
- raw-content analytics or Control Room ingestion;
- public launch dates unsupported by capacity and evidence owners;
- L4 dashboards before L4 storage, denial, deletion, and one consumer exist;
- any L5 implementation before L4 reaches `verified`;
- destructive cleanup performed only to make the repository look smaller.

## Definition of done

A sprint item is done only when:

- the canonical implementation or contract is on `main`;
- tests appropriate to its risk executed and passed;
- production-changing work has exact deployed-SHA evidence;
- database-changing work has live migration and authorization evidence;
- user-journey work has the required account, device, revocation, cleanup, and isolation proof;
- privacy-safe evidence is retained;
- rollout and rollback are explicit;
- `implementation-ledger.json` or a validated extension is reconciled;
- the canonical Markdown owners describe the tested truth, not the intended future.

## Escalate immediately when

- a parent can access raw teen source content;
- anonymous or cross-user access succeeds on a private surface;
- a deployment verifier cannot identify the exact live commit;
- deletion leaves private rows, files, caches, or relationship access behind;
- a release artifact or log contains private content, credentials, or broad identifiers;
- a planned L4 or L5 concept is presented as implemented;
- documentation claims more than the code, database, deployed runtime, or observed journey proves.

Computers remain extremely talented at completing the wrong checklist. This sprint is about proving the right one.
