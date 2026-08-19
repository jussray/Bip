# Cloudflare Ownership

Last reviewed: 2026-08-19

## Current release gate

[P0 #696](https://github.com/jussray/Sekret-Bip/issues/696) owns exact-production release truth. Repository topology below is intended authority and safety policy; it is not a substitute for live Cloudflare route/custom-domain readback for the same target.

## Canonical Cloudflare surfaces

Se’kret Bip must keep these Cloudflare identities separate:

1. `sekret-bip` — Cloudflare Pages frontend project;
2. `sekret-backend` — canonical API/backend Worker;
3. `sekret` — separate founder-confirmed active Worker whose exact live hostname/routes remain provider-readback authority;
4. `sekret-backend-alpha` — founder-gated non-production Worker.

`bip-mail` remains the legacy Worker retirement target after its Email Routing cutover is independently verified.

`sekret` is **not** a legacy/deletion target. Its existence must not be collapsed into `sekret-backend`, and automation must not remove its routes, domains, triggers, secrets, or bindings merely because `sekret-backend` is the canonical API Worker.

Dashboard existence alone does not assign a hostname. `config/cloudflare-targets.json`, repository runtime contracts, founder topology intent, and fresh Cloudflare provider readback must be reconciled before any provider mutation.

### `sekret-backend` — canonical backend Worker

Repository authority is defined by `wrangler.toml`, Worker identity tests, and the expected Cloudflare Workers Builds check:

- Worker name: `sekret-backend`;
- entry point: `worker/voice-entry.ts`;
- canonical API custom domain: `https://api.sekretbip.net`.

Responsibilities:

- authenticated API routes;
- Sekret and companion reply generation and canonical identity/style enforcement;
- transcription and TTS relay;
- Bridge summary generation;
- Supabase access and authorization checks;
- safety, push, and backend business logic;
- metadata-only telemetry;
- inbound Bip email processing through `worker/email-router.ts`.

`worker/voice-entry.ts` exports both `fetch()` and `email()`: it delegates ordinary HTTP traffic to `worker/observed-index.ts` and retains inbound email handling through `worker/email-router.ts`.

Mobile and web clients call the backend through `EXPO_PUBLIC_BACKEND_URL`.

### `sekret` — separate Worker authority

`sekret` is a distinct active Cloudflare Worker identity. Its exact current hostname, routes, custom domains, build trigger, secret names, bindings, and traffic are provider truth and must be retained in an evidence receipt before any mutation.

Until that provider readback exists:

- do not delete `sekret`;
- do not rename it to `sekret-backend`;
- do not move its routes or custom domains;
- do not treat it as a foreign Worker that may be detached automatically;
- do not infer its role from a historical Wrangler file alone.

If live readback later proves a route conflict with Pages or `sekret-backend`, repair only the exact conflicting binding after founder authorization and preserve an explicit rollback path.

### `sekret-bip` — Cloudflare Pages project

Canonical Pages responsibilities remain:

- host the Expo web export where Pages is the intended frontend authority;
- serve its attached custom domain(s);
- deliver frontend routes and static assets;
- bootstrap the React Native Web application;
- expose the public non-sensitive `/.well-known/sekret-release.json` commit marker.

The intended Pages Git build contract is:

```text
Build command: npm run build:web
Output directory: dist
```

A Pages build badge does not prove a custom domain is actually reaching Pages. #696 must verify the live release marker from the intended public hostname.

## Request and ownership invariants

The repository currently proves:

```text
api.sekretbip.net
    |
    v
Cloudflare Worker: sekret-backend
    |
    +--> ordinary HTTP via worker/observed-index.ts
    +--> Sekret reply / voice / transcription
    +--> Supabase
    +--> AI / voice providers
    +--> Bridge
    +--> Safety / push

Cloudflare Email Routing
    |
    v
sekret-backend email() handler
    |
    v
worker/email-router.ts --> verified destination
```

The live route/custom-domain mapping for `sekret` must be read from Cloudflare and recorded separately. Do not overwrite that unknown with the Pages or backend model.

## Ownership rules

- API routes, server secrets, database access, Sekret backend runtime behavior, and business logic belong to `sekret-backend`.
- `api.sekretbip.net` must continue to resolve to `sekret-backend`.
- `sekret` is a protected separate Worker identity until exact provider ownership is proven.
- Frontend Pages authority and Worker authority are separate; do not infer one from the other.
- Inbound Email Routing must target the `email()` handler exported by `worker/voice-entry.ts` after the controlled `bip-mail` cutover.
- `bip-mail` must not receive new production authority and may be retired only after exact provider proof.
- Do not delete any Worker until its routes, triggers, bindings, secrets, recent traffic, and rollback path have been inspected.
- Service-role credentials, AI provider credentials, and server-only shared secrets must never enter the frontend bundle.
- Do not create a second token-based production deployment path alongside reviewed provider integration.

The exact Worker preservation/retirement sequence is defined in `docs/CLOUDFLARE_WORKER_CONSOLIDATION.md`.

## Non-production Worker

`sekret-backend-alpha`, configured by `wrangler.alpha.toml`, is a distinct founder-gated non-production service. It must not be deleted or promoted into canonical production authority by cleanup automation.

## Exact-release verification

Production verification requires independent evidence for the exact expected `main` commit:

1. exact current repository authority;
2. canonical frontend/release marker from the intended public frontend hostname;
3. canonical `sekret-backend` release identity and health from `api.sekretbip.net`;
4. retained provider route/custom-domain evidence for `sekret` when its binding affects the release path;
5. read-only production Playwright against the exact release;
6. controlled backend/voice/email journeys where applicable;
7. retained evidence in GitHub Actions or Founder Control Room.

A stale Pages check, a Worker deployment badge, a historical route statement, or an Access interception is not proof of what currently serves traffic.

## Retired release path

The Supabase `release-health` Edge Function is retired as a JWT-protected HTTP 410 endpoint. It must not be used as deployment authority, release telemetry, or proof of the current commit.

Canonical evidence comes from `.github/workflows/deploy-cloudflare.yml`, provider readback, the deployed release marker, Worker health, production Playwright, and the evidence recorded in Founder Control Room.

## Emergency manual fallback

Manual Worker, route, domain, or Pages mutation is administrator-only fallback. Any emergency use must record:

- exact source commit;
- exact Worker/project and hostname;
- command or provider action;
- credentials scope;
- before/after provider readback;
- validation performed;
- rollback;
- immediate repository reconciliation.
