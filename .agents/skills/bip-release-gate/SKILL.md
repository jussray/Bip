# bip-release-gate

## Trigger
Before any merge to `main`. Run this last, after all task-specific skills.

## Rule
Discover the current release machinery from the repository. Do not rely on a remembered or
hardcoded workflow list. Required checks depend on changed paths, target environment, and release type.

A workflow that did not trigger is not automatically passed. Classify it as:
- REQUIRED — must run and pass before merge.
- NOT APPLICABLE — explain why the changed paths and release target do not require it.
- MANUAL GATE — requires external verification that CI cannot prove.

## Step 0 — Discover, Don't Assume

```bash
find .github/workflows -maxdepth 1 -type f -print | sort
git diff --name-only origin/main...HEAD
git rev-parse HEAD
```

Read current workflow triggers, path filters, jobs, required secrets, and branch conditions.
When available, inspect branch protection and required-check configuration too.

## Release Gate Checklist

### 1. Change Classification
Classify the change as one or more of:
- app/UI-only
- Worker/API
- Supabase migration/RLS
- Supabase Edge Function
- native dependency/config
- assets/content
- CI/tooling
- documentation/agent-instructions only

State the target: PR merge only, beta/preview build, staging deploy, or production release.

### 2. Applicable CI Status
- [ ] Discover current workflows from `.github/workflows/`.
- [ ] Identify workflows whose event and path filters apply.
- [ ] Confirm every applicable required check ran on the current HEAD SHA and passed.
- [ ] Confirm no required check is pending, unexpectedly skipped, stale, or attached to an older SHA.
- [ ] Explain every NOT APPLICABLE workflow; never silently skip it.

"Not triggered" is not "passed." A green check from an older commit is not evidence for the current head.

### 3. Migration Safety — when `supabase/` changed
- [ ] Run `supabase migration list` against the intended environment.
- [ ] Run `supabase db diff` and account for schema drift.
- [ ] Confirm migration ordering and object dependencies.
- [ ] Review concurrency, idempotency, indexes, backfills, locks, and `SECURITY DEFINER` functions.
- [ ] Run `bip-privacy-redteam` and applicable migration contract tests.
- [ ] Confirm a rollback or forward-fix strategy for production-impacting changes.

If the target environment is unavailable, mark the verification as BLOCKED or MANUAL GATE.
Do not describe it as passed.

### 4. Worker Deploy Readiness — when `worker/`, Wrangler config, or bindings changed
- [ ] Confirm changed Worker entry points compile.
- [ ] Confirm the target Worker and environment. Production Worker name is `sekret`.
- [ ] Compare Wrangler bindings with all changed secret/config references.
- [ ] Confirm elevated credentials are not client-exposed or logged.
- [ ] Run `bip-worker-guardian`.
- [ ] Confirm the applicable deploy workflow or documented manual deployment path.

If a configured staging Worker exists, validate there before production. If staging does not exist,
do not invent it as a gate: document the available local/preview path, run applicable tests, and
require explicit production-deploy approval.

### 5. Environment Variable Completeness — when configuration changed
- [ ] Compare code references against current example/config files.
- [ ] Confirm each new variable is documented and provisioned in the target environment.
- [ ] Confirm secrets are not hardcoded, committed, printed, or bundled client-side.
- [ ] Confirm client-exposed variables contain only intentionally public values.

### 6. Expo/EAS Readiness — when app config, native modules, or release metadata changed
- [ ] Confirm the applicable EAS profile and platform.
- [ ] Confirm version/build-number policy for beta or production.
- [ ] Confirm native changes receive a new native build rather than OTA-only delivery.
- [ ] Confirm affected auth, route, and privacy journeys are covered by relevant tests.

Documentation-only, agent-instruction-only, or server-only PRs do not require EAS unless repository
policy explicitly says otherwise.

### 7. Conditional Product Gates
- [ ] Supabase/data boundary changes: `bip-privacy-redteam` passed.
- [ ] Worker endpoint changes: `bip-worker-guardian` passed.
- [ ] AI/prompt/summary changes: `bip-ai-review` passed.
- [ ] User-facing copy changes: `bip-voice-guard` passed.
- [ ] Beta/release candidate: `bip-beta-checklist` passed for affected journeys.

### 8. Deployment Reality Check — deploys/releases only
Verify actual target state rather than assuming merge equals deploy:
- Worker: `wrangler deployments list` for Worker `sekret`.
- Supabase: migration/function state for the target project.
- Expo/EAS: build/update state for the intended channel.

Record deployed commit/version and timestamp when available.

## Pass Criteria
Return READY TO MERGE only when:
- all applicable checks passed on the current head;
- each non-applicable check has a defensible reason;
- no known safety, privacy, migration, or release blocker remains.

Return READY TO DEPLOY only after deployment-specific manual gates are satisfied.

## Output
Return one of: READY TO MERGE | READY TO DEPLOY | BLOCKED

Include:
- current head SHA;
- change classification and target;
- applicable checks with status;
- NOT APPLICABLE checks with reasons;
- manual gates still required;
- exact blocker file/workflow when blocked.

Never recommend merging with a known failure. Never describe an untriggered, skipped, or stale check as passed.
