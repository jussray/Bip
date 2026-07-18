# Controlled-Alpha Repository Boundary Evidence

## Exact state

- Repository: `jussray/Sekret-Bip`
- Pull request: #495
- Branch: `launch/controlled-alpha-activation`
- Exact head inspected: `c932696722a761754416e64d72b2398cf42d0521`
- PR state: open, mergeable, draft

## Founder Room slices executed

### A. Cohort boundary

- Bridge summaries changed from public `enabled` to `beta`.
- Crew accountability changed from public `enabled` to `beta`.
- Preview profiles use audience `beta`.
- Production profiles use audience `public`, which no longer receives Bridge or Crew availability.
- Emotional Scrapbook remains `internal`.
- Companion memory/L4 remains `disabled`.

### B. Worker fail-closed boundary

- `wrangler.alpha.toml` still names the isolated `sekret-backend-alpha` service.
- Committed `BRIDGE_SUMMARIES_ROLLOUT` is now `disabled`.
- The configuration explicitly requires a founder-approved comma-separated teen-account allowlist at runtime.
- No API or service-role credential is committed.
- Production `wrangler.toml` remains disabled.

### C. Bridge executable-choice boundary

- Controlled alpha supports Journal and Mood sources only.
- Goal and Scrapbook sources are rejected while building the preview, before `create_bridge_share_request` can execute.
- The client now gives a truthful unavailable message rather than saving a request that the Worker cannot fulfill.

### D. Crew revocation truth boundary

- Revocation now targets an exact owner/check-in/recipient share with `status='active'`.
- The update requests the resulting `id,status,revoked_at` row.
- A zero-row match or malformed result returns failure.
- `{ revoked: true }` is returned only after the observed row reports `revoked` with a revocation timestamp.

## Contract evidence

Added or updated:

- `test/controlled-alpha-activation.test.mjs`
- `test/controlled-alpha-founder-room-plan.test.mjs`
- `test/controlled-alpha-service-boundaries.test.mjs`
- `test/founder-preview-unlock.test.mjs`
- `package.json` focused test command

The exact PR patch was inspected for the feature flags, alpha Worker configuration, Bridge guard, Crew mutation proof, focused command, and tests.

Independent Node syntax checks passed for all three controlled-alpha test files reconstructed from their exact branch content.

## Hosted classification

At exact head `c932696722a761754416e64d72b2398cf42d0521`, GitHub created eight pull-request workflow runs. All completed as failure. The inspected CI jobs for Test, Control Room audits, Type-check, Build, and Lint contain `steps: null` and no job log.

Classification: `runner_startup_failure`.

This is not passing test evidence and not a code diagnosis.

## Not executed or proven

- complete exact-head checkout installation;
- TypeScript compilation;
- full unit suite execution;
- Wrangler alpha dry-run bundle;
- Expo web export;
- Playwright;
- live Supabase RLS/RPC parity;
- dedicated alpha Worker deployment;
- teen or parent EAS preview builds;
- Bridge or Crew two-account journeys;
- account deletion and second-user isolation;
- iOS/Android device evidence.

## Rollback

Every repository change is reversible through PR #495 commits. Production routing and production Bridge rollout remain unchanged. No credentials, live data, database state, external account, deployment, paid build, merge, or deletion operation occurred.
