# Se’kret Bip Provider Guide

Providers are replaceable capabilities. Teen privacy, consent, identity, product truth, durable state, founder authority, and safety remain owned by Se’kret Bip.

All providers must follow [`../GLOBAL_AI.md`](../GLOBAL_AI.md), [`../AI_COORDINATION.md`](../AI_COORDINATION.md), and preserve:

```text
/garyvee lindymode redteam l99 redteam ooda
```

## Coordination rule

Providers share one founder-defined mission but do not share unlimited authority.

Control Room assigns:

- one active writer per artifact or external object;
- bounded reviewer lanes;
- required evidence and output schema;
- approval state;
- stop conditions;
- rollback or fallback owner.

A provider must not duplicate another active implementation, infer live connectivity from registration metadata, convert a dry run into a success claim, or cross a founder-only external gate.

## Founder Control Room

Owns orchestration, lane assignment, mission state, approvals, handoffs, blockers, truth labels, evidence aggregation, and stop controls. It is the only shared coordination surface. Providers must not create parallel Control Rooms.

## Claude / Claude Code

Best for long-context repository analysis, Expo/Supabase/Worker implementation, design-system-aware changes, structured refactors, documentation, and independent architectural review. Claude must read `GLOBAL_AI.md`, `AI_COORDINATION.md`, and the existing root `CLAUDE.md`.

Claude should receive a bounded work packet and return changed paths, assumptions, proof, risks, unresolved decisions, and next owner. It may not infer unseen dashboard, database, deployment, account, or provider state, and it must not overwrite an artifact assigned to another active writer.

## Codex / ChatGPT

Best for integration, debugging, code review, tests, repository operations, data analysis, threat modeling, provider reconciliation, and founder-readable decisions. It must read `AGENTS.md`, `GLOBAL_AI.md`, and `AI_COORDINATION.md`.

Tool evidence is required for claimed writes, tests, merges, deployments, schedules, publications, account state, or external effects. Codex may integrate other provider outputs only after validating their evidence and collision boundaries.

## DeepSeek

Use as a founder-only advisory worker for premise challenge, alternative hypotheses, implementation critique, cost and complexity challenge, and red-team analysis through the existing Control Room. The canonical handoff contract is [`../DeepSeek/deepseek-chat.md`](../DeepSeek/deepseek-chat.md).

DeepSeek is not the active writer by default and is not a teen-facing runtime. It must not receive raw teen content, parent-private content, authentication tokens, service-role credentials, provider secrets, or unminimized production data. It cannot authorize, publish, merge, deploy, create accounts, alter production state, or become a live product capability merely because it produced a strong recommendation or appears in a registry.

Any future live adapter must run behind an authenticated server boundary with explicit model versioning, minimized handoffs, output validation, timeouts, retry/rate/cost limits, metadata-safe telemetry, failure fallback, one-writer provenance, a feature flag, and immediate rollback. Provider or tool registration is a capability declaration, not proof that an adapter is deployed.

## OpenAI Platform

Use only behind trusted Worker or server-side boundaries for model responses, voice, moderation, embeddings, or structured output. Keep keys off clients. Version models, prompts, tool schemas, safety behavior, and provenance. Model output is never authorization, consent, identity truth, clinical judgment, provider truth, or a reason to bypass RLS.

## Anthropic Platform

Use only behind trusted server-side boundaries for model capability or repository assistance. Keep keys off clients. Conversation context is not durable teen memory, consent, product state, or Control Room mission state. Validate outputs before writes, user-visible safety decisions, repository mutation, or handoff acceptance.

## Perplexity and public-research providers

Use for current public research, official documentation discovery, policy and market research, standards comparison, and source gathering. They do not know private repository, Supabase, Worker, account, or production state unless explicitly connected and inspected. Research results must retain source attribution and uncertainty.

## Figma, Canva, and visual providers

Use for approved visual exploration, design-system application, assets, and communication artifacts. Visual output does not prove runtime implementation, live account creation, privacy enforcement, or release readiness. A visual provider may not invent capabilities to make a screen or campaign more persuasive.

## GitHub

Use for source, branches, review, CI evidence, provenance, and rollback. A commit, PR, merge, Cloudflare build, Supabase migration, EAS build, store submission, and healthy runtime are separate states. Branch ownership must respect the one-writer rule.

## Supabase

Owns Auth, Postgres, RLS, Storage, RPCs, functions, and durable user data. Service-role credentials remain server-side. Identity, parent-link, consent, deletion, and visibility rules require policy/service enforcement and regression tests.

## Cloudflare Workers

Own privileged AI, voice, authenticated API, and server-side integration calls. Verify CORS, authentication, input validation, secrets, logging minimization, rate limits, timeouts, costs, and fallback behavior. Worker deployment success is not proof that app clients use the intended endpoint safely.

## Expo / React Native

Own app runtime, navigation, device behavior, permissions, and platform differences. Preserve Expo Go unless a native build requirement is explicit and approved. Verify web and device behavior where the changed path supports both.

## External social platforms

Account creation, terms acceptance, age or identity verification, captcha completion, email or phone verification, device checks, payment, and account recovery remain founder-controlled unless an official platform flow explicitly supports a narrower delegated action.

Control Room may rehearse provisioning, generate candidate copy, preserve desired state, and connect official APIs after founder authorization. A rehearsal must stop at `human_required` and must not be described as `api_connected` or `verified_live`.

## Required provider handoff

Every handoff must state:

- mission ID;
- who owns the decision, active writing lane, review lane, affected users, and data subjects;
- what exact outcome is requested and what is excluded;
- where the repository, branch, files, environment, runtime, account, and provider boundaries are;
- when the action belongs in the lifecycle and when the handoff expires;
- why the evidence supports the action;
- how the smallest safe action, proof, rollout, rollback, and next handoff work;
- verified source and current environment;
- data minimized or intentionally excluded;
- approval state;
- expected output or schema;
- changed paths or external objects;
- safety, privacy, collision, and proof requirements;
- blocker, rollback, or fallback;
- next owner.

A provider may produce a fluent response. It does not inherit permission to see, share, remember, overwrite, publish, or rewrite teen data, repository artifacts, or external accounts because the prose sounded caring or confident.
