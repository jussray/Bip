# Se'kret Bip — Current Sprint

**Sprint date:** 2026-07-29  
**Default branch:** `main`  
**Verified repository baseline reviewed:** `eeebc15ebd3dc9b420dab04def0d121f41524670`  
**Current launch-gate source:** `docs/LAUNCH_GATE_STATUS_2026-07-29.md`

`implementation-ledger.json` remains the machine-checked feature-state source. A green PR proves only the scope and evidence that actually ran against its exact head.

## Sprint theme

**Restore one current truth layer and remove false launch signals.**

Move Se'kret Bip toward controlled-alpha readiness by binding every launch claim to the exact repository, deployment, browser, and device evidence that supports it.

## Current baseline

### Merged into `main`

- PR #595 repaired the canonical onboarding-state path.
- PR #596 added Crew invite RPC behavior contracts.
- PR #688 made restored-session account switching fail closed.
- PR #691 repaired stale main-contract authority.
- PR #695 reconciled canonical Cloudflare operator documents and passed its exact-head gate, unit suite, and type-check.

### P0 release blocker

[P0 issue #696](https://github.com/jussray/Sekret-Bip/issues/696) is open: the local Expo build emits both release markers, but live `sekretbip.net` serves application fallbacks instead of JSON at the canonical well-known marker and the legacy marker. Do not claim an exact deployed web SHA, production release, or public launch until this is fixed and independently witnessed.

### In-flight review lanes

1. PR #690 — password recovery must preserve the prior sign-in route and safely fall back for a direct recovery link. Fresh exact-head checks, zero review threads, and zero base drift are required.
2. PR #692 — Calm controls is retargeted to `main` but currently requires a clean rebase before Product Design review, exact-head checks, or merge consideration.

## Immediate execution order

1. Cloudflare administrator resolves #696 and records the exact Pages build, marker response, Worker health, and production Playwright evidence.
2. Rebase and exact-head verify PR #690; merge only after its final head is green and current.
3. Rebase/reconstruct PR #692 from current `main`; inspect the real Calm user path and capture Product Design evidence before merge.
4. Keep the canonical Markdown and documentation contracts aligned with the live gate and current `main`.
5. Continue the independent launch gates: authorization, deletion, parent/Bridge lifecycle, accessibility, device QA, legal, safeguarding, moderation, support, backup, restore, incident response, and rollback.

## Explicit non-goals

- No public launch declaration.
- No direct Pages upload or production credential change from this sprint.
- No new L4 continuity-memory schema.
- No L5 synthesis, autonomous goals, or cross-companion coordination.
- No broad parent visibility, content-sharing expansion, or teen-data scope increase.

## Definition of done

- the canonical launch documents name the exact current repository ref and P0 blocker;
- every merge candidate has current-base, exact-head, review-thread, and scoped proof;
- the public release marker returns JSON for the exact intended `main` SHA;
- worker, browser, device, privacy, and operational claims remain separately evidenced;
- no historical PR text is presented as current implementation or deployment truth.

Only after launch-critical work is complete, design the smallest safe L4 schema. Only after L4 reaches `verified`, consider an L5 consent contract.