# bip-release-gate

## Trigger
Before ANY merge to main. This is the final checkpoint — run it last.

## Step 0 — Discover, Don't Assume
Before running any checks, read `.github/workflows/` to get the current list of
workflows. Do not rely on a hardcoded list — workflow files may have been added,
renamed, or removed since this skill was written.

For each workflow found, determine:
1. Does it trigger on this PR's changed paths?
2. Does it apply to this target (feature branch / release branch / main)?
3. If it did not trigger: document WHY it is not applicable — do not silently skip it.

**"Not triggered" is not the same as "passed."**
If a workflow should have triggered but did not, that is a blocker to investigate.

## Release Gate Checklist (apply what is relevant to this PR)

### 1. Core CI — Always Required
- [ ] TypeScript typecheck workflow: green, zero errors
- [ ] Primary CI workflow (lint, test): green
- [ ] Pre-push / prepush workflow: green
- [ ] Regression tests: green (or document why not triggered for this path)

### 2. Migration Safety — Required if `supabase/` changed
- [ ] `supabase migration list` — all migrations applied in order
- [ ] `supabase db diff` — zero schema drift
- [ ] No migration references a table or column that doesn't exist yet
- [ ] Any new migration has a corresponding RLS policy review (run bip-privacy-redteam)

### 3. Worker Deploy — Required if `worker/` or `wrangler.toml` changed
- [ ] Worker compiles without error
- [ ] `wrangler.toml` bindings match secrets configured in Cloudflare dashboard
- [ ] No new env var added without a corresponding secret entry
- [ ] Worker deploy workflow triggered and passed (or explain why not)

### 4. Env Var Completeness — Required if any new env/secret reference added
- [ ] `.env.example` and `.dev.vars.example` updated to document the new var
- [ ] No secret key hardcoded — run secret scanning before merge

### 5. EAS Build — Required for release branches only (not every feature PR)
- [ ] `eas.json` profile correct for this target
- [ ] `app.config.ts` version bumped if this is a production release
- [ ] No native module added without a new EAS build (OTA-only changes are safe)
- [ ] EAS build workflow triggered and passed, or documented as not required for this PR type

### 6. Supabase Edge Function — Required if `supabase/functions/` changed
- [ ] Edge function deploy workflow triggered and passed

### 7. Room Archives — Required if room assets or ROOM_ASSET_MAP.md changed
- [ ] `verify-room-archives.yml` triggered and passed

### 8. Privacy Gate — Conditional
- [ ] If any Supabase schema changed: bip-privacy-redteam passed
- [ ] If any worker endpoint changed: bip-worker-guardian passed

## Staging Enforcement
The following rules apply **only when a staging environment is confirmed to exist
and be configured** (staging Supabase project + staging Worker environment +
documented promotion steps). If staging infrastructure does not exist yet, note
that as a known gap rather than blocking the PR.
- Worker changes should be validated in staging before production deploy
- Supabase migrations should be applied to staging before production

## Output
Return: READY TO MERGE | BLOCKED
- BLOCKED: list each failing or inapplicable-but-required check with the specific file or workflow
- For each skipped check: document the reason it does not apply to this PR
- Never recommend merging with known failures — no exceptions for "minor" issues
