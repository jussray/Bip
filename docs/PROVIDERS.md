# Se’kret Bip Provider Guide

Providers are replaceable capabilities. Teen privacy, consent, identity, product truth, durable state, and safety remain owned by Se’kret Bip.

All providers must follow [`../GLOBAL_AI.md`](../GLOBAL_AI.md) and preserve:

```text
/elonmusk /garyvee lindymode redteam l99 redteam ooda /truthmode
```

## Shared release-truth rule

Look to Founder Control Room first for release-truth interpretation. Capture repository, PR, branch, exact head SHA, workflow, run, job evidence, classification, Cloudflare build/deploy status, runtime evidence, impact, and next gate.

GitHub Actions failures must be classified as `runner_startup_failure`, `workflow_no_jobs`, or `workflow_step_failure` before any provider blames code. Zero-step/no-log jobs are infrastructure evidence, not code-regression proof. Infrastructure outages can still gate merge and release truth under this repo’s rules.

Cloudflare build/deploy evidence is separate from GitHub Actions evidence. Cloudflare success does not prove Playwright, auth, data, privacy, Supabase, Worker, or app runtime gates. GitHub runner outage does not prove application failure.

## Claude / Claude Code

Best for long-context repository analysis, Expo/Supabase/Worker implementation, design-system-aware changes, structured refactors, and documentation. Claude must read `GLOBAL_AI.md`, `AGENTS.md`, and the existing root `CLAUDE.md`. It may not infer unseen dashboard, database, GitHub Actions, Cloudflare, or deployment state.

Claude may continue work until a focused task is done or a real blocker is reached. It may merge only when the merge is the correct evidence-backed integration step and the local merge conditions are satisfied.

## Codex / ChatGPT

Best for debugging, code review, tests, repository operations, data analysis, threat modeling, Playwright, CI triage, and founder-readable decisions. It must read `AGENTS.md` and `GLOBAL_AI.md`. Tool evidence is required for claimed writes, tests, Playwright proof, merges, Cloudflare evidence, or deployments.

Codex/ChatGPT must not claim a code regression from GitHub jobs with no executed steps or logs. It must keep working actual code/review issues when independently proven, while treating runner outage as infrastructure and release-truth evidence.

## OpenAI Platform

Use only behind trusted Worker or server-side boundaries for model responses, voice, moderation, embeddings, or structured output. Keep keys off clients. Version models, prompts, tool schemas, safety behavior, and provenance. Model output is never authorization, consent, identity truth, clinical judgment, or a reason to bypass RLS.

## Anthropic Platform

Use only behind trusted server-side boundaries for model capability or repository assistance. Keep keys off clients. Conversation context is not durable teen memory, consent, or product state. Validate outputs before writes, user-visible safety decisions, or repository mutation.

## Perplexity

Use for current public research, official documentation discovery, policy and market research, and source gathering. It does not know private repository, Supabase, Worker, account, Cloudflare, GitHub Actions, or production state unless explicitly connected and inspected.

Perplexity findings can support context. They do not override repository evidence, Founder Control Room, Cloudflare build logs, Playwright, Supabase, or runtime proof.

## GitHub

Use for source, branches, review, CI evidence, provenance, and rollback. A commit, PR, merge, Cloudflare build, Supabase migration, EAS build, store submission, and healthy runtime are separate states.

GitHub Actions badges are not enough. Inspect runs, jobs, steps, and logs. If steps/logs are absent, classify as infrastructure evidence and check Founder Control Room before making release claims.

## Supabase

Owns Auth, Postgres, RLS, Storage, RPCs, functions, and durable user data. Service-role credentials remain server-side. Identity, parent-link, consent, deletion, and visibility rules require policy/service enforcement and regression tests.

## Cloudflare Workers / Pages

Own privileged AI, voice, authenticated API, Pages/Worker build and deploy evidence, and server-side integration calls. Verify CORS, authentication, input validation, secrets, logging minimization, rate limits, timeouts, costs, and fallback behavior. Worker or Pages deployment success is not proof that app clients use the intended endpoint safely.

## Expo / React Native

Own app runtime, navigation, device behavior, permissions, and platform differences. Preserve Expo Go unless a native build requirement is explicit and approved. Verify web and device behavior where the changed path supports both. Use Playwright for applicable web/runtime path proof.

## Required provider handoff

Every handoff should state:

- verified source and current environment;
- teen/parent/public/private identity context;
- data minimized or intentionally excluded;
- requested decision or action;
- approval state;
- expected output or schema;
- safety, privacy, and proof requirements;
- GitHub Actions classification when relevant;
- Cloudflare build/deploy evidence when relevant;
- Playwright proof or inapplicability when relevant;
- rollback or fallback.

A provider may produce a fluent response. It does not inherit permission to see, share, remember, or rewrite teen data because the prose sounded caring.
