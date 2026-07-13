# Cloudflare Ownership

Last reviewed: 2026-07-13

## Canonical split

Se'kret Bip uses two distinct Cloudflare deployment targets, both deployed from `main` through Cloudflare native Git integration.

### `sekret-backend` — backend Worker

Verified by `wrangler.toml`, Worker identity tests, and Cloudflare Workers Builds:

- Worker name: `sekret-backend`
- Entry point: `worker/observed-index.ts`
- Production endpoint: `https://sekret-backend.mcgill-raylene.workers.dev`

Responsibilities:

- authenticated API routes;
- Supabase access and authorization checks;
- AI reply generation and canonical identity/style enforcement;
- transcription and TTS relay;
- Bridge summary generation;
- safety, push, and backend business logic;
- metadata-only telemetry.

Mobile and web clients call this backend through `EXPO_PUBLIC_BACKEND_URL`.

### `sekret-bip` — frontend Cloudflare Pages project

Canonical responsibilities:

- host the Expo web export;
- serve the custom domain;
- deliver frontend routes and static assets;
- bootstrap the React Native Web application;
- expose the public non-sensitive `release.json` commit marker.

Cloudflare Pages builds from `main` through the GitHub App. GitHub Actions does not run a second production upload.

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
    +--> Supabase
    +--> AI / voice providers
    +--> Bridge
    +--> Safety / push
```

## Ownership rules

- Frontend assets, Expo routes, and browser delivery belong to `sekret-bip`.
- API routes, secrets, database access, and business logic belong to `sekret-backend`.
- Service-role credentials, AI provider credentials, and server-only shared secrets must never enter the frontend bundle.
- Do not rename either target to match the custom domain or an old project name.
- Do not create a second token-based production deployment path alongside Cloudflare native Git integration.
- Verify repository configuration and deployed runtime evidence before changing ownership claims.

## Exact-release verification

Production verification requires independent evidence for the exact expected `main` commit:

1. `Workers Builds: sekret-backend` succeeds for that commit.
2. `https://sekretbip.net/release.json` reports the same commit SHA and branch.
3. `https://sekret-backend.mcgill-raylene.workers.dev/health` succeeds.
4. read-only production Playwright verifies the release marker and protected routes.
5. the evidence artifact is retained by GitHub Actions.

```bash
curl --fail https://sekret-backend.mcgill-raylene.workers.dev/health
curl --fail https://sekretbip.net/release.json
npm run test:e2e:production
```

A stale Pages check or historical deployment function is not sufficient proof of what is serving traffic.

## Retired release path

The Supabase `release-health` Edge Function is retired as a JWT-protected HTTP 410 endpoint. It must not be used as deployment authority, release telemetry, or proof of the current commit.

Canonical evidence comes from `.github/workflows/deploy-cloudflare.yml`, `scripts/verify-cloudflare-native-deploy.mjs`, the deployed release marker, Worker health, and production Playwright.

## Emergency manual fallback

Manual Worker or Pages upload is an administrator-only fallback documented in `DEPLOYMENT.md`. Any emergency use must record:

- exact source commit;
- command and target;
- credentials scope;
- validation performed;
- rollback;
- immediate repository reconciliation.
