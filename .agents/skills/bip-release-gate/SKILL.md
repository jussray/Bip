# bip-release-gate

## Trigger
Before ANY merge to main. This is the final checkpoint — run it last.

## Verified CI Pipeline (jussray/Bip, .github/workflows/)
Real workflows that must pass before merge:
- `ci.yml` — primary CI (lint, test)
- `typecheck.yml` — TypeScript type checking
- `prepush.yml` — pre-push validation
- `regression-tests.yml` — regression suite
- `deploy-worker.yml` — Cloudflare Worker deploy
- `deploy-cloudflare.yml` — Cloudflare Pages deploy
- `deploy-supabase-function.yml` — Supabase Edge Function deploy
- `eas-build.yml` — Expo EAS build
- `verify-room-archives.yml` — room asset archive validation

## Release Gate Checklist (run in order)

### 1. CI Status
- [ ] `ci.yml` green — no lint or test failures
- [ ] `typecheck.yml` green — zero TypeScript errors
- [ ] `prepush.yml` green — pre-push hooks passed
- [ ] `regression-tests.yml` green — no regressions

### 2. Migration Safety
- [ ] Run `supabase migration list` — confirm all migrations applied in order
- [ ] Run `supabase db diff` — confirm zero schema drift
- [ ] No migration references a table or column that doesn't exist yet
- [ ] Any new migration has a corresponding RLS policy (run bip-privacy-redteam)

### 3. Worker Deploy Readiness
- [ ] `worker/sekret-reply.ts` compiles without error
- [ ] `wrangler.toml` has correct environment bindings for all secrets used in code
- [ ] No new environment variable added to worker without a corresponding secret in Cloudflare dashboard
- [ ] `deploy-worker.yml` workflow will trigger correctly on this branch

### 4. Env Var Completeness
- [ ] Compare `.env.example` against `.dev.vars.example` — no undocumented vars
- [ ] Any new `process.env.*` or `env.*` reference in worker has a corresponding entry
- [ ] No secret key hardcoded — confirmed with secret scanning before merge

### 5. EAS Build Readiness
- [ ] `eas.json` profile for this target (development/preview/production) is correct
- [ ] `app.config.ts` version bump if this is a production release
- [ ] No native module added without a new EAS build (OTA-only changes are safe)

### 6. Privacy Gate
- [ ] If any Supabase schema changed: bip-privacy-redteam passed
- [ ] If any worker endpoint changed: bip-worker-guardian passed

## Pass Criteria
All checkboxes above are checked. No skips.

## Output
Return: READY TO MERGE | BLOCKED
- BLOCKED: list each failing check with the specific file or workflow
- Never recommend merging with known failures — no exceptions for "minor" issues
