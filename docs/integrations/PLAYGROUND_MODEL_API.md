# Playground Meta Model API setup

Playground is the working name for the Meta Model API / Muse Spark developer surface used for direct model calls such as `POST https://api.meta.ai/v1/responses` with `model: "muse-spark-1.1"`.

This document is a setup contract only. It does not mean Se'kret Bip has a production Meta Model API integration, provider routing, prompt pipeline, user-visible AI feature, book-to-social content studio, or retained model-output evidence.

## Product purpose: book-to-social creation

The intended product question is whether Playground can help turn founder-owned book material into platform-ready content for TikTok, Instagram, and Facebook.

Yes, Playground can help with the creation layer, such as:

- extracting themes, scenes, lessons, and quotes from approved book text;
- generating short-form video scripts, hooks, caption drafts, carousel outlines, voiceover drafts, and hashtag sets;
- adapting one book passage into different formats for TikTok, Instagram, Facebook, and newsletter/promotional surfaces;
- creating planning metadata such as content pillars, audience intent, tone, CTA, and platform fit.

Playground does not publish to social platforms by itself. It is not the same thing as Meta's Facebook/Instagram social APIs, and it does not provide TikTok posting access.

## Boundary from Story Engine and TikTok

Story Engine, Playground, and TikTok are separate external app/API surfaces:

- `Story Engine`: Meta developer app container for Facebook/Instagram social integration setup, including future account connection, publishing, insights, comments, or webhooks after separate review.
- `Playground`: Meta Model API key surface for Muse Spark / model-response experiments that may help create drafts from approved book material.
- `TikTok`: separate developer app/API surface required for TikTok publishing or TikTok account connection.

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

That is enough to identify the API surface and potential creation layer, but it is not an approved production integration.

## Implementation gate

Before any Se'kret Bip runtime code calls Playground / Meta Model API, the change must include:

1. explicit founder approval;
2. provider boundary documentation explaining why this model is used and where;
3. a book-source policy proving the content is founder-owned, licensed, public-domain, or otherwise approved for transformation;
4. a reduced-data prompt/input policy;
5. a teen privacy review proving no private teen journals, Bridge content, safety-scan content, parent/teen protected data, or raw sensitive content is sent without a separate approved consent and safety boundary;
6. server-only secret storage and rotation notes;
7. fail-closed behavior for missing, invalid, or rate-limited credentials;
8. logging rules that avoid storing raw prompts, private teen content, or full model outputs unless explicitly approved;
9. model/provider fallback behavior, if any;
10. platform handoff notes for TikTok, Instagram, and Facebook outputs;
11. Playwright, unit, or integration evidence for any user-visible model route;
12. Founder Control Room tracking for setup state and exact-head evidence.

## Current status

- External app/surface name: `Playground`.
- Intended use: book-to-social content creation support.
- API surface: Meta Model API / responses endpoint.
- Example model: `muse-spark-1.1`.
- Repository configuration: documentation only.
- Runtime integration: not implemented.
- Publishing integration: not implemented.
- Production readiness: blocked pending reviewed implementation, server-side secret configuration, book-source policy, privacy boundary evidence, provider routing proof, platform handoff proof, and production verification.
