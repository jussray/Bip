# Supabase Authorization Phase 0

**Verified:** 2026-07-13  
**Project:** Se'kret Bip (`tbsevonvegdnlyjgplmm`)  
**Purpose:** establish live authorization truth and a reusable denial-proof harness before L4 persistence or broad policy rewrites.

## Decision

Phase 0 is an inventory and proof boundary, not a migration bundle.

No production DDL was applied. No production user content was used. The live proof created two synthetic users and synthetic private rows inside one transaction, switched between `authenticated` and `anon`, recorded the results, and rolled the entire transaction back.

The evidence is machine-readable in `security/supabase-authorization-baseline.json`. The reusable SQL is `supabase/probes/authorization_phase0.sql`.

## Live migration truth

The latest live migration is:

```text
20260712184711 optimize_circle_policy_plans
```

Older sprint and issue text that named `20260711193738 guardian_review_queue` as the latest migration is stale.

## RLS-enabled tables with no policies

The four advisor findings are not one trust boundary.

| Table | Live grants | Classification | Decision |
|---|---|---|---|
| `app_config` | broad `anon`, `authenticated`, and `service_role` table privileges | intentional deny dependent on zero policies, with unnecessary client grants | revoke client table privileges in a separate reviewed migration; do not add a public read policy by accident |
| `app_private_config` | broad `anon`, `authenticated`, and `service_role` table privileges | intentional deny dependent on zero policies, with unnecessary client grants | same narrow grant-hardening migration as `app_config` |
| `guardian_verification_reviews` | `service_role` only | intentional server-only table | document and scanner-test the exception; do not add a client policy |
| `notification_deliveries` | `service_role` only | intentional server-only table | preserve the existing boundary |

RLS with zero policies currently denies client rows even when table privileges exist. That does not make broad grants desirable. It means the config tables are safe today because two controls happen to combine correctly, while the server-only tables express their intent more clearly.

## Anonymous-capable policy warning

Supabase warns when policies apply to roles that can include anonymous sessions. That warning is not proof that anonymous users can read every affected table. A policy may still require an owner UUID or explicitly reject anonymous claims.

The correct response is behavioral proof by trust boundary, not a mass role replacement.

### Live rollback-contained proof

The probe passed all four checks:

| Check | Result |
|---|---|
| authenticated user reads own journal, mood, room-memory, and voice rows | passed |
| user A cannot read user B's private rows | passed |
| user A cannot update user B's journal | passed |
| anon cannot read the synthetic private rows | passed |

Cleanup verification after the transaction found:

```text
phase0 users       0
phase0 journals    0
phase0 moods       0
phase0 voice notes 0
```

This proves the sampled owner-only boundary. It does not certify every table named by the advisor. Bridge, parent-link, Circle, guardian, reward, safety, storage, and Control Room boundaries need their own focused probes before policy behavior changes.

## SECURITY DEFINER inventory

Thirty-five public `SECURITY DEFINER` functions were reviewed for:

- `anon`, `authenticated`, and `service_role` EXECUTE grants;
- explicit `search_path` configuration;
- direct `auth.uid()` checks or guarded founder/guardian helper checks.

Observed baseline:

- no reviewed function is executable by `anon`;
- every reviewed function has an explicit `search_path` configuration;
- twenty-four are intentionally executable by `authenticated` and use an owner, founder, or guardian authorization boundary;
- eleven are service-role-only, trigger-only, or internal maintenance functions.

This is not a blanket certification of all twenty-four authenticated RPCs. Each must be grouped by trust boundary and tested with positive owner access plus negative anonymous, cross-user, and unauthorized-role cases before grants or function bodies change.

## Edge Functions with `verify_jwt: false`

The live project has eighteen active Edge Functions. Five currently have platform JWT verification disabled:

| Function | Custom boundary | Classification |
|---|---|---|
| `account-delete` | `x-account-deletion-secret` | intentional shared-secret server operation |
| `safety-scan` | `x-scan-secret`; called by Postgres trigger | intentional trigger-to-function shared secret |
| `release-health` | GitHub OIDC | conceptually valid, but stale repository and workflow expectations make the current function obsolete as release evidence |
| `bridge-e2e-probe` | always returns HTTP 410 | retired endpoint; remove after caller search |
| `github-workflow-status` | always returns HTTP 410 | retired endpoint; remove after caller search |

`release-health` still expects `jussray/Bip` and `deploy-cloudflare.yml`. The canonical repository is `jussray/Sekret-Bip`, and Cloudflare deployment now uses the native integration path. Until repaired or replaced, that function must not be treated as production release proof.

## Auth configuration

Leaked-password protection is disabled. This is a real Auth configuration gap, but it is not a SQL migration. Enablement requires a planned signup, login, password-reset, and existing-account regression pass, followed by a recorded dashboard configuration change.

## Next small trust-boundary changes

1. Revoke `anon` and `authenticated` privileges from `app_config` and `app_private_config`, preserving their deny-all behavior and service-role access.
2. Add repository scanner classifications for `guardian_verification_reviews` and `notification_deliveries` as verified service-role-only tables.
3. Repair or retire `release-health`; remove the two HTTP 410 probe functions after confirming no callers remain.
4. Add focused positive/negative behavior tests for authenticated `SECURITY DEFINER` functions, starting with the highest blast radius: guardian review, founder/Control Room ingestion, parent linking, Bridge, push tokens, and reward/task review.
5. Enable leaked-password protection only with Auth regression evidence.
6. Begin L4 schema design only after the trust boundary it will use has an approved migration and denial suite.

## Rollback

This Phase 0 change adds evidence files only. Reverting the repository commit removes the harness and baseline. The live proof itself ends in `ROLLBACK` and left no synthetic records.
