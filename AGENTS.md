# Agent Instructions for Se'kret Bip

Use these instructions whenever an AI coding agent works in this repository.

## OODA Workflow

Every agent must follow OODA before changing code.

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

- Can this be fixed by deleting code?
- Can this be fixed by wiring existing code?
- Can this be fixed in one file?
- Does this need a database migration, environment variable, or backend change?
- Does this need tests or only a verification checklist?
- Should this wait because it is not required for the next demo or release?

If there are multiple possible fixes, choose the least risky one that keeps the app shippable.

### 4. Act

Make the change with minimal blast radius.

When acting:

- Modify only the necessary files.
- Keep naming consistent with the repo.
- Avoid new dependencies unless there is no native or existing option.
- Avoid broad refactors unless the task explicitly requires them.
- Leave the app easier to understand than before.

After acting, report:

- What changed.
- Why it was the smallest safe change.
- How it was verified.
- What remains unfinished, if anything.

## Ponytail Rule

Before adding code, pause and ask:

1. Can this be deleted instead of added?
2. Does this already exist in the codebase?
3. Can Expo do this already?
4. Can React Native do this already?
5. Can Supabase do this already?
6. Can Cloudflare Workers do this already?
7. Can an installed dependency do this already?
8. Can this be solved with one small change instead of a new abstraction?

Only write new code after those checks are answered.

## Project Priorities

Se'kret Bip should stay simple, shippable, and easy to demo.

Prefer:

- Expo APIs over new third-party packages.
- React Native primitives over custom UI frameworks.
- Existing app services over duplicate services.
- Supabase features over custom backend code when Supabase already covers the need.
- Cloudflare Workers features over adding another backend provider.
- Small patches over sweeping refactors.
- Removing dead code over adding compatibility layers.

Avoid:

- New dependencies unless the repo truly needs them.
- Creating duplicate helpers, services, hooks, or types.
- Large architecture rewrites without a direct shipping reason.
- Moving files just to make the structure look cleaner.
- Adding placeholder systems that are not wired into the app.

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
- No duplicate implementation already exists.
- No unused imports, unused files, or dead branches were added.
- The app can still run in Expo Go unless the change intentionally requires a native build.
- Any safety, privacy, or parent/teen boundary touched by the change still behaves correctly.
