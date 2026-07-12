# Agent Instructions for Se'kret Bip

Use these instructions whenever an AI coding agent works in this repository.

> **Before making any claim about current PR, deployment, migration, or backend state, read `SPRINT.md` at the repo root and verify it using `.agents/skills/bip-repo-truth/SKILL.md`.**

## Global founder stack

Read [`GLOBAL_AI.md`](./GLOBAL_AI.md) before nontrivial work and preserve the full founder reasoning stack.

Every agent must follow **`/elonmusk` + `lindymode` + first-pass `redteam OODA` + `L99` + second-pass `redteam OODA` before changing code, configuration, schema, deployment, tests, documentation, or agent skills.** A plain OODA pass is not sufficient.

The canonical repository sequence remains:

```text
/garyvee lindymode redteam l99 redteam ooda
```

When `/elonmusk` is invoked, layer first-principles reduction, bottleneck identification, leverage analysis, and deletion of unnecessary complexity on top of that sequence. Do not replace, shorten, collapse, skip, or reorder the required passes.

The first redteam attacks the product premise and evidence. L99 drives implementation depth. The second redteam OODA attacks the selected implementation, privacy and security blast radius, rollback, and proof.

Provider boundaries and handoffs are documented in [`docs/PROVIDERS.md`](./docs/PROVIDERS.md). Project-local rules below may be stricter; they may not weaken privacy, security, evidence, approval, provenance, rollback, or truthfulness.

## OODA Workflow

Every agent must execute the full founder stack above, then follow this repository OODA workflow before changing anything.

### 1. Observe

Inspect the real repository state before acting.

Check:

- Existing files, routes, services, hooks, types, and assets.
- Current branch and recent changes when available.
- Build or TypeScript errors related to the task.
- Whether the requested feature already exists but is disconnected.
- Whether the issue is caused by stale local code, unpushed work, or actual repo state.

Do not assume planned architecture exists. Verify it in the repo.

### 2. Orient

Map the task against the current app architecture.

Ask:

- Which existing file owns this behavior now?
- Is this app UI, backend, database, auth, storage, AI reply, release, or shared work?
- Is this a shipping blocker, demo polish, refactor, or future idea?
- Does this interact with Expo Router, Supabase, Cloudflare Workers, or OpenAI?

Prefer the current working structure over imaginary clean-room architecture.

### 3. Decide

Choose the smallest shipping-safe action.

Before coding, decide:

- Can this be fixed by wiring existing code?
- Can this be fixed in one file?
- Can existing code be preserved behind a route, flag, or compatibility boundary?
- Does this need a database migration, environment variable, or backend change?
- Does this need tests or only a verification checklist?
- Should this wait because it is not required for the next demo or release?

If there are multiple possible fixes, choose the least risky one that keeps the app shippable and preserves future product work.

### 4. Act

Make the change with minimal blast radius.

When acting:

- Modify only the necessary files.
- Keep naming consistent with the repo.
- Preserve existing features, routes, assets, and services unless removal is required for correctness, privacy, security, or release safety.
- Prefer feature flags, route isolation, deprecation notes, and compatibility adapters over deletion.
- Before deleting anything, identify all references and explain why preserving it is unsafe or materially blocks shipping.
- Avoid new dependencies unless there is no native or existing option.
- Avoid broad refactors unless the task explicitly requires them.
- Leave the app easier to understand than before.

After acting, report:

- What changed.
- Why it was the smallest safe change.
- How existing work was preserved.
- How it was verified.
- What remains unfinished, if anything.

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
2. Add Playwright for parent/teen web flows, especially Expo web smoke tests, auth routing, Parent Bridge inbox, settings, and regression checks after merges.
3. Add Maestro for real iOS/Android device flows, especially signup, login, onboarding, teen-parent linking, Bridge share/revoke, navigation, and Expo Go or build smoke tests.
4. Only move to Detox if the app eventually needs deep native automation that Maestro cannot cover, such as complex native module behavior, permission-heavy flows, or fine-grained synchronization.

Do not add Playwright, Maestro, or Detox to a feature PR unless that PR specifically needs the new test layer. Prefer a dedicated testing-infrastructure PR.

## Project Priorities

Se'kret Bip should stay simple, shippable, and easy to demo while preserving the larger product vision.

Prefer:

- Expo APIs over new third-party packages.
- React Native primitives over custom UI frameworks.
- Existing app services over duplicate services.
- Supabase features over custom backend code when Supabase already covers the need.
- Cloudflare Workers features over adding another backend provider.
- Small patches over sweeping refactors.
- Canonical active paths plus preserved flagged future work.

Avoid:

- New dependencies unless the repo truly needs them.
- Creating duplicate helpers, services, hooks, or types.
- Large architecture rewrites without a direct shipping reason.
- Moving files just to make the structure look cleaner.
- Adding placeholder systems that are not wired into the app.
- Destructive cleanup performed only to make metrics or file counts look smaller.

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

## Before Finishing

Before marking work complete, verify:

- The changed files are necessary.
- No duplicate active implementation was introduced.
- Preserved inactive work is clearly flagged or isolated.
- No unused imports or dead execution branches were added.
- The app can still run in Expo Go unless the change intentionally requires a native build.
- Any safety, privacy, or parent/teen boundary touched by the change still behaves correctly.
