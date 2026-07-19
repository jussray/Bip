# Agent Instructions for Se'kret Bip

Use these instructions whenever an AI coding agent works in this repository.

> **Before making any claim about current PR, deployment, migration, backend state, GitHub Actions status, Cloudflare status, or release truth, read `SPRINT.md` at the repo root and verify it using `.agents/skills/bip-repo-truth/SKILL.md`. Also check Founder Control Room when release, CI, outage, or cross-repo truth is involved.**

## Canonical repository

`jussray/Sekret-Bip` is the active Se’kret Bip working repository.

Other Bip-named repositories are historical or investigate-only unless Founder Control Room explicitly names one for provenance capture. Do not implement active Bip work in those repos. Port useful findings here through a focused PR.

## Global founder stack

Read [`GLOBAL_AI.md`](./GLOBAL_AI.md) before nontrivial work and preserve the full founder reasoning stack.

Every agent must follow **`/elonmusk` + `/garyvee` + `lindymode` + first-pass `redteam OODA` + `L99` + second-pass `redteam OODA` + `/truthmode` before changing code, configuration, schema, deployment, tests, documentation, or agent skills.** A plain OODA pass is not sufficient.

The canonical repository sequence remains:

```text
/elonmusk /garyvee lindymode redteam l99 redteam ooda /truthmode
```

`/elonmusk` adds first-principles reduction, bottleneck identification, leverage analysis, and deletion of unnecessary complexity. It does not replace, shorten, collapse, skip, or reorder the required passes.

The first redteam attacks the product premise and evidence. L99 drives implementation depth. The second redteam OODA attacks the selected implementation, privacy and security blast radius, rollback, and proof.

Provider boundaries and handoffs are documented in [`docs/PROVIDERS.md`](./docs/PROVIDERS.md). Project-local rules below may be stricter; they may not weaken privacy, security, evidence, approval, provenance, rollback, or truthfulness.

## MCP-to-skill routing

MCP connectivity and Bip skill activation are separate requirements. Before invoking any MCP server, read [`config/mcp-skill-routing.json`](./config/mcp-skill-routing.json), load every skill mapped to that server, and also load every skill in `alwaysLoad`.

- Never use an MCP merely because it is configured.
- The mapped skill defines the product boundary; the MCP supplies a scoped tool.
- If a mapped skill file is missing, stop rather than silently continuing without the guardrail.
- Use `npm run verify:mcp` to prove that configured servers, authority boundaries, and skill files remain aligned.
- Auth, login, consent, verification, parent linking, or onboarding work must activate `.agents/skills/bip-auth-onboarding/SKILL.md` in addition to the server-specific mappings.

## Figma build and implementation

For every Figma, screen-design, room-design, design-system, design-to-code, Code Connect, prototype, or visual QA task, also read `.agents/skills/figma-build-implement/SKILL.md` and `.figma/repository-profile.json`.

Figma may specify Expo/React Native product behavior only with synthetic or redacted content. It cannot create runtime, auth, consent, parent visibility, RLS, migration, device, deployment, or release proof. Native-critical flows require controlled device evidence in addition to editable design and web proof.

## OODA Workflow

Every agent must execute the full founder stack above, then follow this repository OODA workflow before changing anything.

### 1. Observe

Inspect the real repository state before acting.

Check existing files, routes, services, hooks, types, assets, current branch and recent changes when available, build or TypeScript errors related to the task, whether the requested feature already exists but is disconnected, and whether the issue is caused by stale local code, unpushed work, infrastructure outage, or actual repo state.

Do not assume planned architecture exists. Verify it in the repo.

### 2. Orient

Map the task against the current app architecture.

Ask which existing file owns this behavior now; whether this is app UI, backend, database, auth, storage, AI reply, release, or shared work; whether this is a shipping blocker, demo polish, refactor, or future idea; and whether this interacts with Expo Router, Supabase, Cloudflare Workers, OpenAI, GitHub Actions, or Founder Control Room.

Prefer the current working structure over imaginary clean-room architecture.

### 3. Decide

Choose the smallest shipping-safe action.

Before coding, decide whether existing code can be wired instead of replaced, whether the fix can be one file, whether current work can be preserved behind a route/flag/compatibility boundary, whether this needs a database migration, environment variable, backend change, test, Playwright proof, or release-truth record, and whether it should wait because it is not required for the next demo or release.

If there are multiple possible fixes, choose the least risky one that keeps the app shippable and preserves future product work.

### 4. Act

Make the change with minimal blast radius.

- Modify only the necessary files.
- Keep naming consistent with the repo.
- Preserve existing features, routes, assets, and services unless removal is required for correctness, privacy, security, or release safety.
- Prefer feature flags, route isolation, deprecation notes, and compatibility adapters over deletion.
- Before deleting anything, identify all references and explain why preserving it is unsafe or materially blocks shipping.
- Avoid new dependencies unless there is no native or existing option.
- Avoid broad refactors unless the task explicitly requires them.
- Leave the app easier to understand than before.

After acting, report what changed, why it was the smallest safe change, how existing work was preserved, how it was verified, and what remains unfinished.

## Infrastructure outage and CI classification

When GitHub Actions fails, classify the evidence before blaming code:

- `runner_startup_failure`: GitHub runner or job startup failed before meaningful steps executed, especially when jobs show no steps, no logs, or null log URLs.
- `workflow_no_jobs`: the workflow itself schedules no jobs or is skipped before jobs exist.
- `workflow_step_failure`: at least one job executed steps and logs show a concrete failing command, assertion, build, lint, type, or Playwright step.

Never claim a code regression when GitHub jobs have no executed steps or logs. A zero-step/no-log GitHub Actions failure is infrastructure evidence, not application failure.

That infrastructure outage still gates release truth when this repo’s rules require exact-head executed checks, Playwright proof, Cloudflare evidence, or runtime evidence. Do not wave it through as “green enough.” Record the blocker and keep working on actual review/code issues that are independently proven.

## Founder Control Room and Cloudflare truth

Founder Control Room is the first authority for interpreting GitHub Actions incidents, cross-repo release truth, and Cloudflare build/deploy evidence.

For every CI/release incident, capture repository, PR, branch, exact head SHA, workflow, run, job evidence, classification, Cloudflare build status, Worker/Page deploy status, runtime evidence, impact, and next gate.

Cloudflare build or deploy success is separate from GitHub Actions success. GitHub runner outage does not prove code failure. Cloudflare success does not prove GitHub checks, Playwright, auth, data, teen privacy, parent visibility, Supabase, Worker, or runtime routes passed. Record both without blending them.

## Preservation-First Rule

Se'kret Bip is being shipped in phases, not reduced to a permanently smaller product.

- Do not delete unfinished product work merely because it is outside the current release path.
- Keep future features available for later build-out through feature flags, hidden routes, documented backlog status, or isolated modules.
- Do not merge duplicate active implementations indefinitely; select one canonical launch path while preserving the other only when it has clear future value.
- Mark deprecated or inactive code clearly so future agents do not treat it as current behavior.
- Delete only when code is unsafe, irreparably broken, legally risky, secret-bearing, truly obsolete, or proven to have no future use.

## Ponytail Rule

Before adding code, pause and ask:

1. Does this already exist in the codebase?
2. Can existing code be connected instead of replaced?
3. Can Expo do this already?
4. Can React Native do this already?
5. Can Supabase do this already?
6. Can Cloudflare Workers do this already?
7. Can an installed dependency do this already?
8. Can this be solved with one small change instead of a new abstraction?

Only write new code after those checks are answered.

## Testing Strategy

Use the smallest testing tool that can prove the behavior being changed.

Current testing priority:

1. Keep unit, service, contract, and regression tests for core logic, privacy contracts, RLS assumptions, and route safety.
2. Use Playwright for parent/teen web flows, Expo web smoke tests, auth routing, Parent Bridge inbox, settings, release-truth UI, and regression checks before merge when a user-facing web/runtime path changes.
3. Use Maestro for real iOS/Android device flows, especially signup, login, onboarding, teen-parent linking, Bridge share/revoke, navigation, and Expo Go or build smoke tests.
4. Only move to Detox if the app eventually needs deep native automation that Maestro cannot cover.

Do not add Playwright, Maestro, or Detox to a feature PR unless that PR specifically needs the new test layer. Prefer a dedicated testing-infrastructure PR.

If Playwright cannot run because of a GitHub runner outage, missing secrets, missing browser dependencies, or unavailable infrastructure, record that as a verification blocker rather than code blame.

## Project Priorities

Se'kret Bip should stay simple, shippable, and easy to demo while preserving the larger product vision.

Prefer Expo APIs, React Native primitives, existing app services, Supabase features, Cloudflare Workers features, small patches, and canonical active paths plus preserved flagged future work.

Avoid new dependencies unless truly needed, duplicate helpers/services/hooks/types, broad architecture rewrites, file moves for cosmetic cleanliness, placeholder systems that are not wired into the app, and destructive cleanup performed only to make metrics or file counts look smaller.

## Se'kret Bip Product Guardrails

Keep the product tone safe, teen-centered, warm, and non-clinical.

The app is not a therapy replacement. Do not add features that claim to diagnose, treat, or replace emergency support.

Preserve these boundaries:

- Teen privacy first.
- Parent visibility is optional and consent-based unless safety rules require escalation.
- Keep anonymous Circle identity protected by default.
- Do not expose private names, journal text, voice notes, or safety data across contexts.
- Do not log secrets, private user content, tokens, or Supabase service keys.

## Development Style

When changing code:

- Make the smallest working change.
- Check existing files before creating new ones.
- Keep route names and screen names consistent with Expo Router.
- Keep TypeScript types strict and shared where they already exist.
- Do not introduce a new state system unless the existing one cannot support the task.
- Do not add new environment variables unless unavoidable.
- Document any required environment variable in the same change that uses it.

## Merge authority

Merge when it is the correct evidence-backed integration step, not merely because a PR exists or a badge looks green.

A merge is safe only when repository, target branch, PR, and exact head SHA are verified; scope is focused and no unrelated work is hidden in the diff; changed code/config/docs have been reviewed; required checks have genuinely executed and passed, or a documented infrastructure outage is classified and remaining evidence is sufficient for the specific change; Playwright has passed for changed user-facing web/runtime paths or is explicitly inapplicable; Founder Control Room and Cloudflare evidence were checked when release truth or deployment is involved; no unresolved critical review thread remains; teen privacy, parent visibility, auth, RLS, credentials, brand/IP, user data, and rollback remain intact; and the merge itself does not silently perform deployment, migration, auth/RLS changes, billing/spending, external publication, destructive deletion, credential movement, or another separately gated action.

If those conditions are not met, keep working or leave the PR open with the exact blocker.

## Separate approval gates

Require explicit founder approval before force-push, production deployment, rollback, auth/authorization/RLS/RPC/identity/parent-linking changes, destructive database/storage/cache/memory/migration operations, secret creation/rotation/deletion/exposure, domains/DNS/Worker names/app identifiers/signing/production environment changes, paid-service changes, expanding parent access or public identity exposure, sending external communications, or deleting Ray/Juss material.

An audit authorizes inspection, not mutation. Approval for one gate does not silently approve the next.

## Before Finishing

Before marking work complete, verify changed files are necessary, no duplicate active implementation was introduced, preserved inactive work is clearly flagged or isolated, no unused imports or dead execution branches were added, the app can still run in Expo Go unless the change intentionally requires a native build, any safety/privacy/parent-teen boundary touched by the change still behaves correctly, Playwright has passed where applicable or the blocker is recorded, and Founder Control Room/Cloudflare release truth was checked where applicable.
