# bip-release-gate

## Trigger
Before any merge to `main`. This is the final checkpoint and runs after all task-specific skills.

## Rule
Discover the current release machinery from the repository. Do not rely on a remembered or
hardcoded workflow list. Required checks depend on the changed paths, target environment, and
release type.

A workflow that did not trigger is not automatically passed. Classify it as:
- REQUIRED — must run and pass before merge.
- NOT APPLICABLE — explain why the changed paths and release target do not require it.
- MANUAL GATE — requires an explicit external verification that CI cannot prove.

## Discovery (run first)

```bash
find .github/workflows -maxdepth 1 -type f -print | sort
git diff --name-only origin/main...HEAD
```

Read the current workflow triggers, path filters, required secrets, and jobs before deciding
which checks apply. Also inspect repository branch protection/check requirements when available.

## Release Gate Checklist (run in order)

### 1. Change Classification
Classify the change as one or more of:
- app/UI-only
- Worker/API
- Supabase migration/RLS
- Supabase Edge Function
- native dependency/config
- assets/content
- CI/tooling
- documentation-only

State the target: PR merge only, preview/beta build, staging deploy, or production release.

### 2. Applicable CI Status
- [ ] Discover current workflows from `.github/workflows/`.
- [ ] Identify workflows whose event and path filters apply to this change.
- [ ] Confirm every applicable required check ran on the current head SHA and passed.
- [ ] Confirm no required check is pending, skipped unexpectedly, stale, or attached to an older SHA.
- [ ] Explain each NOT APPLICABLE workflow; never silently skip it.

### 3. Migration Safety (when Supabase schema/RLS changed)
- [ ] Run `supabase migration list` against the intended environment.
- [ ] Run `supabase db diff` and account for schema drift.
- [ ] Confirm migration ordering and dependencies.
- [ ] Review concurrency, idempotency, indexes, backfills, locks, and `SECURITY DEFINER` functions.
- [ ] Run `bip-privacy-redteam` and any migration contract tests.
- [ ] Confirm deploy/rollback or forward-fix strategy for production-impacting changes.

If the environment is unavailable, mark the gate BLOCKED or explicitly classify the missing
verification as a manual pre-deploy gate. Do not call it passed.

### 4. Worker Deploy Readiness (when `worker/`, Wrangler config, or Worker bindings changed)
- [ ] Confirm the Worker entry points compile.
- [ ] Confirm the deployed Worker name/environment is correct; production Worker is `sekret`.
- [ ] Compare Wrangler bindings with every secret/config reference used by changed code.
- [ ] Confirm no elevated credential is exposed to the client or logged.
- [ ] Run `bip-worker-guardian`.
- [ ] Confirm the applicable deploy workflow or documented manual deploy path.

If a configured staging Worker environment exists, validate there before production. If staging
does not exist, do not invent it as a gate: document the available validation path and require
appropriate preview/local tests plus explicit production-deploy approval.

### 5. Environment Variable Completeness (when configuration changed)
- [ ] Compare code references against current example/config files.
- [ ] Confirm each new variable is documented and provisioned in the target environment.
- [ ] Confirm secrets are not hardcoded, committed, printed, or bundled client-side.
- [ ] Confirm client-exposed variables use only intentionally public values.

### 6. Expo/EAS Readiness (when app config, native modules, or release metadata changed)
- [ ] Confirm the applicable EAS profile and target platform.
- [ ] Confirm version/build-number policy for a beta or production release.
- [ ] Confirm native dependency/config changes receive a new native build rather than OTA-only delivery.
- [ ] Confirm route/auth/privacy regressions are covered by relevant tests.

A documentation-only or server-only PR does not require an EAS build unless repository policy
explicitly says otherwise.

### 7. Privacy and Product Gates
- [ ] Supabase/data-boundary changes: `bip-privacy-redteam` passed.
- [ ] Worker endpoint changes: `bip-worker-guardian` passed.
- [ ] AI/prompt/summary changes: `bip-ai-review` passed.
- [ ] User-facing copy changes: `bip-voice-guard` passed.
- [ ] Beta/release candidate: `bip-beta-checklist` passed for the affected journeys.

### 8. Deployment Reality Check (for deploys/releases, not ordinary merges)
Verify actual target state rather than assuming merge equals deploy:
- Worker: `wrangler deployments list` for Worker `sekret`.
- Supabase: migration/deployment state for the target project.
- Expo/EAS: build/update status for the intended channel.

Record the deployed commit/version and timestamp when available.

## Pass Criteria
Return READY TO MERGE only when:
- all applicable checks passed on the current head;
- every non-applicable check has a defensible reason;
- no known safety, privacy, migration, or release blocker remains.

Return READY TO DEPLOY only after deployment-specific manual gates are also satisfied.

## Output
Return one of: READY TO MERGE | READY TO DEPLOY | BLOCKED

Include:
- current head SHA;
- change classification and target;
- applicable checks with status;
- NOT APPLICABLE checks with reasons;
- manual gates still required;
- exact blocker file/workflow when blocked.

Never recommend merging with a known failure. Never describe an untriggered or stale check as passed.
