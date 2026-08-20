# Cloudflare Ownership

Last reviewed: 2026-08-20

## Current release gate

[P0 #696](https://github.com/jussray/Sekret-Bip/issues/696) owns exact-production release truth. Repository topology below is intended authority and safety policy; it is not a substitute for live Cloudflare route/custom-domain readback for the same target.

## Canonical Cloudflare surfaces

Se’kret Bip keeps these Cloudflare identities distinct:

1. `sekret-bip` — Cloudflare Pages frontend project;
2. `sekret-backend` — canonical public API/front-door and privileged platform Worker;
3. `sekret` — founder-confirmed active companion Worker lineage; the founder confirms it still holds companion API responsibility, while its exact hostname/routes/custom domains remain provider-readback authority;
4. `sekret-backend-alpha` — founder-gated non-production Worker.

`bip-mail` remains the retired legacy email Worker. `sekret` is **not** a legacy/deletion target.

Dashboard existence or historical Wrangler names do not by themselves assign a hostname. Provider truth, repository contracts, and founder topology intent must be reconciled before provider mutation.

## Current checked-in routing versus purpose boundary

The repository currently keeps the production client single-homed:

```text
web/native client
    |
    v
https://api.sekretbip.net
    |
    v
sekret-backend
```

`.env.production` and EAS production profiles point `EXPO_PUBLIC_BACKEND_URL` to `https://api.sekretbip.net`. `wrangler.toml` currently attaches that custom domain to `sekret-backend`.

That is the **current repository routing contract**, not a declaration that every backend responsibility belongs in one Worker forever.

The code has a natural companion boundary:

- `/api/sekret/reply`;
- `/api/sekret/voice`;
- `/api/sekret/transcribe`;
- companion identity/style/safety output enforcement;
- AI and voice-provider execution;
- companion-scoped metadata telemetry.

The founder confirms that `sekret` remains the companion API Worker lineage. Historical Cloudflare-generated rename PRs also show `sekret` repeatedly targeted the same `worker/observed-index.ts` backend lineage before `sekret-backend` became the repository’s canonical public Worker identity.

## Preferred runtime partition

The preferred architecture preserves one public client API while restoring a clean Worker purpose split:

```text
client
  |
  v
api.sekretbip.net
  |
  v
sekret-backend  -- public ingress / platform authority
  |
  +-- /api/bridge/* + privileged data + email + platform operations
  |
  +-- /api/sekret/*
          |
          v
      Service Binding
          |
          v
        sekret  -- companion execution authority
```

Cloudflare Service Bindings are the preferred Worker-to-Worker boundary because they allow `sekret-backend` to forward a request to `sekret` without introducing a second public URL or requiring the app to select a Worker.

This target partition is **not yet a production cutover claim**. No service binding, route move, secret move, or traffic mutation is proven deployed merely because this document describes the intended boundary.

## `sekret` — companion execution authority

Best-fit responsibilities:

- companion reply generation;
- companion voice synthesis and transcription;
- companion runtime style/identity enforcement;
- companion safety-response logic that belongs directly to reply generation;
- AI/voice provider selection and provider-specific secrets;
- companion request telemetry that does not require broad database privilege.

`sekret` should not acquire `SUPABASE_SERVICE_ROLE_KEY` merely to preserve existing audit persistence. The current assurance layer writes metadata directly to Supabase with that key; the split must replace that with a narrow internal persistence path, backend-owned ingestion, or another least-privilege mechanism before the service-role credential is removed from the companion path.

The companion Worker may verify user identity using the existing Supabase JWT/JWKS approach and should retain request protection appropriate to its invocation path. If it becomes service-binding-only, public routing and `workers.dev` exposure should be reviewed separately rather than assumed.

## `sekret-backend` — public ingress and privileged platform authority

Current repository authority:

- Worker name: `sekret-backend`;
- entry point: `worker/voice-entry.ts`;
- canonical API custom domain: `https://api.sekretbip.net`.

Best-fit responsibilities after the companion split:

- stable public API hostname and ingress policy;
- request authentication, CORS, release identity, and front-door rate limiting where those controls are shared;
- Bridge summary generation and privacy/data authorization;
- server-side Supabase service-role operations;
- inbound Bip email through `worker/email-router.ts`;
- privileged operational/business logic that is not part of the companion inference contract;
- narrow ingestion of companion assurance metadata if that is the selected least-privilege design.

The existing `worker/bridge-summary.ts` is a clear privileged-data boundary: it reads teen-selected source material through server-owned storage access, validates parent-sharing privacy, and writes summary state. It should remain outside the general companion Worker.

The email handler is also platform-owned and must stay outside the companion runtime.

## Safety and push clarification

Do not use the phrase “safety and push” as proof that `sekret-backend` currently exposes a public push route.

- companion safety-response logic is embedded in the companion reply runtime;
- `worker/push-notifications.ts` exists as a privileged helper using Supabase service-role access, but current source search does not show it wired into the public Worker router;
- Supabase Edge Functions also own parts of safety/push behavior.

Any future push route belongs with the privileged platform plane unless a separately reviewed contract proves otherwise.

## `sekret-bip` — Cloudflare Pages project

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

## Provider readback required for `sekret`

Before any binding or route mutation, retain a provider receipt for `sekret` covering:

- current routes and custom domains;
- `workers.dev` state;
- service bindings;
- queues, cron, Durable Objects, KV, D1, R2, Analytics Engine, and other bindings;
- environment-variable and secret **names only**;
- Git repository/branch connection and build trigger policy;
- current immutable script/version identity;
- recent request volume and errors;
- any callers that depend on its present public address.

Founder confirmation establishes purpose. Provider readback establishes the exact traffic/binding state needed for a safe cutover.

## Ownership rules

- Product clients keep one stable production API origin unless a separately approved migration changes that contract.
- Companion API behavior belongs conceptually to `sekret`; current client routing through `sekret-backend` remains valid until the internal delegation cutover is proven.
- Bridge, privileged Supabase operations, email, and other platform authority belong to `sekret-backend`.
- `api.sekretbip.net` remains on `sekret-backend` during the preferred service-binding migration.
- Do not duplicate `SUPABASE_SERVICE_ROLE_KEY` into `sekret` to make the split easier.
- `sekret` must not be deleted, renamed, or detached before its provider receipt and rollback path are retained.
- Frontend Pages authority and Worker authority are separate.
- Inbound Email Routing targets the backend `email()` handler, not the companion Worker.
- `bip-mail` must not regain production authority.
- Service-role credentials, AI provider credentials, and server-only shared secrets must never enter the frontend bundle.
- Do not create a second token-based production deployment path alongside reviewed provider integration.

## Exact-release verification

While routing remains consolidated, production verification must continue to prove the exact `sekret-backend` release at `api.sekretbip.net` plus the applicable companion journeys.

After an approved service-binding cutover, release proof must additionally bind:

1. the exact public `sekret-backend` release;
2. the exact `sekret` companion release/version invoked by the service binding;
3. the provider binding between them;
4. production companion reply/voice/transcription journeys;
5. Bridge/email/platform journeys on the backend where applicable;
6. Supabase and Playwright evidence for the same release packet.

A stale Pages check, Worker deployment badge, historical route statement, or Access interception is not current production proof.

## Emergency manual fallback

Manual Worker, route, domain, service-binding, or Pages mutation is administrator-only fallback. Any emergency use must record the exact source commit, Worker/project and hostname, provider action, credential scope, before/after readback, validation, rollback, and immediate repository reconciliation.
