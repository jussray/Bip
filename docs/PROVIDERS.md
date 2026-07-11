# Se’kret Bip Provider Guide

Providers are replaceable capabilities. Teen privacy, consent, identity, product truth, durable state, and safety remain owned by Se’kret Bip.

All providers must follow [`../GLOBAL_AI.md`](../GLOBAL_AI.md) and preserve:

```text
/garyvee lindymode redteam l99 redteam ooda
```

## Claude / Claude Code

Best for long-context repository analysis, Expo/Supabase/Worker implementation, design-system-aware changes, structured refactors, and documentation. Claude must read both `GLOBAL_AI.md` and the existing root `CLAUDE.md`. It may not infer unseen dashboard, database, or deployment state.

## Codex / ChatGPT

Best for debugging, code review, tests, repository operations, data analysis, threat modeling, and founder-readable decisions. It must read `AGENTS.md` and `GLOBAL_AI.md`. Tool evidence is required for claimed writes, tests, merges, or deployments.

## OpenAI Platform

Use only behind trusted Worker or server-side boundaries for model responses, voice, moderation, embeddings, or structured output. Keep keys off clients. Version models, prompts, tool schemas, safety behavior, and provenance. Model output is never authorization, consent, identity truth, clinical judgment, or a reason to bypass RLS.

## Anthropic Platform

Use only behind trusted server-side boundaries for model capability or repository assistance. Keep keys off clients. Conversation context is not durable teen memory, consent, or product state. Validate outputs before writes, user-visible safety decisions, or repository mutation.

## Perplexity

Use for current public research, official documentation discovery, policy and market research, and source gathering. It does not know private repository, Supabase, Worker, account, or production state unless explicitly connected and inspected.

## GitHub

Use for source, branches, review, CI evidence, provenance, and rollback. A commit, PR, merge, Cloudflare build, Supabase migration, EAS build, store submission, and healthy runtime are separate states.

## Supabase

Owns Auth, Postgres, RLS, Storage, RPCs, functions, and durable user data. Service-role credentials remain server-side. Identity, parent-link, consent, deletion, and visibility rules require policy/service enforcement and regression tests.

## Cloudflare Workers

Own privileged AI, voice, authenticated API, and server-side integration calls. Verify CORS, authentication, input validation, secrets, logging minimization, rate limits, timeouts, costs, and fallback behavior. Worker deployment success is not proof that app clients use the intended endpoint safely.

## Expo / React Native

Own app runtime, navigation, device behavior, permissions, and platform differences. Preserve Expo Go unless a native build requirement is explicit and approved. Verify web and device behavior where the changed path supports both.

## Required provider handoff

Every handoff should state:

- verified source and current environment;
- teen/parent/public/private identity context;
- data minimized or intentionally excluded;
- requested decision or action;
- approval state;
- expected output or schema;
- safety, privacy, and proof requirements;
- rollback or fallback.

A provider may produce a fluent response. It does not inherit permission to see, share, remember, or rewrite teen data because the prose sounded caring.