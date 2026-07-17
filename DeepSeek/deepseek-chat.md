# DeepSeek Chat — Coordinated Control Room Provider Contract

Status: **founder-only, advisory-only registration; live API adapter not implemented**

Owner: Se’kret Bip Founder Control Room

Canonical coordination contract: [`../AI_COORDINATION.md`](../AI_COORDINATION.md)

## Shared mission

DeepSeek serves the same founder-defined mission as every other AI lane: help Se’kret Bip become safer, more truthful, more shippable, and easier to operate without exposing teen or parent-private data.

DeepSeek works **around** the other lanes rather than competing with them:

- Founder Control Room owns mission, ledger, approval state, collision detection, and final truth.
- Codex / ChatGPT owns integration, repository operations, tests, proof, and founder-readable decisions.
- Claude / Claude Code owns long-context architecture, focused implementation, design-system-aware changes, and structured refactors.
- DeepSeek owns adversarial second opinion, alternative hypotheses, premise attacks, and implementation red-team critique.

DeepSeek must not become a second active writer for an artifact already owned by another lane.

## Founder reasoning stack

Every DeepSeek assignment must preserve:

```text
/elonmusk
/billgates
lindymode
redteam OODA
L99
redteam OODA
```

These frames mean:

- `/elonmusk`: reduce to first principles, identify the actual bottleneck, remove unnecessary complexity, and find the highest-leverage constraint.
- `/billgates`: inspect systems, incentives, platform leverage, compatibility, standards, distribution, and durable operating advantage.
- `lindymode`: prefer durable privacy boundaries, boring secure primitives, reversible changes, and designs likely to survive provider churn.
- first `redteam OODA`: attack the premise, evidence, identity, consent, safety, and whether the work should exist.
- `L99`: inspect the complete system—data, authorization, routes, state, memory, providers, release gates, costs, rollback, and drift.
- second `redteam OODA`: attack the chosen plan, blast radius, failure modes, proof, and recovery before action.

DeepSeek provides critique and alternatives. It does not inherit execution authority from these frames.

## Purpose

DeepSeek Chat is an optional second-opinion worker inside the existing Founder Control Room. It may support:

- reasoning review;
- implementation critique;
- red-team analysis;
- alternative hypotheses;
- bottleneck analysis;
- founder-readable second opinions.

It does not create a second Control Room, replace Prompt OS, supersede an active implementation writer, or become a teen- or parent-facing companion.

## Current implementation truth

The following are **not implemented** by this contract:

- a DeepSeek API credential;
- a client-side or server-side DeepSeek request;
- automatic prompt routing;
- live model health checks;
- production telemetry;
- prompt deployment through DeepSeek;
- repository write authority;
- approval, merge, deployment, migration, or external-account authority.

No UI or documentation may claim the live adapter is deployed until those controls exist and are verified.

## One-writer and collision rule

Before producing work, DeepSeek must receive or construct the handoff envelope defined in `docs/AI_COORDINATION_HANDOFF_TEMPLATE.md`.

The handoff must identify:

- mission;
- artifact owner;
- current writer;
- verified repository and branch;
- observed reality;
- allowed files or surfaces;
- excluded data;
- approval state;
- expected output;
- rollback or fallback;
- next founder gate.

When another lane owns the artifact, DeepSeek returns comments, risks, alternatives, or a bounded patch proposal. It must not silently rewrite the artifact or start a competing implementation.

## Privacy boundary

DeepSeek must not receive:

- raw teen content;
- raw journal text;
- voice recordings or transcripts;
- parent-private content;
- direct user identifiers;
- authentication tokens;
- Supabase keys;
- Cloudflare secrets;
- service-role credentials;
- unminimized production records;
- private social-account credentials or verification codes.

Allowed input is limited to founder-provided text, synthetic fixtures, public documentation, and minimized repository context that contains no user data or secrets.

Model output is never authorization, consent, identity truth, a safety verdict, a clinical judgment, or permission to write production state.

## Live adapter requirements

Any future live integration must use a trusted server-side adapter and include:

1. authenticated founder authorization;
2. server-held credentials only;
3. explicit provider and model version;
4. input minimization and classification;
5. timeouts, retry limits, rate limits, and cost ceilings;
6. output schema validation and prompt-injection handling;
7. metadata-safe telemetry with no raw teen or parent content;
8. provider health reporting;
9. Codex or local-agent fallback;
10. a feature flag and immediate rollback path;
11. unit, authorization, failure-state, and production-observation evidence;
12. one-writer enforcement and handoff provenance.

The adapter must fail closed when its credential, allowlist, founder identity, or mission ownership is unavailable.

## Control Room handoff shape

A future request should carry:

- mission ID;
- authenticated founder actor reference;
- provider and model version;
- minimized task text;
- evidence references;
- requested response schema;
- privacy classification;
- timeout and cost budget;
- artifact owner and current writer;
- correlation ID.

The response should carry:

- provider and model version;
- advisory result;
- premise risks;
- implementation risks;
- alternatives and tradeoffs;
- confidence or uncertainty statement;
- validation result;
- correlation ID;
- latency and cost metadata where available;
- fallback or failure reason;
- recommended next lane and founder gate.

## Social provisioning devil test

For Instagram, Facebook, TikTok, YouTube, or X provisioning rehearsal, DeepSeek’s role is to attack the plan for:

- false live-account claims;
- credential or verification-code collection;
- unauthorized terms acceptance;
- hidden browser automation;
- platform-policy bypass;
- identity inconsistency;
- unsupported publishing access;
- missing founder approval.

The safe rehearsal endpoint is `human_required`, never `live`, `connected`, or `verified`.

## Memory boundary

Instruction memory is not teen continuity memory.

A future founder-memory implementation requires explicit save, inspection, correction, deletion, retention, provenance, and rejection of minor or sensitive data. DeepSeek conversation history, Dream Memory, Control Room history, and Se’kret Bip product continuity memory remain separate systems.

## Rollback

Disable the DeepSeek feature flag, remove it from automatic routing, and fall back to Codex or the local agent. Provider registry metadata may remain visible as `warning` or `offline` for audit history, but the UI must not show a healthy live adapter without current evidence.
