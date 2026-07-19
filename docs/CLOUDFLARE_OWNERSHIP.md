# Cloudflare Ownership

Last reviewed: 2026-07-18

## Canonical production split

Se'kret Bip has two canonical Cloudflare production deployment targets, both sourced from `main`:

1. `sekret-bip` — Cloudflare Pages frontend;
2. `sekret-backend` — the single production Worker.

The Cloudflare dashboard may still show four production-named items during cleanup:

- `sekret-bip` — canonical Pages project;
- `sekret-backend` — canonical Worker;
- `bip-mail` — legacy Worker pending Email Routing cutover and retirement;
- `sekret` — legacy Worker pending route, binding, secret, and traffic audit and retirement.

Dashboard existence does not create architectural authority. `config/cloudflare-targets.json` and the repository runtime define the intended target map.

### `sekret-backend` — single production Worker

Verified by `wrangler.toml`, Worker identity tests, and Cloudflare Workers Builds:

- Worker name: `sekret-backend`;
- entry point: `worker/observed-index.ts`;
- production endpoint: `https://sekret-backend.mcgill-raylene.workers.dev`.

Responsibilities:

- authenticated API routes;
- Sekret and companion reply generation and canonical identity/style enforcement;
- transcription and TTS relay;
- Bridge summary generation;
- Supabase access and authorization checks;
- safety, push, and backend business logic;
- metadata-only telemetry;
- inbound Bip email processing through `worker/email-router.ts`.

`worker/observed-index.ts` exports both `fetch()` and `email()`, so a second production Worker is not required for Sekret API work or incoming mail.

Mobile and web clients call this backend through `EXPO_PUBLIC_BACKEND_URL`.

### `sekret-bip` — frontend Cloudflare Pages project

Canonical responsibilities:

- host the Expo web export;
- serve the custom domain;
- deliver frontend routes and static assets;
- bootstrap the React Native Web application;
- expose the public non-sensitive `release.json` commit marker.

Cloudflare Pages builds from `main` through the GitHub App with:

```text
Build command: npm run build:web
Output directory: dist
```

GitHub Actions does not run a second production upload.

## Request flow

```text
sekretbip.net
    |
    v
Cloudflare Pages project: sekret-bip
    |
    v
Expo web frontend + release.json
    |
    v
Cloudflare Worker: sekret-backend
    |
    +--> Sekret reply / voice / transcription
    +--> Supabase
    +--> AI / voice providers
    +--> Bridge
    +--> Safety / push

Cloudflare Email Routing
    |
    v
Cloudflare Worker email() handler: sekret-backend
    |
    v
worker/email-router.ts --> verified destination
```

## Ownership rules

- Frontend assets, Expo routes, and browser delivery belong to `sekret-bip`.
- API routes, secrets, database access, Sekret runtime behavior, and business logic belong to `sekret-backend`.
- Inbound Email Routing must target the `email()` handler exported by `sekret-backend`.
- `bip-mail` and `sekret` must not receive new code, routes, triggers, secrets, or bindings.
- Do not delete a legacy Worker until its routes, triggers, bindings, secrets, recent traffic, and rollback path have been inspected.
- Service-role credentials, AI provider credentials, and server-only shared secrets must never enter the frontend bundle.
- Do not create a second token-based production deployment path alongside Cloudflare native Git integration.

The exact retirement sequence is defined in `docs/CLOUDFLARE_WORKER_CONSOLIDATION.md`.

## Non-production Worker

`sekret-backend-alpha`, configured by `wrangler.alpha.toml`, is a distinct founder-gated non-production service. It is not one of the legacy production Workers and must not be deleted as part of this cleanup.

## Exact-release verification

Production verification requires independent evidence for the exact expected `main` commit:

1. `Workers Builds: sekret-backend` succeeds for that commit.
2. `https://sekretbip.net/release.json` reports the same commit SHA and branch.
3. `https://sekret-backend.mcgill-raylene.workers.dev/health` succeeds.
4. read-only production Playwright verifies the release marker and protected routes.
5. controlled requests verify Sekret reply, voice, and transcription through `sekret-backend`.
6. controlled messages verify every supported email alias through `sekret-backend`.
7. the evidence artifact is retained by GitHub Actions or Founder Control Room.

```bash
curl --fail https://sekret-backend.mcgill-raylene.workers.dev/health
curl --fail https://sekretbip.net/release.json
npm run test:e2e:production
```

A stale Pages check, an idle legacy Worker, or a historical deployment function is not proof of what is serving traffic.

## Retired release path

The Supabase `release-health` Edge Function is retired as a JWT-protected HTTP 410 endpoint. It must not be used as deployment authority, release telemetry, or proof of the current commit.

Canonical evidence comes from `.github/workflows/deploy-cloudflare.yml`, `scripts/verify-cloudflare-native-deploy.mjs`, the deployed release marker, Worker health, production Playwright, and the consolidation evidence recorded in Founder Control Room.

## Emergency manual fallback

Manual Worker or Pages upload is an administrator-only fallback documented in `DEPLOYMENT.md`. Any emergency use must record:

- exact source commit;
- command and target;
- credentials scope;
- validation performed;
- rollback;
- immediate repository reconciliation.
