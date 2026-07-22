# Repo Knowledge Refresh — 2026-07-20

This is the current agent-orientation checkpoint for Se'kret Bip after the late-July repo surge. Use it to prevent stale agents from operating from the old pre-router or pre-Control-Room map.

## Why this exists

A 17-day-old mental model is no longer safe in this repository. The July 3, 2026 shipping-fix audit commit `990b3cab6986ecdefe65966aa226bdecaf5649e2` is now hundreds of commits behind `main`. A focused compare from that commit to `main` showed `main` **878 commits ahead** with new agent skills, Control Room manifests, Expo Router auth/onboarding surfaces, Cloudflare and GitHub workflow changes, Product Design assets/tokens, companion canon docs, and runtime evidence scaffolding.

Do not treat older summaries that say the app is a one-file prototype, has no `app/` directory, has no Supabase auth, or has no route groups as current truth. Those were once useful drift reports; they are now stale unless tied to the exact commit they inspected.

## Current repository authority

- Canonical active repo: `jussray/Sekret-Bip`.
- Default branch: `main`.
- Current product architecture: React Native + Expo Router + TypeScript frontend, Supabase Auth/Postgres/RLS/Storage/Edge Functions, Cloudflare Worker API, and Cloudflare Pages web deployment.
- Current app shape includes `app/(auth)`, `app/(onboarding)`, `app/(teen)`, `app/(parent)`, `app/(dev)`, Worker code, Supabase migrations/functions, `e2e/` Playwright tests, `.agents/skills/*`, Control Room docs/manifests, and Product Design/design-token artifacts.
- Cloudflare Worker authority currently names the backend Worker as `sekret-backend`; Cloudflare Pages project authority is `sekret-bip`.

## Current checkpoint observed in this refresh

- `main` contains `4daaa99449ef8570869c2c79b8a41c5cdfa5a676`, `fix forgot password JSX string`, repairing the malformed JSX newline in `app/(auth)/forgot-password.tsx`.
- Draft PR #567, branch `agent/fix-cloudflare-worker-name`, now points at `f8cb7cb9ccf0de5207a5a921179e71ee972f9d33` after receiving the same JSX export fix on top of the Worker-name change.
- PR #567 currently changes exactly `wrangler.toml` and `app/(auth)/forgot-password.tsx`.
- GitHub showed `Cookie Contract Mirror` completed successfully on PR #567 head `f8cb7cb9ccf0de5207a5a921179e71ee972f9d33`.
- No local build, Playwright, or Expo export was run from ChatGPT's runtime during this refresh because that runtime could not resolve `github.com`. Treat this as connector-verified repo state, not local build proof.
- Cloudflare Pages/Expo export success is still a separate witness. Do not infer Cloudflare success from the GitHub cookie-contract check.

## Active launch/product-design bottleneck

Founder Access Recovery Gate remains the primary user-facing blocker until Ray can personally get inside Se'kret Bip on device.

The proof path is:

1. signup renders and submits with the intended Supabase client/env;
2. login renders and authenticates a permanent account;
3. session persists across reload/app restart;
4. email confirmation and deep-link redirects do not trap the account;
5. consent saves before durable age/role/onboarding milestones;
6. age, role, name, and onboarding routes do not dead-end;
7. logout clears private transient onboarding/account cache;
8. Ray verifies the path on device.

No launch-proof language is allowed until that real device/user journey is observed.

## Product Design instruction

For Product Design work, prioritize the founder/account access recovery journey before broad visual exploration:

- login;
- signup;
- forgot password;
- reset password;
- email confirmation/deep link;
- onboarding welcome/age/consent/role/name path;
- post-auth bootstrap route;
- logout/session cleanup.

Use screenshots, rendered prototypes, Playwright/web evidence, and device evidence as distinct proof layers. Figma, Canva, and static design artifacts may guide visual decisions, but they do not prove Supabase auth, route persistence, consent writes, session storage, Cloudflare deployment, or real device behavior.

## Agent operating rules from this refresh

1. Start every nontrivial session with `AGENTS.md`, `SPRINT.md`, `.agents/skills/bip-current-state/SKILL.md`, and the most relevant issue/PR authority.
2. For release, CI, Cloudflare, or cross-repo truth, check Founder Control Room authority before claiming completion.
3. Keep repository state, GitHub Actions state, Cloudflare build/deploy state, Supabase state, Playwright state, device state, and Product Design state separate. Do not blend witnesses.
4. If GitHub Actions has no jobs, no steps, or no logs, classify that as infrastructure evidence, not a code regression.
5. If Cloudflare fails after the JSX repair, classify the next concrete failure from the new log instead of reusing the previous syntax-error diagnosis.
6. Do not delete preserved Ray/Juss work to make the repo look cleaner. Mark stale paths, preserve future lanes behind docs/flags/routes, and only remove unsafe or truly obsolete material.
7. Do not perform production deploys, Supabase DDL/DML, credential changes, paid-capacity changes, external publication, deletion, or DNS/Worker authority changes without explicit founder approval.

## Immediate next proof loop

- Watch the Cloudflare build for PR #567 head `f8cb7cb9ccf0de5207a5a921179e71ee972f9d33`.
- If it fails, repair the new concrete failure only.
- If it passes, run the founder access recovery Product Design QA and auth/onboarding proof path.
- Update the relevant PR/issue docs with exact-head evidence, but keep launch-proof claims blocked until Ray verifies the app on device.
