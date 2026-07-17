# DeepSeek Chat — Control Room Provider Contract

Status: **founder-only, advisory-only registration; live API adapter not implemented**

Owner: Se’kret Bip Control Room

## Purpose

DeepSeek Chat is an optional second-opinion worker inside the existing founder Control Room. It may support:

- reasoning review;
- implementation critique;
- red-team analysis;
- alternative hypotheses;
- founder-readable second opinions.

It does not create a second Control Room, replace Prompt OS, or become a teen- or parent-facing companion.

## Current implementation

The Control Room worker registry exposes `deepseek` with warning health and a fallback to Codex. Prompt OS documents the provider boundary. This registration is capability metadata only.

The following are **not implemented**:

- a DeepSeek API credential;
- a client-side or server-side DeepSeek request;
- automatic prompt routing;
- live model health checks;
- production telemetry;
- prompt deployment through DeepSeek.

No UI or documentation may claim the live adapter is deployed until those controls exist and are verified.

## Privacy boundary

DeepSeek must not receive raw teen content, raw journal text, voice recordings, parent-private content, direct identifiers, authentication tokens, Supabase keys, Cloudflare secrets, service-role credentials, or unminimized production records.

Allowed input is limited to founder-provided text, synthetic fixtures, public documentation, and minimized repository context that contains no user data or secrets.

Model output is never authorization, consent, identity truth, a safety verdict, a clinical judgment, or permission to write production state.

## Live adapter requirements

Any future live integration must use a trusted server-side adapter and must include:

1. authenticated founder authorization;
2. server-held credentials only;
3. an explicit model identifier and version;
4. input size and content minimization;
5. timeouts, retry limits, rate limits, and cost ceilings;
6. output schema validation and prompt-injection handling;
7. metadata-safe telemetry with no raw teen content;
8. provider health reporting;
9. Codex or local-agent fallback;
10. a feature flag and immediate rollback path;
11. unit, authorization, failure-state, and production-observation evidence.

The adapter must fail closed when its credential, allowlist, or founder identity is unavailable.

## Control Room handoff shape

A future adapter request should carry:

- mission ID;
- authenticated founder actor reference;
- provider and model version;
- minimized task text;
- evidence references;
- requested response schema;
- privacy classification;
- timeout and cost budget;
- correlation ID.

The response should carry:

- provider and model version;
- advisory result;
- confidence or uncertainty statement;
- validation result;
- correlation ID;
- latency and token/cost metadata where available;
- fallback or failure reason.

## Rollback

Disable the DeepSeek feature flag, remove it from automatic routing, and fall back to Codex or the local agent. Worker registry metadata may remain visible as `warning` or `offline` for audit history, but the UI must not show a healthy live adapter without current evidence.


## Proposed tool namespace

The supplied external namespace describes possible capabilities, not capabilities currently deployed by Se’kret Bip:

| Capability | Control Room classification | Required adapter |
|---|---|---|
| Web search and URL reading | Founder research only | Search provider with citations, allowlisting, timeouts, and no private user data |
| Image search and similarity | Founder asset research only | Rights/provenance review, safe download handling, and metadata minimization |
| Python or notebook analysis | Isolated founder analysis | Sandboxed execution with no production credentials or unrestricted network |
| Finance, academic, and public datasets | Founder research only | Source-specific validation and current-data attribution |
| Interactive widgets | Founder visualization only | Sandboxed rendering with no privileged browser access |
| Reminders and schedules | Founder operations only | Authenticated scheduler with ownership, audit, cancellation, and timezone handling |
| Instruction memory | Founder preferences only | Explicit consent, inspection, correction, deletion, retention, and audit controls |

None of these capabilities are available merely because they appear in an external tool schema. Control Room must display them as `not_built`, `offline`, or `warning` until the exact adapter is connected and verified.

## Memory boundary

Instruction memory is not teen continuity memory.

The founder may eventually save an explicit Control Room operating preference, but the generic instruction-memory adapter must never store information about minors, teen conversations, journal content, safety events, parent–teen relationship data, health information, precise location, authentication material, or provider secrets.

A future founder-memory implementation requires:

- an explicit save request;
- founder-only authentication and authorization;
- a visible list of stored instructions;
- edit and delete controls;
- retention and provenance metadata;
- no implicit extraction from conversations;
- no reuse as teen/parent product memory;
- tests proving minor and sensitive-data rejection.

Dream Memory, provider conversation history, model context, Control Room operational history, and Se’kret Bip continuity memory are separate systems and must never be represented as interchangeable.
