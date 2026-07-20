# bip-release-gate

## 5W1H operating contract

Before planning, editing, or claiming completion, establish and state:

- **Who** — the requester, decision owner, affected users, data subjects, and execution authority.
- **What** — the requested outcome, concrete deliverable, non-goals, and existing work that must be preserved.
- **Where** — the exact repository, branch, environment, runtime, route, service, table, or provider boundary involved.
- **When** — the current lifecycle or release state, required ordering, timing constraint, and rollback window.
- **Why** — the user problem and verified evidence that justify the work.
- **How** — the smallest safe implementation, required permissions, verification evidence, rollout, and rollback.

Inspect repository and runtime truth for unknowns. Ask the user only when a missing answer would materially change the safe solution or authority. Re-run 5W1H after red-team/OODA findings change the plan. Finish by mapping the result, evidence, remaining blocker, and next owner back to these six questions.


Last reviewed: 2026-07-13

## Trigger

Before any merge to `main`. Run this last, after task-specific review skills.

## Rule

Discover the current release machinery from the repository. Do not rely on a remembered workflow list, deployment target, or dashboard value.

Classify each possible gate as:

- **REQUIRED** — must run and pass on the current head;
- **NOT APPLICABLE** — explain why the changed paths and target do not require it;
- **MANUAL GATE** — requires external verification that CI cannot prove.

An untriggered workflow is not automatically passed. A green check from an older SHA is decorative nostalgia.

## Step 0 — Discover, do not assume

```bash
find .github/workflows -maxdepth 1 -type f -print | sort
git diff --name-only origin/main...HEAD
git rev-parse HEAD
```

Read current workflow triggers, path filters, jobs, required secrets, concurrency, and branch conditions. When available, inspect branch protection and required checks.

Read:

- `implementation-ledger.json`
- `DEPLOYMENT.md`
- `docs/CLOUDFLARE_OWNERSHIP.md`
- `docs/DEMO_READINESS_ENFORCEMENT.md`

Canonical production targets:

- backend Worker: `sekret-backend`;
- frontend Pages project: `sekret-bip`;
- deployment authority: Cloudflare native Git integration from `main`;
- release verification: GitHub Actions exact-release verifier, not a second upload path.

## Release gate checklist

### 1. Classify the change

Classify as one or more of:

- app/UI;
- backend Worker/API (`sekret-backend`);
- web frontend/Cloudflare Pages (`sekret-bip`);
- Supabase migration/RLS/database function;
- Supabase Edge Function;
- native dependency/config;
- assets/content;
- CI/tooling;
- documentation/agent instructions.

State the target: PR merge only, preview/beta, controlled production deployment, or public release.

### 2. Applicable CI

- [ ] Discover workflows from `.github/workflows/`.
- [ ] Identify event and path filters that apply.
- [ ] Confirm every required check ran on the current HEAD SHA and passed.
- [ ] Confirm no required check is pending, stale, unexpectedly skipped, or attached to an older SHA.
- [ ] Explain each NOT APPLICABLE workflow.
- [ ] Confirm Implementation Evidence passes when architecture, roadmap, status, or agent-skill files changed.
- [ ] Run Playwright when user-visible routes, privacy guardrails, deployment evidence, or public-surface isolation changed.

### 3. Supabase migration and authorization safety

When `supabase/`, security baselines, RLS, grants, or database functions changed:

- [ ] compare repository migration history with the target project;
- [ ] account for schema drift;
- [ ] review ordering, dependencies, locks, backfills, indexes, and idempotency;
- [ ] review `SECURITY DEFINER` search paths and execution grants;
- [ ] run positive owner/role tests and negative anonymous/cross-user tests;
- [ ] preserve a rollback or forward-fix strategy;
- [ ] reconcile live migration versions and evidence back into the repository.

If the target environment is unavailable, classify the proof as BLOCKED or MANUAL GATE. Do not pronounce it passed through interpretive dance.

### 4. Worker readiness

When `worker/`, `wrangler.toml`, bindings, AI, TTS, or authenticated API behavior changed:

- [ ] confirm Worker entry points compile;
- [ ] confirm `wrangler.toml` names `sekret-backend`;
- [ ] compare bindings with changed secret/config references;
- [ ] confirm elevated credentials are not bundled or logged;
- [ ] run `bip-worker-guardian`;
- [ ] test authentication before protected data access;
- [ ] test identity/style, Bridge, or safety boundaries affected by the change;
- [ ] confirm rollout, telemetry, and rollback.

Use a real staging environment when one exists. Do not invent one when it does not.

### 5. Pages and web readiness

When Expo web, public routes, assets, or Pages deployment changed:

- [ ] run the Expo web export;
- [ ] run Playwright smoke and guardrail tests;
- [ ] confirm Cloudflare native Git integration remains the production authority;
- [ ] confirm the target Pages project is `sekret-bip`;
- [ ] confirm the custom domain is attached to the canonical project;
- [ ] confirm `EXPO_PUBLIC_BACKEND_URL` points to `sekret-backend`;
- [ ] confirm no backend secret appears in the client bundle;
- [ ] confirm the build writes a valid public `release.json` marker.

Do not treat Worker deployment as proof that Pages deployed, or vice versa.

### 6. Exact production evidence

For deployment or release claims, verify the exact expected commit through:

1. successful `Workers Builds: sekret-backend` check;
2. deployed `release.json` matching the expected `main` SHA;
3. successful Worker health endpoint;
4. read-only production Playwright;
5. retained GitHub Actions evidence artifact.

The retired Supabase `release-health` function is a JWT-protected HTTP 410 endpoint and must not be used as release evidence.

### 7. Environment variables

When configuration changed:

- [ ] compare code references with example/config files;
- [ ] document and provision every new variable in the correct environment;
- [ ] keep secrets out of source, logs, and public bundles;
- [ ] confirm Expo public variables contain only intentionally public values;
- [ ] confirm server-only authentication headers remain server-side.

### 8. Expo/EAS readiness

When native config, app identifiers, native modules, or release metadata changed:

- [ ] confirm EAS profile and platform;
- [ ] confirm version/build-number policy;
- [ ] require a native build for native changes rather than OTA-only delivery;
- [ ] test affected auth, route, storage, and privacy journeys.

Documentation-only or server-only PRs do not require EAS unless repository policy says otherwise.

### 9. Conditional product gates

- [ ] Supabase/data boundary: privacy red-team and denial tests passed.
- [ ] Worker endpoint: `bip-worker-guardian` passed.
- [ ] AI/prompt/summary: AI review and Companion Lab passed.
- [ ] User-facing copy: voice guard passed.
- [ ] Parent/Bridge: controlled relationship and revocation proof is current.
- [ ] Beta/release candidate: affected user journeys and legal checklist are complete.
- [ ] L4: remains blocked unless authorization, deletion, provenance, retention, runtime use, rollout, and rollback are evidenced.

### 10. Documentation reality

When Markdown or agent skills changed:

- [ ] current status matches `implementation-ledger.json`;
- [ ] historical audits are labeled as snapshots;
- [ ] old repository names and deployment targets are removed from active instructions;
- [ ] integrated features are not described as verified or released;
- [ ] resolved findings are not still labeled release-blocking;
- [ ] remaining blockers are concrete and owned.

## Pass criteria

Return `READY TO MERGE` only when:

- all applicable checks passed on the current head;
- every non-applicable check has a defensible reason;
- no known safety, privacy, migration, evidence, or release blocker applies to the requested merge.

Return `READY TO DEPLOY` only after deployment-specific manual and exact-release gates are satisfied.

## Output

Return one of:

- `READY TO MERGE`
- `READY TO DEPLOY`
- `BLOCKED`

Include:

- current head SHA;
- change classification and target;
- applicable checks with status;
- NOT APPLICABLE checks with reasons;
- manual gates;
- exact blocker file, workflow, or environment when blocked.

Never recommend merging with a known failure. Never describe an untriggered, skipped, stale, or older-SHA check as passed.

## Control Room evidence gate

A passing local Control Room mission is local evidence only. It does not merge, deploy, prove the hosted artifact, or satisfy exact-production verification. `ship-release` must remain outside the browser-executable allowlist. If GitHub Actions creates jobs but no runner executes steps, classify hosted evidence as BLOCKED and retain the local report without calling the exact head merge-ready.
