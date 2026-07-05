# Agent Instructions for Se'kret Bip

Use these instructions whenever an AI coding agent works in this repository.

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
