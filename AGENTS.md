# Agent Instructions for Se'kret Bip

Use these instructions whenever an AI coding agent works in this repository.

Before material planning, implementation, review, automation, publishing, deployment, migration, or cross-repository coordination, read [`AGENTS_FOUNDER_INTELLIGENCE.md`](./AGENTS_FOUNDER_INTELLIGENCE.md), which loads the Founder Intelligence Constitution and Se'kret Bip's heightened teen privacy, consent, safety, dignity, and anti-surveillance duties.

> **Before making any claim about current PR, deployment, migration, backend state, GitHub Actions status, Cloudflare status, Supabase state, or release truth, inspect the real repository and read `SPRINT.md`, `docs/REPO_KNOWLEDGE_REFRESH_2026-07-20.md`, and `.agents/skills/bip-repo-truth/SKILL.md`. Also check Founder Control Room when release, CI, outage, or cross-repo truth is involved.**

## Current repository checkpoint

- Default branch: `main`.
- Reviewed application baseline: `824b4dcffb9e0ffc7468a002f0390cbba98d79ae` (later documentation-only merges may advance `main` without changing application evidence).
- Read `docs/LAUNCH_GATE_STATUS_2026-07-31.md` before making any current launch, deployment, or production claim.
- P0: [#696](https://github.com/jussray/Sekret-Bip/issues/696) — the live Pages release marker does not currently return JSON.
- Cloudflare branch-control gate: [#646](https://github.com/jussray/Sekret-Bip/issues/646) — **closed/completed as of 2026-08-03**. The provider-side branch-control proof was accepted and PR #712 added repository defense in depth. Do not treat #646 as an open branch blocker; production deployment and current Cloudflare/release truth remain separate evidence gates.
- Canonical frontend: Cloudflare Pages `sekret-bip`.
- Canonical backend: `sekret-backend` via `worker/voice-entry.ts`.
- Canonical marker: `/.well-known/sekret-release.json`.
- Merged current-state repairs include PRs #595, #596, #688, #691, #695, #698, #700, #701, #703, #704, and #706.
- PR #698, #700, and #701 are merged repository history; #690 and #692 are closed as superseded history.

Do not use old PR descriptions, a local build, a screenshot, a green branch check, or the legacy `/release.json` path as production evidence. Keep repository, CI, Cloudflare, Supabase, browser, device, and account evidence separate.

## Current repo map

The app is not the old single-file prototype. Treat these as active architecture until exact inspection proves otherwise:

- `app/(auth)/`
- `app/(onboarding)/`
- `app/(teen)/`
- `app/(parent)/`
- `app/(dev)/`
- `src/`
- `worker/`
- `supabase/migrations/`
- `supabase/functions/`
- `test/`
- `e2e/`
- `.agents/skills/`
- `.control-room/`
- `implementation-ledger.json` and extensions

## Evidence hierarchy

Keep these proof layers separate:

1. repository code state;
2. local checks;
3. GitHub Actions exact-head state;
4. merge-SHA state on `main`;
5. Cloudflare build or deployment state;
6. live Supabase migration, catalog, and authorization state;
7. production-browser state;
8. physical-device and real-account state;
9. Product Design, Figma, Canva, screenshot, or static prototype state.

A green result in one layer does not silently prove another.

A PR body is proposed scope and self-reported evidence. It is not independent proof. A merged PR is repository history, not automatic production proof.

If GitHub Actions has no jobs, no steps, or no logs, classify it as infrastructure evidence, not a code regression.

## Current primary repair boundary

PR #595 merged the canonical repository onboarding-state repair. Do not recreate a parallel onboarding state path or reintroduce `onboarding_state` as a current durable authority.

The remaining launch boundary is proof, not a claimed code split:

- complete a real founder-access and onboarding journey on a physical device;
- verify intended Supabase behavior and failure handling in the target environment;
- preserve the canonical service, table, enum, trigger rules, and active imports;
- keep compatibility only where a tested existing consumer requires it.

No merged code path is automatic production, device, or real-account evidence.

## Companion naming boundary

Canonical display/canon names:

- Suhana
- Sy
- Cloud
- Night

Legacy identifiers `raylene` and `rylane` may remain only where database, storage, analytics, route, fixture, API, or saved-state compatibility requires them.

Never rename persisted identifiers casually. Normalize legacy values at user-facing and AI-facing boundaries. Add compatibility tests before any schema or stored-value migration.

## Global founder stack

Read [`GLOBAL_AI.md`](./GLOBAL_AI.md) before nontrivial work and preserve the full founder reasoning stack.

Every agent must follow:

```text
/elonmusk /garyvee lindymode redteam l99 redteam ooda /truthmode
```

The first red-team pass attacks the premise and evidence. L99 drives implementation depth. The second red-team OODA pass attacks implementation, privacy and security blast radius, rollback, and proof.

Project-local rules may become stricter. They may not weaken teen privacy, consent, security, provenance, evidence, approval, or rollback.

## MCP-to-skill routing

MCP connectivity and Bip skill activation are separate requirements.

Before invoking an MCP server:

1. read `config/mcp-skill-routing.json`;
2. load every skill mapped to that server;
3. load every skill in `alwaysLoad`;
4. stop if a mapped skill is missing;
5. run `npm run verify:mcp` when the routing contract changes.

Auth, login, consent, verification, parent linking, or onboarding work must activate `.agents/skills/bip-auth-onboarding/SKILL.md`.

## Figma and Product Design

For Figma, screen design, room design, design-system, design-to-code, Code Connect, prototype, or visual QA work, also read:

- `.agents/skills/figma-build-implement/SKILL.md`
- `.figma/repository-profile.json`

Figma, Canva, screenshots, and prototypes may guide visual treatment with synthetic or redacted content. They cannot prove runtime, auth, consent, parent visibility, RLS, migrations, devices, deployment, or release truth.

Native-critical flows require controlled device evidence in addition to editable design and web proof.

## OODA workflow

### 1. Observe

Inspect the real repository state before acting.

Check:

- existing files, routes, services, hooks, types, assets, tests, and active imports;
- current branch, PR, and exact head;
- recent merges and open repair candidates;
- type, lint, test, build, bundle, Playwright, and deployment evidence relevant to the task;
- whether the requested feature already exists but is disconnected;
- whether the issue is stale local code, unpushed work, infrastructure outage, deployment drift, live-schema drift, or actual code behavior.

Do not assume planned architecture exists. Verify it.

### 2. Orient

Map the task against the active architecture.

Ask which existing file owns the behavior now, whether this is UI, backend, database, auth, storage, AI reply, release, or shared work, and whether it is a shipping blocker, demo polish, repair, refactor, or future idea.

Prefer the current working structure over imaginary clean-room architecture.

### 3. Decide

Choose the smallest shipping-safe action.

Before coding, decide whether existing code can be wired instead of replaced, whether the fix can be one focused patch, whether preserved work needs a compatibility boundary, and whether the change requires a migration, environment variable, backend change, test, Playwright proof, device proof, or release-truth record.

If there are multiple fixes, choose the least risky option that keeps the app shippable and preserves future product work.

### 4. Act

Make the change with minimal blast radius.

- Modify only necessary files.
- Keep naming consistent with the repo.
- Preserve existing features, routes, assets, and services unless removal is required for correctness, privacy, security, or release safety.
- Prefer feature flags, route isolation, deprecation notes, and compatibility adapters over deletion.
- Before deleting anything, identify all references and explain why preservation is unsafe or materially blocks shipping.
- Avoid new dependencies unless there is no native or existing option.
- Avoid broad refactors unless explicitly required.
- Leave the app easier to understand than before.

After acting, report what changed, why it was the smallest safe change, how existing work was preserved, how it was verified, and what remains unfinished.

## Infrastructure outage and CI classification

Classify evidence before blaming code:

- `runner_startup_failure`: the runner or job failed before meaningful steps executed, especially with no steps, no logs, or null log URLs;
- `workflow_no_jobs`: the workflow scheduled no jobs or was skipped before jobs existed;
- `workflow_step_failure`: at least one job executed steps and logs show a concrete failing command, assertion, build, lint, type, test, or Playwright step.

Never claim a code regression from a zero-step or no-log failure.

Infrastructure failure can still block release truth when exact-head checks are required. Record the blocker and continue independently provable review or code work.

## Founder Control Room and Cloudflare truth

Founder Control Room is the first authority for interpreting GitHub Actions incidents, cross-repo release truth, and Cloudflare evidence.

For every CI or release incident, capture:

- repository;
- PR or branch;
- exact head SHA;
- workflow, run, job, steps, and logs;
- failure classification;
- Cloudflare Pages and Worker state;
- live runtime evidence;
- impact;
- next gate.

Cloudflare success does not prove GitHub checks, Playwright, auth, data, privacy, Supabase, Worker routes, or devices. GitHub success does not prove Cloudflare or production.

## Preservation-first rule

Se'kret Bip is being shipped in phases, not reduced to a permanently smaller product.

- Do not delete unfinished product work merely because it is outside the current release path.
- Keep future features available through flags, hidden routes, documented backlog state, or isolated modules.
- Do not maintain duplicate active implementations indefinitely. Select one canonical path and preserve another only when it has clear future value.
- Mark deprecated or inactive code clearly.
- Delete only when code is unsafe, irreparably broken, legally risky, secret-bearing, truly obsolete, or proven to have no future use.

## Ponytail rule

Before adding code, ask:

1. Does this already exist?
2. Can existing code be connected instead of replaced?
3. Can Expo do this already?
4. Can React Native do this already?
5. Can Supabase do this already?
6. Can Cloudflare Workers do this already?
7. Can an installed dependency do this already?
8. Can one small change solve it instead of a new abstraction?

Only write new code after those checks.

## Testing strategy

Use the smallest tool that proves the changed behavior.

1. Unit, service, contract, and regression tests for core logic, privacy contracts, RLS assumptions, route safety, and compatibility.
2. Playwright for web flows, auth routing, parent/teen boundaries, release guardrails, and user-facing runtime changes.
3. Maestro for real iOS and Android signup, login, onboarding, navigation, linking, Bridge share/revoke, and device smoke journeys.
4. Detox only if a proven native automation gap requires it.

Do not add a new test framework to a feature PR unless that PR specifically requires it.

If Playwright cannot run because of runner outage, missing secrets, browser dependencies, or unavailable infrastructure, record a verification blocker rather than blaming code.

## Product priorities

Keep Se'kret Bip simple, shippable, and easy to demo while preserving the larger vision.

Prefer:

- Expo APIs;
- React Native primitives;
- existing app services;
- Supabase features;
- Cloudflare Worker features;
- small patches;
- canonical active paths plus preserved, clearly flagged future work.

Avoid:

- unnecessary dependencies;
- duplicate helpers, services, hooks, types, state systems, schemas, or deployment authorities;
- broad architecture rewrites;
- cosmetic file moves;
- placeholder systems not wired into the app;
- destructive cleanup for appearance or metrics.

## Product guardrails

Keep the product teen-centered, warm, safe, and non-clinical.

The app is not a therapy replacement. Do not add features that claim to diagnose, treat, or replace emergency support.

Preserve these boundaries:

- teen privacy first;
- parent visibility is optional and consent-based unless an approved safety rule requires escalation;
- anonymous Circle identity protected by default;
- no private names, journal text, voice notes, messages, or safety data exposed across contexts;
- no secrets, tokens, service keys, or private user content in logs, docs, issues, tests, or evidence.

## Development style

- Make the smallest working change.
- Check existing files before creating new ones.
- Keep route and screen names consistent with Expo Router.
- Keep TypeScript types strict and shared where they already exist.
- Do not introduce a new state system unless the existing canonical one truly cannot support the task.
- Do not add environment variables unless unavoidable.
- Document every required environment variable in the same change.

## Merge authority

Merge when it is the correct evidence-backed integration step, not merely because a PR exists or a badge looks green.

A merge is safe only when:

- repository, target branch, PR, and exact head SHA are verified;
- scope is focused and no unrelated work is hidden;
- changed code, configuration, schema, tests, and docs are reviewed;
- required checks genuinely executed and passed, or an infrastructure outage is classified and the remaining evidence is sufficient for the exact scope;
- Playwright passed for changed user-facing web/runtime paths or is explicitly inapplicable;
- Founder Control Room and Cloudflare evidence were checked when release or deployment truth is involved;
- no unresolved critical review thread remains;
- teen privacy, parent visibility, auth, RLS, credentials, brand/IP, user data, and rollback remain intact;
- the merge does not silently perform deployment, migration, auth/RLS changes, billing, publication, deletion, credential movement, or another separately gated action.

If those conditions are not met, keep working or leave the PR open with the exact blocker.

## Separate approval gates

Require explicit founder approval before:

- force-push;
- production deployment or rollback;
- auth, authorization, RLS, RPC, identity, or parent-linking changes;
- destructive database, Storage, cache, memory, or migration operations;
- secret creation, rotation, deletion, or exposure;
- domains, DNS, Worker names, app identifiers, signing, or production environment changes;
- paid-service changes;
- expanding parent access or public identity exposure;
- sending external communications;
- deleting Ray/Juss material.

An audit authorizes inspection, not mutation. Approval for one gate does not silently approve the next.

## Before finishing

Verify that:

- every changed file is necessary;
- no duplicate active implementation was introduced;
- preserved inactive work is clearly flagged or isolated;
- no unused imports or dead execution branches were added;
- the app can still run in Expo Go unless the change intentionally requires a native build;
- any safety, privacy, parent-teen, auth, RLS, or identity boundary touched still behaves correctly;
- appropriate tests executed against the intended exact head;
- Playwright passed where applicable or the blocker is recorded;
- Founder Control Room and Cloudflare truth were checked where applicable;
- canonical Markdown and ledger truth were reconciled.