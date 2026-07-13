# Supabase Authorization Evidence

**Verified:** 2026-07-13  
**Project:** Se'kret Bip (`tbsevonvegdnlyjgplmm`)  
**Latest live migration:** `20260713011803 harden_config_table_grants`

## Decision

Phase 0 established the live authorization inventory and rollback-contained denial harness. Phase 1 has now applied the first narrow trust-boundary fix: server-owned configuration tables no longer retain client table privileges.

The machine-readable evidence is `security/supabase-authorization-baseline.json`. The reusable denial probe is `supabase/probes/authorization_phase0.sql`.

## Phase 0 live proof

The probe created two synthetic users and private rows inside one transaction, switched between `authenticated` and `anon`, recorded results, and rolled everything back.

| Check | Result |
|---|---|
| authenticated user reads own journal, mood, room-memory, and voice rows | passed |
| user A cannot read user B's private rows | passed |
| user A cannot update user B's journal | passed |
| anon cannot read the synthetic private rows | passed |

Cleanup verification found zero synthetic users, journals, moods, and voice notes.

This proves the sampled owner-only boundary. It does not certify every table named by the advisor. Bridge, parent-link, Circle, guardian, reward, safety, storage, and Control Room boundaries still require focused probes before policy behavior changes.

## Phase 1: config-table grant hardening

Migration `20260713011803_harden_config_table_grants.sql` was applied and verified live.

| Table | RLS | Policies | Client grants | Service-role grants | Rows before | Rows after |
|---|---:|---:|---:|---:|---:|---:|
| `app_config` | enabled | 0 | 0 | 7 | 2 | 2 |
| `app_private_config` | enabled | 0 | 0 | 7 | 2 | 2 |

The migration:

- revoked all table privileges from `PUBLIC`, `anon`, and `authenticated`;
- preserved explicit `service_role` privileges;
- kept RLS enabled;
- added no policies;
- modified no rows;
- documented server-only intent on both tables.

The earlier live migration generated version `20260713011803`. Repository migration history has been aligned to that exact version so a future replay does not attempt a duplicate migration.

## RLS-enabled tables with no policies

The four advisor findings now share the same clear server-only grant shape:

| Table | Client grants | Service role | Classification |
|---|---:|---:|---|
| `app_config` | none | allowed | service-role-only after Phase 1 hardening |
| `app_private_config` | none | allowed | service-role-only after Phase 1 hardening |
| `guardian_verification_reviews` | none | allowed | service-role-only |
| `notification_deliveries` | none | allowed | service-role-only |

No client policy should be added merely to silence the advisor. A future user-facing config use case must introduce its own reviewed API or policy, tests, and rollback.

## Anonymous-capable policy warning

Supabase warns when policies apply to roles that can include anonymous sessions. That warning is not proof that anonymous users can read every affected table. A policy may still require an owner UUID or reject anonymous claims.

The correct response remains behavioral proof by trust boundary, not a mass role replacement.

## SECURITY DEFINER inventory

Thirty-five public `SECURITY DEFINER` functions were reviewed for EXECUTE grants, explicit `search_path`, and owner/founder/guardian authorization checks.

- no reviewed function is executable by `anon`;
- every reviewed function has explicit `search_path` configuration;
- twenty-four are executable by `authenticated` and use an owner, founder, or guardian boundary;
- eleven are service-role-only, trigger-only, or internal maintenance functions.

This is not a blanket certification. Each authenticated RPC still needs positive owner access and negative anonymous, cross-user, and unauthorized-role tests before grants or bodies change.

## Edge Functions with `verify_jwt: false`

Five live functions use custom boundaries:

| Function | Boundary | Classification |
|---|---|---|
| `account-delete` | `x-account-deletion-secret` | intentional server operation |
| `safety-scan` | `x-scan-secret` from Postgres trigger | intentional trigger operation |
| `release-health` | GitHub OIDC | stale repository/workflow expectations; not valid current release evidence |
| `bridge-e2e-probe` | always HTTP 410 | retired endpoint |
| `github-workflow-status` | always HTTP 410 | retired endpoint |

`release-health` still expects `jussray/Bip` and `deploy-cloudflare.yml`. The canonical repository is `jussray/Sekret-Bip`, and the deployment path is now Cloudflare native verification. Repair or replace it before using it as release evidence.

## Remaining Phase 1 work

1. Add focused behavior tests for high-blast-radius authenticated RPCs: guardian review, founder/Control Room ingestion, parent linking, Bridge, push tokens, and reward/task review.
2. Repair or retire `release-health`.
3. Remove the two HTTP 410 probe functions after confirming no callers remain.
4. Plan and test leaked-password protection before changing Auth configuration.
5. Begin L4 schema design only after the trust boundary it will use has an approved migration and denial suite.

## Rollback

The Phase 0 probe ends in `ROLLBACK`. The config grant migration can only be reversed through a reviewed migration that grants the minimum privileges required by a documented client use case and matching RLS policy. Broad client grants must not be restored as a generic access fix.
