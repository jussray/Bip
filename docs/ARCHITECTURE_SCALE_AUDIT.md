# Se'kret Bip — Architecture Audit for 1K to 100K Users

> **Historical audit snapshot.** Originally produced for issue #141 before the July 13 implementation-evidence, exact-release, companion-style, and Supabase authorization work. The findings below are preserved as an audit trail. Current feature state is governed by `implementation-ledger.json`, `docs/CURRENT_STATUS.md`, and live evidence.

Last reconciled with current documentation: 2026-07-13

## Changes since the original audit

The following material changes now exist:

- architecture and status claims are checked by the Implementation Evidence gate;
- the canonical Worker is `sekret-backend` and the Pages project is `sekret-bip`;
- production verification uses an exact Worker check, deployed `release.json`, health verification, and production Playwright;
- the Supabase `release-health` function is retired behind JWT protection and is not release evidence;
- server-owned configuration tables have zero client grants with preserved rows and service-role access;
- `notification_deliveries` is verified as intentionally service-role-only;
- three obsolete Edge Functions are JWT-protected HTTP 410 retirements;
- the companion identity/style contract is integrated into Worker and TTS runtime paths;
- L4 continuity memory remains planned and blocked by remaining authorization work.

## Matters before meaningful scale

### Point-ledger schema correctness

The original audit found incompatible `point_transactions` assumptions and missing `point_balances` support. The schema reconciliation migration addressed the immediate correctness defect.

The lasting lesson remains: migrations, RPC bodies, and client expectations need executable contract checks. The implementation-evidence gate prevents unsupported feature claims, but it does not replace schema-behavior tests.

### Point transaction authorization

Before points can purchase real inventory, verify that clients cannot fabricate positive transactions. Prefer server-owned writes through reviewed RPCs or APIs, narrow direct grants, and test negative paths.

This remains a product-integrity and fraud boundary, not merely a scale optimization.

### Point-earning limits

Point-earning events require server-side caps, idempotency, and reconciliation before rewards become financially material. Monitor first, but do not connect unbounded client events to redeemable merchandise.

### Route ownership regressions

`(teen)` and `(parent)` are canonical route groups. Historical `(main)` references must not re-enter current code. CI or repository checks are preferable to reviewer memory.

Route grouping remains a presentation boundary, not authorization.

### Multi-device conflict behavior

Local/cloud synchronization still needs an explicit conflict strategy before the product can claim lossless multi-device editing. Last-write-wins may be acceptable for an early release when disclosed, but silent conflict loss should become visible before usage broadens.

## Matters at growth scale

### AI request and cost controls

At early scale, measure per-user AI and voice cost. At larger scale, introduce budgets, abuse limits, queueing, graceful degradation, and model-routing controls based on observed traffic rather than speculative complexity.

Safety and crisis handling must never be throttled merely to meet a cost ceiling.

### Voice and Worker boundaries

The canonical Worker currently owns reply and voice orchestration. Splitting voice into a separate service should be justified by latency, reliability, or concurrency evidence, not architecture fashion.

### Media retention

Voice notes and images need approved retention and deletion rules before a large corpus accumulates. Retention design is a privacy requirement as well as a storage-cost requirement.

### L4 continuity memory

The current runtime supports short-term history and approved context. Durable continuity memory, persistent goals, scheduled reflection, and inter-companion coordination remain planned.

L4 is not a scale blocker, but it is a privacy-sensitive product capability. It must include ownership, provenance, correction, expiry, deletion, RLS, denial tests, runtime use, rollout, telemetry, and rollback before activation.

### Observability and retries

Current metadata-only telemetry and Founder Control Room sources provide operational visibility. Exact-release verification now proves which Worker and Pages commit is serving production.

Remaining scale work includes:

- durable retry/backoff for failed client synchronization;
- queue visibility;
- per-provider cost and latency budgets;
- alerting that does not expose private teen content;
- production observation of companion style-version metadata.

The retired Supabase `release-health` function must not be cited as current observability or deployment proof.

### Moderation and safety

Moderation and safety capacity must scale with usage and must not be capped for cost reasons. The two remaining custom-auth Edge Functions require negative-auth evidence, and broader safety operations still require human and legal review.

## Cross-cutting event and ledger consistency

Activity events and point transactions can drift when written in separate operations. A periodic reconciliation process is a better-sized response than distributed transactions unless real traffic proves stronger guarantees are necessary.

Before rewards become financially material, define:

- authoritative event source;
- idempotency key;
- reconciliation frequency;
- fraud review path;
- rollback and correction behavior.

## Recommended order from current state

1. Finish high-blast-radius database-function behavior tests.
2. Add negative-auth tests for `account-delete` and `safety-scan`.
3. Complete account deletion and Storage cleanup proof.
4. Complete controlled Bridge and parent relationship production journeys.
5. Add server-side point caps and fraud boundaries before real merchandise redemption.
6. Define media retention before significant user growth.
7. Build one privacy-reviewed L4 continuity path only after its trust boundary is approved.
8. Revisit service splitting, queues, and advanced scaling from observed production data.

Do not turn a scale audit into a shopping list of infrastructure. The next architecture should be purchased with evidence, not anxiety.
