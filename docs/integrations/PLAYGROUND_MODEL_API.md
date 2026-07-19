# Playground Meta Model API setup

Playground is the working name for the Meta Model API / Muse Spark developer surface used for direct model calls such as `POST https://api.meta.ai/v1/responses` with `model: "muse-spark-1.1"`.

This document is a setup contract only. It does not mean Se'kret Bip has a production Meta Model API integration, provider routing, prompt pipeline, user-visible AI feature, or retained model-output evidence.

## Boundary from Story Engine

Story Engine and Playground are separate external app surfaces:

- `Story Engine`: Meta developer app container for Facebook/Instagram social integration setup.
- `Playground`: Meta Model API key surface for Muse Spark / model-response experiments.

Do not mix their secrets, permissions, review evidence, or production gates.

## Safe-to-commit values

Only non-secret labels belong in committed files:

```env
META_MODEL_API_APP_NAME=Playground
META_MODEL_API_BASE_URL=https://api.meta.ai/v1
META_MODEL_API_DEFAULT_MODEL=muse-spark-1.1
```

These names are configuration labels and defaults. They do not grant access.

## Server-only secret

The real API key must never be committed or bundled into Expo/public config:

```env
MODEL_API_KEY=
```

Use an approved server-side secret store only, such as Cloudflare Worker secrets, Supabase Edge Function secrets, GitHub Actions secrets for verification-only jobs, or another reviewed vault.

## Code-shape note

The sample Python client uses:

- `MODEL_API_KEY` from the environment;
- `Authorization: Bearer <key>`;
- `Accept: text/event-stream`;
- `stream: true`;
- `model: "muse-spark-1.1"`;
- `reasoning: { "effort": "high" }`.

That is enough to identify the API surface, but it is not an approved production integration.

## Implementation gate

Before any Se'kret Bip runtime code calls Playground / Meta Model API, the change must include:

1. explicit founder approval;
2. provider boundary documentation explaining why this model is used and where;
3. a reduced-data prompt/input policy;
4. a teen privacy review proving no private teen journals, Bridge content, safety-scan content, parent/teen protected data, or raw sensitive content is sent without a separate approved consent and safety boundary;
5. server-only secret storage and rotation notes;
6. fail-closed behavior for missing, invalid, or rate-limited credentials;
7. logging rules that avoid storing raw prompts, private teen content, or full model outputs unless explicitly approved;
8. model/provider fallback behavior, if any;
9. Playwright, unit, or integration evidence for any user-visible model route;
10. Founder Control Room tracking for setup state and exact-head evidence.

## Current status

- External app/surface name: `Playground`.
- API surface: Meta Model API / responses endpoint.
- Example model: `muse-spark-1.1`.
- Repository configuration: documentation only.
- Runtime integration: not implemented.
- Production readiness: blocked pending reviewed implementation, server-side secret configuration, privacy boundary evidence, provider routing proof, and production verification.
