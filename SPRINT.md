# Se'kret Bip — Current Sprint

**Sprint theme:** Launch trust and journey proof  
**Last verified:** 2026-07-16  
**Repository:** `jussray/Sekret-Bip`  
**Default branch:** `main`  
**Verified repository baseline:** `ab5cf40b398e02536764b5b806b6f3aec0a9161c`  
**Owner roadmap:** `docs/LAUNCH_ROADMAP.md`

This file is the volatile execution handoff. Verify material claims against GitHub, live Supabase, Cloudflare, tests, and the exact deployed SHA before acting.

`implementation-ledger.json` remains the machine-checked feature-state source. A green PR proves reviewed integration. It does not prove production behavior.

## Sprint outcome

Move Se'kret Bip from a strong integrated foundation toward **controlled-alpha readiness** by proving the launch-critical trust journeys:

1. exact runtime and deployment truth;
2. remaining authorization and denial boundaries;
3. complete teen-parent Bridge and relationship lifecycle;
4. account deletion across database, Storage, local caches, and linked access;
5. physical-device, accessibility, offline, and failure-state quality;
6. named ownership for legal, safeguarding, store, support, and operational gates.

This sprint does **not** promise public launch. It closes the evidence gaps required before a responsible alpha and launch-clearance phase.

## What changed since the previous sprint baseline

Merged into `main`:

- runtime-truth enforcement across GitHub, Supabase, deployment evidence, and Founder Control Room capability claims;
- privacy-safe Daily Intentions in the Teen User Room with local deterministic generation and owner-only durable storage;
- negative-auth contract tests for `account-delete` and `safety-scan`;
- one explicit L5 definition, still blocked behind L4 reaching `verified`;
- Cloudflare verification changes that retain failure evidence instead of allowing deployment uncertainty to disappear.

These are repository integration claims. Any frontend or Worker release still requires exact production observation for the deployed commit.

## Current launch position

| Area | Repository state | Production or journey state | Sprint posture |
|---|---|---|---|
| Core app, routes, Supabase, Worker, Pages | Integrated | Evidence varies by surface | Preserve and prove |
| Release truth and runtime contracts | Integrated | Exact-SHA verification required per release | Launch-critical |
| Daily Intentions | Integrated, privacy-scoped | Device and exact-release observation remain | Verify; do not expand scope |
| Supabase authorization | Contract with several passed slices | Remaining private surfaces and RPCs need focused proof | Launch-critical |
| Bridge and parent lifecycle | Integrated, controlled | Full two-account production journey incomplete | Primary blocker |
| Account deletion | Integrated | End-to-end database, Storage, cache, retry, and isolation proof incomplete | Primary blocker |
| Teen Room, companions, Calm, Circle | Integrated surfaces | Physical-device, accessibility, offline, moderation, and failure-state evidence varies | Quality pass |
| Mind + Body Reset | Integrated, internal | Physical-device timer and movement-safety QA remain | Conditional launch scope |
| Legal, safeguarding, app-store, support | In progress | Clearance incomplete | Primary blocker |
| L4 continuity memory | Planned | Not implemented | Not a launch dependency |
| L5 synthesis | Planned and blocked | Must not start before L4 is verified | Out of sprint |

## Workstream A — Runtime truth and authorization

### Already established

- Cloudflare Workers Builds owns the canonical Worker deployment.
- Cloudflare Pages owns the canonical web deployment.
- GitHub Actions verifies production but does not upload production code.
- Exact release proof requires the expected Worker check, matching `release.json`, healthy backend, production Playwright, and retained evidence.
- Several owner, cross-user, anonymous, founder, guardian, configuration, room-memory, and comfort-session authorization slices have executable proof.
- `account-delete` and `safety-scan` have fail-closed negative-auth source contracts on `main`.

### Sprint completion work

- finish bounded anonymous-auth hardening for remaining launch-critical private tables;
- add positive and negative behavior tests for remaining high-blast-radius authenticated database functions;
- keep migration history, live schema, grants, policies, and runtime claims aligned;
- verify every production-changing merge through the exact release path;
- preserve terminal failure evidence and an actionable rollback.

## Workstream B — Bridge, parent lifecycle, and deletion

### Required Bridge journey

1. teen creates and verifies a permanent account;
2. parent creates and verifies a permanent account;
3. both complete the intended two-party link flow;
4. teen creates private source content;
5. teen previews and confirms an eligible Bridge share;
6. Worker generates a privacy-safe summary;
7. parent sees only the generated summary;
8. revocation removes access immediately;
9. re-share creates a fresh generation without stale exposure;
10. unlink removes relationship access;
11. account deletion removes database, Storage, local, and relationship access;
12. second-user isolation remains correct throughout;
13. test data and artifacts are cleaned up or retained only as privacy-safe receipts.

Bridge summary rollout remains controlled until this deployed journey passes.

### Account-deletion proof

Proof must cover:

- application database rows;
- Auth identity handling;
- Storage objects discovered from live configuration rather than stale hard-coded bucket lists;
- parent and trusted-relationship revocation;
- local private caches;
- retry and idempotency behavior;
- durable metadata-only receipts;
- second-user restore and isolation behavior.

## Workstream C — Mobile product quality

Required physical-device and accessibility proof:

- iOS and Android signup, login, onboarding, Room, Pages, Calm, Circle, More, and parent-link smoke journeys;
- keyboard, screen-reader, contrast, motion, orientation, safe-area, and touch-target checks;
- offline, timeout, 401, 403, 429, malformed-response, safety, and unavailable-voice states;
- Daily Intentions layout, mode controls, completion, privacy sheet, and off-state behavior;
- timer, pause, skip, stop, completion threshold, low-impact alternatives, and movement-safety review for Mind + Body Reset;
- minimal notification content and no private-content leakage into logs or evidence.

Use Playwright for web and release guardrails. Use Maestro for physical mobile user journeys. Introduce deeper native automation only when a proven gap requires it.

## Workstream D — Launch operations

- assign an owner and evidence state to every applicable item in `docs/legal/LAUNCH_COMPLIANCE_CHECKLIST.md`;
- define controlled-alpha cohort, support channel, success conditions, and stop conditions;
- decide launch scope: which integrated features are enabled, controlled, hidden, or explicitly unfinished;
- decide the free/paid boundary only after entitlements, restoration, support, and privacy implications are understood;
- complete incident, moderation, safeguarding, backup, restore, and rollback runbooks;
- ensure launch messaging matches verified behavior rather than repository ambition.

## Immediate execution order

1. Reconcile the latest `main`, live Supabase, and Cloudflare production witnesses before making new status claims.
2. Complete the next bounded private-surface authorization slice, prioritizing Bridge and relationship tables used in the launch journey.
3. Add focused behavior tests for remaining high-blast-radius authenticated database functions.
4. Complete account-deletion database, Storage, cache, retry, receipt, and isolation proof.
5. Run the controlled Bridge two-account production journey with revocation, re-share, unlink, deletion, and cleanup evidence.
6. Run iOS and Android launch-route smoke journeys plus accessibility and failure-state QA.
7. Observe production identity/style, voice, Worker-contract, and Daily Intentions behavior only through metadata-safe witnesses.
8. Assign owners and evidence states to legal, safeguarding, store, support, and operational launch gates.
9. Prepare the controlled-alpha decision packet: scope, cohort, metrics, rollback thresholds, support, and stop conditions.
10. Only after launch-critical authorization work is complete, design the smallest safe L4 schema and one real consumer.
11. Only after L4 reaches `verified`, consider an L5 consent contract. Do not create L5 schema, services, or runtime first.

## Explicit non-goals

Not part of this sprint:

- broad visual redesign unrelated to launch defects;
- a second backend, state system, schema bootstrap, or deployment authority;
- raw-content analytics or Control Room ingestion;
- public launch dates unsupported by capacity and evidence owners;
- L4 dashboards before L4 storage, denial, deletion, and one consumer exist;
- any L5 implementation before L4 reaches `verified`;
- turning every research signal into a feature commitment;
- deleting preserved future work merely to make the launch scope look smaller.

## Definition of done

A sprint item is done only when:

- the canonical implementation or contract is on `main`;
- tests appropriate to its risk pass;
- production-changing work has exact deployed-SHA evidence;
- database-changing work has live migration and authorization evidence;
- user-journey work has the required account, device, revocation, cleanup, and isolation proof;
- privacy-safe evidence is retained;
- rollout and rollback are explicit;
- `implementation-ledger.json` or a validated extension is reconciled;
- `docs/CURRENT_STATUS.md` and `docs/LAUNCH_ROADMAP.md` are updated only when their owned truth changed.

## Escalate immediately when

- a parent can access raw teen source content;
- anonymous or cross-user access succeeds on a private surface;
- a deployment verifier cannot identify the exact live commit;
- deletion leaves private rows, files, caches, or relationship access behind;
- a release artifact or log contains private content, credentials, or broad identifiers;
- a planned L4 or L5 concept is presented as implemented;
- documentation claims more than the code, database, deployed runtime, or observed journey proves.

Computers remain extremely talented at completing the wrong checklist. This sprint is about proving the right one.
