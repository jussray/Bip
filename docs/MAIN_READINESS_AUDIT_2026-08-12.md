# Main readiness audit — 2026-08-12

## Scope

This audit covers the focused removal of the no-account `DEMO_MODE` bypass and
the evidence required before that removal can merge to `main`. It is not a
public-launch approval or a claim about the deployed application.

## Observed authority

| Fact | Classification | Evidence |
| --- | --- | --- |
| Repository checkout | **VERIFIED** | `/workspace/Sekret-Bip` from `git rev-parse --show-toplevel` |
| Audit branch | **VERIFIED** | `codex/audit-main-readiness-2026-08-12` |
| Unwanted change | **VERIFIED** | `e1c38970` added an auth, verification, and onboarding bypass controlled by a public client environment variable |
| Last known baseline in this checkout | **VERIFIED** | `dc3d530` is the parent of the unwanted commit |
| Current GitHub `main` SHA | **UNKNOWN** | This checkout has no Git remote and no local `main` ref |
| Required provider checks | **UNKNOWN** | GitHub Actions and branch protection are not observable without a remote/provider connection |
| Production deployment state | **UNKNOWN** | No Cloudflare, EAS, or Supabase production observation was performed |

The repository privacy contract requires protected route access to use
authoritative verification/account state. A client-controlled bypass conflicts
with that gate and must not be promoted to `main`.

## Smallest safe move

Revert `e1c38970` without replacing it with another demo path. This restores:

- Supabase session resolution before protected routing;
- server-authoritative verification hydration;
- onboarding completion checks; and
- teen profile completion checks before mounting protected tabs.

No schema, RLS, deployment, or product behavior outside that revert is in
scope.

## Evidence ladder

Run in this order against the final candidate head:

1. Focused auth, verification, route-access, and onboarding regression tests.
2. TypeScript type-check and the complete Node test suite.
3. Lint, runtime-asset audit, companion validation, Control Room audits, and
   room-archive verification.
4. Expo web export.
5. Playwright browser proof that the splash proceeds to onboarding/login rather
   than entering a protected Room without authoritative state.
6. Fetch current `origin/main`, replay the focused changes if `main` moved, and
   rerun the evidence above on the exact rebased head.
7. Require all GitHub checks named by the workflows targeting `main` to pass
   before squash merge.

## Candidate evidence observed

| Evidence | Result |
| --- | --- |
| Focused auth/verification/onboarding tests | **PASS** — 15 tests |
| Full Node test suite | **PASS** — 286 tests |
| Oracle, Voice Bip, and device-sync suites | **PASS** |
| `verify:prepush` | **PASS**, with three lint warnings for existing unused `eslint-disable` directives |
| Expo web export | **PASS** |
| Control Room structural scan | **PASS** — zero findings |
| Control Room RLS scan | **WARNING** — no RLS policy was found for `notification_deliveries`; this audit did not determine whether the table is exposed or whether the warning is actionable |
| Playwright route proof | **BLOCKED** — Playwright is installed, but no browser binary exists and the browser download endpoint returned HTTP 403 |
| Comparison with current GitHub `main` | **BLOCKED** — no remote is configured in this checkout |

The candidate is therefore **not proven merge-ready**. Local static, test, audit,
and bundle evidence is green, but browser runtime proof, current-main replay,
and provider-required checks remain mandatory gates.

## Stop conditions

Do not merge when any of the following is true:

- current `origin/main` cannot be fetched and compared;
- the PR contains changes beyond the revert and this audit;
- a protected Room can be reached without the normal account, verification,
  and onboarding gates;
- any required local or provider check fails; or
- the final tested SHA differs from the SHA approved for merge.

## Post-merge observation

After merge, observe the exact merged SHA in GitHub and confirm the associated
Cloudflare workflow result. Do not infer production health from a successful
local build. Public launch remains governed by the separate launch-compliance
checklist and its operational, legal, security, and privacy approvals.
